import React from "react";

type Props = {
  size?: number;
  rotation?: number;
  glow?: number;
};

export const LumenLogo: React.FC<Props> = ({
  size = 200,
  rotation = 0,
  glow = 0,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ transform: `rotate(${rotation}deg)`, overflow: "visible" }}
    >
      <defs>
        <radialGradient id="lumen-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8f1" stopOpacity="1" />
          <stop offset="55%" stopColor="#f3c969" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#d97639" stopOpacity="0.9" />
        </radialGradient>
        <linearGradient id="lumen-ring-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9aa6ff" />
          <stop offset="100%" stopColor="#1e9d6b" />
        </linearGradient>
        <linearGradient id="lumen-ring-2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d49b1a" />
          <stop offset="100%" stopColor="#d97639" />
        </linearGradient>
      </defs>
      {glow > 0 && (
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="#f3c969"
          opacity={0.25 * glow}
          filter="blur(20px)"
        />
      )}
      <circle
        cx="100"
        cy="100"
        r="78"
        fill="none"
        stroke="url(#lumen-ring-1)"
        strokeWidth="3"
        opacity="0.85"
      />
      <circle
        cx="100"
        cy="100"
        r="62"
        fill="none"
        stroke="url(#lumen-ring-2)"
        strokeWidth="2"
        strokeDasharray="6 6"
        opacity="0.7"
      />
      <circle cx="100" cy="100" r="38" fill="url(#lumen-core)" />
      <circle
        cx="100"
        cy="100"
        r="38"
        fill="none"
        stroke="#fff8f1"
        strokeWidth="1.5"
        opacity="0.9"
      />
    </svg>
  );
};
