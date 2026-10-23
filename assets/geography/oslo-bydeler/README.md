# Oslo area quiz map

The current dataset is a **polygon-only** learning map. Boroughs, neighbouring
municipalities, Bærum postal regions, named forests and lakes use sourced map
outlines. There are no circle buffers, invented town limits or point-marker
substitutes. Overlapping geographical levels, such as Bygdøy and Frogner or a
forest inside a municipality, remain separate quiz targets.

The current crop has **57 targets**: 42 land areas, four named woodland regions
and eleven lakes. The woodland regions are Nordmarka, Østmarka, Lillomarka and
Bærumsmarka. Bærum's named urban regions use postal-place boundaries and are
identified as **Postområde** in the question prompt.

`oslo.json` is the current dataset, using ruleset `oslo-areas-v3`. Previously
published `map.json` (16 areas) and `oslo-00fc86a8a4bf.json` (28 targets) remain
unchanged for cached older game scripts and their separate ranking pools. The
asset builder produces an immutable, content-hashed file for each new dataset.

## Fixed crop and projection

The crop follows the red rectangle supplied for the existing map. Its fixed
ETRS89 / UTM zone 33N bounds are:

```
xmin 248610.72742114664   ymin 6636516.482282372
xmax 279669.4171429286    ymax 6659260.669574317
```

This is approximately **31.06 km west–east by 22.74 km north–south**, with an
aspect ratio of 1.366. The map stays north-up in its metric projection; shapes
are not stretched to fill the display. Every target is intersected with the
same rectangle. A cropped municipality or forest retains its real boundary
within the frame, and its answer/hint point lies inside its largest remaining
polygon. `clipped` and `visibleShare` record the crop in the JSON data.

The SVG viewBox excludes the generic canvas's 16-unit padding, so clipped
geography meets the actual viewport edges. Rectangle edges are removed from
the bright administrative overlay: clipping does not invent administrative
boundaries inside the map.

## Boroughs, Sentrum and Bygdøy

The fifteen ordinary borough polygons come from **Oslo kommune's
[Bydelsfakta](https://bydelsfakta.oslo.kommune.no/)** application:

- Repository: [oslokommune/bydelsfakta](https://github.com/oslokommune/bydelsfakta).
- Pinned revision: `eede9692da0d399b0dcbaa7738d4ed95e3debb15`.
- Borough file: [src/config/geoData/oslo.js](https://github.com/oslokommune/bydelsfakta/blob/eede9692da0d399b0dcbaa7738d4ed95e3debb15/src/config/geoData/oslo.js).
- Bygdøy file: [src/config/geoData/frogner.js](https://github.com/oslokommune/bydelsfakta/blob/eede9692da0d399b0dcbaa7738d4ed95e3debb15/src/config/geoData/frogner.js),
  selecting the named subdistrict `Bygdøy` (`0301050501`).
- License: MIT, copyright © 2019 Oslo kommune; full notice is included in
  [sources/OSLO-KOMMUNE-LICENSE.txt](sources/OSLO-KOMMUNE-LICENSE.txt).

Unchanged source coordinates and original-file checksums are stored in
`sources/oslo-boroughs.geojson.gz` and `sources/bygdoy.geojson.gz`. The borough
source's original JavaScript file has SHA-256
`8e74c5eb9c22e3ee39cfda0454da146f38732b04b3272bd4a86c8d0d16419c2a`.

Quiz outlines are not simplified. The builder repairs small source overlaps
(39,231.94 m²) and 53 narrow enclosed gaps (48,968.88 m²) by polygonizing their
existing edges. This changes less than 0.06% of the combined borough area.
Overlaps keep the lower borough number; narrow gaps join the polygon sharing
the longest edge. Checks reject unexpectedly large gaps. Bygdøy is clipped to
Frogner; its bright inland edge excludes a 250-metre coastal comparison band,
while its actual playable outline remains intact. The source label
`St.Hanshaugen` is displayed as `St. Hanshaugen`.

Sentrum is a separate statistical area. Its inland edges follow the official
borough outlines. The builder subtracts them from the pinned Kartverket-derived
Oslo land polygon and selects the connected city-centre component. The seaward
edge therefore follows the municipality atlas's coastline. An area check
rejects an implausible result (the component is about 1.87 km²).

## Neighbouring municipalities

Nesodden, Lørenskog, Nordre Follo, Lillestrøm, Rælingen, Nittedal and Enebakk use
real **2024 municipality** polygons from the existing Kartverket-derived atlas.
Their visible pieces each cover more than ten square kilometres in the fixed
crop. Asker's much thinner western corner remains background land. Cropping
keeps the significant northern part of Nesodden without expanding the map to
the municipality's southern tip.

Original source revisions, licenses and checksums are documented in the
[municipality atlas](../municipalities/README.md). Only background context is
simplified, with ten-metre tolerance; quiz geometries retain source detail.

## Bærum postal regions

The western areas use a **consistent 2024 poststed partition** from Posten
Norge/Kartverket, rather than mixing arbitrary town buffers with statistical
areas from another year. This includes the actual named Fornebu, Bekkestua,
Lysaker and Sandvika regions, as well as other substantial postal regions in
the frame. These are postal boundaries, not legal neighbourhood boundaries.
The data records `category: "postal-area"` and `boundaryType: "poststed"`.

- Repository: [carestad/norwegian-geodata](https://github.com/carestad/norwegian-geodata).
- Pinned revision: `b8080052824bc623c188e834d64ad378a8a6c67b`.
- Original file: `postal-codes.json.gz`, dated 2024-01-28.
- Original SHA-256: `1808ce7bf528189719994971f33781690d9112e00636040f46b81a10e6cb525a`.
- [Official Postnummerområder metadata](https://kartkatalog.geonorge.no/metadata/postnummeromraader/462a5297-33ef-438a-82a5-07fff5799be3).

The original Bærum records and their provenance are preserved in
`sources/baerum-areas-postal-source-2024.json.gz`; dissolved regions are in
`sources/baerum-areas-postal-localities.geojson.gz`. The mirror's MIT notice and
additional source notes are included in `sources/baerum-areas-postal-LICENSE.txt`
and `sources/baerum-areas-README.md`.

Postal polygons are clipped to Bærum's actual municipal land before the map
crop, excluding postal-area sea surfaces. Tiny remaining fragments below
0.15 km² are not targets. Fragments smaller than 0.5 km² must retain at least
15% of their coastal land area to be included. No postal boundary is drawn
by hand.

## Forest and water polygon layers

Named forests and finer lake outlines are read from the pinned polygon layers
`sources/forests-quiz-polygons.geojson.gz` and
`sources/water-quiz-polygons.geojson.gz`. Each layer retains its original CRS,
source metadata, license and named polygon features. These are clipped to the
map frame; a missing source cannot silently turn into a point or buffer.
The builder requires genuine Nordmarka, Østmarka and Sognsvann polygons.

These two layers preserve actual **OpenStreetMap** way/relation geometry from
the snapshot with base timestamp `2026-10-23T14:40:06Z`. The four woodland
regions are mapped `place=woodland` areas, not statutory Markaloven boundaries
or individual tree-cover parcels. The finer water layer includes Sognsvann,
Nøklevann, Østensjøvannet, Lutvann, Steinbruvann, Dælivannet, Øvresetertjern,
Store Åklungen and Lille Åklungen, retaining 42 island holes. Complete raw
responses, checksums, object versions and deterministic offline converters
are delivered with the sources; no point, buffer or invented edge is used.
See [woodland provenance](sources/forests-README.md) and
[lake provenance](sources/water-polygons-README.md).

The OSM source database and derived layers are available under **ODbL 1.0**,
© [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
The interactive map retains visible attribution. Source notices are in
[OSM-ODbL-NOTICE.txt](sources/OSM-ODbL-NOTICE.txt) and
[water-polygons-LICENSE.txt](sources/water-polygons-LICENSE.txt).

Bogstadvannet, Maridalsvannet and Nøklevann also have full polygons in the
existing **Kartverket N1000 Kartdata 2025** hydrography (CC BY 4.0). They are
selected using known interior points with checks that identify one source
lake. A finer named water source takes precedence where available. Named
lakes are removed from decorative water so grading colours remain visible.
Other water and river features use the existing pinned hydrography.

All active targets have a closed polygon path, with `kind` equal to `land`,
`forest` or `lake`. The previous reference-point files are retained only as
historical source documentation; they are not used by this ruleset.

## Rebuild

From the repository root:

```sh
python -m pip install -r scripts/municipality-requirements.txt
python scripts/build-oslo-bydeler-assets.py
python scripts/build-oslo-bydeler-assets.py --check
```

The build is offline and deterministic. It verifies source IDs, topology
repairs, Sentrum's area, postal and lake matches, the required named polygon
targets, unique names, fixed crop, projection and representative points. Missing
forest or small-lake polygon sources fail the build. This learning map does
not claim to be a cadastral or surveying map.
