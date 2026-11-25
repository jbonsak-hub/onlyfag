import { mountWaveVisuals, soundMarkup, spatialMarkup, waveVisualStyle } from './wave-visuals.js?v=20261125';

const C={wave:'#16879b',amber:'#d28a16',purple:'#8260b4',grid:'#d6e1e6',muted:'#78929e'};
const fmt=(n,d=2)=>n.toLocaleString('nb-NO',{maximumFractionDigits:d});
const line=(x1,y1,x2,y2,c=C.muted,more='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" ${more}/>`;
const path=(d,c=C.wave,w=3,more='')=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${more}/>`;
const text=(x,y,s,more='')=>`<text x="${x}" y="${y}" ${more}>${s}</text>`;
const arrow=(x1,y1,x2,y2,c=C.wave)=>{const a=Math.atan2(y2-y1,x2-x1),s=7;return line(x1,y1,x2,y2,c,'stroke-width="2"')+path(`M${x2-s*Math.cos(a-.5)},${y2-s*Math.sin(a-.5)}L${x2},${y2}L${x2-s*Math.cos(a+.5)},${y2-s*Math.sin(a+.5)}`,c,2);};
const graph=(x0,x1,fn)=>{let d='';for(let x=x0;x<=x1;x+=2)d+=(x===x0?'M':'L')+x.toFixed(2)+','+fn(x).toFixed(2);return d;};
const diagram=(id,title,desc,height=280)=>`<svg id="${id}" viewBox="0 0 760 ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${title}</title><desc id="${id}-desc">${desc}</desc></svg>`;
const slider=(id,label,min,max,value,step)=>`<label class="control" for="${id}"><span class="wb-control-head"><span>${label}</span><output id="${id}-value"></output></span><input id="${id}" type="range" min="${min}" max="${max}" value="${value}" step="${step}"></label>`;
const style=`<style>
.wb-scope{--wb-panel:var(--surface-alt,#f1f6f7);--wb-border:var(--border,#d6e1e6);color:var(--ink,#273d4a)}.wb-concept-layout{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:12px 0 14px;align-items:stretch}.wb-definitions{margin:0}.wb-definitions>div{padding:7px 0;border-bottom:1px solid var(--wb-border);display:grid;grid-template-columns:130px 1fr;gap:12px;align-items:baseline}.wb-definitions>div:last-child{border-bottom:0}.wb-definitions dt{font-weight:700;font-size:.92rem}.wb-definitions dd{margin:0;font-size:.9rem;line-height:1.45}.wb-relations{padding:11px 15px;border:1px solid var(--wb-border);border-radius:11px;background:var(--wb-panel)}.wb-equations{font-size:1.25rem;font-weight:700;display:flex;gap:28px;flex-wrap:wrap;margin:1px 0 5px;color:var(--accent,#187b8c)}.wb-relations p{font-size:.86rem;line-height:1.5;margin:4px 0}.wb-relations .wb-example{padding-top:6px;border-top:1px solid var(--wb-border);margin-top:7px}.wb-scope svg{display:block;width:100%;height:auto;max-height:220px;background:var(--wb-panel);border-radius:10px;overflow:hidden}.wb-scope svg text{font:17px system-ui,sans-serif;fill:var(--ink,#273d4a)}.wb-scope svg .wb-small{font-size:15px;fill:var(--muted,#657985)}.wb-scope .wb-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:10px}.wb-scope .wb-controls.wb-two{grid-template-columns:repeat(2,minmax(0,1fr))}.wb-scope .wb-control-head{display:flex;justify-content:space-between;gap:10px;font-size:.88rem}.wb-scope output{font-variant-numeric:tabular-nums;font-weight:650;white-space:nowrap}.wb-scope input[type=range]{width:100%;accent-color:var(--accent,#187b8c);margin-top:5px}.wb-scope .wb-mode-buttons{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px}.wb-mode-buttons button,.wb-scope .wb-reset{padding:7px 11px;border:1px solid var(--wb-border);border-radius:8px;background:var(--surface,#fff);color:var(--ink,#273d4a);font:inherit;font-size:.86rem;cursor:pointer}.wb-mode-buttons button[aria-pressed=true]{color:white;background:var(--accent,#187b8c);border-color:var(--accent,#187b8c)}.wb-scope .wb-caption{margin:8px 0 0;font-size:.91rem;line-height:1.5}.wb-scope .model-note{margin:8px 0 0;font-size:.81rem}.wb-scope [hidden]{display:none!important}.wb-scope .wb-reset{align-self:end}.wb-scope .wb-type-note{font-size:.89rem;margin:10px 0}.wb-scope .readout{font-size:.87rem;padding:8px 10px;margin-top:8px}.wb-scope .model{margin:0 auto}.wb-scope .wb-classification{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:14px}.wb-classification p{font-size:.88rem;line-height:1.5;margin:4px 0}.wb-classification strong{font-size:.9rem}@media(max-width:680px){.wb-concept-layout{grid-template-columns:1fr;gap:10px}.wb-definitions>div{grid-template-columns:122px 1fr}.wb-scope .wb-controls,.wb-scope .wb-controls.wb-two{grid-template-columns:1fr}.wb-scope .wb-classification{grid-template-columns:1fr;gap:8px}.wb-scope .wb-controls{gap:7px}.wb-relations{padding:10px 12px}.wb-scope svg{min-height:145px}.wb-mode-buttons button{padding:7px 9px}}

.wb-example-prompt{border-top:1px solid var(--wb-border);padding-top:7px;margin-top:9px}.wb-calculation{margin-top:8px;font-size:12px}.wb-travel-calculation summary{cursor:pointer;color:var(--green,#23674d)}.wb-travel-calculation .calc-lines{margin-top:10px}.wb-calculation summary{color:var(--green,#23674d);cursor:pointer}.wb-relations .wb-worked-columns{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:8px}.wb-relations .wb-worked-columns>div{min-width:0}.wb-relations .wb-worked-columns p{font-size:12px;line-height:1.6}.wb-examples-launch{margin:14px 0 0}.wb-examples-launch button,.wb-dialog-header button,.wb-example-tabs button{border:1px solid var(--line,#d6e1e6);border-radius:7px;background:var(--surface,#fff);color:var(--ink,#273d4a);padding:7px 11px;font:inherit;font-size:12px;cursor:pointer}.wb-examples-dialog{width:min(1100px,96vw);max-width:96vw;max-height:94vh;max-height:94dvh;margin:auto;border:1px solid var(--line,#d6e1e6);border-radius:12px;background:var(--surface,#fff);color:var(--ink,#273d4a);padding:0;overflow:auto;box-shadow:0 22px 90px #0006}.wb-examples-dialog::backdrop{background:#071a24b8;backdrop-filter:blur(3px)}.wb-dialog-shell{padding:16px 18px}.wb-dialog-header{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line,#d6e1e6);padding-bottom:10px}.wb-dialog-header h3{margin:0;font-size:18px}.wb-dialog-header button{flex:none}.wb-example-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}.wb-example-tabs button[aria-selected="true"]{background:var(--green,#23674d);border-color:var(--green,#23674d);color:#fff}.wb-example-panel>p{margin:7px 0 12px;font-size:12px;line-height:1.65}.wb-examples-dialog svg{max-height:none}.wb-examples-dialog .model{margin:0}.wb-examples-dialog .model-panel{align-self:stretch}.wb-examples-dialog .model-footer{font-size:11px}.wb-examples-dialog [hidden]{display:none!important}@media(max-width:680px){.wb-relations .wb-worked-columns{grid-template-columns:1fr;gap:6px}.wb-dialog-shell{padding:12px}.wb-dialog-header h3{font-size:16px}.wb-examples-dialog{width:98vw;max-width:98vw;max-height:96dvh}.wb-example-tabs button{font-size:11px;padding:7px 8px}}
</style>`;

const modes=[['transverse','Tversbølge','wv-transverse'],['longitudinal','Langsbølge','wv-longitudinal']];
const descriptions={
  transverse:'Partiklene svinger på tvers av bølgeretningen. Følg den oransje partikkelen: Den blir i nærheten av samme sted mens bølgemønsteret går mot høyre.',
  longitudinal:'Partiklene svinger langs bølgeretningen. Fortetninger og fortynninger vandrer mot høyre, mens hver partikkel bare svinger fram og tilbake.',
  standing:'To like bølger i motsatt retning danner et stående mønster. Lilla punkter er knuter uten utslag. Mellom dem er buker med størst utslag. Endre antall buker.',
  sound:'Høyttalermembranen setter lufta i svingninger. I en fortetning ligger luftpartiklene tettere, og grafen viser høyere trykk. Se hvordan fortetningene fortsetter inn i øregangen og setter trommehinnen i svingninger. De oransje partiklene svinger fram og tilbake.',
  water:'På dypt vann beveger vannpartiklene seg omtrent i små sirkler. Bølgen går mot høyre, mens partiklene blir nær samme sted. Flytt den oransje partikkelen dypere og se at banen blir mindre.'
};
const modelNotes={
  standing:'Strenglengde L = 2 m og bølgefart v = 2 m/s. Endene er knuter.',
  sound:'Høyere frekvens gir lysere tone; større trykkvariasjon gir sterkere lyd.',
};

export function waveFrequency(speed,wavelength){return speed/wavelength;}
const fraction=(a,b)=>`<span class="frac"><span class="num">${a}</span><span class="den">${b}</span></span>`;
const calc=(lhs,rhs)=>`<div class="calc-row"><span class="calc-lhs">${lhs}</span><span class="calc-eq">=</span><span class="calc-rhs">${rhs}</span></div>`;

function wavePracticeFigure(){
 const x=metres=>52+119*metres;
 const y=metres=>102-22*metres;
 const gridX=[1,2,3].map(n=>line(x(n),27,x(n),174,'var(--line)')
  +text(x(n),y(0)+18,n,'text-anchor="middle"')).join('');
 const gridY=[-3,-2,-1,1,2,3].map(n=>line(x(0),y(n),444,y(n),'var(--line)')
  +text(44,y(n)+4,String(n).replace('-','−'),'text-anchor="end"')).join('');
 return `<svg class="q-wave-figure" viewBox="0 0 480 202" role="img" aria-label="Bølgeprofil med utsving i meter langs en strekning målt i meter">
  ${gridX}${gridY}
  ${arrow(x(0),y(0),451,y(0),'var(--muted)')}
  ${arrow(x(0),175,x(0),22,'var(--muted)')}
  ${path(graph(x(0),444,px=>y(3*Math.cos(Math.PI*(px-x(0))/119))),C.wave,2.6)}
  ${text(52,16,'Utsving (m)')}${text(444,194,'Strekning (m)','text-anchor="end"')}
 </svg>`;
}

const basics={
  id:'bolger',title:'Bølger og svingninger',kicker:'',summary:'Se sammenhengen mellom amplitude, bølgelengde, frekvens og fart. Se bevegelsen bak lyd og vannbølger.',
  sections:[
    {title:'Bølgeegenskaper',body:`${style}${waveVisualStyle}<div class="wb-scope"><p>En <strong>bølge</strong> er svingninger som brer seg og overfører energi. I mekaniske bølger svinger partiklene lokalt.</p><div class="wb-concept-layout"><dl class="wb-definitions"><div><dt>Amplitude A</dt><dd>Største utslag fra likevekt.</dd></div><div><dt>Bølgelengde λ</dt><dd>Avstand mellom nabotopper.</dd></div><div><dt>Frekvens f</dt><dd>Antall svingninger per sekund (Hz).</dd></div><div><dt>Periode T</dt><dd>Tid per svingning (s).</dd></div><div><dt>Bølgefart v</dt><dd>Farten bølgen brer seg med (m/s).</dd></div></dl><div class="wb-relations"><div class="wb-equations"><div><span class="wb-words">Bølgefart = frekvens · bølgelengde</span><strong>v = f · λ</strong></div><div><span class="wb-words">Frekvens = ${fraction(1,'periode')}</span><strong>f = ${fraction(1,'T')}</strong></div></div><div class="wb-example-prompt"><p>En bølge beveger seg med en fart på <strong>4 m/s</strong>. Avstanden mellom bølgetoppene er <strong>2 m</strong>.</p><p><strong>a)</strong> Hvor mange bølgetopper passerer et punkt i sekundet?<br><strong>b)</strong> Hvor lang tid går det mellom hver bølgetopp?</p></div><details class="wb-calculation"><summary>Se forklaring og utregning</summary><div class="wb-worked-columns"><div><p><strong>a) Frekvens</strong><br>Farten forteller hvor mange meter bølgen brer seg per sekund. Del på avstanden mellom toppene:</p><div class="calc-lines">${calc('f',fraction('v','λ'))}${calc('',fraction('4 m/s','2 m'))}${calc('','<strong>2 Hz</strong>')}</div><p>Det passerer <strong>to bølgetopper per sekund</strong>.</p></div><div><p><strong>b) Periode</strong><br>To topper per sekund betyr at tiden mellom hver topp er et halvt sekund:</p><div class="calc-lines">${calc('T',fraction(1,'f'))}${calc('',fraction(1,'2 Hz'))}${calc('','<strong>0,50 s</strong>')}</div><p>Det går <strong>0,50 s mellom bølgetoppene</strong>.</p></div></div></details></div></div><div class="model">${diagram('wv-travel','En løpende tversbølge','En bølge brer seg mot høyre. Den oransje prikken svinger på et fast sted. Endre amplitude, bølgelengde og fart med gliderne.',300)}<div class="wb-controls">${slider('wv-amplitude','Amplitude A',.2,1.2,.6,.1)}${slider('wv-wavelength','Bølgelengde λ',1,8,4,.1)}${slider('wv-speed','Bølgefart v',.5,12,4,.1)}</div><div class="readout wb-travel-calculation"><details><summary>Vis utregning</summary><div id="wv-travel-readout"></div></details></div></div></div>`},
    {title:'Tversbølger og langsbølger',body:`<div class="wb-scope"><p>I en <strong>tversbølge</strong> svinger partiklene på tvers av bølgeretningen. I en <strong>langsbølge</strong> svinger de langs bølgeretningen. Følg den oransje partikkelen.</p><div class="model"><div class="wb-mode-buttons" role="group" aria-label="Velg bølgetype">${modes.map(([mode,label,id])=>`<button type="button" id="${id}" data-wb-mode="${mode}" aria-pressed="${mode==='transverse'}">${label}</button>`).join('')}</div>${diagram('wv-particles','Tversbølge og langsbølge','Partiklene svinger lokalt mens bølgen brer seg. Bytt bare mellom tvers og langs.')}<div id="wb-particle-controls" class="wb-controls">${slider('wb-particle-frequency','Frekvens i modellen',.3,1.2,.65,.05)}</div><div id="wb-mode-readout" class="readout" aria-live="polite"></div><p id="wv-particles-caption" class="wb-caption">${descriptions.transverse}</p></div>${spatialMarkup}
<div class="wb-examples-launch"><button type="button" id="wb-examples-open" aria-haspopup="dialog" aria-controls="wb-examples-dialog" aria-expanded="false">Eksempler: lyd og vannbølger</button></div><dialog id="wb-examples-dialog" class="wb-examples-dialog" aria-labelledby="wb-examples-title"><div class="wb-dialog-shell"><header class="wb-dialog-header"><h3 id="wb-examples-title">Lyd og vannbølger</h3><button type="button" id="wb-examples-close" aria-label="Lukk eksemplene">Lukk ×</button></header><div class="wb-example-tabs" role="tablist" aria-label="Velg bølgeeksempel"><button type="button" id="wb-example-sound-tab" role="tab" aria-selected="true" aria-controls="wb-example-sound-panel" tabindex="0">Lyd: langsbølger</button><button type="button" id="wb-example-water-tab" role="tab" aria-selected="false" aria-controls="wb-example-water-panel" tabindex="-1">Vann: overflatebølger</button></div><section id="wb-example-sound-panel" class="wb-example-panel" role="tabpanel" aria-labelledby="wb-example-sound-tab"><p>${descriptions.sound}</p><div class="model wb-sound-model" data-model-layout="custom">${soundMarkup}<div id="wb-sound-controls" class="wb-controls wb-two">${slider('wb-sound-frequency','Frekvens / tonehøyde',200,1000,500,50)}${slider('wb-sound-amplitude','Trykkvariasjon / lydstyrke',.2,1,.6,.1)}</div><div id="wb-sound-readout" class="readout" aria-live="polite"></div><p class="model-note">${modelNotes.sound}</p></div></section><section id="wb-example-water-panel" class="wb-example-panel" role="tabpanel" aria-labelledby="wb-example-water-tab" hidden><p>${descriptions.water}</p><div class="model">${diagram('wv-water','Vannbølger og partikkelbaner','Vannpartiklene går i omtrent sirkulære baner som blir mindre med dybden.',260)}<div id="wb-water-controls" class="wb-controls">${slider('wb-water-depth','Dybde for oransje partikkel',.1,1.3,.3,.1)}</div><div id="wb-water-readout" class="readout" aria-live="polite"></div></div></section></div></dialog>
</div>`},
    {title:'Stående bølger',body:`<div class="wb-scope"><p>${descriptions.standing}</p><div class="model">${diagram('wv-standing','Stående bølge på en streng','To bølger i motsatt retning gir knuter og buker.')}<div id="wb-standing-controls" class="wb-controls">${slider('wv-harmonic','Antall buker',1,4,2,1)}</div><div id="wb-standing-readout" class="readout" aria-live="polite"></div><p class="model-note">${modelNotes.standing}</p></div></div>`},
  ],
  terms:[
    {
      "term": "Bølge",
      "definition": "Svingninger som brer seg og overfører energi."
    },
    {
      "term": "Svingning",
      "definition": "En bevegelse som gjentas fram og tilbake omkring en likevektsstilling."
    },
    {
      "term": "Likevektsstilling",
      "definition": "Stillingen et punkt svinger omkring."
    },
    {
      "term": "Amplitude",
      "definition": "Største utslag fra likevektsstillingen."
    },
    {
      "term": "Bølgelengde",
      "definition": "Avstanden mellom to nabotopper eller to nabofortetninger i en langsbølge."
    },
    {
      "term": "Frekvens",
      "definition": "Antall svingninger per sekund, målt i hertz (Hz)."
    },
    {
      "term": "Periode",
      "definition": "Tiden for én hel svingning."
    },
    {
      "term": "Bølgefart",
      "definition": "Farten bølgemønsteret brer seg med."
    },
    {
      "term": "Tversbølge",
      "definition": "En bølge der partiklene svinger vinkelrett på bølgeretningen."
    },
    {
      "term": "Langsbølge",
      "definition": "En bølge der partiklene svinger parallelt med bølgeretningen."
    },
    {
      "term": "Overflatebølge",
      "definition": "En bølge langs vannoverflaten. Vannpartiklene kan bevege seg både på tvers av og langs bølgeretningen."
    },
    {
      "term": "Stående bølge",
      "definition": "Et svingemønster som blir på samme sted når to like bølger møtes i motsatt retning."
    }
  ],
  questions:[
    {id:'wv-b1',type:'mcq',level:'Start',prompt:'En lydbølge går gjennom luft. Hva gjør luftpartiklene?',choices:['Følger lyden hele veien fra høyttaleren til øret.','Svinger fram og tilbake omkring sine egne likevektsstillinger.','Står helt stille mens energien passerer.'],correct:1,answer:'Luftpartiklene svinger lokalt. Det er trykkvariasjonen og energien som brer seg gjennom lufta.'},
    {id:'wv-b2',type:'open',level:'Start',prompt:'Tegn en bølge. Marker likevektslinje, bølgetopp, bølgebunn, amplitude og bølgelengde.',answer:'Amplitude måles fra likevektslinjen til en topp eller bunn. Bølgelengden måles mellom to nabotopper eller to nabobunner. Avstanden fra bunn til topp er 2A.'},
    {id:'wv-b3',type:'number',level:'Bruk',prompt:'En bølge har fart 5 m/s og bølgelengde 2 m. Finn frekvensen.',value:2.5,tolerance:.02,unit:'Hz',hint:'Bruk v = f · λ og isoler f.',answer:'f = v / λ = 5 m/s / 2 m = <strong>2,5 Hz</strong>.'},
    {id:'wv-b4',type:'number',level:'Bruk',prompt:'En bølge har frekvens 2,5 Hz. Hva er perioden?',value:.4,tolerance:.005,unit:'s',hint:'Perioden er tiden per svingning.',answer:'T = 1 / f = 1 / 2,5 Hz = <strong>0,40 s</strong>.'},
    {id:'wv-b5',type:'number',level:'Bruk',prompt:'En A-tone har frekvens 440 Hz. Lydfarten er 345 m/s. Finn bølgelengden.',value:345/440,tolerance:.01,unit:'m',answer:'λ = v / f = 345 / 440 m ≈ <strong>0,784 m</strong>.'},
    {id:'wv-b6',type:'number',level:'Bruk',prompt:'Du står på stranda. Bølgene går med fart 4 m/s, og to bølgetopper passerer deg hvert sekund. Hvor langt er det mellom nabotoppene?',value:2,tolerance:.02,unit:'m',answer:'f = 2 Hz. λ = v / f = 4 / 2 m = <strong>2 m</strong>.'},
    {id:'wv-b7',type:'mcq',level:'Start',prompt:'Hva kjennetegner en langsbølge?',choices:['Partiklene svinger vinkelrett på retningen bølgen brer seg.','Partiklene svinger parallelt med retningen bølgen brer seg.','Bølgelengden er alltid større enn én meter.'],correct:1,answer:'I en langsbølge svinger partiklene langs bølgeretningen. Lyd i luft er et eksempel.'},
    {id:'wv-b9',type:'number',level:'Bruk',prompt:'Det går 3,0 s fra du ser et lyn til du hører tordenen. Regn med lydfart 340 m/s og se bort fra lysets reisetid. Hvor langt unna er lynet?',value:1020,tolerance:10,unit:'m',answer:'s = v · t = 340 m/s · 3,0 s = <strong>1020 m</strong>, omtrent 1 km.'},
    {id:'wv-b10',type:'mcq',level:'Bruk',prompt:'Frekvensen dobles mens bølgefarten holdes uendret. Hva skjer med bølgelengden?',choices:['Den dobles.','Den halveres.','Den er uendret.'],correct:1,answer:'λ = v / f. Når frekvensen dobles ved samme bølgefart, halveres bølgelengden.'},
    {"id":"wv-b11","type":"open","level":"Bruk","prompt":"To like bølger går i motsatt retning på en streng og danner en stående bølge. En elev sier: «Stående bølge betyr at hele strengen står stille.» Har eleven rett? Forklar hva som står stille, og hva som beveger seg.","answer":"Nei. Selve svingemønsteret blir på samme sted, men de fleste punktene på strengen svinger opp og ned. Enkelte punkter står stille fordi bølgene hele tiden har motsatt utslag der."},
    {id:'wv-b12',type:'open',level:'Utfordring',prompt:'En elev sier: «Når vi sender mer energi inn i en fjær, må bølgelengden bli kortere.» Vurder påstanden.',answer:'Ikke nødvendigvis. Mer energi kan gi større amplitude. Bølgelengden bestemmes av bølgefart og frekvens gjennom λ = v/f. Holder vi disse uendret, er bølgelengden uendret.'},
    {
      id:'wv-b13',type:'number',level:'Start',
      prompt:'<p><strong>En kork på vannet</strong></p><p>En kork dupper opp og ned og gjør 15 hele svingninger på 10 s. Regn ut perioden og frekvensen til bølgene.</p>',
      fields:[
        {label:'Periode T',value:10/15,tolerance:.005,unit:'s'},
        {label:'Frekvens f',value:15/10,unit:'Hz'}
      ],
      answer:'Én svingning tar omtrent 0,67 s. Korken gjør i gjennomsnitt 1,5 svingninger per sekund, så frekvensen er 1,5 Hz.'
    },
    {
      id:'wv-b14',type:'number',level:'Bruk',
      prompt:`<p><strong>Regnetrening med bølger</strong></p>
        <p>En bølge brer seg mot høyre med konstant fart.</p>
        <ul><li>Vannrett avstand fra en bølgetopp til nærmeste bølgebunn er 1 m.</li>
        <li>Avstanden fra likevektslinja til en bølgetopp er 3 m.</li>
        <li>Et punkt på bølgen gjør fire hele svingninger på 16 s.</li></ul>
        ${wavePracticeFigure()}`,
      fields:[
        {label:'Bølgelengde λ',value:2,unit:'m'},
        {label:'Amplitude A',value:3,unit:'m'},
        {label:'Periode T',value:16/4,unit:'s'},
        {label:'Frekvens f',value:4/16,unit:'Hz'},
        {label:'Bølgefart v',value:2*4/16,unit:'m/s'}
      ],
      answer:'Bølgelengden er 2 m og amplituden er 3 m. Perioden er 4 s, frekvensen er 0,25 Hz og bølgefarten er 0,50 m/s.'
    }
  ],
  resources:[{label:'PhET: Bølge på en snor',url:'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_all.html'}],
  mount(root,api){
    const q=id=>root.querySelector('#'+id),val=id=>Number(q(id).value),say=(id,s)=>{if(q(id).textContent!==s)q(id).textContent=s;};
    const layers={};for(const id of ['wv-travel','wv-particles','wv-standing','wv-water']){const g=document.createElementNS('http://www.w3.org/2000/svg','g');q(id).append(g);layers[id]=g;}
    const cleanWaveVisuals = mountWaveVisuals(root, api);
    let particleMode='transverse',travelPhase=0,lastTime=null;
    const describe=()=>{
      for(const [m,,id] of modes)q(id).setAttribute('aria-pressed',String(particleMode===m));
      say('wv-particles-caption',descriptions[particleMode]);
    };
    const update=()=>{
      say('wv-amplitude-value',fmt(val('wv-amplitude'))+' m');say('wv-wavelength-value',fmt(val('wv-wavelength'))+' m');say('wv-speed-value',fmt(val('wv-speed'))+' m/s');
      const f=waveFrequency(val('wv-speed'),val('wv-wavelength'));
      q('wv-travel-readout').innerHTML=`<div class="calc-lines">${calc('f',fraction(fmt(val('wv-speed'))+' m/s',fmt(val('wv-wavelength'))+' m'))}${calc('',fmt(f)+' Hz')}${calc('T',fraction(1,fmt(f)+' Hz'))}${calc('',fmt(1/f)+' s')}</div>`;

      say('wb-particle-frequency-value',fmt(val('wb-particle-frequency'))+' Hz');say('wv-harmonic-value',String(val('wv-harmonic')));say('wb-sound-frequency-value',fmt(val('wb-sound-frequency'),0)+' Hz');say('wb-sound-amplitude-value',fmt(val('wb-sound-amplitude')*100,0)+' %');say('wb-water-depth-value',fmt(val('wb-water-depth'))+' m');
      const n=val('wv-harmonic');
      q('wb-standing-readout').innerHTML=`<div>${n} ${n===1?'buk':'buker'}</div><div>${n+1} knuter</div><div class="calc-lines">${calc('λ',fraction('2 · L',n))}${calc('',fmt(4/n)+' m')}${calc('f',fmt(n*.5)+' Hz')}</div>`;
      say('wb-sound-readout',`Ved samme bølgefart gir høyere frekvens kortere bølgelengde.`);
      say('wb-water-readout',`Oransje partikkel: ${fmt(val('wb-water-depth'))} m under likevektsflaten. Banen blir mindre med dybden.`);
      say('wb-mode-readout',`Frekvens: ${fmt(val('wb-particle-frequency'))} Hz · ${particleMode==='transverse'?'Svingning på tvers av bølgeretningen.':'Svingning langs bølgeretningen.'}`);api.repaint();
    };
    for(const [m,,id] of modes)q(id).addEventListener('click',()=>{particleMode=m;describe();update();});
    for(const id of ['wv-amplitude','wv-wavelength','wv-speed','wv-harmonic','wb-particle-frequency','wb-sound-frequency','wb-sound-amplitude','wb-water-depth'])q(id).addEventListener('input',update);
    api.onFrame(t=>{
      const elapsed=lastTime===null?0:Math.max(0,Math.min(.2,t-lastTime));lastTime=t;
      const A=val('wv-amplitude'),v=val('wv-speed'),lambda=val('wv-wavelength'),f=waveFrequency(v,lambda),scale=620/16;travelPhase+=f*elapsed;
      const y=x=>165-A*64*Math.sin(2*Math.PI*((x-70)/(scale*lambda)-travelPhase));
      let grid='';for(const m of [0,4,8,12,16]){const x=70+m*scale;grid+=line(x,82,x,244,C.grid)+text(x,263,String(m),'text-anchor="middle" class="wb-small"');}
      layers['wv-travel'].innerHTML=`${grid}${line(70,165,690,165,'#9bb0ba')}${line(70,82,70,244)}${path(graph(70,690,y),C.wave,3.5)}${line(341,83,341,244,C.amber,'stroke-dasharray="3 5" opacity=".5"')}<circle cx="341" cy="${y(341)}" r="8" fill="${C.amber}" stroke="white" stroke-width="2"/>${line(45,165-A*64,45,165,C.amber,'stroke-width="2"')}${text(30,169-A*32,'A','text-anchor="middle"')}${line(70,42,70+lambda*scale,42,C.purple,'stroke-width="2"')}${line(70,36,70,48,C.purple)}${line(70+lambda*scale,36,70+lambda*scale,48,C.purple)}${text(70+lambda*scale/2,31,'λ','text-anchor="middle"')}${text(747,263,'x (m)','text-anchor="end" class="wb-small"')}${text(80,75,'Likevektslinje','class="wb-small"')}${arrow(530,283,678,283)}${text(515,288,'Bølgeretning','text-anchor="end" class="wb-small"')}`;
    },q('wv-travel'));
    for(const [sceneMode,svgId] of [['particles','wv-particles'],['standing','wv-standing'],['water','wv-water']]){
      api.onFrame(t=>{

      const mode=sceneMode==='particles'?particleMode:sceneMode;
      let scene='';
      if(mode==='transverse'||mode==='longitudinal'){
        const transverse=mode==='transverse',frequency=val('wb-particle-frequency');let dots='';
        for(let i=0;i<16;i++){let x0=80+i*40,ph=2*Math.PI*(i/7-frequency*t),x=transverse?x0:x0+16*Math.sin(ph),yy=transverse?140-52*Math.sin(ph):140;dots+=`<circle cx="${x0}" cy="140" r="2.5" fill="#b3c5cc"/>${i===7?line(transverse?x0:x0-22,transverse?78:140,transverse?x0:x0+22,transverse?202:140,C.amber,'stroke-dasharray="3 4"'):''}<circle cx="${x}" cy="${yy}" r="${i===7?10:7}" fill="${i===7?C.amber:C.wave}"/>`;}
        scene=`${arrow(275,50,490,50)}${text(380,30,'Bølgeretning','text-anchor="middle"')}${dots}${text(380,260,'Oransje partikkel: lokal svingning','text-anchor="middle" class="wb-small"')}`;
      } else if(mode==='standing'){
        const n=val('wv-harmonic'),sy=x=>145-62*Math.sin(n*Math.PI*(x-60)/640)*Math.cos(2*Math.PI*n*.5*t);let nodes='',envelopes='';
        for(let k=0;k<=n;k++)nodes+=`<circle cx="${60+k*640/n}" cy="145" r="4.5" fill="${C.purple}"/>`;
        for(const sign of [-1,1])envelopes+=path(graph(60,700,x=>145+sign*62*Math.sin(n*Math.PI*(x-60)/640)),C.grid,1.5,'stroke-dasharray="4 4"');
        scene=`${text(62,30,'Faste ender','class="wb-small"')}${text(630,30,'● knute','text-anchor="middle" class="wb-small"')}${line(60,145,700,145,C.grid)}${line(54,72,54,218,C.muted,'stroke-width="5"')}${line(706,72,706,218,C.muted,'stroke-width="5"')}${envelopes}${path(graph(60,700,sy),C.wave,3.5)}${nodes}${line(60,247,700,247,C.muted)}${text(380,269,'Strenglengde L = 2 m','text-anchor="middle" class="wb-small"')}`;
      } else if(mode==='water'){
        const k=2*Math.PI/260,omega=2*Math.PI*.55,base=79,amplitude=18,depth=val('wb-water-depth'),trackedY=base+depth*70,orbit=amplitude*Math.exp(-k*(trackedY-base)),trackedPhase=k*(380-30)-omega*t;let surface='',particles='';
        for(let x=15;x<=745;x+=3){let p=k*(x-30)-omega*t,xx=x+amplitude*Math.cos(p),yy=base-amplitude*Math.sin(p);surface+=(x===15?'M':'L')+xx+','+yy;}
        for(const yy of [105,143,180])for(let x0=65;x0<=710;x0+=65){let a=amplitude*Math.exp(-k*(yy-base)),p=k*(x0-30)-omega*t;particles+=`<circle cx="${x0+a*Math.cos(p)}" cy="${yy-a*Math.sin(p)}" r="3.2" fill="${C.wave}" opacity=".67"/>`;}
        scene=`<rect x="15" y="79" width="730" height="127" rx="4" fill="#e1f0f5"/>${path(surface+'L760,206L0,206Z','#c7e4ef',1,'fill="#c7e4ef"')}${path(surface,C.wave,3)}${particles}${line(380,base,380,trackedY,C.amber,'stroke-dasharray="3 5" opacity=".5"')}<circle cx="380" cy="${trackedY}" r="${orbit}" fill="none" stroke="${C.amber}" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="${380+orbit*Math.cos(trackedPhase)}" cy="${trackedY-orbit*Math.sin(trackedPhase)}" r="6" fill="${C.amber}" stroke="white" stroke-width="1.5"/>${arrow(480,35,676,35)}${text(465,39,'Bølgeretning','text-anchor="end" class="wb-small"')}${text(42,197,'Partikkelbanene avtar med dybden','class="wb-small"')}`;
      }
      layers[svgId].innerHTML=scene;
      if(sceneMode==='water')layers[svgId].setAttribute('transform','translate(0 22)');
      },q(svgId));
    }
    const exampleDialog=q('wb-examples-dialog'),exampleOpen=q('wb-examples-open'),exampleClose=q('wb-examples-close');
    const exampleNames=['sound','water'];let exampleMode='sound',returnFocus=null;
    const chooseExample=(mode,focus=false)=>{
      exampleMode=exampleNames.includes(mode)?mode:'sound';
      for(const name of exampleNames){const selected=name===exampleMode,tab=q('wb-example-'+name+'-tab');tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;q('wb-example-'+name+'-panel').hidden=!selected;if(selected&&focus)tab.focus();}
      api.repaint(q(exampleMode==='sound'?'wv-sound':'wv-water'));
    };
    const openExamples=()=>{returnFocus=exampleDialog.ownerDocument?.activeElement||exampleOpen;if(!exampleDialog.open){if(typeof exampleDialog.showModal==='function')exampleDialog.showModal();else exampleDialog.setAttribute('open','');}exampleOpen.setAttribute('aria-expanded','true');chooseExample(exampleMode,true);};
    const onExamplesClosed=()=>{exampleOpen.setAttribute('aria-expanded','false');if(returnFocus?.isConnected!==false)returnFocus?.focus?.();returnFocus=null;};
    const closeExamples=()=>{if(typeof exampleDialog.close==='function')exampleDialog.close();else{exampleDialog.removeAttribute('open');onExamplesClosed();}};
    const cancelExamples=e=>{e.preventDefault();closeExamples();};
    const backdropExamples=e=>{if(e.target!==exampleDialog)return;const box=exampleDialog.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)closeExamples();};
    const tabClick=event=>chooseExample(event.currentTarget.id.includes('-water-')?'water':'sound');
    const tabKeys=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();chooseExample(event.key==='Home'?'sound':event.key==='End'?'water':exampleMode==='sound'?'water':'sound',true);};
    exampleOpen.addEventListener('click',openExamples);exampleClose.addEventListener('click',closeExamples);exampleDialog.addEventListener('close',onExamplesClosed);exampleDialog.addEventListener('cancel',cancelExamples);exampleDialog.addEventListener('click',backdropExamples);
    for(const name of exampleNames){const tab=q('wb-example-'+name+'-tab');tab.addEventListener('click',tabClick);tab.addEventListener('keydown',tabKeys);}
    chooseExample('sound');
    describe();update();
    return ()=>{cleanWaveVisuals();if(exampleDialog.open)closeExamples();exampleOpen.removeEventListener('click',openExamples);exampleClose.removeEventListener('click',closeExamples);exampleDialog.removeEventListener('close',onExamplesClosed);exampleDialog.removeEventListener('cancel',cancelExamples);exampleDialog.removeEventListener('click',backdropExamples);for(const name of exampleNames){const tab=q('wb-example-'+name+'-tab');tab.removeEventListener('click',tabClick);tab.removeEventListener('keydown',tabKeys);}};
  }
};

export const topics=[basics];
