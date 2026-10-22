'use client';

import React, { useState } from 'react';
import {
  X,
  Send,
  UploadCloud,
  FileCheck,
  Printer,
  Clock,
  Truck,
  CheckCircle2,
  Sparkles,
} from '@/components/icons/MinimalIcons';
import { IPrintingServicePackage, IServiceQuoteResult } from '@/backend/domain/shop';

export interface OrderServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicePackage?: IPrintingServicePackage;
  quote?: IServiceQuoteResult;
  initialFileName?: string;
  initialDimensions?: { x: number; y: number; z: number };
  initialWeightGrams?: number;
  initialPrintHours?: number;
  initialMaterial?: string;
  initialCostVnd?: number;
  onShowToast: (msg: string) => void;
}

export function OrderServiceModal({
  isOpen,
  onClose,
  servicePackage,
  quote,
  initialFileName,
  initialDimensions,
  initialWeightGrams,
  initialPrintHours,
  initialMaterial,
  initialCostVnd,
  onShowToast,
}: OrderServiceModalProps) {
  const [fileName, setFileName] = useState<string | null>(initialFileName || null);
  const [modelLink, setModelLink] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState('');

  if (!isOpen) return null;

  const calculatedPrice = initialCostVnd || quote?.totalVnd || (initialWeightGrams ? Math.max(25000, initialWeightGrams * 650) : 45000);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !address) {
      alert('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const code = `IN3D-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderCode(code);
      setIsSubmitting(false);
      setIsSuccess(true);
      onShowToast(`🎉 Đã tiếp nhận yêu cầu in 3D! Mã đơn: #${code}`);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-xl rounded-[36px] bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto text-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center border border-cyan-300 shadow-2xs shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Đặt In 3D Dịch Vụ Gia Công</span>
                {initialFileName && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300">
                    Từ 3D Studio
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-600">
                {servicePackage ? servicePackage.name : 'In 3D FDM/SLA Chất lượng cao – Giao tận nơi toàn quốc'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-300 mx-auto flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Tiếp Nhận Đơn In Thành Công!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Mã đơn hàng của bạn là <strong className="text-emerald-700 font-mono">#{orderCode}</strong>.
              Đội ngũ kỹ thuật 3D Hub sẽ kiểm tra độ tương thích của file và gọi xác nhận trong vòng 15 phút.
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 text-left max-w-sm mx-auto space-y-1.5 shadow-2xs">
              <div>📦 <strong>Mô hình:</strong> {fileName || initialFileName || 'File thiết kế 3D'}</div>
              <div>💰 <strong>Tạm tính:</strong> <span className="text-emerald-700 font-bold">{calculatedPrice.toLocaleString('vi-VN')} đ</span></div>
              <div>🚚 <strong>Thời gian bàn giao:</strong> 24h - 48h toàn quốc</div>
            </div>
            <button
              onClick={() => {
                setIsSuccess(false);
                onClose();
              }}
              className="px-7 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Hoàn Tất &amp; Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Studio Synced Model Info Card */}
            {(initialFileName || initialDimensions) && (
              <div className="p-4 rounded-[28px] bg-slate-50 border border-slate-200 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Thông Số Đã Đồng Bộ Từ 3D Slicer:</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    {calculatedPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Tên tệp:</div>
                    <div className="font-bold text-slate-900 truncate" title={initialFileName}>
                      {initialFileName || 'Mô hình 3D'}
                    </div>
                  </div>
                  {initialDimensions && (
                    <div className="p-2.5 rounded-2xl bg-white border border-slate-200">
                      <div className="text-slate-400 text-[10px]">Kích thước:</div>
                      <div className="font-bold text-slate-900 font-mono">
                        {initialDimensions.x}×{initialDimensions.y}×{initialDimensions.z} mm
                      </div>
                    </div>
                  )}
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Khối lượng:</div>
                    <div className="font-bold text-emerald-700">
                      ~{initialWeightGrams || 25} g ({initialMaterial || 'PLA'})
                    </div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Thời gian in:</div>
                    <div className="font-bold text-slate-900 font-mono">
                      ~{initialPrintHours || 1.5} giờ
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quote Preview if Available (from Shop tab) */}
            {quote && !initialFileName && (
              <div className="p-4 rounded-[28px] bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">
                    Báo giá tạm tính tự động
                  </span>
                  <div className="text-xl font-black text-emerald-700">
                    {quote.totalVnd.toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                  <div>Thời gian in: ~{quote.estimatedPrintHours}h</div>
                  <div className="text-emerald-700 font-bold">Giao hàng sau 24h</div>
                </div>
              </div>
            )}

            {/* File Upload Zone */}
            {!initialFileName && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block px-0.5">
                  Tải Lên File 3D (.STL, .3MF, .STEP, .OBJ)
                </label>
                <label className="flex flex-col items-center justify-center p-5 rounded-[28px] border-2 border-dashed border-slate-300 hover:border-cyan-500 bg-slate-50 hover:bg-white cursor-pointer transition-all group shadow-2xs">
                  <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                  <span className="text-xs font-bold text-slate-700 mt-2">
                    {fileName ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <FileCheck className="w-4 h-4" /> {fileName}
                      </span>
                    ) : (
                      'Kéo thả file vào đây hoặc bấm để chọn tệp'
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">Hỗ trợ tối đa 100MB</span>
                  <input
                    type="file"
                    accept=".stl,.3mf,.step,.stp,.obj"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Link to Model alternative */}
            {!initialFileName && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 px-0.5">
                  Hoặc Dán Link Mô Hình (MakerWorld / Printables / Thingiverse)
                </label>
                <input
                  type="url"
                  placeholder="https://makerworld.com/en/models/..."
                  value={modelLink}
                  onChange={(e) => setModelLink(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>
            )}

            {/* Customer Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 px-0.5">
                  Họ và Tên *
                </label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 px-0.5">
                  Số Điện Thoại / Zalo *
                </label>
                <input
                  type="tel"
                  placeholder="0912 xxx xxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 px-0.5">
                Địa Chỉ Nhận Hàng (Toàn Quốc) *
              </label>
              <input
                type="text"
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 px-0.5">
                Ghi Chú Yêu Cầu Kỹ Thuật (Tùy chọn)
              </label>
              <textarea
                rows={2}
                placeholder="VD: In màu đen nhám, độ mịn layer 0.16mm, cần độ cứng cao..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>

            {/* Value Guarantees */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 px-1 font-medium">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>Giao hàng hỏa tốc trong 24h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>Bảo hành in lại nếu bị lỗi cong vênh</span>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang Tạo Đơn Hàng...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Xác Nhận Đặt In 3D (Tạm Tính {calculatedPrice.toLocaleString('vi-VN')} đ)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
