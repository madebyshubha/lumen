import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { useApp, usePalette } from "@/context/AppContext";
import { COUNTRIES, countryName, type CountryCode } from "@/lib/lifestyle";

export function ContextStrip() {
  const palette = usePalette();
  const { todayLog, profile, setLocation, setTravelling } = useApp();
  const [open, setOpen] = useState(false);
  const [draftLocation, setDraftLocation] = useState(todayLog.context.location ?? "");

  const homeName = profile ? countryName(profile.homeCountry) : "";
  const travellingTo = todayLog.context.travelCountry
    ? countryName(todayLog.context.travelCountry)
    : "Pick a country";

  const summary = todayLog.context.travelling
    ? `Travelling · ${travellingTo}`
    : todayLog.context.location
      ? todayLog.context.location
      : `Home · ${homeName}`;

  return (
    <GlassCard style={{ marginBottom: 16 }}>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.summaryRow}>
        <View style={[styles.iconBubble, { backgroundColor: palette.accentSoft }]}>
          <Feather
            name={todayLog.context.travelling ? "navigation" : "map-pin"}
            size={16}
            color={palette.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: palette.textMuted }]}>Where you are</Text>
          <Text style={[styles.value, { color: palette.text }]} numberOfLines={1}>
            {summary}
          </Text>
        </View>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={18} color={palette.textMuted} />
      </Pressable>

      {open ? (
        <View style={[styles.body, { borderTopColor: palette.glassBorder }]}>
          <Text style={[styles.fieldLabel, { color: palette.textMuted }]}>City or area today</Text>
          <TextInput
            value={draftLocation}
            onChangeText={(t) => {
              setDraftLocation(t);
              setLocation(t);
            }}
            placeholder="e.g. Mumbai, or just 'home'"
            placeholderTextColor={palette.textMuted}
            style={[
              styles.input,
              {
                color: palette.text,
                borderColor: palette.glassBorder,
                backgroundColor: palette.surfaceMuted,
              },
            ]}
          />

          <View style={styles.travelRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: palette.textMuted }]}>Travelling today?</Text>
              <Text style={[styles.fieldHint, { color: palette.textMuted }]}>
                Tasks adapt to local food + extra hydration.
              </Text>
            </View>
            <Switch
              value={todayLog.context.travelling}
              onValueChange={(v) => setTravelling(v, todayLog.context.travelCountry)}
              trackColor={{ false: palette.glassBorder, true: palette.primary }}
              thumbColor="#ffffff"
            />
          </View>

          {todayLog.context.travelling ? (
            <View style={{ marginTop: 4 }}>
              <Text style={[styles.fieldLabel, { color: palette.textMuted }]}>Where are you?</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {COUNTRIES.map((c) => {
                  const active = todayLog.context.travelCountry === c.code;
                  return (
                    <Pressable
                      key={c.code}
                      onPress={() => setTravelling(true, c.code as CountryCode)}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          backgroundColor: active ? palette.primary : palette.surfaceMuted,
                          borderColor: active ? palette.primary : palette.glassBorder,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? (palette.isDark ? "#0f1024" : "#ffffff") : palette.text },
                        ]}
                      >
                        {c.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBubble: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: "Inter_500Medium" },
  value: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  body: { marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  fieldLabel: { fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: "Inter_500Medium" },
  fieldHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  input: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  travelRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
