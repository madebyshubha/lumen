import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { PhaseBackground } from "@/components/PhaseBackground";
import { TopBar } from "@/components/TopBar";
import { useApp, usePalette } from "@/context/AppContext";
import type { ConcernKey } from "@/lib/lifestyle";
import { CONCERN_LIST, protocolFor } from "@/lib/protocols";

export default function CareScreen() {
  const palette = usePalette();
  const { todayLog, addConcern, removeConcern } = useApp();
  const [openKey, setOpenKey] = useState<ConcernKey | null>("acne");

  const activeKeys = useMemo(
    () => new Set(todayLog.context.concerns.map((c) => c.key)),
    [todayLog.context.concerns],
  );
  const travelling = todayLog.context.travelling;

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
  };

  return (
    <PhaseBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 110 : 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TopBar greeting="Care" />

        <View style={{ paddingHorizontal: 20 }}>
          <GlassCard style={{ marginBottom: 16 }}>
            <Text style={[styles.h1, { color: palette.text }]}>What's bothering you?</Text>
            <Text style={[styles.sub, { color: palette.textMuted }]}>
              Tap a symptom for a PCOS-aware plan. Track one and today's mission will lead with the highest-leverage actions for it.
            </Text>
          </GlassCard>

          <View style={{ gap: 12 }}>
            {CONCERN_LIST.map((key) => {
              const p = protocolFor(key);
              const isOpen = openKey === key;
              const isActive = activeKeys.has(key);
              return (
                <GlassCard key={key} padding={0}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                    accessibilityLabel={`${p.title}. ${isActive ? "Currently tracking." : "Tap to expand."}`}
                    onPress={() => {
                      haptic();
                      setOpenKey(isOpen ? null : key);
                    }}
                    style={styles.headerRow}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.title, { color: palette.text }]}>{p.title}</Text>
                        {isActive ? (
                          <View
                            style={[
                              styles.activeChip,
                              { backgroundColor: palette.primarySoft },
                            ]}
                          >
                            <View
                              style={[styles.activeDot, { backgroundColor: palette.primary }]}
                            />
                            <Text style={[styles.activeChipText, { color: palette.primary }]}>
                              Tracking
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.oneLiner, { color: palette.textMuted }]}>
                        {p.oneLiner}
                      </Text>
                    </View>
                    <Feather
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={palette.textMuted}
                    />
                  </Pressable>

                  {isOpen ? (
                    <View style={styles.body}>
                      <Section title="Why this happens" palette={palette}>
                        <Text style={[styles.body14, { color: palette.text }]}>{p.rootCause}</Text>
                      </Section>

                      {travelling && p.travelNote ? (
                        <View
                          style={[
                            styles.travelBox,
                            {
                              backgroundColor: palette.primarySoft,
                              borderColor: palette.glassBorder,
                            },
                          ]}
                        >
                          <Feather name="navigation" size={14} color={palette.primary} />
                          <Text style={[styles.travelText, { color: palette.text }]}>
                            {p.travelNote}
                          </Text>
                        </View>
                      ) : null}

                      <Section title="Add today" palette={palette}>
                        {p.addToday.map((s, i) => (
                          <Step key={i} step={s} kind="add" palette={palette} />
                        ))}
                      </Section>

                      <Section title="Skip today" palette={palette}>
                        {p.removeToday.map((s, i) => (
                          <Step key={i} step={s} kind="skip" palette={palette} />
                        ))}
                      </Section>

                      <Section title="This week" palette={palette}>
                        {p.weekly.map((s, i) => (
                          <Step key={i} step={s} kind="weekly" palette={palette} />
                        ))}
                      </Section>

                      <Section title="Supplements to consider" palette={palette}>
                        {p.supplements.map((s, i) => (
                          <Step key={i} step={s} kind="supp" palette={palette} />
                        ))}
                        <Text style={[styles.disclaimer, { color: palette.textMuted }]}>
                          Educational only. Talk to your doctor before starting any supplement, especially if you take medication or are trying to conceive.
                        </Text>
                      </Section>

                      <Section title="When to see a doctor" palette={palette}>
                        <Text style={[styles.body14, { color: palette.text }]}>
                          {p.whenToSeeDoctor}
                        </Text>
                      </Section>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          isActive
                            ? `Stop tracking ${p.title}`
                            : `Track ${p.title} — adds today's actions to your mission`
                        }
                        onPress={() => {
                          haptic();
                          if (isActive) removeConcern(key);
                          else addConcern(key);
                        }}
                        style={({ pressed }) => [
                          styles.trackBtn,
                          {
                            backgroundColor: isActive
                              ? palette.surface
                              : palette.primary,
                            borderColor: isActive ? palette.glassBorder : palette.primary,
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <Feather
                          name={isActive ? "check" : "plus"}
                          size={16}
                          color={
                            isActive
                              ? palette.text
                              : palette.isDark
                              ? "#0f1024"
                              : "#ffffff"
                          }
                        />
                        <Text
                          style={[
                            styles.trackBtnText,
                            {
                              color: isActive
                                ? palette.text
                                : palette.isDark
                                ? "#0f1024"
                                : "#ffffff",
                            },
                          ]}
                        >
                          {isActive ? "Tracking — tap to stop" : "Track this for me today"}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </GlassCard>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </PhaseBackground>
  );
}

function Section({
  title,
  children,
  palette,
}: {
  title: string;
  children: React.ReactNode;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={{ marginTop: 6 }}>{children}</View>
    </View>
  );
}

function Step({
  step,
  kind,
  palette,
}: {
  step: { title: string; detail: string };
  kind: "add" | "skip" | "weekly" | "supp";
  palette: ReturnType<typeof usePalette>;
}) {
  const icon: keyof typeof Feather.glyphMap =
    kind === "add"
      ? "check-circle"
      : kind === "skip"
      ? "x-circle"
      : kind === "weekly"
      ? "repeat"
      : "circle";
  const tint =
    kind === "skip"
      ? palette.textMuted
      : kind === "supp"
      ? palette.primary
      : palette.primary;
  return (
    <View style={styles.stepRow}>
      <Feather name={icon} size={16} color={tint} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepTitle, { color: palette.text }]}>{step.title}</Text>
        <Text style={[styles.stepDetail, { color: palette.textMuted }]}>{step.detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 0 },
  h1: { fontSize: 20, fontFamily: "Outfit_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 6, lineHeight: 19 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  title: { fontSize: 16, fontFamily: "Outfit_600SemiBold" },
  oneLiner: { fontSize: 12.5, fontFamily: "Inter_400Regular", marginTop: 2 },

  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  body: { paddingHorizontal: 18, paddingBottom: 18 },
  sectionTitle: {
    fontSize: 10.5,
    letterSpacing: 1.2,
    fontFamily: "Inter_600SemiBold",
  },
  body14: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },

  travelBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  travelText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 19 },

  stepRow: { flexDirection: "row", gap: 10, paddingVertical: 6 },
  stepTitle: { fontSize: 13.5, fontFamily: "Inter_600SemiBold" },
  stepDetail: { fontSize: 12.5, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 18 },

  disclaimer: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 16,
  },

  trackBtn: {
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  trackBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
