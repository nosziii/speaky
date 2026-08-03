"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "./i18n";

export function LearnPanel() {
  const { text } = useLanguage();
  const [round, setRound] = useState(0); const [picked, setPicked] = useState<string[]>([]);
  const word = text.learn.words[round % text.learn.words.length];
  const letters = useMemo(() => [...word].sort((a, b) => ((a.charCodeAt(0) * 7 + round) % 11) - ((b.charCodeAt(0) * 7 + round) % 11)), [word, round]);
  const done = picked.join("") === word;
  function choose(letter: string, index: number) { if (done) return; if (letter === word[picked.length]) setPicked([...picked, letter]); else document.getElementById(`letter-${index}`)?.classList.add("shake"); }
  function next() { setRound(v => v + 1); setPicked([]); }
  function speak(){const utterance=new SpeechSynthesisUtterance(word.toLowerCase());utterance.lang=text.locale;speechSynthesis.speak(utterance);}
  return <section className="learn-panel"><p className="eyebrow">{text.learn.eyebrow}</p><h1>{text.learn.title}</h1><p>{text.learn.help}</p><button className="speak-word" onClick={speak}>{text.learn.listen}</button><div className="word-slots">{[...word].map((letter,i)=><span className={picked[i]?"filled":""} key={i}>{picked[i]||""}</span>)}</div><div className="letter-choices">{letters.map((letter,i)=><button id={`letter-${i}`} disabled={picked.filter(x=>x===letter).length>=letters.slice(0,i+1).filter(x=>x===letter).length} onClick={()=>choose(letter,i)} key={`${letter}-${i}`}>{letter}</button>)}</div>{done&&<div className="success-card"><span>★</span><h2>{text.learn.success}</h2><p>{text.learn.completed} {word}</p><button onClick={next}>{text.learn.next}</button></div>}</section>;
}
