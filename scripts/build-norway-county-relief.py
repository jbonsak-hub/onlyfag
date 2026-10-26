#!/usr/bin/env python3
"""Register the existing offline terrain tiles to the unchanged county SVG.

Usage: python scripts/build-norway-county-relief.py [--height 4500]
Dependencies: Pillow, NumPy, pyproj (municipality-requirements.txt).
No network access or terrain service is used. The registration is pinned to
the reviewed SVG geometry; see docs/norway-county-relief-sources.md.
"""

import argparse
import hashlib
import io
import json
import math
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw
from pyproj import Transformer


ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / "assets/geography"
GEOMETRY = GEO / "norway-counties.json"
REGISTRATION = GEO / "sources/norway-county-registration.json"
VIEWBOX = [0, 0, 1360.629, 1500.617]
OCEAN = (171, 211, 218)


def sha(payload):
    return hashlib.sha256(payload).hexdigest()


def rings(path):
    for part in path.split("Z"):
        points = [tuple(map(float, p)) for p in re.findall(r"[ML](-?[0-9.]+) (-?[0-9.]+)", part)]
        if len(points) >= 3:
            yield points


def mask_path(path, size):
    """Even-odd county mask, antialiased against the exact original SVG."""
    width, height = size
    scale_x, scale_y = width * 2 / VIEWBOX[2], height * 2 / VIEWBOX[3]
    mask = Image.new("1", (width * 2, height * 2))
    for ring in rings(path):
        points = [(x * scale_x, y * scale_y) for x, y in ring]
        left = max(0, math.floor(min(p[0] for p in points)) - 1)
        top = max(0, math.floor(min(p[1] for p in points)) - 1)
        right = min(width * 2, math.ceil(max(p[0] for p in points)) + 2)
        bottom = min(height * 2, math.ceil(max(p[1] for p in points)) + 2)
        if right <= left or bottom <= top:
            continue
        tile = Image.new("1", (right - left, bottom - top))
        ImageDraw.Draw(tile).polygon([(x - left, y - top) for x, y in points], fill=1)
        rectangle = (left, top, right, bottom)
        mask.paste(ImageChops.logical_xor(mask.crop(rectangle), tile), (left, top))
    return mask.convert("L").resize(size, Image.Resampling.LANCZOS)


def forward(lon, lat, registration):
    n = registration["coneConstant"]
    rho = 1 / np.tan(np.pi / 4 + np.asarray(lat) * np.pi / 360) ** n
    angle = n * (np.asarray(lon) - registration["centralMeridian"]) * np.pi / 180
    x, y = rho * np.sin(angle) * 1000, -rho * np.cos(angle) * 1000
    matrix = np.asarray(registration["matrix"])
    return x * matrix[0, 0] + y * matrix[1, 0] + matrix[2, 0], x * matrix[0, 1] + y * matrix[1, 1] + matrix[2, 1]


def inverse(x, y, registration):
    matrix = np.asarray(registration["matrix"])
    undo = np.linalg.inv(matrix[:2])
    x, y = np.asarray(x) - matrix[2, 0], np.asarray(y) - matrix[2, 1]
    px, py = x * undo[0, 0] + y * undo[1, 0], x * undo[0, 1] + y * undo[1, 1]
    n = registration["coneConstant"]
    rho = np.hypot(px, py) / 1000
    lon = registration["centralMeridian"] + np.arctan2(px, -py) / n * 180 / np.pi
    lat = (2 * np.arctan(rho ** (-1 / n)) - np.pi / 2) * 180 / np.pi
    return lon, lat


def boundary_distance(x, y, path):
    minimum = math.inf
    for ring in rings(path):
        a = np.asarray(ring)
        b = np.roll(a, -1, axis=0)
        delta = b - a
        denominator = np.sum(delta * delta, axis=1)
        fraction = np.clip(np.sum((np.array([x, y]) - a) * delta, axis=1) / np.maximum(denominator, 1e-30), 0, 1)
        distance = np.linalg.norm(a + fraction[:, None] * delta - [x, y], axis=1)
        minimum = min(minimum, float(distance.min()))
    return minimum


def validate_registration(rows, registration):
    paths = {row["a"]: row["d"] for row in rows}
    checkpoints = []
    for reference in registration["checkpoints"]:
        x, y = forward(reference["lon"], reference["lat"], registration)
        expected = reference["svg"]
        assert math.hypot(x - expected[0], y - expected[1]) < 1e-8, "Registration matrix or control changed"
        distances = {code: boundary_distance(x, y, paths[code]) for code in reference["counties"]}
        assert max(distances.values()) < .25, f"County registration failed at {reference['name']}: {distances}"
        lon, lat = inverse(x, y, registration)
        assert abs(lon - reference["lon"]) < 1e-10 and abs(lat - reference["lat"]) < 1e-10
        checkpoints.append({**reference, "boundaryDistances": {key: round(value, 6) for key, value in distances.items()}})
    return checkpoints


def bilinear(raster, x, y):
    height, width = raster.shape[:2]
    x = np.clip(x, 0, width - 1.001)
    y = np.clip(y, 0, height - 1.001)
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    fx, fy = (x - x0)[:, None], (y - y0)[:, None]
    return np.clip(raster[y0, x0] * (1 - fx) * (1 - fy) + raster[y0, x0 + 1] * fx * (1 - fy) + raster[y0 + 1, x0] * (1 - fx) * fy + raster[y0 + 1, x0 + 1] * fx * fy, 0, 255).astype(np.uint8)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--height", type=int, default=4500)
    parser.add_argument("--check", action="store_true", help="Validate pinned sources, projection and existing output without rebuilding")
    args = parser.parse_args()
    assert 1500 <= args.height <= 8000
    Image.MAX_IMAGE_PIXELS = 150_000_000
    registration = json.loads(REGISTRATION.read_text(encoding="utf-8"))
    geometry_payload = GEOMETRY.read_bytes()
    assert sha(geometry_payload) == registration["geometrySHA256"], "County geometry changed; review the terrain registration first"
    rows = json.loads(geometry_payload)
    source_manifest = json.loads((GEO / "norway-relief.json").read_text(encoding="utf-8"))
    checkpoints = validate_registration(rows, registration)
    target = GEO / "norway-county-relief.json"
    if args.check:
        manifest = json.loads(target.read_text(encoding="utf-8"))
        region = manifest["regions"]["fylker"]
        assert region["geometrySHA256"] == sha(geometry_payload)
        assert region["projection"]["checkpoints"] == checkpoints
        area = region["areas"]["main"]
        payload = (GEO / area["image"]).read_bytes()
        assert sha(payload) == area["imageSHA256"]
        with Image.open(io.BytesIO(payload)) as image:
            assert list(image.size) == area["pixelDimensions"] and image.mode == "RGBA"
        for source in region["sources"]:
            assert sha((GEO / source["image"]).read_bytes()) == source["imageSHA256"]
        print(f"PASS Norway county relief: {len(rows)} counties, {len(checkpoints)} held-out geographic checkpoints, image and source hashes")
        return

    width, height = round(args.height * VIEWBOX[2] / VIEWBOX[3]), args.height
    owners = np.zeros((height, width), dtype=np.uint8)
    alpha = Image.new("L", (width, height))
    rectangles = {}
    for number, row in enumerate(rows, 1):
        mask = mask_path(row["d"], (width, height))
        alpha = ImageChops.lighter(alpha, mask)
        owners[np.asarray(mask) > 0] = number
        rectangles[row["a"]] = mask.getbbox()
    result = np.empty((height, width, 4), dtype=np.uint8)
    result[:, :, :3] = OCEAN
    result[:, :, 3] = np.asarray(alpha)
    to_utm = Transformer.from_crs("EPSG:4326", "EPSG:25833", always_xy=True)
    sources = []
    for number, row in enumerate(rows, 1):
        key = "county-" + row["a"]
        metadata = source_manifest["regions"][key]
        assert metadata["projection"]["crs"] == "EPSG:25833"
        area = metadata["areas"]["main"]
        path = GEO / area["image"]
        payload = path.read_bytes()
        raster = np.asarray(Image.open(io.BytesIO(payload)).convert("RGB"))
        source_height, source_width = raster.shape[:2]
        assert area["pixelDimensions"] == [source_width, source_height]
        x0, y0, x1, y1 = metadata["projection"]["sourceBounds"]
        left, top, right, bottom = rectangles[row["a"]]
        pixel_count = 0
        for start in range(top, bottom, 128):
            stop = min(bottom, start + 128)
            ry, rx = np.nonzero(owners[start:stop, left:right] == number)
            rx, ry = rx + left, ry + start
            lon, lat = inverse((rx + .5) * VIEWBOX[2] / width, (ry + .5) * VIEWBOX[3] / height, registration)
            east, north = to_utm.transform(lon, lat)
            assert np.all((east >= x0) & (east <= x1) & (north >= y0) & (north <= y1)), f"Incomplete terrain tile coverage for {row['n']}"
            px = (east - x0) / (x1 - x0) * source_width - .5
            py = (y1 - north) / (y1 - y0) * source_height - .5
            result[ry, rx, :3] = bilinear(raster, px, py)
            pixel_count += len(rx)
        sources.append({"region": key, "image": area["image"], "imageSHA256": sha(payload), "sourceBounds": [x0, y0, x1, y1], "pixelDimensions": [source_width, source_height], "sampledPixels": pixel_count})
        print(f"Sampled {row['n']}: {pixel_count:,} pixels", flush=True)
    result[result[:, :, 3] == 0, :3] = 0
    buffer = io.BytesIO()
    Image.fromarray(result).save(buffer, format="WEBP", lossless=True, method=4, exact=True)
    payload = buffer.getvalue()
    output = GEO / "norway-county-relief"
    output.mkdir(exist_ok=True)
    filename = "fylker-" + sha(payload)[:12] + ".webp"
    (output / filename).write_bytes(payload)
    manifest = {
        "version": 1,
        "source": source_manifest["source"],
        "sourceURL": source_manifest["sourceURL"],
        "license": source_manifest["license"],
        "geometryLicense": "NordNordWest, Wikimedia Commons; CC BY-SA 3.0 DE",
        "bakedMask": True, "bakedWater": True, "labelFree": True,
        "landTint": source_manifest["landTint"],
        "regions": {"fylker": {
            "geometry": "norway-counties.json", "geometrySHA256": sha(geometry_payload),
            "projection": {"name": "Registered Lambert conformal conic", "registration": "sources/norway-county-registration.json", "coneConstant": registration["coneConstant"], "centralMeridian": registration["centralMeridian"], "matrix": registration["matrix"], "checkpoints": checkpoints, "maximumCheckpointBoundaryDistance": round(max(max(p["boundaryDistances"].values()) for p in checkpoints), 6)},
            "sources": sources,
            "areas": {"main": {"image": "norway-county-relief/" + filename, "imageSHA256": sha(payload), "bounds": VIEWBOX, "pixelDimensions": [width, height], "transform": [1, 0, 0, 1, 0, 0]}}
        }}
    }
    target.write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Built county terrain: {width} × {height}, {len(payload):,} bytes; maximum geographic checkpoint error {manifest['regions']['fylker']['projection']['maximumCheckpointBoundaryDistance']} SVG units")


if __name__ == "__main__":
    main()
