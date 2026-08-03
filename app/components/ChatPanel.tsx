"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Message, User } from "./types";
import { useSpeechInput } from "./useSpeechInput";

export function ChatPanel({ user, conversationTitle, messages, online, send, sendSignal, signalFrom }: { user: User; conversationTitle: string; messages: Message[]; online: boolean; send: (text: string, kind: "text" | "speech") => boolean; sendSignal: () => boolean; signalFrom: string | null }) {
  const [draft, setDraft] = useState("");
  const { listening, liveWords, speechError, toggleSpeech } = useSpeechInput(send);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(event: FormEvent) { event.preventDefault(); if (send(draft, "text")) setDraft(""); }
  return (
    <section className="chat-panel">
      {signalFrom && <div className="signal-toast" role="status"><span>♪</span><strong>{signalFrom} gondol rád!</strong></div>}
      <div className="chat-heading"><div><p className="eyebrow">{conversationTitle}</p><h1>Szia, {user.name}! <span aria-hidden="true">👋</span></h1></div><span className={`connection ${online ? "online" : ""}`}>{online ? "kapcsolódva" : "kapcsolódás…"}</span></div>
      <div className="messages" aria-live="polite">
        {messages.length === 0 && <div className="empty-chat"><span>☀</span><h2>Még csend van itt.</h2><p>Nyomd meg a nagy gombot, és mondd el, mi jár a fejedben!</p></div>}
        {messages.map((message) => {
          const own = message.sender_id === user.id;
          return <article className={`message-row ${own ? "own" : ""}`} key={message.id}>
            {!own && <div className="avatar">{message.sender_name[0]}</div>}
            <div><p className="sender">{own ? "Te" : message.sender_name}</p><div className={`bubble ${message.kind === "speech" ? "spoken" : ""}`}>{message.kind === "speech" && <span className="tiny-mic">●</span>}{message.text}</div><time>{new Date(message.created_at).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}</time></div>
          </article>;
        })}
        <div ref={endRef} />
      </div>
      <div className={`speech-stage ${listening ? "active" : ""}`}>
        <div className="sound-bars" aria-hidden="true">{[1,2,3,4,5].map(n => <i key={n} />)}</div>
        <p>{liveWords || (listening ? "Figyelek… mondd csak!" : "Mondd el hangosan")}</p>
        {liveWords && <div className="letter-stream">{liveWords.split("").map((letter, i) => <span key={i}>{letter === " " ? " " : letter}</span>)}</div>}
        <button className={`mic-button ${listening ? "listening" : ""}`} onClick={toggleSpeech} aria-label={listening ? "Felvétel leállítása" : "Beszéd indítása"}>{listening ? "■" : "●"}</button>
        <small>{speechError || (listening ? "Nyomd meg, ha kész vagy" : "Nyomd meg, aztán beszélj")}</small>
      </div>
      <div className="contact-actions"><button className="signal-button" disabled={!online} onClick={() => sendSignal()}><span>♪</span><div><strong>Küldj hangjelzést</strong><small>A másik eszközön megszólal</small></div></button></div>
      <form className="composer" onSubmit={submit}><input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Ide is írhatsz…" aria-label="Üzenet" /><button aria-label="Üzenet küldése">➜</button></form>
    </section>
  );
}
