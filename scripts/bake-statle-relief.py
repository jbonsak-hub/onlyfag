"""Bake coastline masks, inset cuts and rivers into the existing full-resolution relief.

Usage: python scripts/bake-statle-relief.py
Requires Pillow and NumPy. Reads already projected us-relief.json / WebP assets,
plus the unchanged state/context geometry. No source raster or network needed.
The original immutable images and manifest are retained for cached old clients.
"""
from pathlib import Path
import hashlib,io,json,math,re,time
import numpy as np
from PIL import Image,ImageChops,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
GEO=ROOT/'assets/geography'
states=json.loads((GEO/'us-states.json').read_text(encoding='utf-8'))
context=json.loads((GEO/'us-context.json').read_text(encoding='utf-8'))
source=json.loads((GEO/'us-relief.json').read_text(encoding='utf-8'))
SS=2

def rings(path):
 return [[tuple(map(float,p)) for p in re.findall(r'[ML]([-\d.]+) ([-\d.]+)',ring)] for ring in path.split('Z') if ring.strip()]
def area_of(state):return state['a'] if state['a'] in ('AK','HI') else 'main'
def bbox(paths):
 points=[p for path in paths for ring in rings(path) for p in ring]
 left=min(p[0] for p in points);top=min(p[1] for p in points)
 return [left,top,max(p[0] for p in points)-left,max(p[1] for p in points)-top]
def fit(bounds,rect,bottom=False):
 bx,by,bw,bh=bounds;x,y,w,h=rect;scale=min(w/bw,h/bh)
 tx=x+(w-bw*scale)/2-bx*scale;ty=y+(h-bh*scale)*(1 if bottom else .5)-by*scale
 return [scale,0,0,scale,tx,ty],[bx*scale+tx,by*scale+ty,bw*scale,bh*scale]

bounds_by_area={area:bbox([s['d'] for s in states if area_of(s)==area]) for area in ('main','AK','HI')}
transforms={};transforms['main'],_=fit(bounds_by_area['main'],[20,16,825,522])
florida=bbox([next(s for s in states if s['a']=='FL')['d']]);m=transforms['main'];south=(florida[1]+florida[3])*m[3]+m[5]
transforms['AK'],alaska=fit(bounds_by_area['AK'],[25,south-125,165,100],True)
transforms['HI'],hawaii=fit(bounds_by_area['HI'],[215,south-41,110,41],True)
def inset(b,x,w):return [x,b[1]-12,w,south+8-(b[1]-12)]
insets={'AK':inset(alaska,15,187),'HI':inset(hawaii,210,128)}

def path_mask(path,size,to_pixel):
 # Even-odd each compound path independently, then union the paths. XOR only
 # the small bounding box of each ring to avoid allocating 20 MP per island.
 mask=Image.new('1',size)
 for ring in rings(path):
  if len(ring)<3:continue
  coords=[to_pixel(p) for p in ring]
  x0=max(0,math.floor(min(p[0] for p in coords))-1);y0=max(0,math.floor(min(p[1] for p in coords))-1)
  x1=min(size[0],math.ceil(max(p[0] for p in coords))+2);y1=min(size[1],math.ceil(max(p[1] for p in coords))+2)
  if x1<=x0 or y1<=y0:continue
  ring_mask=Image.new('1',(x1-x0,y1-y0));ImageDraw.Draw(ring_mask).polygon([(x-x0,y-y0) for x,y in coords],fill=1)
  mask.paste(ImageChops.logical_xor(mask.crop((x0,y0,x1,y1)),ring_mask),(x0,y0))
 return mask

manifest={'version':2,'bakedMask':True,'bakedRivers':True,'source':source['source'],'sourceSHA256':source['sourceSHA256'],'geometrySHA256':hashlib.sha256(((GEO/'us-states.json').read_text(encoding='utf-8')+(GEO/'us-context.json').read_text(encoding='utf-8')).encode('utf-8')).hexdigest(),'insetBoxes':insets,'areas':{}}
total=0;start=time.perf_counter()
for area,entry in source['areas'].items():
 original=Image.open(GEO/entry['image']).convert('RGB');ow,oh=original.size
 left,top,width,height=entry['bounds'];size=(ow*SS,oh*SS)
 def to_pixel(point):return ((point[0]-left)*ow/width*SS,(point[1]-top)*oh/height*SS)
 paths=[s['d'] for s in states if area_of(s)==area]+[c['d'] for c in context['areas'].get(area,[])]
 mask=Image.new('1',size)
 for path in paths:mask=ImageChops.logical_or(mask,path_mask(path,size,to_pixel))
 # Apply fixed SVG-space inset cuts in this image's source coordinate space.
 m=transforms[area]
 def source_rect(rect):
  x,y,w,h=rect
  a=to_pixel(((x-m[4])/m[0],(y-m[5])/m[3]));b=to_pixel(((x+w-m[4])/m[0],(y+h-m[5])/m[3]))
  return [a[0],a[1],b[0],b[1]]
 if area=='main':
  draw=ImageDraw.Draw(mask)
  for rect in insets.values():draw.rectangle(source_rect(rect),fill=0)
 else:
  window=Image.new('1',size);ImageDraw.Draw(window).rectangle(source_rect(insets[area]),fill=1);mask=ImageChops.logical_and(mask,window)
 alpha=mask.convert('L').resize((ow,oh),Image.Resampling.LANCZOS)
 # Paint anti-aliased rivers only once, instead of maintaining live SVG paths.
 overlay=Image.new('RGBA',size);draw=ImageDraw.Draw(overlay)
 for line in entry.get('rivers','').split('M'):
  points=[to_pixel(tuple(map(float,p))) for p in re.findall(r'([-\d.]+) ([-\d.]+)',line)]
  if len(points)>1:draw.line(points,fill=(68,139,163,230),width=max(1,round(.9*ow/width*SS)),joint='curve')
 painted=Image.alpha_composite(original.convert('RGBA'),overlay.resize((ow,oh),Image.Resampling.LANCZOS))
 painted.putalpha(alpha)
 # RGB under fully transparent pixels is not visible and need not be encoded.
 pixels=np.asarray(painted).copy();pixels[pixels[:,:,3]==0,:3]=0;painted=Image.fromarray(pixels)
 buffer=io.BytesIO();painted.save(buffer,format='WEBP',lossless=True,method=6,exact=True)
 payload=buffer.getvalue();name=area+'-baked-'+hashlib.sha256(payload).hexdigest()[:12]+'.webp';(GEO/'statle-relief'/name).write_bytes(payload)
 manifest['areas'][area]={'image':'statle-relief/'+name,'bounds':entry['bounds'],'pixelDimensions':[ow,oh],'transform':m}
 total+=len(payload);print(area,original.size,len(payload),'bytes; alpha range',alpha.getextrema())
(GEO/'us-relief-raster.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n',encoding='utf-8')
print('total',total,'bytes; built in',round(time.perf_counter()-start,2),'seconds')
