import '../wgs84-raster.js?v=20261101-1';
import {geographicToUTM} from './projection.js?v=20261101-2';

// Kartverket WMTS uses numeric matrix IDs. Relief uses verified Esri WGS84 tiles.
export const TILE_ORIGIN=[-2500000,9045984],TILE_RESOLUTION=21664,MAX_LEVEL=18;
export function tileURL({layer,z,row,col}){
 if(!['topo','toporaster'].includes(layer))throw Error('Unsupported WMTS layer');
 return 'https://cache.kartverket.no/v1/wmts/1.0.0/'+layer+'/default/utm33n/'+String(z)+'/'+row+'/'+col+'.png';
}
export function createTileLayer({repaint,status}){
 const tiles=new Map();let active=0,visible=new Set(),layer='topo',level=0,enabled=true,fallback=false,reliefEnabled=false,reliefMessage='';
 const relief=globalThis.WGS84Raster.create({sourceURL:'https://whi.maptiles.arcgis.com/arcgis/rest/services/World_Hillshade/MapServer',project(lon,lat){const [east,north]=geographicToUTM(lon,lat);return [east,-north];},repaint,status:message=>{reliefMessage=message;report();}});
 relief.setVisible(false);
 function syncRelief(){const show=enabled&&(layer==='relief'||fallback&&layer!=='local');if(show!==reliefEnabled){reliefEnabled=show;relief.setVisible(show);}}
 function reliefSnapshot(){const snapshot=relief.snapshot();return {layer,provider:'esri-hillshade',level:snapshot.level,visible:snapshot.tiles.map(tile=>({...tile,layer:'relief'})),queued:snapshot.pending,loading:0,failed:snapshot.failed,ready:snapshot.ready};}
 function drawRelief(ctx,options){const a=options.world(0,0),b=options.world(options.width,options.height);relief.draw(ctx,{width:options.width,height:options.height,utmBounds:[a[0],-b[1],b[0],-a[1]],pixelsPerMetre:options.scale,screen:options.screen});}

 function report(){
  if(layer==='relief'){status(reliefMessage);return;}
  const current=[...visible].map(key=>tiles.get(key)).filter(Boolean),failed=current.some(t=>t.status==='error'),pending=current.some(t=>['queued','loading'].includes(t.status));
  const reserve=relief.snapshot();
  status(layer==='local'?'':failed&&reserve.failed&&!reserve.pending?'Kartbakgrunnene kunne ikke lastes. Velg et kartlag på nytt for å prøve igjen, eller bruk enkelt reservekart.':failed&&reserve.ready?'Kartverket-kartet er utilgjengelig. Viser terrengrelieff. Velg kartlaget på nytt for å prøve igjen.':failed?'Kartverket-kartet kunne ikke lastes. Laster terrengrelieff som reserve …':pending?'Laster detaljert kartbakgrunn …':'');
 }
 function load(){
  if(!enabled||layer==='relief'||layer==='local')return;
  const limit=layer==='relief'?4:8;
  for(const key of visible){
   if(active>=limit)break;const tile=tiles.get(key);if(tile.status!=='queued')continue;
   active++;tile.status='loading';tile.attempts++;const image=new Image();tile.image=image;
   // Retry ordinary image loading if a provider does not grant anonymous CORS.
   if(tile.attempts===1)image.crossOrigin='anonymous';let settled=false;
   const finish=state=>{if(settled)return;settled=true;clearTimeout(timer);active--;if(state==='error'&&layer===tile.layer&&layer!=='local'){fallback=true;syncRelief();}tile.status=state==='error'&&tile.attempts<2?'queued':state;report();repaint();load();};
   const timer=setTimeout(()=>{finish('error');image.src='';},8000);
   image.onload=()=>finish('ready');image.onerror=()=>finish('error');image.src=tileURL(tile);
  }
 }
 function draw(ctx,{width,height,scale,world,screen,mapLayer}){
  layer=mapLayer;syncRelief();
  if(layer==='relief'){visible.clear();drawRelief(ctx,{width,height,scale,world,screen});report();return;}
  if(fallback&&layer!=='local')drawRelief(ctx,{width,height,scale,world,screen});
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
 return {draw,change(mapLayer){layer=mapLayer;fallback=false;syncRelief();relief.retry();visible.clear();for(const tile of tiles.values())if(tile.layer===layer&&tile.status==='error'){tile.status='queued';tile.attempts=0;}report();repaint();},setVisible(value){enabled=value;syncRelief();if(enabled)load();},snapshot(){if(layer==='relief')return reliefSnapshot();const list=[...visible].map(key=>tiles.get(key)).filter(Boolean);return {layer,level,fallback:!!(fallback&&relief.snapshot().ready),visible:list.map(({layer,z,row,col,status})=>({layer,z,row,col,status})),queued:list.filter(t=>t.status==='queued').length,loading:list.filter(t=>t.status==='loading').length,failed:list.filter(t=>t.status==='error').length,ready:list.filter(t=>t.status==='ready').length};}};
}
