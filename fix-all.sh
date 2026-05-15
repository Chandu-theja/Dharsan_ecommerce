#!/bin/bash
# Run this from inside ~/Downloads/dharsan-dresses
# Applies all build fixes in one shot

set -e
echo "🔧 Applying all fixes to Dharsan Dresses..."

# ── Fix 1: Prisma binary targets (Alpine OpenSSL) ──────────────────────────
sed -i 's/provider = "prisma-client-js"/provider      = "prisma-client-js"\n  binaryTargets = ["native", "linux-musl", "linux-musl-openssl-3.0.x"]/' prisma/schema.prisma
echo "✓ Fixed prisma/schema.prisma"

# ── Fix 2: Dockerfile - openssl-dev + npm install ─────────────────────────
sed -i 's/apk add --no-cache libc6-compat openssl$/apk add --no-cache libc6-compat openssl openssl-dev/' Dockerfile
sed -i 's/RUN npm ci --no-audit --no-fund/RUN npm install --legacy-peer-deps --no-audit --no-fund/' Dockerfile
sed -i 's/apk add --no-cache dumb-init openssl$/apk add --no-cache dumb-init openssl openssl-dev/' Dockerfile
echo "✓ Fixed Dockerfile"

# ── Fix 3: products API - dynamic export ──────────────────────────────────
sed -i "s/import { Prisma } from '@prisma\/client';/import { Prisma } from '@prisma\/client';\n\nexport const dynamic = 'force-dynamic';/" src/app/api/products/route.ts
echo "✓ Fixed src/app/api/products/route.ts"

# ── Fix 4: variants null→undefined in products page ──────────────────────
sed -i 's/variants: p\.variants,/variants: p.variants.map((v) => ({ ...v, size: v.size ?? undefined })),/g' src/app/\(shop\)/products/page.tsx
echo "✓ Fixed src/app/(shop)/products/page.tsx"

# ── Fix 5: variants null→undefined in FeaturedProducts ───────────────────
sed -i 's/variants: p\.variants,/variants: p.variants.map((v) => ({ ...v, size: v.size ?? undefined })),/g' src/components/home/FeaturedProducts.tsx
echo "✓ Fixed src/components/home/FeaturedProducts.tsx"

# ── Fix 6: docker-compose remove obsolete version ─────────────────────────
sed -i '/^version:/d' docker-compose.yml
echo "✓ Fixed docker-compose.yml"

echo ""
echo "✅ All fixes applied!"
echo ""
echo "Next steps:"
echo "  git add -A"
echo "  git commit -m 'Fix: Prisma OpenSSL, Suspense boundaries, dynamic routes'"
echo "  git push origin main"

# ── Fix 7: Replace ts-node with tsx for seed script ───────────────────────
sed -i "s/ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma\/seed.ts/tsx prisma\/seed.ts/" package.json
# Add tsx to devDependencies if not already there
grep -q '"tsx"' package.json || sed -i 's/"ts-node": "\^10.9.2",/"ts-node": "^10.9.2",\n    "tsx": "^4.7.0",/' package.json
echo "✓ Fixed package.json seed script (ts-node → tsx)"
