import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { BODY, HEAD, loadFonts } from "./fonts";
import type { Role } from "./poster";
import { Bad, Compare, Cover, type CoverText, CH, CW, Examples, Flow, Mistake, type Palettes, Pick, Ratio, Outro, Wheel } from "./steps";
import { DoDont, type DoDontScene, Fix, type FixScene, List, type ListScene, Point, type PointScene, Versus, type VersusScene } from "./steps2";

// Video "bảng vẽ" (mẫu Artboard): nền tối có chữ chìm DESIGN24, logo trên cùng, một tấm thẻ giấy ở giữa
// nơi thiết kế được sửa trực tiếp từng bước, chú thích chữ đen trên nền vàng bên dưới thẻ.

loadFonts();

export type ABScene =
  | ({ type: "cover"; say: string } & CoverText)
  | { type: "bad" | "compare" | "flow" | "ratio" | "mistake" | "wheel" | "examples" | "outro"; say: string }
  | FixScene
  | VersusScene
  | DoDontScene
  | PointScene
  | ListScene
  | { type: "pick"; role: Role; pct: string; name: string; note: string; say: string };

export type ArtboardData = {
  series: string;
  topic: string;
  date: string;
  sources: string[];
  palettes: Palettes;
  scenes: ABScene[];
  voice?: { src: string; dur: number; text: string }[];
  music?: string; // file nhạc nền trong video/public (mặc định music.wav do render/music.py tạo)
};

export const FPS = 30;
const T = 10; // khung chuyển cảnh
const DELAY = 6; // lời đọc bắt đầu sau khi cảnh mở
const CPS = 14; // ký tự/giây ước lượng khi chưa có giọng
const CARD = { x: (1080 - CW) / 2, y: 200 };

const lines = (d: ArtboardData) =>
  d.scenes.map((s, i) => {
    const v = d.voice?.[i];
    return v ? { text: v.text, dur: v.dur, src: v.src as string | undefined } : { text: s.say, dur: Math.max(2, s.say.length / CPS), src: undefined };
  });

const MIN: Record<ABScene["type"], number> = { cover: 75, bad: 100, pick: 110, compare: 100, flow: 100, ratio: 100, mistake: 120, wheel: 110, examples: 110, outro: 120, fix: 110, versus: 100, dodont: 110, point: 100, list: 110 };
const durations = (d: ArtboardData) => lines(d).map((l, i) => Math.max(MIN[d.scenes[i].type], DELAY + Math.ceil(l.dur * FPS) + T + 10));
export const abTotalFrames = (d: ArtboardData) => durations(d).reduce((a, x) => a + x, 0) - (d.scenes.length - 1) * T + 20;

// Chú thích: đổi "60 phần trăm" về "60%", cắt thành cụm ngắn
const display = (t: string) => t.replace(/(\d+) phần trăm/g, "$1%");
const chunks = (text: string) => {
  const out: string[] = [];
  for (const part of display(text).split(/(?<=[,.!?:])\s+(?!\d)/)) {
    const words = part.split(" ");
    let cur = "";
    for (const w of words) {
      if (cur && (cur + " " + w).length > 34) {
        out.push(cur);
        cur = w;
      } else cur = cur ? cur + " " + w : w;
    }
    const last = out[out.length - 1];
    if (cur.length < 10 && last && !/[.!?:]$/.test(last) && (last + " " + cur).length <= 36) out[out.length - 1] = last + " " + cur;
    else out.push(cur);
  }
  return out;
};

const Caption: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cs = chunks(text);
  const total = cs.reduce((a, c) => a + c.length + 6, 0);
  let acc = 0;
  let idx = cs.length - 1;
  let start = 0;
  for (let i = 0; i < cs.length; i++) {
    const len = ((cs[i].length + 6) / total) * dur * fps;
    if (frame < acc + len) {
      idx = i;
      start = acc;
      break;
    }
    acc += len;
    start = acc - len;
  }
  const s = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 260, mass: 0.6 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: CARD.y + CH + 46, display: "flex", justifyContent: "center" }}>
      <div style={{ background: "#FFE500", color: "#111", fontFamily: BODY, fontWeight: 800, fontSize: 40, lineHeight: 1.25, padding: "10px 22px 12px", borderRadius: 8, textAlign: "center", textTransform: "uppercase", scale: String(0.86 + 0.14 * s), boxShadow: "0 8px 24px rgba(0,0,0,.35)" }}>
        {cs[idx]}
      </div>
    </div>
  );
};

// Nền tối, chữ chìm DESIGN24 viền mảnh trôi chậm
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #232323 0%, #121212 75%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -600, top: -500, width: 2400, rotate: "-16deg" }}>
        {Array.from({ length: 16 }).map((_, r) => (
          <div key={r} style={{ whiteSpace: "nowrap", fontFamily: HEAD, fontWeight: 700, fontSize: 150, lineHeight: 1.12, color: "transparent", WebkitTextStroke: "2px rgba(90,170,255,.16)", translate: `${((r % 2 ? 1 : -1) * frame * 0.7) % 520 - (r % 2) * 260}px 0px` }}>
            {"DESIGN24 ".repeat(6)}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")`;

const step = (s: ABScene, d: ArtboardData, vd: number) => {
  const p = { pal: d.palettes, vd };
  switch (s.type) {
    case "cover": return <Cover {...p} pre={s.pre} word={s.word} post={s.post} swatches={s.swatches} />;
    case "bad": return <Bad {...p} />;
    case "pick": return <Pick {...p} role={s.role} pct={s.pct} name={s.name} note={s.note} />;
    case "compare": return <Compare {...p} />;
    case "flow": return <Flow {...p} />;
    case "ratio": return <Ratio {...p} />;
    case "mistake": return <Mistake {...p} />;
    case "wheel": return <Wheel {...p} />;
    case "examples": return <Examples {...p} />;
    case "outro": return <Outro {...p} sources={d.sources} />;
    case "fix": return <Fix {...p} s={s} />;
    case "versus": return <Versus {...p} s={s} />;
    case "dodont": return <DoDont {...p} s={s} />;
    case "point": return <Point {...p} s={s} />;
    case "list": return <List {...p} s={s} />;
  }
};

export const Artboard: React.FC<ArtboardData> = (data) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const durs = durations(data);
  const ls = lines(data);
  const starts: number[] = [];
  let at = 0;
  durs.forEach((dur, i) => {
    starts.push(i > 0 ? at - T : 0);
    at += dur - (i > 0 ? T : 0);
  });
  const spans = ls.flatMap((l, i) => (l.src ? [[starts[i] + DELAY, starts[i] + DELAY + Math.ceil(l.dur * FPS)]] : []));
  const duck = (f: number) =>
    spans.reduce((m, [a, b]) => Math.min(m, interpolate(f, [a - 8, a, b, b + 12], [1, 0.3, 0.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })), 1);
  const cardIn = spring({ frame, fps, config: { damping: 16, stiffness: 140 } });
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 0, right: 0, top: 52, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: "10px 18px", boxShadow: "0 10px 30px rgba(0,0,0,.4)" }}>
          <Img src={staticFile("logo-d24.png")} style={{ width: 118, display: "block" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CW, height: CH, borderRadius: 44, overflow: "hidden", background: "#F3F1EC", boxShadow: "0 40px 80px rgba(0,0,0,.5)", scale: String(0.92 + 0.08 * cardIn) }}>
        <AbsoluteFill style={{ backgroundImage: NOISE }} />
        <TransitionSeries>
          {data.scenes.map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <TransitionSeries.Transition presentation={i % 3 === 0 ? slide({ direction: "from-right" }) : fade()} timing={linearTiming({ durationInFrames: T })} />}
              <TransitionSeries.Sequence name={`${i}-${s.type}`} durationInFrames={durs[i]}>
                <AbsoluteFill style={{ background: "#F3F1EC" }}>
                  <AbsoluteFill style={{ backgroundImage: NOISE }} />
                  {step(s, data, Math.ceil(ls[i].dur * FPS))}
                </AbsoluteFill>
              </TransitionSeries.Sequence>
            </React.Fragment>
          ))}
        </TransitionSeries>
      </div>
      <Audio
        src={staticFile(data.music ?? "music.wav")}
        loop
        volume={(f) => interpolate(f, [0, 15, durationInFrames - 45, durationInFrames], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * duck(f)}
      />
      {starts.slice(1).map((c, i) => (
        <Sequence key={`w${i}`} from={Math.max(0, c - 4)} durationInFrames={24} layout="none">
          <Audio src={staticFile("whoosh.wav")} volume={0.25} />
        </Sequence>
      ))}
      {ls.map((l, i) => (
        <Sequence key={`v${i}`} from={starts[i] + DELAY} durationInFrames={Math.ceil(l.dur * FPS) + 8}>
          {l.src && <Audio src={staticFile(l.src)} volume={1} />}
          <Caption text={l.text} dur={l.dur} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
