import {elementSpectraHtml,mountElementSpectra} from './element-spectra.js?v=20261116-flight-atoms2';

const C=299792458,HC_AJ_NM=198.64458571489286;
export const HYDROGEN_GROUND_AJ=-2.17896022224;
export const HYDROGEN_LEVELS_AJ=Object.freeze(Array.from({length:6},(_,i)=>HYDROGEN_GROUND_AJ/(i+1)**2));
export const LEVEL_MAX_AJ=2.6,MIN_LEVEL_GAP_AJ=.06;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const fmt=(v,d=3)=>Number(v).toLocaleString('nb-NO',{maximumFractionDigits:d});
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};

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
const regionText=p=>p.region==='Synlig'?'Synlig lys':p.region==='Ingen stråling'?'Ingen foton':`${p.region} · usynlig`;
const levelLabel=n=>`n = ${n} · ${fmt(hydrogenEnergy(n),3)} aJ`;
const HY=[0,286,228,183,144,109,75];
const CY_LOW=282,CY_HIGH=92;
const customY=e=>CY_LOW-(CY_LOW-CY_HIGH)*e/LEVEL_MAX_AJ;
const options=(n,min=1,max=6)=>Array.from({length:max-min+1},(_,i)=>`<option value="${i+min}" ${n===i+min?'selected':''}>${levelLabel(i+min)}</option>`).join('');
const styles=`<style>
.al-model[data-model-layout=custom]{display:grid!important;grid-template-columns:minmax(0,1fr) 215px;gap:10px 18px;align-items:start;max-width:none!important;padding:13px!important}
.al-model-header{grid-column:1/-1;display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0!important;font-size:17px!important;line-height:1.35}
.al-model-main{min-width:0}.al-stage{position:relative;min-width:0;line-height:0}
.al-figure,.al-spectrum{display:block;width:100%;height:auto;max-height:none!important;min-height:0!important;background:var(--surface,#fff);border-radius:9px}
.al-figure text,.al-spectrum text{font-family:inherit;font-size:16px;fill:var(--ink,#20352e)}.al-figure .al-small,.al-spectrum .al-small{font-size:13px;fill:var(--muted,#60736b)}.al-spectrum .al-tiny{font-size:14px;fill:var(--muted,#60736b)}
.al-spectrum{margin-top:5px}.al-model-panel{border-left:1px solid var(--line,#dce5de);padding-left:16px;display:flex;flex-direction:column;gap:10px;min-width:0;align-self:stretch;justify-content:center}
.al-model-panel .control{display:block!important;max-width:none!important;min-width:0!important;width:100%;font-size:12px;line-height:1.5;margin:0}.al-model-panel select{width:100%;font:inherit;padding:6px;margin-top:4px;background:var(--surface,#fff);color:var(--ink,#20352e);border:1px solid var(--line,#dce5de);border-radius:7px}
.al-direction{display:grid;grid-template-columns:1fr 1fr;gap:5px}.al-direction button,.al-model-panel>button{font-size:12px;padding:8px 7px}.al-direction button{background:var(--surface,#fff);color:var(--ink,#20352e)}.al-direction button[aria-pressed=true]{background:var(--green,#236448);color:var(--surface,#fff)}
.al-readout{font-size:12px;line-height:1.5;padding:9px 10px;background:var(--green-soft,#e7f3e9);border-radius:8px;overflow-wrap:anywhere}.al-readout>div+div{margin-top:5px}.al-readout strong{font-size:inherit}.al-phase{font-size:11px;line-height:1.5;color:var(--muted,#60736b);margin:0}
.al-level-handle{position:absolute;left:76.7%;transform:translate(-50%,-50%);width:23px;height:23px;min-width:23px;padding:0!important;border-radius:50%;border:2px solid var(--surface,#fff);box-shadow:0 0 0 1px currentColor;background:#298fa7;color:#298fa7;touch-action:none;cursor:ns-resize;line-height:1;font-size:15px;font-weight:700;z-index:4}
.al-level-handle[data-endpoint=lower]{background:#d18a25;color:#d18a25}.al-level-handle::after{content:'↕';color:white;position:absolute;inset:1px 0;display:grid;place-items:center}.al-level-handle:focus-visible{outline:3px solid var(--blue,#2677a0);outline-offset:3px}.al-custom-handles .al-level-handle{background:#438f89;color:#438f89}.al-custom-handles .al-level-handle[data-target=true]{background:#d18a25;color:#d18a25}
.al-model-note{font-size:11px;line-height:1.6;color:var(--muted,#60736b);margin:8px 0 20px}.al-led{display:inline-block;width:7px;height:7px;border-radius:50%;background:#8a9a91;margin-right:5px}.al-stream-on .al-led{background:#53ab7a;box-shadow:0 0 5px #53ab7a80}
.al-note-strip{font-size:11px;line-height:1.5;margin:5px 0 0;color:var(--muted,#60736b)}.al-custom-name{font-size:11px;color:var(--muted,#60736b)}
@media(max-width:1100px){.al-model[data-model-layout=custom]{grid-template-columns:minmax(0,1fr)!important}.al-model-panel{border-left:0;border-top:1px solid var(--line,#dce5de);padding:11px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:10px}.al-model-panel .al-readout,.al-model-panel .al-phase{grid-column:1/-1}.al-model-header{font-size:16px!important}}
@media(max-width:520px){.al-model-panel{grid-template-columns:1fr 1fr}.al-model-panel>.al-readout,.al-model-panel>.al-phase{grid-column:1/-1}.al-level-handle{width:20px;height:20px;min-width:20px}.al-figure text{font-size:18px}.al-figure .al-small{font-size:15px}}
</style>`;

export const atomLabSection={title:'Atom og lys',body:`${styles}
<div class="model al-model" data-model-layout="custom" id="al-hydrogen-model">
 <h3 class="al-model-header" data-model-full-width>Hydrogenatomet – Bohrs atommodell</h3>
 <div class="al-model-main"><div class="al-stage" id="al-h-stage"><svg id="al-hydrogen-svg" class="al-figure" viewBox="0 0 760 320" role="img" aria-label="Hydrogenatom og seks faste energinivåer"></svg><button type="button" id="al-h-upper-handle" class="al-level-handle" data-endpoint="upper" role="slider" aria-label="Øvre nivå" aria-valuemin="2" aria-valuemax="6" aria-valuenow="3"></button><button type="button" id="al-h-lower-handle" class="al-level-handle" data-endpoint="lower" role="slider" aria-label="Nedre nivå" aria-valuemin="1" aria-valuemax="5" aria-valuenow="2"></button></div><svg id="al-hydrogen-spectrum" class="al-spectrum" viewBox="0 0 760 126" role="img" aria-label="Hydrogenets mulige spektrallinjer med valgt overgang markert"></svg></div>
 <div class="al-model-panel"><label class="control" for="al-h-upper">Øvre nivå<select id="al-h-upper">${options(3)}</select></label><label class="control" for="al-h-lower">Nedre nivå<select id="al-h-lower">${options(2)}</select></label><div class="al-direction" role="group" aria-label="Velg retning på overgangen"><button type="button" id="al-h-excitation" aria-pressed="false">Eksitasjon</button><button type="button" id="al-h-emission" aria-pressed="true">Emisjon</button></div><button type="button" id="al-h-show">Vis overgang</button><div id="al-h-readout" class="al-readout" aria-live="polite"></div><p id="al-h-phase" class="al-phase" aria-live="polite"></p></div>
</div>
<p class="al-model-note">Hydrogennivåene er <strong>faste</strong>; dra håndtakene eller bruk menyene for å velge dem. Her tilsvarer 0 aJ et fritt elektron. <strong>1 aJ = 10⁻¹⁸ J.</strong> UV og IR er usynlig lys.</p>
<div class="model al-model" data-model-layout="custom" id="al-custom-model">
 <h3 class="al-model-header" data-model-full-width>Lag et atom – og se hva spekteret forteller</h3>
 <div class="al-model-main"><div class="al-stage" id="al-c-stage"><svg id="al-custom-svg" class="al-figure" viewBox="0 0 760 320" role="img" aria-label="Modellatom med energinivåer som kan flyttes"></svg><div id="al-custom-handles" class="al-custom-handles"></div></div><svg id="al-custom-spectrum" class="al-spectrum" viewBox="0 0 760 126" role="img" aria-label="Mulige spektrallinjer og linjer som lyser opp når fotoner sendes ut"></svg></div>
 <div class="al-model-panel"><label class="control" for="al-custom-preset">Sammenlikn nivåer<select id="al-custom-preset"><option value="hydrogen">Hydrogen · nivå 1–4</option><option value="modelA" selected>Modellatom A</option><option value="modelB">Modellatom B</option><option value="custom">Tilpasset atom</option></select></label><label class="control" for="al-custom-target">Fotonet eksiterer til<select id="al-custom-target"></select></label><div id="al-custom-energy" class="al-readout" aria-live="polite"></div><button type="button" id="al-stream-toggle" aria-pressed="false"><span class="al-led" aria-hidden="true"></span>Start fotonstrøm</button><p id="al-custom-name" class="al-custom-name"></p><p id="al-custom-phase" class="al-phase" aria-live="polite"></p><div id="al-custom-lines" class="al-readout" aria-live="polite"></div></div>
</div>
<p class="al-model-note">Her kan du endre <strong>modellatomet</strong> ved å dra nivåene. Her velger vi grunntilstanden som 0 aJ; det er <strong>forskjellene</strong> mellom nivåene som bestemmer lyset. Fotonenergien følger det valgte målnivået. Ett elektron følger én vei ned; fotonstrømmen gjentar ulike veier med mange atomer, slik at alle mulige linjer under målnivået etter hvert kan lyse opp. Like energiforskjeller gir samme spektrallinje. Presetet hydrogen har riktige energiforskjeller; når du flytter et nivå, blir det et tilpasset modellatom. Atom A og B er oppdiktede modeller.</p>
${elementSpectraHtml}`};

function line(x1,y1,x2,y2,color='var(--line,#cfdbd4)',more=''){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${more}/>`;}
function arrow(x1,y1,x2,y2,color,width=3){const a=Math.atan2(y2-y1,x2-x1),r=8;return line(x1,y1,x2,y2,color,`stroke-width="${width}"`)+`<path d="M${x2-r*Math.cos(a-.5)} ${y2-r*Math.sin(a-.5)}L${x2} ${y2}L${x2-r*Math.cos(a+.5)} ${y2-r*Math.sin(a+.5)}" fill="none" stroke="${color}" stroke-width="${width}"/>`;}
function packet(x,y,color,phase=0){let d='';for(let i=0;i<=42;i++)d+=`${i?'L':'M'}${x+i} ${y+6*Math.sin(i*.8+phase)*Math.sin(Math.PI*i/42)}`;return `<path d="${d}" fill="none" stroke="${color}" stroke-width="3"/>`;}
const ringR=n=>25+12*n;
function atomGraphic({level=1,from=1,to=1,progress=0,type='none',photon=null,label='Hydrogen',stream=false}){
 const p=clamp(progress),motion=type==='absorption'?smooth((p-.3)/.4):type==='emission'?smooth(p/.48):0,r=ringR(from)+(ringR(to)-ringR(from))*motion;
 let s=`<text x="155" y="27" text-anchor="middle">${label}</text>`;
 const maxN=level;for(let n=maxN;n>=1;n--)s+=`<circle cx="155" cy="150" r="${ringR(n)}" fill="none" stroke="${n===from||n===to?'#438f89':'var(--muted,#60736b)'}" stroke-width="${n===from||n===to?2:1}" opacity="${n===from||n===to?.8:.22}"/>`;
 s+=`<circle cx="155" cy="150" r="13" fill="#d88e6d"/><text x="155" y="156" text-anchor="middle" style="fill:white;font-size:19px">+</text><circle cx="${155+r}" cy="150" r="8" fill="#288fa7" stroke="var(--surface,#fff)" stroke-width="2"/>`;
 if(type==='absorption'&&p<.42)s+=packet(288-(288-(155+ringR(from)-22))*smooth(p/.42),130,photon.color,p*8)+arrow(309,111,278,111,photon.color,2);
 if(type==='emission'&&p>.48&&p<.98)s+=packet(155+ringR(to)+(288-(155+ringR(to)))*smooth((p-.48)/.5),130,photon.color,p*8)+arrow(278,111,309,111,photon.color,2);
 if(stream&&type==='none')s+=packet(24,150,'#b88c40',p*8);
 return s;
}
function hGraphic(lower,upper,mode,p,running){
 const from=mode==='emission'?upper:lower,to=mode==='emission'?lower:upper,tr=transition(from,to),motion=mode==='emission'?smooth(p/.48):smooth((p-.3)/.4),yy=HY[from]+(HY[to]-HY[from])*motion;
 let s=atomGraphic({level:6,from,to,progress:running?p:0,type:running?tr.type:'none',photon:tr,label:'Hydrogenatom'});
 s+=`<text x="491" y="27" text-anchor="middle">Faste energinivåer</text><text x="155" y="288" text-anchor="middle">n = ${from} → n = ${to}</text><text x="155" y="310" text-anchor="middle" class="al-small">${regionText(tr)} · ${fmt(tr.wavelengthNM,1)} nm</text>`;
 for(let n=1;n<=6;n++)s+=`<g data-h-level="${n}" role="button" aria-label="Velg nivå ${n}">${line(347,HY[n],573,HY[n],n===lower||n===upper?'#438f89':'var(--line,#cfdbd4)',`stroke-width="${n===lower||n===upper?3:1.6}"`)}<text x="606" y="${HY[n]+5}" class="al-small">n=${n}</text><text x="650" y="${HY[n]+5}" class="al-small">${fmt(hydrogenEnergy(n),3)} aJ</text><line x1="345" x2="745" y1="${HY[n]}" y2="${HY[n]}" stroke="transparent" stroke-width="20"/></g>`;
 s+=arrow(480,HY[from],480,HY[to],tr.color,3.3)+`<circle cx="367" cy="${running?yy:HY[from]}" r="7" fill="#288fa7"/><text x="347" y="310" class="al-small">Energi ↑ · nivåavstand skjematisk</text>`;
 return s;
}
function handleYs(levels){const indexes=levels.slice(1).map((_,i)=>i+1).reverse(),ys=[];for(let i=0;i<indexes.length;i++)ys.push(Math.max(76,customY(levels[indexes[i]]),i?ys[i-1]+29:0));const over=Math.max(0,ys.at(-1)-248);return new Map(indexes.map((n,i)=>[n,ys[i]-over]));}
function customGraphic(levels,target,from,to,p,type,stream,preset){
 const photon=photonFromEnergyAJ(levels[from]-levels[to]),motion=type==='absorption'?smooth((p-.3)/.4):type==='emission'?smooth(p/.48):0,ys=handleYs(levels);
 let s=atomGraphic({level:levels.length,from:from+1,to:to+1,progress:p,type,photon,label:preset==='hydrogen'?'Hydrogen · relative nivåer':'Modellatom',stream});
 s+=`<text x="490" y="27" text-anchor="middle">Energi over grunntilstanden</text>`;
 for(let n=0;n<levels.length;n++){const y=customY(levels[n]),labelY=n===0?y:ys.get(n);s+=line(347,y,570,y,n===target?'#438f89':'var(--line,#cfdbd4)',`stroke-width="${n===target?3:1.7}"`);if(n)s+=line(570,y,583,labelY,'var(--muted,#60736b)','stroke-width="1" opacity=".55"');s+=`<text x="607" y="${labelY+5}" class="al-small">L${n+1}</text><text x="650" y="${labelY+5}" class="al-small">${fmt(levels[n],3)} aJ</text>`;}
 const dotY=customY(levels[from])+(customY(levels[to])-customY(levels[from]))*motion;s+=`<circle cx="367" cy="${dotY}" r="7" fill="#288fa7"/>`;
 if(from!==to)s+=arrow(480,customY(levels[from]),480,customY(levels[to]),photon.color,3.3);
 s+=`<text x="155" y="288" text-anchor="middle">${from===to?`L${from+1}`:`L${from+1} → L${to+1}`}</text><text x="155" y="310" text-anchor="middle" class="al-small">${from===to?'Atomet er i grunntilstanden':`${regionText(photon)} · ${fmt(photon.wavelengthNM,1)} nm`}</text>`;
 return s;
}
function spectrum(all,selected=[],glow=new Set(),seen=new Set()){
 const min=60,max=14000,x=nm=>39+680*Math.log(clamp(nm,min,max)/min)/Math.log(max/min),sel=new Set(selected.map(t=>`${t.from}-${t.to}`));
 let s='';for(const [a,b,color,name]of [[min,380,'#eee7f5','UV'],[380,780,'#e5f0e8','Synlig'],[780,max,'#f3e8df','IR']])s+=`<rect x="${x(a)}" y="24" width="${x(b)-x(a)}" height="47" fill="${color}"/><text x="${(x(a)+x(b))/2}" y="18" text-anchor="middle" class="al-small">${name}</text>`;
 for(const t of all){const key=`${t.from}-${t.to}`,active=glow.has(key),chosen=sel.has(key),known=seen.has(key),xx=x(t.wavelengthNM);s+=line(xx,active||chosen?29:44,xx,71,t.color,`stroke-width="${active?6:chosen?4:known?3:1.6}" opacity="${active||chosen?1:known?.85:.3}"`);}
 for(const nm of [100,380,780,3000,10000])s+=line(x(nm),72,x(nm),77,'var(--muted,#60736b)')+`<text x="${x(nm)}" y="94" text-anchor="middle" class="al-tiny">${fmt(nm,0)}</text>`;
 return s+`<text x="380" y="120" text-anchor="middle" class="al-small">Bølgelengde i nm · logaritmisk skala</text>`;
}

export function mountAtomLab(root,api){
 const q=id=>root.querySelector('#'+id);if(!q('al-hydrogen-svg'))return ()=>{};
 const disposers=[],listen=(el,type,fn,options)=>{el.addEventListener(type,fn,options);disposers.push(()=>el.removeEventListener(type,fn,options));};
 const hTarget=q('al-hydrogen-svg'),cTarget=q('al-custom-svg');let hTime=0,cTime=0,lower=2,upper=3,mode='emission',hStart=0,hRunning=false,activeHandle='upper';
 let levels=[...CUSTOM_LEVEL_PRESETS.modelA.levels],preset='modelA',target=3,stream=false,cycleStart=0,pathIndex=0,lastStepKey='',seen=new Set(),lastFlash=new Map(),drag=null;
 const clock=(which)=>typeof api.now==='function'?api.now(which==='h'?hTarget:cTarget):(which==='h'?hTime:cTime);
 const repaint=(which)=>api.repaint(which==='h'?hTarget:cTarget);
 const say=(id,s)=>{if(q(id).innerHTML!==s)q(id).innerHTML=s;};
 function syncH(){
  q('al-h-upper').innerHTML=options(upper,lower+1,6);q('al-h-lower').innerHTML=options(lower,1,upper-1);q('al-h-upper').value=String(upper);q('al-h-lower').value=String(lower);q('al-h-emission').setAttribute('aria-pressed',String(mode==='emission'));q('al-h-excitation').setAttribute('aria-pressed',String(mode==='absorption'));
  for(const endpoint of ['upper','lower']){const n=endpoint==='upper'?upper:lower,handle=q('al-h-'+endpoint+'-handle');handle.style.top=HY[n]/320*100+'%';handle.setAttribute('aria-valuenow',String(n));handle.setAttribute('aria-valuetext',levelLabel(n));handle.setAttribute('title',`${endpoint==='upper'?'Øvre':'Nedre'} nivå: ${levelLabel(n)}. Dra eller bruk piltastene.`);handle.setAttribute('aria-valuemin',String(endpoint==='upper'?lower+1:1));handle.setAttribute('aria-valuemax',String(endpoint==='upper'?6:upper-1));}
  const tr=transition(mode==='emission'?upper:lower,mode==='emission'?lower:upper);
  say('al-h-readout',`<div><strong>${mode==='emission'?'Emisjon: energi ut':'Eksitasjon: energi inn'}</strong></div><div>ΔE = <strong>${fmt(tr.energyAJ,4)} aJ</strong></div><div>λ = <strong>${fmt(tr.wavelengthNM,1)} nm</strong></div><div><strong>${regionText(tr)}</strong></div>`);
 }
 function setH(endpoint,n){activeHandle=endpoint;if(endpoint==='upper')upper=clamp(Math.round(n),lower+1,6);else lower=clamp(Math.round(n),1,upper-1);hRunning=false;syncH();repaint('h');}
 function syncCustom(rebuild=false){
  q('al-custom-preset').value=preset;target=clamp(target,1,levels.length-1);
  q('al-custom-target').innerHTML=levels.slice(1).map((e,i)=>`<option value="${i+1}" ${target===i+1?'selected':''}>L${i+2} · ${fmt(e,3)} aJ</option>`).join('');
  if(rebuild){q('al-custom-handles').innerHTML=levels.slice(1).map((e,i)=>`<button type="button" class="al-level-handle" data-custom-index="${i+1}" role="slider" aria-label="Flytt energinivå L${i+2}" aria-valuemin="0" aria-valuemax="${LEVEL_MAX_AJ}" aria-valuenow="${e}"></button>`).join('');}
  const ys=handleYs(levels);for(const handle of q('al-custom-handles').querySelectorAll('[data-custom-index]')){const n=Number(handle.dataset.customIndex);handle.style.top=ys.get(n)/320*100+'%';handle.setAttribute('aria-valuenow',String(levels[n]));handle.setAttribute('aria-valuemin',String(levels[n-1]+MIN_LEVEL_GAP_AJ));handle.setAttribute('aria-valuemax',String(n+1<levels.length?levels[n+1]-MIN_LEVEL_GAP_AJ:LEVEL_MAX_AJ));handle.setAttribute('aria-valuetext',`${fmt(levels[n],3)} aJ`);handle.setAttribute('data-target',String(n===target));handle.setAttribute('title',`L${n+1}: ${fmt(levels[n],3)} aJ. Dra eller bruk piltastene.`);}
  const p=photonFromEnergyAJ(levels[target]);say('al-custom-energy',`<div>Fotonenergi til L${target+1}:</div><div><strong>${fmt(p.energyAJ,3)} aJ</strong></div><div>${fmt(p.wavelengthNM,1)} nm · ${regionText(p)}</div>`);
  say('al-custom-name',preset==='hydrogen'?'Hydrogens riktige energiforskjeller, med grunntilstanden satt til 0 aJ.':preset==='custom'?'Tilpasset modellatom · nivåene er endret.':'Oppdiktet modellatom · flytt nivåene og sammenlikn.');
  const b=q('al-stream-toggle');b.setAttribute('aria-pressed',String(stream));b.classList.toggle('al-stream-on',stream);b.innerHTML=`<span class="al-led" aria-hidden="true"></span>${stream?'Stopp':'Start'} fotonstrøm`;
 }
 function restartCustom(){cycleStart=clock('c');pathIndex=0;lastStepKey='';seen.clear();lastFlash.clear();}
 function setCustom(index,value){levels=moveCustomLevel(levels,index,value);preset='custom';restartCustom();syncCustom();repaint('c');}
 function startH(){hStart=clock('h');hRunning=true;repaint('h');}
 listen(q('al-h-upper'),'change',()=>setH('upper',Number(q('al-h-upper').value)));listen(q('al-h-lower'),'change',()=>setH('lower',Number(q('al-h-lower').value)));
 listen(q('al-h-excitation'),'click',()=>{mode='absorption';hRunning=false;syncH();repaint('h');});listen(q('al-h-emission'),'click',()=>{mode='emission';hRunning=false;syncH();repaint('h');});listen(q('al-h-show'),'click',startH);
 listen(q('al-custom-preset'),'change',()=>{const key=q('al-custom-preset').value;if(key!=='custom'){preset=key;levels=[...CUSTOM_LEVEL_PRESETS[key].levels];target=Math.min(3,levels.length-1);}else preset='custom';restartCustom();syncCustom(true);repaint('c');});
 listen(q('al-custom-target'),'change',()=>{target=Number(q('al-custom-target').value);restartCustom();syncCustom();repaint('c');});
 listen(q('al-stream-toggle'),'click',()=>{stream=!stream;if(stream)restartCustom();syncCustom();repaint('c');});
 for(const endpoint of ['upper','lower']){const handle=q('al-h-'+endpoint+'-handle');listen(handle,'keydown',e=>{let delta=e.key==='ArrowUp'||e.key==='ArrowRight'?1:e.key==='ArrowDown'||e.key==='ArrowLeft'?-1:0;if(!delta&&!['Home','End'].includes(e.key))return;e.preventDefault();const current=endpoint==='upper'?upper:lower;setH(endpoint,e.key==='Home'?(endpoint==='upper'?lower+1:1):e.key==='End'?(endpoint==='upper'?6:upper-1):current+delta);});}
 listen(q('al-h-stage'),'pointerdown',e=>{const handle=e.target.closest?.('[data-endpoint]');if(!handle)return;e.preventDefault();activeHandle=handle.dataset.endpoint;drag={kind:'h',endpoint:activeHandle,pointerId:e.pointerId};try{q('al-h-stage').setPointerCapture(e.pointerId);}catch{}});
 listen(hTarget,'click',e=>{if(drag)return;const picked=e.target.closest?.('[data-h-level]');if(picked)setH(activeHandle,Number(picked.dataset.hLevel));});
 listen(q('al-custom-handles'),'pointerdown',e=>{const handle=e.target.closest?.('[data-custom-index]');if(!handle)return;e.preventDefault();const index=Number(handle.dataset.customIndex),rect=cTarget.getBoundingClientRect();drag={kind:'c',index,startY:e.clientY,startEnergy:levels[index],height:rect.height,pointerId:e.pointerId};try{q('al-c-stage').setPointerCapture(e.pointerId);}catch{}});
 listen(q('al-custom-handles'),'keydown',e=>{const handle=e.target.closest?.('[data-custom-index]');if(!handle)return;const index=Number(handle.dataset.customIndex),step=e.key==='PageUp'?.1:e.key==='PageDown'?-.1:e.key==='ArrowUp'||e.key==='ArrowRight'?.02:e.key==='ArrowDown'||e.key==='ArrowLeft'?-.02:0;if(!step&&!['Home','End'].includes(e.key))return;e.preventDefault();const lo=levels[index-1]+MIN_LEVEL_GAP_AJ,hi=index+1<levels.length?levels[index+1]-MIN_LEVEL_GAP_AJ:LEVEL_MAX_AJ;setCustom(index,e.key==='Home'?lo:e.key==='End'?hi:levels[index]+step);});
 listen(document,'pointermove',e=>{if(!drag)return;if(drag.kind==='h'){const r=hTarget.getBoundingClientRect(),y=(e.clientY-r.top)/r.height*320;let n=1;for(let i=2;i<=6;i++)if(Math.abs(HY[i]-y)<Math.abs(HY[n]-y))n=i;setH(drag.endpoint,n);}else setCustom(drag.index,drag.startEnergy-(e.clientY-drag.startY)/drag.height*320*LEVEL_MAX_AJ/(CY_LOW-CY_HIGH));},{passive:true});
 const release=()=>{if(drag){try{q(drag.kind==='h'?'al-h-stage':'al-c-stage').releasePointerCapture(drag.pointerId);}catch{}drag=null;}};listen(document,'pointerup',release);listen(document,'pointercancel',release);
 api.onFrame(t=>{
  hTime=t;const elapsed=clock('h')-hStart,p=hRunning?clamp(elapsed/2.8):0,tr=transition(mode==='emission'?upper:lower,mode==='emission'?lower:upper);
  hTarget.innerHTML=hGraphic(lower,upper,mode,p,hRunning);q('al-hydrogen-spectrum').innerHTML=spectrum(possibleTransitions(6),[transition(upper,lower)],hRunning&&p>.5&&p<1?new Set([`${upper}-${lower}`]):new Set());
  const phase=!hRunning?'Velg nivåer. Trykk «Vis overgang».':mode==='absorption'?(p<.3?'Fotonet nærmer seg.':p<.72?'Fotonet absorberes: elektronet får energi.':'Elektronet er på det høyere nivået.'):(p<.48?'Elektronet går til lavere energi.':p<.98?`${regionText(tr)} sendes ut.`:'Atomet har avgitt fotonets energi.');say('al-h-phase',phase);
 },hTarget);
 api.onFrame(t=>{
  cTime=t;let from=0,to=0,p=0,type='none',phase='Fotonstrømmen er av. Flytt nivåene og velg målnivå.';
  if(stream){const paths=customCascadePaths(target);let path=paths[pathIndex%paths.length],duration=1.1+(path.length-1)*.7+.35,age=Math.max(0,clock('c')-cycleStart);
   while(age>=duration){cycleStart+=duration;pathIndex++;path=paths[pathIndex%paths.length];duration=1.1+(path.length-1)*.7+.35;age=Math.max(0,clock('c')-cycleStart);}
   if(age<1.1){from=0;to=target;p=clamp(age/1.0);type='absorption';phase=age<.35?'Et nytt foton kommer inn.':age<.75?`Atomet absorberer ${fmt(levels[target],3)} aJ.`:`Elektronet er eksitert til L${target+1}.`;}else{const step=Math.min(path.length-2,Math.floor((age-1.1)/.7));from=path[step];to=path[step+1];p=clamp((age-1.1-step*.7)/.7);type='emission';const key=`${from}-${to}`,photon=photonFromEnergyAJ(levels[from]-levels[to]);if(p>=.5&&lastStepKey!==`${pathIndex}:${step}`){lastStepKey=`${pathIndex}:${step}`;seen.add(key);lastFlash.set(key,clock('c'));}phase=`L${from+1} → L${to+1}: ${fmt(photon.energyAJ,3)} aJ · ${regionText(photon)}.`;}
  }
  cTarget.innerHTML=customGraphic(levels,target,from,to,p,type,stream,preset);const all=customTransitions(levels,target),glow=new Set([...lastFlash].filter(([,time])=>clock('c')-time<1.4).map(([key])=>key));q('al-custom-spectrum').innerHTML=spectrum(all,[],glow,seen);q('al-custom-spectrum').setAttribute('data-possible-count',String(all.length));q('al-custom-spectrum').setAttribute('data-seen-count',String(seen.size));q('al-custom-svg').setAttribute('data-stream',String(stream));say('al-custom-phase',phase);say('al-custom-lines',`<div>Mulige overganger under L${target+1}: <strong>${all.length}</strong></div><div>Vist i strømmen: <strong>${seen.size}</strong></div>`);
 },cTarget);
 syncH();syncCustom(true);repaint('h');repaint('c');const modalCleanup=mountElementSpectra(root,api);
 return()=>{stream=false;release();for(const dispose of disposers)dispose();if(typeof modalCleanup==='function')modalCleanup();};
}
