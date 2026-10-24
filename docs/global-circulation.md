# Global sirkulasjon

The model uses a geographical globe and a progressive five-step teaching sequence. The solar-heating step is retained from the new design; the single-cell and three-cell diagrams adapt the earlier inline model's rounded Bézier branches to that same globe. `geografi/global-sirkulasjon.html` can be opened directly or lazily embedded in the geography section `klima-sirkulasjon`. The iframe separates the diagram from the site's large shared stylesheet. The host synchronizes light/dark mode, pauses hidden animations, handles the back link, and fits the complete figure and navigation into the desktop viewport. On phones the geography menu collapses and the explanation follows the figure vertically.

## Teaching sequence

1. Two solar bundles have the same incoming width but cover different surface areas. The diagram represents the geometric contrast, not seasons or an instantaneous temperature field.
2. A deliberately simplified, nonrotating planet has one thermally direct cell per hemisphere. Warm upper branches and cooler surface-return branches use separate colors. Rounded turns at the equator and poles close the loops; particles follow their flow direction.
3. The rotating planet is represented by the idealized Hadley, Ferrel and polar cells. Their rounded lower branches follow the spherical surface, with upper branches closing the loops. Both limbs show sections through the same encircling cells; the farther limb is quieter. The Ferrel cell is explicitly described as an indirect average of variable weather systems. The same cell shapes remain a faint backdrop in steps 4 and 5.
4. Surface-pressure belts and typical wet/dry conditions follow the rising and sinking branches. Climate colors indicate broad schematic tendencies, not a vegetation map or local forecast. Polar and subtropical highs are distinguished from equatorial and subpolar lows.
5. Trade winds, westerlies and polar easterlies can be viewed on the globe or a full-world equirectangular map, alongside the same surface high/low-pressure belts. The flat view repeats arrows across all longitudes so both hemispheres and all belts are visible together. Northern and southern trade winds go westward/equatorward; westerlies eastward/poleward; polar easterlies westward/equatorward. A comparison removes deflection while holding the pressure belts fixed, explicitly isolating that one effect rather than claiming the three-cell model persists on a nonrotating Earth.

Latitude boundaries are rounded to 0°, 30°, 60° and 90° for teaching. The seasonal migration of the belts and the effects of land, sea, terrain and changing weather are stated below the model. Atmospheric depth is exaggerated.

## Sources and artwork

The text and vector artwork are original. Scientific checks use:

- [Met Office: Global circulation patterns](https://weather.metoffice.gov.uk/learn-about/weather/atmosphere/global-circulation-patterns)
- [NOAA JetStream: Global Atmospheric Circulations](https://www.noaa.gov/jetstream/global/global-atmospheric-circulations)
- [Royal Meteorological Society: Global Atmospheric Circulation](https://www.rmets.org/metmatters/global-atmospheric-circulation)

The user's supplied globe figures informed the visual approach. The rounded circulation curves reuse the project's earlier model at the user's request; external figures are not copied or loaded by the module.

`earth-land.js` retains a static fallback projection of the public-domain Natural Earth geometry already embedded in the site's country maps. `scripts/build-circulation-map.cjs` generates an equirectangular `earth-mask.svg` from the same source. `globe-surface.js` inverse-projects that local texture onto an orthographic globe using WebGL, with a Canvas 2D fallback. Dragging, arrow buttons, a longitude slider and keyboard arrows rotate the view about the polar axis. The latitude-based teaching layers remain fixed as the surface turns. The starting view is 10° E, 0°. Texture drawing happens only when the view or display mode changes; the globe never spins automatically.

From step 4 the prominent **Fysisk kart** button at the upper left of the figure switches to [NASA Blue Marble Next Generation](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/). `earth-physical.webp` is a local 2048 × 1024, quality-86 WebP derivative of NASA's [August 2004 composite](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/august/world.200408.3x5400x2700.jpg). The image shows the surface and vegetation in that historical monthly composite, not current weather. Its source and month remain visible below the model. In the physical view, schematic climate fills and cloud symbols are removed so they do not obscure the vegetation. Wind and pressure overlays remain available. The approximately 148 kB physical image loads only when selected; neither mode uses remote map tiles or external runtime libraries.

## Accessibility and performance

Tabs support Arrow Left/Right, Home and End. The explanation remains HTML text, and SVG title/description change with the selected step. Cell/pressure/wind buttons highlight related diagram layers. The toolbar has no pause, theme or reset buttons. Reduced-motion starts paused; hidden documents and inactive host sections pause movement. Only the visible step is rendered; no perpetual JavaScript animation loop is used. Globe rotation also works while motion is paused. No surface texture is sent to an external service.

Run `node tests/global-circulation.cjs` with `PLAYWRIGHT_MODULE` and optional `BROWSER_EXECUTABLE`. The checks include the lower-branch directions on both hemispheres, rounded geometry, warm/cool branches, keyboard controls, focus, motion, and all five mobile layouts. `BASE_URL` selects a preview server and `SCREENSHOT_DIR` saves the desktop/mobile views.

The fifth step has a separate globe/2D toggle. Both GPU and Canvas 2D renderers draw the same local equirectangular texture in the flat view; switching projection preserves map type, longitude and selected wind belt. A compact link card opens earth.nullschool.net in a new tab for current wind maps; the teaching diagram remains the idealized model.
