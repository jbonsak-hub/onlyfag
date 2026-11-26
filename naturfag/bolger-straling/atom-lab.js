import {elementSpectraHtml,mountElementSpectra} from './element-spectra.js?v=20261116-layout2';

const C=299792458,HC_AJ_NM=198.64458571489286;
export const HYDROGEN_GROUND_AJ=-2.17896022224;
export const HYDROGEN_LEVELS_AJ=Object.freeze(Array.from({length:6},(_,i)=>HYDROGEN_GROUND_AJ/(i+1)**2));
export const LEVEL_MAX_AJ=2.6,MIN_LEVEL_GAP_AJ=.06;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));



export function hydrogenEnergy(n){if(!Number.isInteger(n)||n<1)throw new RangeError('n must be a positive integer');return HYDROGEN_GROUND_AJ/n**2;}
export const hydrogenEnergyAJ=hydrogenEnergy;
export function photonFromEnergyAJ(energyAJ){
 const e=Math.abs(Number(energyAJ)),wavelengthNM=e>0?HC_AJ_NM/e:Infinity;
 const region=!e?'Ingen stråling':wavelengthNM<380?'UV':wavelengthNM<=780?'Synlig':'IR';
 return {energyAJ:e,energyJ:e*1e-18,wavelengthNM,frequencyHz:e?C/(wavelengthNM*1e-9):0,region,color:photonColor(wavelengthNM)};
}
export function transition(from,to){const signedAJ=hydrogenEnergy(to)-hydrogenEnergy(from);return {from,to,type:signedAJ===0?'none':signedAJ>0?'absorption':'emission',signedAJ,...photonFromEnergyAJ(signedAJ)};}
export function possibleTransitions(maxLevel){if(!Number.isInteger(maxLevel)||maxLevel<1||maxLevel>6)throw new RangeError('Shown levels are 1–6');const all=[];for(let upper=2;upper<=maxLevel;upper++)for(let lower=1;lower<upper;lower++)all.push(transition(upper,lower));return all.sort((a,b)=>a.wavelengthNM-b.wavelengthNM);}
export function cascadeLevels(level,strategy='stepwise',random=Math.random){if(!Number.isInteger(level)||level<2||level>6)return [1];if(strategy==='direct')return [level,1];const out=[level];while(out.at(-1)>1){const n=out.at(-1);out.push(strategy==='random'?1+Math.floor(clamp(random(),0,.999999)*(n-1)):n-1);}return out;}
export function excitationForEnergy(energyAJ,tolerance=.004){const e=Number(energyAJ);if(!Number.isFinite(e)||e<=0)return{kind:'invalid',level:1,energyAJ:e};if(e>=-HYDROGEN_GROUND_AJ)return{kind:'ionization',level:null,energyAJ:e,excessAJ:e+HYDROGEN_GROUND_AJ};let best={level:2,energyAJ:transition(1,2).energyAJ};for(let n=3;n<=6;n++){const tr=transition(1,n);if(Math.abs(tr.energyAJ-e)<Math.abs(best.energyAJ-e))best={level:n,energyAJ:tr.energyAJ};}return Math.abs(best.energyAJ-e)<=tolerance?{kind:'excitation',...best}:{kind:'no-match',level:1,energyAJ:e};}
export function moveCustomLevel(levels,index,newEnergy,gap=MIN_LEVEL_GAP_AJ,max=LEVEL_MAX_AJ){const copy=levels.map(Number);if(index<=0||index>=copy.length)return copy;const lower=copy[index-1]+gap,upper=index+1<copy.length?copy[index+1]-gap:max;copy[index]=clamp(Number(newEnergy),lower,upper);copy[0]=0;return copy;}
export function customTransitions(levels,target=levels.length-1){const all=[];for(let upper=1;upper<=target;upper++)for(let lower=0;lower<upper;lower++)all.push({from:upper,to:lower,type:'emission',...photonFromEnergyAJ(levels[upper]-levels[lower])});return all.sort((a,b)=>a.wavelengthNM-b.wavelengthNM);}
export function customCascadePaths(target){if(target<=0)return [[0]];const result=[];function walk(path,n){if(n===0){result.push(path);return;}for(let next=0;next<n;next++)walk([...path,next],next);}walk([target],target);return result;}
export const CUSTOM_LEVEL_PRESETS=Object.freeze({
 hydrogen:{label:'Hydrogen · nivå 1–4',levels:HYDROGEN_LEVELS_AJ.slice(0,4).map(e=>e-HYDROGEN_GROUND_AJ)},
 modelA:{label:'Modellatom A',levels:[0,.42,.95,1.55,2.1]},
 modelB:{label:'Modellatom B',levels:[0,.68,1.06,1.28,2.2]}
});
function photonColor(nm){if(!Number.isFinite(nm))return '#82969b';if(nm<380)return '#8767c6';if(nm>780)return '#b76e3c';if(nm<450)return '#9168e0';if(nm<490)return '#258dde';if(nm<520)return '#159fa8';if(nm<580)return '#6baf42';if(nm<630)return '#d4a024';return '#d95a4b';}

const hLevels = [1, 2, 3, 4, 5, 6];
const visibleLines = possibleTransitions(6).filter(photon => photon.region === 'Synlig');
const transitionKey = t => `${t.from}-${t.to}`;
const fmt = (value, digits=3) => Number(value).toLocaleString('nb-NO', {maximumFractionDigits:digits});
const formatNM = t => fmt(t.wavelengthNM, 0);
const line = (x1,y1,x2,y2,stroke,attr='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" ${attr}/>`;
const text = (x,y,value,attr='') => `<text x="${x}" y="${y}" ${attr}>${value}</text>`;
const ease = value => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

const styles = `<style>
.al-model[data-model-layout=custom] { display:grid!important; grid-template-columns:minmax(0,1fr) minmax(160px,196px); gap:14px 20px; align-items:center; max-width:none!important; padding:16px!important }
.al-model[data-model-layout=custom] .al-main { min-width:0 }
.al-model[data-model-layout=custom] .al-side { display:grid; gap:11px; border-left:1px solid var(--line,#cddbd1); padding-left:16px; min-width:0 }
.al-model[data-model-layout=custom] .al-side p { margin:0 }
#al-hydrogen-model .al-h-side { align-self:stretch; grid-template-rows:1fr auto 1fr; border:0; padding:0 }
.al-h-spectrum-intro { align-self:start; padding-top:12px; font-size:.86rem; line-height:1.5 }
.al-h-data { display:grid; gap:11px; padding-left:12px; border-left:1px solid var(--line,#cddbd1) }
.al-h-spectrum-guide { align-self:center; display:flex; align-items:center; gap:7px; color:var(--green,#236448); font-size:.86rem; font-weight:700; line-height:1.35 }
.al-h-spectrum-guide span { flex:none; font-size:1.4rem; line-height:1 }
@media(max-width:900px) {
  #al-hydrogen-model .al-h-side { grid-template-rows:auto auto }
  .al-h-spectrum-intro { padding:0 }
  .al-h-data { border:0; padding:0 }
  .al-h-spectrum-guide { grid-area:1/1/2/-1 }
  .al-h-spectrum-guide span { transform:rotate(90deg) }
}
.al-caption { margin:8px 0 19px; font-size:.84rem; color:var(--muted,#51685e) }
.al-board, .al-custom-stage { position:relative; line-height:0; min-width:0 }
.al-model svg.al-figure { display:block; width:100%; height:auto; min-height:0!important; max-height:none!important; border-radius:10px; background:var(--bg,#eef3ed); overflow:hidden }
.al-model svg.al-spectrum { margin-top:8px }
.al-figure text { font-family:inherit; font-size:17px; fill:var(--ink,#20352e) }
.al-figure .al-title { font-weight:700; font-size:19px }
.al-figure .al-small { font-size:15px; fill:var(--muted,#52685f) }
.al-figure .al-spectrum-label { font-size:16px; font-weight:650; fill:#eff8f6 }
.al-figure .al-axis { stroke:var(--muted,#71887c) }
.al-figure .al-grid { stroke:var(--line,#cddbd1) }
.al-figure .al-band { fill:#101f31 }
.al-spectrum-hits { position:absolute; inset:0; pointer-events:none }
.al-spectrum-hits button { pointer-events:auto; position:absolute; top:var(--top); height:var(--height); left:var(--left); width:var(--width); min-height:0; padding:0; border:0; border-radius:5px; background:transparent; cursor:pointer }
.al-spectrum-hits button:hover { background:#bce6ff28 }
.al-spectrum-hits button:focus-visible { outline:3px solid #62dcec; outline-offset:-3px }
.al-readout { display:grid; gap:4px; padding:12px 13px; border-radius:8px; line-height:1.45; background:var(--green-soft,#e3efe7); font-size:.85rem }
.al-readout strong { color:var(--ink,#20352e) }
.al-readout output { font-weight:700 }
.al-energy-toggle { display:flex; align-items:center; gap:6px; font-size:.82rem }
.al-energy-toggle input { accent-color:var(--green,#236448); width:auto }
.al-energy-example { display:inline; padding:0!important; border:0!important; background:none!important; color:var(--green,#236448)!important; font:inherit; font-weight:700; text-decoration:underline; text-underline-offset:3px; cursor:pointer }
.al-secondary { padding:7px 10px!important; color:var(--ink,#20352e)!important; background:var(--surface,#fff)!important; border:1px solid var(--line,#cddbd1)!important; font:inherit }
.al-secondary[aria-pressed=true] { background:var(--green,#236448)!important; color:#fff!important; border-color:transparent!important }
.al-calculation-dialog { width:min(610px,94vw); max-height:88vh; margin:auto; padding:18px 21px; border:1px solid var(--line,#dce5de); border-radius:12px; box-sizing:border-box; background:var(--surface,#fff); color:var(--ink,#20352e); overflow:auto; box-shadow:0 20px 70px #0005 }
.al-calculation-dialog::backdrop { background:#13262099; backdrop-filter:blur(3px) }
.al-calculation-header { display:flex; align-items:center; justify-content:space-between; gap:12px }
.al-calculation-header h3 { margin:0; font-size:17px }
.al-calculation-header button { flex:none; font-size:12px }
.al-calculation-dialog p { font-size:13px; line-height:1.6 }
.al-calculation-columns { display:grid; grid-template-columns:1fr 1.2fr; gap:18px; margin:14px 0 }
.al-calculation-columns h4 { font-size:13px; margin:0 0 9px }
.al-calculation-columns .calc-lines { font-size:12px; margin:0; gap:7px }
.al-calculation-columns .calc-row { grid-template-columns:32px 12px minmax(0,1fr); column-gap:4px }
.al-targets { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:5px }
.al-targets button { min-width:0; padding:7px 2px!important; cursor:pointer }
.al-custom-status { font-size:.78rem; color:var(--muted,#51685e) }
.al-model .al-level-handle { position:absolute; left:77%; transform:translate(-50%,-50%); width:22px; height:22px; min-width:22px; min-height:0; padding:0!important; border-radius:50%; border:2px solid #f2f8f4; box-shadow:0 0 0 1px #275f5b; background:#3a8881; touch-action:none; cursor:ns-resize; line-height:1; font-size:15px; font-weight:700; z-index:2 }
.al-model .al-level-handle[data-target=true] { background:#a1651d; box-shadow:0 0 0 1px #a1651d }
.al-model .al-level-handle::after { content:'↕'; color:white; position:absolute; inset:0; display:grid; place-items:center }
.al-model .al-level-handle:focus-visible { outline:3px solid #2677a0; outline-offset:3px }
.al-board .animation-toolbar { right:6px; top:5px }
@media(max-width:900px) {
  .al-model[data-model-layout=custom] { grid-template-columns:minmax(0,1fr)!important }
  .al-model[data-model-layout=custom] .al-side { grid-template-columns:repeat(2,minmax(0,1fr)); align-items:start; border-left:0; padding-left:0 }
}
@media(max-width:520px) {
  .al-model[data-model-layout=custom] { padding:9px!important }
  .al-model[data-model-layout=custom] .al-side { grid-template-columns:1fr }
  .al-model .al-level-handle { width:18px; height:18px; min-width:18px; font-size:12px }
  .al-calculation-columns { grid-template-columns:1fr }
}
</style>`;

export const atomLabSection = {title:'Hydrogenatomet', body:`${styles}
<p>I <strong>Bohrs atommodell</strong> tilsvarer hvert elektronskall et bestemt energinivå. I grunntilstanden er hydrogenets ene elektron i det innerste skallet (n = 1). Når atomet tar opp energi, kan elektronet gå til et høyere nivå. De vannrette strekene i energidiagrammet viser de samme nivåene, med høyere energi oppover.</p>
<div class="model al-model" data-model-layout="custom" id="al-hydrogen-model">
  <div class="al-main">
    <div class="al-board" id="al-h-stage">
      <svg id="al-hydrogen-svg" class="al-figure" viewBox="0 0 760 372" role="img" aria-label="Hydrogenatom, energinivådiagram og synlig emisjonsspekter"></svg>
      <div class="al-spectrum-hits" id="al-h-spectrum-controls" role="group" aria-label="Velg spektrallinje" aria-describedby="al-h-spectrum-guide"></div>
    </div>
  </div>
  <div class="al-side al-h-side">
    <p class="al-h-spectrum-intro">Når elektronet går ned fra nivå 3, 4, 5 eller 6 til nivå 2, sender atomet ut synlig lys. Det gir de fire tydeligste linjene i hydrogenets synlige emisjonsspekter.</p>
    <div class="al-h-data">
      <div id="al-h-readout" class="al-readout" aria-live="polite"></div>
      <label class="al-energy-toggle" for="al-h-show-energy"><input type="checkbox" id="al-h-show-energy">Vis energi i aJ</label>
    </div>
    <p class="al-h-spectrum-guide" id="al-h-spectrum-guide"><span aria-hidden="true">←</span> Velg en spektrallinje for å se overgangen.</p>
  </div>
</div>
<p class="al-caption">Avstanden mellom energinivåene er skjematisk i figuren.</p>
<dialog id="al-h-calculation-dialog" class="al-calculation-dialog" aria-labelledby="al-h-calculation-title">
  <header class="al-calculation-header"><h3 id="al-h-calculation-title">Regn ut energien og bølgelengden</h3><button type="button" id="al-h-calculation-close">Lukk</button></header>
  <div id="al-h-calculation-body"></div>
</dialog>`};

export const customAtomSection = {title:'Lag et atom', body:`
<div class="model al-model" data-model-layout="custom" id="al-custom-model">
  <div class="al-main">
    <div class="al-custom-stage" id="al-c-stage">
      <svg id="al-custom-svg" class="al-figure" viewBox="0 0 760 300" role="img" aria-label="Modellatom med energinivåer som kan flyttes"></svg>
      <div id="al-custom-handles"></div>
    </div>
    <svg id="al-custom-spectrum" class="al-figure al-spectrum" viewBox="0 0 760 130" role="img" aria-label="Emisjonsspekter der linjene flytter seg når energinivåene endres"></svg>
  </div>
  <div class="al-side">
    <p id="al-target-label"><strong>Eksiter atomet til</strong></p>
    <div class="al-targets" id="al-custom-targets" role="group" aria-labelledby="al-target-label">
      ${[2,3,4,5].map(level=>`<button type="button" class="al-secondary" data-excite-level="${level}" aria-pressed="false">L${level}</button>`).join('')}
    </div>
    <div id="al-custom-lines" class="al-readout" aria-live="polite"></div>
    <p id="al-custom-state" class="al-custom-status">Velg et nivå for å starte fotonstrømmen.</p>
  </div>
</div>
<p class="al-caption">Dra energinivåene opp eller ned og se hvilke spektrallinjer som flytter seg. Modellen viser lys fra mange like atomer. Ett elektron kan ta én vei ned, mens de mange atomene til sammen gir alle linjene.</p>
${elementSpectraHtml}`};


function wavelengthInk(nm) {
  if (nm < 380) return '#ce9cff';
  if (nm < 420) return '#c198ff';
  if (nm < 445) return '#9299ff';
  if (nm < 478) return '#679cff';
  if (nm < 510) return '#50d3ee';
  if (nm < 565) return '#79e88c';
  if (nm < 597) return '#f5df67';
  if (nm < 627) return '#ffad64';
  if (nm <= 780) return '#ff786f';
  return '#ffc184';
}
function arrow(x1,y1,x2,y2,color,width=2.5,extra='') {
  const phi = Math.atan2(y2-y1,x2-x1);
  const left = [x2-6*Math.cos(phi-.5), y2-6*Math.sin(phi-.5)];
  const right = [x2-6*Math.cos(phi+.5), y2-6*Math.sin(phi+.5)];
  return `<path d="M${x1} ${y1}L${x2} ${y2}M${left.join(' ')}L${x2} ${y2}L${right.join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}
function wavePacket(x,y,angle,phase,color,length=36) {
  const points = Array.from({length:31}, (_,i) => {
    const u = i/30, dy = 5.5*Math.sin(Math.PI*u)*Math.sin(6*Math.PI*u + phase);
    return `${i?'L':'M'}${((u-.5)*length).toFixed(2)} ${dy.toFixed(2)}`;
  }).join('');
  return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle*180/Math.PI})">
    <path d="${points}" fill="none" stroke="${color}" stroke-width="8" opacity=".2"/>
    <path d="${points}" fill="none" stroke="#425364" stroke-width="4.4" opacity=".55"/>
    <path d="${points}" fill="none" stroke="${color}" stroke-width="2.9" stroke-linecap="round"/>
  </g>`;
}
function orbitPoint(atom,n,angle) {
  const r = atom.inner + (n-1)*atom.step;
  return [atom.x+r*Math.cos(angle),atom.y+r*Math.sin(angle)];
}
function atomFace(atom,levels,transition,progress,angle) {
  const rings = levels.map(n => {
    const active = n === transition?.from || n === transition?.to;
    const r = atom.inner + (n-1)*atom.step;
    return `<circle cx="${atom.x}" cy="${atom.y}" r="${r}" fill="none" stroke="${active?'#318a80':'var(--muted,#71887c)'}" stroke-width="${active?2.4:1.2}" opacity="${active?1:.35}"/>`;
  }).join('');
  const [a,b] = transition ? [orbitPoint(atom,transition.from,angle),orbitPoint(atom,transition.to,angle)] : [orbitPoint(atom,1,angle),orbitPoint(atom,1,angle)];
  const x = a[0] + (b[0]-a[0])*progress, y = a[1] + (b[1]-a[1])*progress;
  const core = `<circle cx="${atom.x}" cy="${atom.y}" r="13" fill="#a95245"/>
    ${text(atom.x,atom.y+6,'+','text-anchor="middle" style="fill:white;font-weight:700;font-size:18px"')}`;
  const electron = `<circle cx="${x}" cy="${y}" r="7.5" fill="#237897" stroke="#f4fffa" stroke-width="2"/>`;
  return {base:rings+core,electron};
}

const hydrogenLayout = narrow => ({
  w:narrow?440:760, h:372,
  atom:{x:narrow?105:178,y:150,inner:narrow?20:30,step:narrow?12:15},
  graph:{left:narrow?221:394,right:narrow?294:596,levels:[0,246,208,169,130,91,52]},
  spectrum:{left:22,right:narrow?418:738,top:300,bottom:350}
});
const visibleX = (layout,nm) => layout.spectrum.left + (layout.spectrum.right-layout.spectrum.left)*(nm-380)/400;
function visibleSpectrum(layout,t,arrived) {
  const band = layout.spectrum;
  const lines = visibleLines.map(item => {
    const x=visibleX(layout,item.wavelengthNM), selected=transitionKey(t)===transitionKey(item), color=wavelengthInk(item.wavelengthNM);
    const labelY=band.bottom-8-(layout.w<500&&item.from===5?18:0);
    const glow=selected?line(x,band.top+3,x,band.bottom-4,color,`stroke-width="${arrived?19:13}" opacity="${arrived?.42:.25}"`):'';
    return `${glow}${line(x,band.top+3,x,band.bottom-4,color,`stroke-width="${selected?5:3}" stroke-linecap="round"`)}
      ${text(x,labelY,formatNM(item),'class="al-spectrum-label" text-anchor="middle" style="paint-order:stroke;stroke:#101f31;stroke-width:4"')}`;
  }).join('');
  return `${text(band.left,band.top-12,'Synlig emisjonsspekter','class="al-title"')}
    ${text(band.right,band.top-12,'Bølgelengde i nm','class="al-small" text-anchor="end"')}
    <rect x="${band.left}" y="${band.top}" width="${band.right-band.left}" height="${band.bottom-band.top}" rx="8" class="al-band"/>
    ${lines}`;
}
function routedPhoton(layout,t,progress) {
  const end = [visibleX(layout,t.wavelengthNM),layout.spectrum.top+16];
  const start = orbitPoint(layout.atom,t.to,.71), v = ease((progress-.25)/.65);
  const dx=end[0]-start[0],dy=end[1]-start[1];
  const x = start[0] + dx*v;
  const y = start[1] + dy*(v+.34*Math.sin(Math.PI*v));
  const angle = Math.atan2(dy*(1+.34*Math.PI*Math.cos(Math.PI*v)),dx);
  return wavePacket(x,y,angle,progress*27,wavelengthInk(t.wavelengthNM));
}
function hydrogenGraphic(layout,t,p,showEnergy) {
  const {w,atom,graph} = layout, narrow = w < 500;
  const motion = p===null ? 0 : ease(p/.25);
  const face = atomFace(atom,hLevels,t,motion,.71);
  const levels = hLevels.map(n => {
    const active = n===t.from || n===t.to;
    const label = `n = ${n}${showEnergy?` · ${fmt(hydrogenEnergy(n),3)} aJ`:''}`;
    return line(graph.left,graph.levels[n],graph.right,graph.levels[n],active?'#318a80':'var(--line,#a6b8ae)',`stroke-width="${active?3.1:1.7}"`)
      + text(graph.right+8,graph.levels[n]+5,label,'class="al-small"');
  }).join('');
  const xArrow=graph.left+(graph.right-graph.left)*.50;
  const yDot=graph.levels[t.from]+(graph.levels[t.to]-graph.levels[t.from])*motion;
  return `${text(24,28,'Hydrogenatom','class="al-title"')}${text(graph.left,28,'Energinivåer','class="al-title"')}
    ${line(narrow?205:356,47,narrow?205:356,259,'var(--line,#cddbd1)')}
    ${face.base}${face.electron}${levels}
    ${arrow(xArrow,graph.levels[t.from]+3,xArrow,graph.levels[t.to]-4,t.color,3)}
    <circle cx="${graph.left+13}" cy="${yDot}" r="6.6" fill="#237897" stroke="#f4fffa" stroke-width="1.7"/>
    ${visibleSpectrum(layout,t,p!==null&&p>=.89)}
    ${p!==null&&p>.25&&p<.9?routedPhoton(layout,t,p):''}`;
}

export const atomDrawing = {
  hLevels, hydrogenEnergy, atomFace, orbitPoint, arrow, wavePacket,
  wavelengthInk, fmt, line, text, ease, transitionKey
};

function spectrumGraphic(s,all,{max=3600, selected=null, activity=null, colorFor=t=>wavelengthInk(t.wavelengthNM), labelFor=t=>`n = ${t.from} → ${t.to}`}={}) {
  const min=70, left=24, right=s-24, bandTop=33, bandBase=94;
  const x=nm=>left+(right-left)*Math.log(clamp(nm,min,max)/min)/Math.log(max/min);
  const bands=[[min,380,'#221f41','UV'],[380,780,'#123644','Synlig lys'],[780,max,'#392a32','Infrarødt']];
  const regions=bands.map(([lo,hi,fill,label])=>`<rect x="${x(lo)}" width="${x(hi)-x(lo)}" y="${bandTop}" height="${bandBase-bandTop}" fill="${fill}"/>
    ${text((x(lo)+x(hi))/2,22,label,'style="font-size:17px;font-weight:700" text-anchor="middle"')}`).join('');
  const lines=all.map(t=>{
    const xx=x(t.wavelengthNM), color=colorFor(t), key=transitionKey(t);
    const brightness=activity?.get(key) ?? 0;
    const picked=selected && key===transitionKey(selected);
    const glow=picked||brightness>0;
    return `<g><title>${labelFor(t)} · ${fmt(t.wavelengthNM,1)} nm</title>
      ${glow?line(xx,bandTop+5,xx,bandBase-5,color,`stroke-width="${9+brightness*6}" opacity="${.27+brightness*.2}"`):''}
      ${line(xx,bandTop+4,xx,bandBase-4,color,`stroke-linecap="round" stroke-width="${picked?4.8:2.8+brightness*2}" opacity="${glow?1:.78}"`)}
      </g>`;
  }).join('');
  const ticks=[100,380,780,3000,...(max>5000?[8000]:[])].map(nm=>line(x(nm),96,x(nm),101,'var(--muted,#71887c)')
    +text(x(nm),118,`${fmt(nm,0)} nm`,`class="al-small" text-anchor="${nm===8000?'end':'middle'}"`)).join('');
  return `${regions}${lines}${ticks}`;
}


const customHeight=300, customTop=53, customBase=262;
const customY=e=>customBase-(customBase-customTop)*e/LEVEL_MAX_AJ;
function customHandleYs(levels) {
  const result=[];
  let next=customTop;
  for(let n=levels.length-1;n>=1;n--) {
    result[n]=Math.max(next,customY(levels[n]));
    next=result[n]+24;
  }
  const over=Math.max(0,result[1]-(customBase-27));
  return result.map(y=>y-over);
}
function customGraphic(width,levels,target,all,elapsed,running) {
  const narrow=width<700, graphLeft=narrow?237:380, graphRight=width*.761;
  const atom={x:narrow?85:143,y:152,inner:narrow?25:30,step:narrow?13:15};
  const current=running?all[Math.floor(elapsed/.53)%all.length]:null;
  const progress=ease((elapsed%.53)/.24);
  const illustrated=current?{from:current.from+1,to:current.to+1}:null;
  const face=atomFace(atom,hLevels.slice(0,levels.length),illustrated,progress,.56);
  const positions=customHandleYs(levels);
  const rows=levels.map((energy,n)=>{
    const y=customY(energy), labelY=n===0?y:positions[n], selected=n===target;
    return line(graphLeft,y,graphRight,y,selected?'#3c9185':'var(--muted,#71887c)',`stroke-width="${selected?3:1.4}" opacity="${selected?1:.72}"`)
      + (n===0?'':line(graphRight,y,width*.77,labelY,'var(--muted,#71887c)','opacity=".6"'))
      + text(width*.80,labelY+5,`L${n+1} · ${fmt(energy,2)} aJ`,'class="al-small"');
  }).join('');
  const emitted=running?all.map((t,index)=>{
    const u=((elapsed*(1.58+(index%3)*.075)+index*.173)%1);
    const x=(narrow?147:211)+(narrow?63:122)*u;
    const y=110+(all.length===1?56:index*109/(all.length-1));
    return wavePacket(x,y,-.12,elapsed*17+index,wavelengthInk(t.wavelengthNM),25);
  }).join(''):'';
  const activeArrow=current?arrow(graphLeft+23,customY(levels[current.from])+2,graphLeft+23,customY(levels[current.to])-3,current.color,2.7):'';
  return `${text(23,29,'Modellatom','class="al-title"')}${text(graphLeft,29,'Energinivåer','class="al-title"')}
    ${face.base}${emitted}${face.electron}${rows}${activeArrow}
    ${text(atom.x,283,current?`L${current.from+1} → L${current.to+1}`:'L1 · grunntilstand','class="al-small" text-anchor="middle"')}
    ${text(graphLeft,286,'Energi over L1','class="al-small"')}`;
}

const fraction = (numerator,denominator) => `<span class="frac"><span class="num">${numerator}</span><span class="den">${denominator}</span></span>`;
function power(value,digits=3) {
  const exponent=Math.floor(Math.log10(Math.abs(value)));
  return `${fmt(value/10**exponent,digits)} · 10<sup>${String(exponent).replace('-','−')}</sup>`;
}
const calcRow=(lhs,eq,rhs)=>`<div class="calc-row"><span class="calc-lhs">${lhs}</span><span class="calc-eq">${eq}</span><span class="calc-rhs">${rhs}</span></div>`;
function calculation(t) {
  return `<p>Elektronet går fra <strong>n = ${t.from}</strong> til <strong>n = ${t.to}</strong>. Fotonet får energien som atomet mister. <strong>1 aJ = 10<sup>−18</sup> J.</strong></p>
    <div class="al-calculation-columns">
    <section><h4>1. Finn fotonenergien</h4><div class="calc-lines">${calcRow('ΔE','=','E<sub>øvre</sub> − E<sub>nedre</sub>')}${calcRow('','≈',`(${fmt(hydrogenEnergy(t.from),4)} aJ) − (${fmt(hydrogenEnergy(t.to),4)} aJ)`)}${calcRow('','≈',`<strong>${fmt(t.energyAJ,4)} aJ</strong>`)}${calcRow('','≈',`${power(t.energyJ)} J`)}</div></section>
    <section><h4>2. Finn bølgelengden</h4><div class="calc-lines">${calcRow('λ','=',fraction('h · c','ΔE'))}${calcRow('','≈',fraction('6,626 · 10<sup>−34</sup> J s · 2,998 · 10<sup>8</sup> m/s',`${power(t.energyJ)} J`))}${calcRow('','≈',`${power(t.wavelengthNM*1e-9)} m`)}${calcRow('','≈',`<strong>${fmt(t.wavelengthNM,1)} nm</strong>`)}</div></section>
    </div>
    <p>h er Plancks konstant og c er lysfarten. Større energisprang gir kortere bølgelengde.</p>`;
}

export function mountAtomLab(root,api) {
  const node=id=>root.querySelector('#'+id);
  const hydrogenSvg=node('al-hydrogen-svg');
  if (!hydrogenSvg) return ()=>{};
  const board=node('al-h-stage'), spectrumControls=node('al-h-spectrum-controls');
  const calculationDialog=node('al-h-calculation-dialog'), result=node('al-h-readout');
  const customSvg=node('al-custom-svg'), customSpectrum=node('al-custom-spectrum');
  const customStage=node('al-c-stage'), customHandles=node('al-custom-handles'), targetControls=node('al-custom-targets');
  const dispose=[];
  const listen=(el,event,fn,options)=>{
    el.addEventListener(event,fn,options);
    dispose.push(()=>el.removeEventListener(event,fn,options));
  };
  let selected=transition(3,2), showEnergy=false;
  let start=null, hTime=0, cTime=0, hCache='';
  let layout=hydrogenLayout(false), compact=null;
  let levels=[...CUSTOM_LEVEL_PRESETS.modelA.levels], target=4, streamStart=null, drag=null;
  let transitions=customTransitions(levels,target), cCache='';
  const now=(el,fallback)=>typeof api.now==='function'?api.now(el):fallback;
  const repaint=el=>api.repaint(el);

  function syncHydrogenResult(){
    result.innerHTML=`<strong>Emisjon · n = ${selected.from} → ${selected.to}</strong>
      <div><button type="button" class="al-energy-example" data-al-energy-example aria-haspopup="dialog" aria-controls="al-h-calculation-dialog" aria-expanded="${Boolean(calculationDialog.open)}" aria-label="Vis utregning av energiforskjellen">ΔE</button> = <output>${fmt(selected.energyAJ,4)} aJ</output></div>
      <div>Bølgelengde <output>${fmt(selected.wavelengthNM,1)} nm</output></div>`;
    if(calculationDialog.open) node('al-h-calculation-body').innerHTML=calculation(selected);
    for(const button of spectrumControls.querySelectorAll('button')) {
      button.setAttribute('aria-pressed',String(Number(button.dataset.hLine)===selected.from));
    }
  }
  function syncBoard(){
    const narrow=board.getBoundingClientRect().width<520;
    if(narrow===compact) return;
    compact=narrow;
    layout=hydrogenLayout(compact);
    hydrogenSvg.setAttribute('viewBox',`0 0 ${layout.w} ${layout.h}`);
    customSvg.setAttribute('viewBox',`0 0 ${compact?520:760} ${customHeight}`);
    customSpectrum.setAttribute('viewBox',`0 0 ${compact?520:760} 130`);
    const factor=100/layout.w, {spectrum, h}=layout;
    const oldFocus=spectrumControls.contains(document.activeElement)?document.activeElement.dataset.hLine:null;
    spectrumControls.innerHTML=visibleLines.map((t,i)=>{
      const x=visibleX(layout,t.wavelengthNM);
      const edge=(other,sign)=>other?(x+visibleX(layout,other.wavelengthNM))/2:x+sign*(compact?16:26);
      const left=Math.max(spectrum.left,edge(visibleLines[i-1],-1)), right=Math.min(spectrum.right,Math.min(edge(visibleLines[i+1],1),x+(compact?24:37)));
      const title=`${formatNM(t)} nm, nivå ${t.from} til nivå ${t.to}`;
      return `<button type="button" data-h-line="${t.from}" title="${title}" aria-label="${title}" aria-pressed="${t.from===selected.from}" style="--left:${left*factor}%;--width:${(right-left)*factor}%;--top:${(spectrum.top-3)*100/h}%;--height:${(spectrum.bottom-spectrum.top+7)*100/h}%"></button>`;
    }).join('');
    if(oldFocus!==null) spectrumControls.querySelector(`[data-h-line="${oldFocus}"]`)?.focus({preventScroll:true});
    hCache=''; cCache='';
    repaint(hydrogenSvg);
    repaint(customSvg);
  }
  listen(spectrumControls,'click',event=>{
    const button=event.target.closest('[data-h-line]');
    if(!button) return;
    selected=transition(Number(button.dataset.hLine),2);
    start=now(hydrogenSvg,hTime);
    syncHydrogenResult();
    api.play?.(hydrogenSvg);
    repaint(hydrogenSvg);
  });
  listen(node('al-h-show-energy'),'change',event=>{
    showEnergy=event.target.checked;
    hCache='';
    repaint(hydrogenSvg);
  });
  listen(result,'click',event=>{
    const trigger=event.target.closest('[data-al-energy-example]');
    if(!trigger) return;
    node('al-h-calculation-body').innerHTML=calculation(selected);
    calculationDialog.showModal();
    trigger.setAttribute('aria-expanded','true');
    node('al-h-calculation-close').focus();
  });
  listen(node('al-h-calculation-close'),'click',()=>calculationDialog.close());
  listen(calculationDialog,'close',()=>{
    const trigger=result.querySelector('[data-al-energy-example]');
    trigger?.setAttribute('aria-expanded','false');
    trigger?.focus();
  });
  listen(calculationDialog,'click',event=>{
    if(event.target!==calculationDialog) return;
    const bounds=calculationDialog.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom) calculationDialog.close();
  });

  customHandles.innerHTML=levels.slice(1).map((energy,i)=>`<button type="button" class="al-level-handle" data-custom-index="${i+1}" role="slider" aria-label="Flytt energinivå L${i+2}" aria-orientation="vertical" aria-valuenow="${energy}"></button>`).join('');
  function syncCustom(){
    transitions=customTransitions(levels,target);
    const positions=customHandleYs(levels);
    for(const handle of customHandles.querySelectorAll('[data-custom-index]')){
      const n=Number(handle.dataset.customIndex);
      handle.style.top=positions[n]/customHeight*100+'%';
      handle.setAttribute('aria-valuenow',String(levels[n]));
      handle.setAttribute('aria-valuemin',fmt(levels[n-1]+MIN_LEVEL_GAP_AJ,6).replace(',','.'));
      handle.setAttribute('aria-valuemax',fmt(n+1<levels.length?levels[n+1]-MIN_LEVEL_GAP_AJ:LEVEL_MAX_AJ,6).replace(',','.'));
      handle.setAttribute('aria-valuetext',`${fmt(levels[n],3)} aJ`);
      handle.setAttribute('data-target',String(n===target&&streamStart!==null));
      handle.title=`L${n+1}: ${fmt(levels[n],3)} aJ. Dra eller bruk piltastene.`;
    }
    for(const b of targetControls.querySelectorAll('[data-excite-level]')){
      b.setAttribute('aria-pressed',String(Number(b.dataset.exciteLevel)===target+1&&streamStart!==null));
    }
    node('al-custom-lines').innerHTML=`<strong>${transitions.length} ${transitions.length===1?'mulig overgang':'mulige overganger'}</strong><div>Til og med energinivå L${target+1}</div>`;
    customSpectrum.setAttribute('data-possible-count',String(transitions.length));
    cCache='';
    repaint(customSvg);
  }
  function changeLevel(index,value){
    levels=moveCustomLevel(levels,index,value);
    syncCustom();
  }
  listen(targetControls,'click',event=>{
    const button=event.target.closest('[data-excite-level]');
    if(!button) return;
    target=Number(button.dataset.exciteLevel)-1;
    streamStart=now(customSvg,cTime);
    node('al-custom-state').textContent=`Atomer eksiteres til L${target+1}. ${target===1?'Alle sender ut lys med samme bølgelengde.':'Flere bølgelengder sendes ut samtidig.'}`;
    syncCustom();
    api.play?.(customSvg);
  });
  listen(customHandles,'pointerdown',event=>{
    const handle=event.target.closest('[data-custom-index]');
    if(!handle) return;
    event.preventDefault();
    handle.focus({preventScroll:true});
    const index=Number(handle.dataset.customIndex);
    drag={index, pointerId:event.pointerId, startY:event.clientY, startEnergy:levels[index], height:customSvg.getBoundingClientRect().height};
    try{ customStage.setPointerCapture(event.pointerId); } catch {}
  });
  listen(document,'pointermove',event=>{
    if(drag===null||event.pointerId!==drag.pointerId||drag.height<=0) return;
    changeLevel(drag.index,drag.startEnergy-(event.clientY-drag.startY)/drag.height*customHeight*LEVEL_MAX_AJ/(customBase-customTop));
  },{passive:true});
  const release=event=>{
    if(drag===null||event&&event.pointerId!==drag.pointerId) return;
    const {pointerId}=drag;
    drag=null;
    try{ customStage.releasePointerCapture(pointerId); } catch {}
  };
  listen(document,'pointerup',release);
  listen(document,'pointercancel',release);
  listen(customHandles,'keydown',event=>{
    const handle=event.target.closest('[data-custom-index]');
    if(!handle) return;
    const step={ArrowUp:.02,ArrowRight:.02,ArrowDown:-.02,ArrowLeft:-.02,PageUp:.1,PageDown:-.1}[event.key];
    if(!step&&event.key!=='Home'&&event.key!=='End') return;
    event.preventDefault();
    const index=Number(handle.dataset.customIndex);
    const newEnergy=event.key==='Home'?-Infinity:event.key==='End'?Infinity:levels[index]+step;
    changeLevel(index,newEnergy);
  });

  api.onFrame(t=>{
    hTime=t;
    const p=start===null?null:clamp((now(hydrogenSvg,t)-start)/1.55);
    const cache=`${layout.w}/${selected.from}/${showEnergy}/${p}`;
    if(hCache===cache) return;
    hCache=cache;
    hydrogenSvg.innerHTML=hydrogenGraphic(layout,selected,p,showEnergy);
    hydrogenSvg.setAttribute('data-transition',transitionKey(selected));
    hydrogenSvg.setAttribute('data-photon-arrived',String(p!==null&&p>=.89));
  },hydrogenSvg);
  api.onFrame(t=>{
    cTime=t;
    const running=streamStart!==null, elapsed=running?Math.max(0,now(customSvg,t)-streamStart):0;
    const cache=`${compact}/${levels.join(',')}/${target}/${running}/${elapsed}`;
    if(cCache===cache) return;
    cCache=cache;
    const spectrumWidth=compact?520:760;
    const activity=new Map(running?transitions.map((item,i)=>[transitionKey(item),.42+.58*(.5+.5*Math.sin(elapsed*9-i*.51))]):[]);
    customSvg.innerHTML=customGraphic(spectrumWidth,levels,target,transitions,elapsed,running);
    customSpectrum.innerHTML=spectrumGraphic(spectrumWidth,transitions,{activity,labelFor:item=>`L${item.from+1} → L${item.to+1}`});
    customSpectrum.setAttribute('data-seen-count',String(activity.size));
    customSvg.setAttribute('data-stream',String(running));
  },customSvg);
  syncBoard();
  syncHydrogenResult();
  syncCustom();
  const sizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(syncBoard):null;
  sizeObserver?.observe(board);
  const cleanupElementSpectra=mountElementSpectra(root,api);
  return()=>{
    sizeObserver?.disconnect();
    release();
    if(calculationDialog.open) calculationDialog.close();
    for(const cleanup of dispose) cleanup();
    cleanupElementSpectra?.();
  };
}

