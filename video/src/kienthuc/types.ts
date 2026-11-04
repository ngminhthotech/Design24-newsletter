// Dữ liệu một video "Kiến thức thiết kế". Mỗi cảnh có `say` là lời đọc (viết chữ bình thường,
// render/voice.py tự đổi sang cách đọc cho Vbee). Thứ tự cảnh = thứ tự lời đọc.

export type Swatch = { color: string; label: string; pct?: number };

export type HookScene = { type: "hook"; kicker: string; title: string; sub?: string; say: string };
export type RatioScene = { type: "ratio"; title: string; parts: Swatch[]; say: string };
export type PointScene = {
  type: "point";
  num?: string; // chữ lớn, vd. "60%" hoặc "01"
  icon: string;
  title: string;
  body: string;
  color?: string; // màu minh họa (ô màu cạnh số lớn)
  examples?: string[]; // nhãn nhỏ, vd. ["Nền trang", "Khoảng trắng"]
  say: string;
};
export type MockPalette = { bg: string; panel: string; text: string; button: string; extra?: string[] };
export type CompareScene = {
  type: "compare";
  title: string;
  bad: { label: string; palette: MockPalette };
  good: { label: string; palette: MockPalette };
  say: string;
};
export type ListScene = { type: "list"; kicker?: string; title: string; items: string[]; icon?: string; say: string };
export type OutroScene = { type: "outro"; cta: string; sub?: string; say: string };

export type KTScene = HookScene | RatioScene | PointScene | CompareScene | ListScene | OutroScene;

export type Voice = { src: string; dur: number; text: string };

export type KienThucData = {
  series: string; // vd. "Mẹo thiết kế"
  topic: string; // vd. "Quy tắc 60-30-10"
  date: string; // dd/mm/yyyy
  sources: string[]; // nguồn tham khảo, hiện ở cảnh cuối
  scenes: KTScene[];
  voice?: Voice[];
};
