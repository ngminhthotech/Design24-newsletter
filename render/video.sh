#!/usr/bin/env bash
# Dựng video "Kiến thức thiết kế" từ JSON (Remotion: mẫu Studio nếu JSON có "template": "studio", Artboard nếu có "palettes", ngược lại KienThuc), có nhạc nền, phụ đề, chuẩn âm lượng -14 LUFS.
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
[ -f public/nhac-lofi.wav ] || python3 "$root/render/tracks.py" public/ >/dev/null
comp="$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print("Studio" if d.get("template")=="studio" else "Artboard" if "palettes" in d else "KienThuc")' "$json")"
tmp="$(mktemp -d)"
# Ảnh minh họa "photo:<từ khóa>" -> tải ảnh CC0 (Openverse) vào public/photos
if grep -q '"photo:' "$json"; then
  (cd "$root" && python3 -m autopost.photos resolve "$json" "$tmp/photos.json" >/dev/null)
  json="$tmp/photos.json"
fi
if [ "$voice" = "--voice" ]; then
  python3 "$root/render/voice.py" "$json" --out "$tmp/props.json" >/dev/null
  json="$tmp/props.json"
fi
npx remotion render "$comp" "$tmp/raw.mp4" --props="$json" --codec=h264 --crf=20 --log=error
# Outro thương hiệu "Bản tin Design24" (assets/outro-d24.mp4) nối vào cuối mọi video.
# Clip gốc 720x1080: phóng cho phủ kín khung dọc rồi cắt giữa (nền tím đồng màu nên không mất gì), đổi về 30 khung/giây.
# Bỏ outro: NO_OUTRO=1 render/video.sh ...
outro="$root/assets/outro-d24.mp4"
if [ -f "$outro" ] && [ -z "${NO_OUTRO:-}" ]; then
  probe() { ffprobe -v error -select_streams v:0 -show_entries "stream=$1" -of default=nw=1:nk=1 "$tmp/raw.mp4"; }
  W="$(probe width)"; H="$(probe height)"; fps="$(probe r_frame_rate)"
  ffmpeg -y -loglevel error -i "$tmp/raw.mp4" -i "$outro" -filter_complex "\
[0:v]fps=$fps,setsar=1,format=yuv420p[mv];\
[1:v]scale=$W:$H:force_original_aspect_ratio=increase,crop=$W:$H,fps=$fps,setsar=1,format=yuv420p[ov];\
[0:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo[ma];\
[1:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo[oa];\
[mv][ma][ov][oa]concat=n=2:v=1:a=1[v][a0];[a0]loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
    -map "[v]" -map "[a]" -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$out"
else
  ffmpeg -y -loglevel error -i "$tmp/raw.mp4" -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -movflags +faststart "$out"
fi
rm -rf "$tmp"
echo "$out"
