/* Extended MapWiz. Shared by the published page and its preview. */
(() => {
 const reference=window.MAPWIZ_PROTOTYPE_DATA;
 const escape=escapeGeoHtml;
 const definitions=[
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
  ["place:Norge","Norge","Norge"]
 ];
 const midpoints=new Map(window.MAPWIZ_RIVER_MIDPOINTS.map(t=>[t.name,t]));
 const pools=new Map(definitions.map(([key,label,category])=>{
  let items;
  if(key==='flags')items=reference.countries.filter(c=>c.flag).map(c=>({...c,kind:'Land',presentation:'flag'}));
  else if(key==='capitals')items=geoPlayableCapitals();
  else if(key==='cities')items=reference.cities.map(c=>({...c,kind:'By',explanation:GEO_QUIZ_DATA.countries.find(n=>n.flagCode===c.countryCode.toLowerCase())?.country||c.country}));
  else if(key==='rivers')items=[...midpoints.values()].map(t=>({...t,kind:'Elv',explanation:'Siktepunkt omtrent midt i det kartlagte hovedløpet.'}));
  else items=geoPlayablePlaces().filter(t=>t.category===category);
  return [key,items.map(t=>({...t,quizCategory:key,categoryLabel:label,category:category||label}))];
 }));
 const colors=['#be283b','#2265bd','#a44908','#7938a0','#08765e','#b32773','#68710e','#5149b5','#794f2c','#315468'];
 let selected=new Set(),position=null,hudObserver=null;
 const app=()=>document.getElementById('geo-guessr-app');
 const unique=items=>new Set(items.map(t=>t.name)).size;
 const scoreStore='geoHighscoresV1';
 const boardKey=()=> 'mapwiz3|'+[...selected].sort().join(',');
 const compareScores=(a,b)=>b.score-a.score||a.timeSec-b.timeSec||a.created-b.created;
 function scoreDatabase(){try{const value=JSON.parse(localStorage.getItem(scoreStore)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch(_){return {};}}
 function scoreRows(key){const rows=scoreDatabase()[key];return (Array.isArray(rows)?rows:[]).filter(r=>typeof r.name==='string'&&Number.isFinite(r.score)&&r.score>=0&&r.score<=1100&&Number.isFinite(r.timeSec)&&r.timeSec>=0).sort(compareScores).slice(0,10);}
 function completedScore(){const s=geoGuessrState;if(!s||s.results.length!==10||s.rounds.length!==10||!s.completedAt)return null;return {score:Math.round(s.total*10)/10,timeSec:Math.max(0,Math.round((s.completedAt-s.startedAt)/1000)),created:s.completedAt};}
 function showTopTen(localOnly=false){
  if(!localOnly&&window.GeoOnline?.showMapWiz([...selected]))return;
  document.getElementById('mapwiz-top-ten')?.remove();
  const key=boardKey(),rows=scoreRows(key),result=completedScore(),s=geoGuessrState;
  const qualifies=result&&!s.topTenSaved&&(rows.length<10||compareScores(result,rows.at(-1))<0);
  const dialog=document.createElement('dialog');dialog.id='mapwiz-top-ten';dialog.className='mapwiz-top-ten';dialog.setAttribute('aria-labelledby','mapwiz-top-ten-title');
  dialog.innerHTML=`<div class="mapwiz-top-ten-heading"><h3 id="mapwiz-top-ten-title">Topp 10</h3><button type="button" class="mapwiz-top-ten-close" aria-label="Lukk">×</button></div><p>Lagres bare i denne nettleseren. Egen liste for hvert kategorivalg.</p><div class="mapwiz-top-ten-categories">${definitions.filter(([key])=>selected.has(key)).map(([,label])=>`<span>${escape(label)}</span>`).join('')}</div>${qualifies?'<form class="mapwiz-score-form"><label for="mapwiz-score-name">Kallenavn</label><div><input id="mapwiz-score-name" name="nickname" maxlength="24" required autocomplete="off" placeholder="Velg et kallenavn"><button type="submit">Lagre resultat</button></div></form>':''}<p class="mapwiz-score-status" role="status"></p><div class="mapwiz-top-ten-table">${rows.length?`<table><thead><tr><th>#</th><th>Navn</th><th>Poeng</th><th>Tid</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td data-no-translate>${escape(r.name)}</td><td>${r.score.toFixed(1)}</td><td>${Math.floor(r.timeSec/60)}:${String(r.timeSec%60).padStart(2,'0')}</td></tr>`).join('')}</tbody></table>`:'<p>Ingen resultater ennå.</p>'}</div>`;
  document.body.append(dialog);dialog.querySelector('.mapwiz-top-ten-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());
  dialog.querySelector('form')?.addEventListener('submit',event=>{
   event.preventDefault();const name=dialog.querySelector('input').value.trim().slice(0,24);if(!name)return;
   const db=scoreDatabase();db[key]=scoreRows(key).concat({...result,name}).sort(compareScores).slice(0,10);
   try{localStorage.setItem(scoreStore,JSON.stringify(db));s.topTenSaved=true;dialog.close();showTopTen(true);document.querySelector('.mapwiz-score-status').textContent='Resultatet er lagret.';}
   catch(_){dialog.querySelector('.mapwiz-score-status').textContent='Kunne ikke lagre. Nettleseren tillater ikke lokal lagring.';}
  });
  dialog.showModal();
 }
 window.MapWizPrototype={definitions,pools,reference,selected:()=>[...selected],begin:questions=>beginRound(questions),showLocalTopTen:()=>showTopTen(true)};
 initGeoGuessr=function(){
  stopGeoGuessrClock();geoGuessrState=null;hudObserver?.disconnect();document.body.classList.add('mapwiz-setup');
  app().innerHTML=`<div class="geo-guessr-setup-wrap"><div class="geo-guessr-setup mapwiz-prototype-setup">
   <div class="prototype-setup-intro"><h3>MapWiz</h3>
    <div class="prototype-intro">Velg kategorier. Hver runde har 10 spørsmål.</div>
    <div class="geo-selection-tools"><button id="prototype-all" type="button">Velg alle</button><button id="prototype-none" type="button">Fjern alle</button></div>
    <div id="prototype-selection" aria-live="polite"></div>
    <button class="mapwiz-top-ten-button" id="mapwiz-show-top-ten" type="button">Topp 10</button>
    <div class="geo-setup-actions"><button class="geo-start-button" id="geo-start-button" disabled>Velg kategorier</button></div>
   </div>
   <div class="geo-selection-grid">${definitions.map(([key,label])=>`<label class="geo-selection-item"><input type="checkbox" data-prototype-category="${key}" ${selected.has(key)?'checked':''}><span><strong>${label}</strong> <span class="prototype-category-count">(${unique(pools.get(key))})</span></span></label>`).join('')}</div>
   <div class="prototype-notes"><strong>Om siktepunktene</strong><div>Sikt mot midten av større områder, fjellkjeder, innsjøer og elveløp. For land: midten av fastlandet, eller største øy i øystater.</div></div>
  </div></div>`;
  app().querySelectorAll('[data-prototype-category]').forEach(input=>input.addEventListener('change',()=>{
   input.checked?selected.add(input.dataset.prototypeCategory):selected.delete(input.dataset.prototypeCategory);refresh();
  }));
  app().querySelector('#prototype-all').onclick=()=>{selected=new Set(definitions.map(d=>d[0]));initGeoGuessr();};
  app().querySelector('#prototype-none').onclick=()=>{selected.clear();initGeoGuessr();};
  app().querySelector('#geo-start-button').onclick=startGeoGuessr;
  app().querySelector('#mapwiz-show-top-ten').onclick=()=>showTopTen();
  refresh();
 };
 function refresh(){document.getElementById('prototype-selection').textContent=`${selected.size} ${selected.size===1?'kategori':'kategorier'} valgt`;document.getElementById('mapwiz-show-top-ten').disabled=!selected.size;const start=document.getElementById('geo-start-button');start.disabled=!selected.size;start.textContent=selected.size?'Start 10 spørsmål →':'Velg kategorier';}
 function rounds(){
  const buckets=shuffleArray([...selected].map(key=>({key,items:shuffleArray(pools.get(key).filter(t=>selected.size===1&&key==='place:Norge'||t.lat<=GEO_MAP_TOP&&t.lat>=GEO_MAP_BOTTOM)),count:0}))),out=[],seen=new Set(),limit=selected.size>5?2:10;
  while(out.length<10&&buckets.length){
   let added=false;
   for(const bucket of shuffleArray(buckets)){
    if(out.length===10)break;if(bucket.count>=limit)continue;
    const t=bucket.items.find(t=>!seen.has(t.name)&&t.name!==out.at(-1)?.name);
    if(t){seen.add(t.name);out.push(t);bucket.count++;added=true;}
   }
   // Small categories (e.g. seven deserts) repeat only after all available
   // unique targets have been used. Consecutive questions still differ.
   if(!added){if(buckets.every(b=>b.count>=limit||!b.items.length))break;seen.clear();}
  }
  return out;
 }
 function beginRound(questions){
  if(!questions.length)return;
  stopGeoGuessrClock();geoGuessrSelection=new Set(selected);document.body.classList.remove('mapwiz-setup');
  geoGuessrState={rounds:questions,index:0,total:0,baseTotal:0,bonusTotal:0,results:[],answered:false,questionStarted:performance.now(),startedAt:Date.now(),norwayOnly:selected.size===1&&selected.has('place:Norge'),hsMode:null,hsHandled:true};
  renderGeoGuessrRound();
 }
 startGeoGuessr=function(){beginRound(rounds());};
 const renderOriginal=renderGeoGuessrRound,clickOriginal=geoMapClick;
 function placeBox(){
  const hud=document.getElementById('geo-hud');if(!hud)return;
  const r=hud.getBoundingClientRect(),margin=8;
  const desired=position||{x:16,y:innerHeight-r.height-16};
  position={x:Math.max(margin,Math.min(innerWidth-r.width-margin,desired.x)),y:Math.max(margin,Math.min(innerHeight-r.height-margin,desired.y))};
  hud.style.setProperty('--hud-x',position.x+'px');hud.style.setProperty('--hud-y',position.y+'px');
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
  const frame=stage.querySelector('[data-no-frame]')?.getBoundingClientRect(),bounds=stage.getBoundingClientRect();
  const project=(point,relative)=>frame&&relative?{x:(frame.left-bounds.left+relative.x*frame.width)/bounds.width*100,y:(frame.top-bounds.top+relative.y*frame.height)/bounds.height*100}:point;
  s.results.forEach((result,index)=>{
   const guess=project(result.guess,result.frameGuess),answer=project(result.answer,result.frameAnswer);
   const color=colors[index],group=document.createElementNS('http://www.w3.org/2000/svg','g');group.dataset.resultIndex=index;
   group.innerHTML=s.norwayOnly?`<line x1="${guess.x}" y1="${guess.y}" x2="${answer.x}" y2="${answer.y}"></line>`:geoWrappedLineSvg(guess.x,guess.y,answer.x,answer.y);
   group.querySelectorAll('line').forEach(line=>line.style.stroke=color);lines.append(group);
   for(const [kind,point] of [['guess',guess],['answer',answer]]){
    const marker=document.createElement('div');marker.className='geo-marker '+kind;marker.style.left=point.x+'%';marker.style.top=point.y+'%';marker.style.borderColor=color;
    if(kind==='answer')marker.style.background=color;
    marker.title=`${index+1}. ${result.name} · ${kind==='answer'?'Fasit':'Ditt treff'}`;markers.append(marker);
   }
  });
 }
 window.addEventListener('resize',()=>{placeBox();if(document.querySelector('.prototype-summary'))drawResults();});
 renderGeoGuessrRound=function(){
  renderOriginal();const s=geoGuessrState;if(!s||s.index>=s.rounds.length)return;
  const t=s.rounds[s.index],hud=document.getElementById('geo-hud');
  const label=hud.querySelector('.geo-target-label');
  if(t.presentation==='flag'){
   label.textContent='Hvilket land?';const image=document.createElement('img');image.className='prototype-flag';image.src=t.flag;image.alt='Flagget du skal kjenne igjen';label.after(image);
  }
  document.getElementById('geo-hint')?.remove();enableDragging(hud);requestAnimationFrame(()=>{if(hud.isConnected)placeBox();});
 };
 geoMapClick=function(event){
  const s=geoGuessrState;if(!s||s.answered)return;clickOriginal(event);if(!s.answered)return;
  const point=selector=>{const el=document.querySelector(selector);return {x:parseFloat(el.style.left),y:parseFloat(el.style.top)};};
  const result=s.results.at(-1);Object.assign(result,{guess:point('.geo-marker.guess'),answer:point('.geo-marker.answer')});
  if(s.norwayOnly){const stage=document.querySelector('.geo-map-stage').getBoundingClientRect(),frame=document.querySelector('[data-no-frame]').getBoundingClientRect();const relative=p=>({x:(stage.left+p.x*stage.width/100-frame.left)/frame.width,y:(stage.top+p.y*stage.height/100-frame.top)/frame.height});result.frameGuess=relative(result.guess);result.frameAnswer=relative(result.answer);}
  const t=s.rounds[s.index];if(t.presentation)document.querySelector('.geo-target-label').textContent=t.name;
 };
 renderGeoGuessrSummary=function(){
  stopGeoGuessrClock();const s=geoGuessrState,stage=app().querySelector('.geo-map-stage');if(!stage)return;
  if(s.results.length===10&&!s.completedAt)s.completedAt=Date.now();
  drawResults();
  const hud=document.getElementById('geo-hud');hud.className='geo-hud prototype-summary';
  hud.innerHTML=`<h3>${s.total.toFixed(1)} / ${s.rounds.length*110} poeng</h3><table class="prototype-results"><thead><tr><th>Sted</th><th title="Poeng for avstand">Avst.p.</th><th title="Poeng for tid">Tidsp.</th></tr></thead><tbody>${s.results.map((r,index)=>`<tr><td><span class="prototype-result-name" title="${escape(r.name)}"><i style="background:${colors[index]}" aria-hidden="true"></i><span class="prototype-result-label">${escape(r.name)}</span></span></td><td>${r.base.toFixed(1)}</td><td>${r.bonus.toFixed(1)}</td></tr>`).join('')}</tbody></table><div class="prototype-summary-actions"><button class="geo-next-button" id="prototype-again">Spill igjen</button><button class="geo-next-button" id="prototype-settings">Endre kategorier</button></div>`;
  position=null;enableDragging(hud);placeBox();
  const topTen=document.createElement('button');topTen.type='button';topTen.className='geo-next-button';topTen.textContent='Topp 10';topTen.onclick=()=>showTopTen();hud.querySelector('.prototype-summary-actions').append(topTen);
  document.getElementById('prototype-again').onclick=startGeoGuessr;document.getElementById('prototype-settings').onclick=initGeoGuessr;
 };
 // Never restore the original module's remembered category selection here.
 initGeoGuessr();
})();
