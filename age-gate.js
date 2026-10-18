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
    "background:rgba(90,64,58,.94);font-family:'Quicksand',system-ui,sans-serif;-webkit-user-select:none;user-select:none}" +
    "#age-gate .ag-card{width:min(420px,100%);background:#fff6ee;color:#5a403a;border:3px dashed #7d5d52;" +
    "border-radius:20px;padding:26px 22px;text-align:center;box-shadow:0 10px 0 rgba(0,0,0,.2)}" +
    "#age-gate .ag-badge{width:72px;height:72px;margin:0 auto 10px;border-radius:50%;display:grid;place-items:center;" +
    "background:#f7d8d8;border:3px solid #7d5d52;font:700 26px 'Itim','Quicksand',sans-serif;color:#7d5d52}" +
    "#age-gate h2{margin:0 0 8px;font:400 clamp(21px,5.5vw,26px)/1.25 'Itim','Quicksand',sans-serif;color:#7d5d52}" +
    "#age-gate p{margin:0 0 18px;font-size:15px;line-height:1.55}" +
    "#age-gate .ag-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}" +
    "#age-gate button{font:400 17px 'Itim','Quicksand',sans-serif;cursor:pointer;border-radius:999px;padding:8px 20px;" +
    "border:2px dashed #7d5d52;color:#5a403a;background:#f7d8d8}" +
    "#age-gate button.ag-yes{background:#7d5d52;color:#fff6ee}" +
    "#age-gate button:hover{filter:brightness(1.07)}" +
    "#age-gate button:focus-visible{outline:3px solid #e3a1a1;outline-offset:2px}" +
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
