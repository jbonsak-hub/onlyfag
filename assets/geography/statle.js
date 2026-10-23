/* Shared click-map game for Statle, Norwegian counties and continent maps. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ns = 'http://www.w3.org/2000/svg';
  const kart = document.body.dataset.quiz === 'kart';
  const municipalities = document.body.dataset.quiz === 'kommuner';
  const themeButtons = [];
  function applyTheme(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode', dark);
    themeButtons.forEach(button => button.setAttribute('aria-pressed', String(dark)));
  }
  for (const menu of [$('geoMenuButton'), $('kart-menu-button')].filter(Boolean)) {
    const toolbar = document.createElement('div'); toolbar.className = 'map-toolbar';
    const button = document.createElement('button'); button.type = 'button';
    button.className = 'map-theme-toggle'; button.textContent = '◐';
    button.setAttribute('aria-label', 'Bytt mellom lys og mørk modus');
    button.addEventListener('click', () => {
      const dark = document.documentElement.dataset.theme !== 'dark';
      applyTheme(dark);
      try { localStorage.setItem('geoDarkMode', dark ? '1' : '0'); } catch (_) {}
    });
    menu.before(toolbar); toolbar.append(menu, button); themeButtons.push(button);
  }
  try { applyTheme(localStorage.getItem('geoDarkMode') === '1'); } catch (_) { applyTheme(false); }
  addEventListener('storage', event => { if(event.key === 'geoDarkMode' || event.key === null) {
    try { applyTheme(localStorage.getItem('geoDarkMode') === '1'); } catch (_) {}
  }});
  let counties = document.body.dataset.quiz === 'fylker';
  let total = counties ? 15 : 50;
  let shapeLabel = counties ? 'Fylke på kartet' : 'Delstat på kartet';
  let regionData = null, mapGeneration = 0, physical = false;
  let practice = false, continentPractice = false, retrying = false;
  const mastered = new Set();
  const continentOrder=['northAmerica','southAmerica','europe','asia','africa','oceania'];
  const continentNames={northAmerica:'Nord-Amerika',southAmerica:'Sør-Amerika',europe:'Europa',asia:'Asia',africa:'Afrika',oceania:'Oseania'};
  const elements = new Map(), markers = new Map(), centers = new Map();
  let states = [], queue = [], index = 0, phase = 'ready', locked = false;
  let results = new Map(), roundMistakes = 0, mistakes = 0;
  let totalTime = 0, roundTime = 0, lastTick = performance.now(), generation = 0;
  const timers = new Set();
  // Shared by the standalone state/county games and every Kart region. Keep
  // this offer in the panel so it never competes with the score-name dialog.
  const repeatOffer = document.createElement('section');
  repeatOffer.id = 'repeat-practice'; repeatOffer.hidden = true;
  const repeatQuestion = document.createElement('strong');
  repeatQuestion.textContent = 'Øve en gang til?';
  const repeatButton = document.createElement('button');
  repeatButton.id = 'repeat-practice-start'; repeatButton.type = 'button';
  repeatButton.className = 'primary-button';
  repeatButton.textContent = 'Øv på de som ikke ble grønne';
  repeatButton.addEventListener('click', () => {
    if (phase !== 'finished' || mastered.size === states.length) return;
    retrying = true; practice = true;
    document.body.dataset.practice = 'true';
    window.GeoOnline?.resetStatle();
    begin();
  });
  repeatOffer.append(repeatQuestion, repeatButton);
  $('feedback').after(repeatOffer);
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
    elements.forEach(el => el.classList.remove('wrong', 'correct', 'hovered', 'hinted'));
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
    if (municipalities) {
      $('map').setAttribute('viewBox',regionData.viewBox.join(' '));
      const extent=svgNode('clipPath',{id:'municipality-extent',clipPathUnits:'userSpaceOnUse'});
      extent.append(svgNode('path',{d:states.map(state=>state.d).join(' '),'clip-rule':'evenodd'}));
      $('states').append(extent);
      if(regionData.context) $('states').append(svgNode('path',{d:regionData.context,class:'municipality-context','fill-rule':'evenodd','aria-hidden':'true'}));
      for(const state of states) {
        const el=svgNode('path',{d:state.d,class:'state municipality','fill-rule':'evenodd',role:'button',tabindex:'0','aria-label':shapeLabel});
        el.dataset.state=state.n;el.dataset.code=state.a;$('states').append(el);elements.set(state.n,el);
        const box=el.getBBox();centers.set(state.n,{x:state.c[0],y:state.c[1],radius:Math.max(box.width,box.height)/2+10});
      }
      // Water provides geographical clues; it never intercepts answers. Draw
      // municipal boundaries again above it so they remain easy to follow.
      const water=svgNode('g',{id:'municipality-water','aria-hidden':'true','pointer-events':'none','clip-path':'url(#municipality-extent)'});
      const waterPaths=new Map();
      for(const feature of regionData.water||[]) {
        if(!waterPaths.has(feature.kind))waterPaths.set(feature.kind,[]);
        waterPaths.get(feature.kind).push(feature.d);
      }
      for(const [kind,paths] of waterPaths)water.append(svgNode('path',{d:paths.join(' '),class:'municipality-'+kind,'fill-rule':'evenodd','vector-effect':'non-scaling-stroke'}));
      $('states').append(water);
      const boundaries=svgNode('g',{class:'municipality-boundaries','aria-hidden':'true','pointer-events':'none'});
      for(const state of states)boundaries.append(svgNode('path',{d:state.d,'fill-rule':'evenodd','vector-effect':'non-scaling-stroke'}));
      $('states').append(boundaries);
      return;
    }
    if (physical) {
      $('map').setAttribute('viewBox',regionData.viewBox.join(' '));
      const land=(regionData.background||[]).filter(layer=>layer.kind==='land'),v=regionData.viewBox;
      const clip=svgNode('clipPath',{id:'physical-water-clip',clipPathUnits:'userSpaceOnUse'});
      clip.append(svgNode('path',{d:`M${v[0]} ${v[1]}h${v[2]}v${v[3]}h${-v[2]}Z`+land.map(l=>l.d).join(''),'clip-rule':'evenodd'}));$('states').append(clip);
      // Intersect two clips: adding lake rings to the land clip's even-odd path
      // would toggle lakes back on wherever the country polygon already covers them.
      const lakeClip=svgNode('clipPath',{id:'physical-lake-exclusion',clipPathUnits:'userSpaceOnUse'});
      lakeClip.append(svgNode('path',{d:`M${v[0]} ${v[1]}h${v[2]}v${v[3]}h${-v[2]}Z`+(regionData.background||[]).filter(l=>l.kind==='lake').map(l=>l.d).join(''),'clip-rule':'evenodd'}));$('states').append(lakeClip);
      for(const layer of regionData.background||[])$('states').append(svgNode('path',{d:layer.d,class:'physical-background '+layer.kind,'fill-rule':'evenodd','aria-hidden':'true'}));
      // Large marine areas sit below their smaller component seas and rivers.
      for (const state of states) {
        const group=svgNode('g',{class:'physical-target '+state.kind,role:'button',tabindex:'0','aria-label':'Sted på kartet'});group.dataset.state=state.n;
        if(state.kind==='sea'&&!regionData.clipped)group.setAttribute('clip-path','url(#physical-water-clip)');
        const path=svgNode('path',{d:state.d,class:'physical-shape','fill-rule':'evenodd','vector-effect':'non-scaling-stroke'});
        if(state.kind==='sea'&&!regionData.clipped)path.setAttribute('clip-path','url(#physical-lake-exclusion)');
        group.append(path);
        const hit=svgNode('path',{d:state.d,class:'physical-hit','fill-rule':'evenodd','vector-effect':'non-scaling-stroke',style:'stroke-width:'+(state.hitWidth||12)+'px'});group.append(hit);
        if(state.kind==='sea'){hit.style.strokeWidth='0';if(!regionData.clipped)hit.setAttribute('clip-path','url(#physical-lake-exclusion)');}
        $('states').append(group);elements.set(state.n,group);
        const b=path.getBBox();centers.set(state.n,{x:state.c[0],y:state.c[1],radius:Math.max(b.width,b.height)/2+10});
        if(state.marker){const marker=svgNode('g',{class:'small-marker physical-marker '+state.kind,role:'button',tabindex:'0','aria-label':'Ekstra treffelt for et lite sted'});marker.dataset.state=state.n;marker.append(svgNode('circle',{cx:state.c[0],cy:state.c[1],r:11,class:'hit'}),svgNode('circle',{cx:state.c[0],cy:state.c[1],r:4.5,class:'visible'}));$('smallStates').append(marker);markers.set(state.n,marker);}
      }
      return;
    }
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
    const alaska = fit(groups.AK, {x:25, y:southEdge - 125, w:165, h:100, bottom:true});
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
    if(physical){const el=elements.get(target().n);el.classList.add('hinted');later(()=>el.classList.remove('hinted'),1800);return;}
    const c = centers.get(target().n), radius = Math.max(25, Math.min(120, c.radius));
    const circle = svgNode('circle', {cx:c.x, cy:c.y, r:radius, class:'hint-ring'});
    $('hintLayer').replaceChildren(circle);
    later(() => circle.remove(), 1450);
  }
  function setBand(name, band) {
    const el = elements.get(name);
    el.classList.remove('retry-pending');
    el.dataset.band = String(band); el.classList.add('found');
    el.setAttribute('aria-label', name + ' – fullført');
    if (markers.has(name)) { markers.get(name).classList.remove('retry-pending'); markers.get(name).dataset.band = String(band); markers.get(name).setAttribute('aria-label', name + ' – fullført'); }
  }
  function updateStats() {
    $('completed').textContent = results.size;
    $('progressFill').style.width = results.size / Math.max(1,phase === 'ready' ? total : queue.length) * 100 + '%';
    $('mistakes').textContent = String(mistakes);
  }
  function setPhase(value){phase=value;document.body.dataset.phase=value;}
  function prompt(){$('targetVerb').textContent=retrying?'Øvingsrunde · klikk på':'Klikk på';const subtitle=$('target-continent');if(subtitle){subtitle.hidden=!continentPractice;subtitle.textContent=continentPractice?continentNames[target()?.continent]||'':'';}}
  function next() {
    index++; locked = false; roundMistakes = 0; roundTime = 0;
    $('hintLayer').replaceChildren(); $('labelLayer').replaceChildren();
    elements.forEach(el => el.classList.remove('correct', 'wrong', 'hinted'));
    if (!target()) return finish();
    if(!practice)window.GeoOnline?.statleNext();
    $('targetName').textContent = target().n;
    prompt();setFeedback('');
  }
  function choose(name) {
    if (phase === 'ready' || phase === 'finished') {flashLabel(name,'',2800);setFeedback(name);return;}
    if (phase !== 'playing' || locked || !target()) return;
    tick();
    if (results.has(name) || mastered.has(name)) { flashLabel(name, ''); setFeedback(name + ' er allerede fullført.'); return; }
    if(!practice)window.GeoOnline?.statleAnswer(name);
    if (name !== target().n) {
      roundMistakes++; mistakes++; updateStats();
      const el = elements.get(name); el.classList.add('wrong');
      flashLabel(name, 'error');
      later(() => el.classList.remove('wrong'), 1050);
      if (roundMistakes >= 2) showHint();
      setFeedback('Det var ' + name + '.', 'error');
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
  function start(){retrying=false;mastered.clear();document.querySelectorAll('[name="water-category"]').forEach(input=>input.disabled=true);continentPractice=!!$('continent-practice')?.checked&&['rivers','lakes','mountains'].includes(document.body.dataset.region);practice=continentPractice;document.body.dataset.practice=String(practice);if($('continent-practice'))$('continent-practice').disabled=true;if(practice){window.GeoOnline?.resetStatle();return begin();}if(window.GeoOnline)return GeoOnline.startStatle(begin);return begin();}
  function begin(names) {
    generation++; clearEffects();if($('statle-score'))$('statle-score').hidden=true;
    results = new Map(); index = 0; totalTime = 0; roundTime = 0; lastTick = performance.now();
    roundMistakes = 0; mistakes = 0; locked = false;
    repeatOffer.hidden = true; repeatButton.disabled = false; document.body.dataset.retry = String(retrying);
    elements.forEach((el,name) => { delete el.dataset.band; el.classList.remove('found'); el.classList.toggle('mastered',retrying&&mastered.has(name));el.classList.toggle('retry-pending',retrying&&!mastered.has(name));el.setAttribute('aria-label', mastered.has(name) ? name + ' – fullført' : shapeLabel); });
    markers.forEach((el,name) => { delete el.dataset.band;el.classList.toggle('mastered',retrying&&mastered.has(name));el.classList.toggle('retry-pending',retrying&&!mastered.has(name)); el.setAttribute('aria-label', mastered.has(name) ? name + ' – fullført' : counties ? 'Ekstra klikkfelt for et lite fylke' : kart ? 'Ekstra klikkfelt for et lite land' : 'Ekstra klikkfelt for en liten delstat'); });
    queue = names ? names.map(name=>states.find(s=>s.n===name)) : states.filter(s => !mastered.has(s.n));
    if(!names)for (let i = queue.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [queue[i],queue[j]] = [queue[j],queue[i]]; }
    if(continentPractice)queue.sort((a,b)=>continentOrder.indexOf(a.continent)-continentOrder.indexOf(b.continent));
    ($('total-count')||$('completed').parentElement.querySelector('small')).textContent=' / '+queue.length;
    setPhase('playing'); $('overlay').hidden = true;if($('water-options'))$('water-options').hidden=true;
    if($('continent-practice-option'))$('continent-practice-option').hidden=true;
    $('mapViewport').scrollTo({left:0,top:0});
    prompt();
    $('targetName').textContent = target().n; $('elapsed').textContent = '00:00';
    $('restart').disabled = false;
    updateStats(); setFeedback('');
  }
  function finish() {
    setPhase('finished'); locked = true;
    // Let the original score check/name prompt finish before a retry detaches
    // its session. Practice itself never waits for or contacts the service.
    if(!practice){
      repeatButton.disabled = true;
      const run = generation;
      Promise.resolve(window.GeoOnline?.finishStatle()).catch(()=>{}).finally(()=>{if(run===generation)repeatButton.disabled=false;});
    }
    if($('target-continent'))$('target-continent').hidden=true;
    $('targetVerb').textContent = 'Godt jobbet!';
    $('targetName').textContent = municipalities ? 'Alle kommunene er på plass.' : physical ? 'Alle stedene er fullført.' : counties ? 'Alle fylkene er på plass.' : kart ? 'Alle landene er på plass.' : 'Hele USA er på plass.';
    const counts = [0,0,0,0]; results.forEach(r => counts[r.band]++);
    results.forEach((r,name) => { if(r.band === 0)mastered.add(name); });
    repeatOffer.hidden = mastered.size === states.length;
    if(retrying)$('targetName').textContent=repeatOffer.hidden?'Alle er grønne!':'Øvingsrunden er fullført.';
    setFeedback('Alle ' + queue.length + ' fullført · ' + timeText(totalTime) + ' · ' + mistakes + ' feil. Grønn: ' + counts[0] + ', gul: ' + counts[1] + ', oransje: ' + counts[2] + ', rød: ' + counts[3] + '.');
    if(!repeatOffer.hidden)repeatOffer.scrollIntoView({block:'nearest'});
  }
  function clickedName(event,element){
    if(!physical)return element.dataset.state;
    if(element.classList.contains('small-marker')){let nearest=null,distance=Infinity;for(const [name,marker] of markers){const circle=marker.querySelector('.visible'),matrix=marker.getScreenCTM(),local=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());if(!circle.isPointInFill(local))continue;const center=new DOMPoint(circle.cx.baseVal.value,circle.cy.baseVal.value).matrixTransform(matrix),d=(event.clientX-center.x)**2+(event.clientY-center.y)**2;if(d<distance){distance=d;nearest=name;}}if(nearest)return nearest;}
    const p=new DOMPoint(event.clientX,event.clientY).matrixTransform($('map').getScreenCTM().inverse()),clicked=elements.get(element.dataset.state);let painted;
    // Ocean catchments include masked land/coastal slivers. isPointInFill does
    // not apply SVG clips, so these invisible areas must not steal a lake hit.
    const maskedWater=[...$('states').querySelectorAll('.physical-background.land,.physical-background.lake')].some(path=>path.isPointInFill(p));
    // A neighbour's enlarged touch corridor must never steal a click on the
    // actual lake/strait/river beneath it. Respect the visible painting order.
    for(const [name,group] of elements){if(maskedWater&&group.classList.contains('sea'))continue;const shape=group.querySelector('.physical-shape');if(group.classList.contains('river')?shape.isPointInStroke(p):shape.isPointInFill(p))painted=name;}
    if(painted)return painted;
    if(maskedWater&&clicked.classList.contains('sea'))return null;
    if(!clicked.classList.contains('river'))return element.dataset.state;
    let best=Infinity,name=element.dataset.state;
    // Transparent touch corridors can overlap. Choose the nearest actual river,
    // rather than whichever neighbouring corridor happens to be painted last.
    for(const [candidate,group] of elements){if(!group.classList.contains('river'))continue;const hit=group.querySelector('.physical-hit');if(!hit.isPointInStroke(p))continue;const path=group.querySelector('.physical-shape'),length=path.getTotalLength();let at=0,distance=Infinity;for(let i=0;i<=48;i++){const t=length*i/48,q=path.getPointAtLength(t),d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<distance){distance=d;at=t;}}let span=length/48;for(let pass=0;pass<4;pass++){for(const t of [Math.max(0,at-span/2),Math.min(length,at+span/2)]){const q=path.getPointAtLength(t),d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<distance){distance=d;at=t;}}span/=2;}if(distance<best){best=distance;name=candidate;}}
    return name;
  }
  $('map').addEventListener('click', e => { const el = e.target.closest('[data-state]'); if (el){const name=clickedName(e,el);if(name)choose(name);} });
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
  const menu = $('geoMenu'), menuButton = $('geoMenuButton');
  let menuOpener=menuButton;
  function openMenu(button){menuOpener=button;menu.showModal();button.setAttribute('aria-expanded','true');}
  menuButton.addEventListener('click', () => openMenu(menuButton));
  $('kart-menu-button')?.addEventListener('click',event=>openMenu(event.currentTarget));
  $('geoMenuClose').addEventListener('click', () => menu.close());
  const menuTools=document.createElement('div');menuTools.className='geo-menu-tools';
  for(const [label,title,action] of [
    ['↓','Lagre som PDF',()=>window.print()],
    ['⛶','Fullskjerm',()=>document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.()],
    ['◐','Lys eller mørk modus',()=>themeButtons[0].click()]
  ]) {
    const button=document.createElement('button');button.type='button';button.textContent=label;button.title=title;button.setAttribute('aria-label',title);button.addEventListener('click',action);menuTools.append(button);
  }
  menu.append(menuTools);
  const menuBack=document.createElement('a');menuBack.className='geo-menu-back';menuBack.href='../geografi.html';menuBack.textContent='←';menuBack.setAttribute('aria-label','Tilbake til geografi');menu.append(menuBack);
  menu.addEventListener('close', () => { menuButton.setAttribute('aria-expanded', 'false');$('kart-menu-button')?.setAttribute('aria-expanded','false');menuOpener.focus(); });
  menu.addEventListener('click', event => {
    const box = menu.getBoundingClientRect();
    if (event.target === menu && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) menu.close();
  });
  function resetMap() {
    mastered.clear();retrying=false;continentPractice=false;repeatOffer.hidden=true;delete document.body.dataset.retry;
    generation++;clearEffects();elements.clear();markers.clear();centers.clear();
    $('states').replaceChildren();$('smallStates').replaceChildren();$('insetSeparators').setAttribute('d','');
    $('map').setAttribute('viewBox','0 0 900 550');
    results=new Map();index=0;mistakes=0;totalTime=0;setPhase('ready');locked=false;
    $('completed').textContent='0';$('elapsed').textContent='00:00';$('mistakes').textContent='0';$('progressFill').style.width='0%';
    $('overlay').hidden=false;$('start').disabled=true;$('restart').disabled=true;$('statle-score').hidden=true;
    document.querySelectorAll('[name="water-category"]').forEach(input=>input.disabled=false);
    if($('continent-practice'))$('continent-practice').disabled=false;
  }
  const waterCategories=()=>[...document.querySelectorAll('[name="water-category"]:checked')].map(input=>input.value).sort();

  // A floating world-map panel can be moved from any non-interactive surface.
  const panel=document.querySelector('.game-panel');let panelDrag=null;
  panel.addEventListener('pointerdown',event=>{
    if(!physical||event.button!==0||event.target.closest('button,a,input,label,select,summary,details,.water-options,.panel-header'))return;
    const rect=panel.getBoundingClientRect();panelDrag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};panel.setPointerCapture(event.pointerId);event.preventDefault();
  });
  panel.addEventListener('pointermove',event=>{if(!panelDrag||event.pointerId!==panelDrag.id)return;const rect=panel.getBoundingClientRect();panel.style.left=Math.max(6,Math.min(innerWidth-rect.width-6,panelDrag.left+event.clientX-panelDrag.x))+'px';panel.style.top=Math.max(6,Math.min(innerHeight-rect.height-6,panelDrag.top+event.clientY-panelDrag.y))+'px';panel.style.bottom='auto';});
  const stopPanelDrag=()=>{panelDrag=null;};panel.addEventListener('pointerup',stopPanelDrag);panel.addEventListener('pointercancel',stopPanelDrag);panel.addEventListener('lostpointercapture',stopPanelDrag);
  addEventListener('resize',()=>{if(!physical)return;$('map').setAttribute('preserveAspectRatio',innerWidth>700?'none':'xMidYMid meet');if(panel.style.top){const r=panel.getBoundingClientRect();panel.style.left=Math.max(6,Math.min(innerWidth-r.width-6,r.left))+'px';panel.style.top=Math.max(6,Math.min(innerHeight-r.height-6,r.top))+'px';}});

  const readMap=url=>fetch(url).then(response=>{if(!response.ok)throw Error('Kartet kunne ikke hentes');return response.json();});
  if(municipalities) {
    let municipalityIndex;
    const maps=new Map();
    async function selectMunicipalityCounty(code) {
      const county=municipalityIndex?.counties.find(county=>county.code===code);
      if(!county)return;
      const token=++mapGeneration;resetMap();shapeLabel='Kommune på kartet';
      document.body.dataset.county=code;document.body.dataset.region='kommuner-'+code;
      $('municipality-selection').hidden=true;$('kart-game').hidden=false;
      $('targetVerb').textContent='Klar for en runde?';$('targetName').textContent=county.quizTitle||county.name;
      $('start').textContent='Laster kart …';setFeedback('');
      const url=new URL(location.href);url.searchParams.set('fylke',code);history.replaceState(null,'',url);
      try {
        if(!maps.has(code))maps.set(code,readMap('../assets/geography/municipalities/'+county.file+'?v='+encodeURIComponent(county.revision||municipalityIndex.version||'1')).catch(error=>{maps.delete(code);throw error;}));
        const data=await maps.get(code);if(token!==mapGeneration)return;
        if(!data.states?.length||new Set(data.states.map(state=>state.n)).size!==data.states.length)throw Error('Ufullstendig kart');
        regionData=data;states=data.states;total=states.length;
        $('targetName').textContent=data.title||county.quizTitle||county.name;
        const countyLabel=$('municipality-current-county');if(countyLabel)countyLabel.textContent=data.title||county.quizTitle||county.name;
        $('total-count').textContent=' / '+total;
        $('map').setAttribute('aria-label','Klikkbart kommunekart over '+(data.title||county.name));
        buildMap();updateStats();window.ClickMapZoom?.setBase();window.dispatchEvent(new Event('resize'));
        $('start').disabled=false;$('start').textContent='Start →';
        window.dispatchEvent(new CustomEvent('municipality-game-ready',{detail:{code,count:total,title:data.title||county.name}}));
      } catch(_) {
        if(token!==mapGeneration)return;
        $('start').textContent='Kartet kunne ikke lastes';setFeedback('Velg fylke på nytt for å prøve igjen.','error');
      }
    }
    window.addEventListener('municipality-select',event=>selectMunicipalityCounty(event.detail.code));
    window.addEventListener('municipality-index-ready',event=>{
      municipalityIndex=event.detail;
      const selected=new URLSearchParams(location.search).get('fylke');
      if(selected)selectMunicipalityCounty(selected);
    });
    $('kart-back').addEventListener('click',event=>{
      event.preventDefault();++mapGeneration;resetMap();$('kart-game').hidden=true;
      $('municipality-selection').hidden=false;delete document.body.dataset.county;delete document.body.dataset.region;
      const url=new URL(location.href);url.searchParams.delete('fylke');history.replaceState(null,'',url);
      window.dispatchEvent(new CustomEvent('municipality-back'));
    });
    setPhase('ready');return;
  }
  let continents,countyMap,worldWater,mountainEurope;
  async function selectMap(region) {
    const titles={fylker:'Norske fylker',europe:'Europa',asia:'Asia',northAmerica:'Nord- og Mellom-Amerika',southAmerica:'Sør-Amerika',africa:'Afrika',oceania:'Oseania',rivers:'Verdens elver',lakes:'Innsjøer',seas:'Havområder, bukter og stred',mountains:'Fjellkjeder og høyland'};
    if(!Object.hasOwn(titles,region))return;
    if(document.body.dataset.region!==region&&$('continent-practice'))$('continent-practice').checked=false;
    practice=!!$('continent-practice')?.checked;document.body.dataset.practice=String(practice);if($('target-continent'))$('target-continent').hidden=true;
    panel.style.removeProperty('top');panel.style.removeProperty('left');panel.style.removeProperty('bottom');const token=++mapGeneration;window.GeoOnline?.resetStatle();resetMap();document.body.dataset.region=region;counties=region==='fylker';physical=['rivers','lakes','seas','mountains'].includes(region);document.body.dataset.physical=String(physical);shapeLabel=physical?'Sted på kartet':counties?'Fylke på kartet':'Land på kartet';
    $('kart-selection').hidden=true;$('kart-game').hidden=false;$('targetName').textContent=titles[region];$('targetVerb').textContent='Klar for en runde?';$('start').textContent='Laster kart …';setFeedback('Laster kart …');
    const url=new URL(location.href);url.searchParams.set('region',region);history.replaceState(null,'',url);
    try {
      if(counties){countyMap||=readMap('../assets/geography/norway-counties.json').catch(error=>{countyMap=null;throw error;});const data=await countyMap;if(token!==mapGeneration)return;states=data;regionData=null;}
      else if(physical){
        let data;if(['rivers','lakes','seas'].includes(region)){worldWater||=readMap('../assets/geography/physical-maps/world-water.json').catch(e=>{worldWater=null;throw e;});data=await worldWater;}
        else{mountainEurope||=readMap('../assets/geography/physical-maps/mountain-europe.json').catch(e=>{mountainEurope=null;throw e;});data=await mountainEurope;}
        if(token!==mapGeneration)return;regionData={...data.regions[region],background:(data.regions[region].background||data.background).concat(data.regions[region].extraLand||[])};states=regionData.states.filter(s=>region!=='seas'||waterCategories().includes(s.group));document.body.dataset.waterCategories=waterCategories().join(',');
        if(window.GEO_QUIZ_EN)for(const state of states)if(state.en)window.GEO_QUIZ_EN.names[state.n]=state.en;
      }else {continents||=readMap('../assets/geography/continent-maps.json').catch(error=>{continents=null;throw error;});const data=await continents;if(token!==mapGeneration)return;regionData=data.regions[region];states=regionData.states;}
      if(token!==mapGeneration)return;total=states.length;
      if(new Set(states.map(s=>s.n)).size!==total)throw Error('Ufullstendig kart');
      $('total-count').textContent=' / '+total;$('map').setAttribute('aria-label',counties?'Klikkbart kart over Norges 15 fylker':'Klikkbart kart over '+titles[region]);
      document.querySelector('.map-credit').hidden=counties||physical;document.querySelector('.county-credit').hidden=!counties;document.querySelector('.physical-credit').hidden=!physical;if($('river-credit'))$('river-credit').hidden=region!=='rivers';
      $('water-options').hidden=region!=='seas';$('continent-practice-option').hidden=!['rivers','lakes','mountains'].includes(region);$('mistakes-label').textContent=window.QuizLanguage?.language==='en'?'Mistakes':'Feil';
      updateStats();
      $('map').setAttribute('preserveAspectRatio',physical&&innerWidth>700?'none':'xMidYMid meet');buildMap();window.ClickMapZoom?.setBase();window.dispatchEvent(new Event('resize'));$('statle-top-ten').disabled=!total;$('start').disabled=!total;$('start').textContent=total?'Start →':'Velg minst én kategori';setFeedback('');
    }catch(_){if(token!==mapGeneration)return;$('start').textContent='Kartet kunne ikke lastes';setFeedback('Velg kart på nytt for å prøve igjen.','error');}
  }
  if(kart){
    document.querySelectorAll('[data-map-region]').forEach(button=>button.addEventListener('click',()=>selectMap(button.dataset.mapRegion)));
    $('kart-back').addEventListener('click',event=>{event.preventDefault();++mapGeneration;window.GeoOnline?.resetStatle();resetMap();$('kart-game').hidden=true;$('kart-selection').hidden=false;delete document.body.dataset.region;delete document.body.dataset.physical;const url=new URL(location.href);url.searchParams.delete('region');history.replaceState(null,'',url);document.querySelector('#kart-selection h1')?.focus();});
    document.querySelectorAll('[name="water-category"]').forEach(input=>input.addEventListener('change',()=>selectMap('seas')));
    $('continent-practice').addEventListener('change',()=>{practice=$('continent-practice').checked;document.body.dataset.practice=String(practice);window.GeoOnline?.resetStatle();});
    const selected=new URLSearchParams(location.search).get('region');if(selected)selectMap(selected);
    return;
  }
  setPhase('ready');
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
