# SpotShare MVP

SpotShare helps a user pick a **best-known parking lot** near a destination (Bandra-first), then open Google Maps for navigation, with an optional **Parkability** view that explains last-mile confidence.

## Where everything is

- App routes:
  - Home: `src/app/page.tsx`
  - Lots: `src/app/lots/page.tsx`
  - Map: `src/app/map/page.tsx`
  - Parkability: `src/app/parkability/page.tsx`
- APIs:
  - `GET /api/lots` → `src/app/api/lots/route.ts`
  - `GET /api/parkability` → `src/app/api/parkability/route.ts`
- Data (JSON-first, runtime local only):
  - `data/parking.json`
  - `data/pois.json`
- Shared logic:
  - Geo helpers: `src/utils/geo.ts`
  - Parkability scoring: `src/utils/parkability.ts`
  - State store: `src/store/tripStore.ts`

---

## How to run

### 1) Install dependencies

```bash
npm install
```

### 2) Run development server

```bash
npm run dev
```

Then open:

- `http://localhost:3000`

### 3) Production checks

```bash
npm run lint
npm run build
npm run start
```

---

## How to use (demo flow)

1. **Home** (`/`)
   - Select a preset destination (or coordinates).
   - Tap **Enter location**.

2. **Lots** (`/lots`)
   - App calls `GET /api/lots?lat=...&lng=...`.
   - View sorted lots with distance + walk time.
   - Select one lot from card list/dropdown.
   - Actions:
     - **Get Directions** (opens Google Maps)
     - **View Parkability** (goes to `/parkability`)

3. **Map** (`/map`)
   - Shows destination marker + selected lot marker.
   - Track status (Idle/Navigating/Arrived).
   - **Track Stop** starts local navigation session.
   - **Mark Arrived** manual fallback.

4. **Parkability** (`/parkability`)
   - Calls `GET /api/parkability?lotId=...`.
   - Shows score, label, explanation, and POI category counts.

---

## API quick reference

### `GET /api/lots?lat=<number>&lng=<number>&limit=<1-30>`

- Returns closest lots from `data/parking.json`
- Adds:
  - `distanceMeters`
  - `walkMins` (heuristic)

Example:

```bash
curl "http://localhost:3000/api/lots?lat=19.0596&lng=72.8295&limit=20"
```

### `GET /api/parkability?lotId=<id>`

- Looks up lot in `parking.json`
- Uses POIs from `pois.json` within 1000m
- Returns weighted 0–100 score + label + counts

Example:

```bash
curl "http://localhost:3000/api/parkability?lotId=lot_st_andrews_01"
```

---

## What is still left to fix / improve

### High-priority MVP gaps

- Parkability map visualization on `/parkability` (radius + POI dots) is still minimal text/list.
- Confidence badges are present in data but not fully surfaced in all UI cards/filters.
- `Track Stop` is a basic geolocation session; no robust permission/error UX yet.
- No offline extraction scripts committed yet (currently curated JSON files are manual snapshots).

### Product completeness gaps

- No destination geocoding/autocomplete provider (currently preset + coordinate input).
- No multi-hub dataset switching UI (Bandra-first data only).
- No explicit legal/disclaimer copy in UI about non-live availability.

### Data/quality gaps

- `data/parking.json` and `data/pois.json` are starter samples, not full production curation.
- Need repeatable extract/clean/curate scripts and periodic refresh workflow.

---

## Non-negotiables (implemented)

- No live Overpass/Nominatim calls in runtime app.
- App reads local curated JSON files.
- Positioning is best-known parking + last-mile confidence, not live vacancy/pricing.
