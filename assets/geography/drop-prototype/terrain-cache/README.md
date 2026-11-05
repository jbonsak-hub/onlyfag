# Pinned terrain overview responses

These PNG files are **© Kartverket**, licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), under the
[terms for Kartverket's open products](https://www.kartverket.no/api-og-data/vilkar-for-bruk)
checked on 5 November 2026. The application's linked Kartverket attribution
also applies when an image is served from this local cache.

The cache contains the exact response bytes from the same public requests
used by the live renderer:

- `relief`: `DTM:multiskyggerelieff` from Kartverket's terrain WMS, overview
  matrix levels 3, 4 and 5.
- `elevation`: the DTM ImageServer `exportImage` response at matrix level 5,
  with the renderer's fixed 0–2500 m statistics, `DRA:false`, colour ramp,
  bilinear interpolation and PNG32 output.

All images are 256 × 256 pixels on the existing EPSG:25833 grid. No images
have been resized, recompressed, edited or re-encoded. Serving these bytes
locally changes download latency and availability, rather than geographic
registration, resolution or colours. Higher zoom levels continue to use the
live services. Topographic and hiking map layers are not included.

`manifest.json` lists every covered `layer/z/row/col` key, its original URL,
retrieval timestamp, source HTTP headers, dimensions, byte count and full
SHA-256. PNG filenames include the layer, zoom, row, column and content hash.
Coverage is the union of the three selected-region bounding rectangles,
in the same fixed world-coordinate frame as `regions.json`. The manifest
also records the projection, tile matrix, exact elevation rendering rule,
coverage bounds and licence.

```sh
node scripts/fetch-watershed-terrain-cache.cjs --plan
node scripts/fetch-watershed-terrain-cache.cjs
node scripts/fetch-watershed-terrain-cache.cjs --check
```

The default command resumes valid existing pinned files. It uses at most two
requests per source service and four requests in total, retries transient
failures, and saves progress after each response. Original downloads and HTTP
metadata are also retained outside the repository in
`../watershed-terrain-downloads/` for interrupted-run recovery. The `--check`
command is entirely offline: it verifies complete expected coverage, URLs
against the renderer's current height rule, projection, dimensions, hashes
and byte counts. It never silently replaces pinned data during validation.

To intentionally refresh a source response, remove its manifest record and
the corresponding scratch download metadata first, then run the fetcher and
review the resulting source hashes. Retain already published content-hashed
images for older cached clients when publishing a refresh.
