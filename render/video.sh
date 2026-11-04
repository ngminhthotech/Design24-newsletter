#!/usr/bin/env bash
# Dựng video "Kiến thức thiết kế" từ JSON (Remotion: mẫu Artboard nếu JSON có "palettes", ngược lại mẫu KienThuc), có nhạc nền, phụ đề, chuẩn âm lượng -14 LUFS.
# Cách dùng: render/video.sh examples/kienthuc-mau.json out/video.mp4 [--voice]
#   --voice: thêm giọng đọc Vbee (cần khóa Vbee trong môi trường, xem render/voice.py).
#   Không có --voice: phụ đề chạy theo tốc độ đọc ước lượng, chỉ có nhạc nền.
set -euo pipefail
json="$(realpath "$1")"; out="$(realpath -m "$2")"; voice="${3:-}"
root="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$(dirname "$out")"
cd "$root/video"
[ -d node_modules ] || npm ci --no-audit --no-fund >/dev/null
[ -f public/music.wav ] || python3 "$root/render/music.py" public/ >/dev/null
comp="$(python3 -c 'import json,sys; print("Artboard" if "palettes" in json.load(open(sys.argv[1])) else "KienThuc")' "$json")"
tmp="$(mktemp -d)"
if [ "$voice" = "--voice" ]; then
  python3 "$root/render/voice.py" "$json" --out "$tmp/props.json" >/dev/null
  json="$tmp/props.json"
fi
npx remotion render "$comp" "$tmp/raw.mp4" --props="$json" --codec=h264 --crf=20 --log=error
ffmpeg -y -loglevel error -i "$tmp/raw.mp4" -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -movflags +faststart "$out"
rm -rf "$tmp"
echo "$out"
