import Link from 'next/link';
import { Instagram, Heart, Camera } from 'lucide-react';

export default function InstagramFeed() {
  return (
    <section className="py-20 bg-cream-50">
      <div className="container-custom">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 px-6 py-14 md:px-14 md:py-20 text-center">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 15% 25%, rgba(200,153,30,0.35) 0%, transparent 45%), radial-gradient(circle at 85% 75%, rgba(200,153,30,0.25) 0%, transparent 45%)',
            }}
          />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 mb-6">
              <Instagram size={28} className="text-gold-400" />
            </div>

            <p className="font-body text-xs text-gold-400 tracking-[0.3em] uppercase mb-3">
              Follow Our Journey
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-white mb-3">
              @dharsandresses
            </h2>
            <div className="w-16 h-0.5 bg-gold-500 mx-auto mb-6" />
            <p className="font-body text-base text-cream-200/80 max-w-xl mx-auto mb-8">
              Step inside our world — new collections, behind-the-scenes from our atelier,
              and stories from the families who wear Dharsan.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-10 text-cream-200/70">
              <div className="flex items-center gap-2 font-body text-sm">
                <Camera size={16} className="text-gold-400" />
                <span>Latest collections</span>
              </div>
              <div className="flex items-center gap-2 font-body text-sm">
                <Heart size={16} className="text-gold-400" />
                <span>Customer stories</span>
              </div>
            </div>

            <Link
              href="https://www.instagram.com/dharsandresses/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gold-500 text-navy-950 rounded-full font-body font-semibold hover:bg-gold-400 transition-colors shadow-lg"
            >
              <Instagram size={18} />
              Follow on Instagram
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
