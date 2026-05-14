// Real-wearable health bridge.
//
// Reads cycle, sleep, HRV, resting HR, steps, and basal body temperature
// from Apple HealthKit (iOS) and Android Health Connect, normalising the
// result into the same `MockHealth` shape the rest of the app already
// consumes through `lib/cycle.ts`. Phase-Fluid Logic, the morning brief,
// and HRV-adaptive task scaling don't need to know which platform — or
// whether the data came from a sensor at all.
//
// Loads the native modules with try/catch dynamic require so this file
// stays importable in Expo Go and on the web bundle (where the modules
// aren't autolinked). On those platforms `readHealthFromDevice` resolves
// to null and callers fall back to `generateMockHealth`.

import { Platform } from "react-native";

import {
  addDays,
  diffDays,
  startOfDay,
  type HealthSample,
  type MockHealth,
  type PeriodWindow,
} from "@/lib/cycle";

// The set of categories we ask for. Kept in one place so the onboarding
// permissions UX and the read path agree on what the user has agreed to.
export type HealthCategory =
  | "menstruation"
  | "hrv"
  | "restingHeartRate"
  | "sleep"
  | "steps"
  | "basalBodyTemperature";

export const HEALTH_CATEGORIES: { key: HealthCategory; label: string; detail: string }[] = [
  { key: "menstruation", label: "Period dates", detail: "Anchors the calendar phase to your real cycle." },
  { key: "basalBodyTemperature", label: "Basal body temperature", detail: "How Phase-Fluid Logic confirms ovulation actually happened." },
  { key: "hrv", label: "Heart rate variability", detail: "Drives adaptive task scaling on low-recovery days." },
  { key: "restingHeartRate", label: "Resting heart rate", detail: "Cross-checks HRV trends across the cycle." },
  { key: "sleep", label: "Sleep", detail: "Powers the morning brief when last night was restless." },
  { key: "steps", label: "Steps", detail: "Tells us when you're already moving and don't need a nudge." },
];

// Whether this build can talk to a real wearable bridge at all. Web and
// Expo Go return false — the AppContext uses this to skip the permissions
// step and silently fall back to the mock generator.
export function isHealthBridgeAvailable(): boolean {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "ios") return tryLoadHealthKit() != null;
  if (Platform.OS === "android") return tryLoadHealthConnect() != null;
  return false;
}

export type HealthPermissionResult = {
  granted: boolean;
  reason?: "unavailable" | "denied" | "error";
};

export async function requestHealthPermissions(): Promise<HealthPermissionResult> {
  if (Platform.OS === "ios") {
    const hk = tryLoadHealthKit();
    if (!hk) return { granted: false, reason: "unavailable" };
    return await requestHealthKitPermissions(hk);
  }
  if (Platform.OS === "android") {
    const hc = tryLoadHealthConnect();
    if (!hc) return { granted: false, reason: "unavailable" };
    return await requestHealthConnectPermissions(hc);
  }
  return { granted: false, reason: "unavailable" };
}

// Returns null when the bridge isn't available or the read fails — caller
// falls back to the mock generator. Returns a fully-populated MockHealth
// when at least the period and one daily sample category came through.
export async function readHealthFromDevice(
  cycleLength: number,
  today: Date = new Date(),
): Promise<MockHealth | null> {
  if (Platform.OS === "ios") {
    const hk = tryLoadHealthKit();
    if (!hk) return null;
    try {
      return await readHealthKit(hk, cycleLength, today);
    } catch {
      return null;
    }
  }
  if (Platform.OS === "android") {
    const hc = tryLoadHealthConnect();
    if (!hc) return null;
    try {
      return await readHealthConnect(hc, cycleLength, today);
    } catch {
      return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// iOS — Apple HealthKit via react-native-health
// ---------------------------------------------------------------------------

type HealthKitModule = {
  default: {
    Constants: {
      Permissions: Record<string, string>;
    };
    initHealthKit: (perms: unknown, cb: (err: string | null) => void) => void;
    getHeartRateVariabilitySamples: (opts: unknown, cb: (err: string | null, results: { startDate: string; value: number }[]) => void) => void;
    getRestingHeartRateSamples: (opts: unknown, cb: (err: string | null, results: { startDate: string; value: number }[]) => void) => void;
    getSleepSamples: (opts: unknown, cb: (err: string | null, results: { startDate: string; endDate: string; value: string }[]) => void) => void;
    getDailyStepCountSamples: (opts: unknown, cb: (err: string | null, results: { startDate: string; value: number }[]) => void) => void;
    getMenstruationSamples: (opts: unknown, cb: (err: string | null, results: { startDate: string; endDate: string; value: number }[]) => void) => void;
    getBasalBodyTemperatureSamples?: (opts: unknown, cb: (err: string | null, results: { startDate: string; value: number }[]) => void) => void;
  };
};

function tryLoadHealthKit(): HealthKitModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-health") as HealthKitModule;
  } catch {
    return null;
  }
}

async function requestHealthKitPermissions(mod: HealthKitModule): Promise<HealthPermissionResult> {
  const AppleHealthKit = mod.default;
  const P = AppleHealthKit.Constants.Permissions;
  const perms = {
    permissions: {
      read: [
        P.MenstruationFlow,
        P.HeartRateVariability,
        P.RestingHeartRate,
        P.SleepAnalysis,
        P.StepCount,
        P.BasalBodyTemperature,
      ].filter(Boolean),
      write: [],
    },
  };
  return await new Promise((resolve) => {
    AppleHealthKit.initHealthKit(perms, (err) => {
      if (err) resolve({ granted: false, reason: "denied" });
      else resolve({ granted: true });
    });
  });
}

function hkCall<T>(
  fn: ((opts: unknown, cb: (err: string | null, results: T[]) => void) => void) | undefined,
  opts: unknown,
): Promise<T[]> {
  if (!fn) return Promise.resolve([]);
  return new Promise((resolve) => {
    fn(opts, (err, results) => {
      if (err) resolve([]);
      else resolve(results ?? []);
    });
  });
}

async function readHealthKit(
  mod: HealthKitModule,
  cycleLength: number,
  today: Date,
): Promise<MockHealth | null> {
  const AppleHealthKit = mod.default;
  // HealthKit requires `initHealthKit` to have been called before any
  // read can succeed. We call it silently on every read so that a cold
  // start after the user already granted access at onboarding still
  // works — iOS only shows the system prompt the first time per
  // category per install, so re-calling is a no-op for already-decided
  // categories. If the user denied, reads simply return empty arrays
  // and assembleHealth() returns null → caller falls back to the mock.
  await new Promise<void>((resolve) => {
    const P = AppleHealthKit.Constants.Permissions;
    const perms = {
      permissions: {
        read: [
          P.MenstruationFlow,
          P.HeartRateVariability,
          P.RestingHeartRate,
          P.SleepAnalysis,
          P.StepCount,
          P.BasalBodyTemperature,
        ].filter(Boolean),
        write: [],
      },
    };
    AppleHealthKit.initHealthKit(perms, () => resolve());
  });
  // 90-day window matches the mock generator and gives the BBT detector
  // a comfortable baseline.
  const startDate = addDays(today, -90).toISOString();
  const endDate = today.toISOString();
  const opts = { startDate, endDate, ascending: true };

  const [menstruationRaw, hrvRaw, rhrRaw, sleepRaw, stepsRaw, bbtRaw] = await Promise.all([
    hkCall(AppleHealthKit.getMenstruationSamples, opts),
    hkCall(AppleHealthKit.getHeartRateVariabilitySamples, opts),
    hkCall(AppleHealthKit.getRestingHeartRateSamples, opts),
    hkCall(AppleHealthKit.getSleepSamples, opts),
    hkCall(AppleHealthKit.getDailyStepCountSamples, opts),
    hkCall(AppleHealthKit.getBasalBodyTemperatureSamples, opts),
  ]);

  const periods = collapsePeriodWindows(
    (menstruationRaw as { startDate: string; endDate: string; value: number }[])
      .filter((s) => s.value > 0)
      .map((s) => ({ start: s.startDate, end: s.endDate || s.startDate })),
  );

  // HealthKit HRV is in seconds (SDNN). The rest of the app uses ms.
  const hrvByDay = bucketDailyMean(
    (hrvRaw as { startDate: string; value: number }[]).map((s) => ({
      date: s.startDate,
      value: s.value * 1000,
    })),
  );
  const rhrByDay = bucketDailyMean(
    (rhrRaw as { startDate: string; value: number }[]).map((s) => ({
      date: s.startDate,
      value: s.value,
    })),
  );
  const stepsByDay = bucketDailySum(
    (stepsRaw as { startDate: string; value: number }[]).map((s) => ({
      date: s.startDate,
      value: s.value,
    })),
  );
  const bbtByDay = bucketDailyMean(
    (bbtRaw as { startDate: string; value: number }[]).map((s) => ({
      date: s.startDate,
      value: s.value,
    })),
  );

  // HealthKit's SleepAnalysis values: "INBED", "ASLEEP", "AWAKE", or
  // sleep-stage values (CORE/DEEP/REM) on iOS 16+. Anything that isn't
  // strictly awake counts toward total sleep duration for the night the
  // sample's start date falls in.
  const sleepByDay = sleepDurationByDay(
    sleepRaw as { startDate: string; endDate: string; value: string }[],
  );

  return assembleHealth({
    periods,
    hrvByDay,
    rhrByDay,
    sleepByDay,
    stepsByDay,
    bbtByDay,
    cycleLength,
    today,
  });
}

// ---------------------------------------------------------------------------
// Android — Health Connect via react-native-health-connect
// ---------------------------------------------------------------------------

type HealthConnectModule = {
  initialize: () => Promise<boolean>;
  requestPermission: (perms: { accessType: "read"; recordType: string }[]) => Promise<{ recordType: string }[]>;
  getGrantedPermissions: () => Promise<{ recordType: string }[]>;
  readRecords: (recordType: string, options: unknown) => Promise<{ records: unknown[] }>;
};

function tryLoadHealthConnect(): HealthConnectModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-health-connect") as HealthConnectModule;
  } catch {
    return null;
  }
}

const HC_RECORD_TYPES = [
  "MenstruationPeriod",
  "MenstruationFlow",
  "HeartRateVariabilityRmssd",
  "RestingHeartRate",
  "SleepSession",
  "Steps",
  "BasalBodyTemperature",
] as const;

async function requestHealthConnectPermissions(mod: HealthConnectModule): Promise<HealthPermissionResult> {
  try {
    const ok = await mod.initialize();
    if (!ok) return { granted: false, reason: "unavailable" };
    const granted = await mod.requestPermission(
      HC_RECORD_TYPES.map((recordType) => ({ accessType: "read" as const, recordType })),
    );
    return { granted: granted.length > 0 };
  } catch {
    return { granted: false, reason: "error" };
  }
}

async function hcRead(mod: HealthConnectModule, recordType: string, startTime: string, endTime: string): Promise<unknown[]> {
  try {
    const res = await mod.readRecords(recordType, {
      timeRangeFilter: { operator: "between", startTime, endTime },
    });
    return res?.records ?? [];
  } catch {
    return [];
  }
}

async function readHealthConnect(
  mod: HealthConnectModule,
  cycleLength: number,
  today: Date,
): Promise<MockHealth | null> {
  await mod.initialize().catch(() => false);
  const startTime = addDays(today, -90).toISOString();
  const endTime = today.toISOString();

  const [periodRecords, flowRecords, hrvRecords, rhrRecords, sleepRecords, stepsRecords, bbtRecords] = await Promise.all([
    hcRead(mod, "MenstruationPeriod", startTime, endTime),
    hcRead(mod, "MenstruationFlow", startTime, endTime),
    hcRead(mod, "HeartRateVariabilityRmssd", startTime, endTime),
    hcRead(mod, "RestingHeartRate", startTime, endTime),
    hcRead(mod, "SleepSession", startTime, endTime),
    hcRead(mod, "Steps", startTime, endTime),
    hcRead(mod, "BasalBodyTemperature", startTime, endTime),
  ]);

  // Period windows: prefer the explicit MenstruationPeriod record if it
  // exists (Android 14+); otherwise stitch consecutive flow days into
  // windows so older devices still light up the calendar.
  const periodsFromExplicit = (periodRecords as { startTime: string; endTime: string }[])
    .map((r) => ({ start: r.startTime, end: r.endTime }));
  const periodsFromFlow = collapsePeriodWindows(
    (flowRecords as { time: string; flow?: number }[])
      .filter((r) => (r.flow ?? 1) > 0)
      .map((r) => ({ start: r.time, end: r.time })),
  );
  const periods = periodsFromExplicit.length > 0 ? periodsFromExplicit : periodsFromFlow;

  const hrvByDay = bucketDailyMean(
    (hrvRecords as { time: string; heartRateVariabilityMillis: number }[]).map((r) => ({
      date: r.time,
      value: r.heartRateVariabilityMillis,
    })),
  );
  const rhrByDay = bucketDailyMean(
    (rhrRecords as { time: string; beatsPerMinute: number }[]).map((r) => ({
      date: r.time,
      value: r.beatsPerMinute,
    })),
  );
  const stepsByDay = bucketDailySum(
    (stepsRecords as { startTime: string; count: number }[]).map((r) => ({
      date: r.startTime,
      value: r.count,
    })),
  );
  const bbtByDay = bucketDailyMean(
    (bbtRecords as { time: string; temperature: { inCelsius: number } }[]).map((r) => ({
      date: r.time,
      value: r.temperature?.inCelsius ?? 0,
    })),
  );
  const sleepByDay = sleepDurationByDay(
    (sleepRecords as { startTime: string; endTime: string }[]).map((s) => ({
      startDate: s.startTime,
      endDate: s.endTime,
      value: "ASLEEP",
    })),
  );

  return assembleHealth({
    periods,
    hrvByDay,
    rhrByDay,
    sleepByDay,
    stepsByDay,
    bbtByDay,
    cycleLength,
    today,
  });
}

// ---------------------------------------------------------------------------
// Shared assembly
// ---------------------------------------------------------------------------

function dayKey(d: Date): string {
  return startOfDay(d).toISOString();
}

function bucketDailyMean(items: { date: string; value: number }[]): Map<string, number> {
  const acc = new Map<string, { sum: number; n: number }>();
  for (const it of items) {
    if (!Number.isFinite(it.value)) continue;
    const k = dayKey(new Date(it.date));
    const cur = acc.get(k) ?? { sum: 0, n: 0 };
    cur.sum += it.value;
    cur.n += 1;
    acc.set(k, cur);
  }
  const out = new Map<string, number>();
  for (const [k, v] of acc) out.set(k, v.sum / v.n);
  return out;
}

function bucketDailySum(items: { date: string; value: number }[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const it of items) {
    if (!Number.isFinite(it.value)) continue;
    const k = dayKey(new Date(it.date));
    out.set(k, (out.get(k) ?? 0) + it.value);
  }
  return out;
}

// Sleep is attributed to the calendar day the user *woke up* on (the
// sample's end date), so a 23:00–07:00 night counts toward the morning
// the home screen actually opens.
function sleepDurationByDay(
  samples: { startDate: string; endDate: string; value: string }[],
): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of samples) {
    if (s.value && s.value.toUpperCase() === "AWAKE") continue;
    const start = new Date(s.startDate).getTime();
    const end = new Date(s.endDate).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    const hours = (end - start) / (60 * 60 * 1000);
    const k = dayKey(new Date(s.endDate));
    out.set(k, (out.get(k) ?? 0) + hours);
  }
  // Round to one decimal to match the mock shape callers expect.
  for (const [k, v] of out) out.set(k, Math.round(v * 10) / 10);
  return out;
}

// Stitches consecutive (or near-consecutive) flow days into period windows.
// Anything within 2 days of the previous flow sample joins the same window.
function collapsePeriodWindows(
  rawWindows: { start: string; end: string }[],
): PeriodWindow[] {
  if (rawWindows.length === 0) return [];
  const sorted = rawWindows
    .map((w) => ({
      start: startOfDay(new Date(w.start)),
      end: startOfDay(new Date(w.end)),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const out: { start: Date; end: Date }[] = [];
  for (const w of sorted) {
    const prev = out[out.length - 1];
    if (prev && diffDays(w.start, prev.end) <= 2) {
      if (w.end.getTime() > prev.end.getTime()) prev.end = w.end;
    } else {
      out.push({ ...w });
    }
  }
  return out.map((w) => ({ start: w.start.toISOString(), end: w.end.toISOString() }));
}

function assembleHealth(input: {
  periods: PeriodWindow[];
  hrvByDay: Map<string, number>;
  rhrByDay: Map<string, number>;
  sleepByDay: Map<string, number>;
  stepsByDay: Map<string, number>;
  bbtByDay: Map<string, number>;
  cycleLength: number;
  today: Date;
}): MockHealth | null {
  const { periods, hrvByDay, rhrByDay, sleepByDay, stepsByDay, bbtByDay, today } = input;

  // If the sensor returned literally nothing across every category, treat
  // the read as a miss and let the caller fall back to the mock generator.
  const anyData =
    periods.length > 0 ||
    hrvByDay.size > 0 ||
    rhrByDay.size > 0 ||
    sleepByDay.size > 0 ||
    stepsByDay.size > 0 ||
    bbtByDay.size > 0;
  if (!anyData) return null;

  const samples: HealthSample[] = [];
  for (let i = 90; i >= 0; i--) {
    const d = addDays(today, -i);
    const k = dayKey(d);
    samples.push({
      date: d.toISOString(),
      hrv: round(hrvByDay.get(k) ?? 0),
      restingHr: round(rhrByDay.get(k) ?? 0),
      sleepHours: sleepByDay.get(k) ?? 0,
      steps: round(stepsByDay.get(k) ?? 0),
      bbt: round2(bbtByDay.get(k) ?? 0),
    });
  }

  // Today's HRV: take the most recent non-zero reading rather than
  // strictly today's, so a watch that hasn't synced yet doesn't make the
  // morning brief think recovery has cratered.
  let todayHrv = 0;
  for (let i = samples.length - 1; i >= 0; i--) {
    if (samples[i].hrv > 0) {
      todayHrv = samples[i].hrv;
      break;
    }
  }

  return {
    periods,
    samples,
    todayHrv,
    todayHrvLow: todayHrv > 0 && todayHrv < 42,
  };
}

function round(n: number): number {
  return Math.round(n);
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
