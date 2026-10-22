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
  function fitLayout() {
    const lab=document.querySelector('.tsunami');
    const maximum=Math.min(innerWidth,innerWidth>=1550&&innerHeight>=850?1480:1240);
    const minimum=Math.min(maximum,300);
    lab.classList.remove('fit-compact');
    const fits=width=>{
      lab.style.setProperty('--fit-width',width+'px');
      const box=lab.getBoundingClientRect();
      return box.height<=innerHeight-.5 && lab.scrollWidth<=Math.ceil(box.width)+1;
    };
    function chooseWidth(){
      if(fits(maximum))return true;
      // Wrapping changes in steps, so sample downward before refining the first
      // fitting interval. The figure always keeps its original proportions.
      let best=0,upper=maximum;
      for(let width=maximum-24;width>=minimum;width-=24){
        if(fits(width)){best=width;break;}
        upper=width;
      }
      if(!best&&fits(minimum))best=minimum;
      if(!best)return false;
      for(let i=0;i<8&&upper-best>1;i++){
        const width=(upper+best)/2;
        if(fits(width))best=width;else upper=width;
      }
      lab.style.setProperty('--fit-width',Math.floor(best)+'px');
      return true;
    }
    if(!chooseWidth()){
      lab.classList.add('fit-compact');
      if(!chooseWidth())lab.style.setProperty('--fit-width',maximum+'px');
    }
    // Changing the focused range's layout must not scroll the title out of view.
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
    $('play').setAttribute('aria-pressed',String(playing));
    $('play').setAttribute('aria-label',playing?'Sett animasjonen på pause':'Spill av animasjonen');
    $('play-label').textContent=playing?'Pause':'Spill av';
    $('play').querySelector('[aria-hidden]').textContent=playing?'Ⅱ':'▷';
  }
  function pause() {
    playing=false;cancelAnimationFrame(raf);raf=0;last=0;lastPaint=0;playbackUI();
  }
  function tick(now) {
    if(!playing)return;
    if(!last)last=now;
    const delta=Math.min(250,now-last)/1000;
    last=now;
    mainFrame=Math.min(stages[stage].end,mainFrame+delta*reference.fps);
    elapsed+=delta*reference.fps;
    // Use the original frame rate; the main timeline holds at each explanation
    // while nested rings, smoke, magma and arrows can keep moving.
    if(now-lastPaint>=1000/reference.fps-1){render();lastPaint=now;}
    raf=requestAnimationFrame(tick);
  }
  function play() {
    if(playing || document.hidden)return;
    playing=true;last=0;lastPaint=0;playbackUI();raf=requestAnimationFrame(tick);
  }
  function selectStage(next,autoplay=!reduced.matches,updateHash=true) {
    pause();stage=clamp(next,0,stages.length-1);
    const current=stages[stage];mainFrame=current.start;elapsed=0;
    $('stage-title').textContent=`Slik oppstår en tsunami – ${stage+1}: ${current.title}`;
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
  $('play').addEventListener('click',()=>{
    if(playing)return pause();
    if(mainFrame>=stages[stage].end && stages[stage].end>stages[stage].start){mainFrame=stages[stage].start;elapsed=0;render();}
    play();
  });
  range.addEventListener('input',()=>{
    pause();const current=stages[stage],t=Number(range.value)/100;
    mainFrame=current.start+t*(current.end-current.start);
    elapsed=t*(current.end-current.start);render();
  });
  $('fullscreen').addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(_){}
  });
  document.addEventListener('fullscreenchange',()=>{
    $('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Avslutt fullskjerm':'Åpne fullskjerm');
    $('fullscreen').title=document.fullscreenElement?'Avslutt fullskjerm':'Fullskjerm';
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
    if(event.key===' '){event.preventDefault();$('play').click();}
    if(event.key==='ArrowRight'&&stage<stages.length-1){event.preventDefault();selectStage(stage+1);}
    if(event.key==='ArrowLeft'&&stage>0){event.preventDefault();selectStage(stage-1);}
  });
  reduced.addEventListener('change',event=>{if(event.matches)pause();});
  addEventListener('resize',fitLayout);
  document.fonts?.ready.then(fitLayout);
  if(embedded){
    document.documentElement.classList.add('embedded');
    $('back').textContent='← Geografi / Meny';
    $('back').addEventListener('click',event=>{event.preventDefault();parent.postMessage({type:'tsunami-model-back'},location.origin);});
    addEventListener('message',event=>{
      if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='tsunami-model-host')return;
      const visible=!!event.data.visible;
      if(!visible)pause();
      else if(!hostVisible)selectStage(0,false);
      hostVisible=visible;
    });
  }
  // First opening is a still world map. Subsequent steps animate when selected.
  selectStage(hashStage() ?? 0,false,false);
})();
