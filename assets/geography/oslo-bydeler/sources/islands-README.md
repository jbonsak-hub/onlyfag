# Six named Oslofjord island polygons

`islands-quiz-polygons.geojson.gz` is a GeoJSON FeatureCollection in **EPSG:4326**.
It contains six complete, actual coastal polygons from **OpenStreetMap
contributors**, distributed as an adapted database under **ODbL 1.0**. The source
does not use points, circle buffers, guessed coastlines, shoreline smoothing or
manual boundary segments. The main quiz builder applies the map crop.

| Name | OSM object | Version | Area, km² | Coastal vertices |
| --- | --- | ---: | ---: | ---: |
| Langøyene | [way 4154560](https://www.openstreetmap.org/way/4154560) | 20 | 0.333 | 744 |
| Gressholmen | [relation 11816903](https://www.openstreetmap.org/relation/11816903) | 1 | 0.312 | 669 |
| Lindøya | [relation 11816904](https://www.openstreetmap.org/relation/11816904) | 1 | 0.425 | 534 |
| Malmøya | [way 35213472](https://www.openstreetmap.org/way/35213472) | 18 | 0.571 | 665 |
| Ulvøya | [way 4154565](https://www.openstreetmap.org/way/4154565) | 26 | 0.292 | 344 |
| Ormøya | [way 4154500](https://www.openstreetmap.org/way/4154500) | 18 | 0.182 | 279 |

Areas are measured after projection to EPSG:25833. OSM tags Ulvøya and Ormøya
as `place=islet`; the other four sources are `place=island`. Transport stops
with the same names were explicitly excluded during source identification.

Gressholmen follows the single complete coastline of the named source relation.
It includes the connected Gressholmen/Rambergøya/Heggholmen landmass as one
polygon. No arbitrary internal land boundary separates those connected parts.
The six target polygons themselves are mutually disjoint.

## Preserved source requests

The polygons were retrieved on **23 October 2026** through the official public
OSM API, using `/api/0.6/way/<id>/full.json` and
`/api/0.6/relation/<id>/full.json`. Each original response is preserved, without
modification, inside its own deterministic gzip file named
`islands-osm-<type>-<id>-source-2026-10-23.json.gz`.

`islands-source-requests.json` records every exact endpoint, source filename,
top-level object identity/version/edit timestamp, and SHA-256 of the original
uncompressed response. The offline converter independently pins all six
expected response hashes and source identities.

Unlike an Overpass `out meta geom` response, the OSM API full-object responses
include each member way and every referenced node as an individual object,
with its own version and timestamp. The response checksum therefore pins the
complete coastal node data as well as the top-level island. Original source
tags and editor-supplied source notes are retained in feature metadata; these
are mapped coastlines, not a cadastral or current surveying guarantee.

## Deterministic offline conversion

From the repository root, with the municipality GIS dependencies available:

```sh
PYTHONPATH=/workspace/shared/municipality-python-deps python3 -B assets/geography/oslo-bydeler/sources/build-island-source.py
PYTHONPATH=/workspace/shared/municipality-python-deps python3 -B assets/geography/oslo-bydeler/sources/build-island-source.py --check
```

The converter checks source hashes, exact names/IDs/versions/timestamps,
`place=island`/`place=islet` identities, complete coastline member ways,
closed standalone ways, exact endpoint-joined relation rings, valid nonempty
Polygon geometry, plausible geographic bounds and metric area, and mutual
island separation. Every source node must exist. Missing or invalid geometry
fails rather than producing a substitute. Output gzip timestamps are fixed,
so `--check` verifies the exact derived bytes without network access.

The layer uses `kind: "land"`, `category: "island"` and
`boundaryType: "osm-island-coastline"`. Overall metadata and every feature retain
source attribution and licensing links. Visible map attribution must retain
**© OpenStreetMap contributors**; see `islands-LICENSE.txt` and the shared
`OSM-ODbL-NOTICE.txt`.
