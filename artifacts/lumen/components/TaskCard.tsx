import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useApp, usePalette } from "@/context/AppContext";
import type { Task } from "@/lib/tasks";

const ICONS: Record<Task["kind"], keyof typeof Feather.glyphMap> = {
  rest: "moon",
  hydration: "droplet",
  movement: "wind",
  food: "coffee",
  social: "send",
  mindset: "feather",
  supplement: "package",
};

export function TaskCard({ task }: { task: Task }) {
  const palette = usePalette();
  const { todayLog, toggleTask } = useApp();
  const done = todayLog.completedTaskIds.includes(task.id);

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(
            done ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success,
          );
        }
        toggleTask(task.id);
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: done ? palette.primarySoft : palette.surface,
          borderColor: done ? palette.primary : palette.glassBorder,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: palette.accentSoft }]}>
        <Feather name={ICONS[task.kind]} size={18} color={palette.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: palette.text, textDecorationLine: done ? "line-through" : "none" }]}>
          {task.title}
        </Text>
        <Text style={[styles.detail, { color: palette.textMuted }]}>{task.detail}</Text>
        {task.scaledNote ? (
          <View style={[styles.scaledTag, { backgroundColor: palette.accentSoft }]}>
            <Feather name="info" size={11} color={palette.primary} />
            <Text style={[styles.scaledText, { color: palette.text }]}>{task.scaledNote}</Text>
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.check,
          {
            backgroundColor: done ? palette.primary : "transparent",
            borderColor: done ? palette.primary : palette.glassBorder,
          },
        ]}
      >
        {done ? (
          <Feather name="check" size={14} color={palette.isDark ? "#0f1024" : "#ffffff"} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
  },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  detail: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  scaledTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  scaledText: { fontSize: 11, fontFamily: "Inter_500Medium", flexShrink: 1 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
