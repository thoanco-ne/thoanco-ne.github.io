"""
thỏ ăn cỏ - build.py
Chạy tự động trên GitHub Actions mỗi lần bạn đăng bài (xem .github/workflows/deploy.yml).

Chữ trong file chương đã được đảo sẵn bởi file "tách có mã.html", nên script này KHÔNG đảo nữa. Việc nó làm:
1. Chép fonts/secure-font.woff2 (font khớp với công cụ tách chương) vào bản phát hành.
2. Chép trang web, ảnh (có nén bớt) và các thư mục truyện vào public/.
3. Tạo data/chapters.json (ngày thêm từng chương) để khung "Chương mới cập nhật" tự cập nhật.
Chạy thử trên máy:  pip install pillow  &&  python build.py
"""
import datetime
import json
import os
import shutil
import subprocess


# ---------- cấu hình ----------
FONT_SOURCE = "fonts/secure-font.woff2"           # font lấy từ gói ZIP của công cụ tách chương
OUTPUT_DIR = "public"
FONTS_OUTPUT_DIR = os.path.join(OUTPUT_DIR, "fonts")
SECURE_FONT_OUTPUT = os.path.join(FONTS_OUTPUT_DIR, "secure-font.woff2")

def chapter_date(path):
    """Ngày chương được thêm vào repo (lấy từ lịch sử git). Không có git thì dùng giờ sửa file."""
    try:
        out = subprocess.run(["git", "log", "--diff-filter=A", "--format=%cI", "--", path],
                             capture_output=True, text=True, check=True).stdout.split()
        if out:
            return out[-1]
    except Exception:
        pass
    ts = os.path.getmtime(path)
    return datetime.datetime.fromtimestamp(ts, datetime.timezone.utc).isoformat()


def build_chapter_index(story_folders):
    """Đọc list.txt của từng truyện và ghi data/chapters.json để khung 'Chương mới' tự cập nhật."""
    index = {}
    for folder in story_folders:
        list_path = os.path.join(folder, "list.txt")
        if not os.path.isfile(list_path):
            continue
        items = []
        with open(list_path, "r", encoding="utf-8") as f:
            for line in f.read().replace("\r", "").split("\n"):
                line = line.strip()
                if not line or line.startswith("# ") or ":" not in line:
                    continue
                cid, title = line.split(":", 1)
                cid, title = cid.strip(), title.strip()
                chap_file = os.path.join(folder, cid + ".txt")
                if os.path.isfile(chap_file):
                    items.append({"id": cid, "title": title, "date": chapter_date(chap_file)})
        index[folder] = items
    os.makedirs(os.path.join(OUTPUT_DIR, "data"), exist_ok=True)
    with open(os.path.join(OUTPUT_DIR, "data", "chapters.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False)
    print("Đã tạo data/chapters.json cho:", list(index))


# Kích thước tối đa (cạnh dài nhất, px) khi phát hành. Ảnh gốc trong repo giữ nguyên.
IMG_MAX_DEFAULT = 1000   # bìa, ảnh đại diện, trang trí...: ô hiển thị chỉ vài trăm px nên dư sức nét
IMG_MAX_FRAME = 1500     # khung bọc truyện (khung*.png)
IMG_MAX_CURSOR = 32      # con trỏ chuột (cursor*.png) phải nhỏ mới hiển thị được


def optimize_images():
    """Tự thu nhỏ và nén ảnh trong images/ khi phát hành, bạn tải ảnh to cỡ nào cũng được."""
    folder = os.path.join(OUTPUT_DIR, "images")
    if not os.path.isdir(folder):
        return
    try:
        import io
        from PIL import Image, ImageOps
    except ImportError:
        print("Cảnh báo: chưa cài Pillow nên không tự nén ảnh.")
        return
    resample = getattr(getattr(Image, "Resampling", Image), "LANCZOS")
    saved = 0
    for root, _dirs, files in os.walk(folder):
        for name in sorted(files):
            low = name.lower()
            if not low.endswith((".png", ".jpg", ".jpeg", ".webp")):
                continue
            path = os.path.join(root, name)
            try:
                before = os.path.getsize(path)
                im = Image.open(path)
                if getattr(im, "is_animated", False):
                    continue                      # ảnh động: giữ nguyên
                fmt = (im.format or "").upper()
                im = ImageOps.exif_transpose(im)  # ảnh chụp từ điện thoại: xoay đúng chiều
                limit = IMG_MAX_DEFAULT
                if low.startswith("cursor"):
                    limit = IMG_MAX_CURSOR
                elif low.startswith("khung"):
                    limit = IMG_MAX_FRAME
                resized = max(im.size) > limit
                if resized:
                    im.thumbnail((limit, limit), resample)
                buf = io.BytesIO()
                if fmt == "JPEG":
                    im.convert("RGB").save(buf, "JPEG", quality=85, optimize=True, progressive=True)
                elif fmt == "WEBP":
                    im.save(buf, "WEBP", quality=85)
                else:
                    im.save(buf, "PNG", optimize=True)
                after = buf.tell()
                if resized or after < before:
                    with open(path, "wb") as f:
                        f.write(buf.getvalue())
                    saved += before - after
                    print("Ảnh", name, ":", before // 1024, "KB ->", after // 1024, "KB", im.size)
            except Exception as err:
                print("Bỏ qua ảnh", name, "-", err)
    print("Đã tiết kiệm khoảng", max(saved, 0) // 1024, "KB ảnh")


def main():
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(FONTS_OUTPUT_DIR, exist_ok=True)

    if not os.path.isfile(FONT_SOURCE):
        raise SystemExit("Thiếu fonts/secure-font.woff2 (lấy trong gói ZIP của công cụ tách chương).")
    shutil.copy(FONT_SOURCE, SECURE_FONT_OUTPUT)

    # Sao chép trang web
    for name in os.listdir("."):
        if name.endswith((".html", ".css", ".js")):
            shutil.copy(name, os.path.join(OUTPUT_DIR, name))
    for folder in ("images", "data"):
        if os.path.isdir(folder):
            shutil.copytree(folder, os.path.join(OUTPUT_DIR, folder), dirs_exist_ok=True)

    optimize_images()

    # Tự quét các thư mục truyện (thư mục nào có file .txt)
    system_folders = {".git", ".github", "fonts", "public", "images", "data",
                      "node_modules", "__pycache__"}
    story_folders = []
    for item in sorted(os.listdir(".")):
        if os.path.isdir(item) and item not in system_folders:
            if any(f.endswith(".txt") for f in os.listdir(item)):
                story_folders.append(item)
    print("Thư mục truyện tìm thấy:", story_folders)

    for folder in story_folders:
        out_folder = os.path.join(OUTPUT_DIR, folder)
        os.makedirs(out_folder, exist_ok=True)
        for file in sorted(os.listdir(folder)):
            src = os.path.join(folder, file)
            dst = os.path.join(out_folder, file)
            if not file.endswith(".txt"):
                if os.path.isfile(src):
                    shutil.copy(src, dst)
                continue
            shutil.copy(src, dst)   # chương đã được đảo sẵn, giữ nguyên

    build_chapter_index(story_folders)

    # Báo Pages không dùng Jekyll
    open(os.path.join(OUTPUT_DIR, ".nojekyll"), "w").close()
    print("Xong. Thư mục phát hành:", OUTPUT_DIR)


if __name__ == "__main__":
    main()
