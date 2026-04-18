import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { useApp, usePalette } from "@/context/AppContext";

export function StreakChip() {
  const palette = usePalette();
  const { streak } = useApp();
  const [open, setOpen] = useState(false);

  const flameColor = streak.current > 0 ? palette.primary : palette.textMuted;

  return (
    <GlassCard padding={14} style={{ marginBottom: 16 }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`Daily streak: ${streak.current} ${streak.current === 1 ? "day" : "days"}, best ${streak.best}. Tap to ${open ? "hide" : "see"} the last 14 days.`}
        style={styles.row}
      >
        <View style={[styles.iconWrap, { backgroundColor: palette.primarySoft }]}>
          <Feather name="zap" size={16} color={flameColor} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.value, { color: palette.text }]}>
              {streak.current}
            </Text>
            <Text style={[styles.unit, { color: palette.textMuted }]}>day streak</Text>
          </View>
          <Text style={[styles.sub, { color: palette.textMuted }]} numberOfLines={1}>
            {streak.current > 0
              ? "Logging anything keeps it alive"
              : "Log one thing to start a fresh streak"}
          </Text>
        </View>
        {/* "Best" is always visible so the user can see her record at a glance. */}
        <View
          style={[
            styles.bestPill,
            { backgroundColor: palette.surfaceMuted, borderColor: palette.glassBorder },
          ]}
        >
          <Text style={[styles.bestLabel, { color: palette.textMuted }]}>Best</Text>
          <Text style={[styles.bestValue, { color: palette.text }]}>{streak.best}</Text>
        </View>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={palette.textMuted}
        />
      </Pressable>

      {/* Nudge: shown on every day that hasn't been logged yet, regardless of current streak. */}
      {!streak.loggedToday ? (
        <View
          style={[
            styles.nudge,
            { backgroundColor: palette.accentSoft, borderColor: palette.glassBorder },
          ]}
        >
          <Feather name="alert-circle" size={12} color={palette.primary} />
          <Text style={[styles.nudgeText, { color: palette.text }]} numberOfLines={2}>
            Log one thing to keep your streak.
          </Text>
        </View>
      ) : null}

      {open ? (
        <View style={[styles.history, { borderTopColor: palette.glassBorder }]}>
          <Text style={[styles.historyLabel, { color: palette.textMuted }]}>
            Last 14 days
          </Text>
          <View style={styles.pillRow}>
            {streak.last14.map((on, i) => (
              <View
                key={i}
                style={[
                  styles.pill,
                  {
                    backgroundColor: on ? palette.primary : palette.surfaceMuted,
                    borderColor: on ? palette.primary : palette.glassBorder,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  value: { fontSize: 22, fontFamily: "Outfit_700Bold" },
  unit: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sub: { fontSize: 11.5, fontFamily: "Inter_400Regular", marginTop: 2 },
  bestPill: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  bestLabel: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
  },
  bestValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  nudge: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  nudgeText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  history: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  historyLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  pillRow: { flexDirection: "row", gap: 4, justifyContent: "space-between" },
  pill: { flex: 1, height: 18, borderRadius: 6, borderWidth: 1 },
});
