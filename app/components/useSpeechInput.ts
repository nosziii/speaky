"use client";

import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capgo/capacitor-speech-recognition";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "./i18n";

type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type BrowserRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type SpeechConstructor = new () => BrowserRecognition;

export function useSpeechInput(send: (text: string, kind: "speech") => boolean) {
  const { text: copy } = useLanguage();
  const [listening, setListening] = useState(false);
  const [liveWords, setLiveWords] = useState("");
  const [speechError, setSpeechError] = useState("");
  const browserRecognition = useRef<BrowserRecognition | null>(null);
  const nativeText = useRef("");
  const nativeFinalized = useRef(false);

  const finishNative = useCallback(async () => {
    if (nativeFinalized.current) return;
    nativeFinalized.current = true;
    const cached = await SpeechRecognition.getLastPartialResult().catch(() => null);
    const text = (cached?.text || nativeText.current).trim();
    if (text) send(text, "speech");
    setListening(false);
    if (text) setTimeout(() => setLiveWords(""), 900);
    await SpeechRecognition.removeAllListeners();
  }, [send]);

  const startNative = useCallback(async () => {
    setSpeechError("");
    const availability = await SpeechRecognition.available();
    if (!availability.available) throw new Error(copy.speech.unavailable);
    let permission = await SpeechRecognition.checkPermissions();
    if (permission.speechRecognition !== "granted") permission = await SpeechRecognition.requestPermissions();
    if (permission.speechRecognition !== "granted") throw new Error(copy.speech.permission);

    await SpeechRecognition.removeAllListeners();
    nativeText.current = "";
    nativeFinalized.current = false;
    await SpeechRecognition.addListener("partialResults", event => {
      const text = (event.accumulatedText || event.accumulated || event.matches?.[0] || "").trim();
      if (text) { nativeText.current = text; setLiveWords(text); }
    });
    await SpeechRecognition.addListener("listeningState", event => {
      if (event.status === "started" || event.state === "started") setListening(true);
      if (event.status === "stopped" || event.state === "stopped") void finishNative();
    });
    await SpeechRecognition.addListener("error", event => {
      setSpeechError(event.message || copy.speech.failed);
      void finishNative();
    });
    setListening(true);
    await SpeechRecognition.start({ language: copy.locale, maxResults: 1, partialResults: true, popup: false });
  }, [copy, finishNative]);

  const startBrowser = useCallback(() => {
    const speechWindow = window as typeof window & { SpeechRecognition?: SpeechConstructor; webkitSpeechRecognition?: SpeechConstructor };
    const Constructor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Constructor) { setSpeechError(copy.speech.unsupported); return; }
    const recognition: BrowserRecognition = new Constructor();
    browserRecognition.current = recognition;
    recognition.lang = copy.locale;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = event => {
      let finalText = "", interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        if (event.results[index].isFinal) finalText += event.results[index][0].transcript;
        else interimText += event.results[index][0].transcript;
      }
      setLiveWords(finalText || interimText);
      if (finalText.trim()) { send(finalText, "speech"); setTimeout(() => setLiveWords(""), 900); }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); setSpeechError(copy.speech.failed); };
    recognition.start();
    setListening(true);
  }, [copy, send]);

  const toggleSpeech = useCallback(async () => {
    setSpeechError("");
    if (listening) {
      if (Capacitor.isNativePlatform()) await SpeechRecognition.forceStop().catch(() => finishNative());
      else browserRecognition.current?.stop();
      return;
    }
    if (Capacitor.isNativePlatform()) {
      try { await startNative(); }
      catch (error) { setListening(false); setSpeechError(error instanceof Error ? error.message : copy.speech.startFailed); }
    } else startBrowser();
  }, [copy, finishNative, listening, startBrowser, startNative]);

  useEffect(() => () => {
    browserRecognition.current?.stop();
    if (Capacitor.isNativePlatform()) void SpeechRecognition.forceStop().catch(() => undefined);
  }, []);

  return { listening, liveWords, speechError, toggleSpeech };
}
