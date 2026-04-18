import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/context/AppContext";

const BADGES: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  href: "/(tabs)/vent" | "/(tabs)/circle" | "/(tabs)/profile";
}[] = [
  { label: "Voice Vent", icon: "mic", href: "/(tabs)/vent" },
  { label: "Secret Circle", icon: "users", href: "/(tabs)/circle" },
  { label: "Adaptive tasks", icon: "activity", href: "/(tabs)/profile" },
  { label: "Phase synced", icon: "moon", href: "/(tabs)/profile" },
];

export function CapabilityBadges() {
  const palette = usePalette();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {BADGES.map((b, i) => (
        <Pressable
          key={i}
          onPress={() => router.push(b.href)}
          style={({ pressed }) => [
            styles.badge,
            {
              backgroundColor: palette.primarySoft,
              borderColor: palette.glassBorder,
              opacity: pressed ? 0.75 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Feather name={b.icon} size={13} color={palette.primary} />
          <Text style={[styles.label, { color: palette.text }]}>{b.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, paddingRight: 20 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
