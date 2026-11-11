import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  IconCube,
  IconAxis,
  IconLayers,
  IconToolpath,
  IconNozzle,
  IconSupport,
  IconAngle,
  IconImport,
  IconExport,
  IconArchive,
  IconMeshGen,
  IconTerminal,
  IconCheckShield,
  IconSliders,
  IconKeyMinimal,
  IconAperture,
  IconSun,
  IconMoon,
  IconChevronDown,
  IconChevronLeft,
  User,
  LogIn,
} from '@/components/icons/MinimalIcons';
import {
  ISampleModel,
  IPreflightReport,
  SlicerRenderMode,
  SimulatorEngineType,
  ViewportDisplayMode,
} from '@/types/simulator';
import { SAMPLE_MODELS } from '@/services/sampleModels';
import { ILaymorUser } from '@/hooks/useLaymorAuth';

export interface IOrcaEngineHeaderStatus {
  active: boolean;
  ready: boolean;
  percent: number | null;
  label: string | null;
}

interface SimulatorHeaderProps {
  currentModel: ISampleModel;
  onSelectSample: (model: ISampleModel) => void;
  onUploadFile: (file: File) => void;
  preflightReport: IPreflightReport;
  onOpenReportModal: () => void;
  isEmbedded: boolean;
  onResetSimulation: () => void;
  simulatorEngine: SimulatorEngineType;
  onSetEngine: (engine: SimulatorEngineType) => void;
  onOpenEngineModal: () => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  showToolhead: boolean;
  onToggleToolhead: () => void;
  showSupport: boolean;
  onToggleSupport: () => void;
  hasSupport: boolean;
  cameraView: 'iso' | 'top' | 'front' | 'nozzle';
  onSetCameraView: (view: 'iso' | 'top' | 'front' | 'nozzle') => void;
  renderMode: SlicerRenderMode;
  onSetRenderMode: (mode: SlicerRenderMode) => void;
  viewMode: ViewportDisplayMode;
  onSetViewMode: (mode: ViewportDisplayMode) => void;
  onOpenExportModal: () => void;
  onOpenTimelapseModal: () => void;
  onOpenSupportAIModal: () => void;
  hasGeminiKey: boolean;
  onOpenGeminiKeyModal: () => void;
  onOpenLocalSlicerModal: () => void;
  onOpenModelLibrary?: () => void;
  onOpenLiveInspectorModal?: () => void;
  onOpenSupabaseHub?: () => void;
  isSupabaseConnected?: boolean;
  onOpenAI3DModal?: () => void;
  onOpenDefectKnowledgeModal?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onSyncToStudio?: (openOrderModal?: boolean) => void;
  currentUser?: ILaymorUser | null;
  onOpenAuthModal?: () => void;
  orcaStatus?: IOrcaEngineHeaderStatus;
}

export function SimulatorHeader({
  currentModel,
  onSelectSample,
  onUploadFile,
  preflightReport,
  onOpenReportModal,
  isEmbedded,
  simulatorEngine,
  onSetEngine,
  onOpenEngineModal,
  showHeatmap,
  onToggleHeatmap,
  showToolhead,
  onToggleToolhead,
  showSupport,
  onToggleSupport,
  hasSupport,
  renderMode,
  onSetRenderMode,
  viewMode,
  onSetViewMode,
  onOpenExportModal,
  onOpenTimelapseModal,
  onOpenSupportAIModal,
  hasGeminiKey,
  onOpenGeminiKeyModal,
  onOpenLocalSlicerModal,
  onOpenModelLibrary,
  onOpenLiveInspectorModal,
  onOpenSupabaseHub,
  isSupabaseConnected,
  onOpenAI3DModal,
  onOpenDefectKnowledgeModal,
  theme = 'light',
  onToggleTheme,
  onSyncToStudio,
  currentUser,
  onOpenAuthModal,
  orcaStatus,
}: SimulatorHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStudioMenuOpen, setIsStudioMenuOpen] = useState(false);
  const studioBtnRef = useRef<HTMLButtonElement>(null);
  const studioPopoverRef = useRef<HTMLDivElement>(null);
  const [studioMenuPos, setStudioMenuPos] = useState<{ top: number; left: number }>({
    top: 56,
    left: 16,
  });

  useEffect(() => {
    if (!isStudioMenuOpen) return;

    const updateMenuPosition = () => {
      const btn = studioBtnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const vw = window.innerWidth;
      const menuW = Math.min(336, vw - 24);
      const clampedLeft = Math.max(12, Math.min(vw - menuW - 12, rect.right - menuW));
      setStudioMenuPos({
        top: Math.max(48, Math.round(rect.bottom + 8)),
        left: Math.round(clampedLeft),
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isStudioMenuOpen]);

  useEffect(() => {
    if (!isStudioMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (studioBtnRef.current?.contains(target)) return;
      if (studioPopoverRef.current?.contains(target)) return;
      setIsStudioMenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsStudioMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStudioMenuOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  const renderModes: { id: SlicerRenderMode; label: string }[] = [
    { id: 'realistic', label: 'Vật Liệu PBR' },
    { id: 'features', label: 'Cấu Trúc Lớp' },
    { id: 'defects', label: 'Góc Overhang' },
    { id: 'speed', label: 'Lưu Lượng Đùn' },
  ];

  const studioDropdownPortal =
    isStudioMenuOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={studioPopoverRef}
            style={{
              top: `${studioMenuPos.top}px`,
              left: `${studioMenuPos.left}px`,
            }}
            className="fixed w-[min(336px,calc(100vw-24px))] max-h-[calc(100dvh-72px)] overflow-y-auto rounded-2xl studio-popover p-3 space-y-1.5 z-[220]"
          >
            <div className="px-1.5 pb-2 border-b studio-border flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest studio-text-muted">
                CÔNG CỤ KỸ THUẬT &amp; AI
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded studio-gold-badge font-semibold">
                ORCA C++ WASM
              </span>
            </div>

            {/* 1. Kiểm Định Preflight */}
            <button
              type="button"
              onClick={() => {
                setIsStudioMenuOpen(false);
                onOpenReportModal();
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg studio-gold-badge flex items-center justify-center shrink-0">
                  <IconCheckShield size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold studio-text-primary flex items-center gap-1.5">
                    <span>Báo Cáo Kiểm Định Bản In</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono studio-gold-badge">
                      {preflightReport.printabilityScore}/100
                    </span>
                  </div>
                  <div className="text-[10px] studio-text-secondary">
                    Chẩn đoán Overhang, Warping &amp; vá lỗi tự động
                  </div>
                </div>
              </div>
            </button>

            {/* 2. AI Print Consultant Copilot */}
            <button
              type="button"
              onClick={() => {
                setIsStudioMenuOpen(false);
                onOpenSupportAIModal();
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg studio-card flex items-center justify-center studio-text-gold shrink-0">
                  <IconAngle size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold studio-text-primary flex items-center gap-1.5">
                    <span>Chuyên Gia AI Tư Vấn In 3D</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono studio-gold-badge">
                      COPILOT
                    </span>
                  </div>
                  <div className="text-[10px] studio-text-secondary">
                    Tối ưu thông số Bambu • Chat AI • Chẩn đoán ảnh lỗi
                  </div>
                </div>
              </div>
            </button>

            {/* 3. AI 3D Mesh Synthesis */}
            {onOpenAI3DModal && (
              <button
                type="button"
                data-testid="ai-3d-generator-btn"
                onClick={() => {
                  setIsStudioMenuOpen(false);
                  onOpenAI3DModal();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg studio-card flex items-center justify-center studio-text-gold shrink-0">
                    <IconMeshGen size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold studio-text-primary">
                      Tạo Mô Hình 3D Bằng AI (Trellis / Tripo)
                    </div>
                    <div className="text-[10px] studio-text-secondary">
                      Sinh lưới 3D từ mô tả văn bản hoặc ảnh chụp
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* 4. Cloud / Local Slicer CLI */}
            <button
              type="button"
              onClick={() => {
                setIsStudioMenuOpen(false);
                onOpenLocalSlicerModal();
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg studio-card flex items-center justify-center studio-text-gold shrink-0">
                  <IconTerminal size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold studio-text-primary">
                    Nhập .gcode.3mf / Bambu Studio CLI
                  </div>
                  <div className="text-[10px] studio-text-secondary">
                    Nạp G-code gốc từ Bambu Studio hoặc chạy CLI nội bộ
                  </div>
                </div>
              </div>
            </button>

            {/* 5. Defect Knowledge Base */}
            {onOpenDefectKnowledgeModal && (
              <button
                type="button"
                data-testid="defect-knowledge-header-btn"
                onClick={() => {
                  setIsStudioMenuOpen(false);
                  onOpenDefectKnowledgeModal();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg studio-card flex items-center justify-center studio-text-gold shrink-0">
                    <IconCheckShield size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold studio-text-primary">
                      Dạy AI Lỗi Thực Tế &amp; Tri Thức
                    </div>
                    <div className="text-[10px] studio-text-secondary">
                      Đóng góp mẫu lỗi thực chiến &amp; quy tắc tự động vá
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* 6. Timelapse Studio */}
            <button
              type="button"
              onClick={() => {
                setIsStudioMenuOpen(false);
                onOpenTimelapseModal();
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg studio-card flex items-center justify-center studio-text-secondary shrink-0">
                  <IconAperture size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold studio-text-primary">
                    Bambu Timelapse Studio
                  </div>
                  <div className="text-[10px] studio-text-secondary">
                    Ghi hình Smooth Timelapse góc máy Purge Chute
                  </div>
                </div>
              </div>
            </button>

            {/* 7. Gemini API Key */}
            <button
              type="button"
              data-testid="gemini-key-modal-btn"
              onClick={() => {
                setIsStudioMenuOpen(false);
                onOpenGeminiKeyModal();
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg studio-card flex items-center justify-center studio-text-gold shrink-0">
                  <IconKeyMinimal size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold studio-text-primary flex items-center gap-2">
                    <span>Khóa Kết Nối Gemini API</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        hasGeminiKey
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          : 'studio-gold-badge'
                      }`}
                    >
                      {hasGeminiKey ? 'ĐÃ KẾT NỐI' : 'CHƯA CẤU HÌNH'}
                    </span>
                  </div>
                  <div className="text-[10px] studio-text-secondary">
                    Xác thực trợ lý suy luận AI đám mây
                  </div>
                </div>
              </div>
            </button>

            {/* 8. Live Telemetry & Supabase */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {onOpenLiveInspectorModal && (
                <button
                  type="button"
                  data-testid="report-live-header-btn"
                  onClick={() => {
                    setIsStudioMenuOpen(false);
                    onOpenLiveInspectorModal();
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl studio-card hover:bg-[var(--bg-hover)] text-[11px] font-semibold studio-text-primary cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] animate-pulse" />
                  <span>Report Live</span>
                </button>
              )}
              {onOpenSupabaseHub && (
                <button
                  type="button"
                  data-testid="supabase-hub-btn"
                  onClick={() => {
                    setIsStudioMenuOpen(false);
                    onOpenSupabaseHub();
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl studio-card hover:bg-[var(--bg-hover)] text-[11px] font-semibold studio-text-primary cursor-pointer"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSupabaseConnected ? 'bg-emerald-500' : 'bg-[var(--accent-gold)]'
                    }`}
                  />
                  <span>Supabase Hub</span>
                </button>
              )}
            </div>

            {/* 9. Dual-Engine Switcher */}
            <div className="pt-2 border-t studio-border space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-medium studio-text-secondary">
                  Nhân Mô Phỏng (Core Engine):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsStudioMenuOpen(false);
                    onOpenEngineModal();
                  }}
                  className="text-[10px] studio-text-gold hover:underline cursor-pointer"
                >
                  Chi tiết kiến trúc →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 studio-card p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => onSetEngine('wasm_client')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                    simulatorEngine === 'wasm_client'
                      ? 'studio-pill-active'
                      : 'studio-pill-inactive font-medium'
                  }`}
                >
                  <span>Orca C++ Wasm</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetEngine('pro_local')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                    simulatorEngine === 'pro_local'
                      ? 'studio-pill-active'
                      : 'studio-pill-inactive font-medium'
                  }`}
                >
                  <span>G-Code Telemetry</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <header className="relative z-30 shrink-0 w-full border-b studio-border bg-[var(--bg-panel)] backdrop-blur-xl px-2 sm:px-3 py-1.5 pt-[max(0.375rem,env(safe-area-inset-top,0px))]">
      <div className="flex flex-wrap xl:flex-nowrap items-center justify-between gap-x-2 gap-y-1.5">
        {/* =====================================================================
            1. CỤM TRÁI: NHẬN DIỆN LAYMOR & CHỌN / TẢI FILE 3D
           ===================================================================== */}
        <div className="order-1 flex items-center gap-1.5 min-w-0 shrink-0">
          <a
            href="/"
            target="_top"
            data-testid="back-to-3dhub-btn"
            aria-label="Quay về Trang chủ LAYMOR"
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl studio-card hover:border-[var(--border-strong)] transition-all cursor-pointer group shrink-0"
            title="Quay về Trang chủ LAYMOR"
          >
            <IconChevronLeft
              size={13}
              className="studio-text-secondary group-hover:-translate-x-0.5 transition-transform shrink-0"
            />
            <img
              src="/3dsim/brand/laymor-wordmark.png"
              width={78}
              height={17}
              style={{ height: '17px', maxHeight: '17px', width: 'auto' }}
              alt="LAYMOR"
              className="h-4 sm:h-[17px] w-auto object-contain select-none shrink-0 laymor-logo-adaptive"
            />
          </a>

          {!isEmbedded && onSyncToStudio && (
            <button
              type="button"
              onClick={() => onSyncToStudio(false)}
              aria-label="Quay về 3D Studio"
              className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-xl studio-card hover:border-[var(--accent-gold)] text-xs font-semibold studio-text-primary transition-all cursor-pointer shrink-0"
              title="Quay về trang 3D Studio cùng toàn bộ thông số cắt lớp hiện tại"
            >
              <span className="studio-text-gold font-bold">←</span>
              <span className="hidden 2xl:inline">Studio</span>
            </button>
          )}

          {/* Unified Model Selector + Library + Upload Bar */}
          <div className="flex items-center rounded-xl studio-card p-0.5 min-w-0">
            <div className="flex items-center gap-1.5 px-2 py-1 min-w-0">
              <IconCube size={13} className="studio-text-gold shrink-0 hidden sm:block" />
              <select
                value={currentModel.id}
                onChange={(e) => {
                  const found = SAMPLE_MODELS.find((m) => m.id === e.target.value);
                  if (found) onSelectSample(found);
                }}
                aria-label="Chọn phôi mô hình 3D"
                className="bg-transparent text-xs font-medium studio-text-primary focus:outline-none cursor-pointer max-w-[92px] sm:max-w-[116px] 2xl:max-w-[156px] truncate"
                title={`Mô hình hiện tại: ${currentModel.name}`}
              >
                {!SAMPLE_MODELS.some((m) => m.id === currentModel.id) && (
                  <option value={currentModel.id}>
                    {currentModel.name} ({currentModel.accentBadge})
                  </option>
                )}
                {SAMPLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.accentBadge})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-[1px] h-3.5 bg-[var(--border-hairline)] shrink-0" />

            {onOpenModelLibrary && (
              <button
                type="button"
                onClick={onOpenModelLibrary}
                aria-label="Thư viện phôi 3MF / STL"
                className="flex items-center gap-1 px-2 py-1 rounded-lg studio-pill-inactive text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                title="Mở kho mẫu 3MF / STL có sẵn"
              >
                <IconArchive size={12} />
                <span className="hidden md:inline xl:hidden 2xl:inline">Kho Mẫu</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".3mf,.gcode,.gco,.stl,.obj"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Tải file 3MF / STL / G-Code"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg studio-gold-badge text-[11px] font-semibold transition-all cursor-pointer ml-0.5 hover:opacity-85 shrink-0"
              title="Tải file .3MF, .STL, .OBJ hoặc .GCODE từ máy tính — Tự động cắt lớp & dựng Tree Support C++"
            >
              <IconImport size={12} />
              <span className="hidden sm:inline whitespace-nowrap">Tải File</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            2. CỤM GIỮA: QUY TRÌNH 3 BƯỚC RÕ RÀNG & CHẾ ĐỘ HIỂN THỊ KHUNG NHÌN
           ===================================================================== */}
        <div className="order-3 xl:order-2 w-full xl:w-auto flex items-center justify-between sm:justify-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5 xl:pt-0 border-t xl:border-t-0 studio-border min-w-0">
          {/* 3-Step Guided Workflow Switcher */}
          <div className="flex items-center p-0.5 rounded-xl studio-card shrink-0">
            <button
              type="button"
              data-testid="view-mode-prepare-btn"
              onClick={() => onSetViewMode('prepare')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'prepare' ? 'studio-pill-active' : 'studio-pill-inactive font-medium'
              }`}
              title="Bước 1: Định vị, Xoay góc & Phóng to/thu nhỏ phôi trên bàn in"
            >
              <IconAxis size={12} />
              <span>1. Chuẩn Bị</span>
            </button>

            <button
              type="button"
              data-testid="view-mode-cad-btn"
              onClick={() => onSetViewMode('cad')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'cad' ? 'studio-pill-active' : 'studio-pill-inactive font-medium'
              }`}
              title="Bước 2: Xem phôi 3D hoàn chỉnh kèm Tree Support hữu cơ C++"
            >
              <IconCube size={12} />
              <span>2. Mô Phỏng</span>
            </button>

            <button
              type="button"
              data-testid="view-mode-filament-btn"
              onClick={() => onSetViewMode('filament_preview')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'filament_preview'
                  ? 'studio-pill-active'
                  : 'studio-pill-inactive font-medium'
              }`}
              title="Bước 3: Soi từng đường đùn sợi nhựa 3D (G-code Toolpath thực tế)"
            >
              <IconToolpath size={12} />
              <span>3. Sợi In</span>
            </button>
          </div>

          {/* Compact Viewport Overlay Capsule */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl studio-card shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg">
              <IconLayers size={12} className="studio-text-gold shrink-0" />
              <select
                value={renderMode}
                onChange={(e) => onSetRenderMode(e.target.value as SlicerRenderMode)}
                aria-label="Chế độ hiển thị bề mặt kỹ thuật"
                className="bg-transparent text-[11px] font-medium studio-text-primary focus:outline-none cursor-pointer"
                title="Chế độ tô màu bề mặt mô hình"
              >
                {renderModes.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    {rm.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-[1px] h-3.5 bg-[var(--border-hairline)] mx-0.5" />

            <button
              type="button"
              onClick={onToggleToolhead}
              aria-label="Ẩn/Hiện cụm đầu phun CoreXY"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                showToolhead ? 'studio-gold-badge font-semibold' : 'studio-pill-inactive'
              }`}
              title="Ẩn/Hiện cụm đầu phun CoreXY"
            >
              <IconNozzle size={13} />
              <span className="hidden 2xl:inline">Đầu In</span>
            </button>

            {hasSupport && (
              <button
                type="button"
                onClick={onToggleSupport}
                aria-label="Ẩn/Hiện cấu trúc Tree Support"
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                  showSupport
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/35 font-semibold'
                    : 'studio-pill-inactive'
                }`}
                title="Ẩn/Hiện cấu trúc Cây Đỡ (Tree Support)"
              >
                <IconSupport size={13} />
                <span className="hidden sm:inline">Tree</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleHeatmap}
              aria-label="Phân tích góc nghiêng Overhang"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                showHeatmap
                  ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30 font-semibold'
                  : 'studio-pill-inactive'
              }`}
              title="Bật/Tắt vùng cảnh báo góc nghiêng Overhang (>45°)"
            >
              <IconAngle size={12} />
            </button>
          </div>
        </div>

        {/* =====================================================================
            3. CỤM PHẢI: TRẠNG THÁI C++, AI, CÔNG CỤ, TÀI KHOẢN & XUẤT FILE (1 DÒNG GỌN GÀNG)
           ===================================================================== */}
        <div className="order-2 xl:order-3 flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {/* Live OrcaSlicer C++ WASM Status Indicator */}
          {orcaStatus?.active ? (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-semibold shrink-0"
              title={orcaStatus.label || 'OrcaSlicer C++ WASM đang tính toán Tree Support...'}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>{orcaStatus.percent !== null ? `${orcaStatus.percent}%` : 'C++'}</span>
            </div>
          ) : orcaStatus?.ready ? (
            <div
              className="hidden 2xl:flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[10px] font-mono font-semibold shrink-0"
              title="Đã dựng Tree Support & G-code bằng nhân OrcaSlicer C++ WASM chính gốc"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Orca C++</span>
            </div>
          ) : null}

          {/* Quick AI Consultant Button */}
          <button
            type="button"
            data-testid="ai-consultant-header-btn"
            onClick={onOpenSupportAIModal}
            aria-label="Mở Chuyên Gia AI Tư Vấn In 3D"
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-semibold studio-gold-badge hover:opacity-90 transition-all cursor-pointer shrink-0"
            title="Chuyên Gia AI Tư Vấn In 3D (Tối ưu cấu hình, Chat AI & Chẩn đoán ảnh lỗi)"
          >
            <IconAngle size={12} className="shrink-0" />
            <span className="hidden md:inline whitespace-nowrap">Tư Vấn AI</span>
          </button>

          {/* Consolidated Studio & AI Tools Menu */}
          <button
            ref={studioBtnRef}
            type="button"
            data-testid="studio-tools-menu-btn"
            onClick={() => setIsStudioMenuOpen((prev) => !prev)}
            aria-label="Mở bộ công cụ kỹ thuật & AI"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
              isStudioMenuOpen
                ? 'studio-pill-active'
                : 'studio-card hover:border-[var(--border-strong)] studio-text-primary'
            }`}
            title="Mở bộ công cụ Kiểm định, AI 3D, Bambu CLI, Timelapse, Gemini Key & Báo cáo"
          >
            <IconSliders size={12} className={isStudioMenuOpen ? '' : 'studio-text-gold'} />
            <span className="hidden sm:inline whitespace-nowrap">Công Cụ</span>
            <IconChevronDown
              size={11}
              className={`transition-transform ${isStudioMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dark / Light Mode Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              data-testid="theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              className="p-1.5 sm:p-2 rounded-xl studio-card hover:border-[var(--accent-gold)] transition-all cursor-pointer shrink-0"
              title={
                theme === 'dark'
                  ? 'Chuyển sang giao diện Sáng (Đồng bộ Trang chủ)'
                  : 'Chuyển sang giao diện Tối (Đồng bộ Trang chủ)'
              }
            >
              {theme === 'dark' ? (
                <IconSun size={14} className="studio-text-gold" />
              ) : (
                <IconMoon size={14} className="studio-text-gold" />
              )}
            </button>
          )}

          {/* Unified SSO Account / Login Button */}
          {onOpenAuthModal && (
            <button
              type="button"
              data-testid="laymor-sso-auth-btn"
              onClick={onOpenAuthModal}
              className={`flex items-center gap-1.5 rounded-xl studio-card hover:border-[var(--accent-gold)] transition-all cursor-pointer shrink-0 ${
                currentUser ? 'px-2 py-1' : 'px-2 py-1.5'
              }`}
              title={
                currentUser
                  ? `${currentUser.name} (@${currentUser.username}) — Đã đồng bộ SSO với Trang chủ LAYMOR`
                  : 'Đăng nhập tài khoản LAYMOR (Đồng bộ tự động với Trang chủ)'
              }
            >
              {currentUser ? (
                <>
                  <div className="relative flex items-center justify-center w-5 h-5 rounded-full overflow-hidden border border-[var(--border-hairline)] bg-[var(--bg-elevated)] shrink-0">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={12} className="studio-text-gold" />
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-[var(--bg-surface)]" />
                  </div>
                  <span className="hidden 2xl:inline text-[11px] font-bold studio-text-primary max-w-[76px] truncate">
                    {currentUser.username}
                  </span>
                </>
              ) : (
                <>
                  <LogIn size={13} className="studio-text-gold shrink-0" />
                  <span className="hidden 2xl:inline text-[11px] font-bold studio-text-primary whitespace-nowrap">
                    Đăng nhập
                  </span>
                </>
              )}
            </button>
          )}

          {/* Sync to Studio & Order CTA */}
          {onSyncToStudio && (
            <button
              type="button"
              data-testid="sync-to-studio-btn"
              onClick={() => onSyncToStudio(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl studio-gold-badge hover:opacity-90 text-[11px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
              title={
                isEmbedded
                  ? 'Áp dụng thông số cắt lớp & mở Đặt In ngay trên 3D Studio'
                  : 'Đồng bộ thông số cắt lớp về 3D Studio & Đặt In Dịch Vụ'
              }
            >
              <IconCheckShield size={13} className="shrink-0" />
              <span className="hidden 2xl:inline whitespace-nowrap">
                {isEmbedded ? 'Áp Dụng & Đặt In' : 'Đặt In Mẫu Này'}
              </span>
              <span className="2xl:hidden whitespace-nowrap">Đặt In</span>
            </button>
          )}

          {/* Primary Export CTA */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl studio-cta-primary text-[11px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Xuất file .3MF (Tùy chọn Kèm / Không kèm Tree Support), .STL hoặc .GCODE thực tế"
          >
            <IconExport size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Xuất File</span>
          </button>
        </div>
      </div>

      {studioDropdownPortal}
    </header>
  );
}
