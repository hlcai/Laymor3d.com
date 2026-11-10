import React, { useRef, useState, useEffect } from 'react';
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
} from '@/components/icons/MinimalIcons';
import {
  ISampleModel,
  IPreflightReport,
  SlicerRenderMode,
  SimulatorEngineType,
  ViewportDisplayMode,
} from '@/types/simulator';
import { SAMPLE_MODELS } from '@/services/sampleModels';

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
}: SimulatorHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStudioMenuOpen, setIsStudioMenuOpen] = useState(false);
  const studioMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (studioMenuRef.current && !studioMenuRef.current.contains(e.target as Node)) {
        setIsStudioMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <header className="relative z-30 shrink-0 w-full border-b studio-border bg-[var(--bg-panel)] backdrop-blur-xl px-2 sm:px-3.5 py-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        {/* =====================================================================
            1. CỤM TRÁI: NHẬN DIỆN LAYMOR & QUẢN LÝ PHÔI MÔ HÌNH
           ===================================================================== */}
        <div className="order-1 flex items-center gap-1.5 min-w-0">
          {/* Nút điều hướng quay về Trang chủ LAYMOR */}
          <a
            href="/"
            target="_top"
            data-testid="back-to-3dhub-btn"
            aria-label="Quay về Trang chủ LAYMOR"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl studio-card hover:border-[var(--border-strong)] transition-all cursor-pointer group shrink-0"
            title="Quay về Trang chủ LAYMOR — From layers to form"
          >
            <IconChevronLeft
              size={13}
              className="studio-text-secondary group-hover:-translate-x-0.5 transition-transform shrink-0"
            />
            <img
              src="/3dsim/brand/laymor-wordmark.png"
              alt="LAYMOR"
              className="h-4 sm:h-4.5 w-auto object-contain select-none laymor-logo-adaptive"
            />
          </a>

          {!isEmbedded && onSyncToStudio && (
            <button
              type="button"
              onClick={() => onSyncToStudio(false)}
              aria-label="Quay về 3D Studio"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl studio-card hover:border-[var(--accent-gold)] text-xs font-semibold studio-text-primary transition-all cursor-pointer shrink-0"
              title="Quay về trang 3D Studio cùng toàn bộ thông số cắt lớp hiện tại"
            >
              <span className="studio-text-gold font-bold">←</span>
              <span className="hidden md:inline">Studio</span>
            </button>
          )}

          {/* Unified Model Selector + Library + Import Bar */}
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
                className="bg-transparent text-xs font-medium studio-text-primary focus:outline-none cursor-pointer max-w-[92px] sm:max-w-[125px] truncate"
                title="Chọn phôi mô hình 3D"
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
                title="Thư viện phôi 3MF / STL"
              >
                <IconArchive size={12} />
                <span className="hidden md:inline">Kho 3MF</span>
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
              aria-label="Nạp file 3MF / G-Code / STL"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg studio-gold-badge text-[11px] font-semibold transition-all cursor-pointer ml-0.5 hover:opacity-85 shrink-0"
              title="Nạp file CAD hoặc G-Code Bambu Studio (.3MF, .GCODE.3MF, .GCODE, .STL, .OBJ)"
            >
              <IconImport size={12} />
              <span className="hidden sm:inline">Nạp File</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            2. CỤM GIỮA: 3 CHẾ ĐỘ LÀM VIỆC TRUNG TÂM (LUÔN HIỂN THỊ TRÊN MỌI MÀN HÌNH)
            Trên màn hình < 1280px (xl) tự động xuống dòng 2 gọn gàng, không bao giờ mất nút!
           ===================================================================== */}
        <div className="order-3 xl:order-2 w-full xl:w-auto flex items-center justify-between sm:justify-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5 xl:pt-0 border-t xl:border-t-0 studio-border">
          {/* 3-Stage Workspace Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-xl studio-card shrink-0">
            <button
              type="button"
              data-testid="view-mode-prepare-btn"
              onClick={() => onSetViewMode('prepare')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'prepare' ? 'studio-pill-active' : 'studio-pill-inactive font-medium'
              }`}
              title="Giai đoạn 1: Chuẩn bị bàn in (Định vị, Xoay góc, Tỉ lệ)"
            >
              <IconAxis size={13} />
              <span>Chuẩn Bị</span>
            </button>

            <button
              type="button"
              data-testid="view-mode-cad-btn"
              onClick={() => onSetViewMode('cad')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'cad' ? 'studio-pill-active' : 'studio-pill-inactive font-medium'
              }`}
              title="Giai đoạn 2: Mô phỏng cắt lớp trên phôi CAD & Conformal Support"
            >
              <IconCube size={13} />
              <span>Mô Phỏng</span>
            </button>

            <button
              type="button"
              data-testid="view-mode-filament-btn"
              onClick={() => onSetViewMode('filament_preview')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'filament_preview'
                  ? 'studio-pill-active'
                  : 'studio-pill-inactive font-medium'
              }`}
              title="Giai đoạn 3: Xem sợi in G-code Bambu Studio thực tế"
            >
              <IconToolpath size={13} />
              <span>Sợi In</span>
            </button>
          </div>

          {/* Viewport Display & Overlay Bar */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl studio-card shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg">
              <IconLayers size={12} className="studio-text-gold shrink-0" />
              <select
                value={renderMode}
                onChange={(e) => onSetRenderMode(e.target.value as SlicerRenderMode)}
                aria-label="Chế độ hiển thị bề mặt kỹ thuật"
                className="bg-transparent text-[11px] font-medium studio-text-primary focus:outline-none cursor-pointer"
                title="Chế độ hiển thị bề mặt kỹ thuật"
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
              <span className="hidden sm:inline xl:hidden 2xl:inline">Đầu In</span>
            </button>

            {hasSupport && (
              <button
                type="button"
                onClick={onToggleSupport}
                aria-label="Ẩn/Hiện cấu trúc Tree Support"
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                  showSupport ? 'studio-gold-badge font-semibold' : 'studio-pill-inactive'
                }`}
                title="Ẩn/Hiện cấu trúc Tree Support"
              >
                <IconSupport size={13} />
                <span className="hidden sm:inline xl:hidden 2xl:inline">Support</span>
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
              title="Phân tích góc nghiêng Overhang (>45°)"
            >
              <IconAngle size={12} />
              <span className="hidden md:inline xl:hidden">Overhang</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            3. CỤM PHẢI: AI & STUDIO TOOLS + THEME TOGGLE + ĐẶT IN + XUẤT
            Không bao giờ bị tràn ra ngoài cạnh phải màn hình!
           ===================================================================== */}
        <div className="order-2 xl:order-3 flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto xl:ml-0">
          {/* Quick AI Consultant Button */}
          <button
            type="button"
            data-testid="ai-consultant-header-btn"
            onClick={onOpenSupportAIModal}
            aria-label="Mở Chuyên Gia AI Tư Vấn In 3D"
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold studio-gold-badge hover:opacity-90 transition-all cursor-pointer"
            title="Mở Chuyên Gia AI Tư Vấn In 3D Toàn Diện (Tối ưu 6 nhóm Bambu Studio, Chat AI & Chẩn đoán ảnh lỗi)"
          >
            <IconAngle size={12} className="shrink-0" />
            <span className="hidden md:inline text-[11px] whitespace-nowrap">Tư Vấn AI</span>
          </button>

          {/* Consolidated AI & Studio Tools Dropdown Pill */}
          <div ref={studioMenuRef} className="relative">
            <div className="flex items-center rounded-xl studio-card p-0.5">
              {onOpenAI3DModal && (
                <>
                  <button
                    type="button"
                    data-testid="ai-3d-generator-btn"
                    onClick={onOpenAI3DModal}
                    aria-label="Tạo phôi 3D bằng AI"
                    className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium studio-pill-inactive cursor-pointer"
                    title="Tạo phôi 3D bằng AI (Trellis / Tripo3D / Meshy)"
                  >
                    <IconMeshGen size={13} className="studio-text-gold" />
                  </button>
                  <div className="hidden sm:block w-[1px] h-3.5 bg-[var(--border-hairline)]" />
                </>
              )}

              <button
                type="button"
                data-testid="gemini-key-modal-btn"
                onClick={onOpenGeminiKeyModal}
                aria-label="Cấu hình khóa kết nối Gemini API"
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium studio-pill-inactive cursor-pointer"
                title={
                  hasGeminiKey
                    ? 'Đã kết nối Gemini AI — Nhấp để quản lý khóa API'
                    : 'Thiết lập khóa kết nối Gemini API'
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasGeminiKey ? 'bg-emerald-500' : 'bg-[var(--accent-gold)]'
                  }`}
                />
                <IconKeyMinimal size={12} />
              </button>

              <div className="hidden sm:block w-[1px] h-3.5 bg-[var(--border-hairline)]" />

              <button
                type="button"
                data-testid="studio-tools-menu-btn"
                onClick={() => setIsStudioMenuOpen((prev) => !prev)}
                aria-label="Mở bộ công cụ kỹ thuật & AI"
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  isStudioMenuOpen || simulatorEngine === 'pro_local'
                    ? 'studio-gold-badge font-semibold'
                    : 'studio-pill-inactive'
                }`}
                title="Mở bộ công cụ AI, Cloud Slicer, Dạy AI Lỗi, Telemetry & Supabase"
              >
                <IconSliders size={12} />
                <span className="hidden sm:inline whitespace-nowrap">Công Cụ</span>
                <IconChevronDown
                  size={11}
                  className={`transition-transform ${isStudioMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* Dropdown Menu chứa toàn bộ công cụ nâng cao (Đảm bảo màn hình nhỏ không mất bất kỳ chức năng nào) */}
            {isStudioMenuOpen && (
              <div className="absolute right-0 mt-2 w-[min(320px,calc(100vw-16px))] max-h-[calc(100dvh-80px)] overflow-y-auto rounded-2xl glass-panel p-3 space-y-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-1.5 pb-1.5 border-b studio-border flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest studio-text-muted">
                    BỘ CÔNG CỤ KỸ THUẬT &amp; AI
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded studio-gold-badge">
                    LAYMOR PRO
                  </span>
                </div>

                {/* 0. Kiểm Định Preflight */}
                <button
                  type="button"
                  onClick={() => {
                    setIsStudioMenuOpen(false);
                    onOpenReportModal();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
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
                        Chẩn đoán Overhang, Warping &amp; Đề xuất vá lỗi tự động
                      </div>
                    </div>
                  </div>
                </button>

                {/* 1. Cloud / Local Slicer CLI */}
                <button
                  type="button"
                  onClick={() => {
                    setIsStudioMenuOpen(false);
                    onOpenLocalSlicerModal();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl studio-card hover:border-[var(--accent-gold-border)] text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg studio-gold-badge flex items-center justify-center shrink-0">
                      <IconTerminal size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold studio-text-primary">
                        OrcaSlicer / Bambu Cloud CLI
                      </div>
                      <div className="text-[10px] studio-text-secondary">
                        Biên dịch G-code &amp; Tree Support gốc C++
                      </div>
                    </div>
                  </div>
                </button>

                {/* 2. AI 3D Mesh Synthesis */}
                {onOpenAI3DModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsStudioMenuOpen(false);
                      onOpenAI3DModal();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg studio-card flex items-center justify-center studio-text-gold shrink-0">
                        <IconMeshGen size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold studio-text-primary">
                          Tổng Hợp Phôi 3D (Trellis / Tripo)
                        </div>
                        <div className="text-[10px] studio-text-secondary">
                          Tạo lưới 3D từ mô tả kỹ thuật hoặc ảnh chụp
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                {/* 3. AI Print Consultant Copilot */}
                <button
                  type="button"
                  onClick={() => {
                    setIsStudioMenuOpen(false);
                    onOpenSupportAIModal();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
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
                        Tư vấn 6 nhóm Bambu Studio • Chat AI • Chẩn đoán ảnh lỗi
                      </div>
                    </div>
                  </div>
                </button>

                {/* 3.5. Defect Knowledge Base */}
                {onOpenDefectKnowledgeModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsStudioMenuOpen(false);
                      onOpenDefectKnowledgeModal();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
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

                {/* 4. Timelapse Studio */}
                <button
                  type="button"
                  onClick={() => {
                    setIsStudioMenuOpen(false);
                    onOpenTimelapseModal();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg studio-card flex items-center justify-center studio-text-secondary shrink-0">
                      <IconAperture size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold studio-text-primary">
                        Bambu Timelapse Studio
                      </div>
                      <div className="text-[10px] studio-text-secondary">
                        Ghi hình Smooth Timelapse tại vị trí Purge Chute
                      </div>
                    </div>
                  </div>
                </button>

                {/* 5. Gemini API Key */}
                <button
                  type="button"
                  onClick={() => {
                    setIsStudioMenuOpen(false);
                    onOpenGeminiKeyModal();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg studio-card flex items-center justify-center studio-text-gold shrink-0">
                      <IconKeyMinimal size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold studio-text-primary flex items-center gap-2">
                        <span>Khóa Kết Nối Gemini API</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono studio-gold-badge">
                          {hasGeminiKey ? 'ĐÃ KẾT NỐI' : 'CHƯA CẤU HÌNH'}
                        </span>
                      </div>
                      <div className="text-[10px] studio-text-secondary">
                        Xác thực mô hình suy luận hình học đám mây
                      </div>
                    </div>
                  </div>
                </button>

                {/* 5.5. Live Telemetry & Supabase */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {onOpenLiveInspectorModal && (
                    <button
                      type="button"
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

                {/* 6. Dual-Engine Switcher */}
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
                      <span>E1 Web Wasm</span>
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
                      <span>E2 Cloud C++</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inline Secondary Pills trên màn hình rộng >= 1536px (2xl) */}
          <div className="hidden 2xl:flex items-center rounded-xl studio-card p-0.5 shrink-0">
            {onOpenDefectKnowledgeModal && (
              <button
                type="button"
                data-testid="defect-knowledge-header-btn"
                onClick={onOpenDefectKnowledgeModal}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold studio-text-gold hover:bg-[var(--bg-hover)] transition-all cursor-pointer whitespace-nowrap"
                title="Đóng góp lỗi thực tế kèm giải thích để dạy AI"
              >
                <IconCheckShield size={12} className="shrink-0" />
                <span>Dạy AI Lỗi</span>
              </button>
            )}
            {onOpenLiveInspectorModal && (
              <>
                <div className="w-[1px] h-3.5 bg-[var(--border-hairline)]" />
                <button
                  type="button"
                  data-testid="report-live-header-btn"
                  onClick={onOpenLiveInspectorModal}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold studio-text-gold hover:bg-[var(--bg-hover)] transition-all cursor-pointer whitespace-nowrap"
                  title="Thanh tra Telemetry & Báo cáo"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] animate-pulse shrink-0" />
                  <span>Report</span>
                </button>
              </>
            )}
            {onOpenSupabaseHub && (
              <>
                <div className="w-[1px] h-3.5 bg-[var(--border-hairline)]" />
                <button
                  type="button"
                  data-testid="supabase-hub-btn"
                  onClick={onOpenSupabaseHub}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold studio-text-gold hover:bg-[var(--bg-hover)] transition-all cursor-pointer whitespace-nowrap"
                  title="Supabase Cloud Hub"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isSupabaseConnected ? 'bg-emerald-500' : 'bg-[var(--accent-gold)]'
                    }`}
                  />
                  <span>Supabase</span>
                </button>
              </>
            )}
          </div>

          {/* Dark / Light Mode Toggle Button (Đồng bộ 2 chiều với Trang chủ LAYMOR) */}
          {onToggleTheme && (
            <button
              type="button"
              data-testid="theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              className="p-2 rounded-xl studio-card hover:border-[var(--accent-gold)] transition-all cursor-pointer shrink-0"
              title={
                theme === 'dark'
                  ? 'Đang ở chế độ Tối — Chuyển sang chế độ Sáng (Đồng bộ với Trang chủ)'
                  : 'Đang ở chế độ Sáng — Chuyển sang chế độ Tối (Đồng bộ với Trang chủ)'
              }
            >
              {theme === 'dark' ? (
                <IconSun size={14} className="studio-text-gold" />
              ) : (
                <IconMoon size={14} className="studio-text-gold" />
              )}
            </button>
          )}

          {/* Sync to Studio & Order CTA */}
          {onSyncToStudio && (
            <button
              type="button"
              data-testid="sync-to-studio-btn"
              onClick={() => onSyncToStudio(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl studio-gold-badge hover:opacity-90 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
              title={
                isEmbedded
                  ? 'Áp dụng thông số cắt lớp & mở Đặt In ngay trên 3D Studio'
                  : 'Đồng bộ thông số cắt lớp về 3D Studio & Đặt In Dịch Vụ'
              }
            >
              <IconCheckShield size={13} className="shrink-0" />
              <span className="hidden lg:inline whitespace-nowrap">
                {isEmbedded ? 'Áp Dụng & Đặt In' : 'Đặt In Mẫu Này'}
              </span>
              <span className="lg:hidden whitespace-nowrap">Đặt In</span>
            </button>
          )}

          {/* Primary Export CTA */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl studio-cta-primary text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Xuất file .3MF kèm Tree Support hoặc G-Code / Profile (.json)"
          >
            <IconExport size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}
