# Weight2View

Turn a weight into a real-world sense of space. Search an item, enter an amount, and see the
calculated volume rendered in 3D next to a familiar object ("about the size of a water bottle").

## Quick start (Docker Compose)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000 (docs at http://localhost:8000/docs)
- Admin panel: http://localhost:5173/admin (dev-only, no auth yet — see Limitations)

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
| `ADMIN_DEV_MODE` | `true` | see Limitations — admin has no real auth yet |

**frontend/.env**
| Variable | Default |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` |

## Common commands

```bash
# Migrations
cd backend && alembic upgrade head
cd backend && alembic revision --autogenerate -m "description"

# Seed data (idempotent - safe to re-run)
cd backend && python -m app.seed.run

# Tests (calculation + reference-selection services, no DB required)
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

## Current limitations

- **Admin has no real authentication.** `/admin` is wide open in this build. See the
  `TODO(auth)` block in `backend/app/api/admin/__init__.py` for the seam where real auth should
  be plugged in — do not deploy this publicly as-is.
- **3D shapes are procedural placeholders** (box / rounded box / cylinder), not photorealistic
  or item-specific. `model_url` exists on `reference_objects` as a seam for real GLTF/GLB assets
  later.
- **`unit_count` measurement strategy is not implemented** (only `density` and `bulk_density`).
  The schema/enum already reserves space for it.
- **Volume → mass (reverse calculation) is not implemented.** The calculation service's shape
  (`MeasurementData` in, structured result out) is designed so this can be added alongside the
  existing function without breaking the API.
- Reference-object volumes for irregular objects (bicycle, motorcycle) are rough bounding-box
  approximations, not true occupied volume — noted in the seed data comments.
- No automated frontend tests yet (backend calculation/reference-selection logic has 24 passing
  unit tests).

## Recommended next step

Wire up real admin authentication (even a simple shared-secret header would be a meaningful
improvement over the current open dev route), then expand the seed dataset and start collecting
real user item requests to prioritize what to research next.
