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

## Roadmap — Making It a Premium Website

### Phase 1 — Make It Work (Do Now)
- [ ] Fix 404 on all pages (Nginx config)
- [ ] Fix Instagram thumbnail display (`next.config.js` image domains)
- [ ] Verify Docker volume persistence (postgres data survives restarts)

### Phase 2 — Add Content & Make It Reliable
- [ ] Configure OCI Object Storage bucket for product images
- [ ] Add real product photos and descriptions (see detailed steps below)
- [ ] Change default admin password
- [ ] Move database to OCI Autonomous Database (free, managed, auto-backup)
- [ ] Add database connection pooling (PgBouncer or Prisma Accelerate)
- [ ] Add proper error pages (404, 500)
- [ ] Set up uptime monitoring (UptimeRobot — free)
- [ ] Add Google Analytics

### Phase 3 — Make It Fast & Premium
- [ ] Implement Meilisearch for accurate product search
- [ ] Add product filtering (Meesho/Nykaa style — price, category, fabric, color, occasion, discount)
- [ ] Implement cursor-based pagination (24 products/page)
- [ ] Add image optimization (WebP conversion, lazy loading)
- [ ] Implement Redis caching for product listings
- [ ] Add product zoom on hover, multiple image views
- [ ] Add "Recently Viewed" and "Similar Products" sections
- [ ] Implement Razorpay live payments
- [ ] Set up Twilio WhatsApp notifications

### Phase 4 — Make It Grow
- [ ] Add product CSV/bulk import tool for admin
- [ ] Build customer loyalty points system
- [ ] Add saree customization/stitching booking flow with Google Calendar sync
- [ ] Integrate Delhivery for live shipping tracking
- [ ] Add product reviews with photo uploads
- [ ] Telugu + Hindi language support (next-intl)
- [ ] WhatsApp catalog integration
- [ ] SEO: submit sitemap to Google Search Console

### Phase 5 — Go Live (Final Step)
- [ ] Set up SSL (Let's Encrypt via certbot)
- [ ] Point domain `dharsandresses.com` to OCI server IP (DNS A record)
- [ ] Switch Razorpay from test → live keys
- [ ] Submit sitemap to Google Search Console
- [ ] Final end-to-end test with a real ₹1 order

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

*Last updated: 2026-05-15*
