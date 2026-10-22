'use client';

import React from 'react';
import { GitBranch, Shield, Sparkles, Check, AlertCircle, Info } from '@/components/icons/MinimalIcons';
import { ISupportConfig, SupportType, IPrintEstimation } from '@/backend/domain/slicing';
import { SampleModelId } from '@/backend/domain/sample-models';

interface SupportConfigPanelProps {
  supportConfig: ISupportConfig;
  onUpdateSupport: (patch: Partial<ISupportConfig>) => void;
  estimation: IPrintEstimation;
  selectedModelId?: SampleModelId;
  disabled?: boolean;
}

export function SupportConfigPanel({
  supportConfig,
  onUpdateSupport,
  estimation,
  selectedModelId = 'benchy',
  disabled,
}: SupportConfigPanelProps) {
  const isRecommendedActive = supportConfig.type === estimation.aiSupportRecommendation.suggestedType;

  return (
    <div className="space-y-3.5 p-4 rounded-[24px] vision-glass border border-slate-200/90 bg-white/85 shadow-xs">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-cyan-600" />
          <span>Hệ Thống Support In 3D (Support Prefs):</span>
        </label>

        {/* Support Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={supportConfig.enabled}
            onChange={(e) => onUpdateSupport({ enabled: e.target.checked })}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
          <span className="ml-2 text-xs font-bold text-slate-800">
            {supportConfig.enabled ? 'BẬT' : 'TẮT'}
          </span>
        </label>
      </div>

      {/* Model-specific Real-World Advice Notice */}
      {selectedModelId === 'gear' && supportConfig.enabled && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 backdrop-blur-md">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>Cảnh báo in bánh răng:</strong> Mô hình cơ khí tự thoát góc 45°. Không nên bật support để tránh kẹt các rãnh răng chuyển động!
          </span>
        </div>
      )}

      {selectedModelId === 'dragon' && supportConfig.enabled && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 backdrop-blur-md">
          <Info className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>
            <strong>Tree Support Rồng Chuẩn:</strong> Các nhánh cây uốn lượn ôm sát cằm và sừng, tự động né tránh hoàn toàn các khớp cầu xoay (*Print-in-Place*).
          </span>
        </div>
      )}

      {selectedModelId === 'helmet' && supportConfig.enabled && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 backdrop-blur-md">
          <Info className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>
            <strong>Tree Support Nón Giáp:</strong> Hệ thống cành cây ôm khít vòm cằm màng lọc, ốp má và cụm tai nghe 2 bên, để hở mặt kính visor.
          </span>
        </div>
      )}

      {selectedModelId === 'turbine' && supportConfig.enabled && (
        <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs flex items-center gap-2 backdrop-blur-md">
          <Info className="w-4 h-4 shrink-0 text-cyan-600" />
          <span>
            <strong>Support Động Cơ Phản Lực:</strong> Trụ đỡ kiên cố mép miệng hút gió tròn phía trước và bụng dưới thân vỏ nacelle.
          </span>
        </div>
      )}

      {selectedModelId === 'eiffel' && supportConfig.enabled && (
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs flex items-center gap-2 backdrop-blur-md">
          <Info className="w-4 h-4 shrink-0 text-cyan-600" />
          <span>
            <strong>Tree Support Tháp Eiffel:</strong> Chùm cành cây hội tụ nâng đỡ mặt trần vòm La Mã trung tâm dưới sàn quan sát tầng 1.
          </span>
        </div>
      )}

      {supportConfig.enabled && (
        <div className="space-y-3 pt-1">
          {/* Support Type Radio Options */}
          <div className="grid grid-cols-2 gap-2">
            {/* Tree Support */}
            <div
              onClick={() => !disabled && onUpdateSupport({ type: 'tree' })}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between backdrop-blur-xl ${
                supportConfig.type === 'tree'
                  ? 'bg-emerald-50/95 border-emerald-400 text-emerald-950 shadow-xs ring-1 ring-emerald-400'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-900">
                  <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tree Support (Cây)</span>
                </span>
                {supportConfig.type === 'tree' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Ôm sát mô hình, tiết kiệm ~45% nhựa, dễ bóc tách bằng tay 0 vết sẹo.
              </p>
            </div>

            {/* Normal Support */}
            <div
              onClick={() => !disabled && onUpdateSupport({ type: 'normal' })}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between backdrop-blur-xl ${
                supportConfig.type === 'normal'
                  ? 'bg-cyan-50/95 border-cyan-400 text-cyan-950 shadow-xs ring-1 ring-cyan-400'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-900">
                  <Shield className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Normal Support (Cột)</span>
                </span>
                {supportConfig.type === 'normal' && <Check className="w-3.5 h-3.5 text-cyan-600" />}
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Chắc chắn và kiên cố, phù hợp cho bề mặt phẳng ngang lớn.
              </p>
            </div>
          </div>

          {/* Overhang Threshold Slider */}
          <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-700 px-0.5">
              <span className="font-medium">Ngưỡng góc nghiêng Overhang:</span>
              <span className="font-mono font-bold text-cyan-900">
                {supportConfig.overhangThresholdDegrees}°
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="65"
              step="1"
              value={supportConfig.overhangThresholdDegrees}
              onChange={(e) => onUpdateSupport({ overhangThresholdDegrees: Number(e.target.value) })}
              disabled={disabled}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
              <span>40° (Nhiều)</span>
              <span>50° (Chuẩn FDM)</span>
              <span>65° (Ít)</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Support Recommendation Box */}
      <div className="p-3.5 rounded-2xl bg-cyan-50/80 border border-cyan-200 space-y-1.5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-cyan-950 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>AI Slicing Advisor Đề Xuất:</span>
          </span>
          {!isRecommendedActive && (
            <button
              type="button"
              onClick={() => onUpdateSupport({ enabled: true, type: estimation.aiSupportRecommendation.suggestedType })}
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white transition-all shadow-xs"
            >
              Áp dụng ngay
            </button>
          )}
        </div>
        <p className="text-xs text-cyan-900/80 leading-relaxed">
          {estimation.aiSupportRecommendation.reason}
        </p>
      </div>
    </div>
  );
}
