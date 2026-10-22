'use client';

import React from 'react';
import { Tag, TrendingUp } from '@/components/icons/MinimalIcons';
import { ITagFrequency } from '@/backend/services/analytics/TagAnalytics';

interface HotTagsCloudProps {
  hotTags: ITagFrequency[];
  onSelectTag?: (tag: string) => void;
}

export function HotTagsCloud({ hotTags, onSelectTag }: HotTagsCloudProps) {
  return (
    <div className="vision-glass rounded-[28px] p-5 sm:p-6 backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Tag className="w-4 h-4 text-white/80" />
          <span>Từ Khóa Thị Hiếu Đang Bùng Nổ</span>
        </h3>
        <span className="text-xs text-white/60 font-medium">Bắt Trend Thiết Kế</span>
      </div>
      <p className="text-xs text-white/60 mb-4">
        Các chủ đề có lượng người tìm kiếm & tải in 3D nhiều nhất tuần qua
      </p>

      <div className="flex flex-wrap gap-2">
        {hotTags.map((item) => (
          <button
            key={item.tag}
            onClick={() => onSelectTag?.(item.tag)}
            className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/20 hover:bg-white/20 border border-white/10 hover:border-white/25 transition-all text-xs text-white/80 hover:text-white"
          >
            <span className="font-medium">#{item.tag}</span>
            <span className="flex items-center text-[10px] font-bold text-emerald-300 group-hover:text-emerald-200">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
              {item.growth}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
