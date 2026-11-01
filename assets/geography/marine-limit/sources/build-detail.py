#!/usr/bin/env python3
"""Build local detailed NGU marine-limit grid from native ArcGIS mirror responses.

The input query omits maxAllowableOffset: no server generalisation is requested.
Each repaired source geometry is simplified ONCE at 5 m, before tile clipping.
Output is explicitly EPSG:25833, not RFC 7946 lon/lat GeoJSON. Native responses
are retained outside Git; all output needed by the website is local.
"""
import argparse
import gc
import hashlib
import json
import math
from pathlib import Path
from shapely import make_valid
from shapely.geometry import Polygon, MultiPolygon, shape, mapping, box

parser=argparse.ArgumentParser()
parser.add_argument('--raw',type=Path,required=True)
parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'data'/'detail')
args=parser.parse_args()
CELL=50000
LIMIT=3_000_000
DATE='2024-01-23'
output=args.output;tile_dir=output/'tiles';tile_dir.mkdir(parents=True,exist_ok=True)


def polygonal(g):
 if isinstance(g,(Polygon,MultiPolygon)):return g
 result=[]
 for child in getattr(g,'geoms',[]):
  child=polygonal(child)
  if isinstance(child,Polygon):result.append(child)
  elif isinstance(child,MultiPolygon):result.extend(child.geoms)
 return MultiPolygon(result)


def vertices(coords):
 if not coords:return 0
 if isinstance(coords[0],(int,float)):return 1
 return sum(vertices(c) for c in coords)


def rounded(coords):
 if not coords:return []
 if isinstance(coords[0],(int,float)):return [round(float(v),1) for v in coords]
 return [rounded(c) for c in coords]

batches=[];features=[];empty=[];repaired=[];native_vertices=0;simplified_vertices=0
for offset in [0,1000,2000]:
 p=args.raw/f'batch-{offset}.json';raw=p.read_bytes();digest=hashlib.sha256(raw).hexdigest();data=json.loads(raw)
 assert data['crs']['properties']['name']=='EPSG:25833'
 batches.append({'offset':offset,'features':len(data['features']),'bytes':len(raw),'sha256':digest})
 for item in data['features']:
  props=item['properties'];assert props['annetKvTema']==2 and props['datauttaksdato']==1705968000000
  source_id=props['OBJECTID'];g=shape(item['geometry']);native_vertices+=vertices(item['geometry']['coordinates'])
  if not g.is_valid:g=polygonal(make_valid(g));repaired.append(source_id)
  if g.is_empty or not g.area:empty.append(source_id);continue
  g=g.simplify(5,preserve_topology=True)
  if not g.is_valid:g=polygonal(make_valid(g))
  if g.is_empty:empty.append(source_id);continue
  assert g.is_valid
  simplified_vertices+=vertices(mapping(g)['coordinates'])
  features.append((source_id,g))
 del raw,data
 gc.collect()
 print(f'Prepared native batch {offset}: {len(features)} valid source features.',flush=True)
assert len(features)+len(empty)==2868
assert len({f[0] for f in features})==len(features)

# Group simplified complete features before clipping; seams share exact geometry.
cells={}
for source_id,g in features:
 xmin,ymin,xmax,ymax=g.bounds
 for x in range(math.floor(xmin/CELL),math.floor(xmax/CELL)+1):
  for y in range(math.floor(ymin/CELL),math.floor(ymax/CELL)+1):
   cells.setdefault((x,y),[]).append((source_id,g))
index=[]


def build_tile(tile_id,bounds,items):
 clip=box(*bounds);result=[]
 for source_id,g in items:
  if not g.intersects(clip):continue
  cut=polygonal(g.intersection(clip))
  if cut.is_empty or not cut.area:continue
  geometry=mapping(cut);geometry['coordinates']=rounded(geometry['coordinates'])
  quantized=shape(geometry)
  if not quantized.is_valid:quantized=polygonal(make_valid(quantized));geometry=mapping(quantized)
  if quantized.is_empty or not quantized.area:continue
  assert shape(geometry).is_valid,(tile_id,source_id)
  result.append({'type':'Feature','id':source_id,'properties':{'id':source_id,'sourceID':source_id,'kind':'under-marine-limit','sourceDate':DATE},'geometry':geometry})
 if not result:return
 data={'type':'FeatureCollection','crs':{'type':'name','properties':{'name':'EPSG:25833'}},'bbox':bounds,'features':result}
 raw=(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n').encode()
 if len(raw)>LIMIT and bounds[2]-bounds[0]>6250:
  x0,y0,x1,y1=bounds;xm=(x0+x1)/2;ym=(y0+y1)/2
  for i,child in enumerate([[x0,y0,xm,ym],[xm,y0,x1,ym],[x0,ym,xm,y1],[xm,ym,x1,y1]]):build_tile(tile_id+'-'+str(i),child,items)
  return
 assert len(raw)<=LIMIT,(tile_id,len(raw))
 name=tile_id+'.json';(tile_dir/name).write_bytes(raw)
 index.append({'id':tile_id,'url':'tiles/'+name,'bbox':bounds,'bytes':len(raw),'featureCount':len(result),'sha256':hashlib.sha256(raw).hexdigest()})

for i,((x,y),items) in enumerate(sorted(cells.items())):
 build_tile(f'{x}_{y}',[x*CELL,y*CELL,(x+1)*CELL,(y+1)*CELL],items)
 if i%50==0:print(f'Clipped {i}/{len(cells)} candidate cells; {len(index)} tiles.',flush=True)
index.sort(key=lambda t:t['id'])
active={Path(t['url']).name for t in index}
for p in tile_dir.glob('*.json'):
 if p.name not in active:p.unlink()
manifest={
 'title':'NGU: areal under marin grense – detaljert visning',
 'coordinateSystem':'EPSG:25833','coordinateUnits':'metres','sourceDate':DATE,
 'source':'NGU','mirror':'Geodata AS / ArcGIS Online','license':'NLOD-2.0',
 'serverGeneralizationMeters':None,'simplificationMeters':5,'coordinateRoundingMeters':.1,
 'gridSizeMeters':CELL,'maximumTileBytes':LIMIT,'tileCount':len(index),
 'totalBytes':sum(t['bytes'] for t in index),'sourceFeatureCount':len(features)+len(empty),'featureCount':len(features),
 'note':'Explicit projected-coordinate feature collections, not RFC 7946. View generalisation is not a statement of survey accuracy.',
 'tiles':index}
(output/'index.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
provenance={k:v for k,v in manifest.items() if k!='tiles'}
provenance.update({'nativeResponseBatches':batches,'nativeVertices':native_vertices,'simplifiedVertices':simplified_vertices,'topologyRepairs':repaired,'emptyAfterRepair':empty,'query':{'url':'https://services.arcgis.com/2JyTvMWQSnM2Vi8q/arcgis/rest/services/MarinGrenseFlate_under/FeatureServer/20/query','f':'geojson','where':'1=1','outFields':'*','outSR':25833,'orderByFields':'OBJECTID ASC','resultOffset':[0,1000,2000],'resultRecordCount':1000},'processing':'Repair invalid source polygons; simplify complete source geometry at 5 m in UTM33 before 50 km grid clipping; subdivide tiles above 3 MB; round output coordinates to 0.1 m. No coastline mask, terrain threshold, interpolation or invented boundary.'})
Path(__file__).with_name('detail-manifest.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:manifest[k] for k in ['tileCount','totalBytes','sourceFeatureCount','maximumTileBytes']},ensure_ascii=False),flush=True)
