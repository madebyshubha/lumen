import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { useApp, usePalette } from "@/context/AppContext";
import {
  MEAL_SCORE_LABEL,
  MEAL_SLOT_LABEL,
  type MealScore,
  type MealSlot,
} from "@/lib/lifestyle";

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

const SCORE_ICON: Record<MealScore, keyof typeof Feather.glyphMap> = {
  steady: "check-circle",
  mixed: "circle",
  spike: "alert-circle",
};

export function MealLogger() {
  const palette = usePalette();
  const { todayLog, addMeal, removeMeal } = useApp();
  const [activeSlot, setActiveSlot] = useState<MealSlot | null>(null);
  const [draft, setDraft] = useState("");

  const meals = todayLog.context.meals;

  const handleSubmit = () => {
    if (!activeSlot || !draft.trim()) return;
    addMeal(activeSlot, draft);
    setDraft("");
    setActiveSlot(null);
  };

  const scoreColor = (s: MealScore): string => {
    if (s === "steady") return "#1e9d6b";
    if (s === "spike") return "#d97639";
    return palette.textMuted;
  };

  return (
    <GlassCard style={{ marginBottom: 16 }}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: palette.text }]}>What did you eat?</Text>
        <Text style={[styles.sub, { color: palette.textMuted }]}>
          {meals.length === 0 ? "Log a quick line" : `${meals.length} today`}
        </Text>
      </View>

      <View style={styles.slotRow}>
        {SLOTS.map((s) => {
          const active = activeSlot === s;
          return (
            <Pressable
              key={s}
              onPress={() => setActiveSlot(active ? null : s)}
              style={({ pressed }) => [
                styles.slot,
                {
                  backgroundColor: active ? palette.primary : palette.surfaceMuted,
                  borderColor: active ? palette.primary : palette.glassBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.slotText,
                  { color: active ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.text },
                ]}
              >
                {MEAL_SLOT_LABEL[s]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeSlot ? (
        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={`Tell me about your ${MEAL_SLOT_LABEL[activeSlot].toLowerCase()}…`}
            placeholderTextColor={palette.textMuted}
            multiline
            style={[
              styles.input,
              {
                color: palette.text,
                borderColor: palette.glassBorder,
                backgroundColor: palette.surfaceMuted,
              },
            ]}
            onSubmitEditing={handleSubmit}
          />
          <Pressable
            onPress={handleSubmit}
            disabled={!draft.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: draft.trim() ? palette.primary : palette.surfaceMuted,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather
              name="check"
              size={16}
              color={draft.trim() ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.textMuted}
            />
          </Pressable>
        </View>
      ) : null}

      {meals.length > 0 ? (
        <View style={[styles.list, { borderTopColor: palette.glassBorder }]}>
          {meals.slice(0, 5).map((m) => (
            <View key={m.id} style={styles.mealRow}>
              <Feather name={SCORE_ICON[m.score]} size={14} color={scoreColor(m.score)} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.mealText, { color: palette.text }]} numberOfLines={2}>
                  {m.text}
                </Text>
                <Text style={[styles.mealMeta, { color: palette.textMuted }]}>
                  {MEAL_SLOT_LABEL[m.slot]} · {MEAL_SCORE_LABEL[m.score]}
                </Text>
              </View>
              <Pressable onPress={() => removeMeal(m.id)} hitSlop={10}>
                <Feather name="x" size={14} color={palette.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 },
  title: { fontSize: 16, fontFamily: "Outfit_600SemiBold" },
  sub: { fontSize: 12, fontFamily: "Inter_500Medium" },
  slotRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  slot: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  slotText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 12 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  mealRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  mealText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  mealMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
});
