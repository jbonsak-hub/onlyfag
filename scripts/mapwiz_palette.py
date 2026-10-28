"""Build a separate physical-map night palette with a geographic land mask."""
import gzip
import hashlib
import io
import json
import math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
GEO=ROOT/'assets/geography'
SOURCE=GEO/'sources/mapwiz-world/land-source.json'
PALETTE={'ocean':[34,60,69], 'forest':[37,95,69], 'desert':[107,96,67], 'snow':[150,175,167]}

def sha(payload):
    return hashlib.sha256(payload).hexdigest()

def land_mask(metadata):
    source=json.loads(SOURCE.read_text())
    payload=(SOURCE.parent/source['file']).read_bytes()
    assert sha(payload)==source['sha256']
    land=json.loads(gzip.decompress(payload))
    width,height=metadata['width'],metadata['height']
    mercator=lambda lat:math.log(math.tan(math.pi/4+max(-85,min(85,lat))*math.pi/360))
    top,bottom=mercator(metadata['top']),mercator(metadata['bottom'])
    project=lambda p:((p[0]+180)/360*width,(top-mercator(p[1]))/(top-bottom)*height)
    mask=Image.new('L',(width,height));draw=ImageDraw.Draw(mask)
    for feature in land['features']:
        geometry=feature['geometry']
        polygons=[geometry['coordinates']] if geometry['type']=='Polygon' else geometry['coordinates']
        for polygon in polygons:
            draw.polygon([project(p) for p in polygon[0]],fill=255)
            for hole in polygon[1:]:draw.polygon([project(p) for p in hole],fill=0)
    return np.asarray(mask)>0

def build_dark(image, metadata):
    land=land_mask(metadata)
    original=np.asarray(image,dtype=np.float32)
    r,g,b=original[...,0],original[...,1],original[...,2]
    luminance=.2126*r+.7152*g+.0722*b
    warmth=np.clip((r-b)/100,0,1)[...,None]
    snow=np.clip((np.minimum(np.minimum(r,g),b)-145)/95,0,1)[...,None]
    forest=np.array(PALETTE['forest'],dtype=np.float32)
    desert=np.array(PALETTE['desert'],dtype=np.float32)
    pale=np.array(PALETTE['snow'],dtype=np.float32)
    terrain=forest*(1-warmth)+desert*warmth
    terrain=terrain*(1-snow)+pale*snow
    terrain+=(luminance-140)[...,None]*.12
    ocean=np.array(PALETTE['ocean'],dtype=np.float32)+(luminance-150)[...,None]*.065
    pixels=np.clip(np.where(land[...,None],terrain,ocean),0,255).astype(np.uint8)
    buffer=io.BytesIO();Image.fromarray(pixels).save(buffer,format='WEBP',quality=84,method=6)
    payload=buffer.getvalue();name='physical-dark-'+sha(payload)[:12]+'.webp'
    (GEO/'mapwiz-world-map'/name).write_bytes(payload)
    water=metadata['hydrology']
    svg=(ROOT/water['image'].lstrip('/')).read_text()
    svg=svg.replace('#78b9d0','#355e6c').replace('#418ba7','#527987').replace('#428ead','#416978').encode()
    water_name='water-dark-'+sha(svg)[:12]+'.svg'
    (GEO/'mapwiz-world-map'/water_name).write_bytes(svg)
    return {'image':'/assets/geography/mapwiz-world-map/'+name,'imageSHA256':sha(payload),
            'palette':PALETTE,'landSourceManifest':str(SOURCE.relative_to(GEO)),
            'landSourceManifestSHA256':sha(SOURCE.read_bytes()),
            'hydrology':{'image':'/assets/geography/mapwiz-world-map/'+water_name,'imageSHA256':sha(svg)}}

def verify_dark(metadata):
    dark=metadata['dark']
    assert dark['palette']==PALETTE
    assert dark['landSourceManifestSHA256']==sha(SOURCE.read_bytes())
    for record in [dark,dark['hydrology']]:
        assert sha((ROOT/record['image'].lstrip('/')).read_bytes())==record['imageSHA256']
    with Image.open(ROOT/dark['image'].lstrip('/')) as image:
        assert image.size==(metadata['width'],metadata['height'])
        # Open Pacific: geographic water is assigned a blue-gray night color,
        # while physical relief on land remains independently colored.
        mercator=lambda lat:math.log(math.tan(math.pi/4+lat*math.pi/360))
        def pixel(lon,lat):
            return image.getpixel((round((lon+180)/360*image.width),round((mercator(metadata['top'])-mercator(lat))/(mercator(metadata['top'])-mercator(metadata['bottom']))*image.height)))
        ocean=pixel(-150,0);forest=pixel(20,0)
        assert ocean[2]>ocean[0] and max(ocean)<90
        assert forest[1]>forest[0] and forest[1]>forest[2]
    print('PASS MapWiz night palette: geographic sea mask, independent ocean/land colors, matching water and map hashes')
