"""Giữ cho video Design24 không đơn điệu: tự chọn phong cách hình ảnh và kiểm tra luật đa dạng.

- chon_phong_cach(): mỗi bài một phong cách (bảng màu, phông, họa tiết, phụ đề, chuyển cảnh trong
  video/src/studio/looks.ts), không trùng 5 bài gần nhất trong cùng thư mục `bai/`.
- kiem_tra(): soát kịch bản theo luật đa dạng trong ROUTINE.md và so với bài liền trước.
  autopost.run gọi cả hai trước khi dựng; vi phạm thì dừng, không dựng, không đăng.

Dùng riêng:
  python3 -m autopost.dadang <thư mục bài>      # in phong cách sẽ dùng và các lỗi đa dạng (nếu có)
"""

import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOOKS_TS = ROOT / "video" / "src" / "studio" / "looks.ts"
RECENT = 5


def look_ids():
    return re.findall(r'^ {2}"([a-z-]+)": \{', LOOKS_TS.read_text(encoding="utf-8"), re.M)


def _studio_specs_before(folder):
    """Kịch bản Studio của các bài trước (cùng thư mục cha, tên nhỏ hơn), cũ đến mới."""
    folder = Path(folder).resolve()
    out = []
    for d in sorted(p for p in folder.parent.iterdir() if p.is_dir() and p.name < folder.name):
        f = d / "video.json"
        try:
            spec = json.loads(f.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if spec.get("template") == "studio":
            out.append((d.name, spec))
    return out


def chon_phong_cach(folder, spec, force=None):
    """Phong cách cho bài này. Kịch bản có ghi "look" thì giữ, trừ khi trùng 5 bài gần nhất
    (khi đó tự chọn cái khác). `force` thì dùng đúng phong cách đó."""
    ids = look_ids()
    if force:
        if force not in ids:
            raise SystemExit(f"Không có phong cách {force!r}. Có: {', '.join(ids)}")
        return force
    recent = [s.get("look") for _, s in _studio_specs_before(folder)][-RECENT:]
    if spec.get("look") in ids and spec["look"] not in recent:
        return spec["look"]
    pool = [i for i in ids if i not in recent] or ids
    h = int(hashlib.sha1(Path(folder).resolve().name.encode()).hexdigest(), 16)
    return pool[h % len(pool)]


def _kinds(scene):
    specs = [scene["spec"]] if isinstance(scene.get("spec"), dict) else []
    specs += [s for s in scene.get("specs", []) if isinstance(s, dict)]
    return [s.get("kind") for s in specs if s.get("kind")]


def kiem_tra(folder, spec):
    """Danh sách lỗi đa dạng (rỗng là đạt)."""
    if spec.get("template") != "studio":
        return []
    err = []
    scenes = spec.get("scenes", [])
    types = [s.get("type") for s in scenes]
    if not 8 <= len(scenes) <= 12:
        err.append(f"Cần 8 đến 12 cảnh, đang có {len(scenes)}.")
    distinct = set(types) - {"cta"}
    if len(distinct) < 4:
        err.append(f"Cần ít nhất 4 loại cảnh khác nhau (không tính cta), đang có {len(distinct)}: {sorted(distinct)}.")
    for t, n in Counter(types).items():
        if n > 3:
            err.append(f"Loại cảnh '{t}' dùng {n} lần (tối đa 3).")
    for i in range(1, len(types)):
        if types[i] == types[i - 1]:
            err.append(f"Cảnh {i} và {i + 1} cùng loại '{types[i]}': đổi loại hoặc chèn cảnh khác vào giữa.")
    kinds = [k for s in scenes for k in _kinds(s)]
    if len(set(kinds)) < 3:
        err.append(f"Cần ít nhất 3 loại mẫu thiết kế (kind) khác nhau, đang có {sorted(set(kinds))}.")
    prev = _studio_specs_before(folder)
    if prev:
        pname, p = prev[-1]
        ptypes = [s.get("type") for s in p.get("scenes", [])]
        if ptypes and types and ptypes[0] == types[0]:
            err.append(f"Mở đầu bằng cảnh '{types[0]}' giống bài trước ({pname}): đổi kiểu mở đầu.")
        pk = Counter(k for s in p.get("scenes", []) for k in _kinds(s)).most_common(1)
        ck = Counter(kinds).most_common(1)
        if pk and ck and pk[0][0] == ck[0][0]:
            err.append(f"Loại mẫu chính '{ck[0][0]}' trùng bài trước ({pname}): chọn mẫu chính khác.")
        same = sum(1 for a, b in zip(types, ptypes) if a == b)
        if types and same >= len(types) / 2:
            err.append(f"Thứ tự cảnh giống bài trước ({pname}) ở {same}/{len(types)} vị trí: xếp lại cách kể.")
    return err


def main(argv=None):
    argv = argv if argv is not None else sys.argv[1:]
    if not argv:
        print(__doc__)
        return 2
    folder = Path(argv[0])
    spec = json.loads((folder / "video.json").read_text(encoding="utf-8"))
    print("Phong cách:", chon_phong_cach(folder, spec))
    err = kiem_tra(folder, spec)
    for e in err:
        print("-", e)
    print("Đạt luật đa dạng." if not err else f"{len(err)} lỗi đa dạng: sửa video.json rồi chạy lại.")
    return 0 if not err else 1


if __name__ == "__main__":
    sys.exit(main())
