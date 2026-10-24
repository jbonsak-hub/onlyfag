/* A top-down river journey. Coordinates and downstream links come from data.json. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),canvas=$('river-map'),ctx=canvas.getContext('2d',{alpha:false});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const palette=['#d690b9','#7dc9b7','#d8ba79','#9b9bd7','#99c67f','#d78f73','#7dbbd7','#b79ad1','#c6cb7a','#79b6a2','#da9fa0','#9db4da'];
  const state={ready:false,mode:'flow',mapLayer:'dark',showRivers:true,riverWidth:1.4,riverIntensity:.95,mapOpacity:.85,heightColors:false,isolateBasin:false,mapFocus:false,paused:reduced.matches,speed:1,progress:0,completed:false,zoom:1,pan:[0,0],route:[],selectedSegment:null,basin:null,selectedStart:null,rain:false};
  let data,segments=[],byId=new Map(),basins=new Map(),upstream=new Set(),route=[],routeLength=0,duration=30,particles=[];
  let rainSources=[],rainTributaries=[],rainElapsed=0,rainEmissions=0;
  let width=0,height=0,dpr=1,camera={scale:1,tx:0,ty:0},extent=[0,0,1,1],base=document.createElement('canvas'),dirty=true,last=performance.now(),hover=null,lastHover=null,selectedPrefix=null;
  const pointers=new Map();let gesture=null,drag=null,suppress=0,domTime=0;
  // Kartverket's UTM33 matrix shares the source rivers' CRS. Tile edges and
  // river points use the same camera, without geographic stretching.
  const tiles=new Map(),tileOrigin=[-2500000,9045984],tileResolution=21664;
  const mapScene=document.createElement('canvas'),tileStage=document.createElement('canvas');
  const heightPalette=[[59,105,78],[130,157,112],[191,180,133],[169,140,114],[190,187,175],[245,246,240]];
  // Fixed physical height statistics and one palette for every tile. Dynamic
  // image stretching would assign different heights the same color at seams.
  const elevationRule={rasterFunction:'Colormap',rasterFunctionArguments:{Colorramp:{type:'multipart',colorRamps:heightPalette.slice(1).map((to,i)=>({type:'algorithmic',fromColor:[...heightPalette[i],255],toColor:[...to,255],algorithm:'esriCIELabAlgorithm'}))},Raster:{rasterFunction:'Stretch',rasterFunctionArguments:{Raster:'$$',StretchType:5,Statistics:[[0,2500,1250,700]],DRA:false,Min:0,Max:255,UseGamma:false},outputPixelType:'U8'}},outputPixelType:'U8'};
  let tileLoads=0,tileView=new Set(),exporting=false;
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
    const available=state.mapFocus?{x:24,y:100,w:Math.max(100,width-48),h:Math.max(100,height-160)}:side?{x:player.right+36,y:86,w:width-player.right-72,h:height-126}:{x:width<600?16:52,y:top,w:width-(width<600?32:104),h:bottom-top};
    const fit=.96*Math.min(available.w/(extent[2]-extent[0]),available.h/(extent[3]-extent[1]));
    camera={scale:fit*state.zoom,tx:available.x+available.w/2-(extent[2]-extent[0])/2*fit*state.zoom+state.pan[0],ty:available.y+available.h/2-(extent[3]-extent[1])/2*fit*state.zoom+state.pan[1]};dirty=true;
  }
  function resize(){width=canvas.clientWidth;height=canvas.clientHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=base.width=mapScene.width=tileStage.width=Math.round(width*dpr);canvas.height=base.height=mapScene.height=tileStage.height=Math.round(height*dpr);if(state.ready)updateCamera();}
  function mapStatus(){
    const visible=[...tileView].map(key=>tiles.get(key)).filter(Boolean),pending=visible.some(tile=>tile.status==='loading'||tile.status==='queued'),failed=visible.some(tile=>tile.status==='error');
    $('map-status').textContent=state.mapLayer==='dark'?'':failed?'Noen kartfliser kunne ikke lastes. Bytt kartlag og prøv igjen.':pending?'Laster bakgrunnskart …':'';
    $('export-map').disabled=exporting||!state.ready||(state.mapLayer!=='dark'&&(pending||failed));
  }
  function styleControls(){
    $('river-width-value').textContent=new Intl.NumberFormat('nb-NO',{maximumFractionDigits:1}).format(state.riverWidth)+'×';
    $('river-intensity-value').textContent=Math.round(state.riverIntensity*100)+' %';$('map-opacity-value').textContent=Math.round(state.mapOpacity*100)+' %';
    $('map-opacity').disabled=state.mapLayer==='dark';$('height-colors').disabled=state.mapLayer!=='relief';
    $('height-color-help').textContent=state.mapLayer==='relief'?'En fast fargeskala viser høyde over havet.':'Velg Terrengrelieff for høydefarger.';
    $('height-legend').hidden=state.mapLayer!=='relief'||!state.heightColors||state.mapOpacity===0;
  }
  function drawHeightLegend(c,x,y,w){
    const ramp=c.createLinearGradient(x,0,x+w,0);heightPalette.forEach((rgb,i)=>ramp.addColorStop(i/(heightPalette.length-1),'rgb('+rgb.join(',')+')'));c.fillStyle=ramp;c.fillRect(x,y,w,9);c.font='9px system-ui,sans-serif';c.fillStyle='#c9dace';c.textAlign='left';c.fillText('0 m',x,y+23);c.textAlign='center';c.fillText('1 000 m',x+w*.4,y+23);c.fillText('2 000 m',x+w*.8,y+23);c.textAlign='right';c.fillText('2 500 m',x+w,y+23);c.textAlign='left';
  }
  function initHeightLegend(){
    const title=document.createElement('strong');title.textContent='Høyde over havet';const ramp=document.createElement('div');ramp.className='height-ramp';ramp.style.background='linear-gradient(to right,'+heightPalette.map(rgb=>'rgb('+rgb.join(',')+')').join(',')+')';
    const ticks=document.createElement('div');ticks.className='height-ticks';for(const text of ['0','500','1 000','1 500','2 000','2 500 m']){const tick=document.createElement('span');tick.textContent=text;ticks.append(tick);}
    $('height-legend').replaceChildren(title,ramp,ticks);
  }
  function loadTiles(){
    for(const key of tileView){
      if(tileLoads>=(state.mapLayer==='relief'?4:8))break;
      const tile=tiles.get(key);if(tile.status!=='queued')continue;
      tile.status='loading';tile.attempts=(tile.attempts||0)+1;tileLoads++;const img=new Image();tile.image=img;img.crossOrigin='anonymous';
      let settled=false;const timeout=setTimeout(()=>{done('error');img.src='';},['relief','elevation'].includes(tile.layer)?45000:20000);
      const done=status=>{if(settled)return;settled=true;clearTimeout(timeout);tile.status=status==='error'&&tile.attempts<2?'queued':status;tileLoads--;dirty=true;loadTiles();mapStatus();};
      img.onload=()=>done('ready');img.onerror=()=>done('error');
      if(tile.layer==='elevation'){
        const span=256*tileResolution/2**tile.z,x=tileOrigin[0]+tile.col*span,y=tileOrigin[1]-tile.row*span;
        const query=new URLSearchParams({f:'image',format:'png32',bbox:[x,y-span,x+span,y].join(','),bboxSR:'25833',imageSR:'25833',size:'256,256',interpolation:'RSP_BilinearInterpolation',renderingRule:JSON.stringify(elevationRule)});
        img.src='https://hoydedata.no/arcgis/rest/services/DTM/ImageServer/exportImage?'+query;
      }else if(tile.layer==='relief'){
        const span=256*tileResolution/2**tile.z,x=tileOrigin[0]+tile.col*span,y=tileOrigin[1]-tile.row*span;
        const query=new URLSearchParams({service:'WMS',version:'1.3.0',request:'GetMap',layers:'DTM:multiskyggerelieff',styles:'',crs:'EPSG:25833',bbox:[x,y-span,x+span,y].join(','),width:'256',height:'256',format:'image/png',transparent:'true'});
        img.src='https://wms.geonorge.no/skwms1/wms.hoyde-dtm?'+query;
      }else img.src='https://cache.kartverket.no/v1/wmts/1.0.0/'+tile.layer+'/default/utm33n/'+String(tile.z).padStart(2,'0')+'/'+tile.row+'/'+tile.col+'.png';
    }
  }
  function paintMap(c){
    if(state.mapLayer==='dark'||state.mapOpacity===0){tileView.clear();mapStatus();return;}
    const [west,,,north]=data.source.projectedBounds,units=data.unitsPerKm/1000;
    const z=Math.max(0,Math.min(18,Math.round(Math.log2(tileResolution*units*camera.scale))));
    const a=world(0,0),b=world(width,height),minE=west+(a[0]+extent[0])/units,maxE=west+(b[0]+extent[0])/units,maxN=north-(a[1]+extent[1])/units,minN=north-(b[1]+extent[1])/units;
    const scene=mapScene.getContext('2d'),stage=tileStage.getContext('2d');
    scene.setTransform(dpr,0,0,dpr,0,0);scene.globalAlpha=1;scene.globalCompositeOperation='source-over';scene.fillStyle=state.mapLayer==='relief'?'#13231d':'#e8ecdf';scene.fillRect(0,0,width,height);
    const drawTile=tile=>{
      const sizeInMeters=256*tileResolution/2**tile.z,p=screen([(tileOrigin[0]+tile.col*sizeInMeters-west)*units-extent[0],(north-tileOrigin[1]+tile.row*sizeInMeters)*units-extent[1]]),size=sizeInMeters*units*camera.scale;
      if(p.x+size>=0&&p.x<=width&&p.y+size>=0&&p.y<=height)stage.drawImage(tile.image,p.x,p.y,size+.25,size+.25);
    };
    tileView=new Set();
    const colored=state.mapLayer==='relief'&&state.heightColors,layers=colored?['elevation','relief']:[state.mapLayer];
    for(const layer of layers){
      // Large elevation mosaics exceed the service's source-image limits.
      // Smaller fixed-grid requests retain alignment at the overview scale.
      const level=layer==='elevation'?Math.max(5,z):z,span=256*tileResolution/2**level,count=2**level;
      const firstCol=Math.max(0,Math.floor((minE-tileOrigin[0])/span)),lastCol=Math.min(count-1,Math.floor((maxE-tileOrigin[0])/span)),firstRow=Math.max(0,Math.floor((tileOrigin[1]-maxN)/span)),lastRow=Math.min(count-1,Math.floor((tileOrigin[1]-minN)/span));
      stage.setTransform(1,0,0,1,0,0);stage.clearRect(0,0,tileStage.width,tileStage.height);stage.setTransform(dpr,0,0,dpr,0,0);
      // Compose cached fallback and current tiles at full opacity first.
      // Applying opacity once afterwards avoids dark seams and double blending.
      for(const tile of [...tiles.values()].filter(t=>t.layer===layer&&t.status==='ready'&&t.z!==level).sort((a,b)=>a.z-b.z))drawTile(tile);
      for(let row=firstRow;row<=lastRow;row++)for(let col=firstCol;col<=lastCol;col++){
        const key=[layer,level,row,col].join('/');tileView.add(key);
        if(!tiles.has(key))tiles.set(key,{layer,z:level,row,col,status:'queued'});
        const tile=tiles.get(key);tile.used=performance.now();
        if(tile.status==='ready')drawTile(tile);
      }
      scene.globalCompositeOperation=colored&&layer==='relief'?'multiply':'source-over';scene.globalAlpha=colored&&layer==='relief'?.62:1;
      scene.drawImage(tileStage,0,0,width,height);
    }
    scene.globalCompositeOperation='source-over';scene.globalAlpha=1;
    c.save();c.globalAlpha=state.mapOpacity;c.drawImage(mapScene,0,0,width,height);c.restore();
    // Bound decoded image memory during long exploration. Late responses are
    // always positioned with the current camera on the next repaint.
    if(tiles.size>160)for(const [key,tile] of [...tiles].sort((a,b)=>a[1].used-b[1].used)){if(tiles.size<=160)break;if(!tileView.has(key)&&tile.status!=='loading')tiles.delete(key);}
    loadTiles();mapStatus();
  }
  function paintBase(){
    // The route is translucent. Never carry its alpha into the next opaque
    // background fill: that leaves the old camera's rivers in the cache.
    const c=base.getContext('2d');c.save();c.globalAlpha=1;c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#040807';c.fillRect(0,0,width,height);
    paintMap(c);
    if(!state.showRivers){c.restore();dirty=false;return;}
    if(state.mapLayer==='dark'){const glow=c.createRadialGradient(width*.5,height*.4,0,width*.5,height*.4,Math.max(width,height)*.65);glow.addColorStop(0,'#0a151370');glow.addColorStop(1,'#04080700');c.fillStyle=glow;c.fillRect(0,0,width,height);}
    c.translate(camera.tx,camera.ty);c.scale(camera.scale,camera.scale);c.lineCap='round';c.lineJoin='round';
    if(data.context){c.strokeStyle='#6a898020';c.lineWidth=.6/camera.scale;for(const line of data.context)c.stroke(path(line.map(point)));}
    if(state.mode==='basin'){
      const basin=basins.get(state.basin);if(basin?.path){c.fillStyle=basin.color+'0b';c.strokeStyle=basin.color+'66';c.lineWidth=.8/camera.scale;c.fill(basin.path,'evenodd');c.stroke(basin.path);}
    }
    for(const s of segments){
      if(state.isolateBasin&&s.basin!==state.basin)continue;
      const selected=s.basin===state.basin,contributing=upstream.has(s.id);
      const alpha=(state.mode==='basin'?(contributing&&s.id!==state.selectedSegment?1:selected?.3:.12):(selected?1:.9))*state.riverIntensity,lineWidth=s.weight*Math.pow(state.zoom,.2)*state.riverWidth/camera.scale;
      if(state.mapLayer!=='dark'){c.globalAlpha=alpha*.5;c.strokeStyle='#061b18';c.lineWidth=lineWidth+1.1/camera.scale;c.stroke(s.path);}
      c.globalAlpha=alpha;c.strokeStyle=basins.get(s.basin).color;c.lineWidth=lineWidth;c.stroke(s.path);
    }
    if(state.mode==='basin'&&selectedPrefix){const s=byId.get(state.selectedSegment);c.globalAlpha=state.riverIntensity;c.strokeStyle=basins.get(s.basin).color;c.lineWidth=s.weight*state.riverWidth/camera.scale;c.stroke(selectedPrefix);}
    c.globalAlpha=1;
    if(route.length){c.strokeStyle='#f2f3dc';c.globalAlpha=(state.mode==='basin'?.25:.42)*state.riverIntensity;c.lineWidth=1.1*state.riverWidth/camera.scale;for(const piece of route)c.stroke(piece.path);}
    c.restore();dirty=false;
  }
  function walk(segment){const ids=[],seen=new Set();let s=segment;while(s&&!seen.has(s.id)){seen.add(s.id);ids.push(s.id);s=s.next===null?null:byId.get(s.next);}return ids;}
  function makeRoute(ids,fraction=0){let sum=0;return ids.map((key,i)=>{const s=byId.get(key),start=i===0?s.length*Math.max(0,Math.min(.99999,fraction)):0,length=s.length-start;const piece={segment:s,start,length,offset:sum,path:start?section(s,start,s.length):s.path};sum+=length;return piece;}).filter(s=>s.length>0);}
  function routePosition(pieces,amount){const total=pieces.at(-1)?.offset+pieces.at(-1)?.length||0;const d=Math.max(0,Math.min(1,amount))*total;let piece=pieces.at(-1);for(const p of pieces){if(d<=p.offset+p.length){piece=p;break;}}return piece?{point:at(piece.segment.points,piece.segment.totals,piece.start+Math.max(0,d-piece.offset)),segment:piece.segment}:null;}
  function controls(){
    const replay=state.completed&&!state.rain,paused=state.paused||replay;$('pause').querySelector('span').textContent=replay?'Spill igjen':paused?'Spill av':'Pause';
    $('pause').setAttribute('aria-label',replay?'Spill reisen igjen':paused?'Spill av animasjonen':'Sett animasjonen på pause');
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
    for(const key of ['pause','replay','rain'])$(key).disabled=false;if(state.rain&&state.isolateBasin)fillParticles();dirty=true;controls();
  }
  function restart(){if(!state.ready)return;state.progress=0;state.completed=false;state.paused=false;controls();setStatus('Dråpen starter reisen på nytt.');}
  function nearest(x,y){
    const p=world(x,y),limit=(width<600?20:13)/camera.scale;let hit=null,best=limit*limit;
    for(const s of segments){if(state.isolateBasin&&s.basin!==state.basin)continue;const b=s.bounds;if(p[0]<b[0]-limit||p[0]>b[2]+limit||p[1]<b[1]-limit||p[1]>b[3]+limit)continue;
      for(let i=1;i<s.points.length;i++){const a=s.points[i-1],b=s.points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1))),d=(p[0]-a[0]-dx*t)**2+(p[1]-a[1]-dy*t)**2;if(d<best){best=d;hit={segment:s,fraction:(s.totals[i-1]+distance(a,b)*t)/s.length};}}
    }return hit;
  }
  function dot(c,p,color,r,halo=1){const q=screen(p);if(q.x<0||q.x>width||q.y<0||q.y>height)return;c.shadowColor=color;c.shadowBlur=13*halo;c.fillStyle=color;c.beginPath();c.arc(q.x,q.y,r,0,Math.PI*2);c.fill();c.shadowBlur=0;}
  function replenishParticle(particle){
    const candidates=Math.random()<.7&&rainSources.length?rainSources:rainTributaries;
    const segment=candidates[Math.floor(Math.random()*candidates.length)];if(!segment)return;
    Object.assign(particle,{segment,distance:Math.random()*segment.length*.35,speed:(.8+Math.random()*1.2)*(data.unitsPerKm||1000),age:0,lifetime:18+Math.random()*28,color:basins.get(segment.basin).color});rainEmissions++;
  }
  function fillParticles(){
    particles=[];rainElapsed=0;rainEmissions=0;
    rainTributaries=segments.filter(s=>(!state.isolateBasin||s.basin===state.basin)&&s.routable!==false&&s.next!==null&&s.length>0);rainSources=rainTributaries.filter(s=>s.parents.length===0);
    if(!rainTributaries.length)return;
    for(let i=0;i<(width<600?160:320);i++){const particle={};replenishParticle(particle);particle.age=Math.random()*particle.lifetime;particles.push(particle);}
  }
  function advanceRain(dt){
    rainElapsed+=dt;
    for(const particle of particles){
      particle.age+=dt;particle.distance+=dt*particle.speed;
      if(particle.age>=particle.lifetime){replenishParticle(particle);continue;}
      // Follow the directed graph through every junction; arrival creates a
      // fresh tributary drop so the upper branches keep receiving rainfall.
      while(particle.distance>=particle.segment.length){
        particle.distance-=particle.segment.length;
        const next=particle.segment.next===null?null:byId.get(particle.segment.next);
        if(!next){replenishParticle(particle);break;}particle.segment=next;
      }
    }
  }
  function drawMapKey(c){
    c.save();c.setTransform(dpr,0,0,dpr,0,0);c.globalAlpha=1;c.shadowBlur=0;
    const metresPerPixel=1000/(data.unitsPerKm*camera.scale),target=Math.min(120,width*.22)*metresPerPixel,magnitude=10**Math.floor(Math.log10(target)),length=[5,2,1].map(n=>n*magnitude).find(n=>n<=target)||magnitude/2,pixels=length/metresPerPixel;
    const x=width-pixels-28,y=state.mapFocus?height-58:Math.min(height-58,$('player').getBoundingClientRect().top-22);
    c.fillStyle='#071910dd';c.fillRect(x-10,y-25,pixels+20,39);c.strokeStyle='#d1e7d8';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y-4);c.lineTo(x,y+1);c.lineTo(x+pixels,y+1);c.lineTo(x+pixels,y-4);c.stroke();
    c.fillStyle='#dfede5';c.font='10px system-ui,sans-serif';c.textAlign='center';c.fillText(length>=1000?new Intl.NumberFormat('nb-NO').format(length/1000)+' km':Math.round(length)+' m',x+pixels/2,y-10);
    const northY=state.heightColors&&state.mapLayer==='relief'?170:92;c.fillStyle='#071910dd';c.fillRect(width-53,northY,28,43);c.fillStyle='#d1e7d8';c.beginPath();c.moveTo(width-39,northY+6);c.lineTo(width-44,northY+22);c.lineTo(width-39,northY+19);c.lineTo(width-34,northY+22);c.closePath();c.fill();c.font='9px system-ui,sans-serif';c.fillText('N',width-39,northY+36);c.restore();
  }
  async function exportMap(){
    if(!state.ready||exporting||$('export-map').disabled)return;
    const button=$('export-map'),label=button.querySelector('span');exporting=true;button.disabled=true;label.textContent='Lagrer …';$('export-status').textContent='';
    try{
      await new Promise(resolve=>requestAnimationFrame(resolve));
      if(state.mapLayer!=='dark'&&state.mapOpacity>0&&[...tileView].some(key=>tiles.get(key)?.status!=='ready'))throw Error('pending map');
      const colored=state.heightColors&&state.mapLayer==='relief'&&state.mapOpacity>0,image=document.createElement('canvas'),header=62,footer=colored?100:70;image.width=canvas.width;image.height=canvas.height+Math.round((header+footer)*dpr);
      const c=image.getContext('2d',{alpha:false});c.fillStyle='#07110c';c.fillRect(0,0,image.width,image.height);c.drawImage(canvas,0,header*dpr);c.scale(dpr,dpr);
      c.fillStyle='#e1f0e6';c.font='600 17px system-ui,sans-serif';c.fillText('OnlyFag · Vann og landskap',20,27);c.font='11px system-ui,sans-serif';c.fillStyle='#b4cabe';c.fillText((state.isolateBasin?basins.get(state.basin).name:'Norske vassdrag')+' · '+$('map-layer').selectedOptions[0].textContent,20,46);
      let y=header+height+23;c.font='10px system-ui,sans-serif';c.fillText('Elvedata: NVE ELVIS · NLOD · onlyfag.no',20,y);
      if(state.mapLayer!=='dark'){y+=17;c.fillText('Bakgrunn: © Kartverket · kartverket.no',20,y);}
      if(colored){y+=22;c.fillText('Høyde over havet',20,y-6);drawHeightLegend(c,20,y,Math.min(260,width-40));}
      const blob=await new Promise(resolve=>image.toBlob(resolve,'image/png'));if(!blob)throw Error('image');
      const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='onlyfag-kart-'+new Date().toISOString().slice(0,10)+'.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);$('export-status').textContent='PNG er lagret med kildeinformasjon.';
    }catch(error){$('export-status').textContent='Kartbildet kunne ikke lagres. Vent til bakgrunnen er lastet og prøv igjen.';}
    finally{exporting=false;label.textContent='Lagre kart som bilde';mapStatus();}
  }
  function frame(now){
    const dt=Math.min(.15,Math.max(0,(now-last)/1000));last=now;
    if(state.ready&&!document.hidden&&(dirty||!state.paused||hover!==lastHover)){
      if(!state.paused&&!state.completed){state.progress=Math.min(1,state.progress+dt*state.speed/duration);if(state.progress===1){state.completed=true;state.paused=!state.rain;controls();setStatus('Dråpen har nådd '+(basins.get(state.basin).outletLabel||'vassdragets utløp')+(state.rain?'. Regnet fortsetter i sideelvene.':'. Spill reisen igjen eller velg en ny elv.'));}}
      if(dirty)paintBase();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(base,0,0);ctx.setTransform(dpr,0,0,dpr,0,0);
      if(state.rain){if(!state.paused)advanceRain(dt*state.speed);if(state.showRivers){ctx.globalAlpha=state.riverIntensity;for(const particle of particles)if(!state.isolateBasin||particle.segment.basin===state.basin)dot(ctx,at(particle.segment.points,particle.segment.totals,particle.distance),particle.color,1.2*Math.sqrt(state.riverWidth),.16);ctx.globalAlpha=1;}}
      const pos=routePosition(route,state.progress);
      if(pos&&state.showRivers){
        const q=screen(pos.point);ctx.strokeStyle='#e4f8ee';ctx.globalAlpha=.2;ctx.lineWidth=1;ctx.beginPath();ctx.arc(q.x,q.y,state.completed?11:8,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
        // A short luminous tail follows the actual downstream geometry.
        for(let k=12;k>0;k--){const p=routePosition(route,Math.max(0,state.progress-k*.0015));if(p){ctx.globalAlpha=(1-k/14)*.5;dot(ctx,p.point,'#d3f9e2',Math.max(.6,2.6-k*.14),.5);}}
        ctx.globalAlpha=1;if(state.mapLayer!=='dark')dot(ctx,pos.point,'#08241d',4.5,0);dot(ctx,pos.point,'#f4fff6',3.1,1);dot(ctx,pos.point,'#ffffff',1.2,0);
      }
      if(pos&&now-domTime>180){$('progress').value=state.progress;$('river-name').textContent=state.completed?'Reisen er fremme':riverName(pos.segment.name)||'Langs sideelvene';domTime=now;}
      if(hover&&state.showRivers){ctx.strokeStyle=basins.get(hover.basin).color;ctx.lineWidth=2/camera.scale;ctx.translate(camera.tx,camera.ty);ctx.scale(camera.scale,camera.scale);ctx.stroke(hover.path);ctx.setTransform(dpr,0,0,dpr,0,0);}
      drawMapKey(ctx);
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
    }else if(state.ready){hover=state.showRivers?nearest(e.offsetX,e.offsetY)?.segment||null:null;canvas.style.cursor=hover?(hover.routable===false?'help':'pointer'):'grab';}
  });
  function endPointer(e){if(!pointers.has(e.pointerId))return;const moved=drag?.moved||pointers.size>1;pointers.delete(e.pointerId);gesture=null;if(!moved&&state.ready&&state.showRivers){const hit=nearest(e.offsetX,e.offsetY);if(hit?.segment.routable===false)setStatus('Denne sideelven vises i kartet, men reisen til utløpet er ikke klar her. Velg et startsted i listen.');else if(hit)selectSegment(hit.segment,hit.fraction);else setStatus('Velg en av elvene, eller bruk listen med startsteder.');}if(!pointers.size)drag=null;}
  canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',()=>{pointers.clear();drag=null;gesture=null;});canvas.addEventListener('pointerleave',()=>{hover=null;});
  canvas.addEventListener('keydown',e=>{if(['+','=','-','0',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='0')$('reset').click();else if(e.key===' ')$('pause').click();else if(['+','=','-'].includes(e.key))zoom(e.key==='-'?1/1.4:1.4);else{state.pan[0]+=e.key==='ArrowLeft'?40:e.key==='ArrowRight'?-40:0;state.pan[1]+=e.key==='ArrowUp'?40:e.key==='ArrowDown'?-40:0;updateCamera();}}});
  $('pause').addEventListener('click',()=>{if(state.completed&&!state.rain)return restart();state.paused=!state.paused;controls();setStatus(state.paused?'Animasjonen er satt på pause.':state.completed?'Regnet fortsetter i sideelvene.':'Dråpen følger vannet videre.');});
  $('replay').addEventListener('click',restart);$('speed').addEventListener('change',()=>{state.speed=Number($('speed').value);});
  $('rain').addEventListener('click',()=>{state.rain=!state.rain;if(state.rain){if(state.completed&&!reduced.matches)state.paused=false;fillParticles();}else{particles=[];if(state.completed)state.paused=true;}dirty=true;controls();setStatus(state.rain?(state.paused?'Regnet er klart. Trykk Spill av for å se dråpene i sideelvene.':'Regnet fyller stadig på med nye dråper i sideelvene.'):'Regnet er slått av.');});
  $('map-layer').addEventListener('change',()=>{
    state.mapLayer=$('map-layer').value;document.body.dataset.mapLayer=state.mapLayer;
    if(state.mapLayer==='dark'){state.showRivers=true;$('show-rivers').checked=true;}
    $('show-rivers').disabled=state.mapLayer==='dark';$('basemap-credit').hidden=state.mapLayer==='dark';
    for(const [key,tile] of tiles)if(tile.status==='error')tiles.delete(key);
    tileView.clear();hover=null;dirty=true;styleControls();$('map-status').textContent=state.mapLayer==='dark'?'':'Laster bakgrunnskart …';$('export-map').disabled=state.mapLayer!=='dark';
  });
  for(const [name,key,scale] of [['river-width','riverWidth',1],['river-intensity','riverIntensity',100],['map-opacity','mapOpacity',100]])$(name).addEventListener('input',()=>{state[key]=Number($(name).value)/scale;dirty=true;styleControls();});
  $('height-colors').addEventListener('change',()=>{state.heightColors=$('height-colors').checked;dirty=true;styleControls();});
  $('isolate-basin').addEventListener('change',()=>{state.isolateBasin=$('isolate-basin').checked;hover=null;if(state.rain)fillParticles();dirty=true;});
  $('map-focus').addEventListener('click',()=>{state.mapFocus=!state.mapFocus;document.body.dataset.mapFocus=String(state.mapFocus);$('map-focus').setAttribute('aria-pressed',String(state.mapFocus));$('map-focus').setAttribute('aria-label',state.mapFocus?'Vis reisepanelet':'Vis kartet uten reisepanelet');$('map-focus').querySelector('span').textContent=state.mapFocus?'Vis reisen':'Kartvisning';updateCamera();});
  $('export-map').addEventListener('click',exportMap);
  for(const [a,b] of [['map-style','about'],['about','map-style']])$(a).addEventListener('toggle',()=>{if($(a).open)$(b).open=false;});
  $('show-rivers').addEventListener('change',()=>{state.showRivers=$('show-rivers').checked;hover=null;dirty=true;});
  $('reset').addEventListener('click',()=>{state.zoom=1;state.pan=[0,0];if(state.ready)updateCamera();});
  for(const mode of ['flow','basin'])$('mode-'+mode).addEventListener('click',()=>{state.mode=mode;dirty=true;controls();setStatus(mode==='basin'?'Fargen viser vassdraget. De lyseste sideelvene leder vann til startpunktet.':'Følg dråpen mot vassdragets utløp.');});
  $('start-point').addEventListener('change',()=>{const start=data.starts.find(s=>id(s.id)===$('start-point').value);if(start)selectSegment(byId.get(id(start.segment)),Number(start.fraction)||0,id(start.id));});
  reduced.addEventListener('change',()=>{if(reduced.matches){state.paused=true;state.rain=false;particles=[];dirty=true;controls();}});
  addEventListener('resize',resize);new ResizeObserver(()=>{if(state.ready)updateCamera();}).observe($('player'));
  window.DropPrototype={snapshot:()=>({...state,route:[...state.route],pan:[...state.pan],camera:{...camera},routeLength,duration,outlet:state.route.at(-1),rainSummary:{count:particles.length,emissions:rainEmissions,elapsed:rainElapsed},dataSummary:{segments:segments.length,basins:basins.size}}),worldToScreen:raw=>{const p=screen(point(raw)),r=canvas.getBoundingClientRect();return {x:p.x+r.x,y:p.y+r.y};}};
  async function load(){
    try{
      setStatus('Henter elvenettet …');const response=await fetch('../assets/geography/drop-prototype/data-9e1129e2f625.json');if(!response.ok)throw Error('data');data=await response.json();extent=data.bounds;data.unitsPerKm=data.unitsPerKm||1000;
      data.basins.forEach((b,i)=>{const basin={...b,id:id(b.id),color:b.color||palette[i%palette.length]};if(b.rings){basin.path=new Path2D();for(const ring of b.rings){const p=ring.map(point);basin.path.addPath(path([...p,p[0]]));}}basins.set(basin.id,basin);});
      segments=data.segments.map(s=>{const points=s.points.map(point),m=metrics(points),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return {...s,id:id(s.id),basin:id(s.basin),next:s.next==null?null:id(s.next),points,...m,path:path(points),parents:[],bounds:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]};});
      byId=new Map(segments.map(s=>[s.id,s]));for(const s of segments){if(!basins.has(s.basin)||s.points.length<2||s.length<=0)throw Error('invalid river');if(s.next!==null){const next=byId.get(s.next);if(!next||next.basin!==s.basin)throw Error('invalid downstream link');next.parents.push(s.id);}s.weight=s.area?.35+Math.min(1.8,Math.log2(1+Number(s.area))*.115):.3+Math.min(7,Number(s.order)||1)*.14;}
      const select=$('start-point');select.replaceChildren(new Option('Velg en elv i kartet',''));for(const s of data.starts)select.add(new Option(s.label,id(s.id)));
      if(!data.starts.length)throw Error('no starting places');
      if(!data.basins.some(b=>b.rings))$('mode-basin').textContent='Se sideelvene';
      $('river-source').replaceChildren(document.createTextNode(data.source.title+' · '));const credit=document.createElement('a');credit.href=data.source.url;credit.textContent=data.source.license;credit.target='_blank';credit.rel='noopener';$('river-source').append(credit);
      const description=data.description||['Et nedbørfelt samler vann mot et felles utløp. Fargene viser seks norske vassdrag. De lyseste sideelvene leder vann til startpunktet du har valgt.','Klikk på en elv eller velg et startsted i listen. Prototypen følger kartlagte elveløp; den beregner ikke avrenning fra vilkårlige punkter på land. Noen mindre sidegrener vises bare som bakgrunn.','Dråpen viser vannets vei gjennom elvenettet. Tempoet er tilpasset visningen og viser ikke hvor lang tid vannet bruker i virkeligheten.'];
      $('about-copy').replaceChildren();for(const text of description){const p=document.createElement('p');p.textContent=text;$('about-copy').append(p);}
      const mapHelp=document.createElement('p');mapHelp.textContent='Velg topografisk kart, turkart eller terrengrelieff under Bakgrunn. Slå av Vis elver for å studere landskapet. Terrengrelieff viser fjellrygger og daler, men tegner ikke inn beregnede vannskiller.';$('about-copy').append(mapHelp);
      state.ready=true;document.body.dataset.ready='true';$('map-layer').disabled=false;$('export-map').disabled=false;initHeightLegend();styleControls();resize();const first=data.starts.find(s=>basins.get(id(byId.get(id(s.segment)).basin))?.name==='Glomma')||data.starts[0];selectSegment(byId.get(id(first.segment)),Number(first.fraction)||0,id(first.id));updateCamera();
    }catch(error){setStatus('Kartet kunne ikke lastes. Last siden på nytt for å prøve igjen.');document.body.dataset.error='true';console.error('River prototype:',error);}
  }
  resize();requestAnimationFrame(frame);load();
})();
