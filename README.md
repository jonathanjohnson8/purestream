# PureStream

Proof-of-concept bulk water delivery marketplace (Instacart-style) built per
[`docs/architecture.md`](docs/architecture.md). Mobile-first Next.js web app with four
surfaces — Customer, Shopper/Distributor, Vendor, and Admin/Ops — backed by Supabase
(Postgres + Auth + Realtime + PostGIS) with real route optimization via Google Maps.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript) — mobile-first, single responsive web app
- **Tailwind CSS** — green Instacart-style design system
- **Supabase** — Postgres, Row-Level Security, Auth, Realtime, PostGIS
- **Google Maps** — geocoding + Directions route optimization + live tracking map
- Payments are **mocked** (Stripe test-mode stub) with an immutable ledger

## What's implemented

- **Customer:** browse vendors by area → catalog with live availability → cart →
  checkout (real pricing: subtotal, flat delivery fee, 8% service fee, bottle deposits,
  promo codes) → order tracking with live map, realtime substitution approval, realtime
  chat, proof of delivery, receipt, and bottle-credit history.
- **Shopper/Distributor:** activate account, accept jobs, shop with report-unavailable /
  suggest-substitution, status transitions, simulated live GPS, photo+signature proof of
  delivery, empty-bottle pickup credits, earnings/payouts.
- **Vendor:** dashboard metrics, incoming order confirm/reject, catalog price editing and
  availability/stockout toggles, low-stock view, payouts.
- **Admin/Ops:** platform metrics, all-orders view with refunds, and **dispatch** with
  real multi-stop route optimization (Google Directions, nearest-neighbor fallback).
- **Backend:** 24-table schema, full RLS, Realtime on orders/chat/substitutions/location,
  immutable ledger entries for every money movement, bottle-deposit transactions.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://suvugebtfibtibwpelkz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...        # already set
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=                        # your key (Maps JS + Geocoding + Directions)
```

The app runs fully without the Google Maps key — the map shows a styled placeholder and
routing falls back to a nearest-neighbor solver. Add the key to enable the live map and
Google Directions optimization.

## Run locally

```bash
npm install
npm run dev
# http://localhost:3000
```

## Deploy to Vercel

This repo is a standard Next.js app and deploys to Vercel with zero config.

**Option A — CLI (from your machine):**
```bash
npm i -g vercel
vercel            # link/create the project
vercel --prod     # production deploy
```
Set the env vars above in the Vercel dashboard (Project → Settings → Environment Variables)
or when prompted by the CLI.

**Option B — GitHub:** push this folder to a GitHub repo, then "Import Project" in Vercel
and add the same environment variables.

> Note: the build was authored and statically reviewed in a sandbox without npm/registry
> access, so `next build` runs on Vercel (or your machine) rather than here.

## Demo accounts

Email confirmation is off for the POC, so just sign up. Suggested logins (password
`purestream`):

| Role     | Email                     | How to enter the surface |
|----------|---------------------------|--------------------------|
| Customer | customer@purestream.app   | Default after signup → `/shop` |
| Shopper  | shopper@purestream.app    | Visit `/shopper` → "Activate shopper account" |
| Vendor   | vendor@purestream.app     | Visit `/vendor` → "Manage AquaPure Springs" |
| Admin    | admin@purestream.app      | Visit `/admin` → "Enable admin access" |

(The in-app activation buttons grant the corresponding role. To pre-assign roles by email
instead, see `docs/seed_roles.sql`.)

## Demo flow

1. **Customer** signs up, orders water from AquaPure Springs, checks out.
2. **Vendor** confirms the order.
3. **Shopper** accepts the job, marks unavailable / suggests a substitution.
4. **Customer** approves the substitution in realtime, chats with the shopper.
5. **Shopper** picks up, simulates driving (live map updates), completes delivery with
   proof + records bottle pickup (customer gets credit).
6. **Admin** sees GMV/activity, can batch-optimize routes and issue refunds.
