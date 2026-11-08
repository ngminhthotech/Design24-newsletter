import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { linearTiming, type TransitionPresentation, type TransitionPresentationComponentProps, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { flip } from "@remotion/transitions/flip";
import { iris } from "@remotion/transitions/iris";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { pushCut } from "@remotion/transitions/push-cut";
import { loadFonts } from "../artboard/fonts";
import { Big, Cta, Gallery, Hook, Quiz, type SceneProps, SeedContext, Show, Split, Stat, type StudioScene, Swatches, Tips } from "./scenes";
import { getLook, headStyle, type Look, LookContext, type Role, type TransitionName } from "./looks";

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
  look?: string; // phong cách (studio/looks.ts); autopost.run tự chọn, không trùng bài gần nhất
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

// Chuyển cảnh tự viết: các dải màu của phong cách quét ngang che điểm cắt
const Bars: React.FC<TransitionPresentationComponentProps<{ colors: string[] }>> = ({ children, presentationDirection, presentationProgress, passedProps }) => {
  const p = presentationProgress;
  if (presentationDirection === "exiting") return <AbsoluteFill style={{ opacity: p < 0.5 ? 1 : 0 }}>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: p >= 0.5 ? 1 : 0 }}>{children}</AbsoluteFill>
      {passedProps.colors.map((c, i) => {
        const q = Math.min(1, Math.max(0, p * 1.4 - i * 0.12));
        const x = interpolate(q, [0, 0.5, 1], [-1100, 0, 1100]);
        return <div key={i} style={{ position: "absolute", left: 0, top: (i * 1920) / passedProps.colors.length, width: 1080, height: 1920 / passedProps.colors.length + 2, background: c, translate: `${i % 2 ? -x : x}px 0px` }} />;
      })}
    </AbsoluteFill>
  );
};
const bars = (colors: string[]): TransitionPresentation<{ colors: string[] }> => ({ component: Bars, props: { colors } });
// Chuyển cảnh tự viết: xoay và thu nhỏ cảnh cũ, cảnh mới xoay vào
const Spin: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({ children, presentationDirection, presentationProgress }) => {
  const p = presentationProgress;
  const enter = presentationDirection === "entering";
  const style: React.CSSProperties = enter
    ? { rotate: `${(1 - p) * 12}deg`, scale: String(interpolate(p, [0, 1], [0.6, 1])), opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }) }
    : { rotate: `${-p * 12}deg`, scale: String(interpolate(p, [0, 1], [1, 1.3])), opacity: 1 - p };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};
const spin = (): TransitionPresentation<Record<string, never>> => ({ component: Spin, props: {} });

const DIRS = ["from-right", "from-left", "from-bottom", "from-top"] as const;
const presentation = (name: TransitionName, i: number, look: Look) => {
  switch (name) {
    case "slide": return slide({ direction: DIRS[i % 4] });
    case "wipe": return wipe({ direction: (["from-bottom-left", "from-right", "from-top-left", "from-bottom"] as const)[i % 4] });
    case "fade": return fade();
    case "flip": return flip({ direction: DIRS[i % 4] });
    case "iris": return iris({ width: 1080, height: 1920 });
    case "clock": return clockWipe({ width: 1080, height: 1920 });
    case "push": return pushCut({ flashColor: look.accent, flashOpacity: 0.25 });
    case "bars": return bars([look.accent, look.block, look.inkLight]);
    case "spin": return spin();
    default: return punch();
  }
};

// Nền tự xoay: nếu cảnh liền trước cùng nền (hoặc không ghi nền) thì đổi sang nền kế tiếp của phong cách
const DEF_BG: Partial<Record<StudioScene["type"], Role>> = { big: "blue", stat: "ink", cta: "blue" };
const withVariedBg = (scenes: StudioScene[], look: Look): StudioScene[] => {
  let prev = "";
  let k = 0;
  return scenes.map((s) => {
    if (s.type === "hook" || (s.type === "tips" && s.photo && !s.bg) || s.bg === "photo") {
      prev = "photo";
      return s;
    }
    let bg: string = s.bg ?? DEF_BG[s.type] ?? look.cycle[k % look.cycle.length];
    if (bg === prev) {
      const opts = look.cycle.filter((r) => r !== prev);
      bg = opts[k % opts.length];
    }
    k++;
    prev = bg;
    return { ...s, bg };
  });
};

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
const Caption: React.FC<{ text: string; dur: number; look: Look }> = ({ text, dur, look }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cs = chunks(text);
  const total = cs.reduce((a, c) => a + c.length + 6, 0);
  let acc = 0;
  let idx = cs.length - 1;
  let start = 0;
  let len = 1;
  for (let i = 0; i < cs.length; i++) {
    len = ((cs[i].length + 6) / total) * dur * fps;
    if (frame < acc + len) {
      idx = i;
      start = acc;
      break;
    }
    acc += len;
    start = acc - len;
  }
  const sp = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 260, mass: 0.6 } });
  const words = cs[idx].split(" ");
  // số từ đã đọc trong đoạn (để tô màu từng từ ở kiểu "outline")
  const said = Math.floor(interpolate(frame - start, [0, len * 0.9], [1, words.length + 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const base: React.CSSProperties = { fontFamily: look.body, fontWeight: 800, fontSize: 44, lineHeight: 1.22, textAlign: "center" };
  let el: React.ReactNode;
  switch (look.caption) {
    case "outline":
      el = (
        <div style={{ ...base, fontSize: 50, color: "#fff", textTransform: "uppercase", WebkitTextStroke: "8px #000", paintOrder: "stroke fill", textShadow: "0 6px 18px rgba(0,0,0,.5)", scale: String(0.9 + 0.1 * sp) }}>
          {words.map((w, i) => <span key={i} style={{ color: i < said ? look.accent : "#fff" }}>{w}{i < words.length - 1 ? " " : ""}</span>)}
        </div>
      );
      break;
    case "pill":
      el = <div style={{ ...base, background: "rgba(255,255,255,.96)", color: look.inkLight, padding: "14px 34px 16px", borderRadius: 999, boxShadow: "0 12px 30px rgba(0,0,0,.3)", translate: `0px ${(1 - sp) * 20}px`, opacity: Math.min(1, sp * 2), border: `4px solid ${look.accent}` }}>{cs[idx]}</div>;
      break;
    case "bar":
      el = <div style={{ ...base, textAlign: "left", background: "#111", color: "#fff", padding: "12px 26px 14px 30px", borderLeft: `14px solid ${look.block}`, textTransform: "uppercase", boxShadow: "0 12px 30px rgba(0,0,0,.35)", clipPath: `inset(0 ${(1 - Math.min(1, sp)) * 100}% 0 0)` }}>{cs[idx]}</div>;
      break;
    case "tag":
      el = <div style={{ ...base, background: "#fff", color: "#111", padding: "12px 26px 14px", borderRadius: look.radius ? 8 : 0, boxShadow: `8px 8px 0 ${look.block}`, scale: String(0.9 + 0.1 * sp) }}>{cs[idx]}</div>;
      break;
    default:
      el = <div style={{ ...base, background: look.accent, color: look.accentInk, padding: "10px 24px 12px", borderRadius: 10, textTransform: "uppercase", scale: String(0.85 + 0.15 * sp), boxShadow: "0 10px 28px rgba(0,0,0,.4)", rotate: "-1deg" }}>{cs[idx]}</div>;
  }
  return <div style={{ position: "absolute", left: 50, right: 50, top: CAP_Y, display: "flex", justifyContent: "center" }}>{el}</div>;
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

export const Studio: React.FC<StudioData> = (raw) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const look = getLook(raw.look);
  const data = { ...raw, scenes: withVariedBg(raw.scenes, look) };
  const accent = look.accent;
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
    <LookContext.Provider value={look}>
    <AbsoluteFill style={{ background: "#000" }}>
      <TransitionSeries>
        {data.scenes.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <TransitionSeries.Transition presentation={presentation(look.transitions[(i - 1) % look.transitions.length], i, look) as TransitionPresentation<Record<string, unknown>>} timing={linearTiming({ durationInFrames: T })} />}
            <TransitionSeries.Sequence name={`${i}-${s.type}`} durationInFrames={durs[i]}>
              <SeedContext.Provider value={i}>{scene(s, { vd: Math.ceil(ls[i].dur * FPS), dur: durs[i], sources: data.sources, accent }, data.topic)}</SeedContext.Provider>
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
      {/* Thanh tiến độ + logo + chủ đề */}
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${prog * 100}%`, background: accent }} />
      {frame < starts[last] && (
        <div style={{ position: "absolute", left: 50, right: 50, top: 50, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ background: "#fff", borderRadius: Math.min(16, look.radius + 4), padding: "8px 14px", boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>
            <Img src={staticFile("logo-d24.png")} style={{ width: 100, display: "block" }} />
          </div>
          <div style={{ ...headStyle(look), fontSize: 26, letterSpacing: 2, color: look.accentInk, background: look.accent, padding: "8px 18px", borderRadius: look.radius < 10 ? 2 : 999, textTransform: "uppercase", boxShadow: "0 0 0 3px rgba(255,255,255,.9), 0 8px 20px rgba(0,0,0,.25)" }}>{data.series}</div>
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
          <Caption text={l.text} dur={l.dur} look={look} />
        </Sequence>
      ))}
    </AbsoluteFill>
    </LookContext.Provider>
  );
};
