import {elementSpectraHtml,mountElementSpectra} from './element-spectra.js?v=20261126-atomspektre';

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
// Selected neutral-atom levels and observed lines from NIST Handbook tables 3 and 5.
// The level values are wavenumbers in cm⁻¹, and pair indices run from upper to lower.
const observedAtomPresets={
  sodium:{name:'Natrium', wavenumbers:[0,16973.368,25739.991,29172.839,35042.85], pairs:[[1,0],[2,1],[3,1],[4,0]]},
  lithium:{name:'Litium', wavenumbers:[0,14903.957,27206.066,31283.053,36623.312], pairs:[[1,0],[2,1],[3,1],[4,1]]}
};
function photonColor(nm){if(!Number.isFinite(nm))return '#82969b';if(nm<380)return '#8767c6';if(nm>780)return '#b76e3c';if(nm<450)return '#9168e0';if(nm<490)return '#258dde';if(nm<520)return '#159fa8';if(nm<580)return '#6baf42';if(nm<630)return '#d4a024';return '#d95a4b';}

const hLevels = [1, 2, 3, 4, 5, 6];
const groundState = {from:1, to:1};
const groundFigureHeight = 250;
const excitationEnd = 1.9;
const emissionStart = 2.85;
const photonRelease = 3.5;
const transitionEnd = 4.65;
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
#al-hydrogen-model[data-levels-revealed=false] { background:transparent; border-color:transparent; box-shadow:none }
#al-hydrogen-model[data-levels-revealed=false] #al-hydrogen-svg { background:transparent }
#al-hydrogen-model .al-main { align-self:start; container-type:inline-size }
#al-h-stage { display:grid; gap:10px }
.al-h-ground-intro { display:grid; justify-items:start; gap:8px; padding:12px 14px; border:1px solid var(--line,#cddbd1); border-radius:10px; background:var(--green-soft,#e3efe7); line-height:1.45 }
.al-h-ground-intro[hidden] { display:none }
.al-h-ground-intro p { margin:0; font-size:.88rem }
.al-h-reveal { max-width:100%; text-align:left; line-height:1.35 }
@container(min-width:580px) {
  #al-hydrogen-svg { grid-area:1/1; align-self:start }
  #al-hydrogen-model[data-levels-revealed=false] #al-h-stage { border-radius:10px; background:var(--surface,#fff); box-shadow:inset 0 0 0 1px var(--line,#cddbd1) }
  #al-hydrogen-model[data-levels-revealed=false] #al-hydrogen-svg > rect { visibility:hidden }
  .al-h-ground-intro { grid-area:1/1; align-self:center; justify-self:end; width:53%; margin:10px 4% 10px 0 }
}
#al-hydrogen-model .al-h-side { position:relative; align-self:stretch; grid-template-rows:auto auto minmax(0,1fr); border:0; padding:0 }
.al-h-spectrum-intro { align-self:start; padding-top:12px; font-size:.86rem; line-height:1.5 }
.al-h-data { min-block-size:115px; padding-left:12px; border-left:1px solid transparent }
#al-hydrogen-model[data-transition-selected=true] .al-h-data { border-left-color:var(--line,#cddbd1) }
#al-hydrogen-model .al-h-spectrum-guide { position:absolute; inset-inline:0; top:87.4%; transform:translateY(-50%); display:flex; align-items:center; gap:7px; padding:6px 8px; border-inline-start:3px solid transparent; border-radius:5px; color:var(--green,#236448); font-size:.86rem; font-weight:700; line-height:1.35 }
.al-h-spectrum-guide span { flex:none; font-size:1.4rem; line-height:1 }
#al-hydrogen-model[data-transition-selected=false] .al-h-spectrum-guide { border-inline-start-color:var(--green,#236448); background:var(--green-soft,#e3efe7) }
#al-hydrogen-model[data-levels-revealed=false] .al-h-side,
#al-hydrogen-model[data-levels-revealed=false] + .al-caption { display:none }
@media(prefers-reduced-motion:no-preference) {
  #al-hydrogen-model[data-levels-revealed=true][data-transition-selected=false] .al-h-spectrum-guide { animation:al-h-guide-cue 1.15s ease-in-out 3 }
}
@keyframes al-h-guide-cue {
  50% { box-shadow:0 0 0 4px color-mix(in srgb,var(--green,#236448) 36%,transparent) }
}
@media(max-width:900px) {
  #al-hydrogen-model .al-h-side { grid-template-rows:auto auto }
  .al-h-spectrum-intro { padding:0 }
  .al-h-data { border:0; padding:0 }
  #al-hydrogen-model .al-h-spectrum-guide { position:static; transform:none; grid-area:1/1/2/-1 }
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
.al-readout[hidden] { display:none }
.al-readout strong { color:var(--ink,#20352e) }
.al-h-phase { font-size:.82rem; line-height:1.4 }
#al-hydrogen-model:has([data-h-phase=excitation],[data-h-phase=excited]) .al-h-wavelength-row { visibility:hidden }
.al-wavelength-example { display:inline; padding:0!important; border:0!important; background:none!important; color:var(--green,#236448)!important; font:inherit; font-weight:700; text-decoration:underline; text-underline-offset:3px; cursor:pointer; white-space:nowrap }
.al-calculation-dialog { width:min(620px,94vw); max-height:88vh; max-height:88dvh; margin:auto; padding:16px 21px; border:1px solid var(--line,#dce5de); border-radius:12px; box-sizing:border-box; background:var(--surface,#fff); color:var(--ink,#20352e); overflow:auto; box-shadow:0 20px 70px #0005 }
.al-calculation-dialog::backdrop { background:#13262099; backdrop-filter:blur(3px) }
.al-calculation-header { display:flex; align-items:center; justify-content:space-between; gap:12px }
.al-calculation-header h3 { margin:0; font-size:17px }
.al-calculation-header button { flex:none; font-size:12px }
.al-calculation-dialog p { margin:7px 0; font-size:13px; line-height:1.45 }
.al-calculation-dialog h4 { font-size:14px; margin:0 0 3px }
.al-calculation-steps { display:grid; gap:10px; margin:10px 0 }
.al-calculation-steps section { border-top:1px solid var(--line,#dce5de); padding-top:8px; min-width:0 }
.al-calculation-steps .calc-lines { border-spacing:0 3px; font-size:13px; margin:0 }
.al-calculation-levels { display:flex; flex-wrap:wrap; gap:2px 22px }
.al-calculation-dialog .al-calculation-note { margin:3px 0 0; color:var(--muted,#51685e) }
#al-custom-model .al-main { grid-area:1/1 }
#al-custom-model .al-side { grid-area:1/2 }
.al-custom-select { display:grid; gap:5px; color:var(--ink,#20352e); font-size:.88rem; font-weight:650 }
.al-custom-select select { width:100%; padding:7px 8px; color:inherit; background:var(--surface,#fff); border:1px solid var(--line,#cddbd1); border-radius:7px; font:inherit }
.al-custom-instructions { font-size:.86rem; line-height:1.5 }
.al-custom-arrow { filter:drop-shadow(0 0 1px #3b4c45) }
.al-model .al-level-handle { position:absolute; left:77%; transform:translate(-50%,-50%); width:22px; height:22px; min-width:22px; min-height:0; padding:0!important; border-radius:50%; border:2px solid #f2f8f4; box-shadow:0 0 0 1px #275f5b; background:#3a8881; touch-action:none; cursor:ns-resize; line-height:1; font-size:15px; font-weight:700; z-index:2 }
.al-model .al-level-handle::after { content:'↕'; color:white; position:absolute; inset:0; display:grid; place-items:center }
.al-model .al-level-handle:focus-visible { outline:3px solid #2677a0; outline-offset:3px }
@media(max-width:900px) {
  .al-model[data-model-layout=custom] { grid-template-columns:minmax(0,1fr)!important }
  .al-model[data-model-layout=custom] .al-side { grid-template-columns:repeat(2,minmax(0,1fr)); align-items:start; border-left:0; padding-left:0 }
  #al-custom-model .al-main, #al-custom-model .al-side { grid-area:auto }
}
@media(max-width:520px) {
  .al-model[data-model-layout=custom] { padding:9px!important }
  .al-model[data-model-layout=custom] .al-side { grid-template-columns:1fr }
  .al-model .al-level-handle { width:18px; height:18px; min-width:18px; font-size:12px }
  .al-calculation-dialog { padding:12px; max-height:92vh; max-height:92dvh }
  .al-calculation-header h3 { font-size:15px }
  .al-calculation-steps .calc-lines { font-size:12px }
}
</style>`;

export const atomLabSection = {title:'Spekteret til hydrogen', body:`${styles}
<div class="model al-model" data-model-layout="custom" id="al-hydrogen-model" data-levels-revealed="false" data-transition-selected="false">
  <div class="al-main">
    <div class="al-board" id="al-h-stage">
      <svg id="al-hydrogen-svg" class="al-figure" viewBox="0 0 760 ${groundFigureHeight}" role="img" aria-label="Hydrogenatom i grunntilstanden" tabindex="-1"></svg>
      <div class="al-h-ground-intro" id="al-h-ground-intro">
        <p>Du har kanskje sett hydrogenatomet tegnet slik før, med det ene elektronet i det innerste skallet rundt kjernen. Dette er <strong>grunntilstanden</strong> (n = 1), der atomet har lavest energi.</p>
        <p>Elektronet kan også være i andre skall. Når det går til et skall med lavere energi, kan atomet sende ut lys.</p>
        <button type="button" class="al-h-reveal" id="al-h-reveal" aria-controls="al-h-stage" aria-expanded="false">Åpne Bohrs modell av hydrogenatomet</button>
      </div>
      <div class="al-spectrum-hits" id="al-h-spectrum-controls" role="group" aria-label="Velg spektrallinje" aria-describedby="al-h-spectrum-guide" hidden></div>
    </div>
  </div>
  <div class="al-side al-h-side">
    <p class="al-h-spectrum-intro">Når elektronet går ned fra nivå 3, 4, 5 eller 6 til nivå 2, sender atomet ut synlig lys. Det gir de fire tydeligste linjene i hydrogenets synlige emisjonsspekter.</p>
    <div class="al-h-data">
      <div id="al-h-readout" class="al-readout" aria-live="polite" hidden>
        <strong id="al-h-transition"></strong>
        <p class="al-h-phase" id="al-h-phase"></p>
        <div class="al-h-wavelength-row">Bølgelengde <button type="button" id="al-h-wavelength" class="al-wavelength-example" data-al-wavelength-example aria-haspopup="dialog" aria-controls="al-h-calculation-dialog" aria-expanded="false" title="Vis utregningen"></button></div>
      </div>
    </div>
    <p class="al-h-spectrum-guide" id="al-h-spectrum-guide"><span aria-hidden="true">←</span> Velg en spektrallinje for å se overgangen.</p>
  </div>
</div>
<p class="al-caption">Hvert skall i Bohrs atommodell tilsvarer et energinivå. Atomet kan ta opp energi slik at elektronet går til et høyere nivå. I diagrammet viser de vannrette strekene de samme nivåene, med høyere energi oppover. Avstandene er skjematiske.</p>
<dialog id="al-h-calculation-dialog" class="al-calculation-dialog" aria-labelledby="al-h-calculation-title">
  <header class="al-calculation-header"><h3 id="al-h-calculation-title">Regn ut energien og bølgelengden</h3><button type="button" id="al-h-calculation-close">Lukk</button></header>
  <div id="al-h-calculation-body"></div>
</dialog>`};

export const customAtomSection = {title:'Hva med andre atomer?', body:`
<p>Ulike atomer har ulike energinivåer. Hver pil viser en overgang som gir en linje i emisjonsspekteret. Større energiforskjell gir kortere bølgelengde.</p>
<div class="model al-model" data-model-layout="custom" id="al-custom-model">
  <div class="al-side">
    <label class="al-custom-select" for="al-custom-preset">Velg atom
      <select id="al-custom-preset" aria-describedby="al-custom-instructions">
        ${Object.entries(observedAtomPresets).map(([id,preset])=>`<option value="${id}">${preset.name}</option>`).join('')}
        <option value="custom">Vilkårlig atom</option>
      </select>
    </label>
    <p class="al-custom-instructions" id="al-custom-instructions">Flytt et energinivå og se hvilke spektrallinjer som flytter seg.</p>
  </div>
  <div class="al-main">
    <div class="al-custom-stage" id="al-c-stage">
      <svg id="al-custom-svg" class="al-figure" viewBox="0 0 760 246" role="img" aria-label="Energinivåer som kan flyttes og overganger mellom dem"></svg>
      <div id="al-custom-handles"></div>
    </div>
    <svg id="al-custom-spectrum" class="al-figure al-spectrum" viewBox="0 0 760 130" role="img" aria-label="Emisjonsspekter der linjene flytter seg når energinivåene endres"></svg>
  </div>
</div>
<p class="al-caption">Figuren viser et utvalg av energinivåer og observerte overganger i <a href="https://physics.nist.gov/PhysRefData/Handbook/Tables/sodiumtable5.htm" target="_blank" rel="noopener">natrium</a> og <a href="https://physics.nist.gov/PhysRefData/Handbook/Tables/lithiumtable5.htm" target="_blank" rel="noopener">litium</a> fra NIST.</p>
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
  atom:{x:narrow?105:178,y:150,inner:narrow?26:36,step:narrow?11:14},
  graph:{left:narrow?221:394,right:narrow?294:596,levels:[0,246,208,169,130,91,52]},
  spectrum:{left:22,right:narrow?418:738,top:300,bottom:350}
});
const visibleX = (layout,nm) => layout.spectrum.left + (layout.spectrum.right-layout.spectrum.left)*(nm-380)/400;
function visibleSpectrum(layout,t,arrived) {
  const band = layout.spectrum;
  const lines = visibleLines.map(item => {
    const x=visibleX(layout,item.wavelengthNM), selected=t?.from===item.from, color=wavelengthInk(item.wavelengthNM);
    const labelY=band.bottom-8-(layout.w<500&&item.from===5?18:0);
    const glow=selected&&arrived?line(x,band.top+3,x,band.bottom-4,color,'stroke-width="19" opacity=".42"'):'';
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
  const start = orbitPoint(layout.atom,t.to,.71), v = ease(progress);
  const dx=end[0]-start[0],dy=end[1]-start[1];
  const x = start[0] + dx*v;
  const y = start[1] + dy*(v+.34*Math.sin(Math.PI*v));
  const angle = Math.atan2(dy*(1+.34*Math.PI*Math.cos(Math.PI*v)),dx);
  return wavePacket(x,y,angle,progress*27,wavelengthInk(t.wavelengthNM));
}
function hydrogenFrame(selected,elapsed){
  if(!selected) return {phase:'ground',movement:groundState,motion:0,photon:null};
  if(elapsed<emissionStart) {
    return {phase:elapsed<excitationEnd?'excitation':'excited',movement:{from:1,to:selected.from},motion:ease(elapsed/excitationEnd),photon:null};
  }
  const settled=elapsed>=transitionEnd;
  return {
    phase:settled?'settled':'emission',movement:selected,
    motion:ease((elapsed-emissionStart)/(photonRelease-emissionStart)),
    photon:elapsed>=photonRelease&&!settled?(elapsed-photonRelease)/(transitionEnd-photonRelease):null
  };
}
function hydrogenGraphic(layout,revealed,t,frame) {
  const {w,atom,graph} = layout, narrow = w < 500;
  const {phase,movement,motion,photon}=frame;
  const face = atomFace(atom,revealed?hLevels:[1],movement,motion,.71);
  const atomGraphic=`<g data-h-atom>${text(24,28,'Hydrogenatom','class="al-title"')}${face.base}${face.electron}</g>`;
  if(!revealed) return `<rect x="1" y="1" width="${w-2}" height="${groundFigureHeight-2}" rx="10" fill="var(--surface,#fff)" class="al-grid"/>${atomGraphic}`;
  const {from,to}=movement;
  const levels = hLevels.map(n => {
    const active = n===from || n===to;
    const label = `n = ${n}`;
    return line(graph.left,graph.levels[n],graph.right,graph.levels[n],active?'#318a80':'var(--line,#a6b8ae)',`stroke-width="${active?3.1:1.7}"`)
      + text(graph.right+8,graph.levels[n]+5,label,'class="al-small"');
  }).join('');
  const xArrow=graph.left+(graph.right-graph.left)*.50;
  const yFrom=graph.levels[from],yTo=graph.levels[to];
  const yDot=yFrom+(yTo-yFrom)*motion;
  const rising=yTo<yFrom, arrowInset=rising?-4:4;
  return `${atomGraphic}<g data-h-energy-diagram>${text(graph.left,28,'Energinivåer','class="al-title"')}
    ${line(narrow?205:356,47,narrow?205:356,259,'var(--line,#cddbd1)')}
    ${levels}
    ${t?arrow(xArrow,yFrom+arrowInset,xArrow,yTo-arrowInset,rising?'var(--orange,#be7c39)':t.color,3,rising?'data-h-excitation-arrow':'data-h-emission-arrow'):''}
    <circle cx="${graph.left+13}" cy="${yDot}" r="6.6" fill="#237897" stroke="#f4fffa" stroke-width="1.7" data-h-energy-electron/>
    </g>
    ${visibleSpectrum(layout,t,phase==='settled')}
    ${photon===null?'':`<g data-h-emitted-photon>${routedPhoton(layout,t,photon)}</g>`}`;
}

export const atomDrawing = {
  hLevels, hydrogenEnergy, atomFace, orbitPoint, arrow, wavePacket,
  wavelengthInk, fmt, line, text, ease, transitionKey
};

const customHeight=246, customTop=48, customBase=214;
const customLevelLimit=.85, customLevelGap=.02;
const customY=energy=>customBase-(customBase-customTop)*energy/customLevelLimit;
const customLevelLabel=n=>`Nivå ${n+1}`;
const customTransitionLabel=t=>`${customLevelLabel(t.from)} → ${customLevelLabel(t.to)} · ${fmt(t.wavelengthNM,1)} nm`;

function customSpectrumGraphic(width,transitions) {
  const min=200, max=10000, left=22, right=width-22, top=33, bottom=92;
  const x=nm=>left+(right-left)*Math.log(nm/min)/Math.log(max/min);
  const regions=[[min,380,'UV'],[380,780,'Synlig lys'],[780,max,'Infrarødt']].map(([lo,hi,label])=>
    text((x(lo)+x(hi))/2,22,label,'style="font-weight:700" text-anchor="middle"')).join('');
  const lines=transitions.map(t=>{
    const xx=x(t.wavelengthNM);
    return `<g data-custom-line="${transitionKey(t)}"><title>${customTransitionLabel(t)}</title>
      ${line(xx,top+4,xx,bottom-4,wavelengthInk(t.wavelengthNM),'stroke-linecap="round" stroke-width="3.4"')}
      </g>`;
  }).join('');
  const ticks=[min,380,780,3000,max].map(nm=>line(x(nm),bottom+2,x(nm),bottom+7,'var(--muted,#71887c)')
    +text(x(nm),118,`${fmt(nm,0)} nm`,`class="al-small" text-anchor="${nm===min?'start':nm===max?'end':'middle'}"`)).join('');
  return `${regions}<rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}" rx="7" fill="#080d15"/>
    ${[380,780].map(nm=>line(x(nm),top,x(nm),bottom,'#4b5867')).join('')}${lines}${ticks}`;
}

function customHandleYs(levels) {
  const result=[];
  let next=customTop;
  for(let n=levels.length-1;n>=1;n--) {
    result[n]=Math.max(next,customY(levels[n]));
    next=result[n]+30;
  }
  const over=Math.max(0,result[1]-(customBase-27));
  return result.map(y=>y-over);
}
function customGraphic(width,levels,transitions,positions) {
  const graphLeft=width<500?37:65, graphRight=width*.77-5;
  const rows=levels.map((energy,n)=>{
    const y=customY(energy), labelY=n===0?y:positions[n];
    return line(graphLeft,y,graphRight,y,'var(--muted,#71887c)','stroke-width="1.4" opacity=".72"')
      + (n===0?'':line(graphRight,y,width*.77,labelY,'var(--muted,#71887c)','opacity=".6"'))
      + text(width*.77+19,labelY+5,customLevelLabel(n),'class="al-small"');
  }).join('');
  const arrows=transitions.map((t,index)=>{
    const x=graphLeft+(graphRight-graphLeft)*(index+1)/(transitions.length+1);
    const from=customY(levels[t.from]), to=customY(levels[t.to]);
    return `<g><title>${customTransitionLabel(t)}</title>
      ${arrow(x,from,x,to,wavelengthInk(t.wavelengthNM),3,'class="al-custom-arrow"')}</g>`;
  }).join('');
  return `${text(graphLeft,29,'Energinivåer','class="al-title"')}
    ${arrow(graphLeft-15,customBase,graphLeft-15,customTop,'var(--muted,#71887c)',1.5)}
    ${rows}${arrows}${text(graphLeft,237,'Energi øker oppover','class="al-small"')}`;
}

const fraction = (numerator,denominator) => `<span class="frac"><span class="num">${numerator}</span><span class="den">${denominator}</span></span>`;
function power(value,digits=3) {
  const exponent=Math.floor(Math.log10(Math.abs(value)));
  return `${fmt(value/10**exponent,digits)} · 10<sup>${String(exponent).replace('-','−')}</sup>`;
}
const calcRow=(lhs,eq,rhs)=>`<div class="calc-row"><span class="calc-lhs">${lhs}</span><span class="calc-eq">${eq}</span><span class="calc-rhs">${rhs}</span></div>`;
function calculation(t) {
  const level=n=>`E<sub>${n}</sub>`;
  const energy=(value,digits)=>`${fmt(value,digits).replace('-','−')}&nbsp;aJ`;
  const ground=energy(HYDROGEN_GROUND_AJ,5);
  const levelEnergy=n=>energy(hydrogenEnergy(n),6);
  const photonEnergyJ=`${power(t.energyJ,5)} J`;
  const substitutions=[t.from,t.to].map(n=>`<div class="calc-lines">
    ${calcRow(level(n),'≈',`${fraction(ground,`${n}<sup>2</sup>`)} ≈ ${levelEnergy(n)}`)}
    </div>`).join('');
  return `<p>Elektronet går fra <strong>n = ${t.from}</strong> til <strong>n = ${t.to}</strong>. Fotonet får energien som atomet mister.</p>
    <div class="al-calculation-steps">
      <section>
        <h4>1. Finn energinivåene med Bohrs formel</h4>
        <div class="calc-lines">${calcRow(level('n'),'≈',fraction('−2,18&nbsp;aJ','n<sup>2</sup>'))}</div>
        <p class="al-calculation-note">Vi bruker ${ground} i telleren for å unngå avrundingsfeil.</p>
        <div class="al-calculation-levels">${substitutions}</div>
      </section>
      <section>
        <h4>2. Finn energien til fotonet</h4>
        <div class="calc-lines">
          ${calcRow('ΔE','=',`${level(t.from)} − ${level(t.to)}`)}
          ${calcRow('','≈',`(${levelEnergy(t.from)}) − (${levelEnergy(t.to)})`)}
          ${calcRow('','≈',`<strong>${energy(t.energyAJ,6)}</strong> = ${photonEnergyJ}`)}
        </div>
        <p class="al-calculation-note"><strong>1 aJ = 10<sup>−18</sup> J</strong></p>
      </section>
      <section>
        <h4>3. Finn bølgelengden</h4>
        <div class="calc-lines">
          ${calcRow('λ','=',fraction('h · c','ΔE'))}
          ${calcRow('','≈',fraction('6,626 · 10<sup>−34</sup> J s · 2,998 · 10<sup>8</sup> m/s',photonEnergyJ))}
          ${calcRow('','≈',`${power(t.wavelengthNM*1e-9,5)} m ≈ <strong>${fmt(t.wavelengthNM,1)} nm</strong>`)}
        </div>
        <p class="al-calculation-note">h er Plancks konstant og c er lysfarten. 1 nm = 10<sup>−9</sup> m.</p>
      </section>
    </div>
    <p>Du lærer å regne på slike overganger i atomfysikk i <strong>Fysikk 1</strong>.</p>`;
}

function mountCustomAtom(root,listen) {
  const node=id=>root.querySelector('#'+id);
  const plot=node('al-custom-svg');
  if(!plot) return ()=>{};
  const stage=node('al-c-stage'), handles=node('al-custom-handles');
  const spectrum=node('al-custom-spectrum'), presetSelect=node('al-custom-preset');
  let preset='sodium', levels=[], pairs=[], width=760, drag=null;
  const relative=energy=>Math.round(energy/customLevelLimit*100);
  const lowerBound=index=>levels[index-1]+customLevelGap;
  const upperBound=index=>index+1<levels.length?levels[index+1]-customLevelGap:customLevelLimit;

  function render(){
    const transitions=pairs.map(([from,to])=>({from,to,...photonFromEnergyAJ(levels[from]-levels[to])}));
    const positions=customHandleYs(levels);
    for(const handle of handles.querySelectorAll('[data-custom-index]')){
      const index=Number(handle.dataset.customIndex), value=relative(levels[index]);
      handle.style.top=positions[index]/customHeight*100+'%';
      handle.setAttribute('aria-valuemin',String(relative(lowerBound(index))));
      handle.setAttribute('aria-valuemax',String(relative(upperBound(index))));
      handle.setAttribute('aria-valuenow',String(value));
      handle.setAttribute('aria-valuetext',`${value} prosent opp i energidiagrammet`);
    }
    plot.innerHTML=customGraphic(width,levels,transitions,positions);
    plot.setAttribute('data-atom',preset);
    spectrum.innerHTML=customSpectrumGraphic(width,transitions);
    spectrum.setAttribute('data-possible-count',String(transitions.length));
  }
  function selectPreset(value){
    const observed=observedAtomPresets[value];
    if(observed){
      levels=observed.wavenumbers.map(cm=>HC_AJ_NM*cm/1e7);
      pairs=observed.pairs;
    }
    preset=value;
    render();
  }
  function changeLevel(index,value){
    const moved=moveCustomLevel(levels,index,value,customLevelGap,customLevelLimit);
    if(moved[index]===levels[index]) return;
    levels=moved;
    preset='custom';
    presetSelect.value=preset;
    render();
  }
  function release(event){
    if(drag===null||event&&event.pointerId!==drag.pointerId) return;
    const {pointerId}=drag;
    drag=null;
    try{ stage.releasePointerCapture(pointerId); } catch {}
  }

  handles.innerHTML=observedAtomPresets.sodium.wavenumbers.slice(1).map((_,i)=>{
    const index=i+1, label=customLevelLabel(index);
    return `<button type="button" class="al-level-handle" data-custom-index="${index}" role="slider" aria-label="Flytt ${label.toLowerCase()}" aria-orientation="vertical" title="${label}. Dra eller bruk piltastene."></button>`;
  }).join('');
  listen(presetSelect,'change',event=>{
    release();
    selectPreset(event.target.value);
  });
  listen(handles,'pointerdown',event=>{
    const handle=event.target.closest('[data-custom-index]');
    if(!handle||drag!==null||event.button!==0) return;
    event.preventDefault();
    handle.focus({preventScroll:true});
    const index=Number(handle.dataset.customIndex);
    drag={index,pointerId:event.pointerId,startY:event.clientY,startEnergy:levels[index],height:plot.getBoundingClientRect().height};
    try{ stage.setPointerCapture(event.pointerId); } catch {}
  });
  listen(document,'pointermove',event=>{
    if(drag===null||event.pointerId!==drag.pointerId||drag.height<=0) return;
    const moved=(drag.startY-event.clientY)*customHeight/drag.height;
    changeLevel(drag.index,drag.startEnergy+moved*customLevelLimit/(customBase-customTop));
  },{passive:true});
  listen(document,'pointerup',release);
  listen(document,'pointercancel',release);
  listen(handles,'keydown',event=>{
    const handle=event.target.closest('[data-custom-index]');
    if(!handle) return;
    const step={ArrowUp:.01,ArrowRight:.01,ArrowDown:-.01,ArrowLeft:-.01,PageUp:.05,PageDown:-.05}[event.key];
    if(!step&&event.key!=='Home'&&event.key!=='End') return;
    event.preventDefault();
    const index=Number(handle.dataset.customIndex);
    const value=event.key==='Home'?lowerBound(index):event.key==='End'?upperBound(index):levels[index]+step;
    changeLevel(index,value);
  });

  function fitDiagram(){
    const nextWidth=stage.getBoundingClientRect().width<520?410:760;
    if(nextWidth===width) return;
    width=nextWidth;
    plot.setAttribute('viewBox',`0 0 ${width} ${customHeight}`);
    spectrum.setAttribute('viewBox',`0 0 ${width} 130`);
    render();
  }
  selectPreset(preset);
  fitDiagram();
  const sizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(fitDiagram):null;
  sizeObserver?.observe(stage);
  return ()=>{ sizeObserver?.disconnect(); release(); };
}

export function mountAtomLab(root,api) {
  const node=id=>root.querySelector('#'+id);
  const hydrogenSvg=node('al-hydrogen-svg');
  if (!hydrogenSvg) return ()=>{};
  const hydrogenModel=node('al-hydrogen-model'), revealButton=node('al-h-reveal');
  const groundIntro=node('al-h-ground-intro');
  const board=node('al-h-stage'), spectrumControls=node('al-h-spectrum-controls');
  const calculationDialog=node('al-h-calculation-dialog'), calculationBody=node('al-h-calculation-body');
  const calculationClose=node('al-h-calculation-close'), wavelengthButton=node('al-h-wavelength');
  const readout=node('al-h-readout'), transitionLabel=node('al-h-transition'), phaseExplanation=node('al-h-phase');
  const dispose=[];
  const listen=(el,event,fn,options)=>{
    el.addEventListener(event,fn,options);
    dispose.push(()=>el.removeEventListener(event,fn,options));
  };
  let revealed=false, selected=null;
  let start=null, hTime=0, hCache='', displayedPhase='';
  let layout=hydrogenLayout(false), compact=null;
  const now=(el,fallback)=>typeof api.now==='function'?api.now(el):fallback;
  const repaint=el=>api.repaint(el);
  const motionPreference=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;

  function syncHydrogenResult(){
    hydrogenModel.setAttribute('data-transition-selected','true');
    readout.hidden=false;
    wavelengthButton.textContent=`${fmt(selected.wavelengthNM,1)} nm`;
    if(calculationDialog.open) calculationBody.innerHTML=calculation(selected);
    for(const button of spectrumControls.querySelectorAll('button')) {
      button.setAttribute('aria-pressed',String(Number(button.dataset.hLine)===selected.from));
    }
  }
  function syncHydrogenPhase(phase){
    const key=`${selected?.from}/${phase}`;
    if(displayedPhase===key) return;
    displayedPhase=key;
    hydrogenSvg.setAttribute('data-h-phase',phase);
    if(!selected) return;
    if(phase==='excitation') {
      transitionLabel.textContent=`Eksitasjon · n = 1 → ${selected.from}`;
      phaseExplanation.textContent='Atomet tar opp energi. Elektronet går til et høyere skall.';
    } else if(phase==='excited') {
      transitionLabel.textContent=`Eksitert atom · n = ${selected.from}`;
      phaseExplanation.textContent='Atomet har mer energi enn i grunntilstanden.';
    } else {
      transitionLabel.textContent=`Emisjon · n = ${selected.from} → ${selected.to}`;
      phaseExplanation.textContent=phase==='emission'?'Elektronet går ned, og atomet sender ut lys som et foton.':'Først tok atomet opp energi (eksitasjon). Så sendte det ut lys.';
    }
  }
  function syncSpectrumControls(){
    const factor=100/layout.w, {spectrum, h}=layout;
    const oldFocus=spectrumControls.contains(document.activeElement)?document.activeElement.dataset.hLine:null;
    spectrumControls.innerHTML=visibleLines.map((t,i)=>{
      const x=visibleX(layout,t.wavelengthNM);
      const edge=(other,sign)=>other?(x+visibleX(layout,other.wavelengthNM))/2:x+sign*(compact?16:26);
      const left=Math.max(spectrum.left,edge(visibleLines[i-1],-1)), right=Math.min(spectrum.right,Math.min(edge(visibleLines[i+1],1),x+(compact?24:37)));
      const title=`${formatNM(t)} nm, nivå ${t.from} til nivå ${t.to}`;
      return `<button type="button" data-h-line="${t.from}" title="${title}" aria-label="${title}" aria-pressed="${t.from===selected?.from}" style="--left:${left*factor}%;--width:${(right-left)*factor}%;--top:${(spectrum.top-3)*100/h}%;--height:${(spectrum.bottom-spectrum.top+7)*100/h}%"></button>`;
    }).join('');
    if(oldFocus!==null) spectrumControls.querySelector(`[data-h-line="${oldFocus}"]`)?.focus({preventScroll:true});
  }
  function syncHydrogenViewBox(){
    hydrogenSvg.setAttribute('viewBox',`0 0 ${layout.w} ${revealed?layout.h:groundFigureHeight}`);
  }
  function syncBoard(){
    const narrow=board.getBoundingClientRect().width<520;
    if(narrow===compact) return;
    compact=narrow;
    layout=hydrogenLayout(compact);
    syncHydrogenViewBox();
    if(revealed) syncSpectrumControls();
    repaint(hydrogenSvg);
  }
  listen(revealButton,'click',()=>{
    if(revealed) return;
    revealed=true;
    hydrogenModel.setAttribute('data-levels-revealed','true');
    revealButton.setAttribute('aria-expanded','true');
    groundIntro.hidden=true;
    revealButton.hidden=true;
    hydrogenSvg.setAttribute('aria-label','Hydrogenatom, energinivådiagram og synlig emisjonsspekter');
    spectrumControls.hidden=false;
    syncHydrogenViewBox();
    syncSpectrumControls();
    repaint(hydrogenSvg);
    hydrogenSvg.focus({preventScroll:true});
  });
  listen(spectrumControls,'click',event=>{
    const button=event.target.closest('[data-h-line]');
    if(!button) return;
    selected=transition(Number(button.dataset.hLine),2);
    start=now(hydrogenSvg,hTime)-(motionPreference?.matches?transitionEnd:0);
    syncHydrogenResult();
    repaint(hydrogenSvg);
  });
  listen(wavelengthButton,'click',()=>{
    if(!selected) return;
    calculationBody.innerHTML=calculation(selected);
    calculationDialog.showModal();
    wavelengthButton.setAttribute('aria-expanded','true');
    calculationClose.focus();
  });
  listen(calculationClose,'click',()=>calculationDialog.close());
  listen(calculationDialog,'close',()=>{
    wavelengthButton.setAttribute('aria-expanded','false');
    wavelengthButton.focus();
  });
  listen(calculationDialog,'click',event=>{
    if(event.target!==calculationDialog) return;
    const bounds=calculationDialog.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom) calculationDialog.close();
  });

  if(motionPreference?.addEventListener)listen(motionPreference,'change',event=>{
    if(event.matches&&start!==null) start=now(hydrogenSvg,hTime)-transitionEnd;
    repaint(hydrogenSvg);
  });
  api.onFrame(t=>{
    hTime=t;
    const elapsed=motionPreference?.matches?transitionEnd:start===null?0:clamp(now(hydrogenSvg,t)-start,0,transitionEnd);
    const cache=`${layout.w}/${revealed}/${selected?.from}/${elapsed}`;
    if(hCache===cache) return;
    hCache=cache;
    const frame=hydrogenFrame(selected,elapsed);
    hydrogenSvg.innerHTML=hydrogenGraphic(layout,revealed,selected,frame);
    syncHydrogenPhase(frame.phase);
    if(selected) hydrogenSvg.setAttribute('data-transition',transitionKey(selected));
    hydrogenSvg.setAttribute('data-photon-arrived',String(frame.phase==='settled'));
  },hydrogenSvg);
  syncBoard();
  const cleanupCustomAtom=mountCustomAtom(root,listen);
  const sizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(syncBoard):null;
  sizeObserver?.observe(board);
  const cleanupElementSpectra=mountElementSpectra(root,api);
  return()=>{
    sizeObserver?.disconnect();
    cleanupCustomAtom();
    if(calculationDialog.open) calculationDialog.close();
    for(const cleanup of dispose) cleanup();
    cleanupElementSpectra?.();
  };
}

