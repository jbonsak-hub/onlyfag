/* Shared click-map game for Statle, Norwegian counties and continent maps. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ns = 'http://www.w3.org/2000/svg';
  const kart = document.body.dataset.quiz === 'kart';
  let counties = document.body.dataset.quiz === 'fylker';
  let total = counties ? 15 : 50;
  let shapeLabel = counties ? 'Fylke på kartet' : 'Delstat på kartet';
  let regionData = null, mapGeneration = 0;
  const elements = new Map(), markers = new Map(), centers = new Map();
  let states = [], queue = [], index = 0, phase = 'ready', locked = false;
  let results = new Map(), roundMistakes = 0, mistakes = 0, skipped = 0;
  let totalTime = 0, roundTime = 0, lastTick = performance.now(), generation = 0;
  const timers = new Set();
  function svgNode(tag, attrs = {}) {
    const el = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    return el;
  }
  function later(fn, ms) {
    const run = generation;
    const timer = setTimeout(() => { timers.delete(timer); if (run === generation) fn(); }, ms);
    timers.add(timer);
  }
  function clearEffects() {
    timers.forEach(clearTimeout); timers.clear();
    $('hintLayer').replaceChildren(); $('labelLayer').replaceChildren();
    elements.forEach(el => el.classList.remove('wrong', 'correct', 'hovered'));
  }
  function target() { return queue[index]; }
  function setFeedback(text, kind = '') { $('feedback').textContent = text; $('feedback').className = kind; }
  function timeText(ms) {
    const seconds = Math.floor(ms / 1000);
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  function tick() {
    const now = performance.now(), delta = now - lastTick;
    lastTick = now;
    if (phase !== 'playing') return;
    totalTime += delta;
    if (!locked) roundTime += delta;
    $('elapsed').textContent = timeText(totalTime);
  }
  setInterval(tick, 100);
  function fit(group, rect) {
    const b = group.getBBox(), scale = Math.min(rect.w / b.width, rect.h / b.height);
    const x = rect.x + (rect.w - b.width * scale) / 2 - b.x * scale;
    const y = rect.y + (rect.h - b.height * scale) * (rect.bottom ? 1 : 0.5) - b.y * scale;
    group.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
    for (const el of group.children) {
      const state = states.find(s => s.n === el.dataset.state), box = el.getBBox();
      const c = state.a === 'AK' || state.a === 'HI' ? [box.x + box.width / 2, box.y + box.height / 2] : state.c;
      centers.set(state.n, {x:c[0] * scale + x, y:c[1] * scale + y, radius:Math.max(box.width, box.height) * scale / 2 + 10});
    }
    return {x:b.x * scale + x, y:b.y * scale + y, width:b.width * scale, height:b.height * scale};
  }
  function buildMap() {
    if (kart && !counties) {
      const view = regionData.viewBox;
      $('map').setAttribute('viewBox',view.join(' '));
      if (regionData.context) $('states').append(svgNode('path',{d:regionData.context,class:'map-context','fill-rule':'evenodd','aria-hidden':'true'}));
      if (regionData.territory) $('states').append(svgNode('path',{d:regionData.territory,class:'map-context',style:'stroke:none','fill-rule':'evenodd','aria-hidden':'true'}));
      for (const state of states) {
        const el=svgNode('path',{d:state.d,class:'state','fill-rule':'evenodd',role:'button',tabindex:'0','aria-label':shapeLabel});el.dataset.state=state.n;
        $('states').append(el);elements.set(state.n,el);
        const box=el.getBBox();centers.set(state.n,{x:state.c[0],y:state.c[1],radius:Math.max(box.width,box.height)/2+10});
        if (state.marker) {
          const g=svgNode('g',{class:'small-marker country-marker',role:'button',tabindex:'0','aria-label':'Ekstra klikkfelt for et lite land'});g.dataset.state=state.n;
          g.append(svgNode('circle',{cx:state.c[0],cy:state.c[1],r:11,class:'hit'}),svgNode('circle',{cx:state.c[0],cy:state.c[1],r:4.5,class:'visible'}));
          $('smallStates').append(g);markers.set(state.n,g);
        }
      }
      return;
    }
    if (counties) {
      const group = svgNode('g',{'fill-rule':'evenodd'}); $('states').append(group);
      for (const state of states) {
        const el = svgNode('path', {d:state.d, class:'state', role:'button', tabindex:'0', 'aria-label':shapeLabel});
        el.dataset.state = state.n; group.append(el); elements.set(state.n,el);
      }
      const bounds = fit(group, {x:28,y:18,w:844,h:514});
      $('map').setAttribute('viewBox',`${bounds.x - 32} 0 ${bounds.width + 64} 550`);
      // Oslo stays in its geographical position, with a second accessible target
      // outside the coast so the smallest county is usable on a touch screen.
      const oslo = centers.get('Oslo');
      if (oslo) {
        const x = Math.min(855,oslo.x + 95), y = Math.min(510,oslo.y + 28);
        $('smallStates').append(svgNode('path', {class:'small-connector',d:`M${oslo.x} ${oslo.y}L${x - 14} ${y}`}));
        const marker = svgNode('g', {class:'small-marker',role:'button',tabindex:'0','aria-label':'Ekstra klikkfelt for et lite fylke'});
        marker.dataset.state='Oslo';
        marker.append(svgNode('circle',{cx:x,cy:y,r:21,class:'hit'}),svgNode('circle',{cx:x,cy:y,r:11,class:'visible'}));
        $('smallStates').append(marker); markers.set('Oslo',marker);
      }
      return;
    }
    const groups = {main:svgNode('g'), AK:svgNode('g'), HI:svgNode('g')};
    $('states').append(groups.main, groups.AK, groups.HI);
    for (const state of states) {
      const el = svgNode('path', {d:state.d, class:'state', role:'button', tabindex:'0', 'aria-label':'Delstat på kartet'});
      el.dataset.state = state.n;
      groups[state.a === 'AK' || state.a === 'HI' ? state.a : 'main'].append(el);
      elements.set(state.n, el);
    }
    fit(groups.main, {x:20, y:16, w:825, h:522});
    const florida = elements.get('Florida').getBBox();
    const mainlandTransform = groups.main.transform.baseVal.consolidate().matrix;
    const southEdge = (florida.y + florida.height) * mainlandTransform.d + mainlandTransform.f;
    const alaska = fit(groups.AK, {x:25, y:southEdge - 100, w:165, h:100, bottom:true});
    const hawaii = fit(groups.HI, {x:215, y:southEdge - 41, w:110, h:41, bottom:true});
    $('insetSeparators').setAttribute('d', 'M15 ' + (alaska.y - 12) + 'H202V' + (southEdge + 8) + ' M210 ' + (hawaii.y - 12) + 'H338');
    // Extra click targets for the small northeastern states. No answer labels.
    const small = ['New Hampshire','Vermont','Massachusetts','Rhode Island','Connecticut','New Jersey','Delaware','Maryland'];
    small.forEach((name, i) => {
      const c = centers.get(name), x = 867, y = 162 + i * 35;
      $('smallStates').append(svgNode('path', {class:'small-connector', d:`M${c.x} ${c.y}L${x - 15} ${y}`}));
      const g = svgNode('g', {class:'small-marker', role:'button', tabindex:'0', 'aria-label':'Ekstra klikkfelt for en liten delstat'});
      g.dataset.state = name;
      g.append(svgNode('circle', {cx:x,cy:y,r:17,class:'hit'}), svgNode('circle', {cx:x,cy:y,r:9,class:'visible'}));
      $('smallStates').append(g); markers.set(name, g);
    });
  }
  function flashLabel(name, kind, duration = 1050) {
    const c = centers.get(name), unit = 1 / ($('map').getScreenCTM()?.a || 1), width = Math.max(70, name.length * 7 + 22) * unit;
    const view = $('map').viewBox.baseVal;
    const x = Math.max(view.x + width / 2 + 9 * unit, Math.min(view.x + view.width - 9 * unit - width / 2, c.x));
    const y = Math.max(view.y + 26 * unit, Math.min(view.y + view.height - 25 * unit, c.y - 21 * unit));
    const g = svgNode('g', {class:'flash-label ' + kind});
    g.append(svgNode('rect', {x:x - width / 2,y:y - 13 * unit,width,height:26 * unit,rx:4 * unit,'vector-effect':'non-scaling-stroke',style:`filter:drop-shadow(0 ${2 * unit}px ${3 * unit}px #26453c45)`}));
    const text = svgNode('text', {x,y:y + unit,style:`font-size:${12 * unit}px`}); text.textContent = name; g.append(text);
    $('labelLayer').replaceChildren(g);
    later(() => g.remove(), duration);
  }
  function showHint() {
    const c = centers.get(target().n), radius = Math.max(25, Math.min(120, c.radius));
    const circle = svgNode('circle', {cx:c.x, cy:c.y, r:radius, class:'hint-ring'});
    $('hintLayer').replaceChildren(circle);
    later(() => circle.remove(), 1450);
  }
  function setBand(name, band) {
    const el = elements.get(name);
    el.dataset.band = String(band); el.classList.add('found');
    el.setAttribute('aria-label', name + ' – fullført');
    if (markers.has(name)) { markers.get(name).dataset.band = String(band); markers.get(name).setAttribute('aria-label', name + ' – fullført'); }
  }
  function updateStats() {
    $('completed').textContent = results.size;
    $('progressFill').style.width = results.size / total * 100 + '%';
    $('mistakes').textContent = mistakes + ' feil';
  }
  function next() {
    index++; locked = false; roundMistakes = 0; roundTime = 0;
    $('hintLayer').replaceChildren(); $('labelLayer').replaceChildren();
    elements.forEach(el => el.classList.remove('correct', 'wrong'));
    if (!target()) return finish();
    window.GeoOnline?.statleNext();
    $('targetName').textContent = target().n;
    setFeedback('Hvor ligger ' + target().n + '?');
  }
  function choose(name) {
    if (phase === 'ready' || phase === 'finished') {flashLabel(name,'',2800);setFeedback(name);return;}
    if (phase !== 'playing' || locked || !target()) return;
    tick();
    if (results.has(name)) { flashLabel(name, ''); setFeedback(name + ' er allerede fullført.'); return; }
    window.GeoOnline?.statleAnswer(name);
    if (name !== target().n) {
      roundMistakes++; mistakes++; updateStats();
      const el = elements.get(name); el.classList.add('wrong');
      flashLabel(name, 'error');
      later(() => el.classList.remove('wrong'), 1050);
      if (roundMistakes >= 2) showHint();
      setFeedback('Det var ' + name + '. Finn ' + target().n + '.', 'error');
      return;
    }
    // Slower times and mistakes can only lower the performance category.
    const band = Math.max(roundTime <= 5000 ? 0 : roundTime <= 10000 ? 1 : 2, Math.min(roundMistakes, 3));
    results.set(name, {band, ms:roundTime, mistakes:roundMistakes});
    setBand(name, band); locked = true;
    $('hintLayer').replaceChildren();
    elements.get(name).classList.add('correct'); flashLabel(name, '');
    setFeedback('Riktig! ' + name + ' · ' + (roundTime / 1000).toFixed(1).replace('.', ',') + ' s', 'good');
    updateStats(); later(next, 650);
  }
  function start() { if(window.GeoOnline)return GeoOnline.startStatle(begin);return begin(); }
  function begin(names) {
    generation++; clearEffects();if($('statle-score'))$('statle-score').hidden=true;
    results = new Map(); index = 0; totalTime = 0; roundTime = 0; lastTick = performance.now();
    roundMistakes = 0; mistakes = 0; skipped = 0; locked = false;
    elements.forEach(el => { delete el.dataset.band; el.classList.remove('found'); el.setAttribute('aria-label', shapeLabel); });
    markers.forEach(el => { delete el.dataset.band; el.setAttribute('aria-label', counties ? 'Ekstra klikkfelt for et lite fylke' : kart ? 'Ekstra klikkfelt for et lite land' : 'Ekstra klikkfelt for en liten delstat'); });
    queue = names ? names.map(name=>states.find(s=>s.n===name)) : states.filter(s => !results.has(s.n));
    if(!names)for (let i = queue.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [queue[i],queue[j]] = [queue[j],queue[i]]; }
    phase = 'playing'; $('overlay').hidden = true;
    $('mapViewport').scrollTo({left:0,top:0});
    $('targetVerb').textContent = 'Klikk på';
    $('targetName').textContent = target().n; $('elapsed').textContent = '00:00';
    $('restart').disabled = false; $('skip').disabled = false;
    updateStats(); setFeedback('Finn ' + target().n + '.');
  }
  function skip() {
    if (phase !== 'playing' || locked) return;
    const name = target().n;
    window.GeoOnline?.statleAnswer(name,true);
    results.set(name,{band:3,ms:roundTime,mistakes:roundMistakes,skipped:true});
    skipped++; setBand(name,3); flashLabel(name,'error'); locked = true;
    $('hintLayer').replaceChildren(); setFeedback('Her ligger ' + name + '. Vi går videre.');
    updateStats(); later(next,1100);
  }
  function finish() {
    phase = 'finished'; locked = true;
    window.GeoOnline?.finishStatle();
    $('targetVerb').textContent = 'Godt jobbet!';
    $('targetName').textContent = counties ? 'Alle fylkene er på plass.' : kart ? 'Alle landene er på plass.' : 'Hele USA er på plass.';
    $('skip').disabled = true;
    const counts = [0,0,0,0]; results.forEach(r => counts[r.band]++);
    setFeedback('Alle ' + total + ' fullført' + ' · ' + timeText(totalTime) + ' · ' + mistakes + ' feil · ' + skipped + ' hoppet over. Grønn: ' + counts[0] + ', gul: ' + counts[1] + ', oransje: ' + counts[2] + ', rød: ' + counts[3] + '.');
  }
  $('map').addEventListener('click', e => { const el = e.target.closest('[data-state]'); if (el) choose(el.dataset.state); });
  $('map').addEventListener('keydown', e => { const el = e.target.closest('[data-state]'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); choose(el.dataset.state); } });
  function highlight(e, on) {
    const el = e.target.closest('[data-state]'); if (el) elements.get(el.dataset.state).classList.toggle('hovered',on);
  }
  $('map').addEventListener('pointerover',e => highlight(e,true));
  $('map').addEventListener('pointerout',e => highlight(e,false));
  $('map').addEventListener('focusin',e => highlight(e,true));
  $('map').addEventListener('focusout',e => highlight(e,false));
  $('start').addEventListener('click', start);
  $('restart').addEventListener('click', start);
  $('skip').addEventListener('click', skip);
  const menu = $('geoMenu'), menuButton = $('geoMenuButton');
  let menuOpener=menuButton;
  function openMenu(button){menuOpener=button;menu.showModal();button.setAttribute('aria-expanded','true');}
  menuButton.addEventListener('click', () => openMenu(menuButton));
  $('kart-menu-button')?.addEventListener('click',event=>openMenu(event.currentTarget));
  $('geoMenuClose').addEventListener('click', () => menu.close());
  menu.addEventListener('close', () => { menuButton.setAttribute('aria-expanded', 'false');$('kart-menu-button')?.setAttribute('aria-expanded','false');menuOpener.focus(); });
  menu.addEventListener('click', event => {
    const box = menu.getBoundingClientRect();
    if (event.target === menu && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) menu.close();
  });
  function resetMap() {
    generation++;clearEffects();elements.clear();markers.clear();centers.clear();
    $('states').replaceChildren();$('smallStates').replaceChildren();$('insetSeparators').setAttribute('d','');
    $('map').setAttribute('viewBox','0 0 900 550');
    results=new Map();index=0;mistakes=0;totalTime=0;phase='ready';locked=false;
    $('completed').textContent='0';$('elapsed').textContent='00:00';$('mistakes').textContent='0 feil';$('progressFill').style.width='0%';
    $('overlay').hidden=false;$('start').disabled=true;$('skip').disabled=true;$('restart').disabled=true;$('statle-score').hidden=true;
  }
  const readMap=url=>fetch(url).then(response=>{if(!response.ok)throw Error('Kartet kunne ikke hentes');return response.json();});
  let continents,countyMap;
  async function selectMap(region) {
    const titles={fylker:'Norske fylker',europe:'Europa',asia:'Asia',northAmerica:'Nord- og Mellom-Amerika',southAmerica:'Sør-Amerika',africa:'Afrika',oceania:'Oseania'};
    if(!Object.hasOwn(titles,region))return;
    const token=++mapGeneration;window.GeoOnline?.resetStatle();resetMap();document.body.dataset.region=region;counties=region==='fylker';shapeLabel=counties?'Fylke på kartet':'Land på kartet';
    $('kart-selection').hidden=true;$('kart-game').hidden=false;$('targetName').textContent=titles[region];$('targetVerb').textContent='Klar for en runde?';$('start').textContent='Laster kart …';setFeedback('Laster kart …');
    const url=new URL(location.href);url.searchParams.set('region',region);history.replaceState(null,'',url);
    try {
      if(counties){countyMap||=readMap('../assets/geography/norway-counties.json').catch(error=>{countyMap=null;throw error;});const data=await countyMap;if(token!==mapGeneration)return;states=data;regionData=null;}
      else {continents||=readMap('../assets/geography/continent-maps.json').catch(error=>{continents=null;throw error;});const data=await continents;if(token!==mapGeneration)return;regionData=data.regions[region];states=regionData.states;}
      if(token!==mapGeneration)return;total=states.length;
      if(!total||new Set(states.map(s=>s.n)).size!==total)throw Error('Ufullstendig kart');
      $('total-count').textContent=' / '+total;$('map').setAttribute('aria-label',counties?'Klikkbart kart over Norges 15 fylker':'Klikkbart kart over '+titles[region]);
      document.querySelector('.map-credit').hidden=counties;document.querySelector('.county-credit').hidden=!counties;
      buildMap();window.ClickMapZoom?.setBase();window.dispatchEvent(new Event('resize'));$('start').disabled=false;$('start').textContent='Start →';setFeedback(counties?'Klikk på fylket som står over.':'Klikk på landet som står over.');
    }catch(_){if(token!==mapGeneration)return;$('start').textContent='Kartet kunne ikke lastes';setFeedback('Velg kart på nytt for å prøve igjen.','error');}
  }
  if(kart){
    document.querySelectorAll('[data-map-region]').forEach(button=>button.addEventListener('click',()=>selectMap(button.dataset.mapRegion)));
    $('kart-change-map').addEventListener('click',()=>{++mapGeneration;window.GeoOnline?.resetStatle();resetMap();$('kart-game').hidden=true;$('kart-selection').hidden=false;delete document.body.dataset.region;const url=new URL(location.href);url.searchParams.delete('region');history.replaceState(null,'',url);document.querySelector('#kart-selection h1')?.focus();});
    const selected=new URLSearchParams(location.search).get('region');if(selected)selectMap(selected);
    return;
  }
  const embedded = document.getElementById('statle-map-data');
  const mapData = embedded ? Promise.resolve(JSON.parse(embedded.textContent)) : fetch(counties ? '../assets/geography/norway-counties.json' : '../assets/geography/us-states.json').then(response => {
    if (!response.ok) throw new Error('Kartet kunne ikke hentes'); return response.json();
  });
  mapData.then(data => {
    states = data;
    if (states.length !== total || new Set(states.map(s=>s.n)).size !== total) throw new Error('Ufullstendig kart');
    buildMap(); window.ClickMapZoom?.setBase(); $('start').disabled = false; $('start').textContent = counties ? 'Start Norske fylker →' : 'Start Statle →';
  }).catch(() => { $('start').textContent = 'Kartet kunne ikke lastes'; setFeedback('Last siden på nytt for å hente kartet.','error'); });
})();
