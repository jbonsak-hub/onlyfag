# Supplementary southern and western river networks

Publisher: Norges vassdrags- og energidirektorat (NVE). Source: [NEVINA Elvenett, layer 3](https://gis3.nve.no/map/rest/services/Mapservices/Nevina4/MapServer/3). Retrieved 5 November 2026. The existing eastern source snapshot remains unchanged. License: [NLOD](../LICENSE.txt).

The selection covers NVE drainage-area numbers **017–112**, using the same display threshold as the original prototype: source route length at least **5 km**, or upstream route catchment area at least **2 km²**. These numbers are coastal drainage regions, not county boundaries. The broad display groups are Sørlandet (017–026) and Vestlandet (027–112), including the western fjords and Møre coast through the Surna catchment.

The official query selected **3,709 source objects** in **936 exact route families**. All source IDs were downloaded in 38 complete requests of at most 100 objects, with measured geometry in EPSG:25833. The unmodified responses contain 91,719,068 bytes and 1,565,114 vertices. `arcgis-download-index.json` retains every request URL, selected ID, byte/point count and original SHA-256; the full compressed responses are retained outside the website repository in `work/southwest-research/source-downloads/`. `selection-query.json` and `elvis-service-metadata.json.gz` preserve the selection and layer metadata.

## Calibration and conservative import

- **27 exact duplicate source objects** in drainage area 082 were removed by comparing the same route ID and directed measured geometry. Ten were duplicates of main routes. The lowest OBJECTID was kept; every omitted and retained ID and geometry digest is audited in `validation.exactDuplicateObjects`. Different multipart geometry is retained.
- Unnamed family **056-75** (OBJECTID 2184352) is excluded. Six main-route parts have a constant M=5647 instead of usable increasing measures, and the only valid fragment ends at M=2008 inland. Treating that fragment as an outlet would falsely terminate a journey inland. The exclusion and raw/valid maximum measures are audited in `validation.excludedFamilies`.
- The retained **935 families** all have a measured main-route endpoint matching the largest finite M of the original main geometry. Their projected outlet coordinates and source references are retained in `outletCalibrations`. This also verified that the new source segment IDs do not collide with the old eastern snapshot.
- The import uses the existing **1-metre same-family junction tolerance** and **25-metre simplification**. The largest actual accepted adjustment is about **0.000325 metre**. Junctions remain fixed. M is a linear-reference measure, not elevation.

The resulting snapshot contains **6,417 directed segments**, of which **6,390 (99.579%)** reach calibrated main-route outlets. Eight unmatched route ends and one ambiguous multipart junction affect 27 segments, which remain `routable: false`. No cycle removal was required. No cross-catchment or nearest-main-river connection is invented.

The retained groups contain **109 Sørlandet** and **826 Vestlandet** families. There are 753 officially named and 182 unnamed main routes. Basins include `region`, `mainCatchmentAreaKm2`, `named`, and a generic `outletLabel`; no unverified town or fjord name is inferred. The routes are line networks, rather than catchment-boundary polygons or a rainfall-runoff terrain model.

## Pinned snapshot and rebuilding

`elvis-directed-network.json.gz` contains the projected geometry, source route/object references, downstream topology, calibrated outlets, and diagnostics. Its compressed SHA-256 is:

```
49603ef67d72cb667c3d2ce4b14a9400c9ea7643bf916ed1888fdbea95e778e8
```

The compressed file is 1,735,408 bytes; its normalized JSON is 5,784,310 bytes. The import used Python 3.12, Shapely 2.1.2, Pyproj 3.7.2, NumPy 2.5.4 and Certifi 2026.10.23, installed into a workspace-only dependency folder.

From the repository root, with the GIS dependencies on `PYTHONPATH`:

```sh
python scripts/fetch-drop-southwest-source.py /path/to/source-downloads
python scripts/fetch-drop-southwest-source.py /path/to/source-downloads --check
```

Both commands are offline and verify each raw response digest before import. `--check` reconstructs the snapshot in a temporary directory and compares its bytes to the pinned file. To deliberately fetch a new source edition, add `--download`; review changed calibration/exclusion diagnostics and update the pin in the main builder before publication.
