/* =========================================================
   thỏ ăn cỏ - avatar.js
   Ảnh đại diện + khung ảnh đại diện tự đổi theo dịp lễ.

   Cách dùng:
   1) Ảnh của bạn: images/avatar.png (hoặc đổi tên ở AVATAR bên dưới).
   2) Khung thường ngày: images/frames/mac-dinh.png.
   3) Khung dịp lễ: bỏ ảnh khung vào images/frames/ rồi thêm một dòng vào EVENTS.
      Khung nên là PNG vuông, nền trong suốt, phần giữa để trống cho ảnh đại diện.
   Đến đúng ngày thì web tự đổi khung, hết ngày tự về khung thường ngày.
   Ngày viết dạng "MM-DD" (lặp lại mỗi năm) hoặc "YYYY-MM-DD" (chỉ đúng năm đó, dùng cho Tết âm lịch, Trung thu...).
   Khoảng ngày được phép bắt đầu trước Tết năm, ví dụ from "12-20" to "01-05".
   Xem thử một khung: thêm ?frame=id vào cuối link, ví dụ index.html?frame=giang-sinh
   ========================================================= */
(function () {
  "use strict";

  var AVATAR = "images/avatar.png";
  var DEFAULT_FRAME = "images/frames/mac-dinh.png";

  /* id: tên gọi ngắn (dùng khi xem thử), from/to: khoảng ngày (tính cả hai đầu), src: ảnh khung.
     Các dòng dưới là VÍ DỤ, bạn kiểm tra lại ngày và đổi ảnh cho phù hợp. */
  var EVENTS = [
    { id: "tet-duong",    from: "12-31", to: "01-02", src: "images/frames/tet-duong.png" },
    { id: "valentine",    from: "02-13", to: "02-14", src: "images/frames/valentine.png" },
    { id: "quoc-te-pn",   from: "03-07", to: "03-08", src: "images/frames/8-3.png" },
    { id: "halloween",    from: "10-25", to: "10-31", src: "images/frames/halloween.png" },
    { id: "giang-sinh",   from: "12-20", to: "12-26", src: "images/frames/giang-sinh.png" },
    /* Tết âm lịch và Trung thu đổi ngày mỗi năm, nên ghi cả năm: */
    { id: "tet-am-2027",  from: "2027-02-04", to: "2027-02-13", src: "images/frames/tet-am.png" }
  ];

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function inRange(today, from, to) {
    var y = today.getFullYear();
    var t = today.getTime();
    function parse(s, endOfDay, yearOverride) {
      var p = s.split("-").map(Number);
      var yy = p.length === 3 ? p[0] : yearOverride;
      var mm = p.length === 3 ? p[1] : p[0];
      var dd = p.length === 3 ? p[2] : p[1];
      return new Date(yy, mm - 1, dd, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0).getTime();
    }
    var f = parse(from, false, y), e = parse(to, true, y);
    if (from.length === 5 && f > e) {           // khoảng qua năm mới (12-20 -> 01-05)
      return t >= f || t <= e;
    }
    return t >= f && t <= e;
  }

  function currentFrames() {
    var forced = null;
    try { forced = new URLSearchParams(location.search).get("frame"); } catch (e) {}
    var list = [];
    var now = new Date();
    EVENTS.forEach(function (ev) {
      if ((forced && ev.id === forced) || (!forced && inRange(now, ev.from, ev.to))) list.push(ev.src);
    });
    if (DEFAULT_FRAME) list.push(DEFAULT_FRAME);
    return list;
  }

  /* thử lần lượt từng ảnh, cái nào tải được thì dùng (thiếu ảnh thì tự lùi về khung thường ngày) */
  function firstLoadable(urls, done) {
    var i = 0;
    (function next() {
      if (i >= urls.length) { done(null); return; }
      var img = new Image();
      var url = urls[i++];
      img.onload = function () { done(url); };
      img.onerror = next;
      img.src = url;
    })();
  }

  function init() {
    var photo = document.getElementById("avatar-photo");
    var frame = document.getElementById("avatar-frame");
    if (photo && AVATAR) {
      var t = new Image();
      t.onload = function () { photo.src = AVATAR; };
      t.src = AVATAR;
    }
    if (frame) {
      firstLoadable(currentFrames(), function (url) {
        if (url) { frame.src = url; frame.hidden = false; frame.parentNode.classList.add("has-frame"); }
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
