/* thỏ ăn cỏ - home.js: trang chủ (truyện, chương mới, bình luận mới, review). */
(function () {
  "use strict";
  var FB_URL = "";            // dán link Facebook của bạn vào giữa hai dấu ngoặc kép, ví dụ "https://www.facebook.com/ten-ban"
  var $ = function (s) { return document.querySelector(s); };
  var stories = [], chap = {}, on = false;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function ago(ms) {
    var s = Math.max(0, (Date.now() - ms) / 1000);
    if (!ms) return ""; if (s < 60) return "vừa xong"; if (s < 3600) return Math.floor(s / 60) + " phút trước";
    if (s < 86400) return Math.floor(s / 3600) + " giờ trước"; if (s < 86400 * 30) return Math.floor(s / 86400) + " ngày trước";
    return new Date(ms).toLocaleDateString("vi-VN");
  }
  function link(s, c) { return "doc.html?story=" + encodeURIComponent(s) + (c ? "&chapter=" + encodeURIComponent(c) : ""); }
  function storyOf(id) { return stories.filter(function (s) { return s.id === id; })[0]; }
  function chapterTitle(s, c) { var l = (chap[s] || []).filter(function (x) { return x.id === c; })[0]; return l ? l.title : c; }
  function note(box, t) { box.textContent = ""; box.appendChild(el("p", "muted", t)); }

  if (FB_URL) $("#fb").href = FB_URL; else $("#fb").addEventListener("click", function (e) { e.preventDefault(); });   // chưa gắn link thì nút vẫn hiện nhưng chưa bấm đi đâu

  /* ---------- kệ truyện ---------- */
  function shelf(box, list) {
    box.textContent = "";
    if (!list.length) { box.appendChild(el("div", "empty-box", "Trống")); return; }
    list.forEach(function (s) {
      var a = el("a", "story"); a.href = link(s.id);
      var cv = el("div", "cover");
      if (s.cover) { var im = el("img"); im.src = s.cover; im.alt = ""; im.loading = "lazy"; cv.appendChild(im); } else cv.textContent = "ảnh bìa";
      var d = el("div"); d.appendChild(el("b", "", s.title));
      d.appendChild(el("span", "", "✍ " + (s.author || "—") + " · 📖 " + s.count + " chương"));
      (s.genres || []).forEach(function (g) { d.appendChild(el("i", "tag", g)); });
      a.appendChild(cv); a.appendChild(d); box.appendChild(a);
    });
  }
  function fillShelves() {
    shelf($("#shelf-done"), stories.filter(function (s) { return s.status === "done"; }));
    shelf($("#shelf-on"), stories.filter(function (s) { return s.status !== "done"; }));
    $("#da-hoan").textContent = "🌱 Đã lấp hố (" + stories.filter(function (s) { return s.status === "done"; }).length + ")";
    $("#dang-ra").textContent = "⛏️ Đang lấp hố (" + stories.filter(function (s) { return s.status !== "done"; }).length + ")";
    var sel = $("#rv-story"); sel.textContent = "";
    stories.forEach(function (s) { var o = el("option", "", s.title); o.value = s.id; sel.appendChild(o); });
  }
  function fillLatest() {
    var all = [], box = $("#latest"); box.textContent = "";
    Object.keys(chap).forEach(function (s) { chap[s].forEach(function (c) { all.push({ s: s, c: c, t: new Date(c.date).getTime() }); }); });
    all.sort(function (a, b) { return b.t - a.t; });
    if (!all.length) return note(box, "Chưa có chương nào.");
    all.slice(0, 30).forEach(function (x) {
      var r = el("div", "row"); r.appendChild(el("em", "", ago(x.t)));
      var a = el("a", "", ((storyOf(x.s) || {}).title || x.s) + " · " + x.c.title); a.href = link(x.s, x.c.id);
      r.appendChild(a); box.appendChild(r);
    });
  }

  /* ---------- bình luận mới ---------- */
  function fillRecent(list) {
    var box = $("#recent"); box.textContent = "";
    if (!list.length) return note(box, "Chưa có bình luận nào.");
    list.forEach(function (c) {
      var r = el("div", "row"); r.appendChild(el("em", "", ago(c.t)));
      r.appendChild(el("b", "", c.name || "ẩn danh")); r.appendChild(document.createTextNode(" "));
      if (c.s && c.c) {
        var a = el("a", "", ((storyOf(c.s) || {}).title || c.s) + " · " + chapterTitle(c.s, c.c) + (c.p !== null ? " · đoạn " + (c.p + 1) : ""));
        a.href = link(c.s, c.c); r.appendChild(document.createTextNode("ở ")); r.appendChild(a);
      } else r.appendChild(document.createTextNode("ở trang chủ"));
      r.appendChild(document.createTextNode(": “" + (c.body || "") + "”")); box.appendChild(r);
    });
  }
  var sheet = $("#csheet");
  function toggleSheet(v) { sheet.hidden = !v; document.documentElement.style.overflow = v ? "hidden" : ""; if (v) $("#cs-body").focus(); }
  $("#open-cmt").addEventListener("click", function () { toggleSheet(true); });
  $("#cs-close").addEventListener("click", function () { toggleSheet(false); });
  sheet.addEventListener("click", function (e) { if (e.target === sheet) toggleSheet(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) toggleSheet(false); });
  $("#cs-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var st = $("#cs-status"), send = $("#cs-send");
    if ($("#cs-site").value) return;
    if (!on) { st.textContent = "Bình luận chưa được bật."; return; }
    if (!$("#cs-name").value.trim()) { st.textContent = "Bạn cần nhập tên nhé."; return; }
    send.disabled = true; st.textContent = "Đang gửi…";
    TAC.post({ name: $("#cs-name").value, body: $("#cs-body").value })
      .then(function () { $("#cs-body").value = ""; st.textContent = "Đã gửi, cảm ơn bạn!"; csDraw(); })
      .catch(function (err) { st.textContent = err.message; })
      .then(function () { send.disabled = false; });
  });

  /* ---------- review ---------- */
  var stars = 0, btns = [];
  function paintStars() { btns.forEach(function (b, i) { b.classList.toggle("on", i < stars); b.setAttribute("aria-checked", i === stars - 1); }); }
  for (var i = 1; i <= 5; i++) (function (n) {
    var b = el("button", "", "★"); b.type = "button"; b.setAttribute("role", "radio"); b.setAttribute("aria-label", n + " sao");
    b.addEventListener("click", function () { stars = n; paintStars(); });
    btns.push(b); $("#stars").appendChild(b);
  })(i);
  function fillReviews(list) {
    var box = $("#rv-list"); box.textContent = "";
    if (!list.length) return note(box, "Chưa có review nào.");
    list.forEach(function (v) {
      var r = el("div", "rrow"); r.appendChild(el("b", "", v.name)); r.appendChild(document.createTextNode(" · " + ((storyOf(v.s) || {}).title || v.s)));
      var st = el("span", "st", "★★★★★".slice(0, v.stars) + "☆☆☆☆☆".slice(0, 5 - v.stars)); r.appendChild(st);
      r.appendChild(el("p", "", v.body)); box.appendChild(r);
    });
  }
  $("#rv-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var st = $("#rv-status"), send = $("#rv-send");
    if ($("#rv-site").value) return;
    if (!on) { st.textContent = "Review chưa được bật."; return; }
    send.disabled = true; st.textContent = "Đang gửi…";
    TAC.postReview({ name: $("#rv-name").value, s: $("#rv-story").value, stars: stars, body: $("#rv-text").value })
      .then(function () { $("#rv-text").value = ""; stars = 0; paintStars(); st.textContent = "Đã gửi review, cảm ơn bạn!"; rvDraw(); })
      .catch(function (err) { st.textContent = err.message; })
      .then(function () { send.disabled = false; });
  });

  /* ---------- khởi động ---------- */
  on = !!(window.TAC && TAC.init());
  fetch("lich-dang.txt", { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (t) {
    t = t.trim(); if (t && t !== "-") { $("#sched-text").textContent = t; $("#sched").hidden = false; }
  }).catch(function () {});
  if (on) {
    TAC.presence(function (n) { $("#st-online").textContent = n; });
    TAC.countVisit(function (n) { $("#st-visits").textContent = n.toLocaleString("vi-VN"); });
  }
  var csDraw = function () {}, rvDraw = function () {};
  if (window.TAC) { csDraw = TAC.bindName($("#cs-name"), $("#cs-chips")); rvDraw = TAC.bindName($("#rv-name"), $("#rv-chips")); }
  var get = function (u) { return fetch(u, { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).catch(function () { return null; }); };
  Promise.all([get("data/stories.json"), get("data/chapters.json")]).then(function (a) {
    stories = a[0] || []; chap = a[1] || {};
    fillShelves(); fillLatest();
    if (on) { TAC.watchRecent(30, fillRecent); TAC.watchReviews(30, fillReviews); }
    else { note($("#recent"), "Bình luận chưa được bật (điền config.js, xem README)."); note($("#rv-list"), "Review chưa được bật."); }
  });
})();
