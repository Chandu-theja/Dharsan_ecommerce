import Link from 'next/link';
import { Scissors, Calendar } from 'lucide-react';

export default function CraftBanner() {
  return (
    <section className="py-20 bg-navy-gradient relative overflow-hidden">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-5"
           style={{
             backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, #C8991E 35px, #C8991E 36px)`,
           }}
      />

      <div className="container-custom relative">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Custom Stitching */}
          <div className="bg-navy-800/50 backdrop-blur-sm border border-gold-500/20 rounded-lg p-8 md:p-10 hover:border-gold-500/50 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/40 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Scissors size={22} className="text-gold-400" strokeWidth={1.5} />
            </div>
            <p className="font-body text-xs text-gold-400 tracking-[0.3em] uppercase mb-2">
              Master Craftsmanship
            </p>
            <h3 className="font-display text-3xl md:text-4xl font-semibold text-white mb-3">
              Custom Stitching
            </h3>
            <p className="font-body text-base text-navy-200 mb-6 leading-relaxed">
              Tailor every garment to your measurements and style. From wedding silks to formal 
              suits — our master tailors bring your vision to life.
            </p>
            <Link
              href="/stitching"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-navy-900 font-body font-semibold px-6 py-3 rounded transition-all duration-200 shadow-gold"
            >
              Book a Tailor →
            </Link>
          </div>

          {/* Private Viewing */}
          <div className="bg-navy-800/50 backdrop-blur-sm border border-gold-500/20 rounded-lg p-8 md:p-10 hover:border-gold-500/50 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/40 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Calendar size={22} className="text-gold-400" strokeWidth={1.5} />
            </div>
            <p className="font-body text-xs text-gold-400 tracking-[0.3em] uppercase mb-2">
              Personal Experience
            </p>
            <h3 className="font-display text-3xl md:text-4xl font-semibold text-white mb-3">
              Private Viewing
            </h3>
            <p className="font-body text-base text-navy-200 mb-6 leading-relaxed">
              Book a one-on-one appointment at our Tirupati store. Browse our finest collections 
              in privacy with expert styling guidance.
            </p>
            <Link
              href="/private-viewing"
              className="inline-flex items-center gap-2 border-2 border-gold-500 text-gold-400 hover:bg-gold-500 hover:text-navy-900 font-body font-semibold px-6 py-3 rounded transition-all duration-200"
            >
              Schedule Visit →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
