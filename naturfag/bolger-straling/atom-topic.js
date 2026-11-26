import {atomLabSection,customAtomSection,mountAtomLab,HYDROGEN_GROUND_AJ} from './atom-lab.js?v=20261126-atomoppgaver';
import {hydrogenSeriesSection,mountHydrogenSeries} from './hydrogen-series.js?v=20261126-atomoppgaver';
import {spectraLabSection,mountSpectraLab} from './spectra-lab.js?v=20261126-absorpsjon';
import {atomQuestions} from './atom-questions.js?v=20261126-atomoppgaver';

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
  questions:atomQuestions,
  resources:[
    {label:'NDLA – Elektronsprang og absorpsjonsspekter',url:'https://ndla.no/nb/r/naturfag-sf/simulering-av-elektronsprang-og-absorpsjonsspekter/9f5716d7ba'},
    {label:'NDLA – Elektromagnetiske bølger',url:'https://ndla.no/nb/r/naturfag-sf/elektromagnetiske-bolgjer/94cf3f3dfd'},
    {label:'NDLA – Modeller',url:'https://ndla.no/r/naturfag-ba/modeller/06b69f77e8'},
    {label:'PhET: Modeller av hydrogenatomet',url:'https://phet.colorado.edu/nb/simulations/models-of-the-hydrogen-atom'},
    {label:'NASA: Slik virker emisjons- og absorpsjonsspektre',url:'https://science.nasa.gov/mission/webb/science-overview/science-explainers/spectroscopy-101-how-absorption-and-emission-spectra-work/'}
  ],mount:mountAtom
};
