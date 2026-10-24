/* A coordinated geometry lesson. Circular mean orbits; not a dated eclipse ephemeris. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),TAU=2*Math.PI,D=Math.PI/180,PS=29.530589,PE=365.256,PM=1/(1/PS+1/PE),RE=6371,RM=1737.4,RS=696340,AU=149597870,INC=5.145*D;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),sky=$('observer-sky'),ctx=sky.getContext('2d');
  const state={scene:'phases',days:PS/4,offset:0,yearView:false,playing:false,aligned:false,distance:'near',node:Math.PI/3};
  let request=0,last=0;
  const mod=(x,n)=>((x%n)+n)%n,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),norm=v=>{const m=Math.hypot(...v);return v.map(n=>n/m);},fmt=(v,n=1)=>new Intl.NumberFormat('nb-NO',{maximumFractionDigits:n}).format(v);
  const pos=(cx,cy,r,a)=>[cx-r*Math.cos(a),cy+r*Math.sin(a)],pt=p=>p.map(n=>n.toFixed(2)).join(' ');
  function geometry(){
    const days=state.scene==='phases'?state.days:(state.scene==='solar'?0:PS/2)+state.offset/360*PS;
    const phase=state.scene==='phases'?mod(days/PS,1)*TAU:(state.scene==='solar'?0:Math.PI)+state.offset*D,year=days/PE*TAU,longitude=year+Math.PI+phase;
    const beta=Math.asin(Math.sin(INC)*Math.sin(longitude-state.node)),moon=[Math.cos(beta)*Math.cos(longitude),Math.cos(beta)*Math.sin(longitude),Math.sin(beta)],sun=[-Math.cos(year),-Math.sin(year),0],cosElong=clamp(dot(moon,sun),-1,1),fraction=(1-cosElong)/2,distance=state.distance==='near'?360000:405000;
    const observerMoon=moon.map((v,i)=>v*distance-sun[i]*RE),observerDistance=Math.hypot(...observerMoon),view=norm(observerMoon),sunRadius=Math.asin(RS/(AU-RE)),moonRadius=Math.asin(RM/observerDistance),separation=Math.acos(clamp(dot(view,sun),-1,1));
    let solar='none';if(cosElong>0&&separation<sunRadius+moonRadius)solar=separation<=Math.abs(moonRadius-sunRadius)?moonRadius>=sunRadius?'total':'annular':'partial';
    const along=-distance*cosElong,impact=distance*Math.sqrt(Math.max(0,1-cosElong*cosElong)),umbra=RE-along*(RS-RE)/AU,penumbra=RE+along*(RS+RE)/AU;
    let lunar='none';if(along>0){if(impact+RM<=umbra)lunar='total';else if(impact-RM<umbra)lunar='partial';else if(impact-RM<penumbra)lunar='penumbral';}
    const tangent=[Math.sin(year),-Math.cos(year),0],sepX=Math.atan2(dot(view,tangent),dot(view,sun)),sepY=Math.atan2(view[2],dot(view,sun));
    return {days,phase,year,beta,moon,sun,fraction,distance,separation,sunRadius,moonRadius,solar,lunar,impact,umbra,penumbra,sepX,sepY,phaseDay:mod(days,PS),synodicPeriod:PS,siderealPeriod:PM};
  }
  function phaseName(g){const f=mod(g.phase/TAU,1);if(f<.018||f>.982)return 'Nymåne';if(Math.abs(f-.25)<.018)return 'Første kvarter';if(Math.abs(f-.5)<.018)return 'Fullmåne';if(Math.abs(f-.75)<.018)return 'Siste kvarter';return f<.25?'Voksende månesigd':f<.5?'Voksende måne':f<.75?'Avtagende måne':'Avtagende månesigd';}
  const lunarNames={none:'Månen passerer utenfor skyggen',penumbral:'Halvskyggeformørkelse',partial:'Delvis måneformørkelse',total:'Total måneformørkelse'},solarNames={none:'Ingen solformørkelse',partial:'Delvis solformørkelse',total:'Total solformørkelse',annular:'Ringformet solformørkelse'};
  function halfBody(cx,cy,r,type='moon',rotate=0){const a=type==='earth'?'#2e6170':'#494d51',b=type==='earth'?'#8ec4c1':'#e5e4d8';return `<g transform="translate(${cx} ${cy}) rotate(${rotate})"><circle r="${r}" fill="${a}"/><path d="M0 ${-r}A${r} ${r} 0 0 0 0 ${r}Z" fill="${b}"/><circle r="${r}" fill="none" stroke="${type==='earth'?'#aacfc9':'#c7d1cf'}" stroke-opacity=".5"/></g>`;}
  function diagram(g){
    const svg=$('system-scene');let s=`<defs><radialGradient id="system-sun"><stop stop-color="#fff5b9"/><stop offset="1" stop-color="#e8a84c"/></radialGradient><marker id="system-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="#e8c47c" stroke-width="2"/></marker><linearGradient id="earth-shadow"><stop stop-color="#000" stop-opacity=".48"/><stop offset="1" stop-color="#000" stop-opacity=".05"/></linearGradient></defs>`;
    for(let i=0;i<31;i++){const x=25+(i*157)%870,y=25+(i*83)%355;s+=`<circle cx="${x}" cy="${y}" r="${i%4===0?1.1:.65}" fill="#a5c8d1" opacity="${i%3===0?.25:.12}"/>`;}
    if(state.yearView){
      const cx=440,cy=255,r=185,earth=[cx+r*Math.cos(g.year),cy-r*Math.sin(g.year)],m=[earth[0]-48*Math.cos(g.phase+g.year),earth[1]+48*Math.sin(g.phase+g.year)];
      s+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#799b9e" stroke-opacity=".4" stroke-dasharray="4 7"/><circle cx="${cx}" cy="${cy}" r="38" fill="url(#system-sun)"/><circle cx="${earth[0]}" cy="${earth[1]}" r="48" fill="none" stroke="#8bc7b6" stroke-opacity=".35"/>${halfBody(...earth,16,'earth',-g.year/D)}${halfBody(...m,4.4,'moon',-g.year/D)}<text class="system-scene-label" x="${cx-18}" y="${cy+65}">Sola</text><text class="system-scene-label" x="${earth[0]+22}" y="${earth[1]+7}">Jorda og månen</text><text class="system-scene-note" x="35" y="45">Ett jordår · ca. 365,3 døgn</text><text class="system-scene-note" x="35" y="518">Månens bane rundt jorda går samtidig med jordas bane rundt sola.</text>`;
    }else{
      const ex=520,ey=225,r=155,m=pos(ex,ey,r,g.phase),nodeAngle=state.node-(g.year+Math.PI),n1=pos(ex,ey,r,nodeAngle),n2=pos(ex,ey,r,nodeAngle+Math.PI);
      s+=`<circle cx="95" cy="${ey}" r="48" fill="url(#system-sun)"/><circle cx="95" cy="${ey}" r="63" fill="none" stroke="#f4cf78" stroke-opacity=".08" stroke-width="17"/><text class="system-scene-label" x="73" y="${ey+77}">Sola</text>`;
      for(const y of [ey-43,ey,ey+43])s+=`<path d="M185 ${y}H315" stroke="#e8c47c" stroke-width="1.7" stroke-opacity=".8" marker-end="url(#system-arrow)"/>`;
      s+=`<text class="system-scene-note" x="215" y="${ey-70}">Sollys</text><circle cx="${ex}" cy="${ey}" r="${r}" fill="none" stroke="#8bbdb9" stroke-opacity=".43" stroke-dasharray="4 6"/><path d="M${pt(n1)}L${pt(n2)}" stroke="#72a5c7" stroke-opacity=".45" stroke-dasharray="3 6"/>`;
      if(state.scene==='lunar')s+=`<path d="M${ex+32} ${ey-31}L875 ${ey-74}V${ey+74}L${ex+32} ${ey+31}Z" fill="#86a9b8" opacity=".12"/><path d="M${ex+33} ${ey-27}L875 ${ey-9}V${ey+9}L${ex+33} ${ey+27}Z" fill="url(#earth-shadow)"/>`;
      if(state.scene==='solar'&&Math.cos(g.phase)>.8)s+=`<path d="M${m[0]} ${m[1]-11}L${ex-25} ${ey-5}V${ey+5}L${m[0]} ${m[1]+11}Z" fill="#111920" opacity=".8"/>`;
      s+=halfBody(ex,ey,34,'earth')+halfBody(...m,9.3,'moon');
      for(const n of [n1,n2])s+=`<circle cx="${n[0]}" cy="${n[1]}" r="4" fill="#8dbbd5" stroke="#0a1a24" stroke-width="2"/>`;
      s+=`<text class="system-scene-label" x="${ex-20}" y="${ey+64}">Jorda</text><text class="system-scene-label" x="${m[0]+16}" y="${m[1]-7}">Månen</text><text class="system-scene-small" x="700" y="90">Blå punkter: knutene</text><text class="system-scene-small" x="700" y="107">Her krysser månen jordbanens plan.</text><path d="M25 418H895" stroke="#85a8b3" stroke-opacity=".18"/>`;
      // Side projection separates orbital latitude from the deceptive top view.
      const sy=492,sm=[m[0],sy-g.beta/D*8],sidePath=[];for(let i=0;i<=100;i++){const a=i/100*TAU,b=Math.asin(Math.sin(INC)*Math.sin(g.year+Math.PI+a-state.node));sidePath.push(pos(ex,sy,r,a).map((v,k)=>k?sy-b/D*8:v));}
      s+=`<text class="system-scene-note" x="30" y="447">Fra siden</text><text class="system-scene-small" x="30" y="465">Høyden er forstørret for å vise 5,1°.</text><path d="M260 ${sy}H875" stroke="#809ca2" stroke-dasharray="5 5" stroke-opacity=".55"/><path d="M${sidePath.map(pt).join('L')}" fill="none" stroke="#72a5c7" stroke-opacity=".4"/>`;
      if(state.scene==='solar')s+=`<path d="M${sm[0]+8} ${sm[1]}H${ex+32}" stroke="#141a1c" stroke-width="8"/><path d="M${sm[0]+8} ${sm[1]}H${ex+32}" stroke="#9c823f" stroke-opacity=".35" stroke-width="1"/>`;
      if(state.scene==='lunar')s+=`<path d="M${ex+13} ${sy-14}L845 ${sy-6}V${sy+6}L${ex+13} ${sy+14}Z" fill="#000" opacity=".55"/>`;
      s+=halfBody(ex,sy,14,'earth')+halfBody(...sm,4,'moon')+`<text class="system-scene-small" x="735" y="${sy+28}">Jordbanens plan</text>`;
    }
    svg.innerHTML=`<desc id="diagram-description">${state.yearView?'Jorda beveger seg rundt sola, mens månen beveger seg rundt jorda.':'Øverst vises månen sett over nordpolen, nederst høyden over eller under jordbanens plan.'}</desc>`+s;
  }
  function moonDisk(g,cx,cy,r){
    const image=ctx.createImageData(2*r,2*r),p=image.data,cosA=2*g.fraction-1,sinA=Math.sqrt(Math.max(0,1-cosA*cosA))*(Math.sin(g.phase)>=0?1:-1);
    for(let y=0;y<r*2;y++)for(let x=0;x<r*2;x++){const nx=(x+.5-r)/r,ny=(y+.5-r)/r,z2=1-nx*nx-ny*ny;if(z2<0)continue;const z=Math.sqrt(z2),light=nx*sinA+z*cosA,crater=.95+.035*Math.sin(nx*33+ny*7)*Math.sin(ny*25),v=light>0?(168+65*Math.sqrt(light))*crater:28+7*z,i=(y*r*2+x)*4;p[i]=v;p[i+1]=v*.995;p[i+2]=v*.94;p[i+3]=255;}
    ctx.putImageData(image,cx-r,cy-r);
  }
  function observer(g){
    ctx.clearRect(0,0,sky.width,sky.height);const cx=160,cy=140,r=86;
    if(state.scene==='solar'){
      const sunR=70,moonR=sunR*g.moonRadius/g.sunRadius,dx=-g.sepX/g.sunRadius*sunR,dy=-g.sepY/g.sunRadius*sunR;
      const glow=ctx.createRadialGradient(cx,cy,60,cx,cy,110);glow.addColorStop(0,'#e7bc6150');glow.addColorStop(1,'#e7bc6100');ctx.fillStyle=glow;ctx.fillRect(30,10,260,260);ctx.fillStyle='#f1cf80';ctx.beginPath();ctx.arc(cx,cy,sunR,0,TAU);ctx.fill();
      if(Math.abs(dx)<250&&Math.abs(dy)<250){ctx.fillStyle='#09131b';ctx.beginPath();ctx.arc(cx+dx,cy+dy,moonR,0,TAU);ctx.fill();}
      ctx.strokeStyle='#ecbd6750';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,sunR,0,TAU);ctx.stroke();
    }else{
      moonDisk(g,cx,cy,r);
      if(state.scene==='lunar'&&g.lunar!=='none'){
        const tangent=[Math.sin(g.year),-Math.cos(g.year),0],sx=-g.distance*dot(g.moon,tangent)/RM*r,sy=g.distance*g.moon[2]/RM*r;
        ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.clip();ctx.fillStyle='#09131b65';ctx.beginPath();ctx.arc(cx+sx,cy+sy,g.penumbra/RM*r,0,TAU);ctx.fill();ctx.fillStyle='#5d2924e6';ctx.beginPath();ctx.arc(cx+sx,cy+sy,g.umbra/RM*r,0,TAU);ctx.fill();ctx.restore();
      }
    }
  }
  function render(){
    const g=geometry(),name=phaseName(g),phaseScene=state.scene==='phases';document.body.dataset.scene=state.scene;
    document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===state.scene)));document.querySelectorAll('[data-phase]').forEach(b=>b.setAttribute('aria-pressed',String(Math.abs(mod(g.phase/TAU,1)-Number(b.dataset.phase))<.018)));
    $('phase-presets').hidden=!phaseScene;$('eclipse-controls').hidden=phaseScene;$('distance-controls').hidden=state.scene!=='solar';
    $('system-play').setAttribute('aria-pressed',String(state.playing));$('system-play').textContent=state.playing?'Pause':!phaseScene?'Spill passasjen':state.yearView?'Spill året':'Spill måneden';
    $('system-time').min=phaseScene?'0':'-2';$('system-time').max=phaseScene?(state.yearView?String(PE):String(PS)):'2';$('system-time').step=phaseScene?'0.01':'0.01';$('system-time').value=phaseScene?String(mod(state.days,state.yearView?PE:PS)):String(state.offset);
    $('time-label').textContent=phaseScene?(state.yearView?'Gjennom jordåret':'Gjennom månemåneden'):'Flytt månen forbi linjen';$('time-value').textContent=phaseScene?fmt(mod(state.days,state.yearView?PE:PS))+' døgn':fmt(state.offset,2)+'°';
    $('year-view').setAttribute('aria-pressed',String(state.yearView));$('year-view').textContent=state.yearView?'Se månebanen':'Se jordas årsbane';$('phase-name').textContent=name;$('illuminated').textContent=fmt(g.fraction*100,0)+' %';
    $('align-node').setAttribute('aria-pressed',String(state.aligned));$('miss-node').setAttribute('aria-pressed',String(!state.aligned));$('near-moon').setAttribute('aria-pressed',String(state.distance==='near'));$('far-moon').setAttribute('aria-pressed',String(state.distance==='far'));
    if(phaseScene){$('scene-kicker').textContent='Det du ser';$('diagram-title').textContent=state.yearView?'Jordas og månens bevegelse':'Sett ovenfra · over nordpolen';$('diagram-status').textContent='Samme sollys. Skiftende synsvinkel.';$('observer-label').textContent='Fra jorda · nordlig halvkule';$('observer-caption').textContent='Måneskiven vises med skjematisk orientering.';$('scene-explanation').textContent=g.fraction<.02?'Den solbelyste siden vender nesten helt bort fra jorda. Månen er nær sola på himmelen.':g.fraction>.98?'Den solbelyste siden vender mot oss. Vi ser nesten hele måneskiven opplyst.':'Vi ser en del av månens solbelyste halvdel. Den andre delen av skiven er månens egen natt.';$('scene-takeaway').textContent='Månefaser skyldes synsvinkelen vår, ikke jordas skygge.';}
    else if(state.scene==='solar'){$('scene-kicker').textContent=solarNames[g.solar];$('diagram-title').textContent='Nymåne · kan måneskyggen treffe jorda?';$('diagram-status').textContent=solarNames[g.solar];$('observer-label').textContent='Fra jorda · solskiven';$('observer-caption').textContent='Et sted nær formørkelsens sentrallinje.';$('scene-explanation').textContent=g.solar==='none'?'Det er nymåne, men månen ligger ikke rett foran solskiven for denne observatøren. Se høydeforskjellen i sidevisningen.':g.solar==='total'?'Månen dekker solskiven helt. Jordoverflaten har bare en smal sone med total solformørkelse.':g.solar==='annular'?'Månen er lenger unna og ser litt mindre ut enn sola. En lys ring blir igjen rundt månen.':'Månen dekker bare en del av solskiven. Flytt litt videre for å se hvordan overlappingen endres.';$('scene-takeaway').textContent='Solformørkelse krever nymåne og treff nær en knute i den skrå månebanen.';}
    else{$('scene-kicker').textContent=lunarNames[g.lunar];$('diagram-title').textContent='Fullmåne · kan jordskyggen treffe månen?';$('diagram-status').textContent=lunarNames[g.lunar];$('observer-label').textContent='Fra jorda · måneskiven';$('observer-caption').textContent='Jordskyggen kommer i tillegg til månefasen.';$('scene-explanation').textContent=g.lunar==='none'?'Det er fullmåne, men månen passerer over eller under jordskyggen. Fullmåne alene er ikke nok.':g.lunar==='total'?'Hele månen ligger i jordas helskygge. Noe rødt sollys bøyes gjennom atmosfæren og kan gjøre månen rødlig.':g.lunar==='partial'?'Bare en del av månen går inn i jordas helskygge. Resten er lysere.':'Månen passerer gjennom halvskyggen, der jorda bare skjermer en del av sola. Dempingen er svak.';$('scene-takeaway').textContent='Måneformørkelse krever fullmåne og treff nær en knute i den skrå månebanen.';}
    sky.setAttribute('aria-label',phaseScene?name+', '+fmt(g.fraction*100,0)+' prosent belyst':state.scene==='solar'?solarNames[g.solar]:lunarNames[g.lunar]);diagram(g);observer(g);
  }
  function stop(){state.playing=false;if(request)cancelAnimationFrame(request);request=0;render();}
  function tick(now){request=0;if(!state.playing||document.hidden)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;if(state.scene==='phases')state.days+=dt*(state.yearView?18:.9);else{state.offset+=dt*.12;if(state.offset>2)state.offset=-2;}render();request=requestAnimationFrame(tick);}
  function start(){state.playing=true;last=0;if(!request&&!document.hidden)request=requestAnimationFrame(tick);render();}
  function align(value){state.aligned=value;const g=geometry();state.node=g.year+Math.PI+(value?0:Math.PI/2);render();}
  function scene(value){stop();state.scene=value;state.yearView=false;state.offset=0;state.days=value==='lunar'?PS/2:value==='solar'?0:PS/4;state.distance='near';align(value!=='phases');}
  document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>scene(b.dataset.scene)));
  document.querySelectorAll('[data-phase]').forEach(b=>b.addEventListener('click',()=>{stop();state.days=Number(b.dataset.phase)*PS;render();}));
  $('system-time').addEventListener('input',e=>{const value=Number(e.target.value);stop();if(state.scene==='phases')state.days=value;else state.offset=value;render();});
  $('system-play').addEventListener('click',()=>state.playing?stop():start());$('year-view').addEventListener('click',()=>{state.yearView=!state.yearView;render();});
  $('align-node').addEventListener('click',()=>align(true));$('miss-node').addEventListener('click',()=>align(false));$('near-moon').addEventListener('click',()=>{state.distance='near';render();});$('far-moon').addEventListener('click',()=>{state.distance='far';render();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(request)cancelAnimationFrame(request);request=0;}else if(state.playing){last=0;request=requestAnimationFrame(tick);}});reduced.addEventListener('change',e=>{if(e.matches)stop();});
  window.EarthMoonLab={snapshot:()=>({...state,...geometry(),phaseName:phaseName(geometry())}),set(options){stop();if(options.scene)scene(options.scene);if(Number.isFinite(options.days))state.days=options.days;if(Number.isFinite(options.offset))state.offset=options.offset;if(options.distance)state.distance=options.distance;if('aligned'in options)align(options.aligned);if('yearView'in options)state.yearView=Boolean(options.yearView);render();}};
  render();document.body.dataset.ready='true';
})();
