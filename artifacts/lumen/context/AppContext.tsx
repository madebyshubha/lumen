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
import colors from "@/constants/colors";
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
};

export type VentEntry = {
  id: string;
  text: string;
  symptoms: SymptomTag[];
  habits: HabitTag[];
  phase: CyclePhase;
  fix: string;
  createdAt: string;
};

export type DailyLog = {
  date: string; // YYYY-MM-DD
  waterCups: number;
  sleepHours: number;
  mood?: number; // 0..4 face index
  completedTaskIds: string[];
  completedHabits: HabitTag[];
  context: DailyContext;
};

type Persisted = {
  profile: Profile | null;
  vents: VentEntry[];
  logs: Record<string, DailyLog>;
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
  completeOnboarding: (input: {
    name: string;
    provider: "apple" | "google";
    energy: number;
    diet: Diet;
    homeCountry: CountryCode;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  addVent: (entry: Omit<VentEntry, "id" | "createdAt">) => Promise<void>;
  setMood: (mood: number) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  addWater: (delta: number) => Promise<void>;
  addSleep: (delta: number) => Promise<void>;
  setLocation: (location: string) => Promise<void>;
  setTravelling: (travelling: boolean, country?: CountryCode) => Promise<void>;
  addMeal: (slot: MealSlot, text: string) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
  addConcern: (key: ConcernKey) => Promise<void>;
  removeConcern: (key: ConcernKey) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
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
        }
      } catch {
        // ignore — start fresh
      } finally {
        if (!cancelled) setReady(true);
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
    const payload = JSON.stringify({ profile, vents, logs } satisfies Persisted);
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
  }, [ready, profile, vents, logs]);

  const cycle = useMemo<CycleState | null>(() => {
    if (!profile) return null;
    return computeCycleState(profile.lastPeriodISO, profile.cycleLength);
  }, [profile]);

  const health = useMemo<MockHealth | null>(() => {
    if (!profile) return null;
    return generateMockHealth(profile.lastPeriodISO, profile.cycleLength);
  }, [profile]);

  const palette = useMemo<PhasePalette>(() => {
    return cycle ? colors.phases[cycle.phase] : colors.phases.luteal;
  }, [cycle]);

  const todayLog = useMemo<DailyLog>(() => {
    return logs[todayKey()] ?? emptyLog();
  }, [logs]);

  const tasks = useMemo<Task[]>(() => {
    if (!cycle || !profile) return [];
    return generateDailyTasks({
      phase: cycle.phase,
      hrvLow: health?.todayHrvLow ?? false,
      diet: profile.diet,
      homeCountry: profile.homeCountry,
      travelling: todayLog.context.travelling,
      travelCountry: todayLog.context.travelCountry,
      concerns: todayLog.context.concerns,
    });
  }, [
    cycle,
    profile,
    health,
    todayLog.context.travelling,
    todayLog.context.travelCountry,
    todayLog.context.concerns,
  ]);

  const completeOnboarding: AppContextValue["completeOnboarding"] = useCallback(
    async ({ name, provider, energy, diet, homeCountry }) => {
      // Mocked HealthKit "sync": last period 12 days ago — places user in the
      // luteal phase for an interesting first impression.
      const lastPeriod = new Date();
      lastPeriod.setDate(lastPeriod.getDate() - 12);
      setProfile({
        name,
        provider,
        energy,
        diet,
        homeCountry,
        lastPeriodISO: lastPeriod.toISOString(),
        cycleLength: 28,
        createdAt: new Date().toISOString(),
      });
    },
    [],
  );

  const signOut: AppContextValue["signOut"] = useCallback(async () => {
    sessionRef.current += 1;
    lastWrittenSessionRef.current = sessionRef.current;
    setProfile(null);
    setVents([]);
    setLogs({});
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const upsertTodayLog = useCallback((mutate: (log: DailyLog) => DailyLog) => {
    setLogs((prev) => {
      const k = todayKey();
      const current = prev[k] ?? emptyLog();
      return { ...prev, [k]: mutate(current) };
    });
  }, []);

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
    },
    [upsertTodayLog, matchHabitsToTaskIds],
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

  const addSleep: AppContextValue["addSleep"] = useCallback(
    async (delta) => {
      upsertTodayLog((log) => ({
        ...log,
        sleepHours: Math.max(0, Math.min(14, Math.round((log.sleepHours + delta) * 10) / 10)),
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

  const removeConcern: AppContextValue["removeConcern"] = useCallback(
    async (key) => {
      upsertTodayLog((log) => ({
        ...log,
        context: { ...log.context, concerns: log.context.concerns.filter((c) => c.key !== key) },
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
      completeOnboarding,
      signOut,
      addVent,
      setMood,
      toggleTask,
      addWater,
      addSleep,
      setLocation,
      setTravelling,
      addMeal,
      removeMeal,
      addConcern,
      removeConcern,
    }),
    [
      ready, profile, cycle, health, palette, vents, todayLog, tasks,
      completeOnboarding, signOut, addVent, setMood, toggleTask, addWater, addSleep,
      setLocation, setTravelling, addMeal, removeMeal, addConcern, removeConcern,
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
