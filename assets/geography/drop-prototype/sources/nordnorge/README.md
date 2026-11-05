# Nord-Norge: directed NVE river source

This pinned regional snapshot comes from [NVE NEVINA Elvenett, layer 3](https://gis3.nve.no/map/rest/services/Mapservices/Nevina4/MapServer/3), under NLOD (see the parent LICENSE.txt). It retains measured river paths in EPSG:25833, rather than estimating flow from a visual map.

## Selection

Hydrological drainage-area selection: **145–247, plus cross-border areas 301–307**. The exact SQL and request are in selection-query.json. Routes are selected when length is at least 5 km or mapped upstream catchment area is at least 2 km². This is display-scale coverage, not a claim to include every small brook.

The three viewer regions keep complete source river families together. They are hydrological loading groups, not administrative county borders. Areas 301–315 include Norwegian catchments draining across Sweden/Finland. Their declared endpoint is the furthest usable measured source endpoint, and must not automatically be described as an outlet on Norway's coast.

## Retained graph and audit

- Raw selected objects: 6,477.
- Unique retained objects after exclusions/deduplication: 6,099.
- Calibrated river families: 1,310.
- Directed segments: 10,863; routable: 10,781 (99.245%).
- Exact duplicate objects removed: 378.
- Excluded uncalibratable families: 0.
- Bad measured parts omitted: 0; unmatched route ends: 11; ambiguous junctions: 1; cycle breaks: 0.

M is a linear-reference measure, not elevation. Increasing M follows downstream. The importer corrects reversed storage order, accepts only finite monotonic measures, and checks that each retained main-route endpoint reaches the raw main route's maximum source measure. Families failing this test are excluded in the snapshot's audit. Only downstream endpoints within 1 metre of an actual same-family line can connect. No nearest-river jump across catchment divides is created. Fixed junctions stay exact; intermediate vertices use a 25-metre display simplification. Uncertain retained branches have routable=false and may not accept simulated drops.

The manifest records every unmodified geometry response, selected OBJECTID, request URL, byte count and SHA-256. Original response gzip files remain outside the published repository in work/national-river-research/nordnorge/. The snapshot retains all source route/object references, outlets, diagnostics, and the original duplicate/exclusion audit. Duplicate removal applies only to identical directed measured geometries; different multipart geometry is retained.

## Pin and offline reproduction

Compressed snapshot bytes: 3,205,871. SHA-256:

```
5043aecdd4c521ae8b220974323ba930f631a90d6b5256daedb3e1449899201e
```

With Shapely 2.1.2 and Pyproj 3.7.2 available on PYTHONPATH, from the repository root:

```
python -B scripts/fetch-drop-national-sources.py nordnorge PATH_TO_DOWNLOADED_RESPONSES --check
```

This rebuild is offline and checks original response hashes before parsing. Add --download only to deliberately refresh upstream data; review calibration/exclusion changes and update the consuming builder's pinned digest before publication. The regional importer does not modify the older eastern/southwestern snapshots.
