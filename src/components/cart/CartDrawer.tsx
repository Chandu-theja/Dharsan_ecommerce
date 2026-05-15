'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const total = getTotalPrice();
  const freeShippingThreshold = 1000;
  const remainingForFreeShip = Math.max(0, freeShippingThreshold - total);
  const progressPercent = Math.min(100, (total / freeShippingThreshold) * 100);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[450px] bg-cream-50 shadow-2xl animate-slide-down overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-navy-900 p-5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl text-gold-400 font-semibold">Your Cart</h3>
            <p className="font-body text-xs text-navy-300 mt-0.5">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            onClick={closeCart}
            className="w-9 h-9 rounded-full bg-navy-700 hover:bg-navy-600 text-gold-400 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {items.length > 0 && (
          <div className="bg-cream-100 px-5 py-3 border-b border-cream-200">
            {remainingForFreeShip > 0 ? (
              <>
                <p className="font-body text-xs text-navy-700 mb-2">
                  🚚 Add <span className="font-semibold text-gold-600">₹{remainingForFreeShip.toLocaleString('en-IN')}</span> more for FREE shipping
                </p>
                <div className="w-full h-1.5 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold-gradient transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="font-body text-xs text-green-700 font-semibold">
                ✅ You've unlocked FREE shipping!
              </p>
            )}
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-full bg-cream-200 flex items-center justify-center mb-4">
                <ShoppingBag size={36} className="text-gold-500" />
              </div>
              <h4 className="font-display text-xl text-navy-900 mb-2">Your cart is empty</h4>
              <p className="font-body text-sm text-gray-500 mb-6">
                Browse our collection and add your favorites
              </p>
              <button
                onClick={closeCart}
                className="btn-primary"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.variantId || 'default'}`}
                  className="flex gap-3 bg-white p-3 rounded-lg shadow-card"
                >
                  <div className="relative w-20 h-24 flex-shrink-0 bg-cream-100 rounded overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-body text-sm font-medium text-navy-900 line-clamp-2 mb-1">
                      {item.name}
                    </h5>
                    {(item.size || item.color) && (
                      <p className="font-body text-xs text-gray-500 mb-2">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.size && item.color && <span> • </span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-cream-300 rounded">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-cream-100 text-navy-700"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-body text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-cream-100 text-navy-700"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-display text-base font-semibold text-navy-900">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="border-t border-cream-200 bg-white p-5 space-y-3">
            <div className="flex justify-between font-body text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-body text-sm text-gray-600">
              <span>Shipping</span>
              <span>{total >= freeShippingThreshold ? 'FREE' : '₹80'}</span>
            </div>
            <div className="flex justify-between border-t border-cream-200 pt-3">
              <span className="font-display text-lg font-semibold text-navy-900">Total</span>
              <span className="font-display text-xl font-bold text-gold-600">
                ₹{(total + (total >= freeShippingThreshold ? 0 : 80)).toLocaleString('en-IN')}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full text-center btn-primary"
            >
              Proceed to Checkout
            </Link>
            <button onClick={closeCart} className="block w-full text-center font-body text-sm text-navy-700 hover:text-gold-600 underline">
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
