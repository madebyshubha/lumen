import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { usePalette } from "@/context/AppContext";

export default function TabLayout() {
  const palette = usePalette();
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 10 },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : palette.background,
          borderTopWidth: 0,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={palette.isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.background }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vent"
        options={{
          title: "Vent",
          tabBarIcon: ({ color }) => <Feather name="mic" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="circle"
        options={{
          title: "Circle",
          tabBarIcon: ({ color }) => <Feather name="users" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "You",
          tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
