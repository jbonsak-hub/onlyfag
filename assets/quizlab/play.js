import {escape,loadJSON,renderQuestion} from './modules.js';

const app = document.getElementById('quiz-app');
const API = (window.QUIZLAB_API || window.GEO_SCORE_API || 'https://onlyfag-geography-scores.jack-bonsak.workers.dev').replace(/\/$/,'');
const pathSlug = location.pathname.replace(/^\/+|\/+$/g,'');
const slug = new URLSearchParams(location.search).get('id') || new URLSearchParams(location.search).get('quiz') || (pathSlug !== 'quiz' && !pathSlug.includes('/') ? pathSlug : '');
const storageKey = 'onlyfag-quizlab-session:' + slug;
let quiz = null, state = null, catalog = null, token = null, busy = false, questionAbort = null, timer = null, displayQuestion = null, timeOffset = 0, timerSync = false, renderGeneration = 0;
const modeLabels = {accuracy:'Høyest svarprosent',correct:'Flest riktige',fixed:'Et fast antall spørsmål'};
const time = ms => {const sec=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;};
const category = id => (catalog?.categories || catalog?.modules || []).find(item=>item.id===id);
const categoryLabel = id => category(id)?.title || category(id)?.label || id;
const categories = () => (quiz.categories || []).map(c=>typeof c==='string'?{id:c}:c);
function remember() {
  try {if(token)sessionStorage.setItem(storageKey,JSON.stringify({token,version:quiz.version}));else sessionStorage.removeItem(storageKey);}catch{}
}
async function request(path, body, authenticated = false, retry = true) {
  const headers = {'Content-Type':'application/json'};
  if(authenticated)headers.Authorization='Bearer '+token;
  let response;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try {response=await fetch(API+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});}
  catch(error) {if(retry&&body?.requestId)return request(path,body,authenticated,false);throw Error('Ingen forbindelse. Kontroller nettet og prøv igjen.');}
  finally {clearTimeout(timeout);}
  let result;
  try {result=await response.json();}catch{throw Error('Tjenesten svarte ikke som forventet. Prøv igjen.');}
  if(!response.ok) {
    const messages={not_found:'Denne quizadressen finnes ikke.',quiz_not_found:'Denne quizadressen finnes ikke.',session_expired:'Runden er utløpt. Start på nytt.',invalid_token:'Runden er utløpt. Start på nytt.',rate_limited:'Mange forespørsler akkurat nå. Vent litt og prøv igjen.',already_published:'Resultatet er allerede lagret.',invalid_nickname:'Skriv et kallenavn på 2–24 tegn.'};
    const code=result.error?.code || result.error;
    const error=Error(messages[code] || result.message || 'Kunne ikke fullføre forespørselen. Prøv igjen.');error.code=code;throw error;
  }
  return result;
}
function notice(text, isError = false) {
  const el=document.getElementById('quiz-notice');
  if(el){el.textContent=text;el.classList.toggle('is-error',isError);}
}
function stop() {clearInterval(timer);timer=null;questionAbort?.abort();}
function scoreHTML() {
  return '<section class="score-section" aria-labelledby="quiz-score-title"><div class="section-heading"><div><span class="eyebrow">Denne quizen</span><h2 id="quiz-score-title">Highscore</h2></div><button id="quiz-refresh-scores" class="quiet-button" type="button">Oppdater</button></div><div id="quiz-score-list" aria-live="polite"><p class="muted">Henter resultater …</p></div></section>';
}
async function scores() {
  const list=document.getElementById('quiz-score-list');if(!list)return;
  try {
    const version = state?.quiz?.version || quiz.version;
    const result=await request('/quizlab/quizzes/'+encodeURIComponent(slug)+'/scores'+(version?'?version='+encodeURIComponent(version):''));if(!list.isConnected)return;
    const rows=result.rows || result.scores || [];
    list.innerHTML=rows.length?`<div class="score-table-wrap"><table><thead><tr><th><span class="sr-only">Plass</span>#</th><th>Kallenavn</th><th>Riktige</th><th>Svarprosent</th><th>Tid</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${escape(r.nickname || r.name)}</td><td>${Number(r.correct)} / ${Number(r.answered)}</td><td>${Number(r.accuracy || 0).toLocaleString('nb-NO',{maximumFractionDigits:1})} %</td><td>${time(r.time_ms ?? r.timeMs ?? 0)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-scores"><span aria-hidden="true">✧</span><p>Ingen resultater ennå. Bli den første!</p></div>';
  } catch(error){if(list.isConnected)list.innerHTML=`<p class="is-error">${escape(error.message)}</p>`;}
}
function attachScores() {document.getElementById('quiz-refresh-scores')?.addEventListener('click',scores);scores();}
function intro() {
  stop();state=null;token=null;displayQuestion=null;remember();
  document.title=quiz.title+' · Quizlab · OnlyFag';
  const fixed=quiz.mode==='fixed';
  app.innerHTML=`<section class="quiz-intro"><span class="eyebrow">OnlyFag Quizlab</span><h1>${escape(quiz.title)}</h1><p class="intro-copy">${fixed?'Svar på spørsmål fra de valgte kategoriene. Hvert riktig svar teller.':quiz.mode==='accuracy'?'Hvor høy svarprosent klarer du før tiden er ute?':'Hvor mange riktige svar klarer du før tiden er ute?'}</p><div class="round-facts"><div><span>${fixed?'Spørsmål':'Rundetid'}</span><strong>${fixed?Number(quiz.questionCount):Number(quiz.minutes)+' min'}</strong></div><div><span>Per spørsmål</span><strong>${Number(quiz.secondsPerQuestion)} sek</strong></div><div><span>Kategorier</span><strong>${categories().length}</strong></div></div><div class="category-pills">${categories().map(c=>`<span>${escape(categoryLabel(c.id))}${c.id==='mapwiz'?' · '+({easy:'Normal',medium:'Vanskelig',hard:'Hjerterå'}[c.difficulty] || 'Normal'):''}</span>`).join('')}</div><p class="rule-note">Ett svar per spørsmål. Feil, hopp over og utløpt svartid teller som feil.${!fixed?' Rundetiden løper også når fanen er skjult.':''}</p><button id="quiz-start" class="primary-button start-button" type="button">Start quizen <span aria-hidden="true">→</span></button><p id="quiz-notice" role="status" class="notice"></p></section>${scoreHTML()}`;
  app.setAttribute('aria-busy','false');
  document.getElementById('quiz-start').addEventListener('click',start);attachScores();
}
async function preload() {
  const descriptors=categories().flatMap(c=>{
    if(c.id==='mapwiz')return [{source:'/assets/geography/mapwiz-world-map.json'}];
    const key=c.id==='worldle'?'worldle':category(c.id)?.mapKey || c.id;
    return catalog.maps?.[key]?[catalog.maps[key]]:[];
  });
  await Promise.all([...new Set(descriptors.map(d=>d.source))].map(loadJSON));
  if(categories().some(c=>c.id==='mapwiz')) {
    const map=await loadJSON('/assets/geography/mapwiz-world-map.json');
    await new Promise((resolve,reject)=>{const image=new Image(),timeout=setTimeout(()=>reject(Error('Verdenskartet kunne ikke lastes. Prøv igjen.')),20000);image.onload=()=>{clearTimeout(timeout);resolve();};image.onerror=()=>{clearTimeout(timeout);reject(Error('Verdenskartet kunne ikke lastes. Prøv igjen.'));};image.src=map.image;});
  }
}
async function start() {
  if(busy)return;busy=true;const button=document.getElementById('quiz-start');button.disabled=true;button.textContent='Gjør klar quizen …';notice('Laster kart og oppgaver.');
  try {await preload();const result=await request('/quizlab/quizzes/'+encodeURIComponent(slug)+'/sessions',{version:quiz.version});token=result.token;remember();applyState(result);}
  catch(error){notice(error.message,true);button.disabled=false;button.innerHTML='Start quizen <span aria-hidden="true">→</span>';}
  finally {busy=false;}
}
function applyState(next) {
  state=next;
  if(next.quiz)quiz=next.quiz;
  if(next.serverNow)timeOffset=Number(next.serverNow)-Date.now();
  remember();
  if(state.complete){resultScreen();return;}
  if(!state.question)throw Error('Ingen oppgave ble returnert. Prøv igjen.');
  renderActive();
}
async function renderActive() {
  const generation=++renderGeneration;
  questionAbort?.abort();questionAbort=new AbortController();
  const q=state.question;displayQuestion=q.id;
  const label=categoryLabel(q.moduleId || q.module);
  const feedback=state.feedback;
  app.innerHTML=`<section id="quiz-stage" class="quiz-stage"><div class="game-topline"><span class="category-badge">${escape(label)}</span><span class="question-count">Spørsmål ${Number(state.index || 0)+1}${state.total?' av '+Number(state.total):''}</span><span class="round-clock" ${quiz.mode==='fixed'?'hidden':''}><span class="sr-only">Rundetid igjen</span><span aria-hidden="true">◷</span> <strong id="quiz-round-timer"></strong></span></div><div class="question-heading"><h1 id="quiz-question" tabindex="-1">${escape(q.prompt || q.targetName || 'Velg riktig svar')}</h1><div class="question-clock"><span id="quiz-question-timer" aria-label="Svartid igjen"></span><span>sek</span></div></div><div class="time-track" role="presentation"><div id="quiz-time-progress"></div></div><div id="quiz-question-content" class="question-content" aria-busy="true"><p class="muted">Laster oppgaven …</p></div><div class="question-bottom"><span class="current-score">${Number(state.correct || 0)} riktige av ${Number(state.answered || 0)}</span><button id="quiz-skip" class="quiet-button" type="button">Hopp over →</button></div><p id="quiz-feedback" class="feedback ${feedback?.correct?'correct':'incorrect'}" role="status">${feedback?(feedback.expired?'Tiden gikk ut på forrige spørsmål.':feedback.correct?'Riktig!':feedback.answerLabel?'Riktig svar var '+escape(feedback.answerLabel)+'.':'Svaret var ikke riktig.'):''}</p><p id="quiz-notice" role="status" class="notice"></p><button id="quiz-reconnect" class="quiet-button" type="button" hidden>Prøv forbindelsen igjen</button></section>`;
  document.getElementById('quiz-skip').addEventListener('click',()=>submit({skip:true}));
  document.getElementById('quiz-reconnect').addEventListener('click',sync);
  const content=document.getElementById('quiz-question-content');
  try {content.replaceChildren();await renderQuestion(content,q,submit,{signal:questionAbort.signal});if(generation!==renderGeneration)return;content.setAttribute('aria-busy','false');document.getElementById('quiz-question').focus({preventScroll:true});}
  catch(error){if(generation!==renderGeneration)return;content.innerHTML=`<p class="is-error">${escape(error.message)}</p><p>Du kan hoppe over dette spørsmålet.</p>`;content.setAttribute('aria-busy','false');}
  if(generation!==renderGeneration)return;
  clearInterval(timer);tick();timer=setInterval(tick,100);
}
function tick() {
  if(!state||state.complete||!displayQuestion)return;
  const now=Date.now()+timeOffset;
  const remaining=Math.max(0,Number(state.questionDeadline || now+state.questionRemainingMs)-now);
  const round=state.deadline?Math.max(0,Number(state.deadline)-now):null;
  const qClock=document.getElementById('quiz-question-timer'),roundClock=document.getElementById('quiz-round-timer');
  if(qClock)qClock.textContent=String(Math.ceil(remaining/1000));
  if(roundClock)roundClock.textContent=time(round ?? 0);
  const bar=document.getElementById('quiz-time-progress');if(bar){bar.style.width=Math.min(100,remaining/(quiz.secondsPerQuestion*1000)*100)+'%';bar.classList.toggle('urgent',remaining<4000);}
  if((remaining<=0 || round!==null&&round<=0)&&!busy&&!timerSync)sync();
}
function disableAnswers(value) {
  document.querySelectorAll('#quiz-question-content button,#quiz-skip').forEach(button=>{
    if(value){if(!Object.hasOwn(button.dataset,'quizWasDisabled'))button.dataset.quizWasDisabled=String(button.disabled);button.disabled=true;}
    else {button.disabled=button.dataset.quizWasDisabled==='true';delete button.dataset.quizWasDisabled;}
  });
  document.getElementById('quiz-stage')?.classList.toggle('sending',value);
}
async function submit(answer) {
  if(busy||!state||state.complete)return;
  busy=true;disableAnswers(true);notice('');
  const body={requestId:crypto.randomUUID(),question:displayQuestion,...answer};
  try {const next=await request('/quizlab/answer',body,true);applyState(next);}
  catch(error){notice(error.message,true);disableAnswers(false);document.getElementById('quiz-reconnect').hidden=false;}
  finally {busy=false;}
}
async function sync() {
  if(busy||timerSync||!token||state?.complete)return;
  timerSync=true;disableAnswers(true);
  try {const next=await request('/quizlab/status',{},true);if(next.complete || next.question?.id!==displayQuestion)applyState(next);else {state=next;if(next.serverNow)timeOffset=Number(next.serverNow)-Date.now();disableAnswers(false);notice('');document.getElementById('quiz-reconnect').hidden=true;clearInterval(timer);tick();timer=setInterval(tick,100);}}
  catch(error){notice(error.message,true);const retry=document.getElementById('quiz-reconnect');if(retry)retry.hidden=false;clearInterval(timer);timer=null;}
  finally {timerSync=false;}
}
function resultScreen() {
  stop();displayQuestion=null;
  const correct=Number(state.correct || 0),answered=Number(state.answered || 0),percent=answered?correct/answered*100:0;
  app.innerHTML=`<section id="quiz-result" class="quiz-result"><span class="eyebrow">${escape(quiz.title)} · Fullført</span><h1>${quiz.mode==='accuracy'?percent.toLocaleString('nb-NO',{maximumFractionDigits:1})+' %':correct+' riktige'}</h1><p class="intro-copy">Du svarte riktig på ${correct} av ${answered} spørsmål.</p><div class="round-facts"><div><span>Svarprosent</span><strong>${percent.toLocaleString('nb-NO',{maximumFractionDigits:1})} %</strong></div><div><span>Riktige</span><strong>${correct}</strong></div><div><span>Tid</span><strong>${time(state.timeMs || 0)}</strong></div></div>${state.published || state.saved?'<p class="saved-note">Resultatet er lagret.</p>':`<form id="quiz-publish" class="publish-form"><label for="quiz-nickname">Vil du være med på highscore-listen?</label><p>Velg et kallenavn. Navnet og resultatet blir synlig for alle som åpner quizen.</p><div class="publish-controls"><input id="quiz-nickname" name="nickname" type="text" minlength="2" maxlength="24" required autocomplete="off" placeholder="Ditt kallenavn"><button type="submit" class="primary-button">Lagre resultat</button></div></form>`}<p id="quiz-notice" class="notice" role="status"></p><button id="quiz-again" type="button" class="quiet-button">Spill igjen →</button></section>${scoreHTML()}`;
  document.getElementById('quiz-again').addEventListener('click',intro);attachScores();
  document.getElementById('quiz-publish')?.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;busy=true;const form=event.currentTarget,button=form.querySelector('button');button.disabled=true;notice('Lagrer resultatet …');
    try {const result=await request('/quizlab/publish',{requestId:crypto.randomUUID(),nickname:form.elements.nickname.value.trim()},true);state={...state,...result,published:true};form.replaceWith(Object.assign(document.createElement('p'),{className:'saved-note',textContent:'Resultatet er lagret.'}));notice('');await scores();}
    catch(error){notice(error.message,true);button.disabled=false;}
    finally {busy=false;}
  });
  document.getElementById('quiz-result').scrollIntoView({block:'start'});
}
function failure(error) {
  stop();app.setAttribute('aria-busy','false');app.innerHTML=`<section class="quiz-intro"><span class="eyebrow">OnlyFag Quizlab</span><h1>Kunne ikke åpne quizen</h1><p>${escape(error.message)}</p><button id="quiz-retry" class="primary-button" type="button">Prøv igjen</button><p><a href="/">Til OnlyFag</a></p></section>`;document.getElementById('quiz-retry').onclick=()=>location.reload();
}
function theme(dark) {document.documentElement.dataset.theme=dark?'dark':'light';try{localStorage.setItem('onlyfag-quizlab-theme',dark?'dark':'light');}catch{}}
let dark=matchMedia('(prefers-color-scheme: dark)').matches;try{const saved=localStorage.getItem('onlyfag-quizlab-theme');if(saved)dark=saved==='dark';}catch{}theme(dark);
document.getElementById('quiz-theme').onclick=()=>theme(document.documentElement.dataset.theme!=='dark');
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
document.addEventListener('keydown',event=>{if(event.altKey||event.ctrlKey||event.metaKey||/INPUT|TEXTAREA/.test(event.target.tagName))return;const index=Number(event.key);if(index>=1&&index<=6&&!busy)document.querySelectorAll('#quiz-choices button')[index-1]?.click();});
window.QuizLabPlayer={getState:()=>state,getQuiz:()=>quiz};
(async()=>{
  if(!slug)throw Error('Åpne quizadressen du har fått av læreren, for eksempel onlyfag.no/quiz01.');
  const [metadata,reference]=await Promise.all([request('/quizlab/quizzes/'+encodeURIComponent(slug)),loadJSON('/assets/quizlab/catalog.json')]);
  quiz=metadata.quiz || metadata;catalog=reference;
  let previous;try{previous=JSON.parse(sessionStorage.getItem(storageKey)||'null');}catch{}
  if(previous?.token){token=previous.token;try{const restored=await request('/quizlab/status',{},true);app.setAttribute('aria-busy','false');applyState(restored);return;}catch{token=null;}}
  intro();
})().catch(failure);
