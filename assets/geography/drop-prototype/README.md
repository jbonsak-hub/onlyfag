# Følg dråpen — 2D prototype

Entry point: `/prototypes/folg-drapen.html`.

The standalone explorer renders six real Norwegian river networks as coloured
lines on a dark, north-up canvas. Select a represented river or one of nine
preset starts to follow a downstream journey. Playback, speed, rain particles,
upstream highlighting, wheel/pinch zoom, pointer pan and keyboard controls are
local to this prototype; it has no game scores, accounts or server mutations.

Rain continuously renews a bounded pool of drops in tributaries and headwaters,
following the same verified downstream links. It continues after the selected
journey arrives; Pause stops all motion, and reduced motion remains opt-in.
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

The top “Dråpen” button independently shows or hides the journey panel, and
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

The dynamically colored WMS layer was deliberately excluded: equal-resolution
nested sample requests assigned different colors to the same geographic pixels.
The fixed-statistics REST rule passed a pixel-identical overlap check.

## Background maps

The background selector offers the original dark river map, Kartverket's
topographic `topo` and tour-map `toporaster` layers, and real terrain relief
(`DTM:multiskyggerelieff`). “Vis elver” hides the complete river overlay to
inspect the underlying landscape without changing the camera or journey.
Terrain relief makes ridges visible; it does not compute drainage divides.

Maps are requested directly from the official public services only after a
background is selected. Linked `© Kartverket` attribution appears with the map.
No API key, backend proxy, bundled map imagery or new library is required.
The dark map still works without either remote service. Failed tiles show a
message; changing layers retries. Requests are bounded to eight concurrent
images, decoded tiles are capped at 160 after each repaint, and already loaded
geographically aligned tiles remain visible while new detail arrives.

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

This is a **river-network prototype**, not arbitrary overland rainfall routing.
Catchment boundary polygons are deliberately absent: the available broader NVE
vassdragsområder do not equal these exact river-family catchments. “Se
sideelvene” therefore highlights contributing river lines rather than inventing
a precise upstream land polygon. Unresolved branches remain visible and explain
their limitation when selected; drops never jump to a nearby unrelated river.
The journey's pace is illustrative, not a physical water travel-time model.

Data provenance, licence, measured directions, exact junction handling and
limitations are documented in [sources/README.md](sources/README.md). All
ordinary builds are offline from the pinned compact snapshot.

```sh
PYTHONPATH=/workspace/shared/municipality-python-deps python3 -B scripts/build-drop-prototype-data.py --check
node scripts/build-drop-prototype-assets.cjs
node scripts/build-drop-prototype-assets.cjs --check
BROWSER_EXECUTABLE=/usr/bin/chromium node tests/drop-prototype.cjs
BROWSER_EXECUTABLE=/usr/bin/chromium node tests/drop-basemap.cjs
BROWSER_EXECUTABLE=/usr/bin/chromium node tests/drop-map-style.cjs
BASE_URL=http://127.0.0.1:58390 BROWSER_EXECUTABLE=/usr/bin/chromium node tests/drop-panels.cjs
```

After changing data or browser sources, rebuild the versioned assets. Retain
published `app-*.js`, `style-*.css` and `data-*.json` files so cached pages retain
compatible geometry and renderer versions. The existing quizzes, municipality
maps and score service do not depend on this prototype.

The browser test independently follows all downstream graph links, checks the
six verified outlets, exercises all preset starts, clicks actual rivers,
rejects unresolved branches, verifies the visible outlet marker and exercises
desktop/mobile playback, rain, navigation and reduced-motion behaviour.
