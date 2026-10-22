'use client';

import React from 'react';
import { Maximize2, Link2, Unlink, AlertTriangle, Zap } from '@/components/icons/MinimalIcons';
import { IPrintEstimation, IPrinterProfile } from '@/backend/domain/slicing';

interface DimensionsControlProps {
  dimensionsMm: { x: number; y: number; z: number };
  onUpdateDimension: (axis: 'x' | 'y' | 'z', valueMm: number) => void;
  scalePercent: number;
  onUpdateScale: (percent: number) => void;
  isUniformScale: boolean;
  onToggleUniformScale: () => void;
  selectedPrinter: IPrinterProfile;
  estimation: IPrintEstimation;
  disabled?: boolean;
}

export function DimensionsControl({
  dimensionsMm,
  onUpdateDimension,
  scalePercent,
  onUpdateScale,
  isUniformScale,
  onToggleUniformScale,
  selectedPrinter,
  estimation,
  disabled,
}: DimensionsControlProps) {
  // Tự động tính toán scale tối đa vừa khít bàn in (chừa lề 25mm an toàn)
  const handleAutoFitToBed = () => {
    const usableX = selectedPrinter.bedDimensions.x - 25;
    const usableY = selectedPrinter.bedDimensions.y - 25;
    const usableZ = selectedPrinter.bedDimensions.z - 25;

    const currentScale = scalePercent / 100;
    const baseX = dimensionsMm.x / currentScale;
    const baseY = dimensionsMm.y / currentScale;
    const baseZ = dimensionsMm.z / currentScale;

    const maxScaleX = usableX / baseX;
    const maxScaleY = usableY / baseY;
    const maxScaleZ = usableZ / baseZ;

    const maxFit = Math.min(maxScaleX, maxScaleY, maxScaleZ);
    const targetPercent = Math.min(250, Math.max(30, Math.floor(maxFit * 100)));
    onUpdateScale(targetPercent);
  };

  return (
    <div className="space-y-3.5 p-4 rounded-[24px] vision-glass border border-slate-200/90 bg-white/85 shadow-xs">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Maximize2 className="w-3.5 h-3.5 text-cyan-600" />
          <span>Kích Thước &amp; Phóng To/Thu Nhỏ (Scale):</span>
        </label>

        {/* Uniform scale lock button */}
        <button
          type="button"
          onClick={onToggleUniformScale}
          disabled={disabled}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
            isUniformScale
              ? 'bg-cyan-50 text-cyan-800 border-cyan-300 shadow-xs'
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
          }`}
          title={isUniformScale ? 'Khóa tỷ lệ 3 chiều đồng nhất' : 'Tự do chỉnh từng trục'}
        >
          {isUniformScale ? <Link2 className="w-3 h-3 text-cyan-600" /> : <Unlink className="w-3 h-3 text-slate-400" />}
          <span>{isUniformScale ? 'Khóa Tỷ Lệ (1:1)' : 'Tự Do'}</span>
        </button>
      </div>

      {/* Quick Action Presets (Auto-Fit, 100% Gốc, 60% Mini, 150% Lớn) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={handleAutoFitToBed}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold transition-all shadow-xs active:scale-95"
          title={`Tự động phóng to tối đa vừa khít bàn in ${selectedPrinter.name}`}
        >
          <Zap className="w-3 h-3 text-amber-600" />
          <span>⚡ Auto-Fit Khổ Máy</span>
        </button>

        <button
          type="button"
          onClick={() => onUpdateScale(100)}
          disabled={disabled}
          className={`py-1.5 px-3 rounded-xl border text-[11px] font-bold transition-all ${
            scalePercent === 100
              ? 'bg-cyan-50 border-cyan-400 text-cyan-900 shadow-xs'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
          }`}
        >
          100% Gốc
        </button>

        <button
          type="button"
          onClick={() => onUpdateScale(60)}
          disabled={disabled}
          className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-[11px] font-medium transition-all"
        >
          60% Mini
        </button>

        <button
          type="button"
          onClick={() => onUpdateScale(150)}
          disabled={disabled}
          className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-[11px] font-medium transition-all"
        >
          150% Lớn
        </button>
      </div>

      {/* Inputs for X, Y, Z */}
      <div className="grid grid-cols-3 gap-2">
        {(['x', 'y', 'z'] as const).map((axis) => {
          const maxDimension = selectedPrinter.bedDimensions[axis];
          const isAxisOver = dimensionsMm[axis] > maxDimension;

          return (
            <div key={axis} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] px-1">
                <span className="font-bold uppercase text-slate-700">Trục {axis}:</span>
                <span className="text-[10px] text-slate-500 font-mono">Max {maxDimension}mm</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="1000"
                  value={dimensionsMm[axis]}
                  onChange={(e) => onUpdateDimension(axis, Number(e.target.value))}
                  disabled={disabled}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border text-center focus:outline-none transition-all ${
                    isAxisOver
                      ? 'border-rose-400 bg-rose-50 text-rose-800'
                      : 'border-slate-300 bg-white text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                  }`}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                  mm
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scale Slider */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-700 px-0.5">
          <span className="font-medium">Tỷ lệ phóng to/thu nhỏ (Scale):</span>
          <span className="font-mono font-bold text-cyan-900">{scalePercent}%</span>
        </div>
        <input
          type="range"
          min="30"
          max="250"
          step="5"
          value={scalePercent}
          onChange={(e) => onUpdateScale(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
          <span>30%</span>
          <span>100% (Gốc)</span>
          <span>250% (Max)</span>
        </div>
      </div>

      {/* Out of bounds Warning Alert */}
      {estimation.isOutOfBounds && (
        <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>
            <strong>Vượt quá khổ in:</strong> Kích thước mô hình vượt quá giới hạn trục [
            {estimation.outOfBoundsAxes.join(', ')}] của máy {selectedPrinter.name}. Bấm nút &quot;⚡ Auto-Fit Khổ Máy&quot; ở trên để tự động thu nhỏ vừa khít!
          </span>
        </div>
      )}
    </div>
  );
}
