# Renegade Diff

<p align="center">
  <img src="./doc/renegade-diff.png" alt="Where code meets its match">
</p>

> [!WARNING]  
> 
> This GitHub Action utilizes the OpenAI API to perform code reviews on Pull Requests. As part of its functionality, it transfers the code contained in the Pull Request to OpenAI systems to generate completion responses.
> 
> ## Important Notes
> 1. **Data Privacy**: The code and related context provided to the API may be temporarily processed and stored by OpenAI in accordance with their data usage policies. Refer to [OpenAI's API data usage policy](https://openai.com/policies/api-data-usage-policies) for more information.
> 2. **Confidentiality**: Avoid using this Action for sensitive or proprietary code unless you are comfortable with OpenAI's handling of data. OpenAI has stated that input data is not retained for training unless explicitly allowed by the user, but you should verify this information directly with OpenAI.
> 3. **Responsibility**: By using this Action, you acknowledge and accept the potential privacy risks associated with transferring code to a third-party service (OpenAI) for processing. Ensure you comply with your organization's data security policies and guidelines before using this tool.
>
> If you have any concerns regarding data privacy or security, consider conducting manual code reviews instead of using this automated Action.


## Overview

**Renegade Diff** is an Github Action that conducts ruthless code reviews and analyses pull requests with the precision of a digital vigilante that is powered by Generative AI.

## Usage

```yaml
- uses: mistericy/renegade-diff
  with:
    openai-api-key: ${{ secrets.OPEN_AI_API_KEY }}
```

