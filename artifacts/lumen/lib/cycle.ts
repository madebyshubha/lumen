import type { CyclePhase } from "@/constants/colors";

export type CycleState = {
  phase: CyclePhase;
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
): CycleState {
  const lastPeriod = startOfDay(new Date(lastPeriodISO));
  const t = startOfDay(today);
  const sinceStart = Math.max(0, diffDays(t, lastPeriod));
  const dayOfCycle = (sinceStart % cycleLength) + 1;
  const daysToNextPeriod = cycleLength - dayOfCycle + 1;
  const nextPeriodDate = addDays(lastPeriod, Math.ceil((sinceStart + 1) / cycleLength) * cycleLength);
  return {
    phase: phaseForDay(dayOfCycle, cycleLength),
    dayOfCycle,
    cycleLength,
    daysToNextPeriod,
    nextPeriodDate,
    lastPeriodDate: lastPeriod,
  };
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
    samples.push({ date: d.toISOString(), hrv, restingHr, sleepHours, steps });
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
