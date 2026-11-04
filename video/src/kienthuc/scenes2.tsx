import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../brand";
import { BrandBackground, ease, Logo, useSpring } from "../ui";
import { Ico } from "./kit";
import { FOCUS, H, LandingMock, MiniArt, mixPalette, RatioBar, W } from "./mock";
import type { ExamplesScene, FocusScene, HookPro, MistakeScene, TransformScene } from "./types";

// Cảnh "chuyên nghiệp": một bản thiết kế thật được biến đổi trực tiếp, máy quay zoom vào từng vùng,
// chữ lớn kiểu kinetic, tô cam các từ khoá đặt trong *...*.

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
    <BrandBackground />
    {children}
  </AbsoluteFill>
);

// "Phối màu *rối mắt*?" -> từ trong dấu * tô cam
export const Rich: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\*[^*]+\*)/).map((t, i) =>
      t.startsWith("*") ? (
        <span key={i} style={{ color: C.orange }}>{t.slice(1, -1)}</span>
      ) : (
        <React.Fragment key={i}>{t}</React.Fragment>
      ),
    )}
  </>
);

// Tiêu đề lớn: từng dòng trượt lên, xuất hiện ngay khung đầu để giữ người xem
const Headline: React.FC<{ text: string; top: number; size?: number; delay?: number }> = ({ text, top, size = 92, delay = 0 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top, left: 60, right: 60, textAlign: "center" }}>
      {text.split("\n").map((l, i) => (
        <div key={i} style={{ overflow: "hidden", paddingBottom: 6 }}>
          <div style={{ fontSize: size, fontWeight: 900, letterSpacing: -2.5, lineHeight: 1.06, textShadow: "0 12px 40px rgba(0,0,0,.35)", translate: `0px ${ease(frame, delay + i * 4, delay + i * 4 + 16, [delay === 0 && i === 0 ? 0 : 100, 0])}%` }}>
            <Rich text={l} />
          </div>
        </div>
      ))}
    </div>
  );
};

const SeriesTag: React.FC<{ series: string }> = ({ series }) => {
  const p = useSpring(0, 18);
  return (
    <div style={{ position: "absolute", top: 64, left: 60, right: 60, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: p }}>
      <Logo width={112} pad={11} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 30, fontWeight: 800, background: "rgba(255,255,255,.14)", border: "2px solid rgba(255,255,255,.25)", padding: "12px 26px", borderRadius: 999 }}>
        <Ico name="palette" size={30} color={C.orange2} />
        {series}
      </div>
    </div>
  );
};

// Đặt bản mẫu vào khung hình với máy quay: dời điểm (fx, fy) về giữa rồi zoom tới `zoom`
const Stage: React.FC<{ top: number; scale: number; zoom?: number; fx?: number; fy?: number; zd?: [number, number]; rot?: number; children: React.ReactNode }> = ({
  top, scale, zoom = 1, fx = W / 2, fy = H / 2, zd = [6, 40], rot = 0, children,
}) => {
  const frame = useCurrentFrame();
  const t = zoom === 1 ? 0 : ease(frame, zd[0], zd[1], [0, 1]);
  const z = 1 + (zoom - 1) * t;
  return (
    <div style={{ position: "absolute", left: 540 - (W * scale) / 2, top, width: W, height: H, transformOrigin: "0 0", scale: String(scale), rotate: `${rot}deg` }}>
      <div style={{ width: W, height: H, transformOrigin: "50% 50%", transform: `scale(${z}) translate(${(W / 2 - fx) * t}px, ${(H / 2 - fy) * t}px)` }}>{children}</div>
    </div>
  );
};

export const HookProScene: React.FC<{ s: HookPro }> = ({ s }) => {
  const frame = useCurrentFrame();
  const shake = frame < 40 ? Math.sin(frame * 1.7) * ease(frame, 10, 40, [6, 0]) : 0;
  const stamp = useSpring(22, 8, 260);
  return (
    <Frame>
      <Headline text={s.title} top={110} size={104} />
      <Stage top={470} scale={0.78} rot={-3 + shake * 0.3}>
        <LandingMock p={s.bad} />
      </Stage>
      {/* dấu đỏ "rối mắt" đóng lên bản thiết kế */}
      <div style={{ position: "absolute", top: 820, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(1.6 - 0.6 * stamp), opacity: stamp, rotate: "-10deg" }}>
        <div style={{ border: "10px solid #EF4444", color: "#EF4444", background: "rgba(255,255,255,.92)", borderRadius: 24, padding: "14px 40px", fontSize: 88, fontWeight: 900, letterSpacing: 2, display: "flex", alignItems: "center", gap: 16 }}>
          <Ico name="x" size={90} color="#EF4444" stroke={3.5} />
          {s.stamp}
        </div>
      </div>
      {s.sub && (
        <div style={{ position: "absolute", top: 1300, left: 70, right: 70, display: "flex", justifyContent: "center", opacity: ease(frame, 44, 56, [0, 1]), translate: `0px ${ease(frame, 44, 60, [30, 0])}px` }}>
          <div style={{ background: "#fff", color: C.ink, borderRadius: 22, padding: "16px 34px", fontSize: 54, fontWeight: 900, textAlign: "center", boxShadow: "0 16px 40px rgba(0,0,0,.35)" }}>
            <Rich text={s.sub} />
          </div>
        </div>
      )}
    </Frame>
  );
};

export const TransformSceneC: React.FC<{ s: TransformScene; series: string }> = ({ s, series }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, 24, 70, [0, 1]);
  const g = ease(frame, 70, 100, [0, 1]);
  // ống hút màu quét chéo qua bản thiết kế
  const dropX = interpolate(frame, [20, 72], [-80, 980], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Frame>
      <SeriesTag series={series} />
      <Headline text={s.title} top={210} size={84} delay={2} />
      <Stage top={440} scale={0.8}>
        <LandingMock p={mixPalette(s.from, s.to, p)} />
      </Stage>
      {frame > 18 && frame < 80 && (
        <div style={{ position: "absolute", left: dropX, top: 760 + Math.sin(frame / 5) * 120, rotate: "-30deg" }}>
          <div style={{ width: 110, height: 110, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 40px rgba(0,0,0,.35)" }}>
            <Ico name="pipette" size={62} color={C.navy} stroke={2.4} />
          </div>
        </div>
      )}
      <div style={{ position: "absolute", top: 1300, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: g }}>
        <RatioBar p={s.to} w={700} g={g} />
        <div style={{ display: "flex", width: 700, fontSize: 30, fontWeight: 800 }}>
          <div style={{ width: 420 }}>60%</div>
          <div style={{ width: 210 }}>30%</div>
          <div>10%</div>
        </div>
      </div>
    </Frame>
  );
};

const ZOOM = { bg: 1, panel: 1.15, accent: 1.7 } as const;

export const FocusSceneC: React.FC<{ s: FocusScene; series: string }> = ({ s, series }) => {
  const frame = useCurrentFrame();
  const hl = ease(frame, 14, 30, [0, 1]);
  const card = useSpring(4, 13, 170);
  const f = FOCUS[s.role];
  return (
    <Frame>
      <SeriesTag series={series} />
      <div style={{ position: "absolute", top: 500, left: 0, right: 0, height: 800, overflow: "hidden" }}>
        <Stage top={20} scale={0.72} zoom={ZOOM[s.role]} fx={f.x} fy={f.y} zd={[10, 46]}>
          <LandingMock p={s.palette} highlight={s.role} hl={hl} />
        </Stage>
      </div>
      {/* thẻ giải thích */}
      <div style={{ position: "absolute", top: 180, left: 60, right: 60, display: "flex", gap: 30, alignItems: "center", background: "rgba(255,255,255,.96)", color: C.ink, borderRadius: 34, padding: "30px 36px", boxShadow: "0 30px 70px rgba(0,0,0,.35)", scale: String(0.9 + 0.1 * card), opacity: card, translate: `0px ${(1 - card) * -40}px` }}>
        <div style={{ textAlign: "center", flex: "none" }}>
          <div style={{ fontSize: 120, fontWeight: 900, letterSpacing: -6, lineHeight: 1, color: C.orange }}>{s.pct}</div>
          <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 10, background: "#F1F3F9", borderRadius: 999, padding: "6px 16px 6px 6px" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: s.swatch, border: "3px solid #fff", boxShadow: "0 0 0 2px #D7DCE8" }} />
            <span style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{s.swatch.toUpperCase()}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 58, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.05 }}>{s.name}</div>
          <div style={{ marginTop: 12, fontSize: 36, fontWeight: 600, lineHeight: 1.3, color: C.muted }}>{s.body}</div>
        </div>
      </div>
      {/* nhãn chú thích: dùng ở đâu */}
      <div style={{ position: "absolute", top: 1320, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
        {s.uses.map((u, i) => (
          <div key={u} style={{ display: "flex", alignItems: "center", gap: 10, background: C.deep + "E6", border: `2px solid ${C.orange}`, borderRadius: 999, padding: "10px 24px", fontSize: 34, fontWeight: 800, opacity: ease(frame, 34 + i * 6, 44 + i * 6, [0, 1]), scale: String(ease(frame, 34 + i * 6, 46 + i * 6, [0.6, 1])) }}>
            <Ico name="check" size={32} color={C.orange2} stroke={3} />
            {u}
          </div>
        ))}
      </div>
    </Frame>
  );
};

export const ExamplesSceneC: React.FC<{ s: ExamplesScene; series: string }> = ({ s, series }) => {
  const frame = useCurrentFrame();
  return (
    <Frame>
      <SeriesTag series={series} />
      <Headline text={s.title} top={210} size={80} delay={2} />
      <div style={{ position: "absolute", top: 480, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 36 }}>
        {s.items.map((it, i) => {
          const d = 12 + i * 12;
          const a = ease(frame, d, d + 20, [0, 1]);
          return (
            <div key={it.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: a, translate: `0px ${(1 - a) * 120}px`, rotate: `${(i - 1) * 2 * a}deg` }}>
              <MiniArt kind={it.kind} p={it.palette} />
              <RatioBar p={it.palette} w={300} g={ease(frame, d + 20, d + 40, [0, 1])} />
              <div style={{ fontSize: 34, fontWeight: 800 }}>{it.label}</div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

export const MistakeSceneC: React.FC<{ s: MistakeScene; series: string }> = ({ s, series }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const flip = Math.round(durationInFrames * 0.55);
  const p = ease(frame, flip, flip + 20, [0, 1]);
  const fixed = frame >= flip + 8;
  const badge = (ok: boolean) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 14, background: ok ? "#16A34A" : "#DC2626", borderRadius: 999, padding: "14px 32px", fontSize: 44, fontWeight: 900, boxShadow: "0 14px 34px rgba(0,0,0,.3)" }}>
      <Ico name={ok ? "ok" : "no"} size={48} stroke={2.8} />
      {ok ? s.good : s.bad}
    </div>
  );
  return (
    <Frame>
      <SeriesTag series={series} />
      <Headline text={s.title} top={210} size={80} delay={2} />
      <Stage top={470} scale={0.76}>
        <LandingMock p={mixPalette(s.overuse, s.palette, p)} />
      </Stage>
      <div style={{ position: "absolute", top: 1300, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(ease(frame, fixed ? flip + 8 : 10, fixed ? flip + 20 : 22, [0.6, 1])) }}>
        {badge(fixed)}
      </div>
    </Frame>
  );
};
