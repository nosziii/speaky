"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Message, User } from "./types";

export function useFamilySocket(user: User | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [online, setOnline] = useState(false);
  const [signalFrom, setSignalFrom] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;
    let retry: ReturnType<typeof setTimeout>;
    let active = true;
    const connect = () => {
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(`${protocol}//${location.host}/ws/chat`);
      socketRef.current = socket;
      socket.onopen = () => setOnline(true);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "history") setMessages(data.messages);
        if (data.type === "message") setMessages((current) => current.some((m) => m.id === data.message.id) ? current : [...current, data.message]);
        if (data.type === "signal") {
          setSignalFrom(data.from);
          playChime();
          window.setTimeout(() => setSignalFrom(null), 3500);
        }
      };
      socket.onclose = (event) => { setOnline(false); if (active && event.code !== 4401) retry = setTimeout(connect, 1800); };
    };
    connect();
    return () => { active = false; clearTimeout(retry); socketRef.current?.close(); };
  }, [user]);

  const send = useCallback((text: string, kind: "text" | "speech") => {
    if (socketRef.current?.readyState !== WebSocket.OPEN || !text.trim()) return false;
    socketRef.current.send(JSON.stringify({ text, kind })); return true;
  }, []);

  const sendSignal = useCallback(() => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;
    socketRef.current.send(JSON.stringify({ type: "signal" }));
    return true;
  }, []);

  return { messages, online, send, sendSignal, signalFrom };
}

function playChime() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  [0, 0.18, 0.36].forEach((delay, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = [523, 659, 784][index];
    gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + 0.28);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + delay);
    oscillator.stop(context.currentTime + delay + 0.3);
  });
  window.setTimeout(() => context.close(), 900);
}
