import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { palette, fonts } from "../lib/theme";

const phaseDots = [
  { color: palette.menstrual, label: "menstrual" },
  { color: palette.follicular, label: "follicular" },
  { color: palette.ovulatory, label: "ovulatory" },
  { color: palette.luteal, label: "luteal" },
];

export const SceneTagline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineProgress = interpolate(frame, [0, 35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const headlineSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 18, stiffness: 110 },
  });

  const words = ["Your", "cycle.", "Your", "weather", "report."];
  const wordTimings = [10, 18, 26, 34, 42];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${palette.bg} 0%, #ffe7d3 100%)`,
      }}
    >
      {/* horizon line drawing across */}
      <div
        style={{
          position: "absolute",
          top: "62%",
          left: 0,
          width: `${lineProgress * 100}%`,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${palette.luteal}, transparent)`,
        }}
      />

      {/* drifting phase orbs */}
      {phaseDots.map((dot, i) => {
        const drift = interpolate(
          frame,
          [0, 150],
          [0, 80 + i * 20],
        );
        const op = interpolate(frame, [50 + i * 8, 70 + i * 8], [0, 1], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={dot.label}
            style={{
              position: "absolute",
              top: `${20 + i * 14}%`,
              left: `${10 + i * 19}%`,
              transform: `translateY(${Math.sin((frame + i * 30) / 25) * 12}px) translateX(${drift}px)`,
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: dot.color,
              opacity: op * 0.55,
              filter: "blur(6px)",
            }}
          />
        );
      })}

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: "0 200px",
        }}
      >
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 800,
            fontSize: 128,
            letterSpacing: -5,
            color: palette.ink,
            lineHeight: 1.05,
            textAlign: "center",
            opacity: headlineSpring,
            transform: `translateY(${interpolate(headlineSpring, [0, 1], [40, 0])}px)`,
          }}
        >
          {words.map((w, i) => {
            const op = interpolate(
              frame,
              [wordTimings[i], wordTimings[i] + 12],
              [0, 1],
              { extrapolateRight: "clamp" },
            );
            const dy = interpolate(
              frame,
              [wordTimings[i], wordTimings[i] + 12],
              [30, 0],
              { extrapolateRight: "clamp" },
            );
            const isAccent = w === "weather";
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  margin: "0 14px",
                  opacity: op,
                  transform: `translateY(${dy}px)`,
                  color: isAccent ? palette.luteal : palette.ink,
                  fontStyle: isAccent ? "italic" : "normal",
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 36,
            fontFamily: fonts.body,
            fontWeight: 400,
            fontSize: 30,
            color: palette.inkSoft,
            opacity: interpolate(frame, [70, 95], [0, 1], {
              extrapolateRight: "clamp",
            }),
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          Four seasons every month. Lumen is the friend who already knows.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
