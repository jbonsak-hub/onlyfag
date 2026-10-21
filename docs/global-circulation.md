# Global sirkulasjon

The model is rebuilt independently of the earlier inline SVG. `geografi/global-sirkulasjon.html` can be opened directly or lazily embedded in the geography section `klima-sirkulasjon`. The iframe separates the diagram from the site's large shared stylesheet. The host synchronizes light/dark mode, pauses hidden animations, handles the back link, and adjusts iframe height to the content.

## Teaching sequence

1. Two solar bundles have the same incoming width but cover different surface areas. The diagram represents the geometric contrast, not seasons or an instantaneous temperature field.
2. A deliberately simplified, nonrotating planet has one thermally direct cell per hemisphere.
3. The rotating planet is represented by the idealized Hadley, Ferrel and polar cells. Both limbs show sections through the same encircling cells. The Ferrel cell is explicitly described as an indirect average of variable weather systems.
4. Surface-pressure belts and typical wet/dry conditions follow the rising and sinking branches. Climate colors indicate broad schematic tendencies, not a vegetation map or local forecast. Polar and subtropical highs are distinguished from equatorial and subpolar lows.
5. Trade winds, westerlies and polar easterlies are projected onto the same geographic globe. Northern and southern trade winds go westward/equatorward; westerlies eastward/poleward; polar easterlies westward/equatorward. A comparison removes deflection while holding the pressure belts fixed, explicitly isolating that one effect rather than claiming the three-cell model persists on a nonrotating Earth.

Latitude boundaries are rounded to 0°, 30°, 60° and 90° for teaching. The seasonal migration of the belts and the effects of land, sea, terrain and changing weather are stated below the model. Atmospheric depth is exaggerated.

## Sources and artwork

The text and vector artwork are original. Scientific checks use:

- [Met Office: Global circulation patterns](https://weather.metoffice.gov.uk/learn-about/weather/atmosphere/global-circulation-patterns)
- [NOAA JetStream: Global Atmospheric Circulations](https://www.noaa.gov/jetstream/global/global-atmospheric-circulations)
- [Royal Meteorological Society: Global Atmospheric Circulation](https://www.rmets.org/metmatters/global-atmospheric-circulation)

The user's supplied globe figures informed the visual approach (a geographical globe with separate circulation ribbons). They are not copied or loaded by the module.

`earth-land.js` is a static orthographic projection of the public-domain Natural Earth geometry already embedded in the geography site's country maps. Closed polygon rings are normalized before projection. The display is centered at 10° E, 0°; coordinates match the model's spherical surface. The globe does not depend on online map tiles, external libraries, or a runtime network request.

## Accessibility and performance

Tabs support Arrow Left/Right, Home and End. The explanation remains HTML text, and SVG title/description change with the selected step. Cell/pressure/wind buttons highlight related diagram layers. A global pause control stops both SVG motion and CSS movement. Reduced-motion starts paused; hidden documents and inactive host sections pause movement. Only the visible step is rendered; no perpetual JavaScript animation loop is used.

Run `node tests/global-circulation.cjs` with `PLAYWRIGHT_MODULE` and optional `BROWSER_EXECUTABLE`. `BASE_URL` selects a preview server and `SCREENSHOT_DIR` saves the desktop/mobile views.
