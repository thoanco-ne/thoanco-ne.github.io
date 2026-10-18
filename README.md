# thỏ ăn cỏ - bản 2 (có đảo ký tự + chống copy)

## Cấu trúc
```
index.html, doc.html, style.css, script.js   trang web
build.py                                     đảo ký tự, tạo font bảo mật
fonts/normal-font.ttf                        font gốc (có sẵn font mẫu, bạn có thể thay)
vi-du/                                       truyện mẫu (xoá khi đăng truyện thật)
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

## Bình luận (không cần tài khoản, người đọc chỉ gõ tên)
Có ba nơi bình luận, tất cả lưu chung một chỗ và được gom vào khung "Bình luận mới" ở trang chủ, kiểu "A đã bình luận ở Truyện B · Chương 2 · đoạn 5: nội dung" (bấm vào sẽ mở đúng chương, đúng đoạn):
- **Trang chủ**: nút "Viết bình luận".
- **Cuối mỗi chương**: khung "Bình luận chương".
- **Từng đoạn**: biểu tượng 💬 ở cuối mỗi đoạn, bấm vào để bình luận riêng cho đoạn đó. Đoạn nào có bình luận thì biểu tượng hiện số lượng.
Số thứ tự đoạn tính theo thứ tự đoạn trong file chương, nên nếu bạn chèn hoặc xoá đoạn giữa chương thì bình luận đoạn có thể lệch sang đoạn khác.

Dùng Firebase Realtime Database (gói miễn phí Spark). Chỉ làm một lần:
1. Vào https://console.firebase.google.com, đăng nhập Google, bấm **Add project**, đặt tên (ví dụ `tho-an-co`), tắt Google Analytics, bấm Create.
2. Menu trái: **Build → Realtime Database → Create Database**. Chọn vị trí **Singapore**, chọn **Start in locked mode**, bấm Enable.
3. Tab **Rules**: xoá hết, dán nội dung file `firebase-rules.json`, bấm **Publish**. Luật này chỉ cho thêm bình luận mới (tên 1-30 ký tự, nội dung 1-500 ký tự), không cho sửa hay xoá. Nếu bạn đã dán luật cũ thì dán lại luật mới này để bật bình luận chương và đoạn.
4. Bánh răng cạnh "Project Overview" → **Project settings** → kéo xuống **Your apps** → bấm biểu tượng web `</>` → đặt tên app → Register. Copy khối `firebaseConfig`.
5. Mở file **`config.js`**, điền các giá trị `apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId`. Commit. (Một file này dùng chung cho cả trang chủ và trang đọc truyện.)
6. Thử: mở web, gửi một bình luận ở trang chủ, rồi vào một chương gửi bình luận chương và bình luận đoạn. Cả ba hiện ngay ở khung "Bình luận mới".

Chưa điền `config.js` thì các khung bình luận ẩn hoặc báo chưa cấu hình, phần còn lại của web vẫn chạy bình thường.

Xoá bình luận xấu: Firebase Console → Realtime Database → Data → `comments` → bấm dấu `×` cạnh bình luận.

Giới hạn cần biết: ai cũng gửi được nên có thể bị spam. Web đã có ô bẫy robot, chờ 30 giây giữa hai lần gửi (sửa `COOLDOWN` trong `comments-core.js`) và giới hạn độ dài, nhưng không chặn hoàn toàn được người cố tình. `apiKey` của Firebase trên web vốn công khai, độ an toàn nằm ở Rules.
Nên dùng một dự án Firebase riêng cho web này, đừng dùng chung với web khác.

## Khung PNG bọc truyện
Trang đọc truyện dùng ảnh `images/khung.png` làm khung quanh chữ. Thay file này bằng khung của bạn (giữ tên `khung.png`, nền giữa nên trong suốt hoặc để trống). Không có ảnh thì trang dùng khung đơn giản mặc định.
Nếu khung hiển thị chưa đẹp, chỉnh trong `doc.html`:
- `--frame-w` (phần CSS gần đầu file): độ dày viền. Viền bị cắt hoạ tiết thì tăng, viền quá dày thì giảm.
- `--frame-gap`: khoảng trống giữa viền và chữ. Chữ đè lên hoạ tiết thì tăng.
- `--frame-outset`: cho hoạ tiết như cái nơ tràn ra ngoài mép, thử `12px`.
- `FRAME_SLICE` (phần script): mặc định `"auto"`. Nếu góc khung bị méo, điền số px là bề rộng của phần góc trên ảnh gốc, ví dụ `"120"`.
Khung được kéo giãn theo chiều cao chương, nên viền cạnh trên/dưới/trái/phải nên là hoạ tiết lặp được hoặc trơn, không nên có chi tiết lớn ở giữa cạnh.

## Mẹo cho file chương
Dòng đầu mỗi file chương nên viết dạng `# Chương 1: Tên chương` (có dấu `#` và một khoảng trắng). Dòng này được giữ nguyên chữ thường để làm tiêu đề, và không bị lặp lại trong nội dung.
