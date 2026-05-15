# 🛍️ Dharsan Dresses — E-commerce Platform

> Production-grade Next.js 14 e-commerce platform for Dharsan Dresses, Tirupati's premier clothing house.

**Tagline:** _Best Clothes. Best Stitch._

---

## ✨ Features

- 🎨 **Premium Royal Indian Aesthetic** — Navy + gold theme matching brand identity
- 🛒 **Full E-commerce** — Cart, wishlist, checkout, order management
- 💳 **Razorpay Payment** — Cards, UPI, Net Banking + Cash on Delivery
- 🚚 **Delhivery Integration** — Pan-India shipping, live tracking
- 📱 **WhatsApp Notifications** — Order updates via Twilio
- 📧 **Email Notifications** — Order confirmations, shipping updates
- 🌐 **Multi-language Ready** — English + Telugu + Hindi (next-intl)
- ✂️ **Custom Stitching Bookings** — Tailor appointment requests
- 📅 **Private Viewing Bookings** — In-store appointments
- 👨‍💼 **Admin Dashboard** — Manage products, orders, inventory, customers
- 🔒 **Production Security** — HTTPS, rate limiting, OWASP headers
- 🐳 **Dockerized** — Easy deployment to OCI/AWS/any cloud
- 🚀 **CI/CD** — GitHub Actions auto-deploy on push to `main`
- 📊 **Inventory Alerts** — Low stock email/WhatsApp alerts
- ⭐ **Reviews & Ratings** — Verified purchase reviews
- 🎫 **Coupons System** — Percentage & flat discounts
- 🔍 **SEO Optimized** — Meta tags, sitemap, schema markup

---

## 🛠️ Tech Stack

| Category       | Technology                                    |
| -------------- | --------------------------------------------- |
| Framework      | Next.js 14 (App Router) + TypeScript          |
| Database       | PostgreSQL 16 + Prisma ORM                    |
| Styling        | Tailwind CSS                                  |
| Auth           | NextAuth.js (Credentials + Google)            |
| Payments       | Razorpay (₹2% fees, best India support)       |
| State          | Zustand                                       |
| Email          | Nodemailer + Gmail SMTP (free)                |
| WhatsApp       | Twilio WhatsApp Business API                  |
| Shipping       | Delhivery API                                 |
| File Storage   | OCI Object Storage (free tier) or Cloudflare R2 |
| Hosting        | Oracle Cloud Infrastructure (free tier)       |
| Container      | Docker + Docker Compose                       |
| Reverse Proxy  | Nginx (HTTPS, rate limiting, security headers) |
| CI/CD          | GitHub Actions (free for 2000 min/month)      |

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

### 1. Clone & Install

```bash
git clone <your-repo>
cd dharsan-dresses
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

**Required env vars to get started:**
```env
DATABASE_URL="postgresql://dharsan:password@localhost:5432/dharsan_dresses"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Start PostgreSQL (Docker)

```bash
docker compose up -d postgres
```

### 4. Run Database Migrations & Seed

```bash
npx prisma db push      # Create tables
npm run db:seed         # Add categories, sample products, admin user
```

### 5. Start Development Server

```bash
npm run dev
```

Visit:
- 🌐 **Storefront:** http://localhost:3000
- 👨‍💼 **Admin Panel:** http://localhost:3000/admin
- 🗄️ **Prisma Studio (DB UI):** `npx prisma studio`

### Default Admin Login (CHANGE IN PRODUCTION!)

```
Email:    admin@dharsandresses.com
Password: Admin@Dharsan2026!
```

⚠️ **CHANGE THIS PASSWORD IMMEDIATELY** after first login. Production password should be 16+ chars random.

---

## 🌐 Production Deployment to OCI (Oracle Cloud)

### Step 1: Create OCI Always Free Tier Account

1. Sign up at https://www.oracle.com/cloud/free/
2. Create a **VM.Standard.A1.Flex** instance (ARM Ampere — 4 OCPUs, 24GB RAM, free forever)
3. Open ports 80, 443 in security list
4. Ubuntu 22.04 LTS recommended

### Step 2: Set Up Server

SSH into your server and run:

```bash
# Install Docker & Docker Compose
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker

# Create app directory
mkdir -p ~/dharsan-dresses
cd ~/dharsan-dresses

# Clone repo
git clone https://github.com/<you>/dharsan-dresses.git .

# Set up .env
cp .env.example .env
nano .env  # Add real credentials
```

### Step 3: SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install -y certbot

# Get certificate (do this BEFORE first nginx start)
sudo certbot certonly --standalone -d dharsandresses.com -d www.dharsandresses.com

# Copy certs to nginx folder
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/dharsandresses.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/dharsandresses.com/privkey.pem nginx/ssl/

# Auto-renewal (add to crontab)
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet && docker compose restart nginx
```

### Step 4: First Deploy

```bash
cd ~/dharsan-dresses
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

Site should now be live at `https://dharsandresses.com` 🎉

### Step 5: Set Up Auto-Deploy via GitHub Actions

In GitHub repo settings → Secrets, add:

| Secret | Value |
| ------ | ----- |
| `OCI_HOST` | Your OCI server's public IP |
| `OCI_USERNAME` | `ubuntu` (default) |
| `OCI_SSH_KEY` | Your private SSH key (contents of `~/.ssh/id_rsa`) |

Now every `git push origin main` will:
1. Build & test
2. Build multi-arch Docker image (amd64 + arm64)
3. Push to GitHub Container Registry (free)
4. SSH into OCI server and deploy
5. Run health checks

---

## 📦 Project Structure

```
dharsan-dresses/
├── prisma/
│   ├── schema.prisma          # Full database schema
│   └── seed.ts                # Initial categories & sample data
├── public/
│   └── images/logo.png        # Brand logo
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, Register
│   │   ├── (shop)/            # Customer-facing pages
│   │   │   ├── page.tsx       # Homepage
│   │   │   ├── products/      # Listing
│   │   │   ├── checkout/      # Razorpay checkout
│   │   │   └── stitching/     # Custom stitching booking
│   │   ├── admin/             # Admin panel
│   │   ├── api/               # Backend API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Brand styles
│   ├── components/
│   │   ├── layout/            # Navbar, Footer
│   │   ├── home/              # Hero, categories, testimonials
│   │   ├── product/           # ProductCard, gallery
│   │   ├── cart/              # CartDrawer
│   │   └── ui/                # Reusable UI
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   ├── auth.ts            # NextAuth config
│   │   ├── razorpay.ts        # Payment integration
│   │   ├── email.ts           # Order emails
│   │   ├── whatsapp.ts        # Twilio WhatsApp
│   │   └── delhivery.ts       # Shipping API
│   └── store/
│       └── cartStore.ts       # Zustand cart state
├── nginx/
│   └── nginx.conf             # Production reverse proxy
├── .github/workflows/
│   └── deploy.yml             # CI/CD pipeline
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yml         # Postgres + App + Nginx
├── tailwind.config.ts         # Brand colors
└── package.json
```

---

## 🔧 Third-Party Setup (You'll Need These)

### 1. Razorpay (Payment Gateway) — 2% fees, best in India

1. Sign up: https://razorpay.com/
2. Complete KYC (PAN, GST, bank account)
3. Dashboard → Settings → API Keys → Generate
4. Copy `Key ID` and `Key Secret` to `.env`
5. Webhooks (optional): Add `https://yourdomain.com/api/payments/webhook`

### 2. Gmail SMTP (Free Email)

1. Enable 2FA on your Gmail account
2. Google Account → Security → App Passwords → Create
3. Copy the 16-char password to `SMTP_PASSWORD` in `.env`
4. Use your business email as `SMTP_USER`

### 3. Twilio WhatsApp (Notifications)

1. Sign up: https://www.twilio.com/ (free trial available)
2. Apply for WhatsApp Business API (or use sandbox first)
3. Console → Account Info → Copy SID & Auth Token

### 4. Delhivery (Shipping)

1. Sign up as merchant: https://www.delhivery.com/
2. Get your API token from merchant dashboard
3. Add to `DELHIVERY_API_TOKEN` in `.env`

### 5. OCI Object Storage (Free Tier — 10GB)

1. OCI Console → Object Storage → Buckets → Create Bucket
2. Make bucket public for product images
3. Create Customer Secret Key under user
4. Add credentials to `.env`

**Alternative:** Cloudflare R2 (also free up to 10GB/month) — see commented section in `.env.example`

---

## 🎨 Brand Customization

**Colors** (defined in `tailwind.config.ts`):
- Navy: `#0A1128` (primary)
- Gold: `#C8991E` (accent)
- Cream: `#FAF7F0` (background)

**Fonts** (loaded from Google Fonts):
- Display: Cormorant Garamond (elegant serif)
- Body: DM Sans (modern sans)

**To change:** Edit `tailwind.config.ts` and `src/app/globals.css`.

---

## 📝 Admin Tasks (After Deploy)

1. **Login as admin** at `/admin`
2. **Change admin password** immediately
3. **Update Site Settings** (logo, phone, GST number, address)
4. **Add real product photos** (replace Unsplash placeholders)
5. **Configure Razorpay** with live keys
6. **Set up Delhivery** pickup location
7. **Test order flow** end-to-end with a small test order
8. **Configure Twilio WhatsApp** template approval (required for outbound)
9. **Set up domain DNS** to point to OCI server IP
10. **Submit sitemap to Google** at https://search.google.com/search-console

---

## 🐛 Common Issues

**"Module '@prisma/client' has no exported member..."**
```bash
npx prisma generate
```

**"PrismaClient is unable to be run in this environment"**
- Make sure `DATABASE_URL` is set correctly

**Razorpay payment fails with "signature verification failed"**
- Check `RAZORPAY_KEY_SECRET` is the secret, not the key ID
- Make sure you're not mixing test/live credentials

**Docker build fails on OCI ARM**
- The Dockerfile uses multi-arch builds — GitHub Actions handles this automatically
- For local builds on ARM: `docker buildx build --platform linux/arm64 .`

**Site doesn't load after deploy**
```bash
docker compose logs app  # Check Next.js logs
docker compose logs nginx  # Check Nginx logs
docker compose ps  # All services should be "healthy"
```

---

## 💰 Cost Breakdown (Monthly)

| Service | Cost | Free Tier |
| ------- | ---- | --------- |
| OCI Compute (4 OCPU, 24GB RAM) | ₹0 | Always Free |
| OCI Object Storage (10GB) | ₹0 | Always Free |
| GitHub Actions CI/CD | ₹0 | 2000 min/month free |
| Cloudflare DNS (optional) | ₹0 | Always Free |
| Razorpay | 2% per txn | No monthly fee |
| Gmail SMTP | ₹0 | Free (500/day limit) |
| Twilio WhatsApp | ~₹0.50/msg | Free trial |
| Delhivery | Pay per shipment | No monthly fee |
| Domain (yearly) | ~₹600 | — |
| SSL (Let's Encrypt) | ₹0 | Free, auto-renew |

**Total recurring cost: ₹0/month** + transaction fees only. Domain renewal once a year.

---

## 📞 Support

- **Shop:** Yadava St, Varadaraja Nagar, Tirupati, Andhra Pradesh 517501
- **Instagram:** [@dharsandresses](https://www.instagram.com/dharsandresses/)
- **YouTube:** [@dharsandresses](https://www.youtube.com/@dharsandresses)

---

**Built with ❤️ for Dharsan Dresses, Tirupati**
