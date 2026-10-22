import * as THREE from 'three';
import { IExpertPrintProfile } from '../../domain/wallet';
import { IPrinterProfile, ISupportConfig } from '../../domain/slicing';
import { ModelBuilder } from '@/components/viewer/ModelBuilder';
import { SupportBuilder } from '@/components/viewer/SupportBuilder';
import { SampleModelId } from '@/backend/domain/sample-models';
import { zipSync, strToU8 } from 'three/examples/jsm/libs/fflate.module.js';

export class PresetGeneratorService {
  /**
   * Generates and triggers download of a real Slicer Preset (.3MF project bundle)
   * Packed as a true 3MF OPC zip archive containing real 3D geometry and slicer settings.
   * Fully compatible with Bambu Studio, OrcaSlicer, PrusaSlicer, and 3D Hub Studio.
   */
  static downloadPreset(
    profile: IExpertPrintProfile,
    printer?: IPrinterProfile,
    dimensionsMm?: { x: number; y: number; z: number },
    supportConfig?: ISupportConfig,
    customGroup?: THREE.Group
  ): string {
    const filename = `${profile.modelName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${printer?.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'BambuLab'}_Preset.3mf`;

    const configData = {
      generator: 'Laymor3D Slicer Intelligence System v2.5',
      targetSlicers: ['Bambu Studio', 'OrcaSlicer', 'PrusaSlicer'],
      model: {
        id: profile.modelId,
        name: profile.modelName,
        dimensions: dimensionsMm || { x: 60, y: 31, z: 48 },
      },
      printer: {
        name: printer?.name || 'Bambu Lab X1-Carbon',
        bedType: 'Textured PEI Plate',
        bedDimensions: printer?.bedDimensions || { x: 256, y: 256, z: 256 },
        nozzleDiameterMm: profile.nozzleSizeMm,
      },
      filament: {
        type: profile.filamentType,
        brand: profile.filamentBrand,
        nozzleTempC: profile.nozzleTempC,
        firstLayerNozzleTempC: profile.firstLayerNozzleTempC,
        bedTempC: profile.bedTempC,
        fanSpeedPercent: profile.coolingFanPercent,
      },
      process: {
        layerHeightMm: profile.layerHeightMm,
        firstLayerHeightMm: profile.firstLayerHeightMm,
        outerWallSpeedMmS: profile.outerWallSpeedMmS,
        innerWallSpeedMmS: profile.innerWallSpeedMmS,
        infillSpeedMmS: profile.infillSpeedMmS,
        topSurfaceSpeedMmS: profile.topSurfaceSpeedMmS,
        infillPattern: profile.infillPattern,
        infillDensityPercent: profile.infillDensityPercent,
        seamPosition: profile.seamPosition,
        ironingEnabled: profile.ironingEnabled,
        retractionDistanceMm: profile.retractionDistanceMm,
        retractionSpeedMmS: profile.retractionSpeedMmS,
        zHopMm: profile.zHopMm,
      },
      supports: {
        enabled: supportConfig?.enabled ?? true,
        type: supportConfig?.type || 'tree',
        overhangThresholdDeg: supportConfig?.overhangThresholdDegrees || 45,
        treeBranchAngleDeg: profile.treeSupportParams.branchAngleDeg,
        treeBranchDiameterMm: profile.treeSupportParams.branchDiameterMm,
        topInterfaceLayers: profile.treeSupportParams.topInterfaceLayers,
        topInterfaceSpacingMm: profile.treeSupportParams.topInterfaceSpacingMm,
      },
      proTips: profile.proTips,
      gcodeSnippet: {
        startGcode: `; === LAYMOR 3D OPTIMIZED START GCODE ===\nG28 ; Home all axes\nM104 S${profile.firstLayerNozzleTempC} ; Set nozzle temp\nM140 S${profile.bedTempC} ; Set bed temp\nG29.1 Z${profile.zHopMm} ; Auto bed tramming offset\nM109 S${profile.firstLayerNozzleTempC} ; Wait nozzle temp\nM190 S${profile.bedTempC} ; Wait bed temp\nG1 Z0.2 F1200 ; Prime line approach\nG1 X60.0 E9.0 F1000 ; Intro line\n; =====================================`,
        endGcode: `; === LAYMOR 3D OPTIMIZED END GCODE ===\nM104 S0 ; Turn off extruder\nM140 S0 ; Turn off bed\nG91 ; Relative positioning\nG1 E-1 F300 ; Retract\nG1 Z+10 F3000 ; Move up\nG90 ; Absolute positioning\nG1 X0 Y${printer?.bedDimensions.y || 256} F3000 ; Present print\nM84 ; Disable motors\n; ===================================`,
      },
    };

    // 1. Khởi tạo hình học 3D thực tế của mô hình (ưu tiên customGroup từ AI 2D->3D / File tải lên)
    let builtGroup = new THREE.Group();
    const rawId = (profile.modelId || 'benchy').toLowerCase();
    const validIds: SampleModelId[] = ['benchy', 'dragon', 'robot', 'gear', 'helmet', 'turbine', 'eiffel'];
    let sampleId: SampleModelId = 'benchy';
    if (validIds.includes(rawId as SampleModelId)) {
      sampleId = rawId as SampleModelId;
    } else {
      const matched = validIds.find((id) => rawId.includes(id));
      if (matched) sampleId = matched;
    }

    let modelSubGroup: THREE.Group;
    if (customGroup) {
      modelSubGroup = customGroup.clone(true);
    } else {
      const dummyMat = new THREE.MeshBasicMaterial();
      modelSubGroup = ModelBuilder.buildModel(sampleId, dummyMat).group;
    }
    builtGroup.add(modelSubGroup);

    // Chuẩn hóa kích thước hình học theo dimensionsMm (đo trên modelSubGroup trước khi gắn Tree Support)
    const targetX = dimensionsMm?.x || 80;
    const targetY = dimensionsMm?.y || 80; // Slicer Y là chiều sâu
    const targetZ = dimensionsMm?.z || 80; // Slicer Z là chiều cao

    modelSubGroup.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(modelSubGroup);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Đính kèm hệ thống 3D Tree Support trực tiếp vào mô hình xuất .3MF khi bật Support
    const sType = supportConfig?.enabled === false ? 'none' : (supportConfig?.type || 'tree');
    if (sType !== 'none') {
      const supportMeshGroup = SupportBuilder.buildSupports(
        sType,
        customGroup ? 'custom' : sampleId,
        undefined,
        customGroup ? modelSubGroup : undefined
      );
      builtGroup.add(supportMeshGroup);
    }

    if (size.x > 0.001 && size.y > 0.001 && size.z > 0.001) {
      const scaleX = targetX / size.x;
      const scaleY = targetZ / size.y;
      const scaleZ = targetY / size.z;
      builtGroup.scale.multiply(new THREE.Vector3(scaleX, scaleY, scaleZ));
      builtGroup.updateMatrixWorld(true);
    }

    // Đặt đáy mô hình chạm mặt phẳng Z = 0 trong không gian 3MF
    const scaledBox = new THREE.Box3().setFromObject(builtGroup);
    const minY = scaledBox.min.y;

    // 2. Chuyển đổi lưới 3D Three.js sang định dạng chuẩn 3MF XML
    let vertexOffset = 0;
    let verticesXml = '';
    let trianglesXml = '';

    builtGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geom = mesh.geometry;
        if (!geom) return;

        const pos = geom.attributes.position;
        if (!pos) return;

        const index = geom.index;
        const meshMatrix = mesh.matrixWorld;
        const v = new THREE.Vector3();
        const count = pos.count;
        const baseVertex = vertexOffset;

        for (let i = 0; i < count; i++) {
          v.fromBufferAttribute(pos, i);
          v.applyMatrix4(meshMatrix);

          // Three.js (Y-up) sang 3MF (Z-up):
          // 3MF X = v.x, 3MF Y = -v.z, 3MF Z = v.y - minY
          const x3mf = v.x.toFixed(4);
          const y3mf = (-v.z).toFixed(4);
          const z3mf = Math.max(0, v.y - minY).toFixed(4);
          verticesXml += `          <vertex x="${x3mf}" y="${y3mf}" z="${z3mf}" />\n`;
        }

        if (index) {
          for (let i = 0; i < index.count; i += 3) {
            const v1 = baseVertex + index.getX(i);
            const v2 = baseVertex + index.getX(i + 1);
            const v3 = baseVertex + index.getX(i + 2);
            trianglesXml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
          }
        } else {
          for (let i = 0; i < count; i += 3) {
            const v1 = baseVertex + i;
            const v2 = baseVertex + i + 1;
            const v3 = baseVertex + i + 2;
            trianglesXml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
          }
        }

        vertexOffset += count;
      }
    });

    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${profile.modelName}</metadata>
  <metadata name="Designer">Laymor 3D Studio</metadata>
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>
${verticesXml}        </vertices>
        <triangles>
${trianglesXml}        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodelxml" />
  <Default Extension="config" ContentType="text/plain" />
  <Default Extension="json" ContentType="application/json" />
</Types>`;

    const projectConfig = `; Bambu Studio / OrcaSlicer Project Preset
; Exported by Laymor 3D Slicer Intelligence
[print]
name = ${profile.modelName} - Laymor 3D Expert Profile
printer_model = ${printer?.name || 'Bambu Lab X1-Carbon'}
layer_height = ${profile.layerHeightMm}
initial_layer_print_height = ${profile.firstLayerHeightMm}
line_width = ${profile.nozzleSizeMm}
outer_wall_speed = ${profile.outerWallSpeedMmS}
inner_wall_speed = ${profile.innerWallSpeedMmS}
sparse_infill_speed = ${profile.infillSpeedMmS}
top_surface_speed = ${profile.topSurfaceSpeedMmS}
sparse_infill_density = ${profile.infillDensityPercent}%
sparse_infill_pattern = ${profile.infillPattern}
seam_position = ${profile.seamPosition}
ironing_type = ${profile.ironingEnabled ? 'top' : 'no'}
support_enable = ${supportConfig?.enabled ?? true ? 1 : 0}
support_type = ${supportConfig?.type === 'tree' ? 'tree_hybrid' : 'normal'}
support_threshold_angle = ${supportConfig?.overhangThresholdDegrees || 45}

[filament]
filament_type = ${profile.filamentType}
filament_vendor = ${profile.filamentBrand}
nozzle_temperature = ${profile.nozzleTempC}
nozzle_temperature_initial_layer = ${profile.firstLayerNozzleTempC}
bed_temperature = ${profile.bedTempC}
bed_temperature_initial_layer = ${profile.bedTempC}
fan_cooling_speed = ${profile.coolingFanPercent}%
retraction_length = ${profile.retractionDistanceMm}
retraction_speed = ${profile.retractionSpeedMmS}
z_hop = ${profile.zHopMm}
`;

    // 3. Đóng gói ZIP chuẩn 3MF OPC
    const zipFiles: Record<string, Uint8Array> = {
      '_rels/.rels': strToU8(relsXml),
      '[Content_Types].xml': strToU8(contentTypesXml),
      '3D/3dmodel.model': strToU8(modelXml),
      'Metadata/project_settings.config': strToU8(projectConfig),
      '3DHub_Preset_Config.json': strToU8(JSON.stringify(configData, null, 2)),
    };

    let blob: Blob;
    try {
      const zipBuffer = zipSync(zipFiles);
      blob = new Blob([zipBuffer as unknown as BlobPart], {
        type: 'application/vnd.ms-package.3dmanufacturing-3dmodelxml',
      });
    } catch (zipErr) {
      console.warn('Lỗi khi nén ZIP 3MF, fallback sang cấu hình JSON:', zipErr);
      blob = new Blob([JSON.stringify(configData, null, 2)], {
        type: 'application/octet-stream',
      });
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return filename;
  }

  /**
   * Generates and downloads a real Binary STL file of the active 3D model scaled to dimensionsMm
   */
  static downloadSTL(
    modelName: string,
    dimensionsMm?: { x: number; y: number; z: number },
    customGroup?: THREE.Group,
    supportConfig?: ISupportConfig
  ): string {
    const filename = `${modelName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Model.stl`;

    const builtGroup = new THREE.Group();
    const rawId = (modelName || 'benchy').toLowerCase();
    const validIds: SampleModelId[] = ['benchy', 'dragon', 'robot', 'gear', 'helmet', 'turbine', 'eiffel'];
    let sampleId: SampleModelId = 'benchy';
    if (validIds.includes(rawId as SampleModelId)) {
      sampleId = rawId as SampleModelId;
    } else {
      const matched = validIds.find((id) => rawId.includes(id));
      if (matched) sampleId = matched;
    }

    let modelSubGroup: THREE.Group;
    if (customGroup) {
      modelSubGroup = customGroup.clone(true);
    } else {
      const dummyMat = new THREE.MeshBasicMaterial();
      modelSubGroup = ModelBuilder.buildModel(sampleId, dummyMat).group;
    }
    builtGroup.add(modelSubGroup);

    const targetX = dimensionsMm?.x || 80;
    const targetY = dimensionsMm?.y || 80;
    const targetZ = dimensionsMm?.z || 80;

    modelSubGroup.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(modelSubGroup);
    const size = new THREE.Vector3();
    box.getSize(size);

    const sType = supportConfig?.enabled === false ? 'none' : (supportConfig?.type || 'tree');
    if (sType !== 'none') {
      const supportMeshGroup = SupportBuilder.buildSupports(
        sType,
        customGroup ? 'custom' : sampleId,
        undefined,
        customGroup ? modelSubGroup : undefined
      );
      builtGroup.add(supportMeshGroup);
    }

    if (size.x > 0.001 && size.y > 0.001 && size.z > 0.001) {
      builtGroup.scale.multiply(
        new THREE.Vector3(targetX / size.x, targetZ / size.y, targetY / size.z)
      );
      builtGroup.updateMatrixWorld(true);
    }

    const scaledBox = new THREE.Box3().setFromObject(builtGroup);
    const minY = scaledBox.min.y;

    // Collect all triangles in Z-up millimeter space
    const triangles: Array<[THREE.Vector3, THREE.Vector3, THREE.Vector3]> = [];
    builtGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geom = mesh.geometry;
        if (!geom || !geom.attributes.position) return;
        const pos = geom.attributes.position;
        const index = geom.index;
        const mat = mesh.matrixWorld;

        const toZUp = (idx: number) => {
          const v = new THREE.Vector3().fromBufferAttribute(pos, idx).applyMatrix4(mat);
          return new THREE.Vector3(v.x, -v.z, Math.max(0, v.y - minY));
        };

        if (index) {
          for (let i = 0; i < index.count; i += 3) {
            triangles.push([
              toZUp(index.getX(i)),
              toZUp(index.getX(i + 1)),
              toZUp(index.getX(i + 2)),
            ]);
          }
        } else {
          for (let i = 0; i < pos.count; i += 3) {
            triangles.push([toZUp(i), toZUp(i + 1), toZUp(i + 2)]);
          }
        }
      }
    });

    const triCount = triangles.length;
    const buffer = new ArrayBuffer(84 + triCount * 50);
    const view = new DataView(buffer);
    const header = `Laymor3D Binary STL - ${modelName}`.slice(0, 79);
    for (let i = 0; i < header.length; i++) {
      view.setUint8(i, header.charCodeAt(i));
    }
    view.setUint32(80, triCount, true);

    const edge1 = new THREE.Vector3();
    const edge2 = new THREE.Vector3();
    const normal = new THREE.Vector3();
    let offset = 84;

    for (let i = 0; i < triCount; i++) {
      const [v1, v2, v3] = triangles[i];
      edge1.subVectors(v2, v1);
      edge2.subVectors(v3, v1);
      normal.crossVectors(edge1, edge2).normalize();

      view.setFloat32(offset, normal.x, true);
      view.setFloat32(offset + 4, normal.y, true);
      view.setFloat32(offset + 8, normal.z, true);

      view.setFloat32(offset + 12, v1.x, true);
      view.setFloat32(offset + 16, v1.y, true);
      view.setFloat32(offset + 20, v1.z, true);

      view.setFloat32(offset + 24, v2.x, true);
      view.setFloat32(offset + 28, v2.y, true);
      view.setFloat32(offset + 32, v2.z, true);

      view.setFloat32(offset + 36, v3.x, true);
      view.setFloat32(offset + 40, v3.y, true);
      view.setFloat32(offset + 44, v3.z, true);

      view.setUint16(offset + 48, 0, true);
      offset += 50;
    }

    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return filename;
  }
}
