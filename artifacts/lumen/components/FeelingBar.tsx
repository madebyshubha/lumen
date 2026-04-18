import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { useApp, usePalette } from "@/context/AppContext";
import { isVoiceAvailable, startVoice, type VoiceSession } from "@/lib/voice";

// Top-of-home "How are you feeling right now?" entry. One sentence is enough —
// the home reshapes itself based on the returned vibe directive.
export function FeelingBar() {
  const palette = usePalette();
  const { vibe, vibeLoading, applyVibe, clearVibe } = useApp();
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [session, setSession] = useState<VoiceSession | null>(null);
  const voiceSupported = isVoiceAvailable();

  // Stop a recording session if the bar unmounts or the user navigates away.
  useEffect(() => {
    return () => {
      session?.stop();
    };
  }, [session]);

  const submit = async (raw: string) => {
    const sentence = raw.trim();
    if (!sentence) return;
    setText("");
    await applyVibe(sentence);
  };

  const toggleVoice = () => {
    if (recording) {
      session?.stop();
      setRecording(false);
      setSession(null);
      return;
    }
    const s = startVoice({
      onPartial: (t) => setText(t),
      onFinal: (t) => {
        if (t) submit(t);
      },
      onError: () => {
        setRecording(false);
        setSession(null);
      },
      onEnd: () => {
        setRecording(false);
        setSession(null);
      },
    });
    if (s) {
      setSession(s);
      setRecording(true);
    }
  };

  // Active pill mode — show the "Tuned for …" pill instead of the input.
  if (vibe && !vibeLoading) {
    return (
      <GlassCard padding={12} style={{ marginBottom: 12 }}>
        <View style={styles.activeRow}>
          <View style={[styles.activeIcon, { backgroundColor: palette.primarySoft }]}>
            <Feather name="compass" size={14} color={palette.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.activeLabel, { color: palette.textMuted }]} numberOfLines={1}>
              {vibe.pillLabel}
              {vibe.analyzedOffline ? " · offline" : ""}
            </Text>
            <Text style={[styles.activeHeadline, { color: palette.text }]} numberOfLines={2}>
              {vibe.headline}
            </Text>
          </View>
          <Pressable
            onPress={clearVibe}
            accessibilityRole="button"
            accessibilityLabel="Clear current mood — return the home to default"
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
      </GlassCard>
    );
  }

  // Loading shimmer
  if (vibeLoading) {
    return (
      <GlassCard padding={14} style={{ marginBottom: 12 }}>
        <View style={styles.activeRow}>
          <View style={[styles.activeIcon, { backgroundColor: palette.accentSoft }]}>
            <ActivityIndicator size="small" color={palette.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.activeLabel, { color: palette.textMuted }]}>
              Reading the room
            </Text>
            <Text style={[styles.activeHeadline, { color: palette.text }]} numberOfLines={2}>
              Tuning your home to how you said you feel…
            </Text>
          </View>
        </View>
      </GlassCard>
    );
  }

  // Default — input bar
  return (
    <GlassCard padding={12} style={{ marginBottom: 12 }}>
      <Text style={[styles.label, { color: palette.textMuted }]}>
        How are you feeling right now?
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => submit(text)}
          placeholder='e.g. "I’m feeling really low today"'
          placeholderTextColor={palette.textMuted}
          accessibilityLabel="One sentence about how you feel"
          returnKeyType="send"
          style={[
            styles.input,
            {
              color: palette.text,
              backgroundColor: palette.surface,
              borderColor: palette.glassBorder,
            },
          ]}
        />
        {voiceSupported ? (
          <Pressable
            onPress={toggleVoice}
            accessibilityRole="button"
            accessibilityLabel={recording ? "Stop recording" : "Start voice input"}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: recording ? palette.primary : palette.surface,
                borderColor: recording ? palette.primary : palette.glassBorder,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather
              name="mic"
              size={16}
              color={
                recording
                  ? palette.isDark
                    ? "#0f1024"
                    : "#ffffff"
                  : palette.primary
              }
            />
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => submit(text)}
          disabled={!text.trim()}
          accessibilityRole="button"
          accessibilityLabel="Tune my home to how I feel"
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: text.trim() ? palette.primary : palette.surfaceMuted,
              borderColor: text.trim() ? palette.primary : palette.glassBorder,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Feather
            name="arrow-right"
            size={16}
            color={
              text.trim()
                ? palette.isDark
                  ? "#0f1024"
                  : "#ffffff"
                : palette.textMuted
            }
          />
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    ...(Platform.OS === "web" ? { outlineWidth: 0 as unknown as number } : {}),
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  activeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activeLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
  },
  activeHeadline: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
    lineHeight: 18,
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
