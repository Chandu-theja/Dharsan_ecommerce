import { Instagram } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const SAMPLE_FEED = [
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80',
  'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&q=80',
  'https://images.unsplash.com/photo-1594387303039-d8bc8e3b6db1?w=400&q=80',
  'https://images.unsplash.com/photo-1622445275576-721325763afe?w=400&q=80',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80',
];

export default function InstagramFeed() {
  return (
    <section className="py-20 bg-cream-50">
      <div className="container-custom">
        <div className="text-center mb-10">
          <Link
            href="https://www.instagram.com/dharsandresses/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mb-4 group"
          >
            <Instagram size={20} className="text-gold-600" />
            <span className="font-body text-sm font-semibold text-navy-900 group-hover:text-gold-600 transition-colors">
              @dharsandresses
            </span>
          </Link>
          <h2 className="section-heading mb-3">Follow Our Story</h2>
          <p className="font-body text-base text-gray-600 max-w-xl mx-auto">
            See our latest collections, behind-the-scenes and customer stories on Instagram
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {SAMPLE_FEED.map((src, i) => (
            <Link
              key={i}
              href="https://www.instagram.com/dharsandresses/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden rounded group"
            >
              <Image
                src={src}
                alt={`Dharsan Dresses Instagram ${i + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 16vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-navy-900/0 group-hover:bg-navy-900/60 transition-colors duration-300 flex items-center justify-center">
                <Instagram
                  size={28}
                  className="text-gold-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
