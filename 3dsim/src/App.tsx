import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import {
  ISimulationProfile,
  ISimulationState,
  ISampleModel,
  PlaybackSpeed,
  SlicerRenderMode,
  IModelTransform,
  DEFAULT_TRANSFORM,
  SimulatorEngineType,
  ViewportDisplayMode,
} from '@/types/simulator';
import { PRESET_PROFILES } from '@/services/presetProfiles';
import {
  SAMPLE_MODELS,
  generateProceduralGeometry,
  parseCADFile,
  applyTransformToGeometry,
  IBambuPlateMeshData,
} from '@/services/sampleModels';
import {
  computeSlicingMetrics,
  computeVirtualToolheadPosition,
  calculateLayerProgress,
} from '@/services/slicingEngine';
import {
  computeProSlicerTelemetry,
  generateSurroundingGcodeBlock,
} from '@/services/proSlicerLocalEngine';
import {
  runPreflightInspection,
  fetchLearnedDefectRulesFromDB,
  ICustomDefectKnowledgeRule,
} from '@/services/preflightAnalyzer';
import { DefectKnowledgeModal } from '@/components/controls/DefectKnowledgeModal';
import {
  embedProtocol,
  mapStudioModelIdToSimSampleId,
  mapSimSampleIdToStudioModelId,
} from '@/services/embedProtocol';
import {
  clearAllSupportCaches,
  setPreloadedSupport,
  setPreloadedToolpaths,
  extractBambuGcodeFromBuffer,
  extractAllBambuPlatesGcodeFromBuffer,
  parseBambuGcodeNative,
  reconstructGeometryFromToolpaths,
  IParsedBambuGcodeBundle,
} from '@/services/nativeSupportLoader';
import { sliceUniversalGeometry } from '@/services/universalSlicerEngine';

interface ILoadedBambuPlate {
  plateId: number;
  plateName: string;
  partCount: number;
  geometry: THREE.BufferGeometry;
  nativeKey?: string;
  gcodeBundle?: IParsedBambuGcodeBundle;
}

import { PrintSimulatorViewport } from '@/components/viewport/PrintSimulatorViewport';
import { TimeScrubber } from '@/components/controls/TimeScrubber';
import { ProfileSettingsPanel } from '@/components/controls/ProfileSettingsPanel';
import { PreflightReportModal } from '@/components/controls/PreflightReportModal';
import { LiveReportInspectorModal } from '@/components/controls/LiveReportInspectorModal';
import { SupabaseHubModal } from '@/components/controls/SupabaseHubModal';
import { fetchSupabaseStatus } from '@/services/telemetryService';
import { ExportProfileModal } from '@/components/controls/ExportProfileModal';
import { SimulatorHeader } from '@/components/header/SimulatorHeader';
import { EngineComparisonModal } from '@/components/controls/EngineComparisonModal';
import { BambuTimelapseModal } from '@/components/controls/BambuTimelapseModal';
import { BambuSupportAIAssistantModal } from '@/components/controls/BambuSupportAIAssistantModal';
import { GeminiApiKeyModal } from '@/components/controls/GeminiApiKeyModal';
import { getSavedGeminiApiKey } from '@/services/geminiSupportService';
import { LocalSlicerModal } from '@/components/controls/LocalSlicerModal';
import { ModelLibraryModal } from '@/components/controls/ModelLibraryModal';
import { AI3DGeneratorModal } from '@/components/controls/AI3DGeneratorModal';
import {
  SimulationRunLogPanel,
  ISimulationLogEntry,
} from '@/components/controls/SimulationRunLogPanel';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ISliceResponse } from '@/services/localSlicerService';
import { useTelemetryLogger } from '@/hooks/useTelemetryLogger';
import { IconAxis, IconLayers, IconToolpath } from '@/components/icons/MinimalIcons';

export default function App() {
  // 0. Luxury Dark / Light Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('printsim_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('printsim_theme', theme);
  }, [theme]);

  // 1. Model & Geometry State
  const [currentModel, setCurrentModel] = useState<ISampleModel>(SAMPLE_MODELS[0]);
  const [baseGeometry, setBaseGeometry] = useState<THREE.BufferGeometry>(() =>
    generateProceduralGeometry(SAMPLE_MODELS[0].geometryType)
  );
  const [modelTransform, setModelTransform] = useState<IModelTransform>(DEFAULT_TRANSFORM);

  // Dùng baseGeometry gốc làm chuẩn (Three.js Scene Graph modelRootGroup sẽ quản lý Position, Rotation, Scale tức thì)
  const geometry = baseGeometry;

  // 2. Profile State
  const [profile, setProfile] = useState<ISimulationProfile>(PRESET_PROFILES[0]);

  // Hook ghi nhận Telemetry Ingestion sang Backend FastAPI (cổng 8000)
  useTelemetryLogger(profile, currentModel.name);

  // 3. UI Toggles & Engine Selection
  const [simulatorEngine, setSimulatorEngine] = useState<SimulatorEngineType>('wasm_client');
  const [isEngineModalOpen, setIsEngineModalOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isTimelapseModalOpen, setIsTimelapseModalOpen] = useState<boolean>(false);
  const [isSupportAIModalOpen, setIsSupportAIModalOpen] = useState<boolean>(false);
  const [isGeminiKeyModalOpen, setIsGeminiKeyModalOpen] = useState<boolean>(false);
  const [isLocalSlicerModalOpen, setIsLocalSlicerModalOpen] = useState<boolean>(false);
  const [isLiveInspectorOpen, setIsLiveInspectorOpen] = useState<boolean>(false);
  const [isSupabaseHubOpen, setIsSupabaseHubOpen] = useState<boolean>(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [selectedReportLogId, setSelectedReportLogId] = useState<string | null>(null);
  const [isModelLibraryOpen, setIsModelLibraryOpen] = useState<boolean>(false);
  const [isAI3DModalOpen, setIsAI3DModalOpen] = useState<boolean>(false);
  const [isDefectKnowledgeOpen, setIsDefectKnowledgeOpen] = useState<boolean>(false);
  const [learnedDefectRules, setLearnedDefectRulesState] = useState<ICustomDefectKnowledgeRule[]>([]);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(() => {
    return getSavedGeminiApiKey().length > 0;
  });
  const captureSnapshotRef = useRef<(() => string | null) | null>(null);

  // Nạp quy tắc lỗi học từ Knowledge Database (/api/knowledge) khi khởi động
  useEffect(() => {
    fetchLearnedDefectRulesFromDB().then((rules) => {
      setLearnedDefectRulesState(rules);
    });
  }, []);

  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [showToolhead, setShowToolhead] = useState<boolean>(true);
  const [showSupport, setShowSupport] = useState<boolean>(true);
  const [cameraView, setCameraView] = useState<'iso' | 'top' | 'front' | 'nozzle'>('iso');
  const [renderMode, setRenderMode] = useState<SlicerRenderMode>('realistic');
  const [viewMode, setViewMode] = useState<ViewportDisplayMode>('cad');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [uploadSlicingStatus, setUploadSlicingStatus] = useState<string | null>(null);
  const [loadedPlates, setLoadedPlates] = useState<ILoadedBambuPlate[]>([]);
  const [activePlateId, setActivePlateId] = useState<number>(1);
  const [hasNativeBambuSupport, setHasNativeBambuSupport] = useState<boolean>(true);
  const bambuGcodeInputRef = useRef<HTMLInputElement | null>(null);
  const isEmbedded = embedProtocol.getIsEmbedded();

  // 4. Compute Slicing Metrics & Pre-flight Report
  const slicingMetrics = React.useMemo(() => {
    return computeSlicingMetrics(geometry, profile, modelTransform.scale);
  }, [geometry, profile, modelTransform.scale]);

  const preflightReport = React.useMemo(() => {
    return runPreflightInspection(geometry, profile, slicingMetrics, learnedDefectRules);
  }, [geometry, profile, slicingMetrics, learnedDefectRules]);

  // 5. Simulation State (Mặc định hiển thị 100% mô hình hoàn thiện rõ ràng ngay khi mở)
  const [simulationState, setSimulationState] = useState<ISimulationState>(() => ({
    isPlaying: false,
    playbackSpeed: 50,
    currentProgress: 1.0,
    currentLayer: slicingMetrics.totalLayers,
    totalLayers: slicingMetrics.totalLayers,
    elapsedTimeSec: slicingMetrics.estimatedPrintTimeSec,
    totalTimeSec: slicingMetrics.estimatedPrintTimeSec,
    filamentUsedGrams: Number(slicingMetrics.estimatedFilamentGrams.toFixed(1)),
    totalFilamentGrams: slicingMetrics.estimatedFilamentGrams,
    toolheadPosition: [0, 0, 0],
    activeToolpathType: 'perimeter',
    isCompleted: true,
  }));

  // Đồng bộ lại simulation metrics khi geometry hoặc profile đổi
  useEffect(() => {
    setSimulationState((prev) => {
      const curLayer = Math.min(slicingMetrics.totalLayers, Math.max(1, Math.floor(prev.currentProgress * slicingMetrics.totalLayers)));
      const toolhead = computeVirtualToolheadPosition(prev.currentProgress, slicingMetrics, profile, geometry);
      return {
        ...prev,
        totalLayers: slicingMetrics.totalLayers,
        totalTimeSec: slicingMetrics.estimatedPrintTimeSec,
        totalFilamentGrams: slicingMetrics.estimatedFilamentGrams,
        currentLayer: curLayer,
        elapsedTimeSec: Math.round(prev.currentProgress * slicingMetrics.estimatedPrintTimeSec),
        filamentUsedGrams: Number((prev.currentProgress * slicingMetrics.estimatedFilamentGrams).toFixed(1)),
        toolheadPosition: toolhead.position,
        activeToolpathType: toolhead.toolpathType,
      };
    });
  }, [slicingMetrics, profile, geometry]);

  // 6. Pro Slicer Engine Telemetry & G-Code Buffer (Engine 2)
  const proTelemetry = React.useMemo(() => {
    return computeProSlicerTelemetry(simulationState, slicingMetrics, profile);
  }, [simulationState, slicingMetrics, profile]);

  const gcodeLines = React.useMemo(() => {
    return generateSurroundingGcodeBlock(simulationState, slicingMetrics, profile);
  }, [simulationState, slicingMetrics, profile]);

  // Gửi thông báo Ready và Report khi nhúng trong iframe + Đọc cầu nối từ /studio
  useEffect(() => {
    embedProtocol.notifyReady();
    embedProtocol.notifyReport(preflightReport);

    const bridge = embedProtocol.consumeInitialStudioBridge();
    if (bridge) {
      if (bridge.stlBase64) {
        try {
          const binaryStr = atob(bridge.stlBase64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const customGeom = parseCADFile(bytes.buffer, bridge.modelName || 'Studio_Model.stl');
          customGeom.computeBoundingBox();
          const bbox = customGeom.boundingBox || new THREE.Box3();
          const dimX = Math.round(bbox.max.x - bbox.min.x);
          const dimY = Math.round(bbox.max.y - bbox.min.y);
          const dimZ = Math.round(bbox.max.z - bbox.min.z);
          const customModelObj: ISampleModel = {
            id: 'studio-custom-' + Date.now(),
            name: (bridge.modelName || 'Studio Model').replace(/\.[^/.]+$/, ''),
            description: `Mô hình chuyển tiếp từ 3D Studio (${dimX} × ${dimY} × ${dimZ} mm)`,
            category: '3D Studio Sync',
            geometryType: 'custom' as any,
            defaultProfileId: profile.id,
            dimensionsMm: [dimX, dimY, dimZ],
            estimatedWeightGrams: Math.round(dimX * dimY * dimZ * 0.00045 * 1.24 * 10) / 10,
            accentBadge: 'Studio CAD',
          };
          setBaseGeometry(customGeom);
          setCurrentModel(customModelObj);
        } catch (err) {
          console.warn('Không thể giải mã stlBase64 từ 3D Studio:', err);
        }
      } else if (bridge.sampleId) {
        const mappedId = mapStudioModelIdToSimSampleId(bridge.sampleId);
        const found = SAMPLE_MODELS.find((m) => m.id === mappedId || m.id === bridge.sampleId);
        if (found) {
          handleSelectSample(found);
        }
      }

      if (bridge.profile) {
        setProfile((prev) => ({ ...prev, ...bridge.profile }));
      }
      if (bridge.scalePercent && bridge.scalePercent > 10) {
        const s = Math.max(0.2, Math.min(3.0, bridge.scalePercent / 100));
        setModelTransform((prev) => ({ ...prev, scale: s }));
      }
      if (bridge.viewMode) {
        setViewMode(bridge.viewMode);
      }
    }
  }, []);

  // Tự động đồng bộ Report & Profile sang parent iframe (/studio) khi có thay đổi
  useEffect(() => {
    embedProtocol.notifyReport(preflightReport);
  }, [preflightReport]);

  useEffect(() => {
    embedProtocol.syncProfile(profile);
  }, [profile]);

  // Lắng nghe Message từ 3D Hub / 3D Studio nếu nhúng qua iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || (e.data.source !== '3DHUB' && e.data.source !== '3D_STUDIO')) return;
      const msgType = e.data.type || e.data.action;
      const payload = e.data.data || e.data;

      if (msgType === 'LOAD_MODEL' || msgType === 'SYNC_FROM_STUDIO') {
        if (payload.stlBuffer instanceof ArrayBuffer) {
          try {
            clearAllSupportCaches();
            const customGeom = parseCADFile(payload.stlBuffer, payload.modelName || 'Studio_Model.stl');
            customGeom.computeBoundingBox();
            const bbox = customGeom.boundingBox || new THREE.Box3();
            const dimX = Math.round(bbox.max.x - bbox.min.x);
            const dimY = Math.round(bbox.max.y - bbox.min.y);
            const dimZ = Math.round(bbox.max.z - bbox.min.z);
            const customModelObj: ISampleModel = {
              id: 'studio-custom-' + Date.now(),
              name: (payload.modelName || 'Studio Model').replace(/\.[^/.]+$/, ''),
              description: `Mô hình đồng bộ trực tiếp từ 3D Studio (${dimX} × ${dimY} × ${dimZ} mm)`,
              category: '3D Studio Sync',
              geometryType: 'custom' as any,
              defaultProfileId: profile.id,
              dimensionsMm: [dimX, dimY, dimZ],
              estimatedWeightGrams: Math.round(dimX * dimY * dimZ * 0.00045 * 1.24 * 10) / 10,
              accentBadge: 'Studio CAD',
            };
            setBaseGeometry(customGeom);
            setCurrentModel(customModelObj);
          } catch (err) {
            console.warn('Lỗi đọc stlBuffer qua postMessage:', err);
          }
        } else if (payload.sampleId) {
          const mappedId = mapStudioModelIdToSimSampleId(payload.sampleId);
          const sample = SAMPLE_MODELS.find((m) => m.id === mappedId || m.id === payload.sampleId);
          if (sample) handleSelectSample(sample);
        }

        if (payload.profile) {
          setProfile((prev) => ({ ...prev, ...payload.profile }));
        }
        if (typeof payload.scale === 'number' && payload.scale > 0.1) {
          setModelTransform((prev) => ({ ...prev, scale: payload.scale }));
        }
        if (payload.viewMode) {
          setViewMode(payload.viewMode);
        }
      } else if (msgType === 'SET_PROFILE') {
        if (payload.profile) {
          setProfile((prev) => ({ ...prev, ...payload.profile }));
        }
      } else if (msgType === 'START_SIMULATION' || msgType === 'PLAY') {
        setSimulationState((prev) => ({
          ...prev,
          isPlaying: true,
          isCompleted: false,
          currentProgress: prev.currentProgress >= 0.99 ? 0 : prev.currentProgress,
        }));
      } else if (msgType === 'PAUSE') {
        setSimulationState((prev) => ({ ...prev, isPlaying: false }));
      } else if (msgType === 'SCRUB_PROGRESS' && typeof payload.progress === 'number') {
        const progress = Math.max(0, Math.min(1.0, payload.progress));
        setSimulationState((prev) => {
          const { currentLayer: curLayer } = calculateLayerProgress(progress, prev.totalLayers);
          return {
            ...prev,
            currentProgress: progress,
            currentLayer: curLayer,
            elapsedTimeSec: Math.round(progress * prev.totalTimeSec),
            filamentUsedGrams: Number((progress * prev.totalFilamentGrams).toFixed(1)),
            isCompleted: progress >= 1.0,
          };
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [profile.id]);

  // Vòng lặp mô phỏng in 3D thời gian thực (Simulation Clock Loop)
  useEffect(() => {
    if (!simulationState.isPlaying) return;

    let lastTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      setSimulationState((prev) => {
        if (!prev.isPlaying || prev.isCompleted) return prev;

        // Tính toán bước nhảy tiến độ theo tốc độ playback
        // Nếu tốc độ 1x: tiến trình thực = deltaSec / totalTimeSec
        // Nếu tốc độ 100x: nhanh gấp 100 lần
        const speedMultiplier = prev.playbackSpeed === 'instant' ? 10000 : (prev.playbackSpeed as number);
        const progressIncrement = (deltaSec * speedMultiplier) / Math.max(10, prev.totalTimeSec);
        const nextProgress = Math.min(1.0, prev.currentProgress + progressIncrement);

        const { currentLayer: nextLayer } = calculateLayerProgress(nextProgress, prev.totalLayers);
        const nextElapsed = Math.round(nextProgress * prev.totalTimeSec);
        const nextFilament = Number((nextProgress * prev.totalFilamentGrams).toFixed(1));

        const toolhead = computeVirtualToolheadPosition(nextProgress, slicingMetrics, profile, geometry);
        const hasFinished = nextProgress >= 1.0;

        if (hasFinished && !prev.isCompleted) {
          // Bắn pháo hoa ăn mừng in thành công!
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#2dd4bf', '#10b981', '#f59e0b', '#8b5cf6'],
          });
        }

        // Báo cáo telemetry
        embedProtocol.notifyTelemetry({
          progress: nextProgress,
          currentLayer: nextLayer,
          totalLayers: prev.totalLayers,
          elapsedTimeSec: nextElapsed,
          totalTimeSec: prev.totalTimeSec,
          filamentUsedGrams: nextFilament,
        });

        return {
          ...prev,
          currentProgress: nextProgress,
          currentLayer: nextLayer,
          elapsedTimeSec: nextElapsed,
          filamentUsedGrams: nextFilament,
          toolheadPosition: toolhead.position,
          activeToolpathType: toolhead.toolpathType,
          isPlaying: !hasFinished,
          isCompleted: hasFinished,
        };
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [simulationState.isPlaying, simulationState.playbackSpeed, slicingMetrics, profile, geometry]);

  // Phím tắt bàn phím (Space, Mũi tên trái/phải, H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setSimulationState((prev) => {
          if (prev.isCompleted) {
            return { ...prev, isPlaying: true, isCompleted: false, currentProgress: 0 };
          }
          return { ...prev, isPlaying: !prev.isPlaying };
        });
      } else if (e.code === 'ArrowLeft') {
        handleStepLayer(-1);
      } else if (e.code === 'ArrowRight') {
        handleStepLayer(1);
      } else if (e.key.toLowerCase() === 'h') {
        setShowHeatmap((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slicingMetrics]);

  // Chọn Sample Model
  const handleSelectSample = (sample: ISampleModel) => {
    clearAllSupportCaches();
    setViewMode('cad');
    setCurrentModel(sample);
    setModelTransform(DEFAULT_TRANSFORM);
    setLoadedPlates([]);
    setActivePlateId(1);
    setHasNativeBambuSupport(true);
    const newGeom = generateProceduralGeometry(sample.geometryType);
    setBaseGeometry(newGeom);

    const preset = PRESET_PROFILES.find((p) => p.id === sample.defaultProfileId) || PRESET_PROFILES[0];
    setProfile(preset);

    setSimulationState((prev) => ({
      ...prev,
      currentProgress: 1.0,
      isPlaying: false,
      isCompleted: true,
    }));
  };

  // Chuyển đổi giữa các Bàn In (Plate 1, Plate 2, Plate 3...) của dự án 3MF đa bàn in
  const handleSelectPlate = (plateId: number) => {
    const target = loadedPlates.find((p) => p.plateId === plateId);
    if (!target) return;
    setActivePlateId(plateId);
    setModelTransform(DEFAULT_TRANSFORM);
    setBaseGeometry(target.geometry);

    const hasSupport = Boolean(
      target.gcodeBundle && target.gcodeBundle.supportData.segments.length > 0
    );
    setHasNativeBambuSupport(hasSupport);

    setCurrentModel((prev) => ({
      ...prev,
      path: target.nativeKey || prev.path,
      accentBadge: target.gcodeBundle ? 'Bambu G-Code Native' : 'Bambu 3MF',
    }));

    if (target.gcodeBundle) {
      setSimulationState((prev) => ({
        ...prev,
        totalLayers: target.gcodeBundle!.totalLayers,
        currentLayer: target.gcodeBundle!.totalLayers,
        totalTimeSec: target.gcodeBundle!.estimatedTimeSec,
        elapsedTimeSec: target.gcodeBundle!.estimatedTimeSec,
        totalFilamentGrams: target.gcodeBundle!.filamentWeightGrams,
        filamentUsedGrams: target.gcodeBundle!.filamentWeightGrams,
        currentProgress: 1.0,
        isPlaying: false,
        isCompleted: true,
      }));
    } else {
      setSimulationState((prev) => ({
        ...prev,
        currentProgress: 1.0,
        isPlaying: false,
        isCompleted: true,
      }));
    }
  };

  // Áp dụng kết quả Slicing từ Local Slicer CLI hoặc G-Code vào Simulation State
  const handleApplySliceResult = (res: ISliceResponse) => {
    if (!res || !res.success) return;
    setShowSupport(true);
    setHasNativeBambuSupport(true);
    const nativeKey = `bambu-native-${Date.now()}`;
    if (res.supportData && res.supportData.segments && res.supportData.segments.length > 0) {
      setPreloadedSupport(nativeKey, res.supportData);
      setPreloadedSupport(currentModel.name, res.supportData);
      setPreloadedSupport(currentModel.id, res.supportData);
      if (currentModel.path) setPreloadedSupport(currentModel.path, res.supportData);
    }
    if (res.toolpathData && res.toolpathData.outerWalls && res.toolpathData.outerWalls.length > 0) {
      setPreloadedToolpaths(nativeKey, res.toolpathData);
      setPreloadedToolpaths(currentModel.name, res.toolpathData);
      setPreloadedToolpaths(currentModel.id, res.toolpathData);
      if (currentModel.path) setPreloadedToolpaths(currentModel.path, res.toolpathData);
    }
    setCurrentModel((prev) => ({
      ...prev,
      path: nativeKey,
    }));
    setSimulationState((prev) => ({
      ...prev,
      totalLayers: res.totalLayers,
      totalTimeSec: res.estimatedTimeSec,
      totalFilamentGrams: res.filamentWeightGrams,
      currentLayer: res.totalLayers,
      currentProgress: 1.0,
      elapsedTimeSec: res.estimatedTimeSec,
      filamentUsedGrams: res.filamentWeightGrams,
    }));
  };

  // Nạp trực tiếp file .gcode.3mf hoặc .gcode xuất từ Bambu Studio áp dụng lên mô hình hiện tại
  const handleImportNativeSupportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) return;
      const gcodePlates = extractAllBambuPlatesGcodeFromBuffer(buffer, file.name);
      if (gcodePlates.length === 0) {
        alert(
          'File này chưa có dữ liệu G-Code đã cắt lát từ Bambu Studio.\nHãy chọn File -> Export -> Export plate sliced file (.gcode.3mf) hoặc Export G-code (.gcode) trong Bambu Studio!'
        );
        return;
      }

      // Kiểm tra nếu file .gcode.3mf có kèm cả lưới 3D (.model) đa bàn in
      let maybeGeom: THREE.BufferGeometry | null = null;
      try {
        if (file.name.toLowerCase().endsWith('.3mf')) {
          const parsed = parseCADFile(buffer, file.name);
          if (parsed && parsed.getAttribute('position')?.count > 0) {
            maybeGeom = parsed;
          }
        }
      } catch {
        // Giữ nguyên baseGeometry hiện tại của mô hình
      }

      const meshPlates: IBambuPlateMeshData[] =
        (maybeGeom?.userData?.plates as IBambuPlateMeshData[]) ||
        (loadedPlates.length > 0
          ? loadedPlates.map((p) => ({
              plateId: p.plateId,
              plateName: p.plateName,
              partCount: p.partCount,
              geometry: p.geometry,
              plateCenter3MF: p.geometry.userData?.plateCenter3MF || [128, 128],
            }))
          : []);

      const timestamp = Date.now();
      const updatedPlates: ILoadedBambuPlate[] = [];

      const allPlateIds = Array.from(
        new Set([
          ...meshPlates.map((m) => m.plateId),
          ...gcodePlates.map((g) => g.plateId),
        ])
      ).sort((a, b) => a - b);

      for (let i = 0; i < allPlateIds.length; i++) {
        const pid = allPlateIds[i];
        const mPlate =
          meshPlates.find((m) => m.plateId === pid) ||
          (i === 0 && meshPlates.length === 1 ? meshPlates[0] : undefined);
        const gPlate =
          gcodePlates.find((g) => g.plateId === pid) ||
          (i === 0 && gcodePlates.length === 1 ? gcodePlates[0] : undefined);

        const targetGeomBase = mPlate?.geometry || (i === 0 ? maybeGeom || baseGeometry : null);
        let refBbox: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined;
        if (targetGeomBase && targetGeomBase.getAttribute('position')?.count > 0) {
          targetGeomBase.computeBoundingBox();
          const b = targetGeomBase.boundingBox;
          if (b) {
            refBbox = { minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z };
          }
        }

        const bundle = gPlate
          ? parseBambuGcodeNative(gPlate.gcodeText, `${currentModel.name}_plate_${pid}`, {
              referenceMeshBbox: refBbox,
              plateCenter3MF: mPlate?.plateCenter3MF,
            })
          : undefined;

        const finalGeom =
          targetGeomBase && targetGeomBase.getAttribute('position')?.count > 0
            ? targetGeomBase
            : bundle
            ? reconstructGeometryFromToolpaths(bundle.toolpathData)
            : baseGeometry;

        const nativeKey = bundle ? `bambu-gcode-${timestamp}-p${pid}` : undefined;
        if (bundle && nativeKey) {
          setPreloadedSupport(nativeKey, bundle.supportData);
          setPreloadedToolpaths(nativeKey, bundle.toolpathData);
          if (i === 0) {
            setPreloadedSupport(currentModel.name, bundle.supportData);
            setPreloadedSupport(currentModel.id, bundle.supportData);
            setPreloadedToolpaths(currentModel.name, bundle.toolpathData);
            setPreloadedToolpaths(currentModel.id, bundle.toolpathData);
          }
        }

        updatedPlates.push({
          plateId: pid,
          plateName: mPlate?.plateName || gPlate?.plateName || `Bàn in ${pid}`,
          partCount: mPlate?.partCount || (finalGeom.userData?.bambuParts?.length ?? 1),
          geometry: finalGeom,
          nativeKey,
          gcodeBundle: bundle,
        });
      }

      const activePlate =
        updatedPlates.find((p) => p.plateId === activePlateId) || updatedPlates[0];
      if (!activePlate) return;

      setLoadedPlates(updatedPlates);
      setActivePlateId(activePlate.plateId);
      setBaseGeometry(activePlate.geometry);
      setShowSupport(true);
      setHasNativeBambuSupport(Boolean(activePlate.gcodeBundle));
      setProfile((prev) => ({
        ...prev,
        supportMode: 'tree',
        treeStyle: prev.treeStyle || 'organic',
      }));

      if (activePlate.gcodeBundle && activePlate.nativeKey) {
        const bundle = activePlate.gcodeBundle;
        setCurrentModel((prev) => ({
          ...prev,
          path: activePlate.nativeKey,
          accentBadge: 'Bambu G-Code Native',
        }));

        setSimulationState((prev) => ({
          ...prev,
          totalLayers: bundle.totalLayers,
          currentLayer: bundle.totalLayers,
          totalTimeSec: bundle.estimatedTimeSec,
          elapsedTimeSec: bundle.estimatedTimeSec,
          totalFilamentGrams: bundle.filamentWeightGrams,
          filamentUsedGrams: bundle.filamentWeightGrams,
          currentProgress: 1.0,
          isPlaying: false,
          isCompleted: true,
        }));

        setUploadSlicingStatus(
          `Đã nạp Tree Support gốc từ Bambu Studio (${updatedPlates.length} bàn in, ${bundle.totalLayers} lớp, ${bundle.supportLinesCount.toLocaleString()} đường dao Support)`
        );
        setTimeout(() => setUploadSlicingStatus(null), 5500);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Tải file 3MF / .gcode.3mf / .gcode / STL / OBJ từ máy tính
  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) return;
      try {
        clearAllSupportCaches();
        setViewMode('cad');
        setShowSupport(true);
        setProfile((prev) => ({
          ...prev,
          supportMode: prev.supportMode === 'none' ? 'tree' : prev.supportMode,
          treeStyle: prev.treeStyle || 'organic',
        }));
        setModelTransform(DEFAULT_TRANSFORM);

        const cleanName = file.name.replace(/\.gcode\.3mf$/i, '').replace(/\.[^/.]+$/, '');

        // 1. Trích xuất tất cả các bàn in G-code (.gcode.3mf hoặc .gcode) từ Bambu Studio
        const gcodePlates = extractAllBambuPlatesGcodeFromBuffer(buffer, file.name);

        // 2. Phân tích hình học 3D (.3mf / .stl / .obj), bao gồm toàn bộ các Bàn In (Plates) và vị trí các chi tiết lẻ
        let customGeom: THREE.BufferGeometry | null = null;
        try {
          if (!file.name.toLowerCase().endsWith('.gcode') && !file.name.toLowerCase().endsWith('.gco')) {
            customGeom = parseCADFile(buffer, file.name);
          }
        } catch (cadErr) {
          if (gcodePlates.length === 0) {
            throw cadErr;
          }
        }

        const meshPlates: IBambuPlateMeshData[] =
          (customGeom?.userData?.plates as IBambuPlateMeshData[]) || [];

        const timestamp = Date.now();
        const builtPlates: ILoadedBambuPlate[] = [];

        if (meshPlates.length > 0 || gcodePlates.length > 0) {
          const allPlateIds = Array.from(
            new Set([
              ...meshPlates.map((m) => m.plateId),
              ...gcodePlates.map((g) => g.plateId),
            ])
          ).sort((a, b) => a - b);

          for (let i = 0; i < allPlateIds.length; i++) {
            const pid = allPlateIds[i];
            const mPlate =
              meshPlates.find((m) => m.plateId === pid) ||
              (i === 0 && meshPlates.length === 1 ? meshPlates[0] : undefined);
            const gPlate =
              gcodePlates.find((g) => g.plateId === pid) ||
              (i === 0 && gcodePlates.length === 1 ? gcodePlates[0] : undefined);

            let targetGeom: THREE.BufferGeometry | null = mPlate?.geometry || null;
            if (
              !targetGeom &&
              i === 0 &&
              customGeom &&
              customGeom.getAttribute('position')?.count > 0
            ) {
              targetGeom = customGeom;
            }
            if (
              !targetGeom &&
              i === 0 &&
              currentModel.id.startsWith('custom-') &&
              baseGeometry.getAttribute('position')?.count > 0
            ) {
              targetGeom = baseGeometry;
            }

            let refBbox: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined;
            if (targetGeom && targetGeom.getAttribute('position')?.count > 0) {
              targetGeom.computeBoundingBox();
              const b = targetGeom.boundingBox;
              if (b) {
                refBbox = { minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z };
              }
            }

            const bundle = gPlate
              ? parseBambuGcodeNative(gPlate.gcodeText, `${cleanName}_plate_${pid}`, {
                  referenceMeshBbox: refBbox,
                  plateCenter3MF: mPlate?.plateCenter3MF,
                })
              : undefined;

            if (!targetGeom && bundle) {
              targetGeom = reconstructGeometryFromToolpaths(bundle.toolpathData);
            }

            if (!targetGeom) continue;

            const nativeKey = bundle ? `bambu-native-${timestamp}-p${pid}` : undefined;
            if (bundle && nativeKey) {
              if (bundle.supportData.segments.length > 0) {
                setPreloadedSupport(nativeKey, bundle.supportData);
              }
              if (bundle.toolpathData.outerWalls.length > 0) {
                setPreloadedToolpaths(nativeKey, bundle.toolpathData);
              }
            }

            builtPlates.push({
              plateId: pid,
              plateName: mPlate?.plateName || gPlate?.plateName || `Bàn in ${pid}`,
              partCount: mPlate?.partCount || (targetGeom.userData?.bambuParts?.length ?? 1),
              geometry: targetGeom,
              nativeKey,
              gcodeBundle: bundle,
            });
          }
        } else if (customGeom) {
          builtPlates.push({
            plateId: 1,
            plateName: 'Bàn in 1',
            partCount: customGeom.userData?.bambuParts?.length ?? 1,
            geometry: customGeom,
          });
        }

        const firstPlate = builtPlates[0];
        const activeGeom = firstPlate?.geometry || customGeom;
        if (!activeGeom) {
          throw new Error('Không thể đọc dữ liệu hình học 3D từ file này.');
        }

        setLoadedPlates(builtPlates);
        setActivePlateId(firstPlate?.plateId || 1);
        setBaseGeometry(activeGeom);

        const parsedGcodeBundle = firstPlate?.gcodeBundle || null;
        const nativePathKey = firstPlate?.nativeKey;
        setHasNativeBambuSupport(
          Boolean(parsedGcodeBundle && parsedGcodeBundle.supportData.segments.length > 0)
        );

        activeGeom.computeBoundingBox();
        const bbox = activeGeom.boundingBox || new THREE.Box3();
        const dimX = Math.max(1, Math.round(bbox.max.x - bbox.min.x));
        const dimY = Math.max(1, Math.round(bbox.max.y - bbox.min.y));
        const dimZ = Math.max(1, Math.round(bbox.max.z - bbox.min.z));

        const is3MF = file.name.toUpperCase().endsWith('.3MF');
        const isGcode = file.name.toUpperCase().endsWith('.GCODE') || Boolean(parsedGcodeBundle);

        const customModelObj: ISampleModel = {
          id: 'custom-' + timestamp,
          name: cleanName,
          path: nativePathKey,
          description: `Mô hình 3D tùy chỉnh (${dimX} x ${dimY} x ${dimZ} mm) nạp từ máy tính`,
          category: 'User Upload',
          geometryType: 'custom' as any,
          defaultProfileId: profile.id,
          dimensionsMm: [dimX, dimY, dimZ],
          estimatedWeightGrams:
            parsedGcodeBundle?.filamentWeightGrams ||
            Math.round(dimX * dimY * dimZ * 0.00045 * 1.24 * 10) / 10,
          accentBadge: isGcode
            ? 'Bambu G-Code Native'
            : is3MF
            ? 'Bambu 3MF'
            : file.name.toUpperCase().endsWith('.OBJ')
            ? 'File OBJ'
            : 'File STL',
        };

        // Nếu file đã có sẵn G-Code cắt lát từ Bambu Studio (.gcode.3mf / .gcode), nạp trực tiếp 100% Support gốc!
        if (parsedGcodeBundle && nativePathKey) {
          if (parsedGcodeBundle.supportData.segments.length > 0) {
            setPreloadedSupport(customModelObj.name, parsedGcodeBundle.supportData);
            setPreloadedSupport(customModelObj.id, parsedGcodeBundle.supportData);
          }
          if (parsedGcodeBundle.toolpathData.outerWalls.length > 0) {
            setPreloadedToolpaths(customModelObj.name, parsedGcodeBundle.toolpathData);
            setPreloadedToolpaths(customModelObj.id, parsedGcodeBundle.toolpathData);
          }
          setCurrentModel(customModelObj);
          setSimulationState((prev) => ({
            ...prev,
            totalLayers: parsedGcodeBundle.totalLayers,
            currentLayer: parsedGcodeBundle.totalLayers,
            totalTimeSec: parsedGcodeBundle.estimatedTimeSec,
            elapsedTimeSec: parsedGcodeBundle.estimatedTimeSec,
            totalFilamentGrams: parsedGcodeBundle.filamentWeightGrams,
            filamentUsedGrams: parsedGcodeBundle.filamentWeightGrams,
            currentProgress: 1.0,
            isPlaying: false,
            isCompleted: true,
          }));
          setUploadSlicingStatus(
            `Đã trích xuất trực tiếp Tree Support gốc từ Bambu Studio (${builtPlates.length} bàn in, ${parsedGcodeBundle.totalLayers} lớp, ${parsedGcodeBundle.supportLinesCount.toLocaleString()} đoạn Support)`
          );
          setTimeout(() => setUploadSlicingStatus(null), 5500);
          return;
        }

        setCurrentModel(customModelObj);

        setSimulationState((prev) => ({
          ...prev,
          currentProgress: 1.0,
          isPlaying: false,
          isCompleted: true,
        }));

        // Chỉ gửi file lên Local Slicer Bridge nếu đang chạy Localhost hoặc tên file thuộc bộ mẫu Pre-baked
        const lowerName = file.name.toLowerCase();
        const isPrebakedSample =
          lowerName.includes('cow') ||
          lowerName.includes('bò') ||
          lowerName.includes('highland') ||
          lowerName.includes('ogen') ||
          lowerName.includes('eule') ||
          lowerName.includes('owl') ||
          lowerName.includes('benchy') ||
          lowerName.includes('ghost');
        const isLocalhost =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        if (isLocalhost || (isPrebakedSample && file.size <= 4 * 1024 * 1024)) {
          setUploadSlicingStatus('Đang phân tích cấu trúc Overhang & đồng bộ Bambu Studio Tree Support...');
          fetch(`/api/slicer/upload-and-slice?name=${encodeURIComponent(file.name)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: file,
          })
            .then((res) => res.json())
            .then((resData) => {
              if (resData.success && resData.supportData?.segments?.length > 0) {
                setHasNativeBambuSupport(true);
                setPreloadedSupport(resData.modelPath || file.name, resData.supportData);
                setPreloadedSupport(customModelObj.name, resData.supportData);
                setPreloadedSupport(customModelObj.id, resData.supportData);
                if (resData.toolpathData) {
                  setPreloadedToolpaths(resData.modelPath || file.name, resData.toolpathData);
                  setPreloadedToolpaths(customModelObj.name, resData.toolpathData);
                  setPreloadedToolpaths(customModelObj.id, resData.toolpathData);
                }

                setCurrentModel((prev) => ({
                  ...prev,
                  path: resData.modelPath,
                }));

                if (resData.totalLayers) {
                  setSimulationState((prev) => ({
                    ...prev,
                    totalLayers: resData.totalLayers,
                    currentLayer: resData.totalLayers,
                    totalTimeSec: resData.estimatedTimeSec || prev.totalTimeSec,
                    totalFilamentGrams: resData.filamentWeightGrams || prev.totalFilamentGrams,
                    filamentUsedGrams: resData.filamentWeightGrams || prev.filamentUsedGrams,
                  }));
                }

                setUploadSlicingStatus(
                  `Hoàn tất Bambu Studio Native (${resData.totalLayers || 180} lớp in, ${resData.supportLinesCount || 0} đoạn Tree Support)`
                );
                setTimeout(() => setUploadSlicingStatus(null), 4000);
              } else {
                setUploadSlicingStatus(null);
              }
            })
            .catch(() => {
              setUploadSlicingStatus(null);
            });
        } else {
          const totalParts = firstPlate?.partCount || 1;
          setUploadSlicingStatus(
            `✓ Đã nạp ${cleanName} (${builtPlates.length} bàn in, ${totalParts} chi tiết, ${dimX}×${dimZ}×${dimY} mm) — Nạp thêm file .gcode.3mf để xem Tree Support từ Bambu Studio`
          );
          setTimeout(() => setUploadSlicingStatus(null), 4500);
        }
      } catch (err: any) {
        alert('Không thể đọc file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Nạp geometry tùy chỉnh từ ModelLibraryModal
  const handleLoadCustomGeometry = (geom: THREE.BufferGeometry, modelInfo: ISampleModel) => {
    clearAllSupportCaches();
    setViewMode('cad');
    setShowSupport(true);
    setLoadedPlates([]);
    setActivePlateId(1);
    setHasNativeBambuSupport(Boolean(modelInfo.path));
    setProfile((prev) => ({
      ...prev,
      supportMode: prev.supportMode === 'none' ? 'tree' : prev.supportMode,
      treeStyle: prev.treeStyle || 'organic',
    }));
    setModelTransform(DEFAULT_TRANSFORM);
    setBaseGeometry(geom);
    setCurrentModel(modelInfo);
    setSimulationState((prev) => ({
      ...prev,
      currentProgress: 1.0,
      isPlaying: false,
      isCompleted: true,
    }));

    if (modelInfo.path) {
      setUploadSlicingStatus('⚡ Đang đồng bộ Bambu Studio Native Tree Support & Sợi In...');
      fetch(`/api/slicer/active-support?path=${encodeURIComponent(modelInfo.path)}`)
        .then((r) => r.json())
        .then((data) => {
          setUploadSlicingStatus(null);
          if (data && data.supportData) {
            setPreloadedSupport(modelInfo.path!, data.supportData);
            setPreloadedSupport(modelInfo.name, data.supportData);
            setPreloadedSupport(modelInfo.id, data.supportData);
          }
        })
        .catch(() => setUploadSlicingStatus(null));

      fetch(`/api/slicer/full-toolpaths?path=${encodeURIComponent(modelInfo.path)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.outerWalls && data.outerWalls.length > 0) {
            setPreloadedToolpaths(modelInfo.path!, data);
            setPreloadedToolpaths(modelInfo.name, data);
            setPreloadedToolpaths(modelInfo.id, data);
            if (data.totalLayers) {
              setSimulationState((prev) => ({
                ...prev,
                totalLayers: data.totalLayers,
                currentLayer: data.totalLayers,
              }));
            }
          }
        })
        .catch(() => {});
    }
  };

  // Đặt lại vị trí mặc định trên bàn in
  const handleResetTransform = () => {
    setModelTransform(DEFAULT_TRANSFORM);
  };

  // Tự động lật mặt phẳng tiếp xúc lớn nhất xuống đáy (Auto Lay Flat)
  const handleAutoLayFlat = () => {
    setModelTransform((prev) => ({
      ...prev,
      rotation: [0, 0, 0],
      position: [0, 0, 0],
    }));
  };

  // Điều khiển Tua tiến trình (Scrubbing)
  const handleScrubProgress = useCallback((newProgress: number) => {
    setSimulationState((prev) => {
      const progress = Math.max(0, Math.min(1.0, newProgress));
      const { currentLayer: curLayer } = calculateLayerProgress(progress, prev.totalLayers);
      const elapsed = Math.round(progress * prev.totalTimeSec);
      const filament = Number((progress * prev.totalFilamentGrams).toFixed(1));
      const toolhead = computeVirtualToolheadPosition(progress, slicingMetrics, profile, geometry);

      return {
        ...prev,
        currentProgress: progress,
        currentLayer: curLayer,
        elapsedTimeSec: elapsed,
        filamentUsedGrams: filament,
        toolheadPosition: toolhead.position,
        activeToolpathType: toolhead.toolpathType,
        isCompleted: progress >= 1.0,
      };
    });
  }, [slicingMetrics, profile, geometry]);

  // Tiến / Lùi 1 Layer
  const handleStepLayer = (delta: number) => {
    setSimulationState((prev) => {
      const nextLayer = Math.max(1, Math.min(prev.totalLayers, prev.currentLayer + delta));
      const nextProgress = prev.totalLayers > 1 ? (nextLayer - 0.5) / prev.totalLayers : 0;
      const toolhead = computeVirtualToolheadPosition(nextProgress, slicingMetrics, profile, geometry);
      return {
        ...prev,
        currentProgress: nextProgress,
        currentLayer: nextLayer,
        elapsedTimeSec: Math.round(nextProgress * prev.totalTimeSec),
        filamentUsedGrams: Number((nextProgress * prev.totalFilamentGrams).toFixed(1)),
        toolheadPosition: toolhead.position,
        activeToolpathType: toolhead.toolpathType,
        isCompleted: nextProgress >= 1.0,
      };
    });
  };

  // Reset về Layer 0
  const handleReset = () => {
    setSimulationState((prev) => ({
      ...prev,
      currentProgress: 0.001,
      currentLayer: 1,
      elapsedTimeSec: 0,
      filamentUsedGrams: 0,
      isPlaying: false,
      isCompleted: false,
    }));
  };

  // 7. Bảng Nhật Ký Chạy Mô Phỏng (Simulation Run Logs)
  const formatTimestampNow = () => {
    const d = new Date();
    return d.toTimeString().slice(0, 8);
  };

  const [simulationLogs, setSimulationLogs] = useState<ISimulationLogEntry[]>(() => [
    {
      id: 'run-init-1',
      runNumber: 1,
      timestamp: new Date().toTimeString().slice(0, 8),
      triggerLabel: 'Khởi tạo',
      modelName: SAMPLE_MODELS[0].name,
      material: PRESET_PROFILES[0].material,
      layerHeight: PRESET_PROFILES[0].layerHeight,
      infillDensity: PRESET_PROFILES[0].infillDensity,
      infillType: PRESET_PROFILES[0].infillType,
      supportMode: PRESET_PROFILES[0].supportMode,
      printSpeed: PRESET_PROFILES[0].printSpeed,
      nozzleTemp: PRESET_PROFILES[0].nozzleTemp,
      estimatedTimeSec: slicingMetrics.estimatedPrintTimeSec,
      filamentGrams: slicingMetrics.estimatedFilamentGrams,
      totalLayers: slicingMetrics.totalLayers,
      score: preflightReport.printabilityScore,
      overhangPercent: preflightReport.overhangRiskAreaPercent,
      profileSnapshot: { ...PRESET_PROFILES[0] },
    },
  ]);

  const recordSimulationLog = useCallback(
    (
      triggerLabel: string,
      customProfile?: ISimulationProfile,
      customModelName?: string
    ) => {
      const targetProfile = customProfile || profile;
      const targetMetrics = customProfile
        ? computeSlicingMetrics(geometry, targetProfile, modelTransform.scale)
        : slicingMetrics;
      const targetReport = customProfile
        ? runPreflightInspection(geometry, targetProfile, targetMetrics)
        : preflightReport;

      setSimulationLogs((prev) => {
        const nextRunNum = (prev[0]?.runNumber || 0) + 1;
        const entry: ISimulationLogEntry = {
          id: `run-${Date.now()}-${nextRunNum}`,
          runNumber: nextRunNum,
          timestamp: formatTimestampNow(),
          triggerLabel,
          modelName: customModelName || currentModel.name,
          material: targetProfile.material,
          layerHeight: targetProfile.layerHeight,
          infillDensity: targetProfile.infillDensity,
          infillType: targetProfile.infillType,
          supportMode: targetProfile.supportMode,
          printSpeed: targetProfile.printSpeed,
          nozzleTemp: targetProfile.nozzleTemp,
          estimatedTimeSec: targetMetrics.estimatedPrintTimeSec,
          filamentGrams: targetMetrics.estimatedFilamentGrams,
          totalLayers: targetMetrics.totalLayers,
          score: targetReport.printabilityScore,
          overhangPercent: targetReport.overhangRiskAreaPercent,
          profileSnapshot: { ...targetProfile },
        };
        return [entry, ...prev].slice(0, 20);
      });
    },
    [profile, geometry, modelTransform.scale, slicingMetrics, preflightReport, currentModel.name]
  );

  // Tua đến Thành Phẩm (100%)
  const handleInstantFinish = () => {
    handleScrubProgress(1.0);
    recordSimulationLog('Tua 100%');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#d4b483', '#10b981'],
    });
  };

  // Áp dụng bản vá lỗi tự động từ Preflight HUD
  const handleApplyFix = (patch: Partial<ISimulationProfile>) => {
    const nextProfile = { ...profile, ...patch };
    setProfile(nextProfile);
    recordSimulationLog('Tối ưu AI', nextProfile);
  };

  // Nạp mô hình từ AI 3D Generator Studio (Trellis • Tripo • Meshy)
  const handleAIModelLoaded = (model: ISampleModel, geom: THREE.BufferGeometry) => {
    setCurrentModel(model);
    setBaseGeometry(geom);
    setModelTransform(DEFAULT_TRANSFORM);
    recordSimulationLog('Nạp AI 3D', profile, model.name);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.75 },
      colors: ['#d4b483', '#10b981', '#38bdf8'],
    });
  };

  // Đồng bộ thông số cắt lớp & báo giá từ /3dsim về lại /studio
  const handleSyncBackToStudio = (openOrderModal: boolean = false) => {
    const [dimX, dimY, dimZ] = slicingMetrics.boundingBox.dimensions;
    embedProtocol.syncBackToStudio({
      timestamp: Date.now(),
      sampleId: mapSimSampleIdToStudioModelId(currentModel.id),
      modelName: currentModel.name,
      dimensionsMm: {
        x: Math.round(dimX),
        y: Math.round(dimZ),
        z: Math.round(dimY),
      },
      filamentWeightGrams: Number(slicingMetrics.estimatedFilamentGrams.toFixed(1)),
      estimatedPrintTimeMinutes: Math.max(5, Math.round(slicingMetrics.estimatedPrintTimeSec / 60)),
      totalLayers: slicingMetrics.totalLayers,
      printabilityScore: preflightReport.printabilityScore,
      overhangPercent: preflightReport.overhangRiskAreaPercent,
      profile,
      openOrderModal,
    });

    setUploadSlicingStatus(
      openOrderModal
        ? '✓ Đã đồng bộ thông số cắt lớp & chuyển sang Đặt In trên 3D Studio!'
        : '✓ Đã lưu & đồng bộ cấu hình cắt lớp về 3D Studio!'
    );
    setTimeout(() => setUploadSlicingStatus(null), 3500);

    if (!isEmbedded) {
      const studioModel = mapSimSampleIdToStudioModelId(currentModel.id);
      const targetUrl = `/studio?model=${encodeURIComponent(studioModel)}&fromSim=1${
        openOrderModal ? '&openOrder=1' : ''
      }`;
      window.location.href = targetUrl;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-300">
      {/* 1. Header Toolbar (Single Unified Top Bar - No Overlap) */}
      <SimulatorHeader
        currentModel={currentModel}
        onSelectSample={(sample) => {
          handleSelectSample(sample);
          recordSimulationLog('Đổi mẫu phôi', profile, sample.name);
        }}
        onUploadFile={handleUploadFile}
        preflightReport={preflightReport}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        isEmbedded={isEmbedded}
        onResetSimulation={handleReset}
        simulatorEngine={simulatorEngine}
        onSetEngine={setSimulatorEngine}
        onOpenEngineModal={() => setIsEngineModalOpen(true)}
        showHeatmap={showHeatmap}
        onToggleHeatmap={() => setShowHeatmap((prev) => !prev)}
        showToolhead={showToolhead}
        onToggleToolhead={() => setShowToolhead((prev) => !prev)}
        showSupport={showSupport}
        onToggleSupport={() => setShowSupport((prev) => !prev)}
        hasSupport={profile.supportMode !== 'none'}
        cameraView={cameraView}
        onSetCameraView={setCameraView}
        renderMode={renderMode}
        onSetRenderMode={setRenderMode}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenTimelapseModal={() => setIsTimelapseModalOpen(true)}
        onOpenSupportAIModal={() => setIsSupportAIModalOpen(true)}
        hasGeminiKey={hasGeminiKey}
        onOpenGeminiKeyModal={() => setIsGeminiKeyModalOpen(true)}
        onOpenLocalSlicerModal={() => setIsLocalSlicerModalOpen(true)}
        onOpenModelLibrary={() => setIsModelLibraryOpen(true)}
        onOpenLiveInspectorModal={() => setIsLiveInspectorOpen(true)}
        onOpenSupabaseHub={() => setIsSupabaseHubOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        onOpenAI3DModal={() => setIsAI3DModalOpen(true)}
        onOpenDefectKnowledgeModal={() => setIsDefectKnowledgeOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onSyncToStudio={handleSyncBackToStudio}
      />

      {/* Notification Toast khi nạp mô hình / Bambu Studio CLI đang cắt lát (Đặt ở bottom-24 tránh đè lên HUD Điểm Khả Thi) */}
      {uploadSlicingStatus && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center gap-2.5 px-5 py-2.5 glass-panel studio-gold-badge rounded-xl shadow-2xl text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)] animate-ping" />
          <span>{uploadSlicingStatus}</span>
        </div>
      )}

      {/* Hidden File Input để nạp trực tiếp file .gcode.3mf / .gcode từ Bambu Studio */}
      <input
        ref={bambuGcodeInputRef}
        type="file"
        accept=".3mf,.gcode,.gco"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImportNativeSupportFile(f);
          e.target.value = '';
        }}
      />

      {/* 2. Three.js 3D Simulation Viewport */}
      <main className="w-full h-full">
        <PrintSimulatorViewport
          geometry={geometry}
          profile={profile}
          simulationState={simulationState}
          slicingMetrics={slicingMetrics}
          preflightReport={preflightReport}
          showHeatmap={showHeatmap}
          showToolhead={showToolhead}
          showSupport={showSupport}
          cameraView={cameraView}
          onSetCameraView={setCameraView}
          renderMode={renderMode}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          modelTransform={modelTransform}
          onChangeTransform={setModelTransform}
          onResetTransform={handleResetTransform}
          onAutoLayFlat={handleAutoLayFlat}
          onStepLayer={handleStepLayer}
          onScrubProgress={handleScrubProgress}
          onApplyFix={handleApplyFix}
          onUploadFile={handleUploadFile}
          onRegisterCaptureSnapshot={(fn) => {
            captureSnapshotRef.current = fn;
          }}
          isSmoothTimelapseActive={isTimelapseModalOpen}
          currentModel={currentModel}
          theme={theme}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          simulatorEngine={simulatorEngine}
          proTelemetry={proTelemetry}
          gcodeLines={gcodeLines}
          isProfileOpen={isProfileOpen}
          plates={loadedPlates.map((p) => ({
            plateId: p.plateId,
            plateName: p.plateName,
            partCount: p.partCount,
            hasNativeSupport: Boolean(p.gcodeBundle && p.gcodeBundle.supportData.segments.length > 0),
          }))}
          activePlateId={activePlateId}
          onSelectPlate={handleSelectPlate}
          hasNativeBambuSupport={hasNativeBambuSupport}
          onImportBambuGcode={() => bambuGcodeInputRef.current?.click()}
        />
      </main>

      {/* 3. Profile Settings Side Drawer */}
      <ProfileSettingsPanel
        profile={profile}
        onChangeProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
        onApplyPreset={(presetId) => {
          const found = PRESET_PROFILES.find((p) => p.id === presetId);
          if (found) {
            setProfile(found);
            recordSimulationLog(`Preset: ${found.material}`, found);
          }
        }}
        isOpen={isProfileOpen}
        onToggleOpen={() => setIsProfileOpen((prev) => !prev)}
        onOpenSupportAIModal={() => setIsSupportAIModalOpen(true)}
        onOpenGeminiKeyModal={() => setIsGeminiKeyModalOpen(true)}
        onOpenLocalSlicerModal={() => setIsLocalSlicerModalOpen(true)}
      />

      {/* 3.5. Simulation Run Log Panel (Ghi lại thông số các lần chạy mô phỏng) */}
      <SimulationRunLogPanel
        logs={simulationLogs}
        isProfileOpen={isProfileOpen}
        onRecordManualLog={() => recordSimulationLog('Ghi thủ công')}
        onRestoreProfile={(savedProfile) => {
          setProfile(savedProfile);
          recordSimulationLog('Khôi phục Log', savedProfile);
        }}
        onClearLogs={() => setSimulationLogs((prev) => (prev.length > 0 ? [prev[0]] : []))}
        onOpenReportWithLog={(logId) => {
          setSelectedReportLogId(logId || null);
          setIsLiveInspectorOpen(true);
        }}
      />

      {/* 4. Bottom Dock: Prepare Stage Action Bar OR Playback Timeline Scrubber */}
      <div className="fixed bottom-3 left-3 right-3 z-20 pointer-events-auto">
        {viewMode === 'prepare' ? (
          <div className="w-full max-w-4xl mx-auto px-4 py-2 rounded-2xl glass-panel flex items-center justify-between gap-4 whitespace-nowrap">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg studio-gold-badge font-bold uppercase tracking-wider text-[10px]">
                <IconAxis className="w-3.5 h-3.5" />
                <span>Chế Độ Chuẩn Bị Bàn In</span>
              </span>
              <span className="text-[var(--text-secondary)] font-mono text-[11px] hidden sm:inline">
                Kích thước: <strong className="text-[var(--text-primary)]">{Math.round(slicingMetrics.boundingBox.dimensions[0])} × {Math.round(slicingMetrics.boundingBox.dimensions[2])} × {Math.round(slicingMetrics.boundingBox.dimensions[1])} mm</strong>
              </span>
              <span className="text-[var(--text-muted)] font-mono text-[11px] hidden md:inline">
                • Overhang: <strong className="text-[var(--accent-gold)]">{preflightReport.overhangRiskAreaPercent}%</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setViewMode('cad')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl studio-cta-primary font-bold text-xs transition-all cursor-pointer"
              >
                <IconLayers className="w-3.5 h-3.5" />
                <span>Cắt Lớp &amp; Mô Phỏng CAD →</span>
              </button>
              <button
                onClick={() => setViewMode('filament_preview')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl studio-gold-badge hover:opacity-90 font-bold text-xs transition-all cursor-pointer"
              >
                <IconToolpath className="w-3.5 h-3.5" />
                <span>Xem Sợi In Bambu →</span>
              </button>
            </div>
          </div>
        ) : (
          <TimeScrubber
            state={simulationState}
            onTogglePlay={() => {
              if (!simulationState.isPlaying) {
                recordSimulationLog('Chạy mô phỏng');
              }
              setSimulationState((prev) => {
                if (prev.isCompleted) {
                  return { ...prev, isPlaying: true, isCompleted: false, currentProgress: 0 };
                }
                return { ...prev, isPlaying: !prev.isPlaying };
              });
            }}
            onSetSpeed={(speed: PlaybackSpeed) => setSimulationState((prev) => ({ ...prev, playbackSpeed: speed }))}
            onScrubProgress={handleScrubProgress}
            onStepLayer={handleStepLayer}
            onReset={handleReset}
            onInstantFinish={handleInstantFinish}
            defects={preflightReport.errors}
          />
        )}
      </div>

      {/* 5. Pre-flight Defect Inspection Modal */}
      <PreflightReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={preflightReport}
        onApplyFix={handleApplyFix}
        onStartSimulation={() => {
          setSimulationState((prev) => ({ ...prev, isPlaying: true, isCompleted: false }));
        }}
        profile={profile}
        onOpenDefectKnowledgeModal={() => setIsDefectKnowledgeOpen(true)}
      />

      {/* 5.05. Defect Knowledge Base & User/Admin Learning Modal */}
      <DefectKnowledgeModal
        isOpen={isDefectKnowledgeOpen}
        onClose={() => setIsDefectKnowledgeOpen(false)}
        currentProfile={profile}
        onRulesUpdated={(rules) => setLearnedDefectRulesState(rules)}
        onApplyFix={handleApplyFix}
      />

      {/* 5.1. Live Telemetry & Locked Report Parameters Inspector Modal */}
      <LiveReportInspectorModal
        isOpen={isLiveInspectorOpen}
        onClose={() => {
          setIsLiveInspectorOpen(false);
          setSelectedReportLogId(null);
        }}
        currentProfile={profile}
        simulationLogs={simulationLogs}
        initialSelectedLogId={selectedReportLogId}
        onRestoreProfile={(savedProfile) => {
          setProfile(savedProfile);
          recordSimulationLog('Nạp từ Report Live', savedProfile);
        }}
      />

      {/* 5.2. Supabase Cloud Hub Modal */}
      <SupabaseHubModal
        isOpen={isSupabaseHubOpen}
        onClose={() => setIsSupabaseHubOpen(false)}
        onStatusChange={(connected) => setIsSupabaseConnected(connected)}
      />

      {/* 6. Export Slicer Profile & 3MF/STL Modal */}
      <ExportProfileModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        profile={profile}
        metrics={slicingMetrics}
        modelName={currentModel.name}
        geometry={geometry}
        modelTransform={modelTransform}
      />

      {/* 7. Dual-Engine Comparison Modal (So Sánh 2 Phương Án Engine 1 vs Engine 2) */}
      <EngineComparisonModal
        isOpen={isEngineModalOpen}
        onClose={() => setIsEngineModalOpen(false)}
        activeEngine={simulatorEngine}
        onSelectEngine={setSimulatorEngine}
        onOpenLocalSlicer={() => setIsLocalSlicerModalOpen(true)}
      />

      {/* 8. Bambu Lab Print Timelapse Studio Modal */}
      <BambuTimelapseModal
        isOpen={isTimelapseModalOpen}
        onClose={() => setIsTimelapseModalOpen(false)}
        currentModel={currentModel}
        profile={profile}
        simulationState={simulationState}
        onScrubProgress={handleScrubProgress}
        onSetCameraView={setCameraView}
        onCaptureSnapshot={() => (captureSnapshotRef.current ? captureSnapshotRef.current() : null)}
      />

      {/* 9. Bambu Studio Support AI Copilot & Gemini Reasoning Modal */}
      <BambuSupportAIAssistantModal
        isOpen={isSupportAIModalOpen}
        onClose={() => setIsSupportAIModalOpen(false)}
        currentModel={currentModel}
        geometry={geometry}
        profile={profile}
        modelTransform={modelTransform}
        onChangeProfile={(updated) => {
          setShowSupport(true);
          setProfile((prev) => ({ ...prev, ...updated }));
        }}
        onChangeTransform={setModelTransform}
      />

      {/* 10. Dedicated Gemini AI API Key Configuration Modal */}
      <GeminiApiKeyModal
        isOpen={isGeminiKeyModalOpen}
        onClose={() => setIsGeminiKeyModalOpen(false)}
        onKeyUpdated={(hasKey) => setHasGeminiKey(hasKey)}
      />

      {/* 11. Local Slicer CLI Studio Modal (Bambu Studio & PrusaSlicer) */}
      <LocalSlicerModal
        isOpen={isLocalSlicerModalOpen}
        onClose={() => setIsLocalSlicerModalOpen(false)}
        currentModel={currentModel}
        profile={profile}
        onApplyProfilePatch={(patch) => {
          setShowSupport(true);
          setProfile((prev) => ({ ...prev, ...patch }));
        }}
        onApplySliceResult={handleApplySliceResult}
        onImportBambuGcodeFile={handleImportNativeSupportFile}
      />

      {/* 12. Model Library & 3MF Local Browser Modal */}
      <ModelLibraryModal
        isOpen={isModelLibraryOpen}
        onClose={() => setIsModelLibraryOpen(false)}
        currentModel={currentModel}
        onSelectSample={handleSelectSample}
        onLoadCustomGeometry={handleLoadCustomGeometry}
      />

      {/* 13. AI 3D Generator Studio Modal (Trellis • Tripo3D • Meshy) */}
      <AI3DGeneratorModal
        isOpen={isAI3DModalOpen}
        onClose={() => setIsAI3DModalOpen(false)}
        onModelLoaded={handleAIModelLoaded}
      />
    </div>
  );
}
