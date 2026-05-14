import { Platform } from "react-native";

import type { CapturedAudio } from "@/lib/voice";

// Hosted ASR re-transcription. We POST the captured audio bytes as a raw
// body to the `/asr/transcribe` endpoint (multipart parsing on the server is
// avoided so we can keep the route lightweight). On any failure — network,
// permissions, upstream error, timeout — we return null and the caller keeps
// the on-device transcript that was already shown live.

const TIMEOUT_MS = 15_000;

function resolveBaseUrl(): string | null {
  const domain =
    process.env.EXPO_PUBLIC_API_DOMAIN ?? process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) return null;
  const url = domain.startsWith("http") ? domain : `https://${domain}`;
  return url.replace(/\/+$/, "");
}

async function loadBlob(audio: CapturedAudio): Promise<Blob | null> {
  // Both web (blob: URL) and native (file:// URI) URIs are supported by
  // RN's fetch implementation, which conveniently exposes the bytes via
  // .blob().
  try {
    const res = await fetch(audio.uri);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

export async function transcribeWithHostedAsr(
  audio: CapturedAudio,
): Promise<string | null> {
  const base = resolveBaseUrl();
  if (!base) return null;

  const blob = await loadBlob(audio);
  if (!blob || blob.size === 0) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${base}/api/asr/transcribe`, {
      method: "POST",
      headers: {
        // Use the captured mime type so the server can pick the right file
        // extension when handing the bytes to Whisper.
        "Content-Type": audio.mimeType || "audio/wav",
      },
      body: blob,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { transcript?: unknown };
    if (typeof data.transcript !== "string") return null;
    const trimmed = data.transcript.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    // Free the temporary object URL we created in the web recorder.
    if (Platform.OS === "web" && audio.uri.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(audio.uri);
      } catch {
        // ignore
      }
    }
  }
}
