# Dhara Platform — Frontend (Next.js)

Implements the public-facing site from the SRS: corporate pages (§5.5–5.7), the
property catalogue and detail pages (§5.2–5.3), and lead-capture forms (§5.4),
against the Go API in `../backend`.

## Stack
Next.js 14 (App Router, SSR), TypeScript, Tailwind CSS. No client-state library —
filters and pagination are plain `<form method="get">` / query-string driven so
catalogue pages stay crawlable and work without JavaScript (FR-LST-005).

## Quick start

```bash
cd frontend
cp .env.example .env.local     # point NEXT_PUBLIC_API_BASE_URL at your backend
npm install
npm run dev                    # http://localhost:3000
```

If the backend isn't running, pages still render using fixture data in
`lib/fallback-data.ts` (see `lib/api.ts`) so you can review the UI standalone —
this fallback is bypassed automatically the moment a real API responds.

`npm run build` has been verified to compile cleanly (all 18 routes, static +
dynamic) in this environment except for the Google Fonts fetch in
`app/layout.tsx`, which requires outbound access to `fonts.googleapis.com` —
unavailable in the sandbox this was built in, but present in any normal
network/CI/deployment environment.

## Design system

Tokens live in `tailwind.config.ts`: a cool concrete-grey background (`stone.fog`),
near-black ink text, a brass accent, and a slate-blueprint secondary — chosen to
suit a civil-engineering/construction brand rather than a generic SaaS palette.
Headings use Archivo (`--font-display`), body text uses Inter (`--font-body`),
both loaded via `next/font/google` in `app/layout.tsx`.

## What's implemented vs. stubbed

| Area | Status |
|---|---|
| Home (`/`) — hero, quick search, stats, featured listings, services, projects, testimonials, CTA | ✅ FR-HOM-001..009 |
| Catalogue routes: `/properties`, `/properties/lands`, `/properties/houses`, `/properties/houses/rent`, `/properties/commercial/rent`, `/properties/other` | ✅ shared `PropertyCatalogue` component — filters, sort, pagination, empty state, active-filter chips (FR-LST-001..009) |
| Property detail `/properties/{category}/{slug}` | ✅ gallery, spec table with unit conversions, amenities, downloads list, map placeholder, sticky inquiry panel, similar properties, land→service cross-sell (FR-PRP-001..011) |
| Lead forms: property inquiry, site inspection, general contact | ✅ posting to `POST /api/v1/leads` with client + implied server validation |
| WhatsApp deep link (FR-INQ-003) | ✅ pre-filled message per spec |
| Services (`/services`, `/services/{slug}`) | ✅ |
| Projects (`/projects`, `/projects/{slug}`) with sector filter | ✅ |
| About, Contact, Privacy, Terms, custom 404 | ✅ |
| Admin panel (`/admin/*`, SRS §5.8/§9.4) | ✅ full login → sidebar-shell → role-filtered nav; **Properties**: list with status-transition buttons, bulk feature/unfeature/archive, duplicate, create/edit form (category-aware, matches Appendix A field applicability), media manager (add/remove images with required alt text, add/remove documents with access level); **Leads**: filterable table, CSV export, detail view with status + internal notes; **Content**: services/projects/testimonials list+create+delete; **Settings**: contact/USD-rate/notifications; **Users**: create/deactivate with role; **Audit Log**: read-only table. All wired to the real backend API with JWT + auto-refresh (`lib/admin-api.ts`) |
| Currency toggle (LKR/USD) | ✅ header toggle, cookie-persisted, reads the admin-set rate from `/settings/public`, "(indicative)" label — `lib/currency-context.tsx`, `components/PriceTag.tsx` |
| Structured data (JSON-LD) | ✅ sitewide Organization schema (`app/layout.tsx`) + RealEstateListing/BreadcrumbList per listing (`PropertyDetailView.tsx`) |
| `sitemap.xml` / `robots.txt` | ✅ generated from live data via `app/sitemap.ts` / `app/robots.ts`, disallows `/admin` |
| Social share buttons + print stylesheet | ✅ `components/ShareBar.tsx`; `@media print` rules hide chrome and leave a one-page fact sheet |
| Gated-document mini-form UI | 🟡 documents list renders with a "(request access)" note on the public detail page; the actual name/phone/email modal that calls `POST /documents/{id}/request` is not wired yet — the endpoint and signed-URL flow are complete on the backend |
| Map view toggle (catalogue), before/after image slider, currency-aware WhatsApp message | ⬜ not yet implemented (P1 items) |
| Google Maps embed | ⬜ placeholder block — wire up with `NEXT_PUBLIC_GOOGLE_MAPS_KEY` once provisioned (SRS A04) |
| Admin properties list/create/edit talk to the real `/admin/properties*` endpoints; services/projects/testimonials admin screens currently read from the *public* list endpoints (so unpublished drafts won't show there yet) — a small backend follow-up (`GET /admin/services` etc., mirroring the properties admin list) would close that gap | 🟡 noted in code comments where it applies |

## Directory layout

```
app/                     App Router pages (one folder per route)
components/              Header, Footer, PropertyCard, PropertyCatalogue,
                         PropertyDetailView, InquiryPanel, ContactForm
lib/api.ts               Fetch client with graceful fallback to fixture data
lib/fallback-data.ts     Fixture data mirroring backend/seed/seed.sql
lib/format.ts            Price/unit formatting mirroring backend/internal/util
lib/types.ts             Shared TypeScript types
public/images/           Brand & content imagery (as supplied)
```
