/* =========================================================
   thỏ ăn cỏ - reader.js
   Mục lục truyện, đọc chương, thích chương, bình luận chương / đoạn, cảm xúc đoạn, chống copy.
   Chữ chương nằm trong closed shadow root, hiển thị bằng font bảo mật (SecuredFont).
   ========================================================= */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var params = new URLSearchParams(location.search), SAFE = /^[A-Za-z0-9_-]+$/;
  var STORY = params.get("story") || "", CHAPTER = params.get("chapter") || "";
  var chapters = [], info = {}, dates = {}, shadow = null, paras = [];
  var active = null, comments = [], reactions = {}, likes = {}, on = false;
  var fs = parseInt(localStorage.getItem("tac-fs"), 10) || 18;
  var RT = [{ t: "tim", e: "❤️", l: "Thả tim" }, { t: "khoc", e: "😢", l: "Khóc" }, { t: "gian", e: "😡", l: "Tức giận" }, { t: "cuoi", e: "😂", l: "Cười" }];

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function say(t) { var m = $("#message"); m.textContent = t; m.hidden = false; }
  function link(id) { return "doc.html?story=" + encodeURIComponent(STORY) + (id ? "&chapter=" + encodeURIComponent(id) : ""); }
  function ago(ms) {
    var s = Math.max(0, (Date.now() - ms) / 1000);
    if (!ms) return ""; if (s < 60) return "vừa xong"; if (s < 3600) return Math.floor(s / 60) + " phút trước";
    if (s < 86400) return Math.floor(s / 3600) + " giờ trước"; if (s < 86400 * 30) return Math.floor(s / 86400) + " ngày trước";
    return new Date(ms).toLocaleDateString("vi-VN");
  }
  function getJson(u) { return fetch(u, { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).catch(function () { return null; }); }
  function setSize(d) {
    fs = Math.min(26, Math.max(14, fs + d)); localStorage.setItem("tac-fs", fs);
    document.documentElement.style.setProperty("--rs", fs + "px"); render();
  }

  /* ---------- lịch sử đọc: nhớ các chương đã mở (lưu trong trình duyệt của người đọc) ---------- */
  function readAll() { try { return JSON.parse(localStorage.getItem("tac-read") || "{}"); } catch (e) { return {}; } }
  function readGet() { return readAll()[STORY] || {}; }
  function readMark(id) {
    var all = readAll(); (all[STORY] = all[STORY] || {})[id] = 1;
    try { localStorage.setItem("tac-read", JSON.stringify(all)); } catch (e) {}
  }

  /* ---------- đọc tiếp: nhớ chương mở gần nhất và vị trí cuộn (0 đến 1) của từng truyện ---------- */
  function lastGet() { try { return JSON.parse(localStorage.getItem("tac-last") || "{}")[STORY] || null; } catch (e) { return null; } }
  function lastSet(c, p) {
    try { var all = JSON.parse(localStorage.getItem("tac-last") || "{}"); all[STORY] = { c: c, p: p }; localStorage.setItem("tac-last", JSON.stringify(all)); } catch (e) {}
  }
  function cardBottom() { return $("#story-card").getBoundingClientRect().bottom + window.scrollY; }
  function progress() { var span = Math.max(0, cardBottom() - window.innerHeight); return span <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / span)); }

  /* ---------- tải danh sách chương + thông tin truyện ---------- */
  function loadAll() {
    return Promise.all([
      fetch(STORY + "/list.txt", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error("Chưa có truyện này."); return r.text(); }),
      getJson(STORY + "/info.json"), getJson("data/chapters.json")
    ]).then(function (a) {
      a[0].split(/\r?\n/).forEach(function (line) {
        var i = line.indexOf(":"); line = line.trim();
        if (line && i > 0) chapters.push({ id: line.slice(0, line.indexOf(":")).trim(), title: line.slice(line.indexOf(":") + 1).trim() });
      });
      info = a[1] || {};
      ((a[2] || {})[STORY] || []).forEach(function (c) { dates[c.id] = new Date(c.date).getTime(); });
      $("#story-name").textContent = info.title || "";
    });
  }

  /* ---------- mục lục: khung giới thiệu + khung danh sách ---------- */
  function showToc() {
    document.title = (info.title || "Mục lục") + " · Thỏ Ăn Cỏ";
    $("#i-title").textContent = info.title || STORY;
    $("#i-meta").textContent = "✍ " + (info.author || "—") + " · 📖 " + chapters.length + " chương · " + (info.status === "done" ? "🌱 Đã lấp hố" : "⛏️ Đang lấp hố");
    [].concat(info.genres || []).forEach(function (g) { $("#i-tags").appendChild(el("i", "tag", g)); });
    String(info.desc || "").split(/\n\s*\n/).forEach(function (p) { if (p.trim()) { var e = el("p", "", p.trim()); e.style.whiteSpace = "pre-line"; $("#i-desc").appendChild(e); } });
    $("#t-head").textContent = "📑 Mục lục (" + chapters.length + " chương)";
    var box = $("#toc"), cm = {}, lk = {}, tspans = {};
    chapters.forEach(function (ch) {
      var a = el("a", "chap"); a.href = link(ch.id);
      tspans[ch.id] = el("span"); a.appendChild(tspans[ch.id]);
      var c = el("span", "cn", "💬 0"), l = el("span", "cn", "🥕 0"); c.setAttribute("data-c", ch.id); l.setAttribute("data-l", ch.id);
      a.appendChild(c); a.appendChild(l);
      a.appendChild(el("em", "", dates[ch.id] ? new Date(dates[ch.id]).toLocaleDateString("vi-VN") : ""));
      box.appendChild(a);
    });
    function paint() {
      var tc = 0, tl = 0;
      chapters.forEach(function (ch) {
        tc += cm[ch.id] || 0; tl += lk[ch.id] || 0;
        box.querySelector('[data-c="' + ch.id + '"]').textContent = "💬 " + (cm[ch.id] || 0);
        box.querySelector('[data-l="' + ch.id + '"]').textContent = "🥕 " + (lk[ch.id] || 0);
      });
      $("#t-sum").textContent = "Tổng cộng: 💬 " + tc + " bình luận · 🥕 " + tl + " lượt thích";
    }
    paint();
    if (TAC.init()) { TAC.countByStory(STORY, function (m) { cm = m; paint(); }); TAC.watchLikes(STORY, function (m) { lk = m; paint(); }); }
    function eyes() { var rd = readGet(); chapters.forEach(function (ch) { tspans[ch.id].textContent = ch.title + (rd[ch.id] ? " 👀" : ""); }); }   // 👀 = chương đã mở đọc
    function resume() {
      var b = $("#go-resume"), l = lastGet(), i = l ? chapters.findIndex(function (c) { return c.id === l.c; }) : -1;
      b.textContent = "▶️ Đọc tiếp";
      if (i < 0) { b.setAttribute("aria-disabled", "true"); b.href = "#"; return; }
      var done = l.p >= 0.97 && i < chapters.length - 1, t = done ? chapters[i + 1] : chapters[i];   // đọc hết chương rồi thì sang chương sau
      b.removeAttribute("aria-disabled"); b.href = link(t.id) + (done ? "" : "&tiep=1");
      b.appendChild(el("span", "gs", t.title));
    }
    if (chapters.length) { $("#go-first").href = link(chapters[0].id); $("#go-last").href = link(chapters[chapters.length - 1].id); }
    else $(".go").hidden = true;
    function refreshTop() { eyes(); resume(); }
    refreshTop();
    window.addEventListener("pageshow", refreshTop);                 // quay lại bằng nút Back trên điện thoại (trang lấy từ bộ nhớ đệm)
    document.addEventListener("visibilitychange", function () { if (!document.hidden) refreshTop(); });
    window.addEventListener("focus", refreshTop);
    $("#toc-view").hidden = false;
  }

  /* ---------- đọc chương ---------- */
  var PC_CSS =
    "#story-content{width:100%;color:var(--ink)}" +
    "canvas{display:block;width:100%;margin:0 0 .2rem;user-select:none;-webkit-user-select:none;pointer-events:none}" +
    ".pbar{display:flex;justify-content:flex-end;margin:0 0 1.1rem;min-height:26px;user-select:none;-webkit-user-select:none}" +
    ".pc{font:700 .78rem 'Be Vietnam Pro',system-ui,sans-serif;cursor:pointer;padding:.35em .85em;border-radius:99px;border:2px solid var(--lilac);background:var(--paper);color:var(--ink)}" +
    ".pc:hover,.pc.has{background:var(--pink)}";

  function showChapter() {
    return fetch(STORY + "/" + CHAPTER + ".txt", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("Chương này chưa có hoặc chưa đến giờ đăng.");
      return r.text();
    }).then(function (plain) {
      var title = "", first = true;
      var idx = chapters.findIndex(function (c) { return c.id === CHAPTER; });
      plain.replace(/\r/g, "").split(/\n+/).forEach(function (b) {
        var t = b.trim(); if (!t) return;
        if (first) { first = false; if (t.indexOf("# ") === 0) { title = t.slice(2).trim(); return; } if (idx >= 0) return; }
        paras.push(t);                                       // dòng đầu của công cụ là tiêu đề, đã hiện ở trên
      });
      if (!title && idx >= 0) title = chapters[idx].title;
      $("#chapter-title").textContent = title || CHAPTER;
      document.title = (title || "Đọc truyện") + " · Thỏ Ăn Cỏ";
      on = !!(window.TAC && TAC.init());

      shadow = $("#secure-shadow-root").attachShadow({ mode: "closed" });   // mã trên trang không đọc được nội dung bên trong
      var st = el("style"); st.textContent = PC_CSS; shadow.appendChild(st);
      var content = el("div"); content.id = "story-content";
      paras.forEach(function (p, i) {
        var cv = el("canvas"); cv.setAttribute("role", "img"); cv.setAttribute("aria-label", "Đoạn " + (i + 1)); content.appendChild(cv);   // chữ chỉ được vẽ lên canvas, không nằm trong DOM
        var bar = el("div", "pbar"), b = el("button", "pc", "+");        // khi đọc chỉ có nút +, không hiện biểu tượng cảm xúc
        b.type = "button"; b.setAttribute("data-i", i); b.setAttribute("aria-label", "Bình luận và cảm xúc đoạn " + (i + 1));
        b.addEventListener("click", function () { openSheet(i); });
        bar.appendChild(b); content.appendChild(bar);
      });
      shadow.appendChild(content); contentEl = content;
      $("#reader").hidden = false; $("#fs-m").hidden = false; $("#fs-p").hidden = false; setSize(0);

      var prev = $("#btn-prev"), next = $("#btn-next");
      if (idx > 0) prev.href = link(chapters[idx - 1].id); else prev.setAttribute("aria-disabled", "true");
      if (idx >= 0 && idx < chapters.length - 1) next.href = link(chapters[idx + 1].id); else next.setAttribute("aria-disabled", "true");
      if (on) {
        TAC.watchChapter(STORY, CHAPTER, function (l) { comments = l; refresh(); });
        TAC.watchReactions(STORY, CHAPTER, function (d) { reactions = d || {}; refresh(); });
        TAC.watchLikes(STORY, function (d) { likes = d || {}; refresh(); });
      } else $("#like").disabled = true;
      readMark(CHAPTER); startReader(); refresh(); window.scrollTo(0, 0);
    });
  }

  /* ---------- thích chương ---------- */
  function mineGet() { try { return JSON.parse(localStorage.getItem("tac-react") || "{}"); } catch (e) { return {}; } }
  function mineSet(m) { try { localStorage.setItem("tac-react", JSON.stringify(m)); } catch (e) {} }
  function mkey(p, t) { return STORY + "|" + CHAPTER + "|" + p + "|" + t; }
  $("#like").addEventListener("click", function () {
    if (!on) return;
    var m = mineGet(), k = mkey("ch", "like"), d = m[k] ? -1 : 1;
    function apply(x) { likes[CHAPTER] = Math.max(0, (likes[CHAPTER] || 0) + x); if (x > 0) m[k] = 1; else delete m[k]; mineSet(m); refresh(); }
    apply(d); TAC.like(STORY, CHAPTER, d).catch(function () { apply(-d); });
  });

  /* ---------- làm mới số liệu trên trang ---------- */
  function chapterComments() { return comments.filter(function (c) { return c.p === null; }); }
  function refresh() {
    if (!shadow) return;
    var cc = {}; comments.forEach(function (c) { if (c.p !== null) cc[c.p] = (cc[c.p] || 0) + 1; });
    Array.prototype.forEach.call(shadow.querySelectorAll(".pc"), function (b) {
      var n = cc[+b.getAttribute("data-i")] || 0; b.textContent = n ? "+" + n : "+"; b.classList.toggle("has", n > 0);
    });
    $("#like-n").textContent = likes[CHAPTER] || 0;
    $("#like").classList.toggle("on", !!mineGet()[mkey("ch", "like")]);
    var cl = chapterComments(), box = $("#c-list"); box.textContent = "";
    $("#c-head").textContent = "💬 Bình luận chương (" + cl.length + ")";
    if (!on) box.appendChild(el("p", "muted", "Bình luận chưa được bật (điền config.js, xem README)."));
    else if (!cl.length) box.appendChild(el("p", "muted", "Chưa có bình luận nào cho chương này."));
    else cl.forEach(function (c) { box.appendChild(item(c)); });
    if (active !== null) { renderReact(); renderList(); }
  }
  function item(c) {
    var d = el("div", "row"); d.appendChild(el("em", "", ago(c.t))); d.appendChild(el("b", "", c.name || "ẩn danh"));
    var p = el("p", "", c.body || ""); p.style.cssText = "margin:2px 0 0;overflow-wrap:anywhere;white-space:pre-line"; d.appendChild(p); return d;
  }

  /* ---------- hộp thoại bình luận + cảm xúc (i = số đoạn, -1 = cả chương) ---------- */
  var drawNames = function () {};
  function renderReact() {
    var box = $("#ps-react"); box.textContent = "";
    if (active < 0) return;
    var r = reactions[active] || {}, mine = mineGet();
    RT.forEach(function (x) {
      var b = el("button", "rbtn" + (mine[mkey(active, x.t)] ? " on" : ""), x.e + " " + (r[x.t] || 0));
      b.type = "button"; b.setAttribute("data-t", x.t); b.title = x.l; b.setAttribute("aria-label", x.l);
      b.setAttribute("aria-pressed", mine[mkey(active, x.t)] ? "true" : "false"); b.disabled = !on; box.appendChild(b);
    });
  }
  function renderList() {
    var items = comments.filter(function (c) { return active < 0 ? c.p === null : c.p === active; });
    $("#ps-count").textContent = "Bình luận (" + items.length + ")";
    var box = $("#ps-list"); box.textContent = "";
    if (!on) return box.appendChild(el("p", "muted", "Bình luận và cảm xúc chưa được bật (điền config.js, xem README)."));
    if (!items.length) return box.appendChild(el("p", "muted", "Chưa có bình luận nào."));
    items.forEach(function (c) { var d = item(c); d.className = "citem"; box.appendChild(d); });
  }
  function openSheet(i) {
    active = i;
    $("#ps-title").textContent = i < 0 ? "Bình luận chương" : "Đoạn " + (i + 1);
    var q = $("#ps-quote"); q.hidden = i < 0; $("#ps-react").hidden = i < 0;
    q.textContent = "";
    $("#ps-form").style.display = on ? "" : "none"; $("#ps-status").textContent = "";
    renderReact(); renderList(); $("#psheet").hidden = false; document.documentElement.style.overflow = "hidden";
    if (i >= 0) { var qc = el("canvas"); q.appendChild(qc); paint(qc, paras[i] || "", Math.max(120, Math.floor(q.clientWidth - 26)), 3, 16); }
  }
  function closeSheet() { $("#psheet").hidden = true; active = null; document.documentElement.style.overflow = ""; }
  $("#c-open").addEventListener("click", function () { openSheet(-1); });
  $("#ps-close").addEventListener("click", closeSheet);
  $("#psheet").addEventListener("click", function (e) { if (e.target === this) closeSheet(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && active !== null) closeSheet(); });
  $("#fs-m").addEventListener("click", function () { setSize(-1); });
  $("#fs-p").addEventListener("click", function () { setSize(1); });

  $("#ps-react").addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".rbtn");
    if (!b || active === null || active < 0 || !on) return;
    var t = b.getAttribute("data-t"), p = active, k = mkey(p, t), mine = mineGet(), d = mine[k] ? -1 : 1;
    function apply(x) {
      var r = reactions[p] = reactions[p] || {}; r[t] = Math.max(0, (r[t] || 0) + x);
      if (x > 0) mine[k] = 1; else delete mine[k]; mineSet(mine); refresh();
    }
    apply(d); TAC.react(STORY, CHAPTER, p, t, d).catch(function () { apply(-d); });
  });
  $("#ps-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var st = $("#ps-status"), send = $("#ps-send");
    if ($("#ps-site").value || active === null) return;                    // ô bẫy robot
    if (!$("#ps-name").value.trim()) { st.textContent = "Bạn cần nhập tên nhé."; return; }
    send.disabled = true; st.textContent = "Đang gửi…";
    var o = { name: $("#ps-name").value, body: $("#ps-body").value, s: STORY, c: CHAPTER };
    if (active >= 0) o.p = active;
    TAC.post(o).then(function () { $("#ps-body").value = ""; st.textContent = "Đã gửi, cảm ơn bạn!"; drawNames(); })
      .catch(function (err) { st.textContent = err.message; }).then(function () { send.disabled = false; });
  });

  /* ---------- chữ vẽ lên canvas + hình mờ + phát hiện tiện ích / chụp màn hình ---------- */
  var WATERMARK = true;                 // đổi thành false nếu không muốn hình mờ trên chữ
  var contentEl = null, locked = false, hard = false, strikes = 0, down = {}, vid = "", stamp = "";
  try { vid = localStorage.getItem("tac-vid") || ""; if (!vid) { vid = Math.random().toString(36).slice(2, 8); localStorage.setItem("tac-vid", vid); } } catch (e) { vid = "khach"; }
  (function () { var d = new Date(); stamp = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2); })();

  function wrapText(ctx, text, maxW) {
    var lines = [], cur = "";
    text.split(" ").forEach(function (w) {
      var t = cur ? cur + " " + w : w;
      if (ctx.measureText(t).width <= maxW) { cur = t; return; }
      if (cur) lines.push(cur);
      if (ctx.measureText(w).width <= maxW) { cur = w; return; }
      cur = "";
      Array.from(w).forEach(function (ch) { if (ctx.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; } else cur += ch; });
    });
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  }
  function paint(cv, text, W, maxLines, size) {
    var lh = Math.round(size * 1.9), font = size + "px SecuredFont,'Noto Serif',serif";
    var col = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#4b4468";
    var m = document.createElement("canvas").getContext("2d"); m.font = font;
    var lines = wrapText(m, text, W);
    if (maxLines && lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,2}$/, "…"); }
    var dpr = Math.min(window.devicePixelRatio || 1, 3), H = lines.length * lh;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + "px";
    var ctx = cv.getContext("2d"); ctx.scale(dpr, dpr); ctx.font = font; ctx.fillStyle = col; ctx.textBaseline = "middle";
    lines.forEach(function (l, k) { ctx.fillText(l, 0, k * lh + lh / 2); });
    if (WATERMARK) {
      ctx.save(); ctx.globalAlpha = 0.09; ctx.font = "11px 'Be Vietnam Pro',sans-serif"; ctx.rotate(-0.3);
      for (var y = 0; y < H + W * 0.4 + 60; y += 44) for (var x = -H - 40; x < W + 60; x += 150) ctx.fillText(vid + " · " + stamp, x, y);
      ctx.restore();
    }
  }
  function render() {
    if (!contentEl || locked) return;
    var W = Math.floor($("#secure-shadow-root").clientWidth);
    if (W < 50) return;
    Array.prototype.forEach.call(contentEl.querySelectorAll("canvas"), function (cv, i) { paint(cv, paras[i] || "", W, 0, fs); });
  }
  function lock(msg, reload, ms) {
    locked = true; hard = !!reload;
    Array.prototype.forEach.call(contentEl.querySelectorAll("canvas"), function (c) { c.width = 0; c.height = 0; c.style.height = "0"; });
    $("#lock-msg").textContent = msg;
    var b = $("#lock-btn"); b.textContent = reload ? "Tải lại trang" : "Hiện lại nội dung";
    b.onclick = function () { if (reload) location.reload(); else unlock(); };
    $("#lock").hidden = false;
    if (ms) setTimeout(function again() { if (down.Meta && down.Shift) setTimeout(again, 800); else unlock(); }, ms);
  }
  function unlock() { if (hard) return; locked = false; $("#lock").hidden = true; render(); }

  /* kiểm tra bộ chặn của web còn chạy không: tiện ích kiểu "Allow Copy" chặn các sự kiện này nên bị lộ */
  function tampered() {
    var cs = getComputedStyle($("#secure-shadow-root")), us = cs.userSelect || cs.webkitUserSelect;
    if (us && us !== "none") return true;
    var evs = [new MouseEvent("contextmenu", { bubbles: true, cancelable: true }), new Event("selectstart", { bubbles: true, cancelable: true })];
    try { evs.push(new ClipboardEvent("copy", { bubbles: true, cancelable: true })); } catch (e) {}
    return evs.some(function (ev) { return document.body.dispatchEvent(ev); });   // true = không bị chặn
  }
  function guard() {
    if (locked || !contentEl) return;
    if (tampered()) { if (++strikes >= 2) lock("Phát hiện tiện ích hoặc công cụ cho phép sao chép nội dung. Chữ của chương đã bị ẩn. Hãy tắt tiện ích đó rồi tải lại trang.", true); }
    else strikes = 0;
  }
  function startReader() {
    var ready = document.fonts && document.fonts.load ? document.fonts.load("18px SecuredFont", "Aáệ").catch(function () {}) : Promise.resolve();
    var saved = lastGet(), want = params.get("tiep") && saved && saved.c === CHAPTER ? saved.p : 0;
    lastSet(CHAPTER, want);                                          // mở chương nào thì đó là chương đang đọc
    ready.then(function () {
      render(); setTimeout(guard, 700); setInterval(guard, 1500);
      if (want > 0) window.scrollTo(0, want * Math.max(0, cardBottom() - window.innerHeight));
      lastSet(CHAPTER, Math.max(want, progress()));
    });
    var tt = null;
    function savePos() { if (!locked) lastSet(CHAPTER, progress()); }
    window.addEventListener("scroll", function () { if (!tt) tt = setTimeout(function () { tt = null; savePos(); }, 400); });
    window.addEventListener("pagehide", savePos);
    var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(render, 150); });
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
  /* chụp màn hình: ẩn chữ khi bấm Win/Cmd + Shift (trước khi phím chụp được nhấn), xóa clipboard khi bấm PrintScreen */
  document.addEventListener("keydown", function (e) {
    down[e.key] = true;
    if (down.Meta && down.Shift && contentEl && !locked) lock("Phát hiện thao tác chụp màn hình. Nội dung đã được ẩn trong giây lát.", false, 2500);
  }, true);
  document.addEventListener("keyup", function (e) {
    delete down[e.key];
    if (e.key === "PrintScreen" && contentEl) {
      try { navigator.clipboard.writeText("Nội dung được bảo vệ, không cho chụp màn hình."); } catch (x) {}
      if (!locked) lock("Phát hiện phím chụp màn hình. Nội dung đã được ẩn.", false);
    }
  }, true);
  window.addEventListener("blur", function () { down = {}; });

  /* ---------- chống sao chép ---------- */
  var WEIRD = "aàảãáạăằẳẵắặâầẩẫấậbcdđeèẻẽéẹêềểễếệghiìỉĩíịklmnoòỏõóọôồổỗốộơờởỡớợpqrstuùủũúụưừửữứựvxyỳỷỹýỵz";
  function scramble(text) {
    return Array.from(text).map(function (ch) {
      if (ch === " ") return Math.random() < 0.3 ? " \u200c" : " ";
      if (ch === "\n" || /[.,!?;:()"'“”‘’]/.test(ch)) return ch;
      if (Math.random() < 0.8) { var c = WEIRD[Math.floor(Math.random() * WEIRD.length)]; return (Math.random() < 0.5 ? c.toUpperCase() : c) + (Math.random() < 0.2 ? "\u200c" : ""); }
      return ch;
    }).join("");
  }
  function inField(e) { var t = e.target; if (t && t.nodeType === 3) t = t.parentElement; return t && t.closest && t.closest("input,textarea"); }
  document.addEventListener("copy", function (e) {
    if (inField(e)) return;
    e.preventDefault();                                   // luôn chặn; nếu lỡ có chữ được chọn thì dán ra chữ loạn
    var text = String(window.getSelection());
    if (text && e.clipboardData) { var bad = scramble(text); e.clipboardData.setData("text/plain", bad); e.clipboardData.setData("text/html", bad); }
  });
  ["cut", "contextmenu", "dragstart", "selectstart"].forEach(function (ev) { document.addEventListener(ev, function (e) { if (!inField(e)) e.preventDefault(); }); });
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    if (!inField(e) && (e.ctrlKey || e.metaKey) && (k === "x" || k === "s" || k === "u" || k === "p")) e.preventDefault();
    if (e.key === "F12") e.preventDefault();
  });

  /* ---------- khởi động ---------- */
  if (!STORY || !SAFE.test(STORY) || (CHAPTER && !SAFE.test(CHAPTER))) { say("Đường dẫn chưa đúng. Hãy quay lại trang chủ và chọn truyện."); return; }
  $("#btn-toc").href = link("");
  if (window.TAC && TAC.init()) { TAC.presence(); TAC.countVisit(); }
  if (window.TAC) drawNames = TAC.bindName($("#ps-name"), $("#ps-chips"));
  loadAll().then(function () { return CHAPTER ? showChapter() : showToc(); })
    .catch(function (err) { say(err.message || "Không tải được trang."); });
})();
