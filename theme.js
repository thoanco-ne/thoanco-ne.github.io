/* Nền sáng / tối. Nhớ lựa chọn của người đọc, lần đầu theo máy của họ. */
(function () {
  var K = "tac-theme", R = document.documentElement, t = null;
  try { t = localStorage.getItem(K); } catch (e) {}
  if (t !== "light" && t !== "dark") t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  R.dataset.theme = t;
  window.TACTheme = { toggle: function () {
    R.dataset.theme = R.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(K, R.dataset.theme); } catch (e) {}
  } };
})();
