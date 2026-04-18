import {
  interpretVibe,
  setBaseUrl,
  type ConcernKey as ApiConcernKey,
  type CyclePhase,
  type InterpretVibeRequest,
  type VibeDirective,
  type VibeMood,
  type VibePaletteIntensity,
  type VibeTaskKind,
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

const NETWORK_TIMEOUT_MS = 8000; // server target is ≤2s; this is a hard ceiling
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
//
// Used both as the network fallback AND as the immediate optimistic reshape
// while the server call is in flight, so the home morphs in <100ms.

const LOW = [
  "low", "drained", "exhausted", "wiped", "tired", "burnt",
  "burnt out", "burned out", "sad", "depressed", "down", "heavy",
  "hopeless", "no energy", "nothing left", "can't", "cant",
];

const ANXIOUS = [
  "anxious", "anxiety", "panicked", "panic", "racing", "wired",
  "overwhelmed", "stressed", "scared", "worried", "on edge",
  "freaking", "spiraling",
];

const VIBRANT = [
  "amazing", "great", "awesome", "energetic", "pumped", "alive",
  "on fire", "buzzing", "powerful", "strong", "ready", "go",
  "fantastic", "happy", "joyful",
];

function matches(s: string, words: string[]): boolean {
  const lower = s.toLowerCase();
  return words.some((w) => lower.includes(w));
}

function classifyMood(sentence: string): VibeMood {
  if (matches(sentence, LOW)) return "low";
  if (matches(sentence, ANXIOUS)) return "anxious";
  if (matches(sentence, VIBRANT)) return "vibrant";
  return "steady";
}

type OfflineSpec = {
  intensity: 1 | 2 | 3;
  headline: string;
  explanation: string;
  pillLabel: string;
  missionTitle: string;
  missionSub: string;
  streakNote: string | null;
  injectedTask: VibeDirective["injectedTask"];
  simplifyLevel: number;
  hideTaskKinds: VibeTaskKind[];
  swapMovementToRest: boolean;
  promoteLean: boolean;
  paletteIntensity: VibePaletteIntensity;
};

const OFFLINE_SPECS: Record<VibeMood, OfflineSpec> = {
  low: {
    intensity: 2,
    headline: "I hear you. Pulling back the day so it actually feels doable.",
    explanation: "Hiding the bonus sections so today is just three soft things.",
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
    simplifyLevel: 2,
    hideTaskKinds: ["movement", "social"],
    swapMovementToRest: true,
    promoteLean: false,
    paletteIntensity: "soft",
  },
  anxious: {
    intensity: 2,
    headline: "Let's slow the wheel. One breathing reset, then the basics.",
    explanation: "Quieting the page and leading with a breathing reset.",
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
    simplifyLevel: 1,
    hideTaskKinds: ["movement"],
    swapMovementToRest: true,
    promoteLean: false,
    paletteIntensity: "soft",
  },
  vibrant: {
    intensity: 2,
    headline: "Beautiful. Let's actually use this — one stretch goal added.",
    explanation: "Promoting your phase-tuned tasks so this energy lands somewhere.",
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
    simplifyLevel: 0,
    hideTaskKinds: [],
    swapMovementToRest: false,
    promoteLean: true,
    paletteIntensity: "punchy",
  },
  steady: {
    intensity: 1,
    headline: "Steady is good. Keeping the home as-is.",
    explanation: "Nothing to change today.",
    pillLabel: "Tuned for steady",
    missionTitle: "Today's mission",
    missionSub: "The non-negotiables",
    streakNote: null,
    injectedTask: null,
    simplifyLevel: 0,
    hideTaskKinds: [],
    swapMovementToRest: false,
    promoteLean: false,
    paletteIntensity: "normal",
  },
};

export function offlineDirectiveForSentence(sentence: string): VibeResult {
  const mood = classifyMood(sentence);
  const spec = OFFLINE_SPECS[mood];
  return {
    mood,
    expiresAt: new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000).toISOString(),
    analyzedOffline: true,
    ...spec,
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
    const result = (await withTimeout(
      interpretVibe(body),
      NETWORK_TIMEOUT_MS,
    )) as VibeDirective;
    return { ...result, analyzedOffline: false };
  } catch {
    return offlineDirectiveForSentence(input.sentence);
  }
}
