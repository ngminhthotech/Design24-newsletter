import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { linearTiming, springTiming, TransitionSeries, type TransitionPresentation } from "@remotion/transitions";
import { pushCut } from "@remotion/transitions/push-cut";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { C } from "../brand";
import { Subtitles } from "./Subtitles";
import { Compare, Hook, List, Outro, Point, Ratio } from "./scenes";
import type { KienThucData, KTScene } from "./types";

export const FPS = 30;
const T = 16; // khung chuyển cảnh
const VOICE_DELAY = 8;
const CHARS_PER_SEC = 14; // tốc độ đọc ước lượng khi chưa có giọng (để canh phụ đề và độ dài cảnh)

// Mỗi cảnh một lời đọc. Có giọng thì dùng thời lượng thật, chưa có thì ước lượng theo số ký tự.
const lines = (d: KienThucData) =>
  d.scenes.map((s, i) => {
    const v = d.voice?.[i];
    return v ? { text: v.text, dur: v.dur, src: v.src as string | undefined } : { text: s.say, dur: Math.max(2.2, s.say.length / CHARS_PER_SEC), src: undefined };
  });

const MIN: Record<KTScene["type"], number> = { hook: 100, ratio: 150, point: 130, compare: 170, list: 150, outro: 120 };

const durations = (d: KienThucData) => lines(d).map((l, i) => Math.max(MIN[d.scenes[i].type], VOICE_DELAY + Math.ceil(l.dur * FPS) + T + 14));

export const ktTotalFrames = (d: KienThucData) => durations(d).reduce((a, x) => a + x, 0) - (d.scenes.length - 1) * T;

const TRANSITIONS: (() => TransitionPresentation<any>)[] = [ // eslint-disable-line @typescript-eslint/no-explicit-any
  () => pushCut({ flashColor: "#ffffff", flashOpacity: 0.6 }),
  () => slide({ direction: "from-right" }),
  () => wipe({ direction: "from-bottom-right" }),
  () => pushCut({ flashColor: C.orange, flashOpacity: 0.35 }),
  () => slide({ direction: "from-bottom" }),
  () => fade(),
];

const render = (s: KTScene, d: KienThucData) => {
  switch (s.type) {
    case "hook": return <Hook s={s} />;
    case "ratio": return <Ratio s={s} series={d.series} />;
    case "point": return <Point s={s} series={d.series} />;
    case "compare": return <Compare s={s} series={d.series} />;
    case "list": return <List s={s} series={d.series} />;
    case "outro": return <Outro s={s} sources={d.sources} />;
  }
};

export const KienThuc: React.FC<KienThucData> = (data) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const durs = durations(data);
  const ls = lines(data);
  const starts: number[] = [];
  let at = 0;
  durs.forEach((dur, i) => {
    starts.push(i > 0 ? at - T : 0);
    at += dur - (i > 0 ? T : 0);
  });
  const spans = ls.flatMap((l, i) => (l.src ? [[starts[i] + VOICE_DELAY, starts[i] + VOICE_DELAY + Math.ceil(l.dur * FPS)]] : []));
  const duck = (f: number) =>
    spans.reduce((m, [a, b]) => Math.min(m, interpolate(f, [a - 8, a, b, b + 12], [1, 0.28, 0.28, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })), 1);
  return (
    <AbsoluteFill style={{ background: C.deep }}>
      <TransitionSeries>
        {data.scenes.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <TransitionSeries.Transition
                presentation={TRANSITIONS[(i - 1) % TRANSITIONS.length]()}
                timing={i % 2 ? linearTiming({ durationInFrames: T }) : springTiming({ config: { damping: 200 }, durationInFrames: T })}
              />
            )}
            <TransitionSeries.Sequence name={`${i}-${s.type}`} durationInFrames={durs[i]}>
              {render(s, data)}
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, background: `linear-gradient(90deg, ${C.orange}, ${C.orange2})`, width: `${(frame / durationInFrames) * 100}%` }} />
      <Audio
        src={staticFile("music.wav")}
        loop
        volume={(f) => interpolate(f, [0, 15, durationInFrames - 45, durationInFrames], [0, 0.55, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * duck(f)}
      />
      {starts.slice(1).map((c, i) => (
        <Sequence key={`w${i}`} from={Math.max(0, c - 4)} durationInFrames={24} layout="none">
          <Audio src={staticFile("whoosh.wav")} volume={0.35} />
        </Sequence>
      ))}
      {ls.map((l, i) => (
        <Sequence key={`v${i}`} from={starts[i] + VOICE_DELAY} durationInFrames={Math.ceil(l.dur * FPS) + 10}>
          {l.src && <Audio src={staticFile(l.src)} volume={1} />}
          <Subtitles text={l.text} dur={l.dur} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
