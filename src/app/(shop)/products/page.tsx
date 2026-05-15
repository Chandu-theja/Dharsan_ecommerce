import { db } from '@/lib/db';
import ProductCard, { ProductCardData } from '@/components/product/ProductCard';
import { Suspense } from 'react';

interface Props {
  searchParams: {
    category?: string;
    filter?: 'new' | 'sale' | 'featured';
    search?: string;
    sort?: string;
    page?: string;
  };
}

export const dynamic = 'force-dynamic';

async function getProducts(params: Props['searchParams']) {
  const where: any = { isPublished: true };
  if (params.filter === 'new') where.isNewArrival = true;
  if (params.filter === 'sale') where.isOnSale = true;
  if (params.filter === 'featured') where.isFeatured = true;
  if (params.category) where.category = { slug: params.category };
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const orderBy =
    params.sort === 'price-asc' ? { price: 'asc' as const } :
    params.sort === 'price-desc' ? { price: 'desc' as const } :
    params.sort === 'popular' ? { totalSold: 'desc' as const } :
    { createdAt: 'desc' as const };

  try {
    const products = await db.product.findMany({
      where,
      orderBy,
      take: 48,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 2 },
        variants: { where: { isActive: true }, select: { id: true, size: true, stock: true } },
      },
    });
    return products;
  } catch {
    return [];
  }
}

export default async function ProductsPage({ searchParams }: Props) {
  const products = await getProducts(searchParams);

  const title =
    searchParams.filter === 'new' ? 'New Arrivals' :
    searchParams.filter === 'sale' ? 'Sale' :
    searchParams.filter === 'featured' ? 'Bestsellers' :
    searchParams.search ? `Results for "${searchParams.search}"` :
    'All Products';

  return (
    <div className="bg-cream-50 min-h-screen">
      {/* Header */}
      <section className="bg-navy-gradient py-12">
        <div className="container-custom text-center">
          <p className="font-body text-xs text-gold-400 tracking-[0.3em] uppercase mb-3">Shop</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-white mb-3">
            {title}
          </h1>
          <div className="w-16 h-0.5 bg-gold-500 mx-auto" />
        </div>
      </section>

      <div className="container-custom py-10">
        {/* Sort & Filter Bar */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <p className="font-body text-sm text-gray-600">
            Showing <strong>{products.length}</strong> products
          </p>
          <div className="flex items-center gap-3">
            <span className="font-body text-sm text-navy-700">Sort by:</span>
            <select className="input-field py-2 pr-8 max-w-[200px]" defaultValue={searchParams.sort || 'newest'}>
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-card">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="font-display text-2xl font-semibold text-navy-900 mb-2">No products yet</h2>
            <p className="font-body text-sm text-gray-600 mb-6 max-w-md mx-auto">
              {searchParams.search ? `We couldn't find anything matching "${searchParams.search}".` : 'Products will appear here once added to the catalog.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p, i) => (
              <ProductCard
                key={p.id}
                priority={i < 4}
                product={{
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
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
