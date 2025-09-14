import Anthropic from '@anthropic-ai/sdk';
import { Agent, AgentConfig } from '@brewmaster/shared-types';
import config from '../config';
import logger from '../utils/logger';

export class ClaudeIntegration {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || config.anthropicApiKey,
    });
  }

  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    agentConfig?: AgentConfig,
    context?: any
  ): Promise<{
    content: string;
    tokensUsed: number;
    model: string;
  }> {
    try {
      const messages: Anthropic.MessageParam[] = [
        {
          role: 'user',
          content: this.buildPrompt(userPrompt, context),
        },
      ];

      const response = await this.client.messages.create({
        model: agentConfig?.model || config.agents.defaultModel,
        max_tokens: agentConfig?.maxTokens || config.agents.defaultMaxTokens,
        temperature: agentConfig?.temperature || config.agents.defaultTemperature,
        system: systemPrompt,
        messages,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return {
        content: content.text,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        model: response.model,
      };
    } catch (error) {
      logger.error('Claude API Error:', error);
      throw new Error(`Failed to get response from Claude: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async streamResponse(
    systemPrompt: string,
    userPrompt: string,
    agentConfig?: AgentConfig,
    context?: any,
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    tokensUsed: number;
    model: string;
  }> {
    try {
      const messages: Anthropic.MessageParam[] = [
        {
          role: 'user',
          content: this.buildPrompt(userPrompt, context),
        },
      ];

      const stream = await this.client.messages.create({
        model: agentConfig?.model || config.agents.defaultModel,
        max_tokens: agentConfig?.maxTokens || config.agents.defaultMaxTokens,
        temperature: agentConfig?.temperature || config.agents.defaultTemperature,
        system: systemPrompt,
        messages,
        stream: true,
      });

      let fullContent = '';
      let tokensUsed = 0;
      let model = '';

      for await (const chunk of stream) {
        if (chunk.type === 'message_start') {
          tokensUsed = chunk.message.usage.input_tokens;
          model = chunk.message.model;
        } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text;
          fullContent += text;
          onChunk?.(text);
        } else if (chunk.type === 'message_delta' && chunk.usage) {
          tokensUsed += chunk.usage.output_tokens;
        }
      }

      return {
        content: fullContent,
        tokensUsed,
        model,
      };
    } catch (error) {
      logger.error('Claude Streaming API Error:', error);
      throw new Error(`Failed to stream response from Claude: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(prompt: string, context?: any): string {
    if (!context) {
      return prompt;
    }

    return `
Context Information:
${JSON.stringify(context, null, 2)}

Task:
${prompt}

Please provide a detailed, actionable response. Format your response as JSON when returning structured data.
`;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }],
      });
      return true;
    } catch (error) {
      logger.error('Claude API key validation failed:', error);
      return false;
    }
  }
}