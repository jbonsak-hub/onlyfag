import {spectraLabElements, spectraLabNotes} from './spectra-lab-data.js?v=20261126-absorpsjon';
import {absorptionDetailGraphic} from './spectra-lab-detail.js?v=20261126-absorpsjon';
import {darkLinesGraphic} from './spectra-lab-dark-lines.js?v=20261126-absorpsjon';
import {wavelengthColor} from './element-spectra.js?v=20261126-atomspektre';

const gases = new Map(spectraLabElements.map(element => [element.symbol, element]));
const initialGas = gases.get('Ne');
const cases = [
  {key:'continuous', light:'Glødelampe', spectrum:'Sammenhengende spekter'},
  {key:'emission', light:'Lysende gass', spectrum:'Emisjonsspekter'},
  {key:'absorption', light:'Lys gjennom kjøligere gass', compactLight:'Lys gjennom kjølig gass', spectrum:'Absorpsjonsspekter'}
];
const visible = [380, 400, 435, 470, 495, 530, 570, 590, 625, 670, 720, 780];

const styles = `<style>
#sl-model { max-width:none; margin:13px 0; padding:13px; overflow:visible }
#sl-model .sl-controls, #sl-model .sl-actions { display:flex; flex-wrap:wrap; align-items:center; gap:6px 9px }
#sl-model .sl-controls { margin-bottom:8px }
#sl-model .sl-controls button, #sl-model .sl-actions button { min-height:33px; padding:5px 9px; border:1px solid var(--line); color:var(--ink); background:var(--surface); font-size:.86rem; font-weight:700 }
#sl-model .sl-controls button[aria-pressed=true] { border-color:var(--green); color:var(--green); background:var(--green-soft) }
#sl-model .sl-controls button:hover, #sl-model .sl-actions button:hover { border-color:var(--green) }
#sl-model .sl-actions { justify-content:space-between; margin-top:9px }
#sl-model .sl-actions button:first-child[aria-expanded=true] { color:var(--green); background:var(--green-soft) }
#sl-model button:focus-visible, #sl-dark-dialog button:focus-visible { outline:2px solid var(--blue); outline-offset:2px }
#sl-model .sl-figure, #sl-dark-dialog .sl-figure { display:block; width:100%; height:auto; max-height:none; margin:0; border-radius:8px; background:var(--bg) }
#sl-model .sl-scene-title { font-size:15px; font-weight:700; fill:var(--ink) }
#sl-model .sl-gas-label, #sl-model .sl-unit { font-size:12px; fill:var(--muted) }
#sl-gas-note, #sl-model .sl-detail p { margin:7px 0 0; font-size:.86rem; line-height:1.45 }
#sl-model .sl-detail { margin-top:10px }
#sl-model .sl-detail p:first-child { margin:0 0 5px }
#sl-model [hidden] { display:none !important }
#sl-model .sl-sources { margin-top:8px; font-size:.78rem; color:var(--muted) }
#sl-model .sl-sources summary { cursor:pointer }
#sl-model .sl-sources p { margin:5px 0 0 }
#sl-dark-dialog { width:min(570px,95vw); max-width:95vw; max-height:92dvh; padding:13px; border:1px solid var(--line); border-radius:12px; background:var(--surface); color:var(--ink); overflow:auto }
#sl-dark-dialog::backdrop { background:#091622a6 }
#sl-dark-dialog .sl-dialog-heading { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px }
#sl-dark-dialog h3 { margin:0; font-size:1rem }
#sl-dark-dialog button { padding:5px 8px; font-size:.85rem }
#sl-dark-dialog p { margin:7px 0 0; font-size:.89rem; line-height:1.5 }
#sl-dark-dialog .sl-dark-example { margin:0 0 6px }
@media(max-width:580px) {
  #sl-model { padding:9px }
  #sl-model .sl-controls, #sl-model .sl-actions { gap:5px }
  #sl-model .sl-actions { justify-content:start }
}
</style>`;

function layoutFor(width) {
  const narrow = width < 585;
  return narrow
    ? {width:420, height:300, lamp:38, cell:113, prism:184, spectrum:220, right:409, rows:[64,158,252], narrow}
    : {width:900, height:294, lamp:116, cell:290, prism:433, spectrum:514, right:879, rows:[62,156,250], narrow};
}

function label(x,y,content,attributes='') {
  return `<text x="${x}" y="${y}" ${attributes}>${content}</text>`;
}

function lamp(x,y,narrow) {
  return `<g transform="translate(${x} ${y}) scale(${narrow ? .79 : 1})">
    <path d="M-19-9C-19-20-10-26 0-26S19-20 19-9C19 0 14 5 10 11L8 14H-8L-10 11C-14 5-19 0-19-9Z" fill="url(#sl-lamp-glass)" stroke="#bb874a" stroke-width="1.2"/>
    <path d="M-8 14H8V22L5 25H-5L-8 22Z" fill="#728890" stroke="#475b63"/>
    <path d="M-8 17H8M-8 20H8M-6 23H6" stroke="#bdcbd0" stroke-width="1.3"/>
    <path d="M-5 13-7-4-2-1 2-5 6-2 5 13" stroke="#b46c27" stroke-width="1.5" fill="none"/>
    <path d="M-12-7C-13-14-8-20-2-20" fill="none" stroke="#fff9ce" stroke-width="2.1" stroke-linecap="round"/>
  </g>`;
}

function cell(x,y,gas,narrow,discharge) {
  return `<g transform="translate(${x} ${y}) scale(${narrow ? .78 : 1})" data-spectra-cell="${discharge ? 'emission' : 'absorption'}">
    ${discharge ? `<rect x="-48" y="-19" width="96" height="38" rx="20" fill="${gas.glow}" opacity=".15"/>` : ''}
    <rect x="-48" y="-13" width="96" height="26" rx="13" fill="${discharge ? gas.glow : '#aec6ca'}" fill-opacity="${discharge ? .54 : .26}" stroke="#79939b" stroke-width="1.2"/>
    <rect x="-41" y="-6.5" width="82" height="13" rx="6.5" fill="${discharge ? gas.glow : '#99b4b8'}" opacity="${discharge ? .9 : .13}" ${discharge ? 'data-spectra-glow' : ''}/>
    <path d="M-36-9H36M-34 9H34" stroke="#f5ffff" opacity=".7" stroke-width="1.35" stroke-linecap="round"/>
    ${discharge ? '<path d="M-46 0H-34M34 0H46M-47-7V7M47-7V7" stroke="#627982" stroke-width="3" stroke-linecap="round"/>' : ''}
  </g>`;
}

function prism(x,y,narrow) {
  return `<g transform="translate(${x} ${y}) scale(${narrow ? .76 : 1})">
    <title>Prisme i et spektroskop</title>
    <path d="M0-22 20 16H-20Z" fill="#aed5e4" fill-opacity=".43" stroke="#65848f" stroke-width="1.4"/>
    <path d="M0-18 14 12M-16 13H16" fill="none" stroke="#eaf8fb" stroke-width="1.2" stroke-linecap="round"/>
  </g>`;
}

function lightBeam(start,end,y,color,phase) {
  return `<path d="M${start} ${y-2}H${end}V${y+2}H${start}Z" fill="${color}" opacity=".57"/>
    ${[0,.5].map((offset,index) =>
      `<ellipse data-spectra-beam data-start="${start}" data-end="${end}" data-offset="${offset+phase}" cx="${start+(end-start)*offset}" cy="${y}" rx="${index===0 ? 5 : 4}" ry="2.5" fill="${color}" opacity=".8"/>`).join('')}`;
}

function rainbowDefinition() {
  const stops=visible.map(wavelength => `<stop offset="${(wavelength-380)/4}%" stop-color="${wavelengthColor(wavelength)}"/>`).join('');
  return `<linearGradient id="sl-rainbow" x2="100%" y2="0%">${stops}</linearGradient>
    <radialGradient id="sl-lamp-glass"><stop stop-color="#fffbd7"/><stop offset="1" stop-color="#ffd689"/></radialGradient>`;
}

function spectrum(layout,y,kind,gas) {
  const {spectrum:x,right} = layout;
  const top=y-17, width=right-x, height=34;
  const prefix = `sl-band-${kind}`;
  const fill = kind==='emission' ? '#070d16' : 'url(#sl-rainbow)';
  const lines = kind==='continuous' ? '' : gas.lines.map(([wavelength,weight]) => {
    const column=x+(wavelength-380)*width/400;
    const color=kind==='emission' ? wavelengthColor(wavelength) : '#03060b';
    const opacity=kind==='emission' ? .57+.43*weight : .55+.33*weight;
    return `<line data-spectra-wavelength="${wavelength}" x1="${column}" x2="${column}" y1="${top}" y2="${top+height}" stroke="${color}" stroke-width="${.85+.65*weight}" vector-effect="non-scaling-stroke" opacity="${opacity}"/>`;
  }).join('');
  return `<clipPath id="${prefix}"><rect x="${x}" y="${top}" width="${width}" height="${height}" rx="4"/></clipPath>
    <g clip-path="url(#${prefix})"><rect x="${x}" y="${top}" width="${width}" height="${height}" fill="${fill}"/>${lines}</g>
    ${label(x,y+32,'380 nm','class="sl-unit"')}
    ${label(right,y+32,'780 nm','class="sl-unit" text-anchor="end"')}`;
}

function overviewGraphic(layout,gas) {
  const {width,height,lamp:lampX,cell:cellX,prism:prismX,spectrum:spectrumX,right,rows,narrow}=layout;
  const scene = cases.map(({key,light,compactLight,spectrum:kind}, i) => {
    const y=rows[i], hasLamp=key!=='emission', hasGas=key!=='continuous';
    const incoming=key==='emission' ? gas.glow : '#ffda80';
    const start=hasLamp ? lampX+(narrow?16:20) : cellX+(narrow?32:42);
    const gasLabel=hasGas ? label(cellX,y+29,gas.label,'class="sl-gas-label" text-anchor="middle"') : '';
    return `<g data-spectra-case="${key}">
      <rect x="4" y="${y-47}" width="${width-8}" height="88" rx="7" fill="var(--surface,#fff)" stroke="var(--line,#dce6e0)"/>
      ${label(narrow?12:20,y-26,narrow&&compactLight?compactLight:light,'class="sl-scene-title"')}
      ${label(spectrumX,y-26,kind,'class="sl-scene-title"')}
      ${lightBeam(start,prismX-(narrow?10:15),y,incoming,i*.13)}
      <path d="M${prismX+7} ${y}L${spectrumX-2} ${y-14}V${y+14}Z" fill="${incoming}" opacity=".24"/>
      ${hasLamp ? lamp(lampX,y,narrow) : ''}
      ${hasGas ? cell(cellX,y,gas,narrow,key==='emission') : ''}
      ${prism(prismX,y,narrow)}
      ${key==='continuous' ? label(prismX-(narrow?6:0),y+28,'Spektroskop','class="sl-gas-label" text-anchor="middle"') : ''}
      ${spectrum(layout,y,key,gas)}
      ${gasLabel}
    </g>`;
  }).join('');
  return `<desc>En glødelampe gir et sammenhengende spekter. Lysende gass gir lyse linjer. Når lyset fra lampen går gjennom kjøligere gass av samme stoff, blir spekteret mørkere ved de samme bølgelengdene.</desc>
    <defs>${rainbowDefinition()}</defs>${scene}`;
}

const gasButtons = ['Ne','Na','O','N','H','He'].map(symbol=>gases.get(symbol)).map(element =>
  `<button type="button" data-spectra-gas="${element.symbol}" aria-pressed="${element===initialGas}">${element.label}</button>`).join('');

function gasSources(gas) {
  return `<a href="${gas.lineSource}" target="_blank" rel="noopener">NISTs spektrallinjer</a> · <a href="${gas.glowSource}" target="_blank" rel="noopener">Kilde til glødefargen</a>`;
}

export const spectraLabSection = {
  title:'Spektrallinjer er stoffenes fingeravtrykk',
  body:`${styles}
    <p>En glødelampe sender ut lys ved mange bølgelengder og gir et sammenhengende spekter. Lysende gass gir lyse emisjonslinjer. Når lyset fra lampen passerer kjøligere gass av samme stoff, kan vi se mørke absorpsjonslinjer ved de samme bølgelengdene. Mønsteret kan avsløre hvilket stoff som finnes i gassen.</p>
    <div class="model" id="sl-model" data-model-layout="custom" data-gas="${initialGas.symbol}">
      <div class="sl-controls" role="group" aria-label="Velg gass">${gasButtons}</div>
      <div id="sl-overview-wrap"><svg id="sl-overview" class="sl-figure" viewBox="0 0 900 294" role="img" aria-label="Sammenhengende spekter, emisjonsspekter og absorpsjonsspekter">${overviewGraphic(layoutFor(900),initialGas)}</svg></div>
      <p id="sl-gas-note" role="status"></p>
      <div class="sl-actions">
        <button type="button" id="sl-absorption-toggle" aria-expanded="false" aria-controls="sl-absorption-detail">Hvordan oppstår absorpsjonsspekteret?</button>
        <button type="button" id="sl-dark-open" aria-haspopup="dialog" aria-controls="sl-dark-dialog">Er linjene helt svarte?</button>
      </div>
      <div class="sl-detail" id="sl-absorption-detail" hidden>
        <p>Eksempelet viser natriumgass, som tar opp lys rundt 589 nm.</p>
        <svg id="sl-absorption-figure" class="sl-figure" role="img" aria-label="Hvordan natriumgass absorberer og sender ut lys"></svg>
        <p>Atomene sender lys ut igjen i ulike retninger, så mindre lys fortsetter rett fram. Samme energiforskjell gir en mørk absorpsjonslinje og en lys emisjonslinje ved samme bølgelengde.</p>
      </div>
      <details class="sl-sources">
        <summary>Spektraldata og glødefarger</summary>
        <p>${spectraLabNotes.lines} ${spectraLabNotes.absorption} ${spectraLabNotes.glow}</p>
        <p id="sl-gas-sources">${gasSources(initialGas)}</p>
        <p>Mer om stjernespektre i <a href="/prototyper/bolger-straling.html#universet/fagstoff" target="_top">Stjerner og universet</a>.</p>
      </details>
    </div>
    <dialog id="sl-dark-dialog" aria-labelledby="sl-dark-title">
      <div class="sl-dialog-heading"><h3 id="sl-dark-title">Er linjene helt svarte?</h3><button type="button" id="sl-dark-close">Lukk</button></div>
      <p class="sl-dark-example">Skjematisk absorpsjonsspekter for hydrogen</p>
      <svg id="sl-dark-figure" class="sl-figure" role="img" aria-label="Lysstyrken synker ved absorpsjonslinjene til hydrogen"></svg>
      <p>Gassen tar opp mye lys ved bestemte bølgelengder. Noe lys ved disse bølgelengdene kan fortsatt nå fram, så linjene ser mørke ut mot resten av spekteret.</p>
    </dialog>`
};

export function mountSpectraLab(root,api) {
  const byId = id => root.querySelector('#'+id);
  const model = byId('sl-model');
  if (!model) return;
  const overview = byId('sl-overview'), wrap = byId('sl-overview-wrap');
  const detail = byId('sl-absorption-detail'), detailToggle = byId('sl-absorption-toggle'), detailSvg = byId('sl-absorption-figure');
  const dark = byId('sl-dark-dialog'), darkOpen = byId('sl-dark-open'), darkClose = byId('sl-dark-close'), darkSvg = byId('sl-dark-figure');
  const reduced = typeof matchMedia==='function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let gas = initialGas, layout, beams, glow, detailWidth, darkWidth, latestTime=0, detailStart=0;

  function renderOverview() {
    layout = layoutFor(wrap.getBoundingClientRect().width);
    overview.setAttribute('viewBox',`0 0 ${layout.width} ${layout.height}`);
    overview.innerHTML = overviewGraphic(layout,gas);
    beams = [...overview.querySelectorAll('[data-spectra-beam]')].map(node => ({
      node,start:Number(node.getAttribute('data-start')),end:Number(node.getAttribute('data-end')),offset:Number(node.getAttribute('data-offset'))
    }));
    glow = overview.querySelector('[data-spectra-glow]');
  }

  function renderDetail(time) {
    if (detail.hidden || !detailWidth) return;
    const scene = absorptionDetailGraphic({width:detailWidth,time:reduced?.matches ? 0 : time-detailStart});
    detailSvg.setAttribute('viewBox',scene.viewBox);
    detailSvg.innerHTML = scene.markup;
  }

  function renderDark() {
    if (!dark.open) return;
    const width = dark.getBoundingClientRect().width;
    if (width===darkWidth) return;
    darkWidth=width;
    const scene=darkLinesGraphic({width});
    darkSvg.setAttribute('viewBox',scene.viewBox);
    darkSvg.innerHTML=scene.markup;
  }

  function resize() {
    const width = wrap.getBoundingClientRect().width;
    if (layoutFor(width).width !== layout?.width) renderOverview();
    detailWidth = width;
    renderDetail(latestTime);
    renderDark();
  }

  function selectGas(next) {
    gas=next;
    model.setAttribute('data-gas',gas.symbol);
    for (const button of model.querySelectorAll('[data-spectra-gas]')) {
      button.setAttribute('aria-pressed',String(button.getAttribute('data-spectra-gas')===gas.symbol));
    }
    byId('sl-gas-note').textContent=`Glødefargen er ${gas.glowLabel}. ${gas.note}`;
    byId('sl-gas-sources').innerHTML=gasSources(gas);
    renderOverview();
    renderFrame(latestTime);
  }

  function renderFrame(time) {
    latestTime=time;
    for (const {node,start,end,offset} of beams) {
      const progress=reduced?.matches ? offset/2 : (time*.51+offset)%1;
      node.setAttribute('cx',String(start+(end-start)*progress));
    }
    glow?.setAttribute('opacity',String(reduced?.matches ? .9 : .85+.1*Math.sin(time*4)));
    if (!reduced?.matches) renderDetail(time);
  }

  function chooseGas(event) {
    const key=event.target.closest?.('[data-spectra-gas]')?.getAttribute('data-spectra-gas');
    if (key!==gas.symbol && gases.has(key)) selectGas(gases.get(key));
  }
  function toggleDetail() {
    detail.hidden=!detail.hidden;
    detailToggle.setAttribute('aria-expanded',String(!detail.hidden));
    if (!detail.hidden) {
      detailStart=api.now?.(overview)??latestTime;
      renderDetail(detailStart);
    }
  }
  function showDark() {
    dark.showModal();
    renderDark();
    darkClose.focus();
  }
  function closeDark() { dark.close(); }
  function restoreFocus() { darkOpen.focus(); }
  function changeMotion() {
    renderFrame(latestTime);
    if (reduced?.matches) renderDetail(latestTime);
  }

  model.addEventListener('click',chooseGas);
  detailToggle.addEventListener('click',toggleDetail);
  darkOpen.addEventListener('click',showDark);
  darkClose.addEventListener('click',closeDark);
  dark.addEventListener('close',restoreFocus);
  reduced?.addEventListener?.('change',changeMotion);
  selectGas(initialGas);
  resize();
  const stop=api.onFrame(renderFrame,overview);
  const observer=typeof ResizeObserver==='function' ? new ResizeObserver(resize) : null;
  observer?.observe(wrap);
  observer?.observe(dark);

  return ()=>{
    stop?.();
    observer?.disconnect();
    model.removeEventListener('click',chooseGas);
    detailToggle.removeEventListener('click',toggleDetail);
    darkOpen.removeEventListener('click',showDark);
    darkClose.removeEventListener('click',closeDark);
    dark.removeEventListener('close',restoreFocus);
    reduced?.removeEventListener?.('change',changeMotion);
    if (dark.open) dark.close();
  };
}
