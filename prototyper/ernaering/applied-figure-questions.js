// Applied visual reasoning within the nutrition curriculum. Quantities in models are provided.
export const appliedFigureQuestions = [
  {
    id: 'applied-protein-combination',
    topic: 'protein',
    type: 'choice',
    level: 2,
    title: 'Kombiner proteinkilder',
    prompt: 'Tabellen viser tre essensielle aminosyrer i en forenklet modell. Målet er minst 4 enheter av hver av disse tre. Hvilken kombinasjon oppfyller målet?',
    figure: 'applied-protein-combination',
    options: [
      'Én porsjon P og én porsjon Q',
      'To porsjoner P',
      'To porsjoner Q',
      'Én porsjon P'
    ],
    answer: 'Én porsjon P og én porsjon Q',
    hint: 'Legg sammen mengden av A, B og C hver for seg. Alle tre må nå målet.',
    explanation: 'P + Q gir 5 enheter A, 4 enheter B og 4 enheter C. To porsjoner P gir for lite B, mens to porsjoner Q gir for lite A og C. Proteinkilder med ulik sammensetning av aminosyrer kan utfylle hverandre. Modellen viser bare de tre aminosyrene i tabellen.'
  },
  {
    id: 'applied-fat-processes',
    topic: 'fat',
    type: 'match',
    level: 2,
    title: 'To forandringer i fett',
    prompt: 'Koble modell A og modell B til riktig prosess. De grønne og oransje delene viser byggesteiner i fettmolekylene.',
    figure: 'applied-fat-processes',
    pairs: [
      {left: 'Modell A', right: 'Galle finfordeler fettet i mindre dråper.'},
      {left: 'Modell B', right: 'Enzymer spalter fettmolekylene i byggesteiner.'}
    ],
    hint: 'Se om hele molekyler flyttes fra hverandre, eller om selve molekylene deles opp.',
    explanation: 'I A blir én stor fettdråpe til flere små dråper. Fettmolekylene er fortsatt hele. Dette viser virkningen av galle. I B deles et fettmolekyl i glyserol og tre fettsyrer. Enzymer står for denne spaltingen.'
  },
  {
    id: 'applied-vitamin-distribution',
    topic: 'micro',
    type: 'choice',
    level: 2,
    title: 'Et vitamin i vann og olje',
    prompt: 'Modellen viser hvordan vitamin X løser seg i vann og olje. Hvilket av vitaminene passer best til fordelingen?',
    figure: 'applied-vitamin-distribution',
    options: ['Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K'],
    answer: 'Vitamin C',
    hint: 'Bruk forskjellen mellom vannløselige og fettløselige vitaminer.',
    explanation: 'Prikkene ligger i vannlaget. Det passer med vitamin C, som er vannløselig. Vitamin D, E og K er fettløselige og passer derfor dårligere til denne modellen.'
  },
  {
    id: 'applied-absorption-surface',
    topic: 'digestion',
    type: 'fill',
    level: 2,
    title: 'Overflate i samme bredde',
    prompt: 'A og B er modeller av tarmvegg over samme bredde. Hvert stykke mellom to prikker representerer like stor overflate. Hvor mange ganger så stor overflate har B som A?',
    figure: 'applied-absorption-surface',
    blanks: [{label: 'B har … ganger så stor overflate som A', answers: ['2', 'to']}],
    hint: 'Tell stykkene mellom prikkene, ikke selve prikkene.',
    explanation: 'A har 3 stykker, og B har 6. Forholdet er 6 : 3 = 2. Foldene gir mer tarmvegg på samme bredde. I tynntarmen gir folder og tarmtotter stor overflate for opptak av næringsstoffer.'
  },
  {
    id: 'applied-glucose-regulation',
    topic: 'energy',
    type: 'choice',
    level: 2,
    title: 'Blodsukker etter et måltid',
    prompt: 'Blodsukker etter et måltid: Hvilket tidsrom og hvilken hormonvirkning passer til kurvens nedgang?',
    figure: 'applied-glucose-regulation',
    options: [
      '30–90 min: Insulin øker cellenes opptak av glukose.',
      '0–30 min: Insulin øker cellenes opptak av glukose.',
      '30–90 min: Glukagon øker leverens frigjøring av glukose.',
      '0–30 min: Glukagon øker leverens frigjøring av glukose.'
    ],
    answer: '30–90 min: Insulin øker cellenes opptak av glukose.',
    hint: 'Finn først intervallet der kurven synker. Hvilket hormon bidrar til å senke blodsukkeret?',
    explanation: 'Kurven synker fra omtrent 30 til 90 minutter. Når blodsukkeret stiger etter et måltid, frigjør bukspyttkjertelen insulin. Insulin bidrar til at glukose tas opp i celler og lagres som glykogen, slik at blodsukkeret synker. Glukagon bidrar til å øke blodsukkeret ved at leveren frigjør glukose.'
  }
];
