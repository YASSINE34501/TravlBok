# TravlBok — Phase 2 Completion Report

**Scope:** Subscriptions, Payments, Affiliates, and Hotel PMS, per `MASTER-PLAN.md`.
**Status:** In progress — delivered as 4 sub-milestones, each with its own verification pass and commit. This report is appended to as each milestone lands.

---

## Milestone 1 — Subscriptions

### What was built
- **Schema**: `SubscriptionPlan` (tier, localized name/description, monthly/annual price, trial days, per-metric limits — properties/rooms-per-property/vehicles/branches/staff/monthly-bookings, 8 feature flags, archive flag), `Subscription` (one per `Organization`, status lifecycle `TRIALING → ACTIVE → PAST_DUE/GRACE_PERIOD → SUSPENDED/CANCELLED/EXPIRED`, billing interval, period dates, cancel-at-period-end), `UsageRecord` (append-only usage snapshot log for future reporting — never consulted for limit decisions, which always re-count live rows). `CouponScope` gained a `SUBSCRIPTION` value for future subscription coupon codes.
- **Limit enforcement**: a single shared helper, `src/domains/subscriptions/limits.ts` (`checkOrganizationLimit`, `hasFeature`), wired into every real creation choke point: `createHotelAction` (properties), `createVehicleAction` (vehicles), `createBranchAction` (branches), `createRoomAction` (rooms per property), and both `createHotelReservationAction`/`createCarReservationAction` (monthly bookings, checked inside the existing transaction). A suspended/expired subscription blocks regardless of numeric usage.
- **Staff**: no "invite a team member" action existed anywhere in the codebase before this milestone — added `src/domains/staff/actions.ts` (`inviteStaffMemberAction`/`removeStaffMemberAction`) as the `STAFF` limit's choke point, plus a real partner-dashboard screen (`dashboard/staff`) — not a placeholder, it lists current members and lets an owner invite an already-registered user by email into a hotel/car-rental staff role.
- **Lifecycle**: `registerAction` now auto-assigns the seeded FREE plan to every new hotel/car-rental/travel-agency organization inside its existing transaction. `src/domains/subscriptions/actions.ts` adds `changePlanAction` (blocks a downgrade that would immediately exceed the target plan's limits), `cancelSubscriptionAction` (soft cancel via `cancelAtPeriodEnd`), and `renewSubscriptionAction` (platform-staff only, for the future billing-cycle job Payments will drive).
- **Admin**: `admin/subscription-plans` (create/archive plans, full limit + feature-flag editor) and `admin/subscriptions` (list all orgs' subscriptions, manual assignment, suspend, an estimated-MRR summary card).
- **Partner**: `dashboard/subscription` shows the current plan/status/renewal date and lets an owner change plan/billing interval or cancel.
- **Seed data**: 5 real plans (Free/Starter/Professional/Business/Enterprise) with realistic limits and feature flags; the two demo organizations get Professional and Starter subscriptions respectively.

### Verification
- `npx tsc --noEmit`, `npx eslint .`, `npm run build` — all clean (`/admin/subscription-plans`, `/admin/subscriptions`, `/dashboard/subscription`, `/dashboard/staff` all compile as new routes).
- Live checks against a running dev server + real Supabase data: logged in as the seeded Super Admin and the demo hotel owner via the real credentials flow; confirmed `/admin/subscription-plans`, `/admin/subscriptions`, `/dashboard/subscription`, `/dashboard/staff` all return 200 with correct content (the partner subscription page genuinely shows "Professional" / "ACTIVE" for the demo org, sourced from the database, not a placeholder).
- Directly exercised the limit-check query logic (the same Prisma calls `checkOrganizationLimit` makes) against real seeded data: demo hotel org (Professional, `maxProperties: 10`) → `{allowed: true, current: 1}`; demo car-rental org (Starter, `maxVehicles: 5`) → `{allowed: true, current: 2}`; (Starter, `maxBranches: 2`) → `{allowed: true, current: 1}` — confirms the limit arithmetic and Prisma field mapping are correct against live rows.
- Interactive browser form-submission testing (inviting staff, changing plans through the UI, hitting a limit at the boundary and seeing it actually block) was not completed this pass — the Chrome browser automation tool was unavailable for the whole session (see Phase 1 remediation report, same limitation).

### Known limitations
- No billing/payment integration yet — plan changes and the FREE-plan assignment are free of charge; a paid plan's `monthlyPrice`/`annualPrice` isn't actually charged anywhere yet. That's exactly what the Payments milestone (next) wires in — `renewSubscriptionAction` and the `PAST_DUE`/grace-period/`SUSPENDED` flow are built and ready for it to drive.
- No scheduled job yet enforces `currentPeriodEnd` expiry or advances `PAST_DUE` → `SUSPENDED` after the grace window — that requires the Payments milestone's retry/cron infrastructure.
