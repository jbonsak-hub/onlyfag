// Reuse the published geography inventories and map geometry in Quizlab.
// No network access, substitute polygons or student data are involved.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');
const sources = new Map();
function read(file) {
  const content = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
  sources.set(file, content);
  return content;
}
const json = file => JSON.parse(read(file));
const score = json('services/geography-scores/data.json');
const continents = json('assets/geography/continent-maps.json');
const water = json('assets/geography/physical-maps/world-water-v2.json');
const mountains = json('assets/geography/physical-maps/mountain-europe.json');
const municipalities = json('assets/geography/municipalities/index-v3.json');
const modules = [], maps = {};
function add(id, label, group, type, targets, mapKey, extra = {}) {
  if (!targets.length || new Set(targets).size !== targets.length || targets.some(t => typeof t !== 'string' || !t)) throw Error('Invalid pool: ' + id);
  modules.push({id, label, group, type, poolSize: targets.length, ...(mapKey ? {mapKey} : {}), targets, ...extra});
}
function map(id, label, group, source, mapData, descriptor = {}, expected) {
  const credit = id === 'oslo'
    ? {attribution:'© Oslo kommune · © Kartverket (CC BY 4.0) · © OpenStreetMap-bidragsytere',attributionURL:'https://www.openstreetmap.org/copyright'}
    : id === 'fylker'
    ? {attribution:'NordNordWest / Wikimedia Commons · CC BY-SA 3.0 DE (tilpasset)',attributionURL:'https://commons.wikimedia.org/wiki/File:Vestland_in_Norway_2024.svg'}
    : id.startsWith('municipality-')
    ? {attribution:'© Kartverket · CC BY 4.0',attributionURL:'https://kartverket.no/til-lands/kart/kartdata'}
    : id === 'statle'
    ? {attribution:'OnlyFags eksisterende delstatskart',attributionURL:'/geografi/statle.html'}
    : {attribution:'Natural Earth · public domain',attributionURL:'https://www.naturalearthdata.com/about/terms-of-use/'};
  maps[id] = {source: '/' + source, ...(mapData.viewBox ? {viewBox: mapData.viewBox} : {}), ...credit, ...descriptor};
  const targets = mapData.states.filter(s => !descriptor.filterGroup || s.group === descriptor.filterGroup).map(s => s.n);
  if (expected && JSON.stringify(targets.slice().sort()) !== JSON.stringify(expected.slice().sort())) throw Error('Server/map pool mismatch: ' + id);
  add(id, label, group, 'target', targets, id);
}
add('flags', 'Flagg', 'Geografi', 'choice', score.countries.filter(c => c.hasFlag).map(c => c.id));
add('capitals', 'Hovedsteder', 'Geografi', 'choice', score.countries.map(c => c.id));
add('mapwiz', 'MapWiz', 'Geografi', 'location', Object.values(score.mapwiz).flat().map(t => t.id), undefined,
  {difficulties: Object.entries(score.mapwizDifficulties).map(([id, targets]) => ({id, label: {easy:'Normal', medium:'Vanskelig', hard:'Hjerterå'}[id], count: targets.length}))});

// Worldle needs complete outlines rather than the markers used to make tiny
// countries clickable in a continent map. Decode the existing compact public
// world geometry and fit each actual country polygon into its own SVG viewBox.
const core = read('assets/geography/core.js');
const names = ['COUNTRY_MAP_FILL_B64', 'COUNTRY_MAP_FILL_NAMES', 'COUNTRY_MAP_FEATURE', 'COUNTRY_MAP_POINTS'];
const declarations = names.map(name => {
  const line = core.split('\n').find(line => line.startsWith('const ' + name + '='));
  if (!line) throw Error('Missing original country geometry declaration: ' + name);
  return line;
});
const begin = core.indexOf('function countryMapDecodeCompactPolygon('), end = core.indexOf('\nfunction countryMapLandData(', begin);
if (begin < 0 || end < begin) throw Error('Missing original country geometry decoder');
const context = vm.createContext({atob, Uint8Array, DataView});
vm.runInContext(declarations.join('\n') + '\n' + core.slice(begin, end) + '\nthis.geometry={world:countryMapDecodeCompactPolygon(COUNTRY_MAP_FILL_B64,COUNTRY_MAP_FILL_NAMES),features:COUNTRY_MAP_FEATURE,points:COUNTRY_MAP_POINTS};', context);
const original = context.geometry, byFeature = new Map(original.world.features.map(f => [f.properties.name, f.geometry]));
const polygons = geometry => !geometry ? [] : geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
const norm = (lon, center) => {let delta = lon-center; while (delta > 180) delta -= 360; while (delta < -180) delta += 360; return delta;};
const outlines = [], silhouettes = {};
for (const country of score.countries) {
  let polys = polygons(byFeature.get(original.features[country.id] || country.id));
  if (!polys.length) continue;
  if (country.id === 'Frankrike') {
    // Match the existing Worldle mainland-France policy.
    const anchor = original.points[country.id];
    polys = polys.slice().sort((a,b) => {
      const distance = poly => Math.min(...poly[0].map(p => Math.abs(norm(p[0], anchor[0])) + Math.abs(p[1]-anchor[1])));
      return distance(a)-distance(b);
    }).slice(0,1);
  }
  for (const extra of ({Marokko:['W. Sahara'], Kypros:['N. Cyprus'], Somalia:['Somaliland']}[country.id] || [])) polys.push(...polygons(byFeature.get(extra)));
  const points = polys.flat(2), anchor = original.points[country.id] || points[0];
  const latitude = (Math.min(...points.map(p=>p[1])) + Math.max(...points.map(p=>p[1]))) / 2;
  const cos = Math.cos(latitude*Math.PI/180);
  const project = p => [norm(p[0], anchor[0])*cos, -p[1]];
  const projected = points.map(project);
  const minX = Math.min(...projected.map(p=>p[0])), maxX = Math.max(...projected.map(p=>p[0]));
  const minY = Math.min(...projected.map(p=>p[1])), maxY = Math.max(...projected.map(p=>p[1]));
  if (!(maxX > minX && maxY > minY)) continue;
  const scale = Math.min(368/(maxX-minX),268/(maxY-minY)), dx=(400-(maxX-minX)*scale)/2, dy=(300-(maxY-minY)*scale)/2;
  const d = polys.map(poly=>poly.map(ring=>ring.map((p,i)=>{const [x,y]=project(p);return (i?'L':'M')+((x-minX)*scale+dx).toFixed(2)+' '+((y-minY)*scale+dy).toFixed(2);}).join('')+'Z').join('')).join('');
  outlines.push({n: country.id, d});
  silhouettes[country.id] = {mapKey:'worldle', targetId:country.id};
}
maps.worldle = {source:'/assets/quizlab/silhouettes.json',viewBox:[0,0,400,300],attribution:'Natural Earth · public domain',attributionURL:'https://www.naturalearthdata.com/about/terms-of-use/'};
maps.world = {source:'/assets/geography/mapwiz-world-map.json',attribution:'Natural Earth · public domain',attributionURL:'https://www.naturalearthdata.com/about/terms-of-use/'};
add('worldle', 'Worldle · landomriss', 'Geografi', 'choice', outlines.map(s=>s.n));

for (const [region, mapData] of Object.entries(continents.regions)) {
  map('kart-'+region, mapData.title, 'Verdensdeler', 'assets/geography/continent-maps.json', mapData, {region}, score.kart[region]);
}
const counties = json('assets/geography/norway-counties.json');
map('fylker', 'Norske fylker', 'Norge og USA', 'assets/geography/norway-counties.json', {states:counties}, {}, score.fylker);
const states = json('assets/geography/us-states.json');
map('statle', 'Stater i USA', 'Norge og USA', 'assets/geography/us-states.json', {states,viewBox:[25,15,860,575]}, {}, score.statle);
const oslo = json('assets/geography/oslo-bydeler/oslo.json');
map('oslo', 'Oslo · bydeler og områder', 'Norge og USA', 'assets/geography/oslo-bydeler/oslo.json', oslo, {}, score.bydeler);
map('rivers', 'Elver', 'Fysiske kart', 'assets/geography/physical-maps/world-water-v2.json', water.regions.rivers, {region:'rivers'}, score.kartRiversV2);
map('mountains', 'Fjellkjeder og høyland', 'Fysiske kart', 'assets/geography/physical-maps/mountain-europe.json', mountains.regions.mountains, {region:'mountains'}, score.kart.mountains);
for (const group of ['lakes','seas','gulfsStraits']) {
  const region = group === 'lakes' ? 'lakes' : 'seas';
  map(group, {lakes:'Innsjøer',seas:'Hav og sjøområder',gulfsStraits:'Bukter og stred'}[group], 'Fysiske kart', 'assets/geography/physical-maps/world-water-v2.json', water.regions[region], {region,filterGroup:group}, score.kartWaterGroups[group]);
}
for (const county of municipalities.counties) {
  const source = 'assets/geography/municipalities/' + county.file, data = json(source);
  map('municipality-'+county.code, 'Kommuner · '+(county.quizTitle || county.name), 'Kommuner', source, data, {}, score.kommuner[county.code]);
}
const schema = {statements:read('services/geography-scores/migrations/0002-quizlab.sql').replace(/--[^\n]*/g, '').split(';').map(sql=>sql.trim()).filter(Boolean)};
const sourceHash = crypto.createHash('sha256').update([...sources].sort(([a],[b])=>a.localeCompare(b)).map(([file,content])=>file+'\n'+content).join('\n')).digest('hex');
const categories = modules.map(({id,label,group,type,poolSize,difficulties})=>({id,title:label,group,type,count:poolSize,...(difficulties?{difficulties}:{})}));
const catalog = {version:1,sourceHash,categories,modules,maps,silhouettes};
const outputs = {
  'services/geography-scores/quizlab-schema.json':schema,
  'assets/quizlab/catalog.json':catalog,
  'assets/quizlab/silhouettes.json':{viewBox:[0,0,400,300],source:'Existing OnlyFag countryMapFillData (Natural Earth). Mainland France and supplementary features follow the existing Worldle policy.',states:outlines}
};
for (const [file,data] of Object.entries(outputs)) {
  const content = JSON.stringify(data)+'\n', absolute = path.join(root,file);
  if (check) {
    if (!fs.existsSync(absolute) || fs.readFileSync(absolute,'utf8') !== content) throw Error('Run node scripts/build-quizlab-data.cjs: '+file);
  } else { fs.mkdirSync(path.dirname(absolute),{recursive:true}); fs.writeFileSync(absolute,content); }
}
console.log((check?'Verified':'Built')+' Quizlab catalog: '+modules.length+' modules, '+outlines.length+' real country outlines, '+Object.keys(maps).length+' map references');
