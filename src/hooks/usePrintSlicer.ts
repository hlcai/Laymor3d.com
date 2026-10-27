import { useState, useMemo, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { IPrinterProfile, ISupportConfig, IPrintEstimation } from '@/backend/domain/slicing';
import { STANDARD_PRINTER_PROFILES } from '@/backend/services/slicing/PrinterProfileService';
import { printSimulationEngine } from '@/backend/services/slicing/PrintSimulationEngine';
import { SAMPLE_PRINT_MODELS, SampleModelId, ISamplePrintModel } from '@/backend/domain/sample-models';
import { CustomModelLoader, ILoadedCustomModel } from '@/components/viewer/CustomModelLoader';

export function usePrintSlicer() {
  const printers = STANDARD_PRINTER_PROFILES;
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('bambu-x1c-p1s');

  const selectedPrinter = useMemo(() => {
    return printers.find(p => p.id === selectedPrinterId) || printers[0];
  }, [printers, selectedPrinterId]);

  // Model in mẫu mặc định (3D Benchy huyền thoại)
  const [selectedModelId, setSelectedModelId] = useState<SampleModelId>('benchy');

  // Custom 3D Model được tải lên từ máy tính
  const [customModel, setCustomModel] = useState<ILoadedCustomModel | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Kích thước thực tế mô hình (mm) - Khởi tạo theo 3D Benchy (60 x 31 x 48 mm)
  const [dimensionsMm, setDimensionsMm] = useState({ x: 60, y: 31, z: 48 });
  const [scalePercent, setScalePercent] = useState<number>(100);
  const [isUniformScale, setIsUniformScale] = useState<boolean>(true);

  // Cấu hình Support
  const [supportConfig, setSupportConfig] = useState<ISupportConfig>({
    enabled: true,
    type: 'tree',
    overhangThresholdDegrees: 50,
    supportDensityPercent: 15,
    interfaceLayers: 3,
  });

  // Layer Height (mm)
  const [layerHeightMm, setLayerHeightMm] = useState<number>(0.20);

  // Tính toán thông số in và kiểm tra khổ in
  const estimation: IPrintEstimation = useMemo(() => {
    return printSimulationEngine.calculateEstimation(
      selectedPrinter,
      dimensionsMm,
      supportConfig,
      layerHeightMm
    );
  }, [selectedPrinter, dimensionsMm, supportConfig, layerHeightMm]);

  // Trạng thái mô phỏng in 3D (Simulation)
  const [currentLayer, setCurrentLayer] = useState<number>(estimation.totalLayers);
  const [isPlayingSimulation, setIsPlayingSimulation] = useState<boolean>(false);

  // Đồng bộ lại currentLayer khi totalLayers thay đổi
  useEffect(() => {
    setCurrentLayer(estimation.totalLayers);
  }, [estimation.totalLayers]);

  // Vòng lặp mô phỏng in (Layer by Layer animation)
  useEffect(() => {
    if (!isPlayingSimulation) return;

    const interval = setInterval(() => {
      setCurrentLayer(prev => {
        if (prev >= estimation.totalLayers) {
          setIsPlayingSimulation(false);
          return estimation.totalLayers;
        }
        return prev + 1;
      });
    }, 35);

    return () => clearInterval(interval);
  }, [isPlayingSimulation, estimation.totalLayers]);

  // Actions
  const setPrinter = useCallback((id: string) => {
    setSelectedPrinterId(id);
  }, []);

  const loadSampleModel = useCallback((model: ISamplePrintModel) => {
    setCustomModel(null);
    setSelectedModelId(model.id);
    setDimensionsMm(model.defaultDimensionsMm);
    setScalePercent(100);
    setSupportConfig(prev => ({
      ...prev,
      enabled: model.recommendedSupport !== 'none',
      type: model.recommendedSupport === 'none' ? 'tree' : model.recommendedSupport,
    }));
  }, []);

  const loadCustomFile = useCallback(async (file: File, materialColor = '#6366f1') => {
    setIsLoadingFile(true);
    setFileError(null);
    try {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(materialColor),
        roughness: 0.35,
        metalness: 0.15,
        side: THREE.DoubleSide,
      });

      const loaded = await CustomModelLoader.loadFromFile(file, mat);
      setCustomModel(loaded);
      setSelectedModelId('custom');
      setDimensionsMm(loaded.dimensionsMm);
      setScalePercent(100);
      setSupportConfig(prev => ({
        ...prev,
        enabled: true,
        type: 'tree',
      }));
      return loaded;
    } catch (err: any) {
      console.error('Lỗi khi nạp file 3D:', err);
      let userMsg = err.message || 'Không thể đọc file 3D';
      if (userMsg.includes('ThreeMFLoader') || userMsg.includes('relationship') || userMsg.includes('rels') || userMsg.includes('3MF')) {
        userMsg = 'File 3MF không đúng cấu trúc chuẩn hoặc bị lỗi giải nén. Hãy thử xuất lại file dưới dạng .STL tiêu chuẩn hoặc .3MF từ Bambu Studio / OrcaSlicer.';
      } else if (userMsg.includes('STLLoader') || userMsg.includes('STL')) {
        userMsg = 'File STL bị lỗi cấu trúc dữ liệu lưới in. Vui lòng kiểm tra lại file thiết kế.';
      }
      setFileError(userMsg);
      return null;
    } finally {
      setIsLoadingFile(false);
    }
  }, []);

  const loadCustomUrl = useCallback(async (url: string, fileName = 'FalAI_Trellis_Model.glb', materialColor = '#6366f1') => {
    setIsLoadingFile(true);
    setFileError(null);
    try {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(materialColor),
        roughness: 0.35,
        metalness: 0.15,
        side: THREE.DoubleSide,
      });

      const loaded = await CustomModelLoader.loadFromUrl(url, fileName, mat);
      setCustomModel(loaded);
      setSelectedModelId('custom');
      setDimensionsMm(loaded.dimensionsMm);
      setScalePercent(100);
      setSupportConfig(prev => ({
        ...prev,
        enabled: true,
        type: 'tree',
      }));
      return loaded;
    } catch (err: any) {
      console.error('Lỗi khi nạp mô hình AI từ URL:', err);
      setFileError(err.message || 'Không thể tải mô hình 3D từ AI');
      return null;
    } finally {
      setIsLoadingFile(false);
    }
  }, []);

  const clearFileError = useCallback(() => {
    setFileError(null);
  }, []);

  // Tự động ẩn thông báo lỗi sau 8 giây
  useEffect(() => {
    if (!fileError) return;
    const timer = setTimeout(() => {
      setFileError(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [fileError]);

  const clearCustomModel = useCallback(() => {
    setCustomModel(null);
    setSelectedModelId('benchy');
    setDimensionsMm({ x: 60, y: 31, z: 48 });
  }, []);

  const updateDimension = useCallback((axis: 'x' | 'y' | 'z', valueMm: number) => {
    const val = Math.max(5, valueMm);
    setDimensionsMm(prev => {
      if (isUniformScale) {
        const ratio = val / prev[axis];
        return {
          x: Math.round(prev.x * ratio),
          y: Math.round(prev.y * ratio),
          z: Math.round(prev.z * ratio),
        };
      }
      return { ...prev, [axis]: val };
    });
  }, [isUniformScale]);

  const updateScale = useCallback((percent: number) => {
    const clamped = Math.max(20, Math.min(300, percent));
    const factor = clamped / scalePercent;
    setScalePercent(clamped);
    setDimensionsMm(prev => ({
      x: Math.round(prev.x * factor),
      y: Math.round(prev.y * factor),
      z: Math.round(prev.z * factor),
    }));
  }, [scalePercent]);

  const updateSupport = useCallback((patch: Partial<ISupportConfig>) => {
    setSupportConfig(prev => ({ ...prev, ...patch }));
  }, []);

  const playSimulation = useCallback(() => {
    if (currentLayer >= estimation.totalLayers) {
      setCurrentLayer(1);
    }
    setIsPlayingSimulation(true);
  }, [currentLayer, estimation.totalLayers]);

  const pauseSimulation = useCallback(() => {
    setIsPlayingSimulation(false);
  }, []);

  const resetSimulation = useCallback(() => {
    setIsPlayingSimulation(false);
    setCurrentLayer(estimation.totalLayers);
  }, [estimation.totalLayers]);

  const seekLayer = useCallback((layer: number) => {
    setCurrentLayer(Math.max(1, Math.min(estimation.totalLayers, layer)));
  }, [estimation.totalLayers]);

  return {
    printers,
    selectedPrinter,
    setPrinter,
    sampleModels: SAMPLE_PRINT_MODELS,
    selectedModelId,
    loadSampleModel,
    customModel,
    isLoadingFile,
    fileError,
    clearFileError,
    loadCustomFile,
    loadCustomUrl,
    clearCustomModel,
    dimensionsMm,
    updateDimension,
    scalePercent,
    updateScale,
    isUniformScale,
    setIsUniformScale,
    supportConfig,
    updateSupport,
    layerHeightMm,
    setLayerHeightMm,
    estimation,
    currentLayer,
    simulationProgressPercent: Math.round((currentLayer / (estimation.totalLayers || 1)) * 100),
    isPlayingSimulation,
    playSimulation,
    pauseSimulation,
    resetSimulation,
    seekLayer,
  };
}
