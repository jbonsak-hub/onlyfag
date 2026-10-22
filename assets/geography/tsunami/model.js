/* Native SVG player for the supplied tsunami animation. Original ActionScript is
   never executed; the reference is a finite set of vectors and timeline data. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const reference = window.TsunamiReference;
  if (!reference || typeof reference.render !== 'function') {
    $('stage-text').textContent = 'Animasjonen kunne ikke lastes. Prøv å laste siden på nytt.';
    return;
  }
  const stages = [
    {title:'Jordas litosfæreplater',start:1,end:1,text:'Kartet viser viktige soner der jordskjelv oppstår, sterkt forenklet. Jordas ytterste, stive lag er delt i store plater som beveger seg langsomt. Jordskjelv oppstår ofte ved plategrensene. Mantelen under er hovedsakelig fast bergart.'},
    {title:'Det indiske hav',start:2,end:66,text:'I området for jordskjelvet 26. desember 2004 møtes India-plata, Burma-mikroplata og Sunda-plata. Burma-mikroplata er en del av det større Sunda-systemet. De røde linjene viser forenklede plategrenser og jordskjelvsoner.'},
    {title:'Jordskjelvet',start:67,end:109,text:'Hovedskjelvet 26. desember 2004 hadde momentmagnitude omtrent 9,1 og startet vest for nordlige Sumatra. Bruddet spredte seg nordover langs plategrensen. Selve jordskjelvet førte også til store ødeleggelser på Sumatra.'},
    {title:'Platene møtes',start:110,end:118,text:'India-plata beveger seg nordøstover mot Burma-mikroplata. Pilene viser bevegelsen. Men hva skjer der platene møtes?'},
    {title:'Et tverrsnitt',start:119,end:173,text:'Vi tegner en linje langs bevegelsen fra India-plata mot Burma-mikroplata og kysten av Sumatra. Kameraet dreier ned for å vise et tverrsnitt av jordskorpa langs linja.'},
    {title:'Subduksjonssonen',start:174,end:220,text:'India-plata synker ned under Burma-mikroplata. Der plata bøyes ned, dannes en dyphavsgrop. Dette er en subduksjonssone. Vann fra den synkende plata kan bidra til delvis smelting i mantelen over. Magma kan stige og danne vulkaner.'},
    {title:'Spenning i jordskorpa',start:221,end:342,text:'Friksjon kan holde platekontakten fastlåst. Den overliggende plata trekkes med og bøyes nær grensen, mens platene fortsetter å bevege seg. Slik lagres elastisk energi i berggrunnen.'},
    {title:'Spenningen utløses',start:343,end:370,text:'Når den låste delen brister, glipper kontakten og plata fjærer tilbake. Havbunnen forskyves brått, og vannsøylen over flyttes. Denne forstyrrelsen danner lange bølger som sprer seg utover: en tsunami.'},
    {title:'Tsunamien brer seg',start:371,end:423,text:'På dypt hav kan en tsunami bevege seg rundt 800 km/t. Farten avtar når vannet blir grunnere. I dette eksemplet går først en bølgedal mot øst og en bølgetopp mot vest. Vannet trekker seg derfor ikke alltid tilbake før en tsunami kommer.'},
    {title:'Tsunamien treffer land',start:424,end:622,text:'På dypt hav er bølgen lang og vanligvis lav. Når den når grunnere vann, går den langsommere, bølgelengden blir kortere og høyden kan øke kraftig. Vannet strømmer innover land. En tsunami kan komme som flere bølger og trenger ikke ligne en vanlig brytende bølge.'},
    {title:'Havnebølgen',start:623,end:646,text:'Tsunami betyr «havnebølge» på japansk. Fiskere kunne merke lite ute på dypt hav, men komme tilbake til store ødeleggelser i havna. Modellen er skjematisk: avstander, dybder og tid er ikke i målestokk.'}
  ];
  const svg=$('tsunami-scene'),root=$('scene-content'),range=$('progress');
  const embedded=new URLSearchParams(location.search).get('embedded')==='1';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let stage=0,mainFrame=1,elapsed=0,playing=false,raf=0,last=0,lastPaint=0;
  let hostVisible=!embedded;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function setTheme(dark) {
    document.documentElement.dataset.theme=dark?'dark':'light';
  }
  try{setTheme(localStorage.getItem('geoDarkMode')==='1');}catch(_){setTheme(false);}
  addEventListener('storage',event=>{
    if(!embedded&&event.key==='geoDarkMode')setTheme(event.newValue==='1');
  });
  function fitLayout() {
    const lab=document.querySelector('.tsunami');
    // CSS fits the scene and explanation to the viewport. No repeated forced
    // measurements of the SVG are needed when a step or window size changes.
    lab.style.setProperty('--fit-width',Math.min(innerWidth,1680)+'px');
    scrollTo(0,0);
  }
  $('reference-defs').innerHTML=reference.defs || '';
  svg.setAttribute('viewBox',(reference.crop || [0,25,440,250]).join(' '));
  $('stage-select').innerHTML=stages.map((s,i)=>`<option value="${i+1}">${i+1} · ${s.title}</option>`).join('');

  function render() {
    const current=stages[stage];
    const frame=Math.floor(mainFrame);
    const extra=Math.max(0,elapsed-(frame-current.start));
    reference.render(root,frame,extra);
    const percent=current.end===current.start?0:Math.round((mainFrame-current.start)/(current.end-current.start)*100);
    range.value=String(percent);
    $('progress-value').textContent=percent+' %';
    range.setAttribute('aria-valuetext',`${percent} prosent av trinn ${stage+1}: ${current.title}`);
    svg.dataset.stage=String(stage+1);
    svg.dataset.frame=String(Math.floor(mainFrame));
    svg.dataset.elapsed=String(Math.floor(elapsed));
  }
  function playbackUI() {
    svg.dataset.playing=String(playing);
  }
  function pause() {
    playing=false;cancelAnimationFrame(raf);raf=0;last=0;lastPaint=0;playbackUI();
  }
  function tick(now) {
    if(!playing)return;
    if(!last)last=now;
    // Keep source time tied to elapsed time even if a busy browser misses a
    // frame. Hidden tabs pause explicitly instead of discarding visible time.
    const delta=Math.max(0,now-last)/1000;
    last=now;
    mainFrame=Math.min(stages[stage].end,mainFrame+delta*reference.fps);
    elapsed+=delta*reference.fps;
    // Use the original frame rate; the main timeline holds at each explanation
    // while nested rings, smoke, magma and arrows can keep moving.
    const interval=1000/reference.fps;
    if(now-lastPaint>=interval){
      render();
      // Carry the remainder so 60 Hz screens average the original 25 fps,
      // instead of rounding every update up to three refreshes (20 fps).
      lastPaint=now-((now-lastPaint)%interval);
    }
    raf=requestAnimationFrame(tick);
  }
  function play() {
    if(playing || document.hidden)return;
    playing=true;last=performance.now();lastPaint=last-1000/reference.fps;playbackUI();raf=requestAnimationFrame(tick);
  }
  function selectStage(next,autoplay=!reduced.matches,updateHash=true) {
    pause();stage=clamp(next,0,stages.length-1);
    const current=stages[stage];mainFrame=current.start;elapsed=0;
    $('stage-title').textContent=current.title;
    $('stage-text').textContent=current.text;
    $('scene-description').textContent=`${current.title}. ${current.text} Avstander, høyder og tid er skjematiske.`;
    $('stage-counter').textContent=`Trinn ${stage+1} av ${stages.length}`;
    $('stage-select').value=String(stage+1);
    $('previous').disabled=stage===0;$('next').disabled=stage===stages.length-1;
    range.disabled=current.start===current.end;
    if(updateHash){try{history.replaceState(null,'',location.pathname+location.search+'#trinn-'+(stage+1));}catch(_){}}
    render();
    fitLayout();
    if(autoplay)play();
  }
  function hashStage() {
    const match=/^#trinn-(\d{1,2})$/.exec(location.hash);
    return match && Number(match[1])>=1 && Number(match[1])<=stages.length?Number(match[1])-1:null;
  }
  $('previous').addEventListener('click',()=>selectStage(stage-1));
  $('next').addEventListener('click',()=>selectStage(stage+1));
  $('replay').addEventListener('click',()=>selectStage(stage,true));
  $('stage-select').addEventListener('change',event=>selectStage(Number(event.target.value)-1));
  range.addEventListener('input',()=>{
    pause();const current=stages[stage],t=Number(range.value)/100;
    mainFrame=current.start+t*(current.end-current.start);
    elapsed=t*(current.end-current.start);render();
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)return;
    pause();
    // Hidden iframes may be throttled before the parent's visibility message
    // arrives. Mark the embedded player closed here so reopening always starts
    // at step one as promised by the geography navigation.
    if(embedded)hostVisible=false;
  });
  addEventListener('pagehide',pause);
  addEventListener('hashchange',()=>{const next=hashStage();if(next!==null&&next!==stage)selectStage(next,!reduced.matches,false);});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')$('about').open=false;
    if(event.target.closest('input,select,button,a,summary'))return;
    if(event.key==='ArrowRight'&&stage<stages.length-1){event.preventDefault();selectStage(stage+1);}
    if(event.key==='ArrowLeft'&&stage>0){event.preventDefault();selectStage(stage-1);}
  });
  reduced.addEventListener('change',event=>{if(event.matches)pause();});
  addEventListener('resize',fitLayout);
  document.fonts?.ready.then(fitLayout);
  if(embedded){
    document.documentElement.classList.add('embedded');
    addEventListener('message',event=>{
      if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='tsunami-model-host')return;
      setTheme(!!event.data.dark);
      const visible=!!event.data.visible;
      if(!visible)pause();
      else if(!hostVisible)selectStage(0,false);
      hostVisible=visible;
    });
  }
  // First opening is a still world map. Subsequent steps animate when selected.
  selectStage(hashStage() ?? 0,false,false);
})();
