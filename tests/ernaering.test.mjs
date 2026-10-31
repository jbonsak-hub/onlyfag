import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {questions, sources} from '../prototyper/ernaering/questions.js';
import {organs} from '../prototyper/ernaering/diagram.js';
import {figure} from '../prototyper/ernaering/figures.js';
import {evaluate, accepts, resultRecord, needsReview, mixedOrder, pickNext, rememberQuestion, topics, types, recordRecentResult, recentSummary} from '../prototyper/ernaering/engine.js';
const ids=organs.map(o=>o.id), processIds=ids.filter(id=>id!=='duodenum');
function answer(q){switch(q.type){case 'anatomy':return ids;case 'choice':return [q.answer];case 'multi':case 'process':return q.answer;case 'sort':return q.items.map(x=>x.group);case 'match':return q.pairs.map(x=>x.right);case 'fill':return q.blanks.map(x=>x.answers[0]);case 'order':return q.items;}}
test('all questions have coherent schemas and every automatic key is accepted',()=>{
 assert.ok(questions.length>0, 'the scoped bank contains exercises');assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
 for(const q of questions){for(const key of ['id','title','topic','type','prompt','hint','explanation'])assert.ok(q[key],q.id+': '+key);
  assert.ok(topics[q.topic],q.id+': known topic');assert.ok(types[q.type],q.id+': known type');
  if(q.figure)assert.match(figure(q.figure),/<svg\b/,q.id+': figure must render');
  if(q.options)assert.equal(new Set(q.options).size,q.options.length,q.id+': distinct alternatives');
  if(q.type==='open'){assert.ok(q.model);assert.ok(q.checklist.length);continue;}
  assert.ok(evaluate(q,answer(q),q.type==='anatomy'?ids:processIds).correct,q.id);
  if(q.type==='process'){assert.ok(q.answer.every(id=>processIds.includes(id)));}
  if(q.type==='choice')assert.ok(q.options.includes(q.answer));
  if(q.type==='multi')assert.ok(q.answer.every(x=>q.options.includes(x)));
  if(q.type==='match')assert.equal(new Set(q.pairs.map(p=>p.right)).size,q.pairs.length);
 }
});
test('incomplete/incorrect and extra selections are not accepted',()=>{
 for(const q of questions.filter(q=>q.type!=='open'))assert.equal(evaluate(q,[],q.type==='anatomy'?ids:processIds).correct,false,q.id);
 const q=questions.find(q=>q.id==='energy-fuels');assert.equal(evaluate(q,[...q.answer,'Vann']).correct,false);
 const sort=questions.find(q=>q.type==='sort');const values=answer(sort);values[0]='feil';const result=evaluate(sort,values);assert.equal(result.marks[0],false);assert.equal(result.count,values.length-1);
});
test('short answers normalize case, Unicode, decimal comma and units without fuzzy grading',()=>{
 assert.ok(accepts('  H₂O  ',{answers:['h2o']}));assert.ok(accepts('40,0 kcal',{answers:['40'],unit:'kcal'}));assert.ok(accepts('51 %',{answers:['51'],unit:'%'}));assert.ok(!accepts('140 extra',{answers:['140']}));assert.ok(!accepts('',{answers:['0']}));assert.ok(!accepts('peps',{answers:['pepsin']}));
});
test('assistance, immediate repeats, self-assessment and spaced review stay distinct',()=>{
 const now=1000000000;
 const assisted=resultRecord({}, {assisted:true,correct:true,completed:true},now);assert.equal(assisted.status,'review');
 const retry=resultRecord(assisted,{correct:true,completed:true},now+1000);assert.equal(retry.status,'review');
 const later=resultRecord(assisted,{correct:true,completed:true},now+610000);assert.equal(later.status,'independent');assert.equal(needsReview(later,now+610001),false);assert.equal(needsReview(later,later.due),true);
 const self=resultRecord({}, {self:true,confident:true,completed:true},now);assert.equal(self.status,'self');assert.equal(self.mode,'self');
 assert.equal(resultRecord({}, {self:true,confident:false,completed:true},now).status,'review');
});
test('order exercises start different from the answer',()=>{for(let n=0;n<100;n++){const a=['A','B','C','D'];assert.notDeepEqual(mixedOrder(a),a);}});

// Rotation is tested with a small synthetic pool so selection invariants do not
// depend on the current size/order of the teaching bank.
const rotationPool=Array.from({length:24},(_,i)=>({id:`q${i}`,family:`family${i%6}`}));
function rng(seed=17){return ()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);}
test('rotation completes each eligible pool before repeating and avoids the last ten ids',()=>{
 let rotation={seen:[],recent:[]};const random=rng(),cycle=new Set(),recent=[];
 for(let i=0;i<120;i++){
  const q=pickNext(rotationPool,rotation,{},random);assert.ok(q);
  assert.ok(!recent.slice(-10).includes(q.id),'recent exact repeat: '+q.id);
  assert.ok(!cycle.has(q.id),'item repeated before eligible pool exhausted: '+q.id);
  cycle.add(q.id);recent.push(q.id);rememberQuestion(rotation,q);
  // JSON roundtripping exercises the same persistent state as a page reload.
  rotation=JSON.parse(JSON.stringify(rotation));
  if(cycle.size===rotationPool.length)cycle.clear();
 }
});
test('rotation avoids recently shown similar families when an unseen alternative exists',()=>{
 const rotation={seen:[],recent:[]},random=rng(91),recent=[];let cycle=[];
 for(let i=0;i<96;i++){
  const eligible=rotationPool.filter(q=>!cycle.includes(q.id));
  if(!eligible.length)cycle=[];
  const unseen=rotationPool.filter(q=>!cycle.includes(q.id));
  const lastFamilies=recent.slice(-3).map(q=>q.family);
  // Apply exact-item cooldown before determining whether a family alternative exists.
  const outsideExact=unseen.filter(q=>!recent.slice(-10).some(r=>r.id===q.id));
  const familyAlternative=outsideExact.filter(q=>!lastFamilies.includes(q.family));
  const q=pickNext(rotationPool,rotation,{},random);assert.ok(q);
  if(familyAlternative.length)assert.ok(!lastFamilies.includes(q.family),'family repeated despite available alternative: '+q.id);
  recent.push(q);cycle.push(q.id);rememberQuestion(rotation,q);
 }
});
test('rotation handles empty and tiny filtered pools without getting stuck',()=>{
 assert.equal(pickNext([],{seen:[],recent:[]}),null);
 const rotation={seen:[],recent:[]};const one=[{id:'only',family:'only'}];
 for(let i=0;i<5;i++){const q=pickNext(one,rotation);assert.equal(q.id,'only');rememberQuestion(rotation,q);}
 const pair=[{id:'a',family:'same'},{id:'b',family:'same'}];const small={seen:[],recent:[]};let previous;
 for(let i=0;i<12;i++){const q=pickNext(pair,small);assert.notEqual(q.id,previous);rememberQuestion(small,q);previous=q.id;}
});
test('changing filters preserves rotation for other topics and does not re-offer an unseen-pool item',()=>{
 const rotation={seen:[],recent:[]};
 rememberQuestion(rotation,{id:'outside',family:'outside'});
 rememberQuestion(rotation,{id:'a',family:'a'});
 const pool=[{id:'a',family:'a'},{id:'b',family:'b'}];
 assert.equal(pickNext(pool,rotation,{},()=>0).id,'b');
 rememberQuestion(rotation,pool[1]);
 const q=pickNext(pool,rotation,{},()=>0);assert.ok(pool.some(x=>x.id===q.id));
 assert.ok(rotation.seen.includes('outside'),'cycling filtered pool must retain unrelated history');
});

test('nutrition stays within the taught scope and uses plain visible terminology',()=>{
 const banned=/Fehling|biuret|jodtest|jodfarge|fettekstraksjon|Fischer|metylend|esterbinding|esterforbindelse|glykosid|hydrolys|mikrovilli|lipase|lysin|peristaltikk|[αβ]|lærerens/i;
 for(const q of questions){
  const {id,figure:key,family,source,...visible}=q;
  assert.doesNotMatch(JSON.stringify(visible),banned,id);
  if(key)assert.doesNotMatch(figure(key),banned,id+': figure');
 }
 assert.doesNotMatch(JSON.stringify(sources),/lærerens/i);
 for(const id of ['ndla-fehling-inference','ndla-fehling-controls','ndla-iodine-reversible','ndla-biuret-observation','ndla-saliva-maltose','ndla-saliva-compare','structure-hydrogenation','structure-structure-compare','structure-glycosidic-name','structure-condensation-formula','structure-omega-end','structure-omega-inference'])assert.ok(!questions.some(q=>q.id===id));
 const drawing=figure('polysaccharides');
 for(const name of ['Stivelse','Glykogen','Cellulose'])assert.ok(drawing.includes(name),name+' is named in the model');
});


test('visual questions retain the reasoning for feedback rather than pre-answer copy',()=>{
 for(const q of questions.filter(q=>q.type==='process')){
  for(const id of q.answer){
   const organ=organs.find(o=>o.id===id);assert.ok(organ,q.id);
   assert.ok(!q.prompt.toLocaleLowerCase('nb').includes(organ.label.toLocaleLowerCase('nb')),q.id+': target organ must not be named in the question');
  }
 }
 const saturated=questions.find(q=>q.id==='structure-acid-saturation');
 if(saturated)assert.doesNotMatch(saturated.prompt,/C=C|C=O|dobbeltbinding/i,'saturation question should ask for classification without explaining the key');
 const omega=questions.filter(q=>q.figure==='omega');
 assert.ok(omega.length,'omega structure reasoning remains available');
 for(const q of omega){
  assert.match(q.prompt,/omegafettsyre|omega.?syre/i,'ask for the fatty acid type, not a counting convention');
  assert.ok(q.type==='choice'&&q.options.length>=3,'plausible omega alternatives');
 }
 const omegaCaption=figure('omega').match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1]||'';
 assert.doesNotMatch(omegaCaption,/tell|motsatt|første|omega.?[369]/i,'omega method belongs to feedback');
});

test('recognition figures use rings and fully drawn fatty acids',()=>{
 const sugar=figure('sugar-rings');assert.match(sugar,/<svg\b/,'ring sugar figure is present');
 assert.doesNotMatch(sugar,/åpen kjede|åpne kjeder|Fischer/i);
 for(const name of ['Glukose','Fruktose','Galaktose'])assert.ok(sugar.includes(name),name+' ring is named');
 for(const key of ['glycerol-acid','fat-chains','omega','cis-trans','triglyceride']){
  const drawing=figure(key);assert.match(drawing,/<svg\b/,key);
  assert.doesNotMatch(drawing,/\(CH[₂2]\)|\(CH<[^>]*>2|hydrogen[^<]{0,25}utelatt|skjelettform/i,key+': carbon/hydrogen chain must be expanded');
 }
});


test('the nutrient map retains only the four requested fixed clues',()=>{
 const drawing=figure('nutrient-map');
 for(const fixed of ['Monosakkarider','Umettet','Vitaminer','Aminosyrer'])assert.ok(drawing.includes(fixed),fixed+' remains visible');
 const text=[...drawing.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(m=>m[1].replace(/<[^>]+>/g,'').trim());
 for(const missing of ['Gir energi','Karbohydrater','Disakkarider','Polysakkarider','Proteiner','Fett','Mettet','Gir ikke energi','Mineraler','Vann'])assert.ok(!text.includes(missing),missing+' is a blank rather than an answer printed on the map');
 const task=questions.find(q=>q.id==='nutrient-concept-map');assert.ok(task&&task.pairs.length===10,'the ten blank nodes all have answer controls');
});


test('carbohydrate sorting is consolidated into one complete task',()=>{
 const sorting=questions.filter(q=>q.topic==='carbs'&&q.type==='sort'&&q.items.some(x=>/glukose/i.test(x.label)));
 assert.equal(sorting.length,1,'do not retain simpler duplicates of the same sugar sorting');
 const labels=sorting[0].items.map(x=>x.label).join(' ');
 for(const name of ['Glukose','Fruktose','Galaktose','Maltose','Laktose','Sukrose','Cellulose','Kostfiber','Stivelse','Glykogen'])assert.match(labels,new RegExp(name,'i'),name+' is included');
});

test('expanded fatty-acid drawings obey ordinary C/H/O valences',()=>{
 for(const key of ['glycerol-acid','fat-chains','omega','cis-trans','triglyceride','fat-bonds']){
  const drawing=figure(key);
  // Atom labels are centered on the chemical position, with a normal baseline
  // shift of .3em. Each drawn line represents one bond (two for C=O/C=C).
  const atoms=[...drawing.matchAll(/<rect\b[^>]*\/><text x="([^"]+)" y="([^"]+)" font-size="([^"]+)"[^>]*>(C|H|O)<\/text>/g)].map(m=>({x:Number(m[1]),y:Number(m[2])-Number(m[3])*.3,symbol:m[4]}));
  const lines=[...drawing.matchAll(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"[^>]*\/>/g)].map(m=>m.slice(1,5).map(Number));
  assert.ok(atoms.length>10,key+': expanded atom model is present');
  for(const atom of atoms){
   const bonds=lines.filter(([x1,y1,x2,y2])=>Math.hypot(x1-atom.x,y1-atom.y)<=12||Math.hypot(x2-atom.x,y2-atom.y)<=12).length;
   assert.equal(bonds,{C:4,H:1,O:2}[atom.symbol],key+': '+atom.symbol+' at '+atom.x+','+atom.y+' has its normal bond count');
  }
 }
});


test('help and page copy obey the same taught-vocabulary limits as questions',()=>{
 const html=readFileSync(new URL('../prototyper/ernaering.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/esterbinding|esterforbindelse|glykosid|hydrolys|mikrovilli|lipase|lysin|peristaltikk|Fischer|metylend|[αβ]|lærerens/i);
});


test('nutrition topics follow the requested subject order',()=>{
 assert.deepEqual(Object.keys(topics),['carbs','protein','fat','micro','digestion','energy']);
});

test('recent-answer percentages use each topic and the combined window independently',()=>{
 assert.deepEqual(recentSummary({},'carbs'),{percent:null,count:0,correct:0});
 let history={};
 history=recordRecentResult(history,'carbs',true,100);
 history=recordRecentResult(history,'protein',false,200);
 history=recordRecentResult(history,'carbs',false,300);
 assert.deepEqual(recentSummary(history,'carbs'),{percent:50,count:2,correct:1});
 assert.deepEqual(recentSummary(history,'protein'),{percent:0,count:1,correct:0});
 assert.deepEqual(recentSummary(history,'all'),{percent:33,count:3,correct:1});
 assert.deepEqual(recentSummary(history,'energy'),{percent:null,count:0,correct:0});
});

test('recent-answer windows retain only the latest twenty and preserve prior history',()=>{
 const original=Object.freeze({carbs:Object.freeze([{ok:true,t:1}]),all:Object.freeze([{ok:true,t:1}])});
 const changed=recordRecentResult(original,'protein',false,2);
 assert.deepEqual(original,{carbs:[{ok:true,t:1}],all:[{ok:true,t:1}]},'recording does not mutate prior state');
 assert.notEqual(changed,original);
 assert.deepEqual(recentSummary(changed,'protein'),{percent:0,count:1,correct:0});
 let history={};
 for(let i=0;i<27;i++)history=recordRecentResult(history,'carbs',i%4!==0,1000+i);
 assert.equal(history.carbs.length,20);assert.equal(history.all.length,20);
 assert.equal(history.carbs[0].t,1007);assert.equal(history.carbs.at(-1).t,1026);
 assert.deepEqual(recentSummary(history,'carbs'),{percent:75,count:20,correct:15});
 const extended=recordRecentResult(history,'fat',false,3000);
 assert.equal(extended.carbs.length,20);assert.equal(extended.fat.length,1);assert.equal(extended.all.length,20);
 assert.equal(extended.all[0].t,1008);assert.equal(extended.all.at(-1).t,3000);
 assert.deepEqual(recentSummary(extended,'carbs'),{percent:75,count:20,correct:15});
 assert.deepEqual(recentSummary(extended,'all'),{percent:70,count:20,correct:14});
});


test('sources and help are professional and independent of a particular class',()=>{
 const classReferences=/presentasj|powerpoint|vedlag|vedlegg|lærer|\b2016\b|prøven|prøveark|i timen|mine timer|min undervisning/i;
 assert.doesNotMatch(JSON.stringify(sources),classReferences,'source list must not refer to private classroom material');
 const html=readFileSync(new URL('../prototyper/ernaering.html',import.meta.url),'utf8');
 const help=html.match(/<dialog id="about-dialog"[\s\S]*?<\/dialog>/)?.[0];
 assert.ok(help,'the help/source dialog exists');
 assert.doesNotMatch(help,classReferences,'static source fallback and help must work for any learner');
 for(const source of sources){assert.ok(source.title&&source.url,'each short reference has a title and an external link');assert.match(source.url,/^https:\/\//);}
});
