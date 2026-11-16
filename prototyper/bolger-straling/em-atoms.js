import {atomLabSection,mountAtomLab} from './atom-lab.js?v=20261116-bigbang1';
// Self-contained teaching models. Physical quantities use SI units internally.
const C = 299792458, H = 6.62607015e-34, AJ = 1e-18;
const fmt = (x, digits = 2) => x.toLocaleString('nb-NO', {maximumFractionDigits: digits});
const sci = x => {
  if (!x) return '0';
  const p = Math.floor(Math.log10(Math.abs(x)));
  return `${fmt(x / 10 ** p)} · 10<sup>${p}</sup>`;
};
const line = (points) => points.map((p,i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wavelengthColor = nm => {
  if (nm < 380 || nm > 780) return '#93a7bd';
  if (nm < 440) return '#9676ff';
  if (nm < 490) return '#4cafff';
  if (nm < 510) return '#38d3d1';
  if (nm < 580) return '#83c65c';
  if (nm < 645) return '#efa946';
  return '#ef6d6c';
};
export function spectrumReadouts(frequency,regionIndex){
  const f=Number(frequency),wavelength=C/f;
  const frequencyUnits=[[1e21,'ZHz'],[1e18,'EHz'],[1e15,'PHz'],[1e12,'THz'],[1e9,'GHz'],[1e6,'MHz'],[1e3,'kHz'],[1,'Hz']];
  const fu=frequencyUnits.find(([scale])=>f>=scale)||frequencyUnits.at(-1);
  const wavelengthUnits=[[1e3,'km'],[1,'m'],[1e-2,'cm'],[1e-3,'mm'],[1e-6,'µm'],[1e-9,'nm'],[1e-12,'pm'],[1e-15,'fm']];
  const wu=[2,3,4].includes(regionIndex)?[1e-9,'nm']:(wavelengthUnits.find(([scale])=>wavelength>=scale)||wavelengthUnits.at(-1));
  return {wavelength:`${fmt(wavelength/wu[0],3)} ${wu[1]} <span class="ema-scientific">(${sci(wavelength)} m)</span>`,frequency:`${fmt(f/fu[0],3)} ${fu[1]} <span class="ema-scientific">(${sci(f)} Hz)</span>`,energy:`${sci(H*f)} J`};
}
const sharedStyle = `<style>
.ema-spectrum-svg,.ema-atom-svg,.ema-com-svg{display:block;width:100%;height:auto;overflow:visible}
.ema-region-buttons{margin:7px 0!important;gap:5px!important}.ema-region-buttons button{font-size:11px!important;padding:5px 8px!important}
.ema-values{margin:7px 0!important;gap:6px!important}.ema-values>div{padding:7px 10px!important;border-radius:7px!important}.ema-values small{font-size:10px!important;margin-bottom:2px!important}.ema-values strong{font-size:14px!important}
.ema-spectrum-callout{padding:8px 11px!important;font-size:11px!important;line-height:1.55!important}
.ema-spectrum-model>p{font-size:11px;margin:0 0 6px}.ema-spectrum-model .controls{padding:6px 0;margin:6px 0}.ema-spectrum-model .ema-spectrum-svg{max-height:210px}
.ema-model-details{margin:7px 0 0!important;font-size:10px!important;color:var(--muted,#526a72)}.ema-model-details>p{margin:6px 0 0;font-size:11px;line-height:1.55}
.ema-atom-readout{font-size:11px!important;gap:8px 16px!important;margin:6px 0!important}.ema-atom-readout strong{font-size:13px}.ema-signal-result{padding:8px 11px!important;font-size:11px!important;line-height:1.55}.ema-signal-result code{font-size:13px!important;letter-spacing:2px!important}
.ema-rgb-layout{gap:14px!important}.ema-rgb-controls label{font-size:11px!important;margin:11px 0!important}.ema-rgb-controls>p{font-size:11px;margin:7px 0 0}.ema-rgb-screen{max-height:210px}.ema-process{margin:10px 0!important}.ema-process>div{padding:9px!important;font-size:11px!important}.ema-process strong{font-size:12px!important;margin-bottom:3px!important}
.ema-three-list{grid-template-columns:1fr!important;gap:7px!important}.ema-three-list .concept{display:grid;grid-template-columns:150px 1fr;gap:14px;align-items:baseline;padding:9px 13px!important}.ema-three-list .concept h3,.ema-three-list .concept p{margin:0!important}
@media(max-width:600px){.ema-three-list .concept{grid-template-columns:1fr;gap:3px}.ema-spectrum-model .ema-spectrum-svg{max-height:185px}}
.ema-dark{fill:#112e3c}.ema-svg-text{fill:var(--ink,#183b40);font:13px system-ui,sans-serif}.ema-muted-text{fill:var(--muted,#526a72);font:12px system-ui,sans-serif}.ema-light-text{fill:#d6e7e8;font:13px system-ui,sans-serif}
.ema-gridline{stroke:var(--line,#d8e3de);stroke-width:1}.ema-region-buttons{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.ema-region-buttons button{font-size:12px;padding:7px 11px;border:1px solid var(--line,#d8e3de);border-radius:8px;background:var(--surface,#fff);color:var(--ink,#183b40);cursor:pointer}.ema-region-buttons button[aria-pressed=true]{background:#1b6360;color:#fff;border-color:#1b6360}
.ema-values{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.ema-values>div{padding:12px;border:1px solid var(--line,#d8e3de);border-radius:10px}.ema-values small{display:block;font-size:11px;color:var(--muted,#526a72);margin-bottom:4px}.ema-values strong{font-size:17px;font-variant-numeric:tabular-nums}.ema-values sup{font-size:.7em}.ema-rgb-layout{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:center}.ema-rgb-controls label{display:grid;grid-template-columns:42px 1fr 34px;align-items:center;gap:10px;margin:16px 0;font-size:13px}.ema-rgb-controls input{width:100%;min-width:0}.ema-rgb-controls output{font-variant-numeric:tabular-nums;text-align:right}.ema-rgb-screen{width:100%;aspect-ratio:1.8;border-radius:12px;display:grid;place-items:center;border:1px solid #48636c;color:white;position:relative;overflow:hidden}.ema-rgb-screen>svg{position:absolute;inset:0;width:100%;height:100%}.ema-rgb-screen output{position:absolute;bottom:12px;font:12px ui-monospace,monospace;padding:4px 7px;border-radius:5px;background:#102b3a;color:white}.ema-message-input{font:inherit;width:110px;padding:8px;border:1px solid var(--line,#d8e3de);border-radius:7px;background:var(--surface,#fff);color:inherit}.ema-byte-options{max-width:260px}.ema-signal-result{padding:12px 16px;border-radius:9px;background:var(--sidebar,#f0f5f0);font-size:14px}.ema-signal-result code{font-size:15px;letter-spacing:3px}.ema-atom-readout{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:8px}.ema-photon-swatch{width:13px;height:13px;border-radius:50%;display:inline-block;margin-right:5px}.ema-spectrum-callout{padding:12px 15px;border-left:3px solid #4b9993;background:var(--sidebar,#eef4f1);font-size:14px;line-height:1.6}.ema-app-table td:first-child{white-space:nowrap}.ema-process{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:16px 0}.ema-process>div{padding:12px;background:var(--sidebar,#f0f5f0);border:1px solid var(--line,#d8e3de);border-radius:9px;font-size:12px}.ema-process strong{display:block;margin-bottom:5px;font-size:13px}.ema-spectrum-hint{font-size:12px;color:var(--muted,#526a72)}
@media(max-width:600px){.ema-rgb-layout{grid-template-columns:1fr}.ema-values{grid-template-columns:1fr}.ema-values>div{display:flex;align-items:center;justify-content:space-between;gap:10px}.ema-values small{margin:0}.ema-process{grid-template-columns:1fr 1fr}.ema-controls{gap:12px}.ema-atom-readout{font-size:13px}.ema-app-table td:first-child{white-space:normal}}

.ema-scientific{display:block;margin-top:3px;font-size:11px;font-weight:400;color:var(--muted)}
.ema-formula-box{padding:18px 20px!important}.ema-formula-grid{display:grid;grid-template-columns:.9fr 1.3fr;gap:26px}.ema-formula-box h3{font-size:16px!important;margin-bottom:10px!important}.ema-formula-box .calc-lines{font-size:17px}.ema-formula-box p{font-size:12px;line-height:1.65;margin:12px 0 0}.ema-formula-box .calc-rhs{white-space:normal}
.ema-rgb-screen{aspect-ratio:auto!important;height:auto!important;max-height:none!important;overflow:visible!important;background:#000}.ema-rgb-screen>svg{position:static!important;inset:auto!important;width:100%!important;height:auto!important;max-height:none!important;display:block;aspect-ratio:360/210}.ema-rgb-screen output{position:static!important;display:block;text-align:center;margin:0;padding:5px 8px;border-radius:0 0 10px 10px;font-size:11px}
.ema-flow-buttons{display:flex;gap:6px;flex-wrap:wrap}.ema-flow-readout{display:block;font-size:12px;line-height:1.6;padding:9px 12px;background:var(--sidebar);border-radius:8px}.ema-flow-readout strong{color:var(--green)}.ema-network-readout>div+div{margin-top:5px}.ema-network-svg,.ema-flow-svg{width:100%;height:auto;display:block}
@media(max-width:650px){.ema-formula-grid{grid-template-columns:1fr;gap:18px}.ema-formula-box .calc-lines{font-size:15px}.ema-formula-box{padding:14px!important}.ema-rgb-screen{max-width:400px;margin-inline:auto}}

.ema-wave-types{margin:0 0 14px;display:grid;gap:0}.ema-wave-types>div{display:grid;grid-template-columns:190px 1fr;gap:16px;padding:10px 0;border-bottom:1px solid var(--line)}.ema-wave-types dt{font-weight:650;color:var(--green);font-size:13px}.ema-wave-types dd{margin:0;font-size:12px;line-height:1.65}
.ema-spectrum-model{display:block!important}.ema-spectrum-band{width:100%;grid-column:1/-1}.ema-spectrum-band-svg{display:block;width:100%;height:auto!important;max-height:none!important}.ema-spectrum-lower{display:grid;grid-template-columns:minmax(0,2fr) minmax(230px,1fr);gap:24px;align-items:start}.ema-spectrum-wave-svg{display:block;width:100%;height:auto!important;max-height:100px!important}.ema-spectrum-figure{min-width:0}.ema-spectrum-controls{padding-top:6px}.ema-spectrum-controls .controls{margin:0 0 10px!important;border-top:0;padding-top:0!important}.ema-spectrum-controls .control{max-width:none!important;width:100%}.ema-spectrum-controls .ema-region-buttons{display:grid;grid-template-columns:1fr 1fr;gap:6px!important}.ema-spectrum-controls .ema-region-buttons button{margin:0;min-width:0}.ema-spectrum-figure .ema-values{grid-template-columns:1fr;margin:8px 0 0!important}.ema-spectrum-figure .ema-values>div{display:grid;grid-template-columns:125px minmax(0,1fr);gap:10px;align-items:baseline;padding:6px 10px!important}.ema-spectrum-figure .ema-values strong{font-size:14px!important}.ema-spectrum-figure .ema-scientific{display:inline;margin-left:6px;font-size:11px}
.ema-rgb-layout{display:grid!important;grid-template-columns:minmax(0,1.5fr) minmax(230px,.9fr)!important;max-width:900px!important;gap:20px!important;padding:12px 16px!important;align-items:center}.ema-rgb-layout .ema-rgb-screen{aspect-ratio:auto!important;max-height:none!important;height:auto!important;min-height:0}.ema-rgb-layout .ema-rgb-screen>svg{aspect-ratio:600/230!important;max-height:230px!important}.ema-rgb-layout .ema-rgb-screen output{font-size:10px;padding:3px 6px}.ema-rgb-layout .ema-rgb-controls label{margin:10px 0!important;gap:8px;font-size:11px!important;grid-template-columns:38px minmax(0,1fr) 28px}.ema-rgb-layout .ema-rgb-controls .ema-region-buttons{gap:5px!important}.ema-rgb-layout .ema-rgb-caption{font-size:11px}
@media(max-width:650px){.ema-wave-types>div{grid-template-columns:1fr;gap:4px}.ema-spectrum-lower{grid-template-columns:1fr;gap:12px}.ema-spectrum-controls .ema-region-buttons{grid-template-columns:repeat(3,minmax(0,1fr))}.ema-spectrum-band-svg text{font-size:16px!important}.ema-spectrum-figure .ema-values>div{grid-template-columns:100px 1fr}.ema-rgb-layout{grid-template-columns:1fr!important;gap:12px!important;max-width:550px!important}.ema-rgb-layout .ema-rgb-screen>svg{max-height:210px!important}}

/* This custom model spans the content column and owns its two-column lower layout. */
.topic-page .model.ema-spectrum-model{display:block!important;max-width:none!important;width:100%!important;margin:12px 0!important;padding:12px 16px!important}
.topic-page .ema-spectrum-model .ema-spectrum-band{display:block;width:100%;min-width:0;max-width:none}
.topic-page .ema-spectrum-model .ema-spectrum-band-svg{width:100%!important;height:auto!important;max-width:none!important;max-height:none!important;margin:0}
.topic-page .ema-spectrum-model .ema-spectrum-lower{display:grid!important;grid-template-columns:minmax(0,1fr) 220px!important;gap:20px!important;align-items:start}
.topic-page .ema-spectrum-model .ema-spectrum-figure{display:block!important;width:100%;min-width:0;max-width:none}
.topic-page .ema-spectrum-model .ema-spectrum-wave-svg{width:100%!important;height:auto!important;max-height:80px!important;margin:0}
.topic-page .ema-spectrum-model .ema-values{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;margin:6px 0 0!important;min-width:0}
.topic-page .ema-spectrum-model .ema-values>div{display:block!important;grid-template-columns:none!important;min-width:0!important;max-width:none!important;padding:7px 9px!important;text-align:left;overflow:visible}
.topic-page .ema-spectrum-model .ema-values small{display:block!important;width:auto!important;min-width:0;font-size:11px!important;line-height:1.3;margin:0 0 3px!important;word-break:normal!important;overflow-wrap:normal!important}
.topic-page .ema-spectrum-model .ema-values strong{display:block!important;width:auto!important;min-width:0;font-size:15px!important;font-weight:650;line-height:1.45;word-break:normal!important;overflow-wrap:normal!important;white-space:normal}
.topic-page .ema-spectrum-model .ema-values .ema-scientific{display:block!important;margin:1px 0 0!important;font-size:11px!important;font-weight:400;line-height:1.35;white-space:nowrap!important;word-break:normal!important;overflow-wrap:normal!important}
@media(max-width:650px){.topic-page .ema-spectrum-model .ema-spectrum-lower{grid-template-columns:1fr!important;gap:10px!important}.topic-page .ema-spectrum-model .ema-values{grid-template-columns:1fr!important}.topic-page .ema-spectrum-model .ema-values>div{padding:6px 9px!important}.topic-page .ema-spectrum-model .ema-values strong{font-size:14px!important}}
.ema-formula-box .ema-word-relation{font-size:13px;font-weight:650;line-height:1.5;margin:10px 0 5px}.ema-formula-box .ema-formula-grid>div>p:not(.ema-word-relation){font-size:11px;line-height:1.55;margin:8px 0}
</style>`;

const regions = [
  {name:'Radiobølger', f:1e7, min:4, max:9, color:'#729b90', use:'Radio, TV og lange kommunikasjonsforbindelser.', point:'Lang bølgelengde og lav energi per foton. Radiobølger kan sendes og mottas med antenner.'},
  {name:'Mikrobølger', f:2.45e9, min:9, max:11.48, color:'#88bdb3', use:'Wi-Fi, radar, mobilkommunikasjon og mikrobølgeovner.', point:'Mikrobølger er en del av radiobølgeområdet, men vises ofte som en egen gruppe i skoleoversikter.'},
  {name:'Infrarødt', f:3e13, min:11.48, max:14.585, color:'#d7aa72', use:'Varmekameraer og fjernkontroller. Kroppen og jorda sender hovedsakelig ut IR.', point:'Infrarød stråling kan overføre varme ved absorpsjon. Den er usynlig for øynene våre.'},
  {name:'Synlig lys', f:5.45e14, min:14.585, max:14.897, color:'#86b97d', use:'Syn, belysning og optisk kommunikasjon.', point:'Menneskeøyet oppfatter omtrent 380–780 nm. Grensene er gradvise og varierer noe fra person til person.'},
  {name:'Ultrafiolett', f:3e15, min:14.897, max:16.48, color:'#a193c6', use:'Solstråling, fluorescens og desinfeksjon med bestemte UV-kilder.', point:'UV kan skade hud og øyne. Den mest energirike delen av UV kan ionisere; DNA kan også skades uten ionisering.'},
  {name:'Røntgen', f:1e18, min:16.48, max:19.48, color:'#8299b7', use:'Medisinske bilder og kontroll av materialer.', point:'Røntgen er ioniserende. Ulik absorpsjon i vev gir kontraster i et røntgenbilde.'},
  {name:'Gamma', f:1e21, min:19.48, max:22, color:'#b4848e', use:'Strålebehandling og undersøkelser med radioaktive sporstoffer.', point:'Gammafotoner sendes blant annet ut fra eksiterte atomkjerner. Røntgen og gamma kan overlappe i energi; betegnelsene viser også til hvordan strålingen dannes.'}
];

function mountEM(root, api) {
  const q = s => root.querySelector(s);
  const freq = q('#ema-frequency');
  const graph = q('#ema-spectrum-plot');
  const buttonHost = q('#ema-region-buttons');
  const x=log=>20+(log-4)/18*960;
  const selectedRegion=log=>regions.findIndex((r,i)=>log>=r.min&&(log<r.max||i===regions.length-1));
  function renderSpectrum(){
    const log=Number(freq.value),f=10**log,ri=selectedRegion(log);
    let markup='<title>Det elektromagnetiske spekteret</title><desc>En logaritmisk frekvensakse. Markøren viser valgt strålingstype.</desc><defs><linearGradient id="ema-visible-gradient"><stop offset="0" stop-color="#f36464"/><stop offset=".2" stop-color="#efb55b"/><stop offset=".4" stop-color="#a8cd6c"/><stop offset=".6" stop-color="#55b4cb"/><stop offset=".8" stop-color="#657dce"/><stop offset="1" stop-color="#a87ace"/></linearGradient></defs>';
    markup+=regions.map((r,i)=>`<rect x="${x(r.min)}" y="50" width="${x(r.max)-x(r.min)}" height="22" fill="${i===3?'url(#ema-visible-gradient)':r.color}" opacity="${i===ri?1:.65}"/>`).join('');
    const labelXs=[125,350,485,592,650,775,916],labelYs=[31,31,31,13,31,31,31];
    markup+=regions.map((r,i)=>`<line x1="${x((r.min+r.max)/2)}" x2="${labelXs[i]}" y1="47" y2="${labelYs[i]+6}" stroke="${r.color}"/><text x="${labelXs[i]}" y="${labelYs[i]}" text-anchor="middle" class="ema-svg-text" style="font-size:14px">${r.name}</text>`).join('');
    markup+=[4,6,8,10,12,14,16,18,20,22].map(p=>`<line x1="${x(p)}" x2="${x(p)}" y1="72" y2="79" class="ema-gridline"/><text x="${x(p)}" y="97" text-anchor="middle" class="ema-muted-text" style="font-size:13px">10<tspan baseline-shift="super" font-size="9">${p}</tspan></text>`).join('');
    markup+=`<text x="500" y="120" text-anchor="middle" class="ema-muted-text">Frekvens i Hz · logaritmisk skala</text><path d="M${x(log)-6} 39l6 8 6-8Z" fill="var(--green,#236448)"/><line x1="${x(log)}" x2="${x(log)}" y1="50" y2="73" stroke="var(--ink,#20352e)" stroke-width="2"/>`;
    graph.innerHTML=markup;
    const outputs=spectrumReadouts(f,ri);
    q('#ema-wavelength-output').innerHTML=outputs.wavelength;q('#ema-frequency-output').innerHTML=outputs.frequency;q('#ema-energy-output').innerHTML=outputs.energy;
    buttonHost.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===ri)));
  }
  function renderWave(t){
    const log=Number(freq.value),nm=C/(10**log)*1e9,cycles=1.2+(log-4)*.46,color=wavelengthColor(nm);
    const points=Array.from({length:401},(_,i)=>[25+i*1.775,40-18*Math.sin((i/400*cycles-t*.7)*Math.PI*2)]);
    q('#ema-spectrum-wave').innerHTML=`<title>Bølge ved valgt frekvens</title><rect x="12" y="7" width="736" height="66" rx="10" class="ema-dark"/><path d="${line(points)}" fill="none" stroke="${nm>=380&&nm<=780?color:'#9dcec3'}" stroke-width="2.8"/>`;
  }
  freq.addEventListener('input',()=>{renderSpectrum();api.repaint(q('#ema-spectrum-wave'));});
  buttonHost.querySelectorAll('button').forEach((button,i)=>button.addEventListener('click',()=>{freq.value=Math.log10(regions[i].f);renderSpectrum();api.repaint(q('#ema-spectrum-wave'));}));
  renderSpectrum();api.onFrame(renderWave,q('#ema-spectrum-wave'));
  const rgb = ['red','green','blue'].map(s => q(`#ema-rgb-${s}`));
  function renderRGB(){
    const vals=rgb.map(el=>Number(el.value));
    rgb.forEach((el,i)=>q(`#${el.id}-value`).textContent=vals[i]);
    q('#ema-rgb-red-circle').setAttribute('fill',`rgb(${vals[0]},0,0)`);
    q('#ema-rgb-green-circle').setAttribute('fill',`rgb(0,${vals[1]},0)`);
    q('#ema-rgb-blue-circle').setAttribute('fill',`rgb(0,0,${vals[2]})`);
    q('#ema-rgb-result').setAttribute('fill',`rgb(${vals.join(',')})`);
    q('#ema-rgb-value').textContent=`RGB ${vals.join(' · ')}`;
    let name='En blandingsfarge';
    if(vals.every(v=>v===0))name='Svart: ingen lys fra pikselen';
    else if(vals.every(v=>v===255))name='Hvitt: alle tre lyskanalene på fullt';
    else if(vals[0]===255&&vals[1]===255&&vals[2]===0)name='Gult: rødt og grønt lys sammen';
    q('#ema-rgb-caption').textContent=name;
  }
  rgb.forEach(el=>el.addEventListener('input',renderRGB));
  root.querySelectorAll('[data-ema-rgb]').forEach(b=>b.addEventListener('click',()=>{b.dataset.emaRgb.split(',').forEach((v,i)=>rgb[i].value=v);renderRGB();}));
  renderRGB();
}

function mountAtom(root,api){
  const atomCleanup=mountAtomLab(root,api),ionCleanup=mountIonization(root,api);
  return ()=>{if(typeof atomCleanup==='function')atomCleanup();if(typeof ionCleanup==='function')ionCleanup();};
}

export function ionizationOutcome(energyAJ){
  const energy=Number(energyAJ),threshold=2.17896022224,energyJ=energy*AJ,kinetic=Math.max(0,energy-threshold);
  return {energy,threshold,energyAJ:energy,thresholdAJ:threshold,energyJ,ionizes:energy>=threshold,kinetic,kineticAJ:kinetic,kineticJ:kinetic*AJ,wavelength:C*H/energyJ*1e9};
}

function mountIonization(root,api){
  const q=s=>root.querySelector(s),energyControl=q('#ema-ion-energy');
  let currentTime=0,launchedAt=0,fired=false;
  const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render(t){
    currentTime=t;
    const result=ionizationOutcome(energyControl.value),progress=fired?(reducedMotion()?1:Math.min(1,Math.max(0,(t-launchedAt)/1.7))):0;
    const interacted=fired&&progress>=.38,ionized=interacted&&result.ionizes;
    const escapeProgress=ionized?Math.min(1,(progress-.38)/.62):0;
    const zeroKinetic=result.kinetic<.00001;
    const electronX=ionized?(zeroKinetic?491:510+180*escapeProgress):510;
    const electronY=ionized?(zeroKinetic?112:112-45*escapeProgress):112;
    const photonVisible=fired&&progress<.38;
    const photonX=350+160*Math.min(1,progress/.38);
    const photonPath=Array.from({length:31},(_,i)=>[photonX-26+i*.85,112+5*Math.sin(i*.62)]);
    let graphic=`<title>Kan ett foton ionisere hydrogen?</title><desc>Hydrogen i grunntilstanden trenger minst 2,18 attojoule for å frigjøre elektronet. ${fired?(result.ionizes?'Det valgte fotonet kan frigjøre elektronet, og resten av energien blir elektronets kinetiske energi.':'Det valgte fotonet har ikke nok energi til ionisering. Andre prosesser, som eksitasjon, vises ikke.'): 'Velg fotonenergi og send ett foton.'}</desc>`;
    graphic+=`<defs><marker id="ema-ion-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" fill="#e0a241"/></marker></defs><text x="165" y="22" text-anchor="middle" class="ema-svg-text">Før: nøytralt hydrogen</text><text x="575" y="22" text-anchor="middle" class="ema-svg-text">${ionized?'Etter: hydrogenion og fritt elektron':'Etter møtet med fotonet'}</text><rect x="22" y="35" width="285" height="166" rx="12" fill="var(--sidebar,#eff4ef)" stroke="var(--line,#d8e3de)"/><rect x="414" y="35" width="325" height="166" rx="12" fill="var(--sidebar,#eff4ef)" stroke="var(--line,#d8e3de)"/>`;
    graphic+=`<circle cx="165" cy="112" r="40" fill="none" stroke="#84a6a0" stroke-width="1.5" stroke-dasharray="4 4"/><circle cx="165" cy="112" r="13" fill="#d88e6d"/><text x="165" y="117" text-anchor="middle" fill="#fff" font-size="16">+</text><circle cx="205" cy="112" r="7" fill="#2b8d9f"/><text x="165" y="174" text-anchor="middle" class="ema-svg-text">H · elektronet er bundet</text><path d="M330 112h58" fill="none" stroke="#e0a241" stroke-width="2" marker-end="url(#ema-ion-arrow)"/>`;
    graphic+=`<circle cx="550" cy="112" r="40" fill="none" stroke="#84a6a0" stroke-width="1.5" stroke-dasharray="4 4" opacity="${ionized?.18:1}"/><circle cx="550" cy="112" r="13" fill="#d88e6d"/><text x="550" y="117" text-anchor="middle" fill="#fff" font-size="16">+</text>`;
    if(ionized&&!zeroKinetic)graphic+=`<path d="M510 112Q570 92 ${electronX.toFixed(1)} ${electronY.toFixed(1)}" fill="none" stroke="#2b8d9f" stroke-width="1.5" stroke-dasharray="4 4"/>`;
    graphic+=`<circle cx="${electronX.toFixed(1)}" cy="${electronY.toFixed(1)}" r="7" fill="#2b8d9f"/>`;
    if(photonVisible)graphic+=`<path d="${line(photonPath)}" fill="none" stroke="#e0a241" stroke-width="3"/>`;
    if(ionized)graphic+=`<text x="550" y="174" text-anchor="middle" class="ema-svg-text">H⁺</text><text x="704" y="53" text-anchor="end" class="ema-muted-text">${zeroKinetic?'Fritt e⁻ · Eₖ ≈ 0':'Fritt elektron e⁻'}</text>`;
    else graphic+=`<text x="575" y="174" text-anchor="middle" class="ema-svg-text">${interacted?'H · ingen ionisering':'H · elektronet er bundet'}</text>`;
    graphic+=`<text x="380" y="224" text-anchor="middle" class="ema-muted-text">Ioniseringsterskel for H i grunntilstanden: 2,18 aJ</text>`;
    q('#ema-ion-plot').innerHTML=graphic;
    q('#ema-ion-plot').setAttribute('data-state',ionized?'ionized':interacted?'bound':fired?'flight':'neutral');
    q('#ema-ion-energy-value').textContent=fmt(result.energy,2)+' aJ';
    const wavelength=`λ ≈ ${fmt(result.wavelength,1)} nm`;
    if(!fired)q('#ema-ion-readout').innerHTML=`<div><strong>Valgt foton: ${fmt(result.energy,2)} aJ</strong></div><div>${wavelength}.</div><div>Trykk «Send foton».</div>`;
    else if(result.ionizes)q('#ema-ion-readout').innerHTML=`<div><strong>Fotonet kan ionisere.</strong></div><div>${fmt(result.energy,2)} aJ ≥ 2,18 aJ.</div><div>Ved absorpsjon frigjøres elektronet.</div><div class="calc-lines"><div class="calc-row"><span class="calc-lhs">E<sub>k</sub></span><span class="calc-eq">=</span><span class="calc-rhs">E<sub>foton</sub> − E<sub>binding</sub></span></div><div class="calc-row"><span class="calc-lhs"></span><span class="calc-eq">=</span><span class="calc-rhs">${fmt(result.energy,2)} aJ − ${fmt(result.threshold,3)} aJ</span></div><div class="calc-row"><span class="calc-lhs"></span><span class="calc-eq">=</span><span class="calc-rhs"><strong>${fmt(result.kinetic,3)} aJ</strong></span></div></div><div>${wavelength}.</div>`;
    else q('#ema-ion-readout').innerHTML=`<div><strong>Ingen ionisering.</strong></div><div>${fmt(result.energy,2)} aJ &lt; 2,18 aJ.</div><div>Elektronet kan ikke frigjøres av dette ene fotonet.</div><div>${wavelength}.</div>`;
  }
  energyControl.addEventListener('input',()=>{fired=false;render(currentTime);});
  q('#ema-ion-send').addEventListener('click',()=>{fired=true;launchedAt=api.now?api.now(q('#ema-ion-plot')):currentTime;render(launchedAt);});
  q('#ema-ion-reset').addEventListener('click',()=>{fired=false;render(currentTime);});
  api.onFrame(render,q('#ema-ion-plot'));
}

function mountCommunication(root,api){
  const q=s=>root.querySelector(s), input=q('#ema-message'), byteChoice=q('#ema-byte'), mode=q('#ema-modulation');
  let bytes=new Uint8Array(),selected=0;
  function updateMessage(){
    bytes=new TextEncoder().encode(input.value);
    selected=Math.max(0,Math.min(selected,bytes.length-1));
    byteChoice.innerHTML=bytes.length?Array.from(bytes,(b,i)=>`<option value="${i}"${i===selected?' selected':''}>Byte ${i+1}: ${b} (${b>=32&&b<=126?escape(String.fromCharCode(b)):'UTF-8'})</option>`).join(''):'<option>Skriv en melding</option>';
    api.repaint();
  }
  function render(t){
    if(!bytes.length){
      q('#ema-signal-plot').innerHTML='<title>Ingen melding valgt</title><text x="380" y="150" text-anchor="middle" class="ema-svg-text">Skriv en melding for å se bitene og bærebølgen.</text>';
      q('#ema-received').textContent='Ingen data å sende ennå.';
      return;
    }
    const byte=bytes[selected], bits=byte.toString(2).padStart(8,'0').split('').map(Number);
    const active=Math.floor((t*.8)%8), fsk=mode.value==='fsk';
    let svg=`<title>Digital informasjon kodet i en radiobølge</title><desc>Den valgte byten ${byte} består av bitene ${bits.join(' ')}. ${fsk?'To forskjellige bærefrekvenser':'To forskjellige amplituder'} representerer null og en. Dette er en støyfri modell.</desc>`;
    const width=82,left=52;
    svg+=`<text x="12" y="24" class="ema-muted-text">Biter</text><text x="12" y="112" class="ema-muted-text">Bølge</text><text x="12" y="211" class="ema-muted-text">Lest</text>`;
    for(let b=0;b<8;b++){
      const xx=left+b*width;
      svg+=`<rect x="${xx}" y="7" width="${width-3}" height="42" rx="7" fill="${b===active?'#2c7973':'#e4eeea'}"/><text x="${xx+width/2}" y="35" text-anchor="middle" fill="${b===active?'#fff':'#245653'}" font-size="21" font-family="ui-monospace,monospace">${bits[b]}</text><line x1="${xx}" x2="${xx}" y1="57" y2="171" class="ema-gridline" stroke-dasharray="3 4"/>`;
      const cycles=fsk?(bits[b]?4:2):3,amplitude=fsk?30:(bits[b]?35:11);
      const pts=Array.from({length:101},(_,i)=>[xx+i/100*width,113-amplitude*Math.sin(i/100*cycles*Math.PI*2)]);
      svg+=`<path d="${line(pts)}" fill="none" stroke="${bits[b]?'#28877c':'#7399a7'}" stroke-width="2.3"/><rect x="${xx}" y="184" width="${width-3}" height="36" rx="7" fill="${b===active?'#2c7973':'#e4eeea'}"/><text x="${xx+width/2}" y="210" text-anchor="middle" fill="${b===active?'#fff':'#245653'}" font-size="21" font-family="ui-monospace,monospace">${bits[b]}</text>`;
    }
    svg+=`<line x1="${left}" x2="${left+8*width}" y1="113" y2="113" stroke="#92aaa9" opacity=".3"/><text x="380" y="244" text-anchor="middle" class="ema-muted-text">Tid → · hvert felt er ett like langt bitintervall</text>`;
    q('#ema-signal-plot').innerHTML=svg;
    q('#ema-received').innerHTML=`Sendt: <code>${bits.join('')}</code> · mottatt: <strong>${byte}</strong><br>${fsk?'FSK: 0 og 1 bruker hver sin frekvens. Amplituden er lik.':'ASK: 0 og 1 bruker hver sin amplitude. Bærefrekvensen er lik.'}`;
  }
  input.addEventListener('input',updateMessage);
  byteChoice.addEventListener('change',()=>{selected=Number(byteChoice.value);api.repaint();});
  mode.addEventListener('change',()=>api.repaint());
  updateMessage();api.onFrame(render,q('#ema-signal-plot'));
  mountCommunicationFlow(root,api);
  mountMobileNetwork(root,api);
}

function mountCommunicationFlow(root,api){
  const q=s=>root.querySelector(s),choice=q('#ema-flow-stage');
  const names=['Melding','Biter','Bærebølge','Antenne','Basestasjon','Mottaker'];
  const explanations=[
    'En melding begynner som tekst, lyd eller bilde i en enhet.',
    'Teksten kodes som biter. Den første byten er markert; ett tegn kan bruke flere byter i UTF-8.',
    'Senderen lar bitene styre en egenskap ved bærebølgen, for eksempel amplitude eller frekvens.',
    'Vekslende elektriske strømmer i antennen gir elektromagnetiske bølger som brer seg ut.',
    'Basestasjonen tar imot radiosignalet og kobler informasjonen videre gjennom mobilnettet.',
    'Mottakerens antenne registrerer et signal. Bitene dekodes, og meldingen kan vises eller spilles av.'
  ];
  function render(t){
    const message=q('#ema-message').value||'HEI',bytes=new TextEncoder().encode(message),bits=(bytes[0]??0).toString(2).padStart(8,'0');
    const selected=choice.value==='auto'?Math.floor(t*.65)%6:Number(choice.value),positions=[[108,75],[380,75],[650,75],[650,204],[380,204],[108,204]];
    let graphic='<title>Fra melding til radiobølge og tilbake til melding</title><desc>Seks ledd viser hvordan en digital melding kodes i en bærebølge, sendes med en antenne via en basestasjon og dekodes hos mottakeren.</desc><defs><marker id="ema-flow-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" fill="#7c9f95"/></marker></defs>';
    const connections=['M185 75H292','M466 75H562','M650 111V160','M563 204H468','M294 204H186'];
    graphic+=connections.map(d=>`<path d="${d}" fill="none" stroke="#9ab2a7" stroke-width="2" marker-end="url(#ema-flow-arrow)"/>`).join('');
    positions.forEach(([x,y],i)=>{
      graphic+=`<rect x="${x-82}" y="${y-38}" width="164" height="76" rx="10" fill="${selected===i?'var(--green-soft,#e7f3e9)':'var(--sidebar,#eff4ef)'}" stroke="${selected===i?'#377b63':'var(--line,#d8e3de)'}" stroke-width="${selected===i?2:1}"/><text x="${x}" y="${i<3?25:258}" text-anchor="middle" class="ema-svg-text">${i+1}. ${names[i]}</text>`;
      if(i===0||i===5)graphic+=`<rect x="${x-18}" y="${y-26}" width="36" height="52" rx="5" fill="var(--surface,#fff)" stroke="#4b877b" stroke-width="1.5"/><rect x="${x-13}" y="${y-19}" width="26" height="32" rx="2" fill="#d5ece2"/><text x="${x}" y="${y+2}" text-anchor="middle" fill="#275f4e" font-size="10">${escape(message.slice(0,3))}</text><circle cx="${x}" cy="${y+20}" r="2" fill="#4b877b"/>`;
      if(i===1)graphic+=`<text x="${x}" y="${y+5}" text-anchor="middle" fill="var(--ink,#20352e)" font-size="19" font-family="ui-monospace,monospace">${bits}</text>`;
      if(i===2){const pts=Array.from({length:101},(_,n)=>[x-65+n*1.3,y-18*Math.sin(n/100*6*Math.PI-t*3)]);graphic+=`<path d="${line(pts)}" fill="none" stroke="#287d89" stroke-width="2.3"/>`;}
      if(i===3)graphic+=`<path d="M${x} ${y-22}v44m-16 0 16-44 16 44m-25-15h18" fill="none" stroke="#448170" stroke-width="2"/><path d="M${x-24} ${y-20}q-13 15 0 30m48-30q13 15 0 30" fill="none" stroke="#489ead" stroke-width="2"/>`;
      if(i===4)graphic+=`<path d="M${x} ${y-23}v45m-18 0 18-45 18 45m-26-17h16" fill="none" stroke="#448170" stroke-width="2"/><path d="M${x-28} ${y-19}q-14 14 0 28m56-28q14 14 0 28" fill="none" stroke="#489ead" stroke-width="2"/><rect x="${x+30}" y="${y+7}" width="20" height="15" rx="2" fill="#8baaa0"/>`;
    });
    q('#ema-flow-plot').innerHTML=graphic;
    q('#ema-flow-readout').innerHTML=`<div><strong>${names[selected]}:</strong> ${explanations[selected]}</div>`;
  }
  choice.addEventListener('change',()=>api.repaint(q('#ema-flow-plot')));api.onFrame(render,q('#ema-flow-plot'));
}

function mountMobileNetwork(root,api){
  const q=s=>root.querySelector(s),direction=q('#ema-network-direction'),route=q('#ema-network-path');
  const pointAt=(points,progress)=>{const segments=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=segments.reduce((a,b)=>a+b,0);let remaining=progress*total;for(let i=0;i<segments.length;i++){if(remaining<=segments[i]||i===segments.length-1){const f=remaining/segments[i];return [points[i][0]+(points[i+1][0]-points[i][0])*f,points[i][1]+(points[i+1][1]-points[i][1])*f];}remaining-=segments[i];}return points.at(-1);};
  function render(t){
    const reflected=route.value==='reflection',reverse=direction.value==='b-a';
    const leftPath=reflected?[[65,142],[129,48],[240,99]]:[[65,142],[240,99]],rightPath=[[480,99],[696,142]];
    const routePoints=[...leftPath,[240,176],[480,176],...rightPath];if(reverse)routePoints.reverse();
    const packet=pointAt(routePoints,(t*.22)%1);
    let graphic='<title>To mobiler kommuniserer via basestasjoner og mobilnettet</title><desc>Radiosignaler går mellom mobil og basestasjon. Basestasjonene kobler informasjonen gjennom resten av nettet, her vist med en kabel. Den venstre radioforbindelsen kan velges direkte eller reflektert.</desc>';
    graphic+=`<rect x="12" y="32" width="352" height="175" rx="18" fill="var(--sidebar,#eff4ef)"/><rect x="396" y="32" width="352" height="175" rx="18" fill="var(--sidebar,#eff4ef)"/><text x="65" y="23" text-anchor="middle" class="ema-svg-text">Mobil A</text><text x="696" y="23" text-anchor="middle" class="ema-svg-text">Mobil B</text>`;
    for(const x of [240,480]){
      for(let n=0;n<3;n++){const r=24+((t*23+n*35)%105);graphic+=`<path d="M${x-r} 98a${r} ${r} 0 0 1 ${r*2} 0" fill="none" stroke="#76a8a8" stroke-width="1.5" opacity="${.35*(1-r/160)}"/>`;}
      graphic+=`<path d="M${x} 89v86m-28 0 28-76 28 76m-43-27h30m-37 15h45" fill="none" stroke="#4d8874" stroke-width="2"/><circle cx="${x}" cy="93" r="4" fill="#3e927f"/><text x="${x}" y="225" text-anchor="middle" class="ema-muted-text">Basestasjon</text>`;
    }
    for(const x of [65,696])graphic+=`<rect x="${x-15}" y="116" width="30" height="55" rx="5" fill="var(--surface,#fff)" stroke="#4d8874" stroke-width="2"/><rect x="${x-10}" y="124" width="20" height="31" rx="2" fill="#c9e5df"/><circle cx="${x}" cy="163" r="2" fill="#4d8874"/>`;
    graphic+=`<path d="${line(leftPath)}" fill="none" stroke="#318b9a" stroke-width="2" stroke-dasharray="5 5"/><path d="${line(rightPath)}" fill="none" stroke="#318b9a" stroke-width="2" stroke-dasharray="5 5"/><path d="M240 176H480" stroke="#7d9388" stroke-width="5"/><text x="360" y="199" text-anchor="middle" class="ema-muted-text">Videre gjennom nettet</text>`;
    if(reflected)graphic+=`<path d="M109 39l40 18" stroke="#ad956f" stroke-width="7"/><text x="160" y="46" class="ema-muted-text">Refleksjon</text>`;
    graphic+=`<circle cx="${packet[0].toFixed(1)}" cy="${packet[1].toFixed(1)}" r="6" fill="#e0a442" stroke="var(--surface,#fff)" stroke-width="2"/><text x="380" y="252" text-anchor="middle" class="ema-muted-text">${reverse?'Mobil B → nettet → mobil A':'Mobil A → nettet → mobil B'}</text>`;
    q('#ema-network-plot').innerHTML=graphic;
    q('#ema-network-readout').innerHTML=`<div><strong>${reverse?'B sender, A mottar.':'A sender, B mottar.'}</strong> Begge mobiler bruker radioforbindelsen til en basestasjon. Nettet kobler meldingen videre.</div><div>${reflected?'En reflektert vei kan gi signal selv uten direkte sikt. Flere samtidige veier kan også gi interferens.':'Den direkte radioforbindelsen vises med blå stiplet linje. Velg en reflektert vei for å se en annen mulig signalvei.'}</div>`;
  }
  [direction,route].forEach(e=>e.addEventListener('change',()=>api.repaint(q('#ema-network-plot'))));api.onFrame(render,q('#ema-network-plot'));
}

export const topics = [
  {
    id:'em', title:'Det elektromagnetiske spekteret', kicker:'Fra radio til gamma',
    summary:'Én familie av stråling, mange bølgelengder. Finn sammenhengen mellom frekvens, farge og energi per foton.',
    sections:[
      {title:'Mekaniske og elektromagnetiske bølger',body:sharedStyle+`<dl class="ema-wave-types"><div><dt>Mekaniske bølger</dt><dd>Trenger et stoff å bre seg i. Lydbølger er svingninger i luft, vann eller faste stoffer. Bølger på en streng og vannoverflate er også mekaniske.</dd></div><div><dt>Elektromagnetiske bølger</dt><dd>Er svingninger i elektriske og magnetiske felt. De kan bre seg i vakuum, og alle går med lysfarten c ≈ 3,00 · 10<sup>8</sup> m/s i vakuum.</dd></div></dl><p>EM-stråling kan også beskrives som energipakker, <strong>fotoner</strong>. Kortere bølgelengde gir høyere frekvens og større energi per foton.</p><div class="key ema-formula-box"><div class="ema-formula-grid"><div><h3>Sammenhenger</h3><p class="ema-word-relation">Bølgefart = frekvens · bølgelengde</p><div class="calc-lines"><div class="calc-row"><span class="calc-lhs">v</span><span class="calc-eq">=</span><span class="calc-rhs">f · λ</span></div></div><p>For lys i vakuum er bølgefarten v = c. Da får vi:</p><div class="calc-lines"><div class="calc-row"><span class="calc-lhs">c</span><span class="calc-eq">=</span><span class="calc-rhs">f · λ</span></div><div class="calc-row"><span class="calc-lhs">f</span><span class="calc-eq">=</span><span class="calc-rhs"><span class="frac"><span class="num">c</span><span class="den">λ</span></span></span></div></div><p class="ema-word-relation">Energi per foton = Plancks konstant · frekvens</p><div class="calc-lines"><div class="calc-row"><span class="calc-lhs">E</span><span class="calc-eq">=</span><span class="calc-rhs">h · f</span></div></div><p>c er lysfarten, f er frekvens, λ er bølgelengde og h er Plancks konstant. E er energien i <strong>ett foton</strong>.</p></div><div><h3>Eksempel: grønt lys, λ = 500 nm</h3><div class="calc-lines"><div class="calc-row"><span class="calc-lhs">f</span><span class="calc-eq">=</span><span class="calc-rhs"><span class="frac"><span class="num">3,00 · 10<sup>8</sup> m/s</span><span class="den">500 · 10<sup>−9</sup> m</span></span></span></div><div class="calc-row"><span class="calc-lhs"></span><span class="calc-eq">=</span><span class="calc-rhs">6,00 · 10<sup>14</sup> Hz</span></div><div class="calc-row"><span class="calc-lhs">E</span><span class="calc-eq">=</span><span class="calc-rhs">h · f</span></div><div class="calc-row"><span class="calc-lhs"></span><span class="calc-eq">=</span><span class="calc-rhs">6,63 · 10<sup>−34</sup> J s · 6,00 · 10<sup>14</sup> Hz</span></div><div class="calc-row"><span class="calc-lhs"></span><span class="calc-eq">=</span><span class="calc-rhs"><strong>3,98 · 10<sup>−19</sup> J</strong></span></div></div></div></div><p>Mer lysintensitet kan bety flere fotoner per sekund. Det trenger ikke bety mer energi i hvert foton.</p></div>`},
      {title:'Utforsk spekteret',body:`<div class="model ema-spectrum-model" data-model-layout="custom"><div class="model-full-width ema-spectrum-band" data-model-full-width><svg id="ema-spectrum-plot" class="ema-spectrum-band-svg" viewBox="0 0 1000 125" role="img" aria-label="Hele det elektromagnetiske spekteret"></svg></div><div class="ema-spectrum-lower"><div class="ema-spectrum-figure model-visual"><svg id="ema-spectrum-wave" class="ema-spectrum-wave-svg" viewBox="0 0 760 80" role="img" aria-label="Bølge ved valgt frekvens"></svg><div class="ema-values" aria-live="polite"><div><small>Bølgelengde λ</small><strong id="ema-wavelength-output"></strong></div><div><small>Frekvens f</small><strong id="ema-frequency-output"></strong></div><div><small>Energi per foton</small><strong id="ema-energy-output"></strong></div></div></div><div class="ema-spectrum-controls"><div class="controls"><label class="control" for="ema-frequency">Frekvens · logaritmisk skala<input id="ema-frequency" type="range" min="4" max="22" step="0.005" value="14.7364"></label></div><div class="ema-region-buttons" id="ema-region-buttons">${regions.map((r,i)=>`<button type="button" data-region="${i}" aria-pressed="${i===3}">${r.name}</button>`).join('')}</div></div></div></div>`},
      {title:'Hvordan lager en skjerm hvitt og gult?',body:`<p>En skjerm blander <strong>rødt, grønt og blått lys</strong> (RGB). Hvitfarge kan lages med en passende blanding av disse tre; det er ikke nødvendig å ha alle bølgelengder i blandingen.</p><div class="model ema-rgb-layout" data-model-layout="custom"><div class="ema-rgb-screen"><svg viewBox="0 0 600 230" role="img" aria-label="Additiv blanding av rødt, grønt og blått lys"><rect width="600" height="230" rx="10" fill="#000"/><g style="isolation:isolate"><circle id="ema-rgb-red-circle" cx="160" cy="85" r="70" style="mix-blend-mode:screen"/><circle id="ema-rgb-green-circle" cx="240" cy="85" r="70" style="mix-blend-mode:screen"/><circle id="ema-rgb-blue-circle" cx="200" cy="135" r="70" style="mix-blend-mode:screen"/></g><path d="M380 35v155" stroke="#48636c"/><rect id="ema-rgb-result" x="440" y="55" width="100" height="100" rx="10"/><text x="490" y="185" text-anchor="middle" fill="#ddd" font-size="15">Blandingsfargen</text></svg><output id="ema-rgb-value"></output></div><div class="ema-rgb-controls">${[['red','Rødt',255],['green','Grønt',255],['blue','Blått',0]].map(([id,label,val])=>`<label for="ema-rgb-${id}">${label}<input type="range" id="ema-rgb-${id}" min="0" max="255" step="1" value="${val}"><output id="ema-rgb-${id}-value" for="ema-rgb-${id}">${val}</output></label>`).join('')}<div class="ema-region-buttons"><button type="button" data-ema-rgb="255,255,255">Hvitt</button><button type="button" data-ema-rgb="255,255,0">Gult</button><button type="button" data-ema-rgb="0,0,0">Svart</button></div><p id="ema-rgb-caption" aria-live="polite"></p></div></div><div class="key"><strong>Lysblanding og overflatefarger er forskjellige:</strong> En rød flate reflekterer særlig rødt lys og absorberer mye av det øvrige. Uten rødt i belysningen kan flaten se mørk ut.</div>`}

    ],
    terms:[
      {term:'Elektromagnetisk stråling',definition:'Energi som overføres med svingende elektriske og magnetiske felt; kan bre seg i vakuum.'},
      {term:'Foton',definition:'En energipakke i elektromagnetisk stråling. E = hf.'},
      {term:'Synlig spekter',definition:'Den lille delen av EM-spekteret øynene våre oppfatter, omtrent 380–780 nm.'},
      {term:'Infrarød stråling',definition:'EM-stråling med lengre bølgelengde enn synlig rødt lys. Varme gjenstander som kroppen sender hovedsakelig ut IR.'},
      {term:'Ioniserende stråling',definition:'Stråling som har nok energi til å frigjøre elektroner fra atomer eller molekyler.'},
      {term:'RGB',definition:'Additiv lysblanding med rødt, grønt og blått, blant annet i skjermer.'},
      {term:'Intensitet',definition:'Energi som passerer per tid og areal. Høyere intensitet er ikke det samme som høyere energi per foton.'},
      {term:'Attojoule (aJ)',definition:'En liten energienhet: 1 aJ = 10⁻¹⁸ J. Den er nyttig for energier i atomer og i enkeltfotoner.'}
    ],
    questions:[
      {id:'em-01',type:'mcq',level:'Start',prompt:'Hvilken type stråling har størst energi per foton?',choices:['Radiobølger','Infrarødt','Synlig rødt lys','Gammastråling'],correct:3,answer:'Gammastråling har vanligvis høyest frekvens av disse. <strong>E = hf</strong> gir størst energi per foton.'},
      {id:'em-02',type:'open',level:'Start',prompt:'Sorter fra lengst til kortest bølgelengde: gamma, synlig lys, radio, UV, mikrobølger, røntgen, infrarødt.',answer:'<strong>Radio → mikrobølger → infrarødt → synlig lys → UV → røntgen → gamma.</strong> Mikrobølger er en del av radiobølgeområdet, men skilles ofte ut i denne oversikten.'},
      {id:'em-03',type:'number',level:'Bruk',prompt:'En radiobølge har frekvens 100 MHz. Finn bølgelengden i vakuum. Bruk c = 3,00 · 10⁸ m/s.',value:3,tolerance:.03,unit:'m',hint:'100 MHz = 100 · 10⁶ Hz. Bruk λ = c/f.',answer:'λ = c/f = (3,00 · 10<sup>8</sup>)/(100 · 10<sup>6</sup>) m = <strong>3,00 m</strong>.'},
      {id:'em-04',type:'number',level:'Bruk',prompt:'Grønt lys har bølgelengde 500 nm. Finn frekvensen i enheten 10¹⁴ Hz. Bruk c = 3,00 · 10⁸ m/s.',value:6,tolerance:.06,unit:'· 10¹⁴ Hz',hint:'500 nm = 5,00 · 10⁻⁷ m. Bruk f = c/λ.',answer:'f = c/λ = (3,00 · 10<sup>8</sup>)/(5,00 · 10<sup>−7</sup>) Hz = <strong>6,00 · 10<sup>14</sup> Hz</strong>.'},
      {id:'em-05',type:'mcq',level:'Start',prompt:'Hvilket utsagn stemmer om stråling i vakuum?',choices:['Gamma går raskere enn radiobølger','Synlig lys går raskest','Alle EM-bølger går like raskt','Kortere bølger går alltid saktere'],correct:2,answer:'Alle EM-bølger går med lysfarten <strong>c</strong> i vakuum, selv om frekvens og bølgelengde er forskjellige.'},
      {id:'em-06',type:'open',level:'Bruk',prompt:'En skjerm viser gult. Hvilke to RGB-lyskilder er da aktive? Hva skjer når du skrur av alle tre?',answer:'<strong>Rødt og grønt lys</strong> kan gi gult. Når alle tre er av, sender pikselen ikke ut lys og framstår svart.'},
      {id:'em-07',type:'mcq',level:'Bruk',prompt:'En lampe gir dobbelt så høy intensitet, men beholder samme farge. Hva kan ha skjedd?',choices:['Hvert foton har nødvendigvis fått dobbelt energi','Det sendes ut flere fotoner per sekund','Lyset har fått dobbelt fart','Bølgelengden må være halvert'],correct:1,answer:'Ved samme farge/frekvens har hvert foton samme energi. Høyere intensitet kan skyldes <strong>flere fotoner per sekund</strong>.'},
      {id:'em-08',type:'open',level:'Bruk',prompt:'Hvorfor kan et varmekamera vise en person i et helt mørkt rom?',answer:'Kroppen sender ut <strong>varmestråling, hovedsakelig infrarødt</strong>, selv når det ikke er synlig lys i rommet. Varmekameraet registrerer denne strålingen.'},
      {id:'em-09',type:'mcq',level:'Bruk',prompt:'Hvilket utsagn om mikrobølger er riktig?',choices:['De er mekaniske bølger','De går bare gjennom luft','De er en del av radiobølgeområdet','Alle mikrobølgefotoner er ioniserende'],correct:2,answer:'Mikrobølger er kortbølgede <strong>radiobølger</strong>. De er elektromagnetiske og kan også bre seg i vakuum.'},
      {id:'em-10',type:'open',level:'Utfordring',prompt:'«Mobilen bruker mikrobølger, så den er som en mikrobølgeovn.» Vurder hva som er riktig og hva sammenlikningen mangler.',answer:'Begge bruker EM-stråling i radio-/mikrobølgeområdet. Men man må også sammenlikne <strong>effekt, intensitet, absorpsjon og eksponering</strong>. En mikrobølgeovn tilfører stor effekt i et skjermet rom for å varme mat. At frekvensområdene overlapper, sier ikke alene hvilken påvirkning en mobil gir.'},
      {id:'em-11',type:'open',level:'Bruk',prompt:'Hvorfor kan en rød genser se mørk ut i rent blått lys?',answer:'Genseren reflekterer særlig rødt lys, men det er lite eller intet rødt lys å reflektere. Det blå lyset absorberes i stor grad, og genseren kan derfor se mørk ut.'},
      {id:'em-12',type:'mcq',level:'Start',prompt:'Blått og rødt lys sammenliknes. Hvilket utsagn er riktig?',choices:['Et rødt foton har mer energi','Et blått foton har mer energi','Alle synlige fotoner har samme energi','Rødt lys går raskere i vakuum'],correct:1,answer:'Blått lys har kortere bølgelengde og høyere frekvens. Derfor har et <strong>blått foton</strong> mer energi enn et rødt.'}
    ],
    resources:[
      {label:'NASA: Det elektromagnetiske spekteret',url:'https://science.nasa.gov/ems/01_intro/'},
      {label:'PhET: Fargesyn',url:'https://phet.colorado.edu/nb/simulations/color-vision'}
    ],mount:mountEM
  },
  {
    id:'atomer',title:'Stråling fra atomet',kicker:'Energinivåer og fingeravtrykk',
    summary:'Atomer tar opp og sender ut bestemte fotoner. Det gjør lyset til en nøkkel til stoffenes innhold.',
    sections:[
      {title:'Elektroner kan ikke ha hvilken som helst energi',body:sharedStyle+`<div class="concept-grid ema-three-list"><article class="concept"><h3>Eksitasjon og absorpsjon</h3><p>Et atom <strong>eksiteres</strong> når et elektron får større energi. Et foton kan absorberes dersom energien passer med en tillatt energiforskjell.</p></article><article class="concept"><h3>Emisjon</h3><p>Når elektronet går til et lavere energinivå, kan atomet sende ut et foton. Fotonet tar med seg forskjellen: <strong>ΔE = hf</strong>.</p></article><article class="concept"><h3>Ionisering</h3><p>Tilføres nok energi, kan elektronet frigjøres helt. Atomet blir et positivt ion. Dette er noe annet enn et sprang mellom bundne nivåer.</p></article></div><div class="key">Et <strong>stort energisprang</strong> gir et foton med høy frekvens og kort bølgelengde. Atomets kjerne endres ikke i en vanlig elektronovergang.</div>`},
      atomLabSection,
      {title:'Spektrallinjer er stoffenes fingeravtrykk',body:`<div class="concept-grid"><article class="concept"><h3>Emisjonsspekter</h3><p>En tynn, varm gass gir lyse linjer ved bestemte bølgelengder. Grunnstoffets energinivåer bestemmer mønsteret.</p></article><article class="concept"><h3>Absorpsjonsspekter</h3><p>Når et bredt lysspekter passerer en kjøligere gass, svekkes bestemte bølgelengder. De mørke linjene svarer til de samme energiforskjellene.</p></article></div><p>Ved å sammenlikne linjemønstre kan vi finne hvilke grunnstoffer en lyskilde eller en gass inneholder. Mer om stjernespektre finner du under <strong>Stjerner og universet</strong>.</p>`},
      {title:'Nordlyset forteller hva atmosfæren inneholder',body:`<p>Energirike partikler fra verdensrommet ledes av jordas magnetfelt og kolliderer med partikler i atmosfæren. Oksygen og nitrogen eksiteres. Når de mister energi igjen, sendes lys ut ved karakteristiske bølgelengder.</p><div class="key"><strong>Grønt og rødt nordlys</strong> kommer ofte fra oksygen; nitrogen bidrar blant annet med blålige og rødfiolette toner. Høyde og kollisjoner påvirker hvilke overganger vi ser.</div>`},
      {title:'Kan ett foton ionisere hydrogen?',body:`<p>Et hydrogenatom i <strong>grunntilstanden</strong> trenger minst <strong>2,18 aJ</strong> for å frigjøre elektronet. Hvis et foton absorberes med større energi, blir overskuddet kinetisk energi hos elektronet.</p><div class="model ema-ion-model"><div class="controls"><label class="control" for="ema-ion-energy">Fotonenergi <output id="ema-ion-energy-value" for="ema-ion-energy">3,00 aJ</output><input id="ema-ion-energy" type="range" min="0.3" max="4.8" step="0.01" value="3"></label><button id="ema-ion-send" type="button">Send foton</button><button id="ema-ion-reset" type="button">Nullstill</button></div><svg id="ema-ion-plot" class="ema-atom-svg" viewBox="0 0 760 232" role="img" aria-label="Ett foton møter hydrogen; elektronet er bundet eller frigjøres"></svg><div id="ema-ion-readout" class="ema-signal-result" aria-live="polite"></div><p class="model-note">Under 2,18 aJ kan et foton likevel gi <strong>eksitasjon</strong> dersom energien passer til et tillatt energisprang.</p><details class="ema-model-details"><summary>Om den skjematiske atommodellen</summary><p>Prikkene og sirklene viser bundet eller fri tilstand, ikke klassiske elektronbaner. Ved terskelen er elektronet frigjort med tilnærmet null kinetisk energi; det tegnes like utenfor for å skille tilstandene. Ikke alle fotoner absorberes i et virkelig møte. Terskelen gjelder hydrogen i grunntilstanden, og andre stoffer eller eksiterte atomer kan ha andre grenser.</p></details></div>`}
    ],
    terms:[
      {term:'Energinivå',definition:'En tillatt energi for et elektron i et atom. Energiene er kvantiserte.'},
      {term:'Grunntilstand',definition:'Atomets tilstand med lavest energi.'},
      {term:'Eksitasjon',definition:'Atomet får større energi; et elektron går til et høyere bundet energinivå.'},
      {term:'Absorpsjon',definition:'Stråling tas opp og overfører energi til stoff. I atomer må fotonenergien passe en tillatt overgang.'},
      {term:'Emisjon',definition:'Utsending av stråling; for eksempel et foton når et elektron går til et lavere energinivå.'},
      {term:'Linjespekter',definition:'Lys ved bestemte bølgelengder, bestemt av energiforskjellene i atomene.'},
      {term:'Ionisering',definition:'Et elektron frigjøres fra et atom eller molekyl.'},
      {term:'Balmerlinjer',definition:'Hydrogenets overganger mellom nivå 2 og høyere nivåer. De fire viste linjene ligger i den synlige delen av spekteret.'}
    ],
    questions:[
      {id:'atom-01',type:'mcq',level:'Start',prompt:'Hva skjer når et atom eksiteres?',choices:['En elektronovergang øker atomets energi','Atomkjernen mister alltid et proton','Atomet blir nødvendigvis et annet grunnstoff','Et elektron får alltid null energi'],correct:0,answer:'Ved eksitasjon får atomet mer energi; et elektron kan gå til et <strong>høyere bundet energinivå</strong>. Kjernens protontall endres ikke.'},
      {id:'atom-02',type:'open',level:'Start',prompt:'Forklar forskjellen på eksitasjon og ionisering.',answer:'Ved <strong>eksitasjon</strong> blir elektronet i atomet, men får større energi. Ved <strong>ionisering</strong> frigjøres et elektron helt, slik at atomet får elektrisk ladning.'},
      {id:'atom-03',type:'mcq',level:'Start',prompt:'Et elektron går fra et høyere til et lavere energinivå og sender ut lys. Hva bestemmer fotonets energi?',choices:['Atomets fart gjennom rommet','Forskjellen mellom energinivåene','Hvor mange atomer det finnes i gassen','Hvor sterkt øyet oppfatter fargen'],correct:1,answer:'Fotonet får energiforskjellen <strong>ΔE</strong> mellom nivåene: <strong>ΔE = hf</strong>.'},
      {id:'atom-04',type:'open',level:'Bruk',prompt:'Hydrogen sender ut rødt lys ved omtrent 656 nm og blågrønt lys ved omtrent 486 nm. Hvilken overgang gir størst energiforskjell? Begrunn.',answer:'<strong>486 nm</strong> har kortest bølgelengde, dermed høyest frekvens og størst fotonenergi. Den blågrønne overgangen har derfor størst energiforskjell.'},
      {id:'atom-05',type:'number',level:'Bruk',prompt:'Et atom går fra −0,24 aJ til −0,54 aJ. Hvor stor energi får fotonet som sendes ut?',value:.30,tolerance:.005,unit:'aJ',hint:'Fotonet får forskjellen mellom atomets energi før og etter.',answer:'ΔE = −0,24 aJ − (−0,54 aJ) = <strong>0,30 aJ</strong>. Atomet mister energi, mens fotonet får positiv energi.'},
      {id:'atom-06',type:'open',level:'Bruk',prompt:'Hvorfor finner vi mørke absorpsjonslinjer ved de samme bølgelengdene som lyse emisjonslinjer fra et grunnstoff?',answer:'De tillatte energiforskjellene er de samme begge veier. Atomet kan <strong>absorbere</strong> fotonet ved overgangen opp og <strong>sende ut</strong> et foton med samme energi ved overgangen ned.'},
      {id:'atom-07',type:'mcq',level:'Bruk',prompt:'En ukjent gass gir linjer ved 410, 434, 486 og 656 nm. Hvilket kjent mønster passer? A: hydrogen 410, 434, 486, 656 nm. B: natrium 589,0 og 589,6 nm.',choices:['Hydrogen','Natrium','Begge må være til stede','Ingen av dem'],correct:0,answer:'Alle fire linjene passer <strong>hydrogenets</strong> synlige linjemønster. I en virkelig måling må også måleusikkerhet og mulige ekstra linjer vurderes.'},
      {id:'atom-08',type:'open',level:'Bruk',prompt:'Forklar nordlys ved å bruke ordene kollisjon, eksitasjon og foton.',answer:'Energirike partikler <strong>kolliderer</strong> med partikler i atmosfæren og gir dem energi. De <strong>eksiteres</strong>. Når energien frigjøres igjen, sendes det ut <strong>fotoner</strong> med bestemte bølgelengder.'},
      {id:'atom-09',type:'mcq',level:'Start',prompt:'Hvilken endring lager vanligvis et linjespekter i synlig lys fra et atom?',choices:['Elektroner skifter energinivå','Et proton blir et nøytron ved hver linje','Atomet mister hele kjernen','Hvert atom sender ut alle bølgelengder'],correct:0,answer:'Synlige atomlinjer kommer fra <strong>elektronoverganger</strong>. Radioaktive kjerneoverganger er et annet fenomen.'},
      {id:'atom-10',type:'open',level:'Utfordring',prompt:'En samling atomer har fire energinivåer, nummerert 1–4. Hvor mange ulike overganger nedover mellom disse nivåene er mulige? Betyr det at ett elektron nødvendigvis sender ut så mange fotoner?',answer:'Mulighetene er 4→3, 4→2, 4→1, 3→2, 3→1 og 2→1: <strong>seks</strong>. Ett elektron følger én bestemt vei nedover og sender ikke nødvendigvis ut alle disse fotontypene. Antallet beskriver mulige overganger i samlingen.'},
      {id:'atom-11',type:'open',level:'Bruk',prompt:'Hvorfor kan vi finne grunnstoffene i en stjerne uten å reise dit og hente en prøve?',answer:'Lyset bærer med seg <strong>spektrallinjer</strong>. Vi sammenlikner mønsteret med målte fingeravtrykk fra kjente grunnstoffer på jorda. Det gjør det mulig å identifisere stoffene i stjernens ytre lag.'},
      {id:'atom-12',type:'number',level:'Utfordring',prompt:'Et foton har frekvens 5,0 · 10¹⁴ Hz. Bruk h = 6,63 · 10⁻³⁴ J s. Oppgi energien i enheten 10⁻¹⁹ J.',value:3.315,tolerance:.05,unit:'· 10⁻¹⁹ J',hint:'E = hf.',answer:'E = hf = 6,63 · 10<sup>−34</sup> · 5,0 · 10<sup>14</sup> J = <strong>3,315 · 10<sup>−19</sup> J ≈ 3,3 · 10<sup>−19</sup> J</strong>.'}
    ],
    resources:[
      {label:'PhET: Modeller av hydrogenatomet',url:'https://phet.colorado.edu/nb/simulations/models-of-the-hydrogen-atom'},
      {label:'NASA: Slik virker emisjons- og absorpsjonsspektre',url:'https://science.nasa.gov/mission/webb/science-overview/science-explainers/spectroscopy-101-how-absorption-and-emission-spectra-work/'}
    ],mount:mountAtom
  },
  {
    id:'kommunikasjon',title:'Trådløs kommunikasjon',kicker:'Fra melding til radiobølge',
    summary:'Informasjon kodes i elektromagnetiske bølger. Følg en byte gjennom sender, bærebølge og mottaker.',
    sections:[
      {title:'Fra melding til mottaker',body:sharedStyle+`<p>En antenne sender ut elektromagnetiske bølger. Ved å endre bølgen på en kontrollert måte kan vi overføre lyd, bilder og data. Denne endringen kalles <strong>modulasjon</strong>.</p><div class="model ema-flow-model"><div class="controls"><label class="control" for="ema-flow-stage">Følg informasjonsveien<select id="ema-flow-stage"><option value="auto">Hele signalveien</option><option value="0">1. Melding</option><option value="1">2. Biter</option><option value="2">3. Bærebølge</option><option value="3">4. Antenne</option><option value="4">5. Basestasjon</option><option value="5">6. Mottaker</option></select></label></div><svg id="ema-flow-plot" class="ema-flow-svg" viewBox="0 0 760 280" role="img" aria-label="Seks ledd fra melding via bits og radiobølger til mottaker"></svg><div id="ema-flow-readout" class="ema-flow-readout" aria-live="polite"></div></div><div class="key"><strong>Digital informasjon</strong> er bygd av biter, 0 og 1. De kan kodes med ulike amplituder, frekvenser eller faser. «Digital» betyr ikke at selve radiobølgen er firkantet.</div>`},
      {title:'Se hvordan én byte blir sendt',body:`<div class="model"><div class="controls ema-controls"><label class="control" for="ema-message">Din korte melding<input id="ema-message" class="ema-message-input" type="text" maxlength="8" value="HEI" autocomplete="off" spellcheck="false"></label><label class="control" for="ema-byte">Velg byte<select id="ema-byte" class="ema-byte-options"></select></label><label class="control" for="ema-modulation">Koding av 0 og 1<select id="ema-modulation"><option value="ask">ASK · forskjellig amplitude</option><option value="fsk">FSK · forskjellig frekvens</option></select></label></div><svg id="ema-signal-plot" class="ema-com-svg" viewBox="0 0 760 258" role="img" aria-label="Biter, modulert bærebølge og mottatte biter"></svg><div id="ema-received" class="ema-signal-result" aria-live="polite"></div><details class="ema-model-details"><summary>Om UTF-8, tid og forenklinger</summary><p>Støyfri, forenklet modell med åtte biter per byte. Meldingen kodes i UTF-8; noen tegn bruker flere byter. Tiden og radiofrekvensene er ikke i målestokk. ASK og FSK illustrerer prinsippet; Wi-Fi og mobilnett bruker mer avansert koding.</p></details></div>`},
      {title:'Mobilene er koblet sammen gjennom nettet',body:`<div class="model ema-network-model"><div class="controls"><label class="control" for="ema-network-direction">Hvem sender?<select id="ema-network-direction"><option value="a-b">Mobil A → mobil B</option><option value="b-a">Mobil B → mobil A</option></select></label><label class="control" for="ema-network-path">Radioforbindelsen til mobil A<select id="ema-network-path"><option value="direct">Direkte vei</option><option value="reflection">Reflektert vei</option></select></label></div><svg id="ema-network-plot" class="ema-network-svg" viewBox="0 0 760 266" role="img" aria-label="To mobiler, basestasjoner og forbindelsen gjennom nettet"></svg><div id="ema-network-readout" class="ema-flow-readout ema-network-readout" aria-live="polite"></div><details><summary>Radioforbindelse og resten av nettet</summary><p>Prikken følger informasjonen gjennom ulike forbindelser. Mellom mobil og basestasjon går et radiosignal; videre gjennom nettet brukes blant annet fiberforbindelser.</p></details></div>`},
      {title:'Hvilken forbindelse passer hvor?',body:`<div class="table-wrap"><table class="compare-table ema-app-table"><thead><tr><th>Teknologi</th><th>Typisk oppgave</th><th>Viktig å forstå</th></tr></thead><tbody><tr><td>Radio og TV</td><td>Én sender når mange mottakere.</td><td>En kringkaster trenger ikke vite hvem som lytter.</td></tr><tr><td>Mobilnett</td><td>Samtaler og data via basestasjoner.</td><td>Mobilen både sender og mottar; nettet kobler forbindelsen videre.</td></tr><tr><td>Wi-Fi</td><td>Lokalt datanett.</td><td>En ruter kobler ofte det lokale radionettet til internett. Wi-Fi er ikke i seg selv internett.</td></tr><tr><td>Bluetooth</td><td>Korte forbindelser, som hodetelefoner.</td><td>Begrenset rekkevidde og egnet for små enheter.</td></tr><tr><td>NFC</td><td>Kontaktløs betaling og identifikasjon.</td><td>Virker på svært kort avstand; bygger på elektromagnetisk kobling nær antennen.</td></tr><tr><td>Satellitt</td><td>Forbindelse over store områder og navigasjon.</td><td>Radiobølgene kan gå gjennom vakuum. Avstanden gir en reisetid.</td></tr></tbody></table></div>`},
      {title:'Hvorfor forsvinner dekningen?',body:`<div class="concept-grid ema-three-list"><article class="concept"><h3>Svekkelse og hindringer</h3><p>Avstand, vegger og absorpsjon svekker signalet. Bøyning og refleksjon kan la noe av signalet nå fram selv om senderen ikke er synlig.</p></article><article class="concept"><h3>Flere veier og forstyrrelser</h3><p>Reflekterte bølger kan komme fram med ulike forsinkelser og interferere. Mottakeren må skille ønsket informasjon fra støy og andre sendere.</p></article><article class="concept"><h3>Mobilen tilpasser seg</h3><p>Ved dårlig dekning kan mobilen bruke mer energi på sending og søking etter nett. Batteribruk avhenger også av hvordan telefonen brukes.</p></article></div><p><strong>Frekvens alene avgjør ikke rekkevidde eller datahastighet.</strong> Senderstyrke, båndbredde, antenner, terreng og kodingen spiller også inn.</p>`}
    ],
    terms:[
      {term:'Bit',definition:'En binær informasjonsenhet som kan ha verdien 0 eller 1.'},
      {term:'Byte',definition:'En gruppe på åtte biter. I UTF-8 bruker et tegn én eller flere byter.'},
      {term:'Bærebølge',definition:'En bølge som endres på en kontrollert måte for å bære informasjon.'},
      {term:'Modulasjon',definition:'Å variere en egenskap ved bærebølgen, for eksempel amplitude, frekvens eller fase.'},
      {term:'Antenne',definition:'En innretning som sender eller mottar elektromagnetiske bølger.'},
      {term:'Basestasjon',definition:'Radioutstyr som forbinder mobiltelefoner i et område med resten av mobilnettet.'},
      {term:'ASK og FSK',definition:'Enkle former for digital modulasjon: biter kodes med ulike amplituder (ASK) eller frekvenser (FSK).'},
      {term:'Støy',definition:'Uønskede signaler og tilfeldige variasjoner som kan gjøre informasjon vanskeligere å lese.'}
    ],
    questions:[
      {id:'com-01',type:'mcq',level:'Start',prompt:'Hva overfører informasjonen fra en mobil til en basestasjon?',choices:['Lydbølger i lufta','Elektromagnetiske bølger','Elektroner som flyr hele veien fra mobilen','Bare infrarødt lys'],correct:1,answer:'Mobiltelefonen kommuniserer med basestasjonen ved hjelp av <strong>elektromagnetiske radiobølger</strong>.'},
      {id:'com-02',type:'open',level:'Start',prompt:'Forklar kjeden melding → sender → bølge → mottaker med et konkret eksempel.',answer:'For eksempel: En tekstmelding blir kodet som digitale data. Senderen endrer en bærebølge etter dataene, antennen sender bølgen ut, og mottakeren registrerer og dekoder signalet til informasjon igjen.'},
      {id:'com-03',type:'mcq',level:'Start',prompt:'Hva betyr modulasjon?',choices:['At alle bølger fjernes fra signalet','At informasjon kodes ved å endre en egenskap ved bølgen','At signalet alltid forsterkes','At bølgens fart endres i vakuum'],correct:1,answer:'Modulasjon betyr at for eksempel <strong>amplitude, frekvens eller fase</strong> endres slik at bølgen bærer informasjon.'},
      {id:'com-04',type:'number',level:'Bruk',prompt:'En melding består av 5 byter. Hvor mange biter er det, uten ekstra data for kontroll og adressering?',value:40,tolerance:0,unit:'biter',hint:'Én byte er åtte biter.',answer:'5 · 8 = <strong>40 biter</strong>.'},
      {id:'com-05',type:'open',level:'Bruk',prompt:'Se for deg at en bølge bruker høy amplitude for 1 og lav amplitude for 0. Hvilken egenskap endres, og hva er uendret i denne enkle ASK-modellen?',answer:'<strong>Amplituden</strong> endres med bitene. Bærefrekvensen kan være uendret. Dette er ASK, amplitudeskiftmodulasjon.'},
      {id:'com-06',type:'mcq',level:'Bruk',prompt:'Hvilket utsagn om mobiltelefoner og radio er riktig?',choices:['En mobil mottar bare, akkurat som en vanlig radiomottaker','En mobil både sender til og mottar fra mobilnettet','En basestasjon sender lyd gjennom lufta til øret','Mobilen må se basestasjonen direkte for å ha dekning'],correct:1,answer:'En mobil har <strong>toveiskommunikasjon</strong>. En vanlig kringkastingsradio mottar fra en sender uten selv å sende en tilsvarende melding tilbake.'},
      {id:'com-07',type:'open',level:'Bruk',prompt:'Hvorfor kan en telefon ha Wi-Fi-forbindelse uten tilgang til internett?',answer:'<strong>Wi-Fi er den lokale radioforbindelsen</strong> til et nettverk. Nettverket eller ruteren må også ha en fungerende forbindelse videre til internett.'},
      {id:'com-08',type:'open',level:'Bruk',prompt:'Nevn to bølgefenomener som kan påvirke en trådløs forbindelse inne i et hus, og forklar kort.',answer:'<strong>Absorpsjon</strong> i vegger svekker signalet. <strong>Refleksjon</strong> lar signalet følge flere veier. <strong>Interferens</strong> mellom disse veiene kan forsterke eller svekke signalet. <strong>Bøyning</strong> kan spre bølgen forbi en kant eller åpning.'},
      {id:'com-09',type:'mcq',level:'Start',prompt:'Hvilken teknologi er laget for forbindelser på svært kort avstand, som kontaktløs betaling?',choices:['NFC','Satellitt-TV','Kringkastingsradio','Alle radiosamband har samme rekkevidde'],correct:0,answer:'<strong>NFC</strong> virker på svært kort avstand ved elektromagnetisk kobling nær antennen.'},
      {id:'com-10',type:'number',level:'Bruk',prompt:'Et radiosignal går 36 000 km fra en satellitt til en mottaker. Bruk c = 300 000 km/s. Finn minste reisetid én vei.',value:.12,tolerance:.002,unit:'s',hint:'Tid = avstand/fart.',answer:'t = s/c = 36 000 / 300 000 s = <strong>0,12 s</strong>. Andre deler av forbindelsen kan gi ekstra forsinkelse.'},
      {id:'com-11',type:'open',level:'Utfordring',prompt:'«En høyere radiofrekvens gir alltid bedre dekning og raskere internett.» Vurder påstanden.',answer:'Påstanden er for enkel. <strong>Datahastigheten</strong> påvirkes blant annet av båndbredde, koding og signal/støy. <strong>Dekningen</strong> påvirkes av antenner, senderstyrke, terreng, absorpsjon og bøyning. Frekvens er én av flere faktorer.'},
      {id:'com-12',type:'open',level:'Bruk',prompt:'Hvorfor kan dårlig mobildekning føre til at batteriet går fortere tomt?',answer:'Telefonen kan måtte bruke <strong>mer sendeeffekt</strong>, forsøke overføringer på nytt og søke etter nett. Dermed kan energibruken øke, men batteribruken avhenger også av annen aktivitet på telefonen.'}
    ],
    resources:[
      {label:'NASA: Spekteret og kommunikasjon',url:'https://www.nasa.gov/directorates/somd/space-communications-navigation-program/spectrum-overview/'},
      {label:'PhET: Radiobølger og elektromagnetiske felt',url:'https://phet.colorado.edu/en/simulations/radio-waves'}
    ],mount:mountCommunication
  }
];
