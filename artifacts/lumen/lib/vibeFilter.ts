import type { Task } from "@/lib/tasks";
import type { VibeDirective, VibePaletteIntensity } from "@workspace/api-client-react";

// Layout config the home screen renders. Every field comes from the
// server-driven directive — this file only exists to fan it out into the
// few section flags the home toggles. No mood→layout heuristics here.
export type VibeLayout = {
  showLean: boolean;
  showGentle: boolean;
  showCalendar: boolean;
  showNext7: boolean;
  showCycleStats: boolean;
  promoteLean: boolean;
  paletteIntensity: VibePaletteIntensity;
};

export const DEFAULT_LAYOUT: VibeLayout = {
  showLean: true,
  showGentle: true,
  showCalendar: true,
  showNext7: true,
  showCycleStats: true,
  promoteLean: false,
  paletteIntensity: "normal",
};

// Map the server's simplifyLevel (0=full → 3=rest mode) onto which sections
// the home renders. Centralised so the level is the single knob.
export function layoutForDirective(directive: VibeDirective): VibeLayout {
  const level = Math.max(0, Math.min(3, directive.simplifyLevel));
  return {
    // Lean-in is a "bonus" section; first thing to drop.
    showLean: level <= 0 || directive.promoteLean,
    // "If you can" disappears at level 1+
    showGentle: level <= 0,
    // Calendar / next-7 / cycle stats survive at level 1, drop at 2+ so
    // low-mood (which the server returns at simplifyLevel 2) collapses the
    // whole bottom of the home, not just the bonus sections.
    showCalendar: level <= 1,
    showNext7: level <= 1,
    showCycleStats: level <= 1,
    promoteLean: directive.promoteLean,
    paletteIntensity: directive.paletteIntensity,
  };
}

// Apply the directive on top of the existing generated tasks. Pure.
// All filtering is server-driven: we read hideTaskKinds and swapMovementToRest
// from the directive itself, no per-mood exceptions.
export function applyVibeToTasks(
  tasks: Task[],
  directive: VibeDirective | null,
): Task[] {
  if (!directive) return tasks;

  let next: Task[] = tasks;

  if (directive.hideTaskKinds.length > 0) {
    const hide = new Set(directive.hideTaskKinds);
    next = next.filter((t) => !hide.has(t.kind));
  }

  if (directive.swapMovementToRest) {
    next = next.map((t) => {
      if (t.kind !== "movement") return t;
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
