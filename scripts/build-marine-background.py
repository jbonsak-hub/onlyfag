# Local, reproducible background for the marine limit teaching map. No network calls.
from pathlib import Path
import json,hashlib
from shapely.geometry import shape,box,mapping
from shapely import make_valid
root=Path(__file__).resolve().parents[1];geo=root/'assets/geography'
line=next(l for l in (geo/'country-globe.js').read_text().splitlines() if l.startswith('  const world='))
features=json.loads(line[line.index('['):line.rindex(']')+1])
background=[]
for f in features:
 if f['properties']['name'] in ['Sweden','Finland','Russia','Denmark']:
  geometry=f['geometry']
  if f['properties']['name']=='Russia':
   # Unwrap the antimeridian before planar clipping; keep Chukotka away from Norway.
   def unwrap(c):
    if isinstance(c[0],(int,float)):return [c[0]+360 if c[0]<-100 else c[0],c[1]]
    return [unwrap(v) for v in c]
   geometry={**geometry,'coordinates':unwrap(geometry['coordinates'])}
  g=make_valid(shape(geometry)).intersection(box(0,54,36,75))
  background.append({'type':'Feature','properties':{'name':f['properties']['name']},'geometry':mapping(g)})
centres=json.loads((geo/'municipality-centres.json').read_text())
places={}
for region in centres['regions'].values():
 for municipality,c in region['centres'].items():
  if c.get('lon') and c.get('lat'):
   places[c.get('code',municipality)]={'name':municipality,'centreName':c['name'],'lon':c['lon'],'lat':c['lat']}
output={'source':'Natural Earth, public domain; local municipality-centres.json (Kartverket SSR and Wikidata)','features':background,'places':sorted(places.values(),key=lambda c:c['name'])}
(geo/'marine-limit/background.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')))
print(len(background),'neighbour countries;',len(places),'municipality centres')
