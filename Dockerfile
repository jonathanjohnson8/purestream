# syntax=docker/dockerfile:1

# PureStream — Next.js 15 (App Router, TypeScript) on Cloud Run.
# Multi-stage build using Next.js "standalone" output for a small runtime image.

# ---------- 1. Install dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app
# libc compatibility for some native deps on alpine
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# ---------- 2. Build ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so they
# must be present during `next build`. Defaults point at the PureStream Supabase
# project (publishable keys, safe to embed). Override with --build-arg if needed.
ARG NEXT_PUBLIC_SUPABASE_URL=https://suvugebtfibtibwpelkz.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_BbUBGMlzcPFXDx1Mzrz1Tw_fpPXbHPN
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------- 3. Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Cloud Run sends traffic to $PORT (defaults to 8080); Next standalone reads it.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Run as a non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Static assets and the standalone server output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]
