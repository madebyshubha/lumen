import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { useApp, usePalette } from "@/context/AppContext";
import {
  MEAL_SCORE_LABEL,
  MEAL_SLOT_LABEL,
  type MealScore,
  type MealSlot,
} from "@/lib/lifestyle";
import { isVoiceAvailable, startVoice, type VoiceSession } from "@/lib/voice";

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

const SCORE_ICON: Record<MealScore, keyof typeof Feather.glyphMap> = {
  steady: "check-circle",
  mixed: "circle",
  spike: "alert-circle",
};

function MicPill({
  listening,
  onPress,
}: {
  listening: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (listening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.setValue(0);
    }
  }, [listening, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <View style={micStyles.wrap}>
      {listening ? (
        <Animated.View
          style={[
            micStyles.ring,
            {
              backgroundColor: palette.accent,
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />
      ) : null}
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          micStyles.btn,
          {
            backgroundColor: listening ? palette.accent : palette.surfaceMuted,
            borderColor: listening ? palette.accent : palette.glassBorder,
            transform: [{ scale: pressed ? 0.93 : 1 }],
          },
        ]}
      >
        <Feather
          name={listening ? "square" : "mic"}
          size={16}
          color={listening ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.primary}
        />
      </Pressable>
    </View>
  );
}

const micStyles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export function MealLogger() {
  const palette = usePalette();
  const { todayLog, addMeal, removeMeal } = useApp();
  const [activeSlot, setActiveSlot] = useState<MealSlot | null>(null);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  const voiceAvailable = isVoiceAvailable();

  const meals = todayLog.context.meals;

  const stopListening = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setListening(false);
  };

  const toggleVoice = () => {
    if (listening) {
      stopListening();
      return;
    }
    setVoiceHint(null);
    const session = startVoice({
      onPartial: (text) => setDraft(text),
      onFinal: (text) => {
        if (text.trim()) setDraft(text.trim());
      },
      onError: (err) => {
        setListening(false);
        sessionRef.current = null;
        if (err === "not-allowed") {
          setVoiceHint(
            Platform.OS === "web"
              ? "Microphone permission denied. Enable it in browser settings."
              : "Microphone permission denied. Enable it in your device settings.",
          );
        } else {
          setVoiceHint("Voice not available — type instead.");
        }
      },
      onEnd: () => {
        setListening(false);
        sessionRef.current = null;
      },
    });
    if (session) {
      sessionRef.current = session;
      setListening(true);
      setVoiceHint(null);
    } else {
      setVoiceHint("Voice not supported in this browser. Type instead.");
    }
  };

  // Clean up on unmount or slot change
  useEffect(() => {
    return () => stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeSlot) stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlot]);

  const handleSubmit = () => {
    if (!activeSlot || !draft.trim()) return;
    stopListening();
    addMeal(activeSlot, draft);
    setDraft("");
    setActiveSlot(null);
    setVoiceHint(null);
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
        <>
          {voiceAvailable ? (
            <View style={styles.voiceRow}>
              <MicPill listening={listening} onPress={toggleVoice} />
              <Text style={[styles.voiceLabel, { color: palette.textMuted }]}>
                {listening
                  ? "Listening… tap the square to stop"
                  : "Tap the mic and speak your meal"}
              </Text>
            </View>
          ) : null}

          {voiceHint ? (
            <Text style={[styles.hint, { color: palette.textMuted }]}>{voiceHint}</Text>
          ) : null}

          <View style={styles.inputRow}>
            <TextInput
              value={draft}
              onChangeText={(t) => {
                if (listening) stopListening();
                setDraft(t);
              }}
              placeholder={
                listening
                  ? "Listening…"
                  : `Tell me about your ${MEAL_SLOT_LABEL[activeSlot].toLowerCase()}…`
              }
              placeholderTextColor={listening ? palette.primary : palette.textMuted}
              multiline
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: listening ? palette.primary : palette.glassBorder,
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
        </>
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
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  title: { fontSize: 16, fontFamily: "Outfit_600SemiBold" },
  sub: { fontSize: 12, fontFamily: "Inter_500Medium" },
  slotRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  slot: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  slotText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  voiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    marginBottom: 4,
  },
  voiceLabel: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 6, marginBottom: 2 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 10 },
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
  list: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  mealRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  mealText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  mealMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
});
