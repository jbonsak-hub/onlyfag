/* Mobile Worldle/Tradle: four choices, one answer, a continuous correct streak.
   Desktop engines and their distance/hint rules remain independent. */
(() => {
 const worldle=document.body.dataset.quiz==='detective2';
 const tradle=new URLSearchParams(location.search).get('quiz')==='tradle';
 if(!worldle&&!tradle)return;
 const mobile=matchMedia('(max-width:700px),(max-width:1000px) and (max-height:500px)');
 const shuffle=items=>{const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 let shell,current=null,score=0,ended=false,locked=false,advanceTimer,session=0;
 let tradleAsked=new Set();
 const root=()=>document.getElementById(worldle?'world-detective2-app':'tradle');
 const model=()=>worldle?(typeof worldTrainerState!=='undefined'&&worldTrainerState?.mode==='detective2'?{target:worldTrainerState.target,pool:worldTrainerState.pool}:null):{target:state.tradle.target,pool:TRADLE_DATA};
 function embeddedTradle(){
  state.tradle.loadSeq++;resetTradleUi();
  let fresh=TRADLE_DATA.filter(p=>!tradleAsked.has(p.country));if(!fresh.length){tradleAsked.clear();fresh=TRADLE_DATA;}
  const profile=fresh[Math.floor(Math.random()*fresh.length)];tradleAsked.add(profile.country);
  state.tradle.target=profile;state.tradle.source='embedded';document.getElementById('tradleChart').classList.remove('tradle-loading');
  drawTradle();
 }
 function mount(){
  const host=root();if(!host)return false;
  if(shell?.isConnected)return true;
  shell=document.createElement('div');shell.className='mobile-streak-shell';
  shell.innerHTML='<div class="mobile-streak-meta"><span class="mobile-streak-score" aria-live="polite"></span></div><h2>'+(worldle?'Hvilket land?':'Hvilket land eksporterer dette?')+'</h2><div class="mobile-streak-visual"></div><div class="quiz-mobile-answers" role="group" aria-label="Velg et land"></div><p class="mobile-streak-feedback" role="status"></p><button class="mobile-streak-restart" type="button" hidden>Spill igjen</button>';
  shell.querySelector('.mobile-streak-restart').onclick=restart;
  host.append(shell);return true;
 }
 function clonedVisual(){
  const original=worldle?root().querySelector('.worldle-target svg'):document.getElementById('tradleChart');
  if(!original)return null;const clone=original.cloneNode(true);clone.removeAttribute('id');clone.setAttribute('focusable','false');
  const ids=new Map([...clone.querySelectorAll('[id]')].map(el=>[el.id,'mobile-'+el.id]));
  for(const el of [clone,...clone.querySelectorAll('*')])for(const attr of [...el.attributes]){let value=attr.value;for(const [id,replacement]of ids)value=value.replaceAll('url(#'+id+')','url(#'+replacement+')');if(attr.name==='id')value=ids.get(value)||value;if(value!==attr.value)el.setAttribute(attr.name,value);}
  return clone;
 }
 function refresh(){
  document.body.classList.toggle('quiz-mobile-streak',mobile.matches);
  // The parent injects the shared frame stylesheet after load. Hide the old
  // layout immediately so desktop hints never flash while that CSS arrives.
  const desktop=root()?.querySelector(worldle?'.worldle-game':'.tradle-layout');
  if(desktop){desktop.hidden=mobile.matches;if(mobile.matches)desktop.style.setProperty('display','none','important');else desktop.style.removeProperty('display');}
  if(shell){shell.hidden=!mobile.matches;if(mobile.matches)shell.style.removeProperty('display');else shell.style.setProperty('display','none','important');}
  if(!mobile.matches)return;
  const s=model();if(!s?.target)return;if(!mount())return;
  if(current===s.target&&shell.dataset.country===s.target.country)return;
  current=s.target;shell.dataset.country=current.country;locked=false;
  const visual=clonedVisual();shell.querySelector('.mobile-streak-visual').replaceChildren(...(visual?[visual]:[]));
  const target=current.country,pool=[...new Set(s.pool.map(p=>p.country))].filter(n=>n&&n!==target);
  const choices=shuffle([target,...shuffle(pool).slice(0,3)]),box=shell.querySelector('.quiz-mobile-answers');
  box.replaceChildren(...choices.map(country=>{const b=document.createElement('button');b.type='button';b.dataset.country=country;b.textContent=country;b.onclick=()=>answer(country);return b;}));
  shell.querySelector('.mobile-streak-score').textContent='Riktige på rad: '+score;
  shell.querySelector('.mobile-streak-feedback').textContent='';shell.querySelector('.mobile-streak-restart').hidden=true;
 }
 function answer(country){
  if(!mobile.matches||ended||locked||!current)return;locked=true;
  const correct=country===current.country,feedback=shell.querySelector('.mobile-streak-feedback');
  for(const b of shell.querySelectorAll('.quiz-mobile-answers button')){b.disabled=true;b.classList.toggle('is-correct',b.dataset.country===current.country);b.classList.toggle('is-wrong',!correct&&b.dataset.country===country);}
  if(correct){score++;shell.querySelector('.mobile-streak-score').textContent='Riktige på rad: '+score;feedback.textContent='Riktig!';const run=session;advanceTimer=setTimeout(()=>{if(run!==session||!mobile.matches)return;if(worldle)nextKartdetektivRound();else embeddedTradle();refresh();},650);}
  else{ended=true;feedback.textContent='Feil. Riktig svar: '+current.country;shell.querySelector('.mobile-streak-restart').hidden=false;}
 }
 function restart(){clearTimeout(advanceTimer);session++;score=0;ended=false;locked=false;current=null;tradleAsked.clear();if(worldle)startWorldle2();else embeddedTradle();refresh();}
 const originalStart=worldle?window.startWorldle2:window.newTradleGame;
 if(worldle)window.startWorldle2=function(){if(mobile.matches){clearTimeout(advanceTimer);session++;score=0;ended=false;current=null;}return originalStart.apply(this,arguments);};
 else{window.newTradleGame=function(){if(mobile.matches)return restart();return originalStart.apply(this,arguments);};document.getElementById('tradleNew').onclick=()=>window.newTradleGame();}
 const observed=worldle?document.querySelector('main.content'):root();
 let queued=false;new MutationObserver(records=>{if(!mobile.matches||queued||records.every(r=>r.target.nodeType===1?r.target.closest('.mobile-streak-shell'):r.target.parentElement?.closest('.mobile-streak-shell')))return;queued=true;queueMicrotask(()=>{queued=false;refresh();});}).observe(observed,{childList:true,subtree:true,characterData:true});
 mobile.addEventListener('change',()=>{clearTimeout(advanceTimer);if(mobile.matches)restart();else refresh();});
 if(tradle&&mobile.matches)embeddedTradle();refresh();
})();
