# Kart: country geometry and region pools

`geografi/kart.html` is the shared entry point for these six region rounds and
the existing Norwegian county quiz. The USA choice links to the original Statle.
All rounds use the same click-map game engine and time/error color bands.
The shared SVG camera supports wheel zoom, two-finger pinch, drag, plus/minus,
keyboard +/−/0 and a fit button. A drag or pinch never submits a country answer.
Changing maps cancels the previous online run before a new round can start.

`scripts/build-continent-map-assets.cjs` builds the six country maps entirely
offline. It reuses the public Natural Earth country geometry already embedded in
`assets/geography/core.js` (`COUNTRY_MAP_FILL_B64` and the corresponding feature
names). [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/)
places its map data in the public domain. No map tiles, remote API or third-party
runtime are required by these maps.

The answer names and region membership come from the existing **Finn land**
catalogue: all 197 countries, exactly once across the six regions. The catalogue
includes Kosovo, Palestine, Taiwan and Vatican City. Armenia, Azerbaijan and
Georgia were absent from the older region pools; Kart includes them in Asia,
alongside their South Caucasus neighbours. The existing game's Europe placement
of Russia, Turkey and Cyprus is retained. Regions are a quiz convention rather
than a statement about political borders.

| Region | Countries |
| --- | ---: |
| Europe | 47 |
| Asia | 47 |
| North and Central America, including the Caribbean | 23 |
| South America | 12 |
| Africa | 54 |
| Oceania | 14 |

Maps use a separate **Lambert azimuthal equal-area** projection centred on each
region. Each is fitted to a 900 × 650 SVG viewBox. The Oceania map normalizes
longitudes around the Pacific, so Fiji and the islands on either side of the
date line stay together. Geographic clipping avoids overseas possessions
forcing a whole-world crop. Neighbouring countries and territories are muted
context and are never separate answers. Antarctica is not drawn.

The simplified source lacks 29 microstates and small island countries. These use
the existing game's local `COUNTRY_MAP_POINTS` coordinates and visible circular
targets. Small polygons also receive circular targets. Zoom remains available,
so dense clusters of countries can be separated. Country hint points are found
inside the largest visible polygon, away from coastlines and holes. The builder
verifies finite coordinates, hint containment, exact country coverage and no
duplicate assignments every time it runs.

`--check` rebuilds in memory and fails if the committed JSON is stale:

```sh
node scripts/build-continent-map-assets.cjs --check
```
