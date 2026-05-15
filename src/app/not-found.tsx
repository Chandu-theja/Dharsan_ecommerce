import Link from 'next/link';
import { Home, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-cream-50 px-4 py-20">
      <div className="text-center max-w-xl">
        <p className="font-body text-xs text-gold-600 tracking-[0.3em] uppercase mb-4">
          Page Not Found
        </p>
        <h1 className="font-display text-7xl md:text-8xl font-semibold text-navy-900 mb-2">
          404
        </h1>
        <div className="w-16 h-0.5 bg-gold-500 mx-auto mb-6" />
        <h2 className="font-display text-2xl md:text-3xl text-navy-800 mb-3">
          This page took a detour
        </h2>
        <p className="font-body text-base text-gray-600 mb-8">
          The page you're looking for doesn't exist or has moved. Let's get you back to the collection.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-navy-900 text-gold-400 rounded font-body font-medium hover:bg-navy-800 transition-colors"
          >
            <Home size={18} />
            Back to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-navy-900 text-navy-900 rounded font-body font-medium hover:bg-navy-900 hover:text-gold-400 transition-colors"
          >
            <ShoppingBag size={18} />
            Shop All Products
          </Link>
        </div>
      </div>
    </div>
  );
}
