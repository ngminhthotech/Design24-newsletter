import { Composition } from "remotion";
import { FPS, KienThuc, ktTotalFrames } from "./kienthuc/KienThuc";
import type { KienThucData } from "./kienthuc/types";
import sample from "../../examples/kienthuc-mau.json";

// Dựng: npx remotion render KienThuc out.mp4 --props=<file.json>  (hoặc render/video.sh)
export const RemotionRoot: React.FC = () => (
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
);
