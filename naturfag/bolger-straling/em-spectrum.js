import {absorptionSection,mountAbsorption,absorptionQuestion,absorptionTerm} from './absorption.js?v=20261122-spekter2';
import {lightDualitySection,mountLightDuality} from './light-duality.js?v=20261125-wave-models';
import {skyScatteringHtml,mountSkyScattering} from './sky-scattering.js?v=20261122-spredning1';
import {emOrderQuestion} from './em-order-question.js?v=20261127-hvitt-lys';
import {whiteLightSection,mountWhiteLight} from './white-light.js?v=20261127-hvitt-lys';
import {frac} from './math-presentation.js?v=20261127-lysreisetid';
// Self-contained teaching models. Physical quantities use SI units internally.
const C = 299792458, H = 6.62607015e-34;
const fmt = (x, digits = 2) => x.toLocaleString('nb-NO', {maximumFractionDigits: digits});
const sci = x => {
  if (!x) return '0';
  const p = Math.floor(Math.log10(Math.abs(x)));
  return `${fmt(x / 10 ** p)} · 10<sup>${p}</sup>`;
};
const line = (points) => points.map((p,i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
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
  return {wavelength:`${fmt(wavelength/wu[0],3)} ${wu[1]}`,frequency:`${fmt(f/fu[0],3)} ${fu[1]}`,energy:`${sci(H*f)} J`};
}
const spectrumValueLabels=[['wavelength','Bølgelengde λ'],['frequency','Frekvens f'],['energy','Energi per foton']];
const spectrumValueCards=spectrumValueLabels.map(([id,label])=>`<div>
  <small>${label}</small><strong id="ema-${id}-output"></strong>
  <div id="ema-${id}-calculation" class="ema-calculation calc-lines" aria-live="off"></div>
</div>`).join('');
const scientificQuantity=(formatted,unit)=>`<span class="ema-si">${formatted} ${unit}</span>`;
const lightSpeedSI=scientificQuantity('3,00 · 10<sup>8</sup>','m/s');
const planckConstantSI=scientificQuantity('6,626 · 10<sup>−34</sup>','J s');

function spectrumCalculation(symbol,formula,substitution,result){
  return [formula,substitution,result].map((step,index)=>`<div class="calc-row">
    <span class="calc-lhs">${index?'':symbol}</span><span class="calc-eq">${index?'≈':'='}</span><span class="calc-rhs">${step}</span>
  </div>`).join('');
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
.topic-page .ema-spectrum-model .ema-spectrum-figure{display:block!important;width:100%;min-width:0;max-width:none;container-type:inline-size}
.topic-page .ema-spectrum-model .ema-spectrum-wave-svg{width:100%!important;height:auto!important;max-height:80px!important;margin:0}
.topic-page .ema-spectrum-model .ema-values{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;margin:6px 0 0!important;min-width:0}
.topic-page .ema-spectrum-model .ema-values>div{display:block!important;grid-template-columns:none!important;min-width:0!important;max-width:none!important;padding:7px 9px!important;text-align:left;overflow:visible}
.topic-page .ema-spectrum-model .ema-values small{display:block!important;width:auto!important;min-width:0;font-size:11px!important;line-height:1.3;margin:0 0 3px!important;word-break:normal!important;overflow-wrap:normal!important}
.topic-page .ema-spectrum-model .ema-values strong{display:block!important;width:auto!important;min-width:0;font-size:15px!important;font-weight:650;line-height:1.45;word-break:normal!important;overflow-wrap:normal!important;white-space:normal}
.topic-page .ema-spectrum-model .ema-values .ema-scientific{display:block!important;margin:1px 0 0!important;font-size:11px!important;font-weight:400;line-height:1.35;white-space:nowrap!important;word-break:normal!important;overflow-wrap:normal!important}
@media(max-width:650px){.topic-page .ema-spectrum-model .ema-spectrum-lower{grid-template-columns:1fr!important;gap:10px!important}.topic-page .ema-spectrum-model .ema-values{grid-template-columns:1fr!important}.topic-page .ema-spectrum-model .ema-values>div{padding:6px 9px!important}.topic-page .ema-spectrum-model .ema-values strong{font-size:14px!important}}
@container(max-width:480px){.topic-page .ema-spectrum-model .ema-values{grid-template-columns:1fr!important}}
.ema-formula-box .ema-word-relation{font-size:13px;font-weight:650;line-height:1.5;margin:10px 0 5px}.ema-formula-box .ema-formula-grid>div>p:not(.ema-word-relation){font-size:11px;line-height:1.55;margin:8px 0}

[id^="section-em-"]{margin-bottom:34px}
.ema-formula-box{margin:20px 0!important;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:24px;align-items:center}
.ema-formula-box .ema-vacuum{font-size:1.05rem;margin:0 0 12px}
.ema-vacuum-equations{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.ema-vacuum-equations>div{display:grid;grid-template-rows:auto 1fr;min-height:92px;gap:4px;align-items:center;text-align:center;padding:7px 4px;border:1px solid var(--line);background:var(--surface);border-radius:8px}
.ema-vacuum-equations>div>span{font-size:12px;color:var(--muted)}
.ema-vacuum-equations strong{display:flex;justify-content:center;gap:.24em;align-items:center;color:var(--green);font-size:clamp(15px,2vw,19px);white-space:nowrap}
@media(max-width:780px){.ema-formula-box{grid-template-columns:1fr;gap:14px}}
.ema-visible-intro{display:grid;grid-template-columns:minmax(0,2fr) minmax(210px,1fr);gap:20px;margin:24px 0 12px;align-items:center}
.ema-visible-intro figure{margin:0;min-width:0}.ema-visible-intro figcaption{font-size:15px;font-weight:700;margin-bottom:10px}
.ema-visible-intro svg{display:block;width:100%;height:auto}
.ema-visible-intro aside{border:1px solid var(--line);border-radius:11px;padding:14px 16px;background:var(--surface)}
.ema-visible-intro aside h3{margin:0 0 7px;font-size:15px}.ema-visible-intro aside p{margin:6px 0;font-size:13px}
.topic-page .model.ema-spectrum-model{padding:20px!important}.topic-page .ema-spectrum-model .ema-values{gap:12px!important;margin-top:12px!important}
.topic-page .ema-spectrum-model .ema-values>div{padding:11px!important}.ema-calculation{border-spacing:0 4px;margin:5px 0 0;font-size:12px;line-height:1.4}.ema-calculation .calc-lhs,.ema-calculation .calc-eq{padding-right:5px}.ema-si{white-space:nowrap}
@media(max-width:620px){.ema-visible-intro{grid-template-columns:1fr;gap:12px}.topic-page .model.ema-spectrum-model{padding:12px!important}}

.ema-wavelength-control{display:grid;gap:4px;margin:0 2% 18px}
.ema-wavelength-label,.ema-energy-direction{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.ema-wavelength-label{font-weight:700;font-size:13px}
.ema-wavelength-label span,.ema-energy-direction{font-size:11px;font-weight:400;color:var(--muted)}
.ema-wavelength-control input{width:100%;margin:0;min-height:22px;accent-color:var(--green)}
.ema-region-label{font-size:14px}
.ema-wavelength-tick text,.ema-ionizing-marker{font-size:13px}
.ema-ionizing-marker{fill:var(--ink);font-weight:700}
.ema-spectrum-controls .ema-ionizing-toggle{width:100%;margin-top:8px}
.ema-ionizing-toggle[aria-pressed=true]{background:var(--green-soft);border-color:var(--green);color:var(--green)}
.ema-ionizing-note{margin:10px 0 0;padding:9px 11px;border-left:2px solid var(--orange);background:var(--green-soft);font-size:12px;line-height:1.5}
@media(max-width:650px){.ema-region-label{font-size:24px}.ema-wavelength-tick text,.ema-ionizing-marker{font-size:23px}.ema-wavelength-tick--minor{display:none}.ema-wavelength-control{margin-bottom:12px}}
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

const regionOrder = regions.map((_,i)=>i).reverse();
const logC = Math.log10(C);
const minLogWavelength = logC - 22;
const maxLogWavelength = logC - 4;
const defaultLogWavelength = Math.log10(550e-9);
const ionizingEnergy = 10 * 1.602176634e-19;
const ionizingLogWavelength = Math.log10(H * C / ionizingEnergy);
const wavelengthTicks = [
  [-13,'0,1 pm'],[-11,'10 pm'],[-9,'1 nm'],[-7,'100 nm'],[-5,'10 µm'],
  [-3,'1 mm'],[-1,'10 cm'],[1,'10 m'],[3,'1 km']
];

function mountEM(root, api) {
  const q = s => root.querySelector(s);
  const slider = q('#ema-wavelength');
  const graph = q('#ema-spectrum-plot');
  const wave = q('#ema-spectrum-wave');
  const regionButtons = q('#ema-region-buttons').querySelectorAll('button');
  const ionizingButton = q('#ema-ionizing-toggle');
  const ionizingNote = q('#ema-ionizing-note');
  const x = logWavelength => 20 + (logWavelength - minLogWavelength) / 18 * 960;
  const selectedRegion = logFrequency => regions.findIndex((r,i)=>logFrequency>=r.min&&(logFrequency<r.max||i===regions.length-1));
  let showIonizing = false;

  function renderSpectrum(){
    const logWavelength = Number(slider.value);
    const wavelength = 10 ** logWavelength;
    const f = C / wavelength;
    const ri = selectedRegion(logC - logWavelength);
    let markup='<title>Det elektromagnetiske spekteret</title><desc>Bølgelengden øker fra venstre mot høyre på en logaritmisk skala. Fotonenergien avtar.</desc><defs><linearGradient id="ema-visible-gradient" x1="100%" x2="0%"><stop offset="0" stop-color="#f36464"/><stop offset=".2" stop-color="#efb55b"/><stop offset=".4" stop-color="#a8cd6c"/><stop offset=".6" stop-color="#55b4cb"/><stop offset=".8" stop-color="#657dce"/><stop offset="1" stop-color="#a87ace"/></linearGradient></defs>';
    markup+=regions.map((r,i)=>{
      const start=x(logC-r.max), stop=x(logC-r.min);
      return `<rect x="${start}" y="50" width="${stop-start}" height="22" fill="${i===3?'url(#ema-visible-gradient)':r.color}" opacity="${i===ri?1:.72}"/>`;
    }).join('');
    const labelXs=[875,650,515,408,350,225,84],labelYs=[33,33,33,15,33,33,33];
    markup+=regions.map((r,i)=>`<line x1="${x(logC-(r.min+r.max)/2)}" x2="${labelXs[i]}" y1="47" y2="${labelYs[i]+6}" stroke="${r.color}"/><text x="${labelXs[i]}" y="${labelYs[i]}" text-anchor="middle" class="ema-svg-text ema-region-label">${r.name}</text>`).join('');
    markup+=wavelengthTicks.map(([log,label],i)=>{
      if (showIonizing && log===-7) return '';
      return `<g class="ema-wavelength-tick${i%2?' ema-wavelength-tick--minor':''}"><line x1="${x(log)}" x2="${x(log)}" y1="72" y2="80" class="ema-gridline"/><text x="${x(log)}" y="98" text-anchor="middle" class="ema-muted-text">${label}</text></g>`;
    }).join('');
    if (showIonizing){
      const cutoff=x(ionizingLogWavelength);
      markup+=`<g class="ema-ionizing-range" aria-label="Bølgelengder opp til cirka 124 nanometer">
        <rect x="20" y="50" width="${cutoff-20}" height="22" fill="#ffd280" fill-opacity=".34" stroke="var(--orange)" stroke-width="2.5"/>
        <line x1="${cutoff}" x2="${cutoff}" y1="43" y2="83" stroke="var(--orange)" stroke-width="2" stroke-dasharray="3 3"/>
        <text x="${cutoff}" y="98" text-anchor="middle" class="ema-ionizing-marker">≈ 124 nm</text>
      </g>`;
    }
    const marker=x(logWavelength);
    markup+=`<path class="ema-wavelength-marker" d="M${marker-6} 39l6 8 6-8Z" fill="var(--green,#236448)"/><line x1="${marker}" x2="${marker}" y1="50" y2="73" stroke="var(--ink,#20352e)" stroke-width="2"/>`;
    graph.innerHTML=markup;
    const outputs=spectrumReadouts(f,ri);
    slider.setAttribute('aria-valuetext',outputs.wavelength);
    const frequencySI=scientificQuantity(sci(f),'Hz');
    const wavelengthSI=scientificQuantity(sci(wavelength),'m');
    const energySI=scientificQuantity(sci(H*f),'J');
    for(const [id] of spectrumValueLabels) q(`#ema-${id}-output`).innerHTML=outputs[id];
    q('#ema-wavelength-calculation').innerHTML=spectrumCalculation('λ',frac('c','f'),frac(lightSpeedSI,frequencySI),wavelengthSI);
    q('#ema-frequency-calculation').innerHTML=spectrumCalculation('f',frac('c','λ'),frac(lightSpeedSI,wavelengthSI),frequencySI);
    q('#ema-energy-calculation').innerHTML=spectrumCalculation('E','h · f',`${planckConstantSI} · ${frequencySI}`,energySI);
    regionButtons.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.region)===ri)));
  }
  function renderWave(t){
    const logWavelength=Number(slider.value), nm=10**logWavelength*1e9;
    const cycles=1.2+(maxLogWavelength-logWavelength)*.46, color=wavelengthColor(nm);
    const points=Array.from({length:401},(_,i)=>[25+i*1.775,40-18*Math.sin((i/400*cycles-t*.7)*Math.PI*2)]);
    wave.innerHTML=`<title>Bølge ved valgt bølgelengde</title><rect x="12" y="7" width="736" height="66" rx="10" class="ema-dark"/><path d="${line(points)}" fill="none" stroke="${nm>=380&&nm<=780?color:'#9dcec3'}" stroke-width="2.8"/>`;
  }
  function updateWavelength(){
    renderSpectrum();
    api.repaint(wave);
  }
  slider.addEventListener('input',updateWavelength);
  regionButtons.forEach(button=>button.addEventListener('click',()=>{
    slider.value=Math.log10(C/regions[Number(button.dataset.region)].f);
    updateWavelength();
  }));
  ionizingButton.addEventListener('click',()=>{
    showIonizing=!showIonizing;
    ionizingButton.setAttribute('aria-pressed',String(showIonizing));
    ionizingNote.hidden=!showIonizing;
    renderSpectrum();
  });
  renderSpectrum();api.onFrame(renderWave,wave);
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
  const cleanup = [mountWhiteLight(root, api), mountAbsorption(root), mountSkyScattering(root, api), mountLightDuality(root, api)];
  return () => cleanup.forEach(dispose => dispose?.());
}

export const emTopic = {
    id:'em', title:'Det elektromagnetiske spekteret', kicker:'Fra radio til gamma',
    summary:'Én familie av stråling, mange bølgelengder. Finn sammenhengen mellom frekvens, farge og energi per foton.',
    sections:[
      {title:'Elektromagnetiske bølger',body:sharedStyle+`
<p>Elektromagnetiske bølger kan bre seg gjennom vakuum. Lyd og vannbølger brer seg i et stoff.</p>
<p>I vakuum går alle elektromagnetiske bølger med lysfarten. I luft er farten nesten den samme. I for eksempel glass kan farten variere med bølgelengden.</p>
<p>Et <strong>foton</strong> er en energipakke i strålingen. Dobbel frekvens gir dobbelt så stor energi per foton. I vakuum hører høyere frekvens sammen med kortere bølgelengde.</p>
<div class="key ema-formula-box">
 <div class="ema-vacuum-intro">
  <h3>Lys i vakuum</h3>
  <p class="ema-vacuum"><strong>v = c = 300 000 km/s = 3,00 · 10<sup>8</sup> m/s</strong></p>
  <p>Bølgeformelen er <i>v</i> = <i>f</i> · <i>λ</i>. I vakuum setter vi inn lysfarten <i>c</i> for <i>v</i>.</p>
 </div>
 <div class="ema-vacuum-equations">
  <div><span>Lysfart</span><strong><i>c</i> = <i>f</i> · <i>λ</i></strong></div>
  <div><span>Frekvens</span><strong><i>f</i> = <span class="frac"><span class="num">c</span><span class="den">λ</span></span></strong></div>
  <div><span>Bølgelengde</span><strong><i>λ</i> = <span class="frac"><span class="num">c</span><span class="den">f</span></span></strong></div>
 </div>
</div>
<div class="ema-visible-intro">
 <figure><figcaption>Synlig lys</figcaption>
  <svg viewBox="0 0 690 106" role="img" aria-label="Synlig spekter fra fiolett ved 380 nanometer til rødt ved 780 nanometer">
   <defs><linearGradient id="ema-visible-intro-color"><stop stop-color="#601dac"/><stop offset=".18" stop-color="#4137ff"/><stop offset=".30" stop-color="#087df5"/><stop offset=".37" stop-color="#12c3cd"/><stop offset=".46" stop-color="#44b73d"/><stop offset=".52" stop-color="#efd928"/><stop offset=".61" stop-color="#f58a20"/><stop offset=".75" stop-color="#d11735"/><stop offset="1" stop-color="#7e102c"/></linearGradient></defs>
   <rect x="33" y="9" width="624" height="38" rx="6" fill="url(#ema-visible-intro-color)"/>
   ${[380,450,500,550,600,650,700,780].map(nm=>{
    const x=33+(nm-380)/400*624;
    return `<path d="M${x} 48v9" stroke="var(--muted)"/><text x="${x}" y="78" text-anchor="middle" fill="var(--ink)" font-size="23">${nm}</text>`;
   }).join('')}
   <text x="345" y="102" text-anchor="middle" fill="var(--muted)" font-size="19">Bølgelengde (nm)</text>
  </svg>
 </figure>
 <aside><h3>Hva er en nanometer?</h3><p>Én nanometer er én milliarddel av en meter.</p><p><strong>1 nm = 0,000 000 001 m = 10<sup>−9</sup> m</strong></p><p>Tallet 10<sup>−9</sup> betyr én delt på en milliard. Slik kan vi skrive den lille lengden kort på standardform.</p></aside>
</div>`},
      {title:'Utforsk spekteret',body:`<div class="model ema-spectrum-model" data-model-layout="custom"><div class="model-full-width ema-spectrum-band" data-model-full-width><svg id="ema-spectrum-plot" class="ema-spectrum-band-svg" viewBox="0 0 1000 109" role="img" aria-label="Hele det elektromagnetiske spekteret"></svg><div class="ema-wavelength-control"><label class="ema-wavelength-label" for="ema-wavelength">Bølgelengde <span>Logaritmisk skala</span></label><input id="ema-wavelength" type="range" min="${minLogWavelength}" max="${maxLogWavelength}" step="0.005" value="${defaultLogWavelength}"><div class="ema-energy-direction"><span>Mer energi per foton</span><span>Mindre energi per foton</span></div></div></div><div class="ema-spectrum-lower"><div class="ema-spectrum-figure model-visual"><svg id="ema-spectrum-wave" class="ema-spectrum-wave-svg" viewBox="0 0 760 80" role="img" aria-label="Bølge ved valgt bølgelengde"></svg><div class="ema-values" aria-live="polite">${spectrumValueCards}</div></div><div class="ema-spectrum-controls"><div class="ema-region-buttons" id="ema-region-buttons">${regionOrder.map(i=>`<button type="button" data-region="${i}" aria-pressed="${i===3}">${regions[i].name}</button>`).join('')}</div><button type="button" class="secondary ema-ionizing-toggle" id="ema-ionizing-toggle" aria-pressed="false" aria-controls="ema-ionizing-note">Vis ioniserende stråling</button><p class="ema-ionizing-note" id="ema-ionizing-note" hidden>Ved ca. <strong>124 nm</strong> har et foton omtrent 1,6 · 10<sup>−18</sup> J. Det er en omtrentlig grense. Hvor mye energi som trengs for å løsne et elektron, avhenger av atomet eller molekylet.</p></div></div></div>`},
      whiteLightSection,
      {...absorptionSection,body:absorptionSection.body+skyScatteringHtml},
      {title:'Hvordan lager en skjerm hvitt og gult?',body:`<p>En skjerm blander <strong>rødt, grønt og blått lys</strong> (RGB). Hvitfarge kan lages med en passende blanding av disse tre; det er ikke nødvendig å ha alle bølgelengder i blandingen.</p><div class="model ema-rgb-layout" data-model-layout="custom"><div class="ema-rgb-screen"><svg viewBox="0 0 600 230" role="img" aria-label="Additiv blanding av rødt, grønt og blått lys"><rect width="600" height="230" rx="10" fill="#000"/><g style="isolation:isolate"><circle id="ema-rgb-red-circle" cx="160" cy="85" r="70" style="mix-blend-mode:screen"/><circle id="ema-rgb-green-circle" cx="240" cy="85" r="70" style="mix-blend-mode:screen"/><circle id="ema-rgb-blue-circle" cx="200" cy="135" r="70" style="mix-blend-mode:screen"/></g><path d="M380 35v155" stroke="#48636c"/><rect id="ema-rgb-result" x="440" y="55" width="100" height="100" rx="10"/><text x="490" y="185" text-anchor="middle" fill="#ddd" font-size="15">Blandingsfargen</text></svg><output id="ema-rgb-value"></output></div><div class="ema-rgb-controls">${[['red','Rødt',192],['green','Grønt',87],['blue','Blått',146]].map(([id,label,val])=>`<label for="ema-rgb-${id}">${label}<input type="range" id="ema-rgb-${id}" min="0" max="255" step="1" value="${val}"><output id="ema-rgb-${id}-value" for="ema-rgb-${id}">${val}</output></label>`).join('')}<div class="ema-region-buttons"><button type="button" data-ema-rgb="255,255,255">Hvitt</button><button type="button" data-ema-rgb="255,255,0">Gult</button><button type="button" data-ema-rgb="0,0,0">Svart</button></div><p id="ema-rgb-caption" aria-live="polite"></p></div></div><div class="key"><strong>Lysblanding og overflatefarger er forskjellige:</strong> En rød flate reflekterer særlig rødt lys og absorberer mye av det øvrige. Uten rødt i belysningen kan flaten se mørk ut.</div>`},
      lightDualitySection
    ],
    terms:[
      {term:'Elektromagnetisk stråling',definition:'Energi som overføres med svingende elektriske og magnetiske felt; kan bre seg i vakuum.'},
      {term:'Foton',definition:'En energipakke i elektromagnetisk stråling.'},
      {term:'Synlig spekter',definition:'Den lille delen av EM-spekteret øynene våre oppfatter, omtrent 380–780 nm.'},
      {term:'Infrarød stråling',definition:'EM-stråling med lengre bølgelengde enn synlig rødt lys. Varme gjenstander som kroppen sender hovedsakelig ut IR.'},
      {term:'Ioniserende stråling',definition:'Stråling som har nok energi til å frigjøre elektroner fra atomer eller molekyler.'},
      absorptionTerm,
      {term:'Spredning',definition:'Lys sendes i nye retninger når det møter blant annet luftmolekyler. I luft spres blått lys lettere enn rødt.'},
      {term:'RGB',definition:'Additiv lysblanding med rødt, grønt og blått, blant annet i skjermer.'},
      {term:'Intensitet',definition:'Energi som passerer per tid og areal. Høyere intensitet er ikke det samme som høyere energi per foton.'},
      {term:'Attojoule (aJ)',definition:'En liten energienhet: 1 aJ = 10⁻¹⁸ J. Den er nyttig for energier i atomer og i enkeltfotoner.'}
    ],
    questions:[
      absorptionQuestion,
      {id:'wv-b8',type:'open',level:'Bruk',prompt:'En film viser en eksplosjon langt ute i verdensrommet. Kan astronauten se den? Kan astronauten høre den gjennom vakuum? Forklar.',answer:'Lys er elektromagnetisk stråling og kan gå gjennom vakuum, så eksplosjonen kan sees. Lyd er en mekanisk bølge og trenger et stoff. Den kan derfor ikke høres gjennom vakuum.'},
      {id:'em-01',type:'mcq',level:'Start',prompt:'Hvilken type stråling har størst energi per foton?',choices:['Radiobølger','Infrarødt','Synlig rødt lys','Gammastråling'],correct:3,answer:'Gammastråling har høyest frekvens av alternativene. Jo høyere frekvens, desto mer energi har hvert foton.<details><summary>Ekstra forklaring</summary><p>Formelen <strong>E = hf</strong> gir energien <em>E</em> til ett foton. Her er <em>f</em> frekvensen og <em>h</em> Plancks konstant, et fast tall.</p></details>'},
      {id:'em-02',type:'open',level:'Start',prompt:'Sorter fra lengst til kortest bølgelengde: gamma, synlig lys, radio, UV, mikrobølger, røntgen, infrarødt.',answer:'<strong>Radio → mikrobølger → infrarødt → synlig lys → UV → røntgen → gamma.</strong> Mikrobølger er en del av radiobølgeområdet, men skilles ofte ut i denne oversikten.'},
      {
        id:'em-03',type:'number',level:'Bruk',
        prompt:`<p>En radiobølge har frekvens 100 MHz. Finn bølgelengden i vakuum. Bruk c = 3,00 · 10⁸ m/s.</p>
          <div class="q-formula"><strong>λ = ${frac('c','f')}</strong><span class="q-prefix"><strong>Mega (M)</strong> betyr én million. 1 MHz = 10<sup>6</sup> Hz.</span></div>`,
        value:3,tolerance:.03,unit:'m',
        answer:'λ = c/f = (3,00 · 10<sup>8</sup>)/(100 · 10<sup>6</sup>) m = <strong>3,00 m</strong>.'
      },
      {
        id:'em-04',type:'number',level:'Bruk',
        prompt:`<p>Grønt lys har bølgelengde 500 nm. Finn frekvensen i enheten 10¹⁴ Hz. Bruk c = 3,00 · 10⁸ m/s.</p>
          <div class="q-formula"><strong>f = ${frac('c','λ')}</strong><span class="q-prefix"><strong>Nano (n)</strong> betyr én milliarddel. 1 nm = 10<sup>−9</sup> m.</span></div>`,
        value:6,tolerance:.06,unit:'· 10¹⁴ Hz',
        answer:'f = c/λ = (3,00 · 10<sup>8</sup>)/(5,00 · 10<sup>−7</sup>) Hz = <strong>6,00 · 10<sup>14</sup> Hz</strong>.'
      },
      {id:'em-05',type:'mcq',level:'Start',prompt:'Hvilket utsagn stemmer om stråling i vakuum?',choices:['Gamma går raskere enn radiobølger','Synlig lys går raskest','Alle EM-bølger går like raskt','Kortere bølger går alltid saktere'],correct:2,answer:'Alle EM-bølger går med lysfarten <strong>c</strong> i vakuum, selv om frekvens og bølgelengde er forskjellige.'},
      {id:'em-06',type:'open',level:'Bruk',prompt:'En skjerm viser gult. Hvilke to RGB-lyskilder er da aktive? Hva skjer når du skrur av alle tre?',answer:'<strong>Rødt og grønt lys</strong> kan gi gult. Når alle tre er av, sender pikselen ikke ut lys og framstår svart.'},
      {id:'em-07',type:'mcq',level:'Bruk',prompt:'En lampe gir dobbelt så høy intensitet, men beholder samme farge. Hva kan ha skjedd?',choices:['Hvert foton har nødvendigvis fått dobbelt energi','Det sendes ut flere fotoner per sekund','Lyset har fått dobbelt fart','Bølgelengden må være halvert'],correct:1,answer:'Ved samme farge/frekvens har hvert foton samme energi. Høyere intensitet kan skyldes <strong>flere fotoner per sekund</strong>.'},
      {id:'em-08',type:'open',level:'Bruk',prompt:'Hvorfor kan et varmekamera vise en person i et helt mørkt rom?',answer:'Kroppen sender ut <strong>varmestråling, hovedsakelig infrarødt</strong>, selv når det ikke er synlig lys i rommet. Varmekameraet registrerer denne strålingen.'},
      {id:'em-09',type:'mcq',level:'Bruk',prompt:'Hvilket utsagn om mikrobølger er riktig?',choices:['De er mekaniske bølger','De går bare gjennom luft','De er en del av radiobølgeområdet','Alle mikrobølgefotoner er ioniserende'],correct:2,answer:'Mikrobølger er kortbølgede <strong>radiobølger</strong>. De er elektromagnetiske og kan også bre seg i vakuum.'},
      {id:'em-10',type:'open',level:'Utfordring',prompt:'<strong>«Mobilen bruker mikrobølger, så å bruke den er som å ha en mikrobølgeovn rett ved hodet.»</strong> Vurder hva som er riktig og hva sammenlikningen mangler.',answer:'Begge bruker EM-stråling i radio-/mikrobølgeområdet. Men man må også sammenlikne <strong>effekt, intensitet, absorpsjon og eksponering</strong>. En mikrobølgeovn tilfører stor effekt i et skjermet rom for å varme mat. At frekvensområdene overlapper, sier ikke alene hvilken påvirkning en mobil gir.'},
      {id:'em-11',type:'open',level:'Bruk',prompt:'Hvorfor kan en rød genser se mørk ut i rent blått lys?',answer:'Genseren reflekterer særlig rødt lys, men det er lite eller intet rødt lys å reflektere. Det blå lyset absorberes i stor grad, og genseren kan derfor se mørk ut.'},
      {id:'em-12',type:'mcq',level:'Start',prompt:'Blått og rødt lys sammenliknes. Hvilket utsagn er riktig?',choices:['Et rødt foton har mer energi','Et blått foton har mer energi','Alle synlige fotoner har samme energi','Rødt lys går raskere i vakuum'],correct:1,answer:'Blått lys har kortere bølgelengde og høyere frekvens. Derfor har et <strong>blått foton</strong> mer energi enn et rødt.'},
      emOrderQuestion,
      {
        id:'em-16',type:'mcq',level:'Start',prompt:'Hva er ioniserende stråling?',
        choices:[
          'Stråling som kan frigjøre elektroner fra atomer eller molekyler.',
          'Stråling som løfter elektroner til et høyere bundet energinivå.',
          'Stråling som alltid består av elektrisk ladde partikler.',
          'All elektromagnetisk stråling som øyet ikke kan se.'
        ],
        correct:0,
        answer:'Ioniserende stråling kan <strong>frigjøre et elektron</strong> fra et atom eller molekyl. Det som blir igjen, er et positivt ion. Røntgenstråling er et eksempel på stråling som kan ionisere.'
      },
      {
        id:'em-17',type:'number',level:'Utfordring*',
        prompt:'Lyset beveger seg i nesten 300 000 kilometer i sekundet og det er nesten 150 000 000 kilometer mellom jorda og sola. Hvis sola plutselig hadde slukket, hvor lang tid ville det tatt før det hadde blitt mørkt her? Oppgi svaret i sekunder.',
        value:500,unit:'s',
        hint:`Tid = ${frac('strekning','fart')}.`,
        answer:'Det siste sollyset ville nå jorda etter omtrent <strong>500 s</strong>, altså <strong>8 min 20 s</strong>.'
      }
    ],
    resources:[
      {label:'NASA: Det elektromagnetiske spekteret',url:'https://science.nasa.gov/ems/01_intro/'},
      {label:'PhET: Fargesyn',url:'https://phet.colorado.edu/nb/simulations/color-vision'}
    ],mount:mountEM
  };
export const topics = [emTopic];
