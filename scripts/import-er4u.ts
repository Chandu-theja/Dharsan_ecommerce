/**
 * One-time ER4U → Dharsan Dresses website importer.
 *
 *   Usage:
 *     npm run db:import-er4u -- /path/to/STOCK_REPORT.xlsx
 *
 *   Or inside Docker on the server:
 *     docker compose cp ./STOCK_REPORT.xlsx app:/tmp/stock.xlsx
 *     docker compose exec app npm run db:import-er4u -- /tmp/stock.xlsx
 *
 * Idempotent: re-runs upsert by `originalSku` (= ER4U barcode). Existing
 * products are updated in place; new ones are inserted. No rows are deleted —
 * if you remove an item from ER4U, the website still keeps it (toggle
 * `isPublished` off via admin).
 *
 * Outputs a per-category summary at the end so you can sanity-check the
 * HSN→Category mapping is producing the buckets you expect.
 */
import { PrismaClient, Gender } from '@prisma/client';
import * as XLSX from 'xlsx';
import slugify from 'slugify';
import path from 'path';
import fs from 'fs';
import {
  resolveCategory,
  inferGstRate,
  CategoryMapping,
} from './hsn-category-map';

const prisma = new PrismaClient();

// ─── Types matching the ER4U Stock Report column headers ──────────────────
type Er4uRow = {
  SNo?: number;
  Item_Id?: number | string;
  Barcode?: string;
  'Item Name'?: string;
  Brand?: string;
  Size?: string;
  Colour?: string;
  'Reference Code'?: string;
  Category?: string;
  'Refrence No'?: string;
  'Barcode Tag'?: string;
  Model?: string;
  'Tax Category'?: string;
  'HSN Code'?: string | number;
  Unit?: string;
  'Purchase Rate'?: number;
  'Stock Purchase Price'?: number;
  MRP?: number;
  Rate?: number;
  'Qty - Dharsan Dresses-DD'?: number;
  'Qty - Dharsan Tailors-DT'?: number;
  'Qty - Dharsan Silks-DS'?: number;
  'Net Qty'?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────
function clean(s: unknown): string {
  if (s === undefined || s === null) return '';
  return String(s).trim();
}

function num(s: unknown): number {
  if (s === undefined || s === null || s === '') return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function buildDisplayName(row: Er4uRow): string {
  const brand = clean(row.Brand);
  const itemName = clean(row['Item Name']) || 'Item';
  const barcode = clean(row.Barcode);
  // Title-case the brand to look nice (MARK ANTONY → Mark Antony)
  const niceBrand = brand
    ? brand.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : '';
  const niceName = itemName.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  if (niceBrand) return `${niceBrand} ${niceName} (${barcode})`;
  return barcode ? `${niceName} (${barcode})` : niceName;
}

function buildSlug(row: Er4uRow): string {
  const brand = clean(row.Brand);
  const itemName = clean(row['Item Name']) || 'item';
  const barcode = clean(row.Barcode);
  const parts = [brand, itemName, barcode].filter(Boolean).join(' ');
  return slugify(parts, { lower: true, strict: true });
}

function buildDescription(row: Er4uRow, mapping: CategoryMapping): string {
  const lines: string[] = [];
  if (row.Brand)            lines.push(`Brand: ${clean(row.Brand)}`);
  if (mapping.fabric)       lines.push(`Fabric: ${mapping.fabric}`);
  if (row.Model)            lines.push(`Model: ${clean(row.Model)}`);
  if (row['Reference Code']) lines.push(`Reference: ${clean(row['Reference Code'])}`);
  lines.push(''); // blank
  lines.push(
    `Authentic ${mapping.subCategory.toLowerCase()} sourced from ${clean(row.Brand) || 'a trusted manufacturer'}. ` +
    `Available at Dharsan Dresses — Tirupati's most trusted name in premium clothing and expert stitching.`
  );
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  const xlsxPath = process.argv[2] || path.join(process.cwd(), 'prisma', 'data', 'STOCK_REPORT.xlsx');
  if (!fs.existsSync(xlsxPath)) {
    console.error(`\n❌ XLSX file not found at: ${xlsxPath}`);
    console.error('   Pass the path as an argument:  npm run db:import-er4u -- /path/to/file.xlsx\n');
    process.exit(1);
  }

  console.log(`\n📂 Reading ${xlsxPath}`);
  const workbook = XLSX.readFile(xlsxPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Er4uRow>(sheet, { defval: '' });
  console.log(`   Found ${rows.length} rows\n`);

  // ─── Pre-pass: build the unique set of categories we'll need ──────────
  const categorySet = new Map<string, CategoryMapping>();
  for (const row of rows) {
    const mapping = resolveCategory({
      hsnCode: clean(row['HSN Code']),
      itemName: clean(row['Item Name']),
      er4uCategory: clean(row.Category),
    });
    categorySet.set(mapping.topSlug, mapping);
  }

  console.log(`📁 Distinct top-level categories: ${categorySet.size}`);
  for (const m of categorySet.values()) console.log(`   • ${m.topCategory} (${m.topSlug})`);

  // ─── Upsert categories & subcategories ────────────────────────────────
  const catIdBySlug = new Map<string, string>();
  const subIdBySlug = new Map<string, string>();
  const subSeen = new Set<string>();

  console.log('\n🗂  Upserting categories...');
  for (const m of categorySet.values()) {
    const cat = await prisma.category.upsert({
      where: { slug: m.topSlug },
      create: { name: m.topCategory, slug: m.topSlug, gender: m.gender as Gender, displayOrder: 0, isActive: true },
      update: { name: m.topCategory },
    });
    catIdBySlug.set(m.topSlug, cat.id);
  }
  // Collect subcategories from the actual data
  const subFromRows = new Map<string, { topSlug: string; mapping: CategoryMapping }>();
  for (const row of rows) {
    const mapping = resolveCategory({
      hsnCode: clean(row['HSN Code']),
      itemName: clean(row['Item Name']),
      er4uCategory: clean(row.Category),
    });
    subFromRows.set(mapping.subSlug, { topSlug: mapping.topSlug, mapping });
  }
  console.log(`🗂  Upserting subcategories (${subFromRows.size})...`);
  for (const [subSlug, { topSlug, mapping }] of subFromRows) {
    const parentId = catIdBySlug.get(topSlug)!;
    const sub = await prisma.subCategory.upsert({
      where: { slug: subSlug },
      create: { name: mapping.subCategory, slug: subSlug, categoryId: parentId, displayOrder: 0, isActive: true },
      update: { name: mapping.subCategory, categoryId: parentId },
    });
    subIdBySlug.set(subSlug, sub.id);
    subSeen.add(subSlug);
  }

  // ─── Upsert products ──────────────────────────────────────────────────
  console.log(`\n📦 Upserting ${rows.length} products (this may take a minute)...`);
  let inserted = 0, updated = 0, skipped = 0;
  const categoryCounts = new Map<string, number>();
  const slugSeen = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const barcode = clean(row.Barcode);
    if (!barcode) { skipped++; continue; }

    const mrp  = num(row.MRP);
    const rate = num(row.Rate) || mrp;
    if (mrp === 0 && rate === 0) { skipped++; continue; }

    const mapping = resolveCategory({
      hsnCode: clean(row['HSN Code']),
      itemName: clean(row['Item Name']),
      er4uCategory: clean(row.Category),
    });
    const catId = catIdBySlug.get(mapping.topSlug)!;
    const subId = subIdBySlug.get(mapping.subSlug)!;

    // Ensure slug uniqueness (multiple barcodes can produce same slug if names match)
    let slug = buildSlug(row);
    if (slugSeen.has(slug)) slug = `${slug}-${barcode.toLowerCase()}`;
    slugSeen.add(slug);

    const stockDD = num(row['Qty - Dharsan Dresses-DD']);
    const stockDT = num(row['Qty - Dharsan Tailors-DT']);
    const stockDS = num(row['Qty - Dharsan Silks-DS']);
    const netQty  = num(row['Net Qty']) || stockDD + stockDT + stockDS;

    const data = {
      name: buildDisplayName(row),
      slug,
      description: buildDescription(row, mapping),
      fabric: mapping.fabric ?? null,
      brand: clean(row.Brand) || null,
      hsnCode: clean(row['HSN Code']) || null,
      gstRate: inferGstRate(clean(row['Tax Category']), mrp || rate),
      price: rate || mrp,
      comparePrice: mrp > rate ? mrp : null,
      costPrice: num(row['Purchase Rate']) || null,
      stockQuantity: Math.round(netQty),
      gender: mapping.gender as Gender,
      categoryId: catId,
      subcategoryId: subId,
      isPublished: netQty > 0,        // Only publish in-stock items by default
      isNewArrival: false,
      isOnSale: mrp > rate,
      metadata: {
        source: 'er4u',
        itemId: row.Item_Id,
        referenceCode: clean(row['Reference Code']),
        taxCategory: clean(row['Tax Category']),
        er4uCategory: clean(row.Category),
        storeStock: { DD: stockDD, DT: stockDT, DS: stockDS },
        importedAt: new Date().toISOString(),
      } as any,
    };

    const existing = await prisma.product.findUnique({ where: { originalSku: barcode } });
    if (existing) {
      await prisma.product.update({
        where: { originalSku: barcode },
        data: { ...data, originalSku: barcode },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: { ...data, originalSku: barcode },
      });
      inserted++;
    }

    categoryCounts.set(
      `${mapping.topCategory} / ${mapping.subCategory}`,
      (categoryCounts.get(`${mapping.topCategory} / ${mapping.subCategory}`) ?? 0) + 1
    );

    if ((i + 1) % 500 === 0) console.log(`   ...processed ${i + 1} / ${rows.length}`);
  }

  // ─── Summary ──────────────────────────────────────────────────────────
  console.log('\n✅ Import complete');
  console.log(`   Inserted:  ${inserted}`);
  console.log(`   Updated:   ${updated}`);
  console.log(`   Skipped:   ${skipped} (no barcode or zero price)`);
  console.log(`\n📊 Distribution by category:`);
  const sorted = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);
  for (const [cat, n] of sorted) console.log(`   ${String(n).padStart(5)}  ${cat}`);
  console.log('\n👉 Spot-check on the site:  http://144.24.153.46/products');
  console.log('👉 Review categories at:    http://144.24.153.46/admin');
}

main()
  .catch((e) => { console.error('\n❌ Import failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
