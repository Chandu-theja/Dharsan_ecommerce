import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const gender = searchParams.get('gender');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const filter = searchParams.get('filter'); // new | sale | featured
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');

    const where: Prisma.ProductWhereInput = { isPublished: true };

    if (category) where.category = { slug: category };
    if (subcategory) where.subcategory = { slug: subcategory };
    if (gender) where.gender = gender as any;
    if (filter === 'new') where.isNewArrival = true;
    if (filter === 'sale') where.isOnSale = true;
    if (filter === 'featured') where.isFeatured = true;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === 'price-asc' ? { price: 'asc' } :
      sort === 'price-desc' ? { price: 'desc' } :
      sort === 'popular' ? { totalSold: 'desc' } :
      sort === 'rating' ? { averageRating: 'desc' } :
      { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 2 },
          variants: { where: { isActive: true }, select: { id: true, size: true, stock: true } },
          category: { select: { name: true, slug: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('Products fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: err.message },
      { status: 500 }
    );
  }
}
