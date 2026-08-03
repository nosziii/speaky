"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Family } from "./types";
import { useLanguage } from "./i18n";

export function FamilyPanel() {
  const { text } = useLanguage();
  const [family, setFamily] = useState<Family | null>(null); const [role, setRole] = useState<"child"|"parent">("child");
  const [name,setName]=useState(""); const [username,setUsername]=useState(""); const [password,setPassword]=useState(""); const [status,setStatus]=useState("");
  const load = () => fetch("/api/family").then(r => r.json()).then(setFamily);
  useEffect(() => { load(); }, []);
  async function create(event: FormEvent) {
    event.preventDefault(); setStatus("");
    const response = await fetch("/api/family/accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,username,password,role})});
    await response.json(); if(!response.ok){setStatus(text.family.createFailed);return;}
    setName("");setUsername("");setPassword("");setStatus(text.family.created);load();
  }
  async function toggle(enabled:boolean){await fetch("/api/family/child-chat",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled})});load();}
  if(!family)return <section className="family-panel"><p>{text.family.loading}</p></section>;
  return <section className="family-panel"><p className="eyebrow">{text.family.eyebrow}</p><h1>{family.name}</h1><div className="member-list">{family.members.map(member=><article key={member.id}><span>{member.name[0]}</span><div><strong>{member.name}</strong><small>@{member.username} · {member.role==="parent"?text.family.parent:text.family.child}{member.is_admin?" · admin":""}</small></div></article>)}</div>{family.is_admin&&<><div className="permission-card"><div><strong>{text.family.childrenChat}</strong><p>{text.family.childrenHelp}</p></div><button className={family.allow_child_chat?"enabled":""} onClick={()=>toggle(!family.allow_child_chat)} aria-pressed={family.allow_child_chat}>{family.allow_child_chat?text.family.enabled:text.family.disabled}</button></div><form className="account-form" onSubmit={create}><h2>{text.family.newAccount}</h2><label>{text.family.accountType}<select value={role} onChange={e=>setRole(e.target.value as "child"|"parent")}><option value="child">{text.family.child}</option><option value="parent">{text.family.parent}</option></select></label><label>{text.family.displayName}<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>{text.family.username}<input value={username} onChange={e=>setUsername(e.target.value)} minLength={3} required/></label><label>{text.family.temporaryPassword}<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={10} required/></label>{status&&<p>{status}</p>}<button className="primary-button">{text.family.create}</button></form></>}</section>;
}
