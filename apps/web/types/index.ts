export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Rule = {
  id: string;
  createdAt: string;
  text: string;
  title?: string;
  ruleType?: string;
  isActive?: boolean;
};
