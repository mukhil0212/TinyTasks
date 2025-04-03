declare module 'groq' {
  export interface GroqConfig {
    apiKey: string;
  }

  export interface TranscriptionSegment {
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }

  export interface TranscriptionResponse {
    text: string;
    segments?: TranscriptionSegment[];
  }

  export interface ChatCompletionMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }

  export interface ChatCompletionResponse {
    choices: {
      message: {
        content: string | null;
      };
    }[];
  }

  export default class Groq {
    constructor(config: GroqConfig);

    audio: {
      transcriptions: {
        create(params: {
          file: File;
          model: string;
          language?: string;
          response_format?: 'json' | 'text' | 'verbose_json';
          temperature?: number;
          prompt?: string;
          timestamp_granularities?: ('word' | 'segment')[];
        }): Promise<TranscriptionResponse>;
      };
    };

    chat: {
      completions: {
        create(params: {
          model: string;
          messages: ChatCompletionMessage[];
          temperature?: number;
        }): Promise<ChatCompletionResponse>;
      };
    };
  }
}
