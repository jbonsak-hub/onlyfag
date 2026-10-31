/* Run with jsdom + esbuild available through NODE_PATH; no app dependencies are required. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const {buildSync}=require('esbuild');
// Bundle real ESM imports instead of stripping them: independent question banks
// and figure helpers must retain their own module scopes.
const source=buildSync({stdin:{contents:`import './prototyper/ernaering/app.js';import {questions} from './prototyper/ernaering/questions.js';import {organs} from './prototyper/ernaering/diagram.js';window.__qa={questions,organs};`,resolveDir:root},bundle:true,write:false,format:'iife',platform:'browser'}).outputFiles[0].text;
function boot({mobile=false,stored,blocked=false}={}){
 const errors=[];const console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'prototyper/ernaering.html'),'utf8'),{url:'https://onlyfag.no/prototyper/ernaering.html',runScripts:'outside-only',virtualConsole:console});const w=dom.window;
 w.scrollTo=function(){};w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.matchMedia=()=>({matches:mobile,addEventListener(){}});
 if(stored)w.localStorage.setItem('onlyfag.nutrition.v1',stored);
 if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('storage unavailable');}});
 w.eval(source);
 const $=s=>w.document.querySelector(s);
 function click(s){const el=$(s);assert.ok(el,`Missing ${s}`);assert.ok(!el.disabled,`Disabled ${s}`);el.click();assert.equal(errors.length,0,errors.map(e=>e.stack).join('\n'));}
 function set(s,value,event='change'){const el=$(s);assert.ok(el,s);el.value=value;el.dispatchEvent(new w.Event(event,{bubbles:true}));assert.equal(errors.length,0,errors.map(e=>e.stack).join('\n'));}
 function open(id){click('#bank-tab');set('#bank-search','', 'input');click(`[data-open="${id}"]`);}
 return {dom,w,$,click,set,open,errors};
}
const t=boot(),{w,$,click,set,open}=t;
const questions=w.__qa.questions,organs=w.__qa.organs;
assert.equal([...w.document.querySelectorAll('#topics [data-topic]')].at(-1).dataset.topic,'all','Mixed practice is last in the topic list');
assert.equal(w.document.querySelector('[data-topic=figures]'),null,'Figure exercises belong to their subject topics');
assert.deepEqual([...w.document.querySelectorAll('#topics [data-topic]')].map(el=>el.dataset.topic),['carbs','protein','fat','micro','digestion','energy','all'],'Digestion is before energy; mixed practice is last');
function fillCorrect(q,context=t){
 const {w,$,click,set}=context;
 if(q.type==='anatomy'){for(const o of organs){click(`[data-label="${o.id}"]`);click(`[data-target="${o.id}"]`);}}
 if(q.type==='choice'||q.type==='multi'){const answers=q.type==='choice'?[q.answer]:q.answer;for(const answer of answers){const buttons=[...w.document.querySelectorAll('[data-option]')];buttons.find(b=>b.textContent.slice(1)===answer||b.querySelector('span:last-child').textContent===answer).click();}}
 if(q.type==='process')for(const id of q.answer)click(`#process-${id}`);
 if(q.type==='sort'||q.type==='match'||q.type==='fill'){
  const rows=q.type==='sort'?q.items:q.type==='match'?q.pairs:q.blanks;
  rows.forEach((r,i)=>set(`#row-${i}`,q.type==='sort'?r.group:q.type==='match'?r.right:r.answers[0],q.type==='fill'?'input':'change'));
 }
 if(q.type==='order'){
  for(let i=0;i<q.items.length;i++){
   const current=()=>[...w.document.querySelectorAll('.sequence li>span')].map(e=>e.childNodes[0].textContent.trim());
   let index=current().indexOf(q.items[i]);while(index>i){click(`#up-${index}`);index--;}
  }
 }
 if(q.type==='open'){set('#open-answer','Min forklaring med sammenheng mellom oppbygning, funksjon og prosess.','input');click('#show-model');q.checklist.forEach((_,i)=>{const el=$(`[data-self-check="${i}"]`);el.checked=true;el.dispatchEvent(new w.Event('change',{bubbles:true}));});click('#self-confident');}else click('#check-answer');
}
for(const q of questions){open(q.id);assert.equal($('.open-model'),null,q.id+': model answer stays hidden before answering');assert.equal($('.feedback'),null,q.id+': no feedback before an attempt');assert.equal(w.document.querySelectorAll('.exercise .correct').length,0,q.id+': correct markings are not prefilled');fillCorrect(q);const status=JSON.parse(w.localStorage.getItem('onlyfag.nutrition.v1')).records[q.id].status;assert.equal(status,q.type==='open'?'self':'independent',q.id+': '+$('#feedback').textContent);}
console.log(`${questions.length}/${questions.length} question flows completed through DOM controls.`);
// Partial fill preserves the right answer and prevents a retry being counted as unaided.
open('digestion-stomach-contents');set('#row-0','Saltsyre','input');set('#row-1','amylase','input');click('#check-answer');assert.ok($('#row-0').disabled);assert.ok(!$('#row-1').disabled);set('#row-1','pepsin','input');click('#check-answer');assert.match($('#feedback-title').textContent,/etter øving/);
// Hint and reveal do not create mastery, including immediately retrying a revealed answer.
open('digestion-enzyme');click('#show-hint');fillCorrect(questions.find(q=>q.id==='digestion-enzyme'));assert.match($('#feedback-title').textContent,/etter øving/);
open('fat-process-breakdown');assert.equal($('#target-duodenum'),null);assert.ok($('#process-small').textContent.includes('tolvfingertarm'));click('#reveal-answer');assert.match($('#feedback-title').textContent,/Fasit vist/);click('#retry-question');fillCorrect(questions.find(q=>q.id==='fat-process-breakdown'));assert.match($('#feedback-title').textContent,/etter øving/);
// Anatomy unique assignments and locking. Change the final answer only.
open('digestion-anatomy');organs.forEach((o,i)=>set(`#row-${i}`,organs[(i+1)%organs.length].label));set('#row-0','Munn');set('#row-9','Spiserør'); // ensure every slot is populated below
for(let i=1;i<10;i++)set(`#row-${i}`,organs[i===9?1:i+1].label);
click('#check-answer');assert.ok($('#row-0').disabled);assert.ok(!$('#row-1').disabled);
// Multi: retain right selected items, allow the wrong one to be removed.
open('energy-fuels');click([...w.document.querySelectorAll('[data-option]')].find(b=>b.textContent.includes('Karbohydrater')).id?'#'+[...w.document.querySelectorAll('[data-option]')].find(b=>b.textContent.includes('Karbohydrater')).id:'');
const wrong=[...w.document.querySelectorAll('[data-option]')].find(b=>b.textContent.includes('Vann'));wrong.click();click('#check-answer');assert.ok([...w.document.querySelectorAll('[data-option]')].find(b=>b.textContent.includes('Karbohydrater')).disabled);assert.ok(![...w.document.querySelectorAll('[data-option]')].find(b=>b.textContent.includes('Vann')).disabled);
// Open answers require writing and checklist; no keyword matching.
open('protein-quality');click('#show-model');assert.equal($('.open-model'),null);set('#open-answer','Et helt fritt formulert svar.','input');click('#show-model');click('#self-confident');assert.match($('#feedback-title').textContent,/kjennetegn/);click('#self-review');assert.match($('#feedback-title').textContent,/repetisjon/);
// Filtering and empty state.
click('#bank-tab');set('#type-filter','anatomy');assert.equal(w.document.querySelectorAll('.bank-row').length,1);set('#bank-search','ingen_slike_ord','input');assert.equal(w.document.querySelectorAll('.bank-row').length,0);set('#bank-search','', 'input');set('#type-filter','all');
// Presented/skipped questions count in rotation, and reload does not restart the pool.
const rotationFlow=boot();const shown=[];
for(let i=0;i<15;i++){
 const id=rotationFlow.$('[data-question]').dataset.question;
 assert.ok(!shown.includes(id),'skipped question repeated before completing the pool');shown.push(id);
 rotationFlow.click('#next-question');
}
assert.equal(rotationFlow.$('#filter-bar').hidden,true,'filters should be secondary by default');
rotationFlow.click('#filter-toggle');assert.equal(rotationFlow.$('#filter-bar').hidden,false);
rotationFlow.click('#filter-toggle');assert.equal(rotationFlow.$('#filter-bar').hidden,true);
const rotationStored=rotationFlow.w.localStorage.getItem('onlyfag.nutrition.v1');
const reloadedRotation=boot({stored:rotationStored});
assert.ok(!shown.includes(reloadedRotation.$('[data-question]').dataset.question),'reload should preserve recent history and continue to an unseen question');
rotationFlow.dom.window.close();reloadedRotation.dom.window.close();
const stored=w.localStorage.getItem('onlyfag.nutrition.v1');const reload=boot({stored});assert.ok(Number(reload.$('#review-count').textContent)>0);reload.dom.window.close();
// Mobile menu, keyboard close, and storage failure fallback.
const mobile=boot({mobile:true});assert.equal(mobile.$('#sidebar').inert,true);mobile.click('#menu-button');assert.equal(mobile.$('.workspace').inert,true);mobile.w.document.dispatchEvent(new mobile.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(mobile.$('.workspace').inert,false);assert.equal(mobile.$('#sidebar').inert,true);mobile.dom.window.close();
const bad=boot({stored:'{broken',blocked:true});assert.match(bad.$('.side-bottom p').textContent,/utilgjengelig/);assert.ok(bad.$('[data-question]'));bad.dom.window.close();
// Reset only this module's history, and cancel keeps progress.
w.localStorage.setItem('other-module','keep');click('#about-button');click('#reset-progress');click('#cancel-reset');assert.ok(Object.keys(JSON.parse(w.localStorage.getItem('onlyfag.nutrition.v1')).records).length);click('#reset-progress');click('#confirm-reset');assert.equal(Object.keys(JSON.parse(w.localStorage.getItem('onlyfag.nutrition.v1')).records).length,0);assert.equal(w.localStorage.getItem('other-module'),'keep');
// Percentages count only the first valid automatic answer in each presentation.
// Use fresh contexts rather than the full-bank completion run above.
const scores=boot();
const scoreData=()=>JSON.parse(scores.w.localStorage.getItem('onlyfag.nutrition.v1')).recentResults;
const snapshot=()=>JSON.stringify(scoreData());
const auto=questions.find(q=>q.type==='choice'&&q.topic==='carbs');
assert.ok(auto,'a carbohydrate choice exercise exists');
function chooseOption(flow,value){
 const button=[...flow.w.document.querySelectorAll('[data-option]')].find(el=>el.querySelector('span:last-child').textContent===value);
 assert.ok(button,'option exists: '+value);button.click();
}
scores.open(auto.id);
const beforeIncomplete=snapshot();scores.click('#check-answer');
assert.equal(snapshot(),beforeIncomplete,'checking an empty answer does not count');
scores.click('#next-question');assert.equal(snapshot(),beforeIncomplete,'skipping does not count');
scores.open(auto.id);
chooseOption(scores,auto.options.find(value=>value!==auto.answer));scores.click('#check-answer');
assert.equal(scoreData().carbs.length,1);assert.equal(scoreData().carbs[0].ok,false);
chooseOption(scores,auto.answer);scores.click('#check-answer');
assert.equal(scoreData().carbs.length,1,'fixing the same question does not inflate the denominator');
assert.equal(scoreData().carbs[0].ok,false,'fixing the same question does not replace the first wrong answer');
assert.match(scores.$('[data-topic="carbs"] .topic-count').textContent,/0\s*%/,'the topic badge shows the percentage');
scores.click('#retry-question');chooseOption(scores,auto.answer);scores.click('#check-answer');
assert.equal(scoreData().carbs.length,2,'explicit fresh retry is another presentation');
assert.equal(scoreData().carbs.at(-1).ok,false,'a retry immediately after help is assisted');
const proteinAuto=questions.find(q=>q.type==='choice'&&q.topic==='protein');
scores.open(proteinAuto.id);scores.click('#show-hint');chooseOption(scores,proteinAuto.answer);scores.click('#check-answer');
assert.equal(scoreData().protein.length,1);assert.equal(scoreData().protein[0].ok,false,'hint-assisted correct answer does not count as independent correctness');
const fatAuto=questions.find(q=>q.type==='choice'&&q.topic==='fat');
scores.open(fatAuto.id);scores.click('#reveal-answer');
assert.equal(scoreData().fat.length,1);assert.equal(scoreData().fat[0].ok,false,'reveal before answering counts once as assisted');
const afterReveal=snapshot();scores.click('#bank-tab');scores.click('#practice-tab');
assert.equal(snapshot(),afterReveal,'rendering tabs does not record another result');
const openTask=questions.find(q=>q.type==='open');
scores.open(openTask.id);const beforeOpen=snapshot();fillCorrect(openTask,scores);
assert.equal(snapshot(),beforeOpen,'written responses and self-assessment are excluded');
scores.open(openTask.id);scores.click('#reveal-answer');assert.equal(snapshot(),beforeOpen,'revealing a written model is also excluded');
const scoreSaved=scores.w.localStorage.getItem('onlyfag.nutrition.v1');
const scoreReload=boot({stored:scoreSaved});
assert.deepEqual(JSON.parse(scoreReload.w.localStorage.getItem('onlyfag.nutrition.v1')).recentResults,scoreData(),'per-topic answer history survives reload');
assert.match(scoreReload.$('[data-topic="protein"] .topic-count').textContent,/0\s*%/);
scoreReload.dom.window.close();
// Historical completion records cannot reconstruct the previous twenty answers.
const migrated=boot({stored:JSON.stringify({version:1,records:{[auto.id]:{status:'independent',completed:true,attempts:30,last:100}},lastId:auto.id})});
assert.equal(Object.values(JSON.parse(migrated.w.localStorage.getItem('onlyfag.nutrition.v1')).recentResults).flat().length,0,'migration does not invent past answer sequences');
assert.match(migrated.$('[data-topic="carbs"] .topic-count').textContent,/—/,'empty recent-answer window has no percentage');
migrated.dom.window.close();
// A complete correct answer creates a 100% window only in the applicable topic.
const independent=boot();independent.open(auto.id);fillCorrect(auto,independent);
const firstResults=JSON.parse(independent.w.localStorage.getItem('onlyfag.nutrition.v1')).recentResults;
assert.equal(firstResults.carbs.length,1);assert.equal(firstResults.carbs[0].ok,true);assert.equal(firstResults.all.length,1);
assert.match(independent.$('[data-topic="carbs"] .topic-count').textContent,/100\s*%/);
assert.match(independent.$('[data-topic="protein"] .topic-count').textContent,/—/);
independent.w.localStorage.setItem('chemistryProgressV18','keep-chemistry');
independent.click('#about-button');independent.click('#reset-progress');independent.click('#confirm-reset');
assert.equal(Object.values(JSON.parse(independent.w.localStorage.getItem('onlyfag.nutrition.v1')).recentResults).flat().length,0,'reset clears recent-answer windows');
assert.equal(independent.w.localStorage.getItem('chemistryProgressV18'),'keep-chemistry','nutrition reset leaves chemistry history untouched');
independent.dom.window.close();scores.dom.window.close();
assert.equal(t.errors.length,0);w.close();console.log('Partial answers, review, reveal, filters, persistence, mobile navigation, isolated reset and last-twenty percentages: passed.');
