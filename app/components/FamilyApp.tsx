"use client";

import { useEffect, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { LearnPanel } from "./LearnPanel";
import { LoginCard } from "./LoginCard";
import { SettingsPanel } from "./SettingsPanel";
import { useFamilySocket } from "./useFamilySocket";
import type { Tab, User } from "./types";

export function FamilyApp() {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true); const [tab, setTab] = useState<Tab>("chat");
  useEffect(() => { fetch("/api/me").then(r => r.ok ? r.json() : null).then(setUser).finally(() => setLoading(false)); }, []);
  const socket = useFamilySocket(user);
  async function logout() { await fetch("/api/logout", { method: "POST" }); setUser(null); }
  if (loading) return <main className="loading-page"><div className="brand-mark"><span>i</span></div><p>Mindjárt itt vagyunk…</p></main>;
  if (!user) return <LoginCard onLogin={setUser} />;
  return <main className="app-shell"><header className="topbar"><div className="mini-brand"><div className="brand-mark"><span>i</span></div><strong>Itt vagyok.</strong></div><nav><button className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>💬 Beszélgetés</button><button className={tab === "learn" ? "active" : ""} onClick={() => setTab("learn")}>✏️ Betűjáték</button><button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>⚙️ Jelszó</button></nav><button className="logout" onClick={logout}>Kilépés</button></header>{tab === "chat" ? <ChatPanel user={user} {...socket} /> : tab === "learn" ? <LearnPanel /> : <SettingsPanel />}</main>;
}
