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

const phaseColors = [
  palette.menstrual,
  palette.follicular,
  palette.ovulatory,
  palette.luteal,
];

export const SceneProfile: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80 },
  });

  const titleOp = interpolate(frame, [10, 35], [0, 1], {
    extrapolateRight: "clamp",
  });

  // pie sweep
  const sweep = interpolate(frame, [10, 65], [0, 360], {
    extrapolateRight: "clamp",
  });

  const stats = [
    { label: "cycles tracked", value: 14, t: 30 },
    { label: "rituals kept", value: 187, t: 50 },
    { label: "vents released", value: 42, t: 70 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(140deg, ${palette.bg} 0%, #fde2cd 60%, #f7caa3 100%)`,
      }}
    >
      {/* concentric arcs sweeping */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "60%",
          height: "120%",
          borderRadius: "50%",
          border: `2px solid ${palette.luteal}33`,
          transform: `rotate(${frame / 2}deg)`,
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
        <div
          style={{
            transform: `scale(${interpolate(phoneSpring, [0, 1], [0.85, 1])})`,
            opacity: phoneSpring,
          }}
        >
          <Phone accent={palette.luteal} accentSoft="#fde2cd" bg={palette.bg}>
            <div style={{ padding: "12px 28px", flex: 1, color: "#3b1c0a" }}>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: palette.luteal,
                  fontWeight: 600,
                }}
              >
                Profile · year so far
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: fonts.display,
                  fontSize: 30,
                  fontWeight: 700,
                }}
              >
                You, on rhythm
              </div>

              {/* pie chart */}
              <div
                style={{
                  marginTop: 22,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <svg width="240" height="240" viewBox="0 0 240 240">
                  <defs>
                    <clipPath id="sweepClip">
                      <path
                        d={describeSector(120, 120, 100, 0, sweep)}
                      />
                    </clipPath>
                  </defs>
                  {phaseColors.map((c, i) => {
                    const start = i * 90;
                    const end = (i + 1) * 90;
                    return (
                      <path
                        key={i}
                        d={describeSector(120, 120, 100, start, end)}
                        fill={c}
                        opacity={0.85}
                      />
                    );
                  })}
                  <rect
                    x="0"
                    y="0"
                    width="240"
                    height="240"
                    fill={palette.bg}
                    style={{
                      clipPath: `path('${describeSector(120, 120, 100, sweep, 360)}')`,
                    }}
                  />
                  <circle cx="120" cy="120" r="56" fill={palette.cream} />
                  <text
                    x="120"
                    y="115"
                    textAnchor="middle"
                    fill="#3b1c0a"
                    fontFamily={fonts.display}
                    fontWeight="800"
                    fontSize="34"
                  >
                    28d
                  </text>
                  <text
                    x="120"
                    y="142"
                    textAnchor="middle"
                    fill="#8c5a3a"
                    fontFamily={fonts.body}
                    fontSize="12"
                    letterSpacing="2"
                  >
                    AVG CYCLE
                  </text>
                </svg>
              </div>

              {/* stats */}
              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {stats.map((s, i) => {
                  const op = interpolate(frame, [s.t, s.t + 14], [0, 1], {
                    extrapolateRight: "clamp",
                  });
                  const value = Math.round(
                    interpolate(frame, [s.t, s.t + 25], [0, s.value], {
                      extrapolateRight: "clamp",
                    }),
                  );
                  return (
                    <div
                      key={i}
                      style={{
                        opacity: op,
                        background: "rgba(255,255,255,0.65)",
                        borderRadius: 14,
                        padding: "10px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: `1px solid ${palette.luteal}33`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: fonts.body,
                          fontSize: 15,
                          color: "#8c5a3a",
                        }}
                      >
                        {s.label}
                      </span>
                      <span
                        style={{
                          fontFamily: fonts.display,
                          fontSize: 24,
                          fontWeight: 800,
                          color: palette.luteal,
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Phone>
        </div>

        <div
          style={{
            color: "#3b1c0a",
            maxWidth: 620,
            opacity: titleOp,
            transform: `translateX(${interpolate(titleOp, [0, 1], [60, 0])}px)`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: palette.luteal,
              fontWeight: 600,
            }}
          >
            04 — profile
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
            A pattern,
            <br />
            finally yours.
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily: fonts.body,
              fontSize: 26,
              lineHeight: 1.45,
              color: "#7a4a2a",
              maxWidth: 540,
            }}
          >
            Every cycle teaches the next. Lumen quietly remembers, so you
            don't have to.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const a = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeSector(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${end.x} ${end.y} A ${r} ${r} 0 ${largeArc} 0 ${start.x} ${start.y} Z`;
}
