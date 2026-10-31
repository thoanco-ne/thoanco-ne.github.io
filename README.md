# Thỏ Ăn Cỏ

Web truyện tĩnh: chạy trên Cloudflare Pages, repo GitHub để Private, bình luận lưu ở Firebase.
Thư mục này là **toàn bộ repo**. Công cụ đăng truyện (`cong-cu-dang-truyen.html`) nằm riêng bên ngoài, **không đưa lên repo**.

## Có gì trong web
- Nền sáng / tối (nút 🌓), nút ▲ ▼, con trỏ chuột riêng, hộp xác nhận 18+, ảnh đại diện có khung theo dịp lễ (xem `avatar.js`).
- Trang chủ: mái che, giới thiệu, ô 📌 lịch đăng, kệ truyện (3 truyện một hàng, truyện thứ 4 xuống dòng), chương mới, bình luận mới, review, số người đang trồng cà rốt, lượt ghé thăm.
- Mục lục truyện: khung giới thiệu + danh sách chương có ngày đăng, số bình luận, số cà rốt 🥕.
- Trang đọc: chữ vẽ lên canvas (không có chữ trong trang), nhiều lớp chống copy / chụp màn hình (xem mục Bảo vệ nội dung), nút + ở từng đoạn (bình luận + cảm xúc), cà rốt cuối chương, bình luận chương, A−/A+.
- Chương hẹn giờ tự hiện đúng giờ (GitHub Actions chạy mỗi 30 phút).

## Cài đặt (làm một lần)

### 1. Firebase (bình luận, review, cà rốt, đếm online)
1. Vào console.firebase.google.com, tạo dự án, bật **Realtime Database** (chế độ khóa).
2. Tab Rules: dán toàn bộ nội dung `firebase-rules.json`, bấm Publish. **Dán lại cả khi bạn đã có dự án cũ**, vì bộ luật có thêm review, cà rốt, online, lượt ghé.
3. Project settings → Your apps → thêm Web app → chép 5 thông tin vào `config.js`.
Không điền `config.js` thì web vẫn chạy, chỉ là các phần tương tác báo "chưa bật".

### 2. Cloudflare Pages
1. Tạo tài khoản Cloudflare, vào Workers & Pages → Create → Pages → **Direct Upload** (không chọn nối GitHub, vì project nối Git không đổi sang Direct Upload được). Đặt tên project, tải lên tạm một file bất kỳ để tạo project.
2. Tạo API token (My Profile → API Tokens) có quyền sửa Cloudflare Pages. Chép Account ID.
Tên các mục trên giao diện Cloudflare có thể khác đôi chút.

### 3. GitHub
1. Tạo repo **Private**, đưa toàn bộ nội dung thư mục này lên (nhớ cả thư mục `.github`).
2. Settings → Secrets and variables → Actions → thêm 3 secret: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PROJECT` (tên project ở bước 2).
3. Tab Actions → "Phát hành web lên Cloudflare Pages" → Run workflow. Xong sẽ có địa chỉ dạng `tên.pages.dev`.
Từ đó, mỗi lần bạn đẩy file lên GitHub web tự cập nhật, và cứ 30 phút kiểm tra một lần để hiện chương đến giờ.

## Đăng truyện bằng công cụ
Mở `cong-cu-dang-truyen.html` bằng trình duyệt (bấm đúp). Các bước:
1. Nhập ID truyện, tên, tác giả, thể loại, mô tả; dán nội dung; chọn cách nhận biết chương.
2. Hẹn giờ: đăng ngay mấy chương đầu, các chương sau mỗi mấy ngày lúc mấy giờ. Sửa được giờ từng chương, để trống là đăng ngay.
3. Bấm "Tách chương và xếp lịch", rồi **Tải ZIP** (giải nén, kéo vào repo) hoặc **Đăng thẳng lên GitHub**.
Truyện đã có: nhập ID rồi bấm "Tải truyện này từ GitHub", chương mới được đánh số tiếp, không đè chương cũ.

**Đăng thẳng** cần token một lần: github.com/settings/personal-access-tokens/new → chỉ chọn đúng repo của web → quyền *Contents: Read and write* → dán vào ô Token trong công cụ (mục Cài đặt GitHub). Token lưu trong trình duyệt của bạn. Đừng đưa file công cụ lên mạng.

## Chỉnh nội dung
- Chữ giới thiệu, dòng chữ trên cùng, tên cuối trang: sửa trong `index.html`. Link Facebook: biến `FB_URL` đầu `home.js`.
- Ô 📌 lịch đăng: sửa file `lich-dang.txt` hoặc dùng ô ghi chú trong công cụ. Nội dung `-` thì ẩn ô.
- Bỏ hộp 18+: xóa dòng `<script src="age-gate.js">` trong `index.html` và `doc.html`.
- Ảnh bìa: bỏ file `cover.jpg` vào thư mục truyện (hoặc chọn ảnh trong công cụ).

## Truyện cũ (tramkieu)
Chép thư mục `tramkieu/` vào repo (các file chương là bản đã đảo bằng công cụ cũ, dùng được luôn). Thêm file `info.json` trong thư mục đó, mẫu xem ở `vi-du/info.json`. Truyện tự hiện trên trang chủ, không cần sửa code.

## Bảo vệ nội dung (các lớp đang bật ở trang đọc)
1. Chữ trong file chương đã bị đảo bằng công cụ, chỉ đọc được khi hiển thị bằng font bảo mật.
2. Chữ được **vẽ lên canvas**: trong trang không có chữ để bôi đen, copy, lưu trang hay đọc bằng tiện ích.
3. Khóa chọn chữ, chặn chuột phải, cắt, kéo thả, Ctrl+S/U/P/X, F12; in ấn ra trang trống.
4. **Phát hiện tiện ích kiểu Allow Copy**: web tự thử các sự kiện chặn mỗi 1,5 giây. Bị tiện ích vô hiệu hóa thì chữ bị xóa khỏi trang và hiện cảnh báo, phải tắt tiện ích rồi tải lại.
5. **Chụp màn hình:** bấm Win/Cmd + Shift thì chữ ẩn trong 2,5 giây (cố ẩn trước khi phím chụp được nhấn); bấm PrintScreen thì chữ ẩn và clipboard bị ghi đè.
6. **Hình mờ** mã người đọc và ngày được vẽ thẳng vào chữ (đổi `WATERMARK` ở đầu khối bảo vệ trong `reader.js` thành `false` để tắt).
Đánh đổi: trình đọc màn hình, dịch trang tự động và tìm chữ trong trang (Ctrl+F) không dùng được với chữ chương.

## Lưu ý
- Không có cách nào chặn tuyệt đối trên web: chụp màn hình bằng điện thoại, chụp hoặc quay bằng máy khác, hay gõ lại bằng tay thì không chặn được. Hình mờ chỉ giúp truy nguồn.
- "Đang online" đếm số tab đang mở; "lượt ghé" cộng một lần cho mỗi lần mở web. Hai số này là ước lượng, không phải thống kê chính xác.
- Chương hẹn giờ có thể hiện trễ vài phút đến vài chục phút so với giờ hẹn (GitHub chạy lịch không đúng từng phút).
