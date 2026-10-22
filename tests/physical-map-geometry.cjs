const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const water = require('../assets/geography/physical-maps/world-water.json');
const mountainEurope = require('../assets/geography/physical-maps/mountain-europe.json');
const regions = {...water.regions, ...mountainEurope.regions};

// Parse the emitted SVG geometry independently of either geographic builder.
function paths(d) {
  return [...d.matchAll(/M([^M]+)/g)].map(match => ({
    closed: /Z/.test(match[1]),
    points: match[1].replace(/Z/g, '').split('L').map(pair => {
      const numbers = pair.trim().split(/[ ,]+/).map(Number);
      assert.equal(numbers.length, 2, 'Each SVG vertex has two coordinates');
      assert(numbers.every(Number.isFinite), 'SVG vertices are finite');
      return numbers;
    })
  }));
}
function distanceToSegment(p, a, b) {
  const dx=b[0]-a[0], dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
}
function distanceToPaths(point, shapes) {
  let distance=Infinity;
  for(const shape of shapes) {
    for(let i=1;i<shape.points.length;i++) distance=Math.min(distance,distanceToSegment(point,shape.points[i-1],shape.points[i]));
    if(shape.closed)distance=Math.min(distance,distanceToSegment(point,shape.points.at(-1),shape.points[0]));
  }
  return distance;
}
function insideEvenOdd(point, shapes) {
  let inside=false;
  for(const shape of shapes) {
    if(!shape.closed)continue;
    for(let i=0,j=shape.points.length-1;i<shape.points.length;j=i++) {
      const a=shape.points[j],b=shape.points[i];
      if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    }
  }
  return inside;
}
function find(region, english) {
  const target=regions[region].states.find(state=>state.en===english);
  assert(target,`${region}: ${english} is present`);
  return target;
}
function geographicBounds(target) {
  const points=paths(target.d).flatMap(shape=>shape.points);
  const longitude=x=>x/1000*360-180, latitude=y=>84-y/540*154;
  return [Math.min(...points.map(p=>longitude(p[0]))),Math.max(...points.map(p=>longitude(p[0]))),Math.min(...points.map(p=>latitude(p[1]))),Math.max(...points.map(p=>latitude(p[1])))];
}


test('three world maps include the revised inventories and water groups',()=>{
 assert.deepEqual(Object.fromEntries(Object.entries(regions).map(([id,r])=>[id,r.states.length])),{rivers:49,lakes:119,mountains:34});
 assert.equal(regions.lakes.states.filter(s=>s.group==='lakes').length,33);
 assert(regions.lakes.states.filter(s=>s.group==='seas').length>=30);
 assert(regions.lakes.states.filter(s=>s.group==='gulfsStraits').length>=30);
 assert.equal(regions.mountains.states.filter(s=>s.kind==='plateau').length,7);
 assert.equal(regions.mountains.states.filter(s=>s.kind==='range').length,27);
 for(const [id,region]of Object.entries(regions)){
  assert.equal(new Set(region.states.map(s=>s.n)).size,region.states.length,id+' Norwegian names unique');
  assert.equal(new Set(region.states.map(s=>s.en)).size,region.states.length,id+' English names unique');
  for(const t of region.states){assert(t.n&&t.en);assert(!/NaN|Infinity/.test(t.d));assert(t.c.every(Number.isFinite));for(const shape of paths(t.d))for(const [x,y]of shape.points)assert(x>=-.01&&x<=1000.01&&y>=-.01&&y<=540.01,t.n+' within map');}
 }
});
test('requested river corrections preserve one continuous Congo and only the Canadian Mackenzie',()=>{
 const bounds=geographicBounds(find('rivers','Mackenzie'));assert(bounds[1]<-110&&bounds[2]>60,'Mackenzie has no Australian segment');
 const congo=find('rivers','Congo');assert.equal(paths(congo.d).length,1);const b=geographicBounds(congo);assert(b[0]<14&&b[1]>26&&b[2]<-11&&b[3]>0,'full Congo-Lualaba main stem');
 for(const en of ['Glomma','Thames','Po','Elbe'])find('rivers',en);
 for(const en of ['Yarlung Tsangpo','Darling','Arkansas','Columbia'])assert(!regions.rivers.states.some(s=>s.en===en));
 const yangtze=geographicBounds(find('rivers','Yangtze'));assert(yangtze[0]<91&&yangtze[1]>119&&yangtze[3]>34);
 const mekong=geographicBounds(find('rivers','Mekong'));assert(mekong[0]<95&&mekong[1]>106&&mekong[3]>32);
});
test('requested mountain ranges and differently coloured highlands are included',()=>{
 for(const name of ['Kunlun Mountains','Carpathian Mountains','Apennines','Dinaric Alps','Dolomites'])assert.equal(find('mountains',name).kind,'range');
 for(const name of ['Tibetan Plateau','Deccan Plateau','Iranian Plateau','Altiplano','Ethiopian Highlands','Mongolian Plateau','Brazilian Highlands'])assert.equal(find('mountains',name).kind,'plateau');
 for(const name of ['Rwenzori Mountains','MacDonnell Ranges'])assert(!regions.mountains.states.some(s=>s.en===name));
 const dolomites=geographicBounds(find('mountains','Dolomites'));assert(dolomites[0]>11&&dolomites[1]<13&&dolomites[2]>46&&dolomites[3]<47);
});
test('water categories cover requested lakes, oceans and straits without duplicate Pacific or Caspian',()=>{
 assert.equal(find('lakes','Lake Superior').n,'Superior');
 for(const en of ['Lake Mjøsa','Lake Garda'])assert.equal(find('lakes',en).group,'lakes');
 for(const en of ['Lake Tana','Lake Van','Bristol Channel','St. George’s Channel','North Channel'])assert(!regions.lakes.states.some(s=>s.en===en));
 assert.equal(find('lakes','Black Sea').group,'seas');assert.equal(find('lakes','Caspian Sea').group,'lakes');
 for(const en of ['Skagerrak','Kattegat','Red Sea','Indian Ocean','Atlantic Ocean','Pacific Ocean','Arctic Ocean','Caribbean Sea','Gulf of Mexico','Sargasso Sea','Hudson Bay','Baffin Bay','Sea of Japan','Yellow Sea','East China Sea','South China Sea','Bay of Bengal','Andaman Sea','Gulf of Thailand','Arabian Sea','Tasman Sea','Coral Sea','Southern Ocean','Gulf of California','Persian Gulf','Strait of Hormuz','Gulf of Oman','Gulf of Aden','Labrador Sea','Mozambique Channel','Gulf of Guinea','Strait of Gibraltar','Bering Strait','Strait of Malacca','Bosporus Strait','Bab el Mandeb','Strait of Magellan'])find('lakes',en);
 assert.equal(find('lakes','Southern Ocean').c[1]>500,true,'Southern Ocean south of 60 degrees is visible');
});
test('hint centers lie on actual river courses or inside filled geographic features',()=>{
 for(const [id,region]of Object.entries(regions))for(const t of region.states){const shapes=paths(t.d);if(t.kind==='river')assert(distanceToPaths(t.c,shapes)<.05,t.n);else assert(insideEvenOdd(t.c,shapes)||distanceToPaths(t.c,shapes)<.05,id+'/'+t.n);}
});
test('tiny lakes and straits retain real outlines and visible markers',()=>{
 for(const name of ['Lake Mjøsa','Lake Garda','Lake Geneva','Dead Sea','Lake Toba']){const t=find('lakes',name);assert(t.marker,name);assert(t.d.includes('Z'));}
 for(const name of ['Bosporus Strait','Strait of Hormuz','Bering Strait'])assert(find('lakes',name).marker);
});
test('both physical map builders reproduce the committed offline geometry',()=>{
 for(const file of ['build-world-water-maps.cjs','build-mountain-europe-maps.cjs'])execFileSync(process.execPath,[path.join(__dirname,'../scripts',file),'--check'],{stdio:'pipe'});
});

test('new named marine regions and all former catalogue holes belong to quiz targets',()=>{
 const map=regions.lakes,added=map.coverage.added;assert.equal(added.length,12);for(const t of added)assert(map.states.some(s=>s.n===t.n&&s.en===t.en));
 const parents=Object.fromEntries(map.coverage.assignments.map(a=>[a.source,a.target]));for(const [name,parent]of Object.entries({'Bristol Channel':'Celtic Sea','North Channel':'Irish Sea','James Bay':'Hudson Bay','Hudson Strait':'Hudson Bay','Bo Hai':'Yellow Sea','Laccadive Sea':'Indian Ocean','Great Australian Bight':'Indian Ocean','Gulf of Tonkin':'South China Sea','Bali Sea':'Java Sea','Yangtze River':'East China Sea','Savu Sea':'Indian Ocean','The North Western Passages':'Arctic Ocean'}))assert.equal(parents[name],parent);
 for(const assignment of map.coverage.assignments)assert(map.states.some(s=>s.en===assignment.target),'Known parent '+assignment.target);
 assert(map.extraLand.length>0,'Antarctica is land at the southern edge, not ocean catchment');
});

test('the complete sea selection covers an independent 21,600-point ocean reference',()=>{
 const reference=require('./fixtures/marine-water-reference.json'),bits=Buffer.from(reference.waterBits,'base64'),seas=regions.lakes.states.filter(s=>s.kind==='sea').map(s=>paths(s.d));let checked=0;assert(reference.waterCount>10000);
 for(let ix=0;ix<reference.columns;ix++)for(let iy=0;iy<reference.rows;iy++){const i=ix*reference.rows+iy;if(!(bits[i>>3]&(1<<(i&7))))continue;const p=[reference.offset+ix*reference.step,reference.offset+iy*reference.step];assert(seas.some(shapes=>insideEvenOdd(p,shapes)),'Unassigned ocean position '+p);checked++;}
 assert.equal(checked,reference.waterCount);
});

test('marine coastal repair never labels deep inland lakes as ocean',()=>{
 const seas=regions.lakes.states.filter(s=>s.kind==='sea').map(s=>paths(s.d));for(const en of ['Lake Baikal','Lake Victoria','Lake Eyre','Great Slave Lake'])assert(!seas.some(shapes=>insideEvenOdd(find('lakes',en).c,shapes)),en+' stays outside ocean catchments');
});
