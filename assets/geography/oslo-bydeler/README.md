# Oslo quiz map

The current learning map contains **28 targets**: Oslo's fifteen ordinary
boroughs, Sentrum, Bygdøy, Nesodden, Lørenskog, Bogstadvannet, Maridalsvannet,
Sognsvann, Fornebu, Lysaker, Bekkestua, Sandvika, Nordmarka and Østmarka.
The map is north-up in ETRS89 / UTM zone 33N. It preserves geographic shapes;
its approximately square canvas is achieved by padding the view, not stretching
coordinates. Only nearby parts of the large forest regions are shown.

`oslo.json` is the current dataset. `map.json` retains the previous sixteen-area
quiz unchanged for cached older game scripts and their separate ranking pool.

## Boroughs and Bygdøy

The fifteen ordinary borough polygons come directly from **Oslo kommune's
[Bydelsfakta](https://bydelsfakta.oslo.kommune.no/)** application:

- Repository: [oslokommune/bydelsfakta](https://github.com/oslokommune/bydelsfakta).
- Pinned revision: `eede9692da0d399b0dcbaa7738d4ed95e3debb15`.
- Borough file: [src/config/geoData/oslo.js](https://github.com/oslokommune/bydelsfakta/blob/eede9692da0d399b0dcbaa7738d4ed95e3debb15/src/config/geoData/oslo.js).
- Bygdøy file: [src/config/geoData/frogner.js](https://github.com/oslokommune/bydelsfakta/blob/eede9692da0d399b0dcbaa7738d4ed95e3debb15/src/config/geoData/frogner.js),
  selecting the named subdistrict `Bygdøy` (`0301050501`).
- License: MIT, copyright © 2019 Oslo kommune; full notice is included in
  [sources/OSLO-KOMMUNE-LICENSE.txt](sources/OSLO-KOMMUNE-LICENSE.txt).

Unchanged source coordinates and original-file SHA-256 checksums are stored in
`sources/oslo-boroughs.geojson.gz` and `sources/bygdoy.geojson.gz`. The borough
source's original JavaScript file has SHA-256
`8e74c5eb9c22e3ee39cfda0454da146f38732b04b3272bd4a86c8d0d16419c2a`.

Quiz outlines are not simplified. The build repairs small overlaps
(39,231.94 m²) and 53 narrow enclosed gaps (48,968.88 m²) in the independently
drawn boroughs by polygonizing their existing edges. Overlaps keep the lower
borough number; a gap joins the polygon sharing its longest edge. This changes
less than 0.06% of the combined area. Checks reject unexpectedly large gaps.
Bygdøy is clipped to its parent Frogner polygon so that its independent target
cannot create an outside coastal sliver. Its detailed seaward outline keeps the
ordinary subtle stroke; the brighter administrative overlay uses only its
inland edge, excluding a 250-metre band around Frogner’s outer boundary to
avoid presenting mismatched coastline detail as an internal border. This does
not change the playable Bygdøy geometry. Its overlap with Frogner is deliberate;
the game resolves the requested target before testing other overlapping places.
The source label `St.Hanshaugen` is displayed as `St. Hanshaugen`.

## Sentrum and neighbouring municipalities

Sentrum is a separate statistical area, outside the fifteen ordinary boroughs.
Its inland edges follow those borough outlines. The build subtracts them from
the pinned Kartverket-derived Oslo municipality land polygon and chooses the
connected component containing 10.738° E, 59.913° N. The seaward edge therefore
uses the same coastline as the municipality atlas. Its area is approximately
1.87 km²; validation rejects overlap or an implausible area.

Nesodden (`3212`) and Lørenskog (`3222`) retain their complete municipality
outlines from the same Kartverket-derived 2024 atlas, without additional quiz
simplification. Source revisions, licenses and original-file checksums are in
the [municipality atlas documentation](../municipalities/README.md).

## Lakes, localities and forest references

Bogstadvannet and Maridalsvannet use their complete, unsimplified polygons from
the pinned **Kartverket N1000 Kartdata 2025** hydrography (CC BY 4.0). They are
selected by known interior points, and the builder checks that each point
identifies exactly one source lake. The selected lakes are removed from the
decorative water layer so that it cannot cover their grading colours.

The N1000 source omits the smaller Sognsvann. It is therefore an honest point
quiz target instead of an invented water outline. Its point is published in
[Oslo kommune's Sognsvann bathing-place page](https://www.oslo.kommune.no/natur-kultur-og-fritid/tur-og-friluftsliv/badeplasser-og-temperaturer/sognsvann/):
10.7243214° E, 59.9702878° N. The unchanged official GeoJSON point is preserved in
`sources/sognsvann-official-point.geojson`. It marks the bathing place at the
lake, rather than claiming to be the lake's centroid or boundary.

Fornebu, Lysaker, Bekkestua and Sandvika are locality point targets, not invented
administrative polygons. Lysaker and Sandvika use **GeoNames** point coordinates
(records `3146631` and `3140128`) distributed in `geonamescache 3.0.2`, under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Fornebu and Bekkestua
use reference points chosen within the named localities. Source and coordinate
metadata are retained in `sources/local-reference-points.json`.

Nordmarka and Østmarka also use point markers within their nearby parts. They
have no universally equivalent administrative boundary; the generic northern
Oslo municipality remainder also includes Lillomarka. The map therefore avoids
presenting that remainder as a false Nordmarka outline. The names and distinct
forest areas follow [Oslo kommune's Marka description](https://www.oslo.kommune.no/natur-kultur-og-fritid/tur-og-friluftsliv/marka/).
A separate, quieter `forestContext` layer shows the remaining large Oslo Marka
land components, without making them into named answer boundaries. The broad
N1000 lake polygons are subtracted from this context.

Other water and surrounding land reuse the municipality atlas. Nearby land has
a different colour from both the water and quiz targets. Only non-playable
context is simplified, with ten-metre tolerance. This is a learning map rather
than a cadastral or surveying map.

## Rebuild

From the repository root:

```sh
python -m pip install -r scripts/municipality-requirements.txt
python scripts/build-oslo-bydeler-assets.py
python scripts/build-oslo-bydeler-assets.py --check
```

The build is offline and deterministic. It validates source borough IDs,
topology repairs, Sentrum's area, named lake matches, the complete 28-target
set, coordinates and geographic projection. Previously published data and
hashed snapshots remain available for cached game documents.
