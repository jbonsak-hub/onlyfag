// Original refraction lab. Optical constants are internal; pupils work with media, angles and light.
const DEG=Math.PI/180;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const fmt=(v,d=1)=>v.toLocaleString('nb-NO',{maximumFractionDigits:d});
const mediumNames={air:'Luft',water:'Vann',glass:'Glass'};
const whiteSamples=Array.from({length:11},(_,i)=>380+40*i);

/** Transparent-media approximation, with wavelength in vacuum in nm. */
export function materialIndex(medium,wavelengthNm=550){
 if(!(Number.isFinite(wavelengthNm)&&wavelengthNm>0))throw new RangeError('Wavelength must be positive.');
 const wavelength=wavelengthNm/1000,squared=wavelength*wavelength;
 if(medium==='air')return 1;
 if(medium==='water')return 1.322+.003/squared;
 if(medium==='glass')return Math.sqrt(1+1.03961212*squared/(squared-.00600069867)+.231792344*squared/(squared-.0200179144)+1.01046945*squared/(squared-103.560653));
 throw new RangeError('Unknown transparent medium');
}

/** Unpolarized power fractions at a lossless interface. All public angles are degrees. */
export function fresnelPower(firstIndex,secondIndex,incidentDegrees){
 if(!([firstIndex,secondIndex,incidentDegrees].every(Number.isFinite)&&firstIndex>0&&secondIndex>0&&incidentDegrees>=0&&incidentDegrees<=90))throw new RangeError('Invalid optical interface');
 const incident=incidentDegrees*DEG;
 if(Math.abs(firstIndex-secondIndex)<1e-12)return {incidentAngle:incidentDegrees,reflectedAngle:incidentDegrees,transmittedAngle:incidentDegrees,R:0,T:1,Rs:0,Rp:0,totalReflection:false,criticalAngle:null,speedRatio:1};
 const sine=firstIndex/secondIndex*Math.sin(incident),criticalAngle=firstIndex>secondIndex?Math.asin(secondIndex/firstIndex)/DEG:null;
 if(sine>1+1e-12)return {incidentAngle:incidentDegrees,reflectedAngle:incidentDegrees,transmittedAngle:null,R:1,T:0,Rs:1,Rp:1,totalReflection:true,criticalAngle,speedRatio:firstIndex/secondIndex};
 const transmitted=Math.asin(clamp(sine,-1,1)),ci=Math.cos(incident),ct=Math.cos(transmitted);
 const rs=(firstIndex*ci-secondIndex*ct)/(firstIndex*ci+secondIndex*ct);
 const rp=(secondIndex*ci-firstIndex*ct)/(secondIndex*ci+firstIndex*ct);
 const Rs=clamp(rs*rs),Rp=clamp(rp*rp),R=clamp((Rs+Rp)/2);
 return {incidentAngle:incidentDegrees,reflectedAngle:incidentDegrees,transmittedAngle:transmitted/DEG,R,T:1-R,Rs,Rp,totalReflection:false,criticalAngle,speedRatio:firstIndex/secondIndex};
}

/** A display approximation to spectral colour, rather than a colour-matching calculation. */
export function wavelengthColor(wavelengthNm){
 const w=clamp(wavelengthNm,380,780);let r=0,g=0,b=0;
 if(w<440){r=(440-w)/60;b=1;}else if(w<490){g=(w-440)/50;b=1;}else if(w<510){g=1;b=(510-w)/20;}else if(w<580){r=(w-510)/70;g=1;}else if(w<645){r=1;g=(645-w)/65;}else r=1;
 const edge=w<420?.45+.55*(w-380)/40:w>700?.45+.55*(780-w)/80:1;
 return '#'+[r,g,b].map(c=>Math.round(255*Math.pow(clamp(c*edge),.8)).toString(16).padStart(2,'0')).join('');
}

export function refractionLabState({upper='air',lower='water',angleDegrees=45,wavelengthNm=550,white=false}={}){
 const wavelengths=white?whiteSamples:[wavelengthNm];
 const rays=wavelengths.map(w=>({wavelengthNm:w,color:wavelengthColor(w),...fresnelPower(materialIndex(upper,w),materialIndex(lower,w),angleDegrees)}));
 const R=rays.reduce((sum,r)=>sum+r.R,0)/rays.length;
 const transmitted=rays.filter(r=>r.T>1e-8&&r.transmittedAngle!==null),angles=transmitted.map(r=>r.transmittedAngle);
 return {upper,lower,angleDegrees,wavelengthNm,white,rays,R,T:1-R,equalMedia:upper===lower,totalReflection:rays.every(r=>r.totalReflection||r.T<1e-8),partialReflection:rays.some(r=>r.totalReflection)&&transmitted.length>0,transmitted,minAngle:angles.length?Math.min(...angles):null,maxAngle:angles.length?Math.max(...angles):null};
}

const styles=`<style>
.topic-page .model.rf-model{grid-template-columns:minmax(0,1fr) 215px;gap:18px}.rf-stage{position:relative;min-width:0}.topic-page .rf-model .rf-stage svg{display:block;width:100%;height:auto;max-height:none;border-radius:10px;background:var(--sidebar,#eff4f4)}.rf-stage svg text{font:16px system-ui,sans-serif;fill:var(--ink,#20352e)}.rf-stage svg .rf-small{font-size:14px;fill:var(--muted,#60736b)}.rf-stage svg .rf-tiny{font-size:12px;fill:var(--muted,#60736b)}.rf-medium{position:absolute;left:2.4%;z-index:2;width:145px;max-width:29%}.rf-medium-top{top:5.5%}.rf-medium-bottom{bottom:4.2%}.topic-page .rf-model .rf-medium select{box-sizing:border-box;width:100%;font:inherit;font-size:13px;font-weight:650;color:var(--ink,#20352e);background:var(--surface,#fff);border:1px solid var(--line,#d7e1dc);border-radius:7px;padding:8px 10px;cursor:pointer;box-shadow:0 2px 5px #263d3210}.rf-medium select:focus-visible{outline:2px solid var(--green,#236448);outline-offset:2px}
.topic-page .rf-model .model-panel{justify-content:flex-start;gap:16px}.rf-model .controls{display:flex;flex-direction:column;gap:18px}.rf-control-head{display:flex;justify-content:space-between;gap:8px;align-items:baseline}.rf-control-head output{font-weight:650;white-space:nowrap}.rf-white-label{display:flex!important;align-items:center;gap:8px;cursor:pointer}.rf-white-label input{width:16px;height:16px;accent-color:var(--green,#236448);margin:0}.rf-spectrum-track{height:5px;margin-top:9px;border-radius:4px;background:linear-gradient(90deg,#8951c1,#367ee0,#39b4cf,#6bbf52,#edcb48,#f08a42,#d74242)}.rf-model input[type=range]{width:100%;accent-color:var(--rf-color,var(--green,#236448))}.rf-model label:has(input:disabled){color:var(--muted,#60736b)}.rf-model input:disabled{opacity:.5}.rf-power{padding:11px 12px;border-radius:8px;background:var(--green-soft,#e7f3e9);font-size:12px;line-height:1.7}.rf-power-line{display:flex;justify-content:space-between;gap:10px}.rf-power-line strong{font-size:13px}.rf-power-bar{height:5px;display:flex;border-radius:4px;overflow:hidden;background:var(--line,#cbd8d0);margin:7px 0 10px}.rf-reflected-bar{height:100%;background:#7e93aa}.rf-transmitted-bar{height:100%;background:var(--green,#236448)}.rf-angle-values{font-size:12px;line-height:1.7}.rf-angle-values>div+div{margin-top:5px}.rf-status{font-size:12px;line-height:1.65;margin:0}.rf-sources{font-size:11px;color:var(--muted,#60736b)}.rf-sources summary{cursor:pointer}.rf-sources p{font-size:11px;line-height:1.6;margin:7px 0}.rf-sources a{color:var(--green,#236448)}
body.dark .rf-medium-air{fill:#1b3234}body.dark .rf-medium-water{fill:#24424d}body.dark .rf-medium-glass{fill:#29473e}body.dark .rf-inset{fill:#192e2b}
@media(max-width:1100px){.topic-page .model.rf-model{grid-template-columns:1fr}.topic-page .rf-model .model-panel{display:grid;grid-template-columns:1fr 1fr;gap:14px}.topic-page .rf-model .controls{display:grid;grid-template-columns:1fr 1fr;gap:15px;grid-column:1/-1}.rf-white-label{grid-column:1/-1}.rf-status,.rf-sources{grid-column:1/-1}.rf-medium{width:135px}.rf-medium select{font-size:12px!important;padding:6px 8px!important}}
@media(max-width:520px){.rf-medium{max-width:30%;width:125px}.rf-medium select{font-size:11px!important;padding:5px 6px!important}.rf-stage svg text{font-size:18px}.rf-stage svg .rf-small{font-size:16px}.rf-stage svg .rf-tiny{font-size:14px}.topic-page .rf-model .model-panel{grid-template-columns:1fr 1fr}.rf-power-line{display:block}.rf-power-line strong{display:block}.rf-power{padding:9px}.rf-angle-values{font-size:11px}}
</style>`;
const options=selected=>Object.entries(mediumNames).map(([value,label])=>`<option value="${value}"${value===selected?' selected':''}>${label}</option>`).join('');
export const refractionSectionHtml=`${styles}<p>Når lys treffer overgangen mellom to medier, kan noe <strong>reflekteres</strong> og resten gå videre. Lyset som går videre, kan endre retning: det <strong>brytes</strong>. Velg medier direkte i figuren.</p>
<div class="model model--split rf-model" id="rf-lab"><div class="model-visual"><div class="rf-stage"><svg id="rf-refraction" viewBox="0 0 820 450" role="img" aria-label="Innkommende, reflektert og brutt lys mellom to valgte medier"></svg><label class="rf-medium rf-medium-top"><span class="sr-only">Medium øverst</span><select id="rf-medium-top" aria-label="Medium øverst">${options('air')}</select></label><label class="rf-medium rf-medium-bottom"><span class="sr-only">Medium nederst</span><select id="rf-medium-bottom" aria-label="Medium nederst">${options('water')}</select></label></div></div>
<aside class="model-panel" aria-label="Lys og innfallsvinkel"><div class="controls"><label class="control" for="rf-angle"><span class="rf-control-head"><span>Innfallsvinkel</span><output id="rf-angle-value" for="rf-angle">45°</output></span><input id="rf-angle" type="range" min="10" max="80" step="0.1" value="45"></label><label class="control" for="rf-wavelength"><span class="rf-control-head"><span>Bølgelengde</span><output id="rf-wavelength-value" for="rf-wavelength">550 nm</output></span><input id="rf-wavelength" type="range" min="380" max="780" step="1" value="550"><span class="rf-spectrum-track" aria-hidden="true"></span></label><label class="control rf-white-label" for="rf-white"><input type="checkbox" id="rf-white">Hvitt lys</label></div>
<div class="rf-power" aria-live="polite"><div class="rf-power-line"><span>Reflektert lys</span><strong id="rf-reflected-value"></strong></div><div class="rf-power-bar" aria-hidden="true"><span class="rf-reflected-bar" id="rf-reflected-bar"></span><span class="rf-transmitted-bar" id="rf-transmitted-bar"></span></div><div class="rf-power-line"><span>Lys som går videre</span><strong id="rf-transmitted-value"></strong></div></div><div class="rf-angle-values" id="rf-angle-values" aria-live="polite"></div><p class="rf-status" id="rf-status"></p>
<details class="rf-sources"><summary>Om lysstyrke og fargespredning</summary><p>Prosentene viser fordelingen av lyseffekten ved en glatt grenseflate uten absorpsjon. De er beregnet for upolarisert lys. Skjermens lysstyrke er tilpasset så også svake stråler kan sees.</p><p>Hovedfiguren viser de beregnede retningene. I hvitt lys kan en merket forstørrelse gjøre den lille forskjellen mellom fargene synlig.</p><a href="https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_all.html" target="_blank" rel="noopener">Prøv også PhET: Brytning av lys ↗</a></details></aside></div>`;
export const refractionSection={title:'Brytning og refleksjon',body:refractionSectionHtml};

const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,k)=>[a[0]*k,a[1]*k];
const p=point=>point.map(x=>x.toFixed(2)).join(',');
const line=(a,b,attrs='')=>`<path d="M${p(a)}L${p(b)}" fill="none" ${attrs}/>`;
const txt=(x,y,value,attrs='')=>`<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" ${attrs}>${value}</text>`;
const origin=[410,225];
function edgePoint(direction){
 const dx=direction[0],dy=direction[1],limits=[];
 if(dx>1e-9)limits.push((799-origin[0])/dx);if(dx< -1e-9)limits.push((21-origin[0])/dx);
 if(dy>1e-9)limits.push((428-origin[1])/dy);if(dy< -1e-9)limits.push((42-origin[1])/dy);
 return add(origin,mul(direction,Math.min(...limits)));
}
function beam(a,b,color,power,width=5,white=false){
 if(power<=1e-8)return '';
 const alpha=Math.sqrt(clamp(power)),dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),d=[dx/length,dy/length],end=add(a,mul(d,length*.72)),back=add(end,mul(d,-9)),normal=[-d[1],d[0]];
 return `${white?line(a,b,`stroke="#9da9a8" stroke-opacity="${alpha*.6}" stroke-width="${width+2.5}"`):''}${line(a,b,`stroke="${color}" stroke-opacity="${alpha}" stroke-width="${width}" stroke-linecap="round"`)}<path d="M${p(add(back,mul(normal,4)))}L${p(end)}L${p(add(back,mul(normal,-4)))}" fill="none" stroke="${white?'#718687':color}" stroke-opacity="${alpha}" stroke-width="1.8" stroke-linecap="round"/>`;
}
function magnifiedSpectrum(state){
 const rays=state.transmitted,range=state.maxAngle-state.minAngle;if(!state.white||state.equalMedia||rays.length<2||range<.001)return '';
 const factor=[1,2,5,10,20,50,100].filter(x=>x*range/2<=14).at(-1)||1,mean=(state.maxAngle+state.minAngle)/2,start=[48,332],length=173;
 let out=`<rect x="29" y="271" width="229" height="113" rx="8" fill="var(--surface,#fff)" fill-opacity=".94" stroke="var(--line,#d0ded8)" class="rf-inset"/>${txt(42,291,`Fargespredning × ${factor}`,'class="rf-small" font-weight="650"')}`;
 for(const ray of rays){const angle=(ray.transmittedAngle-mean)*factor*DEG,end=add(start,[length*Math.cos(angle),length*Math.sin(angle)]);out+=line(start,end,`stroke="${ray.color}" stroke-width="2.4" stroke-opacity="${Math.sqrt(ray.T)}"`);}
 out+=txt(42,373,'Kun vinkelforskjellen er forstørret.','class="rf-tiny"');
 return out;
}

export function refractionDiagram(state){
 const a=state.angleDegrees*DEG,incidentDirection=[-Math.sin(a),-Math.cos(a)],reflectedDirection=[Math.sin(a),-Math.cos(a)],incoming=edgePoint(incidentDirection),reflected=edgePoint(reflectedDirection);
 const backgrounds={air:'#edf3f4',water:'#cfe4ec',glass:'#d5e4dc'},color=state.white?'#fffceb':wavelengthColor(state.wavelengthNm);
 let out=`<title>Lys mellom ${mediumNames[state.upper].toLowerCase()} og ${mediumNames[state.lower].toLowerCase()}</title><desc>Innfallsvinkelen er ${fmt(state.angleDegrees)} grader. ${fmt(state.R*100)} prosent reflekteres, og ${fmt(state.T*100)} prosent går videre. ${state.totalReflection?'Alt lys blir reflektert.':''}</desc><rect width="820" height="225" fill="${backgrounds[state.upper]}" class="rf-medium-${state.upper}"/><rect y="225" width="820" height="225" fill="${backgrounds[state.lower]}" class="rf-medium-${state.lower}"/>`;
 out+=line([0,225],[820,225],'stroke="#8aa6aa" stroke-width="1.7"')+line([410,43],[410,428],'stroke="#94a8aa" stroke-width="1.2" stroke-dasharray="5 6"')+txt(410,24,'Innfallslodd','text-anchor="middle" class="rf-small"');
 out+=beam(incoming,origin,color,1,6,state.white);
 out+=beam(origin,reflected,color,state.R,5,state.white);
 if(state.white&&!state.equalMedia){
  out+='<g style="isolation:isolate">';
  for(const ray of state.transmitted){const t=ray.transmittedAngle*DEG,end=edgePoint([Math.sin(t),Math.cos(t)]);out+=line(origin,end,`stroke="${ray.color}" stroke-width="3.2" stroke-opacity="${Math.sqrt(ray.T)}" style="mix-blend-mode:screen"`);}
  out+='</g>';
 }else if(state.transmitted.length){const t=state.transmitted[0].transmittedAngle*DEG;out+=beam(origin,edgePoint([Math.sin(t),Math.cos(t)]),color,state.T,5,state.white);}
 const incomingLabel=add(mul(add(incoming,origin),.5),[-Math.cos(a)*24,Math.sin(a)*24]);
 out+=txt(incomingLabel[0],incomingLabel[1],'Innkommende','text-anchor="end" class="rf-small"');
 if(state.R>1e-8){const reflectedLabel=add(mul(add(reflected,origin),.5),[Math.cos(a)*24,Math.sin(a)*24]);out+=txt(reflectedLabel[0],reflectedLabel[1],`Reflektert · ${fmt(state.R*100)} %`,'class="rf-small"');}
 if(state.transmitted.length){const t=((state.minAngle+state.maxAngle)/2)*DEG,end=edgePoint([Math.sin(t),Math.cos(t)]),label=add(mul(add(end,origin),.5),[Math.cos(t)*25,-Math.sin(t)*25]);out+=txt(label[0],label[1],`Brutt · ${fmt(state.T*100)} %`,'class="rf-small"');}
 if(state.angleDegrees>=20){const radius=53,arcStart=[410,225-radius],arcEnd=add(origin,mul(incidentDirection,radius)),label=add(origin,[-82*Math.sin(a/2),-82*Math.cos(a/2)]);out+=`<path d="M${p(arcStart)}A${radius} ${radius} 0 0 0 ${p(arcEnd)}" fill="none" stroke="#a48d5c" stroke-width="1.4"/>`+txt(label[0],label[1],`${fmt(state.angleDegrees)}°`,'text-anchor="middle" class="rf-small"');}
 if(!state.white&&state.transmitted.length&&state.minAngle>=20&&!state.equalMedia){const t=state.minAngle*DEG,radius=58,start=[410,225+radius],end=add(origin,[radius*Math.sin(t),radius*Math.cos(t)]),label=add(origin,[86*Math.sin(t/2),86*Math.cos(t/2)]);out+=`<path d="M${p(start)}A${radius} ${radius} 0 0 0 ${p(end)}" fill="none" stroke="#6d9d92" stroke-width="1.4"/>`+txt(label[0],label[1],`${fmt(state.minAngle)}°`,'text-anchor="middle" class="rf-small"');}
 out+=magnifiedSpectrum(state);
 return out;
}

export function mountRefraction(root,api){
 const q=id=>root.querySelector('#'+id),svg=q('rf-refraction');if(!svg)return ()=>{};
 const upper=q('rf-medium-top'),lower=q('rf-medium-bottom'),angle=q('rf-angle'),wavelength=q('rf-wavelength'),white=q('rf-white');
 function render(){
  const state=refractionLabState({upper:upper.value,lower:lower.value,angleDegrees:+angle.value,wavelengthNm:+wavelength.value,white:white.checked});
  svg.innerHTML=refractionDiagram(state);svg.setAttribute('data-reflection',String(state.R));svg.setAttribute('data-transmission',String(state.T));svg.setAttribute('data-state',state.equalMedia?'equal':state.totalReflection?'total':state.partialReflection?'partial':'split');
  q('rf-angle-value').textContent=fmt(state.angleDegrees)+'°';q('rf-wavelength-value').textContent=state.white?'Alle farger':fmt(state.wavelengthNm,0)+' nm';wavelength.disabled=state.white;
  q('rf-lab').style.setProperty('--rf-color',wavelengthColor(state.wavelengthNm));
  q('rf-reflected-value').textContent=fmt(state.R*100)+' %';q('rf-transmitted-value').textContent=fmt(state.T*100)+' %';q('rf-reflected-bar').style.width=state.R*100+'%';q('rf-transmitted-bar').style.width=state.T*100+'%';
  q('rf-angle-values').innerHTML=state.equalMedia?'':`<div>Refleksjonsvinkel: <strong>${fmt(state.angleDegrees)}°</strong></div>`+(state.transmitted.length?state.white&&!state.equalMedia?`<div>Brytningsvinkler: <strong>${fmt(state.minAngle,2)}°–${fmt(state.maxAngle,2)}°</strong></div>`:`<div>Brytningsvinkel: <strong>${fmt(state.minAngle)}°</strong></div>`:'');
  q('rf-status').textContent=state.equalMedia?'Samme medium på begge sider: lyset fortsetter rett frem. Ingenting reflekteres.':state.totalReflection?'Totalrefleksjon: alt lyset reflekteres. Ingen stråle går videre gjennom flaten.':state.partialReflection?'Noen farger totalreflekteres. De andre fargene går videre gjennom flaten.':'Noe lys reflekteres. Resten går videre og brytes. '+(state.white?'Frekvensene bevares.':'Frekvensen endres ikke.');
 }
 const controls=[upper,lower,angle,wavelength,white];for(const control of controls){control.addEventListener('input',render);control.addEventListener('change',render);}render();
 return ()=>{for(const control of controls){control.removeEventListener('input',render);control.removeEventListener('change',render);}};
}
