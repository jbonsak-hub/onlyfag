/* Clickable Statle, shared by the quiz page and local preview.
   Census geometry; game answers remain in memory. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ns = 'http://www.w3.org/2000/svg';
  const elements = new Map(), markers = new Map(), centers = new Map();
  let states = [], queue = [], index = 0, phase = 'ready', locked = false;
  let results = new Map(), roundMistakes = 0, mistakes = 0, skipped = 0;
  let totalTime = 0, roundTime = 0, lastTick = performance.now(), generation = 0;
  let isDemo = false, pendingAdvance = false;
  let pausedScroll = {left:0,top:0};
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
    const y = rect.y + (rect.h - b.height * scale) / 2 - b.y * scale;
    group.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
    for (const el of group.children) {
      const state = states.find(s => s.n === el.dataset.state), box = el.getBBox();
      const c = state.a === 'AK' || state.a === 'HI' ? [box.x + box.width / 2, box.y + box.height / 2] : state.c;
      centers.set(state.n, {x:c[0] * scale + x, y:c[1] * scale + y, radius:Math.max(box.width, box.height) * scale / 2 + 10});
    }
  }
  function buildMap() {
    const groups = {main:svgNode('g'), AK:svgNode('g'), HI:svgNode('g')};
    $('states').append(groups.main, groups.AK, groups.HI);
    for (const state of states) {
      const el = svgNode('path', {d:state.d, class:'state', role:'button', tabindex:'0', 'aria-label':'Delstat på kartet'});
      el.dataset.state = state.n;
      groups[state.a === 'AK' || state.a === 'HI' ? state.a : 'main'].append(el);
      elements.set(state.n, el);
    }
    fit(groups.main, {x:20, y:16, w:825, h:522});
    fit(groups.AK, {x:25, y:394, w:165, h:100});
    fit(groups.HI, {x:215, y:465, w:110, h:41});
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
  function flashLabel(name, kind) {
    const c = centers.get(name), width = Math.max(70, name.length * 7 + 22);
    const x = Math.max(width / 2 + 9, Math.min(891 - width / 2, c.x));
    const y = Math.max(26, Math.min(525, c.y - 21));
    const g = svgNode('g', {class:'flash-label ' + kind});
    g.append(svgNode('rect', {x:x - width / 2,y:y - 13,width,height:26,rx:4}));
    const text = svgNode('text', {x,y:y + 1}); text.textContent = name; g.append(text);
    $('labelLayer').replaceChildren(g);
    later(() => g.remove(), 1050);
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
    $('progressFill').style.width = results.size * 2 + '%';
    $('mistakes').textContent = mistakes + ' feil';
  }
  function next() {
    if (phase === 'paused') { pendingAdvance = true; return; }
    index++; locked = false; roundMistakes = 0; roundTime = 0;
    $('hintLayer').replaceChildren(); $('labelLayer').replaceChildren();
    elements.forEach(el => el.classList.remove('correct', 'wrong'));
    if (!target()) return finish();
    $('targetName').textContent = target().n;
    setFeedback('Hvor ligger ' + target().n + '?');
  }
  function choose(name) {
    if (phase !== 'playing' || locked || !target()) return;
    tick();
    if (results.has(name)) { flashLabel(name, ''); setFeedback(name + ' er allerede fullført.'); return; }
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
  function start(demo = false) {
    generation++; clearEffects();
    results = new Map(); index = 0; totalTime = 0; roundTime = 0; lastTick = performance.now();
    roundMistakes = 0; mistakes = 0; skipped = 0; locked = false; pendingAdvance = false; isDemo = demo;
    elements.forEach(el => { delete el.dataset.band; el.classList.remove('found'); el.setAttribute('aria-label', 'Delstat på kartet'); });
    markers.forEach(el => { delete el.dataset.band; el.setAttribute('aria-label', 'Ekstra klikkfelt for en liten delstat'); });
    if (demo) {
      ['California','Texas','Florida','Illinois','Alaska','Hawaii'].forEach((name, i) => {
        const band = [0,0,1,2,3,1][i]; results.set(name,{band,ms:0,mistakes:0}); setBand(name,band);
      });
    }
    queue = states.filter(s => !results.has(s.n));
    for (let i = queue.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [queue[i],queue[j]] = [queue[j],queue[i]]; }
    if (demo) { const pa = queue.findIndex(s => s.a === 'PA'); [queue[0],queue[pa]] = [queue[pa],queue[0]]; }
    phase = 'playing'; $('overlay').hidden = true; $('pauseOverlay').hidden = true;
    $('mapViewport').scrollTo({left:0,top:0});
    $('targetVerb').textContent = demo ? 'Eksempel · klikk på' : 'Klikk på';
    $('targetName').textContent = target().n; $('elapsed').textContent = '00:00';
    $('pause').disabled = false; $('restart').disabled = false; $('skip').disabled = false;
    updateStats(); setFeedback(demo ? 'Eksempelrunde: Noen stater er ferdige. Prøv gjerne to feilklikk for å se hintet.' : 'Finn ' + target().n + '. Du har god tid.');
    $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label','Sett spillet på pause');
  }
  function pause() {
    if (phase === 'playing') {
      tick(); phase = 'paused'; $('pauseOverlay').hidden = false;
      pausedScroll = {left:$('mapViewport').scrollLeft,top:$('mapViewport').scrollTop};
      $('mapViewport').scrollTo({left:0,top:0});
      $('pause').textContent = '▷'; $('pause').setAttribute('aria-label','Fortsett spillet'); $('resume').focus();
    } else if (phase === 'paused') {
      phase = 'playing'; lastTick = performance.now(); $('pauseOverlay').hidden = true;
      $('mapViewport').scrollTo(pausedScroll);
      $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label','Sett spillet på pause');
      if (pendingAdvance) { pendingAdvance = false; next(); }
      $('pause').focus();
    }
  }
  function skip() {
    if (phase !== 'playing' || locked) return;
    const name = target().n;
    results.set(name,{band:3,ms:roundTime,mistakes:roundMistakes,skipped:true});
    skipped++; setBand(name,3); flashLabel(name,'error'); locked = true;
    $('hintLayer').replaceChildren(); setFeedback('Her ligger ' + name + '. Vi går videre.');
    updateStats(); later(next,1100);
  }
  function finish() {
    phase = 'finished'; locked = true;
    $('targetVerb').textContent = isDemo ? 'Eksempelrunden er ferdig' : 'Godt jobbet!';
    $('targetName').textContent = 'Hele USA er på plass.';
    $('pause').disabled = true; $('skip').disabled = true;
    const counts = [0,0,0,0]; results.forEach(r => counts[r.band]++);
    setFeedback((isDemo ? 'Eksempelrunde' : 'Alle 50 fullført') + ' · ' + timeText(totalTime) + ' · ' + mistakes + ' feil · ' + skipped + ' hoppet over. Grønn: ' + counts[0] + ', gul: ' + counts[1] + ', oransje: ' + counts[2] + ', rød: ' + counts[3] + '.');
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
  $('start').addEventListener('click',() => start()); $('demo').addEventListener('click',() => start(true));
  $('restart').addEventListener('click',() => start()); $('pause').addEventListener('click',pause); $('resume').addEventListener('click',pause); $('skip').addEventListener('click',skip);
  document.addEventListener('visibilitychange',() => { if (document.hidden && phase === 'playing') pause(); });
  const embedded = document.getElementById('statle-map-data');
  const mapData = embedded ? Promise.resolve(JSON.parse(embedded.textContent)) : fetch('../assets/geography/us-states.json').then(response => {
    if (!response.ok) throw new Error('Kartet kunne ikke hentes'); return response.json();
  });
  mapData.then(data => {
    states = data;
    if (states.length !== 50) throw new Error('Kartet må ha 50 delstater');
    buildMap(); $('start').disabled = false; $('demo').disabled = false; $('start').textContent = 'Start Statle →';
  }).catch(() => { $('start').textContent = 'Kartet kunne ikke lastes'; setFeedback('Last siden på nytt for å hente kartet.','error'); });
})();
