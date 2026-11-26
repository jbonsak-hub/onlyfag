const width = 360;
const ink = 'var(--ink,#213630)';
const muted = 'var(--muted,#576b62)';
const grid = 'var(--line,#cedbd3)';
const blue = 'var(--blue,#23759b)';
const green = 'var(--green,#237258)';
const orange = 'var(--orange,#a8652a)';
const bg = 'var(--bg,#eef3ed)';
const center = 'text-anchor="middle"';
const end = 'text-anchor="end"';
const bold = 'font-weight="700"';
const small = 'font-size="12"';

const line = (x1,y1,x2,y2,color=muted,attrs='') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${attrs}/>`;
const label = (x,y,text,attrs='') => `<text x="${x}" y="${y}" ${attrs}>${text}</text>`;
const point = (x,y,fill=blue,r=4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const trace = (d,stroke=blue,attrs='') =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${attrs}/>`;
const dash = 'stroke-dasharray="4 4"';
const axis = 'stroke-width="1.25"';
const number = value => value.toLocaleString('nb-NO',{maximumFractionDigits:2}).replace('-','−');

function arrow(x1,y1,x2,y2,color=muted) {
  const angle = Math.atan2(y2-y1,x2-x1);
  const left = [x2-6*Math.cos(angle-.5),y2-6*Math.sin(angle-.5)];
  const right = [x2-6*Math.cos(angle+.5),y2-6*Math.sin(angle+.5)];
  return line(x1,y1,x2,y2,color,'stroke-width="1.7"')
    + trace(`M${left.join(' ')}L${x2} ${y2}L${right.join(' ')}`,color,'style="stroke-width:1.7"');
}

function curve(x0,x1,y,color=blue,attrs='') {
  const d=Array.from({length:145},(_,i)=>{
    const x=x0+(x1-x0)*i/144;
    return `${i?'L':'M'}${x.toFixed(2)} ${y(x).toFixed(2)}`;
  }).join('');
  return trace(d,color,attrs);
}

function figure(id,title,description,height,content) {
  return `<svg data-wave-basics-figure="${id}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-figure-title ${id}-figure-description">
    <title id="${id}-figure-title">${title}</title>
    <desc id="${id}-figure-description">${description}</desc>
    <rect width="${width}" height="${height}" rx="9" fill="${bg}"/>
    <g fill="${ink}" font-family="system-ui,sans-serif" font-size="14">${content}</g>
  </svg>`;
}

function plot({heading='Utslag',xLabel,xMin=0,xMax,xTicks,yMin=-1,yMax=1,yTicks=[],fn,stroke=blue,yTop=30,amplitudeHeight=70}) {
  const left=45,right=332,bottom=yTop+amplitudeHeight;
  const x=value=>left+(right-left)*(value-xMin)/(xMax-xMin);
  const y=value=>bottom-amplitudeHeight*(value-yMin)/(yMax-yMin);
  const writtenX=xTicks.map(value=>line(x(value),yTop,x(value),bottom+4,grid)
    +label(x(value),bottom+18,number(value),`${center} ${small}`)).join('');
  const writtenY=yTicks.map(value=>line(left,y(value),right,y(value),grid)
    +label(left-7,y(value)+4,number(value),`${end} ${small}`)).join('');
  const drawings=writtenX+writtenY+line(left,yTop,left,bottom,muted,axis)
    +line(left,y(0),right,y(0),muted,axis)
    +curve(left,right,px=>y(fn(xMin+(xMax-xMin)*(px-left)/(right-left))),stroke)
    +label(left,yTop-10,heading,bold)
    +label(right,bottom+34,xLabel,`${end} ${small}`);
  return drawings;
}

function soundParticles() {
  const spacing=16.5, count=17, period=7;
  const centerX=68+7*spacing;
  const positions=[['Først',43,0],['Så',84,2*Math.PI/3],['Til slutt',125,4*Math.PI/3]];
  const rows=positions.map(([name,y,phase])=>{
    const particles=Array.from({length:count},(_,i)=>{
      const x=68+i*spacing+7.5*Math.sin(2*Math.PI*i/period-phase);
      return point(x,y,i===7?orange:blue,i===7?5.3:3.2);
    }).join('');
    return label(11,y+4,name,small)+line(66,y,344,y,grid)+particles;
  }).join('');
  return figure('wv-b1','Tre øyeblikksbilder av en lydbølge',
    'Bølgemønsteret går mot høyre. Den samme markerte partikkelen er på hjelpelinja i første rad, litt til venstre i andre rad og litt til høyre i tredje rad.',
    146,label(264,19,'Bølgen går',`${end} ${small}`)+arrow(273,15,338,15)
    +line(centerX,27,centerX,137,muted,dash)+rows);
}

function waveParts() {
  const mid=88, amplitude=31, leftPeak=81,rightPeak=243, valley=162;
  const top=mid-amplitude, bottom=mid+amplitude;
  const graph=curve(27,331,x=>mid-amplitude*Math.cos(2*Math.PI*(x-leftPeak)/(rightPeak-leftPeak)));
  return figure('wv-b2','Bølge med punkter og mål',
    'P er på en topp og Q på neste bunn. Den stiplede linja ligger midt mellom dem. X måler den loddrette avstanden fra linja til en topp. Y måler den vannrette avstanden mellom to nabotopper.',
    142,line(25,mid,336,mid,muted,dash)+graph
    +point(leftPeak,top)+point(valley,bottom)
    +label(leftPeak-9,top-8,'P',`${end} ${bold}`)+label(valley+12,bottom+12,'Q',bold)
    +line(leftPeak,top-4,leftPeak,33,muted,dash)+line(rightPeak,top-4,rightPeak,33,muted,dash)
    +arrow(162,35,leftPeak,35,green)+arrow(162,35,rightPeak,35,green)+label(162,26,'Y',`${center} ${bold}`)
    +line(rightPeak+4,top,rightPeak+48,top,muted,dash)
    +arrow(rightPeak+45,72,rightPeak+45,top,orange)+arrow(rightPeak+45,72,rightPeak+45,mid,orange)
    +label(rightPeak+59,77,'X',bold));
}

function spatialFrequency() {
  return figure('wv-b3','Bølgeprofil langs en snor',
    'Profilen har bølgetopper ved 1 m og 3 m og bølgebunner ved 0, 2 og 4 m.',137,
    plot({heading:'Utslag',xLabel:'Strekning (m)',xMax:4,xTicks:[0,1,2,3,4],fn:x=>-.87*Math.cos(Math.PI*x)}));
}

function periodTrace() {
  return figure('wv-b4','Utslaget for et punkt over tid',
    'Tidsaksen er merket fra 0 til 0,8 s. Grafen når toppene ved 0,2 og 0,6 s.',
    137,plot({xLabel:'Tid (s)',xMax:.8,xTicks:[0,.2,.4,.6,.8],fn:t=>-.87*Math.cos(2*Math.PI*t/.4)}));
}

function toneSpectrum() {
  return figure('wv-b5','Frekvensmåling av en A-tone',
    'Grafen har ett tydelig maksimum. Det ligger ved merket 440 Hz på frekvensaksen.',
    137,plot({heading:'Signalstyrke',xLabel:'Frekvens (Hz)',xMin:400,xMax:480,
      xTicks:[400,420,440,460,480],yMin:0,yMax:1,fn:f=>.9*Math.exp(-((f-440)**2)/20)}));
}

function beachWave() {
  const pulse=plot({heading:'Vannhøyde ved brygga',xLabel:'Tid (s)',xMax:1,xTicks:[0,.25,.5,.75,1],
    fn:t=>-.84*Math.cos(4*Math.PI*t),stroke:green});
  return figure('wv-b6','Vannhøyden ved en flytebrygge',
    'Vannhøyden er størst ved 0,25 og 0,75 s. Tidsaksen går fra 0 til 1 s.',137,pulse);
}

function springs() {
  const midA=57,midB=122;
  const top=curve(60,337,x=>midA-13*Math.sin(2*Math.PI*(x-60)/116),blue);
  const coilX=index=>60+index*8+4.2*Math.sin(index*Math.PI/6);
  const markedCoil=coilX(16);
  const bottom=Array.from({length:35},(_,i)=>{
    const x=coilX(i);
    return line(x,midB-11,x,midB+11,blue,'stroke-width="1.4"');
  }).join('');
  return figure('wv-b7','To bølger i fjærer',
    'Begge bølgene går mot høyre. Ved det markerte punktet i A peker en pil opp og ned. Ved det markerte punktet i B peker den mot venstre og høyre.',
    157,label(23,midA+4,'A',bold)+label(23,midB+4,'B',bold)+line(16,86,343,86,grid)
    +label(248,20,'Bølgeretning',`${end} ${small}`)+arrow(260,16,338,16)
    +line(60,midA,337,midA,grid)+top
    +point(176,midA,orange,4.1)+arrow(176,midA-7,176,midA-23,orange)+arrow(176,midA+7,176,midA+23,orange)
    +line(60,midB,337,midB,grid)+bottom+point(markedCoil,midB,orange,4.3)
    +arrow(markedCoil-8,midB,markedCoil-26,midB,orange)+arrow(markedCoil+8,midB,markedCoil+26,midB,orange));
}

function thunderTimeline() {
  const x=seconds=>58+81*seconds;
  const ticks=[0,1,2,3].map(t=>line(x(t),95,x(t),102,muted,axis)
    +label(x(t),119,t,`${center} ${small}`)).join('');
  return figure('wv-b9','Tidslinje for lyn og torden',
    'Du ser lynet ved 0 s og hører tordenen ved 3 s. Begge hendelsene er merket over tidsaksen.',143,
    `<path d="M59 22L48 44H57L54 58L69 36H60L63 22Z" fill="${orange}"/>
     ${trace('M285 49L291 49L298 55V29L291 36H285Z M303 37Q309 42 303 48 M309 33Q318 42 309 52',blue,'style="stroke-width:1.8"')}
     ${label(x(0),72,'Du ser lynet',`${center} ${small}`)}${label(x(3),72,'Du hører tordenen',`${center} ${small}`)}
     ${line(x(0),77,x(0),96,grid,dash)}${line(x(3),77,x(3),96,grid,dash)}
     ${arrow(43,96,329,96)}${ticks}${label(331,134,'Tid (s)',`${end} ${small}`)}`);
}

function doublingFrequency() {
  const x=t=>49+283*t;
  const bands=[{name:'A',y:51,f:1,color:blue},{name:'B',y:116,f:2,color:green}];
  const ticks=[0,.25,.5,.75,1].map(t=>line(x(t),23,x(t),145,grid)
    +label(x(t),162,number(t),`${center} ${small}`)).join('');
  const waves=bands.map(({name,y,f,color})=>line(x(0),y,x(1),y,muted)
    +label(27,y+5,name,`${center} ${bold}`)
    +curve(x(0),x(1),px=>y-21*Math.sin(2*Math.PI*f*(px-x(0))/283),color)).join('');
  return figure('wv-b10','Svingningene i bølge A og B',
    'Tidsaksen fra 0 til 1 s er felles. A gjør én hel svingning, mens B gjør to hele svingninger.',
    184,label(49,18,'Utslag',bold)+ticks+waves+label(332,177,'Tid (s)',`${end} ${small}`));
}

function standingWave() {
  const left=32,right=330,mid=86,node=(left+right)/2,antinode=(left+node)/2;
  const deformation=x=>29*Math.sin(2*Math.PI*(x-left)/(right-left));
  return figure('wv-b11','Strengen ved to tidspunkt',
    'De to kurvene viser samme streng ved ulike tidspunkt. P har samme plassering midt på strengen. Q er på den øverste kurven på det ene tidspunktet og på den nederste på det andre.',
    144,line(26,mid,337,mid,muted,dash)+curve(left,right,x=>mid-deformation(x))
    +curve(left,right,x=>mid+deformation(x),green,dash)
    +line(antinode,mid-29,antinode,mid+29,muted,dash)+point(node,mid,orange,5)
    +point(antinode,mid-29,orange)+point(antinode,mid+29,orange)
    +label(node+10,mid-8,'P',bold)+label(antinode+8,mid-33,'Q',bold)+label(antinode+8,mid+46,'Q',bold)
    +line(29,18,51,18,blue,'stroke-width="2.5"')+label(58,22,'Tidspunkt 1',small)
    +line(200,18,222,18,green,'stroke-width="2.5" '+dash)+label(228,22,'Tidspunkt 2',small));
}

function amplitudeComparison() {
  const left=45,right=333;
  const top=53,bottom=129;
  const wave=(x,y,a)=>y-a*Math.cos(2*Math.PI*(x-88)/110);
  const guides=[88,198,308].map(x=>line(x,25,x,160,grid,dash)).join('');
  return figure('wv-b12','To øyeblikksbilder av en fjær',
    'Toppene i den nederste kurven ligger høyere over den vannrette linja. I begge bildene kommer toppene på de samme stedene langs fjæra.',
    181,guides+label(left,21,'Før',bold)+label(left,98,'Etter at fjæra får mer energi',bold)
    +line(left,top,right,top,muted)+line(left,bottom,right,bottom,muted)
    +curve(left,right,x=>wave(x,top,11))+curve(left,right,x=>wave(x,bottom,23),green)
    +label(right,173,'Strekning langs fjæra',`${end} ${small}`));
}

function corkTrace() {
  return figure('wv-b13','Høyden til en kork over tid',
    'Grafen starter ved likevektslinja og stiger. Den gjør 15 hele svingninger fram til 10 s.',
    143,plot({heading:'Utslag fra likevekt',xLabel:'Tid (s)',xMax:10,xTicks:[0,2,4,6,8,10],
      fn:t=>.83*Math.sin(3*Math.PI*t),stroke:green,amplitudeHeight:76}));
}

function twoMeasurements() {
  const spatial=plot({heading:'Utslag (m)',xLabel:'Strekning (m)',xMax:3.2,xTicks:[0,1,2,3],
    yMin:-3.4,yMax:3.4,yTicks:[-3,0,3],fn:x=>3*Math.cos(Math.PI*x)});
  const time=plot({heading:'Utslag i ett fast punkt',xLabel:'Tid (s)',xMax:16,xTicks:[0,4,8,12,16],
    fn:t=>.85*Math.cos(Math.PI*t/2),stroke:green,amplitudeHeight:55,yTop:168});
  return figure('wv-b14','Bølgeprofil og måling over tid',
    'Øverst er det topper ved 0 og 2 m og bunner ved 1 og 3 m. Toppen ligger 3 m over likevektslinja. Nederst viser grafen maksimum ved 0, 4, 8, 12 og 16 s.',
    265,spatial+line(14,142,346,142,grid)+time);
}

export const waveBasicsQuestions = [
  {
    id:'wv-b1',type:'mcq',level:'Start',figure:soundParticles(),
    prompt:'Tre bilder følger den samme markerte luftpartikkelen mens lydbølgen går mot høyre. Hva gjør partikkelen?',
    choices:['Følger lyden hele veien fra høyttaleren til øret.','Svinger fram og tilbake omkring sin likevektsstilling.','Står helt stille mens energien passerer.'],
    correct:1,answer:'Den markerte luftpartikkelen flytter seg litt til hver side av hjelpelinja. Luftpartiklene svinger lokalt. Trykkvariasjonen og energien brer seg gjennom lufta.'
  },{
    id:'wv-b2',type:'open',level:'Start',figure:waveParts(),
    prompt:'Skisser bølgen i figuren. Sett navn på den vannrette stiplede linja gjennom bølgen, punktene P og Q og avstandene X og Y.',
    answer:'Den stiplede linja er <strong>likevektslinja</strong>. P er en <strong>bølgetopp</strong>, og Q er en <strong>bølgebunn</strong>. X er <strong>amplituden</strong> fra likevekt til topp. Y er <strong>bølgelengden</strong> mellom to nabotopper.'
  },{
    id:'wv-b3',type:'number',level:'Bruk',figure:spatialFrequency(),
    prompt:'Bølgen langs snora har fart 5 m/s. Les av bølgelengden i figuren og finn frekvensen.',
    value:2.5,tolerance:.02,unit:'Hz',
    hint:'Les av strekningen mellom to nabotopper. Bruk v = f · λ.',
    answer:'Toppene ligger ved 1 m og 3 m, så λ = 2 m. Da er f = v / λ = 5 m/s / 2 m = <strong>2,5 Hz</strong>.'
  },{
    id:'wv-b4',type:'number',level:'Bruk',figure:periodTrace(),
    prompt:'Grafen viser utslaget til ett punkt som svinger. Hvor lang er perioden?',
    value:.4,tolerance:.005,unit:'s',
    hint:'Se på tidspunktene til to topper som kommer rett etter hverandre.',
    answer:'Det går én hel svingning mellom nabotoppene. T = 0,60 s − 0,20 s = <strong>0,40 s</strong>.'
  },{
    id:'wv-b5',type:'number',level:'Bruk',figure:toneSpectrum(),
    prompt:'Toppen i grafen viser frekvensen til A-tonen. Lydfarten er 345 m/s. Finn bølgelengden.',
    value:345/440,tolerance:.01,unit:'m',
    answer:'Toppen ligger ved 440 Hz. λ = v / f = 345 m/s / 440 Hz ≈ <strong>0,784 m</strong>.'
  },{
    id:'wv-b6',type:'number',level:'Bruk',figure:beachWave(),
    prompt:'Grafen viser vannhøyden på ett sted ved en flytebrygge. Bølgene går med fart 4 m/s. Hvor langt er det mellom nabotoppene ute på vannet?',
    value:2,tolerance:.02,unit:'m',
    answer:'Nabotoppene passerer brygga med 0,50 s mellomrom. På den tida går bølgen λ = v · T = 4 m/s · 0,50 s = <strong>2 m</strong>.'
  },{
    id:'wv-b7',type:'mcq',level:'Start',figure:springs(),
    prompt:'Begge bølgene brer seg mot høyre. Hvilken av dem er en langsbølge?',
    choices:['Bølge A.','Bølge B.','Både A og B.'],
    correct:1,answer:'<strong>Bølge B</strong> er en langsbølge. Pila ved den markerte delen av fjæra viser at svingningen går fram og tilbake langs bølgeretningen. I A går svingningen på tvers.'
  },{
    id:'wv-b9',type:'number',level:'Bruk',figure:thunderTimeline(),
    prompt:'Bruk tidslinja. Regn med lydfart 340 m/s og se bort fra lysets reisetid. Hvor langt unna er lynet?',
    value:1020,tolerance:10,unit:'m',
    answer:'Tidslinja viser at lyden bruker 3,0 s. s = v · t = 340 m/s · 3,0 s = <strong>1020 m</strong>, omtrent 1 km.'
  },{
    id:'wv-b10',type:'mcq',level:'Bruk',figure:doublingFrequency(),
    prompt:'Figuren viser utslaget over tid for to bølger som går like fort. Hva er bølgelengden til B sammenlignet med A?',
    choices:['Dobbelt så stor.','Halvparten så stor.','Like stor.'],
    correct:1,answer:'B gjør to svingninger på tida A gjør én. B har dobbelt så høy frekvens. Siden λ = v / f og farten er den samme, har B <strong>halv bølgelengde</strong>.'
  },{
    id:'wv-b11',type:'open',level:'Bruk',figure:standingWave(),
    prompt:'De to kurvene viser samme stående bølge på ulike tidspunkt. En elev sier at hele strengen står stille. Bruk punktene P og Q til å vurdere påstanden.',
    answer:'<strong>P er et stille punkt.</strong> Q har store utslag og svinger opp og ned. Selve svingemønsteret blir på samme sted selv om deler av strengen beveger seg.'
  },{
    id:'wv-b12',type:'open',level:'Utfordring',figure:amplitudeComparison(),
    prompt:'En elev sier at bølgelengden blir kortere når fjæra får mer energi. Bruk figuren til å vurdere påstanden.',
    answer:'Toppene ligger på de samme stedene i begge bildene. <strong>Amplituden øker, og bølgelengden er den samme.</strong> Bølgelengden λ = v / f holder seg uendret når bølgefarten og frekvensen er de samme.'
  },{
    id:'wv-b13',type:'number',level:'Start',figure:corkTrace(),
    prompt:'En kork dupper på vannet. Bruk grafen til å finne perioden og frekvensen.',
    fields:[
      {label:'Periode T',value:10/15,tolerance:.005,unit:'s'},
      {label:'Frekvens f',value:15/10,unit:'Hz'}
    ],
    answer:'Korken gjør 15 hele svingninger på 10 s. Én svingning tar 10 s / 15 ≈ <strong>0,67 s</strong>. Frekvensen er 15 / 10 s = <strong>1,5 Hz</strong>.'
  },{
    id:'wv-b14',type:'number',level:'Bruk',figure:twoMeasurements(),
    prompt:'Bølgen går med konstant fart. Øverst ser du et øyeblikksbilde langs snora, nederst ser du utslaget i ett fast punkt over tid.',
    fields:[
      {label:'Bølgelengde λ',value:2,unit:'m'},
      {label:'Amplitude A',value:3,unit:'m'},
      {label:'Periode T',value:16/4,unit:'s'},
      {label:'Frekvens f',value:4/16,unit:'Hz'},
      {label:'Bølgefart v',value:2*4/16,unit:'m/s'}
    ],
    answer:'Den øverste grafen viser 2 m mellom toppene og 3 m fra likevekt til topp. Den nederste viser fire svingninger på 16 s. Det gir <strong>T = 4 s</strong> og <strong>f = 0,25 Hz</strong>. Bølgefarten er v = f · λ = <strong>0,50 m/s</strong>.'
  }
];
