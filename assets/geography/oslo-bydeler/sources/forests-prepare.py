"""Reproduce the named forest GeoJSON from the preserved Overpass snapshot.

Run with the repository's municipality GIS dependencies on PYTHONPATH.
This conversion is offline; every vertex comes from an actual relation member.
"""

import gzip
import hashlib
import json
from pathlib import Path

from shapely.geometry import MultiLineString, MultiPolygon, Polygon, mapping
from shapely.ops import linemerge


HERE = Path(__file__).resolve().parent
RAW = HERE / "forests-osm-source-2026-10-23.json.gz"
OUTPUT = HERE / "forests-quiz-polygons.geojson.gz"
RAW_SHA256 = "3290bd1449875cffad37c81d5a794981b562d18b5676031a3a4084d41f65fad6"
RELATIONS = [(1904403, "Nordmarka"), (2577433, "Bærumsmarka"),
             (5806405, "Lillomarka"), (5979888, "Østmarka")]


def rings(members, role):
    segments = []
    for member in members:
        if member["role"] != role:
            continue
        assert member["type"] == "way", "Only complete way members are supported"
        coordinates = [(point["lon"], point["lat"]) for point in member["geometry"]]
        assert len(coordinates) >= 2
        segments.append(coordinates)
    if not segments:
        return []
    merged = linemerge(MultiLineString(segments))
    lines = [merged] if merged.geom_type == "LineString" else list(merged.geoms)
    assert all(line.is_ring for line in lines), "A source ring is incomplete or self-crossing"
    return [list(line.coords) for line in lines]


def convert():
    raw = gzip.decompress(RAW.read_bytes())
    assert hashlib.sha256(raw).hexdigest() == RAW_SHA256, "Unexpected source snapshot"
    source = json.loads(raw)
    elements = {element["id"]: element for element in source["elements"]}
    features = []
    for relation_id, name in RELATIONS:
        relation = elements[relation_id]
        assert relation["type"] == "relation"
        assert relation["tags"]["name"] == name
        assert relation["tags"]["type"] == "multipolygon"
        assert relation["tags"]["place"] == "woodland"
        assert all(member["role"] in ("outer", "inner") for member in relation["members"])
        shells = rings(relation["members"], "outer")
        holes = rings(relation["members"], "inner")
        outer_polygons = [Polygon(shell) for shell in shells]
        assigned = [[] for _ in shells]
        for hole in holes:
            interior = Polygon(hole)
            containers = [i for i, outer in enumerate(outer_polygons) if outer.covers(interior)]
            assert len(containers) == 1, "An inner ring needs exactly one real outer ring"
            assigned[containers[0]].append(hole)
        polygons = [Polygon(shell, inner) for shell, inner in zip(shells, assigned)]
        geometry = polygons[0] if len(polygons) == 1 else MultiPolygon(polygons)
        assert not geometry.is_empty and geometry.is_valid, "Invalid source polygon; do not invent a repair"
        features.append({
            "type": "Feature",
            "properties": {
                "id": f"osm-relation-{relation_id}", "name": name, "kind": "forest",
                "boundaryType": "osm-place-woodland", "osmType": "relation",
                "osmId": relation_id, "osmVersion": relation["version"],
                "osmTimestamp": relation["timestamp"], "osmTags": relation["tags"],
                "outerMemberIds": [m["ref"] for m in relation["members"] if m["role"] == "outer"],
                "innerMemberIds": [m["ref"] for m in relation["members"] if m["role"] == "inner"],
            },
            "geometry": mapping(geometry),
        })
    data = {
        "type": "FeatureCollection", "crs": "EPSG:4326",
        "source": {
            "publisher": "OpenStreetMap contributors", "license": "ODbL-1.0",
            "copyright": "© OpenStreetMap contributors",
            "licenseUrl": "https://opendatacommons.org/licenses/odbl/1-0/",
            "attributionUrl": "https://www.openstreetmap.org/copyright",
            "retrievedDate": "2026-10-23",
            "osmBaseTimestamp": source["osm3s"]["timestamp_osm_base"],
            "endpoint": "https://overpass-api.de/api/interpreter",
            "snapshot": RAW.name, "snapshotUncompressedSha256": RAW_SHA256,
            "relations": [relation_id for relation_id, _ in RELATIONS],
            "method": "Join exact outer/inner way-member coordinates by matching endpoints; preserve holes; no simplification, buffers or manual boundaries.",
            "boundaryMeaning": "Named woodland regions mapped in OSM (place=woodland); not statutory Markaloven boundaries, property boundaries or a tree-cover survey.",
            "query": '[out:json][timeout:90];(way["name"~"^(Nordmarka|Østmarka|Lillomarka|Bærumsmarka)$"](59.6,10.2,60.5,11.5);relation["name"~"^(Nordmarka|Østmarka|Lillomarka|Bærumsmarka)$"](59.6,10.2,60.5,11.5););out meta geom;',
        },
        "features": features,
    }
    content = (json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode()
    return gzip.compress(content, mtime=0)


if __name__ == "__main__":
    import sys
    result = convert()
    if "--check" in sys.argv:
        assert OUTPUT.read_bytes() == result, "Rebuild the forest source layer"
        print("Verified four genuine OSM woodland polygon sources")
    else:
        OUTPUT.write_bytes(result)
        print("Built four genuine OSM woodland polygon sources")
