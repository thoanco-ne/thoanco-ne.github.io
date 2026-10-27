/* =========================================================
   THỎ ĂN CỎ - reader.js
   Đọc chương: chữ nằm trong "closed shadow root", hiển thị bằng font bảo mật,
   chặn copy / chuột phải; bình luận và cảm xúc từng đoạn (Firebase, xem README).
   ========================================================= */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var params = new URLSearchParams(location.search);
  var SAFE = /^[A-Za-z0-9_-]+$/;
  var STORY = params.get("story") || "", CHAPTER = params.get("chapter") || "";
  var chapters = [], storyTitle = "", shadow = null, paras = [];
  var active = null, comments = [], reactions = {}, on = false;
  var RT = [
    { t: "tim", e: "❤️", l: "Thả tim" }, { t: "khoc", e: "😢", l: "Khóc" },
    { t: "gian", e: "😡", l: "Tức giận" }, { t: "cuoi", e: "😂", l: "Cười" }
  ];

  function say(t) { var m = $("#message"); m.textContent = t; m.hidden = false; }
  function link(id) { return "doc.html?story=" + encodeURIComponent(STORY) + "&chapter=" + encodeURIComponent(id); }
  function ago(ms) {
    var s = Math.max(0, (Date.now() - ms) / 1000);
    if (!ms) return "";
    if (s < 60) return "vừa xong";
    if (s < 3600) return Math.floor(s / 60) + " phút trước";
    if (s < 86400) return Math.floor(s / 3600) + " giờ trước";
    if (s < 86400 * 30) return Math.floor(s / 86400) + " ngày trước";
    return new Date(ms).toLocaleDateString("vi-VN");
  }

  /* ---------- danh sách chương ---------- */
  function loadList() {
    return fetch(STORY + "/list.txt", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("Chưa có danh sách chương");
      return r.text();
    }).then(function (text) {
      text.split(/\r?\n/).forEach(function (line) {
        line = line.trim();
        if (!line) return;
        if (line.indexOf("# ") === 0) { storyTitle = line.slice(2).trim(); return; }
        var i = line.indexOf(":");
        if (i > 0) chapters.push({ id: line.slice(0, i).trim(), title: line.slice(i + 1).trim() });
      });
    });
  }

  function showToc() {
    var box = $("#toc");
    chapters.forEach(function (ch) {
      var a = document.createElement("a");
      a.href = link(ch.id); a.textContent = ch.title;
      box.appendChild(a);
    });
    if (!chapters.length) return say("Truyện này chưa có chương nào.");
    $("#toc-view").hidden = false;
  }

  /* ---------- đọc chương ---------- */
  var PC_CSS =
    "#story-content{font-family:'SecuredFont',serif;font-size:18px;line-height:1.9;color:var(--ink)}" +
    ".p{margin:0 0 .2rem;white-space:pre-line;word-break:break-word}" +
    ".pbar{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin:0 0 1.1rem;min-height:26px;user-select:none;-webkit-user-select:none}" +
    ".rx{font-size:.78rem;color:var(--ink-soft)}" +
    ".pc{font:700 .78rem 'Quicksand',system-ui,sans-serif;cursor:pointer;padding:.35em .85em;border-radius:99px;" +
    "border:2px solid var(--lilac);background:var(--paper);color:var(--ink)}" +
    ".pc:hover,.pc.has{background:var(--pink)}";

  function showChapter() {
    return fetch(STORY + "/" + CHAPTER + ".txt", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("Chương này chưa có.");
      return r.text();
    }).then(function (plain) {
      var title = "", first = true;
      var idx = chapters.findIndex(function (c) { return c.id === CHAPTER; });
      plain.replace(/\r/g, "").split(/\n+/).forEach(function (b) {
        var t = b.trim();
        if (!t) return;
        if (first) {
          first = false;
          if (t.indexOf("# ") === 0) { title = t.slice(2).trim(); return; }
          if (idx >= 0) return;          // gói của công cụ: dòng đầu là tiêu đề, đã hiện ở trên
        }
        paras.push(t);
      });
      if (!title && idx >= 0) title = chapters[idx].title;
      $("#chapter-title").textContent = title || CHAPTER;
      document.title = (title || "Đọc truyện") + " · Thỏ Ăn Cỏ";

      on = !!(window.TAC && TAC.init());
      var host = $("#secure-shadow-root");
      shadow = host.attachShadow({ mode: "closed" });   // mã trên trang không đọc được nội dung bên trong
      var style = document.createElement("style");
      style.textContent = PC_CSS;
      shadow.appendChild(style);
      var content = document.createElement("div");
      content.id = "story-content";
      paras.forEach(function (p, i) {
        var d = document.createElement("div");
        d.className = "p";
        d.appendChild(document.createTextNode(p));      // văn bản thuần, không chèn HTML
        content.appendChild(d);
        var bar = document.createElement("div"); bar.className = "pbar";
        var rx = document.createElement("span"); rx.className = "rx"; rx.setAttribute("data-i", i);
        var b = document.createElement("button");
        b.type = "button"; b.className = "pc"; b.setAttribute("data-i", i); b.textContent = "+";
        b.setAttribute("aria-label", "Bình luận và cảm xúc đoạn " + (i + 1));
        b.addEventListener("click", function () { openPara(i); });
        bar.appendChild(rx); bar.appendChild(b);
        content.appendChild(bar);
      });
      shadow.appendChild(content);
      $("#reader").hidden = false;

      var prev = $("#btn-prev"), next = $("#btn-next");
      if (idx > 0) prev.href = link(chapters[idx - 1].id); else prev.setAttribute("aria-disabled", "true");
      if (idx >= 0 && idx < chapters.length - 1) next.href = link(chapters[idx + 1].id); else next.setAttribute("aria-disabled", "true");
      if (on) {
        TAC.watchChapter(STORY, CHAPTER, function (l) { comments = l; refresh(); }, function () {});
        TAC.watchReactions(STORY, CHAPTER, function (d) { reactions = d || {}; refresh(); });
      }
      window.scrollTo(0, 0);
    });
  }

  /* ---------- bình luận + cảm xúc từng đoạn ---------- */
  function mineGet() { try { return JSON.parse(localStorage.getItem("tac-react") || "{}"); } catch (e) { return {}; } }
  function mineSet(m) { try { localStorage.setItem("tac-react", JSON.stringify(m)); } catch (e) {} }
  function mkey(p, t) { return STORY + "|" + CHAPTER + "|" + p + "|" + t; }

  function refresh() {
    if (!shadow) return;
    var cc = {};
    comments.forEach(function (c) { if (c.p !== null) cc[c.p] = (cc[c.p] || 0) + 1; });
    Array.prototype.forEach.call(shadow.querySelectorAll(".pc"), function (b) {
      var n = cc[+b.getAttribute("data-i")] || 0;
      b.textContent = n ? "+" + n : "+";
      b.classList.toggle("has", n > 0);
    });
    Array.prototype.forEach.call(shadow.querySelectorAll(".rx"), function (s) {
      var r = reactions[+s.getAttribute("data-i")] || {}, total = 0;
      var top = RT.filter(function (x) { total += r[x.t] || 0; return (r[x.t] || 0) > 0; })
        .sort(function (a, b) { return (r[b.t] || 0) - (r[a.t] || 0); }).slice(0, 3);
      s.textContent = top.length ? top.map(function (x) { return x.e; }).join("") + " " + total : "";
    });
    if (active !== null) { renderReact(); renderList(); }
  }

  function renderReact() {
    var box = $("#ps-react"); box.textContent = "";
    var r = reactions[active] || {}, mine = mineGet();
    RT.forEach(function (x) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "rbtn" + (mine[mkey(active, x.t)] ? " on" : "");
      b.setAttribute("data-t", x.t); b.setAttribute("aria-label", x.l); b.title = x.l;
      b.setAttribute("aria-pressed", mine[mkey(active, x.t)] ? "true" : "false");
      b.disabled = !on;
      b.textContent = x.e + " " + (r[x.t] || 0);
      box.appendChild(b);
    });
  }

  function renderList() {
    var items = comments.filter(function (c) { return c.p === active; });
    $("#ps-count").textContent = "Bình luận (" + items.length + ")";
    var box = $("#ps-list"); box.textContent = "";
    if (!on) { box.innerHTML = ""; var n = document.createElement("p"); n.className = "muted"; n.textContent = "Bình luận và cảm xúc chưa được bật (điền config.js, xem README)."; box.appendChild(n); return; }
    if (!items.length) { var e = document.createElement("p"); e.className = "muted"; e.textContent = "Chưa có bình luận nào cho đoạn này."; box.appendChild(e); return; }
    items.forEach(function (c) {
      var d = document.createElement("div"); d.className = "citem";
      var t = document.createElement("time"); t.textContent = ago(c.t);
      var b = document.createElement("b"); b.textContent = c.name || "ẩn danh";
      var p = document.createElement("p"); p.textContent = c.body || "";
      d.appendChild(t); d.appendChild(b); d.appendChild(p); box.appendChild(d);
    });
  }

  function openPara(i) {
    active = i;
    $("#ps-title").textContent = "Đoạn " + (i + 1);
    var q = paras[i] || "";
    $("#ps-quote").textContent = q.length > 180 ? q.slice(0, 180) + "…" : q;
    $("#ps-form").style.display = on ? "" : "none";
    $("#ps-status").textContent = "";
    renderReact(); renderList();
    $("#psheet").hidden = false;
    document.documentElement.style.overflow = "hidden";
  }
  function closePara() {
    $("#psheet").hidden = true; active = null;
    document.documentElement.style.overflow = "";
  }

  $("#ps-react").addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".rbtn");
    if (!b || active === null || !on) return;
    var t = b.getAttribute("data-t"), p = active, k = mkey(p, t);
    var mine = mineGet(), delta = mine[k] ? -1 : 1;
    function apply(d) {
      var r = reactions[p] = reactions[p] || {};
      r[t] = Math.max(0, (r[t] || 0) + d);
      if (d > 0) mine[k] = 1; else delete mine[k];
      mineSet(mine); refresh();
    }
    apply(delta);
    TAC.react(STORY, CHAPTER, p, t, delta).catch(function () { apply(-delta); });
  });
  $("#ps-close").addEventListener("click", closePara);
  $("#psheet").addEventListener("click", function (e) { if (e.target === this) closePara(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && active !== null) closePara(); });

  $("#ps-name").value = window.TAC ? TAC.savedName() : "";
  $("#ps-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("#ps-site").value || active === null) return;      // ô bẫy robot
    var send = $("#ps-send"), st = $("#ps-status");
    send.disabled = true; st.textContent = "Đang gửi…";
    TAC.post({ name: $("#ps-name").value, body: $("#ps-body").value, s: STORY, c: CHAPTER, p: active })
      .then(function () { $("#ps-body").value = ""; st.textContent = "Đã gửi, cảm ơn bạn!"; })
      .catch(function (err) { st.textContent = err.message; })
      .then(function () { send.disabled = false; });
  });

  /* ---------- chống sao chép ---------- */
  var WEIRD = "aàảãáạăằẳẵắặâầẩẫấậbcdđeèẻẽéẹêềểễếệghiìỉĩíịklmnoòỏõóọôồổỗốộơờởỡớợpqrstuùủũúụưừửữứựvxyỳỷỹýỵz";
  function scramble(text) {
    return Array.from(text).map(function (ch) {
      if (ch === " ") return Math.random() < 0.3 ? " \u200c" : " ";
      if (ch === "\n" || /[.,!?;:()"'“”‘’]/.test(ch)) return ch;
      if (Math.random() < 0.8) {
        var c = WEIRD[Math.floor(Math.random() * WEIRD.length)];
        return (Math.random() < 0.5 ? c.toUpperCase() : c) + (Math.random() < 0.2 ? "\u200c" : "");
      }
      return ch;
    }).join("");
  }
  function inField(e) { return e.target && e.target.closest && e.target.closest("input,textarea"); }
  document.addEventListener("copy", function (e) {
    if (inField(e)) return;
    var text = String(window.getSelection());
    if (!text) return;
    e.preventDefault();
    if (e.clipboardData) { var bad = scramble(text); e.clipboardData.setData("text/plain", bad); e.clipboardData.setData("text/html", bad); }
  });
  ["cut", "contextmenu", "dragstart"].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (!inField(e)) e.preventDefault(); });
  });
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    if (!inField(e) && (e.ctrlKey || e.metaKey) && (k === "x" || k === "s" || k === "u" || k === "p")) e.preventDefault();
    if (e.key === "F12") e.preventDefault();
  });

  /* ---------- khởi động ---------- */
  if (!STORY || !SAFE.test(STORY) || (CHAPTER && !SAFE.test(CHAPTER))) {
    say("Đường dẫn chưa đúng. Hãy quay lại trang chủ và chọn truyện.");
    return;
  }
  $("#btn-toc").href = "doc.html?story=" + encodeURIComponent(STORY);
  loadList().catch(function () {}).then(function () {
    $("#story-name").textContent = storyTitle;
    if (!CHAPTER) { document.title = (storyTitle || "Mục lục") + " · Thỏ Ăn Cỏ"; showToc(); return; }
    return showChapter();
  }).catch(function (err) { say(err.message || "Không tải được chương."); });
})();
