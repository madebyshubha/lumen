import React from "react";
import { palette, fonts } from "../lib/theme";

type PhoneProps = {
  accent: string;
  accentSoft: string;
  bg?: string;
  children: React.ReactNode;
  width?: number;
  height?: number;
};

export const Phone: React.FC<PhoneProps> = ({
  accent,
  accentSoft,
  bg = palette.cream,
  children,
  width = 460,
  height = 940,
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 64,
        background: "#0c0a09",
        padding: 14,
        boxShadow:
          "0 60px 120px rgba(60, 25, 10, 0.35), 0 12px 30px rgba(60, 25, 10, 0.18), inset 0 0 0 2px rgba(255,255,255,0.05)",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 52,
          background: bg,
          overflow: "hidden",
          position: "relative",
          fontFamily: fonts.body,
          color: palette.ink,
        }}
      >
        {/* status bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 36,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 28px",
            fontSize: 14,
            fontWeight: 600,
            color: palette.ink,
            opacity: 0.7,
            zIndex: 5,
          }}
        >
          <span>9:41</span>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span
              style={{
                width: 18,
                height: 10,
                border: `1.5px solid ${palette.ink}`,
                borderRadius: 3,
                opacity: 0.7,
              }}
            />
          </span>
        </div>
        {/* dynamic island */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            width: 110,
            height: 30,
            borderRadius: 20,
            background: "#0c0a09",
            zIndex: 10,
          }}
        />
        {/* accent glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -60,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: accentSoft,
            filter: "blur(60px)",
            opacity: 0.7,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: -40,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: accent,
            opacity: 0.18,
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            paddingTop: 56,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
