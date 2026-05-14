import { Platform } from "react-native";

// Voice transcription wrapper.
//   • Web  → Web SpeechRecognition (Chrome/Edge/Safari).
//   • iOS / Android → expo-speech-recognition (on-device when possible).
// Requires a custom Expo dev client on native — expo-speech-recognition is
// not available in Expo Go.

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

function getWebCtor(): SpeechRecognitionCtor | null {
  if (Platform.OS !== "web") return null;
  if (typeof window === "undefined") return null;
  const w = window as WindowWithSR;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ---- Native (expo-speech-recognition) lazy loader -------------------------

type NativeSubscription = { remove: () => void };
type NativeResultEvent = {
  isFinal: boolean;
  results: { transcript: string; confidence?: number }[];
};
type NativeErrorEvent = { error?: string; message?: string };
type NativeModule = {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (opts: {
    lang?: string;
    interimResults?: boolean;
    continuous?: boolean;
    requiresOnDeviceRecognition?: boolean;
  }) => void;
  stop: () => void;
  abort?: () => void;
  addListener: (
    event: "result" | "error" | "end" | "start",
    cb: (e: unknown) => void,
  ) => NativeSubscription;
};

let nativeModule: NativeModule | null | undefined;
function getNativeModule(): NativeModule | null {
  if (Platform.OS === "web") return null;
  if (nativeModule !== undefined) return nativeModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("expo-speech-recognition") as {
      ExpoSpeechRecognitionModule?: NativeModule;
    };
    nativeModule = mod.ExpoSpeechRecognitionModule ?? null;
  } catch {
    nativeModule = null;
  }
  return nativeModule;
}

// ---- Public API -----------------------------------------------------------

export function isVoiceAvailable(): boolean {
  if (Platform.OS === "web") return getWebCtor() !== null;
  return getNativeModule() !== null;
}

export type VoiceSession = {
  stop: () => void;
};

type Handlers = {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (err: string) => void;
  onEnd: () => void;
};

export function startVoice(handlers: Handlers): VoiceSession | null {
  if (Platform.OS === "web") return startWebVoice(handlers);
  return startNativeVoice(handlers);
}

// ---- Web implementation ---------------------------------------------------

function startWebVoice(handlers: Handlers): VoiceSession | null {
  const Ctor = getWebCtor();
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

// ---- Native implementation ------------------------------------------------

function startNativeVoice(handlers: Handlers): VoiceSession | null {
  const mod = getNativeModule();
  if (!mod) return null;

  let finalText = "";
  let stopped = false;
  const subs: NativeSubscription[] = [];

  const cleanup = () => {
    while (subs.length) {
      try {
        subs.pop()?.remove();
      } catch {
        // ignore
      }
    }
  };

  subs.push(
    mod.addListener("result", (raw) => {
      const e = raw as NativeResultEvent;
      const transcript = e.results?.[0]?.transcript ?? "";
      if (e.isFinal) {
        finalText = (finalText + " " + transcript).trim();
        handlers.onPartial(finalText);
      } else {
        handlers.onPartial((finalText + " " + transcript).trim());
      }
    }),
  );
  subs.push(
    mod.addListener("error", (raw) => {
      const e = raw as NativeErrorEvent;
      const code = e.error ?? e.message ?? "voice-error";
      // Normalise the common "permission denied" code so callers can
      // surface a consistent fallback message.
      const mapped =
        code === "permissions" || code === "permission" || code === "not-allowed"
          ? "not-allowed"
          : code;
      handlers.onError(mapped);
    }),
  );
  subs.push(
    mod.addListener("end", () => {
      if (stopped) return;
      stopped = true;
      handlers.onFinal(finalText.trim());
      handlers.onEnd();
      cleanup();
    }),
  );

  // Permissions + start are async; if either step fails we surface an error
  // and tear the session down. The synchronous VoiceSession handle is still
  // returned so the caller can stop() before the async chain resolves.
  (async () => {
    try {
      const perm = await mod.requestPermissionsAsync();
      if (stopped) return;
      if (!perm.granted) {
        stopped = true;
        handlers.onError("not-allowed");
        handlers.onEnd();
        cleanup();
        return;
      }
      mod.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
      });
    } catch (err) {
      if (stopped) return;
      stopped = true;
      handlers.onError(err instanceof Error ? err.message : String(err));
      handlers.onEnd();
      cleanup();
    }
  })();

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      try {
        mod.stop();
      } catch {
        // ignore — already stopped or never started
      }
      // Fire onEnd synchronously so the UI flips out of "listening" state
      // even if the native `end` event never arrives (e.g. stop tapped
      // before the async permission prompt resolved and start() ran).
      try {
        handlers.onFinal(finalText.trim());
      } finally {
        try {
          handlers.onEnd();
        } finally {
          cleanup();
        }
      }
    },
  };
}
