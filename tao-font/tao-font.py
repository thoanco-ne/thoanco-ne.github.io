#!/usr/bin/env python3
"""
Tạo "font bảo mật" từ một font thường để người đọc chọn thêm font chữ mà vẫn giữ nguyên cơ chế đảo chữ.

Cách dùng (cần Python và:  pip install fonttools):
    python tao-font/tao-font.py duong-dan/Font.ttf "Tên font" ten-ngan

Kết quả: fonts/ten-ngan.woff và dòng mới trong fonts/fonts.json. Đẩy hai file đó lên GitHub là web có thêm font.
Font bảo mật dùng cùng bảng đảo chữ (tao-font/char-map.json) với công cụ đăng truyện, nên chương đã đăng không cần làm lại.
Chỉ dùng font cho phép nhúng và sửa đổi (ví dụ giấy phép OFL của Google Fonts).
"""
import json, os, re, sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "fonts")
MAP = json.load(open(os.path.join(HERE, "char-map.json"), encoding="utf-8"))
RANGES = [(0x20, 0x7E), (0xA0, 0x24F), (0x300, 0x36F), (0x1E00, 0x1EFF), (0x2000, 0x206F), (0x20AB, 0x20AB)]


def build(path, name, fid):
    f = TTFont(path, fontNumber=0)
    if "fvar" in f:                                   # font biến thiên: lấy kiểu chữ thường (400)
        f = instancer.instantiateVariableFont(f, {"wght": 400})
    cmap = f.getBestCmap()
    new = dict(cmap)
    for o, s in MAP.items():                          # ký tự đã đảo s sẽ hiện hình của ký tự gốc o
        if len(o) == 1 and len(s) == 1 and ord(o) in cmap:
            new[ord(s)] = cmap[ord(o)]
    t = CmapSubtable.newSubtable(4); t.platformID, t.platEncID, t.language = 3, 1, 0
    t.cmap = {cp: g for cp, g in new.items() if cp <= 0xFFFF}
    f["cmap"].tables = [t]
    fam = "TAC " + name
    f["name"].names = [n for n in f["name"].names if n.nameID not in (16, 17, 21, 22)]
    for nid, val in ((1, fam), (4, fam), (6, "TAC-" + fid)):
        f["name"].setName(val, nid, 3, 1, 0x409)
    o = subset.Options(); o.layout_features = ["*"]; o.name_IDs = ["*"]; o.notdef_outline = True; o.flavor = "woff"
    s = subset.Subsetter(o)
    s.populate(unicodes=[cp for cp in t.cmap if any(a <= cp <= b for a, b in RANGES)])
    s.subset(f)
    f.flavor = "woff"
    os.makedirs(OUT, exist_ok=True)
    dst = os.path.join(OUT, fid + ".woff"); f.save(dst)
    reg = os.path.join(OUT, "fonts.json")
    lst = json.load(open(reg, encoding="utf-8")) if os.path.isfile(reg) else []
    lst = [x for x in lst if x["id"] != fid] + [{"id": fid, "name": name, "file": "fonts/" + fid + ".woff"}]
    json.dump(lst, open(reg, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"Đã tạo {dst} ({os.path.getsize(dst) // 1024} KB)")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    fid = sys.argv[3] if len(sys.argv) > 3 else re.sub(r"[^a-z0-9]+", "-", sys.argv[2].lower()).strip("-")
    build(sys.argv[1], sys.argv[2], fid)
