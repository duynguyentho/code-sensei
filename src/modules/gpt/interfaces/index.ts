import { GptUsage } from './usage';

export type GptModel =
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-16k'
  | 'gpt-4'
  | 'gpt-4o'
  | 'gpt-4-turbo'
  | 'gpt-4.5-preview';

export interface GptMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GptRequestPayload {
  model: GptModel;
  messages: GptMessage[];
  n?: number;
}

export interface GptResponseBody {
  completion: string;
  model: string; // I decided to change it to string because the
  index: number;
  choices: GptResponseBodyChoice[];
  created: number;
  usage: GptUsage;
}

export interface GptResponseBodyChoice {
  message: GptMessage;
  index: number;
  finish_reason: string;
  logprobs: null;
}
