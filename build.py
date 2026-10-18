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
import os
import random
import shutil
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
ZERO_WIDTH_CHARS = ["‌", "​", "﻿"]
 

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

    # Báo Pages không dùng Jekyll
    open(os.path.join(OUTPUT_DIR, ".nojekyll"), "w").close()
    print("Xong. Thư mục phát hành:", OUTPUT_DIR)


if __name__ == "__main__":
    main()
