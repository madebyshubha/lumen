import type { CyclePhase } from "@/constants/colors";

export type CircleMood = "low" | "tender" | "steady" | "bright" | "fiery";

export type MoodAggregate = {
  mood: CircleMood;
  count: number;
  label: string;
};

const MOODS: { key: CircleMood; label: string }[] = [
  { key: "low", label: "low" },
  { key: "tender", label: "tender" },
  { key: "steady", label: "steady" },
  { key: "bright", label: "bright" },
  { key: "fiery", label: "fiery" },
];

// Believable phase-keyed weights: the cohort skews to certain moods per phase.
const WEIGHTS: Record<CyclePhase, Record<CircleMood, number>> = {
  menstrual: { low: 0.32, tender: 0.30, steady: 0.18, bright: 0.12, fiery: 0.08 },
  follicular: { low: 0.06, tender: 0.10, steady: 0.24, bright: 0.36, fiery: 0.24 },
  ovulatory: { low: 0.04, tender: 0.06, steady: 0.20, bright: 0.30, fiery: 0.40 },
  luteal: { low: 0.22, tender: 0.28, steady: 0.22, bright: 0.16, fiery: 0.12 },
};

function dailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function rand(seedRef: { v: number }): number {
  seedRef.v = (seedRef.v * 9301 + 49297) % 233280;
  return seedRef.v / 233280;
}

export function moodAggregates(phase: CyclePhase): MoodAggregate[] {
  const total = 200 + Math.floor((dailySeed() % 60));
  const seed = { v: dailySeed() + phase.length };
  const weights = WEIGHTS[phase];
  return MOODS.map((m) => {
    const jitter = 0.85 + rand(seed) * 0.3;
    const count = Math.max(2, Math.round(total * weights[m.key] * jitter));
    return { mood: m.key, count, label: m.label };
  });
}

export function moodColor(mood: CircleMood, phase: CyclePhase): string {
  const palettes: Record<CyclePhase, Record<CircleMood, string>> = {
    menstrual: { low: "#5b6bd6", tender: "#8e8fff", steady: "#9aa6ff", bright: "#c79bff", fiery: "#e587ff" },
    follicular: { low: "#7da890", tender: "#9bcfa8", steady: "#3ec07c", bright: "#1e9d6b", fiery: "#0f7a4d" },
    ovulatory: { low: "#caa14a", tender: "#e0bb5b", steady: "#f3c969", bright: "#d49b1a", fiery: "#a8780b" },
    luteal: { low: "#caa18a", tender: "#f3a96b", steady: "#e88a4b", bright: "#d97639", fiery: "#9a4f1e" },
  };
  return palettes[phase][mood];
}
