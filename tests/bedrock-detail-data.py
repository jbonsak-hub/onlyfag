"""Integrity and source-preservation checks for the local NGU detail tiles.

Run: PYTHONPATH=/workspace/shared/municipality-python-deps python \
     tests/bedrock-detail-data.py --raw /workspace/artifacts/geology
The optional raw snapshots also verify each polygon's source attributes and IDs.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
import gzip
import hashlib
import json
from pathlib import Path
import re

from shapely.geometry import shape
from shapely.validation import explain_validity


ROOT = Path(__file__).resolve().parents[1]
COUNTS = {"n250": 30903, "n50": 101143}
SCALES = {"n250": "1:250 000", "n50": "1:50 000"}


def read(path):
    return json.loads(path.read_bytes())


def digest(content):
    return hashlib.sha256(content).hexdigest()


def positions(coordinates):
    if coordinates and isinstance(coordinates[0], (int, float)):
        yield coordinates
    else:
        for member in coordinates:
            yield from positions(member)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "assets/geography/geology/data/bedrock-detail")
    parser.add_argument("--raw", type=Path)
    args = parser.parse_args()
    output = args.output
    index = read(output / "index.json")
    assert index["coordinateSystem"] == "EPSG:25833"
    assert index["coordinateUnits"] == "metres"
    assert index["compression"] == "gzip"
    assert index["gridSizeMeters"] == 50000
    assert index["coordinateRoundingMeters"] == 1
    assert index["drawOrder"] == ["n250", "n50"]
    assert {s["id"]: s["featureCount"] for s in index["sources"]} == COUNTS
    assert index["sourceFeatureCount"] == sum(COUNTS.values())
    assert index["tileCount"] == len(index["tiles"])
    assert len({t["id"] for t in index["tiles"]}) == index["tileCount"]
    palette = index["classificationPalette"]
    assert palette["field"] == "hovedbergart"
    assert all(word in palette["normalization"] for word in ("N50", "N250", "130", "131", "132"))
    assert palette["unclassifiedCodes"] == ["417", "436"]
    assert "#e1e1e1" in palette["unclassifiedNote"]

    # Both scales deliberately share N50 colours; the original source attributes
    # and geometries remain distinct. Unknown N50 codes are explicitly neutral.
    source_dir = ROOT / "assets/geography/geology/sources"
    n50 = read(source_dir / "bedrock-n50-layer.json")
    entries = n50["drawingInfo"]["renderer"]["uniqueValueInfos"]
    colors = {str(e["value"]): "#" + "".join(f"{c:02x}" for c in e["symbol"]["color"][:3]) for e in entries}
    names = {str(e["value"]): e["label"] for e in entries}
    domain = next(f["domain"] for f in n50["fields"] if f["name"] == "hovedbergart")
    names.update({str(e["code"]): e["name"] for e in domain["codedValues"]})
    for code in ("417", "436"):
        colors[code] = "#e1e1e1"
        names[code] = f"Uklassifisert kode {code}"
    for code, color in colors.items():
        assert index["styles"][code]["color"] == color, ("index palette", code)
        assert index["styles"][code]["label"] == names[code], ("index label", code)

    originals = {}
    raw_geometries = {}
    omitted_ids = {feature["id"] for feature in index["omittedSourceFeatures"]}
    if args.raw:
        paths = {}
        for source in COUNTS:
            manifest_path = args.raw / f"bedrock-{source}-downloads.json"
            if manifest_path.exists():
                provenance = read(manifest_path)
                assert provenance["featureCount"] == COUNTS[source], ("raw source count", source)
                paths[source] = []
                for batch in provenance["batches"]:
                    path = args.raw / batch["file"]
                    content = path.read_bytes()
                    assert len(content) == batch["bytes"] and digest(content) == batch["sha256"], path
                    assert len(json.loads(content)["features"]) == batch["features"], path
                    paths[source].append(path)
            else:
                # Earlier N250 acquisition used the same authoritative batches
                # with flat filenames, before download manifests were added.
                assert source == "n250", manifest_path
                paths[source] = sorted(args.raw.glob("bedrock-n250-batch-*.json"))
        for source, files in paths.items():
            for path in files:
                data = read(path)
                assert data.get("crs", {}).get("properties", {}).get("name") == "EPSG:25833", path
                for feature in data["features"]:
                    props = feature["properties"]
                    fid = f"{source}-{props['OBJECTID']}"
                    assert fid not in originals, ("duplicate raw ID", fid)
                    code = str(props["hovedbergart"]) if props["hovedbergart"] is not None else "<Null>"
                    stamp = props.get("datauttaksdato")
                    originals[fid] = {"category": props["hovedbergart"],
                                      "label": props.get("hovedbergart_navn") or names[code],
                                      "description": props.get("tegnforklaring") or "",
                                      "sourceDate": datetime.fromtimestamp(stamp / 1000, timezone.utc).date().isoformat() if stamp else None}
                    if fid in omitted_ids:
                        raw_geometries[fid] = feature["geometry"]
        assert Counter(fid.split("-", 1)[0] for fid in originals) == COUNTS
        native = args.raw / "bedrock-n250-native.json"
        expected_hash = next(s.get("rawSha256") for s in index["sources"] if s["id"] == "n250")
        if expected_hash:
            assert digest(native.read_bytes()) == expected_hash, "N250 raw snapshot hash"

    retained = set()
    fragments = Counter()
    compressed_total = uncompressed_total = 0
    expected_files = set()
    for tile in index["tiles"]:
        path = output / tile["url"]
        assert path.parent == output / "tiles" and path.name.endswith(".json.gz"), tile["url"]
        expected_files.add(path.name)
        x, y = map(int, tile["id"].split("_"))
        bbox = [x * 50000, y * 50000, (x + 1) * 50000, (y + 1) * 50000]
        assert tile["bbox"] == bbox, tile["id"]
        compressed = path.read_bytes()
        assert len(compressed) == tile["bytes"] and digest(compressed) == tile["sha256"], tile["id"]
        content = gzip.decompress(compressed)
        assert len(content) == tile["uncompressedBytes"], tile["id"]
        compressed_total += len(compressed)
        uncompressed_total += len(content)
        data = json.loads(content)
        assert data["type"] == "FeatureCollection" and data["coordinateSystem"] == "EPSG:25833"
        assert len(data["features"]) == tile["featureCount"] > 0, tile["id"]
        tile_ids, rank = set(), 0
        for feature in data["features"]:
            fid, props, geom = feature["id"], feature["properties"], feature["geometry"]
            assert feature["type"] == "Feature" and re.fullmatch(r"n(?:250|50)-\d+", fid), fid
            source, sid = fid.split("-", 1)
            next_rank = index["drawOrder"].index(source)
            assert next_rank >= rank, ("N50 must draw after N250", tile["id"], fid)
            rank = next_rank
            assert fid not in tile_ids, ("duplicate tile feature", tile["id"], fid)
            tile_ids.add(fid)
            retained.add(fid)
            fragments[source] += 1
            assert props["sourceID"] == int(sid) and props["sourceScale"] == SCALES[source], fid
            code = str(props["category"]) if props["category"] is not None else "<Null>"
            assert props["color"] == colors[code], ("harmonized palette", fid, code)
            assert props["label"] and props["label"].strip(), fid
            if source == "n50":
                assert props["label"] == names[code], ("N50 coded source name", fid)
            if args.raw:
                assert fid in originals, ("unknown source ID", fid)
                assert all(props[k] == v for k, v in originals[fid].items()), ("changed source attributes", fid)
            assert geom["type"] in ("Polygon", "MultiPolygon"), fid
            polygons = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
            for polygon in polygons:
                for ring in polygon:
                    assert len(ring) >= 4 and ring[0] == ring[-1], ("open/degenerate ring", tile["id"], fid)
            for point in positions(geom["coordinates"]):
                assert len(point) == 2 and all(type(v) is int for v in point), ("non-integer projected position", fid)
                assert bbox[0] <= point[0] <= bbox[2] and bbox[1] <= point[1] <= bbox[3], ("out-of-tile position", tile["id"], fid, point)
            geometry = shape(geom)
            assert not geometry.is_empty and geometry.area > 0 and geometry.is_valid, ("invalid output geometry", tile["id"], fid, explain_validity(geometry))
    assert {p.name for p in (output / "tiles").iterdir()} == expected_files, "stale or missing tile files"
    assert compressed_total == index["totalBytes"]
    assert uncompressed_total == index["totalUncompressedBytes"]
    assert len(retained) == index["retainedSourceFeatureCount"]
    omitted = {f["id"]: f for f in index["omittedSourceFeatures"]}
    assert len(omitted) == len(index["omittedSourceFeatures"])
    assert not retained.intersection(omitted)
    assert Counter(fid.split("-", 1)[0] for fid in retained | omitted.keys()) == COUNTS
    if args.raw:
        assert retained | omitted.keys() == originals.keys(), "lost or fabricated source polygons"
        from shapely import make_valid, set_precision
        for fid, record in omitted.items():
            assert record["reason"].strip() and fid in raw_geometries, ("undocumented omission", fid)
            source_geometry = raw_geometries[fid]
            if "null" in record["reason"].lower():
                assert source_geometry is None, ("non-null source reported as null", fid)
            else:
                geometry = shape(source_geometry)
                geometry = set_precision(make_valid(geometry), 1, mode="valid_output")
                assert geometry.is_empty or geometry.area == 0, ("omitted source still has polygonal area", fid)
    print(f"PASS NGU detail: {len(index['tiles'])} gzip tiles, {compressed_total} bytes, "
          f"{len(retained)} source polygons retained, {len(omitted)} documented omissions; "
          f"{dict(fragments)} valid clipped fragments in N250→N50 order")


if __name__ == "__main__":
    main()
