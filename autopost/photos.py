"""Tìm và tải ảnh minh họa miễn phí bản quyền (CC0 / Public Domain) qua Openverse cho video.

Nguồn ưu tiên: rawpixel và WordPress Photo Directory (ảnh kiểu stock, CC0). Không cần khóa API.

Ví dụ:
  python3 -m autopost.photos "latte coffee"                 # in URL các ảnh tìm được
  python3 -m autopost.photos resolve <video.json>           # tải mọi ảnh "photo:..." trong kịch bản vào video/public/photos/

Trong kịch bản, mọi chuỗi bắt đầu bằng "photo:" (ví dụ "photo:latte coffee" hoặc "photo:latte coffee#2" để lấy ảnh thứ 3)
được thay bằng đường dẫn file ảnh đã tải, và danh sách nguồn ảnh được ghi vào trường "credits".
"""

import hashlib
import json
import os
import sys
from pathlib import Path

import requests

API = "https://api.openverse.org/v1/images/"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "video" / "public" / "photos"
UA = {"User-Agent": "Design24AutoPost/1.0 (+https://design24.vn)"}


def search(query, n=10, orientation=None):
    params = {"q": query, "license": "cc0,pdm", "source": "rawpixel,wordpress", "page_size": 20, "size": "large", "mature": "false"}
    if orientation:
        params["aspect_ratio"] = orientation  # tall | wide | square
    r = requests.get(API, params=params, headers=UA, timeout=30)
    r.raise_for_status()
    res = [x for x in r.json()["results"] if (x.get("width") or 0) >= 1000]
    if not res and orientation:
        return search(query, n)
    return res[:n]


# Nhật ký ảnh đã dùng (PHOTO_LOG, mỗi dòng "<bài>\t<url>"): ảnh đã dùng ở bài khác thì bỏ qua, để các video không lặp ảnh.
LOG = os.environ.get("PHOTO_LOG")
TAG = os.environ.get("PHOTO_TAG", "")


def _used_elsewhere():
    if not LOG or not Path(LOG).exists():
        return set()
    return {ln.split("\t", 1)[1].strip() for ln in Path(LOG).read_text(encoding="utf-8").splitlines() if "\t" in ln and ln.split("\t", 1)[0] != TAG}


def _log(url):
    if LOG and url:
        Path(LOG).parent.mkdir(parents=True, exist_ok=True)
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(f"{TAG}\t{url}\n")


def fetch(spec):
    """'latte coffee#2' -> (đường dẫn trong public, thông tin nguồn)."""
    query, _, idx = spec.partition("#")
    idx = int(idx or 0)
    key = hashlib.md5((spec + "|" + TAG).encode()).hexdigest()[:10]
    OUT.mkdir(parents=True, exist_ok=True)
    meta_path = OUT / f"{key}.json"
    if meta_path.exists():
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        return f"photos/{key}.jpg", meta
    res = search(query.strip())
    used = _used_elsewhere()
    res = [x for x in res if x.get("foreign_landing_url") not in used] or res
    if not res:
        raise SystemExit(f"Không tìm thấy ảnh cho '{query}'")
    pick = res[min(idx, len(res) - 1)]
    img = requests.get(pick["url"], headers=UA, timeout=60)
    img.raise_for_status()
    raw = OUT / f"{key}.src"
    raw.write_bytes(img.content)
    # Chuẩn hoá về JPEG cạnh dài 1600 px cho nhẹ
    import subprocess

    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-vf", "scale='if(gt(iw,ih),1600,-2)':'if(gt(iw,ih),-2,1600)'", "-q:v", "3", str(OUT / f"{key}.jpg")], check=True)
    raw.unlink()
    meta = {"query": query, "title": pick.get("title"), "creator": pick.get("creator"), "source": pick.get("source"), "license": pick.get("license"), "url": pick.get("foreign_landing_url")}
    meta_path.write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")
    _log(meta["url"])
    return f"photos/{key}.jpg", meta


def resolve(obj, credits):
    if isinstance(obj, str) and obj.startswith("photo:"):
        path, meta = fetch(obj[6:])
        credits.append(meta)
        return path
    if isinstance(obj, list):
        return [resolve(x, credits) for x in obj]
    if isinstance(obj, dict):
        return {k: resolve(v, credits) for k, v in obj.items()}
    return obj


def resolve_file(path, out=None):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    credits = []
    data = resolve(data, credits)
    seen = set()
    data["credits"] = [c for c in credits if not (c["url"] in seen or seen.add(c["url"]))]
    Path(out or path).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return data


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "resolve":
        d = resolve_file(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
        print(json.dumps(d.get("credits", []), ensure_ascii=False, indent=1))
    else:
        for r in search(" ".join(sys.argv[1:])):
            print(r["source"], r["width"], r["height"], r["url"])
