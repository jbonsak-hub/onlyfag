/* A top-down river journey. Coordinates and downstream links come from data.json. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),canvas=$('river-map'),ctx=canvas.getContext('2d',{alpha:false});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const palette=['#d690b9','#7dc9b7','#d8ba79','#9b9bd7','#99c67f','#d78f73','#7dbbd7','#b79ad1','#c6cb7a','#79b6a2','#da9fa0','#9db4da'];
  const state={ready:false,mode:'flow',paused:reduced.matches,speed:1,progress:0,completed:false,zoom:1,pan:[0,0],route:[],selectedSegment:null,basin:null,selectedStart:null,rain:false};
  let data,segments=[],byId=new Map(),basins=new Map(),upstream=new Set(),route=[],routeLength=0,duration=30,particles=[];
  let width=0,height=0,dpr=1,camera={scale:1,tx:0,ty:0},extent=[0,0,1,1],base=document.createElement('canvas'),dirty=true,last=performance.now(),hover=null,lastHover=null,selectedPrefix=null;
  const pointers=new Map();let gesture=null,drag=null,suppress=0,domTime=0;
  const id=value=>String(value),point=(p)=>[Number(p[0])-extent[0],data.yUp?extent[3]-Number(p[1]):Number(p[1])-extent[1]];
  const screen=p=>({x:p[0]*camera.scale+camera.tx,y:p[1]*camera.scale+camera.ty});
  const world=(x,y)=>[(x-camera.tx)/camera.scale,(y-camera.ty)/camera.scale];
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const riverName=value=>{const text=String(value||'');return text===text.toLocaleUpperCase('nb-NO')?text.toLocaleLowerCase('nb-NO').replace(/(^|[ /-])(\p{L})/gu,(_m,p,c)=>p+c.toLocaleUpperCase('nb-NO')):text;};
  function metrics(points){let length=0;const totals=[0];for(let i=1;i<points.length;i++){length+=distance(points[i-1],points[i]);totals.push(length);}return {length,totals};}
  function at(points,totals,d){let low=1,high=points.length-1;while(low<high){const mid=(low+high)>>1;if(totals[mid]<d)low=mid+1;else high=mid;}const i=Math.max(1,low),a=points[i-1],b=points[i],f=Math.max(0,Math.min(1,(d-totals[i-1])/(totals[i]-totals[i-1]||1)));return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];}
  function path(points){const p=new Path2D();points.forEach((v,i)=>i?p.lineTo(...v):p.moveTo(...v));return p;}
  function section(s,from,to){const points=[at(s.points,s.totals,from)];for(let i=1;i<s.points.length-1;i++)if(s.totals[i]>from&&s.totals[i]<to)points.push(s.points[i]);points.push(at(s.points,s.totals,to));return path(points);}
  function setStatus(message){if($('status').textContent!==message)$('status').textContent=message;}
  function updateCamera(){
    const player=$('player').getBoundingClientRect(),top=Math.max(100,$('masthead').getBoundingClientRect().bottom+20),bottom=Math.max(top+100,player.top-24);
    // On wide screens the small player sits beside the tall Norwegian network,
    // leaving its entire height available rather than shrinking it above a bar.
    const side=width>=1100&&height>=650&&player.width<500;
    const available=side?{x:player.right+36,y:86,w:width-player.right-72,h:height-126}:{x:width<600?16:52,y:top,w:width-(width<600?32:104),h:bottom-top};
    const fit=.96*Math.min(available.w/(extent[2]-extent[0]),available.h/(extent[3]-extent[1]));
    camera={scale:fit*state.zoom,tx:available.x+available.w/2-(extent[2]-extent[0])/2*fit*state.zoom+state.pan[0],ty:available.y+available.h/2-(extent[3]-extent[1])/2*fit*state.zoom+state.pan[1]};dirty=true;
  }
  function resize(){width=canvas.clientWidth;height=canvas.clientHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=base.width=Math.round(width*dpr);canvas.height=base.height=Math.round(height*dpr);if(state.ready)updateCamera();}
  function paintBase(){
    const c=base.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#040807';c.fillRect(0,0,width,height);
    const glow=c.createRadialGradient(width*.5,height*.4,0,width*.5,height*.4,Math.max(width,height)*.65);glow.addColorStop(0,'#0a151370');glow.addColorStop(1,'#04080700');c.fillStyle=glow;c.fillRect(0,0,width,height);
    c.translate(camera.tx,camera.ty);c.scale(camera.scale,camera.scale);c.lineCap='round';c.lineJoin='round';
    if(data.context){c.strokeStyle='#6a898020';c.lineWidth=.6/camera.scale;for(const line of data.context)c.stroke(path(line.map(point)));}
    if(state.mode==='basin'){
      const basin=basins.get(state.basin);if(basin?.path){c.fillStyle=basin.color+'0b';c.strokeStyle=basin.color+'66';c.lineWidth=.8/camera.scale;c.fill(basin.path,'evenodd');c.stroke(basin.path);}
    }
    for(const s of segments){
      const selected=s.basin===state.basin,contributing=upstream.has(s.id);
      c.globalAlpha=state.mode==='basin'?(contributing&&s.id!==state.selectedSegment?.98:selected?.28:.12):(selected?.98:.76);
      c.strokeStyle=basins.get(s.basin).color;c.lineWidth=s.weight*Math.pow(state.zoom,.2)/camera.scale;c.stroke(s.path);
    }
    if(state.mode==='basin'&&selectedPrefix){const s=byId.get(state.selectedSegment);c.globalAlpha=.95;c.strokeStyle=basins.get(s.basin).color;c.lineWidth=s.weight/camera.scale;c.stroke(selectedPrefix);}
    c.globalAlpha=1;
    if(route.length){c.strokeStyle='#f2f3dc';c.globalAlpha=state.mode==='basin'?.25:.32;c.lineWidth=1.1/camera.scale;for(const piece of route)c.stroke(piece.path);}
    c.setTransform(1,0,0,1,0,0);dirty=false;
  }
  function walk(segment){const ids=[],seen=new Set();let s=segment;while(s&&!seen.has(s.id)){seen.add(s.id);ids.push(s.id);s=s.next===null?null:byId.get(s.next);}return ids;}
  function makeRoute(ids,fraction=0){let sum=0;return ids.map((key,i)=>{const s=byId.get(key),start=i===0?s.length*Math.max(0,Math.min(.99999,fraction)):0,length=s.length-start;const piece={segment:s,start,length,offset:sum,path:start?section(s,start,s.length):s.path};sum+=length;return piece;}).filter(s=>s.length>0);}
  function routePosition(pieces,amount){const total=pieces.at(-1)?.offset+pieces.at(-1)?.length||0;const d=Math.max(0,Math.min(1,amount))*total;let piece=pieces.at(-1);for(const p of pieces){if(d<=p.offset+p.length){piece=p;break;}}return piece?{point:at(piece.segment.points,piece.segment.totals,piece.start+Math.max(0,d-piece.offset)),segment:piece.segment}:null;}
  function controls(){
    const paused=state.paused||state.completed;$('pause').querySelector('span').textContent=state.completed?'Spill igjen':paused?'Spill av':'Pause';
    $('pause').setAttribute('aria-label',state.completed?'Spill reisen igjen':paused?'Spill av reisen':'Sett reisen på pause');
    $('pause').querySelector('svg').innerHTML=paused?'<path d="m7 5 7 5-7 5Z"/>':'<path d="M7 5v10m6-10v10"/>';
    $('progress').value=state.progress;$('rain').setAttribute('aria-pressed',String(state.rain));
    for(const mode of ['flow','basin']){$('mode-'+mode).setAttribute('aria-pressed',String(state.mode===mode));$('mode-'+mode).classList.toggle('is-active',state.mode===mode);}
  }
  function selectSegment(segment,fraction=0,startId=null){
    if(!segment)return;
    state.selectedSegment=segment.id;state.selectedFraction=Math.max(0,Math.min(.99999,fraction));state.basin=segment.basin;state.route=walk(segment);state.progress=0;state.completed=false;state.selectedStart=startId;state.paused=reduced.matches;
    selectedPrefix=section(segment,0,segment.length*state.selectedFraction);
    route=makeRoute(state.route,fraction);routeLength=route.reduce((n,p)=>n+p.length,0);duration=Math.max(12,Math.min(42,12+Math.sqrt(routeLength/(data.unitsPerKm||1000))*2));
    upstream=new Set();const stack=[segment.id];while(stack.length){const key=stack.pop();if(upstream.has(key))continue;upstream.add(key);stack.push(...byId.get(key).parents);}
    const basin=basins.get(state.basin);document.documentElement.style.setProperty('--basin-color',basin.color);$('basin-name').textContent=basin.name;$('river-name').textContent=riverName(segment.name)||'Fra sideelv til hovedløp';
    const km=routeLength/(data.unitsPerKm||1000);$('distance').textContent='ca. '+new Intl.NumberFormat('nb-NO',{maximumFractionDigits:km<10?1:0}).format(km)+' km';
    const names=[];for(const piece of route){const n=riverName(piece.segment.name);if(n&&names.at(-1)!==n)names.push(n);}
    const ending=basin.outletLabel||'Vassdragets utløp';if(names.at(-1)!==ending)names.push(ending);$('route-stages').textContent=names.length>1?names.join(' → '):'Sideelvene samles på vei mot '+ending.toLocaleLowerCase('nb-NO');
    $('start-point').value=startId||'';setStatus(reduced.matches?'Reisen er klar. Trykk Spill av for å følge dråpen.':'Dråpen følger elven nedstrøms. Klikk en annen elv for å starte der.');
    for(const key of ['pause','replay','rain'])$(key).disabled=false;dirty=true;controls();
  }
  function restart(){if(!state.ready)return;state.progress=0;state.completed=false;state.paused=false;controls();setStatus('Dråpen starter reisen på nytt.');}
  function nearest(x,y){
    const p=world(x,y),limit=(width<600?20:13)/camera.scale;let hit=null,best=limit*limit;
    for(const s of segments){const b=s.bounds;if(p[0]<b[0]-limit||p[0]>b[2]+limit||p[1]<b[1]-limit||p[1]>b[3]+limit)continue;
      for(let i=1;i<s.points.length;i++){const a=s.points[i-1],b=s.points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1))),d=(p[0]-a[0]-dx*t)**2+(p[1]-a[1]-dy*t)**2;if(d<best){best=d;hit={segment:s,fraction:(s.totals[i-1]+distance(a,b)*t)/s.length};}}
    }return hit;
  }
  function dot(c,p,color,r,halo=1){const q=screen(p);if(q.x<0||q.x>width||q.y<0||q.y>height)return;c.shadowColor=color;c.shadowBlur=13*halo;c.fillStyle=color;c.beginPath();c.arc(q.x,q.y,r,0,Math.PI*2);c.fill();c.shadowBlur=0;}
  function fillParticles(){particles=[];const candidates=segments.filter(s=>s.routable!==false&&s.next!==null&&s.length>0);for(let i=0;i<(width<600?28:64);i++){const s=candidates[Math.floor(Math.random()*candidates.length)];if(!s)break;particles.push({route:makeRoute(walk(s)),progress:Math.random(),speed:.012+Math.random()*.018,color:basins.get(s.basin).color});}}
  function frame(now){
    const dt=Math.min(.15,Math.max(0,(now-last)/1000));last=now;
    if(state.ready&&!document.hidden&&(dirty||!state.paused||hover!==lastHover)){
      if(!state.paused&&!state.completed){state.progress=Math.min(1,state.progress+dt*state.speed/duration);if(state.progress===1){state.completed=true;state.paused=true;controls();setStatus('Dråpen har nådd '+(basins.get(state.basin).outletLabel||'vassdragets utløp')+'. Spill reisen igjen eller velg en ny elv.');}}
      if(dirty)paintBase();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(base,0,0);ctx.setTransform(dpr,0,0,dpr,0,0);
      if(state.rain){for(const particle of particles){if(!state.paused)particle.progress=(particle.progress+dt*particle.speed*state.speed)%1;const p=routePosition(particle.route,particle.progress);if(p)dot(ctx,p.point,particle.color,.9,.35);}}
      const pos=routePosition(route,state.progress);
      if(pos){
        const q=screen(pos.point);ctx.strokeStyle='#e4f8ee';ctx.globalAlpha=.2;ctx.lineWidth=1;ctx.beginPath();ctx.arc(q.x,q.y,state.completed?11:8,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
        // A short luminous tail follows the actual downstream geometry.
        for(let k=12;k>0;k--){const p=routePosition(route,Math.max(0,state.progress-k*.0015));if(p){ctx.globalAlpha=(1-k/14)*.5;dot(ctx,p.point,'#d3f9e2',Math.max(.6,2.6-k*.14),.5);}}
        ctx.globalAlpha=1;dot(ctx,pos.point,'#f4fff6',3.1,1);dot(ctx,pos.point,'#ffffff',1.2,0);
        if(now-domTime>180){$('progress').value=state.progress;$('river-name').textContent=state.completed?'Reisen er fremme':riverName(pos.segment.name)||'Langs sideelvene';domTime=now;}
      }
      if(hover){ctx.strokeStyle=basins.get(hover.basin).color;ctx.lineWidth=2/camera.scale;ctx.translate(camera.tx,camera.ty);ctx.scale(camera.scale,camera.scale);ctx.stroke(hover.path);ctx.setTransform(dpr,0,0,dpr,0,0);}
      lastHover=hover;
    }
    requestAnimationFrame(frame);
  }
  function zoom(factor,x=width/2,y=height/2){if(!state.ready)return;const anchor=world(x,y),old=camera.scale;state.zoom=Math.max(1,Math.min(12,state.zoom*factor));updateCamera();state.pan[0]+=x-(anchor[0]*camera.scale+camera.tx);state.pan[1]+=y-(anchor[1]*camera.scale+camera.ty);if(state.zoom===1)state.pan=[0,0];updateCamera();}
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-Math.max(-120,Math.min(120,e.deltaY))*.0035),e.offsetX,e.offsetY);},{passive:false});
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);drag={x:e.clientX,y:e.clientY,moved:false};if(pointers.size===2){const [a,b]=[...pointers.values()],center=[(a[0]+b[0])/2,(a[1]+b[1])/2];gesture={distance:distance(a,b),center,anchor:world(...center),zoom:state.zoom};suppress=performance.now()+400;}});
  canvas.addEventListener('pointermove',e=>{
    if(pointers.has(e.pointerId)){const prior=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);
      if(pointers.size===2){const [a,b]=[...pointers.values()],d=distance(a,b),center=[(a[0]+b[0])/2,(a[1]+b[1])/2];if(gesture&&gesture.distance>0){state.zoom=Math.max(1,Math.min(12,gesture.zoom*d/gesture.distance));updateCamera();state.pan[0]+=center[0]-(gesture.anchor[0]*camera.scale+camera.tx);state.pan[1]+=center[1]-(gesture.anchor[1]*camera.scale+camera.ty);updateCamera();}drag.moved=true;suppress=performance.now()+400;}
      else if(drag&&(drag.moved||Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)){state.pan[0]+=e.clientX-prior[0];state.pan[1]+=e.clientY-prior[1];drag.moved=true;dirty=true;updateCamera();suppress=performance.now()+300;}
    }else if(state.ready){hover=nearest(e.offsetX,e.offsetY)?.segment||null;canvas.style.cursor=hover?(hover.routable===false?'help':'pointer'):'grab';}
  });
  function endPointer(e){if(!pointers.has(e.pointerId))return;const moved=drag?.moved||pointers.size>1;pointers.delete(e.pointerId);gesture=null;if(!moved&&state.ready){const hit=nearest(e.offsetX,e.offsetY);if(hit?.segment.routable===false)setStatus('Denne sideelven vises i kartet, men reisen til utløpet er ikke klar her. Velg et startsted i listen.');else if(hit)selectSegment(hit.segment,hit.fraction);else setStatus('Velg en av elvene, eller bruk listen med startsteder.');}if(!pointers.size)drag=null;}
  canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',()=>{pointers.clear();drag=null;gesture=null;});canvas.addEventListener('pointerleave',()=>{hover=null;});
  canvas.addEventListener('keydown',e=>{if(['+','=','-','0',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='0')$('reset').click();else if(e.key===' ')$('pause').click();else if(['+','=','-'].includes(e.key))zoom(e.key==='-'?1/1.4:1.4);else{state.pan[0]+=e.key==='ArrowLeft'?40:e.key==='ArrowRight'?-40:0;state.pan[1]+=e.key==='ArrowUp'?40:e.key==='ArrowDown'?-40:0;updateCamera();}}});
  $('pause').addEventListener('click',()=>{if(state.completed)return restart();state.paused=!state.paused;controls();setStatus(state.paused?'Reisen er satt på pause.':'Dråpen følger vannet videre.');});
  $('replay').addEventListener('click',restart);$('speed').addEventListener('change',()=>{state.speed=Number($('speed').value);});
  $('rain').addEventListener('click',()=>{state.rain=!state.rain;if(state.rain){if(state.completed&&!reduced.matches)restart();fillParticles();}dirty=true;controls();setStatus(state.rain?'Regnet viser hvordan sideelvene samles i vassdragene.':'Regnet er slått av.');});
  $('reset').addEventListener('click',()=>{state.zoom=1;state.pan=[0,0];if(state.ready)updateCamera();});
  for(const mode of ['flow','basin'])$('mode-'+mode).addEventListener('click',()=>{state.mode=mode;dirty=true;controls();setStatus(mode==='basin'?'Fargen viser vassdraget. De lyseste sideelvene leder vann til startpunktet.':'Følg dråpen mot vassdragets utløp.');});
  $('start-point').addEventListener('change',()=>{const start=data.starts.find(s=>id(s.id)===$('start-point').value);if(start)selectSegment(byId.get(id(start.segment)),Number(start.fraction)||0,id(start.id));});
  reduced.addEventListener('change',()=>{if(reduced.matches){state.paused=true;state.rain=false;controls();}});
  addEventListener('resize',resize);new ResizeObserver(()=>{if(state.ready)updateCamera();}).observe($('player'));
  window.DropPrototype={snapshot:()=>({...state,route:[...state.route],pan:[...state.pan],camera:{...camera},routeLength,duration,outlet:state.route.at(-1),dataSummary:{segments:segments.length,basins:basins.size}}),worldToScreen:raw=>{const p=screen(point(raw)),r=canvas.getBoundingClientRect();return {x:p.x+r.x,y:p.y+r.y};}};
  async function load(){
    try{
      setStatus('Henter elvenettet …');const response=await fetch('../assets/geography/drop-prototype/data-9e1129e2f625.json');if(!response.ok)throw Error('data');data=await response.json();extent=data.bounds;data.unitsPerKm=data.unitsPerKm||1000;
      data.basins.forEach((b,i)=>{const basin={...b,id:id(b.id),color:b.color||palette[i%palette.length]};if(b.rings){basin.path=new Path2D();for(const ring of b.rings){const p=ring.map(point);basin.path.addPath(path([...p,p[0]]));}}basins.set(basin.id,basin);});
      segments=data.segments.map(s=>{const points=s.points.map(point),m=metrics(points),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return {...s,id:id(s.id),basin:id(s.basin),next:s.next==null?null:id(s.next),points,...m,path:path(points),parents:[],bounds:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]};});
      byId=new Map(segments.map(s=>[s.id,s]));for(const s of segments){if(!basins.has(s.basin)||s.points.length<2||s.length<=0)throw Error('invalid river');if(s.next!==null){const next=byId.get(s.next);if(!next||next.basin!==s.basin)throw Error('invalid downstream link');next.parents.push(s.id);}s.weight=s.area?.35+Math.min(1.8,Math.log2(1+Number(s.area))*.115):.3+Math.min(7,Number(s.order)||1)*.14;}
      const select=$('start-point');select.replaceChildren(new Option('Velg en elv i kartet',''));for(const s of data.starts)select.add(new Option(s.label,id(s.id)));
      if(!data.starts.length)throw Error('no starting places');
      if(!data.basins.some(b=>b.rings))$('mode-basin').textContent='Se sideelvene';
      $('source-credit').replaceChildren(document.createTextNode(data.source.title+' · '));const credit=document.createElement('a');credit.href=data.source.url;credit.textContent=data.source.license;credit.target='_blank';credit.rel='noopener';$('source-credit').append(credit);
      const description=data.description||['Et nedbørfelt samler vann mot et felles utløp. Fargene viser seks norske vassdrag. De lyseste sideelvene leder vann til startpunktet du har valgt.','Klikk på en elv eller velg et startsted i listen. Prototypen følger kartlagte elveløp; den beregner ikke avrenning fra vilkårlige punkter på land. Noen mindre sidegrener vises bare som bakgrunn.','Dråpen viser vannets vei gjennom elvenettet. Tempoet er tilpasset visningen og viser ikke hvor lang tid vannet bruker i virkeligheten.'];
      $('about-copy').replaceChildren();for(const text of description){const p=document.createElement('p');p.textContent=text;$('about-copy').append(p);}
      state.ready=true;document.body.dataset.ready='true';resize();const first=data.starts.find(s=>basins.get(id(byId.get(id(s.segment)).basin))?.name==='Glomma')||data.starts[0];selectSegment(byId.get(id(first.segment)),Number(first.fraction)||0,id(first.id));updateCamera();
    }catch(error){setStatus('Kartet kunne ikke lastes. Last siden på nytt for å prøve igjen.');document.body.dataset.error='true';console.error('River prototype:',error);}
  }
  resize();requestAnimationFrame(frame);load();
})();
