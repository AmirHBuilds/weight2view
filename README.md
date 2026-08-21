# Weight2View

Turn a weight into a real-world sense of space. Search an item, enter an amount, and see the
calculated volume rendered in 3D next to a familiar object ("about the size of a water bottle").

## Quick start (Docker Compose)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000 (docs at http://localhost:8000/docs)
- Admin panel: http://localhost:5173/admin — real authentication now (see below); the bootstrap
  Super Admin logs in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the environment
  (`owner@weight2view.io` / `ChangeMe123!` by default in docker-compose.yml — change this before
  using anywhere but a local machine)

First time only, run the migration and seed data (in a second terminal, once containers are up):

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed.run
```

## Running without Docker

**Backend**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit DATABASE_URL if needed
alembic upgrade head
python -m app.seed.run
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

You'll need a local PostgreSQL instance with the `pg_trgm` extension available (the migration
enables it automatically).

## Environment variables

**backend/.env**
| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg2://weight2view:weight2view@localhost:5432/weight2view` | SQLAlchemy connection string |
| `APP_NAME` | `Weight2View API` | |
| `ENVIRONMENT` | `development` | `development` \| `production` |
| `CORS_ORIGINS` | `http://localhost:5173` | comma-separated |
| `ADMIN_EMAIL` | *(unset)* | Bootstrap Super Admin email. Idempotent — created once on startup if it doesn't already exist. Unset = no bootstrap account is created. |
| `ADMIN_PASSWORD` | *(unset)* | Bootstrap Super Admin password. Never logged or returned by any API. |
| `SESSION_COOKIE_NAME` | `w2v_admin_session` | HttpOnly cookie name for the admin session |
| `SESSION_LIFETIME_HOURS` | `168` (7 days) | How long a session stays valid |
| `SESSION_COOKIE_SECURE` | `false` | Forced to `true` automatically when `ENVIRONMENT=production` regardless of this setting |

**frontend/.env**
| Variable | Default | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | *(empty — same-origin)* | Only set this to call a backend directly cross-origin; leaving it empty routes requests through Vite's dev proxy (see "Why a dev proxy?" below) |
| `VITE_PROXY_TARGET` | `http://localhost:8000` | Where the dev proxy forwards requests. docker-compose sets this to `http://backend:8000` |

### Why a dev proxy?

The admin session is an HttpOnly cookie. The frontend (`:5173`) and backend (`:8000`) run on
different ports, which browsers treat as different origins — a cookie set cross-origin needs
`SameSite=None; Secure`, which requires HTTPS and isn't practical for local HTTP dev. Instead,
`frontend/vite.config.ts` proxies API requests to the backend so every request is same-origin
from the browser's point of view, and a normal `SameSite=Lax` cookie works exactly as it would
behind one reverse proxy in production. One wrinkle: `/admin/items`, `/admin/references`, etc.
are used as **both** frontend page routes and backend API paths, so the proxy only forwards
requests that don't send `Accept: text/html` (i.e. actual `fetch()` calls, not page loads) —
see the `apiOnlyBypass` function in `vite.config.ts`.

## Common commands

```bash
# Migrations
cd backend && alembic upgrade head
cd backend && alembic revision --autogenerate -m "description"
# Migration history: 0002 widens reference_objects.shape for stylized
# models; 0003 adds model_source; 0004 adds admin_users/admin_sessions.
# `alembic upgrade head` picks all of these up automatically.

# Seed data (idempotent - only ever creates missing rows, never edits
# existing ones - see "Seed safety" below)
cd backend && python -m app.seed.run

# Backend tests. The pure unit tests (calculation/units/reference-selection)
# need no DB. The auth/authorization/CRUD integration tests need a real
# Postgres test database - one-time setup:
#   createdb weight2view_test   (or: psql -c "CREATE DATABASE weight2view_test")
#   psql -d weight2view_test -c "CREATE EXTENSION IF NOT EXISTS pg_trgm"
#   DATABASE_URL=postgresql+psycopg2://weight2view:weight2view@localhost:5432/weight2view_test \
#     alembic upgrade head
cd backend && PYTHONPATH=. pytest tests/ -v

# Frontend build
cd frontend && npm run build
```

## What's built

- **Public flow**: search (pg_trgm fuzzy match + aliases) → amount/unit input → `/calculate` →
  3D visualization with an automatically-selected, switchable reference object → missing-item
  request form.
- **Admin panel** (`/admin`): view/triage item requests, create/edit/deactivate items and their
  density/bulk-density measurements, create/edit/deactivate reference objects.
- **Calculation service** (`backend/app/services/calculation.py`): pure Python, unit-normalizes
  mass, applies the item's explicitly-configured `density` or `bulk_density` strategy, returns
  volume + confidence + source.
- **Reference selection service** (`backend/app/services/reference_selection.py`): ranks
  candidates by a weighted score (volume closeness, familiarity, scale-fit penalty) — not just
  nearest volume.
- **29 seed items / 19 seed references** — see `backend/app/seed/data/`. Values are marked
  `demo` (illustrative bulk densities) or `estimated` (commonly published constants like water's
  density); none are presented as verified scientific data.

### Phase 2 additions (visualization upgrade)

- **Smart camera / Fit to View** (`frontend/src/components/visualization/sceneBounds.ts`,
  `CameraRig.tsx`): camera framing is computed from the actual bounding box of everything on
  screen (target + selected references), not a fixed distance — works from millimeter-scale
  (1kg gold) to building-scale (2000kg of loose material) without breaking OrbitControls.
  A "Fit to View" button re-triggers framing on demand; framing also re-runs automatically
  whenever the calculation or reference selection changes.
- **Dimension visualization**: the target cuboid now shows in-scene bracket-style dimension
  indicators (`DimensionIndicators.tsx`) plus a homepage panel clearly labeled "Estimated
  dimensions" with an explicit note that this is a visualization aid, not the item's real shape.
- **Dimension unit selector** (`frontend/src/lib/units.ts`, `DimensionUnitSelector.tsx`):
  mm/cm/m/in/ft, pure display-layer conversion with a single source of truth — no recalculation,
  no duplicated conversion logic.
- **Stylized reference models** (`frontend/src/components/visualization/models/`): a
  `renderReferenceModel(shape)` registry maps a DB-backed `shape` field (phone, bottle, mug,
  shoe, backpack, fridge, washing_machine, car, motorcycle, bicycle, plus generic
  box/rounded_box/cylinder fallbacks) to small dedicated procedural components built from shared,
  reused geometries. Backend migration `0002` widens the `reference_objects.shape` check
  constraint; the seed script now syncs shape updates onto existing rows idempotently.
- **Multiple reference comparison**: "Compare with" is now a multi-select — toggle any of the
  top-ranked alternatives and/or add any reference from the full catalog. All selected objects
  render simultaneously at **true relative scale** (verified: e.g. a 7.2× volume difference
  between two references renders as an actual ~7.2× size difference, never faked for
  convenience).

### Phase 3 additions (GLB assets + fixes)

- **GLB reference models**: reference objects can now use a real `.glb` asset
  (`reference_objects.model_url`) instead of the procedural stand-ins. Architecture:
  - `frontend/src/components/visualization/models/normalizeModel.ts` — pure function that
    measures a loaded model's *actual* bounding box (full hierarchy, every mesh/child) and
    uniformly scales it to fit the database's `length_mm/width_mm/height_mm` ("contain" fit —
    never distorts proportions; may be conservatively smaller than the target on 1-2 axes if the
    asset's native proportions don't match).
  - `models/glbLoader.ts` — a small hand-rolled Suspense-compatible loader (not drei's
    `useGLTF`) specifically so load *failures* never produce an unhandled promise rejection —
    see the file header for the full reasoning.
  - `models/GLBModel.tsx` / `models/ModelErrorBoundary.tsx` / `models/ReferenceVisual.tsx` —
    `ReferenceVisual` is the single place that decides GLB vs. procedural: no `model_url` →
    procedural immediately, no network request; `model_url` set → show the procedural model
    while the GLB loads, permanently fall back to procedural on any failure. GLB and procedural
    both resolve to an object sized to the same target box, so nothing downstream (layout,
    camera fit, labels) needs to know which one was used.
  - Static assets live in `frontend/public/models/` — no object storage/CDN for the MVP.
  - `reference_objects.model_source` (migration `0003`) tracks attribution/license text per
    asset, mirroring how `item_measurements.source` tracks provenance for scientific data.
  - The admin References form has optional "GLB model URL" and "Model source" fields.
  - `frontend/public/models/Duck.glb` is a real, tested sample asset (Khronos glTF-Sample-Assets,
    CC0) kept in the repo as a working example — not wired to any reference by default, but
    useful for verifying the pipeline (`UPDATE reference_objects SET model_url='/models/Duck.glb'
    WHERE name='...'`) before real assets are sourced.
- **Dimension-indicator bug fixed**: indicators used to be positioned at a hardcoded scene
  origin, independent of the target's actual (layout-dependent) position, so toggling references
  - which re-centers the row layout - could visually detach them from the object they describe.
  Fixed by making the indicators a child of the *same* positioned group as the target mesh, so
  there's exactly one source of truth for "where is this object." Verified against reference
  toggling, multi-reference, disable/re-enable, swap, and rapid-toggle scenarios with zero drift.
- **Click-to-focus removed**: clicking a reference object no longer moves the camera. OrbitControls
  (rotate/zoom/pan) are the only way the camera moves during normal interaction; "Fit to View"
  remains the explicit way to reframe the scene.
- **Empty search → inline request**: searching for an item that doesn't exist shows "No items
  found... Request an item →" directly under the search box; one click submits exactly the typed
  query as an `item_request`, no extra fields asked.
- **Number input fix**: amount/dimension fields now select their existing text on focus, so
  clicking in and typing immediately replaces the value instead of inserting alongside it (was
  producing things like "0200" instead of "200").

### Phase 4 additions (real authentication + admin panel upgrade)

- **Real, backend-enforced authentication**: `admin_users` + `admin_sessions` tables (migration
  `0004`), bcrypt password hashing, opaque server-side session tokens in an HttpOnly cookie —
  not a JWT, specifically so logout / deactivation can revoke access immediately by deleting the
  session row, rather than waiting out an expiry or maintaining a blocklist. Every single admin
  API route depends on `AdminAuth` or `SuperAdminAuth` (`app/api/admin/__init__.py`) — knowing
  an admin URL is never sufficient; the backend checks the session on every request regardless
  of what the frontend renders. Verified live and in tests: 401 with no cookie, 200 with a valid
  one, 401 again immediately after logout.
- **Roles**: `admin` and `super_admin`. Only super admins can reach `/admin/admins` (both the
  page and the underlying API) — enforced by `SuperAdminAuth`, not by hiding a nav link.
- **Super Admin bootstrap**: idempotent — reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` on every startup,
  creates the account only if it doesn't exist yet. Never hardcoded, never logged, never
  returned by any API response.
- **Admin management** (`/admin/admins`, super admin only): create admins, change role,
  activate/deactivate, reset password. Guards prevent demoting/deactivating your own account or
  the last remaining active super admin — verified in tests, including the specific case of one
  super admin demoting a second one down to exactly one remaining, then confirming the last one
  is protected.
- **References page rewrite**: grouped edit form (Basic Information / Physical Dimensions /
  Visualization / Comparison / Status), search + category + status filtering, sort, a live 3D
  preview in the edit form using the *exact same* GLB/procedural pipeline as the public app (so
  "looks right in the preview" reliably means "looks right in the app"), and safe two-step
  delete (an active reference must be deactivated first — deletion is blocked with a 400
  otherwise; deactivated references stay visible in Admin but are excluded from both the public
  reference picker and the reference-selection algorithm).
- **Items page**: added the same activate/deactivate/delete pattern, with delete additionally
  blocked if any `item_request` still resolves to that item (a real FK, checked before allowing
  deletion).
- **Seed safety fix**: `seed_references` no longer syncs/overwrites fields on existing rows on
  every run (an earlier phase's convenience feature) — it now only ever creates rows that don't
  exist yet, exactly like `seed_items` already did. A reference, once created by either the seed
  script or an admin, is fully admin-owned from that point on; re-running the seed script can
  never silently undo an admin's edit.
- **Login UX**: `/admin/login`, redirects unauthenticated visitors from any `/admin/*` route;
  the layout's account area shows email + role and a working logout. No fake "forgot password" —
  the login page explicitly points to super-admin-driven password reset instead.
- **A real pre-existing bug was found and fixed along the way** (unrelated to auth): `GET
  /admin/items` and `GET /items/{id}` both 500'd for any item that had aliases — pydantic was
  trying to validate raw `ItemAlias` ORM objects directly as strings. Fixed in both places by
  converting aliases to plain strings before validation instead of after.

## Known limitations

- `unit_count` measurement strategy and volume→mass are still not implemented (schema/service
  shape already reserves space for both).
- Reference-object volumes for irregular objects (bicycle, motorcycle) are rough bounding-box
  approximations, not true occupied volume.
- With 3+ reference objects compared simultaneously, their floating labels can overlap at the
  default zoom level. "Fit to View" plus manual orbit/zoom is the current workaround; automatic
  label decluttering is a reasonable follow-up.
- No real GLB assets are wired up yet - every reference currently renders procedurally
  (`model_url` is null for all seed data). The loading/normalization/fallback pipeline is fully
  implemented and was verified end-to-end with real test assets (including a multi-mesh,
  multi-material asset and a deliberately-broken URL) during development, but shipping with
  actual car/phone/fridge/etc. models is the next step once assets are sourced.
- GLB assets are loaded via plain `fetch()` (no Draco/meshopt decompression wired up yet) - fine
  for small/simple assets, worth adding if real assets turn out to be large.
- Only one role tier is fully differentiated today (`admin` vs `super_admin`, where `admin`
  currently has the same item/reference/request permissions as `super_admin` - only
  `/admin/admins` is actually role-gated). The architecture (a `role` string checked by
  dependency, not hardcoded per-route logic) is ready for finer-grained permissions later without
  a rewrite, but that differentiation itself doesn't exist yet.
- Session cookies rely on the Vite dev proxy for same-origin behavior locally and in
  docker-compose (see "Why a dev proxy?" above). A real production deployment behind a single
  reverse-proxy domain wouldn't need this - the proxy is a local/compose-specific detail, not
  something that ships to production as-is.
- No password reset email flow (deliberately out of scope per the spec - resets are a
  super-admin action via `/admin/admins`).
- No automated frontend tests yet. Backend has 50 passing tests: 26 pure unit tests (no DB) plus
  24 integration tests (auth, authorization, admin management, reference CRUD safety) against a
  real Postgres test database.

## Recommended next step

Source real GLB assets (the loading/normalization pipeline is fully built and tested — see
Phase 3) for the highest-value reference objects (car, phone, fridge, shoe), and consider
differentiating `admin` vs `super_admin` permissions beyond just admin-management access if
that distinction ends up mattering in practice.
