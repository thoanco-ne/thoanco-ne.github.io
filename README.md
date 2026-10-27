# Thỏ Ăn Cỏ

## Có gì trong web
- Nền sáng / tối: nút ở góc phải trên, trình duyệt nhớ lựa chọn.
- Đảo chữ + chống copy: chữ chương được đảo sẵn bởi file `tách có mã.html` (kèm font `fonts/secure-font.woff2`); trang đọc nạp chữ vào closed shadow root, chặn chuột phải / cắt / kéo thả, copy ra chữ loạn.
- Bình luận và cảm xúc từng đoạn (❤️ 😢 😡 😂): nút **+** cuối mỗi đoạn.
- Chương mới cập nhật: khung ở trang chủ tự lấy từ `list.txt` mỗi lần phát hành.

## Đưa lên GitHub Pages
1. Tải toàn bộ lên repo (nhớ cả thư mục `.github`; nếu máy không cho, tạo file `.github/workflows/deploy.yml` trên web rồi dán nội dung vào).
2. Settings → Pages → Source: **GitHub Actions**.
3. Tab Actions chờ "Phát hành web" tick xanh rồi mở link web.

## Đăng truyện / chương mới
1. Mở `tách có mã.html`, dán truyện, bấm Bước 1 rồi Bước 2 để tải ZIP.
2. Giải nén, đẩy **thư mục truyện** (ví dụ `tramkieu/`) lên repo. Font `fonts/secure-font.woff2` đã có sẵn, chỉ cần đẩy lại khi đổi công cụ.
3. Truyện mới: thêm một khối vào `STORIES` ở đầu `home.js` (`folder` = tên thư mục).
4. Chương mới của truyện cũ: công cụ luôn đánh số từ `c1`, nên hãy tách **cả truyện** rồi đẩy đè lên thư mục cũ. Chương cũ giữ nguyên ngày, chỉ chương mới hiện ở "Chương mới cập nhật". Đừng chỉ tách vài chương mới, vì sẽ đè mất `c1`, `c2`...

## Bình luận / cảm xúc (Firebase, miễn phí)
Làm đúng như bản cũ: tạo Realtime Database, dán `firebase-rules.json` vào Rules, điền thông tin vào `config.js`. Chưa điền thì bảng đoạn chỉ báo "chưa bật", web vẫn chạy.

## Giới hạn
Chỉ cản người copy thông thường, không chặn được chụp màn hình/OCR. Font cố định nên ai chịu khó phân tích font vẫn giải mã được. Chữ bị đảo nên trình đọc màn hình và công cụ tìm kiếm không đọc được chương.
