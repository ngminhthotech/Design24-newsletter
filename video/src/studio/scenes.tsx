import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY, HEAD } from "../artboard/fonts";
import { Pop } from "../artboard/steps";
import { Ico } from "../kienthuc/kit";
import { blend, contrast, Framed, framedHeight, type Knobs, SIZE, type Spec } from "./specimens";

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
const Marked: React.FC<{ text: string; accent: string; ink?: string; sweep?: number }> = ({ text, accent, ink = "#111", sweep = 1 }) => (
  <>
    {text.split(/(\*[^*]+\*)/).map((part, i) =>
      part.startsWith("*") ? (
        <span key={i} style={{ position: "relative", display: "inline-block", color: ink, padding: "0 .12em", margin: "0 -.04em" }}>
          <span style={{ position: "absolute", inset: "8% 0 4%", background: accent, transformOrigin: "0 50%", scale: `${sweep} 1`, zIndex: 0, rotate: "-1.5deg" }} />
          <span style={{ position: "relative" }}>{part.slice(1, -1)}</span>
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    )}
  </>
);

// ---------- Nền ----------
const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .08 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")`;
export const isLight = (bg?: Bg) => bg === "paper" || (!!bg && bg.startsWith("#") && contrast(bg, "#000000") > 9);
export const Background: React.FC<{ bg?: Bg; photo?: string }> = ({ bg = "dark", photo }) => {
  const frame = useCurrentFrame();
  if (bg === "photo" && photo)
    return (
      <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
        <Img src={staticFile(photo)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(28px) brightness(.45) saturate(1.2)", scale: String(1.15 + frame * 0.0008) }} />
      </AbsoluteFill>
    );
  const base: Record<string, string> = {
    dark: "radial-gradient(ellipse at 50% 35%, #26262B 0%, #0E0E10 70%)",
    ink: "radial-gradient(ellipse at 50% 30%, #1C2340 0%, #0A0E1F 75%)",
    blue: "radial-gradient(ellipse at 50% 30%, #2A35FF 0%, #0813DF 55%, #061450 100%)",
    paper: "#F2EFE8",
  };
  const light = bg === "paper";
  return (
    <AbsoluteFill style={{ background: base[bg] ?? bg }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${light ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.045)"} 2px, transparent 2px), linear-gradient(90deg, ${light ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.045)"} 2px, transparent 2px)`,
          backgroundSize: "90px 90px",
          backgroundPosition: `${frame * 0.4}px ${frame * 0.4}px`,
        }}
      />
      <AbsoluteFill style={{ backgroundImage: NOISE }} />
    </AbsoluteFill>
  );
};

// Tiêu đề cảnh: chữ trượt lên trong mặt nạ
export const Title: React.FC<{ text: string; light: boolean; accent: string; top?: number; size?: number }> = ({ text, light, accent, top = TOP + 20, size = 66 }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, 14], [110, 0], { ...clamp, easing: outExpo });
  const sw = interpolate(frame, [8, 22], [0, 1], { ...clamp, easing: outExpo });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top, textAlign: "center", overflow: "hidden", paddingBottom: 8 }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: size, lineHeight: 1.08, color: light ? "#111" : "#fff", textTransform: "uppercase", translate: `0px ${y}%` }}>
        <Marked text={text} accent={accent} sweep={sw} />
      </div>
    </div>
  );
};

const Badge: React.FC<{ ok: boolean; text: string; scale?: number; style?: React.CSSProperties }> = ({ ok, text, scale = 1, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: ok ? GREEN : RED, color: "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: 38, letterSpacing: 1, padding: "8px 22px 8px 14px", borderRadius: 999, boxShadow: "0 10px 24px rgba(0,0,0,.3)", scale: String(scale), whiteSpace: "nowrap", ...style }}>
    <Ico name={ok ? "check" : "x"} size={36} color="#fff" stroke={3.4} />
    {text}
  </div>
);

// Chú thích vẽ tay trên mẫu: khung tròn nét vẽ + nhãn
const NoteMark: React.FC<{ n: Note; t: number; k: number; accent: string; pw: number; ph: number }> = ({ n, t, k, accent, pw, ph }) => {
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
      <div style={{ position: "absolute", ...lab, background: accent, color: "#111", fontFamily: BODY, fontWeight: 800, fontSize: fs, padding: `${6 / k}px ${16 / k}px`, borderRadius: 10 / k, whiteSpace: "nowrap", opacity: Math.min(1, t * 2), scale: String(0.7 + 0.3 * Math.min(1, t * 1.5)), boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>
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

// ---------- 1. Mở đầu: ảnh toàn khung + chữ động ----------
export const Hook: React.FC<SceneProps<HookScene>> = ({ s, accent }) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, 12, 200], [1.35, 1.12, 1.02], { ...clamp, easing: outExpo });
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {s.photo && <Img src={staticFile(s.photo)} style={{ width: "100%", height: "100%", objectFit: "cover", scale: String(z) }} />}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.15) 30%, rgba(0,0,0,.85) 62%, rgba(0,0,0,.9) 100%)" }} />
      <div style={{ position: "absolute", left: 70, right: 70, top: 700 }}>
        {s.kicker && (
          <div style={{ display: "inline-block", background: accent, color: "#111", fontFamily: HEAD, fontWeight: 700, fontSize: 36, letterSpacing: 3, padding: "6px 18px", marginBottom: 26, scale: String(useSp(2)) , transformOrigin: "0 50%" }}>{s.kicker}</div>
        )}
        {s.lines.map((l, i) => {
          const d = 6 + i * 7;
          const y = interpolate(frame, [d, d + 12], [120, 0], { ...clamp, easing: outExpo });
          const sw = interpolate(frame, [d + 8, d + 20], [0, 1], { ...clamp, easing: outExpo });
          return (
            <div key={i} style={{ overflow: "hidden", paddingBottom: 6 }}>
              <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 132, lineHeight: 1.04, color: "#fff", textTransform: "uppercase", translate: `0px ${y}%`, textShadow: "0 6px 30px rgba(0,0,0,.4)", whiteSpace: "nowrap" }}>
                <Marked text={l} accent={accent} sweep={sw} />
              </div>
            </div>
          );
        })}
      </div>
      {s.lines.map((_, i) => <Pop key={i} at={6 + i * 7} vol={0.25} />)}
    </AbsoluteFill>
  );
};

// ---------- 2. Sửa trực tiếp một mẫu thiết kế ----------
export const Show: React.FC<SceneProps<ShowScene>> = ({ s, vd, accent }) => {
  const frame = useCurrentFrame();
  const light = isLight(s.bg);
  const at = 6 + vd * (s.at ?? 0.45);
  const t = interpolate(frame, [at, at + 18], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const spec = blend(s.spec, s.from, s.to, t);
  const top = s.title ? TOP + 130 : TOP + 40;
  const box = fit(s.spec, 900, BOTTOM - top - (s.meter ? 120 : 30));
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
      {s.title && <Title text={s.title} light={light} accent={accent} />}
      <div style={{ position: "absolute", left: (W - box.w) / 2, top, width: box.w, height: box.h, scale: String((0.85 + 0.15 * enter) * (1 + 0.025 * bump)), opacity: enter, rotate: `${(1 - enter) * -3}deg` }}>
        <div style={{ width: box.w, height: box.h, transformOrigin: "50% 50%", transform: `translate(${ox}px, ${oy}px) scale(${z})` }}>
          <Framed s={spec} width={box.w}>
            {(s.notes ?? []).map((n, i) => {
              const nt = interpolate(frame, [6 + vd * (n.at ?? 0.2), 6 + vd * (n.at ?? 0.2) + 16], [0, 1], clamp);
              return <NoteMark key={i} n={n} t={nt * (1 - t)} k={box.k} accent={accent} pw={SIZE[s.spec.kind][0]} ph={SIZE[s.spec.kind][1]} />;
            })}
          </Framed>
        </div>
        <div style={{ position: "absolute", left: -14, top: -26, rotate: "-4deg" }}>
          <Badge ok={t > 0.5} text={t > 0.5 ? lg : lb} scale={t > 0.5 ? interpolate(frame, [at + 9, at + 16], [0.6, 1], { ...clamp, easing: Easing.out(Easing.back(3)) }) : 1} />
        </div>
      </div>
      {s.meter && (
        <div style={{ position: "absolute", left: 0, right: 0, top: top + box.h + 34, display: "flex", justifyContent: "center", opacity: enter }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, background: light ? "#fff" : "rgba(255,255,255,.1)", border: `3px solid ${cr >= 4.5 ? GREEN : RED}`, borderRadius: 999, padding: "10px 28px", fontFamily: BODY, fontWeight: 700, fontSize: 32, color: light ? "#111" : "#fff" }}>
            <span style={{ opacity: 0.7 }}>Độ tương phản</span>
            <span style={{ fontFamily: HEAD, fontSize: 46, color: cr >= 4.5 ? GREEN : RED }}>{cr.toFixed(1)}:1</span>
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
export const Split: React.FC<SceneProps<SplitScene>> = ({ s, vd, accent }) => {
  const frame = useCurrentFrame();
  const light = isLight(s.bg);
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
        <Framed s={blend(s.spec, k, k, 0)} width={box.w} style={{ outline: ok ? `8px solid ${GREEN}` : "none", outlineOffset: 6, borderRadius: 20 }} />
      </div>
      <div style={{ position: "absolute", left: stack ? -30 : "50%", top: stack ? -24 : -30, translate: stack ? "0 0" : "-50% 0", rotate: stack ? "-4deg" : "0deg" }}>
        <Badge ok={ok} text={ok ? "ĐÚNG" : "SAI"} />
      </div>
      {label && (
        <div style={{ position: stack ? "absolute" : "relative", right: stack ? -20 : undefined, bottom: stack ? -22 : undefined, marginTop: stack ? 0 : 22, textAlign: "center", fontFamily: BODY, fontWeight: 700, fontSize: 30, color: stack ? "#111" : light ? "#111" : "#fff", background: stack ? "#fff" : "transparent", padding: stack ? "6px 16px" : 0, borderRadius: 10, boxShadow: stack ? "0 8px 20px rgba(0,0,0,.25)" : "none" }}>
          {label}
        </div>
      )}
    </div>
  );
  return (
    <AbsoluteFill>
      <Background bg={s.bg} photo={s.photo} />
      {s.title && <Title text={s.title} light={light} accent={accent} />}
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
export const Quiz: React.FC<SceneProps<QuizScene>> = ({ s, vd, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const light = isLight(s.bg);
  const [SW, SH] = SIZE[s.spec.kind];
  const stack = SW >= SH * 0.95;
  const top = TOP + 150;
  const avail = BOTTOM - top;
  const box = stack ? fit(s.spec, 700, (avail - 80) / 2) : fit(s.spec, 470, avail - 60);
  const reveal = Math.max(6 + vd * 0.72, 80);
  const cd = Math.floor(interpolate(frame, [reveal - 3 * fps * 0.6, reveal], [3, 0], clamp));
  const r = interpolate(frame, [reveal, reveal + 10], [0, 1], { ...clamp, easing: outExpo });
  const card = (k: Knobs, letter: string, win: boolean, d: number) => {
    const p = useSp(d, 14, 160);
    return (
      <div style={{ position: "relative", opacity: p * (win ? 1 : 1 - 0.55 * r), scale: String((0.7 + 0.3 * p) * (win ? 1 + 0.04 * r : 1 - 0.05 * r)), filter: win ? "none" : `grayscale(${r})` }}>
        <Framed s={blend(s.spec, k, k, 0)} width={box.w} style={{ outline: win && r > 0 ? `${8 * r}px solid ${GREEN}` : "none", outlineOffset: 6, borderRadius: 20 }} />
        <div style={{ position: "absolute", left: -22, top: -22, width: 84, height: 84, borderRadius: "50%", background: win && r > 0.5 ? GREEN : !win && r > 0.5 ? RED : accent, color: r > 0.5 ? "#fff" : "#111", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontWeight: 700, fontSize: 52, boxShadow: "0 8px 20px rgba(0,0,0,.35)" }}>
          {r > 0.5 ? <Ico name={win ? "check" : "x"} size={50} color="#fff" stroke={3.6} /> : letter}
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Background bg={s.bg} photo={s.photo} />
      <Title text={s.question} light={light} accent={accent} size={70} />
      <div style={{ position: "absolute", left: 0, right: 0, top, height: avail, display: "flex", flexDirection: stack ? "column" : "row", alignItems: "center", justifyContent: "center", gap: stack ? 70 : 44 }}>
        {card(s.a, "A", s.answer === "a", 6)}
        {card(s.b, "B", s.answer === "b", 12)}
      </div>
      {cd > 0 && frame > 20 && (
        <div style={{ position: "absolute", left: "50%", top: top + avail / 2, translate: "-50% -50%", width: 150, height: 150, borderRadius: "50%", background: "#111", border: `8px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontWeight: 700, fontSize: 96, color: "#fff", scale: String(1 + 0.15 * (1 - ((frame - (reveal - 3 * fps * 0.6)) % (fps * 0.6)) / (fps * 0.6))), boxShadow: "0 12px 30px rgba(0,0,0,.4)" }}>
          {cd}
        </div>
      )}
      {[0, 1, 2].map((i) => <Pop key={i} at={reveal - (3 - i) * fps * 0.6} vol={0.2} />)}
      <Pop at={reveal} vol={0.6} />
    </AbsoluteFill>
  );
};

// ---------- 5. Câu chốt chữ lớn ----------
export const Big: React.FC<SceneProps<BigScene>> = ({ s, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const light = isLight(s.bg ?? "blue");
  const words = s.lines.map((l) => l.split(/ (?![^*]*\*)/));
  let n = 0;
  return (
    <AbsoluteFill>
      <Background bg={s.bg ?? "blue"} photo={s.photo} />
      <div style={{ position: "absolute", left: 70, right: 70, top: 0, bottom: 1920 - BOTTOM, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        {s.icon && (
          <div style={{ marginBottom: 40, scale: String(useSp(0)), width: 150, height: 150, borderRadius: 40, background: accent, display: "flex", alignItems: "center", justifyContent: "center", rotate: "-6deg" }}>
            <Ico name={s.icon} size={86} color="#111" stroke={2.4} />
          </div>
        )}
        {words.map((ws, li) => (
          <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 26px" }}>
            {ws.map((w, wi) => {
              const d = 4 + n++ * 4;
              const p = spring({ frame: frame - d, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
              const sw = interpolate(frame, [d + 6, d + 16], [0, 1], { ...clamp, easing: outExpo });
              return (
                <div key={wi} style={{ fontFamily: HEAD, fontWeight: 700, fontSize: w.startsWith("*") ? 150 : 104, lineHeight: 1.12, color: light ? "#111" : "#fff", textTransform: "uppercase", opacity: Math.min(1, p * 2), scale: String(1.6 - 0.6 * p), whiteSpace: "nowrap" }}>
                  <Marked text={w} accent={accent} sweep={sw} />
                </div>
              );
            })}
          </div>
        ))}
        {s.sub && (
          <div style={{ marginTop: 40, fontFamily: BODY, fontWeight: 600, fontSize: 40, lineHeight: 1.35, color: light ? "#333" : "rgba(255,255,255,.85)", textAlign: "center", opacity: interpolate(frame, [4 + n * 4 + 4, 4 + n * 4 + 16], [0, 1], clamp), translate: `0px ${interpolate(frame, [4 + n * 4 + 4, 4 + n * 4 + 16], [30, 0], { ...clamp, easing: outExpo })}px` }}>
            {s.sub}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 6. Bảng mẫu màu chữ / nền, tự tính độ tương phản ----------
export const Swatches: React.FC<SceneProps<SwatchScene>> = ({ s, vd, accent }) => {
  const frame = useCurrentFrame();
  const light = isLight(s.bg);
  const min = s.min ?? 4.5;
  const top = TOP + 150;
  const gap = 22;
  const h = Math.min(190, (BOTTOM - top - gap * (s.rows.length - 1)) / s.rows.length);
  return (
    <AbsoluteFill>
      <Background bg={s.bg} photo={s.photo} />
      <Title text={s.title} light={light} accent={accent} />
      {s.rows.map((r, i) => {
        const d = 8 + (i * Math.max(12, vd * 0.8)) / s.rows.length;
        const p = interpolate(frame, [d, d + 12], [0, 1], { ...clamp, easing: outExpo });
        const cr = contrast(r.ink, r.bg);
        const ok = cr >= min;
        return (
          <div key={i} style={{ position: "absolute", left: 70, right: 70, top: top + i * (h + gap), height: h, borderRadius: 26, background: r.bg, display: "flex", alignItems: "center", padding: "0 34px", gap: 24, boxShadow: "0 16px 36px rgba(0,0,0,.25)", border: light ? "2px solid rgba(0,0,0,.08)" : "none", opacity: p, translate: `${(1 - p) * (i % 2 ? 400 : -400)}px 0px` }}>
            <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: h * 0.5, color: r.ink, lineHeight: 1 }}>Aa</div>
            <div style={{ flex: 1, fontFamily: BODY, fontWeight: 700, fontSize: 34, color: r.ink, lineHeight: 1.2 }}>{r.label ?? "Chữ có dễ đọc không?"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: ok ? GREEN : RED, color: "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: 40, padding: "8px 18px", borderRadius: 16, scale: String(interpolate(frame, [d + 8, d + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.5)) })) }}>
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
export const Stat: React.FC<SceneProps<StatScene>> = ({ s, vd, accent }) => {
  const frame = useCurrentFrame();
  const light = isLight(s.bg ?? "ink");
  const m = s.value.match(/^([\d.,]+)(.*)$/);
  const target = m ? parseFloat(m[1].replace(",", ".")) : 0;
  const dec = m && /[.,]/.test(m[1]) ? 1 : 0;
  const cnt = interpolate(frame, [6, 34], [0, target], { ...clamp, easing: outExpo });
  const shown = m ? cnt.toFixed(dec).replace(".", m[1].includes(",") ? "," : ".") + m[2] : s.value;
  const ink = light ? "#111" : "#fff";
  return (
    <AbsoluteFill>
      <Background bg={s.bg ?? "ink"} photo={s.photo} />
      <div style={{ position: "absolute", left: 70, right: 70, top: TOP + 90, textAlign: "center" }}>
        {s.kicker && <div style={{ display: "inline-block", fontFamily: HEAD, fontWeight: 700, fontSize: 38, letterSpacing: 3, color: "#111", background: accent, padding: "6px 20px", scale: String(useSp(0)) }}>{s.kicker}</div>}
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 300, lineHeight: 1.05, color: ink, marginTop: 30, scale: String(0.6 + 0.4 * useSp(4, 11, 200)) }}>{shown}</div>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 46, color: ink, opacity: interpolate(frame, [20, 32], [0, 1], clamp) }}>{s.label}</div>
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 980, display: "flex", gap: 24, justifyContent: "center" }}>
        {(s.items ?? []).map((it, i) => {
          const d = 6 + vd * 0.5 + i * 8;
          const p = interpolate(frame, [d, d + 12], [0, 1], { ...clamp, easing: outExpo });
          return (
            <div key={i} style={{ flex: 1, maxWidth: 440, background: light ? "#fff" : "rgba(255,255,255,.08)", border: `3px solid ${light ? "#E3DED3" : "rgba(255,255,255,.18)"}`, borderRadius: 28, padding: "28px 26px", textAlign: "center", opacity: p, translate: `0px ${(1 - p) * 80}px` }}>
              <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 96, color: accent, lineHeight: 1 }}>{it.value}</div>
              <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 32, color: ink, marginTop: 10 }}>{it.label}</div>
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
export const Tips: React.FC<SceneProps<TipsScene>> = ({ s, vd, accent }) => {
  const frame = useCurrentFrame();
  const bg = s.bg ?? (s.photo ? "photo" : "dark");
  const light = isLight(bg);
  const n = s.items.length;
  return (
    <AbsoluteFill>
      <Background bg={bg} photo={s.photo} />
      <Title text={s.title} light={light} accent={accent} top={TOP + 60} />
      <div style={{ position: "absolute", left: 70, right: 70, top: TOP + 230, display: "flex", flexDirection: "column", gap: 30 }}>
        {s.items.map((it, i) => {
          const d = 10 + (i * vd * 0.75) / n;
          const p = interpolate(frame, [d, d + 12], [0, 1], { ...clamp, easing: outExpo });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, background: light ? "#fff" : "rgba(255,255,255,.1)", border: `2px solid ${light ? "#E3DED3" : "rgba(255,255,255,.2)"}`, borderRadius: 28, padding: "28px 30px", opacity: p, translate: `${(1 - p) * 500}px 0px`, backdropFilter: "blur(6px)" }}>
              <div style={{ flex: "none", width: 92, height: 92, borderRadius: 24, background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontWeight: 700, fontSize: 60, color: "#111" }}>{i + 1}</div>
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 44, lineHeight: 1.25, color: light ? "#111" : "#fff" }}>{it}</div>
            </div>
          );
        })}
      </div>
      {s.items.map((_, i) => <Pop key={i} at={10 + (i * vd * 0.75) / n} vol={0.25} />)}
    </AbsoluteFill>
  );
};

// ---------- 9. Loạt ví dụ đẹp, cắt nhanh ----------
export const Gallery: React.FC<SceneProps<GalleryScene>> = ({ s, dur, accent }) => {
  const frame = useCurrentFrame();
  const light = isLight(s.bg);
  const n = s.specs.length;
  const seg = Math.max(14, (dur - 10) / n);
  const i = Math.min(n - 1, Math.floor(frame / seg));
  const lf = frame - i * seg;
  const spec = s.specs[i];
  const top = s.title ? TOP + 140 : TOP + 40;
  const box = fit(spec, 860, BOTTOM - top - 20);
  const p = interpolate(lf, [0, 8], [0, 1], { ...clamp, easing: outExpo });
  return (
    <AbsoluteFill>
      <Background bg={s.bg} photo={s.photo} />
      {s.title && <Title text={s.title} light={light} accent={accent} />}
      <div style={{ position: "absolute", left: (W - box.w) / 2, top: top + (BOTTOM - top - box.h) / 2 - 10, scale: String(1.15 - 0.15 * p + lf * 0.002), rotate: `${(i % 2 ? 1 : -1) * (1 - p) * 6}deg`, opacity: p }}>
        <Framed s={spec} width={box.w} />
      </div>
      <div style={{ position: "absolute", right: 70, top: top - 20, fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: light ? "#111" : "#fff", opacity: 0.7 }}>
        {i + 1}/{n}
      </div>
      {s.specs.map((_, k) => <Pop key={k} at={k * seg} vol={0.2} />)}
    </AbsoluteFill>
  );
};

// ---------- 10. Kết: lưu video, theo dõi ----------
export const Cta: React.FC<SceneProps<CtaScene> & { topic: string }> = ({ s, sources, accent, topic }) => {
  const frame = useCurrentFrame();
  const a = useSp(0, 12, 160);
  const b = useSp(10, 12, 160);
  const c = useSp(20, 12, 160);
  return (
    <AbsoluteFill>
      <Background bg={s.bg ?? "blue"} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ background: "#fff", borderRadius: 40, padding: "26px 40px", scale: String(a), boxShadow: "0 30px 60px rgba(0,0,0,.35)" }}>
          <Img src={staticFile("logo-d24.png")} style={{ width: 300, display: "block" }} />
        </div>
        <div style={{ marginTop: 60, display: "flex", gap: 28 }}>
          {[
            ["bookmark", "LƯU LẠI", b],
            ["follow", "THEO DÕI", c],
          ].map(([icon, label, p]) => (
            <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 16, background: accent, color: "#111", fontFamily: HEAD, fontWeight: 700, fontSize: 58, padding: "18px 34px", borderRadius: 26, scale: String(p), rotate: `${label === "LƯU LẠI" ? -3 : 3}deg`, boxShadow: "0 16px 30px rgba(0,0,0,.3)" }}>
              <Ico name={icon as string} size={56} color="#111" stroke={2.8} />
              {label as string}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 70, fontFamily: BODY, fontWeight: 700, fontSize: 40, color: "#fff", opacity: interpolate(frame, [26, 40], [0, 1], clamp), textAlign: "center", padding: "0 80px" }}>
          Mỗi ngày một mẹo thiết kế
          <div style={{ fontSize: 34, opacity: 0.75, marginTop: 10 }}>design24.vn</div>
        </div>
        {sources && sources.length > 0 && (
          <div style={{ marginTop: 80, fontFamily: BODY, fontWeight: 500, fontSize: 24, color: "rgba(255,255,255,.6)", textAlign: "center", padding: "0 100px", opacity: interpolate(frame, [36, 50], [0, 1], clamp) }}>
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
