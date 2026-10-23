#!/usr/bin/env python3
"""Build the Oslo borough quiz from Oslo kommune's pinned vector geometries.

Install scripts/municipality-requirements.txt first. The build is offline and
retains the original high precision borough outlines. See the data README for
source versions, licensing and the small topology repair applied to overlaps.
"""

import argparse
import importlib.util
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True

from pyproj import Transformer
from shapely.geometry import box, shape
from shapely.ops import polygonize, transform, unary_union
from shapely.strtree import STRtree


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/geography/oslo-bydeler"
SOURCE = OUTPUT / "sources/oslo-boroughs.geojson.gz"
spec = importlib.util.spec_from_file_location("municipalities", ROOT / "scripts/build-norway-municipality-assets.py")
municipalities = importlib.util.module_from_spec(spec)
spec.loader.exec_module(municipalities)

NAMES = {
    "01": "Gamle Oslo", "02": "Grünerløkka", "03": "Sagene",
    "04": "St. Hanshaugen", "05": "Frogner", "06": "Ullern",
    "07": "Vestre Aker", "08": "Nordre Aker", "09": "Bjerke",
    "10": "Grorud", "11": "Stovner", "12": "Alna", "13": "Østensjø",
    "14": "Nordstrand", "15": "Søndre Nordstrand",
}


def polygonal(geometry):
    return unary_union(municipalities.polygons(geometry))


def build():
    source = municipalities.read_json_gzip(SOURCE)
    project = Transformer.from_crs("EPSG:4326", "EPSG:25833", always_xy=True).transform
    assert len(source["features"]) == 15
    assert {f["properties"]["id"] for f in source["features"]} == NAMES.keys()

    # Use the official fifteen borough polygons, rather than dissolving the
    # ninety-six independently drawn subdistricts (which would leave hundreds
    # of spurious internal cracks). Retain the official vertices and coastline.
    originals = {}
    for feature in source["features"]:
        geometry = shape(feature["geometry"])
        if not geometry.is_valid:
            geometry = geometry.buffer(0)
        originals[feature["properties"]["id"]] = transform(project, geometry)

    # Independently digitized neighbours overlap or leave narrow enclosed gaps.
    # Polygonize the *existing official edges*: each resulting face becomes one
    # answer. Overlap faces keep the lower-numbered borough; narrow gap faces
    # join the borough sharing the longest edge. No straight replacement lines
    # or smoothing are introduced, and genuine open water remains open.
    faces = polygonize(unary_union([g.boundary for g in originals.values()]))
    assigned = {code: [] for code in NAMES}
    gap_count = 0
    gap_area = 0
    for face in faces:
        point = face.representative_point()
        owners = [code for code, geometry in originals.items() if geometry.covers(point)]
        if owners:
            code = min(owners)
        else:
            assert face.area < 5000 and face.area / face.length < 6, "Unexpected gap: review the pinned source"
            # A centimetre comparison tolerance absorbs GEOS floating point
            # differences where projected collinear segments are split.
            shared = [(face.boundary.intersection(geometry.boundary.buffer(0.01)).length, code)
                      for code, geometry in originals.items()]
            length, code = max(shared, key=lambda entry: (entry[0], -int(entry[1])))
            assert length > 0
            gap_count += 1
            gap_area += face.area
        assigned[code].append(face)
    rows = [{"name": name, "code": code, "geometry": polygonal(unary_union(assigned[code]))}
            for code, name in NAMES.items()]
    assert all(row["geometry"].is_valid and not row["geometry"].is_empty for row in rows)
    occupied = unary_union([row["geometry"] for row in rows])
    original_union = unary_union(list(originals.values()))
    overlap_area = sum(g.area for g in originals.values()) - original_union.area
    assert gap_count == 53
    assert (overlap_area + gap_area) / occupied.area < 0.001
    assert abs(sum(row["geometry"].area for row in rows) - occupied.area) < 0.01
    canvas = municipalities.Canvas(occupied.bounds)

    hydrography = municipalities.read_json_gzip(municipalities.WATER_SOURCE)
    assert hydrography["crs"] == "EPSG:25833"
    water_geometries = [shape(f["geometry"]) for f in hydrography["features"]]
    water_kinds = [f["properties"]["kind"] for f in hydrography["features"]]
    water_tree = STRtree(water_geometries)
    water = []
    for index in sorted(water_tree.query(occupied, predicate="intersects")):
        geometry = water_geometries[index].intersection(occupied)
        path = canvas.path(geometry)
        if path:
            water.append({"kind": water_kinds[index], "d": path})
    assert water and any(w["kind"] == "river" for w in water)

    # The full Oslo municipality includes Marka and Sentrum. These and adjacent
    # municipalities are context, not extra answers among the fifteen boroughs.
    xmin, ymin, xmax, ymax = occupied.bounds
    margin = max(xmax - xmin, ymax - ymin)
    window = box(xmin - margin, ymin - margin, xmax + margin, ymax + margin)
    topology = municipalities.read_json_gzip(municipalities.BOUNDARY_SOURCE)
    nearby_land = []
    for feature in municipalities.decode_topology(topology):
        geometry = shape(feature["geometry"])
        # Cheap geographic bounds test avoids projecting the entire country.
        if not geometry.envelope.intersects(box(9.8, 59.2, 11.8, 60.5)):
            continue
        geometry = transform(project, geometry)
        if not geometry.is_valid:
            geometry = geometry.buffer(0)
        if geometry.intersects(window):
            nearby_land.append(geometry.intersection(window))
    surfaces = [water_geometries[index] for index in water_tree.query(window, predicate="intersects")
                if water_kinds[index] != "river"]
    context = unary_union(nearby_land).difference(occupied)
    if surfaces:
        context = context.difference(unary_union(surfaces))
    # Context is intentionally calmer; only the surrounding land is simplified.
    context = context.simplify(10, preserve_topology=True)
    boundaries = unary_union([r["geometry"].boundary for r in rows]).difference(occupied.boundary)
    data = {
        "title": "Bydeler i Oslo", "viewBox": canvas.view_box,
        "states": [{"n": r["name"], "a": r["code"], "d": canvas.path(r["geometry"]),
                    "c": canvas.center(r["geometry"])} for r in rows],
        "water": water, "boundaries": canvas.path(boundaries),
        "context": canvas.path(context),
        "source": {"boundaries": source["source"], "hydrography": hydrography["source"],
                   "topologyRepair": {"overlapAreaM2": round(overlap_area, 2),
                                      "gapAreaM2": round(gap_area, 2), "gapFaces": gap_count}},
    }
    return municipalities.dump(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    content = build()
    path = OUTPUT / "map.json"
    if args.check:
        assert path.read_text(encoding="utf-8") == content, "Rebuild Oslo borough map"
    else:
        path.write_text(content, encoding="utf-8")
    data = json.loads(content)
    print(f"{'Verified' if args.check else 'Built'} Oslo borough map: "
          f"{len(data['states'])} boroughs, {len(data['water'])} water features, "
          f"{len(content.encode()):,} bytes")


if __name__ == "__main__":
    main()
