// Applied nutrition questions. Scientific qualifications and source checks are
// recorded internally in docs/ernaering-practical.md.
export const practicalQuestions = [
  {
    id: 'practical-fat-health', topic: 'fat', type: 'choice', level: 2,
    family: 'practical-trans-fat',
    title: 'Fettype og helse',
    prompt: 'Hvilket alternativ er mest ugunstig for hjerte- og karhelsen når vi sammenligner like store mengder?',
    options: ['Transfett', 'Mettet fett', 'Vanlig umettet cis-fett'],
    answer: 'Transfett',
    hint: 'Umettet fett er ikke én ensartet gruppe. Formen på fettsyrene har betydning.',
    explanation: 'Transfett er mest ugunstig av disse alternativene. Vanlig umettet cis-fett er et bedre valg for hjerte- og karhelsen enn trans- og mettet fett. Cis-fett er umettet fett, og transfett er også kjemisk umettet. Derfor er ikke «cis» og «umettet» to helt separate fettyper.'
  },
  {
    id: 'practical-trans-fat-foods', topic: 'fat', type: 'choice', level: 2,
    family: 'practical-trans-fat',
    title: 'Fett i matproduksjon',
    prompt: 'En eldre ingrediensliste for kjeks sier «delvis herdet fett». Hvilken uheldig fettype er særlig knyttet til dette og kan også dannes ved langvarig, gjentatt fritering?',
    options: ['Transfett', 'Vanlig umettet cis-fett', 'Bare mettet fett'],
    answer: 'Transfett',
    hint: 'Se etter fettypen som kan dannes når olje delvis herdes industrielt.',
    explanation: 'Delvis herdet fett kan inneholde transfett og ble blant annet brukt i industrifremstilte kjeks og kaker. Langvarig, gjentatt fritering kan også øke mengden transfett. Vanlig steking gjør ikke automatisk olje til transfett, og gammel frityrolje kan være forringet av andre grunner. Industrielt transfett er strengt begrenset i Norge i dag; kjeks og kaker inneholder derfor ikke nødvendigvis mye transfett.'
  },
  {
    id: 'practical-egg-protein', topic: 'protein', type: 'choice', level: 2,
    family: 'practical-protein-preparation',
    title: 'Egg etter trening',
    prompt: 'Du vil utnytte mest mulig av proteinet i ett egg etter styrketrening. Hvordan bør egget spises, med tanke på fordøyelse og opptak?',
    options: ['Rått', 'Kokt', 'Det spiller ingen rolle.'],
    answer: 'Kokt',
    hint: 'Tenk på hvordan oppvarming endrer formen til proteinene, og hva det betyr for enzymene i fordøyelsen.',
    explanation: 'Kokt egg er det beste av disse alternativene. Oppvarming denaturerer proteinene: Formen endres slik at fordøyelsesenzymene lettere kommer til. Studier på mennesker viser at eggprotein fordøyes og tas opp bedre etter varmebehandling. Kokingen lager ikke mer protein; forskjellen gjelder hvor mye kroppen kan utnytte.'
  },
  {
    id: 'practical-meal-energy-density', topic: 'energy', type: 'choice', level: 2,
    family: 'practical-meal-comparison', figure: 'practical-meals',
    title: 'Porsjon og energi',
    prompt: 'I dette regneeksemplet veier A 300 g og B 600 g. Begge gir 600 kcal. Hvilken sammenligning er riktig?',
    options: [
      'B gir mindre energi per gram enn A.',
      'B gir mer energi per gram enn A.',
      'A og B gir like mye energi per gram.',
      'B gir dobbelt så mange kcal fordi porsjonen veier dobbelt så mye.'
    ],
    answer: 'B gir mindre energi per gram enn A.',
    hint: 'Fordel samme energimengde på massen til hver porsjon.',
    explanation: 'A gir 600 ÷ 300 = 2 kcal per gram, mens B gir 600 ÷ 600 = 1 kcal per gram. B har altså lavere energitetthet. Blant annet vanninnhold og fordelingen av næringsstoffer påvirker hvor mye energi maten gir per gram. En stor porsjon trenger derfor ikke å gi mer energi enn en liten.'
  },
  {
    id: 'practical-meal-nutrients', topic: 'energy', type: 'choice', level: 2,
    family: 'practical-meal-comparison', figure: 'practical-meals',
    title: 'Like mye energi',
    prompt: 'A og B gir begge 600 kcal. En elev sier: «Da gir de like mye av alle næringsstoffene også.» Hvordan bør påstanden vurderes?',
    options: [
      'Feil: Lik energi betyr ikke likt innhold av protein, kostfiber, vitaminer og mineralstoffer.',
      'Riktig: Antall kcal forteller hvor mye det er av hvert næringsstoff.',
      'Riktig: Alle porsjoner med samme energi har også samme mengde vann.',
      'Feil: Den minste porsjonen inneholder aldri vitaminer eller protein.'
    ],
    answer: 'Feil: Lik energi betyr ikke likt innhold av protein, kostfiber, vitaminer og mineralstoffer.',
    hint: 'Hva forteller kcal om maten, og hva trenger du andre opplysninger for å finne ut?',
    explanation: 'Kcal beskriver energimengden. To porsjoner med samme energi kan ha ulikt innhold av protein, kostfiber, vitaminer og mineralstoffer. Begge kan bidra med næringsstoffer. Vi trenger opplysninger om ingredienser og mengder for å sammenligne næringsinnholdet mer presist; illustrasjonen og kcal-tallet alene er ikke nok. Ett måltid avgjør heller ikke kostholdet som helhet.'
  }
];
