/* =========================================================
   THỎ ĂN CỎ - home.js
   Danh sách truyện: sửa STORIES bên dưới (folder = tên thư mục truyện).
   "Chương mới cập nhật" tự có từ data/chapters.json do build.py tạo mỗi lần phát hành.
   ========================================================= */
const STORIES = [
  { title: "Chiếc trăng khuyết", author: "Tên tác giả", length: "2 chương",
    genres: ["Cổ tích"], folder: "vi-du", status: "ongoing" }
];
const MAX_LATEST = 12;

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const chapterUrl = (f, id) => `doc.html?story=${encodeURIComponent(f)}&chapter=${encodeURIComponent(id)}`;

function ago(iso) {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "vừa xong";
  if (s < 3600) return Math.floor(s / 60) + " phút trước";
  if (s < 86400) return Math.floor(s / 3600) + " giờ trước";
  if (s < 86400 * 30) return Math.floor(s / 86400) + " ngày trước";
  return new Date(t).toLocaleDateString("vi-VN");
}

const shelf = document.getElementById("shelf");
STORIES.forEach(s => {
  const a = el("a", "book");
  a.href = "doc.html?story=" + encodeURIComponent(s.folder);
  a.appendChild(el("h3", "", s.title));
  a.appendChild(el("span", "meta", `${s.author} · ${s.length}`));
  const tags = el("div", "tags");
  (s.genres || []).forEach(g => tags.appendChild(el("em", "", g)));
  tags.appendChild(el("em", "st", s.status === "done" ? "Đã hoàn" : "Đang ra"));
  a.appendChild(tags);
  shelf.appendChild(a);
});

fetch("data/chapters.json", { cache: "no-store" })
  .then(r => { if (!r.ok) throw 0; return r.json(); })
  .then(index => {
    const all = [];
    STORIES.forEach(s => (index[s.folder] || []).forEach(c => all.push({ s, c })));
    all.sort((x, y) => new Date(y.c.date) - new Date(x.c.date));
    const box = document.getElementById("latest");
    all.slice(0, MAX_LATEST).forEach(({ s, c }) => {
      const li = el("li");
      const a = el("a");
      a.href = chapterUrl(s.folder, c.id);
      a.appendChild(el("b", "", s.title));
      a.appendChild(el("span", "", c.title));
      a.appendChild(el("time", "", ago(c.date)));
      li.appendChild(a);
      box.appendChild(li);
    });
    if (!all.length) box.appendChild(el("li", "empty", "Chưa có chương nào."));
  })
  .catch(() => document.getElementById("latest").appendChild(el("li", "empty", "Chưa có chương nào.")));
