import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/context/AppContext";

type Props = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
  hint?: string;
};

export function Stepper({ icon, label, value, onMinus, onPlus, hint }: Props) {
  const palette = usePalette();
  const press = (fn: () => void) => () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    fn();
  };

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: palette.surface, borderColor: palette.glassBorder },
      ]}
    >
      <View style={styles.head}>
        <View style={[styles.iconWrap, { backgroundColor: palette.primarySoft }]}>
          <Feather name={icon} size={16} color={palette.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
          {hint ? (
            <Text style={[styles.hint, { color: palette.textMuted }]}>{hint}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={press(onMinus)}
          style={({ pressed }) => [
            styles.btn,
            { borderColor: palette.glassBorder, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="minus" size={16} color={palette.text} />
        </Pressable>
        <Text style={[styles.value, { color: palette.text }]}>{value}</Text>
        <Pressable
          onPress={press(onPlus)}
          style={({ pressed }) => [
            styles.btn,
            { borderColor: palette.glassBorder, backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="plus" size={16} color={palette.isDark ? "#0f1024" : "#ffffff"} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 14, borderRadius: 20, borderWidth: 1, gap: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  hint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    minWidth: 0,
  },
});
