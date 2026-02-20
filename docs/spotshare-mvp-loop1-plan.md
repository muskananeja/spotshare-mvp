A) Assumptions
- MVP geography is Bandra + Khar first; app architecture supports adding 8 Mumbai hubs by adding new JSON datasets and hub metadata.
- Destination search is preset + local fuzzy match only (no live geocoding in-app).
- All OSM extraction/refresh is offline via scripts/manual workflow; runtime app reads committed JSON files only.
- Parking data is “best known lots,” not guaranteed availability, pricing, or universal public access.
- Walking time heuristic = `ceil(distanceMeters / 80)` using 80 m/min.
- Parkability radius is fixed at 1000m from selected lot.
- Backend choice: Next.js App Router API routes (already aligned with stack, fewer moving parts than separate Express service).
- Data volume for MVP (<500 lots, <5000 POIs per hub) is small enough for in-memory processing per request.
- Track Stop/Arrived works with browser geolocation when allowed; manual fallback button is required.
- Confidence labels are curated offline and can be updated without redeploying backend logic.

B) Architecture diagram (text-based)
```text
                       OFFLINE DATA PIPELINE (No runtime OSM calls)
   Overpass Turbo / Geofabrik PBF -> normalize/clean -> manual curation -> data/parking.json + data/pois.json
                                                     |
                                                     v
+---------------------------- SpotShare Next.js Web App ----------------------------+
| Frontend (React + Zustand + Leaflet)                                              |
|  Home -> Lots -> Map -> Parkability                                                |
|      |        |        |          |                                                |
|      +--------+--------+----------+---- reads/writes tripStore state              |
|                                  HTTP                                               |
|                            /api/lots     /api/parkability                          |
|                              |                 |                                    |
| Backend API Routes (Next.js) |                 |                                    |
| - Load JSON server-side       |                 |                                    |
| - Haversine sort + walk mins  |                 |                                    |
| - Parkability counts+score    |                 |                                    |
+-------------------------------+-----------------+------------------------------------+
                                |
                                v
                          Google Maps deep link
                   (external navigation handoff only)
```

End-to-end flow:
1. User picks destination (preset lat/lng) on Home.
2. Lots screen calls `GET /api/lots` with destination coordinates.
3. API computes nearest lots from `parking.json`, returns distance/walk/confidence.
4. User selects lot, then either:
   - opens Google Maps directions, or
   - opens Parkability screen.
5. Parkability screen calls `GET /api/parkability?lotId=...`.
6. API computes POI counts in 1000m, returns score/label/explanation + POIs.

C) Data model (JSON schemas + examples)

`parking.json` schema (MVP required fields + optional enrichment):
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ParkingLot",
  "type": "object",
  "required": ["id", "name", "lat", "lng", "confidence"],
  "properties": {
    "id": { "type": "string", "pattern": "^lot_[a-zA-Z0-9_-]+$" },
    "name": { "type": "string", "minLength": 1 },
    "lat": { "type": "number", "minimum": -90, "maximum": 90 },
    "lng": { "type": "number", "minimum": -180, "maximum": 180 },
    "type": { "type": "string", "enum": ["surface", "underground", "multistorey", "street", "unknown"] },
    "address": { "type": "string" },
    "confidence": { "type": "string", "enum": ["high", "medium", "low"] },
    "notes": { "type": "string" }
  },
  "additionalProperties": false
}
```

`parking.json` example:
```json
[
  {
    "id": "lot_st_andrews_01",
    "name": "St Andrew's Parking",
    "lat": 19.0521,
    "lng": 72.8267,
    "type": "surface",
    "address": "St Andrews Rd, Bandra West",
    "confidence": "high",
    "notes": "Known public access on weekdays"
  }
]
```

`pois.json` schema (only non-negotiable categories):
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "POI",
  "type": "object",
  "required": ["id", "name", "category", "lat", "lng"],
  "properties": {
    "id": { "type": "string", "pattern": "^poi_[a-zA-Z0-9_-]+$" },
    "name": { "type": "string", "minLength": 1 },
    "category": {
      "type": "string",
      "enum": ["cafe", "restaurant", "atm", "pharmacy", "convenience", "supermarket", "bus_stop", "rail_station"]
    },
    "lat": { "type": "number", "minimum": -90, "maximum": 90 },
    "lng": { "type": "number", "minimum": -180, "maximum": 180 }
  },
  "additionalProperties": false
}
```

`pois.json` example:
```json
[
  {
    "id": "poi_blue_tokai_01",
    "name": "Blue Tokai",
    "category": "cafe",
    "lat": 19.0553,
    "lng": 72.8301
  },
  {
    "id": "poi_hdfc_atm_01",
    "name": "HDFC ATM",
    "category": "atm",
    "lat": 19.0548,
    "lng": 72.8305
  }
]
```

D) Data pipeline steps
1. Extract
   - Option A (Bandra/Khar MVP): run Overpass Turbo bbox query for parking + allowed POI tags.
   - Option B (Mumbai-wide later): download Geofabrik India/Mumbai extract and filter via `osmium`/`ogr2ogr` scripts.
2. Clean
   - Convert nodes/ways to point centroids.
   - Normalize categories to MVP enums.
   - Remove duplicates by `(name, rounded lat/lng)` and invalid coordinates.
3. Curate
   - Add `confidence` (`high/medium/low`) based on rubric.
   - Add optional `address`, `type`, `notes`.
   - Reject obvious private/restricted lots where known.
4. Store
   - Save versioned files: `data/parking.bandra.v1.json`, `data/pois.bandra.v1.json`.
   - Copy active dataset to `data/parking.json` and `data/pois.json` used by app.
5. Load
   - API routes load JSON server-side at request time (or memoized module-level cache).
   - No live OSM/Nominatim calls in app runtime.

E) Parkability scoring spec
Formula (0–100):
`score = foodScore + essentialsScore + transitScore`
- `foodScore = (min(foodCount, 8) / 8) * 35`
- `essentialsScore = (min(essentialsCount, 6) / 6) * 30`
- `transitScore = (min(transitCount, 4) / 4) * 35`
- rounded to nearest integer.

Category mapping:
- Food: `cafe`, `restaurant`
- Essentials: `atm`, `pharmacy`, `convenience`, `supermarket`
- Transit: `bus_stop`, `rail_station`

Computation rules:
- Consider POIs within 1000m haversine radius around selected lot.
- Keep raw counts per top-level bucket in response.

Label thresholds:
- 85–100: `Excellent last-mile walk`
- 65–84: `Great last-mile walk`
- 45–64: `Good last-mile walk`
- 25–44: `Fair last-mile walk`
- 0–24: `Limited amenities nearby`

Explanation templates (template-only, no ML):
- High transit: `"Great pick: {food} food options, {essentials} essentials, and strong transit access ({transit}) within a 10–12 minute walk."`
- Balanced: `"This lot gives balanced last-mile comfort with {food} food spots, {essentials} essentials, and {transit} transit points nearby."`
- Low amenities: `"Amenities are limited around this lot ({food} food, {essentials} essentials, {transit} transit), so plan quick-stop needs before parking."`
- Food-forward: `"Good for destination walks: {food} dining options plus {essentials} essentials within 1km."`

Confidence rubric + manual curation:
- High
  - OSM parking tag present + visible public access evidence (street view/local validation) + no private restriction indicator.
- Medium
  - OSM parking tag present but public status unverified; plausible public use.
- Low
  - Sparse metadata, possible private lot, or old/inconsistent mapping.

Manual curation workflow:
1. Reviewer opens extracted candidate list.
2. For each lot, verify map context (land use, nearby roads, known institutions).
3. Assign confidence and add note for caveats.
4. Second reviewer spot-checks top traffic destinations.
5. Export curated `parking.json` with audit column in internal sheet (not shipped).

F) API contract (examples)
1) `GET /api/lots?lat=19.0596&lng=72.8295&limit=20`

Success `200`:
```json
{
  "lots": [
    {
      "id": "lot_st_andrews_01",
      "name": "St Andrew's Parking",
      "lat": 19.0521,
      "lng": 72.8267,
      "type": "surface",
      "address": "St Andrews Rd, Bandra West",
      "confidence": "high",
      "distanceMeters": 912,
      "walkMins": 12,
      "notes": "Known public access on weekdays"
    }
  ],
  "total": 1,
  "destLat": 19.0596,
  "destLng": 72.8295
}
```

Errors:
- `400` invalid lat/lng: `{ "error": "lat and lng query params are required numeric values" }`
- `422` out-of-range coordinates.

2) `GET /api/parkability?lotId=lot_st_andrews_01`

Success `200`:
```json
{
  "lotId": "lot_st_andrews_01",
  "lotName": "St Andrew's Parking",
  "lotLat": 19.0521,
  "lotLng": 72.8267,
  "radiusMeters": 1000,
  "score": 74,
  "label": "Great last-mile walk",
  "description": "Great pick: 5 food options, 4 essentials, and strong transit access (2) within a 10–12 minute walk.",
  "counts": {
    "food": 5,
    "essentials": 4,
    "transit": 2
  },
  "poisNearby": [
    {
      "id": "poi_blue_tokai_01",
      "name": "Blue Tokai",
      "category": "cafe",
      "lat": 19.0553,
      "lng": 72.8301
    }
  ]
}
```

Errors:
- `400` missing lotId.
- `404` lot not found.

G) Screen-by-screen plan + state model
State management (Zustand `tripStore`):
- `destination: {id,name,lat,lng} | null`
- `lots: LotWithDistance[]`
- `selectedLotId: string | null`
- `parkabilityByLotId: Record<string, ParkabilityResult>` (cache)
- UI flags: `isLoadingLots`, `lotsError`, `isTracking`, `arrived`

Screen 1 — Home
- UI: destination input with preset suggestions + quick chips.
- Actions:
  - `setDestination()`
  - Navigate to `/lots`.
- Guardrails: CTA disabled until destination selected.

Screen 2 — Lots
- On mount: call `/api/lots?lat=...&lng=...` from store destination.
- UI:
  - Sorted list cards with distance, walk mins, type, confidence badge.
  - Optional dropdown mirror of list.
  - Buttons: `Get Directions`, `View Parkability`, `View Map`.
- Actions:
  - `setSelectedLot(id)` updates bottom action bar enabled state.

Screen 3 — Map
- Leaflet map with:
  - destination marker,
  - selected lot marker,
  - optional straight-line dashed polyline.
- Track Stop + Arrived logic:
  - Start tracking: watchPosition (if allowed).
  - Stop tracking button always available.
  - Arrived auto-set when user distance to lot < 60m.
  - Manual fallback button: `Mark as Arrived`.
- CTA: open Google Maps driving directions to selected lot.

Screen 4 — Parkability
- On mount: fetch `/api/parkability?lotId=...` unless cached.
- UI:
  - score ring + label + explanation sentence,
  - counts chips for food/essentials/transit,
  - map with lot marker, 1000m circle, colored POI dots + legend.
- CTA: Get Directions.

H) Overpass queries + Bandra bbox example
Bandra/Khar bbox example:
- South/West/North/East = `19.0350,72.8070,19.0765,72.8455`

1) Parking query (OSM tags for amenity=parking):
```overpass
[out:json][timeout:120];
(
  node["amenity"="parking"](19.0350,72.8070,19.0765,72.8455);
  way["amenity"="parking"](19.0350,72.8070,19.0765,72.8455);
  relation["amenity"="parking"](19.0350,72.8070,19.0765,72.8455);
);
out center tags;
```

2) POI query (only required categories):
```overpass
[out:json][timeout:120];
(
  node["amenity"~"^(cafe|restaurant|atm|pharmacy)$"](19.0350,72.8070,19.0765,72.8455);
  way["amenity"~"^(cafe|restaurant|atm|pharmacy)$"](19.0350,72.8070,19.0765,72.8455);
  relation["amenity"~"^(cafe|restaurant|atm|pharmacy)$"](19.0350,72.8070,19.0765,72.8455);

  node["shop"~"^(convenience|supermarket)$"](19.0350,72.8070,19.0765,72.8455);
  way["shop"~"^(convenience|supermarket)$"](19.0350,72.8070,19.0765,72.8455);
  relation["shop"~"^(convenience|supermarket)$"](19.0350,72.8070,19.0765,72.8455);

  node["highway"="bus_stop"](19.0350,72.8070,19.0765,72.8455);
  way["highway"="bus_stop"](19.0350,72.8070,19.0765,72.8455);

  node["railway"="station"](19.0350,72.8070,19.0765,72.8455);
  way["railway"="station"](19.0350,72.8070,19.0765,72.8455);
  relation["railway"="station"](19.0350,72.8070,19.0765,72.8455);
);
out center tags;
```

Option B (later, preferred for scale):
- Download Geofabrik India extract.
- Clip Mumbai AOI.
- Run repeatable filter scripts for parking and POI tags.
- Produce per-hub JSON bundles from single source snapshot.

I) Two-phase build plan (dev-days + checklist)
Phase 1 (week 1 demo) — 5 dev-days total
- [ ] Day 1: finalize Bandra dataset + confidence curation sheet (1.0)
- [ ] Day 1: implement `/api/lots` with validation + sorting (0.5)
- [ ] Day 2: Home + Lots screens wired to API (1.0)
- [ ] Day 3: lot selection state + Google Maps deep link (0.5)
- [ ] Day 3: Map screen markers + straight-line visualization (0.5)
- [ ] Day 4: empty/error/loading states + confidence badges (1.0)
- [ ] Day 5: QA hardening + copy/disclaimer pass + demo script (1.5)

Phase 2 (week 2) — 5 dev-days total
- [ ] Day 1: POI dataset curation + `pois.json` validation (1.0)
- [ ] Day 2: `/api/parkability` counts + score + labels + templates (1.0)
- [ ] Day 3: Parkability screen with score ring + POI map + legend (1.0)
- [ ] Day 4: Track Stop + Arrived logic (geo + manual fallback) (1.0)
- [ ] Day 5: regression QA, performance tuning, prepare Mumbai hub extension hooks (1.0)

J) Risks & mitigations
1. OSM staleness / incorrect lot metadata
- Mitigation: confidence badges + notes + scheduled monthly refresh + manual validation.

2. User expects real-time availability
- Mitigation: explicit copy: “best known parking options,” never “spots available now.”

3. Empty results around some destinations
- Mitigation: nearest-hub fallback prompt + “try nearby destination” UX and rapid data expansion queue.

4. Geolocation denied for tracking
- Mitigation: manual Track Stop / Mark Arrived controls; tracking is optional.

5. Map tile or third-party dependency limits
- Mitigation: configure production tile provider and cache-friendly settings before public rollout.

6. Performance degradation with hub expansion
- Mitigation: hub-based dataset partitioning + pre-indexed arrays + top-N slicing server-side.

K) LOOP 1 PLAN (detailed) + “READY TO IMPLEMENT”
Implementation strategy using strict loop workflow:

Repo structure target:
```text
src/
  app/
    page.tsx
    lots/page.tsx
    map/page.tsx
    parkability/page.tsx
    api/lots/route.ts
    api/parkability/route.ts
  components/
    DestinationInput.tsx
    LotCard.tsx
    LotList.tsx
    BottomActionBar.tsx
    MapView.tsx
    ParkabilityMap.tsx
    ParkabilityPanel.tsx
  store/tripStore.ts
  utils/geo.ts
  utils/parkability.ts
  utils/destinations.ts
  types/index.ts
data/
  parking.json
  pois.json
scripts/
  extract/
  clean/
  validate/
```

Slices and stop points:
1. Slice 1: scaffold + static screen flow wiring
   - Stop point: verify route navigation and default empty states.
2. Slice 2: `/api/lots` + JSON load + haversine sort + list render
   - Stop point: verify deterministic sorting, invalid param handling.
3. Slice 3: selection + Google Maps deep link
   - Stop point: verify URL format and disabled button behavior.
4. Slice 4: Leaflet map markers + optional straight line
   - Stop point: verify map renders client-side only and no SSR crashes.
5. Slice 5: Track Stop + Arrived
   - Stop point: verify geo-denied fallback works and doesn’t block navigation.
6. Slice 6: `/api/parkability` + score + Parkability view
   - Stop point: verify counts, thresholds, labels for edge-case inputs.
7. Slice 7: confidence badges + polish + copy disclaimers
   - Stop point: full regression walkthrough Home→Lots→Map/Parkability→Directions.

Self-review checklist to run after every slice:
- Non-negotiables respected (no live OSM/Nominatim runtime).
- Error/empty/loading states present.
- State is single-source in store, no duplicated truth.
- Utilities pure/testable (`haversine`, `score`, `label`).
- Naming consistent; dead props/components removed.

Test checklist template after every slice:
- Manual click path tests for primary journey.
- API param validation tests (valid/invalid/missing/out-of-range).
- Data robustness tests (empty JSON, missing optional fields, no nearby results).
- UI guards (disabled CTAs, fallback text, error banners).
- Performance sanity (limit top 20/30, no expensive loops in render).

READY TO IMPLEMENT
