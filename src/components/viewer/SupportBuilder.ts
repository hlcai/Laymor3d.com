import * as THREE from 'three';
import { SupportType } from '@/backend/domain/slicing';
import { SampleModelId } from '@/backend/domain/sample-models';

interface SupportBranchSpec {
  bedX: number;
  bedZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  trunkRadius: number;
  padRadius?: number;
}

export class SupportBuilder {
  /**
   * Builds authentic, realistic Slicer Support Structures (Tree Support & Normal Support)
   * Designed in local coordinate space where Y = 0 is the build plate surface.
   */
  static buildSupports(
    type: SupportType,
    modelId: SampleModelId,
    clipPlane?: THREE.Plane,
    customGroup?: THREE.Group
  ): THREE.Group {
    const group = new THREE.Group();
    if (type === 'none') return group;

    // A. Main Slicer Trunk Material (Translucent emerald green for tree, cyan for normal)
    const trunkMat = new THREE.MeshStandardMaterial({
      color: type === 'tree' ? 0x10b981 : 0x06b6d4, // Bambu Studio Tree Green vs Normal Cyan
      roughness: 0.35,
      metalness: 0.08,
      transparent: true,
      opacity: 0.85,
      clippingPlanes: clipPlane ? [clipPlane] : [],
      clipShadows: true,
      side: THREE.DoubleSide,
    });

    // B. Support Interface Material (Lighter mint/ice color where support contacts model)
    const interfaceMat = new THREE.MeshStandardMaterial({
      color: type === 'tree' ? 0x6ee7b7 : 0xa5f3fc, // Mint interface pad
      roughness: 0.45,
      metalness: 0.05,
      transparent: true,
      opacity: 0.95,
      clippingPlanes: clipPlane ? [clipPlane] : [],
      clipShadows: true,
      side: THREE.DoubleSide,
    });

    // C. Bed Brim Material (Darker green adhesion disc on bed)
    const brimMat = new THREE.MeshStandardMaterial({
      color: type === 'tree' ? 0x047857 : 0x0891b2,
      roughness: 0.6,
      transparent: true,
      opacity: 0.9,
      clippingPlanes: clipPlane ? [clipPlane] : [],
    });

    if (type === 'tree') {
      return this.buildRealisticTreeSupport(modelId, trunkMat, interfaceMat, brimMat, customGroup);
    } else {
      return this.buildRealisticNormalSupport(modelId, trunkMat, interfaceMat, brimMat, customGroup);
    }
  }

  /**
   * 1. Realistic Organic Tree Support (Bambu Studio / OrcaSlicer Style)
   * Hugs the exact underside overhangs from the build plate (Y=0) without touching print-in-place joints.
   */
  private static buildRealisticTreeSupport(
    modelId: SampleModelId,
    trunkMat: THREE.Material,
    interfaceMat: THREE.Material,
    brimMat: THREE.Material,
    customGroup?: THREE.Group
  ): THREE.Group {
    const group = new THREE.Group();
    const branches = this.getBranchSpecs(modelId, customGroup);

    branches.forEach((b) => {
      // 1. Bed Brim Disc (Đế bám bàn in rộng chống bong mép - Brim 5mm)
      const brimRadius = b.trunkRadius * 3.0;
      const brimGeo = new THREE.CylinderGeometry(brimRadius, brimRadius * 1.1, 0.02, 24);
      const brim = new THREE.Mesh(brimGeo, brimMat);
      brim.position.set(b.bedX, 0.01, b.bedZ);
      group.add(brim);

      // 2. Flared Trunk Foot (Chân trụ mở rộng)
      const footGeo = new THREE.CylinderGeometry(b.trunkRadius * 1.3, brimRadius * 0.8, 0.06, 24);
      const foot = new THREE.Mesh(footGeo, trunkMat);
      foot.position.set(b.bedX, 0.04, b.bedZ);
      group.add(foot);

      // 3. Smooth Organic Curving Trunk (Thân cây hữu cơ uốn lượn tự nhiên)
      const p0 = new THREE.Vector3(b.bedX, 0.06, b.bedZ);
      const p1 = new THREE.Vector3(
        b.bedX * 0.8 + b.targetX * 0.2,
        b.targetY * 0.25,
        b.bedZ * 0.8 + b.targetZ * 0.2
      );
      const p2 = new THREE.Vector3(
        b.bedX * 0.45 + b.targetX * 0.55,
        b.targetY * 0.6,
        b.bedZ * 0.45 + b.targetZ * 0.55
      );
      const p3 = new THREE.Vector3(
        b.bedX * 0.15 + b.targetX * 0.85,
        b.targetY * 0.88,
        b.bedZ * 0.15 + b.targetZ * 0.85
      );
      const p4 = new THREE.Vector3(b.targetX, b.targetY - 0.02, b.targetZ);

      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4]);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, b.trunkRadius, 14, false);
      const tube = new THREE.Mesh(tubeGeo, trunkMat);
      tube.castShadow = true;
      tube.receiveShadow = true;
      group.add(tube);

      // 4. Support Interface Contact Pad (Đệm tiếp xúc phẳng màu xanh sáng ôm sát đáy chi tiết)
      const padR = b.padRadius || b.trunkRadius * 1.8;
      const padGeo = new THREE.CylinderGeometry(padR, padR * 0.85, 0.03, 20);
      const pad = new THREE.Mesh(padGeo, interfaceMat);
      pad.position.set(b.targetX, b.targetY - 0.015, b.targetZ);
      group.add(pad);
    });

    return group;
  }

  /**
   * 2. Realistic Normal Support (Grid/Pillar Column with Interface Roof)
   */
  private static buildRealisticNormalSupport(
    modelId: SampleModelId,
    trunkMat: THREE.Material,
    interfaceMat: THREE.Material,
    brimMat: THREE.Material,
    customGroup?: THREE.Group
  ): THREE.Group {
    const group = new THREE.Group();
    const branches = this.getBranchSpecs(modelId, customGroup);

    branches.forEach((b) => {
      const colWidth = b.trunkRadius * 2.2;
      const height = Math.max(0.1, b.targetY - 0.03);

      // Bed Brim Base
      const baseGeo = new THREE.BoxGeometry(colWidth * 2.0, 0.02, colWidth * 2.0);
      const base = new THREE.Mesh(baseGeo, brimMat);
      base.position.set(b.targetX, 0.01, b.targetZ);
      group.add(base);

      // Main Vertical Column
      const colGeo = new THREE.BoxGeometry(colWidth, height, colWidth);
      const col = new THREE.Mesh(colGeo, trunkMat);
      col.position.set(b.targetX, height / 2 + 0.02, b.targetZ);
      group.add(col);

      // Horizontal Reinforcement Ribs (Accordion pattern)
      const ribCount = Math.floor(height / 0.25);
      for (let i = 1; i <= ribCount; i++) {
        const ribGeo = new THREE.BoxGeometry(colWidth * 1.35, 0.02, colWidth * 1.35);
        const rib = new THREE.Mesh(ribGeo, trunkMat);
        rib.position.set(b.targetX, i * 0.25, b.targetZ);
        group.add(rib);
      }

      // Top Interface Pad
      const padGeo = new THREE.BoxGeometry(colWidth * 1.6, 0.03, colWidth * 1.6);
      const pad = new THREE.Mesh(padGeo, interfaceMat);
      pad.position.set(b.targetX, b.targetY - 0.015, b.targetZ);
      group.add(pad);
    });

    return group;
  }

  /**
   * Quét hình học 3D thực tế của mô hình tải lên (custom .3MF / .STL / .OBJ) để sinh các nhánh
   * Organic Tree Support ôm sát đúng vùng Overhang và biên dạng của mô hình.
   */
  private static extractCustomGroupBranchSpecs(customGroup?: THREE.Group): SupportBranchSpec[] {
    if (customGroup) {
      customGroup.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(customGroup);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const minY = isFinite(box.min.y) ? box.min.y : 0;
      const height = Math.max(0.4, isFinite(size.y) && size.y > 0.05 ? size.y : 1.4);
      const halfX = Math.max(0.35, isFinite(size.x) && size.x > 0.05 ? size.x * 0.5 : 0.75);
      const halfZ = Math.max(0.35, isFinite(size.z) && size.z > 0.05 ? size.z * 0.5 : 0.75);

      const sectors = 8;
      const bestTargets: Array<{ x: number; y: number; z: number; score: number } | null> =
        new Array(sectors).fill(null);

      const pA = new THREE.Vector3();
      const pB = new THREE.Vector3();
      const pC = new THREE.Vector3();
      const e1 = new THREE.Vector3();
      const e2 = new THREE.Vector3();
      const norm = new THREE.Vector3();

      customGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const geom = mesh.geometry;
          if (!geom || !geom.attributes.position) return;
          const pos = geom.attributes.position;
          const idx = geom.index;
          const triCount = Math.floor((idx ? idx.count : pos.count) / 3);
          const stride = Math.max(1, Math.floor(triCount / 4000));
          const mat = mesh.matrixWorld;

          for (let t = 0; t < triCount; t += stride) {
            const i0 = idx ? idx.getX(t * 3) : t * 3;
            const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
            const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;

            pA.fromBufferAttribute(pos, i0).applyMatrix4(mat);
            pB.fromBufferAttribute(pos, i1).applyMatrix4(mat);
            pC.fromBufferAttribute(pos, i2).applyMatrix4(mat);

            e1.subVectors(pB, pA);
            e2.subVectors(pC, pA);
            norm.crossVectors(e1, e2);
            const len = norm.length();
            if (len < 1e-6) continue;
            norm.divideScalar(len);

            const mx = (pA.x + pB.x + pC.x) / 3;
            const my = (pA.y + pB.y + pC.y) / 3 - minY;
            const mz = (pA.z + pB.z + pC.z) / 3;

            if (my < height * 0.16 || my > height * 0.88) continue;
            if (norm.y > 0.25) continue;

            const dx = mx - center.x;
            const dz = mz - center.z;
            const distR = Math.hypot(dx, dz);
            if (distR < 0.08) continue;

            let sIdx = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * sectors);
            sIdx = Math.max(0, Math.min(sectors - 1, sIdx));

            const overhangBonus = norm.y < -0.25 ? (-norm.y) * 3.0 : 0.4;
            const score = overhangBonus + distR * 0.8;
            const cur = bestTargets[sIdx];
            if (!cur || score > cur.score) {
              bestTargets[sIdx] = { x: mx, y: my, z: mz, score };
            }
          }
        }
      });

      const foundSpecs: SupportBranchSpec[] = [];
      for (let s = 0; s < sectors; s++) {
        const tgt = bestTargets[s];
        if (!tgt) continue;
        const dx = tgt.x - center.x;
        const dz = tgt.z - center.z;
        const dist = Math.hypot(dx, dz) || 1;
        const nx = dx / dist;
        const nz = dz / dist;
        const bedOffset = Math.max(0.22, Math.min(0.42, tgt.y * 0.32));
        foundSpecs.push({
          bedX: tgt.x + nx * bedOffset,
          bedZ: tgt.z + nz * bedOffset,
          targetX: tgt.x,
          targetY: Math.max(0.22, tgt.y),
          targetZ: tgt.z,
          trunkRadius: 0.068,
          padRadius: 0.135,
        });
      }

      if (foundSpecs.length >= 4) {
        return foundSpecs;
      }

      // Fallback theo đúng kích thước Bounding Box của customGroup
      const targetH = Math.max(0.32, height * 0.52);
      return [
        { bedX: 0, bedZ: halfZ + 0.28, targetX: 0, targetY: targetH, targetZ: halfZ * 0.88, trunkRadius: 0.068, padRadius: 0.135 },
        { bedX: 0, bedZ: -(halfZ + 0.28), targetX: 0, targetY: targetH, targetZ: -halfZ * 0.88, trunkRadius: 0.068, padRadius: 0.135 },
        { bedX: halfX + 0.28, bedZ: 0, targetX: halfX * 0.88, targetY: targetH, targetZ: 0, trunkRadius: 0.068, padRadius: 0.135 },
        { bedX: -(halfX + 0.28), bedZ: 0, targetX: -halfX * 0.88, targetY: targetH, targetZ: 0, trunkRadius: 0.068, padRadius: 0.135 },
        { bedX: halfX * 0.85, bedZ: halfZ * 0.85, targetX: halfX * 0.65, targetY: targetH * 1.15, targetZ: halfZ * 0.65, trunkRadius: 0.062, padRadius: 0.125 },
        { bedX: -halfX * 0.85, bedZ: -halfZ * 0.85, targetX: -halfX * 0.65, targetY: targetH * 1.15, targetZ: -halfZ * 0.65, trunkRadius: 0.062, padRadius: 0.125 },
      ];
    }

    return [
      { bedX: 0, bedZ: 0.92, targetX: 0, targetY: 0.58, targetZ: 0.68, trunkRadius: 0.068, padRadius: 0.135 },
      { bedX: 0, bedZ: -0.92, targetX: 0, targetY: 0.58, targetZ: -0.68, trunkRadius: 0.068, padRadius: 0.135 },
      { bedX: 0.92, bedZ: 0, targetX: 0.68, targetY: 0.58, targetZ: 0, trunkRadius: 0.068, padRadius: 0.135 },
      { bedX: -0.92, bedZ: 0, targetX: -0.68, targetY: 0.58, targetZ: 0, trunkRadius: 0.068, padRadius: 0.135 },
    ];
  }

  /**
   * Precise overhang specifications calculated from 3D model geometry coordinates
   */
  private static getBranchSpecs(modelId: SampleModelId, customGroup?: THREE.Group): SupportBranchSpec[] {
    if (customGroup || modelId === 'custom') {
      return this.extractCustomGroupBranchSpecs(customGroup);
    }
    switch (modelId) {
      case 'dragon':
        // Crystal Dragon: Tree supports sprout outside the model and gently curve in
        // to touch the chin & horn tips from below.
        // Body joints remain 100% UNTOUCHED to protect print-in-place articulation!
        return [
          // 1. Chin Support (Mọc phía trước mõm bàn in, vươn cong đỡ chính xác mặt dưới hàm rồng)
          {
            bedX: 0,
            bedZ: 2.08,
            targetX: 0,
            targetY: 0.40,
            targetZ: 1.80,
            trunkRadius: 0.075,
            padRadius: 0.15,
          },
          // 2. Horn Left (Mọc từ bàn in bên sườn trái, vươn lên đỡ góc nhọn sừng rồng)
          {
            bedX: -0.72,
            bedZ: 0.88,
            targetX: -0.40,
            targetY: 0.90,
            targetZ: 0.86,
            trunkRadius: 0.065,
            padRadius: 0.13,
          },
          // 3. Horn Right (Mọc từ bàn in bên sườn phải, vươn lên đỡ góc nhọn sừng phải)
          {
            bedX: 0.72,
            bedZ: 0.88,
            targetX: 0.40,
            targetY: 0.90,
            targetZ: 0.86,
            trunkRadius: 0.065,
            padRadius: 0.13,
          },
        ];

      case 'benchy':
        // 3DBenchy: Support only genuine overhangs (Hawsepipe bow & cabin arches)
        return [
          // 1. Hawsepipe (Lỗ xỏ neo mũi thuyền nhô ra phía trước)
          {
            bedX: 0,
            bedZ: 1.68,
            targetX: 0,
            targetY: 0.46,
            targetZ: 1.44,
            trunkRadius: 0.07,
            padRadius: 0.14,
          },
          // 2. Vòm cửa cabin mạn trái
          {
            bedX: -0.66,
            bedZ: -0.10,
            targetX: -0.38,
            targetY: 1.35,
            targetZ: -0.10,
            trunkRadius: 0.075,
            padRadius: 0.14,
          },
          // 3. Vòm cửa cabin mạn phải
          {
            bedX: 0.66,
            bedZ: -0.10,
            targetX: 0.38,
            targetY: 1.35,
            targetZ: -0.10,
            trunkRadius: 0.075,
            padRadius: 0.14,
          },
          // 4. Vòm cửa sổ sau đuôi cabin
          {
            bedX: 0,
            bedZ: -0.90,
            targetX: 0,
            targetY: 1.15,
            targetZ: -0.58,
            trunkRadius: 0.07,
            padRadius: 0.13,
          },
          // 5. Mép trên cửa sổ cabin phía trước
          {
            bedX: 0,
            bedZ: 0.65,
            targetX: 0,
            targetY: 1.38,
            targetZ: 0.36,
            trunkRadius: 0.065,
            padRadius: 0.12,
          },
        ];

      case 'robot':
        // Retro Bot: Support under elbows and visor/chin
        return [
          // 1. Cùi chỏ tay trái
          {
            bedX: -0.92,
            bedZ: 0,
            targetX: -0.68,
            targetY: 0.38,
            targetZ: 0,
            trunkRadius: 0.07,
            padRadius: 0.14,
          },
          // 2. Cùi chỏ tay phải
          {
            bedX: 0.92,
            bedZ: 0,
            targetX: 0.68,
            targetY: 0.38,
            targetZ: 0,
            trunkRadius: 0.07,
            padRadius: 0.14,
          },
          // 3. Cằm ngực & màn hình kính mắt
          {
            bedX: 0,
            bedZ: 0.82,
            targetX: 0,
            targetY: 1.34,
            targetZ: 0.36,
            trunkRadius: 0.08,
            padRadius: 0.16,
          },
        ];

      case 'helmet':
        // Cyberpunk Mecha Helmet: Dedicated tree supports around visor, chin beak and ear comms
        return [
          // 1. Chin Beak / Respirator Filter (Vòm cằm lọc thở góc cạnh)
          {
            bedX: 0,
            bedZ: 1.35,
            targetX: 0,
            targetY: 0.55,
            targetZ: 1.10,
            trunkRadius: 0.08,
            padRadius: 0.17,
          },
          // 2. Left Cheek Armor Overhang (Mặt dưới ốp má trái)
          {
            bedX: -1.15,
            bedZ: 0.55,
            targetX: -0.85,
            targetY: 0.70,
            targetZ: 0.50,
            trunkRadius: 0.07,
            padRadius: 0.14,
          },
          // 3. Right Cheek Armor Overhang (Mặt dưới ốp má phải)
          {
            bedX: 1.15,
            bedZ: 0.55,
            targetX: 0.85,
            targetY: 0.70,
            targetZ: 0.50,
            trunkRadius: 0.07,
            padRadius: 0.14,
          },
          // 4. Left Ear Comm Puck (Cụm tai nghe bên trái)
          {
            bedX: -1.45,
            bedZ: 0,
            targetX: -1.12,
            targetY: 1.10,
            targetZ: 0,
            trunkRadius: 0.075,
            padRadius: 0.15,
          },
          // 5. Right Ear Comm Puck (Cụm tai nghe bên phải)
          {
            bedX: 1.45,
            bedZ: 0,
            targetX: 1.12,
            targetY: 1.10,
            targetZ: 0,
            trunkRadius: 0.075,
            padRadius: 0.15,
          },
          // 6. Rear Neck Flange (Vành cổ nón sau gáy)
          {
            bedX: 0,
            bedZ: -1.25,
            targetX: 0,
            targetY: 0.38,
            targetZ: -0.95,
            trunkRadius: 0.07,
            padRadius: 0.14,
          },
        ];

      case 'turbine':
        // Jet Engine Turbofan: Dedicated support for cylindrical nacelle lip & bellies
        return [
          // 1. Front Nacelle Intake Lower Lip (Mép dưới miệng hút gió trước)
          {
            bedX: 0,
            bedZ: 1.05,
            targetX: 0,
            targetY: 0.65,
            targetZ: 0.68,
            trunkRadius: 0.08,
            padRadius: 0.18,
          },
          // 2. Left Nacelle Belly Flange (Bụng vỏ động cơ mạn trái)
          {
            bedX: -1.15,
            bedZ: 0,
            targetX: -0.85,
            targetY: 0.75,
            targetZ: 0,
            trunkRadius: 0.075,
            padRadius: 0.16,
          },
          // 3. Right Nacelle Belly Flange (Bụng vỏ động cơ mạn phải)
          {
            bedX: 1.15,
            bedZ: 0,
            targetX: 0.85,
            targetY: 0.75,
            targetZ: 0,
            trunkRadius: 0.075,
            padRadius: 0.16,
          },
          // 4. Rear Exhaust Lip (Mép dưới miệng xả phản lực sau)
          {
            bedX: 0,
            bedZ: -1.05,
            targetX: 0,
            targetY: 0.65,
            targetZ: -0.68,
            trunkRadius: 0.08,
            padRadius: 0.18,
          },
        ];

      case 'eiffel':
        // Paris Eiffel Tower: Tree support under the central 1st floor grand archway
        return [
          // 1. Center Grand Arch Ceiling (Mặt trần vòm trung tâm tầng 1)
          {
            bedX: 0,
            bedZ: 0,
            targetX: 0,
            targetY: 0.92,
            targetZ: 0,
            trunkRadius: 0.09,
            padRadius: 0.22,
          },
          // 2. Front Arch Apex (Đỉnh vòm mặt trước)
          {
            bedX: 0,
            bedZ: 0.75,
            targetX: 0,
            targetY: 0.86,
            targetZ: 0.58,
            trunkRadius: 0.07,
            padRadius: 0.14,
          },
          // 3. Rear Arch Apex (Đỉnh vòm mặt sau)
          {
            bedX: 0,
            bedZ: -0.75,
            targetX: 0,
            targetY: 0.86,
            targetZ: -0.58,
            trunkRadius: 0.07,
            padRadius: 0.14,
          },
          // 4. Left Arch Apex (Đỉnh vòm bên trái)
          {
            bedX: -0.75,
            bedZ: 0,
            targetX: -0.58,
            targetY: 0.86,
            targetZ: 0,
            trunkRadius: 0.07,
            padRadius: 0.14,
          },
          // 5. Right Arch Apex (Đỉnh vòm bên phải)
          {
            bedX: 0.75,
            bedZ: 0,
            targetX: 0.58,
            targetY: 0.86,
            targetZ: 0,
            trunkRadius: 0.07,
            padRadius: 0.14,
          },
        ];

      case 'gear':
      default:
        return this.extractCustomGroupBranchSpecs(customGroup);
    }
  }
}
