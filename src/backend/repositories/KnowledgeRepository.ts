import fs from 'fs';
import path from 'path';
import {
  IKnowledgeEntry,
  ICrossReferenceResult,
  IRiskWarning,
  ISlicerParameterOverride,
} from '../domain/knowledge';
import { supabaseCloudService } from '../db/supabaseClient';

export const SEED_KNOWLEDGE_ENTRIES: IKnowledgeEntry[] = [
  {
    id: 'kn-sim-heat-creep-pla',
    title: 'Tắc đầu phun do Heat Creep khi in PLA đóng kín buồng nhiệt và Retraction dài',
    category: 'simulator_defect_learning',
    defectType: 'clogging',
    severity: 'critical',
    problemSymptom: 'Đang in khoảng 30-45 phút thì nhựa ngừng đùn hoàn toàn (in không khí), bánh răng Extruder kêu lạch cạch và cào khuyết sợi nhựa.',
    rootCause: 'Nhựa PLA có nhiệt độ chuyển thủy tinh thấp (Tg ~ 55-60°C). Khi đóng kín cửa máy hoặc rút nhựa (Retraction) > 1.5mm trên đầu Direct Drive, nhựa nóng bị kéo ngược lên vùng tản nhiệt (Cold Zone), nở phồng và kẹt cứng trong cổ họng.',
    solutionText: 'Giảm Retraction Length xuống 0.6 - 0.8mm, hạ nhiệt bàn in PLA xuống 55°C, bật quạt buồng / mở hé nắp kính trên của máy Bambu Lab X1C/P1S khi in PLA.',
    slicerOverrides: {
      retraction_length: 0.8,
      hot_plate_temp: 55,
      nozzle_temperature: 220,
    },
    triggerCondition: {
      paramKey: 'retractionDistanceMm',
      operator: '>',
      thresholdValue: 1.4,
      description: 'Retraction > 1.4mm trên đầu Direct Drive với nhựa PLA',
    },
    autoFixPatch: {
      retractionDistanceMm: 0.8,
      bedTemp: 55,
      nozzleTemp: 220,
    },
    submittedBy: 'hlcai_admin',
    applicablePrinters: ['all'],
    applicableFilaments: ['PLA', 'PLA-CF'],
    confidenceScore: 99,
    verificationCount: 412,
    sourcePlatform: 'expert_curated',
    sourceReference: 'Bambu Lab Direct-Drive Extruder Thermal Analysis',
    tags: ['heat_creep', 'tac_dau_in', 'clogging', 'retraction', 'pla'],
    createdAt: '2026-10-10T00:00:00.000Z',
    updatedAt: '2026-10-20T00:00:00.000Z',
    isVerified: true,
  },
  {
    id: 'kn-sim-ringing-ghosting',
    title: 'Sóng âm bề mặt (Ringing / Ghosting) và trượt bước (Layer Shift) khi gia tốc vách ngoài quá cao',
    category: 'simulator_defect_learning',
    defectType: 'ringing',
    severity: 'high',
    problemSymptom: 'Bề mặt quanh các góc vuông hoặc chữ khắc nổi xuất hiện các gợn sóng lặp lại như bóng ma (Ghosting), hoặc các lớp trên bị lệch hẳn sang một bên.',
    rootCause: 'Khi tốc độ vách ngoài (Outer Wall Speed > 220mm/s) hoặc gia tốc vách ngoài (> 8000 mm/s²) vượt ngưỡng giảm chấn Input Shaping của khung máy, dao động cơ học dư thừa in hằn lên lớp nhựa.',
    solutionText: 'Giảm tốc độ vách ngoài (Outer Wall Speed) xuống 120 - 150 mm/s và gia tốc vách ngoài xuống 5000 mm/s² để bề mặt láng bóng như đúc khuôn.',
    slicerOverrides: {
      outer_wall_speed: 120,
    },
    triggerCondition: {
      paramKey: 'outerWallSpeed',
      operator: '>',
      thresholdValue: 200,
      description: 'Tốc độ vách ngoài > 200 mm/s gây rung chấn bề mặt',
    },
    autoFixPatch: {
      outerWallSpeed: 120,
      outerWallAcceleration: 5000,
      printSpeed: 220,
    },
    submittedBy: 'hlcai_admin',
    applicablePrinters: ['all'],
    applicableFilaments: ['PLA', 'PETG', 'ABS', 'ASA'],
    confidenceScore: 98,
    verificationCount: 365,
    sourcePlatform: 'expert_curated',
    sourceReference: 'Klipper & Bambu Input Shaping Resonance Benchmark',
    tags: ['ringing', 'ghosting', 'layer_shift', 'outer_wall_speed', 'gia_toc'],
    createdAt: '2026-10-11T00:00:00.000Z',
    updatedAt: '2026-10-20T00:00:00.000Z',
    isVerified: true,
  },
  {
    id: 'kn-sim-delamination-abs',
    title: 'Tách lớp ngang (Layer Delamination) khi in nhựa kỹ thuật ABS/ASA bật quạt làm mát quá mạnh',
    category: 'simulator_defect_learning',
    defectType: 'delamination',
    severity: 'critical',
    problemSymptom: 'Thân sản phẩm xuất hiện các vết nứt toác nằm ngang giữa các lớp in, bẻ nhẹ bị tách rời theo thớ lớp.',
    rootCause: 'Nhựa ABS/ASA có độ co ngót nhiệt lớn. Khi quạt làm mát chi tiết (Part Cooling Fan) thổi mạnh (> 40%), lớp nhựa vừa đùn ra nguội đột ngột trước khi kịp khuếch tán phân tử vào lớp dưới, tạo ứng suất kéo làm nứt toác liên kết tầng.',
    solutionText: 'Hạ quạt làm mát (Cooling Fan) xuống 15-25% khi in ABS/ASA, nâng nhiệt đầu phun lên 260°C và nhiệt bàn in lên 95-100°C để giữ nhiệt buồng in.',
    slicerOverrides: {
      fan_max_speed: 20,
      nozzle_temperature: 260,
      hot_plate_temp: 100,
    },
    triggerCondition: {
      paramKey: 'coolingFanSpeed',
      operator: '>',
      thresholdValue: 45,
      description: 'Quạt làm mát > 45% khi in ABS/ASA gây nứt tách lớp',
    },
    autoFixPatch: {
      coolingFanSpeed: 20,
      nozzleTemp: 260,
      bedTemp: 100,
    },
    submittedBy: 'hlcai_admin',
    applicablePrinters: ['all'],
    applicableFilaments: ['ABS', 'ASA'],
    confidenceScore: 99,
    verificationCount: 290,
    sourcePlatform: 'expert_curated',
    sourceReference: 'Polymer Inter-Layer Diffusion & Thermal Shrinkage Study',
    tags: ['delamination', 'tach_lop', 'abs', 'cooling_fan'],
    createdAt: '2026-10-12T00:00:00.000Z',
    updatedAt: '2026-10-20T00:00:00.000Z',
    isVerified: true,
  },
  {
    id: 'kn-vn-humidity-petg',
    title: 'Xử lý ẩm nhựa PETG & TPU trong mùa nồm ẩm Việt Nam (85-95%)',
    category: 'vietnam_environment',
    defectType: 'moisture_bubbling',
    severity: 'high',
    problemSymptom: 'Nhựa đùn ra có tiếng nổ lách tách li ti, bề mặt rỗ bọt khí và tưa sợi kéo màng (stringing) rất nặng.',
    rootCause: 'Khí hậu nồm ẩm Việt Nam khiến nhựa PETG và TPU no nước chỉ sau 48h để ngoài không khí. Nước bị đun sôi ở 240°C trong vòi phun tạo bọt khí giãn nở tức thì.',
    solutionText: 'Sấy nhựa ở 65°C trong ít nhất 6 giờ bằng hộp sấy chuyên dụng. Trong Slicer, chỉnh Retraction = 1.0mm và giảm nhiệt đầu phun PETG xuống 240-245°C.',
    slicerOverrides: {
      drying_temperature: 65,
      drying_time_hours: 6,
      retraction_length: 1.0,
    },
    autoFixPatch: {
      retractionDistanceMm: 1.0,
      nozzleTemp: 242,
    },
    submittedBy: 'hlcai_admin',
    applicablePrinters: ['all'],
    applicableFilaments: ['PETG', 'PETG-CF', 'TPU', 'PA-CF'],
    confidenceScore: 98,
    verificationCount: 245,
    sourcePlatform: 'vietnam_community',
    sourceReference: 'Cộng đồng In 3D Việt Nam & Kinh nghiệm xưởng in nhiệt đới',
    tags: ['do_am_viet_nam', 'say_nhua', 'petg_no_bot', 'stringing'],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
    isVerified: true,
  },
  {
    id: 'kn-pei-bed-cleaning',
    title: 'Khôi phục độ dính bàn in PEI bằng nước ấm và Sunlight chống bong lớp 1',
    category: 'vietnam_environment',
    defectType: 'first_layer',
    severity: 'high',
    problemSymptom: 'Lớp in đầu tiên bị bong mép (warping) hoặc cuốn vào đầu phun dù đã chỉnh Z-offset chuẩn.',
    rootCause: 'Mồ hôi và dầu mỡ từ vân tay bám lên bề mặt PEI. Cồn Isopropyl Alcohol (IPA) chỉ hòa tan dầu mỡ và dàn đều ra chứ không rửa trôi hoàn toàn lớp nhờn.',
    solutionText: 'Tháo tấm PEI rửa trực tiếp dưới vòi nước ấm với nước rửa chén Sunlight. Trong Slicer, đặt độ dày lớp 1 (First Layer Height) = 0.24mm và bật Brim 5mm.',
    autoFixPatch: {
      firstLayerHeight: 0.24,
      brimEnabled: true,
      brimWidthMm: 5,
    },
    submittedBy: 'hlcai_admin',
    applicablePrinters: ['all'],
    applicableFilaments: ['PLA', 'PETG', 'ABS', 'TPU'],
    confidenceScore: 99,
    verificationCount: 420,
    sourcePlatform: 'vietnam_community',
    sourceReference: 'Bambu Lab User Group & Prusa Research Service Bulletin',
    tags: ['ban_in_pei', 've_sinh_sunlight', 'bong_mep', 'adhesion'],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
    isVerified: true,
  },
  {
    id: 'kn-scarf-joint-seam',
    title: 'Giấu 90% vết nối viền ngoài Z-Seam bằng Aligned / Scarf Seam & Pressure Advance',
    category: 'slicer_tuning',
    defectType: 'z_seam_scarring',
    severity: 'medium',
    problemSymptom: 'Mặt ngoài của chi tiết tròn, trụ hoặc figure có đường sọc nổi cộm hoặc mụn nhựa (Z-seam blobs) gây mất thẩm mỹ.',
    rootCause: 'Điểm bắt đầu và kết thúc của một vòng viền ngoài tạo ra mối hàn nhựa thừa do áp lực buồng nóng chưa kịp giải phóng khi đổi lớp (thiếu Pressure Advance hoặc để Random Seam).',
    solutionText: 'Chuyển Seam Position sang "Aligned" hoặc "Back" để gom đường nối vào góc khuất, đồng thời tinh chỉnh hệ số Pressure Advance = 0.02 - 0.04.',
    slicerOverrides: {
      seam_slope_type: 'scarf',
      seam_slope_angle: 45,
      outer_wall_speed: 60,
    },
    autoFixPatch: {
      seamPosition: 'aligned',
      pressureAdvance: 0.025,
      retractionDistanceMm: 0.8,
    },
    submittedBy: 'hlcai_admin',
    applicablePrinters: ['all'],
    applicableFilaments: ['PLA', 'PETG', 'ABS'],
    applicableCategories: ['Art & Decor', 'Toys & Games', 'Household'],
    confidenceScore: 97,
    verificationCount: 310,
    sourcePlatform: 'bambu_forum',
    sourceReference: 'OrcaSlicer v2.x Algorithmic Seam Whitepaper',
    tags: ['scarf_seam', 'z_seam', 'orcaslicer', 'tham_my'],
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
    isVerified: true,
  },
  {
    id: 'kn-tree-support-interface',
    title: 'Tree Support Organic với Top Z-Distance 0.20mm gỡ êm tay không bị dính cứng',
    category: 'slicer_tuning',
    defectType: 'support_fusion',
    severity: 'high',
    problemSymptom: 'Support dính quá chặt vào mô hình (Support Fusion), khi bóc tách để lại chân nhựa lởm chởm hoặc làm gãy chi tiết nhỏ.',
    rootCause: 'Khoảng cách giữa đỉnh support và đáy mô hình (Support Top Z-Distance) quá nhỏ (<0.14mm) khiến nhựa nóng chảy hàn chết vào bề mặt mẫu in.',
    solutionText: 'Chuyển sang Tree Support Organic, đặt Support Top Z-Distance = 0.20mm (bằng 1 lớp in) và bật 2-3 Support Interface Layers.',
    slicerOverrides: {
      enable_support: true,
      support_type: 'tree(auto)',
      support_top_z_distance: 0.2,
    },
    triggerCondition: {
      paramKey: 'supportTopZDistance',
      operator: '<',
      thresholdValue: 0.14,
      description: 'Khoảng cách Top Z-Distance < 0.14mm gây dính chết Support vào mẫu',
    },
    autoFixPatch: {
      supportMode: 'tree',
      treeStyle: 'organic',
      supportTopZDistance: 0.2,
      supportInterfaceLayers: 2,
    },
    submittedBy: 'hlcai_admin',
    applicablePrinters: ['all'],
    applicableFilaments: ['PLA', 'PETG', 'ABS'],
    applicableCategories: ['Art & Decor', 'Toys & Games'],
    confidenceScore: 98,
    verificationCount: 380,
    sourcePlatform: 'printables',
    sourceReference: 'PrusaSlicer & Bambu Studio Organic Support Best Practices',
    tags: ['tree_support', 'organic_support', 'khong_de_lai_seo', 'figure'],
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
    isVerified: true,
  },
  {
    id: 'kn-mechanical-wall-priority',
    title: 'Tăng Wall Loops lên 3-4 lớp và Top Shell >= 4 lớp để chống phồng nóc (Pillowing) & tăng độ bền',
    category: 'commercial_practice',
    defectType: 'pillowing',
    severity: 'medium',
    problemSymptom: 'Mặt trên cùng bị lồi lõm lỗ chỗ (Pillowing) hoặc vách mỏng lộ đường gân ruột bên trong (Infill Ghosting).',
    rootCause: 'Số vòng tường (Wall Loops < 2) hoặc số lớp nóc (Top Shell Layers < 3) kết hợp với mật độ Infill thưa khiến nhựa lớp nóc bị sụp xuống các ô trống của Infill.',
    solutionText: 'Thiết lập tối thiểu 3-4 Wall Loops, 4-5 Top Shell Layers và giữ Infill >= 15% mẫu Gyroid.',
    slicerOverrides: {
      wall_loops: 3,
      top_shell_layers: 4,
      sparse_infill_density: '15%',
      sparse_infill_pattern: 'gyroid',
    },
    autoFixPatch: {
      wallLoops: 3,
      topShellLayers: 4,
      infillDensity: 15,
      infillType: 'gyroid',
    },
    submittedBy: 'hlcai_admin',
    applicablePrinters: ['all'],
    applicableFilaments: ['PLA', 'PETG', 'ABS', 'PLA-CF'],
    confidenceScore: 99,
    verificationCount: 460,
    sourcePlatform: 'cnc_kitchen',
    sourceReference: 'CNC Kitchen: More Walls vs More Infill Mechanical Strength Benchmarks',
    tags: ['wall_loops', 'infill', 'pillowing', 'top_shell'],
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
    isVerified: true,
  },
  {
    id: 'kn-cross-hatch-highspeed',
    title: 'Tránh dùng mẫu ruột Grid ở tốc độ >200mm/s để chống cọ quẹt đầu phun gây đổ mẫu (Knock-Over)',
    category: 'slicer_tuning',
    defectType: 'knock_over',
    severity: 'high',
    problemSymptom: 'Máy in tốc độ cao phát ra tiếng cọ "cục cục" khi đi qua ruột và có nguy cơ hất văng mẫu in cao mảnh khỏi bàn nhiệt.',
    rootCause: 'Mẫu Grid infill có các đường nhựa cắt chéo qua nhau trên cùng một lớp, làm tích tụ điểm gồ. Ở tốc độ cao, đầu phun tông trực tiếp vào các điểm gồ này.',
    solutionText: 'Chuyển sang mẫu ruột Gyroid hoặc Honeycomb, bật Z-Hop = 0.4mm và bật Brim nếu mẫu cao.',
    slicerOverrides: {
      sparse_infill_pattern: 'gyroid',
    },
    autoFixPatch: {
      infillType: 'gyroid',
      zHopMm: 0.4,
      brimEnabled: true,
      brimWidthMm: 5,
    },
    submittedBy: 'hlcai_admin',
    applicablePrinters: ['all'],
    applicableFilaments: ['all'],
    confidenceScore: 99,
    verificationCount: 510,
    sourcePlatform: 'bambu_forum',
    sourceReference: 'Bambu Lab High-Speed Infill Collision Prevention Guide',
    tags: ['gyroid', 'grid_collision', 'knock_over', 'z_hop'],
    createdAt: '2026-10-05T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
    isVerified: true,
  },
];

class KnowledgeRepository {
  private entries: IKnowledgeEntry[] = [];
  private filePath: string;
  private hydratedFromCloud = false;

  constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'knowledge_base.json');
    this.loadFromDisk();
    this.hydrateFromSupabase();
  }

  private hydrateFromSupabase(): void {
    if (this.hydratedFromCloud) return;
    this.hydratedFromCloud = true;
    supabaseCloudService
      .loadKvState<{ entries?: IKnowledgeEntry[] }>('laymor_knowledge_state')
      .then((saved) => {
        if (saved?.entries && Array.isArray(saved.entries) && saved.entries.length > 0) {
          // Merge seed entries with cloud entries so no seed rule is lost
          const map = new Map<string, IKnowledgeEntry>();
          for (const s of SEED_KNOWLEDGE_ENTRIES) map.set(s.id, s);
          for (const c of saved.entries) map.set(c.id, c);
          this.entries = Array.from(map.values());
        }
      })
      .catch(() => {});
  }

  private persistToSupabase(): void {
    supabaseCloudService
      .saveKvState('laymor_knowledge_state', {
        entries: this.entries,
        updatedAt: new Date().toISOString(),
      })
      .catch(() => {});
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, IKnowledgeEntry>();
          for (const s of SEED_KNOWLEDGE_ENTRIES) map.set(s.id, s);
          for (const d of parsed) map.set(d.id, d);
          this.entries = Array.from(map.values());
          return;
        }
      }
    } catch (e: any) {
      console.warn('[KnowledgeRepository] Khởi tạo bộ chuẩn:', e.message);
    }

    this.entries = [...SEED_KNOWLEDGE_ENTRIES];
    this.saveToDisk();
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.entries, null, 2), 'utf-8');
    } catch {
      // Ignore read-only filesystem on Vercel serverless
    }
    this.persistToSupabase();
  }

  getAllEntries(): IKnowledgeEntry[] {
    return [...this.entries];
  }

  getEntryById(id: string): IKnowledgeEntry | undefined {
    return this.entries.find((k) => k.id === id);
  }

  searchEntries(query?: string, category?: string, filament?: string, printerId?: string): IKnowledgeEntry[] {
    let result = [...this.entries];

    if (category && category !== 'all') {
      result = result.filter((k) => k.category === category);
    }

    if (filament && filament !== 'all') {
      const filLower = filament.toLowerCase();
      result = result.filter(
        (k) =>
          k.applicableFilaments.includes('all') ||
          k.applicableFilaments.some((f) => f.toLowerCase().includes(filLower) || filLower.includes(f.toLowerCase()))
      );
    }

    if (printerId && printerId !== 'all') {
      result = result.filter(
        (k) => k.applicablePrinters.includes('all') || k.applicablePrinters.includes(printerId)
      );
    }

    if (query && query.trim().length > 0) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (k) =>
          k.title.toLowerCase().includes(q) ||
          k.solutionText.toLowerCase().includes(q) ||
          (k.problemSymptom && k.problemSymptom.toLowerCase().includes(q)) ||
          (k.rootCause && k.rootCause.toLowerCase().includes(q)) ||
          (k.defectType && k.defectType.toLowerCase().includes(q)) ||
          k.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  crossReference(
    modelTitle: string = '',
    category: string = '',
    filamentType: string = 'PLA',
    printerId: string = 'bambu-x1c-p1s'
  ): ICrossReferenceResult {
    const matchedEntries: IKnowledgeEntry[] = [];
    const riskWarnings: IRiskWarning[] = [];
    const recommendedOverrides: ISlicerParameterOverride = {};
    const communityTips: string[] = [];

    const filLower = filamentType.toLowerCase();
    const catLower = category.toLowerCase();
    const titleLower = modelTitle.toLowerCase();

    for (const entry of this.entries) {
      if (!entry.isVerified) continue;

      const filamentMatch =
        entry.applicableFilaments.includes('all') ||
        entry.applicableFilaments.some((f) => filLower.includes(f.toLowerCase()) || f.toLowerCase().includes(filLower));

      const printerMatch =
        entry.applicablePrinters.includes('all') || entry.applicablePrinters.includes(printerId);

      const categoryMatch =
        !entry.applicableCategories ||
        entry.applicableCategories.length === 0 ||
        entry.applicableCategories.some((c) => catLower.includes(c.toLowerCase()) || titleLower.includes(c.toLowerCase()));

      if (filamentMatch && printerMatch && categoryMatch) {
        matchedEntries.push(entry);
        communityTips.push(entry.solutionText);
        if (entry.slicerOverrides) {
          Object.assign(recommendedOverrides, entry.slicerOverrides);
        }
        if (entry.severity === 'critical' || entry.severity === 'high') {
          riskWarnings.push({
            severity: entry.severity === 'critical' ? 'high' : 'medium',
            title: entry.title,
            description: entry.problemSymptom || entry.rootCause || '',
            suggestedFix: entry.solutionText,
          });
        }
      }
    }

    const avgConfidence =
      matchedEntries.length > 0
        ? Math.round(matchedEntries.reduce((sum, e) => sum + e.confidenceScore, 0) / matchedEntries.length)
        : 92;

    return {
      matchedEntries,
      riskWarnings,
      recommendedOverrides,
      communityTips: Array.from(new Set(communityTips)),
      confidenceIndex: avgConfidence,
      totalCrossCheckedRules: this.entries.length,
    };
  }

  upsertEntry(entry: Partial<IKnowledgeEntry> & { title: string; solutionText: string }): IKnowledgeEntry {
    const existingIndex = entry.id ? this.entries.findIndex((k) => k.id === entry.id) : -1;
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = this.entries[existingIndex];
      const updated: IKnowledgeEntry = {
        ...existing,
        ...entry,
        id: existing.id,
        updatedAt: now,
      };
      this.entries[existingIndex] = updated;
      this.saveToDisk();
      return updated;
    }

    const newId = entry.id || `kn-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newEntry: IKnowledgeEntry = {
      id: newId,
      title: entry.title,
      category: entry.category || 'simulator_defect_learning',
      defectType: entry.defectType || 'custom_defect',
      severity: entry.severity || 'medium',
      problemSymptom: entry.problemSymptom,
      rootCause: entry.rootCause,
      solutionText: entry.solutionText,
      slicerOverrides: entry.slicerOverrides,
      triggerCondition: entry.triggerCondition,
      autoFixPatch: entry.autoFixPatch,
      submittedBy: entry.submittedBy || 'maker_user',
      applicablePrinters: entry.applicablePrinters || ['all'],
      applicableFilaments: entry.applicableFilaments || ['PLA', 'PETG'],
      applicableCategories: entry.applicableCategories,
      confidenceScore: entry.confidenceScore ?? 92,
      verificationCount: entry.verificationCount ?? 1,
      sourcePlatform: entry.sourcePlatform || 'user_contributed',
      sourceReference: entry.sourceReference,
      tags: entry.tags || ['defect_learning', '3dsim'],
      createdAt: now,
      updatedAt: now,
      isVerified: entry.isVerified ?? true,
    };

    this.entries.unshift(newEntry);
    this.saveToDisk();
    return newEntry;
  }

  deleteEntry(id: string): boolean {
    const initialLen = this.entries.length;
    this.entries = this.entries.filter((k) => k.id !== id);
    if (this.entries.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }
}

export const knowledgeRepository = new KnowledgeRepository();
