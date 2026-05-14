import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { CyclePhase, PhasePalette } from "@/constants/colors";
import colors, { HOLDING_PALETTE } from "@/constants/colors";
import {
  computeCycleState,
  generateMockHealth,
  type CycleState,
  type MockHealth,
} from "@/lib/cycle";
import {
  EMPTY_CONTEXT,
  scoreMeal,
  type ActiveConcern,
  type ConcernKey,
  type CountryCode,
  type DailyContext,
  type Diet,
  type Meal,
  type MealSlot,
} from "@/lib/lifestyle";
import type { HabitTag, SymptomTag } from "@/lib/symptoms";
import { generateDailyTasks, type Task } from "@/lib/tasks";
import { offlineDirectiveForSentence, runVibeInterpret, type VibeResult } from "@/lib/vibe";
import { applyVibeToTasks } from "@/lib/vibeFilter";
import {
  buildProactiveBrief,
  effectiveDirective,
  type ProactiveBrief,
} from "@/lib/proactive";
import {
  bootstrapAuth,
  fetchMe,
  signOutServer,
  updateProfile as updateServerProfile,
  clearSession,
} from "@/lib/auth";
import type { UserProfile } from "@workspace/api-client-react";

const STORAGE_KEY = "lumen.state.v1";

export type Profile = {
  name: string;
  provider: "apple" | "google";
  energy: number; // 1-10
  diet: Diet;
  homeCountry: CountryCode;
  lastPeriodISO: string;
  cycleLength: number;
  createdAt: string;
  bestStreak?: number; // longest run of consecutive logged days
};

export type StreakInfo = {
  current: number; // consecutive logged days ending today (or yesterday if today is empty)
  best: number;
  loggedToday: boolean;
  last14: boolean[]; // newest-last; true = day had any activity
};

export type VentEntry = {
  id: string;
  text: string;
  symptoms: SymptomTag[];
  habits: HabitTag[];
  phase: CyclePhase;
  fix: string;
  createdAt: string;
  // LLM analysis fields (optional for backwards compatibility with older
  // entries persisted before the analyzer rolled out).
  headline?: string;
  explanation?: string;
  followUp?: { concern: ConcernKey; label: string } | null;
  analyzedOffline?: boolean;
};

export type ActivityLevel = "none" | "light" | "moderate" | "active";

export type DailyLog = {
  date: string; // YYYY-MM-DD
  waterCups: number;
  sleepHours: number;
  mood?: number; // 0..4 face index
  // Manual vitals — filled in by the user when no wearable is connected.
  // Energy 1–5: 1 = drained, 5 = buzzing. When ≤ 2 it overrides todayHrvLow
  // so HRV-adaptive task scaling kicks in without needing a watch.
  manualEnergy?: number;
  manualActivity?: ActivityLevel;
  completedTaskIds: string[];
  completedHabits: HabitTag[];
  context: DailyContext;
  // Proactive brief the user has dismissed for the day. Stored so the same
  // brief doesn't keep coming back if she taps "got it".
  dismissedBriefId?: string | null;
};

type Persisted = {
  profile: Profile | null;
  vents: VentEntry[];
  logs: Record<string, DailyLog>;
  vibe?: VibeResult | null;
};

type AppContextValue = {
  ready: boolean;
  profile: Profile | null;
  cycle: CycleState | null;
  health: MockHealth | null;
  palette: PhasePalette;
  vents: VentEntry[];
  todayLog: DailyLog;
  tasks: Task[];
  streak: StreakInfo;
  vibe: VibeResult | null;
  vibeLoading: boolean;
  applyVibe: (sentence: string) => Promise<void>;
  clearVibe: () => Promise<void>;
  morningBrief: ProactiveBrief | null;
  dismissMorningBrief: () => Promise<void>;
  // Directive that the home actually renders against — user vibe wins,
  // otherwise the (non-dismissed) morning brief reshapes the layout/tasks.
  activeDirective: import("@workspace/api-client-react").VibeDirective | null;
  completeOnboarding: (input: {
    name: string;
    provider: "apple" | "google";
    energy: number;
    diet: Diet;
    homeCountry: CountryCode;
  }) => Promise<void>;
  hydrateFromServerProfile: (user: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
  addVent: (entry: Omit<VentEntry, "id" | "createdAt">) => Promise<string>;
  updateVent: (id: string, partial: Partial<VentEntry>) => Promise<void>;
  setMood: (mood: number) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  addWater: (delta: number) => Promise<void>;
  setWater: (cups: number) => Promise<void>;
  addSleep: (delta: number) => Promise<void>;
  setSleep: (hours: number) => Promise<void>;
  setLocation: (location: string) => Promise<void>;
  setTravelling: (travelling: boolean, country?: CountryCode) => Promise<void>;
  addMeal: (slot: MealSlot, text: string) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
  addConcern: (key: ConcernKey) => Promise<void>;
  removeConcern: (key: ConcernKey) => Promise<void>;
  setManualEnergy: (level: number) => Promise<void>;
  setManualActivity: (activity: ActivityLevel) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

function todayKey(): string {
  return dateKey(new Date());
}

export function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function logHasActivity(log: DailyLog | undefined): boolean {
  if (!log) return false;
  if (log.mood !== undefined) return true;
  if (log.waterCups > 0) return true;
  if (log.sleepHours > 0) return true;
  if (log.manualEnergy !== undefined) return true;
  if (log.manualActivity !== undefined) return true;
  if (log.completedTaskIds.length > 0) return true;
  if (log.completedHabits.length > 0) return true;
  if (log.context.meals.length > 0) return true;
  if (log.context.concerns.length > 0) return true;
  return false;
}

function emptyLog(): DailyLog {
  return {
    date: todayKey(),
    waterCups: 0,
    sleepHours: 0,
    completedTaskIds: [],
    completedHabits: [],
    context: { ...EMPTY_CONTEXT },
  };
}

function newId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

function buildProfileFromServer(user: UserProfile): Profile {
  // Fall back to the same demo defaults the onboarding flow would have
  // written for any field the server doesn't yet have — keeps a returning
  // user on a working home screen even if their record is partial.
  const defaultPeriod = new Date();
  defaultPeriod.setDate(defaultPeriod.getDate() - 18);
  return {
    name: user.name ?? "friend",
    provider: user.provider === "google" ? "google" : "apple",
    energy: user.energy ?? 6,
    diet: ((user.diet as Diet | null) ?? "vegetarian") as Diet,
    homeCountry: ((user.homeCountry as CountryCode | null) ?? "IN") as CountryCode,
    lastPeriodISO: user.lastPeriodIso ?? defaultPeriod.toISOString(),
    cycleLength: user.cycleLength ?? 28,
    createdAt: user.onboardedAt
      ? new Date(user.onboardedAt).toISOString()
      : new Date().toISOString(),
  };
}

// Migrate older logs that didn't carry context/meals.
function hydrateLog(raw: Partial<DailyLog> & { date: string }): DailyLog {
  const base = emptyLog();
  return {
    ...base,
    ...raw,
    completedTaskIds: raw.completedTaskIds ?? [],
    completedHabits: raw.completedHabits ?? [],
    context: {
      travelling: raw.context?.travelling ?? false,
      location: raw.context?.location,
      travelCountry: raw.context?.travelCountry,
      meals: raw.context?.meals ?? [],
      concerns: raw.context?.concerns ?? [],
    },
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vents, setVents] = useState<VentEntry[]>([]);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [vibe, setVibe] = useState<VibeResult | null>(null);
  const [vibeLoading, setVibeLoading] = useState(false);

  // Bumped on signOut. Used by the persist effect to skip any pending write
  // whose payload was captured before the sign-out cleared state.
  const sessionRef = useRef(0);
  const lastWrittenSessionRef = useRef(0);
  // Serialises AsyncStorage writes so that concurrent setItem calls (e.g.
  // from rapid keystrokes in ContextStrip / MealLogger) cannot resolve out of
  // order and overwrite newer state with older.
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Hydrate once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Wire up the API client (base URL + bearer token) and load any
      // persisted session token before we read local app state. If there is
      // a token we also reach for /auth/me to pick up server-side profile
      // fields (in case the user reinstalled and lost local AsyncStorage).
      let serverUser: UserProfile | null = null;
      try {
        const token = await bootstrapAuth();
        if (token) {
          serverUser = await fetchMe();
        }
      } catch {
        // Network failure — fall back to local state only.
      }
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as Persisted;
          setProfile(parsed.profile ?? null);
          setVents(parsed.vents ?? []);
          const rehydrated: Record<string, DailyLog> = {};
          for (const [k, v] of Object.entries(parsed.logs ?? {})) {
            rehydrated[k] = hydrateLog(v as Partial<DailyLog> & { date: string });
          }
          setLogs(rehydrated);
          // Restore the vibe directive if it hasn't expired yet — the home
          // screen reshape persists across reloads but auto-clears after the
          // server-issued TTL passes.
          if (parsed.vibe && parsed.vibe.expiresAt) {
            const expiresMs = Date.parse(parsed.vibe.expiresAt);
            if (Number.isFinite(expiresMs) && expiresMs > Date.now()) {
              setVibe(parsed.vibe);
            }
          }
        }
      } catch {
        // ignore — start fresh
      } finally {
        if (!cancelled) {
          // If we have a fully-onboarded server profile but no local profile,
          // hydrate from the server response so a re-installed device or a
          // fresh web preview still feels signed-in.
          if (serverUser && serverUser.onboardedAt) {
            setProfile((current) => current ?? buildProfileFromServer(serverUser!));
          }
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Single persist effect; functional setState callbacks above can mutate
  // state without each one racing its own AsyncStorage write. Writes are
  // chained onto a queue so order is preserved and the final state of a
  // burst (typing, rapid taps) is always what lands in storage last.
  useEffect(() => {
    if (!ready) return;
    const session = sessionRef.current;
    if (session < lastWrittenSessionRef.current) return;
    const payload = JSON.stringify({ profile, vents, logs, vibe } satisfies Persisted);
    writeQueueRef.current = writeQueueRef.current
      .then(async () => {
        // Re-check session inside the queue: a sign-out scheduled after this
        // write was queued must still suppress the write.
        if (session < lastWrittenSessionRef.current) return;
        try {
          await AsyncStorage.setItem(STORAGE_KEY, payload);
          lastWrittenSessionRef.current = session;
        } catch {
          // ignore — next change retries
        }
      })
      // Swallow rejections so one failed link doesn't poison the chain.
      .catch(() => {});
  }, [ready, profile, vents, logs, vibe]);

  // Self-clear the vibe when its TTL passes while the app is open. Cheap
  // interval — the directive is small and the check is a single Date compare.
  useEffect(() => {
    if (!vibe) return;
    const expiresMs = Date.parse(vibe.expiresAt);
    if (!Number.isFinite(expiresMs)) return;
    const remaining = expiresMs - Date.now();
    if (remaining <= 0) {
      setVibe(null);
      return;
    }
    const timer = setTimeout(() => setVibe(null), remaining + 250);
    return () => clearTimeout(timer);
  }, [vibe]);

  const health = useMemo<MockHealth | null>(() => {
    if (!profile) return null;
    return generateMockHealth(profile.lastPeriodISO, profile.cycleLength);
  }, [profile]);

  const cycle = useMemo<CycleState | null>(() => {
    if (!profile) return null;
    // Pass health so Phase-Fluid Logic can read BBT and decide whether to
    // advance into luteal or stay in the holding pattern.
    return computeCycleState(
      profile.lastPeriodISO,
      profile.cycleLength,
      new Date(),
      health,
    );
  }, [profile, health]);

  const palette = useMemo<PhasePalette>(() => {
    if (!cycle) return colors.phases.luteal;
    if (cycle.effectivePhase === "holding") return HOLDING_PALETTE;
    return colors.phases[cycle.effectivePhase];
  }, [cycle]);

  const todayLog = useMemo<DailyLog>(() => {
    return logs[todayKey()] ?? emptyLog();
  }, [logs]);

  // Days that have any activity = log activity OR a vent posted that day.
  const activeDayKeys = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    for (const [k, v] of Object.entries(logs)) {
      if (logHasActivity(v)) set.add(k);
    }
    for (const v of vents) {
      set.add(dateKey(new Date(v.createdAt)));
    }
    return set;
  }, [logs, vents]);

  const streak = useMemo<StreakInfo>(() => {
    const today = new Date();
    const todayK = dateKey(today);
    const loggedToday = activeDayKeys.has(todayK);

    // Walk backwards from today (or yesterday if today is empty) until a gap.
    let cursor = new Date(today);
    if (!loggedToday) cursor.setDate(cursor.getDate() - 1);
    let current = 0;
    while (activeDayKeys.has(dateKey(cursor))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
      if (current > 999) break; // safety
    }

    // Last 14 days, oldest-first ending today.
    const last14: boolean[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last14.push(activeDayKeys.has(dateKey(d)));
    }

    const stored = profile?.bestStreak ?? 0;
    const best = Math.max(stored, current);
    return { current, best, loggedToday, last14 };
  }, [activeDayKeys, profile?.bestStreak]);

  // Persist a new best streak onto the profile so it survives missed days.
  useEffect(() => {
    if (!profile) return;
    if (streak.current > (profile.bestStreak ?? 0)) {
      setProfile((prev) => (prev ? { ...prev, bestStreak: streak.current } : prev));
    }
  }, [streak.current, profile]);

  // Proactive morning brief — derived from wearable + cycle data. Cached
  // for the day so repeated re-renders don't churn it.
  const morningBrief = useMemo<ProactiveBrief | null>(() => {
    return buildProactiveBrief({
      health,
      cycle,
      travelling: todayLog.context.travelling,
    });
  }, [health, cycle, todayLog.context.travelling]);

  // The directive the home actually renders against. User-driven vibe wins;
  // otherwise the (non-dismissed) morning brief drives layout + tasks.
  const activeDirective = useMemo(
    () => effectiveDirective(vibe, morningBrief, todayLog.dismissedBriefId),
    [vibe, morningBrief, todayLog.dismissedBriefId],
  );

  const tasks = useMemo<Task[]>(() => {
    if (!cycle || !profile) return [];
    // Manual energy ≤ 2 (drained/low) overrides the wearable HRV signal so
    // adaptive task scaling works even without a connected watch.
    const hrvLow =
      todayLog.manualEnergy !== undefined
        ? todayLog.manualEnergy <= 2
        : (health?.todayHrvLow ?? false);
    const base = generateDailyTasks({
      phase: cycle.phase,
      hrvLow,
      diet: profile.diet,
      homeCountry: profile.homeCountry,
      travelling: todayLog.context.travelling,
      travelCountry: todayLog.context.travelCountry,
      concerns: todayLog.context.concerns,
      holding: cycle.effectivePhase === "holding",
    });
    return applyVibeToTasks(base, activeDirective);
  }, [
    cycle,
    profile,
    health,
    todayLog.manualEnergy,
    todayLog.context.travelling,
    todayLog.context.travelCountry,
    todayLog.context.concerns,
    activeDirective,
  ]);

  const completeOnboarding: AppContextValue["completeOnboarding"] = useCallback(
    async ({ name, provider, energy, diet, homeCountry }) => {
      // Mocked HealthKit "sync": last period 12 days ago — places user in the
      // luteal phase for an interesting first impression.
      const lastPeriod = new Date();
      // Demo seed: 18 days ago places her at calendar-luteal day 19 with no
      // detected ovulation (mocked BBT stays flat), so the home opens in the
      // headline Phase-Fluid Logic state — a Holding Pattern instead of a
      // luteal countdown.
      lastPeriod.setDate(lastPeriod.getDate() - 18);
      const lastPeriodISO = lastPeriod.toISOString();

      // Persist interview answers to the server. We do this before the
      // local setProfile so a network failure surfaces as a thrown error
      // (caught by the onboarding screen) instead of leaving the device in
      // a half-signed-in state.
      await updateServerProfile({
        name,
        diet,
        homeCountry,
        energy,
        lastPeriodIso: lastPeriodISO,
        cycleLength: 28,
        onboarded: true,
      });

      setProfile({
        name,
        provider,
        energy,
        diet,
        homeCountry,
        lastPeriodISO,
        cycleLength: 28,
        createdAt: new Date().toISOString(),
      });
    },
    [],
  );

  const hydrateFromServerProfile: AppContextValue["hydrateFromServerProfile"] =
    useCallback(async (user) => {
      setProfile(buildProfileFromServer(user));
    }, []);

  const signOut: AppContextValue["signOut"] = useCallback(async () => {
    sessionRef.current += 1;
    lastWrittenSessionRef.current = sessionRef.current;
    setProfile(null);
    setVents([]);
    setLogs({});
    setVibe(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    // Bump the session version on the server (best-effort) and wipe the
    // bearer token from SecureStore so subsequent API calls go anonymous.
    try {
      await signOutServer();
    } catch {
      // Network failure — at minimum clear the local token so the app
      // doesn't keep sending a stale bearer.
      await clearSession();
    }
  }, []);

  const upsertTodayLog = useCallback((mutate: (log: DailyLog) => DailyLog) => {
    setLogs((prev) => {
      const k = todayKey();
      const current = prev[k] ?? emptyLog();
      return { ...prev, [k]: mutate(current) };
    });
  }, []);

  const dismissMorningBrief = useCallback(async () => {
    if (!morningBrief) return;
    upsertTodayLog((log) => ({ ...log, dismissedBriefId: morningBrief.id }));
  }, [morningBrief, upsertTodayLog]);

  // The vent-detected habit→task mapping: snapshot of the live-generated
  // tasks for the user's current state, used to mark matching task ids done.
  const matchHabitsToTaskIds = useCallback(
    (habits: HabitTag[]): string[] => {
      return tasks
        .filter((t) => t.habit && habits.includes(t.habit))
        .map((t) => t.id);
    },
    [tasks],
  );

  const addVent: AppContextValue["addVent"] = useCallback(
    async (entry) => {
      const v: VentEntry = { ...entry, id: newId(), createdAt: new Date().toISOString() };
      setVents((prev) => [v, ...prev].slice(0, 100));

      const newlyCompleted = matchHabitsToTaskIds(entry.habits);

      upsertTodayLog((log) => {
        const habits = Array.from(new Set([...log.completedHabits, ...entry.habits]));
        const completedTaskIds = Array.from(
          new Set([...log.completedTaskIds, ...newlyCompleted]),
        );
        const waterCups = entry.habits.includes("water")
          ? Math.min(12, log.waterCups + 1)
          : log.waterCups;
        return { ...log, completedHabits: habits, completedTaskIds, waterCups };
      });

      return v.id;
    },
    [upsertTodayLog, matchHabitsToTaskIds],
  );

  const updateVent: AppContextValue["updateVent"] = useCallback(
    async (id, partial) => {
      setVents((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...partial } : v)),
      );
    },
    [],
  );

  const setMood: AppContextValue["setMood"] = useCallback(
    async (mood) => {
      upsertTodayLog((log) => ({ ...log, mood }));
    },
    [upsertTodayLog],
  );

  const toggleTask: AppContextValue["toggleTask"] = useCallback(
    async (taskId) => {
      upsertTodayLog((log) => {
        const has = log.completedTaskIds.includes(taskId);
        const completedTaskIds = has
          ? log.completedTaskIds.filter((id) => id !== taskId)
          : [...log.completedTaskIds, taskId];
        return { ...log, completedTaskIds };
      });
    },
    [upsertTodayLog],
  );

  const addWater: AppContextValue["addWater"] = useCallback(
    async (delta) => {
      upsertTodayLog((log) => ({
        ...log,
        waterCups: Math.max(0, Math.min(12, log.waterCups + delta)),
      }));
    },
    [upsertTodayLog],
  );

  const setWater: AppContextValue["setWater"] = useCallback(
    async (cups) => {
      upsertTodayLog((log) => ({
        ...log,
        waterCups: Math.max(0, Math.min(12, Math.round(cups))),
      }));
    },
    [upsertTodayLog],
  );

  const addSleep: AppContextValue["addSleep"] = useCallback(
    async (delta) => {
      upsertTodayLog((log) => ({
        ...log,
        sleepHours: Math.max(0, Math.min(14, Math.round((log.sleepHours + delta) * 10) / 10)),
      }));
    },
    [upsertTodayLog],
  );

  const setSleep: AppContextValue["setSleep"] = useCallback(
    async (hours) => {
      upsertTodayLog((log) => ({
        ...log,
        sleepHours: Math.max(0, Math.min(14, Math.round(hours * 10) / 10)),
      }));
    },
    [upsertTodayLog],
  );

  const setLocation: AppContextValue["setLocation"] = useCallback(
    async (location) => {
      upsertTodayLog((log) => ({
        ...log,
        context: { ...log.context, location: location.trim() || undefined },
      }));
    },
    [upsertTodayLog],
  );

  const setTravelling: AppContextValue["setTravelling"] = useCallback(
    async (travelling, country) => {
      upsertTodayLog((log) => ({
        ...log,
        context: {
          ...log.context,
          travelling,
          travelCountry: travelling ? country ?? log.context.travelCountry : undefined,
        },
      }));
    },
    [upsertTodayLog],
  );

  const addMeal: AppContextValue["addMeal"] = useCallback(
    async (slot, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const meal: Meal = {
        id: newId(),
        slot,
        text: trimmed,
        loggedAt: new Date().toISOString(),
        score: scoreMeal(trimmed),
      };
      upsertTodayLog((log) => ({
        ...log,
        context: { ...log.context, meals: [meal, ...log.context.meals].slice(0, 20) },
      }));
    },
    [upsertTodayLog],
  );

  const removeMeal: AppContextValue["removeMeal"] = useCallback(
    async (id) => {
      upsertTodayLog((log) => ({
        ...log,
        context: { ...log.context, meals: log.context.meals.filter((m) => m.id !== id) },
      }));
    },
    [upsertTodayLog],
  );

  const addConcern: AppContextValue["addConcern"] = useCallback(
    async (key) => {
      upsertTodayLog((log) => {
        if (log.context.concerns.some((c) => c.key === key)) return log;
        const concern: ActiveConcern = { key, startedAt: new Date().toISOString() };
        return {
          ...log,
          context: { ...log.context, concerns: [...log.context.concerns, concern] },
        };
      });
    },
    [upsertTodayLog],
  );

  const applyVibe: AppContextValue["applyVibe"] = useCallback(
    async (sentence: string) => {
      const trimmed = sentence.trim();
      if (!trimmed || !cycle || !profile) return;
      // Capture the session at call time. If the user signs out while the
      // request is in flight, signOut() bumps sessionRef and we drop the late
      // response on the floor — no leaked vibe text written back to storage.
      const session = sessionRef.current;
      // Optimistic morph: classify offline immediately so the home reshapes
      // in <100ms. The network result then upgrades it in place (or is
      // dropped if the user signed out / cleared in the meantime).
      const optimistic = offlineDirectiveForSentence(trimmed);
      setVibe(optimistic);
      setVibeLoading(true);
      try {
        const result = await runVibeInterpret({
          sentence: trimmed,
          phase: cycle.phase,
          dayOfCycle: cycle.dayOfCycle,
          cycleLength: cycle.cycleLength,
          diet: profile.diet,
          homeCountry: profile.homeCountry,
          travelling: todayLog.context.travelling,
          travelCountry: todayLog.context.travelCountry ?? null,
          energy: profile.energy,
          trackedConcerns: todayLog.context.concerns.map((c) => c.key),
        });
        if (sessionRef.current !== session) return;
        setVibe(result);
      } finally {
        if (sessionRef.current === session) setVibeLoading(false);
      }
    },
    [
      cycle,
      profile,
      todayLog.context.travelling,
      todayLog.context.travelCountry,
      todayLog.context.concerns,
    ],
  );

  const clearVibe: AppContextValue["clearVibe"] = useCallback(async () => {
    setVibe(null);
  }, []);

  const removeConcern: AppContextValue["removeConcern"] = useCallback(
    async (key) => {
      upsertTodayLog((log) => ({
        ...log,
        context: { ...log.context, concerns: log.context.concerns.filter((c) => c.key !== key) },
      }));
    },
    [upsertTodayLog],
  );

  const setManualEnergy: AppContextValue["setManualEnergy"] = useCallback(
    async (level) => {
      upsertTodayLog((log) => ({
        ...log,
        manualEnergy: log.manualEnergy === level ? undefined : level,
      }));
    },
    [upsertTodayLog],
  );

  const setManualActivity: AppContextValue["setManualActivity"] = useCallback(
    async (activity) => {
      upsertTodayLog((log) => ({
        ...log,
        manualActivity: log.manualActivity === activity ? undefined : activity,
      }));
    },
    [upsertTodayLog],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      profile,
      cycle,
      health,
      palette,
      vents,
      todayLog,
      tasks,
      streak,
      vibe,
      vibeLoading,
      applyVibe,
      clearVibe,
      morningBrief,
      dismissMorningBrief,
      activeDirective,
      completeOnboarding,
      hydrateFromServerProfile,
      signOut,
      addVent,
      updateVent,
      setMood,
      toggleTask,
      addWater,
      setWater,
      addSleep,
      setSleep,
      setLocation,
      setTravelling,
      addMeal,
      removeMeal,
      addConcern,
      removeConcern,
      setManualEnergy,
      setManualActivity,
    }),
    [
      ready, profile, cycle, health, palette, vents, todayLog, tasks, streak,
      vibe, vibeLoading, applyVibe, clearVibe,
      completeOnboarding, hydrateFromServerProfile, signOut, addVent, updateVent, setMood, toggleTask,
      addWater, setWater, addSleep, setSleep,
      setLocation, setTravelling, addMeal, removeMeal, addConcern, removeConcern,
      setManualEnergy, setManualActivity,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function usePalette(): PhasePalette {
  return useApp().palette;
}
