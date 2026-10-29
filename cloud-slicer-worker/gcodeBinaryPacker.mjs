import zlib from 'node:zlib';

/**
 * Bộ bóc tách & đóng gói nhị phân G-Code gốc từ OrcaSlicer / Bambu Studio CLI
 * Tương thích 1:1 với IFullToolpathData, INativeSupportData và GPU VolumetricFilamentRenderer của Laymor3D.
 */
export function parseNativeSlicerGcode(gcodeText, modelName = 'cloud_sliced_model') {
  const lines = gcodeText.split(/\r?\n/);

  let minModelX = Infinity,
    maxModelX = -Infinity;
  let minModelY = Infinity,
    maxModelY = -Infinity;
  let minAllX = Infinity,
    maxAllX = -Infinity;
  let minAllY = Infinity,
    maxAllY = -Infinity;

  let headerTotalLayers = 0;
  let estimatedTimeSec = 0;
  let totalWeightGrams = 0;
  let modelWeightGrams = 0;
  let supportWeightGrams = 0;
  let layerHeightMm = 0.2;

  // Pass 1: Đọc metadata chính xác từ Header/Footer Bambu & OrcaSlicer + Tính tâm Bounding Box trên bàn in
  let pX = 128,
    pY = 128,
    pZ = 0.2;
  let pFeat = '';
  let pWipe = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith(';')) {
      if (line.startsWith('; WIPE_START')) {
        pWipe = true;
        continue;
      }
      if (line.startsWith('; WIPE_END')) {
        pWipe = false;
        continue;
      }
      if (line.startsWith('; Z_HEIGHT:') || line.startsWith(';Z:')) {
        const zv = parseFloat(line.slice(line.indexOf(':') + 1));
        if (!Number.isNaN(zv) && zv > 0) pZ = zv;
        continue;
      }
      if (line.startsWith('; FEATURE:') || line.startsWith(';TYPE:')) {
        pFeat = line.slice(line.indexOf(':') + 1).trim();
        continue;
      }
      if (line.includes('layer_height') && line.includes('=')) {
        const m = /layer_height\s*=\s*([\d.]+)/i.exec(line);
        if (m) layerHeightMm = parseFloat(m[1]) || 0.2;
      } else if (line.includes('total layer number:')) {
        const m = /total layer number:\s*(\d+)/i.exec(line);
        if (m) headerTotalLayers = parseInt(m[1], 10);
      } else if (line.includes('estimated printing time') || line.includes('model printing time:')) {
        const hM = /(\d+)\s*h/i.exec(line);
        const mM = /(\d+)\s*m/i.exec(line);
        const sM = /(\d+)\s*s/i.exec(line);
        const sec =
          (hM ? parseInt(hM[1], 10) * 3600 : 0) +
          (mM ? parseInt(mM[1], 10) * 60 : 0) +
          (sM ? parseInt(sM[1], 10) : 0);
        if (sec > 0) estimatedTimeSec = sec;
      } else if (line.includes('total filament used [g]') || line.includes('total filament weight [g]') || line.includes('filament used [g]')) {
        const wM = /[=:]\s*([\d.]+)/.exec(line);
        if (wM) {
          const val = parseFloat(wM[1]);
          if (!Number.isNaN(val) && val > 0) totalWeightGrams = Number(val.toFixed(2));
        }
      }
      continue;
    }

    if (line.startsWith('G0 ') || line.startsWith('G1 ')) {
      const mX = /X([-\d.]+)/.exec(line);
      const mY = /Y([-\d.]+)/.exec(line);
      const mE = /E([-\d.]+)/.exec(line);
      const nx = mX ? parseFloat(mX[1]) : pX;
      const ny = mY ? parseFloat(mY[1]) : pY;
      const ev = mE ? parseFloat(mE[1]) : 0;

      if (!pWipe && ev > 0 && pZ > 0.25 && nx > 6 && nx < 250 && ny > 6 && ny < 250) {
        if (nx < minAllX) minAllX = nx;
        if (nx > maxAllX) maxAllX = nx;
        if (ny < minAllY) minAllY = ny;
        if (ny > maxAllY) maxAllY = ny;

        const fl = pFeat.toLowerCase();
        if (fl.includes('wall') || fl.includes('surface') || fl.includes('infill') || fl.includes('bridge') || fl.includes('perimeter')) {
          if (nx < minModelX) minModelX = nx;
          if (nx > maxModelX) maxModelX = nx;
          if (ny < minModelY) minModelY = ny;
          if (ny > maxModelY) maxModelY = ny;
        }
      }
      pX = nx;
      pY = ny;
    }
  }

  const centerX =
    minModelX < maxModelX ? (minModelX + maxModelX) * 0.5 : minAllX < maxAllX ? (minAllX + maxAllX) * 0.5 : 128;
  const centerY =
    minModelY < maxModelY ? (minModelY + maxModelY) * 0.5 : minAllY < maxAllY ? (minAllY + maxAllY) * 0.5 : 128;

  // Pass 2: Bóc tách đủ 8 phân lớp đường chạy dao chuẩn Bambu Studio + Support Segments
  const outerWalls = [];
  const innerWalls = [];
  const topBottomShells = [];
  const bridges = [];
  const infills = [];
  const supports = [];
  const interfaces = [];
  const brims = [];
  const seams = [];
  const layerTimesSec = [];
  const supportSegments = [];
  const layerIndexTable = [[0, 0, 0, 0, 0, 0, 0, 0]];

  let curX = centerX,
    curY = centerY,
    curZ = 0.2,
    feedMmPerSec = 120;
  let curFeat = 'none';
  let curLayer = 0;
  let inWipe = false;
  let isNewOuter = true;
  let layerTimeAccum = 0.25;
  let modelExtrudedE = 0;
  let supportExtrudedE = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('; WIPE_START')) {
      inWipe = true;
      continue;
    }
    if (line.startsWith('; WIPE_END')) {
      inWipe = false;
      continue;
    }

    if (line.startsWith('; CHANGE_LAYER') || line.startsWith(';LAYER_CHANGE')) {
      layerTimesSec[curLayer] = Number(Math.max(0.5, layerTimeAccum).toFixed(2));
      layerTimeAccum = 0.25;
      curLayer++;
      layerIndexTable[curLayer] = [
        outerWalls.length / 3,
        innerWalls.length / 3,
        infills.length / 3,
        supports.length / 3,
        interfaces.length / 3,
        seams.length / 3,
        topBottomShells.length / 3,
        bridges.length / 3,
      ];
      isNewOuter = true;
      continue;
    }

    if (line.startsWith('; Z_HEIGHT:') || line.startsWith(';Z:')) {
      const zv = parseFloat(line.slice(line.indexOf(':') + 1));
      if (!Number.isNaN(zv) && zv > 0) curZ = zv;
      continue;
    }

    if (line.startsWith('; FEATURE:') || line.startsWith(';TYPE:')) {
      curFeat = line.slice(line.indexOf(':') + 1).trim();
      if (curFeat.toLowerCase().includes('outer wall')) isNewOuter = true;
      continue;
    }

    if (line.startsWith('G0 ') || line.startsWith('G1 ')) {
      const mX = /X([-\d.]+)/.exec(line);
      const mY = /Y([-\d.]+)/.exec(line);
      const mZ = /Z([-\d.]+)/.exec(line);
      const mE = /E([-\d.]+)/.exec(line);
      const mF = /F([\d.]+)/.exec(line);

      if (mF) {
        const fVal = parseFloat(mF[1]);
        if (!Number.isNaN(fVal) && fVal > 0) feedMmPerSec = Math.max(5, fVal / 60);
      }

      const nx = mX ? parseFloat(mX[1]) : curX;
      const ny = mY ? parseFloat(mY[1]) : curY;
      const nz = mZ ? parseFloat(mZ[1]) : curZ;
      const ev = mE ? parseFloat(mE[1]) : 0;

      const dist = Math.hypot(nx - curX, ny - curY);
      layerTimeAccum += dist / Math.max(10, feedMmPerSec);

      if (!inWipe && line.startsWith('G1 ') && ev > 0.0002 && dist >= 0.03 && dist <= 180) {
        // Loại bỏ đường purge line ở mép trước bàn in
        const isPurge = nz <= 0.35 && (ny < 10 || nx < 6);
        if (!isPurge) {
          const x1 = Number((curX - centerX).toFixed(2));
          const y1 = Number(nz.toFixed(2));
          const z1 = Number((curY - centerY).toFixed(2));
          const x2 = Number((nx - centerX).toFixed(2));
          const y2 = Number(nz.toFixed(2));
          const z2 = Number((ny - centerY).toFixed(2));

          const fl = curFeat.toLowerCase();
          if (fl.includes('outer wall') || fl.includes('external perimeter')) {
            outerWalls.push(x1, y1, z1, x2, y2, z2);
            modelExtrudedE += ev;
            if (isNewOuter) {
              seams.push(x1, y1, z1);
              isNewOuter = false;
            }
          } else if (fl.includes('bridge') || fl.includes('overhang wall')) {
            bridges.push(x1, y1, z1, x2, y2, z2);
            modelExtrudedE += ev;
          } else if (fl.includes('top surface') || fl.includes('bottom surface') || fl.includes('solid infill')) {
            topBottomShells.push(x1, y1, z1, x2, y2, z2);
            modelExtrudedE += ev;
          } else if (fl.includes('inner wall') || fl.includes('perimeter') || fl.includes('gap')) {
            innerWalls.push(x1, y1, z1, x2, y2, z2);
            modelExtrudedE += ev;
          } else if (fl.includes('infill')) {
            infills.push(x1, y1, z1, x2, y2, z2);
            modelExtrudedE += ev;
          } else if (fl.includes('support interface') || fl.includes('support_interface') || fl.includes('support transition')) {
            interfaces.push(x1, y1, z1, x2, y2, z2);
            supportSegments.push({ isInterface: true, points: [x1, y1, z1, x2, y2, z2] });
            supportExtrudedE += ev;
          } else if (fl.includes('support') || fl.includes('tree')) {
            if (nz <= 0.32) {
              brims.push(x1, y1, z1, x2, y2, z2);
            } else {
              supports.push(x1, y1, z1, x2, y2, z2);
              supportSegments.push({ isInterface: false, points: [x1, y1, z1, x2, y2, z2] });
            }
            supportExtrudedE += ev;
          } else if (fl.includes('skirt') || fl.includes('brim')) {
            brims.push(x1, y1, z1, x2, y2, z2);
            supportExtrudedE += ev;
          }
        }
      } else if (ev <= 0 && dist > 0.08 && curFeat.toLowerCase().includes('outer wall')) {
        isNewOuter = true;
      }

      curX = nx;
      curY = ny;
      curZ = nz;
    }
  }

  const finalLayers = Math.max(curLayer, headerTotalLayers, 1);
  layerTimesSec[finalLayers] = Number(Math.max(0.5, layerTimeAccum).toFixed(2));
  layerIndexTable[finalLayers] = [
    outerWalls.length / 3,
    innerWalls.length / 3,
    infills.length / 3,
    supports.length / 3,
    interfaces.length / 3,
    seams.length / 3,
    topBottomShells.length / 3,
    bridges.length / 3,
  ];

  // Quy đổi chính xác tỷ lệ khối lượng Model vs Support từ lượng đùn E (1.75mm filament = 2.405 mm2 * 1.24 g/cm3)
  const totalE = Math.max(0.01, modelExtrudedE + supportExtrudedE);
  if (totalWeightGrams <= 0) {
    totalWeightGrams = Number(((totalE * 2.40528 * 1.24) / 1000).toFixed(2));
  }
  modelWeightGrams = Number((totalWeightGrams * (modelExtrudedE / totalE)).toFixed(2));
  supportWeightGrams = Number(Math.max(0, totalWeightGrams - modelWeightGrams).toFixed(2));

  if (estimatedTimeSec <= 0) {
    estimatedTimeSec = Math.round(layerTimesSec.reduce((a, b) => a + (b || 0), 0));
  }

  const totalMoves = Math.round(
    (outerWalls.length +
      innerWalls.length +
      topBottomShells.length +
      bridges.length +
      infills.length +
      supports.length +
      interfaces.length +
      brims.length) /
      6
  );

  const toolpathData = {
    model: modelName,
    engine: 'orca_bambu_headless_cli',
    totalLayers: finalLayers,
    layerHeightMm,
    totalMoves,
    layerTimesSec,
    layerIndexTable,
    outerWalls,
    innerWalls,
    topBottomShells,
    bridges,
    infills,
    supports,
    interfaces,
    brims,
    seams,
  };

  const supportData = {
    model: modelName,
    engine: 'orca_bambu_headless_cli',
    totalMoves: Math.round((supports.length + interfaces.length) / 6),
    totalSegments: supportSegments.length,
    segments: supportSegments,
  };

  return {
    totalLayers: finalLayers,
    layerHeightMm,
    estimatedTimeSec,
    filamentWeightGrams: totalWeightGrams,
    modelWeightGrams,
    supportWeightGrams,
    filamentMeters: Number((totalWeightGrams / 2.98).toFixed(2)),
    supportLinesCount: supportData.totalMoves,
    toolpathData,
    supportData,
  };
}

/**
 * Đóng gói dữ liệu cắt lớp sang luồng nhị phân nén Gzip (.bin.gz) giảm ~85% băng thông mạng
 * Cấu trúc gói: [4B Magic "LAYM"][4B HeaderJSONByteLen][HeaderJSON UTF-8][Float32Arrays liên tiếp]
 */
export function packSlicedBundleToBinaryGzip(parsedBundle) {
  const tp = parsedBundle.toolpathData;
  const f32Blocks = [
    new Float32Array(tp.outerWalls),
    new Float32Array(tp.innerWalls),
    new Float32Array(tp.topBottomShells || []),
    new Float32Array(tp.bridges || []),
    new Float32Array(tp.infills || []),
    new Float32Array(tp.supports),
    new Float32Array(tp.interfaces),
    new Float32Array(tp.brims),
    new Float32Array(tp.seams),
  ];

  const headerObj = {
    version: 2,
    model: tp.model,
    engine: tp.engine,
    totalLayers: parsedBundle.totalLayers,
    layerHeightMm: parsedBundle.layerHeightMm,
    estimatedTimeSec: parsedBundle.estimatedTimeSec,
    filamentWeightGrams: parsedBundle.filamentWeightGrams,
    modelWeightGrams: parsedBundle.modelWeightGrams,
    supportWeightGrams: parsedBundle.supportWeightGrams,
    filamentMeters: parsedBundle.filamentMeters,
    floatLengths: f32Blocks.map((b) => b.length),
    layerTimesSec: tp.layerTimesSec,
    layerIndexTable: tp.layerIndexTable,
  };

  const headerBuf = Buffer.from(JSON.stringify(headerObj), 'utf8');
  const padBytes = (4 - (headerBuf.length % 4)) % 4;
  const payloadByteLen = f32Blocks.reduce((sum, b) => sum + b.byteLength, 0);

  const outBuf = Buffer.allocUnsafe(8 + headerBuf.length + padBytes + payloadByteLen);
  outBuf.write('LAYM', 0, 4, 'ascii');
  outBuf.writeUInt32LE(headerBuf.length, 4);
  headerBuf.copy(outBuf, 8);
  outBuf.fill(0, 8 + headerBuf.length, 8 + headerBuf.length + padBytes);

  let offset = 8 + headerBuf.length + padBytes;
  for (const block of f32Blocks) {
    Buffer.from(block.buffer, block.byteOffset, block.byteLength).copy(outBuf, offset);
    offset += block.byteLength;
  }

  return zlib.gzipSync(outBuf, { level: 6 });
}
