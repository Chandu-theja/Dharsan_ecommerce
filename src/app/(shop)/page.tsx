import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Scissors, Award, Heart } from 'lucide-react';
import HeroSection from '@/components/home/HeroSection';
import CategoryShowcase from '@/components/home/CategoryShowcase';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import CraftBanner from '@/components/home/CraftBanner';
import Testimonials from '@/components/home/Testimonials';
import InstagramFeed from '@/components/home/InstagramFeed';

export const metadata = {
  title: 'Dharsan Dresses – Best Clothes & Stitching in Tirupati',
  description:
    'Shop premium readymade clothes for men, women & kids. Sarees, suits, shirts, dhotis, fabric by meter and expert custom stitching. Trusted in Tirupati for quality and craftsmanship.',
};

export default function HomePage() {
  return (
    <>
      {/* Hero with video */}
      <HeroSection />

      {/* USP Strip */}
      <section className="bg-navy-900 py-5 border-y border-gold-500/20">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Sparkles, title: 'Premium Quality', sub: 'Hand-picked fabrics' },
              { icon: Scissors, title: 'Expert Stitching', sub: 'Best in Tirupati' },
              { icon: Award, title: 'Trusted Brand', sub: 'Years of legacy' },
              { icon: Heart, title: 'For Every Family', sub: 'S to 6XL sizes' },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <f.icon size={22} className="text-gold-400" strokeWidth={1.5} />
                <div>
                  <p className="font-body text-sm font-semibold text-gold-400">{f.title}</p>
                  <p className="font-body text-xs text-navy-300">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <CategoryShowcase />

      {/* New Arrivals */}
      <FeaturedProducts
        title="New Arrivals"
        subtitle="Fresh designs, just dropped"
        filter="new"
        viewAllHref="/products?filter=new"
      />

      {/* Custom Stitching Banner */}
      <CraftBanner />

      {/* Bestsellers */}
      <FeaturedProducts
        title="Customer Favorites"
        subtitle="Bestsellers loved by thousands"
        filter="featured"
        viewAllHref="/products?filter=featured"
      />

      {/* Brand Story */}
      <section className="py-20 bg-cream-100">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-body text-xs text-gold-600 tracking-[0.3em] uppercase mb-3">
                Our Heritage
              </p>
              <h2 className="section-heading mb-6">
                Where Tradition Meets <span className="text-gold-gradient italic">Trust</span>
              </h2>
              <p className="font-body text-base text-gray-700 leading-relaxed mb-4">
                From the heart of Tirupati, Dharsan Dresses has grown into a name families trust 
                for premium clothing and master craftsmanship. From the wedding silk that catches 
                every eye to the everyday shirt that fits just right — we honor every stitch.
              </p>
              <p className="font-body text-base text-gray-700 leading-relaxed mb-6">
                Our motto is simple: <em className="text-gold-700 font-display text-lg">Best clothes. Best stitch.</em> 
                {' '}It's a promise we keep with every customer, every garment, every day.
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 font-body text-sm font-semibold text-gold-600 hover:text-gold-700 group">
                Read our story
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden shadow-card-hover">
              <div className="absolute inset-0 bg-navy-gradient">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/images/logo.png"
                    alt="Dharsan Dresses"
                    width={200}
                    height={200}
                    className="opacity-90"
                  />
                </div>
              </div>
              {/* Decorative gold corners */}
              <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-gold-500" />
              <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-gold-500" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-gold-500" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-gold-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Instagram Feed */}
      <InstagramFeed />
    </>
  );
}
