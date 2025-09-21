# Liêu Bích Trân — Personal Site

This folder contains a static personal site built with HTML, CSS and vanilla JavaScript.

If you want to turn this into a public link (host it on the web), here are the easiest options.

## Option A — GitHub Pages (recommended, free)
1. Create a new repository on GitHub (name it e.g. `profile-site`).
2. From your local project folder, initialize git, add, commit, and push to GitHub `main` branch:

   git init
   git add .
   git commit -m "Initial commit: personal site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo>.git
   git push -u origin main

3. This repository already contains a GitHub Actions workflow (`.github/workflows/gh-pages.yml`) that will automatically deploy the site to GitHub Pages when you push to `main`.
4. Wait a minute after the push; the Pages action will publish your site. The URL will be one of:

   - https://<your-username>.github.io/<repo>/ (project pages)
   - or custom domain if you configure one.

Notes:
- You don't need to configure any secrets — the workflow uses the built-in Pages actions and the repository's `GITHUB_TOKEN` to publish.
- If you want the site to live at https://<your-username>.github.io/ (not in a subpath), name the repository `<your-username>.github.io`.

## Option B — Netlify (super easy drag & drop)
1. Go to https://app.netlify.com/drop
2. Zip your project folder (all files including `index.html`) and drag it into the Netlify Drop area.
3. Netlify will upload and give you a public link instantly. You can also connect a GitHub repo to enable continuous deploy.

## Option C — Vercel
1. Install Vercel CLI or connect the repo at https://vercel.com/new
2. Import the repository and Vercel will deploy the static site automatically.

---

If you want, I can:
- Prepare a `.gitignore` and small commit message before you push.
- Create a small CNAME file for a custom domain.
- Tweak the GitHub Actions workflow to deploy from a different branch.

Tell me how you'd like to publish and I can help finish the steps or create any extra files.
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
