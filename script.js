/* =========================================================
   thỏ ăn cỏ - script.js
   Danh sách truyện: biến STORIES bên dưới
   Bình luận tổng hợp: data/comments.json (tự cập nhật bằng GitHub Actions)
   ========================================================= */

/* =========================================================
   DANH SÁCH TRUYỆN: sửa ngay tại đây (không cần file JSON).
   folder = tên thư mục chứa các file .txt của truyện (xem README).
   status: "done" = đã lấp hố, "ongoing" = đang lấp hố.
   ========================================================= */
const STORIES = [
  {
    title: "Trầm Kiều", author: "[gì đó]", length: "63 chương", genres: ["[ngược, HE, đổi công]"],
    cover: "", folder: "tramkieu", status: "ongoing",
    chapters: [
      { id: "chuong-2", title: "Chương 2: Gặp gỡ", date: "2026-10-18" },
      { id: "chuong-1", title: "Chương 1: Mở đầu", date: "2026-10-17" }
    ]
  }
];

const CONFIG = {
  maxChapters: 12,          // số chương mới hiển thị
  maxComments: 15,          // số bình luận hiển thị
  // Điền thông tin giscus để bật nút "Viết bình luận" (xem README.md)
  giscus: {
    repo: "",               // ví dụ "tenban/tho-an-co"
    repoId: "",
    category: "",           // ví dụ "Bình luận"
    categoryId: "",
    term: "Bình luận chung" // mọi bình luận từ nút này nằm chung 1 chủ đề
  }
};

const $ = (s) => document.querySelector(s);

/* ---------- tiện ích ---------- */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function timeAgo(iso) {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "vừa xong";
  if (s < 3600) return Math.floor(s / 60) + " phút trước";
  if (s < 86400) return Math.floor(s / 3600) + " giờ trước";
  if (s < 86400 * 30) return Math.floor(s / 86400) + " ngày trước";
  return new Date(t).toLocaleDateString("vi-VN");
}

async function loadJSON(path) {
  const r = await fetch(path, { cache: "no-store" });
  if (!r.ok) throw new Error(path + " " + r.status);
  return r.json();
}

/* ---------- thẻ truyện ---------- */
function storyCard(s) {
  const a = el("a", "story");
  a.href = s.url || (s.folder ? "doc.html?story=" + encodeURIComponent(s.folder) : "#");
  if (s.url) { a.target = "_blank"; a.rel = "noopener"; }

  const slot = el("div", "slot");
  slot.dataset.label = "ảnh bìa";
  if (s.cover) {
    const img = document.createElement("img");
    img.src = s.cover;
    img.alt = "Bìa " + (s.title || "truyện");
    img.loading = "lazy";
    slot.appendChild(img);
  }
  a.appendChild(slot);

  const meta = el("div", "meta");
  meta.appendChild(el("b", "", s.title || "[Tên truyện]"));
  meta.appendChild(el("span", "", "✍ " + (s.author || "[Tác giả]")));
  meta.appendChild(el("span", "", "📖 " + (s.length || "[Độ dài]")));
  const tags = el("div", "tags");
  const list = Array.isArray(s.genres) && s.genres.length ? s.genres : ["[Thể loại]"];
  list.forEach((g) => tags.appendChild(el("em", "", g)));
  meta.appendChild(tags);
  a.appendChild(meta);
  return a;
}

function renderShelf(container, countEl, stories) {
  container.textContent = "";
  countEl.textContent = stories.length ? "(" + stories.length + ")" : "";
  if (!stories.length) {
    container.appendChild(el("p", "muted", "Chưa có truyện nào, thêm vào STORIES trong script.js nha."));
    return;
  }
  stories.forEach((s) => container.appendChild(storyCard(s)));
}

/* ---------- chương mới (tự tổng hợp từ stories.json) ---------- */
function renderChapters(stories) {
  const box = $("#latest-chapters");
  box.textContent = "";
  const all = [];
  stories.forEach((s) => (s.chapters || []).forEach((c) => all.push({ story: s, chap: c })));
  all.sort((x, y) => new Date(y.chap.date) - new Date(x.chap.date));

  if (!all.length) {
    box.appendChild(el("p", "muted", "Chưa có chương nào được cập nhật."));
    return;
  }
  all.slice(0, CONFIG.maxChapters).forEach(({ story, chap }) => {
    const a = el("a", "row");
    a.href = chap.url || (story.folder && chap.id ? "doc.html?story=" + encodeURIComponent(story.folder) + "&chapter=" + encodeURIComponent(chap.id) : story.url) || "#";
    if (a.getAttribute("href") !== "#") { a.target = "_blank"; a.rel = "noopener"; }
    a.appendChild(el("time", "", timeAgo(chap.date)));
    a.appendChild(el("b", "", story.title || "[Tên truyện]"));
    a.appendChild(el("span", "", chap.title || "Chương mới"));
    box.appendChild(a);
  });
}

/* ---------- bình luận (từ comments.json) ---------- */
function renderComments(list) {
  const box = $("#latest-comments");
  box.textContent = "";
  if (!list.length) {
    box.appendChild(el("p", "muted", "Chưa có bình luận nào, bạn là người đầu tiên nhé!"));
    return;
  }
  list.slice(0, CONFIG.maxComments).forEach((c) => {
    const a = el("a", "row cmt");
    a.href = c.url || "#";
    if (c.url) { a.target = "_blank"; a.rel = "noopener"; }
    const ava = document.createElement("img");
    ava.className = "ava";
    ava.alt = "";
    ava.loading = "lazy";
    if (c.avatar) ava.src = c.avatar;
    const txt = el("div", "txt");
    txt.appendChild(el("time", "", timeAgo(c.createdAt)));
    txt.appendChild(el("b", "", c.author || "ẩn danh"));
    txt.appendChild(el("p", "", c.body || ""));
    a.appendChild(ava);
    a.appendChild(txt);
    box.appendChild(a);
  });
}

/* ---------- hộp viết bình luận (giscus) ---------- */
function setupCommentModal() {
  const modal = $("#modal");
  const holder = $("#giscus-holder");
  let loaded = false;

  function open() {
    modal.hidden = false;
    if (loaded) return;
    loaded = true;
    const g = CONFIG.giscus;
    if (!g.repo || !g.repoId || !g.categoryId) {
      holder.appendChild(el("p", "muted",
        "Hộp bình luận chưa được cấu hình. Mở script.js và điền thông tin giscus (xem hướng dẫn trong README.md)."));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    const attrs = {
      "data-repo": g.repo,
      "data-repo-id": g.repoId,
      "data-category": g.category,
      "data-category-id": g.categoryId,
      "data-mapping": "specific",
      "data-term": g.term,
      "data-reactions-enabled": "1",
      "data-input-position": "top",
      "data-theme": "light",
      "data-lang": "vi"
    };
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    holder.appendChild(s);
  }
  const close = () => { modal.hidden = true; };

  $("#btn-comment").addEventListener("click", open);
  $("#modal-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

/* ---------- khởi động ---------- */
(async function init() {
  setupCommentModal();

  try {
    const stories = STORIES;
    // chương mới tự cập nhật: build.py tạo data/chapters.json từ list.txt của từng truyện
    try {
      const auto = await loadJSON("data/chapters.json");
      stories.forEach((s) => { if (s.folder && Array.isArray(auto[s.folder])) s.chapters = auto[s.folder]; });
    } catch (err) { /* chưa có thì dùng danh sách chương ghi tay trong STORIES */ }
    renderShelf($("#list-done"), $("#count-done"), stories.filter((s) => s.status === "done"));
    renderShelf($("#list-ongoing"), $("#count-ongoing"), stories.filter((s) => s.status !== "done"));
    renderChapters(stories);
  } catch (err) {
    console.error(err);
    const msg = "Không hiển thị được danh sách truyện, hãy kiểm tra lại STORIES trong script.js.";
    $("#list-done").appendChild(el("p", "muted", msg));
    $("#latest-chapters").textContent = "";
    $("#latest-chapters").appendChild(el("p", "muted", msg));
  }

  try {
    const comments = await loadJSON("data/comments.json");
    renderComments(Array.isArray(comments) ? comments : []);
  } catch (err) {
    console.error(err);
    renderComments([]);
  }
})();
