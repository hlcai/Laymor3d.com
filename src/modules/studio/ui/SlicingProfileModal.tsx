'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  Thermometer,
  Wind,
  Info,
  ExternalLink,
  Flame,
  Award,
} from '@/components/icons/MinimalIcons';
import { ISlicerProfilePreset, IPrinterProfile } from '@/backend/domain/slicing';
import { IModel3D } from '@/backend/domain/models';

interface SlicingProfileModalProps {
  model: IModel3D | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SlicingProfileModal({ model, isOpen, onClose }: SlicingProfileModalProps) {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('bambu-x1c-p1s');
  const [printers, setPrinters] = useState<IPrinterProfile[]>([]);
  const [profile, setProfile] = useState<ISlicerProfilePreset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !model) return;

    setIsLoading(true);
    fetch(`/api/slicing/profile?modelId=${encodeURIComponent(model.id)}&printerId=${selectedPrinterId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.profile);
          if (data.availablePrinters) {
            setPrinters(data.availablePrinters);
          }
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [isOpen, model, selectedPrinterId]);

  if (!isOpen || !model) return null;

  const handleDownloadJson = () => {
    const downloadUrl = `/api/slicing/profile?modelId=${encodeURIComponent(model.id)}&printerId=${selectedPrinterId}&format=download`;
    window.open(downloadUrl, '_blank');
  };

  const handleCopySummary = () => {
    if (!profile) return;
    const summary = `
[THÔNG SỐ IN ORCASLICER CHUẨN - 3D HUB]
Mô hình: ${model.title}
Máy in: ${profile.printerName}
Vật liệu: ${profile.filamentType}
- Nhiệt độ vòi phun: ${profile.nozzleTemperatureC}°C (Lớp đầu: ${profile.initialLayerNozzleTempC}°C)
- Nhiệt độ bàn in: ${profile.bedTemperatureC}°C
- Độ cao lớp: ${profile.layerHeightMm}mm (Lớp đầu: ${profile.initialLayerHeightMm}mm)
- Số viền ngoài: ${profile.wallLoops} loops
- Độ đặc ruột: ${profile.infillDensityPercent}% (${profile.infillPattern.toUpperCase()})
- Mối nối: Scarf Joint Seam (45° angle) - Giấu 90% vết nối
- Support: ${profile.supportEnabled ? 'Tree Support Organic (0.2mm Z-distance)' : 'Không cần support'}
- Lưu ý: ${profile.communityTips.join('\n- ')}
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="vision-glass-panel rounded-[36px] w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20 p-6 sm:p-8 space-y-6 shadow-2xl relative text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 pr-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2DD4BF]/30 to-[#0F766E]/40 border border-[#2DD4BF]/40 flex items-center justify-center text-[#2DD4BF] shrink-0 shadow-lg shadow-[#2DD4BF]/15">
            <Zap className="w-6 h-6 text-[#5EEAD4]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#2DD4BF]/20 text-[#5EEAD4] border border-[#2DD4BF]/30">
                OrcaSlicer / Bambu Studio Ready
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                Tiết Kiệm ~22% Giờ Máy
              </span>
              {profile?.crossCheckedRulesCount && profile.crossCheckedRulesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Đối chiếu {profile.crossCheckedRulesCount} quy tắc ({profile.confidenceScore}% tin cậy)</span>
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-1">
              Profile In Chuẩn Đẹp &amp; Tối Ưu Tốc Độ
            </h3>
            <p className="text-xs text-white/70 line-clamp-1">
              Mô hình: <strong className="text-white">{model.title}</strong> ({model.author})
            </p>
          </div>
        </div>

        {/* Risk Warnings Banner if any */}
        {profile?.riskWarnings && profile.riskWarnings.length > 0 && (
          <div className="space-y-2">
            {profile.riskWarnings.map((warn, wIdx) => (
              <div
                key={wIdx}
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 backdrop-blur-md ${
                  warn.severity === 'high'
                    ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                    : 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                }`}
              >
                <Flame className="w-4 h-4 shrink-0 text-amber-300 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <span>{warn.title}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-black bg-rose-500/30 text-rose-200">
                      {warn.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">{warn.description}</p>
                  <p className="text-[11px] font-semibold text-white pt-0.5">
                    👉 Khuyến nghị xử lý: {warn.suggestedFix}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Printer Selector */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white/80">
            <Cpu className="w-4 h-4 text-[#2DD4BF]" />
            <span>Dòng Máy In Của Bạn:</span>
          </div>
          <select
            value={selectedPrinterId}
            onChange={(e) => setSelectedPrinterId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400 cursor-pointer"
          >
            {printers.length > 0 ? (
              printers.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name} ({p.manufacturer})
                </option>
              ))
            ) : (
              <option value="bambu-x1c-p1s" className="bg-slate-900 text-white">
                Bambu Lab X1-Carbon / P1S / A1
              </option>
            )}
          </select>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#2DD4BF] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-white/60">Đang tính toán thông số cắt lớp theo hình học mô hình...</p>
          </div>
        )}

        {/* Parameters Grid */}
        {!isLoading && profile && (
          <div className="space-y-5">
            {/* Grid 4 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Box 1: Temps */}
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-white/60 uppercase flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-rose-300" /> Nhiệt Độ
                </span>
                <div className="text-sm font-black text-rose-200">
                  {profile.nozzleTemperatureC}°C / {profile.bedTemperatureC}°C
                </div>
                <div className="text-[10px] text-white/50">Lớp 1: {profile.initialLayerNozzleTempC}°C</div>
              </div>

              {/* Box 2: Layers & Walls */}
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-white/60 uppercase flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-300" /> Lớp &amp; Vỏ Viền
                </span>
                <div className="text-sm font-black text-cyan-200">
                  {profile.layerHeightMm}mm • {profile.wallLoops} Walls
                </div>
                <div className="text-[10px] text-white/50">Top: {profile.topShellLayers} | Bot: {profile.bottomShellLayers}</div>
              </div>

              {/* Box 3: Infill Pattern */}
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-white/60 uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Ruột Đặc (Infill)
                </span>
                <div className="text-sm font-black text-amber-200 uppercase">
                  {profile.infillDensityPercent}% {profile.infillPattern}
                </div>
                <div className="text-[10px] text-emerald-300 font-medium">Chống va đầu in CoreXY</div>
              </div>

              {/* Box 4: Seam & Speed */}
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-white/60 uppercase flex items-center gap-1">
                  <Wind className="w-3 h-3 text-emerald-300" /> Mối Nối (Seam)
                </span>
                <div className="text-sm font-black text-emerald-200">
                  Scarf Joint 45°
                </div>
                <div className="text-[10px] text-white/50">Giấu 90% bavia nối</div>
              </div>
            </div>

            {/* Detailed Parameters List */}
            <div className="p-4 rounded-2xl bg-black/25 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-white/70">Loại nhựa khuyến nghị:</span>
                <span className="font-bold text-white font-mono">{profile.filamentType}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-white/70">Tốc độ in thành ngoài (Outer Wall):</span>
                <span className="font-bold text-emerald-300 font-mono">{profile.printSpeedOuterWallMmS} mm/s (Độ mịn cao)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-white/70">Cấu hình Tree Support:</span>
                <span className="font-bold text-white font-mono">
                  {profile.supportEnabled ? 'Tree Support Organic (0.2mm Z-top)' : 'Không cần bật support'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-white/70">Kiểu viền chân bám (Brim):</span>
                <span className="font-bold text-white font-mono uppercase">{profile.brimType} (5mm)</span>
              </div>
            </div>

            {/* Practical Community Tips Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Kinh Nghiệm Thực Tiễn Từ Cộng Đồng &amp; Khí Hậu Việt Nam:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-white/80 list-disc list-inside">
                {profile.communityTips.map((tip, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-white/70" />}
                <span>{copied ? 'Đã Sao Chép!' : 'Copy Thông Số'}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="w-full sm:w-auto vision-pill-btn px-6 py-2.5 rounded-full text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#2DD4BF]/25"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Profile .JSON Chuẩn OrcaSlicer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
