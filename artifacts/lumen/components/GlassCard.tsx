import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";

import { usePalette } from "@/context/AppContext";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  padding?: number;
};

export function GlassCard({ children, style, intensity = 30, padding = 18 }: Props) {
  const palette = usePalette();
  const useBlur = Platform.OS !== "android"; // Android blur is jittery in Expo Go

  const wrapStyle: ViewStyle = {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: useBlur ? palette.glass : palette.surface,
  };

  return (
    <View style={[wrapStyle, style]}>
      {useBlur ? (
        <BlurView
          tint={palette.isDark ? "dark" : "light"}
          intensity={intensity}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={{ padding }}>{children}</View>
    </View>
  );
}
