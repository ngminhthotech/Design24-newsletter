"""Chạy trọn luồng cho một bài: giọng Vbee -> dựng video -> nén -> tải lên (URL công khai) -> lên lịch Buffer 3 kênh.

Thư mục bài (vd. /mnt/project-files/design24-auto-post/bai/2026-11-05-1130/) cần có:
  video.json              kịch bản (mẫu Artboard, xem examples/artboard-*.json)
  caption-facebook.txt    chú thích Facebook
  caption-tiktok.txt      chú thích TikTok
  youtube-tieude.txt      tiêu đề YouTube (dưới 100 ký tự, có #Shorts)
  youtube-mota.txt        mô tả YouTube

Ví dụ:
  python3 -m autopost.run <thư mục> --dry-run                       # chỉ dựng video, không tải lên, không gọi Buffer
  python3 -m autopost.run <thư mục> --draft                         # lưu nháp trong Buffer (không đăng)
  python3 -m autopost.run <thư mục> --at 2026-11-05T11:30:00+07:00  # hẹn giờ đăng
  python3 -m autopost.run <thư mục> --now                           # đăng ngay

Kết quả ghi vào <thư mục>/ket-qua.json. Chỉ đăng khi channels.json có "confirmed": true và mỗi id kênh
khớp đúng tên, đúng mạng trong tài khoản Buffer (tránh đăng nhầm sang thương hiệu khác).
"""

import argparse
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path

from autopost import buffer, dadang, media

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "render"))
import tracks  # noqa: E402,F401

MUSIC = "nhac-marimba.wav"

ROOT = Path(__file__).resolve().parent.parent
CHANNELS = ROOT / "channels.json"
SERVICES = ("facebook", "tiktok", "youtube")


def sh(*cmd, **kw):
    print("+", " ".join(map(str, cmd)), file=sys.stderr)
    return subprocess.run(list(map(str, cmd)), check=True, **kw)


def compress(src, dst, crf, maxrate):
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", src, "-c:v", "libx264", "-preset", "slow", "-crf", crf,
       "-maxrate", maxrate, "-bufsize", "3M", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", dst)


def checked_channels():
    """Đọc channels.json và đối chiếu với kênh thật trong Buffer. Sai bất kỳ điều gì thì dừng."""
    cfg = json.loads(CHANNELS.read_text(encoding="utf-8"))
    if not cfg.get("confirmed"):
        raise SystemExit("channels.json chưa có \"confirmed\": true. Chưa được phép đăng.")
    live = {c["id"]: c for c in buffer.channels()}
    out = {}
    for svc in SERVICES:
        want = cfg.get(svc) or {}
        ch = live.get(want.get("id", ""))
        if not ch:
            raise SystemExit(f"Không thấy kênh {svc} id={want.get('id')!r} trong tài khoản Buffer đang dùng. Kiểm tra khóa API.")
        if ch["service"] != svc or ch["name"].strip() != want.get("name", "").strip():
            raise SystemExit(f"Kênh {svc} không khớp: Buffer báo {ch['service']} / {ch['name']!r}, channels.json ghi {want.get('name')!r}.")
        out[svc] = ch["id"]
    return out


def to_utc(at):
    t = dt.datetime.fromisoformat(at)
    if t.tzinfo is None:
        t = t.replace(tzinfo=dt.timezone(dt.timedelta(hours=7)))  # mặc định giờ Việt Nam
    return t.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def main(argv=None):
    p = argparse.ArgumentParser(prog="autopost.run")
    p.add_argument("folder")
    p.add_argument("--at", help="giờ đăng ISO 8601 (không ghi múi giờ thì hiểu là giờ Việt Nam)")
    p.add_argument("--now", action="store_true", help="đăng ngay")
    p.add_argument("--draft", action="store_true", help="chỉ lưu nháp trong Buffer")
    p.add_argument("--dry-run", action="store_true", help="chỉ dựng video, không tải lên, không gọi Buffer")
    p.add_argument("--no-voice", action="store_true", help="dựng không có giọng (thử nhanh)")
    p.add_argument("--rerender", action="store_true", help="dựng lại dù đã có video.mp4")
    p.add_argument("--look", help="ép phong cách hình ảnh (xem video/src/studio/looks.ts); mặc định tự chọn khác 5 bài gần nhất")
    a = p.parse_args(argv)
    if not (a.dry_run or a.draft or a.at or a.now):
        p.error("chọn một trong --dry-run, --draft, --now hoặc --at")

    folder = Path(a.folder).resolve()
    text = {name: (folder / name).read_text(encoding="utf-8").strip() for name in
            ("caption-facebook.txt", "caption-tiktok.txt", "youtube-tieude.txt", "youtube-mota.txt")}
    result = {"folder": str(folder), "at": a.at, "draft": a.draft, "posts": {}, "errors": {}}

    # Kiểm tra kênh trước khi tốn thời gian dựng video
    chans = None if a.dry_run else checked_channels()

    video = folder / "video.mp4"
    if a.rerender or not video.exists():
        # Nhạc nền mặc định: bản marimba tự tạo (render/tracks.py), người dùng chọn ngày 04/11/2026
        spec = json.loads((folder / "video.json").read_text(encoding="utf-8"))
        if "palettes" in spec and not spec.get("music"):
            spec["music"] = MUSIC
            (folder / "video.json").write_text(json.dumps(spec, ensure_ascii=False, indent=2), encoding="utf-8")
        # Chống đơn điệu: mỗi bài một phong cách hình ảnh khác các bài gần nhất, và kịch bản phải qua luật đa dạng
        if spec.get("template") == "studio":
            look = dadang.chon_phong_cach(folder, spec, force=a.look)
            if spec.get("look") != look:
                spec["look"] = look
                (folder / "video.json").write_text(json.dumps(spec, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"Phong cách hình ảnh: {look}", file=sys.stderr)
            problems = dadang.kiem_tra(folder, spec)
            if problems:
                raise SystemExit("Kịch bản chưa đạt luật đa dạng, chưa dựng:\n- " + "\n- ".join(problems) + "\nSửa video.json rồi chạy lại.")
        # Ảnh minh họa: ghi nhật ký ảnh đã dùng cạnh thư mục bài để các video sau không lặp ảnh
        os.environ.setdefault("PHOTO_LOG", str(folder.parent.parent / "anh-da-dung.tsv"))
        os.environ["PHOTO_TAG"] = folder.name
        args = [ROOT / "render" / "video.sh", folder / "video.json", video] + ([] if a.no_voice else ["--voice"])
        sh(*args)
    files = {"fb": folder / "video-fb-yt.mp4", "tt": folder / "video-tiktok.mp4"}
    compress(video, files["fb"], "28", "1.0M")
    compress(video, files["tt"], "30", "0.7M")
    if a.dry_run:
        result["video"] = str(video)
        (folder / "ket-qua.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps({"ok": True, **result}, ensure_ascii=False))
        return 0

    sub = folder.name
    urls = media.publish([files["fb"], files["tt"]], sub, repo_dir=ROOT)
    url_fb, url_tt = urls[files["fb"].name], urls[files["tt"].name]
    result["urls"] = urls
    due = to_utc(a.at) if a.at and not a.draft else None
    title_yt = text["youtube-tieude.txt"][:100]
    jobs = {
        "facebook": (text["caption-facebook.txt"], url_fb, buffer.default_metadata("facebook", video=True)),
        "tiktok": (text["caption-tiktok.txt"], url_tt, buffer.default_metadata("tiktok", title_yt.replace("#Shorts", "").strip()[:90])),
        "youtube": (text["youtube-mota.txt"], url_fb, buffer.default_metadata("youtube", title_yt, video=True)),
    }
    for svc, (caption, url, meta) in jobs.items():
        for attempt in (1, 2):
            try:
                result["posts"][svc] = buffer.create_post(chans[svc], caption, video_url=url, due_at=due, metadata=meta, draft=a.draft)
                result["errors"].pop(svc, None)
                break
            except buffer.BufferError as exc:
                result["errors"][svc] = str(exc)
    (folder / "ket-qua.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"ok": not result["errors"], **result}, ensure_ascii=False))
    return 0 if not result["errors"] else 1


if __name__ == "__main__":
    sys.exit(main())
