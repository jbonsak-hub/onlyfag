const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,'assets/geography',name),'utf8'));
const states=read('us-states.json'),cities=read('us-largest-cities.json'),layout=require('../assets/geography/statle-label-layout.js');
assert.equal(Object.keys(cities).length,50);
for(const state of states){
 const city=cities[state.n];assert.ok(city?.name,state.n+' has a city');
 assert.ok(city.population2025>1000&&/^\d{7}$/.test(city.censusGeoid));
 assert.ok(Number.isFinite(city.lon)&&Number.isFinite(city.lat));
 assert.ok(layout.parsePath(state.d).some(ring=>layout.contains(city.p,ring)),city.name+' dot lies inside '+state.n);
}
for(const [state,name]of Object.entries({Alabama:'Huntsville',California:'Los Angeles',Florida:'Jacksonville',Kentucky:'Louisville',Michigan:'Detroit',Tennessee:'Nashville','West Virginia':'Charleston',Idaho:'Boise',Louisiana:'New Orleans',Hawaii:'Honolulu'}))assert.equal(cities[state].name,name);
assert.notEqual(cities.California.name,read('us-capitals.json').California.name);
console.log('PASS all 50 largest-city identities and projected city locations');

const duplicateNames=Object.values(cities).filter((c,i,all)=>all.filter(x=>x.name===c.name).length>1).map(c=>c.name);
assert.deepEqual([...new Set(duplicateNames)].sort(),['Charleston','Portland']);
const snapshot=JSON.stringify(cities),prompts=states.map(state=>layout.cityName(state,cities));
assert.equal(new Set(prompts).size,50,'state abbreviations uniquely identify duplicate city names');
assert.deepEqual(prompts.filter(name=>/\([A-Z]{2}\)$/.test(name)).sort(),['Charleston (SC)','Charleston (WV)','Portland (ME)','Portland (OR)']);
for(const state of states)if(!duplicateNames.includes(cities[state.n].name))assert.equal(layout.cityName(state,cities),cities[state.n].name);
assert.equal(layout.cityName(states.find(state=>state.a==='ME'),new Map(Object.entries(cities))),'Portland (ME)');
assert.equal(JSON.stringify(cities),snapshot,'display formatting leaves raw Census data unchanged');
console.log('PASS exactly four duplicate-city prompts use state abbreviations');
