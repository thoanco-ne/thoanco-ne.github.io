/* =========================================================
   thỏ ăn cỏ - functions/_middleware.js  (chạy trên Cloudflare Pages, mỗi khi có người mở truyện)

   HẸN GIỜ CHÍNH XÁC: chương hẹn giờ nằm sẵn trong web nhưng bị khóa; đến đúng giờ là hiện ra,
   không cần chờ GitHub chạy lại lịch. Mọi thứ dựa trên file _schedule.json do build.py tạo.
   Chương chưa đến giờ: trả 404, và không có trong danh sách chương, trang chủ, mục lục.
   Nếu thư mục "functions" không được đưa lên, web tự về cách cũ (chỉ phát hành khi build chạy).
   ========================================================= */
let cache = null, cacheAt = 0;

async function loadSchedule(env, url) {
  if (cache && Date.now() - cacheAt < 60000) return cache;
  const r = await env.ASSETS.fetch(new URL("/_schedule.json", url));
  if (!r.ok) throw new Error("no schedule");
  cache = await r.json(); cacheAt = Date.now();
  return cache;
}
const NOSTORE = { "cache-control": "no-store" };
const asJson = (o) => new Response(JSON.stringify(o), { headers: { "content-type": "application/json; charset=utf-8", ...NOSTORE } });
const asText = (t) => new Response(t, { headers: { "content-type": "text/plain; charset=utf-8", ...NOSTORE } });
const isLive = (c, now) => !c.t || Date.parse(c.t) <= now;

function summarize(s, now) {
  const pub = s.chapters.filter((c) => isLive(c, now));
  const total = s.total || 0;
  const done = s.info.status === "done" || (total > 0 && pub.length >= total);   // đăng đủ tổng số chương thì tự hoàn
  return { pub, status: done ? "done" : "ongoing" };
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url), path = url.pathname;
  if (path === "/_schedule.json") return new Response("Not found", { status: 404 });
  const isData = path === "/data/stories.json" || path === "/data/chapters.json";
  const m = path.match(/^\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_.-]+)$/);
  if (!isData && !m) return next();

  let S;
  try { S = (await loadSchedule(env, url)).stories; } catch (e) { return next(); }   // lỗi thì dùng bản dựng sẵn
  const now = Date.now();

  if (path === "/data/stories.json") {
    const out = [];
    Object.keys(S).forEach((id) => {
      const s = S[id], { pub, status } = summarize(s, now);
      if (!pub.length) return;
      const g = s.info.genres || [];
      out.push({ id, title: s.info.title || id, author: s.info.author || "",
        genres: Array.isArray(g) ? g : String(g).split(",").map((x) => x.trim()).filter(Boolean),
        status, cover: s.cover || null, count: pub.length, total: s.total || 0,
        updated: pub.map((c) => c.date).sort().slice(-1)[0] });
    });
    out.sort((a, b) => (a.updated < b.updated ? 1 : -1));
    return asJson(out);
  }
  if (path === "/data/chapters.json") {
    const out = {};
    Object.keys(S).forEach((id) => {
      const pub = S[id].chapters.filter((c) => isLive(c, now));
      if (pub.length) out[id] = pub.map((c) => ({ id: c.id, title: c.title, date: c.date }));
    });
    return asJson(out);
  }

  const s = S[m[1]], file = m[2];
  if (!s) return next();
  if (file === "list.txt") return asText(s.chapters.filter((c) => isLive(c, now)).map((c) => c.id + ": " + c.title).join("\n"));
  if (file === "info.json") return asJson({ ...s.info, status: summarize(s, now).status });
  const mc = file.match(/^([A-Za-z0-9_-]+)\.txt$/);
  if (mc) {
    const c = s.chapters.find((x) => x.id === mc[1]);
    if (c && !isLive(c, now)) return new Response("Chương này chưa đến giờ đăng.", { status: 404, headers: NOSTORE });
  }
  return next();
}
