// Locally hosted NGU polygons. Each thematic layer is composited once so
// overlapping polygons and adjoining detail tiles do not multiply opacity.
export async function readGeologyJSON(url){const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),25000);try{const response=await fetch(url,{signal:abort.signal});if(!response.ok)throw Error();if(!new URL(url,location.href).pathname.endsWith('.gz'))return await response.json();const bytes=new Uint8Array(await response.arrayBuffer());if(bytes[0]===31&&bytes[1]===139)return await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();return JSON.parse(new TextDecoder().decode(bytes));}finally{clearTimeout(timer);}}
export function createGeologyOverlay({layers,repaint,status}){
 const states=Object.fromEntries(Object.entries(layers).map(([key,layer])=>[key,{...layer,cache:new Map(),index:null,indexState:'idle',active:0,visible:[],shown:false}]));
 const scene=document.createElement('canvas'),patterns=new Map();let enabled=true;
 function hatch(ctx,properties){const key=properties.pattern+'|'+properties.strokeColor;if(!patterns.has(key)){const tile=document.createElement('canvas');tile.width=tile.height=8;const p=tile.getContext('2d');p.strokeStyle=properties.strokeColor||'#6e6e6e';p.lineWidth=1;p.beginPath();for(const offset of [-8,0,8]){p.moveTo(offset+8,0);p.lineTo(offset,8);}p.stroke();patterns.set(key,ctx.createPattern(tile,'repeat'));}return patterns.get(key);}
 function feature(raw){
  const path=new Path2D(),bounds=[Infinity,Infinity,-Infinity,-Infinity];
  const polygons=raw.geometry.type==='Polygon'?[raw.geometry.coordinates]:raw.geometry.type==='MultiPolygon'?raw.geometry.coordinates:[];
  for(const polygon of polygons)for(const ring of polygon){ring.forEach(([x,n],i)=>{const y=-n;bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);if(i)path.lineTo(x,y);else path.moveTo(x,y);});path.closePath();}
  return {path,bounds,properties:raw.properties||{}};
 }
 for(const state of Object.values(states)){state.features=state.data?.features.map(feature)||[];state.overviewState=state.data?'ready':'idle';}
 async function getOverview(state){if(state.overviewState!=='idle'||!enabled)return;state.overviewState='loading';try{const data=await readGeologyJSON(state.overview);if(data.coordinateSystem!=='EPSG:25833'||!data.features?.length)throw Error();state.features=data.features.map(feature);state.overviewState='ready';}catch{state.overviewState='error';}repaint();}
 async function getIndex(state){
  if(!state.detailIndex||state.indexState!=='idle'||!enabled)return;state.indexState='loading';
  try{const data=await readGeologyJSON(state.detailIndex);if(data.coordinateSystem!=='EPSG:25833'||!Array.isArray(data.tiles))throw Error();state.index=data;state.indexState='ready';}catch{state.indexState='error';}repaint();
 }
 function load(state){
  if(!enabled||!state.shown)return;
  for(const tile of state.visible){if(state.active>=3)break;const item=state.cache.get(tile.id);if(item.status!=='queued')continue;item.status='loading';state.active++;
   readGeologyJSON(new URL(tile.url,state.detailIndex)).then(data=>{if(data.coordinateSystem!=='EPSG:25833'||!Array.isArray(data.features))throw Error();item.features=data.features.map(feature);item.status='ready';}).catch(()=>item.status='error').finally(()=>{state.active--;repaint();load(state);});
  }
 }
 function report(){
  const shown=Object.values(states).filter(s=>s.shown);
  const missing=shown.filter(s=>s.overviewState==='error'),failed=shown.filter(s=>s.indexState==='error'||s.visible.some(t=>s.cache.get(t.id)?.status==='error'));
  const loadingOverview=shown.some(s=>s.overviewState==='loading'),pending=shown.some(s=>s.indexState==='loading'||s.visible.some(t=>['queued','loading'].includes(s.cache.get(t.id)?.status)));
  status(missing.length?`${missing.map(s=>s.title).join(' og ')} kunne ikke lastes. Slå laget av og på for å prøve igjen.`:failed.length?`Detaljer for ${failed.map(s=>s.title.toLocaleLowerCase('nb')).join(' og ')} kunne ikke lastes. Oversiktskartet vises fortsatt. Slå laget av og på for å prøve igjen.`:loadingOverview?'Laster geologiske kartlag …':pending?'Laster detaljerte geologiske flater …':'');
 }
 function draw(ctx,{width,height,dpr,scale,world,screen,controls}){
  const a=world(0,0),b=world(width,height),intersects=bounds=>bounds[2]>=a[0]&&bounds[0]<=b[0]&&bounds[3]>=a[1]&&bounds[1]<=b[1];
  if(scene.width!==Math.round(width*dpr)||scene.height!==Math.round(height*dpr)){scene.width=Math.round(width*dpr);scene.height=Math.round(height*dpr);}
  for(const [key,state] of Object.entries(states)){
   const control=controls[key];state.shown=enabled&&control.show&&control.opacity>0;state.visible=[];
   if(!state.shown)continue;
   if(state.overviewState==='idle')getOverview(state);
   if(scale>=.006&&state.indexState==='idle')getIndex(state);
   const c=scene.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,scene.width,scene.height);
   const origin=screen(0,0);c.setTransform(dpr*scale,0,0,dpr*scale,dpr*origin[0],dpr*origin[1]);
   const paint=features=>{for(const item of features)if(intersects(item.bounds)){if(item.properties.fillOpacity===0){c.save();c.globalCompositeOperation='destination-out';c.fillStyle='#000';c.fill(item.path,'evenodd');c.restore();continue;}c.fillStyle=item.properties.color||'#b4b0a5';c.fill(item.path,'evenodd');if(item.properties.pattern){c.save();c.clip(item.path,'evenodd');c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=hatch(c,item.properties);c.fillRect(0,0,width,height);c.restore();}}};
   paint(state.features);
   if(scale>=.006&&state.index){
    state.visible=state.index.tiles.filter(t=>intersects([t.bbox[0],-t.bbox[3],t.bbox[2],-t.bbox[1]]));
    for(const tile of state.visible){if(!state.cache.has(tile.id))state.cache.set(tile.id,{status:'queued',features:[],used:0,bytes:tile.uncompressedBytes||tile.bytes||0});const item=state.cache.get(tile.id);item.used=performance.now();if(item.status==='ready')paint(item.features);}
    load(state);let bytes=[...state.cache.values()].reduce((n,t)=>n+t.bytes,0);
    for(const [id,tile] of [...state.cache].sort((a,b)=>a[1].used-b[1].used)){if(state.cache.size<=24&&bytes<=30000000)break;if(!state.visible.some(t=>t.id===id)&&tile.status!=='loading'){state.cache.delete(id);bytes-=tile.bytes;}}
   }
   ctx.save();ctx.globalAlpha=control.opacity;ctx.drawImage(scene,0,0,width,height);ctx.restore();
  }
  report();
 }
 function hit(point,ctx){
  const found=[];for(const [key,state] of Object.entries(states)){
   if(!state.shown)continue;let match=null;
   const collections=[...state.visible.map(t=>state.cache.get(t.id)).filter(t=>t?.status==='ready').map(t=>t.features),state.features];
   for(const collection of collections){for(let i=collection.length-1;i>=0;i--){const f=collection[i];if(point[0]>=f.bounds[0]&&point[0]<=f.bounds[2]&&point[1]>=f.bounds[1]&&point[1]<=f.bounds[3]&&ctx.isPointInPath(f.path,...point,'evenodd')){match=f;break;}}if(match)break;}
   if(match)found.push({layer:key,title:state.title,...match.properties});
  }return found;
 }
 return {draw,hit,setVisible(value){enabled=!!value;if(!enabled)for(const s of Object.values(states))s.shown=false;repaint();},retry(key){const state=states[key];if(!state)return;if(state.overviewState==='error')state.overviewState='idle';if(state.indexState==='error')state.indexState='idle';for(const tile of state.cache.values())if(tile.status==='error')tile.status='queued';repaint();},snapshot(){return Object.fromEntries(Object.entries(states).map(([key,s])=>[key,{shown:s.shown,overviewState:s.overviewState,overviewFeatures:s.features.length,indexState:s.indexState,visible:s.visible.map(t=>({id:t.id,status:s.cache.get(t.id)?.status})),loaded:s.visible.filter(t=>s.cache.get(t.id)?.status==='ready').length,failed:s.visible.filter(t=>s.cache.get(t.id)?.status==='error').length,loading:s.visible.filter(t=>['queued','loading'].includes(s.cache.get(t.id)?.status)).length}]));}};
}
