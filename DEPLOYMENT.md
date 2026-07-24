# TravlBok — Deployment, Operations & Scale

This is the Phase 3 "Performance and Scalability" deliverable per `MASTER-PLAN.md`: Docker, health checks,
backup/deployment procedure, CI, and the architecture decisions made to prepare the app for scale.
For local development setup, see `README.md`.

## Docker

### Build and run the image directly

```bash
docker build -t travlbok .
docker run -p 3000:3000 --env-file .env travlbok
```

The `Dockerfile` is a 3-stage build (`deps` → `builder` → `runner`) producing a minimal image from
Next.js's `output: "standalone"` trace (set in `next.config.ts`) — the runtime image contains only the
files `next build` determined are actually needed, not a full `node_modules` copy. It runs as a
non-root `nextjs` user and declares a `HEALTHCHECK` against `/api/health`.

### Full local stack with Docker Compose

```bash
docker compose up --build
```

`docker-compose.yml` runs the app alongside a local Postgres 16 container (`db`, with a health-checked
`pg_isready` gate before the app starts) — useful for a fully offline/local dev loop. Point
`DATABASE_URL`/`DIRECT_URL` in `.env` at your real Postgres provider (Supabase/Neon) instead, and run
`docker compose up web` alone, if you'd rather keep using a cloud database with a containerized app
(this is how the app was actually developed and verified during Phase 2/3 — see "Database" below).

**Not verified by execution in this environment**: no Docker daemon is available in this development
sandbox (`docker --version` fails here). The `Dockerfile`/`docker-compose.yml` are written correctly
against the documented Next.js 16 standalone-output contract and this project's actual dependencies,
but have not been build-tested end-to-end here — verify with a real `docker build`/`docker compose up`
before relying on them in production.

## Environment variables

See `.env.example` for the full list with inline documentation. Required for a working deployment:
`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`. Everything else
(`RESEND_API_KEY`, `STORAGE_*`, `STRIPE_*`, `PAYPAL_*`, `CRON_SECRET`,
`CHANNEL_CREDENTIALS_ENCRYPTION_KEY`) has a documented, safe fallback for development (emails log to
the console, files save to local disk, payments run in sandbox mode) but **must** be set in production —
none of those fallbacks are appropriate for real traffic or real money movement.

## Health check

`GET /api/health` runs a real `SELECT 1` against the database (not just "the process is alive") and
returns:

```json
{ "status": "ok", "uptimeSeconds": 1234, "timestamp": "...", "database": "connected", "responseTimeMs": 4 }
```

Returns HTTP 503 with `"status": "error"` if the database is unreachable. Point a load balancer's
health check, an orchestrator's liveness/readiness probe, or an uptime monitor (Pingdom/UptimeRobot/
Better Uptime) at this route.

## Database: migrations, backups, and restore

**Migrations** — Prisma manages schema changes as tracked SQL files under `prisma/migrations/`:

```bash
npx prisma migrate dev --name <description>   # local development — creates + applies a migration
npm run db:migrate                             # production/CI — applies pending migrations, no prompts
```

Both `DATABASE_URL` (pooled, used by the running app) and `DIRECT_URL` (direct/session connection,
used by Prisma Migrate — see `prisma.config.ts`) must be set; if your provider has no connection
pooler, set both to the same value.

**Backups** — this app runs against managed Postgres (Neon/Supabase during development), both of
which take automatic daily backups with point-in-time recovery on paid tiers — confirm your plan's
retention window and PITR availability with your provider first; don't assume it's enabled by default
on a free tier. For a self-hosted Postgres (e.g. the `db` service in `docker-compose.yml`, or any other
self-managed instance), take your own logical backups on a schedule:

```bash
# Backup (run against DIRECT_URL, not the pooled connection)
pg_dump "$DIRECT_URL" -Fc -f "travlbok-$(date +%Y%m%d-%H%M%S).dump"

# Restore into a fresh/empty database
pg_restore --clean --if-exists -d "$DIRECT_URL" travlbok-20260101-120000.dump
```

Store dumps encrypted, off-box (S3/equivalent — the same object storage already configured via
`STORAGE_*` for uploads is a reasonable place, in a separate private bucket/prefix from user uploads).
Test the restore procedure periodically — an untested backup is not a backup.

**Disaster recovery** — because the app is stateless (see "Horizontal scaling" below), recovering a
lost application server just means redeploying the container; the only state that must be recovered is
the database and object storage. Keep the database backup/restore procedure above tested and keep
object storage on a provider with its own durability guarantees (S3, R2, Supabase Storage) rather than
the local-disk fallback, which has none.

## Background jobs / scheduled tasks

There is no in-app job queue (no Redis/BullMQ standing infrastructure) — this is a deliberate scope
boundary carried consistently across Phase 3 (Channel Manager sync, payment retries, and booking
reminders all follow the same pattern). Instead, these routes are meant to be invoked periodically by
an external scheduler (a real cron job, a Vercel Cron Job, GitHub Actions on a schedule, etc.), each
guarded by the shared `CRON_SECRET` header (`x-cron-secret`):

| Route | Purpose | Suggested interval |
|---|---|---|
| `POST /api/cron/retry-failed-payments` | Retries FAILED payments with exponential backoff | Every 15–30 min |
| `POST /api/cron/channel-auto-sync` | Pushes availability/rates and pulls reservations for channels with `autoSyncEnabled` | Hourly |
| `POST /api/cron/booking-reminders` | Check-in/pickup reminders for tomorrow's bookings | Once daily |

## Preparing for scale

MASTER-PLAN asks this phase to *prepare for* thousands of partners and millions of bookings — the
items below describe what's actually in place today versus what remains future work, honestly:

- **Stateless application tier** (horizontal scaling): sessions are JWT-based (no server-side session
  store to keep in sync across instances — see `PHASE-3-COMPLETION-REPORT.md`'s Security milestone for
  why), uploaded files go to S3-compatible object storage when `STORAGE_*` is configured (the
  local-disk fallback is dev-only and does *not* work across multiple instances/containers), and there
  is no in-memory state that would break under multiple running instances behind a load balancer.
- **DB indexing**: every foreign key and every hot filter path (`organizationId`, `status`, date
  ranges) has a matching index (see `prisma/schema.prisma`); Phase 3's Advanced Analytics milestone
  added targeted composite indexes (`Reservation(organizationId, createdAt)`,
  `Reservation(hotelId, status, checkInDate)`, `Payment(createdAt)`) for its own query patterns.
- **Rate limiting**: `src/lib/rate-limit.ts` is deliberately Postgres-backed today (see Security
  milestone) rather than Redis, with a single call site to swap out when a real cache layer is
  introduced — "Redis-ready" describes this codebase's actual current state, not a live Redis instance.
- **CDN / image optimization**: `next.config.ts already` accepts any HTTPS image host
  (`images.remotePatterns`), but **the app does not yet use the `next/image` component anywhere** — it
  renders uploaded photos with plain `<img>` tags. Retrofitting `next/image` across every hotel/vehicle/
  avatar image usage is a real, sizeable follow-up task (not done in this pass — see Known Limitations
  below) that would unlock automatic resizing/format negotiation/lazy-loading once undertaken. A CDN in
  front of the app (Cloudflare, Vercel's own edge network, or a reverse-proxy cache) is standard and
  orthogonal to this — nothing here blocks adding one.
- **Search indexing**: hotel/car search currently queries Postgres directly (indexed columns, no full-text/
  fuzzy search engine). A dedicated search index (Postgres full-text search to start, or
  Elasticsearch/Meilisearch/Algolia at larger scale) is future work once listing volume or query
  complexity (typo-tolerant destination search, relevance ranking) justifies it.
- **Read replicas**: not configured — `src/lib/db.ts`'s single `PrismaClient` would need a second,
  read-only connection routed to a replica, with read-only queries (search, analytics, reports)
  directed there. Straightforward to add once a replica exists; premature before then.
- **Monitoring**: no APM/error-tracking service (Sentry, Datadog, etc.) is wired in — doing so requires
  a real account/API key this environment doesn't have. `src/lib/audit.ts`'s `AuditLog` and the
  structured `console.error` calls throughout the codebase (e.g. dynamic pricing, notifications, sync
  failures) are the current substitute; wiring a real APM provider means adding its SDK and forwarding
  those same error paths to it, not restructuring how errors are already being surfaced.

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main`:
- `lint-and-typecheck` — ESLint + `tsc --noEmit`, no external dependencies needed, always runs.
- `build` — needs `DATABASE_URL`/`DIRECT_URL` as repository secrets (several pages read reference data at build time for static generation).
- `test` — runs the Vitest unit + integration suite; the integration tests hit the real database in `DATABASE_URL`, same as `build`.
- `e2e` — Playwright critical-flow tests, `workflow_dispatch`-only (not on every push): it needs a running app server plus Playwright's Chromium binary, and shares the same registration rate limiter (Security milestone) as real users, so running it on every push would eventually trip that limiter in CI.

Until `DATABASE_URL`/`DIRECT_URL`/`AUTH_SECRET` are added as GitHub repository secrets, the `build`,
`test`, and `e2e` jobs will fail in CI even though they all succeed locally against the real `.env`.
This is intentional "CI-ready" scaffolding per MASTER-PLAN's phrasing: the workflows are correct and
will go green as soon as the secrets exist, the same way the cron routes are real, ready infrastructure
waiting on an external scheduler to actually call them.
