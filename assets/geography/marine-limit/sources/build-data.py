#!/usr/bin/env python3
"""Build the local educational view from the documented ArcGIS NGU mirror.

Dependencies: pyproj 3.7.2, shapely 2.1.2 (shared OnlyFag GIS environment).
Input is three unmodified GeoJSON REST responses in EPSG:25833. Fetch recipe
and source hashes live in manifest.json. No terrain threshold is generated.
"""
import argparse
import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone
from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely import make_valid
from shapely.ops import transform
from pyproj import Transformer

parser=argparse.ArgumentParser()
parser.add_argument('--raw',type=Path,required=True)
parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'data'/'under-marine-limit.geojson')
args=parser.parse_args()
transformer=Transformer.from_crs(25833,4326,always_xy=True)
features=[];batches=[];original_vertices=0;result_vertices=0;repaired=[];empty=[]

def vertices(coords):
 if not coords:return 0
 if isinstance(coords[0],(int,float)):return 1
 return sum(vertices(x) for x in coords)

def quantize(coords):
 if isinstance(coords,(list,tuple)) and coords and isinstance(coords[0],(int,float)):return [round(float(v),5) for v in coords]
 return [quantize(x) for x in coords]

def polygonal(g):
 if isinstance(g,(Polygon,MultiPolygon)):return g
 polys=[]
 for part in getattr(g,'geoms',[]):
  p=polygonal(part)
  if isinstance(p,Polygon):polys.append(p)
  elif isinstance(p,MultiPolygon):polys.extend(p.geoms)
 return MultiPolygon(polys)

for offset in (0,1000,2000):
 p=args.raw/f'batch-{offset}.json';raw=p.read_bytes();batch=json.loads(raw)
 assert batch['crs']['properties']['name']=='EPSG:25833'
 batches.append({'offset':offset,'features':len(batch['features']),'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)})
 for item in batch['features']:
  props=item['properties'];assert props['annetKvTema']==2 and props['annetKvTema_navn']=='Areal under marin grense'
  assert props['datauttaksdato']==1705968000000
  original_vertices+=vertices(item['geometry']['coordinates'])
  g=shape(item['geometry'])
  if not g.is_valid:g=polygonal(make_valid(g));repaired.append(props['OBJECTID'])
  g=g.simplify(50,preserve_topology=True)
  if not g.is_valid:g=polygonal(make_valid(g))
  if g.is_empty:
   empty.append(props['OBJECTID']);continue
  assert g.is_valid
  g=transform(transformer.transform,g)
  geo=mapping(g);geo['coordinates']=quantize(geo['coordinates'])
  # 5-decimal coordinate quantisation is sub-metre to metre scale in Norway.
  if not shape(geo).is_valid:
   geo=mapping(g);geo['coordinates']=quantize(geo['coordinates'])
   valid=polygonal(make_valid(shape(geo)));geo=mapping(valid)
  if shape(geo).is_empty:
   empty.append(props['OBJECTID']);continue
  assert shape(geo).is_valid
  result_vertices+=vertices(geo['coordinates'])
  features.append({'type':'Feature','id':props['OBJECTID'],'properties':{'id':props['OBJECTID'],'kind':'under-marine-limit','label':'Areal under marin grense','sourceDate':'2024-01-23'},'geometry':geo})
assert len(features)+len(empty)==2868 and len({f['id'] for f in features})==len(features)
bounds=[shape(f['geometry']).bounds for f in features]
bbox=[min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds)]
collection={'type':'FeatureCollection','name':'NGU: areal under marin grense','bbox':bbox,'source':{'provider':'NGU','mirror':'Geodata AS / ArcGIS Online','sourceDate':'2024-01-23','license':'NLOD-2.0','simplificationMeters':50,'description':'Areal under marin grense, ikke et kart over marine avsetninger eller kvikkleire.'},'features':features}
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(json.dumps(collection,ensure_ascii=False,separators=(',',':'))+'\n')
manifest={'dataset':'Areal under marin grense','datasetId':'cf8ccec7-9505-4d84-94a9-eac9c69971d3','sourceProvider':'NGU','sourceDate':'2024-01-23','mirrorItem':'c14552c7456249fcb06b1b1ea1c2bf3d','mirrorOwner':'johanne.karbo@geodata.no_geodata','mirrorUrl':'https://services.arcgis.com/2JyTvMWQSnM2Vi8q/arcgis/rest/services/MarinGrenseFlate_under/FeatureServer/20','fetchedOn':'2026-11-01','requestParameters':{'f':'geojson','where':'1=1','outFields':'*','resultOffset':[0,1000,2000],'resultRecordCount':1000,'outSR':25833,'maxAllowableOffset':25,'orderByFields':'OBJECTID ASC'},'responseBatches':batches,'outputFeatures':len(features),'outputBBox':bbox,'outputBytes':args.output.stat().st_size,'outputSha256':hashlib.sha256(args.output.read_bytes()).hexdigest(),'originalVertices':original_vertices,'outputVertices':result_vertices,'topologyRepairs':repaired,'emptyAfterRepair':empty,'processing':'Preserve-topology simplification at 50 metres in EPSG:25833; transform to WGS84, round to 5 decimal places; retain polygon interiors and holes. No heights or inferred boundary lines generated.','license':'NLOD-2.0','licenseEvidence':'ngu-collections-20260607.json'}
Path(__file__).with_name('manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:manifest[k] for k in ['outputFeatures','outputBytes','originalVertices','outputVertices','outputBBox']},ensure_ascii=False))
