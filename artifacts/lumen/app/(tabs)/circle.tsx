import { Feather } from "@expo/vector-icons";
import React from "react";
import { Dimensions, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { MoodMap } from "@/components/MoodMap";
import { PhaseBackground } from "@/components/PhaseBackground";
import { TopBar } from "@/components/TopBar";
import { useApp, usePalette } from "@/context/AppContext";
import { moodAggregates, moodColor } from "@/lib/circle";

export default function CircleScreen() {
  const palette = usePalette();
  const { cycle } = useApp();
  if (!cycle) return null;

  const { width } = Dimensions.get("window");
  const mapWidth = Math.min(width - 40, 520);
  const mapHeight = Math.round(mapWidth * 0.95);
  const aggregates = moodAggregates(cycle.phase);
  const total = aggregates.reduce((s, a) => s + a.count, 0);

  return (
    <PhaseBackground>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 110 : 130 }}
        showsVerticalScrollIndicator={false}
      >
        <TopBar greeting="Secret Circle" />

        <View style={{ paddingHorizontal: 20 }}>
          <GlassCard style={{ marginBottom: 16 }}>
            <View style={styles.head}>
              <View style={[styles.icon, { backgroundColor: palette.primarySoft }]}>
                <Feather name="users" size={16} color={palette.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: palette.text }]}>
                  You are not alone
                </Text>
                <Text style={[styles.sub, { color: palette.textMuted }]}>
                  {total} women in their {palette.name.toLowerCase()} phase shared a feeling today.
                </Text>
              </View>
            </View>
          </GlassCard>

          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <MoodMap width={mapWidth} height={mapHeight} />
          </View>

          <GlassCard style={{ marginBottom: 16 }}>
            <Text style={[styles.cardTitle, { color: palette.text, marginBottom: 12 }]}>
              Today's spread
            </Text>
            {aggregates.map((a) => {
              const pct = Math.round((a.count / total) * 100);
              return (
                <View key={a.mood} style={styles.barRow}>
                  <View style={[styles.barDot, { backgroundColor: moodColor(a.mood, cycle.phase) }]} />
                  <Text style={[styles.barLabel, { color: palette.text }]}>{a.label}</Text>
                  <View style={[styles.barTrack, { backgroundColor: palette.surfaceMuted }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${pct}%`, backgroundColor: moodColor(a.mood, cycle.phase) },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barCount, { color: palette.textMuted }]}>{a.count}</Text>
                </View>
              );
            })}
          </GlassCard>

          <GlassCard>
            <Text style={[styles.quoteEyebrow, { color: palette.textMuted }]}>A quiet truth</Text>
            <Text style={[styles.quote, { color: palette.text }]}>
              No names. No feed. Just shapes that say someone, somewhere, is feeling exactly what
              you're feeling — and the day is still moving.
            </Text>
          </GlassCard>
        </View>
      </ScrollView>
    </PhaseBackground>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Outfit_600SemiBold" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 18 },
  cardTitle: { fontSize: 15, fontFamily: "Outfit_600SemiBold" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  barDot: { width: 10, height: 10, borderRadius: 5 },
  barLabel: { width: 64, fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "lowercase" },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  barCount: { width: 36, textAlign: "right", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  quoteEyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  quote: { fontSize: 16, fontFamily: "Outfit_500Medium", lineHeight: 24 },
});
