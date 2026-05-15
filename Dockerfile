# ─── Stage 1: Dependencies ────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl openssl-dev
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps --no-audit --no-fund
RUN npx prisma generate

# ─── Stage 2: Builder ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder
# OpenSSL + libc6-compat are needed by Prisma's query/schema engines at runtime.
# This stage is also used as the db-init container, so it must be able to run
# `prisma db push` and `tsx prisma/seed.ts`.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time env vars for Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the app
RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Runner (minimal production image) ───────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Add a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install dumb-init for clean signal handling and openssl
RUN apk add --no-cache dumb-init openssl openssl-dev

# Copy public assets
COPY --from=builder /app/public ./public

# Copy Next.js standalone output (much smaller than full node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma client (needed at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Use dumb-init to handle PID 1 signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
