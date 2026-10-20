export type Forecast = {
  month: string;
  income?: number;
  expenses?: number;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  time: string;
};
