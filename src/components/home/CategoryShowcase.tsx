import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';

const SHOWCASE = [
  { name: 'Sarees',           nameTE: 'చీరలు', slug: 'sarees',                 description: 'Silk, Cotton, Pattu & Fancy' },
  { name: "Men's Shirts",     slug: 'formal-shirts',                          description: 'Formal & Casual' },
  { name: 'Salwar Suits',     slug: 'salwar-suits-stitched',                  description: 'Stitched & Unstitched' },
  { name: 'Dhotis & Panchas', slug: 'dhotis-panchas',                         description: 'Traditional wear' },
  { name: 'Lehengas',         slug: 'lehengas',                               description: 'For special occasions' },
  { name: 'Fabric by Meter',  slug: 'fabric-by-meter',                        description: 'Customer favourite' },
  { name: 'Kids Wear',        slug: 'girls-frocks',                           description: 'Cute & comfortable' },
];

async function getShowcaseImages() {
  const slugs = SHOWCASE.map((c) => c.slug);
  try {
    const categories = await db.category.findMany({
      where: { slug: { in: slugs } },
      select: {
        slug: true,
        image: true,
        products: {
          where: { isPublished: true },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: 1,
          select: {
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });

    const map = new Map<string, string | null>();
    for (const c of categories) {
      const productImage = c.products[0]?.images[0]?.url;
      map.set(c.slug, productImage || c.image || null);
    }
    return map;
  } catch {
    return new Map<string, string | null>();
  }
}

export default async function CategoryShowcase() {
  const imageMap = await getShowcaseImages();

  return (
    <section className="py-20 bg-cream-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <p className="font-body text-xs text-gold-600 tracking-[0.3em] uppercase mb-3">Discover</p>
          <h2 className="section-heading mb-3">Shop by Category</h2>
          <div className="gold-divider mb-4" />
          <p className="font-body text-base text-gray-600 max-w-xl mx-auto">
            From everyday essentials to occasion wear — explore our curated collections
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-[repeat(4,180px)] md:grid-rows-[repeat(2,260px)] gap-3 md:gap-4">
          {SHOWCASE.map((cat, idx) => {
            const image = imageMap.get(cat.slug);
            const isFeatured = idx === 0;
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={`relative group overflow-hidden rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 ${
                  isFeatured ? 'col-span-2 row-span-2' : ''
                }`}
              >
                {image ? (
                  <Image
                    src={image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <CategoryPlaceholder featured={isFeatured} />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/40 to-transparent" />
                <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gold-500 transition-all duration-500" />

                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 text-white">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className={`font-display font-semibold leading-tight ${
                        isFeatured ? 'text-2xl md:text-4xl' : 'text-lg md:text-xl'
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
                      size={isFeatured ? 24 : 18}
                      className="text-gold-400 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

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

function CategoryPlaceholder({ featured }: { featured: boolean }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(200,153,30,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(200,153,30,0.3) 0%, transparent 50%)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-gold-400/30 font-display ${featured ? 'text-9xl' : 'text-6xl'}`}>
          ❖
        </div>
      </div>
    </div>
  );
}
