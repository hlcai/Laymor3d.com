'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Flame,
  TrendingUp,
  Layers,
  CheckCircle2,
  Sparkles,
  Store,
  Zap,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from '@/components/icons/MinimalIcons';
import { ITrendMetric, IModel3D } from '@/backend/domain/models';
import { getMatchingSampleModelId } from '@/backend/domain/sample-models';
import { SlicingProfileModal } from '@/components/slicing/SlicingProfileModal';

interface VelocityLeaderboardProps {
  trends: ITrendMetric[];
}

export function VelocityLeaderboard({ trends }: VelocityLeaderboardProps) {
  const [failedImgIds, setFailedImgIds] = useState<Set<string>>(new Set());
  const [selectedModalModel, setSelectedModalModel] = useState<IModel3D | null>(null);

  // Cấu hình khung hiển thị: Mặc định chuẩn 5 sản phẩm đầu
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  if (trends.length === 0) {
    return (
      <div className="vision-glass rounded-[28px] border border-white/15 p-8 text-center space-y-3 text-white shadow-sm">
        <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 mx-auto flex items-center justify-center text-white/70">
          <Layers className="w-6 h-6 text-[#2DD4BF]" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-sm text-white">Chưa có mô hình nào khớp với bộ lọc hiện tại</p>
          <p className="text-white/60 text-xs max-w-md mx-auto">
            Dữ liệu có thể đang bị lọc bởi sàn hoặc từ khóa tìm kiếm. Bạn có thể xóa bộ lọc hoặc chuyển sang bộ thu thập dữ liệu để cào thêm mô hình mới.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/admin?tab=crawler"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-[#2DD4BF]/20 hover:bg-[#2DD4BF]/30 text-[#5EEAD4] border border-[#2DD4BF]/40 transition-all"
          >
            <span>Sang Bộ Thu Thập Dữ Liệu (Crawler)</span>
          </Link>
        </div>
      </div>
    );
  }

  // Tính toán danh sách hiển thị
  const totalCount = trends.length;
  const effectivePageSize = isExpanded ? (pageSize === -1 ? totalCount : pageSize) : 5;
  const totalPages = Math.max(1, Math.ceil(totalCount / effectivePageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = isExpanded ? (validPage - 1) * effectivePageSize : 0;
  const displayedTrends = isExpanded
    ? trends.slice(startIndex, startIndex + effectivePageSize)
    : trends.slice(0, 5);

  return (
    <div className="vision-glass rounded-[32px] overflow-hidden border border-white/15 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-300" />
            <span>Bảng Xếp Hạng Xu Hướng Tăng Trưởng (Velocity Leaderboard)</span>
          </h3>
          <p className="text-xs text-white/60 mt-0.5">
            Đánh giá sức hút dựa trên tốc độ tải mới, tỷ lệ in thực tế (Makes) và điểm số Momentum
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            {isExpanded
              ? `Hiển thị: ${startIndex + 1} - ${Math.min(startIndex + effectivePageSize, totalCount)} / ${totalCount} models`
              : `Khung chuẩn: Top 5 / ${totalCount} models`}
          </span>

          {trends.length > 5 && (
            <button
              onClick={() => {
                if (isExpanded) {
                  setIsExpanded(false);
                  setCurrentPage(1);
                } else {
                  setIsExpanded(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-all cursor-pointer active:scale-95"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-amber-300" />
                  <span>Thu gọn (Top 5)</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-teal-300" />
                  <span>Xem thêm ({trends.length - 5})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-white">
          <thead className="bg-white/5 text-xs uppercase text-white/50 border-b border-white/10">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Rank</th>
              <th className="py-3.5 px-4 font-semibold">Mô hình 3D</th>
              <th className="py-3.5 px-4 font-semibold text-center">Nền tảng</th>
              <th className="py-3.5 px-4 font-semibold text-right">Lượt tải &amp; In</th>
              <th className="py-3.5 px-4 font-semibold text-center">Tỷ lệ in thực</th>
              <th className="py-3.5 px-4 font-semibold text-right">Tăng trưởng</th>
              <th className="py-3.5 px-4 font-semibold text-center">Momentum</th>
              <th className="py-3.5 px-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {displayedTrends.map((item, idx) => {
              const rank = isExpanded ? startIndex + idx + 1 : idx + 1;
              const isImgFailed = failedImgIds.has(item.modelId);
              const thumbSrc = isImgFailed || !item.thumbnailUrl ? '/thumbnails/bambu-acc.svg' : item.thumbnailUrl;
              const conversion = item.printConversionRate ?? (item.currentDownloads > 0 ? Number(((item.currentPrints / item.currentDownloads) * 100).toFixed(1)) : 0);

              const platformBadgeClass =
                item.platform === 'makerworld'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : item.platform === 'printables'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : item.platform === 'github'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';

              const platformLabel =
                item.platform === 'makerworld'
                  ? 'MakerWorld'
                  : item.platform === 'printables'
                  ? 'Printables'
                  : item.platform === 'github'
                  ? 'GitHub 3D'
                  : 'Thingiverse';

              return (
                <tr key={item.modelId} className="hover:bg-white/10 transition-colors">
                  {/* Rank */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        rank === 1
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40 shadow-xs'
                          : rank === 2
                          ? 'bg-white/20 text-white border border-white/20'
                          : rank === 3
                          ? 'bg-rose-500/30 text-rose-200 border border-rose-500/40'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      #{rank}
                    </span>
                  </td>

                  {/* Model Title */}
                  <td className="py-3.5 px-4 min-w-[260px]">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbSrc}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-cover border border-white/15 shrink-0 bg-black/40"
                        onError={() => {
                          setFailedImgIds((prev) => new Set(prev).add(item.modelId));
                        }}
                      />
                      <div className="space-y-0.5">
                        <a
                          href={item.sourceUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-xs hover:text-[#5EEAD4] transition-colors line-clamp-1"
                        >
                          {item.title}
                        </a>
                        <div className="flex items-center gap-2 text-[11px] text-white/60 flex-wrap">
                          <span>bởi <strong className="text-white/80">{item.author}</strong></span>
                          <span>•</span>
                          <span className="text-white/50">{item.category}</span>
                          {item.filamentType && (
                            <>
                              <span>•</span>
                              <span className="text-[#2DD4BF] font-mono text-[10px]">{item.filamentType}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Platform */}
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${platformBadgeClass}`}>
                      {platformLabel}
                    </span>
                  </td>

                  {/* Downloads & Prints */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-bold text-xs">{item.currentDownloads.toLocaleString('vi-VN')}</div>
                    <div className="text-[11px] text-white/60">{item.currentPrints.toLocaleString('vi-VN')} makes</div>
                  </td>

                  {/* Print Conversion */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{conversion}%</span>
                    </span>
                  </td>

                  {/* Growth (Velocity 24h) */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-xs font-bold text-emerald-300 flex items-center justify-end gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span>+{item.downloads24h.toLocaleString('vi-VN')}</span>
                    </span>
                  </td>

                  {/* Momentum Score */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-black text-amber-300">
                      {item.momentumScore}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => {
                          const mockModel: IModel3D = {
                            id: item.modelId,
                            title: item.title,
                            author: item.author,
                            platform: item.platform,
                            sourceUrl: item.sourceUrl || '',
                            thumbnailUrl: item.thumbnailUrl || '/thumbnails/bambu-acc.svg',
                            downloads: item.currentDownloads,
                            prints: item.currentPrints,
                            likes: item.currentPrints,
                            filamentType: item.filamentType || 'PLA',
                            category: item.category,
                            tags: item.tags || [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          };
                          setSelectedModalModel(mockModel);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/30 text-teal-200 font-bold text-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                        title="Xem gợi ý thông số in AI & Slicing Profile"
                      >
                        <Zap className="w-3 h-3 text-teal-300" />
                        <span>Cắt Lớp</span>
                      </button>

                      <Link
                        href={`/studio?sampleId=${getMatchingSampleModelId(item.title, item.category)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 font-bold text-xs transition-all active:scale-95 whitespace-nowrap"
                        title="Nạp vào Studio 3D để xem trước hoặc in"
                      >
                        <Sparkles className="w-3 h-3 text-purple-300" />
                        <span>Sinh AI</span>
                      </Link>

                      <Link
                        href="/seller"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 font-bold text-xs transition-all active:scale-95 whitespace-nowrap"
                        title="Đăng bán đón trend trên Marketplace"
                      >
                        <Store className="w-3 h-3 text-amber-300" />
                        <span>Bán Trend</span>
                      </Link>

                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/70 hover:text-white transition-colors"
                          title="Mở trang gốc trên sàn"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Bar: Expand / Pagination Controls */}
      {trends.length > 5 && (
        <div className="p-3.5 sm:p-4 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          {!isExpanded ? (
            <>
              <div className="text-xs text-white/60">
                Đang hiển thị <strong className="text-white">5 sản phẩm đầu</strong> theo chuẩn tinh gọn. Còn{' '}
                <strong className="text-teal-300">{trends.length - 5}</strong> mô hình đang chờ khám phá.
              </div>
              <button
                onClick={() => {
                  setIsExpanded(true);
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-teal-200 border border-teal-400/40 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <span>Xem Thêm ({trends.length - 5} Mô Hình Còn Lại)</span>
                <ChevronDown className="w-4 h-4 text-teal-300" />
              </button>
            </>
          ) : (
            <>
              {/* Pagination Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-white/60 mr-1">Hiển thị:</span>
                {[5, 10, 20, -1].map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                      pageSize === size
                        ? 'bg-teal-500/30 text-teal-200 border-teal-400/50 shadow-xs'
                        : 'bg-black/20 text-white/60 border-white/10 hover:text-white'
                    }`}
                  >
                    {size === -1 ? 'Tất cả' : `${size} / trang`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {pageSize !== -1 && totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={validPage <= 1}
                      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Trang trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-white/80 font-mono px-2">
                      {validPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={validPage >= totalPages}
                      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Trang sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsExpanded(false);
                    setCurrentPage(1);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-all cursor-pointer active:scale-95"
                >
                  <ChevronUp className="w-3.5 h-3.5 text-amber-300" />
                  <span>Thu Gọn (Về Top 5)</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Slicing Profile Modal */}
      <SlicingProfileModal
        model={selectedModalModel}
        isOpen={!!selectedModalModel}
        onClose={() => setSelectedModalModel(null)}
      />
    </div>
  );
}
