export type Role = 'user' | 'model' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

export interface ModelConfig {
  modelName: string;
  systemInstruction: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
}

export interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  config: ModelConfig;
}