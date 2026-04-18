import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CapabilityBadges } from "@/components/CapabilityBadges";
import { CycleCalendar, NextDaysStrip } from "@/components/CycleCalendar";
import { GlassCard } from "@/components/GlassCard";
import { MoodFaceRow } from "@/components/MoodFaceRow";
import { PhaseBackground } from "@/components/PhaseBackground";
import { PhaseRing } from "@/components/PhaseRing";
import { Stepper } from "@/components/Stepper";
import { TaskCard } from "@/components/TaskCard";
import { TopBar } from "@/components/TopBar";
import { useApp, usePalette } from "@/context/AppContext";
import { tasksForPhase } from "@/lib/tasks";

export default function DashboardScreen() {
  const palette = usePalette();
  const { cycle, health, todayLog, addWater, addSleep } = useApp();

  const tasks = useMemo(
    () => (cycle ? tasksForPhase(cycle.phase, health?.todayHrvLow ?? false) : []),
    [cycle, health],
  );

  if (!cycle || !health) return null;

  const progress = 1 - cycle.daysToNextPeriod / cycle.cycleLength;
  const completed = todayLog.completedTaskIds.length;

  return (
    <PhaseBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 110 : 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TopBar greeting={`${cycle.phase} day ${cycle.dayOfCycle}`} />

        <View style={{ paddingHorizontal: 20 }}>
          {/* HERO */}
          <GlassCard style={{ marginBottom: 16 }}>
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: palette.textMuted }]}>
                  You're in your
                </Text>
                <Text style={[styles.phase, { color: palette.text }]}>{palette.name}</Text>
                <Text style={[styles.tagline, { color: palette.textMuted }]}>{palette.tagline}</Text>
                <View style={styles.heroStats}>
                  <View>
                    <Text style={[styles.heroStat, { color: palette.text }]}>{cycle.dayOfCycle}</Text>
                    <Text style={[styles.heroStatLabel, { color: palette.textMuted }]}>day of cycle</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: palette.glassBorder }]} />
                  <View>
                    <Text style={[styles.heroStat, { color: palette.text }]}>{health.todayHrv}</Text>
                    <Text style={[styles.heroStatLabel, { color: palette.textMuted }]}>HRV today</Text>
                  </View>
                </View>
              </View>
              <PhaseRing
                size={140}
                strokeWidth={10}
                progress={progress}
                topLabel="Period in"
                centerValue={String(cycle.daysToNextPeriod)}
                bottomLabel={cycle.daysToNextPeriod === 1 ? "day" : "days"}
              />
            </View>
          </GlassCard>

          {/* CALENDAR */}
          <GlassCard style={{ marginBottom: 16 }}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>This month</Text>
              <Text style={[styles.cardSub, { color: palette.textMuted }]}>
                {monthName(new Date())}
              </Text>
            </View>
            <CycleCalendar />
          </GlassCard>

          {/* CAPABILITY BADGES */}
          <View style={{ marginBottom: 18 }}>
            <CapabilityBadges />
          </View>

          {/* MOOD ROW */}
          <GlassCard style={{ marginBottom: 16 }}>
            <Text style={[styles.cardTitle, { color: palette.text, marginBottom: 12 }]}>
              How do you feel today?
            </Text>
            <MoodFaceRow />
          </GlassCard>

          {/* TASKS */}
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              Today, gently
            </Text>
            <Text style={[styles.sectionSub, { color: palette.textMuted }]}>
              {completed} of {tasks.length} done
            </Text>
          </View>
          <View style={{ gap: 10, marginBottom: 18 }}>
            {tasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </View>

          {/* QUICK LOGS */}
          <View style={[styles.row, { marginBottom: 16 }]}>
            <Stepper
              icon="droplet"
              label="Water"
              value={`${todayLog.waterCups} / 8`}
              hint="cups today"
              onMinus={() => addWater(-1)}
              onPlus={() => addWater(1)}
            />
            <Stepper
              icon="moon"
              label="Sleep"
              value={`${todayLog.sleepHours.toFixed(1)}h`}
              hint="last night"
              onMinus={() => addSleep(-0.5)}
              onPlus={() => addSleep(0.5)}
            />
          </View>

          {/* NEXT 7 DAYS */}
          <GlassCard style={{ marginBottom: 16 }}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>Next seven days</Text>
            </View>
            <NextDaysStrip />
          </GlassCard>

          {/* MY CYCLE */}
          <GlassCard>
            <Text style={[styles.cardTitle, { color: palette.text, marginBottom: 12 }]}>
              My cycle
            </Text>
            <StatRow label="Last period" value={shortDate(cycle.lastPeriodDate)} icon="droplet" />
            <StatRow label="Next period" value={shortDate(cycle.nextPeriodDate)} icon="calendar" />
            <StatRow label="Cycle length" value={`${cycle.cycleLength} days`} icon="repeat" />
            <StatRow
              label="HRV today"
              value={`${health.todayHrv} ms${health.todayHrvLow ? " · low" : ""}`}
              icon="heart"
            />
          </GlassCard>

          <Pressable
            onPress={() => router.push("/(tabs)/vent")}
            style={({ pressed }) => [
              styles.ventCta,
              {
                backgroundColor: palette.primary,
                opacity: pressed ? 0.9 : 1,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <Feather name="mic" size={18} color={palette.isDark ? "#0f1024" : "#ffffff"} />
            <Text
              style={[
                styles.ventCtaText,
                { color: palette.isDark ? "#0f1024" : "#ffffff" },
              ]}
            >
              Talk it out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </PhaseBackground>
  );
}

function StatRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  const palette = usePalette();
  return (
    <View style={[statStyles.row, { borderBottomColor: palette.glassBorder }]}>
      <View style={[statStyles.icon, { backgroundColor: palette.primarySoft }]}>
        <Feather name={icon} size={14} color={palette.primary} />
      </View>
      <Text style={[statStyles.label, { color: palette.textMuted }]}>{label}</Text>
      <Text style={[statStyles.value, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  icon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  value: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

function monthName(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function shortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const styles = StyleSheet.create({
  content: { paddingTop: 0 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
  },
  phase: { fontSize: 28, fontFamily: "Outfit_700Bold", marginTop: 4 },
  tagline: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  heroStats: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 14 },
  heroStat: { fontSize: 22, fontFamily: "Outfit_700Bold" },
  heroStatLabel: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 1, textTransform: "uppercase" },
  divider: { width: 1, height: 28 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 16, fontFamily: "Outfit_600SemiBold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Outfit_600SemiBold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_500Medium" },
  row: { flexDirection: "row", gap: 12 },
  ventCta: {
    marginTop: 18,
    paddingVertical: 16,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ventCtaText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
