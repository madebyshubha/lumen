import type { CyclePhase } from "@/constants/colors";

export type CycleState = {
  // Calendar phase computed from cycle length — what the average body would
  // be doing on this day. Kept for tasks/protocols/mood data that are
  // calibrated against the calendar phase.
  phase: CyclePhase;
  // Phase-Fluid Logic: the phase the UI actually shows. When the calendar
  // says "luteal" but no temperature rise has been detected in the last
  // ~10 days, we stay in a "holding" pattern instead of advancing into the
  // luteal dashboard — PCOS frequently means anovulatory cycles, and a fake
  // countdown to a period that isn't coming is the opposite of useful.
  effectivePhase: CyclePhase | "holding";
  ovulationConfirmed: boolean;
  // How many days past the calendar-expected ovulation day we are. Only
  // meaningful when effectivePhase === "holding".
  daysPastExpectedOvulation: number;
  dayOfCycle: number;
  cycleLength: number;
  daysToNextPeriod: number;
  nextPeriodDate: Date;
  lastPeriodDate: Date;
};

const DAY = 24 * 60 * 60 * 1000;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function diffDays(a: Date, b: Date): number {
  return Math.floor((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY);
}

export function addDays(d: Date, n: number): Date {
  return new Date(startOfDay(d).getTime() + n * DAY);
}

export function phaseForDay(day: number, cycleLength = 28): CyclePhase {
  // Required model (28-day cycle):
  //   menstrual:  days 1–5
  //   follicular: days 6–13
  //   ovulatory:  day 14 only
  //   luteal:     days 15–28
  // For non-28 cycles we keep the same proportions: scale ovulation to the
  // mid-point of the cycle and place a single-day ovulatory window there.
  const d = ((day - 1) % cycleLength) + 1;
  const ovulationDay = Math.round((cycleLength / 28) * 14);
  if (d <= 5) return "menstrual";
  if (d < ovulationDay) return "follicular";
  if (d === ovulationDay) return "ovulatory";
  return "luteal";
}

export function computeCycleState(
  lastPeriodISO: string,
  cycleLength = 28,
  today: Date = new Date(),
  health?: MockHealth | null,
): CycleState {
  const lastPeriod = startOfDay(new Date(lastPeriodISO));
  const t = startOfDay(today);
  const sinceStart = Math.max(0, diffDays(t, lastPeriod));
  const dayOfCycle = (sinceStart % cycleLength) + 1;
  const daysToNextPeriod = cycleLength - dayOfCycle + 1;
  const nextPeriodDate = addDays(lastPeriod, Math.ceil((sinceStart + 1) / cycleLength) * cycleLength);
  const calendarPhase = phaseForDay(dayOfCycle, cycleLength);

  // Phase-Fluid Logic: don't advance into the luteal dashboard unless the
  // overnight temperature data confirms ovulation actually happened.
  // Anchor to the *current* virtual cycle start so the detection window
  // doesn't drift after the first cycle wraps via modulo.
  const ovulationDay = Math.round((cycleLength / 28) * 14);
  const cyclesElapsed = Math.floor(sinceStart / cycleLength);
  const currentCycleStart = addDays(lastPeriod, cyclesElapsed * cycleLength);
  const expectedOvulation = addDays(currentCycleStart, ovulationDay - 1);
  const signal = health
    ? detectOvulation(health.samples, expectedOvulation, today)
    : { confirmed: true, daysSinceExpected: 0 };

  // Narrow gate: only the luteal dashboard is suppressed. Ovulatory day
  // itself still shows so the user gets the "energy is real today" UI
  // until/unless the next day's data fails to confirm a rise.
  const effectivePhase: CyclePhase | "holding" =
    calendarPhase === "luteal" && !signal.confirmed ? "holding" : calendarPhase;

  return {
    phase: calendarPhase,
    effectivePhase,
    ovulationConfirmed: signal.confirmed,
    daysPastExpectedOvulation: Math.max(0, signal.daysSinceExpected),
    dayOfCycle,
    cycleLength,
    daysToNextPeriod,
    nextPeriodDate,
    lastPeriodDate: lastPeriod,
  };
}

// Detect a sustained basal-body-temperature rise of ≥0.2°C over the last
// 3 days vs a 6-day baseline ending 3 days before expected ovulation.
// Returns { confirmed, daysSinceExpected }. With sparse coverage we
// conservatively report unconfirmed — Phase-Fluid Logic prefers a holding
// pattern over a wrong luteal countdown.
export function detectOvulation(
  samples: HealthSample[],
  expectedOvulation: Date,
  today: Date = new Date(),
): { confirmed: boolean; daysSinceExpected: number } {
  const t = startOfDay(today).getTime();
  const expectedT = startOfDay(expectedOvulation).getTime();
  const daysSinceExpected = Math.floor((t - expectedT) / DAY);

  // 6-day baseline window: [expected-8, expected-3] inclusive.
  const baseline = samples.filter((s) => {
    const st = startOfDay(new Date(s.date)).getTime();
    return st >= expectedT - 8 * DAY && st <= expectedT - 3 * DAY;
  });
  if (baseline.length < 4) return { confirmed: false, daysSinceExpected };
  const baselineMean =
    baseline.reduce((a, s) => a + s.bbt, 0) / baseline.length;

  // Need to be at least 2 days past expected ovulation before a rise can
  // register — and we want 3 days of recent samples to call it sustained.
  if (daysSinceExpected < 2) return { confirmed: false, daysSinceExpected };

  const recent = samples.filter((s) => {
    const st = startOfDay(new Date(s.date)).getTime();
    return st >= t - 2 * DAY && st <= t;
  });
  if (recent.length < 3) return { confirmed: false, daysSinceExpected };
  const recentMean = recent.reduce((a, s) => a + s.bbt, 0) / recent.length;

  return { confirmed: recentMean - baselineMean >= 0.2, daysSinceExpected };
}

export function phaseLabel(phase: CyclePhase): string {
  switch (phase) {
    case "menstrual":
      return "Menstrual";
    case "follicular":
      return "Follicular";
    case "ovulatory":
      return "Ovulatory";
    case "luteal":
      return "Luteal";
  }
}

// ----------------------------------------------------------------------------
// Mock HealthKit-shaped data (last 3 months). Same shape so it can be swapped
// later for real Apple HealthKit / Google Fit reads without touching the UI.
// ----------------------------------------------------------------------------

export type HealthSample = {
  date: string; // ISO date
  hrv: number; // ms
  restingHr: number; // bpm
  sleepHours: number;
  steps: number;
  // Basal body temperature in °C. Drives Phase-Fluid Logic — a sustained
  // ≥0.2°C rise after expected ovulation is what confirms ovulation. PCOS
  // women are frequently anovulatory, so this is the single field that lets
  // us avoid lying to her with a luteal countdown that won't arrive.
  bbt: number;
};

export type PeriodWindow = {
  start: string; // ISO
  end: string; // ISO
};

export type MockHealth = {
  periods: PeriodWindow[];
  samples: HealthSample[];
  todayHrv: number;
  todayHrvLow: boolean;
};

function seededRand(seed: number): () => number {
  let x = seed;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

export function generateMockHealth(
  lastPeriodISO: string,
  cycleLength = 28,
  today: Date = new Date(),
): MockHealth {
  const rand = seededRand(new Date(lastPeriodISO).getTime() % 1_000_000);
  const periods: PeriodWindow[] = [];
  const last = startOfDay(new Date(lastPeriodISO));
  for (let i = 0; i < 3; i++) {
    const start = addDays(last, -cycleLength * i);
    const end = addDays(start, 4);
    periods.unshift({ start: start.toISOString(), end: end.toISOString() });
  }

  const samples: HealthSample[] = [];
  for (let i = 90; i >= 0; i--) {
    const d = addDays(today, -i);
    const day = ((diffDays(d, last) % cycleLength) + cycleLength) % cycleLength + 1;
    const phase = phaseForDay(day, cycleLength);
    const baseHrv =
      phase === "follicular" ? 62 : phase === "ovulatory" ? 58 : phase === "luteal" ? 44 : 50;
    const hrv = Math.round(baseHrv + (rand() - 0.5) * 14);
    const restingHr = Math.round(64 + (phase === "luteal" ? 4 : 0) + (rand() - 0.5) * 6);
    const sleepHours = Math.round((6.5 + rand() * 2) * 10) / 10;
    const steps = Math.round(4500 + rand() * 6000);
    // Demo seed is anovulatory: BBT stays around 36.40°C all cycle, no
    // post-ovulation thermal shift. This is the headline PCOS scenario the
    // Phase-Fluid Logic was built for. When real wearable data lands the
    // shape stays the same; the values just come from the sensor.
    const bbt = Math.round((36.40 + (rand() - 0.5) * 0.08) * 100) / 100;
    samples.push({ date: d.toISOString(), hrv, restingHr, sleepHours, steps, bbt });
  }

  // Deterministic "restless last night" seed so the proactive morning brief
  // ("I checked your watch — last night was restless") always fires on first
  // open. This is the headline demo experience for Lumen — without it the
  // proactive-care card would only show some days. Real wearable data will
  // replace this when the HealthKit/Google Fit bridge lands.
  if (samples.length > 0) {
    const last = samples[samples.length - 1];
    samples[samples.length - 1] = {
      ...last,
      sleepHours: 5.4,
      hrv: Math.min(last.hrv, 39),
    };
  }

  const todayHrv = samples[samples.length - 1]?.hrv ?? 50;
  return { periods, samples, todayHrv, todayHrvLow: todayHrv < 42 };
}

export function isPeriodDay(date: Date, periods: PeriodWindow[]): boolean {
  const t = startOfDay(date).getTime();
  return periods.some(
    (p) => t >= startOfDay(new Date(p.start)).getTime() && t <= startOfDay(new Date(p.end)).getTime(),
  );
}
