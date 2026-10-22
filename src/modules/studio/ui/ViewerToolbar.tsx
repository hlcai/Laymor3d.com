'use client';

import React from 'react';
import { RotateCw, Grid, Eye, Palette, Layers, Compass, Ruler } from '@/components/icons/MinimalIcons';
import { ViewerOptions, OrientationDeg } from '@/hooks/useModelViewer';

interface ViewerToolbarProps {
  options: ViewerOptions;
  onToggleWireframe: () => void;
  onToggleAutoRotate: () => void;
  onToggleGrid: () => void;
  onToggleDimensions?: () => void;
  onToggleViewMode?: () => void;
  onSetOrientation?: (deg: OrientationDeg) => void;
  onRotateStep?: () => void;
  onColorChange: (color: string) => void;
  onLightingChange: (val: number) => void;
  onExportSTL?: () => void;
}

const COLOR_PRESETS = [
  { name: 'PLA Indigo', color: '#6366f1' },
  { name: 'Bambu Orange', color: '#f97316' },
  { name: 'Prusa Cyan', color: '#06b6d4' },
  { name: 'Matte Grey', color: '#64748b' },
  { name: 'Silk Gold', color: '#eab308' },
  { name: 'Emerald Green', color: '#10b981' },
];

export function ViewerToolbar({
  options,
  onToggleWireframe,
  onToggleAutoRotate,
  onToggleGrid,
  onToggleDimensions,
  onToggleViewMode,
  onSetOrientation,
  onRotateStep,
  onColorChange,
}: ViewerToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 vision-glass rounded-2xl text-slate-800 border border-slate-200/90 shadow-sm">
      {/* Toggles & View Mode */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Slicer Toolpath Mode Toggle */}
        {onToggleViewMode && (
          <button
            type="button"
            onClick={onToggleViewMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              options.viewMode === 'toolpath'
                ? 'bg-cyan-500 text-white border-cyan-400 shadow-sm'
                : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200 shadow-xs'
            }`}
            title="Chuyển đổi: Màu Vật Liệu ⟷ Màu Đường In Slicer (Outer, Inner, Support)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{options.viewMode === 'toolpath' ? 'Đường In Slicer: BẬT' : 'Màu Đường In Slicer'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleWireframe}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            options.wireframe
              ? 'bg-cyan-500 text-white border-cyan-400 shadow-sm'
              : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200 shadow-xs'
          }`}
          title="Bật/Tắt chế độ khung lưới Wireframe"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Wireframe</span>
        </button>

        <button
          type="button"
          onClick={onToggleAutoRotate}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            options.autoRotate
              ? 'bg-cyan-500 text-white border-cyan-400 shadow-sm'
              : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200 shadow-xs'
          }`}
          title="Bật/Tắt tự động xoay mô hình"
        >
          <RotateCw className={`w-3.5 h-3.5 ${options.autoRotate ? 'animate-spin' : ''}`} />
          <span>Tự xoay</span>
        </button>

        <button
          type="button"
          onClick={onToggleGrid}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            options.showGrid
              ? 'bg-cyan-500 text-white border-cyan-400 shadow-sm'
              : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200 shadow-xs'
          }`}
          title="Bật/Tắt lưới bàn in 3D"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Bàn in</span>
        </button>

        {onToggleDimensions && (
          <button
            type="button"
            onClick={onToggleDimensions}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              options.showDimensions
                ? 'bg-cyan-500 text-white border-cyan-400 shadow-sm'
                : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200 shadow-xs'
            }`}
            title="Bật/Tắt thước đo kích thước 3D (X, Y, Z mm)"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Thước đo mm</span>
          </button>
        )}
      </div>

      {/* Auto-Orientation Options */}
      {onSetOrientation && (
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 text-[11px]">
          <span className="text-slate-600 px-2 font-semibold flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-700" /> Góc đặt:
          </span>
          <button
            type="button"
            onClick={() => onSetOrientation(0)}
            className={`px-2.5 py-0.5 rounded-full transition-all font-semibold ${
              options.orientationDeg === 0
                ? 'bg-cyan-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Đặt nằm phẳng trên bàn in (0°)"
          >
            0° (Phẳng)
          </button>
          <button
            type="button"
            onClick={() => onSetOrientation(45)}
            className={`px-2.5 py-0.5 rounded-full transition-all font-semibold ${
              options.orientationDeg === 45
                ? 'bg-cyan-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Nghiêng 45° tối ưu giảm diện tích bám support"
          >
            45° (Tối ưu)
          </button>
          <button
            type="button"
            onClick={() => onSetOrientation(90)}
            className={`px-2.5 py-0.5 rounded-full transition-all font-semibold ${
              options.orientationDeg === 90
                ? 'bg-cyan-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Dựng đứng thẳng (90°)"
          >
            90° (Đứng)
          </button>
          {onRotateStep && (
            <button
              type="button"
              onClick={onRotateStep}
              className="px-2 py-0.5 rounded-full text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-200 border border-slate-200 transition-colors font-semibold flex items-center gap-1 ml-0.5 shadow-2xs"
              title="Xoay thêm +90° quanh trục X"
            >
              <RotateCw className="w-2.5 h-2.5" />
              <span>+90°</span>
            </button>
          )}
        </div>
      )}

      {/* Color Presets */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600 hidden sm:inline flex items-center gap-1 font-semibold">
          <Palette className="w-3 h-3 text-cyan-700" /> Màu:
        </span>
        <div className="flex items-center gap-1.5">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.color}
              type="button"
              onClick={() => onColorChange(p.color)}
              title={p.name}
              className={`w-5 h-5 rounded-full transition-all border ${
                options.materialColor === p.color ? 'scale-125 border-cyan-500 ring-2 ring-cyan-400/50 shadow-xs' : 'border-slate-300 hover:scale-110'
              }`}
              style={{ backgroundColor: p.color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
