const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>JSON.parse(fs.readFileSync(path.join(root,'assets/geography',file),'utf8'));
const maps=read('continent-maps.json').regions,capitals=read('region-capitals.json').regions,relief=read('region-relief.json').regions,geometry=require('../assets/geography/statle-label-layout.js');
const expected={europe:47,asia:47,northAmerica:23,southAmerica:13,africa:55,oceania:15};
function project(lon,lat,f){while(lon-f.center[0]>180)lon-=360;while(lon-f.center[0]<-180)lon+=360;const rad=Math.PI/180,lambda=(lon-f.center[0])*rad,phi=lat*rad,phi0=f.center[1]*rad,k=Math.sqrt(2/(1+Math.sin(phi0)*Math.sin(phi)+Math.cos(phi0)*Math.cos(phi)*Math.cos(lambda)));const raw=[k*Math.cos(phi)*Math.sin(lambda),-k*(Math.cos(phi0)*Math.sin(phi)-Math.sin(phi0)*Math.cos(phi)*Math.cos(lambda))];return[f.offsetX+(raw[0]-f.left)*f.scale,f.offsetY+(raw[1]-f.top)*f.scale];}
let total=0;
for(const [key,map]of Object.entries(maps)){
 const data=capitals[key].capitals;assert.equal(map.states.length,expected[key]);assert.deepEqual(Object.keys(data),map.states.map(s=>s.n));
 for(const state of map.states){
  const c=data[state.n];assert.ok(c.name&&c.en&&c.p.length===2);assert.ok(c.lat>=-90&&c.lat<=90&&c.lon>=-180&&c.lon<=180);
  const expectedPoint=project(c.lon,c.lat,relief[key].projection.fit);
  assert.ok(Math.hypot(c.p[0]-expectedPoint[0],c.p[1]-expectedPoint[1])<.001,state.n+' shares the exact country/terrain projection');
  assert.ok(c.p[0]>=0&&c.p[0]<=900&&c.p[1]>=0&&c.p[1]<=650,state.n+' capital remains within its regional viewport');
  const rings=geometry.parsePath(state.d),inside=rings.some(r=>geometry.contains(c.p,r));assert.equal(c.outsideGeometry,!inside);assert.equal(c.marker,!!state.marker);
  if(!inside&&!state.marker){const distance=Math.min(...rings.map(r=>Math.abs(geometry.distance(c.p,r))));assert.ok(distance<1,state.n+' coastal capital only differs by the retained outline simplification');}
  total++;
 }
}
assert.equal(total,200);
assert.equal(capitals.africa.capitals['Ekvatorial-Guinea'].name,'Ciudad de la Paz');
assert.equal(capitals.africa.capitals.Seychellene.en,'Victoria');
assert.equal(capitals.asia.capitals.Indonesia.name,'Jakarta');assert.equal(capitals.asia.capitals.Palestina.name,'Ramallah');
assert.equal(capitals.southAmerica.capitals['Fransk Guyana (fransk)'].name,'Cayenne');assert.equal(capitals.africa.capitals['Vest-Sahara (omstridt)'].name,'El Aaiún');assert.equal(capitals.oceania.capitals['Ny-Caledonia (fransk)'].name,'Nouméa');
assert.equal(capitals.oceania.capitals.Palau.name,'Ngerulmud');assert.equal(capitals.oceania.capitals.Nauru.name,'Yaren');
console.log('PASS all 200 capital identities, exact projections, coverage metadata and current/territory conventions');
