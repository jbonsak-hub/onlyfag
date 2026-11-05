// Verify the partitioned directed graphs and waterbody label intervals offline.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/geography/drop-prototype');
const manifestFile=process.env.WATERSHED_MANIFEST||path.join(dir,'regions.json');
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
// These names combine different reaches rather than identify a single river.
// Do not reject punctuation generally: bilingual hydronyms and canal names
// legitimately contain slashes or hyphens.
const collectiveNames=new Set(['vorma-lågen','vorma lågen','glommavassdraget','drammensvassdraget','eio-veig','heddøla-hjartdøla','hæsåna-dikeelva','sagelva-fjellhammarelva','øyåa-nevla','västerdalälven-ljøra','röjdan-løvhaugsåa','stardalselva/votedalselva','ulvedalselva/vågselva','ljøra næra']);
const nameKey=name=>name.toLocaleLowerCase('nb-NO').replace(/\s*([/-])\s*/g,'$1').trim();
const isCollectiveName=name=>{const key=nameKey(name);return [...collectiveNames].some(n=>key===n||key.startsWith(n+' '))||/vassdrag|bekkef?felt|\b(?:sidegren|sideløp|avløp|utløp|inntak)\b|\belver i\b|utløpselv/i.test(name);};
assert.deepEqual(manifest.defaultRegions,['south']);
assert.deepEqual(manifest.regions.map(r=>r.id).sort(),['midtnorge','nordnorge','south']);
function regionFile(region){const url=region.url.split(/[?#]/)[0];return url.startsWith('/')?path.join(root,url):path.resolve(dir,url);}
const allSegments=new Set(),allBasins=new Set(),waterbodies=new Set(),report=[];
for(const region of manifest.regions){
 const filename=regionFile(region),raw=fs.readFileSync(filename,'utf8'),data=JSON.parse(raw),segments=new Map(data.segments.map(s=>[String(s.id),s])),basins=new Map(data.basins.map(b=>[String(b.id),b]));
 assert.deepEqual(data.projection,manifest.projection,'All regions use one fixed projected coordinate frame');assert.equal(data.unitsPerKm,manifest.projection.unitsPerKm);
 const units=manifest.projection.unitsPerKm/1000,west=manifest.projection.west,north=manifest.projection.north;let sourceVertices=0,sourceSegments=0;
 for(const spec of data.source.normalizedSources){const compressed=fs.readFileSync(path.join(root,spec.file));assert.equal(crypto.createHash('sha256').update(compressed).digest('hex'),spec.sha256);const source=JSON.parse(zlib.gunzipSync(compressed));for(const original of source.segments){const shown=segments.get(String(original.id));assert(shown);assert.equal(shown.next,original.next);assert.equal(shown.basin,original.basin);assert.equal(shown.points.length,original.points.length);for(let i=0;i<original.points.length;i++){assert(Math.abs(west+shown.points[i][0]/units-original.points[i][0])<.05,'Easting stays registered with the pinned source');assert(Math.abs(north-shown.points[i][1]/units-original.points[i][1])<.05,'Northing stays registered with the pinned source');sourceVertices++;}sourceSegments++;}for(const original of source.basins){const shown=basins.get(String(original.id));assert.equal(shown.outletSegment,original.outletSegment);assert(Math.abs(west+shown.outlet[0]/units-original.outlet[0])<.05);assert(Math.abs(north-shown.outlet[1]/units-original.outlet[1])<.05);}}
 assert.equal(sourceSegments,segments.size,'Every output segment is traceable to a pinned regional source');
 assert.equal(segments.size,data.segments.length,'Every segment ID is unique within '+region.id);assert.equal(basins.size,data.basins.length);assert(segments.size>0&&basins.size>0);
 if(region.segments!=null)assert.equal(region.segments,segments.size);if(region.basins!=null)assert.equal(region.basins,basins.size);
 for(const id of segments.keys()){assert(!allSegments.has(id),'Regions never duplicate a segment');allSegments.add(id);}
 for(const id of basins.keys()){assert(!allBasins.has(id),'A complete basin belongs to just one region');allBasins.add(id);}
 const terminal=new Map();let routable=0,labelCount=0,lakeCount=0;
 for(const s of segments.values()){
  assert(basins.has(String(s.basin)));assert(s.points.length>=2&&s.points.every(p=>p.length===2&&p.every(Number.isFinite)));
  let current=s;const chain=[],seen=new Set();while(!terminal.has(String(current.id))){const id=String(current.id);assert(!seen.has(id),'No downstream cycle');seen.add(id);chain.push(id);if(current.next==null){terminal.set(id,id);break;}const next=segments.get(String(current.next));assert(next,'Regions contain the complete downstream route');assert.equal(String(next.basin),String(s.basin),'No crossing of drainage divides');assert.deepEqual(current.points.at(-1),next.points[0],'Fixed junction coordinates remain shared');current=next;}
  for(const id of chain)terminal.set(id,terminal.get(String(current.id)));
  if(s.routable!==false){routable++;assert.equal(terminal.get(String(s.id)),String(basins.get(String(s.basin)).outletSegment));}
  let end=0;for(const label of s.labels||[]){const [from,to,name,kind]=label;assert(Number.isFinite(from)&&Number.isFinite(to)&&from>=0&&to<=1&&to>from);assert(from>=end-1e-6,'Waterbody intervals do not overlap');end=to;assert(typeof name==='string'&&name.trim()===name&&name.length>0);assert(['river','lake'].includes(kind));assert(!isCollectiveName(name),'Collective route name must not masquerade as a local waterbody: '+name);waterbodies.add(name.toLocaleLowerCase('nb-NO'));labelCount++;if(kind==='lake')lakeCount++;}
 }
 const starts=new Set();for(const start of data.starts){assert(!starts.has(String(start.id)));starts.add(String(start.id));const s=segments.get(String(start.segment));assert(s&&s.routable!==false);assert.equal(terminal.get(String(s.id)),String(basins.get(String(s.basin)).outletSegment));}
 for(const b of basins.values()){assert(segments.has(String(b.outletSegment)));assert(data.starts.some(s=>String(s.id)===String(b.id)),'Every basin remains keyboard-selectable');}
 assert(labelCount>0,'Region has locally identified waterbodies');assert(lakeCount>0,'Region has identified lake crossings');
 if(region.id==='south'){for(const id of ['002-34','012-1','021-13','062-17','112-19'])assert(basins.has(id));assert(basins.size>=1040);}
 report.push({region:region.id,basins:basins.size,segments:segments.size,routable,labelIntervals:labelCount,lakeIntervals:lakeCount,sourceVertices,bytes:Buffer.byteLength(raw)});
}
for(const name of ['lågen','vorma','glomma','mjøsa','øyeren','randsfjorden','ljøra'])assert(waterbodies.has(name),'Known local waterbody is represented: '+name);
for(const name of ['syltefjordelva/oardujohka','adamselva/áttánjohka','ridelva-riddujohka','nyelv-ođđajohka','skallelva-gállojohka','eatnu guovdageaineatnu'])assert(waterbodies.has(name),'Verified local hydronym is retained: '+name);
assert([...waterbodies].some(name=>/^skas-heigre\s*kanalen$/.test(name)),'The named Skas-Heigre canal is retained');
console.log(JSON.stringify({success:true,regions:report,totalBasins:allBasins.size,totalSegments:allSegments.size,localNames:true,completeRoutes:true}));
