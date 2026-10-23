# Oslo area quiz map

The current dataset is a **polygon-only, generalized learning map** with
**35 targets**: 28 land areas, four named woodland regions and three lakes.
The land targets are Oslo's fifteen boroughs and Sentrum, Bygdøy, four
neighbouring municipalities, the grouped learning region **Østre Bærum**, and
six named Oslofjord islands. Overlapping geographical levels, such as Bygdøy
and Frogner or a forest inside a municipality, remain separate quiz targets.

Source coastlines and polygon boundaries anchor the map. Small unassigned land
pieces are absorbed into neighbouring learning areas, inland holes are filled,
and individual eastern Bærum postal areas form one question. These deliberate
generalizations reduce visual fragmentation; the resulting learning areas are
not a claim about legal district boundaries or exact land cover. There are no
point-marker substitutes, circle buffers or hand-drawn island coastlines.

`oslo.json` is the current dataset, using ruleset `oslo-areas-v4`. Previously
published `map.json` (16 areas), `oslo-00fc86a8a4bf.json` (28 targets), and
`oslo-fa9842cf0c7a.json` (57 targets, `oslo-areas-v3`) remain unchanged for cached
older game scripts and their separate ranking pools. Keep these snapshots and
all previously published browser resource hashes. The asset builder produces
an immutable, content-hashed file for each new dataset.

## Fixed crop and projection

The crop follows the original rectangle and the later user annotation moving
its eastern edge westward. Its fixed ETRS89 / UTM zone 33N bounds are:

```
xmin 248610.72742114664   ymin 6636516.482282372
xmax 274430.0             ymax 6659260.669574317
```

This is approximately **25.82 km west–east by 22.74 km north–south**, with an
aspect ratio of 1.135. The map stays north-up in its metric projection; shapes
are not stretched to fill the display. Every target is intersected with the
same rectangle. Answer/hint points prefer a visible part of a parent area
outside overlying forests or Bygdøy. `clipped` and `visibleShare` describe the
initial crop, before subsequent learning-area gap allocation and lake/island
subtraction.

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

The initial borough reconstruction repairs small source overlaps
(39,231.94 m²) and 53 narrow enclosed gaps (48,968.88 m²) by polygonizing their
existing edges. This changes less than 0.06% of the combined borough area.
Overlaps keep the lower borough number; narrow gaps join the polygon sharing
the longest edge. Checks reject unexpectedly large gaps at this source-repair
stage. The later learning-area generalization is separate and described below.
Bygdøy starts from its sourced intersection with Frogner; its bright inland
edge excludes a 250-metre coastal comparison band. The source label
`St.Hanshaugen` is displayed as `St. Hanshaugen`.

Sentrum is a separate statistical area. Its inland edges follow the official
borough outlines. The builder subtracts them from the pinned Kartverket-derived
Oslo land polygon and selects the connected city-centre component. The seaward
edge therefore follows the municipality atlas's coastline. An area check
rejects an implausible result (the component is about 1.87 km²).

## Neighbouring municipalities

Nesodden, Lørenskog, Nordre Follo and Nittedal use **2024 municipality** polygons
from the existing Kartverket-derived atlas, with inland water holes omitted
from the generalized land layer. Lillestrøm, Rælingen and Enebakk are no longer
questions after the tighter eastern crop and target reduction. Remaining
outside land is quiet context. Cropping keeps the northern part of Nesodden
without expanding the map to the municipality's southern tip.

Original source revisions, licenses and checksums are documented in the
[municipality atlas](../municipalities/README.md). The six separately selectable
islands replace the atlas's coarser island components with the pinned OSM
coastlines described below; this avoids pale duplicate shoreline fringes.

## Østre Bærum and the western playable boundary

The single **Østre Bærum** target groups a consistent **2024 poststed partition**
from Posten Norge/Kartverket. It combines Bekkestua, Høvik, Hosle, Eiksmarka,
Østerås, Jar, Stabekk, Lysaker, Fornebu and Snarøya. Høvikodden is first merged
into Høvik. These names are source constituents, not ten separate questions.
The grouped target records `boundaryType: "learning-area"`: it is neither the
whole Bærum municipality nor an official district.

The source union is clipped to Bærum land and generalized to absorb inland
holes. Its western frontier follows the retained Bekkestua/Høvik-side postal
areas. Sandvika, Blommenholm, Gjettum, Haslum, Kolsås, Bærums Verk, Lommedalen and
the other excluded western areas are not quiz targets. Outside western land,
including Asker, has one uniform, noninteractive context appearance without
the former postal subdivision lines. Bærumsmarka is clipped against this same
western learning boundary.

Small land pockets enclosed by a woodland polygon after western-mask clipping
are absorbed into that woodland learning area as well. This removes inland
postal/source exclusion speckles without moving its outer western frontier or
painting across sea. The three explicit lakes are subtracted afterwards.

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

Postal polygons are clipped to Bærum's municipal land before the map crop,
excluding postal-area sea surfaces. No guessed town-centre buffers or
hand-drawn postal divisions are used.

## Land-gap cleanup

The builder uses the selected municipality land masks and the Østre Bærum
learning mask to find land left between source layers. Within each selected
municipality, each connected unassigned piece joins the candidate learning
area sharing the longest boundary; disconnected pieces use the nearest
candidate. This allocates existing source land rather than drawing across
open sea. The allocations include larger residual woodland areas as well as
tiny slivers, so they are a learning generalization rather than solely a
numerical topology repair.

Explicit island targets and the three retained lake polygons take precedence
over parent land and woodland targets. Administrative overlay lines beneath
woodland are suppressed to prevent a single forest from appearing divided
into many questions. The JSON records allocation counts and areas in `stats`
and `source.learningGeneralization`, and the build rejects unassigned land
inside the selected playable domain.

## Six named islands

Langøyene, Gressholmen, Lindøya, Malmøya, Ulvøya and Ormøya each have their own
polygon target. Their complete coastlines come from pinned **OpenStreetMap**
API full-object responses retrieved on 23 October 2026. The raw snapshots,
request index, exact object/node versions and SHA-256 checksums accompany
`sources/islands-quiz-polygons.geojson.gz` and its deterministic offline
converter, `sources/build-island-source.py`.

Gressholmen follows the source's connected Gressholmen/Rambergøya/Heggholmen
landmass as one target; no arbitrary internal border splits these connected
parts. The six island targets are mutually disjoint. See
[island provenance](sources/islands-README.md) and
[island license](sources/islands-LICENSE.txt) for object IDs, versions and
source limitations. The island database and derived layer use **ODbL 1.0**,
© OpenStreetMap contributors.

## Forest and water polygon layers

The four named woodland targets are Nordmarka, Østmarka, Lillomarka and
Bærumsmarka. Forests and finer lake outlines are read from the pinned layers
`sources/forests-quiz-polygons.geojson.gz` and
`sources/water-quiz-polygons.geojson.gz`. Each layer retains its original CRS,
source metadata, license and named polygon features. These are clipped to the
map frame; a missing source cannot silently turn into a point or buffer.
The source layers remain complete even when a source feature is no longer a
question in this version.

These two layers preserve actual **OpenStreetMap** way/relation geometry from
the snapshot with base timestamp `2026-10-23T14:40:06Z`. The four woodland
regions are mapped `place=woodland` areas, not statutory Markaloven boundaries
or individual tree-cover parcels. Their learning geometries fill inland holes
and can absorb adjacent unallocated land according to the cleanup above; they
must not be presented as an exact woodland-cover survey. The finer source
water layer includes Sognsvann,
Nøklevann, Østensjøvannet, Lutvann, Steinbruvann, Dælivannet, Øvresetertjern,
Store Åklungen and Lille Åklungen, retaining 42 island holes. Complete raw
responses, checksums, object versions and deterministic offline converters
are delivered with the sources. These archived source features are retained
for provenance and reproduction of historical maps.
See [woodland provenance](sources/forests-README.md) and
[lake provenance](sources/water-polygons-README.md).

The OSM source database and derived layers are available under **ODbL 1.0**,
© [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
The interactive map retains visible attribution. Source notices are in
[OSM-ODbL-NOTICE.txt](sources/OSM-ODbL-NOTICE.txt) and
[water-polygons-LICENSE.txt](sources/water-polygons-LICENSE.txt).

Only **Bogstadvannet, Sognsvann and Maridalsvannet** are lake targets in the
current learning map. Bogstadvannet and Maridalsvannet use full polygons in the
existing **Kartverket N1000 Kartdata 2025** hydrography (CC BY 4.0). They are
selected using known interior points with checks that identify one source
lake. Sognsvann uses its finer pinned OSM polygon. These three polygons are
subtracted from parent land/forest targets and drawn as selectable lakes.
Other lakes, ponds and rivers are omitted from this learning map; `water` is
empty, so they are not decorative white/blue fragments or extra questions.
The sea and coastline remain visible.

All active targets have a closed polygon path, with `kind` equal to `land`,
`forest` or `lake`. The previous reference-point files are retained only as
historical source documentation; they are not used by this ruleset.

## Rebuild

From the repository root:

```sh
export PYTHONPATH=/workspace/shared/municipality-python-deps${PYTHONPATH:+:$PYTHONPATH}
python3 -B assets/geography/oslo-bydeler/sources/build-island-source.py --check
python3 -B assets/geography/oslo-bydeler/sources/forests-prepare.py --check
python3 -B assets/geography/oslo-bydeler/sources/build-water-source.py --check
python3 -B scripts/build-oslo-bydeler-assets.py
python3 -B scripts/build-oslo-bydeler-assets.py --check
```

The build is offline and deterministic. It verifies source IDs, topology
repairs, Sentrum's initial area, postal and lake matches, all 35 required
polygon targets, unique names, fixed crop, projection, representative points
and complete playable-land coverage. Missing polygon sources fail the build.
GIS dependencies are installed outside the checkout by the environment's
saved installation script. Rebuild dependent browser assets and score data
after an authorized map change, retaining all historical map/resource hashes
and the independent 16-, 28- and 57-target ranking pools. This learning map does
not claim to be a cadastral or surveying map.
