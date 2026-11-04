"""Bộ nhạc nền tự tạo bằng code (không bản quyền), nhiều phong cách để xoay vòng giữa các video.

Cách dùng:
  python3 render/tracks.py video/public/            # tạo nhac-lofi.wav, nhac-chill.wav, nhac-house.wav, nhac-tech.wav
  python3 render/tracks.py video/public/ lofi       # chỉ tạo một bản

Mỗi bản dài 90 giây, cùng âm lượng (khoảng -19 LUFS sau khi chuẩn hoá bằng ffmpeg).
autopost.run tự chọn một bản theo tên thư mục bài để các video liên tiếp không trùng nhạc.
"""

import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

SR = 44100
SECONDS = 90
NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def hz(n):
    """'A4' -> 440"""
    name, octv = n[:-1], int(n[-1])
    return 440 * 2 ** ((NOTE[name] + 12 * (octv + 1) - 69) / 12)


def filt(x, lo=None, hi=None):
    """Lọc thông thấp / thông cao bậc 2 trong miền tần số."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-9
    if hi:
        X *= 1 / np.sqrt(1 + (f / hi) ** 4)
    if lo:
        X *= 1 / np.sqrt(1 + (lo / f) ** 4)
    return np.fft.irfft(X, len(x))


class Track:
    def __init__(self, bpm, seed):
        self.bpm = bpm
        self.beat = 60 / bpm
        self.n = SECONDS * SR
        self.rng = np.random.default_rng(seed)
        self.bus = {k: np.zeros(self.n) for k in ("drums", "bass", "keys", "lead", "fx")}
        self.kicks = []

    def add(self, bus, sig, t):
        s = int(t * SR)
        if s >= self.n or s < 0:
            return
        e = min(self.n, s + len(sig))
        self.bus[bus][s:e] += sig[: e - s]

    # ---- âm sắc ----
    def t(self, dur):
        return np.arange(int(dur * SR)) / SR

    def kick(self, punch=1.0):
        t = self.t(0.4)
        f = 42 + 90 * np.exp(-t * 30)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) * punch

    def snare(self, tone=190):
        t = self.t(0.25)
        nz = filt(self.rng.normal(0, 1, len(t)), lo=1500) * np.exp(-t * 20) * 0.45
        body = np.sin(2 * np.pi * tone * t) * np.exp(-t * 30) * 0.4
        return nz + body

    def hat(self, open_=False):
        t = self.t(0.25 if open_ else 0.06)
        nz = filt(self.rng.normal(0, 1, len(t)), lo=7000)
        return nz * np.exp(-t * (14 if open_ else 80)) * 0.22

    def epiano(self, f, dur):
        t = self.t(dur)
        trem = 1 + 0.15 * np.sin(2 * np.pi * 4.5 * t)
        s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3) + 0.08 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 6)
        return s * np.exp(-t * 1.1) * trem * np.minimum(1, t / 0.006)

    def pad(self, f, dur):
        t = self.t(dur)
        s = sum(np.sin(2 * np.pi * f * (1 + d) * t + self.rng.uniform(0, 6)) for d in (-0.005, 0, 0.005))
        s += 0.3 * sum(np.sin(2 * np.pi * 2 * f * (1 + d) * t) for d in (-0.003, 0.003))
        a = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.4)
        return s * a / 3

    def pluck(self, f, dur=0.5):
        t = self.t(dur)
        s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 12) + 0.25 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 18)
        return s * np.exp(-t * 7) * np.minimum(1, t / 0.003)

    def bell(self, f, dur=1.2):
        t = self.t(dur)
        s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 10)
        return s * np.exp(-t * 3.5) * np.minimum(1, t / 0.002)

    def sub(self, f, dur):
        t = self.t(dur)
        s = np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 2 * f * t)
        return s * np.minimum(1, t / 0.01) * np.minimum(1, (dur - t) / 0.03).clip(0)

    # ---- trộn ----
    def mix(self, levels, duck=0.5, hi=None, crackle=0.0):
        sc = np.ones(self.n)
        dn = int(0.22 * SR)
        for k in self.kicks:
            s = int(k * SR)
            if s < self.n:
                m = min(dn, self.n - s)
                sc[s : s + m] = np.minimum(sc[s : s + m], np.linspace(1 - duck, 1, m))
        out = np.zeros(self.n)
        for k, lv in levels.items():
            x = self.bus[k] * lv
            out += x if k == "drums" else x * sc
        if crackle:
            pops = (self.rng.random(self.n) < 0.0004) * self.rng.normal(0, 1, self.n)
            out += filt(pops, lo=1000, hi=6000) * crackle + filt(self.rng.normal(0, 1, self.n), lo=200, hi=3000) * crackle * 0.05
        if hi:
            out = filt(out, hi=hi)
        fade = int(1.5 * SR)
        out[:fade] *= np.linspace(0, 1, fade)
        out[-fade * 2 :] *= np.linspace(1, 0, fade * 2)
        return out / (np.max(np.abs(out)) + 1e-9) * 0.9


def chords_loop(tr, chords, beats_per_chord, fn, bus, gain, start_bar=0):
    bar = beats_per_chord * tr.beat
    i = 0
    t = start_bar * bar
    while t < SECONDS:
        for n in chords[i % len(chords)]:
            tr.add(bus, fn(hz(n), bar) * gain, t)
        i += 1
        t += bar


def lofi():
    """Lo-fi hip hop 82 BPM: hợp âm jazz 7, piano điện, trống boom-bap, hat swing, tiếng đĩa than."""
    tr = Track(82, 1)
    ch = [["F3", "A3", "C4", "E4"], ["E3", "G3", "B3", "D4"], ["D3", "F3", "A3", "C4"], ["C3", "E3", "G3", "B3"]]
    roots = ["F2", "E2", "D2", "C2"]
    chords_loop(tr, ch, 4, tr.epiano, "keys", 0.22)
    b = tr.beat
    nbar = int(SECONDS / (4 * b)) + 1
    for i in range(nbar):
        t0 = i * 4 * b
        r = hz(roots[i % 4])
        tr.add("bass", tr.sub(r, 1.4 * b) * 0.5, t0)
        tr.add("bass", tr.sub(r, 0.9 * b) * 0.4, t0 + 2.5 * b)
        if i < 2:
            continue
        for k in (0, 2.5):
            tr.add("drums", tr.kick(0.9), t0 + k * b)
            tr.kicks.append(t0 + k * b)
        for s in (1, 3):
            tr.add("drums", tr.snare(180), t0 + s * b)
        for e in range(8):
            sw = 0.09 * b if e % 2 else 0
            tr.add("drums", tr.hat() * (0.8 if e % 2 else 1), t0 + e * b / 2 + sw)
        if i % 2 == 1:
            for j, n in enumerate(["C5", "A4", "G4"]):
                tr.add("lead", tr.bell(hz(n), 1.0) * 0.12, t0 + (2 + j * 0.5) * b)
    return tr.mix({"drums": 0.8, "bass": 0.9, "keys": 1.0, "lead": 0.8}, duck=0.35, hi=5500, crackle=0.25)


def chill():
    """Chillhop 95 BPM: pad ấm, giai điệu pluck ngũ cung, trống nhẹ."""
    tr = Track(95, 2)
    ch = [["A3", "C4", "E4", "G4"], ["F3", "A3", "C4", "E4"], ["C3", "E3", "G3", "B3"], ["G3", "B3", "D4", "F#4"]]
    roots = ["A1", "F1", "C2", "G1"]
    chords_loop(tr, ch, 4, tr.pad, "keys", 0.16)
    b = tr.beat
    scale = ["A4", "C5", "D5", "E5", "G5", "A5"]
    nbar = int(SECONDS / (4 * b)) + 1
    for i in range(nbar):
        t0 = i * 4 * b
        tr.add("bass", tr.sub(hz(roots[i % 4]), 3.6 * b) * 0.55, t0)
        pat = tr.rng.choice(len(scale), 6)
        for j, pos in enumerate([0, 0.75, 1.5, 2, 2.75, 3.5]):
            if tr.rng.random() < 0.8:
                tr.add("lead", tr.pluck(hz(scale[pat[j]]), 0.5) * 0.18, t0 + pos * b)
        if i < 2:
            continue
        for k in (0, 1.5, 2.5):
            tr.add("drums", tr.kick(0.85), t0 + k * b)
            tr.kicks.append(t0 + k * b)
        for s in (1, 3):
            tr.add("drums", tr.snare(210) * 0.8, t0 + s * b)
        for e in range(16):
            tr.add("drums", tr.hat() * (0.9 if e % 4 == 2 else 0.45), t0 + e * b / 4)
    return tr.mix({"drums": 0.75, "bass": 0.8, "keys": 1.0, "lead": 0.9}, duck=0.45, hi=8000, crackle=0.08)


def house():
    """Deep house nhẹ 118 BPM: kick 4/4, hat mở phách nghịch, hợp âm piano chặt, bass nảy."""
    tr = Track(118, 3)
    ch = [["D4", "F4", "A4", "C5"], ["Bb3", "D4", "F4", "A4"], ["F3", "A3", "C4", "E4"], ["C4", "E4", "G4", "Bb4"]]
    roots = ["D2", "Bb1", "F2", "C2"]
    b = tr.beat
    nbar = int(SECONDS / (4 * b)) + 1
    for i in range(nbar):
        t0 = i * 4 * b
        c = ch[(i // 2) % 4]
        r = hz(roots[(i // 2) % 4])
        for pos in (0.5, 1.5, 2.75, 3.5):
            for n in c:
                tr.add("keys", tr.pluck(hz(n), 0.35) * 0.12, t0 + pos * b)
        for beat in range(4):
            tr.add("bass", tr.sub(r, 0.4 * b) * 0.55, t0 + (beat + 0.5) * b)
        if i < 2:
            continue
        for beat in range(4):
            tr.add("drums", tr.kick(0.95), t0 + beat * b)
            tr.kicks.append(t0 + beat * b)
            tr.add("drums", tr.hat(open_=True) * 0.7, t0 + (beat + 0.5) * b)
            if beat in (1, 3):
                tr.add("drums", tr.snare(230) * 0.5, t0 + beat * b)
        if i % 4 == 3:
            for j, n in enumerate(["A5", "G5", "F5", "D5"]):
                tr.add("lead", tr.bell(hz(n), 0.8) * 0.08, t0 + j * 0.75 * b)
    return tr.mix({"drums": 0.8, "bass": 0.85, "keys": 1.0, "lead": 0.9}, duck=0.55, hi=10000)


def tech():
    """Công nghệ tối giản 100 BPM: nhịp tíc tắc, sub đều, pad trong, chuông arpeggio."""
    tr = Track(100, 4)
    ch = [["E3", "B3", "D4", "G4"], ["C3", "G3", "B3", "E4"], ["G3", "D4", "F#4", "B4"], ["D3", "A3", "C#4", "F#4"]]
    roots = ["E1", "C2", "G1", "D2"]
    chords_loop(tr, ch, 8, tr.pad, "keys", 0.13)
    b = tr.beat
    nbar = int(SECONDS / (4 * b)) + 1
    for i in range(nbar):
        t0 = i * 4 * b
        c = ch[(i // 2) % 4]
        for e in range(8):
            n = c[[0, 1, 2, 3, 2, 1, 3, 2][e]]
            tr.add("lead", tr.bell(hz(n) * 2, 0.6) * 0.07, t0 + e * b / 2)
        tr.add("bass", tr.sub(hz(roots[(i // 2) % 4]), 0.45 * b) * 0.6, t0)
        tr.add("bass", tr.sub(hz(roots[(i // 2) % 4]), 0.45 * b) * 0.5, t0 + 2.5 * b)
        if i < 2:
            continue
        for k in (0, 2.5):
            tr.add("drums", tr.kick(0.8), t0 + k * b)
            tr.kicks.append(t0 + k * b)
        tr.add("drums", tr.snare(260) * 0.55, t0 + 3 * b)
        for e in range(16):
            tr.add("drums", tr.hat() * (0.55 if e % 2 else 0.3), t0 + e * b / 4)
    return tr.mix({"drums": 0.75, "bass": 0.9, "keys": 1.0, "lead": 0.9}, duck=0.4, hi=9000)


STYLES = {"lofi": lofi, "chill": chill, "house": house, "tech": tech}


def save(path, data):
    pcm = (np.clip(data, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(np.column_stack([pcm, pcm]).ravel().tobytes())


def build(out_dir, names=None):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    made = []
    for name in names or STYLES:
        with tempfile.TemporaryDirectory() as tmp:
            raw = Path(tmp) / "raw.wav"
            save(raw, STYLES[name]())
            dst = out_dir / f"nhac-{name}.wav"
            # Thêm chút vang cho không gian, chuẩn hoá âm lượng
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af",
                            "aecho=0.8:0.5:60|110:0.18|0.1,loudnorm=I=-19:TP=-2:LRA=9", "-ar", str(SR), str(dst)], check=True)
        made.append(dst)
    return made


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "video/public"
    for p in build(out, sys.argv[2:] or None):
        print(p)
