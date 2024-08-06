import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MAX_RETRIES_ATTEMPTS, RETRY_DELAY } from '../../constants';
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
    return 'gpt-4o';
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
        this.logger.error(e);

        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
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


        return result?.choices.map((choice: any) => {
          console.log('Choices:', choice.message.content);
          return choice.message.content;
        });
      }
    } catch (e) {
      console.error('Error asking GPT:', e);
    }
  }
}
