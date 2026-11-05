"""Fetch official NVE lakes and local Vann-Nett river-reach names; raw data stays in work/."""
import argparse, concurrent.futures, gzip, hashlib, json, re, sys, urllib.parse, urllib.request, time
from pathlib import Path
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/geography/drop-prototype/sources/names'
LAKES='https://kart.nve.no/enterprise/rest/services/Innsjodatabase2/MapServer/5'
RIVERS='https://kart2.miljodirektoratet.no/arcgis/rest/services/vann_nett/Vannforekomster/MapServer/0'
def encoded(d):return (json.dumps(d,ensure_ascii=False,separators=(',',':'),sort_keys=True)+'\n').encode()
def get(url):
 for retry in range(4):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'OnlyFag-water-name-source/1.0'}),timeout=120) as r: raw=r.read()
   d=json.loads(raw)
   if d.get('error'):raise ValueError(d['error'])
   return raw,d
  except Exception:
   if retry==3:raise
   time.sleep(2**retry)
def query(service,**params):return service+'/query?'+urllib.parse.urlencode({'f':'json',**params})
def fetch_group(kind,service,where,fields,directory):
 directory.mkdir(parents=True,exist_ok=True)
 selection=query(service,where=where,returnIdsOnly='true');previous_file=directory/f'{kind}-index.json';previous=json.loads(previous_file.read_text(encoding='utf8')) if previous_file.exists() else None
 if previous and previous.get('selection')==selection:ids=previous['ids']
 else:
  previous=None
  _,d=get(selection);ids=sorted(d['objectIds'])
 previous_records={r['file']:r for r in previous.get('records',[])} if previous else {}
 print(kind,len(ids),'objects',flush=True)
 records=[];features=[]
 def chunk(pair):
  index,group=pair;file=directory/f'{kind}-{index:04}.json.gz';url=query(service,objectIds=','.join(map(str,group)),outFields=fields,returnGeometry='true',outSR='25833',geometryPrecision='2',maxAllowableOffset='10')
  if file.exists() and file.name in previous_records:
   raw=gzip.decompress(file.read_bytes());assert hashlib.sha256(raw).hexdigest()==previous_records[file.name]['sha256'];v=json.loads(raw)
  else:raw,v=get(url);file.write_bytes(gzip.compress(raw,mtime=0))
  assert not v.get('exceededTransferLimit')
  actual=sorted(f['attributes'].get('OBJECTID',f['attributes'].get('objectid')) for f in v['features']);assert actual==group
  print(kind,index+1,'/',(len(ids)+299)//300,flush=True)
  return index,v['features'],{'file':file.name,'url':url,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'objects':len(group)}
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  for _,rows,record in sorted(pool.map(chunk,enumerate([ids[i:i+300] for i in range(0,len(ids),300)]))):features.extend(rows);records.append(record)
 (directory/f'{kind}-index.json').write_bytes(encoded({'selection':selection,'ids':ids,'records':records}))
 return features,{'selection':selection,'count':len(ids),'records':records}
def snapshots():return sorted((ROOT/'assets/geography/drop-prototype/sources').glob('**/elvis-directed-network.json.gz'))
def collective(name):
 import importlib.util
 if not hasattr(collective,'test'):
  spec=importlib.util.spec_from_file_location('name_labels',ROOT/'scripts/build-watershed-name-labels.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);collective.test=module.collective
 return collective.test(name)
def main():
 parser=argparse.ArgumentParser();parser.add_argument('directory',type=Path);parser.add_argument('--lakes-only',action='store_true');args=parser.parse_args();d=args.directory
 lakes,lake_index=fetch_group('lakes-all',LAKES,"navn IS NOT NULL AND navn <> ''",'objectid,vatnlnr,navn,areal_km2',d)
 (d/'lakes-features.json.gz').write_bytes(gzip.compress(encoded(lakes),mtime=0))
 if args.lakes_only:return
 route_ids=set()
 for file in snapshots():
  graph=json.loads(gzip.decompress(file.read_bytes()))
  route_ids.update(s['route'] for s in graph['segments'] if collective(s.get('name','')))
 print('Collective routes',len(route_ids),flush=True);rivers=[];indexes=[]
 for i in range(0,len(route_ids),100):
  routes=sorted(route_ids)[i:i+100];where='ElvID IN ('+','.join("'"+r+"'" for r in routes)+')';rows,index=fetch_group('rivers-v2-'+str(i//100),RIVERS,where,'OBJECTID,Name,WaterBodyID,ElvID',d);rivers.extend(rows);indexes.append(index)
 lake_rows=[{'id':f['attributes']['vatnlnr'],'name':f['attributes']['navn'],'areaKm2':f['attributes']['areal_km2'],'rings':f['geometry']['rings']} for f in lakes]
 river_rows=[{'id':f['attributes']['OBJECTID'],'route':f['attributes']['ElvID'],'fullName':f['attributes']['Name'],'waterBodyId':f['attributes']['WaterBodyID'],'paths':f['geometry']['paths']} for f in rivers]
 OUT.mkdir(parents=True,exist_ok=True);raw=encoded({'crs':'EPSG:25833','lakes':lake_rows,'rivers':river_rows});compressed=gzip.compress(raw,mtime=0);(OUT/'waterbody-names.json.gz').write_bytes(compressed)
 (OUT/'manifest.json').write_bytes(encoded({'sourceSha256':hashlib.sha256(compressed).hexdigest(),'sourceBytes':len(compressed),'lakeService':LAKES,'riverService':RIVERS,'lakeSelection':lake_index,'riverSelections':indexes,'routeIds':sorted(route_ids),'lakeCount':len(lake_rows),'riverPieces':len(river_rows),'geometryToleranceM':10}))
 print(json.dumps({'bytes':len(compressed),'lakes':len(lake_rows),'rivers':len(river_rows),'sha256':hashlib.sha256(compressed).hexdigest()}),flush=True)
if __name__=='__main__':main()
