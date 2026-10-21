/* Isolated experiment. Loaded only by prototypes/mapwiz.html. */
(() => {
 const reference=window.MAPWIZ_PROTOTYPE_DATA;
 const escape=escapeGeoHtml;
 const definitions=[
  ['flags','Flagg',null,'Finn midten av landets fastland.'],
  ['capitals','Hovedstad',null,'Finn byen på kartet.'],
  ['cities','By',null,'91 utvalgte byer utenom hovedstadsoppgavene.'],
  ['mountains','Fjell','Fjell og vulkaner','Finn fjelltoppen.'],
  ['ranges','Fjellkjede','Fjellkjeder','Sikt mot midten av fjellkjeden.'],
  ['rivers','Elv','Elver','Sikt mot midten av elveløpet.'],
  ['deserts','Ørkener','Ørkener','Sikt mot midten av området.'],
  ['lakes','Innsjøer','Innsjøer','Sikt mot midten av innsjøen.'],
  ['islands','Øyer, øygrupper og halvøyer','Øyer, øygrupper og halvøyer','Sikt mot midten.'],
  ['regions','Regioner og områder','Regioner og områder','Sikt mot midten av området.'],
  ['seas','Hav og sjøområder','Hav og sjøområder','Sikt mot midten av havområdet.'],
  ['straits','Stred, kanaler, bukter og kapp','Stred, kanaler, bukter og kapp','Finn stedet på kartet.'],
  ['landmarks','Kjente byggverk og historiske steder','Kjente byggverk og historiske steder','Finn stedet på kartet.'],
  ['nature','Kjente naturfenomener','Kjente natursteder','Stedsbundne naturfenomener og natursteder.'],
  ['place:Norge','Norge','Norge','Eget Norgeskart når kategorien velges alene.'],
  ['clues','Land – tre opplysninger',null,'Tre GeoGrid-kjennetegn med ett mulig land.']
 ];
 const midpoints=new Map(window.MAPWIZ_RIVER_MIDPOINTS.map(t=>[t.name,t]));
 const pools=new Map(definitions.map(([key,label,category,instruction])=>{
  let items;
  if(key==='flags')items=reference.countries.filter(c=>c.flag).map(c=>({...c,kind:'Land',presentation:'flag'}));
  else if(key==='clues')items=reference.clues.map(c=>({...c,kind:'Land',presentation:'clues'}));
  else if(key==='capitals')items=geoPlayableCapitals();
  else if(key==='cities')items=reference.cities.map(c=>({...c,kind:'By',explanation:GEO_QUIZ_DATA.countries.find(n=>n.flagCode===c.countryCode.toLowerCase())?.country||c.country}));
  else if(key==='rivers')items=[...midpoints.values()].map(t=>({...t,kind:'Elv',explanation:'Siktepunkt omtrent midt i det kartlagte hovedløpet.'}));
  else items=geoPlayablePlaces().filter(t=>t.category===category);
  return [key,items.map(t=>({...t,quizCategory:key,categoryLabel:label,instruction,category:category||label}))];
 }));
 let selected=new Set(),side='west';
 const app=()=>document.getElementById('geo-guessr-app');
 const unique=items=>new Set(items.map(t=>t.name)).size;
 const capacity=()=>Math.min(10,[...selected].reduce((n,key)=>n+Math.min(2,unique(pools.get(key)||[])),0));
 window.MapWizPrototype={definitions,pools,reference};
 initGeoGuessr=function(){
  stopGeoGuessrClock();geoGuessrState=null;
  app().innerHTML=`<div class="geo-guessr-setup-wrap"><div class="geo-guessr-setup mapwiz-prototype-setup">
   <div class="prototype-heading"><h3>MapWiz</h3><span class="prototype-tag">Testmodul</span></div>
   <div class="prototype-intro">Velg hva du vil finne. Maks to spørsmål fra hver kategori, opptil ti i en runde.</div>
   <div class="geo-selection-tools"><button id="prototype-all" type="button">Velg alle</button><button id="prototype-none" type="button">Fjern alle</button><span id="prototype-selection" aria-live="polite"></span></div>
   <div class="geo-selection-grid">${definitions.map(([key,label,,instruction])=>`<label class="geo-selection-item"><input type="checkbox" data-prototype-category="${key}" ${selected.has(key)?'checked':''}><span><strong>${label}</strong><small>${unique(pools.get(key))} mål · ${instruction}</small></span></label>`).join('')}</div>
   <div class="geo-setup-actions"><button class="geo-start-button" id="geo-start-button" disabled>Velg kategorier</button><a class="prototype-original" href="../geografi/mapwiz.html">Dagens MapWiz ↗</a></div>
   <details class="prototype-notes"><summary>Om siktepunktene</summary><p>For land brukes et indre midtpunkt på den største sammenhengende landdelen, uten oversjøiske øyer. For øystater brukes den største øya. Store områder har ett representativt midtpunkt; elvemål bygger på kartlagte hovedløp. Fasitmarkøren viser siktepunktet etter svaret.</p><p>Infoboksen kan flyttes til motsatt hjørne med ↔. Ingen steder er fjernet fra dagens MapWiz. Testmodulen skriver ikke til toppresultatene.</p></details>
  </div></div>`;
  app().querySelectorAll('[data-prototype-category]').forEach(input=>input.addEventListener('change',()=>{
   input.checked?selected.add(input.dataset.prototypeCategory):selected.delete(input.dataset.prototypeCategory);refresh();
  }));
  app().querySelector('#prototype-all').onclick=()=>{selected=new Set(definitions.map(d=>d[0]));initGeoGuessr();};
  app().querySelector('#prototype-none').onclick=()=>{selected.clear();initGeoGuessr();};
  app().querySelector('#geo-start-button').onclick=startGeoGuessr;
  refresh();
 };
 function refresh(){const count=capacity();document.getElementById('prototype-selection').textContent=`${selected.size} kategorier · ${count} spørsmål`;const start=document.getElementById('geo-start-button');start.disabled=!count;start.textContent=count?`Start ${count} spørsmål →`:'Velg kategorier';}
 function rounds(){
  const buckets=shuffleArray([...selected].map(key=>({key,items:shuffleArray(pools.get(key).filter(t=>selected.size===1&&key==='place:Norge'||t.lat<=GEO_MAP_TOP&&t.lat>=GEO_MAP_BOTTOM)),count:0}))),out=[],seen=new Set();
  for(let pass=0;pass<2;pass++)for(const bucket of shuffleArray(buckets)){
   if(out.length===10)break;
   while(bucket.items.length){const t=bucket.items.pop();if(seen.has(t.name))continue;seen.add(t.name);out.push(t);bucket.count++;break;}
  }
  return shuffleArray(out);
 }
 startGeoGuessr=function(){
  const questions=rounds();if(!questions.length)return;
  stopGeoGuessrClock();geoGuessrSelection=new Set(selected);
  geoGuessrState={rounds:questions,index:0,total:0,baseTotal:0,bonusTotal:0,results:[],answered:false,questionStarted:performance.now(),norwayOnly:selected.size===1&&selected.has('place:Norge'),hsMode:null,hsHandled:true};
  renderGeoGuessrRound();
 };
 const renderOriginal=renderGeoGuessrRound,clickOriginal=geoMapClick;
 function placeBox(){const hud=document.getElementById('geo-hud');if(hud)hud.dataset.corner=side;}
 renderGeoGuessrRound=function(){
  renderOriginal();const s=geoGuessrState;if(!s||s.index>=s.rounds.length)return;
  const t=s.rounds[s.index],hud=document.getElementById('geo-hud');placeBox();
  const heading=document.createElement('div');heading.className='prototype-question-type';heading.textContent=t.categoryLabel;hud.querySelector('.geo-target-label').before(heading);
  const label=hud.querySelector('.geo-target-label');
  if(t.presentation==='flag'){
   label.textContent='Hvilket land?';const image=document.createElement('img');image.className='prototype-flag';image.src=t.flag;image.alt='Flagget du skal kjenne igjen';label.after(image);
  }else if(t.presentation==='clues'){
   label.textContent='Hvilket land?';const list=document.createElement('ol');list.className='prototype-clues';for(const clue of t.clues){const item=document.createElement('li');item.textContent=clue;list.append(item);}label.after(list);
  }
  document.getElementById('geo-hint').textContent=t.instruction;
  const move=document.createElement('button');move.className='prototype-move';move.textContent='↔';move.title='Flytt oppgaveboksen til motsatt hjørne';move.setAttribute('aria-label',move.title);move.onclick=()=>{side=side==='west'?'east':'west';placeBox();};hud.prepend(move);
 };
 geoMapClick=function(event){
  const s=geoGuessrState;if(!s||s.answered)return;clickOriginal(event);if(!s.answered)return;
  const t=s.rounds[s.index];if(t.presentation)document.querySelector('.geo-target-label').textContent=t.name;
  // Reveal an answer hidden beneath the box without excluding any Pacific targets.
  const marker=document.querySelector('.geo-marker.answer'),hud=document.getElementById('geo-hud');
  if(marker&&hud){const m=marker.getBoundingClientRect(),h=hud.getBoundingClientRect();if(m.right>h.left&&m.left<h.right&&m.bottom>h.top&&m.top<h.bottom){side=side==='west'?'east':'west';placeBox();}}
 };
 renderGeoGuessrSummary=function(){
  stopGeoGuessrClock();const s=geoGuessrState;
  app().innerHTML=`<div class="geo-guessr-setup-wrap"><section class="geo-guessr-setup prototype-summary"><span class="prototype-tag">Testmodul</span><h3>${s.total.toFixed(1)} / ${s.rounds.length*110} poeng</h3><div class="prototype-results">${s.results.map(r=>`<div><strong>${escape(r.name)}</strong><span>${Math.round(r.km).toLocaleString('nb-NO')} km</span><b>${r.points.toFixed(1)} p</b></div>`).join('')}</div><div class="geo-setup-actions"><button class="geo-start-button" id="prototype-again">Ny runde</button><button id="prototype-settings">Endre kategorier</button></div></section></div>`;
  document.getElementById('prototype-again').onclick=startGeoGuessr;document.getElementById('prototype-settings').onclick=initGeoGuessr;
 };
 // Never restore the original module's remembered category selection here.
 initGeoGuessr();
})();
