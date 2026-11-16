import {elementSpectraData, elementSpectraMeta, getElementEmissionLines} from './element-spectra-data.js?v=20261116-flight-atoms2';
export {elementSpectraMeta, getElementEmissionLines} from './element-spectra-data.js?v=20261116-flight-atoms2';

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

export function renderEmissionSpectrum(lines,{small=false,label='Emisjonsspekter'}={}){
  const width=small?100:1000,height=small?100:188,left=small?0:46,right=small?100:964,top=small?0:14,bottom=small?100:117;
  const max=Math.max(1,...lines.map(x=>x[1]));
  const path=lines.map(([nm,intensity])=>{
    const x=left+(nm-380)/400*(right-left),opacity=.5+.5*Math.sqrt(Math.max(0,intensity)/max),color=wavelengthColor(nm);
    return `<line x1="${x.toFixed(3)}" x2="${x.toFixed(3)}" y1="${top}" y2="${bottom}" stroke="${color}" stroke-width="${small?1.4:2}" opacity="${opacity.toFixed(3)}"><title>${number(nm,3)} nm</title></line>`;
  }).join('');
  const ticks=small?'':[380,400,450,500,550,600,650,700,750,780].map(nm=>{
    const x=left+(nm-380)/400*(right-left);return `<path d="M${x} 124v7" stroke="#a5b2c1"/><text x="${x}" y="149" text-anchor="middle" fill="#dce5ef" font-size="15">${nm}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${width} ${height}" ${small?'aria-hidden="true" focusable="false"':`role="img" aria-label="${label}"`}><rect width="${width}" height="${height}" fill="#030508"/>${path}${small?'':`${ticks}<text x="500" y="177" text-anchor="middle" fill="#dce5ef" font-size="15">Bølgelengde λ (nm)</text>`}</svg>`;
}

function tableMarkup(stage='I',selected=1){
  const groups=Array.from({length:18},(_,i)=>`<span class="es-group" style="grid-column:${i+1};grid-row:1" aria-hidden="true">${i+1}</span>`).join('');
  const tiles=spectralElements.map(element=>{
    const lines=getElementEmissionLines(element.z,stage);
    return `<button type="button" class="es-tile${lines.length?'':' es-empty'}${hasTable(element.z)?'':' es-missing'}" data-es-z="${element.z}" style="grid-column:${element.col};grid-row:${element.row+1}" aria-pressed="${element.z===selected}" tabindex="${element.z===selected?0:-1}" aria-label="${element.z}: ${element.name}, ${element.symbol} ${stage}, ${lines.length} synlige linjer i utvalget" title="${element.name} · ${element.symbol} ${stage}">${renderEmissionSpectrum(lines,{small:true})}<span class="es-z">${element.z}</span><strong class="es-symbol">${element.symbol}</strong>${lines.length?'':'<span class="es-no-lines" aria-hidden="true">'+(hasTable(element.z)?'—':'?')+'</span>'}</button>`;
  }).join('');
  return `${groups}${tiles}<span class="es-gap" style="grid-column:3;grid-row:7" aria-hidden="true">57–71<br>↓</span><span class="es-gap" style="grid-column:3;grid-row:8" aria-hidden="true">89–103<br>↓</span><span class="es-series" style="grid-column:1 / 3;grid-row:10" aria-hidden="true">Lantanider</span><span class="es-series" style="grid-column:1 / 3;grid-row:11" aria-hidden="true">Aktinider</span>`;
}

const styles=`<style>
.es-data-legend{font-size:11px;color:var(--muted,#64748b);margin:4px 0 10px}.es-tile.es-missing{opacity:.55}.es-launch{margin:10px 0}.es-dialog{--es-surface:var(--surface,#fff);--es-ink:var(--ink,#17233b);--es-line:var(--line,#d0dae4);width:min(1450px,97vw);max-width:97vw;max-height:94vh;margin:auto;border:1px solid var(--es-line);border-radius:14px;padding:0;color:var(--es-ink);background:var(--es-surface);box-shadow:0 25px 100px #0008;overflow:auto}.es-dialog::backdrop{background:#07101bcc;backdrop-filter:blur(4px)}.es-shell{padding:0 20px 18px}.es-header{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 0 12px;background:var(--es-surface);border-bottom:1px solid var(--es-line)}.es-header h2{margin:0;font-size:clamp(18px,2vw,25px)}.es-close{flex:none;min-width:66px;min-height:36px;cursor:pointer}.es-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:12px 0}.es-toolbar label{display:flex;align-items:center;gap:8px;font-weight:650;font-size:12px}.es-toolbar select{max-width:100%;padding:7px;border:1px solid var(--es-line);border-radius:6px;color:inherit;background:var(--es-surface)}.es-toolbar p{margin:0;font-size:11px;color:var(--muted,#64748b)}.es-viewer{margin:0 0 12px}.es-viewer h3{margin:8px 0 6px;font-size:16px}.es-viewer svg{display:block;width:100%;height:auto;max-height:205px;background:#030508;border-radius:6px}.es-status{margin:7px 0;font-size:12px;line-height:1.5;min-height:1.5em}.es-periodic-scroll{width:100%;overflow-x:auto;padding-bottom:8px}.es-periodic{--es-height:clamp(43px,4.1vw,59px);display:grid;grid-template-columns:repeat(18,minmax(43px,1fr));grid-template-rows:17px repeat(7,var(--es-height)) 10px repeat(2,var(--es-height));gap:3px;min-width:825px}.es-group{align-self:center;text-align:center;color:var(--muted,#64748b);font-size:10px}.es-tile{position:relative;isolation:isolate;min-width:0;margin:0;padding:0;overflow:hidden;border:1px solid #485163;border-radius:3px;background:#030508;cursor:pointer;color:#fff;font:inherit;transition:border-color .12s}.es-tile svg{position:absolute;inset:0;width:100%;height:100%;z-index:-1}.es-tile[aria-pressed="true"]{outline:3px solid var(--blue,#3682c5);outline-offset:-3px;border-color:#c2e1ff}.es-tile:hover{border-color:#d7eaff}.es-tile:focus-visible{outline:3px solid #f1c75a;outline-offset:1px;z-index:2}.es-z{position:absolute;top:3px;left:4px;font-size:10px;font-weight:700;line-height:1;text-shadow:0 1px 3px #000,0 0 6px #000;background:#03050899;border-radius:2px;padding:1px 2px}.es-symbol{position:absolute;left:0;right:0;bottom:3px;text-align:center;font-size:clamp(17px,1.65vw,24px);line-height:1;font-weight:750;text-shadow:0 1px 3px #000,0 0 7px #000,0 0 3px #000}.es-no-lines{position:absolute;right:4px;top:3px;font-size:10px;color:#7f8b9a}.es-empty .es-symbol{color:#9ba5b5}.es-gap,.es-series{align-self:center;text-align:center;font-size:10px;line-height:1.5;color:var(--muted,#64748b)}.es-series{font-size:11px;text-align:right;padding-right:10px}.es-notes{border-top:1px solid var(--es-line);margin-top:8px;padding-top:8px;font-size:11px;line-height:1.5;color:var(--muted,#64748b)}.es-notes p{margin:5px 0}.es-notes a{color:var(--blue,#256da7)}.es-line-details{margin:10px 0;font-size:12px}.es-line-details summary{cursor:pointer}.es-line-values{display:flex;gap:6px 16px;flex-wrap:wrap;margin:8px 0;list-style:none;padding:0;font-variant-numeric:tabular-nums}.es-line-values li{min-width:90px}.es-line-values small{font-size:10px}.es-dialog button{font-family:inherit}.es-dialog .es-close{border:1px solid var(--es-line);border-radius:6px;background:var(--es-surface);color:inherit;padding:7px 10px}.es-launch button{min-height:38px}
@media(max-width:600px){.es-dialog{width:98vw;max-width:98vw;max-height:97vh}.es-shell{padding:0 10px 12px}.es-header{padding-top:10px}.es-header h2{font-size:18px}.es-toolbar{gap:8px}.es-toolbar label{display:grid;gap:4px}.es-viewer svg{min-height:110px}.es-periodic{--es-height:46px}.es-symbol{font-size:20px}.es-status{font-size:11px}}
@media(prefers-reduced-motion:reduce){.es-tile{transition:none}}
</style>`;

export const elementSpectraHtml=`${styles}<div class="es-launch"><button type="button" id="es-open" aria-haspopup="dialog" aria-controls="es-dialog" aria-expanded="false">Grunnstoffenes emisjonsspektre</button></div>
<dialog id="es-dialog" class="es-dialog" aria-labelledby="es-title" aria-describedby="es-description"><div class="es-shell"><header class="es-header"><h2 id="es-title">Grunnstoffenes emisjonsspektre</h2><button type="button" id="es-close" class="es-close" aria-label="Lukk emisjonsspektrene">Lukk ×</button></header><div class="es-toolbar"><label>Atomenes tilstand<select id="es-stage"><option value="I">I – nøytrale atomer</option><option value="II">II – én gang ioniserte atomer</option></select></label><p id="es-description">Velg en rute for å forstørre spekteret. Område: 380–780 nm.</p></div><section class="es-viewer" aria-labelledby="es-selected-title"><h3 id="es-selected-title">1 · H – hydrogen · H I</h3><div id="es-spectrum">${renderEmissionSpectrum(getElementEmissionLines(1),{label:'Hydrogens synlige emisjonslinjer, H I'})}</div><p id="es-status" class="es-status" aria-live="polite"></p></section><div class="es-periodic-scroll"><div id="es-periodic" class="es-periodic" role="group" aria-label="Periodesystem med 118 grunnstoffer. Bruk piltastene mellom rutene.">${tableMarkup()}</div></div><p class="es-data-legend">— Ingen sterke synlige linjer i utvalget. &nbsp; ? Ingen tabell i datagrunnlaget.</p><details class="es-line-details"><summary id="es-values-summary">Vis de valgte bølgelengdene</summary><ul id="es-line-values" class="es-line-values"></ul></details><footer class="es-notes"><p><b>I</b> betyr et nøytralt atom. <b>II</b> betyr et ion som har mistet ett elektron. Disse spektrene vises hver for seg.</p><p>Dette er et utvalg av NISTs <i>sterke linjer</i>, ikke alle mulige overganger. Maksimalt ${elementSpectraMeta.maxLinesPerStage} linjer vises per grunnstoff og tilstand. Lyset er normalisert innen hvert spekter; farger, lyshet og linjebredde er tilpasset skjermvisningen.</p><p>Bølgelengdene er i luft der NIST oppgir luftverdier. Tom rute betyr at utvalget ikke har registrerte synlige linjer for tilstanden. Det betyr ikke at grunnstoffet aldri kan sende ut lys.</p><p>Kilde: <a id="es-element-source" href="https://physics.nist.gov/PhysRefData/Handbook/Tables/hydrogentable2.htm" target="_blank" rel="noopener">NIST – sterke linjer for valgt grunnstoff</a> · <a href="${elementSpectraMeta.source}" target="_blank" rel="noopener">NIST Handbook of Basic Atomic Spectroscopic Data</a>. Hentet 16. november 2026.</p></footer></div></dialog>`;
export const elementSpectraMarkup=elementSpectraHtml;

export function mountElementSpectra(root,api){
  const find=id=>root.querySelector(`#${id}`),dialog=find('es-dialog'),openButton=find('es-open');
  if(!dialog||!openButton)return ()=>{};
  const table=find('es-periodic'),stageSelect=find('es-stage'),closeButton=find('es-close');
  let selected=1,stage='I',returnFocus=null;
  const showElement=(z,{focus=false}={})=>{
    const element=spectralElements[z-1];if(!element)return;
    selected=z;const lines=getElementEmissionLines(z,stage),row=elementSpectraData[z-1];
    find('es-selected-title').textContent=`${z} · ${element.symbol} – ${element.name} · ${element.symbol} ${stage}`;
    find('es-spectrum').innerHTML=renderEmissionSpectrum(lines,{label:`${element.name}, ${element.symbol} ${stage}: ${lines.length} synlige emisjonslinjer i utvalget`});
    find('es-status').textContent=lines.length?`${lines.length} synlige linjer i dette utvalget. ${element.symbol} ${stage}: ${stage==='I'?'nøytrale atomer':'ioner som har mistet ett elektron'}.`:hasTable(element.z)?'Ingen sterke synlige linjer for denne tilstanden i NIST-utvalget.':'Dette grunnstoffet har ingen tabell i NIST-utvalget. Det betyr ikke at atomet mangler spektrallinjer.';
    find('es-line-values').innerHTML=lines.map(([nm,,medium])=>`<li>${number(nm,3)} nm${medium===1?' <small>(vakuum)</small>':''}</li>`).join('')||'<li>Ingen linjer i utvalget.</li>';
    find('es-values-summary').textContent=`Vis bølgelengdene for ${element.symbol} ${stage} (${lines.length})`;
    find('es-element-source').setAttribute('href',row?.status==='checked'?row.source:elementSpectraMeta.source);
    find('es-element-source').textContent=row?.status==='checked'?`NIST – sterke linjer for ${element.name}`:'NIST – oversikt over grunnstoffer i håndboken';
    table.querySelectorAll('[data-es-z]').forEach(button=>{const active=Number(button.dataset.esZ)===z;button.setAttribute('aria-pressed',String(active));button.tabIndex=active?0:-1;if(active&&focus)button.focus();});
  };
  const onOpen=()=>{
    returnFocus=dialog.ownerDocument?.activeElement||openButton;
    if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
    openButton.setAttribute('aria-expanded','true');closeButton.focus();
  };
  const onClose=()=>{openButton.setAttribute('aria-expanded','false');if(returnFocus?.isConnected!==false)returnFocus?.focus?.();returnFocus=null;};
  const close=()=>{if(typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');onClose();}};
  const onCancel=event=>{event.preventDefault();close();};
  const onBackdrop=event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();};
  const onTile=event=>{const button=event.target.closest('[data-es-z]');if(button&&table.contains(button))showElement(Number(button.dataset.esZ));};
  const onStage=()=>{stage=stageSelect.value==='II'?'II':'I';table.innerHTML=tableMarkup(stage,selected);showElement(selected);};
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
  openButton.addEventListener('click',onOpen);closeButton.addEventListener('click',close);dialog.addEventListener('cancel',onCancel);dialog.addEventListener('close',onClose);dialog.addEventListener('click',onBackdrop);table.addEventListener('click',onTile);table.addEventListener('keydown',onKeyboard);stageSelect.addEventListener('change',onStage);
  showElement(1);
  return ()=>{openButton.removeEventListener('click',onOpen);closeButton.removeEventListener('click',close);dialog.removeEventListener('cancel',onCancel);dialog.removeEventListener('close',onClose);dialog.removeEventListener('click',onBackdrop);table.removeEventListener('click',onTile);table.removeEventListener('keydown',onKeyboard);stageSelect.removeEventListener('change',onStage);returnFocus=null;openButton.setAttribute('aria-expanded','false');if(dialog.open)close();};
}
