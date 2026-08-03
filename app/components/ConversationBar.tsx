"use client";

import { FormEvent, useState } from "react";
import type { Conversation, User } from "./types";
import { useLanguage } from "./i18n";

export function ConversationBar({ user, conversations, selectedId, onSelect, onCreated }: { user: User; conversations: Conversation[]; selectedId: string | null; onSelect: (id: string) => void; onCreated: (conversation: Conversation) => void }) {
  const { text } = useLanguage();
  const [username, setUsername] = useState(""); const [open, setOpen] = useState(false); const [error, setError] = useState("");
  async function create(event: FormEvent) {
    event.preventDefault(); setError("");
    const response = await fetch("/api/conversations/direct", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ username }) });
    const data = await response.json();
    if (!response.ok) { setError(text.conversation.failed); return; }
    onCreated(data); setUsername(""); setOpen(false);
  }
  return <div className="conversation-bar"><label>{text.conversation.label}<select value={selectedId || ""} onChange={e=>onSelect(e.target.value)}>{conversations.map(item=><option value={item.id} key={item.id}>{item.kind==="family"?"⌂ ":"↔ "}{item.title}</option>)}</select></label>{user.role==="parent"&&<button onClick={()=>setOpen(value=>!value)}>{text.conversation.otherParent}</button>}{open&&<form onSubmit={create}><input value={username} onChange={e=>setUsername(e.target.value)} placeholder={text.conversation.parentUsername} required/><button>{text.conversation.start}</button>{error&&<small>{error}</small>}</form>}</div>;
}
