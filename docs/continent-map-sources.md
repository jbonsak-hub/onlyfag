# Kart: country geometry and region pools

`geografi/kart.html` is the shared entry point for these six region rounds and
the existing Norwegian county quiz. The USA choice links to the original Statle.
All rounds use the same click-map game engine and time/error color bands.
The shared SVG camera supports wheel zoom, two-finger pinch, drag, plus/minus,
keyboard +/−/0 and a fit button. A drag or pinch never submits a country answer.
Changing maps cancels the previous online run before a new round can start.
Before starting, clicking or keyboard-activating a country, county or state shows
its name on the map and in the panel without starting the timer or adding an answer.

`scripts/build-continent-map-assets.cjs` builds the six country maps entirely
offline. It reuses the public Natural Earth country geometry already embedded in
`assets/geography/core.js` (`COUNTRY_MAP_FILL_B64` and the corresponding feature
names). [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/)
places its map data in the public domain. No map tiles, remote API or third-party
runtime are required by these maps.

The country answer names and region membership come from the existing **Finn land**
catalogue: all 197 countries, exactly once across the six regions. The catalogue
includes Kosovo, Palestine, Taiwan and Vatican City. Armenia, Azerbaijan and
Georgia were absent from the older region pools; Kart includes them in Asia,
alongside their South Caucasus neighbours. The existing game's Europe placement
of Russia, Turkey and Cyprus is retained. Regions are a quiz convention rather
than a statement about political borders.

Kart additionally includes three explicitly labeled regional territories. French
Guiana and New Caledonia use the existing local Natural Earth outlines. Their
targets have `territory: true` and `parent: "Frankrike"`. Western Sahara has
`territory: true` and `disputed: true`. These are additional Kart answers only;
they do not alter the 197-country catalogue used by other games.

| Region | Countries | Additional labeled targets | Total |
| --- | ---: | --- | ---: |
| Europe | 47 | — | 47 |
| Asia | 47 | — | 47 |
| North and Central America, including the Caribbean | 23 | — | 23 |
| South America | 12 | Fransk Guyana (fransk) | 13 |
| Africa | 54 | Vest-Sahara (omstridt) | 55 |
| Oceania | 14 | Ny-Caledonia (fransk) | 15 |

Maps use a separate **Lambert azimuthal equal-area** projection centred on each
region. Each is fitted to a 900 × 650 SVG viewBox. The Oceania map normalizes
longitudes around the Pacific, so Fiji and the islands on either side of the
date line stay together. Geographic clipping avoids overseas possessions
forcing a whole-world crop. Neighbouring countries and territories are muted
context unless listed above. Antarctica is not drawn. Greenland is omitted from
Europe's context, so the crop does not leave an isolated triangular fragment
north of Iceland.

Western Sahara uses one complete polygon from the public-domain
[Natural Earth 1:50m breakaway/disputed-area layer](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-breakaway-disputed-areas/),
specifically the `BRK_NAME: "W. Sahara"` claim-area record in
[the publisher's GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_breakaway_disputed_areas.geojson)
(snapshot retrieved 2026-10-22). The selected coordinate ring is embedded in the
offline builder. Natural Earth explains that its ordinary country layer follows
de-facto control, which produced the previous fragmented strip around the berm.
Kart instead draws the complete territory as one labeled answer, with no internal
control line or white cutout. Morocco's target is clipped at the territory's
northern boundary (about 27.656°N). The label explicitly says “omstridt”; inclusion
in the region does not assert sovereignty.

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
