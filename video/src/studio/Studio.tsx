import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { linearTiming, type TransitionPresentation, type TransitionPresentationComponentProps, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { BODY, HEAD, loadFonts } from "../artboard/fonts";
import { Big, Cta, Gallery, Hook, Quiz, type SceneProps, Show, Split, Stat, type StudioScene, Swatches, Tips, YELLOW } from "./scenes";

// Mẫu "Studio": mỗi cảnh một bố cục, nền và mẫu thiết kế khác nhau (poster, bài đăng, app, web...),
// ảnh thật CC0, chuyển cảnh nhanh (đẩy, quét, zoom, chớp), phụ đề vàng, logo Design24 góc trên.

loadFonts();

export type StudioData = {
  template: "studio";
  series: string;
  topic: string;
  date: string;
  sources: string[];
  accent?: string;
  scenes: StudioScene[];
  credits?: { title?: string; creator?: string; source?: string; url?: string }[];
  voice?: { src: string; dur: number; text: string }[];
  music?: string;
};

export const FPS = 30;
const T = 8;
const DELAY = 5;
const CPS = 14;
const CAP_Y = 1430;

const lines = (d: StudioData) =>
  d.scenes.map((s, i) => {
    const v = d.voice?.[i];
    return v ? { text: v.text, dur: v.dur, src: v.src as string | undefined } : { text: s.say, dur: Math.max(2, s.say.length / CPS), src: undefined };
  });
const MIN: Record<StudioScene["type"], number> = { hook: 70, show: 110, split: 100, quiz: 120, big: 75, swatches: 110, stat: 90, tips: 110, gallery: 90, cta: 110 };
const durations = (d: StudioData) => lines(d).map((l, i) => Math.max(MIN[d.scenes[i].type], DELAY + Math.ceil(l.dur * FPS) + T + 6));
export const studioTotalFrames = (d: StudioData) => durations(d).reduce((a, x) => a + x, 0) - (d.scenes.length - 1) * T + 15;

// ---------- Chuyển cảnh tự viết: zoom đẩy (punch) ----------
const Punch: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({ children, presentationDirection, presentationProgress }) => {
  const enter = presentationDirection === "entering";
  const p = presentationProgress;
  const style: React.CSSProperties = enter
    ? { scale: String(interpolate(p, [0, 1], [1.4, 1])), opacity: interpolate(p, [0, 0.5], [0, 1], { extrapolateRight: "clamp" }), filter: `blur(${(1 - p) * 14}px)` }
    : { scale: String(interpolate(p, [0, 1], [1, 0.8])), opacity: interpolate(p, [0.4, 1], [1, 0], { extrapolateLeft: "clamp" }) };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};
const punch = (): TransitionPresentation<Record<string, never>> => ({ component: Punch, props: {} });

const PRES = [
  () => slide({ direction: "from-right" }),
  () => punch(),
  () => wipe({ direction: "from-bottom-left" }),
  () => slide({ direction: "from-bottom" }),
  () => punch(),
  () => wipe({ direction: "from-right" }),
];

// ---------- Phụ đề ----------
const display = (t: string) => t.replace(/(\d+) phần trăm/g, "$1%");
const chunks = (text: string) => {
  const out: string[] = [];
  for (const part of display(text).split(/(?<=[,.!?:])\s+(?!\d)/)) {
    let cur = "";
    for (const w of part.split(" ")) {
      if (cur && (cur + " " + w).length > 30) {
        out.push(cur);
        cur = w;
      } else cur = cur ? cur + " " + w : w;
    }
    const last = out[out.length - 1];
    if (cur.length < 10 && last && !/[.!?:]$/.test(last) && (last + " " + cur).length <= 34) out[out.length - 1] = last + " " + cur;
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
  const sp = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 260, mass: 0.6 } });
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: CAP_Y, display: "flex", justifyContent: "center" }}>
      <div style={{ background: YELLOW, color: "#111", fontFamily: BODY, fontWeight: 800, fontSize: 44, lineHeight: 1.22, padding: "10px 24px 12px", borderRadius: 10, textAlign: "center", textTransform: "uppercase", scale: String(0.85 + 0.15 * sp), boxShadow: "0 10px 28px rgba(0,0,0,.4)", rotate: "-1deg" }}>
        {cs[idx]}
      </div>
    </div>
  );
};

const scene = (s: StudioScene, p: Omit<SceneProps<StudioScene>, "s">, topic: string) => {
  switch (s.type) {
    case "hook": return <Hook {...p} s={s} />;
    case "show": return <Show {...p} s={s} />;
    case "split": return <Split {...p} s={s} />;
    case "quiz": return <Quiz {...p} s={s} />;
    case "big": return <Big {...p} s={s} />;
    case "swatches": return <Swatches {...p} s={s} />;
    case "stat": return <Stat {...p} s={s} />;
    case "tips": return <Tips {...p} s={s} />;
    case "gallery": return <Gallery {...p} s={s} />;
    case "cta": return <Cta {...p} s={s} topic={topic} />;
  }
};

export const Studio: React.FC<StudioData> = (data) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const accent = data.accent ?? YELLOW;
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
  const prog = frame / durationInFrames;
  const last = data.scenes.length - 1;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <TransitionSeries>
        {data.scenes.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <TransitionSeries.Transition presentation={PRES[(i - 1) % PRES.length]() as TransitionPresentation<Record<string, unknown>>} timing={linearTiming({ durationInFrames: T })} />}
            <TransitionSeries.Sequence name={`${i}-${s.type}`} durationInFrames={durs[i]}>
              {scene(s, { vd: Math.ceil(ls[i].dur * FPS), dur: durs[i], sources: data.sources, accent }, data.topic)}
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
      {/* Thanh tiến độ + logo + chủ đề */}
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${prog * 100}%`, background: accent }} />
      {frame < starts[last] && (
        <div style={{ position: "absolute", left: 50, right: 50, top: 50, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "8px 14px", boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>
            <Img src={staticFile("logo-d24.png")} style={{ width: 100, display: "block" }} />
          </div>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 28, letterSpacing: 2, color: "#fff", background: "rgba(0,0,0,.55)", padding: "8px 18px", borderRadius: 999, textTransform: "uppercase" }}>{data.series}</div>
        </div>
      )}
      {/* Chớp sáng nhẹ ở mỗi lần cắt cảnh */}
      {starts.slice(1).map((c, i) => (
        <Sequence key={`f${i}`} from={c + Math.floor(T / 2) - 1} durationInFrames={4} layout="none">
          <AbsoluteFill style={{ background: "#fff", opacity: 0.12, pointerEvents: "none" }} />
        </Sequence>
      ))}
      <Audio
        src={staticFile(data.music ?? "nhac-marimba.wav")}
        loop
        volume={(f) => interpolate(f, [0, 10, durationInFrames - 45, durationInFrames], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * duck(f)}
      />
      {starts.slice(1).map((c, i) => (
        <Sequence key={`w${i}`} from={Math.max(0, c - 3)} durationInFrames={24} layout="none">
          <Audio src={staticFile("whoosh.wav")} volume={0.3} />
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
