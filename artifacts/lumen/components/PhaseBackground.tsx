import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

import { usePalette } from "@/context/AppContext";

export function PhaseBackground({ children }: { children: React.ReactNode }) {
  const palette = usePalette();
  return (
    <View style={[styles.wrap, { backgroundColor: palette.background }]}>
      <LinearGradient
        colors={[palette.gradientFrom, palette.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft glow blobs */}
      <View style={[styles.glow, { backgroundColor: palette.accent, top: -120, right: -80, opacity: 0.18 }]} />
      <View style={[styles.glow, { backgroundColor: palette.primary, bottom: -150, left: -60, opacity: 0.14 }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  glow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
  },
});
