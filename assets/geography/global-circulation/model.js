/* An original teaching diagram: one geographical globe, five progressively richer models. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id), svg=$('earth');
  let CX=380; const CY=330, R=226, DEG=Math.PI/180;
  document.body.classList.toggle('embedded',parent!==window);
  let step=0, focus='', deflected=true, hostVisible=true, longitude=10, physical=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=reduced.matches;
  const colors={hadley:'var(--hadley)',ferrel:'var(--ferrel)',polar:'var(--polar)',low:'var(--low)',high:'var(--high)'};
  const lessons=[
    {title:'Samme solenergi. Ulikt areal.',text:'Solstrålene treffer mer rett på nær ekvator og mer skrått mot polene. En like bred bunt med stråler fordeles derfor over ulikt areal på jordoverflaten.',key:'Tropene har et energioverskudd, mens polområdene har et energiunderskudd. Atmosfæren og havet flytter varme mellom dem.',label:'Solenergi ved jordoverflaten',badge:'Ulik innstrålingsvinkel',desc:'To like brede solbunter treffer en geografisk jordklode. Nær ekvator fordeles energien over et kort område. Høyt mot nord fordeles den over et større område.'},
    {title:'Hva om jorda ikke roterte?',text:'Vi begynner med en enklere jord: uten rotasjon, årstider og forskjeller mellom hav og land. Da kan vi tenke oss én stor sirkulasjonscelle på hver halvkule.',key:'Ulik oppvarming setter lufta i bevegelse. En celle er en sammenhengende sirkulasjon, med både en øvre og en nedre gren.',label:'En forenklet jord uten rotasjon',badge:'Én celle på hver halvkule',desc:'En sirkulasjonscelle på hver halvkule: luft stiger ved ekvator, går mot polene i høyden, synker ved polene og vender tilbake langs bakken.'},
    {title:'På den roterende jorda: tre celler.',text:'På hver halvkule beskriver vi tre sirkulasjonsceller. De går rundt jorda; her ser du to tverrsnitt. Ferrelcellen er et indirekte gjennomsnitt av skiftende værsystemer.',key:'Se den nedre grenen: luft går mot ekvator i Hadleycellen, mot polen i Ferrelcellen og bort fra polen i polarcellen.',label:'Sirkulasjon mellom ekvator og polene',badge:'Velg en celle for å fremheve den',desc:'Tre fargede celler på hver halvkule. Hadleycellen fra 0 til omtrent 30 grader, Ferrelcellen fra 30 til 60 og polarcellen fra 60 til 90. Pilene viser sirkulasjonen i to tverrsnitt av cellene som går rundt jorda.'},
    {title:'Luftbevegelsen setter spor i klimaet.',text:'Stigende luft gir ofte lavtrykk og nedbør. Synkende luft gir ofte høytrykk og tørt vær. Sammenlign beltene med vegetasjonen i det fysiske kartet.',key:'Stigende luft avkjøles og danner lettere skyer. Synkende luft varmes opp og blir relativt tørrere.',label:'Trykk ved bakken og typisk nedbør',badge:'H = høytrykk · L = lavtrykk',desc:'Lavtrykksbelter ved ekvator og omtrent 60 grader, med stigende luft og nedbør. Høytrykk rundt 30 grader og ved polene, med synkende luft og lite nedbør. Klimafargene er skjematiske belter.'},
    {title:'Rotasjonen bøyer vinden.',text:'Luft drives fra høytrykk mot lavtrykk. Jordrotasjonen avbøyer bevegelsen mot høyre i nord og mot venstre i sør. Slik dannes vindbeltene.',key:'Vinder får navn etter hvor de kommer fra: vestavind fra vest, nordøstpassaten fra nordøst.',label:'Dominerende vindretning ved bakken',badge:'Retning sett fra jordoverflaten',desc:'Passatvindene blåser mot ekvator og vestover. Vestavindene blåser mot polene og østover mellom 30 og 60 grader. Polare østavinder går bort fra polene og vestover.'}
  ];
  const pt=q=>q.map(v=>v.toFixed(1)).join(',');
  const geo=(lon,lat)=>[CX+R*Math.cos(lat*DEG)*Math.sin(lon*DEG),CY-R*Math.sin(lat*DEG)];
  const line=(a,b)=>`M${pt(a)}L${pt(b)}`;
  const marker=(name,color)=>`<marker id="arrow-${name}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M1 1 9 5 1 9Z" fill="${color}"/></marker>`;
  function defs(){return `<defs><radialGradient id="ocean" cx="35%" cy="25%" r="80%"><stop stop-color="var(--ocean)"/><stop offset="1" stop-color="var(--ocean)" stop-opacity=".85"/></radialGradient><radialGradient id="shade" cx="34%" cy="26%" r="80%"><stop offset=".35" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#143d41" stop-opacity=".24"/></radialGradient><linearGradient id="thermal" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#90b2c3"/><stop offset=".25" stop-color="#edcc84"/><stop offset=".5" stop-color="#e49b66"/><stop offset=".75" stop-color="#edcc84"/><stop offset="1" stop-color="#90b2c3"/></linearGradient><radialGradient id="sun"><stop stop-color="#fff1a1"/><stop offset="1" stop-color="#eab23e"/></radialGradient><clipPath id="globe"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath><path id="land" d="${window.CIRCULATION_LAND||''}"/>${Object.entries(colors).map(([n,c])=>marker(n,c)).join('')}${marker('rise','var(--low)')}${marker('sink','var(--high)')}${marker('rotation','#639083')}</defs>`;}
  function globe(thermal=false){return `<g class="globe"><circle class="atmosphere" cx="${CX}" cy="${CY}" r="${R+5}"/><circle class="earth-ocean" cx="${CX}" cy="${CY}" r="${R}"/><use href="#land" class="earth-land" transform="translate(${CX-380} 0)"/><foreignObject id="globe-holder" x="${CX-R}" y="${CY-R}" width="${R*2}" height="${R*2}"></foreignObject>${thermal?`<circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#thermal)" opacity=".55"/>`:''}<circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#shade)"/><circle class="earth-outline" cx="${CX}" cy="${CY}" r="${R}"/></g>`;}
  function latitudes(labels=true){let s='<g aria-hidden="true">';for(const lat of [-60,-30,0,30,60]){const y=CY-R*Math.sin(lat*DEG),half=R*Math.cos(lat*DEG);s+=`<path class="latitude ${lat===0?'major':''}" d="M${CX-half},${y}H${CX+half}"/>`;if(labels)s+=`<g class="latitude-label" transform="translate(${CX-25},${y-10})"><rect width="50" height="20" rx="5"/><text x="25" y="15" text-anchor="middle">${Math.abs(lat)}°${lat>0?' N':lat<0?' S':''}</text></g>`;}
    return s+`<text class="compass-label" x="${CX}" y="${CY-R-12}" text-anchor="middle">N</text><text class="compass-label" x="${CX}" y="${CY+R+21}" text-anchor="middle">S</text></g>`;}
  // Rounded branches from the earlier model, fitted to the geographical globe.
  // Each pair closes a cell: the lower branch follows the spherical surface,
  // while the upper branch turns smoothly into its rising/sinking neighbour.
  const cellBranches={
    single:[
      ['upper','M680 310 C719 311 741 293 739 258 C734 158 631 48 474 35','hadley'],
      ['lower','M474 35 C456 34 445 44 445 57 C445 68 455 76 474 78 C594 91 653 181 680 310','polar']
    ],
    hadley:[
      ['upper','M680 310 C717 310 730 289 724 258 C718 225 700 199 679 190 C666 184 655 186 649 192','hadley'],
      ['lower','M649 192 C664 228 676 270 680 310','hadley']
    ],
    ferrel:[
      ['lower','M649 192 C625 158 598 124 563 106','ferrel'],
      ['upper','M563 106 C589 104 624 119 642 147 C662 175 670 191 649 192','ferrel']
    ],
    polar:[
      ['lower','M445 75 C487 77 527 88 563 106','polar'],
      ['upper','M563 106 C586 105 604 94 603 80 C602 60 535 34 474 34 C456 34 445 44 445 57 C445 68 445 72 445 75','polar']
    ]
  };
  function cells(single=false,faint=false){
    let s=`<g class="cells ${faint?'faint':''}" aria-hidden="true">`;
    const scale=R/235;
    for(const side of [-1,1])for(const hemi of [-1,1])for(const type of single?['single']:['hadley','ferrel','polar']){
      const transform=`translate(${CX} ${CY}) scale(${scale*side} ${scale*hemi}) translate(-445 -310)`;
      s+=`<g class="cell-group" data-family="${type}" data-side="${side===1?'near':'far'}" data-hemisphere="${hemi===1?'north':'south'}" transform="${transform}">`;
      for(const [branch,d,color] of cellBranches[type]){
        s+=`<g class="cell-branch" style="--flow:${colors[color]}"><path class="cell-bed" d="${d}"/><path class="cell-flow" data-branch="${branch}" d="${d}" marker-end="url(#arrow-${color})"/><circle class="cell-particle" r="3.8"><animateMotion path="${d}" dur="${single?'5.8':'3.8'}s" begin="${hemi===1?'0':'-1.9'}s" repeatCount="indefinite"/></circle></g>`;
      }
      s+='</g>';
    }
    s+='</g>';
    if(single&&!faint)s+=`<g class="cell-captions" aria-hidden="true"><text x="${CX+R-66}" y="${CY-18}">Luft stiger</text><text x="${CX+42}" y="${CY-R-36}">Luft synker</text><text x="${CX+42}" y="${CY+R+43}">Luft synker</text></g>`;
    return s;
  }
  function solar(){
    let s='<g class="solar-diagram" aria-hidden="true">';
    s+=`<g transform="translate(96 249)"><circle r="27" fill="url(#sun)"/>${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return `<path class="ray" d="M${Math.cos(a)*35},${Math.sin(a)*35}L${Math.cos(a)*44},${Math.sin(a)*44}"/>`;}).join('')}</g>`;
    for(const [y1,y2,color] of [[141,169,'#b68b3f'],[316,344,'#ce7e45']]){const x1=CX-Math.sqrt(R*R-(y1-CY)**2),x2=CX-Math.sqrt(R*R-(y2-CY)**2),mid=(y1+y2)/2,xmid=CX-Math.sqrt(R*R-(mid-CY)**2);s+=`<path class="solar-beam" d="M90 ${y1}H${x1}A${R} ${R} 0 0 0 ${x2} ${y2}H90Z"/><path class="ray" d="M90 ${y1}H${x1}M90 ${y2}H${x2}"/><path class="footprint" stroke="${color}" d="M${x1} ${y1}A${R} ${R} 0 0 0 ${x2} ${y2}"/><circle class="energy-dot" r="3.8"><animateMotion path="M90 ${mid}H${xmid-5}" dur="2.8s" repeatCount="indefinite"/></circle>`;}
    return s+'<text class="svg-note" x="36" y="65">Like brede solbunter</text><g class="solar-callout"><text class="solar-label" x="36" y="106" fill="#9f7c39">Større areal</text><text class="svg-note" x="36" y="130">mindre energi per m²</text></g><g class="solar-callout"><text class="solar-label" x="36" y="394" fill="#b66d3e">Mindre areal</text><text class="svg-note" x="36" y="419">mer energi per m²</text></g></g>';
  }
  function cloud(x,y,scale=1){return `<g transform="translate(${x} ${y}) scale(${scale})"><path class="cloud" d="M-24 7C-36 4-34-11-22-13C-18-30 3-29 9-14C23-20 34-9 29 3C27 10 17 11 10 11H-14Z"/><path class="rain" d="M-18 18l-7 20M-1 18l-7 20M16 18l-7 20"/></g>`;}
  function pressure(climate=true,clouds=true){
    let s='<g id="pressure-belts" aria-hidden="true">';
    if(climate){s+='<g clip-path="url(#globe)" opacity=".42">';for(const [lo,hi,c] of [[-90,-70,'#c1d9df'],[-70,-45,'#a4c8a6'],[-43,-21,'#e3c483'],[-12,12,'#70b083'],[21,43,'#e3c483'],[45,70,'#a4c8a6'],[70,90,'#c1d9df']]){const top=CY-R*Math.sin(hi*DEG),bottom=CY-R*Math.sin(lo*DEG);s+=`<rect x="${CX-R}" y="${top}" width="${R*2}" height="${bottom-top}" fill="${c}"/>`;}s+='</g>';}
    for(const lat of [90,60,30,0,-30,-60,-90]){const low=lat===0||Math.abs(lat)===60,type=low?'low':'high',family=lat===0?'equator':Math.abs(lat)===30?'subtropics':Math.abs(lat)===60?'subpolar':'poles',y=CY-R*Math.sin(lat*DEG)-(Math.abs(lat)===90?Math.sign(lat)*20:0),edge=CX+R*Math.cos(lat*DEG);s+=`<g class="pressure-row" data-family="${family}" style="--pressure:${colors[type]}"><path class="pressure-guide" d="M${edge+5} ${y}H646"/><circle class="pressure-badge" cx="650" cy="${y}" r="17"/><text class="pressure-symbol" x="650" y="${y}">${low?'L':'H'}</text><text class="pressure-lat" x="675" y="${y+5}">${Math.abs(lat)}°${lat>0?' N':lat<0?' S':''}</text></g>`;}
    if(clouds)for(const lat of [0,60,-60]){const y=CY-R*Math.sin(lat*DEG);s+=`<g data-family="${lat===0?'equator':'subpolar'}" class="pressure-row">${cloud(CX+85,y-10,lat===0?1:.7)}${cloud(CX-85,y-10,lat===0?1:.7)}</g>`;}
    return s+'</g>';
  }
  const windBands=[{id:'polar',lo:79,hi:65,from:8,to:-10},{id:'ferrel',lo:35,hi:55,from:-10,to:10},{id:'hadley',lo:26,hi:5,from:10,to:-10},{id:'hadley',lo:-26,hi:-5,from:10,to:-10},{id:'ferrel',lo:-35,hi:-55,from:-10,to:10},{id:'polar',lo:-79,hi:-65,from:8,to:-10}];
  function winds(){let s='<g clip-path="url(#globe)" aria-hidden="true">';for(const band of windBands){s+=`<g class="wind-group" data-family="${band.id}" style="--wind:${colors[band.id]}">`;for(const offset of [-43,0,43]){const from=geo(offset+band.from,band.lo),to=geo(offset+(deflected?band.to:band.from),band.hi),middle=geo(offset+(deflected?(band.from*.75+band.to*.25):band.from),(band.lo+band.hi)/2),d=`M${pt(from)}Q${pt(middle)} ${pt(to)}`;s+=`<path class="wind-halo" d="${d}"/><path class="wind-arrow" d="${d}" marker-end="url(#arrow-${band.id})"/><path class="wind-pulse" d="${d}"/>`;}s+='</g>';}return s+'</g>';}
  function fact(title,text){return `<div class="fact"><strong>${title}</strong><p>${text}</p></div>`;}
  function choice(id,title,sub,range,color,pressureLetter=''){return `<button type="button" class="choice ${pressureLetter?'pressure-choice':''}" data-focus="${id}" aria-pressed="false" style="--swatch:${color}"><span class="${pressureLetter?'pressure-letter':'choice-dot'}" aria-hidden="true">${pressureLetter}</span><span><strong>${title}</strong><small>${sub}</small></span><span class="range">${range}</span></button>`;}
  function details(){switch(step){case 0:return '';case 1:return fact('1 · Stiger ved ekvator','Oppvarmet luft stiger og strømmer mot polene i høyden.')+fact('2 · Synker ved polene','Avkjølt luft synker. Ved bakken går lufta tilbake mot ekvator.');case 2:return choice('hadley','Hadleycellen','Stiger ved ekvator · synker rundt 30°','0–30°',colors.hadley)+choice('ferrel','Ferrelcellen','Synker rundt 30° · stiger rundt 60°','30–60°',colors.ferrel)+choice('polar','Polarcellen','Stiger rundt 60° · synker ved polen','60–90°',colors.polar);case 3:return choice('equator','Ekvator','Stigende luft · mye regn','0°',colors.low,'L')+choice('subtropics','Subtropene','Synkende luft · mange ørkenområder','ca. 30°',colors.high,'H')+choice('subpolar','Subpolare områder','Stigende luft · skiftende, vått vær','ca. 60°',colors.low,'L')+choice('poles','Polområdene','Synkende, kald luft · lite nedbør','90°',colors.high,'H');case 4:return choice('hadley','Passatvindene','Nordøst i nord · sørøst i sør','0–30°',colors.hadley)+choice('ferrel','Vestavindene','Fra vest · mot polene','30–60°',colors.ferrel)+choice('polar','Polare østavinder','Fra øst · bort fra polene','60–90°',colors.polar)+`<button id="coriolis" type="button" aria-pressed="${deflected}">${deflected?'Sammenlign: bare trykkforskjell':'Vis jordrotasjonens avbøyning'}</button><p class="detail-note" id="coriolis-note">${deflected?'Velg et vindbelte for å fremheve det.':'Her holder vi trykkbeltene faste og fjerner bare avbøyningen for å vise forskjellen i retning.'}</p>`;}}
  function legend(){return step===0?'<span><i style="--swatch:#d99d54"></i>Solenergi</span>':step===1?'<span><i style="--swatch:var(--hadley)"></i>Varm luft mot polen i høyden</span><span><i style="--swatch:var(--polar)"></i>Kjøligere luft tilbake ved bakken</span>':step===2?['hadley','ferrel','polar'].map((k,i)=>`<span><i style="--swatch:${colors[k]}"></i>${['Hadley','Ferrel','Polar'][i]}</span>`).join(''):step===3?physical?'<span>NASA · jordoverflaten i august 2004</span>':'<span><i style="--swatch:#70b083"></i>Våtere</span><span><i style="--swatch:#e3c483"></i>Tørrere</span><span><i style="--swatch:#c1d9df"></i>Kaldt og tørt</span>':'<span>Pilene: vind ved bakken · H: høytrykk · L: lavtrykk</span>';}
  function render(){CX=step===0?470:380;const lesson=lessons[step];document.body.dataset.step=step;$('lesson-title').textContent=lesson.title;$('lesson-text').textContent=lesson.text;$('takeaway').textContent=lesson.key;$('step-count').textContent=`TRINN ${step+1} AV 5`;$('figure-label').textContent=lesson.label;$('model-badge').textContent=lesson.badge;$('lesson-details').innerHTML=details();$('figure-legend').innerHTML=legend();$('previous').disabled=step===0;$('next').disabled=step===4;$('next').textContent=step===4?'Siste trinn':'Neste →';$('model-panel').setAttribute('aria-labelledby','step-'+step);document.querySelectorAll('button[data-step]').forEach(button=>{let active=Number(button.dataset.step)===step;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
    svg.innerHTML=`<title id="earth-title">${lesson.title}</title><desc id="earth-description">${lesson.desc}</desc>${defs()}${globe(step===0)}${step===0?solar():''}${step===1?cells(true):''}${step===2?cells():''}${step===3?cells(false,true)+pressure(!physical,!physical):''}${step===4?cells(false,true):''}${latitudes(step>0)}${step===4?winds()+pressure(false,false):''}`;
    svg.setAttribute('viewBox','0 30 760 600');
    window.CirculationGlobe?.mount($('globe-holder'));window.CirculationGlobe?.set({longitude,physical:physical&&step>=3});
    $('surface-toggle').hidden=step<3;$('surface-toggle').textContent=physical?'Skjematisk kart':'Fysisk kart';$('surface-toggle').setAttribute('aria-pressed',String(physical));$('surface-credit').hidden=!physical||step<3;
    $('lesson-details').querySelectorAll('[data-focus]').forEach(button=>button.addEventListener('click',()=>{focus=focus===button.dataset.focus?'':button.dataset.focus;applyFocus();}));$('coriolis')?.addEventListener('click',()=>{deflected=!deflected;render();});applyFocus();syncMotion();requestSize();}
  function applyFocus(){svg.querySelectorAll('[data-family]').forEach(group=>group.style.opacity=focus&&group.dataset.family!==focus&&!(step===4&&group.classList.contains('pressure-row'))?'.13':'');$('lesson-details').querySelectorAll('[data-focus]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.focus===focus)));}
  function select(value){step=Math.min(4,Math.max(0,value));focus='';render();}
  document.querySelectorAll('button[data-step]').forEach(button=>{button.addEventListener('click',()=>select(Number(button.dataset.step)));button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(step+1)%5;else if(event.key==='ArrowLeft')next=(step+4)%5;else if(event.key==='Home')next=0;else if(event.key==='End')next=4;else return;event.preventDefault();select(next);$('step-'+next).focus();});});
  $('previous').addEventListener('click',()=>select(step-1));$('next').addEventListener('click',()=>select(step+1));
  function syncMotion(){const stop=paused||!hostVisible||document.hidden;document.body.classList.toggle('is-paused',stop);if(stop)svg.pauseAnimations?.();else svg.unpauseAnimations?.();$('motion').setAttribute('aria-pressed',String(paused));$('motion').setAttribute('aria-label',paused?'Fortsett bevegelsen':'Pause bevegelsen');$('motion').innerHTML=paused?'▶ <span>Fortsett</span>':'Ⅱ <span>Pause</span>';}
  $('motion').addEventListener('click',()=>{paused=!paused;syncMotion();});document.addEventListener('visibilitychange',syncMotion);reduced.addEventListener('change',event=>{paused=event.matches;syncMotion();});
  function setDark(dark){document.body.classList.toggle('dark',dark);$('theme').setAttribute('aria-pressed',String(dark));$('theme').setAttribute('aria-label',dark?'Bytt til lys visning':'Bytt til mørk visning');window.CirculationGlobe?.set({dark});}
  let storedDark=false;try{storedDark=localStorage.getItem('darkMode')==='true'||localStorage.getItem('theme')==='dark';}catch{}setDark(storedDark);
  $('theme').addEventListener('click',()=>setDark(!document.body.classList.contains('dark')));
  $('fullscreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.();});
  $('back').addEventListener('click',event=>{if(window.parent!==window){event.preventDefault();parent.postMessage({type:'circulation-back'},location.origin);}});
  addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='circulation-host')return;hostVisible=Boolean(event.data.visible);setDark(Boolean(event.data.dark));syncMotion();});
  function setLongitude(value){longitude=((value+180)%360+360)%360-180;$('longitude').value=String(Math.round(longitude));const label=Math.abs(Math.round(longitude))+'°'+(longitude<0?' V':longitude>0?' Ø':'');$('longitude-value').textContent=label;$('longitude').setAttribute('aria-valuetext',label);window.CirculationGlobe?.set({longitude});}
  $('longitude').addEventListener('input',event=>setLongitude(Number(event.target.value)));$('rotate-left').addEventListener('click',()=>setLongitude(longitude-30));$('rotate-right').addEventListener('click',()=>setLongitude(longitude+30));$('rotate-reset').addEventListener('click',()=>setLongitude(10));
  $('surface-toggle').addEventListener('click',()=>{physical=!physical;render();});
  const surface=window.CirculationGlobe?.canvas;let drag=null;
  surface?.addEventListener('pointerdown',event=>{if(event.button!==0)return;const b=surface.getBoundingClientRect(),x=(event.clientX-b.left)/b.width*2-1,y=(event.clientY-b.top)/b.height*2-1;if(x*x+y*y>1)return;drag={id:event.pointerId,x:event.clientX,lon:longitude,width:b.width};surface.setPointerCapture(event.pointerId);surface.classList.add('dragging');});
  surface?.addEventListener('pointermove',event=>{if(drag?.id===event.pointerId)setLongitude(drag.lon-(event.clientX-drag.x)/drag.width*180);});
  const stopDrag=event=>{if(drag?.id===event.pointerId){drag=null;surface.classList.remove('dragging');if(surface.hasPointerCapture(event.pointerId))surface.releasePointerCapture(event.pointerId);}};surface?.addEventListener('pointerup',stopDrag);surface?.addEventListener('pointercancel',stopDrag);
  surface?.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home'].includes(event.key)){event.preventDefault();setLongitude(event.key==='Home'?10:longitude+(event.key==='ArrowLeft'?-15:15));}});
  addEventListener('circulation-surface-ready',()=>{$('surface-status').textContent='';});addEventListener('circulation-surface-error',()=>{$('surface-status').textContent='Kartlaget kunne ikke lastes.';});
  addEventListener('resize',()=>window.CirculationGlobe?.set({longitude}));
  setLongitude(10);
  function requestSize(){if(parent!==window)parent.postMessage({type:'circulation-size',height:Math.ceil(document.querySelector('.circulation').getBoundingClientRect().height)},location.origin);}
  new ResizeObserver(requestSize).observe(document.querySelector('.circulation'));render();
})();
