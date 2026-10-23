#!/usr/bin/env python3
"""Reproduce six actual Oslofjord island coastlines from pinned OSM API data.

Run with the repository's municipality GIS dependencies on PYTHONPATH.
Every coordinate comes from a preserved source node; no coastline is inferred.
"""

import argparse
import gzip
import hashlib
import json
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import MultiLineString, Polygon, mapping
from shapely.ops import linemerge, transform, unary_union


HERE = Path(__file__).resolve().parent
OUTPUT = HERE / "islands-quiz-polygons.geojson.gz"
INDEX = HERE / "islands-source-requests.json"
EXPECTED = {
    ("way", 4154560): ("Langøyene", 20, "009aab470e52750a41cb9188fdcd66738cf92610bea5c3315904fed21bde8dba"),
    ("relation", 11816903): ("Gressholmen", 1, "4478ea54350d3a4b3a0b322be4053f5eeb65a021005313547f8747ed41ffb7f3"),
    ("relation", 11816904): ("Lindøya", 1, "dbb8fda05955db376bb3279d7eca8487cf84d9e47b4033430238d3eb6987af3b"),
    ("way", 35213472): ("Malmøya", 18, "12e96be15c35e98c199b88fbf7f72651cc56d5c0ec103bea187fcf0457f2c748"),
    ("way", 4154565): ("Ulvøya", 26, "3129266faa97e1f0c0a221ffe26f8f09429b260cfad3618a8b1acc84d2fd06c4"),
    ("way", 4154500): ("Ormøya", 18, "44aab9d5b3e87ecf2a91581f292f64e6e305214ea69c43c7d64b9a2c506f4564"),
}


def way_coordinates(way, elements):
    """Resolve the original ordered node references without inserting vertices."""
    coordinates = []
    for node_id in way["nodes"]:
        node = elements[("node", node_id)]
        coordinates.append((node["lon"], node["lat"]))
    assert len(coordinates) >= 2, "Incomplete coastline member way"
    return coordinates


def relation_rings(relation, elements, role):
    segments = []
    for member in relation["members"]:
        assert member["type"] == "way", "Nested or non-way island members need review"
        assert member["role"] in ("outer", "inner"), "Unexpected island member role"
        if member["role"] == role:
            way = elements[("way", member["ref"])]
            assert way.get("tags", {}).get("natural") == "coastline", "Member is not a coastline"
            segments.append(way_coordinates(way, elements))
    if not segments:
        return []
    merged = linemerge(MultiLineString(segments))
    lines = [merged] if merged.geom_type == "LineString" else list(merged.geoms)
    assert all(line.is_ring for line in lines), "Island member ways do not form complete rings"
    return [Polygon(line.coords) for line in lines]


def source_geometry(obj, elements):
    if obj["type"] == "way":
        assert len(obj["nodes"]) >= 4, "Island coastline needs a complete polygon"
        assert obj["nodes"][0] == obj["nodes"][-1], "Standalone island coastline must close"
        assert obj["tags"]["natural"] == "coastline"
        return Polygon(way_coordinates(obj, elements))
    assert obj["tags"]["type"] == "multipolygon"
    outer = unary_union(relation_rings(obj, elements, "outer"))
    inner = unary_union(relation_rings(obj, elements, "inner"))
    assert inner.difference(outer).is_empty, "Island interior ring escapes its source shell"
    return outer.difference(inner)


def build():
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    records = {(entry["osmType"], entry["osmId"]): entry for entry in index["requests"]}
    assert records.keys() == EXPECTED.keys(), "The six named source identities must be explicit"
    project = Transformer.from_crs("EPSG:4326", "EPSG:25833", always_xy=True).transform
    features = []
    geometries = []
    for key, (name, version, checksum) in EXPECTED.items():
        record = records[key]
        assert record["name"] == name and record["osmVersion"] == version
        assert record["rawUncompressedSha256"] == checksum
        assert Path(record["rawSnapshot"]).name == record["rawSnapshot"]
        raw = gzip.decompress((HERE / record["rawSnapshot"]).read_bytes())
        assert hashlib.sha256(raw).hexdigest() == checksum, "Unexpected island source response"
        data = json.loads(raw)
        elements = {(element["type"], element["id"]): element for element in data["elements"]}
        obj = elements[key]
        assert obj["tags"]["name"] == name and obj["version"] == version
        assert obj["timestamp"] == record["osmTimestamp"]
        assert obj["tags"]["place"] in ("island", "islet")
        geometry = source_geometry(obj, elements)
        assert geometry.is_valid and geometry.geom_type == "Polygon", "Review invalid/disconnected island geometry"
        assert not geometry.is_empty and len(geometry.interiors) == 0
        west, south, east, north = geometry.bounds
        assert 10.69 < west < east < 10.79 and 59.85 < south < north < 59.91
        area = transform(project, geometry).area
        assert 150_000 < area < 600_000, "Island area no longer matches the named source"
        geometries.append(geometry)
        features.append({
            "type": "Feature",
            "properties": {
                "id": f"osm-{key[0]}-{key[1]}", "name": name,
                "kind": "land", "category": "island", "boundaryType": "osm-island-coastline",
                "osmType": key[0], "osmId": key[1], "osmVersion": version,
                "osmTimestamp": obj["timestamp"], "osmTags": obj["tags"],
                "url": f"https://www.openstreetmap.org/{key[0]}/{key[1]}",
                "rawSnapshot": record["rawSnapshot"], "rawUncompressedSha256": checksum,
                "areaM2": round(area, 2), "coastlineVertices": len(geometry.exterior.coords),
            },
            "geometry": mapping(geometry),
        })
    features.sort(key=lambda feature: feature["properties"]["name"])
    assert all(first.disjoint(second) for i, first in enumerate(geometries)
               for second in geometries[i + 1:]), "Independent islands cannot overlap"
    result = {
        "type": "FeatureCollection", "crs": "EPSG:4326",
        "source": {
            "publisher": "OpenStreetMap contributors", "license": "ODbL-1.0",
            "copyright": "© OpenStreetMap contributors",
            "licenseUrl": "https://opendatacommons.org/licenses/odbl/1-0/",
            "attributionUrl": "https://www.openstreetmap.org/copyright",
            "retrievedDate": index["retrievedDate"],
            "requestIndex": INDEX.name,
            "requestIndexSha256": hashlib.sha256(INDEX.read_bytes()).hexdigest(),
            "method": "Preserved official OSM API full-object responses pin the top-level island, every member way, every coastline node, versions and timestamps. Assemble exact node coordinates into complete coast rings; no buffering, smoothing, simplification, manual closing segments or guessed boundaries.",
            "boundaryMeaning": "Six actual named coastal islands. Gressholmen follows the source's single connected coastline, which includes the physically connected Gressholmen/Rambergøya/Heggholmen landmass; no arbitrary internal splits.",
            "requests": index["requests"],
        },
        "features": features,
    }
    content = (json.dumps(result, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode()
    return gzip.compress(content, mtime=0)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    content = build()
    if args.check:
        assert OUTPUT.read_bytes() == content, "Rebuild the six island coastlines"
    else:
        OUTPUT.write_bytes(content)
    print(("Verified" if args.check else "Built") + " six genuine Oslofjord island polygons")


if __name__ == "__main__":
    main()
