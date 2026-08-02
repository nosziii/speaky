"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Family } from "./types";

export function FamilyPanel() {
  const [family, setFamily] = useState<Family | null>(null); const [role, setRole] = useState<"child"|"parent">("child");
  const [name,setName]=useState(""); const [username,setUsername]=useState(""); const [password,setPassword]=useState(""); const [status,setStatus]=useState("");
  const load = () => fetch("/api/family").then(r => r.json()).then(setFamily);
  useEffect(() => { load(); }, []);
  async function create(event: FormEvent) {
    event.preventDefault(); setStatus("");
    const response = await fetch("/api/family/accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,username,password,role})});
    const data = await response.json(); if(!response.ok){setStatus(data.detail||"Nem sikerült létrehozni.");return;}
    setName("");setUsername("");setPassword("");setStatus("A fiók elkészült.");load();
  }
  async function toggle(enabled:boolean){await fetch("/api/family/child-chat",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled})});load();}
  if(!family) return <section className="family-panel"><p>Betöltés…</p></section>;
  return <section className="family-panel"><p className="eyebrow">CSALÁDI CSOPORT</p><h1>{family.name}</h1><div className="member-list">{family.members.map(member=><article key={member.id}><span>{member.name[0]}</span><div><strong>{member.name}</strong><small>@{member.username} · {member.role==="parent"?"szülő":"gyermek"}{member.is_admin?" · admin":""}</small></div></article>)}</div>{family.is_admin&&<><div className="permission-card"><div><strong>Gyermekek beszélhetnek egymással</strong><p>Kikapcsolva a gyermekek csak a szülők üzeneteit és a saját üzeneteiket látják.</p></div><button className={family.allow_child_chat?"enabled":""} onClick={()=>toggle(!family.allow_child_chat)} aria-pressed={family.allow_child_chat}>{family.allow_child_chat?"Engedélyezve":"Kikapcsolva"}</button></div><form className="account-form" onSubmit={create}><h2>Új családi fiók</h2><label>Fiók típusa<select value={role} onChange={e=>setRole(e.target.value as "child"|"parent")}><option value="child">Gyermek</option><option value="parent">Szülő</option></select></label><label>Megjelenő név<input value={name} onChange={e=>setName(e.target.value)} required /></label><label>Felhasználónév<input value={username} onChange={e=>setUsername(e.target.value)} minLength={3} required /></label><label>Ideiglenes jelszó<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={10} required /></label>{status&&<p>{status}</p>}<button className="primary-button">Fiók létrehozása</button></form></>}</section>;
}
