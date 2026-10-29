# Laymor3D Headless Cloud Slicer Worker (`OrcaSlicer / Bambu Studio CLI`)

Microservice Docker độc lập đóng gói nhân C++ **`OrcaSlicer v2.2.0` (`libslic3r` + `TreeSupport 2.0`)** chạy ở chế độ **Headless Linux (`xvfb-run` + `--appimage-extract`, không cần FUSE hay GPU rời)**, cung cấp đường chạy G-code thực 100% và báo giá xưởng thương mại cho hệ thống web **Laymor3D**.

## 1. Tính năng nổi bật

- **Chuẩn G-code gốc 100% Bambu Lab / OrcaSlicer**: Cắt thực tế `.STL / .3MF` với cấu hình động (`Tree Support Auto/Slim/Strong/Hybrid`, `Gyroid / Honeycomb`, `Wall Loops`, `Brim`, `Seam`).
- **Vượt trần Payload `4.5 MB` của Vercel Serverless**: Hỗ trợ nhận `fileUrl` (tải trực tiếp file `.STL / .3MF` nặng tới `150 MB` từ Supabase Storage, Cloudflare R2 hoặc Google Drive).
- **Truyền tải nhị phân nén `.bin.gz` (`?format=binary`)**: Giảm `~85%` dung lượng mạng so với JSON và nạp thẳng vào **`VolumetricFilamentRenderer` (WebGL2 GPU Instanced Beads)** trên `/3dsim`.
- **Tự động tính Báo Giá Xưởng (VND)**: Tách bạch chính xác lượng nhựa Model (`g`), lượng nhựa Tree Support (`g`), thời gian chạy máy thực tế (`giây`) và đơn giá theo từng loại vật liệu (`PLA`, `PETG`, `ABS`, `TPU`, `PA-CF`).

## 2. Chạy nhanh trên VPS / Máy chủ xưởng / Railway / Fly.io

```bash
cd cloud-slicer-worker
docker compose up -d --build
curl http://localhost:8090/health
```

## 3. Kết nối vào Next.js / Vercel (`Laymor3d.com`)

Thêm 2 biến môi trường sau vào `.env.local` hoặc **Vercel Project Settings -> Environment Variables**:

```env
CLOUD_SLICER_WORKER_URL=https://slicer-worker.your-domain.com
CLOUD_SLICER_API_KEY=your_optional_secret_key
```

Khi được cấu hình, API `/api/slicer/upload-and-slice` và `/api/slicer/slice` trên Next.js sẽ tự động ưu tiên định tuyến sang Cloud Headless Worker; nếu Worker tắt hoặc người dùng offline, trình duyệt vẫn tự động chạy mượt bằng **In-Browser 2D-SDF Slicer + Tree Support 2.0**.
