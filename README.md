# thỏ ăn cỏ - hướng dẫn nhanh

## Cấu trúc thư mục
```
index.html          trang chủ
style.css           giao diện
script.js           đọc dữ liệu và hiển thị
data/stories.json   danh sách truyện + chương (bạn sửa file này)
data/comments.json  bình luận tổng hợp (tự cập nhật, không cần sửa)
images/             bỏ ảnh của bạn vào đây
.github/workflows/comments.yml   tự gom bình luận
```

## 1. Đưa lên GitHub Pages
1. Tạo repo mới (ví dụ `tho-an-co`), tải toàn bộ file lên (giữ nguyên thư mục, kể cả `.github`).
2. Vào **Settings → Pages → Branch: main / root → Save**.
3. Chờ 1-2 phút, web ở `https://tenban.github.io/tho-an-co/`.

## 2. Điền ảnh vào các ô trống
Mỗi ô trống trong `index.html` có dạng `<img src="" alt="">`. Bỏ ảnh vào `images/` rồi điền, ví dụ `src="images/avatar.png"`. Điền xong ô sẽ tự hết viền hồng và hiện ảnh.

## 3. Thêm truyện và chương mới
Sửa `data/stories.json`. Mỗi truyện:
```json
{
  "title": "Tên truyện",
  "author": "Tác giả",
  "length": "100 chương",
  "genres": ["Ngôn tình", "Cổ đại"],
  "cover": "images/bia-1.jpg",
  "url": "link trang đọc truyện",
  "status": "done",
  "chapters": [
    { "title": "Chương 12", "date": "2026-10-18", "url": "link chương" }
  ]
}
```
- `status`: `"done"` = đã lấp hố, `"ongoing"` = đang lấp hố.
- Khung "Chương mới cập nhật" tự gom mọi chương của mọi truyện, xếp theo `date` mới nhất. Mỗi lần ra chương chỉ cần thêm một dòng vào `chapters`.

## 4. Bình luận toàn web (tự tổng hợp)
Dùng giscus (miễn phí, lưu bình luận trong GitHub Discussions):
1. Repo phải công khai; vào **Settings → General → Features → bật Discussions**.
2. Cài app giscus: https://github.com/apps/giscus
3. Vào https://giscus.app/vi, nhập tên repo, chọn category, copy các giá trị `data-repo-id` và `data-category-id`.
4. Điền vào `CONFIG.giscus` ở đầu `script.js`.
5. File `.github/workflows/comments.yml` sẽ tự gom bình luận mới vào `data/comments.json` (mỗi 30 phút hoặc ngay khi có bình luận). Khung bình luận trên web có chiều cao cố định, bình luận nhiều chỉ cuộn bên trong, không làm trang dài ra.

## 5. Xem thử trên máy
Mở file trực tiếp sẽ không tải được JSON. Chạy trong thư mục dự án:
```
python -m http.server 8000
```
rồi mở http://localhost:8000

## Ghi chú
- Font Itim, Quicksand, Pacifico đều hỗ trợ tiếng Việt.
- Giao diện tự co giãn cho máy tính, máy tính bảng và điện thoại.
- Thanh chạy chữ trên cùng tự dừng nếu máy bật chế độ giảm chuyển động.
