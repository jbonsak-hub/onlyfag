# Bærum postal-place polygons

`baerum-areas-postal-localities.geojson.gz` contains 23 real published postal-place areas (`poststed`) for Bærum, in GeoJSON / EPSG:4326. These are **postal boundaries**, rather than an assertion that every locality has a statutory neighbourhood boundary. The map can identify their target type as “Postområde”.

The source publisher is **Posten Norge/Kartverket**, retained in the original feature `opphav` attributes. The extraction dates in those features are 28 January 2024. The current municipality number is `3201`.

The pinned public distribution is [carestad/norwegian-geodata](https://github.com/carestad/norwegian-geodata/tree/b8080052824bc623c188e834d64ad378a8a6c67b), file `postal-codes.json.gz`. The complete compressed upstream SHA-256, pinned commit, official Geonorge metadata URL and processing method are embedded in both delivered data files. The mirror's complete MIT copyright/license notice is in `baerum-areas-postal-LICENSE.txt`.

`baerum-areas-postal-source-2024.json.gz` preserves all 63 original Bærum postcode records, including post-box codes without geometry. It retains the original publisher/product identifiers, dates, postcode numbers and coordinate geometry. The 23 displayed areas dissolve the 30 source polygons by their **exact published poststed**, without invented outlines, point buffers or smoothing. The four originally requested localities are:

- Fornebu: postcodes 1360 and 1364.
- Bekkestua: 1356 and 1357.
- Lysaker: 1366.
- Sandvika: 1336, 1337 and 1338.

The 23 dissolved polygons are valid and mutually disjoint except shared boundaries. They may extend into marine administrative areas. The quiz builder clips them to Bærum's Kartverket-derived land mask and then to the displayed map rectangle, retaining the original inland boundary lines. Bekkestua's postal area includes land beyond the built-up centre; it must not be described as an exact village-centre boundary.
