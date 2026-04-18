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
import type { HabitTag, SymptomTag } from "@/lib/symptoms";

const STORAGE_KEY = "lumen.state.v1";

export type Profile = {
  name: string;
  provider: "apple" | "google";
  energy: number; // 1-10
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
  completeOnboarding: (input: { name: string; provider: "apple" | "google"; energy: number }) => Promise<void>;
  signOut: () => Promise<void>;
  addVent: (entry: Omit<VentEntry, "id" | "createdAt">) => Promise<void>;
  setMood: (mood: number) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  addWater: (delta: number) => Promise<void>;
  addSleep: (delta: number) => Promise<void>;
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
  };
}

function newId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vents, setVents] = useState<VentEntry[]>([]);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});

  // Session version: bumped on signOut so any stale persist writes started
  // before signOut are dropped instead of resurrecting cleared data.
  const sessionRef = useRef(0);

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
          setLogs(parsed.logs ?? {});
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

  // Persist whenever any tracked slice changes (after hydration). This
  // serialises writes through a single effect, so functional setState updates
  // can mutate state without each callback racing its own AsyncStorage write.
  useEffect(() => {
    if (!ready) return;
    const session = sessionRef.current;
    const payload: Persisted = { profile, vents, logs };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {
      // ignore — next change will retry
    });
    // If signOut bumped the session, any in-flight write from before is
    // already moot; the next effect tick will write the cleared payload.
    void session;
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

  const completeOnboarding: AppContextValue["completeOnboarding"] = useCallback(
    async ({ name, provider, energy }) => {
      // Mocked HealthKit "sync": last period 12 days ago — places user in the
      // luteal phase for an interesting first impression.
      const lastPeriod = new Date();
      lastPeriod.setDate(lastPeriod.getDate() - 12);
      setProfile({
        name,
        provider,
        energy,
        lastPeriodISO: lastPeriod.toISOString(),
        cycleLength: 28,
        createdAt: new Date().toISOString(),
      });
    },
    [],
  );

  const signOut: AppContextValue["signOut"] = useCallback(async () => {
    sessionRef.current += 1;
    setProfile(null);
    setVents([]);
    setLogs({});
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const upsertTodayLog = useCallback(
    (mutate: (log: DailyLog) => DailyLog) => {
      setLogs((prev) => {
        const k = todayKey();
        const current = prev[k] ?? emptyLog();
        return { ...prev, [k]: mutate(current) };
      });
    },
    [],
  );

  const addVent: AppContextValue["addVent"] = useCallback(
    async (entry) => {
      const v: VentEntry = { ...entry, id: newId(), createdAt: new Date().toISOString() };
      setVents((prev) => [v, ...prev].slice(0, 100));
      upsertTodayLog((log) => {
        const habits = Array.from(new Set([...log.completedHabits, ...entry.habits]));
        const waterCups = entry.habits.includes("water")
          ? Math.min(12, log.waterCups + 1)
          : log.waterCups;
        return { ...log, completedHabits: habits, waterCups };
      });
    },
    [upsertTodayLog],
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

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      profile,
      cycle,
      health,
      palette,
      vents,
      todayLog,
      completeOnboarding,
      signOut,
      addVent,
      setMood,
      toggleTask,
      addWater,
      addSleep,
    }),
    [ready, profile, cycle, health, palette, vents, todayLog, completeOnboarding, signOut, addVent, setMood, toggleTask, addWater, addSleep],
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
