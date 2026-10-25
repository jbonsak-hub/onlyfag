import data from './data.json' with {type:'json'};
export {data};
const modes=new Set(['flags','capitals','flagcapital','places','countries','mapwiz','statle','fylker','kart','kommuner','bydeler']);
const shapeQuiz=game=>['statle','fylker','kart','kommuner','bydeler'].includes(game);
const shapeTargets=c=>c.game==='bydeler'?(c.variant==='oslo-areas-v5'?data.bydeler:c.variant==='oslo-areas-v4'?data.bydeler35:c.variant==='oslo-areas-v3'?data.bydeler57:c.variant==='oslo-28'?data.bydeler28:data.bydelerLegacy):c.game==='kommuner'?(c.county==='03'?(c.variant===undefined?data.kommunerOslo54:c.variant==='oslo-surroundings-v2'?data.kommunerOslo30:data.kommuner[c.county]):data.kommuner[c.county]):c.game==='kart'?(['lakes','seas'].includes(c.region)?c.categories.flatMap(group=>data.kartWaterGroups[group]):data.kart[c.region]):data[c.game];
const variants={flags:['flag-country-mc','country-flag-mc'],capitals:['country-capital-mc','capital-country-mc'],flagcapital:['flag-capital-mc','capital-flag-mc'],places:['desc-place-mc','place-desc-mc']};
export const shuffle=items=>{const a=items.slice(),random=new Uint32Array(a.length);crypto.getRandomValues(random);for(let i=a.length-1;i>0;i--){const j=random[i]%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
export function config(input){
 if(!input||!modes.has(input.game))throw Error('invalid_config');
 const c={game:input.game,language:input.language==='en'?'en':'no'};
 if(c.game==='mapwiz'){
  if(!Array.isArray(input.categories)||!input.categories.length||input.categories.length>15)throw Error('invalid_config');
  c.categories=[...new Set(input.categories)].sort();if(c.categories.some(k=>!Object.hasOwn(data.mapwiz,k)))throw Error('invalid_config');
 }else if(c.game==='kommuner'){c.county=input.county;if(typeof c.county!=='string'||!Object.hasOwn(data.kommuner,c.county))throw Error('invalid_config');if(input.variant!==undefined){if(c.county!=='03'||!['oslo-surroundings-v2','oslo-surroundings-v3'].includes(input.variant))throw Error('invalid_config');c.variant=input.variant;}}
 else if(c.game==='kart'){c.region=input.region;if(typeof c.region!=='string'||!Object.hasOwn(data.kart,c.region))throw Error('invalid_config');if(['lakes','seas'].includes(c.region)){const groups=input.categories===undefined?(c.region==='lakes'?['lakes']:['seas','gulfsStraits']):input.categories;if(!Array.isArray(groups)||!groups.length||groups.length>3||groups.some(group=>typeof group!=='string'||(!Object.hasOwn(data.kartWaterGroups,group)||(c.region==='seas'&&group==='lakes'))))throw Error('invalid_config');c.categories=[...new Set(groups)].sort();}}
 else if(c.game==='bydeler'){if(input.variant!==undefined){if(!['oslo-28','oslo-areas-v3','oslo-areas-v4','oslo-areas-v5'].includes(input.variant))throw Error('invalid_config');c.variant=input.variant;}}
 else if(c.game==='statle'){if(input.variant!==undefined){if(!['capitals','largest-city'].includes(input.variant))throw Error('invalid_config');c.variant=input.variant;}}
 else if(shapeQuiz(c.game)){}else if(c.game==='countries'){c.region=input.region||'world';if(!Object.hasOwn(data.regions,c.region))throw Error('invalid_config');}
 else{c.variant=input.variant||variants[c.game][0];if(!variants[c.game].includes(c.variant))throw Error('invalid_config');c.region=input.region||'world';if(c.game!=='places'&&!Object.hasOwn(data.regions,c.region))throw Error('invalid_config');if(c.game==='places')c.region='world';}
 return c;
}
export const board=c=>{const {language,...ranking}=config(c);return 'v'+data.version+':'+JSON.stringify(ranking);};
export function pool(c){
 if(c.game==='places')return data.places;
 const names=new Set(data.regions[c.region]||data.regions.world);
 return data.countries.filter(t=>names.has(t.country)&&(c.game==='flags'||c.game==='flagcapital'?t.hasFlag:true));
}
function mapRounds(c){
 const norway=c.categories.length===1&&c.categories[0]==='place:Norge';
 const buckets=c.categories.map(k=>({items:shuffle(data.mapwiz[k].filter(t=>norway||t.lat<=75&&t.lat>=-58.8)),count:0})),out=[],seen=new Set(),limit=c.categories.length>5?2:10;
 while(out.length<10){let added=false;for(const b of shuffle(buckets)){if(out.length===10)break;if(b.count>=limit)continue;const t=b.items.find(t=>!seen.has(t.name)&&t.name!==out.at(-1)?.name);if(t){out.push(t);seen.add(t.name);b.count++;added=true;}}if(!added){if(buckets.every(b=>b.count>=limit||!b.items.length))throw Error('invalid_config');seen.clear();}}
 return out;
}
const mapTarget=id=>{const [category]=JSON.parse(id);return data.mapwiz[category]?.find(t=>t.id===id);};
const target=(s,id)=>s.config.game==='mapwiz'?mapTarget(id):pool(s.config).find(t=>t.id===id);
function questionReference(c){
 if(shapeQuiz(c.game)||['mapwiz','countries'].includes(c.game))return null;
 const items=pool(c),field=c.game==='places'?(c.variant==='place-desc-mc'?'explanation':'place'):(c.variant.includes('capital')&&!c.variant.startsWith('capital-')?'capital':c.variant.endsWith('flag-mc')?'flagCode':'country');
 const byId=new Map(items.map(t=>[t.id,t])),labels=new Map(items.map(t=>[t.id,c.language==='en'?(data.names[t[field]]||t[field]):t[field]])),groups=new Map();
 if(c.game==='places')for(const t of items){if(!groups.has(t.category))groups.set(t.category,[]);groups.get(t.category).push(t);}
 return {items,byId,labels,groups};
}
function makeQuestion(s,index,now,reference=questionReference(s.config)){
 const c=s.config;if(shapeQuiz(c.game))return {id:crypto.randomUUID(),target:s.targets[index],options:[],index,issuedAt:now};
 const t=c.game==='mapwiz'?mapTarget(s.targets[index]):reference.byId.get(s.targets[index]);if(!t)throw Error('invalid_state');let options=[];
 if(reference){
  const name=t=>reference.labels.get(t.id),seen=new Set([name(t)]),same=reference.groups.get(t.category),candidates=same?.length>=6?same:reference.items,count=c.game==='places'?6:4,chosen=[t],random=new Uint32Array(24);crypto.getRandomValues(random);
  for(const value of random){const o=candidates[value%candidates.length],key=name(o);if(!seen.has(key)){seen.add(key);chosen.push(o);}if(chosen.length===count)break;}
  if(chosen.length<count)for(const o of candidates){const key=name(o);if(!seen.has(key)){seen.add(key);chosen.push(o);}if(chosen.length===count)break;}
  options=shuffle(chosen).map(o=>o.id);
 }
 return {id:crypto.randomUUID(),target:t.id,options,index,issuedAt:now};
}
export function issue(s,now){s.current={...(s.plan?.[s.index]||makeQuestion(s,s.index,now)),issuedAt:now};s.awaitingNext=false;return publicQuestion(s);
}
export function publicQuestion(s){if(s.complete||s.config.game==='countries')return null;return {id:s.current.id,target:s.current.target,options:s.current.options,index:s.index};}
export function create(input,now){
 const c=config(input),s={config:c,index:0,score:0,baseTotal:0,bonusTotal:0,startedAt:now,complete:false,found:[],hints:0,results:[],awaitingNext:false};
 s.targets=shapeQuiz(c.game)?shuffle(shapeTargets(c)):c.game==='mapwiz'?mapRounds(c).map(t=>t.id):c.game==='countries'?data.regions[c.region]:shuffle(pool(c)).map(t=>t.id);
 if(!s.targets.length)throw Error('invalid_config');if(c.game!=='countries'){const reference=questionReference(c);s.plan=s.targets.map((_,i)=>makeQuestion(s,i,now,reference));issue(s,now);}return s;
}
export function distance(a,b){const r=Math.PI/180,h=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lon-a.lon)*r/2)**2;return 6371.0088*2*Math.asin(Math.min(1,Math.sqrt(h)));}
export function mapScore(km,seconds,norway){const perfect=norway?15:90,scale=norway?190:1800,base=km<=perfect?100:100*Math.exp(-(km-perfect)/scale),bonus=seconds>=30?0:10*Math.exp(-Math.max(0,seconds-1)/6.5)*base/100;return {base,bonus,points:base+bonus};}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function answer(s,input,now){
 if(s.complete)throw Error('complete');
 if(s.config.game==='countries'){
  if(typeof input.country!=='string'||!input.country.trim()||input.country.length>100)throw Error('invalid_answer');
  const n=norm(input.country),country=s.targets.find(t=>norm(t)===n||(data.names[t]&&norm(data.names[t])===n));if(!country||s.found.includes(country))return {correct:false};
  s.found.push(country);if(s.found.length===s.targets.length)finish(s,now);return {correct:true,country};
 }
 if(input.question!==s.current.id||s.awaitingNext)throw Error('wrong_question');
 if(shapeQuiz(s.config.game)){
  const name=input.choice;if(!shapeTargets(s.config).includes(name)||s.found.includes(name))throw Error('invalid_answer');
  const correct=name===s.current.target;if(!correct&&!input.skip){s.hints++;s.mistakes=(s.mistakes||0)+1;return {correct:false};}
  if(input.skip&&name!==s.current.target)throw Error('invalid_answer');
  const seconds=Math.max(0,(now-s.current.issuedAt)/1000),band=input.skip?3:Math.max(seconds<=5?0:seconds<=10?1:2,Math.min(s.hints,3)),points=[100,75,50,0][band];
  s.score+=points;s.results.push({name,band,points});s.found.push(name);s.hints=0;s.index++;
  if(s.index===s.targets.length)finish(s,now);else s.awaitingNext=true;return {correct,band,points};
 }
 const t=target(s,s.current.target);
 if(s.config.game==='mapwiz'){
  if(typeof input.lat!=='number'||typeof input.lon!=='number'||!Number.isFinite(input.lat)||!Number.isFinite(input.lon)||Math.abs(input.lat)>90||Math.abs(input.lon)>180)throw Error('invalid_answer');
  const km=distance(input,t),elapsed=Math.max(0,(now-s.current.issuedAt)/1000),points=mapScore(km,elapsed,s.config.categories.length===1&&s.config.categories[0]==='place:Norge');
  s.score+=points.points;s.baseTotal+=points.base;s.bonusTotal+=points.bonus;s.results.push({name:t.name,...points,km});s.index++;
  if(s.index===10)finish(s,now);else s.awaitingNext=true;
  return {correct:true,...points,km,answer:{lat:t.lat,lon:t.lon}};
 }
 if(!s.current.options.includes(input.choice))throw Error('invalid_answer');
 const correct=input.choice===s.current.target;s.index++;if(correct)s.score++;else s.failed=true;
 if(!correct||s.index===s.targets.length)finish(s,now);else issue(s,now);
 return {correct};
}
export function finish(s,now){
 if(s.complete)return;
 if((s.config.game==='mapwiz'&&s.index!==10)||(shapeQuiz(s.config.game)&&s.index!==s.targets.length))throw Error('incomplete');
 if(!shapeQuiz(s.config.game)&&!['countries','mapwiz'].includes(s.config.game)&&!s.failed&&s.index!==s.targets.length)throw Error('incomplete');
 s.complete=true;s.endedAt=now;s.timeMs=Math.max(0,now-s.startedAt);
 if(s.config.game==='countries'){const share=s.found.length/s.targets.length,reference=Math.max(75,s.targets.length*7);s.score=Math.max(0,Math.round(share*1000)+Math.round(share*100*Math.max(0,1-s.timeMs/1000/reference))-s.hints*10);}
}
