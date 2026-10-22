# Physical map quizzes in Kart

`geografi/kart.html` offers four physical maps alongside the regional country
maps, Norwegian counties and the original Statle link. All maps share the SVG
camera, keyboard navigation, pre-start name exploration and adjustable desktop
panel. A single **Velg kart** link at the bottom returns to map selection. The
top-ten button is available before and after a round and hidden during play.

| Map | Targets | Content |
| --- | ---: | --- |
| World rivers | 49 | Complete river-PDF inventory plus major reference rivers |
| World lakes | 33 | Complete lake-PDF inventory |
| World mountain ranges | 24 | Natural Earth range polygons |
| European waters | 72 | 29 rivers, 9 lakes and 34 seas, gulfs and straits |

The provided PDFs and Lizard Point quizzes inform the feature selection and
interaction. The game implementation is independent. The new maps use local
Natural Earth geographic vectors, without distributing the reference site's
JavaScript, raster maps or PDF artwork. Sources and geographic decisions are in
[world-water-map-sources.md](world-water-map-sources.md) and
[mountain-europe-map-sources.md](mountain-europe-map-sources.md).

## Play and scoring

The current name is shown in the panel, and the player clicks its geographical
feature. Correct answers color the feature and move to the next question. Every
feature in the chosen map is asked once.

- **Practice:** three attempts, worth 3/2/1 points. A wrong click names the clicked
  feature; after the second error the requested feature is briefly highlighted.
- **Test:** the same three attempts and points, without wrong-place names or a
  target highlight.
- **Strict test:** one attempt, worth 1 point when correct.
- A final miss or skip records 0 points and shows the correct place before moving
  on. Completed features do not consume attempts for a different question.

Each map and mode has a separate global top ten, shared by Norwegian and English.
The Worker assigns the targets and validates attempts and points. Time is only a
tiebreaker for these four maps. Existing continent/Statle/county time-band scoring
is unchanged. Update the Worker before publishing the frontend; no database
migration is needed. The physical reference data is generated from the same map
assets and names as the client.

## Display and interaction

SVG geometry remains sharp under the shared camera's wheel/button/keyboard zoom,
touch pinch and pan. Rivers have a narrow dark visible stroke with a larger
transparent touch corridor. Lakes use dark fills; ranges use ochre. Tiny lakes
and straits retain their polygons and receive small on-map markers. Overlapping
touch corridors resolve to the visible feature underneath, then the nearest
river when appropriate. An enlarged marker corridor does not steal a click on a
neighbouring sea. The visible marker itself remains an explicit target.

Marine polygons are ordered from larger parent seas to smaller named waters and
clipped against the land background. The European map extends its context beyond
the home framing so widescreen and portrait gutters never cut land into rectangles.

On phones the page is a fixed viewport: a compact, independently scrollable panel
above the map replaces the desktop left rail. The complete fitted map remains
visible without page scrolling. Zoom is deliberate and never submits an answer
when a drag or pinch ends. Switching maps cancels pending start requests and old
feedback timers. Only the selected dataset is loaded, with the river/lake pair
sharing their background.

## Checks

```sh
node --test tests/physical-map-geometry.cjs tests/continent-maps.cjs tests/geography-score-api.mjs
node tests/physical-map-browser.cjs
node tests/kart-zoom.cjs
node tests/kart-online.cjs
```

Browser checks use `PLAYWRIGHT_MODULE` and optional `BROWSER_EXECUTABLE`; set
`SCREENSHOT_DIR` to retain views. The physical browser test uses the actual Worker
code with an isolated SQLite database. It checks every target through a real
geographic click, complete scoring and publication, final misses, modes, English
sharing, mobile layout and zoom.
