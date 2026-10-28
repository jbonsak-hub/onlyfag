
(function(){
  const STORE='geoHighscoresV1';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function load(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch(e){return{}}}
  function save(x){try{localStorage.setItem(STORE,JSON.stringify(x))}catch(e){}}
  function cmp(a,b){const ar=a.rank||[],br=b.rank||[],n=Math.max(ar.length,br.length);for(let i=0;i<n;i++){const d=(Number(ar[i])||0)-(Number(br[i])||0);if(d)return d>0?-1:1}return (a.created||0)-(b.created||0)}
  function list(key){const db=load();return (db[key]||[]).slice().sort(cmp).slice(0,10)}
  function qualifies(result){if(!(Number(result.rank?.[0])>0))return false;const rows=list(result.key);if(rows.length<10)return true;return cmp(result,rows[rows.length-1])<0}
  function fmtTime(s){if(s==null||!Number.isFinite(Number(s)))return '–';s=Math.max(0,Math.round(Number(s)));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
  function add(result){
    if(!result||!result.key||!Array.isArray(result.rank)||!qualifies(result))return {saved:false,qualifies:false};
    let name=window.prompt('Du er inne på topp 10! Skriv inn navnet ditt:','');
    if(name==null)return {saved:false,qualifies:true};name=String(name).trim().slice(0,24);if(!name)return {saved:false,qualifies:true};
    const db=load(),entry={...result,name,created:Date.now()};const arr=(db[result.key]||[]).concat(entry).sort(cmp).slice(0,10);db[result.key]=arr;save(db);return {saved:true,qualifies:true};
  }
  function specialTopTitle(key){if(key==='geoguessr2|geografifaget1')return 'Topp 10 (Geografifaget1)';if(key==='geoguessr2|all')return 'Topp 10 (alle kategorier)';if(key==='places|streak')return 'Topp 10 (på rad)';if(key==='countries2|world'||key==='capitals|world'||key==='flags|world'||key==='flagcapital|world'||key==='detective|world')return 'Topp 10 (hele verden)';return 'Topp 10'}
  window.geoHsShow=function(key,label){
    if(window.GeoOnline?.showLegacy(key,label))return;
    const rows=list(key),modal=document.getElementById('geo-hs-modal'),body=document.getElementById('geo-hs-body'),title=document.getElementById('geo-hs-title');if(!modal||!body)return;
    const special=key==='geoguessr2|all'||key==='geoguessr2|geografifaget1'||key==='places|streak';
    title.textContent='🏆 '+specialTopTitle(key)+(label&&!special?' · '+label:'');
    if(!rows.length)body.innerHTML='<div class="hs-empty">Ingen resultater ennå.</div>';
    else body.innerHTML='<table class="hs-table"><thead><tr><th>#</th><th>Navn</th><th>Resultat</th><th>Tid</th><th>Detaljer</th></tr></thead><tbody>'+rows.map((r,i)=>'<tr><td>'+(i+1)+'</td><td><strong>'+esc(r.name)+'</strong></td><td>'+esc(r.scoreText||'–')+'</td><td>'+fmtTime(r.timeSec)+'</td><td>'+esc([r.meta,(r.hints!=null&&Number(r.hints)>0?('Hint: '+r.hints):'')].filter(Boolean).join(' · '))+'</td></tr>').join('')+'</tbody></table>';
    modal.hidden=false;
  };
  window.geoHsClose=function(){const m=document.getElementById('geo-hs-modal');if(m)m.hidden=true};
  window.geoHsGetTop=function(key){return list(key).slice(0,3).map(r=>({name:r.name,scoreText:r.scoreText,timeSec:r.timeSec,hints:r.hints,meta:r.meta,label:r.label}))};
  window.addEventListener('keydown',e=>{if(e.key==='Escape')geoHsClose()});
  function miniHtml(key,label){const rows=list(key).slice(0,3),head=specialTopTitle(key);return '<div class="hs-mini"><div class="hs-mini-head"><strong>🏆 '+head+'</strong><button type="button" onclick="geoHsShow(\''+esc(key).replace(/&#39;/g,"\'")+'\',\''+esc(label||'').replace(/&#39;/g,"\'")+'\')">Vis alle</button></div>'+(rows.length?rows.map((r,i)=>'<div class="hs-mini-row"><span>'+(i+1)+'.</span><b>'+esc(r.name)+'</b><span>'+esc(r.scoreText||'')+(r.timeSec!=null?' · '+fmtTime(r.timeSec):'')+(r.hints!=null&&Number(r.hints)>0?' · '+r.hints+' hint':'')+'</span></div>').join(''):'<div class="hs-empty" style="padding:8px 0">Ingen resultater ennå.</div>')+'</div>'}
  function appendMini(target,key,label){if(!target||document.querySelector('.quiz-in-game-top-ten,#statle-top-ten'))return;const old=target.querySelector('.hs-mini');if(old)old.remove();target.insertAdjacentHTML('beforeend',miniHtml(key,label))}
  function submitAndMini(result,target){if(!result||!result.key)return;if(window.GeoOnline?.finishLocal(result,target))return;add(result);setTimeout(()=>appendMini(target,result.key,result.label),0)}

  function submodeLabel(v){return ({'country-capital-mc':'Land → hovedstad','capital-country-mc':'Hovedstad → land','flag-country-mc':'Flagg → land','country-flag-mc':'Land → flagg','flag-capital-mc':'Flagg → hovedstad','capital-flag-mc':'Hovedstad → flagg','shape-country-mc':'Kartutsnitt → land','country-shape-mc':'Land → kartutsnitt','desc-place-mc':'Beskrivelse → sted','place-desc-mc':'Sted → beskrivelse'})[v]||v||''}
  function shortDirection(v){return ({'country-capital-mc':'land→hovedstad','capital-country-mc':'hovedstad→land','flag-country-mc':'flagg→land','country-flag-mc':'land→flagg','flag-capital-mc':'flagg→hovedstad','capital-flag-mc':'hovedstad→flagg'})[v]||''}
  function regionLabel(id){return (window.COUNTRY_MAP_META&&COUNTRY_MAP_META[id]?COUNTRY_MAP_META[id].label:id)||'Hele verden'}
  function modeLabel(mode){return (window.WORLD_MODE_TITLES&&WORLD_MODE_TITLES[mode])||mode}
  function hsWorldKey(mode,region,submode,pace){
    if(mode==='countries')return 'countries2|'+(region||'world');
    if(mode==='places')return pace==='sudden'?'places|streak':null;
    if(mode==='capitals'||mode==='flags'||mode==='flagcapital')return region==='world'?mode+'|world':null;
    if(mode==='detective')return region==='world'?'detective|world':null;
    return null;
  }
  function hsWorldLabel(mode,region,submode,pace){
    if(mode==='countries')return region==='world'?modeLabel(mode):modeLabel(mode)+' · '+regionLabel(region);
    if(mode==='places')return 'Topp 10 (på rad)';
    if(mode==='capitals'||mode==='flags'||mode==='flagcapital')return modeLabel(mode);
    if(mode==='detective')return modeLabel(mode);
    return modeLabel(mode);
  }
  window.geoHsShowCurrentWorld=function(mode,btn){const setup=btn&&btn.closest('.world-setup'),region=setup?.querySelector('.world-region')?.value||'world',sub=setup?.querySelector('.world-submode')?.value||'',pace=setup?.querySelector('.world-pace')?.value||'sudden',key=hsWorldKey(mode,region,sub,pace);if(key)geoHsShow(key,hsWorldLabel(mode,region,sub,pace))};

  // Region counts remain on capitals/flags/flag+capital/detective. Highscore only appears for world where requested.
  window.worldRegionButtonsHtml=function(mode){
    const order=['world','africa','asia','europe','northamerica','oceania','southamerica'];
    let data=[];try{data=getWorldData().countries||[]}catch(e){}
    return order.map((id,i)=>{let pool=worldCountriesForRegion(data,id);if(mode==='flags'||mode==='flagcapital')pool=pool.filter(c=>c.flagCode);return '<button type="button" class="streak-region-btn'+(i===0?' selected':'')+'" onclick="selectStreakChoice(this,\'world-region\',\''+id+'\')">'+COUNTRY_MAP_META[id].label+'<small>'+pool.length+' land</small></button>'}).join('');
  };
  function updateHsVisibility(setup){if(!setup)return;const worldBtn=setup.querySelector('[data-hs-world-only="1"]');if(worldBtn){const region=setup.querySelector('.world-region')?.value||'world';worldBtn.hidden=region!=='world'}const streakBtn=setup.querySelector('[data-hs-streak-only="1"]');if(streakBtn){const pace=setup.querySelector('.world-pace')?.value||'sudden';streakBtn.hidden=pace!=='sudden'}}
  const oldSelect=window.selectStreakChoice;
  window.selectStreakChoice=function(btn,inputClass,value){oldSelect.apply(this,arguments);updateHsVisibility(btn&&btn.closest('.world-setup'))};
  const nativeStreakSetup=window.renderStreakSetup;
  window.renderStreakSetup=function(mode){
    if(['flags','capitals','flagcapital'].includes(mode))return nativeStreakSetup(mode);
    const title=WORLD_MODE_TITLES[mode]||'Test deg selv';let first='',second='',firstVal='',secondVal='';
    if(mode==='capitals'){first='Land → hovedstad';second='Hovedstad → land';firstVal='country-capital-mc';secondVal='capital-country-mc'}
    else if(mode==='flags'){first='Flagg → land';second='Land → flagg';firstVal='flag-country-mc';secondVal='country-flag-mc'}
    else if(mode==='detective'){first='Kartutsnitt → land';second='Land → kartutsnitt';firstVal='shape-country-mc';secondVal='country-shape-mc'}
    else{first='Flagg → hovedstad';second='Hovedstad → flagg';firstVal='flag-capital-mc';secondVal='capital-flag-mc'}
    return '<div class="world-setup streak-setup" data-hs-mode="'+mode+'"><h3>'+title+'</h3><p>Velg region og retning. Spillet fortsetter til første feil.</p><div class="hs-setup-row"><button type="button" class="hs-button" data-hs-world-only="1" onclick="geoHsShowCurrentWorld(\''+mode+'\',this)">🏆 Topp 10 (hele verden)</button></div><input type="hidden" class="world-region" value="world"><input type="hidden" class="world-submode" value="'+firstVal+'"><div class="streak-choice-section"><span class="streak-choice-label">Region</span><div class="streak-region-grid">'+worldRegionButtonsHtml(mode)+'</div></div><div class="streak-choice-section"><span class="streak-choice-label">Spørsmålstype</span><div class="streak-direction-grid"><button type="button" class="streak-direction-btn selected" onclick="selectStreakChoice(this,\'world-submode\',\''+firstVal+'\')">'+first+'</button><button type="button" class="streak-direction-btn" onclick="selectStreakChoice(this,\'world-submode\',\''+secondVal+'\')">'+second+'</button></div></div><div class="streak-start-row"><button class="world-button streak-start-btn" onclick="startWorldTrainer(\''+mode+'\')">Start</button></div></div>';
  };

  // One independent list per region in "Kan du verdens land?".
  window.renderCountryRegionSetup=function(){
    const order=['world','asia','europe','northamerica','southamerica','oceania','africa'];
    const cards=order.map(id=>`<button type="button" class="streak-region-btn country-region-btn" data-region="${id}" onclick="startCountryMapQuiz('${id}')"><img class="quiz-region-icon" src="/assets/geography/quiz-regions/${id}.svg" alt=""><span class="quiz-region-copy"><strong>${COUNTRY_MAP_META[id].label}</strong><small>${countryMapNames(id).length} land</small></span></button>`).join('');
    return `<div class="world-setup country-region-setup visual-quiz-setup country-visual-setup"><div class="quiz-setup-heading"><h3>Land</h3></div><section class="quiz-region-section"><span class="streak-choice-label">Region</span><div class="streak-region-grid quiz-region-grid">${cards}</div></section></div>`;
  };

  const oldEndWorld=window.endWorldTrainer;
  window.endWorldTrainer=function(message,completedAll){
    const s=worldTrainerState;if(!s||s.ended)return oldEndWorld.apply(this,arguments);
    oldEndWorld.apply(this,arguments);if(!s.ended||s.hsHandled)return;s.hsHandled=true;
    const key=hsWorldKey(s.mode,s.regionId,s.submode,s.pace);if(!key)return;
    const t=Math.max(0,Math.floor(((s.endedAt||Date.now())-s.startedAt)/1000)),h=s.mode==='detective'?(s.hintsUsed||0):0;
    const combinedDirection=s.mode==='capitals'||s.mode==='flags'||s.mode==='flagcapital',dir=combinedDirection?shortDirection(s.submode):'';
    const meta=(s.mode==='detective'||s.mode==='places')?submodeLabel(s.submode):'';
    const result={key,label:hsWorldLabel(s.mode,s.regionId,s.submode,s.pace),rank:[s.score,-h,-t],scoreText:s.score+' på rad'+(dir?' ('+dir+')':''),timeSec:t,hints:h,meta};
    const ends=getWorldApp(s.mode)?.querySelectorAll('.world-end'),target=ends&&ends.length?ends[ends.length-1]:null;submitAndMini(result,target);
  };

  const oldFinishCountry=window.finishCountryMapQuiz;
  window.finishCountryMapQuiz=function(manual){
    const s=worldTrainerState;if(!s||s.ended)return oldFinishCountry.apply(this,arguments);
    oldFinishCountry.apply(this,arguments);if(!s.ended||s.hsHandled)return;s.hsHandled=true;
    const t=Math.max(0,Math.floor(((s.endedAt||Date.now())-s.startedAt)/1000)),h=s.hints||0,key='countries2|'+(s.regionId||'world'),label=modeLabel('countries')+' · '+regionLabel(s.regionId||'world');
    const stats=getWorldApp('countries')?.querySelector('.country-map-result-stats');if(stats&&!stats.querySelector('[data-hints]'))stats.insertAdjacentHTML('beforeend','<span data-hints>Hint: '+h+'</span>');
    const box=getWorldApp('countries')?.querySelector('#country-map-complete');submitAndMini({key,label,rank:[s.finalScore||0,-h,-t],scoreText:(s.finalScore||0)+' poeng',timeSec:t,hints:h,meta:(s.found?.length||0)+' av '+(s.regionNames?.length||0)+' land'},box);
  };

  // Independent local scores for the complete selection and Geografifaget1.
  function geoAllSelected(){try{ensureGeoGuessrSelection();const opts=geoSelectionOptions();return opts.length>0&&geoGuessrSelection instanceof Set&&geoGuessrSelection.size===opts.length&&opts.every(o=>geoGuessrSelection.has(o.key))}catch(e){return false}}
  window.geoWizHsModeFromSelection=function(){
    ensureGeoGuessrSelection();
    if(geoAllSelected())return 'all';
    if(geoGuessrSelection.size===1&&geoGuessrSelection.has('place:Geografifaget1'))return 'geografifaget1';
    return null;
  };
  const oldInitGeo=window.initGeoGuessr;
  window.initGeoGuessr=function(){
    oldInitGeo.apply(this,arguments);
    const actions=document.querySelector('#geo-guessr-app .geo-setup-actions');
    if(actions&&!actions.querySelector('.geo-hs-actions'))actions.insertAdjacentHTML('beforeend',
      '<div class="geo-hs-actions">'+
      '<button type="button" class="hs-button" onclick="geoHsShow(\'geoguessr2|all\',\'Topp 10 (alle kategorier)\')">🏆 Topp 10 · Alle kategorier</button>'+
      '<button type="button" class="hs-button" onclick="geoHsShow(\'geoguessr2|geografifaget1\',\'Topp 10 (Geografifaget1)\')">🏆 Topp 10 · Geografifaget1</button>'+
      '</div>');
  };
  const oldSummaryGeo=window.renderGeoGuessrSummary;
  window.renderGeoGuessrSummary=function(){
    const s=geoGuessrState;
    if(s&&!s.hsEndedAt)s.hsEndedAt=Date.now();
    oldSummaryGeo.apply(this,arguments);
    if(!s||s.hsHandled||!s.hsMode)return;
    s.hsHandled=true;
    const t=Math.max(0,Math.floor(((s.hsEndedAt||Date.now())-(s.hsStartedAt||Date.now()))/1000));
    const key=s.hsMode==='all'?'geoguessr2|all':'geoguessr2|geografifaget1';
    const label=s.hsMode==='all'?'Topp 10 (alle kategorier)':'Topp 10 (Geografifaget1)';
    const placeNames=(Array.isArray(s.results)?s.results:[]).map(r=>r&&r.name).filter(Boolean).join(' · ');
    add({key,label,rank:[Number(s.total)||0,-t],scoreText:(Number(s.total)||0).toFixed(1)+' poeng',timeSec:t,hints:0,meta:placeNames||s.rounds.length+' steder'});
  };
})();
