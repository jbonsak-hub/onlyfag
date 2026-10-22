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
// Full Western Sahara claim-area outline, Natural Earth 1:50m (2026-10-22 snapshot).
// The local base snapshot instead splits at the berm; use one complete outline.
// Source: nvkelso/natural-earth-vector/geojson/ne_50m_admin_0_breakaway_disputed_areas.geojson
featureByName.set('Western Sahara (full territory)',{properties:{name:'Western Sahara (full territory)'},geometry:{type:'Polygon',coordinates:[[[-17.042391,21.007994],[-17.063992,20.898854],[-17.048049,20.806146],[-17.09877,20.856867],[-17.009628,21.377093],[-16.930847,21.900007],[-16.793259,22.159733],[-16.683989,22.274351],[-16.514413,22.333521],[-16.358738,22.594538],[-16.304322,22.834834],[-16.201848,22.94537],[-16.169757,23.031928],[-16.210271,23.097919],[-16.113688,23.227523],[-15.996718,23.425496],[-15.942613,23.55262],[-15.805955,23.749507],[-15.789263,23.792863],[-15.801666,23.84224],[-15.855202,23.800356],[-15.912563,23.727596],[-15.980724,23.670338],[-15.952819,23.740825],[-15.899334,23.844436],[-15.777791,23.952957],[-15.58633,24.072743],[-15.188628,24.478816],[-15.03887,24.548838],[-14.904304,24.719783],[-14.856064,24.871609],[-14.842913,25.220115],[-14.794905,25.404134],[-14.707055,25.547692],[-14.602307,25.808554],[-14.522726,25.92524],[-14.470558,26.163055],[-14.413895,26.253695],[-14.312454,26.296741],[-14.16838,26.415416],[-13.952114,26.488771],[-13.695903,26.642922],[-13.575781,26.735087],[-13.49576,26.872675],[-13.409822,27.146612],[-13.256162,27.434605],[-13.175986,27.655728],[-12.895202,27.65578],[-12.614392,27.655832],[-12.333634,27.655883],[-12.052825,27.655909],[-11.772041,27.655935],[-11.491257,27.655987],[-11.210473,27.656038],[-10.929689,27.65609],[-10.648905,27.656142],[-10.368121,27.656193],[-10.087312,27.656245],[-9.806528,27.656271],[-9.525744,27.656297],[-9.244934,27.656348],[-8.964176,27.6564],[-8.683366,27.656452],[-8.683366,27.49026],[-8.683366,27.285932],[-8.683082,27.119275],[-8.682875,26.921329],[-8.682617,26.723124],[-8.682333,26.497711],[-8.6821,26.273177],[-8.682152,26.109466],[-8.682204,25.99552],[-8.885628,25.99552],[-9.071921,25.99552],[-9.258215,25.99552],[-9.444508,25.99552],[-9.630854,25.995494],[-9.817173,25.995468],[-10.003492,25.995468],[-10.189812,25.995468],[-10.376131,25.995468],[-10.562451,25.995468],[-10.74877,25.995468],[-10.935089,25.995468],[-11.121409,25.995442],[-11.307728,25.995416],[-11.494047,25.995416],[-11.680341,25.995416],[-11.86666,25.995416],[-12.016289,25.995416],[-12.016289,25.876302],[-12.016289,25.740135],[-12.016289,25.603993],[-12.016289,25.467851],[-12.016289,25.331684],[-12.016289,25.195543],[-12.016289,25.059401],[-12.016289,24.923234],[-12.016289,24.787092],[-12.016289,24.65095],[-12.016289,24.514783],[-12.016289,24.378641],[-12.016289,24.2425],[-12.016289,24.106333],[-12.016289,23.970191],[-12.016289,23.834049],[-12.016289,23.697882],[-12.016289,23.576442],[-12.023421,23.46756],[-12.08334,23.435443],[-12.226199,23.377488],[-12.372883,23.318009],[-12.559357,23.290801],[-12.620413,23.271345],[-12.739604,23.192719],[-12.895977,23.089573],[-13.031499,23.00025],[-13.120873,22.884056],[-13.153274,22.82052],[-13.166478,22.753211],[-13.155961,22.689313],[-13.107334,22.560742],[-13.094311,22.495992],[-13.086767,22.383259],[-13.078473,22.26045],[-13.069584,22.128185],[-13.06067,21.995738],[-13.051213,21.854765],[-13.041757,21.713817],[-13.032196,21.572094],[-13.025117,21.466778],[-13.016228,21.333944],[-13.167434,21.333789],[-13.396722,21.33353],[-13.62601,21.333246],[-13.85535,21.332962],[-14.084639,21.332703],[-14.313953,21.332419],[-14.543267,21.332135],[-14.772607,21.331877],[-15.001895,21.331592],[-15.231209,21.331308],[-15.460524,21.33105],[-15.689812,21.330765],[-15.919126,21.330481],[-16.14844,21.330223],[-16.377729,21.329939],[-16.607043,21.329654],[-16.836357,21.329396],[-16.964566,21.329241],[-17.005907,21.142431],[-17.042391,21.007994]]]}});
const definitions = {
  europe: {title:'Europa', source:'europe', center:[18, 53], crop:[-26, 54, 33, 72.5], omitContext:['Greenland']},
  asia: {title:'Asia', source:'asia', center:[95, 29], crop:[25, 151, -11.5, 62], extra:['Armenia','Aserbajdsjan','Georgia']},
  northAmerica: {title:'Nord- og Mellom-Amerika', source:'northamerica', center:[-103, 39], crop:[-170, -50, 7, 74]},
  southAmerica: {title:'Sør-Amerika', source:'southamerica', center:[-60, -17], crop:[-83, -33, -56.5, 13]},
  africa: {title:'Afrika', source:'africa', center:[20, 0], crop:[-26, 62, -36, 38]},
  oceania: {title:'Oseania', source:'oceania', center:[163, -19], crop:[110, 204, -49, 18]}
};
const extras = {Somalia:['Somaliland'], Kypros:['N. Cyprus']};
// Regional territory targets are deliberately separate from Finn land's 197
// sovereign-country catalogue. Their visible names state their status.
const regionalTerritories = {
  southAmerica:[{name:'Fransk Guyana (fransk)',feature:'France',territory:true,parent:'Frankrike'}],
  africa:[{name:'Vest-Sahara (omstridt)',feature:'Western Sahara (full territory)',territory:true,disputed:true}],
  oceania:[{name:'Ny-Caledonia (fransk)',feature:'New Caledonia',territory:true,parent:'Frankrike'}]
};
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
  // The full disputed territory has its own labeled regional target. Do not
  // retain the source's Moroccan-controlled berm corridor underneath it.
  if (feature.properties.name === 'Morocco') definition={...definition,crop:[definition.crop[0],definition.crop[1],Math.max(definition.crop[2],27.6559),definition.crop[3]]};
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
  const targets=[...names.map(name=>({name})),...(regionalTerritories[key]||[])];
  const rows=targets.map(target=>{
    const {name}=target;
    const featureNames=[target.feature||box.COUNTRY_MAP_FEATURE[name],...(extras[name]||[])].filter(Boolean);
    const polys=featureNames.flatMap(name=>projectedFeature(featureByName.get(name),definition));
    const known=box.COUNTRY_MAP_POINTS[name];
    assert(polys.length || known && known.every(Number.isFinite),'No coordinate for '+name);
    const c=polys.length?interiorPoint(polys):project(known[0],known[1],definition.center);
    return {name,featureNames,polys,c,target};
  });
  const allPoints=rows.flatMap(row=>[row.c,...row.polys.flat(2)]);
  const left=Math.min(...allPoints.map(p=>p[0])),right=Math.max(...allPoints.map(p=>p[0])),top=Math.min(...allPoints.map(p=>p[1])),bottom=Math.max(...allPoints.map(p=>p[1]));
  const width=900,height=650,padding=22,scale=Math.min((width-2*padding)/(right-left),(height-2*padding)/(bottom-top));
  const offsetX=(width-(right-left)*scale)/2,offsetY=(height-(bottom-top)*scale)/2;
  const transform=p=>[offsetX+(p[0]-left)*scale,offsetY+(p[1]-top)*scale];
  const activeFeatures=new Set(rows.flatMap(row=>row.featureNames));
  // Cropped Greenland fragments add no useful context to the Europe round.
  const context=world.features.filter(f=>!activeFeatures.has(f.properties.name)&&!['Antarctica','W. Sahara',...(definition.omitContext||[])].includes(f.properties.name)).flatMap(f=>projectedFeature(f,definition));
  // Outside Africa, draw the same coherent full-territory outline as context.
  const territory=key==='africa'?[]:projectedFeature(featureByName.get('Western Sahara (full territory)'),definition);
  const states=rows.map(row=>{
    const c=transform(row.c).map(round),d=pathData(row.polys,transform),projectedArea=row.polys.reduce((a,p)=>a+area(p[0])*scale*scale,0);
    const marker=!d||projectedArea<90;
    const state={n:row.name,a:row.name,d:d||`M${c[0]-1} ${c[1]}a1 1 0 1 0 2 0a1 1 0 1 0-2 0Z`,c};
    for(const field of ['territory','parent','disputed'])if(row.target[field]!==undefined)state[field]=row.target[field];
    if(marker)state.marker=true;
    assert(c.every(Number.isFinite)&&c[0]>=0&&c[0]<=width&&c[1]>=0&&c[1]<=height,'Invalid center for '+row.name);
    assert(d || marker,'Missing playable geometry: '+row.name);
    if(row.polys.length)assert(row.polys.some(poly=>inPolygon(row.c,poly)),'Hint is outside '+row.name);
    return state;
  });
  regions[key]={title:definition.title,viewBox:[0,0,width,height],projection:{name:'Lambert azimuthal equal-area',center:definition.center,crop:definition.crop},states,context:pathData(context,transform),territory:pathData(territory,transform)};
}
const assigned=Object.values(regions).flatMap(region=>region.states.map(row=>row.n));
assert.equal(new Set(assigned).size,assigned.length,'Duplicate country in continent pools');
assert.equal(assigned.length,200,'Expected all 197 countries and three labeled regional territories');
const sovereign=Object.values(regions).flatMap(region=>region.states.filter(row=>!row.territory).map(row=>row.n));
assert.deepEqual(sovereign.sort(),Array.from(box.COUNTRY_MAP_ALL).sort(),'Continent pools must preserve the existing 197-country quiz');
const result=JSON.stringify({version:2,regions})+'\n';
const output=path.join(root,'assets/geography/continent-maps.json');
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(output,'utf8').replace(/\r\n/g,'\n'),result,'Run scripts/build-continent-map-assets.cjs');
else fs.writeFileSync(output,result);
console.log(JSON.stringify({countries:assigned.length,regions:Object.fromEntries(Object.entries(regions).map(([key,region])=>[key,{countries:region.states.length,markers:region.states.filter(s=>s.marker).length}]))}));
