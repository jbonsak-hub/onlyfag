#!/usr/bin/env python3
"""Bake MapWiz's registered physical Norway atlas and its shared projection.

Bootstrap pinned, small source extracts with --raster global-ne2.tif
--islands natural-earth-10m-admin0-map-units.geojson. Normal rebuilds are offline.
Uses the existing high-detail Kartverket mainland relief/shoreline and small
public-domain Natural Earth physical-colour extracts for all three areas.
"""
import argparse
import hashlib
import importlib.util
import io
import json
import math
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / 'assets/geography'
SOURCES = GEO / 'sources/mapwiz-norway'
MANIFEST = GEO / 'mapwiz-norway-atlas.json'
WIDTH, HEIGHT = 1360.629, 1500.617
SCALE = 2
OCEAN = (169, 208, 220)
AREAS = [
    {'id': 'mainland', 'rect': [0, 0, WIDTH, HEIGHT]},
    {'id': 'svalbard', 'rect': [28, 34, 435, 435],
     'projection': {'type': 'equirectangular', 'bounds': [7, 36, 75.5, 81.5]}},
    {'id': 'jan-mayen', 'rect': [28, 505, 250, 250],
     'projection': {'type': 'equirectangular', 'bounds': [-9.4, -7.6, 70.65, 71.25]}},
]
CROP_BOUNDS = {'mainland': [2, 34, 56, 73],
               'svalbard': [7, 36, 75.5, 81.5],
               'jan-mayen': [-9.4, -7.6, 70.65, 71.25]}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def sample(image, x, y):
    h, w = image.shape[:2]
    x, y = np.clip(x, 0, w - 1.001), np.clip(y, 0, h - 1.001)
    ix, iy = x.astype(int), y.astype(int)
    fx, fy = (x - ix)[..., None], (y - iy)[..., None]
    return image[iy, ix] * (1-fx) * (1-fy) + image[iy, ix+1] * fx * (1-fy) + image[iy+1, ix] * (1-fx) * fy + image[iy+1, ix+1] * fx * fy


def bootstrap(raster_path, islands_path):
    SOURCES.mkdir(parents=True, exist_ok=True)
    image = Image.open(raster_path).convert('RGB')
    w, h = image.size
    sources = {'rasterURL': 'https://github.com/nvkelso/natural-earth-raster',
               'rasterSHA256': sha(raster_path.read_bytes()), 'rasterDimensions': [w, h],
               'geometryURL': 'https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_map_units.geojson',
               'geometrySHA256': sha(islands_path.read_bytes()), 'patches': {}}
    for key, bounds in CROP_BOUNDS.items():
        west, east, south, north = bounds
        left, right = math.floor((west+180)/360*w), math.ceil((east+180)/360*w)
        top, bottom = math.floor((90-north)/180*h), math.ceil((90-south)/180*h)
        patch = image.crop((left, top, right, bottom))
        buffer = io.BytesIO()
        patch.save(buffer, format='WEBP', lossless=True, method=6)
        payload = buffer.getvalue()
        name = key + '-physical-' + sha(payload)[:12] + '.webp'
        (SOURCES/name).write_bytes(payload)
        sources['patches'][key] = {'image': str((SOURCES/name).relative_to(GEO)),
                                  'imageSHA256': sha(payload), 'dimensions': list(patch.size),
                                  'bounds': [left/w*360-180, right/w*360-180,
                                             90-bottom/h*180, 90-top/h*180]}
    features = read_json(islands_path)['features']
    result = []
    for feature in features:
        properties = feature['properties']
        if not any(str(properties.get(k, '')).lower() in ['norway', 'svalbard', 'jan mayen', 'svalbard and jan mayen', 'nor'] for k in ['ADMIN', 'NAME', 'NAME_EN', 'SOVEREIGNT', 'SOV_A3', 'ADM0_A3']):
            continue
        geometry = feature['geometry']
        polys = [geometry['coordinates']] if geometry['type'] == 'Polygon' else geometry['coordinates']
        for poly in polys:
            # The mainland uses the higher-detail existing Kartverket mask.
            if not any(p[1] >= 74 or p[0] < 0 and p[1] >= 70 for p in poly[0]):
                continue
            result.append([[[round(x, 7), round(y, 7)] for x, y, *_ in ring] for ring in poly])
    assert result, 'No Arctic Norwegian island geometry in source'
    payload = (json.dumps({'type': 'MultiPolygon', 'coordinates': result}, separators=(',', ':'))+'\n').encode()
    name = 'arctic-coast-' + sha(payload)[:12] + '.json'
    (SOURCES/name).write_bytes(payload)
    sources['islands'] = {'geometry': str((SOURCES/name).relative_to(GEO)), 'geometrySHA256': sha(payload)}
    (SOURCES/'sources.json').write_text(json.dumps(sources, indent=2)+'\n')


def color_patch(key, lon, lat, sources):
    patch = sources['patches'][key]
    raster = np.asarray(Image.open(GEO/patch['image']).convert('RGB'), dtype=np.float32)
    west, east, south, north = patch['bounds']
    return sample(raster, (lon-west)/(east-west)*raster.shape[1]-.5,
                  (north-lat)/(north-south)*raster.shape[0]-.5)


def no_inverse(x, y, projection):
    m = np.asarray(projection['matrix'])
    undo = np.linalg.inv(m[:2])
    dx, dy = x-m[2, 0], y-m[2, 1]
    px, py = dx*undo[0, 0]+dy*undo[1, 0], dx*undo[0, 1]+dy*undo[1, 1]
    n = projection['coneConstant']
    rho = np.hypot(px, py)/1000
    return projection['centralMeridian']+np.arctan2(px, -py)/n*180/np.pi, (2*np.arctan(rho**(-1/n))-np.pi/2)*180/np.pi


def atlas_metadata():
    registration = read_json(GEO/'sources/norway-county-registration.json')
    areas = json.loads(json.dumps(AREAS))
    areas[0]['projection'] = {'type': 'registered-lambert-conic',
                              **{key: registration[key] for key in ['coneConstant', 'centralMeridian', 'matrix']}}
    return {'version': 1, 'width': WIDTH, 'height': HEIGHT, 'areas': areas}


def verify(manifest):
    assert {k: manifest[k] for k in ['version', 'width', 'height', 'areas']} == atlas_metadata()
    payload = (GEO/manifest['image'].removeprefix('/assets/geography/')).read_bytes()
    assert sha(payload) == manifest['imageSHA256']
    with Image.open(io.BytesIO(payload)) as image:
        assert list(image.size) == manifest['pixelDimensions']
    for source in manifest['sources']:
        assert sha((GEO/source['file']).read_bytes()) == source['sha256'], source['file']
    runtime = (GEO/'geowiz.js').read_text()
    embedded = json.loads(re.search(r'/\* mapwiz-norway-atlas:start \*/ (.*?) /\* mapwiz-norway-atlas:end \*/', runtime).group(1))
    expected = {k: manifest[k] for k in ['version', 'width', 'height', 'areas', 'image']}
    assert embedded == expected, 'Runtime atlas metadata changed; rebuild atlas'
    print('PASS MapWiz Norway atlas: pinned source/image hashes and exact shared runtime projection')


def build():
    metadata = atlas_metadata()
    sources = read_json(SOURCES/'sources.json')
    relief = read_json(GEO/'norway-county-relief.json')['regions']['fylker']['areas']['main']
    native = Image.open(GEO/relief['image']).convert('RGBA')
    size = (round(WIDTH*SCALE), round(HEIGHT*SCALE))
    native = np.asarray(native.resize(size, Image.Resampling.LANCZOS), dtype=np.float32)
    result = np.empty((*native.shape[:2], 3), dtype=np.uint8)
    result[:, :] = OCEAN
    for top in range(0, size[1], 100):
        bottom = min(size[1], top+100)
        yy, xx = np.mgrid[top:bottom, :size[0]]
        lon, lat = no_inverse((xx+.5)/size[0]*WIDTH, (yy+.5)/size[1]*HEIGHT, metadata['areas'][0]['projection'])
        physical = color_patch('mainland', lon, lat, sources)
        # Keep Natural Earth's real land-cover shading while bringing its
        # pale Nordic tones into the green/brown palette of the world map.
        vegetation = np.clip((physical[:, :, 1]-physical[:, :, 0])/18, 0, 1)
        tone = np.mean(physical, axis=2)/190
        green, stone = np.array([126, 165, 94]), np.array([180, 163, 126])
        palette = green*vegetation[..., None]+stone*(1-vegetation[..., None])
        palette *= np.clip(tone, .65, 1.18)[..., None]
        snow = np.clip((np.min(physical, axis=2)-225)/20, 0, 1)[..., None]
        tinted = physical*.35+palette*.65
        physical = tinted*(1-snow)+physical*snow
        detail = np.mean(native[top:bottom, :, :3]/[194, 207, 172], axis=2)
        physical *= np.clip(.65+.35*detail, .50, 1.15)[..., None]
        # Keep the existing fine lakes and fjord water blue, including narrow
        # waters absent from the small global physical-colour source.
        water = (native[top:bottom, :, 2] > native[top:bottom, :, 0]*1.04) & (native[top:bottom, :, 1] > native[top:bottom, :, 0]*1.05)
        physical[water] = OCEAN
        alpha = native[top:bottom, :, 3:4]/255
        result[top:bottom] = np.clip(physical*alpha+np.asarray(OCEAN)*(1-alpha), 0, 255)
    canvas = Image.fromarray(result)
    islands = read_json(GEO/sources['islands']['geometry'])['coordinates']
    for area in metadata['areas'][1:]:
        x, y, width, height = area['rect']
        rect = tuple(round(v*SCALE) for v in [x, y, width, height])
        left, top, iw, ih = rect
        west, east, south, north = area['projection']['bounds']
        yy, xx = np.mgrid[:ih, :iw]
        lon, lat = west+(xx+.5)/iw*(east-west), north-(yy+.5)/ih*(north-south)
        physical = color_patch(area['id'], lon, lat, sources)
        mask = Image.new('L', (iw, ih))
        draw = ImageDraw.Draw(mask)
        for poly in islands:
            for number, ring in enumerate(poly):
                points = [((lon-west)/(east-west)*iw, (north-lat)/(north-south)*ih) for lon, lat in ring]
                draw.polygon(points, fill=255 if number == 0 else 0)
        alpha = np.asarray(mask, dtype=np.float32)[..., None]/255
        inset = np.clip(physical*alpha+np.asarray(OCEAN)*(1-alpha), 0, 255).astype(np.uint8)
        canvas.paste(Image.fromarray(inset), (left, top))
        frame = ImageDraw.Draw(canvas)
        frame.rounded_rectangle([left-2, top-2, left+iw+2, top+ih+2], radius=8*SCALE, outline=(84, 131, 146), width=2)
    buffer = io.BytesIO()
    canvas.save(buffer, format='WEBP', lossless=True, method=6)
    payload = buffer.getvalue()
    name = 'mapwiz-norway/physical-' + sha(payload)[:12] + '.webp'
    (GEO/'mapwiz-norway').mkdir(exist_ok=True)
    (GEO/name).write_bytes(payload)
    metadata.update(image='/assets/geography/'+name, imageSHA256=sha(payload), pixelDimensions=list(canvas.size))
    files = [GEO/'norway-counties.json', GEO/'sources/norway-county-registration.json', GEO/relief['image'], SOURCES/'sources.json']
    files.extend(GEO/p['image'] for p in sources['patches'].values())
    files.append(GEO/sources['islands']['geometry'])
    metadata['sources'] = [{'file': str(file.relative_to(GEO)), 'sha256': sha(file.read_bytes())} for file in files]
    MANIFEST.write_text(json.dumps(metadata, indent=2)+'\n')
    runtime = GEO/'geowiz.js'
    embedded = {key: metadata[key] for key in ['version', 'width', 'height', 'areas', 'image']}
    replacement = '/* mapwiz-norway-atlas:start */ '+json.dumps(embedded, separators=(',', ':'))+' /* mapwiz-norway-atlas:end */'
    runtime.write_text(re.sub(r'/\* mapwiz-norway-atlas:start \*/ .*? /\* mapwiz-norway-atlas:end \*/', lambda _: replacement, runtime.read_text()))
    print(json.dumps({'image': name, 'dimensions': list(canvas.size), 'bytes': len(payload)}))
    verify(metadata)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--raster', type=Path)
    parser.add_argument('--islands', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    Image.MAX_IMAGE_PIXELS = 300_000_000
    if args.check:
        verify(read_json(MANIFEST))
        return
    if args.raster or args.islands:
        assert args.raster and args.islands, 'Bootstrap requires both raster and island coastline'
        bootstrap(args.raster, args.islands)
    build()


if __name__ == '__main__':
    main()
