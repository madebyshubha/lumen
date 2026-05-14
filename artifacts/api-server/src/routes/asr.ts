import { Router, type IRouter, raw } from "express";
import { openai, isRateLimitError } from "@workspace/integrations-openai-ai-server";
import type { VentAnalysisError } from "@workspace/api-zod";

import { logger } from "../lib/logger";

const router: IRouter = Router();

const SUPPORTED_TYPES = new Set([
  "application/octet-stream",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/webm",
  "audio/ogg",
]);

// 25MB matches the OpenAI Whisper upload ceiling. Vents are short, so we
// keep the practical limit much lower upstream — but we accept up to the
// full ceiling so a slightly longer recording isn't dropped on the floor.
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const UPSTREAM_TIMEOUT_MS = 15_000;

// Whisper accepts up to ~244 tokens of `prompt` to bias decoding toward
// expected vocabulary. Keep a safe character budget below that ceiling.
const MAX_PROMPT_CHARS = 880;

// Curated PCOS glossary the model historically mishears. Includes common
// supplements, medications, foods, and clinical terms users actually say.
const PCOS_GLOSSARY = [
  "PCOS",
  "polycystic ovary syndrome",
  "inositol",
  "myo-inositol",
  "d-chiro-inositol",
  "ovasitol",
  "metformin",
  "spironolactone",
  "berberine",
  "NAC",
  "n-acetylcysteine",
  "spearmint",
  "spearmint tea",
  "vitex",
  "DIM",
  "magnesium glycinate",
  "vitamin D",
  "omega-3",
  "ashwagandha",
  "saw palmetto",
  "zinc",
  "chromium",
  "alpha-lipoic acid",
  "GLP-1",
  "ozempic",
  "estrogen",
  "progesterone",
  "testosterone",
  "androgens",
  "cortisol",
  "insulin resistance",
  "hirsutism",
  "hair loss",
  "cystic acne",
  "follicular",
  "ovulatory",
  "luteal",
  "menstrual",
  "anovulatory",
  "luteinizing hormone",
  "FSH",
  "LH",
  "AMH",
  "HRV",
  "seed cycling",
  "low glycemic",
];

function decodeHeader(value: string | string[] | undefined): string {
  if (!value) return "";
  const raw = Array.isArray(value) ? value.join(" ") : value;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function buildPrompt(userHint: string): string {
  const glossary = PCOS_GLOSSARY.join(", ");
  const cleaned = userHint.replace(/\s+/g, " ").trim();
  const parts = cleaned
    ? [`Context: ${cleaned}`, `Vocabulary: ${glossary}.`]
    : [`Vocabulary: ${glossary}.`];
  let prompt = parts.join(" ");
  if (prompt.length > MAX_PROMPT_CHARS) {
    prompt = prompt.slice(0, MAX_PROMPT_CHARS - 1).trimEnd() + "…";
  }
  return prompt;
}

function extensionForType(contentType: string): string {
  const lower = contentType.toLowerCase();
  if (lower.includes("wav") || lower.includes("wave")) return "wav";
  if (lower.includes("m4a")) return "m4a";
  if (lower.includes("mp4")) return "mp4";
  if (lower.includes("webm")) return "webm";
  if (lower.includes("ogg")) return "ogg";
  if (lower.includes("mpeg") || lower.includes("mp3")) return "mp3";
  // Default to wav — the Expo speech recognition module persists wav files.
  return "wav";
}

router.post(
  "/asr/transcribe",
  raw({
    type: (req) => {
      const ct = (req.headers["content-type"] ?? "").toLowerCase().split(";")[0].trim();
      return SUPPORTED_TYPES.has(ct) || ct.startsWith("audio/");
    },
    limit: MAX_AUDIO_BYTES,
  }),
  async (req, res) => {
    const buffer = req.body as Buffer | undefined;
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      const error: VentAnalysisError = {
        code: "bad_request",
        message: "Missing audio body. POST raw audio bytes with an audio/* content-type.",
      };
      res.status(400).json(error);
      return;
    }

    const contentType =
      (req.headers["content-type"] ?? "audio/wav").toString().split(";")[0].trim() ||
      "audio/wav";
    const ext = extensionForType(contentType);
    const filename = `vent.${ext}`;

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    try {
      // Node 20+/24 expose `File` globally; OpenAI's SDK accepts it directly.
      // Copy to a fresh Uint8Array so the BlobPart typing is happy across
      // Node's `Buffer<ArrayBufferLike>` (which can be SharedArrayBuffer-backed).
      const bytes = new Uint8Array(buffer.byteLength);
      bytes.set(buffer);
      const file = new File([bytes], filename, { type: contentType });

      const userHint = decodeHeader(req.headers["x-asr-prompt"]);
      const prompt = buildPrompt(userHint);

      const result = await openai.audio.transcriptions.create(
        {
          file,
          model: "whisper-1",
          // English-only product right now; passing the language hint
          // measurably improves accuracy on short clips.
          language: "en",
          // Bias decoding toward PCOS vocabulary plus the caller's recent
          // context (tracked concerns, recent vent texts).
          prompt,
          // Plain text response keeps parsing trivial; we only need the words.
          response_format: "text",
        },
        { signal: controller.signal },
      );
      clearTimeout(timeoutHandle);

      // With response_format: "text", the SDK returns a string.
      const transcript =
        typeof result === "string"
          ? result.trim()
          : typeof (result as { text?: unknown })?.text === "string"
            ? ((result as { text: string }).text ?? "").trim()
            : "";

      res.json({ transcript });
    } catch (err) {
      clearTimeout(timeoutHandle);

      const aborted =
        controller.signal.aborted ||
        (err instanceof Error &&
          (err.name === "AbortError" || /aborted|timeout/i.test(err.message)));
      if (aborted) {
        logger.warn({ err }, "asr transcribe upstream timeout");
        const error: VentAnalysisError = {
          code: "llm_timeout",
          message: "Upstream timed out",
        };
        res.status(504).json(error);
        return;
      }

      if (isRateLimitError(err)) {
        logger.warn({ err }, "asr transcribe rate limited");
        const error: VentAnalysisError = {
          code: "llm_unavailable",
          message: "Upstream rate limited",
        };
        res.status(503).json(error);
        return;
      }

      logger.error({ err }, "asr transcribe failed");
      const error: VentAnalysisError = {
        code: "llm_unavailable",
        message: err instanceof Error ? err.message : "Unknown ASR error",
      };
      res.status(503).json(error);
    }
  },
);

export default router;
