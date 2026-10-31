#!/usr/bin/env python3
"""
thỏ ăn cỏ - build.py  (GitHub Actions chạy tự động, xem .github/workflows/deploy.yml)

Chữ chương đã được đảo sẵn bởi công cụ đăng truyện, nên script này không đảo nữa. Việc nó làm:
1. Gom trang web, ảnh, font và các thư mục truyện vào public/.
2. Chỉ đưa lên những chương đã ĐẾN GIỜ (dòng trong list.txt có dạng  c5: Tiêu đề | 2026-11-03T20:00+07:00 ).
   Chương chưa đến giờ không có trong public/, nên không ai thấy được. Chương không ghi giờ thì đăng luôn.
3. Tạo data/stories.json và data/chapters.json cho trang chủ.
Chạy thử trên máy: python build.py
"""
import json, os, re, shutil, subprocess
from datetime import datetime, timedelta, timezone

OUT = "public"
SYSTEM = {"images", "fonts", "data", "public", "node_modules"}
SAFE = re.compile(r"^[A-Za-z0-9_-]{1,60}$")
LINE = re.compile(r"^([A-Za-z0-9_-]+)\s*:\s*(.*?)(?:\s*\|\s*(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?\s*(?:Z|[+-]\d{2}:?\d{2})?))?\s*$")
TIME = re.compile(r"^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)\s*(Z|[+-]\d{2}:?\d{2})?$")


def parse_time(s):
    m = TIME.match(s.strip())
    if not m:
        return None
    off = m.group(3) or "+07:00"          # không ghi múi giờ thì hiểu là giờ Việt Nam
    off = "+00:00" if off == "Z" else (off if ":" in off else off[:3] + ":" + off[3:])
    try:
        return datetime.fromisoformat(f"{m.group(1)}T{m.group(2)}{off}")
    except ValueError:
        return None


def git_date(path):
    try:
        out = subprocess.run(["git", "log", "--diff-filter=A", "--follow", "--format=%aI", "--", path],
                             capture_output=True, text=True).stdout.split()
        if out:
            return datetime.fromisoformat(out[-1])
    except Exception:
        pass
    return datetime.fromtimestamp(os.path.getmtime(path), timezone.utc)


def optimize_images():
    """Thu nhỏ và nén ảnh trong public/ (khung ảnh đại diện, ảnh đại diện, ảnh bìa...). Không có Pillow thì bỏ qua."""
    try:
        from PIL import Image
    except ImportError:
        print("Chưa cài Pillow nên bỏ qua bước nén ảnh (pip install pillow).")
        return
    saved = 0
    for root, _, files in os.walk(OUT):
        for f in files:
            if not f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                continue
            p = os.path.join(root, f)
            rel = p[len(OUT) + 1:].replace(os.sep, "/")
            limit = 600 if rel.startswith("images/frames/") else 500 if rel.startswith("images/avatar") else 400 if f.startswith("cover.") else 1200
            before = os.path.getsize(p)
            try:
                im = Image.open(p); im.load()
                resized = max(im.size) > limit
                if resized:
                    im.thumbnail((limit, limit), Image.LANCZOS)
                if not resized and before < 150_000:
                    continue
                tmp = p + ".tmp"
                if f.lower().endswith(".png"):
                    im.save(tmp, "PNG", optimize=True)
                elif f.lower().endswith(".webp"):
                    im.save(tmp, "WEBP", quality=85)
                else:
                    im.convert("RGB").save(tmp, "JPEG", quality=85, optimize=True)
                if resized or os.path.getsize(tmp) < before:
                    saved += before - os.path.getsize(tmp); os.replace(tmp, p)
                else:
                    os.remove(tmp)
            except Exception as e:
                print("Không nén được", rel, e)
    print(f"Đã nén ảnh, tiết kiệm khoảng {saved // 1024} KB")


def main():
    now = datetime.now(timezone.utc)
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT + "/data")
    for n in os.listdir("."):
        if n.endswith((".html", ".css", ".js")) and n != "build.py":
            shutil.copy(n, OUT)
    if os.path.isfile("lich-dang.txt"):
        shutil.copy("lich-dang.txt", OUT)
    for d in ("images", "fonts"):
        if os.path.isdir(d):
            shutil.copytree(d, f"{OUT}/{d}")

    stories, chapters = [], {}
    for name in sorted(os.listdir(".")):
        lp = os.path.join(name, "list.txt")
        if name.startswith(".") or name in SYSTEM or not os.path.isfile(lp):
            continue
        if not SAFE.match(name):
            print("Bỏ qua thư mục tên không hợp lệ:", name); continue
        pub, waiting = [], 0
        for line in open(lp, encoding="utf-8").read().splitlines():
            m = LINE.match(line.strip())
            src = m and f"{name}/{m.group(1)}.txt"
            if not m or not os.path.isfile(src):
                continue
            when = parse_time(m.group(3)) if m.group(3) else None
            if when and when > now:
                waiting += 1; continue
            pub.append((m.group(1), m.group(2).strip(), when or git_date(src)))
        if not pub:
            continue
        os.makedirs(f"{OUT}/{name}")
        for cid, _, _ in pub:
            shutil.copy(f"{name}/{cid}.txt", f"{OUT}/{name}/{cid}.txt")
        open(f"{OUT}/{name}/list.txt", "w", encoding="utf-8").write("\n".join(f"{c}: {t}" for c, t, _ in pub))
        info = {}
        if os.path.isfile(f"{name}/info.json"):
            shutil.copy(f"{name}/info.json", f"{OUT}/{name}/info.json")
            try: info = json.load(open(f"{name}/info.json", encoding="utf-8"))
            except Exception: print("info.json lỗi ở", name)
        cover = next((f"{name}/cover.{e}" for e in ("jpg", "jpeg", "png", "webp") if os.path.isfile(f"{name}/cover.{e}")), None)
        if cover:
            shutil.copy(cover, f"{OUT}/{cover}")
        g = info.get("genres", [])
        stories.append({"id": name, "title": info.get("title") or name, "author": info.get("author", ""),
                        "genres": g if isinstance(g, list) else [x.strip() for x in str(g).split(",") if x.strip()],
                        "status": "done" if info.get("status") == "done" else "ongoing",
                        "cover": cover, "count": len(pub), "updated": max(d for _, _, d in pub).isoformat()})
        chapters[name] = [{"id": c, "title": t, "date": d.isoformat()} for c, t, d in pub]
        print(f"{name}: {len(pub)} chương đã đăng, {waiting} chương hẹn giờ")

    optimize_images()
    stories.sort(key=lambda s: s["updated"], reverse=True)
    json.dump(stories, open(f"{OUT}/data/stories.json", "w", encoding="utf-8"), ensure_ascii=False)
    json.dump(chapters, open(f"{OUT}/data/chapters.json", "w", encoding="utf-8"), ensure_ascii=False)
    print("Xong. Thư mục phát hành:", OUT)


if __name__ == "__main__":
    main()
