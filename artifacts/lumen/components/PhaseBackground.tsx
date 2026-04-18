import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

import { usePalette } from "@/context/AppContext";

export type PhaseIntensity = "soft" | "normal" | "punchy";

export function PhaseBackground({
  children,
  intensity = "normal",
}: {
  children: React.ReactNode;
  intensity?: PhaseIntensity;
}) {
  const palette = usePalette();
  // Glow blobs scale with intensity so the screen visibly softens (low/anxious)
  // or amps up (vibrant). Background color stays the same to preserve phase
  // identity.
  const top = intensity === "soft" ? 0.08 : intensity === "punchy" ? 0.26 : 0.18;
  const bottom = intensity === "soft" ? 0.06 : intensity === "punchy" ? 0.2 : 0.14;
  const dim = intensity === "soft" ? 0.85 : 1;
  return (
    <View style={[styles.wrap, { backgroundColor: palette.background }]}>
      <LinearGradient
        colors={[palette.gradientFrom, palette.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: dim }]}
      />
      {/* Soft glow blobs */}
      <View style={[styles.glow, { backgroundColor: palette.accent, top: -120, right: -80, opacity: top }]} />
      <View style={[styles.glow, { backgroundColor: palette.primary, bottom: -150, left: -60, opacity: bottom }]} />
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
