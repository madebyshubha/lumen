import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/context/AppContext";

type Props = {
  active: boolean;
  onPress: () => void;
  label?: string;
};

export function MicButton({ active, onPress, label }: Props) {
  const palette = usePalette();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
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
    }
  }, [active, pulse]);

  const handle = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  return (
    <View style={styles.wrap}>
      {active ? (
        <Animated.View
          style={[
            styles.ring,
            {
              backgroundColor: palette.primary,
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />
      ) : null}
      <Pressable
        onPress={handle}
        style={({ pressed }) => [
          styles.btn,
          {
            backgroundColor: active ? palette.accent : palette.primary,
            transform: [{ scale: pressed ? 0.95 : 1 }],
            shadowColor: palette.shadow,
          },
        ]}
      >
        <Feather
          name={active ? "square" : "mic"}
          size={36}
          color={palette.isDark ? "#0f1024" : "#ffffff"}
        />
      </Pressable>
      {label ? (
        <Text style={[styles.label, { color: palette.textMuted }]}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", gap: 12 },
  btn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ring: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  label: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
