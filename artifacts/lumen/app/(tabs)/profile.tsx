import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { PhaseBackground } from "@/components/PhaseBackground";
import { TopBar } from "@/components/TopBar";
import { useApp, usePalette } from "@/context/AppContext";

export default function ProfileScreen() {
  const palette = usePalette();
  const { profile, cycle, health, vents, signOut } = useApp();
  if (!profile || !cycle || !health) return null;

  return (
    <PhaseBackground>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 110 : 130 }}
      >
        <TopBar greeting="Your space" />

        <View style={{ paddingHorizontal: 20 }}>
          <GlassCard style={{ marginBottom: 16 }}>
            <View style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: palette.primary }]}>
                <Text style={[styles.initial, { color: palette.isDark ? "#0f1024" : "#ffffff" }]}>
                  {profile.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: palette.text }]}>{profile.name}</Text>
                <Text style={[styles.meta, { color: palette.textMuted }]}>
                  Signed in with {profile.provider === "apple" ? "Apple" : "Google"} · since{" "}
                  {new Date(profile.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={{ marginBottom: 16 }}>
            <Text style={[styles.cardTitle, { color: palette.text, marginBottom: 12 }]}>
              How adaptive tasks work
            </Text>
            <Text style={[styles.body, { color: palette.textMuted }]}>
              Lumen reads your phase and your nervous system. When your HRV is low (high stress),
              workouts become stretches automatically. Your streak survives, your body recovers, and
              the bar moves with you instead of against you.
            </Text>
            <View style={styles.divider} />
            <Row icon="activity" label="HRV today" value={`${health.todayHrv} ms`} />
            <Row icon="zap" label="Stress signal" value={health.todayHrvLow ? "elevated" : "calm"} />
            <Row icon="repeat" label="Cycle length" value={`${cycle.cycleLength} days`} />
          </GlassCard>

          <GlassCard style={{ marginBottom: 16 }}>
            <Text style={[styles.cardTitle, { color: palette.text, marginBottom: 12 }]}>
              Your numbers
            </Text>
            <Row icon="mic" label="Vents logged" value={String(vents.length)} />
            <Row icon="zap" label="Energy at sign-up" value={`${profile.energy} / 10`} />
            <Row icon="moon" label="Current phase" value={palette.name} />
          </GlassCard>

          <GlassCard>
            <Text style={[styles.cardTitle, { color: palette.text, marginBottom: 8 }]}>
              About the data
            </Text>
            <Text style={[styles.body, { color: palette.textMuted }]}>
              This prototype simulates Apple HealthKit (period dates, HRV, sleep, activity) and the
              Secret Circle cohort. Nothing leaves your device. Real HealthKit and a private
              community come next.
            </Text>
          </GlassCard>

          <Pressable
            onPress={signOut}
            style={({ pressed }) => [
              styles.signout,
              {
                borderColor: palette.glassBorder,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="log-out" size={14} color={palette.text} />
            <Text style={[styles.signoutText, { color: palette.text }]}>
              Sign out and reset
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </PhaseBackground>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  const palette = usePalette();
  return (
    <View style={[rowStyles.row, { borderBottomColor: palette.glassBorder }]}>
      <View style={[rowStyles.iconWrap, { backgroundColor: palette.primarySoft }]}>
        <Feather name={icon} size={13} color={palette.primary} />
      </View>
      <Text style={[rowStyles.label, { color: palette.textMuted }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconWrap: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  value: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

const styles = StyleSheet.create({
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  initial: { fontSize: 22, fontFamily: "Outfit_700Bold" },
  name: { fontSize: 20, fontFamily: "Outfit_600SemiBold" },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  cardTitle: { fontSize: 15, fontFamily: "Outfit_600SemiBold" },
  body: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginVertical: 10 },
  signout: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  signoutText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
