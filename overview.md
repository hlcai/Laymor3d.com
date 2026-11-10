# 🔮 3D HUB v2 - TÀI LIỆU KIẾN TRÚC CỐT LÕI & HƯỚNG DẪN HỆ THỐNG
> **Dành cho AI Agent & Kỹ sư phần mềm**  
> *Ngôn ngữ thiết kế: Apple VisionOS Spatial Glassmorphism (Trắng Kem + Xanh Cyan Kem)*  
> *Mô hình kiến trúc: Clean Architecture 3 Lớp (UI - Feature Hook - Backend) theo Function Modules*  
> *Hệ cơ sở dữ liệu: Supabase Cloud PostgreSQL + Neon Serverless + Google Drive/Sheets Sync*  
> *Đồng bộ tri thức: Supabase Defect Knowledge DB + GitHub Sync cho Obsidian Knowledge Vault*  
> *Phiên bản: 2.5.0 • Cập nhật: 2026-11-10*

---

## 🏛️ 1. Triết Lý Thiết Kế & Kiến Trúc Cốt Lõi

Hệ thống **3D Hub v2** được xây dựng nhằm giải quyết bài toán biến hình ảnh/ý tưởng thành sản phẩm 3D thực tế thông qua trí tuệ nhân tạo (AI Spatial Intelligence) và dịch vụ in 3D công nghiệp xưởng Bambu Lab.

### 📐 Quy Tắc Bất Biến 3 Lớp (Clean Architecture 3-Tier Rule):
Mỗi Function Module bắt buộc phải tuân thủ phân tách 3 lớp độc lập:

```mermaid
flowchart TD
    subgraph Layer1["LỚP 1: GIAO DIỆN (UI - Presentation)"]
        UI1["Components hiển thị (React 19)"]
        UI2["VisionOS Frosted Milk Glass"]
        UI3["Thuần nhận Props & State từ Hook"]
    end

    subgraph Layer2["LỚP 2: HOOK TÍNH NĂNG (Feature Hook)"]
        Hook1["Quản lý Reactive State (useState, useEffect)"]
        Hook2["Điều phối luồng nghiệp vụ & Side-effects"]
        Hook3["Chuyển giao thao tác UI xuống Backend"]
    end

    subgraph Layer3["LỚP 3: BACKEND & DOMAIN SERVICES"]
        BE1["Thuật toán 3D Geometry (Three.js)"]
        BE2["AI Engine Adapters (Gemini, Fal.ai, Meshy, Tripo)"]
        BE3["Neon Serverless Postgres & GitHub Sync"]
    end

    Layer1 -->|"Gọi actions & nhận state"| Layer2
    Layer2 -->|"Thực thi logic & tính toán"| Layer3
    Layer3 -.->|"Trả dữ liệu thuần (DTO/Domain)"| Layer2
```

1. **Lớp 1 - UI (Giao diện người dùng)**:
   * Nằm tại: `src/modules/[module-name]/ui/`
   * Chỉ đảm nhiệm việc render giao diện, bắt sự kiện người dùng (onClick, onChange) và truyền vào Hook.
   * **Tuyệt đối không fetch API trực tiếp** hoặc chứa các thuật toán tính toán phức tạp.
   * Phong cách UI: **Apple VisionOS Creamy White & Frosted Glass** kết hợp **Cyan Pastel Accent**.
   * Đảm bảo **tương phản chữ cao** (Slate 900 / Slate 800 / Cyan 900), không để chữ trắng trên nền kính trắng.

2. **Lớp 2 - Feature Hook (Điều phối tính năng)**:
   * Nằm tại: `src/modules/[module-name]/hooks/`
   * Là "bộ não" điều phối của module ở client: quản lý state, memoization, validation form, gọi xuống Backend Service / API routes.
   * Cung cấp các hàm action rõ ràng cho UI (`handleGenerate`, `handleSlice`, `handleTopUp`...).

3. **Lớp 3 - Backend Code & Domain Services**:
   * Nằm tại: `src/modules/[module-name]/backend/` và `src/backend/`
   * Chứa business logic thuần túy (Three.js Geometry Builders, Slicing Cost Calculators, AI Adapters, Neon Postgres Client).
   * Không dính dáng đến React Hook hay JSX component, sẵn sàng chạy trên cả Client lẫn Server hoặc unit test độc lập.

---

## 🎨 2. Bộ Quy Chuẩn Thiết Kế Apple VisionOS (Trắng Kem + Xanh Cyan Kem)

* **Bảng màu chủ đạo**:
  * **Canvas Background**: Nền trắng kem sữa ấm `#F8F9FA` / `#F1F4F6` với vệt tán xạ ánh sáng `radial-gradient` siêu mịn.
  * **Frosted Milk Glass**: `rgba(255, 255, 255, 0.85)` đến `0.92`, `backdrop-blur-2xl`, viền phản chiếu ánh sáng trắng `border-slate-200/90`.
  * **Xanh Cyan Kem (Pastel Cyan Accent)**: `#0891B2` (Cyan chính), `#CFFAFE` (Cyan kem nhạt), gradient `from-cyan-600 to-sky-600`.
  * **Độ tương phản Typography**: SF Pro / Plus Jakarta Sans với Slate 900 (`#0F172A`) cho tiêu đề, Slate 600 (`#475569`) cho nội dung, đảm bảo độ sắc nét cao cấp trên nền kính trắng sữa.
  * **Hiệu ứng không gian (Spatial Depth)**: Đổ bóng đa lớp `shadow-[0_12px_36px_rgba(15,23,42,0.06)]` và viền specular highlight `inset 0 1px 1px rgba(255,255,255,1)`.

---

## 💾 3. Giải Pháp Lưu Trữ Vĩnh Viễn Khi Triển Khai Vercel

Do môi trường máy chủ Serverless của Vercel là **Read-Only / Ephemeral Filesystem** (mọi dữ liệu ghi vào đĩa tạm thời `/tmp` sẽ biến mất sau khi hàm kết thúc), 3D Hub v2 áp dụng mô hình 2 tầng lưu trữ chuyên biệt:

1. **Cơ sở dữ liệu Quan hệ: Neon Serverless PostgreSQL**:
   * Sử dụng SDK `@neondatabase/serverless` kết nối qua HTTP/WebSocket siêu tốc.
   * Tính năng tự động Scale-to-zero khi không dùng giúp tiết kiệm 100% chi phí.
   * Lưu trữ các bảng: `models_3d`, `orders`, `trends_analytics`, `wallet_transactions`, `crawler_sources`, `system_audit_logs`.
   * **Graceful Fallback**: Nếu chưa cấu hình `DATABASE_URL`, hệ thống tự chuyển sang Mock Data an toàn mà không làm sập ứng dụng.
   * Endpoint sức khỏe DB: `/api/neon/health` • Endpoint khởi tạo schema: `/api/neon/migrate`.

2. **Lưu trữ Tri Thức: GitHub Sync cho Obsidian Vault**:
   * Toàn bộ ghi chú Markdown, đồ thị liên kết `[[Wiki-Links]]` trong `data/obsidian-vault/` được đồng bộ trực tiếp lên GitHub repository (`PrimiasArt/3dHubv2`).
   * Sử dụng GitHub REST API (`GitHubVaultSyncService.ts`) để commit & push file markdown.
   * Kích hoạt đồng bộ 1-click qua endpoint `/api/knowledge/sync-github`.

---

## 📦 4. Danh Mục 6 Function Modules & Sub-modules

Dự án được chia tách thành **6 Function Modules cốt lõi** độc lập:

| STT | Tên Module | Thư Mục Cốt Lõi | Các Sub-modules Con | Trách Nhiệm Chính |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **3D Studio & Slicer** | `src/modules/studio/` | • `viewer`<br>• `slicer`<br>• `ai-generator`<br>• `knowledge-preview` | Khung xem 3D Three.js WebGL, thuật toán cắt lớp mô phỏng in 3D, bóc tách giá thành và tạo mô hình AI đa cấp độ. |
| **2** | **Crawler & Knowledge Vault** | `src/modules/crawler/` | • `scrapers`<br>• `vault`<br>• `terminal-logs` | Cào dữ liệu đa nền tảng (8+ nguồn: MakerWorld, YouTube, Printables...), trích xuất thông số in vào Obsidian Vault & đồng bộ GitHub. |
| **3** | **Trends & AI Intelligence** | `src/modules/trends/` | • `velocity`<br>• `tag-cloud`<br>• `gemini-advisor`<br>• `charts` | Đo lường tốc độ tăng trưởng mẫu in thế giới, lưu trữ chỉ số vào Neon DB, phân tích FDM bằng Gemini AI. |
| **4** | **Shop & 3D Manufacturing** | `src/modules/shop/` | • `marketplace`<br>• `materials`<br>• `service-quote`<br>• `cart-checkout` | Cửa hàng cuộn nhựa, linh kiện máy in, chợ file 3D bản quyền và dịch vụ đặt in gia công xưởng 24h. |
| **5** | **Wallet & Order Pipeline** | `src/modules/wallet-orders/` | • `wallet`<br>• `user-rbac`<br>• `farm-pipeline`<br>• `auth` | Ví điểm thanh toán (VietQR/MoMo), phân quyền người dùng, lưu vết giao dịch vào Neon Postgres. |
| **6** | **Admin & System Core** | `src/modules/admin-core/` | • `config-keys`<br>• `audit-telemetry`<br>• `neon-database`<br>• `github-vault` | Quản trị API Keys động (Gemini, Fal, Meshy), giám sát sức khỏe Neon DB, trigger sync Obsidian Vault lên GitHub. |

---

## 🛠️ 5. Quy Trình Phát Triển Khi Focus Vào Một Tính Năng

> **Nguyên tắc vàng**: Khi nhận yêu cầu phát triển hoặc chỉnh sửa bất kỳ tính năng nào, **CHỈ CẦN MỞ ĐÚNG THƯ MỤC CỦA MODULE ĐÓ**. Tránh can thiệp vào các module khác.

### 📋 Kịch bản thực tế:

#### Kịch bản A: Nâng cấp thuật toán tính Tree Support cho 3D Studio
1. **Chỉ làm việc tại**: `src/modules/studio/`
2. **Quy trình 3 bước**:
   * **Bước 1 (Backend)**: Mở `src/modules/studio/backend/viewer/SupportBuilder.ts` hoặc `src/modules/studio/backend/slicing/` để cải tiến thuật toán hình học cây chống.
   * **Bước 2 (Hook)**: Mở `src/modules/studio/hooks/usePrintSlicer.ts` để expose tham số mới (ví dụ: góc nghiêng `branchAngle`).
   * **Bước 3 (UI)**: Mở `src/modules/studio/ui/SupportConfigPanel.tsx` để thêm thanh trượt điều chỉnh cho người dùng.

#### Kịch bản B: Thêm một nguồn cào dữ liệu mới (ví dụ: CGTrader)
1. **Chỉ làm việc tại**: `src/modules/crawler/`
2. **Quy trình 3 bước**:
   * **Bước 1 (Backend)**: Tạo `src/modules/crawler/backend/scrapers/CGTraderScraper.ts` implements cùng interface scraper.
   * **Bước 2 (Hook)**: Đăng ký scraper vào `src/modules/crawler/hooks/usePlatformCrawler.ts`.
   * **Bước 3 (UI)**: Thêm nút chọn tab nguồn tại `src/modules/crawler/ui/CrawlerDashboard.tsx`.

---

## 🚀 6. Bảng Tiến Trình Thực Hiện & Trạng Thái Hệ Thống (Roadmap Matrix)

| Module | Phân Hệ / Tính Năng | 3 Lớp Đã Tách | Trạng Thái | Ghi Chú |
| :--- | :--- | :---: | :---: | :--- |
| **Studio** | Three.js WebGL 3D Viewer & Cầu nối `/studio ↔ /3dsim` | ✅ UI - Hook - BE | 🟢 Hoàn thành | Hỗ trợ Multi-Part/Multi-Plate, đồng bộ 2 chiều |
| **Studio / 3dsim** | Bộ cắt lớp 2D-SDF Web Worker & Cắt sợi O(S) Zero-Drop | ✅ UI - Hook - BE | 🟢 Hoàn thành | Sợi nhựa khối 3D WebGL2 Volumetric Bead Shader |
| **Studio / 3dsim** | Tree Support 3.0, Backtrack Pruning & Support Gốc Bambu | ✅ UI - Hook - BE | 🟢 Hoàn thành | Chống đâm xuyên mẫu 100%, lưới SDF `108x108`, nạp `.gcode.3mf` gốc |
| **Cloud Slicer** | Fly.io Headless OrcaSlicer v2.2.0 + PrusaSlicer C++ Worker | ✅ UI - Hook - BE | 🟢 Hoàn thành | Đã deploy tại `laymor3d-slicer-worker.fly.dev` (Singapore `sin`) |
| **Studio / 3dsim** | Xuất `.3MF` / `.STL` Tùy chọn Kèm hoặc Tách Tree Support | ✅ UI - Hook - BE | 🟢 Hoàn thành | Đóng gói đầy đủ Bambu Studio Profile để in ngay |
| **Studio / 3dsim** | Đặc trưng hình học 12D, Chuyên gia AI Copilot & Tự học RAG | ✅ UI - Hook - BE | 🟢 Hoàn thành | Tư vấn 6 nhóm thông số, Vision chẩn đoán ảnh lỗi |
| **UI / Icons** | Hệ thống Icon Minimalist CAD/Architectural độc quyền | ✅ UI - Hook - BE | 🟢 Hoàn thành | Thay thế 100% icon mặc định trên 87+ tệp giao diện |
| **Admin / Auth** | Đăng nhập riêng, Master Admin & Phân quyền từng vùng/chức năng | ✅ UI - Hook - BE | 🟢 Hoàn thành | Quản lý tài khoản trải nghiệm & duyệt Kho Tri Thức Lỗi |
| **Crawler** | Quét dữ liệu 8+ nền tảng 3D | ✅ UI - Hook - BE | 🟢 Hoàn thành | MakerWorld, Printables, Thingiverse... |
| **Crawler** | AI trích xuất Video YouTube in 3D | ✅ UI - Hook - BE | 🟢 Hoàn thành | Gemini phân tích và lập thẻ kỹ thuật |
| **Crawler** | GitHub Vault Sync Service | ✅ UI - Hook - BE | 🟢 Hoàn thành | Đồng bộ file markdown lên GitHub repo |
| **Database** | Neon Serverless PostgreSQL | ✅ UI - Hook - BE | 🟢 Hoàn thành | Scale-to-zero, tự động migrate schema |
| **Trends** | Bảng xếp hạng tăng trưởng (Velocity) | ✅ UI - Hook - BE | 🟢 Hoàn thành | Top 5 mô hình hot nhất tuần |
| **Trends** | Gemini Market Analysis Engine | ✅ UI - Hook - BE | 🟢 Hoàn thành | Gợi ý thương mại hóa & sản phẩm ngách |
| **Shop** | Danh mục cuộn nhựa & phụ kiện FDM | ✅ UI - Hook - BE | 🟢 Hoàn thành | PLA, PETG, PETG-CF, ABS |
| **Shop** | Chợ mô hình 3D bản quyền | ✅ UI - Hook - BE | 🟢 Hoàn thành | Tải file số trực tiếp |
| **Shop** | Báo giá dịch vụ in gia công tự động | ✅ UI - Hook - BE | 🟢 Hoàn thành | Tính theo trọng lượng & giờ máy in |
| **Wallet** | Ví điện tử ảo & Cổng nạp VietQR/MoMo | ✅ UI - Hook - BE | 🟢 Hoàn thành | Tự động sinh mã QR nạp tiền tức thì |
| **Orders** | Pipeline điều phối xưởng Bambu Lab | ✅ UI - Hook - BE | 🟢 Hoàn thành | Cắt lớp -> Đang in -> Hậu kỳ -> Ship |
| **Admin** | Cấu hình API Key động & Telemetry | ✅ UI - Hook - BE | 🟢 Hoàn thành | Lưu trữ an toàn, thay key không cần deploy |

---

## 🌐 7. Giao Diện Trực Quan Web: `overview.html`

File trực quan tương tác đặt tại:
* Đường dẫn vật lý: `overview.html` (gốc dự án) và `public/overview.html`
* Truy cập trên trình duyệt nội bộ: `http://localhost:3000/overview.html`
* Cung cấp sơ đồ đồ họa động, chuyển đổi trực quan giữa 3 lớp (UI - Hook - Backend), cấu trúc Neon Postgres và bộ lọc tương tác 6 Function Modules theo chuẩn Apple VisionOS Glassmorphism.

---

## 📌 8. Nhật Ký Cập Nhật Mới Nhất (Changelog v2.5.0 - 11/2026)

1. **Hệ thống Tree Support 3.0 & Triển Khai Thành Công Cloud Slicer Worker Trên Fly.io (`https://laymor3d-slicer-worker.fly.dev`)**:
   - **Cloud Slicer Worker (`cloud-slicer-worker/`)**: Đã đóng gói và triển khai trực tiếp nhân C++ **OrcaSlicer v2.2.0** (kèm bộ giải phẳng đệ quy `loadAndFlattenBblProfile` cho 3 cấu hình gốc `Bambu Lab P1S 0.4 nozzle`, `0.20mm Standard @BBL X1C`, `Bambu PLA Basic @BBL X1C`) kết hợp **PrusaSlicer C++ CLI** lên cụm máy chủ **Fly.io Singapore (`sin`)** với cơ chế **Scale-to-Zero** (`min_machines_running = 0`), kết nối tự động với `https://laymor3dcom.vercel.app`.
   - **Tree Support 3.0 (`supportGenerator.ts` & `SupportBuilder.ts`)**: Nâng độ phân giải lưới 2D SDF lên `108×108`, tự động cho phép nhánh bị bệ mẫu rộng chắn đường hạ cánh xuống mặt phẳng mẫu (`canFallbackLandOnModel`), khóa tâm ngọn cành (`spawnOffset <= 2.2mm`) đỡ trúng miếng đệm `interfacePads` và làm thon mượt vỏ cây 3D.
   - **Hiển thị Tree Support 2 Tầng & Cô lập theo từng chi tiết (Per-Part Isolation)**: Hỗ trợ tệp `.3MF` nhiều chi tiết (Multi-Part) và nhiều bàn in (Multi-Plate).
2. **Tùy Chọn Xuất Tệp `.3MF` / `.STL` Kèm Hoặc Không Kèm Tree Support (`ExportProfileModal.tsx`, `slicerExporter.ts`)**:
   - Cho phép người dùng bật/tắt tùy chọn xuất mô hình đã gắn sẵn khối lưới Tree Support (Baked Support Mesh) hoặc chỉ xuất mô hình gốc sạch kèm đầy đủ cấu hình Bambu Studio Profile để đưa vào Bambu Studio in ngay.
3. **Bộ Cắt Lớp Đa Luồng 2D-SDF Web Worker, Cắt Sợi O(S) Zero-Drop & WebGL2 Volumetric Bead Shader**:
   - Cắt lớp 2D-SDF chạy trên Web Worker (`sdfSlicerCore.ts`, `polygonSdf2D.ts`) kết hợp shader tái tạo sợi nhựa khối 3D (`volumetricFilamentRenderer.ts`) theo từng lớp cắt.
4. **Đặc Trưng Hình Học 12 Chiều (`GeometryFingerprintEngine`), Chuyên Gia AI Tư Vấn In 3D & Tự Học RAG (`SelfImprovingAiAdvisor`)**:
   - Trích xuất thể tích thực Signed Tetrahedron và vector hình học 12 chiều; tư vấn đồng bộ 6 nhóm thông số Bambu Studio, hỏi-đáp đa lượt, chẩn đoán ảnh lỗi thực tế (Vision AI) và đồng bộ toàn bộ dữ liệu về **Supabase Cloud** & **Google Drive/Sheets**.
5. **Hệ Thống Đăng Nhập Riêng, Phân Quyền Từng Vùng Chức Năng & Bộ Icon Minimalist CAD Độc Quyền**:
   - Bỏ chế độ chọn tài khoản giả lập; triển khai cổng đăng nhập riêng với tài khoản Master Admin (`hlcai_admin`) toàn quyền tạo tài khoản người dùng, tắt/mở từng vùng hiển thị & chức năng và kiểm duyệt Kho Tri Thức Lỗi.
   - Thay thế 100% bộ icon mặc định phổ thông bằng hệ thống vector kỹ thuật **Minimalist CAD (`MinimalIcons.tsx`)** tự thiết kế riêng trên toàn bộ 87+ tệp giao diện.
6. **Triển khai Toàn diện 8 Trang Yêu Cầu Giao Diện UI/UX Của Khách Hàng & Bộ Logo LAYMOR Chính Thức**:
   - Tự động cắt chuẩn và tối ưu kích thước bộ Logo `LAYMOR — From layers to form` (`laymor-wordmark.png`, `laymor-full.png`, `laymor-mark.png`).
   - Thiết kế lại `Navbar.tsx` với 5 mục chính (`HOME`, `SHOP`, `AI STUDIO` kèm tag `New`, `MAKERS CLUB`, `ABOUT`), Mega-Menu cây thư mục 3 cấp cho `SHOP` (chọn hãng hiện nền xanh + dấu `>`) và Mega-Menu lưới thẻ trực tiếp cho `AI STUDIO` & `MAKERS CLUB`.
   - Thiết kế lại Trang chủ (`src/app/page.tsx`) với **5 Banner dịch vụ** kèm nút `MUA NGAY`, khối **Về LAYMOR** (4 trụ cột `MATERIALS`, `MACHINES`, `AI STUDIO`, `COMMUNITY`), khối giới thiệu **2 AI Tool (`2D → 3D` & `Mô phỏng in 3D`)** phong cách Meshy kèm nút `Trải nghiệm ->`, và banner **LAYMOR MAKERS CLUB — Hãy tham gia cùng chúng tôi**.
   - Nâng cấp `ShopPage.tsx` theo chuẩn Bambu Store với đầy đủ danh mục **Máy in 3D** (`Bambu Lab A1/A2L/H2D/X2D/P2S`, `Flashforge Creator 5 Pro`, `Snapmaker U1`, `Creality i8/i7 combo/K3`, `Elegoo Carbon 2 combo`), **Nhựa in 3D** (`Bambu Lab`, `Creality`, `LAYMOR Coming soon`) và **Linh kiện** (`Coming soon`).
   - Tạo mới trang `/makers-club`, `/about` và `Footer.tsx` chuẩn thông tin pháp nhân **Công ty TNHH Halocom E-commerce** (Showroom Shophouse B1.15 - Tháp B - The Bliss, Dự án Urban Green, Thủ Đức; Hotline `0775015612`; Giờ làm việc `Thứ 2 - Thứ 6 | 9:00 AM - 18:00 PM`).

