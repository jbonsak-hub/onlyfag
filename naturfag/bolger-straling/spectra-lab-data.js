import {elementSpectraData} from './element-spectra-data.js?v=20261116-layout2';

const purdueDischarge = 'https://chemed.chem.purdue.edu/demos/demosheets/6.5.html';

const samples = [
  {
    z:1,
    symbol:'H',
    label:'Hydrogen',
    glow:'#d66bdd',
    glowLabel:'rosa til fiolett',
    glowSource:'https://learn.k20center.ou.edu/lesson/986/Sample%2520Data%25E2%2580%2594Emission%2520Spectra%2520of%2520Excited%2520Gases.pdf?language=English&rev=45557',
    note:'De fire Balmerlinjene som vises her, kommer fra hydrogenatomer i utladningen.',
    wavelengths:[410.174,434.0462,486.13615,656.28518]
  },
  {
    z:2,
    symbol:'He',
    label:'Helium',
    glow:'#ffad89',
    glowLabel:'rosaoransje',
    glowSource:purdueDischarge,
    note:'En sterk gul linje ved 588 nm er én del av lyset fra heliumrøret.',
    wavelengths:[388.86489,402.6191,447.1479,471.3146,492.1931,501.5678,587.56148,667.81517,706.51771,728.135]
  },
  {
    z:7,
    symbol:'N',
    label:'Nitrogen',
    glow:'#cd85db',
    glowLabel:'rosafiolett',
    glowSource:'https://doi.org/10.1088/0963-0252/17/2/025013',
    note:'Lys fra N₂-molekyler bidrar til rørgløden. Spekteret her viser utvalgte linjer fra nøytrale N-atomer.',
    wavelengths:[496.398,575.25,648.27,742.364,744.229,746.831]
  },
  {
    z:8,
    symbol:'O',
    label:'Oksygen',
    glow:'#929aff',
    glowLabel:'blåfiolett',
    glowSource:purdueDischarge,
    note:'Et O₂-rør kan også gi molekylbånd. Spekteret her viser utvalgte linjer fra nøytrale O-atomer.',
    wavelengths:[394.729,615.677,645.598,700.223,725.445,777.194]
  },
  {
    z:10,
    symbol:'Ne',
    label:'Neon',
    glow:'#ff6838',
    glowLabel:'rødoransje',
    glowSource:purdueDischarge,
    note:'Mange linjer i den røde og oransje delen av spekteret bidrar til fargen.',
    wavelengths:[
      453.77545,470.43949,488.4917,503.77512,534.10938,540.05618,576.44188,585.24879,
      588.18952,597.5534,602.99969,607.43377,614.30626,616.35939,621.72812,626.6495,
      633.44278,638.29917,640.2248,650.65281,659.89529,692.94673,703.24131,717.39381,
      724.51666,748.88712,753.57741
    ]
  },
  {
    z:11,
    symbol:'Na',
    label:'Natrium',
    glow:'#ffdb45',
    glowLabel:'gul',
    glowSource:'https://images.philips.com/is/content/PhilipsConsumer/PDFDownloads/Global/ODLI20160609_001-UPD-en_AA-Lighting-Hardware-17122012.pdf',
    note:'I en oppvarmet natriumlampe med lavt trykk dominerer de to gule linjene nær 589 nm.',
    wavelengths:[568.2633,568.8205,588.995,589.5924,615.4225,616.0747]
  }
];

export const spectraLabElements = samples.map(({z,wavelengths,...sample}) => {
  const {n:neutralLines,source:lineSource} = elementSpectraData[z-1];
  const selected = neutralLines.filter(([wavelength]) => wavelengths.includes(wavelength));
  const maxIntensity = Math.max(...selected.map(([,intensity]) => intensity));
  // Compress the intensity scale so weak reference lines are still visible.
  const lines = selected.map(([wavelength,intensity]) => [wavelength,Math.sqrt(intensity/maxIntensity)]);
  return {...sample,lineSource,lines};
});

export const spectraLabNotes = {
  lines:'Bølgelengdene er hentet fra NISTs tabeller. Linjestyrken vises skjematisk.',
  absorption:'De samme overgangene kan gi mørke linjer når atomene absorberer lys. Hvilke linjer du ser, avhenger av hvor mange atomer som starter på de aktuelle energinivåene.',
  glow:'Rørfargene er omtrentlige og kan variere med trykket og hvordan gassen eksiteres.'
};
