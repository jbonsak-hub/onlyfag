"""Validate physical-map image geometry, resolution, alpha and projection alignment."""
from pathlib import Path
import hashlib
import importlib.util
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / 'assets/geography'
spec = importlib.util.spec_from_file_location('region_relief', ROOT / 'scripts/build-region-relief.py')
relief = importlib.util.module_from_spec(spec)
spec.loader.exec_module(relief)
maps = json.loads((GEO / 'continent-maps.json').read_text(encoding='utf-8'))
manifest = json.loads((GEO / 'region-relief.json').read_text(encoding='utf-8'))
assert set(manifest['regions']) == set(maps['regions']) == set(relief.REGIONS)
assert manifest['bakedMask'] and manifest['bakedRivers']
assert hashlib.sha256((GEO / 'continent-maps.json').read_text(encoding='utf-8').replace('\r\n', '\n').encode()).hexdigest() == manifest['geometrySHA256']
oceans = {
    'europe': (-20, 45), 'asia': (75, 0), 'northAmerica': (-145, 30),
    'southAmerica': (-79, -25), 'africa': (-10, -20), 'oceania': (-170, -30),
}
maximum_error = 0
land_checks = 0
for name in relief.REGIONS:
    region = maps['regions'][name]
    entry = manifest['regions'][name]
    area = entry['areas']['main']
    assert list(entry['areas']) == ['main']
    assert area['bounds'] == region['viewBox'] == [0, 0, 900, 650]
    assert area['pixelDimensions'] == [2700, 1950]
    assert area['transform'] == [1, 0, 0, 1, 0, 0]
    path = GEO / area['image']
    payload = path.read_bytes()
    assert hashlib.sha256(payload).hexdigest()[:12] in path.name
    assert payload[12:16] == b'VP8L', name + ' uses lossless WebP'
    image = Image.open(path).convert('RGBA')
    assert image.size == (2700, 1950)
    alpha = image.getchannel('A')
    assert alpha.getextrema() == (0, 255)
    fit = entry['projection']['fit']
    assert entry['projection']['center'] == region['projection']['center']
    assert entry['projection']['crop'] == region['projection']['crop']
    for state in region['states']:
        x, y = state['c']
        lon, lat, valid = relief.inverse(x, y, fit)
        assert valid
        px, py = relief.forward(float(lon), float(lat), fit)
        maximum_error = max(maximum_error, math.hypot(px - x, py - y))
        # The unchanged map uses visible markers for countries absent from its
        # simplified source. All real country outlines must retain opaque land.
        if 'a1 1' not in state['d']:
            ix, iy = round(x * 3), round(y * 3)
            assert alpha.crop((max(0, ix - 2), max(0, iy - 2), min(2700, ix + 3), min(1950, iy + 3))).getextrema()[1] >= 240, name + ': ' + state['n'] + ' land is aligned'
            land_checks += 1
    x, y = relief.forward(*oceans[name], fit)
    assert 0 <= x < 900 and 0 <= y < 650
    assert alpha.getpixel((round(x * 3), round(y * 3))) == 0, name + ' ocean remains transparent'
    assert entry['riverSegments'] > 0
    print('PASS', name, len(region['states']), 'targets,', image.size, 'lossless, land/ocean aligned')
assert maximum_error < 1e-8, maximum_error
assert sum(len(region['states']) for region in maps['regions'].values()) == 200
# Forward/inverse longitude handling must preserve both sides of the Pacific.
fit = manifest['regions']['oceania']['projection']['fit']
for lon, lat in [(179, -18), (-171, -14), (-175, -21)]:
    x, y = relief.forward(lon, lat, fit)
    again_lon, again_lat, valid = relief.inverse(x, y, fit)
    assert valid
    assert abs((float(again_lon) - lon + 180) % 360 - 180) < 1e-9
    assert abs(float(again_lat) - lat) < 1e-9
print('PASS', land_checks, 'real land hints; all200 targets retained; maximum projection roundtrip error', maximum_error)
print('PASS Pacific antimeridian wrapping for Fiji, Samoa and Tonga')
