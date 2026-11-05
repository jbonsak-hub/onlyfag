// Check coverage and the exact projected source graph, including every small
// coastal basin. This deliberately does not infer flow from visual proximity.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/geography/drop-prototype'),data=JSON.parse(fs.readFileSync(path.join(dir,'data.json'),'utf8'));
const byId=new Map(data.segments.map(s=>[s.id,s])),basins=new Map(data.basins.map(b=>[b.id,b])),calibrations=new Map(data.source.outletCalibrations.map(c=>[c.basin,c]));
assert.equal(byId.size,data.segments.length);assert.equal(basins.size,data.basins.length);assert(basins.size>=900,'The extension includes the smaller southern/western coastal networks');
assert.deepEqual([...new Set(data.basins.map(b=>b.region))].sort(),['Sørlandet','Vestlandet','Østlandet'].sort());
for(const id of ['002-34','006-11','008-1','012-1','015-18','016-35','021-13','022-48','025-35','026-22','027-32','036-17','050-27','062-17','072-30','073-28','076-65','084-66','088-25','103-29','104-37','109-70','112-19'])assert(basins.has(id),'Coverage retains the expected main network '+id);
const [west,south,east,north]=data.source.projectedBounds,units=data.unitsPerKm/1000;
assert(west<0&&east>350000&&south<6500000&&north>6980000,'The extent covers the western coast, southern tip, eastern networks and northern Møre');
assert.equal(data.source.crs,'EPSG:25833');assert.equal(data.yUp,false);assert.equal(data.source.normalizedSources.length,2);
let sourceCount=0,vertices=0;
for(const spec of data.source.normalizedSources){
  const raw=fs.readFileSync(path.join(root,spec.file));assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),spec.sha256,'Source file matches its recorded pin');
  const source=JSON.parse(zlib.gunzipSync(raw));assert.equal(source.segments.length,spec.segments);assert.equal(source.basins.length,spec.basins);
  for(const s of source.segments){
    const shown=byId.get(s.id);assert(shown,'All retained source segments are present');assert.equal(shown.next,s.next);assert.equal(shown.basin,s.basin);assert.equal(shown.routable,s.routable);assert.equal(shown.lengthKm,s.lengthKm);assert.equal(shown.points.length,s.points.length);
    for(let i=0;i<s.points.length;i++){const p=shown.points[i];assert(p.every(Number.isFinite));assert(Math.abs(west+p[0]/units-s.points[i][0])<.05);assert(Math.abs(north-p[1]/units-s.points[i][1])<.05);vertices++;}
    sourceCount++;
  }
  for(const b of source.basins){const shown=basins.get(b.id);assert.equal(shown.outletSegment,b.outletSegment);assert(Math.abs(west+shown.outlet[0]/units-b.outlet[0])<.05);assert(Math.abs(north-shown.outlet[1]/units-b.outlet[1])<.05);assert.equal(calibrations.get(b.id).mainRoute,b.sourceMainRoute);}
}
assert.equal(sourceCount,byId.size);
const terminal=new Map();let routable=0;
for(const segment of data.segments){
  let s=segment;const trail=[],seen=new Set();while(!terminal.has(s.id)){assert(!seen.has(s.id),'No downstream cycle');seen.add(s.id);trail.push(s.id);if(s.next===null){terminal.set(s.id,s.id);break;}const next=byId.get(s.next);assert(next);assert.equal(next.basin,s.basin,'No drainage-divide crossing');assert.deepEqual(s.points.at(-1),next.points[0],'Junction coordinates stay exactly shared');s=next;}
  for(const id of trail)terminal.set(id,terminal.get(s.id));
  if(segment.routable!==false){routable++;assert.equal(terminal.get(segment.id),basins.get(segment.basin).outletSegment);}
}
assert(routable/data.segments.length>.97,'Most retained rivers have a verified downstream route');
assert.equal(new Set(data.starts.map(s=>s.id)).size,data.starts.length);for(const start of data.starts){assert(byId.get(start.segment).routable!==false);assert.equal(terminal.get(start.segment),basins.get(byId.get(start.segment).basin).outletSegment);}
for(const basin of basins.values())assert(data.starts.some(s=>s.id===basin.id),'Each represented basin is available through the keyboard picker');
const mouths=[...calibrations.values()].map(c=>c.outletLongitudeLatitude);assert(mouths.some(p=>p[0]<5));assert(mouths.some(p=>p[1]<58.1));assert(mouths.some(p=>p[1]>62.95));
const bytes=fs.statSync(path.join(dir,'data.json')).size;assert(bytes<12000000);
console.log(JSON.stringify({success:true,basins:basins.size,segments:byId.size,vertices,routable,bytes,regions:[...new Set(data.basins.map(b=>b.region))],allSourceGeometryPreserved:true,allPresetsReachDeclaredOutlet:true}));
