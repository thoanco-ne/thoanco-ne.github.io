/* Con trỏ chuột riêng, nút ▲ / 🌓 / ▼ (dùng chung cho cả web).
   Ảnh con trỏ: images/cursor.png và images/cursor-pointer.png (PNG 32x32). Thiếu ảnh thì dùng con trỏ mặc định. */
(function () {
  "use strict";
  var HOT = "4 2";
  var s = document.createElement("style");
  s.textContent =
    "html,body,*{cursor:url('images/cursor.png') " + HOT + ",auto}" +
    "a,a *,button,button *,select,label{cursor:url('images/cursor-pointer.png') " + HOT + ",pointer!important}" +
    "input[type=text],textarea{cursor:text!important}" +
    "html{scroll-behavior:smooth}@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}";
  document.head.appendChild(s);
  function mk(label, sym, fn) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = sym; b.title = label; b.setAttribute("aria-label", label);
    b.addEventListener("click", fn); return b;
  }
  function mount() {
    var box = document.createElement("div"); box.className = "jump";
    box.appendChild(mk("Lên đầu trang", "▲", function () { scrollTo({ top: 0, behavior: "smooth" }); }));
    box.appendChild(mk("Đổi nền sáng / tối", "🌓", function () { window.TACTheme && TACTheme.toggle(); }));
    box.appendChild(mk("Xuống cuối trang", "▼", function () { scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }); }));
    document.body.appendChild(box);
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
