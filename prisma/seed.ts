/**
 * Prisma Seed Script
 * Run: npm run db:seed
 *
 * Creates: categories, subcategories, sample products, admin user, site settings
 */

import { PrismaClient, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';

const prisma = new PrismaClient();

const CATEGORIES = [
  // Women's
  { name: 'Sarees', nameTE: 'చీరలు', nameHI: 'साड़ी', gender: Gender.WOMEN, image: '/images/cat/sarees.jpg' },
  { name: 'Pattu Sarees', nameTE: 'పట్టు చీరలు', gender: Gender.WOMEN },
  { name: 'Salwar Suits (Stitched)', gender: Gender.WOMEN, slug: 'salwar-suits-stitched' },
  { name: 'Salwar Suits (Unstitched)', gender: Gender.WOMEN, slug: 'salwar-suits-unstitched' },
  { name: 'Churidars', gender: Gender.WOMEN },
  { name: 'Pavadai / Half Sarees', gender: Gender.WOMEN, slug: 'pavadai-half-sarees' },
  { name: 'Lehengas', gender: Gender.WOMEN },
  { name: 'Blouse Pieces', gender: Gender.WOMEN, slug: 'blouse-pieces' },
  { name: 'Nightwear Women', gender: Gender.WOMEN, slug: 'nightwear-women' },
  { name: 'Inners Women', gender: Gender.WOMEN, slug: 'inners-women' },

  // Men's
  { name: 'Formal Shirts', gender: Gender.MEN, slug: 'formal-shirts' },
  { name: 'Casual Shirts', gender: Gender.MEN, slug: 'casual-shirts' },
  { name: 'Formal Pants', gender: Gender.MEN, slug: 'formal-pants' },
  { name: 'Casual Pants', gender: Gender.MEN, slug: 'casual-pants' },
  { name: 'Suits & Blazers', gender: Gender.MEN, slug: 'suits-blazers' },
  { name: 'Dhotis / Panchas / Veshtis', gender: Gender.MEN, slug: 'dhotis-panchas' },
  { name: 'Lungis', gender: Gender.MEN },
  { name: 'Kurtas', gender: Gender.MEN },
  { name: 'Sherwanis', gender: Gender.MEN },
  { name: 'Inners Men', gender: Gender.MEN, slug: 'inners-men' },
  { name: 'Towels', gender: Gender.UNISEX },

  // Kids
  { name: 'Girls Frocks', gender: Gender.KIDS, slug: 'girls-frocks' },
  { name: 'Girls Churidars', gender: Gender.KIDS, slug: 'girls-churidars' },
  { name: 'Girls Pavadai', gender: Gender.KIDS, slug: 'girls-pavadai' },
  { name: 'Boys Shirts', gender: Gender.KIDS, slug: 'boys-shirts' },
  { name: 'Boys Pants', gender: Gender.KIDS, slug: 'boys-pants' },
  { name: 'Boys Traditional', gender: Gender.KIDS, slug: 'boys-traditional' },

  // Accessories & Fabric
  { name: 'Belts', gender: Gender.UNISEX },
  { name: 'Purses & Bags', gender: Gender.UNISEX, slug: 'purses-bags' },
  { name: 'Fabric by the Meter', gender: Gender.UNISEX, slug: 'fabric-by-meter' },
];

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Admin user ───────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@Dharsan2026!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@dharsandresses.com' },
    update: {},
    create: {
      name: 'Dharsan Admin',
      email: 'admin@dharsandresses.com',
      password: adminPassword,
      phone: '9999999999',
      role: 'ADMIN',
    },
  });
  console.log('✓ Admin user created: admin@dharsandresses.com / Admin@Dharsan2026!');
  console.log('  ⚠️  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION');

  // ─── Site settings ────────────────────────────────────────────────────
  const existingSettings = await prisma.siteSettings.findFirst();
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        shopName: 'Dharsan Dresses',
        tagline: 'Best Clothes · Best Stitch',
        logoUrl: '/images/logo.png',
        address: 'Yadava St, Varadaraja Nagar',
        city: 'Tirupati',
        state: 'Andhra Pradesh',
        pincode: '517501',
        instagramUrl: 'https://www.instagram.com/dharsandresses/',
        youtubeUrl: 'https://www.youtube.com/@dharsandresses',
        freeShippingThreshold: 1000,
        shippingCharge: 80,
      },
    });
    console.log('✓ Site settings initialized');
  }

  // ─── Categories ───────────────────────────────────────────────────────
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const slug = cat.slug || slugify(cat.name, { lower: true, strict: true });
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        name: cat.name,
        nameTE: cat.nameTE,
        nameHI: cat.nameHI,
        slug,
        gender: cat.gender,
        image: cat.image,
        displayOrder: i,
      },
    });
  }
  console.log(`✓ ${CATEGORIES.length} categories created`);

  // ─── Sample products ──────────────────────────────────────────────────
  const sareeCategory = await prisma.category.findUnique({ where: { slug: 'sarees' } });
  const shirtCategory = await prisma.category.findUnique({ where: { slug: 'formal-shirts' } });
  const dhotiCategory = await prisma.category.findUnique({ where: { slug: 'dhotis-panchas' } });

  const sampleProducts = [
    {
      name: 'Royal Blue Kanchipuram Silk Saree',
      slug: 'royal-blue-kanchipuram-silk-saree',
      description: 'Exquisite Kanchipuram silk saree with traditional zari border. Perfect for weddings, festivals and special occasions. Pure silk with intricate woven motifs.',
      fabric: 'Pure Kanchipuram Silk',
      origin: 'Handloom - Kanchipuram',
      price: 12990,
      comparePrice: 15990,
      gender: Gender.WOMEN,
      categoryId: sareeCategory?.id,
      isFeatured: true,
      isNewArrival: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80', isPrimary: true, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1594387303039-d8bc8e3b6db1?w=800&q=80', sortOrder: 1 },
      ],
      variants: [
        { color: 'Royal Blue', stock: 10, sku: 'DD-SAR-001-RB' },
      ],
      tags: ['silk', 'wedding', 'kanchipuram', 'pure silk', 'pattu'],
    },
    {
      name: 'Premium White Formal Shirt',
      slug: 'premium-white-formal-shirt',
      description: 'Crisp white formal shirt in premium cotton. Wrinkle-resistant, breathable fabric perfect for office wear. Available in all sizes S to 6XL.',
      fabric: '100% Premium Cotton',
      price: 899,
      comparePrice: 1299,
      gender: Gender.MEN,
      categoryId: shirtCategory?.id,
      isFeatured: true,
      isOnSale: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80', isPrimary: true, sortOrder: 0 },
      ],
      variants: [
        { size: 'S', color: 'White', stock: 25, sku: 'DD-SHT-001-S' },
        { size: 'M', color: 'White', stock: 30, sku: 'DD-SHT-001-M' },
        { size: 'L', color: 'White', stock: 30, sku: 'DD-SHT-001-L' },
        { size: 'XL', color: 'White', stock: 25, sku: 'DD-SHT-001-XL' },
        { size: '2XL', color: 'White', stock: 15, sku: 'DD-SHT-001-2XL' },
        { size: '3XL', color: 'White', stock: 10, sku: 'DD-SHT-001-3XL' },
      ],
      tags: ['formal', 'office', 'white', 'cotton'],
    },
    {
      name: 'Traditional Cream Pancha (Dhoti)',
      slug: 'traditional-cream-pancha',
      description: 'Pure cotton traditional pancha with gold zari border. Ideal for temple visits, weddings and cultural events. Comfortable and authentic.',
      fabric: 'Pure Cotton with Gold Zari',
      price: 1499,
      gender: Gender.MEN,
      categoryId: dhotiCategory?.id,
      isNewArrival: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1622445275576-721325763afe?w=800&q=80', isPrimary: true, sortOrder: 0 },
      ],
      variants: [
        { color: 'Cream', stock: 20, sku: 'DD-DHO-001-CR' },
      ],
      tags: ['traditional', 'dhoti', 'pancha', 'veshti'],
    },
  ];

  for (const p of sampleProducts) {
    if (!p.categoryId) continue;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        fabric: p.fabric,
        origin: (p as any).origin,
        price: p.price,
        comparePrice: p.comparePrice,
        gender: p.gender,
        categoryId: p.categoryId,
        isFeatured: p.isFeatured ?? false,
        isNewArrival: p.isNewArrival ?? false,
        isOnSale: p.isOnSale ?? false,
        tags: p.tags,
        images: { create: p.images },
        variants: { create: p.variants.map((v) => ({ ...v, isActive: true })) },
      },
    });
  }
  console.log(`✓ ${sampleProducts.length} sample products created`);

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
