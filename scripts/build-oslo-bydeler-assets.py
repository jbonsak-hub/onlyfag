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


def build_base():
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
    repairs = {"overlapAreaM2": round(overlap_area, 2), "gapAreaM2": round(gap_area, 2), "gapFaces": gap_count}
    return rows, source, topology, municipality_features, oslo_land, repairs, sentrum.area

def read_layer(path, default_kind):
    """Read a pinned polygon layer and normalize its source CRS to UTM33."""
    from pyproj import CRS
    data = municipalities.read_json_gzip(path) if path.suffix == ".gz" else json.loads(path.read_text(encoding="utf-8"))
    source_crs = data.get("crs", "EPSG:4326")
    if isinstance(source_crs, dict):
        source_crs = source_crs.get("properties", {}).get("name", "EPSG:4326")
    crs = CRS.from_user_input(source_crs)
    project = Transformer.from_crs(crs, "EPSG:25833", always_xy=True).transform
    rows = []
    for feature in data["features"]:
        props = feature.get("properties", {})
        name = props.get("name") or props.get("navn")
        assert name, f"Missing named area in {path.name}"
        geometry = shape(feature["geometry"])
        assert geometry.geom_type in ("Polygon", "MultiPolygon"), f"Point fallback is not permitted: {name}"
        geometry = transform(project, geometry)
        if not geometry.is_valid:
            geometry = geometry.buffer(0)
        rows.append({"name": name, "code": str(props.get("id", name)),
                     "kind": props.get("kind", default_kind), "geometry": polygonal(geometry),
                     "boundaryType": props.get("boundaryType"), "year": props.get("year")})
    return rows, data.get("source", {}), path.name


def clipped_row(row, crop, minimum_area=0):
    original = row["geometry"]
    geometry = polygonal(original.intersection(crop))
    if geometry.is_empty or geometry.area < minimum_area:
        return None
    share = geometry.area / original.area
    return {**row, "geometry": geometry, "visibleShare": round(min(1, share), 4),
            "clipped": share < 0.99999}


def build(require_sources=True):
    rows, source, topology, municipality_features, oslo_land, repairs, sentrum_area = build_base()
    project = Transformer.from_crs("EPSG:4326", "EPSG:25833", always_xy=True).transform
    # Reconstructed from the user's red rectangle in the published map. These
    # fixed metric bounds crop geography; no target geometry is stretched to fit.
    crop_bounds = (248610.72742114664, 6636516.482282372,
                   279669.4171429286, 6659260.669574317)
    crop = box(*crop_bounds)
    canvas = municipalities.Canvas(crop_bounds)
    view_box = [16, 16, round(canvas.width - 32, 2), round(canvas.height - 32, 2)]
    assert 1.35 < view_box[2] / view_box[3] < 1.38

    nearby = {}
    for feature in municipality_features:
        # Bounding-box filtering avoids projecting all Norway for this city map.
        geometry = shape(feature["geometry"])
        if not geometry.envelope.intersects(box(10, 59.5, 11.4, 60.3)):
            continue
        geometry = transform(project, geometry)
        if not geometry.is_valid:
            geometry = geometry.buffer(0)
        if geometry.intersects(crop):
            nearby[feature["properties"]["id"]] = {
                "name": feature["properties"]["name"], "geometry": polygonal(geometry),
                "code": feature["properties"]["id"], "kind": "land",
                "boundaryType": "municipality"}

    # Actual municipal borders, including substantial portions cut by the
    # frame. Asker's narrow five-square-kilometre corner stays background.
    for code in ["3212", "3222", "3207", "3205", "3224", "3232", "3220"]:
        row = nearby[code]
        assert row["geometry"].intersection(crop).area > 10_000_000
        rows.append(row)
    rows = [clipped_row({**row, "kind": "land",
                         "boundaryType": row.get("boundaryType", "borough")}, crop)
            for row in rows]
    assert all(row is not None for row in rows)

    # Postal regions provide one consistent, real partition of western urban
    # areas, including Fornebu and Bekkestua; they are not guessed town limits.
    layer_sources = []
    postal_path = OUTPUT / "sources/baerum-areas-postal-localities.geojson.gz"
    if postal_path.exists():
        postal, metadata, filename = read_layer(postal_path, "land")
        baerum_land = nearby["3201"]["geometry"]
        postal_land = []
        for row in postal:
            row["geometry"] = polygonal(row["geometry"].intersection(baerum_land))
            if row["geometry"].is_empty:
                continue
            clipped = clipped_row(row, crop, 150_000)
            if clipped is not None and (clipped["geometry"].area >= 500_000 or clipped["visibleShare"] >= 0.15):
                clipped["category"] = "postal-area"
                clipped["code"] = "poststed-" + clipped["code"]
                rows.append(clipped)
                postal_land.append(clipped["geometry"])
        postal_coverage = unary_union(postal_land).area / baerum_land.intersection(crop).area
        assert postal_coverage > 0.95, "The postal partition no longer fills Bærum's visible land"
        layer_sources.append({"file": filename, "source": metadata})
    elif require_sources:
        raise FileNotFoundError(f"The genuine Bærum postal region source is required: {postal_path}")

    bygdoy_source = municipalities.read_json_gzip(OUTPUT / "sources/bygdoy.geojson.gz")
    bygdoy = transform(project, shape(bygdoy_source["features"][0]["geometry"])).buffer(0)
    frogner = next(row["geometry"] for row in rows if row["code"] == "05")
    rows.append(clipped_row({"name": "Bygdøy", "code": "bygdoy", "kind": "land",
                             "boundaryType": "subdistrict", "geometry": polygonal(bygdoy.intersection(frogner))}, crop))

    # Real named forest polygons, cut only by the rectangular map frame.
    forest_rows = []
    forest_path = OUTPUT / "sources/forests-quiz-polygons.geojson.gz"
    if forest_path.exists():
        forests, metadata, filename = read_layer(forest_path, "forest")
        for row in forests:
            clipped = clipped_row({**row, "kind": "forest"}, crop, 500_000)
            if clipped is not None:
                clipped["code"] = "forest-" + clipped["code"]
                forest_rows.append(clipped)
        layer_sources.append({"file": filename, "source": metadata})
    elif require_sources:
        raise FileNotFoundError(f"The genuine forest region polygons are required: {forest_path}")

    hydrography = municipalities.read_json_gzip(municipalities.WATER_SOURCE)
    assert hydrography["crs"] == "EPSG:25833"
    water_geometries = [shape(f["geometry"]) for f in hydrography["features"]]
    water_kinds = [f["properties"]["kind"] for f in hydrography["features"]]
    water_tree = STRtree(water_geometries)
    lakes_by_name = {}
    named_water = set()
    for name, code, coordinate in [("Bogstadvannet", "lake-bogstad", (10.622, 59.970)),
                                   ("Maridalsvannet", "lake-maridal", (10.772, 59.982)),
                                   ("Nøklevann", "lake-noklevann", (10.874, 59.875))]:
        point = transform(project, Point(*coordinate))
        candidates = [int(i) for i in water_tree.query(point)
                      if water_kinds[i] == "lake" and water_geometries[i].covers(point)]
        assert len(candidates) == 1, f"Named lake no longer matches its pinned source: {name}"
        index = candidates[0]
        named_water.add(index)
        lakes_by_name[name] = {"name": name, "code": code, "kind": "lake",
                              "geometry": water_geometries[index]}
    water_path = OUTPUT / "sources/water-quiz-polygons.geojson.gz"
    if water_path.exists():
        fine_water, metadata, filename = read_layer(water_path, "lake")
        for row in fine_water:
            # Prefer the finer sourced outline when both datasets name a lake.
            row["kind"] = "lake"
            row["code"] = "lake-" + row["code"]
            lakes_by_name[row["name"]] = row
        layer_sources.append({"file": filename, "source": metadata})
    elif require_sources:
        raise FileNotFoundError(f"The genuine small-lake outlines are required: {water_path}")
    lakes = []
    for row in lakes_by_name.values():
        clipped = clipped_row(row, crop, 20_000)
        if clipped is not None and (clipped["visibleShare"] >= 0.2 or clipped["geometry"].area >= 100_000):
            lakes.append(clipped)

    # Land and forests are selectable polygons; the water layer remains quiet.
    # Named lake geometry is excluded from decorative water, which otherwise
    # could cover its answer colour or intercept the visual hierarchy.
    lake_union = unary_union([row["geometry"] for row in lakes])
    water = []
    for index in sorted(water_tree.query(crop, predicate="intersects")):
        if int(index) in named_water:
            continue
        geometry = water_geometries[index].intersection(crop)
        if water_kinds[index] != "river":
            geometry = geometry.difference(lake_union)
        path = canvas.path(geometry)
        if path:
            water.append({"kind": water_kinds[index], "d": path})

    # Fill surrounding land in the fixed crop, rather than leaving it the same
    # colour as sea. The five new edge municipalities supply substantial real
    # regions; very small outside pieces are context instead of quiz answers.
    land = unary_union([row["geometry"] for row in nearby.values()]).intersection(crop)
    surfaces = [water_geometries[i].intersection(crop) for i in water_tree.query(crop, predicate="intersects")
                if water_kinds[i] != "river"]
    occupied = unary_union([row["geometry"] for row in rows + forest_rows])
    context = polygonal(land.difference(occupied).difference(unary_union(surfaces + [lake_union])))
    context = context.simplify(10, preserve_topology=True)

    administrative = [row["geometry"] for row in rows if row["code"] != "bygdoy"]
    administrative_union = unary_union(administrative)
    boundaries = unary_union([g.boundary for g in administrative]).difference(administrative_union.boundary)
    # Rectangle edges are clipping, not newly invented administrative borders.
    boundaries = boundaries.difference(crop.boundary.buffer(0.01))
    bygdoy_geometry = next(row["geometry"] for row in rows if row["code"] == "bygdoy")
    boundaries = unary_union([boundaries, bygdoy_geometry.boundary.intersection(frogner.buffer(-250))])

    states = []
    for row in [*rows, *forest_rows, *lakes]:
        geometry = row["geometry"]
        assert geometry.is_valid and geometry.geom_type in ("Polygon", "MultiPolygon") and not geometry.is_empty
        assert geometry.difference(crop).area < 0.01, "A quiz polygon escaped the fixed crop"
        states.append({"n": row["name"], "a": row["code"], "kind": row["kind"],
                       "d": canvas.path(geometry), "c": canvas.center(geometry),
                       "category": row.get("category", row["kind"]),
                       "boundaryType": row.get("boundaryType"),
                       "clipped": row["clipped"], "visibleShare": row["visibleShare"]})
    names = {state["n"] for state in states}
    assert len(states) == len(names), "Each named area must have exactly one quiz target"
    assert all(state["d"] and state["kind"] in ("land", "forest", "lake") for state in states)
    if require_sources:
        assert {"Fornebu", "Lysaker", "Bekkestua", "Sandvika", "Nordmarka", "Østmarka", "Sognsvann"} <= names
        assert len(states) > 28
    data = {
        "title": "Oslo", "ruleset": "oslo-areas-v3", "viewBox": view_box,
        "states": states, "water": water, "boundaries": canvas.path(boundaries),
        "context": canvas.path(context),
        "crop": {"crs": "EPSG:25833", "bounds": list(crop_bounds),
                 "widthKm": round((crop_bounds[2] - crop_bounds[0]) / 1000, 2),
                 "heightKm": round((crop_bounds[3] - crop_bounds[1]) / 1000, 2)},
        "source": {"boundaries": source["source"], "hydrography": hydrography["source"],
                   "bygdoy": bygdoy_source["source"], "additionalLayers": layer_sources,
                   "sentrum": {"method": "Oslo land minus the fifteen boroughs; city-centre component", "areaM2": round(sentrum_area, 2)},
                   "topologyRepair": repairs},
    }
    return municipalities.dump(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    content = build()
    path = OUTPUT / "oslo.json"
    if args.check:
        assert path.read_text(encoding="utf-8") == content, "Rebuild the Oslo area map"
    else:
        path.write_text(content, encoding="utf-8")
    data = json.loads(content)
    print(f"{'Verified' if args.check else 'Built'} Oslo area map: {len(data['states'])} polygon targets, "
          f"{len(content.encode()):,} bytes; crop {data['crop']['widthKm']} × {data['crop']['heightKm']} km")


if __name__ == "__main__":
    main()
