import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { palette, fonts } from "../lib/theme";
import { Phone } from "../components/Phone";

export const SceneCare: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80 },
  });
  const phoneX = interpolate(phoneSpring, [0, 1], [-300, 0]);

  const ringProgress = interpolate(frame, [10, 80], [0, 0.78], {
    extrapolateRight: "clamp",
  });
  const ringCircumference = 2 * Math.PI * 110;

  const labelOp = interpolate(frame, [25, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleOp = interpolate(frame, [20, 45], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleX = interpolate(frame, [20, 45], [60, 0], {
    extrapolateRight: "clamp",
  });

  const tasks = [
    { label: "Iron-rich breakfast", done: true, t: 35 },
    { label: "10 min stretch", done: true, t: 50 },
    { label: "Ferritin check-in", done: false, t: 65 },
    { label: "Heat pad, 20 min", done: false, t: 80 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(120deg, #15184a 0%, #0f1024 60%, #1a1748 100%)`,
      }}
    >
      {/* drifting nebula */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -200,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: palette.menstrual,
          opacity: 0.18,
          filter: "blur(120px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -260,
          left: -100,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "#c79bff",
          opacity: 0.15,
          filter: "blur(120px)",
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 100,
          padding: "0 160px",
        }}
      >
        {/* phone */}
        <div
          style={{
            transform: `translateX(${phoneX}px)`,
            opacity: phoneSpring,
          }}
        >
          <Phone
            accent={palette.menstrual}
            accentSoft="#c5cbff"
            bg="#0f1024"
          >
            <div style={{ padding: "12px 28px", color: "#f4f2ff" }}>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: 14,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "#aab0d6",
                }}
              >
                Care · day 2
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: fonts.display,
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#f4f2ff",
                }}
              >
                Be gentle.
              </div>
              <div
                style={{
                  marginTop: 28,
                  display: "flex",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <svg width="260" height="260" viewBox="0 0 260 260">
                  <circle
                    cx="130"
                    cy="130"
                    r="110"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="14"
                  />
                  <circle
                    cx="130"
                    cy="130"
                    r="110"
                    fill="none"
                    stroke={palette.menstrual}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringCircumference * (1 - ringProgress)}
                    transform="rotate(-90 130 130)"
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f4f2ff",
                    fontFamily: fonts.display,
                  }}
                >
                  <div style={{ fontSize: 56, fontWeight: 800 }}>
                    {Math.round(ringProgress * 100)}%
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      opacity: 0.7,
                      marginTop: 4,
                    }}
                  >
                    rituals today
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  opacity: labelOp,
                }}
              >
                {tasks.map((t, i) => {
                  const op = interpolate(frame, [t.t, t.t + 12], [0, 1], {
                    extrapolateRight: "clamp",
                  });
                  const dx = interpolate(frame, [t.t, t.t + 12], [20, 0], {
                    extrapolateRight: "clamp",
                  });
                  return (
                    <div
                      key={i}
                      style={{
                        opacity: op,
                        transform: `translateX(${dx}px)`,
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 14,
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: t.done
                            ? palette.menstrual
                            : "transparent",
                          border: `2px solid ${palette.menstrual}`,
                        }}
                      />
                      <div
                        style={{
                          fontFamily: fonts.body,
                          fontSize: 16,
                          color: "#f4f2ff",
                          textDecoration: t.done ? "line-through" : "none",
                          opacity: t.done ? 0.55 : 1,
                        }}
                      >
                        {t.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Phone>
        </div>

        {/* copy */}
        <div
          style={{
            color: "#f4f2ff",
            maxWidth: 620,
            opacity: titleOp,
            transform: `translateX(${titleX}px)`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: palette.menstrual,
              fontWeight: 600,
            }}
          >
            01 — care
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: fonts.display,
              fontSize: 110,
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: -4,
            }}
          >
            Rituals,
            <br />
            not rules.
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily: fonts.body,
              fontSize: 26,
              lineHeight: 1.45,
              color: "#c5cbff",
              maxWidth: 540,
            }}
          >
            Daily nudges that shift with your phase — so the hard days feel
            held, not measured.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
