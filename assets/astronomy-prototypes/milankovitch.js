/* Milanković: fixed-season solar geometry and pinned NOAA orbital/proxy data. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),base=new URL('.',document.currentScript.src),D=Math.PI/180,S0=1361;
  const rad=v=>v*D,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mod=(a,b)=>((a%b)+b)%b,fmt=(v,n=0)=>new Intl.NumberFormat('nb-NO',{maximumFractionDigits:n}).format(v);
  const reference={e:.0167,tilt:23.44,perihelion:282.9};
  const state={ready:false,chapter:'experiment',mechanism:'eccentricity',e:reference.e,tilt:reference.tilt,perihelion:reference.perihelion,trueShape:false,time:0,playing:false};
  let data=null,orbit=[],proxy=[],frame=0,last=0,lastPaint=0,historyTime=-20,futureTime=10;
  function dailyInsolation(latitude,solarLongitude,tilt=23.44,e=.0167,perihelion=282.9){
    const p=rad(latitude),d=Math.asin(Math.sin(rad(tilt))*Math.sin(rad(solarLongitude))),a=Math.sin(p)*Math.sin(d),b=Math.cos(p)*Math.cos(d),q=-a/b,H=q<=-1?Math.PI:q>=1?0:Math.acos(q),r=(1-e*e)/(1+e*Math.cos(rad(solarLongitude-perihelion)));
    return S0/(Math.PI*r*r)*(H*a+b*Math.sin(H));
  }
  const q65=p=>dailyInsolation(65,90,p.tilt,p.e,p.perihelion),globalMean=e=>S0/(4*Math.sqrt(1-e*e)),referenceQ=q65(reference);
  function atTime(t){const pos=clamp(t+800,0,900),i=Math.min(899,Math.floor(pos)),f=pos-i,a=orbit[i],b=orbit[i+1];if(!a||!b)return {...reference};return {e:a[1]+f*(b[1]-a[1]),perihelion:mod(a[2]+f*(mod(b[2]-a[2]+180,360)-180),360),tilt:a[3]+f*(b[3]-a[3])};}
  function proxyAt(t){if(t>0||!proxy.length||t<proxy[0][0])return null;let lo=0,hi=proxy.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(proxy[m][0]<=t)lo=m;else hi=m;}const a=proxy[lo],b=proxy[hi],f=(t-a[0])/(b[0]-a[0]||1);return a[1]+f*(b[1]-a[1]);}
  const parameters=()=>state.chapter==='experiment'?{e:state.e,tilt:state.tilt,perihelion:state.perihelion}:atTime(state.time);
  const metrics=p=>({q65:q65(p),winter65:dailyInsolation(65,270,p.tilt,p.e,p.perihelion),globalMean:globalMean(p.e),distanceAU:(1-p.e*p.e)/(1+p.e*Math.cos(rad(90-p.perihelion)))});
  const mechanisms={
    eccentricity:{title:'Baneform · eksentrisitet',heading:'Når er jorda nærmest sola?',copy:'En oval bane gir større avstandsforskjell gjennom året. Da får tidspunktet for nærmeste sol større betydning for årstidene.',takeaway:'Globalt årsmiddel endres lite. En mer oval bane gjør presesjonens påvirkning på årstidene sterkere.',label:'Eksentrisitet',key:'e',min:0,max:.06,step:.0001,hint:'De viktigste rytmene er omtrent 100 000 og 405 000 år. Dette er ikke én perfekt klokke.'},
    tilt:{title:'Aksehelning · obliquitet',heading:'Brattere sommersol langt mot nord.',copy:'Større aksehelning gir høyere sol og lengre sommerdager på høye breddegrader. Mer energi kan smelte snø, uten at den globale årsenergien endres.',takeaway:'Lavere helning gir svakere nordlige somre og mildere årstidskontraster. Følg energien ved 65° N når du endrer helningen.',label:'Aksehelning',key:'tilt',min:22.1,max:24.5,step:.01,hint:'Helningen varierer omtrent mellom 22,1° og 24,5° med en rytme nær 41 000 år.'},
    precession:{title:'Presesjon · årstid mot avstand',heading:'Hvilken årstid får den nære sola?',copy:'Jordaksens retning og banens orientering endres langsomt. Det flytter årstiden som faller nær perihel: punktet nærmest sola. Nå kommer perihel under nordlig vinter.',takeaway:'Flytt perihel til nordlig sommer og følg energien. Effekten blir svak i en sirkelbane, og sterkere i en mer oval bane.',label:'Solas lengde ved perihel',key:'perihelion',min:0,max:360,step:1,hint:'90° = perihel ved nordlig sommersolverv. 270° = ved nordlig vintersolverv. Klimatiske rytmer: ca. 19–23 000 år.'}
  };
  const point=(angle,r,cx=310,cy=198)=>[cx+r*Math.cos(rad(angle)),cy-r*Math.sin(rad(angle))],pt=p=>p.map(x=>x.toFixed(2)).join(','),text=(x,y,value,cls='mil-label',anchor='middle')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${value}</text>`;
  function orbitDiagram(p){
    const ev=state.trueShape?p.e:p.e*10,a=110,radius=angle=>a*(1-ev*ev)/(1+ev*Math.cos(rad(angle-p.perihelion))),samples=Array.from({length:241},(_,i)=>point(i*1.5,radius(i*1.5))),path='M'+samples.map(pt).join('L')+'Z';
    const summer=point(90,radius(90)),winter=point(270,radius(270)),near=point(p.perihelion,radius(p.perihelion)),far=point(p.perihelion+180,radius(p.perihelion+180)),m=metrics(p);
    let s=`<title id="diagram-title">${mechanisms[state.mechanism].title}</title><desc id="diagram-desc">Sola er i et brennpunkt. Nordlig sommersolverv ligger øverst i diagrammet. Perihel er ${fmt(p.perihelion,1)} grader sol-lengde. Sommeravstanden i beregningen er ${fmt(m.distanceAU,3)} astronomiske enheter.</desc><defs><radialGradient id="mil-sun"><stop stop-color="#fff2b0"/><stop offset="1" stop-color="#eeb356"/></radialGradient><radialGradient id="mil-earth"><stop stop-color="#78c4cc"/><stop offset="1" stop-color="#25596d"/></radialGradient><marker id="mil-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5 1 9Z" fill="#edc577"/></marker></defs>`;
    s+=`<circle class="mil-orbit-reference" cx="310" cy="198" r="110"/><path class="mil-orbit-line" d="${path}"/><path d="M310 198L${pt(near)}" stroke="#9e8559" stroke-dasharray="3 5" opacity=".8"/><circle cx="310" cy="198" r="36" fill="#ebbc5a" opacity=".04"/><circle cx="310" cy="198" r="21" fill="url(#mil-sun)"/>${text(310,236,'Sola','mil-label')}`;
    s+=`<path class="mil-light" marker-end="url(#mil-arrow)" d="M310 174L${summer[0]} ${summer[1]+18}"/><circle cx="${summer[0]}" cy="${summer[1]}" r="15" fill="url(#mil-earth)" stroke="#bce4e2"/><path d="M${summer[0]-3} ${summer[1]-9}q10 4 6 13q-8 6-10-1Z" fill="#8db89b" opacity=".8"/>${text(summer[0]+(summer[1]<60?29:0),summer[1]<60?summer[1]-3:summer[1]-28,'Nordlig sommer','mil-label',summer[1]<60?'start':'middle')}`;
    s+=`<circle cx="${winter[0]}" cy="${winter[1]}" r="11" fill="#456676" opacity=".6"/>${text(winter[0],Math.min(371,winter[1]+29),'Nordlig vinter','mil-small')}`;
    s+=`<circle cx="${near[0]}" cy="${near[1]}" r="4" fill="#edc577"/>${text(near[0]+(near[0]>310?13:-13),near[1]-9,'Perihel','mil-small',near[0]>310?'start':'end')}<circle cx="${far[0]}" cy="${far[1]}" r="3" fill="#6b8b9a"/>`;
    s+=text(18,362,state.trueShape?'Virkelig baneform':'Eksentrisiteten er forstørret ×10','mil-note','start');s+=text(602,362,'Avstand i nordlig sommer: '+fmt(m.distanceAU,3)+' AU','mil-note','end');
    return s;
  }
  function tiltDiagram(p){
    const cx=363,cy=195,R=104,t=rad(p.tilt),axis=[-Math.sin(t),-Math.cos(t)],normal=[-Math.cos(rad(65-p.tilt)),-Math.sin(rad(65-p.tilt))],spot=[cx+normal[0]*R,cy+normal[1]*R],length=22/Math.cos(rad(65-p.tilt)),tangent=[-normal[1],normal[0]];
    let s=`<title id="diagram-title">Aksehelning og nordlig sommersol</title><desc id="diagram-desc">Parallelle solstråler rammer en jord som heller ${fmt(p.tilt,2)} grader. Punktet ved 65 grader nord får høyere middagssol når helningen øker. Daglengden inngår også i døgnmiddelet.</desc><defs><clipPath id="mil-globe-clip"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath><linearGradient id="mil-surface"><stop stop-color="#6094a1"/><stop offset=".55" stop-color="#244b60"/><stop offset=".55" stop-color="#0c2436"/><stop offset="1" stop-color="#081d2b"/></linearGradient></defs>`;
    s+=`<path d="M${cx} 48V330" stroke="#315568" stroke-dasharray="4 5"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#mil-surface)" stroke="#7298a5" stroke-width="1.5"/><path d="M${cx-96} ${cy+35}q37-52 80-22q40-21 64-58q18 14 51 22v100H${cx-96}Z" fill="#5d877d" opacity=".55" clip-path="url(#mil-globe-clip)"/>`;
    for(const y of [130,175,220,265])s+=`<path class="mil-light" marker-end="url(#mil-tilt-arrow)" d="M55 ${y}H${cx-R-14}"/>`;
    s+=`<defs><marker id="mil-tilt-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5 1 9Z" fill="#edc577"/></marker></defs>`;
    s+=`<path d="M${cx-axis[0]*140} ${cy-axis[1]*140}L${cx+axis[0]*140} ${cy+axis[1]*140}" stroke="#a5dfbf" stroke-width="3"/>${text(cx+axis[0]*158,cy+axis[1]*158,'N','mil-value')}${text(cx-axis[0]*158,cy-axis[1]*158+5,'S','mil-small')}`;
    s+=`<path d="M${spot[0]-tangent[0]*length} ${spot[1]-tangent[1]*length}L${spot[0]+tangent[0]*length} ${spot[1]+tangent[1]*length}" stroke="#f0c67a" stroke-width="8" stroke-linecap="round"/><circle cx="${spot[0]}" cy="${spot[1]}" r="4" fill="#fff0b5"/>${text(spot[0]-13,spot[1]-22,'65° N','mil-label','end')}`;
    s+=text(63,102,'Sollys','mil-label','start')+text(520,175,fmt(p.tilt,2)+'°','mil-value')+text(520,198,'aksehelning','mil-small')+text(310,357,'Større helning → høyere sol og lengre sommerdag i nord','mil-note');return s;
  }
  function pathFor(rows,x,y,index=1){return rows.map((row,i)=>(i?'L':'M')+x(row[0]).toFixed(2)+','+y(row[index]).toFixed(2)).join('');}
  function chart(p){
    const future=state.chapter==='future',W=innerWidth<760?520:880,H=405,L=54,R=W-25,start=future?0:-800,end=future?100:0,X=t=>L+(t-start)/(end-start)*(R-L),top=55,bottom=future?325:193,Y=q=>bottom-(q-400)/200*(bottom-top),rows=orbit.filter(r=>r[0]>=start&&r[0]<=end).map(r=>[r[0],q65({e:r[1],perihelion:r[2],tilt:r[3]})]),x=X(state.time),m=metrics(p);
    const svg=$('mil-chart');svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.style.aspectRatio=W+'/'+H;
    let s=`<title id="chart-title">${future?'Framtidig astronomisk solinnstråling':'Beregnet solinnstråling og LR04-klimaproxy'}</title><desc id="chart-desc">${future?'Beregnet sommerinnstråling fra banedata for de neste 100 000 årene, relativt til 1950. Dette er ingen temperaturprognose.':'De siste 800 000 årene. Øverst beregnet døgnmiddelinnstråling ved 65 grader nord ved sommersolverv. Nederst den observerte isotop-proxyen LR04; høyere verdi betyr generelt mer is og eller kaldere dyphav.'}</desc>`;
    s+=text(L,29,'Sommerlys ved 65° N · W/m²','mil-chart-title','start');
    for(const q of [400,450,500,550,600])s+=`<path class="mil-chart-grid" d="M${L} ${Y(q)}H${R}"/>${text(L-10,Y(q)+4,String(q),'mil-chart-tick','end')}`;
    s+=`<path class="mil-chart-insolation" d="${pathFor(rows,X,Y)}"/>`;
    if(!future){
      const proxyRows=proxy.filter(r=>r[0]>=start&&r[0]<=end),PY=v=>354-(v-3)/2.3*104;
      s+=text(L,237,'LR04 · isvolum / dyphav · δ¹⁸O i ‰','mil-chart-title','start');
      for(const q of [3,4,5])s+=`<path class="mil-chart-grid" d="M${L} ${PY(q)}H${R}"/>${text(L-10,PY(q)+4,String(q),'mil-chart-tick','end')}`;
      s+=`<path class="mil-chart-proxy" d="${pathFor(proxyRows,X,PY)}"/>`;
      const v=proxyAt(state.time);if(v!==null)s+=`<circle class="mil-chart-dot" cx="${x}" cy="${PY(v)}" r="4"/>`;
      s+=`<path class="mil-chart-cursor" d="M${x} ${top}V354"/>`;
    }else{s+=`<path class="mil-chart-cursor" d="M${x} ${top}V325"/>`+text(L,364,'Bare banepådriv · ikke en klimaprognose.','mil-chart-key','start');}
    s+=`<circle class="mil-chart-dot" cx="${x}" cy="${Y(m.q65)}" r="4.5"/>`;
    const ticks=future?[0,25,50,75,100]:[-800,-600,-400,-200,0];for(const t of ticks)s+=text(X(t),389,t===0?'1950':(t<0?'−':'+')+Math.abs(t)+'k','mil-chart-tick');
    svg.innerHTML=s;
  }
  function timeLabel(t){if(Math.abs(t)<.00001)return'Referanseåret 1950';return fmt(Math.abs(t)*1000)+' år '+(t<0?'før':'etter')+' 1950';}
  function render(){
    const p=parameters(),m=metrics(p),mechanism=mechanisms[state.mechanism],experiment=state.chapter==='experiment',future=state.chapter==='future';
    document.body.dataset.chapter=state.chapter;document.body.dataset.ready=String(state.ready);
    document.querySelectorAll('[data-chapter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.chapter===state.chapter)));
    document.querySelectorAll('[data-mechanism]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mechanism===state.mechanism)));
    $('mil-diagram').toggleAttribute('hidden',!experiment);$('mil-chart-wrap').hidden=experiment;$('experiment-controls').hidden=!experiment;$('time-controls').hidden=experiment;
    $('mil-q65').replaceChildren(document.createTextNode(fmt(m.q65)+' '));const unit=document.createElement('span');unit.textContent='W/m²';$('mil-q65').append(unit);$('mil-visual-energy').textContent=fmt(m.q65)+' W/m²';
    const delta=m.q65-referenceQ;$('mil-q-delta').textContent=(Math.abs(delta)<.05?'Som dagens nære referansebane':(delta>0?'+':'−')+fmt(Math.abs(delta),1)+' W/m² mot referansebanen');
    $('mil-e-value').textContent=fmt(p.e,4);$('mil-tilt-value').textContent=fmt(p.tilt,2)+'°';$('mil-global-value').textContent=fmt(m.globalMean,1)+' W/m²';
    if(experiment){
      $('figure-title').textContent=mechanism.title;$('lesson-kicker').textContent='Én endring om gangen';$('lesson-title').textContent=mechanism.heading;$('lesson-copy').textContent=mechanism.copy;$('lesson-takeaway').textContent=mechanism.takeaway;$('lesson-limit').textContent='Tallene er døgnmiddel ved toppen av atmosfæren, uten skyer og atmosfærisk demping. De er ikke temperatur.';
      const slider=$('mil-parameter');slider.min=mechanism.min;slider.max=mechanism.max;slider.step=mechanism.step;slider.value=p[mechanism.key];$('parameter-label').textContent=mechanism.label;$('parameter-value').textContent=state.mechanism==='eccentricity'?fmt(p.e,4):fmt(p[mechanism.key],state.mechanism==='tilt'?2:0)+'°';slider.setAttribute('aria-valuetext',$('parameter-value').textContent);$('parameter-hint').textContent=mechanism.hint;
      $('true-shape-label').hidden=state.mechanism==='tilt';$('figure-caption').textContent=state.mechanism==='tilt'?'Et snitt gjennom jorda ved nordlig sommersolverv. Parallelle stråler og aksehelning viser hvorfor høye breddegrader får mer sommerlys.':state.trueShape?'Baneformen følger den virkelige eksentrisiteten. Sola, jorda og avstandene har ulike størrelsesskalaer.':'Eksentrisiteten er forstørret ×10 for å gjøre den synlig. Energitallene bruker den virkelige verdien.';
      $('mil-diagram').innerHTML=state.mechanism==='tilt'?tiltDiagram(p):orbitDiagram(p);
    }else{
      $('figure-title').textContent=future?'De neste 100 000 årene · banepådriv':'800 000 år · to forskjellige spor';$('lesson-kicker').textContent=future?'Langsomt pådriv · rask oppvarming':'Beregning møter klimaproxy';
      $('lesson-title').textContent=future?'Denne kurven er ikke en klimaprognose.':'Syklusene er en del av forklaringen.';
      $('lesson-copy').textContent=future?'Banene omfordeler sommerenergi over titusener av år. De små baneendringene de nærmeste århundrene kan ikke oppveie den raske oppvarmingen fra menneskeskapte drivhusgasser.':'Istidene har ikke fulgt hver solenergibølge én til én. Isdekker og hav reagerer tregt; isens refleksjon og CO₂ kan forsterke endringene. Derfor må sommerlyset sees sammen med klimaets tilbakekoblinger.';
      const v=proxyAt(state.time);$('lesson-takeaway').textContent=future?'Når en framtidig istid kan begynne, avhenger også av hvor mye CO₂ som blir værende i atmosfæren. Det kan ikke leses ut av banekurven alene.':(v===null?'':`LR04 ved markøren: ${fmt(v,2)} ‰. `)+'Høyere verdi tyder generelt på mer global is og/eller kaldere dyphav. Den er ikke en direkte temperaturmåling.';
      $('lesson-limit').textContent=future?'Grafen viser bare den astronomiske fordelingen av sollys. Den beregner ikke framtidig oppvarming, isdekke eller tidspunktet for neste istid.':'LR04s aldersmodell er delvis astronomisk justert. Sammenstillingen er derfor ikke et uavhengig bevis alene.';
      $('figure-caption').textContent=future?'Samme astronomiske løsning som historikken. År regnes fra 1950. Ingen proxy- eller temperaturdata er tegnet inn for framtiden.':'Gull: beregnet solenergi ved sommersolverv. Blått: LR04 fra sedimentkjerner. Ulike enheter og ulik respons — felles tidsakse.';
      const slider=$('mil-time');slider.min=future?0:-800;slider.max=future?100:0;slider.value=state.time;slider.setAttribute('aria-valuetext',timeLabel(state.time));$('mil-time-value').textContent=timeLabel(state.time);$('time-control-title').textContent=future?'Astronomisk tid framover':'Tidspunkt i klimahistorien';
      $('time-data-note').textContent=future?'Beregnet banepådriv · Berger (1978) via NOAA · 0 = 1950. Framtidig klima krever også kunnskap om drivhusgasser og tilbakekoblinger.':'Baner: Berger (1978) via NOAA · is-/dyphavsproxy: LR04 · 0 = 1950.';
      chart(p);
    }
    $('mil-play').textContent=state.playing?'Pause tidslinjen':'Spill tidslinjen';$('mil-play').setAttribute('aria-pressed',String(state.playing));
  }
  function stop(){state.playing=false;if(frame)cancelAnimationFrame(frame);frame=0;}
  function setTime(t){const min=state.chapter==='future'?0:-800,max=state.chapter==='future'?100:0;state.time=clamp(t,min,max);if(state.chapter==='future')futureTime=state.time;else historyTime=state.time;render();}
  function presets(){const items=state.chapter==='future'?[[0,'1950 · referanse'],[10,'+10 000 år'],[50,'+50 000 år'],[100,'+100 000 år']]:[[-125,'Varm mellomistid · 125 000 år'],[-20,'Istidsmaksimum · 20 000 år'],[0,'1950 · referanse']];$('time-presets').replaceChildren();for(const [time,label]of items){const button=document.createElement('button');button.type='button';button.dataset.time=time;button.textContent=label;button.addEventListener('click',()=>{stop();setTime(time);});$('time-presets').append(button);}}
  document.querySelectorAll('[data-chapter]').forEach(button=>button.addEventListener('click',()=>{stop();state.chapter=button.dataset.chapter;state.time=state.chapter==='future'?futureTime:historyTime;presets();render();}));
  document.querySelectorAll('[data-mechanism]').forEach(button=>button.addEventListener('click',()=>{state.mechanism=button.dataset.mechanism;render();}));
  $('mil-parameter').addEventListener('input',e=>{state[mechanisms[state.mechanism].key]=Number(e.target.value);render();});$('true-shape').addEventListener('change',e=>{state.trueShape=e.target.checked;render();});$('reset-parameters').addEventListener('click',()=>{Object.assign(state,reference);render();});$('mil-time').addEventListener('input',e=>{stop();setTime(Number(e.target.value));});
  $('mil-play').addEventListener('click',()=>{if(state.playing){stop();render();return;}const max=state.chapter==='future'?100:0;if(state.time>=max)state.time=state.chapter==='future'?0:-800;state.playing=true;last=lastPaint=performance.now();render();frame=requestAnimationFrame(tick);});
  function tick(now){if(!state.playing||document.hidden)return;const dt=Math.min(.1,(now-last)/1000);last=now;const max=state.chapter==='future'?100:0;state.time=Math.min(max,state.time+dt*12);if(now-lastPaint>70||state.time>=max){lastPaint=now;setTime(state.time);}if(state.time>=max){stop();render();}else frame=requestAnimationFrame(tick);}
  $('mil-chart').addEventListener('pointerdown',e=>{if(state.chapter==='experiment')return;const svg=$('mil-chart'),p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse()),W=innerWidth<760?520:880,f=clamp((p.x-54)/(W-79),0,1);stop();setTime(state.chapter==='future'?f*100:-800+f*800);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();render();}});matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches){stop();render();}});addEventListener('resize',render);
  window.MilankovitchLab={snapshot:()=>({...state,parameters:parameters(),metrics:metrics(parameters()),proxy:state.chapter==='experiment'?null:proxyAt(state.time),dataSummary:{orbital:orbit.length,proxy:proxy.length,timeReference:1950}}),calc:metrics,dailyInsolation,globalMean,atTime,proxyAt,setTime};
  render();$('chapter-history').disabled=$('chapter-future').disabled=true;
  fetch(new URL('milankovitch-data.json',base)).then(response=>{if(!response.ok)throw Error('data');return response.json();}).then(value=>{data=value;orbit=data.orbital;proxy=data.proxy;if(orbit.length!==901||proxy.length<600)throw Error('incomplete data');state.ready=true;$('chapter-history').disabled=$('chapter-future').disabled=false;$('mil-status').textContent='';render();}).catch(()=>{$('mil-status').textContent='Historikkdata kunne ikke lastes. Baneeksperimentet kan fortsatt brukes; last siden på nytt for tidslinjene.';});
})();
