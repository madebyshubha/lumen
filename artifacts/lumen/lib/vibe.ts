import {
  interpretVibe,
  setBaseUrl,
  type ConcernKey as ApiConcernKey,
  type CyclePhase,
  type InterpretVibeRequest,
  type VibeDirective,
  type VibeMood,
} from "@workspace/api-client-react";

import type { ConcernKey, Diet } from "@/lib/lifestyle";

export type VibeInput = {
  sentence: string;
  phase: CyclePhase;
  dayOfCycle: number;
  cycleLength: number;
  diet: Diet;
  homeCountry: string;
  travelling: boolean;
  travelCountry?: string | null;
  energy: number; // 1-10 from profile, downscaled to 1-5 for the API
  trackedConcerns: ConcernKey[];
};

export type VibeResult = VibeDirective & { analyzedOffline: boolean };

const TIMEOUT_MS = 6000;
const TTL_HOURS = 6;

let baseUrlConfigured = false;
function configureBaseUrl(): void {
  if (baseUrlConfigured) return;
  const domain =
    process.env.EXPO_PUBLIC_API_DOMAIN ?? process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    setBaseUrl(url);
  }
  baseUrlConfigured = true;
}

// ----- Offline keyword classifier -----------------------------------------

const LOW = [
  "low",
  "drained",
  "exhausted",
  "wiped",
  "tired",
  "burnt",
  "burnt out",
  "burned out",
  "sad",
  "depressed",
  "down",
  "heavy",
  "hopeless",
  "no energy",
  "nothing left",
  "can't",
  "cant",
];

const ANXIOUS = [
  "anxious",
  "anxiety",
  "panicked",
  "panic",
  "racing",
  "wired",
  "overwhelmed",
  "stressed",
  "scared",
  "worried",
  "on edge",
  "freaking",
  "spiraling",
];

const VIBRANT = [
  "amazing",
  "great",
  "awesome",
  "energetic",
  "pumped",
  "alive",
  "on fire",
  "buzzing",
  "powerful",
  "strong",
  "ready",
  "go",
  "fantastic",
  "happy",
  "joyful",
];

function matches(s: string, words: string[]): boolean {
  const lower = s.toLowerCase();
  return words.some((w) => lower.includes(w));
}

function classifyOffline(sentence: string): VibeMood {
  if (matches(sentence, LOW)) return "low";
  if (matches(sentence, ANXIOUS)) return "anxious";
  if (matches(sentence, VIBRANT)) return "vibrant";
  return "steady";
}

function offlineDirective(sentence: string): VibeResult {
  const mood = classifyOffline(sentence);
  const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000).toISOString();
  if (mood === "low") {
    return {
      mood,
      intensity: 2,
      headline: "I hear you. Pulling back the day so it actually feels doable.",
      pillLabel: "Tuned for feeling low",
      missionTitle: "Just three soft things",
      missionSub: "Gentle, no pressure",
      streakNote: "We're holding your streak today — anything counts.",
      injectedTask: {
        title: "Lie flat for five minutes",
        detail: "Phone face-down. Eyes closed. That's the whole task.",
        why: "When cortisol is high, even a tiny rest break drops it measurably.",
        kind: "rest",
      },
      expiresAt,
      analyzedOffline: true,
    };
  }
  if (mood === "anxious") {
    return {
      mood,
      intensity: 2,
      headline: "Let's slow the wheel. One breathing reset, then the basics.",
      pillLabel: "Tuned for anxious",
      missionTitle: "Calm reset",
      missionSub: "Slow the day down",
      streakNote: null,
      injectedTask: {
        title: "Two-minute box breathing",
        detail: "4-in, 4-hold, 4-out, 4-hold. Repeat for two minutes.",
        why: "Slow exhales activate the vagus nerve and drop cortisol within minutes.",
        kind: "mindset",
      },
      expiresAt,
      analyzedOffline: true,
    };
  }
  if (mood === "vibrant") {
    return {
      mood,
      intensity: 2,
      headline: "Beautiful. Let's actually use this — one stretch goal added.",
      pillLabel: "Tuned for high energy",
      missionTitle: "Push today",
      missionSub: "Energy is a window — use it",
      streakNote: null,
      injectedTask: {
        title: "Add ten minutes of strength",
        detail: "Tag it onto your workout — squats, push-ups, anything heavy.",
        why: "PCOS responds to muscle-building windows. Don't waste a high-energy day.",
        kind: "movement",
      },
      expiresAt,
      analyzedOffline: true,
    };
  }
  return {
    mood: "steady",
    intensity: 1,
    headline: "Steady is good. Keeping the home as-is.",
    pillLabel: "Tuned for steady",
    missionTitle: "Today's mission",
    missionSub: "The non-negotiables",
    streakNote: null,
    injectedTask: null,
    expiresAt,
    analyzedOffline: true,
  };
}

// ----- Network call --------------------------------------------------------

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("vibe_timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export async function runVibeInterpret(input: VibeInput): Promise<VibeResult> {
  configureBaseUrl();

  const body: InterpretVibeRequest = {
    sentence: input.sentence,
    context: {
      phase: input.phase,
      dayOfCycle: input.dayOfCycle,
      cycleLength: input.cycleLength,
      diet: input.diet,
      homeCountry: input.homeCountry,
      travelling: input.travelling,
      travelCountry: input.travelCountry ?? null,
      energy: Math.max(1, Math.min(5, Math.round(input.energy / 2))),
      trackedConcerns: input.trackedConcerns as ApiConcernKey[],
      recentVentTexts: [],
    },
  };

  try {
    const result = (await withTimeout(interpretVibe(body), TIMEOUT_MS)) as VibeDirective;
    return { ...result, analyzedOffline: false };
  } catch {
    return offlineDirective(input.sentence);
  }
}
