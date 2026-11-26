const ink = 'var(--ink,#20352e)';
const muted = 'var(--muted,#52685f)';
const grid = 'var(--line,#cddbd1)';
const bg = 'var(--bg,#edf1eb)';
const surface = 'var(--surface,#fff)';
const blue = 'var(--blue,#2677a0)';
const green = 'var(--green,#236448)';
const orange = 'var(--orange,#a86b22)';
const center = 'text-anchor="middle"';

const label = (x, y, content, attrs = '') => `<text x="${x}" y="${y}" ${attrs}>${content}</text>`;
const line = (x1,y1,x2,y2,color,attrs='') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${attrs}/>`;

function figure(id, title, description, content, height) {
  return `<svg data-phenomenon-figure="${id}" viewBox="0 0 360 ${height}" role="img" aria-labelledby="${id}-title ${id}-desc">
    <title id="${id}-title">${title}</title><desc id="${id}-desc">${description}</desc>
    <rect width="360" height="${height}" rx="9" fill="${bg}"/>
    <g fill="${ink}" font-family="system-ui,sans-serif" font-size="14">${content}</g>
  </svg>`;
}

function glassInterface(x, name, medium, criticalAngle) {
  const angle = 38*Math.PI/180;
  const y = 91, incidentLength = 84, radius = 42;
  const left = x-78;
  const startX = x-incidentLength*Math.cos(angle);
  const startY = y+incidentLength*Math.sin(angle);
  const arcX = x-radius*Math.cos(angle);
  const arcY = y+radius*Math.sin(angle);
  return `<rect x="${left}" y="29" width="156" height="126" rx="5" fill="${surface}" stroke="${grid}"/>
    <rect x="${left}" y="${y}" width="156" height="${155-y}" fill="${green}" opacity=".12"/>
    ${label(x,21,name,`${center} font-weight="700"`)}
    ${label(x,48,medium,center)}
    ${label(x,67,`Grensevinkel ${criticalAngle}°`,`${center} font-size="12"`)}
    ${line(left,y,left+156,y,muted,'stroke-width="1.4"')}
    ${line(x,73,x,137,muted,'stroke-dasharray="4 3"')}
    <path d="M${startX} ${startY}L${x} ${y}l-9 2m9-2l-4 8M${x-radius} ${y}A${radius} ${radius} 0 0 0 ${arcX} ${arcY}"
      fill="none" stroke="${orange}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${label(x-61,108,'38°','font-weight="700"')}
    ${label(x+43,140,'Glass',center)}`;
}

function reflectionLimit() {
  return figure('wv-f15','Lysstråler ved to glassflater',
    'I oppsett 1 er det glass under flaten og luft over den. Grensevinkelen er 42 grader. I oppsett 2 er det glass under flaten og vann over den. Grensevinkelen er 62 grader. Begge lysstrålene går fra glasset mot flaten og danner 38 grader med selve flaten.',
    glassInterface(91,'Oppsett 1','Luft',42)+glassInterface(269,'Oppsett 2','Vann',62),164);
}

function microphonePaths(left, name, upperDistance, lowerDistance) {
  const scale = 35, separation = 2;
  const upperY = 46, lowerY = upperY+separation*scale;
  // Place the microphone where the two measured distances intersect.
  const rise = (upperDistance**2-lowerDistance**2+separation**2)/(2*separation);
  const microphoneX = left+scale*Math.sqrt(upperDistance**2-rise**2);
  const microphoneY = upperY+scale*rise;
  const distanceX = (left+microphoneX)/2;
  const clearance = y=>8+18*Math.abs(microphoneY-y)/(microphoneX-left);
  const metres = length=>length.toFixed(1).replace('.',',')+' m';
  return `${label(left+53,23,`Mikrofon ${name}`,`${center} font-weight="700"`)}
    ${line(left,upperY,microphoneX,microphoneY,blue,'stroke-width="2.3"')}
    ${line(left,lowerY,microphoneX,microphoneY,green,'stroke-width="2.3"')}
    <circle cx="${left}" cy="${upperY}" r="5" fill="${blue}"/>
    <circle cx="${left}" cy="${lowerY}" r="5" fill="${green}"/>
    <circle cx="${microphoneX}" cy="${microphoneY}" r="5" fill="${surface}" stroke="${ink}" stroke-width="2"/>
    ${label(left-12,upperY+5,'A','text-anchor="end"')}
    ${label(left-12,lowerY+5,'B','text-anchor="end"')}
    ${label(distanceX,(upperY+microphoneY)/2-clearance(upperY),metres(upperDistance),center)}
    ${label(distanceX,(lowerY+microphoneY)/2+clearance(lowerY)+9,metres(lowerDistance),center)}`;
}

function soundPaths() {
  return figure('wv-f16','Veilengder fra to høyttalere til to mikrofoner',
    'Fra høyttaler A til mikrofon P er det 2,0 meter, og fra høyttaler B til P er det 2,4 meter. Fra A til Q er det 2,8 meter, og fra B til Q er det 2,0 meter.',
    line(180,18,180,133,grid)+microphonePaths(42,'P',2,2.4)+microphonePaths(221,'Q',2.8,2),146);
}

export const phenomenonQuestions = [
  {
    id:'wv-f15',type:'mcq',level:'Bruk',newFigureQuestion:true,figure:reflectionLimit(),
    prompt:'En lysstråle treffer glassflaten i begge oppsettene. Hvor kan noe av lyset gå gjennom flaten?',
    choices:['Bare i oppsett 1.','Bare i oppsett 2.','I begge oppsettene.','I ingen av oppsettene.'],
    correct:1,
    hint:'Mål innfallsvinkelen fra innfallsloddet. Hvis innfallsvinkelen er større enn grensevinkelen, får du totalrefleksjon.',
    answer:'<strong>Bare i oppsett 2.</strong> Innfallsvinkelen er 90° − 38° = 52°. I oppsett 1 er den større enn grensevinkelen på 42°, så lyset totalreflekteres. I oppsett 2 er 52° mindre enn grensevinkelen på 62°, så noe av lyset brytes inn i vannet.'
  },{
    id:'wv-f16',type:'open',level:'Utfordring',newFigureQuestion:true,figure:soundPaths(),
    prompt:'To like høyttalere sender ut samme tone like kraftig og i takt. Bølgelengden er 0,80 m. Se bort fra refleksjoner. Hvilken mikrofon måler den svakeste lyden? Bruk avstandene i figuren til å begrunne svaret.',
    hint:'Finn forskjellen mellom veilengdene til hver mikrofon. Hvor stor del av en bølgelengde er den?',
    answer:'<strong>P måler den svakeste lyden.</strong> Veiforskjellen til P er 2,4 m − 2,0 m = 0,4 m, en halv bølgelengde. Topp møter bunn og signalene svekkes. Til Q er forskjellen 2,8 m − 2,0 m = 0,8 m, en hel bølgelengde. Topp møter topp og signalene forsterkes.'
  }
];
