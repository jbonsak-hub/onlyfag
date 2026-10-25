"""Integrity and geographic alignment checks for all offline Norwegian terrain."""
import importlib.util
import json
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import numpy as np
from PIL import Image
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / 'assets/geography'
spec = importlib.util.spec_from_file_location('relief', ROOT / 'scripts/build-norway-relief.py')
builder = importlib.util.module_from_spec(spec); spec.loader.exec_module(builder)
manifest = json.loads((GEO / 'norway-relief.json').read_text(encoding='utf-8'))
atlas = json.loads((GEO / 'municipalities/index-v3.json').read_text(encoding='utf-8'))
assert set(manifest['regions']) == {'county-'+c['code'] for c in atlas['counties']} | {'oslo'}
assert manifest['bakedWater'] and manifest['labelFree']
assert manifest['license'] == 'Kartverket CC BY 4.0; Natural Earth public domain'
assert manifest['hillshadeQuantized'] is False and manifest['landTint'] == list(builder.LAND)
assert len(manifest['naturalEarthSHA256']) == 64
assert manifest['fallback']['flatNoDataValue'] == 253
projection = Transformer.from_crs('EPSG:4326', 'EPSG:25833', always_xy=True)
for key, region in manifest['regions'].items():
    data = json.loads((GEO / region['geometry']).read_text(encoding='utf-8'))
    assert builder.sha(json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode()) == region['geometrySHA256']
    assert region['geometryError'] <= .011
    assert region['projection']['crs'] == 'EPSG:25833'
    layer = region['areas']['main']; payload = (GEO / layer['image']).read_bytes()
    assert builder.sha(payload)[:12] in layer['image']
    assert payload[12:16] == b'VP8L', 'Lossless source-resolution WebP required'
    image = Image.open(GEO / layer['image'])
    assert image.size == tuple(layer['pixelDimensions'])
    assert layer['transform'] == [1,0,0,1,0,0]
    assert min(layer['bounds'][2:]) > 0
    assert region['projection']['sourceBounds'] == builder.utm_bounds(layer['bounds'], region['projection']['canvas'])
    width, height = layer['pixelDimensions']; bbox = region['projection']['sourceBounds']
    covered = 0
    for request in region['requests']:
        url = urlparse(request['url']); query = parse_qs(url.query)
        assert url.scheme == 'https' and url.netloc == 'wms.geonorge.no'
        assert query['LAYERS'] == ['DTM:skyggerelieff'] and query['CRS'] == ['EPSG:25833']
        assert query['VERSION'] == ['1.3.0'] and query['FORMAT'] == ['image/png']
        tile_width, tile_height = request['pixelDimensions']
        assert max(tile_width, tile_height) <= 2048
        assert [int(query['WIDTH'][0]),int(query['HEIGHT'][0])] == request['pixelDimensions']
        a,b,c,d = map(float,query['BBOX'][0].split(','))
        pixels = [(a-bbox[0])/(bbox[2]-bbox[0])*width,(bbox[3]-d)/(bbox[3]-bbox[1])*height,
                  (c-bbox[0])/(bbox[2]-bbox[0])*width,(bbox[3]-b)/(bbox[3]-bbox[1])*height]
        assert max(abs(p-round(p)) for p in pixels) < 1e-6, (key,pixels)
        assert abs((pixels[2]-pixels[0])-tile_width) < 1e-6
        assert abs((pixels[3]-pixels[1])-tile_height) < 1e-6
        covered += tile_width*tile_height
        assert len(request['sha256']) == 64
    assert covered == width*height
    if key == 'oslo':
        assert width == 4096 and height == 3955
        assert region['geometry'] == 'oslo-bydeler/oslo.json'
    else:
        assert width >= layer['bounds'][2]*2 and height >= layer['bounds'][3]*2
    if key == 'county-03':
        assert region['geometry'] == 'municipalities/county-03-v3.json'
        assert len(data['states']) == 31
        assert region['fallbackPixels'] > 1000, 'Swedish no-data strips need real terrain fallback'
    print(key, image.size, len(payload), 'bytes: source, tiles and geometry aligned')

# Water remains geographical context, without requiring the heavy SVG water layer.
for key, lon, lat in [('oslo', 10.75, 59.86), ('county-34', 11.030349604977362, 60.77574039029096)]:
    region=manifest['regions'][key]; layer=region['areas']['main']; canvas=region['projection']['canvas']
    x,y = projection.transform(lon,lat)
    sx=canvas['padding']+(x-canvas['xmin'])*canvas['scale']; sy=canvas['padding']+(canvas['ymax']-y)*canvas['scale']
    bx,by,bw,bh=layer['bounds']; w,h=layer['pixelDimensions']
    pixel=Image.open(GEO/layer['image']).convert('RGB').getpixel((round((sx-bx)/bw*w-.5),round((sy-by)/bh*h-.5)))
    assert pixel == builder.OCEAN, (key, pixel)
print('16 lossless terrains; all current geometry/UTM transforms and source tile edges pass; Oslofjord/Mjøsa baked blue')

# Preserve genuine bright terrain, replace only large flat missing-coverage
# patches, and feather the coverage boundary rather than the real hillshade.
shade=np.full((101,101),164,dtype=np.uint8);shade[15,15]=253;shade[40:100,40:100]=253
land=Image.new('1',(101,101),1)
fake={'bounds':[0,0,101,101],'pixelDimensions':[101,101],
      'canvas':{'xmin':260000,'ymax':6650000,'scale':.01,'padding':16}}
field,count=builder.fallback_field(shade,land,fake,np.full((180,360,3),190,dtype=np.uint8))
assert count>1000 and field[70,70]==164
assert field[15,15]==253 and field[10,70]==164
print('Large no-data patch repaired; isolated real highlights and sharp valid terrain retained')
