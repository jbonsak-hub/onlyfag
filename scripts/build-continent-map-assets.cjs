// Dependency-free, offline build from the same Natural Earth snapshot as Finn land.
// See docs/continent-map-sources.md for classification and projection decisions.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/geography/core.js'), 'utf8');
function declaration(name) {
  const start = source.search(new RegExp('const ' + name + '\\s*='));
  if (start < 0) throw Error('Missing local map source: ' + name);
  let quote = null, escaped = false;
  for (let i = start; i < source.length; i++) {
    const c = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === ';') return source.slice(start, i + 1).replace(/^const/, 'var');
  }
  throw Error('Unterminated map source: ' + name);
}
const box = {atob: s => Buffer.from(s, 'base64').toString('binary')};
vm.createContext(box);
for (const name of ['COUNTRY_MAP_ALL', 'COUNTRY_MAP_REGION_COUNTRIES', 'COUNTRY_MAP_FEATURE', 'COUNTRY_MAP_POINTS', 'COUNTRY_MAP_FILL_B64', 'COUNTRY_MAP_FILL_NAMES']) vm.runInContext(declaration(name), box);
vm.runInContext(source.slice(source.indexOf('function countryMapDecodeCompactPolygon('), source.indexOf('function countryMapLandData(')), box);
const world = vm.runInContext('countryMapDecodeCompactPolygon(COUNTRY_MAP_FILL_B64, COUNTRY_MAP_FILL_NAMES)', box);
const featureByName = new Map(world.features.map(f => [f.properties.name, f]));
const definitions = {
  europe: {title:'Europa', source:'europe', center:[18, 53], crop:[-26, 54, 33, 72.5]},
  asia: {title:'Asia', source:'asia', center:[95, 29], crop:[25, 151, -11.5, 62], extra:['Armenia','Aserbajdsjan','Georgia']},
  northAmerica: {title:'Nord- og Mellom-Amerika', source:'northamerica', center:[-103, 39], crop:[-170, -50, 7, 74]},
  southAmerica: {title:'Sør-Amerika', source:'southamerica', center:[-60, -17], crop:[-83, -33, -56.5, 13]},
  africa: {title:'Afrika', source:'africa', center:[20, 0], crop:[-26, 62, -36, 38]},
  oceania: {title:'Oseania', source:'oceania', center:[163, -19], crop:[110, 204, -49, 18]}
};
const extras = {Somalia:['Somaliland'], Kypros:['N. Cyprus']};
const radians = Math.PI / 180;
function normalize(lon, center) { while (lon - center > 180) lon -= 360; while (lon - center < -180) lon += 360; return lon; }
function polygons(geometry) { return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates; }
// Sutherland-Hodgman clipping keeps all points within the geographic window.
function clipRing(input, bounds) {
  const [west,east,south,north] = bounds;
  let ring = input.slice();
  const edges = [
    [p=>p[0]>=west, (a,b)=>[west,a[1]+(b[1]-a[1])*(west-a[0])/(b[0]-a[0])]],
    [p=>p[0]<=east, (a,b)=>[east,a[1]+(b[1]-a[1])*(east-a[0])/(b[0]-a[0])]],
    [p=>p[1]>=south, (a,b)=>[a[0]+(b[0]-a[0])*(south-a[1])/(b[1]-a[1]),south]],
    [p=>p[1]<=north, (a,b)=>[a[0]+(b[0]-a[0])*(north-a[1])/(b[1]-a[1]),north]]
  ];
  for (const [inside, intersect] of edges) {
    if (!ring.length) break;
    const output = [];
    let previous = ring[ring.length-1], previousInside = inside(previous);
    for (const current of ring) {
      const currentInside = inside(current);
      if (currentInside !== previousInside) output.push(intersect(previous,current));
      if (currentInside) output.push(current);
      previous = current; previousInside = currentInside;
    }
    ring = output;
  }
  return ring.length >= 3 ? ring : [];
}
// Lambert azimuthal equal-area: curved parallels, no Mercator enlargement of
// northern countries, and a continuous Pacific view across the date line.
function project(lon, lat, center) {
  const lambda = (normalize(lon,center[0])-center[0])*radians;
  const phi = lat*radians, phi0 = center[1]*radians;
  const k = Math.sqrt(2/(1+Math.sin(phi0)*Math.sin(phi)+Math.cos(phi0)*Math.cos(phi)*Math.cos(lambda)));
  return [k*Math.cos(phi)*Math.sin(lambda), -k*(Math.cos(phi0)*Math.sin(phi)-Math.sin(phi0)*Math.cos(phi)*Math.cos(lambda))];
}
function projectedFeature(feature, definition) {
  if (!feature || feature.properties.name === 'Antarctica') return [];
  return polygons(feature.geometry).map(poly => poly.map(ring => {
    // Unwrap continuously, never join two vertices across the antipodal seam.
    // Independent normalization would stretch Australia across South America
    // or fill long strips of ocean when clipping a neighbouring continent.
    const unwrapped=[];
    let previous=definition.center[0];
    for(const [lon,lat] of ring) { const current=normalize(lon,previous);unwrapped.push([current,lat]);previous=current; }
    const minLon=Math.min(...unwrapped.map(p=>p[0])),maxLon=Math.max(...unwrapped.map(p=>p[0]));
    const shift=Math.round((definition.center[0]-(minLon+maxLon)/2)/360)*360;
    const positioned=unwrapped.map(([lon,lat])=>[lon+shift,lat]);
    const clipped = clipRing(positioned,definition.crop);
    return clipped.map(([lon,lat])=>project(lon,lat,definition.center));
  }).filter(r=>r.length)).filter(poly=>poly.length);
}
function area(ring) { return Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1]},0))/2; }
function inRing(point,ring) {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const a=ring[i],b=ring[j];
    if ((a[1]>point[1])!==(b[1]>point[1]) && point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
}
function inPolygon(point,poly) {return inRing(point,poly[0])&&!poly.slice(1).some(ring=>inRing(point,ring));}
function distanceToEdge(p,ring) {
  let best=Infinity;
  for(let i=0;i<ring.length;i++) {
    const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
    best=Math.min(best,(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2);
  }
  return best;
}
function interiorPoint(polys) {
  const poly=polys.slice().sort((a,b)=>area(b[0])-area(a[0]))[0];
  const ring=poly[0];
  let left=Math.min(...ring.map(p=>p[0])),right=Math.max(...ring.map(p=>p[0])),top=Math.min(...ring.map(p=>p[1])),bottom=Math.max(...ring.map(p=>p[1]));
  let best=null,bestScore=-1;
  for(let pass=0;pass<4;pass++) {
    const dx=(right-left)/18,dy=(bottom-top)/18;
    for(let x=0;x<=18;x++) for(let y=0;y<=18;y++) {
      const p=[left+dx*x,top+dy*y];
      if(!inPolygon(p,poly))continue;
      const score=Math.min(...poly.map(r=>distanceToEdge(p,r)));
      if(score>bestScore){best=p;bestScore=score;}
    }
    if(!best)break;
    left=best[0]-dx;right=best[0]+dx;top=best[1]-dy;bottom=best[1]+dy;
  }
  return best || ring[0];
}
const round=n=>Math.round(n*1000)/1000;
function pathData(polys,transform) {
  return polys.map(poly=>poly.map(ring=>ring.map((p,i)=>{const q=transform(p);return(i?'L':'M')+round(q[0])+' '+round(q[1]);}).join('')+'Z').join('')).join('');
}
const regions={};
for(const [key,definition] of Object.entries(definitions)) {
  const names=[...box.COUNTRY_MAP_REGION_COUNTRIES[definition.source],...(definition.extra||[])];
  const rows=names.map(name=>{
    const featureNames=[box.COUNTRY_MAP_FEATURE[name],...(extras[name]||[])].filter(Boolean);
    const polys=featureNames.flatMap(name=>projectedFeature(featureByName.get(name),definition));
    const known=box.COUNTRY_MAP_POINTS[name];
    assert(polys.length || known && known.every(Number.isFinite),'No coordinate for '+name);
    const c=polys.length?interiorPoint(polys):project(known[0],known[1],definition.center);
    return {name,featureNames,polys,c};
  });
  const allPoints=rows.flatMap(row=>[row.c,...row.polys.flat(2)]);
  const left=Math.min(...allPoints.map(p=>p[0])),right=Math.max(...allPoints.map(p=>p[0])),top=Math.min(...allPoints.map(p=>p[1])),bottom=Math.max(...allPoints.map(p=>p[1]));
  const width=900,height=650,padding=22,scale=Math.min((width-2*padding)/(right-left),(height-2*padding)/(bottom-top));
  const offsetX=(width-(right-left)*scale)/2,offsetY=(height-(bottom-top)*scale)/2;
  const transform=p=>[offsetX+(p[0]-left)*scale,offsetY+(p[1]-top)*scale];
  const activeFeatures=new Set(rows.flatMap(row=>row.featureNames));
  // Context only: neighbouring countries and territories never become answers.
  const context=world.features.filter(f=>!activeFeatures.has(f.properties.name)&&f.properties.name!=='Antarctica').flatMap(f=>projectedFeature(f,definition));
  const states=rows.map(row=>{
    const c=transform(row.c).map(round),d=pathData(row.polys,transform),projectedArea=row.polys.reduce((a,p)=>a+area(p[0])*scale*scale,0);
    const marker=!d||projectedArea<90;
    const state={n:row.name,a:row.name,d:d||`M${c[0]-1} ${c[1]}a1 1 0 1 0 2 0a1 1 0 1 0-2 0Z`,c};
    if(marker)state.marker=true;
    assert(c.every(Number.isFinite)&&c[0]>=0&&c[0]<=width&&c[1]>=0&&c[1]<=height,'Invalid center for '+row.name);
    assert(d || marker,'Missing playable geometry: '+row.name);
    if(row.polys.length)assert(row.polys.some(poly=>inPolygon(row.c,poly)),'Hint is outside '+row.name);
    return state;
  });
  regions[key]={title:definition.title,viewBox:[0,0,width,height],projection:{name:'Lambert azimuthal equal-area',center:definition.center,crop:definition.crop},states,context:pathData(context,transform)};
}
const assigned=Object.values(regions).flatMap(region=>region.states.map(row=>row.n));
assert.equal(new Set(assigned).size,assigned.length,'Duplicate country in continent pools');
assert.equal(assigned.length,197,'Expected all 197 countries');
assert.deepEqual(assigned.slice().sort(),Array.from(box.COUNTRY_MAP_ALL).sort(),'Continent pools must cover the existing country quiz');
const result=JSON.stringify({version:1,regions})+'\n';
const output=path.join(root,'assets/geography/continent-maps.json');
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(output,'utf8').replace(/\r\n/g,'\n'),result,'Run scripts/build-continent-map-assets.cjs');
else fs.writeFileSync(output,result);
console.log(JSON.stringify({countries:assigned.length,regions:Object.fromEntries(Object.entries(regions).map(([key,region])=>[key,{countries:region.states.length,markers:region.states.filter(s=>s.marker).length}]))}));
