"use client";

import { FormEvent, useState } from "react";
import type { User } from "./types";

export function LoginCard({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      if (!response.ok) throw new Error("A név vagy a titkos szó nem jó.");
      onLogin(await response.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Most nem sikerült belépni."); }
    finally { setBusy(false); }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true"><span>i</span></div>
        <p className="eyebrow">CSAK A MI KIS HELYÜNK</p>
        <h1 id="login-title">Itt vagyok.</h1>
        <p className="login-intro">A hangod hazatalál, akkor is, amikor épp messze vagy.</p>
        <form onSubmit={submit}>
          <label>Ki vagy?</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="apa vagy manó" required />
          <label>Titkos szó</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" required />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy}>{busy ? "Egy pillanat…" : "Belépek"}</button>
        </form>
        <p className="privacy-note">🔒 A beszélgetéseteket csak ti láthatjátok.</p>
      </section>
      <p className="login-footer">Készült sok szeretettel, kettőtöknek.</p>
    </main>
  );
}
