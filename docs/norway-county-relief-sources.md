# Physical terrain for the county quiz

`assets/geography/norway-county-relief.json` exposes `regions.fylker`. Its single
image uses the unchanged coordinates of `norway-counties.json`: bounds
`[0, 0, 1360.629, 1500.617]` and an identity area transform. Apply the same SVG
group fit matrix to this image as to the county paths. The raster's alpha mask
comes from those exact even-odd county paths. County IDs, click geometry and
scoreboard keys are unchanged.

The build uses the 15 existing local `norway-relief/county-*.webp` images. Each
tile has an exact EPSG:25833 bounding box in `norway-relief.json`. Those images
contain Kartverket DTM hillshade, the existing local lake/river geometry, and
Natural Earth II fallback beyond DTM coverage. No network request is needed.
The source tile hashes, extents and sampled pixel counts are recorded in the
new manifest. Kartverket data are CC BY 4.0; Natural Earth is public domain.
See also [norway-relief-sources.md](norway-relief-sources.md).

The county SVG is the existing NordNordWest/Wikimedia source (CC BY-SA 3.0 DE),
adapted from [Vestland in Norway 2024.svg](https://commons.wikimedia.org/wiki/File:Vestland_in_Norway_2024.svg).
It has no explicit CRS. Its registration is therefore measured, rather than
assuming its pixels are UTM coordinates. The pinned
`sources/norway-county-registration.json` contains a Lambert-conic cone constant
and affine frame, fitted robustly to 60 interior points along each of 23 shared
county boundaries in the local official municipality source. Eight boundary
endpoints and three-county junctions were held out as geographic checkpoints.
The largest checkpoint-to-county-boundary distance is 0.219715 SVG units on a
1500.617-unit-high map, including checks at the Nordland/Troms and Troms/Finnmark
eastern boundaries. Typical full-seam RMS distances are 0.09–0.20 SVG units;
source boundary/coastline differences remain at some other locations. The
registration does not assert that the source author used this exact CRS.

For longitude λ and latitude φ in radians, let `n` be `coneConstant`,
`λ₀ = centralMeridian`, and `ρ = tan(π/4 + φ/2)^(-n)`. The normalized conic point
is `[1000ρ sin(n(λ−λ₀)), −1000ρ cos(n(λ−λ₀)), 1]`. Multiply that row vector by
the stored 3×2 `matrix` to obtain the original county SVG coordinates. The
builder analytically inverts this transform for every output pixel, transforms
WGS84 to EPSG:25833, and samples its county's terrain tile with bilinear
interpolation. This avoids applying one inaccurate affine transform between
different map projections.

Rebuild and validate offline with the Python dependencies used by the existing
municipality terrain build:

```sh
python3 scripts/build-norway-county-relief.py
python3 scripts/build-norway-county-relief.py --check
```

The default raster is 4080 × 4500 pixels. `--height` allows a deliberate
resolution change. The build rejects changed click geometry until its pinned
registration is reviewed, checks every checkpoint against the original county
path segments, checks forward/inverse round trips, and verifies complete source
coverage for every rendered county pixel. `--check` also verifies the encoded
output and all 15 source tile hashes.
