"""Tạo giọng đọc Vbee cho video "Kiến thức thiết kế" (mỗi cảnh một câu, khớp với cảnh trong video).

Lời đọc lấy từ trường "say" của từng cảnh trong JSON (examples/kienthuc-mau.json), đổi chữ viết tắt,
tên tiếng Anh sang cách đọc theo assets/phat-am.json; phụ đề trên hình vẫn giữ chữ viết gốc.

Xác thực: Network secret của môi trường Claude cho host api.vbee.vn gắn sẵn 2 header
Authorization: Bearer <token> và App-Id: <app id>. Chạy ở nơi khác thì đặt VBEE_TOKEN và VBEE_APP_ID.
Giọng: --voice hoặc biến môi trường VBEE_VOICE (mặc định giọng clone Hoài Anh bản quảng cáo).

Ví dụ:
  python3 render/voice.py examples/kienthuc-mau.json --dry-run          # chỉ in lời đọc
  python3 render/voice.py examples/kienthuc-mau.json --out /tmp/props.json
  python3 render/voice.py voices                                         # liệt kê giọng
Kết quả --out là JSON có thêm trường "voice" để truyền cho render/video.sh.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

import requests

API = "https://api.vbee.vn/v1/tts"
VOICES_API = "https://vbee.vn/api/public/v1/voices"
LEGACY_API = "https://vbee.vn/api/v1/tts"
DEFAULT_VOICE = "s_cantho_male_nghoaianh_zero_shot_advertise_vc"  # giọng clone Hoài Anh (quảng cáo)
DEFAULT_SPEED = "1.0"
MAX_CHARS = 300
ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "video" / "public"

ABBR = [  # viết tắt trên hình -> cách đọc
    (r"\bUI/UX\b", "giao diện và trải nghiệm người dùng"),
    (r"\bUX/UI\b", "trải nghiệm và giao diện người dùng"),
    (r"&", "và"),
    (r"\s*\(([^)]*)\)", r", \1,"),
    (r"(\d+)\s*%", r"\1 phần trăm"),
    (r"\bTP\. ?HCM\b", "Thành phố Hồ Chí Minh"),
]

DIGITS = "không một hai ba bốn năm sáu bảy tám chín".split()


def spoken(text):
    text = text.replace("24/7", "hai bốn trên bảy")
    for pat, rep in ABBR:
        text = re.sub(pat, rep, text)
    text = re.sub(r"(\d+)\s*[–-]\s*(\d+)", r"\1 đến \2", text)
    text = re.sub(r",\s*([,.])", r"\1", text)
    text = re.sub(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b", r"\1 tháng \2 năm \3", text)
    text = re.sub(r"\b(\d{1,2})/(\d{1,2})\b", r"\1 tháng \2", text)
    text = re.sub(r"\s+", " ", text).strip()
    # Viết hoa chữ đầu mỗi câu
    return re.sub(r"(^|[.!?]\s+)(\w)", lambda m: m.group(1) + m.group(2).upper(), text)


PRON = json.loads((ROOT / "assets" / "phat-am.json").read_text(encoding="utf-8"))


def _sub_words(text, table):
    for k in sorted(table, key=len, reverse=True):
        # Viết tắt in hoa (AI, UI, HCM) chỉ khớp đúng chữ hoa, để "không ai" không bị đọc thành "ây ai".
        flags = 0 if k.isupper() else re.I
        text = re.sub(r"(?<![\w.])" + re.escape(k) + r"(?![\w])", table[k], text, flags=flags)
    return text


def script(d):
    """Lời đọc từng cảnh, đúng thứ tự cảnh trong video/src/kienthuc/KienThuc.tsx: danh sách (lời đọc, phụ đề).
    Lời đọc thay từ tiếng Anh bằng cách đọc trong assets/phat-am.json; phụ đề giữ chữ viết gốc (Design24, video...)."""
    out = []
    for s in d["scenes"]:
        translated = _sub_words(s["say"], PRON["dich"])
        out.append((spoken(_sub_words(translated, PRON["doc"])), spoken(translated)))
    return out


def _headers():
    h = {"Content-Type": "application/json"}
    if os.environ.get("VBEE_APP_ID"):
        h["App-Id"] = os.environ["VBEE_APP_ID"]
    if os.environ.get("VBEE_TOKEN"):
        h["Authorization"] = f"Bearer {os.environ['VBEE_TOKEN']}"
    return h


def _download(url, path):
    r = requests.get(url, timeout=120)
    r.raise_for_status()
    path.write_bytes(r.content)


def tts_batch(text, voice, path, speed=1.0):
    """Batch API (mode async): dùng cho giọng clone mà Realtime API chưa hỗ trợ. Hỏi lại kết quả mỗi 2 giây."""
    r = requests.post(API, headers=_headers(), timeout=120, json={
        "text": text, "mode": "async", "voiceCode": voice, "outputFormat": "mp3", "bitrate": 128, "speed": speed,
        "webhookUrl": "https://example.com/vbee-webhook"})
    if not r.ok:
        raise SystemExit(f"Vbee batch lỗi: {r.status_code} {r.text[:300]}")
    rid = r.json().get("requestId") or r.json().get("result", {}).get("requestId")
    for _ in range(90):
        time.sleep(2)
        g = requests.get(f"{API}/requests/{rid}", headers=_headers(), timeout=60)
        if not g.ok:
            continue
        body = g.json()
        body = body.get("result", body)
        if body.get("status") == "COMPLETED" and body.get("audioLink"):
            _download(body["audioLink"], path)
            return
        if body.get("status") == "FAILED":
            raise SystemExit(f"Vbee batch thất bại: {json.dumps(body, ensure_ascii=False)[:300]}")
    raise SystemExit(f"Vbee batch quá thời gian chờ (request {rid})")


def tts_legacy(text, voice, path, speed=1.0):
    """API cũ trên vbee.vn (cần Network secret cho host vbee.vn và biến VBEE_APP_ID hoặc header App-Id)."""
    body = {"app_id": os.environ.get("VBEE_APP_ID", ""), "response_type": "indirect", "callback_url": "https://example.com/vbee-webhook",
            "input_text": text, "voice_code": voice, "audio_type": "mp3", "bitrate": 128, "speed_rate": round(speed, 1)}
    r = requests.post(LEGACY_API, headers=_headers(), timeout=120, json=body)
    if not r.ok or r.json().get("status") != 1:
        raise SystemExit(f"Vbee (API cũ) lỗi: {r.status_code} {r.text[:300]}")
    rid = r.json()["result"]["request_id"]
    for _ in range(90):
        time.sleep(2)
        g = requests.get(f"{LEGACY_API}/{rid}", headers=_headers(), timeout=60)
        if not g.ok:
            continue
        res = g.json().get("result", {})
        if res.get("status") == "SUCCESS" and res.get("audio_link"):
            _download(res["audio_link"], path)
            return
        if res.get("status") == "FAILURE":
            raise SystemExit(f"Vbee (API cũ) thất bại: {json.dumps(res, ensure_ascii=False)[:300]}")
    raise SystemExit(f"Vbee (API cũ) quá thời gian chờ (request {rid})")


def tts(text, voice, path, speed=1.0):
    """Thử Realtime API; giọng nào Realtime báo không có (thường là giọng clone) thì chuyển sang Batch, rồi API cũ."""
    last = None
    for attempt in range(1, 4):
        try:
            r = requests.post(API, headers=_headers(), timeout=120, json={
                "text": text, "mode": "sync", "voiceCode": voice, "outputFormat": "mp3", "bitrate": 128, "speed": speed})
        except requests.RequestException as exc:
            last = str(exc)
        else:
            if r.ok and not r.headers.get("content-type", "").startswith("application/json"):
                path.write_bytes(r.content)
                return
            last = f"{r.status_code} {r.text[:300]}"
            if r.status_code == 400 and "voice" in r.text.lower():
                break
            if r.status_code < 500 and r.status_code != 429:
                raise SystemExit(f"Vbee lỗi: {last}")
        time.sleep(2 ** attempt)
    errors = [f"realtime: {last}"]
    for fn in (tts_batch, tts_legacy):
        try:
            fn(text, voice, path, speed)
            return
        except (SystemExit, requests.RequestException) as exc:
            errors.append(f"{fn.__name__}: {exc}")
    raise SystemExit("Vbee lỗi với mọi API: " + " | ".join(errors))


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         check=True, capture_output=True, text=True).stdout
    return float(out.strip())


def list_voices(ownership=None):
    out, cursor = [], None
    while True:
        params = {"limit": 100}
        if ownership:
            params["voice_ownership"] = ownership
        if cursor:
            params["cursor"] = cursor
        r = requests.get(VOICES_API, headers=_headers(), params=params, timeout=60)
        r.raise_for_status()
        res = r.json()["result"]
        out += res["voices"]
        cursor = res.get("pagination", {}).get("next_cursor")
        if not res.get("pagination", {}).get("has_next_page") or not cursor:
            return out


def voices():
    for own in ("PERSONAL", None):
        for v in list_voices(own):
            print(f"{own or 'ALL'}\t{v['code']}\t{v['name']}\t{v.get('gender')}")


def resolve_voice(voice):
    """Nhận mã giọng hoặc tên giọng (vd. giọng clone "Nguyễn Hoài Anh") và trả về mã giọng."""
    if "_" in voice or "-" in voice:
        return voice
    for own in ("PERSONAL", None):
        for v in list_voices(own):
            if v["name"].strip().lower() == voice.strip().lower() or voice.lower() in v["name"].lower():
                return v["code"]
    raise SystemExit(f"Không tìm thấy giọng '{voice}' trong Vbee")


def main(argv=None):
    if argv is None:
        argv = sys.argv[1:]
    if argv and argv[0] == "voices":
        voices()
        return 0
    p = argparse.ArgumentParser(prog="render/voice.py")
    p.add_argument("json")
    p.add_argument("--out", help="ghi JSON bảng tin kèm trường voice")
    p.add_argument("--voice", default=os.environ.get("VBEE_VOICE", DEFAULT_VOICE))
    p.add_argument("--speed", type=float, default=float(os.environ.get("VBEE_SPEED", DEFAULT_SPEED)))
    p.add_argument("--dry-run", action="store_true", help="chỉ in lời đọc, không gọi Vbee")
    a = p.parse_args(argv)
    data = json.loads(Path(a.json).read_text(encoding="utf-8"))
    lines = script(data)
    if a.dry_run:
        for i, (line, sub) in enumerate(lines):
            print(f"[{i}] ({len(line)} ký tự) {line}")
            print(f"     phụ đề: {sub}")
        return 0
    voice = resolve_voice(a.voice)
    slug = time.strftime("%Y%m%d-%H%M%S")
    folder = PUBLIC / "voice" / slug
    folder.mkdir(parents=True, exist_ok=True)
    data["voice"] = []
    for i, (line, sub) in enumerate(lines):
        f = folder / f"{i}.mp3"
        tts(line, voice, f, a.speed)
        data["voice"].append({"src": f"voice/{slug}/{i}.mp3", "dur": round(duration(f), 2), "text": sub})
    Path(a.out).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(a.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
