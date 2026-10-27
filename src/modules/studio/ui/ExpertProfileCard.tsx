'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  Sparkles,
  Thermometer,
  Gauge,
  Wind,
  Layers,
  Lightbulb,
  Download,
  CheckCircle2,
  ThumbsUp,
  Clock,
  RefreshCw,
  Box,
  Star,
  Brain,
  BookOpen,
  FileText,
  X,
  FolderGit2,
  Eye,
  Copy,
  Check,
} from '@/components/icons/MinimalIcons';
import { IExpertPrintProfile, IExpertPrintProfileVariant } from '@/backend/domain/wallet';
import { IPrinterProfile, ISupportConfig } from '@/backend/domain/slicing';
import { PresetGeneratorService } from '@/backend/services/slicing/PresetGeneratorService';

interface ExpertProfileCardProps {
  profile: IExpertPrintProfile;
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  isUnlocking: boolean;
  userBalanceVnd: number;
  onOpenTopUp: () => void;
  printer?: IPrinterProfile;
  dimensionsMm?: { x: number; y: number; z: number };
  supportConfig?: ISupportConfig;
  customModelName?: string;
  volumeCm3?: number;
  triangleCount?: number;
  customGroup?: any;
  onProfileChange?: (selectedProfile: IExpertPrintProfileVariant) => void;
}

const PRINTER_FILTER_TABS = ['All', 'P1S', 'X1 Carbon', 'A1', 'A1 mini', 'K1 Max', 'Prusa MK4'];

interface IObsidianNoteView {
  filePath?: string;
  relativePath?: string;
  folder?: string;
  id?: string;
  title: string;
  tags?: string[];
  frontmatter?: Record<string, any>;
  content: string;
  wikiLinks?: string[];
  lastModified?: string;
}

const VIEW_ANGLES = [
  { label: 'Phối Cảnh 3D', sub: 'Isometric View', color: 'text-cyan-800' },
  { label: 'Cấu Trúc Lớp', sub: 'Layer Structure', color: 'text-emerald-800' },
  { label: 'Mặt Đáy Bàn In', sub: 'PEI Adhesion', color: 'text-amber-800' },
];

/**
 * Component hiển thị ảnh preview an toàn, chống 100% lỗi vỡ alt text
 */
function SafePrintPreviewItem({
  src,
  index,
  modelTitle,
  onClick,
}: {
  src: string;
  index: number;
  modelTitle: string;
  onClick: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const angle = VIEW_ANGLES[index % VIEW_ANGLES.length];

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={`Bấm để phóng to góc nhìn: ${angle.label}`}
      className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-cyan-400 transition-all cursor-pointer flex flex-col items-center justify-between p-1.5 shadow-xs hover:shadow-md active:scale-95"
    >
      <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
        {!hasError && src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            onError={() => setHasError(true)}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400">
            {index === 0 && <Box className="w-6 h-6 text-cyan-600" />}
            {index === 1 && <Layers className="w-6 h-6 text-emerald-600" />}
            {index === 2 && <Gauge className="w-6 h-6 text-amber-600" />}
          </div>
        )}
      </div>

      <div className="w-full text-center py-0.5 px-1 rounded-md bg-slate-100 group-hover:bg-cyan-50 transition-colors">
        <span className={`text-[10px] font-bold block truncate ${angle.color}`}>
          {angle.label}
        </span>
      </div>
    </div>
  );
}

/**
 * Modal hiển thị nội dung ghi chú Obsidian Markdown kèm các Wiki-Links tương tác
 */
function ObsidianNoteModal({
  note,
  isOpen,
  onClose,
  onSelectWikiLink,
}: {
  note: IObsidianNoteView | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectWikiLink: (link: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !note) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMarkdownContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-lg font-bold text-slate-900 mt-3 mb-1 border-b border-slate-200 pb-1">
            {line.replace('# ', '')}
          </h2>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-purple-900 mt-2.5 mb-1 flex items-center gap-1.5">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('- **') || line.startsWith('• **')) {
        const parts = line.split('**');
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-700 leading-relaxed my-0.5">
            <strong className="text-slate-900">{parts[1]}</strong>
            <span>{parts.slice(2).join('')}</span>
          </li>
        );
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        const rawItem = line.replace(/^[-•]\s*/, '');
        const wikiMatch = rawItem.match(/\[\[(.*?)\]\]/);
        if (wikiMatch) {
          const linkTarget = wikiMatch[1];
          return (
            <li key={idx} className="ml-4 list-disc text-xs text-slate-700 my-0.5">
              <span>{rawItem.replace(/\[\[.*?\]\]/, '')}</span>
              <button
                type="button"
                onClick={() => onSelectWikiLink(linkTarget)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 font-mono text-[11px] ml-1 cursor-pointer transition-colors"
              >
                <span>[[{linkTarget}]]</span>
              </button>
            </li>
          );
        }
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-700 leading-relaxed my-0.5">
            {rawItem}
          </li>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="p-2.5 my-1.5 rounded-lg bg-purple-50 border-l-2 border-purple-500 text-xs italic text-purple-900">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-700 leading-relaxed my-0.5">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white border border-purple-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-purple-50/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-700">
              <Brain className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{note.title}</span>
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 font-mono font-semibold">
                  {note.folder || 'Vault Note'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {note.relativePath ? `data/obsidian-vault/${note.relativePath}` : 'data/obsidian-vault/'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer shadow-xs"
              title="Sao chép nội dung Markdown"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-700 hover:text-rose-600 transition-colors cursor-pointer shadow-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Tags bar */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Tags:</span>
              {note.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-[10px] text-purple-700 font-mono font-semibold"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Frontmatter Metadata Block if present */}
          {note.frontmatter && Object.keys(note.frontmatter).length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">YAML Frontmatter:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-700 text-[11px]">
                {Object.entries(note.frontmatter)
                  .filter(([k]) => !['title', 'tags', 'id'].includes(k))
                  .slice(0, 8)
                  .map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-slate-500">{key}:</span>
                      <span className="text-slate-900 font-semibold truncate max-w-[160px]">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Markdown Content */}
          <div className="space-y-1">{renderMarkdownContent(note.content)}</div>

          {/* Wiki-links in note */}
          {note.wikiLinks && note.wikiLinks.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1">
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Liên kết mạng lưới tri thức ([[Wiki-Links]]):</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {note.wikiLinks.map((wl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectWikiLink(wl)}
                    className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors font-semibold"
                  >
                    <span>[[{wl}]]</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-600">
          <span>
            💡 <em>Bạn có thể mở trực tiếp thư mục này bằng ứng dụng Obsidian trên máy tính để xem Graph View tương tác.</em>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 transition-colors cursor-pointer shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExpertProfileCard({
  profile,
  isUnlocked,
  onUnlock,
  onLock,
  isUnlocking,
  userBalanceVnd,
  onOpenTopUp,
  printer,
  dimensionsMm,
  supportConfig,
  customModelName,
  volumeCm3,
  triangleCount,
  customGroup,
  onProfileChange,
}: ExpertProfileCardProps) {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [selectedFilterTab, setSelectedFilterTab] = useState('All');
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [variants, setVariants] = useState<IExpertPrintProfileVariant[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiModelUsed, setAiModelUsed] = useState<string>('Gemini 2.5 Flash');
  const [vaultKnowledge, setVaultKnowledge] = useState<any>(null);
  const [activeObsidianNote, setActiveObsidianNote] = useState<IObsidianNoteView | null>(null);
  const [isObsidianModalOpen, setIsObsidianModalOpen] = useState(false);

  const modelTitle = customModelName || profile.modelName;

  const fetchAiProfiles = useCallback(
    async (forceRefresh = false) => {
      setIsLoadingAI(true);
      try {
        const res = await fetch('/api/slicing/ai-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId: profile.modelId,
            modelName: modelTitle,
            dimensionsMm: dimensionsMm || { x: 60, y: 31, z: 48 },
            volumeCm3: volumeCm3 || 25,
            triangleCount: triangleCount || 15000,
            printerId: printer?.id || 'bambu-x1c-p1s',
            printerName: printer?.name || 'Bambu Lab X1-Carbon',
            filamentType: profile.filamentType,
            filamentBrand: profile.filamentBrand,
            forceRefresh,
          }),
        });

        const data = await res.json();
        if (data.success && data.profiles?.length > 0) {
          setVariants(data.profiles);
          setVaultKnowledge(data.vaultKnowledge || null);
          setAiModelUsed('Google Gemini 2.5 Intelligence');
          if (onProfileChange && data.profiles[0]) {
            onProfileChange(data.profiles[0]);
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tải AI profiles:', err);
      } finally {
        setIsLoadingAI(false);
      }
    },
    [profile.modelId, modelTitle, dimensionsMm, volumeCm3, triangleCount, printer, profile.filamentType, profile.filamentBrand, onProfileChange]
  );

  useEffect(() => {
    fetchAiProfiles();
  }, [fetchAiProfiles]);

  const activeProfile: IExpertPrintProfileVariant =
    variants[selectedVariantIdx] || {
      ...profile,
      variantId: 'default',
      variantTitle: '0.20mm Standard Balanced Profile',
      creatorName: '3D Hub AI Slicer Pro',
      creatorBadge: 'AI Tuner',
      creatorNotes: `Profile tinh chỉnh cân bằng giữa tốc độ và độ mịn cho ${modelTitle}.`,
      wallLoops: 3,
      wallGenerator: 'Arachne',
      estimatedHours: 1.8,
      estimatedFilamentGrams: 38,
      platesCount: 1,
      rating: 4.9,
      ratingCount: 156,
      downloadsCount: 786,
      likesCount: 420,
      compatiblePrinters: ['P1S', 'X1 Carbon', 'A1', 'K1 Max', 'Prusa MK4'],
      targetStyle: 'speed',
    };

  const handleSelectVariant = (idx: number) => {
    setSelectedVariantIdx(idx);
    if (variants[idx] && onProfileChange) {
      onProfileChange(variants[idx]);
    }
  };

  const handleExportProfile = () => {
    const filename = PresetGeneratorService.downloadPreset(
      activeProfile,
      printer,
      dimensionsMm,
      supportConfig,
      customGroup
    );
    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 4500);
  };

  const handleOpenObsidianNote = (note: IObsidianNoteView) => {
    setActiveObsidianNote(note);
    setIsObsidianModalOpen(true);
  };

  const handleSelectWikiLink = async (link: string) => {
    try {
      const cleanQuery = link.replace(/\[\[|\]\]/g, '').trim();
      const res = await fetch(`/api/knowledge/vault?q=${encodeURIComponent(cleanQuery)}`);
      const data = await res.json();
      if (data.success && data.notes?.length > 0) {
        setActiveObsidianNote(data.notes[0]);
      } else {
        setActiveObsidianNote({
          title: cleanQuery,
          content: `# ${cleanQuery}\n\nGhi chú này đang được hệ thống tiếp tục tổng hợp từ kho tri thức Obsidian Vault.`,
        });
      }
    } catch (e) {
      console.warn('Lỗi khi tra cứu wiki-link:', e);
    }
  };

  return (
    <div className="relative rounded-[32px] vision-glass overflow-hidden shadow-xl border border-cyan-100/80">
      {/* Top Bar: MakerWorld Print Files Header with Printer Filter Pills */}
      <div className="p-4 sm:p-5 border-b border-slate-200/90 bg-white/70">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-8 h-8 rounded-full bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Print Profiles</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-900 border border-cyan-300">
                  {variants.length || 3} Profiles Tinh Chỉnh
                </span>
              </h3>

              {isUnlocked ? (
                <button
                  type="button"
                  onClick={onLock}
                  title="Bấm để khóa lại (Demo tính năng mở khóa 1.000đ)"
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 hover:bg-rose-100 text-emerald-800 hover:text-rose-800 border border-emerald-300 hover:border-rose-300 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Unlock className="w-3 h-3 text-emerald-600" />
                  <span>ĐÃ MỞ KHÓA</span>
                </button>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-700" /> PRO PRESET (1.000 đ)
                </span>
              )}

              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-mono font-medium">
                {aiModelUsed}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Phân tích riêng biệt cho mẫu <strong className="text-slate-900">[{modelTitle}]</strong>: hình học, độ nghiêng góc treo, nan rỗng &amp; dung sai lắp ghép
            </p>
          </div>

          {/* Action Buttons: AI Refresh, Unlock / Export */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fetchAiProfiles(true)}
              disabled={isLoadingAI}
              title="Phân tích lại mô hình bằng Gemini AI"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 hover:bg-white border border-slate-300 text-slate-800 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAI ? 'animate-spin text-cyan-600' : 'text-cyan-700'}`} />
              <span className="hidden sm:inline">{isLoadingAI ? 'Đang Phân Tích...' : 'AI Tinh Chỉnh Lại'}</span>
            </button>

            {isUnlocked ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportProfile}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download 3MF</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onUnlock}
                disabled={isUnlocking}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-cyan-600/25 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Mở Khóa Toàn Bộ (1.000 đ)</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {PRINTER_FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedFilterTab(tab)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                selectedFilterTab === tab
                  ? 'bg-cyan-600 text-white border border-cyan-500 shadow-xs'
                  : 'bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white border border-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* ROW: PROFILE CARDS SELECTOR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(variants.length > 0
            ? variants
            : [
                {
                  variantId: 'quality',
                  variantTitle: '0.16mm Fine Layer | 3 Walls | Scarf Joint',
                  creatorName: 'Designer',
                  creatorBadge: 'Designer' as const,
                  estimatedHours: 2.2,
                  platesCount: 1,
                  rating: 4.9,
                  ratingCount: 371,
                },
                {
                  variantId: 'speed',
                  variantTitle: 'No ironing | Changed supports | Settings for speed',
                  creatorName: 'ModelWorks3D',
                  creatorBadge: 'Community Master' as const,
                  estimatedHours: 1.6,
                  platesCount: 1,
                  rating: 4.8,
                  ratingCount: 31,
                },
                {
                  variantId: 'strength',
                  variantTitle: '4 Walls | 25% Gyroid | Maximum Rigidity',
                  creatorName: '3D Hub AI Tuner',
                  creatorBadge: 'AI Tuner' as const,
                  estimatedHours: 2.8,
                  platesCount: 1,
                  rating: 5.0,
                  ratingCount: 88,
                },
              ]
          ).map((v: any, idx: number) => {
            const isSelected = selectedVariantIdx === idx;
            return (
              <div
                key={v.variantId || idx}
                onClick={() => handleSelectVariant(idx)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all border relative flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-cyan-50/90 border-cyan-400 ring-2 ring-cyan-400/40 shadow-md shadow-cyan-900/5'
                    : 'bg-white/80 hover:bg-white border-slate-200/90 hover:border-cyan-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        v.creatorBadge === 'Designer'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                      }`}
                    >
                      {v.creatorName || 'Maker'}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-amber-700 font-bold">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{v.rating || 4.9}</span>
                      <span className="text-slate-400 font-normal">({v.ratingCount || 100})</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                    {v.variantTitle}
                  </h4>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <strong className="text-slate-900">{v.estimatedHours || 1.8} h</strong>
                  </span>
                  <span>1 plate</span>
                  {isSelected && (
                    <span className="text-cyan-700 font-bold text-[10px] flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-cyan-600" /> Đang chọn
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* LOCKED BLURRED OVERLAY IF NOT UNLOCKED */}
        {!isUnlocked && (
          <div className="relative rounded-2xl bg-amber-50/70 border border-amber-200/90 p-6 text-center backdrop-blur-md shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Lock className="w-6 h-6 text-amber-700" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              Mở Khóa Toàn Bộ Profile Tinh Chỉnh Độc Bản Cho [{modelTitle}]
            </h4>
            <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1 mb-4 leading-relaxed">
              Mỗi mô hình sở hữu góc thoát và hình học khác nhau. Mở khóa để nhận toàn bộ thông số chuẩn xác (Tree Support không sẹo, điều chỉnh quạt &amp; tốc độ theo độ dốc, tắt Ironing chống hỏng nan mỏng) và tải file 3MF hoàn chỉnh.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onUnlock}
                disabled={isUnlocking}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-cyan-600/25 flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Mở Khóa Ngay • 1.000 đ</span>
              </button>
              <button
                type="button"
                onClick={onOpenTopUp}
                className="px-4 py-2 rounded-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold transition-colors shadow-2xs"
              >
                Số dư ví: <strong className="text-emerald-700 font-mono">{userBalanceVnd.toLocaleString('vi-VN')} đ</strong> (Nạp thêm)
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE PROFILE DETAIL INSPECTOR */}
        <div className={`space-y-4 ${!isUnlocked ? 'filter blur-sm select-none opacity-40 pointer-events-none' : ''}`}>
          {/* Section: Profile Inspector Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-slate-200/90 space-y-4 shadow-xs">
            
            {/* Top Preview Gallery */}
            <div className="space-y-1.5 pb-2">
              <span className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-cyan-600" />
                <span>Góc Nhìn Thực Tế Của Bản In (Print Angles Preview):</span>
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                {(activeProfile.galleryImages && activeProfile.galleryImages.length > 0
                  ? activeProfile.galleryImages
                  : ['/thumbnails/benchy.svg', '/thumbnails/benchy.svg', '/thumbnails/benchy.svg']
                ).map((img, i) => (
                  <SafePrintPreviewItem
                    key={i}
                    src={img}
                    index={i}
                    modelTitle={modelTitle}
                    onClick={() => {
                      if (vaultKnowledge?.matchedNote) {
                        handleOpenObsidianNote(vaultKnowledge.matchedNote);
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* OBSIDIAN KNOWLEDGE VAULT INTEGRATION BANNER */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-cyan-50 border border-purple-200/90 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-700 shadow-2xs">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Obsidian Knowledge Vault</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 border border-purple-300 text-purple-800 font-mono font-bold">
                          Bộ Nhớ Vĩnh Viễn
                        </span>
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Tra cứu tri thức vật lý FDM &amp; giải pháp lỗi in thực chiến độc bản cho [{modelTitle}]
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-purple-800 font-mono font-semibold bg-white/80 px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs">
                    📁 {vaultKnowledge?.stats?.totalNotes || 8} Ghi Chú • {vaultKnowledge?.stats?.categories?.defects || 2} Giải Pháp Lỗi
                  </span>
                </div>
              </div>

              {/* Wiki Links matched */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-purple-200/80">
                <span className="text-[11px] text-slate-500 font-medium">Tri thức đối chiếu:</span>
                {vaultKnowledge?.matchedNote && (
                  <button
                    type="button"
                    onClick={() => handleOpenObsidianNote(vaultKnowledge.matchedNote)}
                    className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <BookOpen className="w-3 h-3 text-purple-700" />
                    <span>[[{vaultKnowledge.matchedNote.title}]]</span>
                  </button>
                )}

                {(vaultKnowledge?.relatedNotes || []).map((rn: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOpenObsidianNote(rn)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-slate-900 text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <FileText className="w-3 h-3 text-cyan-600" />
                    <span>[[{rn.title}]]</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    if (vaultKnowledge?.matchedNote) {
                      handleOpenObsidianNote(vaultKnowledge.matchedNote);
                    } else if (vaultKnowledge?.relatedNotes?.[0]) {
                      handleOpenObsidianNote(vaultKnowledge.relatedNotes[0]);
                    }
                  }}
                  title="Khám phá kho ghi chú Markdown trong thư mục data/obsidian-vault"
                  className="ml-auto text-[11px] text-purple-800 hover:text-purple-900 font-bold flex items-center gap-1 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  <FolderGit2 className="w-3 h-3" />
                  <span>Xem Chi Tiết Markdown &amp; [[Wiki-Links]]</span>
                </button>
              </div>
            </div>

            {/* Header of Inspector */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {activeProfile.variantTitle}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{activeProfile.creatorName}</span>
                  </span>
                  <span>•</span>
                  <span>{activeProfile.downloadsCount?.toLocaleString('vi-VN') || '10,500'} downloads</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <ThumbsUp className="w-3 h-3 text-cyan-600" />
                    <span>{activeProfile.likesCount?.toLocaleString('vi-VN') || '6,300'}</span>
                  </span>
                </div>
              </div>

              {/* Download Button in Profile Header */}
              <button
                type="button"
                onClick={handleExportProfile}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-sm shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download 3MF</span>
              </button>
            </div>

            {/* Compatible Printers Tags List */}
            <div className="space-y-1 text-xs">
              <span className="text-slate-500 text-[11px] font-bold uppercase block">
                Máy in tương thích đã được kiểm chứng (Verified Printers):
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(activeProfile.compatiblePrinters || ['P1S', 'X2D', 'H2S', 'P1P', 'H2D Pro', 'X1 Carbon', 'X1', 'A1 mini', 'X1E', 'A1', 'H2C', 'A2L', 'H2D', 'P2S']).map(
                  (p: string) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-[11px] font-mono text-slate-800 font-semibold"
                    >
                      {p}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* RECOMMENDED PRINT SETTINGS BLOCK */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div>
                <h5 className="text-sm font-bold text-slate-900 tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block animate-pulse" />
                  <span>Recommended Print Settings</span>
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-700 font-mono">
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">•</span>
                    <span>
                      Layer height: <strong className="text-slate-900">{activeProfile.recommendedSettingsList?.layerHeight || `${activeProfile.layerHeightMm} mm`}</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">•</span>
                    <span>
                      Walls: <strong className="text-slate-900">{activeProfile.recommendedSettingsList?.walls ?? activeProfile.wallLoops}</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">•</span>
                    <span>
                      Infill: <strong className="text-slate-900">{activeProfile.recommendedSettingsList?.infill || `${activeProfile.infillDensityPercent}%`}</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">•</span>
                    <span>
                      Support structures: <strong className="text-slate-900">{activeProfile.recommendedSettingsList?.supports || (activeProfile.treeSupportParams.branchDiameterMm > 0 ? 'Activated' : 'Disabled')}</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">•</span>
                    <span>
                      Material: <strong className="text-slate-900">{activeProfile.recommendedSettingsList?.material || `${activeProfile.filamentType.split(' ')[0]} recommended`}</strong>
                    </span>
                  </li>
                </ul>
              </div>

              {/* Maker's Custom Tuning Description */}
              <div className="pt-2 border-t border-slate-200 text-xs text-slate-700 leading-relaxed">
                <p>{activeProfile.creatorNotes}</p>
              </div>

              {/* For best results checklist */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <h6 className="text-xs font-bold text-slate-900">For best results:</h6>
                <ul className="space-y-1 text-xs text-slate-700">
                  {(activeProfile.forBestResultsList || [
                    'Sử dụng quạt làm mát thích hợp theo độ dốc hình học',
                    'Khóa tốc độ Outer Wall để triệt tiêu biến thiên co ngót',
                    'Bóc support nhẹ nhàng khi bàn in đã nguội về nhiệt độ phòng',
                    'Dùng nhựa filament chất lượng cao và sấy khô trước khi in',
                  ]).map((res, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-600 font-bold">•</span>
                      <span>{res}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Outcome sentence & release date */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <p className="text-xs text-slate-600 italic">
                  &ldquo;{activeProfile.outcomeStatement || `With these calibrated settings, you will get a stable, dimensionally accurate, and flawless print of ${modelTitle}.`}&rdquo;
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Released {activeProfile.releaseDate || '2026-06-16'}</span>
                  <span className="text-cyan-700 font-semibold cursor-pointer hover:underline">Collapse</span>
                </div>
              </div>
            </div>

            {/* Print Metric Badges Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Số Plate</span>
                <strong className="text-slate-900">{activeProfile.platesCount || 1} plate</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Thời Gian In</span>
                <strong className="text-emerald-700">{activeProfile.estimatedHours || 1.6} h</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Đầu Phun</span>
                <strong className="text-slate-900">{activeProfile.nozzleSizeMm || 0.4} mm</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Khối Lượng Nhựa</span>
                <strong className="text-cyan-700">{activeProfile.estimatedFilamentGrams || 35} g</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Vật Liệu</span>
                <strong className="text-amber-800">{activeProfile.filamentType.split(' ')[0]}</strong>
              </div>
            </div>

            {/* Slicer Settings Detailed Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-700" /> Độ Dày Lớp &amp; Thành
                </span>
                <p className="font-bold text-slate-900">{activeProfile.layerHeightMm} mm</p>
                <p className="text-[11px] text-slate-600">
                  {activeProfile.wallLoops || 3} Vòng tường ({activeProfile.wallGenerator || 'Arachne'})
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-rose-600" /> Nhiệt Độ Cân Chỉnh
                </span>
                <p className="font-bold text-rose-800">{activeProfile.nozzleTempC}°C Nozzle</p>
                <p className="text-[11px] text-slate-600">Bàn in: {activeProfile.bedTempC}°C (PEI Plate)</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-emerald-600" /> Tốc Độ CoreXY
                </span>
                <p className="font-bold text-emerald-800">{activeProfile.outerWallSpeedMmS} mm/s Outer</p>
                <p className="text-[11px] text-slate-600">Infill: {activeProfile.infillSpeedMmS} mm/s</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-600" /> Quạt &amp; Retract
                </span>
                <p className="font-bold text-cyan-800">Quạt: {activeProfile.coolingFanPercent}%</p>
                <p className="text-[11px] text-slate-600">
                  {activeProfile.retractionDistanceMm}mm @ {activeProfile.retractionSpeedMmS}mm/s
                </p>
              </div>
            </div>

            {/* Slicing Features & Tree Support Specifics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-600 text-[11px] block font-bold mb-1">
                  CẤU HÌNH INFILL &amp; LÀ MẶT (IRONING):
                </span>
                <ul className="space-y-1 text-slate-700 text-[11px]">
                  <li>
                    • Kiểu ruột: <strong className="text-slate-900">{activeProfile.infillPattern} ({activeProfile.infillDensityPercent}%)</strong>
                  </li>
                  <li>
                    • Vị trí seam: <strong className="text-slate-900">{activeProfile.seamPosition}</strong> (Ẩn vết nối)
                  </li>
                  <li>
                    • Là phẳng (Ironing):{' '}
                    <strong className={activeProfile.ironingEnabled ? 'text-cyan-700' : 'text-amber-700'}>
                      {activeProfile.ironingEnabled ? 'BẬT (Mặt phẳng láng)' : 'TẮT (Tránh biến dạng nan rỗng)'}
                    </strong>
                  </li>
                </ul>
              </div>

              <div>
                <span className="text-slate-600 text-[11px] block font-bold mb-1">
                  THÔNG SỐ TREE SUPPORT BÓC TAY:
                </span>
                <ul className="space-y-1 text-slate-700 text-[11px]">
                  <li>
                    • Góc nhánh: <strong className="text-emerald-700">{activeProfile.treeSupportParams.branchAngleDeg}°</strong>
                  </li>
                  <li>
                    • Đường kính thân cây: <strong className="text-emerald-700">{activeProfile.treeSupportParams.branchDiameterMm} mm</strong>
                  </li>
                  <li>
                    • Khe hở Z (Top Z-Distance):{' '}
                    <strong className="text-emerald-700">
                      {activeProfile.treeSupportParams.topInterfaceSpacingMm} mm (Bóc tay 0 sẹo)
                    </strong>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Tips Specifically for THIS Model */}
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2">
              <h5 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Mẹo Thực Chiến Tránh Lỗi In Dành Riêng Cho [{modelTitle}]:</span>
              </h5>
              <div className="space-y-1.5 text-xs text-amber-900">
                {activeProfile.proTips.map((tip, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {tip}
                  </p>
                ))}
              </div>
            </div>

            {downloadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đã tải thành công tệp preset 3MF: <strong>{downloadSuccess}</strong>. Bạn có thể mở trực tiếp bằng Bambu Studio hoặc OrcaSlicer!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Obsidian Note Viewer Modal */}
      <ObsidianNoteModal
        note={activeObsidianNote}
        isOpen={isObsidianModalOpen}
        onClose={() => setIsObsidianModalOpen(false)}
        onSelectWikiLink={handleSelectWikiLink}
      />
    </div>
  );
}
