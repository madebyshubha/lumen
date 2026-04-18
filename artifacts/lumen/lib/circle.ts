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

// ----------------------------------------------------------------------------
// Phase-mates leaderboard — anonymous, deterministic mocked cohort per phase.
// No real users. Same shape so this can later swap to a real backend without
// touching the UI.
// ----------------------------------------------------------------------------

export type PhaseMate = {
  id: string;
  handle: string;
  daysIntoPhase: number;
  streak: number;
};

const ADJECTIVES = [
  "Crimson", "Velvet", "Amber", "Indigo", "Hazel", "Slate", "Coral", "Quiet",
  "Wild", "Bright", "Soft", "Steady", "Lunar", "Golden", "Misty", "Plum",
  "Saffron", "Cedar", "Olive", "River",
];
const NOUNS = [
  "Fern", "Wren", "Lark", "Tide", "Ember", "Willow", "Hare", "Dove",
  "Heron", "Reed", "Thistle", "Sparrow", "Lotus", "Cypress", "Petal", "Stone",
  "Brook", "Moth", "Iris", "Sage",
];

const PHASE_LENGTH: Record<CyclePhase, number> = {
  menstrual: 5,
  follicular: 8,
  ovulatory: 1,
  luteal: 14,
};

function phaseSeed(phase: CyclePhase): number {
  // Stable per phase; doesn't change day-to-day so the cohort feels persistent.
  let h = 5381;
  for (let i = 0; i < phase.length; i++) h = ((h << 5) + h + phase.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function generatePhaseMates(phase: CyclePhase, count = 50): PhaseMate[] {
  const seed = { v: phaseSeed(phase) };
  const out: PhaseMate[] = [];
  const used = new Set<string>();
  let i = 0;
  while (out.length < count && i < count * 6) {
    i++;
    const adj = ADJECTIVES[Math.floor(rand(seed) * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(rand(seed) * NOUNS.length)];
    const handle = `${adj} ${noun}`;
    if (used.has(handle)) continue;
    used.add(handle);
    const daysIntoPhase = 1 + Math.floor(rand(seed) * Math.max(1, PHASE_LENGTH[phase]));
    // Believable streak distribution: most 1–18, some long ones up to ~60.
    const r = rand(seed);
    const streak =
      r > 0.92 ? 30 + Math.floor(rand(seed) * 30)
      : r > 0.7 ? 10 + Math.floor(rand(seed) * 12)
      : r > 0.3 ? 3 + Math.floor(rand(seed) * 8)
      : 1 + Math.floor(rand(seed) * 4);
    out.push({ id: `${phase}-${out.length}`, handle, daysIntoPhase, streak });
  }
  return out;
}

export type LeaderboardRow = PhaseMate & { rank: number; isYou?: boolean };

export type Leaderboard = {
  top: LeaderboardRow[];
  you: LeaderboardRow;
  totalInPhase: number;
  userInTop: boolean;
};

export function buildLeaderboard(
  phase: CyclePhase,
  userStreak: number,
  userDayOfPhase: number,
): Leaderboard {
  const mates = generatePhaseMates(phase);
  // Rank everyone (mates + you) by streak desc, ties broken by name to stay stable.
  const youHandle = "You";
  const all: PhaseMate[] = [
    ...mates,
    { id: "you", handle: youHandle, daysIntoPhase: userDayOfPhase, streak: userStreak },
  ];
  all.sort((a, b) => {
    if (b.streak !== a.streak) return b.streak - a.streak;
    return a.handle.localeCompare(b.handle);
  });
  const ranked: LeaderboardRow[] = all.map((m, i) => ({
    ...m,
    rank: i + 1,
    isYou: m.id === "you",
  }));
  const top = ranked.slice(0, 10);
  const you = ranked.find((r) => r.isYou)!;
  return {
    top,
    you,
    totalInPhase: all.length,
    userInTop: top.some((r) => r.isYou),
  };
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
