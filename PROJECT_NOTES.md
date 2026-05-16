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

### Phase 2 — Make It Sellable (CRITICAL: no real selling possible until done)
**Outcome:** A real customer can buy a real product end-to-end. The shop owner can manage products and orders without touching the database.

#### 2.1 — Image storage and upload
- [ ] Create OCI Object Storage bucket `dharsan-dresses-images` (see "Phase 2 — Detailed Instructions" below)
- [ ] Add OCI credentials to `.env` (`OCI_BUCKET_NAME`, `OCI_NAMESPACE`, `OCI_REGION`, `OCI_ACCESS_KEY_ID`, `OCI_SECRET_ACCESS_KEY`)
- [ ] Build `POST /api/upload` endpoint — accepts image, uploads to OCI, returns public URL
- [ ] Build a reusable `<ImageUploader />` admin component (drag-drop, progress, multi-file)

#### 2.2 — Admin product management
- [ ] `/admin/products` — list, search, filter, paginate
- [ ] `/admin/products/new` — create product form (name, slug, category, fabric, price, comparePrice, stock, description, careInstructions, gender, isFeatured/isNewArrival/isOnSale flags)
- [ ] `/admin/products/[id]/edit` — edit any field
- [ ] Inline variant management (size + colour + stock)
- [ ] Inline image management using `<ImageUploader />` — reorder, mark primary, delete
- [ ] `DELETE /api/admin/products/[id]` (soft delete via `isPublished=false` recommended)
- [ ] Server-side admin role guard (middleware)

#### 2.3 — Admin order management
- [ ] `/admin/orders` — list with filters by status, date range, customer
- [ ] `/admin/orders/[orderNumber]` — full order detail with items, address, payment, status timeline
- [ ] Update order status (CONFIRMED → PROCESSING → SHIPPED → DELIVERED → REFUNDED)
- [ ] Add tracking number when shipping
- [ ] Print/download invoice (see 2.7)

#### 2.4 — Customer-facing orders
- [ ] Real `/orders` page — list user's orders with status badges, total, date
- [ ] `/orders/[orderNumber]` — full detail: items, shipping address, payment summary, status timeline, tracking link, "Need help?" CTA
- [ ] `GET /api/orders` + `GET /api/orders/[orderNumber]` (auth-protected)

#### 2.5 — Email actually sending
- [ ] Gmail App Password generated (5 min)
- [ ] Add `SMTP_*` env vars on server
- [ ] Verify order confirmation email reaches the customer
- [ ] Verify low-stock alert reaches the admin

#### 2.6 — Delhivery shipping integration
- [ ] Build `lib/delhivery.ts` shipment-creation function (`POST /api/cmu/create.json`)
- [ ] On order CONFIRMED, auto-create Delhivery shipment, save waybill to `Order.trackingNumber`
- [ ] Real `/track-order` page using `trackShipment(waybill)`
- [ ] `POST /api/webhooks/delhivery` — receive status updates, map to OrderStatus enum, update DB
- [ ] Pincode serviceability check on PDP ("Deliverable to your area" widget) and at checkout (validate before payment)

#### 2.7 — Invoice PDF
- [ ] Wire `@react-pdf/renderer` (already in `package.json`)
- [ ] `GET /api/invoices/[invoiceNumber]` — generates PDF on demand
- [ ] Email order confirmation: attach the PDF
- [ ] Both customer order page and admin order page have "Download Invoice" button

#### 2.8 — Operational hardening
- [ ] Change default admin password (`admin@dharsandresses.com` / `Admin@Dharsan2026!`)
- [ ] Move DB to OCI Autonomous Database (free tier, managed, auto-backup) — see ARCHITECTURE section
- [ ] Set up UptimeRobot (free) to ping `/api/health` every 5 min
- [ ] Add Google Analytics 4 (track page views, add-to-cart, purchase)
- [ ] Add `error.tsx` (segment-level) and `global-error.tsx`
- [ ] Add `loading.tsx` files where useful (products list, category, product detail)

---

### Phase 3 — Make It Trustworthy (CRITICAL before public launch)
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

### Phase 4 — Make It Convert (UX polish to match Meesho/Nykaa)
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

### Phase 5 — Make It Grow (catalogue scale & marketing features)
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

### Phase 6 — Go Live (Final flip-the-switch)
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

*Last updated: 2026-05-15*
