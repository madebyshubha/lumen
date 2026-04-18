import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { usePalette, useApp } from "@/context/AppContext";
import { moodAggregates, moodColor, type MoodAggregate } from "@/lib/circle";

type Blob = MoodAggregate & {
  size: number;
  x: number;
  y: number;
  color: string;
};

export function MoodMap({ width, height }: { width: number; height: number }) {
  const palette = usePalette();
  const { cycle } = useApp();

  const blobs = useMemo<Blob[]>(() => {
    if (!cycle) return [];
    const aggregates = moodAggregates(cycle.phase);
    const total = aggregates.reduce((s, a) => s + a.count, 0);

    // Layout: pre-set positions arranged to feel organic, sized by share.
    const positions = [
      { x: 0.22, y: 0.30 },
      { x: 0.58, y: 0.18 },
      { x: 0.78, y: 0.55 },
      { x: 0.40, y: 0.62 },
      { x: 0.18, y: 0.78 },
    ];
    const maxR = Math.min(width, height) * 0.32;
    const minR = Math.min(width, height) * 0.12;

    return aggregates.map((a, i) => {
      const share = a.count / total;
      const r = minR + share * (maxR - minR);
      const pos = positions[i % positions.length];
      return {
        ...a,
        size: r * 2,
        x: pos.x * width - r,
        y: pos.y * height - r,
        color: moodColor(a.mood, cycle.phase),
      };
    });
  }, [cycle, width, height]);

  return (
    <View style={[styles.canvas, { width, height, backgroundColor: palette.surface, borderColor: palette.glassBorder }]}>
      {blobs.map((b, i) => (
        <View
          key={i}
          style={[
            styles.blob,
            {
              width: b.size,
              height: b.size,
              borderRadius: b.size / 2,
              backgroundColor: b.color,
              left: b.x,
              top: b.y,
              opacity: 0.55,
            },
          ]}
        />
      ))}
      {blobs.map((b, i) => (
        <View
          key={`l-${i}`}
          style={[
            styles.labelWrap,
            { left: b.x + b.size / 2 - 40, top: b.y + b.size / 2 - 14, width: 80 },
          ]}
          pointerEvents="none"
        >
          <Text style={[styles.label, { color: palette.text }]} numberOfLines={1}>
            {b.label}
          </Text>
          <Text style={[styles.count, { color: palette.text }]}>{b.count}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { borderRadius: 28, borderWidth: 1, overflow: "hidden", position: "relative" },
  blob: { position: "absolute" },
  labelWrap: { position: "absolute", alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "lowercase" },
  count: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
