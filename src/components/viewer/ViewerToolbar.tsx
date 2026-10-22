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
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 vision-glass rounded-2xl text-white">
      {/* Toggles & View Mode */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Slicer Toolpath Mode Toggle */}
        {onToggleViewMode && (
          <button
            type="button"
            onClick={onToggleViewMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              options.viewMode === 'toolpath'
                ? 'bg-white/30 text-white border-white/40 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/15'
            }`}
            title="Chuyển đổi: Màu Vật Liệu ⟷ Màu Đường In Slicer (Outer, Inner, Support)"
          >
            <Layers className="w-3.5 h-3.5 text-white/90" />
            <span>{options.viewMode === 'toolpath' ? 'Đường In Slicer: BẬT' : 'Màu Đường In Slicer'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleWireframe}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
            options.wireframe
              ? 'bg-white/30 text-white border-white/40 shadow-sm'
              : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/15'
          }`}
          title="Bật/Tắt chế độ khung lưới Wireframe"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Wireframe</span>
        </button>

        <button
          type="button"
          onClick={onToggleAutoRotate}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
            options.autoRotate
              ? 'bg-white/30 text-white border-white/40 shadow-sm'
              : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/15'
          }`}
          title="Bật/Tắt tự động xoay mô hình"
        >
          <RotateCw className={`w-3.5 h-3.5 ${options.autoRotate ? 'animate-spin' : ''}`} />
          <span>Tự xoay</span>
        </button>

        <button
          type="button"
          onClick={onToggleGrid}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
            options.showGrid
              ? 'bg-white/30 text-white border-white/40 shadow-sm'
              : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/15'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              options.showDimensions
                ? 'bg-white/30 text-white border-white/40 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/15'
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
        <div className="flex items-center gap-1 bg-black/25 p-1 rounded-full border border-white/10 text-[11px]">
          <span className="text-white/60 px-2 font-medium flex items-center gap-1">
            <Compass className="w-3 h-3 text-white/80" /> Góc đặt:
          </span>
          <button
            type="button"
            onClick={() => onSetOrientation(0)}
            className={`px-2.5 py-0.5 rounded-full transition-all font-medium ${
              options.orientationDeg === 0
                ? 'bg-white/30 text-white font-bold shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
            title="Đặt nằm phẳng trên bàn in (0°)"
          >
            0° (Phẳng)
          </button>
          <button
            type="button"
            onClick={() => onSetOrientation(45)}
            className={`px-2.5 py-0.5 rounded-full transition-all font-medium ${
              options.orientationDeg === 45
                ? 'bg-white/30 text-white font-bold shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
            title="Nghiêng 45° tối ưu giảm diện tích bám support"
          >
            45° (Tối ưu)
          </button>
          <button
            type="button"
            onClick={() => onSetOrientation(90)}
            className={`px-2.5 py-0.5 rounded-full transition-all font-medium ${
              options.orientationDeg === 90
                ? 'bg-white/30 text-white font-bold shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
            title="Dựng đứng thẳng (90°)"
          >
            90° (Đứng)
          </button>
          {onRotateStep && (
            <button
              type="button"
              onClick={onRotateStep}
              className="px-2 py-0.5 rounded-full text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-colors font-medium flex items-center gap-1 ml-0.5"
              title="Xoay thêm +90° quanh trục X"
            >
              <RotateCw className="w-2.5 h-2.5 text-white/80" />
              <span>+90°</span>
            </button>
          )}
        </div>
      )}

      {/* Color Presets */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/60 hidden sm:inline flex items-center gap-1">
          <Palette className="w-3 h-3" /> Màu:
        </span>
        <div className="flex items-center gap-1.5">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.color}
              type="button"
              onClick={() => onColorChange(p.color)}
              title={p.name}
              className={`w-5 h-5 rounded-full transition-all border ${
                options.materialColor === p.color ? 'scale-125 border-white ring-2 ring-white/50' : 'border-white/20 hover:scale-110'
              }`}
              style={{ backgroundColor: p.color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
