'use client';

import React from 'react';
import { Loader2 } from '@/components/icons/MinimalIcons';

interface GenerationProgressProps {
  progress: number;
  currentStep: string;
}

export function GenerationProgress({ progress, currentStep }: GenerationProgressProps) {
  const steps = [
    { label: 'Tách nền ảnh 2D', minProgress: 20 },
    { label: 'Phân tích hình học không gian', minProgress: 50 },
    { label: 'Dựng lưới đa giác 3D Mesh', minProgress: 80 },
    { label: 'Bake Texture & Manifold STL', minProgress: 100 },
  ];

  return (
    <div className="p-4 rounded-2xl border border-cyan-300/80 bg-cyan-50/80 backdrop-blur-md space-y-3 shadow-xs">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 font-bold text-cyan-950">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-700" />
          {currentStep}
        </span>
        <span className="font-extrabold text-cyan-800 text-sm font-mono">{progress}%</span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden p-0.5">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 rounded-full transition-all duration-300 shadow-sm"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 4 Steps Indicator */}
      <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-1 text-slate-500">
        {steps.map((st) => {
          const isDone = progress >= st.minProgress;
          return (
            <div
              key={st.label}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isDone ? 'text-cyan-900 font-bold' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  isDone ? 'bg-cyan-600' : 'bg-slate-300'
                }`}
              />
              <span className="truncate w-full">{st.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
