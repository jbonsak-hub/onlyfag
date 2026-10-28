#!/usr/bin/env python3
"""Build MapWiz's polar-extended physical world map from pinned local data.

Normal builds and --check are offline. To bootstrap the compact public-domain
source, pass --source-raster NE2_50M_LC_SR_W.tif once. The original global TIFF
stays outside the repository. Requires Pillow and NumPy.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance
from mapwiz_water import build_hydrology, verify_hydrology
from mapwiz_palette import build_dark, verify_dark

ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / 'assets/geography'
SOURCE_DIR = GEO / 'sources/mapwiz-world'
SOURCE_MANIFEST = SOURCE_DIR / 'source.json'
MANIFEST = GEO / 'mapwiz-world-map.json'
TOP = 81.0
BOTTOM = -84.0
INITIAL_VIEW = {'top': 78.5, 'bottom': -58.8}
ENHANCEMENT = {'color': 1.55, 'contrast': 1.22, 'brightness': .90}
WIDTH = 3840
SOURCE_SIZE = (5400, 2700)


def sha(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def mercator(latitude):
    return np.log(np.tan(np.pi / 4 + np.asarray(latitude) * np.pi / 360))


def expected_height():
    return round(WIDTH * float(mercator(TOP) - mercator(BOTTOM)) / (2 * math.pi))


def bootstrap(path):
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    raw_payload = path.read_bytes()
    raw_image = Image.open(io.BytesIO(raw_payload)).convert('RGB')
    assert raw_image.size[0] == raw_image.size[1] * 2, 'The source must cover the entire geographic world'
    image = raw_image.resize(SOURCE_SIZE, Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    image.save(buffer, format='WEBP', quality=95, method=6)
    payload = buffer.getvalue()
    name = 'natural-earth-ii-' + sha(payload)[:12] + '.webp'
    (SOURCE_DIR / name).write_bytes(payload)
    source = {
        'title': 'Natural Earth II with land cover, shaded relief and water',
        'url': 'https://github.com/nvkelso/natural-earth-raster/blob/master/50m_rasters/NE2_50M_LC_SR_W/NE2_50M_LC_SR_W.tif',
        'license': 'Public domain',
        'originalSHA256': sha(raw_payload),
        'originalDimensions': list(raw_image.size),
        'image': str((SOURCE_DIR / name).relative_to(GEO)),
        'imageSHA256': sha(payload),
        'pixelDimensions': list(image.size),
        'projection': 'equirectangular',
        'bounds': {'west': -180, 'east': 180, 'north': 90, 'south': -90},
        'encoding': {'format': 'WebP', 'quality': 95, 'method': 6},
    }
    SOURCE_MANIFEST.write_text(json.dumps(source, indent=2) + '\n')


def sample(raster, sx, sy):
    height, width = raster.shape[:2]
    sx = np.clip(sx, 0, width - 1.001)
    sy = np.clip(sy, 0, height - 1.001)
    ix, iy = sx.astype(int), sy.astype(int)
    fx, fy = (sx - ix)[..., None], (sy - iy)[..., None]
    return (raster[iy, ix] * (1-fx) * (1-fy) + raster[iy, ix+1] * fx * (1-fy)
            + raster[iy+1, ix] * (1-fx) * fy + raster[iy+1, ix+1] * fx * fy)


def checkpoints():
    targets = json.loads((ROOT / 'services/geography-scores/data.json').read_text())['mapwiz']
    all_targets = [target for items in targets.values() for target in items]
    assert len(all_targets) == 794, 'Review target coverage if the game changes its pool'
    min_lat, max_lat = min(t['lat'] for t in all_targets), max(t['lat'] for t in all_targets)
    assert BOTTOM <= min_lat <= max_lat <= TOP
    assert all(-180 <= t['lon'] <= 180 for t in all_targets)
    y_top, y_bottom = float(mercator(TOP)), float(mercator(BOTTOM))
    result = []
    for category, name in [('place:Norge', 'Svalbard'), ('place:Norge', 'Jan Mayen'), ('place:Norge', 'Galdhøpiggen'), ('place:Norge', 'Oslo'), ('regions', 'Arktis'), ('regions', 'Antarktis'), ('regions', 'Dronning Mauds land')]:
        target = next(t for t in targets[category] if t['name'] == name)
        x = (target['lon'] + 180) / 360
        y = (y_top - float(mercator(target['lat']))) / (y_top - y_bottom)
        lat = (2 * math.atan(math.exp(y_top - y * (y_top-y_bottom))) - math.pi/2) * 180/math.pi
        lon = x * 360 - 180
        assert 0 <= x <= 1 and 0 <= y <= 1
        assert abs(lat-target['lat']) < 1e-10 and abs(lon-target['lon']) < 1e-10
        result.append({'name': name, 'lat': target['lat'], 'lon': target['lon'], 'x': x, 'y': y})
    return {'targetCount': len(all_targets), 'latitudeRange': [min_lat, max_lat], 'checkpoints': result}


def build():
    source = json.loads(SOURCE_MANIFEST.read_text())
    source_payload = (GEO / source['image']).read_bytes()
    assert sha(source_payload) == source['imageSHA256']
    raster = np.asarray(Image.open(io.BytesIO(source_payload)).convert('RGB'), dtype=np.float32)
    height = expected_height()
    output = np.empty((height, WIDTH, 3), dtype=np.uint8)
    top_y, bottom_y = float(mercator(TOP)), float(mercator(BOTTOM))
    for top in range(0, height, 96):
        stop = min(height, top + 96)
        yy, xx = np.mgrid[top:stop, :WIDTH]
        latitude = (2*np.arctan(np.exp(top_y-(yy+.5)/height*(top_y-bottom_y)))-np.pi/2)*180/np.pi
        sx = (xx+.5)/WIDTH*raster.shape[1]-.5
        sy = (90-latitude)/180*raster.shape[0]-.5
        output[top:stop] = np.clip(sample(raster, sx, sy), 0, 255).astype(np.uint8)
    image = Image.fromarray(output)
    image = ImageEnhance.Color(image).enhance(ENHANCEMENT['color'])
    image = ImageEnhance.Contrast(image).enhance(ENHANCEMENT['contrast'])
    image = ImageEnhance.Brightness(image).enhance(ENHANCEMENT['brightness'])
    buffer = io.BytesIO()
    image.save(buffer, format='WEBP', quality=84, method=6)
    payload = buffer.getvalue()
    name = 'physical-' + sha(payload)[:12] + '.webp'
    directory = GEO / 'mapwiz-world-map'
    directory.mkdir(parents=True, exist_ok=True)
    (directory / name).write_bytes(payload)
    manifest = {
        'version': 3,
        'image': '/assets/geography/mapwiz-world-map/' + name,
        'projection': 'mercator',
        'top': TOP,
        'bottom': BOTTOM,
        'initialView': INITIAL_VIEW,
        'enhancement': ENHANCEMENT,
        'west': -180,
        'east': 180,
        'width': WIDTH,
        'height': height,
        'pixelDimensions': [WIDTH, height],
        'imageSHA256': sha(payload),
        'sourceManifest': str(SOURCE_MANIFEST.relative_to(GEO)),
        'sourceManifestSHA256': sha(SOURCE_MANIFEST.read_bytes()),
        'coverage': checkpoints(),
        'encoding': {'format': 'WebP', 'quality': 84, 'method': 6},
    }
    manifest['hydrology'] = build_hydrology(manifest)
    manifest['dark'] = build_dark(image, manifest)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    return manifest


def verify():
    manifest = json.loads(MANIFEST.read_text())
    assert manifest['version'] == 3
    assert manifest['projection'] == 'mercator'
    assert manifest['initialView'] == INITIAL_VIEW
    assert manifest['enhancement'] == ENHANCEMENT
    assert [manifest['top'], manifest['bottom'], manifest['west'], manifest['east']] == [TOP, BOTTOM, -180, 180]
    assert [manifest['width'], manifest['height']] == [WIDTH, expected_height()]
    assert manifest['coverage'] == checkpoints()
    source_path = GEO / manifest['sourceManifest']
    assert sha(source_path.read_bytes()) == manifest['sourceManifestSHA256']
    source = json.loads(source_path.read_text())
    source_payload = (GEO / source['image']).read_bytes()
    assert sha(source_payload) == source['imageSHA256']
    with Image.open(io.BytesIO(source_payload)) as image:
        assert list(image.size) == source['pixelDimensions'] == list(SOURCE_SIZE)
    payload = (ROOT / manifest['image'].lstrip('/')).read_bytes()
    assert sha(payload) == manifest['imageSHA256']
    with Image.open(io.BytesIO(payload)) as image:
        assert list(image.size) == manifest['pixelDimensions'] == [WIDTH, expected_height()]
        assert image.mode == 'RGB'
    verify_hydrology(manifest)
    verify_dark(manifest)
    print('PASS MapWiz world map: all 794 targets within bounds, Arctic/Antarctic checkpoints, Svalbard-edge initial view, contrast settings and pinned image/source hashes')
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-raster', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.source_raster:
        assert not args.check
        bootstrap(args.source_raster)
    if not args.check:
        manifest = build()
        print(f"Built {manifest['width']}x{manifest['height']} Mercator world map to {manifest['top']} degrees north")
    verify()


if __name__ == '__main__':
    main()
