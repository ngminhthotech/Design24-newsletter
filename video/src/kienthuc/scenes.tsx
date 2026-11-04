import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, CONTACT, FONT } from "../brand";
import { BrandBackground, ease, Logo, Reveal, useSpring } from "../ui";
import { Glass, Ico, IconBadge } from "./kit";
import type { CompareScene, HookScene, ListScene, MockPalette, OutroScene, PointScene, RatioScene } from "./types";

// Vùng an toàn: phụ đề nằm ở đáy (khoảng 1450 trở xuống), nội dung cảnh nằm trong 160..1420.

const Frame: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light }) => (
  <AbsoluteFill style={{ fontFamily: FONT, color: light ? C.ink : "#fff" }}>
    <BrandBackground light={light} />
    {children}
  </AbsoluteFill>
);

// Thanh trên: logo nhỏ và nhãn chuỗi bài
const Header: React.FC<{ series: string }> = ({ series }) => {
  const p = useSpring(0, 18);
  return (
    <div style={{ position: "absolute", top: 70, left: 60, right: 60, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: p, translate: `0px ${(1 - p) * -40}px` }}>
      <Logo width={120} pad={12} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 32, fontWeight: 800, background: "rgba(255,255,255,.14)", border: "2px solid rgba(255,255,255,.25)", padding: "14px 28px", borderRadius: 999 }}>
        <Ico name="pen" size={32} color={C.orange2} />
        {series}
      </div>
    </div>
  );
};

const Kicker: React.FC<{ text: string; delay?: number; icon?: string }> = ({ text, delay = 0, icon = "sparkles" }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: C.orange, borderRadius: 999, padding: "12px 28px", fontSize: 34, fontWeight: 800, color: "#fff", opacity: ease(frame, delay, delay + 10, [0, 1]), translate: `${ease(frame, delay, delay + 16, [-40, 0])}px 0px` }}>
      <Ico name={icon} size={34} />
      {text}
    </div>
  );
};

export const Hook: React.FC<{ s: HookScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const logo = useSpring(0, 12, 160);
  const big = useSpring(10, 9, 200);
  // Ba khối màu xếp lệch nhau, xoay nhẹ: gợi ý chủ đề màu sắc / bố cục
  const chips = [C.orange, C.blue2, "#F4F1EA"];
  return (
    <Frame>
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(logo) }}>
        <Logo width={190} pad={20} />
      </div>
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Kicker text={s.kicker} delay={6} icon="bulb" />
      </div>
      <div style={{ position: "absolute", top: 500, left: 60, right: 60, textAlign: "center", scale: String(0.8 + 0.2 * big), opacity: big }}>
        {s.title.split("\n").map((l, i) => (
          <div key={i} style={{ fontSize: i === 0 ? 120 : 190, fontWeight: 900, letterSpacing: i === 0 ? -3 : -8, lineHeight: 1.02, color: i === 0 ? "#fff" : C.orange2, textShadow: "0 24px 70px rgba(0,0,0,.35)" }}>
            {l}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 960, left: 0, right: 0, height: 260 }}>
        {chips.map((c, i) => {
          const p = ease(frame, 26 + i * 6, 50 + i * 6, [0, 1]);
          return (
            <div key={c} style={{ position: "absolute", left: 300 + i * 150, top: 40 + (i % 2) * 30, width: 180, height: 180, borderRadius: 40, background: c, boxShadow: "0 20px 50px rgba(0,0,0,.3)", rotate: `${(i - 1) * 10 + Math.sin(frame / 20 + i) * 3}deg`, scale: String(p), opacity: p }} />
          );
        })}
      </div>
      {s.sub && (
        <div style={{ position: "absolute", top: 1260, left: 80, right: 80, textAlign: "center", fontSize: 56, fontWeight: 800, lineHeight: 1.2, opacity: ease(frame, 40, 56, [0, 1]), translate: `0px ${ease(frame, 40, 60, [30, 0])}px` }}>
          {s.sub}
        </div>
      )}
    </Frame>
  );
};

export const Ratio: React.FC<{ s: RatioScene; series: string }> = ({ s, series }) => {
  const frame = useCurrentFrame();
  const H = 900;
  const total = s.parts.reduce((a, p) => a + (p.pct ?? 0), 0) || 1;
  let delay = 18;
  return (
    <Frame>
      <Header series={series} />
      <div style={{ position: "absolute", top: 230, left: 70, right: 70 }}>
        <Reveal delay={4} style={{ fontSize: 80, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05 }}>{s.title}</Reveal>
      </div>
      <div style={{ position: "absolute", top: 420, left: 90, right: 90, height: H, borderRadius: 44, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.35)", border: "6px solid rgba(255,255,255,.9)", display: "flex", flexDirection: "column", background: "rgba(255,255,255,.08)" }}>
        {s.parts.map((p) => {
          const h = ((p.pct ?? 0) / total) * H;
          const d = delay;
          delay += 22;
          const g = ease(frame, d, d + 24, [0, 1]);
          const dark = isDark(p.color);
          return (
            <div key={p.label} style={{ height: h, position: "relative", flex: "none" }}>
              <div style={{ position: "absolute", inset: 0, background: p.color, transformOrigin: "left", scale: `${g} 1` }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 44px", color: dark ? "#fff" : C.ink, opacity: ease(frame, d + 12, d + 24, [0, 1]) }}>
                <div style={{ fontSize: h > 120 ? 54 : 40, fontWeight: 800 }}>{p.label}</div>
                <div style={{ fontSize: h > 120 ? 110 : 56, fontWeight: 900, letterSpacing: -3 }}>{p.pct}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

export const Point: React.FC<{ s: PointScene; series: string }> = ({ s, series }) => {
  const frame = useCurrentFrame();
  const pop = useSpring(6, 9, 200);
  return (
    <Frame>
      <Header series={series} />
      <div style={{ position: "absolute", top: 310, left: 70, right: 70, display: "flex", alignItems: "center", gap: 40 }}>
        {s.num && (
          <div style={{ fontSize: 230, fontWeight: 900, letterSpacing: -10, lineHeight: 1, color: C.orange2, scale: String(0.7 + 0.3 * pop), opacity: pop, textShadow: "0 24px 60px rgba(0,0,0,.3)" }}>{s.num}</div>
        )}
        {s.color && (
          <div style={{ width: 200, height: 200, borderRadius: 48, background: s.color, border: "6px solid #fff", boxShadow: "0 20px 50px rgba(0,0,0,.35)", rotate: `${ease(frame, 10, 34, [-25, 6])}deg`, scale: String(ease(frame, 10, 30, [0, 1])) }} />
        )}
      </div>
      <Glass style={{ position: "absolute", top: 660, left: 70, right: 70, padding: "50px 50px 56px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <IconBadge name={s.icon} size={110} color={C.orange} delay={14} />
          <Reveal delay={14} style={{ fontSize: 64, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.08 }}>{s.title}</Reveal>
        </div>
        <div style={{ marginTop: 34, fontSize: 48, fontWeight: 600, lineHeight: 1.35, opacity: ease(frame, 26, 40, [0, 0.95]), translate: `0px ${ease(frame, 26, 44, [24, 0])}px` }}>{s.body}</div>
        {s.examples && (
          <div style={{ marginTop: 34, display: "flex", flexWrap: "wrap", gap: 16 }}>
            {s.examples.map((e, i) => (
              <div key={e} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.16)", borderRadius: 999, padding: "12px 26px", fontSize: 36, fontWeight: 700, opacity: ease(frame, 40 + i * 6, 52 + i * 6, [0, 1]), scale: String(ease(frame, 40 + i * 6, 52 + i * 6, [0.7, 1])) }}>
                <Ico name="check" size={34} color={C.orange2} stroke={3} />
                {e}
              </div>
            ))}
          </div>
        )}
      </Glass>
    </Frame>
  );
};

// Bản thu nhỏ một trang web để minh họa phối màu
const Mock: React.FC<{ p: MockPalette; delay: number }> = ({ p, delay }) => {
  const frame = useCurrentFrame();
  const g = ease(frame, delay, delay + 20, [0, 1]);
  const ex = p.extra ?? [];
  return (
    <div style={{ width: 430, height: 640, borderRadius: 32, background: p.bg, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,.35)", border: "5px solid #fff", scale: String(0.85 + 0.15 * g), opacity: g, display: "flex", flexDirection: "column" }}>
      <div style={{ height: 70, background: p.panel, display: "flex", alignItems: "center", gap: 12, padding: "0 22px" }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: ex[0] ?? p.button }} />
        <div style={{ width: 120, height: 14, borderRadius: 7, background: "rgba(255,255,255,.7)" }} />
      </div>
      <div style={{ padding: 26, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <div style={{ height: 150, borderRadius: 20, background: ex[1] ?? p.panel, opacity: ex[1] ? 1 : 0.18 }} />
        <div style={{ width: "85%", height: 26, borderRadius: 8, background: p.text }} />
        <div style={{ width: "100%", height: 14, borderRadius: 7, background: p.text, opacity: 0.45 }} />
        <div style={{ width: "92%", height: 14, borderRadius: 7, background: p.text, opacity: 0.45 }} />
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, height: 90, borderRadius: 16, background: ex[2] ?? p.panel, opacity: ex[2] ? 1 : 0.12 }} />
          <div style={{ flex: 1, height: 90, borderRadius: 16, background: ex[3] ?? p.panel, opacity: ex[3] ? 1 : 0.12 }} />
        </div>
        <div style={{ marginTop: "auto", height: 76, borderRadius: 38, background: p.button, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 30, fontWeight: 800 }}>Đăng ký</div>
      </div>
    </div>
  );
};

export const Compare: React.FC<{ s: CompareScene; series: string }> = ({ s, series }) => {
  const frame = useCurrentFrame();
  const side = (label: string, good: boolean, delay: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 30, justifyContent: "center", fontSize: 38, fontWeight: 800, opacity: ease(frame, delay, delay + 12, [0, 1]) }}>
      <Ico name={good ? "ok" : "no"} size={46} color={good ? "#4ADE80" : "#F87171"} stroke={2.6} />
      {label}
    </div>
  );
  return (
    <Frame>
      <Header series={series} />
      <div style={{ position: "absolute", top: 230, left: 70, right: 70 }}>
        <Reveal delay={4} style={{ fontSize: 80, fontWeight: 900, letterSpacing: -2 }}>{s.title}</Reveal>
      </div>
      <div style={{ position: "absolute", top: 480, left: 50, right: 50, display: "flex", justifyContent: "space-between" }}>
        <div>
          <Mock p={s.bad.palette} delay={14} />
          {side(s.bad.label, false, 30)}
        </div>
        <div>
          <Mock p={s.good.palette} delay={40} />
          {side(s.good.label, true, 56)}
        </div>
      </div>
    </Frame>
  );
};

export const List: React.FC<{ s: ListScene; series: string }> = ({ s, series }) => {
  const frame = useCurrentFrame();
  return (
    <Frame>
      <Header series={series} />
      <div style={{ position: "absolute", top: 240, left: 70, right: 70 }}>
        {s.kicker && <Kicker text={s.kicker} delay={2} icon={s.icon ?? "bookmark"} />}
        <Reveal delay={8} style={{ fontSize: 84, fontWeight: 900, letterSpacing: -2, marginTop: 20 }}>{s.title}</Reveal>
      </div>
      <div style={{ position: "absolute", top: 600, left: 70, right: 70, display: "flex", flexDirection: "column", gap: 26 }}>
        {s.items.map((it, i) => {
          const d = 18 + i * 14;
          return (
            <Glass key={it} style={{ display: "flex", alignItems: "center", gap: 28, padding: "30px 36px", opacity: ease(frame, d, d + 12, [0, 1]), translate: `${ease(frame, d, d + 18, [80, 0])}px 0px` }}>
              <div style={{ width: 78, height: 78, borderRadius: 24, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 900, flex: "none" }}>{i + 1}</div>
              <div style={{ fontSize: 46, fontWeight: 700, lineHeight: 1.25 }}>{it}</div>
            </Glass>
          );
        })}
      </div>
    </Frame>
  );
};

export const Outro: React.FC<{ s: OutroScene; sources: string[] }> = ({ s, sources }) => {
  const frame = useCurrentFrame();
  const logo = useSpring(0, 11, 150);
  const btn = useSpring(22, 9, 200);
  const pulse = 1 + Math.sin(frame / 7) * 0.025;
  return (
    <Frame>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(logo) }}>
        <Logo width={330} pad={34} />
      </div>
      <div style={{ position: "absolute", top: 760, left: 60, right: 60, textAlign: "center" }}>
        <Reveal delay={10} style={{ fontSize: 92, fontWeight: 900, letterSpacing: -2 }}>{s.cta}</Reveal>
        {s.sub && <div style={{ fontSize: 50, fontWeight: 700, marginTop: 14, opacity: ease(frame, 18, 30, [0, 0.9]) }}>{s.sub}</div>}
      </div>
      <div style={{ position: "absolute", top: 1070, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(btn * pulse) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, background: `linear-gradient(90deg, ${C.orange}, ${C.orange2})`, borderRadius: 999, padding: "28px 56px", fontSize: 54, fontWeight: 900, boxShadow: "0 20px 60px rgba(255,127,20,.5)" }}>
          <Ico name="follow" size={58} />
          Theo dõi ngay
        </div>
      </div>
      <div style={{ position: "absolute", top: 1250, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12, alignItems: "center", fontSize: 40, fontWeight: 700, opacity: ease(frame, 30, 42, [0, 1]) }}>
        <Ico name="globe" size={40} />
        {CONTACT.website}
      </div>
      {sources.length > 0 && (
        <div style={{ position: "absolute", top: 1360, left: 80, right: 80, textAlign: "center", fontSize: 28, fontWeight: 500, lineHeight: 1.35, opacity: ease(frame, 36, 48, [0, 0.75]) }}>
          Tham khảo: {sources.join(" • ")}
        </div>
      )}
    </Frame>
  );
};

function isDark(hex: string) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 150;
}
