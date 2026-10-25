"""Bake offline, label-free Norwegian terrain in the unchanged quiz coordinates.

Requires municipality-requirements.txt, Pillow and NumPy. Example:
  python scripts/build-norway-relief.py --cache ../terrain-source/norway-dtm \
      --natural-earth ../terrain-source/NE2_50M_SR_W.tif
Only this build downloads Kartverket DTM hillshade; games use local lossless WebP.
"""
import argparse
import hashlib
import importlib.util
import io
import json
import math
import re
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform, unary_union

ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / 'assets/geography'
WMS = 'https://wms.geonorge.no/skwms1/wms.hoyde-dtm'
LAYER = 'DTM:skyggerelieff'
OCEAN = (171, 211, 218)
LAND = (194, 207, 172)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def module(name, file):
    spec = importlib.util.spec_from_file_location(name, file)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def number(value):
    return round(value, 9)


def raster_specs():
    atlas = module('norway_municipality_builder', ROOT / 'scripts/build-norway-municipality-assets.py')
    index = json.loads((GEO / 'municipalities/index-v3.json').read_text(encoding='utf-8'))
    project = Transformer.from_crs('EPSG:4326', 'EPSG:25833', always_xy=True).transform
    topology = atlas.read_json_gzip(atlas.BOUNDARY_SOURCE)
    rows = {feature['properties']['kommunenummer']: transform(project, shape(feature['geometry'])).buffer(0)
            for feature in atlas.decode_topology(topology)}
    specs = {}
    for county in index['counties']:
        path = GEO / 'municipalities' / county['file']
        data = json.loads(path.read_text(encoding='utf-8'))
        union = unary_union([rows[state['a']] for state in data['states']])
        canvas = atlas.Canvas(union.bounds)
        assert canvas.view_box == data['viewBox'], county['code']
        error = max(abs(a - b) for state in data['states'] for a, b in zip(canvas.center(rows[state['a']]), state['c']))
        assert error <= .011, (county['code'], error)
        width, height = data['viewBox'][2:]
        # Extra context fills the letterboxed margins and normal zoom-out views.
        bounds = [-400, -400, width + 800, height + 800]
        specs['county-' + county['code']] = {
            'data': data, 'file': str(path.relative_to(GEO)).replace('\\', '/'),
            'canvas': {'xmin': canvas.xmin, 'ymax': canvas.ymax, 'scale': canvas.scale, 'padding': 16},
            'bounds': bounds, 'pixelDimensions': [math.ceil(bounds[2] * 2), math.ceil(bounds[3] * 2)],
            'geometryError': error,
        }
    path = GEO / 'oslo-bydeler/oslo.json'
    data = json.loads(path.read_text(encoding='utf-8'))
    canvas = atlas.Canvas(data['contextCrop']['bounds'])
    # Oslo's adaptive camera zooms into this broad context, so retain 4096 pixels.
    bounds = data['viewBox']
    size = [4096, round(4096 * bounds[3] / bounds[2])]
    specs['oslo'] = {'data': data, 'file': 'oslo-bydeler/oslo.json',
                     'canvas': {'xmin': canvas.xmin, 'ymax': canvas.ymax, 'scale': canvas.scale, 'padding': 16},
                     'bounds': bounds, 'pixelDimensions': size, 'geometryError': 0}
    return specs


def utm_bounds(bounds, canvas):
    x, y, width, height = bounds
    scale, pad = canvas['scale'], canvas['padding']
    return [canvas['xmin'] + (x - pad) / scale, canvas['ymax'] - (y + height - pad) / scale,
            canvas['xmin'] + (x + width - pad) / scale, canvas['ymax'] - (y - pad) / scale]


def request_tile(bounds, size, cache):
    query = {'SERVICE': 'WMS', 'VERSION': '1.3.0', 'REQUEST': 'GetMap', 'LAYERS': LAYER, 'STYLES': '',
             'CRS': 'EPSG:25833', 'BBOX': ','.join(str(number(v)) for v in bounds),
             'WIDTH': size[0], 'HEIGHT': size[1], 'FORMAT': 'image/png', 'TRANSPARENT': 'TRUE'}
    url = WMS + '?' + urllib.parse.urlencode(query)
    key = sha(url.encode())
    file = cache / (key + '.png')
    if not file.exists():
        request = urllib.request.Request(url, headers={'User-Agent': 'Onlyfag-offline-terrain-builder/1.0'})
        with urllib.request.urlopen(request, timeout=120) as response:
            payload = response.read()
        image = Image.open(io.BytesIO(payload))
        assert image.size == tuple(size), (size, image.size)
        file.write_bytes(payload)
    payload = file.read_bytes()
    image = Image.open(io.BytesIO(payload))
    assert image.size == tuple(size), (file, size)
    return image.convert('L'), {'url': url, 'sha256': sha(payload), 'pixelDimensions': size}


def hillshade(bounds, size, cache):
    width, height = size
    image = Image.new('L', size)
    requests = []
    # Keep requests well below MapServer's usual 4096px limit. Tile boundaries
    # are exact pixel edges in the same UTM box: no shifts or resized tiles.
    for top in range(0, height, 2048):
        for left in range(0, width, 2048):
            right, bottom = min(left + 2048, width), min(top + 2048, height)
            x0, y0, x1, y1 = bounds
            box = [x0 + (x1-x0)*left/width, y1-(y1-y0)*bottom/height,
                   x0 + (x1-x0)*right/width, y1-(y1-y0)*top/height]
            tile, metadata = request_tile(box, [right-left, bottom-top], cache)
            image.paste(tile, (left, top)); requests.append(metadata)
    return np.asarray(image), requests


def rectangular_mask_filter(mask,size,maximum=False):
    # Separable Boolean min/max avoids sorting millions of 7x7/11x11 windows.
    radius=size//2
    padded=np.pad(mask,((0,0),(radius,radius)),mode='edge')
    result=padded[:,:mask.shape[1]].copy()
    for step in range(1,size):
        if maximum:result|=padded[:,step:step+mask.shape[1]]
        else:result&=padded[:,step:step+mask.shape[1]]
    padded=np.pad(result,((radius,radius),(0,0)),mode='edge')
    result=padded[:mask.shape[0],:].copy()
    for step in range(1,size):
        if maximum:result|=padded[step:step+mask.shape[0],:]
        else:result&=padded[step:step+mask.shape[0],:]
    return result


def fallback_field(shade, land, spec, natural):
    # Kartverket uses large flat value-253 polygons where its national DTM
    # coverage ends. Small real highlights are not missing data: opening the
    # mask removes those, while retaining the broad coverage components.
    patch=rectangular_mask_filter(shade==253,7)
    patch=rectangular_mask_filter(patch,11,maximum=True)
    missing=Image.fromarray(patch.astype(np.uint8)*255)
    missing=ImageChops.multiply(missing,land.convert('L'))
    rectangle=missing.getbbox()
    if rectangle is None:return shade,0
    missing=missing.filter(ImageFilter.GaussianBlur(3))
    bx,by,bw,bh=spec['bounds'];width,height=spec['pixelDimensions']
    x0,y0,x1,y1=utm_bounds(spec['bounds'],spec['canvas'])
    left,top,right,bottom=rectangle
    left=max(0,left-12);top=max(0,top-12);right=min(width,right+12);bottom=min(height,bottom+12)
    source_h,source_w,_=natural.shape
    inverse=Transformer.from_crs('EPSG:25833','EPSG:4326',always_xy=True)
    result=shade.astype(np.float32)
    alpha=np.asarray(missing).astype(np.float32)/255
    x=x0+(np.arange(left,right)[None,:]+.5)*(x1-x0)/width
    for row in range(top,bottom,80):
        count=min(80,bottom-row)
        y=y1-(np.arange(row,row+count)[:,None]+.5)*(y1-y0)/height
        lon,lat=inverse.transform(np.broadcast_to(x,(count,right-left)),np.broadcast_to(y,(count,right-left)))
        px=(lon+180)%360/360*source_w-.5;py=np.clip((90-lat)/180*source_h-.5,0,source_h-1.001)
        ix,iy=np.floor(px).astype(int),np.floor(py).astype(int)
        fx,fy=(px-ix)[...,None],(py-iy)[...,None]
        rgb=natural[iy,ix%source_w]*(1-fx)*(1-fy)+natural[iy,(ix+1)%source_w]*fx*(1-fy)+natural[iy+1,ix%source_w]*(1-fx)*fy+natural[iy+1,(ix+1)%source_w]*fx*fy
        luminance=rgb[:,:,0]*.2126+rgb[:,:,1]*.7152+rgb[:,:,2]*.0722
        coarse=np.clip(164+(luminance-190)*1.1,85,225)
        sea=(rgb[:,:,2]>rgb[:,:,0]*1.02)&(rgb[:,:,2]>rgb[:,:,1]*.98)
        coarse[sea]=164
        a=alpha[row:row+count,left:right]
        result[row:row+count,left:right]=result[row:row+count,left:right]*(1-a)+coarse*a
    return result,int(np.count_nonzero(alpha))


def parts(path):
    for match in re.finditer(r'M([^M]+)', path):
        text = 'M' + match.group(1)
        points = [tuple(map(float, p)) for p in re.findall(r'[ML]\s*([-\d.]+)[ ,]+([-\d.]+)', text)]
        if len(points) >= 2:
            yield points, text.rstrip().endswith(('Z', 'z'))


def mask_path(path, size, bounds):
    bx, by, bw, bh = bounds; width, height = size
    mask = Image.new('1', size)
    for points, closed in parts(path):
        if not closed or len(points) < 3: continue
        points = [((x-bx)*width/bw, (y-by)*height/bh) for x, y in points]
        x0 = max(0, math.floor(min(p[0] for p in points))-1); y0=max(0, math.floor(min(p[1] for p in points))-1)
        x1 = min(width, math.ceil(max(p[0] for p in points))+2); y1=min(height, math.ceil(max(p[1] for p in points))+2)
        if x1 <= x0 or y1 <= y0: continue
        ring = Image.new('1', (x1-x0, y1-y0))
        ImageDraw.Draw(ring).polygon([(x-x0, y-y0) for x, y in points], fill=1)
        mask.paste(ImageChops.logical_xor(mask.crop((x0,y0,x1,y1)), ring), (x0,y0))
    return mask


def paint(spec, shade, natural):
    bounds, size, data = spec['bounds'], spec['pixelDimensions'], spec['data']
    land = Image.new('1', size)
    paths = [state['d'] for state in data['states'] if state.get('kind') != 'lake']
    paths += [data.get(key, '') for key in ['context', 'forestContext', 'quietIslands']]
    paths += [state.get('islands', '') for state in data['states']]
    for path in paths:
        if path: land = ImageChops.logical_or(land, mask_path(path, size, bounds))
    water = Image.new('1', size)
    for feature in data.get('water', []) + [s for s in data['states'] if s.get('kind') == 'lake']:
        if feature.get('kind') == 'river': continue
        water = ImageChops.logical_or(water, mask_path(feature['d'], size, bounds))
    land = ImageChops.logical_and(land, ImageChops.invert(water))
    field,fallback_pixels=fallback_field(shade,land,spec,natural)
    factor=.62+.48*field.astype(float)/170
    factor[(shade==0)|(shade==255)]=1
    # A constant quiet hue avoids RGB noise without changing the hillshade's
    # spatial detail. Every available DTM shade value remains an input.
    rgb=np.clip(np.array(LAND)[None,None,:]*factor[:,:,None],0,255).astype(np.uint8)
    result = Image.fromarray(rgb).convert('RGBA')
    result.putalpha(land.convert('L'))
    overlay = Image.new('RGBA', size)
    draw = ImageDraw.Draw(overlay)
    bx, by, bw, bh = bounds; width, height = size
    for feature in data.get('water', []):
        if feature.get('kind') != 'river': continue
        for points, _ in parts(feature['d']):
            draw.line([((x-bx)*width/bw,(y-by)*height/bh) for x,y in points], fill=(73,139,159,255), width=max(1,round(.65*width/bw)), joint='curve')
    result = Image.alpha_composite(result, overlay)
    # Sea and lakes have the same quiet blue as the existing physical maps.
    background = Image.new('RGBA', size, (*OCEAN, 255))
    return Image.alpha_composite(background, result).convert('RGB'),fallback_pixels


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, required=True)
    parser.add_argument('--workers', type=int, default=2)
    parser.add_argument('--natural-earth',type=Path,required=True)
    parser.add_argument('--only', help='Comma-separated region keys for a partial build')
    args = parser.parse_args(); args.cache.mkdir(parents=True, exist_ok=True)
    output = GEO / 'norway-relief'; output.mkdir(exist_ok=True)
    natural=np.asarray(Image.open(args.natural_earth).convert('RGB'))
    manifest_path = GEO / 'norway-relief.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if args.only and manifest_path.exists() else {
        'version': 1, 'source': 'Kartverket Høydedata DTM shaded relief; Natural Earth II fallback outside DTM coverage; existing local coast and water geometry',
        'sourceURL': 'https://kartkatalog.geonorge.no/Metadata/uuid/5a668bef-0e25-46bc-8002-fe284427490c',
        'license': 'Kartverket CC BY 4.0; Natural Earth public domain',
        'bakedWater': True, 'labelFree': True, 'landTint': list(LAND), 'hillshadeQuantized': False, 'regions': {}}
    manifest['source'] = 'Kartverket Høydedata DTM shaded relief; Natural Earth II fallback outside DTM coverage; existing local coast and water geometry'
    manifest['license'] = 'Kartverket CC BY 4.0; Natural Earth public domain'
    manifest['landTint'] = list(LAND)
    manifest['hillshadeQuantized'] = False
    manifest['naturalEarthSHA256']=sha(args.natural_earth.read_bytes())
    manifest['fallback']={'flatNoDataValue':253,'minimumPatchPixels':49,'coverageFeatherPixels':3,'source':'Natural Earth II 1:50m shaded relief and water 3.2.0'}
    for obsolete in ['colourFieldPaletteSize']:
        manifest.pop(obsolete,None)
    specs = raster_specs()
    def build(key, spec):
        print('Building', key, spec['pixelDimensions'], flush=True)
        bbox = utm_bounds(spec['bounds'], spec['canvas'])
        shade, requests = hillshade(bbox, spec['pixelDimensions'], args.cache)
        image,fallback_pixels = paint(spec, shade, natural)
        buffer = io.BytesIO(); image.save(buffer, format='WEBP', lossless=True, method=4, exact=True)
        payload = buffer.getvalue(); filename = key + '-' + sha(payload)[:12] + '.webp'
        (output / filename).write_bytes(payload)
        metadata = {'projection': {'name': 'ETRS89 / UTM zone 33N', 'crs': 'EPSG:25833', 'canvas': spec['canvas'], 'sourceBounds': bbox},
            'geometry': spec['file'], 'geometrySHA256': sha(json.dumps(spec['data'], ensure_ascii=False, separators=(',', ':')).encode()),
            'geometryError': spec['geometryError'], 'requests': requests,
            'fallbackPixels':fallback_pixels,
            'areas': {'main': {'image': 'norway-relief/' + filename, 'bounds': spec['bounds'], 'pixelDimensions': spec['pixelDimensions'], 'transform': [1,0,0,1,0,0]}}}
        print(key, len(payload), 'bytes', flush=True)
        return key,metadata
    selected={key:spec for key,spec in specs.items() if not args.only or key in args.only.split(',')}
    with ThreadPoolExecutor(max_workers=max(1,min(args.workers,3))) as executor:
        futures=[executor.submit(build,key,spec) for key,spec in selected.items()]
        for future in as_completed(futures):
            key,metadata=future.result();manifest['regions'][key]=metadata
            manifest['regions']={key:manifest['regions'][key] for key in sorted(manifest['regions'])}
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')


if __name__ == '__main__':
    main()
