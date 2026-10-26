import assert from 'node:assert/strict';
import {test} from 'node:test';
import {questions} from '../prototyper/ernaering/questions.js';
import {organs} from '../prototyper/ernaering/diagram.js';
import {evaluate, accepts, resultRecord, needsReview, mixedOrder} from '../prototyper/ernaering/engine.js';
const ids=organs.map(o=>o.id), processIds=ids.filter(id=>id!=='duodenum');
function answer(q){switch(q.type){case 'anatomy':return ids;case 'choice':return [q.answer];case 'multi':case 'process':return q.answer;case 'sort':return q.items.map(x=>x.group);case 'match':return q.pairs.map(x=>x.right);case 'fill':return q.blanks.map(x=>x.answers[0]);case 'order':return q.items;}}
test('all questions have coherent schemas and every automatic key is accepted',()=>{
 assert.equal(questions.length,67);assert.equal(new Set(questions.map(q=>q.id)).size,67);
 for(const q of questions){for(const key of ['id','title','topic','type','prompt','hint','explanation'])assert.ok(q[key],q.id+': '+key);
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
