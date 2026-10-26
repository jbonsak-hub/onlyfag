/* Shared click-map game for Statle, Norwegian counties and continent maps. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ns = 'http://www.w3.org/2000/svg';
  const kart = document.body.dataset.quiz === 'kart';
  const municipalities = document.body.dataset.quiz === 'kommuner';
  const boroughs = document.body.dataset.quiz === 'bydeler';
  const statle = document.body.dataset.quiz === 'statle';
  const localMap = municipalities || boroughs;
  const countryRegions=new Set(['europe','asia','northAmerica','southAmerica','africa','oceania']);
  const countryRegion=()=>kart&&countryRegions.has(document.body.dataset.region);
  const enhanced=()=>statle||countryRegion()||localMap;
  const capitalsInput=()=>statle?$('statle-capitals'):null;
  const advancedInputs=()=>[advancedInput(),capitalsInput()].filter(Boolean);
  const advancedInput=()=>$(municipalities?'municipality-centres':statle?'statle-advanced':'region-capitals');
  const namesInput=()=>$(localMap?'local-show-names':statle?'statle-show-names':'region-show-names');
  let largestCities=null, stateCapitals=null;
  let cityData = null, citiesMode = false, basemap=null, regionalCapitals=null, municipalityCentres=null, cityMarkerScale='';
  const cityPoints = new Map(), stateTransforms = new Map();
  const showNames = () => enhanced() && !!namesInput()?.checked;
  const answerName = name => citiesMode ? displayCityName(states.find(state=>state.n===name)) + ' · ' + (window.QuizLanguage?.translate(name)||name) : name;
  const displayCityName=state=>statle?StatleLabelLayout.cityName(state,cityData):(window.QuizLanguage?.language==='en'?cityData[state.n].en||cityData[state.n].name:cityData[state.n].name);
  const questionName = state => citiesMode ? municipalities?cityData[state.n].promptName||displayCityName(state):displayCityName(state) : state.n;
  const questionSymbol = document.createElement('img');
  questionSymbol.id='target-symbol';questionSymbol.hidden=true;questionSymbol.decoding='async';
  $('targetName').before(questionSymbol);
  function renderQuestion() {
    const state=target(),symbol=state&&window.MapSymbols?.lookup(state.n,{kind:countryRegion()?'country':statle?'state':municipalities?'municipality':counties?'county':boroughs?'municipality':'none',code:state.a});
    const show=!!symbol&&(!citiesMode||statle||countryRegion());
    questionSymbol.hidden=!show;
    if(show){questionSymbol.src=symbol.src;questionSymbol.alt=symbol.alt;questionSymbol.dataset.type=symbol.type;}
    else questionSymbol.removeAttribute('src');
    $('targetName').textContent=questionName(state);
  }
  questionSymbol.addEventListener('error',()=>{questionSymbol.hidden=true;});
  // Rankings belong to navigation, below round controls and above map choice.
  const footer=document.querySelector('.game-panel footer');
  footer.insertBefore($('statle-top-ten'),footer.querySelector('.quiz-page-back'));
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
  let regionData = null, usContext = null, mapGeneration = 0, physical = false;
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
      if(statle)stateTransforms.set(state.n,{x,y,scale});
      if (cityData?.[state.n]) {
        const p = cityData[state.n].p;
        cityPoints.set(state.n, {x:p[0] * scale + x, y:p[1] * scale + y});
      }
    }
    return {x:b.x * scale + x, y:b.y * scale + y, width:b.width * scale, height:b.height * scale};
  }
  let stopTerrainScope=null;
  function clearTerrainScope(){stopTerrainScope?.();stopTerrainScope=null;$('terrain-selection-scope')?.remove();}
  function buildMap() {
    clearTerrainScope();
    buildMapGeometry();
    // Separate black paths make a union, preserving overlaps such as forest
    // inside a borough. Only neighboring areas receive the passive tint.
    const scope=svgNode('g',{id:'terrain-selection-scope','aria-hidden':'true','pointer-events':'none'});
    const mask=svgNode('mask',{id:'terrain-playable-mask',maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',style:'mask-type:luminance'});
    const outside=svgNode('rect',{fill:'white'});mask.append(outside);
    for(const shape of $('states').querySelectorAll('path.state')) {
      const transforms=[];
      for(let node=shape;node&&node!==$('states');node=node.parentElement)if(node.hasAttribute('transform'))transforms.unshift(node.getAttribute('transform'));
      mask.append(svgNode('path',{d:shape.getAttribute('d'),transform:transforms.join(' '),'fill-rule':'evenodd',fill:'black',stroke:'none'}));
    }
    const shade=svgNode('rect',{class:'terrain-outside-shade',mask:'url(#terrain-playable-mask)'});
    scope.append(mask,shade);$('states').before(scope);
    // Keep the mask raster bounded to the visible canvas, also when zooming.
    const sizeScope=()=>{
      const svg=$('map'),rect=svg.getBoundingClientRect(),matrix=svg.getScreenCTM();
      if(!matrix||!rect.width||!rect.height)return;
      const inverse=matrix.inverse(),a=new DOMPoint(rect.left,rect.top).matrixTransform(inverse),b=new DOMPoint(rect.right,rect.bottom).matrixTransform(inverse);
      for(const node of [mask,outside,shade])for(const [key,value] of Object.entries({x:a.x,y:a.y,width:b.x-a.x,height:b.y-a.y}))if(node.getAttribute(key)!==String(value))node.setAttribute(key,value);
    };
    stopTerrainScope=window.ClickMapZoom?.subscribe(sizeScope);sizeScope();
  }
  function buildMapGeometry() {
    if (municipalities || boroughs) {
      $('map').setAttribute('viewBox',regionData.viewBox.join(' '));
      if(boroughs) {
        const [x,y,width,height]=regionData.viewBox;
        $('states').append(svgNode('rect',{x,y,width,height,class:'oslo-map-water','aria-hidden':'true','pointer-events':'none'}));
      }
      const extent=svgNode('clipPath',{id:'municipality-extent',clipPathUnits:'userSpaceOnUse'});
      // Separate clip children form a union even when forests, boroughs and
      // smaller areas overlap. One even-odd path would cancel those overlaps.
      for(const state of states.filter(state=>state.d&&state.kind!=='lake'))extent.append(svgNode('path',{d:state.d,'clip-rule':'evenodd'}));
      $('states').append(extent);
      if(regionData.context) $('states').append(svgNode('path',{d:regionData.context,class:'municipality-context','fill-rule':'evenodd','aria-hidden':'true'}));
      for(const region of regionData.contextRegions||[]) {
        const path=svgNode('path',{d:region.d,class:'municipality-context oslo-context-region','fill-rule':'evenodd'});
        const title=svgNode('title',{});title.textContent=region.n;path.append(title);$('states').append(path);
      }
      if(regionData.forestContext) $('states').append(svgNode('path',{d:regionData.forestContext,class:'oslo-forest-context','fill-rule':'evenodd','aria-hidden':'true','pointer-events':'none'}));
      const areas=states;
      function addArea(state) {
        const el=svgNode('path',{d:state.d,class:'state municipality'+(boroughs?' oslo-'+(state.kind||'land'):''),'fill-rule':'evenodd',role:'button',tabindex:'0','aria-label':shapeLabel});
        el.dataset.state=state.n;el.dataset.code=state.a;el.dataset.kind=state.kind||'land';$('states').append(el);elements.set(state.n,el);
        const box=el.getBBox();centers.set(state.n,{x:state.c[0],y:state.c[1],radius:Math.max(box.width,box.height)/2+10});
      }
      for(const state of areas.filter(state=>state.kind!=='lake'))addArea(state);
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
      const borderPath=regionData.boundaries??states.map(state=>state.d).join(' ');
      for(const layer of ['halo','line'])boundaries.append(svgNode('path',{d:borderPath,class:'municipality-border-'+layer,'vector-effect':'non-scaling-stroke'}));
      $('states').append(boundaries);
      for(const state of areas.filter(state=>state.kind==='lake')) {
        addArea(state);
        if(boroughs && state.islands) {
          // The water target includes its islands; the passive forest overlay
          // keeps land green while letting pointer hits reach the lake below.
          elements.get(state.n).setAttribute('d',state.d+' '+state.islands);
          $('states').append(svgNode('path',{d:state.islands,class:'oslo-lake-islands','fill-rule':'evenodd','aria-hidden':'true','pointer-events':'none'}));
        }
      }
      if(municipalities){
        for(const state of states){const p=cityData[state.n].p;cityPoints.set(state.n,{x:p[0],y:p[1]});}
        buildCityLayer();
      }else{
        $('hintLayer').before(svgNode('g',{id:'statle-study-names','aria-hidden':'true','pointer-events':'none'}));
        namesInput().disabled=false;updateStatleOptions();
      }
      prepareBasemap('../assets/geography/norway-relief.json',undefined,boroughs?'oslo':'county-'+document.body.dataset.county);
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
        stateTransforms.set(state.n,{x:0,y:0,scale:1});
        const box=el.getBBox();centers.set(state.n,{x:state.c[0],y:state.c[1],radius:Math.max(box.width,box.height)/2+10});
        if (state.marker) {
          const g=svgNode('g',{class:'small-marker country-marker',role:'button',tabindex:'0','aria-label':'Ekstra klikkfelt for et lite land'});g.dataset.state=state.n;
          g.append(svgNode('circle',{cx:state.c[0],cy:state.c[1],r:11,class:'hit'}),svgNode('circle',{cx:state.c[0],cy:state.c[1],r:4.5,class:'visible'}));
          $('smallStates').append(g);markers.set(state.n,g);
        }
      }
      if(countryRegion()) {
        for(const state of states){const p=cityData[state.n].p;cityPoints.set(state.n,{x:p[0],y:p[1]});}
        buildCityLayer();prepareBasemap('../assets/geography/region-relief.json',undefined,document.body.dataset.region);
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
    // Fit only the answer shapes. The neighbours follow those transforms without
    // changing state size, hint positions or the separate Alaska/Hawaii insets.
    const context = svgNode('g',{id:'us-context','aria-hidden':'true','pointer-events':'none'});
    const insetBox = (bounds, x, width) => ({x, y:bounds.y - 12, width, height:southEdge + 8 - (bounds.y - 12)});
    const alaskaBox = insetBox(alaska,15,187), hawaiiBox = insetBox(hawaii,210,128);
    const boxPath = b => `M${b.x} ${b.y}h${b.width}v${b.height}h${-b.width}Z`;
    const mainClip = svgNode('clipPath',{id:'us-main-context-clip',clipPathUnits:'userSpaceOnUse'});
    // Let neighbours continue into the SVG's letterboxed margins; cutting at
    // the viewBox would turn northern Canada into a straight artificial coast.
    mainClip.append(svgNode('path',{d:boxPath({x:-2000,y:-2000,width:4000,height:4000})+boxPath(alaskaBox)+boxPath(hawaiiBox),'clip-rule':'evenodd'}));
    const alaskaClip = svgNode('clipPath',{id:'us-alaska-context-clip',clipPathUnits:'userSpaceOnUse'});
    alaskaClip.append(svgNode('rect',alaskaBox));
    context.append(mainClip,alaskaClip);
    for (const area of ['main','AK']) {
      const clipped = svgNode('g',{'clip-path':`url(#us-${area==='main'?'main':'alaska'}-context-clip)`});
      const projected = svgNode('g',{transform:groups[area].getAttribute('transform')});
      for (const country of usContext.areas[area]) projected.append(svgNode('path',{
        d:country.d,class:'map-context','fill-rule':'evenodd','data-country':country.n,'data-area':area
      }));
      clipped.append(projected);context.append(clipped);
    }
    $('states').prepend(context);
    if(statle)prepareBasemap('../assets/geography/us-relief-raster.json',Object.fromEntries(Object.entries(groups).map(([area,group])=>[area,group.transform.baseVal.consolidate().matrix])));
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
    const label = answerName(name);
    const c = citiesMode ? cityPoints.get(name) : centers.get(name), unit = 1 / ($('map').getScreenCTM()?.a || 1), width = Math.max(70, label.length * 7 + 22) * unit;
    const view = $('map').viewBox.baseVal;
    const x = Math.max(view.x + width / 2 + 9 * unit, Math.min(view.x + view.width - 9 * unit - width / 2, c.x));
    const y = Math.max(view.y + 26 * unit, Math.min(view.y + view.height - 25 * unit, c.y - 21 * unit));
    const g = svgNode('g', {class:'flash-label ' + kind});
    g.append(svgNode('rect', {x:x - width / 2,y:y - 13 * unit,width,height:26 * unit,rx:4 * unit,'vector-effect':'non-scaling-stroke',style:`filter:drop-shadow(0 ${2 * unit}px ${3 * unit}px #26453c45)`}));
    const text = svgNode('text', {x,y:y + unit,style:`font-size:${12 * unit}px`}); text.textContent = label; g.append(text);
    $('labelLayer').replaceChildren(g);
    later(() => g.remove(), duration);
  }
  function prepareBasemap(url,transforms,region) {
    document.querySelector('.statle-basemap-tools')?.remove();
    if(!basemap)basemap=MapBasemap.create({svg:$('map'),viewport:$('mapViewport')});
    const tools=document.createElement('div');tools.className='statle-basemap-tools';
    const button=document.createElement('button');button.type='button';button.id='statle-basemap';
    const initialLabel=window.QuizLanguage?.translate('Vis fysisk kart')||'Vis fysisk kart';button.title=initialLabel;button.setAttribute('aria-label',initialLabel);button.setAttribute('aria-pressed','false');
    button.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m2 20 7-14 4 7 3-5 6 12H2Zm4-8 3 2 3-2M13 13l3 2 2-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    tools.append(button);$('mapViewport').append(tools);
    let loaded=false;const token=mapGeneration;
    button.addEventListener('click',async()=>{
      button.disabled=true;button.setAttribute('aria-busy','true');
      try {
        if(!loaded) {
          const data=await readMap(url);if(token!==mapGeneration)return;
          const manifest=region?data.regions[region]:data;
          if(!await basemap.set(manifest,{baseUrl:new URL('../assets/geography/',document.baseURI).href,transforms}))return;
          if(token!==mapGeneration)return;loaded=true;
        }
        const visible=document.body.dataset.statleBasemap!=='physical';
        basemap.show(visible);document.body.dataset.statleBasemap=visible?'physical':'original';
        const rawLabel=visible?'Vis originalkart':'Vis fysisk kart',label=window.QuizLanguage?.translate(rawLabel)||rawLabel;button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(visible));
      }catch(_){if(token===mapGeneration)setFeedback('Kartet kunne ikke lastes','error');}
      finally{button.disabled=false;button.removeAttribute('aria-busy');}
    });
  }
  function showHint() {
    if(physical){const el=elements.get(target().n);el.classList.add('hinted');later(()=>el.classList.remove('hinted'),1800);return;}
    const c = citiesMode ? cityPoints.get(target().n) : centers.get(target().n), radius = citiesMode ? 22 : Math.max(25, Math.min(120, c.radius));
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
  function setPhase(value){
    phase=value;document.body.dataset.phase=value;
    if(value!=='playing'){questionSymbol.hidden=true;questionSymbol.removeAttribute('src');}
    $('targetName').toggleAttribute('data-no-translate',enhanced()&&citiesMode&&value==='playing');
    if(statle||kart||localMap){if(value==='ready'&&enhanced())$('targetName').after($('targetVerb'));else questionSymbol.before($('targetVerb'));}
  }
  function prompt(){const action=retrying?'Øvingsrunde · klikk på':'Klikk på';$('targetVerb').textContent=boroughs&&target()?.category==='postal-area'?'Postområde · '+action.toLowerCase():action;const subtitle=$('target-continent');if(subtitle){subtitle.hidden=!continentPractice;subtitle.textContent=continentPractice?continentNames[target()?.continent]||'':'';}}
  function next() {
    index++; locked = false; roundMistakes = 0; roundTime = 0;
    $('hintLayer').replaceChildren(); $('labelLayer').replaceChildren();
    elements.forEach(el => el.classList.remove('correct', 'wrong', 'hinted'));
    if (!target()) return finish();
    if(!practice)window.GeoOnline?.statleNext();
    renderQuestion();
    prompt();setFeedback('');
  }
  function choose(name) {
    if (phase === 'ready' || phase === 'finished') {flashLabel(name,'',2800);setFeedback(answerName(name));return;}
    if (phase !== 'playing' || locked || !target()) return;
    tick();
    if (results.has(name) || mastered.has(name)) { flashLabel(name, ''); setFeedback(answerName(name) + ' er allerede fullført.'); return; }
    if(!practice)window.GeoOnline?.statleAnswer(name);
    if (name !== target().n) {
      roundMistakes++; mistakes++; updateStats();
      const el = elements.get(name); el.classList.add('wrong');
      flashLabel(name, 'error');
      later(() => el.classList.remove('wrong'), 1050);
      if (roundMistakes >= 3) showHint();
      setFeedback('Det var ' + answerName(name) + '.', 'error');
      return;
    }
    // Colour depends only on attempts; the clock is informational.
    const band = Math.min(roundMistakes, 3);
    results.set(name, {band, ms:roundTime, mistakes:roundMistakes});
    setBand(name, band); locked = true;
    $('hintLayer').replaceChildren();
    elements.get(name).classList.add('correct'); flashLabel(name, '');
    setFeedback('Riktig! ' + answerName(name) + ' · ' + (roundTime / 1000).toFixed(1).replace('.', ',') + ' s', 'good');
    updateStats(); later(next, 650);
  }
  function start(){retrying=false;mastered.clear();if(enhanced()){advancedInputs().forEach(input=>input.disabled=true);namesInput().disabled=true;$('start').disabled=true;$('restart').disabled=false;}document.querySelectorAll('[name="water-category"]').forEach(input=>input.disabled=true);continentPractice=!!$('continent-practice')?.checked&&['rivers','lakes','mountains'].includes(document.body.dataset.region);practice=continentPractice;document.body.dataset.practice=String(practice);if($('continent-practice'))$('continent-practice').disabled=true;if(practice){window.GeoOnline?.resetStatle();return begin();}if(window.GeoOnline)return GeoOnline.startStatle(begin);return begin();}
  function begin(names) {
    generation++; clearEffects();if($('statle-score'))$('statle-score').hidden=true;
    results = new Map(); index = 0; totalTime = 0; roundTime = 0; lastTick = performance.now();
    roundMistakes = 0; mistakes = 0; locked = false;
    repeatOffer.hidden = true; repeatButton.disabled = false; document.body.dataset.retry = String(retrying);
    elements.forEach((el,name) => { delete el.dataset.band; el.classList.remove('found'); el.classList.toggle('mastered',retrying&&mastered.has(name));el.classList.toggle('retry-pending',retrying&&!mastered.has(name));el.setAttribute('aria-label', mastered.has(name) ? name + ' – fullført' : shapeLabel); });
    markers.forEach((el,name) => { delete el.dataset.band;el.classList.toggle('mastered',retrying&&mastered.has(name));el.classList.toggle('retry-pending',retrying&&!mastered.has(name)); el.setAttribute('aria-label', mastered.has(name) ? name + ' – fullført' : boroughs ? 'Sted på kartet' : counties ? 'Ekstra klikkfelt for et lite fylke' : kart ? 'Ekstra klikkfelt for et lite land' : 'Ekstra klikkfelt for en liten delstat'); });
    queue = names ? names.map(name=>states.find(s=>s.n===name)) : states.filter(s => !mastered.has(s.n));
    if(!names)for (let i = queue.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [queue[i],queue[j]] = [queue[j],queue[i]]; }
    if(continentPractice)queue.sort((a,b)=>continentOrder.indexOf(a.continent)-continentOrder.indexOf(b.continent));
    ($('total-count')||$('completed').parentElement.querySelector('small')).textContent=' / '+queue.length;
    setPhase('playing'); $('overlay').hidden = true;if(enhanced())drawStudyNames();if($('water-options'))$('water-options').hidden=true;
    if($('continent-practice-option'))$('continent-practice-option').hidden=true;
    $('mapViewport').scrollTo({left:0,top:0});
    prompt();
    renderQuestion(); $('elapsed').textContent = '00:00';
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
    $('targetName').textContent = boroughs ? 'Alle stedene er fullført.' : municipalities ? (citiesMode?'Alle kommunesentrene er på plass.':'Alle kommunene er på plass.') : physical ? 'Alle stedene er fullført.' : counties ? 'Alle fylkene er på plass.' : kart ? (citiesMode?'Alle hovedstedene er på plass.':'Alle landene er på plass.') : 'Hele USA er på plass.';
    const counts = [0,0,0,0]; results.forEach(r => counts[r.band]++);
    results.forEach((r,name) => { if(r.band === 0)mastered.add(name); });
    repeatOffer.hidden = mastered.size === states.length;
    if(retrying)$('targetName').textContent=repeatOffer.hidden?'Alle er grønne!':'Øvingsrunden er fullført.';
    setFeedback(municipalities ? '' : 'Alle ' + queue.length + ' fullført · ' + timeText(totalTime) + ' · ' + mistakes + ' feil. Grønn: ' + counts[0] + ', gul: ' + counts[1] + ', oransje: ' + counts[2] + ', rød: ' + counts[3] + '.');
    if(!repeatOffer.hidden)repeatOffer.scrollIntoView({block:'nearest'});
  }
  function clickedName(event,element){
    if(boroughs&&event.isTrusted) {
      // A click in a smaller area also belongs to its containing borough.
      // Resolve this geometrically, so Bygdøy never makes Frogner impossible.
      const current=phase==='playing'&&!locked?elements.get(target()?.n):null;
      if(current?.tagName.toLowerCase()==='path') {
        const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(current.getScreenCTM().inverse());
        if(current.isPointInFill(point))return target().n;
      }
    }
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
  function cancelStatle() {
    generation++; clearEffects(); window.GeoOnline?.resetStatle();
    mastered.clear(); results.clear(); queue=[]; index=0; retrying=false; locked=false;
    practice=false; totalTime=0; roundTime=0; mistakes=0; roundMistakes=0;
    document.body.dataset.practice='false';delete document.body.dataset.retry;
    elements.forEach(el=>{delete el.dataset.band;el.classList.remove('found','mastered','retry-pending');el.setAttribute('aria-label',shapeLabel);});
    markers.forEach(el=>{delete el.dataset.band;el.classList.remove('mastered','retry-pending');el.setAttribute('aria-label',statle?'Ekstra klikkfelt for en liten delstat':'Ekstra klikkfelt for et lite land');});
    setPhase('ready');repeatOffer.hidden=true;$('overlay').hidden=false;
    $('statle-score').hidden=true;$('restart').disabled=true;$('start').disabled=false;
    advancedInputs().forEach(input=>input.disabled=false);if(namesInput())namesInput().disabled=false;
    $('targetVerb').textContent='Kan du plassere alle?';$('elapsed').textContent='00:00';
    updateStatleOptions();updateStats();setFeedback('');
  }
  $('restart').addEventListener('click',()=>enhanced()?cancelStatle():start());
  const studyLayouts=new Map();
  let localPreviewTimer=0;
  function drawStudyNames() {
    if(!enhanced())return;
    const layer=$('statle-study-names');if(!layer)return;layer.replaceChildren();
    if(phase!=='ready'||!showNames())return;
    const view=$('map').viewBox.baseVal,matrix=$('map').getScreenCTM(),rect=$('map').getBoundingClientRect(),localFont=10/(matrix?.a||1);
    let localView=[view.x,view.y,view.width,view.height];
    if(localMap&&matrix&&rect.width&&rect.height){
      const inverse=matrix.inverse(),a=new DOMPoint(rect.left,rect.top).matrixTransform(inverse),b=new DOMPoint(rect.right,rect.bottom).matrixTransform(inverse);
      localView=[a.x,a.y,b.x-a.x,b.y-a.y];
    }
    const key=(document.body.dataset.region||'statle')+'|'+citiesMode+'|'+(window.QuizLanguage?.language||'no')+(localMap?'|'+localView.map(n=>n.toFixed(2)).join(',')+'|'+localFont.toFixed(3):'');
    if(!studyLayouts.has(key)) {
      const project=(state,p)=>{const t=stateTransforms.get(state.n);return [p[0]*t.scale+t.x,p[1]*t.scale+t.y];};
      const cities=citiesMode?new Map(states.map(state=>[state.n,{name:municipalities?displayCityName(state):window.QuizLanguage?.translate(displayCityName(state))||displayCityName(state),...cityPoints.get(state.n),...(municipalities?{locations:cityData[state.n].locations}:{} )}])):null;
      const callouts=new Map();
      markers.forEach((marker,name)=>{const dot=marker.querySelector('.visible');callouts.set(name,{x:dot.cx.baseVal.value-17,y:dot.cy.baseVal.value,anchor:'end'});});
      const canvas=document.createElement('canvas'),context=canvas.getContext('2d'),widths=new Map();
      const measure=(text,size,kind)=>{const id=kind+'|'+size+'|'+text;if(!widths.has(id)){context.font=(kind==='state'?'700':'600')+' '+size+'px Inter,"Segoe UI",sans-serif';widths.set(id,context.measureText(text).width);}return widths.get(id);};
      measure.metrics=(size,kind)=>{context.font=(kind==='state'?'700':'600')+' '+size+'px Inter,"Segoe UI",sans-serif';const metrics=context.measureText('Mg');return{fontBoundingBoxAscent:metrics.fontBoundingBoxAscent??size*1.05,fontBoundingBoxDescent:metrics.fontBoundingBoxDescent??size*.3};};
      if(localMap&&studyLayouts.size>24)studyLayouts.clear();
      studyLayouts.set(key,localMap?LocalLabelLayout.layout({states,viewBox:localView,measure,fontSize:localFont,cities}):statle?StatleLabelLayout.layout({states,project,cities,callouts,measure,fontSize:7.7,cityFontSize:7,dotRadius:4.5,bounds:{x:8,y:8,w:884,h:534}}):RegionLabelLayout.layout({states,capitalData:cityData,showCapitals:citiesMode,measure,countryName:name=>window.QuizLanguage?.translate(name)||name,capitalName:(name,row)=>window.QuizLanguage?.language==='en'?row.en||name:name,dotRadius:4.5,bounds:{x:6,y:6,w:888,h:638}}));
    }
    const result=studyLayouts.get(key);
    layer.dataset.layoutIssues=JSON.stringify(result.issues);
    for(const label of [...result.stateLabels,...result.cityLabels]) {
      if(label.leader&&(localMap||countryRegion()||label.kind==='city'||label.state==='Hawaii')) {
        const p=label.leader,d=`M${p.x1} ${p.y1}L${p.x2} ${p.y2}`;
        const stroke=localMap?{'vector-effect':'non-scaling-stroke'}:{};
        layer.append(svgNode('path',{d,class:'study-city-leader-halo',...stroke}),svgNode('path',{d,class:label.kind==='city'?'study-city-leader':'study-state-leader',...stroke}));
      }
      const text=svgNode('text',{x:label.x,y:label.y,class:'study-name study-'+label.kind,'text-anchor':label.anchor||'middle','font-size':label.fontSize,'data-label-state':label.state,'data-label-box':JSON.stringify(label.box),'data-no-translate':''});
      if(localMap){text.setAttribute('vector-effect','non-scaling-stroke');text.style.strokeWidth='1.2px';}
      label.lines.forEach((line,i)=>{const span=svgNode('tspan',{x:label.x,dy:i?'1.12em':'0'});span.textContent=line;text.append(span);});
      layer.append(text);
    }
  }
  function buildCityLayer() {
    const layer=svgNode('g',{id:'statle-city-points'}),names=svgNode('g',{id:'statle-study-names','aria-hidden':'true','pointer-events':'none'});
    const locations=states.flatMap(state=>municipalities&&cityData[state.n].locations?.length?cityData[state.n].locations.map(place=>({state,name:place.name,x:place.p[0],y:place.p[1]})):[{state,...cityPoints.get(state.n)}]);
    for(const c of locations){
      const state=c.state,point=svgNode('g',{class:'city-point',...(statle?{'aria-hidden':'true','pointer-events':'none'}:{role:'button',tabindex:'0','aria-label':municipalities?'Kommunesenter på kartet':'Hovedstad på kartet'})});
      const nearest=Math.min(...locations.filter(other=>other!==c).map(p=>Math.hypot(p.x-c.x,p.y-c.y)));
      point.dataset.state=state.n;
      if(c.name)point.dataset.centre=c.name;
      if(!statle)point.append(svgNode('circle',{cx:c.x,cy:c.y,r:Math.max(.05,Math.min(6,nearest*.4)),class:'city-hit'}));
      point.append(svgNode('circle',{cx:c.x,cy:c.y,r:Math.max(.05,Math.min(2.6,nearest*.32)),class:'city-dot','vector-effect':'non-scaling-stroke'}));layer.append(point);
    }
    $('hintLayer').before(names,layer);scaleLocalCityPoints();updateStatleOptions();advancedInputs().forEach(input=>input.disabled=false);namesInput().disabled=false;
  }
  function scaleLocalCityPoints(){
    if(!municipalities||!cityPoints.size)return;
    const scale=$('map').getScreenCTM()?.a||1;
    if(cityMarkerScale===String(scale))return;cityMarkerScale=String(scale);
    const points=[...($('statle-city-points')?.children||[])].map(point=>{const dot=point.querySelector('.city-dot');return{point,x:dot.cx.baseVal.value,y:dot.cy.baseVal.value};});
    for(const c of points){
      const point=c.point,nearest=Math.min(...points.filter(other=>other!==c).map(p=>Math.hypot(p.x-c.x,p.y-c.y)));
      point.querySelector('.city-hit').setAttribute('r',Math.max(.05,Math.min(11/scale,nearest*.4)));
      point.querySelector('.city-dot').setAttribute('r',Math.max(.05,Math.min(3/scale,nearest*.32)));
    }
  }
  function updateStatleOptions() {
    if(!enhanced())return;
    citiesMode=!!advancedInput()?.checked||!!capitalsInput()?.checked;
    if(statle){
      const nextData=capitalsInput()?.checked?stateCapitals:largestCities;
      if(nextData&&nextData!==cityData){
        cityData=nextData;studyLayouts.clear();
        for(const state of states){const t=stateTransforms.get(state.n),p=cityData[state.n].p;if(t)cityPoints.set(state.n,{x:p[0]*t.scale+t.x,y:p[1]*t.scale+t.y});}
        for(const point of $('statle-city-points')?.children||[]){const c=cityPoints.get(point.dataset.state);if(c)for(const circle of point.querySelectorAll('circle')){circle.setAttribute('cx',c.x);circle.setAttribute('cy',c.y);}}
      }
    }
    const variant=municipalities?'municipalityQuestionMode':statle?'statleVariant':'kartVariant';
    if(citiesMode)document.body.dataset[variant]=municipalities?'centres':statle?(capitalsInput()?.checked?'capitals':'largest-city'):'capitals';else delete document.body.dataset[variant];
    $('start').textContent=statle?'Start Statle →':'Start →';
    if(phase==='ready')$('targetName').textContent=statle?'USAs 50 delstater':regionData.title;
    $('statle-city-points')?.toggleAttribute('hidden',!citiesMode);
    $('statle-city-points')?.setAttribute('aria-hidden',String(!citiesMode));
    if(!statle)for(const point of $('statle-city-points')?.children||[])point.setAttribute('tabindex',citiesMode?'0':'-1');
    drawStudyNames();
  }
  for(const input of [...advancedInputs(),namesInput()])input?.addEventListener('change',()=>{if(statle&&input.checked&&advancedInputs().includes(input))advancedInputs().forEach(other=>{if(other!==input)other.checked=false;});window.GeoOnline?.resetStatle();updateStatleOptions();});
  if(localMap)window.ClickMapZoom?.subscribe(()=>{
    scaleLocalCityPoints();
    clearTimeout(localPreviewTimer);
    if(phase==='ready'&&showNames())localPreviewTimer=setTimeout(drawStudyNames,125);
  });
  addEventListener('quiz-language-change',()=>{if(enhanced()){drawStudyNames();if(phase==='ready')setFeedback('');const button=$('statle-basemap');if(button){const label=window.QuizLanguage.translate(document.body.dataset.statleBasemap==='physical'?'Vis originalkart':'Vis fysisk kart');button.title=label;button.setAttribute('aria-label',label);}}});
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
    if(label==='◐')button.dataset.languageAnchor='';
  }
  menu.append(menuTools);
  const menuBack=document.createElement('a');menuBack.className='geo-menu-back';menuBack.href='../geografi.html';menuBack.textContent='←';menuBack.setAttribute('aria-label','Tilbake til geografi');menu.append(menuBack);
  menu.addEventListener('close', () => { menuButton.setAttribute('aria-expanded', 'false');$('kart-menu-button')?.setAttribute('aria-expanded','false');menuOpener.focus(); });
  menu.addEventListener('click', event => {
    const box = menu.getBoundingClientRect();
    if (event.target === menu && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) menu.close();
  });
  function resetMap() {
    clearTimeout(localPreviewTimer);
    basemap?.clear();document.body.dataset.statleBasemap='original';document.querySelector('.statle-basemap-tools')?.remove();
    $('statle-city-points')?.remove();$('statle-study-names')?.remove();cityPoints.clear();stateTransforms.clear();studyLayouts.clear();
    citiesMode=false;cityData=null;cityMarkerScale='';delete document.body.dataset.kartVariant;delete document.body.dataset.municipalityQuestionMode;
    mastered.clear();retrying=false;continentPractice=false;repeatOffer.hidden=true;delete document.body.dataset.retry;
    generation++;clearEffects();elements.clear();markers.clear();centers.clear();
    clearTerrainScope();$('states').replaceChildren();$('smallStates').replaceChildren();$('insetSeparators').setAttribute('d','');
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
  if(boroughs) {
    shapeLabel='Sted på kartet';document.body.dataset.region='bydeler';
    readMap('../assets/geography/oslo-bydeler/oslo.json').then(data=>{
      if(data.ruleset!=='oslo-areas-v5'||!Array.isArray(data.states)||data.states.length!==43||new Set(data.states.map(state=>state.n)).size!==data.states.length||data.states.some(state=>!state.d||state.marker||!['land','forest','lake'].includes(state.kind))||!data.states.some(state=>state.n==='Sentrum'))throw Error('Ufullstendig kart');
      regionData=data;states=data.states;total=states.length;
      $('targetName').textContent=data.title||'Oslo';$('total-count').textContent=' / '+total;
      $('map').setAttribute('aria-label','Klikkbart kart over Oslo og nærområdene');
      buildMap();updateStats();window.ClickMapZoom?.setBase(data.camera);window.dispatchEvent(new Event('resize'));
      $('targetVerb').textContent='Kan du plassere alle?';
      $('start').disabled=false;$('start').textContent='Start →';
    }).catch(()=>{$('start').textContent='Kartet kunne ikke lastes';setFeedback('Last siden på nytt for å prøve igjen.','error');});
    setPhase('ready');return;
  }
  if(municipalities) {
    let municipalityIndex;
    const maps=new Map();
    async function selectMunicipalityCounty(code) {
      const county=municipalityIndex?.counties.find(county=>county.code===code);
      if(!county)return;
      const token=++mapGeneration;window.GeoOnline?.resetStatle();resetMap();shapeLabel='Kommune på kartet';
      document.body.dataset.county=code;document.body.dataset.region='kommuner-'+code;
      if(county.variant)document.body.dataset.municipalityVariant=county.variant;
      else delete document.body.dataset.municipalityVariant;
      $('municipality-selection').hidden=true;$('kart-game').hidden=false;
      namesInput().checked=false;namesInput().disabled=true;
      advancedInput().checked=false;advancedInput().disabled=true;
      $('targetVerb').textContent='Kan du plassere alle?';$('targetName').textContent=county.quizTitle||county.name;
      $('start').textContent='Laster kart …';setFeedback('');
      const url=new URL(location.href);url.searchParams.set('fylke',code);history.replaceState(null,'',url);
      try {
        if(!maps.has(code))maps.set(code,readMap('../assets/geography/municipalities/'+county.file+'?v='+encodeURIComponent(county.revision||municipalityIndex.version||'1')).catch(error=>{maps.delete(code);throw error;}));
        if(!municipalityCentres)municipalityCentres=readMap('../assets/geography/municipality-centres.json').catch(error=>{municipalityCentres=null;throw error;});
        const [data,centreAtlas]=await Promise.all([maps.get(code),municipalityCentres]);if(token!==mapGeneration)return;
        if(!data.states?.length||new Set(data.states.map(state=>state.n)).size!==data.states.length||data.variant!==county.variant)throw Error('Ufullstendig kart');
        const centres=centreAtlas.regions['county-'+code]?.centres;
        if(!centres||data.states.some(state=>!centres[state.n]?.name||!Array.isArray(centres[state.n].p)||centres[state.n].p.length!==2||!centres[state.n].p.every(Number.isFinite)))throw Error('Ufullstendige kommunesentre');
        cityData=centres;
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
      event.preventDefault();++mapGeneration;window.GeoOnline?.resetStatle();resetMap();$('kart-game').hidden=true;
      $('municipality-selection').hidden=false;delete document.body.dataset.county;delete document.body.dataset.region;delete document.body.dataset.municipalityVariant;
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
    panel.style.removeProperty('top');panel.style.removeProperty('left');panel.style.removeProperty('bottom');const token=++mapGeneration;window.GeoOnline?.resetStatle();resetMap();document.body.dataset.region=region;counties=region==='fylker';physical=['rivers','lakes','seas','mountains'].includes(region);document.body.dataset.physical=String(physical);document.body.dataset.countryRegion=String(countryRegions.has(region));shapeLabel=physical?'Sted på kartet':counties?'Fylke på kartet':'Land på kartet';
    $('kart-selection').hidden=true;$('kart-game').hidden=false;$('targetName').textContent=titles[region];$('targetVerb').textContent=countryRegion()?'Kan du plassere alle?':'Klar for en runde?';$('start').textContent='Laster kart …';setFeedback('Laster kart …');
    for(const id of ['region-capital-option','region-names-option'])$(id).hidden=!countryRegion();

    if(countryRegion()){advancedInput().disabled=true;namesInput().disabled=true;}
    const url=new URL(location.href);url.searchParams.set('region',region);history.replaceState(null,'',url);
    try {
      if(counties){countyMap||=readMap('../assets/geography/norway-counties.json').catch(error=>{countyMap=null;throw error;});const data=await countyMap;if(token!==mapGeneration)return;states=data;regionData=null;}
      else if(physical){
        let data;if(['rivers','lakes','seas'].includes(region)){worldWater||=readMap('../assets/geography/physical-maps/world-water.json').catch(e=>{worldWater=null;throw e;});data=await worldWater;}
        else{mountainEurope||=readMap('../assets/geography/physical-maps/mountain-europe.json').catch(e=>{mountainEurope=null;throw e;});data=await mountainEurope;}
        if(token!==mapGeneration)return;regionData={...data.regions[region],background:(data.regions[region].background||data.background).concat(data.regions[region].extraLand||[])};states=regionData.states.filter(s=>region!=='seas'||waterCategories().includes(s.group));document.body.dataset.waterCategories=waterCategories().join(',');
        if(window.GEO_QUIZ_EN)for(const state of states)if(state.en)window.GEO_QUIZ_EN.names[state.n]=state.en;
      }else {continents||=readMap('../assets/geography/continent-maps.json').catch(error=>{continents=null;throw error;});const data=await continents;if(token!==mapGeneration)return;regionData=data.regions[region];states=regionData.states;regionalCapitals||=readMap('../assets/geography/region-capitals.json').catch(error=>{regionalCapitals=null;throw error;});const capitals=await regionalCapitals;if(token!==mapGeneration)return;cityData=capitals.regions[region].capitals;if(window.GEO_QUIZ_EN)for(const capital of Object.values(cityData))if(capital.en)window.GEO_QUIZ_EN.names[capital.name]=capital.en;}
      if(token!==mapGeneration)return;total=states.length;
      if(new Set(states.map(s=>s.n)).size!==total)throw Error('Ufullstendig kart');
      if(countryRegion()&&states.some(state=>!cityData[state.n]?.name||cityData[state.n].p?.length!==2))throw Error('Ufullstendige hovedsteder');
      $('total-count').textContent=' / '+total;$('map').setAttribute('aria-label',counties?'Klikkbart kart over Norges 15 fylker':'Klikkbart kart over '+titles[region]);
      document.querySelector('.map-credit').hidden=counties||physical;document.querySelector('.county-credit').hidden=!counties;document.querySelector('.physical-credit').hidden=!physical;if($('river-credit'))$('river-credit').hidden=region!=='rivers';
      $('water-options').hidden=region!=='seas';$('continent-practice-option').hidden=!['rivers','lakes','mountains'].includes(region);$('mistakes-label').textContent=window.QuizLanguage?.language==='en'?'Mistakes':'Feil';
      for(const id of ['region-capital-option','region-names-option'])$(id).hidden=!countryRegion();
      $('restart').textContent=countryRegion()?'Avbryt':'↻ Ny runde';$('restart').setAttribute('aria-label',countryRegion()?'Avbryt':'Start en ny runde');
      if(countryRegion()){advancedInput().checked=false;namesInput().checked=false;}setPhase('ready');
      updateStats();
      $('map').setAttribute('preserveAspectRatio',physical&&innerWidth>700?'none':'xMidYMid meet');buildMap();window.ClickMapZoom?.setBase();window.dispatchEvent(new Event('resize'));$('statle-top-ten').disabled=!total;$('start').disabled=!total;$('start').textContent=total?'Start →':'Velg minst én kategori';setFeedback('');
    }catch(_){if(token!==mapGeneration)return;$('start').textContent='Kartet kunne ikke lastes';setFeedback('Velg kart på nytt for å prøve igjen.','error');}
  }
  if(kart){
    document.querySelectorAll('[data-map-region]').forEach(button=>button.addEventListener('click',()=>selectMap(button.dataset.mapRegion)));
    $('kart-back').addEventListener('click',event=>{event.preventDefault();++mapGeneration;window.GeoOnline?.resetStatle();resetMap();$('kart-game').hidden=true;$('kart-selection').hidden=false;delete document.body.dataset.region;delete document.body.dataset.physical;delete document.body.dataset.countryRegion;delete document.body.dataset.kartVariant;const url=new URL(location.href);url.searchParams.delete('region');history.replaceState(null,'',url);document.querySelector('#kart-selection h1')?.focus();});
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
  const contextData = counties ? Promise.resolve(null) : fetch('../assets/geography/us-context.json').then(response => {
    if (!response.ok) throw new Error('Nabokartet kunne ikke hentes'); return response.json();
  });
  const citiesData = statle ? readMap('../assets/geography/us-largest-cities.json') : Promise.resolve(null);
  const capitalsData = statle ? readMap('../assets/geography/us-capitals.json') : Promise.resolve(null);
  Promise.all([mapData, contextData, citiesData,capitalsData]).then(([data, context, cities,capitals]) => {
    usContext = context;
    largestCities=cities;stateCapitals=capitals;cityData = cities;
    states = data;
    if (states.length !== total || new Set(states.map(s=>s.n)).size !== total) throw new Error('Ufullstendig kart');
    if(statle&&states.some(state=>[largestCities,stateCapitals].some(dataset=>!dataset[state.n]?.name||dataset[state.n].p?.length!==2)))throw Error('Ufullstendige byer');
    buildMap();
    if(statle) {
      buildCityLayer();
    }
    window.ClickMapZoom?.setBase(); $('start').disabled = false; if(!statle)$('start').textContent = counties ? 'Start Norske fylker →' : 'Start Statle →';
  }).catch(() => { $('start').textContent = 'Kartet kunne ikke lastes'; setFeedback('Last siden på nytt for å hente kartet.','error'); });
})();
