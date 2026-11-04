import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { FONT } from "../brand";
import { Ico } from "./kit";

// Bản thiết kế "trang web khóa học" vẽ bằng code, dùng làm vật mẫu xuyên suốt video về màu sắc.
// Mỗi phần tử gắn vai trò màu: bg (60%), panel (30%), accent (10%) để tô sáng khi giảng giải.

export type Palette = { bg: string; panel: string; ink: string; accent: string; card: string; deco: string };
export type Role = "bg" | "panel" | "accent";

export const W = 820;
export const H = 1040;

// Toạ độ trung tâm từng vùng (để máy quay zoom vào)
export const FOCUS: Record<Role, { x: number; y: number }> = {
  bg: { x: W / 2, y: H / 2 },
  panel: { x: W / 2, y: 330 },
  accent: { x: 206, y: 445 },
};

export const mixPalette = (a: Palette, b: Palette, p: number): Palette => {
  const k = Object.keys(a) as (keyof Palette)[];
  return Object.fromEntries(k.map((x) => [x, interpolateColors(p, [0, 1], [a[x], b[x]])])) as Palette;
};

export const LandingMock: React.FC<{ p: Palette; highlight?: Role | null; hl?: number; title?: [string, string]; button?: string }> = ({
  p,
  highlight = null,
  hl = 1,
  title = ["Khóa học", "Thiết kế đồ họa"],
  button = "Đăng ký ngay",
}) => {
  const frame = useCurrentFrame();
  // Phần tử không thuộc vai trò đang giảng thì mờ và xám đi
  const dim = (role: Role | "none"): React.CSSProperties =>
    highlight && role !== highlight ? { filter: `grayscale(${hl}) brightness(${1 + 0.1 * hl})`, opacity: 1 - 0.75 * hl } : {};
  const ring = (role: Role, r: number): React.CSSProperties =>
    highlight === role
      ? { outline: `6px dashed rgba(255,127,20,${0.9 * hl})`, outlineOffset: 8 + Math.sin(frame / 6) * 3, borderRadius: r }
      : {};
  return (
    <div style={{ position: "relative", width: W, height: H, borderRadius: 36, overflow: "hidden", background: p.bg, fontFamily: FONT, boxShadow: "0 40px 90px rgba(0,0,0,.45)" }}>
      {/* nền 60% được tô viền khi giảng */}
      {highlight === "bg" && <div style={{ position: "absolute", inset: 10, border: `8px dashed rgba(255,127,20,${0.9 * hl})`, borderRadius: 30, zIndex: 5 }} />}
      {/* thanh menu */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 96, background: p.panel, display: "flex", alignItems: "center", gap: 22, padding: "0 40px", boxSizing: "border-box", ...dim("panel"), ...ring("panel", 0) }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: p.card, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 24, color: p.panel }}>24</div>
        <div style={{ flex: 1 }} />
        {["Khóa học", "Dự án", "Liên hệ"].map((m) => (
          <div key={m} style={{ color: p.card, fontSize: 24, fontWeight: 700, opacity: 0.9 }}>{m}</div>
        ))}
      </div>
      {/* tiêu đề */}
      <div style={{ position: "absolute", left: 56, top: 140, color: p.ink, ...dim("panel") }}>
        <div style={{ fontSize: 40, fontWeight: 700, opacity: 0.75 }}>{title[0]}</div>
        <div style={{ fontSize: 76, fontWeight: 900, letterSpacing: -2, lineHeight: 1.02, width: 700 }}>{title[1]}</div>
        <div style={{ marginTop: 18, width: 520, height: 16, borderRadius: 8, background: p.ink, opacity: 0.25 }} />
        <div style={{ marginTop: 12, width: 440, height: 16, borderRadius: 8, background: p.ink, opacity: 0.25 }} />
      </div>
      {/* nút bấm: màu nhấn */}
      <div style={{ position: "absolute", left: 56, top: 400, width: 300, height: 90, borderRadius: 45, background: p.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 30, fontWeight: 800, boxShadow: `0 14px 30px ${p.accent}66`, ...dim("accent"), ...ring("accent", 45) }}>
        {button}
        <Ico name="send" size={28} />
      </div>
      <div style={{ position: "absolute", left: 386, top: 425, fontSize: 26, fontWeight: 700, color: p.ink, opacity: 0.6, ...dim("panel") }}>Khai giảng 15/11</div>
      {/* minh hoạ lớn: màu phụ */}
      <div style={{ position: "absolute", left: 40, top: 540, width: W - 80, height: 320, borderRadius: 30, background: p.panel, overflow: "hidden", ...dim("panel"), ...ring("panel", 30) }}>
        <div style={{ position: "absolute", right: -60, top: -80, width: 300, height: 300, borderRadius: "50%", background: p.deco, opacity: 0.35 }} />
        <div style={{ position: "absolute", left: 60, bottom: -60, width: 220, height: 220, borderRadius: "50%", background: p.deco, opacity: 0.25 }} />
        <div style={{ position: "absolute", left: 250, top: 70, width: 260, height: 180, borderRadius: 20, background: p.card, boxShadow: "0 20px 40px rgba(0,0,0,.25)", padding: 22, boxSizing: "border-box" }}>
          <div style={{ width: "70%", height: 16, borderRadius: 8, background: p.panel, opacity: 0.8 }} />
          <div style={{ marginTop: 14, width: "90%", height: 12, borderRadius: 6, background: p.panel, opacity: 0.25 }} />
          <div style={{ marginTop: 10, width: "80%", height: 12, borderRadius: 6, background: p.panel, opacity: 0.25 }} />
          <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ width: 52, height: 52, borderRadius: 12, background: p.deco }} />)}
          </div>
        </div>
      </div>
      {/* ngôi sao nhỏ: màu nhấn */}
      <div style={{ position: "absolute", left: 590, top: 580, width: 84, height: 84, borderRadius: "50%", background: p.accent, display: "flex", alignItems: "center", justifyContent: "center", rotate: `${frame * 1.5}deg`, ...dim("accent"), ...ring("accent", 42) }}>
        <Ico name="sparkles" size={46} />
      </div>
      {/* hàng thẻ: nền trung tính */}
      <div style={{ position: "absolute", left: 40, top: 890, width: W - 80, display: "flex", gap: 20, ...dim("bg") }}>
        {["palette", "type", "grid"].map((ic) => (
          <div key={ic} style={{ flex: 1, height: 120, borderRadius: 22, background: p.card, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", boxShadow: "0 8px 20px rgba(0,0,0,.08)" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: p.deco, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ico name={ic} size={30} color={p.panel} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 12, borderRadius: 6, background: p.ink, opacity: 0.5 }} />
              <div style={{ marginTop: 10, height: 10, width: "70%", borderRadius: 5, background: p.ink, opacity: 0.2 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Ba tác phẩm nhỏ minh họa cùng quy tắc trên các loại sản phẩm khác nhau
export const MiniArt: React.FC<{ kind: "poster" | "app" | "post"; p: Palette }> = ({ kind, p }) => {
  const box: React.CSSProperties = { position: "relative", width: 300, height: 480, borderRadius: 26, overflow: "hidden", background: p.bg, fontFamily: FONT, boxShadow: "0 24px 50px rgba(0,0,0,.4)" };
  if (kind === "poster")
    return (
      <div style={box}>
        <div style={{ position: "absolute", right: -70, top: -40, width: 260, height: 260, borderRadius: "50%", background: p.panel }} />
        <div style={{ position: "absolute", left: -50, bottom: 70, width: 200, height: 200, borderRadius: 40, rotate: "20deg", background: p.panel, opacity: 0.85 }} />
        <div style={{ position: "absolute", left: 26, top: 200, color: p.ink, fontSize: 52, fontWeight: 900, lineHeight: 0.95, letterSpacing: -2 }}>DESIGN<br />WEEK</div>
        <div style={{ position: "absolute", left: 26, top: 320, background: p.accent, color: "#fff", fontSize: 22, fontWeight: 800, padding: "8px 16px", borderRadius: 10 }}>20.11.2026</div>
        <div style={{ position: "absolute", left: 26, bottom: 26, color: p.ink, fontSize: 18, fontWeight: 700, opacity: 0.7 }}>Triển lãm thiết kế</div>
      </div>
    );
  if (kind === "app")
    return (
      <div style={box}>
        <div style={{ height: 150, background: p.panel, padding: 22, boxSizing: "border-box", color: "#fff" }}>
          <div style={{ fontSize: 18, opacity: 0.8 }}>Xin chào,</div>
          <div style={{ fontSize: 30, fontWeight: 900 }}>Lịch học</div>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ margin: "18px 20px 0", height: 70, borderRadius: 16, background: p.card, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", boxShadow: "0 4px 12px rgba(0,0,0,.06)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: p.deco }} />
            <div style={{ flex: 1, height: 12, borderRadius: 6, background: p.ink, opacity: 0.35 }} />
          </div>
        ))}
        <div style={{ position: "absolute", right: 22, bottom: 22, width: 72, height: 72, borderRadius: "50%", background: p.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, color: "#fff", fontWeight: 600 }}>+</div>
      </div>
    );
  return (
    <div style={box}>
      <div style={{ position: "absolute", left: 22, right: 22, top: 22, height: 250, borderRadius: 18, background: p.panel }} />
      <div style={{ position: "absolute", left: 22, top: 300, color: p.ink, fontSize: 34, fontWeight: 900, lineHeight: 1.05 }}>
        5 lỗi <span style={{ color: p.accent }}>font chữ</span><br />cần tránh
      </div>
      <div style={{ position: "absolute", left: 22, bottom: 26, width: 140, height: 12, borderRadius: 6, background: p.ink, opacity: 0.3 }} />
    </div>
  );
};

// Thanh tỉ lệ 60-30-10 bên dưới mỗi ví dụ
export const RatioBar: React.FC<{ p: Palette; w: number; g?: number }> = ({ p, w, g = 1 }) => (
  <div style={{ width: w, height: 30, borderRadius: 15, overflow: "hidden", display: "flex", border: "3px solid rgba(255,255,255,.8)" }}>
    {[
      [p.bg, 0.6],
      [p.panel, 0.3],
      [p.accent, 0.1],
    ].map(([c, f], i) => (
      <div key={i} style={{ width: w * (f as number) * g, background: c as string }} />
    ))}
  </div>
);
