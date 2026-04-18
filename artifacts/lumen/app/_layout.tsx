import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ActivityIndicator, View } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import colors from "@/constants/colors";
import { AppProvider, useApp } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

// Pitch-mode reset: wipe persisted state at module load (before React mounts)
// when the URL contains ?reset=1, so the screenshot tool can capture the
// real sign-in / onboarding screens instead of a stale demo profile.
if (typeof window !== "undefined") {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") {
      window.sessionStorage.removeItem("lumen_demo");
      window.localStorage.removeItem("lumen.state.v1");
    }
  } catch {
    // ignore
  }
}

const queryClient = new QueryClient();

// Pitch-mode escape hatch: any URL containing ?demo=1 sets a sessionStorage
// flag (so it survives router redirects), and the onboarding gate then
// auto-completes onboarding instead of bouncing to the sign-in screen.
// Screenshot tooling can land directly on /care, /circle, etc. Web-only.
function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") {
      window.sessionStorage.removeItem("lumen_demo");
      // Also wipe the persisted app state so the user lands on sign-in.
      window.localStorage.removeItem("lumen.state.v1");
      return false;
    }
    if (params.get("demo") === "1") {
      window.sessionStorage.setItem("lumen_demo", "1");
    }
    return window.sessionStorage.getItem("lumen_demo") === "1";
  } catch {
    return false;
  }
}

function OnboardingGate() {
  const { ready, profile, completeOnboarding } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const demo = isDemoMode();
    if (demo && !profile) {
      // Seed a default profile and short-circuit — don't redirect to sign-in.
      completeOnboarding({
        name: "Aria",
        provider: "apple",
        energy: "balanced",
        diet: "vegetarian",
        homeCountry: "IN",
      });
      return;
    }
    const inOnboarding = segments[0] === "onboarding";
    if (!profile && !inOnboarding) {
      router.replace("/onboarding");
    } else if (profile && inOnboarding) {
      router.replace("/(tabs)");
    }
  }, [ready, profile, segments, router, completeOnboarding]);

  return null;
}

function HydrationGate({ children }: { children: React.ReactNode }) {
  const { ready } = useApp();
  if (!ready) {
    const palette = colors.phases.luteal;
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.background }}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }
  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <HydrationGate>
      <OnboardingGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </HydrationGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <RootLayoutNav />
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
