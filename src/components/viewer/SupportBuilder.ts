import * as THREE from 'three';
import { SupportType } from '@/backend/domain/slicing';
import { SampleModelId } from '@/backend/domain/sample-models';

interface SupportSubTwigSpec {
  x: number;
  y: number;
  z: number;
  normal?: [number, number, number];
}

interface SupportBranchSpec {
  bedX: number;
  bedZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  trunkRadius: number;
  padRadius?: number;
  targetNormal?: [number, number, number];
  subTargets?: SupportSubTwigSpec[];
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
   * Sweeps a smooth, watertight, continuously tapered organic branch mesh along a 3D curve
   * using Parallel-Transport frames (no constant-radius pipe look, zero SphereGeometry ball joints).
   */
  private static createTaperedOrganicBranchGeometry(
    curve: THREE.Curve<THREE.Vector3>,
    tubularSegments: number,
    radialSegments: number,
    radiusStart: number,
    radiusEnd: number,
    flareRoot: boolean
  ): THREE.BufferGeometry {
    const frames = curve.computeFrenetFrames(tubularSegments, false);
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    const pt = new THREE.Vector3();
    const normalVec = new THREE.Vector3();

    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      curve.getPointAt(t, pt);

      // Area-preserving smooth organic taper + optional root flare near build plate
      const smoothT = t * t * (3 - 2 * t);
      let radius = radiusStart * (1 - smoothT) + radiusEnd * smoothT;
      if (flareRoot && t < 0.16) {
        const flareFactor = 1 - t / 0.16;
        radius += radiusStart * 0.42 * flareFactor * flareFactor;
      }

      const N = frames.normals[i];
      const B = frames.binormals[i];

      for (let j = 0; j <= radialSegments; j++) {
        const theta = (j / radialSegments) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        normalVec.set(
          cosT * N.x + sinT * B.x,
          cosT * N.y + sinT * B.y,
          cosT * N.z + sinT * B.z
        ).normalize();

        positions.push(
          pt.x + radius * normalVec.x,
          pt.y + radius * normalVec.y,
          pt.z + radius * normalVec.z
        );
        normals.push(normalVec.x, normalVec.y, normalVec.z);
      }
    }

    const stride = radialSegments + 1;
    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * stride + j;
        const b = (i + 1) * stride + j;
        const c = (i + 1) * stride + (j + 1);
        const d = i * stride + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    // Cap tip cleanly
    const tipCenterIdx = positions.length / 3;
    curve.getPointAt(1, pt);
    const endTan = frames.tangents[tubularSegments];
    positions.push(pt.x, pt.y, pt.z);
    normals.push(endTan.x, endTan.y, endTan.z);
    const lastRingOffset = tubularSegments * stride;
    for (let j = 0; j < radialSegments; j++) {
      indices.push(lastRingOffset + j, lastRingOffset + j + 1, tipCenterIdx);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    return geo;
  }

  /**
   * Conforms the support interface roof slightly to the overhang surface normal (clamped <= 26 deg).
   */
  private static orientInterfacePad(pad: THREE.Mesh, normal?: [number, number, number]): void {
    if (!normal) return;
    const up = new THREE.Vector3(0, 1, 0);
    // Support roof faces opposite to the downward overhang normal
    const targetDir = new THREE.Vector3(-normal[0] * 0.42, Math.max(0.86, -normal[1]), -normal[2] * 0.42).normalize();
    pad.quaternion.setFromUnitVectors(up, targetDir);
  }

  /**
   * 1. Realistic Organic Tree Support 2.0 (Bambu Studio / OrcaSlicer Style)
   * Tapered root-to-capillary organic trunks with tangent-continuous Y-merges (zero sphere ball joints).
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
      const subCount = b.subTargets ? b.subTargets.length : b.targetY > 0.36 ? 2 : 0;
      const rootBoost = 1 + Math.min(0.45, subCount * 0.14);
      const rootRadius = b.trunkRadius * 1.38 * rootBoost;
      const tipRadius = Math.max(0.024, b.trunkRadius * 0.46);

      // 1. Concentric First-Layer Brim Disc (Đế bám bàn rộng mỏng chuẩn Bambu Layer 0)
      const brimRadius = rootRadius * 2.35;
      const brimGeo = new THREE.CylinderGeometry(brimRadius * 0.96, brimRadius, 0.014, 28);
      const brim = new THREE.Mesh(brimGeo, brimMat);
      brim.position.set(b.bedX, 0.007, b.bedZ);
      group.add(brim);

      // 2. Smooth Tapered Organic Trunk (Thân cây vuốt thon tự nhiên từ gốc phình lên ngọn mao dẫn)
      const p0 = new THREE.Vector3(b.bedX, 0.012, b.bedZ);
      const p1 = new THREE.Vector3(
        b.bedX * 0.84 + b.targetX * 0.16,
        b.targetY * 0.24,
        b.bedZ * 0.84 + b.targetZ * 0.16
      );
      const p2 = new THREE.Vector3(
        b.bedX * 0.48 + b.targetX * 0.52,
        b.targetY * 0.58,
        b.bedZ * 0.48 + b.targetZ * 0.52
      );
      const p3 = new THREE.Vector3(
        b.bedX * 0.14 + b.targetX * 0.86,
        b.targetY * 0.86,
        b.bedZ * 0.14 + b.targetZ * 0.86
      );
      const p4 = new THREE.Vector3(b.targetX, Math.max(0.06, b.targetY - 0.014), b.targetZ);

      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4]);
      const trunkGeo = this.createTaperedOrganicBranchGeometry(
        curve,
        34,
        14,
        rootRadius,
        tipRadius,
        true
      );
      const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
      trunkMesh.castShadow = true;
      trunkMesh.receiveShadow = true;
      group.add(trunkMesh);

      // 3. Fine Conformal Support Interface Roof (Đệm lưới tiếp xúc mỏng ôm sát mặt dưới chi tiết)
      const padR = Math.min(b.padRadius || b.trunkRadius * 1.45, tipRadius * 2.25);
      const padGeo = new THREE.CylinderGeometry(padR, tipRadius * 1.05, 0.018, 18);
      const pad = new THREE.Mesh(padGeo, interfaceMat);
      pad.position.set(b.targetX, Math.max(0.05, b.targetY - 0.009), b.targetZ);
      this.orientInterfacePad(pad, b.targetNormal);
      group.add(pad);

      // 4. Tangent-Continuous Capillary Twigs (Nhánh con tách mượt theo tiếp tuyến thân mẹ — KHÔNG dùng khối cầu nối)
      let twigs: SupportSubTwigSpec[] = b.subTargets ? [...b.subTargets] : [];
      if (twigs.length === 0 && b.targetY > 0.36) {
        const rdx = b.targetX - b.bedX;
        const rdz = b.targetZ - b.bedZ;
        const rLen = Math.hypot(rdx, rdz) || 1;
        const tanX = -rdz / rLen;
        const tanZ = rdx / rLen;
        const spread = Math.max(0.11, Math.min(0.22, b.targetY * 0.15));
        twigs = [-1, 1].map((side) => ({
          x: b.targetX + tanX * spread * side,
          y: Math.max(0.22, b.targetY - 0.022),
          z: b.targetZ + tanZ * spread * side,
          normal: b.targetNormal,
        }));
      }

      twigs.forEach((sub, idx) => {
        // Fork height adapts naturally below the twig tip so branches always grow strictly upward
        const ratioY = Math.min(0.72, Math.max(0.36, (sub.y / Math.max(0.25, b.targetY)) * 0.58 - idx * 0.04));
        const splitPt = curve.getPointAt(ratioY);
        const splitTan = curve.getTangentAt(ratioY);

        // Exact parent radius at split point -> seamless biological Y-crotch inside parent bark
        const sT = ratioY * ratioY * (3 - 2 * ratioY);
        const parentRadiusAtSplit = rootRadius * (1 - sT) + tipRadius * sT;
        const subStartRadius = parentRadiusAtSplit * 0.84;
        const subTipRadius = Math.max(0.021, tipRadius * 0.88);

        const spanY = Math.max(0.08, sub.y - splitPt.y);
        const c1 = splitPt.clone().addScaledVector(splitTan, spanY * 0.32);
        const c2 = new THREE.Vector3(
          splitPt.x * 0.25 + sub.x * 0.75,
          splitPt.y + spanY * 0.72,
          splitPt.z * 0.25 + sub.z * 0.75
        );
        const subEnd = new THREE.Vector3(sub.x, Math.max(0.06, sub.y - 0.012), sub.z);

        const subCurve = new THREE.CatmullRomCurve3([splitPt, c1, c2, subEnd]);
        const subGeo = this.createTaperedOrganicBranchGeometry(
          subCurve,
          22,
          11,
          subStartRadius,
          subTipRadius,
          false
        );
        const subMesh = new THREE.Mesh(subGeo, trunkMat);
        subMesh.castShadow = true;
        subMesh.receiveShadow = true;
        group.add(subMesh);

        const subPadR = subTipRadius * 2.05;
        const subPadGeo = new THREE.CylinderGeometry(subPadR, subTipRadius * 1.04, 0.016, 16);
        const subPad = new THREE.Mesh(subPadGeo, interfaceMat);
        subPad.position.set(sub.x, Math.max(0.05, sub.y - 0.008), sub.z);
        this.orientInterfacePad(subPad, sub.normal);
        group.add(subPad);
      });
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
   * Quét hình học 3D thực tế của mô hình tải lên (custom .3MF / .STL / .OBJ):
   * - Lọc đúng mặt Overhang hướng xuống (norm.y < -0.34, tương đương góc vượt ngưỡng tự đỡ)
   * - Gom cụm không gian thành tối đa 42 nhánh mao dẫn phân bổ trên 10–14 gốc cây hữu cơ ngoài biên dạng đáy.
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

      const hullBins = 36;
      const sectorHullRadius = new Float32Array(hullBins);

      // Spatial voxel map for fine overhang patches
      const cellSize = Math.max(0.11, Math.min(halfX, halfZ) * 0.24);
      const patchMap = new Map<
        string,
        {
          x: number;
          y: number;
          z: number;
          nx: number;
          ny: number;
          nz: number;
          weight: number;
        }
      >();

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
          const stride = Math.max(1, Math.floor(triCount / 16000));
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
            const doubleArea = norm.length();
            if (doubleArea < 1e-6) continue;
            norm.divideScalar(doubleArea);

            const mx = (pA.x + pB.x + pC.x) / 3;
            const my = (pA.y + pB.y + pC.y) / 3 - minY;
            const mz = (pA.z + pB.z + pC.z) / 3;

            const dx = mx - center.x;
            const dz = mz - center.z;
            const distR = Math.hypot(dx, dz);

            let hBin = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * hullBins);
            hBin = Math.max(0, Math.min(hullBins - 1, hBin));
            // Track lower-body hull radius so tree roots always plant outside the model footprint
            if (my < height * 0.72 && distR > sectorHullRadius[hBin]) {
              sectorHullRadius[hBin] = distR;
            }

            // Ignore bed contact layer and upward/vertical self-supporting walls
            if (my < Math.max(0.08, height * 0.08) || my > height * 0.96) continue;
            if (norm.y > -0.34) continue;

            const key = `${Math.round(mx / cellSize)}_${Math.round(my / (cellSize * 1.15))}_${Math.round(mz / cellSize)}`;
            const w = (-norm.y) * Math.sqrt(doubleArea) * (1 + distR * 0.35);
            const existing = patchMap.get(key);
            if (!existing) {
              patchMap.set(key, {
                x: mx * w,
                y: my * w,
                z: mz * w,
                nx: norm.x * w,
                ny: norm.y * w,
                nz: norm.z * w,
                weight: w,
              });
            } else {
              existing.x += mx * w;
              existing.y += my * w;
              existing.z += mz * w;
              existing.nx += norm.x * w;
              existing.ny += norm.y * w;
              existing.nz += norm.z * w;
              existing.weight += w;
            }
          }
        }
      });

      const patches = Array.from(patchMap.values())
        .map((p) => {
          const inv = 1 / Math.max(1e-6, p.weight);
          const nx = p.nx * inv;
          const ny = p.ny * inv;
          const nz = p.nz * inv;
          const nLen = Math.hypot(nx, ny, nz) || 1;
          return {
            x: p.x * inv,
            y: p.y * inv,
            z: p.z * inv,
            normal: [nx / nLen, ny / nLen, nz / nLen] as [number, number, number],
            weight: p.weight,
          };
        })
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 42);

      if (patches.length > 0) {
        // Group up to 42 fine overhang patches onto 14 shared organic multi-twig trunks
        const used = new Uint8Array(patches.length);
        const clusterMergeDist = Math.max(0.22, Math.min(halfX, halfZ) * 0.46);
        const foundSpecs: SupportBranchSpec[] = [];

        for (let i = 0; i < patches.length && foundSpecs.length < 14; i++) {
          if (used[i]) continue;
          used[i] = 1;
          const primary = patches[i];
          const subTargets: SupportSubTwigSpec[] = [];

          for (let j = i + 1; j < patches.length && subTargets.length < 3; j++) {
            if (used[j]) continue;
            const cand = patches[j];
            const dXZ = Math.hypot(cand.x - primary.x, cand.z - primary.z);
            const dY = Math.abs(cand.y - primary.y);
            if (dXZ <= clusterMergeDist && dY <= height * 0.28) {
              used[j] = 1;
              subTargets.push({
                x: cand.x,
                y: Math.max(0.16, cand.y),
                z: cand.z,
                normal: cand.normal,
              });
            }
          }

          // Compute escape direction to exterior build plate beyond lower-body hull
          let dx = primary.x - center.x;
          let dz = primary.z - center.z;
          let dist = Math.hypot(dx, dz);
          if (dist < 0.04) {
            const fallbackAngle = (foundSpecs.length / 8) * Math.PI * 2;
            dx = Math.cos(fallbackAngle);
            dz = Math.sin(fallbackAngle);
            dist = 1;
          }
          const dirX = dx / dist;
          const dirZ = dz / dist;

          let hBin = Math.floor(((Math.atan2(dirZ, dirX) + Math.PI) / (Math.PI * 2)) * hullBins);
          hBin = Math.max(0, Math.min(hullBins - 1, hBin));
          const prevBin = (hBin + hullBins - 1) % hullBins;
          const nextBin = (hBin + 1) % hullBins;
          const localHullR = Math.max(
            dist,
            sectorHullRadius[hBin],
            sectorHullRadius[prevBin] * 0.92,
            sectorHullRadius[nextBin] * 0.92
          );

          const clearance = Math.max(0.14, Math.min(0.28, primary.y * 0.22));
          const safeBedR = localHullR + clearance;

          foundSpecs.push({
            bedX: center.x + dirX * safeBedR,
            bedZ: center.z + dirZ * safeBedR,
            targetX: primary.x,
            targetY: Math.max(0.18, primary.y),
            targetZ: primary.z,
            trunkRadius: Math.max(0.046, Math.min(0.068, Math.min(halfX, halfZ) * 0.085)),
            padRadius: 0.11,
            targetNormal: primary.normal,
            subTargets,
          });
        }

        if (foundSpecs.length > 0) {
          return foundSpecs;
        }
      }

      // Mô hình hoàn toàn thẳng đứng không có mặt Overhang > 40 độ:
      // Chỉ đặt 4 nhánh cân bằng mảnh quanh biên khi người dùng chủ động bật chế độ Tree Support
      const targetH = Math.max(0.28, height * 0.46);
      const slimR = Math.max(0.045, Math.min(0.06, Math.min(halfX, halfZ) * 0.075));
      return [
        { bedX: center.x, bedZ: center.z + halfZ + 0.22, targetX: center.x, targetY: targetH, targetZ: center.z + halfZ * 0.94, trunkRadius: slimR, padRadius: slimR * 1.7 },
        { bedX: center.x, bedZ: center.z - (halfZ + 0.22), targetX: center.x, targetY: targetH, targetZ: center.z - halfZ * 0.94, trunkRadius: slimR, padRadius: slimR * 1.7 },
        { bedX: center.x + halfX + 0.22, bedZ: center.z, targetX: center.x + halfX * 0.94, targetY: targetH, targetZ: center.z, trunkRadius: slimR, padRadius: slimR * 1.7 },
        { bedX: center.x - (halfX + 0.22), bedZ: center.z, targetX: center.x - halfX * 0.94, targetY: targetH, targetZ: center.z, trunkRadius: slimR, padRadius: slimR * 1.7 },
      ];
    }

    return [
      { bedX: 0, bedZ: 0.92, targetX: 0, targetY: 0.58, targetZ: 0.68, trunkRadius: 0.06, padRadius: 0.115 },
      { bedX: 0, bedZ: -0.92, targetX: 0, targetY: 0.58, targetZ: -0.68, trunkRadius: 0.06, padRadius: 0.115 },
      { bedX: 0.92, bedZ: 0, targetX: 0.68, targetY: 0.58, targetZ: 0, trunkRadius: 0.06, padRadius: 0.115 },
      { bedX: -0.92, bedZ: 0, targetX: -0.68, targetY: 0.58, targetZ: 0, trunkRadius: 0.06, padRadius: 0.115 },
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
