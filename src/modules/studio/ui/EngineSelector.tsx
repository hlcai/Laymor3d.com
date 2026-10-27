'use client';

import React from 'react';
import { Zap, Rocket, Crown, Cpu, DollarSign, Clock } from '@/components/icons/MinimalIcons';
import { AIProviderType } from '@/backend/domain/models';

interface EngineSelectorProps {
  selectedEngine: AIProviderType;
  onSelectEngine: (engine: AIProviderType) => void;
  disabled?: boolean;
}

export function EngineSelector({ selectedEngine, onSelectEngine, disabled }: EngineSelectorProps) {
  const ENGINES = [
    {
      id: 'tripo' as AIProviderType,
      name: '1. In Thường (Tripo H3.1 - Watertight)',
      badge: 'Tiết Kiệm 90%',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      cost: '500 đ ($0.02) • Gốc: $0.01',
      speed: '⚡ 5 – 10s',
      description: 'Sinh hình khối 3D siêu tốc, tự động hàn kín nước (Watertight) chuẩn cho máy in FDM cơ bản.',
      icon: Zap,
    },
    {
      id: 'fal-trellis' as AIProviderType,
      name: '2. In Nâng Cao (Trellis 2 - Sắc Nét)',
      badge: 'Khuyên Dùng ⭐',
      badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
      cost: '2.500 đ ($0.10) • Gốc: $0.05',
      speed: '🚀 15 – 25s',
      description: 'Microsoft Trellis 2 tạo cấu trúc góc cạnh hình học sắc nét, thích hợp in đồ gá và chi tiết decor.',
      icon: Rocket,
    },
    {
      id: 'meshy' as AIProviderType,
      name: '3. In Chất Lượng Cao 4K (Meshy 6 Master)',
      badge: 'Ultra 4K PBR 👑',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      cost: '40.000 đ ($1.60) • Gốc: $0.80',
      speed: '👑 45 – 90s',
      description: 'Lưới tứ giác Quad Retopology kết hợp bộ map vân nổi PBR 4K đỉnh cao cho tượng figure & thương mại.',
      icon: Crown,
    },
    {
      id: 'simulation' as AIProviderType,
      name: 'Local Simulator (GPU Nội Bộ)',
      badge: 'Miễn Phí Test',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      cost: '0 đ (Chạy tức thì)',
      speed: '0s',
      description: 'Chế độ mô phỏng thuật toán để test giao diện và viewer 3D không tốn API credit.',
      icon: Cpu,
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Chọn Cấp Độ Xử Lý 3D AI:
        </label>
        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-semibold">
          Giá niêm yết
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {ENGINES.map((engine) => {
          const isSelected = selectedEngine === engine.id;
          const Icon = engine.icon;

          return (
            <div
              key={engine.id}
              onClick={() => !disabled && onSelectEngine(engine.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 backdrop-blur-xl ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-50/80 ring-2 ring-cyan-400/40 shadow-md shadow-cyan-900/5'
                  : 'border-slate-200/90 bg-white/80 hover:border-cyan-300 hover:bg-white shadow-xs'
              } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected
                    ? 'bg-cyan-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">{engine.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${engine.badgeColor}`}>
                    {engine.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{engine.description}</p>
                <div className="flex items-center justify-between text-[11px] font-medium mt-1.5 pt-1.5 border-t border-slate-200/80">
                  <span className="text-emerald-700 font-mono font-bold flex items-center gap-1">
                    <DollarSign className="w-3 h-3 -mr-1" />
                    {engine.cost}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {engine.speed}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
