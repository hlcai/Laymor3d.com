'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles, CheckCircle2 } from '@/components/icons/MinimalIcons';

interface ImageUploadZoneProps {
  onImageSelected: (imageBase64OrUrl: string) => void;
  disabled?: boolean;
}

const SAMPLE_IMAGES = [
  {
    name: 'Robot Fidget',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Búp bê / Nhân vật',
    url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Khay phụ kiện',
    url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80',
  },
];

export function ImageUploadZone({ onImageSelected, disabled }: ImageUploadZoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      onImageSelected(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (url: string) => {
    setPreview(url);
    onImageSelected(url);
  };

  return (
    <div className="space-y-4">
      {/* Upload Box */}
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px] ${
          preview
            ? 'border-cyan-500 bg-cyan-50/50 shadow-sm'
            : 'border-slate-300 hover:border-cyan-500/70 bg-white/70 hover:bg-white shadow-xs'
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />

        {preview ? (
          <div className="relative w-full flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Ảnh 2D nguồn"
              className="max-h-40 rounded-xl object-contain shadow-md border border-slate-200"
            />
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã chọn ảnh 2D nguồn (Bấm để đổi ảnh khác)</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800 shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Kéo thả ảnh 2D vào đây hoặc <span className="text-cyan-700 underline font-semibold">chọn từ máy tính</span>
              </p>
              <p className="text-xs text-slate-600 mt-1">Hỗ trợ PNG, JPG, WEBP (Ảnh nền trắng hoặc trong suốt tạo mesh chuẩn nhất)</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Sample Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Hoặc chọn ảnh mẫu thử nghiệm nhanh:
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.name}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectSample(sample.url)}
              className="group relative flex flex-col items-center p-2 rounded-xl border border-slate-200 bg-white/80 hover:border-cyan-400 hover:bg-white transition-all text-left shadow-xs hover:shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sample.url}
                alt={sample.name}
                className="w-full h-14 object-cover rounded-lg mb-1.5 group-hover:scale-105 transition-transform"
              />
              <span className="text-[11px] font-bold text-slate-800 truncate w-full text-center">
                {sample.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
