/* =========================================================
   thỏ ăn cỏ - comments-core.js
   Phần dùng chung để gửi và đọc bình luận (trang chủ, cuối chương, từng đoạn).
   Mọi bình luận nằm chung một chỗ trong Firebase (nhánh "comments"):
     - bình luận trang chủ:  { name, body, t }
     - bình luận chương:     { name, body, t, s, c, ck }          s = thư mục truyện, c = mã chương
     - bình luận đoạn:       { name, body, t, s, c, ck, p }       p = số thứ tự đoạn (từ 0)
   Nhờ vậy trang chủ gom được tất cả bình luận mới nhất vào một khung.
   ========================================================= */
window.TAC = (function () {
  "use strict";
  var COOLDOWN = 30;                 // giây giữa hai lần gửi của cùng một người
  var LAST_KEY = "tac-last-comment";
  var NAME_KEY = "tac-cmt-name";
  var db = null;

  function cfg() { return window.TAC_FIREBASE || {}; }
  function ready() {
    var f = cfg();
    return !!(window.firebase && f.apiKey && f.databaseURL && f.projectId);
  }
  function init() {
    if (db) return db;
    if (!ready()) return null;
    try {
      if (!firebase.apps.length) firebase.initializeApp(cfg());
      db = firebase.database();
    } catch (e) { console.error(e); db = null; }
    return db;
  }

  function savedName() {
    try { return localStorage.getItem(NAME_KEY) || ""; } catch (e) { return ""; }
  }

  function toList(snap) {
    var a = [];
    snap.forEach(function (ch) {
      var v = ch.val() || {};
      a.push({
        id: ch.key, name: v.name, body: v.body, t: v.t || 0,
        s: v.s || null, c: v.c || null,
        p: typeof v.p === "number" ? v.p : null
      });
    });
    a.sort(function (x, y) { return y.t - x.t; });
    return a;
  }

  /* gửi một bình luận. o = { name, body, s?, c?, p? }. Trả về Promise, lỗi có sẵn câu tiếng Việt. */
  function post(o) {
    if (!init()) return Promise.reject(new Error("Khung bình luận chưa được cấu hình."));
    var body = String(o.body || "").trim();
    if (!body) return Promise.reject(new Error("Bạn chưa viết nội dung bình luận."));
    var name = (String(o.name || "").trim() || "Khách qua đường").slice(0, 30);

    var last = 0;
    try { last = parseInt(localStorage.getItem(LAST_KEY), 10) || 0; } catch (e) {}
    var left = Math.ceil(COOLDOWN - (Date.now() - last) / 1000);
    if (left > 0) return Promise.reject(new Error("Bạn vừa gửi xong, chờ " + left + " giây nữa rồi gửi tiếp nhé."));

    var rec = { name: name, body: body.slice(0, 500), t: firebase.database.ServerValue.TIMESTAMP };
    if (o.s && o.c) {
      rec.s = o.s; rec.c = o.c; rec.ck = o.s + "|" + o.c;
      if (typeof o.p === "number") rec.p = o.p;
    }
    return db.ref("comments").push(rec).then(function () {
      try {
        localStorage.setItem(LAST_KEY, String(Date.now()));
        localStorage.setItem(NAME_KEY, name);
      } catch (e) {}
    }, function (err) {
      console.error(err);
      throw new Error("Gửi chưa được, bạn thử lại sau nhé.");
    });
  }

  /* n bình luận mới nhất của cả web (mọi nơi) */
  function watchRecent(n, cb, onErr) {
    if (!init()) return false;
    db.ref("comments").orderByChild("t").limitToLast(n)
      .on("value", function (snap) { cb(toList(snap)); }, onErr || function () {});
    return true;
  }

  /* tất cả bình luận của một chương (gồm bình luận chương và bình luận đoạn) */
  function watchChapter(s, c, cb, onErr) {
    if (!init()) return false;
    db.ref("comments").orderByChild("ck").equalTo(s + "|" + c).limitToLast(500)
      .on("value", function (snap) { cb(toList(snap)); }, onErr || function () {});
    return true;
  }

  return { ready: ready, init: init, post: post, savedName: savedName,
           watchRecent: watchRecent, watchChapter: watchChapter };
})();
