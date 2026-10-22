import * as THREE from 'three';
import { ISimulationProfile, IPreflightReport } from '@/types/simulator';
import { ISlicingMetrics } from './slicingEngine';

export interface IActiveDefectAlert {
  layer: number;
  type: 'overhang' | 'warping' | 'temperature' | 'speed' | 'stringing' | 'elephant_foot' | 'delamination';
  title: string;
  message: string;
  autoFixAction?: Partial<ISimulationProfile>;
}

/**
 * Tạo mô hình 3D trực quan hóa các lỗi in thực tế ngay trên phôi mẫu giả lập:
 * 1. Sợi nhựa Spaghetti rơi vãi, võng xệ khi Overhang thiếu support
 * 2. Góc chân đế bốc cong vênh (Warping corner peel) nhấc khỏi bàn in
 * 3. Phình chân voi (Elephant's Foot Flare) tại các lớp đáy quá nhiệt
 * 4. Tơ mạng nhện (Stringing Cobwebs) giăng ngang giữa các vách khi thiếu Retraction / quá nhiệt
 * 5. Gợn sóng rung động (Ringing / Ghosting Ripples) dọc vách khi gia tốc quá cao
 * 6. Vết nứt tách lớp (Layer Delamination Cracks) ở thân giữa khi thiếu nhiệt buồng
 */
export function generateDefect3DGroup(
  geometry: THREE.BufferGeometry,
  profile: ISimulationProfile,
  metrics: ISlicingMetrics,
  report: IPreflightReport
): THREE.Group {
  const defectGroup = new THREE.Group();
  defectGroup.name = 'visual_defects_group';

  if (!report || !report.errors) return defectGroup;

  const [dimX, dimY, dimZ] = metrics.boundingBox.dimensions;

  // 1. Mô phỏng SỢI NHỰA SPAGHETTI / VÕNG XỆ (Overhang Failure)
  const hasOverhangError = report.errors.some((e) => e.type === 'overhang' || e.type === 'bridging');
  if (hasOverhangError && profile.supportMode === 'none') {
    const spaghettiGroup = new THREE.Group();
    spaghettiGroup.name = 'spaghetti_failure';

    const strandMaterial = new THREE.LineBasicMaterial({
      color: 0xff3b30,
      linewidth: 2,
    });

    const strandCount = 16;
    const startY = dimY * 0.45;

    for (let s = 0; s < strandCount; s++) {
      const angle = (s / strandCount) * Math.PI * 2;
      const r = (Math.max(dimX, dimZ) / 2) * 0.85;
      const startX = Math.cos(angle) * r;
      const startZ = Math.sin(angle) * r;

      const points: THREE.Vector3[] = [];
      const numPoints = 12;
      for (let p = 0; p <= numPoints; p++) {
        const t = p / numPoints;
        const curY = startY * (1 - t);
        const curlX = startX + Math.sin(t * 6 + s) * 2.5 * t;
        const curlZ = startZ + Math.cos(t * 5 + s) * 2.5 * t;
        points.push(new THREE.Vector3(curlX, curY, curlZ));
      }

      const strandGeom = new THREE.BufferGeometry().setFromPoints(points);
      const strandLine = new THREE.Line(strandGeom, strandMaterial);
      spaghettiGroup.add(strandLine);
    }

    const puddleGeom = new THREE.RingGeometry(0.5, 4.5, 12);
    puddleGeom.rotateX(-Math.PI / 2);
    puddleGeom.translate(dimX * 0.35, 0.2, dimZ * 0.2);
    const puddleMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const puddleMesh = new THREE.Mesh(puddleGeom, puddleMat);
    spaghettiGroup.add(puddleMesh);

    defectGroup.add(spaghettiGroup);
  }

  // 2. Mô phỏng CONG VÊNH TRÓC BÀN (Warping Corner Lift)
  const hasWarpingError = report.errors.some((e) => e.type === 'warping' || e.type === 'knock_over');
  if (hasWarpingError && !profile.brimEnabled) {
    const warpingGroup = new THREE.Group();
    warpingGroup.name = 'warping_peel';

    const corners = [
      [-dimX / 2, -dimZ / 2],
      [dimX / 2, -dimZ / 2],
      [-dimX / 2, dimZ / 2],
      [dimX / 2, dimZ / 2],
    ];

    const warpMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });

    corners.forEach(([cx, cz]) => {
      const warpGeom = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        cx, 2.8, cz,
        cx * 0.7, 0, cz,
        cx, 0, cz * 0.7,
      ]);

      warpGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      warpGeom.computeVertexNormals();

      const warpMesh = new THREE.Mesh(warpGeom, warpMat);
      warpingGroup.add(warpMesh);

      const arrowGeom = new THREE.ConeGeometry(0.8, 2, 8);
      arrowGeom.translate(cx * 0.95, 3.8, cz * 0.95);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const arrow = new THREE.Mesh(arrowGeom, arrowMat);
      warpingGroup.add(arrow);
    });

    defectGroup.add(warpingGroup);
  }

  // 3. Mô phỏng PHÌNH CHÂN VOI (Elephant's Foot Flare) tại 3 lớp đáy
  const hasElephantFoot = report.errors.some((e) => e.type === 'elephant_foot');
  if (hasElephantFoot) {
    const baseR = Math.max(dimX, dimZ) * 0.48;
    const flareGeom = new THREE.TorusGeometry(baseR, 0.9, 10, 36);
    flareGeom.rotateX(Math.PI / 2);
    flareGeom.translate(0, 0.45, 0);
    const flareMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });
    const flareMesh = new THREE.Mesh(flareGeom, flareMat);
    flareMesh.name = 'elephant_foot_flare';
    defectGroup.add(flareMesh);
  }

  // 4. Mô phỏng TƠ MẠNG NHỆN (Stringing Cobwebs)
  const hasStringing = report.errors.some((e) => e.type === 'stringing' || e.type === 'moisture_bubbling');
  if (hasStringing) {
    const stringGroup = new THREE.Group();
    stringGroup.name = 'stringing_cobwebs';
    const webMat = new THREE.LineBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.75,
    });
    const r = Math.max(dimX, dimZ) * 0.42;
    for (let i = 0; i < 18; i++) {
      const a1 = (i * 1.7) % (Math.PI * 2);
      const a2 = a1 + 1.2 + (i % 3) * 0.4;
      const y1 = dimY * (0.35 + ((i * 0.07) % 0.5));
      const y2 = y1 + ((i % 2 === 0 ? 1 : -1) * 2.2);
      const p1 = new THREE.Vector3(Math.cos(a1) * r, y1, Math.sin(a1) * r);
      const pMid = new THREE.Vector3(
        ((Math.cos(a1) + Math.cos(a2)) * r) / 2,
        Math.min(y1, y2) - 1.1,
        ((Math.sin(a1) + Math.sin(a2)) * r) / 2
      );
      const p2 = new THREE.Vector3(Math.cos(a2) * r, y2, Math.sin(a2) * r);
      const curve = new THREE.QuadraticBezierCurve3(p1, pMid, p2);
      const webGeom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(8));
      stringGroup.add(new THREE.Line(webGeom, webMat));
    }
    defectGroup.add(stringGroup);
  }

  // 5. Mô phỏng GỢN SÓNG RUNG ĐỘNG (Ringing / Ghosting Ripples)
  const hasRinging = report.errors.some((e) => e.type === 'ringing');
  if (hasRinging) {
    const ringGroup = new THREE.Group();
    ringGroup.name = 'ringing_ripples';
    const rippleMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
    const halfX = dimX * 0.48;
    const halfZ = dimZ * 0.48;
    for (let w = 0; w < 6; w++) {
      const zOff = -halfZ * 0.6 + (w / 5) * (halfZ * 1.2);
      const pts: THREE.Vector3[] = [];
      for (let s = 0; s <= 16; s++) {
        const t = s / 16;
        const y = dimY * (0.15 + t * 0.7);
        const rippleX = halfX + Math.sin(t * Math.PI * 8 + w) * 0.65;
        pts.push(new THREE.Vector3(rippleX, y, zOff));
      }
      ringGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), rippleMat));
    }
    defectGroup.add(ringGroup);
  }

  // 6. Mô phỏng TÁCH LỚP THÂN GIỮA (Layer Delamination Cracks)
  const hasDelamination = report.errors.some((e) => e.type === 'delamination');
  if (hasDelamination) {
    const crackGroup = new THREE.Group();
    crackGroup.name = 'delamination_cracks';
    const crackMat = new THREE.LineBasicMaterial({ color: 0xf43f5e, linewidth: 2 });
    const r = Math.max(dimX, dimZ) * 0.48;
    [0.42, 0.68].forEach((ratio, idx) => {
      const y = dimY * ratio;
      const pts: THREE.Vector3[] = [];
      for (let a = 0; a <= 24; a++) {
        const ang = (a / 24) * Math.PI * 1.2 + idx;
        pts.push(
          new THREE.Vector3(
            Math.cos(ang) * r,
            y + Math.sin(a * 2.5) * 0.4,
            Math.sin(ang) * r
          )
        );
      }
      crackGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), crackMat));
    });
    defectGroup.add(crackGroup);
  }

  return defectGroup;
}

/**
 * Trả về thông báo lỗi trực tiếp theo thời gian thực tại Layer hiện tại
 */
export function getActiveDefectAlert(
  currentLayer: number,
  totalLayers: number,
  profile: ISimulationProfile,
  report: IPreflightReport
): IActiveDefectAlert | null {
  if (!report || !report.errors || report.errors.length === 0) return null;

  const progress = currentLayer / Math.max(1, totalLayers);

  // 1. Lỗi Chân Voi / First Layer ở lớp 1 - 10%
  const firstLayerErr = report.errors.find(
    (e) => e.type === 'first_layer' || e.type === 'elephant_foot'
  );
  if (firstLayerErr && progress <= 0.12) {
    return {
      layer: currentLayer,
      type: 'elephant_foot',
      title: `CẢNH BÁO LỚP ĐÁY: ${firstLayerErr.title.toUpperCase()}`,
      message: firstLayerErr.description,
      autoFixAction: firstLayerErr.autoFixAction,
    };
  }

  // 2. Lỗi Warping ở các lớp chân đế đầu tiên (Layer 5% - 28%)
  const warpingErr = report.errors.find((e) => e.type === 'warping' || e.type === 'knock_over');
  if (warpingErr && progress <= 0.28 && !profile.brimEnabled) {
    return {
      layer: currentLayer,
      type: 'warping',
      title: 'ĐANG XẢY RA CONG VÊNH (WARPING / TRÓC BÀN)',
      message: warpingErr.description,
      autoFixAction: warpingErr.autoFixAction,
    };
  }

  // 3. Lỗi Overhang / Bridging tại các lớp thân giữa (Layer 30% - 80%)
  const overhangErr = report.errors.find((e) => e.type === 'overhang' || e.type === 'bridging');
  if (overhangErr && progress >= 0.30 && progress <= 0.80 && profile.supportMode === 'none') {
    return {
      layer: currentLayer,
      type: 'overhang',
      title: 'ĐANG XẢY RA SẬP CHI TIẾT (SPAGHETTI FAILURE)',
      message: overhangErr.description,
      autoFixAction: overhangErr.autoFixAction,
    };
  }

  // 4. Lỗi Tách lớp / Tơ nhện / Rung vách ở phần thân trên
  const midErr = report.errors.find(
    (e) =>
      e.type === 'delamination' ||
      e.type === 'stringing' ||
      e.type === 'ringing' ||
      e.type === 'under_extrusion' ||
      e.type === 'clogging'
  );
  if (midErr && progress > 0.25) {
    return {
      layer: currentLayer,
      type: 'stringing',
      title: midErr.title.toUpperCase(),
      message: midErr.description,
      autoFixAction: midErr.autoFixAction,
    };
  }

  // 5. Lỗi nhiệt độ hoặc lỗi bất kỳ còn lại
  const fallbackErr = report.errors[0];
  if (fallbackErr && progress > 0.05) {
    return {
      layer: currentLayer,
      type: 'temperature',
      title: fallbackErr.title.toUpperCase(),
      message: fallbackErr.description,
      autoFixAction: fallbackErr.autoFixAction,
    };
  }

  return null;
}
