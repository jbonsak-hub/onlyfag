#!/usr/bin/env python3
"""Rebuild named lake polygons offline from the preserved OSM geometry snapshot."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import LineString, Polygon, box, mapping
from shapely.ops import polygonize_full, transform, unary_union

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "water-osm-source-2026-10-23.json.gz"
QUERY = ROOT / "water-osm-source-query.overpass"
OUTPUT = ROOT / "water-quiz-polygons.geojson.gz"
RAW_SHA256 = "160b6cedaaff50c99a0ba323f4445302b4860c28eb34bb7fd01ec10ca0b70912"
# Object identity is checked independently of tags to avoid silently admitting
# a car park, transport station or similarly named non-water feature.
EXPECTED = {
    ("way", 27945653): ("Dælivannet", 4, 0),
    ("relation", 16661): ("Nøklevann", 17, 8),
    ("relation", 33561): ("Østensjøvannet", 21, 24),
    ("relation", 38280): ("Lutvann", 5, 3),
    ("relation", 448255): ("Sognsvann", 5, 1),
    ("relation", 2361103): ("Store Åklungen", 3, 2),
    ("relation", 2718044): ("Øvresetertjern", 3, 3),
    ("relation", 3332865): ("Steinbruvann", 5, 1),
    ("relation", 13668449): ("Lille Åklungen", 2, 0),
}


def enclosed_area(lines):
    polygons, cuts, dangles, invalid = polygonize_full(unary_union(lines))
    assert cuts.is_empty and dangles.is_empty and invalid.is_empty, "Incomplete OSM rings"
    return unary_union(list(polygons.geoms))


def build():
    raw = gzip.decompress(RAW.read_bytes())
    assert hashlib.sha256(raw).hexdigest() == RAW_SHA256, "OSM snapshot checksum mismatch"
    data = json.loads(raw)
    project = Transformer.from_crs("EPSG:4326", "EPSG:25833", always_xy=True).transform
    crop = box(248610.72742114664, 6636516.482282372, 279669.4171429286, 6659260.669574317)
    features = []
    selected = set()
    for element in data["elements"]:
        key = element["type"], element["id"]
        if key not in EXPECTED:
            continue
        name, version, expected_holes = EXPECTED[key]
        tags = element["tags"]
        assert tags["name"] == name and tags["natural"] == "water"
        assert element["version"] == version and element.get("timestamp")
        if element["type"] == "way":
            assert element["nodes"][0] == element["nodes"][-1], "Lake way must close"
            geometry = Polygon([(p["lon"], p["lat"]) for p in element["geometry"]])
        else:
            assert tags["type"] == "multipolygon"
            rings = {"outer": [], "inner": []}
            for member in element["members"]:
                assert member["type"] == "way" and member["role"] in rings
                coordinates = [(p["lon"], p["lat"]) for p in member["geometry"]]
                rings[member["role"]].append(LineString(coordinates))
            outer = enclosed_area(rings["outer"])
            inner = enclosed_area(rings["inner"]) if rings["inner"] else Polygon()
            assert inner.difference(outer).area < 1e-15, "Island ring escapes lake"
            geometry = outer.difference(inner)
        assert geometry.is_valid and geometry.geom_type in ("Polygon", "MultiPolygon")
        parts = [geometry] if geometry.geom_type == "Polygon" else geometry.geoms
        assert sum(len(part.interiors) for part in parts) == expected_holes, name + ": lost island holes"
        metric = transform(project, geometry)
        assert 20_000 < metric.area < 2_000_000
        assert metric.intersection(crop).area > 20_000
        features.append({
            "type": "Feature",
            "properties": {
                "id": f"osm-{element['type']}-{element['id']}",
                "name": name, "kind": "lake", "boundaryType": "mapped-water",
                "osmType": element["type"], "osmId": element["id"],
                "osmVersion": version, "osmTimestamp": element["timestamp"],
                "url": f"https://www.openstreetmap.org/{element['type']}/{element['id']}",
                "areaM2": round(metric.area, 2), "islandHoles": expected_holes,
            },
            "geometry": mapping(geometry),
        })
        selected.add(key)
    assert selected == EXPECTED.keys()
    features.sort(key=lambda feature: feature["properties"]["name"])
    result = {
        "type": "FeatureCollection", "crs": "EPSG:4326",
        "source": {
            "publisher": "OpenStreetMap contributors",
            "license": "ODbL 1.0", "licenseUrl": "https://opendatacommons.org/licenses/odbl/1-0/",
            "attribution": "© OpenStreetMap contributors",
            "attributionUrl": "https://www.openstreetmap.org/copyright",
            "endpoint": "https://overpass-api.de/api/interpreter",
            "snapshotTimestamp": data["osm3s"]["timestamp_osm_base"],
            "rawSnapshot": RAW.name, "rawSha256": RAW_SHA256,
            "query": QUERY.name, "querySha256": hashlib.sha256(QUERY.read_bytes()).hexdigest(),
            "method": "Exact named natural=water ways and multipolygon relations. Assemble original outer member ways; subtract original inner island rings. No buffers, invented edges, simplification or shoreline smoothing. Preserve complete lake geometry; the quiz builder applies its fixed crop.",
            "versionNote": "Feature properties pin the top-level OSM way/relation version and edit timestamp. The preserved response checksum and Overpass base timestamp pin inline member geometry, whose individual versions are not included by out meta geom.",
        },
        "features": features,
    }
    content = (json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n").encode()
    return gzip.compress(content, mtime=0)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    content = build()
    if args.check:
        assert OUTPUT.read_bytes() == content, "Rebuild the lake source layer"
    else:
        OUTPUT.write_bytes(content)
    print(("Verified" if args.check else "Built") + " nine genuine water polygons with 42 island holes")


if __name__ == "__main__":
    main()
