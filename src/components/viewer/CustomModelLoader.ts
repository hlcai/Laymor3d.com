import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { unzipSync, zipSync, strToU8 } from 'three/examples/jsm/libs/fflate.module.js';
import { ModelBuilder } from './ModelBuilder';
import { SampleModelId } from '@/backend/domain/sample-models';
import {
  IGeometryFingerprint,
  extractFingerprintFromThreeObject,
} from '@/backend/services/slicing/GeometryFingerprintEngine';

export interface ILoadedCustomModel {
  group: THREE.Group;
  dimensionsMm: { x: number; y: number; z: number };
  originalDimensionsMm: { x: number; y: number; z: number };
  volumeCm3: number;
  triangleCount: number;
  fileName: string;
  fileSizeBytes: number;
  height: number;
  geometryFingerprint?: IGeometryFingerprint;
}

interface IParsedMeshResult {
  group: THREE.Group;
  triangleCount: number;
  volumeCm3: number;
}

export class CustomModelLoader {
  /**
   * Tính toán thể tích chính xác của geometry theo công thức phân kỳ Gauss (Signed Volume of Tetrahedra)
   */
  static calculateVolume(geometry: THREE.BufferGeometry): number {
    const position = geometry.attributes.position;
    if (!position) return 0;

    const index = geometry.index;
    const faces = index ? index.count / 3 : position.count / 3;
    let totalVolume = 0;

    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    const p3 = new THREE.Vector3();

    for (let i = 0; i < faces; i++) {
      const i1 = index ? index.getX(i * 3) : i * 3;
      const i2 = index ? index.getX(i * 3 + 1) : i * 3 + 1;
      const i3 = index ? index.getX(i * 3 + 2) : i * 3 + 2;

      p1.fromBufferAttribute(position, i1);
      p2.fromBufferAttribute(position, i2);
      p3.fromBufferAttribute(position, i3);

      totalVolume += p1.dot(p2.clone().cross(p3)) / 6.0;
    }

    return Math.abs(totalVolume) / 1000.0;
  }

  /**
   * Bộ phân tích cú pháp Native XML 3MF dự phòng độc lập
   * Bóc tách trực tiếp các thẻ <mesh>, <vertices>, <triangles> từ file .model
   * Hoạt động bền vững ngay cả khi file 3MF thiếu hoàn toàn thư mục _rels/.rels
   */
  private static parseNative3MFXml(modelXmlText: string, material: THREE.Material): IParsedMeshResult | null {
    try {
      if (typeof window === 'undefined' || !window.DOMParser) return null;
      const parser = new DOMParser();
      const doc = parser.parseFromString(modelXmlText, 'application/xml');

      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        console.warn('Native 3MF XML parse error:', parseError.textContent);
        return null;
      }

      const rootGroup = new THREE.Group();
      let totalTriangles = 0;
      let totalVolume = 0;

      // Tìm tất cả các mesh node (hỗ trợ cả có và không có namespace)
      const meshNodes = doc.getElementsByTagName('mesh');
      if (!meshNodes || meshNodes.length === 0) return null;

      for (let mIdx = 0; mIdx < meshNodes.length; mIdx++) {
        const meshNode = meshNodes[mIdx];
        const vertexNodes = meshNode.getElementsByTagName('vertex');
        const triangleNodes = meshNode.getElementsByTagName('triangle');

        if (vertexNodes.length === 0 || triangleNodes.length === 0) continue;

        const vertices: number[] = [];
        for (let i = 0; i < vertexNodes.length; i++) {
          const v = vertexNodes[i];
          const x = parseFloat(v.getAttribute('x') || '0');
          const y = parseFloat(v.getAttribute('y') || '0');
          const z = parseFloat(v.getAttribute('z') || '0');
          vertices.push(x, y, z);
        }

        const indices: number[] = [];
        for (let i = 0; i < triangleNodes.length; i++) {
          const t = triangleNodes[i];
          const v1 = parseInt(t.getAttribute('v1') || '0', 10);
          const v2 = parseInt(t.getAttribute('v2') || '0', 10);
          const v3 = parseInt(t.getAttribute('v3') || '0', 10);
          indices.push(v1, v2, v3);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        // Chuẩn hóa Z-up (chuẩn in 3D) sang Y-up (Three.js)
        geometry.rotateX(-Math.PI / 2);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        rootGroup.add(mesh);

        totalTriangles += indices.length / 3;
        totalVolume += this.calculateVolume(geometry);
      }

      if (rootGroup.children.length === 0) return null;

      return {
        group: rootGroup,
        triangleCount: totalTriangles,
        volumeCm3: totalVolume,
      };
    } catch (err) {
      console.warn('Lỗi khi parse Native 3MF XML:', err);
      return null;
    }
  }

  /**
   * Tự động sửa lỗi & phục hồi gói tệp 3MF (Auto-Healing Archive):
   * 1. Chuẩn hóa đường dẫn Windows backslash `\` thành `/`
   * 2. Tự động tiêm file `_rels/.rels` và `[Content_Types].xml` nếu bị thiếu
   * 3. Trích xuất file .stl / .obj nếu người dùng đóng gói STL bên trong 3MF
   */
  private static heal3MFArchive(arrayBuffer: ArrayBuffer): {
    healedBuffer?: ArrayBuffer;
    extractedStl?: Uint8Array;
    extractedObj?: string;
    nativeModelXml?: string;
    extractedPresetJson?: string;
  } {
    try {
      const uint8 = new Uint8Array(arrayBuffer);
      // Kiểm tra magic header của tệp ZIP (PK\x03\x04)
      if (uint8.length < 4 || uint8[0] !== 0x50 || uint8[1] !== 0x4B || uint8[2] !== 0x03 || uint8[3] !== 0x04) {
        return {};
      }

      const unzipped = unzipSync(uint8);
      const normalizedFiles: Record<string, Uint8Array> = {};
      let relsFound = false;
      let primaryModelPath: string | null = null;
      let primaryModelXml: string | null = null;
      let extractedStl: Uint8Array | undefined;
      let extractedObj: string | undefined;
      let extractedPresetJson: string | undefined;

      const decoder = new TextDecoder();

      for (const rawPath in unzipped) {
        // Chuẩn hóa tên đường dẫn: đổi \ thành /, xóa / ở đầu
        const cleanPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
        const data = unzipped[rawPath];
        normalizedFiles[cleanPath] = data;

        const lower = cleanPath.toLowerCase();

        // Kiểm tra xem có file STL hoặc OBJ bên trong zip không
        if (lower.endsWith('.stl') && !extractedStl) {
          extractedStl = data;
        } else if (lower.endsWith('.obj') && !extractedObj) {
          extractedObj = decoder.decode(data);
        }

        // Kiểm tra xem có file JSON preset không
        if ((lower.endsWith('config.json') || lower.endsWith('preset.json') || lower.endsWith('.json')) && !extractedPresetJson) {
          try {
            const jsonText = decoder.decode(data);
            if (jsonText.includes('3D Hub') || jsonText.includes('"model"')) {
              extractedPresetJson = jsonText;
            }
          } catch {}
        }

        // Kiểm tra relationship
        if (lower.endsWith('_rels/.rels')) {
          relsFound = true;
        }

        // Tìm file model XML chính
        if (lower.endsWith('.model')) {
          if (!primaryModelPath || lower === '3d/3dmodel.model') {
            primaryModelPath = cleanPath;
            primaryModelXml = decoder.decode(data);
          }
        }
      }

      // Nếu có file STL/OBJ trong zip, trả về ngay
      if (extractedStl || extractedObj) {
        return { extractedStl, extractedObj, nativeModelXml: primaryModelXml || undefined, extractedPresetJson };
      }

      // Nếu tìm thấy file model nhưng thiếu _rels/.rels: TIÊM TỰ ĐỘNG
      if (primaryModelPath && !relsFound) {
        const targetTarget = primaryModelPath.startsWith('/') ? primaryModelPath : `/${primaryModelPath}`;

        const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="${targetTarget}" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

        const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodelxml" />
</Types>`;

        normalizedFiles['_rels/.rels'] = strToU8(relsXml);
        if (!normalizedFiles['[Content_Types].xml']) {
          normalizedFiles['[Content_Types].xml'] = strToU8(contentTypesXml);
        }

        // Đóng gói lại thành zip sạch bằng zipSync
        const healedZip = zipSync(normalizedFiles);
        return {
          healedBuffer: healedZip.buffer,
          nativeModelXml: primaryModelXml || undefined,
          extractedPresetJson,
        };
      }

      return {
        nativeModelXml: primaryModelXml || undefined,
        extractedPresetJson,
      };
    } catch (err) {
      console.warn('Auto-healing 3MF archive failed:', err);
      return {};
    }
  }

  /**
   * Phân tích tệp STL
   */
  private static parseSTL(arrayBuffer: ArrayBuffer, material: THREE.Material): IParsedMeshResult {
    const loader = new STLLoader();
    const geometry = loader.parse(arrayBuffer);
    geometry.computeVertexNormals();

    // Chuẩn hóa Z-up (chuẩn in 3D) sang Y-up (Three.js)
    geometry.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const group = new THREE.Group();
    group.add(mesh);

    const triangleCount = geometry.attributes.position ? geometry.attributes.position.count / 3 : 0;
    if (triangleCount === 0) {
      throw new Error('Tệp STL không chứa dữ liệu đỉnh hoặc mặt tam giác hợp lệ.');
    }
    const volumeCm3 = this.calculateVolume(geometry);

    return { group, triangleCount, volumeCm3 };
  }

  /**
   * Phân tích tệp OBJ
   */
  private static parseOBJ(textOrBuffer: string | ArrayBuffer, material: THREE.Material): IParsedMeshResult {
    const text = typeof textOrBuffer === 'string' ? textOrBuffer : new TextDecoder().decode(textOrBuffer);
    const loader = new OBJLoader();
    const obj = loader.parse(text);

    let totalTriangles = 0;
    let totalVolume = 0;

    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.material = material;
        m.castShadow = true;
        m.receiveShadow = true;
        if (m.geometry) {
          m.geometry.rotateX(-Math.PI / 2);
          totalTriangles += m.geometry.attributes.position ? m.geometry.attributes.position.count / 3 : 0;
          totalVolume += this.calculateVolume(m.geometry);
        }
      }
    });

    if (totalTriangles === 0 || obj.children.length === 0) {
      throw new Error('Tệp OBJ không chứa dữ liệu hình học hoặc bề mặt 3D hợp lệ.');
    }

    return { group: obj, triangleCount: totalTriangles, volumeCm3: totalVolume };
  }

  /**
   * Phân tích tệp GLB / GLTF
   */
  private static async parseGLTF(arrayBuffer: ArrayBuffer, material: THREE.Material): Promise<IParsedMeshResult> {
    const loader = new GLTFLoader();
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.parse(arrayBuffer, '', resolve, reject);
    });

    let totalTriangles = 0;
    let totalVolume = 0;

    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.geometry) {
          totalTriangles += child.geometry.attributes.position ? child.geometry.attributes.position.count / 3 : 0;
          totalVolume += this.calculateVolume(child.geometry);
        }
      }
    });

    if (totalTriangles === 0 || gltf.scene.children.length === 0) {
      throw new Error('Tệp GLTF/GLB không chứa dữ liệu mô hình 3D hợp lệ.');
    }

    return { group: gltf.scene, triangleCount: totalTriangles, volumeCm3: totalVolume };
  }

  /**
   * Phân tích tệp 3MF với 3 tầng tự phục hồi (Auto-Healing, Native XML Fallback, Embedded Extraction)
   */
  private static async parse3MF(arrayBuffer: ArrayBuffer, material: THREE.Material): Promise<IParsedMeshResult> {
    // 1. Quét & phục hồi gói tệp 3MF
    const healed = this.heal3MFArchive(arrayBuffer);

    // 1a. Nếu tệp nén chứa sẵn file STL bên trong:
    if (healed.extractedStl) {
      try {
        const res = this.parseSTL(healed.extractedStl.buffer as ArrayBuffer, material);
        if (res.triangleCount > 0) return res;
      } catch (e) {
        console.warn('Không thể parse STL nhúng trong 3MF:', e);
      }
    }

    // 1b. Nếu tệp nén chứa sẵn file OBJ bên trong:
    if (healed.extractedObj) {
      try {
        const res = this.parseOBJ(healed.extractedObj, material);
        if (res.triangleCount > 0) return res;
      } catch (e) {
        console.warn('Không thể parse OBJ nhúng trong 3MF:', e);
      }
    }

    // 2. Thử nạp bằng ThreeMFLoader tiêu chuẩn (sử dụng buffer đã được phục hồi tiêm _rels/.rels nếu có)
    const targetBuffer = healed.healedBuffer || arrayBuffer;
    try {
      const loader = new ThreeMFLoader();
      const group3mf = loader.parse(targetBuffer);

      // Chuẩn 3MF cũng dùng Z-up, xoay -90 độ quanh X sang Y-up
      group3mf.rotation.x = -Math.PI / 2;

      let totalTriangles = 0;
      let totalVolume = 0;

      group3mf.traverse((child: any) => {
        if (child.isMesh) {
          child.material = material;
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.geometry) {
            totalTriangles += child.geometry.attributes.position ? child.geometry.attributes.position.count / 3 : 0;
            totalVolume += this.calculateVolume(child.geometry);
          }
        }
      });

      if (group3mf.children.length > 0 && totalTriangles > 0) {
        return { group: group3mf, triangleCount: totalTriangles, volumeCm3: totalVolume };
      }
    } catch (err: any) {
      console.warn('ThreeMFLoader chuẩn thất bại, chuyển sang Native XML Parser:', err?.message);
    }

    // 3. Tầng cứu nguy: Native 3MF XML Parser
    if (healed.nativeModelXml) {
      const nativeResult = this.parseNative3MFXml(healed.nativeModelXml, material);
      if (nativeResult && nativeResult.triangleCount > 0) {
        return nativeResult;
      }
    }

    // 4. Nếu trong zip có file JSON preset của 3D Hub:
    if (healed.extractedPresetJson) {
      try {
        const cfg = JSON.parse(healed.extractedPresetJson);
        const rawId = (cfg.model?.id || cfg.model?.name || '').toLowerCase();
        let sampleId: SampleModelId = 'benchy';
        const validIds: SampleModelId[] = ['benchy', 'dragon', 'robot', 'gear', 'helmet', 'turbine', 'eiffel'];
        if (validIds.includes(rawId as SampleModelId)) {
          sampleId = rawId as SampleModelId;
        } else {
          const m = validIds.find((id) => rawId.includes(id));
          if (m) sampleId = m;
        }
        const { group: builtGroup } = ModelBuilder.buildModel(sampleId, material);
        let totalTriangles = 0;
        let totalVolume = 0;
        builtGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            if (m.geometry) {
              totalTriangles += m.geometry.attributes.position ? m.geometry.attributes.position.count / 3 : 0;
              totalVolume += this.calculateVolume(m.geometry);
            }
          }
        });
        if (totalTriangles > 0) {
          return { group: builtGroup, triangleCount: totalTriangles, volumeCm3: totalVolume };
        }
      } catch (err) {
        console.warn('Không thể parse preset JSON từ 3MF archive:', err);
      }
    }

    // 5. Nếu vẫn không được, thử parse như STL (trường hợp người dùng đổi đuôi .stl thành .3mf)
    try {
      const stlResult = this.parseSTL(arrayBuffer, material);
      if (stlResult.triangleCount > 0) {
        return stlResult;
      }
    } catch {
      // Bỏ qua
    }

    throw new Error('Tệp 3MF không chứa cấu trúc lưới in 3D hợp lệ hoặc bị mã hóa không tương thích.');
  }

  /**
   * Tải và xử lý file 3D từ máy tính người dùng (.stl, .obj, .glb, .gltf, .3mf)
   * Tự động phục hồi lỗi tệp, nhận diện định dạng thông minh và chuyển đổi hệ tọa độ Z-up sang Y-up
   */
  static async loadFromFile(file: File, material: THREE.Material): Promise<ILoadedCustomModel> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const arrayBuffer = await file.arrayBuffer();

    // 0. SMART PRESET INGESTION:
    // Tự động nhận diện nếu tệp nạp vào là cấu hình Preset Slicer của 3D Hub (dạng JSON định dạng .3mf/.json)
    const previewLength = Math.min(arrayBuffer.byteLength, 2048);
    const previewText = new TextDecoder().decode(new Uint8Array(arrayBuffer, 0, previewLength)).trim();
    if (previewText.startsWith('{')) {
      try {
        const fullText = new TextDecoder().decode(arrayBuffer);
        const cfg = JSON.parse(fullText);
        if (cfg.generator?.includes('3D Hub') || cfg.model?.id || (cfg.targetSlicers && cfg.process)) {
          console.log('Phát hiện tệp Cấu hình Slicer Preset của 3D Hub. Đang kích hoạt Smart Preset Ingestion...');
          const rawId = (cfg.model?.id || cfg.model?.name || '').toLowerCase();
          const validIds: SampleModelId[] = ['benchy', 'dragon', 'robot', 'gear', 'helmet', 'turbine', 'eiffel'];
          let sampleId: SampleModelId = 'benchy';
          if (validIds.includes(rawId as SampleModelId)) {
            sampleId = rawId as SampleModelId;
          } else {
            const matched = validIds.find((id) => rawId.includes(id));
            if (matched) sampleId = matched;
          }

          const { group: builtGroup, height } = ModelBuilder.buildModel(sampleId, material);
          let totalTriangles = 0;
          let totalVolume = 0;
          builtGroup.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = child as THREE.Mesh;
              if (m.geometry) {
                totalTriangles += m.geometry.attributes.position ? m.geometry.attributes.position.count / 3 : 0;
                totalVolume += this.calculateVolume(m.geometry);
              }
            }
          });

          const targetDims = cfg.model?.dimensions || { x: 60, y: 31, z: 48 };

          return {
            group: builtGroup,
            dimensionsMm: targetDims,
            originalDimensionsMm: targetDims,
            volumeCm3: Math.max(0.1, Math.round(totalVolume * 10) / 10),
            triangleCount: Math.round(totalTriangles),
            fileName: file.name,
            fileSizeBytes: file.size,
            height: Math.max(0.05, height),
          };
        }
      } catch (err) {
        console.warn('Không phải JSON preset hợp lệ, tiếp tục chu trình nạp 3D thông thường:', err);
      }
    }

    let parseResult: IParsedMeshResult | null = null;
    let lastError: Error | null = null;

    // 1. Thử loader tương ứng với đuôi file
    if (ext === 'stl') {
      try {
        parseResult = this.parseSTL(arrayBuffer, material);
      } catch (err: any) {
        lastError = err;
      }
    } else if (ext === 'obj') {
      try {
        parseResult = this.parseOBJ(arrayBuffer, material);
      } catch (err: any) {
        lastError = err;
      }
    } else if (ext === 'glb' || ext === 'gltf') {
      try {
        parseResult = await this.parseGLTF(arrayBuffer, material);
      } catch (err: any) {
        lastError = err;
      }
    } else if (ext === '3mf') {
      try {
        parseResult = await this.parse3MF(arrayBuffer, material);
      } catch (err: any) {
        lastError = err;
      }
    }

    // 2. Fallback liên hoàn nếu định dạng dự kiến thất bại (xử lý trường hợp file bị đổi sai đuôi)
    if (!parseResult) {
      console.warn(`Nạp định dạng .${ext} thất bại, kích hoạt cơ chế nhận diện định dạng thông minh dự phòng...`);

      // Thử 3MF nếu có magic bytes ZIP
      if (ext !== '3mf') {
        try {
          parseResult = await this.parse3MF(arrayBuffer, material);
        } catch {}
      }

      // Thử STL
      if (!parseResult && ext !== 'stl') {
        try {
          parseResult = this.parseSTL(arrayBuffer, material);
        } catch {}
      }

      // Thử OBJ
      if (!parseResult && ext !== 'obj') {
        try {
          parseResult = this.parseOBJ(arrayBuffer, material);
        } catch {}
      }

      // Thử GLTF/GLB
      if (!parseResult && ext !== 'glb' && ext !== 'gltf') {
        try {
          parseResult = await this.parseGLTF(arrayBuffer, material);
        } catch {}
      }
    }

    if (!parseResult || parseResult.triangleCount <= 0 || parseResult.group.children.length === 0) {
      throw new Error(
        lastError?.message ||
        `Không thể nạp file "${file.name}". Định dạng không được hỗ trợ hoặc tệp bị rỗng (0 mặt). Vui lòng chọn tệp .STL, .3MF, .OBJ, hoặc .GLB hợp lệ.`
      );
    }

    const { group: rootGroup, triangleCount: totalTriangles, volumeCm3: calculatedVolume } = parseResult;

    // 3. Tính toán bounding box thực tế của mô hình (mm)
    rootGroup.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(rootGroup);
    let size = new THREE.Vector3();
    box.getSize(size);
    let center = new THREE.Vector3();
    box.getCenter(center);

    // Xử lý đơn vị nếu file xuất theo Mét hoặc Unit Cube AI 2D->3D (< 2.5 đơn vị ở cả 3 chiều)
    // Các API AI như Fal.ai Trellis / Tripo3D / Meshy trả về GLB trong không gian chuẩn hóa [-0.5, 0.5] (1x1x1m)
    let finalVolume = calculatedVolume;
    const rawMaxDim = Math.max(size.x, size.y, size.z, 0.001);
    if (rawMaxDim <= 2.5) {
      const targetMaxMm = 80.0;
      const unitMultiplier = targetMaxMm / rawMaxDim;
      rootGroup.scale.multiplyScalar(unitMultiplier);
      rootGroup.updateMatrixWorld(true);
      box.setFromObject(rootGroup);
      box.getSize(size);
      box.getCenter(center);
      finalVolume *= Math.pow(unitMultiplier, 3);
    }

    // 4. Thuật toán tự động áp phẳng bàn in (Auto Lay-Flat):
    // Trục mỏng nhất phải luôn là trục Y (thẳng đứng, hướng vuông góc với bàn in)
    if (size.z < size.y * 0.45 && size.z < size.x * 0.45) {
      rootGroup.rotation.x += Math.PI / 2;
      rootGroup.updateMatrixWorld(true);
      box.setFromObject(rootGroup);
      box.getSize(size);
      box.getCenter(center);
    } else if (size.x < size.y * 0.45 && size.x < size.z * 0.45) {
      rootGroup.rotation.z += Math.PI / 2;
      rootGroup.updateMatrixWorld(true);
      box.setFromObject(rootGroup);
      box.getSize(size);
      box.getCenter(center);
    }

    // Kích thước thực tế ban đầu (mm)
    const realX = Math.max(1, Math.round(size.x * 10) / 10);
    const realY = Math.max(1, Math.round(size.z * 10) / 10); // Slicer Y là chiều sâu
    const realZ = Math.max(1, Math.round(size.y * 10) / 10); // Slicer Z là chiều cao

    // Trích xuất 12 chỉ số hình học vật lý thực (12-Point Geometry Fingerprint) ở hệ tọa độ mm
    const geometryFingerprint = extractFingerprintFromThreeObject(rootGroup);

    // Tự động đồng bộ ngầm Model + Geometry Fingerprint lên Google Drive / Google Sheets Registry
    if (typeof window !== 'undefined') {
      fetch('/api/v1/storage/gdrive-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: `mdl_${file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${file.size}`,
          fileName: file.name,
          fileFormat: ext.toUpperCase(),
          fileSizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
          fingerprint: geometryFingerprint,
        }),
      }).catch(() => {});
    }

    // 5. Chuẩn hóa tỷ lệ hiển thị trên 3D Studio Canvas
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const displayScale = 2.0 / maxDim;

    rootGroup.scale.multiplyScalar(displayScale);
    rootGroup.updateMatrixWorld(true);

    const scaledBox = new THREE.Box3().setFromObject(rootGroup);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    // Căn giữa trục X, Z và đặt đáy tiếp xúc mặt phẳng Y = 0
    rootGroup.position.x -= scaledCenter.x;
    rootGroup.position.z -= scaledCenter.z;
    rootGroup.position.y -= scaledBox.min.y;

    // Đóng gói vào wrapper group độc lập với transform chuẩn sạch
    const finalContainer = new THREE.Group();
    finalContainer.add(rootGroup);
    finalContainer.updateMatrixWorld(true);

    const finalBox = new THREE.Box3().setFromObject(finalContainer);
    const finalHeight = Math.max(0.05, finalBox.max.y - finalBox.min.y);

    const initialDims = {
      x: Math.round(realX),
      y: Math.round(realY),
      z: Math.round(realZ),
    };

    return {
      group: finalContainer,
      dimensionsMm: initialDims,
      originalDimensionsMm: initialDims,
      volumeCm3: Math.max(0.1, Math.round((geometryFingerprint.trueVolumeCm3 || finalVolume) * 10) / 10),
      triangleCount: Math.round(totalTriangles),
      fileName: file.name,
      fileSizeBytes: file.size,
      height: finalHeight,
      geometryFingerprint,
    };
  }

  /**
   * Tải mô hình 3D trực tiếp từ URL (ví dụ kết quả GLB trả về từ Fal.ai Trellis / Tripo3D)
   */
  static async loadFromUrl(
    url: string,
    fileName = 'AI_Generated_Model.glb',
    material: THREE.Material
  ): Promise<ILoadedCustomModel> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Không thể tải tệp 3D từ URL (${response.status})`);
    }
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: blob.type || 'model/gltf-binary' });
    return this.loadFromFile(file, material);
  }
}
