'use client';

import React from 'react';
import { Sparkles, Ship, Bot, Flame, Cog, Shield, Fan, Landmark } from '@/components/icons/MinimalIcons';
import { SAMPLE_PRINT_MODELS, SampleModelId, ISamplePrintModel } from '@/backend/domain/sample-models';

interface SampleModelSelectorProps {
  selectedModelId: SampleModelId;
  onSelectModel: (model: ISamplePrintModel) => void;
  disabled?: boolean;
}

const ICONS: Record<SampleModelId, React.ComponentType<{ className?: string }>> = {
  benchy: Ship,
  dragon: Flame,
  robot: Bot,
  gear: Cog,
  helmet: Shield,
  turbine: Fan,
  eiffel: Landmark,
  custom: Sparkles,
};

export function SampleModelSelector({
  selectedModelId,
  onSelectModel,
  disabled,
}: SampleModelSelectorProps) {
  return (
    <div className="vision-glass rounded-[24px] p-4 space-y-3 border border-slate-200/90 bg-white/80 shadow-xs">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>Mô Hình In Mẫu Có Sẵn Để Xem Mô Phỏng In (Sample Presets):</span>
        </span>
        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
          Click để nạp ngay vào bàn in 3D
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2">
        {SAMPLE_PRINT_MODELS.map((item) => {
          const isSelected = selectedModelId === item.id;
          const Icon = ICONS[item.id] || Ship;

          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectModel(item)}
              className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between backdrop-blur-xl ${
                isSelected
                  ? 'bg-cyan-50/95 border-cyan-500 text-cyan-950 shadow-sm ring-1 ring-cyan-500'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-cyan-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold truncate" title={item.name}>
                  {item.name.split(' - ')[0]}
                </span>
              </div>

              <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                <span className="font-mono text-slate-600 truncate text-[10px]">
                  {item.defaultDimensionsMm.x}×{item.defaultDimensionsMm.y}×{item.defaultDimensionsMm.z}mm
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-full font-bold text-[9px] border shrink-0 ${
                    item.recommendedSupport === 'tree'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {item.recommendedSupport === 'tree' ? 'Tree' : 'NoSup'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
