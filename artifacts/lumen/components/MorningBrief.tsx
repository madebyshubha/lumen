import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useApp, usePalette } from "@/context/AppContext";

import { GlassCard } from "./GlassCard";

// "I already checked your watch — restless night. I moved your workout to
// tomorrow and made hydration today's main goal." This card is the whole
// reason a user keeps Lumen on her home screen — the app talked to her
// device before she opened it. Rendered above the FeelingHeader so it's
// the first thing she sees. Only shows when there's no user-driven vibe
// (her own words always win) and she hasn't tapped Got it for the day.
export function MorningBrief() {
  const palette = usePalette();
  const { morningBrief, vibe, dismissMorningBrief, todayLog } = useApp();

  if (!morningBrief) return null;
  if (vibe) return null; // user spoke — let her words drive
  if (todayLog.dismissedBriefId === morningBrief.id) return null;

  return (
    <View style={{ marginBottom: 14 }}>
      <GlassCard padding={16}>
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: palette.primarySoft },
            ]}
          >
            <Feather name="activity" size={16} color={palette.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: palette.primary }]}>
              Proactive care
            </Text>
            <Text
              style={[styles.title, { color: palette.text }]}
              accessibilityRole="header"
            >
              {morningBrief.title}
            </Text>
          </View>
        </View>

        <Text style={[styles.detail, { color: palette.textMuted }]}>
          {morningBrief.detail}
        </Text>

        <View style={styles.bullets}>
          {morningBrief.bullets.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <View
                style={[styles.bulletDot, { backgroundColor: palette.primary }]}
              />
              <Text style={[styles.bulletText, { color: palette.text }]}>
                {b}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={dismissMorningBrief}
          accessibilityRole="button"
          accessibilityLabel="Got it — dismiss the morning briefing"
          style={({ pressed }) => [
            styles.gotIt,
            {
              backgroundColor: palette.surface,
              borderColor: palette.glassBorder,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.gotItText, { color: palette.text }]}>
            Got it
          </Text>
          <Feather name="check" size={13} color={palette.text} />
        </Pressable>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontFamily: "Inter_600SemiBold",
  },
  title: {
    fontSize: 16.5,
    fontFamily: "Outfit_600SemiBold",
    marginTop: 3,
    lineHeight: 22,
  },
  detail: {
    fontSize: 13.5,
    fontFamily: "Inter_400Regular",
    marginTop: 10,
    lineHeight: 19,
  },
  bullets: { marginTop: 12, gap: 8 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: "Inter_500Medium",
    lineHeight: 19,
  },
  gotIt: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 14,
  },
  gotItText: { fontSize: 12.5, fontFamily: "Inter_600SemiBold" },
});
