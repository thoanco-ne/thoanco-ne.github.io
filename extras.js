/* =========================================================
   thỏ ăn cỏ - extras.js
   1) Đổi hình con trỏ chuột cho toàn web
   2) Nút lên đầu trang / xuống cuối trang
   3) Nút 🌓 đổi nền sáng / tối
   Cả hai trang (index.html và doc.html) đều dùng file này, nên chỉnh ở đây là đổi cả web.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1. CON TRỎ CHUỘT ----------
     Ảnh nên là PNG trong suốt, cỡ 32x32 (tối đa 128x128).
     Điểm bấm (hotspot) là toạ độ "đầu nhọn" của con trỏ tính từ góc trái trên, ví dụ "4 2".
     Chưa có ảnh hoặc ảnh lỗi thì trình duyệt tự dùng con trỏ mặc định. */
  var CURSOR_DEFAULT = "images/cursor.png";          // con trỏ thường
  var CURSOR_POINTER = "images/cursor-pointer.png";  // con trỏ khi rê lên link / nút
  var HOTSPOT = "4 2";

  /* ---------- 2. NÚT LÊN / XUỐNG ---------- */
  var LABEL_TOP = "Lên đầu trang";
  var LABEL_BOTTOM = "Xuống cuối trang";

  var css =
    "html,body,*{cursor:url('" + CURSOR_DEFAULT + "') " + HOTSPOT + ",auto}" +
    "a,a *,button,button *,[role=button],label,select,summary{cursor:url('" + CURSOR_POINTER + "') " + HOTSPOT + ",pointer!important}" +
    "input[type=text],input[type=email],input[type=password],textarea{cursor:text}" +
    "html{scroll-behavior:smooth}" +
    "@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}" +
    ".tac-jump{position:fixed;z-index:9000;right:max(12px,env(safe-area-inset-right,0px));" +
    "bottom:max(14px,env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:8px}" +
    ".tac-jump button{width:42px;height:42px;border-radius:50%;padding:0;display:grid;place-items:center;" +
    "font:600 16px/1 'Be Vietnam Pro',system-ui,sans-serif;color:var(--text,#E0E8D3);background:var(--panel-2,rgba(46,51,37,.9));" +
    "border:1px dashed var(--line-b,#7c8c63);transition:background .15s,color .15s}" +
    ".tac-jump button:hover{background:var(--panel-solid,#171913);color:var(--accent,#E6CCD3)}" +
    ".tac-jump button:focus-visible{outline:2px solid var(--accent-d,#C799A7);outline-offset:2px}" +
    "@media (max-width:560px){.tac-jump button{width:38px;height:38px}}";

  /* ---------- 3. GIAO DIỆN SÁNG / TỐI (nhớ lựa chọn của người đọc) ---------- */
  var LABEL_THEME = "Đổi nền sáng / tối";
  function applyTheme(light) { if (document.body) document.body.classList.toggle("light", light); }
  var savedLight = false;
  try { savedLight = localStorage.getItem("tac-theme") === "light"; } catch (e) {}
  applyTheme(savedLight);

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  function make(label, symbol, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = symbol;
    b.setAttribute("aria-label", label);
    b.title = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function mount() {
    var box = document.createElement("div");
    box.className = "tac-jump";
    box.appendChild(make(LABEL_TOP, "▲", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
    box.appendChild(make(LABEL_THEME, "🌓", function () {
      var light = !document.body.classList.contains("light");
      applyTheme(light);
      try { localStorage.setItem("tac-theme", light ? "light" : "dark"); } catch (e) {}
    }));
    box.appendChild(make(LABEL_BOTTOM, "▼", function () {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }));
    document.body.appendChild(box);
  }

  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
