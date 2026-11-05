// Verified against Matvaretabellen on 2026-10-31:
// https://www.matvaretabellen.no/paprika-rod-ra/ — vitamin C: 126 mg / 100 g edible portion.
// https://www.matvaretabellen.no/appelsin-ra/ — vitamin C: 54 mg / 100 g edible portion.
// Keep the search landing page as the task link so students find the named records themselves.
export const foodTableQuestion = {
  id: 'foodtable-vitamin-c-portions',
  topic: 'micro',
  type: 'choice',
  level: 2,
  family: 'foodtable-lookup',
  title: 'Vitamin C i to porsjoner',
  prompt: 'Søk opp «Paprika, rød, rå» og «Appelsin, rå» i Matvaretabellen. Hvilken porsjon gir mest vitamin C: 50 g paprika eller 100 g appelsin? Bruk tall per 100 g spiselig del.',
  referenceLink: {
    url: 'https://www.matvaretabellen.no/sok/',
    label: 'Åpne Matvaretabellen'
  },
  options: [
    '50 g paprika gir mest vitamin C.',
    '100 g appelsin gir mest vitamin C.',
    'De to porsjonene gir like mye vitamin C.'
  ],
  answer: '50 g paprika gir mest vitamin C.',
  hint: 'Finn vitamin C for begge matvarene. Verdiene gjelder 100 g; regn om verdien for paprika til 50 g.',
  explanation: 'Paprika, rød, rå har 126 mg vitamin C per 100 g. En porsjon på 50 g gir derfor 63 mg. Appelsin, rå har 54 mg per 100 g. Paprikaporsjonen gir mest vitamin C selv om den veier halvparten så mye. Bruk riktig matvare og tilstand, og sammenlign like enheter.'
};
