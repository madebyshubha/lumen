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

export const SceneOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const irisOpen = interpolate(frame, [0, 28], [0, 100], {
    extrapolateRight: "clamp",
  });
  const logoSpring = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.9 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.4, 1]);
  const logoRotate = interpolate(frame, [18, 150], [-25, 0]);
  const logoGlow = interpolate(frame, [18, 60, 150], [0, 1, 0.6], {
    extrapolateRight: "clamp",
  });

  const orbital = interpolate(frame, [0, 150], [0, 360]);
  const wordmarkOp = interpolate(frame, [60, 90], [0, 1], {
    extrapolateRight: "clamp",
  });
  const wordmarkY = interpolate(frame, [60, 90], [40, 0], {
    extrapolateRight: "clamp",
  });
  const taglineOp = interpolate(frame, [95, 120], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(60% 60% at 50% 45%, ${palette.bgAlt} 0%, ${palette.bg} 65%, #f6dec5 100%)`,
        clipPath: `circle(${irisOpen}% at 50% 50%)`,
      }}
    >
      {/* drifting orbits */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            width: 1300,
            height: 1300,
            borderRadius: "50%",
            border: `1px dashed ${palette.luteal}33`,
            transform: `rotate(${orbital}deg)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 980,
            height: 980,
            borderRadius: "50%",
            border: `1px solid ${palette.menstrual}33`,
            transform: `rotate(${-orbital * 0.6}deg)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            borderRadius: "50%",
            border: `1.5px solid ${palette.ovulatory}55`,
            transform: `rotate(${orbital * 0.4}deg)`,
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
        <div
          style={{
            transform: `scale(${logoScale})`,
            opacity: interpolate(frame, [18, 35], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          <LumenLogo size={280} rotation={logoRotate} glow={logoGlow} />
        </div>
        <div
          style={{
            marginTop: 48,
            opacity: wordmarkOp,
            transform: `translateY(${wordmarkY}px)`,
            fontFamily: fonts.display,
            fontWeight: 800,
            fontSize: 132,
            letterSpacing: -6,
            color: palette.ink,
            lineHeight: 1,
          }}
        >
          lumen
        </div>
        <div
          style={{
            marginTop: 18,
            opacity: taglineOp,
            fontFamily: fonts.body,
            fontWeight: 500,
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: palette.inkSoft,
          }}
        >
          a women's wellness app
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
