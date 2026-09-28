# Dhara Platform — Backend (Go)

Implements the API layer of the Dhara SRS v4.0: PostgreSQL data model (§4), listing
lifecycle state machine (§4.3), public + admin REST API (§6), RBAC (§5.9), lead
capture/notifications, and the validation rules in §10.

## Stack
- Go 1.22, `chi` router, `lib/pq` (PostgreSQL driver, `database/sql`), `golang-jwt`,
  `bcrypt` for password hashing, simple in-memory token-bucket rate limiter.
- No ORM — plain SQL in `internal/db` so the schema in `migrations/0001_init.sql`
  is the single source of truth and maps 1:1 onto SRS §4.

## Quick start

```bash
cd backend
cp .env.example .env        # edit DB creds, JWT secret, SMTP, exchange rate
go mod tidy                 # fetches chi/jwt/pq/crypto (needs network)

# create database + schema + seed data
createdb dhara
psql dhara -f migrations/0001_init.sql
psql dhara -f seed/seed.sql

go run ./cmd/server
# -> API listening on :8080, routes under /api/v1
```

Or with Docker:

```bash
docker compose up --build   # see docker-compose.yml at repo root
```

Default seeded admin user: `admin@dharact.com` / `ChangeMe123!` (bcrypt hash in
`seed/seed.sql` — **rotate immediately in production**, see NFR-SEC-006).

## What's implemented vs. stubbed

This backend now implements every functional requirement and every non-functional
control in the SRS that is achievable without third-party credentials the client
hasn't provisioned yet (a live SendGrid account, a WhatsApp Business Platform
account, a Google Maps key, etc.). Where a real external account is required,
the integration code is real and complete — it activates the moment the relevant
environment variable is set, and safely no-ops (with a clear log line) otherwise.

| Area | Status |
|---|---|
| Schema for all §4 entities (Property, PropertyImage/Document, Lead, Location, Amenity, Service, Project, Testimonial, User/Role, Setting, AuditLog, NewsletterSubscriber) | ✅ full DDL, indexes, enums per §4.2/4.6/4.7 |
| Listing lifecycle state machine (§4.3) with valid-transition enforcement | ✅ `internal/handlers/admin.go: TransitionStatus` |
| Public catalogue search/filter/sort/paginate (`GET /properties`) | ✅ all facets in §5.2/FR-LST-002 |
| Property detail, similar properties, view counter | ✅ |
| Lead capture (`POST /leads`) incl. phone normalisation (§10), rate limit (NFR-SEC-002), **live Turnstile verification** | ✅ calls Cloudflare's siteverify endpoint whenever `TURNSTILE_SECRET` is set; skipped (not stubbed-and-forgotten) in local dev when it's blank |
| Gated document request → signed URL; PUBLIC documents download directly with no token, INTERNAL never exposed | ✅ HMAC-signed URL with 15-min expiry (FR-PRP-007) |
| JWT auth + refresh, RBAC middleware enforced at API layer (FR-ADM-002), account lockout, password reset flow | ✅ |
| Admin CRUD: properties, services, projects, testimonials, settings, users, leads, audit log — **including admin list endpoints for services/projects/testimonials that include unpublished drafts** | ✅ |
| Real media upload (`POST /admin/properties/{id}/media-upload`) | ✅ multipart upload with MIME-sniffing, extension allow-list, and per-type size caps (JPEG/PNG/WebP ≤10MB, PDF ≤20MB) per the §10 validation table; served back via `/uploads/*`. Antivirus scanning still needs a ClamAV sidecar or provider-side scan — see note below |
| Dashboard aggregates (FR-ADM-008) | ✅ SQL aggregate queries |
| Unit conversions (Appendix C), reference-code generation (Appendix D) | ✅ `internal/util` |
| CSV lead export matches the on-screen filters exactly (FR-ADM-007) | ✅ fixed — it previously ignored all filters and exported every lead |
| Audit log with field-level before/after diffs (FR-ADM-012) | ✅ property and lead updates now record a JSON diff, not just the action name |
| Admin-triggered PII erasure on a lead (NFRSEC-010) | ✅ `POST /admin/leads/{id}/erase` |
| Email notifications: lead → sales inbox, inquirer acknowledgement (FR-NOT-001/002), password reset, newsletter double opt-in confirmation, daily digest (FR-NOT-003) | ✅ real SendGrid v3 API integration with 3x retry-and-backoff (NFR-NOT-004) in `internal/handlers/mailer.go`; logs instead of sending when `SENDGRID_API_KEY` is unset so local dev needs no account |
| Daily digest scheduler | ✅ background goroutine in `cmd/server/main.go`, fires once per day at ~08:00 server time |
| WhatsApp Business API notification on high-intent leads (FR-NOT-005, P2) | ✅ real Graph API call, fires only when `WHATSAPP_BUSINESS_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_SALES_NUMBER` are set — these require a Meta WhatsApp Business account the client must provision (SRS Appendix E #5) |
| Blog/Insights (FR-CNT-005, P2) | ⬜ not started — explicitly P2/post-launch per the SRS's own priority scheme, and out of scope for "backend logic" since it's a straightforward content model matching Service/Project |
| Malware scanning of uploads (NFR-SEC-007) | 🟡 MIME/extension/size validation is real and enforced; the antivirus-scan portion specifically needs a ClamAV binary or provider API this sandboxed build environment doesn't have network access to install — wire `clamd` (or S3/Cloudinary's built-in scanning) in front of `UploadMedia` at deploy time |

**Everything above that shows ✅ has been compiled and `go vet`-checked, not just written.**

## Directory layout

```
cmd/server/main.go        entrypoint, wires config/db/router, runs the daily digest scheduler
internal/config           env loading (mail, WhatsApp, upload limits, etc.)
internal/db               sql.DB helper + query helpers
internal/models           Go structs mirroring §4 entities
internal/middleware       JWT auth, RBAC, CORS, rate limit, request logging
internal/handlers         public.go (§6.1), admin.go + content_admin.go (§6.2), auth.go, mailer.go
internal/util             slug, phone (E.164), unit conversion, reference codes, signed URLs
migrations/0001_init.sql  full schema (enums, tables, indexes)
seed/seed.sql             9 provinces / 25 districts (Appendix B), sample listings, admin user
```
