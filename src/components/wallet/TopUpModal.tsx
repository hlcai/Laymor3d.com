'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  QrCode,
  Sparkles,
  CheckCircle2,
  Copy,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Smartphone,
  Building,
} from '@/components/icons/MinimalIcons';
import {
  PaymentMethod,
  OFFICIAL_BANK_INFO,
  OFFICIAL_MOMO_INFO,
} from '@/backend/domain/payment';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalanceVnd: number;
  onTopUp: (amount: number) => void;
}

const TOPUP_PRESETS = [
  { amount: 20000, label: '20.000 đ', badge: 'Thử nghiệm' },
  { amount: 50000, label: '50.000 đ', badge: 'Phổ biến' },
  { amount: 100000, label: '100.000 đ', badge: 'VIP Maker' },
  { amount: 200000, label: '200.000 đ', badge: 'Studio Pro' },
  { amount: 500000, label: '500.000 đ', badge: 'Ưu đãi +5%' },
];

export function TopUpModal({
  isOpen,
  onClose,
  currentBalanceVnd,
  onTopUp,
}: TopUpModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('vietqr');
  const [step, setStep] = useState<'select' | 'qr' | 'success'>('select');
  const [paymentData, setPaymentData] = useState<any | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(600); // 10 phút

  const effectiveAmount = customAmount ? Number(customAmount) || selectedAmount : selectedAmount;

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setPaymentData(null);
      setCountdownSeconds(600);
    }
  }, [isOpen]);

  // Countdown timer for QR
  useEffect(() => {
    if (step !== 'qr') return;
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreatePaymentQR = async () => {
    setIsGeneratingQR(true);
    try {
      const res = await fetch('/api/payment/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: effectiveAmount, method }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentData(data);
        setStep('qr');
      } else {
        alert(data.error || 'Lỗi khi tạo mã thanh toán');
      }
    } catch (err: any) {
      alert(`Lỗi kết nối: ${err.message}`);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    try {
      const res = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: paymentData?.transaction?.id,
          amount: effectiveAmount,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onTopUp(effectiveAmount);
        setStep('success');
      } else {
        alert(data.error || 'Xác nhận giao dịch thất bại');
      }
    } catch (err: any) {
      alert(`Lỗi xác nhận: ${err.message}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-black/[0.08] rounded-[32px] p-7 shadow-[0_24px_64px_rgba(0,0,0,0.18)] space-y-6 max-h-[90vh] overflow-y-auto text-[#1D1D1F]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & Apple Pay Style Balance */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] flex items-center justify-center text-[#1D1D1F] shadow-xs shrink-0">
            <Wallet className="w-6 h-6 text-[#0071E3]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">Ví Điện Tử 3D Hub</h3>
            <p className="text-xs text-[#86868B] mt-0.5">
              Số dư hiện khả dụng: <strong className="text-[#1D1D1F] font-semibold text-sm">{currentBalanceVnd.toLocaleString('vi-VN')} đ</strong>
            </p>
          </div>
        </div>

        {/* STEP 1: Select Method & Amount */}
        {step === 'select' && (
          <div className="space-y-6">
            {/* Payment Method Selector */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] block">
                1. Phương thức nạp tiền:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('vietqr')}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                    method === 'vietqr'
                      ? 'bg-[#F5F5F7] border-2 border-[#0071E3] shadow-xs'
                      : 'bg-white border-black/[0.08] hover:border-black/[0.15]'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-[#0071E3]/10 text-[#0071E3] shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold block text-[#1D1D1F]">VietQR 24/7</span>
                    <span className="text-[11px] text-[#86868B]">Mọi ngân hàng VN</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('momo')}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                    method === 'momo'
                      ? 'bg-[#F5F5F7] border-2 border-[#A50064] shadow-xs'
                      : 'bg-white border-black/[0.08] hover:border-black/[0.15]'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-[#A50064]/10 text-[#A50064] shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold block text-[#1D1D1F]">Ví MoMo</span>
                    <span className="text-[11px] text-[#86868B]">Quét mã nhanh</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Amount Presets */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] block">
                2. Chọn số tiền nạp:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {TOPUP_PRESETS.map((p) => {
                  const isSelected = selectedAmount === p.amount && !customAmount;
                  return (
                    <button
                      key={p.amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(p.amount);
                        setCustomAmount('');
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white shadow-xs'
                          : 'bg-[#F5F5F7] border-black/[0.04] text-[#1D1D1F] hover:bg-[#E8E8ED]'
                      }`}
                    >
                      <span className="text-xs font-semibold">{p.label}</span>
                      <span className={`text-[10px] mt-1 ${isSelected ? 'text-white/70' : 'text-[#86868B]'}`}>
                        {p.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount */}
              <div className="pt-1">
                <input
                  type="number"
                  placeholder="Hoặc nhập số tiền tùy chọn (VNĐ)..."
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F7] border border-black/[0.08] text-xs text-[#1D1D1F] placeholder-[#86868B] focus:bg-white focus:border-[#0071E3] transition-all font-medium"
                />
              </div>
            </div>

            {/* Total Display & CTA Button */}
            <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#86868B] block">Tổng thanh toán:</span>
                <span className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
                  {effectiveAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <button
                onClick={handleCreatePaymentQR}
                disabled={isGeneratingQR || effectiveAmount < 10000}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium text-xs shadow-sm hover:shadow active:scale-98 transition-all disabled:opacity-50"
              >
                {isGeneratingQR ? (
                  <span>Đang Tạo Mã...</span>
                ) : (
                  <>
                    <span>Tạo Mã QR Thanh Toán</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: QR Code Presentation */}
        {step === 'qr' && paymentData && (
          <div className="space-y-5">
            {/* Header info with countdown */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] text-xs">
              <span className="text-[#1D1D1F] font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF9500]" />
                <span>Mã có hiệu lực trong:</span>
              </span>
              <span className="font-semibold text-[#1D1D1F] text-sm">
                {formatTime(countdownSeconds)}
              </span>
            </div>

            {/* QR Code Presentation */}
            <div className="flex flex-col items-center justify-center p-6 rounded-[28px] bg-[#F5F5F7] border border-black/[0.06] space-y-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-black/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={paymentData.qrCodeUrl}
                  alt="Mã QR thanh toán 3D Hub"
                  className="w-56 h-56 object-contain rounded-xl"
                />
              </div>

              <p className="text-xs text-[#6E6E73] text-center max-w-xs leading-relaxed">
                Mở ứng dụng <strong>{method === 'vietqr' ? 'Ngân hàng (Mobile Banking)' : 'Ví MoMo'}</strong> và quét mã QR ở trên để hoàn tất tức thì.
              </p>
            </div>

            {/* Account & Transfer Details */}
            <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#6E6E73]">
                <span>Ngân hàng thụ hưởng:</span>
                <span className="font-semibold text-[#1D1D1F]">
                  {method === 'vietqr' ? OFFICIAL_BANK_INFO.bankName : 'Ví MoMo'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#6E6E73]">
                <span>Số tài khoản / SĐT:</span>
                <div className="flex items-center gap-1.5 font-semibold text-[#1D1D1F]">
                  <span>{method === 'vietqr' ? OFFICIAL_BANK_INFO.accountNumber : OFFICIAL_MOMO_INFO.phoneNumber}</span>
                  <button
                    onClick={() => copyToClipboard(method === 'vietqr' ? OFFICIAL_BANK_INFO.accountNumber : OFFICIAL_MOMO_INFO.phoneNumber, 'account')}
                    className="p-1 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                    title="Sao chép"
                  >
                    {copiedField === 'account' ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[#6E6E73]">
                <span>Số tiền chuyển khoản:</span>
                <span className="font-semibold text-[#34C759] text-sm">
                  {effectiveAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="flex items-center justify-between text-[#6E6E73] pt-2 border-t border-black/[0.06]">
                <span>Nội dung chuyển khoản (bắt buộc):</span>
                <div className="flex items-center gap-1.5 font-semibold text-[#1D1D1F] bg-white px-2.5 py-1 rounded-lg border border-black/[0.08]">
                  <span>{paymentData.transferContent}</span>
                  <button
                    onClick={() => copyToClipboard(paymentData.transferContent, 'content')}
                    className="p-1 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                    title="Sao chép"
                  >
                    {copiedField === 'content' ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 py-3 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-xs font-medium transition-colors"
              >
                Đổi Mệnh Giá
              </button>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isConfirming}
                className="flex-[2] py-3 rounded-full bg-[#34C759] hover:bg-[#2EB34F] text-white font-medium text-xs shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {isConfirming ? (
                  <span>Đang Kiểm Tra...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tôi Đã Chuyển Khoản Xong</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success Screen */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center mx-auto border border-[#34C759]/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">Nạp Tiền Thành Công</h4>
              <p className="text-xs text-[#86868B]">
                Đã cộng <strong className="text-[#34C759]">+{effectiveAmount.toLocaleString('vi-VN')} đ</strong> vào ví tài khoản của bạn.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-[#1D1D1F] hover:bg-[#2D2D2F] text-white text-xs font-medium transition-all shadow-sm"
            >
              Hoàn Tất &amp; Tiếp Tục
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
