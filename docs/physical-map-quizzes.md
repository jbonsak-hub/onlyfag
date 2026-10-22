# Physical map quizzes in Kart

Kart now has four physical map choices alongside the continents, Norwegian
counties and the original Statle link:

| Map | Targets |
| --- | ---: |
| World rivers | 49 |
| Mountain ranges and highlands | 34: 27 ranges, 7 highland regions |
| Lakes | 33 |
| Seas, gulfs and straits | 73: 44 seas/oceans, 29 gulfs/straits |

Lakes and marine waters are separate choices. The marine page offers two independent checkboxes directly above Start, initially both selected. An empty selection disables Start and the leaderboard. Only selected targets are drawn, assigned and accepted by the score service. Smaller unasked water bodies are attached to their logical neighbours, including the twelve provisional additions, which are no longer questions. See [marine-coverage.md](marine-coverage.md).

Rivers, mountains and lakes also offer “Continent by continent”. This is local practice: North America, South America, Europe, Asia, Africa, then Oceania; random order within each continent. A small subtitle names the current continent. Every selected target appears once. No score session, answer or publication is sent to the API, and the leaderboard is hidden. Transcontinental teaching assignments are explicit in scripts/physical-map-continents.cjs.

The supplied PDFs and reference quizzes informed inventories and interaction.
The implementation uses local geographic SVG vectors, without third-party quiz
code, PDF artwork or remote map tiles. Sources, generalized boundary choices
and complete inventories are documented in
[world-water-map-sources.md](world-water-map-sources.md) and
[mountain-europe-map-sources.md](mountain-europe-map-sources.md).

## Play and ranking

Before Start, clicking any target shows its name without starting time or an
online session. The round uses Statle's time/error bands: 100/75/50/0. Wrong
answers do not automatically advance; two mistakes reveal a brief hint. Skip
shows and completes the assigned target for zero points. Already completed
targets do not consume attempts on another question. Every selected target is
asked once before a result can be published.

Each map has a global top ten, shared across Norwegian and English. Water
category combinations have separate lists, independent of checkbox order.
The Worker assigns questions and checks time, mistakes, skips and complete
rounds. It must be updated with the frontend; no database migration is needed.

## Layout and interaction

World maps fill almost the entire viewport, with a compact panel in the ocean
west of South America. Non-interactive panel surfaces support dragging in both
directions, constrained to the viewport. Desktop also supports resizing from
the panel corner. The menu button remains in the upper left; the only map exit
is the panel's bottom Choose a map link. Top ten is hidden during a round.

Desktop world views stretch moderately to fit their viewport; portrait mobile
preserves map proportions. All maps support wheel/buttons/keyboard zoom,
native touch pinch and pan. A drag or pinch never submits an answer. Small
markers stay the same screen size in both axes, even when a world map is
stretched. Country/county/USA maps keep their existing regional framing and
adjustable side panel.

Rivers and lakes have strong dark contrast. Ranges use ochre and highlands a
lighter shade. Larger areas are drawn below smaller nested regions; Altiplano
and Dolomites remain independently visible and clickable. Marine polygons are
clipped against land. Overlapping visible markers select the nearest center;
invisible hit corridors do not override a different visible geographic shape.
River corridor overlaps select the nearest mapped course.

## Checks

```sh
node --test tests/physical-map-geometry.cjs tests/continent-maps.cjs tests/geography-score-api.mjs
node tests/physical-map-browser.cjs
node tests/marine-coverage-browser.cjs
node tests/kart-practice.cjs
node tests/kart-zoom.cjs
node tests/kart-online.cjs
```

Browser checks use PLAYWRIGHT_MODULE and optionally BROWSER_EXECUTABLE and
SCREENSHOT_DIR. They make real geographic clicks on all 189 physical targets,
exercise free panel dragging, category changes, complete server-verified
rounds, automatic nickname prompt, shared-language ranking and mobile zoom.

The chooser uses local vector flags, continent silhouettes derived from existing maps, and river/mountain/lake/sea motifs. Run node scripts/build-kart-cards.cjs when continent outlines change; --check validates the sprite.
