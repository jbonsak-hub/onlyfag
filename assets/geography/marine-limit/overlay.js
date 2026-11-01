// NGU overview + lazy, locally hosted UTM33 detail. Opacity is applied once.
export function createMarineOverlay({overview,repaint,status,indexURL}){
 const scene=document.createElement('canvas'),cache=new Map();let index=null,indexState='idle',active=0,visible=[];
 function makePath(geometry){const path=new Path2D();const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];for(const polygon of polygons)for(const ring of polygon){ring.forEach(([x,north],i)=>i?path.lineTo(x,-north):path.moveTo(x,-north));path.closePath();}return path;}
 async function getIndex(){
  if(indexState!=='idle')return;indexState='loading';
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),30000);
  try{const response=await fetch(indexURL,{signal:abort.signal});if(!response.ok)throw Error();index=await response.json();if(index.coordinateSystem!=='EPSG:25833'||!Array.isArray(index.tiles))throw Error();indexState='ready';}catch{indexState='error';}finally{clearTimeout(timer);}repaint();
 }
 function report(detail){
  if(!detail){status('');return;}
  const entries=visible.map(tile=>cache.get(tile.id)).filter(Boolean);
  status(indexState==='error'||entries.some(tile=>tile.status==='error')?'NGUs detaljflater kunne ikke lastes. Oversiktslaget vises i områdene som mangler detaljer.':indexState==='loading'||entries.some(tile=>tile.status!=='ready')?'Laster detaljerte NGU-flater …':'');
 }
 async function load(){
  for(const tile of visible){if(active>=3)break;const item=cache.get(tile.id);if(item.status!=='queued')continue;active++;item.status='loading';
   const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),30000);
   fetch(new URL(tile.url,indexURL),{signal:abort.signal}).then(response=>{if(!response.ok)throw Error();return response.json();}).then(data=>{if(!Array.isArray(data.features))throw Error();item.paths=data.features.map(f=>makePath(f.geometry));item.status='ready';}).catch(()=>{item.status='error';}).finally(()=>{clearTimeout(timer);active--;repaint();load();});
  }
 }
 function draw(ctx,{width,height,dpr,scale,world,screen,color,opacity,show}){
  visible=[];const detailed=show&&opacity>0&&scale>=.01;
  if(!show||opacity<=0){report(false);return;}
  if(detailed&&indexState==='idle')getIndex();
  const a=world(0,0),b=world(width,height),intersects=bounds=>bounds[2]>=a[0]&&bounds[0]<=b[0]&&bounds[3]>=a[1]&&bounds[1]<=b[1];
  if(scene.width!==Math.round(width*dpr)||scene.height!==Math.round(height*dpr)){scene.width=Math.round(width*dpr);scene.height=Math.round(height*dpr);}
  const c=scene.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,scene.width,scene.height);
  const origin=screen(0,0);c.setTransform(dpr*scale,0,0,dpr*scale,dpr*origin[0],dpr*origin[1]);c.fillStyle=color;
  for(const feature of overview)if(intersects(feature.bounds))c.fill(feature.path,'evenodd');
  if(detailed&&index){
   visible=index.tiles.filter(tile=>intersects([tile.bbox[0],-tile.bbox[3],tile.bbox[2],-tile.bbox[1]]));
   for(const tile of visible){if(!cache.has(tile.id))cache.set(tile.id,{status:'queued',paths:[],used:0,bytes:tile.bytes||0});const item=cache.get(tile.id);item.used=performance.now();if(item.status!=='ready')continue;
    const [x0,y0,x1,y1]=tile.bbox;c.save();c.beginPath();c.rect(x0,-y1,x1-x0,y1-y0);c.clip();c.clearRect(x0,-y1,x1-x0,y1-y0);for(const path of item.paths)c.fill(path,'evenodd');c.restore();
   }
   load();
   let bytes=[...cache.values()].reduce((n,t)=>n+t.bytes,0);
   for(const [key,tile] of [...cache].sort((a,b)=>a[1].used-b[1].used)){if(cache.size<=20&&bytes<=25000000)break;if(!visible.some(t=>t.id===key)&&tile.status!=='loading'){cache.delete(key);bytes-=tile.bytes;}}
  }
  ctx.save();ctx.globalAlpha=opacity;ctx.drawImage(scene,0,0,width,height);ctx.restore();report(detailed);
 }
 function hit(point,coarse){if(index){const tile=index.tiles.find(t=>cache.get(t.id)?.status==='ready'&&point[0]>=t.bbox[0]&&point[0]<=t.bbox[2]&&-point[1]>=t.bbox[1]&&-point[1]<=t.bbox[3]),loaded=tile&&cache.get(tile.id);if(loaded)return loaded.paths.some(path=>coarse.ctx.isPointInPath(path,...point,'evenodd'));}return coarse.features.some(f=>point[0]>=f.bounds[0]&&point[0]<=f.bounds[2]&&point[1]>=f.bounds[1]&&point[1]<=f.bounds[3]&&coarse.ctx.isPointInPath(f.path,...point,'evenodd'));}
 return {draw,hit,retry(){if(indexState==='error')indexState='idle';for(const tile of cache.values())if(tile.status==='error')tile.status='queued';repaint();},snapshot(){const list=visible.map(t=>({id:t.id,status:cache.get(t.id)?.status}));return {indexState,visible:list,cached:cache.size,loading:list.filter(t=>['queued','loading'].includes(t.status)).length,loaded:list.filter(t=>t.status==='ready').length,failed:list.filter(t=>t.status==='error').length};}};
}
