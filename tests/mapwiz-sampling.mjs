import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import '../assets/geography/mapwiz-sampling.js';
import {data,create,board} from '../services/geography-scores/rules.mjs';
const sampler=globalThis.MapWizSampling;
// The browser and Worker execute this exact source.
const browser=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../assets/geography/mapwiz-sampling.js',import.meta.url),'utf8'),browser);
const clustered=Array.from({length:10},(_,i)=>({name:'Nearby '+i,lat:60+i*.3,lon:8+i*.5}));
const scattered=[{lat:60,lon:10},{lat:50,lon:2},{lat:42,lon:13},{lat:30,lon:31},{lat:0,lon:20},{lat:28,lon:77},{lat:35,lon:140},{lat:40,lon:-75},{lat:-23,lon:-43},{lat:19,lon:-99}].map((p,i)=>({...p,name:'Place '+i}));
let calls=0;assert.equal(sampler.spread(()=>++calls===1?clustered:scattered),scattered);assert.equal(calls,2,'Reject the whole crowded round, rather than filling a continent quota');
assert.equal(sampler.analyse(scattered).penalty,0);assert(sampler.analyse(clustered).penalty>0);
calls=0;assert.equal(sampler.spread(()=>{calls++;return clustered;}),clustered);assert.equal(calls,24,'A narrow legacy pool has a bounded fallback');
assert(sampler.distance({lat:0,lon:179},{lat:0,lon:-179})<225,'Distances cross the date line correctly');
let seed=162009;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function shuffle(pool){const items=pool.slice();for(let i=items.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
const all=new Map(Object.values(data.mapwiz).flat().map(t=>[t.id,t]));
const report=[];
for(const level of ['easy','medium','hard']){
 const pool=data.mapwizDifficulties[level].map(id=>all.get(id)),allowed=new Set(pool.map(t=>t.id));
 const draw=()=>{const seen=new Set();return shuffle(pool).filter(t=>{if(seen.has(t.name))return false;seen.add(t.name);return true;}).slice(0,10);};
 let rawCrowded=0,newCrowded=0,qualityPasses=0,rawPacific=0,newPacific=0;
 const pacific=t=>t.lon>=110&&t.lat<0&&t.lat>-50; // Same geographic box in both samples.
 for(let run=0;run<5000;run++){
  const raw=draw(),round=sampler.spread(draw),quality=sampler.analyse(round);
  rawCrowded+=sampler.analyse(raw).nearby>5;newCrowded+=quality.nearby>5;qualityPasses+=quality.penalty===0;
  rawPacific+=raw.some(pacific);newPacific+=round.some(pacific);
  assert.equal(round.length,10);assert.equal(new Set(round.map(t=>t.name)).size,10);assert(round.every(t=>allowed.has(t.id)));
  if(run<20)assert.equal(browser.MapWizSampling.analyse(round).penalty,quality.penalty,'Browser and server use identical geographic rules');
 }
 assert.equal(newCrowded,0);assert.equal(qualityPasses,5000);
 if(level==='easy'){assert(rawCrowded>2000,'The regression fixture captures the original Europe/Nordic concentration');assert(newPacific<2250,'Sparse Pacific targets do not become mandatory');assert(newPacific>100,'Sparse regions remain eligible');}
 assert(newPacific/5000<rawPacific/5000*1.6+.02,'Balancing does not replace pool probabilities with equal-continent quotas');
 report.push({level,runs:5000,originalCrowded:rawCrowded,balancedCrowded:newCrowded,pacificBefore:rawPacific/5000,pacificAfter:newPacific/5000});
 // Exercise the actual verified server entry point and cached multi-level mode.
 for(let run=0;run<60;run++){const state=create({game:'mapwiz',difficulties:[level],map:'world'},0),round=state.targets.map(id=>all.get(id));assert.equal(round.length,10);assert(round.every(t=>allowed.has(t.id)));assert.equal(sampler.analyse(round).penalty,0);}
}
assert.equal(board({game:'mapwiz',difficulties:['easy'],map:'world'}),'v1:{"game":"mapwiz","difficulties":["easy"]}','Existing leaderboard identity remains unchanged');
console.log(JSON.stringify({rounds:15000,serverAndBrowser:true,noContinentQuotas:true,report}));
