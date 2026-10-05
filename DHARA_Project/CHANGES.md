# Round 2 - wrong / outdated information on the property pages

## Wrong information that was being shown
- **Land pages said "Electricity: Not available"** whenever the field was simply left blank. Unset now means hidden.
- **"Similar properties"** returned only half the data: rentals showed no "/ month", land showed no extent,
  houses showed no beds/baths, and every card had an empty status badge. It also mixed rentals with sales.
  It now returns full card data and only matches the same listing type.
- **Share / WhatsApp links and structured data** pointed at `/properties/land/...`, `/properties/house/...`
  (pages that do not exist) and a hard-coded `dharact.com`. They now use `/properties/{slug}` and `NEXT_PUBLIC_SITE_URL`.
- **The cover photo was not the main photo** (the page used whichever image was first in sort order).
  Cover is now always first, in the page, on cards, and in the share image.
- The API **overwrote the SEO meta description** with the land-extent text. Removed.
- **Duplicate listing** produced an empty shell (no price, specs, amenities, SEO). It now copies everything.
- Raw codes such as `SUBDIVISION_PLOT`, `MAINS`, `CARPETED` are shown as readable text.
- Properties pages showed a "PUBLISHED" badge; they now show For Sale / For Rent (or Reserved / Sold / Rented).

## Admin fields that were saved but never shown on the website
- Video URL (now an embedded YouTube/Vimeo player), frontage, boundary wall (land), A/C ready, minimum lease,
  and **all photos** (only the first 5 were shown before).
- SEO title / description now drive the page title, search snippet and social card.

## Contact details edited in Admin -> Settings
Phone, email, address, hours were hard-coded in the contact page, service pages, property inquiry panel,
mobile menu and structured data. They now all come from Settings. A **WhatsApp number** field was added
(blank = uses the phone number).

## Other
- Contact page read `searchParams` the old (non-Promise) way; fixed.
- Houses/Lands/etc. filter panel showed a "Listing type" box it should hide on forced pages; fixed.
- Sorting by price now puts "price on request" last and pagination order is stable.

## Still not verified here
No Go toolchain / network in the sandbox: please run `go build ./... && go vet ./...` and `npm run build` once.

---

# What was fixed

## Why admin changes did not show on the website
1. **Stale and fake content.** Public pages cached API data for 60 s, were prerendered at build time, used a
   1.5 s timeout, and on *any* failure silently showed hard-coded sample content. Now every page is rendered
   live (`cache: "no-store"`, `force-dynamic`), failures surface as an honest error page, and sample data is
   opt-in (`USE_FALLBACK_DATA=true`).
2. **Category pages ignored filters and were static.** `houses`, `lands`, `other`, `houses/rent`,
   `commercial/rent` treated `searchParams` as an object (it is a Promise in Next 15/16). Fixed.
3. **Docker could never reach the API** from the Next.js server (`localhost` = the container). Added
   `API_INTERNAL_URL`; the build no longer needs the backend; uploads persist in a volume.
4. **Uploaded images** were routed through a rewrite hard-coded to port 8081. They now load straight from the API
   (`lib/media.ts`), and missing images show a placeholder instead of crashing the page.
5. **Admin fields that were never shown or could not be edited:** homepage stats, "Why Dhara", opening hours,
   social links, About/Privacy/Terms copy (new **Pages** screen), project Challenge/Solution/Scope.
6. **Backend port mismatch** (8081 vs 8080 everywhere else) and `.env` never being read — fixed; `.env` is loaded.
7. **CORS** only worked for `localhost:3000` because the origin list was compared as one string. Fixed.

## Admin panel
- **Property form rewritten**: every field the API stores, cascading Province → District → City (plus "add a town"),
  category-aware sections, client-side validation with inline errors. Previously each save **erased** deed type,
  amenities, land details, video and SEO fields.
- **Real photo/PDF upload** (drag & drop, multiple), cover photo, descriptions, reorder, delete.
- **Publish bar** showing exactly what blocks publishing; publish/unpublish/sold/etc. from the list; list has
  thumbnails, search, filters, pagination and "view on site".
- Edit-property and lead-detail pages fixed for Next 16 (`useParams`).
- Testimonials: edit, hide/show. Settings: social, stats, hours, why-Dhara.
- Slug edits on services/projects now apply.

## Backend (Go)
- Newsletter signup always returned 400 (honeypot field rejected) — fixed.
- Province/district/city must belong together; publishing guarantees a cover image.
- NULL-safe public queries (services, projects, testimonials); testimonial create reports errors.
- Read rate-limit raised to 1200/min and keyed by IP (not IP:port); `/uploads/` directory listing disabled.
- New `POST /admin/cities`.

## Not verified here
The sandbox this was prepared in had no Go toolchain and no network, so the backend was **not compiled** and the
frontend was **typechecked (`tsc`, clean) but not built or run**. Please run `go build ./... && go vet ./...` and
`npm run build` once before deploying.
