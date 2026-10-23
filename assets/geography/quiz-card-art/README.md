# Geography quiz overview artwork

Edit `scripts/build-geoquiz-cards.cjs` to change the nine vector illustrations.
They share a 240 × 90 canvas and palette. Capitals and Flag ↔ Capital have the
same solid background. The world/country shapes and flags reuse the site's
existing map data and vector flags; the other shapes are authored in the builder.

Run `node scripts/build-geography-quiz-assets.cjs` from the repository root.
It builds the illustrations, manifest and overview references before updating
the regular browser assets. Its `--check` mode verifies all of those outputs.
`node scripts/build-geoquiz-cards.cjs --check` checks the artwork on its own.

Keep published content-hashed SVG files so cached pages retain their artwork.
Globle, Travle and Tradle keep their existing previews with full-frame cropping
in `quiz-overview.css`. Kart and GeoGrid retain their separate illustrations.

The overview's language control is implemented in `quiz-language-runtime.js`.
It shows one destination flag: UK for switching to English, Norway for returning
to Norwegian. Changing the display language preserves game identifiers and
stored results.
