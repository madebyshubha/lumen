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
  const subtitle =
    streak.current === 0
      ? "Start a fresh streak today"
      : streak.loggedToday
        ? `Best ${streak.best} ${streak.best === 1 ? "day" : "days"}`
        : `Keep it alive — log one thing today`;

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
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.value, { color: palette.text }]}>
              {streak.current}
            </Text>
            <Text style={[styles.unit, { color: palette.textMuted }]}>
              {streak.current === 1 ? "day streak" : "day streak"}
            </Text>
          </View>
          <Text style={[styles.sub, { color: palette.textMuted }]}>{subtitle}</Text>
        </View>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={palette.textMuted}
        />
      </Pressable>

      {!streak.loggedToday && streak.current > 0 ? (
        <View
          style={[
            styles.nudge,
            { backgroundColor: palette.accentSoft, borderColor: palette.glassBorder },
          ]}
        >
          <Feather name="alert-circle" size={12} color={palette.primary} />
          <Text style={[styles.nudgeText, { color: palette.text }]} numberOfLines={2}>
            Log one thing to keep your streak alive.
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
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  value: { fontSize: 22, fontFamily: "Outfit_700Bold" },
  unit: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sub: { fontSize: 11.5, fontFamily: "Inter_400Regular", marginTop: 2 },
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
