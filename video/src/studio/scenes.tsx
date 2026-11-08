import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY } from "../artboard/fonts";
import { Pop } from "../artboard/steps";
import { Ico } from "../kienthuc/kit";
import { blend, contrast, Framed, framedHeight, type Knobs, SIZE, type Spec } from "./specimens";
import { fitSize, headStyle, type Look, type Resolved, type Role, useLook, useTone } from "./looks";

// Các loại cảnh của mẫu Studio. Mỗi cảnh chiếm toàn khung 1080x1920; vùng nội dung y 150..1380,
// phụ đề vàng ở y ~1430, phần dưới cùng để trống cho giao diện TikTok/Reels.

export const W = 1080;
export const TOP = 150;
export const BOTTOM = 1390;
export const YELLOW = "#FFE500";
const RED = "#FF3B3B";
const GREEN = "#19C37D";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

export type Bg = "dark" | "paper" | "blue" | "ink" | "photo" | string;
export type Note = { x: number; y: number; w?: number; h?: number; text: string; at?: number; side?: "left" | "right" | "top" | "bottom" };
export type SceneBase = { say: string; bg?: Bg; photo?: string };
export type HookScene = SceneBase & { type: "hook"; kicker?: string; lines: string[] };
export type ShowScene = SceneBase & { type: "show"; title?: string; spec: Spec; from?: Knobs; to?: Knobs; at?: number; notes?: Note[]; meter?: [string, string]; labels?: [string, string]; zoom?: { x: number; y: number; z: number } };
export type SplitScene = SceneBase & { type: "split"; title?: string; spec: Spec; bad: Knobs; good: Knobs; badLabel?: string; goodLabel?: string };
export type QuizScene = SceneBase & { type: "quiz"; question: string; spec: Spec; a: Knobs; b: Knobs; answer: "a" | "b" };
export type BigScene = SceneBase & { type: "big"; lines: string[]; sub?: string; icon?: string };
export type SwatchScene = SceneBase & { type: "swatches"; title: string; rows: { bg: string; ink: string; label?: string }[]; min?: number };
export type StatScene = SceneBase & { type: "stat"; kicker?: string; value: string; label: string; items?: { value: string; label: string }[] };
export type TipsScene = SceneBase & { type: "tips"; title: string; items: string[] };
export type GalleryScene = SceneBase & { type: "gallery"; title?: string; specs: Spec[] };
export type CtaScene = SceneBase & { type: "cta" };
export type StudioScene = HookScene | ShowScene | SplitScene | QuizScene | BigScene | SwatchScene | StatScene | TipsScene | GalleryScene | CtaScene;
export type SceneProps<S> = { s: S; vd: number; dur: number; sources?: string[]; accent: string };

const useSp = (delay: number, damping = 14, stiffness = 170) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 0.7 } });
};

// Chữ có đánh dấu *từ khóa* thì tô nền màu nhấn
// Kiểu đánh dấu theo phong cách: khối màu, gạch chân dày, hoặc chỉ đổi màu chữ.
const Marked: React.FC<{ text: string; accent: string; ink?: string; sweep?: number }> = ({ text, accent, ink = "#111", sweep = 1 }) => {
  const look = useLook();
  return (
    <>
      {text.split(/(\*[^*]+\*)/).map((part, i) =>
        !part.startsWith("*") ? (
          <span key={i}>{part}</span>
        ) : look.mark === "block" ? (
          <span key={i} style={{ position: "relative", display: "inline-block", color: ink, padding: "0 .12em", margin: "0 -.04em" }}>
            <span style={{ position: "absolute", inset: "8% 0 4%", background: accent, transformOrigin: "0 50%", scale: `${sweep} 1`, zIndex: 0, rotate: "-1.5deg", borderRadius: look.radius > 20 ? ".18em" : 0 }} />
            <span style={{ position: "relative" }}>{part.slice(1, -1)}</span>
          </span>
        ) : look.mark === "underline" ? (
          <span key={i} style={{ position: "relative", display: "inline-block" }}>
            <span style={{ position: "absolute", left: 0, right: 0, bottom: "2%", height: ".2em", background: accent, transformOrigin: "0 50%", scale: `${sweep} 1`, borderRadius: 99 }} />
            <span style={{ position: "relative" }}>{part.slice(1, -1)}</span>
          </span>
        ) : (
          <span key={i} style={{ color: accent, textShadow: `0 0 ${18 * sweep}px ${accent}99` }}>{part.slice(1, -1)}</span>
        ),
      )}
    </>
  );
};
// Màu chữ đặt trên phần đánh dấu: khối màu dùng accentInk, các kiểu khác giữ màu chữ thường
const markInk = (look: Look, t: Resolved) => (look.mark === "block" ? t.accentInk : t.ink);

// ---------- Nền ----------
const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .08 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")`;
export const isLight = (bg?: Bg) => bg === "paper" || (!!bg && bg.startsWith("#") && contrast(bg, "#000000") > 9);

// Họa tiết nền theo phong cách (lưới, chấm, sọc, vòng tròn, sóng, chấm in báo, mảng màu mờ, cột, vạch quét)
const PatternLayer: React.FC<{ look: Look; light: boolean; seed: number }> = ({ look, light, seed }) => {
  const frame = useCurrentFrame();
  const c = light ? "rgba(0,0,0,.06)" : "rgba(255,255,255,.06)";
  const c2 = light ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.12)";
  const t = frame / 30;
  switch (look.pattern) {
    case "grid":
      return <AbsoluteFill style={{ backgroundImage: `linear-gradient(${c} 2px, transparent 2px), linear-gradient(90deg, ${c} 2px, transparent 2px)`, backgroundSize: "90px 90px", backgroundPosition: `${frame * 0.4}px ${frame * 0.4}px` }} />;
    case "dots":
      return <AbsoluteFill style={{ backgroundImage: `radial-gradient(${c2} 5px, transparent 5.5px)`, backgroundSize: "64px 64px", backgroundPosition: `${(seed * 17) % 64}px ${-frame * 0.5}px` }} />;
    case "stripes":
      return <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(${seed % 2 ? 45 : -45}deg, ${c} 0 26px, transparent 26px 70px)`, backgroundPosition: `${frame * 0.8}px 0px` }} />;
    case "halftone":
      return <AbsoluteFill style={{ backgroundImage: `radial-gradient(${c2} 3px, transparent 3.5px)`, backgroundSize: "22px 22px", maskImage: `linear-gradient(${seed % 2 ? 160 : 20}deg, #000 0%, transparent 55%)` }} />;
    case "lines":
      return <AbsoluteFill style={{ backgroundImage: `linear-gradient(90deg, ${c2} 2px, transparent 2px)`, backgroundSize: "180px 100%", backgroundPosition: "60px 0" }} />;
    case "scan":
      return (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <div style={{ position: "absolute", left: -540, right: -540, bottom: -200, height: 900, backgroundImage: `linear-gradient(${look.accent}55 2px, transparent 2px), linear-gradient(90deg, ${look.accent}55 2px, transparent 2px)`, backgroundSize: "120px 120px", backgroundPosition: `0px ${frame * 2}px`, transform: "perspective(500px) rotateX(62deg)", transformOrigin: "50% 100%", maskImage: "linear-gradient(180deg, transparent, #000 60%)" }} />
          <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(180deg, rgba(255,255,255,.035) 0 2px, transparent 2px 6px)" }} />
        </AbsoluteFill>
      );
    case "rings":
      return (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ position: "absolute", left: seed % 2 ? 860 : -260, top: seed % 3 ? -200 : 1250, width: 500 + i * 180, height: 500 + i * 180, translate: `${-i * 90}px ${-i * 90}px`, borderRadius: "50%", border: `3px solid ${c2}`, scale: String(1 + 0.03 * Math.sin(t + i)) }} />
          ))}
        </AbsoluteFill>
      );
    case "waves": {
      const path = (y: number, amp: number, ph: number) => {
        let d = `M -20 ${y}`;
        for (let x = -20; x <= 1100; x += 40) d += ` L ${x} ${y + Math.sin(x / 120 + t * 0.8 + ph) * amp}`;
        return d;
      };
      return (
        <AbsoluteFill>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={path(seed % 2 ? 120 + i * 46 : 1500 + i * 46, 24, i * 0.6)} fill="none" stroke={c2} strokeWidth={3} />)}
          </svg>
        </AbsoluteFill>
      );
    }
    case "blobs": {
      const orb = (x: number, y: number, r: number, col: string, sp: number, ph: number) => (
        <div style={{ position: "absolute", left: x + Math.sin(t * sp + ph) * 70, top: y + Math.cos(t * sp * 0.8 + ph) * 90, width: r, height: r, borderRadius: "50%", background: col, filter: "blur(80px)" }} />
      );
      return (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          {orb(-220, -160, 720, `${look.accent}55`, 0.5, seed)}
          {orb(560, 1250, 820, `${look.block}44`, 0.4, seed + 2)}
        </AbsoluteFill>
      );
    }
    default:
      return null;
  }
};

// Hình trang trí trôi chậm ở mép khung (không đè vùng nội dung giữa)
const DecoLayer: React.FC<{ look: Look; light: boolean; seed: number }> = ({ look, light, seed }) => {
  const frame = useCurrentFrame();
  if (look.deco === "none") return null;
  const t = frame / 30;
  const spots = [
    [70, 260], [960, 330], [40, 1250], [990, 1180], [880, 120], [150, 1700], [1000, 1650],
  ].map(([x, y], i) => [x + ((seed * 37 + i * 53) % 60) - 30, y + ((seed * 23 + i * 31) % 80) - 40]);
  const cols = [look.accent, look.block, light ? look.inkLight : "#ffffff"];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {spots.map(([x, y], i) => {
        const col = cols[(i + seed) % cols.length];
        const dy = Math.sin(t * 0.9 + i) * 14;
        const rot = (t * 20 + i * 40) % 360;
        const st: React.CSSProperties = { position: "absolute", left: x, top: y + dy, opacity: 0.55 };
        if (look.deco === "confetti")
          return <div key={i} style={{ ...st, width: i % 2 ? 26 : 18, height: i % 2 ? 26 : 44, background: col, borderRadius: i % 3 ? 6 : 99, rotate: `${rot}deg` }} />;
        if (look.deco === "circles")
          return <div key={i} style={{ ...st, width: 30 + (i % 3) * 22, height: 30 + (i % 3) * 22, borderRadius: "50%", border: `6px solid ${col}`, opacity: 0.45 }} />;
        if (look.deco === "plus")
          return <div key={i} style={{ ...st, fontFamily: "Arial", fontWeight: 900, fontSize: 64, color: col, rotate: `${rot / 4}deg`, lineHeight: 1 }}>+</div>;
        return (
          <svg key={i} width={40} height={40} viewBox="0 0 24 24" style={{ ...st, rotate: `${rot / 3}deg`, opacity: 0.4 + 0.4 * Math.abs(Math.sin(t * 2 + i)) }}>
            <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill={col} />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

export const SeedContext = React.createContext(0);
export const Background: React.FC<{ bg?: Bg; photo?: string; fallback?: Role }> = ({ bg, photo, fallback = "dark" }) => {
  const frame = useCurrentFrame();
  const seed = React.useContext(SeedContext);
  const look = useLook();
  const tone = useTone(bg, fallback);
  if (bg === "photo" && photo)
    return (
      <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
        <Img src={staticFile(photo)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(28px) brightness(.45) saturate(1.2)", scale: String(1.15 + frame * 0.0008) }} />
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill style={{ background: tone.css, overflow: "hidden" }}>
      <PatternLayer look={look} light={tone.light} seed={seed} />
      <DecoLayer look={look} light={tone.light} seed={seed} />
      <AbsoluteFill style={{ backgroundImage: NOISE }} />
    </AbsoluteFill>
  );
};

// Tiêu đề cảnh: chữ trượt lên trong mặt nạ
export const Title: React.FC<{ text: string; tone: Resolved; top?: number; size?: number }> = ({ text, tone, top = TOP + 20, size = 66 }) => {
  const frame = useCurrentFrame();
  const look = useLook();
  const left = look.align === "left";
  const fs = size * Math.sqrt(0.5 / look.head.w) * (look.head.upper ? 1 : 1.08);
  const y = interpolate(frame, [0, 14], [110, 0], { ...clamp, easing: outExpo });
  const sw = interpolate(frame, [8, 22], [0, 1], { ...clamp, easing: outExpo });
  return (
    <div style={{ position: "absolute", left: left ? 70 : 60, right: 60, top, textAlign: left ? "left" : "center", overflow: "hidden", paddingBottom: 8 }}>
      {left && <div style={{ width: interpolate(frame, [0, 16], [0, 90], { ...clamp, easing: outExpo }), height: 10, background: tone.accent, marginBottom: 14, borderRadius: look.radius ? 99 : 0 }} />}
      <div style={{ ...headStyle(look), fontSize: fs, lineHeight: 1.1, color: tone.ink, translate: `0px ${y}%` }}>
        <Marked text={text} accent={tone.accent} ink={markInk(look, tone)} sweep={sw} />
      </div>
    </div>
  );
};

const Badge: React.FC<{ ok: boolean; text: string; scale?: number; style?: React.CSSProperties }> = ({ ok, text, scale = 1, style }) => {
  const look = useLook();
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: ok ? GREEN : RED, color: "#fff", ...headStyle(look), fontSize: 38 * Math.sqrt(0.5 / look.head.w), letterSpacing: 1, padding: "8px 22px 8px 14px", borderRadius: look.radius < 10 ? 4 : 999, boxShadow: "0 10px 24px rgba(0,0,0,.3)", scale: String(scale), whiteSpace: "nowrap", ...style }}>
      <Ico name={ok ? "check" : "x"} size={36} color="#fff" stroke={3.4} />
      {text}
    </div>
  );
};

// Chú thích vẽ tay trên mẫu: khung tròn nét vẽ + nhãn
const NoteMark: React.FC<{ n: Note; t: number; k: number; accent: string; accentInk: string; pw: number; ph: number }> = ({ n, t, k, accent, accentInk, pw, ph }) => {
  if (t <= 0) return null;
  const w = n.w ?? 220;
  const h = n.h ?? 120;
  const rx = w / 2 + 24;
  const ry = h / 2 + 24;
  const len = Math.PI * (rx + ry) * 1.05;
  const side = n.side ?? "right";
  const fs = 34 / k;
  const lab: React.CSSProperties =
    side === "right" ? { left: n.x + rx + 10 / k, top: n.y - fs } : side === "left" ? { right: pw - (n.x - rx - 10 / k), top: n.y - fs } : side === "top" ? { left: Math.max(8, n.x - rx), bottom: ph - (n.y - ry - 12 / k) } : { left: Math.max(8, n.x - rx), top: n.y + ry + 12 / k };
  return (
    <>
      <svg style={{ position: "absolute", left: n.x - rx - 10, top: n.y - ry - 10, overflow: "visible" }} width={rx * 2 + 20} height={ry * 2 + 20}>
        <ellipse cx={rx + 10} cy={ry + 10} rx={rx} ry={ry} fill="none" stroke={accent} strokeWidth={7 / k} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - Math.min(1, t * 1.4))} transform={`rotate(-4 ${rx + 10} ${ry + 10})`} />
      </svg>
      <div style={{ position: "absolute", ...lab, background: accent, color: accentInk, fontFamily: BODY, fontWeight: 800, fontSize: fs, padding: `${6 / k}px ${16 / k}px`, borderRadius: 10 / k, whiteSpace: "nowrap", opacity: Math.min(1, t * 2), scale: String(0.7 + 0.3 * Math.min(1, t * 1.5)), boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>
        {n.text}
      </div>
    </>
  );
};

// Kích thước hiển thị mẫu sao cho vừa khung (rộng tối đa maxW, cao tối đa maxH)
const fit = (s: Spec, maxW: number, maxH: number) => {
  let w = maxW;
  if (framedHeight(s, w) > maxH) w = (maxW * maxH) / framedHeight(s, maxW);
  return { w, h: framedHeight(s, w), k: s.kind === "app" ? w / (SIZE.app[0] + 36) : s.kind === "landing" ? w / (SIZE.landing[0] + 164) : w / SIZE[s.kind][0] };
};

// Khung đặt mẫu theo phong cách: phẳng, nghiêng nhẹ, khối màu lệch phía sau, hoặc viền phát sáng
const Card: React.FC<{ w: number; h: number; idx?: number; children: React.ReactNode }> = ({ w, h, idx = 0, children }) => {
  const look = useLook();
  const seed = React.useContext(SeedContext);
  const dir = (seed + idx) % 2 ? 1 : -1;
  const p = useSp(4, 16, 120);
  if (look.frame === "tilt") return <div style={{ position: "relative", width: w, height: h, rotate: `${dir * 1.8 * p}deg` }}>{children}</div>;
  if (look.frame === "block")
    return (
      <div style={{ position: "relative", width: w, height: h }}>
        <div style={{ position: "absolute", inset: 0, translate: `${dir * 22 * p}px ${22 * p}px`, background: look.block, borderRadius: Math.max(look.radius, 8) }} />
        <div style={{ position: "relative" }}>{children}</div>
      </div>
    );
  if (look.frame === "glow")
    return (
      <div style={{ position: "relative", width: w, height: h }}>
        <div style={{ position: "absolute", inset: -6, borderRadius: 26, boxShadow: `0 0 ${40 * p}px ${look.accent}, 0 0 ${90 * p}px ${look.block}88`, border: `3px solid ${look.accent}` }} />
        <div style={{ position: "relative" }}>{children}</div>
      </div>
    );
  return <div style={{ position: "relative", width: w, height: h }}>{children}</div>;
};

// ---------- 1. Mở đầu: ảnh + chữ động, 4 bố cục theo phong cách ----------
export const Hook: React.FC<SceneProps<HookScene>> = ({ s }) => {
  const frame = useCurrentFrame();
  const look = useLook();
  const tone = useTone(s.bg, "dark");
  const z = interpolate(frame, [0, 12, 200], [1.35, 1.12, 1.02], { ...clamp, easing: outExpo });
  const kick = useSp(2);
  const frameP = useSp(0, 14, 120);
  const ft = useTone(s.bg ?? "paper");
  const left = look.align === "left" || look.hook === "bottom";
  const linesEl = (color: string, ink: string, accent: string, max: number, width: number) =>
    s.lines.map((l, i) => {
      const d = 6 + i * 7;
      const y = interpolate(frame, [d, d + 12], [120, 0], { ...clamp, easing: outExpo });
      const sw = interpolate(frame, [d + 8, d + 20], [0, 1], { ...clamp, easing: outExpo });
      const size = Math.min(...s.lines.map((x) => fitSize(look, x, max, width)));
      return (
        <div key={i} style={{ overflow: "hidden", paddingBottom: 6 }}>
          <div style={{ ...headStyle(look), fontSize: size, lineHeight: 1.06, color, translate: `0px ${y}%`, whiteSpace: "nowrap", textAlign: left ? "left" : "center" }}>
            <Marked text={l} accent={accent} ink={look.mark === "block" ? ink : color} sweep={sw} />
          </div>
        </div>
      );
    });
  const kicker = (bg: string, ink: string) =>
    s.kicker && <div style={{ display: "inline-block", background: bg, color: ink, ...headStyle(look), fontSize: 34, letterSpacing: 3, padding: "6px 18px", marginBottom: 26, scale: String(kick), transformOrigin: "0 50%", borderRadius: look.radius > 20 ? 999 : look.radius / 2 }}>{s.kicker}</div>;
  const photo = s.photo && <Img src={staticFile(s.photo)} style={{ width: "100%", height: "100%", objectFit: "cover", scale: String(z) }} />;
  let body: React.ReactNode;
  if (look.hook === "split") {
    // Ảnh nửa trên, khối màu nửa dưới, đường cắt chéo
    const cut = interpolate(frame, [0, 14], [1920, 760], { ...clamp, easing: outExpo });
    body = (
      <>
        <AbsoluteFill style={{ overflow: "hidden" }}>{photo}</AbsoluteFill>
        <div style={{ position: "absolute", left: 0, right: 0, top: cut, bottom: -100, background: tone.css, clipPath: "polygon(0 70px, 100% 0, 100% 100%, 0 100%)" }} />
        <div style={{ position: "absolute", left: 70, right: 70, top: cut + 120 }}>
          {kicker(tone.accent, tone.accentInk)}
          {linesEl(tone.ink, tone.accentInk, tone.accent, 112, 940)}
        </div>
      </>
    );
  } else if (look.hook === "block") {
    // Ảnh toàn khung, chữ nằm trong khối màu đặc trượt vào từ trái
    const p = interpolate(frame, [2, 16], [-1100, 0], { ...clamp, easing: outExpo });
    body = (
      <>
        <AbsoluteFill style={{ overflow: "hidden" }}>{photo}</AbsoluteFill>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.45) 100%)" }} />
        <div style={{ position: "absolute", left: 50, right: 50, top: 640, translate: `${p}px 0px`, background: tone.css, padding: "44px 46px 50px", borderRadius: look.radius, boxShadow: "0 30px 70px rgba(0,0,0,.45)" }}>
          {kicker(tone.accent, tone.accentInk)}
          {linesEl(tone.ink, tone.accentInk, tone.accent, 116, 880)}
        </div>
      </>
    );
  } else if (look.hook === "frame") {
    // Nền màu, ảnh trong khung bo tròn nghiêng nhẹ, chữ bên dưới
    const p = frameP;
    body = (
      <>
        <Background bg={s.bg ?? "paper"} />
        <div style={{ position: "absolute", left: 110, right: 110, top: 190, height: 640, borderRadius: look.radius + 10, overflow: "hidden", border: "14px solid #fff", boxShadow: "0 30px 60px rgba(0,0,0,.3)", rotate: `${-4 * p}deg`, scale: String(0.7 + 0.3 * p) }}>{photo}</div>
        <div style={{ position: "absolute", left: 70, right: 70, top: 900, textAlign: "center" }}>
          {kicker(ft.accent, ft.accentInk)}
          {linesEl(ft.ink, ft.accentInk, ft.accent, 120, 940)}
        </div>
      </>
    );
  } else {
    body = (
      <>
        <AbsoluteFill style={{ overflow: "hidden" }}>{photo}</AbsoluteFill>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.15) 30%, rgba(0,0,0,.85) 62%, rgba(0,0,0,.9) 100%)" }} />
        <div style={{ position: "absolute", left: 70, right: 70, top: 700 }}>
          {kicker(look.accent, look.accentInk)}
          {linesEl("#fff", look.accentInk, look.accent, 132, 940)}
        </div>
      </>
    );
  }
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {body}
      {s.lines.map((_, i) => <Pop key={i} at={6 + i * 7} vol={0.25} />)}
    </AbsoluteFill>
  );
};

// ---------- 2. Sửa trực tiếp một mẫu thiết kế ----------
export const Show: React.FC<SceneProps<ShowScene>> = ({ s, vd }) => {
  const frame = useCurrentFrame();
  const look = useLook();
  const tone = useTone(s.bg);
  const at = 6 + vd * (s.at ?? 0.45);
  const t = interpolate(frame, [at, at + 18], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const spec = blend(s.spec, s.from, s.to, t);
  const top = s.title ? TOP + 130 : TOP + 40;
  const box = fit(s.spec, look.frame === "block" ? 860 : 900, BOTTOM - top - (s.meter ? 120 : 30));
  const enter = useSp(0, 16, 120);
  const bump = interpolate(frame, [at, at + 6, at + 18], [0, 1, 0], clamp);
  const zt = s.zoom ? interpolate(frame, [at - 14, at, at + 30, at + 44], [0, 1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 0;
  const z = 1 + ((s.zoom?.z ?? 1) - 1) * zt;
  const ox = s.zoom ? (box.w / 2 - s.zoom.x * box.k) * zt : 0;
  const oy = s.zoom ? (box.h / 2 - s.zoom.y * box.k) * zt : 0;
  const [lb, lg] = s.labels ?? ["TRƯỚC", "SAU"];
  const cr = s.meter ? contrast((spec.pal as Record<string, string>)[s.meter[0]], (spec.pal as Record<string, string>)[s.meter[1]]) : 0;
  return (
    <AbsoluteFill>
      <Background bg={s.bg} photo={s.photo ?? s.spec.photo} />
      {s.title && <Title text={s.title} tone={tone} />}
      <div style={{ position: "absolute", left: (W - box.w) / 2, top, width: box.w, height: box.h, scale: String((0.85 + 0.15 * enter) * (1 + 0.025 * bump)), opacity: enter, rotate: `${(1 - enter) * -3}deg` }}>
        <Card w={box.w} h={box.h}>
          <div style={{ width: box.w, height: box.h, transformOrigin: "50% 50%", transform: `translate(${ox}px, ${oy}px) scale(${z})` }}>
            <Framed s={spec} width={box.w}>
              {(s.notes ?? []).map((n, i) => {
                const nt = interpolate(frame, [6 + vd * (n.at ?? 0.2), 6 + vd * (n.at ?? 0.2) + 16], [0, 1], clamp);
                return <NoteMark key={i} n={n} t={nt * (1 - t)} k={box.k} accent={look.accent} accentInk={look.accentInk} pw={SIZE[s.spec.kind][0]} ph={SIZE[s.spec.kind][1]} />;
              })}
            </Framed>
          </div>
        </Card>
        <div style={{ position: "absolute", left: -14, top: -26, rotate: "-4deg" }}>
          <Badge ok={t > 0.5} text={t > 0.5 ? lg : lb} scale={t > 0.5 ? interpolate(frame, [at + 9, at + 16], [0.6, 1], { ...clamp, easing: Easing.out(Easing.back(3)) }) : 1} />
        </div>
      </div>
      {s.meter && (
        <div style={{ position: "absolute", left: 0, right: 0, top: top + box.h + 34, display: "flex", justifyContent: "center", opacity: enter }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, background: tone.light ? "#fff" : "rgba(0,0,0,.55)", border: `3px solid ${cr >= 4.5 ? GREEN : RED}`, borderRadius: look.radius < 10 ? 4 : 999, padding: "10px 28px", fontFamily: BODY, fontWeight: 700, fontSize: 32, color: tone.light ? "#111" : "#fff" }}>
            <span style={{ opacity: 0.7 }}>Độ tương phản</span>
            <span style={{ ...headStyle(look), fontSize: 46, color: cr >= 4.5 ? GREEN : RED }}>{cr.toFixed(1)}:1</span>
            <Ico name={cr >= 4.5 ? "check" : "x"} size={36} color={cr >= 4.5 ? GREEN : RED} stroke={3.4} />
          </div>
        </div>
      )}
      <Pop at={at + 8} vol={0.45} />
      {(s.notes ?? []).map((n, i) => <Pop key={i} at={6 + vd * (n.at ?? 0.2)} vol={0.25} />)}
    </AbsoluteFill>
  );
};

// ---------- 3. Sai / Đúng đặt cạnh nhau ----------
export const Split: React.FC<SceneProps<SplitScene>> = ({ s, vd }) => {
  const frame = useCurrentFrame();
  const tone = useTone(s.bg);
  const [SW, SH] = SIZE[s.spec.kind];
  const stack = SW >= SH * 0.95;
  const top = s.title ? TOP + 140 : TOP + 50;
  const avail = BOTTOM - top;
  const box = stack ? fit(s.spec, 760, (avail - 60) / 2) : fit(s.spec, 470, avail - 120);
  const at = 6 + vd * 0.42;
  const a = useSp(4, 15, 150);
  const b = useSp(at, 12, 180);
  const item = (k: Knobs, ok: boolean, p: number, label?: string) => (
    <div style={{ position: "relative", opacity: p, scale: String(0.8 + 0.2 * p), translate: stack ? `${(1 - p) * (ok ? 300 : -300)}px 0px` : `0px ${(1 - p) * 200}px` }}>
      <div style={{ filter: ok || frame < at ? "none" : `saturate(${interpolate(frame, [at, at + 10], [1, 0.35], clamp)})`, opacity: ok || frame < at ? 1 : interpolate(frame, [at, at + 10], [1, 0.75], clamp) }}>
        <Card w={box.w} h={box.h} idx={ok ? 1 : 0}>
          <Framed s={blend(s.spec, k, k, 0)} width={box.w} style={{ outline: ok ? `8px solid ${GREEN}` : "none", outlineOffset: 6, borderRadius: 20 }} />
        </Card>
      </div>
      <div style={{ position: "absolute", left: stack ? -30 : "50%", top: stack ? -24 : -30, translate: stack ? "0 0" : "-50% 0", rotate: stack ? "-4deg" : "0deg" }}>
        <Badge ok={ok} text={ok ? "ĐÚNG" : "SAI"} />
      </div>
      {label && (
        <div style={{ position: stack ? "absolute" : "relative", right: stack ? -20 : undefined, bottom: stack ? -22 : undefined, marginTop: stack ? 0 : 30, textAlign: "center", fontFamily: BODY, fontWeight: 700, fontSize: 30, color: stack ? "#111" : tone.ink, background: stack ? "#fff" : "transparent", padding: stack ? "6px 16px" : 0, borderRadius: 10, boxShadow: stack ? "0 8px 20px rgba(0,0,0,.25)" : "none" }}>
          {label}
        </div>
      )}
    </div>
  );
  return (
    <AbsoluteFill>
      <Background bg={s.bg} photo={s.photo} />
      {s.title && <Title text={s.title} tone={tone} />}
      <div style={{ position: "absolute", left: 0, right: 0, top, height: avail, display: "flex", flexDirection: stack ? "column" : "row", alignItems: "center", justifyContent: stack ? "space-around" : "center", gap: stack ? 0 : 40 }}>
        {item(s.bad, false, a, s.badLabel)}
        {item(s.good, true, b, s.goodLabel)}
      </div>
      <Pop at={4} vol={0.3} />
      <Pop at={at} vol={0.5} />
    </AbsoluteFill>
  );
};

// ---------- 4. Câu đố A hay B ----------
export const Quiz: React.FC<SceneProps<QuizScene>> = ({ s, vd }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const look = useLook();
  const tone = useTone(s.bg);
  const [SW, SH] = SIZE[s.spec.kind];
  const stack = SW >= SH * 0.95;
  const top = TOP + 150;
  const avail = BOTTOM - top;
  const box = stack ? fit(s.spec, 700, (avail - 80) / 2) : fit(s.spec, 470, avail - 60);
  const reveal = Math.max(6 + vd * 0.72, 80);
  const cd = Math.floor(interpolate(frame, [reveal - 3 * fps * 0.6, reveal], [3, 0], clamp));
  const r = interpolate(frame, [reveal, reveal + 10], [0, 1], { ...clamp, easing: outExpo });
  const pa = useSp(6, 14, 160);
  const pb = useSp(12, 14, 160);
  const card = (k: Knobs, letter: string, win: boolean, p: number, idx: number) => (
    <div style={{ position: "relative", opacity: p * (win ? 1 : 1 - 0.55 * r), scale: String((0.7 + 0.3 * p) * (win ? 1 + 0.04 * r : 1 - 0.05 * r)), filter: win ? "none" : `grayscale(${r})` }}>
      <Card w={box.w} h={box.h} idx={idx}>
        <Framed s={blend(s.spec, k, k, 0)} width={box.w} style={{ outline: win && r > 0 ? `${8 * r}px solid ${GREEN}` : "none", outlineOffset: 6, borderRadius: 20 }} />
      </Card>
      <div style={{ position: "absolute", left: -22, top: -22, width: 84, height: 84, borderRadius: look.radius < 10 ? 6 : "50%", background: win && r > 0.5 ? GREEN : !win && r > 0.5 ? RED : tone.accent, color: r > 0.5 ? "#fff" : tone.accentInk, display: "flex", alignItems: "center", justifyContent: "center", ...headStyle(look), fontSize: 52, boxShadow: "0 8px 20px rgba(0,0,0,.35)" }}>
        {r > 0.5 ? <Ico name={win ? "check" : "x"} size={50} color="#fff" stroke={3.6} /> : letter}
      </div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Background bg={s.bg} photo={s.photo} />
      <Title text={s.question} tone={tone} size={70} />
      <div style={{ position: "absolute", left: 0, right: 0, top, height: avail, display: "flex", flexDirection: stack ? "column" : "row", alignItems: "center", justifyContent: "center", gap: stack ? 70 : 44 }}>
        {card(s.a, "A", s.answer === "a", pa, 0)}
        {card(s.b, "B", s.answer === "b", pb, 1)}
      </div>
      {cd > 0 && frame > 20 && (
        <div style={{ position: "absolute", left: "50%", top: top + avail / 2, translate: "-50% -50%", width: 150, height: 150, borderRadius: look.radius < 10 ? 8 : "50%", background: tone.light ? "#111" : "#fff", border: `8px solid ${tone.accent}`, display: "flex", alignItems: "center", justifyContent: "center", ...headStyle(look), fontSize: 96, color: tone.light ? "#fff" : "#111", scale: String(1 + 0.15 * (1 - ((frame - (reveal - 3 * fps * 0.6)) % (fps * 0.6)) / (fps * 0.6))), boxShadow: "0 12px 30px rgba(0,0,0,.4)" }}>
          {cd}
        </div>
      )}
      {[0, 1, 2].map((i) => <Pop key={i} at={reveal - (3 - i) * fps * 0.6} vol={0.2} />)}
      <Pop at={reveal} vol={0.6} />
    </AbsoluteFill>
  );
};

// ---------- 5. Câu chốt chữ lớn ----------
export const Big: React.FC<SceneProps<BigScene>> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const look = useLook();
  const tone = useTone(s.bg, "blue");
  const left = look.align === "left";
  const words = s.lines.map((l) => l.split(/ (?![^*]*\*)/));
  const longest = Math.max(...words.flat().map((w) => w.replace(/\*/g, "").length));
  const base = Math.min(104, 900 / (Math.max(4, longest) * look.head.w * 1.45));
  const iconP = useSp(0);
  let n = 0;
  return (
    <AbsoluteFill>
      <Background bg={s.bg ?? "blue"} photo={s.photo} fallback="blue" />
      <div style={{ position: "absolute", left: 70, right: 70, top: 0, bottom: 1920 - BOTTOM, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: left ? "flex-start" : "center" }}>
        {s.icon && (
          <div style={{ marginBottom: 40, scale: String(iconP), width: 150, height: 150, borderRadius: Math.min(40, look.radius * 1.4), background: tone.accent, display: "flex", alignItems: "center", justifyContent: "center", rotate: "-6deg" }}>
            <Ico name={s.icon} size={86} color={tone.accentInk} stroke={2.4} />
          </div>
        )}
        {words.map((ws, li) => (
          <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: left ? "flex-start" : "center", gap: "0 26px" }}>
            {ws.map((w, wi) => {
              const d = 4 + n++ * 4;
              const p = spring({ frame: frame - d, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
              const sw = interpolate(frame, [d + 6, d + 16], [0, 1], { ...clamp, easing: outExpo });
              const big = w.startsWith("*");
              return (
                <div key={wi} style={{ ...headStyle(look), fontSize: big ? Math.min(150, fitSize(look, w, base * 1.45, 940)) : base, lineHeight: 1.14, color: tone.ink, opacity: Math.min(1, p * 2), scale: String(1.6 - 0.6 * p), whiteSpace: "nowrap", transformOrigin: left ? "0 50%" : "50% 50%" }}>
                  <Marked text={w} accent={tone.accent} ink={markInk(look, tone)} sweep={sw} />
                </div>
              );
            })}
          </div>
        ))}
        {s.sub && (
          <div style={{ marginTop: 40, fontFamily: look.body, fontWeight: 600, fontSize: 40, lineHeight: 1.35, color: tone.sub, textAlign: left ? "left" : "center", opacity: interpolate(frame, [4 + n * 4 + 4, 4 + n * 4 + 16], [0, 1], clamp), translate: `0px ${interpolate(frame, [4 + n * 4 + 4, 4 + n * 4 + 16], [30, 0], { ...clamp, easing: outExpo })}px` }}>
            {s.sub}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 6. Bảng mẫu màu chữ / nền, tự tính độ tương phản ----------
export const Swatches: React.FC<SceneProps<SwatchScene>> = ({ s, vd }) => {
  const frame = useCurrentFrame();
  const look = useLook();
  const tone = useTone(s.bg);
  const min = s.min ?? 4.5;
  const top = TOP + 150;
  const gap = 22;
  const h = Math.min(190, (BOTTOM - top - gap * (s.rows.length - 1)) / s.rows.length);
  return (
    <AbsoluteFill>
      <Background bg={s.bg} photo={s.photo} />
      <Title text={s.title} tone={tone} />
      {s.rows.map((r, i) => {
        const d = 8 + (i * Math.max(12, vd * 0.8)) / s.rows.length;
        const p = interpolate(frame, [d, d + 12], [0, 1], { ...clamp, easing: outExpo });
        const cr = contrast(r.ink, r.bg);
        const ok = cr >= min;
        return (
          <div key={i} style={{ position: "absolute", left: 70, right: 70, top: top + i * (h + gap), height: h, borderRadius: look.radius, background: r.bg, display: "flex", alignItems: "center", padding: "0 34px", gap: 24, boxShadow: "0 16px 36px rgba(0,0,0,.25)", border: tone.light ? "2px solid rgba(0,0,0,.08)" : "none", opacity: p, translate: `${(1 - p) * (i % 2 ? 400 : -400)}px 0px` }}>
            <div style={{ ...headStyle(look), textTransform: "none", fontSize: h * 0.5, color: r.ink, lineHeight: 1 }}>Aa</div>
            <div style={{ flex: 1, fontFamily: BODY, fontWeight: 700, fontSize: 34, color: r.ink, lineHeight: 1.2 }}>{r.label ?? "Chữ có dễ đọc không?"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: ok ? GREEN : RED, color: "#fff", ...headStyle(look), fontSize: 40, padding: "8px 18px", borderRadius: Math.min(16, look.radius), scale: String(interpolate(frame, [d + 8, d + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.5)) })) }}>
              {cr.toFixed(1)}:1
              <Ico name={ok ? "check" : "x"} size={34} color="#fff" stroke={3.4} />
            </div>
          </div>
        );
      })}
      {s.rows.map((_, i) => <Pop key={i} at={8 + (i * Math.max(12, vd * 0.8)) / s.rows.length + 8} vol={0.25} />)}
    </AbsoluteFill>
  );
};

// ---------- 7. Con số chính ----------
export const Stat: React.FC<SceneProps<StatScene>> = ({ s, vd }) => {
  const frame = useCurrentFrame();
  const look = useLook();
  const tone = useTone(s.bg, "ink");
  const left = look.align === "left";
  const m0 = s.value.match(/^([\d.,]+)(.*)$/);
  const m = m0 && !/\d/.test(m0[2]) ? m0 : null;
  const target = m ? parseFloat(m[1].replace(",", ".")) : 0;
  const dec = m && /[.,]/.test(m[1]) ? 1 : 0;
  const cnt = interpolate(frame, [6, 34], [0, target], { ...clamp, easing: outExpo });
  const shown = m ? cnt.toFixed(dec).replace(".", m[1].includes(",") ? "," : ".") + m[2] : s.value;
  const k = useSp(0);
  const v = useSp(4, 11, 200);
  return (
    <AbsoluteFill>
      <Background bg={s.bg ?? "ink"} photo={s.photo} fallback="ink" />
      <div style={{ position: "absolute", left: 70, right: 70, top: TOP + 90, textAlign: left ? "left" : "center" }}>
        {s.kicker && <div style={{ display: "inline-block", ...headStyle(look), fontSize: 36, letterSpacing: 3, color: tone.accentInk, background: tone.accent, padding: "6px 20px", scale: String(k), borderRadius: look.radius > 20 ? 999 : look.radius / 2, transformOrigin: left ? "0 50%" : "50% 50%" }}>{s.kicker}</div>}
        <div style={{ ...headStyle(look), fontSize: fitSize(look, s.value, 300, 900), lineHeight: 1.05, color: look.mark === "color" ? tone.accent : tone.ink, marginTop: 30, scale: String(0.6 + 0.4 * v), transformOrigin: left ? "0 50%" : "50% 50%", whiteSpace: "nowrap" }}>{shown}</div>
        <div style={{ fontFamily: look.body, fontWeight: 700, fontSize: 46, color: tone.ink, opacity: interpolate(frame, [20, 32], [0, 1], clamp) }}>{s.label}</div>
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 980, display: "flex", gap: 24, justifyContent: left ? "flex-start" : "center" }}>
        {(s.items ?? []).map((it, i) => {
          const d = 6 + vd * 0.5 + i * 8;
          const p = interpolate(frame, [d, d + 12], [0, 1], { ...clamp, easing: outExpo });
          return (
            <div key={i} style={{ flex: 1, maxWidth: 440, background: tone.light ? "#fff" : "rgba(255,255,255,.08)", border: `3px solid ${tone.light ? "rgba(0,0,0,.1)" : "rgba(255,255,255,.18)"}`, borderRadius: look.radius, padding: "28px 26px", textAlign: "center", opacity: p, translate: `0px ${(1 - p) * 80}px` }}>
              <div style={{ ...headStyle(look), fontSize: fitSize(look, it.value, 96, 360), color: tone.light ? look.block : tone.accent, lineHeight: 1 }}>{it.value}</div>
              <div style={{ fontFamily: look.body, fontWeight: 600, fontSize: 32, color: tone.light ? "#111" : "#fff", marginTop: 10 }}>{it.label}</div>
            </div>
          );
        })}
      </div>
      <Pop at={6} vol={0.3} />
      {(s.items ?? []).map((_, i) => <Pop key={i} at={6 + vd * 0.5 + i * 8} vol={0.25} />)}
    </AbsoluteFill>
  );
};

// ---------- 8. Mẹo nhanh trên nền ảnh mờ ----------
export const Tips: React.FC<SceneProps<TipsScene>> = ({ s, vd }) => {
  const frame = useCurrentFrame();
  const look = useLook();
  const bg = s.bg ?? (s.photo ? "photo" : "dark");
  const tone = useTone(bg === "photo" ? "dark" : bg);
  const light = bg !== "photo" && tone.light;
  const n = s.items.length;
  return (
    <AbsoluteFill>
      <Background bg={bg} photo={s.photo} />
      <Title text={s.title} tone={bg === "photo" ? { ...tone, ink: "#fff", light: false, accent: look.accent, accentInk: look.accentInk } : tone} top={TOP + 60} />
      <div style={{ position: "absolute", left: 70, right: 70, top: TOP + 230, display: "flex", flexDirection: "column", gap: 30 }}>
        {s.items.map((it, i) => {
          const d = 10 + (i * vd * 0.75) / n;
          const p = interpolate(frame, [d, d + 12], [0, 1], { ...clamp, easing: outExpo });
          const acc = bg === "photo" ? look.accent : tone.accent;
          const accInk = bg === "photo" ? look.accentInk : tone.accentInk;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, background: light ? "#fff" : "rgba(255,255,255,.1)", border: `2px solid ${light ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.2)"}`, borderRadius: look.radius, padding: "28px 30px", opacity: p, translate: `${(1 - p) * (i % 2 ? -500 : 500)}px 0px`, backdropFilter: "blur(6px)" }}>
              <div style={{ flex: "none", width: 92, height: 92, borderRadius: look.radius > 30 ? "50%" : Math.min(24, look.radius), background: acc, display: "flex", alignItems: "center", justifyContent: "center", ...headStyle(look), fontSize: 60, color: accInk }}>{i + 1}</div>
              <div style={{ fontFamily: look.body, fontWeight: 700, fontSize: 44, lineHeight: 1.25, color: light ? "#111" : "#fff" }}>{it}</div>
            </div>
          );
        })}
      </div>
      {s.items.map((_, i) => <Pop key={i} at={10 + (i * vd * 0.75) / n} vol={0.25} />)}
    </AbsoluteFill>
  );
};

// ---------- 9. Loạt ví dụ đẹp, cắt nhanh ----------
export const Gallery: React.FC<SceneProps<GalleryScene>> = ({ s, dur }) => {
  const frame = useCurrentFrame();
  const look = useLook();
  const tone = useTone(s.bg);
  const n = s.specs.length;
  const seg = Math.max(14, (dur - 10) / n);
  const i = Math.min(n - 1, Math.floor(frame / seg));
  const lf = frame - i * seg;
  const spec = s.specs[i];
  const top = s.title ? TOP + 140 : TOP + 40;
  const box = fit(spec, look.frame === "block" ? 820 : 860, BOTTOM - top - 20);
  const p = interpolate(lf, [0, 8], [0, 1], { ...clamp, easing: outExpo });
  return (
    <AbsoluteFill>
      <Background bg={s.bg} photo={s.photo} />
      {s.title && <Title text={s.title} tone={tone} />}
      <div style={{ position: "absolute", left: (W - box.w) / 2, top: top + (BOTTOM - top - box.h) / 2 - 10, scale: String(1.15 - 0.15 * p + lf * 0.002), rotate: `${(i % 2 ? 1 : -1) * (1 - p) * 6}deg`, opacity: p }}>
        <Card w={box.w} h={box.h} idx={i}>
          <Framed s={spec} width={box.w} />
        </Card>
      </div>
      <div style={{ position: "absolute", right: 70, top: top - 20, ...headStyle(look), fontSize: 40, color: tone.ink, opacity: 0.7 }}>
        {i + 1}/{n}
      </div>
      {s.specs.map((_, k) => <Pop key={k} at={k * seg} vol={0.2} />)}
    </AbsoluteFill>
  );
};

// ---------- 10. Kết: lưu video, theo dõi ----------
export const Cta: React.FC<SceneProps<CtaScene> & { topic: string }> = ({ s, sources, topic }) => {
  const frame = useCurrentFrame();
  const look = useLook();
  const tone = useTone(s.bg, "blue");
  const a = useSp(0, 12, 160);
  const b = useSp(10, 12, 160);
  const c = useSp(20, 12, 160);
  return (
    <AbsoluteFill>
      <Background bg={s.bg ?? "blue"} fallback="blue" />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ background: "#fff", borderRadius: Math.max(8, look.radius + 10), padding: "26px 40px", scale: String(a), boxShadow: "0 30px 60px rgba(0,0,0,.35)" }}>
          <Img src={staticFile("logo-d24.png")} style={{ width: 300, display: "block" }} />
        </div>
        <div style={{ marginTop: 60, display: "flex", gap: 28 }}>
          {[
            ["bookmark", "LƯU LẠI", b],
            ["follow", "THEO DÕI", c],
          ].map(([icon, label, p]) => (
            <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 16, background: tone.accent, color: tone.accentInk, ...headStyle(look), textTransform: "uppercase", fontSize: 58 * Math.sqrt(0.5 / look.head.w), padding: "18px 34px", borderRadius: look.radius, scale: String(p), rotate: `${label === "LƯU LẠI" ? -3 : 3}deg`, boxShadow: "0 16px 30px rgba(0,0,0,.3)" }}>
              <Ico name={icon as string} size={56} color={tone.accentInk} stroke={2.8} />
              {label as string}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 70, fontFamily: look.body, fontWeight: 700, fontSize: 40, color: tone.ink, opacity: interpolate(frame, [26, 40], [0, 1], clamp), textAlign: "center", padding: "0 80px" }}>
          Mỗi ngày một mẹo thiết kế
          <div style={{ fontSize: 34, opacity: 0.75, marginTop: 10 }}>design24.vn</div>
        </div>
        {sources && sources.length > 0 && (
          <div style={{ marginTop: 80, fontFamily: BODY, fontWeight: 500, fontSize: 24, color: tone.sub, opacity: interpolate(frame, [36, 50], [0, 1], clamp) * 0.75, textAlign: "center", padding: "0 100px" }}>
            {topic} · Tham khảo: {sources.join(", ")}
          </div>
        )}
      </div>
      <Pop at={0} vol={0.3} />
      <Pop at={10} vol={0.4} />
      <Pop at={20} vol={0.4} />
    </AbsoluteFill>
  );
};
