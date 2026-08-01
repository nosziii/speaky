"use client";

import { useMemo, useState } from "react";

const words = ["APA", "ANYA", "CICA", "KUTYA", "LABDA", "OTTHON", "SZERETLEK"];
export function LearnPanel() {
  const [round, setRound] = useState(0); const [picked, setPicked] = useState<string[]>([]);
  const word = words[round % words.length];
  const letters = useMemo(() => [...word].sort((a, b) => ((a.charCodeAt(0) * 7 + round) % 11) - ((b.charCodeAt(0) * 7 + round) % 11)), [word, round]);
  const done = picked.join("") === word;
  function choose(letter: string, index: number) { if (done) return; if (letter === word[picked.length]) setPicked([...picked, letter]); else document.getElementById(`letter-${index}`)?.classList.add("shake"); }
  function next() { setRound(v => v + 1); setPicked([]); }
  return <section className="learn-panel"><p className="eyebrow">BETŰKALAND</p><h1>Rakd ki a szót!</h1><p>Érintsd meg sorban a betűket. A felolvasó gomb segít.</p><button className="speak-word" onClick={() => speechSynthesis.speak(new SpeechSynthesisUtterance(word.toLowerCase()))}>🔊 Hallgasd meg</button><div className="word-slots">{[...word].map((letter, i) => <span className={picked[i] ? "filled" : ""} key={i}>{picked[i] || ""}</span>)}</div><div className="letter-choices">{letters.map((letter, i) => <button id={`letter-${i}`} disabled={picked.filter(x => x === letter).length >= letters.slice(0, i + 1).filter(x => x === letter).length} onClick={() => choose(letter, i)} key={`${letter}-${i}`}>{letter}</button>)}</div>{done && <div className="success-card"><span>★</span><h2>Ügyes vagy!</h2><p>Kiraktad: {word}</p><button onClick={next}>Jöhet a következő ➜</button></div>}</section>;
}
