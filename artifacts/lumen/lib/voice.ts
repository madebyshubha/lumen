import { Platform } from "react-native";

// Voice transcription wrapper.
//   • Web  → Web SpeechRecognition (Chrome/Edge/Safari) + MediaRecorder for
//     a parallel audio capture we can re-transcribe via hosted Whisper.
//   • iOS / Android → expo-speech-recognition (on-device when possible),
//     with `recordingOptions.persist` so we get a saved audio file alongside
//     the live transcript.
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
type NativeAudioEvent = { uri: string | null };
type NativeRecordingOptions = {
  persist: boolean;
  outputDirectory?: string;
  outputFileName?: string;
};
type NativeModule = {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (opts: {
    lang?: string;
    interimResults?: boolean;
    continuous?: boolean;
    requiresOnDeviceRecognition?: boolean;
    recordingOptions?: NativeRecordingOptions;
  }) => void;
  stop: () => void;
  abort?: () => void;
  addListener: (
    event: "result" | "error" | "end" | "start" | "audiostart" | "audioend",
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

export type CapturedAudio = {
  // For native: a `file://` URI on disk.
  // For web: a Blob: URL we can fetch().then(r => r.blob()).
  uri: string;
  mimeType: string;
};

export type VoiceSession = {
  stop: () => void;
};

type Handlers = {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (err: string) => void;
  onEnd: () => void;
  // Fired once recording stops with a captured audio file/blob the caller
  // can ship to a hosted ASR for re-transcription. Not fired if audio
  // capture failed or isn't supported.
  onAudio?: (audio: CapturedAudio) => void;
};

export function startVoice(handlers: Handlers): VoiceSession | null {
  if (Platform.OS === "web") return startWebVoice(handlers);
  return startNativeVoice(handlers);
}

// ---- Web implementation ---------------------------------------------------

type MediaRecorderLike = {
  state: string;
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
  start: (timeslice?: number) => void;
  stop: () => void;
  mimeType?: string;
};
type MediaRecorderCtor = new (
  stream: MediaStream,
  options?: { mimeType?: string },
) => MediaRecorderLike;

function getWebMediaRecorder(): MediaRecorderCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { MediaRecorder?: MediaRecorderCtor };
  return w.MediaRecorder ?? null;
}

function pickWebRecorderMime(Ctor: MediaRecorderCtor): string | undefined {
  // Reach into the static `isTypeSupported` if available; otherwise let the
  // browser pick its default (which is typically webm/opus on Chromium and
  // mp4/aac on Safari — Whisper handles both).
  const Static = Ctor as unknown as {
    isTypeSupported?: (type: string) => boolean;
  };
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  if (typeof Static.isTypeSupported === "function") {
    for (const t of candidates) {
      try {
        if (Static.isTypeSupported(t)) return t;
      } catch {
        // ignore
      }
    }
  }
  return undefined;
}

function startWebVoice(handlers: Handlers): VoiceSession | null {
  const Ctor = getWebCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-US";

  let finalText = "";
  let stopped = false;

  // Parallel audio capture for hosted Whisper re-transcription. We start it
  // best-effort — a missing MediaRecorder, denied permission, or an error
  // mid-stream just means we keep the on-device transcript without an upload.
  const Recorder = getWebMediaRecorder();
  let mediaRecorder: MediaRecorderLike | null = null;
  let mediaStream: MediaStream | null = null;
  const audioChunks: Blob[] = [];
  let audioMime: string | undefined;

  const teardownStream = () => {
    if (mediaStream) {
      try {
        mediaStream.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
      mediaStream = null;
    }
    mediaRecorder = null;
  };

  const stopRecorderAndEmitAudio = () => {
    if (!mediaRecorder) return;
    const r = mediaRecorder;
    r.onstop = () => {
      try {
        if (audioChunks.length > 0 && handlers.onAudio) {
          const type = audioMime ?? r.mimeType ?? "audio/webm";
          const blob = new Blob(audioChunks, { type });
          const url = URL.createObjectURL(blob);
          handlers.onAudio({ uri: url, mimeType: type });
        }
      } catch {
        // swallow — audio capture is best-effort
      } finally {
        teardownStream();
      }
    };
    try {
      if (r.state !== "inactive") r.stop();
      else teardownStream();
    } catch {
      teardownStream();
    }
  };

  if (Recorder && typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStream = stream;
        try {
          audioMime = pickWebRecorderMime(Recorder);
          mediaRecorder = audioMime
            ? new Recorder(stream, { mimeType: audioMime })
            : new Recorder(stream);
          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) audioChunks.push(e.data);
          };
          mediaRecorder.onerror = () => teardownStream();
          mediaRecorder.start();
        } catch {
          teardownStream();
        }
      })
      .catch(() => {
        // mic permission denied or no input — fall back silently to the
        // on-device transcript only.
      });
  }

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
    stopRecorderAndEmitAudio();
  };
  try {
    rec.start();
  } catch (err) {
    handlers.onError(err instanceof Error ? err.message : String(err));
    teardownStream();
    return null;
  }
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
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
  let audioUri: string | null = null;
  let audioEmitted = false;
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

  const emitAudioIfReady = () => {
    if (audioEmitted) return;
    if (!audioUri) return;
    audioEmitted = true;
    if (handlers.onAudio) {
      // expo-speech-recognition writes a `.wav` file on both iOS and Android.
      handlers.onAudio({ uri: audioUri, mimeType: "audio/wav" });
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
    mod.addListener("audioend", (raw) => {
      const e = raw as NativeAudioEvent;
      if (e.uri) audioUri = e.uri;
      emitAudioIfReady();
    }),
  );
  subs.push(
    mod.addListener("end", () => {
      if (stopped) return;
      stopped = true;
      handlers.onFinal(finalText.trim());
      handlers.onEnd();
      // The audioend event sometimes lands just before `end`; emit here too
      // so we don't drop the file on the floor if it arrived first.
      emitAudioIfReady();
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
        recordingOptions: {
          persist: true,
        },
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
          // The audioend event for a manual stop arrives slightly later; we
          // still want to ship that file when it shows up, so leave the
          // listener attached for a short grace window before cleaning up.
          setTimeout(() => {
            emitAudioIfReady();
            cleanup();
          }, 1200);
        }
      }
    },
  };
}
