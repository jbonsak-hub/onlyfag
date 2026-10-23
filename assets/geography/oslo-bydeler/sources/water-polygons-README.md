# Named Oslo-area lake polygons

`water-quiz-polygons.geojson.gz` is a GeoJSON FeatureCollection in **EPSG:4326**.
It contains nine actual water outlines from **OpenStreetMap contributors**,
distributed as an adapted database under **ODbL 1.0**. Attribution and licensing
are recorded in the layer's `source` object and in
`water-polygons-LICENSE.txt`.

The lake geometries are complete source polygons. The main Oslo builder applies
the shared map crop; this source layer does not invent replacement shorelines,
point buffers, circles, or straight closing lines. Island holes remain excluded
from the water: the nine polygons preserve **42 inner rings** in total.

| Published name | OSM object | Version | Area, km² | Island holes |
| --- | --- | ---: | ---: | ---: |
| Dælivannet | [way 27945653](https://www.openstreetmap.org/way/27945653) | 4 | 0.093 | 0 |
| Lille Åklungen | [relation 13668449](https://www.openstreetmap.org/relation/13668449) | 2 | 0.097 | 0 |
| Lutvann | [relation 38280](https://www.openstreetmap.org/relation/38280) | 5 | 0.423 | 3 |
| Nøklevann | [relation 16661](https://www.openstreetmap.org/relation/16661) | 17 | 0.759 | 8 |
| Sognsvann | [relation 448255](https://www.openstreetmap.org/relation/448255) | 5 | 0.394 | 1 |
| Steinbruvann | [relation 3332865](https://www.openstreetmap.org/relation/3332865) | 5 | 0.145 | 1 |
| Store Åklungen | [relation 2361103](https://www.openstreetmap.org/relation/2361103) | 3 | 0.135 | 2 |
| Østensjøvannet | [relation 33561](https://www.openstreetmap.org/relation/33561) | 21 | 0.363 | 24 |
| Øvresetertjern | [relation 2718044](https://www.openstreetmap.org/relation/2718044) | 3 | 0.030 | 3 |

These are the exact source names. In particular, the Bærum lake is published as
**Dælivannet**. Store Åklungen crosses the northern map frame; approximately 52%
of its actual water area remains visible. Every selected lake retains more than
20,000 m² inside the map crop. The other eight are fully inside it.

## Preserved acquisition

The public response came from `https://overpass-api.de/api/interpreter` with the
exact bounded query in `water-osm-source-query.overpass`. The response reports
an OSM base timestamp of **2026-10-23T14:40:06Z**. Its original JSON bytes are
preserved, without modification, inside `water-osm-source-2026-10-23.json.gz`.
The original uncompressed response has SHA-256:

```
160b6cedaaff50c99a0ba323f4445302b4860c28eb34bb7fd01ec10ca0b70912
```

The raw query also matched a car park named Lutvann and a transport stop named
Sognsvann. They remain in the preserved response but are explicitly excluded
from the lake layer. Only the pinned `natural=water` objects in the table are
selected. The query did not return an exact Ulsrudvann water object; no guessed
outline or substitute was added.

Each derived feature retains its OSM object identity, version, edit timestamp,
source link, measured metric area, and island count. `out meta geom` provides
the top-level way/relation versions and inline member coordinates; it does not
provide each member way's own version. The preserved original response checksum
and base timestamp pin those inline coordinates for offline reproduction.

## Offline conversion and checks

From the repository root, with `scripts/municipality-requirements.txt` installed:

```sh
python3 -B assets/geography/oslo-bydeler/sources/build-water-source.py
python3 -B assets/geography/oslo-bydeler/sources/build-water-source.py --check
```

The conversion verifies the original response checksum, named object IDs and
versions, water tags, closed standalone ways, complete relation member rings,
valid polygon topology, all 42 island holes, plausible metric areas, and crop
intersection. It assembles the original outer member ways and subtracts the
original inner island rings. No geometry buffer, smoothing, simplification, or
hand-drawn edge is used. Gzip output has a fixed timestamp for reproducibility.

Nøklevann's finer OSM outline intentionally takes precedence over the existing
coarser Kartverket N1000 target in the main builder. Bogstadvannet and
Maridalsvannet continue to use the existing pinned Kartverket water source.
