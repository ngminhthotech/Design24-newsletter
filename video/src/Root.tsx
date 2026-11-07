import { Composition } from "remotion";
import { FPS, KienThuc, ktTotalFrames } from "./kienthuc/KienThuc";
import type { KienThucData } from "./kienthuc/types";
import { Artboard, abTotalFrames, type ArtboardData } from "./artboard/Artboard";
import sample from "../../examples/kienthuc-mau.json";
import abSample from "../../examples/artboard-60-30-10.json";
import { Studio, studioTotalFrames, type StudioData } from "./studio/Studio";
import stSample from "../../examples/studio-tuong-phan.json";

// Dựng: npx remotion render <KienThuc|Artboard|Studio> out.mp4 --props=<file.json>  (hoặc render/video.sh)
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="KienThuc"
      component={KienThuc}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={ktTotalFrames(sample as KienThucData)}
      defaultProps={sample as KienThucData}
      calculateMetadata={({ props }) => ({ durationInFrames: ktTotalFrames(props) })}
    />
    <Composition
      id="Artboard"
      component={Artboard}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={abTotalFrames(abSample as ArtboardData)}
      defaultProps={abSample as ArtboardData}
      calculateMetadata={({ props }) => ({ durationInFrames: abTotalFrames(props) })}
    />
    <Composition
      id="Studio"
      component={Studio}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={studioTotalFrames(stSample as unknown as StudioData)}
      defaultProps={stSample as unknown as StudioData}
      calculateMetadata={({ props }) => ({ durationInFrames: studioTotalFrames(props) })}
    />
  </>
);
