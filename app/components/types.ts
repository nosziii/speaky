export type User = { id: string; name: string; role: "parent" | "child" };
export type Message = {
  id: number;
  sender_id: string;
  sender_name: string;
  kind: "text" | "speech";
  text: string;
  created_at: string;
};
export type Conversation = { id: string; kind: "family" | "direct"; household_id: string | null; title: string };
export type FamilyMember = { id: string; username: string; name: string; role: "parent" | "child"; is_admin: boolean };
export type Family = { id: string; name: string; allow_child_chat: boolean; is_admin: boolean; members: FamilyMember[] };
export type Tab = "chat" | "learn" | "family" | "settings";
