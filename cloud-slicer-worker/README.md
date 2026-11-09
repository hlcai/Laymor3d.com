# Laymor3D Headless Cloud Slicer Worker (`OrcaSlicer + PrusaSlicer C++ CLI`)

Microservice Docker độc lập đóng gói nhân C++ **`OrcaSlicer v2.2.0` (`libslic3r` + `TreeSupport 2.0`)** kèm **`PrusaSlicer Organic Engine`** chạy ở chế độ **Headless Linux (`xvfb-run` + `--appimage-extract`, không cần FUSE hay GPU rời)**, cung cấp đường chạy G-code thực 100% và báo giá xưởng thương mại cho hệ thống web **Laymor3D**.

## 1. Tính năng nổi bật

- **Chuẩn G-code gốc 100% Bambu Lab / OrcaSlicer**: Cắt thực tế `.STL / .3MF` với cấu hình động (`Tree Support Auto/Slim/Strong/Hybrid`, `Gyroid / Honeycomb`, `Wall Loops`, `Brim`, `Seam`).
- **Tự động Fallback sang PrusaSlicer Organic C++ CLI**: Đảm bảo cắt thành công 100% cả các file `.STL` hoặc `.3MF` thô chưa nhúng sẵn Machine Profile của Bambu Studio.
- **Vượt trần Payload `4.5 MB` của Vercel Serverless**: Hỗ trợ nhận `fileUrl` qua `/slice` và `/slice-url` (tải trực tiếp file `.STL / .3MF` nặng tới `160 MB` từ Supabase Storage, Cloudflare R2 hoặc Google Drive).
- **Cơ chế Scale-to-Zero trên Fly.io (`fly.toml`)**: Đặt tại cụm máy chủ Singapore (`sin`), tự động tắt máy (`min_machines_running = 0`, tốn `0đ`) khi không có người cắt và tự động thức dậy trong `~1.5 giây` khi có request từ `laymor3dcom.vercel.app/3dsim`.

## 2. Triển khai lên Fly.io (Chỉ 3 lệnh)

```powershell
cd f:\Project\Laymor3d.com\cloud-slicer-worker

# 1. Đăng nhập tài khoản Fly.io của bạn (mở trình duyệt xác thực 1 chạm)
~\.fly\bin\flyctl.exe auth login

# 2. Tạo app & đẩy Docker Image trực tiếp lên cụm Singapore (Fly.io tự build trên Cloud, không cần cài Docker Desktop)
~\.fly\bin\flyctl.exe launch --copy-config --no-deploy
~\.fly\bin\flyctl.exe deploy --remote-only
```

Sau khi deploy xong, Fly.io sẽ cấp cho bạn URL dạng:
`https://laymor3d-slicer-worker.fly.dev`

## 3. Kết nối vào Next.js / Vercel (`laymor3dcom.vercel.app`)

Thêm biến môi trường sau vào `.env.local` và **Vercel Project Settings -> Environment Variables**:

```env
CLOUD_SLICER_WORKER_URL=https://laymor3d-slicer-worker.fly.dev
```

Kiểm tra trạng thái kết nối trực tiếp tại:
- `https://laymor3d-slicer-worker.fly.dev/health`
- `https://laymor3dcom.vercel.app/api/slicer/cloud-status`
