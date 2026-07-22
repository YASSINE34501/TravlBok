# TravlBok — Phase 1 Remediation Report

**Scope:** Post-completion audit of Phase 1 against `MASTER-PLAN.md`, and fixes for every confirmed gap, before starting Phase 2.
**Status:** Complete. Type-checks, lints, and production-builds clean. New/changed routes verified via authenticated HTTP requests (see §4) — full interactive browser testing was not available this pass (browser automation tooling was disconnected mid-session).

---

## 1. Audit findings and fixes

A fresh static-code audit (independent of `PHASE-1-COMPLETION-REPORT.md`) found 7 real gaps. All are now fixed:

1. **Booking invoice never displayed Commission, and had hardcoded English labels.** Fixed in `src/app/[locale]/(marketing)/bookings/[reservationId]/page.tsx` — added a Commission row (all 7 required fields — Original price, Currency, Taxes, Fees, Discount, Commission, Final total — now render), and replaced hardcoded `"Check-in"/"Check-out"/"Pickup"/"Return"/"Pickup location"` with translated labels (the `Search` namespace already had matching keys in all 3 locales).

2. **Hotel search was missing Check-in/out availability filtering, Rooms, Rating, and Payment-options filters.** Added a shared read-only availability helper (`src/domains/hotels/availability.ts`) mirroring the transactional booking-time overlap check, wired into `searchHotels`. Added `rooms`/`minRating`/`paymentOptions` params, UI controls in `HotelFilters`, and a Rooms input in the homepage hero search. New `Hotel.acceptsPayAtProperty`/`acceptsOnlinePayment` boolean fields (migration `20260722161903_phase1_remediation_hotel_payment_options`) let partners declare accepted payment methods, exposed in the partner hotel form.

3. **Car search was missing a Drop-off location field, date-based availability filtering, and Insurance/Delivery filters; Brand filter was dead code.** Added `src/domains/vehicles/availability.ts`, wired `pickupAt`/`returnAt` into `searchVehicles`, added a drop-off location field to the hero search, and Brand/Insurance/Delivery-option controls to `VehicleFilters`.

4. **No Super Admin UI existed for Countries, Cities, Categories, Cancellation Policies, Commission Rules, or Homepage Sections** (only reachable via `prisma/seed.ts` or Prisma Studio). Added all 6 as new admin screens (`src/app/[locale]/(admin)/admin/{countries,cities,categories,cancellation-policies,commission-rules,homepage-sections}`) with matching server actions in `src/domains/admin/actions.ts`, following the existing amenities-screen pattern (Server Component page + Client Component form, `requireRole`, `logAudit`, `revalidatePath`). Linked from the admin sidebar.

5. **Hardcoded English strings** in `vehicle-filters.tsx` (transmission/fuel option labels — now translated via a new `VehicleAttributes` message namespace) and `room-availability-manager.tsx` (fully translated for consistency, using new `Partner` namespace keys).

6. **Language switcher never persisted a signed-in user's locale choice.** Added `setUserLocaleAction` (`src/lib/i18n/actions.ts`), called from `LanguageSwitcher` alongside the existing URL-locale change. Takes effect on the user's next login (by design — no session-update round-trip added).

7. **Super Admin's "default locale" setting had no effect anywhere.** Added a Node-runtime API route (`src/app/api/settings/default-locale/route.ts`, since `@prisma/adapter-pg` can't run on the Edge runtime `src/proxy.ts` executes in) and special-cased bare `/` requests with no locale cookie to redirect using the configured default; all other routing is untouched.

## 2. Database

- New migration: `20260722161903_phase1_remediation_hotel_payment_options` — adds `Hotel.acceptsPayAtProperty` / `Hotel.acceptsOnlinePayment` (both `Boolean @default(true)`, backward-compatible for existing rows).
- No other schema changes — Countries/Cities/Categories/CancellationPolicy/CommissionRule/HomepageSection models already existed from Phase 1.

## 3. Known limitations carried forward

- `minRating` and (when `sort=rating`) result ordering are applied in JS after the DB page/count query, same pre-existing limitation as Phase 1's rating sort — pagination totals are approximate when these are combined with a partial last page.
- Live interactive browser testing (form submissions, checkbox toggles, end-to-end create/edit flows on the new admin screens) was not completed this pass — the Chrome browser automation tool disconnected mid-session. All new/changed pages were instead verified via authenticated HTTP requests confirming 200 responses with correct page content (no server errors), and all server actions reuse the exact pattern already exercised end-to-end in Phase 1 (`requireRole` + `prisma.create` + `logAudit` + `revalidatePath`).

## 4. Test results

- `npx tsc --noEmit` — clean.
- `npx eslint .` — clean.
- `npm run build` — succeeds, all routes compiled (including 7 new admin routes and the new `/api/settings/default-locale` route).
- Authenticated HTTP checks (Super Admin session via the real credentials flow): `/admin/countries`, `/admin/cities`, `/admin/categories`, `/admin/cancellation-policies`, `/admin/commission-rules`, `/admin/homepage-sections` all return 200 with correct headings. `/hotels` and `/cars` search pages return 200 with the new filter query parameters applied.

## 5. Next step

Phase 2 (Subscriptions, Payments, Affiliates, Hotel PMS) begins next, delivered as 4 sub-milestones per the implementation plan, each with its own verification pass and commit.
