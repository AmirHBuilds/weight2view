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

## Known limitations

- **Admin has no real authentication.** See the `TODO(auth)` block in
  `backend/app/api/admin/__init__.py`.
- `unit_count` measurement strategy and volume→mass are still not implemented (schema/service
  shape already reserves space for both).
- Reference-object volumes for irregular objects (bicycle, motorcycle) are rough bounding-box
  approximations, not true occupied volume.
- With 3+ reference objects compared simultaneously, their floating labels can overlap at the
  default zoom level (click-to-focus was removed per Phase 3 feedback, so this no longer has a
  dedicated mitigation - "Fit to View" plus manual orbit/zoom is the current workaround; automatic
  label decluttering is a reasonable follow-up).
- No real GLB assets are wired up yet - every reference currently renders procedurally
  (`model_url` is null for all seed data). The loading/normalization/fallback pipeline is fully
  implemented and was verified end-to-end with real test assets (including a multi-mesh,
  multi-material asset and a deliberately-broken URL) during development, but shipping with
  actual car/phone/fridge/etc. models is the next step once assets are sourced.
- GLB assets are loaded via plain `fetch()` (no Draco/meshopt decompression wired up yet) - fine
  for small/simple assets, worth adding if real assets turn out to be large.
- No automated frontend tests yet. Backend calculation/reference-selection/units logic has 26
  passing unit tests (24 original + 2 added for the extended length-unit coverage).

## Recommended next step

Wire up real admin authentication, then consider automatic label decluttering for 3+ simultaneous
reference comparisons (e.g. hide labels for non-focused objects until hovered).
