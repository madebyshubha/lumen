import type { Task, TaskKind } from "@/lib/tasks";
import type { VibeDirective, VibeMood } from "@workspace/api-client-react";

// Layout config derived purely from mood + intensity. Centralised so the
// home screen and any other consumer share one source of truth.
export type VibeLayout = {
  hideKinds: TaskKind[];
  swapMovementToRest: boolean;
  showLean: boolean;
  showGentle: boolean;
  showCalendar: boolean;
  showNext7: boolean;
  showCycleStats: boolean;
  promoteLean: boolean; // for vibrant — render Lean-in above mission
  paletteIntensity: "soft" | "normal" | "punchy";
};

export const DEFAULT_LAYOUT: VibeLayout = {
  hideKinds: [],
  swapMovementToRest: false,
  showLean: true,
  showGentle: true,
  showCalendar: true,
  showNext7: true,
  showCycleStats: true,
  promoteLean: false,
  paletteIntensity: "normal",
};

export function layoutForMood(
  mood: VibeMood,
  intensity: 1 | 2 | 3,
): VibeLayout {
  switch (mood) {
    case "low": {
      // Stronger intensity → drop more, swap more.
      const strong = intensity >= 2;
      return {
        hideKinds: strong ? ["movement", "social"] : ["social"],
        swapMovementToRest: strong,
        showLean: false,
        showGentle: false,
        showCalendar: false,
        showNext7: false,
        showCycleStats: false,
        promoteLean: false,
        paletteIntensity: "soft",
      };
    }
    case "anxious":
      return {
        hideKinds: intensity >= 2 ? ["movement"] : [],
        swapMovementToRest: intensity >= 2,
        showLean: false,
        showGentle: false,
        showCalendar: true,
        showNext7: false,
        showCycleStats: true,
        promoteLean: false,
        paletteIntensity: "soft",
      };
    case "vibrant":
      return {
        hideKinds: [],
        swapMovementToRest: false,
        showLean: true,
        showGentle: true,
        showCalendar: true,
        showNext7: true,
        showCycleStats: true,
        promoteLean: true,
        paletteIntensity: "punchy",
      };
    case "steady":
    default:
      return DEFAULT_LAYOUT;
  }
}

// Apply the vibe directive on top of the existing generated tasks. Pure.
export function applyVibeToTasks(
  tasks: Task[],
  directive: VibeDirective | null,
): Task[] {
  if (!directive) return tasks;
  const layout = layoutForMood(
    directive.mood,
    Math.max(1, Math.min(3, Math.round(directive.intensity))) as 1 | 2 | 3,
  );

  let next: Task[] = tasks;

  // Drop denied kinds (preserve the post-meal walk — it's the keystone PCOS
  // habit and shouldn't disappear even on a low day).
  if (layout.hideKinds.length > 0) {
    next = next.filter(
      (t) => !layout.hideKinds.includes(t.kind) || t.id === "post-meal-walk",
    );
  }

  // Swap any remaining movement task (other than the post-meal walk) to a
  // restorative stretch so the user still gets a movement task to tick.
  if (layout.swapMovementToRest) {
    next = next.map((t) => {
      if (t.kind !== "movement" || t.id === "post-meal-walk") return t;
      return {
        ...t,
        title: "Restorative stretch, 8 min",
        detail: "Soft mobility — no force. Counts as your movement today.",
        kind: "rest",
        habit: "stretch",
        scaledNote: `Softened from "${t.title}" because of how you're feeling.`,
      };
    });
  }

  // Inject a vibe-driven micro-task at the top with critical priority so the
  // home renders it inside the mission section.
  if (directive.injectedTask) {
    const inj = directive.injectedTask;
    next = [
      {
        id: `vibe-${directive.mood}-${inj.kind}`,
        title: inj.title,
        detail: inj.detail,
        why: inj.why,
        kind: inj.kind,
        priority: "critical",
        scaledNote: "Added because of how you said you're feeling.",
      },
      ...next,
    ];
  }

  return next;
}
