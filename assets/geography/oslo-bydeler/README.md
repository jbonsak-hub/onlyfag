# Oslo borough quiz map

The fifteen playable boroughs come directly from **Oslo kommune's own
[Bydelsfakta](https://bydelsfakta.oslo.kommune.no/)** application, not a traced
image or an approximate drawing. Sentrum and Marka appear as surrounding land;
they are not additional borough answers.

## Borough boundaries

- Publisher: Oslo kommune.
- Repository: [oslokommune/bydelsfakta](https://github.com/oslokommune/bydelsfakta).
- Pinned revision: `eede9692da0d399b0dcbaa7738d4ed95e3debb15`.
- Original file: [src/config/geoData/oslo.js](https://github.com/oslokommune/bydelsfakta/blob/eede9692da0d399b0dcbaa7738d4ed95e3debb15/src/config/geoData/oslo.js),
  the official map's fifteen borough polygons.
- License: MIT, copyright © 2019 Oslo kommune; the complete notice is included
  in [sources/OSLO-KOMMUNE-LICENSE.txt](sources/OSLO-KOMMUNE-LICENSE.txt).

The original JavaScript export contains GeoJSON for fifteen boroughs. Its
unchanged coordinates are stored in `sources/oslo-boroughs.geojson.gz`;
metadata records the source commit and original file SHA-256
`8e74c5eb9c22e3ee39cfda0454da146f38732b04b3272bd4a86c8d0d16419c2a`.
The uncompressed stored JSON, including provenance metadata, has SHA-256
`6ecb3792176b92d7a718668be8da6dc34f3b841cdb4697cf480a2b6443eef0b4`.

The build projects WGS84 coordinates to ETRS89 / UTM zone 33N (EPSG:25833).
Quiz contours are **not simplified**. Islands and fjord shorelines are
retained. The official borough polygons are used directly, avoiding artificial
internal cracks that appear if the source application's 96 independently
drawn subdistricts are dissolved instead.

Independently drawn neighbouring boroughs have small overlaps (39,231.94 m²)
and 53 narrow enclosed gaps (48,968.88 m²). The build polygonizes their
existing official edges into non-overlapping faces. Overlapping faces keep
the lower-numbered borough; each narrow gap joins the borough sharing its
longest edge. A centimetre tolerance is used only to compare coincident edge
lengths after projection. This repairs less than 0.06% of the combined land
area, preserves the official linework rather than drawing replacement
straight lines, and gives each position one answer. The repaired areas and
gap count are recorded in `map.json`. Source changes introducing wider or
larger gaps fail the build's validation instead of silently filling them.

The display name `St. Hanshaugen` adds a space to the source label
`St.Hanshaugen`.

## Water and surrounding land

Water uses the same pinned, unsimplified **Kartverket N1000** hydrography as
the municipality quizzes (CC BY 4.0). Seven river/lake features intersect the
playable map. Water is a quiet geographical reference; it does not replace or
obscure the borough boundary overlay.

Surrounding land uses the same Kartverket-derived 2024 municipality vectors
as the municipality quizzes. It includes the rest of Oslo and neighbouring
municipalities, in a different colour from both the quiz targets and the
fjord. Only this non-playable context is simplified, with a 10 metre
tolerance. See the municipality atlas's
[source documentation](../municipalities/README.md) for download references,
source revisions and license details.

The borough source is much more detailed than the N1000 water layer. This
offline quiz is a learning map and does not claim to be a cadastral map.

## Rebuild and verify

From the repository root, using Python with the pinned GIS dependencies:

```sh
python -m pip install -r scripts/municipality-requirements.txt
python scripts/build-oslo-bydeler-assets.py
python scripts/build-oslo-bydeler-assets.py --check
```

No network access is required. The builder validates the fifteen borough
codes, valid and disjoint playable polygons, the number and narrowness of
repaired gaps, the maximum repair area and the presence of river/lake context.
The resulting `map.json` uses the same SVG data contract and quiz renderer as
the municipality maps.
