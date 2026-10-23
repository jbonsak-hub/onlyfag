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
from shapely.geometry import Point, Polygon, box, shape
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


def solid_land(geometry):
    """Remove inland holes in generalized learning regions, keeping coastlines."""
    return polygonal(unary_union([Polygon(part.exterior)
                                  for part in municipalities.polygons(geometry)]))


def absorb_land_gaps(domain, candidates):
    """Assign existing land pieces using shared edges, never drawing over sea."""
    occupied = unary_union([row["geometry"] for row in candidates])
    gaps = list(municipalities.polygons(domain.difference(occupied)))
    assigned = []
    for gap in sorted(gaps, key=lambda geometry: (-geometry.area, geometry.bounds)):
        shared_edge = gap.boundary.buffer(0.05)
        shared = [(row["geometry"].boundary.intersection(shared_edge).length,
                   -gap.distance(row["geometry"]), -index, row)
                  for index, row in enumerate(candidates)]
        _, _, _, owner = max(shared, key=lambda entry: entry[:3])
        owner["geometry"] = polygonal(unary_union([owner["geometry"], gap]))
        assigned.append({"areaM2": round(gap.area, 2), "assignedTo": owner["name"]})
    return assigned


def build(require_sources=True):
    rows, source, topology, municipality_features, oslo_land, repairs, sentrum_area = build_base()
    project = Transformer.from_crs("EPSG:4326", "EPSG:25833", always_xy=True).transform
    # Questions retain a compact frame; a separate, broader physical backdrop
    # lets the camera fill each viewport without stretching the projection.
    crop_bounds = (248610.72742114664, 6636516.482282372,
                   279669.417, 6659260.669574317)
    crop = box(*crop_bounds)
    context_bounds = (190000, 6580000, 335000, 6720000)
    context_crop = box(*context_bounds)
    canvas = municipalities.Canvas(context_bounds)
    view_box = [16, 16, round(canvas.width - 32, 2), round(canvas.height - 32, 2)]

    nearby = {}
    for feature in municipality_features:
        geometry = shape(feature["geometry"])
        if not transform(project, geometry.envelope).intersects(context_crop):
            continue
        geometry = transform(project, geometry)
        if not geometry.is_valid:
            geometry = geometry.buffer(0)
        if geometry.intersects(context_crop):
            mainland = max(municipalities.polygons(geometry), key=lambda part: part.area)
            nearby[feature["properties"]["id"]] = {
                "name": feature["properties"]["name"], "geometry": solid_land(geometry),
                "mainland": solid_land(mainland),
                "code": feature["properties"]["id"], "kind": "land",
                "boundaryType": "municipality"}

    selected_municipalities = ["3212", "3222", "3207", "3232", "3205"]
    rows.extend(dict(nearby[code]) for code in selected_municipalities)
    oslo_mainland = nearby["0301"]["mainland"]
    rows = [{**row, "geometry": solid_land(unary_union([
                 part for part in municipalities.polygons(row["geometry"])
                 if part.intersection(oslo_mainland if row["code"] in {*NAMES, "16"}
                                      else nearby[row["code"]]["mainland"]).area > part.area / 2])),
             "kind": "land", "boundaryType": row.get("boundaryType", "borough")}
            for row in rows]

    # Only postal areas actually adjacent to Vestre Aker/Ullern are questions.
    layer_sources = []
    postal_path = OUTPUT / "sources/baerum-areas-postal-localities.geojson.gz"
    postal, metadata, filename = read_layer(postal_path, "land")
    postal_by_name = {row["name"]: row for row in postal}
    western_names = ["Eiksmarka", "Jar", "Lysaker"]
    baerum_land = nearby["3201"]["mainland"]
    eastern_baerum = solid_land(unary_union([
        postal_by_name[name]["geometry"] for name in western_names])).intersection(baerum_land)
    for name in western_names:
        row = postal_by_name[name]
        rows.append({**row, "geometry": solid_land(row["geometry"]).intersection(baerum_land),
                     "kind": "land", "category": "postal-area"})
    layer_sources.append({"file": filename, "source": metadata,
                         "selectedAreas": western_names,
                         "boundaryMeaning": "Postal localities bordering Vestre Aker or Ullern; other Bærum land is context only."})

    bygdoy_source = municipalities.read_json_gzip(OUTPUT / "sources/bygdoy.geojson.gz")
    bygdoy = transform(project, shape(bygdoy_source["features"][0]["geometry"])).buffer(0)
    frogner = next(row["geometry"] for row in rows if row["code"] == "05")
    rows.append({"name": "Bygdøy", "code": "bygdoy", "kind": "land",
                 "boundaryType": "subdistrict",
                 "geometry": polygonal(bygdoy.intersection(frogner))})

    islands, metadata, filename = read_layer(OUTPUT / "sources/islands-quiz-polygons.geojson.gz", "land")
    kalven = next(row for row in islands if row["name"] == "Malmøykalven")
    malmoya = next(row for row in islands if row["name"] == "Malmøya")
    malmoya["geometry"] = polygonal(malmoya["geometry"].union(kalven["geometry"]))
    islands.remove(kalven)
    assert {row["name"] for row in islands} == {
        "Langøyene", "Gressholmen", "Lindøya", "Malmøya", "Ulvøya", "Ormøya",
        "Hovedøya", "Nakholmen", "Bleikøya"}
    for row in islands:
        row.update(kind="land", category="island")
    layer_sources.append({"file": filename, "source": metadata})
    island_union = unary_union([row["geometry"] for row in islands])

    # Replace the atlas's coarser versions of these islands with their pinned
    # OSM coastlines; otherwise an old shoreline could leave a pale fringe.
    coarse_islands = []
    for row in nearby.values():
        for part in municipalities.polygons(row["geometry"]):
            if part.area < 3_000_000 and part.intersection(island_union).area > 10_000:
                coarse_islands.append(part)
    coarse_island_union = unary_union(coarse_islands)
    for row in rows:
        parts = [part for part in municipalities.polygons(row["geometry"])
                 if not (part.area < 3_000_000 and
                         part.intersection(island_union).area > 10_000)]
        row["geometry"] = polygonal(unary_union(parts).difference(coarse_island_union))
    land = solid_land(unary_union([row["geometry"] for row in nearby.values()]))
    land = polygonal(land.difference(coarse_island_union).union(island_union)).intersection(context_crop)
    mainland = unary_union([row["mainland"] for row in nearby.values()])

    excluded_west = baerum_land.difference(eastern_baerum)
    for row in nearby.values():
        if row["name"] == "Asker":
            excluded_west = excluded_west.union(row["geometry"])
    forests, metadata, filename = read_layer(OUTPUT / "sources/forests-quiz-polygons.geojson.gz", "forest")
    forest_rows = []
    forest_hole_area = 0
    for row in forests:
        filled = solid_land(row["geometry"])
        forest_hole_area += filled.area - row["geometry"].area
        row["geometry"] = polygonal(filled.intersection(mainland).difference(excluded_west))
        clipped = clipped_row({**row, "kind": "forest"}, crop, 500_000)
        assert clipped is not None, row["name"]
        # The postal mask can reintroduce tiny enclosed pockets in a wood.
        # Absorb those real land pieces too, without moving its outer edge or
        # filling sea. The three selected lakes are subtracted separately.
        enclosed_land = solid_land(clipped["geometry"]).difference(clipped["geometry"]).intersection(land)
        forest_hole_area += enclosed_land.area
        clipped["geometry"] = polygonal(clipped["geometry"].union(enclosed_land))
        clipped["code"] = "forest-" + clipped["code"]
        forest_rows.append(clipped)
    layer_sources.append({"file": filename, "source": metadata,
                         "learningGeneralization": "Fill inland clearing/water holes; retain sourced exterior woodland outlines and clip to the selected western learning boundary."})

    hydrography = municipalities.read_json_gzip(municipalities.WATER_SOURCE)
    assert hydrography["crs"] == "EPSG:25833"
    water_geometries = [shape(feature["geometry"]) for feature in hydrography["features"]]
    water_kinds = [feature["properties"]["kind"] for feature in hydrography["features"]]
    water_tree = STRtree(water_geometries)
    lakes_by_name = {}
    for name, code, coordinate in [
            ("Bogstadvannet", "lake-bogstad", (10.622, 59.970)),
            ("Maridalsvannet", "lake-maridal", (10.772, 59.982))]:
        point = transform(project, Point(*coordinate))
        candidates = [int(index) for index in water_tree.query(point)
                      if water_kinds[index] == "lake" and water_geometries[index].covers(point)]
        assert len(candidates) == 1, name
        lakes_by_name[name] = {"name": name, "code": code, "kind": "lake",
                              "geometry": water_geometries[candidates[0]]}
    fine_water, metadata, filename = read_layer(OUTPUT / "sources/water-quiz-polygons.geojson.gz", "lake")
    for name in ["Sognsvann", "Lutvann", "Nøklevann"]:
        lake = next(row for row in fine_water if row["name"] == name)
        lakes_by_name[name] = {**lake, "kind": "lake", "code": "lake-" + name.lower()}
    lakes = [clipped_row(row, crop) for row in lakes_by_name.values()]
    assert all(row is not None for row in lakes)
    lake_union = unary_union([row["geometry"] for row in lakes])
    lake_islands = polygonal(unary_union([
        Polygon(ring) for row in lakes for part in municipalities.polygons(row["geometry"])
        for ring in part.interiors]))
    layer_sources.append({"file": filename, "source": metadata,
                         "selectedNames": ["Sognsvann", "Lutvann", "Nøklevann"]})

    rows = [clipped_row(row, crop) for row in rows]
    islands = [clipped_row(row, crop) for row in islands]
    assert all(row is not None for row in rows + islands)
    # Enclosed source holes and unassigned coastal fragments are existing land,
    # not extra questions. Assign them inside their municipality using shared
    # edges (or the nearest real borough for disconnected islands).
    gap_assignments = []
    for code in ["0301", *selected_municipalities, "3201"]:
        domain = eastern_baerum if code == "3201" else nearby[code]["mainland"]
        domain = domain.intersection(crop).difference(island_union).difference(lake_islands)
        if code == "0301":
            candidates = [row for row in rows if row["code"] in {*NAMES, "16", "bygdoy"}]
        elif code == "3201":
            candidates = [row for row in rows if row["name"] in western_names]
        else:
            candidates = [row for row in rows if row["code"] == code]
        candidates += [row for row in forest_rows if row["geometry"].intersection(domain).area > 1]
        # Unnamed islands are outside the assignment domain, including lake islets.
        gap_assignments.extend(absorb_land_gaps(domain, candidates))

    for row in rows + forest_rows:
        row["geometry"] = polygonal(row["geometry"].difference(island_union).difference(lake_union).difference(lake_islands))
    all_land_rows = rows + forest_rows + islands
    occupied = unary_union([row["geometry"] for row in all_land_rows])
    context = polygonal(land.difference(occupied).difference(lake_union))
    for row in forest_rows:
        holes = solid_land(row["geometry"]).difference(row["geometry"])
        assert holes.intersection(context).difference(lake_islands).area < 0.1, "Unassigned inland forest holes"
    playable_domain = unary_union([
        nearby[code]["mainland"] for code in ["0301", *selected_municipalities]
    ] + [eastern_baerum]).intersection(crop).difference(lake_islands).union(island_union)
    unassigned = playable_domain.difference(occupied).difference(lake_union)
    assert unassigned.area < 0.1, "Unassigned land inside the learning area"

    administrative = [row["geometry"] for row in rows if row["code"] != "bygdoy"]
    administrative_union = unary_union(administrative)
    boundaries = unary_union([geometry.boundary for geometry in administrative]).difference(administrative_union.boundary)
    boundaries = boundaries.difference(crop.boundary.buffer(0.01))
    # Administrative lines beneath woods used to make one forest look like
    # dozens of tiny regions. Forests now have only their own exterior edge.
    forest_union = unary_union([row["geometry"] for row in forest_rows])
    boundaries = boundaries.difference(forest_union.buffer(0.05))
    bygdoy_geometry = next(row["geometry"] for row in rows if row["code"] == "bygdoy")
    boundaries = unary_union([boundaries, bygdoy_geometry.boundary.intersection(frogner.buffer(-250))])

    states = []
    for row in [*rows, *forest_rows, *lakes, *islands]:
        geometry = row["geometry"]
        assert geometry.is_valid and geometry.geom_type in ("Polygon", "MultiPolygon") and not geometry.is_empty, row["name"]
        assert geometry.difference(crop).area < 0.01, row["name"]
        # A parent municipality may overlap a forest/Bygdøy. Prefer a visible
        # point for its hint so the newly simplified map remains easy to use.
        visible = geometry
        if row in rows:
            occluders = forest_union.union(bygdoy_geometry) if row["code"] != "bygdoy" else forest_union
            remainder = polygonal(geometry.difference(occluders))
            if not remainder.is_empty:
                visible = remainder
        states.append({"n": row["name"], "a": row["code"], "kind": row["kind"],
                       "d": canvas.path(geometry), "c": canvas.center(visible),
                       "category": row.get("category", row["kind"]),
                       "boundaryType": row.get("boundaryType"),
                       "clipped": row["clipped"], "visibleShare": row["visibleShare"]})
    names = {state["n"] for state in states}
    assert len(states) == len(names) == 43
    assert all(state["d"] and state["kind"] in ("land", "forest", "lake") for state in states)
    assert {state["n"] for state in states if state["kind"] == "lake"} == {
        "Bogstadvannet", "Sognsvann", "Maridalsvannet", "Lutvann", "Nøklevann"}
    quiet_islands = polygonal(land.difference(mainland).difference(island_union).union(lake_islands))
    assert unary_union([row["geometry"] for row in rows + forest_rows]).intersection(quiet_islands).area < 0.1, "Unnamed islands must not belong to targets"
    context_regions = []
    for name, domain in [("Øvrig Bærum", baerum_land),
                         ("Øvrig Akershus", unary_union([row["mainland"] for code, row in nearby.items()
                                                         if code.startswith("32") and code != "3201"]))]:
        geometry = polygonal(context.intersection(domain).difference(quiet_islands))
        context_regions.append({"n": name, "d": canvas.path(geometry)})
    focus = (262543.3285145605, 6649176.670870367)
    data = {
        "title": "Oslo", "ruleset": "oslo-areas-v5", "viewBox": view_box,
        "camera": {"center": canvas.point(*focus), "height": round(27000 * canvas.scale, 5),
                   "minWidth": round(2 * max(focus[0] - crop_bounds[0], crop_bounds[2] - focus[0]) * canvas.scale, 5)},
        "states": states, "water": [], "boundaries": canvas.path(boundaries),
        "context": canvas.path(context),
        "contextRegions": context_regions,
        "quietIslands": canvas.path(quiet_islands),
        "contextCrop": {"crs": "EPSG:25833", "bounds": list(context_bounds)},
        "crop": {"crs": "EPSG:25833", "bounds": list(crop_bounds),
                 "widthKm": round((crop_bounds[2] - crop_bounds[0]) / 1000, 2),
                 "heightKm": round((crop_bounds[3] - crop_bounds[1]) / 1000, 2)},
        "stats": {"targetCount": len(states), "assignedLandFragments": len(gap_assignments),
                  "assignedLandAreaM2": round(sum(item["areaM2"] for item in gap_assignments), 2),
                  "unassignedPlayableLandM2": round(unassigned.area, 4)},
        "source": {"boundaries": source["source"], "hydrography": hydrography["source"],
                   "bygdoy": bygdoy_source["source"], "additionalLayers": layer_sources,
                   "sentrum": {"method": "Oslo land minus the fifteen boroughs; city-centre component", "areaM2": round(sentrum_area, 2)},
                   "topologyRepair": repairs,
                   "learningGeneralization": {
                       "assignedLandFragments": gap_assignments,
                       "forestInteriorFilledAreaM2": round(forest_hole_area, 2),
                       "method": "Retain sourced coasts and mainland boundaries; select three adjacent Bærum postal areas; assign mainland gaps to same-municipality learning regions. Named islands are independent; Malmøykalven belongs to Malmøya. Other sea and lake islands are unowned context. Nonquiz lakes/rivers are omitted. This is a generalized learning map, not a land-cover survey."}},
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
