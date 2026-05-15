import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ProductCard, { ProductCardData } from '@/components/product/ProductCard';
import { db } from '@/lib/db';

interface Props {
  title: string;
  subtitle?: string;
  filter: 'new' | 'featured' | 'sale';
  viewAllHref: string;
}

async function getProducts(filter: 'new' | 'featured' | 'sale'): Promise<ProductCardData[]> {
  try {
    const where =
      filter === 'new' ? { isNewArrival: true, isPublished: true } :
      filter === 'sale' ? { isOnSale: true, isPublished: true } :
      { isFeatured: true, isPublished: true };

    const products = await db.product.findMany({
      where,
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 2 },
        variants: { where: { isActive: true }, select: { id: true, size: true, stock: true } },
      },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice ?? undefined,
      images: p.images.map((img) => ({ url: img.url, altText: img.altText ?? undefined })),
      isNewArrival: p.isNewArrival,
      isOnSale: p.isOnSale,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
      variants: p.variants.map((v) => ({ ...v, size: v.size ?? undefined })),
    }));
  } catch (err) {
    // During initial setup before DB is seeded, return empty
    return [];
  }
}

export default async function FeaturedProducts({ title, subtitle, filter, viewAllHref }: Props) {
  const products = await getProducts(filter);

  if (products.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="font-body text-xs text-gold-600 tracking-[0.3em] uppercase mb-2">
              {filter === 'new' ? 'Just In' : filter === 'sale' ? 'Limited Time' : 'Most Loved'}
            </p>
            <h2 className="section-heading mb-2">{title}</h2>
            {subtitle && <p className="font-body text-base text-gray-600">{subtitle}</p>}
          </div>
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-navy-900 hover:text-gold-600 group"
          >
            View All
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}
