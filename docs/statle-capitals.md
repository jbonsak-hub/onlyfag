# Statle Capitals

The Statle menu offers state capitals and a pre-start name preview. The preview is removed on start; it does not change scoring or rankings. Capital markers remain during the capital round. Cancel detaches the score session, clears timers and map feedback, and restores the menu without starting another round.

`assets/geography/us-capitals.json` contains all 50 capitals, geographic coordinates and positions in the existing state asset. Capital names and coordinates come from [Vega's state-capitals dataset](https://github.com/vega/vega/blob/main/docs/data/us-state-capitals.json), retrieved 25 October 2026. The existing state paths are unchanged.

Mainland and Alaska positions use the projections documented in [us-map-context-sources.md](us-map-context-sources.md). Hawaii uses a fitted equirectangular transform aligned against the same Census geometry in us-atlas 3.0.1: x = 4015.17901197142 + 23.170796903781728 * longitude; y = 1020.2462085977172 - 23.170796903781728 * latitude. The data test checks every projected capital against its own state geometry, including Alaska and Hawaii. Coastal simplification may displace a point by less than 0.7 source units.

The scoring service accepts `game: "statle", variant: "capitals"`. It retains the same 50 state answer identifiers and scoring rules but uses a separate ranking identity. Old Statle sessions and rankings keep their existing identity. Unknown Statle variants are rejected. No database migration is required.

Validation:

- `node tests/statle-capital-data.cjs`
- `node --test tests/geography-score-api.mjs`
- Language, Statle and geography asset build checks.
- Browser checks of preview choices, capital markers, correct/wrong labels, cancel/restart, English and the original state mode.


## Physical basemap

The map icon at the upper left of the canvas toggles a locally hosted physical basemap without changing targets, timing, score state or capital markers. The original political map remains the default. Image files load only when the physical basemap is first selected.

Source: [Natural Earth II 1:50m shaded relief and water, version 3.2.0](https://www.naturalearthdata.com/downloads/50m-raster-data/50m-natural-earth-2/) and [Natural Earth 1:50m rivers](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_rivers_lake_centerlines.geojson). [Natural Earth raster and vector data are public domain](https://www.naturalearthdata.com/about/terms-of-use/). The Geology.com image supplied in the request is a visual reference; the published map is derived from Natural Earth.

`scripts/build-statle-relief.py` accepts the source TIFF and river GeoJSON paths. It uses inverse Albers/equirectangular projection and bilinear sampling, preserving the same projection as state boundaries and capital coordinates. Mainland, Alaska and Hawaii have their own transforms. Terrain and rivers are clipped to existing playable shapes and neighbouring land, leaving the original water and clickable state geometry intact. The generated WebP filenames contain content hashes; `us-relief.json` records source checksum, images, source-coordinate bounds and rivers. All three images together are about 573 kB. Completed states retain their performance colours over the terrain.
