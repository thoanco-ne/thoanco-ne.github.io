"""
thỏ ăn cỏ - build.py
Chạy tự động trên GitHub Actions mỗi lần bạn đăng bài (xem .github/workflows/deploy.yml).

Việc script làm:
1. Tạo font bảo mật: hoán đổi ngẫu nhiên ô chữ của các ký tự tiếng Việt trong font gốc.
2. Mã hóa chữ trong file .txt của mỗi truyện: văn bản trong file chỉ là chữ "loạn",
   nhưng khi hiển thị bằng font bảo mật thì người đọc thấy đúng chữ.
3. Gom mọi thứ vào thư mục public/ để phát hành.

Bạn có thể chạy thử trên máy:  pip install fonttools brotli  &&  python build.py
"""
import datetime
import json
import os
import random
import shutil
import subprocess
import unicodedata

from fontTools.ttLib import TTFont

# ---------- cấu hình ----------
NORMAL_FONT_PATH = "fonts/normal-font.ttf"       # font gốc có đủ chữ tiếng Việt
OUTPUT_DIR = "public"
FONTS_OUTPUT_DIR = os.path.join(OUTPUT_DIR, "fonts")
SECURE_FONT_OUTPUT = os.path.join(FONTS_OUTPUT_DIR, "secure-font.woff2")

# Hạt giống xáo trộn. Giữ cố định để mỗi lần phát hành, font và chữ khớp nhau,
# người đang đọc không bị loạn chữ. Muốn bí mật hơn: tạo secret FONT_SEED trong GitHub (xem README).
SEED = os.environ.get("FONT_SEED") or "tho-an-co"
rng = random.Random(SEED)

# Chữ thường và chữ hoa xáo trộn riêng, để chữ hoa không lẫn vào chữ thường
VIET_LOWER = "aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵđ"
VIET_UPPER = "AÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬEÈÉẺẼẸÊỀẾỂỄỆIÌÍỈĨỊOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢUÙÚỦŨỤƯỪỨỬỮỰYỲÝỶỸỴĐ"
VIET_CHARS = VIET_LOWER + VIET_UPPER
ZERO_WIDTH_CHARS = ["\u200c", "\ufeff", "\u2060"]   # không dùng \u200b vì nó tạo chỗ ngắt dòng giữa từ


def generate_secure_font(input_path, output_path):
    font = TTFont(input_path)
    base_cmap = dict(font.getBestCmap())  # unicode -> tên ô chữ (glyph)

    target_lower = [ord(c) for c in VIET_LOWER if ord(c) in base_cmap]
    target_upper = [ord(c) for c in VIET_UPPER if ord(c) in base_cmap]
    missing = [c for c in VIET_CHARS if ord(c) not in base_cmap]
    if missing:
        print("Cảnh báo: font gốc thiếu các chữ này, chúng sẽ không được bảo vệ:", "".join(missing))

    shuffled_lower = target_lower.copy()
    rng.shuffle(shuffled_lower)
    shuffled_upper = target_upper.copy()
    rng.shuffle(shuffled_upper)

    targets = target_lower + target_upper
    shuffled = shuffled_lower + shuffled_upper

    char_map = {chr(o): chr(s) for o, s in zip(targets, shuffled)}

    # Trong font: ký tự "đã đảo" s sẽ vẽ ra hình của ký tự gốc o
    kept = []
    for table in font["cmap"].tables:
        if table.isUnicode():
            for o, s in zip(targets, shuffled):
                table.cmap[s] = base_cmap[o]
            kept.append(table)
    font["cmap"].tables = kept

    font.flavor = "woff2"
    font.save(output_path)
    return char_map


def obfuscate_text(text, char_map):
    """Đảo ký tự. Dòng bắt đầu bằng '# ' (tiêu đề chương) được giữ nguyên."""
    out_lines = []
    for line in text.split("\n"):
        if line.startswith("# "):
            out_lines.append(line)
            continue
        result = []
        for ch in line:
            result.append(char_map.get(ch, ch))
            if ch in VIET_CHARS and rng.random() < 0.15:
                result.append(rng.choice(ZERO_WIDTH_CHARS))
        out_lines.append("".join(result))
    return "\n".join(out_lines)


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


CURSOR_MAX = 32   # con trỏ chuột nên tối đa 32x32 px


def shrink_cursors():
    """Tự thu nhỏ ảnh con trỏ (images/cursor*.png) về tối đa 32x32 trong bản phát hành.
    Ảnh gốc trong repo giữ nguyên, bạn tải ảnh to cỡ nào cũng được."""
    folder = os.path.join(OUTPUT_DIR, "images")
    if not os.path.isdir(folder):
        return
    try:
        from PIL import Image
    except ImportError:
        print("Cảnh báo: chưa cài Pillow nên không tự thu nhỏ ảnh con trỏ.")
        return
    resample = getattr(getattr(Image, "Resampling", Image), "LANCZOS")
    for name in sorted(os.listdir(folder)):
        if name.lower().startswith("cursor") and name.lower().endswith(".png"):
            path = os.path.join(folder, name)
            im = Image.open(path).convert("RGBA")
            if max(im.size) > CURSOR_MAX:
                old = im.size
                im.thumbnail((CURSOR_MAX, CURSOR_MAX), resample)
                im.save(path)
                print("Đã thu nhỏ", name, old, "->", im.size)


def main():
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(FONTS_OUTPUT_DIR, exist_ok=True)

    print("Đang tạo font bảo mật...")
    char_map = generate_secure_font(NORMAL_FONT_PATH, SECURE_FONT_OUTPUT)

    # Sao chép trang web
    for name in os.listdir("."):
        if name.endswith((".html", ".css", ".js")):
            shutil.copy(name, os.path.join(OUTPUT_DIR, name))
    for folder in ("images", "data"):
        if os.path.isdir(folder):
            shutil.copytree(folder, os.path.join(OUTPUT_DIR, folder), dirs_exist_ok=True)

    shrink_cursors()

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
            if file == "list.txt":      # danh sách chương: giữ nguyên chữ thường
                shutil.copy(src, dst)
                continue
            with open(src, "r", encoding="utf-8") as f:
                raw = f.read().replace("\r\n", "\n")
            raw = unicodedata.normalize("NFC", raw)   # gom dấu về dạng dựng sẵn
            with open(dst, "w", encoding="utf-8") as f:
                f.write(obfuscate_text(raw, char_map))

    build_chapter_index(story_folders)

    # Báo Pages không dùng Jekyll
    open(os.path.join(OUTPUT_DIR, ".nojekyll"), "w").close()
    print("Xong. Thư mục phát hành:", OUTPUT_DIR)


if __name__ == "__main__":
    main()
