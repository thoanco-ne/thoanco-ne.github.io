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
    title: "Trầm kiều", author: "[Tác giả]", length: "68 chương", genres: ["[HE, ngược]"],
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
  // Bình luận dùng Firebase (không cần tài khoản). Điền thông tin dự án Firebase của bạn (xem README.md).
  // Để trống thì khung bình luận chỉ hiện thông báo chưa cấu hình.
  firebase: {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    appId: ""
  },
  commentCooldownSeconds: 30   // khoảng cách tối thiểu giữa hai lần gửi của cùng một người
};

// nếu bạn đã điền Firebase trong CONFIG ở trên thì vẫn dùng được; khuyến nghị điền ở config.js
if (!(window.TAC_FIREBASE && window.TAC_FIREBASE.apiKey) && CONFIG.firebase && CONFIG.firebase.apiKey) {
  window.TAC_FIREBASE = CONFIG.firebase;
}

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

/* ---------- bình luận mới (gom từ mọi nơi: trang chủ, chương, đoạn) ---------- */
// "Truyện B · Chương 2 · đoạn 5": lấy tên từ danh sách truyện và danh sách chương tự động
function commentWhere(c) {
  if (!c.s) return "đã bình luận ở trang chủ";
  const story = STORIES.find((s) => s.folder === c.s);
  let text = "đã bình luận ở " + (story && story.title ? story.title : c.s);
  const chap = story && (story.chapters || []).find((x) => x.id === c.c);
  text += " · " + (chap && chap.title ? chap.title : c.c);
  if (c.p !== null && c.p !== undefined) text += " · đoạn " + (c.p + 1);
  return text;
}

function commentLink(c) {
  if (!c.s) return "";
  return "doc.html?story=" + encodeURIComponent(c.s) + "&chapter=" + encodeURIComponent(c.c) +
    (c.p !== null && c.p !== undefined ? "&p=" + c.p : "");
}

function renderComments(list) {
  const box = $("#latest-comments");
  box.textContent = "";
  if (!list.length) {
    box.appendChild(el("p", "muted", "Chưa có bình luận nào, bạn là người đầu tiên nhé!"));
    return;
  }
  list.slice(0, CONFIG.maxComments).forEach((c) => {
    const url = commentLink(c);
    const row = el(url ? "a" : "div", "row cmt");
    if (url) row.href = url;
    const name = c.name || "ẩn danh";
    const ava = el("div", "ava", Array.from(name)[0] || "?");
    const txt = el("div", "txt");
    txt.appendChild(el("time", "", timeAgo(c.t)));
    txt.appendChild(el("b", "", name));
    txt.appendChild(el("span", "where", commentWhere(c)));
    txt.appendChild(el("p", "", c.body || ""));
    row.appendChild(ava);
    row.appendChild(txt);
    box.appendChild(row);
  });
}

function startComments() {
  const ok = TAC.watchRecent(CONFIG.maxComments, renderComments, (err) => {
    console.error(err);
    renderComments([]);
  });
  if (!ok) {
    const box = $("#latest-comments");
    box.textContent = "";
    box.appendChild(el("p", "muted", "Khung bình luận chưa được cấu hình. Xem hướng dẫn Firebase trong README.md."));
  }
}

/* ---------- hộp viết bình luận ở trang chủ ---------- */
function setupCommentModal() {
  const modal = $("#modal");
  const form = $("#cmt-form");
  const status = $("#cmt-status");
  const send = $("#cmt-send");
  const nameEl = $("#cmt-name");
  const bodyEl = $("#cmt-body");

  nameEl.value = TAC.savedName();

  function say(text, ok) { status.textContent = text; status.classList.toggle("ok", !!ok); }
  function open() { modal.hidden = false; say(""); setTimeout(() => bodyEl.focus(), 50); }
  function close() { modal.hidden = true; }

  $("#btn-comment").addEventListener("click", open);
  $("#modal-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#cmt-site").value) return;                    // robot điền ô bẫy thì bỏ qua
    send.disabled = true;
    say("Đang gửi…", true);
    TAC.post({ name: nameEl.value, body: bodyEl.value }).then(() => {
      bodyEl.value = "";
      say("Đã gửi, cảm ơn bạn!", true);
      setTimeout(close, 900);
    }).catch((err) => say(err.message)).then(() => { send.disabled = false; });
  });
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

  startComments();
})();
