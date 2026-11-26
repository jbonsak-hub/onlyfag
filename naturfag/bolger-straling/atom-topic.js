import {atomLabSection,customAtomSection,mountAtomLab,HYDROGEN_GROUND_AJ} from './atom-lab.js?v=20261126-absorpsjon';
import {hydrogenSeriesSection,mountHydrogenSeries} from './hydrogen-series.js?v=20261126-absorpsjon';
import {spectraLabSection,mountSpectraLab} from './spectra-lab.js?v=20261126-absorpsjon';

const C = 299792458, H = 6.62607015e-34, AJ = 1e-18;
function mountAtom(root,api){
  const cleanups=[mountAtomLab(root,api),mountHydrogenSeries(root,api),mountSpectraLab(root,api)];
  return ()=>{for(const cleanup of cleanups) cleanup?.();};
}

export function ionizationOutcome(energyAJ){
  const energy=Number(energyAJ),threshold=-HYDROGEN_GROUND_AJ,energyJ=energy*AJ,kinetic=Math.max(0,energy-threshold);
  return {energy,threshold,energyAJ:energy,thresholdAJ:threshold,energyJ,ionizes:energy>=threshold,kinetic,kineticAJ:kinetic,kineticJ:kinetic*AJ,wavelength:C*H/energyJ*1e9};
}

export const atomTopic = {
  id:'atomer',title:'Stråling fra atomet',kicker:'Energinivåer og fingeravtrykk',
  animationControls:false,
  summary:'Atomer tar opp og sender ut bestemte fotoner. Det gjør lyset til en nøkkel til stoffenes innhold.',
  sections:[
    atomLabSection,
    hydrogenSeriesSection,
    customAtomSection,
    spectraLabSection
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
