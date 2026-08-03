"use client";

import { FormEvent, useState } from "react";
import type { User } from "./types";
import { LanguageSwitch, useLanguage } from "./i18n";

export function LoginCard({ onLogin }: { onLogin: (user: User) => void }) {
  const { text } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      if (!response.ok) throw new Error(text.login.invalid);
      onLogin(await response.json());
    } catch (err) { setError(err instanceof Error ? err.message : text.login.failed); }
    finally { setBusy(false); }
  }

  return (
    <main className="login-page">
      <LanguageSwitch/>
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true"><span>i</span></div>
        <p className="eyebrow">{text.login.eyebrow}</p>
        <h1 id="login-title">{text.brand}</h1>
        <p className="login-intro">{text.login.intro}</p>
        <form onSubmit={submit}>
          <label>{text.login.who}</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder={text.login.userPlaceholder} required />
          <label>{text.login.password}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" required />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy}>{busy ? text.login.wait : text.login.enter}</button>
        </form>
        <p className="privacy-note">{text.login.privacy}</p>
      </section>
      <p className="login-footer">{text.login.footer}</p>
    </main>
  );
}
