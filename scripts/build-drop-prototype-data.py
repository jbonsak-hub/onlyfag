#!/usr/bin/env python3
"""Build the river-drop prototype offline from pinned, directed NVE river lines.

--prepare-source DIRECTORY imports the retained full ArcGIS downloads once.
Ordinary builds and --check use only the compact pinned source in the repo.
"""

import argparse
from collections import defaultdict, deque
import gzip
import hashlib
import json
import math
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import LineString, Point
from shapely.ops import substring
from shapely.strtree import STRtree


ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / "assets/geography/drop-prototype"
SOURCES = DIRECTORY / "sources"
SOURCE = SOURCES / "elvis-directed-network.json.gz"
OUTPUT = DIRECTORY / "data.json"
SOURCE_SHA256 = "442188c7c8950625c866cf6b86c85eb2e28b2257b6a20c057890d0ca4bbfa342"
FAMILIES = {
    "002-34": ("Glomma", "#47bdff"),
    "006-11": ("Akerselva og Nordmarka", "#fa6ba9"),
    "008-1": ("Sandvikselva", "#c7fa62"),
    "012-1": ("Drammensvassdraget", "#b590ff"),
    "015-18": ("Numedalslågen", "#ffad58"),
    "016-35": ("Skiensvassdraget", "#55e2bc"),
}
JUNCTION_TOLERANCE_M = 1.0
SIMPLIFICATION_M = 25.0
OUTLET_LABELS = {
    "002-34": "Fredrikstad · Oslofjorden",
    "006-11": "Bjørvika · Oslofjorden",
    "008-1": "Sandvika · Oslofjorden",
    "012-1": "Drammensfjorden",
    "015-18": "Larvik · Larviksfjorden",
    "016-35": "Porsgrunn · Frierfjorden",
}


def encoded(data):
    return (json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode()


def prepare_source(downloads):
    manifest = json.loads((downloads / "elvis-route-fetch-index.json").read_text())
    routes, omitted = [], []
    main_features = {}
    for record in manifest["records"]:
        raw = gzip.decompress((downloads / record["file"]).read_bytes())
        assert hashlib.sha256(raw).hexdigest() == record["sha256"], record["file"]
        response = json.loads(raw)
        assert not response.get("error") and not response.get("exceededTransferLimit")
        for feature in response["features"]:
            attributes = feature["attributes"]
            river_id = attributes["elvId"]
            family = river_id.rsplit("-", 1)[0]
            assert family in FAMILIES
            for part, path in enumerate(feature["geometry"]["paths"]):
                if len(path) < 2 or any(len(p) < 3 or p[-1] is None or not math.isfinite(p[-1]) for p in path):
                    omitted.append({"route": river_id, "part": part, "reason": "missing source measures"})
                    continue
                if path[-1][-1] < path[0][-1]:
                    path = list(reversed(path))
                measures = [p[-1] for p in path]
                if measures[-1] - measures[0] < 0.01 or any(b < a - 0.05 for a, b in zip(measures, measures[1:])):
                    omitted.append({"route": river_id, "part": part, "reason": "nonmonotonic source measures"})
                    continue
                line = LineString([(p[0], p[1]) for p in path])
                if line.length < 1:
                    continue
                item = {"route": river_id, "part": part, "basin": family, "line": line,
                        "name": attributes.get("elvenavn") or "", "m0": measures[0], "m1": measures[-1],
                        "sourceObjectId": attributes["OBJECTID"]}
                routes.append(item)
                if river_id == family + "-1":
                    previous = main_features.get(family)
                    if previous is None or item["m1"] > previous["m1"]:
                        main_features[family] = item
    assert set(main_features) == set(FAMILIES), "Every selected basin needs its measured main route"
    print(f"Imported {len(routes)} measured route parts; omitted {len(omitted)}", flush=True)
    lines = [route["line"] for route in routes]
    tree = STRtree(lines)
    main_indexes = {family: next(i for i, route in enumerate(routes) if route is main)
                    for family, main in main_features.items()}
    joins, cuts, unmatched, ambiguous = {}, defaultdict(list), [], []
    max_join_distance = 0.0
    for i, route in enumerate(routes):
        if main_indexes[route["basin"]] == i:
            continue
        endpoint = Point(route["line"].coords[-1])
        candidates = []
        for candidate in tree.query(endpoint.buffer(JUNCTION_TOLERANCE_M)):
            j = int(candidate)
            if j == i or routes[j]["basin"] != route["basin"]:
                continue
            target = lines[j]
            distance = target.distance(endpoint)
            if distance > JUNCTION_TOLERANCE_M:
                continue
            along = target.project(endpoint)
            if target.length - along < 0.05:
                continue
            candidates.append((distance, j, along))
        candidates.sort()
        if not candidates:
            unmatched.append(route["route"])
            continue
        best = candidates[0]
        if len(candidates) > 1 and abs(candidates[1][0] - best[0]) < 0.01:
            ambiguous.append({"route": route["route"], "candidates": [routes[c[1]]["route"] for c in candidates]})
            continue
        distance, j, along = best
        joins[i] = (j, along)
        cuts[j].append(along)
        max_join_distance = max(max_join_distance, distance)
    print(f"Verified {len(joins)} same-basin source junctions; unmatched {len(unmatched)}, ambiguous {len(ambiguous)}", flush=True)
    intervals, split_distances, segments = {}, {}, []
    for i, route in enumerate(routes):
        line = route["line"]
        distances = [0.0]
        for value in sorted(cuts[i]):
            if value - distances[-1] > 0.05 and line.length - value > 0.05:
                distances.append(value)
        distances.append(line.length)
        split_distances[i] = distances
        intervals[i] = []
        for ordinal, (start, end) in enumerate(zip(distances, distances[1:])):
            geometry = substring(line, start, end)
            if geometry.geom_type != "LineString" or geometry.length < 0.01:
                continue
            simplified = geometry.simplify(SIMPLIFICATION_M, preserve_topology=False)
            segment = {"id": f"nve-{route['sourceObjectId']}:p{route['part']}:s{ordinal}", "route": route["route"],
                       "basin": route["basin"], "next": None,
                       "points": [[round(x, 2), round(y, 2)] for x, y in simplified.coords],
                       "lengthKm": round(geometry.length / 1000, 6), "name": route["name"],
                       "sourceObjectId": route["sourceObjectId"],
                       "measuredDirection": "increasingM", "routeMeasureRange": [route["m0"], route["m1"]]}
            intervals[i].append(segment)
            segments.append(segment)
        for first, second in zip(intervals[i], intervals[i][1:]):
            first["next"] = second["id"]
    for i, (j, distance) in joins.items():
        if not intervals[i] or not intervals[j]:
            continue
        at = min(range(len(split_distances[j])), key=lambda k: abs(split_distances[j][k] - distance))
        at = min(at, len(intervals[j]) - 1)
        receiving = intervals[j][at]
        intervals[i][-1]["next"] = receiving["id"]
        intervals[i][-1]["points"][-1] = receiving["points"][0][:]
    by_id = {segment["id"]: segment for segment in segments}
    assert len(by_id) == len(segments), "Source OBJECTID/part identities must remain unique"
    outlets = {family: intervals[i][-1]["id"] for family, i in main_indexes.items()}
    # Stop any ambiguous cyclic connectivity; such retained drawing lines are
    # explicitly unavailable for simulated drops, rather than inventing a route.
    cycle_breaks = []
    done = set()
    for segment in segments:
        seen, chain, current = {}, [], segment["id"]
        while current is not None and current not in done:
            if current in seen:
                cycle = chain[seen[current]:]
                for identifier in cycle:
                    by_id[identifier]["next"] = None
                cycle_breaks.extend(cycle)
                break
            seen[current] = len(chain)
            chain.append(current)
            current = by_id[current]["next"]
        done.update(chain)
    routing = {}
    verified_outlets = set(outlets.values())
    for segment in segments:
        current, chain = segment["id"], []
        while current not in routing:
            chain.append(current)
            following = by_id[current]["next"]
            if following is None:
                routing[current] = current in verified_outlets
                break
            current = following
        for identifier in reversed(chain):
            routing[identifier] = routing[current]
    incoming = defaultdict(list)
    for segment in segments:
        segment["routable"] = routing[segment["id"]]
        if segment["next"]:
            incoming[segment["next"]].append(segment["id"])
    degree = {identifier: len(incoming[identifier]) for identifier in by_id}
    queue = deque(identifier for identifier, number in degree.items() if not number)
    visited = 0
    while queue:
        identifier = queue.popleft()
        segment = by_id[identifier]
        orders = [by_id[upstream]["order"] for upstream in incoming[identifier]]
        highest = max(orders, default=1)
        segment["order"] = highest + (orders.count(highest) > 1)
        visited += 1
        if segment["next"]:
            degree[segment["next"]] -= 1
            if not degree[segment["next"]]:
                queue.append(segment["next"])
    assert visited == len(segments), "The retained directed graph must be acyclic"
    basins = [{"id": family, "name": FAMILIES[family][0], "color": FAMILIES[family][1],
               "outlet": by_id[outlets[family]]["points"][-1], "outletSegment": outlets[family],
               "sourceMainRoute": family + "-1"} for family in FAMILIES]
    starts = []
    for family, i in main_indexes.items():
        segment = intervals[i][0]
        if segment["routable"]:
            starts.append({"id": family, "label": FAMILIES[family][0], "segment": segment["id"], "fraction": 0.05})
    good = sum(segment["routable"] for segment in segments)
    result = {"crs": "EPSG:25833", "regionTitle": "Østlandets elver", "basins": basins,
              "segments": segments, "starts": starts,
              "validation": {"rawRouteCount": len(manifest["ids"]), "routeParts": len(routes),
                             "omittedMeasureParts": omitted, "verifiedJunctions": len(joins),
                             "maximumJunctionSnapM": max_join_distance, "unmatchedRoutes": unmatched,
                             "ambiguousJunctions": ambiguous, "cycleBreaks": cycle_breaks,
                             "segmentCount": len(segments), "routableSegments": good,
                             "routablePercent": round(good / len(segments) * 100, 3),
                             "simplificationM": SIMPLIFICATION_M, "junctionToleranceM": JUNCTION_TOLERANCE_M}}
    SOURCES.mkdir(parents=True, exist_ok=True)
    SOURCE.write_bytes(gzip.compress(encoded(result), mtime=0))
    (SOURCES / "arcgis-download-index.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(result["validation"], ensure_ascii=False)[:5000], flush=True)
    print(f"Source gzip {SOURCE.stat().st_size:,} bytes; SHA256 {hashlib.sha256(SOURCE.read_bytes()).hexdigest()}", flush=True)


def build():
    raw = SOURCE.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == SOURCE_SHA256, "Unexpected pinned river network"
    data = json.loads(gzip.decompress(raw))
    assert data["crs"] == "EPSG:25833"
    source_segments = {segment["id"]: segment for segment in data["segments"]}
    source_outlets = {basin["id"]: basin["outletSegment"] for basin in data["basins"]}
    terminal = {}
    for identifier in source_segments:
        current, chain, seen = identifier, [], set()
        while current not in terminal:
            assert current not in seen, "Directed source network cannot contain a cycle"
            seen.add(current)
            chain.append(current)
            following = source_segments[current]["next"]
            if following is None:
                terminal[current] = current
                break
            assert following in source_segments
            current = following
        for item in reversed(chain):
            terminal[item] = terminal[current]
    for segment in data["segments"]:
        assert segment["routable"] == (terminal[segment["id"]] == source_outlets[segment["basin"]])
    initial_starts = {start["id"]: start for start in data["starts"]}
    data["starts"] = [initial_starts[family] for family in FAMILIES]
    for route, label in [("002-34-8230", "Otta → Glomma"),
                         ("002-34-8500", "Rena → Glomma"),
                         ("002-34-3661", "Lågen og Vorma → Glomma")]:
        selected = next(segment for segment in data["segments"]
                        if segment["route"] == route and segment["routable"] and segment["id"].endswith(":s0"))
        data["starts"].append({"id": route, "label": label, "segment": selected["id"], "fraction": 0.05})
    geographic = Transformer.from_crs("EPSG:25833", "EPSG:4326", always_xy=True)
    calibrations = [{"basin": basin["id"], "mainRoute": basin["sourceMainRoute"],
                     "outletLongitudeLatitude": [round(v, 6) for v in geographic.transform(*basin["outlet"])],
                     "sourceMeasureRange": source_segments[basin["outletSegment"]]["routeMeasureRange"]}
                    for basin in data["basins"]]
    points = [point for segment in data["segments"] for point in segment["points"]]
    west = min(point[0] for point in points)
    east = max(point[0] for point in points)
    south = min(point[1] for point in points)
    north = max(point[1] for point in points)
    scale = 1200 / max(east - west, north - south)
    def point(p):
        return [round((p[0] - west) * scale, 4), round((north - p[1]) * scale, 4)]
    for segment in data["segments"]:
        segment["points"] = [point(p) for p in segment["points"]]
        for key in ["route", "sourceObjectId", "measuredDirection", "routeMeasureRange"]:
            segment.pop(key)
    for basin in data["basins"]:
        basin["outlet"] = point(basin["outlet"])
        basin["outletLabel"] = OUTLET_LABELS[basin["id"]]
    by_id = {segment["id"]: segment for segment in data["segments"]}
    for segment in data["segments"]:
        following = segment["next"]
        if following:
            assert following in by_id and by_id[following]["basin"] == segment["basin"]
            assert segment["points"][-1] == by_id[following]["points"][0], "Source junctions must remain exactly connected"
    result = {"version": 1, "regionTitle": data["regionTitle"],
              "viewBox": [0, 0, round((east - west) * scale, 4), round((north - south) * scale, 4)],
              "bounds": [0, 0, round((east - west) * scale, 4), round((north - south) * scale, 4)],
              "unitsPerKm": 1000 * scale, "yUp": False,
              "basins": data["basins"], "segments": data["segments"], "starts": data["starts"],
              "source": {"title": "NVE ELVIS · målte elveruter", "publisher": "Norges vassdrags- og energidirektorat",
                         "url": "https://gis3.nve.no/map/rest/services/Mapservices/Nevina4/MapServer/3",
                         "license": "NLOD", "licenseUrl": "https://data.norge.no/nlod/no/2.0",
                         "crs": "EPSG:25833", "projectedBounds": [west, south, east, north],
                         "normalizedSourceSha256": hashlib.sha256(raw).hexdigest(),
                         "selection": "Six exact NVE river families; source routes at least 5 km long or with mapped catchment area at least 2 km².",
                         "direction": "Source M values increase downstream; calibrated against Glomma's named main route from M=0 at its source to M=620920 at Fredrikstad. Each retained route is checked for monotonic measures.",
                         "outletCalibrations": calibrations,
                         "connections": "Only same-family downstream endpoints within 1 m of an actual source river line are connected. Receiving lines are split at those junctions. No nearest-river routing across drainage divides.",
                         "limitations": "This is a river-line prototype, not terrain routing. Small/unrepresented streams and unmatched or ambiguous ends remain unavailable to drops; only routable=true lines reach one of six verified main-route outlets. Visual simplification retains every fixed junction.",
                         "validation": data["validation"]}}
    return encoded(result)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--prepare-source", type=Path)
    args = parser.parse_args()
    if args.prepare_source:
        prepare_source(args.prepare_source)
    content = build()
    if args.check:
        assert OUTPUT.read_bytes() == content, "Rebuild river-drop prototype data"
    else:
        DIRECTORY.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_bytes(content)
    assert len(content) < 5_000_000, "Browser data must stay within the prototype budget"
    print(f"{'Verified' if args.check else 'Built'} {len(content):,} bytes of real directed river data", flush=True)


if __name__ == "__main__":
    main()
