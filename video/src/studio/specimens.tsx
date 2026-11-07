import React from "react";
import { Img, interpolate, interpolateColors, staticFile } from "remotion";
import { BODY, HEAD, SERIF } from "../artboard/fonts";

// Thư viện "mẫu thiết kế" dùng làm ví dụ minh họa: poster sự kiện, bài đăng quán cà phê, bài bán hàng,
// màn hình ứng dụng, trang web, ảnh bìa YouTube. Mỗi mẫu có ảnh thật (CC0) và các "núm chỉnh" để
// biến từ bản sai sang bản đúng (màu, lớp phủ ảnh, phông, cỡ chữ, lệch lề, chi tiết thừa...).

export type Kind = "event" | "cafe" | "sale" | "app" | "landing" | "thumb";
export type Pal = { bg: string; ink: string; sub: string; accent: string; accentInk: string };
export type Knobs = {
  pal?: Partial<Pal>;
  overlay?: number; // 0..1 lớp phủ tối sau chữ trên ảnh
  font?: "head" | "sans" | "serif" | "mixed";
  align?: "left" | "center";
  head?: number; // hệ số cỡ tiêu đề
  body?: number; // hệ số cỡ chữ nội dung
  gap?: number; // hệ số khoảng cách
  pad?: number; // hệ số lề
  mis?: number; // 0..1 lệch lề
  noise?: number; // 0..1 chi tiết thừa
  btn?: number; // hệ số cỡ nút
};
export type Spec = { kind: Kind; photo?: string; pal?: Partial<Pal>; text?: Record<string, string> } & Knobs;

export const SIZE: Record<Kind, [number, number]> = {
  event: [720, 960],
  cafe: [800, 800],
  sale: [800, 1000],
  app: [430, 880],
  landing: [1280, 800],
  thumb: [1280, 720],
};

const DEF_PAL: Record<Kind, Pal> = {
  event: { bg: "#120B2E", ink: "#FFFFFF", sub: "#D9D3F5", accent: "#FF4D6D", accentInk: "#FFFFFF" },
  cafe: { bg: "#F4ECE1", ink: "#3B2416", sub: "#7A5A45", accent: "#C8553D", accentInk: "#FFFFFF" },
  sale: { bg: "#FFFFFF", ink: "#1D2B24", sub: "#56665D", accent: "#1F7A4D", accentInk: "#FFFFFF" },
  app: { bg: "#FFFFFF", ink: "#14182B", sub: "#6B7088", accent: "#3D5AFE", accentInk: "#FFFFFF" },
  landing: { bg: "#F7F7F2", ink: "#111827", sub: "#4B5563", accent: "#FF6B2C", accentInk: "#FFFFFF" },
  thumb: { bg: "#0E0E10", ink: "#FFFFFF", sub: "#FFE500", accent: "#FFE500", accentInk: "#111111" },
};

const DEF_TEXT: Record<Kind, Record<string, string>> = {
  event: { kicker: "LIVE MUSIC · 2026", title: "ĐÊM NHẠC\nMÙA HẠ", sub: "20:00 · Thứ Bảy 15/08 · Nhà hát Bến Thành", button: "Đặt vé ngay" },
  cafe: { brand: "MỘC CAFÉ", title: "Latte\nmùa thu", sub: "Thơm béo, ấm áp, pha từ hạt Arabica Cầu Đất", button: "Giảm 20%" },
  sale: { tag: "MỚI", title: "Serum dưỡng ẩm", sub: "Cấp ẩm 72 giờ, dịu nhẹ cho da nhạy cảm", price: "289.000đ", old: "359.000đ", button: "Mua ngay" },
  app: { hello: "Chào buổi sáng, An", title: "Lớp vẽ cuối tuần", sub: "8 buổi · Cơ bản đến nâng cao", button: "Đăng ký học thử" },
  landing: { logo: "nova.", title: "Làm việc gọn hơn,\nmỗi ngày.", sub: "Một nơi cho lịch, ghi chú và việc cần làm của cả nhóm.", button: "Dùng thử miễn phí" },
  thumb: { title: "5 LỖI\nAI CŨNG MẮC", tag: "MỚI" },
};

const lerp = (a: number | undefined, b: number | undefined, d: number, t: number) => interpolate(t, [0, 1], [a ?? d, b ?? d]);
const lerpColor = (a: string | undefined, b: string | undefined, d: string, t: number) => interpolateColors(t, [0, 1], [a ?? d, b ?? d]);

// Trộn hai bộ núm theo t (0 = from, 1 = to). Phông và căn lề đổi ở giữa.
export const blend = (base: Spec, from: Knobs = {}, to: Knobs = {}, t: number): Spec => {
  const dp = { ...DEF_PAL[base.kind], ...base.pal };
  const pal = Object.fromEntries(
    (Object.keys(dp) as (keyof Pal)[]).map((k) => [k, lerpColor(from.pal?.[k] ?? dp[k], to.pal?.[k] ?? dp[k], dp[k], t)]),
  ) as Pal;
  const num = (k: "overlay" | "head" | "body" | "gap" | "pad" | "mis" | "noise" | "btn", d: number) => lerp(from[k] ?? base[k], to[k] ?? base[k], d, t);
  return {
    ...base,
    pal,
    overlay: num("overlay", base.kind === "event" || base.kind === "thumb" ? 0.75 : 0),
    head: num("head", 1),
    body: num("body", 1),
    gap: num("gap", 1),
    pad: num("pad", 1),
    mis: num("mis", 0),
    noise: num("noise", 0),
    btn: num("btn", 1),
    font: (t < 0.5 ? from.font : to.font) ?? base.font ?? "head",
    align: (t < 0.5 ? from.align : to.align) ?? base.align,
  };
};

export const resolvePal = (s: Spec): Pal => ({ ...DEF_PAL[s.kind], ...s.pal });

// Độ tương phản WCAG giữa hai màu
const lum = (c: string) => {
  const m = c.match(/rgba?\(([^)]+)\)/);
  const [r, g, b] = m ? m[1].split(",").slice(0, 3).map((x) => parseFloat(x) / 255) : [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const f = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const fam = (s: Spec, role: "title" | "sub" | "button" | "kicker") => {
  const f = s.font ?? "head";
  if (f === "mixed") return { title: SERIF, sub: "'Comic Sans MS', cursive", button: HEAD, kicker: "monospace" }[role];
  if (role === "sub") return f === "serif" ? SERIF : BODY;
  return { head: HEAD, sans: BODY, serif: SERIF }[f];
};
const photoSrc = (p?: string) => (p ? (p.startsWith("http") ? p : staticFile(p)) : undefined);
const Photo: React.FC<{ src?: string; style?: React.CSSProperties; pos?: string }> = ({ src, style, pos = "center" }) =>
  src ? (
    <Img src={photoSrc(src)!} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, display: "block", ...style }} />
  ) : (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#9AA5B1,#5B6875)", ...style }} />
  );
const lines = (t: string) => t.split("\n").map((l, i) => <div key={i}>{l}</div>);
const MIS = [-34, 22, -16, 28, -8];
const off = (s: Spec, i: number) => `${(s.mis ?? 0) * MIS[i % MIS.length]}px 0px`;

// Chi tiết trang trí thừa (sao, vòng tròn, sticker) để minh họa thiết kế rối mắt
const Noise: React.FC<{ k: number; w: number; h: number }> = ({ k, w, h }) =>
  k <= 0.01 ? null : (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: k }}>
      {[
        [0.08, 0.1, "#FFD400", 70], [0.78, 0.08, "#00D1FF", 90], [0.85, 0.55, "#FF3EA5", 60], [0.05, 0.62, "#7CFF4D", 80], [0.55, 0.88, "#FF8A00", 64],
      ].map(([x, y, c, r], i) => (
        <div key={i} style={{ position: "absolute", left: (x as number) * w, top: (y as number) * h, width: r as number, height: r as number, borderRadius: i % 2 ? "50%" : 8, background: c as string, rotate: `${i * 23}deg`, border: "4px dashed #fff" }} />
      ))}
      <div style={{ position: "absolute", left: w * 0.62, top: h * 0.3, rotate: "-14deg", background: "#FF0", color: "#E00", fontFamily: "'Comic Sans MS', cursive", fontWeight: 700, fontSize: w * 0.045, padding: "6px 14px", border: "4px solid #E00" }}>HOT!!!</div>
    </div>
  );

const Button: React.FC<{ s: Spec; p: Pal; size: number; children: React.ReactNode; full?: boolean }> = ({ s, p, size, children, full }) => (
  <div style={{ display: full ? "flex" : "inline-flex", justifyContent: "center", background: p.accent, color: p.accentInk, fontFamily: fam(s, "button"), fontWeight: 700, fontSize: size * (s.btn ?? 1), padding: `${size * 0.55 * (s.btn ?? 1)}px ${size * 1.2 * (s.btn ?? 1)}px`, borderRadius: size * 0.5, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
    {children}
  </div>
);

const Event: React.FC<{ s: Spec; p: Pal; t: Record<string, string> }> = ({ s, p, t }) => {
  const [W, H] = SIZE.event;
  const g = s.gap ?? 1;
  const pad = 56 * (s.pad ?? 1);
  return (
    <div style={{ width: W, height: H, position: "relative", background: p.bg, overflow: "hidden" }}>
      <Photo src={s.photo} style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,0) 20%, ${p.bg} 92%)`, opacity: s.overlay }} />
      <div style={{ position: "absolute", left: pad, right: pad, bottom: 64 * g, textAlign: s.align ?? "left", color: p.ink }}>
        <div style={{ fontFamily: fam(s, "kicker"), fontWeight: 700, fontSize: 26 * (s.body ?? 1), letterSpacing: 4, color: p.accent, marginBottom: 18 * g, translate: off(s, 0) }}>{t.kicker}</div>
        <div style={{ fontFamily: fam(s, "title"), fontWeight: 700, fontSize: 112 * (s.head ?? 1), lineHeight: 0.95, textTransform: "uppercase", translate: off(s, 1) }}>{lines(t.title)}</div>
        <div style={{ fontFamily: fam(s, "sub"), fontWeight: 500, fontSize: 28 * (s.body ?? 1), color: p.sub, marginTop: 24 * g, translate: off(s, 2) }}>{t.sub}</div>
        <div style={{ marginTop: 34 * g, translate: off(s, 3) }}>
          <Button s={s} p={p} size={30}>{t.button}</Button>
        </div>
      </div>
      <Noise k={s.noise ?? 0} w={W} h={H} />
    </div>
  );
};

const Cafe: React.FC<{ s: Spec; p: Pal; t: Record<string, string> }> = ({ s, p, t }) => {
  const [W, H] = SIZE.cafe;
  const g = s.gap ?? 1;
  const pad = 60 * (s.pad ?? 1);
  return (
    <div style={{ width: W, height: H, position: "relative", background: p.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -250, top: 150, width: 560, height: 560, borderRadius: "50%", overflow: "hidden", border: `14px solid ${p.bg}`, boxShadow: "0 20px 50px rgba(0,0,0,.18)" }}>
        <Photo src={s.photo} />
      </div>
      <div style={{ position: "absolute", left: pad, top: 64, fontFamily: fam(s, "kicker"), fontWeight: 700, fontSize: 26, letterSpacing: 6, color: p.ink, translate: off(s, 0) }}>{t.brand}</div>
      <div style={{ position: "absolute", left: pad, top: 230, width: 400, color: p.ink, textAlign: s.align ?? "left" }}>
        <div style={{ fontFamily: s.font === "head" || !s.font ? SERIF : fam(s, "title"), fontWeight: 700, fontSize: 88 * (s.head ?? 1), lineHeight: 1.02, translate: off(s, 1) }}>{lines(t.title)}</div>
        <div style={{ fontFamily: fam(s, "sub"), fontWeight: 500, fontSize: 27 * (s.body ?? 1), lineHeight: 1.4, color: p.sub, marginTop: 28 * g, width: 330, translate: off(s, 2) }}>{t.sub}</div>
        <div style={{ marginTop: 40 * g, translate: off(s, 3) }}>
          <Button s={s} p={p} size={30}>{t.button}</Button>
        </div>
      </div>
      <Noise k={s.noise ?? 0} w={W} h={H} />
    </div>
  );
};

const Sale: React.FC<{ s: Spec; p: Pal; t: Record<string, string> }> = ({ s, p, t }) => {
  const [W, H] = SIZE.sale;
  const g = s.gap ?? 1;
  const pad = 56 * (s.pad ?? 1);
  return (
    <div style={{ width: W, height: H, position: "relative", background: p.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 560 }}>
        <Photo src={s.photo} />
      </div>
      <div style={{ position: "absolute", left: pad, top: 40, background: p.accent, color: p.accentInk, fontFamily: fam(s, "kicker"), fontWeight: 700, fontSize: 26, padding: "8px 18px", borderRadius: 10, letterSpacing: 2 }}>{t.tag}</div>
      <div style={{ position: "absolute", left: pad, right: pad, top: 600 * (0.9 + 0.1 * g), color: p.ink, textAlign: s.align ?? "left" }}>
        <div style={{ fontFamily: fam(s, "title"), fontWeight: 700, fontSize: 70 * (s.head ?? 1), lineHeight: 1.05, textTransform: s.font === "head" || !s.font ? "uppercase" : "none", translate: off(s, 0) }}>{t.title}</div>
        <div style={{ fontFamily: fam(s, "sub"), fontWeight: 500, fontSize: 28 * (s.body ?? 1), color: p.sub, marginTop: 14 * g, translate: off(s, 1) }}>{t.sub}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: s.align === "center" ? "center" : "space-between", gap: 24, marginTop: 34 * g, translate: off(s, 2) }}>
          <div>
            <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 64 * (s.body ?? 1), color: p.accent, lineHeight: 1 }}>{t.price}</div>
            <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 24, color: p.sub, textDecoration: "line-through" }}>{t.old}</div>
          </div>
          <Button s={s} p={p} size={32}>{t.button}</Button>
        </div>
      </div>
      <Noise k={s.noise ?? 0} w={W} h={H} />
    </div>
  );
};

const App: React.FC<{ s: Spec; p: Pal; t: Record<string, string> }> = ({ s, p, t }) => {
  const [W, H] = SIZE.app;
  const g = s.gap ?? 1;
  const pad = 28 * (s.pad ?? 1);
  return (
    <div style={{ width: W, height: H, position: "relative", background: p.bg, overflow: "hidden", color: p.ink }}>
      <div style={{ position: "absolute", left: pad, right: pad, top: 22, display: "flex", justifyContent: "space-between", fontFamily: BODY, fontWeight: 700, fontSize: 16 }}>
        <span>9:41</span>
        <span>●●● ▮</span>
      </div>
      <div style={{ position: "absolute", left: pad, right: pad, top: 76, textAlign: s.align ?? "left" }}>
        <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 18 * (s.body ?? 1), color: p.sub, translate: off(s, 0) }}>{t.hello}</div>
        <div style={{ height: 260, borderRadius: 24, overflow: "hidden", marginTop: 20 * g }}>
          <Photo src={s.photo} />
        </div>
        <div style={{ fontFamily: fam(s, "title"), fontWeight: 700, fontSize: 40 * (s.head ?? 1), lineHeight: 1.1, marginTop: 26 * g, translate: off(s, 1) }}>{t.title}</div>
        <div style={{ fontFamily: fam(s, "sub"), fontWeight: 500, fontSize: 20 * (s.body ?? 1), color: p.sub, marginTop: 10 * g, translate: off(s, 2) }}>{t.sub}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 * g }}>
          {["Màu sắc", "Bố cục", "Chữ"].map((x) => (
            <div key={x} style={{ fontFamily: BODY, fontWeight: 600, fontSize: 16, padding: "8px 14px", borderRadius: 20, background: "rgba(0,0,0,.06)", color: p.sub }}>{x}</div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: pad, right: pad, bottom: 56 }}>
        <Button s={s} p={p} size={24} full>{t.button}</Button>
      </div>
      <div style={{ position: "absolute", left: "50%", bottom: 16, width: 140, height: 6, borderRadius: 3, background: p.ink, opacity: 0.8, translate: "-50% 0" }} />
      <Noise k={s.noise ?? 0} w={W} h={H} />
    </div>
  );
};

const Landing: React.FC<{ s: Spec; p: Pal; t: Record<string, string> }> = ({ s, p, t }) => {
  const [W, H] = SIZE.landing;
  const g = s.gap ?? 1;
  const pad = 80 * (s.pad ?? 1);
  return (
    <div style={{ width: W, height: H, position: "relative", background: p.bg, overflow: "hidden", color: p.ink }}>
      <div style={{ position: "absolute", left: pad, right: pad, top: 40, display: "flex", alignItems: "center", gap: 40, fontFamily: BODY, fontWeight: 600, fontSize: 22, color: p.sub }}>
        <span style={{ fontFamily: fam(s, "title"), fontWeight: 700, fontSize: 36, color: p.ink }}>{t.logo}</span>
        <span style={{ flex: 1 }} />
        <span>Tính năng</span>
        <span>Bảng giá</span>
        <span>Blog</span>
      </div>
      <div style={{ position: "absolute", left: pad, top: 210, width: 600, textAlign: s.align ?? "left" }}>
        <div style={{ fontFamily: fam(s, "title"), fontWeight: 700, fontSize: 74 * (s.head ?? 1), lineHeight: 1.05, translate: off(s, 0) }}>{lines(t.title)}</div>
        <div style={{ fontFamily: fam(s, "sub"), fontWeight: 500, fontSize: 26 * (s.body ?? 1), lineHeight: 1.45, color: p.sub, marginTop: 28 * g, translate: off(s, 1) }}>{t.sub}</div>
        <div style={{ marginTop: 44 * g, translate: off(s, 2) }}>
          <Button s={s} p={p} size={28}>{t.button}</Button>
        </div>
      </div>
      <div style={{ position: "absolute", right: 70, top: 150, width: 500, height: 560, borderRadius: 32, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,.2)" }}>
        <Photo src={s.photo} />
      </div>
      <Noise k={s.noise ?? 0} w={W} h={H} />
    </div>
  );
};

const Thumb: React.FC<{ s: Spec; p: Pal; t: Record<string, string> }> = ({ s, p, t }) => {
  const [W, H] = SIZE.thumb;
  return (
    <div style={{ width: W, height: H, position: "relative", background: p.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 720 }}>
        <Photo src={s.photo} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${p.bg} 35%, rgba(0,0,0,0) 75%)`, opacity: s.overlay }} />
      <div style={{ position: "absolute", left: 70 * (s.pad ?? 1), top: 120, fontFamily: fam(s, "title"), fontWeight: 700, fontSize: 150 * (s.head ?? 1), lineHeight: 0.95, color: p.ink, textTransform: "uppercase", translate: off(s, 0) }}>
        {t.title.split("\n").map((l, i) => (
          <div key={i} style={{ color: i === 0 ? p.sub : p.ink }}>{l}</div>
        ))}
      </div>
      <Noise k={s.noise ?? 0} w={W} h={H} />
    </div>
  );
};

const KINDS = { event: Event, cafe: Cafe, sale: Sale, app: App, landing: Landing, thumb: Thumb };

export const Specimen: React.FC<{ s: Spec }> = ({ s }) => {
  const Cmp = KINDS[s.kind];
  const p = resolvePal(s);
  const t = { ...DEF_TEXT[s.kind], ...s.text };
  return <Cmp s={s} p={p} t={t} />;
};

// Khung thiết bị: điện thoại cho app, laptop cho trang web, tờ giấy có bóng cho các mẫu khác
export const Framed: React.FC<{ s: Spec; width: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ s, width, style, children }) => {
  const [W, H] = SIZE[s.kind];
  if (s.kind === "app") {
    const bez = 18;
    const k = width / (W + bez * 2);
    return (
      <div style={{ width, height: (H + bez * 2) * k, position: "relative", ...style }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 64 * k, background: "#0B0B0D", boxShadow: "0 40px 80px rgba(0,0,0,.45), inset 0 0 0 3px #333" }} />
        <div style={{ position: "absolute", left: bez * k, top: bez * k, width: W, height: H, scale: String(k), transformOrigin: "0 0", borderRadius: 48, overflow: "hidden" }}>
          <Specimen s={s} />
          {children}
        </div>
        <div style={{ position: "absolute", left: "50%", top: (bez + 12) * k, width: 120 * k, height: 34 * k, borderRadius: 20 * k, background: "#0B0B0D", translate: "-50% 0" }} />
      </div>
    );
  }
  if (s.kind === "landing") {
    const bez = 22;
    const k = width / (W + bez * 2 + 120);
    const sw = (W + bez * 2) * k;
    return (
      <div style={{ width, height: (H + bez * 2 + 50) * k, position: "relative", ...style }}>
        <div style={{ position: "absolute", left: (width - sw) / 2, top: 0, width: sw, height: (H + bez * 2) * k, borderRadius: 26 * k, background: "#1A1A1D", boxShadow: "0 40px 80px rgba(0,0,0,.4)" }} />
        <div style={{ position: "absolute", left: (width - sw) / 2 + bez * k, top: bez * k, width: W, height: H, scale: String(k), transformOrigin: "0 0", overflow: "hidden", borderRadius: 6 }}>
          <Specimen s={s} />
          {children}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: (H + bez * 2) * k, height: 28 * k, background: "linear-gradient(#C9CCD2,#9EA2AA)", borderRadius: `0 0 ${40 * k}px ${40 * k}px` }} />
      </div>
    );
  }
  const k = width / W;
  return (
    <div style={{ width, height: H * k, position: "relative", ...style }}>
      <div style={{ width: W, height: H, scale: String(k), transformOrigin: "0 0", borderRadius: 18, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,.4)" }}>
        <Specimen s={s} />
        {children}
      </div>
    </div>
  );
};

export const framedHeight = (s: Spec, width: number) => {
  const [W, H] = SIZE[s.kind];
  if (s.kind === "app") return ((H + 36) * width) / (W + 36);
  if (s.kind === "landing") return ((H + 94) * width) / (W + 164);
  return (H * width) / W;
};
