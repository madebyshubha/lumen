import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useApp, usePalette } from "@/context/AppContext";

const FACES: { name: keyof typeof Feather.glyphMap; label: string }[] = [
  { name: "frown", label: "rough" },
  { name: "meh", label: "tender" },
  { name: "smile", label: "okay" },
  { name: "sun", label: "bright" },
  { name: "zap", label: "fired" },
];

export function MoodFaceRow() {
  const palette = usePalette();
  const { todayLog, setMood } = useApp();
  return (
    <View style={styles.wrap}>
      {FACES.map((f, i) => {
        const active = todayLog.mood === i;
        return (
          <Pressable
            key={i}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              setMood(i);
            }}
            style={({ pressed }) => [
              styles.cell,
              {
                backgroundColor: active ? palette.primary : palette.surface,
                borderColor: active ? palette.primary : palette.glassBorder,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            <Feather
              name={f.name}
              size={22}
              color={active ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.text}
            />
            <Text
              style={[
                styles.label,
                { color: active ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.textMuted },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  cell: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    gap: 4,
  },
  label: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "lowercase" },
});
