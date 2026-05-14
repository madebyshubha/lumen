import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { computeCycleState } from "@/lib/cycle";
import { HEALTH_CATEGORIES } from "@/lib/health";
import {
  COUNTRIES,
  DIET_LABEL,
  DIET_OPTIONS,
  type CountryCode,
  type Diet,
} from "@/lib/lifestyle";
import {
  isAppleAvailable,
  isGoogleAvailable,
  signInWithApple,
  signInWithGoogle,
  signInDev,
} from "@/lib/auth";

type Step =
  | "login"
  | "interview-name"
  | "interview-diet"
  | "interview-country"
  | "interview-permissions"
  | "interview-phase"
  | "interview-energy";

const DIET_BLURB: Record<Diet, string> = {
  vegetarian: "Plant-forward with dairy and eggs are fine.",
  vegan: "Fully plant-based.",
  eggetarian: "Vegetarian, plus eggs.",
  "non-vegetarian": "Anything goes — meat, fish, the works.",
  pescatarian: "Vegetarian plus fish and seafood.",
  jain: "No root vegetables, onion, or garlic.",
};

export default function Onboarding() {
  const palette = colors.phases.luteal; // pre-onboarding default; once profile saved, app re-themes.
  const insets = useSafeAreaInsets();
  const {
    completeOnboarding,
    hydrateFromServerProfile,
    healthBridgeAvailable,
    requestHealthPermissions,
  } = useApp();
  const [step, setStep] = useState<Step>("login");
  const [provider, setProvider] = useState<"apple" | "google" | "dev">("apple");
  const [name, setName] = useState("");
  const [energy, setEnergy] = useState(6);
  const [diet, setDiet] = useState<Diet>("vegetarian");
  const [homeCountry, setHomeCountry] = useState<CountryCode>("IN");
  const [busy, setBusy] = useState<null | "apple" | "google" | "dev" | "finish">(null);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fade]);

  useEffect(() => {
    let cancelled = false;
    isAppleAvailable().then((ok) => {
      if (!cancelled) setAppleAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Mocked sync: uses the same default the AppContext uses (12 days back).
  const previewLastPeriod = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 12);
    return d.toISOString();
  })();
  const previewCycle = computeCycleState(previewLastPeriod, 28);
  const previewPhase = previewCycle.phase;

  const afterSignIn = (which: "apple" | "google" | "dev", returnedName: string | null, alreadyOnboarded: boolean) => {
    setProvider(which);
    if (returnedName) setName(returnedName);
    if (alreadyOnboarded) {
      // Returning user — skip the interview, the AppContext already
      // hydrated profile from /auth/me.
      return;
    }
    setStep("interview-name");
  };

  const handleApple = async () => {
    if (busy) return;
    setError(null);
    setBusy("apple");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const user = await signInWithApple();
      const onboarded = !!user.onboardedAt;
      if (onboarded) await hydrateFromServerProfile(user);
      afterSignIn("apple", user.name ?? null, onboarded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apple sign-in failed");
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    if (busy) return;
    setError(null);
    setBusy("google");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const user = await signInWithGoogle();
      const onboarded = !!user.onboardedAt;
      if (onboarded) await hydrateFromServerProfile(user);
      afterSignIn("google", user.name ?? null, onboarded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(null);
    }
  };

  const handleDev = async () => {
    if (busy) return;
    setError(null);
    setBusy("dev");
    try {
      // Stable per-device handle so re-opening the preview returns the same
      // dev user instead of creating a new one each time.
      const HANDLE_KEY = "lumen.devSignIn.handle";
      let handle = await AsyncStorage.getItem(HANDLE_KEY);
      if (!handle) {
        handle = `web-preview-${Math.random().toString(36).slice(2, 8)}`;
        await AsyncStorage.setItem(HANDLE_KEY, handle);
      }
      const user = await signInDev(handle);
      const onboarded = !!user.onboardedAt;
      if (onboarded) await hydrateFromServerProfile(user);
      afterSignIn("dev", user.name ?? null, onboarded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dev sign-in failed");
    } finally {
      setBusy(null);
    }
  };

  const finish = async () => {
    if (busy) return;
    const cleanedName = name.trim() || "friend";
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setBusy("finish");
    setError(null);
    try {
      await completeOnboarding({
        name: cleanedName,
        provider: provider === "dev" ? "google" : provider,
        energy,
        diet,
        homeCountry,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your profile",
      );
    } finally {
      setBusy(null);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top + 12;
  const showWebFallback = Platform.OS === "web" || !isGoogleAvailable();

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <LinearGradient
        colors={[palette.gradientFrom, palette.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, { backgroundColor: palette.accent, top: -120, right: -80, opacity: 0.18 }]} />
      <View style={[styles.glow, { backgroundColor: palette.primary, bottom: -150, left: -60, opacity: 0.16 }]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad + 24, paddingBottom: 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fade }}>
            <View style={styles.brandRow}>
              <View style={[styles.brandDot, { backgroundColor: palette.primary }]} />
              <Text style={[styles.brand, { color: palette.text }]}>Lumen</Text>
            </View>

            {step === "login" ? (
              <Login
                palette={palette}
                onApple={handleApple}
                onGoogle={handleGoogle}
                onDev={handleDev}
                appleAvailable={appleAvailable}
                showWebFallback={showWebFallback}
                busy={busy}
                error={error}
              />
            ) : null}

            {step === "interview-name" ? (
              <InterviewName
                palette={palette}
                name={name}
                setName={setName}
                onContinue={() => setStep("interview-diet")}
              />
            ) : null}

            {step === "interview-diet" ? (
              <InterviewDiet
                palette={palette}
                diet={diet}
                setDiet={setDiet}
                onContinue={() => setStep("interview-country")}
              />
            ) : null}

            {step === "interview-country" ? (
              <InterviewCountry
                palette={palette}
                country={homeCountry}
                setCountry={setHomeCountry}
                onContinue={() =>
                  setStep(healthBridgeAvailable ? "interview-permissions" : "interview-phase")
                }
              />
            ) : null}

            {step === "interview-permissions" ? (
              <InterviewPermissions
                palette={palette}
                onRequest={async () => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  await requestHealthPermissions();
                  setStep("interview-phase");
                }}
                onSkip={() => setStep("interview-phase")}
              />
            ) : null}

            {step === "interview-phase" ? (
              <InterviewPhase
                palette={palette}
                phase={previewPhase}
                onContinue={() => setStep("interview-energy")}
              />
            ) : null}

            {step === "interview-energy" ? (
              <InterviewEnergy
                palette={palette}
                energy={energy}
                setEnergy={setEnergy}
                onFinish={finish}
                busy={busy === "finish"}
                error={error}
              />
            ) : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Login({
  palette,
  onApple,
  onGoogle,
  onDev,
  appleAvailable,
  showWebFallback,
  busy,
  error,
}: {
  palette: typeof colors.phases.luteal;
  onApple: () => void;
  onGoogle: () => void;
  onDev: () => void;
  appleAvailable: boolean;
  showWebFallback: boolean;
  busy: null | "apple" | "google" | "dev" | "finish";
  error: string | null;
}) {
  const router = useRouter();
  return (
    <View>
      <Text style={[styles.tagline, { color: palette.textMuted }]}>
        A human-first PCOS companion
      </Text>
      <Text style={[styles.headline, { color: palette.text }]}>
        Hi.{"\n"}I move with your body, not against it.
      </Text>
      <Text style={[styles.body, { color: palette.textMuted }]}>
        Daily missions tuned to your cycle, your diet, and where in the world you are right now.
      </Text>

      <View style={{ marginTop: 32, gap: 12 }}>
        {appleAvailable ? (
          <Pressable
            onPress={onApple}
            disabled={!!busy}
            style={({ pressed }) => [
              styles.socialBtn,
              { backgroundColor: "#0a0a0a", opacity: busy ? 0.7 : pressed ? 0.85 : 1 },
            ]}
          >
            {busy === "apple" ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Feather name="smartphone" size={16} color="#ffffff" />
                <Text style={[styles.socialText, { color: "#ffffff" }]}>Continue with Apple</Text>
              </>
            )}
          </Pressable>
        ) : null}
        <Pressable
          onPress={onGoogle}
          disabled={!!busy || showWebFallback}
          style={({ pressed }) => [
            styles.socialBtn,
            {
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.08)",
              opacity: busy || showWebFallback ? 0.55 : pressed ? 0.85 : 1,
            },
          ]}
        >
          {busy === "google" ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <>
              <Feather name="globe" size={16} color="#0a0a0a" />
              <Text style={[styles.socialText, { color: "#0a0a0a" }]}>Continue with Google</Text>
            </>
          )}
        </Pressable>
        {showWebFallback ? (
          <Pressable
            onPress={onDev}
            disabled={!!busy}
            style={({ pressed }) => [
              styles.socialBtn,
              {
                backgroundColor: palette.surface,
                borderWidth: 1,
                borderColor: palette.glassBorder,
                opacity: busy ? 0.7 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {busy === "dev" ? (
              <ActivityIndicator color={palette.text} />
            ) : (
              <>
                <Feather name="terminal" size={16} color={palette.text} />
                <Text style={[styles.socialText, { color: palette.text }]}>
                  Continue (web preview only)
                </Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: palette.primary }]}>{error}</Text>
      ) : null}

      <Text style={[styles.privacy, { color: palette.textMuted }]}>
        We only store what you tell us. No advertising, ever.
      </Text>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 10 }}>
        <Pressable onPress={() => router.push("/legal/privacy")}>
          <Text style={[styles.privacy, { color: palette.text, textDecorationLine: "underline" }]}>Privacy</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/legal/terms")}>
          <Text style={[styles.privacy, { color: palette.text, textDecorationLine: "underline" }]}>Terms</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/legal/disclaimer")}>
          <Text style={[styles.privacy, { color: palette.text, textDecorationLine: "underline" }]}>Medical disclaimer</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ChatBubble({
  palette,
  children,
  fromBot = true,
}: {
  palette: typeof colors.phases.luteal;
  children: React.ReactNode;
  fromBot?: boolean;
}) {
  return (
    <View
      style={[
        styles.bubble,
        fromBot
          ? { backgroundColor: palette.surface, borderColor: palette.glassBorder, alignSelf: "flex-start" }
          : { backgroundColor: palette.primary, alignSelf: "flex-end", borderColor: palette.primary },
      ]}
    >
      <Text
        style={[
          styles.bubbleText,
          { color: fromBot ? palette.text : palette.isDark ? "#0f1024" : "#ffffff" },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

function InterviewName({
  palette,
  name,
  setName,
  onContinue,
}: {
  palette: typeof colors.phases.luteal;
  name: string;
  setName: (s: string) => void;
  onContinue: () => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <ChatBubble palette={palette}>Welcome in. What should I call you?</ChatBubble>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={palette.textMuted}
        style={[
          styles.input,
          {
            color: palette.text,
            borderColor: palette.glassBorder,
            backgroundColor: palette.surface,
          },
        ]}
        returnKeyType="next"
        onSubmitEditing={onContinue}
      />
      <PrimaryBtn palette={palette} onPress={onContinue} disabled={!name.trim()}>
        Continue
      </PrimaryBtn>
    </View>
  );
}

function InterviewDiet({
  palette,
  diet,
  setDiet,
  onContinue,
}: {
  palette: typeof colors.phases.luteal;
  diet: Diet;
  setDiet: (d: Diet) => void;
  onContinue: () => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <ChatBubble palette={palette}>
        What does your plate usually look like? I'll tune food advice to it.
      </ChatBubble>
      <View style={styles.chipGrid}>
        {DIET_OPTIONS.map((d) => {
          const active = diet === d;
          return (
            <Pressable
              key={d}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setDiet(d);
              }}
              style={({ pressed }) => [
                styles.chipLg,
                {
                  backgroundColor: active ? palette.primary : palette.surface,
                  borderColor: active ? palette.primary : palette.glassBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipLgText,
                  { color: active ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.text },
                ]}
              >
                {DIET_LABEL[d]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.helper, { color: palette.textMuted }]}>{DIET_BLURB[diet]}</Text>
      <PrimaryBtn palette={palette} onPress={onContinue}>Continue</PrimaryBtn>
    </View>
  );
}

function InterviewCountry({
  palette,
  country,
  setCountry,
  onContinue,
}: {
  palette: typeof colors.phases.luteal;
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
  onContinue: () => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <ChatBubble palette={palette}>
        Where do you call home? Your local cuisine is part of every food task I give you.
      </ChatBubble>
      <View style={styles.chipGrid}>
        {COUNTRIES.map((c) => {
          const active = country === c.code;
          return (
            <Pressable
              key={c.code}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setCountry(c.code);
              }}
              style={({ pressed }) => [
                styles.chipLg,
                {
                  backgroundColor: active ? palette.primary : palette.surface,
                  borderColor: active ? palette.primary : palette.glassBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipLgText,
                  { color: active ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.text },
                ]}
              >
                {c.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <PrimaryBtn palette={palette} onPress={onContinue}>Continue</PrimaryBtn>
    </View>
  );
}

function InterviewPermissions({
  palette,
  onRequest,
  onSkip,
}: {
  palette: typeof colors.phases.luteal;
  onRequest: () => void;
  onSkip: () => void;
}) {
  const platformLabel =
    Platform.OS === "ios" ? "Apple Health" : Platform.OS === "android" ? "Health Connect" : "your wearable";
  return (
    <View style={{ gap: 14 }}>
      <ChatBubble palette={palette}>
        I work best when I can read your real signals from {platformLabel}. Here's exactly what I'd like access to — and why.
      </ChatBubble>
      <View
        style={[
          styles.energyCard,
          { backgroundColor: palette.surface, borderColor: palette.glassBorder, alignItems: "stretch", gap: 14 },
        ]}
      >
        {HEALTH_CATEGORIES.map((c) => (
          <View key={c.key} style={{ gap: 4 }}>
            <Text style={{ color: palette.text, fontFamily: "Outfit_600SemiBold", fontSize: 14 }}>
              {c.label}
            </Text>
            <Text style={{ color: palette.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 }}>
              {c.detail}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.helper, { color: palette.textMuted }]}>
        Read-only. Lumen never writes back to {platformLabel}.
      </Text>
      <PrimaryBtn palette={palette} onPress={onRequest}>
        Connect {platformLabel}
      </PrimaryBtn>
      <Pressable onPress={onSkip} style={{ alignSelf: "center", paddingVertical: 8 }}>
        <Text style={{ color: palette.textMuted, fontFamily: "Inter_500Medium", fontSize: 13 }}>
          Skip for now
        </Text>
      </Pressable>
    </View>
  );
}

function InterviewPhase({
  palette,
  phase,
  onContinue,
}: {
  palette: typeof colors.phases.luteal;
  phase: string;
  onContinue: () => void;
}) {
  const phasePretty = phase.charAt(0).toUpperCase() + phase.slice(1);
  return (
    <View style={{ gap: 14 }}>
      <ChatBubble palette={palette}>
        I've synced your last 3 months of cycle data.{"\n\n"}You're currently in your{" "}
        <Text style={{ color: palette.primary, fontFamily: "Outfit_600SemiBold" }}>{phasePretty}</Text>{" "}
        phase.
      </ChatBubble>
      <ChatBubble palette={palette}>
        That means your body wants something specific from you today. I'll show you what.
      </ChatBubble>
      <PrimaryBtn palette={palette} onPress={onContinue}>
        Got it
      </PrimaryBtn>
    </View>
  );
}

function InterviewEnergy({
  palette,
  energy,
  setEnergy,
  onFinish,
  busy,
  error,
}: {
  palette: typeof colors.phases.luteal;
  energy: number;
  setEnergy: (n: number) => void;
  onFinish: () => void;
  busy: boolean;
  error: string | null;
}) {
  return (
    <View style={{ gap: 14 }}>
      <ChatBubble palette={palette}>
        Last thing — how's your energy on a scale of 1 to 10?
      </ChatBubble>

      <View style={[styles.energyCard, { backgroundColor: palette.surface, borderColor: palette.glassBorder }]}>
        <Text style={[styles.energyValue, { color: palette.text }]}>{energy}</Text>
        <Text style={[styles.energyLabel, { color: palette.textMuted }]}>
          {energy <= 3 ? "low — okay, we'll go gentle" : energy <= 6 ? "steady" : "lots — let's use it"}
        </Text>
        <View style={styles.dotsRow}>
          {Array.from({ length: 10 }).map((_, i) => {
            const v = i + 1;
            const active = v <= energy;
            return (
              <Pressable
                key={i}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setEnergy(v);
                }}
                style={({ pressed }) => [
                  styles.dot,
                  {
                    backgroundColor: active ? palette.primary : palette.surfaceMuted,
                    borderColor: active ? palette.primary : palette.glassBorder,
                    transform: [{ scale: pressed ? 0.9 : active ? 1.05 : 1 }],
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: palette.primary }]}>{error}</Text>
      ) : null}

      <PrimaryBtn palette={palette} onPress={onFinish} disabled={busy}>
        {busy ? "Saving…" : "Take me in"}
      </PrimaryBtn>
    </View>
  );
}

function PrimaryBtn({
  palette,
  onPress,
  disabled,
  children,
}: {
  palette: typeof colors.phases.luteal;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        {
          backgroundColor: disabled ? palette.surface : palette.primary,
          opacity: pressed ? 0.85 : 1,
          shadowColor: palette.shadow,
        },
      ]}
    >
      <Text
        style={[
          styles.primaryText,
          {
            color: disabled
              ? palette.textMuted
              : palette.isDark
                ? "#0f1024"
                : "#ffffff",
          },
        ]}
      >
        {children}
      </Text>
      <Feather
        name="arrow-right"
        size={16}
        color={disabled ? palette.textMuted : palette.isDark ? "#0f1024" : "#ffffff"}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  glow: { position: "absolute", width: 320, height: 320, borderRadius: 160 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 28 },
  brandDot: { width: 10, height: 10, borderRadius: 5 },
  brand: { fontSize: 16, fontFamily: "Outfit_600SemiBold", letterSpacing: 1 },
  tagline: {
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
    marginBottom: 16,
  },
  headline: { fontSize: 32, fontFamily: "Outfit_700Bold", lineHeight: 40 },
  body: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginTop: 12 },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
  },
  socialText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 14, textAlign: "center" },
  privacy: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 18, textAlign: "center" },
  bubble: {
    maxWidth: "92%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  bubbleText: { fontSize: 15, fontFamily: "Outfit_500Medium", lineHeight: 22 },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipLg: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  chipLgText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  helper: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: -4 },
  primary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  energyCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  energyValue: { fontSize: 56, fontFamily: "Outfit_700Bold" },
  energyLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "lowercase" },
  dotsRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1 },
});
