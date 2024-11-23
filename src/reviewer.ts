import OpenAI from 'openai'
import * as core from '@actions/core'

const system = `You are a knowledgeable and empathetic code reviewer. Here are your core traits and how you behave:

PERSONALITY & VALUES:
- You are constructive and encouraging while maintaining high standards for code quality
- You believe in education over criticism - every review is a learning opportunity
- You combine warmth with technical precision
- You deeply respect the time and effort developers invest in their code

REVIEW APPROACH:
1. Always begin reviews by acknowledging positive aspects of the code
2. When suggesting changes:
   - Explain WHY something should be changed
   - Provide specific examples of the recommended approach
   - Link to relevant documentation when applicable
3. Maintain consistent review standards regardless of the developer's experience level
4. Consider practical constraints like deadlines and project context

COMMUNICATION STYLE:
- Use clear, respectful language that focuses on the code, not the person
- Frame feedback as suggestions rather than commands ("We could improve this by..." rather than "This is wrong")
- Avoid words like "obviously," "clearly," or "simply"
- Balance critique with genuine appreciation

KEY PHRASES TO USE:
- "I see what you're trying to achieve here..."
- "Here's an alternative approach that might help..."
- "I particularly like how you handled..."
- "Have you considered..."
- "One way to enhance this could be..."

PHRASES TO AVOID:
- "This is obviously wrong"
- "Who wrote this?"
- "This makes no sense"
- "You should know better"

When reviewing code, you should:
1. First acknowledge positive aspects
2. Address architectural/design concerns
3. Point out potential performance issues
4. Suggest security improvements
5. Note maintainability considerations
6. Always use the Conventional Comments standard for writing your comments
`

const instructionPrompt = `Here are the instructions on how to perform your task:

1. You will be given a git diff on which you have to perform a Code Review
2. Read the diff and understand the code.
3. Think in a step by step fashion and determine whether you need to add some input on a specific line of the diff. In case you need to add a comment on a specific line then:
    - Get the filename on which the code resides.
    - Calculate the position (line number) on which you need to add the comment. The position value equals the number of lines down from the first \"@@\" hunk header in the file you want to add a comment.
    - Generate your comment and use the [conventional: comments](https://conventionalcomments.org/) notation.
    - Write the body of your comment in Github-Flavored Markdown
    - Your comment MUST NOT be an HTML comment and MUST NOT start with <!--
4. Repeat step 3 as many times as you need.
5. When you don't have any other comments to add directly to the code, re-read your comments in order to come up with a conclusion. This conclusion can be:
    - APPROVED: The code does not have any major or minor issues that require resolving
    - COMMENT: The code may have some minor issues that may require resolving by the author.
    - REQUEST_CHANGES: The code has major and/or minor issues that require resolving by the author.
6. Generate your overall comment for the pull request and justify your conclusion.
    - APPROVED: The code looks good to you and has your approval
    - COMMENT: The code is good but still requires some work.
    - REQUEST_CHANGES: The code contains issues that must be resolved prior to acceptance.
7. The overall comment goes to the PR so when you need to tell the author that there are things they have to consider AND you have commented on particular lines of code, tell them that your comments can be found inline on the code.

Your output must be given in the schema specified. Do not add any other output besides this. 
Your comments must always follow the conventional: comments notation.
`

export class Reviewer {
  private readonly client: OpenAI

  constructor(private readonly apiKey: string) {
    this.client = new OpenAI({ apiKey: apiKey })
  }

  async generateCodeReview(data: any): Promise<any> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: system
        },
        {
          role: 'user',
          content: instructionPrompt
        },
        {
          role: 'assistant',
          content: 'I have understood your instructions'
        },
        {
          role: 'user',
          content: `You are about to perform a code review on a PR titled "${data.title}". Here are the author's comments:\n\n ${data.body}\n\nYour response must be in the stated JSON Schema. Do not add any other text other than the requested JSON.  Are you ready to get the diff and review it?`
        },
        {
          role: 'assistant',
          content:
            'Yes, I am ready to perform a review, please supply me with the diff.'
        },
        {
          role: 'user',
          content: `${data.diff}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'review_schema',
          schema: {
            type: 'object',
            properties: {
              approval_status: {
                description:
                  'Whether the AI requests changes on the pull request, leaves comments without explicitly stating approval or refusal, or approves the pull request',
                type: 'string',
                enum: ['APPROVE', 'COMMENT', 'REQUEST_CHANGES']
              },
              comment: {
                description:
                  'An overall comment on the pull request in markdown format',
                type: 'string'
              },
              specifics: {
                description:
                  'Specific comments or suggestions targeted on a line of code or a block of code on the Pull Request',
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    path: {
                      description:
                        'The relative path to the file that necessitates a review comment.',
                      type: 'string'
                    },
                    position: {
                      description:
                        'The position in the diff where you want to add a review comment. Note this value is not the same as the line number in the file. The position value equals the number of lines down from the first "@@" hunk header in the file you want to add a comment. The line just below the "@@" line is position 1, the next line is position 2, and so on. The position in the diff continues to increase through lines of whitespace and additional hunks until the beginning of a new file.',
                      type: 'number'
                    },
                    body: {
                      description:
                        'The text of the review comment. It must always be in GitHub Flavored Markdown. Never start the comment with <!--',
                      type: 'string'
                    }
                  },
                  required: ['path', 'position', 'body']
                }
              }
            },
            required: ['comment', 'approval_status']
          }
        }
      }
    })

    core.debug(`Input Tokens: ${response.usage?.prompt_tokens}`)
    core.debug(`Output Tokens: ${response.usage?.completion_tokens}`)

    return response.choices[0].message.content
  }
}
