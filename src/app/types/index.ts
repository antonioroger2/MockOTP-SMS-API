export type Message = {
  id: string;
  text: string;
  timestamp: number;
};

export type MessageDocument = {
  messages: Message[];
};
