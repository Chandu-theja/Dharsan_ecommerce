'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, Home, MessageCircle, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

function OrderSuccessContent() {
  const params = useSearchParams();
  const orderNumber = params.get('orderNumber');
  const { clearCart } = useCartStore();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-card-hover p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={44} className="text-green-600" strokeWidth={1.5} />
          </div>

          <h1 className="font-display text-3xl font-semibold text-navy-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="font-body text-sm text-gray-600 mb-6">
            Thank you for shopping with us. We've received your order.
          </p>

          {orderNumber && (
            <div className="bg-cream-100 border border-cream-200 rounded-lg p-4 mb-6">
              <p className="font-body text-xs text-gray-500 mb-1">Order Number</p>
              <p className="font-display text-2xl font-semibold text-gold-600">
                #{orderNumber}
              </p>
            </div>
          )}

          <div className="space-y-2 mb-6 text-left">
            <div className="flex items-start gap-2.5 text-sm font-body text-gray-600">
              <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span>Order confirmation sent to your email & WhatsApp</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm font-body text-gray-600">
              <Package size={16} className="text-gold-500 flex-shrink-0 mt-0.5" />
              <span>We'll ship within 1-2 business days</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm font-body text-gray-600">
              <MessageCircle size={16} className="text-gold-500 flex-shrink-0 mt-0.5" />
              <span>You'll get tracking info once shipped</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/orders" className="flex-1 btn-primary text-center">
              View My Orders
            </Link>
            <Link href="/" className="flex-1 btn-secondary text-center flex items-center justify-center gap-1.5">
              <Home size={15} /> Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-50 flex items-center justify-center"><Loader2 className="animate-spin text-gold-500" size={32} /></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
