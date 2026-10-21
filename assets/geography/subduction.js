/* An illustrative sequence, not a thermal, mechanical or earthquake forecast. */
(function () {
  'use strict';
  const root = document.getElementById('subduction-lab');
  if (!root) return;
  const section = root.closest('.page-section');
  const $ = selector => root.querySelector(selector);
  const svg = $('#sd-diagram');
  const slider = $('#sd-progress');
  const play = $('#sd-play');
  const labels = $('#sd-labels');
  const quakes = $('#sd-quakes');
  const fluids = $('#sd-fluids');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const ramp = (value, start, end) => clamp((value - start) / (end - start));
  const fmt = value => value.toFixed(1);
  let progress = 0;
  let topic = 'trench';
  let stageIndex = -1;
  let playing = false;
  let frame = null;
  let lastTime = null;

  svg.insertAdjacentHTML('beforeend', `
    <defs>
      <linearGradient id="sd-sky" x2="0" y2="1"><stop stop-color="#112633"/><stop offset="1" stop-color="#203d49"/></linearGradient>
      <linearGradient id="sd-sea" x2="0" y2="1"><stop stop-color="#307c98"/><stop offset="1" stop-color="#183e56"/></linearGradient>
      <linearGradient id="sd-mantle" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#41363c"/><stop offset="1" stop-color="#6b4541"/></linearGradient>
      <linearGradient id="sd-slab-fill" x2="0" y2="1"><stop stop-color="#467e86"/><stop offset="1" stop-color="#2e555f"/></linearGradient>
      <linearGradient id="sd-crust-fill" x2="0" y2="1"><stop stop-color="#cea477"/><stop offset="1" stop-color="#a8785b"/></linearGradient>
      <radialGradient id="sd-melt-glow"><stop stop-color="#ffc06c" stop-opacity=".9"/><stop offset=".55" stop-color="#f7834d" stop-opacity=".6"/><stop offset="1" stop-color="#e46c43" stop-opacity="0"/></radialGradient>
      <pattern id="sd-mantle-pattern" width="70" height="44" patternUnits="userSpaceOnUse"><path d="M5 30q14-8 28 0m16-20 8-2" fill="none" stroke="#e8b7a3" stroke-width="1" opacity=".09"/></pattern>
      <pattern id="sd-crust-pattern" width="45" height="17" patternUnits="userSpaceOnUse"><path d="M0 12h20m8-7h17" stroke="#5b4b45" stroke-width="1.4" opacity=".16"/></pattern>
      <marker id="sd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="m0 0 10 5-10 5z" fill="#d3efe4"/></marker>
      <marker id="sd-water-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="m0 0 10 5-10 5z" fill="#76d9fc"/></marker>
      <marker id="sd-magma-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="m0 0 10 5-10 5z" fill="#ffae66"/></marker>
      <clipPath id="sd-slab-clip"><path id="sd-slab-mask"/></clipPath>
    </defs>
    <g aria-hidden="true">
      <rect width="1000" height="600" fill="url(#sd-sky)"/>
      <g fill="none" stroke="#79a2ae" stroke-width="1" opacity=".08"><path d="M0 70q250-70 500 0t500 0M0 110q250-70 500 0t500 0M0 150q250-70 500 0t500 0"/></g>
      <path d="M-50 230H1050V650H-50Z" fill="url(#sd-mantle)"/>
      <path d="M-50 230H1050V650H-50Z" fill="url(#sd-mantle-pattern)"/>
      <path d="M-50 174H520V246H-50Z" fill="url(#sd-sea)"/>
      <path d="M-30 174q22-5 44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0" fill="none" stroke="#89cfdd" stroke-width="2" opacity=".65"/>
      <g id="sd-melt-zone"><ellipse cx="635" cy="322" rx="87" ry="51" fill="url(#sd-melt-glow)"/><path d="M580 326q35-55 103-17-13 36-80 25Z" fill="#f69a5d" opacity=".28"/><g fill="#ffc27f"><ellipse cx="605" cy="317" rx="4" ry="7"/><ellipse cx="624" cy="329" rx="3" ry="6"/><ellipse cx="645" cy="311" rx="4" ry="7"/><ellipse cx="666" cy="322" rx="3" ry="5"/></g></g>
      <path id="sd-back-range" fill="#56746c" opacity=".7"/>
      <path id="sd-slab-body" fill="url(#sd-slab-fill)" stroke="#80b7b6" stroke-width="1.3"/>
      <path id="sd-slab-crust" fill="#77bfb6"/>
      <g id="sd-tracers" clip-path="url(#sd-slab-clip)" stroke="#a4d9cd" stroke-width="3" opacity=".45"></g>
      <path id="sd-continental-mantle" fill="#7b6254" stroke="#9e7c62" stroke-width="1"/>
      <path id="sd-continental-crust" fill="url(#sd-crust-fill)"/>
      <path id="sd-crust-texture" fill="url(#sd-crust-pattern)"/>
      <path id="sd-surface" fill="none" stroke="#b6c99a" stroke-width="4" stroke-linejoin="round"/>
      <path id="sd-folds" fill="none" stroke="#ead0a2" stroke-width="2" opacity=".5"/>
      <g id="sd-magma-path"><path id="sd-magma-halo" fill="none" stroke="#d96c49" stroke-width="17" opacity=".3"/><path id="sd-magma-conduit" fill="none" stroke="#ff9556" stroke-width="6" stroke-linecap="round"/><path d="M636 310q-14-48 10-84" fill="none" stroke="#ffb46a" stroke-width="3" marker-end="url(#sd-magma-arrow)"/></g>
      <g id="sd-eruption"><path id="sd-lava" fill="none" stroke="#ffb46a" stroke-width="4" stroke-linecap="round"/><g id="sd-plume" fill="#c6cac3" opacity=".55"><ellipse cx="648" cy="73" rx="14" ry="13"/><ellipse cx="639" cy="55" rx="20" ry="15"/><ellipse cx="660" cy="42" rx="28" ry="17"/></g></g>
      <g id="sd-water-paths" fill="none" stroke="#76d9fc" stroke-width="3" stroke-linecap="round" marker-end="url(#sd-water-arrow)"></g>
      <g id="sd-earthquakes"></g>
      <g id="sd-motion-arrows" fill="none" stroke="#d3efe4" stroke-width="4" marker-end="url(#sd-arrow)"><path d="M235 227h100"/><path d="M885 210h-78"/><path id="sd-sinking-arrow"/></g>
      <g id="sd-label-layer">
        <g class="sd-wide-label"><text x="112" y="130">Hav</text><text x="94" y="291">Havbunnsplate</text><text x="94" y="313" class="sd-small-label">Skorpe + øverste mantel</text><path class="sd-label-line" d="M170 274v-20"/>
          <text x="793" y="255">Kontinentalplate</text><text x="786" y="278" class="sd-small-label">Skorpe + øverste mantel</text>
          <text x="195" y="430">Mantel</text><text x="195" y="453" class="sd-small-label">Hovedsakelig fast bergart</text>
          <text x="294" y="100">Dyphavsgrop</text><path id="sd-trench-leader" class="sd-label-line"/>
          <g id="sd-melting-label"><text x="727" y="350">Mantelkile</text><text x="727" y="373" class="sd-small-label">Delvis oppsmelting</text><path class="sd-label-line" d="M711 351 684 333"/><text x="516" y="430" fill="#76d9fc">Vann frigjøres</text><path class="sd-label-line" d="M575 411 591 366"/></g>
          <g id="sd-volcano-label"><text x="699" y="86">Vulkansk fjellkjede</text><path id="sd-volcano-leader" class="sd-label-line"/></g>
          <text x="945" y="452" transform="rotate(90 945 452)" class="sd-small-label">Økende dybde →</text>
        </g>
        <g class="sd-compact-label"><text x="302" y="135">Hav</text><text x="773" y="184">Kontinent</text><text x="314" y="452">Mantel</text></g>
        <g class="sd-callout" data-sd-callout="trench"><circle cx="410" cy="188" r="15"/><text x="410" y="188">1</text></g>
        <g class="sd-callout" data-sd-callout="melting" id="sd-melt-callout"><circle cx="704" cy="313" r="15"/><text x="704" y="313">2</text></g>
        <g class="sd-callout" data-sd-callout="mountains" id="sd-mountain-callout"><circle cx="682" cy="132" r="15"/><text x="682" y="132">3</text></g>
        <g class="sd-callout" data-sd-callout="earthquakes" id="sd-quake-callout"><circle cx="777" cy="486" r="15"/><text x="777" y="486">4</text></g>
      </g>
    </g>`);

  const stages = [
    ['Havbunnsplaten bøyes ned', 'En kald og tett havbunnsplate begynner å synke under kontinentet. Der platen bøyes ned, utvikles en dyphavsgrop.'],
    ['Platen synker – skjelvene følger med', 'Spenninger kan utløse grunne skjelv ved platekontakten. Lenger inn under kontinentet oppstår skjelv også inne i den synkende platen, på større dyp.'],
    ['Vann bidrar til delvis oppsmelting', 'Vannholdige mineraler i den synkende platen omdannes og frigjør vannrike væsker. Vannet senker smeltetemperaturen i den varme mantelkilen, slik at noe av bergarten kan smelte.'],
    ['Magma stiger – fjellkjeden vokser', 'Noe av magmaen stiger gjennom kontinentalplaten og bygger vulkaner. Sammenpressing, fortykkelse og heving av skorpa bidrar også til fjellkjeden.']
  ];
  const explanations = {
    trench: ['Dyphavsgropa markerer plategrensen', '<p>Den kalde havbunnsplaten er tettere enn materialet rundt og synker under kontinentalplaten. Nedbøyningen danner en <strong>lang, smal dyphavsgrop</strong>. Sedimenter kan skrapes av og hope seg opp ved kanten av kontinentet.</p><p class="sd-look">Se etter 1: Følg den lyse havbunnsskorpa fra havet og ned under kontinentet.</p>'],
    melting: ['Vann senker smeltetemperaturen', '<p>Den synkende platen fører med seg sedimenter og bergarter med <strong>vann bundet i mineraler</strong>. Når trykk og temperatur endres, brytes noen av mineralene ned og frigjør vannrike væsker.</p><p>Væskene beveger seg inn i <strong>mantelkilen</strong> over platen. Vannet senker temperaturen der oppsmelting kan begynne ved det aktuelle trykket. I den varme delen av mantelkilen kan derfor <strong>en del av bergarten smelte til magma</strong>. Mesteparten av mantelen er fortsatt fast. Magmaen i denne modellen kommer fra mantelkilen; selve havbunnsplaten smelter vanligvis ikke.</p><p class="sd-look">Se etter 2: Blå piler viser vannrike væsker. Oransje viser delvis oppsmelting og magma. Før glideren forbi midten.</p>'],
    mountains: ['Både vulkanisme og sammenpressing bygger fjell', '<p>Magma er lettere enn bergarten rundt og kan stige gjennom sprekker og samle seg i skorpa. Noe når overflaten som lava og bygger <strong>en vulkansk fjellkjede</strong> et stykke innenfor dyphavsgropa.</p><p>Samtidig presses kontinentalskorpa sammen, foldes, fortykkes og heves. <strong>Fjellkjeden bygges altså av mer enn vulkaner.</strong> Andesfjellene er et eksempel på disse prosessene.</p><p class="sd-look">Se etter 3: Følg den oransje magmaen og se terrenget heve seg mot slutten av forløpet.</p>'],
    earthquakes: ['Jordskjelvene tegner den synkende platen', '<p>Ved den grunne platekontakten kan platene låses mens spenning bygger seg opp. Plutselig glidning kan gi store jordskjelv. <strong>Mellomdype og dype skjelv oppstår inne i den relativt kalde, synkende platen</strong>, ikke langs en friksjonsflate hele veien ned.</p><p>Skjelvenes fokus ligger ofte dypere jo lenger inn under kontinentet vi kommer. Beltet av skjelv kalles <strong>Wadati–Benioff-sonen</strong>. I noen subduksjonssoner når skjelvene omtrent 700 km dypt. Dype skjelv involverer andre prosesser enn vanlig friksjonsbrudd nær overflaten, blant annet mineralomvandlinger.</p><p class="sd-look">Se etter 4 og symbolene: Sirkel = grunt, rombe = mellomdypt, firkant = dypt. Punktene er skjematiske mulige fokus.</p>']
  };

  // Sample a fixed path. Its visible length grows; material markers move along it.
  const points = [];
  for (let x = -100; x <= 340; x += 10) points.push({x, y:232});
  for (let i = 1; i <= 24; i++) {
    const t = i / 24, u = 1 - t;
    points.push({x:u*u*u*340 + 3*u*u*t*391 + 3*u*t*t*414 + t*t*t*450,
      y:u*u*u*232 + 3*u*u*t*232 + 3*u*t*t*248 + t*t*t*276});
  }
  for (let i = 1; i <= 64; i++) points.push({x:450+460*i/64, y:276+300*i/64});
  points[0].distance = 0;
  for (let i = 1; i < points.length; i++) points[i].distance = points[i-1].distance + Math.hypot(points[i].x-points[i-1].x, points[i].y-points[i-1].y);
  const fullLength = points.at(-1).distance;
  const bendLength = points[68].distance;
  function pointAt(distance) {
    const i = points.findIndex(p => p.distance >= distance);
    const a = points[Math.max(0, i-1)], b = points[Math.max(1, i)];
    const t = clamp((distance-a.distance)/(b.distance-a.distance));
    const angle = Math.atan2(b.y-a.y,b.x-a.x);
    return {x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t, nx:Math.sin(angle), ny:-Math.cos(angle)};
  }
  function offset(p, amount) { return {x:p.x+p.nx*amount, y:p.y+p.ny*amount}; }
  function line(list) { return list.map((p,i) => `${i?'L':'M'}${fmt(p.x)} ${fmt(p.y)}`).join(' '); }
  function band(list, outer, inner) {
    return line(list.map(p=>offset(p,outer))) + ' ' + line(list.map(p=>offset(p,inner)).reverse()).replace(/^M/,'L') + 'Z';
  }
  const body = $('#sd-slab-body'), crust = $('#sd-slab-crust');
  function visible(el, show, opacity=1) {
    el.style.display = show ? '' : 'none';
    el.setAttribute('opacity', fmt(opacity));
  }
  function render() {
    const p = progress / 100;
    const end = bendLength + (fullLength-bendLength) * (.045 + .955*p);
    const pathPoints = points.filter(point=>point.distance<end).map(point=>pointAt(point.distance));
    pathPoints.push(pointAt(end));
    const slabPath = band(pathPoints,24,-24);
    body.setAttribute('d',slabPath);
    $('#sd-slab-mask').setAttribute('d',slabPath);
    crust.setAttribute('d',band(pathPoints,24,16));
    const tracers = [];
    for (let i=0;i<15;i++) {
      const distance=(i*83+p*560)%fullLength;
      if(distance>end) continue;
      const position=pointAt(distance), a=offset(position,12), b=offset(position,-17);
      tracers.push(`<path d="M${fmt(a.x)} ${fmt(a.y)}L${fmt(b.x)} ${fmt(b.y)}"/>`);
    }
    $('#sd-tracers').innerHTML=tracers.join('');

    const mountain = ramp(p,.48,1), trench = 222+13*p;
    const peak = 177-83*mountain;
    const surface = `M403 ${fmt(trench)}L438 202 482 178 532 ${fmt(178-10*mountain)} 558 ${fmt(179-30*mountain)} 587 ${fmt(178-7*mountain)} 628 ${fmt(177-60*mountain)} 643 ${fmt(peak+5)} 654 ${fmt(peak+7)} 679 ${fmt(176-42*mountain)} 709 ${fmt(178-9*mountain)} 743 ${fmt(178-37*mountain)} 784 ${fmt(178-10*mountain)} 844 ${fmt(178-20*mountain)} 899 178 1040 180`;
    const crustPath = surface + 'L1040 250 528 250 453 263Z';
    $('#sd-continental-crust').setAttribute('d',crustPath);
    $('#sd-crust-texture').setAttribute('d',crustPath);
    $('#sd-continental-mantle').setAttribute('d',`M403 ${fmt(trench)}L453 263 528 250 1040 250 1040 293 528 293 450 264Z`);
    $('#sd-surface').setAttribute('d',surface);
    $('#sd-back-range').setAttribute('d',`M490 178L562 ${fmt(177-34*mountain)} 613 174 694 ${fmt(176-65*mountain)} 754 164 809 ${fmt(177-45*mountain)} 893 177 1040 174V212H490Z`);
    $('#sd-folds').setAttribute('d',`M485 230q29 ${fmt(-18*mountain)} 58 0t58 0t58 0t58 0t58 0t58 0M504 242q29 ${fmt(-14*mountain)} 58 0t58 0t58 0t58 0t58 0t58 0`);
    $('#sd-trench-leader').setAttribute('d',`M382 108L403 ${fmt(trench-3)}`);
    $('#sd-volcano-leader').setAttribute('d',`M706 94L661 ${fmt(peak+2)}`);
    $('#sd-magma-halo').setAttribute('d',`M633 322Q665 288 648 260T650 ${fmt(peak+10)}`);
    $('#sd-magma-conduit').setAttribute('d',`M633 322Q665 288 648 260T650 ${fmt(peak+10)}`);
    $('#sd-lava').setAttribute('d',`M644 ${fmt(peak+5)}L654 ${fmt(peak+7)} 665 ${fmt(peak+29)}`);
    $('#sd-plume').setAttribute('transform',`translate(0 ${fmt(peak-94)})`);

    const water = ramp(p,.3,.53), melt = ramp(p,.44,.63), magma=ramp(p,.57,.84);
    visible($('#sd-melt-zone'),fluids.checked && melt>0,melt);
    visible($('#sd-magma-path'),fluids.checked && magma>0,magma);
    visible($('#sd-eruption'),fluids.checked && p>.88,ramp(p,.88,1));
    const waterPaths=[];
    for(const x of [582,619,656]) {
      // The source is on the TOP of the slab, with fluid arrows pointing upward.
      const distance=bendLength+(x-450)*Math.hypot(460,300)/460;
      if(distance>end) continue;
      const source=offset(pointAt(distance),27);
      waterPaths.push(`<path d="M${fmt(source.x)} ${fmt(source.y)}Q${fmt(source.x-7)} ${fmt(source.y-19)} ${fmt(source.x+1)} 312"/>`);
    }
    $('#sd-water-paths').innerHTML=waterPaths.join('');
    visible($('#sd-water-paths'),fluids.checked && water>0,water);
    visible($('#sd-melting-label'),fluids.checked && water>0);
    visible($('#sd-volcano-label'),mountain>.05);
    visible($('#sd-melt-callout'),fluids.checked && water>0);
    visible($('#sd-mountain-callout'),mountain>.05);
    const sinkingStart=pointAt(bendLength+12), sinkingEnd=pointAt(Math.min(end,bendLength+103));
    $('#sd-sinking-arrow').setAttribute('d',line([sinkingStart,sinkingEnd]));
    visible($('#sd-sinking-arrow'),p>.15);

    const events=[
      {d:bendLength-33,type:'shallow',color:'#f4d776',depth:'grunt'},
      {d:bendLength+34,type:'shallow',color:'#f4d776',depth:'grunt'},
      {d:bendLength+126,type:'intermediate',color:'#ed9a80',depth:'mellomdypt'},
      {d:bendLength+205,type:'intermediate',color:'#ed9a80',depth:'mellomdypt'},
      {d:bendLength+284,type:'intermediate',color:'#ed9a80',depth:'mellomdypt'},
      {d:bendLength+403,type:'deep',color:'#c4a4f3',depth:'dypt'},
      {d:bendLength+488,type:'deep',color:'#c4a4f3',depth:'dypt'}
    ];
    const symbols=[];
    for(const event of events) {
      if(event.d>end || p<.08) continue;
      // Shallow events near the contact; deeper ones WITHIN the cold slab.
      const pos=offset(pointAt(event.d),event.type==='shallow'?23:3);
      const shape=event.type==='shallow' ? '<circle r="5"/>' : `<rect x="-4.5" y="-4.5" width="9" height="9"${event.type==='intermediate'?' transform="rotate(45)"':''}/>`;
      symbols.push(`<g data-depth="${event.depth}" transform="translate(${fmt(pos.x)} ${fmt(pos.y)})" fill="${event.color}" stroke="#222b34" stroke-width="1.5"><circle r="11" fill="none" stroke="${event.color}" stroke-width="1" opacity=".5"/>${shape}</g>`);
    }
    $('#sd-earthquakes').innerHTML=symbols.join('');
    visible($('#sd-earthquakes'),quakes.checked);
    visible($('#sd-quake-callout'),quakes.checked && p>.76);
    visible($('#sd-label-layer'),labels.checked);
    $('#sd-quake-key').hidden=!quakes.checked;
    svg.querySelectorAll('[data-sd-callout]').forEach(el=>el.classList.toggle('is-selected',el.dataset.sdCallout===topic));

    // Do not display 100% before playback has actually reached its end.
    const shownProgress=Math.floor(progress);
    slider.value=String(shownProgress);
    $('#sd-progress-value').textContent=`${shownProgress} %`;
    const nextStage=p<.22?0:p<.44?1:p<.7?2:3;
    slider.setAttribute('aria-valuetext',`${shownProgress} prosent. ${stages[nextStage][0]}.`);
    if(nextStage!==stageIndex) {
      stageIndex=nextStage;
      $('#sd-stage-number').textContent=String(nextStage+1).padStart(2,'0');
      $('#sd-stage-title').textContent=stages[nextStage][0];
      $('#sd-stage-text').textContent=stages[nextStage][1];
    }
    $('#sd-svg-desc').textContent=`Modellforløp: ${shownProgress} prosent. ${stages[nextStage][0]}. ${quakes.checked?'Jordskjelvfokus vises. ':''}${fluids.checked?'Blå piler viser vannrike væsker og oransje viser magma når disse dannes. ':''}Avstander og tid er ikke i målestokk.`;
  }
  function explain(nextTopic) {
    topic=nextTopic;
    const [title,body]=explanations[topic];
    $('#sd-explanation').innerHTML=`<h3>${title}</h3>${body}`;
    root.querySelectorAll('[data-sd-topic]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sdTopic===topic)));
    render();
  }
  function stop() {
    playing=false;
    if(frame!==null) cancelAnimationFrame(frame);
    frame=null; lastTime=null;
    play.textContent='▶ Spill av';
    play.setAttribute('aria-pressed','false');
  }
  function tick(now) {
    if(!playing) return;
    if(lastTime!==null) progress=Math.min(100,progress+Math.min(now-lastTime,100)/260);
    lastTime=now;
    render();
    if(progress>=100) stop();
    else frame=requestAnimationFrame(tick);
  }
  slider.addEventListener('input',()=>{stop();progress=Number(slider.value);render();});
  play.addEventListener('click',()=>{
    if(playing) return stop();
    if(progress>=100) progress=0;
    playing=true; lastTime=null;
    play.textContent='Ⅱ Pause';play.setAttribute('aria-pressed','true');
    frame=requestAnimationFrame(tick);
  });
  $('#sd-reset').addEventListener('click',()=>{
    stop();progress=0;labels.checked=true;quakes.checked=true;fluids.checked=true;explain('trench');
  });
  for(const input of [labels,quakes,fluids]) input.addEventListener('change',render);
  root.querySelectorAll('[data-sd-topic]').forEach(button=>button.addEventListener('click',()=>explain(button.dataset.sdTopic)));
  document.addEventListener('visibilitychange',()=>{if(document.hidden) stop();});
  new MutationObserver(()=>{if(!section.classList.contains('active')) stop();}).observe(section,{attributes:true,attributeFilter:['class']});
  reducedMotion.addEventListener('change',stop);
  // No ambient animation or autoplay, including when reduced motion is requested.
  // An explicitly requested playback remains available and can always be paused.
  new ResizeObserver(entries=>{
    const width=entries[0].contentRect.width;
    if(!width) return;
    const compact=width<=600;
    svg.classList.toggle('is-compact',compact);
    svg.setAttribute('viewBox',compact?'270 0 690 600':'0 0 1000 600');
  }).observe($('.sd-diagram-wrap'));
  play.hidden=false;$('#sd-reset').hidden=false;$('.sd-layers').hidden=false;
  explain('trench');
})();
