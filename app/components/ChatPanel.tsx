"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Message, User } from "./types";
import { useSpeechInput } from "./useSpeechInput";
import { useLanguage } from "./i18n";

export function ChatPanel({ user, conversationTitle, messages, online, send, sendSignal, signalFrom }: { user: User; conversationTitle: string; messages: Message[]; online: boolean; send: (text: string, kind: "text" | "speech") => boolean; sendSignal: () => boolean; signalFrom: string | null }) {
  const [draft, setDraft] = useState("");
  const { text } = useLanguage();
  const { listening, liveWords, speechError, toggleSpeech } = useSpeechInput(send);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(event: FormEvent) { event.preventDefault(); if (send(draft, "text")) setDraft(""); }
  return (
    <section className="chat-panel">
      {signalFrom && <div className="signal-toast" role="status"><span>♪</span><strong>{signalFrom} {text.chat.signalFrom}</strong></div>}
      <div className="chat-heading"><div><p className="eyebrow">{conversationTitle}</p><h1>{text.chat.hello}, {user.name}! <span aria-hidden="true">👋</span></h1></div><span className={`connection ${online ? "online" : ""}`}>{online ? text.chat.connected : text.chat.connecting}</span></div>
      <div className="messages" aria-live="polite">
        {messages.length === 0 && <div className="empty-chat"><span>☀</span><h2>{text.chat.quiet}</h2><p>{text.chat.empty}</p></div>}
        {messages.map((message) => {
          const own = message.sender_id === user.id;
          return <article className={`message-row ${own ? "own" : ""}`} key={message.id}>
            {!own && <div className="avatar">{message.sender_name[0]}</div>}
            <div><p className="sender">{own ? text.chat.you : message.sender_name}</p><div className={`bubble ${message.kind === "speech" ? "spoken" : ""}`}>{message.kind === "speech" && <span className="tiny-mic">●</span>}{message.text}</div><time>{new Date(message.created_at).toLocaleTimeString(text.locale, { hour: "2-digit", minute: "2-digit" })}</time></div>
          </article>;
        })}
        <div ref={endRef} />
      </div>
      <div className={`speech-stage ${listening ? "active" : ""}`}>
        <div className="sound-bars" aria-hidden="true">{[1,2,3,4,5].map(n => <i key={n} />)}</div>
        <p>{liveWords || (listening ? text.chat.listening : text.chat.speak)}</p>
        {liveWords && <div className="letter-stream">{liveWords.split("").map((letter, i) => <span key={i}>{letter === " " ? " " : letter}</span>)}</div>}
        <button className={`mic-button ${listening ? "listening" : ""}`} onClick={toggleSpeech} aria-label={listening ? text.chat.stop : text.chat.start}>{listening ? "■" : "●"}</button>
        <small>{speechError || (listening ? text.chat.finish : text.chat.prompt)}</small>
      </div>
      <div className="contact-actions"><button className="signal-button" disabled={!online} onClick={() => sendSignal()}><span>♪</span><div><strong>{text.chat.signal}</strong><small>{text.chat.signalHelp}</small></div></button></div>
      <form className="composer" onSubmit={submit}><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={text.chat.write} aria-label={text.chat.message}/><button aria-label={text.chat.send}>➜</button></form>
    </section>
  );
}
