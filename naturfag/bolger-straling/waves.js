import {practicalExamplesDialogHtml,mountPracticalExamplesDialog} from './examples-dialog.js?v=20261121-spectrum1';
import {refractionSection,mountRefraction} from './refraction-lab.js?v=20261116-naturfag1';
import {diffractionSection,mountDiffraction} from './diffraction-lab.js?v=20261122-spredning1';
import {resonanceSection as swingSection,mountResonance} from './resonance-swing.js?v=20261118-resonans1';
import {tuningForkHtml,mountTuningForks} from './resonance-tuning-forks.js?v=20261121-spectrum1';
import {flightSection,mountFlight} from './flight-doppler.js?v=20261116-naturfag1';
import {lightDopplerHtml,mountLightDoppler} from './light-doppler.js?v=20261121-spectrum1';
export {buildApertureField,scalarWaveValue,diffractionEnvelope} from './diffraction-lab.js?v=20261122-spredning1';
export {createSwingState,swingGeometry,swingBackPoint,solveSwingArm,swingDriveAt,stepDrivenSwing,swingArmPose,stepSwingScene} from './resonance-swing.js?v=20261118-resonans1';
function tabbedSection(id, title, panels) {
  return {
    title,
    body: `<div class="wv-model-tabs" id="${id}-tabs" role="tablist" aria-label="${title}">
    ${panels.map(({id: key, label}, index) => `<button type="button" role="tab" id="${id}-tab-${key}"
      aria-controls="${id}-panel-${key}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}">${label}</button>`).join('')}
    </div>
    ${panels.map(({id: key, body}, index) => `<div role="tabpanel" id="${id}-panel-${key}"
      aria-labelledby="${id}-tab-${key}"${index === 0 ? '' : ' hidden'}>${body}</div>`).join('')}`
  };
}
const resonanceSection = tabbedSection('resonance', 'Resonans', [
  {id: 'swing', label: 'Huske', body: swingSection.body},
  {id: 'forks', label: 'Stemmegafler', body: tuningForkHtml}
]);
const dopplerSection = tabbedSection('doppler', 'Dopplereffekt', [
  {id: 'sound', label: 'Lyd', body: flightSection.body},
  {id: 'light', label: 'Lys', body: lightDopplerHtml}
]);

function mountModelTabs(root, api, id, scenes) {
  const tabs = [...root.querySelectorAll('#'+id+'-tabs [role="tab"]')];
  const panels = tabs.map(tab => root.querySelector('#' + tab.getAttribute('aria-controls')));
  const models = scenes.map(scene => root.querySelector('#'+scene));

  function select(index) {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    models.forEach(model => api.repaint(model));
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      const targets = {
        ArrowLeft: (index + tabs.length - 1) % tabs.length,
        ArrowRight: (index + 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1
      };
      if (!Object.hasOwn(targets, event.key)) return;
      event.preventDefault();
      const next = targets[event.key];
      select(next);
      tabs[next].focus();
    });
  });
}

const svg = (id, title, desc, inside, height = 300) => `<svg id="${id}" viewBox="0 0 760 ${height}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${title}</title><desc id="${id}-desc">${desc}</desc>${inside}</svg>`;
const path = (d, color, width=3, extra='') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const txt = (x,y,text,extra='') => `<text x="${x}" y="${y}" ${extra}>${text}</text>`;
const ln = (x1,y1,x2,y2,color='#8c9ba8',extra='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
const arrow = (x1,y1,x2,y2,color='#187b8c') => {
  const a=Math.atan2(y2-y1,x2-x1), s=8;
  return `${ln(x1,y1,x2,y2,color,'stroke-width="2"')}${path(`M${x2-s*Math.cos(a-.45)},${y2-s*Math.sin(a-.45)}L${x2},${y2}L${x2-s*Math.cos(a+.45)},${y2-s*Math.sin(a+.45)}`,color,2)}`;
};
const num=(n,d=2)=>n.toLocaleString('nb-NO',{maximumFractionDigits:d});
const wavePath=(x0,x1,fn,step=2)=>{let d='';for(let x=x0;x<=x1;x+=step)d+=`${x===x0?'M':'L'}${x.toFixed(1)},${fn(x).toFixed(2)}`;return d;};
export function interferenceDisplacement(x,t,lambda1,lambda2,phaseDegrees=0,speed=2){
  return Math.sin(2*Math.PI*(x/lambda1-speed/lambda1*t))+Math.sin(2*Math.PI*(x/lambda2-speed/lambda2*t)+phaseDegrees*Math.PI/180);
}
export function dopplerAtObserver(sourceX,sourceY,velocityX,observerX,observerY,sourceFrequency=500,soundSpeed=100){
  const dx=observerX-sourceX,dy=observerY-sourceY,a=soundSpeed*soundSpeed-velocityX*velocityX;
  if(!(a>0))throw new RangeError('Subsonic source required');
  // cτ = |R − S(t−τ)|. The positive root gives the emission event of the
  // sound arriving now; the Doppler factor uses that ray, not S(t).
  const dot=dx*velocityX,emissionDelay=(dot+Math.sqrt(dot*dot+a*(dx*dx+dy*dy)))/a;
  const emissionX=sourceX-velocityX*emissionDelay,rayX=observerX-emissionX,distance=Math.hypot(rayX,dy);
  const radialVelocity=distance>1e-9?velocityX*rayX/distance:0;
  return {frequency:sourceFrequency/(1-radialVelocity/soundSpeed),radialVelocity,distance,emissionDelay,emissionX,emissionY:sourceY};
}
export function refractionState(medium='water',reversed=false,angleDegrees=45){
  const dense=medium==='glass'?1.5:1.33,n1=reversed?dense:1,n2=reversed?1:dense;
  const angle=Math.min(90,Math.max(0,angleDegrees))*Math.PI/180,sine=n1/n2*Math.sin(angle),totalReflection=sine>1+1e-12;
  return {angle,n1,n2,totalReflection,refractedAngle:totalReflection?null:Math.asin(Math.min(1,Math.max(-1,sine))),criticalAngle:reversed?Math.asin(n2/n1):null,speedRatio:n1/n2};
}
const colors={wave:'#16879b',amber:'#d28a16',red:'#d75a55',purple:'#8260b4',green:'#398463'};
const phenomena={...{
  "id": "fenomener",
  "title": "Bølgefenomener",
  "kicker": "",
  "summary": "Refleksjon, brytning, interferens, bøyning, resonans og dopplereffekt. Se hva som skjer, og prøv selv.",
  "terms": [
    {
      "term": "Refleksjon",
      "definition": "En bølge sendes tilbake fra en flate."
    },
    {
      "term": "Innfallslodd",
      "definition": "En tenkt linje vinkelrett på flaten i treffpunktet."
    },
    {
      "term": "Innfallsvinkel",
      "definition": "Vinkelen mellom den innkommende strålen og innfallsloddet."
    },
    {
      "term": "Refleksjonsvinkel",
      "definition": "Vinkelen mellom den reflekterte strålen og innfallsloddet."
    },
    {
      "term": "Brytning",
      "definition": "Retningsendring når en bølge får ny fart i overgangen mellom to medier."
    },
    {
      "term": "Totalrefleksjon",
      "definition": "Alt lyset reflekteres tilbake ved stor nok innfallsvinkel fra et medium der lyset går saktere, til et der det går fortere."
    },
    {
      "term": "Fargespredning",
      "definition": "Hvitt lys deles i farger fordi ulike bølgelengder brytes ulikt. Kalles også dispersjon."
    },
    {
      "term": "Interferens",
      "definition": "Bølger overlapper, og utslagene legges sammen."
    },
    {
      "term": "Konstruktiv interferens",
      "definition": "Bølger forsterker hverandre når utslagene peker samme vei."
    },
    {
      "term": "Destruktiv interferens",
      "definition": "Bølger svekker eller slokker hverandre når utslagene peker motsatt vei."
    },
    {
      "term": "Bøyning",
      "definition": "Bølger sprer seg bak åpninger og kanter."
    },
    {
      "term": "Egenfrekvens",
      "definition": "Frekvensen et system svinger med når det får svinge fritt."
    },
    {
      "term": "Resonans",
      "definition": "Stor svingeamplitude ved gjentatt påvirkning nær egenfrekvensen."
    },
    {
      "term": "Demping",
      "definition": "Svingninger avtar fordi energi overføres til omgivelsene, for eksempel gjennom friksjon og luftmotstand."
    },
    {
      "term": "Dopplereffekt",
      "definition": "Mottatt frekvens endres når bølgekilden og mottakeren beveger seg mot eller fra hverandre."
    }
  ],
  "questions": [
    {
      "id": "wv-f1",
      "type": "number",
      "level": "Start",
      "prompt": "En lysstråle treffer et plant speil med innfallsvinkel 35°. Hvor stor er refleksjonsvinkelen, målt fra innfallsloddet?",
      "value": 35,
      "tolerance": 0.1,
      "unit": "°",
      "answer": "Refleksjonsvinkel = innfallsvinkel = <strong>35°</strong>."
    },
    {
      "id": "wv-f2",
      "type": "open",
      "level": "Bruk",
      "prompt": "Tegn et plant speil, innfallslodd og en innkommende stråle som lager 30° med selve speilflaten. Tegn den reflekterte strålen, og finn innfallsvinkelen.",
      "answer": "Innfallsloddet står 90° på speilet. Innfallsvinkelen er 90° − 30° = <strong>60°</strong>. Refleksjonsvinkelen er også 60°, på motsatt side av innfallsloddet."
    },
    {
      "id": "wv-f4",
      "type": "mcq",
      "level": "Bruk",
      "prompt": "Lys går fra luft til glass og får lavere fart. Hva skjer med frekvens og bølgelengde?",
      "choices": [
        "Begge minker.",
        "Frekvensen er uendret, og bølgelengden blir kortere.",
        "Frekvensen øker, og bølgelengden er uendret."
      ],
      "correct": 1,
      "answer": "Frekvensen bestemmes av kilden og er uendret ved overgangen. Siden λ = v/f, gir lavere fart kortere bølgelengde."
    },
    {
      "id": "wv-f5",
      "type": "open",
      "level": "Bruk",
      "prompt": "En blyant står halvveis ned i et glass vann og ser knekt ut sett på skrå. Forklar uten å si at selve blyanten bøyer seg.",
      "answer": "Lys fra den nedsenkede delen endrer fart og retning i overgangen mellom vann og luft. Øyet tolker lyset som om det hadde gått rett fram, slik at den delen ser forskjøvet ut."
    },
    {
      "id": "wv-f6",
      "type": "number",
      "level": "Bruk",
      "prompt": "To like bølger med amplitude 3 cm møtes nøyaktig i fase. Hva er amplituden til summen?",
      "value": 6,
      "tolerance": 0.05,
      "unit": "cm",
      "answer": "Utslagene legges sammen: A<sub>sum</sub> = 3 cm + 3 cm = <strong>6 cm</strong>."
    },
    {
      "id": "wv-f7",
      "type": "open",
      "level": "Bruk",
      "prompt": "Hvordan kan en hodetelefon dempe støy ved å sende ut mer lyd?",
      "answer": "En mikrofon registrerer støy, og hodetelefonen sender ut lyd med omtrent motsatt utslag ved øret. Destruktiv interferens reduserer det samlede lydtrykket der. Dempingen er ikke like god for alle frekvenser og alle steder."
    },
    {
      "id": "wv-f8",
      "type": "mcq",
      "level": "Bruk",
      "prompt": "Bølgelengden holdes uendret. Hva gir tydeligst bøyning gjennom en åpning?",
      "choices": [
        "En åpning som er mange tusen bølgelengder bred.",
        "En åpning på omtrent én bølgelengde.",
        "Åpningens bredde har ingen betydning."
      ],
      "correct": 1,
      "answer": "Bøyning blir særlig tydelig når åpningens bredde er sammenlignbar med bølgelengden eller mindre."
    },
    {
      "id": "wv-f9",
      "type": "open",
      "level": "Bruk",
      "prompt": "Du hører noen snakke ute i gangen selv om du ikke kan se personen gjennom døra. Hvorfor er ikke bøyningen like tydelig for synlig lys?",
      "answer": "Lyd har bølgelengder fra centimeter til meter og bøyes derfor merkbart i en døråpning. Synlig lys har bølgelengder på under en tusendels millimeter. Døra er enorm sammenlignet med lysbølgelengden, så bøyningen er svært liten på denne skalaen."
    },
    {
      "id": "wv-f10",
      "type": "mcq",
      "level": "Start",
      "prompt": "Når får en huske vanligvis størst utslag av like store, gjentatte dytt?",
      "choices": [
        "Når dyttene følger omtrent huskas egen svingerytme.",
        "Når dyttene kommer så fort som mulig.",
        "Når dyttene alltid kommer på tilfeldige tidspunkt."
      ],
      "correct": 0,
      "answer": "Dyttes huska i riktig rytme og retning, overføres energi effektivt. Dette er resonans. Demping gjør at utslaget ikke vokser uten grense."
    },
    {
      "id": "wv-f11",
      "type": "open",
      "level": "Bruk",
      "prompt": "To stemmegafler står nær hverandre. Den ene kan begynne å svinge når du slår på den andre. Hvorfor virker dette best når de har samme egenfrekvens?",
      "answer": "Lydbølgene fra den første påvirker den andre periodisk. Når frekvensen passer med egenfrekvensen, kan den andre ta opp energi effektivt og få merkbar amplitude: resonans."
    },
    {
      "id": "wv-f12",
      "type": "mcq",
      "level": "Start",
      "prompt": "En ambulanse kjører mot deg med konstant sirenefrekvens. Hvordan er frekvensen du hører sammenlignet med sirenens egen frekvens?",
      "choices": [
        "Lavere.",
        "Den samme.",
        "Høyere."
      ],
      "correct": 2,
      "answer": "Kilden flytter seg nærmere mellom hver utsendte bølgetopp. Avstanden mellom toppene foran ambulansen blir mindre, så mottatt frekvens øker."
    },
    {
      "id": "wv-f14",
      "type": "open",
      "level": "Utfordring",
      "prompt": "Hvor høyt må et plant speil minst være for at du skal kunne se hele kroppen, fra føtter til toppen av hodet? Anta at speilet plasseres riktig og at øynene er punktformede.",
      "answer": "Speilet må være <strong>halvparten av kroppshøyden</strong>. Lyset fra føttene treffer speilet halvveis mellom føttene og øyehøyden; lyset fra toppen treffer halvveis mellom hodetoppen og øyehøyden. Avstanden mellom disse treffpunktene er halve kroppshøyden. Dette er uavhengig av hvor langt fra speilet du står."
    }
  ],
  "resources": [
    {
      "label": "PhET: Brytning av lys",
      "url": "https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_all.html"
    },
    {
      "label": "PhET: Bølgeinterferens",
      "url": "https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_all.html"
    }
  ]
},sections:[{"title":"Refleksjon: bølgen sendes tilbake","body":"<style>\n.wv-scope svg{display:block;width:100%;height:auto;max-height:none;overflow:hidden;background:var(--model-bg,var(--sidebar,#f1f6f7));border-radius:12px}.wv-scope svg text{font:14px system-ui,sans-serif;fill:var(--ink,#273d4a)}.wv-scope svg .wv-small{font-size:12px;fill:var(--muted,#657985)}.wv-scope .wv-live{font-variant-numeric:tabular-nums}.wv-scope .wv-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.wv-scope .wv-buttons{display:flex;gap:7px;flex-wrap:wrap}.wv-scope .wv-buttons button{padding:6px 10px;border:1px solid var(--line,#bcced2);border-radius:7px;background:var(--surface,#fff);color:var(--ink,#273d4a);cursor:pointer;font:inherit;font-size:12px}.wv-scope .wv-buttons button[aria-pressed=\"true\"]{background:#187b8c;color:#fff;border-color:#187b8c}.wv-scope select{max-width:100%;font:inherit}.wv-scope .controls{margin-top:12px}.wv-scope label{display:block}.wv-scope input[type=\"range\"]{width:100%;accent-color:#187b8c}.wv-scope .wv-keyline{margin:12px 0 0;font-size:.92em}.wv-scope .wv-swatch{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px}.wv-scope .wv-legend{display:flex;gap:18px;flex-wrap:wrap;font-size:.88em;margin-top:9px}.wv-scope .wv-summary{padding:10px 12px;border-radius:9px;background:var(--surface,#fff);margin-top:12px}.wv-scope .wv-control-head{display:flex;justify-content:space-between;gap:10px}.wv-scope .wv-control-head output{font-weight:650;white-space:nowrap}.wv-scope .wv-interference-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.wv-scope .wv-interference-controls label{min-width:0}.wv-scope .wv-interference-presets{margin-top:12px}.wv-scope .wv-component-panel{fill:var(--surface,#fff);stroke:var(--line,#dce5de);stroke-width:1}.wv-scope .wv-diff-barrier{fill:#778d97}.wv-scope .wv-field-canvas{display:block;width:100%;height:auto;aspect-ratio:760/340;border-radius:12px;background:#e8f1f3}.wv-field-legend{display:flex;gap:18px;flex-wrap:wrap;font-size:11px;color:var(--muted);margin:9px 0}.wv-field-legend span{display:inline-flex;align-items:center;gap:6px}.wv-field-legend i{width:16px;height:9px;border:1px solid #b5c9d0;border-radius:3px}.wv-scope .wv-check{display:flex;align-items:center;gap:8px;font-size:12px}.wv-scope .wv-check input{width:16px;height:16px}.wv-scope .wv-svg-bubble{fill:var(--surface,#fff);stroke:var(--line,#dce5de)}.wv-scope .wv-cartoon-label{font-size:13px;font-weight:650}.wv-scope .wv-readout-tag{display:block;font-size:11px;color:var(--muted);margin-top:2px}@media(max-width:560px){.wv-scope .wv-grid{grid-template-columns:1fr}.wv-scope .wv-interference-controls{grid-template-columns:1fr 1fr}.wv-scope .wv-interference-controls label:last-child{grid-column:1/-1}.wv-scope svg text{font-size:16px}.wv-scope svg .wv-small{font-size:14px}}\n</style><p>Når en bølge treffer en flate og sendes tilbake, får vi <strong>refleksjon</strong>. Vinklene måles fra <strong>innfallsloddet</strong>, som står vinkelrett på flaten. For speilende refleksjon er innfallsvinkelen lik refleksjonsvinkelen.</p><div class=\"wv-scope\"><div class=\"model\"><svg id=\"wv-reflection\" viewBox=\"0 0 760 300\" role=\"img\" aria-labelledby=\"wv-reflection-title wv-reflection-desc\"><title id=\"wv-reflection-title\">Refleksjon fra et plant speil</title><desc id=\"wv-reflection-desc\">Innkommende og reflektert lys danner like store vinkler med innfallsloddet. Endre innfallsvinkelen.</desc></svg><div class=\"controls\"><label class=\"control\" for=\"wv-angle\"><span class=\"wv-control-head\"><span>Innfallsvinkel</span><output id=\"wv-angle-value\"></output></span><input id=\"wv-angle\" type=\"range\" min=\"5\" max=\"80\" value=\"40\" step=\"1\"></label></div><div id=\"wv-reflection-readout\" class=\"readout wv-live\" aria-live=\"polite\"></div></div></div>"},{...refractionSection,body:refractionSection.body+practicalExamplesDialogHtml},{"anchor":"interferens","title":"Interferens: utslagene legges sammen","body":"<p>Bølger kan være på samme sted samtidig. Det samlede utslaget er <strong>summen</strong>. <strong>Konstruktiv interferens</strong> forsterker utslaget; <strong>destruktiv interferens</strong> svekker det. To like bølger i motfase kan slokke hverandre helt ut.</p><div class=\"wv-scope\"><div class=\"model\"><svg id=\"wv-interference\" viewBox=\"0 0 760 290\" role=\"img\" aria-labelledby=\"wv-interference-title wv-interference-desc\"><title id=\"wv-interference-title\">To bølger og summen av dem</title><desc id=\"wv-interference-desc\">Separate felt viser bølge 1, bølge 2 og summen med samme skala. Bølgene har lik amplitude, frekvens og bølgelengde. Juster faseforskjellen.</desc></svg><div class=\"controls\"><label class=\"control\" for=\"wv-phase\"><span class=\"wv-control-head\"><span>Faseforskjell</span><output id=\"wv-phase-value\"></output></span><input id=\"wv-phase\" type=\"range\" min=\"0\" max=\"360\" value=\"0\" step=\"5\"></label></div><div class=\"wv-buttons wv-interference-presets\" role=\"group\" aria-label=\"Prøv interferens\"><button type=\"button\" id=\"wv-interference-inphase\" data-wv-interference-preset=\"inphase\" aria-pressed=\"true\">Konstruktiv · i fase</button><button type=\"button\" id=\"wv-interference-antiphase\" data-wv-interference-preset=\"antiphase\" aria-pressed=\"false\">Destruktiv · motfase</button></div><div id=\"wv-interference-readout\" class=\"readout wv-live\" aria-live=\"polite\"></div><p class=\"model-note\">Begge har amplitude A og samme bølgelengde og frekvens. 0° og 360°: i fase. 180°: motfase. Prikkene viser de to utslagene og summen ved samme sted.</p></div></div>"},diffractionSection,resonanceSection,dopplerSection],
 mount(root,api,{section}={}){
 const q=id=>root.querySelector('#'+id),get=id=>+q(id).value,layers={};
 const say=(id,lines)=>{const html=(Array.isArray(lines)?lines:[lines]).map(line=>`<div>${line}</div>`).join('');if(q(id).innerHTML!==html)q(id).innerHTML=html;};
 for(const id of ['reflection','interference']){const g=document.createElementNS('http://www.w3.org/2000/svg','g');q('wv-'+id).append(g);layers[id]=g;}
 function update(){
 q('wv-angle-value').textContent=num(get('wv-angle'),0)+'°';q('wv-phase-value').textContent=num(get('wv-phase'),0)+'°';
 say('wv-reflection-readout',[`Innfallsvinkel: ${get('wv-angle')}°`,`Refleksjonsvinkel: ${get('wv-angle')}°`]);
 const phase=get('wv-phase'),amp=2*Math.abs(Math.cos(phase*Math.PI/360));
 q('wv-interference-readout').innerHTML=`<div>Faseforskjell: <strong>${num(phase,0)}°</strong></div><div>Summens amplitude: <strong>${num(amp)} · A</strong></div><div><strong>${amp<.01?'Destruktiv: full utslokking':amp>1.99?'Konstruktiv: full forsterkning':'Delvis forsterkning eller svekking'}</strong></div>`;
 root.querySelectorAll('[data-wv-interference-preset]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.wvInterferencePreset==='inphase'?phase%360===0:phase===180)));
 drawReflection();api.repaint(q('wv-interference'));
 }
 for(const id of ['wv-angle','wv-phase'])q(id).addEventListener('input',update);
 root.querySelectorAll('[data-wv-interference-preset]').forEach(button=>button.addEventListener('click',()=>{q('wv-phase').value=button.dataset.wvInterferencePreset==='antiphase'?'180':'0';update();}));
 function drawReflection(){
      // Reflection. All angles are measured from the normal.
      let angle=get('wv-angle'),a=angle*Math.PI/180,rad=180,x=380,yy=224;
      const ix=x-rad*Math.sin(a),iy=yy-rad*Math.cos(a),ox=x+rad*Math.sin(a),oy=iy;
      const angleLabelOffset=Math.max(27,83*Math.sin(a/2));
      layers.reflection.innerHTML=`<rect x="50" y="224" width="660" height="16" rx="4" fill="#a5b8c1"/>${ln(x,32,x,224,'#9fb0ba','stroke-dasharray="6 5"')}${txt(x+10,32,'Innfallslodd','class="wv-small"')}${arrow(ix,iy,x,yy,colors.amber)}${arrow(x,yy,ox,oy,colors.wave)}${txt(Math.min(680,ox+10),Math.max(64,oy),'Reflektert','class="wv-small"')}${txt(Math.max(50,ix-10),Math.max(64,iy),'Innkommende','text-anchor="end" class="wv-small"')}${path(`M380,172 A52,52 0 0 0 ${380-52*Math.sin(a)},${224-52*Math.cos(a)}`,colors.amber,2)}${path(`M380,172 A52,52 0 0 1 ${380+52*Math.sin(a)},${224-52*Math.cos(a)}`,colors.wave,2)}${txt(380-angleLabelOffset,224-83*Math.cos(a/2),angle+'°','text-anchor="middle"')}${txt(380+angleLabelOffset,224-83*Math.cos(a/2),angle+'°','text-anchor="middle"')}${txt(380,279,'Speilende flate','text-anchor="middle" class="wv-small"')}`;
    }
    
    api.onFrame(t=>{
      // Two matched waves with adjustable phase.
      const l1=2,l2=2,phaseDegrees=get('wv-phase'),phase=phaseDegrees*Math.PI/180;
      const worldX=px=>(px-105)/625*10,component=(px,lambda,p)=>Math.sin(2*Math.PI*(worldX(px)/lambda-2/lambda*t)+p);
      const panel=(base,label,c,fn,id)=>`<rect x="12" y="${base-41}" width="736" height="82" rx="8" class="wv-component-panel"/>${txt(26,base+5,label,'class="wv-small"')}${ln(105,base,730,base,'#c2d0d7')}${ln(417.5,base-34,417.5,base+34,'#a8bab9','stroke-dasharray="3 4"')}${path(wavePath(105,730,px=>base-18*fn(px)),c,2.8,`id="${id}"`)}<circle cx="417.5" cy="${base-18*fn(417.5)}" r="4" fill="${c}"/>`;
      layers.interference.innerHTML=panel(47,'Bølge 1',colors.wave,px=>component(px,l1,0),'wv-component-1')+panel(137,'Bølge 2',colors.purple,px=>component(px,l2,phase),'wv-component-2')+panel(227,'Sum',colors.amber,px=>interferenceDisplacement(worldX(px),t,l1,l2,phaseDegrees),'wv-interference-sum')+txt(730,286,'Samme sted x →','text-anchor="end" class="wv-small"');
    },q('wv-interference'));

 const cleanups=[mountRefraction(root,api),mountPracticalExamplesDialog(root,api),mountDiffraction(root,api,{twoSlits:section===diffractionSection.anchor}),mountResonance(root,api),mountTuningForks(root,api),mountFlight(root,api),mountLightDoppler(root,api)];
 mountModelTabs(root,api,'resonance',['wv-resonance','wv-tuning-forks']);
 mountModelTabs(root,api,'doppler',['fd-scene','ld-scene']);update();
 return ()=>{for(const cleanup of cleanups)if(typeof cleanup==='function')cleanup();};
 }
};
export const topics=[phenomena];
