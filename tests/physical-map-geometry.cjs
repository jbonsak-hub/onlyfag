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
  const longitude=x=>x/1000*360-180, latitude=y=>80-y/590*138;
  return [Math.min(...points.map(p=>longitude(p[0]))),Math.max(...points.map(p=>longitude(p[0]))),Math.min(...points.map(p=>latitude(p[1]))),Math.max(...points.map(p=>latitude(p[1])))];
}

test('all four maps keep complete inventories and the appropriate geographic feature types', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(regions).map(([id,r])=>[id,r.states.length])),{
    rivers:49,lakes:33,mountains:24,europeWater:72
  });
  const counts=Object.fromEntries(['river','lake','sea'].map(kind=>[kind,regions.europeWater.states.filter(s=>s.kind===kind).length]));
  assert.deepEqual(counts,{river:29,lake:9,sea:34});
  for(const [id,kind] of [['rivers','river'],['lakes','lake'],['mountains','range']]) {
    assert(regions[id].states.every(state=>state.kind===kind),`${id} contains only ${kind} targets`);
  }
});

test('every target has a unique bilingual name, finite geometry and an on-map hint point', () => {
  for(const [id,region] of Object.entries(regions)) {
    assert.equal(new Set(region.states.map(s=>s.n)).size,region.states.length,`${id}: Norwegian names unique`);
    assert.equal(new Set(region.states.map(s=>s.en)).size,region.states.length,`${id}: English names unique`);
    const [x,y,width,height]=region.viewBox;
    for(const target of region.states) {
      assert(target.n.trim()&&target.en.trim(),`${id}: both languages available`);
      assert(target.d.length>25&&!/NaN|Infinity|undefined/.test(target.d),`${target.n}: valid SVG path`);
      assert(!/[^MLZ0-9.\s,-]/.test(target.d),`${target.n}: expected vector commands only`);
      assert.equal(target.c.length,2,`${target.n}: hint is a point`);
      assert(target.c.every(Number.isFinite),`${target.n}: finite hint`);
      assert(target.c[0]>=x&&target.c[0]<=x+width&&target.c[1]>=y&&target.c[1]<=y+height,`${target.n}: visible hint`);
      for(const shape of paths(target.d)) {
        assert(shape.points.length>=2,`${target.n}: real geographic geometry`);
        for(const p of shape.points)assert(p[0]>=x-.01&&p[0]<=x+width+.01&&p[1]>=y-.01&&p[1]<=y+height+.01,`${target.n}: clipped to map window`);
      }
    }
  }
});

test('complete user-supplied river and lake inventories survive additions and translations', () => {
  // Factual label inventories transcribed from the supplied PDF maps.
  const pdfRivers=['Mackenzie','Missouri','Arkansas','Ohio','Saint Lawrence','Colorado','Mississippi','Rio Grande','Amazon','São Francisco','Paraguay','Paraná','Uruguay','Ob','Yenisei','Lena','Volga','Dnipro','Don','Amur','Yarlung Tsangpo','Huang He (Yellow River)','Yangtze','Indus','Ganges','Brahmaputra','Mekong','Niger','Nile','Blue Nile','White Nile','Congo','Zambezi','Orange','Darling','Murray'];
  const pdfLakes=['Great Bear Lake','Great Slave Lake','Lake Athabasca','Lake Winnipeg','Lake Superior','Lake Michigan','Lake Huron','Lake Erie','Lake Ontario','Great Salt Lake','Lake Nicaragua','Lake Maracaibo','Lake Titicaca','Vänern','Lake Ladoga','Lake Onega','Lake Geneva','Caspian Sea','Aral Sea','Lake Balkhash','Lake Baikal','Qinghai Lake','Lake Van','Dead Sea','Lake Chad','Lake Tana','Lake Turkana','Lake Victoria','Lake Tanganyika','Lake Malawi (Nyasa)','Tonlé Sap','Lake Toba','Lake Eyre'];
  assert.equal(pdfRivers.length,36);
  assert.equal(pdfLakes.length,33);
  for(const name of pdfRivers)find('rivers',name);
  for(const name of pdfLakes)find('lakes',name);
  for(const name of ['Rhine','Danube','Tigris','Euphrates','Orinoco','Yukon'])find('rivers',name);
});

test('world rivers include continuous upper courses and keep separately asked rivers separate', () => {
  const yangtze=geographicBounds(find('rivers','Yangtze'));
  assert(yangtze[0]<91&&yangtze[1]>119&&yangtze[3]>34,'Yangtze includes Tuotuo, Tongtian, Jinsha and Chang Jiang');
  const mekong=geographicBounds(find('rivers','Mekong'));
  assert(mekong[0]<95&&mekong[1]>106&&mekong[3]>32,'Mekong includes its upper Lancang and Za reaches');
  const paraguay=geographicBounds(find('rivers','Paraguay'));
  const parana=geographicBounds(find('rivers','Paraná'));
  assert(paraguay[3]>-15&&paraguay[2]<-27,'Paraguay extends from its northern course to the confluence');
  assert(parana[1]>-51&&parana[2]<-33,'Parana retains its eastern upper and southern lower courses');
  assert.notEqual(find('rivers','Nile').d,find('rivers','White Nile').d,'Nile and White Nile are distinct reaches');
  assert.notEqual(find('rivers','Yarlung Tsangpo').d,find('rivers','Brahmaputra').d,'Tibetan and lower Brahmaputra reaches remain distinct');
});

test('small lakes and narrow straits remain visible targets without losing their outlines', () => {
  for(const name of ['Lake Geneva','Dead Sea','Lake Toba','Lake Tana','Lake Chad']) {
    const target=find('lakes',name);
    assert.equal(target.marker,true,`${name}: visible small-feature marker`);
    assert(target.d.includes('Z'),`${name}: exact lake outline also retained`);
    assert(target.hitWidth>=8,`${name}: generous transparent touch target`);
  }
  for(const name of ['Bosporus Strait','Strait of Dover','Strait of Gibraltar'])assert(find('europeWater',name).marker,`${name}: narrow-strait marker`);
  assert.equal(find('lakes','Lake Victoria').marker,false,'Large lakes retain their full geographic area instead of a small dot');
});

test('hint centers lie on real river courses or inside their filled geographic features', () => {
  for(const [id,region] of Object.entries(regions))for(const target of region.states) {
    const shapes=paths(target.d);
    if(target.kind==='river') {
      assert(!shapes.some(shape=>shape.closed),`${target.n}: open river lines`);
      assert(distanceToPaths(target.c,shapes)<.05,`${target.n}: river hint follows the mapped course`);
    } else {
      assert(shapes.every(shape=>shape.closed),`${target.n}: closed geographic areas`);
      assert(insideEvenOdd(target.c,shapes)||distanceToPaths(target.c,shapes)<.05,`${id}/${target.n}: hint inside real filled area`);
    }
  }
});

test('committed physical geometry matches both offline geographic snapshots', () => {
  for(const file of ['build-world-water-maps.cjs','build-mountain-europe-maps.cjs']) {
    execFileSync(process.execPath,[path.join(__dirname,'../scripts',file),'--check'],{stdio:'pipe'});
  }
});
