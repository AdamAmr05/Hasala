export enum ChatSender {
  USER = 'user',
  AI = 'model',
}

export interface ToolCall {
  name: string;
  args?: Record<string, unknown>;
}

export interface ChatMessage {
  sender: ChatSender;
  text: string;
}

export interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
}

