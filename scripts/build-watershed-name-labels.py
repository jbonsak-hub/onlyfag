"""Offline water-name intervals from pinned NVE lakes and Vann-Nett river reaches.

annotate(snapshot) mutates projected EPSG:25833 graph segments, adding sorted
labels=[[fromFraction,toFraction,name,'river'|'lake'],...], and returns snapshot.
Fractions use distance along the stored, simplified line, matching the browser.
"""
import gzip, hashlib, json, math, re, sys
from collections import defaultdict
from pathlib import Path
from shapely.geometry import Polygon,LineString,MultiPolygon,Point
from shapely.strtree import STRtree
from shapely import make_valid
sys.dont_write_bytecode=True
DIRECTORY=Path(__file__).resolve().parents[1]/'assets/geography/drop-prototype/sources/names'
_loaded=None
DISTINCT_COMPOUNDS={'heddøla-hjartdøla','hæsåna-dikeelva','sagelva-fjellhammarelva','øyåa-nevla','västerdalälven-ljøra','röjdan-løvhaugsåa','stardalselva/votedalselva','ulvedalselva/vågselva'}
def collective(name):
 key=re.sub(r'\s*([/-])\s*',r'\1',name.lower()).strip()
 return any(key==value or key.startswith(value+' ') for value in DISTINCT_COMPOUNDS) or bool(re.search(r'vassdrag|vorma.?lågen|eio.?veig|bekke?felt|sidebek|sideelv|tilløps|småbek|bekker|hovedløp|^(?:sidegren|sideløp|avløp|utløp|inntak)\b|\belver i\b|utløpselv',name,re.I))
def local_river_name(name):
 if not name:return None
 name=re.split(r'\s+m/\s*',name,flags=re.I)[0].strip()
 # Keep verified alternative-language hydronyms (e.g. Syltefjordelva/Oardujohka).
 # Two different Norwegian rivers joined with / are not a local reach name.
 if '/' in name and not re.search(r'johka|jávri|jævr|ædno|ätno',name,re.I):return None
 if collective(name):return None
 name=re.sub(r'^Øvre del av\s+','',name,flags=re.I)
 if name.lower().startswith('eidselva-telemarkskanalen'):name='Eidselva'
 name=re.split(r'[,()]',name)[0].strip()
 name=re.split(r'\s+(?:fra|mellom|oppstrøms|nedstrøms|ved|øvre|nedre|midtre|utløp|innløp|strekning|utbygd|overføring|anadrom|nedenfor|ovenfor|til evje|dam|inntak)\b',name,flags=re.I)[0].strip()
 name=re.split(r'\s+[-–]\s*',name)[0].strip()
 first=name.split()[0] if name else ''
 if first.lower() in {'glomma','glåma','vorma','lågen','begna','otta','sjoa','otra','sira','vosso','veig','eio','gaula','namsen','numedalslågen','tokke','bjoreio','sima','grana','vikja','bremsa','ljøra'} or re.search(r'(?:elva|elvi|elven|elv|åa|åi|åga|åni|åne|åna|lågen|bekken|bekk|foss|fossen)$',first,re.I):name=first
 if re.search(r'(?:fjorden|vatnet|vannet|sjøen|vatna|tjørnane|vatn\b|vann\b)',name,re.I):return None
 name=name.rstrip(' -–')
 return None if name.lower() in {'elv','elven'} else name or None
def polygon(rings):
 # ArcGIS exteriors and holes use opposite winding. Construct holes directly;
 # repeated symmetric differences are quadratic on large, island-rich lakes.
 rings=[ring for ring in rings if len(ring)>=4]
 if not rings:return None
 areas=[sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(ring,ring[1:])) for ring in rings]
 exterior_sign=areas[max(range(len(areas)),key=lambda i:abs(areas[i]))]>0
 shells=[ring for ring,area in zip(rings,areas) if (area>0)==exterior_sign]
 holes=[ring for ring,area in zip(rings,areas) if (area>0)!=exterior_sign]
 if len(shells)==1:value=Polygon(shells[0],holes)
 else:
  outer=[Polygon(shell) for shell in shells];parts=[]
  for shell,geom in zip(shells,outer):parts.append(Polygon(shell,[hole for hole in holes if geom.covers(Point(hole[0]))]))
  value=MultiPolygon(parts)
 return value if value.is_valid else make_valid(value)
def load():
 global _loaded
 if _loaded is not None:return _loaded
 raw=(DIRECTORY/'waterbody-names.json.gz').read_bytes();manifest=json.loads((DIRECTORY/'manifest.json').read_text(encoding='utf8'));assert hashlib.sha256(raw).hexdigest()==manifest['sourceSha256'],'Water-name source pin mismatch'
 source=json.loads(gzip.decompress(raw));lakes=[];polygons=[]
 for record in source['lakes']:
  geom=polygon(record['rings'])
  if geom is None or geom.is_empty:continue
  lakes.append(record);polygons.append(geom)
  if len(lakes)%5000==0:print('Prepared lake polygons '+str(len(lakes)),flush=True)
 rivers=defaultdict(list)
 for record in source['rivers']:
  name=local_river_name(record['fullName'])
  if name:
   for points in record['paths']:
    if len(points)>=2:rivers[record['route']].append((LineString(points),name,record['waterBodyId']))
 indexed={route:{'rows':rows,'tree':STRtree([row[0] for row in rows]),'buffers':{}} for route,rows in rivers.items()}
 _loaded=(lakes,polygons,STRtree(polygons),indexed,manifest,{})
 return _loaded
def line_intervals(line,geometry):
 cut=line.intersection(geometry);parts=[cut] if cut.geom_type=='LineString' else list(getattr(cut,'geoms',[]));result=[]
 for piece in parts:
  if piece.geom_type!='LineString' or piece.length<.1:continue
  from shapely.geometry import Point
  a=line.project(Point(piece.coords[0]));b=line.project(Point(piece.coords[-1]));a,b=sorted((a,b))
  if b-a>.1:result.append((a,b))
 return result
def annotate(snapshot):
 assert snapshot.get('crs')=='EPSG:25833'
 lakes,polygons,tree,rivers,manifest,lake_buffers=load();stats={'segments':0,'lakeIntervals':0,'localRiverIntervals':0,'unresolvedSegments':0}
 for segment in snapshot['segments']:
  line=LineString(segment['points']);length=line.length
  if length<=0:continue
  fallback=local_river_name(segment.get('name','')) or 'Navnløs elv';candidates=[]
  # Vann-Nett reaches are allowed to match only the exact official ELVIS route.
  # 40m accommodates 25m river display simplification +10m name geometry.
  route=rivers.get(segment.get('route'))
  if route:
   for index in route['tree'].query(line.buffer(40)):
    index=int(index);geom,name,waterbody=route['rows'][index]
    if geom.distance(line)>40:continue
    if index not in route['buffers']:route['buffers'][index]=geom.buffer(40)
    for a,b in line_intervals(line,route['buffers'][index]):candidates.append((a,b,name,'river',1,geom))
  for index in tree.query(line.buffer(20)):
   index=int(index);geom=polygons[index]
   # Small ponds must not acquire a broad 20m halo near an adjacent stream.
   # Limit tolerance to 10% of the lake's equivalent square side, 2..20m.
   if index not in lake_buffers:lake_buffers[index]=geom.buffer(max(2,min(20,.1*math.sqrt(max(0,lakes[index]['areaKm2'])*1e6))))
   for a,b in line_intervals(line,lake_buffers[index]):candidates.append((a,b,lakes[index]['name'],'lake',2,geom))
  stops=sorted({0.,length,*[v for row in candidates for v in row[:2]]});labels=[]
  for a,b in zip(stops,stops[1:]):
   if b-a<.1:continue
   midpoint=(a+b)/2;active=[r for r in candidates if r[0]<=midpoint<=r[1]]
   chosen=max(active,key=lambda row:(row[4],-row[5].distance(line.interpolate(midpoint)))) if active else None
   name,kind=(chosen[2],chosen[3]) if chosen else (fallback,'river')
   first=round(a/length,8);last=round(b/length,8)
   if labels and labels[-1][2:]==[name,kind]:labels[-1][1]=last
   else:labels.append([first,last,name,kind])
  if not labels:labels=[[0,1,fallback,'river']]
  for index in range(1,len(labels)):labels[index][0]=labels[index-1][1]
  labels[0][0]=0;labels[-1][1]=1;segment['labels']=labels;stats['segments']+=1
  if stats['segments']%2000==0:print('Annotated river segments '+str(stats['segments']),flush=True)
  stats['lakeIntervals']+=sum(r[3]=='lake' for r in labels);stats['localRiverIntervals']+=sum(r[3]=='river' and r[2]!='Navnløs elv' for r in labels);stats['unresolvedSegments']+=any(r[2]=='Navnløs elv' for r in labels)
 snapshot['nameSource']={'lakeSource':manifest['lakeService'],'riverSource':manifest['riverService'],'sourceSha256':manifest['sourceSha256'],'lakeGeometryToleranceM':10,'lakeBoundaryToleranceM':20,'smallLakeToleranceRule':'max(2,min(20,0.1*sqrt(area_m2)))','riverMatchToleranceM':40,'statistics':stats}
 print('Water names '+json.dumps(stats),flush=True)
 return snapshot
