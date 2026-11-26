const ink = 'var(--ink,#20352e)';
const muted = 'var(--muted,#52685f)';
const grid = 'var(--line,#cddbd1)';
const bg = 'var(--bg,#edf1eb)';
const surface = 'var(--surface,#fff)';
const blue = 'var(--blue,#2677a0)';
const green = 'var(--green,#236448)';
const orange = 'var(--orange,#a86b22)';
const center = 'text-anchor="middle"';
const bold = 'font-weight="700"';

const label = (x, y, content, attrs = '') => `<text x="${x}" y="${y}" ${attrs}>${content}</text>`;
const line = (x1, y1, x2, y2, color = muted, attrs = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${attrs}/>`;
const path = (d, color, width = 2, attrs = '') =>
  `<path d="${d}" stroke="${color}" fill="none" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${attrs}/>`;
const dot = (x, y, color, radius = 4) => `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}"/>`;

function arrow(x1, y1, x2, y2, color, width = 2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = [-.48,.48].map(tilt => [
    x2 - 8*Math.cos(angle+tilt),
    y2 - 8*Math.sin(angle+tilt)
  ]);
  return path(`M${x1},${y1}L${x2},${y2}M${head[0]}L${x2},${y2}L${head[1]}`, color, width);
}

function figure(id, title, description, content, height) {
  return `<svg data-phenomenon-figure="${id}" viewBox="0 0 360 ${height}" role="img" aria-labelledby="${id}-figure-title ${id}-figure-desc">
    <title id="${id}-figure-title">${title}</title><desc id="${id}-figure-desc">${description}</desc>
    <rect width="360" height="${height}" rx="9" fill="${bg}"/>
    <g fill="${ink}" font-family="system-ui,sans-serif" font-size="14">${content}</g>
  </svg>`;
}

function mirrorAngle(id, angle, fromSurface) {
  const x = 180, y = 113, rayX = fromSurface ? 34 : 121;
  const fromNormal = (fromSurface ? 90-angle : angle)*Math.PI/180;
  const rayY = y - (x-rayX)/Math.tan(fromNormal);
  const radius = fromSurface ? 54 : 38;
  const arcX = radius*Math.sin(fromNormal), arcY = y-radius*Math.cos(fromNormal);
  const hatch = Array.from({length:23}, (_, i) => line(27+i*13,y+3,22+i*13,y+10,grid)).join('');
  const arc = fromSurface
    ? path(`M${x-radius} ${y}A${radius} ${radius} 0 0 1 ${x-arcX} ${arcY}`,orange)
    : path(`M${x} ${y-radius}A${radius} ${radius} 0 0 0 ${x-arcX} ${arcY}`,orange);
  const outgoing = fromSurface ? '' : arrow(x,y,2*x-rayX,rayY,blue,2.6)
    + path(`M${x} ${y-radius}A${radius} ${radius} 0 0 1 ${x+arcX} ${arcY}`,blue)
    + label(198,62,'?',`${center} ${bold}`);
  const markedAngle = fromSurface
    ? label(87,100,`${angle}°`,bold)
    : label(162,62,`${angle}°`,`${center} ${bold}`);
  return figure(id, 'Lysstråle ved et plant speil', fromSurface
    ? `Den innkommende strålen lager ${angle} grader med den vannrette speilflaten. Innfallsloddet står loddrett på speilet i treffpunktet.`
    : `Den innkommende strålen lager ${angle} grader med innfallsloddet. En annen stråle går bort fra speilet på den andre siden av loddet.`,
    hatch+line(22,y,338,y,muted,'stroke-width="3"')
      +line(x,28,x,y,muted,'stroke-dasharray="5 4"')+label(x,22,'Innfallslodd',center)
      +arrow(rayX,rayY,x,y,orange,2.6)+arc+markedAngle+outgoing+label(180,143,'Speil',center),
    152);
}

function lightWavefronts() {
  const fronts = [15,60,105,150,190,220,250,280,310,340];
  return figure('wv-f4','Lysbølge fra luft til glass',
    'Lys går mot høyre fra luft til glass. Avstanden mellom bølgefrontene er kortere i glass enn i luft.',
    `<rect x="180" y="35" width="165" height="85" rx="4" fill="${surface}" stroke="${grid}"/>`
      +label(95,24,'Luft',`${center} ${bold}`)+label(263,24,'Glass',`${center} ${bold}`)
      +line(180,34,180,122,muted,'stroke-dasharray="5 4"')
      +fronts.map(x=>line(x,43,x,109,blue,'stroke-width="2.3"')).join('')
      +arrow(109,135,251,135,muted,1.6),
    150);
}

function pencilInWater() {
  return figure('wv-f5','Lys fra en blyant i vann',
    'Blyantspissen A er under vann. Fra A går lysstrålen opp til grensen mellom vann og luft og skifter retning mot øyet. En stiplet forlengelse av strålen bakover fra øyet går gjennom B, som ligger høyere enn A.',
    `<rect x="17" y="83" width="326" height="69" fill="${blue}" opacity=".13"/>`
      +line(17,83,343,83,blue,'stroke-width="1.2"')+label(24,74,'Luft')+label(24,102,'Vann')
      +path('M100 25L133 139',orange,7)+dot(133,139,orange)
      +label(115,145,'A',bold)
      +path('M133 139L185 83L284 36',green,2.5)+arrow(217,68,244,55,green,2.5)
      +line(133,107.7,185,83,green,'stroke-width="1.5" stroke-dasharray="5 4"')
      +dot(133,107.7,green)+label(143,116,'B',bold)
      +path('M284 36Q300 22 319 36Q300 50 284 36Z',muted,1.6)+dot(296,36,ink)
      +label(301,62,'Øye',center),
    160);
}

function waveTrace(left, right, yAt) {
  const points = [];
  for(let x=left; x<=right; x+=2) points.push(`${x},${yAt(x).toFixed(2)}`);
  return `M${points.join('L')}`;
}

function overlappingWaves(noise = false) {
  const rows = [53,115], position = 146, left = 104, right = 336, amplitude = 18;
  const traces = rows.map((base,index)=>{
    const direction = noise && index===1 ? -1 : 1;
    const color = index===0 ? blue : green;
    const peak = base-direction*amplitude;
    const curve = waveTrace(left,right,x=>base-direction*amplitude*Math.cos((x-position)*Math.PI/43));
    const name = noise ? (index===0 ? 'Støy' : 'Fra hodetelefon') : (index===0 ? 'Bølge A' : 'Bølge B');
    return line(left,base,right,base,grid,'stroke-width="1.2"')
      +label(11,base+5,name,noise&&index===1?'font-size="12"':'')
      +path(curve,color,2.3)+dot(position,peak,color)
      +(noise?'':label(position+11,peak-6,'+3 cm',bold));
  }).join('');
  return figure(noise?'wv-f7':'wv-f6', noise?'To lydsignaler ved øret':'To bølger på samme sted',
    noise
      ? 'Støyen har en topp der lyden fra hodetelefonen har en like dyp bunn. Når støyen har en bunn, har lyden fra hodetelefonen en like høy topp.'
      : 'Begge bølgene har en topp ved den stiplede linja. Hver topp ligger 3 centimeter over likevektslinja.',
    line(position,21,position,141,muted,'stroke-dasharray="4 4"')+traces
      +label(right,155,noise?'Tid':'Posisjon','text-anchor="end" fill="'+muted+'"'),
    166);
}

function waveOpenings() {
  function panel(left, right, gap, name) {
    const mid = (left+right)/2;
    const fronts = [48,70,92].map(y=>line(left,y,right,y,blue,'stroke-width="2"')).join('');
    return label(mid,24,name,`${center} ${bold}`)+fronts
      +path(`M${left} 114H${mid-gap/2}M${mid+gap/2} 114H${right}`,muted,5);
  }
  return figure('wv-f8','Bølger på vei mot to åpninger',
    'Åpning A er fem ganger så bred som avstanden mellom bølgefrontene. Åpning B er like bred som avstanden mellom bølgefrontene. Bølgefrontene er like langt fra hverandre i begge tilfellene.',
    panel(19,167,110,'A')+panel(193,341,22,'B')
      +line(180,22,180,124,grid)
      +arrow(67,51,67,66,muted,1.4)+arrow(67,67,67,52,muted,1.4)+label(75,63,'λ',bold),
    134);
}

function doorway() {
  return figure('wv-f9','En person i gangen og en lytter i rommet',
    'Personen som snakker står til venstre for veggen. Lytteren står til høyre. Den rette linja mellom personene treffer veggen ovenfor døråpningen.',
    label(80,24,'Gang',`${center} ${bold}`)+label(280,24,'Rom',`${center} ${bold}`)
      +line(60,51,274,51,muted,'stroke-dasharray="4 4"')
      +path('M179 26V92M179 139V158',muted,6)
      +dot(64,51,orange,8)+label(64,78,'Den som snakker',center)
      +dot(274,51,blue,8)+label(274,78,'Du',center)
      +label(167,120,'Døråpning','text-anchor="end"')
      +path('M187 101Q205 114 187 131M195 93Q225 115 195 140M204 86Q243 115 204 148',blue,1.6),
    171);
}

function swingTrace() {
  const left = 55, right = 319, base = 73, seconds = 4;
  const xAt = t=>left+t*(right-left)/seconds;
  const ticks = [0,1,2,3,4].map(t=>{
    const x = xAt(t);
    return line(x,36,x,113,grid,'stroke-dasharray="3 4"')
      +line(x,113,x,118,muted)+label(x,135,t,center);
  }).join('');
  const trace = waveTrace(left,right,x=>base-30*Math.sin((x-left)*Math.PI/66));
  return figure('wv-f10','Utslaget til en huske over fire sekunder',
    'En kurve for utslag mot tid. Toppene ligger ved et halvt og to og et halvt sekund. Bunnene ligger ved ett og et halvt og tre og et halvt sekund.',
    label(16,23,'Utslag',bold)+ticks+arrow(left,113,left,31,muted,1.5)
      +arrow(left,113,337,113,muted,1.5)+line(left,base,right,base,grid)
      +path(trace,blue,2.5)+label(337,135,'s','text-anchor="end"'),
    149);
}

function fork(x,y,name,frequency) {
  return path(`M${x-12} ${y-17}v14q0 15 12 15t12 -15v-14M${x} ${y+12}v12`,muted,3)
    +label(x,y+42,`${name} · ${frequency} Hz`,`${center} ${bold}`);
}

function tuningForks() {
  return figure('wv-f11','Tre stemmegafler med oppgitte egenfrekvenser',
    'Stemmegaffel A til venstre har egenfrekvens 440 hertz. Til høyre står B, 392 hertz, over C, 440 hertz. B og C står like langt fra A.',
    fork(76,73,'A',440)+fork(267,30,'B',392)+fork(267,116,'C',440)
      +path('M110 67q12 8 0 16M120 59q24 16 0 32M130 51q36 24 0 48',blue,1.7),
    173);
}

function siren() {
  const fronts = Array.from({length:5},(_,index)=>{
    const pulse = index+1, cx = 166-9*pulse, radius = 28*pulse;
    return `<circle cx="${cx}" cy="84" r="${radius}" fill="none" stroke="${blue}" stroke-width="1.4" opacity=".68"/>`;
  }).join('');
  return figure('wv-f12','Lydbølgefronter rundt en ambulanse i bevegelse',
    'Ambulansen kjører mot høyre, mot deg. Sirenens bølgefronter ligger tettere foran ambulansen enn bak den.',
    `<defs><clipPath id="wv-f12-fronts"><rect x="14" y="14" width="332" height="116"/></clipPath></defs>
      <g clip-path="url(#wv-f12-fronts)">${fronts}</g>
      <path d="M148 74H175V78H181L187 83V91H148Z" fill="${surface}" stroke="${ink}" stroke-width="1.5"/>`
      +path('M156 81h11m-5.5 -5.5v11',orange,1.7)+dot(156,92,ink,3)+dot(178,92,ink,3)
      +arrow(149,41,197,41,green,2.4)+dot(283,84,ink,7)
      +label(166,147,'Ambulanse',center)+label(283,147,'Du',center),
    158);
}

function fullLengthMirror() {
  const head = 29, eye = 47, feet = 149, person = 93, mirror = 235;
  const upper = (head+eye)/2, lower = (feet+eye)/2;
  return figure('wv-f14','De to lysstrålene som må treffe speilet',
    'En oppreist person med kroppshøyde H. Den ene lysstrålen går fra toppen av hodet via speilet til øyet. Den andre går fra føttene via speilet til øyet. Speilet ligger til høyre for personen.',
    `<circle cx="${person}" cy="43" r="14" fill="${surface}" stroke="${muted}" stroke-width="1.9"/>`
      +path(`M${person} 58v44m0-29l-14 22m14-22l12 22m-12 7l-12 47m12-47v47`,muted,2.2)
      +line(40,head,40,feet,muted)+line(35,head,45,head,muted)+line(35,feet,45,feet,muted)
      +label(25,94,'H',center)+line(mirror,22,mirror,162,grid,'stroke-width="2" stroke-dasharray="4 5"')
      +line(mirror,upper,mirror,lower,muted,'stroke-width="5"')
      +path(`M${person} ${head}L${mirror} ${upper}L${person} ${eye}`,orange,2.1)
      +path(`M${person} ${feet}L${mirror} ${lower}L${person} ${eye}`,blue,2.1)
      +dot(person,eye,ink,3.4)+dot(mirror,upper,orange,3.1)+dot(mirror,lower,blue,3.1)
      +label(248,73,'Speil'),
    173);
}

export const phenomenonQuestions = [
  {
    id:'wv-f1',type:'number',level:'Start',figure:mirrorAngle('wv-f1',35,false),
    prompt:'Hvor stor er refleksjonsvinkelen? Bruk innfallsvinkelen som er markert i figuren.',
    value:35,tolerance:.1,unit:'°',
    answer:'Refleksjonsvinkel = innfallsvinkel = <strong>35°</strong>. Begge måles fra innfallsloddet.'
  },{
    id:'wv-f2',type:'open',level:'Bruk',figure:mirrorAngle('wv-f2',30,true),
    prompt:'Finn innfallsvinkelen. Bruk figuren til å tegne eller beskrive hvor den reflekterte strålen går.',
    answer:'Innfallsloddet står 90° på speilet. Innfallsvinkelen er 90° − 30° = <strong>60°</strong>. Refleksjonsvinkelen er også 60°, på motsatt side av innfallsloddet.'
  },{
    id:'wv-f4',type:'mcq',level:'Bruk',figure:lightWavefronts(),
    prompt:'De blå strekene viser bølgefrontene når lys går fra luft til glass. Hva skjer med frekvensen og bølgelengden?',
    choices:['Begge minker.','Frekvensen er uendret, og bølgelengden blir kortere.','Frekvensen øker, og bølgelengden er uendret.'],
    correct:1,
    answer:'Bølgefrontene ligger tettere i glasset, så bølgelengden er kortere. Frekvensen bestemmes av kilden og er uendret ved overgangen.'
  },{
    id:'wv-f5',type:'open',level:'Bruk',figure:pencilInWater(),
    prompt:'Hvor ser øyet blyantspissen, ved A eller B? Bruk lysstrålen i figuren til å forklare hvorfor blyanten ser knekt ut.',
    answer:'Øyet ser spissen ved <strong>B</strong>. Lys fra den nedsenkede delen endrer fart og retning i overgangen mellom vann og luft. Øyet tolker lyset som om det hadde gått rett fram, slik den stiplede linja viser.'
  },{
    id:'wv-f6',type:'number',level:'Bruk',figure:overlappingWaves(),
    prompt:'Bølgene overlapper. Hva blir amplituden til summen når bølgene svinger slik figuren viser?',
    value:6,tolerance:.05,unit:'cm',
    answer:'Begge har en bølgetopp på samme sted. Utslagene legges sammen: A<sub>sum</sub> = 3 cm + 3 cm = <strong>6 cm</strong>.'
  },{
    id:'wv-f7',type:'open',level:'Bruk',figure:overlappingWaves(true),
    prompt:'Se på de to lydsignalene ved øret. Hvordan kan lyden fra hodetelefonen dempe støyen?',
    answer:'Hodetelefonen sender ut lyd med omtrent motsatt utslag av støyen ved øret. Når utslagene legges sammen, reduseres lydtrykket der. Det er <strong>destruktiv interferens</strong>.'
  },{
    id:'wv-f8',type:'mcq',level:'Bruk',figure:waveOpenings(),
    prompt:'Bølgene i A og B har lik bølgelengde. Hvor vil de spre seg mest etter åpningen?',
    choices:['I A.','I B.','Like mye i A og B.'],
    correct:1,
    answer:'I <strong>B</strong> er åpningen omtrent like bred som én bølgelengde. Bøyning blir særlig tydelig når åpningens bredde er sammenlignbar med bølgelengden eller mindre.'
  },{
    id:'wv-f9',type:'open',level:'Bruk',figure:doorway(),
    prompt:'Veggen sperrer sikten til den som snakker i gangen. Hvorfor kan du likevel høre personen? Sammenlikn bøyningen til lyden og lyset.',
    answer:'Lyden sprer seg bak døråpningen. Bølgelengden til talelyd kan være sammenlignbar med åpningens bredde. Synlig lys har mye kortere bølgelengde, så lyset bøyes svært lite rundt veggen.'
  },{
    id:'wv-f10',type:'mcq',level:'Start',figure:swingTrace(),
    prompt:'Grafen viser huska når den svinger fritt. Hvor ofte bør du dytte i samme retning for å få størst utslag?',
    choices:['Hvert 2. sekund.','Hvert sekund.','Hvert 3. sekund.'],
    correct:0,
    answer:'Det er <strong>2 sekunder</strong> mellom toppene. Med like lang tid mellom dyttene kan du dytte når huska beveger seg forbi samme sted i samme retning. Da overføres energi effektivt ved resonans.'
  },{
    id:'wv-f11',type:'open',level:'Bruk',figure:tuningForks(),
    prompt:'Du slår på stemmegaffel A. B og C står like langt unna. Hvilken av dem vil svinge mest? Forklar.',
    answer:'<strong>C</strong>, fordi den har samme egenfrekvens som A, 440 Hz. Lydbølgene fra A får C til å ta opp energi effektivt. Det er resonans.'
  },{
    id:'wv-f12',type:'mcq',level:'Start',figure:siren(),
    prompt:'Ambulansen kjører mot deg med konstant sirenefrekvens. Bruk bølgefrontene til å avgjøre hvordan frekvensen du hører, er sammenlignet med sirenens egen frekvens.',
    choices:['Lavere.','Den samme.','Høyere.'],
    correct:2,
    answer:'Bølgefrontene foran ambulansen ligger tettere. De kommer derfor oftere fram til deg, og mottatt frekvens blir <strong>høyere</strong>.'
  },{
    id:'wv-f14',type:'open',level:'Utfordring',figure:fullLengthMirror(),
    prompt:'Hvor høy må speildelen mellom treffpunktene minst være, sammenlignet med kroppshøyden H? Begrunn ved å bruke de to lysstrålene.',
    answer:'Speilet må være <strong>halvparten av kroppshøyden</strong>. Treffpunktet for lyset fra føttene ligger midtveis mellom føttene og øyet i høyde. Det andre treffpunktet ligger midtveis mellom hodetoppen og øyet i høyde. Avstanden mellom treffpunktene er derfor halvparten av kroppshøyden.'
  }
];
