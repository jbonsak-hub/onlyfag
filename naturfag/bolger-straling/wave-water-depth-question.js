const ink = 'var(--ink,#20352e)';
const water = 'var(--blue,#2677a0)';

function crests(positions) {
  return positions.map(x => `<path data-water-crest d="M${x} 46v91" stroke="${water}" stroke-width="2.4" stroke-linecap="round"/>`).join('');
}

const figure = `<svg class="wv-water-depth-figure" data-wave-figure="wv-b17" viewBox="0 0 360 205" role="img" aria-labelledby="wv-b17-title wv-b17-description">
  <title id="wv-b17-title">Vannbølger fra område I til område II</title>
  <desc id="wv-b17-description">Figuren viser vannflaten ovenfra. Pila peker mot høyre, fra område I til område II, på tvers av grensa AB. De loddrette strekene er bølgetopper. De står tettere i område II enn i område I.</desc>
  <rect width="360" height="205" rx="9" fill="var(--bg,#edf1eb)"/>
  <rect x="15" y="38" width="330" height="108" rx="6" fill="var(--surface,#fff)" stroke="var(--line,#cddbd1)"/>
  <g data-water-region="I">${crests([32,73,114,155])}</g>
  <g data-water-region="II">${crests([192,213,234,255,276,297,318,339])}</g>
  <path data-water-boundary d="M180 36v112" stroke="${ink}" stroke-width="1.6" stroke-dasharray="4 4"/>
  <path data-water-direction d="M91 176h178m-8-5 8 5-8 5" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <g fill="${ink}" font-family="system-ui,sans-serif" font-size="15" font-weight="700" text-anchor="middle">
    <text x="95" y="27">I</text>
    <text x="270" y="27">II</text>
    <text x="180" y="29">A</text>
    <text x="180" y="167">B</text>
    <text x="180" y="197" font-size="13" font-weight="550">Bevegelsesretning</text>
  </g>
</svg>`;

export const waterDepthQuestion = {
  id:'wv-b17',
  type:'matrix',
  level:'Bruk',
  prompt:'I et demonstrasjonsapparat går vannbølger fra område I til område II. Figuren viser bølgetoppene ovenfra. Vanndybden endrer seg ved grensa AB. Hva skjer med hver størrelse? Velg ett svar per rad.',
  figure,
  columns:['Minker','Uendret','Øker'],
  rows:[
    {label:'Vanndybden',correct:0},
    {label:'Frekvensen',correct:1},
    {label:'Bølgelengden',correct:0},
    {label:'Bølgefarten',correct:0}
  ],
  answer:'<p>Bølgetoppene står tettere i område II, så <strong>bølgelengden minker</strong>. Like mange bølgetopper passerer grensa per sekund fra hver side, så <strong>frekvensen er uendret</strong>. Fra v = f · λ følger det at <strong>bølgefarten minker</strong>. Vannbølger går saktere på grunnere vann, så <strong>vanndybden minker</strong>.</p>'
};
