# Named woodland regions

`forests-quiz-polygons.geojson.gz` contains the actual mapped **OpenStreetMap
named woodland regions**, in EPSG:4326. These are `place=woodland` multipolygon
relations, not statutory Markaloven boundaries, property boundaries, or a
survey of tree cover. The named regions can contain lakes, roads and clearings.
The quiz builder clips them to the common map frame.

| Name | OSM relation | Relation version | Relation timestamp |
| --- | ---: | ---: | --- |
| Nordmarka | [1904403](https://www.openstreetmap.org/relation/1904403) | 62 | 2019-10-16T05:31:59Z |
| Bærumsmarka | [2577433](https://www.openstreetmap.org/relation/2577433) | 12 | 2020-10-04T18:09:33Z |
| Lillomarka | [5806405](https://www.openstreetmap.org/relation/5806405) | 2 | 2018-01-26T21:25:26Z |
| Østmarka | [5979888](https://www.openstreetmap.org/relation/5979888) | 3 | 2020-09-06T13:57:19Z |

The exact Overpass response is preserved in
`forests-osm-source-2026-10-23.json.gz`, retrieved 23 October 2026, with
`timestamp_osm_base` **2026-10-23T14:40:06Z**. Its uncompressed SHA-256 is
`3290bd1449875cffad37c81d5a794981b562d18b5676031a3a4084d41f65fad6`.
Relation versions alone do not pin the member ways: the complete raw snapshot
and its checksum pin every coordinate actually used.

The source query and endpoint are embedded in the delivered GeoJSON. The
response also includes two distinct protected-area relations named Nordmarka
and Østmarka. Those statutory-area features are **not used**. In particular,
they must not replace the separately named Nordmarka, Lillomarka and
Bærumsmarka woodland regions.

`forests-prepare.py` joins the published outer and inner way segments at exact
matching endpoints. It rejects incomplete rings, unsupported members, wrongly
assigned holes and invalid polygons. No vertices are drawn by hand, and no
point, circle buffer, smoothing, simplification or guessed division is used.
The selected four relations have one outer ring each and no inner members;
the converter preserves inner rings if present. The original OSM tags,
relation IDs, versions, timestamps and member IDs remain in the features.

To reproduce offline, from the repository root with the municipality GIS
dependencies available:

```sh
python3 -B assets/geography/oslo-bydeler/sources/forests-prepare.py
python3 -B assets/geography/oslo-bydeler/sources/forests-prepare.py --check
```

The source database and this derived forest layer are available under
**ODbL 1.0**, © OpenStreetMap contributors. See
`OSM-ODbL-NOTICE.txt`. Map displays must retain visible OpenStreetMap
attribution; the rest of the site's source licenses are unaffected.
