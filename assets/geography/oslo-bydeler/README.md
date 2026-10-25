# Oslo area quiz map

The current dataset is a **polygon-only, generalized learning map** with
**43 targets**: 34 land areas, four named woodland regions and five lakes.
The land targets are Oslo's fifteen boroughs and Sentrum, Bygdøy, five
neighbouring municipalities, the three Bærum postal areas **Eiksmarka, Jar and
Lysaker**, and nine named Oslofjord islands. Overlapping geographical levels,
such as Bygdøy and Frogner or a forest inside a municipality, remain separate
quiz targets.

The optional physical-map background uses locally baked, label-free Kartverket
DTM hillshade in this unchanged UTM coordinate space. Source attribution,
lossless image dimensions, water masks and the separate rendering layer are
documented in [`docs/norway-relief-sources.md`](../../../docs/norway-relief-sources.md).

Source coastlines and polygon boundaries anchor the map. Unassigned mainland
pieces are absorbed into neighbouring learning areas and inland holes are
filled.
Only explicitly named island targets belong to quiz areas; all other
sea islands are quiet, unowned landscape. Lake islands retain their sourced
outline, use the woodland colour, and accept answers for their containing lake. These deliberate generalizations
reduce visual fragmentation; the resulting learning areas are
not a claim about legal district boundaries or exact land cover. There are no
point-marker substitutes, circle buffers or hand-drawn island coastlines.

`oslo.json` is the current dataset, using ruleset `oslo-areas-v5`. Previously
published `map.json` (16 areas), `oslo-00fc86a8a4bf.json` (28 targets),
`oslo-fa9842cf0c7a.json` (57 targets, `oslo-areas-v3`), and
`oslo-8350eadb74db.json` (35 targets, `oslo-areas-v4`) remain unchanged for cached
older game scripts and their separate ranking pools. Keep these snapshots and
all previously published browser resource hashes. The asset builder produces
an immutable, content-hashed file for each new dataset.

## Playable crop, physical context and camera

Quiz targets use a fixed **ETRS89 / UTM zone 33N** (`EPSG:25833`) crop. Its eastern
edge includes the boundary interfaces between Nittedal, Lillestrøm, Lørenskog
and Østmarka:

```
xmin 248610.72742114664   ymin 6600000
xmax 320000              ymax 6700000
```

This is approximately **71.39 km west–east by 100 km north–south**.
The wider source extent continues past the home view at the top, bottom and
right edge, removing the former straight clipping edges. Every
target is intersected with this rectangle. Answer/hint points stay in the original compact Oslo frame and prefer a visible
part of a parent area outside overlying forests or Bygdøy. `clipped` and
`visibleShare` describe the
initial crop, before subsequent learning-area gap allocation and lake/island
subtraction.

The physical backdrop is separate from the playable crop. Its much broader
source bounds are `x = 190000..335000`, `y = 6580000..6720000` in the same CRS.
This provides sourced coastline and mainland context across wide viewports,
including the coast west of the playable areas and land to their east, without
adding questions. Remaining mainland uses a uniform quiet appearance with
optional hover labels `Øvrig Bærum` or `Øvrig Akershus`; unnamed islands have no
area ownership or quiz label. No postal subdivision lines are drawn in context.

The adaptive camera centres on **Oslo S**, at projected coordinates
`(262543.3285145605, 6649176.670870367)`. Its minimum geographic height is
**27 km** and minimum width is approximately **34.252 km**; the viewport's aspect
ratio determines which dimension needs to grow. The map stays north-up with
uniform scaling in both directions, so it fills the available display without
stretching shapes. Resizing the left menu updates the camera around the same
Oslo centre. The broad source backdrop continues behind the resulting view.

The SVG viewBox excludes the generic canvas's 16-unit padding. Crop rectangle
edges are removed from the bright administrative overlay: clipping does not
invent administrative boundaries inside the map.

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

Nesodden, Lørenskog, Nordre Follo, Nittedal and Lillestrøm use **2024
municipality** polygons from the existing Kartverket-derived atlas, with inland water holes omitted
from the generalized mainland layer. Lillestrøm occupies the land between
Nittedal and Lørenskog; those two municipalities do not share a boundary.
Rælingen, Enebakk and other outside land are quiet context, without additional
questions. Cropping keeps the northern part of Nesodden without expanding the
map to the municipality's southern tip.

Original source revisions, licenses and checksums are documented in the
[municipality atlas](../municipalities/README.md). The nine separately selectable
islands replace the atlas's coarser island components with the pinned OSM
coastlines described below; this avoids pale duplicate shoreline fringes.

## Three adjacent Bærum postal areas

**Eiksmarka, Jar and Lysaker** are the only Bærum land targets. They use the
consistent **2024 poststed partition** from Posten Norge/Kartverket. Eiksmarka
adjoins Vestre Aker; Jar and Lysaker adjoin Ullern. Their boundaries follow the
sourced postal polygons, not town-centre buffers or official borough divisions.
The former grouped target **Østre Bærum** belongs only to the preserved v4 map.

The three-area source union is clipped to Bærum's mainland and generalized to
absorb inland holes. Bærumsmarka is clipped against this same western playable
mask. All remaining Bærum land, including Bekkestua, Høvik and Høvikodden, is
quiet context rather than a question. The coastline remains visible farther
west, including outside Bærum, with no extra named quiz areas.

Small land pockets enclosed by a woodland polygon after western-mask clipping
are absorbed into that woodland learning area as well. This removes inland
postal/source exclusion speckles without moving its outer western frontier or
painting across sea. The five explicit lakes are subtracted afterwards.

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

Postal polygons are clipped to Bærum's municipal mainland before the map crop,
excluding postal-area sea surfaces. No guessed town-centre buffers or
hand-drawn postal divisions are used.

## Land-gap cleanup

The builder identifies each municipality's mainland from its largest complete
source polygon **before cropping**, retaining the real coastline. Other sea
island components are excluded from parent land targets and from every gap
assignment domain. No buffers or artificial shoreline connections turn an
island into mainland.

The selected municipal mainland masks and the three-area Bærum mask identify
land left between source layers. Within each selected municipality, each
connected unassigned mainland piece joins the candidate learning area sharing
the longest boundary; remaining disconnected mainland fragments use the
nearest candidate. This allocates existing source mainland rather than drawing
across open sea or assigning unrelated islands. The allocations include larger
residual woodland areas as well as tiny slivers, so they are a learning
generalization rather than solely a numerical topology repair.

Explicit island targets and the five retained lake polygons take precedence
over parent land and woodland targets. Islands inside the retained lakes are
also removed from all parent targets and remain quiet, unowned landscape.
Administrative overlay lines beneath woodland are suppressed to prevent a
single forest from appearing divided
into many questions. The JSON records allocation counts and areas in `stats`
and `source.learningGeneralization`, and the build rejects unassigned land
inside the selected playable domain.

## Nine named islands

Langøyene, Gressholmen, Lindøya, Malmøya, Ulvøya, Ormøya, Hovedøya, Nakholmen
and Bleikøya each have their own polygon target. Their complete coastlines
come from pinned **OpenStreetMap**
API full-object responses retrieved on 23 October 2026. The raw snapshots,
request index, exact object/node versions and SHA-256 checksums accompany
`sources/islands-quiz-polygons.geojson.gz` and its deterministic offline
converter, `sources/build-island-source.py`.

Gressholmen follows the source's connected Gressholmen/Rambergøya/Heggholmen
landmass as one target; no arbitrary internal border splits these connected
parts. **Malmøykalven belongs to the Malmøya target**: its separately sourced
polygon joins Malmøya as a multipart geometry without an invented land bridge.
Hovedøya, Nakholmen and Bleikøya are independent targets, not parts of a mainland
borough. The nine island targets are mutually disjoint. All other sea and lake
islands remain visible as quiet landscape and belong to no quiz target. See
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

Only **Bogstadvannet, Sognsvann, Maridalsvannet, Lutvann and Nøklevann** are lake
targets in the current learning map. Bogstadvannet and Maridalsvannet use full polygons in the
existing **Kartverket N1000 Kartdata 2025** hydrography (CC BY 4.0). They are
selected using known interior points with checks that identify one source
lake. Sognsvann, Lutvann and Nøklevann use their finer pinned OSM polygons.
These five polygons are subtracted from parent land/forest targets and drawn
as selectable lakes.
Other lakes, ponds and rivers are omitted from this learning map; `water` is
empty, so they are not decorative white/blue fragments or extra questions.
The sea and coastline remain visible. Source lake-island holes retain their
physical outlines but do not become part of a surrounding land or forest target.

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
repairs, Sentrum's initial area, postal and lake matches, all 43 required
polygon targets, unique names, fixed playable crop, projection, representative
points and complete playable-mainland coverage. It also checks that unnamed
islands are excluded from parent targets. Missing polygon sources fail the build.
GIS dependencies are installed outside the checkout by the environment's
saved installation script. Rebuild dependent browser assets and score data
after an authorized map change, retaining all historical map/resource hashes
and the independent 16-, 28-, 57- and 35-target ranking pools. This learning map
does not claim to be a cadastral or surveying map.

The Oslo side panel defaults to 386 px on desktop, with a separate saved width
preference. The panel remains resizable and retains the mobile layout.
