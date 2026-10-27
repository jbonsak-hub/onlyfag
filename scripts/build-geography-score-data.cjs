// Server reference data comes from the same public sources as the games.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const core=read('assets/geography/core.js');
function declaration(name){const start=core.search(new RegExp('const '+name+'\\s*='));if(start<0)throw Error(name);let quote=null,escaped=false;for(let i=start;i<core.length;i++){const c=core[i];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;}else if(c==='"'||c==="'")quote=c;else if(c===';')return core.slice(start,i+1).replace(/^const/,'var');}throw Error(name);}
const box={window:{}};vm.createContext(box);vm.runInContext(read('assets/geography/quiz-data.js'),box);vm.runInContext(read('assets/geography/mapwiz-prototype-data.js'),box);vm.runInContext(read('assets/geography/mapwiz-river-data.js'),box);
for(const name of ['COUNTRY_MAP_ALL','COUNTRY_MAP_REGION_COUNTRIES','GEO_CAPITAL_TARGETS','GEO_PLACE_TARGETS'])vm.runInContext(declaration(name),box);
const source=box.window.GEO_QUIZ_DATA,reference=box.window.MAPWIZ_PROTOTYPE_DATA;
const continentMaps=JSON.parse(read('assets/geography/continent-maps.json')),kart=Object.fromEntries(Object.entries(continentMaps.regions).map(([region,map])=>[region,map.states.map(s=>s.n)]));
const kartCountries=Object.values(continentMaps.regions).flatMap(region=>region.states.filter(s=>!s.territory).map(s=>s.n));
if(Object.keys(kart).sort().join(',')!==['africa','asia','europe','northAmerica','oceania','southAmerica'].sort().join(',')||kartCountries.length!==box.COUNTRY_MAP_ALL.length||new Set(kartCountries).size!==kartCountries.length||kartCountries.some(name=>!box.COUNTRY_MAP_ALL.includes(name)))throw Error('Kart must preserve every quiz country exactly once across its six continents');
const physicalFiles=['physical-maps/world-water.json','physical-maps/mountain-europe.json'],kartPhysical=['rivers','lakes','seas','mountains'],kartWaterGroups={};
for(const file of physicalFiles){const maps=JSON.parse(read('assets/geography/'+file));for(const [region,map]of Object.entries(maps.regions)){if(!kartPhysical.includes(region)||Object.hasOwn(kart,region)||!Array.isArray(map.states)||map.states.length<2)throw Error('Invalid physical Kart region: '+region);const names=map.states.map(s=>s.n);if(names.some(name=>typeof name!=='string'||!name.trim())||new Set(names).size!==names.length)throw Error('Invalid physical Kart targets: '+region);kart[region]=names;if(['lakes','seas'].includes(region))for(const group of ['lakes','seas','gulfsStraits']){const selected=map.states.filter(s=>s.group===group).map(s=>s.n);if(selected.length)kartWaterGroups[group]=selected;}}}
if(kartPhysical.some(region=>!Object.hasOwn(kart,region)))throw Error('All four physical Kart regions must be present');
// Canonical water data remains available to every cached49 client and board.
const legacyWater='assets/geography/physical-maps/world-water.json';
if(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,legacyWater))).digest('hex')!=='e70efb54a9af9045cba6ddf193c5c985e4a62d4b4f8d6705e459fc8424031f95')throw Error('Retain the published49-river water map unchanged');
const reducedWater=JSON.parse(read('assets/geography/physical-maps/world-water-v2.json'));
const kartRiversV2=reducedWater.regions.rivers.states.map(state=>state.n);
const removedRivers=['Glomma','Ohio','Uruguay','Paraguay','Don','Elbe','Loire','Limpopo','Mackenzie','Jenisej'];
const addedRivers=['Irrawaddy','Jordan'];
if(reducedWater.regions.rivers.variant!=='rivers-v2'||kart.rivers.length!==49||kartRiversV2.length!==41||new Set(kartRiversV2).size!==41||!kartRiversV2.includes('Lena')||addedRivers.some(name=>!kartRiversV2.includes(name))||kartRiversV2.some(name=>!kart.rivers.includes(name)&&!addedRivers.includes(name))||removedRivers.some(name=>kartRiversV2.includes(name))||kart.rivers.some(name=>!kartRiversV2.includes(name)&&!removedRivers.includes(name)))throw Error('The revised river map must retain Lena, remove exactly the approved ten targets and add Irrawaddy and Jordan');

const municipalityIndex=JSON.parse(read('assets/geography/municipalities/index-v3.json'));
const municipalityFiles=municipalityIndex.counties.map(county=>'municipalities/'+county.file);
const kommuneTargets=Object.fromEntries(municipalityIndex.counties.map((county,i)=>{const targets=JSON.parse(read('assets/geography/'+municipalityFiles[i])).states.map(state=>state.n);if(targets.length!==(county.quizCount||county.count)||targets.some(name=>typeof name!=='string'||!name.trim())||new Set(targets).size!==targets.length)throw Error('Invalid municipality targets: '+county.code);return [county.code,targets];}));
const kommunerOslo30=JSON.parse(read('assets/geography/municipalities/county-03-v2.json')).states.map(state=>state.n);
const kommunerOslo54=JSON.parse(read('services/geography-scores/legacy-oslo-surroundings-54-targets.json'));
const cachedOsloMunicipalities=JSON.parse(read('assets/geography/municipalities/county-03.json')).states.map(state=>state.n);
const cachedMunicipalityFiles={"assets/geography/municipalities/index.json": "feb8905e661d31b8644b26d2b0013f4ef3ae10d69a62764ce5dec152f67fcec3", "assets/geography/municipalities/county-03.json": "a315d8ffddbdb2a1219317ab965a23e105d8ab191c68f45ac41c862570217a02", "assets/geography/municipalities/index-v2.json": "7bbe24602358ad9fc883063282f97f65edabac6ccc73d1345c6b71f592b77966", "assets/geography/municipalities/county-03-v2.json": "6f075b1947988278d9d8460b965bc78b711284e8ea4ef99b6e2376e7305509b9"};
for(const [file,expected]of Object.entries(cachedMunicipalityFiles))if(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')!==expected)throw Error('Retain the published historical municipality files unchanged: '+file);
if(kommunerOslo54.length!==54||new Set(kommunerOslo54).size!==54||JSON.stringify(cachedOsloMunicipalities)!==JSON.stringify(kommunerOslo54))throw Error('The published Oslo-surroundings map and its frozen54 target order must remain identical');
const osloMunicipalityEntry=municipalityIndex.counties.find(county=>county.code==='03');
const osloMunicipalityMap=JSON.parse(read('assets/geography/municipalities/'+osloMunicipalityEntry.file));
if(osloMunicipalityEntry.variant!=='oslo-surroundings-v3'||osloMunicipalityMap.variant!=='oslo-surroundings-v3'||kommuneTargets['03'].length<2||kommuneTargets['03'].length>=54||kommuneTargets['03'].some(name=>!kommunerOslo54.includes(name)))throw Error('The reduced Oslo-surroundings quiz needs its v3 variant and a proper subset of the original54 municipalities');
if(kommunerOslo30.length!==30||kommuneTargets['03'].length!==31||!kommuneTargets['03'].includes('Ringerike')||kommunerOslo30.some(name=>!kommuneTargets['03'].includes(name)))throw Error('Current Oslo surroundings must add only Ringerike to the frozen30 pool');
const osloMap=JSON.parse(read('assets/geography/oslo-bydeler/oslo.json')),bydeler=osloMap.states.map(state=>state.n);
const bydelerLegacy=JSON.parse(read('services/geography-scores/legacy-oslo-targets.json'));
const bydeler28=JSON.parse(read('services/geography-scores/legacy-oslo-28-targets.json'));
const bydeler57=JSON.parse(read('services/geography-scores/legacy-oslo-57-targets.json'));
const bydeler35=JSON.parse(read('services/geography-scores/legacy-oslo-35-targets.json'));
const cachedOsloNames=JSON.parse(read('assets/geography/oslo-bydeler/map.json')).states.map(state=>state.n);
const cachedOslo28=JSON.parse(read('assets/geography/oslo-bydeler/oslo-00fc86a8a4bf.json')).states.map(state=>state.n);
const cachedOslo57=JSON.parse(read('assets/geography/oslo-bydeler/oslo-fa9842cf0c7a.json')).states.map(state=>state.n);
const cachedOslo35=JSON.parse(read('assets/geography/oslo-bydeler/oslo-8350eadb74db.json')).states.map(state=>state.n);
const sameNames=(a,b)=>JSON.stringify(a.slice().sort())===JSON.stringify(b.slice().sort());
if(!sameNames(cachedOsloNames,bydelerLegacy)||bydelerLegacy.length!==16||new Set(bydelerLegacy).size!==16)throw Error('Cached Oslo map and legacy sixteen-area server targets must stay identical');
if(!sameNames(cachedOslo28,bydeler28)||bydeler28.length!==28||new Set(bydeler28).size!==28)throw Error('Published Oslo-28 map and its frozen server targets must stay identical');
if(!sameNames(cachedOslo57,bydeler57)||bydeler57.length!==57||new Set(bydeler57).size!==57)throw Error('Published Oslo-57 map and its frozen server targets must stay identical');
if(!sameNames(cachedOslo35,bydeler35)||bydeler35.length!==35||new Set(bydeler35).size!==35)throw Error('Published Oslo-35 map and its frozen server targets must stay identical');
if(osloMap.ruleset!=='oslo-areas-v5'||bydeler.length<2||bydeler.some(name=>typeof name!=='string'||!name.trim())||new Set(bydeler).size!==bydeler.length)throw Error('The current Oslo quiz requires its v5 polygon ruleset and distinct area targets');
if(osloMap.stats?.targetCount!==undefined&&osloMap.stats.targetCount!==bydeler.length)throw Error('Oslo source statistics and target count disagree');
if(osloMap.states.some(state=>!['land','forest','lake'].includes(state.kind)||typeof state.d!=='string'||!/^M/.test(state.d)||!state.d.includes('Z')||Object.hasOwn(state,'marker')||Object.hasOwn(state,'point')))throw Error('Oslo v5 accepts real land, forest and lake polygons only; no point markers');
const playable=t=>Number.isFinite(t.lat)&&Number.isFinite(t.lon)&&t.lat<=75&&t.lat>=-58.8;
const unique=items=>items.filter((t,i,a)=>a.findIndex(x=>x.name===t.name&&x.lat===t.lat&&x.lon===t.lon)===i);
const categories={mountains:'Fjell og vulkaner',ranges:'Fjellkjeder',deserts:'Ørkener',lakes:'Innsjøer',islands:'Øyer, øygrupper og halvøyer',regions:'Regioner og områder',seas:'Hav og sjøområder',straits:'Stred, kanaler, bukter og kapp',landmarks:'Kjente byggverk og historiske steder',nature:'Kjente natursteder','place:Norge':'Norge'};
const pools={flags:reference.countries.filter(c=>c.flag),capitals:unique(box.GEO_CAPITAL_TARGETS.filter(t=>playable(t)&&box.COUNTRY_MAP_ALL.includes(t.country))),cities:reference.cities,rivers:box.window.MAPWIZ_RIVER_MIDPOINTS};
for(const [key,category]of Object.entries(categories))pools[key]=unique(box.GEO_PLACE_TARGETS.filter(t=>(playable(t)||category==='Norge')&&t.category===category));
const extraTargets=reference.extraTargets;
if(!Array.isArray(extraTargets)||extraTargets.length!==18)throw Error('Rebuild the eighteen approved MapWiz additions');
pools.historical=extraTargets.filter(target=>target.category==='Historiske riker og gamle navn');
pools.regions=unique(pools.regions.concat(extraTargets.filter(target=>target.category==='Regioner og områder')));
const data={version:1,statle:JSON.parse(read('assets/geography/us-states.json')).map(s=>s.n),fylker:JSON.parse(read('assets/geography/norway-counties.json')).map(s=>s.n),kart,kartRiversV2,kartPhysical,kartWaterGroups,kommuner:kommuneTargets,kommunerOslo54,kommunerOslo30,bydeler,bydeler35,bydeler57,bydeler28,bydelerLegacy,countries:source.countries.filter(c=>c.country&&c.capital).map(c=>({id:c.country,country:c.country,capital:c.capital,flagCode:c.flagCode,hasFlag:!!(c.flagCode&&c.flag)})),places:source.places.map(p=>({id:p.category+'|'+p.place,...p})),regions:{world:box.COUNTRY_MAP_ALL,...box.COUNTRY_MAP_REGION_COUNTRIES},names:JSON.parse(read('assets/geography/quiz-english-names.json')),mapwiz:Object.fromEntries(Object.entries(pools).map(([category,items])=>[category,items.map(t=>({id:JSON.stringify([category,t.name,t.lat,t.lon]),name:t.name,category,lat:t.lat,lon:t.lon}))]))};
// New difficulty lists reference the original target ids. Legacy category lists
// and their published board identities remain available to cached clients.
const difficulties=JSON.parse(read('assets/geography/mapwiz-difficulties.json'));
if(JSON.stringify(difficulties)!==JSON.stringify(reference.difficulties)||difficulties.version!==1||difficulties.levels.map(level=>level.id).join(',')!=='easy,medium,hard')throw Error('Rebuild MapWiz difficulty reference data');
if(Object.keys(difficulties.assignments).sort().join('|')!==Object.keys(data.mapwiz).sort().join('|'))throw Error('Every MapWiz category requires difficulty assignments');
data.mapwizDifficulties=Object.fromEntries(difficulties.levels.map(level=>[level.id,[]]));
for(const [category,targets]of Object.entries(data.mapwiz)){
 const assignments=difficulties.assignments[category];
 if(Object.keys(assignments).length!==targets.length||targets.some(target=>!Object.hasOwn(assignments,target.name)))throw Error('Every MapWiz target requires exactly one difficulty: '+category);
 for(const target of targets){const level=assignments[target.name];if(!Object.hasOwn(data.mapwizDifficulties,level))throw Error('Invalid MapWiz difficulty: '+target.name);data.mapwizDifficulties[level].push(target.id);}
}
// Cached clients without the world-map marker keep the original 776-target pool.
data.mapwizAdditions=Object.values(data.mapwiz).flat().filter(target=>extraTargets.some(extra=>target.name===extra.name&&target.lat===extra.lat&&target.lon===extra.lon)).map(target=>target.id);
if(data.mapwizAdditions.length!==18||Object.values(data.mapwiz).flat().length!==794)throw Error('MapWiz requires 794 targets including exactly eighteen approved additions');
const files=['mapwiz-difficulties.json','core.js','quiz-data.js','mapwiz-prototype-data.js','mapwiz-river-data.js','quiz-english-names.json','us-states.json','norway-counties.json','continent-maps.json',...physicalFiles,'physical-maps/world-water-v2.json','municipalities/index-v3.json','municipalities/index-v2.json','municipalities/county-03-v2.json','municipalities/index.json','municipalities/county-03.json',...municipalityFiles,'oslo-bydeler/oslo.json','oslo-bydeler/map.json','oslo-bydeler/oslo-00fc86a8a4bf.json','oslo-bydeler/oslo-fa9842cf0c7a.json','oslo-bydeler/oslo-8350eadb74db.json'];data.sourceHash=crypto.createHash('sha256').update(files.map(f=>read('assets/geography/'+f)).join('\n')+'\n'+read('services/geography-scores/legacy-oslo-targets.json')+'\n'+read('services/geography-scores/legacy-oslo-28-targets.json')+'\n'+read('services/geography-scores/legacy-oslo-57-targets.json')+'\n'+read('services/geography-scores/legacy-oslo-35-targets.json')+'\n'+read('services/geography-scores/legacy-oslo-surroundings-54-targets.json')).digest('hex');
const file=path.join(root,'services/geography-scores/data.json'),result=JSON.stringify(data)+'\n';
if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')!==result)throw Error('Run scripts/build-geography-score-data.cjs');}else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,result);}
console.log(JSON.stringify({countries:data.countries.length,places:data.places.length,mapwiz:Object.fromEntries(Object.entries(data.mapwiz).map(([k,v])=>[k,v.length])),difficulties:Object.fromEntries(Object.entries(data.mapwizDifficulties).map(([k,v])=>[k,v.length]))}));
