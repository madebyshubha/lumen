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

export type AsrHints = {
  // Human-readable concern labels (e.g. "Hair loss", "Cystic acne").
  concerns?: string[];
  // The user's most recent vent texts. The server will trim, so pass a
  // small handful (e.g. last 3).
  recentVentTexts?: string[];
};

// Build a short, comma-joined hint string the server can fold into the
// Whisper `prompt`. We intentionally keep it compact — Whisper's prompt
// budget is ~244 tokens and the server adds the curated PCOS glossary.
function buildHintString(hints: AsrHints | undefined): string {
  if (!hints) return "";
  const parts: string[] = [];
  const concerns = (hints.concerns ?? [])
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  if (concerns.length > 0) {
    parts.push(`Tracked concerns: ${concerns.join(", ")}.`);
  }
  const vents = (hints.recentVentTexts ?? [])
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t.length > 0)
    .slice(0, 3)
    // Truncate each so one long vent can't crowd out the rest.
    .map((t) => (t.length > 160 ? `${t.slice(0, 159)}…` : t));
  if (vents.length > 0) {
    parts.push(`Recent: ${vents.join(" | ")}`);
  }
  return parts.join(" ");
}

// Headers must be ASCII-safe; URL-encode so emoji/diacritics survive.
function encodeHintHeader(hint: string): string {
  if (!hint) return "";
  // Cap the encoded value too so we never blow past server-side limits.
  const trimmed = hint.length > 600 ? `${hint.slice(0, 599)}…` : hint;
  try {
    return encodeURIComponent(trimmed);
  } catch {
    return "";
  }
}

export async function transcribeWithHostedAsr(
  audio: CapturedAudio,
  hints?: AsrHints,
): Promise<string | null> {
  const base = resolveBaseUrl();
  if (!base) return null;

  const blob = await loadBlob(audio);
  if (!blob || blob.size === 0) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      // Use the captured mime type so the server can pick the right file
      // extension when handing the bytes to Whisper.
      "Content-Type": audio.mimeType || "audio/wav",
    };
    const hintHeader = encodeHintHeader(buildHintString(hints));
    if (hintHeader) headers["X-ASR-Prompt"] = hintHeader;

    const res = await fetch(`${base}/api/asr/transcribe`, {
      method: "POST",
      headers,
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
