# Worldle imagery and outlines

Worldle uses detailed Natural Earth 1:10m map-unit outlines. The source extract is
pinned in `assets/geography/sources/worldle/`, with source URL and hashes. Existing
Morocco/Cyprus/Somalia outline combinations remain. France and Norway use their
European/mainland map units. Small remote dependencies do not force the main
Chile/Portugal/Spain/USA/Australia outline into a corner; major landmasses and
nearby coastal islands remain, and true archipelago countries remain complete.

Every country has one Web Mercator viewport (EPSG:3857) at exactly 4:3. The SVG
clip, local relief preview and Esri export use this same viewport. The satellite
request explicitly sends `bboxSR=3857`, `imageSR=3857` and
`adjustAspectRatio=false`; imagery is never stretched from an independently
adjusted geographic extent. Geometry is simplified by at most 0.23 SVG pixels.

The local preview is sampled from the already pinned Natural Earth II raster.
It provides immediate, useful terrain while Esri World Imagery loads
asynchronously; unavailable satellite service leaves the local map visible.
Countries crossing the map seam use the locally wrapped raster and avoid a
broken external export. Sources are labeled according to the layer displayed.

`worldle-art.json` points to the hashed index. Its 197 country entries take
14.5 KB / 3.6 KB gzip. Each question lazily loads only its own hashed outline
JSON and 640×480 WebP preview (largest preview 46.4 KB; total previews 2.09 MB).
Past files are retained when published so already-open clients can continue.
Startup and next-country loads are guarded against navigation and premature
answers. Existing hints, answer pool and gameplay remain available if a local
asset is unavailable.

Build and check:

```sh
python scripts/build-worldle-art.py --check
python scripts/build-worldle-art.py
```

Bootstrap a new pinned source only when intentionally updating the geometry:

```sh
python scripts/build-worldle-art.py --geometry ne_10m_admin_0_map_units.geojson
```

Build dependencies: NumPy, Pillow and Shapely. The normal offline check verifies
source hashes, projected aspect, current assets, image sizes and representative
outlines. `tests/worldle-art.cjs` checks real browser rendering for Sierra Leone,
Norway, Chile, Indonesia and Fiji, immediate offline terrain, exact satellite
request registration and asynchronous source replacement. Root additionally
ran independent startup/next-country cancellation and premature-answer races.
