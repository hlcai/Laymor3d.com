export type RefTagType = 'new' | 'coming_soon';

export interface ILaymorPrinterProduct {
  id: string;
  brand: 'Bambu Lab' | 'FLASHFORGE' | 'SNAPMAKER' | 'CREALITY' | 'ELEGOO';
  series: string;
  modelCode: string;
  name: string;
  subtitle: string;
  buildVolumeMm: string;
  maxSpeedMmS: number;
  multiColorSupport: string;
  priceVnd: number;
  originalPriceVnd?: number;
  etaBadge?: string;
  refTag?: RefTagType;
  inStock: boolean;
  highlights: string[];
  accentColor: string;
}

export interface ILaymorFilamentProduct {
  id: string;
  brand: 'Bambu Lab' | 'Creality' | 'LAYMOR';
  name: string;
  materialType: 'PLA' | 'PETG' | 'ABS/ASA' | 'CF/Engineering' | 'Silk';
  colorName: string;
  colorHex: string;
  weightKg: number;
  diameterMm: number;
  priceVnd: number;
  refTag?: RefTagType;
  inStock: boolean;
  compatiblePrinters: string[];
  nozzleTemp: string;
  bedTemp: string;
  highlights: string[];
}

export interface ILaymorAccessoryProduct {
  id: string;
  name: string;
  brand: 'Bambu Lab' | 'CREALITY' | 'LAYMOR' | 'ELEGOO';
  accessoryType: 'Build Plate' | 'Hotend' | 'Upgrade Parts' | 'Air & Filtration';
  compatibleModels: string[];
  priceVnd: number;
  etaBadge: string;
  refTag: RefTagType;
  description: string;
}

export interface IHeroSlideBanner {
  id: string;
  index: number;
  categoryLabel: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  secondaryText?: string;
  secondaryHref?: string;
  visualType: 'printer' | 'filament' | 'models' | 'simulator' | 'showroom';
  badgeText: string;
  specs: Array<{ label: string; value: string }>;
}

export const HERO_SLIDE_BANNERS: IHeroSlideBanner[] = [
  {
    id: 'banner-printers',
    index: 1,
    categoryLabel: '01 / MÁY IN 3D CÔNG NGHIỆP & ĐA MÀU',
    title: 'Thế Hệ Máy In 3D Tốc Độ Cao Bambu Lab • Creality • Snapmaker',
    subtitle: 'Chính hãng phân phối bởi LAYMOR — Bảo trì trọn đời & Hỗ trợ kỹ thuật 1:1',
    description:
      'Quy tụ các dòng máy in 3D флагship mới nhất: Bambu Lab H2D, X2D, P2S, A2L, A1 cùng Flashforge Creator 5 Pro, Snapmaker U1, Creality K3 / i8 và Elegoo Carbon 2 Combo.',
    ctaText: 'MUA NGAY',
    ctaHref: '/shop?category=printers',
    secondaryText: 'Tư vấn chọn máy',
    secondaryHref: '/about#showroom',
    visualType: 'printer',
    badgeText: 'H2D • X2D • P2S • A2L • A1',
    specs: [
      { label: 'Tốc độ in tối đa', value: '600 mm/s' },
      { label: 'Hệ thống đa màu', value: 'Dual AMS 8–16 Màu' },
      { label: 'Bảo hành chính hãng', value: '12 Tháng + Bảo trì trọn đời' },
    ],
  },
  {
    id: 'banner-filaments',
    index: 2,
    categoryLabel: '02 / NHỰA IN 3D CHÍNH HÃNG',
    title: 'Nhựa Cuộn Cao Cấp Bambu Lab • Creality • LAYMOR',
    subtitle: 'Độ đồng đều đường kính ±0.02mm — Tích hợp sẵn RFID Profile tự nhận diện',
    description:
      'Đầy đủ các dòng nhựa PLA Matte, PLA Silk, Hyper PLA tốc độ cao, PETG-HF, ABS, ASA và sợi Carbon kỹ thuật cho bề mặt bản in sắc nét, không tắc đầu phun.',
    ctaText: 'MUA NGAY',
    ctaHref: '/shop?category=filaments',
    secondaryText: 'Xem bảng màu nhựa',
    secondaryHref: '/shop?category=filaments',
    visualType: 'filament',
    badgeText: 'Bambu Lab • Creality • LAYMOR (Coming soon)',
    specs: [
      { label: 'Độ chuẩn xác sợi', value: '1.75mm ± 0.02mm' },
      { label: 'Chống ẩm & đóng gói', value: 'Hút chân không 100%' },
      { label: 'Tương thích AMS', value: 'Cuộn chuẩn RFID / Spool' },
    ],
  },
  {
    id: 'banner-models',
    index: 3,
    categoryLabel: '03 / MÔ HÌNH VÀ FILE MÔ HÌNH 3D',
    title: 'Thư Viện Mô Hình 3D Bản Quyền & Sản Phẩm In Sẵn',
    subtitle: 'Khám phá hàng trăm mẫu thiết kế .3MF / .STL đã kiểm chứng thông số cắt lớp',
    description:
      'Sưu tầm file thiết kế 3D chất lượng cao hoặc đặt in thành phẩm trực tiếp tại xưởng LAYMOR dành cho quà tặng doanh nghiệp, mô hình nghệ thuật, đồ chơi khớp động và chi tiết cơ khí.',
    ctaText: 'MUA NGAY',
    ctaHref: '/shop?category=models',
    secondaryText: 'Tạo mẫu từ ảnh 2D',
    secondaryHref: '/studio',
    visualType: 'models',
    badgeText: '3MF • STL • Thành phẩm in 3D',
    specs: [
      { label: 'Định dạng chuẩn', value: '.3MF kèm Profile / .STL' },
      { label: 'Kiểm định cấu trúc', value: '100% Watertight Mesh' },
      { label: 'Đặt in theo yêu cầu', value: 'Giao nhanh toàn quốc' },
    ],
  },
  {
    id: 'banner-simulator',
    index: 4,
    categoryLabel: '04 / MÔ PHỎNG IN 3D & AI STUDIO',
    title: 'Buồng Mô Phỏng In 3D & Chuyên Gia AI Chuẩn Bambu Studio',
    subtitle: 'Kiểm tra từng lớp cắt, dựng Tree Support không xuyên mẫu và xuất .3MF in ngay',
    description:
      'Trải nghiệm công cụ giả lập cắt lớp 3D trực tiếp trên trình duyệt: xem sợi nhựa khối 3D theo từng layer, nạp trực tiếp Tree Support từ Bambu Studio và nhận tư vấn 6 nhóm thông số từ AI.',
    ctaText: 'MUA NGAY',
    ctaHref: '/3dsim',
    secondaryText: 'Chuyển ảnh 2D → 3D',
    secondaryHref: '/studio',
    visualType: 'simulator',
    badgeText: 'AI STUDIO • NEW',
    specs: [
      { label: 'Cắt lớp trực tuyến', value: '2D-SDF & Volumetric Shader' },
      { label: 'Hệ thống chống đỡ', value: 'Tree Support Gốc Bambu' },
      { label: 'Xuất file dự án', value: '.3MF Đầy đủ Profile' },
    ],
  },
  {
    id: 'banner-showroom',
    index: 5,
    categoryLabel: '05 / SHOWROOM TRẢI NGHIỆM THỰC TẾ',
    title: 'LAYMOR Showroom — Trải Nghiệm Dàn Máy In 3D Thực Tế',
    subtitle: 'The Bliss - Dự án Urban Green, Hiệp Bình Phước, TP. Thủ Đức, TP.HCM',
    description:
      'Mời bạn ghé thăm Showroom LAYMOR để trực tiếp quan sát dàn máy Bambu Lab H2D/X2D/P2S vận hành đa màu, sờ tận tay mẫu in thực tế và nhận tư vấn giải pháp 1:1 từ đội ngũ kỹ sư.',
    ctaText: 'MUA NGAY',
    ctaHref: '/about#showroom',
    secondaryText: 'Xem bản đồ Showroom',
    secondaryHref: '/about#showroom',
    visualType: 'showroom',
    badgeText: 'URBAN GREEN • THỦ ĐỨC',
    specs: [
      { label: 'Địa chỉ Showroom', value: 'Shophouse B1.15 - The Bliss' },
      { label: 'Giờ mở cửa', value: 'Thứ 2 – Thứ 6 (9:00 – 18:00)' },
      { label: 'Hotline hỗ trợ 1:1', value: '0775 015 612' },
    ],
  },
];

// DANH MỤC MÁY IN 3D THEO ĐÚNG CÂY THƯ MỤC KHÁCH HÀNG (TRANG 2, 3, 4)
export const LAYMOR_PRINTER_BRANDS: Array<{
  id: string;
  name: 'Bambu Lab' | 'FLASHFORGE' | 'SNAPMAKER' | 'CREALITY' | 'ELEGOO';
  tagline: string;
  models: string[];
}> = [
  {
    id: 'bambu-lab',
    name: 'Bambu Lab',
    tagline: 'Hệ sinh thái máy in 3D tốc độ cao & đa màu AMS hàng đầu thế giới',
    models: ['A1', 'A2L', 'H2D', 'X2D', 'P2S'],
  },
  {
    id: 'flashforge',
    name: 'FLASHFORGE',
    tagline: 'Dòng máy in 3D buồng kín chuyên nghiệp cho kỹ thuật & sản xuất',
    models: ['Creator 5 Pro'],
  },
  {
    id: 'snapmaker',
    name: 'SNAPMAKER',
    tagline: 'Cấu trúc cơ khí CNC kim loại nguyên khối độ chính xác cao',
    models: ['U1'],
  },
  {
    id: 'creality',
    name: 'CREALITY',
    tagline: 'Tốc độ CoreXY thế hệ mới kèm hệ thống đa màu thông minh',
    models: ['i8', 'i7 combo', 'K3'],
  },
  {
    id: 'elegoo',
    name: 'ELEGOO',
    tagline: 'Hiệu năng CoreXY vượt trội với khung sườn hợp kim cứng vững',
    models: ['Carbon 2 combo'],
  },
];

export const LAYMOR_PRINTERS_CATALOG: ILaymorPrinterProduct[] = [
  // 1. BAMBU LAB: A1 - A2L - H2D - X2D - P2S
  {
    id: 'bambu-h2d',
    brand: 'Bambu Lab',
    series: 'H2 Series Flagship',
    modelCode: 'H2D',
    name: 'Bambu Lab H2D Dual-Nozzle AMS Combo',
    subtitle: 'Siêu phẩm 2 đầu phun độc lập, buồng nhiệt chủ động & hỗ trợ Dual AMS đa vật liệu',
    buildVolumeMm: '350 × 320 × 325 mm',
    maxSpeedMmS: 600,
    multiColorSupport: 'Hỗ trợ tới 4 bộ AMS (16 màu)',
    priceVnd: 54900000,
    originalPriceVnd: 58500000,
    refTag: 'new',
    inStock: true,
    highlights: ['Dual Nozzle chuyển đầu phun tức thì', 'Cảm biến AI LiDAR thế hệ 2', 'Buồng sấy nhiệt chủ động 65°C'],
    accentColor: '#1A75FF',
  },
  {
    id: 'bambu-x2d',
    brand: 'Bambu Lab',
    series: 'X2 Series Industrial',
    modelCode: 'X2D',
    name: 'Bambu Lab X2D Carbon CoreXY Combo',
    subtitle: 'Dòng máy CoreXY sợi Carbon thế hệ mới chuyên trị nhựa kỹ thuật PA-CF / PC / ASA',
    buildVolumeMm: '300 × 300 × 300 mm',
    maxSpeedMmS: 600,
    multiColorSupport: 'Kèm AMS 2 Pro sấy chủ động',
    priceVnd: 39900000,
    originalPriceVnd: 42900000,
    refTag: 'new',
    inStock: true,
    highlights: ['Trục dẫn hướng Carbon siêu nhẹ', 'Đầu phun thép tôi 350°C', 'Camera AI phát hiện lỗi Spaghetti'],
    accentColor: '#1E40AF',
  },
  {
    id: 'bambu-p2s',
    brand: 'Bambu Lab',
    series: 'P2 Series All-Rounder',
    modelCode: 'P2S',
    name: 'Bambu Lab P2S Enclosed Combo',
    subtitle: 'Lựa chọn tối ưu hiệu năng/giá thành cho xưởng in 3D chuyên nghiệp & studio thiết kế',
    buildVolumeMm: '256 × 256 × 256 mm',
    maxSpeedMmS: 500,
    multiColorSupport: 'Tương thích AMS 4–16 màu',
    priceVnd: 21500000,
    originalPriceVnd: 23500000,
    inStock: true,
    highlights: ['Buồng in khép kín kèm lọc than hoạt tính', 'Tự động cân bàn & chống rung hoàn toàn', 'Vận hành bền bỉ 24/7'],
    accentColor: '#3FA9F5',
  },
  {
    id: 'bambu-a2l',
    brand: 'Bambu Lab',
    series: 'A2 Large Format',
    modelCode: 'A2L',
    name: 'Bambu Lab A2L Large Volume AMS Lite',
    subtitle: 'Khổ in mở rộng kết hợp cảm biến dòng chảy Eddy Current & vận hành siêu êm',
    buildVolumeMm: '300 × 300 × 320 mm',
    maxSpeedMmS: 500,
    multiColorSupport: 'Kèm AMS Lite 4 màu tốc độ cao',
    priceVnd: 16900000,
    refTag: 'new',
    inStock: true,
    highlights: ['Khổ in lớn 300mm cho mẫu nguyên khối', 'Thay đầu phun 1-Click trong 3 giây', 'Khử ồn động cơ chủ động <45dB'],
    accentColor: '#0284C7',
  },
  {
    id: 'bambu-a1',
    brand: 'Bambu Lab',
    series: 'A1 Series Best-Seller',
    modelCode: 'A1',
    name: 'Bambu Lab A1 Combo (Kèm AMS Lite)',
    subtitle: 'Máy in 3D đa màu quốc dân cho người mới bắt đầu, trường học và Maker sáng tạo',
    buildVolumeMm: '256 × 256 × 256 mm',
    maxSpeedMmS: 500,
    multiColorSupport: 'Kèm sẵn bộ AMS Lite 4 màu',
    priceVnd: 13200000,
    originalPriceVnd: 14500000,
    inStock: true,
    highlights: ['Cắm điện in ngay sau 15 phút lắp đặt', 'Cân chỉnh lưu lượng nhựa tự động', 'Màn hình cảm ứng trực quan'],
    accentColor: '#3FA9F5',
  },

  // 2. FLASHFORGE: Creator 5 Pro
  {
    id: 'flashforge-creator-5-pro',
    brand: 'FLASHFORGE',
    series: 'Creator IDEX Series',
    modelCode: 'Creator 5 Pro',
    name: 'Flashforge Creator 5 Pro IDEX Industrial',
    subtitle: 'Hệ thống 2 đầu đùn độc lập IDEX chuyên in vật liệu tan trong nước & sản xuất nhân bản',
    buildVolumeMm: '300 × 250 × 250 mm',
    maxSpeedMmS: 450,
    multiColorSupport: 'IDEX 2 đầu đùn độc lập (Mirror / Duplicate Mode)',
    priceVnd: 26800000,
    inStock: true,
    highlights: ['Chế độ in song song 2 mẫu cùng lúc', 'Buồng kín giữ nhiệt ổn định cho ABS/ASA', 'Khung thép công nghiệp chống rung'],
    accentColor: '#1E40AF',
  },

  // 3. SNAPMAKER: U1
  {
    id: 'snapmaker-u1',
    brand: 'SNAPMAKER',
    series: 'U-Series Precision',
    modelCode: 'U1',
    name: 'Snapmaker U1 High-Speed Modular 3D Printer',
    subtitle: 'Khung nhôm CNC nguyên khối hàng không kết hợp hệ thống đa đầu công cụ thông minh',
    buildVolumeMm: '280 × 280 × 280 mm',
    maxSpeedMmS: 500,
    multiColorSupport: 'Hỗ trợ mô-đun đa vật liệu & khắc Laser',
    priceVnd: 28900000,
    refTag: 'new',
    inStock: true,
    highlights: ['Độ chính xác cơ khí ±0.05mm', 'Thiết kế nhôm Anodized cao cấp', 'Cân bàn tự động không chạm'],
    accentColor: '#1A75FF',
  },

  // 4. CREALITY: i8 - i7 combo - K3
  {
    id: 'creality-i8',
    brand: 'CREALITY',
    series: 'i-Series Flagship',
    modelCode: 'i8',
    name: 'Creality i8 Pro Multi-Color Station',
    subtitle: 'Tốc độ bứt phá với động cơ Servo bước kín & hệ thống nạp nhựa tự động CFS',
    buildVolumeMm: '300 × 300 × 300 mm',
    maxSpeedMmS: 600,
    multiColorSupport: 'Hỗ trợ tối đa 4 bộ CFS (16 màu)',
    priceVnd: 24500000,
    refTag: 'new',
    inStock: true,
    highlights: ['Động cơ FOC Step-Servo siêu tĩnh', 'Cắt sợi nhựa tự động trên đầu đùn', 'Camera AI kép giám sát từ xa'],
    accentColor: '#1A75FF',
  },
  {
    id: 'creality-i7-combo',
    brand: 'CREALITY',
    series: 'i-Series Multi-Color',
    modelCode: 'i7 combo',
    name: 'Creality i7 Combo (Kèm bộ đa màu CFS)',
    subtitle: 'Trọn bộ máy in đa màu tốc độ cao kèm hộp sấy nhựa thông minh CFS 4 cuộn',
    buildVolumeMm: '260 × 260 × 260 mm',
    maxSpeedMmS: 500,
    multiColorSupport: 'Kèm sẵn bộ CFS 4 màu chống ẩm',
    priceVnd: 14900000,
    inStock: true,
    highlights: ['Nhận diện cuộn nhựa RFID tự động', 'Bàn in PEI dẻo bám dính vượt trội', 'Tự động nối nhựa khi hết cuộn'],
    accentColor: '#3FA9F5',
  },
  {
    id: 'creality-k3',
    brand: 'CREALITY',
    series: 'K-Series CoreXY',
    modelCode: 'K3',
    name: 'Creality K3 High-Speed CoreXY Enclosed',
    subtitle: 'Chiến binh CoreXY khung đúc áp lực nguyên khối, tốc độ 600mm/s cho xưởng in farm',
    buildVolumeMm: '250 × 250 × 250 mm',
    maxSpeedMmS: 600,
    multiColorSupport: 'Nâng cấp mở rộng bộ CFS 4–16 màu',
    priceVnd: 15800000,
    inStock: true,
    highlights: ['Gia tốc 20.000 mm/s² cực nhanh', 'Đầu phun Unicorn Quick-Swap', 'Quạt làm mát kép đối xứng'],
    accentColor: '#0284C7',
  },

  // 5. ELEGOO: Carbon 2 combo
  {
    id: 'elegoo-carbon-2-combo',
    brand: 'ELEGOO',
    series: 'Centauri Carbon Series',
    modelCode: 'Carbon 2 combo',
    name: 'Elegoo Centauri Carbon 2 Combo',
    subtitle: 'Máy in CoreXY buồng kín chuyên nhựa sợi Carbon kèm trạm nạp đa màu tự động',
    buildVolumeMm: '256 × 256 × 256 mm',
    maxSpeedMmS: 500,
    multiColorSupport: 'Kèm trạm đa màu 4 cuộn thông minh',
    priceVnd: 15500000,
    refTag: 'new',
    inStock: true,
    highlights: ['Khung nhôm đúc nguyên khối siêu cứng', 'Đầu phun thép tôi sẵn sàng in Carbon', 'Hai mặt bàn in PEI nhám & mịn'],
    accentColor: '#1E40AF',
  },
];

// DANH MỤC NHỰA IN 3D THEO ĐÚNG CÂY THƯ MỤC KHÁCH HÀNG (TRANG 2)
export const LAYMOR_FILAMENT_BRANDS: Array<{
  id: string;
  name: 'Bambu Lab' | 'Creality' | 'LAYMOR';
  refTag?: RefTagType;
  tagline: string;
}> = [
  {
    id: 'bambu-filament',
    name: 'Bambu Lab',
    tagline: 'Cuộn nhựa chính hãng tích hợp chip RFID tự động cấu hình thông số trên AMS',
  },
  {
    id: 'creality-filament',
    name: 'Creality',
    tagline: 'Dòng nhựa Hyper Series tối ưu hóa lưu lượng chảy cho tốc độ in 600mm/s',
  },
  {
    id: 'laymor-filament',
    name: 'LAYMOR',
    refTag: 'coming_soon',
    tagline: 'Dòng nhựa thương hiệu riêng LAYMOR phát triển chuyên biệt cho khí hậu Việt Nam',
  },
];

export const LAYMOR_FILAMENTS_CATALOG: ILaymorFilamentProduct[] = [
  {
    id: 'fil-bambu-pla-matte',
    brand: 'Bambu Lab',
    name: 'Bambu Lab PLA Matte (Kèm Spool & Chip RFID)',
    materialType: 'PLA',
    colorName: 'Ice Blue / Charcoal / Ivory White',
    colorHex: '#3FA9F5',
    weightKg: 1.0,
    diameterMm: 1.75,
    priceVnd: 520000,
    inStock: true,
    compatiblePrinters: ['A1', 'A2L', 'H2D', 'X2D', 'P2S', 'Creator 5 Pro', 'U1', 'i8', 'i7 combo', 'K3', 'Carbon 2 combo'],
    nozzleTemp: '190 – 230 °C',
    bedTemp: '35 – 45 °C',
    highlights: ['Tích hợp chip RFID tự nhận màu trên AMS', 'Bề mặt lì mịn che vân lớp hoàn hảo', 'Dễ bóc Tree Support'],
  },
  {
    id: 'fil-bambu-petg-hf',
    brand: 'Bambu Lab',
    name: 'Bambu Lab PETG HF (High Flow Tốc Độ Cao)',
    materialType: 'PETG',
    colorName: 'Navy Blue / Black / Transparent',
    colorHex: '#1E40AF',
    weightKg: 1.0,
    diameterMm: 1.75,
    priceVnd: 540000,
    inStock: true,
    compatiblePrinters: ['A1', 'A2L', 'H2D', 'X2D', 'P2S', 'K3', 'Carbon 2 combo'],
    nozzleTemp: '230 – 260 °C',
    bedTemp: '65 – 75 °C',
    highlights: ['Tốc độ in gấp đôi PETG thường', 'Hạn chế tối đa kéo tơ (Stringing)', 'Chịu thời tiết & va đập cơ học'],
  },
  {
    id: 'fil-bambu-paht-cf',
    brand: 'Bambu Lab',
    name: 'Bambu Lab PAHT-CF (Nylon Sợi Carbon Chịu Nhiệt)',
    materialType: 'CF/Engineering',
    colorName: 'Carbon Matte Black',
    colorHex: '#0F172A',
    weightKg: 1.0,
    diameterMm: 1.75,
    priceVnd: 1850000,
    inStock: true,
    compatiblePrinters: ['H2D', 'X2D', 'P2S', 'Creator 5 Pro', 'Carbon 2 combo'],
    nozzleTemp: '260 – 290 °C',
    bedTemp: '80 – 100 °C',
    highlights: ['Chịu nhiệt độ tới 194°C không biến dạng', 'Hấp thụ ẩm thấp hơn 50% so với PA6', 'Độ cứng cơ khí thay thế nhôm nhẹ'],
  },
  {
    id: 'fil-creality-hyper-pla',
    brand: 'Creality',
    name: 'Creality Hyper Series PLA 600mm/s',
    materialType: 'PLA',
    colorName: 'Sky Cyan / Pure White / Space Grey',
    colorHex: '#0284C7',
    weightKg: 1.0,
    diameterMm: 1.75,
    priceVnd: 390000,
    inStock: true,
    compatiblePrinters: ['i8', 'i7 combo', 'K3', 'A1', 'A2L', 'P2S', 'U1', 'Carbon 2 combo'],
    nozzleTemp: '190 – 230 °C',
    bedTemp: '45 – 60 °C',
    highlights: ['Lưu lượng chảy cao gấp 5 lần PLA truyền thống', 'Độ bền kéo vượt trội hơn ABS', 'Cuộn quấn máy gọn 100% không rối'],
  },
  {
    id: 'fil-creality-cr-silk',
    brand: 'Creality',
    name: 'Creality CR-Silk Dual Color (Nhựa Lụa Đổi Màu)',
    materialType: 'Silk',
    colorName: 'Royal Blue & Ice Cyan',
    colorHex: '#1A75FF',
    weightKg: 1.0,
    diameterMm: 1.75,
    priceVnd: 460000,
    inStock: true,
    compatiblePrinters: ['A1', 'A2L', 'H2D', 'X2D', 'P2S', 'i8', 'i7 combo', 'K3'],
    nozzleTemp: '200 – 225 °C',
    bedTemp: '50 – 60 °C',
    highlights: ['Hiệu ứng ánh kim 2 màu chuyển sắc theo góc nhìn', 'Lý tưởng cho in rồng khớp, tượng decor & quà tặng'],
  },
  {
    id: 'fil-laymor-pro-pla',
    brand: 'LAYMOR',
    name: 'LAYMOR PRO PLA+ Studio Edition',
    materialType: 'PLA',
    colorName: 'LAYMOR Signature Blue',
    colorHex: '#1A75FF',
    weightKg: 1.0,
    diameterMm: 1.75,
    priceVnd: 350000,
    refTag: 'coming_soon',
    inStock: false,
    compatiblePrinters: ['A1', 'A2L', 'H2D', 'X2D', 'P2S', 'Creator 5 Pro', 'U1', 'i8', 'i7 combo', 'K3', 'Carbon 2 combo'],
    nozzleTemp: '195 – 225 °C',
    bedTemp: '45 – 60 °C',
    highlights: ['Công thức chống ẩm nhiệt đới hóa độc quyền LAYMOR', 'Đã nạp sẵn Profile chuẩn cho Bambu Studio & OrcaSlicer'],
  },
  {
    id: 'fil-laymor-petg-pro',
    brand: 'LAYMOR',
    name: 'LAYMOR High-Speed PETG Matte',
    materialType: 'PETG',
    colorName: 'Deep Navy / Frost White',
    colorHex: '#1E3A8A',
    weightKg: 1.0,
    diameterMm: 1.75,
    priceVnd: 380000,
    refTag: 'coming_soon',
    inStock: false,
    compatiblePrinters: ['A1', 'A2L', 'H2D', 'X2D', 'P2S', 'i8', 'i7 combo', 'K3', 'Carbon 2 combo'],
    nozzleTemp: '230 – 255 °C',
    bedTemp: '65 – 75 °C',
    highlights: ['Bề mặt PETG nhám mờ không bóng dầu', 'Độ bám tầng Z siêu bền cho chi tiết chịu tải'],
  },
];

// DANH MỤC LINH KIỆN THEO GIAO DIỆN BAMBU STORE (TRANG 2 & TRANG 4)
export const LAYMOR_ACCESSORIES_CATALOG: ILaymorAccessoryProduct[] = [
  {
    id: 'acc-purifier-filter',
    name: 'Bộ Lọc Không Khí Than Hoạt Tính & HEPA H2D / X2D',
    brand: 'Bambu Lab',
    accessoryType: 'Air & Filtration',
    compatibleModels: ['H2D', 'X2D', 'P2S'],
    priceVnd: 1250000,
    etaBadge: 'Coming soon',
    refTag: 'coming_soon',
    description: 'Bộ lọc khí VOC và hạt siêu mịn chuyên dụng cho buồng in kín khi in nhựa ABS, ASA, PA-CF.',
  },
  {
    id: 'acc-bambu-station',
    name: 'Trạm Lưu Trữ & Sấy Cuộn Nhựa Đa Năng AMS Station L',
    brand: 'Bambu Lab',
    accessoryType: 'Upgrade Parts',
    compatibleModels: ['H2D', 'X2D', 'P2S', 'A2L', 'A1'],
    priceVnd: 5990000,
    etaBadge: 'Coming soon',
    refTag: 'coming_soon',
    description: 'Tủ bảo quản kiểm soát độ ẩm tự động và kệ đặt máy in đồng bộ chuẩn xưởng Bambu Lab.',
  },
  {
    id: 'acc-ptfe-connector',
    name: 'Đầu Chia Ống Dẫn Nhựa PTFE 4-in-1 Hub Chính Hãng',
    brand: 'Bambu Lab',
    accessoryType: 'Upgrade Parts',
    compatibleModels: ['H2D', 'X2D', 'P2S', 'A2L', 'A1'],
    priceVnd: 185000,
    etaBadge: 'Coming soon',
    refTag: 'coming_soon',
    description: 'Cụm chia đường ống PTFE ma sát thấp giúp chuyển đổi mượt mà giữa bộ AMS và cuộn nhựa rời.',
  },
  {
    id: 'acc-hotend-hardened',
    name: 'Cụm Đầu Phun Thép Tôi Nguyên Khối 0.4mm / 0.6mm',
    brand: 'Bambu Lab',
    accessoryType: 'Hotend',
    compatibleModels: ['A1', 'A2L', 'H2D', 'X2D', 'P2S'],
    priceVnd: 890000,
    etaBadge: 'Coming soon',
    refTag: 'coming_soon',
    description: 'Đầu phun thép cứng chống mài mòn khi in nhựa sợi Carbon (PLA-CF, PETG-CF, PAHT-CF) và nhựa dạ quang.',
  },
  {
    id: 'acc-pei-dual-plate',
    name: 'Tấm Bàn In Từ Tính Dual-Texture PEI & Smooth 3D Effect',
    brand: 'LAYMOR',
    accessoryType: 'Build Plate',
    compatibleModels: ['A1', 'A2L', 'H2D', 'X2D', 'P2S', 'K3', 'Carbon 2 combo'],
    priceVnd: 650000,
    etaBadge: 'Coming soon',
    refTag: 'coming_soon',
    description: 'Bàn in 2 mặt: một mặt nhám vàng Textured PEI siêu bám và một mặt tạo vân Carbon/Hologram đáy mẫu.',
  },
  {
    id: 'acc-creality-unicorn',
    name: 'Bộ Đầu Phun Quick-Swap Unicorn Bi-Metal K3 / i8 / i7',
    brand: 'CREALITY',
    accessoryType: 'Hotend',
    compatibleModels: ['i8', 'i7 combo', 'K3'],
    priceVnd: 750000,
    etaBadge: 'Coming soon',
    refTag: 'coming_soon',
    description: 'Cụm cổ nhiệt hợp kim Titan kết hợp đầu phun đồng mạ hợp kim cứng tháo lắp nhanh.',
  },
];
