'use client';

import React, { useState } from 'react';
import { PlusCircle, X, Loader2, CheckCircle2, Brain, Sparkles, Layers, Sliders, Thermometer, Gauge } from '@/components/icons/MinimalIcons';
import { PlatformType } from '@/backend/domain/models';

interface ManualIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualIngest: (payload: any) => Promise<any>;
}

export function ManualIngestModal({ isOpen, onClose, onManualIngest }: ManualIngestModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('manual');
  const [category, setCategory] = useState('Community Slicing Profiles');
  const [filamentType, setFilamentType] = useState('PLA Basic');
  const [layerHeightMm, setLayerHeightMm] = useState(0.20);
  const [wallLoops, setWallLoops] = useState(3);
  const [infillPercent, setInfillPercent] = useState(15);
  const [speedMmS, setSpeedMmS] = useState(60);
  const [nozzleTempC, setNozzleTempC] = useState(215);
  const [bedTempC, setBedTempC] = useState(60);
  const [problemSolved, setProblemSolved] = useState('');
  const [proTips, setProTips] = useState('');
  const [slicerNotes, setSlicerNotes] = useState('');
  const [saveToObsidian, setSaveToObsidian] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg(null);

    const proTipsArray = proTips
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const tags = [
      'manual_entry',
      filamentType.split(' ')[0].toLowerCase(),
      category.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    ];

    try {
      const res = await onManualIngest({
        title: title.trim(),
        author: author.trim() || 'Maker Cộng Đồng',
        platform,
        category,
        filamentType,
        layerHeightMm: Number(layerHeightMm),
        wallLoops: Number(wallLoops),
        infillPercent: Number(infillPercent),
        speedMmS: Number(speedMmS),
        nozzleTempC: Number(nozzleTempC),
        bedTempC: Number(bedTempC),
        problemSolved: problemSolved.trim(),
        proTips: proTipsArray,
        slicerNotes: slicerNotes.trim(),
        tags,
        saveToObsidian,
      });

      if (res.success) {
        setSuccessMsg('Đã nạp thành công mô hình & tri thức vào hệ thống và Obsidian Vault!');
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      console.error('Lỗi nạp thủ công:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-violet-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-violet-950/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-violet-300">
              <PlusCircle className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>Nạp Dữ Liệu &amp; Tri Thức Thủ Công</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-400/30 font-mono">
                  Manual Ingestion
                </span>
              </h4>
              <p className="text-[11px] text-white/50">
                Thêm mô hình mới, profile in cá nhân hoặc mẹo thực chiến vào kho Crawler &amp; Obsidian Vault
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white/80 hover:text-rose-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-white/85">Tiêu đề mô hình hoặc Bài mẹo in (*):</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Voron Stealthburner Dual-5015 Fan Mod hoặc Mẹo in TPU không tơ"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-400/60 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/85">Tác giả / Kỹ sư chia sẻ:</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="VD: Nero3D, Maker Việt Nam, Tuấn Anh..."
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-400/60 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/85">Nguồn / Nền tảng:</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-violet-400/60 transition-all"
              >
                <option value="manual">Tự đúc kết (Manual Experience)</option>
                <option value="reddit">Reddit (r/3Dprinting &amp; r/BambuLab)</option>
                <option value="community-forum">Diễn đàn (Bambu / Voron / Prusa)</option>
                <option value="makerworld">MakerWorld (Bambu Lab)</option>
                <option value="printables">Printables (Prusa)</option>
                <option value="thangs">Thangs 3D</option>
                <option value="cults3d">Cults3D</option>
              </select>
            </div>
          </div>

          {/* Section 2: Material & Slicer Settings */}
          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
            <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Thông Số Cắt Lớp &amp; Vật Liệu Đã Cân Chỉnh:</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] text-white/60 block">Loại nhựa:</label>
                <input
                  type="text"
                  value={filamentType}
                  onChange={(e) => setFilamentType(e.target.value)}
                  placeholder="PLA Basic"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/60 block">Layer Height (mm):</label>
                <input
                  type="number"
                  step="0.02"
                  value={layerHeightMm}
                  onChange={(e) => setLayerHeightMm(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/60 block">Số tường (Walls):</label>
                <input
                  type="number"
                  value={wallLoops}
                  onChange={(e) => setWallLoops(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/60 block">Infill (%):</label>
                <input
                  type="number"
                  value={infillPercent}
                  onChange={(e) => setInfillPercent(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/60 block">Tốc độ ngoài (mm/s):</label>
                <input
                  type="number"
                  value={speedMmS}
                  onChange={(e) => setSpeedMmS(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/60 block">Nhiệt độ Nozzle (°C):</label>
                <input
                  type="number"
                  value={nozzleTempC}
                  onChange={(e) => setNozzleTempC(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/60 block">Nhiệt độ Bed (°C):</label>
                <input
                  type="number"
                  value={bedTempC}
                  onChange={(e) => setBedTempC(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/60 block">Chuyên mục:</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Technical Notes & Pro Tips */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/85">Giải trình kỹ thuật / Lý do chọn thông số này:</label>
            <textarea
              rows={2}
              value={slicerNotes}
              onChange={(e) => setSlicerNotes(e.target.value)}
              placeholder="VD: Giảm tốc độ Outer Wall để triệt tiêu biến thiên lưu lượng nhựa; tăng quạt làm mát 100%..."
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-400/60 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/85">Vấn đề hoặc Lỗi in đã khắc phục (Troubleshooting):</label>
            <textarea
              rows={2}
              value={problemSolved}
              onChange={(e) => setProblemSolved(e.target.value)}
              placeholder="VD: Khắc phục hiện tượng cong góc đáy khi in bàn PEI không dùng keo dán..."
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-400/60 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/85">Mẹo thực chiến (Mỗi dòng một mẹo):</label>
            <textarea
              rows={2}
              value={proTips}
              onChange={(e) => setProTips(e.target.value)}
              placeholder="Dùng nước ấm và xà phòng rửa sạch bàn in PEI&#10;Đặt quạt làm mát 100% ở tầng cao hơn"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-400/60 transition-all"
            />
          </div>

          {/* Obsidian Vault Sync Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 cursor-pointer">
            <input
              type="checkbox"
              checked={saveToObsidian}
              onChange={(e) => setSaveToObsidian(e.target.checked)}
              className="w-4 h-4 rounded text-violet-500 focus:ring-violet-400"
            />
            <div className="text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-300" />
                <span>Tự động xuất thành tệp Markdown lưu vào Obsidian Knowledge Vault</span>
              </span>
              <p className="text-[11px] text-white/60">
                Cho phép AI tra cứu và đối chiếu vĩnh viễn khi phân tích các mẫu tương tự sau này.
              </p>
            </div>
          </label>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-violet-500/25 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang Lưu Tri Thức...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Lưu Vào Kho Dữ Liệu &amp; Sàn</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
