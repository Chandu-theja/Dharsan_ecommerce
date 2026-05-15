import Link from 'next/link';
import { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export default function PageStub({ eyebrow, title, description, children }: Props) {
  return (
    <div className="bg-cream-50 min-h-screen">
      <section className="bg-navy-gradient py-14">
        <div className="container-custom text-center">
          {eyebrow && (
            <p className="font-body text-xs text-gold-400 tracking-[0.3em] uppercase mb-3">{eyebrow}</p>
          )}
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-white mb-3">{title}</h1>
          <div className="w-16 h-0.5 bg-gold-500 mx-auto" />
        </div>
      </section>

      <div className="container-custom py-12 max-w-3xl">
        {description && (
          <p className="font-body text-base text-gray-700 leading-relaxed mb-6">{description}</p>
        )}
        {children}
        <div className="mt-10 pt-8 border-t border-cream-200 text-center">
          <p className="font-body text-sm text-gray-600 mb-3">
            Need help? We're a call away.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 border border-navy-900 text-navy-900 rounded font-body text-sm font-medium hover:bg-navy-900 hover:text-gold-400 transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-navy-900 text-gold-400 rounded font-body text-sm font-medium hover:bg-navy-800 transition-colors"
            >
              Shop All Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
