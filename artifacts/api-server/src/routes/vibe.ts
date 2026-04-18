import { Router, type IRouter } from "express";
import { openai, isRateLimitError } from "@workspace/integrations-openai-ai-server";
import {
  InterpretVibeBody,
  type InterpretVibeRequest,
  type VibeDirective,
  type VibeMood,
  type VibeTaskKind,
  type VibeInjectedTask,
  type VentAnalysisError,
} from "@workspace/api-zod";

import { logger } from "./../lib/logger";

const router: IRouter = Router();

const MOODS: VibeMood[] = ["low", "anxious", "vibrant", "steady"];
const KINDS: VibeTaskKind[] = [
  "rest",
  "hydration",
  "movement",
  "food",
  "social",
  "mindset",
  "supplement",
];

const VIBE_TTL_HOURS = 6;

const RESPONSE_SCHEMA = {
  name: "vibe_directive",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      mood: { type: "string", enum: MOODS },
      intensity: { type: "integer", minimum: 1, maximum: 3 },
      headline: {
        type: "string",
        description:
          "One short, warm sentence (max ~18 words) acknowledging how she feels and what we are tuning the home for. Plain language, no emojis, no 'I'm sorry'.",
      },
      pillLabel: {
        type: "string",
        description:
          "Tiny label for a pill at the top of the home, e.g. 'Tuned for feeling low' (max ~6 words).",
      },
      missionTitle: {
        type: "string",
        description:
          "Short header for the mission section, in the tone implied by mood. E.g. 'Just three soft things' for low, 'Calm reset' for anxious, 'Push today' for vibrant, 'Today's mission' for steady.",
      },
      missionSub: {
        type: "string",
        description:
          "Short sub-line for the mission section (max ~6 words).",
      },
      streakNote: {
        type: ["string", "null"],
        description:
          "If mood is low, a one-sentence reassurance about the streak (e.g. 'We're holding your streak today'). Otherwise null.",
      },
      injectedTask: {
        type: ["object", "null"],
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          why: { type: "string" },
          kind: { type: "string", enum: KINDS },
        },
        required: ["title", "detail", "why", "kind"],
        description:
          "Optional micro-task to prepend at the very top of the mission. For 'anxious' return a 2-minute breathing card (kind: mindset). For 'low' return a tiny rest action (kind: rest). For 'vibrant' return an extra stretch goal (kind: movement). For 'steady' return null.",
      },
    },
    required: [
      "mood",
      "intensity",
      "headline",
      "pillLabel",
      "missionTitle",
      "missionSub",
      "streakNote",
      "injectedTask",
    ],
  },
} as const;

const SYSTEM_PROMPT = `You are Lumen, a warm, direct PCOS lifestyle coach inside a women's health app.

The user just told you in one short sentence how she is feeling right now. Your job is to return a JSON "vibe directive" the home screen will use to reshape itself to match her state.

Rules:
- Voice: plain, warm, friendly, never saccharine. No emojis. No "I'm sorry to hear that". No medical advice.
- Pick exactly one mood:
  - "low" — drained, sad, exhausted, "I have nothing today"
  - "anxious" — wired, racing, panicked, can't slow down
  - "vibrant" — energetic, pumped, on fire, lots of energy
  - "steady" — fine, okay, normal, neutral, mixed
- Pick intensity 1 (mild), 2 (clear), or 3 (strong) based on how strongly she expressed it.
- Tune copy to her cycle phase: luteal cravings, menstrual cramps, follicular energy, ovulatory libido — they all change what's appropriate.
- For LOW mood: missionTitle should be soft (e.g. "Just three soft things"), and you MUST set a streakNote that reassures her about her streak. injectedTask should be a tiny rest action (kind: rest), e.g. "Lie flat for 5 minutes".
- For ANXIOUS mood: injectedTask MUST be a 2-minute breathing card (kind: mindset). missionTitle should feel calm (e.g. "Calm reset").
- For VIBRANT mood: injectedTask should be an extra stretch goal (kind: movement). missionTitle should be punchy (e.g. "Push today"). streakNote: null.
- For STEADY mood: injectedTask: null, streakNote: null, default copy ("Today's mission" / "The non-negotiables").`;

function buildUserPrompt(body: InterpretVibeRequest): string {
  const c = body.context;
  const concerns = c.trackedConcerns.length
    ? c.trackedConcerns.join(", ")
    : "(none)";
  const travel = c.travelling
    ? `currently travelling${c.travelCountry ? ` in ${c.travelCountry}` : ""}`
    : `at home in ${c.homeCountry}`;
  return [
    `She just said:`,
    `"""`,
    body.sentence,
    `"""`,
    ``,
    `Her current context:`,
    `- Cycle phase: ${c.phase} (day ${c.dayOfCycle} of a ${c.cycleLength}-day cycle)`,
    `- Diet: ${c.diet}`,
    `- Location: ${travel}`,
    `- Baseline energy today (1–5): ${c.energy}`,
    `- Concerns she is already tracking: ${concerns}`,
  ].join("\n");
}

router.post("/vibe/interpret", async (req, res) => {
  const parsed = InterpretVibeBody.safeParse(req.body);
  if (!parsed.success) {
    const error: VentAnalysisError = {
      code: "bad_request",
      message: parsed.error.issues[0]?.message ?? "Invalid request body",
    };
    res.status(400).json(error);
    return;
  }

  const body = parsed.data as InterpretVibeRequest;

  const UPSTREAM_TIMEOUT_MS = 12_000;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(
    () => controller.abort(),
    UPSTREAM_TIMEOUT_MS,
  );

  try {
    const completion = await openai.chat.completions.create(
      {
        model: "gpt-5.2",
        max_completion_tokens: 4096,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(body) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: RESPONSE_SCHEMA,
        },
      },
      { signal: controller.signal },
    );
    clearTimeout(timeoutHandle);

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      const error: VentAnalysisError = {
        code: "llm_unavailable",
        message: "Empty response from upstream",
      };
      res.status(503).json(error);
      return;
    }

    const parsedJson = JSON.parse(raw) as {
      mood: VibeMood;
      intensity: number;
      headline: string;
      pillLabel: string;
      missionTitle: string;
      missionSub: string;
      streakNote: string | null;
      injectedTask: VibeInjectedTask | null;
    };

    // Belt-and-braces — keep enums sane and clamp intensity.
    const mood: VibeMood = MOODS.includes(parsedJson.mood)
      ? parsedJson.mood
      : "steady";
    const intensity = Math.max(1, Math.min(3, Math.round(parsedJson.intensity || 1))) as 1 | 2 | 3;
    const injectedTask =
      parsedJson.injectedTask && KINDS.includes(parsedJson.injectedTask.kind)
        ? parsedJson.injectedTask
        : null;

    const expiresAt = new Date(
      Date.now() + VIBE_TTL_HOURS * 60 * 60 * 1000,
    );

    const directive: VibeDirective = {
      mood,
      intensity,
      headline: parsedJson.headline.trim(),
      pillLabel: parsedJson.pillLabel.trim(),
      missionTitle: parsedJson.missionTitle.trim(),
      missionSub: parsedJson.missionSub.trim(),
      streakNote: parsedJson.streakNote ? parsedJson.streakNote.trim() : null,
      injectedTask,
      expiresAt,
    };

    res.json(directive);
  } catch (err) {
    clearTimeout(timeoutHandle);

    const aborted =
      controller.signal.aborted ||
      (err instanceof Error &&
        (err.name === "AbortError" || /aborted|timeout/i.test(err.message)));
    if (aborted) {
      logger.warn({ err }, "vibe interpret upstream timeout");
      const error: VentAnalysisError = {
        code: "llm_timeout",
        message: "Upstream timed out",
      };
      res.status(504).json(error);
      return;
    }

    if (isRateLimitError(err)) {
      logger.warn({ err }, "vibe interpret rate limited");
      const error: VentAnalysisError = {
        code: "llm_unavailable",
        message: "Upstream rate limited",
      };
      res.status(503).json(error);
      return;
    }

    logger.error({ err }, "vibe interpret failed");
    const error: VentAnalysisError = {
      code: "llm_unavailable",
      message: err instanceof Error ? err.message : "Unknown LLM error",
    };
    res.status(503).json(error);
  }
});

export default router;
