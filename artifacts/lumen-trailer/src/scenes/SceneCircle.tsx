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

const messages = [
  { from: "Maya", text: "follicular and unstoppable today", t: 18, color: palette.follicular },
  { from: "Priya", text: "ovulation glow is real", t: 36, color: palette.ovulatory },
  { from: "you", text: "luteal soup club tonight?", t: 58, color: palette.luteal, mine: true },
  { from: "Jess", text: "save me a bowl", t: 78, color: palette.menstrual },
];

export const SceneCircle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80 },
  });
  const phoneX = interpolate(phoneSpring, [0, 1], [300, 0]);

  const titleOp = interpolate(frame, [10, 35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleX = interpolate(frame, [10, 35], [-60, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #f3fbf5 0%, #e7f7ed 60%, #dff7e6 100%)`,
      }}
    >
      {/* floating leaves */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const drift = (frame + i * 30) / 30;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${10 + i * 13}%`,
              left: `${5 + i * 12}%`,
              width: 14 + (i % 3) * 8,
              height: 14 + (i % 3) * 8,
              borderRadius: "50%",
              background: i % 2 === 0 ? palette.follicular : palette.follicularSoft,
              opacity: 0.18,
              transform: `translateY(${Math.sin(drift) * 30}px) translateX(${Math.cos(drift) * 20}px)`,
              filter: "blur(2px)",
            }}
          />
        );
      })}

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row-reverse",
          gap: 100,
          padding: "0 160px",
        }}
      >
        <div
          style={{
            transform: `translateX(${phoneX}px)`,
            opacity: phoneSpring,
          }}
        >
          <Phone accent={palette.follicular} accentSoft="#cdf0d9" bg="#f3fbf5">
            <div style={{ padding: "12px 24px", flex: 1 }}>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: palette.follicular,
                  fontWeight: 600,
                }}
              >
                Circle · 4 friends
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontFamily: fonts.display,
                  fontSize: 30,
                  fontWeight: 700,
                  color: "#15301f",
                }}
              >
                Today's syncs
              </div>

              <div
                style={{
                  marginTop: 22,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {messages.map((m, i) => {
                  const op = interpolate(frame, [m.t, m.t + 14], [0, 1], {
                    extrapolateRight: "clamp",
                  });
                  const dy = interpolate(frame, [m.t, m.t + 14], [16, 0], {
                    extrapolateRight: "clamp",
                  });
                  return (
                    <div
                      key={i}
                      style={{
                        opacity: op,
                        transform: `translateY(${dy}px)`,
                        display: "flex",
                        flexDirection: m.mine ? "row-reverse" : "row",
                        alignItems: "flex-end",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: m.color,
                          flexShrink: 0,
                          boxShadow: `0 6px 16px ${m.color}55`,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: fonts.display,
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {m.from[0].toUpperCase()}
                      </div>
                      <div
                        style={{
                          background: m.mine ? palette.follicular : "white",
                          color: m.mine ? "white" : "#15301f",
                          padding: "10px 14px",
                          borderRadius: 18,
                          borderTopLeftRadius: m.mine ? 18 : 4,
                          borderTopRightRadius: m.mine ? 4 : 18,
                          fontFamily: fonts.body,
                          fontSize: 16,
                          maxWidth: 280,
                          boxShadow: "0 4px 14px rgba(30,157,107,0.15)",
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 18,
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: "#5a7869",
                  textAlign: "center",
                  opacity: interpolate(frame, [90, 110], [0, 1], {
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                4 phases. 1 group thread. Always synced.
              </div>
            </div>
          </Phone>
        </div>

        <div
          style={{
            color: "#15301f",
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
              color: palette.follicular,
              fontWeight: 600,
            }}
          >
            02 — circle
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
            Your people,
            <br />
            in phase.
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily: fonts.body,
              fontSize: 26,
              lineHeight: 1.45,
              color: "#3a5a48",
              maxWidth: 540,
            }}
          >
            Quiet check-ins with the friends who get it. No emojis required.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
