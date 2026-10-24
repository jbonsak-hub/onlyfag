# Three astronomy prototypes

Independent prototypes live under `/prototyper/`. The previous embedded geography simulators remain available for comparison. The index connects three time scales: days/months, days/years, and tens of thousands of years.

## Teaching and interaction

- **Earth–Moon–Sun:** synchronize a view from above, a side view of the inclined lunar orbit, and the phase seen from Earth. Separate phase geometry from eclipses. Guided eclipse scenes let the learner compare alignment at the nodes and the Moon's distance. An optional year view explains why the sidereal and synodic months differ.
- **Seasons and the Sun's path:** connect a local sky path to day length, solar altitude, and the footprint of parallel sunlight. Compare opposite seasons and hemispheres; set the axial tilt to zero to test the explanation. Times are solar time, and irradiance is at the top of the atmosphere on a horizontal surface.
- **Milanković:** isolate eccentricity, obliquity, and precession before comparing actual orbital calculations with a climate proxy. Future orbital forcing is shown separately from the past proxy record. No temperature, ice-volume, or next-glaciation forecast is inferred from insolation alone.

The default state is paused. Native controls support the keyboard. Mobile layouts stack the scene, controls, and explanation, without hiding controls in floating panels. Animations suspend when the page is hidden. The pages have no remote runtime dependencies, analytics, or external font requests.

## Scientific limits

Sizes, distances, and selected inclinations are exaggerated where necessary for legibility, with scale notes next to the diagrams. Phase appearance uses a declared schematic orientation for a northern observer. Eclipse classifications use physical angular/shadow geometry rather than the exaggerated drawing.

The seasons model uses an idealized solar calendar and a fixed solar constant of 1361 W/m². It excludes atmospheric refraction, cloud cover, terrain, the equation of time, and civil-time offsets. The light values illustrate geometry, not weather or surface radiation measurements.

The Milanković page bundles NOAA's Berger (1978) orbital solution, sampled every 1000 years from 800,000 years before to 100,000 years after 1950, and the LR04 benthic oxygen-isotope stack. Perihelion longitude is converted from the orbital convention to the solar-longitude convention. LR04 reflects both ice volume and deep-ocean temperature; its chronology includes astronomical tuning. Sources, raw-file hashes, and data conventions are documented with the bundled data. Slow orbital forcing does not explain current rapid anthropogenic warming.

## Build and validation

Run `node scripts/build-astronomy-prototype-assets.cjs` after changing sources. It creates immutable content-addressed CSS, JavaScript, and data files and updates all four HTML pages. Keep previously published assets so cached HTML remains usable. `--check` verifies that source, generated assets, and page references agree.

Browser regression scripts are in `tests/astronomy-system.cjs`, `tests/astronomy-seasons.cjs`, and `tests/astronomy-milankovitch.cjs`. Set `BASE_URL` to a local static server or the deployed origin, `PLAYWRIGHT_MODULE` to the installed Playwright module, and `BROWSER_EXECUTABLE` to a browser executable if needed. Tests cover numerical reference cases, meaningful control transitions, eclipse geometry, polar day/night, zero tilt, real-data ranges, animation, and small-screen overflow. A separate integration check covers navigation, local assets, and the shared page layout.
