import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  parseNativeSlicerGcode,
  packSlicedBundleToBinaryGzip,
} from './gcodeBinaryPacker.mjs';

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT || 8090);
const SLICER_BIN = process.env.SLICER_BIN || '/opt/orcaslicer/AppRun';
const PRUSA_BIN = process.env.PRUSA_BIN || '/usr/bin/prusa-slicer';
const API_KEY = process.env.CLOUD_SLICER_API_KEY || '';
const WORK_ROOT = process.env.SLICE_WORK_DIR || '/tmp/laymor_slices';
const MAX_CONCURRENT_JOBS = Number(process.env.MAX_CONCURRENT_SLICES || 2);

let activeJobs = 0;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Slicer-Key, X-Api-Key'
  );
}

function readRequestBody(req, maxBytes = 160 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('File vượt quá giới hạn 160MB của Cloud Worker'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function extractGcodeFromOutDir(outDir) {
  const outFiles = await fs.readdir(outDir);
  const gcodeFile = outFiles.find((f) => f.toLowerCase().endsWith('.gcode'));
  if (gcodeFile) {
    return await fs.readFile(path.join(outDir, gcodeFile), 'utf8');
  }

  // Nếu OrcaSlicer xuất ra file .gcode.3mf hoặc .3mf chứa Metadata/plate_1.gcode
  const threemfFile = outFiles.find((f) => f.toLowerCase().endsWith('.3mf'));
  if (threemfFile) {
    const archivePath = path.join(outDir, threemfFile);
    try {
      const { stdout } = await execFileAsync('unzip', ['-p', archivePath, '*.gcode'], {
        maxBuffer: 64 * 1024 * 1024,
      });
      if (stdout && stdout.length > 128) {
        return stdout;
      }
    } catch {
      // ignore unzip error
    }
  }
  return null;
}

async function runHeadlessOrcaBambuSlice(inputFilePath, jobDir, settings) {
  const outDir = path.join(jobDir, 'out');
  await fs.mkdir(outDir, { recursive: true });

  const layerHeight = Number(settings.layerHeight || 0.2);
  const supportEnabled = settings.supportMode !== 'none' && settings.supportEnabled !== false;
  const angleThreshold = Number(settings.supportAngleThreshold || settings.angleThreshold || 45);
  const topZDistance = Number(settings.supportTopZDistance ?? settings.topZDistance ?? 0.2);
  const branchDiameter = Number(settings.supportBranchDiameter || settings.branchDiameter || 2.0);
  const treeStyle = String(settings.treeStyle || 'organic');

  // 1. Thử chạy OrcaSlicer v2.2.0 Headless CLI trước
  const processOverride = {
    type: 'process',
    name: 'Laymor3D Cloud Dynamic Process',
    from: 'system',
    instantiation: 'true',
    layer_height: String(layerHeight),
    initial_layer_print_height: String(settings.firstLayerHeight || 0.2),
    wall_loops: String(settings.wallLoops || 2),
    sparse_infill_density: `${settings.infillDensity ?? 15}%`,
    sparse_infill_pattern: settings.infillType || 'gyroid',
    enable_support: supportEnabled ? '1' : '0',
    support_type:
      settings.supportMode === 'normal'
        ? 'normal(auto)'
        : `tree(${treeStyle === 'organic' ? 'organic' : 'auto'})`,
    support_threshold_angle: String(angleThreshold),
    support_on_build_plate_only: settings.supportOnBuildPlateOnly !== false ? '1' : '0',
    support_top_z_distance: String(topZDistance),
    tree_support_branch_diameter: String(branchDiameter),
    tree_support_branch_angle: String(settings.supportBranchAngle || 42),
    brim_type: settings.brimEnabled !== false ? 'auto_brim' : 'no_brim',
    brim_width: String(settings.brimWidthMm || 5),
    seam_position: settings.seamPosition || 'aligned',
  };

  const settingsJsonPath = path.join(jobDir, 'process_override.json');
  await fs.writeFile(settingsJsonPath, JSON.stringify(processOverride, null, 2), 'utf8');

  const isLinuxHeadless = process.platform === 'linux' && !process.env.DISPLAY;
  const cmd = isLinuxHeadless ? 'xvfb-run' : SLICER_BIN;
  const orcaArgs = isLinuxHeadless
    ? [
        '-a',
        '-s',
        '-screen 0 1280x800x24',
        SLICER_BIN,
        '--load-settings',
        settingsJsonPath,
        '--export-3mf',
        path.join(outDir, 'sliced_plate.gcode.3mf'),
        '--slice',
        '0',
        '--outputdir',
        outDir,
        inputFilePath,
      ]
    : [
        '--load-settings',
        settingsJsonPath,
        '--slice',
        '0',
        '--outputdir',
        outDir,
        inputFilePath,
      ];

  let combinedLogs = '';
  try {
    const { stdout, stderr } = await execFileAsync(cmd, orcaArgs, {
      timeout: 65000,
      maxBuffer: 32 * 1024 * 1024,
    });
    combinedLogs = `${stdout}\n${stderr}`.trim();
    const gcodeText = await extractGcodeFromOutDir(outDir);
    if (gcodeText && gcodeText.length > 200) {
      return { gcodeText, logs: combinedLogs, engineUsed: 'orca_slicer_headless_cli' };
    }
  } catch (orcaErr) {
    combinedLogs = `OrcaSlicer fallback notice: ${orcaErr?.message || ''}`;
  }

  // 2. Fallback C++ Native CLI (PrusaSlicer Organic Tree Engine) cho các file .STL / .3MF thô chưa nhúng Machine Profile của Bambu
  const prusaOutGcode = path.join(outDir, 'prusa_organic.gcode');
  const prusaArgs = [
    '--export-gcode',
    '--center',
    '128,128',
    '--layer-height',
    String(layerHeight),
    '--perimeters',
    String(settings.wallLoops || 2),
    '--fill-density',
    `${settings.infillDensity ?? 15}%`,
    ...(supportEnabled
      ? [
          '--support-material',
          '--support-material-auto',
          '--support-material-style',
          settings.supportMode === 'normal' ? 'grid' : 'organic',
          '--support-material-threshold',
          String(angleThreshold),
          '--support-material-contact-distance',
          String(topZDistance),
          ...(settings.supportOnBuildPlateOnly !== false
            ? ['--support-material-buildplate-only']
            : []),
        ]
      : []),
    '--output',
    prusaOutGcode,
    inputFilePath,
  ];

  const { stdout: pOut, stderr: pErr } = await execFileAsync(PRUSA_BIN, prusaArgs, {
    timeout: 65000,
    maxBuffer: 32 * 1024 * 1024,
  });
  const gcodeText = await extractGcodeFromOutDir(outDir);
  if (gcodeText && gcodeText.length > 200) {
    return {
      gcodeText,
      logs: `${combinedLogs}\n${pOut}\n${pErr}`.trim(),
      engineUsed: 'prusa_organic_native_cli',
    };
  }

  throw new Error(`Không tìm thấy file .gcode đầu ra từ Slicer CLI. Logs: ${combinedLogs}`);
}

/**
 * Báo giá xưởng in 3D thương mại Laymor3D dựa trên số liệu G-Code thực tế của Bambu/Orca Engine
 */
function calculateFactoryQuoteVnd(parsed, material = 'PLA') {
  const pricePerGramVnd =
    material === 'PA-CF' || material === 'PLA-CF'
      ? 1450
      : material === 'TPU'
      ? 950
      : material === 'ABS' || material === 'ASA'
      ? 780
      : material === 'PETG'
      ? 680
      : 620;
  const machineHourRateVnd = 22000;
  const setupFeeVnd = 15000;

  const materialCostVnd = Math.round(parsed.filamentWeightGrams * pricePerGramVnd);
  const machineCostVnd = Math.round((parsed.estimatedTimeSec / 3600) * machineHourRateVnd);
  const totalVnd = Math.ceil((setupFeeVnd + materialCostVnd + machineCostVnd) / 1000) * 1000;

  return {
    currency: 'VND',
    material,
    setupFeeVnd,
    materialCostVnd,
    machineCostVnd,
    totalQuoteVnd: totalVnd,
  };
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);

  if (req.method === 'GET' && reqUrl.pathname === '/health') {
    let binExists = false;
    let prusaExists = false;
    try {
      await fs.access(SLICER_BIN);
      binExists = true;
    } catch {}
    try {
      await fs.access(PRUSA_BIN);
      prusaExists = true;
    } catch {}
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'laymor3d-headless-orca-bambu-worker',
        slicerBinary: SLICER_BIN,
        binaryReady: binExists || prusaExists,
        orcaReady: binExists,
        prusaReady: prusaExists,
        activeJobs,
        maxConcurrentJobs: MAX_CONCURRENT_JOBS,
      })
    );
    return;
  }

  if (API_KEY) {
    const token =
      req.headers['x-api-key'] ||
      req.headers['x-slicer-key'] ||
      (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (token !== API_KEY) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized Cloud Slicer Key' }));
      return;
    }
  }

  if (
    req.method === 'POST' &&
    (reqUrl.pathname === '/slice' || reqUrl.pathname === '/slice-url')
  ) {
    if (activeJobs >= MAX_CONCURRENT_JOBS) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: 'Cloud Slicer Worker đang bận xử lý tối đa luồng, vui lòng thử lại sau vài giây.',
        })
      );
      return;
    }

    activeJobs++;
    const jobId = crypto.randomUUID();
    const jobDir = path.join(WORK_ROOT, jobId);

    try {
      await fs.mkdir(jobDir, { recursive: true });
      const contentType = (req.headers['content-type'] || '').toLowerCase();

      let modelBuffer;
      let fileName = reqUrl.searchParams.get('name') || 'model.stl';
      const supParam = reqUrl.searchParams.get('support') || reqUrl.searchParams.get('supportMode');
      const angParam = reqUrl.searchParams.get('angle') || reqUrl.searchParams.get('angleThreshold');

      let settings = {
        layerHeight: Number(reqUrl.searchParams.get('layerHeight') || 0.2),
        wallLoops: Number(reqUrl.searchParams.get('wallLoops') || 2),
        infillDensity: Number(reqUrl.searchParams.get('infillDensity') || 15),
        infillType: reqUrl.searchParams.get('infillType') || 'gyroid',
        supportMode: supParam || 'tree',
        treeStyle: reqUrl.searchParams.get('treeStyle') || 'organic',
        supportAngleThreshold: Number(angParam || 45),
        supportTopZDistance: Number(reqUrl.searchParams.get('topZDistance') || 0.2),
        supportBranchDiameter: Number(reqUrl.searchParams.get('branchDiameter') || 2.0),
        material: reqUrl.searchParams.get('material') || 'PLA',
      };

      if (contentType.includes('application/json') || reqUrl.pathname === '/slice-url') {
        const rawBody = await readRequestBody(req, 15 * 1024 * 1024);
        const payload = JSON.parse(rawBody.toString('utf8'));
        fileName = payload.fileName || fileName;
        settings = { ...settings, ...(payload.profile || payload.settings || {}) };

        if (payload.fileUrl) {
          const remoteRes = await fetch(payload.fileUrl);
          if (!remoteRes.ok) {
            throw new Error(`Không tải được file mô hình từ fileUrl (${remoteRes.status})`);
          }
          modelBuffer = Buffer.from(await remoteRes.arrayBuffer());
        } else if (payload.fileBase64) {
          modelBuffer = Buffer.from(payload.fileBase64, 'base64');
        } else {
          throw new Error('Thiếu fileUrl hoặc fileBase64 trong JSON request');
        }
      } else {
        modelBuffer = await readRequestBody(req);
      }

      const safeExt = path.extname(fileName).toLowerCase() || '.stl';
      const inputPath = path.join(jobDir, `input_model${safeExt}`);
      await fs.writeFile(inputPath, modelBuffer);

      const { gcodeText, logs, engineUsed } = await runHeadlessOrcaBambuSlice(
        inputPath,
        jobDir,
        settings
      );
      const parsed = parseNativeSlicerGcode(gcodeText, fileName);
      const quote = calculateFactoryQuoteVnd(parsed, settings.material || 'PLA');

      const responseFormat = reqUrl.searchParams.get('format') || 'json';
      if (responseFormat === 'binary') {
        const gzBuf = packSlicedBundleToBinaryGzip(parsed);
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'gzip',
          'X-Total-Layers': String(parsed.totalLayers),
          'X-Filament-Grams': String(parsed.filamentWeightGrams),
          'X-Quote-Vnd': String(quote.totalQuoteVnd),
        });
        res.end(gzBuf);
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            engine: engineUsed || 'orca_bambu_headless_cli',
            modelName: fileName,
            ...parsed,
            factoryQuote: quote,
            logs,
          })
        );
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: err?.message || 'Headless Cloud Slicer Error',
        })
      );
    } finally {
      activeJobs = Math.max(0, activeJobs - 1);
      fs.rm(jobDir, { recursive: true, force: true }).catch(() => {});
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[Laymor3D Cloud Slicer Worker] Listening on 0.0.0.0:${PORT} (Orca: ${SLICER_BIN}, Prusa: ${PRUSA_BIN})`
  );
});
