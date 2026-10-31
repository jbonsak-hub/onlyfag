import assert from 'node:assert/strict';
import {test} from 'node:test';
import {questions} from '../prototyper/ernaering/questions.js';
import {organs} from '../prototyper/ernaering/diagram.js';
import {figure} from '../prototyper/ernaering/figures.js';
import {evaluate, accepts, resultRecord, needsReview, mixedOrder, pickNext, rememberQuestion, topics, types} from '../prototyper/ernaering/engine.js';
const ids=organs.map(o=>o.id), processIds=ids.filter(id=>id!=='duodenum');
function answer(q){switch(q.type){case 'anatomy':return ids;case 'choice':return [q.answer];case 'multi':case 'process':return q.answer;case 'sort':return q.items.map(x=>x.group);case 'match':return q.pairs.map(x=>x.right);case 'fill':return q.blanks.map(x=>x.answers[0]);case 'order':return q.items;}}
test('all questions have coherent schemas and every automatic key is accepted',()=>{
 assert.ok(questions.length>100, 'expanded bank should cover the attached materials and structures');assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
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
