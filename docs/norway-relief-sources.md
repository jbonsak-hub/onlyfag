# Norwegian physical basemaps

The municipality county quizzes and the Oslo-area quiz have optional, local,
label-free physical backdrops. These are independent HTML image layers under the
answer SVG, like Statle and the six world regions. Answer updates do not change
image sources, decoded pixels or per-image transforms. No external map requests
are made during play.

## Sources

- Fine hillshade: Kartverket, **Høydedata – laser – Digital terrengmodell WMS**,
  layer `DTM:skyggerelieff`, [official metadata](https://kartkatalog.geonorge.no/Metadata/uuid/5a668bef-0e25-46bc-8002-fe284427490c).
  [Capabilities](https://wms.geonorge.no/skwms1/wms.hoyde-dtm?request=GetCapabilities&service=WMS).
  [Official service record and CC BY 4.0 license](https://data.norge.no/nb/data-services/8cf50db2-aa33-3320-b5f9-dc47adb080b3/hoydedata-laser-digital-terrengmodell-wms).
  This is terrain-only hillshade; no place names, roads or administrative labels.
- Outside the national DTM coverage: the same pinned public-domain
  [Natural Earth II 1:50m raster](https://www.naturalearthdata.com/downloads/50m-raster-data/50m-natural-earth-2/)
  as the world-region maps. Its source checksum is retained in the manifest.
  Large flat value-253 missing-coverage patches are identified separately from
  small real bright highlights. Only those patches use the coarser global
  terrain; a three-pixel feather at the coverage edge avoids white rectangular
  strips along Sweden. Valid detailed Norwegian hillshade remains sharp.
- Coast, islands and inland water: the unchanged, attributed Kartverket-derived
  municipality atlas and existing Oslo-area geometry. Their original provenance
  and licenses are documented in `assets/geography/municipalities/README.md` and
  `assets/geography/oslo-bydeler/README.md`.

The existing on-page Kartverket credit applies to the physical terrain too.

## Projection and assets

`scripts/build-norway-relief.py` decodes the pinned municipality topology and
reconstructs the original **EPSG:25833** `Canvas` fit from the exact currently
selected municipality codes. It checks every stored interior point and viewBox.
The current special Oslo-and-surroundings map uses `index-v3.json` and
`county-03-v3.json` (31 targets). Legacy 54- and 30-target snapshots are untouched.
The separate 43-target Oslo map uses its explicit broad `contextCrop` and its
unchanged adaptive camera.

The WMS renders directly in that same UTM CRS. Requests are split into at most
2048×2048 pixel tiles, with exactly matching geographical pixel edges. The build
does not resize the returned hillshade tiles. All request URLs, exact response
hashes, dimensions and UTM bounds are captured in `norway-relief.json`.
Source PNGs are cached outside the repository for reproducible offline rebuilds.

Each county includes a 400-SVG-unit margin around its viewBox, at two source
pixels per SVG unit. Oslo retains 4096×3955 source pixels across its broad
145×140 km context. Pixels are saved as content-hashed **lossless WebP**.
The browser maps these images into the existing SVG coordinate space without
canvas downsampling. All rivers and lakes are baked into the backdrop, allowing
the SVG water layer to be hidden in physical mode.

Terrain shading uses a fixed quiet pale-green tint. Every available source
hillshade pixel and grayscale value remains an input; the build applies no
spatial smoothing or downsampling to the hillshade. Local coast/water geometry
supplies the detailed shoreline. Water uses a quiet blue;
no geographic names or new quiz targets are baked into any image. Original quiz
polygons, boundaries, hint points, camera fits and scoring pools are unchanged.

## Build and validation

With Pillow, NumPy and `scripts/municipality-requirements.txt` installed:

```text
python scripts/build-norway-relief.py --cache ../terrain-source/norway-dtm --natural-earth ../terrain-source/NE2_50M_SR_W.tif
python tests/norway-relief.py
```

The checks cover all 16 current maps, exact asset hashes and lossless encoding,
source dimensions, unchanged geometry hashes, UTM/pixel bounds and seamless WMS
tile edges. They also check baked Oslofjord and Mjøsa water pixels.
