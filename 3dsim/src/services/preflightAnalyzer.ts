import * as THREE from 'three';
import {
  ISimulationProfile,
  IPreflightReport,
  IPreflightError,
  DefectCategoryType,
} from '@/types/simulator';
import { ISlicingMetrics } from './slicingEngine';

export interface ICustomDefectKnowledgeRule {
  id: string;
  title: string;
  category: string;
  defectType?: DefectCategoryType;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  triggerCondition?: string;
  content: string;
  tags: string[];
  autoFixPatch?: Partial<ISimulationProfile>;
  submittedBy?: string;
  isVerified: boolean;
  updatedAt: string;
}

// Bộ nhớ đệm lưu các quy tắc lỗi học từ Người dùng & Admin Database (/api/knowledge)
let cachedLearnedRules: ICustomDefectKnowledgeRule[] = [];

export function setLearnedDefectRules(rules: ICustomDefectKnowledgeRule[]) {
  cachedLearnedRules = Array.isArray(rules) ? rules : [];
}

export function getLearnedDefectRules(): ICustomDefectKnowledgeRule[] {
  return cachedLearnedRules;
}

export async function fetchLearnedDefectRulesFromDB(): Promise<ICustomDefectKnowledgeRule[]> {
  try {
    const res = await fetch('/api/knowledge?category=simulator_defect_learning');
    if (!res.ok) return cachedLearnedRules;
    const data = await res.json();
    if (data && Array.isArray(data.items)) {
      cachedLearnedRules = data.items;
    }
    return cachedLearnedRules;
  } catch {
    return cachedLearnedRules;
  }
}

export function runPreflightInspection(
  geometry: THREE.BufferGeometry,
  profile: ISimulationProfile,
  metrics: ISlicingMetrics,
  externalRules?: ICustomDefectKnowledgeRule[]
): IPreflightReport {
  const errors: IPreflightError[] = [];
  let score = 100;

  const [dimX, dimY, dimZ] = metrics.boundingBox.dimensions;
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');

  let steepOverhangFaceCount = 0;
  let flatBridgeFaceCount = 0;
  let totalFaceCount = 0;

  const thresholdDeg = profile.supportAngleThreshold || 45;
  const thresholdNy = -Math.cos((thresholdDeg * Math.PI) / 180);

  if (positions && normals) {
    const vertexCount = positions.count;
    totalFaceCount = Math.floor(vertexCount / 3);

    for (let i = 0; i < vertexCount; i += 3) {
      const ny = (normals.getY(i) + normals.getY(i + 1) + normals.getY(i + 2)) / 3;
      const py = (positions.getY(i) + positions.getY(i + 1) + positions.getY(i + 2)) / 3;

      if (ny < thresholdNy && py > metrics.boundingBox.min[1] + 2) {
        steepOverhangFaceCount++;
      }
      if (ny < -0.92 && py > metrics.boundingBox.min[1] + 5) {
        flatBridgeFaceCount++;
      }
    }
  }

  const overhangRatio = totalFaceCount > 0 ? steepOverhangFaceCount / totalFaceCount : 0;
  const bridgeRatio = totalFaceCount > 0 ? flatBridgeFaceCount / totalFaceCount : 0;
  const overhangRiskPercent = Math.min(100, Math.round(overhangRatio * 250));
  const footprintAreaMm2 = dimX * dimZ;
  const minBaseDim = Math.max(1, Math.min(dimX, dimZ));
  const aspectRatioHeight = dimY / minBaseDim;
  const nozzleDia = profile.nozzleDiameter || 0.4;
  const lineWidth = profile.lineWidth || nozzleDia * 1.05;
  const actualVolumetricFlow = profile.printSpeed * lineWidth * profile.layerHeight;

  // ============================================================================
  // 1. LỖI OVERHANG SẬP CHI TIẾT (SPAGHETTI FAILURE)
  // ============================================================================
  if (overhangRatio > 0.035 && profile.supportMode === 'none') {
    const penalty = 24;
    score -= penalty;
    errors.push({
      id: 'err-overhang-no-support',
      type: 'overhang',
      severity: 'critical',
      title: `Nguy cơ sập chi tiết & đùn mì Ý (Overhang > ${thresholdDeg}° thiếu Support)`,
      description: `Phát hiện ${overhangRiskPercent}% diện tích bề mặt nghiêng vượt ngưỡng ${thresholdDeg}° không có cành chống đỡ. Nhựa nóng chảy đùn ra không khí sẽ bị rơi tự do tạo thành búi rối Spaghetti.`,
      rootCause: 'Trọng lực kéo sợi nhựa nóng chảy xuống khi góc vươn ra vượt quá 45° mà không có lớp đệm bên dưới.',
      suggestedFix: 'Kích hoạt "Tree Support (Organic)" với Top Z-Distance 0.20mm để đỡ vùng Overhang mà không để lại sẹo.',
      impactScorePenalty: penalty,
      autoFixAction: { supportMode: 'tree', treeStyle: 'organic', supportTopZDistance: 0.2 },
    });
  }

  // ============================================================================
  // 2. LỖI VÕNG CẦU NGANG (BRIDGING SAGGING)
  // ============================================================================
  if (bridgeRatio > 0.015 && (profile.coolingFanSpeed < 60 || profile.printSpeed > 220)) {
    const penalty = 12;
    score -= penalty;
    errors.push({
      id: 'err-bridging-sag',
      type: 'bridging',
      severity: 'warning',
      title: 'Nguy cơ võng sợi bắc cầu ngang (Bridging Sagging)',
      description: `Mô hình có các nhịp cầu ngang phẳng trên cao nhưng quạt làm mát chỉ đạt ${profile.coolingFanSpeed}% hoặc tốc độ kéo quá nhanh (${profile.printSpeed} mm/s) khiến sợi nhựa chưa kịp đông cứng đã bị chùng xuống.`,
      rootCause: 'Lưu lượng gió làm mát Part Fan không đủ làm đông cứng tức thời sợi nhựa kéo căng giữa 2 trụ.',
      suggestedFix: 'Tăng quạt làm mát Part Fan lên 90-100% và giảm tốc độ in nhịp cầu để sợi căng phẳng.',
      impactScorePenalty: penalty,
      autoFixAction: { coolingFanSpeed: 100, printSpeed: Math.min(profile.printSpeed, 160) },
    });
  }

  // ============================================================================
  // 3. LỖI CONG VÊNH TRÓC GÓC BÀN IN (THERMAL WARPING)
  // ============================================================================
  const isHighShrinkMaterial =
    profile.material === 'ABS' ||
    profile.material === 'ASA' ||
    profile.material === 'PA-CF' ||
    profile.material === 'PETG';
  if ((isHighShrinkMaterial || Math.max(dimX, dimZ) > 65) && !profile.brimEnabled) {
    const penalty = profile.material === 'ABS' || profile.material === 'ASA' || profile.material === 'PA-CF' ? 22 : 14;
    score -= penalty;
    errors.push({
      id: 'err-warping-corner-lift',
      type: 'warping',
      severity: penalty >= 20 ? 'critical' : 'warning',
      title: `Nguy cơ cong vênh bốc góc khỏi bàn in (Warping với ${profile.material})`,
      description: `Nhựa ${profile.material} có độ co ngót nhiệt lớn khi nguội. Chân đế mô hình (${Math.round(dimX)}×${Math.round(dimZ)}mm) chưa bật vành Brim dễ bị lực ứng suất nội kéo cong 4 góc khỏi tấm PEI.`,
      rootCause: 'Chênh lệch nhiệt độ giữa các lớp trên đang nguội co lại và lớp đáy dẫn đến mô-men uốn cong mép.',
      suggestedFix: 'Bật vành bám bàn Brim (Outer Brim hoặc Mouse-Ears 6mm) và tăng nhiệt độ bàn in phù hợp.',
      impactScorePenalty: penalty,
      autoFixAction: {
        brimEnabled: true,
        brimType: 'outer_only',
        brimWidthMm: 6,
        bedTemp: profile.material === 'ABS' || profile.material === 'ASA' ? 100 : Math.max(profile.bedTemp, 70),
      },
    });
  }

  // ============================================================================
  // 4. LỖI ĐẦU PHUN QUẸT ĐỔ MẪU CAO MẢNH (TALL SLENDER KNOCK-OVER)
  // ============================================================================
  if (aspectRatioHeight > 2.1 && (!profile.brimEnabled || (profile.zHopMm ?? 0.4) < 0.3)) {
    const penalty = 16;
    score -= penalty;
    errors.push({
      id: 'err-tall-knock-over',
      type: 'knock_over',
      severity: 'critical',
      title: `Nguy cơ đầu phun quẹt gãy/đổ phôi cao mảnh (Tỷ lệ Cao/Đáy ${aspectRatioHeight.toFixed(1)}x)`,
      description: `Mô hình có chiều cao ${dimY.toFixed(0)}mm nhưng tiết diện đáy nhỏ (${minBaseDim.toFixed(0)}mm). Khi in lên các lớp trên cao, momen lực ngang từ đầu phun di chuyển nhanh rất dễ đánh bật mẫu khỏi bàn in.`,
      rootCause: 'Cánh tay đòn mô-men lớn ở đỉnh mô hình cộng hưởng với Z-Hop thấp hoặc thiếu vành Brim giữ chân.',
      suggestedFix: 'Bật Brim rộng 8mm, nâng Z-Hop lên 0.6mm và giảm tốc độ chạy không tải (Travel Speed).',
      impactScorePenalty: penalty,
      autoFixAction: {
        brimEnabled: true,
        brimType: 'outer_and_inner',
        brimWidthMm: 8,
        zHopMm: 0.6,
        travelSpeed: 350,
      },
    });
  }

  // ============================================================================
  // 5. LỖI PHÌNH CHÂN VOI Ở ĐÁY (ELEPHANT'S FOOT FLARE)
  // ============================================================================
  if (
    (profile.material === 'PLA' && profile.bedTemp > 62) ||
    (profile.material === 'PETG' && profile.bedTemp > 85) ||
    (profile.material === 'TPU' && profile.bedTemp > 60)
  ) {
    const penalty = 10;
    score -= penalty;
    errors.push({
      id: 'err-elephant-foot',
      type: 'elephant_foot',
      severity: 'warning',
      title: `Lỗi phình chân voi lớp đáy (Elephant's Foot do bàn nhiệt ${profile.bedTemp}°C)`,
      description: `Nhiệt độ bàn in ${profile.bedTemp}°C vượt ngưỡng chuyển thủy tinh (Tg) của ${profile.material}. Sức nặng của các lớp trên đè xuống làm 3-5 lớp đầu tiên bị mềm nhão và bè rộng ra ngoài biên dạng chuẩn.`,
      rootCause: 'Lớp nhựa đáy giữ ở trạng thái bán lỏng quá lâu dưới áp lực nén của khối mô hình phía trên.',
      suggestedFix: `Hạ nhiệt độ bàn in về ${profile.material === 'PETG' ? 75 : 55}°C để lớp đáy định hình cứng vững.`,
      impactScorePenalty: penalty,
      autoFixAction: { bedTemp: profile.material === 'PETG' ? 75 : 55 },
    });
  }

  // ============================================================================
  // 6. LỖI BONG TRÓC LỚP ĐẦU TIÊN (FIRST LAYER POOR ADHESION)
  // ============================================================================
  const firstLayerH = profile.firstLayerHeight || 0.2;
  if (firstLayerH > nozzleDia * 0.78 || profile.bedTemp < 45) {
    const penalty = 15;
    score -= penalty;
    errors.push({
      id: 'err-first-layer-adhesion',
      type: 'first_layer',
      severity: 'critical',
      title: 'Nguy cơ bong tróc lớp đầu tiên (First Layer Adhesion Failure)',
      description: `Độ dày lớp đầu tiên (${firstLayerH}mm) quá dày so với kim phun ${nozzleDia}mm hoặc bàn in quá nguội (${profile.bedTemp}°C), khiến sợi nhựa tròn không được ép bẹp xuống mặt nhám PEI.`,
      rootCause: 'Áp suất ép nhựa lớp 1 (First Layer Squish) không đủ để điền đầy vi cấu trúc mặt bàn PEI.',
      suggestedFix: `Đặt độ dày lớp đầu tiên về ${(nozzleDia * 0.5).toFixed(2)}mm và tăng nhiệt bàn in lên tối thiểu 55°C.`,
      impactScorePenalty: penalty,
      autoFixAction: {
        firstLayerHeight: Number((nozzleDia * 0.5).toFixed(2)),
        bedTemp: Math.max(55, profile.bedTemp),
      },
    });
  }

  // ============================================================================
  // 7. LỖI HỤT LƯU LƯỢNG ĐÙN NHỰA / THIẾU NHỰA (VOLUMETRIC UNDER-EXTRUSION)
  // ============================================================================
  const maxFlow = profile.flowRateMm3s || 21;
  if (actualVolumetricFlow > maxFlow * 0.95 || (profile.flowRatio ?? 0.98) < 0.92) {
    const penalty = 18;
    score -= penalty;
    errors.push({
      id: 'err-volumetric-under-extrusion',
      type: 'under_extrusion',
      severity: 'critical',
      title: `Hụt lưu lượng nung chảy đầu phun (${actualVolumetricFlow.toFixed(1)} > ${maxFlow} mm³/s)`,
      description: `Tốc độ in ${profile.printSpeed}mm/s ở lớp dày ${profile.layerHeight}mm đòi hỏi lưu lượng ${actualVolumetricFlow.toFixed(1)} mm³/s, vượt quá khả năng nung chảy của Hotend (${maxFlow} mm³/s) hoặc hệ số Flow Ratio (${profile.flowRatio ?? 0.98}) quá thấp. Sản phẩm sẽ bị rỗ xốp, đứt nét và giòn gãy.`,
      rootCause: 'Lõi gia nhiệt Hotend không kịp truyền nhiệt vào tâm sợi nhựa khi tốc độ đẩy qua kim quá cao.',
      suggestedFix: 'Giảm tốc độ in tương ứng với giới hạn Volumetric Flow hoặc khôi phục Flow Ratio về 0.98.',
      impactScorePenalty: penalty,
      autoFixAction: {
        printSpeed: Math.max(60, Math.floor((maxFlow * 0.85) / (lineWidth * profile.layerHeight))),
        flowRatio: 0.98,
      },
    });
  }

  // ============================================================================
  // 8. LỖI TẮC NGHẼN KIM PHUN DO SỢI CARBON / HEAT CREEP (NOZZLE CLOGGING)
  // ============================================================================
  const isCFMaterial = profile.material === 'PLA-CF' || profile.material === 'PA-CF';
  if ((isCFMaterial && nozzleDia < 0.4) || (profile.material === 'PLA' && (profile.chamberTemp ?? 35) > 42)) {
    const penalty = 22;
    score -= penalty;
    errors.push({
      id: 'err-nozzle-clogging-risk',
      type: 'clogging',
      severity: 'critical',
      title: isCFMaterial
        ? `Nguy cơ tắc kim phun tức thời khi in sợi Carbon (${profile.material}) với kim ${nozzleDia}mm`
        : `Nguy cơ kẹt nhựa cổ nhiệt (Heat Creep Clog) do buồng in PLA quá nóng (${profile.chamberTemp}°C)`,
      description: isCFMaterial
        ? `Hạt sợi Carbon băm nhỏ trong ${profile.material} sẽ kết tụ và gây tắc hoàn toàn đầu kim nhỏ ${nozzleDia}mm.`
        : `Nhiệt độ buồng in ${profile.chamberTemp}°C làm sợi PLA mềm sớm ngay trong ống tản nhiệt Cold-end trước khi vào buồng nung, gây phình kẹt cứng.`,
      rootCause: isCFMaterial
        ? 'Kích thước lỗ kim phun nhỏ hơn chiều dài sợi gia cường Carbon Fiber.'
        : 'Hiện tượng Heat Creep làm mất ranh giới chuyển pha tại cổ họng tản nhiệt (Heatbreak).',
      suggestedFix: isCFMaterial
        ? 'Chuyển sang kim phun thép tôi 0.4mm hoặc 0.6mm.'
        : 'Hạ nhiệt độ buồng in dưới 35°C (mở nắp kính máy in) và bật quạt Aux Fan 70%.',
      impactScorePenalty: penalty,
      autoFixAction: isCFMaterial
        ? { nozzleDiameter: 0.6, lineWidth: 0.62, outerWallLineWidth: 0.6 }
        : { chamberTemp: 30, auxFanSpeed: 70 },
    });
  }

  // ============================================================================
  // 9. LỖI PHỒNG RỖ MẶT ĐỈNH (PILLOWING / TOP SURFACE HOLES)
  // ============================================================================
  if (profile.infillDensity < 15 && (profile.topShellLayers ?? 4) < 4) {
    const penalty = 11;
    score -= penalty;
    errors.push({
      id: 'err-top-surface-pillowing',
      type: 'pillowing',
      severity: 'warning',
      title: 'Nguy cơ phồng rỗ và thủng lỗ mặt đỉnh (Top Surface Pillowing)',
      description: `Mật độ ruột Infill quá thưa (${profile.infillDensity}%) kết hợp số lớp vỏ đỉnh mỏng (${profile.topShellLayers ?? 4} lớp) khiến các lớp đóng nắp trên cùng bị sụp xuống các ô trống bên dưới.`,
      rootCause: 'Khoảng cách bắc cầu giữa các vách Infill quá rộng, không đủ số lớp Top Shell để lấp phẳng hoàn toàn.',
      suggestedFix: 'Tăng số lớp vỏ đỉnh (Top Shell Layers) lên 5 lớp và tăng mật độ Infill lên tối thiểu 15%.',
      impactScorePenalty: penalty,
      autoFixAction: { topShellLayers: 5, infillDensity: Math.max(15, profile.infillDensity) },
    });
  }

  // ============================================================================
  // 10. LỖI VÂN SÓNG RUNG ĐỘNG TRÊN VÁCH (RINGING / GHOSTING RIPPLES)
  // ============================================================================
  const outerSpeed = profile.outerWallSpeed || Math.round(profile.printSpeed * 0.6);
  const outerAccel = profile.outerWallAcceleration || 5000;
  if (outerSpeed > 200 || outerAccel > 8000) {
    const penalty = 10;
    score -= penalty;
    errors.push({
      id: 'err-ringing-ghosting',
      type: 'ringing',
      severity: 'warning',
      title: `Nguy cơ gợn sóng bóng ma trên vách ngoài (Ringing / Ghosting)`,
      description: `Tốc độ tường ngoài (${outerSpeed} mm/s) hoặc gia tốc vỏ ngoài (${outerAccel} mm/s²) quá cao sẽ gây dao động cộng hưởng dây đai CoreXY khi đổi hướng đột ngột tại các góc cạnh.`,
      rootCause: 'Dư chấn cơ học trên hệ khung và dây đai GT2 chưa kịp tắt hẳn sau khi đầu phun cua gấp 90°.',
      suggestedFix: 'Giảm tốc độ tường ngoài về 120 mm/s và hạ gia tốc tường ngoài xuống 4000 mm/s².',
      impactScorePenalty: penalty,
      autoFixAction: { outerWallSpeed: 120, outerWallAcceleration: 4000 },
    });
  }

  // ============================================================================
  // 11. LỖI TÁCH LỚP NỨT THÂN GIỮA (LAYER DELAMINATION / CRACKING)
  // ============================================================================
  if (
    (profile.material === 'ABS' || profile.material === 'ASA' || profile.material === 'PA-CF') &&
    (profile.coolingFanSpeed > 40 || (profile.chamberTemp ?? 35) < 42)
  ) {
    const penalty = 17;
    score -= penalty;
    errors.push({
      id: 'err-layer-delamination',
      type: 'delamination',
      severity: 'critical',
      title: `Nguy cơ nứt ngang & tách lớp thân giữa (Layer Delamination với ${profile.material})`,
      description: `Nhựa kỹ thuật ${profile.material} đang bị quạt Part Fan thổi quá mạnh (${profile.coolingFanSpeed}%) trong buồng in nguội (${profile.chamberTemp ?? 35}°C), làm các lớp nguội đột ngột trước khi kịp khuếch tán chuỗi polymer vào nhau.`,
      rootCause: 'Sốc nhiệt cục bộ làm giảm độ bền liên kết liên lớp (Inter-layer adhesion) và gây nứt toác ngang thân.',
      suggestedFix: 'Hạ quạt làm mát xuống 15-20%, tắt Aux Fan và duy trì nhiệt độ buồng kín tối thiểu 50°C.',
      impactScorePenalty: penalty,
      autoFixAction: { coolingFanSpeed: 15, auxFanSpeed: 0, chamberTemp: 50 },
    });
  }

  // ============================================================================
  // 12. LỖI DÍNH CỨNG SUPPORT VÀO MẪU IN (SUPPORT INTERFACE FUSION)
  // ============================================================================
  if (profile.supportMode !== 'none' && (profile.supportTopZDistance ?? 0.2) < 0.12) {
    const penalty = 13;
    score -= penalty;
    errors.push({
      id: 'err-support-fusion',
      type: 'support_fusion',
      severity: 'warning',
      title: `Nguy cơ dính chết Support không thể bóc tách (Top Z = ${profile.supportTopZDistance}mm)`,
      description: `Khe hở bóc tách Top Z-Distance (${profile.supportTopZDistance}mm) quá nhỏ sẽ làm lớp đệm Support hàn chảy dính liền vào bề mặt mô hình, khi bóc sẽ làm gãy chi tiết hoặc để lại sẹo sâu.`,
      rootCause: 'Khoảng cách cách ly theo trục Z nhỏ hơn bán kính cầu vồng chảy tự nhiên của sợi nhựa đùn.',
      suggestedFix: 'Đặt Top Z-Distance ở mức chuẩn 0.20mm (hoặc bằng đúng 1 Layer Height).',
      impactScorePenalty: penalty,
      autoFixAction: { supportTopZDistance: Math.max(0.18, profile.layerHeight) },
    });
  }

  // ============================================================================
  // 13. LỖI SẸO MỤN DỌC ĐƯỜNG NỐI Z-SEAM (Z-SEAM BLOBS & SCARRING)
  // ============================================================================
  if ((profile.pressureAdvance ?? 0.02) === 0 || (profile.retractionDistanceMm ?? 0.8) < 0.3) {
    const penalty = 9;
    score -= penalty;
    errors.push({
      id: 'err-z-seam-blobs',
      type: 'z_seam_scarring',
      severity: 'info',
      title: 'Nguy cơ nổi mụn nhựa & rỗ dọc đường nối Z-Seam',
      description: `Hệ số bù áp suất Pressure Advance đang tắt (${profile.pressureAdvance ?? 0}) hoặc cự ly rút nhựa Retraction quá ngắn (${profile.retractionDistanceMm}mm) làm dư áp suất trong buồng kim khi kết thúc mỗi vòng tường.`,
      rootCause: 'Áp suất nén đàn hồi của nhựa nóng chảy tiếp tục đẩy nhựa trào ra tại điểm dừng đổi lớp.',
      suggestedFix: 'Bật Pressure Advance (0.02 - 0.03) và đặt Retraction 0.8mm với Seam Position = Aligned.',
      impactScorePenalty: penalty,
      autoFixAction: { pressureAdvance: 0.025, retractionDistanceMm: 0.8, seamPosition: 'aligned' },
    });
  }

  // ============================================================================
  // 14. LỖI TƠ NHỆN & KẸT ĐÙN NHỰA DẺO TPU / PETG (STRINGING & EXTRUDER JAM)
  // ============================================================================
  if (profile.material === 'TPU' && (profile.printSpeed > 65 || (profile.retractionDistanceMm ?? 0.8) > 1.8)) {
    const penalty = 20;
    score -= penalty;
    errors.push({
      id: 'err-tpu-stringing-jam',
      type: 'stringing',
      severity: 'critical',
      title: 'Tốc độ/Retraction quá cao với nhựa dẻo TPU (Rối bánh răng & Kéo tơ nhện)',
      description: `Sợi nhựa đàn hồi TPU in ở ${profile.printSpeed} mm/s hoặc rút nhựa ${profile.retractionDistanceMm}mm sẽ bị nén lò xo và cuốn kẹt vào bánh răng Extruder, đồng thời tạo vô số tơ mạng nhện.`,
      rootCause: 'Độ cứng dọc trục thấp của sợi elastomer TPU95A gây hiện tượng uốn dọc (buckling) trong đường dẫn nhựa.',
      suggestedFix: 'Hạ tốc độ in TPU xuống 45 mm/s và giảm cự ly rút nhựa Retraction về 0.6mm.',
      impactScorePenalty: penalty,
      autoFixAction: { printSpeed: 45, outerWallSpeed: 35, retractionDistanceMm: 0.6 },
    });
  } else if (profile.material === 'PETG' && (profile.nozzleTemp > 260 || (profile.retractionDistanceMm ?? 0.8) < 0.5)) {
    const penalty = 12;
    score -= penalty;
    errors.push({
      id: 'err-petg-stringing',
      type: 'stringing',
      severity: 'warning',
      title: 'Nguy cơ kéo tơ mạng nhện dày đặc (PETG Stringing & Oozing)',
      description: `Nhựa PETG ở nhiệt độ cao (${profile.nozzleTemp}°C) hoặc rút nhựa kém (${profile.retractionDistanceMm}mm) có độ nhớt thấp, dễ rỉ nhựa khỏi đầu kim khi chạy Travel giữa các chi tiết.`,
      rootCause: 'Áp suất mao dẫn và độ bám dính cao của PETG nóng chảy kéo thành sợi tơ mảnh khi đầu phun di chuyển.',
      suggestedFix: 'Hạ nhiệt độ đầu phun PETG về 245°C, đặt Retraction 1.0mm và tăng Travel Speed lên 500 mm/s.',
      impactScorePenalty: penalty,
      autoFixAction: { nozzleTemp: 245, retractionDistanceMm: 1.0, travelSpeed: 500 },
    });
  }

  // ============================================================================
  // 15. LỖI XUNG ĐỘT NHIỆT ĐỘ ĐẦU PHUN VẬT LIỆU (TEMPERATURE MISMATCH)
  // ============================================================================
  if (profile.material === 'PETG' && profile.nozzleTemp < 230) {
    const penalty = 15;
    score -= penalty;
    errors.push({
      id: 'err-petg-nozzle-low',
      type: 'temperature_mismatch',
      severity: 'warning',
      title: 'Nhiệt độ đầu phun quá thấp cho PETG (Nguy cơ tách lớp & trượt bánh răng)',
      description: `Nhiệt độ ${profile.nozzleTemp}°C chưa đủ làm chảy hoàn toàn nhựa PETG, làm tăng lực cản đùn và khiến sản phẩm cực kỳ giòn theo phương Z.`,
      rootCause: 'Độ nhớt dòng chảy polymer quá cao khi nhiệt độ thấp hơn vùng gia công chuẩn (235-255°C).',
      suggestedFix: 'Tăng nhiệt độ đầu phun lên 245°C để đạt độ ngấu liên lớp tối đa.',
      impactScorePenalty: penalty,
      autoFixAction: { nozzleTemp: 245 },
    });
  } else if (
    (profile.material === 'ABS' || profile.material === 'ASA' || profile.material === 'PA-CF') &&
    profile.nozzleTemp < 250
  ) {
    const penalty = 18;
    score -= penalty;
    errors.push({
      id: 'err-high-temp-filament-cold',
      type: 'temperature_mismatch',
      severity: 'critical',
      title: `Nhiệt độ đầu phun quá thấp cho nhựa kỹ thuật ${profile.material} (${profile.nozzleTemp}°C)`,
      description: `Nhựa kỹ thuật ${profile.material} yêu cầu nhiệt độ nung chảy từ 260°C - 290°C. In ở ${profile.nozzleTemp}°C sẽ gây kẹt đùn ngay lập tức.`,
      rootCause: 'Nhiệt độ dưới ngưỡng nóng chảy tinh thể của polymer kỹ thuật.',
      suggestedFix: `Tăng nhiệt độ đầu phun lên ${profile.material === 'PA-CF' ? 280 : 265}°C.`,
      impactScorePenalty: penalty,
      autoFixAction: { nozzleTemp: profile.material === 'PA-CF' ? 280 : 265 },
    });
  }

  // ============================================================================
  // 16. LỖI BỌT KHÍ ẨM NỔ LÁCH TÁCH (HYGROSCOPIC MOISTURE BUBBLING)
  // ============================================================================
  if (
    (profile.material === 'PA-CF' || profile.material === 'TPU' || profile.material === 'PETG') &&
    profile.nozzleTemp >= 255
  ) {
    const penalty = 8;
    score -= penalty;
    errors.push({
      id: 'err-moisture-bubbling',
      type: 'moisture_bubbling',
      severity: 'info',
      title: `Cảnh báo hút ẩm nổ bọt khí bề mặt với nhựa ${profile.material}`,
      description: `Vật liệu ${profile.material} rất nhạy ẩm. Khi đùn ở nhiệt độ cao (${profile.nozzleTemp}°C), hơi nước ngậm trong sợi nhựa sẽ hóa hơi tức thời tạo tiếng nổ lách tách và bề mặt sần sùi bọt khí.`,
      rootCause: 'Phản ứng thủy phân và hóa hơi nước đột ngột trong buồng nung chảy > 250°C.',
      suggestedFix: 'Sấy khô cuộn nhựa trong hộp AMS HT / máy sấy ở 65-80°C trong 6 giờ trước khi in và hạ nhẹ nhiệt độ kim.',
      impactScorePenalty: penalty,
      autoFixAction: { nozzleTemp: Math.max(245, profile.nozzleTemp - 8) },
    });
  }

  // ============================================================================
  // 17. LỖI BẬC THANG MẤT CHI TIẾT & VÁCH MỎNG YẾU (THIN WALL / STAIR-STEPPING)
  // ============================================================================
  if ((profile.layerHeight >= 0.28 && dimY < 35) || profile.wallLoops < 2) {
    const penalty = 8;
    score -= penalty;
    errors.push({
      id: 'err-thin-wall-detail',
      type: 'thin_wall',
      severity: 'info',
      title:
        profile.wallLoops < 2
          ? 'Số vòng tường quá mỏng (1 Wall Loop) gây lộ vân Infill'
          : `Độ dày lớp ${profile.layerHeight}mm làm lộ rõ bậc thang (Stair-Stepping)`,
      description:
        profile.wallLoops < 2
          ? 'Chỉ in 1 vòng tường khiến vách ngoài rất yếu và bị hằn vân lưới Infill bên trong ra mặt ngoài.'
          : 'Lớp cắt dày trên mô hình nhỏ làm các mặt cong vát xuất hiện vân bậc thang thô ráp.',
      rootCause: 'Độ phân giải trục Z hoặc bề dày thành vỏ chưa đủ che phủ kết cấu lõi.',
      suggestedFix: 'Đặt tối thiểu 2-3 vòng tường (Wall Loops) và giảm Layer Height xuống 0.16mm - 0.20mm.',
      impactScorePenalty: penalty,
      autoFixAction: { wallLoops: Math.max(2, profile.wallLoops), layerHeight: 0.16 },
    });
  }

  // ============================================================================
  // 18. ĐÁNH GIÁ CÁC QUY TẮC LỖI HỌC TỪ CỘNG ĐỒNG & ADMIN DATABASE (/api/knowledge)
  // ============================================================================
  const activeLearnedRules = (externalRules || cachedLearnedRules).filter((r) => r.isVerified);
  for (const rule of activeLearnedRules) {
    // Tránh trùng lặp nếu đã có cùng ID
    if (errors.some((e) => e.id === rule.id)) continue;

    // Kiểm tra điều kiện kích hoạt thông minh dựa trên tags / defectType / material
    const ruleText = `${rule.title} ${rule.triggerCondition || ''} ${(rule.tags || []).join(' ')}`.toUpperCase();
    let matchesContext = false;

    if (ruleText.includes(profile.material.toUpperCase())) {
      matchesContext = true;
    } else if (rule.defectType === 'overhang' && profile.supportMode === 'none' && overhangRatio > 0.02) {
      matchesContext = true;
    } else if (rule.defectType === 'warping' && !profile.brimEnabled) {
      matchesContext = true;
    } else if (rule.defectType === 'stringing' && (profile.retractionDistanceMm ?? 0.8) < 0.8) {
      matchesContext = true;
    } else if (rule.defectType === 'ringing' && profile.printSpeed > 220) {
      matchesContext = true;
    } else if (rule.defectType === 'custom_defect') {
      matchesContext = true;
    }

    if (matchesContext) {
      const mappedSeverity: 'critical' | 'warning' | 'info' =
        rule.severity === 'critical' || rule.severity === 'high'
          ? 'critical'
          : rule.severity === 'medium'
          ? 'warning'
          : 'info';
      const penalty = mappedSeverity === 'critical' ? 12 : mappedSeverity === 'warning' ? 7 : 4;
      score -= penalty;

      errors.push({
        id: rule.id,
        type: rule.defectType || 'custom_defect',
        severity: mappedSeverity,
        title: `[AI Learned] ${rule.title}`,
        description: rule.content,
        rootCause: rule.triggerCondition
          ? `Điều kiện kích hoạt từ Knowledge DB: ${rule.triggerCondition}`
          : 'Tri thức thực nghiệm từ người dùng & chuyên gia Admin.',
        suggestedFix: rule.autoFixPatch
          ? 'Nhấn "Tự Động Tối Ưu" để áp dụng thông số khắc phục từ cơ sở dữ liệu tri thức.'
          : 'Điều chỉnh thông số theo hướng dẫn chi tiết ở trên.',
        impactScorePenalty: penalty,
        autoFixAction: rule.autoFixPatch,
        isLearnedFromCommunity: true,
        contributor: rule.submittedBy || 'Laymor Knowledge DB',
      });
    }
  }

  const finalScore = Math.max(15, Math.min(100, score));
  const overallStatus: IPreflightReport['overallStatus'] =
    finalScore >= 85 ? 'ready' : finalScore >= 60 ? 'caution' : 'high_risk';

  let summary = '';
  if (overallStatus === 'ready') {
    summary = `Mô hình và thông số Bambu Studio đạt chuẩn an toàn cao (${finalScore}/100). Sẵn sàng xuất file .3MF kèm đầy đủ Profile để in ngay.`;
  } else if (overallStatus === 'caution') {
    summary = `Phát hiện ${errors.length} cảnh báo kỹ thuật thực tế (${finalScore}/100). Khuyên dùng nút "Tự Động Tối Ưu" hoặc đóng góp thêm kinh nghiệm xử lý vào Knowledge DB.`;
  } else {
    summary = `CẢNH BÁO RỦI RO CAO (${finalScore}/100): Phát hiện ${errors.length} lỗi nghiêm trọng có thể gây hỏng mẫu in. Hãy áp dụng bản vá tự động trước khi xuất .3MF.`;
  }

  return {
    printabilityScore: finalScore,
    overallStatus,
    errors,
    summary,
    estimatedCostVnd: metrics.estimatedCostVnd,
    estimatedPrintTimeMinutes: Math.round(metrics.estimatedPrintTimeSec / 60),
    modelFootprintAreaMm2: Math.round(footprintAreaMm2),
    overhangRiskAreaPercent: overhangRiskPercent,
  };
}
