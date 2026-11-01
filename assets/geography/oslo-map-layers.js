/* Live basemaps stay behind the SVG. Quiz geometry and its camera are unchanged. */
(function(root){
 'use strict';
 const instances=new WeakMap(),origin=[-2500000,9045984],resolution=21664;
 function create({svg,viewport,map}){
  instances.get(svg)?.destroy();
  const crop=map.contextCrop||map.crop,[west,,east,north]=crop.bounds,v=map.viewBox,units=v[2]/(east-west),doc=svg.ownerDocument;
  const host=doc.createElement('div'),world=doc.createElement('div'),message=doc.createElement('div'),credit=doc.createElement('div');
  host.className='oslo-live-basemap';host.setAttribute('aria-hidden','true');host.hidden=true;world.className='oslo-live-basemap-world';host.append(world);svg.before(host);
  message.id='oslo-basemap-status';message.className='oslo-basemap-status';message.setAttribute('role','status');message.hidden=true;viewport.append(message);
  credit.className='oslo-imagery-credit';credit.hidden=true;viewport.append(credit);
  let mode='original',disposed=false,frame=0,loading=0,visible=new Set();const tiles=new Map();
  const url=tile=>{
   if(tile.mode==='physical')return 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/utm33n/'+String(tile.z).padStart(2,'0')+'/'+tile.row+'/'+tile.col+'.png';
   return 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?'+new URLSearchParams({f:'image',bbox:tile.bbox.join(','),bboxSR:'25833',imageSR:'25833',size:'256,256',format:'jpg',transparent:'false'});
  };
  function schedule(){if(!disposed&&!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});}
  function status(){
   const active=[...visible].map(key=>tiles.get(key)),pending=active.some(t=>['queued','loading'].includes(t.status)),failed=active.some(t=>t.status==='error');
   message.textContent=mode==='original'?'':failed?'Noen kartfliser kunne ikke lastes. Velg kartlaget på nytt for å prøve igjen.':pending?'Laster '+(mode==='satellite'?'satellittfoto':'topografisk kart')+' …':'';message.hidden=!message.textContent;
  }
  function load(){
   if(disposed||mode==='original')return;
   for(const key of visible){
    if(loading>=8)break;const t=tiles.get(key);if(t.status!=='queued')continue;
    const image=new Image();t.image=image;image.className='oslo-map-tile';image.alt='';image.draggable=false;image.dataset.bbox=JSON.stringify(t.bbox);image.dataset.source=t.mode;image.decoding='async';
    Object.assign(image.style,{position:'absolute',left:(v[0]+(t.bbox[0]-west)*units)+'px',top:(v[1]+(north-t.bbox[3])*units)+'px',width:(t.span*units)+'px',height:(t.span*units)+'px',maxWidth:'none',maxHeight:'none',pointerEvents:'none'});
    loading++;t.status='loading';let settled=false;const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);loading--;image.onload=image.onerror=null;t.status=value;schedule();};
    const timer=setTimeout(()=>{finish('error');image.removeAttribute('src');},25000);t.cancel=()=>{finish('queued');image.removeAttribute('src');};image.onload=()=>finish('ready');image.onerror=()=>finish('error');image.src=url(t);
   }
   status();
  }
  function draw(){
   if(disposed)return;host.hidden=mode==='original';if(mode==='original'){visible.clear();status();return;}
   const r=svg.getBoundingClientRect(),pr=viewport.getBoundingClientRect(),box=svg.viewBox.baseVal,p=svg.preserveAspectRatio.baseVal;
   const m=MapBasemap.cameraMatrix({viewBox:[box.x,box.y,box.width,box.height],rect:r,align:p.align,meetOrSlice:p.meetOrSlice,offsetX:r.left-pr.left-viewport.clientLeft,offsetY:r.top-pr.top-viewport.clientTop});if(!m)return;
   world.style.transform='matrix('+m.join(',')+')';
   const left=(0-m[4])/m[0],right=(viewport.clientWidth-m[4])/m[0],top=(0-m[5])/m[3],bottom=(viewport.clientHeight-m[5])/m[3];
   const minE=west+(left-v[0])/units,maxE=west+(right-v[0])/units,maxN=north-(top-v[1])/units,minN=north-(bottom-v[1])/units;
   const z=Math.max(0,Math.min(18,Math.round(Math.log2(resolution*units*Math.max(Math.abs(m[0]),Math.abs(m[3])))))),span=256*resolution/2**z;
   const firstCol=Math.max(0,Math.floor((minE-origin[0])/span)),lastCol=Math.min(2**z-1,Math.floor((maxE-origin[0])/span)),firstRow=Math.max(0,Math.floor((origin[1]-maxN)/span)),lastRow=Math.min(2**z-1,Math.floor((origin[1]-minN)/span));
   visible=new Set();for(let row=firstRow;row<=lastRow;row++)for(let col=firstCol;col<=lastCol;col++){
    const key=[mode,z,row,col].join('/');visible.add(key);if(!tiles.has(key)){const e=origin[0]+col*span,n=origin[1]-row*span;tiles.set(key,{mode,z,row,col,span,bbox:[e,n-span,e+span,n],status:'queued'});}tiles.get(key).used=performance.now();
   }
   for(const [key,t] of tiles)if(t.status==='loading'&&!visible.has(key))t.cancel();
   const ready=[...tiles.entries()].filter(([key,t])=>t.mode===mode&&t.status==='ready'&&(visible.has(key)||t.z<z));ready.sort((a,b)=>a[1].z-b[1].z);
   const images=ready.map(([,t])=>t.image);if(images.length!==world.children.length||images.some((image,i)=>world.children[i]!==image))world.replaceChildren(...images);
   for(const [key,t] of [...tiles].sort((a,b)=>(a[1].used||0)-(b[1].used||0))){if(tiles.size<=180)break;if(!visible.has(key)&&t.status!=='loading'){t.image?.remove();tiles.delete(key);}}
   load();
  }
  function set(value){mode=['physical','satellite'].includes(value)?value:'original';host.hidden=mode==='original';credit.hidden=mode==='original';
   credit.innerHTML=mode==='satellite'?'<a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9" target="_blank" rel="noopener">Bilder © Esri, Maxar, Earthstar Geographics og GIS User Community</a>':'<a href="https://www.kartverket.no/api-og-data/vilkar-for-bruk" target="_blank" rel="noopener">Kart © Kartverket</a>';
   for(const t of tiles.values())if(t.status==='error'&&t.mode===mode)t.status='queued';
   if(mode==='original')for(const t of tiles.values())if(t.status==='loading')t.cancel();draw();
  }
  const unsubscribe=root.ClickMapZoom?.subscribe?.(schedule),observer=new MutationObserver(schedule);observer.observe(svg,{attributes:true,attributeFilter:['viewBox','preserveAspectRatio']});const resize=new ResizeObserver(schedule);resize.observe(viewport);root.addEventListener('resize',schedule);
  const api={set,clear(){set('original');},snapshot(){const active=[...visible].map(key=>tiles.get(key));return {mode,tileCount:active.length,pending:active.filter(t=>['queued','loading'].includes(t.status)).length,failed:active.filter(t=>t.status==='error').length};},destroy(){disposed=true;if(frame)cancelAnimationFrame(frame);for(const t of tiles.values())if(t.status==='loading')t.cancel();unsubscribe?.();observer.disconnect();resize.disconnect();root.removeEventListener('resize',schedule);host.remove();message.remove();credit.remove();instances.delete(svg);}};
  instances.set(svg,api);return api;
 }
 root.OsloMapLayers={create,get:svg=>instances.get(svg)};
})(window);
