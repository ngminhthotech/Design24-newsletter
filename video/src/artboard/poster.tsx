import React from "react";
import { interpolateColors } from "remotion";
import { Ico } from "../kienthuc/kit";
import { BODY, HEAD, SERIF } from "./fonts";

// Poster "Khóa học thiết kế đồ họa" vẽ bằng code: vật mẫu được sửa trực tiếp trên bảng vẽ.
// Mỗi phần tử gắn một vai trò màu: bg (60%), panel (30%), accent (10%).

export type Palette = { bg: string; panel: string; ink: string; accent: string; card: string; deco: string };
export type Role = "bg" | "panel" | "accent";

export const PW = 720;
export const PH = 960;

// Khóa màu thuộc mỗi vai trò (để tô lại từng phần)
export const ROLE_KEYS: Record<Role, (keyof Palette)[]> = {
  bg: ["bg"],
  panel: ["panel", "ink", "card", "deco"],
  accent: ["accent"],
};

// Vùng của từng vai trò trên poster (để vẽ khung nét đứt và zoom máy quay)
export const REGION: Record<Role, { x: number; y: number; w: number; h: number; r: number }> = {
  bg: { x: 0, y: 0, w: PW, h: PH, r: 18 },
  panel: { x: 0, y: 0, w: PW, h: 470, r: 18 },
  accent: { x: 56, y: 800, w: 330, h: 96, r: 48 },
};

// Điểm bấm của con trỏ khi chọn màu cho từng vai trò
export const CLICK: Record<Role, { x: number; y: number }> = {
  bg: { x: 520, y: 700 },
  panel: { x: 560, y: 120 },
  accent: { x: 220, y: 848 },
};

export const applyRole = (base: Palette, target: Palette, role: Role): Palette => {
  const out = { ...base };
  ROLE_KEYS[role].forEach((k) => (out[k] = target[k]));
  return out;
};

export const mix = (a: Palette, b: Palette, t: number): Palette => {
  const k = Object.keys(a) as (keyof Palette)[];
  return Object.fromEntries(k.map((x) => [x, interpolateColors(t, [0, 1], [a[x], b[x]])])) as Palette;
};

// Các "núm chỉnh" của poster, để minh họa nhiều chủ đề (khoảng cách, căn lề, phân cấp, phông chữ...).
// Số thì nội suy mượt khi chuyển từ bản sai sang bản đúng; font/align đổi ở giữa chuyển cảnh.
export type PosterText = { kicker: string; title: string; sub: string; items: string[]; button: string; tag?: string; tagBig?: string; site?: string };
export type PosterFont = "oswald" | "sans" | "serif" | "mixed";
export type PosterStyle = {
  palette?: string | Palette; // tên bảng màu trong `palettes` của JSON hoặc bảng màu đầy đủ
  font?: PosterFont;
  align?: "left" | "center";
  gap?: number; // hệ số khoảng cách dọc phần nội dung (1 = chuẩn, 0.6 = chật)
  pad?: number; // lề trái (px), chuẩn 56
  head?: number; // hệ số cỡ tiêu đề (1 = chuẩn)
  body?: number; // hệ số cỡ chữ nội dung
  track?: number; // giãn chữ tiêu đề (px)
  lead?: number; // giãn dòng tiêu đề (1.0 chuẩn)
  mis?: number; // 0..1: mức lệch lề ngẫu nhiên (minh họa căn lề sai)
  grid?: number; // 0..1: hiện lưới cột
  noise?: number; // 0..1: thêm chi tiết thừa (minh họa thiết kế rối)
  text?: Partial<PosterText>;
};

export const DEFAULT_TEXT: PosterText = {
  kicker: "KHÓA HỌC",
  title: "THIẾT KẾ\nĐỒ HỌA",
  sub: "Từ con số 0 đến tự tin nhận dự án",
  items: ["12 buổi thực hành", "Học cùng chuyên gia", "Làm dự án thật"],
  button: "ĐĂNG KÝ NGAY",
  tag: "ƯU ĐÃI",
  tagBig: "-30%",
  site: "design24.vn",
};

const FONTS: Record<PosterFont, { head: string; kicker: string; sub: string; item: string; button: string }> = {
  oswald: { head: HEAD, kicker: HEAD, sub: BODY, item: BODY, button: HEAD },
  sans: { head: BODY, kicker: BODY, sub: BODY, item: BODY, button: BODY },
  serif: { head: SERIF, kicker: BODY, sub: BODY, item: BODY, button: BODY },
  mixed: { head: SERIF, kicker: "'JetBrains Mono', monospace", sub: HEAD, item: "Inter, sans-serif", button: "'Courier 10 Pitch', 'FreeMono', monospace" },
};
const MIS = [0, 34, -22, 48, 14, -30, 26];

export const Poster: React.FC<{ p: Palette; shadow?: boolean; st?: PosterStyle }> = ({ p, shadow = true, st = {} }) => {
  const f = FONTS[st.font ?? "oswald"];
  const center = st.align === "center";
  const g = st.gap ?? 1;
  const pad = st.pad ?? 56;
  const hs = st.head ?? 1;
  const bs = st.body ?? 1;
  const mis = st.mis ?? 0;
  const tx = { ...DEFAULT_TEXT, ...(st.text ?? {}) };
  const y0 = 500;
  const L = (i: number, w = 0): React.CSSProperties => (center ? { left: 0, width: PW, textAlign: "center", translate: `${MIS[i] * mis}px 0px` } : { left: pad + MIS[i] * mis, width: w || undefined });
  const serif = st.font === "serif" || st.font === "mixed";
  return (
    <div style={{ position: "relative", width: PW, height: PH, borderRadius: 18, overflow: "hidden", background: p.bg, boxShadow: shadow ? "0 30px 60px rgba(0,0,0,.18)" : undefined }}>
      {/* khối màu phụ */}
      <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: 470, background: p.panel, borderBottomRightRadius: center ? 0 : 160, overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -90, top: -90, width: 380, height: 380, borderRadius: "50%", background: p.deco, opacity: 0.55 }} />
        <div style={{ position: "absolute", right: 120, top: 250, display: "grid", gridTemplateColumns: "repeat(5, 14px)", gap: 14, opacity: 0.4 }}>
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: p.card }} />
          ))}
        </div>
        <div style={{ position: "absolute", top: 62, color: p.card, ...L(0) }}>
          <div style={{ fontFamily: f.kicker, fontWeight: 500, fontSize: 40 * Math.min(1.2, Math.max(0.8, bs)), letterSpacing: 6 }}>{tx.kicker}</div>
          <div style={{ fontFamily: f.head, fontWeight: 700, fontSize: (serif ? 112 : 138) * hs, lineHeight: st.lead ?? (serif ? 1.08 : 1.0), letterSpacing: st.track ?? -1, marginTop: 6, whiteSpace: "pre-line", translate: `${MIS[1] * mis * 0.6}px 0px` }}>
            {tx.title}
          </div>
        </div>
      </div>
      {/* nhãn: màu nhấn */}
      {tx.tagBig && (
        <div style={{ position: "absolute", left: 530, top: 390, width: 150, height: 150, borderRadius: "50%", background: p.accent, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", rotate: "-12deg", boxShadow: "0 12px 24px rgba(0,0,0,.18)" }}>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 22 }}>{tx.tag}</div>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 56, lineHeight: 1 }}>{tx.tagBig}</div>
        </div>
      )}
      {/* nội dung trên nền */}
      <div style={{ position: "absolute", top: y0 + 20 * g, fontFamily: f.sub, fontWeight: 700, fontSize: 32 * bs, lineHeight: 1.3, color: p.ink, ...L(2, center ? 0 : 460) }}>{tx.sub}</div>
      {tx.items.map((t, i) => (
        <div key={i} style={{ position: "absolute", top: y0 + 120 * g + i * 58 * g, display: "flex", alignItems: "center", justifyContent: center ? "center" : undefined, gap: 16, fontFamily: f.item, fontWeight: 500, fontSize: 26 * bs, color: p.ink, ...L(3 + i) }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: p.panel, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Ico name={["book", "follow", "briefcase", "check"][i % 4]} size={22} color={p.card} />
          </div>
          {t}
        </div>
      ))}
      {/* nút bấm: màu nhấn */}
      <div style={{ position: "absolute", left: center ? (PW - 330) / 2 : pad + MIS[6] * mis, top: y0 + 300 * g, width: 330, height: 96, borderRadius: 48, background: p.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: f.button, fontWeight: 700, fontSize: 36 * Math.min(1.15, bs), letterSpacing: 1 }}>
        {tx.button}
        <Ico name="send" size={28} />
      </div>
      {!center && <div style={{ position: "absolute", right: 50, top: y0 + 336 * g, fontFamily: BODY, fontWeight: 700, fontSize: 24, color: p.ink, opacity: 0.65 }}>{tx.site}</div>}
      {/* chi tiết thừa */}
      {(st.noise ?? 0) > 0.01 && (
        <div style={{ position: "absolute", inset: 0, opacity: st.noise, pointerEvents: "none" }}>
          {[
            [470, 600, "★", 70, "#E53935"], [600, 700, "NEW!", 34, "#43A047"], [60, 440, "HOT", 30, "#8E24AA"], [380, 900, "☺", 56, "#1E88E5"], [520, 860, "SALE", 30, "#E53935"],
          ].map(([x, y, t, fs, c], i) => (
            <div key={i} style={{ position: "absolute", left: x as number, top: y as number, fontFamily: HEAD, fontWeight: 700, fontSize: fs as number, color: c as string, rotate: `${(i % 2 ? 1 : -1) * 14}deg`, border: `4px solid ${c}`, padding: "0 10px", borderRadius: 10, background: "#fff" }}>{t}</div>
          ))}
        </div>
      )}
      {/* lưới cột */}
      {(st.grid ?? 0) > 0.01 && (
        <div style={{ position: "absolute", inset: 0, opacity: st.grid, display: "flex", gap: 24, padding: `0 ${pad}px`, pointerEvents: "none" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ flex: 1, background: "rgba(255,64,129,.12)", borderLeft: "2px solid rgba(255,64,129,.6)", borderRight: "2px solid rgba(255,64,129,.6)" }} />
          ))}
        </div>
      )}
    </div>
  );
};

// Nội suy giữa hai kiểu poster: số chạy mượt, font/căn lề/chữ đổi khi t >= 0.5
const NUM: (keyof PosterStyle)[] = ["gap", "pad", "head", "body", "track", "lead", "mis", "grid", "noise"];
const DEF: Partial<Record<keyof PosterStyle, number>> = { gap: 1, pad: 56, head: 1, body: 1, track: -1, mis: 0, grid: 0, noise: 0 };
export const lerpStyle = (a: PosterStyle, b: PosterStyle, t: number): PosterStyle => {
  const out: PosterStyle = { ...(t < 0.5 ? a : b) };
  for (const k of NUM) {
    const va = (a[k] as number | undefined) ?? DEF[k];
    const vb = (b[k] as number | undefined) ?? DEF[k];
    if (va === undefined || vb === undefined) continue;
    (out as Record<string, unknown>)[k] = va + (vb - va) * t;
  }
  return out;
};

// ---------- màu ----------
export const hexToHsv = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
};

// Bảng chọn màu kiểu phần mềm thiết kế: ô bão hòa/độ sáng, thanh sắc độ, ô mã màu
export const Picker: React.FC<{ from: string; to: string; t: number; label?: string }> = ({ from, to, t, label }) => {
  const a = hexToHsv(from);
  const b = hexToHsv(to);
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const h = (a.h + dh * t + 360) % 360;
  const s = a.s + (b.s - a.s) * t;
  const v = a.v + (b.v - a.v) * t;
  const cur = interpolateColors(t, [0, 1], [from, to]);
  const W = 300;
  return (
    <div style={{ width: W, background: "#fff", borderRadius: 22, padding: 16, boxShadow: "0 24px 60px rgba(0,0,0,.28)", fontFamily: BODY }}>
      {label && <div style={{ fontWeight: 800, fontSize: 20, color: "#222", marginBottom: 10 }}>{label}</div>}
      <div style={{ position: "relative", width: W - 32, height: 190, borderRadius: 12, background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${h}deg 100% 50%))` }}>
        <div style={{ position: "absolute", left: s * (W - 32) - 13, top: (1 - v) * 190 - 13, width: 26, height: 26, borderRadius: 13, border: "4px solid #fff", boxShadow: "0 0 0 2px rgba(0,0,0,.35)", background: cur }} />
      </div>
      <div style={{ position: "relative", marginTop: 16, height: 18, borderRadius: 9, background: "linear-gradient(90deg, red, #ff0, lime, cyan, blue, #f0f, red)" }}>
        <div style={{ position: "absolute", left: (h / 360) * (W - 32) - 13, top: -4, width: 26, height: 26, borderRadius: 13, border: "4px solid #fff", boxShadow: "0 0 0 2px rgba(0,0,0,.35)", background: `hsl(${h}deg 100% 50%)` }} />
      </div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: cur, border: "2px solid rgba(0,0,0,.1)" }} />
        <div style={{ flex: 1, height: 44, borderRadius: 10, background: "#F1F1F1", display: "flex", alignItems: "center", padding: "0 14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 24, color: "#222" }}>
          {(t < 0.5 ? from : to).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

// Con trỏ chuột; `press` 0..1 làm con trỏ nhấn xuống
export const Cursor: React.FC<{ x: number; y: number; press?: number; size?: number }> = ({ x, y, press = 0, size = 54 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", left: x - size * 0.18, top: y - size * 0.1, scale: String(1 - 0.18 * press), filter: "drop-shadow(0 4px 6px rgba(0,0,0,.35))", zIndex: 20 }}>
    <path d="M4 2l16 11.5-7 1.2 4.2 7.3-3 1.7-4.2-7.4L5 21z" fill="#111" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);
