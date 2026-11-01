const $=s=>document.querySelector(s),canvas=$('#map'),wrap=$('#map-wrap'),ctx=canvas.getContext('2d');
const embedded=new URLSearchParams(location.search).get('embedded')==='1'&&parent!==window;
document.body.classList.toggle('embedded',embedded);
let dark=false;try{dark=localStorage.getItem('onlyfag.marine-limit.dark')==='true';}catch{}
function theme(value){dark=value;document.body.classList.toggle('dark',dark);$('#theme').setAttribute('aria-pressed',String(dark));schedule();}
$('#theme').hidden=embedded;$('#theme').onclick=()=>{theme(!dark);try{localStorage.setItem('onlyfag.marine-limit.dark',String(dark));}catch{}};
window.addEventListener('message',e=>{if(!embedded||e.source!==parent||e.origin!==location.origin||e.data?.type!=='marine-limit-host')return;if(typeof e.data.dark==='boolean')theme(e.data.dark);});
const view={x:680.3145,y:750.3085,z:1};let w=0,h=0,fit=1,registration,features=[],counties=[],background=[],places=[],ready=false,landMask=null,marker=null,frame=0,terrain=null;
const major=new Set(['Oslo','Bergen','Trondheim','Stavanger','Kristiansand','Tromsø','Bodø','Ålesund','Alta','Kirkenes','Hammerfest','Lillehammer','Hamar','Drammen','Fredrikstad']);
const status=text=>{$('#status').textContent=text;$('#status').hidden=!text;};
function project(lon,lat){const n=registration.coneConstant,rho=1000/Math.tan(Math.PI/4+lat*Math.PI/360)**n,a=n*(lon-registration.centralMeridian)*Math.PI/180,x=rho*Math.sin(a),y=-rho*Math.cos(a),m=registration.matrix;return [x*m[0][0]+y*m[1][0]+m[2][0],x*m[0][1]+y*m[1][1]+m[2][1]];}
function unproject(x,y){const m=registration.matrix,dx=x-m[2][0],dy=y-m[2][1],det=m[0][0]*m[1][1]-m[1][0]*m[0][1],px=(dx*m[1][1]-dy*m[1][0])/det,py=(dy*m[0][0]-dx*m[0][1])/det,rho=Math.hypot(px,py)/1000;return [registration.centralMeridian+Math.atan2(px,-py)/registration.coneConstant*180/Math.PI,(2*Math.atan(rho**(-1/registration.coneConstant))-Math.PI/2)*180/Math.PI];}
function geometryPath(geometry){const path=new Path2D(),bounds=[Infinity,Infinity,-Infinity,-Infinity];const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];
 for(const polygon of polygons)for(const ring of polygon){ring.forEach(([lon,lat],i)=>{const [x,y]=project(lon,lat);bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);if(i)path.lineTo(x,y);else path.moveTo(x,y);});path.closePath();}
 return {path,bounds};}
function scale(){return fit*view.z;}
function world(x,y){const s=scale();return [view.x+(x-w/2)/s,view.y+(y-h/2)/s];}
function screen(x,y){const s=scale();return [(x-view.x)*s+w/2,(y-view.y)*s+h/2];}
function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});}
function resize(){const r=wrap.getBoundingClientRect();w=r.width;h=r.height;fit=Math.min((w-34)/1360.629,(h-24)/1500.617);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);schedule();}
function visible(bounds){const [x0,y0]=world(0,0),[x1,y1]=world(w,h);return bounds[2]>=x0&&bounds[0]<=x1&&bounds[3]>=y0&&bounds[1]<=y1;}
function draw(){if(!w||!h)return;const dpr=canvas.width/w;ctx.setTransform(dpr,0,0,dpr,0,0);const css=getComputedStyle(document.body),color=name=>css.getPropertyValue(name).trim();ctx.fillStyle=color('--water');ctx.fillRect(0,0,w,h);if(!ready)return;
 const s=scale();ctx.setTransform(dpr*s,0,0,dpr*s,dpr*(w/2-view.x*s),dpr*(h/2-view.y*s));ctx.fillStyle=color('--neighbour');ctx.strokeStyle=color('--border');ctx.lineWidth=.6/s;
 for(const f of background){ctx.fill(f.path,'evenodd');ctx.stroke(f.path);}
 ctx.fillStyle=color('--land');for(const f of counties)ctx.fill(f.path,'evenodd');
 if($('#terrain-layer').checked&&terrain?.complete&&terrain.naturalWidth&&view.z<=7){ctx.save();ctx.clip(landMask,'evenodd');ctx.globalAlpha=dark?.25:.65;ctx.drawImage(terrain,0,0,1360.629,1500.617);ctx.restore();}
 ctx.strokeStyle=color('--border');ctx.lineWidth=.6/s;for(const f of counties)ctx.stroke(f.path);
 if($('#marine-layer').checked){ctx.save();ctx.clip(landMask,'evenodd');ctx.fillStyle=color('--marine');ctx.globalAlpha=dark?.7:.55;for(const f of features)if(visible(f.bounds))ctx.fill(f.path,'evenodd');ctx.globalAlpha=1;ctx.restore();}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.font='12px "Segoe UI", sans-serif';ctx.textBaseline='middle';const labels=[];
 for(const p of places){if(view.z<3&&!major.has(p.name)&&!major.has(p.centreName))continue;const [x,y]=screen(...p.point);if(x<8||x>w-15||y<10||y>h-15)continue;const width=ctx.measureText(p.name).width,box=[x+7,y-9,x+width+13,y+9];if(labels.some(b=>box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1]))continue;labels.push(box);ctx.fillStyle=color('--ink');ctx.beginPath();ctx.arc(x,y,2.5,0,2*Math.PI);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=color('--paper');ctx.strokeText(p.name,x+8,y);ctx.fillText(p.name,x+8,y);}
 if(marker){const [x,y]=screen(...marker);ctx.beginPath();ctx.arc(x,y,7,0,2*Math.PI);ctx.strokeStyle=dark?'#ffcf70':'#a94916';ctx.lineWidth=3;ctx.stroke();}
 const [a,b]=world(w/2,h/2),start=unproject(a,b),end=unproject(a+100/s,b),r=Math.PI/180,dlat=(end[1]-start[1])*r,dlon=(end[0]-start[0])*r,km=12742*Math.asin(Math.min(1,Math.sqrt(Math.sin(dlat/2)**2+Math.cos(start[1]*r)*Math.cos(end[1]*r)*Math.sin(dlon/2)**2)));
 $('#scale').textContent=km>=1?`${Math.round(km)} km`:`${Math.round(km*1000)} m`;$('#scale').style.width='100px';
}
function zoom(factor,x=w/2,y=h/2){if(!ready)return;const anchor=world(x,y);view.z=Math.max(.75,Math.min(80,view.z*factor));view.x=anchor[0]-(x-w/2)/scale();view.y=anchor[1]-(y-h/2)/scale();schedule();}
function home(){status('');$('#place').value='';Object.assign(view,{x:680.3145,y:750.3085,z:1});marker=null;$('#info').hidden=true;schedule();}
function inspect(x,y){if(!ready)return;const [px,py]=world(x,y);ctx.save();ctx.setTransform(1,0,0,1,0,0);const found=ctx.isPointInPath(landMask,px,py,'evenodd')&&features.some(f=>px>=f.bounds[0]&&px<=f.bounds[2]&&py>=f.bounds[1]&&py<=f.bounds[3]&&ctx.isPointInPath(f.path,px,py,'evenodd'));ctx.restore();marker=[px,py];$('#info-title').textContent=found?'Kartlagt under marin grense':'Ingen blå flate her';$('#info-text').textContent=found?'Dette punktet ligger i NGUs kartlag «Areal under marin grense». Blåfargen viser tidligere havbunn, ikke påvist marin leire.':'Punktet ligger utenfor flatene i dette kartuttrekket. Kartdekning og forenkling må tas med i vurderingen; fravær av blåfarge er ikke alene en avklaring.';$('#info').hidden=false;schedule();}
$('#zoom-in').onclick=()=>zoom(1.5);$('#zoom-out').onclick=()=>zoom(1/1.5);$('#home').onclick=home;$('#close-info').onclick=()=>{$('#info').hidden=true;marker=null;schedule();};
for(const id of ['marine-layer','terrain-layer'])$('#'+id).onchange=schedule;
canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoom(e.deltaY<0?1.2:1/1.2,e.clientX-r.left,e.clientY-r.top);},{passive:false});
canvas.addEventListener('keydown',e=>{const delta=70/scale();if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))e.preventDefault();if(e.key==='+'||e.key==='=')zoom(1.5);if(e.key==='-')zoom(1/1.5);if(e.key==='Home')home();if(e.key==='ArrowLeft')view.x-=delta;if(e.key==='ArrowRight')view.x+=delta;if(e.key==='ArrowUp')view.y-=delta;if(e.key==='ArrowDown')view.y+=delta;schedule();});
const pointers=new Map();let previousPinch=null,drag=null,moved=false;
function point(e){const r=canvas.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
function pinch(){const [a,b]=[...pointers.values()];return {mid:[(a[0]+b[0])/2,(a[1]+b[1])/2],distance:Math.hypot(a[0]-b[0],a[1]-b[1])};}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);const p=point(e);pointers.set(e.pointerId,p);if(pointers.size===1){drag={start:p,x:view.x,y:view.y};moved=false;}else{previousPinch=pinch();drag=null;moved=true;}canvas.classList.add('dragging');});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const p=point(e);pointers.set(e.pointerId,p);if(pointers.size>=2){const next=pinch();if(previousPinch&&previousPinch.distance>0){const anchor=world(...previousPinch.mid);view.z=Math.max(.75,Math.min(80,view.z*next.distance/previousPinch.distance));view.x=anchor[0]-(next.mid[0]-w/2)/scale();view.y=anchor[1]-(next.mid[1]-h/2)/scale();}previousPinch=next;schedule();return;}if(drag){const dx=p[0]-drag.start[0],dy=p[1]-drag.start[1];if(Math.hypot(dx,dy)>6)moved=true;view.x=drag.x-dx/scale();view.y=drag.y-dy/scale();schedule();}});
function endPointer(e,cancelled=false){if(!pointers.has(e.pointerId))return;const wasPinch=!!previousPinch;pointers.delete(e.pointerId);if(!cancelled&&!moved&&!wasPinch)inspect(...point(e));drag=null;previousPinch=null;if(pointers.size){const p=[...pointers.values()][0];drag={start:p,x:view.x,y:view.y};moved=true;}else canvas.classList.remove('dragging');}
canvas.addEventListener('pointerup',e=>endPointer(e));canvas.addEventListener('pointercancel',e=>endPointer(e,true));canvas.addEventListener('lostpointercapture',e=>endPointer(e,true));
function normalize(s){return s.trim().normalize('NFKC').toLocaleLowerCase('nb');}
$('#place-form').onsubmit=e=>{e.preventDefault();const query=normalize($('#place').value);const p=places.find(p=>normalize(p.name)===query)||places.find(p=>normalize(p.centreName)===query);if(!p){status('Velg en kommune fra listen.');return;}status('');view.x=p.point[0];view.y=p.point[1];view.z=18;marker=p.point;$('#info').hidden=true;schedule();canvas.focus({preventScroll:true});};
const dialog=$('#about-dialog');for(const id of ['about','sources'])$('#'+id).onclick=()=>dialog.showModal();$('#close-about').onclick=()=>dialog.close();
new ResizeObserver(resize).observe(wrap);theme(dark);
async function json(url){const r=await fetch(url);if(!r.ok)throw Error('Kartdata kunne ikke lastes.');return r.json();}
try{
 const base='../assets/geography/';const [reg,countyData,bg,marine,metadata]=await Promise.all([json(base+'sources/norway-county-registration.json'),json(base+'norway-counties.json'),json(base+'marine-limit/background.json?v=20261101-1'),json(base+'marine-limit/data/under-marine-limit.geojson?v=20261101-1'),json(base+'marine-limit/data/metadata.json?v=20261101-1')]);
 registration=reg;counties=countyData.map(f=>({name:f.n,path:new Path2D(f.d)}));landMask=new Path2D();for(const f of counties)landMask.addPath(f.path);background=bg.features.map(f=>geometryPath(f.geometry));places=bg.places.map(p=>({...p,point:project(p.lon,p.lat)})).sort((a,b)=>Number(major.has(b.name))-Number(major.has(a.name))||a.name.localeCompare(b.name,'nb'));
 for(const p of [...places].sort((a,b)=>a.name.localeCompare(b.name,'nb'))){const option=document.createElement('option');option.value=p.name;$('#places').append(option);}
 if(!marine.features?.length)throw Error('Kartlaget mangler flater.');features=marine.features.map(f=>geometryPath(f.geometry));
 const date=value=>new Intl.DateTimeFormat('nb-NO',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));
 $('#source-description').textContent=`NGU: Areal under marin grense. Datauttrekk ${date(metadata.sourceDate)}, hentet via ${metadata.mirror} ${date(metadata.fetchedOn)}. Visningsgeometrien er forenklet med ${metadata.simplificationMeters} meter toleranse. Kartlaget viser Fastlands-Norge.`;
 terrain=new Image();terrain.onload=schedule;terrain.src=base+'norway-county-relief/fylker-117d1b5de1c1.webp';ready=true;status('');resize();
 // Coordinates and state are exposed read-only for reproducible map verification.
 window.marineLimitMap={project:(lon,lat)=>screen(...project(lon,lat)),getView:()=>({...view}),featureCount:features.length};
}catch(error){status('Kartet kunne ikke lastes. Last siden på nytt.');console.error(error);}
