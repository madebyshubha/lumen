import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { MicButton } from "@/components/MicButton";
import { PhaseBackground } from "@/components/PhaseBackground";
import { TopBar } from "@/components/TopBar";
import { useApp, usePalette } from "@/context/AppContext";
import {
  extractHabits,
  extractSymptoms,
  HABIT_LABEL,
  pcosFix,
  SYMPTOM_LABEL,
} from "@/lib/symptoms";
import { isVoiceAvailable, startVoice, type VoiceSession } from "@/lib/voice";

export default function VentScreen() {
  const palette = usePalette();
  const { cycle, vents, addVent } = useApp();
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [lastFix, setLastFix] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  const voice = isVoiceAvailable();

  useEffect(() => () => sessionRef.current?.stop(), []);

  if (!cycle) return null;

  const start = () => {
    setError(null);
    setText("");
    if (voice) {
      const session = startVoice({
        onPartial: (t) => setText(t),
        onFinal: (t) => setText(t),
        onError: (e) => setError(e),
        onEnd: () => setRecording(false),
      });
      if (!session) {
        setError("Couldn't start voice. Type instead.");
        return;
      }
      sessionRef.current = session;
      setRecording(true);
    } else {
      // On native, "tap to record" toggles a typing affordance for the prototype.
      setRecording(true);
    }
  };

  const stop = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setRecording(false);
  };

  const submit = async () => {
    const cleaned = text.trim();
    if (!cleaned) return;
    const symptoms = extractSymptoms(cleaned);
    const habits = extractHabits(cleaned);
    const fix = pcosFix(cycle.phase, symptoms);
    await addVent({ text: cleaned, symptoms, habits, phase: cycle.phase, fix });
    setLastFix(fix);
    setText("");
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (recording) stop();
  };

  return (
    <PhaseBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 110 : 130 }}
          keyboardShouldPersistTaps="handled"
        >
          <TopBar greeting="Vent journal" />

          <View style={{ paddingHorizontal: 20 }}>
            <GlassCard>
              <Text style={[styles.title, { color: palette.text }]}>
                Tell me what you're feeling
              </Text>
              <Text style={[styles.sub, { color: palette.textMuted }]}>
                {voice
                  ? "Tap the mic and just talk. I'll catch the symptoms."
                  : "Tap the mic, then type a sentence. I'll catch the symptoms."}
              </Text>

              <View style={styles.micArea}>
                <MicButton
                  active={recording}
                  onPress={recording ? stop : start}
                  label={recording ? "Listening… tap to stop" : voice ? "Tap to talk" : "Tap to write"}
                />
              </View>

              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="I'm feeling bloated and craving sugar…"
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
              />

              {error ? (
                <Text style={[styles.error, { color: palette.text }]}>{error}</Text>
              ) : null}

              <Pressable
                onPress={submit}
                disabled={!text.trim()}
                style={({ pressed }) => [
                  styles.submit,
                  {
                    backgroundColor: text.trim() ? palette.primary : palette.surface,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Feather
                  name="check"
                  size={16}
                  color={text.trim() ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.textMuted}
                />
                <Text
                  style={[
                    styles.submitText,
                    { color: text.trim() ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.textMuted },
                  ]}
                >
                  Log it
                </Text>
              </Pressable>
            </GlassCard>

            {lastFix ? (
              <GlassCard style={{ marginTop: 14 }}>
                <View style={styles.fixHead}>
                  <View style={[styles.fixIcon, { backgroundColor: palette.accentSoft }]}>
                    <Feather name="zap" size={14} color={palette.primary} />
                  </View>
                  <Text style={[styles.fixLabel, { color: palette.textMuted }]}>PCOS fix</Text>
                </View>
                <Text style={[styles.fixText, { color: palette.text }]}>{lastFix}</Text>
              </GlassCard>
            ) : null}

            <Text style={[styles.section, { color: palette.text }]}>Recent vents</Text>
            {vents.length === 0 ? (
              <GlassCard>
                <Text style={[styles.emptyTitle, { color: palette.text }]}>Nothing yet</Text>
                <Text style={[styles.emptyText, { color: palette.textMuted }]}>
                  Your first vent will live here. Try saying "I drank water and went for a walk" to
                  log a habit.
                </Text>
              </GlassCard>
            ) : (
              <View style={{ gap: 12 }}>
                {vents.slice(0, 8).map((v) => (
                  <GlassCard key={v.id} padding={14}>
                    <View style={styles.entryHead}>
                      <View
                        style={[
                          styles.phasePill,
                          { backgroundColor: palette.primarySoft, borderColor: palette.glassBorder },
                        ]}
                      >
                        <Text style={[styles.phasePillText, { color: palette.primary }]}>
                          {v.phase}
                        </Text>
                      </View>
                      <Text style={[styles.entryTime, { color: palette.textMuted }]}>
                        {new Date(v.createdAt).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <Text style={[styles.entryText, { color: palette.text }]}>{v.text}</Text>

                    {(v.symptoms.length > 0 || v.habits.length > 0) && (
                      <View style={styles.tagsRow}>
                        {v.symptoms.map((s) => (
                          <View
                            key={`s-${s}`}
                            style={[styles.tag, { backgroundColor: palette.accentSoft }]}
                          >
                            <Text style={[styles.tagText, { color: palette.text }]}>
                              {SYMPTOM_LABEL[s]}
                            </Text>
                          </View>
                        ))}
                        {v.habits.map((h) => (
                          <View
                            key={`h-${h}`}
                            style={[
                              styles.tag,
                              { backgroundColor: palette.primary, borderColor: palette.primary },
                            ]}
                          >
                            <Feather
                              name="check"
                              size={11}
                              color={palette.isDark ? "#0f1024" : "#ffffff"}
                            />
                            <Text
                              style={[
                                styles.tagText,
                                { color: palette.isDark ? "#0f1024" : "#ffffff" },
                              ]}
                            >
                              {HABIT_LABEL[h]}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {v.fix ? (
                      <Text style={[styles.entryFix, { color: palette.textMuted }]}>{v.fix}</Text>
                    ) : null}
                  </GlassCard>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PhaseBackground>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontFamily: "Outfit_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 6 },
  micArea: { alignItems: "center", paddingVertical: 24 },
  input: {
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlignVertical: "top",
  },
  error: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 8 },
  submit: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  fixHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  fixIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  fixLabel: { fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", fontFamily: "Inter_500Medium" },
  fixText: { fontSize: 15, fontFamily: "Outfit_500Medium", lineHeight: 22 },
  section: { fontSize: 16, fontFamily: "Outfit_600SemiBold", marginTop: 20, marginBottom: 12 },
  emptyTitle: { fontSize: 14, fontFamily: "Outfit_600SemiBold", marginBottom: 6 },
  emptyText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  entryHead: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  phasePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  phasePillText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "lowercase", letterSpacing: 0.5 },
  entryTime: { fontSize: 11, fontFamily: "Inter_500Medium", marginLeft: "auto" },
  entryText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  entryFix: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 10, fontStyle: "italic", lineHeight: 18 },
});
