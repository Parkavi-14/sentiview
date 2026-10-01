export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  text: string;
}

