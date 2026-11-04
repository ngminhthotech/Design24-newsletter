import React from "react";
import { Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { C, CONTACT } from "../brand";
import { ease } from "../ui";
import { Ico } from "../kienthuc/kit";
import { MiniArt, RatioBar } from "../kienthuc/mock";
import { BODY, HEAD } from "./fonts";
import { applyRole, CLICK, Cursor, hexToHsv, mix, type Palette, Picker, Poster, PH, PW, REGION, type Role } from "./poster";

// Các bước của video kiểu "bảng vẽ": mọi thứ diễn ra trong một tấm thẻ giấy 900x1300.
export const CW = 900;
export const CH = 1300;
const PY = 190;
export const DARK = "#1B1B1B";
export const POSTER_Y = 190;

export type Palettes = Record<string, Palette>;
export type StepProps = { pal: Palettes; vd: number }; // vd: số khung của lời đọc

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const useIn = (delay: number, damping = 13, stiffness = 170) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 0.7 } });
};

export const Pop: React.FC<{ at: number; vol?: number }> = ({ at, vol = 0.5 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={20} layout="none">
    <Audio src={staticFile("pop.wav")} volume={vol} />
  </Sequence>
);

// Tiêu đề bước, kiểu "01  RADIAL GRID ........ Lưới hướng tâm"
export const Header: React.FC<{ num?: string; numColor?: string; title: string; sub?: string }> = ({ num, numColor = "#CFCBC2", title, sub }) => {
  const frame = useCurrentFrame();
  const p = useIn(0, 16);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 70, display: "flex", alignItems: "flex-end", gap: 18, opacity: p }}>
      {num && <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 72, lineHeight: 0.9, whiteSpace: "nowrap", color: numColor, translate: `0px ${(1 - p) * 30}px` }}>{num}</div>}
      <div style={{ overflow: "hidden" }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 54, lineHeight: 1, whiteSpace: "nowrap", color: DARK, translate: `0px ${ease(frame, 2, 16, [100, 0])}%` }}>{title}</div>
      </div>
      <div style={{ flex: 1 }} />
      {sub && <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 24, whiteSpace: "nowrap", color: "#6B675F", paddingBottom: 6 }}>{sub}</div>}
    </div>
  );
};

// Đặt poster vào thẻ, có máy quay zoom tới điểm (fx, fy) của poster
export const Stage: React.FC<{ zoom?: number; fx?: number; fy?: number; t?: number; scale?: number; top?: number; children: React.ReactNode }> = ({
  zoom = 1, fx = PW / 2, fy = PH / 2, t = 0, scale = 1, top = PY, children,
}) => {
  const z = 1 + (zoom - 1) * t;
  return (
    <div style={{ position: "absolute", left: (CW - PW * scale) / 2, top, width: PW, height: PH, transformOrigin: "0 0", scale: String(scale) }}>
      <div style={{ width: PW, height: PH, transformOrigin: `${PW / 2}px ${PH / 2}px`, transform: `scale(${z}) translate(${(PW / 2 - fx) * t}px, ${(PH / 2 - fy) * t}px)` }}>{children}</div>
    </div>
  );
};

// Hàng 3 ô màu dưới poster: ô nào đã chọn thì tô màu, chưa thì để nét đứt
const ROLES: Role[] = ["bg", "panel", "accent"];
const PCT: Record<Role, string> = { bg: "60%", panel: "30%", accent: "10%" };
const SwatchRow: React.FC<{ good: Palette; done: number; fresh?: number }> = ({ good, done, fresh = 1 }) => (
  <div style={{ position: "absolute", left: 50, right: 50, top: 1188, display: "flex", gap: 18 }}>
    {ROLES.map((r, i) => {
      const on = i < done || (i === done && fresh > 0);
      const k = i === done ? fresh : 1;
      return (
        <div key={r} style={{ flex: 1, height: 78, borderRadius: 16, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", background: on ? "#fff" : "transparent", border: on ? "2px solid #E4E0D7" : "3px dashed #CFCBC2", boxSizing: "border-box" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: on ? good[r] : "transparent", border: on ? "2px solid rgba(0,0,0,.08)" : "none", scale: String(on ? 0.6 + 0.4 * k : 1) }} />
          <div>
            <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 30, color: on ? DARK : "#B9B4A9", lineHeight: 1 }}>{PCT[r]}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18, color: "#8A857B" }}>{on ? good[r].toUpperCase() : "#------"}</div>
          </div>
        </div>
      );
    })}
  </div>
);

export const Tiny: React.FC = () => <div style={{ position: "absolute", left: 40, top: 26, fontFamily: BODY, fontWeight: 800, fontSize: 20, color: "#8A857B", letterSpacing: 0.5 }}>design24</div>;

// ---------------- 1. Mở đầu ----------------
export type CoverText = { pre?: string; word?: string; post?: string; swatches?: string[] };
export const Cover: React.FC<StepProps & CoverText> = ({ pal, pre = "BẠN ĐÃ PHỐI MÀU", word = "60-30-10", post = "đúng cách chưa?", swatches }) => {
  const frame = useCurrentFrame();
  const a = useIn(0, 12, 200);
  const b = useIn(7, 12, 160);
  const c = useIn(16, 10, 200);
  const box = ease(frame, 6, 22, [0, 100]);
  const g = pal.good;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: swatches || word === "60-30-10" ? 330 : 400, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: "#8A857B", marginBottom: 14, opacity: a }}>design24</div>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: Math.min(104, 1900 / Math.max(1, pre.length)), whiteSpace: "nowrap", color: DARK, lineHeight: 1, scale: String(0.7 + 0.3 * a), opacity: a }}>{pre}</div>
        <div style={{ position: "relative", marginTop: 26, padding: "0 34px", background: "rgba(25,181,254,.12)", border: "3px solid #19B5FE", clipPath: `inset(0 ${100 - box}% 0 0)` }}>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: Math.min(196, 1650 / Math.max(1, word.length)), lineHeight: 1.08, letterSpacing: -2, whiteSpace: "nowrap", backgroundImage: `linear-gradient(90deg, ${g.panel} 0%, ${C.blue2} 55%, ${g.accent} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", scale: String(0.85 + 0.15 * b) }}>
            {word}
          </div>
          <div style={{ position: "absolute", left: -14, top: -16, width: 0, height: 0, borderLeft: "14px solid transparent", borderRight: "14px solid transparent", borderTop: "22px solid #19B5FE" }} />
          <div style={{ position: "absolute", right: -14, bottom: -18, width: 0, height: 0, borderLeft: "14px solid transparent", borderRight: "14px solid transparent", borderBottom: "22px solid #19B5FE" }} />
        </div>
        <div style={{ marginTop: 34, background: DARK, color: "#fff", fontFamily: BODY, fontWeight: 800, fontSize: Math.min(60, 1500 / Math.max(1, post.length)), whiteSpace: "nowrap", padding: "8px 30px 14px", rotate: "-3deg", scale: String(c), borderRadius: 6 }}>{post}</div>
        <div style={{ marginTop: 70, width: 600, height: 26, borderRadius: 13, overflow: "hidden", display: "flex", opacity: ease(frame, 24, 34, [0, 1]) }}>
          {(swatches ?? (word === "60-30-10" ? [g.bg, g.panel, g.accent] : [])).map((col, i) => (
            <div key={i} style={{ width: `${[60, 30, 10][i] * ease(frame, 24 + i * 5, 40 + i * 5, [0, 1])}%`, background: col, border: i === 0 ? "2px solid #DAD5CA" : undefined, boxSizing: "border-box" }} />
          ))}
        </div>
      </div>
      <Cursor x={ease(frame, 18, 34, [760, 660])} y={ease(frame, 18, 34, [960, 800])} press={interpolate(frame, [36, 39, 44], [0, 1, 0], clamp)} />
      <Pop at={16} vol={0.35} />
    </>
  );
};

// ---------------- 2. Thiết kế rối mắt ----------------
const GAZE = [
  [560, 140], [150, 880], [610, 470], [300, 300], [600, 860], [200, 560], [470, 700], [120, 160], [640, 300], [380, 900],
];
export const Bad: React.FC<StepProps> = ({ pal }) => {
  const frame = useCurrentFrame();
  const shake = frame < 30 ? Math.sin(frame * 1.9) * ease(frame, 8, 30, [5, 0]) : 0;
  const hop = Math.floor(frame / 9) % GAZE.length;
  const prev = GAZE[(hop + GAZE.length - 1) % GAZE.length];
  const k = ease(frame % 9, 0, 6, [0, 1]);
  const gx = prev[0] + (GAZE[hop][0] - prev[0]) * k;
  const gy = prev[1] + (GAZE[hop][1] - prev[1]) * k;
  const on = frame > 24;
  return (
    <>
      <Tiny />
      <Header num="?" numColor="#E53935" title="RỐI MẮT" sub="màu nào cũng mạnh" />
      <Stage>
        <div style={{ rotate: `${shake * 0.3}deg`, translate: `${shake}px 0px` }}>
          <Poster p={pal.bad} />
        </div>
        {on && (
          <div style={{ position: "absolute", left: gx - 40, top: gy - 40, width: 80, height: 80, borderRadius: 40, background: "rgba(255,255,255,.85)", border: "5px solid #E53935", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(0,0,0,.25)" }}>
            <Ico name="eye" size={40} color="#E53935" />
          </div>
        )}
        {[
          [80, 470, 30],
          [620, 640, 46],
          [420, 30, 62],
        ].map(([x, y, d], i) => {
          const s = spring({ frame: frame - d, fps: 30, config: { damping: 9, stiffness: 220 } });
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, width: 76, height: 76, borderRadius: 38, background: "#E53935", color: "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: 52, display: "flex", alignItems: "center", justifyContent: "center", scale: String(s), rotate: `${(i - 1) * 12}deg`, boxShadow: "0 8px 18px rgba(0,0,0,.25)" }}>
              ?
            </div>
          );
        })}
      </Stage>
      <SwatchRow good={pal.good} done={0} fresh={0} />
      <Pop at={30} vol={0.3} />
    </>
  );
};

// ---------------- 3-5. Chọn màu cho từng vai trò ----------------
const PICKER_POS: Record<Role, { x: number; y: number }> = {
  bg: { x: 560, y: 260 },
  panel: { x: 560, y: 690 },
  accent: { x: 560, y: 600 },
};
const ZOOM: Record<Role, number> = { bg: 1, panel: 1.08, accent: 1.18 };

export const Pick: React.FC<StepProps & { role: Role; pct: string; name: string; note: string }> = ({ pal, role, pct, name, note }) => {
  const frame = useCurrentFrame();
  const idx = ROLES.indexOf(role);
  let before = pal.bad;
  ROLES.slice(0, idx).forEach((r) => (before = applyRole(before, pal.good, r)));
  const after = applyRole(before, pal.good, role);
  const click = CLICK[role];
  const CLICK_AT = 30;
  const cx = ease(frame, 6, 26, [PW + 120, click.x]);
  const cy = ease(frame, 6, 26, [PH + 160, click.y]);
  const press = interpolate(frame, [CLICK_AT - 2, CLICK_AT, CLICK_AT + 6], [0, 1, 0], clamp);
  const pt = ease(frame, CLICK_AT, CLICK_AT + 18, [0, 1]);
  const wipe = ease(frame, CLICK_AT + 2, CLICK_AT + 28, [0, 1500]);
  const pin = useIn(6, 14, 180);
  const pout = ease(frame, 66, 76, [1, 0]);
  const ring = ease(frame, CLICK_AT + 26, CLICK_AT + 36, [0, 1]);
  const zt = ease(frame, CLICK_AT + 30, CLICK_AT + 60, [0, 1]);
  const reg = REGION[role];
  const pp = PICKER_POS[role];
  const roleColor = role === "bg" ? "#B9B09C" : pal.good[role];
  return (
    <>
      <Tiny />
      <Header num={pct} numColor={roleColor} title={name.toUpperCase()} sub={note} />
      <Stage zoom={ZOOM[role]} fx={reg.x + reg.w / 2} fy={reg.y + reg.h / 2} t={zt}>
        <Poster p={before} />
        <div style={{ position: "absolute", inset: 0, clipPath: `circle(${wipe}px at ${click.x}px ${click.y}px)` }}>
          <Poster p={after} shadow={false} />
        </div>
        {ring > 0 && (
          <div style={{ position: "absolute", left: reg.x + (role === "bg" ? 12 : -10), top: reg.y + (role === "bg" ? 12 : -10), width: reg.w + (role === "bg" ? -24 : 20), height: reg.h + (role === "bg" ? -24 : 20), border: `6px dashed ${C.orange}`, borderRadius: reg.r + 8, opacity: ring, boxSizing: "border-box" }}>
            <div style={{ position: "absolute", left: -6, top: -52, background: C.orange, color: "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: 32, padding: "2px 16px", borderRadius: 8, scale: String(ring) }}>{pct}</div>
          </div>
        )}
        {pout > 0 && <Cursor x={cx} y={cy} press={press} />}
      </Stage>
      {pout > 0 && (
        <div style={{ position: "absolute", left: pp.x, top: pp.y, scale: String(pin * pout), transformOrigin: "0 0", opacity: pout }}>
          <Picker from={before[role]} to={after[role]} t={pt} label={name} />
        </div>
      )}
      <SwatchRow good={pal.good} done={idx} fresh={ease(frame, CLICK_AT + 6, CLICK_AT + 18, [0, 1])} />
      <Pop at={CLICK_AT} vol={0.55} />
    </>
  );
};

// ---------------- 6. Trước / sau ----------------
export const Compare: React.FC<StepProps> = ({ pal }) => {
  const frame = useCurrentFrame();
  const x = frame < 34 ? ease(frame, 4, 34, [PW - 10, PW / 2]) : PW / 2 + Math.sin((frame - 34) / 16) * 150;
  return (
    <>
      <Tiny />
      <Header title="TRƯỚC  /  SAU" sub="cùng một bố cục" />
      <Stage>
        <Poster p={pal.bad} />
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${x}px)` }}>
          <Poster p={pal.good} shadow={false} />
        </div>
        <div style={{ position: "absolute", left: x - 3, top: -20, width: 6, height: PH + 40, background: "#fff", boxShadow: "0 0 12px rgba(0,0,0,.35)" }} />
        <div style={{ position: "absolute", left: x - 38, top: PH / 2 - 38, width: 76, height: 76, borderRadius: 38, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontWeight: 700, fontSize: 34, color: DARK }}>‹ ›</div>
        <div style={{ position: "absolute", left: 20, bottom: 20, background: "rgba(0,0,0,.75)", color: "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: 30, padding: "4px 16px", borderRadius: 8 }}>TRƯỚC</div>
        <div style={{ position: "absolute", right: 20, bottom: 20, background: C.orange, color: "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: 30, padding: "4px 16px", borderRadius: 8 }}>SAU</div>
      </Stage>
      <SwatchRow good={pal.good} done={3} />
    </>
  );
};

// ---------------- 7. Thứ tự nhìn ----------------
const FLOW = [
  { x: 330, y: 230, t: 0.38, label: "Tiêu đề" },
  { x: 300, y: 650, t: 0.6, label: "Nội dung" },
  { x: 220, y: 848, t: 0.82, label: "Hành động" },
];
export const Flow: React.FC<StepProps> = ({ pal, vd }) => {
  const frame = useCurrentFrame();
  const at = (t: number) => 8 + t * vd;
  const len = (a: (typeof FLOW)[0], b: (typeof FLOW)[0]) => Math.hypot(b.x - a.x, b.y - a.y);
  return (
    <>
      <Tiny />
      <Header num="1-2-3" numColor={C.orange} title="THỨ TỰ NHÌN" sub="mắt đi đúng đường" />
      <Stage>
        <Poster p={pal.good} />
        <svg width={PW} height={PH} style={{ position: "absolute", inset: 0 }}>
          {FLOW.slice(1).map((b, i) => {
            const a = FLOW[i];
            const L = len(a, b);
            const p = ease(frame, at(a.t), at(b.t), [0, 1]);
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.orange} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${L * p} ${L}`} />;
          })}
        </svg>
        {FLOW.map((f, i) => {
          const s = spring({ frame: frame - at(f.t), fps: 30, config: { damping: 10, stiffness: 200 } });
          return (
            <div key={i} style={{ position: "absolute", left: f.x - 40, top: f.y - 40, display: "flex", alignItems: "center", gap: 10, scale: String(s) }}>
              <div style={{ width: 80, height: 80, borderRadius: 40, background: C.orange, border: "5px solid #fff", color: "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: 44, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>{i + 1}</div>
              <div style={{ background: "#fff", color: DARK, fontFamily: BODY, fontWeight: 800, fontSize: 26, padding: "6px 14px", borderRadius: 10, boxShadow: "0 6px 16px rgba(0,0,0,.2)" }}>{f.label}</div>
            </div>
          );
        })}
      </Stage>
      {FLOW.map((f, i) => <Pop key={i} at={at(f.t)} vol={0.4} />)}
      <SwatchRow good={pal.good} done={3} />
    </>
  );
};

// ---------------- 8. Tóm tắt tỉ lệ ----------------
export const Ratio: React.FC<StepProps> = ({ pal, vd }) => {
  const frame = useCurrentFrame();
  const g = pal.good;
  const items: { r: Role; name: string; at: number }[] = [
    { r: "bg", name: "Màu chủ đạo", at: 0.12 },
    { r: "panel", name: "Màu phụ", at: 0.45 },
    { r: "accent", name: "Màu nhấn", at: 0.75 },
  ];
  const at = (t: number) => 8 + t * vd;
  return (
    <>
      <Tiny />
      <Header title="TỈ LỆ VÀNG" sub="lưu lại bảng màu này" />
      <Stage scale={0.6} top={180}>
        <Poster p={g} />
      </Stage>
      <div style={{ position: "absolute", left: 60, right: 60, top: 790, height: 130, borderRadius: 24, overflow: "hidden", display: "flex", boxShadow: "0 16px 40px rgba(0,0,0,.15)", background: "#E4E0D7" }}>
        {items.map((it) => (
          <div key={it.r} style={{ width: `${PCT_N[it.r] * ease(frame, at(it.at), at(it.at) + 14, [0, 1])}%`, background: g[it.r], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontWeight: 700, fontSize: 52, color: it.r === "bg" ? DARK : "#fff", overflow: "hidden", borderRight: it.r === "bg" ? "2px solid #DAD5CA" : undefined }}>
            {it.r !== "accent" ? PCT[it.r] : ""}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 960, display: "flex", gap: 18 }}>
        {items.map((it) => {
          const s = spring({ frame: frame - at(it.at), fps: 30, config: { damping: 12, stiffness: 180 } });
          return (
            <div key={it.r} style={{ flex: 1, background: "#fff", borderRadius: 20, padding: "18px 16px", boxShadow: "0 8px 20px rgba(0,0,0,.08)", opacity: s, translate: `0px ${(1 - s) * 40}px` }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: g[it.r], border: "2px solid rgba(0,0,0,.08)" }} />
              <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 54, color: DARK, marginTop: 10, lineHeight: 1 }}>{PCT[it.r]}</div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, color: DARK, marginTop: 6 }}>{it.name}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 22, color: "#8A857B", marginTop: 4 }}>{g[it.r].toUpperCase()}</div>
            </div>
          );
        })}
      </div>
      {items.map((it) => <Pop key={it.r} at={at(it.at)} vol={0.4} />)}
    </>
  );
};
const PCT_N: Record<Role, number> = { bg: 60, panel: 30, accent: 10 };

// ---------------- 9. Lỗi hay gặp ----------------
export const Mistake: React.FC<StepProps> = ({ pal, vd }) => {
  const frame = useCurrentFrame();
  const back = 8 + 0.62 * vd;
  const t = frame < back ? ease(frame, 6, 22, [0, 1]) : ease(frame, back, back + 14, [1, 0]);
  const p = mix(pal.good, pal.overuse, t);
  const x = spring({ frame: frame - 20, fps: 30, config: { damping: 9, stiffness: 220 } }) * (frame < back ? 1 : ease(frame, back, back + 6, [1, 0]));
  const ok = spring({ frame: frame - back - 10, fps: 30, config: { damping: 10, stiffness: 200 } });
  return (
    <>
      <Tiny />
      <Header num="✕" numColor="#E53935" title="LỖI HAY GẶP" sub="lạm dụng màu nhấn" />
      <Stage>
        <Poster p={p} />
        {x > 0.01 && (
          <div style={{ position: "absolute", left: 120, top: 300, width: 480, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, scale: String(x), rotate: "-6deg" }}>
            <div style={{ width: 200, height: 200, borderRadius: 100, background: "#E53935", display: "flex", alignItems: "center", justifyContent: "center", border: "8px solid #fff", boxShadow: "0 14px 30px rgba(0,0,0,.3)" }}>
              <Ico name="x" size={130} stroke={3.2} />
            </div>
            <div style={{ background: "#E53935", color: "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: 42, padding: "6px 22px", borderRadius: 10 }}>MÀU NHẤN KHẮP NƠI</div>
          </div>
        )}
        {ok > 0.01 && (
          <div style={{ position: "absolute", left: 410, top: 770, display: "flex", alignItems: "center", gap: 12, scale: String(ok) }}>
            <div style={{ width: 96, height: 96, borderRadius: 48, background: "#2E8B3E", display: "flex", alignItems: "center", justifyContent: "center", border: "6px solid #fff", boxShadow: "0 10px 24px rgba(0,0,0,.3)" }}>
              <Ico name="check" size={56} stroke={3.4} />
            </div>
          </div>
        )}
      </Stage>
      {ok > 0.01 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1196, display: "flex", justifyContent: "center", scale: String(ok) }}>
          <div style={{ background: "#2E8B3E", color: "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: 40, padding: "8px 26px", borderRadius: 12 }}>CHỈ DÙNG Ở NÚT BẤM</div>
        </div>
      )}
      <Pop at={20} vol={0.5} />
      <Pop at={back + 10} vol={0.5} />
    </>
  );
};

// ---------------- 10. Vòng màu ----------------
export const Wheel: React.FC<StepProps> = ({ pal, vd }) => {
  const frame = useCurrentFrame();
  const g = pal.good;
  const at = (t: number) => 8 + t * vd;
  const R = 270;
  const cx = CW / 2;
  const cy = 560;
  const hp = hexToHsv(g.panel).h;
  const ha = hexToHsv(g.accent).h;
  const accHue = interpolate(frame, [at(0.3), at(0.55)], [ha + 120, ha], { ...clamp });
  const pos = (h: number) => ({ x: cx + R * Math.sin((h * Math.PI) / 180), y: cy - R * Math.cos((h * Math.PI) / 180) });
  const a = pos(hp);
  const b = pos(accHue);
  const s1 = useIn(at(0.1));
  const s2 = useIn(at(0.3));
  const line = ease(frame, at(0.55), at(0.7), [0, 1]);
  const demo = useIn(at(0.72), 13, 160);
  const ring = "conic-gradient(from 0deg, hsl(0 90% 55%), hsl(60 90% 55%), hsl(120 90% 50%), hsl(180 90% 50%), hsl(240 90% 60%), hsl(300 90% 55%), hsl(360 90% 55%))";
  const Knob: React.FC<{ x: number; y: number; c: string; s: number }> = ({ x, y, c, s }) => (
    <div style={{ position: "absolute", left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: 34, background: c, border: "7px solid #fff", boxShadow: "0 6px 16px rgba(0,0,0,.35)", scale: String(s) }} />
  );
  return (
    <>
      <Tiny />
      <Header title="CHỌN MÀU NHẤN" sub="dùng vòng màu" />
      <div style={{ position: "absolute", left: cx - R - 50, top: cy - R - 50, width: (R + 50) * 2, height: (R + 50) * 2, borderRadius: "50%", background: ring, WebkitMask: "radial-gradient(circle, transparent 59%, #000 60%)", mask: "radial-gradient(circle, transparent 59%, #000 60%)", opacity: ease(frame, 0, 10, [0, 1]), rotate: `${ease(frame, 0, 20, [-40, 0])}deg` }} />
      <svg width={CW} height={CH} style={{ position: "absolute", inset: 0 }}>
        <line x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * line} y2={a.y + (b.y - a.y) * line} stroke={DARK} strokeWidth={5} strokeDasharray="14 10" />
      </svg>
      <Knob x={a.x} y={a.y} c={g.panel} s={s1} />
      <Knob x={b.x} y={b.y} c={`hsl(${accHue} 100% 54%)`} s={s2} />
      <div style={{ position: "absolute", left: a.x + (a.x < cx ? -250 : 50), top: a.y - 26, fontFamily: BODY, fontWeight: 800, fontSize: 28, color: DARK, opacity: s1 }}>Màu phụ</div>
      <div style={{ position: "absolute", left: b.x + (b.x < cx ? -230 : 50), top: b.y - 26, fontFamily: BODY, fontWeight: 800, fontSize: 28, color: DARK, opacity: s2 }}>Màu nhấn</div>
      <div style={{ position: "absolute", left: cx - 150, top: cy - 50, width: 300, textAlign: "center", fontFamily: HEAD, fontWeight: 700, fontSize: 40, lineHeight: 1.15, color: DARK, opacity: line }}>
        ĐỐI DIỆN
        <br />
        <span style={{ color: C.orange }}>= TƯƠNG PHẢN</span>
      </div>
      <div style={{ position: "absolute", left: 120, right: 120, top: 960, height: 200, borderRadius: 28, background: g.panel, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", scale: String(demo), boxShadow: "0 16px 40px rgba(0,0,0,.18)" }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 44, color: g.card, lineHeight: 1.05 }}>
          KHÓA HỌC
          <br />
          THIẾT KẾ
        </div>
        <div style={{ background: g.accent, color: "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: 34, padding: "18px 30px", borderRadius: 40 }}>ĐĂNG KÝ NGAY</div>
      </div>
      <Pop at={at(0.1)} vol={0.35} />
      <Pop at={at(0.55)} vol={0.45} />
    </>
  );
};

// ---------------- 11. Ví dụ ứng dụng ----------------
const EX: { kind: "poster" | "app" | "post"; label: string; t: number; p: Palette }[] = [
  { kind: "poster", label: "Poster", t: 0.38, p: { bg: "#12172F", panel: "#3B4A9C", ink: "#FFFFFF", accent: "#FFB703", card: "#FFFFFF", deco: "#3B4A9C" } },
  { kind: "app", label: "Ứng dụng", t: 0.55, p: { bg: "#F5F7F6", panel: "#1F7A5A", ink: "#1E2A26", accent: "#FF6B57", card: "#FFFFFF", deco: "#D4ECE2" } },
  { kind: "post", label: "Bài đăng", t: 0.75, p: { bg: "#FFF6E9", panel: "#2B2D42", ink: "#2B2D42", accent: "#E63946", card: "#FFFFFF", deco: "#E9DCC8" } },
];
export const Examples: React.FC<StepProps> = ({ vd }) => {
  const frame = useCurrentFrame();
  const at = (t: number) => 4 + t * vd - 14;
  const S = 0.86;
  return (
    <>
      <Tiny />
      <Header title="ỨNG DỤNG" sub="mọi loại thiết kế" />
      <div style={{ position: "absolute", left: 30, right: 30, top: 300, display: "flex", justifyContent: "space-between" }}>
        {EX.map((e) => {
          const s = spring({ frame: frame - at(e.t), fps: 30, config: { damping: 12, stiffness: 170 } });
          return (
            <div key={e.kind} style={{ width: 300 * S, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: s, translate: `0px ${(1 - s) * 80}px` }}>
              <div style={{ width: 300 * S, height: 480 * S }}>
                <div style={{ scale: String(S), transformOrigin: "0 0" }}>
                  <MiniArt kind={e.kind} p={e.p} />
                </div>
              </div>
              <RatioBar p={e.p} w={300 * S} g={ease(frame, at(e.t) + 8, at(e.t) + 24, [0, 1])} />
              <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 42, color: DARK }}>{e.label.toUpperCase()}</div>
            </div>
          );
        })}
      </div>
      {EX.map((e) => <Pop key={e.kind} at={at(e.t)} vol={0.35} />)}
    </>
  );
};

// ---------------- 12. Kết ----------------
export const Outro: React.FC<StepProps & { sources: string[] }> = ({ vd, sources }) => {
  const frame = useCurrentFrame();
  const a = useIn(0, 12, 160);
  const b = useIn(8, 14, 170);
  const clickAt = 8 + 0.62 * vd;
  const followed = frame > clickAt;
  const btn = useIn(16, 12, 180);
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Img src={staticFile("logo-d24.png")} style={{ width: 360, scale: String(a) }} />
        <div style={{ marginTop: 60, fontFamily: HEAD, fontWeight: 700, fontSize: 108, color: DARK, lineHeight: 1.02, textAlign: "center", opacity: b, translate: `0px ${(1 - b) * 40}px` }}>
          <div>LƯU LẠI</div>
          <div style={{ display: "inline-block", marginTop: 12, background: "#FFE500", padding: "4px 22px" }}>ĐỂ DÙNG NHÉ!</div>
        </div>
        <div style={{ marginTop: 30, fontFamily: BODY, fontWeight: 700, fontSize: 36, color: "#6B675F", opacity: b }}>Mỗi ngày một mẹo thiết kế</div>
        <div style={{ position: "relative", marginTop: 56, scale: String(btn) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: followed ? "#E4E0D7" : C.orange, color: followed ? DARK : "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: 44, padding: "18px 44px", borderRadius: 50, scale: String(1 - 0.08 * interpolate(frame, [clickAt - 3, clickAt, clickAt + 6], [0, 1, 0], clamp)) }}>
            <Ico name={followed ? "check" : "follow"} size={40} color={followed ? DARK : "#fff"} />
            {followed ? "ĐÃ THEO DÕI" : "THEO DÕI DESIGN24"}
          </div>
          <Cursor x={ease(frame, clickAt - 22, clickAt - 4, [520, 330])} y={ease(frame, clickAt - 22, clickAt - 4, [220, 60])} press={interpolate(frame, [clickAt - 3, clickAt, clickAt + 6], [0, 1, 0], clamp)} />
        </div>
        <div style={{ marginTop: 70, display: "flex", gap: 30, fontFamily: BODY, fontWeight: 700, fontSize: 28, color: DARK, opacity: ease(frame, 20, 32, [0, 1]) }}>
          <span>🌐 {CONTACT.website}</span>
          <span>☎ {CONTACT.zalo}</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 50, right: 50, bottom: 40, textAlign: "center", fontFamily: BODY, fontWeight: 500, fontSize: 20, color: "#9A958B" }}>Tham khảo: {sources.join(" · ")}</div>
      <Pop at={clickAt} vol={0.55} />
    </>
  );
};
