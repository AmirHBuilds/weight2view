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
# Note: this repo's history includes migration 0002, which widens the
# reference_objects.shape check constraint for Phase 2's stylized models
# (phone, bottle, mug, fridge, etc). Running `alembic upgrade head` picks
# this up automatically on a fresh or existing database.

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
- **Focus / Show all**: clicking a reference object in the scene focuses the camera on just that
  object (helpful when comparing something tiny against something huge); "Show all" restores the
  full framing.

## Known limitations (unchanged from Phase 1, plus one new item)

- **Admin has no real authentication.** See the `TODO(auth)` block in
  `backend/app/api/admin/__init__.py`.
- `unit_count` measurement strategy and volume→mass are still not implemented (schema/service
  shape already reserves space for both).
- Reference-object volumes for irregular objects (bicycle, motorcycle) are rough bounding-box
  approximations, not true occupied volume.
- **New**: with 3+ reference objects compared simultaneously, their floating labels can overlap
  at the default zoom level. Focus mode (click an object) is the current mitigation; automatic
  label decluttering is a reasonable follow-up.
- No automated frontend tests yet. Backend calculation/reference-selection/units logic has 26
  passing unit tests (24 original + 2 added for the extended length-unit coverage).

## Recommended next step

Wire up real admin authentication, then consider automatic label decluttering for 3+ simultaneous
reference comparisons (e.g. hide labels for non-focused objects until hovered).
