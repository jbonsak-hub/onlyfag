# Detailed marine-limit geometry

The overview remains `data/under-marine-limit.geojson`: a national 50 m
teaching view made from the earlier ArcGIS request with
`maxAllowableOffset=25` metres.

`data/detail/index.json` adds a separately loaded local detail cache. The native
ArcGIS mirror requests **omit maxAllowableOffset**. The source is still NGU's
23 January 2024 extract through Geodata AS, licensed NLOD 2.0. The original
service's geometry is the best available geometry obtained from that mirror;
requesting it does not establish survey precision or a newer NGU survey date.

## Build and provenance

`sources/detail-manifest.json` records query parameters, SHA-256 and sizes for
all three unmodified native EPSG:25833 responses. Raw responses total about
311 MB and remain outside the website repository under
`/workspace/artifacts/marine-limit/raw-native/`. Only the local view tiles and
small manifests are published.

```sh
PYTHONPATH=/workspace/shared/municipality-python-deps \
  python3 -B assets/geography/marine-limit/sources/build-detail.py \
  --raw /workspace/artifacts/marine-limit/raw-native
```

Each complete source geometry is repaired when invalid and simplified at
**5 metres before any tile clipping**. Adjacent tiles therefore share the same
simplified geometry. Features are clipped to a 50 km UTM33 grid and coordinates
rounded to 0.1 m. The script can subdivide tiles over 3 MB; this snapshot requires
no subdivision. No marine-limit heights, inferred boundaries, land masks or
terrain thresholds are generated.

All **2,868 source object IDs** survive. Object 1846 is a real, very narrow
0.87 m² source polygon; the earlier 25 m server generalisation collapsed it to
zero area, so the overview has 2,867 objects. This is a generalisation difference,
not a missing source record.

The detail cache has **201 tiles**, totalling **19,695,615 bytes**. The largest
tile is **650,505 bytes**. It contains 3,080 clipped feature parts from the 2,868
unique source objects. Native responses contain 10,962,084 vertices; simplified
complete geometries contain 909,601. Fifty-seven invalid native source objects
were repaired; none were empty afterwards.

## Coordinate and loading contract

The index declares `coordinateSystem: "EPSG:25833"` and
`simplificationMeters: 5`. Tile entries contain `id`, relative `url`,
`bbox: [xmin, ymin, xmax, ymax]`, `bytes`, `featureCount` and `sha256`.

Tile files use GeoJSON-style FeatureCollections with an explicit legacy
`crs` declaration for **EPSG:25833**, in metres. They are **not RFC 7946
longitude/latitude GeoJSON**. Coordinates are easting/northing; a canvas whose
world y-axis points down must negate northing. Feature `id`, `properties.id`
and `properties.sourceID` identify the NGU source object and may occur in
multiple tiles because of clipping. Source holes are retained.

The browser can display the national overview first and fetch visible detail
tiles when zooming in. Tile data are hosted on OnlyFag, with no runtime NGU or
ArcGIS request. Background map imagery is a separate concern.

## Validation

All 201 tile hashes, byte counts, declared CRSs, feature counts, valid polygon
areas and clipping bounds were independently checked. All 2,868 source IDs,
including 1846, occur in the output. Independent UTM33 point-in-polygon checks
place Oslo, Trondheim and Tromsø centres inside the data, and Tryvannshøgda
and Galdhøpiggen outside.
