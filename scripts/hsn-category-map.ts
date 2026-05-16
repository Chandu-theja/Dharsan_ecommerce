/**
 * ER4U HSN Code → Website Category Mapping
 *
 * The ER4U `Category` column is too coarse for a Meesho-style mega menu (87% of
 * 5,933 items are just "Textiles" or "Readymade"). Instead, we map by HSN Code
 * — the GST harmonised system code, which is mandated on every invoice in
 * India and is therefore reliable.
 *
 * Top HSN codes from the actual stock report (counts):
 *   564  62052000  Men's cotton shirts
 *   455  6203      Men's suits/coats/trousers/jackets (parent code)
 *   325  551511    Polyester woven fabric (suiting/shirting)
 *   275  62034200  Men's cotton trousers
 *   192  53091910  Pure linen woven fabric (≥ 85% flax)
 *   176  520832    Cotton dyed plain weave fabric
 *   159  55151130  Polyester-cotton blended fabric
 *   158  5515      Other polyester woven fabrics (parent)
 *   152  5208      Cotton woven fabric (parent)
 *   151  6205      Men's shirts (parent)
 *   135  551311    Polyester-cotton mostly-cotton fabric
 *   108  620342    Men's cotton trousers/shorts (parent)
 *   108  55151190  Other polyester blends
 *    97  620520    Men's cotton shirts (parent)
 *    93  540710    Synthetic filament woven fabric
 *
 * Strategy:
 *   1. Match HSN prefix (longest first) → returns { topCategory, subCategory }
 *   2. Fallback when no HSN: use ER4U Category string + Item Name keyword match
 *   3. Final fallback: { topCategory: "Men", subCategory: "Other" }
 *
 * REVIEW BEFORE IMPORT: the owner should confirm the category tree below
 * matches how they want the mega menu to look on the website. Edit freely —
 * the import script reads this file at runtime.
 */

export type CategoryMapping = {
  topCategory: string;      // becomes Category.name on the website
  topSlug: string;          // becomes Category.slug
  subCategory: string;      // becomes SubCategory.name
  subSlug: string;          // becomes SubCategory.slug
  gender: 'MEN' | 'WOMEN' | 'KIDS' | 'UNISEX';
  fabric?: string;          // optional: hint for Product.fabric
};

// HSN prefix → mapping. Order matters: longer prefixes are tried first.
// Source: GST HSN code chapters 50-63 (textiles).
export const HSN_MAP: Array<{ prefix: string; mapping: CategoryMapping }> = [
  // ─── Chapter 62 — Apparel, NOT knitted ────────────────────────────────
  // 6201  Men's overcoats, raincoats, capes
  { prefix: '6201', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Coats & Jackets', subSlug: 'mens-coats-jackets', gender: 'MEN' } },
  // 6202  Women's overcoats, raincoats
  { prefix: '6202', mapping: { topCategory: 'Women', topSlug: 'women', subCategory: 'Coats & Jackets', subSlug: 'womens-coats-jackets', gender: 'WOMEN' } },
  // 6203  Men's suits, blazers, trousers, shorts
  { prefix: '620311', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Suits',           subSlug: 'mens-suits',           gender: 'MEN' } },
  { prefix: '620331', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Blazers',         subSlug: 'mens-blazers',         gender: 'MEN' } },
  { prefix: '620341', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Trousers',        subSlug: 'mens-trousers',        gender: 'MEN', fabric: 'Wool' } },
  { prefix: '620342', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Trousers',        subSlug: 'mens-trousers',        gender: 'MEN', fabric: 'Cotton' } },
  { prefix: '620343', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Trousers',        subSlug: 'mens-trousers',        gender: 'MEN', fabric: 'Synthetic' } },
  { prefix: '6203',   mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Suits',           subSlug: 'mens-suits',           gender: 'MEN' } },
  // 6204  Women's suits, dresses, skirts
  { prefix: '6204', mapping: { topCategory: 'Women', topSlug: 'women', subCategory: 'Dresses & Suits', subSlug: 'womens-dresses-suits', gender: 'WOMEN' } },
  // 6205  Men's shirts
  { prefix: '620520', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Shirts',          subSlug: 'mens-shirts',          gender: 'MEN', fabric: 'Cotton' } },
  { prefix: '620530', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Shirts',          subSlug: 'mens-shirts',          gender: 'MEN', fabric: 'Synthetic' } },
  { prefix: '620590', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Shirts',          subSlug: 'mens-shirts',          gender: 'MEN' } },
  { prefix: '6205',   mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Shirts',          subSlug: 'mens-shirts',          gender: 'MEN' } },
  // 6206  Women's blouses, shirts
  { prefix: '6206', mapping: { topCategory: 'Women', topSlug: 'women', subCategory: 'Blouses',         subSlug: 'womens-blouses',       gender: 'WOMEN' } },
  // 6207  Men's underwear, nightwear
  { prefix: '6207', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Innerwear',       subSlug: 'mens-innerwear',       gender: 'MEN' } },
  // 6208  Women's slips, nightwear
  { prefix: '6208', mapping: { topCategory: 'Women', topSlug: 'women', subCategory: 'Innerwear',       subSlug: 'womens-innerwear',     gender: 'WOMEN' } },
  // 6209  Babies' garments
  { prefix: '6209', mapping: { topCategory: 'Kids', topSlug: 'kids', subCategory: 'Babies',          subSlug: 'kids-babies',          gender: 'KIDS' } },
  // 6210  Garments made of impregnated/coated textiles
  { prefix: '6210', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Outerwear',       subSlug: 'mens-outerwear',       gender: 'MEN' } },
  // 6211  Tracksuits, swimwear, other garments
  { prefix: '6211', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Activewear',      subSlug: 'mens-activewear',      gender: 'MEN' } },
  // 6212  Bras, girdles, corsets
  { prefix: '6212', mapping: { topCategory: 'Women', topSlug: 'women', subCategory: 'Innerwear',       subSlug: 'womens-innerwear',     gender: 'WOMEN' } },
  // 6213  Handkerchiefs
  { prefix: '6213', mapping: { topCategory: 'Accessories', topSlug: 'accessories', subCategory: 'Handkerchiefs', subSlug: 'handkerchiefs', gender: 'UNISEX' } },
  // 6214  Shawls, scarves
  { prefix: '6214', mapping: { topCategory: 'Accessories', topSlug: 'accessories', subCategory: 'Shawls & Scarves', subSlug: 'shawls-scarves', gender: 'UNISEX' } },
  // 6215  Ties, bow ties
  { prefix: '6215', mapping: { topCategory: 'Accessories', topSlug: 'accessories', subCategory: 'Ties',          subSlug: 'ties',           gender: 'MEN' } },
  // 6216  Gloves
  { prefix: '6216', mapping: { topCategory: 'Accessories', topSlug: 'accessories', subCategory: 'Gloves',        subSlug: 'gloves',         gender: 'UNISEX' } },

  // ─── Chapter 61 — Apparel, knitted ────────────────────────────────────
  { prefix: '6101', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Knitwear',        subSlug: 'mens-knitwear',        gender: 'MEN' } },
  { prefix: '6102', mapping: { topCategory: 'Women', topSlug: 'women', subCategory: 'Knitwear',        subSlug: 'womens-knitwear',      gender: 'WOMEN' } },
  { prefix: '6109', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'T-Shirts',        subSlug: 'mens-tshirts',         gender: 'MEN' } },
  { prefix: '6110', mapping: { topCategory: 'Men',  topSlug: 'men',  subCategory: 'Sweaters',        subSlug: 'mens-sweaters',        gender: 'MEN' } },

  // ─── Chapter 52 — Cotton fabric (sold per meter) ──────────────────────
  { prefix: '520811', mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Cotton Shirting',  subSlug: 'cotton-shirting', gender: 'UNISEX', fabric: 'Cotton' } },
  { prefix: '520832', mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Cotton Dyed',      subSlug: 'cotton-dyed',     gender: 'UNISEX', fabric: 'Cotton' } },
  { prefix: '520842', mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Cotton Yarn-Dyed', subSlug: 'cotton-yarn-dyed', gender: 'UNISEX', fabric: 'Cotton' } },
  { prefix: '520843', mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Cotton Yarn-Dyed', subSlug: 'cotton-yarn-dyed', gender: 'UNISEX', fabric: 'Cotton' } },
  { prefix: '5208',   mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Cotton Shirting',  subSlug: 'cotton-shirting', gender: 'UNISEX', fabric: 'Cotton' } },
  { prefix: '5209',   mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Cotton Heavy',     subSlug: 'cotton-heavy',    gender: 'UNISEX', fabric: 'Cotton' } },
  { prefix: '5210',   mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Cotton Blend',     subSlug: 'cotton-blend',    gender: 'UNISEX', fabric: 'Cotton Blend' } },
  { prefix: '5211',   mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Cotton Blend Heavy', subSlug: 'cotton-blend-heavy', gender: 'UNISEX', fabric: 'Cotton Blend' } },

  // ─── Chapter 53 — Other vegetable fibres (linen, jute, ramie) ─────────
  { prefix: '5309', mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Linen', subSlug: 'linen-fabric', gender: 'UNISEX', fabric: 'Linen' } },
  { prefix: '5310', mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Jute',  subSlug: 'jute-fabric',  gender: 'UNISEX', fabric: 'Jute' } },

  // ─── Chapter 54 — Man-made filaments ──────────────────────────────────
  { prefix: '5407', mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Synthetic Filament', subSlug: 'synthetic-filament', gender: 'UNISEX', fabric: 'Synthetic' } },
  { prefix: '5408', mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Artificial Filament', subSlug: 'artificial-filament', gender: 'UNISEX', fabric: 'Viscose' } },

  // ─── Chapter 55 — Man-made staple fibres (polyester suiting/shirting) ─
  { prefix: '551311', mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Poly-Cotton Shirting', subSlug: 'poly-cotton-shirting', gender: 'UNISEX', fabric: 'Poly-Cotton' } },
  { prefix: '5513',   mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Poly-Cotton Shirting', subSlug: 'poly-cotton-shirting', gender: 'UNISEX', fabric: 'Poly-Cotton' } },
  { prefix: '5514',   mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Poly-Cotton Heavy',    subSlug: 'poly-cotton-heavy',    gender: 'UNISEX', fabric: 'Poly-Cotton' } },
  { prefix: '5515',   mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Polyester Suiting',    subSlug: 'polyester-suiting',    gender: 'UNISEX', fabric: 'Polyester' } },
  { prefix: '5516',   mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Artificial Staple',    subSlug: 'artificial-staple',    gender: 'UNISEX', fabric: 'Viscose' } },

  // ─── Chapter 50 — Silk ────────────────────────────────────────────────
  { prefix: '5007', mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Silk Fabric', subSlug: 'silk-fabric', gender: 'UNISEX', fabric: 'Silk' } },

  // ─── Chapter 51 — Wool ────────────────────────────────────────────────
  { prefix: '5111', mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Wool Suiting', subSlug: 'wool-suiting', gender: 'UNISEX', fabric: 'Wool' } },
  { prefix: '5112', mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Worsted Wool', subSlug: 'worsted-wool', gender: 'UNISEX', fabric: 'Wool' } },
];

/**
 * Fallback: keyword match against the ER4U Item Name when HSN is missing or
 * unrecognised. Order matters: first match wins.
 */
export const NAME_KEYWORD_MAP: Array<{ keywords: RegExp; mapping: CategoryMapping }> = [
  { keywords: /\b(button\s*coat|coat|jacket|blazer)\b/i,         mapping: { topCategory: 'Men',    topSlug: 'men',    subCategory: 'Coats & Blazers', subSlug: 'mens-coats-jackets', gender: 'MEN' } },
  { keywords: /\b(suit|3-piece|three\s*piece|wedding\s*jodi)\b/i, mapping: { topCategory: 'Men',    topSlug: 'men',    subCategory: 'Suits',           subSlug: 'mens-suits',           gender: 'MEN' } },
  { keywords: /\b(shirt(?!ing)|shirt\s*fs|formal\s*shirt|casual\s*shirt|half\s*shirt|full\s*shirt)\b/i, mapping: { topCategory: 'Men', topSlug: 'men', subCategory: 'Shirts', subSlug: 'mens-shirts', gender: 'MEN' } },
  { keywords: /\b(trouser|pant(?!cha)|jeans?)\b/i,                mapping: { topCategory: 'Men',    topSlug: 'men',    subCategory: 'Trousers',        subSlug: 'mens-trousers',        gender: 'MEN' } },
  { keywords: /\b(kurta|kurti|sherwani|achkan)\b/i,               mapping: { topCategory: 'Men',    topSlug: 'men',    subCategory: 'Ethnic Wear',     subSlug: 'mens-ethnic',          gender: 'MEN' } },
  { keywords: /\b(dhoti|panchas?|veshti|lungi)\b/i,               mapping: { topCategory: 'Men',    topSlug: 'men',    subCategory: 'Dhotis & Panchas',subSlug: 'dhotis-panchas',       gender: 'MEN' } },
  { keywords: /\b(t-shirt|tshirt|polo)\b/i,                       mapping: { topCategory: 'Men',    topSlug: 'men',    subCategory: 'T-Shirts',        subSlug: 'mens-tshirts',         gender: 'MEN' } },
  { keywords: /\b(vest|innerwear|brief|trunk)\b/i,                mapping: { topCategory: 'Men',    topSlug: 'men',    subCategory: 'Innerwear',       subSlug: 'mens-innerwear',       gender: 'MEN' } },
  { keywords: /\b(saree|sari|lehenga|gown|salwar|anarkali)\b/i,   mapping: { topCategory: 'Women',  topSlug: 'women',  subCategory: 'Ethnic Wear',     subSlug: 'womens-ethnic',        gender: 'WOMEN' } },
  { keywords: /\b(shirting)\b/i,                                  mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Shirting Fabric', subSlug: 'shirting-fabric',      gender: 'UNISEX' } },
  { keywords: /\b(suiting)\b/i,                                   mapping: { topCategory: 'Fabric', topSlug: 'fabric', subCategory: 'Suiting Fabric',  subSlug: 'suiting-fabric',       gender: 'UNISEX' } },
  { keywords: /\b(tie|cufflink|handkerchief|hanky|belt|pocket\s*square|wallet)\b/i, mapping: { topCategory: 'Accessories', topSlug: 'accessories', subCategory: 'Mens Accessories', subSlug: 'mens-accessories', gender: 'MEN' } },
];

export const FALLBACK_MAPPING: CategoryMapping = {
  topCategory: 'Men',
  topSlug: 'men',
  subCategory: 'Other',
  subSlug: 'mens-other',
  gender: 'MEN',
};

/**
 * Resolve a category for a row using HSN first, then keyword, then fallback.
 */
export function resolveCategory(args: {
  hsnCode?: string | null;
  itemName?: string | null;
  er4uCategory?: string | null;
}): CategoryMapping {
  // 1. HSN prefix (longest first)
  if (args.hsnCode) {
    const hsn = String(args.hsnCode).replace(/\D/g, '');
    if (hsn) {
      const sorted = [...HSN_MAP].sort((a, b) => b.prefix.length - a.prefix.length);
      for (const { prefix, mapping } of sorted) {
        if (hsn.startsWith(prefix)) return mapping;
      }
    }
  }
  // 2. Item-name keywords
  if (args.itemName) {
    for (const { keywords, mapping } of NAME_KEYWORD_MAP) {
      if (keywords.test(args.itemName)) return mapping;
    }
  }
  // 3. Fallback
  return FALLBACK_MAPPING;
}

/**
 * Parse "GST(5,12 to 5,18)" → 5  (we use the lower bracket; admin can override per-product)
 * Most textiles under ₹1000 = 5%, above = 12%, ready-made above ₹1000 = 12%.
 * Heuristic: if MRP < 1000 → 5, else 12.
 */
export function inferGstRate(taxCategoryString: string | null | undefined, mrp: number): number {
  if (taxCategoryString && /\b5\b/.test(taxCategoryString) && mrp < 1000) return 5;
  if (taxCategoryString && /\b12\b/.test(taxCategoryString)) return 12;
  return mrp < 1000 ? 5 : 12;
}
