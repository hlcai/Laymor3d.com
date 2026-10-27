'use client';

import React from 'react';
import { Sparkles, Zap, Rocket, Crown, Check, ShieldCheck } from '@/components/icons/MinimalIcons';
import { AITierId, AI_PRINT_TIERS } from '@/backend/domain/ai-tiers';

interface AIPrintTierSelectorProps {
  selectedTier: AITierId;
  onSelectTier: (tierId: AITierId) => void;
  userBalanceVnd?: number;
}

export function AIPrintTierSelector({
  selectedTier,
  onSelectTier,
  userBalanceVnd = 100000,
}: AIPrintTierSelectorProps) {
  const tiers = Object.values(AI_PRINT_TIERS);

  const getTierIcon = (id: AITierId) => {
    switch (id) {
      case 'tripo_fast':
        return <Zap className="w-5 h-5 text-emerald-600" />;
      case 'trellis_pro':
        return <Rocket className="w-5 h-5 text-cyan-600" />;
      case 'meshy_ultra':
        return <Crown className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-3 text-slate-800">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-cyan-600" />
          <span>Chọn Cấp Độ Dựng &amp; In 3D AI</span>
        </label>
        <span className="text-[11px] text-slate-500">
          Số dư ví: <strong className="text-cyan-800 font-mono font-bold">{userBalanceVnd.toLocaleString('vi-VN')} đ</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tiers.map((t) => {
          const isSelected = selectedTier === t.id;

          return (
            <div
              key={t.id}
              onClick={() => onSelectTier(t.id)}
              className={`relative rounded-2xl p-4 cursor-pointer transition-all border flex flex-col justify-between shadow-2xs ${
                isSelected
                  ? 'bg-cyan-50/90 border-cyan-400 shadow-sm ring-2 ring-cyan-400/30 -translate-y-0.5'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.badgeColor}`}>
                  {t.badge}
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-semibold">{t.speedEstimate}</span>
              </div>

              {/* Title & Engine */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                    {getTierIcon(t.id)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                    <span className="text-[10px] font-mono text-cyan-700 font-semibold">{t.engine}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 mb-3 leading-relaxed">
                  {t.description}
                </p>

                {/* Features List */}
                <div className="space-y-1 mb-3 pt-2 border-t border-slate-100">
                  {t.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price & Selection Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-extrabold font-mono text-slate-900">
                      {t.priceVnd.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    ✓ Chuẩn in FDM / SLA 100%
                  </span>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-cyan-600 border-cyan-600 text-white shadow-2xs'
                      : 'border-slate-300 bg-slate-100 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
