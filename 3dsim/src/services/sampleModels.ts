import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { unzipSync } from 'three/examples/jsm/libs/fflate.module.js';
import { ISampleModel, IModelTransform } from '@/types/simulator';

export const SAMPLE_MODELS: ISampleModel[] = [
  {
    id: 'sample-benchy',
    name: '3D Benchy (Calibration Ship)',
    description: 'Tàu Benchy huyền thoại: kiểm tra vòm cửa cong, mái nhô overhang, ống khói rỗng và chữ đáy.',
    category: 'Benchmarking',
    geometryType: 'benchy',
    defaultProfileId: 'bambu-standard',
    dimensionsMm: [60, 31, 48],
    estimatedWeightGrams: 14.5,
    accentBadge: 'Kinh Điển',
  },
  {
    id: 'sample-cube',
    name: 'Voron Cube XYZ (20mm)',
    description: 'Cục lập phương chuẩn 20mm khắc 3D chữ X, Y, Z trên các mặt; kiểm tra góc vuông 90° và rung ghosting.',
    category: 'Calibration',
    geometryType: 'cube',
    defaultProfileId: 'bambu-draft-turbo',
    dimensionsMm: [20, 20, 20],
    estimatedWeightGrams: 8.2,
    accentBadge: 'Độ Chính Xác',
  },
  {
    id: 'sample-gear',
    name: 'Khớp Bánh Răng Hành Tinh Print-in-Place',
    description: 'Cụm bánh răng hành tinh 4 bánh ăn khớp xoay được ngay sau khi in; khe hở chống dính 0.3mm.',
    category: 'Mechanical',
    geometryType: 'gear',
    defaultProfileId: 'orca-tough-structural',
    dimensionsMm: [54, 54, 15],
    estimatedWeightGrams: 24.0,
    accentBadge: 'Cơ Khí Khớp Động',
  },
  {
    id: 'sample-organizer',
    name: 'Hộp Gridfinity 1x1x3 (Vách Mỏng)',
    description: 'Hộp chuẩn Gridfinity với đế vát 45° và gờ xếp chồng; kiểm tra cong vênh đáy và vách mỏng 1.2mm.',
    category: 'Functional',
    geometryType: 'organizer',
    defaultProfileId: 'bambu-standard',
    dimensionsMm: [42, 42, 38],
    estimatedWeightGrams: 19.5,
    accentBadge: 'Vách Mỏng & Đáy Lớn',
  },
  {
    id: 'sample-dragon',
    name: 'Rồng Khớp Động Flexi Dragon',
    description: 'Mô hình rồng nhiều đốt xương linh hoạt, đầu có sừng và khớp cầu uốn lượn mềm mại.',
    category: 'Art & Toys',
    geometryType: 'dragon',
    defaultProfileId: 'bambu-ultra-fine',
    dimensionsMm: [135, 40, 24],
    estimatedWeightGrams: 34.0,
    accentBadge: 'Nghệ Thuật Khớp',
  },
];

/**
 * Sinh Geometry 3D mô phỏng chân thực từng mẫu in thực tế
 */
export function generateProceduralGeometry(type: ISampleModel['geometryType']): THREE.BufferGeometry {
  switch (type) {
    case 'cube': {
      // Voron / Calibration Cube XYZ chuẩn 20x20x20mm với 3D embossed chữ X, Y, Z
      const geoms: THREE.BufferGeometry[] = [];

      // 1. Thân khối lập phương chính (20x20x20mm)
      const baseCube = new THREE.BoxGeometry(20, 20, 20, 4, 4, 4);
      geoms.push(baseCube);

      // 2. Chữ 'X' nổi 3D ở mặt trước (Z = +10.6mm)
      const xBar1 = new THREE.BoxGeometry(2.4, 11, 1.4);
      xBar1.rotateZ(Math.PI / 4);
      xBar1.translate(0, 0, 10.2);
      geoms.push(xBar1);

      const xBar2 = new THREE.BoxGeometry(2.4, 11, 1.4);
      xBar2.rotateZ(-Math.PI / 4);
      xBar2.translate(0, 0, 10.2);
      geoms.push(xBar2);

      // 3. Chữ 'Y' nổi 3D ở mặt bên phải (X = +10.6mm)
      const yStem = new THREE.BoxGeometry(1.4, 5.5, 2.2);
      yStem.translate(10.2, -3, 0);
      geoms.push(yStem);

      const yArm1 = new THREE.BoxGeometry(1.4, 6.5, 2.2);
      yArm1.rotateZ(Math.PI / 4);
      yArm1.translate(10.2, 2.5, 2);
      geoms.push(yArm1);

      const yArm2 = new THREE.BoxGeometry(1.4, 6.5, 2.2);
      yArm2.rotateZ(-Math.PI / 4);
      yArm2.translate(10.2, 2.5, -2);
      geoms.push(yArm2);

      // 4. Chữ 'Z' nổi 3D ở mặt trên đỉnh (Y = +10.6mm)
      const zTop = new THREE.BoxGeometry(9, 1.4, 2.2);
      zTop.translate(0, 10.2, -4);
      geoms.push(zTop);

      const zDiag = new THREE.BoxGeometry(12, 1.4, 2.2);
      zDiag.rotateY(Math.PI / 4);
      zDiag.translate(0, 10.2, 0);
      geoms.push(zDiag);

      const zBot = new THREE.BoxGeometry(9, 1.4, 2.2);
      zBot.translate(0, 10.2, 4);
      geoms.push(zBot);

      // 5. Viền gờ vát 4 cạnh đáy
      const bevel = new THREE.BoxGeometry(19.2, 1.5, 19.2);
      bevel.translate(0, -9.5, 0);
      geoms.push(bevel);

      const merged = mergeBufferGeometries(geoms);
      return centerAndGroundGeometry(merged);
    }

    case 'benchy': {
      // Mô hình 3D Benchy chân thực với đầy đủ các bộ phận nhận diện
      const geoms: THREE.BufferGeometry[] = [];

      // 1. Đáy thân tàu và sống tàu (Hull & Keel)
      const keel = new THREE.BoxGeometry(42, 3, 6);
      keel.translate(0, 1.5, 0);
      geoms.push(keel);

      // Thân tàu loe cong (Lofted Hull)
      const hullLower = new THREE.CylinderGeometry(15, 6, 12, 24, 4);
      hullLower.scale(1.9, 1, 1.05);
      hullLower.translate(-2, 7.5, 0);
      geoms.push(hullLower);

      // 2. Mũi tàu vuốt nhọn (Curved Bow)
      const bowProw = new THREE.ConeGeometry(13, 20, 20);
      bowProw.rotateZ(Math.PI / 2.35);
      bowProw.translate(18, 10, 0);
      geoms.push(bowProw);

      // 3. Sàn tàu và be tàu (Deck with Raised Gunwale)
      const deckRim = new THREE.TorusGeometry(17, 1.8, 12, 32);
      deckRim.scale(1.6, 1, 0.85);
      deckRim.rotateX(Math.PI / 2);
      deckRim.translate(-1, 14, 0);
      geoms.push(deckRim);

      // 4. Khoang hàng sau lái (Cargo Well Box)
      const cargoWell = new THREE.BoxGeometry(12, 6, 14);
      cargoWell.translate(-16, 16, 0);
      geoms.push(cargoWell);

      // 5. Cabin buồng lái (Pilothouse)
      const cabinBody = new THREE.BoxGeometry(18, 16, 16);
      cabinBody.translate(0, 21, 0);
      geoms.push(cabinBody);

      // Cửa sổ kính chắn gió phía trước cabin
      const frontWindow = new THREE.BoxGeometry(1.5, 6, 10);
      frontWindow.translate(9, 23, 0);
      geoms.push(frontWindow);

      // Cửa vòm hai bên (Arch doorways)
      const doorArchL = new THREE.CylinderGeometry(3.5, 3.5, 10, 16);
      doorArchL.rotateX(Math.PI / 2);
      doorArchL.translate(0, 21, 8.2);
      geoms.push(doorArchL);

      const doorArchR = new THREE.CylinderGeometry(3.5, 3.5, 10, 16);
      doorArchR.rotateX(Math.PI / 2);
      doorArchR.translate(0, 21, -8.2);
      geoms.push(doorArchR);

      // 6. Mái che cabin cong có viền nhô overhang (Roof Canopy)
      const roof = new THREE.CylinderGeometry(15, 15, 23, 24, 2, false, 0, Math.PI);
      roof.rotateZ(Math.PI / 2);
      roof.scale(1, 0.28, 0.85);
      roof.translate(0, 30.5, 0);
      geoms.push(roof);

      // 7. Ống khói rỗng (Cylindrical Smokestack with inner bore)
      const chimneyOuter = new THREE.CylinderGeometry(3.8, 3.8, 15, 20);
      chimneyOuter.translate(7.5, 34, 0);
      geoms.push(chimneyOuter);

      const chimneyCollar = new THREE.TorusGeometry(4.2, 0.9, 12, 20);
      chimneyCollar.rotateX(Math.PI / 2);
      chimneyCollar.translate(7.5, 41, 0);
      geoms.push(chimneyCollar);

      // 8. Lỗ luồn neo ở mũi (Hawse pipes)
      const hawseL = new THREE.TorusGeometry(1.6, 0.6, 8, 16);
      hawseL.translate(22, 12, 5);
      geoms.push(hawseL);

      const hawseR = new THREE.TorusGeometry(1.6, 0.6, 8, 16);
      hawseR.translate(22, 12, -5);
      geoms.push(hawseR);

      const merged = mergeBufferGeometries(geoms);
      return centerAndGroundGeometry(merged);
    }

    case 'gear': {
      // Cụm Bánh Răng Hành Tinh (Planetary Gear Bearing Print-in-Place)
      const geoms: THREE.BufferGeometry[] = [];

      // 1. Vành ngoài (Outer Ring)
      const ringOuter = new THREE.CylinderGeometry(27, 27, 12, 36);
      geoms.push(ringOuter);

      // 2. Bánh răng mặt trời trung tâm (Sun Gear) với lỗ lục giác
      const sunBody = new THREE.CylinderGeometry(9, 9, 12, 24);
      geoms.push(sunBody);

      // Răng của bánh răng mặt trời (8 răng)
      for (let i = 0; i < 8; i++) {
        const tooth = new THREE.BoxGeometry(3.2, 12, 3.5);
        const angle = (i * Math.PI * 2) / 8;
        tooth.rotateY(angle);
        tooth.translate(Math.cos(angle) * 10, 0, Math.sin(angle) * 10);
        geoms.push(tooth);
      }

      // 3. 4 Bánh răng hành tinh (Planet Gears) với khe hở 0.3mm
      const planetCount = 4;
      const planetRadius = 6.2;
      const orbitDistance = 17.5;

      for (let p = 0; p < planetCount; p++) {
        const pAngle = (p * Math.PI * 2) / planetCount;
        const cx = Math.cos(pAngle) * orbitDistance;
        const cz = Math.sin(pAngle) * orbitDistance;

        // Thân bánh răng hành tinh
        const planetBody = new THREE.CylinderGeometry(planetRadius, planetRadius, 12, 20);
        planetBody.translate(cx, 0, cz);
        geoms.push(planetBody);

        // 6 Răng trên mỗi bánh răng hành tinh
        for (let t = 0; t < 6; t++) {
          const tAngle = pAngle + (t * Math.PI * 2) / 6;
          const tooth = new THREE.BoxGeometry(2.4, 12, 2.8);
          tooth.rotateY(tAngle);
          tooth.translate(cx + Math.cos(tAngle) * (planetRadius + 1.2), 0, cz + Math.sin(tAngle) * (planetRadius + 1.2));
          geoms.push(tooth);
        }
      }

      const merged = mergeBufferGeometries(geoms);
      return centerAndGroundGeometry(merged);
    }

    case 'organizer': {
      // Hộp Gridfinity chuẩn 1x1x3 rỗng ruột (Hollow bin) với vách mỏng 1.4mm, vát đáy 45° và gờ xếp chồng
      const geoms: THREE.BufferGeometry[] = [];

      // 1. Đế Gridfinity vát bậc 45 độ với 4 chân góc chuẩn (Base 38x38mm, vát 45 độ lên 41.5mm)
      const baseFeet = new THREE.CylinderGeometry(19, 16.5, 4.5, 4);
      baseFeet.rotateY(Math.PI / 4);
      baseFeet.translate(0, 2.25, 0);
      geoms.push(baseFeet);

      // 4 lỗ đệm nam châm tròn ở đáy (Gridfinity 6x2mm magnet holes / feet)
      const holeRadius = 3.2;
      const holeDepth = 1.2;
      const holeDist = 13;
      [
        [-holeDist, -holeDist],
        [holeDist, -holeDist],
        [-holeDist, holeDist],
        [holeDist, holeDist],
      ].forEach(([hx, hz]) => {
        const footPad = new THREE.CylinderGeometry(holeRadius, holeRadius, holeDepth, 12);
        footPad.translate(hx, 0.6, hz);
        geoms.push(footPad);
      });

      // 2. Đáy hộp đặc (Floor plate 41.5 x 2.2 x 41.5mm)
      const floorPlate = new THREE.BoxGeometry(41.5, 2.2, 41.5);
      floorPlate.translate(0, 5.6, 0);
      geoms.push(floorPlate);

      // 3. 4 Vách mỏng chu vi (Thin perimeter walls 1.4mm, chiều cao 30mm tạo lòng hộp rỗng)
      const wallThickness = 1.4;
      const wallHeight = 30;
      const wallY = 6.7 + wallHeight / 2; // Y = 21.7
      const outerW = 41.5;
      const innerW = outerW - wallThickness * 2; // 38.7mm

      // Vách Trước (Front Wall)
      const frontWall = new THREE.BoxGeometry(outerW, wallHeight, wallThickness);
      frontWall.translate(0, wallY, outerW / 2 - wallThickness / 2);
      geoms.push(frontWall);

      // Vách Sau (Back Wall)
      const backWall = new THREE.BoxGeometry(outerW, wallHeight, wallThickness);
      backWall.translate(0, wallY, -(outerW / 2 - wallThickness / 2));
      geoms.push(backWall);

      // Vách Trái (Left Wall)
      const leftWall = new THREE.BoxGeometry(wallThickness, wallHeight, innerW);
      leftWall.translate(-(outerW / 2 - wallThickness / 2), wallY, 0);
      geoms.push(leftWall);

      // Vách Phải (Right Wall)
      const rightWall = new THREE.BoxGeometry(wallThickness, wallHeight, innerW);
      rightWall.translate(outerW / 2 - wallThickness / 2, wallY, 0);
      geoms.push(rightWall);

      // 4. Vách ngăn chia đôi bên trong (Internal divider wall 1.2mm)
      const divider = new THREE.BoxGeometry(1.2, wallHeight * 0.75, innerW);
      divider.translate(0, 6.7 + (wallHeight * 0.75) / 2, 0);
      geoms.push(divider);

      // 5. Gờ xếp chồng trên miệng vát (Stacking Lip Rim - 4 thanh viền rỗng trên đỉnh)
      const lipHeight = 3.5;
      const lipY = 6.7 + wallHeight + lipHeight / 2; // Y = 38.45
      const lipThick = 2.0;

      // Viền trước
      const lipFront = new THREE.BoxGeometry(42.5, lipHeight, lipThick);
      lipFront.translate(0, lipY, 42.5 / 2 - lipThick / 2);
      geoms.push(lipFront);

      // Viền sau
      const lipBack = new THREE.BoxGeometry(42.5, lipHeight, lipThick);
      lipBack.translate(0, lipY, -(42.5 / 2 - lipThick / 2));
      geoms.push(lipBack);

      // Viền trái
      const lipLeft = new THREE.BoxGeometry(lipThick, lipHeight, 42.5 - lipThick * 2);
      lipLeft.translate(-(42.5 / 2 - lipThick / 2), lipY, 0);
      geoms.push(lipLeft);

      // Viền phải
      const lipRight = new THREE.BoxGeometry(lipThick, lipHeight, 42.5 - lipThick * 2);
      lipRight.translate(42.5 / 2 - lipThick / 2, lipY, 0);
      geoms.push(lipRight);

      // Gờ vát dán nhãn phía trước (Angled Label Shelf 45 độ)
      const labelShelf = new THREE.BoxGeometry(36, 2.5, 7.5);
      labelShelf.rotateX(Math.PI / 4);
      labelShelf.translate(0, 34, 18.5);
      geoms.push(labelShelf);

      const merged = mergeBufferGeometries(geoms);
      return centerAndGroundGeometry(merged);
    }

    case 'dragon':
    default: {
      // Rồng khớp động Flexi Dragon với nhiều mắt xích uốn lượn
      const geoms: THREE.BufferGeometry[] = [];

      // 1. Đầu rồng (Dragon Head)
      const head = new THREE.ConeGeometry(7, 18, 16);
      head.rotateZ(-Math.PI / 2);
      head.translate(45, 8, 0);
      geoms.push(head);

      // Hai sừng rồng (Horns)
      const hornL = new THREE.ConeGeometry(2, 10, 8);
      hornL.rotateZ(-Math.PI / 3);
      hornL.rotateX(0.3);
      hornL.translate(40, 14, 4);
      geoms.push(hornL);

      const hornR = new THREE.ConeGeometry(2, 10, 8);
      hornR.rotateZ(-Math.PI / 3);
      hornR.rotateX(-0.3);
      hornR.translate(40, 14, -4);
      geoms.push(hornR);

      // 2. Các đốt xương sống khớp linh hoạt (Vertebrae)
      const segments = 12;
      for (let i = 0; i < segments; i++) {
        const factor = 1 - (i / segments) * 0.6;
        const segSize = 7.5 * factor;
        const xPos = 35 - i * 8;
        const waveZ = Math.sin(i * 0.7) * 9;

        // Đốt xương chính
        const seg = new THREE.BoxGeometry(6.5, segSize * 1.5, segSize * 1.3);
        seg.translate(xPos, segSize, waveZ);
        geoms.push(seg);

        // Gai lưng (Spines)
        const spine = new THREE.ConeGeometry(1.8 * factor, 6 * factor, 6);
        spine.translate(xPos, segSize * 2, waveZ);
        geoms.push(spine);

        // Khớp nối cầu (Interlocking Joint)
        if (i < segments - 1) {
          const joint = new THREE.SphereGeometry(2.5 * factor, 8, 8);
          joint.translate(xPos - 4, segSize, waveZ);
          geoms.push(joint);
        }
      }

      const merged = mergeBufferGeometries(geoms);
      return centerAndGroundGeometry(merged);
    }
  }
}

/**
 * Trộn nhiều BufferGeometry thành một BufferGeometry thống nhất dùng BufferGeometryUtils
 * và tự động căn giữa X/Z + đặt đáy chuẩn xác trên mặt bàn in (Y = 0)
 */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = geometries.map((g) => (g.index ? g.toNonIndexed() : g));
  const merged = BufferGeometryUtils.mergeGeometries(nonIndexed, false);
  if (!merged) {
    return new THREE.BoxGeometry(20, 20, 20).toNonIndexed();
  }
  return merged;
}

function centerAndGroundGeometry(geom: THREE.BufferGeometry): THREE.BufferGeometry {
  geom.computeBoundingBox();
  const bbox = geom.boundingBox;
  if (bbox) {
    if (geom.userData?.preservePlateLayout) {
      // Giữ nguyên tuyệt đối vị trí dàn trang X/Z của từng chi tiết lẻ trên bàn in 256x256mm,
      // chỉ hạ cứng mặt đáy thấp nhất chạm sàn Y = 0
      if (Math.abs(bbox.min.y) > 1e-4) {
        geom.translate(0, -bbox.min.y, 0);
      }
    } else {
      const cx = (bbox.min.x + bbox.max.x) / 2;
      const cz = (bbox.min.z + bbox.max.z) / 2;
      geom.translate(-cx, -bbox.min.y, -cz);
    }
  }
  geom.computeVertexNormals();
  return geom;
}

const IDENTITY_TRANSFORM_12: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];

function parseTransform12(str?: string | null): number[] | null {
  if (!str) return null;
  const parts = str.trim().split(/\s+/).map(Number);
  return parts.length === 12 && parts.every((n) => !isNaN(n)) ? parts : null;
}

function applyAffineTransform(x: number, y: number, z: number, m: number[]): [number, number, number] {
  // Chuẩn ma trận 4x3 Affine Transform của 3MF Specification:
  // x' = m00*x + m10*y + m20*z + m30
  // y' = m01*x + m11*y + m21*z + m31
  // z' = m02*x + m12*y + m22*z + m32
  return [
    m[0] * x + m[3] * y + m[6] * z + m[9],
    m[1] * x + m[4] * y + m[7] * z + m[10],
    m[2] * x + m[5] * y + m[8] * z + m[11],
  ];
}

/**
 * Nhân hai ma trận 4x3 Affine của 3MF: M_out = M_parent * M_child
 * (Áp dụng M_child trước, sau đó áp dụng M_parent)
 */
function multiplyAffine12(parent: number[], child: number[]): number[] {
  const p = parent;
  const c = child;
  return [
    p[0] * c[0] + p[3] * c[1] + p[6] * c[2],
    p[1] * c[0] + p[4] * c[1] + p[7] * c[2],
    p[2] * c[0] + p[5] * c[1] + p[8] * c[2],

    p[0] * c[3] + p[3] * c[4] + p[6] * c[5],
    p[1] * c[3] + p[4] * c[4] + p[7] * c[5],
    p[2] * c[3] + p[5] * c[4] + p[8] * c[5],

    p[0] * c[6] + p[3] * c[7] + p[6] * c[8],
    p[1] * c[6] + p[4] * c[7] + p[7] * c[8],
    p[2] * c[6] + p[5] * c[7] + p[8] * c[8],

    p[0] * c[9] + p[3] * c[10] + p[6] * c[11] + p[9],
    p[1] * c[9] + p[4] * c[10] + p[7] * c[11] + p[10],
    p[2] * c[9] + p[5] * c[10] + p[8] * c[11] + p[11],
  ];
}

function normalize3MFZipPath(rawPath: string): string {
  return rawPath.replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase();
}

export interface IBambuPartGeometryRecord {
  id: string;
  name: string;
  positions: Float32Array;
}

export interface IBambuPlateMeshData {
  plateId: number;
  plateName: string;
  partCount: number;
  geometry: THREE.BufferGeometry;
  plateCenter3MF: [number, number];
}

interface I3MFMeshObjectNode {
  id: string;
  name: string;
  modelPath: string;
  type: string;
  vertices: Float32Array;
  triangles: Uint32Array;
  components: Array<{
    targetPath: string;
    targetObjectId: string;
    transform: number[];
  }>;
}

function parseSingleMeshBlock(meshText: string): { vertices: Float32Array; triangles: Uint32Array } | null {
  const verts: number[] = [];
  const vFastRegex = /<(?:\w+:)?vertex\s+x="([^"]+)"\s+y="([^"]+)"\s+z="([^"]+)"/gi;
  let vMatch: RegExpExecArray | null;
  while ((vMatch = vFastRegex.exec(meshText)) !== null) {
    verts.push(parseFloat(vMatch[1]), parseFloat(vMatch[2]), parseFloat(vMatch[3]));
  }
  if (verts.length === 0) {
    const vTagRegex = /<(?:\w+:)?vertex\s+([^>]+)>/gi;
    while ((vMatch = vTagRegex.exec(meshText)) !== null) {
      const attrs = vMatch[1];
      const xm = attrs.match(/\bx="([^"]+)"/i);
      const ym = attrs.match(/\by="([^"]+)"/i);
      const zm = attrs.match(/\bz="([^"]+)"/i);
      if (!xm || !ym || !zm) continue;
      verts.push(parseFloat(xm[1]), parseFloat(ym[1]), parseFloat(zm[1]));
    }
  }
  const vertCount = verts.length / 3;
  if (vertCount < 3) return null;

  const tris: number[] = [];
  const tFastRegex = /<(?:\w+:)?triangle\s+v1="(\d+)"\s+v2="(\d+)"\s+v3="(\d+)"/gi;
  let tMatch: RegExpExecArray | null;
  while ((tMatch = tFastRegex.exec(meshText)) !== null) {
    const v1 = parseInt(tMatch[1], 10);
    const v2 = parseInt(tMatch[2], 10);
    const v3 = parseInt(tMatch[3], 10);
    if (v1 < vertCount && v2 < vertCount && v3 < vertCount) {
      tris.push(v1, v2, v3);
    }
  }
  if (tris.length === 0) {
    const tTagRegex = /<(?:\w+:)?triangle\s+([^>]+)>/gi;
    while ((tMatch = tTagRegex.exec(meshText)) !== null) {
      const attrs = tMatch[1];
      const m1 = attrs.match(/\bv1="(\d+)"/i);
      const m2 = attrs.match(/\bv2="(\d+)"/i);
      const m3 = attrs.match(/\bv3="(\d+)"/i);
      if (!m1 || !m2 || !m3) continue;
      const v1 = parseInt(m1[1], 10);
      const v2 = parseInt(m2[1], 10);
      const v3 = parseInt(m3[1], 10);
      if (v1 < vertCount && v2 < vertCount && v3 < vertCount) {
        tris.push(v1, v2, v3);
      }
    }
  }
  if (tris.length < 3) return null;

  return {
    vertices: new Float32Array(verts),
    triangles: new Uint32Array(tris),
  };
}

/**
 * Giải mã đầy đủ cấu trúc 3MF Production Extension & Multi-Plate của Bambu Studio / OrcaSlicer:
 * - Bảo toàn 100% vị trí dàn trang của từng chi tiết lẻ (<build><item> x <components><component>)
 * - Tách riêng từng Bàn in (Plate 1, Plate 2, Plate 3...) dựa trên Metadata/model_settings.config & ô bàn in 256x256mm
 * - Không bao giờ tự gom các chi tiết đã dàn phẳng về lại vị trí lắp ráp CAD ban đầu
 */
export function parse3MFPlatesFromBuffer(buffer: ArrayBuffer): IBambuPlateMeshData[] {
  const unzipped = unzipSync(new Uint8Array(buffer));
  const decoder = new TextDecoder();

  const normalizedFiles = new Map<string, Uint8Array>();
  for (const rawKey of Object.keys(unzipped)) {
    normalizedFiles.set(normalize3MFZipPath(rawKey), unzipped[rawKey]);
  }

  const modelKeys = Array.from(normalizedFiles.keys()).filter((k) => k.endsWith('.model'));
  if (modelKeys.length === 0) {
    throw new Error('File 3MF không chứa mô hình 3D (.model).');
  }

  // 1. Đọc Metadata/model_settings.config (nếu có) để biết tên các chi tiết, phân loại part và ánh xạ từng chi tiết vào từng Plate
  const objectNameMap = new Map<string, string>();
  const nonPrintablePartIds = new Set<string>();
  const instanceToPlateMap = new Map<string, { plateId: number; plateName: string }>();
  const declaredPlateNames = new Map<number, string>();

  const modelSettingsBytes = normalizedFiles.get('metadata/model_settings.config');
  if (modelSettingsBytes) {
    const settingsXml = decoder.decode(modelSettingsBytes);

    // Đọc tên object và lọc bỏ support_blocker / modifier_part
    const objBlockRegex = /<object\s+id="(\d+)"[^>]*>([\s\S]*?)<\/object>/gi;
    let objMatch: RegExpExecArray | null;
    while ((objMatch = objBlockRegex.exec(settingsXml)) !== null) {
      const objId = objMatch[1];
      const body = objMatch[2];
      const nameMeta = body.match(/<metadata\s+key="name"\s+value="([^"]+)"/i);
      if (nameMeta) objectNameMap.set(objId, nameMeta[1]);

      const partRegex = /<part\s+id="(\d+)"\s+subtype="([^"]+)"/gi;
      let pMatch: RegExpExecArray | null;
      while ((pMatch = partRegex.exec(body)) !== null) {
        const subType = pMatch[2].toLowerCase();
        if (
          subType.includes('blocker') ||
          subType.includes('modifier') ||
          subType.includes('negative')
        ) {
          nonPrintablePartIds.add(`${objId}#${pMatch[1]}`);
        }
      }
    }

    // Đọc danh sách các bàn in <plate>...</plate>
    const plateBlockRegex = /<plate>([\s\S]*?)<\/plate>/gi;
    let plateMatch: RegExpExecArray | null;
    let fallbackPlateIdx = 1;
    while ((plateMatch = plateBlockRegex.exec(settingsXml)) !== null) {
      const pBody = plateMatch[1];
      const idMeta = pBody.match(/<metadata\s+key="plater_id"\s+value="(\d+)"/i);
      const nameMeta = pBody.match(/<metadata\s+key="plater_name"\s+value="([^"]*)"/i);
      const plateId = idMeta ? parseInt(idMeta[1], 10) : fallbackPlateIdx;
      fallbackPlateIdx = Math.max(fallbackPlateIdx + 1, plateId + 1);
      const plateName =
        nameMeta && nameMeta[1].trim() ? `Bàn ${plateId} (${nameMeta[1].trim()})` : `Bàn in ${plateId}`;
      declaredPlateNames.set(plateId, plateName);

      const instRegex = /<model_instance>([\s\S]*?)<\/model_instance>/gi;
      let instMatch: RegExpExecArray | null;
      while ((instMatch = instRegex.exec(pBody)) !== null) {
        const iBody = instMatch[1];
        const objIdM = iBody.match(/<metadata\s+key="object_id"\s+value="(\d+)"/i);
        const instIdM = iBody.match(/<metadata\s+key="instance_id"\s+value="(\d+)"/i);
        if (objIdM) {
          const oid = objIdM[1];
          const iid = instIdM ? instIdM[1] : '0';
          instanceToPlateMap.set(`${oid}#${iid}`, { plateId, plateName });
          if (!instanceToPlateMap.has(`${oid}#*`)) {
            instanceToPlateMap.set(`${oid}#*`, { plateId, plateName });
          }
        }
      }
    }
  }

  // 2. Giải mã toàn bộ các thẻ <object id="..."> trong mọi file .model
  const objectRegistry = new Map<string, I3MFMeshObjectNode>();
  const rootModelKey =
    modelKeys.find((k) => k === '3d/3dmodel.model') ||
    modelKeys.find((k) => k.endsWith('3dmodel.model')) ||
    modelKeys[0];

  for (const mKey of modelKeys) {
    const xmlText = decoder.decode(normalizedFiles.get(mKey)!);
    let searchPos = 0;

    while (searchPos < xmlText.length) {
      const objOpen = xmlText.indexOf('<object ', searchPos);
      if (objOpen === -1) break;
      const headerEnd = xmlText.indexOf('>', objOpen);
      if (headerEnd === -1) break;
      const objClose = xmlText.indexOf('</object>', headerEnd);
      if (objClose === -1) break;

      const headerAttrs = xmlText.slice(objOpen + 8, headerEnd);
      const objBody = xmlText.slice(headerEnd + 1, objClose);
      searchPos = objClose + 9;

      const idMatch = headerAttrs.match(/\bid="([^"]+)"/i);
      if (!idMatch) continue;
      const objId = idMatch[1];
      const typeMatch = headerAttrs.match(/\btype="([^"]+)"/i);
      const objType = (typeMatch ? typeMatch[1] : 'model').toLowerCase();
      // Bỏ qua các đối tượng kiểu support/other nếu có nhúng nhầm từ phần mềm khác
      if (objType === 'support' || objType === 'solidsupport') continue;

      const nameMatch = headerAttrs.match(/\bname="([^"]+)"/i);
      const objName = nameMatch ? nameMatch[1] : objectNameMap.get(objId) || `Part_${objId}`;

      let vertices: Float32Array = new Float32Array(0);
      let triangles: Uint32Array = new Uint32Array(0);

      const meshStart = objBody.indexOf('<mesh');
      if (meshStart !== -1) {
        const meshTagEnd = objBody.indexOf('>', meshStart);
        const meshClose = objBody.indexOf('</mesh>', meshTagEnd);
        if (meshTagEnd !== -1 && meshClose !== -1) {
          const parsedMesh = parseSingleMeshBlock(objBody.slice(meshTagEnd + 1, meshClose));
          if (parsedMesh) {
            vertices = parsedMesh.vertices;
            triangles = parsedMesh.triangles;
          }
        }
      }

      const components: I3MFMeshObjectNode['components'] = [];
      for (const compMatch of objBody.matchAll(/<(?:\w+:)?component\s+([^>]+)>/gi)) {
        const cAttrs = compMatch[1];
        const cObjIdM = cAttrs.match(/\bobjectid="([^"]+)"/i);
        if (!cObjIdM) continue;
        const pathM = cAttrs.match(/(?:\w+:)?path="([^"]+)"/i);
        const transM = cAttrs.match(/\btransform="([^"]+)"/i);
        const targetPath = pathM ? normalize3MFZipPath(pathM[1]) : mKey;
        const transform = parseTransform12(transM ? transM[1] : null) || IDENTITY_TRANSFORM_12;
        components.push({
          targetPath,
          targetObjectId: cObjIdM[1],
          transform,
        });
      }

      objectRegistry.set(`${mKey}#${objId}`, {
        id: objId,
        name: objName,
        modelPath: mKey,
        type: objType,
        vertices,
        triangles,
        components,
      });
    }
  }

  // 3. Đọc toàn bộ danh sách <build><item .../></build> từ rootModelKey
  const rootXml = decoder.decode(normalizedFiles.get(rootModelKey)!);
  const buildItems: Array<{
    objectId: string;
    instanceIdx: number;
    transform: number[];
    hasExplicitTransform: boolean;
    printable: boolean;
  }> = [];

  const instanceCounter = new Map<string, number>();
  const buildSectionMatch = rootXml.match(/<(?:\w+:)?build[^>]*>([\s\S]*?)<\/(?:\w+:)?build>/i);
  const buildSearchText = buildSectionMatch ? buildSectionMatch[1] : rootXml;

  for (const itemMatch of buildSearchText.matchAll(/<(?:\w+:)?item\s+([^>]+)>/gi)) {
    const attrs = itemMatch[1];
    const objIdM = attrs.match(/\bobjectid="([^"]+)"/i);
    if (!objIdM) continue;
    const objectId = objIdM[1];
    const curInst = instanceCounter.get(objectId) || 0;
    instanceCounter.set(objectId, curInst + 1);

    const transM = attrs.match(/\btransform="([^"]+)"/i);
    const parsedT = parseTransform12(transM ? transM[1] : null);
    const printableM = attrs.match(/\bprintable="([^"]+)"/i);
    const printable = printableM ? printableM[1] !== '0' && printableM[1].toLowerCase() !== 'false' : true;

    buildItems.push({
      objectId,
      instanceIdx: curInst,
      transform: parsedT || IDENTITY_TRANSFORM_12,
      hasExplicitTransform: Boolean(parsedT),
      printable,
    });
  }

  // Nếu file 3MF không có thẻ <item>, tự tạo build item cho các root objects
  if (buildItems.length === 0) {
    for (const [key, node] of objectRegistry.entries()) {
      if (key.startsWith(`${rootModelKey}#`)) {
        buildItems.push({
          objectId: node.id,
          instanceIdx: 0,
          transform: IDENTITY_TRANSFORM_12,
          hasExplicitTransform: false,
          printable: true,
        });
      }
    }
  }

  // 4. Duyệt đệ quy Scene Graph cho từng Build Item để thu thập các chi tiết (World 3MF Space)
  interface IResolvedBuildItemInstance {
    objectId: string;
    instanceIdx: number;
    name: string;
    printable: boolean;
    hasTransform: boolean;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
    // Mảng tam giác đã biến đổi sang World 3MF (x, y, z chuẩn mm của 3MF trước khi trừ tâm Plate)
    worldTris3MF: Float32Array;
  }

  const resolvedInstances: IResolvedBuildItemInstance[] = [];

  const collectLeafMeshes = (
    modelPath: string,
    objectId: string,
    worldMatrix: number[],
    hasTransformFlag: { value: boolean },
    outTris3MF: number[],
    depth: number
  ) => {
    if (depth > 8) return;
    let node = objectRegistry.get(`${modelPath}#${objectId}`);
    if (!node) {
      for (const [k, candidate] of objectRegistry.entries()) {
        if (k.endsWith(`#${objectId}`)) {
          node = candidate;
          break;
        }
      }
    }
    if (!node) return;

    if (node.vertices.length >= 9 && node.triangles.length >= 3) {
      const v = node.vertices;
      const t = node.triangles;
      const vTransformed = new Float32Array(v.length);
      for (let i = 0; i < v.length; i += 3) {
        const [tx, ty, tz] = applyAffineTransform(v[i], v[i + 1], v[i + 2], worldMatrix);
        vTransformed[i] = tx;
        vTransformed[i + 1] = ty;
        vTransformed[i + 2] = tz;
      }

      // Kiểm tra định hướng thể tích có dấu (Signed Volume) trên từng khối mesh
      const refX = vTransformed[0];
      const refY = vTransformed[1];
      const refZ = vTransformed[2];
      let signedVolume6 = 0;
      for (let i = 0; i < t.length; i += 3) {
        const i1 = t[i] * 3;
        const i2 = t[i + 1] * 3;
        const i3 = t[i + 2] * 3;
        const ax = vTransformed[i1] - refX;
        const ay = vTransformed[i1 + 1] - refY;
        const az = vTransformed[i1 + 2] - refZ;
        const bx = vTransformed[i2] - refX;
        const by = vTransformed[i2 + 1] - refY;
        const bz = vTransformed[i2 + 2] - refZ;
        const cx = vTransformed[i3] - refX;
        const cy = vTransformed[i3 + 1] - refY;
        const cz = vTransformed[i3 + 2] - refZ;
        signedVolume6 +=
          ax * (by * cz - bz * cy) +
          ay * (bz * cx - bx * cz) +
          az * (bx * cy - by * cx);
      }

      // Chú ý: Khi ánh xạ (x - cx, z, y - cy) sang Three.js, trục Y và Z hoán vị (det = -1),
      // nên nếu signedVolume6 > 0 ở hệ Z-up thì sau khi hoán vị Y<->Z cần đảo v2<->v3 để pháp tuyến hướng ra ngoài
      const swapForThreeYZ = signedVolume6 > 0;
      for (let i = 0; i < t.length; i += 3) {
        const i1 = t[i] * 3;
        const i2 = t[i + 1] * 3;
        const i3 = t[i + 2] * 3;
        if (swapForThreeYZ) {
          outTris3MF.push(
            vTransformed[i1], vTransformed[i1 + 1], vTransformed[i1 + 2],
            vTransformed[i3], vTransformed[i3 + 1], vTransformed[i3 + 2],
            vTransformed[i2], vTransformed[i2 + 1], vTransformed[i2 + 2]
          );
        } else {
          outTris3MF.push(
            vTransformed[i1], vTransformed[i1 + 1], vTransformed[i1 + 2],
            vTransformed[i2], vTransformed[i2 + 1], vTransformed[i2 + 2],
            vTransformed[i3], vTransformed[i3 + 1], vTransformed[i3 + 2]
          );
        }
      }
    }

    for (const comp of node.components) {
      if (nonPrintablePartIds.has(`${objectId}#${comp.targetObjectId}`)) continue;
      if (comp.transform !== IDENTITY_TRANSFORM_12) hasTransformFlag.value = true;
      const combinedMatrix = multiplyAffine12(worldMatrix, comp.transform);
      collectLeafMeshes(
        comp.targetPath,
        comp.targetObjectId,
        combinedMatrix,
        hasTransformFlag,
        outTris3MF,
        depth + 1
      );
    }
  };

  for (const item of buildItems) {
    const outTris: number[] = [];
    const hasTransformFlag = { value: item.hasExplicitTransform };
    collectLeafMeshes(rootModelKey, item.objectId, item.transform, hasTransformFlag, outTris, 0);
    if (outTris.length < 9) continue;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < outTris.length; i += 3) {
      const x = outTris[i];
      const y = outTris[i + 1];
      const z = outTris[i + 2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    const rootNode = objectRegistry.get(`${rootModelKey}#${item.objectId}`);
    const partName =
      objectNameMap.get(item.objectId) || rootNode?.name || `Object_${item.objectId}_${item.instanceIdx + 1}`;

    resolvedInstances.push({
      objectId: item.objectId,
      instanceIdx: item.instanceIdx,
      name: partName,
      printable: item.printable,
      hasTransform: hasTransformFlag.value,
      minX,
      maxX,
      minY,
      maxY,
      minZ,
      maxZ,
      worldTris3MF: new Float32Array(outTris),
    });
  }

  // Fallback nếu file 3MF xuất từ phần mềm CAD thuần không qua cấu trúc <object>/<build>
  if (resolvedInstances.length === 0) {
    for (const [, node] of objectRegistry.entries()) {
      if (node.vertices.length >= 9 && node.triangles.length >= 3) {
        const outTris: number[] = [];
        const hasTransformFlag = { value: false };
        collectLeafMeshes(node.modelPath, node.id, IDENTITY_TRANSFORM_12, hasTransformFlag, outTris, 0);
        if (outTris.length >= 9) {
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
          for (let i = 0; i < outTris.length; i += 3) {
            const x = outTris[i], y = outTris[i + 1], z = outTris[i + 2];
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
            if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
          }
          resolvedInstances.push({
            objectId: node.id,
            instanceIdx: 0,
            name: node.name,
            printable: true,
            hasTransform: false,
            minX, maxX, minY, maxY, minZ, maxZ,
            worldTris3MF: new Float32Array(outTris),
          });
        }
      }
    }
  }

  if (resolvedInstances.length === 0) {
    throw new Error('Không tìm thấy dữ liệu lưới tam giác hợp lệ trong file 3MF.');
  }

  // 5. Phân nhóm các chi tiết (resolvedInstances) vào từng Bàn in (Plate 1, Plate 2, ...)
  const plateBuckets = new Map<number, { plateName: string; items: IResolvedBuildItemInstance[] }>();
  const spatialTileToPlateId = new Map<string, number>();
  let nextDynamicPlateId = Math.max(1, ...Array.from(declaredPlateNames.keys()), 0) + 1;

  for (const inst of resolvedInstances) {
    const cx = (inst.minX + inst.maxX) * 0.5;
    const cy = (inst.minY + inst.maxY) * 0.5;

    // Ưu tiên 1: Ánh xạ từ Metadata/model_settings.config (<plate><model_instance>)
    const mapped =
      instanceToPlateMap.get(`${inst.objectId}#${inst.instanceIdx}`) ||
      instanceToPlateMap.get(`${inst.objectId}#*`);

    let targetPlateId = mapped ? mapped.plateId : 0;
    let targetPlateName = mapped ? mapped.plateName : '';

    // Kiểm tra nếu không có trong model_settings.config hoặc nhiều bàn in được trải theo lưới tọa độ Bambu (> 256mm)
    if (!targetPlateId) {
      // Trong Bambu Studio, Bàn in 1 nằm trong [0..256, 0..256]. Các bàn in tiếp theo cách nhau ~280..310mm
      const col = Math.floor((cx + 22) / 280);
      const row = Math.floor((278 - cy) / 280);
      if (col === 0 && row === 0) {
        targetPlateId = 1;
        targetPlateName = declaredPlateNames.get(1) || 'Bàn in 1';
      } else {
        const tileKey = `${row}_${col}`;
        if (!spatialTileToPlateId.has(tileKey)) {
          spatialTileToPlateId.set(tileKey, nextDynamicPlateId++);
        }
        targetPlateId = spatialTileToPlateId.get(tileKey)!;
        targetPlateName = declaredPlateNames.get(targetPlateId) || `Bàn in ${targetPlateId}`;
      }
    }

    if (!plateBuckets.has(targetPlateId)) {
      plateBuckets.set(targetPlateId, {
        plateName: targetPlateName || `Bàn in ${targetPlateId}`,
        items: [],
      });
    }
    plateBuckets.get(targetPlateId)!.items.push(inst);
  }

  // Sắp xếp thứ tự Bàn in 1, 2, 3...
  const sortedPlateIds = Array.from(plateBuckets.keys()).sort((a, b) => a - b);
  const resultPlates: IBambuPlateMeshData[] = [];

  for (const plateId of sortedPlateIds) {
    const bucket = plateBuckets.get(plateId)!;
    const items = bucket.items;

    let pMinX = Infinity, pMaxX = -Infinity;
    let pMinY = Infinity, pMaxY = -Infinity;
    let pMinZ = Infinity;
    let totalFloats = 0;

    for (const it of items) {
      if (it.minX < pMinX) pMinX = it.minX;
      if (it.maxX > pMaxX) pMaxX = it.maxX;
      if (it.minY < pMinY) pMinY = it.minY;
      if (it.maxY > pMaxY) pMaxY = it.maxY;
      if (it.minZ < pMinZ) pMinZ = it.minZ;
      totalFloats += it.worldTris3MF.length;
    }

    // Xác định tâm bàn in 3MF (cxPlate, cyPlate):
    // Nếu toàn bộ chi tiết của bàn in nằm gọn trong bàn in chuẩn [0..256, 0..256] của Bambu Studio,
    // giữ nguyên gốc tâm bàn in (128, 128) để khớp 1:1 tuyệt đối với G-code (Metadata/plate_N.gcode)!
    // Nếu bàn in nằm ở ô bàn in thứ 2, 3... (ngoài [0..256]), tính tâm ô bàn in 256x256 tương ứng hoặc tâm cụm
    let plateCenterX = 128;
    let plateCenterY = 128;
    const isInsidePrimaryBed = pMinX >= -25 && pMaxX <= 281 && pMinY >= -25 && pMaxY <= 281;
    if (!isInsidePrimaryBed) {
      const spanX = pMaxX - pMinX;
      const spanY = pMaxY - pMinY;
      if (spanX <= 260 && spanY <= 260) {
        plateCenterX = (pMinX + pMaxX) * 0.5;
        plateCenterY = (pMinY + pMaxY) * 0.5;
      } else {
        plateCenterX = (pMinX + pMaxX) * 0.5;
        plateCenterY = (pMinY + pMaxY) * 0.5;
      }
    }

    const zGroundOffset = isFinite(pMinZ) ? pMinZ : 0;
    const mergedPositions = new Float32Array(totalFloats);
    const bambuParts: IBambuPartGeometryRecord[] = [];
    let writeOffset = 0;

    for (const it of items) {
      const src = it.worldTris3MF;
      const partPos = new Float32Array(src.length);
      for (let i = 0; i < src.length; i += 3) {
        const xThree = src[i] - plateCenterX;
        const yThree = src[i + 2] - zGroundOffset;
        const zThree = src[i + 1] - plateCenterY;

        mergedPositions[writeOffset + i] = xThree;
        mergedPositions[writeOffset + i + 1] = yThree;
        mergedPositions[writeOffset + i + 2] = zThree;

        partPos[i] = xThree;
        partPos[i + 1] = yThree;
        partPos[i + 2] = zThree;
      }
      writeOffset += src.length;
      bambuParts.push({
        id: `${it.objectId}_${it.instanceIdx}`,
        name: it.name,
        positions: partPos,
      });
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
    geom.userData = {
      hasItemTransform: true,
      preservePlateLayout: true,
      plateId,
      plateName: bucket.plateName,
      partCount: items.length,
      plateCenter3MF: [plateCenterX, plateCenterY],
      bambuParts,
    };
    geom.computeBoundingBox();
    geom.computeVertexNormals();

    resultPlates.push({
      plateId,
      plateName: bucket.plateName,
      partCount: items.length,
      geometry: geom,
      plateCenter3MF: [plateCenterX, plateCenterY],
    });
  }

  return resultPlates;
}

/**
 * Bộ giải mã file 3MF chuyên dụng chuẩn Bambu Studio & OrcaSlicer
 * Trả về BufferGeometry của Bàn in đầu tiên đồng thời đính kèm toàn bộ danh sách `plates` trong `geom.userData.plates`
 */
export function parse3MFBuffer(buffer: ArrayBuffer): THREE.BufferGeometry {
  const plates = parse3MFPlatesFromBuffer(buffer);
  const primary = plates[0].geometry;
  primary.userData = {
    ...primary.userData,
    plates,
  };
  return primary;
}

/**
 * Bộ đọc file CAD thực tế hỗ trợ đầy đủ Bambu 3MF, Binary STL, ASCII STL và OBJ
 */
export function parseCADFile(buffer: ArrayBuffer, fileName: string): THREE.BufferGeometry {
  const lower = fileName.toLowerCase();
  const is3MF = lower.endsWith('.3mf');
  const isObj = lower.endsWith('.obj');
  let geom: THREE.BufferGeometry | null = null;
  let hasItemTransform = false;

  if (is3MF) {
    try {
      geom = parse3MFBuffer(buffer);
      hasItemTransform = Boolean(geom.userData?.hasItemTransform);
    } catch (err) {
      // Kiểm tra nếu file .3mf thực chất là file JSON preset từ phiên bản cũ (ví dụ benchy.3mf)
      try {
        const headText = new TextDecoder().decode(buffer.slice(0, 4096)).trim();
        if (headText.startsWith('{')) {
          const parsedJson = JSON.parse(new TextDecoder().decode(buffer));
          const modelIdRaw = String(parsedJson?.model?.id || parsedJson?.model?.name || fileName).toLowerCase();
          if (modelIdRaw.includes('cube')) geom = generateProceduralGeometry('cube');
          else if (modelIdRaw.includes('gear')) geom = generateProceduralGeometry('gear');
          else if (modelIdRaw.includes('organizer') || modelIdRaw.includes('gridfinity')) geom = generateProceduralGeometry('organizer');
          else if (modelIdRaw.includes('dragon')) geom = generateProceduralGeometry('dragon');
          else geom = generateProceduralGeometry('benchy');
          hasItemTransform = true;
        }
      } catch {
        // Không phải JSON preset
      }
      if (!geom) {
        console.warn('3MF parsing error, trying standard fallback:', err);
      }
    }
  } else if (isObj) {
    try {
      const text = new TextDecoder().decode(buffer);
      const objLoader = new OBJLoader();
      const objGroup = objLoader.parse(text);

      const geometries: THREE.BufferGeometry[] = [];
      objGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          geometries.push(child.geometry.clone().toNonIndexed());
        }
      });

      if (geometries.length > 0) {
        geom = BufferGeometryUtils.mergeGeometries(geometries, false);
      }
    } catch (err) {
      console.warn('OBJ parsing failed, trying STL loader:', err);
    }
  }

  if (!geom) {
    try {
      const stlLoader = new STLLoader();
      geom = stlLoader.parse(buffer);
    } catch (err) {
      console.error('STL parsing failed:', err);
      throw new Error('Không thể đọc file 3MF/STL/OBJ. Định dạng file không hợp lệ hoặc bị lỗi.');
    }
  }

  if (!geom || !geom.getAttribute('position') || geom.getAttribute('position').count === 0) {
    throw new Error('File không chứa dữ liệu hình học 3D (Lưới tam giác rỗng).');
  }

  if (!hasItemTransform) {
    if (lower.endsWith('.stl')) {
      geom.rotateX(-Math.PI / 2);
    }
    geom.center();
    geom.computeVertexNormals();

    // Chuẩn hóa kích thước phù hợp với khổ bàn 256x256mm
    geom.computeBoundingBox();
    const bbox = geom.boundingBox!;
    const dimX = bbox.max.x - bbox.min.x;
    const dimY = bbox.max.y - bbox.min.y;
    const dimZ = bbox.max.z - bbox.min.z;
    const maxDim = Math.max(dimX, dimY, dimZ);

    if (maxDim > 200) {
      const scale = 160 / maxDim;
      geom.scale(scale, scale, scale);
    } else if (maxDim < 5) {
      const scale = 50 / maxDim;
      geom.scale(scale, scale, scale);
    }
  }

  centerAndGroundGeometry(geom);
  return geom;
}

export function parseSTLFile(buffer: ArrayBuffer): THREE.BufferGeometry {
  return parseCADFile(buffer, 'model.stl');
}

/**
 * Áp dụng Transform (Position, Rotation, Scale) lên BufferGeometry
 * và tự động căn đáy chuẩn xác trên mặt bàn in (Y = 0)
 */
export function applyTransformToGeometry(
  baseGeom: THREE.BufferGeometry,
  transform: IModelTransform
): THREE.BufferGeometry {
  const geom = baseGeom.clone();

  // 1. Phóng to / Thu nhỏ (Scale)
  if (transform.scale !== 1.0) {
    geom.scale(transform.scale, transform.scale, transform.scale);
  }

  // 2. Xoay theo các trục Euler (Rotation)
  if (transform.rotation[0] !== 0) geom.rotateX(transform.rotation[0]);
  if (transform.rotation[1] !== 0) geom.rotateY(transform.rotation[1]);
  if (transform.rotation[2] !== 0) geom.rotateZ(transform.rotation[2]);

  // 3. Tự động căn đáy tiếp xúc mặt bàn in (Grounding to Y = 0)
  geom.computeBoundingBox();
  const bbox = geom.boundingBox || new THREE.Box3();
  geom.translate(0, -bbox.min.y, 0);

  // 4. Di chuyển trên mặt bàn in (Position X, Z) - Giới hạn an toàn trong khổ bàn 256x256mm
  const clampedX = Math.max(-105, Math.min(105, transform.position[0]));
  const clampedZ = Math.max(-105, Math.min(105, transform.position[2]));
  geom.translate(clampedX, 0, clampedZ);

  geom.computeVertexNormals();
  return geom;
}
