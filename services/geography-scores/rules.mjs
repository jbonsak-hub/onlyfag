import data from './data.json' with {type:'json'};
export {data};
const modes=new Set(['flags','capitals','flagcapital','places','countries','mapwiz']);
const variants={flags:['flag-country-mc','country-flag-mc'],capitals:['country-capital-mc','capital-country-mc'],flagcapital:['flag-capital-mc','capital-flag-mc'],places:['desc-place-mc','place-desc-mc']};
export const shuffle=items=>{const a=items.slice();for(let i=a.length-1;i>0;i--){const n=new Uint32Array(1);crypto.getRandomValues(n);const j=n[0]%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
export function config(input){
 if(!input||!modes.has(input.game))throw Error('invalid_config');
 const c={game:input.game,language:input.language==='en'?'en':'no'};
 if(c.game==='mapwiz'){
  if(!Array.isArray(input.categories)||!input.categories.length||input.categories.length>15)throw Error('invalid_config');
  c.categories=[...new Set(input.categories)].sort();if(c.categories.some(k=>!Object.hasOwn(data.mapwiz,k)))throw Error('invalid_config');
 }else if(c.game==='countries'){c.region=input.region||'world';if(!Object.hasOwn(data.regions,c.region))throw Error('invalid_config');}
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
export function issue(s,now){
 const c=s.config,t=target(s,s.targets[s.index]);if(!t)throw Error('invalid_state');
 let options=[];
 if(c.game!=='mapwiz'){
  const field=c.game==='places'?(c.variant==='place-desc-mc'?'explanation':'place'):(c.variant.includes('capital')&&!c.variant.startsWith('capital-')?'capital':c.variant.endsWith('flag-mc')?'flagCode':'country');
  const name=t=>c.language==='en'?(data.names[t[field]]||t[field]):t[field];
  const seen=new Set([name(t)]);let candidates=pool(c);
  if(c.game==='places'){const same=candidates.filter(p=>p.category===t.category);if(same.length>=6)candidates=same;}
  const rest=shuffle(candidates).filter(o=>{const key=name(o);if(seen.has(key))return false;seen.add(key);return true;});
  options=shuffle([t,...rest.slice(0,c.game==='places'?5:3)]).map(o=>o.id);
 }
 s.current={id:crypto.randomUUID(),target:t.id,options,issuedAt:now};s.awaitingNext=false;
 return publicQuestion(s);
}
export function publicQuestion(s){if(s.complete||s.config.game==='countries')return null;return {id:s.current.id,target:s.current.target,options:s.current.options,index:s.index};}
export function create(input,now){
 const c=config(input),s={config:c,index:0,score:0,baseTotal:0,bonusTotal:0,startedAt:now,complete:false,found:[],hints:0,results:[],awaitingNext:false};
 s.targets=c.game==='mapwiz'?mapRounds(c).map(t=>t.id):c.game==='countries'?data.regions[c.region]:shuffle(pool(c)).map(t=>t.id);
 if(!s.targets.length)throw Error('invalid_config');if(c.game!=='countries')issue(s,now);return s;
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
 if(s.config.game==='mapwiz'&&s.index!==10)throw Error('incomplete');
 if(!['countries','mapwiz'].includes(s.config.game)&&!s.failed&&s.index!==s.targets.length)throw Error('incomplete');
 s.complete=true;s.endedAt=now;s.timeMs=Math.max(0,now-s.startedAt);
 if(s.config.game==='countries'){const share=s.found.length/s.targets.length,reference=Math.max(75,s.targets.length*7);s.score=Math.max(0,Math.round(share*1000)+Math.round(share*100*Math.max(0,1-s.timeMs/1000/reference))-s.hints*10);}
}
