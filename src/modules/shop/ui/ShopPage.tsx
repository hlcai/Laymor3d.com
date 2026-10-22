'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useShop } from '@/hooks/useShop';
import { ShopHeader } from '@/components/shop/ShopHeader';
import { FilamentAccessoriesView } from '@/components/shop/FilamentAccessoriesView';
import { PrintingServicesProfilesView } from '@/components/shop/PrintingServicesProfilesView';
import { ModelMarketplaceView } from '@/components/shop/ModelMarketplaceView';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { ProductDetailModal } from '@/components/shop/ProductDetailModal';
import { OrderServiceModal } from '@/components/shop/OrderServiceModal';
import { IPrintingServicePackage, IServiceQuoteResult } from '@/backend/domain/shop';
import { CheckCircle2, AlertCircle } from '@/components/icons/MinimalIcons';

function ShopInner() {
  const shop = useShop();
  const searchParams = useSearchParams();

  // State for Service Order Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedServiceForOrder, setSelectedServiceForOrder] = useState<IPrintingServicePackage | undefined>();
  const [selectedQuoteForOrder, setSelectedQuoteForOrder] = useState<IServiceQuoteResult | undefined>();

  // Tự động chuyển tab dịch vụ in nếu được điều hướng từ 3D Studio (?tab=services)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'services' || tab === 'services_profiles' || tab === 'printing_services') {
      shop.setActiveTab('printing_services');
    } else if (tab === 'models' || tab === 'models_marketplace') {
      shop.setActiveTab('models_marketplace');
    }
  }, [searchParams, shop.setActiveTab]);

  const handleOpenOrderModal = (pkg?: IPrintingServicePackage, quote?: IServiceQuoteResult) => {
    setSelectedServiceForOrder(pkg);
    setSelectedQuoteForOrder(quote);
    setIsOrderModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {shop.toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 border border-indigo-500/50 text-slate-100 shadow-2xl text-xs font-semibold backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{shop.toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header with 3 Tabs & Global Search */}
      <ShopHeader
        activeTab={shop.activeTab}
        setActiveTab={shop.setActiveTab}
        searchQuery={shop.searchQuery}
        setSearchQuery={shop.setSearchQuery}
        cartCount={shop.cartItemsCount}
        onOpenCart={() => shop.setIsCartOpen(true)}
        filamentsCount={shop.filaments.length + shop.accessories.length}
        servicesCount={shop.services.length + shop.profiles.length}
        modelsCount={shop.models.length}
      />

      {/* Main Category Content */}
      <main>
        {shop.isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Đang tải dữ liệu cửa hàng 3D Hub...</p>
          </div>
        ) : (
          <>
            {/* Category 1: Nhựa in & Phụ kiện in 3D */}
            {shop.activeTab === 'filaments_accessories' && (
              <FilamentAccessoriesView
                filaments={shop.filaments}
                accessories={shop.accessories}
                subTab={shop.filamentSubTab}
                setSubTab={shop.setFilamentSubTab}
                selectedMaterial={shop.selectedMaterial}
                setSelectedMaterial={shop.setSelectedMaterial}
                selectedAccessorySub={shop.selectedAccessorySub}
                setSelectedAccessorySub={shop.setSelectedAccessorySub}
                selectedBrand={shop.selectedBrand}
                setSelectedBrand={shop.setSelectedBrand}
                onAddToCart={shop.addToCart}
                onViewDetail={shop.setSelectedDetailItem}
              />
            )}

            {/* Category 2: In Dịch Vụ & Profile In */}
            {shop.activeTab === 'printing_services' && (
              <PrintingServicesProfilesView
                services={shop.services}
                profiles={shop.profiles}
                subTab={shop.serviceSubTab}
                setSubTab={shop.setServiceSubTab}
                selectedSlicer={shop.selectedSlicer}
                setSelectedSlicer={shop.setSelectedSlicer}
                quoteParams={shop.quoteParams}
                setQuoteParams={shop.setQuoteParams}
                quoteResult={shop.quoteResult}
                isCalculatingQuote={shop.isCalculatingQuote}
                onCalculateQuote={shop.calculateServiceQuote}
                onOpenOrderModal={handleOpenOrderModal}
                onAddToCart={shop.addToCart}
                onShowToast={shop.showToast}
              />
            )}

            {/* Category 3: Model Marketplace (Free & Trả Phí) */}
            {shop.activeTab === 'models_marketplace' && (
              <ModelMarketplaceView
                models={shop.models}
                modelTypeFilter={shop.modelTypeFilter}
                setModelTypeFilter={shop.setModelTypeFilter}
                selectedCategory={shop.selectedModelCategory}
                setSelectedCategory={shop.setSelectedModelCategory}
                onAddToCart={shop.addToCart}
                onViewDetail={shop.setSelectedDetailItem}
                onShowToast={shop.showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={shop.isCartOpen}
        onClose={() => shop.setIsCartOpen(false)}
        items={shop.cartItems}
        onUpdateQuantity={shop.updateQuantity}
        onRemoveItem={shop.removeFromCart}
        onClearCart={shop.clearCart}
        totalVnd={shop.cartTotalVnd}
        onCheckout={shop.handleCheckout}
        isProcessing={shop.isProcessingOrder}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        item={shop.selectedDetailItem}
        onClose={() => shop.setSelectedDetailItem(null)}
        onAddToCart={shop.addToCart}
      />

      {/* Custom Service Order Modal */}
      <OrderServiceModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        servicePackage={selectedServiceForOrder}
        quote={selectedQuoteForOrder}
        onShowToast={shop.showToast}
      />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Đang chuẩn bị Cửa hàng 3D Hub...</div>}>
      <ShopInner />
    </Suspense>
  );
}
