// Original ray diagrams. Optical constants stay internal; the pupils use angles and light paths.
const DEG=Math.PI/180;
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const mul=(a,s)=>[a[0]*s,a[1]*s];
const unit=a=>mul(a,1/Math.hypot(...a));
const clamp=x=>Math.max(-1,Math.min(1,x));
const rotate=(a,angle)=>[a[0]*Math.cos(angle)-a[1]*Math.sin(angle),a[0]*Math.sin(angle)+a[1]*Math.cos(angle)];
const num=(n,d=1)=>n.toLocaleString('nb-NO',{maximumFractionDigits:d});
const point=p=>p.map(v=>v.toFixed(2)).join(',');
const path=points=>'M'+points.map(point).join('L');
const text=(x,y,value,extra='')=>`<text x="${x}" y="${y}" ${extra}>${value}</text>`;

/** The normal points into the incident medium. */
export function refractRay(direction,normal,n1,n2){
 const d=unit(direction),n=unit(normal),eta=n1/n2,c=-dot(d,n),k=1-eta*eta*(1-c*c);
 return k<0?null:unit(add(mul(d,eta),mul(n,eta*c-Math.sqrt(Math.max(0,k)))));
}

/** Stationary ray for one or two internal reflections. Angles are measured from the antisolar direction. */
export function rainbowAngles(n,reflections=1){
 if(!(n>1)||![1,2].includes(reflections))throw new RangeError('A water drop uses one or two internal reflections.');
 const incidence=Math.acos(Math.sqrt((n*n-1)/(reflections*(reflections+2))));
 const refraction=Math.asin(Math.sin(incidence)/n);
 const deviation=reflections*Math.PI+2*incidence-2*(reflections+1)*refraction;
 return {incidenceDeg:incidence/DEG,refractionDeg:refraction/DEG,impact:Math.sin(incidence),rainbowDeg:Math.abs(Math.PI-deviation)/DEG,reflections};
}

/** A unit drop. Positive impact enters above its centre; negative impact mirrors the path. */
export function traceRainbow(n,impact=null,reflections=1){
 const value=impact??rainbowAngles(n,reflections).impact;
 const b=Math.max(-.999999,Math.min(.999999,value));
 const entry=[-Math.sqrt(1-b*b),-b],incoming=[1,0],inside=refractRay(incoming,entry,1,n);
 let current=entry,direction=inside;
 const reflectionPoints=[],insideDirections=[inside];
 for(let i=0;i<reflections;i++){
  current=add(current,mul(direction,-2*dot(current,direction)));
  reflectionPoints.push(current);
  direction=add(direction,mul(current,-2*dot(direction,current)));
  insideDirections.push(direction);
 }
 const exit=add(current,mul(direction,-2*dot(current,direction)));
 const outgoing=refractRay(direction,mul(exit,-1),n,1);
 return {entry,reflection:reflectionPoints[0],reflectionPoints,exit,incoming,inside,reflected:insideDirections[1],insideDirections,outgoing,impact:b,reflections,angleDeg:outgoing?Math.acos(clamp(dot(outgoing,[-1,0])))/DEG:NaN};
}

function raySegment(origin,direction,a,b){
 const edge=[b[0]-a[0],b[1]-a[1]],cross=(v,w)=>v[0]*w[1]-v[1]*w[0],den=cross(direction,edge);
 if(Math.abs(den)<1e-10)return null;
 const delta=[a[0]-origin[0],a[1]-origin[1]],t=cross(delta,edge)/den,u=cross(delta,direction)/den;
 return t>1e-7&&u>=-1e-8&&u<=1+1e-8?{point:add(origin,mul(direction,t)),distance:t,normal:unit([edge[1],-edge[0]])}:null;
}

/** Equilateral prism. Screen-coordinate rotation, horizontal incoming ray. */
export function tracePrism(n,rotationDeg=18){
 const vertices=[[-1,1/Math.sqrt(3)],[0,-2/Math.sqrt(3)],[1,1/Math.sqrt(3)]].map(v=>rotate(v,rotationDeg*DEG));
 const incoming=[1,0],origin=[-2.8,-.15];
 const hit=(start,direction)=>vertices.map((v,i)=>raySegment(start,direction,v,vertices[(i+1)%3])).filter(Boolean).sort((a,b)=>a.distance-b.distance)[0];
 const first=hit(origin,incoming);
 if(!first)return {vertices,origin,incoming,entry:null,exit:null,outgoing:null};
 const inside=refractRay(incoming,first.normal,1,n),second=hit(add(first.point,mul(inside,1e-6)),inside);
 const outgoing=second?refractRay(inside,mul(second.normal,-1),n,1):null;
 return {vertices,origin,incoming,entry:first.point,inside,exit:second?.point||null,outgoing,deviationDeg:outgoing?Math.acos(clamp(dot(incoming,outgoing)))/DEG:NaN};
}

function photon(points,phase){
 const distances=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
 let s=phase*distances.reduce((a,b)=>a+b,0);
 for(let i=0;i<distances.length;i++){
  if(s<=distances[i])return add(points[i],mul([points[i+1][0]-points[i][0],points[i+1][1]-points[i][1]],s/distances[i]));
  s-=distances[i];
 }
 return points.at(-1);
}
function arrow(a,b,color,width=2){
 const d=unit([b[0]-a[0],b[1]-a[1]]),normal=[-d[1],d[0]],back=add(b,mul(d,-8));
 return `<path d="${path([a,b])}" fill="none" stroke="${color}" stroke-width="${width}"/><path d="${path([add(back,mul(normal,4)),b,add(back,mul(normal,-4))])}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
}
const colors=[
 {name:'Rødt',lambda:.66,water:1.333,color:'#e95656'},
 {name:'Oransje',lambda:.61,water:1.335,color:'#e79a42'},
 {name:'Gult',lambda:.58,water:1.337,color:'#e8c746'},
 {name:'Grønt',lambda:.54,water:1.339,color:'#4fba83'},
 {name:'Blått',lambda:.47,water:1.342,color:'#4a9de0'},
 {name:'Fiolett',lambda:.41,water:1.345,color:'#a077df'}
];

const styles=`<style>
.wvr-launch{display:flex;align-items:center;justify-content:space-between;gap:18px;width:100%;padding:13px 16px;margin:18px 0 0;background:var(--surface,#fff);border:1px solid var(--line,#d9e3dc);border-radius:10px;color:var(--green,#236448);font:inherit;font-size:13px;font-weight:650;text-align:left;cursor:pointer}.wvr-launch:hover{border-color:var(--green,#236448)}.wvr-launch span:last-child{font-size:19px;flex:none}
dialog.wvr-dialog{box-sizing:border-box;width:min(1140px,calc(100vw - 32px));max-width:1140px;max-height:calc(100dvh - 32px);padding:22px;background:var(--surface,#fff);color:var(--ink,#20352e);border:1px solid var(--line,#d9e3dc);border-radius:15px;overflow:auto}dialog.wvr-dialog::backdrop{background:#132d27a8;backdrop-filter:blur(3px)}.wvr-dialog-heading{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:18px}.wvr-dialog-heading h2{margin:0;font-size:21px;line-height:1.25}.wvr-close{display:grid;place-items:center;width:34px;height:34px;padding:0;flex:none;font-size:24px;line-height:1;background:var(--bg,#f5f8f5);border:1px solid var(--line,#d9e3dc);border-radius:50%;color:var(--ink,#20352e);cursor:pointer}
.topic-page .wvr-dialog .model.wvr-model{margin:0;padding:0;border:0;box-shadow:none;grid-template-columns:minmax(0,1fr) 195px;gap:18px}.wvr-model .model-visual{min-width:0;position:relative}.topic-page .wvr-model .model-visual svg{width:100%;height:auto;display:block;max-height:none;background:#f3f7f7;border-radius:11px}.wvr-model svg text{font:16px system-ui,sans-serif;fill:var(--ink,#20352e)}.wvr-model svg .wvr-small{font-size:14px;fill:var(--muted,#60736b)}.wvr-model svg .wvr-tiny{font-size:12px;fill:var(--muted,#60736b)}
.topic-page .wvr-model .model-panel{justify-content:flex-start;padding-left:18px;border-left:1px solid var(--line,#d9e3dc);gap:18px}.wvr-mode-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px}.wvr-mode-tabs button{font:inherit;font-size:12px;font-weight:600;padding:8px 7px;cursor:pointer;border:1px solid var(--line,#d9e3dc);background:var(--surface,#fff);color:var(--ink,#20352e);border-radius:7px}.wvr-mode-tabs button[aria-pressed=true]{background:var(--green,#236448);border-color:var(--green,#236448);color:var(--surface,#fff)}.wvr-description{font-size:12px;line-height:1.7;margin:0}.wvr-dialog label{display:block;font-size:12px;line-height:1.6}.wvr-dialog select{display:block;width:100%;margin-top:6px;padding:8px;border:1px solid var(--line,#d9e3dc);border-radius:7px;background:var(--surface,#fff);color:var(--ink,#20352e);font:inherit;font-size:12px}.wvr-readout{font-size:12px;line-height:1.65;padding:10px;background:var(--green-soft,#e6f2e8);border-radius:8px}.wvr-readout>div+div{margin-top:9px}.wvr-readout strong{display:block}.wvr-source{font-size:10px;line-height:1.5;color:var(--muted,#60736b)}.wvr-dialog [hidden]{display:none!important}
@media(max-width:800px){.topic-page .wvr-dialog .model.wvr-model{grid-template-columns:1fr}.topic-page .wvr-model .model-panel{border-left:0;border-top:1px solid var(--line,#d9e3dc);padding:14px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:13px}.wvr-mode-tabs,.wvr-description,.wvr-source{grid-column:1/-1}.wvr-dialog-heading{margin-bottom:13px}.wvr-dialog-heading h2{font-size:18px}dialog.wvr-dialog{padding:15px;width:calc(100vw - 20px);max-height:calc(100dvh - 20px)}.wvr-model svg text{font-size:18px}.wvr-model svg .wvr-small{font-size:16px}.wvr-model svg .wvr-tiny{font-size:14px}}
body.dark .wvr-model .model-visual svg{background:#182c2e}body.dark .wvr-model svg .wvr-sky{fill:#21383b}body.dark .wvr-model svg .wvr-ground{fill:#29473c}
</style>`;

export const rainbowSectionHtml=`${styles}<button type="button" class="wvr-launch" id="wvr-open" aria-haspopup="dialog"><span>Utforsk videre: hvordan spres hvitt lys? Vi ser på prisme og regnbue.</span><span aria-hidden="true">↗</span></button>
<dialog class="wvr-dialog" id="wvr-dialog" aria-labelledby="wvr-title"><div class="wvr-dialog-heading"><h2 id="wvr-title">Hvordan spres hvitt lys?</h2><button class="wvr-close" id="wvr-close" type="button" aria-label="Lukk lysforsøket">×</button></div>
 <div class="model model--split wvr-model"><div class="model-visual"><svg id="wvr-scene" viewBox="0 0 860 470" role="img" aria-label="Hvitt lys deles opp i farger i et prisme"></svg></div>
 <aside class="model-panel" aria-label="Velg lysfenomen"><div class="wvr-mode-tabs" role="group" aria-label="Velg figur"><button type="button" id="wvr-mode-prism" aria-pressed="true">Prisme</button><button type="button" id="wvr-mode-rainbow" aria-pressed="false">Regnbue</button></div>
 <p class="wvr-description" id="wvr-description"></p><label id="wvr-reflections-label" for="wvr-reflections" hidden>Lysveien i dråpen<select id="wvr-reflections"><option value="1">Én refleksjon: hovedregnbuen</option><option value="2">To refleksjoner: regnbue nr. 2</option></select></label>
 <div id="wvr-readout" class="wvr-readout" aria-live="polite"></div><a class="wvr-source" href="https://www.weather.gov/fgz/Rainbow" target="_blank" rel="noopener">NOAA: hvordan regnbuer oppstår ↗</a></aside></div></dialog>`;

function prismScene(){
 const map=p=>add([302,203],mul(rotate(p,-30*DEG),103));
 const glass=c=>1.5943+.0095/c.lambda**2;
 const first=tracePrism(glass(colors[0]),20),vertices=first.vertices.map(map),origin=map(first.origin),entry=map(first.entry);
 const rays=colors.map(c=>{
  const trace=tracePrism(glass(c),20),p1=map(trace.entry),p2=map(trace.exit),direction=rotate(trace.outgoing,-30*DEG),end=add(p2,mul(direction,(817-p2[0])/direction[0]));
  return {color:c.color,name:c.name,points:[origin,p1,p2,end]};
 });
 let out=`<title>Et prisme skiller fargene i hvitt lys</title><desc>En hvit lysstråle treffer et trekantet prisme. Fargene brytes i ulike retninger. Rødt bøyes minst og fiolett mest.</desc><defs><linearGradient id="wvr-glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d7edf2" stop-opacity=".8"/><stop offset="1" stop-color="#8cbed0" stop-opacity=".35"/></linearGradient></defs>`;
 out+=text(32,36,'Hvitt lys inneholder mange farger','font-weight="650"');
 out+=`<path d="${path([...vertices,vertices[0]])}" fill="url(#wvr-glass)" stroke="#8aacb9" stroke-width="2"/><path d="${path([origin,entry])}" stroke="#c6c6ae" stroke-width="13"/><path d="${path([origin,entry])}" stroke="#fffce5" stroke-width="8"/>`;
 out+=text(origin[0]+10,origin[1]+25,'Hvitt lys','font-weight="650"');
 out+=arrow(add(origin,mul(unit([entry[0]-origin[0],entry[1]-origin[1]]),45)),add(origin,mul(unit([entry[0]-origin[0],entry[1]-origin[1]]),88)),'#a8a77c',2);
 // Filled neighbours make the modest physical angular separation readable as a continuous spectrum.
 for(let i=0;i<rays.length-1;i++)out+=`<path d="${path([rays[i].points[2],rays[i].points[3],rays[i+1].points[3],rays[i+1].points[2],rays[i].points[2]])}" fill="${rays[i].color}" opacity=".42"/>`;
 for(const ray of [...rays].reverse())out+=`<path d="${path(ray.points.slice(1))}" fill="none" stroke="${ray.color}" stroke-width="3" stroke-linejoin="round"/>`;
 const top=rays[0].points.at(-1),bottom=rays.at(-1).points.at(-1);
 out+=text(804,top[1]-14,'Rødt','text-anchor="end"')+text(804,bottom[1]+23,'Fiolett','text-anchor="end"');
 out+=text(474,411,'Rødt bøyes minst. Fiolett bøyes mest.','font-weight="650"')+text(474,438,'Prismet skiller fargene som allerede er i lyset.','class="wvr-small"');
 return {markup:out,rays};
}

function rainbowScene(reflections){
 const cx=263,cy=335,angleScale=4.25;
 let out=`<title>En dobbel regnbue og lysveien i en regndråpe</title><desc>Hele hovedregnbuen vises sammen med en svakere ytre regnbue med motsatt fargerekkefølge. Den forstørrede dråpen viser ${reflections===1?'én':'to'} indre refleksjon${reflections===1?'':'er'} og vinkelen tilbake til observatøren.</desc>`;
 out+=`<rect x="12" y="14" width="510" height="422" rx="12" fill="#e6f0f3" class="wvr-sky"/><path d="M12 335Q138 319 263 335T522 335V436H12Z" fill="#d2e3d5" class="wvr-ground"/>`;
 // Arcs cover a full semicircle, with endpoints inside the picture rather than clipped.
 for(const order of [2,1])for(const c of [...colors].sort((a,b)=>rainbowAngles(b.water,order).rainbowDeg-rainbowAngles(a.water,order).rainbowDeg)){
  const radius=rainbowAngles(c.water,order).rainbowDeg*angleScale;
  out+=`<path d="M${cx-radius},${cy}A${radius},${radius} 0 0 1 ${cx+radius},${cy}" fill="none" stroke="${c.color}" stroke-width="3" opacity="${order===2?(reflections===2?.65:.4):reflections===1?.96:.6}"/>`;
 }
 out+=text(31,43,'Hele regnbuen sett mot regnet','font-weight="650"')+text(37,70,'Sola er bak deg.','class="wvr-small"');
 out+=text(263,230,'Hovedregnbuen','font-weight="650" text-anchor="middle"')+text(263,252,'Én refleksjon','class="wvr-small" text-anchor="middle"');
 out+=text(263,285,'Regnbue nr. 2','font-weight="650" text-anchor="middle"')+text(263,307,'To refleksjoner · omvendte farger','class="wvr-small" text-anchor="middle"');
 out+=`<path d="M263 335V359" stroke="#7c978d" stroke-dasharray="4 5"/><circle cx="263" cy="379" r="10" fill="#ddb48f"/><path d="M247 414L251 391Q263 385 275 391L280 414" fill="#5a8f7c"/><path d="M255 414L251 429M272 414L277 429" fill="none" stroke="#445665" stroke-width="5" stroke-linecap="round"/>`;
 out+=text(285,391,'Du ser bort fra sola','class="wvr-small"');

 const dropCentre=[692,182],radius=87,map=p=>add(dropCentre,mul(p,radius));
 out+=`<rect x="538" y="14" width="310" height="422" rx="12" fill="var(--surface,#fff)" stroke="var(--line,#d7e2dc)"/>`;
 out+=text(558,43,'Inne i én regndråpe','font-weight="650"')+text(558,68,reflections===1?'To brytninger + én refleksjon':'To brytninger + to refleksjoner','class="wvr-small"');
 out+=`<circle cx="${dropCentre[0]}" cy="${dropCentre[1]}" r="${radius}" fill="#c7e6f0" fill-opacity=".65" stroke="#83b3c1" stroke-width="1.8"/>`;
 const rayColors=[colors[0],colors.at(-1)],rays=[];
 for(const c of [...rayColors].reverse()){
  const optimum=rainbowAngles(c.water,reflections),impact=optimum.impact*(reflections===2?-1:1),trace=traceRainbow(c.water,impact,reflections);
  const p1=map(trace.entry),internal=[p1,...trace.reflectionPoints.map(map),map(trace.exit)],outgoing=trace.outgoing;
  const end=add(internal.at(-1),mul(outgoing,Math.min((internal.at(-1)[0]-560)/Math.max(.01,-outgoing[0]),(366-internal.at(-1)[1])/Math.max(.01,outgoing[1]))));
  const start=[553,p1[1]],points=[start,...internal,end];
  out+=`<path d="${path([start,p1])}" stroke="#fff7c7" stroke-width="5" fill="none"/><path d="${path(internal.concat([end]))}" fill="none" stroke="${c.color}" stroke-width="2.7" stroke-linejoin="round"/>`;
  trace.reflectionPoints.map(map).forEach((p,i)=>{out+=`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${c.color}"/>`;if(c.name==='Rødt')out+=text(p[0]+(p[0]>dropCentre[0]?11:-11),p[1]+5,String(i+1),`font-weight="650" text-anchor="${p[0]>dropCentre[0]?'start':'end'}"`);});
  rays.push({color:c.color,points});
 }
 const shown=traceRainbow(colors[0].water,rainbowAngles(colors[0].water,reflections).impact*(reflections===2?-1:1),reflections),exit=map(shown.exit),back=add(exit,[-50,0]),arcEnd=add(exit,mul(shown.outgoing,38));
 out+=`<path d="${path([exit,back])}" stroke="#9dafa9" stroke-dasharray="3 4" fill="none"/><path d="M${exit[0]-38},${exit[1]}A38 38 0 0 0 ${point(arcEnd)}" stroke="#d98560" fill="none" stroke-width="1.3"/>`;
 out+=text(558,389,'Lyset kommer tilbake mot deg','class="wvr-small"')+text(558,414,reflections===1?'Omtrent 40°–42° fra retningen bort fra sola':'Omtrent 51°–54° fra retningen bort fra sola','class="wvr-tiny"');
 return {markup:out,rays};
}

export function mountRainbow(root,api){
 const q=id=>root.querySelector('#'+id),dialog=q('wvr-dialog'),scene=q('wvr-scene');
 if(!dialog||!scene)return ()=>{};
 const open=q('wvr-open'),close=q('wvr-close'),prism=q('wvr-mode-prism'),rainbow=q('wvr-mode-rainbow'),reflections=q('wvr-reflections');
 let mode='prism',prepared=null,previous='',lastTime=0;
 function prepare(){
  const key=mode+'|'+reflections.value;if(key===previous)return;previous=key;
  prepared=mode==='prism'?prismScene():rainbowScene(Number(reflections.value));
  prism.setAttribute('aria-pressed',String(mode==='prism'));rainbow.setAttribute('aria-pressed',String(mode==='rainbow'));
  q('wvr-reflections-label').hidden=mode!=='rainbow';
  scene.setAttribute('data-mode',mode);scene.setAttribute('data-reflections',mode==='rainbow'?reflections.value:'0');
  scene.setAttribute('aria-label',mode==='prism'?'Hvitt lys brytes og deles i farger i et prisme':'Hele hovedregnbuen og den ytre regnbuen med valgt lysvei i en dråpe');
  q('wvr-description').textContent=mode==='prism'?'Hvitt lys består av mange bølgelengder. Fargene brytes forskjellig når lyset går inn i og ut av prismet.': 'Lys fra mange regndråper danner buene. Den svakere regnbuen ytterst har omvendt fargerekkefølge. Se forskjellen mellom én og to refleksjoner inne i dråpen.';
  q('wvr-readout').innerHTML=mode==='prism'?'<div><strong>Rødt</strong>Bøyes minst.</div><div><strong>Fiolett</strong>Bøyes mest.</div>':Number(reflections.value)===1?'<div><strong>Hovedregnbuen</strong>Én indre refleksjon.</div><div><strong>Omtrent 40°–42°</strong>Rødt ytterst, fiolett innerst.</div>':'<div><strong>Regnbue nr. 2</strong>To indre refleksjoner.</div><div><strong>Omtrent 51°–54°</strong>Fiolett ytterst, rødt innerst.</div>';
 }
 function draw(t){
  lastTime=t;prepare();
  const phase=(t*.2)%1;
  const moving=prepared.rays.map((ray,i)=>{const p=photon(ray.points,(phase+i*.018)%1);return `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${ray.color}" stroke="white" stroke-width="1.2"/>`;}).join('');
  scene.innerHTML=prepared.markup+moving;
 }
 function repaint(){prepare();api.repaint(scene);draw(lastTime);}
 open.addEventListener('click',()=>{mode='prism';reflections.value='1';previous='';dialog.showModal();repaint();close.focus();});
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>open.focus());
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();});
 prism.addEventListener('click',()=>{mode='prism';repaint();});rainbow.addEventListener('click',()=>{mode='rainbow';repaint();});reflections.addEventListener('change',repaint);
 api.onFrame(draw,scene);
 return ()=>{if(dialog.open)dialog.close();};
}
