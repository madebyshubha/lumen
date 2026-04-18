// Proactive morning briefing.
//
// On open we look at last night's wearable signals + cycle context and
// (a) generate a short human briefing the home screen shows above the fold,
// (b) emit a partial VibeDirective that flows through the existing
//     applyVibeToTasks pipeline so the home actually reshapes — not just
//     talks about reshaping.
//
// One brief per day, deterministic id (so dismissal sticks). User-driven
// vibe always wins over the brief.

import type { VibeDirective } from "@workspace/api-client-react";

import type { CycleState, MockHealth } from "@/lib/cycle";

export type ProactiveBrief = {
  id: string;
  reason: "restless-night" | "period-day-1" | "ovulation-window" | "travelling";
  title: string;
  detail: string;
  bullets: string[];
  directive: VibeDirective;
};

const TTL_HOURS = 12;

// Local YYYY-MM-DD — must match AppContext's dateKey() so that brief ids
// generated here line up with the dismissal key stored on the local-day
// log. Using toISOString().slice(0,10) here would shift the brief across
// the UTC boundary while the log key stayed on local time, causing dismissed
// briefs to silently reappear in the evening.
function localDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function buildProactiveBrief(input: {
  health: MockHealth | null;
  cycle: CycleState | null;
  travelling: boolean;
}): ProactiveBrief | null {
  const { health, cycle, travelling } = input;
  if (!health || !cycle) return null;
  const holding = cycle.effectivePhase === "holding";

  const today = new Date();
  const day = localDay(today);
  const expiresAt = new Date(
    Date.now() + TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();

  // Last night's sleep is the most recent sample in the mocked stream.
  const last = health.samples[health.samples.length - 1];
  const lastSleep = last?.sleepHours ?? 0;
  const restless =
    (lastSleep > 0 && lastSleep < 6.0) || health.todayHrvLow;

  // Order matters: most acute signal first.
  if (restless) {
    return {
      id: `brief:${day}:restless`,
      reason: "restless-night",
      title: "I checked your overnight data — last night was restless",
      detail:
        lastSleep > 0
          ? `You slept ${lastSleep.toFixed(1)}h${
              health.todayHrvLow ? ` and HRV is down (${health.todayHrv}ms)` : ""
            }.`
          : `HRV is down (${health.todayHrv}ms) — your nervous system is tired.`,
      bullets: [
        "Moved your workout to tomorrow.",
        "Made hydration today's main goal.",
        "Softened the rest of the mission.",
      ],
      directive: {
        mood: "low",
        intensity: 2,
        headline: "Pulling back today so you can recover. Tomorrow we push.",
        explanation:
          "Low overnight recovery — pushing through it would set you back two more days.",
        pillLabel: "Recovery mode",
        missionTitle: "Recover, don't push",
        missionSub: "Tonight matters more",
        streakNote: "We're holding your streak today — anything counts.",
        injectedTask: {
          title: "Drink 8 cups of water",
          detail:
            "Tap a drop in the Water card every cup. Aim to be done by 6pm.",
          why: "After a low-recovery night, hydration is the single biggest lever — it lifts HRV, drops cortisol, and restores energy faster than anything else you can do today.",
          kind: "hydration",
        },
        simplifyLevel: 2,
        hideTaskKinds: ["movement", "social"],
        swapMovementToRest: true,
        promoteLean: false,
        paletteIntensity: "soft",
        expiresAt,
      },
    };
  }

  if (holding) {
    return {
      id: `brief:${day}:holding`,
      reason: "ovulation-window",
      title: "Your temperature hasn't risen — staying in holding pattern",
      detail: `${cycle.daysPastExpectedOvulation} day${
        cycle.daysPastExpectedOvulation === 1 ? "" : "s"
      } past expected ovulation, no thermal shift yet. I'm not going to count down to a period that may not be coming.`,
      bullets: [
        "Today's mission is insulin sensitivity, not luteal prep.",
        "Promoted strength + a nervous-system reset.",
        "Hidden the period countdown — it's not real until your body says so.",
      ],
      directive: {
        mood: "steady",
        intensity: 1,
        headline: "Holding pattern. Insulin and stress are the levers right now.",
        explanation:
          "PCOS often means anovulatory cycles. Pretending we're luteal would have us bracing for a crash that isn't coming and missing the actual lever — insulin sensitivity is what restores ovulation.",
        pillLabel: "Holding pattern",
        missionTitle: "Insulin and stress",
        missionSub: "The two levers that bring ovulation back",
        streakNote: "Holding your streak — every small move counts here.",
        injectedTask: {
          title: "10-minute walk after every meal today",
          detail: "Short walks within 30 min of eating. Three of them.",
          why: "Post-meal walks lower glucose 17–22%. Repeat insulin spikes are exactly what's keeping ovulation suppressed.",
          kind: "movement",
        },
        simplifyLevel: 1,
        hideTaskKinds: [],
        swapMovementToRest: false,
        promoteLean: false,
        paletteIntensity: "normal",
        expiresAt,
      },
    };
  }

  if (cycle.dayOfCycle === 1 || cycle.dayOfCycle === 2) {
    return {
      id: `brief:${day}:period`,
      reason: "period-day-1",
      title: "Day one of your period — I softened today",
      detail: "Cramps and fatigue peak now. We're keeping it gentle.",
      bullets: [
        "Hidden the bonus tasks.",
        "Swapped your workout for restorative stretching.",
        "Added warmth and iron to your meals.",
      ],
      directive: {
        mood: "low",
        intensity: 2,
        headline: "First day. Today is rest, warmth, and iron — not output.",
        explanation: "Energy and pain hit hardest on day one of your cycle.",
        pillLabel: "Period day one",
        missionTitle: "Just three soft things",
        missionSub: "Gentle, no pressure",
        streakNote: "We're holding your streak today.",
        injectedTask: {
          title: "Warm compress + 10 min lying down",
          detail: "Heat on your lower belly. Phone face-down. Just 10 minutes.",
          why: "Heat reduces prostaglandin-driven cramping in the smooth muscle of the uterus.",
          kind: "rest",
        },
        simplifyLevel: 2,
        hideTaskKinds: ["movement", "social"],
        swapMovementToRest: true,
        promoteLean: false,
        paletteIntensity: "soft",
        expiresAt,
      },
    };
  }

  if (cycle.phase === "ovulatory") {
    return {
      id: `brief:${day}:ovulation`,
      reason: "ovulation-window",
      title: "You're in your ovulation window",
      detail: "Energy and strength peak now. Don't waste this.",
      bullets: [
        "Promoted your phase-tuned tasks.",
        "Added a strength stretch goal.",
      ],
      directive: {
        mood: "vibrant",
        intensity: 2,
        headline: "Ovulation. Energy is real today — let's land it on muscle.",
        explanation:
          "Ovulatory phase is the highest-output window of your cycle for PCOS.",
        pillLabel: "Ovulation push",
        missionTitle: "Push today",
        missionSub: "Energy is a window",
        streakNote: null,
        injectedTask: {
          title: "Add ten minutes of strength",
          detail: "Tag it onto your workout — squats, push-ups, anything heavy.",
          why: "Lean muscle is the single biggest lever for PCOS insulin sensitivity.",
          kind: "movement",
        },
        simplifyLevel: 0,
        hideTaskKinds: [],
        swapMovementToRest: false,
        promoteLean: true,
        paletteIntensity: "punchy",
        expiresAt,
      },
    };
  }

  if (travelling) {
    return {
      id: `brief:${day}:travel`,
      reason: "travelling",
      title: "You're travelling — I retuned today",
      detail: "Sleep, water and meals all shift on travel days.",
      bullets: [
        "Bumped your hydration target.",
        "Adjusted meals to what you'll find locally.",
      ],
      directive: {
        mood: "steady",
        intensity: 1,
        headline: "Travel day. Keeping it simple — hydrate, eat steady, sleep.",
        explanation: "Travel disrupts circadian rhythm and insulin response.",
        pillLabel: "Travel mode",
        missionTitle: "Travel basics",
        missionSub: "Three solid moves",
        streakNote: null,
        injectedTask: {
          title: "Drink an extra 2 cups of water",
          detail: "Cabin air, new climate. Use the Water card as you go.",
          why: "Even mild travel-day dehydration tanks energy and worsens PCOS bloating.",
          kind: "hydration",
        },
        simplifyLevel: 1,
        hideTaskKinds: [],
        swapMovementToRest: false,
        promoteLean: false,
        paletteIntensity: "normal",
        expiresAt,
      },
    };
  }

  return null;
}

// Used by AppContext to merge: user-driven vibe always wins; otherwise the
// brief's directive flows through layout / task filtering.
export function effectiveDirective(
  vibe: VibeDirective | null,
  brief: ProactiveBrief | null,
  briefDismissedId: string | null | undefined,
): VibeDirective | null {
  if (vibe) return vibe;
  if (!brief) return null;
  if (briefDismissedId === brief.id) return null;
  return brief.directive;
}

