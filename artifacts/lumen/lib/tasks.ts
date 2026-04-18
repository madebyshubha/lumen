import type { CyclePhase } from "@/constants/colors";
import {
  countryName,
  pickFor,
  type ActiveConcern,
  type CountryCode,
  type Diet,
  DIET_LABEL,
} from "@/lib/lifestyle";
import { tasksForConcern } from "@/lib/protocols";
import type { HabitTag } from "@/lib/symptoms";

export type TaskPriority = "critical" | "important" | "gentle";
export type TaskKind =
  | "rest"
  | "hydration"
  | "movement"
  | "food"
  | "social"
  | "mindset"
  | "supplement";

export type Task = {
  id: string;
  title: string;
  detail: string;
  why: string; // PCOS reason — short, plain
  kind: TaskKind;
  priority: TaskPriority;
  habit?: HabitTag;
  scaledNote?: string; // shown when adaptive scaling kicked in
  context?: string; // small chip e.g. "Travel · Italy", "Vegetarian"
};

export type TaskContext = {
  phase: CyclePhase;
  hrvLow: boolean;
  diet: Diet;
  homeCountry: CountryCode;
  travelling: boolean;
  travelCountry?: CountryCode;
  concerns?: ActiveConcern[];
};

// ---- Phase-specific tasks ------------------------------------------------

function phaseTasks(phase: CyclePhase): Task[] {
  switch (phase) {
    case "menstrual":
      return [
        {
          id: "phase-rest",
          title: "Take a slow morning",
          detail: "Low battery — let the day begin softly.",
          why: "Menstruation is metabolic work. Your body is already exerting.",
          kind: "rest",
          priority: "important",
        },
        {
          id: "phase-stretch",
          title: "Five-minute hip stretch",
          detail: "Gentle, no force.",
          why: "Eases cramps and improves pelvic blood flow.",
          kind: "rest",
          priority: "gentle",
          habit: "stretch",
        },
      ];
    case "follicular":
      return [
        {
          id: "phase-strength",
          title: "Strength training, 30 min",
          detail: "Estrogen is rising — your build window.",
          why: "Lean muscle is the #1 lever for PCOS insulin sensitivity.",
          kind: "movement",
          priority: "important",
        },
        {
          id: "phase-social",
          title: "Schedule one hard conversation",
          detail: "Verbal fluency peaks this week.",
          why: "Use the estrogen lift — emotional courage is biochemical.",
          kind: "social",
          priority: "gentle",
        },
      ];
    case "ovulatory":
      return [
        {
          id: "phase-cardio",
          title: "20-minute cardio",
          detail: "Heart and skin both glow.",
          why: "Cardio at peak estrogen also lowers free testosterone — central to PCOS.",
          kind: "movement",
          priority: "important",
          habit: "walk",
        },
        {
          id: "phase-social",
          title: "Send one bold message",
          detail: "Peak verbal day — use it.",
          why: "Connection drops cortisol, which lowers PCOS symptom load.",
          kind: "social",
          priority: "gentle",
        },
      ];
    case "luteal":
      return [
        {
          id: "phase-stress",
          title: "Two-minute box breathing",
          detail: "4-in, 4-hold, 4-out, 4-hold.",
          why: "Luteal cortisol amplifies PCOS symptoms. This drops it fast.",
          kind: "mindset",
          priority: "important",
          habit: "meditate",
        },
        {
          id: "phase-strength",
          title: "Strength training, 25 min",
          detail: "Lighter than follicular — that's correct.",
          why: "Maintains muscle without spiking cortisol you can't afford this week.",
          kind: "movement",
          priority: "gentle",
        },
      ];
  }
}

// ---- Main generator ------------------------------------------------------

export function generateDailyTasks(ctx: TaskContext): Task[] {
  const country = ctx.travelling && ctx.travelCountry ? ctx.travelCountry : ctx.homeCountry;
  const food = pickFor(country, ctx.diet);
  const where = countryName(country);

  const tasks: Task[] = [];

  // CRITICAL — concern-driven actions come FIRST so the user sees the
  // PCOS protocol for what they're actively struggling with at the top.
  // protocols.ts only imports the Task *type* from this file, so there is no
  // runtime circular dependency.
  if (ctx.concerns && ctx.concerns.length > 0) {
    const seenTitles = new Set<string>();
    for (const c of ctx.concerns) {
      for (const t of tasksForConcern(c.key)) {
        if (seenTitles.has(t.title)) continue;
        seenTitles.add(t.title);
        tasks.push(t);
      }
    }
  }

  // CRITICAL — context-aware food pick (the "main mission").
  tasks.push({
    id: "food-pick",
    title: food.title,
    detail: food.detail,
    why: "PCOS responds to steady blood sugar more than calorie cuts. This plate is built for that.",
    kind: "food",
    priority: "critical",
    habit: "protein",
    context: ctx.travelling ? `Travel · ${where}` : `${DIET_LABEL[ctx.diet]} · ${where}`,
  });

  // CRITICAL — post-meal walk. The single most evidence-backed PCOS habit.
  tasks.push({
    id: "post-meal-walk",
    title: "10-min walk after lunch",
    detail: "Within 30 minutes of eating.",
    why: "Lowers post-meal glucose by 17–22%. Insulin sensitivity is a PCOS root cause.",
    kind: "movement",
    priority: "critical",
    habit: "walk",
  });

  // CRITICAL — hydration. PCOS women need more, full stop.
  tasks.push({
    id: "hydration",
    title: ctx.travelling ? "Three extra glasses of water" : "Two litres of water",
    detail: ctx.travelling
      ? "Travel days dehydrate faster — count it double."
      : "Front-load before noon.",
    why: "Dehydration spikes cortisol, which worsens insulin resistance and androgen flare.",
    kind: "hydration",
    priority: "critical",
    habit: "water",
    context: ctx.travelling ? `Travel · ${where}` : undefined,
  });

  // IMPORTANT — phase-driven additions
  tasks.push(...phaseTasks(ctx.phase));

  // IMPORTANT — travel-only additions
  if (ctx.travelling) {
    tasks.push({
      id: "travel-fibre",
      title: "Add fibre at every meal",
      detail: "Travel meals skew refined — pair with veg or fruit-with-skin.",
      why: "Fibre blunts glucose spikes when you can't control the kitchen.",
      kind: "food",
      priority: "important",
      habit: "protein",
      context: `Travel · ${where}`,
    });
    tasks.push({
      id: "travel-magnesium",
      title: "Magnesium glycinate before bed",
      detail: "200–400mg. Settles travel-day jitter.",
      why: "Magnesium is depleted by travel stress and is central to PCOS sleep + insulin.",
      kind: "supplement",
      priority: "gentle",
      context: `Travel · ${where}`,
    });
  }

  // GENTLE — luteal cravings safety net
  if (ctx.phase === "luteal") {
    tasks.push({
      id: "savory-snack",
      title: "Keep almonds in your bag",
      detail: "Beats the 4pm chocolate run.",
      why: "Progesterone drops glucose; salty-fat snacks settle it without a sugar crash.",
      kind: "food",
      priority: "gentle",
      habit: "protein",
    });
  }

  // HRV adaptive scaling — downgrade one strength/cardio movement task to a
  // restorative stretch. The post-meal walk is preserved because it is the
  // critical PCOS habit.
  if (ctx.hrvLow) {
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (t.kind === "movement" && t.id !== "post-meal-walk") {
        tasks[i] = {
          ...t,
          title: "10-minute restorative stretch",
          detail: "Your HRV is low today.",
          kind: "rest",
          habit: "stretch",
          scaledNote: `Downgraded from "${t.title}" to protect your nervous system. Streak preserved.`,
        };
        break;
      }
    }
  }

  return tasks;
}

// Back-compat shim used by older code paths.
export function tasksForPhase(phase: CyclePhase, hrvLow: boolean): Task[] {
  return generateDailyTasks({
    phase,
    hrvLow,
    diet: "vegetarian",
    homeCountry: "OTHER",
    travelling: false,
  });
}
