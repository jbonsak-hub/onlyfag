# Quiz region illustrations

Seven local SVG illustrations for the flag, capital and flag/capital setup cards.
The six continental silhouettes reuse the existing `kart-cards.svg` Natural
Earth-derived map outlines. The world icon uses the unchanged land background
in the frozen `physical-maps/world-water.json` snapshot; no quiz targets are
read from that file for the illustrations.

The source Natural Earth geometry is public domain. See
`docs/world-water-map-sources.md` and `scripts/build-kart-cards.cjs` for the
existing sources. The SVGs add a small globe, graticule and the site's green
palette. Decorative illustrations contain no labels or extra map requests.

Build or validate offline:

```sh
node scripts/build-quiz-region-art.cjs
node scripts/build-quiz-region-art.cjs --check
```
