/* Nền sáng / tối: nhớ lựa chọn của người đọc, lần đầu theo máy của họ */
(function () {
  var K = "tac-theme", R = document.documentElement, t = null;
  try { t = localStorage.getItem(K); } catch (e) {}
  if (t !== "light" && t !== "dark") t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  R.dataset.theme = t;
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.createElement("button");
    b.type = "button"; b.className = "theme-btn";
    function paint() {
      var d = R.dataset.theme === "dark";
      b.textContent = d ? "☀️" : "🌙";
      b.setAttribute("aria-label", d ? "Chuyển sang nền sáng" : "Chuyển sang nền tối");
    }
    b.onclick = function () {
      R.dataset.theme = R.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem(K, R.dataset.theme); } catch (e) {}
      paint();
    };
    paint();
    document.body.appendChild(b);
  });
})();
