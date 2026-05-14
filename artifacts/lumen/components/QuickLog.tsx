import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState, type ReactElement } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { useApp, usePalette, type ActivityLevel } from "@/context/AppContext";
import { isVoiceAvailable, startVoice, type VoiceSession } from "@/lib/voice";

// ─── Shared mic pill ────────────────────────────────────────────────────────

function MicPill({
  listening,
  onPress,
}: {
  listening: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (listening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.setValue(0);
    }
  }, [listening, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <View style={mic.wrap}>
      {listening ? (
        <Animated.View
          style={[
            mic.ring,
            {
              backgroundColor: palette.accent,
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />
      ) : null}
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={({ pressed }) => [
          mic.btn,
          {
            backgroundColor: listening ? palette.accent : palette.surfaceMuted,
            borderColor: listening ? palette.accent : palette.glassBorder,
            transform: [{ scale: pressed ? 0.92 : 1 }],
          },
        ]}
      >
        <Feather
          name={listening ? "square" : "mic"}
          size={13}
          color={listening ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.primary}
        />
      </Pressable>
    </View>
  );
}

const mic = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: 32, height: 32, borderRadius: 16 },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Voice hook ──────────────────────────────────────────────────────────────

function useVoice(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const sessionRef = useRef<VoiceSession | null>(null);
  const available = isVoiceAvailable();

  const stop = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setListening(false);
  };

  const toggle = () => {
    if (listening) { stop(); return; }
    const session = startVoice({
      onPartial: () => {},
      onFinal: (text) => { if (text.trim()) onTranscript(text.trim()); },
      onError: () => { setListening(false); sessionRef.current = null; },
      onEnd: () => { setListening(false); sessionRef.current = null; },
    });
    if (session) { sessionRef.current = session; setListening(true); }
  };

  useEffect(() => () => stop(), []);

  return { listening, toggle, available };
}

// ─── Voice parsers ───────────────────────────────────────────────────────────

function parseSleepVoice(text: string): number | null {
  const lower = text.toLowerCase();
  const match = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b)/);
  if (match) {
    const h = parseFloat(match[1]);
    if (h >= 3 && h <= 12) return Math.round(h * 2) / 2;
  }
  if (/\bfive\b/.test(lower)) return 5;
  if (/\bsix\b/.test(lower)) return 6;
  if (/\bseven\b/.test(lower)) return 7;
  if (/\beight\b/.test(lower)) return 8;
  if (/\bnine\b/.test(lower)) return 9;
  if (/\bten\b/.test(lower)) return 10;
  return null;
}

function parseEnergyVoice(text: string): number | null {
  const lower = text.toLowerCase();
  const numMatch = lower.match(/\b([1-5])\b/);
  if (numMatch) return parseInt(numMatch[1]);
  if (/exhaust|drained|terrible|awful|dead/.test(lower)) return 1;
  if (/tired|low energy|rough|bad day|fatigued/.test(lower)) return 2;
  if (/okay|alright|fine|normal|so.so|average|middle/.test(lower)) return 3;
  if (/\bgood\b|decent|well|nice|solid/.test(lower)) return 4;
  if (/great|amazing|energetic|buzz|fantastic|excellent|pumped/.test(lower)) return 5;
  return null;
}

function parseActivityVoice(text: string): ActivityLevel | null {
  const lower = text.toLowerCase();
  if (/didn.t move|barely|nothing|rest day|sedentary|stayed home|no exercise/.test(lower)) return "none";
  if (/ran|run|running|intense|hiit|crossfit|heavy|long workout/.test(lower)) return "active";
  if (/gym|workout|exercise|jogged|jog|yoga|swam|swim|moderate/.test(lower)) return "moderate";
  if (/short walk|light|casual|stroll|stretch|a little|walk/.test(lower)) return "light";
  return null;
}

// ─── Water ───────────────────────────────────────────────────────────────────

const WATER_GOAL = 8;

export function WaterQuickLog(): ReactElement {
  const palette = usePalette();
  const { todayLog, setWater } = useApp();
  const cups = Math.min(WATER_GOAL, todayLog.waterCups);

  return (
    <GlassCard padding={14} style={{ flex: 1 }}>
      <View style={s.head}>
        <View style={[s.iconChip, { backgroundColor: palette.primarySoft }]}>
          <Feather name="droplet" size={13} color={palette.primary} />
        </View>
        <Text style={[s.label, { color: palette.text }]}>Water</Text>
        <Text style={[s.count, { color: palette.textMuted }]}>
          {todayLog.waterCups}/{WATER_GOAL}
        </Text>
      </View>
      <View style={s.dropRow}>
        {Array.from({ length: WATER_GOAL }).map((_, i) => {
          const filled = i < cups;
          const target = filled && i === cups - 1 ? i : i + 1;
          return (
            <Pressable
              key={i}
              onPress={() => setWater(target)}
              style={({ pressed }) => [s.dropTap, { opacity: pressed ? 0.6 : 1 }]}
              hitSlop={6}
            >
              <Feather
                name="droplet"
                size={20}
                color={filled ? palette.primary : palette.glassBorder}
              />
            </Pressable>
          );
        })}
      </View>
      <Text style={[s.hint, { color: palette.textMuted }]}>
        {todayLog.waterCups === 0
          ? "Tap a drop to log"
          : todayLog.waterCups >= WATER_GOAL
            ? "Goal hit — nice"
            : "Tap to add another"}
      </Text>
    </GlassCard>
  );
}

// ─── Sleep ───────────────────────────────────────────────────────────────────

const SLEEP_OPTIONS = [5, 6, 7, 8, 9];

export function SleepQuickLog(): ReactElement {
  const palette = usePalette();
  const { todayLog, setSleep } = useApp();
  const current = Math.round(todayLog.sleepHours * 2) / 2;

  const { listening, toggle, available } = useVoice((text) => {
    const hours = parseSleepVoice(text);
    if (hours !== null) setSleep(hours);
  });

  return (
    <GlassCard padding={14} style={{ flex: 1 }}>
      <View style={s.head}>
        <View style={[s.iconChip, { backgroundColor: palette.primarySoft }]}>
          <Feather name="moon" size={13} color={palette.primary} />
        </View>
        <Text style={[s.label, { color: palette.text }]}>Sleep</Text>
        <Text style={[s.count, { color: palette.textMuted }]}>
          {todayLog.sleepHours > 0 ? `${todayLog.sleepHours.toFixed(1)}h` : "—"}
        </Text>
      </View>
      <View style={s.chipRow}>
        {SLEEP_OPTIONS.map((h) => {
          const selected = current === h;
          return (
            <Pressable
              key={h}
              onPress={() => setSleep(selected ? 0 : h)}
              style={({ pressed }) => [
                s.chip,
                {
                  backgroundColor: selected ? palette.primary : palette.surface,
                  borderColor: selected ? palette.primary : palette.glassBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  s.chipText,
                  { color: selected ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.text },
                ]}
              >
                {h}h
              </Text>
            </Pressable>
          );
        })}
        {available ? <MicPill listening={listening} onPress={toggle} /> : null}
      </View>
      <Text style={[s.hint, { color: listening ? palette.primary : palette.textMuted }]}>
        {listening
          ? "Listening… say hours"
          : todayLog.sleepHours === 0
            ? "Tap or speak hours"
            : "Tap to change"}
      </Text>
    </GlassCard>
  );
}

// ─── Energy ──────────────────────────────────────────────────────────────────

const ENERGY_OPTIONS: { level: number; label: string }[] = [
  { level: 1, label: "Drained" },
  { level: 2, label: "Low" },
  { level: 3, label: "Okay" },
  { level: 4, label: "Good" },
  { level: 5, label: "Great" },
];

export function EnergyQuickLog(): ReactElement {
  const palette = usePalette();
  const { todayLog, setManualEnergy } = useApp();
  const current = todayLog.manualEnergy;

  const { listening, toggle, available } = useVoice((text) => {
    const level = parseEnergyVoice(text);
    if (level !== null) setManualEnergy(level);
  });

  return (
    <GlassCard padding={14} style={{ flex: 1 }}>
      <View style={s.head}>
        <View style={[s.iconChip, { backgroundColor: palette.primarySoft }]}>
          <Feather name="zap" size={13} color={palette.primary} />
        </View>
        <Text style={[s.label, { color: palette.text }]}>Energy</Text>
        {current !== undefined ? (
          <Text style={[s.count, { color: palette.textMuted }]}>
            {ENERGY_OPTIONS[current - 1]?.label ?? "—"}
          </Text>
        ) : null}
      </View>
      <View style={s.chipRow}>
        {ENERGY_OPTIONS.map(({ level, label }) => {
          const selected = current === level;
          return (
            <Pressable
              key={level}
              onPress={() => setManualEnergy(level)}
              style={({ pressed }) => [
                s.chip,
                {
                  backgroundColor: selected ? palette.primary : palette.surface,
                  borderColor: selected ? palette.primary : palette.glassBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  s.chipText,
                  { color: selected ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.text },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
        {available ? <MicPill listening={listening} onPress={toggle} /> : null}
      </View>
      <Text style={[s.hint, { color: listening ? palette.primary : palette.textMuted }]}>
        {listening
          ? "Listening… say how you feel"
          : current !== undefined
            ? current <= 2
              ? "Tasks softened — rest wins"
              : "Noted"
            : "Tap or speak your energy"}
      </Text>
    </GlassCard>
  );
}

// ─── Activity ────────────────────────────────────────────────────────────────

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: "none", label: "Rest", icon: "moon" },
  { value: "light", label: "Light", icon: "wind" },
  { value: "moderate", label: "Moderate", icon: "activity" },
  { value: "active", label: "Active", icon: "trending-up" },
];

export function ActivityQuickLog(): ReactElement {
  const palette = usePalette();
  const { todayLog, setManualActivity } = useApp();
  const current = todayLog.manualActivity;

  const { listening, toggle, available } = useVoice((text) => {
    const activity = parseActivityVoice(text);
    if (activity !== null) setManualActivity(activity);
  });

  return (
    <GlassCard padding={14} style={{ flex: 1 }}>
      <View style={s.head}>
        <View style={[s.iconChip, { backgroundColor: palette.primarySoft }]}>
          <Feather name="activity" size={13} color={palette.primary} />
        </View>
        <Text style={[s.label, { color: palette.text }]}>Movement</Text>
        {available ? <MicPill listening={listening} onPress={toggle} /> : null}
      </View>
      <View style={s.activityGrid}>
        {ACTIVITY_OPTIONS.map(({ value, label, icon }) => {
          const selected = current === value;
          return (
            <Pressable
              key={value}
              onPress={() => setManualActivity(value)}
              style={({ pressed }) => [
                s.activityChip,
                {
                  backgroundColor: selected ? palette.primary : palette.surface,
                  borderColor: selected ? palette.primary : palette.glassBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather
                name={icon}
                size={13}
                color={selected ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.primary}
              />
              <Text
                style={[
                  s.chipText,
                  { color: selected ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.text },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[s.hint, { color: listening ? palette.primary : palette.textMuted }]}>
        {listening
          ? "Listening… describe your day"
          : current !== undefined
            ? "Logged — good to know"
            : "Tap or speak your movement"}
      </Text>
    </GlassCard>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  iconChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  count: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  dropRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dropTap: {
    width: 26,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
  },
  chipText: { fontSize: 11.5, fontFamily: "Inter_600SemiBold" },
  activityGrid: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  activityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  hint: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
