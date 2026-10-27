'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, DollarSign, Zap, TrendingUp, Copy, Check, ShieldCheck } from '@/components/icons/MinimalIcons';
import { PrintCostCalculator } from '@/backend/services/slicing/PrintCostCalculator';
import { ISupportConfig } from '@/backend/domain/slicing';

interface PrintCostCalculatorProps {
  filamentType: string;
  filamentWeightGrams: number;
  printTimeMinutes: number;
  supportConfig?: ISupportConfig;
  printerWattage?: number;
}

export function PrintCostCalculatorComponent({
  filamentType,
  filamentWeightGrams,
  printTimeMinutes,
  supportConfig,
  printerWattage = 350,
}: PrintCostCalculatorProps) {
  const [marginMultiplier, setMarginMultiplier] = useState<number>(2.5);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const cost = useMemo(() => {
    return PrintCostCalculator.calculateCost({
      filamentType,
      modelWeightGrams: filamentWeightGrams,
      printTimeMinutes,
      printerWattage,
      hasSupport: !!supportConfig?.enabled && supportConfig.type !== 'none',
      supportType: supportConfig?.type || 'none',
      marginMultiplier,
    });
  }, [filamentType, filamentWeightGrams, printTimeMinutes, printerWattage, supportConfig, marginMultiplier]);

  const handleCopyQuote = () => {
    const text = `📋 BÁO GIÁ DỊCH VỤ IN 3D CHÍNH THỨC - 3D HUB VIETNAM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Đơn vị: Công ty CP Công nghệ In 3D Hub
• Hotline: 1900 6833
• Loại nhựa: ${filamentType.toUpperCase()} (Chính hãng 100%)
• Khối lượng: ${filamentWeightGrams}g (Support: +${cost.supportWeightGrams}g)
• Thời gian in: ${Math.floor(printTimeMinutes / 60)}h ${printTimeMinutes % 60}p
• Bảo hành: Bảo hành 1 đổi 1 trong 7 ngày
• Chi phí gia công trọn gói: ${cost.suggestedSellingPriceVnd.toLocaleString('vi-VN')} VNĐ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 TỔNG GIÁ DỊCH VỤ: ${cost.suggestedSellingPriceVnd.toLocaleString('vi-VN')} VNĐ (Đã gồm VAT & đóng gói chuẩn)`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="space-y-4 p-5 rounded-[28px] vision-glass border border-slate-200/90 bg-white/85 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
            <Calculator className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Bóc Tách Chi Phí &amp; Báo Giá Dịch Vụ In 3D</span>
              <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-full text-[10px] font-bold border">
                Niêm Yết Thương Mại
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Tự động tính chi phí nhựa, điện tiêu thụ, khấu hao máy &amp; đề xuất giá bán chuẩn xưởng
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyQuote}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
          title="Sao chép văn bản báo giá cho khách hàng"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
          <span>{isCopied ? 'Đã chép báo giá' : 'Sao chép báo giá'}</span>
        </button>
      </div>

      {/* Main KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cost of Goods */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" /> Giá Vốn Sản Xuất (COGS)
          </span>
          <p className="text-lg font-black text-slate-900 font-mono">
            {cost.totalProductionCostVnd.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">đ</span>
          </p>
          <p className="text-[10px] text-slate-500">
            Gồm {filamentWeightGrams + cost.supportWeightGrams}g nhựa + điện + hao mòn máy
          </p>
        </div>

        {/* Suggested Selling Price */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1 backdrop-blur-xl">
          <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Giá Bán Đề Xuất (Margin {marginMultiplier}x)
          </span>
          <p className="text-xl font-black text-emerald-900 font-mono">
            {cost.suggestedSellingPriceVnd.toLocaleString('vi-VN')} <span className="text-xs font-normal text-emerald-700">đ</span>
          </p>
          <p className="text-[10px] text-emerald-700">
            Mức giá cạnh tranh tiêu chuẩn Maker Việt Nam
          </p>
        </div>

        {/* Estimated Profit */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-600" /> Lợi Nhuận Gộp Ước Tính
          </span>
          <p className="text-lg font-black text-cyan-900 font-mono">
            +{cost.estimatedProfitVnd.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">đ</span>
          </p>
          <p className="text-[10px] text-slate-500">
            Tỷ suất lợi nhuận: <strong className="text-cyan-950">{cost.profitPercentage}%</strong>
          </p>
        </div>
      </div>

      {/* Margin Multiplier Slider */}
      <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between text-xs px-0.5">
          <span className="text-slate-700 font-medium flex items-center gap-1">
            Hệ số biên lợi nhuận (Profit Margin):
          </span>
          <span className="font-mono font-bold text-cyan-900">
            {marginMultiplier}x (Lợi nhuận {cost.profitPercentage}%)
          </span>
        </div>
        <input
          type="range"
          min="1.5"
          max="4.0"
          step="0.1"
          value={marginMultiplier}
          onChange={(e) => setMarginMultiplier(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
          <span>1.5x (Giá hữu nghị)</span>
          <span>2.5x (Tiêu chuẩn thị trường)</span>
          <span>4.0x (Sản phẩm phức tạp / Gấp)</span>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Filament */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">SỢI NHỰA CHÍNH:</span>
          <p className="font-mono font-bold text-slate-900 mt-0.5">
            {cost.modelFilamentCostVnd.toLocaleString('vi-VN')} đ
          </p>
          <span className="text-[10px] text-slate-500">{filamentWeightGrams}g @ {cost.filamentPricePerGram}đ/g</span>
        </div>

        {/* Support */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">NHỰA SUPPORT:</span>
          <p className="font-mono font-bold text-slate-900 mt-0.5">
            {cost.supportCostVnd.toLocaleString('vi-VN')} đ
          </p>
          <span className="text-[10px] text-slate-500">{cost.supportWeightGrams}g ({supportConfig?.type || 'none'})</span>
        </div>

        {/* Power */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">ĐIỆN NĂNG TIÊU THỤ:</span>
          <p className="font-mono font-bold text-slate-900 mt-0.5">
            {cost.powerCostVnd.toLocaleString('vi-VN')} đ
          </p>
          <span className="text-[10px] text-slate-500">{((printTimeMinutes / 60) * 0.15).toFixed(2)} kWh @ 2.500đ</span>
        </div>

        {/* Depreciation */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">KHẤU HAO MÁY IN:</span>
          <p className="font-mono font-bold text-slate-900 mt-0.5">
            {cost.depreciationCostVnd.toLocaleString('vi-VN')} đ
          </p>
          <span className="text-[10px] text-slate-500">{(printTimeMinutes / 60).toFixed(1)}h @ 8.000đ/h</span>
        </div>
      </div>
    </div>
  );
}

export { PrintCostCalculatorComponent as PrintCostCalculator };

