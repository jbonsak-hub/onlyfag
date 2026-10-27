/* Extended MapWiz. Shared by the published page and its preview. */
(() => {
 const reference=window.MAPWIZ_PROTOTYPE_DATA;
 window.MapWizWorld.install(reference.worldMap);
 const escape=escapeGeoHtml;
 const categoryDefinitions=[
  ["flags","Flagg",null],
  ["capitals","Hovedstad",null],
  ["cities","By",null],
  ["mountains","Fjell","Fjell og vulkaner"],
  ["ranges","Fjellkjede","Fjellkjeder"],
  ["rivers","Elv","Elver"],
  ["deserts","Ørkener","Ørkener"],
  ["lakes","Innsjøer","Innsjøer"],
  ["islands","Øyer, øygrupper og halvøyer","Øyer, øygrupper og halvøyer"],
  ["regions","Regioner og områder","Regioner og områder"],
  ["seas","Hav og sjøområder","Hav og sjøområder"],
  ["straits","Stred, kanaler, bukter og kapp","Stred, kanaler, bukter og kapp"],
  ["landmarks","Kjente byggverk og historiske steder","Kjente byggverk og historiske steder"],
  ["nature","Kjente naturfenomener","Kjente natursteder"],
  ["place:Norge","Norge","Norge"],
  ["historical","Historiske navn","Historiske riker og gamle navn"]
 ];
 const midpoints=new Map(window.MAPWIZ_RIVER_MIDPOINTS.map(t=>[t.name,t]));
 const pools=new Map(categoryDefinitions.map(([key,label,category])=>{
  let items;
  if(key==='flags')items=reference.countries.filter(c=>c.flag).map(c=>({...c,kind:'Land',presentation:'flag'}));
  else if(key==='capitals')items=geoPlayableCapitals();
  else if(key==='cities')items=reference.cities.map(c=>({...c,kind:'By',explanation:GEO_QUIZ_DATA.countries.find(n=>n.flagCode===c.countryCode.toLowerCase())?.country||c.country}));
  else if(key==='rivers')items=[...midpoints.values()].map(t=>({...t,kind:'Elv',explanation:'Siktepunkt omtrent midt i det kartlagte hovedløpet.'}));
  else items=geoPlayablePlaces().filter(t=>t.category===category);
  for(const target of reference.extraTargets||[])if(target.category===category&&!items.some(t=>t.name===target.name))items.push(target);
  return [key,items.filter(t=>Object.hasOwn(reference.difficulties.assignments[key],t.name)).map(t=>({...t,quizCategory:key,categoryLabel:label,category:category||label,difficulty:reference.difficulties.assignments[key][t.name]}))];
 }));
 const definitions=reference.difficulties.levels.map(level=>[level.id,level.label]);
 const difficultyPools=new Map(definitions.map(([key])=>[key,[...pools.values()].flat().filter(target=>target.difficulty===key)]));
 const levelDescriptions={easy:'Kjente steder',medium:'En større utfordring',hard:'For geografinerder'};
 const levelIcons={
  easy:'<circle cx="24" cy="24" r="18"/><path d="M6 24h36M24 6c-7 7-7 29 0 36M24 6c7 7 7 29 0 36M9 15h30M9 33h30"/>',
  medium:'<circle cx="24" cy="24" r="18"/><path d="m30 18-4 12-12 4 4-12 12-4Zm-6-9v4m0 22v4M9 24h4m22 0h4"/>',
  hard:'<path d="m5 38 12-22 8 13 6-11 12 20H5Zm7-13 5 3 5-3m5 1 4 3 5-3M31 7v5m-3-2h6"/>'
 };
 const colors=['#be283b','#2265bd','#a44908','#7938a0','#08765e','#b32773','#68710e','#5149b5','#794f2c','#315468'];
 let selected=new Set(['easy']),position=null,hudObserver=null;
 const app=()=>document.getElementById('geo-guessr-app');
 const scoreStore='geoHighscoresV1';
 const boardKey=()=> 'mapwiz-levels-v1|'+[...selected].sort().join(',');
 const compareScores=(a,b)=>b.score-a.score||a.timeSec-b.timeSec||a.created-b.created;
 function scoreDatabase(){try{const value=JSON.parse(localStorage.getItem(scoreStore)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch(_){return {};}}
 function scoreRows(key){const rows=scoreDatabase()[key];return (Array.isArray(rows)?rows:[]).filter(r=>typeof r.name==='string'&&Number.isFinite(r.score)&&r.score>=0&&r.score<=1100&&Number.isFinite(r.timeSec)&&r.timeSec>=0).sort(compareScores).slice(0,10);}
 function completedScore(){const s=geoGuessrState;if(!s||s.results.length!==10||s.rounds.length!==10||!s.completedAt)return null;return {score:Math.round(s.total*10)/10,timeSec:Math.max(0,Math.round((s.completedAt-s.startedAt)/1000)),created:s.completedAt};}
 function showTopTen(localOnly=false){
  if(!localOnly&&window.GeoOnline?.showMapWiz([...selected]))return;
  document.getElementById('mapwiz-top-ten')?.remove();
  const key=boardKey(),rows=scoreRows(key),result=completedScore(),s=geoGuessrState;
  const qualifies=result&&result.score>0&&!s.topTenSaved&&(rows.length<10||compareScores(result,rows.at(-1))<0);
  const dialog=document.createElement('dialog');dialog.id='mapwiz-top-ten';dialog.className='mapwiz-top-ten';dialog.setAttribute('aria-labelledby','mapwiz-top-ten-title');
  dialog.innerHTML=`<div class="mapwiz-top-ten-heading"><h3 id="mapwiz-top-ten-title">Topp 10</h3><button type="button" class="mapwiz-top-ten-close" aria-label="Lukk">×</button></div><p>Lagres bare i denne nettleseren. Egen liste for hvert nivåvalg.</p><div class="mapwiz-top-ten-categories">${definitions.filter(([key])=>selected.has(key)).map(([,label])=>`<span>${escape(label)}</span>`).join('')}</div>${qualifies?'<form class="mapwiz-score-form"><label for="mapwiz-score-name">Kallenavn</label><div><input id="mapwiz-score-name" name="nickname" maxlength="24" required autocomplete="off" placeholder="Velg et kallenavn"><button type="submit">Lagre resultat</button></div></form>':''}<p class="mapwiz-score-status" role="status"></p><div class="mapwiz-top-ten-table">${rows.length?`<table><thead><tr><th>#</th><th>Navn</th><th>Poeng</th><th>Tid</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td data-no-translate>${escape(r.name)}</td><td>${r.score.toFixed(1)}</td><td>${Math.floor(r.timeSec/60)}:${String(r.timeSec%60).padStart(2,'0')}</td></tr>`).join('')}</tbody></table>`:'<p>Ingen resultater ennå.</p>'}</div>`;
  document.body.append(dialog);dialog.querySelector('.mapwiz-top-ten-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());
  dialog.querySelector('form')?.addEventListener('submit',event=>{
   event.preventDefault();const name=dialog.querySelector('input').value.trim().slice(0,24);if(!name)return;
   const db=scoreDatabase();db[key]=scoreRows(key).concat({...result,name}).sort(compareScores).slice(0,10);
   try{localStorage.setItem(scoreStore,JSON.stringify(db));s.topTenSaved=true;dialog.close();showTopTen(true);document.querySelector('.mapwiz-score-status').textContent='Resultatet er lagret.';}
   catch(_){dialog.querySelector('.mapwiz-score-status').textContent='Kunne ikke lagre. Nettleseren tillater ikke lokal lagring.';}
  });
  dialog.showModal();
 }
 window.MapWizPrototype={definitions,pools,difficultyPools,reference,selected:()=>[...selected],begin:questions=>beginRound(questions),showLocalTopTen:()=>showTopTen(true)};
 initGeoGuessr=function(){
  stopGeoGuessrClock();geoGuessrState=null;hudObserver?.disconnect();document.body.classList.add('mapwiz-setup');
  app().innerHTML=`<div class="geo-guessr-setup-wrap"><div class="geo-guessr-setup mapwiz-prototype-setup">
   <div class="prototype-setup-intro"><h3>MapWiz</h3></div>
   <div class="mapwiz-difficulty-control"><div class="mapwiz-level-readout"><span id="mapwiz-level-icon" aria-hidden="true"></span><div><strong id="mapwiz-level-title"></strong><span id="mapwiz-level-count"></span></div></div><div class="mapwiz-slider-track"><input id="mapwiz-level-slider" aria-label="Nivå" type="range" min="0" max="2" step="1" value="${definitions.findIndex(([key])=>selected.has(key))}"><div class="mapwiz-level-stops">${definitions.map(([key,label],index)=>`<button type="button" data-mapwiz-level="${key}" data-index="${index}">${label}</button>`).join('')}</div></div></div>
   <div class="mapwiz-setup-bottom"><div class="geo-setup-actions"><button class="geo-start-button" id="geo-start-button">Start 10 spørsmål →</button><div id="prototype-selection" aria-live="polite"></div></div><button class="mapwiz-top-ten-button" id="mapwiz-show-top-ten" type="button">Topp 10</button></div>
   <div class="prototype-notes"><span>Sikt mot midten av større områder.</span><a class="mapwiz-places-link" href="/geografi/mapwiz-steder.html">Kjente steder ↗</a></div>
  </div></div>`;
  const slider=app().querySelector('#mapwiz-level-slider');
  const choose=index=>{selected=new Set([definitions[index][0]]);refresh();};
  slider.addEventListener('input',()=>choose(Number(slider.value)));
  app().querySelectorAll('[data-mapwiz-level]').forEach(button=>button.onclick=()=>choose(Number(button.dataset.index)));
  app().querySelector('#geo-start-button').onclick=prepareRound;
  app().querySelector('#mapwiz-show-top-ten').onclick=()=>showTopTen();
  refresh();
 };
 function refresh(){
  const index=definitions.findIndex(([key])=>selected.has(key)),[key,label]=definitions[index];
  const slider=document.getElementById('mapwiz-level-slider');slider.value=index;slider.setAttribute('aria-valuetext',label);slider.style.setProperty('--level-progress',index*50+'%');
  document.getElementById('mapwiz-level-title').textContent=label;
  document.getElementById('mapwiz-level-count').textContent=difficultyPools.get(key).length+' oppgaver';
  document.getElementById('mapwiz-level-icon').innerHTML=`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${levelIcons[key]}</svg>`;
  document.getElementById('prototype-selection').textContent=levelDescriptions[key];
  app().querySelectorAll('[data-mapwiz-level]').forEach(button=>{const active=button.dataset.mapwizLevel===key;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
  document.getElementById('mapwiz-show-top-ten').innerHTML=`<span>Topp 10</span> · <span>${escape(label)}</span>`;
 }

 function rounds(){
  const buckets=shuffleArray([...selected].map(key=>shuffleArray(difficultyPools.get(key)))),out=[],seen=new Set();
  while(out.length<10){
   let added=false;
   for(const bucket of shuffleArray(buckets)){
    if(out.length===10)break;
    const target=bucket.find(t=>!seen.has(t.name));
    if(target){seen.add(target.name);out.push(target);added=true;}
   }
   if(!added)break;
  }
  return out;
 }
 function prepareRound(){
  stopGeoGuessrClock();geoGuessrState=null;position=null;hudObserver?.disconnect();document.body.classList.remove('mapwiz-setup');
  app().innerHTML=`<div class="geo-map-stage" id="geo-map-stage"><div class="geo-world-scroll"><div class="geo-world-content">${MapWizWorld.html()}</div></div>
   <button class="geo-map-exit" id="mapwiz-ready-exit">Avslutt</button>
   <div class="geo-hud mapwiz-ready" id="geo-hud"><h3>Klar for MapWiz?</h3><p>Trykk så nær stedet som mulig. Raske svar gir tidsbonus.</p><button type="button" class="geo-start-button" id="mapwiz-ready-start">Start spillet →</button></div>
  </div>`;
  document.getElementById('mapwiz-ready-exit').onclick=()=>initGeoGuessr();
  document.getElementById('mapwiz-ready-start').onclick=function(){this.disabled=true;startGeoGuessr();};
  MapWizZoom.attach(app().querySelector('.geo-world-scroll'),reference.worldMap);
  const hud=document.getElementById('geo-hud');enableDragging(hud);requestAnimationFrame(()=>{if(hud.isConnected)placeBox();});
 }
 function beginRound(questions){
  if(!questions.length)return;
  stopGeoGuessrClock();geoGuessrSelection=new Set(selected);document.body.classList.remove('mapwiz-setup');
  geoGuessrState={rounds:questions,index:0,total:0,baseTotal:0,bonusTotal:0,results:[],answered:false,questionStarted:performance.now(),startedAt:Date.now(),norwayOnly:false,hsMode:null,hsHandled:true};
  renderGeoGuessrRound();
 }
 startGeoGuessr=function(){beginRound(rounds());};
 const renderOriginal=renderGeoGuessrRound,clickOriginal=geoMapClick;
 function placeBox(){
  const hud=document.getElementById('geo-hud');if(!hud)return;
  const r=hud.getBoundingClientRect(),margin=8;
  const desired=position||{x:Math.round(innerWidth*.047),y:Math.round(innerHeight*.72)};
  const placed={x:Math.max(margin,Math.min(innerWidth-r.width-margin,desired.x)),y:Math.max(margin,Math.min(innerHeight-r.height-margin,desired.y))};
  if(position)position=placed;
  hud.style.setProperty('--hud-x',placed.x+'px');hud.style.setProperty('--hud-y',placed.y+'px');
 }
 function enableDragging(hud){
  if(hud.dataset.draggable)return;hud.dataset.draggable='true';
  let drag=null;hud.tabIndex=0;hud.setAttribute('aria-label','Oppgaveboks. Dra bakgrunnen eller bruk piltastene for å flytte.');
  hud.addEventListener('pointerdown',event=>{
   if(event.button!==0||event.target.closest('button,a,input,select,textarea,img'))return;
   event.preventDefault();event.stopPropagation();const r=hud.getBoundingClientRect();
   drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:r.left,top:r.top};hud.setPointerCapture(event.pointerId);hud.classList.add('is-dragging');
  });
  hud.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;event.stopPropagation();position={x:drag.left+event.clientX-drag.x,y:drag.top+event.clientY-drag.y};placeBox();});
  function end(event){if(!drag||event.pointerId!==drag.id)return;event.stopPropagation();drag=null;hud.classList.remove('is-dragging');if(hud.hasPointerCapture(event.pointerId))hud.releasePointerCapture(event.pointerId);}
  hud.addEventListener('pointerup',end);hud.addEventListener('pointercancel',end);
  hud.addEventListener('lostpointercapture',()=>{drag=null;hud.classList.remove('is-dragging');});
  hud.addEventListener('keydown',event=>{
   if(event.target!==hud||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
   event.preventDefault();event.stopPropagation();
   if(event.key==='Home')position=null;
   else{const r=hud.getBoundingClientRect();position={x:r.x+(event.key==='ArrowLeft'?-16:event.key==='ArrowRight'?16:0),y:r.y+(event.key==='ArrowUp'?-16:event.key==='ArrowDown'?16:0)};}
   placeBox();
  });
  hudObserver?.disconnect();hudObserver=new ResizeObserver(()=>{if(hud.isConnected)placeBox();});hudObserver.observe(hud);
 }
 function drawResults(){
  const s=geoGuessrState,stage=app().querySelector('.geo-map-stage');if(!s||!stage)return;
  const lines=stage.querySelector('.geo-line-layer'),markers=stage.querySelector('#geo-markers');lines.replaceChildren();markers.replaceChildren();
  const project=point=>geoToPercent(point.lat,point.lon);
  s.results.forEach((result,index)=>{
   const guess=project(result.guessLocation),answer=project(result.answerLocation);
   const color=colors[index],group=document.createElementNS('http://www.w3.org/2000/svg','g');group.dataset.resultIndex=index;
   group.innerHTML=geoWrappedLineSvg(guess.x,guess.y,answer.x,answer.y);
   group.querySelectorAll('line').forEach(line=>line.style.stroke=color);lines.append(group);
   for(const [kind,point] of [['guess',guess],['answer',answer]]){
    const marker=document.createElement('div');marker.className='geo-marker '+kind;marker.style.left=point.x+'%';marker.style.top=point.y+'%';marker.style.borderColor=color;marker.dataset.resultIndex=index;
    if(kind==='answer')marker.style.background=color;
    marker.title=`${index+1}. ${result.name} · ${kind==='answer'?'Fasit':'Ditt treff'}`;markers.append(marker);
   }
  });
 }
 window.addEventListener('resize',()=>{placeBox();if(document.querySelector('.prototype-summary'))drawResults();});
 renderGeoGuessrRound=function(){
  const state=geoGuessrState;if(state)state.norwayOnly=false;
  renderOriginal();const s=geoGuessrState;if(!s||s.index>=s.rounds.length)return;
  const t=s.rounds[s.index],hud=document.getElementById('geo-hud');
  const label=hud.querySelector('.geo-target-label');
  if(t.presentation==='flag'){
   label.textContent='Hvilket land?';const image=document.createElement('img');image.className='prototype-flag';image.src=t.flag;image.alt='Flagget du skal kjenne igjen';label.after(image);
  }
  document.getElementById('geo-hint')?.remove();enableDragging(hud);requestAnimationFrame(()=>{if(hud.isConnected)placeBox();});
 };
 geoMapClick=function(event){
  const s=geoGuessrState;if(!s||s.answered)return;const rect=app().querySelector('.geo-world-content').getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height,guessLocation=geoPercentToLatLon(x*100,y*100);clickOriginal(event);if(!s.answered)return;
  const point=selector=>{const el=document.querySelector(selector);return {x:parseFloat(el.style.left),y:parseFloat(el.style.top)};};
  const result=s.results.at(-1);Object.assign(result,{guess:point('.geo-marker.guess'),answer:point('.geo-marker.answer'),mapType:'world',guessLocation,answerLocation:{lat:s.rounds[s.index].lat,lon:s.rounds[s.index].lon}});
  const t=s.rounds[s.index];if(t.presentation)document.querySelector('.geo-target-label').textContent=t.name;
 };
 renderGeoGuessrSummary=function(){
  stopGeoGuessrClock();const s=geoGuessrState,stage=app().querySelector('.geo-map-stage');if(!stage)return;
  if(s.results.length===10&&!s.completedAt)s.completedAt=Date.now();
  drawResults();
  const hud=document.getElementById('geo-hud');hud.className='geo-hud prototype-summary';
  hud.innerHTML=`<h3>${s.total.toFixed(1)} / ${s.rounds.length*110} poeng</h3><table class="prototype-results"><thead><tr><th>Sted</th><th title="Poeng for avstand">Avst.p.</th><th title="Poeng for tid">Tidsp.</th></tr></thead><tbody>${s.results.map((r,index)=>`<tr data-result-index="${index}"><td><span class="prototype-result-name" title="${escape(r.name)}"><i style="background:${colors[index]}" aria-hidden="true"></i><span class="prototype-result-label">${escape(r.name)}</span></span></td><td>${r.base.toFixed(1)}</td><td>${r.bonus.toFixed(1)}</td></tr>`).join('')}</tbody></table><div class="prototype-summary-actions"><button class="geo-next-button" id="prototype-again">Spill igjen</button><button class="geo-next-button" id="prototype-settings">Endre nivå</button></div>`;
  position=null;enableDragging(hud);placeBox();
  const topTen=document.createElement('button');topTen.type='button';topTen.className='geo-next-button';topTen.innerHTML=`<span>Topp 10</span> · <span>${escape(definitions.find(([key])=>selected.has(key))[1])}</span>`;topTen.onclick=()=>showTopTen();hud.querySelector('.prototype-summary-actions').append(topTen);
  document.getElementById('prototype-again').onclick=startGeoGuessr;document.getElementById('prototype-settings').onclick=initGeoGuessr;
 };
 // Never restore the original module's remembered category selection here.
 initGeoGuessr();
})();
