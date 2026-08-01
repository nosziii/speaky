export type User = { id: string; name: string; role: "parent" | "child" };
export type Message = {
  id: number;
  sender_id: string;
  sender_name: string;
  kind: "text" | "speech";
  text: string;
  created_at: string;
};
export type Tab = "chat" | "learn" | "settings";
