export type GptModel =
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-16k'
  | 'gpt-4'
  | 'gpt-4o'
  | 'gpt-4-turbo';

export interface GptMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GptRequestPayload {
  model: GptModel;
  messages: GptMessage[];
  n?: number;
}
