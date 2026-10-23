#!/usr/bin/env python3
"""Build the offline municipality atlas from pinned, attributed vector sources.

Install scripts/municipality-requirements.txt first. No HTTP requests are made by
this build. Source TopoJSON is decoded before projection, keeping shared borders
identical for neighbouring municipalities. Quiz polygons are not simplified.
"""

import argparse
from collections import Counter
import gzip
import hashlib
import json
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import GeometryCollection, MultiPolygon, Polygon, box, shape
from shapely.ops import transform, unary_union
from shapely.strtree import STRtree


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/geography/municipalities"
SOURCES = OUTPUT / "sources"
BOUNDARY_SOURCE = SOURCES / "municipalities-2024-L.topojson.gz"
WATER_SOURCE = SOURCES / "hydrography.geojson.gz"
NEIGHBOR_SOURCE = SOURCES / "neighbor-land-10m.geojson.gz"
COUNTIES = {
    "03": ("Oslo", 1), "11": ("Rogaland", 23), "15": ("Møre og Romsdal", 27),
    "18": ("Nordland", 41), "31": ("Østfold", 12), "32": ("Akershus", 21),
    "33": ("Buskerud", 18), "34": ("Innlandet", 46), "39": ("Vestfold", 6),
    "40": ("Telemark", 17), "42": ("Agder", 25), "46": ("Vestland", 43),
    "50": ("Trøndelag", 38), "55": ("Troms", 21), "56": ("Finnmark", 18),
}

# A compact Oslo-centred subset of the original 54-municipality inset. Remove
# the outer north/east/south/west layer and Ringerike's long northern tail.
# Whole source polygons keep every playable municipality intact.
OSLO_AREA = {
    "Modum", "Øvre Eiker", "Drammen", "Lier", "Hole", "Jevnaker", "Lunner",
    "Nannestad", "Ullensaker", "Nes",
    "Nittedal", "Gjerdrum", "Oslo", "Bærum", "Lillestrøm", "Lørenskog",
    "Rælingen", "Aurskog-Høland", "Asker", "Nesodden", "Nordre Follo",
    "Enebakk", "Frogn", "Ås", "Vestby", "Indre Østfold", "Holmestrand",
    "Våler", "Moss", "Skiptvet",
}


def read_json_gzip(path):
    with gzip.open(path, "rt", encoding="utf-8") as stream:
        return json.load(stream)


def decode_topology(data):
    """Decode both quantized and unquantized TopoJSON without another package."""
    arcs = data["arcs"]
    if "transform" in data:
        scale, translation = data["transform"]["scale"], data["transform"]["translate"]
        decoded = []
        for arc in arcs:
            x = y = 0
            points = []
            for dx, dy in arc:
                x += dx
                y += dy
                points.append([x * scale[0] + translation[0], y * scale[1] + translation[1]])
            decoded.append(points)
        arcs = decoded

    def ring(refs):
        points = []
        for ref in refs:
            arc = arcs[ref if ref >= 0 else ~ref]
            if ref < 0:
                arc = arc[::-1]
            points.extend(arc if not points else arc[1:])
        return points

    features = []
    for geometry in data["objects"]["Kommuner"]["geometries"]:
        if geometry["type"] == "Polygon":
            coordinates = [ring(refs) for refs in geometry["arcs"]]
        else:
            coordinates = [[ring(refs) for refs in polygon] for polygon in geometry["arcs"]]
        features.append({"type": "Feature", "properties": geometry["properties"],
                         "geometry": {"type": geometry["type"], "coordinates": coordinates}})
    return features


def polygons(geometry):
    if isinstance(geometry, Polygon):
        return [geometry]
    if isinstance(geometry, MultiPolygon):
        return list(geometry.geoms)
    if isinstance(geometry, GeometryCollection):
        return [p for child in geometry.geoms for p in polygons(child)]
    return []


class Canvas:
    def __init__(self, bounds):
        self.xmin, self.ymin, xmax, self.ymax = bounds
        self.scale = 1168 / max(xmax - self.xmin, self.ymax - self.ymin)
        self.width = round((xmax - self.xmin) * self.scale + 32, 2)
        self.height = round((self.ymax - self.ymin) * self.scale + 32, 2)

    def point(self, x, y):
        return [round(16 + (x - self.xmin) * self.scale, 2),
                round(16 + (self.ymax - y) * self.scale, 2)]

    @staticmethod
    def number(value):
        return f"{value:.2f}".rstrip("0").rstrip(".") or "0"

    def line(self, coordinates, close=False):
        points = [self.point(x, y) for x, y, *_ in coordinates]
        # Adjacent duplicate coordinates after SVG rounding add no detail.
        points = [point for i, point in enumerate(points) if not i or point != points[i - 1]]
        if close and points and points[-1] == points[0]:
            points.pop()
        if len(points) < (3 if close else 2):
            return ""
        return "M" + "L".join(" ".join(map(self.number, point)) for point in points) + ("Z" if close else "")

    def path(self, geometry):
        if geometry.is_empty:
            return ""
        kind = geometry.geom_type
        if kind == "Polygon":
            return self.line(geometry.exterior.coords, True) + "".join(self.line(ring.coords, True) for ring in geometry.interiors)
        if kind in ("LineString", "LinearRing"):
            return self.line(geometry.coords)
        return "".join(self.path(child) for child in geometry.geoms)

    def center(self, geometry):
        mainland = max(polygons(geometry), key=lambda p: p.area)
        point = mainland.representative_point()
        return self.point(point.x, point.y)

    @property
    def view_box(self):
        return [0, 0, self.width, self.height]


def dump(data):
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n"


def make_surrounding_land(norway_land, project, water_geometries, water_kinds):
    neighbors = read_json_gzip(NEIGHBOR_SOURCE)
    # Clip before projection to keep remote territories out of the UTM map.
    neighbor_land = [transform(project, shape(feature["geometry"]).intersection(box(3, 54, 35, 72)))
                     for feature in neighbors["features"]]
    land = unary_union([norway_land, *neighbor_land])
    surfaces = [geometry for geometry, kind in zip(water_geometries, water_kinds) if kind != "river"]
    if surfaces:
        land = land.difference(unary_union(surfaces))
    # This simplified layer is never used for playable municipality targets.
    return land.simplify(80, preserve_topology=False), neighbors["source"]


def make_county_context(surrounding_land, union):
    xmin, ymin, xmax, ymax = union.bounds
    margin = max(xmax - xmin, ymax - ymin)
    window = box(xmin - margin, ymin - margin, xmax + margin, ymax + margin)
    return surrounding_land.intersection(window).difference(union).simplify(80, preserve_topology=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--require-water", action="store_true")
    parser.add_argument("--county", choices=COUNTIES, help="Rebuild one quiz, retaining the existing national overview and other county files")
    args = parser.parse_args()
    topology = read_json_gzip(BOUNDARY_SOURCE)
    project = Transformer.from_crs("EPSG:4326", "EPSG:25833", always_xy=True).transform
    features = decode_topology(topology)
    rows = []
    for feature in features:
        props = feature["properties"]
        geometry = transform(project, shape(feature["geometry"]))
        if not geometry.is_valid:
            # Keep the source contours. buffer(0) repairs zero-width ring touches
            # which are legal to SVG's even-odd renderer but invalid to GEOS union.
            geometry = geometry.buffer(0)
        rows.append({"name": props["kommunenavn"], "code": props["kommunenummer"], "geometry": geometry})
    assert len(rows) == 357 and len({row["code"] for row in rows}) == 357
    assert Counter(row["code"][:2] for row in rows) == {code: value[1] for code, value in COUNTIES.items()}
    assert {row["name"] for row in rows if row["name"] in OSLO_AREA} == OSLO_AREA

    water_geometries, water_kinds, water_metadata = [], [], None
    if WATER_SOURCE.exists():
        hydrography = read_json_gzip(WATER_SOURCE)
        water_metadata = hydrography.get("source")
        water_project = (lambda geometry: geometry) if hydrography.get("crs") == "EPSG:25833" else (lambda geometry: transform(project, geometry))
        for feature in hydrography["features"]:
            geometry = water_project(shape(feature["geometry"]))
            if geometry.is_empty:
                continue
            if not geometry.is_valid:
                geometry = geometry.buffer(0)
            water_geometries.append(geometry)
            water_kinds.append(feature.get("properties", {}).get("kind", "lake" if geometry.geom_type.endswith("Polygon") else "river"))
    if args.require_water:
        assert water_geometries, "Detailed hydrography source has not been supplied"
    water_tree = STRtree(water_geometries) if water_geometries else None
    county_geometries = {code: unary_union([row["geometry"] for row in rows if row["code"].startswith(code)]) for code in COUNTIES}
    norway_land = unary_union(list(county_geometries.values()))
    surrounding_land, neighbor_metadata = make_surrounding_land(norway_land, project, water_geometries, water_kinds)
    overview_canvas = Canvas(norway_land.bounds)
    index = {"version": "2024-01-01", "viewBox": overview_canvas.view_box,
             "source": {"name": "Kartverket", "license": "CC BY 4.0", "url": "https://kartkatalog.geonorge.no/",
                        "boundaryMirror": "https://github.com/robhop/fylker-og-kommuner/tree/ae8782500090144c2b74d6bb2a89365a7ff2236d",
                        "hydrography": water_metadata, "neighborLand": neighbor_metadata}, "counties": []}
    outputs = {}
    if args.county:
        existing_index = OUTPUT / "index-v2.json"
        if not existing_index.exists():
            if args.county != "03":
                parser.error("Build the full atlas or --county 03 before updating another v2 county")
            existing_index = OUTPUT / "index.json"
        if not existing_index.exists():
            parser.error("--county requires an existing municipality atlas")
        index = json.loads(existing_index.read_text(encoding="utf-8"))
    for code, (name, count) in COUNTIES.items():
        if args.county and code != args.county:
            continue
        selected = [row for row in rows if row["name"] in OSLO_AREA and (row["name"] != "Våler" or row["code"].startswith("31"))] if code == "03" else [row for row in rows if row["code"].startswith(code)]
        if code == "03":
            assert len(selected) == len(OSLO_AREA), "Oslo-area targets must be unique"
        union = unary_union([row["geometry"] for row in selected])
        canvas = Canvas(union.bounds)
        # Separate inland municipal borders from the jagged coastline. The
        # emphasis belongs on the borders; coastal islands keep a quiet outline.
        boundaries = unary_union([row["geometry"].boundary for row in selected]).difference(union.boundary)
        context = make_county_context(surrounding_land, union)
        states = [{"n": row["name"], "a": row["code"], "d": canvas.path(row["geometry"]),
                   "c": canvas.center(row["geometry"])} for row in sorted(selected, key=lambda row: row["code"])]
        water = []
        if water_tree is not None:
            for i in sorted(water_tree.query(union, predicate="intersects")):
                geometry = water_geometries[i].intersection(union)
                path = canvas.path(geometry)
                if path:
                    water.append({"kind": water_kinds[i], "d": path})
        data = {"title": "Oslo og omegn" if code == "03" else name, "county": code,
                "viewBox": canvas.view_box, "states": states, "water": water,
                "boundaries": canvas.path(boundaries), "context": canvas.path(context)}
        if code == "03":
            data["variant"] = "oslo-surroundings-v2"
        filename = "county-03-v2.json" if code == "03" else f"county-{code}.json"
        outputs[filename] = dump(data)
        overview = county_geometries[code]
        # An 80 m tolerance is less than a tenth of one pixel on the national
        # selector. This affects only the overview; quiz contours stay intact.
        if args.county:
            overview_data = next(county["overview"] for county in index["counties"] if county["code"] == code)
        else:
            overview_display = overview.simplify(80, preserve_topology=True)
            overview_data = {"d": overview_canvas.path(overview_display), "c": overview_canvas.center(overview)}
        entry = {"code": code, "name": name, "count": count, "file": filename,
                                  "revision": hashlib.sha256(outputs[filename].encode()).hexdigest()[:12],
                                  "quizTitle": data["title"], "quizCount": len(states),
                                  "overview": overview_data}
        if code == "03":
            entry["variant"] = data["variant"]
        if args.county:
            index["counties"] = [entry if county["code"] == code else county for county in index["counties"]]
        else:
            index["counties"].append(entry)
        print(f"{code} {name}: {count} municipalities, {len(states)} quiz targets, {len(water)} water features", flush=True)
    # The old index/county-03 stay frozen for cached 54-question scripts.
    atlas_content = "".join(outputs.get(entry["file"]) or (OUTPUT / entry["file"]).read_text(encoding="utf-8")
                            for entry in index["counties"])
    index["revision"] = hashlib.sha256(atlas_content.encode()).hexdigest()[:12]
    outputs["index-v2.json"] = dump(index)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for filename, content in outputs.items():
        path = OUTPUT / filename
        if args.check:
            assert path.read_text(encoding="utf-8") == content, f"Rebuild municipality atlas: {filename}"
        else:
            path.write_text(content, encoding="utf-8")
    print(("Verified" if args.check else "Built") + f" {len(outputs)} municipality atlas assets ({sum(len(s.encode()) for s in outputs.values()):,} bytes)")


if __name__ == "__main__":
    main()
