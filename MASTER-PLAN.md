# MASTER-PLAN: TravlBok

Build a production-ready, scalable travel marketplace and partner management SaaS platform called **TravlBok**.

TravlBok must combine:
* A public travel booking marketplace
* A hotel partner portal
* A car rental company portal
* A travel agency portal
* An affiliate program
* A hotel Property Management System (PMS)
* A subscription-based SaaS business model
* A Channel Manager
* A Dynamic Pricing Engine
* A centralized Super Admin platform

**Important Execution Rule:** The platform must be developed in exactly **3 phases**. Do not attempt to build the entire platform at once.

At the end of every phase:
1. Run the application.
2. Fix TypeScript, lint, build, and runtime errors.
3. Test all implemented workflows.
4. Update the database migrations.
5. Update the project documentation.
6. Create a clear completion report.

> **Note:** Do not start the next phase until the current phase is stable.

---

## PROJECT NAME
**TravlBok**
* **Domain:** travlbok.com

---

## CORE TECHNOLOGY
Use:
* Next.js with App Router
* React
* TypeScript
* Node.js
* PostgreSQL
* Prisma ORM
* Tailwind CSS
* Shadcn UI
* Zod validation
* React Hook Form
* Secure server-side authentication
* Role-Based Access Control
* REST API or secure server actions
* Docker support
* Background jobs
* Redis-ready architecture
* Object storage for images and documents
* Automated database migrations
* Logging and error monitoring
* Responsive web design

**Architecture:** Use a modular monolith architecture that can later be divided into microservices if needed. 

Organize the code into clear domains:
* Authentication
* Users
* Partners
* Hotels
* Rooms
* Availability
* Reservations
* Vehicles
* Car Rentals
* Affiliates
* Subscriptions
* Payments
* Commissions
* PMS
* Channel Manager
* Dynamic Pricing
* Reviews
* Notifications
* Admin
* CMS
* Reports
* Localization
* Currencies

---

## LANGUAGES
The entire platform must support:
* **Arabic** (ar) - *Must use RTL layout*
* **French** (fr) - *Must use LTR layout*
* **English** (en) - *Must use LTR layout*

**Requirements:**
* Add a language switcher in the public website and all dashboards.
* Store translations in structured locale files. Do not hardcode interface text.
* All navigation, forms, notifications, validation messages, and system statuses must be translated.
* Partners must be able to enter property descriptions in Arabic, French, and English.
* Content must gracefully fall back to another available language when a translation is missing.
* Save the preferred language for every user.
* Super Admin must be able to define the default language.

---

## SUPPORTED CURRENCIES
Support these currencies:
* **Moroccan Dirham:** MAD *(Default currency)*
* **Euro:** EUR
* **United States Dollar:** USD

**Requirements:**
* Customers can switch currency.
* Partners can define their base currency.
* Store financial amounts using safe decimal values. Do not store money using floating-point values.
* Store the original transaction currency and converted amount.
* Add exchange-rate management (allow automatic and manual exchange rates).
* Super Admin can update exchange rates.
* Display currency symbols correctly.
* Save exchange-rate history.

**Booking invoices must display:**
* Original price
* Currency
* Taxes
* Fees
* Discount
* Commission
* Final total

---

## USER ROLES
Create these roles:
* Super Admin
* Admin
* Hotel Owner
* Hotel Manager
* Receptionist
* Housekeeping Staff
* Hotel Accountant
* Car Rental Company Owner
* Car Rental Staff
* Travel Agency
* Tour and Activity Provider
* Affiliate Partner
* Customer
* Support Agent

**Requirements:** 
* Use strict Role-Based Access Control.
* Each partner must only access their own organization and data.
* Support multi-tenant data isolation.

---

## PHASE 1 — CORE MARKETPLACE AND PARTNER ONBOARDING

**Goal:** Build a stable MVP where hotels and car rental companies can register, submit their businesses, manage listings, and publish approved offers on the public TravlBok marketplace.

### Foundation
Create:
* Project architecture
* Database schema
* Authentication & Authorization
* Multi-tenant organization structure
* Internationalization
* Currency system
* Responsive design system
* Reusable components
* Error handling
* Audit logs
* File upload system
* Email verification
* Password reset
* Secure session management

### Public Website
Create a premium travel marketplace inspired by modern travel platforms, without copying any protected visual identity.

**Pages:**
* Homepage
* Hotels search & Hotel details
* Car rental search & Car details
* Destinations
* Deals
* Affiliate program
* Become a partner
* About, Contact, FAQ
* Terms and Conditions, Privacy Policy
* Login & Registration

**Homepage sections:**
Main travel search, Hotels, Car rentals, Popular destinations, Featured hotels, Featured vehicles, Special offers, Last-minute deals, Partner registration, Affiliate registration, Reviews, Newsletter, Mobile application promotion.

**Search filters for hotels:**
Destination, Check-in, Check-out, Guests, Rooms, Price range, Stars, Rating, Amenities, Property type, Breakfast included, Free cancellation, Payment options.

**Search filters for cars:**
Pickup location, Drop-off location, Pickup date, Return date, Category, Brand, Transmission, Fuel, Seats, Price, Unlimited mileage, Insurance, Delivery option.

### Hotel Owner Onboarding
**Hotel owners can:**
* Create an account and organization
* Submit legal and business information
* Upload verification documents
* Add one or multiple properties
* Save onboarding progress
* Submit a property for approval

**Hotel information to collect:**
Hotel name, Legal company name, Registration number, Tax information, Address, Country, City, Map coordinates, Phone, Email, Website, Description (AR/FR/EN), Hotel type, Star rating, Check-in/Check-out times, Amenities, Policies (Cancellation, Children, Pet), Parking, Breakfast, Restaurant, Swimming pool, Spa, Gym, Wi-Fi, Airport shuttle, Nearby attractions, Main image, Photo gallery, Videos, Legal documents.

**Property statuses:**
Draft, Pending Review, Changes Requested, Approved, Rejected, Suspended, Published, Unpublished. *(Only approved properties can appear publicly).*

### Room Management
**Room fields:**
Room name, Room type, Description (AR/FR/EN), Photos, Videos, Maximum guests, Adults, Children, Bed types, Number of beds, Bathrooms, Room size, Amenities, Smoking policy, Accessibility, Breakfast included, Refundable, Non-refundable, Base price, Weekend price, Taxes, Cleaning fee, Available quantity, Minimum stay, Maximum stay, Instant booking, Availability calendar, Blackout dates, Seasonal pricing periods. *(Prevent unavailable rooms from being booked).*

### Car Rental Company Portal
**Car rental companies can:**
* Create an organization
* Register company details and upload legal documents
* Create branches and add office locations
* Add vehicles and manage availability
* Submit the company for approval

**Vehicle fields:**
Brand, Model, Year, Color, Category, Fuel, Transmission, Seats, Doors, Engine, Registration reference, Main image, Image gallery, Video, Description (AR/FR/EN), Price per day, Deposit, Insurance options, Mileage policy, Fuel policy, Driver option, GPS, Child seat, Airport delivery, Pickup/Return locations, Availability calendar, Maintenance status.

**Vehicle statuses:**
Available, Reserved, Rented, Maintenance, Inactive.

### Booking System
Create booking workflows for Hotels and Car rentals.

**Booking statuses:**
Draft, Pending, Confirmed, Cancelled, Completed, No-show, Refunded, Partially Refunded.

**Customer features:**
Search, View details, Select dates/rooms/cars, Enter traveler details, Apply coupon, View price breakdown, Confirm booking, Receive confirmation, View booking history, Cancel (when permitted), Download invoice.

**Partner features:**
View bookings, Accept/Confirm (if manual), Cancel (based on permissions), Add internal notes, Contact customer, Export bookings, Filter by status/date.

### Super Admin
**Dashboard must include:**
Total users, Total partners, Hotels, Rooms, Vehicles, Reservations, Revenue, Commissions, Pending approvals, Suspended accounts, Latest activities, Charts and reports.

**Super Admin can manage:**
Approvals/Rejections, Change requests, Suspensions, Publishing/Unpublishing, Users, Roles, Countries, Cities, Currencies, Exchange rates, Amenities, Categories, Cancellation policies, Commissions, Coupons, Homepage sections, CMS pages, Reviews, Audit logs, Global settings.

### Phase 1 Acceptance Criteria
Phase 1 is complete only when:
- [ ] Users can register and log in.
- [ ] AR, FR, EN work correctly (RTL for Arabic).
- [ ] MAD, EUR, USD display correctly.
- [ ] Hotel owners can register properties and add rooms.
- [ ] Car companies can register and add vehicles.
- [ ] Super Admin can approve/reject partners.
- [ ] Approved listings appear publicly.
- [ ] Customers can search and create reservations (availability prevents duplicate bookings).
- [ ] Role permissions are enforced.
- [ ] Forms are validated, database migrations work, production build succeeds.

---

## PHASE 2 — SUBSCRIPTIONS, AFFILIATES, PAYMENTS AND PMS

**Goal:** Transform TravlBok into a commercial SaaS platform with partner subscriptions, affiliate commissions, online payments, and a complete hotel Property Management System.

### Subscription System
**Plans:** Free, Starter, Professional, Business, Enterprise.

**Plan definitions:**
Limits on properties, rooms, vehicles, branches, staff, storage, monthly bookings. Access controls for Analytics, PMS, Channel Manager, Dynamic Pricing, APIs, Affiliate tools, Priority support, Custom commission rates.

**Features:**
Monthly/Annual billing, Free trial, Coupon codes, Upgrade/Downgrade, Cancellation, Renewal, Grace period, Failed payment handling, Suspension, Invoices, Payment history, Usage tracking, Plan limit enforcement.

**Super Admin controls:**
Create/Edit/Archive plans, Assign manually, Add custom plans, Configure trials/limits/commissions, View recurring revenue and subscription statuses.

### Payment System
Design a payment abstraction supporting:
* Stripe
* PayPal
* Bank transfer
* Manual payment
* Cash at property
* Local Moroccan payment gateway integration (later)
*(Do not tightly couple to one provider).*

**Payment statuses:**
Pending, Authorized, Paid, Failed, Cancelled, Refunded, Partially Refunded.

**Create:** Payment/Refund records, Invoices, Credit notes, Transaction history, Webhook logs, Failed payment retries.

### Affiliate Program
**Affiliates can:** Register, submit identity/payment info, receive referral link, generate campaign links/QR codes, view stats (clicks, conversions, confirmed bookings, pending/approved commissions), request withdrawals, download promo materials.

**Track:** Affiliate, Campaign, Referral source, Click, Session, Booking, Conversion, Commission, Currency, Payout status.

**Commission statuses:** Pending, Approved, Rejected, Paid, Cancelled.

**Protections:** Duplicate commissions, Self-referral, Fraudulent clicks, Cancelled/Refunded booking commissions.

**Super Admin controls:** Percentage/Fixed commissions, Commissions by partner/service type, Minimum withdrawal, Holding period, Payout methods.

### Hotel Property Management System (PMS)
**Modules:**
Front Desk, Reservation Calendar, Check-in, Check-out, Walk-in reservations, Room assignment, Guest profiles, Guest history, Payments, Invoices, Housekeeping, Maintenance, Internal tasks, Staff management, Shift management, Guest requests, Internal notes, Lost and found, Night audit, Reports.

**Room operational statuses:**
Available, Reserved, Occupied, Dirty, Cleaning, Inspected, Ready, Out of Service, Maintenance.

**Front desk dashboard:** Arrivals, Departures, Current guests, Room statuses, Pending payments, Late check-outs, No-shows, Walk-ins.

**Workflows:**
* **Check-in:** Select reservation, Verify guest, Add ID ref, Confirm payment, Assign room, Add deposit, Add notes, Mark checked in.
* **Check-out:** Review charges, Add extra services, Apply discount, Record payment, Generate invoice, Mark room dirty, Create housekeeping task.

### Housekeeping
**Housekeeping staff can:** View assigned rooms, Start cleaning, Mark completed, Report maintenance issues, Add notes/photos, Request inspection, Mark room ready.
**Supervisors can:** Assign tasks, Set priority, Inspect rooms, Reopen tasks, Monitor completion time.

### PMS Reporting
**Reports for:** Occupancy, ADR, RevPAR, Arrivals, Departures, No-shows, Cancellations, Payments, Outstanding balances, Room status, Housekeeping performance, Revenue by room type / booking source. 
*Exports to PDF, Excel, CSV.*

### Phase 2 Acceptance Criteria
Phase 2 is complete only when:
- [ ] Subscription plans work and limits are enforced (upgrades/downgrades function).
- [ ] Payment records and invoices work.
- [ ] Affiliate tracking works and commissions are calculated correctly (withdrawals function).
- [ ] Hotel staff roles work.
- [ ] PMS reservations are connected to marketplace bookings.
- [ ] Check-in/Check-out workflows and Housekeeping status updates work.
- [ ] Financial reports use currencies correctly.
- [ ] All major screens work in 3 languages.
- [ ] Production build succeeds.

---

## PHASE 3 — CHANNEL MANAGER, DYNAMIC PRICING AND SCALE

**Goal:** Add advanced enterprise capabilities, external channel synchronization, intelligent pricing, multi-property management, advanced analytics, and infrastructure readiness.

### Channel Manager
Create an architecture for future integration with Booking.com, Airbnb, Expedia, Agoda, Hotels.com, Vrbo.

> **Important:** Do not create fake production integrations. Create provider adapters, connection settings, secure credential storage, sync queues, webhook handlers, logs, and sandbox/mock connectors. Actual API connections enabled only with official partner credentials.

**Synchronize:** Properties, Room types, Rate plans, Prices, Availability, Inventory, Reservations, Cancellations, Minimum/Maximum stay, Closed dates, Booking restrictions.

**Features:** Connect/Disconnect channel, Map properties/rooms/rates, Manual/Automatic sync, Sync history, Error logs, Retry, Conflict detection, Reservation import, Availability/Price export, Prevent overbooking (centralized inventory locking).

**Statuses:** Pending, Processing, Completed, Failed, Partial, Conflict.

### Dynamic Pricing Engine
Create a rule-based engine. Do not use external AI APIs initially.

**Price factors:** Season, Day of week, Weekend, Holiday, Special event, Occupancy rate, Remaining inventory, Booking window, Length of stay, Early/Last-minute booking, Demand level, Min/Max price, Manual override.

**Rules examples:** Increase price 20% when occupancy > 80%, Reduce price 10% for bookings 60 days out. (Never breach min/max prices).

**Features:** Rule priority, Activation dates, Simulation mode, Pricing calendar, Price history, Manual override, Bulk update, Forecast chart, Revenue comparison, Audit log, Staff approval workflow.

### Multi-Property & Multi-Branch Management
* **Hotel groups:** Manage multiple hotels, Central reservations/availability, Central staff, Consolidated revenue, Property comparison, Group subscriptions.
* **Car rentals:** Manage multiple branches, Transfer vehicles, Track fleet location, Maintenance, Insurance expiration, Branch revenue/utilization, Branch staff permissions.

### Advanced Analytics
**Metrics:** Gross booking value, Net revenue, Commission revenue, Subscription/Affiliate revenue, Conversion rate, Cancellation rate, Occupancy rate, ADR, RevPAR, Car utilization, Avg rental duration, Top destinations/partners/affiliates, Acquisition source, Currency distribution, Churn, Subscription growth.

**Super Admin Filters:** Date, Country, City, Partner, Property, Service type, Currency, Subscription plan, Booking status.

### Notifications
**Channels:** In-app, Email, SMS-ready, WhatsApp-ready, Push-ready.
**Events:** Bookings, Cancellations, Payments, Subscriptions, Reviews, Property approvals, Sync errors, Low inventory, Tasks, Reminders.

### Security
**Implement:** 2FA, Rate limiting, Secure password hashing, Session revocation, Device history, Login alerts, Audit logs, Encrypted credentials, Data validation, CSRF protection, CSP, File upload restrictions, Tenant data isolation, Least-privilege, API key management, Webhook signature verification.

### Performance and Scalability
**Prepare for:** Thousands of partners, Millions of listings/bookings, Background jobs, Redis caching, DB indexing, Read replicas, CDN, Image optimization, Search indexing, Queue-based sync, Horizontal scaling, Monitoring, Backups, Disaster recovery.

**Add:** Dockerfile, Docker Compose, Env variable template, Health check endpoint, Backup/Deployment docs, CI-ready scripts.

### Testing
**Add:** Unit, Integration, Authorization, Booking conflict, Currency calculation, Subscription limits, Affiliate commissions, PMS workflows, Dynamic pricing, Channel sync, E2E tests for critical flows (Registration, Approvals, Bookings, Check-in/out, etc.).

### Phase 3 Acceptance Criteria
Phase 3 is complete only when:
- [ ] Channel adapters/queues and mock integrations work.
- [ ] Overbooking protection works.
- [ ] Dynamic pricing rules calculate correctly.
- [ ] Multi-property/branch dashboards work.
- [ ] Advanced analytics and notifications work.
- [ ] Security controls are implemented.
- [ ] Critical workflows have automated tests.
- [ ] Docker deployment works and documentation is complete.
- [ ] Production build succeeds.

---

## SUPER ADMIN GLOBAL CONTROL
The Super Admin must have full control over:
Users, Roles, Permissions, Partners, Hotels, Rooms, Vehicles, Car companies, Travel agencies, Affiliates, Reservations, Payments, Refunds, Commissions, Withdrawals, Subscription plans/assignments, Currencies, Exchange rates, Taxes, Coupons, Reviews, Destinations, Countries, Cities, Languages, Translations, Amenities, Categories, Homepage content, CMS pages, Notifications, Reports, Audit logs, Channel connections, Pricing rules, System settings, Maintenance mode.

*(Destructive actions must require confirmation. Important changes must be recorded in the audit log).*

---

## DESIGN REQUIREMENTS
Create a premium, modern, and trustworthy travel design.
**The interface must be:**
Clean, Elegant, Responsive, Accessible, Fast, Mobile-first, Easy for non-technical partners, Consistent across dashboards.

**Use:** Clear navigation, Professional cards, Data tables, Filters, Charts, Calendar views, Status badges, Empty/Loading/Error states, Confirmation dialogs, Toast notifications, Accessible forms.

> **Note:** Do not copy the protected branding or exact interface of Booking.com, Airbnb, or Expedia. Create an original TravlBok identity.

---

## DATABASE RULES
**Use:** UUID identifiers, Created/Updated timestamps, Soft deletion, Audit fields, Organization identifiers, DB indexes, Foreign key constraints, Transaction-safe booking operations.

**Important entities:**
`User`, `Role`, `Permission`, `Organization`, `OrganizationMember`, `Hotel`, `RoomType`, `RoomInventory`, `RatePlan`, `Vehicle`, `CarBranch`, `Availability`, `Reservation`, `ReservationGuest`, `Payment`, `Refund`, `Invoice`, `SubscriptionPlan`, `Subscription`, `UsageRecord`, `Affiliate`, `AffiliateClick`, `Commission`, `Withdrawal`, `GuestProfile`, `CheckIn`, `CheckOut`, `HousekeepingTask`, `MaintenanceTask`, `ChannelConnection`, `ChannelMapping`, `SyncJob`, `PricingRule`, `PriceOverride`, `Review`, `Notification`, `AuditLog`, `Currency`, `ExchangeRate`, `Translation`, `Coupon`.

---

## CLAUDE CODE EXECUTION RULES
**Before coding:**
* Inspect the existing repository.
* Read all configuration files.
* Detect the current technology stack.
* Reuse working code where possible.
* Do not delete existing functionality without justification.
* Create a detailed implementation plan for the current phase (list files created/modified).

**During coding:**
* Work only on the active phase.
* Make small, testable changes.
* Avoid placeholder-only screens.
* Connect forms to real database operations.
* Use realistic seed data.
* Validate all inputs.
* Enforce authorization server-side.
* Never expose secrets.
* Avoid duplicate logic.
* Document complex code.
* Keep the build working.

**After each module:**
Run type checking, linting, tests, and production build. Fix all errors before continuing.

**At the end of every phase, generate:**
Completed features, Remaining features, Database changes, API changes, Security notes, Test results, Known limitations, Required environment variables, Instructions to run locally, Instructions to deploy.

**FINAL RULE:** Start with Phase 1 only. Do not start Phase 2 or Phase 3 until Phase 1 has been fully implemented, tested, and documented.