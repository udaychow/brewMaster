import Anthropic from '@anthropic-ai/sdk';

export class ClaudeIntegration {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey: apiKey
    });
  }

  async complete(prompt: string, context?: any): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: this.buildPrompt(prompt, context)
          }
        ]
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new Error('Failed to get response from Claude');
    }
  }

  private buildPrompt(prompt: string, context?: any): string {
    let fullPrompt = prompt;
    
    if (context) {
      fullPrompt = `
Context: ${JSON.stringify(context, null, 2)}

${prompt}

Please provide a detailed, actionable response in JSON format where appropriate.
`;
    }

    return fullPrompt;
  }
}
