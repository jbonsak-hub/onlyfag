# Regional physical-map backgrounds

The six country-map regions use full-resolution physical backgrounds derived
from the same public-domain Natural Earth raster and river data as Statle:

- [Natural Earth II 1:50m shaded relief and water, version 3.2.0](https://www.naturalearthdata.com/downloads/50m-raster-data/50m-natural-earth-2/)
- [Natural Earth 1:50m rivers and lake centre lines](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_rivers_lake_centerlines.geojson)
- [Natural Earth public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/)

`assets/geography/region-relief.json` records source checksums, immutable image
filenames, pixel dimensions, projected bounds and the exact projection fit.
Each region has one `areas.main` image at **2700 × 1950 pixels**, covering its
unchanged **900 × 650** map viewBox with an identity area transform. Lossless
WebP preserves the generated pixels. The six images are approximately 1.3–3.5 MB
each and are intended to load only for the selected region's physical basemap.
The runtime must display them in the separate HTML basemap layer, behind the
interactive SVG, so a country's answer colour does not repaint terrain images.

## Exact map alignment

The builder reuses the existing offline country-map source and its fit in
`scripts/build-continent-map-assets.cjs`, evaluating the geometry calculation in
memory and stopping before any file write. It does not modify country paths,
hint points, region membership or target names. The map's spherical Lambert
azimuthal equal-area projection is inverted per output pixel; bilinear sampling
reads the global Natural Earth raster. Longitude sampling wraps around the
antimeridian, keeping Fiji, Samoa and Tonga in the existing Pacific view.

Coastlines, country holes, neighbouring land and regional territories are baked
as transparent alpha masks from the **existing map paths**. Rivers are projected
and baked once, with their lines clipped by that same alpha. Runtime SVG clips
and river paths are unnecessary. Country/territory targets represented by the
original map's small-country markers remain markers; no invented land outlines
are added for source polygons that do not exist. All 200 target identities remain
unchanged.

The generated regional crop is exactly the original crop. Muted neighbouring
land and territory context is included, so the basemap has no shifted coastlines
or arbitrary new rectangular country cutouts.

## Rebuild and validation

The build requires Python with Pillow and NumPy, Node.js, the two source files,
and the repository's existing offline country geometry:

```text
python scripts/build-region-relief.py source.tif rivers.geojson --node node
python tests/region-relief.py
```

The test checks all six immutable content hashes, lossless WebP encoding,
2700 × 1950 dimensions, original geometry checksum, exact viewBox transforms,
opaque real-country hint locations, transparent ocean control points, all
200 target identities and sub-nanopixel forward/inverse projection agreement.
It separately checks antimeridian wrapping on both sides of the Pacific.
