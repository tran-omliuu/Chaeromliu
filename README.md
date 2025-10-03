# Hồ sơ cá nhân Bích Trân

Trang web tĩnh (HTML/CSS/JS) giới thiệu thông tin cá nhân: nghệ thuật, toán học, thiết kế, nghiên cứu, Blender, AI.

## Cấu trúc
```
index.html   # Trang chính
style.css    # Giao diện + dark/light theme + responsive
script.js    # Toggle theme, nav mobile, hiệu ứng canvas & xuất hiện khi cuộn
README.md    # Hướng dẫn
```

## Mở trang
Chỉ cần mở file `index.html` bằng trình duyệt (Chrome, Edge, Firefox...). Không cần server.

## Tùy chỉnh nhanh
- Ảnh đại diện: Thay phần tử `.avatar-placeholder` bằng thẻ `<img src="images/me.png" alt="Bích Trân" class="avatar">` (tự tạo thư mục `images`).
- Màu sắc: Chỉnh `--gradient` và `--color-accent` trong `:root` ở `style.css`.
- Thêm dự án: Thêm khối `<div class="timeline-item">...</div>` trong phần Học tập & Dự án.
- Thêm liên hệ: Sửa nội dung section `#lien-he` trong `index.html`.
 - Ảnh nền: Đặt file `image.png` (hoặc tên khác) cùng thư mục, biến `--bg-image` trong `:root` đã trỏ tới `image.png`. Muốn đổi overlay chỉnh `--bg-overlay`.

## Triển khai lên GitHub Pages
1. Tạo repo mới trên GitHub, upload 4 file: `index.html`, `style.css`, `script.js`, `README.md`.
2. Vào Settings > Pages > Source: chọn branch `main` và `/root`.
3. Đợi vài phút, trang sẽ xuất hiện dạng: `https://<tên-user>.github.io/<tên-repo>/`.

## Nâng cấp gợi ý
- Thêm phiên bản tiếng Anh (tạo nút chuyển ngôn ngữ).
- Thêm phần gallery render Blender (dùng `<figure>` + CSS grid).
- Áp dụng lazy loading cho ảnh lớn.
- Tích hợp Formspree hoặc Netlify form để nhận tin nhắn liên hệ.
- Dùng JSON để cấu hình danh sách kỹ năng & dự án -> script sinh HTML tự động.
- Thêm Service Worker để hỗ trợ offline (PWA cơ bản).
 - Tách cấu hình màu thành file JSON + theme picker trực tiếp.

## Giấy phép
Bạn toàn quyền sử dụng và chỉnh sửa. Không phụ thuộc thư viện ngoài (ngoại trừ Google Fonts).

## Góp ý / Hỏi thêm
Có thể mở rộng thêm cấu trúc nghiên cứu (Cronbach's alpha, Kappa, EFA) thành phần minh hoạ hoặc infographic nếu muốn. Hãy yêu cầu nếu bạn cần tôi tạo thêm.
