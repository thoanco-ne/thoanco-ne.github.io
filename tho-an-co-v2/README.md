# thỏ ăn cỏ - bản 2 (có đảo ký tự + chống copy)

## Cấu trúc
```
index.html, doc.html, style.css, script.js   trang web
build.py                                     đảo ký tự, tạo font bảo mật
fonts/normal-font.ttf                        font gốc (có sẵn font mẫu, bạn có thể thay)
vi-du/                                       truyện mẫu (xoá khi đăng truyện thật)
data/comments.json                           bình luận (tự cập nhật)
.github/workflows/deploy.yml                 tự phát hành
```

## Cách đưa lên GitHub Pages
1. Tải toàn bộ lên repo (kéo thả cả thư mục cũng được).
   Nếu máy không cho tải thư mục `.github`: vào repo → Add file → Create new file,
   gõ tên `.github/workflows/deploy.yml` (gõ dấu / là tự tạo thư mục), dán nội dung file vào, Commit.
2. Vào Settings → Pages → Source chọn **GitHub Actions** (không chọn "Deploy from a branch").
3. Vào tab Actions, chờ "Phát hành web" chạy xong dấu tick xanh (khoảng 1 phút), rồi mở link web.

## Đăng truyện mới
Mỗi truyện là một thư mục ở ngoài cùng của repo, ví dụ `ten-truyen/`:
```
ten-truyen/list.txt       danh sách chương
ten-truyen/chuong-1.txt   nội dung chương 1
ten-truyen/chuong-2.txt
```
`list.txt` viết thế này (dòng đầu là tên truyện, các dòng sau là `mã-chương: tiêu đề`):
```
# Tên Truyện
chuong-1: Chương 1: Mở đầu
chuong-2: Chương 2: Gặp gỡ
```
Mỗi file chương: dòng đầu là `# Tiêu đề chương`, sau đó là nội dung, các đoạn cách nhau một dòng trống.

Rồi thêm truyện vào danh sách `STORIES` ở đầu file `script.js` (copy khối truyện mẫu, sửa lại; `folder` là tên thư mục, `status` là `"done"` hoặc `"ongoing"`).
Mỗi chương mới: thêm một dòng vào `list.txt`, thêm file `.txt`, thêm một dòng vào `chapters` của truyện trong `script.js` để nó hiện ở khung "Chương mới cập nhật".

## Bảo vệ chữ hoạt động ra sao
- `build.py` tạo font bảo mật: hoán đổi ngẫu nhiên hình dạng các chữ tiếng Việt, và đảo chữ trong file `.txt` tương ứng. File `.txt` trên web chỉ là chữ loạn, nhưng khi hiển thị bằng font bảo mật thì người đọc thấy đúng.
- Trang đọc nạp chữ vào "closed shadow root", chặn chuột phải/cắt/kéo thả, và khi bôi đen rồi copy thì dán ra chữ bị loạn.

## Giới hạn cần biết
- Đây là hàng rào cản người copy thông thường, không ngăn được chụp màn hình hay chạy OCR.
- **Repo Public thì file gốc `ten-truyen/chuong-1.txt` trong repo ai cũng đọc được trên GitHub.** Chỉ bản đăng lên web mới bị đảo. Muốn giấu file gốc, cần để repo Private và dùng Cloudflare Pages: Build command `pip install fonttools brotli && python build.py`, Output directory `public`.
- Chữ bị đảo nên trình đọc màn hình và công cụ tìm kiếm không đọc được nội dung chương.
- Font mẫu là DejaVu Serif. Muốn đổi, thay file `fonts/normal-font.ttf` bằng font TTF khác có đủ chữ tiếng Việt (nếu thiếu chữ nào, lúc chạy sẽ có cảnh báo trong tab Actions).
- Muốn bí mật hơn: Settings → Secrets and variables → Actions → New repository secret, tên `FONT_SEED`, giá trị là một chuỗi bất kỳ của bạn. Đổi giá trị này thì font và chữ đổi theo, nhưng lần phát hành tiếp theo sẽ đồng bộ lại tất cả.

## Bình luận toàn web
Bật Discussions cho repo, cài app giscus (https://giscus.app/vi), rồi điền thông tin vào `CONFIG.giscus` ở đầu `script.js`. Khung "Bình luận mới" tự cập nhật mỗi 30 phút. Chưa làm bước này thì web vẫn chạy, chỉ là khung bình luận trống.
