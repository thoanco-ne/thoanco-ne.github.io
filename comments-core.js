/* =========================================================
   thỏ ăn cỏ - comments-core.js
   Phần dùng chung để gửi và đọc bình luận (trang chủ, cuối chương, từng đoạn).
   Mọi bình luận nằm chung một chỗ trong Firebase (nhánh "comments"):
     - bình luận trang chủ:  { name, body, t }
     - bình luận chương:     { name, body, t, s, c, ck }          s = thư mục truyện, c = mã chương
     - bình luận đoạn:       { name, body, t, s, c, ck, p }       p = số thứ tự đoạn (từ 0)
   Nhờ vậy trang chủ gom được tất cả bình luận mới nhất vào một khung.
   Cảm xúc (tim, khóc, tức giận, cười) lưu riêng ở nhánh "reactions" dạng số đếm.
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
    var name = String(o.name || "").trim().slice(0, 30);
    if (!name) return Promise.reject(new Error("Bạn cần nhập tên nhé."));

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
        rememberName(name);
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

  /* cảm xúc về từng đoạn: reactions/{truyện}/{chương}/{đoạn}/{loại} = số lượng */
  function react(s, c, p, t, delta) {
    if (!init()) return Promise.reject(new Error("chưa cấu hình"));
    var ref = db.ref("reactions/" + s + "/" + c + "/" + p + "/" + t);
    return ref.transaction(function (v) {
      var n = (v || 0) + (delta > 0 ? 1 : -1);
      return n < 0 ? 0 : n;
    });
  }
  function watchReactions(s, c, cb, onErr) {
    if (!init()) return false;
    db.ref("reactions/" + s + "/" + c)
      .on("value", function (snap) { cb(snap.val() || {}); }, onErr || function () {});
    return true;
  }


  /* ---- tên đã dùng: nhớ tối đa 8 tên, tên mới nhất đứng đầu ---- */
  function names() {
    try { var a = JSON.parse(localStorage.getItem("tac-names") || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function rememberName(n) {
    var a = names().filter(function (x) { return x !== n; }); a.unshift(n);
    try { localStorage.setItem("tac-names", JSON.stringify(a.slice(0, 8))); localStorage.setItem(NAME_KEY, n); } catch (e) {}
  }
  /* điền sẵn tên gần nhất vào ô input, và hiện các tên đã dùng thành nút bấm. Trả về hàm vẽ lại. */
  function bindName(input, box) {
    function draw() {
      box.textContent = "";
      var a = names();
      if (!a.length) return;
      var l = document.createElement("span"); l.textContent = "Tên đã dùng:"; box.appendChild(l);
      a.forEach(function (n) {
        var b = document.createElement("button"); b.type = "button"; b.textContent = n;
        b.addEventListener("click", function () { input.value = n; });
        box.appendChild(b);
      });
    }
    input.value = savedName(); draw();
    return draw;
  }

  /* ---- tim chương: likes/{truyện}/{chương} = số lượng ---- */
  function like(s, c, delta) {
    if (!init()) return Promise.reject(new Error("chưa cấu hình"));
    return db.ref("likes/" + s + "/" + c).transaction(function (v) {
      var n = (v || 0) + (delta > 0 ? 1 : -1); return n < 0 ? 0 : n;
    });
  }
  function watchLikes(s, cb) {
    if (!init()) return false;
    db.ref("likes/" + s).on("value", function (snap) { cb(snap.val() || {}); }, function () {});
    return true;
  }
  /* số bình luận của từng chương trong một truyện: { maChuong: soLuong } */
  function countByStory(s, cb) {
    if (!init()) return false;
    db.ref("comments").orderByChild("s").equalTo(s).limitToLast(3000).on("value", function (snap) {
      var m = {}; snap.forEach(function (ch) { var k = (ch.val() || {}).c; if (k) m[k] = (m[k] || 0) + 1; });
      cb(m);
    }, function () {});
    return true;
  }

  /* ---- review truyện: { name, s, stars (1-5), body, t } ---- */
  function postReview(o) {
    if (!init()) return Promise.reject(new Error("Khung review chưa được cấu hình."));
    var name = String(o.name || "").trim().slice(0, 30), body = String(o.body || "").trim();
    if (!name) return Promise.reject(new Error("Bạn cần nhập tên nhé."));
    if (!o.s) return Promise.reject(new Error("Bạn chưa chọn truyện."));
    if (!(o.stars >= 1 && o.stars <= 5)) return Promise.reject(new Error("Bạn chưa chấm sao."));
    if (!body) return Promise.reject(new Error("Bạn chưa viết cảm nhận."));
    var last = 0;
    try { last = parseInt(localStorage.getItem(LAST_KEY), 10) || 0; } catch (e) {}
    var left = Math.ceil(COOLDOWN - (Date.now() - last) / 1000);
    if (left > 0) return Promise.reject(new Error("Bạn vừa gửi xong, chờ " + left + " giây nữa nhé."));
    return db.ref("reviews").push({ name: name, s: o.s, stars: Math.round(o.stars), body: body.slice(0, 500), t: firebase.database.ServerValue.TIMESTAMP })
      .then(function () { try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch (e) {} rememberName(name); },
            function () { throw new Error("Gửi chưa được, bạn thử lại sau nhé."); });
  }
  function watchReviews(n, cb) {
    if (!init()) return false;
    db.ref("reviews").orderByChild("t").limitToLast(n).on("value", function (snap) {
      var a = []; snap.forEach(function (ch) { var v = ch.val() || {}; a.push({ name: v.name, s: v.s, stars: v.stars, body: v.body, t: v.t || 0 }); });
      a.sort(function (x, y) { return y.t - x.t; }); cb(a);
    }, function () {});
    return true;
  }


  /* ---- đang online: mỗi tab đang mở là một mục trong "online", tự xóa khi đóng tab ---- */
  function presence(cb) {
    if (!init()) return false;
    var me = db.ref("online").push();
    db.ref(".info/connected").on("value", function (s) {
      if (s.val() === true) { me.onDisconnect().remove(); me.set(firebase.database.ServerValue.TIMESTAMP); }
    });
    if (cb) db.ref("online").on("value", function (snap) { cb(snap.numChildren()); }, function () {});
    return true;
  }
  /* ---- lượt ghé thăm: cộng 1 lần cho mỗi lần mở web (mỗi phiên trình duyệt) ---- */
  function countVisit(cb) {
    if (!init()) return false;
    var ref = db.ref("stats/visits");
    try {
      if (!sessionStorage.getItem("tac-visit")) {
        sessionStorage.setItem("tac-visit", "1");
        ref.transaction(function (v) { return (v || 0) + 1; });
      }
    } catch (e) {}
    if (cb) ref.on("value", function (s) { cb(s.val() || 0); }, function () {});
    return true;
  }
  return { ready: ready, init: init, post: post, savedName: savedName,
           watchRecent: watchRecent, watchChapter: watchChapter,
           react: react, watchReactions: watchReactions,
           like: like, watchLikes: watchLikes, countByStory: countByStory,
           postReview: postReview, watchReviews: watchReviews, bindName: bindName, presence: presence, countVisit: countVisit, names: names };
})();
