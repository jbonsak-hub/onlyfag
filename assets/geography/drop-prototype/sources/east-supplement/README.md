# Sør-Norge supplement: directed NVE river source

This pinned regional snapshot comes from [NVE NEVINA Elvenett, layer 3](https://gis3.nve.no/map/rest/services/Mapservices/Nevina4/MapServer/3), under NLOD (see the parent LICENSE.txt). It retains measured river paths in EPSG:25833, rather than estimating flow from a visual map.

## Selection

Hydrological drainage-area selection: **001–016 except the six already retained eastern families, plus cross-border areas 312–315**. The exact SQL and request are in selection-query.json. Routes are selected when length is at least 5 km or mapped upstream catchment area is at least 2 km². This is display-scale coverage, not a claim to include every small brook.

The three viewer regions keep complete source river families together. They are hydrological loading groups, not administrative county borders. Areas 301–315 include Norwegian catchments draining across Sweden/Finland. Their declared endpoint is the furthest usable measured source endpoint, and must not automatically be described as an outlet on Norway's coast.

## Retained graph and audit

- Raw selected objects: 734.
- Unique retained objects after exclusions/deduplication: 734.
- Calibrated river families: 99.
- Directed segments: 1,364; routable: 1,362 (99.853%).
- Exact duplicate objects removed: 0.
- Excluded uncalibratable families: 0.
- Bad measured parts omitted: 0; unmatched route ends: 2; ambiguous junctions: 0; cycle breaks: 0.

M is a linear-reference measure, not elevation. Increasing M follows downstream. The importer corrects reversed storage order, accepts only finite monotonic measures, and checks that each retained main-route endpoint reaches the raw main route's maximum source measure. Families failing this test are excluded in the snapshot's audit. Only downstream endpoints within 1 metre of an actual same-family line can connect. No nearest-river jump across catchment divides is created. Fixed junctions stay exact; intermediate vertices use a 25-metre display simplification. Uncertain retained branches have routable=false and may not accept simulated drops.

The manifest records every unmodified geometry response, selected OBJECTID, request URL, byte count and SHA-256. Original response gzip files remain outside the published repository in work/national-river-research/east-supplement/. The snapshot retains all source route/object references, outlets, diagnostics, and the original duplicate/exclusion audit. Duplicate removal applies only to identical directed measured geometries; different multipart geometry is retained.

## Pin and offline reproduction

Compressed snapshot bytes: 380,036. SHA-256:

```
b1f17dcc7caa87d24c5e33cf6e1d57ac1568db88ed28e47c008347f78e4eb7fa
```

With Shapely 2.1.2 and Pyproj 3.7.2 available on PYTHONPATH, from the repository root:

```
python -B scripts/fetch-drop-national-sources.py east-supplement PATH_TO_DOWNLOADED_RESPONSES --check
```

This rebuild is offline and checks original response hashes before parsing. Add --download only to deliberately refresh upstream data; review calibration/exclusion changes and update the consuming builder's pinned digest before publication. The regional importer does not modify the older eastern/southwestern snapshots.
