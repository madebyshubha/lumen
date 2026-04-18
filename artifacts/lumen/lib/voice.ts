import { Platform } from "react-native";

// Lightweight web SpeechRecognition wrapper. On native, this returns null and
// callers fall back to a typed input — Whisper-via-backend is out of scope for
// the prototype.

type WebSpeechCtor = new () => any;

export function isVoiceAvailable(): boolean {
  if (Platform.OS !== "web") return false;
  if (typeof window === "undefined") return false;
  const w = window as unknown as {
    SpeechRecognition?: WebSpeechCtor;
    webkitSpeechRecognition?: WebSpeechCtor;
  };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export type VoiceSession = {
  stop: () => void;
};

export function startVoice(handlers: {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (err: string) => void;
  onEnd: () => void;
}): VoiceSession | null {
  if (!isVoiceAvailable()) return null;
  const w = window as unknown as {
    SpeechRecognition?: WebSpeechCtor;
    webkitSpeechRecognition?: WebSpeechCtor;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-US";

  let finalText = "";
  rec.onresult = (e: any) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    handlers.onPartial((finalText + " " + interim).trim());
  };
  rec.onerror = (e: any) => handlers.onError(e?.error ?? "voice-error");
  rec.onend = () => {
    handlers.onFinal(finalText.trim());
    handlers.onEnd();
  };
  try {
    rec.start();
  } catch (err) {
    handlers.onError(String(err));
    return null;
  }
  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    },
  };
}
