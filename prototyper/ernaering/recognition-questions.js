// Original structure-identification tasks, limited to familiar nutrient names.
export const recognitionQuestions = [
  {
    id: 'recognition-glycerol-name', topic: 'fat', type: 'choice', level: 1,
    family: 'fat-building-blocks', figure: 'recognition-glycerol',
    title: 'Navngi den korte karbonkjeden',
    prompt: 'Hvilket navn passer til strukturformelen?',
    options: ['Glyserol', 'Fettsyre', 'Aminosyre', 'Glukose'],
    answer: 'Glyserol',
    hint: 'Se på antall C-atomer og hvordan O og H er bundet til kjeden.',
    explanation: 'Dette er glyserol: tre C-atomer i en kjede, med én OH-gruppe på hvert C-atom. Ett glyserolmolekyl kan bindes sammen med tre fettsyrer og danne fett.'
  },
  {
    id: 'recognition-fatty-acid-name', topic: 'fat', type: 'choice', level: 1,
    family: 'fat-building-blocks', figure: 'recognition-fatty-acid',
    title: 'Navngi den lange karbonkjeden',
    prompt: 'Hvilket navn passer til strukturformelen?',
    options: ['Fettsyre', 'Glyserol', 'Aminosyre', 'Glukose'],
    answer: 'Fettsyre',
    hint: 'Se på gruppen helt til høyre, og sammenlign resten av molekylet med de andre stoffene.',
    explanation: 'Dette er en fettsyre. Den har en karbonkjede med H-atomer og en syregruppe, COOH, i den ene enden. Glyserol har tre C-atomer og tre OH-grupper; en aminosyre har også nitrogen.'
  },
  {
    id: 'recognition-amino-acid-name', topic: 'protein', type: 'choice', level: 1,
    family: 'amino-building-blocks', figure: 'recognition-amino-acid',
    title: 'Navngi modellen med nitrogen',
    prompt: 'Hva slags byggestein viser strukturformelen?',
    options: ['Aminosyre', 'Glyserol', 'Fettsyre', 'Glukose'],
    answer: 'Aminosyre',
    hint: 'Finn både N med H-atomer og syregruppen i samme molekyl.',
    explanation: 'Dette er en aminosyre. Den har både en aminogruppe, NH₂, og en syregruppe, COOH. Aminosyrer er byggesteinene i proteiner. Her er den varierende gruppen et H-atom.'
  },
  {
    id: 'recognition-glucose-name', topic: 'carbs', type: 'choice', level: 1,
    family: 'sugar-rings', figure: 'recognition-glucose',
    title: 'Navngi ringstrukturen',
    prompt: 'Hvilket navn passer til ringstrukturen?',
    options: ['Glukose', 'Fruktose', 'Sukrose', 'Glyserol'],
    answer: 'Glukose',
    hint: 'Tell atomene i ringen, og se hvor mange C-atomer som er utenfor den.',
    explanation: 'Modellen viser glukose i ringform. Ringen har fem C-atomer og ett O-atom; det sjette C-atomet sitter i CH₂OH-gruppen utenfor ringen. Fruktosemodellen har en femleddet ring og to CH₂OH-grupper. Sukrose har to sammenbundne ringer.'
  },
  {
    id: 'recognition-sucrose-name', topic: 'carbs', type: 'choice', level: 2,
    family: 'sugar-rings', figure: 'recognition-sucrose',
    title: 'Navngi de sammenbundne ringene',
    prompt: 'Hvilket navn passer til dette molekylet?',
    options: ['Sukrose', 'Maltose', 'Glukose', 'Glyserol'],
    answer: 'Sukrose',
    hint: 'Se både på antallet ringer og på om ringene er like.',
    explanation: 'Dette er sukrose, som består av glukose og fruktose. Her vises glukosedelen med en seksleddet ring og fruktosedelen med en femleddet ring. Maltose består av to glukoseenheter, mens glukose alene bare er én sukkerenhet.'
  },
  {
    id: 'recognition-starch-name', topic: 'carbs', type: 'choice', level: 2,
    family: 'carb-storage-models', figure: 'recognition-starch',
    title: 'Navngi plantens energilager',
    prompt: 'Stoffet i modellen er plantens energilager i potetknoller. Hva heter det?',
    options: ['Stivelse', 'Glykogen', 'Cellulose', 'Sukrose'],
    answer: 'Stivelse',
    hint: 'Bruk både opplysningen om hva planten bruker stoffet til, og kjedemodellen.',
    explanation: 'Stivelse er plantenes energilager og finnes blant annet i potetknoller. Det består av lange kjeder av glukoseenheter. Glykogen er energilager hos dyr, og cellulose bygger opp plantecellevegger. Kjedemodellen alene skiller ikke sikkert mellom disse polysakkaridene; opplysningen om plantens energilager er derfor nødvendig.'
  },
  {
    id: 'recognition-mixed-sugar-amino', topic: 'protein', type: 'match', level: 2,
    family: 'recognition-mixed', figure: 'recognition-mixed-sugar-amino',
    title: 'To strukturer fra ulike næringsstoffer',
    prompt: 'Koble hver bokstav til riktig navn og riktig rolle.',
    pairs: [
      {left: 'A', right: 'Glukose – et monosakkarid'},
      {left: 'B', right: 'Aminosyre – byggestein i proteiner'}
    ],
    hint: 'Sammenlign ringstrukturen med modellen som inneholder N. Begge har C, H og O.',
    explanation: 'A er glukose, et monosakkarid med én ring i denne modellen. B er en aminosyre med både NH₂ og COOH. Aminosyrer kan bindes sammen til proteiner. At begge molekylene inneholder C, H og O, er ikke nok til å plassere dem i samme gruppe.'
  },
  {
    id: 'recognition-mixed-sugar-fat', topic: 'fat', type: 'match', level: 2,
    family: 'recognition-mixed', figure: 'recognition-mixed-sugar-fat',
    title: 'Ring og kjede',
    prompt: 'Koble hver bokstav til riktig navn og riktig rolle.',
    pairs: [
      {left: 'A', right: 'Glukose – et monosakkarid'},
      {left: 'B', right: 'Fettsyre – byggestein i fett'}
    ],
    hint: 'Sammenlign hvordan O-atomene er fordelt i de to modellene.',
    explanation: 'A er glukose. Det har flere OH-grupper fordelt rundt en ring. B er en fettsyre: en karbonkjede med en COOH-gruppe i enden. Fettsyrer kan bindes sammen med glyserol og danne fett. Glukose og fettsyrer er derfor ulike stoffer selv om begge inneholder C, H og O.'
  }
];
