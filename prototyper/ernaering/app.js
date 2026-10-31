import {questions, sources} from './questions.js?v=20261031-1';
import {organs, digestiveSVG} from './diagram.js?v=20261031-1';
import {figure} from './figures.js?v=20261031-1';
import {STORE_KEY, topics, types, shuffle, mixedOrder, evaluate, needsReview, resultRecord, pickNext, rememberQuestion} from './engine.js?v=20261031-1';

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ids=organs.map(o=>o.id);
const processOrgans=organs.filter(o=>o.id!=='duodenum');
let data={version:1,records:{},lastId:questions[0].id};
let storageOK=true;
try {const parsed=JSON.parse(localStorage.getItem(STORE_KEY));if(parsed?.version===1 && parsed.records && typeof parsed.records==='object' && !Array.isArray(parsed.records))data=parsed;} catch {storageOK=false;}
const state={topic:'all',type:'all',level:'all',status:'all',view:'practice',search:'',queue:[],id:null};
if(!data.rotation || !Array.isArray(data.rotation.seen) || !Array.isArray(data.rotation.recent))data.rotation={seen:[],recent:[]};
const sessions=new Map();

function announce(s){$('#announcer').textContent=s;}
function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(data));storageOK=true;}catch{storageOK=false;}storageMessage();}
function storageMessage(){ $('.side-bottom p').textContent=storageOK?'Fremgangen lagres i denne nettleseren.':'Lagring er utilgjengelig. Øvingen virker, men fremgangen kan forsvinne når siden lukkes.'; }
function current(){return questions.find(q=>q.id===state.id);}
function session(q=current()){
  if(!sessions.has(q.id)) sessions.set(q.id,{values:q.type==='order'?mixedOrder(q.items):[],options:shuffle(q.options||[]),right:shuffle(q.pairs?.map(p=>p.right)||[]),labels:shuffle(organs),locked:new Set(),marks:[],assisted:Number(data.records[q.id]?.assistedUntil)>Date.now(),done:false,revealed:false,model:false,checks:[],feedback:null,text:'',hint:false,selected:null});
  return sessions.get(q.id);
}
function filtered(){return questions.filter(q=>(state.topic==='all'||state.topic==='figures'&&(q.figure||q.type==='anatomy'||q.type==='process')||state.topic==='review'&&needsReview(data.records[q.id])||q.topic===state.topic) && (state.type==='all'||q.type===state.type) && (state.level==='all'||q.level===Number(state.level)) && (state.status==='all'||state.status==='new'&&!data.records[q.id]||state.status==='review'&&needsReview(data.records[q.id])||data.records[q.id]?.status===state.status));}
function statusLabel(q){const r=data.records[q.id];if(!r)return 'Ikke prøvd';if(needsReview(r))return r.status==='review'?'Øv på nytt':'Tid for repetisjon';return r.status==='self'?'Egenvurdert':'Riktig uten hjelp';}
function rebuildQueue(){state.queue=filtered().map(q=>q.id);}
function chooseQuestion(){return pickNext(filtered(),data.rotation,data.records)?.id||null;}
function saveResult(outcome){const q=current();data.records[q.id]=resultRecord(data.records[q.id],outcome);save();renderProgress();}
function markAssisted(){const s=session();s.assisted=true;saveResult({assisted:true,correct:false,completed:s.done,self:current().type==='open'});}
function renderProgress(){
  const counts=questions.reduce((a,q)=>{const r=data.records[q.id];if(r?.status==='independent')a.auto++;if(r?.status==='self')a.self++;return a;},{auto:0,self:0});
  $('#progress-copy').textContent=`${counts.auto}/${questions.length} uten hjelp${counts.self?` · ${counts.self} egenvurdert`:''}`;
  $('#review-count').textContent=questions.filter(q=>needsReview(data.records[q.id])).length;
  storageMessage();
}
function renderNav(){
  $('#topics').innerHTML=[['all','Blandet øving'],['figures','Figuroppgaver'],...Object.entries(topics)].map(([id,label],i)=>`<button class="topic-button ${state.topic===id?'active':''}" data-topic="${id}" aria-pressed="${state.topic===id}"><span class="topic-symbol" aria-hidden="true">${id==='all'?'↔':id==='figures'?'◇':String(i-1).padStart(2,'0')}</span><span>${esc(label)}</span><span class="topic-count">${id==='all'?questions.length:id==='figures'?questions.filter(q=>q.figure||q.type==='anatomy'||q.type==='process').length:questions.filter(q=>q.topic===id).length}</span></button>`).join('');
  $('#review-button').classList.toggle('active',state.topic==='review');
  $('#review-button').setAttribute('aria-pressed',state.topic==='review');
  renderProgress();
}
function selectOptions(entries,value){return entries.map(([v,l])=>`<option value="${esc(v)}" ${String(value)===String(v)?'selected':''}>${esc(l)}</option>`).join('');}
function renderFilters(){
  $('#filter-bar').innerHTML=`<span class="filter-title">${esc(topics[state.topic]||(state.topic==='review'?'Øv på nytt':state.topic==='figures'?'Figuroppgaver':'Alle temaer'))}</span><label>Type <select id="type-filter">${selectOptions([['all','Alle oppgavetyper'],...Object.entries(types)],state.type)}</select></label><label>Nivå <select id="level-filter">${selectOptions([['all','Begge nivåer'],['1','Grunnleggende'],['2','Bruk og forklar']],state.level)}</select></label><label>Status <select id="status-filter">${selectOptions([['all','Alle'],['new','Ikke prøvd'],['review','Øv på nytt'],['independent','Riktig uten hjelp'],['self','Egenvurdert']],state.status)}</select></label>${state.view==='practice'?'<button class="text-button" id="shuffle-queue">Bland rekkefølgen ↔</button>':''}`;
}
function renderShell(){renderNav();renderFilters();$('#active-topic').textContent=topics[state.topic]||(state.topic==='review'?'Øv på nytt':state.topic==='figures'?'Figuroppgaver':'Blandet øving');for(const v of ['practice','bank']){$('#'+v+'-tab').classList.toggle('active',state.view===v);$('#'+v+'-tab').setAttribute('aria-pressed',state.view===v);}if(state.view==='bank')renderBank();else renderQuestion();}
function openQuestion(id,{focus=true,fresh=false}={}){
  if(!questions.some(q=>q.id===id))return;
  const changed=state.id!==id;state.id=id;state.view='practice';data.lastId=id;if(changed)rememberQuestion(data.rotation,current());if(fresh||sessions.get(id)?.done)sessions.delete(id);
  if(!state.queue.includes(id))state.queue=filtered().map(q=>q.id);
  history.replaceState(null,'','#'+id);save();renderShell();
  if(focus){$('.task-heading')?.focus();window.scrollTo({top:0,behavior:'instant'});}
}
function resetSelection(){rebuildQueue();if(state.view==='practice'){const id=chooseQuestion();if(id){openQuestion(id,{focus:false});return;}state.id=null;}renderShell();}
function renderBank(){
  $('#content').innerHTML='<label class="sr-only" for="bank-search">Søk etter oppgave eller fagbegrep</label><input id="bank-search" class="bank-search" type="search" placeholder="Søk etter oppgave eller fagbegrep…"><p class="bank-summary" id="bank-summary" aria-live="polite"></p><div class="bank-list" id="bank-list"></div>';
  $('#bank-search').value=state.search;renderBankRows();
}
function renderBankRows(){const query=state.search.toLocaleLowerCase('nb');const list=filtered().filter(q=>[q.title,q.prompt,topics[q.topic],types[q.type]].join(' ').toLocaleLowerCase('nb').includes(query));
  $('#bank-summary').textContent=`${list.length} oppgaver`;
  $('#bank-list').innerHTML=list.length?list.map((q,i)=>`<button class="bank-row" data-open="${q.id}"><span class="bank-index">${String(i+1).padStart(2,'0')}</span><span><strong>${esc(q.title)}</strong><small>${esc(topics[q.topic])} · ${types[q.type]} · Nivå ${q.level}</small></span><span class="bank-state ${data.records[q.id]?.status==='independent'?'done':''}">${statusLabel(q)} →</span></button>`).join(''):'<p>Ingen treff. Prøv et annet søkeord eller juster filtrene.</p>';
}
function keepFocus(render){const active=document.activeElement;const id=active?.id;render();if(id){const el=document.getElementById(id);if(el&&!el.disabled)el.focus({preventScroll:true});else $('#check-answer')?.focus({preventScroll:true});}}
function mark(i){const s=session();return s.marks[i]===true?'correct':s.marks[i]===false?'wrong':'';}
function markText(i){return mark(i)==='correct'?'✓ Riktig':mark(i)==='wrong'?'× Prøv igjen':'';}
function locked(i){return session().done||session().locked.has(i);}
function rowOptions(options,value){return '<option value="">Velg…</option>'+selectOptions(options.map(x=>[x,x]),value);}
const locations=['åpningen i hodet','det lange røret i brystet','den poseformede delen øverst til høyre i bildet','det store organet øverst til venstre i bildet','den lille grønne posen under organ 4','det avlange gule organet under organ 3','den første C-formede tarmbuen etter organ 3','de tynne tarmslyngene i midten','den tykkere tarmen rundt slyngene','det rette avsluttende tarmstykket'];
function diagramTask(q,s){
  const anatomy=q.type==='anatomy';
  const targets=anatomy?organs:processOrgans;
  const name=o=>o.id==='small'&&!anatomy?'Tynntarm (inkl. tolvfingertarm)':o.label;
  const selected=o=>anatomy?!!s.values[ids.indexOf(o.id)]:s.values.includes(o.id);
  const targetState=o=>anatomy?mark(ids.indexOf(o.id)):s.marks.length?(selected(o)?q.answer.includes(o.id)?'correct':'wrong':''):'';
  const isLocked=o=>s.done||(anatomy?s.locked.has(ids.indexOf(o.id)):s.locked.has(o.id));
  let drawing=digestiveSVG();
  if(!anatomy)drawing=drawing.replace('Fordøyelsessystemet med ti nummererte punkter','Fordøyelsessystemet med ni valg; tolvfingertarmen inngår i tynntarmen').replace('<path data-leader="duodenum"','<path style="display:none" data-leader="duodenum"');
  const map=`<div class="anatomy-map">${drawing}${targets.map(o=>`<button id="target-${o.id}" class="map-target ${selected(o)?'filled':''} ${targetState(o)}" data-target="${o.id}" style="left:${o.x/640*100}%;top:${o.y/690*100}%" aria-label="${esc(anatomy?`Punkt ${o.number}: ${s.values[ids.indexOf(o.id)]?organs.find(x=>x.id===s.values[ids.indexOf(o.id)])?.label:'ikke plassert'}`:`${name(o)}`)}" ${!anatomy?`aria-pressed="${selected(o)}"`:''} ${isLocked(o)?'disabled':''}>${o.number}${targetState(o)==='correct'?'<span class="target-mark">✓</span>':targetState(o)==='wrong'?'<span class="target-mark">×</span>':''}</button>`).join('')}</div>`;
  if(!anatomy)return `<div class="figure-layout">${map}<div><p class="tray-title">Velg ett eller flere steder</p><div class="process-list">${targets.map(o=>`<button id="process-${o.id}" class="${selected(o)?'selected':''} ${targetState(o)}" data-target="${o.id}" aria-pressed="${selected(o)}" ${isLocked(o)?'disabled':''}><span class="check-square" aria-hidden="true">${selected(o)?'✓':''}</span><span>${o.number}. ${name(o)}${targetState(o)==='wrong'?' · × Prøv igjen':targetState(o)==='correct'?' · ✓ Riktig':''}</span></button>`).join('')}</div><p class="selection-hint">Tolvfingertarmen inngår i valget «Tynntarm». Nummer 7 brukes bare i organplassering.</p></div></div>`;
  return `<div class="figure-layout">${map}<div><p class="tray-title">1. Velg navn · 2. Velg nummer</p><div class="label-tray">${s.labels.map(o=>{const index=s.values.indexOf(o.id);const assigned=index>=0;const fixed=assigned&&s.locked.has(index);return `<button id="chip-${o.id}" class="organ-chip ${s.selected===o.id?'selected':''} ${assigned?'assigned':''} ${fixed?'correct':''}" data-label="${o.id}" aria-pressed="${s.selected===o.id}" draggable="${!fixed&&!s.done}" ${fixed||s.done?'disabled':''}>${o.label}<span class="chip-number">${fixed?'✓ ':''}${assigned?organs[index].number:''}</span></button>`;}).join('')}</div><p class="selection-hint" id="selection-hint">${s.selected?`${esc(organs.find(o=>o.id===s.selected).label)} er valgt. Trykk på et nummer.`:'Du kan trykke, bruke tastaturet eller dra et navn. Riktige plasseringer låses etter sjekk.'}</p></div></div><details class="text-alternative"><summary>Tekstliste / alternativ til plassering</summary><p>Numrene beskrives slik de er plassert i figuren.</p><div class="rows">${organs.map((o,i)=>`<div class="task-row ${mark(i)}"><label for="row-${i}">${o.number}. ${locations[i]} <span class="row-mark">${markText(i)}</span></label><select id="row-${i}" data-row="${i}" ${locked(i)?'disabled':''}>${rowOptions(s.labels.map(x=>x.label),organs.find(x=>x.id===s.values[i])?.label)}</select></div>`).join('')}</div></details>`;
}
function answerUI(q,s){
  if(q.type==='anatomy'||q.type==='process')return diagramTask(q,s);
  if(q.type==='choice'||q.type==='multi')return `<p class="type-instruction">${q.type==='choice'?'Velg ett svar.':'Velg alle riktige svar.'}</p><div class="answer-options">${s.options.map((v,i)=>{const chosen=s.values.includes(v);const result=s.marks.length&&chosen?(q.type==='choice'?v===q.answer:q.answer.includes(v))? 'correct':'wrong':'';return `<button id="option-${i}" class="option-button ${chosen?'selected':''} ${result}" data-option="${i}" aria-pressed="${chosen}" ${s.done||s.locked.has(v)?'disabled':''}><span class="option-letter" aria-hidden="true">${result==='correct'?'✓':result==='wrong'?'×':chosen?(q.type==='multi'?'✓':'●'):''}</span><span>${esc(v)}${result?`<span class="sr-only"> · ${result==='correct'?'Riktig':'Prøv igjen'}</span>`:''}</span></button>`;}).join('')}</div>`;
  if(['sort','match','fill'].includes(q.type)){
    const rows=q.type==='sort'?q.items:q.type==='match'?q.pairs:q.blanks;
    return `<div class="rows">${rows.map((row,i)=>`<div class="task-row ${mark(i)}"><label for="row-${i}">${esc(row.label||row.left)} <span class="row-mark">${markText(i)}</span></label><div>${q.type==='fill'?`<div class="unit-input"><input id="row-${i}" data-row="${i}" type="text" autocomplete="off" spellcheck="false" ${row.answers.some(a=>/^\d+$/.test(a))?'inputmode="decimal"':''} value="${esc(s.values[i]||'')}" ${locked(i)?'disabled':''}>${row.unit?`<span class="unit">${row.unit}</span>`:''}</div>`:`<select id="row-${i}" data-row="${i}" ${locked(i)?'disabled':''}>${rowOptions(q.type==='sort'?q.groups:s.right,s.values[i])}</select>`}</div></div>`).join('')}</div>`;
  }
  if(q.type==='order')return `<p class="type-instruction">Flytt leddene med pilene. Riktige plasser låses når du sjekker.</p><ol class="sequence">${s.values.map((v,i)=>`<li class="${mark(i)}"><span>${esc(v)}${s.marks.length?` <small class="row-mark">${markText(i)}</small>`:''}</span><div class="move-controls"><button id="up-${i}" data-move="${i}" data-step="-1" aria-label="Flytt ${esc(v)} opp" ${locked(i)||!s.values.some((_,j)=>j<i&&!s.locked.has(j))?'disabled':''}>↑</button><button id="down-${i}" data-move="${i}" data-step="1" aria-label="Flytt ${esc(v)} ned" ${locked(i)||!s.values.some((_,j)=>j>i&&!s.locked.has(j))?'disabled':''}>↓</button></div></li>`).join('')}</ol>`;
  if(q.type==='open')return `<div class="open-response ${s.model?'with-model':''}"><div><label class="sr-only" for="open-answer">Din forklaring</label><textarea id="open-answer" class="open-input" placeholder="Skriv forklaringen din her…" ${s.done?'readonly':''}>${esc(s.text)}</textarea></div>${s.model?`<div class="model-panel"><section class="open-model"><h3>Veiledende svar</h3><p>${esc(q.model)}</p></section><p class="type-instruction">Vurder innholdet, ikke om du har brukt akkurat de samme ordene. Åpne svar rettes ikke automatisk.</p><div class="self-checklist">${q.checklist.map((c,i)=>`<label><input type="checkbox" data-self-check="${i}" ${s.checks[i]?'checked':''} ${s.done?'disabled':''}>${esc(c)}</label>`).join('')}</div>${!s.done?'<div class="self-actions"><button class="secondary" id="self-confident">Dette fikk jeg med</button><button class="text-button" id="self-review">Jeg trenger mer øving</button></div>':''}</div>`:''}</div>`;
  return '';
}
function renderQuestion(){
  const q=current();if(!q){$('#content').innerHTML=`<div class="empty-state"><h2>${state.topic==='review'?'Ingen oppgaver til repetisjon nå':'Ingen oppgaver med disse filtrene'}</h2><p>${state.topic==='review'?'Oppgaver du fikk hjelp med, og oppgaver det er tid for å repetere, samles her.':'Prøv en annen kombinasjon av tema, type og nivå.'}</p><button id="clear-filters" class="primary">Vis alle oppgaver</button></div>`;return;}
  const s=session(q);const i=state.queue.filter(id=>data.rotation.seen.includes(id)).length;
  $('#content').innerHTML=`<article class="exercise ${q.figure?'has-figure':''} type-${q.type}" data-question="${q.id}"><div class="question-meta"><span>${esc(topics[q.topic])}</span><span>${types[q.type]}</span><span class="task-number">${i} / ${state.queue.length}</span></div><h2 class="task-heading sr-only" tabindex="-1">${esc(q.title)}</h2><p class="prompt">${esc(q.prompt)}</p><div class="exercise-content">${q.figure?figure(q.figure):''}<div class="answer-panel">${answerUI(q,s)}</div></div><div class="task-actions">${s.done?'<button id="next-question" class="primary">Neste oppgave →</button>':q.type==='open'?`<button id="show-model" class="primary" ${s.model?'disabled':''}>Sammenlign svaret</button>`:'<button id="check-answer" class="primary">Sjekk svaret</button>'}<button class="text-button" id="show-hint" aria-expanded="${s.hint}" ${s.done?'hidden':''}>Hint</button><button class="text-button" id="reveal-answer" ${s.done||s.model?'hidden':''}>Vis fasit</button>${!s.done?'<button id="next-question" class="text-button skip-task">Hopp over →</button>':'<button class="text-button" id="retry-question">Prøv på nytt</button>'}</div>${s.hint?`<p class="hint">${esc(q.hint)}</p>`:''}<div id="feedback-host"></div></article>`;
  renderFeedback();
}
function renderFeedback(){const s=session();const q=current();const f=s.feedback;if(!f){$('#feedback-host').innerHTML='';return;}
  $('#feedback-host').innerHTML=`<section class="feedback ${f.kind||''}" tabindex="-1" id="feedback" aria-labelledby="feedback-title"><h3 id="feedback-title">${esc(f.title)}</h3><p>${esc(f.text||'')}</p>${s.done?`<details class="explanation"><summary>Hvorfor?</summary><p>${esc(q.explanation)}</p></details>`:''}</section>`;
}
function feedback(title,text='',kind='neutral'){session().feedback={title,text,kind};renderFeedback();announce(title+' '+text);}
function check(){const q=current(),s=session();if(s.done)return;
  const count=q.type==='anatomy'?10:q.type==='fill'?q.blanks.length:q.type==='sort'?q.items.length:q.type==='match'?q.pairs.length:0;
  if(count && Array.from({length:count},(_,i)=>s.values[i]).some(v=>!String(v??'').trim()) || ['choice','multi','process'].includes(q.type)&&!s.values.length){feedback('Svar på hele oppgaven først.','Du kan bruke hint eller vise fasit hvis du står fast.');return;}
  const result=evaluate(q,s.values,q.type==='anatomy'?ids:processOrgans.map(o=>o.id));s.marks=result.marks;
  if(['sort','match','fill','order','anatomy'].includes(q.type))result.marks.forEach((right,i)=>{if(right)s.locked.add(i);});
  if(q.type==='multi'||q.type==='process')s.values.forEach(v=>{if(q.answer.includes(v))s.locked.add(v);});
  if(!result.correct)s.assisted=true;
  s.done=result.correct;
  saveResult({correct:result.correct,completed:result.correct,assisted:s.assisted});
  s.feedback=result.correct?{title:s.assisted?'Riktig etter øving ✓':'Riktig uten hjelp ✓',text:s.assisted?'Oppgaven ligger under «Øv på nytt». Prøv igjen senere uten hjelp.':'Oppgaven kommer tilbake til repetisjon senere.',kind:''}:{title:'Ikke helt ennå',text:count||q.type==='order'?`${result.count} av ${result.total} deler er riktige og beholdes. Rett delene merket «Prøv igjen».`:'Noen valg er feil eller mangler. Riktige valgte svar beholdes.',kind:'bad'};
  keepFocus(renderQuestion);announce(s.feedback.title+'. '+s.feedback.text);
  if(s.done){$('#feedback').focus({preventScroll:true});}
}
function reveal(){const q=current(),s=session();if(s.done)return;s.assisted=true;s.revealed=true;s.done=true;s.marks=[];
  if(q.type==='anatomy'){s.values=[...ids];s.locked=new Set(ids.map((_,i)=>i));}
  if(q.type==='process'||q.type==='multi')s.values=[...q.answer];
  if(q.type==='choice')s.values=[q.answer];
  if(q.type==='sort')s.values=q.items.map(x=>x.group);
  if(q.type==='match')s.values=q.pairs.map(x=>x.right);
  if(q.type==='fill')s.values=q.blanks.map(x=>x.answers[0]);
  if(q.type==='order')s.values=[...q.items];
  if(q.type==='open')s.model=true;
  if(q.type!=='open')s.marks=evaluate(q,s.values,q.type==='anatomy'?ids:processOrgans.map(o=>o.id)).marks;
  saveResult({correct:false,completed:true,assisted:true,self:q.type==='open'});
  s.feedback={title:'Fasit vist',text:'Les gjennom og forklar for deg selv hvorfor dette er riktig. Oppgaven er lagt til repetisjon.',kind:'neutral'};
  renderQuestion();$('#feedback').focus({preventScroll:true});announce('Fasit vist. Oppgaven er lagt til repetisjon.');
}
function assign(index,value){const s=session();if(locked(index))return;const oldIndex=s.values.indexOf(value);if(oldIndex>=0&&s.locked.has(oldIndex))return;
  if(oldIndex>=0&&oldIndex!==index){s.values[oldIndex]='';s.marks[oldIndex]=undefined;}s.values[index]=value;s.marks[index]=undefined;s.selected=null;}
function target(id){const q=current(),s=session();if(s.done)return;if(q.type==='anatomy'){if(!s.selected){announce('Velg et organnavn først.');$('#selection-hint').textContent='Velg først navnet du vil plassere.';return;}assign(ids.indexOf(id),s.selected);}else{if(s.locked.has(id))return;s.values=s.values.includes(id)?s.values.filter(x=>x!==id):[...s.values,id];s.marks=[];}
  keepFocus(renderQuestion);
}
function next(){const id=chooseQuestion();if(id)openQuestion(id,{fresh:true});else{state.id=null;renderShell();}}
$('#content').addEventListener('input',e=>{if(e.target.id==='bank-search'){state.search=e.target.value;renderBankRows();return;}if(e.target.id==='open-answer')session().text=e.target.value;if(e.target.matches('input[data-row]')){const i=Number(e.target.dataset.row);session().values[i]=e.target.value;session().marks[i]=undefined;e.target.closest('.task-row').classList.remove('wrong');e.target.closest('.task-row').querySelector('.row-mark').textContent='';}});
$('#content').addEventListener('change',e=>{if(e.target.matches('select[data-row]')){const i=Number(e.target.dataset.row);if(current().type==='anatomy'){const opened=$('.text-alternative').open;assign(i,organs.find(o=>o.label===e.target.value)?.id||'');keepFocus(renderQuestion);$('.text-alternative').open=opened;document.getElementById('row-'+i)?.focus({preventScroll:true});}else{session().values[i]=e.target.value;session().marks[i]=undefined;e.target.closest('.task-row').classList.remove('wrong');e.target.closest('.task-row').querySelector('.row-mark').textContent='';}}if(e.target.matches('[data-self-check]'))session().checks[Number(e.target.dataset.selfCheck)]=e.target.checked;});
$('#content').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('input[data-row]')){e.preventDefault();check();}});
$('#content').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.open){openQuestion(b.dataset.open);return;}
  if(b.id==='clear-filters'){Object.assign(state,{topic:'all',type:'all',level:'all',status:'all'});resetSelection();return;}
  if(b.id==='new-round'){sessions.clear();rebuildQueue();if(state.queue.length)openQuestion(chooseQuestion(),{fresh:true});else{state.id=null;renderShell();}return;}
  if(b.id==='go-bank'){state.view='bank';renderShell();return;}
  const q=current(),s=session();
  if(b.dataset.label){s.selected=b.dataset.label;keepFocus(renderQuestion);announce(`${organs.find(o=>o.id===s.selected).label} valgt. Velg et nummer.`);}
  if(b.dataset.target)target(b.dataset.target);
  if(b.dataset.option!==undefined){const v=s.options[Number(b.dataset.option)];if(!s.locked.has(v)){s.values=q.type==='choice'?[v]:s.values.includes(v)?s.values.filter(x=>x!==v):[...s.values,v];s.marks=[];keepFocus(renderQuestion);}}
  if(b.dataset.move!==undefined){const i=Number(b.dataset.move),step=Number(b.dataset.step);let j=i+step;while(s.locked.has(j))j+=step;if(j>=0&&j<s.values.length&&!locked(i)){[s.values[i],s.values[j]]=[s.values[j],s.values[i]];s.marks[i]=s.marks[j]=undefined;renderQuestion();document.getElementById((step<0?'up-':'down-')+j)?.focus({preventScroll:true});announce(`Flyttet til plass ${j+1}.`);}}
  if(b.id==='check-answer')check();
  if(b.id==='show-hint'){if(!s.hint)markAssisted();s.hint=!s.hint;keepFocus(renderQuestion);if(s.hint)announce(q.hint);}
  if(b.id==='reveal-answer')reveal();
  if(b.id==='show-model'){if(!s.text.trim()){feedback('Skriv en forklaring først.','Da har du noe å sammenligne modellsvaret med. Du kan også velge «Vis fasit».');return;}s.model=true;renderQuestion();announce('Veiledende svar og egenvurdering er tilgjengelig.');}
  if(b.id==='self-confident'||b.id==='self-review'){
    if(b.id==='self-confident'&&!q.checklist.every((_,i)=>s.checks[i])){feedback('Se gjennom kjennetegnene først.','Kryss av det du fikk med, eller velg «Jeg trenger mer øving».');return;}
    const confident=b.id==='self-confident';s.done=true;saveResult({self:true,confident,completed:true,assisted:s.assisted});s.feedback={title:confident&&!s.assisted?'Egenvurdering lagret':'Lagt til repetisjon',text:confident&&!s.assisted?'Du har vurdert at forklaringen dekker kjennetegnene. Svaret er egenvurdert, ikke automatisk rettet.':'Bruk modellsvaret til å forbedre forklaringen, og øv igjen senere.',kind:'neutral'};renderQuestion();$('#feedback').focus({preventScroll:true});announce(s.feedback.title);}
  if(b.id==='next-question')next();
  if(b.id==='retry-question')openQuestion(q.id,{fresh:true});
});
$('#content').addEventListener('dragstart',e=>{const b=e.target.closest('[data-label]');if(!b||b.disabled)return;e.dataTransfer.setData('text/plain',b.dataset.label);session().selected=b.dataset.label;});
$('#content').addEventListener('dragover',e=>{if(current()?.type==='anatomy'&&e.target.closest('[data-target]:not(:disabled)'))e.preventDefault();});
$('#content').addEventListener('drop',e=>{const b=e.target.closest('[data-target]');if(current()?.type!=='anatomy'||!b||b.disabled)return;e.preventDefault();const label=e.dataTransfer.getData('text/plain');if(ids.includes(label)){session().selected=label;target(b.dataset.target);}});
$('#filter-toggle').onclick=()=>{const bar=$('#filter-bar');bar.hidden=!bar.hidden;$('#filter-toggle').setAttribute('aria-expanded',String(!bar.hidden));};
$('#filter-bar').addEventListener('change',e=>{const key={'type-filter':'type','level-filter':'level','status-filter':'status'}[e.target.id];if(key){state[key]=e.target.value;resetSelection();}});
$('#filter-bar').addEventListener('click',e=>{if(e.target.closest('#shuffle-queue')){rebuildQueue();if(state.queue.length)openQuestion(chooseQuestion(),{fresh:true});}});
$('#topics').addEventListener('click',e=>{const b=e.target.closest('[data-topic]');if(b){state.topic=b.dataset.topic;resetSelection();closeMenu();}});
$('#review-button').onclick=()=>{Object.assign(state,{topic:'review',status:'all',type:'all',level:'all'});resetSelection();closeMenu();};
for(const v of ['practice','bank'])$('#'+v+'-tab').onclick=()=>{state.view=v;renderShell();closeMenu();};
const dialog=$('#about-dialog');
function showAbout(){dialog.showModal();$('#reset-confirm').hidden=true;}
$('#about-button').onclick=showAbout;$('#sources-button').onclick=showAbout;$('#close-dialog').onclick=()=>dialog.close();
$('#reset-progress').onclick=()=>{$('#reset-confirm').hidden=false;$('#cancel-reset').focus();};
$('#cancel-reset').onclick=()=>{$('#reset-confirm').hidden=true;$('#reset-progress').focus();};
$('#confirm-reset').onclick=()=>{data={version:1,records:{},lastId:questions[0].id,rotation:{seen:[],recent:[]}};sessions.clear();save();dialog.close();Object.assign(state,{topic:'all',type:'all',level:'all',status:'all',view:'practice'});resetSelection();announce('Øvingshistorikken for ernæring og helse er nullstilt.');};
// Make the full, already-reviewed source list available only inside the dialog.
const sourceList=dialog.querySelector('ul');sourceList.innerHTML=sources.map(s=>`<li>${s.url?`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`:esc(s.title)}${s.description?` — ${esc(s.description)}`:''}</li>`).join('');
const mobile=matchMedia('(max-width:760px)');
$('#sidebar').insertAdjacentHTML('afterbegin','<button id="close-menu" class="mobile-close" aria-label="Lukk temamenyen">×</button>');
document.body.insertAdjacentHTML('beforeend','<button id="menu-backdrop" class="menu-backdrop" aria-label="Lukk temamenyen" hidden tabindex="-1"></button>');
function closeMenu(){const wasOpen=$('#sidebar').classList.contains('open');$('#sidebar').classList.remove('open');$('#menu-button').setAttribute('aria-expanded','false');$('.workspace').inert=false;$('#sidebar').inert=mobile.matches;$('#menu-backdrop').hidden=true;if(wasOpen&&mobile.matches)$('#menu-button').focus();}
$('#menu-button').onclick=()=>{if(!mobile.matches)return;$('#sidebar').classList.add('open');$('#sidebar').inert=false;$('.workspace').inert=true;$('#menu-button').setAttribute('aria-expanded','true');$('#menu-backdrop').hidden=false;$('#close-menu').focus();};
$('#close-menu').onclick=closeMenu;$('#menu-backdrop').onclick=closeMenu;mobile.addEventListener('change',closeMenu);
document.addEventListener('keydown',e=>{if(!$('#sidebar').classList.contains('open'))return;if(e.key==='Escape'){closeMenu();return;}if(e.key==='Tab'){const controls=[...$('#sidebar').querySelectorAll('button,a')].filter(x=>!x.disabled);const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(questions.some(q=>q.id===id))openQuestion(id);});
rebuildQueue();closeMenu();
const requested=location.hash.slice(1);
const reloading=performance.getEntriesByType?.('navigation')?.[0]?.type==='reload';
openQuestion(!reloading&&questions.some(q=>q.id===requested)?requested:chooseQuestion(),{focus:false});
