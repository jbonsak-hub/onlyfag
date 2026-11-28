const ink = 'var(--ink,#20352e)';
const muted = 'var(--muted,#52685f)';
const levels = [['∞',27],['5',42],['4',56],['3',73],['2',103],['1',202]];
const energy = n => `E<sub>${n}</sub>`;
const transition = (from,to) => `${energy(from)} → ${energy(to)}`;

const figure = `<svg class="aq-svg" data-atom-figure="atom-17" viewBox="0 0 360 225" role="img" aria-labelledby="atom-17-title atom-17-description">
  <title id="atom-17-title">Energinivåer i hydrogenatomet</title>
  <desc id="atom-17-description">Energien øker oppover. Den øverste linja er stiplet og merket n lik uendelig. Under ligger nivå 5, 4, 3, 2 og 1 i den rekkefølgen. Det er størst avstand mellom linjene for nivå 1 og nivå 2.</desc>
  <rect width="360" height="225" rx="9" fill="var(--bg,#edf1eb)"/>
  <path d="M34 210V24m-5 8 5-8 5 8" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <g fill="${ink}" font-family="system-ui,sans-serif" font-size="14" text-anchor="middle">
    <text x="34" y="17" font-style="italic" font-weight="700">E</text>
    <text x="321" y="17" font-style="italic" font-weight="700">n</text>
    ${levels.map(([n,y])=>`<line data-atom-level="${n}" x1="49" y1="${y}" x2="304" y2="${y}" stroke="${muted}" stroke-width="1.4" ${n==='∞'?'stroke-dasharray="5 4"':''}/>
      <text x="321" y="${y+4.5}">${n}</text>`).join('')}
  </g>
</svg>`;

export const atomTransitionQuestion = {
  id:'atom-17',
  type:'matrix',
  level:'Bruk',
  prompt:'Diagrammet viser noen energinivåer i hydrogenatomet, og tabellen viser overganger mellom dem. Kryss av for ett alternativ per rad.',
  figure,
  columns:[transition(4,2),transition(4,1),transition(5,4),transition(2,4),transition(3,'∞')],
  rows:[
    {label:'gir lys med lengst bølgelengde',correct:2},
    {label:'gir lys med høyest frekvens',correct:1},
    {label:'gir lys med lavest energi',correct:2},
    {label:'gir lys i IR-området',correct:2},
    {label:'gir lys i UV-området',correct:1},
    {label:'gir blågrønt lys',correct:0},
    {label:'absorberer blågrønt lys',correct:3},
    {label:'ioniserer atomet',correct:4}
  ],
  answer:`<p>${transition(5,4)} er det minste spranget ned. Det gir lavest fotonenergi og lengst bølgelengde, i det infrarøde området. ${transition(4,1)} er det største spranget ned. Det gir høyest frekvens, i UV-området.</p>
    <p>${transition(4,2)} gir blågrønt lys ved ca. 486 nm. ${transition(2,4)} tar opp lys med samme bølgelengde. Ved ${transition(3,'∞')} frigjøres elektronet og atomet ioniseres.</p>`
};
