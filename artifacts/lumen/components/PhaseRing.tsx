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

// The inner text scales with `size` so a compact 96-px ring stays readable
// without the value crowding the curved labels above and below.
function scaleText(size: number) {
  if (size <= 110) {
    return {
      top: { fontSize: 9, letterSpacing: 1, marginBottom: 1 },
      value: { fontSize: 22, marginVertical: 0 },
      bottom: { fontSize: 10, marginTop: 1 },
    };
  }
  if (size <= 150) {
    return {
      top: { fontSize: 10, letterSpacing: 1.2, marginBottom: 2 },
      value: { fontSize: 32, marginVertical: 1 },
      bottom: { fontSize: 11, marginTop: 1 },
    };
  }
  return {
    top: { fontSize: 11, letterSpacing: 1.5, marginBottom: 2 },
    value: { fontSize: 44, marginVertical: 2 },
    bottom: { fontSize: 13, marginTop: 0 },
  };
}

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
  const t = scaleText(size);
  // Inner text box must stay clear of the stroke. Inset by stroke + small pad.
  const inset = strokeWidth + 6;

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
      <View
        style={[
          styles.center,
          { top: inset, bottom: inset, left: inset, right: inset },
        ]}
        pointerEvents="none"
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            styles.top,
            {
              color: palette.textMuted,
              fontSize: t.top.fontSize,
              letterSpacing: t.top.letterSpacing,
              marginBottom: t.top.marginBottom,
            },
          ]}
        >
          {topLabel}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            styles.value,
            {
              color: palette.text,
              fontSize: t.value.fontSize,
              marginVertical: t.value.marginVertical,
            },
          ]}
        >
          {centerValue}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            styles.bottom,
            {
              color: palette.textMuted,
              fontSize: t.bottom.fontSize,
              marginTop: t.bottom.marginTop,
            },
          ]}
        >
          {bottomLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  top: { textTransform: "uppercase", fontFamily: "Inter_500Medium", textAlign: "center" },
  value: { fontFamily: "Inter_700Bold", textAlign: "center", lineHeight: undefined },
  bottom: { fontFamily: "Inter_500Medium", textAlign: "center" },
});
