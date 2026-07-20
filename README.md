# TravlBok

A travel marketplace and partner management SaaS platform — hotels, car rentals, travel agencies, affiliates, and a Super Admin platform, in Arabic (RTL), French, and English, with MAD/EUR/USD currency support.

This repository is being built in 3 phases per `MASTER-PLAN.md`. **Phase 1** (core marketplace + partner onboarding) is implemented — see `PHASE-1-COMPLETION-REPORT.md` for full details.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- PostgreSQL via Prisma 7 (`@prisma/adapter-pg`)
- Tailwind CSS v4, shadcn/ui (Base UI primitives)
- Auth.js v5 (credentials + RBAC)
- next-intl (ar/fr/en, RTL)
- Zod, React Hook Form
- Resend (email), S3-compatible or local-disk file storage

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables** — copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a PostgreSQL connection string (e.g. from [Neon](https://neon.tech) or [Supabase](https://supabase.com))
   - `AUTH_SECRET` — generate with `npx auth secret` or any random 32-byte base64 string
   - `RESEND_API_KEY` / `EMAIL_FROM` — optional; without a key, emails are logged to the console instead of sent
   - `STORAGE_*` — optional; without S3 credentials, uploaded files are stored locally under `public/uploads`

3. **Run database migrations and seed data**

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

   This creates the schema and seeds reference data (countries/cities, amenities, categories, cancellation policy, CMS pages, exchange rates), a Super Admin account, and two demo partner accounts with a published hotel and two published vehicles. Credentials are printed to the console during seeding (see `prisma/seed.ts`).

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000/en](http://localhost:3000/en) (or `/fr`, `/ar`).

## Scripts

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check
- `npx prisma studio` — browse the database
- `npx prisma migrate dev` — create/apply migrations
- `npx prisma db seed` — re-run the seed script

## Project structure

- `src/app/[locale]/(marketing)` — public marketplace (search, listings, booking, CMS pages)
- `src/app/[locale]/(auth)` — login/register/password reset/email verification
- `src/app/[locale]/(partner)/dashboard` — hotel & car rental partner portal
- `src/app/[locale]/(admin)/admin` — Super Admin platform
- `src/domains/*` — server actions and query functions, grouped by business domain
- `src/lib/*` — shared infrastructure (auth, RBAC, currency, storage, validation)
- `messages/*.json` — translation files (en/fr/ar)
- `prisma/schema.prisma` — database schema; `prisma/seed.ts` — seed data
