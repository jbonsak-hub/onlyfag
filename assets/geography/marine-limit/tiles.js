// Kartverket's public UTM33 WMTS and terrain WMS, as used by Følg dråpen.
export const TILE_ORIGIN=[-2500000,9045984],TILE_RESOLUTION=21664,MAX_LEVEL=18;
export function tileURL({layer,z,row,col}){
 if(layer==='relief'){
  const span=256*TILE_RESOLUTION/2**z,x=TILE_ORIGIN[0]+col*span,y=TILE_ORIGIN[1]-row*span;
  return 'https://wms.geonorge.no/skwms1/wms.hoyde-dtm?'+new URLSearchParams({service:'WMS',version:'1.3.0',request:'GetMap',layers:'DTM:multiskyggerelieff',styles:'',crs:'EPSG:25833',bbox:[x,y-span,x+span,y].join(','),width:'256',height:'256',format:'image/png',transparent:'true'});
 }
 return 'https://cache.kartverket.no/v1/wmts/1.0.0/'+layer+'/default/utm33n/'+String(z).padStart(2,'0')+'/'+row+'/'+col+'.png';
}
export function createTileLayer({repaint,status}){
 const tiles=new Map();let active=0,visible=new Set(),layer='topo',level=0,enabled=true;
 function report(){
  const current=[...visible].map(key=>tiles.get(key)).filter(Boolean),failed=current.some(t=>t.status==='error'),pending=current.some(t=>['queued','loading'].includes(t.status));
  status(layer==='local'?'':failed?'Kartbakgrunnen kunne ikke lastes. Velg et annet kartlag eller prøv igjen.':pending?'Laster detaljert kartbakgrunn …':'');
 }
 function load(){
  if(!enabled)return;
  const limit=layer==='relief'?4:8;
  for(const key of visible){
   if(active>=limit)break;const tile=tiles.get(key);if(tile.status!=='queued')continue;
   active++;tile.status='loading';tile.attempts++;const image=new Image();tile.image=image;image.crossOrigin='anonymous';let settled=false;
   const finish=state=>{if(settled)return;settled=true;clearTimeout(timer);active--;tile.status=state==='error'&&tile.attempts<2?'queued':state;report();repaint();load();};
   const timer=setTimeout(()=>{finish('error');image.src='';},layer==='relief'?45000:20000);
   image.onload=()=>finish('ready');image.onerror=()=>finish('error');image.src=tileURL(tile);
  }
 }
 function draw(ctx,{width,height,scale,world,screen,mapLayer}){
  layer=mapLayer;
  if(layer==='local'){visible.clear();report();return;}
  level=Math.max(0,Math.min(MAX_LEVEL,Math.round(Math.log2(TILE_RESOLUTION*scale))));
  const a=world(0,0),b=world(width,height),span=256*TILE_RESOLUTION/2**level,count=2**level;
  const firstCol=Math.max(0,Math.floor((a[0]-TILE_ORIGIN[0])/span)),lastCol=Math.min(count-1,Math.floor((b[0]-TILE_ORIGIN[0])/span));
  const firstRow=Math.max(0,Math.floor((TILE_ORIGIN[1]+a[1])/span)),lastRow=Math.min(count-1,Math.floor((TILE_ORIGIN[1]+b[1])/span));
  const paint=tile=>{
   const sizeMetres=256*TILE_RESOLUTION/2**tile.z;
   const p=screen(TILE_ORIGIN[0]+tile.col*sizeMetres,-TILE_ORIGIN[1]+tile.row*sizeMetres),size=sizeMetres*scale;
   if(p[0]+size>=0&&p[0]<=width&&p[1]+size>=0&&p[1]<=height)ctx.drawImage(tile.image,p[0],p[1],size+.15,size+.15);
  };
  visible=new Set();
  // Old detail is a geographically registered temporary background, never stretched.
  for(const tile of [...tiles.values()].filter(t=>t.layer===layer&&t.status==='ready'&&t.z!==level).sort((a,b)=>a.z-b.z))paint(tile);
  const queue=[];
  for(let row=firstRow;row<=lastRow;row++)for(let col=firstCol;col<=lastCol;col++)queue.push({row,col,distance:(col-(firstCol+lastCol)/2)**2+(row-(firstRow+lastRow)/2)**2});
  queue.sort((a,b)=>a.distance-b.distance);
  for(const {row,col} of queue){const key=[layer,level,row,col].join('/');visible.add(key);if(!tiles.has(key))tiles.set(key,{layer,z:level,row,col,status:'queued',attempts:0});const tile=tiles.get(key);tile.used=performance.now();if(tile.status==='ready')paint(tile);}
  if(tiles.size>192)for(const [key,tile] of [...tiles].sort((a,b)=>(a[1].used||0)-(b[1].used||0))){if(tiles.size<=192)break;if(!visible.has(key)&&tile.status!=='loading')tiles.delete(key);}
  load();report();
 }
 return {draw,change(mapLayer){layer=mapLayer;visible.clear();for(const tile of tiles.values())if(tile.layer===layer&&tile.status==='error'){tile.status='queued';tile.attempts=0;}report();repaint();},setVisible(value){enabled=value;if(enabled)load();},snapshot(){const list=[...visible].map(key=>tiles.get(key)).filter(Boolean);return {layer,level,visible:list.map(({layer,z,row,col,status})=>({layer,z,row,col,status})),queued:list.filter(t=>t.status==='queued').length,loading:list.filter(t=>t.status==='loading').length,failed:list.filter(t=>t.status==='error').length,ready:list.filter(t=>t.status==='ready').length};}};
}
