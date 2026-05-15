import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const CATEGORIES = [
  {
    name: 'Sarees',
    nameTE: 'చీరలు',
    slug: 'sarees',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
    span: 'col-span-2 row-span-2',
    description: 'Silk, Cotton, Pattu & Fancy',
  },
  {
    name: 'Men\'s Shirts',
    slug: 'formal-shirts',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80',
    description: 'Formal & Casual',
  },
  {
    name: 'Salwar Suits',
    slug: 'salwar-suits-stitched',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&q=80',
    description: 'Stitched & Unstitched',
  },
  {
    name: 'Dhotis & Panchas',
    slug: 'dhotis-panchas',
    image: 'https://images.unsplash.com/photo-1622445275576-721325763afe?w=400&q=80',
    description: 'Traditional wear',
  },
  {
    name: 'Lehengas',
    slug: 'lehengas',
    image: 'https://images.unsplash.com/photo-1594387303039-d8bc8e3b6db1?w=400&q=80',
    description: 'For special occasions',
  },
  {
    name: 'Fabric by Meter',
    slug: 'fabric-by-meter',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80',
    description: 'Customer favorite',
  },
  {
    name: 'Kids Wear',
    slug: 'kids',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
    description: 'Cute & comfortable',
  },
];

export default function CategoryShowcase() {
  return (
    <section className="py-20 bg-cream-50">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-body text-xs text-gold-600 tracking-[0.3em] uppercase mb-3">
            Discover
          </p>
          <h2 className="section-heading mb-3">Shop by Category</h2>
          <div className="gold-divider mb-4" />
          <p className="font-body text-base text-gray-600 max-w-xl mx-auto">
            From everyday essentials to occasion wear — explore our curated collections
          </p>
        </div>

        {/* Grid - Bento Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-[repeat(4,180px)] md:grid-rows-[repeat(2,260px)] gap-3 md:gap-4">
          {CATEGORIES.map((cat, idx) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`relative group overflow-hidden rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 ${
                idx === 0 ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-transparent" />
              
              {/* Gold accent line */}
              <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gold-500 transition-all duration-500" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 text-white">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className={`font-display font-semibold leading-tight ${
                      idx === 0 ? 'text-2xl md:text-4xl' : 'text-lg md:text-xl'
                    }`}>
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="font-body text-xs md:text-sm text-cream-200/80 mt-1">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight 
                    size={idx === 0 ? 24 : 18}
                    className="text-gold-400 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View all */}
        <div className="text-center mt-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-navy-900 hover:text-gold-600 group"
          >
            View All Categories
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
