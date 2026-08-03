"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "./i18n";

export function SettingsPanel() {
  const { language, text } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setStatus(null);
    if (newPassword !== confirmPassword) { setStatus({ ok: false, text: text.settings.mismatch }); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(language === "hu" ? data.detail || text.settings.failed : text.settings.failed);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setStatus({ ok: true, text: text.settings.success });
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) { setStatus({ ok: false, text: error instanceof Error ? error.message : text.settings.error }); }
    finally { setBusy(false); }
  }

  return <section className="settings-panel"><p className="eyebrow">{text.settings.eyebrow}</p><h1>{text.settings.title}</h1><p>{text.settings.intro}</p><form onSubmit={submit}><label>{text.settings.current}</label><input type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required/><label>{text.settings.new}</label><input type="password" autoComplete="new-password" minLength={10} value={newPassword} onChange={e=>setNewPassword(e.target.value)} required/><label>{text.settings.repeat}</label><input type="password" autoComplete="new-password" minLength={10} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required/>{status&&<p className={status.ok?"form-success":"form-error"} role="status">{status.text}</p>}<button className="primary-button" disabled={busy}>{busy?text.settings.saving:text.settings.save}</button></form><aside><strong>{text.settings.after}</strong><p>{text.settings.afterHelp}</p></aside></section>;
}
