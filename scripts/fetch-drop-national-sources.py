#!/usr/bin/env python3
"""Fetch or rebuild the regional national NVE measured river sources.

Default rebuilds offline from hash-pinned responses in DOWNLOAD_DIRECTORY.
Use --download to fetch an updated selection. Full raw responses stay outside
the website repository; the compact projected source and manifest are retained.
Dependencies match build-drop-prototype-data.py: shapely and pyproj.
"""

import argparse
import colorsys
import concurrent.futures
import datetime
import gzip
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import tempfile
import time
import sys
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/geography/drop-prototype/sources/southwest"
SERVICE = "https://gis3.nve.no/map/rest/services/Mapservices/Nevina4/MapServer/3"
WHERE = "vassdragsOmradeNr >= '017' AND vassdragsOmradeNr <= '112' AND (lengde_m >= 5000 OR arealElverute_km2 >= 2)"
FIELDS = "OBJECTID,elvId,vnrNfelt,elvenavn,lengde_m,arealElverute_km2,vassdragsOmradeNr"
MANIFEST = "elvis-route-fetch-index.json"
sys.dont_write_bytecode = True


def encode(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()


def request(url):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "OnlyFag-source-builder/1.0"})
            with urllib.request.urlopen(req, timeout=120) as response:
                raw = response.read()
            value = json.loads(raw)
            if value.get("error"):
                raise ValueError(value["error"])
            return raw, value
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)


def query(parameters):
    return SERVICE + "/query?" + urllib.parse.urlencode({"f": "json", **parameters})


def download(directory):
    directory.mkdir(parents=True, exist_ok=True)
    selection = {"where": WHERE, "returnIdsOnly": "true"}
    raw, value = request(query(selection))
    ids = sorted(set(value["objectIds"]))
    if not ids:
        raise ValueError("The selected NVE source must not be empty")
    (directory / "selection-response.json").write_bytes(raw)
    metadata, _ = request(SERVICE + "?f=json")
    (directory / "elvis-service-metadata.json.gz").write_bytes(gzip.compress(metadata, mtime=0))

    def chunk(item):
        index, group = item
        filename = f"elvis-routes-{index:03}.json.gz"
        parameters = {"objectIds": ",".join(map(str, group)), "outFields": FIELDS,
                      "returnGeometry": "true", "returnM": "true", "outSR": "25833"}
        url = query(parameters)
        raw, data = request(url)
        assert not data.get("error") and not data.get("exceededTransferLimit"), filename
        actual = sorted(feature["attributes"]["OBJECTID"] for feature in data["features"])
        assert actual == group, (filename, "NVE response omitted or duplicated source objects")
        assert data.get("hasM") is not False, filename
        (directory / filename).write_bytes(gzip.compress(raw, mtime=0))
        record = {"file": filename, "url": url, "sha256": hashlib.sha256(raw).hexdigest(),
                  "features": len(data["features"]),
                  "points": sum(len(line) for feature in data["features"] for line in feature["geometry"]["paths"]),
                  "bytes": len(raw)}
        print(f"Source {index + 1}/{(len(ids) + 99) // 100}: {len(raw):,} bytes", flush=True)
        return index, record

    groups = [(i // 100, ids[i:i + 100]) for i in range(0, len(ids), 100)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        records = [record for _, record in sorted(pool.map(chunk, groups))]
    manifest = {"service": SERVICE, "retrievedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "selection": {"url": query(selection), "parameters": {"f": "json", **selection}},
                "fields": FIELDS.split(","), "ids": ids, "records": records}
    (directory / MANIFEST).write_bytes(encode(manifest))
    print(f"Downloaded {len(ids)} objects in {len(records)} complete requests", flush=True)


def build(directory, destination):
    manifest = json.loads((directory / MANIFEST).read_text(encoding="utf-8"))
    features = []
    for record in manifest["records"]:
        raw = gzip.decompress((directory / record["file"]).read_bytes())
        assert hashlib.sha256(raw).hexdigest() == record["sha256"], record["file"]
        features.extend(json.loads(raw)["features"])
    assert sorted(feature["attributes"]["OBJECTID"] for feature in features) == sorted(manifest["ids"])
    families = {}
    for feature in features:
        a = feature["attributes"]
        family = a["elvId"].rsplit("-", 1)[0]
        families.setdefault(family, {"name": None, "areaKm2": 0, "mainObjects": []})
        if a["elvId"] == family + "-1":
            families[family]["mainObjects"].append(a["OBJECTID"])
            if not families[family]["name"] and (a.get("elvenavn") or "").strip():
                families[family]["name"] = a["elvenavn"].strip()
            families[family]["areaKm2"] = max(families[family]["areaKm2"], a.get("arealElverute_km2") or 0)
    # Missing main routes are excluded by the calibration audit below.
    # The furthest measured main-route endpoint must still be represented by a
    # valid, monotonic measured part. Otherwise its apparent outlet could be an
    # inland fragment left behind when damaged source measures were discarded.
    raw_maximum, valid_maximum = {}, {}
    for feature in features:
        a = feature["attributes"]
        family = a["elvId"].rsplit("-", 1)[0]
        if a["elvId"] != family + "-1":
            continue
        for line in feature["geometry"]["paths"]:
            finite = [p[-1] for p in line if len(p) >= 3 and p[-1] is not None and math.isfinite(p[-1])]
            if finite:
                raw_maximum[family] = max(raw_maximum.get(family, 0), max(finite))
            if len(finite) != len(line) or len(line) < 2:
                continue
            measures = list(reversed(finite)) if finite[-1] < finite[0] else finite
            if measures[-1] - measures[0] >= .01 and all(b >= a - .05 for a, b in zip(measures, measures[1:])):
                valid_maximum[family] = max(valid_maximum.get(family, 0), measures[-1])
    excluded = [{"basin": family, "route": family + "-1", "sourceObjectIds": families[family]["mainObjects"],
                 "reason": "main outlet has no usable monotonic source measures",
                 "sourceMaximumMeasureM": raw_maximum.get(family),
                 "validMaximumMeasureM": valid_maximum.get(family)}
                for family in sorted(families)
                if family not in valid_maximum or raw_maximum[family] - valid_maximum[family] > .05]
    excluded_ids = {item["basin"] for item in excluded}
    spec = importlib.util.spec_from_file_location("drop_builder", ROOT / "scripts/build-drop-prototype-data.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    names = {}
    for index, family in enumerate(sorted(set(families) - excluded_ids)):
        rgb = colorsys.hsv_to_rgb((index * 0.61803398875) % 1, .48, .94)
        names[family] = (families[family]["name"] or "Vassdrag " + family,
                         "#" + "".join(f"{round(channel * 255):02x}" for channel in rgb))
    destination.mkdir(parents=True, exist_ok=True)
    module.SOURCES = destination
    module.SOURCE = destination / "elvis-directed-network.json.gz"
    module.FAMILIES = names
    # Some official objects duplicate the same measured route geometry. Keep
    # the lowest source OBJECTID, while retaining different multipart routes.
    # The unmodified downloads and their original digests stay in the manifest.
    kept, seen, duplicates = set(), {}, []
    for feature in sorted(features, key=lambda f: f["attributes"]["OBJECTID"]):
        a = feature["attributes"]
        if a["elvId"].rsplit("-", 1)[0] in excluded_ids:
            continue
        paths = [list(reversed(line)) if len(line) > 1 and line[-1][-1] is not None and line[0][-1] is not None and line[-1][-1] < line[0][-1] else line
                 for line in feature["geometry"]["paths"]]
        key = (a["elvId"], hashlib.sha256(module.encoded(paths)).hexdigest())
        if key in seen:
            duplicates.append({"route": a["elvId"], "retainedObjectId": seen[key],
                               "omittedObjectId": a["OBJECTID"], "geometrySha256": key[1]})
        else:
            seen[key] = a["OBJECTID"]
            kept.add(a["OBJECTID"])
    with tempfile.TemporaryDirectory(prefix="deduplicated-import-", dir=directory) as tmp:
        prepared = Path(tmp)
        adjusted = {**manifest, "ids": sorted(kept), "records": []}
        for record in manifest["records"]:
            response = json.loads(gzip.decompress((directory / record["file"]).read_bytes()))
            response["features"] = [feature for feature in response["features"]
                                    if feature["attributes"]["OBJECTID"] in kept]
            raw = module.encoded(response)
            (prepared / record["file"]).write_bytes(gzip.compress(raw, mtime=0))
            adjusted["records"].append({**record, "sha256": hashlib.sha256(raw).hexdigest()})
        (prepared / MANIFEST).write_bytes(encode(adjusted))
        module.prepare_source(prepared)
    (destination / "arcgis-download-index.json").write_bytes(encode(manifest))
    snapshot = json.loads(gzip.decompress(module.SOURCE.read_bytes()))
    snapshot["regionTitle"] = REGION_LABEL
    snapshot["sourceSelection"] = manifest["selection"]
    snapshot["sourceService"] = SERVICE
    snapshot["sourceRetrievedAt"] = manifest["retrievedAt"]
    snapshot["validation"]["rawRouteCount"] = len(manifest["ids"])
    snapshot["validation"]["uniqueRouteCount"] = len(kept)
    snapshot["validation"]["exactDuplicateObjects"] = duplicates
    snapshot["validation"]["excludedFamilies"] = excluded
    snapshot["validation"]["selectedFamilyCount"] = len(families)
    for basin in snapshot["basins"]:
        family = basin["id"]
        basin["region"] = REGION_LABEL
        basin["mainCatchmentAreaKm2"] = families[family]["areaKm2"]
        basin["named"] = bool(families[family]["name"])
        basin["outletLabel"] = "utløpet av " + basin["name"]
    # Coordinates and endpoint measures are explicitly retained for every outlet.
    by_id = {segment["id"]: segment for segment in snapshot["segments"]}
    snapshot["outletCalibrations"] = [{"basin": basin["id"], "route": basin["sourceMainRoute"],
                                       "sourceObjectId": by_id[basin["outletSegment"]]["sourceObjectId"],
                                       "downstreamMeasureM": by_id[basin["outletSegment"]]["routeMeasureRange"][1],
                                       "point25833": basin["outlet"]} for basin in snapshot["basins"]]
    module.SOURCE.write_bytes(gzip.compress(module.encoded(snapshot), mtime=0))
    (destination / "selection-query.json").write_bytes(encode(manifest["selection"]))
    (destination / "elvis-service-metadata.json.gz").write_bytes((directory / "elvis-service-metadata.json.gz").read_bytes())
    digest = hashlib.sha256(module.SOURCE.read_bytes()).hexdigest()
    print(json.dumps({"snapshot": str(module.SOURCE), "sha256": digest, "bytes": module.SOURCE.stat().st_size,
                      "basins": len(snapshot["basins"]), "segments": len(snapshot["segments"]),
                      "validation": snapshot["validation"]}, ensure_ascii=False)[:8000], flush=True)


REGIONS = {
    "midtnorge": ("Midt-Norge", "((vassdragsOmradeNr >= '113' AND vassdragsOmradeNr <= '144') OR (vassdragsOmradeNr >= '308' AND vassdragsOmradeNr <= '311'))"),
    "nordnorge": ("Nord-Norge", "((vassdragsOmradeNr >= '145' AND vassdragsOmradeNr <= '247') OR (vassdragsOmradeNr >= '301' AND vassdragsOmradeNr <= '307'))"),
    "east-supplement": ("Sør-Norge", "((vassdragsOmradeNr >= '001' AND vassdragsOmradeNr <= '016') OR (vassdragsOmradeNr >= '312' AND vassdragsOmradeNr <= '315')) AND NOT (elvId LIKE '002-34-%' OR elvId LIKE '006-11-%' OR elvId LIKE '008-1-%' OR elvId LIKE '012-1-%' OR elvId LIKE '015-18-%' OR elvId LIKE '016-35-%')")
}
REGION_LABEL = ""

def main():
    global WHERE, OUTPUT, REGION_LABEL
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("region", choices=REGIONS)
    parser.add_argument("download_directory", type=Path)
    parser.add_argument("--download", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    REGION_LABEL, selection = REGIONS[args.region]
    WHERE = selection + " AND (lengde_m >= 5000 OR arealElverute_km2 >= 2)"
    OUTPUT = ROOT / "assets/geography/drop-prototype/sources" / args.region
    if args.download:
        download(args.download_directory)
    if args.check:
        with tempfile.TemporaryDirectory(prefix="drop-national-", dir=args.download_directory) as tmp:
            candidate = Path(tmp)
            build(args.download_directory, candidate)
            for file in candidate.iterdir():
                if file.suffix == ".json":
                    assert json.loads(file.read_text(encoding="utf-8")) == json.loads((OUTPUT / file.name).read_text(encoding="utf-8")), file.name
                else:
                    assert file.read_bytes() == (OUTPUT / file.name).read_bytes(), file.name
        print("PASS offline regional source reproduction", flush=True)
    else:
        build(args.download_directory, OUTPUT)

if __name__ == "__main__":
    main()
