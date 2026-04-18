import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { useApp, usePalette } from "@/context/AppContext";
import { buildLeaderboard, type LeaderboardRow } from "@/lib/circle";

// Day-within-current-phase derived from cycle.dayOfCycle so the user's
// metadata is comparable to phase-mate handles (which carry per-phase day
// counts, not raw cycle days).
function dayOfPhase(phase: string, dayOfCycle: number, cycleLength: number): number {
  const ov = Math.round((cycleLength / 28) * 14);
  if (phase === "menstrual") return Math.max(1, dayOfCycle);
  if (phase === "follicular") return Math.max(1, dayOfCycle - 5);
  if (phase === "ovulatory") return 1;
  // luteal
  return Math.max(1, dayOfCycle - ov);
}

export function Leaderboard() {
  const palette = usePalette();
  const { cycle, streak } = useApp();

  // Hooks must run unconditionally; pass safe defaults when cycle isn't ready
  // and bail on render below.
  const phase = cycle?.phase ?? "luteal";
  const dayOfCycle = cycle?.dayOfCycle ?? 1;
  const cycleLength = cycle?.cycleLength ?? 28;
  const userPhaseDay = dayOfPhase(phase, dayOfCycle, cycleLength);

  const board = useMemo(
    () => buildLeaderboard(phase, streak.current, userPhaseDay),
    [phase, streak.current, userPhaseDay],
  );

  // Per-handle kudos counter (local, in-memory). Reset on app reload — fine
  // for a prototype: it preserves the "win and help others win" gesture
  // without faking persistent social state.
  const [kudos, setKudos] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);

  const sendKudos = (row: LeaderboardRow) => {
    if (row.isYou) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setKudos((prev) => ({ ...prev, [row.id]: (prev[row.id] ?? 0) + 1 }));
    setToast(`Kudos sent to ${row.handle}`);
    setTimeout(() => setToast((t) => (t === `Kudos sent to ${row.handle}` ? null : t)), 1800);
  };

  if (!cycle) return null;

  return (
    <GlassCard style={{ marginBottom: 16 }}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: palette.primarySoft }]}>
          <Feather name="award" size={16} color={palette.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.text }]}>
            Phase-mates leaderboard
          </Text>
          <Text style={[styles.sub, { color: palette.textMuted }]}>
            Anonymous streaks from women in their {palette.name.toLowerCase()} phase. Win and help others win.
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 14, gap: 6 }}>
        {board.top.map((row) => (
          <Row
            key={row.id}
            row={row}
            kudos={kudos[row.id] ?? 0}
            onKudos={() => sendKudos(row)}
          />
        ))}
        {!board.userInTop ? (
          <>
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: palette.glassBorder }]} />
              <Text style={[styles.dividerText, { color: palette.textMuted }]}>your rank</Text>
              <View style={[styles.dividerLine, { backgroundColor: palette.glassBorder }]} />
            </View>
            <Row
              row={board.you}
              kudos={kudos[board.you.id] ?? 0}
              onKudos={() => sendKudos(board.you)}
            />
          </>
        ) : null}
      </View>

      {toast ? (
        <View
          style={[
            styles.toast,
            { backgroundColor: palette.primary },
          ]}
          accessibilityLiveRegion="polite"
        >
          <Feather name="heart" size={12} color={palette.isDark ? "#0f1024" : "#ffffff"} />
          <Text
            style={[
              styles.toastText,
              { color: palette.isDark ? "#0f1024" : "#ffffff" },
            ]}
          >
            {toast}
          </Text>
        </View>
      ) : null}
    </GlassCard>
  );
}

function Row({
  row,
  kudos,
  onKudos,
}: {
  row: LeaderboardRow;
  kudos: number;
  onKudos: () => void;
}) {
  const palette = usePalette();
  const highlight = row.isYou;
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: highlight ? palette.primarySoft : palette.surfaceMuted,
          borderColor: highlight ? palette.primary : palette.glassBorder,
        },
      ]}
    >
      <Text style={[styles.rank, { color: highlight ? palette.primary : palette.textMuted }]}>
        {row.rank}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.handle, { color: palette.text }]} numberOfLines={1}>
          {highlight ? "You" : row.handle}
        </Text>
        <Text style={[styles.meta, { color: palette.textMuted }]} numberOfLines={1}>
          day {row.daysIntoPhase} · {kudos > 0 ? `${kudos} kudos sent` : "no kudos yet"}
        </Text>
      </View>
      <View style={styles.streakWrap}>
        <Feather name="zap" size={12} color={palette.primary} />
        <Text style={[styles.streakNum, { color: palette.text }]}>{row.streak}</Text>
      </View>
      <Pressable
        onPress={onKudos}
        disabled={highlight}
        accessibilityRole="button"
        accessibilityLabel={highlight ? "This is you" : `Send kudos to ${row.handle}`}
        hitSlop={6}
        style={({ pressed }) => [
          styles.kudosBtn,
          {
            borderColor: highlight ? palette.glassBorder : palette.primary,
            backgroundColor: highlight ? "transparent" : palette.primarySoft,
            opacity: highlight ? 0.4 : pressed ? 0.7 : 1,
          },
        ]}
      >
        <Feather name="heart" size={12} color={palette.primary} />
        <Text style={[styles.kudosBtnText, { color: palette.primary }]}>Kudos</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontFamily: "Outfit_600SemiBold" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 18 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  rank: { width: 22, fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "center" },
  handle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  meta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  streakWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minWidth: 36,
    justifyContent: "flex-end",
  },
  streakNum: { fontSize: 13, fontFamily: "Inter_700Bold" },
  kudosBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  kudosBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  divider: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 6 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: {
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
  },
  toast: {
    position: "absolute",
    bottom: -12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  toastText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
