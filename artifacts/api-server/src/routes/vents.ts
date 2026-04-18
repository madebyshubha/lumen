import { Router, type IRouter } from "express";
import { openai, isRateLimitError } from "@workspace/integrations-openai-ai-server";
import {
  AnalyzeVentBody,
  type AnalyzeVentRequest,
  type VentAnalysis,
  type VentAnalysisError,
  type SymptomTag,
  type HabitTag,
  type ConcernKey,
} from "@workspace/api-zod";

import { logger } from "../lib/logger";

const router: IRouter = Router();

const SYMPTOMS: SymptomTag[] = [
  "cravings",
  "bloating",
  "fatigue",
  "anxiety",
  "sad",
  "happy",
  "energetic",
  "cramps",
  "headache",
  "acne",
  "insomnia",
  "soreness",
  "horny",
];

const HABITS: HabitTag[] = [
  "water",
  "walk",
  "stretch",
  "meditate",
  "protein",
  "sleep",
];

const CONCERNS: ConcernKey[] = [
  "acne",
  "hair-loss",
  "hirsutism",
  "irregular-cycle",
  "weight-belly",
  "fatigue",
  "cravings",
  "insomnia",
  "anxiety",
  "dark-patches",
];

const CONCERN_LABELS: Record<ConcernKey, string> = {
  acne: "Acne and inflammation",
  "hair-loss": "Scalp hair thinning",
  hirsutism: "Facial or body hair",
  "irregular-cycle": "Irregular or missing periods",
  "weight-belly": "Belly weight that won't shift",
  fatigue: "Wired-but-tired fatigue",
  cravings: "Sugar cravings",
  insomnia: "Trouble sleeping",
  anxiety: "Anxiety and mood swings",
  "dark-patches": "Dark velvety patches",
};

// JSON schema constraining the model's output to the same enums the app uses.
// Using strict structured outputs so we never have to hand-parse free text.
const RESPONSE_SCHEMA = {
  name: "vent_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      symptoms: {
        type: "array",
        items: { type: "string", enum: SYMPTOMS },
      },
      habits: {
        type: "array",
        items: { type: "string", enum: HABITS },
      },
      headline: {
        type: "string",
        description:
          "One short, warm, direct sentence (max ~24 words) that names the most useful PCOS-aware fix for what she just said. No emojis. No 'I'm sorry'.",
      },
      explanation: {
        type: "string",
        description:
          "1–2 sentences (max ~50 words) explaining what is likely happening physiologically given her current cycle phase, in plain language. No medical advice. No emojis.",
      },
      followUp: {
        type: ["object", "null"],
        additionalProperties: false,
        properties: {
          concern: { type: "string", enum: CONCERNS },
          label: {
            type: "string",
            description:
              "Short call-to-action like 'Track this for me today' (max ~6 words).",
          },
        },
        required: ["concern", "label"],
      },
    },
    required: ["symptoms", "habits", "headline", "explanation", "followUp"],
  },
} as const;

const SYSTEM_PROMPT = `You are Lumen, a warm, direct PCOS lifestyle coach inside a women's health app.

Your voice:
- Plain language, friendly but not saccharine. Like a smart friend who happens to know hormones.
- Short. No filler. No "I'm sorry to hear that".
- No medical advice, no diagnoses, no drug recommendations. Lifestyle and self-care only.
- No emojis. Ever.

Your job for each user message:
1. Detect any of the listed symptoms she mentioned (literal OR implied — "I'm wiped" = fatigue, "ate cake instead of dinner" = cravings, "couldn't fall asleep till 3" = insomnia). Only return symptoms from the allowed enum. Do NOT invent.
2. Detect any habits she did from the allowed enum (e.g. "took a walk" = walk).
3. Write a one-sentence "headline" that gives the single most useful PCOS-aware fix for what she said, taking her current cycle phase into account.
4. Write a 1–2 sentence "explanation" of what is likely happening physiologically given her phase, day-of-cycle, diet, energy, and tracked concerns.
5. If — and only if — what she described maps cleanly to one of the allowed concern keys AND she is not already tracking it, suggest a "followUp" with that concern key and a short label like "Track this for me today". Otherwise return followUp: null.

Important:
- Stay grounded in her actual cycle phase. Luteal cravings, menstrual cramps, follicular energy, ovulatory libido — they all have specific dynamics. Use them.
- If she is travelling, factor in disrupted sleep, airport food, dehydration.
- Do not repeat the user's words back as the headline. Give her the move.`;

function buildUserPrompt(body: AnalyzeVentRequest): string {
  const c = body.context;
  const recent = c.recentVentTexts.length
    ? c.recentVentTexts.map((t: string, i: number) => `  ${i + 1}. ${t}`).join("\n")
    : "  (none)";
  const concerns = c.trackedConcerns.length
    ? c.trackedConcerns.join(", ")
    : "(none)";
  const travel = c.travelling
    ? `currently travelling${c.travelCountry ? ` in ${c.travelCountry}` : ""}`
    : `at home in ${c.homeCountry}`;

  return [
    `She just said:`,
    `"""`,
    body.text,
    `"""`,
    ``,
    `Her current context:`,
    `- Cycle phase: ${c.phase} (day ${c.dayOfCycle} of a ${c.cycleLength}-day cycle)`,
    `- Diet: ${c.diet}`,
    `- Location: ${travel}`,
    `- Baseline energy today (1–5): ${c.energy}`,
    `- Concerns she is already tracking: ${concerns}`,
    `  (Do NOT suggest a followUp for any concern she is already tracking — only suggest something new.)`,
    `- Her last few vents:`,
    recent,
  ].join("\n");
}

router.post("/vents/analyze", async (req, res) => {
  const parsed = AnalyzeVentBody.safeParse(req.body);
  if (!parsed.success) {
    const error: VentAnalysisError = {
      code: "bad_request",
      message: parsed.error.issues[0]?.message ?? "Invalid request body",
    };
    res.status(400).json(error);
    return;
  }

  const body = parsed.data as AnalyzeVentRequest;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(body) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: RESPONSE_SCHEMA,
      },
    });

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
      symptoms: SymptomTag[];
      habits: HabitTag[];
      headline: string;
      explanation: string;
      followUp: { concern: ConcernKey; label: string } | null;
    };

    // Belt-and-braces filter: drop any tag the model invented despite the schema,
    // and drop a follow-up that points at a concern the user is already tracking.
    const symptoms = parsedJson.symptoms.filter((s) => SYMPTOMS.includes(s));
    const habits = parsedJson.habits.filter((h) => HABITS.includes(h));
    const followUp =
      parsedJson.followUp && CONCERNS.includes(parsedJson.followUp.concern)
        ? body.context.trackedConcerns.includes(parsedJson.followUp.concern)
          ? null
          : {
              concern: parsedJson.followUp.concern,
              // Re-label with our canonical concern title prefix so the chip
              // matches what the user sees on the Care tab.
              label:
                parsedJson.followUp.label ||
                `Track ${CONCERN_LABELS[parsedJson.followUp.concern]} today`,
            }
        : null;

    const response: VentAnalysis = {
      symptoms,
      habits,
      headline: parsedJson.headline.trim(),
      explanation: parsedJson.explanation.trim(),
      followUp,
    };

    res.json(response);
  } catch (err) {
    if (isRateLimitError(err)) {
      logger.warn({ err }, "vent analyze rate limited");
      const error: VentAnalysisError = {
        code: "llm_unavailable",
        message: "Upstream rate limited",
      };
      res.status(503).json(error);
      return;
    }

    logger.error({ err }, "vent analyze failed");
    const error: VentAnalysisError = {
      code: "llm_unavailable",
      message: err instanceof Error ? err.message : "Unknown LLM error",
    };
    res.status(503).json(error);
  }
});

export default router;
