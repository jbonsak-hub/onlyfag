# River-drop prototype: real directed NVE river lines

The prototype uses six **actual NVE ELVIS river networks**: Glomma,
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

The six exact route families are `002-34`, `006-11`, `008-1`, `012-1`,
`015-18` and `016-35`. These are more specific than three-digit
vassdragsområder, which also contain neighbouring independent coastal streams.
Only source routes at least **5 km** long, or with a mapped upstream catchment
area at least **2 km²**, are included. This explicit display-scale selection
retains 3,367 real source features, rather than downloading or pretending to
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

The resulting network contains **6,698 directed segments**. **6,633 (99.03%)**
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

Both operations are offline. They verify the source hash, graph references,
acyclicity, outlet reachability and exact shared junction coordinates. The
builder writes `assets/geography/drop-prototype/data.json`, with browser data
below 5 MB. To reproduce the compact snapshot from the retained original
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
