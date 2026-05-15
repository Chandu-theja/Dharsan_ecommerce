import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ── Admin user ──────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('Admin@Dharsan2026!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@dharsandresses.com' },
    update: {},
    create: {
      name: 'Dharsan Admin',
      email: 'admin@dharsandresses.com',
      password: hash,
      phone: '9999999999',
      role: 'ADMIN',
    },
  });
  console.log('✓ Admin user: admin@dharsandresses.com / Admin@Dharsan2026!');
  console.log('  ⚠️  CHANGE THIS PASSWORD IMMEDIATELY');

  // ── Site settings ───────────────────────────────────────────────────────
  const existing = await prisma.siteSettings.findFirst();
  if (!existing) {
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
    console.log('✓ Site settings created');
  }

  // ── Categories ──────────────────────────────────────────────────────────
  const cats = [
    { name: 'Sarees', slug: 'sarees', gender: 'WOMEN' },
    { name: 'Pattu Sarees', slug: 'pattu-sarees', gender: 'WOMEN' },
    { name: 'Salwar Suits Stitched', slug: 'salwar-suits-stitched', gender: 'WOMEN' },
    { name: 'Salwar Suits Unstitched', slug: 'salwar-suits-unstitched', gender: 'WOMEN' },
    { name: 'Churidars', slug: 'churidars', gender: 'WOMEN' },
    { name: 'Pavadai Half Sarees', slug: 'pavadai-half-sarees', gender: 'WOMEN' },
    { name: 'Lehengas', slug: 'lehengas', gender: 'WOMEN' },
    { name: 'Blouse Pieces', slug: 'blouse-pieces', gender: 'WOMEN' },
    { name: 'Nightwear Women', slug: 'nightwear-women', gender: 'WOMEN' },
    { name: 'Inners Women', slug: 'inners-women', gender: 'WOMEN' },
    { name: 'Formal Shirts', slug: 'formal-shirts', gender: 'MEN' },
    { name: 'Casual Shirts', slug: 'casual-shirts', gender: 'MEN' },
    { name: 'Formal Pants', slug: 'formal-pants', gender: 'MEN' },
    { name: 'Casual Pants', slug: 'casual-pants', gender: 'MEN' },
    { name: 'Suits Blazers', slug: 'suits-blazers', gender: 'MEN' },
    { name: 'Dhotis Panchas', slug: 'dhotis-panchas', gender: 'MEN' },
    { name: 'Lungis', slug: 'lungis', gender: 'MEN' },
    { name: 'Kurtas', slug: 'kurtas', gender: 'MEN' },
    { name: 'Sherwanis', slug: 'sherwanis', gender: 'MEN' },
    { name: 'Inners Men', slug: 'inners-men', gender: 'MEN' },
    { name: 'Towels', slug: 'towels', gender: 'UNISEX' },
    { name: 'Girls Frocks', slug: 'girls-frocks', gender: 'KIDS' },
    { name: 'Boys Shirts', slug: 'boys-shirts', gender: 'KIDS' },
    { name: 'Boys Pants', slug: 'boys-pants', gender: 'KIDS' },
    { name: 'Belts', slug: 'belts', gender: 'UNISEX' },
    { name: 'Purses Bags', slug: 'purses-bags', gender: 'UNISEX' },
    { name: 'Fabric by Meter', slug: 'fabric-by-meter', gender: 'UNISEX' },
  ] as const;

  for (let i = 0; i < cats.length; i++) {
    await prisma.category.upsert({
      where: { slug: cats[i].slug },
      update: {},
      create: { name: cats[i].name, slug: cats[i].slug, gender: cats[i].gender, displayOrder: i },
    });
  }
  console.log(`✓ ${cats.length} categories created`);
  console.log('✅ Seed complete!');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
