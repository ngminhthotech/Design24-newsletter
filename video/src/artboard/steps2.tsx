import React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import { C } from "../brand";
import { ease } from "../ui";
import { Ico } from "../kienthuc/kit";
import { BODY, HEAD } from "./fonts";
import { Cursor, lerpStyle, mix, type Palette, Poster, PH, PW, type PosterStyle } from "./poster";
import { CW, DARK, Header, Pop, Stage, type StepProps, Tiny, useIn } from "./steps";

// Cảnh dùng chung cho mọi chủ đề (khoảng cách, căn lề, phân cấp, phông chữ, tương phản...).

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const resolvePal = (pal: Record<string, Palette>, st?: PosterStyle): Palette => {
  const p = st?.palette;
  if (!p) return pal.good ?? Object.values(pal)[0];
  return typeof p === "string" ? (pal[p] ?? pal.good) : p;
};

const FOCUS = { top: { x: PW / 2, y: 235 }, body: { x: PW / 2, y: 650 }, button: { x: 220, y: 848 }, all: { x: PW / 2, y: PH / 2 } };
type Focus = keyof typeof FOCUS;

// ---------- Sửa trực tiếp: bảng thuộc tính kiểu Figma, con trỏ bấm, poster biến đổi ----------
export type FixScene = { type: "fix"; num?: string; title: string; sub?: string; from: PosterStyle; to: PosterStyle; prop: { name: string; from: string; to: string }; focus?: Focus; zoom?: number; say: string };

const Inspector: React.FC<{ name: string; from: string; to: string; t: number }> = ({ name, from, to, t }) => (
  <div style={{ width: 340, background: "#fff", borderRadius: 20, padding: 18, boxShadow: "0 24px 60px rgba(0,0,0,.28)", fontFamily: BODY }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 20, color: "#222" }}>
      <Ico name="layers" size={22} color="#222" /> Thuộc tính
    </div>
    <div style={{ marginTop: 14, fontWeight: 600, fontSize: 19, color: "#777" }}>{name}</div>
    <div style={{ marginTop: 8, height: 52, borderRadius: 12, border: `3px solid ${t > 0 ? "#19B5FE" : "#E5E5E5"}`, background: "#F6F6F6", display: "flex", alignItems: "center", padding: "0 14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 24, color: "#222", overflow: "hidden", whiteSpace: "nowrap" }}>
      {t < 0.5 ? from : to}
    </div>
    <div style={{ position: "relative", marginTop: 16, height: 8, borderRadius: 4, background: "#E5E5E5" }}>
      <div style={{ width: `${20 + 60 * t}%`, height: 8, borderRadius: 4, background: "#19B5FE" }} />
      <div style={{ position: "absolute", left: `calc(${20 + 60 * t}% - 12px)`, top: -8, width: 24, height: 24, borderRadius: 12, background: "#fff", border: "3px solid #19B5FE" }} />
    </div>
  </div>
);

export const Fix: React.FC<StepProps & { s: FixScene }> = ({ pal, s }) => {
  const frame = useCurrentFrame();
  const CLICK_AT = 30;
  const focus = s.focus ?? "all";
  const ipos = focus === "top" ? { x: 520, y: 880 } : { x: 520, y: 200 };
  const target = { x: ipos.x + 170 - 90, y: ipos.y + 105 - 190 }; // ô giá trị, theo toạ độ poster
  const cx = ease(frame, 6, 26, [PW + 140, target.x]);
  const cy = ease(frame, 6, 26, [PH + 160, target.y]);
  const press = interpolate(frame, [CLICK_AT - 2, CLICK_AT, CLICK_AT + 6], [0, 1, 0], clamp);
  const t = ease(frame, CLICK_AT + 2, CLICK_AT + 34, [0, 1]);
  const pin = useIn(4, 14, 180);
  const pout = ease(frame, 76, 86, [1, 0]);
  const zt = ease(frame, CLICK_AT + 40, CLICK_AT + 70, [0, 1]);
  const ok = spring({ frame: frame - 70, fps: 30, config: { damping: 10, stiffness: 200 } });
  const st = lerpStyle(s.from, s.to, t);
  const p = mix(resolvePal(pal, s.from), resolvePal(pal, s.to), t);
  const f = FOCUS[focus];
  return (
    <>
      <Tiny />
      <Header num={s.num} numColor={C.orange} title={s.title.toUpperCase()} sub={s.sub} />
      <Stage zoom={s.zoom ?? (focus === "all" ? 1 : 1.1)} fx={f.x} fy={f.y} t={zt}>
        <Poster p={p} st={st} />
        {pout > 0 && <Cursor x={cx} y={cy} press={press} />}
      </Stage>
      {pout > 0 && (
        <div style={{ position: "absolute", left: ipos.x, top: ipos.y, scale: String(pin * pout), transformOrigin: "0 0", opacity: pout }}>
          <Inspector name={s.prop.name} from={s.prop.from} to={s.prop.to} t={t} />
        </div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1188, display: "flex", justifyContent: "center", gap: 16, alignItems: "center", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 30 }}>
        <span style={{ background: "#fff", border: "2px solid #E4E0D7", borderRadius: 12, padding: "10px 18px", color: "#8A857B", textDecoration: t > 0.5 ? "line-through" : undefined }}>{s.prop.from}</span>
        <Ico name="send" size={30} color={DARK} />
        <span style={{ background: t > 0.5 ? C.orange : "#fff", color: t > 0.5 ? "#fff" : "#8A857B", border: "2px solid #E4E0D7", borderRadius: 12, padding: "10px 18px", scale: String(t > 0.5 ? 0.9 + 0.1 * ok : 1) }}>{s.prop.to}</span>
      </div>
      <Pop at={CLICK_AT} vol={0.55} />
    </>
  );
};

// ---------- Trước / sau với hai kiểu poster bất kỳ ----------
export type VersusScene = { type: "versus"; title?: string; sub?: string; from: PosterStyle; to: PosterStyle; say: string };
export const Versus: React.FC<StepProps & { s: VersusScene }> = ({ pal, s }) => {
  const frame = useCurrentFrame();
  const x = frame < 34 ? ease(frame, 4, 34, [PW - 10, PW / 2]) : PW / 2 + Math.sin((frame - 34) / 16) * 150;
  return (
    <>
      <Tiny />
      <Header title={(s.title ?? "TRƯỚC  /  SAU").toUpperCase()} sub={s.sub} />
      <Stage>
        <Poster p={resolvePal(pal, s.from)} st={s.from} />
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${x}px)` }}>
          <Poster p={resolvePal(pal, s.to)} st={s.to} shadow={false} />
        </div>
        <div style={{ position: "absolute", left: x - 3, top: -20, width: 6, height: PH + 40, background: "#fff", boxShadow: "0 0 12px rgba(0,0,0,.35)" }} />
        <div style={{ position: "absolute", left: x - 38, top: PH / 2 - 38, width: 76, height: 76, borderRadius: 38, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontWeight: 700, fontSize: 34, color: DARK }}>‹ ›</div>
        <div style={{ position: "absolute", left: 20, bottom: 20, background: "rgba(0,0,0,.75)", color: "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: 30, padding: "4px 16px", borderRadius: 8 }}>TRƯỚC</div>
        <div style={{ position: "absolute", right: 20, bottom: 20, background: C.orange, color: "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: 30, padding: "4px 16px", borderRadius: 8 }}>SAU</div>
      </Stage>
    </>
  );
};

// ---------- Nên / không nên: hai poster nhỏ cạnh nhau ----------
export type DoDontScene = { type: "dodont"; title: string; sub?: string; bad: { label: string; style: PosterStyle }; good: { label: string; style: PosterStyle }; say: string };
export const DoDont: React.FC<StepProps & { s: DoDontScene }> = ({ pal, s, vd }) => {
  const frame = useCurrentFrame();
  const at = (t: number) => 6 + t * vd;
  const S = 0.52;
  const col = (side: "bad" | "good", t: number) => {
    const k = spring({ frame: frame - at(t), fps: 30, config: { damping: 12, stiffness: 170 } });
    const it = s[side];
    const good = side === "good";
    return (
      <div style={{ width: PW * S, display: "flex", flexDirection: "column", alignItems: "center", opacity: k, translate: `0px ${(1 - k) * 60}px` }}>
        <div style={{ position: "relative", width: PW * S, height: PH * S }}>
          <div style={{ scale: String(S), transformOrigin: "0 0" }}>
            <Poster p={resolvePal(pal, it.style)} st={it.style} />
          </div>
          <div style={{ position: "absolute", right: -16, top: -16, width: 74, height: 74, borderRadius: 37, background: good ? "#2E8B3E" : "#E53935", border: "5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 18px rgba(0,0,0,.25)", scale: String(spring({ frame: frame - at(t) - 8, fps: 30, config: { damping: 9, stiffness: 220 } })) }}>
            <Ico name={good ? "check" : "x"} size={42} stroke={3.4} />
          </div>
        </div>
        <div style={{ marginTop: 26, fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: good ? "#2E8B3E" : "#E53935" }}>{good ? "NÊN" : "KHÔNG NÊN"}</div>
        <div style={{ marginTop: 8, fontFamily: BODY, fontWeight: 700, fontSize: 28, lineHeight: 1.3, color: DARK, textAlign: "center", width: PW * S }}>{it.label}</div>
      </div>
    );
  };
  return (
    <>
      <Tiny />
      <Header title={s.title.toUpperCase()} sub={s.sub} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 230, display: "flex", justifyContent: "space-between" }}>
        {col("bad", 0.05)}
        {col("good", 0.5)}
      </div>
      <Pop at={at(0.05)} vol={0.4} />
      <Pop at={at(0.5)} vol={0.4} />
    </>
  );
};

// ---------- Ý chính: biểu tượng lớn, con số hoặc từ khoá, các ý nhỏ hiện theo lời đọc ----------
export type PointScene = { type: "point"; num?: string; title: string; sub?: string; icon?: string; big: string; body: string; bullets?: string[]; say: string };
export const Point: React.FC<StepProps & { s: PointScene }> = ({ s, vd }) => {
  const frame = useCurrentFrame();
  const a = useIn(4, 12, 170);
  const b = useIn(12, 14, 170);
  const n = s.bullets?.length ?? 0;
  const at = (i: number) => 8 + (0.35 + (0.55 * i) / Math.max(1, n)) * vd;
  return (
    <>
      <Tiny />
      <Header num={s.num} numColor={C.orange} title={s.title.toUpperCase()} sub={s.sub} />
      <div style={{ position: "absolute", left: 0, right: 0, top: n ? 230 : 380, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 220, height: 220, borderRadius: 60, background: `linear-gradient(135deg, ${C.blue1}, ${C.blue2})`, display: "flex", alignItems: "center", justifyContent: "center", scale: String(a), rotate: `${(1 - a) * -20}deg`, boxShadow: "0 24px 50px rgba(8,19,223,.3)" }}>
          <Ico name={s.icon ?? "bulb"} size={120} />
        </div>
        <div style={{ marginTop: 40, fontFamily: HEAD, fontWeight: 700, fontSize: Math.min(170, 1500 / Math.max(1, s.big.length)), lineHeight: 1, color: DARK, whiteSpace: "nowrap", scale: String(0.8 + 0.2 * b), opacity: b }}>
          <span style={{ background: "linear-gradient(transparent 62%, #FFE500 62%)", padding: "0 12px" }}>{s.big}</span>
        </div>
        <div style={{ marginTop: 30, width: 760, textAlign: "center", fontFamily: BODY, fontWeight: 700, fontSize: 36, lineHeight: 1.35, color: "#3A3732", opacity: ease(frame, 14, 26, [0, 1]) }}>{s.body}</div>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16, width: 720 }}>
          {(s.bullets ?? []).map((t, i) => {
            const k = spring({ frame: frame - at(i), fps: 30, config: { damping: 12, stiffness: 190 } });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", borderRadius: 18, padding: "16px 22px", boxShadow: "0 8px 20px rgba(0,0,0,.07)", fontFamily: BODY, fontWeight: 700, fontSize: 30, color: DARK, opacity: k, translate: `${(1 - k) * 80}px 0px` }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <Ico name="check" size={26} stroke={3} />
                </div>
                {t}
              </div>
            );
          })}
        </div>
      </div>
      {(s.bullets ?? []).map((_, i) => <Pop key={i} at={at(i)} vol={0.3} />)}
    </>
  );
};

// ---------- Danh sách các bước / mẹo ----------
export type ListScene = { type: "list"; title: string; sub?: string; items: string[]; say: string };
export const List: React.FC<StepProps & { s: ListScene }> = ({ s, vd }) => {
  const frame = useCurrentFrame();
  const n = s.items.length;
  const at = (i: number) => 8 + (0.08 + (0.8 * i) / Math.max(1, n)) * vd;
  return (
    <>
      <Tiny />
      <Header title={s.title.toUpperCase()} sub={s.sub} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 240 + Math.max(0, 6 - n) * 70, display: "flex", flexDirection: "column", gap: 26 }}>
        {s.items.map((t, i) => {
          const k = spring({ frame: frame - at(i), fps: 30, config: { damping: 12, stiffness: 180 } });
          const done = frame > at(i) + 12;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, background: "#fff", borderRadius: 24, padding: "26px 28px", boxShadow: "0 10px 26px rgba(0,0,0,.08)", opacity: k, translate: `0px ${(1 - k) * 60}px` }}>
              <div style={{ width: 84, height: 84, borderRadius: 22, background: done ? C.orange : "#EEE9DF", color: done ? "#fff" : DARK, fontFamily: HEAD, fontWeight: 700, fontSize: 52, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{i + 1}</div>
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 36, lineHeight: 1.3, color: DARK }}>{t}</div>
            </div>
          );
        })}
      </div>
      {s.items.map((_, i) => <Pop key={i} at={at(i)} vol={0.3} />)}
    </>
  );
};

export const CARD_W = CW;
