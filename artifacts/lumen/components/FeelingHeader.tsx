import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { type ReactElement } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { useApp, usePalette } from "@/context/AppContext";

// Top-of-home feeling row. One tap on a face does two things:
//   1. Logs today's mood (setMood).
//   2. Reshapes the entire home for that vibe (applyVibe with a canned
//      sentence per face — no typing required).
// When a vibe is active we show the "Tuned for …" pill underneath with a
// quick clear button to revert.

type Face = {
  name: keyof typeof Feather.glyphMap;
  label: string;
  sentence: string;
};

const FACES: Face[] = [
  {
    name: "frown",
    label: "rough",
    sentence: "I'm feeling really low and exhausted today.",
  },
  {
    name: "meh",
    label: "tender",
    sentence: "I'm tender and anxious today, my mind is racing a bit.",
  },
  {
    name: "smile",
    label: "okay",
    sentence: "I'm okay today — feeling pretty steady.",
  },
  {
    name: "sun",
    label: "bright",
    sentence: "I'm feeling bright and good today.",
  },
  {
    name: "zap",
    label: "fired",
    sentence: "I feel amazing and full of energy today.",
  },
];

export function FeelingHeader(): ReactElement {
  const palette = usePalette();
  const { todayLog, setMood, vibe, vibeLoading, applyVibe, clearVibe } =
    useApp();

  const onPickFace = (i: number) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setMood(i);
    applyVibe(FACES[i].sentence);
  };

  return (
    <GlassCard padding={14} style={{ marginBottom: 12 }}>
      <Text style={[styles.label, { color: palette.textMuted }]}>
        How do you feel today?
      </Text>
      <View style={styles.row}>
        {FACES.map((f, i) => {
          const active = todayLog.mood === i;
          return (
            <Pressable
              key={i}
              onPress={() => onPickFace(i)}
              accessibilityRole="button"
              accessibilityLabel={`Feeling ${f.label} — tune the home for this`}
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
                color={
                  active
                    ? palette.isDark
                      ? "#0f1024"
                      : "#ffffff"
                    : palette.text
                }
              />
              <Text
                style={[
                  styles.faceLabel,
                  {
                    color: active
                      ? palette.isDark
                        ? "#0f1024"
                        : "#ffffff"
                      : palette.textMuted,
                  },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {vibeLoading ? (
        <View style={[styles.statusRow, { borderTopColor: palette.glassBorder }]}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={[styles.statusText, { color: palette.textMuted }]}>
            Tuning your home…
          </Text>
        </View>
      ) : vibe ? (
        <View style={[styles.statusRow, { borderTopColor: palette.glassBorder }]}>
          <View style={[styles.statusIcon, { backgroundColor: palette.primarySoft }]}>
            <Feather name="compass" size={12} color={palette.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[styles.statusPill, { color: palette.textMuted }]}
              numberOfLines={1}
            >
              {vibe.pillLabel}
              {vibe.analyzedOffline ? " · offline" : ""}
            </Text>
            <Text
              style={[styles.statusHeadline, { color: palette.text }]}
              numberOfLines={2}
            >
              {vibe.headline}
            </Text>
          </View>
          <Pressable
            onPress={clearVibe}
            accessibilityRole="button"
            accessibilityLabel="Clear current mood and return home to default"
            hitSlop={10}
            style={({ pressed }) => [
              styles.clearBtn,
              {
                backgroundColor: palette.surface,
                borderColor: palette.glassBorder,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="x" size={14} color={palette.textMuted} />
          </Pressable>
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  cell: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    gap: 4,
  },
  faceLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "lowercase",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
  },
  statusHeadline: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
    lineHeight: 18,
  },
  statusText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  clearBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
