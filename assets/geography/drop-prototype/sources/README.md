# River-drop prototype: real directed NVE river lines

The prototype combines **actual NVE ELVIS river networks** on Østlandet,
Sørlandet and Vestlandet. The southern/western extension covers NVE drainage
areas 017–112, from the southern coast through Rogaland and Vestland to Møre og
Romsdal. See the extension's selection and audit below.

The combined browser dataset contains **941 networks, 13,115 directed segments
and 352,313 vertices**, in 9,326,254 bytes before HTTP compression. **13,023
segments (99.30%)** reach their declared measured main outlet. All 941 networks
have a verified start in the searchable keyboard picker. The 92 uncertain
segments remain context only.

The original eastern snapshot retains six networks: Glomma,
Nordmarkvassdraget/Akerselva, Sandvikselva, Drammensvassdraget, Numedalslågen
and Skiensvassdraget. It is a river-line experiment, not a terrain or rainfall
model. Clicking snaps to a represented river; it does not claim where water
would flow from arbitrary surrounding land.

## Source and selection

- Publisher: Norges vassdrags- og energidirektorat (NVE).
- Live source: [NEVINA Elvenett, layer 3](https://gis3.nve.no/map/rest/services/Mapservices/Nevina4/MapServer/3).
- License: **Norsk lisens for offentlige data (NLOD)**; see `LICENSE.txt`.
- Source CRS: **EPSG:25833**, coordinates in metres.
- Official fields retained during import: `OBJECTID`, `elvId`, `vnrNfelt`,
  `elvenavn`, `lengde_m`, `arealElverute_km2`, `vassdragsOmradeNr` and measured
  polyline geometry (`returnM=true`). The raw service metadata is preserved in
  `elvis-service-metadata.json.gz`.

The original eastern snapshot's six exact route families are `002-34`, `006-11`, `008-1`, `012-1`,
`015-18` and `016-35`. These are more specific than three-digit
vassdragsområder, which also contain neighbouring independent coastal streams.
In both snapshots, only source routes at least **5 km** long, or with a mapped upstream catchment
area at least **2 km²**, are included. This explicit display-scale selection
retains 3,367 real source features in the original eastern snapshot, rather than pretending to
represent every tiny brook in the region.

`selection-query.json` records the exact selection request and
`arcgis-download-index.json` records all 34 indexed, 100-object geometry requests,
the complete selected object IDs, original response byte counts, and SHA-256
hashes. Full unmodified responses contain about 116 MB before gzip. They are
retained outside the website repository at
`/workspace/artifacts/drop-prototype/source-downloads/`; those large downloads
are unnecessary for an ordinary offline build.

## Verified direction and junctions

**M is a source linear-reference measure, not elevation.** In this source,
increasing M follows the downstream direction. The named Glomma main route
`002-34-1` has M=0 at its upstream source and M=620920 at its known Fredrikstad
mouth, approximately 10.956666°E, 59.176492°N. The six main-route endpoints and
measure ranges are retained in the public data's `source.outletCalibrations`.
Every imported route part is independently checked for finite, monotonically
increasing measures; reversed storage order is corrected. No source part in
this snapshot lacked usable measures.

A route can connect only from its measured downstream endpoint to an actual
source river line in the **same exact family**, within **1 metre**. There is no
nearest-river routing across catchment divides. Receiving lines are split at
those actual junctions. The largest accepted precision adjustment was
**0.279 metre**. Fixed nodes are retained while intermediate vertices are
simplified with a **25-metre** visual tolerance, then stored to centimetres in
the compact projected snapshot. This is below a tenth of a pixel at the full
regional view. Simplification does not move junctions or invent connecting
river paths.

The original eastern snapshot contains **6,698 directed segments**. **6,633 (99.03%)**
reach one of the six verified main-route outlets. All downstream walks are
checked for cycles; this snapshot required no cycle removal. Five unmatched
route ends and twenty ambiguous junctions remain documented. Their affected
upstream segments—65 segments in total—are marked `routable: false`: they may
be drawn as geographical context, but must not accept simulated drops or be
described as reaching the sea. The complete diagnostics are in
`source.validation` and in the compact source snapshot.

`order` is a Strahler-style hierarchy computed on this selected display graph,
for line-width styling. It is not an official NVE river-order attribute or a
water-discharge estimate. Animation speed is illustrative, not measured travel
time.

## Files and offline rebuild

`elvis-directed-network.json.gz` is the pinned, normalized source snapshot,
still in EPSG:25833. It retains directed IDs, exact fixed junctions, source route
and object references, measured-direction evidence, simplified geometry and
diagnostics. Its compressed SHA-256 is pinned in the builder:

```
442188c7c8950625c866cf6b86c85eb2e28b2257b6a20c057890d0ca4bbfa342
```

From the repository root, using the existing pinned GIS environment:

```sh
PYTHONPATH=/workspace/shared/municipality-python-deps python3 -B scripts/build-drop-prototype-data.py
PYTHONPATH=/workspace/shared/municipality-python-deps python3 -B scripts/build-drop-prototype-data.py --check
```

Both operations are offline. They verify both pinned source hashes, graph references,
acyclicity, outlet reachability and exact shared junction coordinates. The
builder writes `assets/geography/drop-prototype/data.json`, with a 12 MB budget
for the expanded regional network. To reproduce the original eastern snapshot from the retained original
downloads, use `--prepare-source /workspace/artifacts/drop-prototype/source-downloads`
before the ordinary build. Every raw response is checked against its recorded
SHA-256 first.

Browser coordinates are a uniformly scaled version of the projected metres,
with **x rightwards and y downwards** (`yUp: false`). `viewBox` begins at `[0,0]`,
`unitsPerKm` records the exact uniform conversion, and
`source.projectedBounds` preserves the original metric extent. No geographical
axis is stretched independently. Each basin supplies its actual
`outletSegment`, outlet point and human-readable outlet label. Presets include
all six main rivers plus real Otta, Rena and Vorma/Lågen tributary starts within
the verified Glomma network.

## Southern and western extension · 5 November 2026

The complete selection is recorded in `southwest/selection-query.json`:

```sql
vassdragsOmradeNr >= '017' AND vassdragsOmradeNr <= '112'
AND (lengde_m >= 5000 OR arealElverute_km2 >= 2)
```

The service returned 3,709 source objects in 936 exact river families. The raw
responses were fetched in 38 indexed batches of at most 100 objects, with
measured geometry in EPSG:25833. Each response is checked for missing IDs and
transfer-limit truncation. `southwest/arcgis-download-index.json` retains the
exact requests, IDs, byte counts and SHA-256 hashes. The original compressed
responses are kept outside the website repository in
`work/southwest-research/source-downloads/` in the task workspace.

The importer removes only exact duplicate measured route geometries (27 source
objects in drainage area 082), retaining the lowest official OBJECTID and an
audit of both IDs. It preserves distinct multipart geometry. It also checks
that every represented main outlet reaches the maximum measured endpoint of
the raw main route. Family `056-75` is excluded: its downstream main-route
parts have constant, unusable M values, so accepting its remaining inland
fragment would claim a false outlet. This leaves **935 calibrated southern
and western families**. All exclusions, ambiguous junctions, missing measures
and duplicate IDs are retained in the supplementary snapshot's diagnostics.

`southwest/elvis-directed-network.json.gz` keeps the same metre-based graph
schema as the eastern snapshot. The ordinary builder verifies both hashes,
merges disjoint river and basin IDs, and applies one uniform projected scale.
The older eastern geometry and downstream links are preserved. Every displayed
drop follows a `routable: true` route to its own measured main outlet; uncertain
branches may be drawn as context but do not accept simulated drops.

The supplementary compressed source's SHA-256 is
`49603ef67d72cb667c3d2ce4b14a9400c9ea7643bf916ed1888fdbea95e778e8`.

Start choices include every retained basin, grouped by Østlandet, Sørlandet
and Vestlandet. Search matches names and regions; duplicate official names
also show their NVE family ID. Basin colors and a Strahler-style display order
help distinguish the river networks. They do not represent discharge or
computed watershed polygons. The terrain background remains a separate
Kartverket layer.

Rebuild the supplementary source offline from the retained downloads:

```sh
python scripts/fetch-drop-southwest-source.py PATH_TO_DOWNLOADED_RESPONSES
python scripts/fetch-drop-southwest-source.py PATH_TO_DOWNLOADED_RESPONSES --check
python -B scripts/build-drop-prototype-data.py
python -B scripts/build-drop-prototype-data.py --check
node scripts/build-drop-prototype-assets.cjs
```

GIS dependency versions for this import are Shapely 2.1.2 and Pyproj 3.7.2.
`--download` explicitly refreshes the upstream selection; review changed source
hashes before updating the ordinary builder's pin. Tests in
`tests/drop-southwest-data.cjs` compare every browser vertex and downstream link
against both pinned graphs, check coastal coverage and all presets, and verify
that routes never cross drainage divides. The browser tests cover search,
western/southern journeys, offscreen preset navigation, map clicks and mobile
controls.
