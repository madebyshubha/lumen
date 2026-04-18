import type { CyclePhase } from "@/constants/colors";
import type { HabitTag } from "@/lib/symptoms";

export type TaskKind = "rest" | "hydration" | "strength" | "protein" | "social" | "cardio" | "glucose" | "stress";

export type Task = {
  id: string;
  title: string;
  detail: string;
  kind: TaskKind;
  habit?: HabitTag;
  scaledNote?: string; // shown when adaptive scaling kicked in
};

export function tasksForPhase(phase: CyclePhase, hrvLow: boolean): Task[] {
  const base: Record<CyclePhase, Task[]> = {
    menstrual: [
      { id: "rest", title: "Take a slow morning", detail: "Low Battery — let the day begin softly", kind: "rest" },
      { id: "hydration", title: "Drink a warm glass of water", detail: "Adds back what you're losing", kind: "hydration", habit: "water" },
      { id: "stretch", title: "Five-minute hip stretch", detail: "Gentle, no force", kind: "rest", habit: "stretch" },
    ],
    follicular: [
      { id: "strength", title: "Strength training, 30 min", detail: "Estrogen is rising — your build window", kind: "strength" },
      { id: "protein", title: "30g protein at breakfast", detail: "Stabilises insulin all day", kind: "protein", habit: "protein" },
      { id: "hydration", title: "Two litres of water", detail: "Energy follows hydration", kind: "hydration", habit: "water" },
    ],
    ovulatory: [
      { id: "social", title: "Send one bold message", detail: "Peak verbal day — use it", kind: "social" },
      { id: "cardio", title: "20 min cardio", detail: "Heart and skin both glow", kind: "cardio", habit: "walk" },
      { id: "protein", title: "Iron-rich lunch", detail: "Salmon, lentils, leafy greens", kind: "protein", habit: "protein" },
    ],
    luteal: [
      { id: "glucose", title: "Glucose-steady plate", detail: "Protein + fat first, carbs last", kind: "glucose", habit: "protein" },
      { id: "stress", title: "Two-minute box breathing", detail: "Tames the progesterone edge", kind: "stress", habit: "meditate" },
      { id: "strength", title: "Strength training, 25 min", detail: "Lighter than follicular — that's correct", kind: "strength" },
    ],
  };

  const list = base[phase].map((t) => ({ ...t }));
  if (hrvLow) {
    // Adaptive scaling: downgrade strength/cardio to a stretch.
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      if (t.kind === "strength" || t.kind === "cardio") {
        list[i] = {
          ...t,
          title: "10-minute stretch",
          detail: "Your HRV is low today",
          kind: "rest",
          habit: "stretch",
          scaledNote: "Downgraded from " + t.title.toLowerCase() + " to protect your nervous system. Streak preserved.",
        };
        break;
      }
    }
  }
  return list;
}
