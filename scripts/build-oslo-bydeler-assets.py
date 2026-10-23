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
from shapely.geometry import Point, box, shape
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

    # Sentrum is a separate statistical area, outside the fifteen ordinary
    # boroughs. Its inland edges are already defined by their official outlines;
    # close the remaining seaward edge with the atlas's Kartverket coastline.
    topology = municipalities.read_json_gzip(municipalities.BOUNDARY_SOURCE)
    municipality_features = list(municipalities.decode_topology(topology))
    oslo = next(f for f in municipality_features if f["properties"]["id"] == "0301")
    oslo_land = transform(project, shape(oslo["geometry"])).buffer(0)
    city_centre = transform(project, Point(10.738, 59.913))
    sentrum = next(g for g in municipalities.polygons(oslo_land.difference(occupied))
                   if g.covers(city_centre))
    assert 1_500_000 < sentrum.area < 2_300_000, "Review the Sentrum/coastline intersection"
    rows.append({"name": "Sentrum", "code": "16", "geometry": sentrum})
    occupied = unary_union([row["geometry"] for row in rows])
    assert len(rows) == 16
    assert abs(sum(row["geometry"].area for row in rows) - occupied.area) < 0.01
    # Add the two neighbouring municipalities without inventing sub-locality
    # boundaries. The four Bærum localities and the two large forest regions
    # use explicit point targets instead of administrative-looking polygons.
    for code, name in [("3212", "Nesodden"), ("3222", "Lørenskog")]:
        feature = next(f for f in municipality_features if f["properties"]["id"] == code)
        geometry = transform(project, shape(feature["geometry"])).buffer(0)
        rows.append({"name": name, "code": code, "geometry": geometry, "kind": "land"})
    bygdoy_source = municipalities.read_json_gzip(OUTPUT / "sources/bygdoy.geojson.gz")
    bygdoy = transform(project, shape(bygdoy_source["features"][0]["geometry"])).buffer(0)
    # Keep the small subdistrict inside its parent borough, preserving a
    # readable independent target without a coastal sliver outside Frogner.
    frogner = next(row["geometry"] for row in rows if row["code"] == "05")
    rows.append({"name": "Bygdøy", "code": "bygdoy", "geometry": polygonal(bygdoy.intersection(frogner)), "kind": "land"})
    occupied = unary_union([row["geometry"] for row in rows])
    point_source = json.loads((OUTPUT / "sources/local-reference-points.json").read_text(encoding="utf-8"))
    point_rows = [{**place, "geometry": transform(project, Point(*place["coordinate"]))}
                  for place in point_source["places"]]

    hydrography = municipalities.read_json_gzip(municipalities.WATER_SOURCE)
    assert hydrography["crs"] == "EPSG:25833"
    water_geometries = [shape(f["geometry"]) for f in hydrography["features"]]
    water_kinds = [f["properties"]["kind"] for f in hydrography["features"]]
    water_tree = STRtree(water_geometries)
    # The two large lakes exist in the pinned N1000 source. Select by a point
    # inside the actual polygon, retaining the complete unsimplified outline.
    lake_targets = []
    for name, code, coordinate in [("Bogstadvannet", "lake-bogstad", (10.622, 59.970)),
                                   ("Maridalsvannet", "lake-maridal", (10.772, 59.982))]:
        point = transform(project, Point(*coordinate))
        candidates = [int(index) for index in water_tree.query(point)
                      if water_kinds[index] == "lake" and water_geometries[index].covers(point)]
        assert len(candidates) == 1, "Named lake no longer matches the pinned water source"
        index = candidates[0]
        lake_targets.append({"name": name, "code": code, "geometry": water_geometries[index], "kind": "lake", "sourceIndex": index})
    # UTM preserves geographical shape. Padding the canvas, rather than
    # stretching its coordinates, keeps the expanded map approximately square.
    extent = unary_union([occupied, *[row["geometry"] for row in point_rows],
                          *[row["geometry"] for row in lake_targets]])
    xmin, ymin, xmax, ymax = extent.bounds
    width, height = xmax - xmin, ymax - ymin
    target_width = max(width, height * 1.08)
    target_height = max(height, width / 1.2)
    xpad, ypad = (target_width - width) / 2, (target_height - height) / 2
    # Leave markers and their touch targets clear of the viewport edge on
    # small screens. This is geographic padding, never a projection stretch.
    touch_margin = max(target_width, target_height) * 0.03
    canvas = municipalities.Canvas((xmin - xpad - touch_margin, ymin - ypad - touch_margin,
                                    xmax + xpad + touch_margin, ymax + ypad + touch_margin))
    named_water = {row["sourceIndex"] for row in lake_targets}
    water = []
    for index in sorted(water_tree.query(occupied, predicate="intersects")):
        if int(index) in named_water:
            continue
        geometry = water_geometries[index].intersection(occupied)
        path = canvas.path(geometry)
        if path:
            water.append({"kind": water_kinds[index], "d": path})
    assert water and any(w["kind"] == "river" for w in water)

    # Marka and adjacent municipalities remain non-playable context.
    xmin, ymin, xmax, ymax = extent.bounds
    margin = max(xmax - xmin, ymax - ymin)
    window = box(xmin - margin, ymin - margin, xmax + margin, ymax + margin)
    nearby_land = []
    for feature in municipality_features:
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
    administrative = [row["geometry"] for row in rows if row["code"] != "bygdoy"]
    administrative_union = unary_union(administrative)
    boundaries = unary_union([g.boundary for g in administrative]).difference(administrative_union.boundary)
    # The finer Bygdøy coastline differs slightly from the borough overview.
    # Keep only its inland edge in the high-contrast administrative overlay;
    # the actual playable coastline is retained and gets the ordinary outline.
    bygdoy_geometry = next(row["geometry"] for row in rows if row["code"] == "bygdoy")
    bygdoy_inland_edge = bygdoy_geometry.boundary.intersection(frogner.buffer(-250))
    boundaries = unary_union([boundaries, bygdoy_inland_edge])
    # Marka is background context. A marker identifies the requested nearby
    # part of Nordmarka/Østmarka without claiming that the municipal boundary
    # or all northern forest (which includes Lillomarka) is its true extent.
    original_city = unary_union([row["geometry"] for row in rows[:16]])
    marka = oslo_land.difference(original_city).intersection(window)
    marka = unary_union([g for g in municipalities.polygons(marka) if g.area > 1_000_000])
    if surfaces:
        marka = marka.difference(unary_union(surfaces))
    states = [{"n": row["name"], "a": row["code"], "kind": row.get("kind", "land"),
               "d": canvas.path(row["geometry"]), "c": canvas.center(row["geometry"])}
              for row in [*rows, *lake_targets]]
    for row in point_rows:
        states.append({"n": row["name"], "a": row["code"], "kind": "place", "marker": True,
                       "category": row["category"], "c": canvas.point(row["geometry"].x, row["geometry"].y)})
    assert len(states) == len({state["n"] for state in states}) == 28
    data = {
        "title": "Oslo", "viewBox": canvas.view_box, "states": states,
        "water": water, "boundaries": canvas.path(boundaries),
        "context": canvas.path(context), "forestContext": canvas.path(marka.simplify(10, preserve_topology=True)),
        "source": {"boundaries": source["source"], "hydrography": hydrography["source"],
                   "bygdoy": bygdoy_source["source"], "places": point_source["source"],
                   "sentrum": {"method": "Oslo land minus the fifteen boroughs; connected component containing the city centre",
                               "coastline": topology.get("source", {}), "areaM2": round(sentrum.area, 2)},
                   "topologyRepair": {"overlapAreaM2": round(overlap_area, 2),
                                      "gapAreaM2": round(gap_area, 2), "gapFaces": gap_count}},
    }
    return municipalities.dump(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    content = build()
    path = OUTPUT / "oslo.json"
    if args.check:
        assert path.read_text(encoding="utf-8") == content, "Rebuild Oslo map"
    else:
        path.write_text(content, encoding="utf-8")
    data = json.loads(content)
    print(f"{'Verified' if args.check else 'Built'} Oslo map: "
          f"{len(data['states'])} targets, {len(data['water'])} water features, "
          f"{len(content.encode()):,} bytes")


if __name__ == "__main__":
    main()
