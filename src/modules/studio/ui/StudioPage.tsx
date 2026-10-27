'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Wand2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Sliders,
  Printer,
  Layers,
  Box,
  Save,
  Store,
  Download,
  X,
  Tag,
  FileCheck,
  ExternalLink,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { use3DGenerator } from '@/hooks/use3DGenerator';
import { useModelViewer } from '@/hooks/useModelViewer';
import { usePrintSlicer } from '@/hooks/usePrintSlicer';
import { useUserWallet } from '@/hooks/useUserWallet';
import { ImageUploadZone } from '@/components/studio/ImageUploadZone';
import { EngineSelector } from '@/components/studio/EngineSelector';
import { GenerationProgress } from '@/components/studio/GenerationProgress';
import { PrinterSelector } from '@/components/studio/PrinterSelector';
import { DimensionsControl } from '@/components/studio/DimensionsControl';
import { SupportConfigPanel } from '@/components/studio/SupportConfigPanel';
import { PrintSimulationSlider } from '@/components/studio/PrintSimulationSlider';
import { SampleModelSelector } from '@/components/studio/SampleModelSelector';
import { ExpertProfileCard } from '@/components/studio/ExpertProfileCard';
import { PrintCostCalculatorComponent } from '@/components/studio/PrintCostCalculator';
import { TopUpModal } from '@/components/wallet/TopUpModal';
import { ThreeCanvasViewer } from '@/components/viewer/ThreeCanvasViewer';
import { ViewerToolbar } from '@/components/viewer/ViewerToolbar';
import { PresetGeneratorService } from '@/backend/services/slicing/PresetGeneratorService';
import Link from 'next/link';
import { OrderServiceModal } from '@/components/shop/OrderServiceModal';
import { SAMPLE_PRINT_MODELS, SampleModelId } from '@/backend/domain/sample-models';

function StudioInner() {
  const searchParams = useSearchParams();

  // 🟦 TẦNG 2: HOOK (CẦU NỐI ĐIỀU PHỐI)
  const {
    isGenerating,
    progress,
    currentStep,
    activeJob,
    error,
    selectedEngine,
    setEngine,
    generate3D,
    reset,
  } = use3DGenerator();

  const {
    options: viewerOptions,
    toggleWireframe,
    toggleAutoRotate,
    toggleGrid,
    toggleDimensions,
    toggleViewMode,
    setOrientationDeg,
    rotateStep,
    setMaterialColor,
    setLightingIntensity,
  } = useModelViewer('#6366f1');

  // Hook quản lý máy in, kích thước, support, mô hình mẫu và mô phỏng in 3D
  const {
    printers,
    selectedPrinter,
    setPrinter,
    selectedModelId,
    loadSampleModel,
    dimensionsMm,
    updateDimension,
    scalePercent,
    updateScale,
    isUniformScale,
    setIsUniformScale,
    supportConfig,
    updateSupport,
    estimation,
    currentLayer,
    simulationProgressPercent,
    isPlayingSimulation,
    playSimulation,
    pauseSimulation,
    resetSimulation,
    seekLayer,
    customModel,
    isLoadingFile,
    fileError,
    clearFileError,
    loadCustomFile,
    loadCustomUrl,
    clearCustomModel,
  } = usePrintSlicer();

  // Hook ví tiền & mở khóa Profile In Pro (1.000 VNĐ)
  const {
    balanceVnd,
    isModelUnlocked,
    unlockProfile,
    lockProfile,
    topUpBalance,
    getProfile,
    isTopUpModalOpen,
    setIsTopUpModalOpen,
    isUnlocking,
    toastMessage,
  } = useUserWallet();

  const [activeTab, setActiveTab] = useState<'ai' | 'slicer'>('slicer');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>('');
  const [studioToast, setStudioToast] = useState<string | null>(null);
  const [isOrderServiceModalOpen, setIsOrderServiceModalOpen] = useState(false);

  // Tích hợp sâu với 3D Print Simulator (/3dsim)
  const [viewportEngine, setViewportEngine] = useState<'studio' | 'printsim_pro'>('studio');
  const simIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [simLiveMetrics, setSimLiveMetrics] = useState<{
    printabilityScore: number;
    overhangPercent: number;
    filamentWeightGrams?: number;
    estimatedPrintTimeMinutes?: number;
    material?: string;
  } | null>(null);

  // Giai đoạn 2: Vault Tệp 3D & Bán Marketplace 1-Click
  const [isSavingVault, setIsSavingVault] = useState(false);
  const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState(false);
  const [marketplacePriceVnd, setMarketplacePriceVnd] = useState(45000);
  const [marketplaceDescription, setMarketplaceDescription] = useState('Mô hình 3D bản quyền tối ưu góc in từ 3D Studio.');
  const [isSubmittingMarketplace, setIsSubmittingMarketplace] = useState(false);

  const showStudioToast = (msg: string) => {
    setStudioToast(msg);
    setTimeout(() => setStudioToast(null), 4500);
  };

  const handleSaveToVault = async () => {
    setIsSavingVault(true);
    try {
      const currentName = customModel
        ? customModel.fileName
        : (SAMPLE_PRINT_MODELS.find(m => m.id === selectedModelId)?.name || 'Mô hình AI 3D');

      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'user_assets',
          subAction: 'add',
          assetData: {
            name: currentName,
            format: 'STL',
            fileUrl: '/models/sample.stl',
            fileSizeMb: Number((estimation.filamentWeightGrams * 0.15).toFixed(1)) || 8.5,
            previewUrl: '/thumbnails/dragon.svg',
            tags: ['AI Generated', 'Studio 3D', selectedPrinter.name],
            category: 'Art & Figures',
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showStudioToast('🎉 Đã lưu mô hình vào Vault cá nhân! Bạn có thể xem tại trang Profile.');
      } else {
        showStudioToast(data.error || 'Không thể lưu vào Vault');
      }
    } catch (err: any) {
      showStudioToast(err.message || 'Lỗi mạng khi lưu Vault');
    } finally {
      setIsSavingVault(false);
    }
  };

  const handlePublishToMarketplace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMarketplace(true);
    try {
      const currentName = customModel
        ? customModel.fileName
        : (SAMPLE_PRINT_MODELS.find(m => m.id === selectedModelId)?.name || 'Mô hình AI 3D');

      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_seller_product',
          productType: 'model',
          productData: {
            title: currentName,
            name: currentName,
            category: 'Art & Figures',
            priceVnd: Number(marketplacePriceVnd),
            isFree: Number(marketplacePriceVnd) === 0,
            thumbnailUrl: '/thumbnails/dragon.svg',
            fileUrl: '/models/sample.stl',
            formats: ['.STL', '.3MF'],
            description: marketplaceDescription || 'Mô hình 3D bản quyền tối ưu góc in từ 3D Studio.',
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showStudioToast('🎉 ' + data.message);
        setIsMarketplaceModalOpen(false);
      } else {
        showStudioToast(data.error || 'Lỗi khi đăng bán');
      }
    } catch (err: any) {
      showStudioToast(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsSubmittingMarketplace(false);
    }
  };

  // Tự động nạp model nếu được chuyển từ trang Trends, Crawler, Shop hoặc từ /3dsim qua URL Query
  useEffect(() => {
    const modelParam = (searchParams.get('sampleModel') || searchParams.get('model')) as SampleModelId | null;
    if (modelParam) {
      const found = SAMPLE_PRINT_MODELS.find(m => m.id === modelParam);
      if (found) {
        loadSampleModel(found);
      }
    }

    // Kiểm tra dữ liệu đồng bộ ngược từ /3dsim
    if (searchParams.get('fromSim') === '1') {
      try {
        const raw = localStorage.getItem('laymor_3dsim_to_studio_sync_v1');
        if (raw) {
          const synced = JSON.parse(raw);
          if (synced && Date.now() - synced.timestamp < 10 * 60 * 1000) {
            setSimLiveMetrics({
              printabilityScore: synced.printabilityScore ?? 92,
              overhangPercent: synced.overhangPercent ?? 8,
              filamentWeightGrams: synced.filamentWeightGrams,
              estimatedPrintTimeMinutes: synced.estimatedPrintTimeMinutes,
              material: synced.profile?.material,
            });
            if (synced.profile?.supportMode) {
              updateSupport({
                enabled: synced.profile.supportMode !== 'none',
                type: synced.profile.supportMode === 'none' ? 'tree' : synced.profile.supportMode,
              });
            }
            showStudioToast(
              `🔗 Đã đồng bộ từ PrintSim PRO: ${synced.filamentWeightGrams}g nhựa • Điểm an toàn ${synced.printabilityScore}/100`
            );
            if (searchParams.get('openOrder') === '1' || synced.openOrderModal) {
              setIsOrderServiceModalOpen(true);
            }
          }
        }
      } catch (_) {}
    }
  }, [searchParams, loadSampleModel, updateSupport]);

  // Gửi dữ liệu mô hình & cấu hình cắt lớp hiện tại sang iframe /3dsim
  const syncStateToSimIframe = useCallback(
    (viewModeOverride?: 'prepare' | 'cad' | 'filament_preview') => {
      const win = simIframeRef.current?.contentWindow;
      if (!win) return;

      const currentName = customModel
        ? customModel.fileName
        : SAMPLE_PRINT_MODELS.find((m) => m.id === selectedModelId)?.name || '3D Benchy';

      let stlBuffer: ArrayBuffer | undefined;
      if (customModel?.group || !['benchy', 'dragon', 'gear'].includes(selectedModelId)) {
        try {
          stlBuffer = PresetGeneratorService.generateSTLBuffer(
            currentName,
            dimensionsMm,
            customModel?.group
          );
        } catch (_) {}
      }

      win.postMessage(
        {
          source: '3D_STUDIO',
          type: 'SYNC_FROM_STUDIO',
          data: {
            sampleId: selectedModelId,
            modelName: currentName,
            stlBuffer,
            scale: Math.max(0.2, Math.min(3.0, scalePercent / 100)),
            viewMode: viewModeOverride,
            profile: {
              materialColor: viewerOptions.materialColor,
              supportMode: supportConfig.enabled ? supportConfig.type : 'none',
              supportAngleThreshold: supportConfig.overhangThresholdDegrees,
              supportInterfaceLayers: supportConfig.interfaceLayers,
            },
          },
        },
        '*'
      );
    },
    [customModel, selectedModelId, dimensionsMm, scalePercent, viewerOptions.materialColor, supportConfig]
  );

  // Tự động đẩy thay đổi cấu hình xuống iframe /3dsim khi đang ở chế độ nhúng
  useEffect(() => {
    if (viewportEngine === 'printsim_pro') {
      syncStateToSimIframe();
    }
  }, [viewportEngine, syncStateToSimIframe]);

  // Lắng nghe sự kiện trả về từ iframe /3dsim (SIMULATOR_READY, SIMULATOR_REPORT, SIMULATOR_APPLY_TO_STUDIO)
  useEffect(() => {
    const handleSimMessage = (e: MessageEvent) => {
      if (!e.data || e.data.source !== '3D_PRINT_SIMULATOR') return;
      const { type, data } = e.data;

      if (type === 'SIMULATOR_READY') {
        syncStateToSimIframe();
      } else if (type === 'SIMULATOR_REPORT' && data) {
        setSimLiveMetrics((prev) => ({
          ...prev,
          printabilityScore: data.printabilityScore ?? 90,
          overhangPercent: data.overhangRiskAreaPercent ?? 10,
          estimatedPrintTimeMinutes: data.estimatedPrintTimeMinutes ?? prev?.estimatedPrintTimeMinutes,
        }));
      } else if (type === 'SIMULATOR_APPLY_TO_STUDIO' && data) {
        setSimLiveMetrics({
          printabilityScore: data.printabilityScore ?? 92,
          overhangPercent: data.overhangPercent ?? 8,
          filamentWeightGrams: data.filamentWeightGrams,
          estimatedPrintTimeMinutes: data.estimatedPrintTimeMinutes,
          material: data.profile?.material,
        });
        if (data.profile?.supportMode) {
          updateSupport({
            enabled: data.profile.supportMode !== 'none',
            type: data.profile.supportMode === 'none' ? 'tree' : data.profile.supportMode,
          });
        }
        showStudioToast(
          `✅ Đã áp dụng thông số từ PrintSim PRO (${data.filamentWeightGrams}g • ${data.estimatedPrintTimeMinutes} phút)!`
        );
        if (data.openOrderModal) {
          setIsOrderServiceModalOpen(true);
        }
      }
    };

    window.addEventListener('message', handleSimMessage);
    return () => window.removeEventListener('message', handleSimMessage);
  }, [syncStateToSimIframe, updateSupport]);

  // Mở toàn màn hình /3dsim kèm truyền toàn bộ dữ liệu mô hình (kể cả STL custom) và cấu hình
  const handleLaunchFullSimulator = (initialViewMode: 'cad' | 'filament_preview' = 'cad') => {
    const currentName = customModel
      ? customModel.fileName
      : SAMPLE_PRINT_MODELS.find((m) => m.id === selectedModelId)?.name || '3D Benchy';

    let stlBase64: string | undefined;
    if (customModel?.group || !['benchy', 'dragon', 'gear'].includes(selectedModelId)) {
      try {
        const buf = PresetGeneratorService.generateSTLBuffer(
          currentName,
          dimensionsMm,
          customModel?.group
        );
        if (buf.byteLength < 3.5 * 1024 * 1024) {
          const bytes = new Uint8Array(buf);
          let binary = '';
          const chunkSize = 0x8000;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(
              null,
              Array.from(bytes.subarray(i, i + chunkSize))
            );
          }
          stlBase64 = btoa(binary);
        }
      } catch (_) {}
    }

    const supportParam = supportConfig.enabled ? supportConfig.type : 'none';
    try {
      localStorage.setItem(
        'laymor_studio_to_3dsim_sync_v1',
        JSON.stringify({
          timestamp: Date.now(),
          sampleId: selectedModelId,
          modelName: currentName,
          stlBase64,
          dimensionsMm,
          scalePercent,
          viewMode: initialViewMode,
          printerName: selectedPrinter.name,
          profile: {
            materialColor: viewerOptions.materialColor,
            supportMode: supportParam,
            supportAngleThreshold: supportConfig.overhangThresholdDegrees,
            supportInterfaceLayers: supportConfig.interfaceLayers,
          },
        })
      );
    } catch (_) {}

    const params = new URLSearchParams({
      model: selectedModelId,
      support: supportParam,
      color: viewerOptions.materialColor,
      scale: String(scalePercent),
      viewMode: initialViewMode,
    });
    window.location.href = `/3dsim?${params.toString()}`;
  };

  const handleDropCustomFile = async (file: File) => {
    const loaded = await loadCustomFile(file, viewerOptions.materialColor);
    if (loaded) {
      showStudioToast(`🎉 Đã nạp "${loaded.fileName}" (${loaded.dimensionsMm.x}×${loaded.dimensionsMm.y}×${loaded.dimensionsMm.z} mm, ${loaded.volumeCm3} cm³)!`);
    }
  };

  const currentExpertProfile = getProfile(selectedModelId);
  const isProfileUnlocked = isModelUnlocked(selectedModelId);

  const handleStartGeneration = async () => {
    if (!selectedImage) return;
    const job = await generate3D(selectedImage, promptText);
    if (job?.resultGlbUrl) {
      const loaded = await loadCustomUrl(job.resultGlbUrl, `AI_${selectedEngine}_Model.glb`, viewerOptions.materialColor);
      if (loaded) {
        showStudioToast(`🎉 Đã tạo & chuẩn hóa khổ in (${loaded.dimensionsMm.x}×${loaded.dimensionsMm.y}×${loaded.dimensionsMm.z} mm)!`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Bar */}
      <div className="vision-glass-panel rounded-[32px] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/90 bg-white/85 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0 shadow-xs">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              3D Studio &amp; Slicer Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Trung tâm chuẩn bị bản in: Căn chỉnh khổ máy, mô phỏng cắt lớp in FDM và cấu hình Tree Support
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {simLiveMetrics && (
            <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Printability: {simLiveMetrics.printabilityScore}/100 • Overhang {simLiveMetrics.overhangPercent}%
              </span>
            </span>
          )}

          <button
            type="button"
            onClick={() => handleLaunchFullSimulator('filament_preview')}
            className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            title="Mở trình mô phỏng G-Code, Conformal Tree Support & Sợi In Bambu toàn màn hình"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Mở 3D Simulator PRO (G-Code &amp; Sợi In)</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </button>

          {/* Quick Engine Indicator */}
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>AI: Fal.ai Trellis Engine</span>
          </span>
        </div>
      </div>

      {/* SAMPLE MODEL PRESETS BAR (Nạp sẵn mô hình in mẫu 1-click) */}
      <SampleModelSelector
        selectedModelId={selectedModelId}
        onSelectModel={loadSampleModel}
      />

      {/* Main Studio Grid: Left Configuration (5 cols) vs Right 3D Viewport (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Tabbed Controls (AI Creation vs Slicer & Support Prefs) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Navigation Tabs between Slicer Settings and AI Studio */}
          <div className="flex rounded-full bg-slate-100 p-1.5 border border-slate-200 backdrop-blur-xl">
            <button
              onClick={() => setActiveTab('slicer')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'slicer'
                  ? 'bg-white text-cyan-900 shadow-sm border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>1. Khổ Máy &amp; Support In</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'ai'
                  ? 'bg-white text-cyan-900 shadow-sm border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>2. AI Tạo 3D Từ Ảnh</span>
            </button>
          </div>

          {/* TAB 1: PRINTER SELECTION, DIMENSIONS, & SUPPORT PREFERENCES */}
          {activeTab === 'slicer' && (
            <div className="space-y-4">
              {/* Printer Profile Preset */}
              <PrinterSelector
                printers={printers}
                selectedPrinter={selectedPrinter}
                onSelectPrinter={setPrinter}
              />

              {/* Dimensions X, Y, Z and Scale */}
              <DimensionsControl
                dimensionsMm={dimensionsMm}
                onUpdateDimension={updateDimension}
                scalePercent={scalePercent}
                onUpdateScale={updateScale}
                isUniformScale={isUniformScale}
                onToggleUniformScale={() => setIsUniformScale(!isUniformScale)}
                selectedPrinter={selectedPrinter}
                estimation={estimation}
              />

              {/* Support Configuration & AI Recommendations */}
              <SupportConfigPanel
                supportConfig={supportConfig}
                onUpdateSupport={updateSupport}
                estimation={estimation}
                selectedModelId={selectedModelId}
              />

              {/* Business Pricing & Production Cost Breakdown */}
              <PrintCostCalculatorComponent
                filamentType={currentExpertProfile.filamentType}
                filamentWeightGrams={estimation.filamentWeightGrams}
                printTimeMinutes={estimation.estimatedPrintTimeMinutes}
                supportConfig={supportConfig}
                printerWattage={selectedPrinter.bedDimensions.x > 250 ? 350 : 180}
              />
            </div>
          )}

          {/* TAB 2: AI GENERATION */}
          {activeTab === 'ai' && (
            <div className="space-y-4 vision-glass rounded-[32px] p-5 sm:p-6 shadow-xs border border-slate-200/90 bg-white/85">
              {/* Step 1: Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 px-0.5">
                  Tải Lên Ảnh 2D Cần Dựng 3D:
                </label>
                <ImageUploadZone
                  onImageSelected={(img) => setSelectedImage(img)}
                  disabled={isGenerating}
                />
              </div>

              {/* Step 2: Prompt Assistance */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between px-0.5">
                  <span>Ghi Chú Mô Tả Chi Tiết:</span>
                  <span className="text-[11px] font-bold text-cyan-700 flex items-center gap-1">
                    <Wand2 className="w-3 h-3" /> Tự động Watertight
                  </span>
                </label>
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  disabled={isGenerating}
                  placeholder="VD: Cấu trúc cơ khí, độ dày thành 2mm, không cần support..."
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-xs"
                />
              </div>

              {/* Step 3: Engine Selector */}
              <EngineSelector
                selectedEngine={selectedEngine}
                onSelectEngine={setEngine}
                disabled={isGenerating}
              />

              {/* Step 4: Generate Action Button */}
              <div className="pt-1">
                <button
                  onClick={handleStartGeneration}
                  disabled={!selectedImage || isGenerating}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all shadow-sm active:scale-[0.98] ${
                    !selectedImage || isGenerating
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white shadow-md'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>{isGenerating ? 'Đang Dựng 3D...' : 'Bắt Đầu Tạo Mô Hình 3D'}</span>
                </button>
              </div>

              {/* Progress Indicator */}
              {isGenerating && (
                <GenerationProgress progress={progress} currentStep={currentStep} />
              )}

              {/* Error Notice */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs flex items-center gap-2 backdrop-blur-md">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Status */}
              {activeJob && !isGenerating && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs flex items-center justify-between backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-300" />
                    <span>Đã tạo xong! Chuyển tab &quot;Khổ Máy &amp; Support&quot; để căn chỉnh in!</span>
                  </div>
                  <button onClick={reset} className="text-white/60 hover:text-white" title="Làm mới">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: 3D WebGL Canvas & Slicing Simulation Slider */}
        <div className="lg:col-span-7 space-y-4">
          {/* Dual Viewport Switcher Bar: 3D Studio Chuẩn vs PrintSim PRO Nhúng Trực Tiếp */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewportEngine('studio')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewportEngine === 'studio'
                    ? 'bg-white text-cyan-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Box className="w-3.5 h-3.5 text-cyan-600" />
                <span>Khung Xem 3D Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setViewportEngine('printsim_pro')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewportEngine === 'printsim_pro'
                    ? 'bg-slate-900 text-amber-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>PrintSim PRO Nhúng (Tree Support &amp; Sợi In)</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {viewportEngine === 'printsim_pro' && (
                <button
                  type="button"
                  onClick={() => syncStateToSimIframe('filament_preview')}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold transition-all cursor-pointer"
                >
                  Xem Sợi In Bambu
                </button>
              )}
              <button
                type="button"
                onClick={() => handleLaunchFullSimulator('cad')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 text-[11px] font-bold transition-all cursor-pointer"
                title="Mở 3D Print Simulator toàn màn hình với toàn bộ thông số hiện tại"
              >
                <span>Toàn Màn Hình /3dsim</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Three.js Canvas Container OR Embedded PrintSim PRO Iframe */}
          {viewportEngine === 'studio' ? (
            <>
              <div className="relative rounded-[32px] overflow-hidden border border-white/15 shadow-2xl bg-black/60">
                <ThreeCanvasViewer
                  options={viewerOptions}
                  modelUrl={activeJob?.resultGlbUrl}
                  printer={selectedPrinter}
                  dimensionsMm={dimensionsMm}
                  supportConfig={supportConfig}
                  currentLayer={currentLayer}
                  totalLayers={estimation.totalLayers}
                  sampleModelId={selectedModelId}
                  customLoadedModel={customModel}
                  onDropFile={handleDropCustomFile}
                  onClearCustomModel={clearCustomModel}
                  className="h-[480px]"
                />
              </div>

              {/* Interactive Toolbar below Canvas (With Slicer Toolpath Mode & Auto-Orientation) */}
              <ViewerToolbar
                options={viewerOptions}
                onToggleWireframe={toggleWireframe}
                onToggleAutoRotate={toggleAutoRotate}
                onToggleGrid={toggleGrid}
                onToggleDimensions={toggleDimensions}
                onToggleViewMode={toggleViewMode}
                onSetOrientation={setOrientationDeg}
                onRotateStep={rotateStep}
                onColorChange={setMaterialColor}
                onLightingChange={setLightingIntensity}
                onExportSTL={() =>
                  PresetGeneratorService.downloadSTL(
                    customModel ? customModel.fileName : selectedModelId,
                    dimensionsMm,
                    customModel?.group
                  )
                }
              />

              {/* Slicing Layer-by-Layer Simulation Slider with Stats */}
              <PrintSimulationSlider
                currentLayer={currentLayer}
                totalLayers={estimation.totalLayers}
                simulationProgressPercent={simulationProgressPercent}
                isPlayingSimulation={isPlayingSimulation}
                onPlay={playSimulation}
                onPause={pauseSimulation}
                onReset={resetSimulation}
                onSeek={seekLayer}
                estimation={estimation}
              />
            </>
          ) : (
            <div className="relative rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 h-[620px]">
              <iframe
                ref={simIframeRef}
                src={`/3dsim?embed=true&model=${encodeURIComponent(selectedModelId)}&support=${
                  supportConfig.enabled ? supportConfig.type : 'none'
                }&color=${encodeURIComponent(viewerOptions.materialColor)}`}
                title="3D Print Simulator PRO Embedded"
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* FAST CONVERSION & 3D ASSET LIFECYCLE ACTION BAR */}
          <div className="p-4 sm:p-5 rounded-[28px] vision-glass border border-slate-200/90 bg-white/90 shadow-xs flex flex-col gap-4">
            {/* Row 1: Đặt In 3D Trực Tiếp */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shadow-xs flex-shrink-0">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      Đặt In Dịch Vụ Mẫu Này Ngay
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                      Báo giá tức thì
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Ước tính: ~{simLiveMetrics?.filamentWeightGrams || estimation.filamentWeightGrams}g nhựa • Thời gian in: ~{Math.round(((simLiveMetrics?.estimatedPrintTimeMinutes || estimation.estimatedPrintTimeMinutes) / 60) * 10) / 10}h • Giao toàn quốc
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsOrderServiceModalOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Đặt In (Tạm Tính {Math.max(25000, Math.round((simLiveMetrics?.filamentWeightGrams || estimation.filamentWeightGrams) * 600 + Math.round((simLiveMetrics?.estimatedPrintTimeMinutes || estimation.estimatedPrintTimeMinutes) / 60) * 15000)).toLocaleString('vi-VN')} đ)</span>
                </button>

                <Link
                  href={`/shop?tab=services&modelName=${encodeURIComponent(customModel ? customModel.fileName : (SAMPLE_PRINT_MODELS.find(m => m.id === selectedModelId)?.name || '3D Benchy'))}&weight=${estimation.filamentWeightGrams}&dimX=${dimensionsMm.x}&dimY=${dimensionsMm.y}&dimZ=${dimensionsMm.z}`}
                  className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all whitespace-nowrap"
                  title="Tùy chỉnh cấu hình báo giá chi tiết tại Cửa Hàng 3D Hub"
                >
                  <span>Xem tại Shop →</span>
                </Link>
              </div>
            </div>

            {/* Row 2: Khép kín vòng đời tệp 3D: Lưu Vault, Đăng Bán Marketplace, Tải STL */}
            <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveToVault}
                  disabled={isSavingVault}
                  className="px-4 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-xs"
                >
                  <Save className={`w-3.5 h-3.5 ${isSavingVault ? 'animate-spin' : ''}`} />
                  <span>{isSavingVault ? 'Đang Lưu...' : 'Lưu Vào 3D Vault'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMarketplaceModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
                >
                  <Store className="w-3.5 h-3.5 text-amber-600" />
                  <span>Đưa Lên Bán Marketplace</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  PresetGeneratorService.downloadSTL(
                    customModel ? customModel.fileName : selectedModelId,
                    dimensionsMm,
                    customModel?.group
                  );
                  showStudioToast('📥 Đang tải tệp Binary STL chuẩn thực tế về thiết bị...');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải File (.STL)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ĐĂNG BÁN MÔ HÌNH LÊN MARKETPLACE 1-CLICK */}
      {isMarketplaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="vision-glass-panel rounded-[32px] p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 bg-white text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm sm:text-base">
                <Store className="w-5 h-5 text-amber-600" />
                <span>Đăng Bán Lên Marketplace 3D</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMarketplaceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishToMarketplace} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Tên Mô Hình 3D</label>
                <input
                  type="text"
                  disabled
                  value={customModel ? customModel.fileName : (SAMPLE_PRINT_MODELS.find(m => m.id === selectedModelId)?.name || 'Mô hình AI 3D')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Giá Bán Niêm Yết (VNĐ)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={marketplacePriceVnd}
                    onChange={(e) => setMarketplacePriceVnd(parseInt(e.target.value) || 0)}
                    placeholder="0 = Miễn phí"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-cyan-900 font-bold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                    {marketplacePriceVnd === 0 ? 'Miễn Phí' : 'VNĐ'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Khi khách mua: Sàn giữ 8% hoa hồng, 92% doanh thu chuyển vào ví của bạn.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Mô Tả Sản Phẩm</label>
                <textarea
                  rows={2}
                  value={marketplaceDescription}
                  onChange={(e) => setMarketplaceDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMarketplaceModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMarketplace}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold shadow-sm"
                >
                  {isSubmittingMarketplace ? 'Đang Gửi...' : 'Gửi Phê Duyệt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRO EXPERT PRINT PROFILE & SLICING GUIDE CARD (MỞ KHÓA 1.000 VNĐ & XUẤT .3MF) */}
      <section className="pt-2">
        <ExpertProfileCard
          profile={currentExpertProfile}
          isUnlocked={isProfileUnlocked}
          onUnlock={() => unlockProfile(selectedModelId)}
          onLock={() => lockProfile(selectedModelId)}
          isUnlocking={isUnlocking}
          userBalanceVnd={balanceVnd}
          onOpenTopUp={() => setIsTopUpModalOpen(true)}
          printer={selectedPrinter}
          dimensionsMm={dimensionsMm}
          supportConfig={supportConfig}
          customModelName={customModel ? customModel.fileName : (SAMPLE_PRINT_MODELS.find(m => m.id === selectedModelId)?.name || '3D Model')}
          volumeCm3={customModel?.volumeCm3}
          triangleCount={customModel?.triangleCount}
          customGroup={customModel?.group}
        />
      </section>

      {/* TopUp Modal */}
      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        currentBalanceVnd={balanceVnd}
        onTopUp={topUpBalance}
      />

      {/* Order Service Modal synced from 3D Studio & PrintSim PRO */}
      <OrderServiceModal
        isOpen={isOrderServiceModalOpen}
        onClose={() => setIsOrderServiceModalOpen(false)}
        initialFileName={customModel ? customModel.fileName : (SAMPLE_PRINT_MODELS.find(m => m.id === selectedModelId)?.name || '3D Benchy')}
        initialDimensions={dimensionsMm}
        initialWeightGrams={simLiveMetrics?.filamentWeightGrams || estimation.filamentWeightGrams}
        initialPrintHours={Math.round(((simLiveMetrics?.estimatedPrintTimeMinutes || estimation.estimatedPrintTimeMinutes) / 60) * 10) / 10}
        initialMaterial={simLiveMetrics?.material || 'PLA Basic'}
        initialCostVnd={Math.max(25000, Math.round((simLiveMetrics?.filamentWeightGrams || estimation.filamentWeightGrams) * 600 + Math.round((simLiveMetrics?.estimatedPrintTimeMinutes || estimation.estimatedPrintTimeMinutes) / 60) * 15000))}
        onShowToast={showStudioToast}
      />

      {/* Floating Toast Notification */}
      {(toastMessage || studioToast) && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-full bg-slate-900 border border-slate-700 shadow-2xl text-white text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span>{toastMessage || studioToast}</span>
        </div>
      )}

      {fileError && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-950/85 border border-rose-500/50 shadow-2xl backdrop-blur-2xl text-rose-200 text-xs font-medium max-w-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="flex-1 leading-relaxed">{fileError}</span>
          <button
            type="button"
            onClick={clearFileError}
            className="p-1 rounded-full text-rose-300 hover:text-white hover:bg-rose-500/20 transition-all shrink-0"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white/50">Đang chuẩn bị 3D Studio...</div>}>
      <StudioInner />
    </Suspense>
  );
}
