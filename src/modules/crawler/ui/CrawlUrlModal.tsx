'use client';

import React, { useState } from 'react';
import { Link2, X, Loader2, CheckCircle2, Globe, Brain, Sparkles, AlertCircle } from '@/components/icons/MinimalIcons';

interface CrawlUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrawlUrl: (url: string, category?: string) => Promise<any>;
}

export function CrawlUrlModal({ isOpen, onClose, onCrawlUrl }: CrawlUrlModalProps) {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Community Ingested Models');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const res = await onCrawlUrl(url.trim(), category);
      if (res.success && res.result) {
        setResult(res.result);
      } else {
        setError(res.error || res.result?.error || 'Không thể bóc tách dữ liệu từ đường dẫn này.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi mạng khi cào đường dẫn.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sampleUrls = [
    { label: 'YouTube Video', url: 'https://www.youtube.com/watch?v=0kF_3v-eJ0Q' },
    { label: 'MakerWorld', url: 'https://makerworld.com/en/models/42190' },
    { label: 'Printables', url: 'https://www.printables.com/model/3161-3d-benchy' },
    { label: 'Thingiverse', url: 'https://www.thingiverse.com/thing:763622' },
    { label: 'GitHub 3D', url: 'https://github.com/VoronDesign/Voron-Stealthburner' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-teal-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-teal-950/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Link2 className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>Cào Dữ Liệu Theo Link URL &amp; YouTube AI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-400/30 font-mono">
                  Universal Scraper
                </span>
              </h4>
              <p className="text-[11px] text-white/50">
                Tự động bóc tách link web hoặc phân tích video YouTube bằng Gemini AI lưu vào Obsidian Vault
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-teal-300" />
              <span>Dán đường dẫn (URL) mô hình hoặc bài viết 3D:</span>
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://makerworld.com/... hoặc https://printables.com/model/..."
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-teal-400/60 transition-all font-mono"
            />
            {/* Quick Sample Links */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-white/40">Gợi ý mẫu:</span>
              {sampleUrls.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setUrl(s.url)}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-teal-300 cursor-pointer transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80">Phân loại chuyên mục (Category):</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="VD: Mechanical Parts, Figures, Bambu Mods..."
              className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-teal-400/60 transition-all"
            />
          </div>

          {/* Status / Output Feedback */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-3.5 rounded-xl bg-teal-500/15 border border-teal-400/30 text-teal-200 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-teal-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Bóc tách thành công &amp; Đã đồng bộ vào kho dữ liệu!</span>
              </div>
              <div className="space-y-1 text-white/85 text-[11px]">
                <p>• <strong>Mô hình:</strong> {result.model?.title}</p>
                <p>• <strong>Tác giả:</strong> {result.model?.author} ({result.model?.platform})</p>
                <p>• <strong>Nhựa khuyến nghị:</strong> {result.model?.filamentType}</p>
                {result.obsidianNotePath && (
                  <p className="flex items-center gap-1 text-purple-300 font-mono pt-1 border-t border-teal-500/20">
                    <Brain className="w-3.5 h-3.5" />
                    <span>Lưu vào Obsidian: {result.obsidianNotePath.split('obsidian-vault')[1] || result.obsidianNotePath}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isProcessing || !url.trim()}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang Bóc Tách Web...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bắt Đầu Bóc Tách</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
