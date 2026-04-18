import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, usePalette } from "@/context/AppContext";

export function TopBar({ greeting }: { greeting?: string }) {
  const palette = usePalette();
  const { profile } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const initials = (profile?.name ?? "L").slice(0, 1).toUpperCase();

  return (
    <View style={[styles.wrap, { paddingTop: topPad }]}>
      <View style={[styles.avatar, { backgroundColor: palette.primary }]}>
        <Text style={[styles.initial, { color: palette.isDark ? "#0f1024" : "#ffffff" }]}>{initials}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12, marginRight: 8, minWidth: 0 }}>
        <Text
          style={[styles.hello, { color: palette.textMuted }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {greeting ?? "Today"}
        </Text>
        <Text
          style={[styles.name, { color: palette.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {profile?.name ?? "Lumen"}
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.bell,
          {
            backgroundColor: palette.surface,
            borderColor: palette.glassBorder,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Feather name="bell" size={16} color={palette.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  initial: { fontSize: 16, fontFamily: "Inter_700Bold" },
  hello: { fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: "Inter_500Medium" },
  name: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  bell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
