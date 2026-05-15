# 🛍️ Dharsan Dresses — E-commerce Platform

> Production-grade Next.js 14 e-commerce for Dharsan Dresses, Tirupati.
> **Best Clothes. Best Stitch.**

---

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Local Development Setup](#local-development-setup)
3. [Testing Deployment (OCI — No Domain)](#testing-deployment-oci--no-domain)
4. [Production Deployment (With Domain + SSL)](#production-deployment-with-domain--ssl)
5. [GitHub Actions CI/CD](#github-actions-cicd)
6. [Third-Party Services Setup](#third-party-services-setup)
7. [Admin Panel](#admin-panel)
8. [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Styling | Tailwind CSS (Navy + Gold brand theme) |
| Auth | NextAuth.js (Credentials + Google) |
| Payments | Razorpay (COD + UPI + Cards) |
| State | Zustand (cart persistence) |
| Email | Nodemailer + Gmail SMTP |
| WhatsApp | Twilio WhatsApp Business API |
| Shipping | Delhivery API |
| Hosting | OCI Always Free / E4.Flex |
| Container | Docker + Docker Compose |
| Proxy | Nginx (HTTP or HTTPS) |
| CI/CD | GitHub Actions |

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- Git

### Steps

```bash
# 1. Clone
git clone https://github.com/Chandu-theja/Dharsan_ecommerce.git
cd Dharsan_ecommerce

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Set up environment
cp .env.example .env
# Edit .env — at minimum set:
#   DATABASE_URL (keep as-is for Docker)
#   NEXTAUTH_SECRET (run: openssl rand -base64 32)
#   NEXTAUTH_URL=http://localhost:3000
#   NEXT_PUBLIC_APP_URL=http://localhost:3000

# 4. Start database
docker compose up -d postgres

# 5. Set up database
npx prisma@5 db push
npm run db:seed

# 6. Start dev server
npm run dev
```

Visit:
- **Storefront:** http://localhost:3000
- **Admin:** http://localhost:3000/admin
- **DB Studio:** `npx prisma@5 studio`

**Default admin login:**
```
Email:    admin@dharsandresses.com
Password: Admin@Dharsan2026!
```
⚠️ Change this immediately in production.

---

## Testing Deployment (OCI — No Domain)

Use this when you have an OCI server but no domain name yet.
Accesses the site via public IP on HTTP.

### Step 1 — Server Initial Setup

SSH into your OCI server:

```bash
ssh opc@YOUR_OCI_IP
```

Install Docker:
```bash
sudo dnf update -y
sudo dnf install -y dnf-utils
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

Install Git and Node (for generating package-lock.json):
```bash
sudo dnf install -y git
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

### Step 2 — Open Firewall

**OCI Console firewall (Security List):**
```
OCI Console → Networking → Virtual Cloud Networks
→ Your VCN → Security Lists → Default Security List
→ Add Ingress Rules:

  Stateless: No | Source: 0.0.0.0/0 | Protocol: TCP | Port: 80
  Stateless: No | Source: 0.0.0.0/0 | Protocol: TCP | Port: 443
```

**OS firewall:**
```bash
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports
```

### Step 3 — Clone and Configure

```bash
cd ~
git clone https://github.com/Chandu-theja/Dharsan_ecommerce.git
cd Dharsan_ecommerce

# Generate package-lock.json
npm install --legacy-peer-deps

# Create .env from example
cp .env.example .env
nano .env
```

Set these values in `.env` (replace YOUR_OCI_IP with your actual IP e.g. 144.24.153.46):
```env
DATABASE_URL="postgresql://dharsan:StrongPassword123@postgres:5432/dharsan_dresses"
POSTGRES_USER=dharsan
POSTGRES_PASSWORD=StrongPassword123
POSTGRES_DB=dharsan_dresses
NEXTAUTH_SECRET=paste-output-of-openssl-rand-base64-32-here
NEXTAUTH_URL=http://YOUR_OCI_IP
NEXT_PUBLIC_APP_URL=http://YOUR_OCI_IP
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
# Copy the output into .env NEXTAUTH_SECRET
```

### Step 4 — Build and Start

```bash
# Verify nginx.conf is the HTTP-only version (no SSL lines)
grep -i ssl nginx/nginx.conf
# Should return nothing

# Create nginx logs directory
mkdir -p nginx/logs nginx/ssl

# Build and start all containers
docker compose up -d --build

# Watch build progress (takes 3-5 mins first time)
docker compose logs -f app
# Wait for: "Ready in Xs" or "started server on 0.0.0.0:3000"
```

### Step 5 — Run Database Migrations and Seed

```bash
# Run migrations (use prisma@5 to match project version)
docker compose exec app npx prisma@5 db push

# Seed database (categories + admin user)
docker compose exec app npm run db:seed
```

### Step 6 — Verify

```bash
# Check all containers are running
docker compose ps

# Health check
curl http://localhost/api/health
# Expected: {"status":"healthy","database":"connected"}
```

Open in browser: **http://YOUR_OCI_IP**

Admin panel: **http://YOUR_OCI_IP/admin**

---

## Production Deployment (With Domain + SSL)

Use this when you have a registered domain name.

### Prerequisites
- Domain name with DNS access
- OCI server already set up (follow Testing steps 1-3 above)

### Step 1 — Point DNS to OCI IP

In your domain registrar's DNS settings:
```
Type: A    Name: @              Value: YOUR_OCI_IP   TTL: 300
Type: A    Name: www            Value: YOUR_OCI_IP   TTL: 300
```

Wait 5-10 minutes for DNS propagation:
```bash
# Verify DNS has propagated
nslookup dharsandresses.com
# Should return your OCI IP
```

### Step 2 — Update .env for Production

```bash
nano ~/Dharsan_ecommerce/.env
```

Change these lines:
```env
NEXTAUTH_URL=https://dharsandresses.com
NEXT_PUBLIC_APP_URL=https://dharsandresses.com
```

Also fill in real credentials:
```env
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
RAZORPAY_KEY_SECRET=your_live_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
SMTP_USER=your-business-gmail@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

### Step 3 — Get SSL Certificate (Let's Encrypt — Free)

```bash
# Install certbot
sudo dnf install -y certbot

# Stop nginx temporarily to free port 80
docker compose stop nginx

# Get certificate (replace with your actual domain)
sudo certbot certonly --standalone \
  -d dharsandresses.com \
  -d www.dharsandresses.com \
  --email your-email@gmail.com \
  --agree-tos \
  --non-interactive

# Copy certs to project nginx/ssl folder
sudo mkdir -p ~/Dharsan_ecommerce/nginx/ssl
sudo cp /etc/letsencrypt/live/dharsandresses.com/fullchain.pem ~/Dharsan_ecommerce/nginx/ssl/
sudo cp /etc/letsencrypt/live/dharsandresses.com/privkey.pem ~/Dharsan_ecommerce/nginx/ssl/
sudo chown -R opc:opc ~/Dharsan_ecommerce/nginx/ssl
chmod 600 ~/Dharsan_ecommerce/nginx/ssl/privkey.pem

# Verify certs are in place
ls -la ~/Dharsan_ecommerce/nginx/ssl/
# Should show: fullchain.pem and privkey.pem
```

### Step 4 — Switch to SSL Nginx Config

```bash
cd ~/Dharsan_ecommerce

# Replace HTTP config with SSL config
cp nginx/nginx.ssl.conf nginx/nginx.conf

# Update domain name in config if different from dharsandresses.com
nano nginx/nginx.conf
# Find: server_name dharsandresses.com www.dharsandresses.com;
# Change to your actual domain
```

### Step 5 — Rebuild and Restart

```bash
docker compose down
docker compose up -d --build

# Check nginx is working with SSL
docker compose logs nginx --tail=20

# Test HTTPS
curl https://dharsandresses.com/api/health
```

### Step 6 — Auto-renew SSL Certificate

Let's Encrypt certs expire every 90 days. Set up auto-renewal:

```bash
sudo crontab -e
```

Add this line:
```
0 3 * * * certbot renew --quiet --pre-hook "cd /home/opc/Dharsan_ecommerce && docker compose stop nginx" --post-hook "cd /home/opc/Dharsan_ecommerce && cp /etc/letsencrypt/live/dharsandresses.com/fullchain.pem nginx/ssl/ && cp /etc/letsencrypt/live/dharsandresses.com/privkey.pem nginx/ssl/ && docker compose start nginx"
```

Test renewal works:
```bash
sudo certbot renew --dry-run
```

---

## GitHub Actions CI/CD

Auto-deploys to OCI on every push to `main`.

### Setup GitHub Secrets

Go to: https://github.com/Chandu-theja/Dharsan_ecommerce/settings/secrets/actions

Add these secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `OCI_HOST` | `144.24.153.46` | Your OCI public IP |
| `OCI_USERNAME` | `opc` | Default OCI Oracle Linux user |
| `OCI_SSH_KEY` | Contents of `~/.ssh/id_rsa` | Run: `cat ~/.ssh/id_rsa` on your local machine |

### Test Auto-Deploy

```bash
# On local machine - make any small change
echo "# test" >> README.md
git add .
git commit -m "Test CI/CD pipeline"
git push origin main

# Watch at:
# https://github.com/Chandu-theja/Dharsan_ecommerce/actions
# Should auto-deploy in ~5 minutes
```

---

## Third-Party Services Setup

### Razorpay (Payments)

1. Sign up: https://razorpay.com
2. Complete KYC (PAN + bank account)
3. Dashboard → Settings → API Keys → Generate Test Keys
4. Copy Key ID + Key Secret to `.env`
5. Test with card: `4111 1111 1111 1111`, any future date, any CVV

### Gmail SMTP (Order Emails — Free)

1. Enable 2-Factor Authentication on Gmail
2. Google Account → Security → App passwords
3. Select app: Mail → Generate
4. Copy 16-character password to `SMTP_PASSWORD` in `.env`

### Twilio WhatsApp (Order Notifications)

1. Sign up: https://www.twilio.com (free trial gives $15 credit)
2. Console → Messaging → Try WhatsApp Sandbox
3. Follow sandbox setup instructions
4. Copy Account SID + Auth Token to `.env`
5. For production: Apply for WhatsApp Business API approval

### Delhivery (Shipping)

1. Sign up as merchant: https://www.delhivery.com/merchant
2. Complete onboarding
3. API access → Generate token
4. Copy token to `DELHIVERY_API_TOKEN` in `.env`

---

## Admin Panel

Access: `http://YOUR_IP/admin` (or `https://yourdomain.com/admin`)

Default login:
```
Email:    admin@dharsandresses.com
Password: Admin@Dharsan2026!
```

**First login checklist:**
- [ ] Change admin password immediately
- [ ] Go to Settings → update phone number + GST number
- [ ] Add your first product with real photos
- [ ] Set up Razorpay live keys when ready to accept payments

---

## Useful Commands

```bash
# View all running containers
docker compose ps

# View app logs (live)
docker compose logs -f app

# View nginx logs
docker compose logs -f nginx

# Restart just one service
docker compose restart app
docker compose restart nginx

# Rebuild app after code changes
docker compose up -d --build app

# Open database shell
docker compose exec postgres psql -U dharsan -d dharsan_dresses

# Run database migrations
docker compose exec app npx prisma@5 migrate deploy

# Re-seed database
docker compose exec app npm run db:seed

# Check disk usage
docker system df

# Clean up unused Docker images
docker image prune -f

# Full clean (WARNING: removes all containers + volumes)
docker compose down -v
docker system prune -af
```

---

## Troubleshooting

### Site not loading on http://IP

```bash
# 1. Check all containers are running
docker compose ps

# 2. Check nginx is not crashing
docker compose logs nginx --tail=30

# 3. Check OS firewall
sudo firewall-cmd --list-ports
# Must show: 80/tcp 443/tcp

# 4. Check OCI Security List
# OCI Console → Networking → VCN → Security Lists
# Must have ingress rules for port 80 and 443

# 5. Check app is healthy
curl http://localhost:3000/api/health
```

### Docker build fails (OOM / Out of Memory)

```bash
# Add swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Retry build
docker compose up -d --build
```

### Database connection refused

```bash
# Check postgres is healthy
docker compose ps postgres
docker compose logs postgres --tail=20

# Verify DATABASE_URL in .env uses 'postgres' as host (not localhost)
grep DATABASE_URL .env
# Must be: postgresql://dharsan:PASSWORD@postgres:5432/dharsan_dresses
```

### Prisma version conflict (v5 vs v7)

```bash
# Always use pinned version inside container:
docker compose exec app npx prisma@5 db push
docker compose exec app npx prisma@5 migrate deploy
docker compose exec app npx prisma@5 studio

# Never use bare 'npx prisma' on the host — it pulls latest (v7) which is incompatible
```

### .env file corrupted

```bash
# Recreate from scratch
cp .env.example .env
nano .env
# Fill in your values manually

# Never pipe shell commands into .env
# Wrong:  echo "test" >> .env
# Wrong:  sed ... >> .env  (should be sed -i to edit in place)
```

### SSL cert not found (nginx crash)

```bash
# Check certs exist
ls -la nginx/ssl/
# Must show fullchain.pem and privkey.pem

# If missing, go back to HTTP-only config
cp nginx/nginx.ssl.conf nginx/nginx.ssl.conf.bak
# Restore HTTP config (see Testing Deployment section)
docker compose restart nginx
```

---

## Cost Summary

| Service | Cost | Notes |
|---------|------|-------|
| OCI E4.Flex 2 OCPU (testing) | ~$35/month | Paid from $300 trial credit |
| OCI A1.Flex 4 OCPU (production) | $0 forever | Always Free — claim when available |
| OCI Object Storage 10GB | $0 | Always Free |
| GitHub Actions | $0 | 2000 min/month free |
| Let's Encrypt SSL | $0 | Free, auto-renews every 90 days |
| Razorpay | 2% per transaction | No monthly fee |
| Gmail SMTP | $0 | 500 emails/day free |
| Twilio WhatsApp | ~₹0.50/msg | Free trial available |
| Domain (yearly) | ~₹600-1500 | One-time yearly renewal |

**Total monthly: ₹0** (after trial) + transaction fees only

---

*Built for Dharsan Dresses, Tirupati — Best Clothes · Best Stitch*
