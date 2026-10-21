/* Remote rounds use the existing engines. Old local scores are never uploaded. */
(() => {
 const base=window.GEO_SCORE_API,mode=document.body.dataset.quiz;
 if(!base||!['flags','capitals','flagcapital','places','countries','geoguessr'].includes(mode))return;
 let active=null,busy=false,localRun=false,startSequence=0;
 const language=()=>window.QuizLanguage?.language||'no';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function api(path,body,run){
  const payload=body?{...body,requestId:crypto.randomUUID()}:null;
  for(let attempt=0;attempt<2;attempt++){
   try{const response=await fetch(base+path,{method:payload?'POST':'GET',credentials:'omit',cache:'no-store',headers:{...(payload?{'Content-Type':'application/json'}:{}),...(run?{Authorization:'Bearer '+run.token}:{})},...(payload?{body:JSON.stringify(payload)}:{}),signal:AbortSignal.timeout(10000)});const data=await response.json();if(!response.ok)throw Object.assign(Error(data.error||'unavailable'),{http:response.status});return data;}
   catch(error){if(attempt||error.http)throw error;}
  }
 }
 function notice(message){let n=document.getElementById('geo-online-notice');if(!n){n=document.createElement('div');n.id='geo-online-notice';n.setAttribute('role','status');document.body.append(n);}n.textContent=message;}
 function offline(){active=null;localRun=true;notice('Nettlisten er utilgjengelig. Runden fortsetter bare lokalt.');}
 async function start(config,begin,fallback){
  if(busy)return;const sequence=++startSequence;busy=true;notice('Kobler til nettlisten …');
  try{const reply=await api('/session',config);if(sequence!==startSequence)return;active={config:reply.config,token:reply.token,reply};localRun=false;document.getElementById('geo-online-notice')?.remove();begin(reply);}
  catch(_){if(sequence===startSequence){offline();fallback();}}finally{busy=false;}
 }
 function setupConfig(key){const [type,region]=key.split('|'),game=type==='countries2'?'countries':type;if(!['flags','capitals','flagcapital','places','countries'].includes(game))return null;const variant=document.querySelector('.world-submode')?.value||active?.config.variant;return {game,region:region==='streak'?'world':region||'world',...(variant?{variant}:{}),language:language()};}
 async function showBoard(config,run=active,limit=config.game==='mapwiz'?10:5){
  document.getElementById('geo-online-board')?.remove();const dialog=document.createElement('dialog');dialog.id='geo-online-board';dialog.className='mapwiz-top-ten';dialog.setAttribute('aria-labelledby','geo-online-title');
  dialog.innerHTML=`<div class="mapwiz-top-ten-heading"><h3 id="geo-online-title">${limit===10?'Topp 10 på nett':'Topp 5 på nett'}</h3><button class="mapwiz-top-ten-close" type="button" aria-label="Lukk">×</button></div><p>Felles resultatliste. Bruk bare kallenavn, ikke fullt navn.</p><div id="geo-online-content" aria-live="polite">Laster resultater …</div>`;
  document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();const content=dialog.querySelector('#geo-online-content');
  try{
   const result=await api('/scores?config='+encodeURIComponent(JSON.stringify(config)));if(!dialog.isConnected)return;
   const canSave=run?.reply.complete&&!run.saved&&config===run.config;
   content.innerHTML=(canSave?`<p>${run.reply.total.toFixed(1)} poeng</p><form class="mapwiz-score-form"><label for="geo-online-name">Kallenavn</label><div><input id="geo-online-name" maxlength="24" required autocomplete="off" placeholder="Velg et kallenavn"><button type="submit">Lagre resultat</button></div></form>`:'')+'<p class="mapwiz-score-status" role="status"></p>'+(result.rows.length?`<table><thead><tr><th>#</th><th>Navn</th><th>Poeng</th><th>Tid</th></tr></thead><tbody>${result.rows.slice(0,limit).map((r,i)=>`<tr><td>${i+1}</td><td data-no-translate>${esc(r.nickname)}</td><td>${Number(r.score).toFixed(1)}</td><td>${formatSeconds(Math.floor(r.time_ms/1000))}</td></tr>`).join('')}</tbody></table>`:'<p>Ingen resultater ennå.</p>');
   content.querySelector('form')?.addEventListener('submit',async event=>{
    event.preventDefault();const button=content.querySelector('form button');button.disabled=true;
    try{await api('/publish',{nickname:content.querySelector('input').value.trim()},run);run.saved=true;dialog.close();showBoard(config,run,limit);}
    catch(error){content.querySelector('.mapwiz-score-status').textContent=error.message==='invalid_nickname'?'Bruk et kallenavn på maks 24 tegn uten e-post eller lenker.':'Kunne ikke lagre på nett. Prøv igjen.';button.disabled=false;}
   });
  }catch(_){content.textContent='Nettlisten er utilgjengelig akkurat nå. Prøv igjen senere.';}
 }
 window.GeoOnline={enabled:true,
  showMapWiz(categories){if(localRun)return false;showBoard(active?.config||{game:'mapwiz',categories:[...categories].sort(),language:language()});return true;},
  showLegacy(key){const c=setupConfig(key);if(!c)return false;showBoard(active?.config||c);return true;},
  finishLocal(result,target){
   if(!active?.reply.complete)return false;const run=active;
   if(target&&!target.querySelector('.geo-online-result')){const box=document.createElement('div');box.className='geo-online-result';const message=document.createElement('p');message.textContent='Resultatet er kontrollert på nett.';const button=document.createElement('button');button.type='button';button.className='world-button';button.textContent='Topp 5 på nett';button.onclick=()=>showBoard(run.config,run);box.append(message,button);target.append(box);if(run.config.game==='countries'){worldTrainerState.finalScore=run.reply.total;const score=document.querySelector('.country-map-result-stats span');if(score)score.textContent='Poeng: '+run.reply.total;}}
   return true;
  }
 };
 const nativeInit=initWorldTrainer;window.initWorldTrainer=function(){startSequence++;active=null;localRun=false;return nativeInit.apply(this,arguments);};
 const nativeStart=startWorldTrainer,nativeBuild=buildWorldQuestion,nativeChoose=chooseWorldOption;
 window.startWorldTrainer=function(game){const app=getWorldApp(game),region=app.querySelector('.world-region')?.value||'world',pace=app.querySelector('.world-pace')?.value||'sudden';if(!['flags','capitals','flagcapital','places'].includes(game)||region!=='world'||pace!=='sudden'){active=null;return nativeStart.apply(this,arguments);}return start({game,region,variant:app.querySelector('.world-submode')?.value,language:language()},()=>nativeStart(game),()=>nativeStart(game));};
 window.buildWorldQuestion=function(game,variant){
  if(!active||active.config.game!==game)return nativeBuild.apply(this,arguments);const q=active.reply.question;if(!q)return null;
  const places=game==='places',source=places?GEO_QUIZ_DATA.places:GEO_QUIZ_DATA.countries,id=t=>places?t.category+'|'+t.place:t.country,find=key=>source.find(t=>id(t)===key),target=find(q.target),options=q.options.map(find);
  const state=worldTrainerState,asked=places?state.askedPlaces:state.askedCountries,name=places?target.place:target.country;if(!asked.includes(name))asked.push(name);
  const result={kind:'mc',options,isCorrect:o=>id(o)===q.target,optionHtml:o=>o.country,answerText:target.country};
  if(game==='capitals'){result.prompt=variant==='capital-country-mc'?`Hvilket land har ${target.capital} som hovedstad?`:`Hva heter hovedstaden i ${target.country}?`;result.optionHtml=o=>variant==='capital-country-mc'?o.country:o.capital;result.answerText=variant==='capital-country-mc'?target.country:target.capital;}
  else if(game==='flags'||game==='flagcapital'){
   const reverse=variant.endsWith('flag-mc'),capital=game==='flagcapital';result.prompt=reverse?(capital?`Hvilket flagg hører til landet med hovedstaden ${target.capital}?`:`Hvilket flagg tilhører ${target.country}?`):(capital?'Hvilken hovedstad hører til dette flagget?':'Hvilket land har dette flagget?')+'<br>'+flagHtml(target,135);result.optionHtml=reverse?o=>flagHtml(o,120):capital?o=>o.capital:o=>o.country;result.answerText=reverse?target.country:capital?target.capital:target.country;
  }else{const reverse=variant==='place-desc-mc';result.heading=reverse?'Hvilken beskrivelse passer til stedet?':'Hvilket sted passer til beskrivelsen?';result.prompt=`<span class="${reverse?'world-place-question-name':'world-place-question-desc'}">${esc(reverse?target.place:target.explanation)}</span>`;result.promptClass='world-place-question';result.gridClass=reverse?'places-six places-descriptions':'places-six places-names';result.optionHtml=reverse?o=>`<span class="world-place-desc">${esc(o.explanation)}</span>`:o=>esc(o.place);result.answerText=reverse?target.explanation:target.place;}
  return result;
 };
 window.chooseWorldOption=async function(index,button){if(!active)return nativeChoose.apply(this,arguments);if(busy||worldTrainerState.answerLocked||worldTrainerState.ended)return;const run=active,q=run.reply.question;busy=true;document.querySelectorAll('.world-option').forEach(b=>b.disabled=true);try{run.reply=await api('/answer',{question:q.id,choice:q.options[index]},run);}catch(_){offline();}try{nativeChoose(index,button);}finally{busy=false;}};
 const nativeCountryStart=startCountryMapQuiz,nativeCountryGuess=checkCountryGuess,nativeCountryHint=countryMapHint,nativeCountryFinish=finishCountryMapQuiz;
 window.startCountryMapQuiz=function(region){return start({game:'countries',region,language:language()},()=>nativeCountryStart(region),()=>nativeCountryStart(region));};
 window.checkCountryGuess=async function(){if(!active||active.config.game!=='countries')return nativeCountryGuess();if(busy||worldTrainerState.ended)return;busy=true;const run=active,input=document.getElementById('country-guess'),value=input.value;try{run.reply=await api('/answer',{country:value},run);}catch(_){offline();}input.value=value;try{nativeCountryGuess();}finally{busy=false;}};
 window.countryMapHint=async function(){if(!active||active.config.game!=='countries')return nativeCountryHint();if(busy)return;busy=true;try{active.reply=await api('/hint',{},active);}catch(_){offline();}try{nativeCountryHint();}finally{busy=false;}};
 window.finishCountryMapQuiz=async function(manual){if(active?.config.game==='countries'&&!active.reply.complete){try{active.reply=await api('/finish',{},active);}catch(_){offline();}}return nativeCountryFinish(manual);};
 if(window.MapWizPrototype){
  const nativeMapStart=startGeoGuessr,nativeMapClick=geoMapClick,nativeNext=nextGeoGuessrRound,nativeMapInit=initGeoGuessr;
  window.initGeoGuessr=function(){startSequence++;active=null;localRun=false;return nativeMapInit();};
  window.startGeoGuessr=function(){const categories=MapWizPrototype.selected().sort();return start({game:'mapwiz',categories,language:language()},reply=>{const targets=reply.targets.map(id=>{const [cat,name,lat,lon]=JSON.parse(id);return MapWizPrototype.pools.get(cat).find(t=>t.name===name&&t.lat===lat&&t.lon===lon);});if(targets.some(t=>!t))throw Error('reference_changed');MapWizPrototype.begin(targets);},nativeMapStart);};
  window.geoMapClick=async function(event){
   if(!active||active.config.game!=='mapwiz')return nativeMapClick(event);if(busy||geoGuessrState.answered)return;
   const run=active,s=geoGuessrState,stage=document.getElementById('geo-map-stage'),norway=s.norwayOnly,frame=stage.querySelector(norway?'[data-no-frame]':'.geo-world-content'),r=frame.getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;
   if(!norway&&(x<0||x>1||y<0||y>1))return;const point=norway?{lat:81.5-y*24.3,lon:-12+x*46}:geoPercentToLatLon(x*100,y*100);busy=true;
   let reply;try{reply=await api('/answer',{question:run.reply.question.id,...point},run);run.reply=reply;}catch(_){offline();}
   const current=frame.getBoundingClientRect();try{nativeMapClick({clientX:current.left+x*current.width,clientY:current.top+y*current.height});if(reply&&s.answered){Object.assign(s.results.at(-1),reply.feedback);s.total=reply.total;s.baseTotal=reply.baseTotal;s.bonusTotal=reply.bonusTotal;document.getElementById('geo-feedback').innerHTML=`<strong>${Math.round(reply.feedback.km).toLocaleString('nb-NO')} km unna</strong> · ${reply.feedback.base.toFixed(1)} geografi + ${reply.feedback.bonus.toFixed(1)} tidsbonus = <strong>${reply.feedback.points.toFixed(1)} p</strong><br><button class="geo-next-button" onclick="nextGeoGuessrRound()">${s.index+1>=s.rounds.length?'Se resultat (space)':'Neste sted (space)'}</button>`;}}finally{busy=false;}
  };
  window.nextGeoGuessrRound=async function(){if(!active||active.config.game!=='mapwiz')return nativeNext();if(busy||!geoGuessrState.answered)return;busy=true;try{if(!active.reply.complete)active.reply=await api('/next',{},active);}catch(_){offline();}try{return nativeNext();}finally{busy=false;}};
  document.getElementById('geo-start-button')?.addEventListener('click',event=>{event.stopImmediatePropagation();event.preventDefault();window.startGeoGuessr();},true);
 }
})();
