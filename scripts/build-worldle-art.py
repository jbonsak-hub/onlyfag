#!/usr/bin/env python3
"""Build registered Worldle outline/relief assets; normal builds use pinned offline sources."""
import argparse,gzip,hashlib,io,json,math,re,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageEnhance
sys.path.insert(0,'/workspace/shared/municipality-python-deps')
from shapely.geometry import Polygon
ROOT=Path(__file__).resolve().parents[1]
GEO=ROOT/'assets/geography'
DEST=GEO/'worldle-art'
SOURCE=GEO/'sources/worldle'
W,H=960,720
R=6378137.0

def sha(b):return hashlib.sha256(b).hexdigest()
def compact(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def countries():return json.loads(re.search(r'window.GEO_QUIZ_DATA=([\s\S]*);',(GEO/'quiz-data.js').read_text())[1])['countries']
def polys(g):return [g['coordinates']] if g['type']=='Polygon' else g['coordinates'] if g['type']=='MultiPolygon' else []
def bootstrap(path):
 raw=Path(path).read_bytes();world=json.loads(raw);result={}
 extras={'Marokko':['SAH'],'Somalia':['SOL'],'Kypros':['CYN']}
 for c in countries():
  code=c['flagCode'].upper();fs=[f for f in world['features'] if f['properties'].get('ISO_A2_EH')==code or f['properties'].get('ISO_A2')==code]
  if c['country']=='Norge':fs=[f for f in fs if f['properties'].get('GEOUNIT')=='Norway']
  for extra in extras.get(c['country'],[]):fs.extend(f for f in world['features'] if f['properties'].get('GU_A3')==extra)
  if not fs:continue
  result[c['country']]={'code':code.lower(),'polygons':[p for f in fs for p in polys(f['geometry'])]}
 SOURCE.mkdir(parents=True,exist_ok=True)
 payload=gzip.compress(compact(result),compresslevel=9,mtime=0)
 (SOURCE/'countries-10m.json.gz').write_bytes(payload)
 manifest={'source':'Natural Earth 5.1.2 admin-0 map units (public domain)','url':'https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_map_units.geojson','originalSHA256':sha(raw),'extractSHA256':sha(payload),'method':'ISO_A2_EH country groups; mainland Norway and mainland France map units; preserve existing Morocco/Cyprus/Somalia joined territorial outlines.'}
 (SOURCE/'source.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

def merc(lat):return R*math.log(math.tan(math.pi/4+math.radians(max(-85,min(85,lat)))/2))
def shape(country,record):
 source=record['polygons']
 # The existing Worldle depicts mainland France, not French overseas departments.
 if country=='Frankrike':source=[p for p in source if min(pt[0] for pt in p[0])>-10 and max(pt[0] for pt in p[0])<15 and min(pt[1] for pt in p[0])>40]
 # Circular longitude bounds use the widest empty gap as the cut, avoiding the
 # map seam for Fiji/Russia and other countries crossing the date line.
 xs=sorted(set(round(pt[0],8) for p in source for ring in p for pt in ring));gaps=[(xs[(i+1)%len(xs)]-x)%360 for i,x in enumerate(xs)]
 idx=max(range(len(xs)),key=lambda i:gaps[i]);start=xs[(idx+1)%len(xs)]
 def project(pt):
  lon=pt[0]
  while lon<start-1e-7:lon+=360
  while lon>=start+360-1e-7:lon-=360
  return [R*math.radians(lon),merc(pt[1])]
 projected=[[[project(pt) for pt in ring] for ring in p] for p in source]
 # Small distant dependencies must not shrink the familiar mainland into a
 # corner. Retain major landmasses and nearby coastal islands; keep true island
 # countries (Indonesia, Fiji, etc.) complete.
 if country in ['Chile','Portugal','Spania','USA','Australia']:
  areas=[abs(Polygon(p[0]).area) for p in projected];main=projected[max(range(len(areas)),key=lambda i:areas[i])];ring=main[0]
  ml=min(p[0] for p in ring);mr=max(p[0] for p in ring);mb=min(p[1] for p in ring);mt=max(p[1] for p in ring);pad=max(mr-ml,mt-mb)*.08
  projected=[p for p,area in zip(projected,areas) if area>=max(areas)*.02 or not(max(x[0] for x in p[0])<ml-pad or min(x[0] for x in p[0])>mr+pad or max(x[1] for x in p[0])<mb-pad or min(x[1] for x in p[0])>mt+pad)]
 points=[pt for p in projected for ring in p for pt in ring];left=min(p[0] for p in points);right=max(p[0] for p in points);bottom=min(p[1] for p in points);top=max(p[1] for p in points)
 width=max(3000,right-left)*1.13;height=max(2250,top-bottom)*1.13
 if width/height<W/H:width=height*W/H
 else:height=width*H/W
 cx=(left+right)/2;cy=(bottom+top)/2
 bbox=[cx-width/2,cy-height/2,cx+width/2,cy+height/2]
 paths=[];vertices=0
 for p in projected:
  rings=[[(W*(pt[0]-bbox[0])/width,H*(bbox[3]-pt[1])/height) for pt in ring] for ring in p]
  geometry=Polygon(rings[0],rings[1:])
  if not geometry.is_valid:geometry=geometry.buffer(0)
  geometry=geometry.simplify(.23,preserve_topology=True)
  parts=[geometry] if geometry.geom_type=='Polygon' else list(geometry.geoms) if geometry.geom_type=='MultiPolygon' else []
  for part in parts:
   if part.area<.03:continue
   for ring in [part.exterior,*part.interiors]:
    coords=list(ring.coords);vertices+=len(coords)
    paths.append('M'+'L'.join(f'{x:.2f} {y:.2f}' for x,y in coords)+'Z')
 return {'bbox':[round(x,3) for x in bbox],'path':''.join(paths),'vertices':vertices}

def texture(record,raster):
 w,h=640,480;left,bottom,right,top=record['bbox']
 xx,yy=np.meshgrid(np.arange(w),np.arange(h))
 lon=np.degrees((left+(xx+.5)/w*(right-left))/R)
 lat=np.degrees(2*np.arctan(np.exp((top-(yy+.5)/h*(top-bottom))/R))-np.pi/2)
 sx=((lon+180)%360)/360*raster.shape[1]-.5;sy=(90-lat)/180*raster.shape[0]-.5
 ix=np.floor(sx).astype(int);iy=np.clip(np.floor(sy).astype(int),0,raster.shape[0]-2)
 fx=(sx-ix)[...,None];fy=(sy-iy)[...,None]
 a=raster[iy,ix%raster.shape[1]];b=raster[iy,(ix+1)%raster.shape[1]];c=raster[iy+1,ix%raster.shape[1]];d=raster[iy+1,(ix+1)%raster.shape[1]]
 rgb=np.clip(a*(1-fx)*(1-fy)+b*fx*(1-fy)+c*(1-fx)*fy+d*fx*fy,0,255).astype(np.uint8)
 image=ImageEnhance.Color(Image.fromarray(rgb)).enhance(1.12)
 image=ImageEnhance.Contrast(image).enhance(1.06)
 buf=io.BytesIO();image.save(buf,format='WEBP',quality=76,method=4);return buf.getvalue()

def build():
 manifest=json.loads((GEO/'sources/mapwiz-world/source.json').read_text())
 raster=np.asarray(Image.open(GEO/'sources/mapwiz-world'/Path(manifest['image']).name).convert('RGB'))
 source=json.loads(gzip.decompress((SOURCE/'countries-10m.json.gz').read_bytes()))
 DEST.mkdir(parents=True,exist_ok=True);atlas={'version':1,'projection':'EPSG:3857','width':W,'height':H,'countries':{}}
 total=0;largest=0
 for country,record in source.items():
  result=shape(country,record);payload=texture(result,raster);name=f"{record['code']}-{sha(payload)[:12]}.webp";(DEST/name).write_bytes(payload)
  result.update({'image':'/assets/geography/worldle-art/'+name,'bytes':len(payload),'sha256':sha(payload)})
  detail=compact(result);detailName=f"{record['code']}-{sha(detail)[:12]}.json";(DEST/detailName).write_bytes(detail)
  atlas['countries'][country]={'data':'/assets/geography/worldle-art/'+detailName};total+=len(payload);largest=max(largest,len(payload))
 payload=compact(atlas);name='countries-'+sha(payload)[:12]+'.json';(DEST/name).write_bytes(payload)
 metadata={'atlas':'/assets/geography/worldle-art/'+name,'atlasSHA256':sha(payload),'countries':len(source),'atlasBytes':len(payload),'atlasGzipBytes':len(gzip.compress(payload)),'imageBytesTotal':total,'largestImageBytes':largest,'geometrySource':'sources/worldle/source.json','reliefSource':'sources/mapwiz-world/source.json','projection':'EPSG:3857','clipTolerancePx':.23}
 (GEO/'worldle-art.json').write_text(json.dumps(metadata,indent=2)+'\n')
 update_runtime(metadata['atlas'])
 print(json.dumps(metadata))

def update_runtime(url):
 file=GEO/'worldle-statle.js';text=file.read_text();text=re.sub(r"var WORLDLE_ART_ATLAS_URL='[^']*';",f"var WORLDLE_ART_ATLAS_URL='{url}';",text);file.write_text(text)

def verify():
 source=json.loads((SOURCE/'source.json').read_text());assert sha((SOURCE/'countries-10m.json.gz').read_bytes())==source['extractSHA256']
 metadata=json.loads((GEO/'worldle-art.json').read_text());payload=(ROOT/metadata['atlas'].lstrip('/')).read_bytes();assert sha(payload)==metadata['atlasSHA256'];atlas=json.loads(payload)
 assert atlas['projection']=='EPSG:3857';assert len(atlas['countries'])==metadata['countries']>=190
 for country,entry in atlas['countries'].items():
  r=json.loads((ROOT/entry['data'].lstrip('/')).read_bytes())
  left,bottom,right,top=r['bbox'];assert abs((right-left)/(top-bottom)-4/3)<1e-5,country
  assert r['vertices']>3 and r['path'].endswith('Z');image=(ROOT/r['image'].lstrip('/')).read_bytes();assert sha(image)==r['sha256'] and len(image)==r['bytes'];assert r['bytes']<100000
 for country in ['Sierra Leone','Norge','Chile','Indonesia','Fiji']:
  r=json.loads((ROOT/atlas['countries'][country]['data'].lstrip('/')).read_bytes());assert r['vertices']>50,country
 assert metadata['atlasGzipBytes']<500000 and metadata['largestImageBytes']<100000
 print('PASS Worldle: pinned detailed outlines and registered Mercator relief for',metadata['countries'],'countries;',metadata['atlasGzipBytes'],'atlas gzip bytes;',metadata['largestImageBytes'],'max thumbnail bytes')

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--geometry');p.add_argument('--check',action='store_true');args=p.parse_args()
 if args.geometry:bootstrap(args.geometry)
 if not args.check:build()
 verify()
