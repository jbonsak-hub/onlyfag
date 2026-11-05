# Vassdrag og nedbørfelt — interactive river map

Entry point: `/geografi/vassdrag.html`.

The main geography navigation embeds this page at
`/geografi.html#ytre-vassdrag`, under Ytre krefter og landformer. The frame loads
on entry, suspends animation while another section is open, and retains its
state on return. The prototype copy has been removed.

Vanndråper dims the river network even before a basin is selected, so the rain
particles stand out across the complete overview. Glomma uses blue and the
Drammen network uses a warmer pink; these display colors do not change source
geometry or routing. The moving label follows precomputed local waterbody
intervals: detailed Vann-Nett reaches split collective ELVIS route names, and
named NVE lake polygons take priority over river labels. A shoreline tolerance
of up to 20 m accommodates display simplification, with a smaller tolerance for
small lakes. Unresolved local river names are
labeled Navnløs elv instead of a collective catchment name. The data sources,
matching tolerances, coverage limits and pins are in `sources/names/README.md`.

The standalone explorer renders up to 2,698 real Norwegian river networks as coloured
lines on a dark, north-up canvas. It starts with no selected river, a complete
regional overview and rain enabled. Select a represented river or one of the
preset starts to follow a downstream journey. Speed, rain particles,
upstream highlighting, wheel/pinch zoom, pointer pan and keyboard controls are
local to this module; it has no game scores, accounts or server mutations.

## Regional loading

Only the small versioned manifest and the selected South chunk load initially.
Each checkbox fetches its immutable region once, retains the downloaded graph
in memory, and removes its rivers and start choices when unchecked. Whole
families remain together; no journey is split at a loading boundary. A failed
optional download preserves the active graph and can be retried. Removing the
region of the selected river clears that selection. All three can be unchecked.

| Region | Basins | Segments | JSON | Approximate gzip |
|---|---:|---:|---:|---:|
| Sør-Norge (default) | 1,040 | 14,479 | 12.15 MB | 3.80 MB |
| Midt-Norge | 348 | 4,899 | 4.07 MB | 1.26 MB |
| Nord-Norge | 1,310 | 10,863 | 10.48 MB | 3.03 MB |

The groups cover mainland Norway and coastal islands, including cross-border
catchments; Svalbard is outside the source extent. The existing 5 km route or
2 km² catchment selection still applies, so this is not every tiny brook.
Mapped endpoints in Sweden/Finland are not presented as Norwegian sea mouths.

Kartstil is the sole background selector. Background tiles are always limited
to selected region extents and the visible viewport; panning over an unselected
region downloads no tiles there. Removing a region cancels its pending tile
requests, and cached imagery is clipped to the selected extents. No whole-country
raster download or background prefetch runs at startup. Changing regions retains
the chosen topographic, hiking, relief or dark background.

All chunks share the original southern EPSG:25833 anchor and uniform scale.
Activating a northern region changes only the camera's fitting bounds, never
the physical position of existing rivers, junctions, labels or background tiles.
`scripts/build-watershed-regions.py` verifies pinned sources, annotates local
names offline, and generates three content-addressed files plus `regions.json`.
Run it with `--check` for reproducibility, then run
`node scripts/build-drop-prototype-assets.cjs` to update asset references.
The legacy `data.json` is retained for cached older pages and source regression
checks; the current browser does not download it.

Rain continuously renews a bounded pool of drops in tributaries and headwaters,
following the same verified downstream links. It continues after the selected
journey arrives. The rain button visibly shows On/Off; there are no separate
Pause or Replay buttons. Normal speed is half the previously published normal
(the original 2×), with 0.5×, 1×, 2× and 4× choices. Reduced-motion preferences prevent initial autoplay; an
explicit rain choice or river selection can start the animation.
The static canvas cache resets opacity before each background fill, so fast
pan/zoom fully replaces the previous camera's image.

## Cartographic controls

The independent “Kartstil” panel adjusts river width (0.5–4×), intensity
(20–100%) and background visibility (0–100%). A subtle dark casing keeps rivers
legible on pale backgrounds. Background images are composed at full opacity in
one intermediate canvas, then blended exactly once; cached fallback tiles never
compound the opacity. At zero opacity the background is hidden and further tile
requests stop. “Bare valgt vassdrag” isolates its river family, including rain
and river picking. These controls do not restart the selected journey.

The 220-pixel control panel contains the “Nedbørfelt” and “Vanndråper” modes,
search, an initially empty river picker, rain and speed. The selected basin's
name appears under the masthead, rather than taking up panel space. Defaults
match the owner's map: river width 1.1×, intensity 82%, background opacity 73%,
dark river map, and height colors ready for the relief layer. Filtering to a
single basin is disabled until a basin has been selected. Rain also works in
small coastal basins consisting of just one segment.

The top “Dråpen” button independently shows or hides the control panel, and
“Kartstil” toggles its own panel. Both panels have drag handles that support
mouse, touch and keyboard arrows (Shift for larger steps). Their locations are
retained while hidden and clamped inside the viewport after resizing. Panel
positions are independent of the map camera; showing, hiding or moving them
does not restart or relocate the journey. The map can zoom out to 20% of its
initial fitted scale. A projected metric scale and north
arrow are drawn into the map. PNG export includes the current rendered map,
title, source credits and the elevation key when enabled. Export waits for
visible tiles and reports download errors next to its button.

The optional height colors apply only to terrain relief. They use **actual
elevations**, not brightness estimated from hillshade. Kartverket's public
[DTM ImageServer](https://hoydedata.no/arcgis/rest/services/DTM/ImageServer)
serves `exportImage` PNG32 images on the same EPSG:25833 grid. A fixed `Stretch`
with statistics 0–2500 m, `DRA:false`, and an explicit natural multipart color
ramp gives the same height the same color in every tile. Palette anchors are
0, 500, 1000, 1500, 2000 and 2500 m; values outside the range clamp at its ends.
The color images are multiplied with the existing relief to retain landforms.
Color tiles use matrix level 5 or finer because larger source mosaics can exceed
the service's limits. Linked Kartverket attribution remains visible and is
included in exports.

The adjacent height-colour intensity slider ranges from 0–300%, default 100%.
The fixed palette uses green at 0–500 m, brown at 1000–1500 m and near-white
at 2000–2500 m, with continuous transitions between these anchors.
It adjusts saturation and (above 100%) contrast of the elevation overlay locally,
before hillshade composition. The screen/export keys use the same filter;
river colours and source imagery remain untouched, and no new tile requests
are needed. At 100%, the original rendering is restored exactly.

The dynamically colored WMS layer was deliberately excluded: equal-resolution
nested sample requests assigned different colors to the same geographic pixels.
The fixed-statistics REST rule passed a pixel-identical overlap check.

## Background maps

The background selector offers the original dark river map, Kartverket's
topographic `topo` and tour-map `toporaster` layers, and real terrain relief
(`DTM:multiskyggerelieff`). “Vis elver” hides the complete river overlay to
inspect the underlying landscape without changing the camera or journey.
Terrain relief makes ridges visible; it does not compute drainage divides.

Maps load only after a background is selected. Linked `© Kartverket` attribution
appears with the map. The terrain overview uses 109 pinned, unmodified PNG
responses (2.56 MB for the full stored set): hillshade at levels 3–5 and elevation
colours at level 5. Only visible tiles within selected regions are requested.
No image is resized or recompressed. Higher detail and topographic/hiking maps
continue to use the original official services. A failed local image falls back
to its exact original request. Source URLs, hashes, 256-pixel dimensions and
licence are recorded in [terrain-cache/README.md](terrain-cache/README.md).

The queue starts near the viewport centre and reserves capacity for both
hillshade and elevation colours, with at most eight images overall and four per
terrain layer. Pan, zoom and layer changes cancel obsolete pending requests;
ready images remain cached for revisits and geographic fallback. Decoded tiles
are capped at 160 after each repaint. No API key, backend proxy or new library
is required. The dark map works without remote services.

- [WMTS service and capabilities](https://cache.kartverket.no/):
  `https://cache.kartverket.no/v1/wmts/1.0.0/{layer}/default/utm33n/{matrix}/{row}/{col}.png`
- UTM33 matrix `00`–`18`, EPSG:25833, origin `[-2500000,9045984]`,
  256-pixel tiles, `21664 / 2^level` metres per pixel.
- [Terrain WMS](https://wms.geonorge.no/skwms1/wms.hoyde-dtm?service=WMS&request=GetCapabilities):
  WMS 1.3.0, EPSG:25833, matching tile BBOX, 256×256 transparent PNG.
- [Kartverket terms and attribution](https://www.kartverket.no/api-og-data/vilkar-for-bruk).

The normalized source coordinates are converted back to projected metres using
`source.projectedBounds` and `unitsPerKm`. Both the tile grid and river geometry
use the same UTM33 camera; there is no reprojected or stretched approximation.

This is a **river-network map**, not arbitrary overland rainfall routing.
Catchment boundary polygons are deliberately absent: the available broader NVE
vassdragsområder do not equal these exact river-family catchments. “Nedbørfelt”
therefore highlights contributing river lines rather than inventing
a precise upstream land polygon. Unresolved branches remain visible and explain
their limitation when selected; drops never jump to a nearby unrelated river.
The journey's pace is illustrative, not a physical water travel-time model.

Data provenance, licence, measured directions, exact junction handling and
limitations are documented in [sources/README.md](sources/README.md). All
ordinary builds are offline from the pinned compact snapshot.

```sh
PYTHONPATH=/workspace/shared/municipality-python-deps python3 -B scripts/build-drop-prototype-data.py --check
PYTHONPATH=/workspace/shared/municipality-python-deps python3 -B scripts/build-watershed-regions.py --check
node scripts/build-drop-prototype-assets.cjs
node scripts/build-drop-prototype-assets.cjs --check
node scripts/fetch-watershed-terrain-cache.cjs --check
node tests/watershed-regions-data.cjs
BROWSER_EXECUTABLE=/usr/bin/chromium node tests/watershed-regions.cjs
BROWSER_EXECUTABLE=/usr/bin/chromium node tests/drop-default-view.cjs
BROWSER_EXECUTABLE=/usr/bin/chromium node tests/watershed-embed.cjs
BROWSER_EXECUTABLE=/usr/bin/chromium node tests/drop-basemap.cjs
BROWSER_EXECUTABLE=/usr/bin/chromium node tests/drop-map-style.cjs
BROWSER_EXECUTABLE=/usr/bin/chromium node tests/watershed-map-loading.cjs
BASE_URL=http://127.0.0.1:58390 BROWSER_EXECUTABLE=/usr/bin/chromium node tests/drop-panels.cjs
```

After changing data or browser sources, rebuild the versioned assets. Retain
published `app-*.js`, `style-*.css`, `data-*.json`, `regions-*.json` and regional
chunks so cached pages retain
compatible geometry and renderer versions. The existing quizzes, municipality
maps and score service do not depend on this prototype.

The regional data test independently follows every preset's downstream graph,
checks exact junctions and source pins, and inverts all displayed coordinates
back to the measured source. Browser tests exercise lazy loading, failed
downloads, region removal, local river/lake labels, background registration,
desktop/mobile playback and main-site navigation.
