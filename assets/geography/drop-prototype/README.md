# Følg dråpen — 2D prototype

Entry point: `/prototypes/folg-drapen.html`.

The standalone explorer renders six real Norwegian river networks as coloured
lines on a dark, north-up canvas. Select a represented river or one of nine
preset starts to follow a downstream journey. Playback, speed, rain particles,
upstream highlighting, wheel/pinch zoom, pointer pan and keyboard controls are
local to this prototype; it has no game scores, accounts or server mutations.

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
```

After changing data or browser sources, rebuild the versioned assets. Retain
published `app-*.js`, `style-*.css` and `data-*.json` files so cached pages retain
compatible geometry and renderer versions. The existing quizzes, municipality
maps and score service do not depend on this prototype.

The browser test independently follows all downstream graph links, checks the
six verified outlets, exercises all preset starts, clicks actual rivers,
rejects unresolved branches, verifies the visible outlet marker and exercises
desktop/mobile playback, rain, navigation and reduced-motion behaviour.
