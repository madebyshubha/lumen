import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ContextStrip } from "@/components/ContextStrip";
import { CycleCalendar, NextDaysStrip } from "@/components/CycleCalendar";
import { FeelingBar } from "@/components/FeelingBar";
import { GlassCard } from "@/components/GlassCard";
import { MealLogger } from "@/components/MealLogger";
import { MissionCard } from "@/components/MissionCard";
import { MoodFaceRow } from "@/components/MoodFaceRow";
import { PhaseBackground } from "@/components/PhaseBackground";
import { PhaseRing } from "@/components/PhaseRing";
import { Stepper } from "@/components/Stepper";
import { StreakChip } from "@/components/StreakChip";
import { TopBar } from "@/components/TopBar";
import { useApp, usePalette } from "@/context/AppContext";
import { concernLabel } from "@/lib/protocols";
import { layoutForDirective, DEFAULT_LAYOUT } from "@/lib/vibeFilter";

export default function DashboardScreen() {
  const palette = usePalette();
  const { cycle, health, todayLog, addWater, addSleep, tasks, removeConcern, vibe } = useApp();

  if (!cycle || !health) return null;

  const mission = tasks.filter((t) => t.priority === "critical");
  const lean = tasks.filter((t) => t.priority === "important");
  const gentle = tasks.filter((t) => t.priority === "gentle");

  // The whole home screen reshapes around the active vibe directive — every
  // layout decision (which sections, palette intensity, whether to promote
  // Lean-in) comes straight from the server-issued directive.
  const layout = vibe ? layoutForDirective(vibe) : DEFAULT_LAYOUT;
  const missionTitle = vibe?.missionTitle ?? "Today's mission";
  const missionSub = vibe?.missionSub ?? "The non-negotiables";
  const showLean = layout.showLean && lean.length > 0;
  const showGentle = layout.showGentle && gentle.length > 0;
  const leanBlock =
    showLean ? (
      <>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Lean in today
          </Text>
          <Text style={[styles.sectionSub, { color: palette.textMuted }]}>
            Phase-tuned for you
          </Text>
        </View>
        <View style={{ gap: 10, marginBottom: 18 }}>
          {lean.map((t) => (
            <MissionCard key={t.id} task={t} />
          ))}
        </View>
      </>
    ) : null;

  const progress = 1 - cycle.daysToNextPeriod / cycle.cycleLength;
  const completed = todayLog.completedTaskIds.length;
  const total = tasks.length;

  return (
    <PhaseBackground intensity={layout.paletteIntensity}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 110 : 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TopBar greeting={`${cycle.phase} day ${cycle.dayOfCycle}`} />

        <View style={{ paddingHorizontal: 20 }}>
          {/* FEELING BAR — one sentence reshapes the entire home screen. */}
          <FeelingBar />

          {/* SLIM PHASE STRIP — calendar moved further down per restructured plan */}
          <GlassCard style={{ marginBottom: 16 }}>
            <View style={styles.phaseRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: palette.textMuted }]}>
                  You're in your
                </Text>
                <Text style={[styles.phase, { color: palette.text }]}>{palette.name}</Text>
                <Text style={[styles.tagline, { color: palette.textMuted }]}>
                  {palette.tagline}
                </Text>
                <View style={styles.phaseStats}>
                  <Text style={[styles.statSmall, { color: palette.text }]}>
                    Day {cycle.dayOfCycle}
                  </Text>
                  <View style={[styles.dot, { backgroundColor: palette.glassBorder }]} />
                  <Text style={[styles.statSmall, { color: palette.text }]}>
                    HRV {health.todayHrv}
                    {health.todayHrvLow ? " · low" : ""}
                  </Text>
                  <View style={[styles.dot, { backgroundColor: palette.glassBorder }]} />
                  <Text style={[styles.statSmall, { color: palette.text }]}>
                    {completed}/{total} done
                  </Text>
                </View>
              </View>
              <PhaseRing
                size={96}
                strokeWidth={8}
                progress={progress}
                topLabel="Period in"
                centerValue={String(cycle.daysToNextPeriod)}
                bottomLabel={cycle.daysToNextPeriod === 1 ? "day" : "days"}
              />
            </View>
          </GlassCard>

          {/* STREAK CHIP — daily-log motivator with 14-day mini history. */}
          <StreakChip note={vibe?.streakNote ?? null} />

          {/* CARE CTA — gives the user a path when they have a chronic problem. */}
          <Pressable
            onPress={() => router.push("/(tabs)/care")}
            accessibilityRole="button"
            accessibilityLabel="Open Care — get a PCOS plan for what's bothering you"
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, marginBottom: 16 }]}
          >
            <GlassCard padding={14}>
              <View style={styles.careRow}>
                <View
                  style={[styles.careIcon, { backgroundColor: palette.primarySoft }]}
                >
                  <Feather name="heart" size={16} color={palette.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.careTitle, { color: palette.text }]}>
                    {todayLog.context.concerns.length > 0
                      ? "Open your care plan"
                      : "Something bothering you?"}
                  </Text>
                  <Text style={[styles.careSub, { color: palette.textMuted }]}>
                    {todayLog.context.concerns.length > 0
                      ? "Today's mission is tuned to it."
                      : "Acne, hair loss, fatigue, cycle — get a real PCOS plan."}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={palette.textMuted} />
              </View>
              {todayLog.context.concerns.length > 0 ? (
                <View style={styles.concernChips}>
                  {todayLog.context.concerns.map((c) => (
                    <Pressable
                      key={c.key}
                      onPress={() => removeConcern(c.key)}
                      accessibilityRole="button"
                      accessibilityLabel={`Stop tracking ${concernLabel(c.key)}`}
                      style={({ pressed }) => [
                        styles.concernChip,
                        {
                          backgroundColor: palette.surface,
                          borderColor: palette.glassBorder,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.concernChipText, { color: palette.text }]}>
                        {concernLabel(c.key)}
                      </Text>
                      <Feather name="x" size={12} color={palette.textMuted} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </GlassCard>
          </Pressable>

          {/* On a vibrant day promote Lean-in above the mission so the user
              uses her energy on the phase-flavoured tasks first. */}
          {layout.promoteLean ? leanBlock : null}

          {/* TODAY'S MISSION — the critical PCOS-targeted tasks, front and center.
              Title and sub-copy come from the vibe directive when one is active. */}
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>{missionTitle}</Text>
            <Text style={[styles.sectionSub, { color: palette.textMuted }]}>
              {missionSub}
            </Text>
          </View>
          <View style={{ gap: 10, marginBottom: 18 }}>
            {mission.map((t) => (
              <MissionCard key={t.id} task={t} />
            ))}
          </View>

          {/* CONTEXT STRIP — where you are + travel toggle */}
          <ContextStrip />

          {/* MEAL LOGGER */}
          <MealLogger />

          {/* MOOD ROW */}
          <GlassCard style={{ marginBottom: 16 }}>
            <Text style={[styles.cardTitle, { color: palette.text, marginBottom: 12 }]}>
              How do you feel today?
            </Text>
            <MoodFaceRow />
          </GlassCard>

          {/* QUICK STEPPERS */}
          <View style={[styles.row, { marginBottom: 18 }]}>
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

          {/* LEAN-IN TASKS — phase-flavoured, important but not critical.
              Hidden on low/anxious days; promoted above mission on vibrant days. */}
          {!layout.promoteLean ? leanBlock : null}

          {/* GENTLE TASKS — collapsed style, smaller cards. Hidden on low/anxious. */}
          {showGentle ? (
            <>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>If you can</Text>
                <Text style={[styles.sectionSub, { color: palette.textMuted }]}>
                  Bonus, not pressure
                </Text>
              </View>
              <View style={{ gap: 10, marginBottom: 18 }}>
                {gentle.map((t) => (
                  <MissionCard key={t.id} task={t} />
                ))}
              </View>
            </>
          ) : null}

          {/* CALENDAR — moved to a smaller part of the page. Hidden on low days. */}
          {layout.showCalendar ? (
            <GlassCard style={{ marginBottom: 16 }}>
              <View style={styles.cardHead}>
                <Text style={[styles.cardTitle, { color: palette.text }]}>This month</Text>
                <Text style={[styles.cardSub, { color: palette.textMuted }]}>
                  {monthName(new Date())}
                </Text>
              </View>
              <CycleCalendar />
            </GlassCard>
          ) : null}

          {/* NEXT 7 DAYS — hidden on low/anxious days to keep the screen quiet. */}
          {layout.showNext7 ? (
            <GlassCard style={{ marginBottom: 16 }}>
              <View style={styles.cardHead}>
                <Text style={[styles.cardTitle, { color: palette.text }]}>Next seven days</Text>
              </View>
              <NextDaysStrip />
            </GlassCard>
          ) : null}

          {/* MY CYCLE — hidden on low days. */}
          {layout.showCycleStats ? (
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
          ) : null}

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
  phaseRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
  },
  phase: { fontSize: 26, fontFamily: "Outfit_700Bold", marginTop: 4 },
  tagline: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  phaseStats: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" },
  statSmall: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  dot: { width: 3, height: 3, borderRadius: 2 },
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
  careRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  careIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  careTitle: { fontSize: 14.5, fontFamily: "Inter_600SemiBold" },
  careSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  concernChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  concernChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  concernChipText: { fontSize: 11.5, fontFamily: "Inter_500Medium" },
});
