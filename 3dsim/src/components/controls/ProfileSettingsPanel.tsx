import React, { useState } from 'react';
import {
  IconSliders,
  IconCube,
  IconSupport,
  IconVelocity,
  IconThermal,
  IconFlow,
  IconLayers,
  IconTerminal,
  IconAngle,
  IconKeyMinimal,
  IconChevronLeft,
  IconChevronRight,
} from '@/components/icons/MinimalIcons';
import {
  ISimulationProfile,
  MaterialType,
  InfillPattern,
  SupportType,
  BrimTypeMode,
  FuzzySkinMode,
  SeamPositionType,
} from '@/types/simulator';
import { PRESET_PROFILES, MATERIAL_PALETTE } from '@/services/presetProfiles';

interface ProfileSettingsPanelProps {
  profile: ISimulationProfile;
  onChangeProfile: (updated: Partial<ISimulationProfile>) => void;
  onApplyPreset: (presetId: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenSupportAIModal?: () => void;
  onOpenGeminiKeyModal?: () => void;
  onOpenLocalSlicerModal?: () => void;
}

type SettingsTab = 'basic' | 'support' | 'quality' | 'advanced';

export function ProfileSettingsPanel({
  profile,
  onChangeProfile,
  onApplyPreset,
  isOpen,
  onToggleOpen,
  onOpenSupportAIModal,
  onOpenGeminiKeyModal,
  onOpenLocalSlicerModal,
}: ProfileSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('basic');

  const materials: MaterialType[] = ['PLA', 'PETG', 'ABS', 'TPU', 'PLA-CF', 'ASA', 'PA-CF'];
  const nozzleSizes = [0.2, 0.4, 0.6, 0.8];
  const infillTypes: { id: InfillPattern; label: string }[] = [
    { id: 'gyroid', label: 'Gyroid (Đẳng hướng 3D)' },
    { id: 'grid', label: 'Grid (Lưới trực giao)' },
    { id: 'honeycomb', label: 'Honeycomb (Tổ ong)' },
    { id: 'triangles', label: 'Triangles (Tam giác)' },
    { id: 'concentric', label: 'Concentric (Đồng tâm)' },
    { id: 'cubic', label: 'Cubic (Lập phương 3D)' },
    { id: 'lightning', label: 'Lightning (Tia chớp nhẹ)' },
  ];
  const supportModes: { id: SupportType; label: string }[] = [
    { id: 'none', label: 'Tắt' },
    { id: 'tree', label: 'Tree C++' },
    { id: 'normal', label: 'Normal (Trụ)' },
  ];

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'basic', label: 'Chất Lượng', icon: <IconSliders size={13} /> },
    { id: 'support', label: 'Cây Đỡ', icon: <IconSupport size={13} /> },
    { id: 'quality', label: 'Độ Bền', icon: <IconCube size={13} /> },
    { id: 'advanced', label: 'Tốc & Nhiệt', icon: <IconVelocity size={13} /> },
  ];

  const quickIntents = [
    {
      id: 'figurine',
      title: 'Tượng Mịn',
      sub: '0.16mm • Tree Organic',
      isMatch:
        profile.layerHeight <= 0.16 &&
        profile.supportMode === 'tree' &&
        (profile.treeStyle || 'organic') === 'organic',
      apply: () =>
        onChangeProfile({
          layerHeight: 0.16,
          wallLoops: 2,
          infillDensity: 15,
          infillType: 'gyroid',
          supportMode: 'tree',
          treeStyle: 'organic',
          supportTopZDistance: 0.2,
          supportAngleThreshold: 30,
          brimEnabled: false,
          brimType: 'none',
          printSpeed: 180,
        }),
    },
    {
      id: 'balanced',
      title: 'Tiêu Chuẩn',
      sub: '0.20mm • Cân bằng',
      isMatch:
        Math.abs(profile.layerHeight - 0.2) < 0.01 &&
        profile.wallLoops <= 3 &&
        profile.infillDensity >= 10 &&
        profile.infillDensity <= 20,
      apply: () =>
        onChangeProfile({
          layerHeight: 0.2,
          wallLoops: 2,
          infillDensity: 15,
          infillType: 'gyroid',
          supportMode: 'tree',
          treeStyle: 'organic',
          supportTopZDistance: 0.2,
          supportAngleThreshold: 30,
          brimEnabled: false,
          brimType: 'none',
          printSpeed: 220,
        }),
    },
    {
      id: 'strong',
      title: 'Chịu Lực',
      sub: '4 Tường • 35% Gyroid',
      isMatch: profile.wallLoops >= 4 && profile.infillDensity >= 30,
      apply: () =>
        onChangeProfile({
          layerHeight: 0.2,
          wallLoops: 4,
          topShellLayers: 5,
          bottomShellLayers: 4,
          infillDensity: 35,
          infillType: 'gyroid',
          supportMode: 'tree',
          treeStyle: 'strong',
          supportAngleThreshold: 30,
          brimEnabled: false,
          brimType: 'none',
          printSpeed: 160,
        }),
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onToggleOpen}
          aria-hidden="true"
          className="lg:hidden absolute inset-0 z-30 bg-slate-950/35 backdrop-blur-[1px]"
        />
      )}
      <aside
        className={`transition-all duration-200 ${
          isOpen
            ? 'absolute inset-y-0 left-0 z-40 w-[min(352px,calc(100vw-16px))] lg:relative lg:inset-auto lg:z-20 lg:w-[328px] xl:w-[352px] lg:shrink-0 h-full'
            : 'absolute top-2.5 left-2.5 z-30 w-11 lg:relative lg:top-auto lg:left-auto lg:z-20 lg:w-12 lg:shrink-0 lg:h-full'
        }`}
      >
        {!isOpen ? (
          /* Collapsed Vertical Studio Dock */
          <div className="w-11 lg:w-12 lg:h-full rounded-2xl lg:rounded-none glass-panel lg:border-y-0 lg:border-l-0 lg:border-r py-2 px-1.5 flex flex-col items-center gap-1.5">
            <button
              type="button"
              data-testid="toggle-profile-panel-btn"
              onClick={onToggleOpen}
              aria-label="Mở bảng thông số cắt lớp"
              className="w-8 h-8 rounded-xl studio-gold-badge hover:opacity-90 flex items-center justify-center transition-all cursor-pointer"
              title="Mở bảng thông số in 3D"
            >
              <IconChevronRight size={14} />
            </button>

            <div className="w-5 h-[1px] bg-[var(--border-hairline)] my-0.5" />

            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id);
                    onToggleOpen();
                  }}
                  aria-label={`Mở tab ${t.label}`}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isActive ? 'studio-pill-active' : 'studio-pill-inactive'
                  }`}
                  title={`Mở nhanh: ${t.label}`}
                >
                  {t.icon}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-full glass-panel lg:rounded-none rounded-r-2xl border-y-0 border-l-0 border-r studio-border overflow-hidden flex flex-col">
            {/* Header / Collapse Toggle */}
            <div className="px-3.5 py-2.5 border-b studio-border flex items-center justify-between bg-[var(--bg-subtle)] shrink-0">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg studio-gold-badge flex items-center justify-center shrink-0">
                  <IconSliders size={13} />
                </div>
                <div className="leading-tight min-w-0">
                  <h3 className="text-xs font-bold studio-text-primary tracking-tight truncate">
                    Thiết Lập Thông Số In
                  </h3>
                  <p className="text-[10px] studio-text-secondary font-mono truncate">
                    {profile.material} • {profile.nozzleDiameter || 0.4}mm • Lớp {profile.layerHeight}mm •{' '}
                    {profile.supportMode === 'tree' ? `Tree (${profile.treeStyle || 'organic'})` : profile.supportMode === 'normal' ? 'Support Trụ' : 'Không Support'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                data-testid="toggle-profile-panel-btn"
                onClick={onToggleOpen}
                aria-label="Thu gọn bảng thông số"
                className="w-7 h-7 rounded-lg studio-card hover:bg-[var(--bg-hover)] studio-text-secondary hover:studio-text-primary flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Thu gọn bảng thông số"
              >
                <IconChevronLeft size={13} />
              </button>
            </div>

            {/* Clean 4-Tab Bambu-Style Segmented Navigation */}
            <div className="grid grid-cols-4 border-b studio-border bg-[var(--bg-subtle)] p-1.5 gap-1 shrink-0">
              {tabs.map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] transition-all cursor-pointer ${
                      isActive ? 'studio-pill-active' : 'studio-pill-inactive font-medium'
                    }`}
                  >
                    {t.icon}
                    <span className="leading-none whitespace-nowrap">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Inspector Body */}
            <div className="flex-1 min-h-0 p-3 space-y-3 overflow-y-auto text-xs">
              {/* ================= TAB 1: CHẤT LƯỢNG & CƠ BẢN ================= */}
              {activeTab === 'basic' && (
                <>
                  {/* 0. 1-Click Quick Intents for Beginners */}
                  <div className="p-2.5 rounded-xl studio-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold studio-text-primary">
                        Chế độ nhanh (1-Chạm)
                      </span>
                      <span className="text-[9px] font-mono studio-text-gold">Tự động tối ưu</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {quickIntents.map((qi) => (
                        <button
                          key={qi.id}
                          type="button"
                          onClick={qi.apply}
                          className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                            qi.isMatch
                              ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-bg)]'
                              : 'studio-card hover:border-[var(--border-strong)]'
                          }`}
                        >
                          <div className="text-[11px] font-bold studio-text-primary leading-tight">
                            {qi.title}
                          </div>
                          <div className="text-[9px] studio-text-secondary mt-0.5 leading-tight">
                            {qi.sub}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 1. System Preset & Nozzle */}
                  <div className="p-3 rounded-xl studio-card space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold studio-text-primary">
                        Hồ sơ máy in (Bambu Preset)
                      </span>
                      <span className="text-[9px] font-mono studio-text-gold uppercase">
                        Kim {profile.nozzleDiameter || 0.4}mm
                      </span>
                    </div>
                    <select
                      value={profile.id}
                      onChange={(e) => onApplyPreset(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs font-medium cursor-pointer"
                    >
                      {PRESET_PROFILES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <div className="pt-2 border-t studio-border flex items-center justify-between gap-2">
                      <span className="text-[10px] studio-text-secondary shrink-0">
                        Đường kính kim:
                      </span>
                      <div className="grid grid-cols-4 gap-1 flex-1 max-w-[190px]">
                        {nozzleSizes.map((nz) => (
                          <button
                            type="button"
                            key={nz}
                            onClick={() =>
                              onChangeProfile({
                                nozzleDiameter: nz,
                                lineWidth: Number((nz * 1.05).toFixed(2)),
                                outerWallLineWidth: Number(nz.toFixed(2)),
                              })
                            }
                            className={`py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                              (profile.nozzleDiameter || 0.4) === nz
                                ? 'studio-pill-active font-bold'
                                : 'studio-card studio-pill-inactive'
                            }`}
                          >
                            {nz.toFixed(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Filament Material & Color Swatch */}
                  <div className="p-3 rounded-xl studio-card space-y-2.5">
                    <label className="text-[11px] font-semibold studio-text-primary flex items-center justify-between">
                      <span>Vật liệu nhựa (Filament)</span>
                      <span className="text-[10px] font-mono studio-text-secondary">
                        {profile.nozzleTemp}°C / {profile.bedTemp}°C
                      </span>
                    </label>

                    <div className="grid grid-cols-4 gap-1">
                      {materials.map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => onChangeProfile({ material: m })}
                          className={`py-1.5 px-1 rounded-lg text-[10px] transition-all cursor-pointer ${
                            profile.material === m
                              ? 'studio-pill-active font-bold'
                              : 'studio-card studio-pill-inactive font-medium'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t studio-border">
                      <span className="text-[10px] studio-text-secondary">Màu mô hình:</span>
                      <div className="flex items-center gap-1.5">
                        {(MATERIAL_PALETTE[profile.material] || MATERIAL_PALETTE.PLA).map((hex) => (
                          <button
                            type="button"
                            key={hex}
                            onClick={() => onChangeProfile({ materialColor: hex })}
                            className={`w-4.5 h-4.5 rounded-full transition-all cursor-pointer border ${
                              profile.materialColor === hex
                                ? 'scale-115 border-[var(--text-primary)] ring-2 ring-[var(--accent-gold)]'
                                : 'border-black/20 hover:scale-110 opacity-75'
                            }`}
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Layer Height */}
                  <div className="p-3 rounded-xl studio-card space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="studio-text-primary flex items-center gap-1.5 font-semibold">
                        <IconLayers size={12} className="studio-text-gold" />
                        <span>Độ dày mỗi lớp (Layer)</span>
                      </span>
                      <span className="font-mono font-semibold text-[11px] px-2 py-0.5 rounded studio-gold-badge">
                        {profile.layerHeight.toFixed(2)} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.08"
                      max="0.32"
                      step="0.02"
                      value={profile.layerHeight}
                      onChange={(e) => onChangeProfile({ layerHeight: Number(e.target.value) })}
                      className="w-full cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] studio-text-muted font-mono">
                      <span>0.08 (Siêu mịn)</span>
                      <span>0.20 (Chuẩn)</span>
                      <span>0.32 (In nhanh)</span>
                    </div>
                  </div>

                  {/* 4. Sparse Infill */}
                  <div className="p-3 rounded-xl studio-card space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="studio-text-primary font-semibold">Mật độ ruột (Infill)</span>
                      <span className="font-mono font-semibold text-[11px] px-2 py-0.5 rounded studio-gold-badge">
                        {profile.infillDensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={profile.infillDensity}
                      onChange={(e) => onChangeProfile({ infillDensity: Number(e.target.value) })}
                      className="w-full cursor-pointer"
                    />
                    <select
                      value={profile.infillType}
                      onChange={(e) => onChangeProfile({ infillType: e.target.value as InfillPattern })}
                      className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs font-medium cursor-pointer"
                    >
                      {infillTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Quick Support Summary & Shortcut */}
                  <div className="p-3 rounded-xl studio-card space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold studio-text-primary flex items-center gap-1.5">
                        <IconSupport size={12} className="text-emerald-500" />
                        <span>Cây Đỡ (Tree Support C++)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('support')}
                        className="text-[10px] studio-text-gold hover:underline cursor-pointer font-semibold"
                      >
                        Tùy chỉnh sâu →
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {supportModes.map((sm) => (
                        <button
                          type="button"
                          key={sm.id}
                          onClick={() => onChangeProfile({ supportMode: sm.id })}
                          className={`py-1.5 px-2 rounded-lg text-[11px] transition-all cursor-pointer ${
                            profile.supportMode === sm.id
                              ? 'studio-pill-active'
                              : 'studio-card studio-pill-inactive font-medium'
                          }`}
                        >
                          {sm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ================= TAB 2: CÂY ĐỠ (ORCA C++ TREE SUPPORT & BRIM) ================= */}
              {activeTab === 'support' && (
                <div className="space-y-3">
                  {/* OrcaSlicer C++ WASM Engine Card */}
                  <div className="p-3 rounded-xl glass-panel-accent space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold studio-text-primary flex items-center gap-1.5">
                        <IconSupport size={13} className="text-emerald-500" />
                        <span>Tree Support Hữu Cơ C++</span>
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-bold">
                        ORCA WASM
                      </span>
                    </div>
                    <p className="text-[10px] studio-text-secondary leading-relaxed">
                      Nhánh rỗng tự động uốn vòng né vỏ mẫu (<strong>0.00mm xuyên mẫu</strong>), có đệm đỉnh{' '}
                      <span className="text-fuchsia-500 font-semibold">Interface tím</span> dễ bóc sạch.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      {onOpenSupportAIModal && (
                        <button
                          type="button"
                          onClick={onOpenSupportAIModal}
                          className="py-1.5 px-2 rounded-lg studio-cta-primary font-semibold text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <IconAngle size={11} />
                          <span>AI Tối Ưu Góc Đặt</span>
                        </button>
                      )}
                      {onOpenLocalSlicerModal && (
                        <button
                          type="button"
                          onClick={onOpenLocalSlicerModal}
                          className="py-1.5 px-2 rounded-lg studio-card hover:bg-[var(--bg-hover)] studio-text-primary font-medium text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <IconTerminal size={11} className="studio-text-gold" />
                          <span>Nạp .gcode.3mf</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 1. Support Mode Selection */}
                  <div className="p-3 rounded-xl studio-card space-y-2">
                    <label className="text-[11px] font-semibold studio-text-primary">
                      Loại cấu trúc đỡ:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['none', 'tree', 'normal'] as const).map((mode) => (
                        <button
                          type="button"
                          key={mode}
                          onClick={() => onChangeProfile({ supportMode: mode })}
                          className={`py-1.5 px-1 rounded-lg text-[11px] transition-all cursor-pointer text-center ${
                            profile.supportMode === mode
                              ? 'studio-pill-active'
                              : 'studio-card studio-pill-inactive font-medium'
                          }`}
                        >
                          {mode === 'none' ? 'Tắt' : mode === 'tree' ? 'Tree Hữu Cơ' : 'Trụ Lưới'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Visual Tree Style Cards */}
                  {profile.supportMode === 'tree' && (
                    <div className="p-3 rounded-xl studio-card space-y-2">
                      <label className="text-[11px] font-semibold studio-text-primary">
                        Kiểu nhánh Tree Support:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          {
                            id: 'organic',
                            name: 'Organic Tự Nhiên',
                            desc: 'Thân rỗng mượt, né mẫu tối ưu',
                          },
                          {
                            id: 'slim',
                            name: 'Slim Tiết Kiệm',
                            desc: 'Nhánh mảnh, ít tốn nhựa nhất',
                          },
                          {
                            id: 'strong',
                            name: 'Strong Vững Chắc',
                            desc: 'Thân dày chịu lực cho mẫu lớn',
                          },
                          {
                            id: 'hybrid',
                            name: 'Hybrid Đa Dụng',
                            desc: 'Kết hợp cành cây & đỡ phẳng',
                          },
                        ].map((st) => {
                          const isSelected = (profile.treeStyle || 'organic') === st.id;
                          return (
                            <button
                              type="button"
                              key={st.id}
                              onClick={() => onChangeProfile({ treeStyle: st.id as any })}
                              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-bg)]'
                                  : 'studio-card hover:border-[var(--border-strong)]'
                              }`}
                            >
                              <div className="text-[11px] font-bold studio-text-primary flex items-center justify-between">
                                <span>{st.name}</span>
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                )}
                              </div>
                              <div className="text-[9px] studio-text-secondary mt-0.5 leading-snug">
                                {st.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Overhang Threshold, Z-Gap & Branch Geometry */}
                  {profile.supportMode !== 'none' && (
                    <div className="p-3 rounded-xl studio-card space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="studio-text-primary font-semibold">
                            Góc nghiêng cần đỡ (Threshold)
                          </span>
                          <span className="font-mono font-semibold px-2 py-0.5 rounded studio-gold-badge">
                            {profile.supportAngleThreshold ?? 30}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="55"
                          step="5"
                          value={profile.supportAngleThreshold ?? 30}
                          onChange={(e) =>
                            onChangeProfile({ supportAngleThreshold: Number(e.target.value) })
                          }
                          className="w-full cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] studio-text-muted font-mono">
                          <span>15° (Đỡ ít)</span>
                          <span>30° (Chuẩn Bambu)</span>
                          <span>45° (Đỡ kỹ)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t studio-border">
                        <div className="space-y-1">
                          <span className="text-[10px] studio-text-secondary">
                            Khe hở bóc đỉnh (Top Z)
                          </span>
                          <input
                            type="number"
                            step="0.02"
                            min="0.08"
                            max="0.40"
                            value={profile.supportTopZDistance ?? 0.2}
                            onChange={(e) =>
                              onChangeProfile({ supportTopZDistance: Number(e.target.value) })
                            }
                            className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] studio-text-secondary">
                            Khe hở đáy (Bot Z)
                          </span>
                          <input
                            type="number"
                            step="0.02"
                            min="0.08"
                            max="0.40"
                            value={profile.supportBottomZDistance ?? 0.2}
                            onChange={(e) =>
                              onChangeProfile({ supportBottomZDistance: Number(e.target.value) })
                            }
                            className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t studio-border">
                        <div className="space-y-1">
                          <span className="text-[10px] studio-text-secondary">ĐK Nhánh</span>
                          <input
                            type="number"
                            step="0.2"
                            min="1.0"
                            max="5.0"
                            value={profile.supportBranchDiameter ?? 2.2}
                            onChange={(e) =>
                              onChangeProfile({ supportBranchDiameter: Number(e.target.value) })
                            }
                            className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] studio-text-secondary">Góc Nhánh</span>
                          <input
                            type="number"
                            step="5"
                            min="25"
                            max="65"
                            value={profile.supportBranchAngle ?? 45}
                            onChange={(e) =>
                              onChangeProfile({ supportBranchAngle: Number(e.target.value) })
                            }
                            className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] studio-text-secondary">Đệm Đỉnh</span>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            value={profile.supportInterfaceLayers ?? 2}
                            onChange={(e) =>
                              onChangeProfile({ supportInterfaceLayers: Number(e.target.value) })
                            }
                            className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t studio-border">
                        <div>
                          <div className="text-[11px] studio-text-primary font-medium">
                            Chỉ mọc từ mặt bàn in
                          </div>
                          <div className="text-[9px] studio-text-secondary">
                            Tránh để lại vết sẹo trên mặt lưng mẫu
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={profile.supportOnBuildPlateOnly !== false}
                          onChange={(e) =>
                            onChangeProfile({ supportOnBuildPlateOnly: e.target.checked })
                          }
                          className="w-4 h-4 accent-[var(--accent-gold)] rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* 4. Bed Adhesion (Brim & Raft) */}
                  <div className="p-3 rounded-xl studio-card space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold studio-text-primary">
                        Vành Bám Bàn (Brim &amp; Raft):
                      </span>
                      <span className="text-[9px] font-mono studio-text-gold">Chống bong đáy</span>
                    </div>
                    <select
                      value={profile.brimEnabled ? profile.brimType || 'outer_only' : 'none'}
                      onChange={(e) => {
                        const val = e.target.value as BrimTypeMode;
                        onChangeProfile({
                          brimType: val,
                          brimEnabled: val !== 'none',
                          brimWidthMm:
                            val !== 'none' && !profile.brimWidthMm ? 5 : profile.brimWidthMm,
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg glass-input text-xs font-medium cursor-pointer"
                    >
                      <option value="none">Không dùng vành Brim</option>
                      <option value="outer_only">Vành bao ngoài (Outer Brim)</option>
                      <option value="inner_only">Vành lòng trong (Inner Brim)</option>
                      <option value="outer_and_inner">Cả trong &amp; ngoài</option>
                      <option value="mouse_ears">Tai chuột 4 góc (Mouse Ears)</option>
                    </select>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <span className="text-[10px] studio-text-secondary">Rộng Brim (mm)</span>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          value={profile.brimWidthMm}
                          onChange={(e) => {
                            const w = Number(e.target.value);
                            onChangeProfile({ brimWidthMm: w, brimEnabled: w > 0 });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] studio-text-secondary">Đế Raft (Lớp)</span>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          value={profile.raftLayers ?? 0}
                          onChange={(e) => onChangeProfile({ raftLayers: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 3: ĐỘ BỀN, VÁCH TƯỜNG & BỀ MẶT ================= */}
              {activeTab === 'quality' && (
                <div className="space-y-3">
                  {/* Wall Loops */}
                  <div className="p-3 rounded-xl studio-card space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="studio-text-primary font-semibold">
                        Số vòng tường (Wall Loops)
                      </span>
                      <span className="font-mono font-semibold px-2 py-0.5 rounded studio-gold-badge">
                        {profile.wallLoops} vòng
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={profile.wallLoops}
                      onChange={(e) => onChangeProfile({ wallLoops: Number(e.target.value) })}
                      className="w-full cursor-pointer"
                    />
                    <div className="text-[10px] studio-text-secondary">
                      Tăng số vòng tường giúp chi tiết cứng cáp hơn nhiều so với chỉ tăng Infill.
                    </div>
                  </div>

                  {/* Line Width */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl studio-card space-y-1">
                      <span className="text-[10px] studio-text-secondary">Bề rộng nét (mm)</span>
                      <input
                        type="number"
                        step="0.02"
                        min="0.20"
                        max="0.90"
                        value={profile.lineWidth || 0.42}
                        onChange={(e) => onChangeProfile({ lineWidth: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl studio-card space-y-1">
                      <span className="text-[10px] studio-text-secondary">Nét vỏ ngoài (mm)</span>
                      <input
                        type="number"
                        step="0.02"
                        min="0.20"
                        max="0.85"
                        value={profile.outerWallLineWidth || 0.42}
                        onChange={(e) =>
                          onChangeProfile({ outerWallLineWidth: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                      />
                    </div>
                  </div>

                  {/* Top / Bottom Shell Layers */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl studio-card space-y-1">
                      <span className="text-[10px] studio-text-secondary">Lớp Nóc</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={profile.topShellLayers ?? 4}
                        onChange={(e) => onChangeProfile({ topShellLayers: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl studio-card space-y-1">
                      <span className="text-[10px] studio-text-secondary">Lớp Đáy</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={profile.bottomShellLayers ?? 3}
                        onChange={(e) =>
                          onChangeProfile({ bottomShellLayers: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl studio-card space-y-1">
                      <span className="text-[10px] studio-text-secondary">Overlap %</span>
                      <input
                        type="number"
                        min="5"
                        max="35"
                        value={profile.infillOverlapPercent ?? 15}
                        onChange={(e) =>
                          onChangeProfile({ infillOverlapPercent: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                      />
                    </div>
                  </div>

                  {/* Z-Seam */}
                  <div className="p-3 rounded-xl studio-card space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold studio-text-primary">
                        Vị trí đường nối Z-Seam:
                      </label>
                      <span className="text-[9px] font-mono studio-text-gold">3D trực tiếp</span>
                    </div>
                    <select
                      value={profile.seamPosition || 'aligned'}
                      onChange={(e) =>
                        onChangeProfile({ seamPosition: e.target.value as SeamPositionType })
                      }
                      className="w-full px-3 py-1.5 rounded-lg glass-input text-xs font-medium cursor-pointer"
                    >
                      <option value="aligned">Aligned (Giấu vào góc cạnh)</option>
                      <option value="nearest">Nearest (Gần nhất — In nhanh)</option>
                      <option value="back">Back (Giấu ra mặt lưng sau)</option>
                      <option value="random">Random (Phân tán ngẫu nhiên)</option>
                    </select>
                  </div>

                  {/* Ironing & Fuzzy Skin */}
                  <div className="p-3 rounded-xl studio-card space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-semibold studio-text-primary">
                          Là mịn mặt đỉnh (Ironing)
                        </div>
                        <div className="text-[10px] studio-text-secondary">
                          Làm bóng phẳng các bề mặt nằm ngang trên cùng
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(profile.ironingEnabled)}
                        onChange={(e) => onChangeProfile({ ironingEnabled: e.target.checked })}
                        className="w-4 h-4 accent-[var(--accent-gold)] rounded cursor-pointer"
                      />
                    </div>

                    <div className="pt-2 border-t studio-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold studio-text-primary">
                          Tạo nhám vỏ (Fuzzy Skin)
                        </span>
                        <span className="text-[10px] font-mono studio-text-gold">
                          {profile.fuzzySkin || 'none'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            { id: 'none', label: 'Tắt (Mịn)' },
                            { id: 'outside', label: 'Vỏ Ngoài' },
                            { id: 'all', label: 'Toàn Bộ' },
                          ] as { id: FuzzySkinMode; label: string }[]
                        ).map((fz) => (
                          <button
                            type="button"
                            key={fz.id}
                            onClick={() => onChangeProfile({ fuzzySkin: fz.id })}
                            className={`py-1.5 px-2 rounded-lg text-[10px] transition-all cursor-pointer ${
                              (profile.fuzzySkin || 'none') === fz.id
                                ? 'studio-pill-active font-bold'
                                : 'studio-card studio-pill-inactive'
                            }`}
                          >
                            {fz.label}
                          </button>
                        ))}
                      </div>

                      {profile.fuzzySkin && profile.fuzzySkin !== 'none' && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="studio-text-secondary">Biên độ hạt nhám:</span>
                            <span className="font-mono studio-text-gold">
                              {(profile.fuzzySkinThickness || 0.3).toFixed(2)} mm
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.10"
                            max="0.60"
                            step="0.05"
                            value={profile.fuzzySkinThickness || 0.3}
                            onChange={(e) =>
                              onChangeProfile({ fuzzySkinThickness: Number(e.target.value) })
                            }
                            className="w-full cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 4: TỐC ĐỘ, NHIỆT ĐỘ & ĐÙN NHỰA ================= */}
              {activeTab === 'advanced' && (
                <div className="space-y-3">
                  {/* Speed Group */}
                  <div className="p-3 rounded-xl studio-card space-y-2.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="studio-text-primary font-semibold flex items-center gap-1.5">
                        <IconVelocity size={12} className="studio-text-gold" />
                        <span>Tốc độ in chuẩn</span>
                      </span>
                      <span className="font-mono font-semibold px-2 py-0.5 rounded studio-gold-badge">
                        {profile.printSpeed} mm/s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="450"
                      step="10"
                      value={profile.printSpeed}
                      onChange={(e) => onChangeProfile({ printSpeed: Number(e.target.value) })}
                      className="w-full cursor-pointer"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1.5 border-t studio-border">
                      <div className="space-y-1">
                        <span className="text-[10px] studio-text-secondary">Tường ngoài (mm/s)</span>
                        <input
                          type="number"
                          value={profile.outerWallSpeed || Math.round(profile.printSpeed * 0.6)}
                          onChange={(e) =>
                            onChangeProfile({ outerWallSpeed: Number(e.target.value) })
                          }
                          className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] studio-text-secondary">Chạy không tải</span>
                        <input
                          type="number"
                          value={profile.travelSpeed || 500}
                          onChange={(e) => onChangeProfile({ travelSpeed: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Thermal & Cooling Group */}
                  <div className="p-3 rounded-xl studio-card space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold studio-text-primary">
                      <IconThermal size={12} className="studio-text-gold" />
                      <span>Nhiệt độ &amp; Làm mát</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] studio-text-secondary">Đầu phun (°C)</span>
                        <input
                          type="number"
                          step="5"
                          min="180"
                          max="310"
                          value={profile.nozzleTemp}
                          onChange={(e) => onChangeProfile({ nozzleTemp: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] studio-text-secondary">Bàn nhiệt (°C)</span>
                        <input
                          type="number"
                          step="5"
                          min="30"
                          max="120"
                          value={profile.bedTemp}
                          onChange={(e) => onChangeProfile({ bedTemp: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                        />
                      </div>
                    </div>

                    <div className="pt-1.5 border-t studio-border space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="studio-text-secondary">Quạt làm mát chi tiết (Part Fan)</span>
                        <span className="font-mono studio-text-gold font-bold">
                          {profile.coolingFanSpeed}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={profile.coolingFanSpeed}
                        onChange={(e) =>
                          onChangeProfile({ coolingFanSpeed: Number(e.target.value) })
                        }
                        className="w-full cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Volumetric Flow & Retraction */}
                  <div className="p-3 rounded-xl studio-card space-y-2.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="studio-text-primary font-semibold flex items-center gap-1.5">
                        <IconFlow size={12} className="studio-text-gold" />
                        <span>Lưu lượng đùn tối đa</span>
                      </span>
                      <span className="font-mono font-semibold studio-text-gold">
                        {profile.flowRateMm3s || 21} mm³/s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="35"
                      step="1"
                      value={profile.flowRateMm3s || 21}
                      onChange={(e) => onChangeProfile({ flowRateMm3s: Number(e.target.value) })}
                      className="w-full cursor-pointer"
                    />

                    <div className="grid grid-cols-3 gap-2 pt-1.5 border-t studio-border">
                      <div className="space-y-1">
                        <span className="text-[10px] studio-text-secondary">Flow Ratio</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.80"
                          max="1.20"
                          value={profile.flowRatio ?? 0.98}
                          onChange={(e) => onChangeProfile({ flowRatio: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] studio-text-secondary">Rút nhựa</span>
                        <input
                          type="number"
                          step="0.2"
                          min="0"
                          max="6"
                          value={profile.retractionDistanceMm ?? 0.8}
                          onChange={(e) =>
                            onChangeProfile({ retractionDistanceMm: Number(e.target.value) })
                          }
                          className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] studio-text-secondary">Z-Hop (mm)</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          value={profile.zHopMm ?? 0.4}
                          onChange={(e) => onChangeProfile({ zHopMm: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {onOpenGeminiKeyModal && (
                    <button
                      type="button"
                      onClick={onOpenGeminiKeyModal}
                      className="w-full py-2 px-3 rounded-xl studio-card hover:bg-[var(--bg-hover)] text-left transition-all cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 studio-text-secondary">
                        <IconKeyMinimal size={12} className="studio-text-gold" />
                        <span>Cấu hình Gemini API Key</span>
                      </div>
                      <span className="text-[10px] studio-text-gold font-semibold">Mở →</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
