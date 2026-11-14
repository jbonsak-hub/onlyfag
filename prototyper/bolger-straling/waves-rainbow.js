// Original geometrical-optics diagrams: Snell refraction, ray/surface intersections.
const DEG=Math.PI/180;
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const mul=(a,s)=>[a[0]*s,a[1]*s];
const unit=a=>mul(a,1/Math.hypot(...a));
const clamp=x=>Math.max(-1,Math.min(1,x));
const rotate=(a,angle)=>[a[0]*Math.cos(angle)-a[1]*Math.sin(angle),a[0]*Math.sin(angle)+a[1]*Math.cos(angle)];
const num=(n,d=1)=>n.toLocaleString('nb-NO',{maximumFractionDigits:d});
const fmtPoint=p=>p.map(v=>v.toFixed(2)).join(',');
const svgPath=points=>'M'+points.map(fmtPoint).join('L');

/** normal points into the incident medium; returns null for total reflection. */
export function refractRay(direction,normal,n1,n2){
  const d=unit(direction),n=unit(normal),eta=n1/n2,c=-dot(d,n),k=1-eta*eta*(1-c*c);
  return k<0?null:unit(add(mul(d,eta),mul(n,eta*c-Math.sqrt(Math.max(0,k)))));
}

export function rainbowAngles(n){
  const incidence=Math.acos(Math.sqrt((n*n-1)/3));
  const refraction=Math.asin(Math.sin(incidence)/n);
  return {incidenceDeg:incidence/DEG,refractionDeg:refraction/DEG,impact:Math.sin(incidence),rainbowDeg:(4*refraction-2*incidence)/DEG};
}

/** Unit drop, horizontal sunlight; negative y impact means upper half of drop. */
export function traceRainbow(n,impact=rainbowAngles(n).impact){
  const b=Math.max(0,Math.min(.999999,Math.abs(impact))),entry=[-Math.sqrt(1-b*b),-b],incoming=[1,0];
  const inside=refractRay(incoming,entry,1,n);
  const reflection=add(entry,mul(inside,-2*dot(entry,inside)));
  const reflected=add(inside,mul(reflection,-2*dot(inside,reflection)));
  const exit=add(reflection,mul(reflected,-2*dot(reflection,reflected)));
  const outgoing=refractRay(reflected,mul(exit,-1),n,1);
  return {entry,reflection,exit,incoming,inside,reflected,outgoing,impact:b,angleDeg:outgoing?Math.acos(clamp(dot(outgoing,[-1,0])))/DEG:NaN};
}

function raySegment(origin,direction,a,b){
  const edge=[b[0]-a[0],b[1]-a[1]],cross=(v,w)=>v[0]*w[1]-v[1]*w[0],den=cross(direction,edge);
  if(Math.abs(den)<1e-10)return null;
  const delta=[a[0]-origin[0],a[1]-origin[1]],t=cross(delta,edge)/den,u=cross(delta,direction)/den;
  return t>1e-7&&u>=-1e-8&&u<=1+1e-8?{point:add(origin,mul(direction,t)),distance:t,normal:unit([edge[1],-edge[0]])}:null;
}

/** Equilateral prism, rotated in screen coordinates. Input sunlight stays horizontal. */
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
const label=(x,y,text,extra='')=>`<text x="${x}" y="${y}" ${extra}>${text}</text>`;
const arrow=(a,b,color,width=2)=>{
  const d=unit([b[0]-a[0],b[1]-a[1]]),normal=[-d[1],d[0]],back=add(b,mul(d,-7));
  return `<path d="${svgPath([a,b])}" fill="none" stroke="${color}" stroke-width="${width}"/><path d="${svgPath([add(back,mul(normal,3)),b,add(back,mul(normal,-3))])}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
};

const style=`<style>
.wvr-details{margin-top:14px;border:1px solid var(--line,#dce5de);border-radius:11px;padding:0 15px;background:var(--surface,#fff)}.wvr-details>summary{padding:12px 0;cursor:pointer;font-size:13px;font-weight:650;color:var(--green,#236448)}.wvr-details>p{font-size:12px;color:var(--muted,#60736b)}.wvr-details h4{font-size:14px;margin:18px 0 7px}.wvr-model>svg{display:block;width:100%;height:auto;overflow:hidden;border-radius:9px;background:var(--bg,#f7f9f7)}.wvr-model svg text{font:13px system-ui,sans-serif;fill:var(--ink,#20352e)}.wvr-model svg .wvr-small{font-size:11px;fill:var(--muted,#60736b)}.wvr-model .readout{font-variant-numeric:tabular-nums}.wvr-model .readout>div{font-size:12px}.wvr-model .readout strong{font-size:14px}.wvr-model .control output{font-weight:650;margin-left:8px}.wvr-steps{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;margin:8px 0;color:var(--muted,#60736b)}.wvr-steps b{display:inline-grid;place-items:center;border:1px solid var(--line,#dce5de);border-radius:50%;width:18px;height:18px;margin-right:4px;color:var(--green,#236448)}
</style>`;

export const rainbowSectionHtml=`${style}<details class="wvr-details" id="wvr-details"><summary>Utforsk videre: regnbue og prisme</summary><p>Hvitt sollys består av mange bølgelengder. Brytningsindeksen avhenger litt av bølgelengden, så fargene får ulike retninger.</p>
<h4>En regndråpe: to brytninger og én refleksjon</h4>
<div class="model wvr-model"><svg id="wvr-drop" viewBox="0 0 760 330" role="img" aria-label="Lys brytes inn i en dråpe, reflekteres én gang og brytes ut i ulike farger"></svg><div class="controls"><label class="control" for="wvr-drop-colors">Vis stråler<select id="wvr-drop-colors"><option value="both">Rødt og fiolett</option><option value="red">Bare rødt</option><option value="violet">Bare fiolett</option></select></label><label class="control" for="wvr-drop-impact">Hvor høyt lyset treffer <output id="wvr-drop-impact-value"></output><input id="wvr-drop-impact" type="range" min="0.1" max="0.96" step="0.005" value="0.86"></label><button class="secondary" id="wvr-drop-reset" type="button">Strålen som gir regnbue</button></div><div class="readout" id="wvr-drop-readout" aria-live="polite"></div><div class="wvr-steps"><span><b>1</b>Brytning inn</span><span><b>2</b>Én indre refleksjon</span><span><b>3</b>Brytning ut</span></div><p class="model-note">Geometrisk strålemodell av en rund dråpe. Bare lysveien som gir den primære regnbuen vises; noe lys går andre veier ved hver flate. Rødt og fiolett kommer tilbake med omtrent 42° og 40° vinkel til retningen mot sola. Sett fra observatøren gir dette samme vinkel rundt retningen bort fra sola. De små fargeforskjellene er ikke overdrevet i tegningen.</p></div>
<h4>Et prisme deler opp hvitt lys</h4>
<div class="model wvr-model"><svg id="wvr-prism" viewBox="0 0 760 330" role="img" aria-label="Hvitt lys brytes inn i og ut av et glassprisme, og fargene går i ulike retninger"></svg><div class="controls"><label class="control" for="wvr-prism-angle">Vri prismet <output id="wvr-prism-angle-value"></output><input id="wvr-prism-angle" type="range" min="12" max="30" step="0.5" value="18"></label><label class="control" for="wvr-prism-material">Glassmodell<select id="wvr-prism-material"><option value="crown">Lite fargespredning</option><option value="flint">Mer fargespredning</option></select></label></div><div class="readout" id="wvr-prism-readout" aria-live="polite"></div><p class="model-note">To forenklede glassmodeller med bølgelengdeavhengig brytningsindeks. Strålene beregnes med brytningsloven ved begge prismets flater. Rødt avbøyes minst, fiolett mest. Prismet lager ikke fargene; det skiller lys som allerede er i blandingen.</p></div>
<p><a href="https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_all.html" target="_blank" rel="noopener">Utforsk flere lysforsøk i PhET: Brytning av lys ↗</a> · <a href="https://www.weather.gov/fgz/Rainbow" target="_blank" rel="noopener">NOAA: Slik dannes en regnbue ↗</a></p></details>`;

export function mountRainbow(root,api){
  const q=id=>root.querySelector('#'+id);
  if(!q('wvr-drop'))return ()=>{};
  const dropColors=q('wvr-drop-colors'),impact=q('wvr-drop-impact'),prismAngle=q('wvr-prism-angle'),material=q('wvr-prism-material');
  let previousDrop='',previousPrism='',dropMarkup='',prismMarkup='',dropRays=[],prismRays=[];
  const dropColorData=[{id:'red',name:'Rødt',n:1.331,color:'#e25b5b'},{id:'violet',name:'Fiolett',n:1.343,color:'#8d69d2'}];
  const badge=(p,n)=>`<circle cx="${p[0]}" cy="${p[1]}" r="11" fill="var(--surface,#fff)" stroke="var(--line,#dce5de)"/>${label(p[0],p[1]+4,n,'text-anchor="middle"')}`;

  function prepareDrop(){
    const key=dropColors.value+'|'+impact.value;
    if(key===previousDrop)return;previousDrop=key;
    const b=Number(impact.value),cx=468,cy=112,radius=78,map=p=>[cx+radius*p[0],cy+radius*p[1]];
    const active=dropColorData.filter(c=>dropColors.value==='both'||dropColors.value===c.id);
    const reference=traceRainbow(active[0].n,b),entry=map(reference.entry),start=[80,entry[1]];
    let out=`<title>Lysveien i en regndråpe</title><desc>Hvitt lys brytes inn, reflekteres én gang inne i dråpen og brytes ut. Rødt og fiolett får litt ulike retninger.</desc><defs><radialGradient id="wvr-water-gradient" cx="35%" cy="28%"><stop stop-color="#ecfaff" stop-opacity=".95"/><stop offset="1" stop-color="#a5d5e4" stop-opacity=".65"/></radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${radius}" fill="url(#wvr-water-gradient)" stroke="#7aafb9" stroke-width="1.8"/><path d="M${cx-42},${cy-48}Q${cx-20},${cy-68} ${cx+4},${cy-66}" fill="none" stroke="white" stroke-width="4" opacity=".65"/>`;
    out+=`<path d="${svgPath([start,entry])}" stroke="#b7bfac" stroke-width="7" fill="none"/><path d="${svgPath([start,entry])}" stroke="#fff9d5" stroke-width="4" fill="none"/>${arrow([122,entry[1]],[168,entry[1]],'#b7a566',1.8)}${label(80,Math.max(20,entry[1]-17),'Hvitt sollys →')}`;
    dropRays=[];
    for(const c of [...active].reverse()){
      const trace=traceRainbow(c.n,b),p1=map(trace.entry),p2=map(trace.reflection),p3=map(trace.exit);
      const maxLength=Math.min((p3[0]-82)/Math.max(.01,-trace.outgoing[0]),(303-p3[1])/Math.max(.01,trace.outgoing[1]));
      const end=add(p3,mul(trace.outgoing,maxLength));
      const points=[start,p1,p2,p3,end];
      out+=`<path d="${svgPath(points.slice(1))}" stroke="${c.color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${arrow(add(p3,mul(trace.outgoing,maxLength*.55)),add(p3,mul(trace.outgoing,maxLength*.55+29)),c.color,2)}`;
      dropRays.push({color:c.color,points});
    }
    const p2=map(reference.reflection),p3=map(reference.exit),referenceEnd=add(p3,[-148,0]);
    out+=`<path d="${svgPath([p3,referenceEnd])}" stroke="var(--muted,#60736b)" stroke-width="1" stroke-dasharray="4 4"/>${label(referenceEnd[0]-4,referenceEnd[1]-10,'Rett tilbake mot sola','class="wvr-small" text-anchor="end"')}`;
    const arcR=43,arcStart=add(p3,[-arcR,0]),arcEnd=add(p3,mul(reference.outgoing,arcR));
    if(Number.isFinite(reference.angleDeg)&&reference.angleDeg>1){out+=`<path d="M${fmtPoint(arcStart)}A${arcR},${arcR} 0 0 0 ${fmtPoint(arcEnd)}" stroke="${active[0].color}" fill="none" stroke-width="1.5"/>${label(p3[0]-68,p3[1]+24,num(reference.angleDeg)+'°','class="wvr-small"')}`;}
    out+=badge([entry[0]-20,entry[1]-20],1)+badge([p2[0]+23,p2[1]],2)+badge([p3[0]+21,p3[1]+16],3)+label(590,80,'Regndråpe')+label(590,103,'Et snitt gjennom dråpen.','class="wvr-small"');
    out+=label(156,318,'Lys tilbake mot en observatør','class="wvr-small"');
    dropMarkup=out;
    q('wvr-drop-impact-value').textContent=num(b,2)+' R';
    q('wvr-drop-readout').innerHTML=active.map(c=>`<div><span style="color:${c.color}">●</span> ${c.name}: <strong>${num(traceRainbow(c.n,b).angleDeg)}°</strong><br><small>n = ${num(c.n,3)}</small></div>`).join('');
  }

  function preparePrism(){
    const key=prismAngle.value+'|'+material.value;if(key===previousPrism)return;previousPrism=key;
    const rotation=Number(prismAngle.value),cx=326,cy=118,scale=77,map=p=>[cx+scale*p[0],cy+scale*p[1]];
    const colors=[{name:'Rødt',lambda:.66,color:'#e35c59'},{name:'Oransje',lambda:.61,color:'#e89b43'},{name:'Gult',lambda:.58,color:'#d6ba48'},{name:'Grønt',lambda:.54,color:'#50a378'},{name:'Blått',lambda:.47,color:'#4c8fd0'},{name:'Fiolett',lambda:.41,color:'#9b73d3'}];
    const nFor=c=>material.value==='crown'?1.5046+.0042/c.lambda**2:1.5943+.0095/c.lambda**2;
    const first=tracePrism(nFor(colors[0]),rotation),vertices=first.vertices.map(map),origin=map(first.origin),entry=map(first.entry);
    let out=`<title>Et glassprisme sprer hvitt lys</title><desc>Hvitt, horisontalt lys brytes ved inngangen til et trekantet prisme. Fargene brytes forskjellig ved inngang og utgang og skilles i et spekter.</desc><defs><linearGradient id="wvr-prism-glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d5ecf1" stop-opacity=".6"/><stop offset="1" stop-color="#93bccd" stop-opacity=".3"/></linearGradient></defs><path d="${svgPath([...vertices,vertices[0]])}" fill="url(#wvr-prism-glass)" stroke="#88aab7" stroke-width="1.5"/><path d="${svgPath([origin,entry])}" stroke="#b8bca8" stroke-width="8" fill="none"/><path d="${svgPath([origin,entry])}" stroke="#fffbe2" stroke-width="5" fill="none"/>${arrow(add(origin,[30,0]),add(origin,[74,0]),'#b7a566',2)}${label(origin[0],origin[1]-18,'Hvitt lys →')}`;
    prismRays=[];let values=[];
    for(const c of colors){
      const n=nFor(c),trace=tracePrism(n,rotation);values.push({name:c.name,deviation:trace.deviationDeg,color:c.color});
      if(!trace.outgoing)continue;
      const p1=map(trace.entry),p2=map(trace.exit),availableY=294-p2[1],availableX=705-p2[0],length=Math.min(availableX/Math.max(.01,trace.outgoing[0]),availableY/Math.max(.01,trace.outgoing[1]));
      const end=add(p2,mul(trace.outgoing,length)),points=[origin,p1,p2,end];
      out+=`<path d="${svgPath(points.slice(1))}" fill="none" stroke="${c.color}" stroke-width="2.1" stroke-linejoin="round"/>`;
      prismRays.push({color:c.color,points});
      if(c.name==='Rødt'||c.name==='Fiolett')out+=label(end[0]+(c.name==='Rødt'?10:-10),Math.min(318,end[1]+(c.name==='Rødt'?-7:20)),c.name,`class="wvr-small" text-anchor="${c.name==='Rødt'?'start':'end'}"`);
    }
    out+=label(565,62,'Samme hvite lys')+label(565,84,'– ulike brytningsindekser.','class="wvr-small"');
    prismMarkup=out;
    q('wvr-prism-angle-value').textContent=num(rotation)+'°';
    q('wvr-prism-readout').innerHTML=[values[0],values.at(-1)].map(v=>`<div><span style="color:${v.color}">●</span> ${v.name}: <strong>${num(v.deviation)}°</strong><br><small>samlet avbøyning</small></div>`).join('');
  }
  [dropColors,impact,prismAngle,material].forEach(el=>el.addEventListener('input',()=>api.repaint()));
  q('wvr-drop-reset').addEventListener('click',()=>{impact.value='0.86';dropColors.value='both';api.repaint();});
  api.onFrame(t=>{
    prepareDrop();preparePrism();
    const phase=((t*.22)%1+1)%1;
    const moving=rays=>rays.map((ray,i)=>{const p=photon(ray.points,(phase+i*.025)%1);return `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${ray.color}" stroke="white" stroke-width="1"/>`;}).join('');
    q('wvr-drop').innerHTML=dropMarkup+moving(dropRays);
    q('wvr-prism').innerHTML=prismMarkup+moving(prismRays);
  });
  return ()=>{};
}
