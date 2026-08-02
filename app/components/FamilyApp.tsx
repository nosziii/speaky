"use client";

import { useEffect, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { ConversationBar } from "./ConversationBar";
import { FamilyPanel } from "./FamilyPanel";
import { LearnPanel } from "./LearnPanel";
import { LoginCard } from "./LoginCard";
import { SettingsPanel } from "./SettingsPanel";
import { useFamilySocket } from "./useFamilySocket";
import type { Conversation, Tab, User } from "./types";

export function FamilyApp() {
  const [user,setUser]=useState<User|null>(null); const [loading,setLoading]=useState(true); const [tab,setTab]=useState<Tab>("chat");
  const [conversations,setConversations]=useState<Conversation[]>([]); const [selectedId,setSelectedId]=useState<string|null>(null);
  useEffect(()=>{fetch("/api/me").then(r=>r.ok?r.json():null).then(setUser).finally(()=>setLoading(false));},[]);
  useEffect(()=>{if(!user)return;fetch("/api/conversations").then(r=>r.json()).then((items:Conversation[])=>{setConversations(items);setSelectedId(current=>current||items[0]?.id||null);});},[user]);
  const socket=useFamilySocket(user,selectedId);
  async function logout(){await fetch("/api/logout",{method:"POST"});setUser(null);}
  function created(item:Conversation){setConversations(current=>current.some(c=>c.id===item.id)?current:[...current,item]);setSelectedId(item.id);}
  if(loading)return <main className="loading-page"><div className="brand-mark"><span>i</span></div><p>Mindjárt itt vagyunk…</p></main>;
  if(!user)return <LoginCard onLogin={setUser}/>;
  const selected=conversations.find(item=>item.id===selectedId);
  return <main className="app-shell"><header className="topbar"><div className="mini-brand"><div className="brand-mark"><span>i</span></div><strong>Itt vagyok.</strong></div><nav><button className={tab==="chat"?"active":""} onClick={()=>setTab("chat")}>💬 Beszélgetés</button><button className={tab==="learn"?"active":""} onClick={()=>setTab("learn")}>✏️ Betűjáték</button>{user.role==="parent"&&<button className={tab==="family"?"active":""} onClick={()=>setTab("family")}>⌂ Család</button>}<button className={tab==="settings"?"active":""} onClick={()=>setTab("settings")}>⚙️ Jelszó</button></nav><button className="logout" onClick={logout}>Kilépés</button></header>{tab==="chat"?<><ConversationBar user={user} conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} onCreated={created}/><ChatPanel user={user} conversationTitle={selected?.title||"Beszélgetés"} {...socket}/></>:tab==="learn"?<LearnPanel/>:tab==="family"?<FamilyPanel/>:<SettingsPanel/>}</main>;
}
