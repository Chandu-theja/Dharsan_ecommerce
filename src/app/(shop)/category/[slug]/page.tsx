import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import ProductCard, { ProductCardData } from '@/components/product/ProductCard';

interface Props {
  params: { slug: string };
  searchParams: {
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  };
}

export const dynamic = 'force-dynamic';

async function getCategoryAndProducts(slug: string, sp: Props['searchParams']) {
  try {
    const category = await db.category.findUnique({
      where: { slug },
      include: { subcategories: { where: { isActive: true } } },
    });

    if (!category) return { category: null, products: [] };

    const where: any = {
      isPublished: true,
      categoryId: category.id,
    };
    if (sp.minPrice || sp.maxPrice) {
      where.price = {};
      if (sp.minPrice) where.price.gte = parseFloat(sp.minPrice);
      if (sp.maxPrice) where.price.lte = parseFloat(sp.maxPrice);
    }

    const orderBy =
      sp.sort === 'price-asc' ? { price: 'asc' as const } :
      sp.sort === 'price-desc' ? { price: 'desc' as const } :
      sp.sort === 'popular' ? { totalSold: 'desc' as const } :
      sp.sort === 'rating' ? { averageRating: 'desc' as const } :
      { createdAt: 'desc' as const };

    const products = await db.product.findMany({
      where,
      orderBy,
      take: 48,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 2 },
        variants: { where: { isActive: true }, select: { id: true, size: true, stock: true } },
      },
    });

    return { category, products };
  } catch {
    return { category: null, products: [] };
  }
}

export async function generateMetadata({ params }: Props) {
  const category = await db.category.findUnique({ where: { slug: params.slug } }).catch(() => null);
  return {
    title: category ? `${category.name} – Dharsan Dresses` : 'Category – Dharsan Dresses',
    description: category?.description || `Shop ${params.slug} at Dharsan Dresses.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category, products } = await getCategoryAndProducts(params.slug, searchParams);

  if (!category) notFound();

  return (
    <div className="bg-cream-50 min-h-screen">
      <section className="bg-navy-gradient py-12">
        <div className="container-custom text-center">
          <p className="font-body text-xs text-gold-400 tracking-[0.3em] uppercase mb-3">
            {category.gender === 'WOMEN' ? 'Women' : category.gender === 'MEN' ? 'Men' : category.gender === 'KIDS' ? 'Kids' : 'Shop'}
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-white mb-3">
            {category.name}
          </h1>
          {category.description && (
            <p className="font-body text-sm text-navy-200 max-w-xl mx-auto mb-4">{category.description}</p>
          )}
          <div className="w-16 h-0.5 bg-gold-500 mx-auto" />
        </div>
      </section>

      <div className="container-custom py-10">
        {category.subcategories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {category.subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/products?category=${category.slug}&subcategory=${sub.slug}`}
                className="px-4 py-2 border border-navy-200 rounded-full text-sm font-body text-navy-800 hover:bg-navy-900 hover:text-gold-400 transition-colors"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <p className="font-body text-sm text-gray-600">
            Showing <strong>{products.length}</strong> products
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="font-display text-2xl text-navy-800 mb-3">No products yet</h2>
            <p className="font-body text-gray-600 mb-6">
              We're adding fresh pieces to this collection. Check back soon.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-navy-900 text-gold-400 rounded font-body font-medium hover:bg-navy-800 transition-colors"
            >
              Browse all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product as unknown as ProductCardData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
