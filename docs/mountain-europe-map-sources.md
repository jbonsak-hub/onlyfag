# Kart: mountain ranges and European water bodies

`scripts/build-mountain-europe-maps.cjs` creates
`assets/geography/physical-maps/mountain-europe.json` entirely offline. It contains
two unlabelled, zoomable SVG maps: **Verdens fjellkjeder** (24 targets) and
**Europas elver, innsjøer og hav** (72 targets: 29 rivers, nine lakes and 34 marine
water bodies). Names are supplied in Norwegian and English. The game engine,
controls, scoring and SVG construction are independent implementations.

## Geographic sources and reuse

All feature geometry comes from the public-domain
[Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) project,
downloaded from the project's own
[natural-earth-vector repository](https://github.com/nvkelso/natural-earth-vector)
on 22 October 2026:

- [10m geographic region polygons](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_geography_regions_polys.geojson): all 24 mountain ranges.
- [10m marine polygons](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_geography_marine_polys.geojson): sea, gulf and strait boundaries.
- [10m rivers and lake centerlines](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_rivers_lake_centerlines.geojson) and [supplementary European rivers](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_rivers_europe.geojson): river courses.
- [10m lakes](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_lakes.geojson): the nine lake outlines.
- The existing local Natural Earth country snapshot in `core.js`: muted land
  and country borders. No remote tiles or runtime map requests are required.

The builder embeds a gzip/base64 extract of the **selected source coordinates**,
rounded to five decimal places. It does not require the complete Natural Earth
download to rebuild. The output rounds projected SVG coordinates to 0.01 viewBox
units. Source polygons, river meanders and lake shorelines remain vectors at
every zoom level.

## Inventories and cartographic choices

The user's [world mountain-range example](https://lizardpoint.com/geography/world-mountains-quiz.php)
provided the 24-feature inventory, rather than source geometry or code:
Alps, Altai, Andes, Appalachians, Atlas, Caucasus, Drakensberg, Eastern Ghats,
Great Dividing Range, Himalayas, Hindu Kush, Karakoram, MacDonnell Ranges,
Pyrenees, Rockies, Rwenzori, Scandinavian Mountains, Sierra Madre, Sierra Nevada,
Taurus, Tian Shan, Urals, Western Ghats and Zagros. Sierra Madre combines the
Occidental, Oriental and del Sur source polygons. Sierra Nevada is the Californian
range, not its Spanish namesake. The Western Ghats include the source's Southern
Ghats segment. Range extents are broad geographic teaching polygons, not exact
geological or administrative boundaries. They receive an ochre fill and outline
in the shared game renderer.

The [European water-body example](https://lizardpoint.com/geography/europe-water3-quiz.php)
has a public geographic-name inventory containing 34 marine features and 29
rivers. These names were checked for coverage; its image maps, coordinates,
JavaScript game logic and artwork were not copied. This version adds Ladoga,
Onega, Vänern, Saimaa, Peipus, Geneva, Constance, Balaton and Mälaren to satisfy
the requested European lakes component.

Most named seas use Natural Earth's marine polygons. Six small teaching regions
not present as separate Natural Earth features use independently drawn geographic
envelopes: Celtic Sea, St. George's Channel, Sea of the Hebrides, North Channel,
Strait of Dover and Gulf of Venice. The renderer clips all marine targets to the
water area of the same land backdrop. Their open-water dividing lines are
cartographic conventions, not national or jurisdictional boundaries. Larger seas
are ordered before the named sub-seas so the smaller target remains clickable.
Representative open-water hint points avoid the parent sea's named sub-seas.

Natural Earth's native `Enipefs` river feature is identified as `Pineios` in its
English/Wikidata metadata and reaches the Thessalian Pinios mouth. This is the
Pinios teaching target; the unrelated upstream Enipeas portion is cut south of
39.56°N, leaving the identifiable lower Pinios course to the Aegean.
River names use the commonly recognised Norwegian form, with modern `Dnipro`
in Norwegian and `Dnieper` in English. `Onegaelva` distinguishes the river from
Onegasjøen.

The world map shares the other physical quizzes' 1000 × 590 viewBox,
equirectangular coordinates, longitude −180…180° and latitude −58…80°.
Antarctica is omitted. Europe uses Lambert azimuthal equal-area centred on
18°E/52°N with a 1000 × 760 viewBox. The geographic source area is wider than
the final rectangular camera; clipping happens in projected coordinates to avoid
the artificial diagonal crop edges of the earlier continent map. Greenland,
Canadian context and Norway's Svalbard components are omitted from this Europe
water backdrop. The land and border backdrop overscans the home viewBox by
1000 units in every direction. Russia and North Africa therefore continue
naturally into the SVG's visible gutters on wide desktop and tall mobile
screens. Foreground target geometry and the 1000 × 760 home framing remain
unchanged; this overscan introduces no additional answers.

Tiny ranges, lakes and straits retain their true polygons and get precise point
markers for accessibility. In particular Bosporus, Dover and Gibraltar remain
discoverable when the full map is fitted to a mobile screen. The renderer enlarges
their touch targets without distorting the geographic outline. Rivers have a
separate transparent hit stroke, while their visible stroke stays narrow and dark.

## Verification

Run:

```sh
node scripts/build-mountain-europe-maps.cjs
node scripts/build-mountain-europe-maps.cjs --check
```

The builder validates exact target counts, unique names, non-empty finite SVG
geometry, hint positions within the viewport, and interior hint positions for
polygon targets. Rivers use the middle of the longest visible segment. The two
maps were also rendered in Edge for visual review of coastline alignment, range
silhouettes, marine nesting and dark river/lake contrast.
