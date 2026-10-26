/* Run with jsdom available: NODE_PATH=/path/to/node_modules node tests/ernaering-dom.cjs */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const files=['questions.js','diagram.js','engine.js','figures.js','app.js'];
const source=files.map(f=>fs.readFileSync(path.join(root,'prototyper/ernaering',f),'utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'')).join('\n');
function boot({mobile=false,stored,blocked=false}={}){
 const errors=[];const console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'prototyper/ernaering.html'),'utf8'),{url:'https://onlyfag.no/prototyper/ernaering.html',runScripts:'outside-only',virtualConsole:console});const w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.matchMedia=()=>({matches:mobile,addEventListener(){}});
 if(stored)w.localStorage.setItem('onlyfag.nutrition.v1',stored);
 if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('storage unavailable');}});
 w.eval(source+'\nwindow.__qa={questions,organs};');
 const $=s=>w.document.querySelector(s);
 function click(s){const el=$(s);assert.ok(el,`Missing ${s}`);assert.ok(!el.disabled,`Disabled ${s}`);el.click();assert.equal(errors.length,0,errors.map(e=>e.stack).join('\n'));}
 function set(s,value,event='change'){const el=$(s);assert.ok(el,s);el.value=value;el.dispatchEvent(new w.Event(event,{bubbles:true}));assert.equal(errors.length,0,errors.map(e=>e.stack).join('\n'));}
 function open(id){click('#bank-tab');set('#bank-search','', 'input');click(`[data-open="${id}"]`);}
 return {dom,w,$,click,set,open,errors};
}
const t=boot(),{w,$,click,set,open}=t;
const questions=w.__qa.questions,organs=w.__qa.organs;
function fillCorrect(q){
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
for(const q of questions){open(q.id);fillCorrect(q);const status=JSON.parse(w.localStorage.getItem('onlyfag.nutrition.v1')).records[q.id].status;assert.equal(status,q.type==='open'?'self':'independent',q.id+': '+$('#feedback').textContent);}
console.log('67/67 question flows: all nine types completed through DOM controls.');
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
const stored=w.localStorage.getItem('onlyfag.nutrition.v1');const reload=boot({stored});assert.ok(Number(reload.$('#review-count').textContent)>0);reload.dom.window.close();
// Mobile menu, keyboard close, and storage failure fallback.
const mobile=boot({mobile:true});assert.equal(mobile.$('#sidebar').inert,true);mobile.click('#menu-button');assert.equal(mobile.$('.workspace').inert,true);mobile.w.document.dispatchEvent(new mobile.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(mobile.$('.workspace').inert,false);assert.equal(mobile.$('#sidebar').inert,true);mobile.dom.window.close();
const bad=boot({stored:'{broken',blocked:true});assert.match(bad.$('.side-bottom p').textContent,/utilgjengelig/);assert.ok(bad.$('[data-question]'));bad.dom.window.close();
// Reset only this module's history, and cancel keeps progress.
w.localStorage.setItem('other-module','keep');click('#about-button');click('#reset-progress');click('#cancel-reset');assert.ok(Object.keys(JSON.parse(w.localStorage.getItem('onlyfag.nutrition.v1')).records).length);click('#reset-progress');click('#confirm-reset');assert.equal(Object.keys(JSON.parse(w.localStorage.getItem('onlyfag.nutrition.v1')).records).length,0);assert.equal(w.localStorage.getItem('other-module'),'keep');
assert.equal(t.errors.length,0);w.close();console.log('Partial answers, review, reveal, filters, persistence, mobile navigation and isolated reset: passed.');
