import * as core from '@actions/core'
import * as github from '@actions/github'
import { readFile } from 'node:fs/promises'
import { Reviewer } from './reviewer'

export class Engine {
  private readonly token: string
  private readonly apiKey: string
  private pullRequestNumber: number | null = null
  private readonly organization: string
  private readonly repository: string

  constructor() {
    this.token = core.getInput('github-token', { required: true })
    this.apiKey = core.getInput('openai-api-key', { required: true })

    const org = core.getInput('organization', { required: false })
    this.organization = org ? org : github.context.repo.owner
    const repo = core.getInput('repository', { required: false })
    this.repository = repo ? repo : github.context.repo.repo
  }

  async process(): Promise<void> {
    if (this.wasTriggeredByPullRequest() === false) {
      core.setFailed('This action can only be triggered by a pull request.')
      return
    }

    const octokit = github.getOctokit(this.token)

    this.pullRequestNumber = await this.getPullRequestNumber()
    core.info(
      ` 🔍 Fetching information for ${this.organization}/${this.repository}#${this.pullRequestNumber}`
    )

    const pr = await octokit.rest.pulls.get({
      owner: this.organization,
      repo: this.repository,
      pull_number: this.pullRequestNumber
    })

    const title = pr.data.title
    const body = pr.data.body

    const { data: diff } = await octokit.request(
      `/repos/${this.organization}/${this.repository}/pulls/${this.pullRequestNumber}`,
      {
        headers: {
          accept: 'application/vnd.github.v3.diff'
        }
      }
    )

    core.debug(`Diff received: ${diff.length} bytes`)

    const reviewer = new Reviewer(this.apiKey)

    const review = JSON.parse(
      await reviewer.generateCodeReview({
        title: title,
        body: body,
        diff: diff
      })
    )

    core.debug('Pull request has been reviewed, adding comments')

    const reviewResponse = await octokit.rest.pulls.createReview({
      owner: this.organization,
      repo: this.repository,
      pull_number: this.pullRequestNumber,
      body: review.comment,
      event: 'COMMENT',
      comments: review.specifics
    })

    if (reviewResponse.status !== 200) {
      core.setFailed(
        `"An error occured while submitting code review: ${reviewResponse.status}"`
      )
    }

    core.info('The review has been submitted!')
  }

  private wasTriggeredByPullRequest(): boolean {
    return (
      process.env.GITHUB_EVENT_NAME === 'pull_request' ||
      process.env.GITHUB_EVENT_NAME === 'pull_request_target'
    )
  }

  private async getPullRequestNumber(): Promise<number> {
    const path = process.env.GITHUB_EVENT_PATH

    if (!path) {
      core.setFailed('Unable to find Event Path')
      return -1
    }

    try {
      const eventData = JSON.parse(await readFile(path, { encoding: 'utf-8' }))

      if (eventData.pull_request && eventData.pull_request.number) {
        return eventData.pull_request.number as number
      }

      core.setFailed('Unable to find the pull request number')
      return -1
    } catch (error) {
      core.setFailed(`An error occured: ${error}`)
      return -1
    }
  }
}
