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
} from 'lucide-react';

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
    title: 'Khảo Sát Mô Hình & Dựng Bản Nháp Giao Diện Ban Đầu',
    subtitle: 'Xây dựng khung ý tưởng sơ bộ (Concept Draft) để có cơ sở làm việc và lấy ý kiến điều chỉnh',
    timeline: 'Giai đoạn 1 • Đã dựng khung nháp, chờ hiệu chỉnh UI/UX',
    progressPercent: 75,
    status: 'active',
    statusLabel: 'Đạt 75% (Cần điều chỉnh UI/UX)',
    businessValue:
      'Tạo bản mẫu trực quan ban đầu để đội ngũ và phía khách hàng/đối tác có chất liệu thực tế cùng rà soát, góp ý và thống nhất lại giao diện.',
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
        title: 'Dựng bản nháp giao diện (Draft UI/UX) trên môi trường thử nghiệm',
        description:
          'Triển khai các màn hình mẫu ban đầu cho Trang chủ, Không gian 3D, Buồng giả lập và Cửa hàng để phục vụ đánh giá trực quan.',
        status: 'completed',
        deliverable: 'Giao diện thử nghiệm bản đầu tiên',
      },
      {
        code: 'Bước 1.3',
        title: 'Làm việc lại với phía khách hàng để rà soát & điều chỉnh UI/UX',
        description:
          'Tổ chức các buổi làm việc trực tiếp để ghi nhận yêu cầu thay đổi về bố cục, màu sắc, cách sắp xếp bảng thông số và luồng thao tác sao cho sát với nhu cầu thực tế.',
        status: 'in_progress',
        deliverable: 'Danh mục yêu cầu chỉnh sửa UI/UX',
      },
      {
        code: 'Bước 1.4',
        title: 'Cập nhật & chuẩn hóa lại toàn bộ thiết kế giao diện sau phản hồi',
        description:
          'Thiết kế lại các khu vực chưa hợp lý, tối ưu hóa trải nghiệm người dùng trên cả máy tính và điện thoại theo đúng thống nhất mới.',
        status: 'upcoming',
        deliverable: 'Giao diện UI/UX hoàn chỉnh được duyệt',
      },
    ],
  },
  {
    id: 'phase-2',
    phaseNumber: 'Phase 02',
    title: 'Phát Triển Khung Không Gian 3D & Mô Phỏng Cơ Bản (Alpha)',
    subtitle: 'Xây dựng bộ khung hiển thị mô hình 3D trực tuyến và cơ chế cắt lớp thử nghiệm',
    timeline: 'Giai đoạn 2 • Đang thử nghiệm & hiệu chỉnh',
    progressPercent: 65,
    status: 'active',
    statusLabel: 'Đạt 65% (Đang thử nghiệm)',
    businessValue:
      'Kiểm chứng khả năng hiển thị mô hình 3D trên trình duyệt và thử nghiệm các thao tác điều khiển trước khi ghép nối dữ liệu chuẩn.',
    steps: [
      {
        code: 'Bước 2.1',
        title: 'Xây dựng khung quan sát mô hình 3D trực tuyến',
        description:
          'Hỗ trợ xoay 360°, phóng đại chi tiết, hiển thị lưới bàn in và đo kích thước bao ngoài của phôi mẫu ở mức cơ bản.',
        status: 'completed',
        deliverable: 'Khung hiển thị 3D (/studio & /3dsim)',
      },
      {
        code: 'Bước 2.2',
        title: 'Thử nghiệm cơ chế tua lớp cắt (Layer Scrubbing)',
        description:
          'Mô phỏng hiệu ứng sản phẩm hình thành theo từng lớp từ đáy lên đỉnh và điều chỉnh tốc độ tua trên dữ liệu mẫu.',
        status: 'completed',
        deliverable: 'Thanh điều khiển tiến độ thử nghiệm',
      },
      {
        code: 'Bước 2.3',
        title: 'Điều chỉnh lại bố cục vùng điều khiển 3D theo góp ý UI/UX',
        description:
          'Sắp xếp lại vị trí các thanh công cụ, bảng thông số và nút chức năng trong buồng 3D để không gây rối mắt và dễ thao tác hơn.',
        status: 'in_progress',
        deliverable: 'Giao diện buồng 3D tối ưu mới',
      },
      {
        code: 'Bước 2.4',
        title: 'Tối ưu hóa hiệu năng khi tải các tệp mô hình dung lượng lớn',
        description:
          'Xử lý tình trạng chậm và nặng trình duyệt khi người dùng tải lên các tệp 3D có cấu trúc lưới phức tạp.',
        status: 'upcoming',
        deliverable: 'Cơ chế xử lý tệp 3D dung lượng lớn',
      },
    ],
  },
  {
    id: 'phase-3',
    phaseNumber: 'Phase 03',
    title: 'Bổ Sung & Hoàn Thiện Bộ Dữ Liệu Đầu Vào Chuẩn Bambu Studio',
    subtitle: 'Chuẩn hóa toàn diện hệ thống thông số cắt lớp, cấu trúc cây chống (Support) và đường chạy sợi in thực tế',
    timeline: 'Giai đoạn 3 • Trọng tâm đang triển khai',
    progressPercent: 40,
    status: 'active',
    statusLabel: 'Đang thực hiện (40%)',
    businessValue:
      'Là phần lõi quan trọng nhất đang được xây dựng: giúp dữ liệu đầu vào đầy đủ, chuẩn xác theo đúng hệ quy chiếu của Bambu Studio.',
    steps: [
      {
        code: 'Bước 3.1',
        title: 'Bổ sung & chuẩn hóa bộ thông số đầu vào theo Bambu Studio',
        description:
          'Rà soát và nhập liệu đầy đủ các nhóm thông số từ Bambu Studio (chiều cao lớp, số vách, kiểu ruột, tốc độ từng vùng, nhiệt độ và lưu lượng theo từng loại nhựa).',
        status: 'in_progress',
        deliverable: 'Bộ dữ liệu thông số chuẩn Bambu Studio',
      },
      {
        code: 'Bước 3.2',
        title: 'Hoàn thiện dữ liệu cấu trúc cây chống (Tree Support) & Sợi in',
        description:
          'Bóc tách và nạp dữ liệu đường chạy dao thực tế từ Bambu Studio để hiển thị chính xác vị trí nhánh chống và lượng nhựa tiêu hao phụ trợ.',
        status: 'in_progress',
        deliverable: 'Kho dữ liệu Support & Đường chạy chuẩn',
      },
      {
        code: 'Bước 3.3',
        title: 'Mở rộng tập dữ liệu mẫu đa hình thái (Benchmark Dataset)',
        description:
          'Bổ sung thêm nhiều mẫu phôi thực tế có độ khó khác nhau (khớp động, góc nghiêng lớn, chi tiết mảnh) để làm giàu kho dữ liệu.',
        status: 'in_progress',
        deliverable: 'Bộ dữ liệu mẫu đa kịch bản',
      },
      {
        code: 'Bước 3.4',
        title: 'Đồng bộ hóa sai số giữa tính toán phần mềm và thực nghiệm',
        description:
          'Cân chỉnh lại hệ số thời gian di chuyển đầu in và lượng nhựa xả để kết quả tính toán khớp với Bambu Studio.',
        status: 'upcoming',
        deliverable: 'Bảng hiệu chuẩn độ chính xác dữ liệu',
      },
    ],
  },
  {
    id: 'phase-4',
    phaseNumber: 'Phase 04',
    title: 'Xây Dựng Tính Năng Đối Chiếu Thông Số & Kiểm Định Chéo',
    subtitle: 'So sánh trực tiếp giữa các cấu hình, đối chiếu thông số trước – sau và kiểm soát chất lượng phiên in',
    timeline: 'Giai đoạn 4 • Đang phát triển',
    progressPercent: 20,
    status: 'active',
    statusLabel: 'Đang phát triển (20%)',
    businessValue:
      'Giúp đối chiếu rõ ràng sự khác biệt khi thay đổi thông số in, phát hiện ngay các thông số lệch chuẩn và đánh giá hiệu quả tối ưu.',
    steps: [
      {
        code: 'Bước 4.1',
        title: 'Phát triển công cụ đối chiếu đa phiên (Session Comparison)',
        description:
          'Cho phép đặt 2 hoặc nhiều cấu hình in cạnh nhau để đối chiếu trực tiếp sự thay đổi về thời gian, lượng nhựa, điểm an toàn và chi phí.',
        status: 'in_progress',
        deliverable: 'Tính năng đối chiếu cấu hình trực quan',
      },
      {
        code: 'Bước 4.2',
        title: 'Đối chiếu thông số tùy chỉnh với hồ sơ chuẩn Bambu Studio',
        description:
          'Tự động rà soát và làm nổi bật các thông số đang bị điều chỉnh lệch khỏi ngưỡng khuyến nghị an toàn của Bambu Studio.',
        status: 'in_progress',
        deliverable: 'Bộ kiểm tra & đối chiếu sai lệch',
      },
      {
        code: 'Bước 4.3',
        title: 'Theo dõi lịch sử biến động thông số & khóa cấu hình chuẩn',
        description:
          'Ghi nhận chi tiết từng lần tinh chỉnh thông số, thống kê các thông số hay bị thay đổi và khóa biên bản cấu hình tối ưu.',
        status: 'upcoming',
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
    title: 'Xây Dựng Hệ Thống Tài Khoản Admin, Nhân Viên & Khách Hàng',
    subtitle: 'Phát triển hệ thống định danh bảo mật, phân quyền nghiệp vụ thực tế và quy trình phối hợp nội bộ',
    timeline: 'Giai đoạn 5 • Đang xây dựng luồng thực',
    progressPercent: 15,
    status: 'active',
    statusLabel: 'Đang xây dựng (15%)',
    businessValue:
      'Thay thế hoàn toàn cơ chế chuyển đổi tài khoản mẫu hiện tại bằng hệ thống tài khoản thực tế, phân tách rõ Admin, Nhân viên và Khách hàng.',
    steps: [
      {
        code: 'Bước 5.1',
        title: 'Xây dựng hệ thống Tài khoản Khách hàng (Customer Account)',
        description:
          'Hoàn thiện luồng đăng ký, đăng nhập bảo mật, quản lý kho tệp 3D cá nhân, lưu cấu hình riêng và theo dõi lịch sử đơn hàng thực tế.',
        status: 'in_progress',
        deliverable: 'Phân hệ Tài khoản Khách hàng thực',
      },
      {
        code: 'Bước 5.2',
        title: 'Xây dựng phân hệ làm việc cho Nhân viên Xưởng (Staff Portal)',
        description:
          'Thiết kế màn hình nghiệp vụ riêng cho nhân viên kỹ thuật: nhận lệnh sản xuất, cập nhật tiến độ máy in, báo cáo lỗi và xác nhận hoàn tất hậu kỳ.',
        status: 'upcoming',
        deliverable: 'Phân hệ Điều phối dành cho Nhân viên',
      },
      {
        code: 'Bước 5.3',
        title: 'Hoàn thiện Trung tâm Quản trị Hệ thống (Admin Control Center)',
        description:
          'Xây dựng công cụ quản trị thực tế cho Admin: quản lý tài khoản nhân viên & khách hàng, phân quyền chi tiết, cấu hình đơn giá và kiểm duyệt toàn hệ thống.',
        status: 'in_progress',
        deliverable: 'Hệ thống Quản trị Admin chuyên sâu',
      },
      {
        code: 'Bước 5.4',
        title: 'Xây dựng cổng Đối tác Thiết kế & Kiểm duyệt viên (Seller & Mod)',
        description:
          'Cho phép nhà thiết kế tải mẫu thương mại lên chợ, kiểm duyệt viên rà soát chất lượng file trước khi mở bán và đối soát doanh thu.',
        status: 'upcoming',
        deliverable: 'Quy trình kiểm duyệt & tài khoản Seller',
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
    title: '1. Làm Việc Lại & Điều Chỉnh Giao Diện (UI/UX) Cùng Khách Hàng',
    status: 'Đang rà soát & Chỉnh sửa',
    desc: 'Giao diện hiện tại mới là bản dựng nháp ban đầu để hình dung luồng hoạt động. Đội ngũ cần làm việc lại chi tiết với phía khách hàng để điều chỉnh bố cục, màu sắc, cách hiển thị thông số và tối ưu trải nghiệm thao tác thực tế.',
    icon: Palette,
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  {
    title: '2. Bổ Sung & Hoàn Thiện Bộ Dữ Liệu Đầu Vào Theo Bambu Studio',
    status: 'Đang thực hiện (40%)',
    desc: 'Phần dữ liệu đầu vào hiện vẫn chưa hoàn thiện. Đội ngũ đang tiếp tục bóc tách, chuẩn hóa và nạp bổ sung bộ thông số cắt lớp, cấu trúc cây chống (Support) và đường chạy sợi in chuẩn từ Bambu Studio.',
    icon: Database,
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    title: '3. Xây Dựng Tính Năng Đối Chiếu & So Sánh Thông Số',
    status: 'Đang phát triển (20%)',
    desc: 'Phát triển công cụ đối chiếu trực tiếp giữa các cấu hình in, so sánh thông số người dùng tinh chỉnh với thông số gốc của Bambu Studio để đánh giá mức độ chênh lệch chi phí, thời gian và chất lượng.',
    icon: GitCompare,
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  {
    title: '4. Xây Dựng Hệ Thống Tài Khoản Admin, Nhân Viên & Khách Hàng',
    status: 'Đang phát triển (15%)',
    desc: 'Hiện trên web mới chỉ là nút chuyển đổi vai trò giả lập để xem thử giao diện. Cần xây dựng toàn bộ hệ thống đăng nhập, bảo mật phân quyền và màn hình làm việc riêng biệt cho Admin, Nhân viên xưởng và Khách hàng.',
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
    name: 'Giao Diện & Trải Nghiệm Người Dùng (UI/UX)',
    role: 'Mới ở mức bản nháp thử nghiệm; đang lên lịch làm việc lại với khách hàng để điều chỉnh bố cục & thao tác',
    progress: 60,
    status: 'Chờ điều chỉnh UI/UX',
    statusStyle: 'bg-rose-50 text-rose-800 border-rose-200',
    href: '/',
    icon: Palette,
  },
  {
    name: 'Không Gian 3D Studio & Dự Toán Sơ Bộ (/studio)',
    role: 'Đã có khung xem 3D cơ bản; cần hiệu chỉnh lại giao diện điều khiển và đồng bộ công thức tính giá thực tế',
    progress: 50,
    status: 'Đang thử nghiệm',
    statusStyle: 'bg-amber-50 text-amber-800 border-amber-200',
    href: '/studio',
    icon: Sparkles,
  },
  {
    name: 'Bộ Giả Lập & Dữ Liệu Chuẩn Bambu Studio (/3dsim)',
    role: 'Đang bổ sung và hoàn thiện bộ dữ liệu đầu vào theo chuẩn Bambu Studio (hiện dữ liệu vẫn chưa xong)',
    progress: 40,
    status: 'Đang nạp dữ liệu',
    statusStyle: 'bg-amber-50 text-amber-800 border-amber-200',
    href: '/3dsim',
    icon: Cpu,
    isExternalSpa: true,
  },
  {
    name: 'Tính Năng Đối Chiếu Thông Số & Kiểm Định Chéo',
    role: 'Đối chiếu trực tiếp thông số giữa các phiên chạy và so sánh với tiêu chuẩn gốc Bambu Studio',
    progress: 20,
    status: 'Đang phát triển',
    statusStyle: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    href: '/3dsim',
    icon: GitCompare,
    isExternalSpa: true,
  },
  {
    name: 'Hệ Thống Tài Khoản Admin, Nhân Viên & Khách Hàng',
    role: 'Đang xây dựng hệ thống đăng nhập, phân quyền thực tế và không gian làm việc riêng cho từng vai trò',
    progress: 15,
    status: 'Chưa hoàn thiện',
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
              Dự án hiện đang ở <strong>Giai đoạn Thử nghiệm (Prototype / Beta)</strong>. Nhiều hạng mục quan trọng vẫn
              đang trong quá trình xây dựng và chưa hoàn thiện: đội ngũ cần{' '}
              <strong>làm việc lại với phía khách hàng để điều chỉnh thiết kế UI/UX</strong>, tiếp tục{' '}
              <strong>bổ sung &amp; chuẩn hóa bộ dữ liệu đầu vào theo Bambu Studio</strong>, phát triển{' '}
              <strong>tính năng đối chiếu thông số</strong>, đồng thời xây dựng hoàn chỉnh{' '}
              <strong>hệ thống tài khoản thực tế cho Admin, Nhân viên và Khách hàng</strong>.
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
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">~38%</div>
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
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">Thử Nghiệm</div>
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
              Đạt ~38% • Đang trong giai đoạn thử nghiệm, chỉnh sửa UI/UX &amp; nạp dữ liệu
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 border border-slate-200/80 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-600 via-sky-500 to-amber-500 transition-all duration-500"
              style={{ width: '38%' }}
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
              <span>Các Hạng Mục Chưa Hoàn Thiện &amp; Đang Tập Trung Xử Lý</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              5 Công Việc Trọng Tâm Cần Hoàn Thiện Trong Giai Đoạn Tới
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Hiện tại website mới dừng ở mức khung thử nghiệm ban đầu, dưới đây là các phần việc lớn đang được thực
              hiện tiếp:
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
                            <span>Đã dựng khung</span>
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
            Các phân hệ hiện đang ở giai đoạn bản nháp thử nghiệm (Beta), cần tiếp tục điều chỉnh UI/UX, nạp dữ liệu
            Bambu Studio và xây dựng luồng tài khoản thực tế:
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
                              mod.progress >= 60
                                ? 'bg-cyan-600'
                                : mod.progress >= 35
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
              Website hiện đang trong <strong>Giai đoạn Thử nghiệm (Beta)</strong>. Giao diện UI/UX sẽ tiếp tục được điều
              chỉnh sau các buổi làm việc với phía khách hàng; bộ dữ liệu Bambu Studio, công cụ đối chiếu và hệ thống tài
              khoản (Admin – Nhân viên – Khách hàng) đang trong tiến trình xây dựng. Toàn bộ thông tin kỹ thuật, mã
              nguồn và kết nối hệ thống được ẩn nhằm bảo mật tuyệt đối tài sản dự án.
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
