import * as THREE from 'three';

export interface ITriangle3D {
  ax: number; ay: number; az: number;
  bx: number; by: number; bz: number;
  cx: number; cy: number; cz: number;
}

export interface ISimpleContourLoop {
  signedAreaMm2: number;
  perimeterMm: number;
  bbox: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export interface ISimpleLayerSlice {
  layerIndex: number;
  heightY: number;
  contours: ISimpleContourLoop[];
  totalPerimeterMm: number;
  totalInfillMm: number;
}

export interface IGeometryFingerprint {
  trueVolumeCm3: number;
  surfaceAreaCm2: number;
  bedContactAreaMm2: number;
  bedFootprintHullMm2: number;
  comHeightRatio: number;
  overhangArea45Mm2: number;
  severeOverhangArea60Mm2: number;
  maxBridgeSpanMm: number;
  minNeckAreaMm2: number;
  minNeckHeightRatio: number;
  thinWallRatioPct: number;
  minLayerTimeSec: number;
  maxIslandsPerLayer: number;
  dimensionsMm: { x: number; y: number; z: number };
  centerOfMassMm: { x: number; y: number; z: number };
}

export function extractGeometryFingerprint(
  triangles: ITriangle3D[],
  layerSlices: ISimpleLayerSlice[] = [],
  referenceWallSpeedMmS: number = 120
): IGeometryFingerprint {
  if (triangles.length === 0) {
    return {
      trueVolumeCm3: 0,
      surfaceAreaCm2: 0,
      bedContactAreaMm2: 0,
      bedFootprintHullMm2: 0,
      comHeightRatio: 0,
      overhangArea45Mm2: 0,
      severeOverhangArea60Mm2: 0,
      maxBridgeSpanMm: 0,
      minNeckAreaMm2: 0,
      minNeckHeightRatio: 0.5,
      thinWallRatioPct: 0,
      minLayerTimeSec: 10,
      maxIslandsPerLayer: 1,
      dimensionsMm: { x: 0, y: 0, z: 0 },
      centerOfMassMm: { x: 0, y: 0, z: 0 },
    };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  let signedVolumeMm3 = 0;
  let totalSurfaceAreaMm2 = 0;
  let overhangArea45Mm2 = 0;
  let severeOverhangArea60Mm2 = 0;
  let maxBridgeSpanMm = 0;

  let comWeightedX = 0;
  let comWeightedY = 0;
  let comWeightedZ = 0;
  let bottomNearFaceAreaMm2 = 0;

  for (const t of triangles) {
    minX = Math.min(minX, t.ax, t.bx, t.cx);
    maxX = Math.max(maxX, t.ax, t.bx, t.cx);
    minY = Math.min(minY, t.ay, t.by, t.cy);
    maxY = Math.max(maxY, t.ay, t.by, t.cy);
    minZ = Math.min(minZ, t.az, t.bz, t.cz);
    maxZ = Math.max(maxZ, t.az, t.bz, t.cz);
  }

  const cos45 = Math.cos((45 * Math.PI) / 180);
  const cos60 = Math.cos((60 * Math.PI) / 180);

  for (const t of triangles) {
    const crossX = t.by * t.cz - t.bz * t.cy;
    const crossY = t.bz * t.cx - t.bx * t.cz;
    const crossZ = t.bx * t.cy - t.by * t.cx;
    const tetVol6 = t.ax * crossX + t.ay * crossY + t.az * crossZ;
    signedVolumeMm3 += tetVol6 / 6.0;

    comWeightedX += (tetVol6 / 6.0) * ((t.ax + t.bx + t.cx) / 4.0);
    comWeightedY += (tetVol6 / 6.0) * ((t.ay + t.by + t.cy) / 4.0);
    comWeightedZ += (tetVol6 / 6.0) * ((t.az + t.bz + t.cz) / 4.0);

    const abx = t.bx - t.ax, aby = t.by - t.ay, abz = t.bz - t.az;
    const acx = t.cx - t.ax, acy = t.cy - t.ay, acz = t.cz - t.az;
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    const normLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
    const triAreaMm2 = 0.5 * normLen;
    totalSurfaceAreaMm2 += triAreaMm2;

    if (normLen > 1e-6) {
      const unitNy = ny / normLen;
      const triMinY = Math.min(t.ay, t.by, t.cy);
      const triMaxY = Math.max(t.ay, t.by, t.cy);

      if (triMaxY <= minY + 0.5 && unitNy < -0.7) {
        bottomNearFaceAreaMm2 += triAreaMm2;
      }

      if (triMinY > minY + 0.45) {
        if (unitNy < -cos45) overhangArea45Mm2 += triAreaMm2;
        if (unitNy < -cos60) severeOverhangArea60Mm2 += triAreaMm2;
        if (unitNy < -0.94) {
          const e1 = Math.hypot(abx, abz);
          const e2 = Math.hypot(acx, acz);
          const e3 = Math.hypot(t.cx - t.bx, t.cz - t.bz);
          const span = Math.max(e1, e2, e3);
          if (span > maxBridgeSpanMm) maxBridgeSpanMm = span;
        }
      }
    }
  }

  const absVolumeMm3 = Math.abs(signedVolumeMm3);
  const trueVolumeCm3 = Number((absVolumeMm3 / 1000.0).toFixed(2));
  const surfaceAreaCm2 = Number((totalSurfaceAreaMm2 / 100.0).toFixed(2));

  const comX = absVolumeMm3 > 1e-3 ? comWeightedX / signedVolumeMm3 : (minX + maxX) / 2;
  const comY = absVolumeMm3 > 1e-3 ? Math.abs(comWeightedY / signedVolumeMm3) : (minY + maxY) / 2;
  const comZ = absVolumeMm3 > 1e-3 ? comWeightedZ / signedVolumeMm3 : (minZ + maxZ) / 2;

  const dimX = Math.max(0.1, maxX - minX);
  const dimY = Math.max(0.1, maxY - minY);
  const dimZ = Math.max(0.1, maxZ - minZ);

  let bedContactAreaMm2 = bottomNearFaceAreaMm2 > 0 ? bottomNearFaceAreaMm2 : dimX * dimZ * 0.35;
  let bedFootprintHullMm2 = dimX * dimZ;
  let minNeckAreaMm2 = Infinity;
  let minNeckHeightRatio = 0.5;
  let thinWallLayersCount = 0;
  let minLayerTimeSec = Infinity;
  let maxIslandsPerLayer = 1;

  const totalLayers = layerSlices.length;
  if (totalLayers > 0) {
    const bottomSlice = layerSlices[0];
    let sliceBottomArea = 0;
    let bMinX = Infinity, bMaxX = -Infinity, bMinZ = Infinity, bMaxZ = -Infinity;
    for (const c of bottomSlice.contours) {
      sliceBottomArea += Math.abs(c.signedAreaMm2);
      bMinX = Math.min(bMinX, c.bbox.minX);
      bMaxX = Math.max(bMaxX, c.bbox.maxX);
      bMinZ = Math.min(bMinZ, c.bbox.minZ);
      bMaxZ = Math.max(bMaxZ, c.bbox.maxZ);
    }
    if (sliceBottomArea > 0) bedContactAreaMm2 = sliceBottomArea;
    if (bMinX < Infinity) {
      bedFootprintHullMm2 = Math.max(1, (bMaxX - bMinX) * (bMaxZ - bMinZ));
    }

    for (let i = 0; i < totalLayers; i++) {
      const slice = layerSlices[i];
      const heightRatio = (i + 1) / totalLayers;
      const islands = slice.contours.length;
      if (islands > maxIslandsPerLayer) maxIslandsPerLayer = islands;

      let layerAreaMm2 = 0;
      for (const c of slice.contours) {
        layerAreaMm2 += Math.abs(c.signedAreaMm2);
      }

      if (heightRatio >= 0.15 && heightRatio <= 0.85 && layerAreaMm2 > 0) {
        if (layerAreaMm2 < minNeckAreaMm2) {
          minNeckAreaMm2 = layerAreaMm2;
          minNeckHeightRatio = Number(heightRatio.toFixed(2));
        }
      }

      if (slice.totalPerimeterMm > 5 && layerAreaMm2 / slice.totalPerimeterMm < 0.22) {
        thinWallLayersCount++;
      }

      if (heightRatio >= 0.7 && slice.totalPerimeterMm > 0) {
        const travelLengthMm = islands * 8;
        const layerTime =
          (slice.totalPerimeterMm + slice.totalInfillMm) / Math.max(20, referenceWallSpeedMmS) +
          travelLengthMm / 250;
        if (layerTime < minLayerTimeSec) {
          minLayerTimeSec = layerTime;
        }
      }
    }
  }

  if (minNeckAreaMm2 === Infinity) minNeckAreaMm2 = bedContactAreaMm2 * 0.65;
  if (minLayerTimeSec === Infinity) minLayerTimeSec = 7.5;

  const baseFootprintWidth = Math.max(
    4.0,
    bedFootprintHullMm2 > 0 ? Math.sqrt(bedFootprintHullMm2) : Math.min(dimX, dimZ)
  );
  const comHeightAboveBed = Math.max(1.0, comY - minY);
  const comHeightRatio = Number((comHeightAboveBed / baseFootprintWidth).toFixed(2));
  const thinWallRatioPct =
    totalLayers > 0 ? Number(((thinWallLayersCount / totalLayers) * 100).toFixed(1)) : 0;

  return {
    trueVolumeCm3,
    surfaceAreaCm2,
    bedContactAreaMm2: Number(bedContactAreaMm2.toFixed(1)),
    bedFootprintHullMm2: Number(bedFootprintHullMm2.toFixed(1)),
    comHeightRatio,
    overhangArea45Mm2: Number(overhangArea45Mm2.toFixed(1)),
    severeOverhangArea60Mm2: Number(severeOverhangArea60Mm2.toFixed(1)),
    maxBridgeSpanMm: Number(maxBridgeSpanMm.toFixed(1)),
    minNeckAreaMm2: Number(minNeckAreaMm2.toFixed(1)),
    minNeckHeightRatio,
    thinWallRatioPct,
    minLayerTimeSec: Number(minLayerTimeSec.toFixed(2)),
    maxIslandsPerLayer,
    dimensionsMm: {
      x: Number(dimX.toFixed(1)),
      y: Number(dimY.toFixed(1)),
      z: Number(dimZ.toFixed(1)),
    },
    centerOfMassMm: {
      x: Number(comX.toFixed(1)),
      y: Number(comY.toFixed(1)),
      z: Number(comZ.toFixed(1)),
    },
  };
}

export function extractFingerprintFromThreeObject(
  objectOrGeometry: THREE.BufferGeometry | THREE.Object3D,
  layerSlices: ISimpleLayerSlice[] = [],
  referenceWallSpeedMmS: number = 120
): IGeometryFingerprint {
  const triangles: ITriangle3D[] = [];

  const collectGeometry = (geom: THREE.BufferGeometry, matrixWorld?: THREE.Matrix4) => {
    const pos = geom.getAttribute('position');
    if (!pos) return;
    const index = geom.getIndex();
    const triCount = index ? Math.floor(index.count / 3) : Math.floor(pos.count / 3);
    const stride = triCount > 90000 ? Math.ceil(triCount / 60000) : 1;

    const va = new THREE.Vector3();
    const vb = new THREE.Vector3();
    const vc = new THREE.Vector3();

    for (let t = 0; t < triCount; t += stride) {
      const i0 = index ? index.getX(t * 3) : t * 3;
      const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

      va.fromBufferAttribute(pos, i0);
      vb.fromBufferAttribute(pos, i1);
      vc.fromBufferAttribute(pos, i2);

      if (matrixWorld) {
        va.applyMatrix4(matrixWorld);
        vb.applyMatrix4(matrixWorld);
        vc.applyMatrix4(matrixWorld);
      }

      triangles.push({
        ax: va.x, ay: va.y, az: va.z,
        bx: vb.x, by: vb.y, bz: vb.z,
        cx: vc.x, cy: vc.y, cz: vc.z,
      });
    }
  };

  if (objectOrGeometry instanceof THREE.BufferGeometry) {
    collectGeometry(objectOrGeometry);
  } else {
    objectOrGeometry.updateMatrixWorld(true);
    objectOrGeometry.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
        collectGeometry((child as THREE.Mesh).geometry, child.matrixWorld);
      }
    });
  }

  return extractGeometryFingerprint(triangles, layerSlices, referenceWallSpeedMmS);
}
