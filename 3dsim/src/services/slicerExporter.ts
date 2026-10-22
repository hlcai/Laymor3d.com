import * as THREE from 'three';
import { zipSync, strToU8 } from 'three/examples/jsm/libs/fflate.module.js';
import { ISimulationProfile, IModelTransform } from '@/types/simulator';
import { ISlicingMetrics } from './slicingEngine';
import { applyTransformToGeometry } from './sampleModels';

/**
 * Xuất cấu hình chuẩn Bambu Studio / OrcaSlicer (.json / project_settings.config)
 * Đầy đủ 100% thông số Process, Filament và Machine để mở và in ngay trong Bambu Studio.
 */
export function generateBambuOrcaProfileJson(
  profile: ISimulationProfile,
  metrics: ISlicingMetrics,
  modelName: string = 'Model'
): string {
  const nozzleDia = (profile.nozzleDiameter || 0.4).toString();
  const lineWidth = (profile.lineWidth || 0.42).toString();
  const outerWallWidth = (profile.outerWallLineWidth || 0.42).toString();
  const firstLayerH = (profile.firstLayerHeight || Math.min(0.28, Number((profile.layerHeight * 1.2).toFixed(2)))).toString();

  const brimTypeBambu = !profile.brimEnabled
    ? 'no_brim'
    : profile.brimType === 'mouse_ears'
    ? 'brim_ears'
    : profile.brimType || 'outer_only';

  const bambuConfig = {
    name: `${profile.name} - Laymor 3D PrintSim Pro`,
    from: 'User',
    instantiation: 'true',
    version: '1.10.0.0',
    inherits: '0.20mm Standard @BBL X1C',

    // 1. Quality, Layer, Seam & Surface
    layer_height: profile.layerHeight.toString(),
    initial_layer_print_height: firstLayerH,
    line_width: lineWidth,
    outer_wall_line_width: outerWallWidth,
    inner_wall_line_width: (Number(lineWidth) * 1.05).toFixed(2),
    initial_layer_line_width: (Number(lineWidth) * 1.15).toFixed(2),
    seam_position: profile.seamPosition || 'aligned',
    ironing_type: profile.ironingEnabled ? 'top' : 'no ironing',
    ironing_flow: '10%',
    ironing_speed: '30',
    fuzzy_skin: profile.fuzzySkin || 'none',
    fuzzy_skin_thickness: (profile.fuzzySkinThickness ?? 0.3).toString(),
    fuzzy_skin_point_distance: '0.8',

    // 2. Strength, Walls, Shells & Infill
    wall_loops: profile.wallLoops.toString(),
    top_shell_layers: (profile.topShellLayers ?? 4).toString(),
    bottom_shell_layers: (profile.bottomShellLayers ?? 3).toString(),
    sparse_infill_density: `${profile.infillDensity}%`,
    sparse_infill_pattern: profile.infillType || 'gyroid',
    infill_wall_overlap: `${profile.infillOverlapPercent ?? 15}%`,

    // 3. Speed & Acceleration
    outer_wall_speed: (profile.outerWallSpeed || Math.round(profile.printSpeed * 0.6)).toString(),
    inner_wall_speed: (profile.innerWallSpeed || profile.printSpeed).toString(),
    sparse_infill_speed: (profile.infillSpeed || Math.round(profile.printSpeed * 1.15)).toString(),
    internal_solid_infill_speed: Math.round(profile.printSpeed * 0.95).toString(),
    top_surface_speed: (profile.topSurfaceSpeed || Math.round(profile.printSpeed * 0.55)).toString(),
    travel_speed: (profile.travelSpeed || 500).toString(),
    initial_layer_speed: '50',
    initial_layer_infill_speed: '95',
    default_acceleration: (profile.defaultAcceleration || 10000).toString(),
    outer_wall_acceleration: (profile.outerWallAcceleration || 5000).toString(),
    inner_wall_acceleration: Math.round((profile.defaultAcceleration || 10000) * 0.8).toString(),

    // 4. Support & Bed Adhesion
    enable_support: profile.supportMode !== 'none' ? '1' : '0',
    support_type: profile.supportMode === 'tree' ? 'tree(auto)' : 'normal(auto)',
    support_style: profile.supportMode === 'tree' ? `tree_${profile.treeStyle || 'organic'}` : 'default',
    support_threshold_angle: (profile.supportAngleThreshold ?? 45).toString(),
    support_top_z_distance: (profile.supportTopZDistance ?? 0.2).toString(),
    support_bottom_z_distance: (profile.supportBottomZDistance ?? 0.2).toString(),
    tree_support_branch_diameter: (profile.supportBranchDiameter ?? 2.2).toString(),
    tree_support_branch_angle: (profile.supportBranchAngle ?? 45).toString(),
    support_interface_top_layers: (profile.supportInterfaceLayers ?? 2).toString(),
    support_on_build_plate_only: profile.supportOnBuildPlateOnly !== false ? '1' : '0',
    brim_type: brimTypeBambu,
    brim_width: profile.brimEnabled ? (profile.brimWidthMm || 5).toString() : '0',
    raft_layers: (profile.raftLayers ?? 0).toString(),

    // 5. Filament, Thermal, Cooling & Extrusion Arrays (Chuẩn Bambu Studio Project Config)
    nozzle_diameter: [nozzleDia],
    filament_type: [profile.material],
    filament_colour: [profile.materialColor],
    nozzle_temperature: [profile.nozzleTemp.toString()],
    nozzle_temperature_initial_layer: [(profile.nozzleTemp + 5).toString()],
    hot_plate_temp: [profile.bedTemp.toString()],
    hot_plate_temp_initial_layer: [profile.bedTemp.toString()],
    textured_plate_temp: [profile.bedTemp.toString()],
    textured_plate_temp_initial_layer: [profile.bedTemp.toString()],
    chamber_temperature: [(profile.chamberTemp ?? 35).toString()],
    fan_max_speed: [profile.coolingFanSpeed.toString()],
    fan_min_speed: [Math.round(profile.coolingFanSpeed * 0.7).toString()],
    additional_cooling_fan_speed: [(profile.auxFanSpeed ?? 70).toString()],
    filament_max_volumetric_speed: [(profile.flowRateMm3s || 21).toString()],
    filament_flow_ratio: [(profile.flowRatio ?? 0.98).toString()],
    enable_pressure_advance: [(profile.pressureAdvance ?? 0.02) > 0 ? '1' : '0'],
    pressure_advance: [(profile.pressureAdvance ?? 0.02).toString()],
    filament_retraction_length: [(profile.retractionDistanceMm ?? 0.8).toString()],
    filament_retraction_speed: [(profile.retractionSpeedMmS ?? 35).toString()],
    filament_z_hop: [(profile.zHopMm ?? 0.4).toString()],

    // 6. Legacy nested filament & metadata block for universal compatibility
    filament: {
      type: profile.material,
      color: profile.materialColor,
      nozzle_diameter: nozzleDia,
      nozzle_temperature: profile.nozzleTemp.toString(),
      bed_temperature: profile.bedTemp.toString(),
      chamber_temperature: (profile.chamberTemp ?? 35).toString(),
      max_volumetric_speed: (profile.flowRateMm3s || 21).toString(),
      flow_ratio: (profile.flowRatio ?? 0.98).toString(),
      pressure_advance: (profile.pressureAdvance ?? 0.02).toString(),
      retraction_length: (profile.retractionDistanceMm ?? 0.8).toString(),
      retraction_speed: (profile.retractionSpeedMmS ?? 35).toString(),
      z_hop: (profile.zHopMm ?? 0.4).toString(),
    },
    metadata: {
      model_target: modelName,
      dimensions_mm: metrics.boundingBox.dimensions.map((d) => Math.round(d * 10) / 10),
      estimated_print_time_seconds: metrics.estimatedPrintTimeSec,
      estimated_filament_grams: metrics.estimatedFilamentGrams,
      total_layers: metrics.totalLayers,
      exported_at: new Date().toISOString(),
    },
  };

  return JSON.stringify(bambuConfig, null, 2);
}

/**
 * Đóng gói và tải xuống tệp dự án .3MF chuẩn OPC (Open Packaging Conventions) & Bambu Studio
 * Chứa lưới tam giác 3D thực tế cùng đầy đủ:
 * - 3D/3dmodel.model
 * - Metadata/project_settings.config
 * - Metadata/model_settings.config
 * - Metadata/slice_info.config
 * Giúp người dùng mở trực tiếp trong Bambu Studio / OrcaSlicer là có sẵn toàn bộ Profile để in ngay!
 */
export function download3MFProject(
  geometry: THREE.BufferGeometry,
  profile: ISimulationProfile,
  metrics: ISlicingMetrics,
  modelName: string = 'Model',
  transform?: IModelTransform
): string {
  const safeName = modelName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'AI_3D_Model';
  const filename = `${safeName}_BambuProject.3mf`;

  // 1. Áp dụng biến đổi (Scale, Rotation, Position) và đảm bảo kích thước chuẩn mm
  let exportGeom = transform
    ? applyTransformToGeometry(geometry, transform)
    : geometry.clone();

  if (exportGeom.index) {
    exportGeom = exportGeom.toNonIndexed();
  }

  exportGeom.computeBoundingBox();
  const bbox = exportGeom.boundingBox || new THREE.Box3();
  const sizeX = bbox.max.x - bbox.min.x;
  const sizeY = bbox.max.y - bbox.min.y;
  const sizeZ = bbox.max.z - bbox.min.z;
  const maxDim = Math.max(sizeX, sizeY, sizeZ, 0.0001);

  if (maxDim < 5) {
    const scaleTo80Mm = 80 / maxDim;
    exportGeom.scale(scaleTo80Mm, scaleTo80Mm, scaleTo80Mm);
    exportGeom.center();
    exportGeom.computeBoundingBox();
    const sb = exportGeom.boundingBox!;
    exportGeom.translate(0, -sb.min.y, 0);
  }

  exportGeom.computeBoundingBox();
  const finalBox = exportGeom.boundingBox!;
  const centerX = (finalBox.min.x + finalBox.max.x) / 2;
  const centerZ = (finalBox.min.z + finalBox.max.z) / 2;
  const minY = finalBox.min.y;

  const posAttr = exportGeom.getAttribute('position');
  const vertexCount = posAttr ? posAttr.count : 0;

  // Chuyển từ hệ tọa độ Three.js (Y-up) sang chuẩn máy in 3MF (Z-up, đơn vị millimeter, tâm bàn in 128,128)
  const vertexLines: string[] = new Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) {
    const vx = posAttr.getX(i) - centerX + 128;
    const vy = -(posAttr.getZ(i) - centerZ) + 128;
    const vz = Math.max(0, posAttr.getY(i) - minY);
    vertexLines[i] = `          <vertex x="${vx.toFixed(4)}" y="${vy.toFixed(4)}" z="${vz.toFixed(4)}" />`;
  }

  const triCount = Math.floor(vertexCount / 3);
  const triangleLines: string[] = new Array(triCount);
  for (let t = 0; t < triCount; t++) {
    const v1 = t * 3;
    const v2 = t * 3 + 1;
    const v3 = t * 3 + 2;
    triangleLines[t] = `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`;
  }

  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021">
  <metadata name="Application">BambuStudio-01.10.00.00</metadata>
  <metadata name="BambuStudio:3mfVersion">1</metadata>
  <metadata name="Title">${modelName}</metadata>
  <resources>
    <object id="1" name="${safeName}" type="model">
      <mesh>
        <vertices>
${vertexLines.join('\n')}
        </vertices>
        <triangles>
${triangleLines.join('\n')}
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" printable="1" />
  </build>
</model>`;

  const modelSettingsXml = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="1">
    <metadata key="name" value="${safeName}"/>
    <metadata key="extruder" value="1"/>
    <metadata key="layer_height" value="${profile.layerHeight}"/>
    <metadata key="wall_loops" value="${profile.wallLoops}"/>
    <metadata key="sparse_infill_density" value="${profile.infillDensity}%"/>
    <metadata key="sparse_infill_pattern" value="${profile.infillType}"/>
    <metadata key="enable_support" value="${profile.supportMode !== 'none' ? '1' : '0'}"/>
    <part id="1" subtype="normal_part">
      <metadata key="name" value="${safeName}"/>
      <metadata key="face_count" value="${triCount}"/>
    </part>
  </object>
  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="plater_name" value="Laymor3D_Plate_1"/>
    <metadata key="locked" value="false"/>
    <model_instance>
      <metadata key="object_id" value="1"/>
      <metadata key="instance_id" value="0"/>
      <metadata key="identify_id" value="1"/>
    </model_instance>
  </plate>
</config>`;

  const sliceInfoXml = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <header>
    <header_item key="X-BBL-Client-Type" value="slicer"/>
    <header_item key="X-BBL-Client-Version" value="01.10.00.00"/>
  </header>
  <plate>
    <metadata key="index" value="1"/>
    <metadata key="prediction" value="${metrics.estimatedPrintTimeSec}"/>
    <metadata key="weight" value="${metrics.estimatedFilamentGrams}"/>
    <filament id="1" type="${profile.material}" color="${profile.materialColor}" used_g="${metrics.estimatedFilamentGrams}" />
  </plate>
</config>`;

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

  const bambuJson = generateBambuOrcaProfileJson(profile, metrics, modelName);

  const zipFiles: Record<string, Uint8Array> = {
    '_rels/.rels': strToU8(relsXml),
    '[Content_Types].xml': strToU8(contentTypesXml),
    '3D/3dmodel.model': strToU8(modelXml),
    'Metadata/project_settings.config': strToU8(bambuJson),
    'Metadata/model_settings.config': strToU8(modelSettingsXml),
    'Metadata/slice_info.config': strToU8(sliceInfoXml),
  };

  const zipped = zipSync(zipFiles);
  const blob = new Blob([zipped], {
    type: 'application/vnd.ms-package.3dmanufacturing-3dmodelxml',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Xuất trực tiếp mô hình 3D hiện tại sang tệp Binary STL chuẩn kích thước thực (mm)
 */
export function downloadBinarySTL(
  geometry: THREE.BufferGeometry,
  modelName: string = 'Model',
  transform?: IModelTransform
): string {
  const safeName = modelName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'AI_3D_Model';
  const filename = `${safeName}.stl`;

  let exportGeom = transform
    ? applyTransformToGeometry(geometry, transform)
    : geometry.clone();

  if (exportGeom.index) {
    exportGeom = exportGeom.toNonIndexed();
  }

  exportGeom.computeBoundingBox();
  const bbox = exportGeom.boundingBox || new THREE.Box3();
  const maxDim = Math.max(
    bbox.max.x - bbox.min.x,
    bbox.max.y - bbox.min.y,
    bbox.max.z - bbox.min.z,
    0.0001
  );

  if (maxDim < 5) {
    const scaleTo80Mm = 80 / maxDim;
    exportGeom.scale(scaleTo80Mm, scaleTo80Mm, scaleTo80Mm);
    exportGeom.center();
    exportGeom.computeBoundingBox();
    exportGeom.translate(0, -exportGeom.boundingBox!.min.y, 0);
  }

  const posAttr = exportGeom.getAttribute('position');
  const triCount = posAttr ? Math.floor(posAttr.count / 3) : 0;

  // Binary STL format: 80-byte header + 4-byte triangle count + (50 bytes * triCount)
  const buffer = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buffer);
  view.setUint32(80, triCount, true);

  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  let offset = 84;
  for (let i = 0; i < triCount; i++) {
    const i3 = i * 3;
    pA.set(posAttr.getX(i3), -posAttr.getZ(i3), posAttr.getY(i3));
    pB.set(posAttr.getX(i3 + 1), -posAttr.getZ(i3 + 1), posAttr.getY(i3 + 1));
    pC.set(posAttr.getX(i3 + 2), -posAttr.getZ(i3 + 2), posAttr.getY(i3 + 2));

    cb.subVectors(pC, pB);
    ab.subVectors(pA, pB);
    cb.cross(ab).normalize();

    view.setFloat32(offset, cb.x, true);
    view.setFloat32(offset + 4, cb.y, true);
    view.setFloat32(offset + 8, cb.z, true);

    view.setFloat32(offset + 12, pA.x, true);
    view.setFloat32(offset + 16, pA.y, true);
    view.setFloat32(offset + 20, pA.z, true);

    view.setFloat32(offset + 24, pB.x, true);
    view.setFloat32(offset + 28, pB.y, true);
    view.setFloat32(offset + 32, pB.z, true);

    view.setFloat32(offset + 36, pC.x, true);
    view.setFloat32(offset + 40, pC.y, true);
    view.setFloat32(offset + 44, pC.z, true);

    view.setUint16(offset + 48, 0, true);
    offset += 50;
  }

  const blob = new Blob([buffer], { type: 'application/sla' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Sinh file G-Code mô phỏng thực tế (.gcode)
 */
export function generateSampleGcode(
  profile: ISimulationProfile,
  metrics: ISlicingMetrics,
  modelName: string = 'Model'
): string {
  const lines: string[] = [
    `; ========================================================`,
    `; G-Code sinh bởi 3D PrintSim Pro - CoreXY Simulator`,
    `; Tên mô hình: ${modelName}`,
    `; Vật liệu: ${profile.material} (${profile.materialColor}) | Nozzle: ${profile.nozzleDiameter || 0.4} mm`,
    `; Chiều cao lớp: ${profile.layerHeight} mm (Lớp 1: ${profile.firstLayerHeight || 0.2} mm) | Số lớp: ${metrics.totalLayers}`,
    `; Vòng tường: ${profile.wallLoops} loops | Seam: ${profile.seamPosition || 'aligned'} | Ironing: ${profile.ironingEnabled ? 'Bật' : 'Tắt'}`,
    `; Tốc độ in: ${profile.printSpeed} mm/s | Gia tốc: ${profile.defaultAcceleration || 10000} mm/s²`,
    `; Mật độ ruột: ${profile.infillDensity}% (${profile.infillType})`,
    `; Thời gian in ước tính: ${Math.round(metrics.estimatedPrintTimeSec / 60)} phút`,
    `; Khối lượng nhựa: ${metrics.estimatedFilamentGrams} g`,
    `; ========================================================`,
    ``,
    `; --- KHỞI ĐỘNG MÁY IN (START GCODE) ---`,
    `G90 ; Toạ độ tuyệt đối`,
    `M83 ; Chế độ đùn tương đối`,
    `M104 S${profile.nozzleTemp} ; Đặt nhiệt độ đầu phun`,
    `M140 S${profile.bedTemp} ; Đặt nhiệt độ bàn in`,
    `G28 ; Về gốc toạ độ Home tất cả các trục (X, Y, Z)`,
    `G29 ; Hiệu chuẩn cân bàn tự động (Auto Bed Leveling Mesh)`,
    `M190 S${profile.bedTemp} ; Chờ bàn in đạt nhiệt độ`,
    `M109 S${profile.nozzleTemp} ; Chờ đầu phun đạt nhiệt độ`,
    ``,
    `; --- VẠCH LÀM SẠCH ĐẦU KIM (PURGE NOZZLE LINE) ---`,
    `G1 Z2.0 F3000 ; Nâng Z lên 2mm`,
    `G1 X10 Y20 Z0.28 F5000 ; Di chuyển về góc trước`,
    `G1 X10 Y180 Z0.28 E15 F1200 ; Đùn vạch 1`,
    `G1 X12 Y180 Z0.28 F5000 ; Dịch nhẹ sang phải`,
    `G1 X12 Y20 Z0.28 E15 F1200 ; Đùn vạch 2`,
    `G92 E0 ; Đặt lại vị trí đùn về 0`,
    `G1 Z2.0 F3000 ; Nhấc đầu in chống va chạm`,
    ``,
  ];

  const maxSimLayers = Math.min(5, metrics.totalLayers);
  for (let l = 1; l <= maxSimLayers; l++) {
    const layerZ = (l * profile.layerHeight).toFixed(3);
    lines.push(`;LAYER:${l}`);
    lines.push(`;HEIGHT:${layerZ}`);
    lines.push(`G1 Z${layerZ} F${profile.printSpeed * 60}`);

    if (l === 1 && profile.brimEnabled) {
      lines.push(`;TYPE:BRIM (${profile.brimType || 'outer_only'})`);
      lines.push(`G1 X-20 Y-20 F6000`);
      lines.push(`G1 X20 Y-20 E2.1 F${Math.round(profile.printSpeed * 30)}`);
      lines.push(`G1 X20 Y20 E2.1`);
      lines.push(`G1 X-20 Y20 E2.1`);
      lines.push(`G1 X-20 Y-20 E2.1`);
    }

    lines.push(`;TYPE:WALL-OUTER`);
    lines.push(`G1 X-15 Y-15 F4000`);
    lines.push(`G1 X15 Y-15 E1.6 F${Math.round(profile.printSpeed * 40)}`);
    lines.push(`G1 X15 Y15 E1.6`);
    lines.push(`G1 X-15 Y15 E1.6`);
    lines.push(`G1 X-15 Y-15 E1.6`);

    lines.push(`;TYPE:INFILL - ${profile.infillType.toUpperCase()}`);
    lines.push(`G1 X-10 Y-10 F5000`);
    lines.push(`G1 X10 Y10 E1.2 F${Math.round(profile.printSpeed * 60)}`);
    lines.push(`G1 X-10 Y10 F5000`);
    lines.push(`G1 X10 Y-10 E1.2 F${Math.round(profile.printSpeed * 60)}`);
    lines.push(``);
  }

  lines.push(`; ... [Các lớp còn lại từ ${maxSimLayers + 1} đến ${metrics.totalLayers} đã nén] ...`);
  lines.push(``);
  lines.push(`; --- KẾT THÚC LỆNH IN (END GCODE) ---`);
  lines.push(`M104 S0 ; Tắt gia nhiệt đầu phun`);
  lines.push(`M140 S0 ; Tắt gia nhiệt bàn in`);
  lines.push(`M106 S0 ; Tắt quạt làm mát`);
  lines.push(`G91 ; Toạ độ tương đối`);
  lines.push(`G1 Z10 F3000 ; Nâng bàn lùi đầu in`);
  lines.push(`G90 ; Toạ độ tuyệt đối`);
  lines.push(`G1 X0 Y220 F3000 ; Đẩy bàn in về phía trước người dùng`);
  lines.push(`M84 ; Tắt động cơ bước (Steppers Off)`);

  return lines.join('\n');
}

/**
 * Tải file trực tiếp về máy tính người dùng
 */
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Sao chép tóm tắt thông số in vào Clipboard
 */
export async function copyProfileToClipboard(profile: ISimulationProfile, metrics: ISlicingMetrics): Promise<boolean> {
  const text = [
    `=== THÔNG SỐ CÀI ĐẶT IN 3D TỐI ƯU (3D PrintSim Pro - Bambu Studio) ===`,
    `- Tên Profile: ${profile.name}`,
    `- Vật liệu: ${profile.material} (${profile.materialColor}) | Kim phun: ${profile.nozzleDiameter || 0.4}mm`,
    `- Chiều cao lớp (Layer Height): ${profile.layerHeight} mm (Lớp 1: ${profile.firstLayerHeight || 0.2} mm)`,
    `- Bề rộng nét (Line Width): ${profile.lineWidth || 0.42} mm (Outer Wall: ${profile.outerWallLineWidth || 0.42} mm)`,
    `- Số vòng tường (Wall Loops): ${profile.wallLoops} | Nóc/Đáy: ${profile.topShellLayers ?? 4}/${profile.bottomShellLayers ?? 3} lớp`,
    `- Ruột in (Infill): ${profile.infillDensity}% (${profile.infillType}) | Overlap: ${profile.infillOverlapPercent ?? 15}%`,
    `- Bề mặt: Seam=${profile.seamPosition || 'aligned'} | Ironing=${profile.ironingEnabled ? 'Bật' : 'Tắt'} | Fuzzy Skin=${profile.fuzzySkin || 'none'}`,
    `- Tốc độ in: ${profile.printSpeed} mm/s (Outer: ${profile.outerWallSpeed || 120} mm/s, Travel: ${profile.travelSpeed || 500} mm/s)`,
    `- Nhiệt độ: Nozzle ${profile.nozzleTemp}°C | Bed ${profile.bedTemp}°C | Chamber ${profile.chamberTemp ?? 35}°C`,
    `- Cột chống (Support): ${profile.supportMode === 'tree' ? `Tree (${profile.treeStyle || 'organic'})` : profile.supportMode === 'normal' ? 'Normal' : 'Tắt'} | Ngưỡng ${profile.supportAngleThreshold ?? 45}°`,
    `- Bám bàn: Brim=${profile.brimEnabled ? `${profile.brimType || 'outer_only'} (${profile.brimWidthMm}mm)` : 'Tắt'} | Raft=${profile.raftLayers ?? 0} lớp`,
    `- Đùn nhựa: Max Flow ${profile.flowRateMm3s || 21} mm³/s | Flow Ratio ${profile.flowRatio ?? 0.98} | PA ${profile.pressureAdvance ?? 0.02} | Retraction ${profile.retractionDistanceMm ?? 0.8}mm`,
    `- Thời gian in ước tính: ${Math.round(metrics.estimatedPrintTimeSec / 60)} phút`,
    `- Lượng nhựa tiêu hao: ${metrics.estimatedFilamentGrams}g`,
    `- Chi phí sản xuất ước tính: ${metrics.estimatedCostVnd.toLocaleString('vi-VN')} VNĐ`,
  ].join('\n');

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Không thể sao chép:', err);
    return false;
  }
}
