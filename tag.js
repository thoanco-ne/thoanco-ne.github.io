/* thỏ ăn cỏ - tag.js: trang liệt kê truyện theo thể loại (tag.html?tag=HE). Không phân biệt hoa thường và dấu. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function key(s) { return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().trim(); }
  var want = new URLSearchParams(location.search).get("tag") || "";

  fetch("data/stories.json", { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).catch(function () { return []; }).then(function (stories) {
    var tags = {};
    stories.forEach(function (s) { (s.genres || []).forEach(function (g) { var k = key(g); if (k) (tags[k] = tags[k] || { name: g, n: 0 }).n++; }); });
    var row = $("#all-tags");
    Object.keys(tags).sort().forEach(function (k) {
      var a = el("a", "tagf" + (k === key(want) ? " on" : ""), tags[k].name + " (" + tags[k].n + ")");
      a.href = "tag.html?tag=" + encodeURIComponent(tags[k].name); row.appendChild(a);
    });
    if (!Object.keys(tags).length) row.appendChild(el("p", "muted", "Chưa có thể loại nào."));
    var box = $("#list");
    if (!want) { $("#tag-title").textContent = "🏷️ Tất cả thể loại"; box.appendChild(el("p", "muted", "Chọn một thể loại ở trên để xem các truyện cùng thể loại.")); return; }
    var list = stories.filter(function (s) { return (s.genres || []).some(function (g) { return key(g) === key(want); }); });
    $("#tag-title").textContent = "🏷️ " + want + " (" + list.length + " truyện)";
    document.title = $("#tag-title").textContent + " · Thỏ Ăn Cỏ";
    if (!list.length) { box.appendChild(el("div", "empty-box", "Chưa có truyện nào thuộc thể loại này")); return; }
    list.forEach(function (s) {
      var a = el("a", "story"); a.href = "doc.html?story=" + encodeURIComponent(s.id);
      var cv = el("div", "cover");
      if (s.cover) { cv.className = "cover has-img"; var im = el("img"); im.src = s.cover; im.alt = ""; im.loading = "lazy"; cv.appendChild(im); } else cv.textContent = "ảnh bìa";
      var d = el("div"); d.appendChild(el("b", "", s.title));
      d.appendChild(el("span", "", "✍ " + (s.author || "—") + " · 📖 " + (s.total > s.count ? s.count + "/" + s.total : s.count) + " chương"));
      (s.genres || []).forEach(function (g) { d.appendChild(el("i", "tagf" + (key(g) === key(want) ? " on" : ""), g)); });
      a.appendChild(cv); a.appendChild(d); box.appendChild(a);
    });
  });
})();
