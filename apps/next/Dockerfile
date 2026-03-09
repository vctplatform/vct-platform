# ═══════════════════════════════════════════════════════════════
# Next.js Frontend Dockerfile — Multi-stage build
# ═══════════════════════════════════════════════════════════════

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/next/package.json ./apps/next/
COPY packages/app/package.json ./packages/app/
RUN npm ci --ignore-scripts

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/next && npx next build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/next/.next/standalone ./
COPY --from=builder /app/apps/next/.next/static ./apps/next/.next/static
COPY --from=builder /app/apps/next/public ./apps/next/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/next/server.js"]
