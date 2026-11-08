import React from "react";

// "Phong cách" (look) của video Studio: bảng màu nền, màu nhấn, phông tiêu đề, họa tiết nền,
// kiểu phụ đề, kiểu mở đầu, kiểu khung mẫu và bộ chuyển cảnh. Mỗi video một phong cách
// (autopost.run tự chọn, không trùng các bài gần nhất), nên các video trông khác nhau rõ rệt.
// Trường "bg" trong JSON (dark, ink, blue, paper) là VAI TRÒ nền; màu thật lấy theo phong cách.

export type Role = "dark" | "ink" | "blue" | "paper";
export type Tone = { bg: string; light: boolean; accent?: string; accentInk?: string };
export type Pattern = "grid" | "dots" | "stripes" | "rings" | "waves" | "halftone" | "blobs" | "lines" | "scan" | "none";
export type CaptionStyle = "box" | "outline" | "pill" | "bar" | "tag";
export type HookStyle = "bottom" | "block" | "split" | "frame";
export type FrameStyle = "plain" | "tilt" | "block" | "glow";
export type MarkStyle = "block" | "underline" | "color";
export type Deco = "none" | "confetti" | "stars" | "circles" | "plus";
export type TransitionName = "slide" | "punch" | "wipe" | "fade" | "flip" | "iris" | "clock" | "push" | "bars" | "spin";

export type Look = {
  name: string;
  tones: Record<Role, Tone>;
  accent: string; // màu nhấn mặc định (tô từ khóa, nút, số)
  accentInk: string; // chữ đặt trên màu nhấn
  inkLight: string; // chữ trên nền sáng
  head: { family: string; weight: number; upper: boolean; spacing?: number; w: number }; // w: bề rộng trung bình 1 ký tự (em)
  body: string;
  pattern: Pattern;
  deco: Deco;
  caption: CaptionStyle;
  hook: HookStyle;
  frame: FrameStyle;
  mark: MarkStyle;
  align: "center" | "left";
  radius: number; // bo góc thẻ, nút
  block: string; // màu khối lệch phía sau mẫu (frame "block")
  transitions: TransitionName[];
  cycle: Role[]; // thứ tự xoay nền khi 2 cảnh liền nhau trùng nền
};

const BVP = "'Be Vietnam Pro', Inter, sans-serif";
const F = {
  oswald: { family: "Oswald, 'Be Vietnam Pro', sans-serif", weight: 700, upper: true, w: 0.5 },
  anton: { family: "Anton, Oswald, sans-serif", weight: 400, upper: true, spacing: 1, w: 0.5 },
  montserrat: { family: "Montserrat, 'Be Vietnam Pro', sans-serif", weight: 900, upper: true, w: 0.8 },
  fraunces: { family: "Fraunces, 'Playfair Display', serif", weight: 800, upper: false, w: 0.56 },
  baloo: { family: "'Baloo 2', 'Be Vietnam Pro', sans-serif", weight: 800, upper: false, w: 0.55 },
  bricolage: { family: "'Bricolage Grotesque', 'Be Vietnam Pro', sans-serif", weight: 800, upper: false, w: 0.56 },
  barlow: { family: "'Barlow Condensed', Oswald, sans-serif", weight: 800, upper: true, w: 0.47 },
  lexend: { family: "Lexend, 'Be Vietnam Pro', sans-serif", weight: 800, upper: false, w: 0.62 },
  nunito: { family: "Nunito, 'Be Vietnam Pro', sans-serif", weight: 800, upper: false, w: 0.58 },
};

export const LOOKS: Record<string, Look> = {
  "dem-xanh": {
    name: "Đêm xanh Design24",
    tones: {
      dark: { bg: "radial-gradient(ellipse at 50% 35%, #26262B 0%, #0E0E10 70%)", light: false },
      ink: { bg: "radial-gradient(ellipse at 50% 30%, #1C2340 0%, #0A0E1F 75%)", light: false },
      blue: { bg: "radial-gradient(ellipse at 50% 30%, #2A35FF 0%, #0813DF 55%, #061450 100%)", light: false },
      paper: { bg: "#F2EFE8", light: true },
    },
    accent: "#FFE500", accentInk: "#111", inkLight: "#111",
    head: F.oswald, body: BVP, pattern: "grid", deco: "none", caption: "box", hook: "bottom", frame: "plain", mark: "block", align: "center", radius: 26, block: "#FFE500",
    transitions: ["slide", "punch", "wipe"], cycle: ["dark", "blue", "paper", "ink"],
  },
  "cam-dat": {
    name: "Cam đất ấm áp",
    tones: {
      dark: { bg: "radial-gradient(ellipse at 40% 30%, #4A2C20 0%, #22140E 75%)", light: false },
      ink: { bg: "linear-gradient(165deg, #C4532F 0%, #9C3A1E 100%)", light: false, accent: "#F6D7A7", accentInk: "#5A1F0E" },
      blue: { bg: "#EBC46A", light: true, accent: "#9C3A1E", accentInk: "#FFF6E8" },
      paper: { bg: "#F6ECDD", light: true },
    },
    accent: "#2A9D8F", accentInk: "#fff", inkLight: "#3A1E12",
    head: F.fraunces, body: BVP, pattern: "waves", deco: "circles", caption: "tag", hook: "split", frame: "block", mark: "underline", align: "left", radius: 18, block: "#C4532F",
    transitions: ["wipe", "fade", "slide"], cycle: ["paper", "ink", "dark", "blue"],
  },
  "pastel-keo": {
    name: "Pastel kẹo ngọt",
    tones: {
      dark: { bg: "radial-gradient(ellipse at 50% 30%, #5B45C9 0%, #35248A 80%)", light: false, accent: "#FFC2DB", accentInk: "#35248A" },
      ink: { bg: "#FFC9DA", light: true },
      blue: { bg: "#BDF0E3", light: true },
      paper: { bg: "#FFF5E4", light: true },
    },
    accent: "#FF4F9A", accentInk: "#fff", inkLight: "#2B1D5C",
    head: F.baloo, body: BVP, pattern: "dots", deco: "confetti", caption: "pill", hook: "frame", frame: "tilt", mark: "block", align: "center", radius: 36, block: "#FF4F9A",
    transitions: ["spin", "iris", "slide"], cycle: ["paper", "blue", "ink", "dark"],
  },
  "bao-do": {
    name: "Báo đỏ biên tập",
    tones: {
      dark: { bg: "#111111", light: false },
      ink: { bg: "#D90B0B", light: false, accent: "#111111", accentInk: "#fff" },
      blue: { bg: "#F3EEE3", light: true },
      paper: { bg: "#FFFFFF", light: true },
    },
    accent: "#FFD400", accentInk: "#111", inkLight: "#111",
    head: F.anton, body: BVP, pattern: "halftone", deco: "none", caption: "bar", hook: "block", frame: "plain", mark: "block", align: "left", radius: 4, block: "#D90B0B",
    transitions: ["push", "bars", "wipe"], cycle: ["blue", "dark", "ink", "paper"],
  },
  "rung-reu": {
    name: "Rừng rêu",
    tones: {
      dark: { bg: "radial-gradient(ellipse at 50% 30%, #1E3A2B 0%, #0F1F16 80%)", light: false },
      ink: { bg: "linear-gradient(170deg, #2D6A4F 0%, #1B4332 100%)", light: false },
      blue: { bg: "#D8F3DC", light: true, accent: "#2D6A4F", accentInk: "#fff" },
      paper: { bg: "#F2EEE3", light: true },
    },
    accent: "#FFB703", accentInk: "#13261B", inkLight: "#13261B",
    head: F.bricolage, body: BVP, pattern: "rings", deco: "plus", caption: "outline", hook: "bottom", frame: "block", mark: "underline", align: "left", radius: 22, block: "#95D5B2",
    transitions: ["fade", "slide", "clock"], cycle: ["ink", "paper", "dark", "blue"],
  },
  "neon-dem": {
    name: "Neon đêm",
    tones: {
      dark: { bg: "radial-gradient(ellipse at 50% 20%, #2A1060 0%, #0B0620 70%)", light: false },
      ink: { bg: "linear-gradient(180deg, #120A33 0%, #2B0A4A 100%)", light: false, accent: "#FF2E93", accentInk: "#fff" },
      blue: { bg: "linear-gradient(160deg, #FF2E93 0%, #7A1FF0 100%)", light: false, accent: "#0B0620", accentInk: "#00F0FF" },
      paper: { bg: "#E6FCFF", light: true, accent: "#7A1FF0", accentInk: "#fff" },
    },
    accent: "#00F0FF", accentInk: "#0B0620", inkLight: "#140A33",
    head: F.montserrat, body: BVP, pattern: "scan", deco: "stars", caption: "outline", hook: "bottom", frame: "glow", mark: "color", align: "center", radius: 20, block: "#FF2E93",
    transitions: ["punch", "push", "iris"], cycle: ["dark", "blue", "ink", "paper"],
  },
  "hoang-hon": {
    name: "Hoàng hôn",
    tones: {
      dark: { bg: "linear-gradient(170deg, #2B1055 0%, #6B1E5C 100%)", light: false },
      ink: { bg: "linear-gradient(165deg, #E4572E 0%, #B5174B 100%)", light: false, accent: "#2B1055", accentInk: "#FFD166" },
      blue: { bg: "linear-gradient(180deg, #FFE3C2 0%, #FFC4A8 100%)", light: true, accent: "#B5174B", accentInk: "#fff" },
      paper: { bg: "#FFF3E8", light: true },
    },
    accent: "#FFD166", accentInk: "#2B1055", inkLight: "#2B1055",
    head: F.lexend, body: BVP, pattern: "blobs", deco: "circles", caption: "pill", hook: "block", frame: "tilt", mark: "block", align: "center", radius: 30, block: "#FFD166",
    transitions: ["slide", "spin", "fade"], cycle: ["dark", "paper", "ink", "blue"],
  },
  "toi-gian": {
    name: "Tối giản Thụy Sĩ",
    tones: {
      dark: { bg: "#121212", light: false, accent: "#FFFFFF", accentInk: "#121212" },
      ink: { bg: "#1D3BFF", light: false, accent: "#FFFFFF", accentInk: "#1D3BFF" },
      blue: { bg: "#E8E8E3", light: true },
      paper: { bg: "#FFFFFF", light: true },
    },
    accent: "#1D3BFF", accentInk: "#fff", inkLight: "#121212",
    head: F.montserrat, body: BVP, pattern: "lines", deco: "none", caption: "tag", hook: "split", frame: "plain", mark: "block", align: "left", radius: 0, block: "#1D3BFF",
    transitions: ["wipe", "push", "slide"], cycle: ["paper", "ink", "dark", "blue"],
  },
  "chanh-vang": {
    name: "Chanh vàng",
    tones: {
      dark: { bg: "#1A1A1A", light: false },
      ink: { bg: "linear-gradient(170deg, #00875A 0%, #006644 100%)", light: false, accent: "#FFE14D", accentInk: "#1A1A1A" },
      blue: { bg: "#FFE14D", light: true, accent: "#1A1A1A", accentInk: "#FFE14D" },
      paper: { bg: "#FFFBEA", light: true },
    },
    accent: "#FF5A36", accentInk: "#fff", inkLight: "#1A1A1A",
    head: F.barlow, body: BVP, pattern: "stripes", deco: "plus", caption: "box", hook: "block", frame: "block", mark: "block", align: "center", radius: 14, block: "#1A1A1A",
    transitions: ["bars", "punch", "slide"], cycle: ["blue", "dark", "paper", "ink"],
  },
  "bien-xanh": {
    name: "Biển xanh ngọc",
    tones: {
      dark: { bg: "radial-gradient(ellipse at 50% 25%, #0B4870 0%, #03213A 80%)", light: false },
      ink: { bg: "linear-gradient(170deg, #0E86B4 0%, #0B5C85 100%)", light: false },
      blue: { bg: "#9FE6DF", light: true, accent: "#03213A", accentInk: "#9FE6DF" },
      paper: { bg: "#EEF8F7", light: true },
    },
    accent: "#FF7B54", accentInk: "#fff", inkLight: "#03213A",
    head: F.nunito, body: BVP, pattern: "waves", deco: "circles", caption: "pill", hook: "frame", frame: "tilt", mark: "underline", align: "center", radius: 32, block: "#FF7B54",
    transitions: ["iris", "slide", "fade"], cycle: ["dark", "paper", "ink", "blue"],
  },
};

export const LOOK_IDS = Object.keys(LOOKS);
export const DEFAULT_LOOK = "dem-xanh";
export const getLook = (id?: string) => LOOKS[id ?? ""] ?? LOOKS[DEFAULT_LOOK];

export const LookContext = React.createContext<Look>(LOOKS[DEFAULT_LOOK]);
export const useLook = () => React.useContext(LookContext);

const hexLum = (hex: string) => {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Màu thật của một nền: vai trò (dark/ink/blue/paper) theo phong cách, hoặc mã màu viết thẳng
export type Resolved = { css: string; light: boolean; accent: string; accentInk: string; ink: string; sub: string };
export const resolveTone = (look: Look, bg?: string, fallback: Role = "dark"): Resolved => {
  const role = (bg && bg in look.tones ? bg : !bg || bg === "photo" ? fallback : null) as Role | null;
  if (role) {
    const t = look.tones[role];
    return { css: t.bg, light: t.light, accent: t.accent ?? look.accent, accentInk: t.accentInk ?? look.accentInk, ink: t.light ? look.inkLight : "#fff", sub: t.light ? `${look.inkLight}CC` : "rgba(255,255,255,.85)" };
  }
  const light = /^#[0-9a-f]{3,6}$/i.test(bg!) ? hexLum(bg!) > 0.4 : false;
  return { css: bg!, light, accent: look.accent, accentInk: look.accentInk, ink: light ? look.inkLight : "#fff", sub: light ? `${look.inkLight}CC` : "rgba(255,255,255,.85)" };
};
export const useTone = (bg?: string, fallback: Role = "dark") => resolveTone(useLook(), bg, fallback);

// Cỡ chữ vừa một dòng: không vượt `max`, không tràn bề rộng `width`
export const fitSize = (look: Look, text: string, max: number, width = 940) => {
  const n = text.replace(/\*/g, "").length || 1;
  return Math.min(max, width / (n * look.head.w));
};

// Kiểu chữ tiêu đề theo phong cách
export const headStyle = (look: Look): React.CSSProperties => ({
  fontFamily: look.head.family,
  fontWeight: look.head.weight,
  textTransform: look.head.upper ? "uppercase" : "none",
  letterSpacing: look.head.spacing ?? (look.head.upper ? 0 : -1),
});
