import {elementSpectraData, elementSpectraMeta, getElementEmissionLines} from './element-spectra-data.js?v=20261116-layout2';
export {elementSpectraMeta, getElementEmissionLines} from './element-spectra-data.js?v=20261116-layout2';

const hasTable=z=>elementSpectraData.some(row=>row.z===z);
const symbols='H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
const names='hydrogen helium litium beryllium bor karbon nitrogen oksygen fluor neon natrium magnesium aluminium silisium fosfor svovel klor argon kalium kalsium scandium titan vanadium krom mangan jern kobolt nikkel kobber sink gallium germanium arsen selen brom krypton rubidium strontium yttrium zirkonium niob molybden technetium ruthenium rhodium palladium sølv kadmium indium tinn antimon tellur jod xenon cesium barium lantan cerium praseodym neodym prometium samarium europium gadolinium terbium dysprosium holmium erbium thulium ytterbium lutetium hafnium tantal wolfram rhenium osmium iridium platina gull kvikksølv thallium bly vismut polonium astat radon francium radium actinium thorium protactinium uran neptunium plutonium americium curium berkelium californium einsteinium fermium mendelevium nobelium lawrencium rutherfordium dubnium seaborgium bohrium hassium meitnerium darmstadtium røntgenium copernicium nihonium flerovium moscovium livermorium tenness oganesson'.split(' ');

export function getElementPlacement(z){
  if(!Number.isInteger(z)||z<1||z>118)return null;
  if(z<=2)return {row:1,col:z===1?1:18};
  if(z<=10)return {row:2,col:z<=4?z-2:z+8};
  if(z<=18)return {row:3,col:z<=12?z-10:z};
  if(z<=36)return {row:4,col:z-18};
  if(z<=54)return {row:5,col:z-36};
  if(z<=56)return {row:6,col:z-54};
  if(z<=71)return {row:9,col:z-54};
  if(z<=86)return {row:6,col:z-68};
  if(z<=88)return {row:7,col:z-86};
  if(z<=103)return {row:10,col:z-86};
  return {row:7,col:z-100};
}

export const spectralElements=Object.freeze(symbols.map((symbol,i)=>Object.freeze({
  z:i+1,symbol,name:names[i],...getElementPlacement(i+1)
})));

export function wavelengthColor(nm){
  let r=0,g=0,b=0;
  if(nm>=380&&nm<440){r=(440-nm)/60;b=1;}
  else if(nm<490&&nm>=440){g=(nm-440)/50;b=1;}
  else if(nm<510&&nm>=490){g=1;b=(510-nm)/20;}
  else if(nm<580&&nm>=510){r=(nm-510)/70;g=1;}
  else if(nm<645&&nm>=580){r=1;g=(645-nm)/65;}
  else if(nm<=780&&nm>=645)r=1;
  const edge=nm<420?.45+.55*(nm-380)/40:nm>700?.45+.55*(780-nm)/80:1;
  const channel=v=>Math.round(255*Math.pow(Math.max(0,Math.min(1,v*Math.max(0,edge))),.8));
  return `rgb(${channel(r)},${channel(g)},${channel(b)})`;
}

const number=(value,digits=2)=>Number(value).toLocaleString('nb-NO',{maximumFractionDigits:digits,minimumFractionDigits:digits});

export function renderEmissionSpectrum(lines,{small=false,label='Emisjonsspekter',stretch=false,strokeWidth=small?1.4:2}={}){
  const width=small?100:1000,height=small?100:188,left=small?0:46,right=small?100:964,top=small?0:14,bottom=small?100:117;
  const max=Math.max(1,...lines.map(x=>x[1]));
  const path=lines.map(([nm,intensity])=>{
    const x=left+(nm-380)/400*(right-left),opacity=.5+.5*Math.sqrt(Math.max(0,intensity)/max),color=wavelengthColor(nm);
    return `<line x1="${x.toFixed(3)}" x2="${x.toFixed(3)}" y1="${top}" y2="${bottom}" stroke="${color}" stroke-width="${strokeWidth}"${stretch?' vector-effect="non-scaling-stroke"':''} opacity="${opacity.toFixed(3)}"><title>${number(nm,3)} nm</title></line>`;
  }).join('');
  const ticks=small?'':[380,400,450,500,550,600,650,700,750,780].map(nm=>{
    const x=left+(nm-380)/400*(right-left);return `<path d="M${x} 124v7" stroke="#a5b2c1"/><text x="${x}" y="149" text-anchor="middle" fill="#dce5ef" font-size="15">${nm}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${width} ${height}"${stretch?' preserveAspectRatio="none"':''} ${small?'aria-hidden="true" focusable="false"':`role="img" aria-label="${label}"`}><rect width="${width}" height="${height}" fill="#030508"/>${path}${small?'':`${ticks}<text x="500" y="177" text-anchor="middle" fill="#dce5ef" font-size="15">Bølgelengde λ (nm)</text>`}</svg>`;
}

function tableMarkup(){
  const groups=Array.from({length:18},(_,i)=>`<span class="es-group" style="grid-column:${i+1};grid-row:1" aria-hidden="true">${i+1}</span>`).join('');
  const tiles=spectralElements.map(element=>{
    const lines=getElementEmissionLines(element.z), available=hasTable(element.z), active=element.z===1;
    const marker=lines.length?'':`<span class="es-no-lines" aria-hidden="true">${available?'—':'?'}</span>`;
    return `<button type="button" class="es-tile${lines.length?'':' es-empty'}${available?'':' es-missing'}" data-es-z="${element.z}" style="grid-column:${element.col};grid-row:${element.row+1}" aria-pressed="${active}" tabindex="${active?0:-1}" aria-label="${element.z} · ${element.name}, ${element.symbol}, ${lines.length} synlige linjer i utvalget" title="${element.name} · ${element.symbol}"><span class="es-swatch">${renderEmissionSpectrum(lines,{small:true,stretch:true,strokeWidth:.85})}${marker}</span><strong class="es-symbol">${element.symbol}</strong></button>`;
  }).join('');
  return `${groups}${tiles}<span class="es-gap" style="grid-column:3;grid-row:7" aria-hidden="true">57–71<br>↓</span><span class="es-gap" style="grid-column:3;grid-row:8" aria-hidden="true">89–103<br>↓</span><span class="es-series" style="grid-column:1 / 3;grid-row:10" aria-hidden="true">Lantanider</span><span class="es-series" style="grid-column:1 / 3;grid-row:11" aria-hidden="true">Aktinider</span>`;
}

// Keep the selected spectrum wide without shrinking SVG axis text on narrow screens.
const renderDialogSpectrum=(lines,label)=>'<div class="es-spectrum-preview" role="img" aria-label="'+label+'"><div class="es-spectrum-area">'+renderEmissionSpectrum(lines,{small:true,stretch:true,strokeWidth:2})+'</div><div class="es-spectrum-axis" aria-hidden="true"><span style="left:0">380</span><span style="left:17.5%">450</span><span style="left:42.5%">550</span><span style="left:67.5%">650</span><span style="left:100%">780 nm</span></div></div>';

const styles=`<style>
.es-launch{margin:10px 0}.es-dialog,.es-info-dialog{--es-surface:var(--surface,#fff);--es-ink:var(--ink,#17233b);--es-line:var(--line,#d0dae4);margin:auto;border:1px solid var(--es-line);border-radius:13px;padding:0;color:var(--es-ink);background:var(--es-surface);box-shadow:0 25px 100px #0008;box-sizing:border-box}.es-dialog{width:min(1450px,97vw);max-width:97vw;height:min(920px,95vh);height:min(920px,95dvh);max-height:95dvh;overflow:hidden}.es-dialog::backdrop,.es-info-dialog::backdrop{background:#07101bcc;backdrop-filter:blur(4px)}.es-shell{box-sizing:border-box;height:100%;min-height:0;padding:12px 18px;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto auto;gap:8px}.es-header{display:flex;align-items:center;justify-content:space-between;gap:14px;min-width:0;border-bottom:1px solid var(--es-line);padding:0 0 8px;background:var(--es-surface)}.es-header h2{margin:0;font-size:clamp(16px,1.7vw,23px);line-height:1.25}.es-close{flex:none;min-width:56px;min-height:30px;cursor:pointer}.es-viewer{margin:0;min-width:0}.es-viewer h3{margin:0 0 5px;font-size:14px;line-height:1.25}.es-spectrum-preview{background:#030508;border-radius:6px;padding:6px 8px 0;overflow:hidden}.es-spectrum-area{height:clamp(46px,10vh,92px);height:clamp(46px,10dvh,92px)}.es-spectrum-area svg{display:block;width:100%;height:100%;background:#030508}.es-spectrum-axis{height:21px;position:relative;margin-top:3px;color:#dce5ef;font-size:10px;line-height:16px;font-variant-numeric:tabular-nums}.es-spectrum-axis span{position:absolute;transform:translateX(-50%);white-space:nowrap}.es-spectrum-axis span:first-child{transform:none}.es-spectrum-axis span:last-child{transform:translateX(-100%)}.es-status{margin:5px 0 0;font-size:11px;line-height:1.4;min-height:1.4em}.es-periodic-scroll{width:100%;height:100%;min-height:0;min-width:0;overflow:visible;padding:0}.es-periodic{display:grid;width:100%;height:100%;min-width:0;min-height:0;grid-template-columns:repeat(18,minmax(0,1fr));grid-template-rows:13px repeat(7,minmax(0,1fr)) 6px repeat(2,minmax(0,1fr));gap:3px}.es-group{align-self:center;text-align:center;color:var(--muted,#64748b);font-size:10px;line-height:1}.es-tile{display:block;position:relative;min-width:0;min-height:0;margin:0;padding:0;overflow:hidden;border:1px solid #485163;border-radius:3px;background:#030508;cursor:pointer;color:#fff;font:inherit;transition:border-color .12s}
.es-swatch{position:absolute;inset:0}.es-swatch svg{display:block;width:100%;height:100%;background:#030508}.es-tile[aria-pressed="true"]{outline:3px solid var(--blue,#3682c5);outline-offset:-3px;border-color:#c2e1ff}.es-tile:hover{border-color:#d7eaff}.es-tile:focus-visible{outline:3px solid #f1c75a;outline-offset:-1px;z-index:2}
.es-symbol{position:absolute;top:2px;left:2px;padding:1px 2px;border-radius:2px;background:#080f1ad9;color:#e7eff8;font-size:clamp(8px,.9vw,12px);line-height:1;font-weight:700;white-space:nowrap}.es-no-lines{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;font-size:10px;color:#9aa5b2}.es-empty .es-symbol{color:#9ba5b5}.es-gap,.es-series{align-self:center;text-align:center;font-size:clamp(5px,.75vw,10px);line-height:1.3;color:var(--muted,#64748b)}.es-series{text-align:right;padding-right:5px}.es-data-legend{font-size:10px;line-height:1.3;color:var(--muted,#64748b);margin:0}.es-bottom{display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:1px solid var(--es-line);padding-top:6px;font-size:10px;color:var(--muted,#64748b)}.es-bottom p{margin:0}.es-dialog button,.es-info-dialog button{font-family:inherit}.es-dialog .es-close,.es-info-dialog .es-close,.es-info-open{border:1px solid var(--es-line);border-radius:6px;background:var(--es-surface);color:inherit;padding:5px 9px}.es-info-open{cursor:pointer;font-size:11px;white-space:nowrap;min-height:28px}.es-launch button{min-height:38px}.es-info-dialog{width:min(680px,94vw);max-width:94vw;max-height:90vh;max-height:90dvh;overflow:auto;padding:16px 20px}.es-info-dialog h3{margin:16px 0 8px;font-size:14px}.es-line-values{display:flex;gap:6px 16px;flex-wrap:wrap;margin:8px 0 16px;list-style:none;padding:0;font-size:12px;font-variant-numeric:tabular-nums}.es-line-values li{min-width:90px}.es-line-values small{font-size:10px}.es-notes{border-top:1px solid var(--es-line);padding-top:8px;font-size:11px;line-height:1.5;color:var(--muted,#64748b)}.es-notes p{margin:5px 0}.es-notes a{color:var(--blue,#256da7)}
@media(max-width:600px){.es-dialog{width:98vw;max-width:98vw;height:97vh;height:97dvh;max-height:97dvh}.es-shell{padding:9px 8px;gap:6px}.es-header{gap:6px;padding-bottom:6px}.es-header h2{font-size:16px}.es-close{min-width:44px;min-height:28px;padding:4px 6px!important;font-size:11px}.es-viewer h3{font-size:12px}.es-spectrum-area{height:64px}.es-spectrum-axis{font-size:9px;height:17px}.es-periodic{gap:2px;grid-template-rows:10px repeat(7,minmax(0,1fr)) 4px repeat(2,minmax(0,1fr))}.es-group{font-size:7px}
.es-symbol{top:1px;left:1px;padding:1px;font-size:clamp(7px,2vw,9px)}.es-no-lines{font-size:8px}.es-status{font-size:10px}.es-bottom{gap:6px;font-size:9px}.es-info-open{font-size:10px;padding:4px 6px}.es-data-legend{font-size:9px}.es-info-dialog{padding:12px}.es-info-dialog h2{font-size:16px}}
@media(max-height:560px){.es-shell{padding-top:8px;padding-bottom:8px;gap:5px}.es-header{padding-bottom:5px}.es-header h2{font-size:16px}.es-close{min-height:25px}.es-spectrum-area{height:40px}.es-viewer h3{font-size:11px;margin-bottom:3px}.es-status{font-size:9px;margin-top:3px}.es-bottom{padding-top:4px}.es-info-open{min-height:23px;font-size:10px}}
@media(prefers-reduced-motion:reduce){.es-tile{transition:none}}
</style>`;

export const elementSpectraHtml=`${styles}<div class="es-launch"><button type="button" id="es-open" aria-haspopup="dialog" aria-controls="es-dialog" aria-expanded="false">Grunnstoffenes emisjonsspektre</button></div>
<dialog id="es-dialog" class="es-dialog" aria-labelledby="es-title">
  <div class="es-shell">
    <header class="es-header"><h2 id="es-title">Grunnstoffenes emisjonsspektre</h2><button type="button" id="es-close" class="es-close" aria-label="Lukk emisjonsspektrene">Lukk ×</button></header>
    <section class="es-viewer" aria-labelledby="es-selected-title">
      <h3 id="es-selected-title">1 · H – hydrogen</h3>
      <div id="es-spectrum">${renderDialogSpectrum(getElementEmissionLines(1),'Hydrogens synlige emisjonslinjer')}</div>
      <p id="es-status" class="es-status" aria-live="polite"></p>
    </section>
    <div class="es-periodic-scroll"><div id="es-periodic" class="es-periodic" role="group" aria-label="Periodesystem med 118 grunnstoffer. Bruk piltastene mellom rutene.">${tableMarkup()}</div></div>
    <p class="es-data-legend">— Ingen sterke synlige linjer i utvalget. &nbsp; ? Ingen tabell i datagrunnlaget.</p>
    <footer class="es-bottom"><p>NIST · Utvalg av sterke linjer</p><button type="button" id="es-info-open" class="es-info-open" aria-haspopup="dialog" aria-controls="es-info-dialog" aria-expanded="false">Bølgelengder og kilde</button></footer>
  </div>
</dialog>
<dialog id="es-info-dialog" class="es-info-dialog" aria-labelledby="es-info-title">
  <header class="es-header"><h2 id="es-info-title">Bølgelengder og datagrunnlag</h2><button type="button" id="es-info-close" class="es-close">Tilbake ×</button></header>
  <h3 id="es-values-summary">Valgte bølgelengder</h3>
  <ul id="es-line-values" class="es-line-values"></ul>
  <footer class="es-notes">
    <p>Vi viser opptil ${elementSpectraMeta.maxLinesPerStage} av NISTs sterke linjer per grunnstoff. Lysstyrken skaleres innenfor hvert spekter. Farger og linjebredde er tilpasset skjermen.</p>
    <p>Bølgelengdene er i luft der NIST oppgir luftverdier.</p>
    <p><a id="es-element-source" href="https://physics.nist.gov/PhysRefData/Handbook/Tables/hydrogentable2.htm" target="_blank" rel="noopener">NIST – sterke linjer for valgt grunnstoff</a> · <a href="${elementSpectraMeta.source}" target="_blank" rel="noopener">NIST Handbook of Basic Atomic Spectroscopic Data</a>. Hentet 16. november 2026.</p>
  </footer>
</dialog>`;
export const elementSpectraMarkup=elementSpectraHtml;

export function mountElementSpectra(root,api){
  const find=id=>root.querySelector(`#${id}`),dialog=find('es-dialog'),openButton=find('es-open');
  if(!dialog||!openButton)return ()=>{};
  const table=find('es-periodic'),closeButton=find('es-close'),infoDialog=find('es-info-dialog'),infoOpen=find('es-info-open'),infoClose=find('es-info-close');
  let returnFocus=null;
  const showElement=(z,{focus=false}={})=>{
    const element=spectralElements[z-1];if(!element)return;
    const lines=getElementEmissionLines(z),row=elementSpectraData[z-1];
    const count=`${lines.length} ${lines.length===1?'synlig linje':'synlige linjer'} i NIST-utvalget`;
    find('es-selected-title').textContent=`${z} · ${element.symbol} – ${element.name}`;
    find('es-spectrum').innerHTML=renderDialogSpectrum(lines,`${element.name}, ${count}`);
    find('es-status').textContent=lines.length?`${count}.`:hasTable(element.z)?'Ingen sterke synlige linjer i NIST-utvalget.':'Dette grunnstoffet har ingen tabell i NIST-utvalget. Atomet kan likevel ha spektrallinjer.';
    find('es-line-values').innerHTML=lines.map(([nm,,medium])=>`<li>${number(nm,3)} nm${medium===1?' <small>(vakuum)</small>':''}</li>`).join('')||'<li>Ingen linjer i utvalget.</li>';
    find('es-values-summary').textContent=`Bølgelengder for ${element.symbol} (${lines.length})`;
    find('es-element-source').setAttribute('href',row?.status==='checked'?row.source:elementSpectraMeta.source);
    find('es-element-source').textContent=row?.status==='checked'?`NIST – sterke linjer for ${element.name}`:'NIST – oversikt over grunnstoffer i håndboken';
    table.querySelectorAll('[data-es-z]').forEach(button=>{const active=Number(button.dataset.esZ)===z;button.setAttribute('aria-pressed',String(active));button.tabIndex=active?0:-1;if(active&&focus)button.focus();});
  };
  const onInfoClosed=()=>{infoOpen.setAttribute('aria-expanded','false');if(dialog.open)infoOpen.focus();};
  const closeInfo=()=>{if(!infoDialog.open)return;if(typeof infoDialog.close==='function')infoDialog.close();else{infoDialog.removeAttribute('open');onInfoClosed();}};
  const openInfo=()=>{if(!infoDialog.open){if(typeof infoDialog.showModal==='function')infoDialog.showModal();else infoDialog.setAttribute('open','');}infoOpen.setAttribute('aria-expanded','true');infoClose.focus();};
  const cancelInfo=event=>{event.preventDefault();closeInfo();};
  const backdropInfo=event=>{if(event.target!==infoDialog)return;const box=infoDialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)closeInfo();};
  const onOpen=()=>{
    returnFocus=dialog.ownerDocument?.activeElement||openButton;
    if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
    openButton.setAttribute('aria-expanded','true');closeButton.focus();
  };
  const onClose=()=>{openButton.setAttribute('aria-expanded','false');if(returnFocus?.isConnected!==false)returnFocus?.focus?.();returnFocus=null;};
  const close=()=>{closeInfo();if(typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');onClose();}};
  const onCancel=event=>{event.preventDefault();close();};
  const onBackdrop=event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();};
  const onTile=event=>{const button=event.target.closest('[data-es-z]');if(button&&table.contains(button))showElement(Number(button.dataset.esZ));};
  const onKeyboard=event=>{
    const button=event.target.closest('[data-es-z]');if(!button||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
    event.preventDefault();const current=spectralElements[Number(button.dataset.esZ)-1];let z=current.z;
    if(event.key==='Home')z=1;else if(event.key==='End')z=118;else if(event.key==='ArrowRight')z=z===118?1:z+1;else if(event.key==='ArrowLeft')z=z===1?118:z-1;else{
      const sign=event.key==='ArrowDown'?1:-1,candidates=spectralElements.filter(x=>(x.row-current.row)*sign>0);
      candidates.sort((a,b)=>(Math.abs(a.row-current.row)*20+Math.abs(a.col-current.col))-(Math.abs(b.row-current.row)*20+Math.abs(b.col-current.col)));
      if(candidates.length)z=candidates[0].z;
    }
    showElement(z,{focus:true});
  };
  infoOpen.addEventListener('click',openInfo);infoClose.addEventListener('click',closeInfo);infoDialog.addEventListener('close',onInfoClosed);infoDialog.addEventListener('cancel',cancelInfo);infoDialog.addEventListener('click',backdropInfo);
  openButton.addEventListener('click',onOpen);closeButton.addEventListener('click',close);dialog.addEventListener('cancel',onCancel);dialog.addEventListener('close',onClose);dialog.addEventListener('click',onBackdrop);table.addEventListener('click',onTile);table.addEventListener('keydown',onKeyboard);
  showElement(1);
  return ()=>{infoOpen.removeEventListener('click',openInfo);infoClose.removeEventListener('click',closeInfo);infoDialog.removeEventListener('close',onInfoClosed);infoDialog.removeEventListener('cancel',cancelInfo);infoDialog.removeEventListener('click',backdropInfo);closeInfo();openButton.removeEventListener('click',onOpen);closeButton.removeEventListener('click',close);dialog.removeEventListener('cancel',onCancel);dialog.removeEventListener('close',onClose);dialog.removeEventListener('click',onBackdrop);table.removeEventListener('click',onTile);table.removeEventListener('keydown',onKeyboard);returnFocus=null;openButton.setAttribute('aria-expanded','false');if(dialog.open)close();};
}
