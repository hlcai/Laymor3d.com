'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Wallet,
  Truck,
  CreditCard,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  PackageCheck,
} from '@/components/icons/MinimalIcons';
import { ICartItem } from '@/backend/domain/shop';
import { useUserWallet } from '@/hooks/useUserWallet';
import { useSystemEnvironment } from '@/hooks/useSystemEnvironment';
import {
  generateVietQRUrl,
  generateMoMoQRUrl,
  OFFICIAL_BANK_INFO,
  OFFICIAL_MOMO_INFO,
} from '@/backend/domain/payment';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: ICartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  totalVnd: number;
  onCheckout: (
    paymentMethod: 'wallet' | 'vietqr' | 'momo' | 'cod' | 'bank_transfer',
    customerInfo: { name: string; phone: string; address: string; notes?: string }
  ) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  isProcessing: boolean;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  totalVnd,
  onCheckout,
  isProcessing,
}: CartDrawerProps) {
  const { balanceVnd, setIsTopUpModalOpen } = useUserWallet();
  const { commercial } = useSystemEnvironment();
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'vietqr' | 'momo' | 'cod'>('wallet');

  // Customer Form
  const [name, setName] = useState('Nguyễn Văn Khách');
  const [phone, setPhone] = useState('0909887766');
  const [address, setAddress] = useState('Số 45 Đường Lê Duẩn, Quận 1, TP. HCM');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success State
  const [completedOrder, setCompletedOrder] = useState<{ orderId: string; totalVnd: number } | null>(null);

  // Copy state for QR codes
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const isWalletInsufficient = paymentMethod === 'wallet' && balanceVnd < totalVnd;

  const orderTransferCode = `DH${Math.floor(100000 + Math.random() * 900000)}`;

  const vietQrUrl = generateVietQRUrl(totalVnd, orderTransferCode);
  const momoQrUrl = generateMoMoQRUrl(totalVnd, orderTransferCode);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (items.length === 0) {
      setErrorMsg('Giỏ hàng đang trống!');
      return;
    }

    if (!name.trim() || !phone.trim() || !address.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng!');
      return;
    }

    if (isWalletInsufficient) {
      setErrorMsg('Số dư ví 3D Hub không đủ. Vui lòng nạp thêm tiền hoặc chọn VietQR / MoMo / COD.');
      return;
    }

    const res = await onCheckout(paymentMethod, {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
    });

    if (res.success && res.orderId) {
      setCompletedOrder({
        orderId: res.orderId,
        totalVnd,
      });
      onClearCart();
    } else {
      setErrorMsg(res.error || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!');
    }
  };

  const handleCloseAndReset = () => {
    setCompletedOrder(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={handleCloseAndReset}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between text-slate-900">
          {/* Top Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700 shadow-2xs">
                <ShoppingCart className="w-5 h-5 text-cyan-700" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Giỏ Hàng Của Bạn</h2>
                <p className="text-xs text-slate-500">{items.length} món hàng được chọn</p>
              </div>
            </div>

            <button
              onClick={handleCloseAndReset}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* If Order Completed */}
          {completedOrder ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/10">
                <PackageCheck className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Đặt Hàng Thành Công!</h3>
                <p className="text-xs text-emerald-700 font-bold mt-1">
                  Mã đơn hàng: #{completedOrder.orderId}
                </p>
                <p className="text-xs text-slate-600 mt-2 max-w-xs leading-relaxed">
                  Đơn hàng thương mại đã được tiếp nhận bởi {commercial?.companyName || '3D Hub'}. Hệ thống tự động xuất phiếu bảo hành 1 đổi 1 và giao hàng trong 24h.
                </p>
              </div>

              <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Hình thức:</span>
                  <span className="font-bold text-slate-900 uppercase">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng thanh toán:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {completedOrder.totalVnd.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Người nhận:</span>
                  <span className="font-semibold text-slate-900">{name} ({phone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Địa chỉ:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[180px]">{address}</span>
                </div>
              </div>

              <div className="w-full space-y-2 pt-2">
                <a
                  href="/admin"
                  className="w-full block py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs transition-colors shadow-2xs text-center cursor-pointer"
                >
                  Xem Điều Phối Xưởng In (Admin)
                </a>
                <button
                  onClick={handleCloseAndReset}
                  className="w-full py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            </div>
          ) : (
            /* Items List Scrollable */
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Giỏ hàng đang trống</h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Khám phá cuộn nhựa chính hãng, linh kiện hoặc đặt in dịch vụ 3D để thêm vào giỏ.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
                    <span className="font-semibold">Sản phẩm ({items.length})</span>
                    <button
                      onClick={onClearCart}
                      className="text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-cyan-300 transition-colors shadow-2xs"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1.5 shrink-0 overflow-hidden relative shadow-2xs">
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            width={36}
                            height={36}
                            unoptimized={item.imageUrl?.endsWith?.('.svg')}
                            className="object-contain max-w-full max-h-full"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                          {item.subText && (
                            <p className="text-[11px] text-slate-500 truncate">{item.subText}</p>
                          )}
                          <div className="text-xs font-bold text-emerald-700 mt-1">
                            {(item.priceVnd * item.quantity).toLocaleString('vi-VN')} đ
                          </div>
                        </div>

                        {/* Quantity & Delete */}
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Xóa món này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-1.5 bg-white rounded-xl p-0.5 border border-slate-200">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-slate-900 px-1.5">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Options Form */}
                  <form onSubmit={handleSubmitCheckout} className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800 block">
                        Chọn Cổng Thanh Toán
                      </label>

                      {/* 1. Wallet */}
                      <div
                        onClick={() => setPaymentMethod('wallet')}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          paymentMethod === 'wallet'
                            ? 'bg-cyan-50/80 border-cyan-400 ring-2 ring-cyan-400/30 text-slate-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold">Số Dư Ví 3D Hub</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-700">
                            {balanceVnd.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        {isWalletInsufficient && (
                          <div className="mt-1 text-[11px] text-rose-600 flex items-center justify-between font-medium">
                            <span>Số dư không đủ</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsTopUpModalOpen(true);
                              }}
                              className="underline text-cyan-700 font-bold cursor-pointer"
                            >
                              + Nạp ngay VietQR/MoMo
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 2. VietQR Napas 24/7 */}
                      <div
                        onClick={() => setPaymentMethod('vietqr')}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          paymentMethod === 'vietqr'
                            ? 'bg-cyan-50/80 border-cyan-400 ring-2 ring-cyan-400/30 text-slate-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-cyan-600" />
                            <span className="text-xs font-bold">VietQR Napas 24/7 (MB Bank)</span>
                          </div>
                          <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full border border-cyan-300">
                            Tự động 30s
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Quét mã QR qua mọi ứng dụng ngân hàng (Vietcombank, MB, Techcombank, BIDV...)
                        </p>
                      </div>

                      {/* 3. MoMo QR */}
                      <div
                        onClick={() => setPaymentMethod('momo')}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          paymentMethod === 'momo'
                            ? 'bg-cyan-50/80 border-cyan-400 ring-2 ring-cyan-400/30 text-slate-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-pink-600" />
                            <span className="text-xs font-bold">Ví Điện Tử MoMo</span>
                          </div>
                          <span className="text-[10px] font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full border border-pink-300">
                            Khuyên dùng
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Mở ứng dụng MoMo quét mã QR thanh toán tức thì
                        </p>
                      </div>

                      {/* 4. COD */}
                      <div
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          paymentMethod === 'cod'
                            ? 'bg-cyan-50/80 border-cyan-400 ring-2 ring-cyan-400/30 text-slate-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold">Thanh Toán Khi Nhận Hàng (COD)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Kiểm tra sản phẩm trước khi thanh toán tiền mặt cho shipper
                        </p>
                      </div>
                    </div>

                    {/* QR Preview Box for VietQR / MoMo */}
                    {(paymentMethod === 'vietqr' || paymentMethod === 'momo') && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3 shadow-2xs">
                        <p className="text-xs font-bold text-slate-900">
                          Mã QR Thanh Toán Đơn Hàng ({totalVnd.toLocaleString('vi-VN')} đ)
                        </p>

                        <div className="relative w-44 h-44 mx-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                          <Image
                            src={paymentMethod === 'vietqr' ? vietQrUrl : momoQrUrl}
                            alt="Payment QR"
                            fill
                            className="object-contain p-1"
                            unoptimized
                          />
                        </div>

                        <div className="text-[11px] text-left space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Tài khoản nhận:</span>
                            <span className="font-bold text-slate-800">
                              {paymentMethod === 'vietqr'
                                ? `${OFFICIAL_BANK_INFO.accountNumber} (${OFFICIAL_BANK_INFO.bankId})`
                                : `${OFFICIAL_MOMO_INFO.phoneNumber} (MoMo)`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Nội dung CK:</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(orderTransferCode, 'content')}
                              className="font-mono font-bold text-cyan-700 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>{orderTransferCode}</span>
                              {copiedKey === 'content' ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Customer Delivery Information */}
                    <div className="space-y-2.5 pt-2">
                      <label className="text-xs font-bold text-slate-800 block">
                        Thông Tin Nhận Hàng
                      </label>
                      <input
                        type="text"
                        placeholder="Họ và tên người nhận *"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Số điện thoại liên hệ *"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Địa chỉ giao hàng chi tiết *"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Ghi chú in / đóng gói (tùy chọn)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
                      />
                    </div>

                    {errorMsg && (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                  </form>
                </>
              )}
            </div>
          )}

          {/* Bottom Footer Checkout Summary */}
          {!completedOrder && items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Tạm tính ({items.length} món):</span>
                <span className="font-bold text-slate-800">
                  {totalVnd.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Phí vận chuyển:</span>
                <span className="font-bold text-emerald-700">Miễn phí toàn quốc</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  {totalVnd.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <button
                type="button"
                onClick={handleSubmitCheckout}
                disabled={isProcessing || isWalletInsufficient}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-xs shadow-sm active:scale-98 transition-all cursor-pointer ${
                  isProcessing || isWalletInsufficient
                    ? 'bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                }`}
              >
                <span>
                  {isProcessing
                    ? 'Đang Xử Lý Đơn Hàng...'
                    : paymentMethod === 'vietqr' || paymentMethod === 'momo'
                    ? 'Xác Nhận & Hoàn Tất Đặt Hàng'
                    : 'Tiến Hành Đặt Hàng Ngay'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
