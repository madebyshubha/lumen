import {
  analyzeVent,
  setBaseUrl,
  type AnalyzeVentRequest,
  type ConcernKey as ApiConcernKey,
  type CyclePhase,
  type HabitTag,
  type SymptomTag,
  type VentAnalysis,
  type VentAnalysisFollowUp,
} from "@workspace/api-client-react";

import type { ConcernKey, Diet } from "@/lib/lifestyle";
import {
  extractHabits,
  extractSymptoms,
  pcosFix,
} from "@/lib/symptoms";

export type AnalyzerInput = {
  text: string;
  phase: CyclePhase;
  dayOfCycle: number;
  cycleLength: number;
  diet: Diet;
  homeCountry: string;
  travelling: boolean;
  travelCountry?: string | null;
  energy: number;
  trackedConcerns: ConcernKey[];
  recentVentTexts: string[];
};

export type AnalyzerResult = {
  symptoms: SymptomTag[];
  habits: HabitTag[];
  headline: string;
  explanation: string;
  followUp: VentAnalysisFollowUp | null;
  analyzedOffline: boolean;
};

const TIMEOUT_MS = 6000;

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

function offlineFallback(input: AnalyzerInput): AnalyzerResult {
  const symptoms = extractSymptoms(input.text);
  const habits = extractHabits(input.text);
  const fix = pcosFix(input.phase, symptoms);
  return {
    symptoms,
    habits,
    headline: "Logged",
    explanation: fix,
    followUp: null,
    analyzedOffline: true,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("analyzer_timeout"));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function runVentAnalysis(
  input: AnalyzerInput,
): Promise<AnalyzerResult> {
  configureBaseUrl();

  const body: AnalyzeVentRequest = {
    text: input.text,
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
      recentVentTexts: input.recentVentTexts.slice(0, 5),
    },
  };

  try {
    const result = (await withTimeout(analyzeVent(body), TIMEOUT_MS)) as VentAnalysis;
    return {
      symptoms: result.symptoms as SymptomTag[],
      habits: result.habits as HabitTag[],
      headline: result.headline,
      explanation: result.explanation,
      followUp: result.followUp ?? null,
      analyzedOffline: false,
    };
  } catch {
    // Timeout, network failure, 4xx/5xx, or LLM unavailable — surface a
    // graceful offline read so the user is never blocked on the LLM.
    return offlineFallback(input);
  }
}
