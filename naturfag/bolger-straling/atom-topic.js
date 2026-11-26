import {atomLabSection,customAtomSection,mountAtomLab,HYDROGEN_GROUND_AJ} from './atom-lab.js?v=20261126-hydrogen';
import {hydrogenSeriesSection,mountHydrogenSeries} from './hydrogen-series.js?v=20261126-hydrogen';

const C = 299792458, H = 6.62607015e-34, AJ = 1e-18;
const fmt = (x, digits = 2) => x.toLocaleString('nb-NO', {maximumFractionDigits: digits});
const line = (points) => points.map((p,i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');

const ionizationStyle = `<style>
.ema-ion-model .ema-atom-svg{display:block;width:100%;height:auto}
.ema-ion-model .ema-svg-text{fill:var(--ink,#183b40);font:13px system-ui,sans-serif}
.ema-ion-model .ema-muted-text{fill:var(--muted,#526a72);font:12px system-ui,sans-serif}
.ema-ion-model .ema-signal-result{padding:8px 11px;border-radius:9px;background:var(--sidebar,#f0f5f0);font-size:11px;line-height:1.55}
.ema-ion-model .ema-model-details{margin:7px 0 0;font-size:10px;color:var(--muted,#526a72)}
.ema-ion-model .ema-model-details>p{margin:6px 0 0;font-size:11px;line-height:1.55}
</style>`;

function mountAtom(root,api){
  const cleanups=[mountAtomLab(root,api),mountHydrogenSeries(root,api),mountIonization(root,api)];
  return ()=>{for(const cleanup of cleanups) cleanup?.();};
}

export function ionizationOutcome(energyAJ){
  const energy=Number(energyAJ),threshold=-HYDROGEN_GROUND_AJ,energyJ=energy*AJ,kinetic=Math.max(0,energy-threshold);
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

export const atomTopic = {
  id:'atomer',title:'Stråling fra atomet',kicker:'Energinivåer og fingeravtrykk',
  summary:'Atomer tar opp og sender ut bestemte fotoner. Det gjør lyset til en nøkkel til stoffenes innhold.',
  sections:[
    atomLabSection,
    hydrogenSeriesSection,
    customAtomSection,
    {title:'Spektrallinjer er stoffenes fingeravtrykk',body:`<div class="concept-grid"><article class="concept"><h3>Emisjonsspekter</h3><p>En tynn, varm gass gir lyse linjer ved bestemte bølgelengder. Grunnstoffets energinivåer bestemmer mønsteret.</p></article><article class="concept"><h3>Absorpsjonsspekter</h3><p>Når et bredt lysspekter passerer en kjøligere gass, svekkes bestemte bølgelengder. De mørke linjene svarer til de samme energiforskjellene.</p></article></div><p>Ved å sammenlikne linjemønstre kan vi finne hvilke grunnstoffer en lyskilde eller en gass inneholder. Mer om stjernespektre finner du under <a href="/prototyper/bolger-straling.html#universet/fagstoff" target="_top">Stjerner og universet</a>.</p>`},
    {title:'Nordlyset forteller hva atmosfæren inneholder',body:`<p>Energirike partikler fra verdensrommet ledes av jordas magnetfelt og kolliderer med partikler i atmosfæren. Oksygen og nitrogen eksiteres. Når de mister energi igjen, sendes lys ut ved karakteristiske bølgelengder.</p><div class="key"><strong>Grønt og rødt nordlys</strong> kommer ofte fra oksygen; nitrogen bidrar blant annet med blålige og rødfiolette toner. Høyde og kollisjoner påvirker hvilke overganger vi ser.</div>`},
    {title:'Kan ett foton ionisere hydrogen?',body:ionizationStyle+`<p>Et hydrogenatom i <strong>grunntilstanden</strong> trenger minst <strong>2,18 aJ</strong> for å frigjøre elektronet. Hvis et foton absorberes med større energi, blir overskuddet kinetisk energi hos elektronet.</p><div class="model ema-ion-model"><div class="controls"><label class="control" for="ema-ion-energy">Fotonenergi <output id="ema-ion-energy-value" for="ema-ion-energy">3,00 aJ</output><input id="ema-ion-energy" type="range" min="0.3" max="4.8" step="0.01" value="3"></label><button id="ema-ion-send" type="button">Send foton</button><button id="ema-ion-reset" type="button">Nullstill</button></div><svg id="ema-ion-plot" class="ema-atom-svg" viewBox="0 0 760 232" role="img" aria-label="Ett foton møter hydrogen; elektronet er bundet eller frigjøres"></svg><div id="ema-ion-readout" class="ema-signal-result" aria-live="polite"></div><p class="model-note">Under 2,18 aJ kan et foton likevel gi <strong>eksitasjon</strong> dersom energien passer til et tillatt energisprang.</p><details class="ema-model-details"><summary>Om den skjematiske atommodellen</summary><p>Prikkene og sirklene viser bundet eller fri tilstand, ikke klassiske elektronbaner. Ved terskelen er elektronet frigjort med tilnærmet null kinetisk energi; det tegnes like utenfor for å skille tilstandene. Ikke alle fotoner absorberes i et virkelig møte. Terskelen gjelder hydrogen i grunntilstanden, og andre stoffer eller eksiterte atomer kan ha andre grenser.</p></details></div>`}
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
};
