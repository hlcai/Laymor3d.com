'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Layers,
  Box,
  ShoppingBag,
  Cpu,
  Building2,
  Store,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Award,
  Lock,
  BarChart3,
  Workflow,
  Target,
} from 'lucide-react';

interface PhaseStep {
  code: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress';
  deliverable: string;
}

interface ProjectPhase {
  id: string;
  phaseNumber: string;
  title: string;
  subtitle: string;
  timeline: string;
  progressPercent: number;
  status: 'completed' | 'active';
  statusLabel: string;
  businessValue: string;
  steps: PhaseStep[];
}

const PROJECT_PHASES: ProjectPhase[] = [
  {
    id: 'phase-1',
    phaseNumber: 'Phase 01',
    title: 'Định Hình Hệ Sinh Thái & Nền Tảng Trải Nghiệm',
    subtitle: 'Chuẩn hóa mô hình vận hành, nhận diện thương hiệu và cấu trúc phân quyền đa vai trò',
    timeline: 'Giai đoạn 1 • Đã nghiệm thu',
    progressPercent: 100,
    status: 'completed',
    statusLabel: 'Hoàn thành 100%',
    businessValue:
      'Tạo dựng nền móng vững chắc cho mô hình kinh doanh khép kín từ thiết kế đến sản xuất, đảm bảo trải nghiệm đồng nhất và an toàn dữ liệu.',
    steps: [
      {
        code: 'Bước 1.1',
        title: 'Chuẩn hóa chuỗi giá trị dịch vụ khép kín',
        description:
          'Xây dựng quy trình xuyên suốt từ khâu tiếp nhận ý tưởng của khách hàng, khởi tạo mẫu 3D, kiểm định chất lượng đến báo giá và giao nhận sản phẩm.',
        status: 'completed',
        deliverable: 'Quy trình vận hành tiêu chuẩn 5 bước',
      },
      {
        code: 'Bước 1.2',
        title: 'Thiết kế giao diện không gian trực quan cao cấp',
        description:
          'Hoàn thiện ngôn ngữ thiết kế hiện đại, tối ưu hóa khả năng tương tác trực quan và tốc độ phản hồi trên cả máy tính lẫn thiết bị di động.',
        status: 'completed',
        deliverable: 'Hệ thống giao diện đồng bộ toàn nền tảng',
      },
      {
        code: 'Bước 1.3',
        title: 'Thiết lập cơ chế phân quyền vận hành 4 cấp độ',
        description:
          'Phân tách độc lập quyền hạn giữa Khách hàng, Đối tác thiết kế (Seller), Nhân sự điều phối xưởng và Ban quản trị hệ thống.',
        status: 'completed',
        deliverable: 'Hệ thống quản trị tài khoản & phân quyền',
      },
      {
        code: 'Bước 1.4',
        title: 'Chuẩn hóa quy trình bảo mật thông tin & bản quyền',
        description:
          'Thiết lập chính sách bảo vệ quyền sở hữu trí tuệ đối với các mẫu thiết kế 3D thương mại và dữ liệu đơn hàng của đối tác.',
        status: 'completed',
        deliverable: 'Tiêu chuẩn an toàn dữ liệu vận hành',
      },
    ],
  },
  {
    id: 'phase-2',
    phaseNumber: 'Phase 02',
    title: 'Không Gian Sáng Tạo 3D & Báo Giá Tự Động',
    subtitle: 'Chuyển hóa hình ảnh và ý tưởng thành mô hình 3D hoàn chỉnh kèm dự toán chi phí tức thì',
    timeline: 'Giai đoạn 2 • Đã nghiệm thu',
    progressPercent: 100,
    status: 'completed',
    statusLabel: 'Hoàn thành 100%',
    businessValue:
      'Xóa bỏ rào cản thiết kế 3D cho khách hàng phổ thông, rút ngắn thời gian báo giá gia công từ hàng giờ xuống chỉ còn vài giây.',
    steps: [
      {
        code: 'Bước 2.1',
        title: 'Ra mắt Không gian Quan sát & Tương tác 3D trực tuyến',
        description:
          'Cho phép khách hàng xoay 360°, phóng đại chi tiết, đo kích thước thực tế (mm) và điều chỉnh tỷ lệ sản phẩm trực tiếp trên trình duyệt.',
        status: 'completed',
        deliverable: 'Phân hệ Không gian 3D Studio (/studio)',
      },
      {
        code: 'Bước 2.2',
        title: 'Triển khai Công nghệ Tạo mẫu 3D Thông minh 3 Cấp độ',
        description:
          'Cung cấp 3 gói khởi tạo mô hình từ hình ảnh (Tiêu chuẩn nhanh, Nâng cao sắc nét, Cao cấp độ phân giải cao) phù hợp với từng phân khúc ngân sách.',
        status: 'completed',
        deliverable: 'Hệ thống khởi tạo mẫu 3D đa cấp độ',
      },
      {
        code: 'Bước 2.3',
        title: 'Xây dựng Công cụ Bóc tách Chi phí & Báo giá Tự động',
        description:
          'Tự động tính toán khối lượng vật liệu tiêu hao, thời gian vận hành thiết bị và chi phí hoàn thiện để đưa ra mức giá minh bạch ngay lập tức.',
        status: 'completed',
        deliverable: 'Bộ máy định giá tự động theo thời gian thực',
      },
      {
        code: 'Bước 2.4',
        title: 'Chuẩn hóa Hồ sơ Thông số Sản xuất',
        description:
          'Tự động đóng gói thông số kích thước, vật liệu và cấu trúc giá đỡ thành hồ sơ tiêu chuẩn để chuyển giao thẳng xuống xưởng sản xuất.',
        status: 'completed',
        deliverable: 'Quy chuẩn trích xuất hồ sơ sản xuất',
      },
    ],
  },
  {
    id: 'phase-3',
    phaseNumber: 'Phase 03',
    title: 'Hệ Thống Giả Lập & Kiểm Định Chất Lượng (PrintSim Pro)',
    subtitle: 'Mô phỏng quá trình sản xuất theo thời gian thực và phát hiện sớm rủi ro sai hỏng',
    timeline: 'Giai đoạn 3 • Đã nghiệm thu',
    progressPercent: 100,
    status: 'completed',
    statusLabel: 'Hoàn thành 100%',
    businessValue:
      'Giảm thiểu tối đa tỷ lệ phế phẩm và hao hụt vật tư tại xưởng thông qua việc kiểm tra khả năng sản xuất và tối ưu thông số trước khi in.',
    steps: [
      {
        code: 'Bước 3.1',
        title: 'Xây dựng Buồng Mô phỏng Sản xuất theo từng lớp cắt',
        description:
          'Trực quan hóa toàn bộ quá trình hình thành sản phẩm từ lớp đầu tiên đến khi hoàn thiện, hỗ trợ tua nhanh tiến độ từ 1x đến 1000x.',
        status: 'completed',
        deliverable: 'Phân hệ Giả lập 3D PrintSim Pro (/3dsim)',
      },
      {
        code: 'Bước 3.2',
        title: 'Phát triển Hệ thống Cảnh báo Rủi ro Vật lý sớm',
        description:
          'Tự động phân tích các vùng góc nghiêng nhạy cảm, độ bám dính bề mặt và lưu lượng vật liệu để cảnh báo nguy cơ lỗi trước khi sản xuất.',
        status: 'completed',
        deliverable: 'Bản đồ nhiệt cảnh báo rủi ro sản xuất',
      },
      {
        code: 'Bước 3.3',
        title: 'Tích hợp Tính năng Tự động Tối ưu Thông số (Auto-Fix)',
        description:
          'Tự động đề xuất và hiệu chỉnh cấu trúc đỡ, độ đặc ruột cũng như nhiệt độ vận hành chỉ với một thao tác để đạt độ an toàn tối đa.',
        status: 'completed',
        deliverable: 'Công cụ tối ưu hóa cấu hình tự động',
      },
      {
        code: 'Bước 3.4',
        title: 'Thiết lập Hệ thống Chấm điểm & Hồ sơ Kiểm định (QC Score)',
        description:
          'Chấm điểm khả thi trên thang 100 cho từng phiên mô phỏng và lưu trữ biên bản kiểm định chất lượng phục vụ đối soát sản xuất.',
        status: 'completed',
        deliverable: 'Hệ thống chứng nhận kiểm định chất lượng QC',
      },
    ],
  },
  {
    id: 'phase-4',
    phaseNumber: 'Phase 04',
    title: 'Thương Mại Điện Tử, Ví Thanh Toán & Phân Tích Thị Trường',
    subtitle: 'Mở rộng nguồn thu qua cửa hàng vật tư, chợ bản quyền 3D và công cụ dự báo xu hướng',
    timeline: 'Giai đoạn 4 • Đã nghiệm thu',
    progressPercent: 100,
    status: 'completed',
    statusLabel: 'Hoàn thành 100%',
    businessValue:
      'Đa dạng hóa dòng tiền từ bán lẻ vật tư, phí bản quyền mô hình số, dịch vụ in gia công và định hướng sản phẩm có biên lợi nhuận cao.',
    steps: [
      {
        code: 'Bước 4.1',
        title: 'Ra mắt Cửa hàng Vật liệu, Phụ kiện & Dịch vụ Đặt in 24h',
        description:
          'Cung cấp danh mục vật liệu in tiêu chuẩn, phụ kiện thiết bị và dịch vụ đặt in gia công theo yêu cầu giao hàng toàn quốc.',
        status: 'completed',
        deliverable: 'Phân hệ Cửa hàng & Dịch vụ In (/shop)',
      },
      {
        code: 'Bước 4.2',
        title: 'Vận hành Chợ Mô hình Bản quyền & Kênh Đối tác (Seller Hub)',
        description:
          'Cho phép các nhà thiết kế 3D đăng tải sản phẩm thương mại, theo dõi doanh thu và thực hiện kiểm duyệt chất lượng mẫu trước khi mở bán.',
        status: 'completed',
        deliverable: 'Kênh Đối tác Bán hàng (/seller)',
      },
      {
        code: 'Bước 4.3',
        title: 'Tích hợp Ví Điện tử Nội bộ & Cổng Thanh toán QR Tự động',
        description:
          'Hỗ trợ khách hàng nạp số dư nhanh chóng qua mã QR ngân hàng/ví điện tử, thanh toán đơn hàng tức thì và quản lý lịch sử giao dịch minh bạch.',
        status: 'completed',
        deliverable: 'Hệ thống Ví & Thanh toán số hóa (/profile)',
      },
      {
        code: 'Bước 4.4',
        title: 'Xây dựng Trung tâm Phân tích Xu hướng & Dự báo Sản phẩm',
        description:
          'Theo dõi tốc độ tăng trưởng của các dòng sản phẩm 3D trên thị trường quốc tế, hỗ trợ ban điều hành và nhà bán hàng đón đầu xu hướng.',
        status: 'completed',
        deliverable: 'Phân hệ Phân tích Xu hướng (/trends)',
      },
    ],
  },
  {
    id: 'phase-5',
    phaseNumber: 'Phase 05',
    title: 'Hợp Nhất Đám Mây & Mở Rộng Vận Hành Xưởng Thông Minh',
    subtitle: 'Đồng bộ hóa toàn diện dữ liệu đám mây, điều phối xưởng in tập trung và mở rộng thương mại',
    timeline: 'Giai đoạn 5 • Đang vận hành & Mở rộng',
    progressPercent: 85,
    status: 'active',
    statusLabel: 'Đang triển khai (85%)',
    businessValue:
      'Đảm bảo khả năng chịu tải cao khi tăng trưởng người dùng, tự động hóa điều phối đơn hàng tại xưởng và sẵn sàng nhân rộng quy mô thương mại.',
    steps: [
      {
        code: 'Bước 5.1',
        title: 'Hợp nhất Cổng Dịch vụ Duy nhất (Unified Platform)',
        description:
          'Kết nối liền mạch toàn bộ các phân hệ Thiết kế, Giả lập Kiểm định, Cửa hàng và Quản trị trên một hệ thống trực tuyến thống nhất.',
        status: 'completed',
        deliverable: 'Nền tảng hợp nhất Laymor3D trực tuyến',
      },
      {
        code: 'Bước 5.2',
        title: 'Vận hành Hệ thống Điều phối Xưởng in 5 Công đoạn',
        description:
          'Giám sát trạng thái cụm thiết bị sản xuất và điều phối đơn hàng khép kín: Tiếp nhận → Chuẩn bị → Đang sản xuất → Hậu kỳ → Bàn giao.',
        status: 'completed',
        deliverable: 'Trung tâm Quản trị & Điều phối (/admin)',
      },
      {
        code: 'Bước 5.3',
        title: 'Đồng bộ hóa Cơ sở Dữ liệu Đám mây Tập trung',
        description:
          'Lưu trữ bền vững toàn bộ đơn hàng, tài khoản, danh mục sản phẩm và hồ sơ kiểm định chất lượng trên hạ tầng đám mây có độ sẵn sàng cao.',
        status: 'completed',
        deliverable: 'Hạ tầng lưu trữ đám mây đồng bộ 24/7',
      },
      {
        code: 'Bước 5.4',
        title: 'Mở rộng Năng lực Sản xuất & Đối tác Giao vận Toàn quốc',
        description:
          'Đẩy mạnh hợp tác với mạng lưới xưởng vệ tinh, tối ưu hóa thời gian giao nhận và triển khai các chiến dịch thu hút người dùng mới.',
        status: 'in_progress',
        deliverable: 'Mạng lưới vận hành thương mại mở rộng',
      },
    ],
  },
];

const BUSINESS_MODULES = [
  {
    name: 'Không Gian Sáng Tạo 3D Studio',
    role: 'Khởi tạo mẫu 3D từ ý tưởng/hình ảnh, đo lường kích thước và dự toán chi phí sản xuất tức thì',
    progress: 100,
    status: 'Đang hoạt động',
    href: '/studio',
    icon: Sparkles,
  },
  {
    name: 'Hệ Thống Giả Lập & Kiểm Định (PrintSim Pro)',
    role: 'Mô phỏng quá trình sản xuất theo từng lớp cắt, cảnh báo rủi ro vật lý và tự động tối ưu thông số',
    progress: 100,
    status: 'Đang hoạt động',
    href: '/3dsim',
    icon: Cpu,
    isExternalSpa: true,
  },
  {
    name: 'Cửa Hàng Vật Liệu & Dịch Vụ Đặt In 24h',
    role: 'Thương mại điện tử vật tư chính hãng, chợ file thiết kế bản quyền và đặt in gia công theo yêu cầu',
    progress: 100,
    status: 'Đang hoạt động',
    href: '/shop',
    icon: ShoppingBag,
  },
  {
    name: 'Trung Tâm Phân Tích Xu Hướng Thị Trường',
    role: 'Theo dõi tốc độ tăng trưởng sản phẩm toàn cầu và tư vấn danh mục hàng hóa tiềm năng',
    progress: 100,
    status: 'Đang hoạt động',
    href: '/trends',
    icon: TrendingUp,
  },
  {
    name: 'Hệ Thống Thu Thập & Chuẩn Hóa Tri Thức',
    role: 'Tổng hợp xu hướng mẫu thiết kế mới và xây dựng thư viện tiêu chuẩn chất lượng sản xuất',
    progress: 100,
    status: 'Đang hoạt động',
    href: '/crawler',
    icon: Layers,
  },
  {
    name: 'Ví Thanh Toán & Quản Lý Đơn Hàng Cá Nhân',
    role: 'Nạp quỹ qua mã QR tự động, thanh toán nhanh và theo dõi tiến độ sản xuất đơn hàng trực tuyến',
    progress: 100,
    status: 'Đang hoạt động',
    href: '/profile',
    icon: Award,
  },
  {
    name: 'Kênh Đối Tác Thiết Kế & Quản Trị Xưởng',
    role: 'Quản lý gian hàng đối tác, duyệt sản phẩm, điều phối thiết bị xưởng in và giám sát vận hành',
    progress: 95,
    status: 'Đang mở rộng',
    href: '/admin',
    icon: Building2,
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Khởi Tạo & Tiếp Nhận Mẫu',
    desc: 'Khách hàng tải lên hình ảnh ý tưởng, bản vẽ sẵn có hoặc lựa chọn mẫu từ kho thư viện thương mại.',
  },
  {
    step: '02',
    title: 'Mô Phỏng & Kiểm Định (QC)',
    desc: 'Hệ thống giả lập quá trình sản xuất, kiểm tra độ bền kết cấu và tự động tối ưu hóa thông số an toàn.',
  },
  {
    step: '03',
    title: 'Định Giá Tự Động & Minh Bạch',
    desc: 'Bóc tách chính xác lượng vật tư, thời gian sản xuất và hiển thị báo giá trọn gói ngay lập tức.',
  },
  {
    step: '04',
    title: 'Thanh Toán & Xác Nhận Đơn',
    desc: 'Thanh toán số hóa qua Ví nội bộ hoặc QR ngân hàng, tự động khởi tạo lệnh sản xuất ưu tiên.',
  },
  {
    step: '05',
    title: 'Sản Xuất Xưởng & Bàn Giao',
    desc: 'Phân bổ thiết bị tại xưởng, gia công hoàn thiện hậu kỳ, kiểm tra chất lượng cuối và giao tận tay khách hàng.',
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              <span>Báo Cáo Tiến Độ Dự Án • Dành Cho Nhà Đầu Tư &amp; Đối Tác</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Tổng Quan Lộ Trình &amp; Tiến Độ Triển Khai{' '}
              <span className="bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent">
                Hệ Sinh Thái LAYMOR 3D
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Tài liệu cập nhật tổng thể tiến độ thực hiện dự án qua <strong>5 Giai đoạn (Phases)</strong> chiến lược,
              mức độ hoàn thiện của các phân hệ kinh doanh và chuỗi giá trị vận hành thực tế. Nội dung được biên soạn
              ở cấp độ quản trị điều hành, đảm bảo tính minh bạch về tiến độ và bảo mật tuyệt đối tài sản công nghệ lõi.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all"
              >
                <Box className="w-4 h-4" />
                <span>Trải Nghiệm Trang Chủ</span>
              </Link>
              <a
                href="/3dsim"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 text-xs font-bold transition-all"
              >
                <Cpu className="w-4 h-4 text-cyan-600" />
                <span>Mở Bộ Giả Lập PrintSim Pro</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-cyan-600" />
              </a>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-slate-600" />
                <span>Cửa Hàng &amp; Dịch Vụ Đặt In</span>
              </Link>
            </div>
          </div>

          {/* Executive KPI Summary Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0 lg:w-[360px]">
            <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-700">96%</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                Tiến Độ Tổng Thể
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">5 Phases</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                Lộ Trình Triển Khai
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">7 / 7</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                Phân Hệ Trực Tuyến
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">24/7</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                Vận Hành Khép Kín
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200/80">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span>TIẾN ĐỘ HOÀN THIỆN LỘ TRÌNH DỰ ÁN (GIAI ĐOẠN 1 – GIAI ĐOẠN 5)</span>
            <span className="text-cyan-700 font-mono">96% Hoàn tất • Sẵn sàng Thương mại hóa</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 border border-slate-200/80 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-600 via-sky-500 to-emerald-500 transition-all duration-500"
              style={{ width: '96%' }}
            />
          </div>
        </div>
      </section>

      {/* 2. 5-STEP END-TO-END VALUE CHAIN */}
      <section className="rounded-[28px] vision-glass-panel border border-slate-200/90 bg-white/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-cyan-700 text-xs font-bold uppercase tracking-wider">
              <Workflow className="w-4 h-4" />
              <span>Chuỗi Giá Trị Cốt Lõi</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Quy Trình Khép Kín 5 Bước Từ Ý Tưởng Đến Sản Phẩm Thực Tế
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã vận hành đồng bộ</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {WORKFLOW_STEPS.map((item, idx) => (
            <div
              key={item.step}
              className="relative p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between hover:border-cyan-300 transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg bg-cyan-600 text-white font-mono text-xs font-bold">
                    Bước {item.step}
                  </span>
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-slate-400 hidden md:block" />
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Hoàn thiện 100%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. DETAILED PROJECT PHASES & MILESTONES */}
      <section className="rounded-[28px] vision-glass-panel border border-slate-200/90 bg-white/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-700 text-xs font-bold uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Lộ Trình Triển Khai Chi Tiết</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Các Giai Đoạn Thực Hiện Dự Án (Phases &amp; Action Steps)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Chọn từng giai đoạn bên dưới để theo dõi chi tiết các bước triển khai và hạng mục bàn giao:
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
              Tất Cả (5 Phases)
            </button>
            {PROJECT_PHASES.map((phase) => (
              <button
                key={phase.id}
                onClick={() => setSelectedPhaseId(phase.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                    <span className="px-3 py-1 rounded-full bg-cyan-600 text-white text-xs font-extrabold uppercase tracking-wider">
                      {phase.phaseNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{phase.timeline}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${
                        phase.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
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
                    <span className="text-slate-600">Mức độ hoàn thành</span>
                    <span className="text-cyan-700 font-mono">{phase.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        phase.status === 'completed'
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-cyan-600 to-amber-500'
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
                  <strong className="text-cyan-900">Giá trị thương mại &amp; Vận hành: </strong>
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
                            <span>Hoàn tất</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Đang mở rộng</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Kết quả bàn giao:</span>
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
            <span>Trạng Thái Nghiệm Thu Sản Phẩm</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Bảng Tổng Hợp Tiến Độ 7 Phân Hệ Kinh Doanh
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Tất cả các phân hệ cốt lõi đã được kết nối trực tuyến để nhà đầu tư có thể kiểm thử và trải nghiệm thực tế:
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50/80">
                <th className="py-3.5 px-4 rounded-tl-xl">Phân Hệ Sản Phẩm</th>
                <th className="py-3.5 px-4">Vai Trò Thương Mại &amp; Vận Hành</th>
                <th className="py-3.5 px-4">Tiến Độ</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right rounded-tr-xl">Trải Nghiệm</th>
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
                        <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${mod.progress}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-xs">{mod.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{mod.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {mod.isExternalSpa ? (
                        <a
                          href={mod.href}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold transition-all"
                        >
                          <span>Mở Phân Hệ</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <Link
                          href={mod.href}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all"
                        >
                          <span>Truy Cập</span>
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
              Chính Sách Bảo Mật Thông Tin &amp; Sở Hữu Trí Tuệ (IP Protection)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Để bảo vệ lợi thế cạnh tranh và bí mật thương mại của dự án, trang tổng quan này chỉ công bố tiến độ
              triển khai theo các giai đoạn nghiệp vụ. Toàn bộ mã nguồn, thuật toán xử lý hình học, quy trình tự động hóa
              và thông số kết nối hệ thống được lưu trữ bảo mật riêng biệt dưới quyền kiểm soát của Ban Điều Hành.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/studio"
            className="px-4 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            Trải Nghiệm Ngay →
          </Link>
        </div>
      </section>
    </div>
  );
}
