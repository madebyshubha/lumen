import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { usePalette, useApp } from "@/context/AppContext";
import { isPeriodDay, phaseForDay, addDays, diffDays, startOfDay } from "@/lib/cycle";
import type { CyclePhase } from "@/constants/colors";
import colors from "@/constants/colors";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

export function CycleCalendar() {
  const palette = usePalette();
  const { cycle, health } = useApp();
  if (!cycle || !health) return null;

  const today = startOfDay(new Date());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const startWeekday = monthStart.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(today.getFullYear(), today.getMonth(), i));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      <View style={styles.headerRow}>
        {WEEK.map((d, i) => (
          <Text key={i} style={[styles.weekday, { color: palette.textMuted }]}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.cell} />;
          const isToday = d.getTime() === today.getTime();
          const period = isPeriodDay(d, health.periods);
          const day = ((diffDays(d, cycle.lastPeriodDate) % cycle.cycleLength) + cycle.cycleLength) % cycle.cycleLength + 1;
          const phase: CyclePhase = phaseForDay(day, cycle.cycleLength);
          const dot = colors.phases[phase].primary;
          return (
            <View key={i} style={styles.cell}>
              <View
                style={[
                  styles.dayWrap,
                  isToday && { backgroundColor: palette.primary },
                  isToday && { shadowColor: palette.primary },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: isToday ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.text },
                  ]}
                >
                  {d.getDate()}
                </Text>
              </View>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: period ? "#ff5c8a" : dot,
                    opacity: period ? 1 : 0.55,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Tomorrow / next-7-days strip (referenced by the dashboard hero card).
export function NextDaysStrip() {
  const palette = usePalette();
  const { cycle } = useApp();
  if (!cycle) return null;
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  return (
    <View style={stripStyles.wrap}>
      {days.map((d, i) => {
        const day = ((diffDays(d, cycle.lastPeriodDate) % cycle.cycleLength) + cycle.cycleLength) % cycle.cycleLength + 1;
        const phase = phaseForDay(day, cycle.cycleLength);
        const tint = colors.phases[phase].primary;
        const isToday = i === 0;
        return (
          <View key={i} style={stripStyles.cell}>
            <Text style={[stripStyles.weekday, { color: palette.textMuted }]}>
              {WEEK[d.getDay()]}
            </Text>
            <View
              style={[
                stripStyles.bubble,
                { borderColor: palette.glassBorder },
                isToday && { backgroundColor: palette.primary, borderColor: palette.primary },
              ]}
            >
              <Text
                style={[
                  stripStyles.bubbleText,
                  { color: isToday ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.text },
                ]}
              >
                {d.getDate()}
              </Text>
            </View>
            <View style={[stripStyles.dot, { backgroundColor: tint }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", marginBottom: 8 },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    alignItems: "center",
    paddingVertical: 4,
  },
  dayWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
});

const stripStyles = StyleSheet.create({
  wrap: { flexDirection: "row", justifyContent: "space-between" },
  cell: { alignItems: "center", flex: 1 },
  weekday: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  bubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 6 },
});
