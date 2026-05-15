'use client';

import { useState } from 'react';
import { ShoppingBag, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';

interface ProductInput {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: { url: string }[];
  variants: { id: string; size?: string; stock: number }[];
}

export default function AddToCartButton({ product }: { product: ProductInput }) {
  const { addItem, openCart } = useCartStore();
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product.variants[0]?.id
  );
  const [qty, setQty] = useState(1);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const stock = selectedVariant?.stock ?? 0;
  const inStock = product.variants.length === 0 || stock > 0;
  const maxQty = product.variants.length === 0 ? 10 : Math.min(stock, 10);

  const handleAdd = () => {
    if (!inStock) {
      toast.error('Out of stock');
      return;
    }
    addItem({
      id: `${product.id}-${selectedVariantId ?? 'default'}`,
      productId: product.id,
      variantId: selectedVariantId,
      name: product.name,
      image: product.images[0]?.url || '/images/placeholder.jpg',
      price: product.price,
      size: selectedVariant?.size,
      quantity: qty,
      stock: stock || 10,
    });
    toast.success('Added to cart');
    openCart();
  };

  return (
    <div>
      {product.variants.length > 0 && product.variants.some((v) => v.size) && (
        <div className="mb-5">
          <p className="font-body text-xs uppercase tracking-wider text-gray-500 mb-2">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariantId(v.id)}
                disabled={v.stock === 0}
                className={`min-w-[48px] h-11 px-3 rounded border font-body text-sm font-medium transition-colors ${
                  selectedVariantId === v.id
                    ? 'border-navy-900 bg-navy-900 text-gold-400'
                    : v.stock === 0
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                    : 'border-navy-200 text-navy-800 hover:border-navy-900'
                }`}
              >
                {v.size || 'Default'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center border border-navy-200 rounded">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-11 h-11 flex items-center justify-center text-navy-800 hover:bg-cream-100"
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>
          <span className="w-12 text-center font-body font-medium text-navy-900">{qty}</span>
          <button
            onClick={() => setQty(Math.min(maxQty, qty + 1))}
            className="w-11 h-11 flex items-center justify-center text-navy-800 hover:bg-cream-100"
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>
        {inStock && stock > 0 && stock <= 5 && (
          <p className="font-body text-xs text-red-600">Only {stock} left</p>
        )}
      </div>

      <button
        onClick={handleAdd}
        disabled={!inStock}
        className="w-full flex items-center justify-center gap-2 py-4 bg-navy-900 text-gold-400 rounded font-body font-medium hover:bg-navy-800 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        <ShoppingBag size={18} />
        {inStock ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  );
}
