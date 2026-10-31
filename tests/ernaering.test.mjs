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
  if(q.figure)assert.match(figure(q.figure),/<(?:svg|img)\b/,q.id+': figure must render');
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

// Read the actual atom groups and bond endpoints, rather than assuming that a
// figure's key or description proves its chemistry. OH and CH₂OH are familiar
// groups with one external bond; their internal atoms still count in formulas.
function recognitionGraph(key){
 const drawing=figure(key);
 const atoms=[...drawing.matchAll(/<rect\b[^>]*\/><text\b([^>]*)>([^<]+)<\/text>/g)].map(match=>{
  const attrs=Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  return {x:Number(attrs.x),y:Number(attrs.y)-Number(attrs['font-size'])*.3,symbol:match[2]};
 });
 assert.ok(atoms.length,key+': atom groups are present');
 const edges=new Map();
 for(const line of drawing.matchAll(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"[^>]*\/>/g)){
  const endpoints=[[Number(line[1]),Number(line[2])],[Number(line[3]),Number(line[4])]].map(([x,y])=>{
   const nearby=atoms.map((atom,index)=>({index,distance:Math.hypot(x-atom.x,y-atom.y)})).filter(atom=>atom.distance<=12).sort((a,b)=>a.distance-b.distance);
   assert.ok(nearby.length,key+': each bond endpoint joins an atom group');
   return nearby[0].index;
  }).sort((a,b)=>a-b);
  assert.notEqual(endpoints[0],endpoints[1],key+': a bond connects two different atoms');
  const id=endpoints.join(':');
  const edge=edges.get(id)||{a:endpoints[0],b:endpoints[1],order:0};
  edge.order++;edges.set(id,edge);
 }
 const bonds=[...edges.values()];
 const neighbors=index=>bonds.flatMap(edge=>edge.a===index?[edge.b]:edge.b===index?[edge.a]:[]);
 const groups={C:{C:1},H:{H:1},O:{O:1},N:{N:1},OH:{O:1,H:1},'CH₂OH':{C:1,H:3,O:1}};
 const valences={C:4,H:1,O:2,N:3,OH:1,'CH₂OH':1};
 const formula={};
 atoms.forEach((atom,index)=>{
  assert.ok(groups[atom.symbol],key+': known atom group '+atom.symbol);
  for(const [element,count] of Object.entries(groups[atom.symbol]))formula[element]=(formula[element]||0)+count;
  const order=bonds.filter(edge=>edge.a===index||edge.b===index).reduce((sum,edge)=>sum+edge.order,0);
  assert.equal(order,valences[atom.symbol],key+': '+atom.symbol+' at '+atom.x+','+atom.y+' has its ordinary external bond count');
 });
 // Removing a ring bond leaves an alternate path around that same ring. The
 // two rings of sucrose are joined by a bridge and are recovered separately.
 const cycles=new Map();
 for(const removed of bonds){
  const queue=[[removed.a]],seen=new Set([removed.a]);
  while(queue.length){
   const current=queue.shift(),last=current.at(-1);
   if(last===removed.b){const nodes=[...current].sort((a,b)=>a-b);cycles.set(nodes.join(':'),nodes);break;}
   for(const next of neighbors(last)){
    if((last===removed.a&&next===removed.b)||(last===removed.b&&next===removed.a)||seen.has(next))continue;
    seen.add(next);queue.push([...current,next]);
   }
  }
 }
 return {atoms,bonds,neighbors,formula,cycles:[...cycles.values()]};
}

test('new naming tasks cover the requested molecules without printing their names on the figures',()=>{
 const naming=questions.filter(q=>q.id.startsWith('recognition-'));
 assert.equal(naming.length,8,'six focused naming tasks and two mixed matching tasks');
 const focused=naming.filter(q=>q.type==='choice');
 assert.deepEqual(focused.map(q=>q.answer).sort(),['Glyserol','Fettsyre','Aminosyre','Glukose','Stivelse','Sukrose'].sort());
 const mixed=naming.filter(q=>q.type==='match');assert.equal(mixed.length,2);
 for(const q of naming){
  assert.ok(q.figure?.startsWith('recognition-'),q.id+': original structure figure');
  const before=q.title+' '+q.prompt+' '+figure(q.figure);
  assert.doesNotMatch(before,/glyserol|fettsyre|aminosyre|glukose|fruktose|sukrose|maltose|stivelse|glykogen|cellulose/i,q.id+': no answer name in heading, prompt, SVG description or caption');
 }
 const starch=focused.find(q=>q.answer==='Stivelse');
 assert.match(starch.prompt,/plant|potet/i,'a chain sketch needs plant-storage context to distinguish starch from glycogen');
 assert.match(starch.prompt,/energilager|lagr/i);
 assert.ok(mixed.some(q=>q.pairs.some(pair=>/proteiner/.test(pair.right))));
 assert.ok(mixed.some(q=>q.pairs.some(pair=>/fett/.test(pair.right))));
});

test('new molecular drawings have correct formulas, valences and sugar rings',()=>{
 for(const [key,formula,ringSizes] of [
  ['recognition-glycerol',{C:3,H:8,O:3},[]],
  ['recognition-fatty-acid',{C:8,H:16,O:2},[]],
  ['recognition-amino-acid',{C:2,H:5,N:1,O:2},[]],
  ['recognition-glucose',{C:6,H:12,O:6},[6]],
  ['recognition-sucrose',{C:12,H:22,O:11},[5,6]]
 ]){
  const graph=recognitionGraph(key);
  assert.deepEqual(graph.formula,formula,key+': formula includes atoms inside OH/CH₂OH groups');
  assert.deepEqual(graph.cycles.map(cycle=>cycle.length).sort(),ringSizes,key+': sugars use the taught ring structures');
  for(const cycle of graph.cycles)assert.equal(cycle.filter(index=>graph.atoms[index].symbol==='O').length,1,key+': each sugar ring contains one oxygen');
 }
 // C2/C4 OH point to the same side; C3 points the other way. Inverting C4
 // would silently turn the depicted glucose into the galactose model.
 const glucose=recognitionGraph('recognition-glucose');
 const ring=glucose.cycles[0],oxygen=ring.find(index=>glucose.atoms[index].symbol==='O');
 const c5=glucose.neighbors(oxygen).find(index=>glucose.neighbors(index).some(next=>glucose.atoms[next].symbol==='CH₂OH'));
 const carbons=[glucose.neighbors(oxygen).find(index=>index!==c5)];
 while(carbons.length<5)carbons.push(glucose.neighbors(carbons.at(-1)).find(index=>ring.includes(index)&&index!==oxygen&&!carbons.includes(index)));
 const sides=carbons.slice(1,4).map(index=>{
  const oh=glucose.neighbors(index).find(next=>glucose.atoms[next].symbol==='OH');
  assert.notEqual(oh,undefined,'C2, C3 and C4 each carry an OH group');
  return Math.sign(glucose.atoms[oh].y-glucose.atoms[index].y);
 });
 assert.equal(sides[0],sides[2],'the glucose C2 and C4 OH groups face the same side');
 assert.equal(sides[1],-sides[0],'the glucose C3 OH group faces the opposite side');
 const sucrose=recognitionGraph('recognition-sucrose');
 const bridge=sucrose.atoms.map((atom,index)=>({atom,index})).filter(({atom,index})=>atom.symbol==='O'&&!sucrose.cycles.some(cycle=>cycle.includes(index)));
 assert.equal(bridge.length,1,'one oxygen joins the two sucrose rings');
 const attachments=sucrose.neighbors(bridge[0].index);
 assert.equal(new Set(attachments.map(index=>sucrose.cycles.findIndex(cycle=>cycle.includes(index)))).size,2,'the bridge connects different rings');
 for(const index of attachments){
  assert.equal(sucrose.atoms[index].symbol,'C');
  assert.ok(sucrose.neighbors(index).some(next=>sucrose.atoms[next].symbol==='O'&&sucrose.cycles.some(cycle=>cycle.includes(next))),'each linking C is adjacent to its ring oxygen');
  assert.ok(!sucrose.neighbors(index).some(next=>sucrose.atoms[next].symbol==='OH'),'the linking positions have no extra free OH');
 }
 // The two mixed boards reuse equally valid molecular structures.
 for(const key of ['recognition-mixed-sugar-amino','recognition-mixed-sugar-fat'])assert.deepEqual(recognitionGraph(key).cycles.map(cycle=>cycle.length),[6],key);
});

test('five additional applied figures span five subject themes and keep conclusions for feedback',()=>{
 const applied=questions.filter(q=>q.id.startsWith('applied-'));
 assert.equal(applied.length,5);
 assert.deepEqual(applied.map(q=>q.topic).sort(),['protein','fat','micro','digestion','energy'].sort());
 for(const q of applied){assert.ok(q.figure?.startsWith('applied-'));assert.match(figure(q.figure),/<svg\b/);}
 const fat=figure('applied-fat-processes');
 assert.doesNotMatch(fat,/galle|enzym|glyserol|fettsyr/i,'the fat diagram shows changes without naming their causes or products');
 assert.doesNotMatch(figure('applied-vitamin-distribution'),/vitamin\s*[CDEK]\b/i,'vitamin solubility data must not identify X');
 assert.doesNotMatch(figure('applied-glucose-regulation'),/insulin|glukagon/i,'the glucose curve must not identify the regulatory hormone');
 const protein=applied.find(q=>q.topic==='protein');
 assert.match(protein.prompt,/tre/i,'the simplified model is explicitly limited to its three amino acids');
});

test('food nutrient tasks use actual local photographs and require multiple selections',()=>{
 const foods=questions.filter(q=>q.id.startsWith('food-nutrients-'));
 assert.equal(foods.length,10,'ten photographed foods are available');
 const credits=readFileSync(new URL('../docs/ernaering-matbilder.md',import.meta.url),'utf8');
 const imageFiles=new Set();
 for(const q of foods){
  assert.equal(q.type,'multi',q.id+': pupils can check several nutrients');
  assert.ok(q.answer.length>=2&&q.answer.length<q.options.length,q.id+': more than one nutrient and plausible incorrect alternatives');
  assert.ok(!evaluate(q,[q.answer[0]]).correct,q.id+': one right nutrient is an incomplete answer');
  const drawing=figure(q.figure),images=[...drawing.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/g)];
  assert.equal(images.length,1,q.id+': one named food is shown');
  const caption=drawing.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1].replace(/<[^>]+>/g,'').trim();
  assert.ok(caption,q.id+': its name is printed below the photo');
  const url=new URL(images[0][1],'https://onlyfag.test/prototyper/ernaering.html');
  assert.equal(url.origin,'https://onlyfag.test',q.id+': the photo is not a third-party hotlink');
  assert.match(url.pathname,/^\/assets\/nutrition\/food\//,q.id+': the photograph is a stored site asset');
  const bytes=readFileSync(new URL('..'+url.pathname,import.meta.url));
  const photographicFile=bytes[0]===0xff&&bytes[1]===0xd8||bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
  assert.ok(photographicFile&&bytes.length>1000,q.id+': real JPEG, PNG or WebP bytes exist');
  const basename=url.pathname.split('/').at(-1);
  assert.ok(credits.includes(basename),q.id+': photo provenance is recorded');
  imageFiles.add(url.pathname);
 }
 assert.equal(imageFiles.size,10,'the food exercises use ten distinct photographs');
 assert.match(credits,/https:\/\//,'photo sources can be inspected');
 assert.match(credits,/CC0|CC BY|public domain|offentlig eie|Unsplash|Pexels|Pixabay/i,'reuse terms are recorded');
});

test('existing food questions use named photo galleries',()=>{
 for(const id of ['protein-sources','doc-food-carbs','doc-essential-fat-sources']){
  const q=questions.find(q=>q.id===id);assert.ok(q?.figure,id+': the existing food task has a visual');
  const images=[...figure(q.figure).matchAll(/<img\b/g)];
  assert.ok(images.length>=3,id+': several foods can be compared visually');
 }
});

test('the Matvaretabellen exercise requires a real lookup and portion comparison',()=>{
 const lookup=questions.find(q=>q.id==='foodtable-vitamin-c-portions');assert.ok(lookup);
 assert.deepEqual(lookup.referenceLink,{url:'https://www.matvaretabellen.no/sok/',label:'Åpne Matvaretabellen'});
 assert.match(lookup.prompt,/50\s*g/);assert.match(lookup.prompt,/100\s*g/);
 assert.match(lookup.prompt,/Paprika, rød, rå/);assert.match(lookup.prompt,/Appelsin, rå/);
 assert.doesNotMatch(lookup.prompt,/\b(?:126|63|54)\s*mg\b/,'the student must find the vitamin values');
 assert.match(lookup.explanation,/63\s*mg/);assert.match(lookup.explanation,/54\s*mg/);
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
