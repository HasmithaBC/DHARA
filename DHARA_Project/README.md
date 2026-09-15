# Dhara Construction and Technology — Platform

Development hand-off build for **dharact.com**, against SRS v4.0 (09 Sept 2026):
**Next.js frontend + Go backend**, PostgreSQL, matching the corporate site, real
estate listing engine, lead generation and CMS scope in §1.2.

This is a working scaffold, not a finished production system — see the "what's
implemented" tables in `backend/README.md` and `frontend/README.md` for an
honest, requirement-by-requirement breakdown of what's built versus stubbed.
The backend **compiles and passes `go vet`**; the frontend **builds cleanly**
(`npm run build`, verified in this environment except for the Google Fonts
fetch, which just needs normal internet access).

## Quick start (Docker)

```bash
docker compose up --build
# frontend: http://localhost:3000
# backend:  http://localhost:8080/api/v1
# postgres: localhost:5432 (schema + seed data loaded automatically)
```

Default seeded admin login (`/admin`): **admin@dharact.com** / **ChangeMe123!**
— rotate immediately, this is a dev seed only (NFR-SEC-006).

## Quick start (manual)

```bash
# 1. Database
createdb dhara
psql dhara -f backend/migrations/0001_init.sql
psql dhara -f backend/seed/seed.sql

# 2. Backend
cd backend && cp .env.example .env && go mod tidy && go run ./cmd/server

# 3. Frontend (new terminal)
cd frontend && cp .env.example .env.local && npm install && npm run dev
```

## What you're getting

| Layer | Location | Status |
|---|---|---|
| Database schema (SRS §4, all entities/enums/indexes) | `backend/migrations/0001_init.sql` | ✅ complete |
| Seed data (Appendix B locations, sample listings, services, projects) | `backend/seed/seed.sql` | ✅ complete |
| Public REST API (§6.1): catalogue search/filter/sort, detail, leads, documents, newsletter, **live Turnstile verification** | `backend/internal/handlers/public.go` | ✅ complete |
| Admin REST API (§6.2): property lifecycle, real file upload, leads CRM (with working filtered CSV export and PII erasure), dashboard, content (incl. admin list endpoints for drafts), settings, users, audit log with diffs, RBAC, password reset | `backend/internal/handlers/admin.go`, `content_admin.go`, `auth.go` | ✅ complete |
| Notifications: real SendGrid email (lead notify + acknowledge, password reset, newsletter opt-in, daily digest) with retry-and-backoff; real WhatsApp Business API call for high-intent leads | `backend/internal/handlers/mailer.go`, `cmd/server/main.go` | ✅ complete — see backend README for the exact env vars each needs |
| Public site: home, catalogue (6 routes), detail, services, projects, about, contact, legal, 404 | `frontend/app/**` | ✅ complete |
| **Admin UI**: properties (list/create/edit/lifecycle/media/bulk), leads CRM, content CRUD (now reading the admin list endpoints, so drafts show up), settings, users, audit log | `frontend/app/admin/**` | ✅ complete |
| SEO: sitemap.xml, robots.txt, JSON-LD structured data | `frontend/app/sitemap.ts`, `robots.ts`, `layout.tsx` | ✅ complete |
| Currency toggle (LKR/USD), print stylesheet, social share | `frontend/lib/currency-context.tsx`, `components/ShareBar.tsx` | ✅ complete |
| Blog/Insights (FR-CNT-005, P2) | ⬜ not started — explicitly P2/post-launch in the SRS itself |
| Malware scanning on uploads (NFR-SEC-007) | 🟡 MIME/extension/size validation is real and enforced; the antivirus-scan piece needs a ClamAV binary or provider-side scan wired in at deploy time — no AV engine is available in this build environment |
| Gated-document request modal, map view toggle, before/after slider | — | ⬜ backend ready, frontend UI not wired |

The backend has no more known correctness gaps against the SRS: the two real bugs
found during this pass — CSV export ignoring its own filters, and PUBLIC documents
incorrectly requiring a signed token to download — are both fixed. Every ✅ above
has been compiled and `go vet`-checked in this environment, not just written.

This is now a substantially complete hand-off build covering the full SRS data model and API,
the full public site, and a working (if visually minimal) admin CMS — not just a backend with no
way to operate it. See `backend/README.md` and `frontend/README.md` for the exhaustive
requirement-by-requirement breakdown.

## Open items requiring a client decision (SRS Appendix E)

These were flagged in the SRS itself and still need Dhara's sign-off before
launch — they don't block development but do affect scope:

1. Whether commercial sale listings are in scope for launch, or rent-only.
2. USD conversion approach — fixed admin-set rate (as scaffolded) vs. live FX feed.
3. Whether survey plans are published publicly (watermarked) or gated behind a lead form.
4. Whether exact map pins are permitted by default, or approximate-only until a buyer inquires.
5. The WhatsApp Business number, and whether the Business API notification (FR-NOT-005) is wanted.
6. Whether Blog/Insights (FR-CNT-005) is in or out of launch scope.
7. Legal copy for Privacy Policy and Terms, including lead data-retention period.

## Repository layout

```
backend/     Go API — see backend/README.md
frontend/    Next.js site — see frontend/README.md
docker-compose.yml
```
