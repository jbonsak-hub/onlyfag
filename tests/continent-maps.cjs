const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const {regions}=require('../assets/geography/continent-maps.json');

test('six selectable maps preserve 197 countries and add three labeled territories',()=>{
  assert.deepEqual(Object.fromEntries(Object.entries(regions).map(([key,r])=>[key,r.states.length])),{europe:47,asia:47,northAmerica:23,southAmerica:13,africa:55,oceania:15});
  const all=Object.values(regions).flatMap(r=>r.states);
  assert.equal(all.length,200);
  const names=all.filter(s=>!s.territory).map(s=>s.n);
  assert.equal(names.length,197);
  assert.equal(new Set(names).size,197);
  for(const name of ['Kosovo','Palestina','Taiwan','Vatikanstaten'])assert(names.includes(name));
  assert(!names.includes('Antarktis'));
  for(const name of ['Armenia','Aserbajdsjan','Georgia'])assert(regions.asia.states.some(s=>s.n===name));
  assert.equal(new Set(all.map(s=>s.n)).size,200);
  for(const [key,name] of [['southAmerica','Fransk Guyana (fransk)'],['oceania','Ny-Caledonia (fransk)']]){
    const territory=regions[key].states.find(s=>s.n===name);
    assert.equal(territory.territory,true);
    assert.equal(territory.parent,'Frankrike');
    assert(territory.d.length>100,'Territories need real coastal outlines');
  }
  assert.equal(regions.africa.states.find(s=>s.n==='Vest-Sahara (omstridt)').disputed,true);
});

test('all countries have visible finite targets and tiny states receive circles',()=>{
  for(const region of Object.values(regions))for(const state of region.states){
    assert(state.d.length>0,state.n);
    assert(!/NaN|Infinity|undefined/.test(state.d),state.n);
    assert(state.c.every(Number.isFinite),state.n);
    assert(state.c[0]>0&&state.c[0]<region.viewBox[2],state.n);
    assert(state.c[1]>0&&state.c[1]<region.viewBox[3],state.n);
  }
  for(const name of ['Andorra','Liechtenstein','Luxemburg','Malta','Monaco','San Marino','Vatikanstaten'])assert(regions.europe.states.find(s=>s.n===name).marker,name);
  for(const name of ['Nauru','Palau','Samoa','Tonga','Tuvalu'])assert(regions.oceania.states.find(s=>s.n===name).marker,name);
});

function ringArea(ring){return Math.abs(ring.reduce((a,p,i)=>{const q=ring[(i+1)%ring.length];return a+p[0]*q[1]-q[0]*p[1]},0)/2);}
function pathRings(d){return d.split('Z').filter(Boolean).map(r=>r.slice(1).split('L').map(p=>p.split(' ').map(Number)));}
function pointInRing(point,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
test('Western Sahara is one complete labeled territory with no de-facto cutout',()=>{
  const territory=regions.africa.states.find(s=>s.n==='Vest-Sahara (omstridt)');
  const rings=pathRings(territory.d);
  assert.equal(rings.length,1,'No fragmented berm strip or internal holes');
  assert(ringArea(rings[0])>1400,'Full territorial area, not the small source remainder');
  assert(pointInRing(territory.c,rings[0]),'Hint stays inside complete territory');
  const morocco=pathRings(regions.africa.states.find(s=>s.n==='Marokko').d);
  assert(!morocco.some(r=>pointInRing(territory.c,r)),'Morocco must not swallow Western Sahara');
  assert.equal(regions.africa.territory,'','No old neutral berm fragments overlaid');
});
test('Europe omits the clipped Greenland fragment north of Iceland',()=>{
  const contextVertices=pathRings(regions.europe.context).flat();
  assert(contextVertices.every(p=>p[1]>250),'No stray northern contextual polygons');
});
test('Pacific islands remain together and distant continents do not stretch across the ocean',()=>{
  const fiji=regions.oceania.states.find(s=>s.n==='Fiji');
  const vertices=pathRings(fiji.d).flat();
  assert(Math.max(...vertices.map(p=>p[0]))-Math.min(...vertices.map(p=>p[0]))<70,'Fiji must not cross a projection seam');
  const samoa=regions.oceania.states.find(s=>s.n==='Samoa');
  assert(samoa.c[0]>fiji.c[0],'Samoa stays east of Fiji across the date line');
  const contextArea=pathRings(regions.southAmerica.context).reduce((a,r)=>a+ringArea(r),0);
  assert(contextArea<30000,'No distant-continent ribbons across South America');
});

test('committed continent geometry matches the offline source build',()=>{
  execFileSync(process.execPath,[path.join(__dirname,'../scripts/build-continent-map-assets.cjs'),'--check'],{stdio:'pipe'});
});
