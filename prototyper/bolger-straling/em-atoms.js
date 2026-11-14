// Self-contained teaching models. Physical quantities use SI units internally.
const C = 299792458, H = 6.62607015e-34, EV = 1.602176634e-19;
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
const sharedStyle = `<style>
.ema-spectrum-svg,.ema-atom-svg,.ema-com-svg{display:block;width:100%;height:auto;overflow:visible}
.ema-dark{fill:#112e3c}.ema-svg-text{fill:var(--ink,#183b40);font:13px system-ui,sans-serif}.ema-muted-text{fill:var(--muted,#526a72);font:12px system-ui,sans-serif}.ema-light-text{fill:#d6e7e8;font:13px system-ui,sans-serif}
.ema-gridline{stroke:var(--line,#d8e3de);stroke-width:1}.ema-region-buttons{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.ema-region-buttons button{font-size:12px;padding:7px 11px;border:1px solid var(--line,#d8e3de);border-radius:8px;background:var(--surface,#fff);color:var(--ink,#183b40);cursor:pointer}.ema-region-buttons button[aria-pressed=true]{background:#1b6360;color:#fff;border-color:#1b6360}
.ema-values{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.ema-values>div{padding:12px;border:1px solid var(--line,#d8e3de);border-radius:10px}.ema-values small{display:block;font-size:11px;color:var(--muted,#526a72);margin-bottom:4px}.ema-values strong{font-size:17px;font-variant-numeric:tabular-nums}.ema-values sup{font-size:.7em}.ema-rgb-layout{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:center}.ema-rgb-controls label{display:grid;grid-template-columns:42px 1fr 34px;align-items:center;gap:10px;margin:16px 0;font-size:13px}.ema-rgb-controls input{width:100%;min-width:0}.ema-rgb-controls output{font-variant-numeric:tabular-nums;text-align:right}.ema-rgb-screen{width:100%;aspect-ratio:1.8;border-radius:12px;display:grid;place-items:center;border:1px solid #48636c;color:white;position:relative;overflow:hidden}.ema-rgb-screen>svg{position:absolute;inset:0;width:100%;height:100%}.ema-rgb-screen output{position:absolute;bottom:12px;font:12px ui-monospace,monospace;padding:4px 7px;border-radius:5px;background:#102b3a;color:white}.ema-message-input{font:inherit;width:110px;padding:8px;border:1px solid var(--line,#d8e3de);border-radius:7px;background:var(--surface,#fff);color:inherit}.ema-byte-options{max-width:260px}.ema-signal-result{padding:12px 16px;border-radius:9px;background:var(--sidebar,#f0f5f0);font-size:14px}.ema-signal-result code{font-size:15px;letter-spacing:3px}.ema-atom-readout{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:8px}.ema-photon-swatch{width:13px;height:13px;border-radius:50%;display:inline-block;margin-right:5px}.ema-spectrum-callout{padding:12px 15px;border-left:3px solid #4b9993;background:var(--sidebar,#eef4f1);font-size:14px;line-height:1.6}.ema-app-table td:first-child{white-space:nowrap}.ema-process{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:16px 0}.ema-process>div{padding:12px;background:var(--sidebar,#f0f5f0);border:1px solid var(--line,#d8e3de);border-radius:9px;font-size:12px}.ema-process strong{display:block;margin-bottom:5px;font-size:13px}.ema-spectrum-hint{font-size:12px;color:var(--muted,#526a72)}
@media(max-width:600px){.ema-rgb-layout{grid-template-columns:1fr}.ema-values{grid-template-columns:1fr}.ema-values>div{display:flex;align-items:center;justify-content:space-between;gap:10px}.ema-values small{margin:0}.ema-process{grid-template-columns:1fr 1fr}.ema-controls{gap:12px}.ema-atom-readout{font-size:13px}.ema-app-table td:first-child{white-space:normal}}
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
  const x = log => 30 + (log - 4) / 18 * 700;
  const selectedRegion = log => regions.findIndex((r,i) => log >= r.min && (log < r.max || i === regions.length-1));
  function renderSpectrum(t) {
    const log = Number(freq.value), f = 10**log, nm = C/f*1e9;
    const ri = selectedRegion(log), region = regions[ri];
    const color = wavelengthColor(nm);
    const cycles = 1.2 + (log-4)*.46;
    const pts = Array.from({length:401},(_,i) => [35+i*1.72,205-28*Math.sin((i/400*cycles-t*.7)*Math.PI*2)]);
    let markup = `<title>Det elektromagnetiske spekteret</title><desc>En logaritmisk frekvensakse fra ti opphøyd i fire til ti opphøyd i tjueto hertz. Valgt stråling har markør og skjematisk bølge.</desc>`;
    markup += `<defs><linearGradient id="ema-visible-gradient"><stop offset="0" stop-color="#f36464"/><stop offset=".2" stop-color="#efb55b"/><stop offset=".4" stop-color="#a8cd6c"/><stop offset=".6" stop-color="#55b4cb"/><stop offset=".8" stop-color="#657dce"/><stop offset="1" stop-color="#a87ace"/></linearGradient></defs>`;
    markup += regions.map((r,i) => `<rect x="${x(r.min)}" y="68" width="${x(r.max)-x(r.min)}" height="32" fill="${i===3?'url(#ema-visible-gradient)':r.color}" opacity="${i===ri?1:.62}"/>`).join('');
    const labelXs=[110,260,355,420,500,590,690], labelYs=[41,41,41,13,41,41,41];
    markup += regions.map((r,i)=>`<line x1="${x((r.min+r.max)/2)}" x2="${labelXs[i]}" y1="65" y2="${labelYs[i]+6}" stroke="${r.color}"/><text x="${labelXs[i]}" y="${labelYs[i]}" text-anchor="middle" class="ema-svg-text" style="font-size:12px">${r.name}</text>`).join('');
    markup += [4,6,8,10,12,14,16,18,20,22].map(p=>`<line x1="${x(p)}" x2="${x(p)}" y1="100" y2="107" class="ema-gridline"/><text x="${x(p)}" y="124" text-anchor="middle" class="ema-muted-text">10<tspan baseline-shift="super" font-size="8">${p}</tspan></text>`).join('');
    markup += `<text x="380" y="147" text-anchor="middle" class="ema-muted-text">Frekvens (Hz) · like avstander betyr samme faktor</text><path d="M${x(log)-6} 58 l6 8 6-8Z" fill="#1d6964"/><line x1="${x(log)}" x2="${x(log)}" y1="68" y2="101" stroke="#173e44" stroke-width="2"/>`;
    markup += `<rect x="20" y="167" width="720" height="78" rx="10" class="ema-dark"/><path d="${line(pts)}" fill="none" stroke="${nm>=380&&nm<=780?color:'#9dcec3'}" stroke-width="2.5"/><text x="380" y="267" text-anchor="middle" class="ema-muted-text">Bølgeformen er skjematisk; bølgelengdene her er ikke i målestokk.</text>`;
    graph.innerHTML=markup;
    q('#ema-wavelength-output').innerHTML=`${sci(C/f)} m`;
    q('#ema-frequency-output').innerHTML=`${sci(f)} Hz`;
    q('#ema-energy-output').innerHTML=`${sci(H*f/EV)} eV`;
    q('#ema-current-region').innerHTML=`<strong>${region.name}</strong> · ${region.use}<br>${region.point}`;
    buttonHost.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===ri)));
  }
  freq.addEventListener('input',()=>api.repaint());
  buttonHost.querySelectorAll('button').forEach((b,i)=>b.addEventListener('click',()=>{freq.value=Math.log10(regions[i].f);api.repaint();}));
  api.onFrame(renderSpectrum);
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

function mountAtom(root, api) {
  const q=s=>root.querySelector(s), upper=q('#ema-level'), mode=q('#ema-transition-mode');
  const y=[0,270,218,166,114,62,10];
  function render(t){
    const n=Number(upper.value), emission=mode.value==='emission';
    const delta=13.6*(1/4-1/n**2), nm=1239.841984/delta, col=wavelengthColor(nm);
    const from=emission?n:2,to=emission?2:n;
    const photonP=(t*.34)%1, electronLevel=photonP<.27?from:to;
    const marker=`<defs><marker id="ema-transition-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" fill="${col}"/></marker><linearGradient id="ema-atom-rainbow"><stop stop-color="#864bd2"/><stop offset=".25" stop-color="#397fd9"/><stop offset=".45" stop-color="#43b686"/><stop offset=".65" stop-color="#e4c453"/><stop offset="1" stop-color="#e35b56"/></linearGradient></defs>`;
    let svg=`<title>Energinivåer og hydrogenets synlige spekter</title><desc>Elektronet skifter mellom nivå ${from} og ${to}. Energien overføres med ett foton. Nivåavstandene i tegningen er skjematiske.</desc>${marker}`;
    svg+=`<text x="35" y="-15" class="ema-muted-text">Energi øker oppover ↑</text>`;
    for(let i=1;i<=6;i++)svg+=`<line x1="40" x2="270" y1="${y[i]}" y2="${y[i]}" stroke="${i===n||i===2?'#5a9691':'#c6d4d1'}" stroke-width="${i===n||i===2?2.5:1}"/><text x="286" y="${y[i]+5}" class="ema-svg-text">n = ${i}</text><text x="360" y="${y[i]+5}" class="ema-muted-text">${fmt(-13.6/i**2,2)} eV</text>`;
    svg+=`<path d="M180 ${y[from]+(emission?9:-9)}V${y[to]+(emission?-15:15)}" stroke="${col}" stroke-width="3" marker-end="url(#ema-transition-arrow)"/><circle cx="95" cy="${y[electronLevel]}" r="7" fill="${col}" stroke="#fff" stroke-width="2"/>`;
    const photonX=emission?435+(photonP-.27)/.73*270:730-photonP/.27*270;
    const photonPts=Array.from({length:50},(_,i)=>[photonX+i*.5,148+6*Math.sin(i*.5)]);
    svg+=`<rect x="465" y="92" width="270" height="110" rx="12" class="ema-dark"/><text x="600" y="118" text-anchor="middle" class="ema-light-text">${emission?'Foton sendes ut':'Foton tas opp'}</text>${(emission&&photonP>=.27)||(!emission&&photonP<.27)?`<path d="${line(photonPts)}" fill="none" stroke="${col}" stroke-width="3"/>`:''}<text x="600" y="183" text-anchor="middle" class="ema-light-text">${fmt(nm,0)} nm · ${fmt(delta,2)} eV</text>`;
    svg+=`<text x="600" y="234" text-anchor="middle" class="ema-svg-text">${emission?'n = '+n+' → n = 2':'n = 2 → n = '+n}</text><text x="600" y="256" text-anchor="middle" class="ema-muted-text">${emission?'Atomet mister energi':'Atomet får tilført energi'}</text>`;
    q('#ema-atom-plot').innerHTML=svg;
    const sx=lambda=>50+(lambda-380)/400*650;
    let spec=`<title>${emission?'Emisjonsspekter':'Absorpsjonsspekter'} for hydrogen</title><desc>Hydrogen har synlige linjer omkring 410, 434, 486 og 656 nanometer.</desc><rect x="35" y="26" width="690" height="46" rx="6" fill="${emission?'#102735':'url(#ema-atom-rainbow)'}"/>`;
    for(const val of [410.2,434,486.1,656.3])spec+=`<line x1="${sx(val)}" x2="${sx(val)}" y1="28" y2="70" stroke="${emission?wavelengthColor(val):'#14232c'}" stroke-width="${Math.abs(val-nm)<2?6:3}"/>`;
    spec+=`<path d="M${sx(nm)-6} 14 l6 9 6-9Z" fill="${col}"/>`;
    for(const val of [400,500,600,700])spec+=`<text x="${sx(val)}" y="95" text-anchor="middle" class="ema-muted-text">${val} nm</text>`;
    q('#ema-atom-spectrum').innerHTML=spec;
    q('#ema-transition-readout').innerHTML=`<span><span class="ema-photon-swatch" style="background:${col}"></span><strong>${fmt(nm,0)} nm</strong></span><span>ΔE = ${fmt(delta,2)} eV</span><span>f = ${sci(delta*EV/H)} Hz</span>`;
  }
  [upper,mode].forEach(el=>el.addEventListener('change',()=>api.repaint()));
  api.onFrame(render);
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
    svg+=`<text x="12" y="24" class="ema-muted-text">Biter</text><text x="12" y="127" class="ema-muted-text">Bølge</text><text x="12" y="242" class="ema-muted-text">Lest</text>`;
    for(let b=0;b<8;b++){
      const xx=left+b*width;
      svg+=`<rect x="${xx}" y="7" width="${width-3}" height="42" rx="7" fill="${b===active?'#2c7973':'#e4eeea'}"/><text x="${xx+width/2}" y="35" text-anchor="middle" fill="${b===active?'#fff':'#245653'}" font-size="21" font-family="ui-monospace,monospace">${bits[b]}</text><line x1="${xx}" x2="${xx}" y1="61" y2="196" class="ema-gridline" stroke-dasharray="3 4"/>`;
      const cycles=fsk?(bits[b]?4:2):3,amplitude=fsk?35:(bits[b]?41:13);
      const pts=Array.from({length:101},(_,i)=>[xx+i/100*width,128-amplitude*Math.sin(i/100*cycles*Math.PI*2)]);
      svg+=`<path d="${line(pts)}" fill="none" stroke="${bits[b]?'#28877c':'#7399a7'}" stroke-width="2.3"/><rect x="${xx}" y="213" width="${width-3}" height="42" rx="7" fill="${b===active?'#2c7973':'#e4eeea'}"/><text x="${xx+width/2}" y="241" text-anchor="middle" fill="${b===active?'#fff':'#245653'}" font-size="21" font-family="ui-monospace,monospace">${bits[b]}</text>`;
    }
    svg+=`<line x1="${left}" x2="${left+8*width}" y1="128" y2="128" stroke="#92aaa9" opacity=".3"/><text x="380" y="286" text-anchor="middle" class="ema-muted-text">Tid → · hvert felt er ett like langt bitintervall</text>`;
    q('#ema-signal-plot').innerHTML=svg;
    q('#ema-received').innerHTML=`Sendt: <code>${bits.join('')}</code> · mottatt: <strong>${byte}</strong><br>${fsk?'FSK: 0 og 1 bruker hver sin frekvens. Amplituden er lik.':'ASK: 0 og 1 bruker hver sin amplitude. Bærefrekvensen er lik.'}`;
  }
  input.addEventListener('input',updateMessage);
  byteChoice.addEventListener('change',()=>{selected=Number(byteChoice.value);api.repaint();});
  mode.addEventListener('change',()=>api.repaint());
  updateMessage();api.onFrame(render);
}

export const topics = [
  {
    id:'em', title:'Det elektromagnetiske spekteret', kicker:'Fra radio til gamma',
    summary:'Én familie av stråling, mange bølgelengder. Finn sammenhengen mellom frekvens, farge og energi per foton.',
    sections:[
      {title:'Samme familie, ulike egenskaper',body:sharedStyle+`<div class="concept-grid"><article class="concept"><h3>Elektromagnetiske bølger</h3><p>Svingninger i elektriske og magnetiske felt. De trenger ikke et stoff å bre seg i. I vakuum har alle samme fart: <strong>c ≈ 3,00 · 10<sup>8</sup> m/s</strong>.</p></article><article class="concept"><h3>Bølger og fotoner</h3><p>EM-stråling kan beskrives som bølger og som energipakker, <strong>fotoner</strong>. Kortere bølgelengde betyr høyere frekvens og større energi <em>per foton</em>.</p></article></div><div class="key"><strong>c = fλ</strong> &nbsp; og &nbsp; <strong>E = hf</strong><br>Mer lysintensitet kan bety flere fotoner. Det trenger ikke bety mer energi i hvert foton.</div>`},
      {title:'Utforsk spekteret',body:`<div class="model"><p>Flytt frekvensen eller velg en strålingstype. Legg merke til hvor smalt det synlige området er.</p><svg id="ema-spectrum-plot" class="ema-spectrum-svg" viewBox="0 0 760 285" role="img" aria-label="Logaritmisk elektromagnetisk spekter"></svg><div class="controls"><label class="control" for="ema-frequency">Frekvens · logaritmisk skala<input id="ema-frequency" type="range" min="4" max="22" step="0.005" value="14.7364"></label></div><div class="ema-region-buttons" id="ema-region-buttons">${regions.map((r,i)=>`<button type="button" data-region="${i}" aria-pressed="${i===3}">${r.name}</button>`).join('')}</div><div class="ema-values" aria-live="polite"><div><small>Bølgelengde λ</small><strong id="ema-wavelength-output"></strong></div><div><small>Frekvens f</small><strong id="ema-frequency-output"></strong></div><div><small>Energi per foton</small><strong id="ema-energy-output"></strong></div></div><div class="ema-spectrum-callout" id="ema-current-region"></div><p class="model-note">Områdegrensene er omtrentlige. Mikrobølger vises separat, men tilhører radiobølgene. Røntgen og gamma overlapper og skilles også etter opprinnelse. eV er en liten energienhet, ikke en strålingsdose.</p></div>`},
      {title:'Hvordan lager en skjerm hvitt og gult?',body:`<p>En skjerm blander <strong>rødt, grønt og blått lys</strong> (RGB). Hvitfarge kan lages med en passende blanding av disse tre; det er ikke nødvendig å ha alle bølgelengder i blandingen.</p><div class="model ema-rgb-layout"><div class="ema-rgb-controls">${[['red','Rødt',255],['green','Grønt',255],['blue','Blått',0]].map(([id,label,val])=>`<label for="ema-rgb-${id}">${label}<input type="range" id="ema-rgb-${id}" min="0" max="255" step="1" value="${val}"><output id="ema-rgb-${id}-value" for="ema-rgb-${id}">${val}</output></label>`).join('')}<div class="ema-region-buttons"><button type="button" data-ema-rgb="255,255,255">Hvitt</button><button type="button" data-ema-rgb="255,255,0">Gult</button><button type="button" data-ema-rgb="0,0,0">Svart</button></div><p id="ema-rgb-caption" aria-live="polite"></p></div><div class="ema-rgb-screen"><svg viewBox="0 0 360 210" role="img" aria-label="Additiv blanding av rødt, grønt og blått lys"><rect width="360" height="210" fill="#000"/><g style="isolation:isolate"><circle id="ema-rgb-red-circle" cx="140" cy="80" r="55" style="mix-blend-mode:screen"/><circle id="ema-rgb-green-circle" cx="211" cy="80" r="55" style="mix-blend-mode:screen"/><circle id="ema-rgb-blue-circle" cx="176" cy="130" r="55" style="mix-blend-mode:screen"/></g><rect id="ema-rgb-result" x="289" y="19" width="49" height="49" rx="8"/><text x="313" y="85" text-anchor="middle" fill="#ddd" font-size="11">blanding</text></svg><output id="ema-rgb-value"></output></div></div><div class="key"><strong>Lysblanding og overflatefarger er forskjellige:</strong> En rød flate reflekterer særlig rødt lys og absorberer mye av det øvrige. Uten rødt i belysningen kan flaten se mørk ut.</div>`},
      {title:'Energi er bare en del av risikobildet',body:`<div class="concept-grid"><article class="concept"><h3>Ionisering</h3><p>Et elektron slås løs fra et atom eller molekyl. Røntgen, gamma og den mest energirike delen av UV kan være ioniserende.</p></article><article class="concept"><h3>Eksponering betyr noe</h3><p>Virkningen av stråling avhenger også av intensitet, eksponeringstid, absorpsjon og hvilket vev som treffes. Sterk ikke-ioniserende stråling kan for eksempel gi oppvarming.</p></article></div><p>UV kan skade DNA også uten ionisering. Se <strong>UV og atmosfæren</strong> og <strong>Strålevern og bruk</strong> for mer.</p>`}
    ],
    terms:[
      {term:'Elektromagnetisk stråling',definition:'Energi som overføres med svingende elektriske og magnetiske felt; kan bre seg i vakuum.'},
      {term:'Foton',definition:'En energipakke i elektromagnetisk stråling. E = hf.'},
      {term:'Synlig spekter',definition:'Den lille delen av EM-spekteret øynene våre oppfatter, omtrent 380–780 nm.'},
      {term:'Infrarød stråling',definition:'EM-stråling med lengre bølgelengde enn synlig rødt lys. Varme gjenstander som kroppen sender hovedsakelig ut IR.'},
      {term:'Ioniserende stråling',definition:'Stråling som har nok energi til å frigjøre elektroner fra atomer eller molekyler.'},
      {term:'RGB',definition:'Additiv lysblanding med rødt, grønt og blått, blant annet i skjermer.'},
      {term:'Intensitet',definition:'Energi som passerer per tid og areal. Høyere intensitet er ikke det samme som høyere energi per foton.'},
      {term:'Elektronvolt (eV)',definition:'En energienhet som er nyttig for svært små energier. 1 eV ≈ 1,60 · 10⁻¹⁹ J.'}
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
      {title:'Elektroner kan ikke ha hvilken som helst energi',body:sharedStyle+`<div class="concept-grid"><article class="concept"><h3>Eksitasjon og absorpsjon</h3><p>Et atom <strong>eksiteres</strong> når et elektron får større energi. Et foton kan absorberes dersom energien passer med en tillatt energiforskjell.</p></article><article class="concept"><h3>Emisjon</h3><p>Når elektronet går til et lavere energinivå, kan atomet sende ut et foton. Fotonet tar med seg forskjellen: <strong>ΔE = hf</strong>.</p></article><article class="concept"><h3>Ionisering</h3><p>Tilføres nok energi, kan elektronet frigjøres helt. Atomet blir et positivt ion. Dette er noe annet enn et sprang mellom bundne nivåer.</p></article></div><div class="key">Et <strong>stort energisprang</strong> gir et foton med høy frekvens og kort bølgelengde. Atomets kjerne endres ikke i en vanlig elektronovergang.</div>`},
      {title:'Velg en overgang i hydrogen',body:`<div class="model"><div class="controls ema-controls"><label class="control" for="ema-level">Øvre energinivå<select id="ema-level"><option value="3">n = 3 · rødt</option><option value="4">n = 4 · blågrønt</option><option value="5">n = 5 · fiolett</option><option value="6">n = 6 · fiolett</option></select></label><label class="control" for="ema-transition-mode">Hva skjer?<select id="ema-transition-mode"><option value="emission">Emisjon · foton ut</option><option value="absorption">Absorpsjon · foton inn</option></select></label></div><svg id="ema-atom-plot" class="ema-atom-svg" viewBox="0 -30 760 325" role="img" aria-label="Hydrogenets energinivåer og et foton"></svg><div id="ema-transition-readout" class="ema-atom-readout" aria-live="polite"></div><svg id="ema-atom-spectrum" class="ema-atom-svg" viewBox="0 0 760 110" role="img" aria-label="Hydrogenets emisjons- eller absorpsjonsspekter"></svg><p class="model-note">Nivåavstandene i figuren er skjematiske; tallene viser energiene. Prikken markerer elektronets energinivå, ikke en bane i rommet. Animasjonen gjentar hendelsen. Absorpsjonen som vises krever at elektronet allerede er i n = 2. Linjebølgelengder er avrundet; ved de høyeste overgangene merkes det at atommodellen er forenklet.</p></div>`},
      {title:'Spektrallinjer er stoffenes fingeravtrykk',body:`<div class="concept-grid"><article class="concept"><h3>Emisjonsspekter</h3><p>En tynn, varm gass gir lyse linjer ved bestemte bølgelengder. Grunnstoffets energinivåer bestemmer mønsteret.</p></article><article class="concept"><h3>Absorpsjonsspekter</h3><p>Når et bredt lysspekter passerer en kjøligere gass, svekkes bestemte bølgelengder. De mørke linjene svarer til de samme energiforskjellene.</p></article></div><p>Ved å sammenlikne linjemønstre kan vi finne hvilke grunnstoffer en lyskilde eller en gass inneholder. Mer om stjernespektre finner du under <strong>Stjerner og universet</strong>.</p>`},
      {title:'Nordlyset forteller hva atmosfæren inneholder',body:`<p>Energirike partikler fra verdensrommet ledes av jordas magnetfelt og kolliderer med partikler i atmosfæren. Oksygen og nitrogen eksiteres. Når de mister energi igjen, sendes lys ut ved karakteristiske bølgelengder.</p><div class="key"><strong>Grønt og rødt nordlys</strong> kommer ofte fra oksygen; nitrogen bidrar blant annet med blålige og rødfiolette toner. Høyde og kollisjoner påvirker hvilke overganger vi ser.</div>`}
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
      {id:'atom-05',type:'number',level:'Bruk',prompt:'Et atom går fra −1,5 eV til −3,4 eV. Hvor stor energi får fotonet som sendes ut?',value:1.9,tolerance:.02,unit:'eV',hint:'Fotonet får forskjellen mellom atomets energi før og etter.',answer:'ΔE = −1,5 eV − (−3,4 eV) = <strong>1,9 eV</strong>. Atomet mister energi, mens fotonet får positiv energi.'},
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
      {title:'Bølgen bærer en beskjed',body:sharedStyle+`<p>En antenne sender ut elektromagnetiske bølger. Ved å endre bølgen på en kontrollert måte kan vi overføre lyd, bilder og data. Denne endringen kalles <strong>modulasjon</strong>.</p><div class="ema-process"><div><strong>Melding</strong>Tekst, lyd eller bilde blir digitale data.</div><div><strong>Sender</strong>Data kodes som endringer i en bærebølge.</div><div><strong>Forbindelse</strong>Bølgen brer seg og kan reflekteres, bøyes og svekkes.</div><div><strong>Mottaker</strong>Signalet registreres og informasjonen dekodes.</div></div><div class="key"><strong>Digital informasjon</strong> er bygd av biter, 0 og 1. De kan kodes med ulike amplituder, frekvenser eller faser. «Digital» betyr ikke at selve radiobølgen er firkantet.</div>`},
      {title:'Se hvordan én byte blir sendt',body:`<div class="model"><div class="controls ema-controls"><label class="control" for="ema-message">Din korte melding<input id="ema-message" class="ema-message-input" type="text" maxlength="8" value="HEI" autocomplete="off" spellcheck="false"></label><label class="control" for="ema-byte">Velg byte<select id="ema-byte" class="ema-byte-options"></select></label><label class="control" for="ema-modulation">Koding av 0 og 1<select id="ema-modulation"><option value="ask">ASK · forskjellig amplitude</option><option value="fsk">FSK · forskjellig frekvens</option></select></label></div><svg id="ema-signal-plot" class="ema-com-svg" viewBox="0 0 760 305" role="img" aria-label="Biter, modulert bærebølge og mottatte biter"></svg><div id="ema-received" class="ema-signal-result" aria-live="polite"></div><p class="model-note">Støyfri, forenklet modell med åtte biter per byte. Meldingen kodes i UTF-8; noen tegn bruker flere byter. Tiden og radiofrekvensene er ikke i målestokk. ASK og FSK illustrerer prinsippet; Wi-Fi og mobilnett bruker mer avansert koding.</p></div>`},
      {title:'Hvilken forbindelse passer hvor?',body:`<div class="table-wrap"><table class="compare-table ema-app-table"><thead><tr><th>Teknologi</th><th>Typisk oppgave</th><th>Viktig å forstå</th></tr></thead><tbody><tr><td>Radio og TV</td><td>Én sender når mange mottakere.</td><td>En kringkaster trenger ikke vite hvem som lytter.</td></tr><tr><td>Mobilnett</td><td>Samtaler og data via basestasjoner.</td><td>Mobilen både sender og mottar; nettet kobler forbindelsen videre.</td></tr><tr><td>Wi-Fi</td><td>Lokalt datanett.</td><td>En ruter kobler ofte det lokale radionettet til internett. Wi-Fi er ikke i seg selv internett.</td></tr><tr><td>Bluetooth</td><td>Korte forbindelser, som hodetelefoner.</td><td>Begrenset rekkevidde og egnet for små enheter.</td></tr><tr><td>NFC</td><td>Kontaktløs betaling og identifikasjon.</td><td>Virker på svært kort avstand; bygger på elektromagnetisk kobling nær antennen.</td></tr><tr><td>Satellitt</td><td>Forbindelse over store områder og navigasjon.</td><td>Radiobølgene kan gå gjennom vakuum. Avstanden gir en reisetid.</td></tr></tbody></table></div>`},
      {title:'Hvorfor forsvinner dekningen?',body:`<div class="concept-grid"><article class="concept"><h3>Svekkelse og hindringer</h3><p>Avstand, vegger og absorpsjon svekker signalet. Bøyning og refleksjon kan la noe av signalet nå fram selv om senderen ikke er synlig.</p></article><article class="concept"><h3>Flere veier og forstyrrelser</h3><p>Reflekterte bølger kan komme fram med ulike forsinkelser og interferere. Mottakeren må skille ønsket informasjon fra støy og andre sendere.</p></article><article class="concept"><h3>Mobilen tilpasser seg</h3><p>Ved dårlig dekning kan mobilen bruke mer energi på sending og søking etter nett. Batteribruk avhenger også av hvordan telefonen brukes.</p></article></div><p><strong>Frekvens alene avgjør ikke rekkevidde eller datahastighet.</strong> Senderstyrke, båndbredde, antenner, terreng og kodingen spiller også inn.</p>`}
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
