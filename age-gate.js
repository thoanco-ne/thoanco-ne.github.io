/* =========================================================
   thỏ ăn cỏ - age-gate.js
   Hộp thông báo xác nhận đủ 18 tuổi, hiện trước khi xem web.
   Lựa chọn "đủ 18 tuổi" được nhớ trên trình duyệt của người đọc (30 ngày).
   Muốn đổi chữ: sửa phần TEXT bên dưới. Muốn đổi số ngày nhớ: sửa REMEMBER_DAYS.
   ========================================================= */
(function () {
  "use strict";

  var KEY = "tac-age-ok";
  var REMEMBER_DAYS = 30;
  var LEAVE_URL = "https://www.google.com";
  var TEXT = {
    badge: "18+",
    title: "Trang web dành cho người từ 18 tuổi trở lên",
    body: "Truyện trên web có thể chứa nội dung người lớn. Khi bấm “Tôi đủ 18 tuổi”, bạn xác nhận mình đã đủ tuổi theo quy định nơi bạn sống.",
    yes: "Tôi đủ 18 tuổi",
    no: "Tôi chưa đủ tuổi",
    bye: "Cảm ơn bạn đã trung thực. Hẹn gặp lại khi bạn đủ tuổi nhé!"
  };

  function remembered() {
    try {
      var t = parseInt(localStorage.getItem(KEY), 10);
      return t && Date.now() - t < REMEMBER_DAYS * 86400000;
    } catch (e) { return false; }
  }
  function remember() {
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
  }

  if (remembered()) return;

  var style = document.createElement("style");
  style.textContent =
    "#age-gate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;" +
    "padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));" +
    "background:rgba(40,30,70,.85);font-family:'Be Vietnam Pro',system-ui,sans-serif;-webkit-user-select:none;user-select:none}" +
    "#age-gate .ag-card{width:min(420px,100%);background:#fffafd;color:#4b4468;border:1px solid #cfc6ee;" +
    "border-radius:20px;padding:26px 22px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.5)}" +
    "#age-gate .ag-badge{width:72px;height:72px;margin:0 auto 10px;border-radius:50%;display:grid;place-items:center;" +
    "background:#f6c9dc;border:2px solid #cfc6ee;font:800 24px 'Be Vietnam Pro',sans-serif;color:#8f7fd6}" +
    "#age-gate h2{margin:0 0 8px;font:600 clamp(20px,5.2vw,24px)/1.3 'Be Vietnam Pro',sans-serif;color:#4b4468}" +
    "#age-gate p{margin:0 0 18px;font-size:15px;line-height:1.55}" +
    "#age-gate .ag-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}" +
    "#age-gate button{font:400 15px 'Be Vietnam Pro',sans-serif;cursor:pointer;border-radius:8px;padding:9px 20px;" +
    "border:2px solid #cfc6ee;color:#4b4468;background:#f6c9dc}" +
    "#age-gate button.ag-yes{background:#f7d9a8;color:#4b4468;border-color:#f7d9a8;font-weight:700}" +
    "#age-gate button:hover{filter:brightness(1.07)}" +
    "#age-gate button:focus-visible{outline:2px solid #8f7fd6;outline-offset:2px}" +
    "html.ag-lock,html.ag-lock body{overflow:hidden!important}";
  document.head.appendChild(style);

  var gate = document.createElement("div");
  gate.id = "age-gate";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-labelledby", "ag-title");

  var card = document.createElement("div");
  card.className = "ag-card";

  var badge = document.createElement("div");
  badge.className = "ag-badge";
  badge.textContent = TEXT.badge;

  var h = document.createElement("h2");
  h.id = "ag-title";
  h.textContent = TEXT.title;

  var p = document.createElement("p");
  p.textContent = TEXT.body;

  var row = document.createElement("div");
  row.className = "ag-row";

  var yes = document.createElement("button");
  yes.type = "button";
  yes.className = "ag-yes";
  yes.textContent = TEXT.yes;

  var no = document.createElement("button");
  no.type = "button";
  no.textContent = TEXT.no;

  row.appendChild(yes);
  row.appendChild(no);
  card.appendChild(badge);
  card.appendChild(h);
  card.appendChild(p);
  card.appendChild(row);
  gate.appendChild(card);

  document.documentElement.classList.add("ag-lock");

  function mount() {
    document.body.appendChild(gate);
    yes.focus();
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  yes.addEventListener("click", function () {
    remember();
    document.documentElement.classList.remove("ag-lock");
    gate.remove();
  });

  no.addEventListener("click", function () {
    card.textContent = "";
    var msg = document.createElement("p");
    msg.style.marginBottom = "0";
    msg.textContent = TEXT.bye;
    card.appendChild(msg);
    setTimeout(function () { location.href = LEAVE_URL; }, 1800);
  });
})();
