import {geographicToUTM} from './projection.js?v=20261101-2';
import {createTileLayer,TILE_RESOLUTION,MAX_LEVEL} from './tiles.js?v=20261101-2';
import {createMarineOverlay} from './overlay.js?v=20261101-2';

const $=selector=>document.querySelector(selector),canvas=$('#map'),wrap=$('#map-wrap'),ctx=canvas.getContext('2d');
const embedded=new URLSearchParams(location.search).get('embedded')==='1'&&parent!==window;
document.body.classList.toggle('embedded',embedded);
let dark=false;
try{dark=localStorage.getItem('onlyfag.marine-limit.dark')==='true';}catch{}
let w=0,h=0,fit=1,ready=false,frame=0,marker=null;
let overview=[],counties=[],background=[],places=[],marineOverlay;
const national={bounds:[-110000,-8050000,1120000,-6380000],x:505000,y:-7215000};
const view={x:national.x,y:national.y,z:1};
const major=new Set(['Oslo','Bergen','Trondheim','Stavanger','Kristiansand','Tromsø','Bodø','Ålesund','Alta','Kirkenes','Hammerfest','Lillehammer','Hamar','Drammen','Fredrikstad']);
const status=text=>{const element=$('#status');element.textContent=text;element.hidden=!text;};
const mapStatus=text=>{const element=$('#map-status');if(element){element.textContent=text;element.hidden=!text;}};
const detailStatus=text=>{const element=$('#detail-status');if(element){element.textContent=text;element.hidden=!text;}};
const tiles=createTileLayer({repaint:schedule,status:mapStatus});
function theme(value){dark=value;document.body.classList.toggle('dark',dark);$('#theme').setAttribute('aria-pressed',String(dark));schedule();}
$('#theme').hidden=embedded;
$('#theme').onclick=()=>{theme(!dark);try{localStorage.setItem('onlyfag.marine-limit.dark',String(dark));}catch{}};
window.addEventListener('message',event=>{
 if(!embedded||event.source!==parent||event.origin!==location.origin||event.data?.type!=='marine-limit-host')return;
 if(typeof event.data.dark==='boolean')theme(event.data.dark);
 if(typeof event.data.visible==='boolean')tiles.setVisible(event.data.visible);
});
function project(lon,lat){const [easting,northing]=geographicToUTM(lon,lat);return [easting,-northing];}
function geometryPath(geometry){
 const path=new Path2D(),bounds=[Infinity,Infinity,-Infinity,-Infinity];
 const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];
 for(const polygon of polygons)for(const ring of polygon){
  ring.forEach(([lon,lat],i)=>{const [x,y]=project(lon,lat);bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);if(i)path.lineTo(x,y);else path.moveTo(x,y);});
  path.closePath();
 }
 return {path,bounds};
}
// The old local overview is an optional offline reserve. Its coordinates are
// converted to UTM rather than ever stretching a Lambert image onto a tile grid.
function countyPath(svg,registration){
 const m=registration.matrix,n=registration.coneConstant,det=m[0][0]*m[1][1]-m[1][0]*m[0][1],path=new Path2D();
 const matches=svg.matchAll(/([ML])\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)|([Zz])/g);
 for(const match of matches){
  if(match[4]){path.closePath();continue;}
  const dx=Number(match[2])-m[2][0],dy=Number(match[3])-m[2][1];
  const px=(dx*m[1][1]-dy*m[1][0])/det,py=(dy*m[0][0]-dx*m[0][1])/det,rho=Math.hypot(px,py)/1000;
  const lon=registration.centralMeridian+Math.atan2(px,-py)/n*180/Math.PI,lat=(2*Math.atan(rho**(-1/n))-Math.PI/2)*180/Math.PI;
  const p=project(lon,lat);if(match[1]==='M')path.moveTo(...p);else path.lineTo(...p);
 }
 return path;
}
function scale(){return fit*view.z;}
function world(x,y){const s=scale();return [view.x+(x-w/2)/s,view.y+(y-h/2)/s];}
function screen(x,y){const s=scale();return [(x-view.x)*s+w/2,(y-view.y)*s+h/2];}
function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});}
function resize(){
 const rect=wrap.getBoundingClientRect();w=rect.width;h=rect.height;
 fit=Math.min((w-34)/(national.bounds[2]-national.bounds[0]),(h-24)/(national.bounds[3]-national.bounds[1]));
 const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);schedule();
}
function drawLocal(color,dpr){
 const s=scale();ctx.setTransform(dpr*s,0,0,dpr*s,dpr*(w/2-view.x*s),dpr*(h/2-view.y*s));
 ctx.fillStyle=color('--neighbour');ctx.strokeStyle=color('--border');ctx.lineWidth=.6/s;
 for(const item of background){ctx.fill(item.path,'evenodd');ctx.stroke(item.path);}
 ctx.fillStyle=color('--land');for(const path of counties)ctx.fill(path,'evenodd');
 ctx.strokeStyle=color('--border');for(const path of counties)ctx.stroke(path);
 ctx.setTransform(dpr,0,0,dpr,0,0);
}
function draw(){
 if(!w||!h||fit<=0)return;
 const dpr=canvas.width/w,css=getComputedStyle(document.body),color=name=>css.getPropertyValue(name).trim();
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.fillStyle=color('--water');ctx.fillRect(0,0,w,h);if(!ready)return;
 const layer=$('#map-layer').value;drawLocal(color,dpr);
 tiles.draw(ctx,{width:w,height:h,scale:scale(),world,screen,mapLayer:layer});
 const opacity=Number($('#marine-opacity').value)/100;
 marineOverlay.draw(ctx,{width:w,height:h,dpr,scale:scale(),world,screen,color:color('--marine'),opacity,show:$('#marine-layer').checked});
 // Tile maps supply their own detailed labels. Reserve labels are useful only
 // when the local overview is explicitly selected.
 if(layer==='local'){
  ctx.font='12px "Segoe UI", sans-serif';ctx.textBaseline='middle';const labels=[];
  for(const p of places){
   if(view.z<3&&!major.has(p.name)&&!major.has(p.centreName))continue;
   const [x,y]=screen(...p.point);if(x<8||x>w-15||y<10||y>h-15)continue;
   const width=ctx.measureText(p.name).width,box=[x+7,y-9,x+width+13,y+9];
   if(labels.some(b=>box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1]))continue;
   labels.push(box);ctx.fillStyle=color('--ink');ctx.beginPath();ctx.arc(x,y,2.5,0,2*Math.PI);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=color('--paper');ctx.strokeText(p.name,x+8,y);ctx.fillText(p.name,x+8,y);
  }
 }
 if(marker){const [x,y]=screen(...marker);ctx.beginPath();ctx.arc(x,y,7,0,2*Math.PI);ctx.strokeStyle=dark?'#ffcf70':'#a94916';ctx.lineWidth=3;ctx.stroke();}
 const metres=100/scale();$('#scale').textContent=metres>=1000?`${new Intl.NumberFormat('nb-NO',{maximumFractionDigits:1}).format(metres/1000)} km`:`${Math.round(metres)} m`;$('#scale').style.width='100px';
}
function setZoom(next,x=w/2,y=h/2){
 if(!ready)return;const anchor=world(x,y),maximum=2**MAX_LEVEL/TILE_RESOLUTION/fit;
 view.z=Math.max(.4,Math.min(maximum,next));view.x=anchor[0]-(x-w/2)/scale();view.y=anchor[1]-(y-h/2)/scale();schedule();
}
function zoom(factor,x=w/2,y=h/2){setZoom(view.z*factor,x,y);}
function home(){if(!ready)return;status('');$('#place').value='';Object.assign(view,{x:national.x,y:national.y,z:1});marker=null;$('#info').hidden=true;schedule();}
function inspect(x,y){
 if(!ready)return;const point=world(x,y);ctx.save();ctx.setTransform(1,0,0,1,0,0);const found=marineOverlay.hit(point,{ctx,features:overview});ctx.restore();marker=point;
 $('#info-title').textContent=found?'Kartlagt under marin grense':'Ingen blå flate her';
 $('#info-text').textContent=found?'Dette punktet ligger i NGUs kartlag «Areal under marin grense». Blåfargen viser tidligere havbunn, ikke påvist marin leire.':'Punktet ligger utenfor flatene i dette kartuttrekket. Kartdekning og forenkling må tas med i vurderingen; fravær av blåfarge er ikke alene en avklaring.';
 $('#info').hidden=false;schedule();
}
$('#zoom-in').onclick=()=>zoom(1.5);$('#zoom-out').onclick=()=>zoom(1/1.5);$('#home').onclick=home;
$('#close-info').onclick=()=>{$('#info').hidden=true;marker=null;schedule();};
$('#marine-layer').onchange=()=>{marineOverlay?.retry();schedule();};
$('#marine-opacity').addEventListener('input',()=>{const value=$('#marine-opacity-value');if(value)value.textContent=$('#marine-opacity').value+' %';schedule();});
$('#map-layer').onchange=()=>{const layer=$('#map-layer').value;document.body.dataset.mapLayer=layer;const credit=$('#basemap-credit');if(credit)credit.hidden=layer==='local';tiles.change(layer);};
$('#retry-map')?.addEventListener('click',()=>{tiles.change($('#map-layer').value);marineOverlay?.retry();});
canvas.addEventListener('wheel',event=>{event.preventDefault();const rect=canvas.getBoundingClientRect();zoom(event.deltaY<0?1.2:1/1.2,event.clientX-rect.left,event.clientY-rect.top);},{passive:false});
canvas.addEventListener('keydown',event=>{
 const delta=70/scale();if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))event.preventDefault();
 if(event.key==='+'||event.key==='=')zoom(1.5);if(event.key==='-')zoom(1/1.5);if(event.key==='Home')home();
 if(event.key==='ArrowLeft')view.x-=delta;if(event.key==='ArrowRight')view.x+=delta;if(event.key==='ArrowUp')view.y-=delta;if(event.key==='ArrowDown')view.y+=delta;schedule();
});
const pointers=new Map();let previousPinch=null,drag=null,moved=false;
function point(event){const rect=canvas.getBoundingClientRect();return [event.clientX-rect.left,event.clientY-rect.top];}
function pinch(){const [a,b]=[...pointers.values()];return {mid:[(a[0]+b[0])/2,(a[1]+b[1])/2],distance:Math.hypot(a[0]-b[0],a[1]-b[1])};}
canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;canvas.setPointerCapture(event.pointerId);const p=point(event);pointers.set(event.pointerId,p);if(pointers.size===1){drag={start:p,x:view.x,y:view.y};moved=false;}else{previousPinch=pinch();drag=null;moved=true;}canvas.classList.add('dragging');});
canvas.addEventListener('pointermove',event=>{
 if(!pointers.has(event.pointerId))return;const p=point(event);pointers.set(event.pointerId,p);
 if(pointers.size>=2){const next=pinch();if(previousPinch&&previousPinch.distance>0){const anchor=world(...previousPinch.mid);setZoom(view.z*next.distance/previousPinch.distance,...previousPinch.mid);view.x=anchor[0]-(next.mid[0]-w/2)/scale();view.y=anchor[1]-(next.mid[1]-h/2)/scale();}previousPinch=next;schedule();return;}
 if(drag){const dx=p[0]-drag.start[0],dy=p[1]-drag.start[1];if(Math.hypot(dx,dy)>6)moved=true;view.x=drag.x-dx/scale();view.y=drag.y-dy/scale();schedule();}
});
function endPointer(event,cancelled=false){if(!pointers.has(event.pointerId))return;const wasPinch=!!previousPinch;pointers.delete(event.pointerId);if(!cancelled&&!moved&&!wasPinch)inspect(...point(event));drag=null;previousPinch=null;if(pointers.size){const p=[...pointers.values()][0];drag={start:p,x:view.x,y:view.y};moved=true;}else canvas.classList.remove('dragging');}
canvas.addEventListener('pointerup',event=>endPointer(event));canvas.addEventListener('pointercancel',event=>endPointer(event,true));canvas.addEventListener('lostpointercapture',event=>endPointer(event,true));
function normalize(s){return s.trim().normalize('NFKC').toLocaleLowerCase('nb');}
$('#place-form').onsubmit=event=>{
 event.preventDefault();const query=normalize($('#place').value);const p=places.find(p=>normalize(p.name)===query)||places.find(p=>normalize(p.centreName)===query);
 if(!p){status('Velg en kommune fra listen.');return;}status('');view.x=p.point[0];view.y=p.point[1];view.z=(1/8)/fit;marker=p.point;$('#info').hidden=true;schedule();canvas.focus({preventScroll:true});
};
const dialog=$('#about-dialog');for(const id of ['about','sources'])$('#'+id).onclick=()=>dialog.showModal();$('#close-about').onclick=()=>dialog.close();
new ResizeObserver(resize).observe(wrap);theme(dark);
async function json(url){const response=await fetch(url);if(!response.ok)throw Error('Kartdata kunne ikke lastes.');return response.json();}
try{
 const base='../assets/geography/';
 const [registration,countyData,bg,marine,metadata]=await Promise.all([json(base+'sources/norway-county-registration.json'),json(base+'norway-counties.json'),json(base+'marine-limit/background.json?v=20261101-1'),json(base+'marine-limit/data/under-marine-limit.geojson?v=20261101-1'),json(base+'marine-limit/data/metadata.json?v=20261101-1')]);
 counties=countyData.map(feature=>countyPath(feature.d,registration));background=bg.features.map(feature=>geometryPath(feature.geometry));
 places=bg.places.map(p=>({...p,point:project(p.lon,p.lat)})).sort((a,b)=>Number(major.has(b.name))-Number(major.has(a.name))||a.name.localeCompare(b.name,'nb'));
 for(const place of [...places].sort((a,b)=>a.name.localeCompare(b.name,'nb'))){const option=document.createElement('option');option.value=place.name;$('#places').append(option);}
 if(!marine.features?.length)throw Error('Kartlaget mangler flater.');overview=marine.features.map(feature=>geometryPath(feature.geometry));
 marineOverlay=createMarineOverlay({overview,repaint:schedule,status:detailStatus,indexURL:new URL('./data/detail/index.json?v=20261101-2',import.meta.url)});
 const date=value=>new Intl.DateTimeFormat('nb-NO',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));
 $('#source-description').textContent=`NGU: Areal under marin grense. Datauttrekk ${date(metadata.sourceDate)}, hentet via ${metadata.mirror} ${date(metadata.fetchedOn)}. Oversikt er forenklet med ${metadata.simplificationMeters} meter toleranse; lokalt detaljlag lastes når du zoomer inn. Kartverket leverer detaljert bakgrunnskart, turkart og terrengrelieff.`;
 const opacityValue=$('#marine-opacity-value');if(opacityValue)opacityValue.textContent=$('#marine-opacity').value+' %';
 ready=true;status('');resize();
 window.marineLimitMap={project:(lon,lat)=>screen(...project(lon,lat)),utm:geographicToUTM,getView:()=>({...view}),getTileState:()=>tiles.snapshot(),getDetailState:()=>marineOverlay.snapshot(),featureCount:overview.length};
}catch(error){status('Kartet kunne ikke lastes. Last siden på nytt.');console.error(error);}
