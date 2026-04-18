import { Feather } from "@expo/vector-icons";
import React, { type ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useApp, usePalette } from "@/context/AppContext";
import { GlassCard } from "@/components/GlassCard";

const WATER_GOAL = 8;
const SLEEP_OPTIONS = [5, 6, 7, 8, 9];

export function WaterQuickLog(): ReactElement {
  const palette = usePalette();
  const { todayLog, setWater } = useApp();
  const cups = Math.min(WATER_GOAL, todayLog.waterCups);

  return (
    <GlassCard padding={14} style={{ flex: 1 }}>
      <View style={styles.head}>
        <View style={[styles.iconChip, { backgroundColor: palette.primarySoft }]}>
          <Feather name="droplet" size={13} color={palette.primary} />
        </View>
        <Text style={[styles.label, { color: palette.text }]}>Water</Text>
        <Text style={[styles.count, { color: palette.textMuted }]}>
          {todayLog.waterCups}/{WATER_GOAL}
        </Text>
      </View>
      <View style={styles.dropRow}>
        {Array.from({ length: WATER_GOAL }).map((_, i) => {
          const filled = i < cups;
          // Tap a drop to set water to that index. Tap the last filled drop again to
          // unfill it (so users can correct an over-tap without finding a separate
          // minus button).
          const target = filled && i === cups - 1 ? i : i + 1;
          return (
            <Pressable
              key={i}
              onPress={() => setWater(target)}
              accessibilityRole="button"
              accessibilityLabel={`Set water to ${target} cups`}
              style={({ pressed }) => [
                styles.dropTap,
                { opacity: pressed ? 0.6 : 1 },
              ]}
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
      <Text style={[styles.hint, { color: palette.textMuted }]}>
        {todayLog.waterCups === 0
          ? "Tap a drop to log"
          : todayLog.waterCups >= WATER_GOAL
            ? "Goal hit — nice"
            : "Tap to add another"}
      </Text>
    </GlassCard>
  );
}

export function SleepQuickLog(): ReactElement {
  const palette = usePalette();
  const { todayLog, setSleep } = useApp();
  const current = Math.round(todayLog.sleepHours);

  return (
    <GlassCard padding={14} style={{ flex: 1 }}>
      <View style={styles.head}>
        <View style={[styles.iconChip, { backgroundColor: palette.primarySoft }]}>
          <Feather name="moon" size={13} color={palette.primary} />
        </View>
        <Text style={[styles.label, { color: palette.text }]}>Sleep</Text>
        <Text style={[styles.count, { color: palette.textMuted }]}>
          {todayLog.sleepHours > 0 ? `${todayLog.sleepHours.toFixed(1)}h` : "—"}
        </Text>
      </View>
      <View style={styles.chipRow}>
        {SLEEP_OPTIONS.map((h) => {
          const selected = current === h;
          return (
            <Pressable
              key={h}
              onPress={() => setSleep(selected ? 0 : h)}
              accessibilityRole="button"
              accessibilityLabel={
                selected ? `Clear sleep` : `Log ${h} hours of sleep`
              }
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? palette.primary : palette.surface,
                  borderColor: selected ? palette.primary : palette.glassBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: selected
                      ? palette.isDark
                        ? "#0f1024"
                        : "#ffffff"
                      : palette.text,
                  },
                ]}
              >
                {h}h
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.hint, { color: palette.textMuted }]}>
        {todayLog.sleepHours === 0 ? "Tap last night's hours" : "Tap to change"}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
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
  count: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
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
    gap: 6,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 38,
    alignItems: "center",
  },
  chipText: { fontSize: 12.5, fontFamily: "Inter_600SemiBold" },
  hint: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
