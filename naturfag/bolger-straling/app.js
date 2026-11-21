import {solutionHtml} from './math-presentation.js?v=20261118-resonans1';
import {createAnimationClock} from './animation-clock.js?v=20261116-naturfag1';

export function startCourse(topicList,{prototype=false,embedded=false}={}){
let hostVisible=true;
const order=['bolger','fenomener','em','atomer','universet','kommunikasjon','radioaktivitet','stralevern','atmosfaeren'];
const topics=[...topicList].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
const allQuestions=topics.flatMap(topic=>topic.questions.map((q,index)=>({...q,topic,index})));
const byId=new Map(topics.map(t=>[t.id,t]));
const icons={
  bolger:'M2 16q5-20 10 0t10 0 10 0',
  fenomener:'M3 5 16 17 29 5M3 26h26M16 3v25',
  em:'M3 26 8 24 13 18 18 8 23 4 29 3M3 27h26',
  atomer:'M26 16a10 5 50 1 1-20 0 10 5 50 1 1 20 0M26 16a10 5-50 1 1-20 0 10 5-50 1 1 20 0M15 15h2v2h-2z',
  universet:'M16 2 19 11 29 12 22 19 24 29 16 24 8 29 10 19 3 12 13 11Z',
  kommunikasjon:'M16 16v13M11 11a7 7 0 0 0 0 10m10-10a7 7 0 0 1 0 10M6 6a14 14 0 0 0 0 20M26 6a14 14 0 0 1 0 20',
  radioaktivitet:'M13 16a3 3 0 1 0 6 0 3 3 0 1 0-6 0M11 12 6 3A15 15 0 0 1 26 3l-5 9M22 17h10a15 15 0 0 1-10 14l-5-9M10 17H0a15 15 0 0 0 10 14l5-9',
  stralevern:'M16 2 28 7v10c0 7-12 13-12 13S4 24 4 17V7ZM10 16l4 4 8-9',
  atmosfaeren:'M4 20a7 7 0 0 1 3-13 9 9 0 0 1 17 1 6 6 0 0 1 3 12H4ZM8 24v5m8-5v5m8-5v5'
};
const icon=(id)=>`<svg viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[id]||icons.bolger}"/></svg>`;
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=s=>String(s||'').replace(/<[^>]*>/g,' ');
function shuffledChoices(q){
  let seed=2166136261;for(const c of q.id)seed=Math.imul(seed^c.charCodeAt(0),16777619);
  const choices=q.choices.map((choice,index)=>({choice,index}));
  for(let i=choices.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[choices[i],choices[j]]=[choices[j],choices[i]];}
  return choices;
}
const $=s=>document.querySelector(s);
const content=$('#content');
const key='onlyfag-bolger-straling-v1';
let saved={answers:{},bookmarks:{},drafts:{},theme:'light'};
try{const data=JSON.parse(localStorage.getItem(key)||'null');if(data&&typeof data==='object')saved={...saved,...data};}catch{}
for(const k of ['answers','bookmarks','drafts'])if(!saved[k]||typeof saved[k]!=='object'||Array.isArray(saved[k]))saved[k]={};
const persist=()=>{try{localStorage.setItem(key,JSON.stringify(saved));}catch{}};
let route={id:'oversikt',view:'fagstoff'},filters={query:'',type:'',level:'',topic:'',bookmarked:false};
let cleanup,frameId=0,last=0;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const animationClock=createAnimationClock({reducedMotion:reducedMotion.matches});
const overviewScope=Symbol('overview');
const animationButtons=new Map();
function announce(text){$('#announcer').textContent=text;}
function animationScope(target){
 if(!target)return overviewScope;
 const element=typeof target==='string'?document.querySelector(target):target;
 if(!element)throw new Error(`Animation target not found: ${target}`);
 return element.closest('.model')||element;
}
function animationActive(scope){
 if(!hostVisible)return false;
 if(scope===overviewScope)return true;
 if(!scope.isConnected||scope.closest('[hidden]'))return false;
 for(let parent=scope;parent;parent=parent.parentElement){
  if(parent.tagName==='DIALOG'&&!parent.open)return false;
  if(parent.tagName==='DETAILS'&&!parent.open)return false;
 }
 return true;
}
function tick(now){
 frameId=0;
 if(!hostVisible||document.hidden||!animationClock.hasRunning()){last=0;return;}
 if(last&&now-last<32){frameId=requestAnimationFrame(tick);return;}
 const dt=last?Math.min((now-last)/1000,.1):0;
 last=now;animationClock.advance(dt);
 if(animationClock.hasRunning())frameId=requestAnimationFrame(tick);else last=0;
}
function startFrames(){if(hostVisible&&!frameId&&!document.hidden&&animationClock.hasRunning()){last=0;frameId=requestAnimationFrame(tick);}}
function repaint(target){if(arguments.length)animationClock.repaint(animationScope(target));else animationClock.repaint();startFrames();}
function clearFrames(){cancelAnimationFrame(frameId);frameId=0;animationClock.clear();animationButtons.clear();last=0;if(typeof cleanup==='function')cleanup();cleanup=null;}
const api={
 onFrame(fn,target){const scope=animationScope(target);return animationClock.onFrame(fn,scope,{isActive:()=>animationActive(scope)});},
 repaint,
 now:target=>animationClock.now(animationScope(target)),
 isPaused:target=>!hostVisible||animationClock.isPaused(animationScope(target)),
 play(target){
  const scope=animationScope(target);
  animationClock.setPaused(scope,false);
  const button=animationButtons.get(scope);
  if(button)syncAnimationButton(scope,button);
  repaint(target);
 }
};
function syncAnimationButton(scope,button){
 const paused=animationClock.isPaused(scope),label=paused?'Fortsett animasjonen':'Pause animasjonen';
 button.setAttribute('aria-label',label);button.setAttribute('title',label);button.setAttribute('aria-pressed',String(paused));
 button.innerHTML=paused?'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 3.5 16 10 6 16.5Z" fill="currentColor"/></svg>':'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3.5H8.5V16.5H5ZM11.5 3.5H15V16.5H11.5Z" fill="currentColor"/></svg>';
 scope.dataset.animationPaused=String(paused);
}
function installAnimationControls(){
 for(const scope of animationClock.scopes()){
  if(scope===overviewScope||!scope.classList.contains('model')||animationButtons.has(scope))continue;
  const toolbar=document.createElement('div');toolbar.className='animation-toolbar';
  const button=document.createElement('button');button.type='button';button.className='animation-toggle';
  toolbar.append(button);
  const visual=scope.querySelector('.model-visual')||scope;
  const drawing=visual.querySelector('svg,canvas');
  if(drawing){
   // Keep the toolbar outside any container whose SVG is replaced on a frame.
   let host=drawing;
   while(host.parentElement&&host.parentElement!==visual&&!host.parentElement.querySelector('input,select,button,textarea'))host=host.parentElement;
   const surface=document.createElement('div');surface.className='animation-surface';
   host.before(surface);surface.append(host,toolbar);
  }else visual.prepend(toolbar);
  animationButtons.set(scope,button);syncAnimationButton(scope,button);
  button.addEventListener('click',()=>{animationClock.toggle(scope);syncAnimationButton(scope,button);animationClock.repaint(scope);startFrames();});
 }
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frameId);frameId=0;last=0;}else startFrames();});
reducedMotion.addEventListener('change',e=>{animationClock.setReducedMotion(e.matches);for(const [scope,button]of animationButtons)syncAnimationButton(scope,button);if(!animationClock.hasRunning()){cancelAnimationFrame(frameId);frameId=0;last=0;}else startFrames();});
document.addEventListener('toggle',startFrames,true);
document.addEventListener('click',()=>queueMicrotask(startFrames));

function closeNav(){document.body.classList.remove('sidebar-open');$('#nav-scrim').hidden=true;$('#menu-button').setAttribute('aria-expanded','false');}
function buildNav(){
  $('#topic-nav').innerHTML=topics.map(t=>`<div class="topic-item ${route.id===t.id?'expanded':''}" data-topic="${t.id}"><button class="topic-button" data-topic-button="${t.id}" aria-controls="nav-${t.id}" aria-expanded="${route.id===t.id}">${icon(t.id)}<span>${escapeHtml(t.title)}</span><span class="topic-chevron" aria-hidden="true">⌄</span></button><div id="nav-${t.id}" class="topic-sub">${[['fagstoff','Fagstoff'],['oppgaver','Oppgavebank'],['begreper','Begreper']].map(([view,label])=>`<button data-route="${t.id}/${view}" class="${route.id===t.id&&route.view===view?'active':''}" ${route.id===t.id&&route.view===view?'aria-current="page"':''}>${label}</button>`).join('')}</div></div>`).join('');
  $('#total-questions').textContent=allQuestions.length;
}
function applyTheme(){document.body.classList.toggle('dark',saved.theme==='dark');$('#theme-button').setAttribute('aria-label',saved.theme==='dark'?'Bytt til lys visning':'Bytt til mørk visning');repaint();}
function navigate(value){if(location.hash.slice(1)===value){render();return;}location.hash=value;}
function parseRoute(){
 let [id,view='fagstoff']=decodeURIComponent(location.hash.slice(1)).split('/');
 if(!id||(!byId.has(id)&&!(prototype&&id==='alle')))id=prototype?'oversikt':topics[0].id;
 if(!['fagstoff','oppgaver','begreper'].includes(view))view='fagstoff';
 if(id==='alle')view='oppgaver';return {id,view};
}
function render(){
  clearFrames();route=parseRoute();document.body.classList.toggle('topic-page',route.id!=='oversikt');closeNav();buildNav();document.title=`${route.id==='oversikt'?'Bølger og stråling':route.id==='alle'?'Alle oppgaver':byId.get(route.id).title} – OnlyFag`;
  if(route.id==='oversikt')renderOverview();else renderTopic();
  startFrames();window.scrollTo({top:0,behavior:'instant'});postState();
}

function heroArt(){return `<div class="hero-art"><svg viewBox="0 0 450 300" role="img" aria-label="Én sammenheng: en bølge, lys gjennom et prisme og lys fra et atom"><defs><linearGradient id="hero-spectrum"><stop stop-color="#b184c3"/><stop offset=".22" stop-color="#698cbd"/><stop offset=".43" stop-color="#65aea5"/><stop offset=".65" stop-color="#c9c57f"/><stop offset="1" stop-color="#d98c75"/></linearGradient><linearGradient id="hero-wash" x2="1" y2="1"><stop stop-color="#e3eee6"/><stop offset="1" stop-color="#eff3ec"/></linearGradient></defs><circle cx="230" cy="148" r="133" fill="url(#hero-wash)" opacity=".65"/><g stroke="#afc6b5" opacity=".35"><path d="M62 100h330M62 148h330M62 196h330"/><path d="M111 55v190M171 30v230M231 22v252M291 36v230M351 65v180"/></g><path id="hero-wave" d="M28 153q17-62 34 0t34 0 34 0 34 0 34 0" fill="none" stroke="#3e8e75" stroke-width="2.3"/><path d="m226 102-40 93h80Z" fill="#eff8f6" fill-opacity=".8" stroke="#59958c" stroke-width="1.5"/><path d="m197 151 160-47m-160 47 162-24m-162 24 165 0m-165 0 162 25m-162-25 160 49" stroke="url(#hero-spectrum)" stroke-width="2.8" opacity=".8"/><g transform="translate(335 105)" stroke="#689a88" fill="none" opacity=".7"><ellipse rx="37" ry="13" transform="rotate(60)"/><ellipse rx="37" ry="13" transform="rotate(-60)"/><ellipse rx="37" ry="13"/><circle r="5" fill="#528776"/><circle id="hero-electron" cx="37" r="3" fill="#b37b4c" stroke="none"/></g><text x="38" y="231" font-size="10" fill="#668572">BØLGER</text><text x="204" y="231" font-size="10" fill="#668572">LYS</text><text x="316" y="231" font-size="10" fill="#668572">ATOMER</text></svg><p class="art-caption">Fra svingninger til signaler fra universet</p></div>`;}
function renderOverview(){
 content.innerHTML=`<div class="hero"><div><p class="eyebrow">NATURFAG · UTFORSK SAMMENHENGENE</p><h1>Bølger og<br>stråling</h1><p>Fra en tone i lufta til lyset fra en fjern stjerne. Se hva som skjer, endre én ting og sett ord på sammenhengen.</p><div class="hero-buttons"><button data-route="bolger/fagstoff">Begynn med bølger <span aria-hidden="true">→</span></button><button class="secondary" data-route="alle/oppgaver">Åpne oppgavebanken</button></div></div>${heroArt()}</div><div class="overview-heading"><h2>Velg et undertema</h2><span>${topics.length} temaer · ${allQuestions.length} oppgaver</span></div><div class="topic-grid">${topics.map(t=>`<a class="topic-card" href="#${t.id}/fagstoff"><div class="card-icon-row">${icon(t.id)}<span>${escapeHtml(t.kicker)}</span></div><h3>${escapeHtml(t.title)}</h3><p>${escapeHtml(t.summary)}</p><div class="card-bottom"><span>Fagstoff + ${t.questions.length} oppgaver</span><span aria-hidden="true">↗</span></div></a>`).join('')}</div>`;
 api.onFrame(t=>{const p=$('#hero-wave');if(p){p.setAttribute('d',Array.from({length:171},(_,i)=>`${i?'L':'M'}${28+i} ${153+29*Math.sin(i*.082-t*1.3)}`).join(' '));const e=$('#hero-electron');e.setAttribute('cx',String(37*Math.cos(t*.6)));e.setAttribute('cy',String(13*Math.sin(t*.6)));}});
}
function arrangeModels(root){
 for(const model of root.querySelectorAll('.model')){
  if(model.classList.contains('model--split')||model.dataset.modelLayout==='custom')continue;
  const children=[...model.children];
  const fullWidth=children.filter(el=>el.hasAttribute('data-model-full-width'));
  const figures=children.filter(el=>!fullWidth.includes(el)&&(el.tagName.toLowerCase()==='svg'||el.tagName==='CANVAS'||el.querySelector('svg,canvas')||el.hasAttribute('data-model-visual')||el.classList.contains('ra-builder-head')));
  if(!figures.length)continue;
  const visual=document.createElement('div');visual.className='model-visual';
  const panel=document.createElement('aside');panel.className='model-panel';panel.setAttribute('aria-label','Kontroller og avlesning');
  const footer=document.createElement('div');footer.className='model-footer';
  const header=document.createElement('div');header.className='model-header';
  for(const el of children){
   if(fullWidth.includes(el))header.append(el);
   else if(figures.includes(el)||el.tagName==='H3'||el.tagName==='H4'||el.classList.contains('ema-values'))visual.append(el);
   else if(el.tagName==='DETAILS'||el.classList.contains('model-note')||el.classList.contains('wb-caption')||el.classList.contains('ema-spectrum-callout'))footer.append(el);
   else if(el.querySelector('input,select,button,textarea')||el.matches('.readout,.ema-values,.ema-atom-readout,.ema-signal-result,.ra-equation,.ra-status,.sv-status,[aria-live],.ema-spectrum-callout'))panel.append(el);
   else footer.append(el);
  }
  if(!panel.children.length){for(const el of [...header.children,...visual.children,...footer.children])model.append(el);continue;}
  model.classList.add('model--split');if(header.children.length)model.append(header);model.append(visual,panel);if(footer.children.length)model.append(footer);
 }
}
function renderTopic(){
 const t=byId.get(route.id),all=route.id==='alle';
 content.innerHTML=`<div class="page-head"><h1>${all?'Alle oppgaver':escapeHtml(t.title)}</h1></div><div id="topic-content"></div>`;
 if(route.view==='fagstoff'){
   $('#topic-content').innerHTML=`${t.sections.map((s,i)=>`<section class="content-section" id="section-${t.id}-${i}"><h2><span class="section-index" aria-hidden="true">${i+1}</span>${escapeHtml(s.title)}</h2>${s.body}</section>`).join('')}${resourceHtml(t)}`;
   if(t.mount)cleanup=t.mount($('#topic-content'),api);
   arrangeModels($('#topic-content'));
   installAnimationControls();
 }else if(route.view==='begreper'){
   $('#topic-content').innerHTML=`<p class="question-summary">Begrepene du trenger for å forklare sammenhengene.</p><dl class="terms-list">${t.terms.map(term=>`<div class="term"><dt>${escapeHtml(term.term)}</dt><dd>${term.definition}</dd></div>`).join('')}</dl>${resourceHtml(t)}`;
 }else renderBank();
}
function resourceHtml(t){return t.resources?.length?`<aside class="resource-box"><span>UNDERSØK MER</span>${t.resources.map(r=>`<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.label)} ↗</a>`).join('')}</aside>`:'';}

function renderBank(){
 const all=route.id==='alle';
 $('#topic-content').innerHTML=`<div class="filterbar"><input id="question-search" type="search" placeholder="Søk i oppgavene …" aria-label="Søk i oppgavene" value="${escapeHtml(filters.query)}">${all?`<select id="question-topic" aria-label="Velg oppgavetema"><option value="">Alle temaer</option>${topics.map(t=>`<option value="${t.id}" ${filters.topic===t.id?'selected':''}>${escapeHtml(t.title)}</option>`).join('')}</select>`:''}<select id="question-type" aria-label="Velg oppgavetype"><option value="">Alle typer</option><option value="mcq">Flervalg</option><option value="number">Regn ut</option><option value="open">Forklar og drøft</option></select><select id="question-level" aria-label="Velg oppgavenivå"><option value="">Alle nivåer</option><option>Start</option><option>Bruk</option><option>Utfordring</option></select><button id="bookmark-filter" class="bookmark-filter" aria-pressed="${filters.bookmarked}">☆ Mine bokmerker</button></div><div id="question-list" class="question-list"></div>`;
 $('#question-type').value=filters.type;$('#question-level').value=filters.level;
 $('#question-search').addEventListener('input',e=>{filters.query=e.target.value;renderQuestions();});
 for(const [selector,prop]of [['#question-type','type'],['#question-level','level'],['#question-topic','topic']])$(selector)?.addEventListener('change',e=>{filters[prop]=e.target.value;renderQuestions();});
 $('#bookmark-filter').addEventListener('click',e=>{filters.bookmarked=!filters.bookmarked;e.currentTarget.setAttribute('aria-pressed',String(filters.bookmarked));renderQuestions();});
 renderQuestions();
}
function visibleQuestions(){return allQuestions.filter(q=>(route.id==='alle'?(!filters.topic||q.topic.id===filters.topic):q.topic.id===route.id)&&(!filters.type||q.type===filters.type)&&(!filters.level||(q.level||'Bruk')===filters.level)&&(!filters.bookmarked||saved.bookmarks[q.id])&&(!filters.query||`${plain(q.prompt)} ${q.topic.title}`.toLocaleLowerCase('nb').includes(filters.query.toLocaleLowerCase('nb'))));}
function renderQuestions(){
 const questions=visibleQuestions();
 $('#question-list').innerHTML=questions.length?questions.map(q=>questionHtml(q)).join(''):`<div class="empty-state">Ingen oppgaver passer til valgene dine. Prøv et annet søk eller fjern et filter.</div>`;
}
function numberFormHtml(q,draft){
 if(!q.fields)return `<form class="q-number-form"><label class="sr-only" for="input-${q.id}">Svar ${escapeHtml(q.unit||'')}</label><input id="input-${q.id}" type="text" inputmode="decimal" autocomplete="off" placeholder="Ditt svar" value="${escapeHtml(draft)}"><span>${escapeHtml(q.unit||'')}</span><button type="submit">Sjekk</button></form>`;
 const values=Array.isArray(draft)?draft:[];
 const fields=q.fields.map((field,index)=>{
  const id=`input-${q.id}-${index}`;
  return `<div class="q-number-field">
   <label for="${id}">${escapeHtml(field.label)}</label>
   <input id="${id}" type="text" inputmode="decimal" autocomplete="off" aria-describedby="${id}-unit ${id}-result" value="${escapeHtml(values[index])}">
   <span id="${id}-unit">${escapeHtml(field.unit)}</span>
   <output class="q-number-result" id="${id}-result" for="${id}"></output>
  </div>`;
 }).join('');
 return `<form class="q-number-form q-number-form--multi">${fields}<button type="submit">Sjekk</button></form>`;
}
function questionHtml(q){
 const previous=saved.answers[q.id],solved=previous?.solved,bookmarked=!!saved.bookmarks[q.id],draft=saved.drafts[q.id]||'';
 return `<article class="q-card" data-question="${q.id}"><div class="q-top"><span class="q-number">${String(q.index+1).padStart(2,'0')}</span><span>${escapeHtml(q.level||'Bruk')}</span><span>· ${q.type==='mcq'?'Flervalg':q.type==='number'?'Regn ut':'Forklar og drøft'}</span><span class="q-status" ${solved?'':'hidden'}>✓ Mestret</span><span class="q-topic">${escapeHtml(q.topic.title)}</span><button class="q-bookmark" aria-label="${bookmarked?'Fjern bokmerke':'Merk oppgaven'}" aria-pressed="${bookmarked}" title="Merk oppgaven">${bookmarked?'★':'☆'}</button></div><div class="q-prompt" id="prompt-${q.id}">${q.prompt}</div>${q.type==='mcq'?`<div class="q-choices" role="group" aria-labelledby="prompt-${q.id}">${shuffledChoices(q).map(({choice:c,index},i)=>`<button class="q-choice" data-choice="${index}" aria-pressed="false"><span class="choice-letter">${String.fromCharCode(65+i)}</span><span>${c}</span></button>`).join('')}</div>`:q.type==='number'?numberFormHtml(q,draft):`<label class="sr-only" for="input-${q.id}">Ditt svar</label><textarea id="input-${q.id}" class="q-open" rows="2" placeholder="Skriv et kort svar, eller forklar muntlig før du ser løsningsforslaget.">${escapeHtml(draft)}</textarea>`}<div class="q-actions"><button class="show-answer">${q.type==='open'?'Vis veiledende svar':'Vis forklaring'}</button>${q.hint?'<button class="hint-button" aria-expanded="false">Et hint</button>':''}</div>${q.hint?`<div class="q-hint" hidden>${q.hint}</div>`:''}<div class="q-answer" hidden><div class="feedback" aria-live="polite"></div><div class="solution">${solutionHtml(q)}</div>${q.type==='open'?`<div class="self-mark"><button data-self="yes">Dette fikk jeg til</button><button data-self="again" class="secondary">Øv igjen senere</button></div>`:''}</div></article>`;
}
function findQuestion(card){return allQuestions.find(q=>q.id===card.dataset.question);}
function setSolved(q,card,solved){
 saved.answers[q.id]={solved};
 persist();
 card.querySelector('.q-status').hidden=!solved;
}
function checkNumber(card){
 const q=findQuestion(card),inputs=[...card.querySelectorAll('.q-number-form input')];
 const results=(q.fields??[q]).map((field,index)=>{
  const raw=inputs[index].value.trim();
  const value=Number(raw.replace(/\s/g,'').replace(',','.').replace('−','-'));
  if(!raw||!Number.isFinite(value))return null;
  return Math.abs(value-field.value)<=(field.tolerance??Math.max(1e-9,Math.abs(field.value)*.005));
 });
 const answer=card.querySelector('.q-answer'),feedback=answer.querySelector('.feedback'),solution=answer.querySelector('.solution');
 const ok=results.every(result=>result===true);
 const complete=results.every(result=>result!==null);
 if(q.fields){
  inputs.forEach((input,index)=>{
   const result=results[index],output=input.parentElement.querySelector('.q-number-result');
   output.textContent=result===null?'Skriv et tall':result?'Riktig':'Prøv igjen';
   output.dataset.correct=String(result===true);
   input.setAttribute('aria-invalid',String(result!==true));
  });
  answer.hidden=!ok;
  solution.hidden=!ok;
  feedback.textContent=ok?'Riktig!':'';
  card.querySelector('.show-answer').textContent=ok?'Skjul forklaring':'Vis forklaring';
 }else{
  answer.hidden=false;
  solution.hidden=!complete;
  feedback.textContent=!complete?'Skriv inn et tall. Du kan bruke komma som desimaltegn.':ok?'Riktig!':'Se på sammenhengen og prøv igjen.';
 }
 if(complete)setSolved(q,card,ok);
}

document.addEventListener('click',e=>{
 if(e.target.closest('.skip')){e.preventDefault();$('#main').focus();return;}
 const section=e.target.closest('[data-section]');if(section){e.preventDefault();document.getElementById(section.dataset.section)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
 const routeButton=e.target.closest('[data-route]');if(routeButton){navigate(routeButton.dataset.route);return;}
 const topicButton=e.target.closest('[data-topic-button]');if(topicButton){const id=topicButton.dataset.topicButton;if(route.id!==id){filters={query:'',type:'',level:'',topic:'',bookmarked:false};navigate(id+'/fagstoff');}else{const item=topicButton.closest('.topic-item');item.classList.toggle('expanded');topicButton.setAttribute('aria-expanded',String(item.classList.contains('expanded')));}return;}
 const card=e.target.closest('.q-card');if(!card)return;const q=findQuestion(card),answer=card.querySelector('.q-answer');
 const bookmark=e.target.closest('.q-bookmark');if(bookmark){saved.bookmarks[q.id]=!saved.bookmarks[q.id];persist();if(filters.bookmarked)renderQuestions();else{bookmark.textContent=saved.bookmarks[q.id]?'★':'☆';bookmark.setAttribute('aria-pressed',String(!!saved.bookmarks[q.id]));bookmark.setAttribute('aria-label',saved.bookmarks[q.id]?'Fjern bokmerke':'Merk oppgaven');}return;}
 const choice=e.target.closest('.q-choice');if(choice){const selected=Number(choice.dataset.choice),ok=selected===q.correct;card.querySelectorAll('.q-choice').forEach(b=>{const index=Number(b.dataset.choice);b.classList.toggle('selected',index===selected);b.classList.toggle('correct',index===q.correct);b.classList.toggle('incorrect',index===selected&&!ok);b.setAttribute('aria-pressed',String(index===selected));});answer.hidden=false;answer.querySelector('.solution').hidden=false;answer.querySelector('.feedback').textContent=ok?'Riktig!':'Dette alternativet stemmer ikke. Se forklaringen.';setSolved(q,card,ok);return;}
 if(e.target.closest('.show-answer')){answer.hidden=!answer.hidden;answer.querySelector('.solution').hidden=false;answer.querySelector('.feedback').textContent='';e.target.textContent=answer.hidden?(q.type==='open'?'Vis veiledende svar':'Vis forklaring'):'Skjul forklaring';return;}
 if(e.target.closest('.hint-button')){const hint=card.querySelector('.q-hint');hint.hidden=!hint.hidden;e.target.setAttribute('aria-expanded',String(!hint.hidden));return;}
 const self=e.target.closest('[data-self]');if(self){setSolved(q,card,self.dataset.self==='yes');card.querySelectorAll('[data-self]').forEach(b=>b.classList.toggle('selected',b===self));if(self.dataset.self==='again'){saved.bookmarks[q.id]=true;persist();const b=card.querySelector('.q-bookmark');b.textContent='★';b.setAttribute('aria-pressed','true');b.setAttribute('aria-label','Fjern bokmerke');}announce(self.dataset.self==='yes'?'Oppgaven er markert som mestret.':'Oppgaven er bokmerket til neste gang.');}
});
document.addEventListener('submit',e=>{if(e.target.matches('.q-number-form')){e.preventDefault();checkNumber(e.target.closest('.q-card'));}});
document.addEventListener('input',e=>{
 const card=e.target.closest('.q-card');
 if(!card||!e.target.matches('textarea,input'))return;
 const form=e.target.closest('.q-number-form--multi');
 saved.drafts[card.dataset.question]=form?[...form.querySelectorAll('input')].map(input=>input.value):e.target.value;
 if(form){
  e.target.removeAttribute('aria-invalid');
  e.target.parentElement.querySelector('.q-number-result').textContent='';
 }
 persist();
});
$('#menu-button').addEventListener('click',()=>{if(matchMedia('(max-width:800px)').matches){const open=document.body.classList.toggle('sidebar-open');$('#nav-scrim').hidden=!open;$('#menu-button').setAttribute('aria-expanded',String(open));}else{const collapsed=document.body.classList.toggle('sidebar-collapsed');$('#menu-button').setAttribute('aria-label',collapsed?'Vis temamenyen':'Minimer temamenyen');$('#menu-button').setAttribute('aria-expanded',String(!collapsed));}});
$('#nav-scrim').addEventListener('click',closeNav);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav();});
$('#theme-button').addEventListener('click',()=>{saved.theme=saved.theme==='dark'?'light':'dark';persist();applyTheme();});
$('#fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{announce('Fullskjerm er ikke tilgjengelig i denne nettleseren.');}});
$('#print-button').addEventListener('click',()=>window.print());
$('#about-button').addEventListener('click',()=>$('#about-dialog').showModal());
$('#close-about').addEventListener('click',()=>$('#about-dialog').close());
$('#about-dialog').addEventListener('click',e=>{if(e.target===$('#about-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('#reset-button').addEventListener('click',()=>{$('#reset-confirm').hidden=false;});
$('#cancel-reset').addEventListener('click',()=>{$('#reset-confirm').hidden=true;});
$('#confirm-reset').addEventListener('click',()=>{saved.answers={};saved.bookmarks={};saved.drafts={};persist();$('#reset-confirm').hidden=true;$('#about-dialog').close();render();announce('Øvingshistorikken er nullstilt.');});
addEventListener('hashchange',()=>{filters={query:'',type:'',level:'',topic:'',bookmarked:false};render();});
function postState(){if(embedded&&parent!==window)parent.postMessage({type:'onlyfag:waves:state',topic:route.id,view:route.view},location.origin);}
if(embedded){
 document.body.classList.add('embedded');
 addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent||!event.data||typeof event.data!=='object')return;
  const data=event.data;
  if(data.type==='onlyfag:waves:topic'&&byId.has(data.topic)&&['fagstoff','oppgaver','begreper'].includes(data.view)){
   filters={query:'',type:'',level:'',topic:'',bookmarked:false};navigate(data.topic+'/'+data.view);
  }else if(data.type==='onlyfag:waves:theme'&&typeof data.dark==='boolean'){
   saved.theme=data.dark?'dark':'light';applyTheme();
  }else if(data.type==='onlyfag:waves:host-layout'&&typeof data.sidebarCollapsed==='boolean'){
   document.body.classList.toggle('host-sidebar-collapsed',data.sidebarCollapsed);
  }else if(data.type==='onlyfag:waves:visibility'&&typeof data.visible==='boolean'){
   hostVisible=data.visible;
   if(!hostVisible){cancelAnimationFrame(frameId);frameId=0;last=0;}else startFrames();
   document.dispatchEvent(new Event('visibilitychange'));
  }
 });
}
applyTheme();render();
}
