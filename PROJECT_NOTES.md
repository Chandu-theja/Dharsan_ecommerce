# Dharsan Dresses — Project Notes & Roadmap

> Living reference document. Update this as decisions are made and features are shipped.
> Site live at: http://144.24.153.46/ (HTTP) → target: https://dharsandresses.com

---

## Current Known Issues (Fix First)

| # | Issue | Root Cause | Fix |
|---|-------|------------|-----|
| 1 | Every page except homepage gives **404** | Next.js dynamic routes not resolving behind Nginx — missing `try_files` or `proxy_pass` config | Update `nginx/nginx.conf` to forward all routes to Next.js app |
| 2 | **Images not loading** | Product images reference Unsplash placeholders or OCI Object Storage URLs not configured yet | Either use local `/public/images/` or configure OCI bucket + set `NEXT_PUBLIC_OCI_BUCKET_URL` in `.env` |
| 3 | **Instagram reel thumbnails not showing** | `next.config.js` does not whitelist `cdninstagram.com` or `instagram.com` as allowed image domains | Add to `images.remotePatterns` in `next.config.js` |

---

## Technical Questions — Answered

### 1. How Auth Works (NextAuth.js)

Two providers are configured in `src/lib/auth.ts`:

- **Credentials** — user types email + password → hashed password compared against `User` table in PostgreSQL via Prisma
- **Google OAuth** — user clicks "Sign in with Google" → Google redirects back with a token → NextAuth creates/finds the user in the `Account` table linked to the `User` table

**Where data is saved:**
- `User` table — name, email, hashed password
- `Account` table — linked OAuth provider (Google account ID)
- `Session` table — active session tokens (or JWT stored in cookie if using JWT strategy)

**Env vars needed:**
```env
NEXTAUTH_SECRET=<random 32-char string>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

---

### 2. What is Zustand (Cart Persistence)

Zustand is a lightweight state manager for React. In this project it manages the **shopping cart in the browser**.

- Cart items live in browser memory (and optionally `localStorage` for persistence across page refreshes)
- File: `src/store/cartStore.ts`
- When a user adds a product → it updates the Zustand store → `CartDrawer` component re-renders
- When the user places an order → cart is cleared and order is saved to the database
- **No server call needed** just to add/remove items from cart — it's all client-side until checkout

---

### 3. Email — What It's For + Gmail SMTP

**What emails are sent:**
- Order confirmation (to customer)
- Shipping update with tracking link
- Low stock alerts (to admin)
- Password reset (if implemented)

**Gmail SMTP setup (free, 500 emails/day):**
1. Enable 2FA on your Gmail account
2. Google Account → Security → App Passwords → Generate one for "Mail"
3. Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASSWORD=<16-char app password>
SMTP_FROM="Dharsan Dresses <youremail@gmail.com>"
```

---

### 4. WhatsApp Notifications Setup (Do This Last)

Uses Twilio WhatsApp Business API. Set up only after the site is stable.

**Steps:**
1. Sign up at https://www.twilio.com/ — free trial credits available
2. Start with **Twilio Sandbox** for WhatsApp (instant, no approval needed for testing)
3. For production: apply for WhatsApp Business API approval (takes 1–3 days, need Facebook Business Manager)
4. Add to `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
SHOP_WHATSAPP_NUMBER=whatsapp:+91XXXXXXXXXX
```

---

### 5. Razorpay Payments Setup (Do This Last)

1. Sign up at https://razorpay.com/ and complete KYC (PAN + bank account + GST)
2. Dashboard → Settings → API Keys → Generate test keys first
3. Test thoroughly with test keys, then switch to live keys before going live
4. Add to `.env`:
```env
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=xxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxx
```
5. Add webhook: `https://dharsandresses.com/api/payments/webhook` in Razorpay dashboard

---

## Architecture Questions — Answered

### Where Is Data Saved Right Now?

Currently everything runs inside Docker containers on the OCI server:

```
OCI Server (VM.Standard.A1.Flex)
├── Container: app        → Next.js (stateless)
├── Container: postgres   → PostgreSQL database (ALL order/product/user data)
└── Container: nginx      → Reverse proxy
```

**Problem:** The PostgreSQL data lives inside a Docker volume. If the container is removed with `docker compose down -v`, **all data is lost**.

**Fix — Docker Volume Persistence (do this now):**
In `docker-compose.yml`, make sure the postgres service has a named volume mapped to host disk:
```yaml
postgres:
  volumes:
    - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
    driver: local
```
This way data survives container restarts and even container removal (as long as the volume isn't explicitly deleted).

**Better long-term architecture (Phase 2):**
- Move database to **OCI Autonomous Database (free tier)** — managed, auto-backup, no maintenance
- Move file storage to **OCI Object Storage (free 10GB)** — product images, invoices
- This way the server itself becomes fully disposable — redeploy anytime without data loss

---

### How Products, Prices & Details Are Managed

Currently this is admin-dashboard driven:
1. Admin logs in at `/admin`
2. Goes to Products → Add New Product
3. Fills in: name, description, price, category, stock, images
4. Data is saved to the `Product` table in PostgreSQL via Prisma

**Image upload flow:**
- Admin uploads image → stored in OCI Object Storage bucket → public URL saved in `Product.images` field
- Until OCI is configured: use Unsplash URLs as placeholders

**When a new product arrives:**
- Add via admin panel OR write a CSV importer script (planned — see Roadmap)
- No code deployment needed for new products — it's all data-driven

---

### How Inventory (Sold Sarees) Is Managed

Current flow:
- Each `Product` has a `stock` field (integer)
- When an order is placed → `stock` decreases by quantity ordered (in the order API)
- When stock hits 0 → product shows "Out of Stock", cannot be added to cart
- When stock falls below threshold → admin gets email/WhatsApp alert

**Gaps to fix:**
- Need to handle concurrent orders (two users buying the last item simultaneously) — use database transactions
- Need a "Restock" flow in admin panel
- Sarees are often one-of-a-kind → stock = 1 for unique pieces

---

### How Search Works (and How to Make It Accurate)

Current implementation: basic `ILIKE` query on product name and description in PostgreSQL.

**Problem:** This misses typos, synonyms (e.g., "saree" vs "sari"), and doesn't rank by relevance.

**Better solutions (in order of cost):**
1. **PostgreSQL Full-Text Search** (free, built-in) — good for exact and partial matches, supports Tamil/Telugu words
2. **Meilisearch** (open source, self-host on OCI) — typo-tolerant, fast, faceted search by category/price/color
3. **Algolia** (SaaS, free tier 10k searches/month) — best quality, easiest to set up

**Planned improvement:** Add Meilisearch as a Docker container on the same OCI server.

---

### Pagination (Page 1, 2, 3...)

Currently products are fetched in one query — no pagination yet.

**Plan:**
- Add `?page=1&limit=24` query params to `/api/products`
- Use Prisma `skip` + `take` for cursor-based pagination
- Frontend: "Load More" button or numbered pagination
- 24 products per page is standard (grid of 4×6)

---

## Current Site Audit (Baseline — 2026-05-15)

Honest snapshot of where the site is **right now**, after Phase 1. Use this as the reference point for everything below.

### ✅ Works (functional, production quality)
- Homepage: Hero, USP strip, dynamic CategoryShowcase, FeaturedProducts (fetches from DB), Testimonials, CraftBanner, Instagram CTA, Brand Story
- Navigation: desktop mega menu, mobile drawer, working search bar (submits to `/products?search=`), cart icon with badge
- Footer: trust badges, brand info, social links, shop/services/help link columns
- Product listing `/products`: search, basic sort (API supports it; UI bug: dropdown's `onChange` isn't wired), grid, empty state
- Product detail `/product/[slug]`: breadcrumbs, image gallery (no zoom), description, fabric/origin, AddToCartButton with variant + stock check, review display (read-only)
- Category page `/category/[slug]`: lists products by category with sort and price-range query params
- Checkout `/checkout`: auth gate, address selection, add new address, payment method selection, coupon input (validation server-side only), order creation, Razorpay modal, signature verification, COD path
- Cart: Zustand store with localStorage persistence, drawer UI, stock validation
- Auth: NextAuth Credentials + Google OAuth, register page (Meesho-style with strength meter), login page (with show/hide), forgot-password page (stub with WhatsApp fallback)
- Admin dashboard `/admin`: stats cards (revenue, orders, customers, low stock), pending orders alert, recent 5 orders table
- API: `/api/products`, `/api/addresses`, `/api/auth/*`, `/api/payments/create-order`, `/api/payments/verify`, `/api/health`
- Order pipeline (backend only): order created on checkout, Razorpay verified server-side, stock deducted, invoice record auto-created, order-confirmation email + WhatsApp + owner alert sent
- Branded 404, on-brand stub pages for about/contact/faq/privacy/terms/returns/shipping-policy/size-guide/track-order/private-viewing/wishlist/orders/profile
- Auto-applying Prisma schema + idempotent seed on every `docker compose up` via `db-init` container

### 🟡 Stub (page exists, content/logic incomplete)
- `/orders` — placeholder, no actual order history
- `/wishlist` — placeholder, no DB read/write
- `/profile` — placeholder, no edit form
- `/track-order` — placeholder, no Delhivery lookup
- `/forgot-password` — UI works, no email actually sent (SMTP not configured)
- Newsletter subscribe in footer — input only, no API
- Sort dropdown on `/products` — visual only, `onChange` not implemented
- Admin: only dashboard exists — no product/order/customer/settings sub-pages

### ❌ Missing entirely (production blockers and feature gaps)
- **Admin product management** — can't add/edit/delete products via UI (Prisma Studio is the only path)
- **Admin order management** — can't view order details, update status, print invoice
- **Image upload API** — `/api/upload` doesn't exist; images must be hand-pushed to OCI bucket and URLs typed into DB
- **Order history & detail pages** for customers
- **Wishlist API + UI**, **Review submission API**
- **Real product filters** — sidebar with price slider / color / fabric / size / occasion / discount checkboxes (only `?minPrice`/`?maxPrice` query params work)
- **Real-time search suggestions** dropdown
- **Pagination / Load More** on product grid
- **Variant selector UI** on product detail — size buttons + colour swatches (variants are loaded but not rendered as UI)
- **"You may also like"** related products on product page
- **Product image zoom** / lightbox / 360°
- **Share buttons** (WhatsApp, copy link)
- **Pincode serviceability check** on PDP and checkout
- **Delhivery shipment creation** — orders never sync to Delhivery for label generation/tracking
- **Delhivery webhook** to auto-update order status
- **Email verification**, **phone OTP signup/login**, **real password reset**
- **Invoice PDF download** — Invoice records exist but no `/api/invoices/[id]` and no PDF generation
- **Error boundaries** (`error.tsx`, `global-error.tsx`)
- **Loading states** (`loading.tsx`, skeleton screens)
- **SEO**: no sitemap, no robots.txt, no JSON-LD structured data
- **Analytics**: no Google Analytics 4, no Sentry, no event tracking
- **Multi-language** — `next-intl` installed but unconfigured
- **Stitching booking with Google Calendar** sync (form exists; calendar not wired)
- **Coupon admin** — coupons applied at checkout but no UI to create them
- **Bank offers / EMI** promotions
- **Banner CMS** — `Banner` model exists, no admin UI

---

## Roadmap — Phase-By-Phase to Meesho/Nykaa Parity

Each phase has a single **outcome** and a checklist. Don't move forward until the outcome is met. Roughly ordered by what unblocks the next stage.

### Phase 1 — Make It Work ✅ DONE
**Outcome:** Site loads, all linked pages return a real page (not 404), Instagram-style images render, postgres data persists across restarts.

- [x] Fixed 404s on all 16 missing pages
- [x] Image domains (Unsplash, Instagram CDN, fbcdn) whitelisted
- [x] Docker volume verified + documented
- [x] Branded 404 page
- [x] Dynamic CategoryShowcase
- [x] Production-grade register flow with strength meter
- [x] Forgot-password stub with WhatsApp fallback
- [x] Auto-applying schema + seed via `db-init` container

---

### Phase 2 — Make It Browseable (UI focus: Browse + Login + Signup) — **CURRENT SPRINT**
**Outcome:** A first-time visitor can land on the homepage, browse by category exactly like Meesho/Nykaa, find products, view product detail, and create / sign in to an account — and that whole journey feels polished. Selling, shipping, invoices come next.

> Each sub-phase has a **What I need from you** column. "Nothing" = I can ship it solo. Anything else = blocker.

#### 2.0 — Get real product data in (DO THIS FIRST — unblocks everything visible)
The shop's catalogue lives in ER4U ERP at `er4uenterprise.in/er4u/dharsandresses/`. From the stock export you shared (`STOCK_REPORT_20260516094742.xlsx`), I now know exactly what the ERP gives us:

**ER4U schema (23 columns, 5,933 items, all in stock across 3 store locations DD/DT/DS):**
`SNo | Item_Id | Barcode | Item Name | Brand | Size | Colour | Reference Code | Category | Refrence No | Barcode Tag | Model | Tax Category | HSN Code | Unit | Purchase Rate | Stock Purchase Price | MRP | Rate | Qty-DD | Qty-DT | Qty-DS | Net Qty`

**Quirks I found in the data (need owner decisions):**
- **`Item Name` is generic** ("2 BUTTON COAT" appears 13 times, "1 piece" appears many times). On the website we need richer display names. Plan: construct as `{Brand} {Item Name} ({Barcode})` → e.g. `"MARK ANTONY 2 BUTTON COAT (RM181277)"`. Decision needed: OK with this, or do you have a master product-name list?
- **`Category` is too coarse** — 87% of items are just "Textiles" (2761) or "Readymade" (2381). Useless for a Meesho-style mega menu. Plan: map ER4U Category + HSN Code → a website-friendly category tree (e.g. HSN 6203 = Men's Suits, 6205 = Men's Shirts, 5208/5407 = Cotton/Polyester Fabric). I'll write the mapping; you review.
- **`Size` and `Colour` fields are unusable** — they contain random tokens (brand names, codes, "BERRY", "Hyde Park", numbers). Plan: ignore on import, start blank, fill via admin panel (2.5 below) only for the items where it matters.
- **3 store stock columns** (DD/DT/DS). Plan: sum into single `stock` on the website; keep raw breakdown in a `metadata` JSON field for future per-store fulfilment.
- **`HSN Code` is clean** — keep per product for invoicing later.
- **`Tax Category` is messy** ("GST(5,12 to 5,18)") — Plan: parse → flat `gstRate` integer per product (5 or 12 based on MRP threshold).

| # | Task | What I do | What I need from you |
|---|------|-----------|----------------------|
| 2.0.a | Run Prisma Studio for manual entry sanity-check | — | **Run** `docker compose exec app npx prisma studio --port 5555 --browser none` on server, then open `http://144.24.153.46:5555` |
| 2.0.b | Confirm category-mapping rules | I propose the HSN→Category mapping table | **Review** the mapping table I draft and approve / tweak |
| 2.0.c | Confirm product-name construction rule | — | **Approve** `{Brand} {Item Name} ({Barcode})` format, or give me a different rule |
| 2.0.d | ✅ Extended `Product` schema (`brand`, `hsnCode`, `gstRate`, `originalSku`, `stockQuantity`, `metadata`) — 2026-05-16 | Done | Nothing |
| 2.0.e | ✅ Wrote import script `scripts/import-er4u.ts` + HSN→Category map `scripts/hsn-category-map.ts` — 2026-05-16 | Done | **Review** `scripts/hsn-category-map.ts` before running import. Edit any category names/slugs to taste |
| 2.0.f | ✅ Ran schema migration + bulk import (2026-05-16) — 5,646 inserted + 286 updated + 1 skipped. 31 categories, 29 subcategories | Done | Nothing |
| 2.0.g | Verify catalogue on the live site | — | **Browse** `http://144.24.153.46/products` (HTTP 200 verified). Spot-check 5 — confirm display names, prices, stock look right |

**Live distribution (post-import):**
| Category | Items |
|----------|-------|
| Men / Shirts | 1,150 |
| Fabric / Polyester Suiting | 919 |
| Men / Trousers | 560 |
| Men / Suits | 514 |
| Fabric / Linen | 413 |
| Fabric / Synthetic Filament | 393 |
| Fabric / Cotton Shirting | 307 |
| Fabric / Poly-Cotton Shirting | 244 |
| Men / Other | 214 |
| Fabric / Cotton Dyed | 197 |
| Fabric / Shirting Fabric | 189 |
| Fabric / Cotton Yarn-Dyed | 184 |
| Men / T-Shirts | 158 |
| Fabric / Suiting Fabric | 90 |
| Men / Activewear | 89 |
| Other small buckets (Innerwear, Sweaters, Silk, Dhotis, Coats, Wool, Ties, Women's Dresses, etc.) | ~300 |

**Observation:** "Men / Other" (214 items) = items where HSN didn't match any prefix AND name keywords didn't trigger. Owner can review these in Prisma Studio later and edit the HSN map for next re-import.

**Decisions you owe me (block 2.0.b and 2.0.c):**
1. Display-name format: `{Brand} {Item Name} ({Barcode})` — yes / suggest alternative?
2. For products with no brand (e.g. row 3 has empty Brand): show just `{Item Name} ({Barcode})`?
3. Should the **Barcode** (e.g. `RM191363`) be exposed publicly as the URL slug (`/product/rm191363`) or hidden behind a clean slug like `/product/mark-antony-2-button-coat-rm181277`? Recommend the second for SEO.

---

#### 2.1 — Get product images out of ER4U  ⏸ **BLOCKED — owner discussing with ER4U team**
Owner is following up with ER4U to find out how images can be obtained. Until that's resolved, the catalogue will ship with **brand-gradient placeholders** so we can launch browsing UX without waiting.

| # | Task | What I do | What I need from you |
|---|------|-----------|----------------------|
| 2.1.a | ✅ Built `<BrandPlaceholder />` component (`src/components/product/BrandPlaceholder.tsx`) — 2026-05-16. Hashes brand name → deterministic palette so cards look varied | Done | Nothing |
| 2.1.b | Wire placeholder into `ProductCard` + PDP when `images[]` is empty | Will land with mega-menu / browse-UX batch | Nothing |
| 2.1.c | Determine ER4U image-acquisition path | — | **Discuss with ER4U team** and report back: are images downloadable in bulk? Via API? Via a hidden URL pattern? Manual export only? |
| 2.1.d | Once 2.1.c is resolved → write scraper / importer / upload script (one of: bulk download script, Puppeteer scraper with login, manual zip import) | I write the code (path depends on owner's update) | (Depends on 2.1.c outcome) |
| 2.1.e | Compress images (sharp) — target 1200×1500 WebP, <200KB | I write the code | Nothing |
| 2.1.f | Backfill `Product.images[]` in DB | I write the code | Nothing |

**Plan B if ER4U can't help:** owner photographs/sources images and uploads via the admin panel (Phase 2.6) one product at a time. Slow but works.

---

#### 2.2 — OCI Object Storage (for long-term image hosting)
Same plan as before, but lower priority now. We can launch with `public/images/` and migrate later.

| # | Task | What I do | What I need from you |
|---|------|-----------|----------------------|
| 2.2.a | Create OCI Object Storage bucket `dharsan-dresses-images` | — | **You do it in OCI Console.** Steps in "Phase 2 — Detailed Instructions" section below |
| 2.2.b | Generate OCI Customer Secret Keys | — | **You do it** at OCI → User Settings → Customer Secret Keys → Generate |
| 2.2.c | Add 6 OCI env vars to server `.env` | — | **Paste values** + run `docker compose restart app` |
| 2.2.d | Build `POST /api/upload` endpoint | I write the code | Nothing |
| 2.2.e | Build reusable `<ImageUploader />` (drag-drop, progress, multi-file) | I write the code | Nothing |
| 2.2.f | Migration script: re-upload `public/images/products/*` to OCI, rewrite DB URLs | I write the code | Nothing |

---

#### 2.3 — Browse UX (Category discovery — the main UX work of this sprint)
This is **the** focus item. How a visitor goes from "I want to buy a wedding shirt" → finding it → adding to cart.

| # | Task | What I do | What I need from you |
|---|------|-----------|----------------------|
| 2.3.a | Build Meesho-style **mega menu** on the navbar | Hover-open panel: column-per-category (Men → Shirts/Trousers/Suits/Kurtas; Women → coming; Fabric → Suiting/Shirting; Accessories), each column shows top subcategories + a featured-image tile on the right | **Approve the category tree** I draft from the HSN-mapping (see 2.0.b) |
| 2.3.b | Build **Mobile category drawer** (sliding from left, like Meesho app) | I write the code | Nothing |
| 2.3.c | **Category landing page** redesign (`/category/[slug]`) — banner image, subcategory pills, sort dropdown (FIX the broken onChange), product grid (4×N desktop, 2×N mobile), pagination ("Load More" button), empty state | I write the code | (Optional) A banner image per top-level category, else I use a gold-on-navy gradient |
| 2.3.d | **Product grid card** redesign — image (4:5 ratio), brand tag (small grey above name), name (2 lines max), MRP strikethrough + selling price + discount % chip, "Add to Wishlist" heart icon, hover quick-view button | I write the code | Nothing |
| 2.3.e | **Active filters bar** above grid — chips showing what's applied with × to remove each | I write the code | Nothing |
| 2.3.f | **Filter sidebar** (Meesho-style: price, brand, fabric/category, in-stock toggle) — desktop = left sidebar, mobile = bottom sheet | I write the code | Nothing (uses brand/category/HSN data from import) |
| 2.3.g | **Pagination** ("Load More" button), 24 products per page | I write the code | Nothing |
| 2.3.h | **Sort dropdown** wiring (currently broken — visual only) → Relevance / Newest / Price ↓ / Price ↑ / Discount % | I fix the bug | Nothing |
| 2.3.i | **Search-bar autosuggest dropdown** — debounced, top 6 product matches + 3 category matches | I write the code | Nothing |
| 2.3.j | **Recently viewed** strip on homepage + category page (localStorage) | I write the code | Nothing |
| 2.3.k | **Breadcrumbs** on category and product pages — Home / Men / Shirts / Mark Antony 2 Button Coat | I write the code (PDP already has them; extend to category) | Nothing |

---

#### 2.4 — Product Detail Page (PDP) polish
| # | Task | What I do | What I need from you |
|---|------|-----------|----------------------|
| 2.4.a | **Image gallery with zoom + lightbox** (already have `react-image-gallery` in deps) | I write the code | Nothing |
| 2.4.b | **Variant selector UI** — size buttons + colour swatches (variants exist in DB, no UI) | I write the code | Nothing (will be sparse until 2.5 admin panel lets you fill them) |
| 2.4.c | **"You may also like"** — 4 related products (same category, exclude current) | I write the code | Nothing |
| 2.4.d | **Brand badge** + brand-page link (`/brand/raymond`) | I write the code + new `/brand/[slug]` page | Nothing |
| 2.4.e | **Stock urgency** — "Only 2 left", "Selling fast" if low stock | I write the code | Nothing |
| 2.4.f | **Share buttons** (WhatsApp, copy link) | I write the code | Nothing |

---

#### 2.5 — Login + Signup UX (the auth half of this sprint)
| # | Task | What I do | What I need from you |
|---|------|-----------|----------------------|
| 2.5.a | ⏸ **Sign-in with Google** — DEFERRED (owner has no GCP account). Will revisit post-launch | — | **(Skip for Phase 2)** When ready: create Google Cloud Account → Console → APIs & Services → Credentials → OAuth 2.0 Client ID. Redirect URI: `http://144.24.153.46/api/auth/callback/google`. Share Client ID + Secret |
| 2.5.b | **Show inline error states** on login (wrong password / locked / unverified) instead of toast-only | I write the code | Nothing |
| 2.5.c | **Remember me** checkbox + 30-day session extension | I write the code | Nothing |
| 2.5.d | **Signup → auto-login flow polish** (already mostly done in last session; QA + fix edge cases) | I write the code | Nothing — test with a new email and report any issues |
| 2.5.e | **Profile dropdown** in navbar when logged in (Avatar → My Orders / Wishlist / Addresses / Logout) | I write the code | Nothing |
| 2.5.f | ✅ **Forgot password** — fully wired (`/api/auth/forgot-password`, `/api/auth/reset-password`, `/reset-password` page, branded email with 30-min token, strength meter on reset). 2026-05-16 | Done | Nothing — test end-to-end once you deploy |

---

#### 2.6 — Admin product management (so you can edit ER4U-imported products)
| # | Task | What I do | What I need from you |
|---|------|-----------|----------------------|
| 2.6.a | `/admin/products` list (search, filter by brand/category, paginate) | I write the code | Nothing |
| 2.6.b | `/admin/products/[id]/edit` — edit any of: name, description, category, price, MRP, stock, images, brand, HSN, GST, sizes, colors, fabric, careInstructions, published toggle | I write the code | Nothing |
| 2.6.c | `/admin/products/new` — same form, blank | I write the code | Nothing |
| 2.6.d | Inline variant manager (size + colour + stock per variant) | I write the code | Nothing |
| 2.6.e | Inline image uploader (uses `<ImageUploader />` from 2.2) | I write the code | Nothing |
| 2.6.f | Soft-delete via `isPublished=false` toggle | I write the code | Nothing |
| 2.6.g | Server-side admin role guard middleware | I write the code | Nothing |
| 2.6.h | **Bulk publish/unpublish** (select N products, action menu) | I write the code | Nothing |

---

#### 2.7 — Email sending (Gmail SMTP) — **all the info I need is below**
Why we keep this in Phase 2: forgot-password (2.5.f) and customer order confirmations need it. Already have all your decisions — only blocker is the Gmail App Password, which you generate.

**📋 Step-by-step: Generate Gmail App Password for `Dharsangroups@gmail.com`**

1. **Enable 2-Step Verification first** (required before App Passwords are available):
   - Sign in to `Dharsangroups@gmail.com`
   - Visit https://myaccount.google.com/security
   - Under "How you sign in to Google" → click **2-Step Verification** → **Get started**
   - Follow prompts (add a backup phone, verify with OTP). Takes 3 min.

2. **Generate the App Password:**
   - Once 2FA is on, visit https://myaccount.google.com/apppasswords
   - (If the link 404s, search "App passwords" in your Google Account search bar — Google sometimes hides this)
   - At the bottom of the page: **App name** → type `Dharsan Dresses Website`
   - Click **Create**
   - You'll see a **16-character password** in a yellow box (e.g. `abcd efgh ijkl mnop`)
   - **Copy it immediately** — Google won't show it again
   - Click **Done**

3. **Add to server `.env` file** (paste these exactly, replacing `xxxxxxxxxxxxxxxx` with your 16-char password, removing spaces):
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=Dharsangroups@gmail.com
   SMTP_PASSWORD=xxxxxxxxxxxxxxxx
   SMTP_FROM=Dharsan Dresses <Dharsangroups@gmail.com>
   ```

4. **Restart the app:**
   ```bash
   cd ~/Dharsan_ecommerce
   docker compose restart app
   ```

5. **Test:** trigger a forgot-password from the site with your own email — check inbox + spam.

| # | Task | What I do | What I need from you |
|---|------|-----------|----------------------|
| 2.7.a | ✅ Gmail App Password generated by owner (2026-05-16) | — | Done |
| 2.7.b | ✅ Added 5 SMTP env vars to server `.env` + restart (2026-05-16) | — | Done |
| 2.7.c | ✅ `lib/email.ts` — added `sendPasswordResetEmail()` (branded HTML, mobile-friendly, WhatsApp fallback link). Existing `sendOrderConfirmationEmail`/`sendShippingEmail` already wired. 2026-05-16 | Done | Nothing |
| 2.7.d | ✅ Wired forgot-password endpoint to send reset email | Done | Nothing |
| 2.7.e | Wire order-confirmation email on successful order | I write the code | Nothing |
| 2.7.f | Test deliverability (Gmail → Gmail, Gmail → Yahoo, Gmail → Outlook) | — | **Test with 2-3 different email addresses** + check spam folder |
| 2.7.g | **Revoke the chat-shared App Password and regenerate** (security hygiene) | — | After 2.7.f passes: Google Account → Security → App passwords → trash the current one → generate new → SSH to server → update `.env` → restart. Never share via chat again |

##### SSH Command — Add SMTP to Server (run this on `144.24.153.46`)

Copy this whole block, SSH into the server, and paste it. It's safer than `nano` because it doesn't write the password to your terminal scrollback as you type:

```bash
ssh opc@144.24.153.46

# Switch to the project dir
cd ~/Dharsan_ecommerce

# Append the 5 SMTP lines to .env (heredoc keeps the password off your shell history)
cat >> .env <<'EOF'

# ─── EMAIL (SMTP via Gmail) — added 2026-05-16 ───
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=Dharsangroups@gmail.com
SMTP_PASSWORD=fqfnbmpatybtptbz
SMTP_FROM=Dharsan Dresses <Dharsangroups@gmail.com>
EOF

# Lock down the file so only opc can read it
chmod 600 .env
chown opc:opc .env

# Verify (should show -rw------- 1 opc opc)
ls -la .env

# Restart the app so it picks up the new env vars
docker compose restart app

# Optional: tail logs to confirm SMTP init succeeded
docker compose logs -f app | head -50
```

**Note on the password format:** Google displays App Passwords with spaces (`fqfn bmpa tybt ptbz`) for readability, but they work either way. I've used the no-space version above to avoid any quoting issues in the shell heredoc.

---

#### 2.8 — Operational hardening (do these as we wrap Phase 2)
| # | Task | What I do | What I need from you |
|---|------|-----------|----------------------|
| 2.8.a | Owner changes default admin password via `/profile` | — | **You do it** — log in as `admin@dharsandresses.com` / `Admin@Dharsan2026!` → /profile → change |
| 2.8.b | Set up UptimeRobot ping `/api/health` every 5 min | — | **You do it (5 min)** — https://uptimerobot.com → free account → add monitor |
| 2.8.c | Add Google Analytics 4 | I write the code | **You** create GA4 property at https://analytics.google.com → share Measurement ID (`G-XXXXXXXXXX`) |
| 2.8.d | Add `error.tsx` (segment-level) + `global-error.tsx` | I write the code | Nothing |
| 2.8.e | Add `loading.tsx` skeletons (products list, category, PDP) | I write the code | Nothing |

---

### Phase 3 — Make It Sellable (admin order ops + customer order history)
**Outcome:** Owner can manage orders end-to-end; customers can see their order history. No shipping integration or PDFs yet (those move to Phase 6).

| # | Task | What I do | What I need from you |
|---|------|-----------|----------------------|
| 3.1.a | `/admin/orders` list with filters (status, date range, customer) | I write the code | Nothing |
| 3.1.b | `/admin/orders/[orderNumber]` detail page (items, address, payment, status timeline, manual tracking-number input) | I write the code | Nothing |
| 3.1.c | Status update UI (PENDING → CONFIRMED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED; side: CANCELLED w/ reason; RETURN_REQUESTED → RETURN_PICKED → REFUNDED) | I write the code | Nothing (industry-standard flow locked in) |
| 3.1.d | Customer `/orders` page (list with status badges, total, date) | I write the code | Nothing |
| 3.1.e | Customer `/orders/[orderNumber]` (full detail, status timeline, manual tracking link, Need-help WhatsApp/phone CTA) | I write the code | Nothing |
| 3.1.f | `GET /api/orders` + `GET /api/orders/[orderNumber]` (auth-protected) | I write the code | Nothing |
| 3.1.g | Cancel-order button on customer side (only while status is PENDING / CONFIRMED) | I write the code | Nothing |

---

### Phase 4 — Make It Trustworthy (CRITICAL before public launch)
**Outcome:** A first-time visitor trusts the site enough to enter their card details. Account security matches Meesho/Nykaa standards.

#### 3.1 — Auth hardening (see "Production-Grade Auth" section for service signups)
- [ ] Email verification: send link on signup, gate checkout for unverified accounts (or just show a banner)
- [ ] Real password reset: email-based token, `/reset-password?token=...` page, 30-min expiry
- [ ] MSG91 + DLT registration done (1-3 days approval)
- [ ] SMS OTP signup: phone-first signup option (Meesho-style)
- [ ] SMS OTP login: alternative to email/password
- [ ] Rate limiting on auth endpoints via Upstash Redis (5 OTPs/phone/hour)

#### 3.2 — Error tracking and observability
- [ ] Sentry account (free tier 5k events/month) → wire up `@sentry/nextjs`
- [ ] All API routes wrap errors and report to Sentry
- [ ] Client error boundary reports to Sentry

#### 3.3 — SEO foundation
- [ ] `next-sitemap` configured → `/sitemap.xml` generated at build time
- [ ] `public/robots.txt` (allow all; sitemap reference)
- [ ] JSON-LD structured data:
  - `Product` schema on PDP (name, images, price, availability, rating, reviews)
  - `Organization` schema in root layout (name, logo, address, social, contact)
  - `BreadcrumbList` on category and product pages
- [ ] Per-page Open Graph images (auto-generate from product image)

#### 3.4 — Conversion essentials
- [ ] Pincode serviceability widget on PDP
- [ ] Estimated delivery date shown on PDP and checkout
- [ ] "X people viewing this" / "Y bought in last 24h" social proof (optional)
- [ ] Cart abandonment recovery: save guest cart server-side, email reminder after 24h (if user is logged in)

---

### Phase 5 — Make It Convert (UX polish to match Meesho/Nykaa)
**Note:** Several items originally here (filter sidebar, sort fix, PDP variant selector, image zoom, "you may also like", share buttons, recently-viewed) **moved into Phase 2.3 / 2.4** since they're part of the current sprint focus on Browse UX. What remains here is the deeper engagement layer.
**Outcome:** Browsing feels effortless. Visitors can find what they want in under 30 seconds.

#### 4.1 — Filtering (Meesho/Nykaa-style, plan already documented above)
- [ ] Add `fabric`, `occasion[]`, `colors[]`, `discount` fields to `Product` schema (migration)
- [ ] Sidebar filter component: price slider + presets, category, fabric, colour swatches, occasion, discount, in-stock toggle
- [ ] Mobile: bottom-sheet filter drawer
- [ ] `ActiveFilters` chip row with × to remove
- [ ] URL-driven filter state — sharable/bookmarkable
- [ ] Fix sort dropdown's `onChange` wiring (currently a no-op)
- [ ] Pagination: "Load More" button OR numbered pagination, 24/page

#### 4.2 — Search upgrade
- [ ] Add **Meilisearch** as a Docker container alongside the app
- [ ] Index all products on every product create/update (background task)
- [ ] Real-time search-suggestions dropdown in Navbar (top 6 matches, debounced)
- [ ] Typo tolerance (saree ↔ sari, kurta ↔ kurti) — comes free with Meilisearch

#### 4.3 — Product detail page polish
- [ ] Visual variant selector — size buttons + colour swatches (variants already in DB, just need UI)
- [ ] Image zoom on hover + lightbox carousel (use `react-image-gallery` already in deps)
- [ ] Share buttons: WhatsApp, copy link
- [ ] "You may also like" — 4 related products (same category, exclude current)
- [ ] Stock urgency: "Only 2 left in this size", "10 sold in last 24h"
- [ ] Recently viewed strip at bottom (localStorage)

#### 4.4 — Customer engagement features
- [ ] Wishlist: `POST /api/wishlist`, `DELETE /api/wishlist/[productId]`, real `/wishlist` page (heart icon active state)
- [ ] Review submission form on PDP for users who bought the product (use `Review.isVerified`)
- [ ] Review photo upload (1-3 images per review)
- [ ] Admin review moderation queue (set `isApproved` true/false)

#### 4.5 — Checkout polish
- [ ] Coupon validation: wire the Apply button to `POST /api/coupons/validate`, show discount in summary
- [ ] Order notes / delivery instructions textarea
- [ ] Saved addresses: edit, delete, default toggle
- [ ] Express checkout: skip cart, go straight from "Buy Now" → checkout
- [ ] Bank offers display ("10% off on HDFC cards") — purely informational, fed by `SiteSettings`

---

### Phase 6 — Pre-Launch Infra (shipping, invoicing, WhatsApp)
**Outcome:** The boring-but-required production pieces that don't affect day-to-day browsing/buying but are needed for legal/operational compliance before going live.

#### 6.1 — Delhivery shipping (formerly Phase 2.6)
| # | Task | What I do | What I need from you |
|---|------|-----------|----------------------|
| 6.1.a | Sign up for Delhivery API access | — | Sign up at https://www.delhivery.com → request API access (2-7 days approval) |
| 6.1.b | Provide Delhivery API token + warehouse name + pickup pincode | — | Share after approval |
| 6.1.c | Provide full pickup address (line 1/2, city, state, pincode, contact name+phone) | — | Already on file (Yadava St, Tirupati 517501, +91 94402 50863) — just confirm |
| 6.1.d | Build `lib/delhivery.ts` shipment creation + waybill save | I write the code | Nothing |
| 6.1.e | Auto-create shipment on order CONFIRMED | I write the code | Nothing |
| 6.1.f | Real `/track-order` page using `trackShipment(waybill)` | I write the code | Nothing |
| 6.1.g | `POST /api/webhooks/delhivery` status webhook | I write the code | Register webhook URL in Delhivery dashboard |
| 6.1.h | Pincode serviceability widget on PDP + checkout | I write the code | Nothing |

#### 6.2 — Invoice PDF (formerly Phase 2.7)
| # | Task | What I do | What I need from you |
|---|------|-----------|----------------------|
| 6.2.a | Decide invoice format | — | Share a sample ER4U invoice (PDF/screenshot) so I match layout; or "design clean" |
| 6.2.b | Provide invoice header details | — | Legal business name, GSTIN, full address, logo (already in `/public/images/logo.png`) |
| 6.2.c | HSN + GST per product already imported from ER4U via 2.0 | I write the code | Nothing |
| 6.2.d | Wire `@react-pdf/renderer` | I write the code | Nothing |
| 6.2.e | `GET /api/invoices/[invoiceNumber]` PDF endpoint | I write the code | Nothing |
| 6.2.f | Attach PDF to order-confirmation email | I write the code | Nothing |
| 6.2.g | "Download Invoice" button on customer + admin order pages | I write the code | Nothing |

#### 6.3 — WhatsApp notifications via Twilio (deferred per owner)
| # | Task | What I do | What I need from you |
|---|------|-----------|----------------------|
| 6.3.a | Sign up for Twilio + apply for WhatsApp Business API | — | Sign up at https://twilio.com; submit Facebook Business Manager link (1-3 day approval) |
| 6.3.b | Add Twilio env vars to server | — | Paste `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` |
| 6.3.c | Get message templates approved | — | Draft 3 templates (order confirmation, shipping, delivery) → submit to Twilio for WABA approval |
| 6.3.d | Wire WhatsApp send on order events | I write the code (file already exists, just needs config) | Nothing |

---

### Phase 7 — Make It Grow (catalogue scale & marketing features)
**Outcome:** Shop owner can manage hundreds of products and run campaigns without engineering help.

- [ ] **CSV bulk import** (`/admin/products/import`) — download template, upload, validate, dry-run preview, confirm
- [ ] **Coupon admin** (`/admin/coupons`) — create, edit, expire, see usage stats
- [ ] **Banner CMS** (`/admin/banners`) — hero slides, category banners, promotional strips, scheduled go-live
- [ ] **Newsletter** — real subscribe endpoint, list export, simple campaign sender
- [ ] **Customer admin** (`/admin/customers`) — list, view per-customer order history, lifetime value
- [ ] **Inventory admin** (`/admin/inventory`) — low-stock alerts, bulk restock, stock movement log
- [ ] **Stitching booking** — `/stitching` already exists; wire Google Calendar API to auto-create events when bookings come in
- [ ] **Loyalty points** — schema additions, earn on order, redeem at checkout
- [ ] **Multi-language** — configure `next-intl`, translate UI strings, Telugu + Hindi (categories already have `nameTE`/`nameHI` fields)
- [ ] **WhatsApp catalog** integration (Twilio WhatsApp Business)
- [ ] **Mobile app** (React Native) — same API, store on Play Store

---

### Phase 8 — Go Live (Final flip-the-switch)
**Outcome:** Site is on the real domain, HTTPS, real payments, real customers.

- [ ] Domain DNS pointed at OCI server IP (A record + AAAA if v6)
- [ ] SSL: install `certbot`, issue cert, switch nginx to `nginx.ssl.conf`, cron the renewal
- [ ] Razorpay: complete KYC, switch from test → live keys in `.env`
- [ ] Twilio WhatsApp Business: template approval done, production sender on
- [ ] Final end-to-end test: real ₹1 order from a real phone with a real card → full pipeline (payment → email → WhatsApp → shipping label → tracking)
- [ ] Submit sitemap to Google Search Console
- [ ] Bing Webmaster Tools (free, often missed)
- [ ] Open the shop for the public 🎉

---

## Phase 2 — Detailed Instructions: Uploading Products & Images

This is the exact step-by-step for adding real product photos and details, compatible with the current setup.

### Step 1 — Set Up OCI Object Storage (one-time setup)

OCI Object Storage = a free bucket where your product images will live. The website reads images from public URLs.

1. **Log in to OCI Console** → https://cloud.oracle.com/
2. **Create a bucket:**
   - Menu → Storage → Object Storage & Archive Storage → Buckets
   - Click "Create Bucket"
   - Name: `dharsan-dresses-images`
   - Storage Tier: Standard
   - Public Access: enable "Object: Allow access to objects"
   - Click "Create"
3. **Get the bucket's public URL** — looks like:
   ```
   https://objectstorage.<region>.oraclecloud.com/n/<namespace>/b/dharsan-dresses-images/o/
   ```
   (e.g., `https://objectstorage.ap-mumbai-1.oraclecloud.com/n/bmxxxxxx/b/dharsan-dresses-images/o/`)
4. **Create API credentials:**
   - Top right profile icon → User Settings → Customer Secret Keys → Generate
   - Save the Access Key ID and Secret Access Key
5. **Add to `.env` on the OCI server:**
   ```env
   OCI_BUCKET_NAME=dharsan-dresses-images
   OCI_BUCKET_NAMESPACE=<your namespace>
   OCI_REGION=ap-mumbai-1
   OCI_ACCESS_KEY_ID=<from step 4>
   OCI_SECRET_ACCESS_KEY=<from step 4>
   NEXT_PUBLIC_BUCKET_URL=https://objectstorage.ap-mumbai-1.oraclecloud.com/n/<namespace>/b/dharsan-dresses-images/o
   ```
6. **Restart the app:** `docker compose restart app`

### Step 2 — Prepare Product Photos

Before uploading, prep each saree's photos:

- **Format:** JPG or WebP (smaller file size)
- **Size:** 1200×1500px (4:5 ratio, portrait — fashion standard)
- **Quality:** 80–85% JPG compression (look good, load fast)
- **Naming:** `kanjivaram-red-001.jpg`, `kanjivaram-red-002.jpg` (use dashes, no spaces)
- **Number per product:** 4–6 images recommended
  - Front view (full saree)
  - Back / pallu detail
  - Close-up of design/zari work
  - Model wearing it (if available)
  - Color swatch / fabric texture close-up

**Tip:** Use free tools to compress before upload:
- https://tinypng.com (online, drag-drop)
- https://squoosh.app (Google, advanced settings)

### Step 3 — Add a Product via Admin Panel

The flow once OCI Storage is connected:

1. Visit `https://dharsandresses.com/admin` (or the IP for now)
2. Log in with admin credentials
3. Go to **Products → Add New Product**
4. Fill in fields:
   ```
   Name:         Kanjivaram Red Silk Saree
   Slug:         kanjivaram-red-silk-saree (auto-generated)
   Category:     Silk Sarees
   Fabric:       Pure Kanjivaram Silk
   Price:        ₹12,500
   Compare Price: ₹15,000  (shows as strikethrough — discount %)
   Stock:        10
   SKU:          DHR-SLK-001
   Occasion:     [Wedding, Festival]
   Colors:       [Red, Gold]
   Description:  (rich text — 2-3 paragraphs about the saree, weave, occasion fit)
   Care Instructions: Dry clean only. Store wrapped in muslin cloth.
   ```
5. **Upload images:**
   - Click "Upload Images" → select 4–6 prepped photos
   - Admin panel uploads them to OCI bucket → saves the URLs in DB
   - First image = thumbnail (shown on product listing)
6. Click **Save & Publish**
7. Product is now live at `/products/kanjivaram-red-silk-saree`

### Step 4 — Bulk Import via CSV (for many products at once)

When you have 50+ products to add, use the CSV importer (will be built in Phase 4):

1. **Download CSV template** from admin → Products → Import → Download Template
2. **Fill it in** with one product per row:
   ```csv
   name,slug,category,fabric,price,compare_price,stock,sku,colors,occasion,description,image_urls
   Kanjivaram Red Silk Saree,kanjivaram-red,Silk Sarees,Kanjivaram,12500,15000,10,DHR-SLK-001,"Red,Gold","Wedding,Festival","Pure Kanjivaram silk...","url1.jpg,url2.jpg"
   ```
3. **Upload images to OCI bucket FIRST** (drag-drop in OCI console) → copy the public URLs
4. **Paste URLs into the `image_urls` column** (comma-separated)
5. **Upload CSV** in admin panel → click "Validate" → click "Import"
6. The importer:
   - Creates/updates products by SKU
   - Links to existing image URLs
   - Shows a report (X created, Y updated, Z failed with reasons)

### Step 5 — Edit / Restock / Mark Out of Stock

- **Edit:** Admin → Products → click product → edit any field → Save
- **Restock:** Update the `Stock` field (e.g., from 0 to 15)
- **Hide temporarily:** Toggle "Published" to OFF (stays in DB but hidden from site)
- **Delete:** Permanent — use with caution; better to unpublish

### Step 6 — Verify on the Live Site

After adding a product, check:
1. It shows up at `/products` (listing page) with correct thumbnail
2. Click into the product → all images load
3. Add to cart works
4. Filter by category/fabric shows it correctly
5. Image is sharp on mobile (test on phone)

### Common Issues During Upload

| Problem | Cause | Fix |
|---------|-------|-----|
| Image upload fails | OCI credentials wrong in `.env` | Re-check `OCI_ACCESS_KEY_ID` and secret |
| Image uploads but doesn't show on site | Bucket not set to public | OCI Console → Bucket → Edit Visibility → Public |
| Image too slow to load | File too large (>500KB) | Compress with tinypng.com before upload |
| Wrong color on website | Image color space is CMYK | Re-export as sRGB JPG |
| Image stretched / cropped weird | Wrong aspect ratio | Use 4:5 (1200×1500) portrait crop |

---

## Secret Management Architecture — Why `.env` Isn't Great, and What Comes Next

The owner correctly raised the concern: **storing SMTP passwords, OCI keys, Razorpay secrets, etc. in a `.env` file isn't best practice**. Here are the options ranked by effort vs. security, and the migration plan.

### Option A — `.env` file (what we're doing now in Phase 2)
**How it works:** secrets in a single file at `/home/opc/Dharsan_ecommerce/.env`, loaded by Docker Compose into the container's environment.

| ✅ Pros | ❌ Cons |
|---------|--------|
| Zero setup. Docker Compose reads it natively. | Anyone with shell access to the server can `cat .env` |
| `.gitignore` prevents commits | Visible via `docker inspect` to anyone in the `docker` group |
| Industry standard for small/early-stage deployments | Restoring from a backup or snapshot copies secrets too |
| Same file used in dev and prod (consistent) | Rotation requires editing the file + container restart |

**Minimum hardening (do today):**
```bash
ssh opc@144.24.153.46
cd ~/Dharsan_ecommerce
chmod 600 .env          # only owner can read
chown opc:opc .env      # owned by opc only
ls -la .env             # should show: -rw------- 1 opc opc
```

This is the **right answer for Phase 2 / Phase 3** — get the site working, then harden.

### Option B — Docker Secrets (small step up)
**How it works:** secrets are stored as files mounted into the container at `/run/secrets/smtp_password`. App reads the file instead of the env var.

| ✅ Pros | ❌ Cons |
|---------|--------|
| Secrets not in `docker inspect` | App code must read from files (small change) |
| Each secret is a separate file → easy rotation | Mainly designed for Docker Swarm, not stand-alone Compose |
| Still local — no external service dependency | Marginal improvement over `.env` on a single-VM setup |

**When to use:** if we move to Docker Swarm or multi-host. Not worth it for our single VM.

### Option C — OCI Vault (production-grade, recommended for Phase 4)
**How it works:** secrets stored in Oracle Cloud's managed vault service. App fetches them at startup via OCI SDK using instance principal auth (no keys to manage). Free tier covers 150 secret versions.

| ✅ Pros | ❌ Cons |
|---------|--------|
| Secrets never on disk on the VM | Adds a startup dependency (vault must be reachable) |
| Audit log: who accessed which secret when | Slight cold-start delay (~200ms to fetch on boot) |
| Built-in rotation API | More moving parts during deployment |
| Already in your stack (OCI free tier) | App needs SDK code to fetch (we'd write it once) |
| IAM-based access control | |

**Migration plan when we get to Phase 4:**
1. Create OCI Vault in same compartment as the VM
2. Create one Master Encryption Key
3. Upload each secret (SMTP_PASSWORD, OCI_SECRET_ACCESS_KEY, RAZORPAY_KEY_SECRET, etc.) as a separate Vault Secret
4. Grant the compute instance an Instance Principal with `read` access on those secrets
5. Add `src/lib/secrets.ts` — fetches all secrets at app startup, populates `process.env`
6. Delete secrets from `.env`. Keep only non-secret config there (URLs, ports, feature flags)
7. Remove `.env` from server entirely after verification

**Estimated effort:** ~4 hours, all on my side. Owner only needs to (a) create the vault in OCI Console and (b) attach the instance principal policy.

### Recommendation
- **Right now (Phase 2):** stick with `.env`. It's gitignored, file-mode-600, owned by `opc`. That's secure enough for a soft-launch.
- **Phase 4 (Make It Trustworthy):** migrate to OCI Vault as part of the same sprint where we add OTP, rate limiting, etc.
- **Always:** never commit `.env`, never paste secrets in chat/Slack/email (use ssh + nano), rotate after any suspected leak.

### Special note on the SMTP password the owner shared this turn
The Gmail App Password `fqfn bmpa tybt ptbz` was sent over chat → it's now in conversation logs. We'll use it tonight to verify SMTP works, then **revoke + regenerate** as a hygiene step:
1. After confirming the first test email arrives → Google Account → Security → App passwords → find the entry → trash icon
2. Generate a new one
3. SSH to server, `nano .env`, update `SMTP_PASSWORD`, `docker compose restart app`
4. **Never share the new one anywhere except directly typed into the server's `.env`**

---

## Production E-Commerce Architecture Reference

Reference: how top Indian e-commerce sites (Meesho, Nykaa style) are structured.

```
┌─────────────────────────────────────────────────────────────┐
│                        USERS                                 │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CDN (Cloudflare — free tier)                    │
│  • Caches static assets (images, JS, CSS)                   │
│  • DDoS protection, SSL termination                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         OCI Server — Nginx Reverse Proxy                     │
│  (VM.Standard.A1.Flex — 4 OCPU, 24GB RAM — FREE)           │
└──────┬───────────────────────────────────────────┬──────────┘
       │                                           │
       ▼                                           ▼
┌──────────────┐                        ┌──────────────────┐
│  Next.js App │                        │  Meilisearch     │
│  (Docker)    │                        │  (Docker)        │
│              │                        │  Fast search     │
└──────┬───────┘                        └──────────────────┘
       │
       ├──────────────────────────────────────────────┐
       │                                              │
       ▼                                              ▼
┌──────────────────┐                    ┌─────────────────────┐
│  OCI Autonomous  │                    │  OCI Object Storage  │
│  Database (FREE) │                    │  (FREE 10GB)         │
│  PostgreSQL      │                    │  Product images      │
│  Auto-backup     │                    │  Invoices, docs      │
└──────────────────┘                    └─────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                            │
│  Razorpay (payments) │ Twilio (WhatsApp) │ Gmail (email)     │
│  Delhivery (shipping)│ Google OAuth      │ Google Analytics  │
└──────────────────────────────────────────────────────────────┘
```

**Cost with OCI free tier:**
| Component | Cost |
|-----------|------|
| OCI Compute (4 OCPU, 24GB RAM) | ₹0 forever |
| OCI Object Storage (10GB) | ₹0 forever |
| OCI Autonomous DB (1 OCPU, 20GB) | ₹0 forever |
| Cloudflare CDN + DNS | ₹0 |
| Let's Encrypt SSL | ₹0 |
| Gmail SMTP (500/day) | ₹0 |
| GitHub Actions CI/CD | ₹0 |
| Razorpay | 2% per transaction only |
| Domain (yearly) | ~₹600/year |
| **Total monthly** | **₹0 + txn fees** |

---

## Decisions Locked In

| Question | Decision |
|----------|----------|
| Product management via admin panel only, or CSV bulk import too? | **Both** — admin panel + CSV bulk import |
| Sarees: one-of-a-kind (stock=1) or multi-stock? | **Multi-stock** (e.g. same saree available in 10 pieces) |
| Multi-vendor support (other sellers)? | **No** — single store only |
| Stitching booking sync with Google Calendar? | **Yes** — integrate Google Calendar API for tailor appointments |
| Mobile app (React Native)? | **Future** — only after website is fully live and stable |
| Product filtering style? | **Meesho/Nykaa-style** — price range, category, fabric, color, occasion, discount |
| Product schema fields (HSN/weight/GST per product)? | **Meesho-standard** — `name, slug, brand, category, subCategory, mrp, price (after discount), stock, sizes[], colors[], fabric, description, careInstructions, hsnCode, gstRate, weight, images[], isPublished, isFeatured, isNewArrival, isOnSale`. HSN + GST are per-product (carried from ER4U). |
| Order status flow? | **Industry standard (Meesho/Amazon style)**: `PENDING → CONFIRMED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED`. Side flows: `CANCELLED` (with `cancelReason`, customer- or admin-initiated, pre-shipment only), `RETURN_REQUESTED → RETURN_PICKED → REFUNDED` (post-delivery, with `returnReason`). |
| Admin password reset | **Owner will change via `/profile`** — no seed change |
| Store phone | **+91 94402 50863** (replaced all `91XXXXXXXXXX` placeholders 2026-05-16) |
| Store email (also SMTP sender) | **Dharsangroups@gmail.com** |
| WhatsApp notifications (Twilio) | **Deferred to final phase (Go Live)** — focus elsewhere until then |
| Delhivery shipping integration | **Deferred to Phase 5 (Pre-Launch Infra)** — focus on UI first |
| Invoice PDF generation | **Deferred to Phase 5 (Pre-Launch Infra)** — focus on UI first |
| Current sprint focus | **Browse UX + Login + Signup** — how a visitor discovers a category, browses products, and creates / signs in to their account |
| Product display name | **`{Brand} {Item Name} ({Barcode})`** — e.g. "MARK ANTONY 2 BUTTON COAT (RM181277)". Items with no brand: `{Item Name} ({Barcode})` |
| Product URL slug | **Clean SEO slug** — e.g. `/product/mark-antony-2-button-coat-rm181277`. Barcode lives at end for uniqueness. Internal `originalSku` field stores raw barcode |
| ER4U product images | **Pending ER4U team discussion** (owner is following up). Until then: catalogue ships with brand-gradient placeholders. Once images are available, we'll know which scraper pattern to use |
| Google OAuth login | **Deferred** — owner has no GCP account yet. Email/password remains primary; we can add Google login post-launch when GCP account is created |
| Secret management | **Phase 2 = `.env` on server** (locked to `chmod 600`, gitignored). **Phase 4 hardening = migrate to OCI Vault** (see "Secret Management Architecture" section below) |

---

## Product Filters — Nykaa/Meesho Style Plan

Reference: how top Indian fashion sites handle filtering.

### Filter Panel (Left sidebar on desktop, bottom sheet on mobile)

```
FILTERS
────────────────────
Price Range
  ○ Under ₹500
  ○ ₹500 – ₹1,000
  ○ ₹1,000 – ₹2,500
  ○ ₹2,500 – ₹5,000
  ○ Above ₹5,000
  [Min]──────[Max] slider

Category
  ☐ Silk Sarees
  ☐ Cotton Sarees
  ☐ Printed Sarees
  ☐ Embroidered Sarees
  ☐ Party Wear
  ☐ Casual Wear
  ☐ Bridal Wear

Fabric
  ☐ Pure Silk
  ☐ Kanjivaram
  ☐ Banarasi
  ☐ Cotton
  ☐ Georgette
  ☐ Chiffon
  ☐ Linen

Occasion
  ☐ Wedding
  ☐ Festival
  ☐ Casual
  ☐ Office
  ☐ Party

Color
  ● Red  ● Blue  ● Green
  ● Gold ● Pink  ● White
  ● Navy ● Black ● Purple

Discount
  ☐ 10% and above
  ☐ 20% and above
  ☐ 30% and above

Availability
  ☐ In Stock only
```

### Sort Options (top bar)
- Relevance (default)
- Newest First
- Price: Low to High
- Price: High to Low
- Most Popular
- Highest Rated
- Biggest Discount

### Implementation Plan

**Database changes needed (Prisma schema):**
```prisma
model Product {
  fabric     String?        // "Pure Silk", "Cotton", etc.
  occasion   String[]       // ["Wedding", "Festival"]
  colors     String[]       // ["Red", "Gold"]
  discount   Int?           // percentage off (0–100)
}
```

**API changes needed:**
- `/api/products?category=silk&minPrice=500&maxPrice=2500&fabric=Cotton&sort=price_asc&page=1`
- All filters passed as query params, Prisma `where` clause built dynamically

**Frontend components to build:**
- `FilterPanel` — collapsible sidebar (desktop) / bottom drawer (mobile)
- `ActiveFilters` — chips showing applied filters with × to remove each
- `SortDropdown` — top right of product grid
- `ProductGrid` — 4 columns desktop, 2 columns mobile, 24 items per page

**URL state:** filters reflected in URL so users can share/bookmark filtered results
- Example: `/products?category=silk&color=red&maxPrice=5000`

---

## Google Calendar Integration — Stitching Bookings

When a customer books a stitching appointment:
1. Customer fills form (name, phone, preferred date/time, measurements)
2. Booking saved to `StitchingBooking` table in DB
3. Google Calendar event created automatically via Google Calendar API
4. Customer gets email confirmation with calendar invite (.ics file)
5. Tailor/admin sees it in their Google Calendar

**Setup steps (when ready):**
1. Google Cloud Console → Enable Calendar API
2. Create a Service Account → download JSON key
3. Share the shop's Google Calendar with the service account email
4. Add to `.env`:
```env
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
GOOGLE_SERVICE_ACCOUNT_KEY=<base64 encoded JSON key>
```

---

---

## Production-Grade Auth (Phase 3+) — What's Needed From You

Currently we have basic email + password auth (NextAuth Credentials + Google). To match Meesho/Nykaa you'll need to decide on a few things and sign up for the right services.

### What Meesho/Nykaa actually do

- **Signup/login:** mobile number + OTP (the primary path; email is optional)
- **Password reset:** email link OR mobile OTP
- **Order confirmation:** SMS + email + WhatsApp
- **Email verification:** soft-required (banner reminds the user)

### The four building blocks you'd add

| Block | What it does | Service options | Cost (India) |
|-------|-------------|-----------------|--------------|
| **Mobile OTP** | 6-digit code via SMS for signup/login/password reset | **MSG91** (India-focused, DLT-compliant) ✅, Fast2SMS, Twilio | MSG91 ~₹0.20/SMS, Twilio ~₹1/SMS |
| **Email verification + reset** | Verify email on signup, send password-reset links | **Resend** (best DX) ✅, Postmark, SendGrid, or Gmail SMTP (already planned) | Resend free up to 3,000/month, then ₹1,650/mo for 50k |
| **WhatsApp OTP** (optional) | OTP delivered via WhatsApp instead of SMS — cheaper and higher delivery rate | **MSG91 WhatsApp**, Twilio WhatsApp, Gupshup | MSG91 WhatsApp ~₹0.10/message |
| **Rate limiting / abuse prevention** | Block bots from spamming OTPs | **Upstash Redis** (free tier) + a small middleware | ₹0 on free tier |

### What I'd recommend for Dharsan Dresses

1. **MSG91 for SMS OTP** — they're India-focused, DLT-compliant (mandatory for SMS in India since 2020), affordable, and their dashboard is simple. Use their "Send OTP" API.
2. **Gmail SMTP for password-reset emails** (already in plan) — free, 500/day is plenty for a single-store business. Upgrade to Resend later if volume grows.
3. **Skip WhatsApp OTP for now** — use WhatsApp for *notifications* (order updates) only, via Twilio (already planned). Adds complexity for marginal benefit.
4. **Upstash Redis for rate limiting** — free tier covers all your needs for years.

### What you need to do (when we get to Phase 3)

| Step | Time | What's needed |
|------|------|---------------|
| Sign up at **msg91.com** | 10 min | PAN, company name, then submit a DLT registration form (1-3 days approval, free) |
| Register a **sender ID** with MSG91 | 1 day approval | 6-char ID like `DRHSAN` shown on SMS |
| Submit one **DLT-approved SMS template** | Same day | Template text like: `{#var#} is your OTP to login to Dharsan Dresses. Valid for 5 min.` |
| Set up **Gmail App Password** | 5 min | 2FA on your Gmail, then generate app password |
| (Optional) Sign up at **upstash.com** | 5 min | Free tier, no card needed |

### Implementation plan when ready (Phase 3, ~1 week of work)

1. Add `phoneVerified DateTime?` and `emailVerified DateTime?` columns to `User` table (emailVerified already exists)
2. Add `OtpToken` table (phone, code_hash, type, expires_at, attempts)
3. Build endpoints: `POST /api/auth/otp/send`, `POST /api/auth/otp/verify`
4. Add OTP step to register flow (verify phone before account creation)
5. Add OTP login option to login page (phone + OTP instead of email + password)
6. Wire up email-based password reset (`/forgot-password` already has the page)
7. Add rate limiting middleware (5 OTPs per phone per hour)
8. Optional: add an "email verification" banner shown to users who registered before email-verify was enforced

### What I'm NOT doing now (still in Phase 1)

- No OTP integration
- No actual email sending (the forgot-password page is a clean stub with WhatsApp/phone fallback)
- No phone verification

These are deliberate — Phase 1 is "make the site work", Phase 3 is "production-grade auth". Don't want to spread Phase 1 thin.

---

*Last updated: 2026-05-16 (post ER4U stock-report analysis)*
