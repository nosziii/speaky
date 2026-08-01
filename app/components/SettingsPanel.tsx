"use client";

import { FormEvent, useState } from "react";

export function SettingsPanel() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setStatus(null);
    if (newPassword !== confirmPassword) { setStatus({ ok: false, text: "A két új jelszó nem egyezik." }); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Nem sikerült megváltoztatni a jelszót.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setStatus({ ok: true, text: "A jelszavad biztonságosan megváltozott." });
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) { setStatus({ ok: false, text: error instanceof Error ? error.message : "Hiba történt." }); }
    finally { setBusy(false); }
  }

  return <section className="settings-panel"><p className="eyebrow">BIZTONSÁG</p><h1>Jelszó megváltoztatása</h1><p>A jelszó legalább 10 karakter legyen. A rendszer csak a biztonságos lenyomatát tárolja, magát a jelszót nem.</p><form onSubmit={submit}><label>Jelenlegi jelszó</label><input type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /><label>Új jelszó</label><input type="password" autoComplete="new-password" minLength={10} value={newPassword} onChange={e => setNewPassword(e.target.value)} required /><label>Új jelszó még egyszer</label><input type="password" autoComplete="new-password" minLength={10} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />{status && <p className={status.ok ? "form-success" : "form-error"} role="status">{status.text}</p>}<button className="primary-button" disabled={busy}>{busy ? "Mentés…" : "Jelszó mentése"}</button></form><aside><strong>Mi történik jelszócsere után?</strong><p>A többi eszközön futó régi munkamenetek automatikusan kijelentkeznek. Ezen az eszközön belépve maradsz.</p></aside></section>;
}
