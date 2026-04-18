import { Composition } from "remotion";
import { LumenTrailer, TRAILER_DURATION_FRAMES, FPS } from "./LumenTrailer";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="LumenTrailer"
      component={LumenTrailer}
      durationInFrames={TRAILER_DURATION_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
