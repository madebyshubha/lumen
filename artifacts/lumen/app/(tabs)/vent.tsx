import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { runVentAnalysis } from "@/lib/analyzer";
import { HABIT_LABEL, SYMPTOM_LABEL } from "@/lib/symptoms";
import { transcribeWithHostedAsr } from "@/lib/asr";
import { concernLabel } from "@/lib/protocols";
import { isVoiceAvailable, startVoice, type VoiceSession } from "@/lib/voice";

export default function VentScreen() {
  const palette = usePalette();
  const {
    cycle,
    profile,
    vents,
    todayLog,
    addVent,
    updateVent,
    addConcern,
  } = useApp();
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [improving, setImproving] = useState(false);
  const [lastVentId, setLastVentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  // Track which on-device transcript the hosted ASR result is allowed to
  // replace. If the user has edited the text by hand in the meantime, we
  // leave their edit alone.
  const onDeviceTranscriptRef = useRef<string>("");
  const userEditedRef = useRef<boolean>(false);
  const voice = isVoiceAvailable();

  useEffect(() => () => sessionRef.current?.stop(), []);

  if (!cycle || !profile) return null;

  const lastVent = lastVentId ? vents.find((v) => v.id === lastVentId) ?? null : null;
  const trackedConcernKeys = todayLog.context.concerns.map((c) => c.key);

  const start = () => {
    setError(null);
    setText("");
    onDeviceTranscriptRef.current = "";
    userEditedRef.current = false;
    if (voice) {
      const session = startVoice({
        onPartial: (t) => {
          onDeviceTranscriptRef.current = t;
          setText(t);
        },
        onFinal: (t) => {
          onDeviceTranscriptRef.current = t;
          setText(t);
        },
        onError: (e) => setError(e),
        onEnd: () => setRecording(false),
        onAudio: async (audio) => {
          // Re-transcribe via hosted Whisper for higher accuracy on symptom
          // names, foods and numbers. Keeps the on-device transcript in
          // place if anything fails or the user edited the text.
          setImproving(true);
          try {
            const better = await transcribeWithHostedAsr(audio, {
              concerns: trackedConcernKeys.map((k) => concernLabel(k)),
              recentVentTexts: vents.slice(0, 3).map((v) => v.text),
            });
            if (
              better &&
              !userEditedRef.current &&
              better.toLowerCase() !== onDeviceTranscriptRef.current.trim().toLowerCase()
            ) {
              setText(better);
              onDeviceTranscriptRef.current = better;
            }
          } finally {
            setImproving(false);
          }
        },
      });
      if (!session) {
        setError("Couldn't start voice. Type instead.");
        return;
      }
      sessionRef.current = session;
      setRecording(true);
    } else {
      setRecording(true);
    }
  };

  const onChangeText = (v: string) => {
    if (v !== onDeviceTranscriptRef.current) userEditedRef.current = true;
    setText(v);
  };

  const stop = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setRecording(false);
  };

  const submit = async () => {
    const cleaned = text.trim();
    if (!cleaned || analyzing) return;

    setAnalyzing(true);
    try {
      const result = await runVentAnalysis({
        text: cleaned,
        phase: cycle.phase,
        dayOfCycle: cycle.dayOfCycle,
        cycleLength: profile.cycleLength,
        diet: profile.diet,
        homeCountry: profile.homeCountry,
        travelling: todayLog.context.travelling,
        travelCountry: todayLog.context.travelCountry,
        energy: profile.energy,
        trackedConcerns: trackedConcernKeys,
        recentVentTexts: vents.slice(0, 5).map((v) => v.text),
      });

      const newId = await addVent({
        text: cleaned,
        symptoms: result.symptoms,
        habits: result.habits,
        phase: cycle.phase,
        fix: result.explanation,
        headline: result.headline,
        explanation: result.explanation,
        followUp: result.followUp,
        analyzedOffline: result.analyzedOffline,
      });
      setLastVentId(newId);

      setText("");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (recording) stop();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't analyze. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const dismissSymptom = (id: string, tag: string) => {
    if (analyzing) return;
    const v = vents.find((x) => x.id === id);
    if (!v) return;
    updateVent(id, { symptoms: v.symptoms.filter((s) => s !== tag) });
  };

  const dismissHabit = (id: string, tag: string) => {
    if (analyzing) return;
    const v = vents.find((x) => x.id === id);
    if (!v) return;
    updateVent(id, { habits: v.habits.filter((h) => h !== tag) });
  };

  const trackConcern = async (id: string, concern: string, label: string) => {
    if (!trackedConcernKeys.includes(concern as (typeof trackedConcernKeys)[number])) {
      await addConcern(concern as (typeof trackedConcernKeys)[number]);
    }
    // Mark the followUp as consumed so the CTA disappears.
    updateVent(id, { followUp: null });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
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
                  ? "Tap the mic and just talk. I'll read between the lines."
                  : "Tap the mic, then type a sentence. I'll read between the lines."}
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
                onChangeText={onChangeText}
                placeholder="I'm feeling bloated and craving sugar…"
                placeholderTextColor={palette.textMuted}
                multiline
                editable={!analyzing}
                style={[
                  styles.input,
                  {
                    color: palette.text,
                    borderColor: palette.glassBorder,
                    backgroundColor: palette.surfaceMuted,
                    opacity: analyzing ? 0.6 : 1,
                  },
                ]}
              />

              {improving ? (
                <View style={styles.improvingRow}>
                  <ActivityIndicator size="small" color={palette.primary} />
                  <Text style={[styles.improvingText, { color: palette.textMuted }]}>
                    Sharpening what you said…
                  </Text>
                </View>
              ) : null}

              {error ? (
                <Text style={[styles.error, { color: palette.text }]}>{error}</Text>
              ) : null}

              <Pressable
                onPress={submit}
                disabled={!text.trim() || analyzing}
                style={({ pressed }) => [
                  styles.submit,
                  {
                    backgroundColor: text.trim() && !analyzing ? palette.primary : palette.surface,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                {analyzing ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color={palette.isDark ? "#0f1024" : "#ffffff"}
                    />
                    <Text
                      style={[
                        styles.submitText,
                        { color: palette.isDark ? "#0f1024" : "#ffffff" },
                      ]}
                    >
                      Reading your vent…
                    </Text>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </Pressable>
            </GlassCard>

            {analyzing ? (
              <GlassCard style={{ marginTop: 14 }}>
                <View style={styles.fixHead}>
                  <View style={[styles.fixIcon, { backgroundColor: palette.accentSoft }]}>
                    <ActivityIndicator size="small" color={palette.primary} />
                  </View>
                  <Text style={[styles.fixLabel, { color: palette.textMuted }]}>
                    Reading your vent
                  </Text>
                </View>
                <Text style={[styles.headline, { color: palette.text }]}>
                  Looking at your phase, energy, and what you said…
                </Text>
                <Text style={[styles.fixText, { color: palette.textMuted }]}>
                  This usually takes a few seconds. If the connection is slow, I'll
                  fall back to a quick local read so you're never stuck waiting.
                </Text>
              </GlassCard>
            ) : lastVent ? (
              <GlassCard style={{ marginTop: 14 }}>
                <View style={styles.fixHead}>
                  <View style={[styles.fixIcon, { backgroundColor: palette.accentSoft }]}>
                    <Feather name="zap" size={14} color={palette.primary} />
                  </View>
                  <Text style={[styles.fixLabel, { color: palette.textMuted }]}>
                    {lastVent.analyzedOffline ? "Quick read (offline)" : "What I noticed"}
                  </Text>
                </View>
                {lastVent.headline ? (
                  <Text style={[styles.headline, { color: palette.text }]}>
                    {lastVent.headline}
                  </Text>
                ) : null}
                <Text style={[styles.fixText, { color: palette.text }]}>
                  {lastVent.explanation ?? lastVent.fix}
                </Text>

                {(lastVent.symptoms.length > 0 || lastVent.habits.length > 0) && (
                  <View style={styles.tagsRow}>
                    {lastVent.symptoms.map((s) => (
                      <Pressable
                        key={`s-${s}`}
                        onPress={() => dismissSymptom(lastVent.id, s)}
                        style={[styles.tag, { backgroundColor: palette.accentSoft }]}
                      >
                        <Text style={[styles.tagText, { color: palette.text }]}>
                          {SYMPTOM_LABEL[s]}
                        </Text>
                        <Feather name="x" size={11} color={palette.textMuted} />
                      </Pressable>
                    ))}
                    {lastVent.habits.map((h) => (
                      <Pressable
                        key={`h-${h}`}
                        onPress={() => dismissHabit(lastVent.id, h)}
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
                        <Feather
                          name="x"
                          size={11}
                          color={palette.isDark ? "#0f1024" : "#ffffff"}
                        />
                      </Pressable>
                    ))}
                  </View>
                )}

                {lastVent.followUp ? (
                  <Pressable
                    onPress={() =>
                      trackConcern(
                        lastVent.id,
                        lastVent.followUp!.concern,
                        lastVent.followUp!.label,
                      )
                    }
                    style={({ pressed }) => [
                      styles.trackCta,
                      {
                        borderColor: palette.glassBorder,
                        backgroundColor: palette.surfaceMuted,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Feather name="plus-circle" size={14} color={palette.primary} />
                    <Text style={[styles.trackText, { color: palette.text }]}>
                      {lastVent.followUp.label}
                    </Text>
                  </Pressable>
                ) : null}
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

                    {v.headline ? (
                      <Text style={[styles.entryHeadline, { color: palette.text }]}>
                        {v.headline}
                      </Text>
                    ) : null}

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

                    {v.explanation ?? v.fix ? (
                      <Text style={[styles.entryFix, { color: palette.textMuted }]}>
                        {v.explanation ?? v.fix}
                      </Text>
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
  improvingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  improvingText: { fontSize: 12, fontFamily: "Inter_500Medium" },
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
  headline: { fontSize: 18, fontFamily: "Outfit_600SemiBold", marginBottom: 6, lineHeight: 24 },
  fixText: { fontSize: 15, fontFamily: "Outfit_500Medium", lineHeight: 22 },
  trackCta: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  trackText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  section: { fontSize: 16, fontFamily: "Outfit_600SemiBold", marginTop: 20, marginBottom: 12 },
  emptyTitle: { fontSize: 14, fontFamily: "Outfit_600SemiBold", marginBottom: 6 },
  emptyText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  entryHead: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  phasePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  phasePillText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "lowercase", letterSpacing: 0.5 },
  entryTime: { fontSize: 11, fontFamily: "Inter_500Medium", marginLeft: "auto" },
  entryText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  entryHeadline: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    lineHeight: 20,
    marginTop: 8,
  },
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
