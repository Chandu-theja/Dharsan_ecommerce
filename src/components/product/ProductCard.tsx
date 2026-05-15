'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: { url: string; altText?: string }[];
  isNewArrival?: boolean;
  isOnSale?: boolean;
  averageRating?: number;
  reviewCount?: number;
  variants?: { id: string; size?: string; stock: number }[];
}

interface Props {
  product: ProductCardData;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: Props) {
  const [hovered, setHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem, openCart } = useCartStore();

  const primaryImage = product.images?.[0]?.url || '/images/placeholder.jpg';
  const hoverImage = product.images?.[1]?.url || primaryImage;
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const firstAvailableVariant = product.variants?.find((v) => v.stock > 0);
    if (product.variants && product.variants.length > 0 && !firstAvailableVariant) {
      toast.error('Out of stock');
      return;
    }

    addItem({
      id: `${product.id}-${firstAvailableVariant?.id || 'default'}`,
      productId: product.id,
      variantId: firstAvailableVariant?.id,
      name: product.name,
      image: primaryImage,
      price: product.price,
      size: firstAvailableVariant?.size,
      quantity: 1,
      stock: firstAvailableVariant?.stock || 99,
    });
    toast.success('Added to cart');
    openCart();
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block product-card-hover bg-white rounded-lg overflow-hidden shadow-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-cream-100 overflow-hidden">
        <Image
          src={hovered && hoverImage !== primaryImage ? hoverImage : primaryImage}
          alt={product.images[0]?.altText || product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNewArrival && (
            <span className="badge-new shadow-sm">NEW</span>
          )}
          {product.isOnSale && discount > 0 && (
            <span className="badge-sale shadow-sm">-{discount}%</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
            isWishlisted
              ? 'bg-red-500 text-white scale-110'
              : 'bg-white/90 text-navy-700 hover:bg-white hover:scale-110'
          }`}
          aria-label="Add to wishlist"
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Quick Actions Overlay */}
        <div className={`absolute inset-x-3 bottom-3 flex gap-2 transition-all duration-300 ${
          hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}>
          <button
            onClick={handleQuickAdd}
            className="flex-1 bg-navy-900/95 hover:bg-navy-800 text-gold-400 font-body text-xs font-semibold py-2.5 rounded transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ShoppingBag size={13} />
            Quick Add
          </button>
          <div className="w-10 h-10 bg-white/95 hover:bg-white text-navy-700 rounded flex items-center justify-center shadow-sm">
            <Eye size={14} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-body text-sm font-medium text-navy-900 mb-1 line-clamp-2 group-hover:text-gold-600 transition-colors">
          {product.name}
        </h3>

        {product.reviewCount && product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-gold-500 text-xs">★</span>
            <span className="font-body text-xs text-gray-600">
              {product.averageRating?.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        )}

        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-semibold text-navy-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="font-body text-xs text-gray-400 line-through">
              ₹{product.comparePrice.toLocaleString('en-IN')}
            </span>
          )}
          {discount > 0 && (
            <span className="font-body text-xs font-semibold text-green-600">
              Save {discount}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
