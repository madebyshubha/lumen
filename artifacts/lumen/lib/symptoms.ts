import type { CyclePhase } from "@/constants/colors";

export type SymptomTag =
  | "cravings"
  | "bloating"
  | "fatigue"
  | "anxiety"
  | "sad"
  | "happy"
  | "energetic"
  | "cramps"
  | "headache"
  | "acne"
  | "insomnia"
  | "soreness"
  | "horny";

export type HabitTag = "water" | "walk" | "stretch" | "meditate" | "protein" | "sleep";

const SYMPTOM_KEYWORDS: Record<SymptomTag, string[]> = {
  cravings: ["craving", "crave", "sweet", "sugar", "chocolate", "snack"],
  bloating: ["bloat", "bloated", "puffy", "swollen"],
  fatigue: ["tired", "exhaust", "drained", "wiped", "no energy", "sluggish"],
  anxiety: ["anxious", "anxiety", "worried", "panic", "racing"],
  sad: ["sad", "down", "blue", "weepy", "cry", "low"],
  happy: ["happy", "good", "great", "amazing", "joyful"],
  energetic: ["energetic", "buzzing", "alive", "powerful", "strong"],
  cramps: ["cramp", "cramps", "ache", "aching", "pain"],
  headache: ["headache", "migraine", "throbbing"],
  acne: ["acne", "pimple", "breakout", "skin"],
  insomnia: ["insomnia", "can't sleep", "couldn't sleep", "awake", "restless"],
  soreness: ["sore", "tender", "stiff"],
  horny: ["horny", "turned on", "aroused"],
};

const HABIT_KEYWORDS: Record<HabitTag, string[]> = {
  water: ["drank water", "water", "hydrated", "hydration"],
  walk: ["walked", "walk", "went outside", "outside", "took a walk"],
  stretch: ["stretched", "stretch", "yoga", "mobility"],
  meditate: ["meditated", "meditate", "breathwork", "breathed"],
  protein: ["protein", "ate protein", "had protein"],
  sleep: ["slept", "rested", "nap", "napped"],
};

export function extractSymptoms(text: string): SymptomTag[] {
  const lower = text.toLowerCase();
  const found = new Set<SymptomTag>();
  (Object.keys(SYMPTOM_KEYWORDS) as SymptomTag[]).forEach((tag) => {
    if (SYMPTOM_KEYWORDS[tag].some((k) => lower.includes(k))) found.add(tag);
  });
  return Array.from(found);
}

export function extractHabits(text: string): HabitTag[] {
  const lower = text.toLowerCase();
  const found = new Set<HabitTag>();
  (Object.keys(HABIT_KEYWORDS) as HabitTag[]).forEach((tag) => {
    if (HABIT_KEYWORDS[tag].some((k) => lower.includes(k))) found.add(tag);
  });
  return Array.from(found);
}

type TipKey = `${CyclePhase}:${SymptomTag}` | `any:${SymptomTag}`;

const TIPS: Partial<Record<TipKey, string>> = {
  "luteal:cravings":
    "That's the Luteal progesterone drop. A savory snack like almonds or hummus stops the spike better than chocolate.",
  "luteal:bloating":
    "Luteal water retention is real. Warm water with lemon and a slow walk move it faster than coffee.",
  "luteal:anxiety":
    "Progesterone is high. Box breathing for two minutes (4-4-4-4) settles the nervous system without caffeine.",
  "luteal:sad":
    "PMS isn't weakness, it's chemistry. Be horizontal under a blanket for 20 minutes — it counts as self-care.",
  "menstrual:cramps":
    "Heat + magnesium glycinate is the unsexy answer. Skip the cold smoothies today.",
  "menstrual:fatigue":
    "You're shedding a tissue lining. Lying down isn't lazy — it's metabolic work.",
  "menstrual:headache":
    "Estrogen just dropped. Hydrate aggressively and add a pinch of salt to your water.",
  "follicular:energetic":
    "Estrogen is rising — this is your build window. Lift heavy if you can. Your body is primed for it.",
  "follicular:happy":
    "Ride it. Make plans, ask for what you want, schedule the hard conversations.",
  "ovulatory:horny":
    "LH surge. Totally on time. Also a great day for cardio if you've got nothing else planned.",
  "ovulatory:happy":
    "Peak estrogen. You're more verbal and social today — use it on the things that matter.",
  "any:acne":
    "PCOS-linked breakouts respond to inositol and steady blood sugar more than topicals. Don't pick.",
  "any:insomnia":
    "Magnesium glycinate 30 min before bed and zero screens for the last 20. Boring, works.",
};

export function pcosFix(phase: CyclePhase, symptoms: SymptomTag[]): string {
  for (const s of symptoms) {
    const k = `${phase}:${s}` as TipKey;
    if (TIPS[k]) return TIPS[k]!;
    const any = `any:${s}` as TipKey;
    if (TIPS[any]) return TIPS[any]!;
  }
  switch (phase) {
    case "menstrual":
      return "Logged. Today, less is more — rest counts as the work.";
    case "follicular":
      return "Logged. You're in your build phase — lean into the energy while it's here.";
    case "ovulatory":
      return "Logged. Peak you. Book the thing, send the message.";
    case "luteal":
      return "Logged. Steady blood sugar is your secret weapon this week.";
  }
}

export const SYMPTOM_LABEL: Record<SymptomTag, string> = {
  cravings: "Cravings",
  bloating: "Bloating",
  fatigue: "Fatigue",
  anxiety: "Anxiety",
  sad: "Low mood",
  happy: "Happy",
  energetic: "Energetic",
  cramps: "Cramps",
  headache: "Headache",
  acne: "Skin",
  insomnia: "Insomnia",
  soreness: "Soreness",
  horny: "High libido",
};

export const HABIT_LABEL: Record<HabitTag, string> = {
  water: "Hydration",
  walk: "Walked",
  stretch: "Stretched",
  meditate: "Meditated",
  protein: "Protein",
  sleep: "Rested",
};
