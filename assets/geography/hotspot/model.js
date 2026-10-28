/* A reversible teaching sequence. Progress is schematic, not calibrated geological time. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const clamp = n => Math.max(0, Math.min(1, n));
  const ramp = (n, a, b) => clamp((n-a)/(b-a));
  const smooth = n => n*n*(3-2*n);
  const f = n => Number(n.toFixed(2));
  const islands = [
    {name:'Kauai',birth:0,age:'5,6–3,8 millioner år',detail:'Kauai er blant de eldste hovedøyene. Den er ført langt mot nordvest. Erosjon har skåret daler i vulkanlandskapet.'},
    {name:'Oahu',birth:.2,age:'3,4–2,2 millioner år',detail:'Oahu ble hovedsakelig bygd opp av to store skjoldvulkaner. Plata har siden ført øya videre mot nordvest.'},
    {name:'Molokai',birth:.42,age:'1,8–1,3 millioner år',detail:'Molokai viser et yngre ledd i kjeden. Øya følger samme platebevegelse som de andre øyene.'},
    {name:'Maui',birth:.64,age:'1,3–0,8 millioner år',detail:'Maui er yngre enn øyene i nordvest. Vulkanen Haleakalā regnes fortsatt som aktiv; disse aldrene angir ikke siste utbrudd.'},
    {name:'Hawaii',birth:.84,age:'Yngre enn 0,7 millioner år',detail:'Hawaii er den yngste av hovedøyene. Vulkanene Kīlauea og Mauna Loa bygger fortsatt øya med nye lavastrømmer.'}
  ];
  const stages = [
    ['Vulkanen vokser fra havbunnen','Varmt mantelmateriale stiger ved hotspotet. Litt smelter og blir til magma. Magmaen bygger en vulkan som etter hvert når over havet.'],
    ['Plata tar øya med seg','Kauai flyttes mot nordvest sammen med Stillehavsplata. Hotspotet blir omtrent på samme sted, og en ny vulkan bygges opp lenger sørøst.'],
    ['Et spor av vulkanøyer','Nye vulkaner vokser mens eldre øyer flyttes videre. Magmatilførselen avtar når en vulkan kommer bort fra hotspotet.'],
    ['Øyer eldes og endres','Øyene mot nordvest er eldre. Erosjon tærer på dem, og berggrunnen kan synke langsomt. Flere vulkaner kan være aktive samtidig.'],
    ['Hawaii vokser fortsatt','Hawaii ligger nå over den aktive delen av hotspotet. Øykjeden viser retningen Stillehavsplata har beveget seg: de eldste øyene ligger mot nordvest.']
  ];
  let progress=0, playing=false, lastTime=0, raf=0, selected=0, lastStage=-1, userSelected=false, hostVisible=true;
  const embedded = new URLSearchParams(location.search).get('embedded') === '1';
  if (embedded) document.documentElement.classList.add('embedded');
  function stageIndex(p) {return p<.18?0:p<.4?1:p<.62?2:p<.83?3:4;}
  function state(i,p) {
    const age=p-islands[i].birth;
    const growth=smooth(ramp(age,0,.12));
    const erosion=1-.3*ramp(age,.23,.95);
    return {age,growth,x:790-650*age,height:145*growth*erosion,width:(34+53*growth)*(1+.1*ramp(age,.3,1)),active:age>=0&&age<.21};
  }
  function islandArt(i,s) {
    const x=s.x,w=s.width,h=s.height,y=302;
    const tip=y-h, green=clamp((h-83)/28);
    const points=`M${f(x-w)} ${y}C${f(x-w*.55)} ${f(y-17)} ${f(x-w*.35)} ${f(tip+25)} ${f(x)} ${f(tip)}C${f(x+w*.17)} ${f(tip+5)} ${f(x+w*.42)} ${f(y-28)} ${f(x+w)} ${y}Z`;
    const ridge=`M${f(x)} ${f(tip)} ${f(x+w*.22)} ${f(tip+h*.47)} ${f(x+w)} ${y}H${f(x+w*.18)}L${f(x-w*.12)} ${f(tip+h*.6)}Z`;
    const emerged=h>88;
    const coastline=emerged?f(w*Math.pow((h-88)/h,.76)):0;
    return `<g data-feature="island" data-island-id="${i}" data-x="${f(x)}" data-growth="${f(s.growth)}"><ellipse cx="${f(x+13)}" cy="296" rx="${f(w+15)}" ry="14" fill="#245c67" opacity=".18"/><path d="${points}" fill="url(#island-rock)" stroke="#72765a" stroke-width="1"/><path d="${ridge}" fill="#526c50" opacity=".55"/>${emerged?`<path d="M${f(x-coastline)} 214Q${f(x-18)} ${f(tip+13)} ${f(x)} ${f(tip)}Q${f(x+17)} ${f(tip+10)} ${f(x+coastline)} 214Q${f(x)} 225 ${f(x-coastline)} 214Z" fill="#5a8256" opacity="${f(.45*green)}"/><path d="M${f(x-coastline)} 214Q${f(x)} 224 ${f(x+coastline)} 214" stroke="#d1c695" stroke-width="2" fill="none"/>`:''}${s.age>.22?`<path d="m${f(x-3)} ${f(tip+17)}-${f(w*.26)} ${f(h*.55)}m${f(w*.27)}-${f(h*.45)} ${f(w*.27)} ${f(h*.44)}" fill="none" stroke="#45634e" stroke-width="1.5" opacity="${f(ramp(s.age,.22,.7)*.6)}"/>`:''}</g>`;
  }
  function chooseIsland(i,manual=false) {
    selected=i; userSelected=manual;
    $('island-kicker').textContent='Omtrentlig hovedoppbygging';
    $('island-title').textContent=islands[i].name;
    $('island-description').textContent=islands[i].age+'. '+islands[i].detail;
    document.querySelectorAll('.island-picker button').forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));
    document.querySelectorAll('.island-target').forEach(b=>b.classList.toggle('selected',Number(b.dataset.island)===i));
  }
  function draw(p) {
    const states=islands.map((_,i)=>state(i,p));
    $('islands').innerHTML=states.map((s,i)=>s.age>=0?islandArt(i,s):'').join('');
    const translation=f(-650*p);
    let material='';
    for(let i=-1;i<13;i++)material+=`<path d="M${i*130} 302h130v75H${i*130}Z" fill="url(#plate-stripes)"/><circle cx="${i*130+31}" cy="338" r="3.4" fill="#ded9b6" opacity=".55"/>`;
    $('plate-material').setAttribute('transform',`translate(${translation} 0)`);
    if (!$('plate-material').innerHTML) $('plate-material').innerHTML=material;
    const active=states.map((s,i)=>({s,i})).filter(({s})=>s.age>=0&&s.age<.21);
    // A broad melt region can feed a volcano as it moves; warm mantle stays fixed.
    $('magma').innerHTML=active.map(({s,i})=>{
      const tip=302-s.height,opacity=Math.max(.15,1-ramp(s.age,.16,.22));
      return `<g opacity="${f(opacity)}" data-feeding="${i}"><path d="M775 376C${f(s.x+18)} 344 ${f(s.x+4)} 320 ${f(s.x)} ${f(tip+7)}" stroke="#b25a3d" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M775 376C${f(s.x+18)} 344 ${f(s.x+4)} 320 ${f(s.x)} ${f(tip+7)}" stroke="#ffbd70" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="${f(s.x)}" cy="${f(tip+8)}" rx="7" ry="3" fill="#ffe4a0"/>${s.height>85?`<path d="m${f(s.x)} ${f(tip+8)} 7 17 6 7" stroke="#ed9157" stroke-width="3" fill="none"/>`:''}</g>`;
    }).join('');
    $('island-labels').innerHTML=states.map((s,i)=>{
      if(s.age<.055)return '';
      const y=302-s.height, ly=Math.max(75,y-39);
      // Keep the northwest motion cue clear while older islands pass beneath it.
      const labelY=s.x<410?Math.max(156,ly):i===4?ly-6:ly;
      return `<g class="island-target${selected===i?' selected':''}" data-island="${i}" role="button" tabindex="0" aria-label="Les om ${islands[i].name}"><title>Les om ${islands[i].name}</title><path d="M${f(s.x)} ${f(y-5)}V${f(labelY+7)}" class="island-leader"/><text x="${f(s.x)}" y="${f(labelY)}" text-anchor="middle" class="island-name">${islands[i].name}</text><rect class="focus-ring" x="${f(s.x-46)}" y="${f(labelY-24)}" width="92" height="34" rx="7"/></g>`;
    }).join('');
    // Pause before a keyboard user enters a label, keeping its focused SVG node intact.
    document.querySelectorAll('.island-target').forEach(el=>{
      const choose=()=>{stop();chooseIsland(Number(el.dataset.island),true);if(matchMedia('(max-width:900px)').matches)openInfo();};
      el.addEventListener('focus',stop);
      el.addEventListener('click',choose);
      el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose();}});
    });
    const stage=stageIndex(p);
    if(stage!==lastStage){
      $('stage-number').textContent=String(stage+1).padStart(2,'0');
      $('stage-explanation').textContent=stages[stage][1];
      lastStage=stage;
    }
    if(!userSelected){const newest=Math.max(0,states.findLastIndex(s=>s.age>=.055));chooseIsland(newest);}
    $('progress').value=String(f(p*100));
    $('progress-value').textContent=Math.round(p*100)+' %';
    $('progress').setAttribute('aria-valuetext',Math.round(p*100)+' prosent. '+stages[stage][0]);
  }
  function stop(){playing=false;cancelAnimationFrame(raf);$('play').setAttribute('aria-pressed','false');$('play').textContent='▶ Spill av';}
  function tick(now){
    if(!playing)return;
    if(lastTime)progress=clamp(progress+(now-lastTime)/42000);
    lastTime=now;draw(progress);
    if(progress===1)stop();else raf=requestAnimationFrame(tick);
  }
  function reset(){stop();progress=0;userSelected=false;lastStage=-1;chooseIsland(0);draw(0);}
  $('progress').addEventListener('input',()=>{stop();progress=Number($('progress').value)/100;userSelected=false;draw(progress);});
  $('play').addEventListener('click',()=>{if(playing)return stop();if(progress>=1)reset();playing=true;lastTime=0;$('play').textContent='Ⅱ Pause';$('play').setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);});
  $('reset').addEventListener('click',reset);
  document.querySelectorAll('.island-picker button').forEach((b,i)=>b.addEventListener('click',()=>chooseIsland(i,true)));
  function setTheme(dark,persist=false){
    document.documentElement.dataset.theme=dark?'dark':'light';
    $('theme').setAttribute('aria-pressed',String(dark));$('theme').setAttribute('aria-label',dark?'Bytt til lys visning':'Bytt til mørk visning');
    if(persist)try{localStorage.setItem('onlyfag-hotspot-theme',dark?'dark':'light');}catch{}
  }
  try{setTheme(localStorage.getItem('onlyfag-hotspot-theme')==='dark');}catch{setTheme(false);}
  $('theme').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme!=='dark',true));
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}});
  let infoOpen=false,returnFocus=null;
  function openInfo(){
    if(infoOpen)return;
    stop();infoOpen=true;returnFocus=document.activeElement;$('explanation').classList.add('open');$('explanation').setAttribute('role','dialog');$('explanation').setAttribute('aria-modal','true');$('info-backdrop').hidden=false;$('info-close').focus();
  }
  function closeInfo(){
    if(!infoOpen)return;
    infoOpen=false;$('explanation').classList.remove('open');$('explanation').removeAttribute('role');$('explanation').removeAttribute('aria-modal');$('info-backdrop').hidden=true;if(returnFocus?.isConnected)returnFocus.focus();
  }
  $('info-toggle').addEventListener('click',openInfo);$('info-close').addEventListener('click',closeInfo);$('info-backdrop').addEventListener('click',closeInfo);
  document.addEventListener('keydown',event=>{
    if(!infoOpen)return;
    if(event.key==='Escape'){event.preventDefault();closeInfo();}
    if(event.key==='Tab'){
      const els=[...$('explanation').querySelectorAll('button,a,summary')].filter(el=>el.getClientRects().length);
      const first=els[0],last=els[els.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  const narrow=matchMedia('(max-width:900px)');narrow.addEventListener('change',()=>{if(!narrow.matches)closeInfo();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  if(embedded){
    document.querySelector('.back').addEventListener('click',event=>{event.preventDefault();parent.postMessage({type:'hotspot-model-back'},location.origin);});
    addEventListener('message',event=>{
      if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='hotspot-model-host')return;
      setTheme(Boolean(event.data.dark));
      const visible=Boolean(event.data.visible);if(!visible){stop();closeInfo();}else if(!hostVisible)reset();hostVisible=visible;
    });
  }
  reset();
})();
