'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Layers,
  Box,
  ShoppingBag,
  Cpu,
  Building2,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Lock,
  BarChart3,
  Target,
  AlertCircle,
  Database,
  GitCompare,
  Users,
  Wrench,
  CalendarClock,
  Palette,
} from '@/components/icons/MinimalIcons';

type StepStatus = 'completed' | 'in_progress' | 'upcoming';

interface PhaseStep {
  code: string;
  title: string;
  description: string;
  status: StepStatus;
  deliverable: string;
}

interface ProjectPhase {
  id: string;
  phaseNumber: string;
  title: string;
  subtitle: string;
  timeline: string;
  progressPercent: number;
  status: 'completed' | 'active' | 'upcoming';
  statusLabel: string;
  businessValue: string;
  steps: PhaseStep[];
}

const PROJECT_PHASES: ProjectPhase[] = [
  {
    id: 'phase-1',
    phaseNumber: 'Phase 01',
    title: 'Chuẩn Hóa Nhận Diện Thương Hiệu LAYMOR & Giao Diện UI/UX Theo Guideline Khách Hàng',
    subtitle: 'Triển khai đầy đủ Logo LAYMOR chính thức, Mega-Menu cây thư mục, 5 Banner dịch vụ, khối Về LAYMOR, AI Tools Showcase, Makers Club và Footer Halocom E-commerce',
    timeline: 'Giai đoạn 1 • Đã cập nhật toàn bộ 8 trang Guideline UI/UX của khách',
    progressPercent: 95,
    status: 'active',
    statusLabel: 'Đạt 95% (Đã áp dụng Guideline UI khách gửi)',
    businessValue:
      'Đồng bộ hoàn toàn diện mạo thương hiệu LAYMOR (From layers to form), cây thư mục sản phẩm (Bambu Lab, Flashforge, Snapmaker, Creality, Elegoo), hệ sinh thái AI Studio / Makers Club và thông tin pháp nhân Showroom Thủ Đức.',
    steps: [
      {
        code: 'Bước 1.1',
        title: 'Phác thảo luồng ý tưởng & cấu trúc trang sơ bộ',
        description:
          'Xây dựng kịch bản mẫu từ lúc người dùng xem mô hình 3D, thử nghiệm mô phỏng cho đến bước đặt hàng dự kiến.',
        status: 'completed',
        deliverable: 'Sơ đồ luồng nghiệp vụ bản nháp',
      },
      {
        code: 'Bước 1.2',
        title: 'Tích hợp bộ Logo LAYMOR chính thức & hệ thống Icon Minimalist CAD độc quyền',
        description:
          'Tự động cắt chuẩn và điều chỉnh kích thước bộ Logo LAYMOR (Wordmark cuộn nhựa 3D, Emblem 3 lớp & Full Logo) kết hợp hệ thống Icon Minimalist CAD 16x16 tự thiết kế riêng.',
        status: 'completed',
        deliverable: 'Bộ Logo LAYMOR & Icon Minimalist CAD riêng',
      },
      {
        code: 'Bước 1.3',
        title: 'Triển khai Header 5 mục, Cây thư mục Mega-Menu & Trang chủ 5 Banner dịch vụ theo PDF khách gửi',
        description:
          'Xây dựng thanh điều hướng HOME / SHOP / AI STUDIO (New) / MAKERS CLUB / ABOUT kèm Mega-Menu chọn hãng nền xanh + dấu ">", 5 Banner dịch vụ kèm nút MUA NGAY, khối Về LAYMOR 4 trụ cột và giao diện 2 AI Tool (2D→3D & Mô phỏng in 3D).',
        status: 'completed',
        deliverable: 'Header Mega-Menu & Trang chủ chuẩn Guideline PDF',
      },
      {
        code: 'Bước 1.4',
        title: 'Chuẩn hóa Cửa hàng kiểu Bambu Store, trang Makers Club, About & Footer Halocom E-commerce',
        description:
          'Bổ sung danh mục Máy in 3D (Bambu Lab A1/A2L/H2D/X2D/P2S, Creator 5 Pro, Snapmaker U1, Creality i8/i7/K3, Elegoo Carbon 2 Combo), Nhựa in 3D, Linh kiện và Footer Công ty TNHH Halocom E-commerce (Showroom Urban Green Thủ Đức).',
        status: 'completed',
        deliverable: 'Giao diện Shop, Makers Club, About & Footer chính thức',
      },
    ],
  },
  {
    id: 'phase-2',
    phaseNumber: 'Phase 02',
    title: 'Phát Triển Khung Không Gian 3D, Cắt Lớp 2D-SDF Web Worker & Volumetric Shader',
    subtitle: 'Xây dựng bộ khung hiển thị 3D WebGL2 Volumetric Bead Shader, cắt lớp 2D-SDF đa luồng, Multi-Part/Multi-Plate và Tree Support 2 tầng không xuyên mẫu',
    timeline: 'Giai đoạn 2 • Đã hoàn tất 2D-SDF Slicer, Volumetric Shader & Tree Support Backtrack Pruning',
    progressPercent: 90,
    status: 'active',
    statusLabel: 'Đạt 90% (Đã có 2D-SDF Worker, Multi-Plate & Chống xuyên mẫu)',
    businessValue:
      'Đảm bảo khả năng nạp mượt mà các tệp .3MF đa chi tiết/đa bàn in (Multi-Part & Multi-Plate), hiển thị sợi nhựa khối 3D (Volumetric Bead Shader) theo từng lớp và dựng Tree Support 2 tầng cô lập từng chi tiết, tuyệt đối không đâm xuyên qua thân mẫu.',
    steps: [
      {
        code: 'Bước 2.1',
        title: 'Khung quan sát 3D đa chi tiết / đa khay in (Multi-Part & Multi-Plate) & Đồng bộ /studio ↔ /3dsim',
        description:
          'Hỗ trợ xoay 360°, đọc tệp .3MF nhiều chi tiết và nhiều khay in (Multi-Plate), tự động tách cụm chi tiết (Per-Part Isolation) và chuyển tiếp trực tiếp mô hình kèm thông số giữa 3D Studio và Buồng giả lập.',
        status: 'completed',
        deliverable: 'Khung 3D Multi-Part/Multi-Plate & Cầu nối (/studio ↔ /3dsim)',
      },
      {
        code: 'Bước 2.2',
        title: 'Bộ cắt lớp 2D-SDF Web Worker, Cắt sợi O(S) Zero-Drop & WebGL2 Volumetric Bead Shader',
        description:
          'Cắt lớp đa luồng bằng trường khoảng cách có dấu 2D-SDF kết hợp O(S) Zero-Drop và tái tạo sợi nhựa khối 3D (Volumetric Bead Shader) với đầy đủ tường trong/ngoài, ruột in (Gyroid, Honeycomb, Grid...) và cầu nối theo từng lớp.',
        status: 'completed',
        deliverable: '2D-SDF Web Worker Slicer & Volumetric Bead Shader',
      },
      {
        code: 'Bước 2.3',
        title: 'Điều chỉnh lại bố cục vùng điều khiển 3D theo góp ý UI/UX',
        description:
          'Sắp xếp lại vị trí các thanh công cụ, HUD cảnh báo và bảng thông số trong buồng 3D không chồng chéo, dễ thao tác trên nhiều kích thước màn hình.',
        status: 'in_progress',
        deliverable: 'Giao diện buồng 3D tối ưu mới',
      },
      {
        code: 'Bước 2.4',
        title: 'Tree Support 3.0 (Lưới SDF 108×108), Hạ cánh thông minh & Cắt tỉa ngược chống đâm xuyên',
        description:
          'Hiển thị rõ 2 tầng Tree Support, nâng lưới 2D-SDF lên 108×108, tự động đáp nhánh lên bệ mẫu khi BuildPlateOnly bị chắn, khóa ngọn đỡ trúng tâm Interface Pad và loại bỏ 100% nhánh đâm xuyên mẫu.',
        status: 'completed',
        deliverable: 'Tree Support 3.0 Chống Xuyên Mẫu & Đọc 3MF tốc độ cao',
      },
    ],
  },
  {
    id: 'phase-3',
    phaseNumber: 'Phase 03',
    title: 'Bộ Dữ Liệu Chuẩn Bambu Studio, Cloud Slicer Worker (Fly.io Singapore) & AI Tự Học',
    subtitle: 'Đã triển khai trực tiếp Headless OrcaSlicer v2.2.0 + PrusaSlicer C++ CLI trên Fly.io (laymor3d-slicer-worker.fly.dev), tùy chọn xuất .3MF kèm Support và AI RAG 12D',
    timeline: 'Giai đoạn 3 • Đã vận hành Cloud Slicer trên Fly.io Singapore, Xuất .3MF & AI RAG 12D',
    progressPercent: 90,
    status: 'active',
    statusLabel: 'Đạt 90% (Đã chạy Cloud Slicer Fly.io + Xuất Support + AI RAG)',
    businessValue:
      'Mọi tệp .3MF/.STL tải lên đều được cắt thực tế bằng nhân C++ OrcaSlicer v2.2.0 trên Fly.io Singapore (Scale-to-Zero) với cấu hình gốc Bambu Lab P1S, giữ nguyên 100% Tree Support gốc và lượng hóa hình học 12 chiều để AI tự học.',
    steps: [
      {
        code: 'Bước 3.1',
        title: 'Hoàn thiện bộ thông số điều chỉnh bản in & thể hiện tức thì trên mẫu 3D giả lập',
        description:
          'Bổ sung đầy đủ các nhóm thông số theo chuẩn Bambu Studio (độ dày lớp, bề rộng nét, vòng tường, mối nối, là phẳng mặt đỉnh, tạo nhám bề mặt, kiểu cây chống, vành bám bàn, đế lót, tốc độ, nhiệt độ buồng, lưu lượng) và hiển thị hiệu ứng ngay trên mô hình 3D.',
        status: 'completed',
        deliverable: 'Bộ thông số & Hiển thị 3D thời gian thực',
      },
      {
        code: 'Bước 3.2',
        title: 'Vận hành Cloud Slicer Worker (Fly.io Singapore) chạy OrcaSlicer v2.2.0 C++ & Xuất .3MF Tùy chọn Support',
        description:
          'Đã triển khai Docker Headless OrcaSlicer v2.2.0 + PrusaSlicer C++ CLI tại laymor3d-slicer-worker.fly.dev (nạp đầy đủ cấu hình phẳng Bambu Lab P1S 0.4mm), kết nối trực tiếp với laymor3dcom.vercel.app và cho phép tùy chọn xuất .3MF/.STL kèm hoặc tách rời khối Tree Support.',
        status: 'completed',
        deliverable: 'Fly.io Cloud Slicer (Orca v2.2.0 C++) & Xuất .3MF Tùy chọn Support',
      },
      {
        code: 'Bước 3.3',
        title: 'Đặc trưng hình học 12 chiều (Geometry Fingerprint), AI Tự học RAG & Đồng bộ Cloud',
        description:
          'Trích xuất thể tích tứ diện có dấu chuẩn xác, diện tích bám bàn, trọng tâm và điểm thắt cổ chai; kết hợp AI Tư vấn đối chiếu độ tương đồng Cosine với các ca in lịch sử, đồng bộ lên Supabase Cloud và Google Drive/Sheets.',
        status: 'completed',
        deliverable: 'Geometry Fingerprint 12D, AI RAG & Cloud Sync',
      },
      {
        code: 'Bước 3.4',
        title: 'Đồng bộ hóa sai số giữa tính toán phần mềm và thực nghiệm đa dòng máy',
        description:
          'Đã tích hợp thể tích lưới thực tế (Signed Tetrahedron Volume) thay cho hộp bao thô; tiếp tục hiệu chuẩn hệ số gia tốc đầu in và hao hụt xả nhựa trên các dòng vật liệu kỹ thuật.',
        status: 'in_progress',
        deliverable: 'Bảng hiệu chuẩn độ chính xác dữ liệu',
      },
    ],
  },
  {
    id: 'phase-4',
    phaseNumber: 'Phase 04',
    title: 'Xây Dựng Tính Năng Đối Chiếu Thông Số & Kiểm Định Chéo',
    subtitle: 'So sánh trực tiếp giữa các cấu hình, kiểm định vật lý FDM 12 chiều và kiểm soát chất lượng phiên in',
    timeline: 'Giai đoạn 4 • Đang phát triển (Đã có Physics Audit & RAG Check)',
    progressPercent: 30,
    status: 'active',
    statusLabel: 'Đang phát triển (30%)',
    businessValue:
      'Giúp đối chiếu rõ ràng sự khác biệt khi thay đổi thông số in, phát hiện ngay các thông số vượt ngưỡng lưu lượng/nhiệt độ an toàn và đánh giá hiệu quả tối ưu.',
    steps: [
      {
        code: 'Bước 4.1',
        title: 'Phát triển công cụ đối chiếu đa phiên (Session Comparison)',
        description:
          'Đã có bảng Nhật ký phiên chạy (Simulation Run Logs) lưu trữ và khôi phục nhanh cấu hình; đang mở rộng chế độ đặt 2+ cấu hình song song để so sánh trực quan.',
        status: 'in_progress',
        deliverable: 'Tính năng đối chiếu cấu hình trực quan',
      },
      {
        code: 'Bước 4.2',
        title: 'Kiểm định vật lý FDM & Đối chiếu ngưỡng chuẩn Bambu Studio',
        description:
          'Tự động kiểm tra giới hạn lưu lượng đùn Hotend (Volumetric Flow), nhiệt độ chuyển thủy tinh, độ mảnh lật mẫu và đối chiếu với hồ sơ chuẩn qua API /api/v1/physics/sanity-check.',
        status: 'completed',
        deliverable: 'Bộ kiểm định vật lý FDM & Cảnh báo sai lệch',
      },
      {
        code: 'Bước 4.3',
        title: 'Theo dõi lịch sử biến động thông số & khóa cấu hình chuẩn',
        description:
          'Ghi nhận chi tiết từng lần tinh chỉnh thông số lên Supabase & Google Sheets, thống kê các thông số hay bị thay đổi (Churn) và khóa biên bản cấu hình tối ưu.',
        status: 'in_progress',
        deliverable: 'Hệ thống nhật ký & khóa hồ sơ đối chiếu',
      },
      {
        code: 'Bước 4.4',
        title: 'Xuất báo cáo đối chiếu nghiệm thu chất lượng (QC Audit)',
        description:
          'Tổng hợp biên bản đối chiếu toàn diện giữa yêu cầu đặt hàng của khách và thông số kỹ thuật thực tế áp dụng tại xưởng.',
        status: 'upcoming',
        deliverable: 'Hệ thống biên bản đối chiếu QC',
      },
    ],
  },
  {
    id: 'phase-5',
    phaseNumber: 'Phase 05',
    title: 'Xây Dựng Hệ Thống Đăng Nhập Tài Khoản & Phân Quyền Chi Tiết Từng Vùng Chức Năng',
    subtitle: 'Bỏ chế độ chọn tài khoản giả lập, triển khai cổng đăng nhập riêng cùng quyền Quản trị viên tối cao kiểm soát từng vùng hiển thị và kho tri thức',
    timeline: 'Giai đoạn 5 • Đã triển khai Đăng nhập & Phân quyền Admin',
    progressPercent: 45,
    status: 'active',
    statusLabel: 'Đang xây dựng (45%)',
    businessValue:
      'Loại bỏ hoàn toàn kiểu chọn tài khoản giả lập; vận hành hệ thống đăng nhập riêng biệt với tài khoản Admin toàn quyền tạo tài khoản trải nghiệm, tắt/mở từng vùng giao diện và từng chức năng cho mỗi người dùng.',
    steps: [
      {
        code: 'Bước 5.1',
        title: 'Triển khai hệ thống đăng nhập riêng & Tài khoản Quản trị viên tối cao (Master Admin)',
        description:
          'Bỏ hoàn toàn thanh chuyển đổi tài khoản giả lập cũ; thiết lập cổng đăng nhập xác thực bằng ID và Mật khẩu riêng với tài khoản Admin nắm toàn quyền điều khiển hệ thống.',
        status: 'completed',
        deliverable: 'Hệ thống Đăng nhập & Xác thực thực tế',
      },
      {
        code: 'Bước 5.2',
        title: 'Công cụ tạo tài khoản trải nghiệm & Tắt/Mở từng vùng hiển thị, từng chức năng theo người dùng',
        description:
          'Cho phép Admin tạo tài khoản người dùng mới và cấu hình chi tiết từng vùng giao diện tài khoản đó được phép nhìn thấy cũng như từng chức năng cụ thể được phép sử dụng.',
        status: 'completed',
        deliverable: 'Bảng kiểm soát vùng hiển thị & quyền chức năng',
      },
      {
        code: 'Bước 5.3',
        title: 'Quyền Admin truy cập, kiểm duyệt & chỉnh sửa kho tri thức của bộ giả lập',
        description:
          'Admin có toàn quyền xem, chỉnh sửa nội dung giải thích, phê duyệt kích hoạt hoặc xóa các quy tắc lỗi do người dùng gửi về cơ sở dữ liệu tri thức.',
        status: 'completed',
        deliverable: 'Trình quản trị Tri thức Giả lập (Admin)',
      },
      {
        code: 'Bước 5.4',
        title: 'Hoàn thiện phân hệ điều phối ca làm việc cho Nhân viên xưởng & Đối tác',
        description:
          'Tiếp tục mở rộng các màn hình nghiệp vụ chuyên sâu cho nhân viên vận hành dàn máy in tại xưởng và đối tác kiểm duyệt mẫu.',
        status: 'in_progress',
        deliverable: 'Phân hệ Nghiệp vụ Nhân viên & Đối tác',
      },
    ],
  },
  {
    id: 'phase-6',
    phaseNumber: 'Phase 06',
    title: 'Hoàn Thiện Thương Mại Điện Tử, Ví Thanh Toán & Kho Vật Tư',
    subtitle: 'Kết nối thanh toán thực tế, đồng bộ tồn kho nguyên vật liệu và tự động hóa quy trình đơn hàng',
    timeline: 'Giai đoạn 6 • Lộ trình kế tiếp',
    progressPercent: 10,
    status: 'upcoming',
    statusLabel: 'Chuẩn bị triển khai (10%)',
    businessValue:
      'Chuyển đổi cửa hàng và ví tiền từ dữ liệu mẫu sang vận hành thực tế, quản lý chính xác tồn kho vật tư và dòng tiền giao dịch.',
    steps: [
      {
        code: 'Bước 6.1',
        title: 'Tích hợp cổng thanh toán & đối soát giao dịch tự động',
        description:
          'Xác thực giao dịch nạp tiền và thanh toán đơn hàng tự động theo thời gian thực, thay thế cơ chế xác nhận thử nghiệm.',
        status: 'upcoming',
        deliverable: 'Hệ thống thanh toán & đối soát thực',
      },
      {
        code: 'Bước 6.2',
        title: 'Xây dựng hệ thống Quản lý Tồn kho Vật liệu & Phụ kiện',
        description:
          'Theo dõi số lượng cuộn nhựa theo màu sắc, chủng loại tại xưởng; tự động cảnh báo khi sắp hết hàng và khóa đặt in với màu nhựa tạm hết.',
        status: 'upcoming',
        deliverable: 'Module Quản trị Kho vật tư thực tế',
      },
      {
        code: 'Bước 6.3',
        title: 'Hoàn thiện luồng xử lý giỏ hàng, báo giá tùy chỉnh & hóa đơn',
        description:
          'Hỗ trợ đặt in nhiều mẫu cùng lúc với các cấu hình vật liệu khác nhau, tính phí vận chuyển theo khu vực và xuất phiếu xác nhận đơn hàng.',
        status: 'upcoming',
        deliverable: 'Quy trình Thanh toán & Đặt hàng hoàn chỉnh',
      },
      {
        code: 'Bước 6.4',
        title: 'Hệ thống thông báo trạng thái đơn hàng tự động cho khách',
        description:
          'Gửi thông báo tự động khi đơn hàng chuyển qua từng công đoạn: Đã duyệt file → Đang in → Đang xử lý hậu kỳ → Đã bàn giao vận chuyển.',
        status: 'upcoming',
        deliverable: 'Hệ thống thông báo tiến độ tự động',
      },
    ],
  },
  {
    id: 'phase-7',
    phaseNumber: 'Phase 07',
    title: 'Thử Nghiệm Vận Hành Thực Tế Tại Xưởng (Pilot & Stress-Test)',
    subtitle: 'Kiểm thử đồng bộ phần mềm với dàn máy in thực tế, đo lường hao hụt và tối ưu hóa chịu tải',
    timeline: 'Giai đoạn 7 • Kế hoạch trung hạn',
    progressPercent: 0,
    status: 'upcoming',
    statusLabel: 'Chưa bắt đầu (0%)',
    businessValue:
      'Đảm bảo toàn bộ tính năng sau khi hoàn thiện hoạt động ổn định trong môi trường sản xuất thực tế trước khi mở rộng.',
    steps: [
      {
        code: 'Bước 7.1',
        title: 'Chạy thử nghiệm thực tế (Pilot Run) với chuỗi đơn hàng mẫu',
        description:
          'Vận hành khép kín từ lúc khách đặt đơn trên web, nhân viên nhận lệnh đến khi ra thành phẩm tại xưởng để rà soát lỗi quy trình.',
        status: 'upcoming',
        deliverable: 'Báo cáo nghiệm thu vận hành Pilot',
      },
      {
        code: 'Bước 7.2',
        title: 'Kiểm thử chịu tải hệ thống (Load & Stress Testing)',
        description:
          'Đánh giá độ ổn định của hệ thống khi có lượng lớn người dùng truy cập, tải tệp 3D và chạy giả lập cùng lúc.',
        status: 'upcoming',
        deliverable: 'Chứng nhận hiệu năng & chịu tải',
      },
      {
        code: 'Bước 7.3',
        title: 'Chuẩn hóa quy trình xử lý sự cố & đơn hàng lỗi tại xưởng',
        description:
          'Xây dựng quy trình bù đắp vật tư, in lại và phân bổ lại máy in khi xảy ra sự cố kỹ thuật trong quá trình sản xuất.',
        status: 'upcoming',
        deliverable: 'Quy trình quản trị rủi ro sản xuất',
      },
      {
        code: 'Bước 7.4',
        title: 'Đào tạo nhân sự vận hành & hoàn thiện tài liệu hướng dẫn',
        description:
          'Tập huấn cho đội ngũ nhân viên xưởng, bộ phận chăm sóc khách hàng và quản trị viên sử dụng thành thạo từng phân hệ.',
        status: 'upcoming',
        deliverable: 'Bộ quy chuẩn vận hành nội bộ (SOP)',
      },
    ],
  },
  {
    id: 'phase-8',
    phaseNumber: 'Phase 08',
    title: 'Nghiệm Thu Toàn Diện & Thương Mại Hóa Quy Mô Lớn',
    subtitle: 'Hoàn tất kiểm toán bảo mật, kết nối đối tác giao vận toàn quốc và ra mắt chính thức (Official Launch)',
    timeline: 'Giai đoạn 8 • Lộ trình dài hạn',
    progressPercent: 0,
    status: 'upcoming',
    statusLabel: 'Lộ trình dài hạn (0%)',
    businessValue:
      'Đưa nền tảng vào khai thác thương mại chính thức trên toàn quốc sau khi đã hoàn thiện toàn bộ dữ liệu, tính năng và giao diện.',
    steps: [
      {
        code: 'Bước 8.1',
        title: 'Kiểm toán bảo mật dữ liệu & an toàn giao dịch toàn diện',
        description:
          'Rà soát toàn bộ lỗ hổng bảo mật, cơ chế phân quyền tài khoản và an toàn dữ liệu bản quyền trước khi mở rộng công khai.',
        status: 'upcoming',
        deliverable: 'Chứng nhận nghiệm thu an toàn hệ thống',
      },
      {
        code: 'Bước 8.2',
        title: 'Tích hợp tự động với các đơn vị giao vận toàn quốc',
        description:
          'Kết nối tự động tạo vận đơn, tính cước phí vận chuyển thực tế và đồng bộ hành trình giao hàng về tài khoản khách hàng.',
        status: 'upcoming',
        deliverable: 'Hệ thống điều phối giao vận tự động',
      },
      {
        code: 'Bước 8.3',
        title: 'Mở rộng mạng lưới đối tác thiết kế & xưởng vệ tinh',
        description:
          'Thu hút cộng đồng nhà thiết kế 3D đóng góp mẫu bản quyền và kết nối thêm năng lực máy in từ các xưởng đối tác.',
        status: 'upcoming',
        deliverable: 'Mạng lưới đối tác thương mại mở rộng',
      },
      {
        code: 'Bước 8.4',
        title: 'Ra mắt chính thức (Official Commercial Launch)',
        description:
          'Chuyển đổi hoàn toàn từ giai đoạn thử nghiệm sang vận hành thương mại chính thức kèm các chiến dịch phát triển thị trường.',
        status: 'upcoming',
        deliverable: 'Hệ sinh thái thương mại chính thức',
      },
    ],
  },
];

const CURRENT_FOCUS_AREAS = [
  {
    title: '1. Đã Triển Khai Toàn Bộ 8 Trang Guideline UI/UX & Logo LAYMOR Chính Thức',
    status: 'Đạt 95% (Hoàn tất UI mới)',
    desc: 'Đã tích hợp bộ Logo LAYMOR đính kèm, thanh điều hướng 5 mục (HOME, SHOP, AI STUDIO, MAKERS CLUB, ABOUT) kèm Mega-Menu cây thư mục, 5 Banner dịch vụ, khối Về LAYMOR, giao diện 2 AI Tool, Makers Club và Footer Công ty TNHH Halocom E-commerce.',
    icon: Palette,
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    title: '2. Cắt Lớp 2D-SDF, Volumetric Shader, Tree Support Chống Xuyên Mẫu & Xuất .3MF Tùy Chọn',
    status: 'Đạt 82% – 90%',
    desc: 'Đã hoàn thiện bộ cắt lớp 2D-SDF Web Worker, sợi in khối 3D Volumetric Bead Shader, Tree Support 2 tầng cắt tỉa ngược (Backtrack Pruning) triệt tiêu 100% lỗi đâm xuyên mẫu, tùy chọn xuất .3MF có/không kèm Tree Support, kết hợp AI RAG 12D & Cloud OrcaSlicer Worker.',
    icon: Database,
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    title: '3. Xây Dựng Tính Năng Đối Chiếu & Kiểm Định Vật Lý Chéo',
    status: 'Đang phát triển (30%)',
    desc: 'Đã tích hợp kiểm định vật lý FDM (lưu lượng Hotend, nhiệt độ, độ mảnh lật mẫu) và nhật ký phiên chạy; đang tiếp tục hoàn thiện giao diện đặt 2+ cấu hình song song và xuất biên bản nghiệm thu QC.',
    icon: GitCompare,
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  {
    title: '4. Hệ Thống Đăng Nhập Riêng, Phân Quyền Từng Vùng & Quản Trị Tri Thức',
    status: 'Đang hoàn thiện (45%)',
    desc: 'Đã bỏ kiểu chọn tài khoản giả lập, triển khai hệ thống đăng nhập riêng cùng tài khoản Admin toàn quyền: tạo tài khoản trải nghiệm, tắt/mở từng vùng hiển thị & chức năng của từng người dùng, và chỉnh sửa kho kiến thức của bộ giả lập.',
    icon: Users,
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    title: '5. Hoàn Thiện Nghiệp Vụ Đặt Hàng, Kho Vật Tư & Thanh Toán Thực',
    status: 'Chưa hoàn thiện (10%)',
    desc: 'Còn nhiều luồng nghiệp vụ phía sau như quản lý tồn kho cuộn nhựa thực tế, đối soát thanh toán tự động, xử lý đơn lỗi và điều phối máy in tại xưởng đang nằm trong kế hoạch phát triển tiếp theo.',
    icon: Wrench,
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
  },
];

const BUSINESS_MODULES = [
  {
    name: 'Giao Diện Thương Hiệu LAYMOR & Cây Thư Mục Mega-Menu (UI/UX)',
    role: 'Đã áp dụng đầy đủ 8 trang PDF yêu cầu UI của khách: Logo LAYMOR, 5 Banner dịch vụ, Mega-Menu chọn hãng, Về LAYMOR, Makers Club & Footer Halocom',
    progress: 95,
    status: 'Đã áp dụng UI khách gửi',
    statusStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    href: '/',
    icon: Palette,
  },
  {
    name: 'Không Gian 3D Studio & Dự Toán Thể Tích Thực (/studio)',
    role: 'Đã đồng bộ hai chiều với /3dsim, Tree Support cắt tỉa ngược chống đâm xuyên mẫu, tính thể tích thực Signed Tetrahedron & đặc trưng 12D',
    progress: 78,
    status: 'Đã nâng cấp lõi 3D',
    statusStyle: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    href: '/studio',
    icon: Sparkles,
  },
  {
    name: 'Bộ Giả Lập 2D-SDF, Volumetric Shader, Tree Support 2.0 & AI RAG (/3dsim)',
    role: 'Cắt lớp 2D-SDF Worker & Volumetric Shader, hỗ trợ Multi-Part/Multi-Plate, Tree Support 2 tầng không xuyên mẫu, tùy chọn xuất .3MF kèm/tách Support & AI RAG 12D',
    progress: 88,
    status: 'Hoạt động ổn định',
    statusStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    href: '/3dsim',
    icon: Cpu,
    isExternalSpa: true,
  },
  {
    name: 'Tính Năng Đối Chiếu Thông Số & Kiểm Định Chéo',
    role: 'Đã có kiểm định vật lý FDM, đối chiếu tương đồng RAG 12D & nhật ký phiên chạy; đang mở rộng so sánh song song đa phiên',
    progress: 30,
    status: 'Đang phát triển',
    statusStyle: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    href: '/3dsim',
    icon: GitCompare,
    isExternalSpa: true,
  },
  {
    name: 'Hệ Thống Đăng Nhập, Quản Trị Vùng Hiển Thị & Kho Tri Thức (/admin)',
    role: 'Đã có đăng nhập riêng & Master Admin toàn quyền tạo tài khoản, tắt/mở vùng chức năng cho từng người dùng và chỉnh sửa tri thức giả lập',
    progress: 45,
    status: 'Đang mở rộng',
    statusStyle: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    href: '/admin',
    icon: Users,
  },
  {
    name: 'Cửa Hàng Vật Tư, Ví Điện Tử & Đặt In (/shop)',
    role: 'Đang hiển thị dữ liệu mẫu để hình dung giao diện; chưa kết nối tồn kho thực và cổng đối soát tự động',
    progress: 30,
    status: 'Bản mẫu thử nghiệm',
    statusStyle: 'bg-slate-100 text-slate-700 border-slate-300',
    href: '/shop',
    icon: ShoppingBag,
  },
  {
    name: 'Điều Phối Xưởng Sản Xuất & Giao Vận Thực Tế',
    role: 'Quản lý ca làm việc của nhân viên xưởng, kết nối lệnh in thực tế và tự động hóa giao nhận',
    progress: 10,
    status: 'Giai đoạn kế tiếp',
    statusStyle: 'bg-slate-100 text-slate-700 border-slate-300',
    href: '/admin',
    icon: Building2,
  },
];

export default function InvestorOverviewPage() {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('all');

  const filteredPhases =
    selectedPhaseId === 'all'
      ? PROJECT_PHASES
      : PROJECT_PHASES.filter((p) => p.id === selectedPhaseId);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. EXECUTIVE HERO BANNER */}
      <section className="rounded-[32px] vision-glass-panel border border-slate-200/90 bg-white/90 p-6 sm:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.06)] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold tracking-wide uppercase">
              <CalendarClock className="w-4 h-4 text-amber-600" />
              <span>Báo Cáo Tiến Độ Dự Án • Giai Đoạn Thử Nghiệm &amp; Hoàn Thiện (Beta)</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Tổng Quan Lộ Trình 8 Giai Đoạn &amp; Tiến Độ Thực Tế{' '}
              <span className="bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent">
                Dự Án LAYMOR 3D
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Dự án hiện đang ở <strong>Giai đoạn Thử nghiệm Nâng cao (Beta v2.5 ~55%)</strong>. Đợt nâng cấp mới nhất đã hoàn
              thiện <strong>bộ cắt lớp 2D-SDF Web Worker, hiển thị sợi nhựa khối 3D (WebGL2 Volumetric Bead Shader)</strong>,{' '}
              <strong>Tree Support 2 tầng cô lập từng chi tiết với thuật toán Backtrack Pruning triệt tiêu 100% lỗi đâm xuyên mẫu</strong>,{' '}
              <strong>tùy chọn xuất tệp .3MF/.STL kèm hoặc tách riêng Tree Support</strong>, hỗ trợ{' '}
              <strong>Multi-Part / Multi-Plate, Cloud OrcaSlicer Worker</strong> và <strong>AI Tự học RAG 12 chiều</strong>. Trọng tâm kế tiếp là{' '}
              <strong>rà soát điều chỉnh UI/UX cùng khách hàng</strong>, mở rộng{' '}
              <strong>so sánh song song đa cấu hình QC</strong> và hoàn thiện kho vật tư/thanh toán thực tế.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all"
              >
                <Box className="w-4 h-4" />
                <span>Xem Bản Nháp Trang Chủ</span>
              </Link>
              <a
                href="/3dsim"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 text-xs font-bold transition-all"
              >
                <Cpu className="w-4 h-4 text-cyan-600" />
                <span>Mở Buồng Giả Lập Thử Nghiệm (/3dsim)</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-cyan-600" />
              </a>
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-all"
              >
                <Sparkles className="w-4 h-4 text-slate-600" />
                <span>Không Gian 3D Studio</span>
              </Link>
            </div>
          </div>

          {/* Executive KPI Summary Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0 lg:w-[370px]">
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">~55%</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900/70 mt-1">
                Tiến Độ Toàn Lộ Trình
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">8 Phases</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                Kế Hoạch Triển Khai
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-700">5 Hạng Mục</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-900/70 mt-1">
                Đang Xử Lý &amp; Điều Chỉnh
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">Beta v2.5</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                Trạng Thái Hiện Tại
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-bold text-slate-700 mb-2">
            <span>TIẾN ĐỘ TỔNG THỂ TRÊN TOÀN BỘ 8 GIAI ĐOẠN PHÁT TRIỂN (PHASE 01 – PHASE 08)</span>
            <span className="text-amber-700 font-mono">
              Đạt ~55% • Đã tích hợp 2D-SDF Slicer, Volumetric Shader, Tree Support Backtrack Pruning, Xuất .3MF Tùy chọn Support &amp; AI RAG 12D
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 border border-slate-200/80 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-600 via-sky-500 to-emerald-500 transition-all duration-500"
              style={{ width: '55%' }}
            />
          </div>
        </div>
      </section>

      {/* 2. CURRENT R&D BOTTLENECKS & ACTIVE WORKSTREAMS */}
      <section className="rounded-[28px] vision-glass-panel border border-slate-200/90 bg-white/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <span>Các Hạng Mục Trọng Tâm &amp; Tiến Trình Hoàn Thiện</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              5 Công Việc Trọng Tâm Đang Triển Khai &amp; Kế Tiếp
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Tổng hợp các mũi công việc kỹ thuật vừa nâng cấp và các hạng mục nghiệp vụ đang tiếp tục hoàn thiện:
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold shrink-0">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Đang triển khai &amp; hiệu chỉnh</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CURRENT_FOCUS_AREAS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between gap-3 hover:border-cyan-300 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-cyan-700 shadow-2xs shrink-0">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.badgeColor}`}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. DETAILED 8-PHASE PROJECT ROADMAP */}
      <section className="rounded-[28px] vision-glass-panel border border-slate-200/90 bg-white/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-700 text-xs font-bold uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Lộ Trình Chi Tiết 8 Giai Đoạn</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Kế Hoạch Triển Khai Từng Bước Từ Thử Nghiệm Đến Vận Hành Thực Tế
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Chọn từng giai đoạn bên dưới để theo dõi tiến độ cụ thể của từng bước công việc:
            </p>
          </div>

          {/* Phase Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200/80">
            <button
              onClick={() => setSelectedPhaseId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPhaseId === 'all'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              Tất Cả (8 Phases)
            </button>
            {PROJECT_PHASES.map((phase) => (
              <button
                key={phase.id}
                onClick={() => setSelectedPhaseId(phase.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPhaseId === phase.id
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                {phase.phaseNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Phase Cards List */}
        <div className="space-y-6">
          {filteredPhases.map((phase) => (
            <div
              key={phase.id}
              className="rounded-3xl border border-slate-200/90 bg-slate-50/70 p-5 sm:p-7 space-y-5 hover:border-cyan-300/80 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                        phase.status === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : phase.status === 'active'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {phase.phaseNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{phase.timeline}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${
                        phase.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : phase.status === 'active'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {phase.status === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>{phase.statusLabel}</span>
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{phase.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600">{phase.subtitle}</p>
                </div>

                {/* Phase Progress Bar */}
                <div className="lg:w-64 shrink-0 bg-white p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600">Tiến độ giai đoạn</span>
                    <span className="text-cyan-700 font-mono">{phase.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        phase.status === 'completed'
                          ? 'bg-emerald-500'
                          : phase.status === 'active'
                          ? 'bg-gradient-to-r from-cyan-600 to-amber-500'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${phase.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Business Value Callout */}
              <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200/70 text-xs sm:text-sm text-slate-800 flex items-start gap-2.5">
                <BarChart3 className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cyan-900">Mục tiêu trọng tâm: </strong>
                  <span>{phase.businessValue}</span>
                </div>
              </div>

              {/* 4 Steps Grid inside each Phase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phase.steps.map((step) => (
                  <div
                    key={step.code}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between space-y-3 shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {step.code}
                        </span>
                        {step.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã hoàn thành</span>
                          </span>
                        ) : step.status === 'in_progress' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Đang thực hiện</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Chưa hoàn thiện</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Hạng mục:</span>
                      <span className="font-bold text-cyan-800">{step.deliverable}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. BUSINESS MODULES STATUS MATRIX */}
      <section className="rounded-[28px] vision-glass-panel border border-slate-200/90 bg-white/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-700 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Trạng Thái Thực Tế Từng Phân Hệ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Bảng Tổng Hợp Mức Độ Hoàn Thiện Các Phân Hệ Hiện Tại
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Cập nhật mức độ hoàn thiện mới nhất sau khi nâng cấp bộ cắt sợi O(S), Voxel Tree Support, Đặc trưng hình
            học 12D và cầu nối đồng bộ Cloud:
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50/80">
                <th className="py-3.5 px-4 rounded-tl-xl">Phân Hệ / Hạng Mục</th>
                <th className="py-3.5 px-4">Tình Trạng Thực Tế &amp; Việc Cần Làm</th>
                <th className="py-3.5 px-4">Tiến Độ</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right rounded-tr-xl">Bản Nháp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 text-xs sm:text-sm">
              {BUSINESS_MODULES.map((mod) => {
                const Icon = mod.icon;
                return (
                  <tr key={mod.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{mod.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 max-w-md">{mod.role}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              mod.progress >= 75
                                ? 'bg-emerald-500'
                                : mod.progress >= 60
                                ? 'bg-cyan-600'
                                : mod.progress >= 30
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${mod.progress}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-xs">{mod.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold whitespace-nowrap ${mod.statusStyle}`}
                      >
                        <span>{mod.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {mod.isExternalSpa ? (
                        <a
                          href={mod.href}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold transition-all"
                        >
                          <span>Xem Bản Thử</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <Link
                          href={mod.href}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all"
                        >
                          <span>Xem Bản Nháp</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. CONFIDENTIALITY & GOVERNANCE NOTICE */}
      <section className="rounded-[28px] border border-slate-200/90 bg-slate-50/90 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="w-11 h-11 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">
              Lưu Ý Về Giai Đoạn Thử Nghiệm &amp; Bảo Mật Thông Tin Dự Án
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Website hiện đang trong <strong>Giai đoạn Thử nghiệm Nâng cao (Beta v2.3)</strong>. Giao diện UI/UX sẽ
              tiếp tục được điều chỉnh sau các buổi làm việc với phía khách hàng; bộ dữ liệu Bambu Studio, công cụ đối
              chiếu QC và hệ thống tài khoản (Admin – Nhân viên – Khách hàng) đang tiếp tục hoàn thiện. Toàn bộ thông tin
              kỹ thuật, mã nguồn và kết nối hệ thống được ẩn nhằm bảo mật tuyệt đối tài sản dự án.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/3dsim"
            className="px-4 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            Xem Buồng Giả Lập →
          </a>
        </div>
      </section>
    </div>
  );
}
