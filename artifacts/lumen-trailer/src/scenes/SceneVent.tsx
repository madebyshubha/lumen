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

const ventLines = [
  "the cramps came back at 2am",
  "i love them and i'm so tired",
  "tomorrow i'll be glowing again, weird",
];

export const SceneVent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80 },
  });
  const phoneY = interpolate(phoneSpring, [0, 1], [200, 0]);

  const titleOp = interpolate(frame, [15, 40], [0, 1], {
    extrapolateRight: "clamp",
  });

  const breath = (Math.sin(frame / 18) + 1) / 2;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, #fff8e7 0%, #fdf0d2 50%, #f7e2b3 100%)`,
      }}
    >
      {/* breathing sun */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "75%",
          transform: `translate(-50%, -50%) scale(${1 + breath * 0.08})`,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${palette.ovulatory}55 0%, ${palette.ovulatorySoft}33 40%, transparent 70%)`,
          filter: "blur(40px)",
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
        {/* copy */}
        <div
          style={{
            color: "#3a2a05",
            maxWidth: 620,
            opacity: titleOp,
            transform: `translateY(${interpolate(titleOp, [0, 1], [40, 0])}px)`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: palette.ovulatory,
              fontWeight: 600,
            }}
          >
            03 — vent
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
            A safe place
            <br />
            to <em style={{ color: palette.luteal }}>spill it.</em>
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily: fonts.body,
              fontSize: 26,
              lineHeight: 1.45,
              color: "#7a5a1f",
              maxWidth: 540,
            }}
          >
            Private notes that disappear at the end of your phase. Catharsis,
            then a clean slate.
          </div>
        </div>

        {/* phone */}
        <div
          style={{
            transform: `translateY(${phoneY}px)`,
            opacity: phoneSpring,
          }}
        >
          <Phone
            accent={palette.ovulatory}
            accentSoft="#fdebbc"
            bg="#fff8e7"
          >
            <div style={{ padding: "12px 26px", flex: 1, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: palette.ovulatory,
                  fontWeight: 600,
                }}
              >
                Vent · just for you
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: fonts.display,
                  fontSize: 30,
                  fontWeight: 700,
                  color: "#3a2a05",
                }}
              >
                Tonight, you wrote
              </div>

              <div
                style={{
                  marginTop: 24,
                  background: "white",
                  borderRadius: 22,
                  padding: 22,
                  boxShadow: "0 14px 30px rgba(212,155,26,0.18)",
                  border: `1px solid ${palette.ovulatory}33`,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {ventLines.map((line, i) => {
                  const start = 28 + i * 22;
                  const op = interpolate(frame, [start, start + 14], [0, 1], {
                    extrapolateRight: "clamp",
                  });
                  // typewriter
                  const charsRevealed = Math.max(
                    0,
                    Math.floor(
                      interpolate(
                        frame,
                        [start, start + line.length * 1.2],
                        [0, line.length],
                        { extrapolateRight: "clamp" },
                      ),
                    ),
                  );
                  const showCursor =
                    charsRevealed < line.length && frame > start;
                  const cursorOn = Math.floor(frame / 5) % 2 === 0;
                  return (
                    <div
                      key={i}
                      style={{
                        opacity: op,
                        fontFamily: fonts.body,
                        fontSize: 19,
                        color: "#3a2a05",
                        lineHeight: 1.5,
                      }}
                    >
                      {line.slice(0, charsRevealed)}
                      {showCursor && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 2,
                            height: 18,
                            background: palette.ovulatory,
                            marginLeft: 2,
                            verticalAlign: "middle",
                            opacity: cursorOn ? 1 : 0,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: 14,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: "#8a6f33",
                  opacity: interpolate(frame, [95, 115], [0, 1], {
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: palette.ovulatory,
                  }}
                />
                fades in 6 days, when this phase ends
              </div>
            </div>
          </Phone>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
