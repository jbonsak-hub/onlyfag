"""Build full-resolution regional relief in the unchanged click-map coordinates.

Usage: python scripts/build-region-relief.py source.tif rivers.geojson [--node node]
Dependencies: Pillow, NumPy. Sources are public-domain Natural Earth data.
No map service or geographic library is needed at runtime.
"""
import argparse
import hashlib
import io
import json
import math
import re
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / 'assets/geography'
REGIONS = ['europe', 'asia', 'northAmerica', 'southAmerica', 'africa', 'oceania']
SIZE = (2700, 1950)
SS = 2
RAD = math.pi / 180


def sha(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def projection_fits(node):
    # Reuse the exact original fit, including its locally embedded Natural
    # Earth country snapshot and microstate points. Stop before any file write.
    script = r"""
const fs=require('node:fs'),path=require('node:path');
const file=path.resolve('scripts/build-continent-map-assets.cjs');
let source=fs.readFileSync(file,'utf8');
source=source.replace('const regions={};','const regions={};const projectionFits={};');
const fit='const transform=p=>[offsetX+(p[0]-left)*scale,offsetY+(p[1]-top)*scale];';
if(!source.includes(fit))throw Error('Update relief projection extraction for the map builder');
source=source.replace(fit,fit+'projectionFits[key]={scale,left,top,offsetX,offsetY,center:definition.center,crop:definition.crop};');
source=source.slice(0,source.indexOf('const assigned='))+'return projectionFits;';
const result=new Function('require','__dirname','process',source)(require,path.dirname(file),{argv:[]});
process.stdout.write(JSON.stringify(result));
"""
    result = subprocess.run([node, '-e', script], cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def inverse(x, y, fit):
    px = (x - fit['offsetX']) / fit['scale'] + fit['left']
    py = -((y - fit['offsetY']) / fit['scale'] + fit['top'])
    rho = np.hypot(px, py)
    valid = rho <= 2
    angle = 2 * np.arcsin(np.clip(rho / 2, 0, 1))
    sin_c, cos_c = np.sin(angle), np.cos(angle)
    phi0 = fit['center'][1] * RAD
    safe_rho = np.where(rho < 1e-12, 1, rho)
    lat = np.arcsin(np.clip(cos_c * math.sin(phi0) + py * sin_c * math.cos(phi0) / safe_rho, -1, 1)) / RAD
    lon = fit['center'][0] + np.arctan2(px * sin_c, rho * math.cos(phi0) * cos_c - py * math.sin(phi0) * sin_c) / RAD
    lat = np.where(rho < 1e-12, fit['center'][1], lat)
    lon = np.where(rho < 1e-12, fit['center'][0], lon)
    return lon, lat, valid


def forward(lon, lat, fit):
    lon = fit['center'][0] + (lon - fit['center'][0] + 180) % 360 - 180
    lam = (lon - fit['center'][0]) * RAD
    phi, phi0 = lat * RAD, fit['center'][1] * RAD
    k = math.sqrt(2 / (1 + math.sin(phi0) * math.sin(phi) + math.cos(phi0) * math.cos(phi) * math.cos(lam)))
    x = k * math.cos(phi) * math.sin(lam)
    y = -k * (math.cos(phi0) * math.sin(phi) - math.sin(phi0) * math.cos(phi) * math.cos(lam))
    return fit['offsetX'] + (x - fit['left']) * fit['scale'], fit['offsetY'] + (y - fit['top']) * fit['scale']


def rings(path):
    for part in re.split('[zZ]', path):
        points = [tuple(map(float, p)) for p in re.findall(r'[ML]\s*([-\d.]+)[ ,]+([-\d.]+)', part)]
        if len(points) >= 3:
            yield points


def mask_path(path, size, scale):
    # Each compound country path is even-odd; different countries form a union.
    # Limit temporary allocations to each ring's own bounds.
    mask = Image.new('1', size)
    for ring in rings(path):
        points = [(x * scale, y * scale) for x, y in ring]
        x0 = max(0, math.floor(min(p[0] for p in points)) - 1)
        y0 = max(0, math.floor(min(p[1] for p in points)) - 1)
        x1 = min(size[0], math.ceil(max(p[0] for p in points)) + 2)
        y1 = min(size[1], math.ceil(max(p[1] for p in points)) + 2)
        if x1 <= x0 or y1 <= y0:
            continue
        ring_mask = Image.new('1', (x1 - x0, y1 - y0))
        ImageDraw.Draw(ring_mask).polygon([(x - x0, y - y0) for x, y in points], fill=1)
        mask.paste(ImageChops.logical_xor(mask.crop((x0, y0, x1, y1)), ring_mask), (x0, y0))
    return mask


def projected_rivers(features, fit):
    west, east, south, north = fit['crop']
    for feature in features:
        if feature['properties'].get('scalerank', 99) > 4:
            continue
        geometry = feature['geometry']
        lines = [geometry['coordinates']] if geometry['type'] == 'LineString' else geometry['coordinates'] if geometry['type'] == 'MultiLineString' else []
        for line in lines:
            current = []
            for point in line:
                lon = fit['center'][0] + (point[0] - fit['center'][0] + 180) % 360 - 180
                lat = point[1]
                if west <= lon <= east and south <= lat <= north:
                    current.append(forward(lon, lat, fit))
                else:
                    if len(current) > 1:
                        yield current
                    current = []
            if len(current) > 1:
                yield current


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('raster', type=Path)
    parser.add_argument('rivers', type=Path)
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    Image.MAX_IMAGE_PIXELS = 100_000_000
    raster = np.asarray(Image.open(args.raster).convert('RGB'))
    source_h, source_w, _ = raster.shape
    maps = json.loads((GEO / 'continent-maps.json').read_text(encoding='utf-8'))
    fits = projection_fits(args.node)
    river_features = json.loads(args.rivers.read_text(encoding='utf-8'))['features']
    output = GEO / 'region-relief'
    output.mkdir(exist_ok=True)
    manifest = {
        'version': 1,
        'source': 'Natural Earth II 1:50m shaded relief and water 3.2.0; Natural Earth 1:50m rivers',
        'sourceSHA256': sha(args.raster),
        'riversSHA256': sha(args.rivers),
        'geometrySHA256': hashlib.sha256((GEO / 'continent-maps.json').read_text(encoding='utf-8').replace('\r\n', '\n').encode()).hexdigest(),
        'bakedMask': True,
        'bakedRivers': True,
        'regions': {},
    }
    ow, oh = SIZE
    for name in REGIONS:
        region, fit = maps['regions'][name], fits[name]
        result = np.empty((oh, ow, 3), dtype=np.uint8)
        for row in range(0, oh, 100):
            count = min(100, oh - row)
            x = (np.arange(ow)[None, :] + .5) * 900 / ow
            y = (np.arange(row, row + count)[:, None] + .5) * 650 / oh
            lon, lat, valid = inverse(x, y, fit)
            px = (lon + 180) % 360 / 360 * source_w - .5
            py = np.clip((90 - lat) / 180 * source_h - .5, 0, source_h - 1.001)
            x0, y0 = np.floor(px).astype(int), py.astype(int)
            fx, fy = (px - x0)[..., None], (py - y0)[..., None]
            x1, x0 = (x0 + 1) % source_w, x0 % source_w
            sample = raster[y0, x0] * (1 - fx) * (1 - fy) + raster[y0, x1] * fx * (1 - fy) + raster[y0 + 1, x0] * (1 - fx) * fy + raster[y0 + 1, x1] * fx * fy
            result[row:row + count] = np.clip(sample, 0, 255).astype(np.uint8)
        size = (ow * SS, oh * SS)
        mask = Image.new('1', size)
        paths = [state['d'] for state in region['states']] + [region.get('context', ''), region.get('territory', '')]
        for path in paths:
            if path:
                mask = ImageChops.logical_or(mask, mask_path(path, size, ow / 900 * SS))
        overlay = Image.new('RGBA', size)
        draw = ImageDraw.Draw(overlay)
        river_count = 0
        for line in projected_rivers(river_features, fit):
            draw.line([(x * ow / 900 * SS, y * oh / 650 * SS) for x, y in line], fill=(68, 139, 163, 230), width=round(.75 * ow / 900 * SS), joint='curve')
            river_count += 1
        painted = Image.alpha_composite(Image.fromarray(result).convert('RGBA'), overlay.resize(SIZE, Image.Resampling.LANCZOS))
        painted.putalpha(mask.convert('L').resize(SIZE, Image.Resampling.LANCZOS))
        pixels = np.asarray(painted).copy()
        pixels[pixels[:, :, 3] == 0, :3] = 0
        painted = Image.fromarray(pixels)
        buffer = io.BytesIO()
        painted.save(buffer, format='WEBP', lossless=True, method=6, exact=True)
        payload = buffer.getvalue()
        filename = name + '-' + hashlib.sha256(payload).hexdigest()[:12] + '.webp'
        (output / filename).write_bytes(payload)
        manifest['regions'][name] = {
            'projection': {**region['projection'], 'fit': fit},
            'areas': {'main': {'image': 'region-relief/' + filename, 'bounds': [0, 0, 900, 650], 'pixelDimensions': list(SIZE), 'transform': [1, 0, 0, 1, 0, 0]}},
            'riverSegments': river_count,
        }
        print(name, SIZE, len(payload), 'bytes;', river_count, 'river segments')
    (GEO / 'region-relief.json').write_text(json.dumps(manifest, separators=(',', ':')) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
