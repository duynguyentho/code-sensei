import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MAX_RETRIES_ATTEMPTS } from '../../constants';
import { GptModel, GptRequestPayload } from './interfaces';
import * as process from 'process';

@Injectable()
export class GptService {
  constructor(private readonly configService: ConfigService) {}
  private logger: Logger = new Logger(GptService.name);

  getAuthenticationHeaders = () => {
    return {
      Authorization: `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    };
  };

  getCompetitionsUrl = (): string => {
    return `https://api.openai.com/v1/chat/completions`;
  };

  getCurrentGptModel(): GptModel {
    return 'gpt-3.5-turbo';
  }

  async getChatCompetitionPrompt(
    payload: GptRequestPayload,
    retries: boolean,
  ): Promise<any> {
    let currentRetries = 0;
    while (true) {
      try {
        const response = await axios.post(this.getCompetitionsUrl(), payload, {
          headers: this.getAuthenticationHeaders(),
        });

        if (response.data) {
          return response.data;
        }
      } catch (e) {
        currentRetries++;
        if (currentRetries >= MAX_RETRIES_ATTEMPTS || retries === false) {
          throw e;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  async askGpt(data: any): Promise<any> {
    console.log('Asking GPT .....');
    try {
      const payload: GptRequestPayload = {
        model: this.getCurrentGptModel(),
        messages: [
          {
            role: 'user',
            content: data.message,
          },
        ],
        n: 5,
      };
      const result = await this.getChatCompetitionPrompt(payload, true);
      console.log('Received: ', result);
      if (result?.choices) {
        this.logger.log(`Token usage: ${result.usage.total_tokens}`);
        return result?.choices.map((choice: any) => choice.message.content);
      }
    } catch (e) {
      console.error('Error asking GPT:', e);
    }
  }
}
