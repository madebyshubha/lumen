import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PhaseBackground } from "@/components/PhaseBackground";
import { usePalette } from "@/context/AppContext";

export type LegalSection = { heading: string; body: string };

export function LegalScreen({
  title,
  intro,
  sections,
  lastUpdated,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  lastUpdated: string;
}) {
  const palette = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 24 : insets.top + 8;

  return (
    <PhaseBackground>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad,
          paddingBottom: 60,
          paddingHorizontal: 20,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.back,
            { borderColor: palette.glassBorder, backgroundColor: palette.surface, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="chevron-left" size={16} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text }]}>Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.updated, { color: palette.textMuted }]}>
          Last updated {lastUpdated}
        </Text>
        <Text style={[styles.intro, { color: palette.text }]}>{intro}</Text>

        {sections.map((s) => (
          <View key={s.heading} style={{ marginTop: 22 }}>
            <Text style={[styles.heading, { color: palette.text }]}>{s.heading}</Text>
            <Text style={[styles.body, { color: palette.textMuted }]}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </PhaseBackground>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  backText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 28, fontFamily: "Outfit_700Bold", marginBottom: 4 },
  updated: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 16 },
  intro: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  heading: { fontSize: 16, fontFamily: "Outfit_600SemiBold", marginBottom: 6 },
  body: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
});
