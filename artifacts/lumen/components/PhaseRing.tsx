import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { usePalette } from "@/context/AppContext";

type Props = {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  topLabel: string;
  centerValue: string;
  bottomLabel: string;
};

export function PhaseRing({
  size = 200,
  strokeWidth = 14,
  progress,
  topLabel,
  centerValue,
  bottomLabel,
}: Props) {
  const palette = usePalette();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="phaseRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.primary} stopOpacity="1" />
            <Stop offset="1" stopColor={palette.accent} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.ringTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#phaseRing)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.top, { color: palette.textMuted }]}>{topLabel}</Text>
        <Text style={[styles.value, { color: palette.text }]}>{centerValue}</Text>
        <Text style={[styles.bottom, { color: palette.textMuted }]}>{bottomLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  top: { fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "Inter_500Medium" },
  value: { fontSize: 44, fontFamily: "Inter_700Bold", marginTop: 4, marginBottom: 2 },
  bottom: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
