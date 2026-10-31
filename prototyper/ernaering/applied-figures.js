// Original compact SVG models. Labels describe the evidence without naming the answer.
const ink = '#253c34';
const green = '#477762';
const orange = '#b96d3f';
const label = (x, y, content, size = 18, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${ink}" ${extra}>${content}</text>`;
const line = (x1, y1, x2, y2, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="2" ${extra}/>`;
const model = (description, body, width = 420, height = 270) => `<figure class="mini-figure structure-figure"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${description}"><g font-family="system-ui,sans-serif">${body}</g></svg></figure>`;
const arrow = (x1, y, x2) => line(x1, y, x2, y) + `<path d="M${x2-8} ${y-6}l8 6-8 6" fill="none" stroke="${ink}" stroke-width="2"/>`;
const fatSymbol = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0-16V16" stroke="${orange}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M3-13H28M3 0H28M3 13H28" stroke="${green}" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;

const figures = {
  'applied-protein-combination': () => {
    const table = `<rect x="28" y="48" width="364" height="180" rx="5" fill="#f3f7f3" stroke="#9aafa0"/>
      <path d="M28 93H392M28 138H392M28 183H392M188 48V228M290 48V228" fill="none" stroke="#b0c1b5" stroke-width="1.5"/>
      ${label(32, 28, 'Mengde per porsjon (enheter)', 19)}
      ${label(43, 78, 'Aminosyre', 18)}${label(239, 78, 'P', 20, 'text-anchor="middle" font-weight="700"')}${label(341, 78, 'Q', 20, 'text-anchor="middle" font-weight="700"')}
      ${[['A',4,1],['B',1,3],['C',3,1]].map(([name,p,q],i)=>label(107,123+i*45,name,20,'text-anchor="middle"')+label(239,123+i*45,p,20,'text-anchor="middle"')+label(341,123+i*45,q,20,'text-anchor="middle"')).join('')}`;
    return model('Tabell med mengde per porsjon i enheter. Kilde P: A 4, B 1 og C 3. Kilde Q: A 1, B 3 og C 1.', table, 420, 250);
  },
  'applied-fat-processes': () => {
    const droplet = (x, y, r, symbols) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fbf0d9" stroke="#c6a56c" stroke-width="2"/>${symbols}`;
    let body = label(122, 25, 'Før', 18, 'text-anchor="middle"') + label(320, 25, 'Etter', 18, 'text-anchor="middle"');
    body += label(15, 105, 'A', 22, 'font-weight="700"') + droplet(122, 98, 53, fatSymbol(99, 78, .65)+fatSymbol(123, 103, .65)+fatSymbol(94, 121, .65));
    body += arrow(189, 98, 239) + droplet(290, 69, 26, fatSymbol(282,69,.65)) + droplet(351, 97, 26, fatSymbol(343,97,.65)) + droplet(290, 126, 26, fatSymbol(282,126,.65));
    body += line(16,165,404,165,'stroke="#d4dfd5" stroke-width="1"');
    body += label(15, 229, 'B', 22, 'font-weight="700"') + fatSymbol(110, 222, 1.15) + arrow(189, 222, 239);
    body += `<path d="M274 203V241" stroke="${orange}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M313 204H353M313 222H353M313 240H353" stroke="${green}" stroke-width="4.6" fill="none" stroke-linecap="round"/>`;
    body += fatSymbol(28, 287, .6) + label(55, 292, 'ett helt fettmolekyl (modell)', 17);
    return model('To modeller med før og etter. A: én dråpe med tre hele molekylsymboler blir tre mindre dråper med ett helt symbol i hver. B: ett helt symbol blir én oransje del og tre atskilte grønne deler. Hvert helt symbol har én oransje del forbundet med tre grønne deler.', body, 420, 310);
  },
  'applied-vitamin-distribution': () => {
    let body = `<path d="M65 31V232Q65 248 81 248H229Q245 248 245 232V31" fill="none" stroke="${ink}" stroke-width="3"/>
      <path d="M68 55H242V133H68Z" fill="#f3dfae"/>
      <path d="M68 133H242V231Q242 245 228 245H82Q68 245 68 231Z" fill="#dcecf1"/>
      ${line(68,133,242,133,'stroke="#a8bdb8" stroke-width="1.5"')}
      ${label(274,101,'Olje',20)}${label(274,195,'Vann',20)}
      ${line(246,95,266,95)}${line(246,189,266,189)}`;
    body += [[91,160],[127,183],[175,157],[220,185],[105,218],[156,219],[202,220],[151,153]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6" fill="${green}"/>`).join('');
    body += `<circle cx="83" cy="282" r="6" fill="${green}"/>`+label(99,288,'Vitamin X',18);
    return model('En beholder har olje i det øvre laget og vann i det nedre. Åtte prikker som viser vitamin X er fordelt i vannlaget. Ingen prikker er vist i oljelaget.',body,380,307);
  },
  'applied-absorption-surface': () => {
    const flat = [[55,63],[155,63],[255,63],[355,63]];
    const folded = [[55,222],[105,135.4],[155,222],[205,135.4],[255,222],[305,135.4],[355,222]];
    const wall = (points) => `<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${green}" stroke-width="5" stroke-linejoin="round"/>`+points.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" fill="${ink}"/>`).join('');
    return model('A er en rett linje med fire prikker og tre like lange stykker. B er en foldet linje med sju prikker og seks like lange stykker. Linjene dekker samme bredde.',label(18,70,'A',22,'font-weight="700"')+wall(flat)+label(18,187,'B',22,'font-weight="700"')+wall(folded),400,255);
  },
  'applied-glucose-regulation': () => {
    const x = (minutes) => 78 + minutes*2.55;
    const y0 = 205;
    let body = label(79,24,'Blodsukker',19,'font-weight="600"') + label(16,64,'Høyt',17) + label(16,208,'Lavt',17);
    body += line(78,43,78,y0) + line(78,y0,390,y0);
    body += [0,30,60,90,120].map(t=>line(x(t),y0,x(t),y0+5)+label(x(t),231,String(t),17,'text-anchor="middle"')).join('');
    body += label(234,263,'Tid etter måltidet (min)',18,'text-anchor="middle"');
    body += `<path d="M78 160C103 151 122 72 154.5 58S211 103 231 123S280 155 307.5 160S360 165 384 164" fill="none" stroke="${green}" stroke-width="4" stroke-linecap="round"/>`;
    return model('Kurve med tid etter måltidet i minutter på vannrett akse og blodsukker fra lavt til høyt på loddrett akse. Kurven stiger fra start til en topp rundt 30 minutter, synker deretter og nærmer seg startnivået rundt 90 til 120 minutter.',body,420,285);
  }
};

export function appliedFigure(key) {
  return figures[key] ? figures[key]() : '';
}
