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
.topic-page .wvr-model .model-panel{justify-content:flex-start;padding-left:18px;border-left:1px solid var(--line,#d9e3dc);gap:18px}.wvr-reflections{display:grid;gap:5px}.wvr-reflections button{min-height:36px;padding:7px 9px;border:1px solid var(--line,#d9e3dc);border-radius:7px;background:var(--surface,#fff);color:var(--ink,#20352e);font:inherit;font-size:12px;font-weight:600;text-align:left;cursor:pointer}
.wvr-reflections button[aria-pressed=true]{background:var(--green,#236448);border-color:var(--green,#236448);color:var(--surface,#fff)}.wvr-reflections button:focus-visible,.wvr-why summary:focus-visible{outline:2px solid var(--green,#236448);outline-offset:2px}
.wvr-description{font-size:12px;line-height:1.7;margin:0}.wvr-readout{font-size:12px;line-height:1.65;padding:10px;background:var(--sidebar,#edf1ef);border-radius:8px}.wvr-readout>div+div{margin-top:9px}.wvr-readout strong{display:block}
.wvr-why{margin-top:9px;padding-top:7px;border-top:1px solid var(--line,#d9e3dc)}.wvr-why summary{font-weight:650;cursor:pointer}.wvr-why p{margin:6px 0 0}
.wvr-source{font-size:10px;line-height:1.5;color:var(--muted,#60736b)}.wvr-dialog [hidden]{display:none!important}
@media(max-width:800px){.topic-page .wvr-dialog .model.wvr-model{grid-template-columns:1fr}.topic-page .wvr-model .model-panel{border-left:0;border-top:1px solid var(--line,#d9e3dc);padding:14px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:13px}.wvr-reflections,.wvr-description,.wvr-readout,.wvr-source{grid-column:1/-1}.wvr-reflections{grid-template-columns:1fr 1fr}.wvr-dialog-heading{margin-bottom:13px}.wvr-dialog-heading h2{font-size:18px}dialog.wvr-dialog{padding:15px;width:calc(100vw - 20px);max-height:calc(100dvh - 20px)}.wvr-model svg text{font-size:18px}.wvr-model svg .wvr-small{font-size:16px}.wvr-model svg .wvr-tiny{font-size:14px}}
body.dark .wvr-model .model-visual svg{background:#182c2e}body.dark .wvr-model svg .wvr-sky{fill:#21383b}body.dark .wvr-model svg .wvr-ground{fill:#29473c}
</style>`;

export const rainbowExampleHtml=`${styles}<div class="model model--split wvr-model"><div class="model-visual"><svg id="wvr-scene" viewBox="0 0 860 470" role="img" aria-label="Hvitt lys deles opp i farger i et prisme"></svg></div>
 <aside class="model-panel" aria-label="Velg lysfenomen">
 <p class="wvr-description" id="wvr-description"></p><div class="wvr-reflections" id="wvr-reflections" aria-label="Lysveien i dråpen" role="group" hidden>
 <button type="button" data-wvr-reflections="1" aria-pressed="true">Én refleksjon</button>
 <button type="button" data-wvr-reflections="2" aria-pressed="false">To refleksjoner</button></div>
 <div id="wvr-readout" class="wvr-readout" aria-live="polite"></div><a class="wvr-source" id="wvr-source" href="https://www.weather.gov/fgz/Rainbow" target="_blank" rel="noopener">Hvordan oppstår regnbuer? (NOAA)</a></aside></div>`;

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
 const centre=[300,226],radius=170,map=p=>add(centre,mul(p,radius));
 const traces=colors.map(c=>{const traced=traceRainbow(c.water,rainbowAngles(c.water,reflections).impact,reflections);return {c,traced};});
 const first=traces[0].traced,entry=map(first.entry),exit=map(first.exit),incomingStart=[24,entry[1]];
 let out=`<title>Lys brytes og reflekteres i en regndråpe</title><desc>En stor vanndråpe viser hvitt lys som kommer fra venstre. Lyset brytes inn, reflekteres ${reflections===1?'én gang':'to ganger'} og brytes ut i farger. Strålene følger brytningsloven. Vinkelen er mellom sollysets retning og retningen lyset kommer tilbake fra. En egen oversikt viser begge hele regnbuene; fargebåndene der er skjematisk forstørret.</desc><defs><radialGradient id="wvr-drop-fill" cx=".34" cy=".3" r=".85"><stop stop-color="#edfaff"/><stop offset="1" stop-color="#bfdfed"/></radialGradient><clipPath id="wvr-drop-rays"><rect x="12" y="45" width="836" height="411"/></clipPath></defs>`;
 out+=text(300,35,'Regndråpe','text-anchor="middle" font-weight="650"');
 out+=`<circle cx="300" cy="226" r="170" fill="url(#wvr-drop-fill)" stroke="#88aebf" stroke-width="1.7"/>`;
 out+=`<g clip-path="url(#wvr-drop-rays)"><path d="${path([incomingStart,entry])}" fill="none" stroke="#a7b4b9" stroke-width="10"/><path d="${path([incomingStart,entry])}" fill="none" stroke="#fffdef" stroke-width="7"/>`;
 const rays=[];
 for(const {c,traced} of [...traces].reverse()){
  const p1=map(traced.entry),internal=[p1,...traced.reflectionPoints.map(map),map(traced.exit)],last=internal.at(-1),d=traced.outgoing;
  const hits=[d[0]<0?(24-last[0])/d[0]:(836-last[0])/d[0],d[1]<0?(47-last[1])/d[1]:(453-last[1])/d[1]].filter(t=>t>0);
  const end=add(last,mul(d,Math.min(...hits)));
  const points=[[24,p1[1]],...internal,end];
  out+=`<path d="${path(internal.concat([end]))}" fill="none" stroke="${c.color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`;
  rays.unshift({color:c.color,points});
 }
 // Direction arrows are placed on the exact red path, away from the labels.
 const redPoints=[entry,...first.reflectionPoints.map(map),exit];
 for(let i=0;i<redPoints.length-1;i++){
  const a=redPoints[i],b=redPoints[i+1],delta=add(b,mul(a,-1));
  out+=arrow(add(a,mul(delta,.44)),add(a,mul(delta,.56)),colors[0].color,1.8);
 }
 out+='</g>';
 out+=text(25,entry[1]+27,'Hvitt lys','class="wvr-small"');
 out+=arrow([79,entry[1]],[114,entry[1]],'#7c8b91',1.6);
 if(reflections===1){
  // Extend the incoming ray horizontally. Back-project the emerging red ray;
  // the outside intersection gives the actual antisolar rainbow angle.
  const back=mul(first.outgoing,-1),travel=(entry[1]-exit[1])/back[1],intersection=add(exit,mul(back,travel));
  const outsideDistance=Math.max(0,-2*dot(first.exit,back)*radius)+9;
  const backStart=add(exit,mul(back,outsideDistance)),backEnd=add(intersection,mul(back,39));
  out+=`<path d="${path([entry,[829,entry[1]]])}" fill="none" stroke="#7f9097" stroke-width="1.35" stroke-dasharray="6 5"/><path d="${path([backStart,backEnd])}" fill="none" stroke="#7f9097" stroke-width="1.35" stroke-dasharray="6 5"/>`;
  const angle=first.angleDeg*DEG,r=47,arcA=add(intersection,[-r,0]),arcB=add(intersection,mul(first.outgoing,r));
  out+=`<path d="M${point(arcA)}A${r} ${r} 0 0 0 ${point(arcB)}" fill="none" stroke="#dd9b3c" stroke-width="2.7"/>`;
  out+=text(intersection[0]-80*Math.cos(angle/2),intersection[1]+80*Math.sin(angle/2)+6,'≈'+Math.round(first.angleDeg)+'°','text-anchor="middle" font-size="19" font-weight="650"');
  out+=text(552,36,'Vinkel tilbake mot observatøren','class="wvr-small"');
  out+=text(113,124,'1. Brytning','class="wvr-small"');
  out+=`<path d="M203 118L${point(add(entry,[-4,5]))}" fill="none" stroke="#8da4ad" stroke-width="1"/>`;
  const reflection=map(first.reflectionPoints[0]);
  out+=text(483,204,'2. Refleksjon','class="wvr-small"');
  out+=`<path d="M483 189L${point(add(reflection,[5,4]))}" fill="none" stroke="#8da4ad" stroke-width="1"/>`;
  out+=text(357,427,'3. Brytning','class="wvr-small"');
  out+=`<path d="M355 411L${point(add(exit,[5,5]))}" fill="none" stroke="#8da4ad" stroke-width="1"/>`;
 }else{
  // For two reflections the emergent direction points upwards in this view.
  // Compare parallel-shifted directions in a separate, explicit angle sketch.
  const base=[616,91],back=mul(first.outgoing,-1),a=first.angleDeg*DEG,r=43;
  out+=text(552,36,'Retningene sammenliknet','class="wvr-small"');
  out+=`<path d="M552 91H818M${point(base)}L${point(add(base,mul(back,138)))}" fill="none" stroke="#7f9097" stroke-width="1.35" stroke-dasharray="6 5"/><path d="M${base[0]+r} ${base[1]}A${r} ${r} 0 0 1 ${point(add(base,mul(back,r)))}" fill="none" stroke="#dd9b3c" stroke-width="2.7"/>`;
  out+=text(base[0]+81*Math.cos(a/2),base[1]+81*Math.sin(a/2)+6,'≈'+Math.round(first.angleDeg)+'°','text-anchor="middle" font-size="19" font-weight="650"');
  out+=text(552,219,'Parallelle hjelpelinjer','class="wvr-tiny"');
  out+=text(128,116,'1. Brytning','class="wvr-small"');
  out+=text(483,203,'2. Refleksjon','class="wvr-small"');
  out+=text(390,423,'3. Refleksjon','class="wvr-small"');
  out+=text(28,333,'4. Brytning','class="wvr-small"');
 }
 // A separate overview keeps the full primary and secondary arcs visible.
 const sky=[550,253,294,203],cx=697,cy=414;
 out+=`<rect x="${sky[0]}" y="${sky[1]}" width="${sky[2]}" height="${sky[3]}" rx="11" fill="#e8f2f5" stroke="#d7e3e6"/><path d="M551 414H843V455H551Z" fill="#d8e7db"/>`;
 out+=text(566,273,'Begge buene sett fra bakken','class="wvr-small" font-weight="650" style="fill:#294b55"');
 out+=text(566,291,'Ytterbuen har omvendte farger','class="wvr-tiny" style="fill:#48626a"');
 for(const order of [2,1])for(let i=0;i<colors.length;i++){
  const r=order===1?81-i*2.25:104+i*2.25;
  out+=`<path d="M${cx-r} ${cy}A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="${colors[i].color}" stroke-width="2.5" opacity="${order===reflections?.96:.34}"/>`;
 }
 out+=`<circle cx="697" cy="426" r="4.5" fill="#ddb48f"/><path d="M691 444L693 434Q697 431 701 434L703 444M694 444L692 452M700 444L703 452" fill="none" stroke="#5d8a79" stroke-width="3.4" stroke-linecap="round"/>`;
 out+=text(718,443,'Sola er bak deg','class="wvr-tiny" style="fill:#48626a"');
 return {markup:out,rays};
}


export function mountRainbowExample(root,api){
 const q=id=>root.querySelector('#'+id),scene=q('wvr-scene');
 if(!scene)return ()=>{};
 const controls=q('wvr-reflections'),reflectionButtons=[...controls.querySelectorAll('[data-wvr-reflections]')];
 let reflections=1,mode='prism',prepared=null,previous='';
 function prepare(){
  const key=mode+'|'+reflections;if(key===previous)return;previous=key;
  prepared=mode==='prism'?prismScene():rainbowScene(reflections);
  controls.hidden=mode!=='rainbow';q('wvr-source').hidden=mode!=='rainbow';
  for(const button of reflectionButtons)button.setAttribute('aria-pressed',String(Number(button.dataset.wvrReflections)===reflections));
  scene.setAttribute('data-mode',mode);scene.setAttribute('data-reflections',mode==='rainbow'?String(reflections):'0');
  scene.setAttribute('aria-label',mode==='prism'?'Hvitt lys brytes og deles i farger i et prisme':'Hele hovedregnbuen og den ytre regnbuen med valgt lysvei i en dråpe');
  q('wvr-description').textContent=mode==='prism'?'Hvitt lys består av mange bølgelengder. Fargene brytes forskjellig når lyset går inn i og ut av prismet.':'Lys fra mange regndråper danner buene. Den svakere regnbuen ytterst har omvendt fargerekkefølge. Se forskjellen mellom én og to refleksjoner inne i dråpen.';
  q('wvr-readout').innerHTML=mode==='prism'?'<div><strong>Rødt bøyes minst.</strong></div><div><strong>Fiolett bøyes mest.</strong></div><details class="wvr-why"><summary>Hvorfor det?</summary><p>Fiolett lys går litt saktere i glass enn rødt lys. Brytningsindeksen er derfor litt større for fiolett. Fargene endrer retning med ulike vinkler når de går inn i og ut av prismet, slik at de skilles.</p></details>':reflections===1?'<div><strong>Hovedregnbuen</strong>Én indre refleksjon.</div><div><strong>Omtrent 40°–42°</strong>Rødt ytterst, fiolett innerst.</div>':'<div><strong>Regnbue nr. 2</strong>To indre refleksjoner.</div><div><strong>Omtrent 51°–54°</strong>Fiolett ytterst, rødt innerst.</div>';
 }
 function draw(t){
  prepare();const phase=(t*.2)%1;
  const moving=prepared.rays.map((ray,i)=>{const p=photon(ray.points,(phase+i*.018)%1);return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="4" fill="'+ray.color+'" stroke="white" stroke-width="1.2"/>';}).join('');
  scene.innerHTML=prepared.markup+moving;
 }
 function repaint(){prepare();api.repaint(scene);}
 function selectMode(next){mode=next==='rainbow'?'rainbow':'prism';repaint();}
 function selectReflection(event){
  const button=event.target.closest('[data-wvr-reflections]');
  if(!button||!controls.contains(button))return;
  reflections=Number(button.dataset.wvrReflections);
  repaint();
 }
 controls.addEventListener('click',selectReflection);
 const removeFrame=api.onFrame(draw,scene);
 const dispose=()=>{controls.removeEventListener('click',selectReflection);removeFrame?.();};
 dispose.selectMode=selectMode;
 return dispose;
}
