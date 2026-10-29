import { IPrinterProfile, ISupportConfig, IPrintEstimation, SupportType } from '../../domain/slicing';
import { IGeometryFingerprint } from './GeometryFingerprintEngine';

export class PrintSimulationEngine {
  calculateEstimation(
    printer: IPrinterProfile,
    dimensionsMm: { x: number; y: number; z: number },
    supportConfig: ISupportConfig,
    layerHeightMm: number = 0.20,
    trueVolumeCm3?: number,
    geometryFingerprint?: IGeometryFingerprint
  ): IPrintEstimation {
    // 1. Kiểm tra kích thước xem có vượt khổ in của bàn in không
    const outOfBoundsAxes: ('X' | 'Y' | 'Z')[] = [];
    if (dimensionsMm.x > printer.bedDimensions.x) outOfBoundsAxes.push('X');
    if (dimensionsMm.y > printer.bedDimensions.y) outOfBoundsAxes.push('Y');
    if (dimensionsMm.z > printer.bedDimensions.z) outOfBoundsAxes.push('Z');
    const isOutOfBounds = outOfBoundsAxes.length > 0;

    // 2. Tính số lớp in (Layers = Height / Layer Height)
    const totalLayers = Math.max(1, Math.round(dimensionsMm.z / layerHeightMm));

    // 3. Ưu tiên sử dụng Thể tích lưới thực tế (Signed Tetrahedron Volume) nếu có
    const boundingBoxCm3 = (dimensionsMm.x * dimensionsMm.y * dimensionsMm.z) / 1000;
    const effectiveMeshVolumeCm3 =
      trueVolumeCm3 && trueVolumeCm3 > 0.1
        ? trueVolumeCm3 * 0.42 // 2 vòng vách ngoài + 15% Gyroid Infill ~ 42% thể tích đặc của mesh
        : boundingBoxCm3 * 0.22;

    // Trọng lượng nhựa tiêu hao (PLA density ~ 1.24 g/cm3)
    let baseWeightGrams = Math.max(8, effectiveMeshVolumeCm3 * 1.24);

    // Tính toán thêm lượng nhựa làm Support nếu bật Support
    let supportWeightGrams = 0;
    if (supportConfig.enabled && supportConfig.type !== 'none') {
      if (supportConfig.type === 'tree') {
        // Tree support rất thanh mảnh, chỉ tốn khoảng 15-20% trọng lượng mô hình
        supportWeightGrams = baseWeightGrams * 0.18;
      } else {
        // Normal grid support tốn khoảng 35-45% trọng lượng mô hình
        supportWeightGrams = baseWeightGrams * 0.38;
      }
    }

    const totalWeightGrams = Math.round(baseWeightGrams + supportWeightGrams);
    // Chiều dài sợi nhựa 1.75mm: 1 mét PLA ~ 3.0 gram
    const filamentLengthMeters = Number((totalWeightGrams / 3.0).toFixed(1));

    // 4. Ước tính thời gian in (phút) dựa trên tốc độ máy in
    // Bambu Lab / K1 (CoreXY 400-500mm/s): ~1.2g/phút
    // Prusa / Bed Slinger (150-200mm/s): ~0.7g/phút
    const depositionRateGramsPerMin = printer.maxSpeedMmS >= 400 ? 0.95 : 0.60;
    const estimatedPrintTimeMinutes = Math.max(25, Math.round(totalWeightGrams / depositionRateGramsPerMin));

    // 5. Chi phí in ước tính: 250,000 VND / cuộn 1kg PLA + 20,000 VND tiền điện máy
    const costPerGram = 260; // VND
    const estimatedCostVnd = Math.round(totalWeightGrams * costPerGram);

    // 6. Phát hiện nguy cơ Overhang từ Geometry Fingerprint 12 chiều (nếu có) hoặc kích thước
    const hasOverhangRisk = geometryFingerprint
      ? geometryFingerprint.overhangArea45Mm2 > 180 || geometryFingerprint.severeOverhangArea60Mm2 > 45
      : dimensionsMm.z > 40 && (dimensionsMm.x > 30 || dimensionsMm.y > 30);
    
    let suggestedType: SupportType = 'none';
    let reason = 'Mô hình có hình học dốc tự đỡ tốt (< 45°), không cần bật Support.';

    if (hasOverhangRisk) {
      if (printer.recommendedSupport === 'tree') {
        suggestedType = 'tree';
        reason = 'Đề xuất Tree Support: Tiết kiệm ~45% nhựa, dễ bóc tách bằng tay, bề mặt tiếp xúc mịn không để lại sẹo in.';
      } else {
        suggestedType = 'normal';
        reason = 'Đề xuất Normal Grid Support: Bề mặt cơ khí phẳng ngang rộng cần cấu trúc đỡ kiên cố chống võng nhựa.';
      }
    }

    return {
      layerHeightMm,
      totalLayers,
      modelDimensionsMm: { ...dimensionsMm },
      isOutOfBounds,
      outOfBoundsAxes,
      estimatedPrintTimeMinutes,
      filamentWeightGrams: totalWeightGrams,
      filamentLengthMeters,
      estimatedCostVnd,
      hasOverhangRisk,
      aiSupportRecommendation: {
        suggestedType,
        reason,
      },
    };
  }
}

export const printSimulationEngine = new PrintSimulationEngine();
