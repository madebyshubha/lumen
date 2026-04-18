import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { outfit, inter } from "./lib/fonts";
import { palette } from "./lib/theme";
import { SceneOpen } from "./scenes/SceneOpen";
import { SceneTagline } from "./scenes/SceneTagline";
import { SceneCare } from "./scenes/SceneCare";
import { SceneCircle } from "./scenes/SceneCircle";
import { SceneVent } from "./scenes/SceneVent";
import { SceneProfile } from "./scenes/SceneProfile";
import { SceneClose } from "./scenes/SceneClose";

outfit.waitUntilDone();
inter.waitUntilDone();

export const FPS = 30;

const SCENES = [
  { component: SceneOpen, frames: 90 },      // 3.0s
  { component: SceneTagline, frames: 192 },  // 6.4s
  { component: SceneCare, frames: 240 },     // 8.0s
  { component: SceneCircle, frames: 240 },   // 8.0s
  { component: SceneVent, frames: 240 },     // 8.0s
  { component: SceneProfile, frames: 240 },  // 8.0s
  { component: SceneClose, frames: 180 },    // 6.0s
];

const TRANSITION_FRAMES = 12;

export const TRAILER_DURATION_FRAMES =
  SCENES.reduce((sum, s) => sum + s.frames, 0) -
  TRANSITION_FRAMES * (SCENES.length - 1);

const PersistentLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, TRAILER_DURATION_FRAMES], [0, 1]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 50 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(80% 80% at 50% 50%, transparent 60%, rgba(20,10,5,0.28) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: `${10 + drift * 30}%`,
          right: `${5 + Math.sin(frame / 60) * 6}%`,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: palette.ovulatory,
          boxShadow: `0 0 20px ${palette.ovulatory}`,
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
};

export const LumenTrailer: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: palette.bg }}>
      <TransitionSeries>
        {SCENES.flatMap((s, i) => {
          const Comp = s.component;
          const nodes: React.ReactNode[] = [
            <TransitionSeries.Sequence
              key={`scene-${i}`}
              durationInFrames={s.frames}
            >
              <Comp />
            </TransitionSeries.Sequence>,
          ];
          if (i < SCENES.length - 1) {
            nodes.push(
              <TransitionSeries.Transition
                key={`tx-${i}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />,
            );
          }
          return nodes;
        })}
      </TransitionSeries>
      <PersistentLayer />
    </AbsoluteFill>
  );
};
