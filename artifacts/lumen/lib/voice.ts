import { Platform } from "react-native";

// Lightweight web SpeechRecognition wrapper. On native (iOS/Android) we
// currently fall back to a typed input — adding a true on-device recogniser
// requires a custom Expo dev client (see follow-up task #4 for the migration
// to a hosted Whisper/AssemblyAI pipeline).

// ---- Minimal Web Speech typings (the DOM lib doesn't ship them) -----------

type SRResultAlternative = { transcript: string };
type SRResult = {
  isFinal: boolean;
  0: SRResultAlternative;
  length: number;
  [index: number]: SRResultAlternative;
};
type SRResultList = { length: number; [index: number]: SRResult };
type SREvent = { resultIndex: number; results: SRResultList };
type SRErrorEvent = { error?: string };

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type WindowWithSR = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

function getCtor(): SpeechRecognitionCtor | null {
  if (Platform.OS !== "web") return null;
  if (typeof window === "undefined") return null;
  const w = window as WindowWithSR;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceAvailable(): boolean {
  return getCtor() !== null;
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
  const Ctor = getCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-US";

  let finalText = "";
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    handlers.onPartial((finalText + " " + interim).trim());
  };
  rec.onerror = (e) => handlers.onError(e?.error ?? "voice-error");
  rec.onend = () => {
    handlers.onFinal(finalText.trim());
    handlers.onEnd();
  };
  try {
    rec.start();
  } catch (err) {
    handlers.onError(err instanceof Error ? err.message : String(err));
    return null;
  }
  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        // ignore — already stopped
      }
    },
  };
}
