import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  critical: "Must do",
  important: "Lean in",
  gentle: "If you can",
};

export function MissionCard({ task }: { task: Task }) {
  const palette = usePalette();
  const { todayLog, toggleTask } = useApp();
  const done = todayLog.completedTaskIds.includes(task.id);
  const [open, setOpen] = useState(false);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: done ? palette.primarySoft : palette.surface,
          borderColor: done ? palette.primary : palette.glassBorder,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: palette.accentSoft }]}>
          <Feather name={ICONS[task.kind]} size={18} color={palette.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.priorityRow}>
            <View
              style={[
                styles.priorityDot,
                {
                  backgroundColor:
                    task.priority === "critical"
                      ? palette.primary
                      : task.priority === "important"
                        ? palette.accent
                        : palette.glassBorder,
                },
              ]}
            />
            <Text style={[styles.priorityLabel, { color: palette.textMuted }]}>
              {PRIORITY_LABEL[task.priority]}
            </Text>
            {task.context ? (
              <View style={[styles.contextChip, { backgroundColor: palette.surfaceMuted }]}>
                <Text style={[styles.contextText, { color: palette.textMuted }]} numberOfLines={1}>
                  {task.context}
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            style={[
              styles.title,
              { color: palette.text, textDecorationLine: done ? "line-through" : "none" },
            ]}
          >
            {task.title}
          </Text>
          <Text style={[styles.detail, { color: palette.textMuted }]}>{task.detail}</Text>
        </View>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                done ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success,
              );
            }
            toggleTask(task.id);
          }}
          accessibilityRole="checkbox"
          accessibilityLabel={`Mark "${task.title}" ${done ? "incomplete" : "complete"}`}
          accessibilityState={{ checked: done }}
          hitSlop={12}
          style={({ pressed }) => [
            styles.check,
            {
              backgroundColor: done ? palette.primary : "transparent",
              borderColor: done ? palette.primary : palette.glassBorder,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
        >
          {done ? (
            <Feather name="check" size={16} color={palette.isDark ? "#0f1024" : "#ffffff"} />
          ) : null}
        </Pressable>
      </View>

      {task.scaledNote ? (
        <View style={[styles.scaledTag, { backgroundColor: palette.accentSoft }]}>
          <Feather name="info" size={11} color={palette.primary} />
          <Text style={[styles.scaledText, { color: palette.text }]}>{task.scaledNote}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[styles.whyToggle, { borderTopColor: palette.glassBorder }]}
      >
        <Text style={[styles.whyToggleText, { color: palette.primary }]}>
          {open ? "Hide why" : "Why this matters"}
        </Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={14}
          color={palette.primary}
        />
      </Pressable>
      {open ? (
        <Text style={[styles.why, { color: palette.textMuted }]}>{task.why}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 0,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  priorityRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
  },
  contextChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginLeft: 4, maxWidth: 160 },
  contextText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  title: { fontSize: 16, fontFamily: "Outfit_600SemiBold" },
  detail: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 19 },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  scaledTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  scaledText: { fontSize: 11, fontFamily: "Inter_500Medium", flexShrink: 1 },
  whyToggle: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  whyToggleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  why: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 8 },
});
