import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Truck, Shield, RotateCcw, Tag } from 'lucide-react';
import { db } from '@/lib/db';
import AddToCartButton from '@/components/product/AddToCartButton';

interface Props {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

async function getProduct(slug: string) {
  try {
    return await db.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
        category: { select: { name: true, slug: true } },
        subcategory: { select: { name: true, slug: true } },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { user: { select: { name: true } } },
        },
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Product – Dharsan Dresses' };
  return {
    title: product.seoTitle || `${product.name} – Dharsan Dresses`,
    description: product.seoDescription || product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const primary = product.images[0]?.url || '/images/placeholder.jpg';
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="bg-cream-50 min-h-screen">
      <div className="container-custom py-6">
        <nav className="flex items-center gap-2 text-xs font-body text-gray-500 mb-6">
          <Link href="/" className="hover:text-gold-600">Home</Link>
          <span>/</span>
          <Link href={`/category/${product.category.slug}`} className="hover:text-gold-600">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-navy-900 truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <div className="relative aspect-[4/5] bg-white rounded-lg overflow-hidden border border-cream-200">
              <Image
                src={primary}
                alt={product.images[0]?.altText || product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              {product.isOnSale && discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-body font-semibold px-3 py-1 rounded">
                  {discount}% OFF
                </span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {product.images.slice(0, 5).map((img) => (
                  <div key={img.id} className="relative aspect-square bg-white rounded overflow-hidden border border-cream-200">
                    <Image src={img.url} alt={img.altText || product.name} fill sizes="20vw" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.isNewArrival && (
              <p className="font-body text-xs text-gold-600 tracking-[0.3em] uppercase mb-2">
                New Arrival
              </p>
            )}
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-navy-900 mb-3">
              {product.name}
            </h1>

            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={14}
                      className={n <= Math.round(product.averageRating) ? 'fill-gold-500 text-gold-500' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-sm font-body text-gray-600">
                  {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display text-3xl font-semibold text-navy-900">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <>
                  <span className="font-body text-lg text-gray-400 line-through">
                    ₹{product.comparePrice.toLocaleString('en-IN')}
                  </span>
                  <span className="font-body text-sm font-semibold text-green-700">
                    Save ₹{(product.comparePrice - product.price).toLocaleString('en-IN')}
                  </span>
                </>
              )}
            </div>

            <p className="font-body text-base text-gray-700 leading-relaxed mb-6">
              {product.description}
            </p>

            {(product.fabric || product.origin) && (
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-body">
                {product.fabric && (
                  <div>
                    <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">Fabric</p>
                    <p className="text-navy-900 font-medium">{product.fabric}</p>
                  </div>
                )}
                {product.origin && (
                  <div>
                    <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">Origin</p>
                    <p className="text-navy-900 font-medium">{product.origin}</p>
                  </div>
                )}
              </div>
            )}

            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                images: product.images.map((i) => ({ url: i.url })),
                variants: product.variants.map((v) => ({ id: v.id, size: v.size || undefined, stock: v.stock })),
              }}
            />

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-body">
              <div className="flex items-center gap-2 text-navy-800">
                <Truck size={18} className="text-gold-600" />
                <span>Free shipping ₹1,000+</span>
              </div>
              <div className="flex items-center gap-2 text-navy-800">
                <RotateCcw size={18} className="text-gold-600" />
                <span>7-day returns</span>
              </div>
              <div className="flex items-center gap-2 text-navy-800">
                <Shield size={18} className="text-gold-600" />
                <span>Authentic quality</span>
              </div>
            </div>

            {product.careInstructions && (
              <div className="mt-8 p-4 bg-white border border-cream-200 rounded">
                <p className="font-body text-xs uppercase tracking-wider text-gold-600 mb-2 flex items-center gap-2">
                  <Tag size={14} /> Care Instructions
                </p>
                <p className="font-body text-sm text-gray-700">{product.careInstructions}</p>
              </div>
            )}
          </div>
        </div>

        {product.reviews.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl text-navy-900 mb-6">Customer Reviews</h2>
            <div className="space-y-4">
              {product.reviews.map((r) => (
                <div key={r.id} className="p-5 bg-white border border-cream-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={12} className={n <= r.rating ? 'fill-gold-500 text-gold-500' : 'text-gray-300'} />
                      ))}
                    </div>
                    <span className="text-sm font-body font-medium text-navy-900">{r.user.name}</span>
                  </div>
                  {r.title && <p className="font-body font-semibold text-navy-900 mb-1">{r.title}</p>}
                  <p className="font-body text-sm text-gray-700">{r.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
