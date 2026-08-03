"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type Language = "hu" | "en";

const translations = {
  hu: {
    locale: "hu-HU", brand: "Itt vagyok.", loading: "Mindjárt itt vagyunk…", language: "Nyelv",
    login: { eyebrow: "CSAK A MI KIS HELYÜNK", intro: "A hangod hazatalál, akkor is, amikor épp messze vagy.", who: "Ki vagy?", userPlaceholder: "apa vagy manó", password: "Titkos szó", wait: "Egy pillanat…", enter: "Belépek", invalid: "A név vagy a titkos szó nem jó.", failed: "Most nem sikerült belépni.", privacy: "🔒 A beszélgetéseteket csak ti láthatjátok.", footer: "Készült sok szeretettel, kettőtöknek." },
    nav: { chat: "💬 Beszélgetés", learn: "✏️ Betűjáték", family: "⌂ Család", password: "⚙️ Jelszó", logout: "Kilépés" },
    conversation: { label: "Beszélgetés", otherParent: "＋ Másik szülő", parentUsername: "Szülő felhasználóneve", start: "Indítás", failed: "Nem sikerült elindítani.", fallback: "Beszélgetés" },
    chat: { hello: "Szia", connected: "kapcsolódva", connecting: "kapcsolódás…", quiet: "Még csend van itt.", empty: "Nyomd meg a nagy gombot, és mondd el, mi jár a fejedben!", you: "Te", listening: "Figyelek… mondd csak!", speak: "Mondd el hangosan", stop: "Felvétel leállítása", start: "Beszéd indítása", finish: "Nyomd meg, ha kész vagy", prompt: "Nyomd meg, aztán beszélj", signal: "Küldj hangjelzést", signalHelp: "A másik eszközön megszólal", signalFrom: "gondol rád!", write: "Ide is írhatsz…", message: "Üzenet", send: "Üzenet küldése" },
    speech: { unavailable: "Ezen az eszközön nincs elérhető beszédfelismerő szolgáltatás.", permission: "A beszédhez engedélyezned kell a mikrofont.", unsupported: "A böngésző nem támogatja a beszédfelismerést.", failed: "Nem sikerült felismerni a beszédet. Próbáld újra!", startFailed: "Nem sikerült elindítani a beszédfelismerést." },
    learn: { eyebrow: "BETŰKALAND", title: "Rakd ki a szót!", help: "Érintsd meg sorban a betűket. A felolvasó gomb segít.", listen: "🔊 Hallgasd meg", success: "Ügyes vagy!", completed: "Kiraktad:", next: "Jöhet a következő ➜", words: ["APA", "ANYA", "CICA", "KUTYA", "LABDA", "OTTHON", "SZERETLEK"] },
    family: { loading: "Betöltés…", eyebrow: "CSALÁDI CSOPORT", parent: "szülő", child: "gyermek", childrenChat: "Gyermekek beszélhetnek egymással", childrenHelp: "Kikapcsolva a gyermekek csak a szülők üzeneteit és a saját üzeneteiket látják.", enabled: "Engedélyezve", disabled: "Kikapcsolva", newAccount: "Új családi fiók", accountType: "Fiók típusa", displayName: "Megjelenő név", username: "Felhasználónév", temporaryPassword: "Ideiglenes jelszó", create: "Fiók létrehozása", created: "A fiók elkészült.", createFailed: "Nem sikerült létrehozni." },
    settings: { eyebrow: "BIZTONSÁG", title: "Jelszó megváltoztatása", intro: "A jelszó legalább 10 karakter legyen. A rendszer csak a biztonságos lenyomatát tárolja, magát a jelszót nem.", current: "Jelenlegi jelszó", new: "Új jelszó", repeat: "Új jelszó még egyszer", mismatch: "A két új jelszó nem egyezik.", failed: "Nem sikerült megváltoztatni a jelszót.", success: "A jelszavad biztonságosan megváltozott.", error: "Hiba történt.", saving: "Mentés…", save: "Jelszó mentése", after: "Mi történik jelszócsere után?", afterHelp: "A többi eszközön futó régi munkamenetek automatikusan kijelentkeznek. Ezen az eszközön belépve maradsz." },
  },
  en: {
    locale: "en-US", brand: "Here I am.", loading: "We'll be right here…", language: "Language",
    login: { eyebrow: "OUR LITTLE PLACE", intro: "Your voice finds its way home, even when you are far away.", who: "Who are you?", userPlaceholder: "dad or little one", password: "Secret word", wait: "One moment…", enter: "Sign in", invalid: "The name or secret word is incorrect.", failed: "We couldn't sign you in right now.", privacy: "🔒 Only your family can see your conversations.", footer: "Made with lots of love, for your family." },
    nav: { chat: "💬 Chat", learn: "✏️ Letter game", family: "⌂ Family", password: "⚙️ Password", logout: "Sign out" },
    conversation: { label: "Conversation", otherParent: "＋ Another parent", parentUsername: "Parent's username", start: "Start", failed: "Couldn't start the conversation.", fallback: "Conversation" },
    chat: { hello: "Hello", connected: "connected", connecting: "connecting…", quiet: "It's quiet here.", empty: "Press the big button and tell us what's on your mind!", you: "You", listening: "I'm listening… go ahead!", speak: "Say it out loud", stop: "Stop recording", start: "Start speaking", finish: "Press when you're finished", prompt: "Press, then speak", signal: "Send a chime", signalHelp: "It will play on the other device", signalFrom: "is thinking of you!", write: "You can type here too…", message: "Message", send: "Send message" },
    speech: { unavailable: "Speech recognition is not available on this device.", permission: "Please allow microphone access to speak.", unsupported: "This browser does not support speech recognition.", failed: "I couldn't understand that. Please try again!", startFailed: "Speech recognition could not be started." },
    learn: { eyebrow: "LETTER ADVENTURE", title: "Build the word!", help: "Tap the letters in order. The listen button can help.", listen: "🔊 Listen", success: "Well done!", completed: "You built:", next: "Next word ➜", words: ["DAD", "MOM", "CAT", "DOG", "BALL", "HOME", "LOVE"] },
    family: { loading: "Loading…", eyebrow: "FAMILY GROUP", parent: "parent", child: "child", childrenChat: "Children can talk to each other", childrenHelp: "When disabled, children only see their own messages and messages from parents.", enabled: "Enabled", disabled: "Disabled", newAccount: "New family account", accountType: "Account type", displayName: "Display name", username: "Username", temporaryPassword: "Temporary password", create: "Create account", created: "The account is ready.", createFailed: "The account could not be created." },
    settings: { eyebrow: "SECURITY", title: "Change password", intro: "Use at least 10 characters. The system stores only a secure hash, never the password itself.", current: "Current password", new: "New password", repeat: "Repeat new password", mismatch: "The two new passwords do not match.", failed: "The password could not be changed.", success: "Your password was changed securely.", error: "Something went wrong.", saving: "Saving…", save: "Save password", after: "What happens after a password change?", afterHelp: "Old sessions on your other devices will be signed out automatically. You will stay signed in on this device." },
  },
} as const;

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; text: typeof translations.hu | typeof translations.en };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("hu");
  useEffect(() => {
    const stored = localStorage.getItem("speaky-language");
    const timer = window.setTimeout(() => { if (stored === "hu" || stored === "en") setLanguageState(stored); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  function setLanguage(value: Language) { setLanguageState(value); localStorage.setItem("speaky-language", value); }
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage, text: translations[language] }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

export function LanguageSwitch() {
  const { language, setLanguage, text } = useLanguage();
  return <label className="language-switch"><span>{text.language}</span><select value={language} onChange={event => setLanguage(event.target.value as Language)} aria-label={text.language}><option value="hu">HU</option><option value="en">EN</option></select></label>;
}
