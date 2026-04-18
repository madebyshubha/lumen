import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { palette, fonts } from "../lib/theme";
import { LumenLogo } from "../components/LumenLogo";

export const SceneClose: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.5, 1]);

  const lineOp = interpolate(frame, [12, 32], [0, 1], {
    extrapolateRight: "clamp",
  });
  const lineY = interpolate(frame, [12, 32], [30, 0], {
    extrapolateRight: "clamp",
  });

  const ctaOp = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  const phaseGradient = `conic-gradient(from ${frame * 0.8}deg, ${palette.menstrual}, ${palette.follicular}, ${palette.ovulatory}, ${palette.luteal}, ${palette.menstrual})`;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(60% 70% at 50% 50%, ${palette.bgAlt} 0%, ${palette.bg} 70%)`,
      }}
    >
      {/* halo */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: phaseGradient,
            opacity: 0.18,
            filter: "blur(60px)",
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div style={{ transform: `scale(${logoScale})`, opacity: logoSpring }}>
          <LumenLogo size={220} glow={1} />
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: fonts.display,
            fontWeight: 800,
            fontSize: 160,
            letterSpacing: -8,
            color: palette.ink,
            lineHeight: 1,
          }}
        >
          lumen
        </div>
        <div
          style={{
            marginTop: 26,
            opacity: lineOp,
            transform: `translateY(${lineY}px)`,
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: 44,
            letterSpacing: -1,
            color: palette.inkSoft,
            textAlign: "center",
            maxWidth: 1100,
          }}
        >
          A friend for every phase.
        </div>
        <div
          style={{
            marginTop: 60,
            opacity: ctaOp,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              padding: "20px 48px",
              borderRadius: 999,
              background: palette.ink,
              color: palette.cream,
              fontFamily: fonts.body,
              fontWeight: 600,
              fontSize: 26,
              letterSpacing: 1,
            }}
          >
            Meet Lumen
          </div>
          <div
            style={{
              padding: "20px 36px",
              borderRadius: 999,
              border: `2px solid ${palette.ink}`,
              fontFamily: fonts.body,
              fontWeight: 500,
              fontSize: 22,
              color: palette.ink,
              letterSpacing: 1,
            }}
          >
            lumen.app
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
