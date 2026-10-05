# Dhara Construction and Technology — Platform

Next.js website + admin panel, Go REST API, PostgreSQL. Everything an admin saves in the panel is
read live from the database by the public website — there is no build-time snapshot and no sample
data standing in for real content. See **CHANGES.md** for what was fixed in this version.

## Run with Docker

```bash
docker compose up --build
# website:  http://localhost:3000
# admin:    http://localhost:3000/admin
# API:      http://localhost:8080/api/v1
```

The database schema and seed data load automatically the first time (to reload them:
`docker compose down -v`). Uploaded photos/PDFs live in the `dhara_uploads` volume.

Seeded admin login: **admin@dharact.com** / **ChangeMe123!** — change it straight away.

## Run locally (no Docker)

```bash
# 1. Database
createdb dhara
psql dhara -f backend/migrations/0001_init.sql
psql dhara -f backend/seed/seed.sql

# 2. Backend  (reads backend/.env automatically; listens on :8080)
cd backend && go run ./cmd/server

# 3. Frontend (new terminal; frontend/.env.local points at :8080)
cd frontend && npm install && npm run dev
```

Both `backend/.env` and `frontend/.env.local` are included with working local defaults.
If you change the backend port, change `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` to match.

## How content gets from the admin to the website

| You edit in the admin… | …and it appears on |
|---|---|
| Properties (publish it, ≥3 photos) | `/properties`, category pages, home, property page |
| Services / Projects | `/services`, `/projects`, home |
| Testimonials | home |
| Pages → About / Privacy / Terms | `/about-us`, `/privacy-policy`, `/terms` |
| Settings → contact, hours, social links | top bar, footer, contact page |
| Settings → homepage stats, "Why Dhara" | home page |
| Settings → USD rate | LKR/USD toggle |

A new property starts as a **Draft** (invisible). Add at least 3 photos (each with a description) and
press **Publish** on its edit page or in the list.

## Configuration that matters

| Variable | Where | Meaning |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | frontend (build time) | API address as seen by the visitor's **browser** |
| `API_INTERNAL_URL` | frontend (runtime) | API address as seen by the **Next.js server** (Docker: `http://backend:8080/api/v1`) |
| `ALLOWED_ORIGINS` | backend | Comma-separated website addresses allowed to call the API. **Must include your site's URL** or admin login/saves fail with a CORS error |
| `SITE_BASE_URL`, `FRONTEND_BASE_URL` | backend | Public URLs of the API and website (used in emailed/signed links) |
| `USE_FALLBACK_DATA=true` | frontend | Demo mode: show bundled sample content when there is no backend. Off by default |

For production, set real domains in these variables, a strong `JWT_SECRET` / `SIGNED_URL_SECRET`,
and serve everything over HTTPS.

## Layout

```
backend/     Go API — see backend/README.md
frontend/    Next.js site + admin — see frontend/README.md
docker-compose.yml
CHANGES.md
```
