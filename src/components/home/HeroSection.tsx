'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play } from 'lucide-react';
import { useState } from 'react';

export default function HeroSection() {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <section className="relative h-[88vh] min-h-[600px] max-h-[900px] overflow-hidden bg-navy-950">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className="w-full h-full object-cover"
          poster="/images/hero-poster.jpg"
        >
          {/* Owner: replace these with your own brand videos (Cloudinary, OCI, or local /public/videos/) */}
          <source src="/videos/hero-1.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Fallback image if video doesn't load yet */}
      {!videoLoaded && (
        <div className="absolute inset-0 bg-hero-gradient">
          <div className="absolute inset-0 opacity-20"
               style={{
                 backgroundImage: `radial-gradient(circle at 20% 30%, #C8991E 0%, transparent 50%),
                                   radial-gradient(circle at 80% 70%, #E5B83A 0%, transparent 50%)`,
               }}
          />
        </div>
      )}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 hero-overlay" />

      {/* Decorative gold corners */}
      <div className="absolute top-6 left-6 md:top-12 md:left-12 w-16 md:w-24 h-16 md:h-24 border-l-2 border-t-2 border-gold-500/60 z-10" />
      <div className="absolute top-6 right-6 md:top-12 md:right-12 w-16 md:w-24 h-16 md:h-24 border-r-2 border-t-2 border-gold-500/60 z-10" />
      <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 w-16 md:w-24 h-16 md:h-24 border-l-2 border-b-2 border-gold-500/60 z-10" />
      <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 w-16 md:w-24 h-16 md:h-24 border-r-2 border-b-2 border-gold-500/60 z-10" />

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-4xl animate-fade-in">
          {/* Tagline above */}
          <p className="font-body text-xs md:text-sm text-gold-400 tracking-[0.4em] uppercase mb-4 md:mb-6">
            Tirupati's Premier Clothing House
          </p>

          {/* Crown ornament */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 md:w-20 h-px bg-gold-500/60" />
            <div className="w-2 h-2 rounded-full bg-gold-500" />
            <div className="w-12 md:w-20 h-px bg-gold-500/60" />
          </div>

          {/* Main heading */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white font-light leading-[1.05] mb-6">
            Best clothes.<br />
            <span className="italic text-gold-gradient font-medium">Best stitch.</span>
          </h1>

          <p className="font-body text-base md:text-lg text-cream-100/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover premium readymade and plain wear for men, women & kids — backed by 
            Tirupati's most trusted stitching craftsmanship.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-navy-900 font-body font-semibold px-8 py-4 rounded transition-all duration-200 shadow-gold-lg hover:scale-[1.02] active:scale-95"
            >
              Shop Collection
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/stitching"
              className="inline-flex items-center gap-2 bg-transparent border-2 border-gold-500/70 hover:border-gold-500 text-gold-400 hover:text-gold-300 font-body font-semibold px-8 py-4 rounded transition-all duration-200 backdrop-blur-sm hover:bg-gold-500/10"
            >
              Custom Stitching
            </Link>
          </div>

          {/* Languages indicator */}
          <p className="font-body text-xs text-gold-400/60 mt-12 tracking-wider">
            EN · తెలుగు · हिन्दी
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce hidden md:block">
        <div className="w-6 h-10 border-2 border-gold-400/60 rounded-full flex items-start justify-center p-1.5">
          <div className="w-1 h-2 bg-gold-400 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
