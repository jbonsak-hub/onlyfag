import {absorptionQuestion} from './absorption.js?v=20261122-spekter2';

const ink='var(--ink,#20352e)', muted='var(--muted,#52685f)', grid='var(--line,#cddbd1)';
const surface='var(--surface,#fff)', bg='var(--bg,#edf1eb)', blue='var(--blue,#2677a0)';
const warm='var(--orange,#a86b22)', green='var(--green,#236448)';
const center='text-anchor="middle"', end='text-anchor="end"', bold='font-weight="700"';
const small='font-size="12"';
const label=(x,y,text,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${text}</text>`;
const line=(x1,y1,x2,y2,stroke=muted,attrs='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" ${attrs}/>`;

function figure(id,title,description,content,height=146) {
  return `<svg class="eq-svg" data-em-figure="${id}" viewBox="0 0 360 ${height}" role="img" aria-labelledby="${id}-figure-title ${id}-figure-description">
    <title id="${id}-figure-title">${title}</title>
    <desc id="${id}-figure-description">${description}</desc>
    <rect width="360" height="${height}" rx="9" fill="${bg}"/>
    <g fill="${ink}" font-family="system-ui,sans-serif" font-size="14">${content}</g>
  </svg>`;
}

function arrow(x1,y1,x2,y2,stroke=muted,width=1.6) {
  const angle=Math.atan2(y2-y1,x2-x1);
  const head=[angle-.5,angle+.5].map(direction=>`${x2-6*Math.cos(direction)} ${y2-6*Math.sin(direction)}`);
  return `<path d="M${x1} ${y1}L${x2} ${y2}M${head[0]}L${x2} ${y2}L${head[1]}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
}

function graphTicks(values,position,y) {
  return values.map(value=>{
    const x=position(value);
    return line(x,y,x,y+4)+label(x,y+18,value,`${center} ${small} fill="${muted}"`);
  }).join('');
}

function wavePath(x,y,width,cycles,amplitude,profile,stroke,extra='') {
  const path=Array.from({length:101},(_,i)=>{
    const u=i/100, value=y+amplitude*profile(u,cycles);
    return `${i?'L':'M'}${(x+width*u).toFixed(1)} ${value.toFixed(1)}`;
  }).join(' ');
  return `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="2.35" stroke-linecap="round" ${extra}/>`;
}

function photonFrequencies() {
  const measurements=[
    ['Radiobølger',8],
    ['Gammastråling',21],
    ['Infrarødt',Math.log10(3e13)],
    ['Synlig rødt lys',Math.log10(4.6e14)]
  ];
  const x=power=>143+(power-8)/13*191;
  const rows=measurements.map(([name,power],i)=>{
    const y=43+i*26;
    return label(16,y+5,name)
      +line(143,y,334,y,grid,'stroke-width="1.8"')
      +`<circle cx="${x(power)}" cy="${y}" r="4.9" fill="${blue}" stroke="${surface}" stroke-width="1.2"/>`;
  }).join('');
  const scale=[['10⁸',8],['10¹²',12],['10¹⁶',16],['10²⁰',20]].map(([text,power])=>
    line(x(power),137,x(power),143)+label(x(power),157,text,`${center} ${small} fill="${muted}"`)).join('');
  return figure('em-01','Frekvensen til fire fotoner',
    'Eksemplene er radiobølger ved 10 opphøyd i 8 hertz, gamma ved 10 opphøyd i 21 hertz, infrarødt ved omtrent 3 ganger 10 opphøyd i 13 hertz, og synlig rødt lys ved omtrent 4,6 ganger 10 opphøyd i 14 hertz.',
    label(142,21,'Frekvens (Hz)',bold)+rows+line(143,137,334,137)+scale,171);
}

function wavelengthOrder() {
  const examples=[
    ['Gamma',3e-13],
    ['Synlig lys',5.5e-7],
    ['Radio',3],
    ['UV',1e-7],
    ['Mikrobølger',.12],
    ['Røntgen',1e-10],
    ['Infrarødt',1e-5]
  ];
  const x=wavelength=>132+(Math.log10(wavelength)+13)/14*201;
  const rows=examples.map(([name,wavelength],i)=>{
    const y=40+i*22;
    return label(16,y+5,name)
      +line(132,y,333,y,grid,'stroke-width="2"')
      +`<circle cx="${x(wavelength)}" cy="${y}" r="4.6" fill="${green}"/>`;
  }).join('');
  return figure('em-02','Bølgelengder på en felles skala',
    'Eksempelbølgelengder, i figurens rekkefølge: gamma 0,3 pikometer, synlig lys 550 nanometer, radio 3 meter, UV 100 nanometer, mikrobølger 12 centimeter, røntgen 0,1 nanometer og infrarødt 10 mikrometer.',
    label(132,21,'Bølgelengde',bold)+rows+arrow(132,181,333,181)
    +label(132,200,'Kortere',small)+label(333,200,'Lengre',`${small} ${end}`),211);
}

function radioReadout() {
  return figure('em-03','Frekvens avlest på en FM-mottaker',
    'Den digitale frekvensvisningen på mottakeren viser 100 megahertz.',
    `<path d="M103 34L86 12" stroke="${muted}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M70 12q-10 10 0 20M61 6q-16 16 0 32" fill="none" stroke="${blue}" stroke-width="2" opacity=".75"/>
    <rect x="51" y="36" width="258" height="78" rx="10" fill="${surface}" stroke="${muted}" stroke-width="1.6"/>
    <rect x="68" y="50" width="159" height="48" rx="5" fill="#132b36"/>
    ${label(147,81,'100 MHz',`${center} ${bold} fill="#edf9fa" font-size="23"`)}
    <circle cx="268" cy="74" r="15" fill="${bg}" stroke="${muted}" stroke-width="1.5"/>
    <path d="M268 60v6" stroke="${muted}" stroke-width="2" stroke-linecap="round"/>`,128);
}

function measuredWavelength() {
  const x=nm=>34+nm*.29;
  const y=109;
  const profile=(u,cycles)=>Math.cos(u*cycles*2*Math.PI);
  const callouts=[250,750].map(nm=>line(x(nm),36,x(nm),y,muted,'stroke-dasharray="4 4" opacity=".62"')).join('');
  const wave=wavePath(34,68,290,2,24,profile,'#339f87');
  return figure('em-04','Bølgeprofil til grønt lys',
    'Den romlige bølgeprofilen har bølgetopper ved posisjon 250 og 750 nanometer på aksen.',
    callouts+wave+arrow(34,y,334,y)+graphTicks([0,250,500,750,1000],x,y)
    +label(180,145,'Posisjon (nm)',`${center} ${small} fill="${muted}"`),156);
}

function vacuumPulses() {
  const profile=(u,cycles)=>Math.sin(2*Math.PI*u*cycles)*Math.sin(Math.PI*u)**2;
  const pulseRow=(name,cycles,y)=>{
    return label(16,y+5,name)+line(97,y,335,y,grid,'stroke-width="1.4"')
      +wavePath(98,y,65,cycles,12,profile,blue,'opacity=".45"')
      +wavePath(248,y,65,cycles,12,profile,blue);
  };
  return figure('em-05','To pulser i vakuum ved to tidspunkt',
    'Radio- og lyspulsen starter i samme posisjon ved 0 nanosekunder. Ved 1 nanosekund er begge vist like langt til høyre som hverandre. Bølgeformene er skjematiske.',
    label(131,24,'0 ns',`${center} ${bold}`)+label(281,24,'1 ns',`${center} ${bold}`)
    +line(131,34,131,126,muted,'stroke-dasharray="4 4" opacity=".45"')
    +line(281,34,281,126,muted,'stroke-dasharray="4 4" opacity=".45"')
    +pulseRow('Radiopuls',3,63)+pulseRow('Lyspuls',6,105),139);
}

function intensityBars() {
  const y=value=>116-value*36;
  const scale=[0,1,2].map(value=>
    line(58,y(value),320,y(value),grid,'stroke-width="1.2"')
    +label(47,y(value)+4,value,`${end} ${small} fill="${muted}"`)).join('');
  return figure('em-07','Intensitet før og etter en justering',
    'Målingen stiger fra 1 til 2 på en relativ skala. Begge søylene er oransje for å vise at lyset har samme farge.',
    label(19,20,'Relativ intensitet',bold)+scale+line(58,35,58,116)
    +`<rect x="99" y="${y(1)}" width="55" height="36" rx="3" fill="#ca662e"/>
    <rect x="220" y="${y(2)}" width="55" height="72" rx="3" fill="#ca662e"/>`
    +label(126.5,137,'Før',center)+label(247.5,137,'Etter',center),149);
}

function radioBand() {
  const left=33,right=327, minLog=Math.log10(3e3), maxLog=Math.log10(3e11);
  const at=left+(Math.log10(2.45e9)-minLog)/(maxLog-minLog)*(right-left);
  return figure('em-09','Radioområdet og en målt senderfrekvens',
    'Radioområdet er vist fra 3 kilohertz til 300 gigahertz. En markør ligger ved 2,45 gigahertz mellom disse grensene.',
    label(180,26,'Radiobølger',`${center} ${bold}`)
      +`<rect x="${left}" y="38" width="${right-left}" height="24" rx="5" fill="#4e958c"/>`
      +line(at,37,at,90,ink,'stroke-width="2.4"')
      +label(left,79,'3 kHz',`${small} fill="${muted}"`)
      +label(right,79,'300 GHz',`${end} ${small} fill="${muted}"`)
      +label(at,109,'2,45 GHz',`${center} ${bold}`),126);
}

function measuredReflection() {
  const values=[['Blått',5,'#378be1'],['Grønt',12,'#378b60'],['Rødt',78,'#bc4f57']];
  const left=92, right=323;
  const x=percent=>left+(right-left)*percent/100;
  const bars=values.map(([color,percent,fill],i)=>{
    const y=38+i*24;
    return label(17,y+13,color)
      +`<rect x="${left}" y="${y}" width="${right-left}" height="16" rx="3" fill="${surface}"/>
        <rect x="${left}" y="${y}" width="${x(percent)-left}" height="16" rx="3" fill="${fill}"/>`
      +label(x(percent)+7,y+12,percent+' %',`${small} ${bold}`);
  }).join('');
  return figure('em-11','Refleksjonsmåling på en rød genser',
    'Under hvitt lys reflekterer genseren i denne målingen 5 prosent av blått lys, 12 prosent av grønt lys og 78 prosent av rødt lys.',
    label(17,23,'Målt refleksjon',bold)+bars,119);
}

function visibleWaveforms() {
  const profile=(u,cycles)=>Math.cos(u*cycles*2*Math.PI);
  const start=36, width=288;
  const x=nm=>start+width*nm/1300;
  const row=(name,wavelength,y,color)=>label(start,y-23,name,bold)+line(start,y,start+width,y,grid)
    +wavePath(start,y,width,1300/wavelength,10,profile,color);
  return figure('em-12','Bølgeprofiler for blått og rødt lys',
    'Det blå lyset fullfører nær tre svingninger over samme strekning der det røde lyset fullfører to svingninger. Begge vises på en felles posisjonsakse.',
    row('Blått lys',450,42,blue)+row('Rødt lys',650,99,'var(--red,#b24d59)')
    +arrow(start,124,336,124)+graphTicks([0,650,1300],x,124)
    +label(180,160,'Posisjon (nm)',`${center} ${small} fill="${muted}"`),171);
}
function explosionFigure() {
  return figure('wv-b8','Eksplosjon i verdensrommet','En eksplosjon og en astronaut er vist på hver sin side av et område merket vakuum.',`
    <rect x="12" y="9" width="336" height="106" rx="12" fill="#111827"/>
    <g fill="#d7e5f6" opacity=".7">
      <circle cx="34" cy="28" r="1"/><circle cx="120" cy="32" r=".9"/><circle cx="133" cy="88" r="1.3"/>
      <circle cx="207" cy="31" r="1.15"/><circle cx="222" cy="89" r="1"/><circle cx="326" cy="24" r="1"/>
    </g>
    <g transform="translate(74 62)">
      <circle r="28" fill="#e75e34" opacity=".14"/>
      <path d="M-1-26 5-13 17-19 15-7 29-5 16 2 23 15 9 13 5 24-3 13-15 21-15 9-28 5-15-1-21-12-8-12Z" fill="#e77541"/>
      <path d="M1-15 7-7 16-5 10 2 15 8 6 7 1 15-4 7-14 8-9 0-12-7-3-8Z" fill="#ffbf65"/>
      <path d="M-5-4 3-7 8-2 5 6-3 7-7 2Z" fill="#fff1a9"/>
      <circle cx="-24" cy="-23" r="2" fill="#ffa15c"/><circle cx="27" cy="21" r="2" fill="#f5aa64"/>
    </g>
    <g transform="translate(279 61)" fill="#e1e9f1" stroke="#8296ad" stroke-width="1.5">
      <path d="M14-2H24V22H14M-8 14-17 24-22 17-13 4M9 10 19 21M-5 30-8 39M6 30 10 39" fill="none" stroke="#c6d4e2" stroke-width="7" stroke-linecap="round"/>
      <path d="M-13 0Q0-7 14 0L15 28Q0 35-12 27Z"/>
      <rect x="-7" y="9" width="11" height="8" rx="2" fill="#b8cbdc"/>
      <circle cy="-15" r="16"/>
      <path d="M-14-15Q-13-22-5-24H5V-9H-8Q-12-9-14-15Z" fill="#244568" stroke="#95b2cf"/>
      <path d="M-11-18Q-7-21-1-21" fill="none" stroke="#cde8f8" stroke-width="1.3"/>
    </g>
    ${label(180,67,'Vakuum',`${center} style="fill:#c5d2e5"`)}
    ${label(74,137,'Eksplosjon',center)}
    ${label(279,137,'Astronaut',center)}`,148);
}

function rgbFigure() {
  const channels=[{name:'Rød',color:'#e8585a'},{name:'Grønn',color:'#58ad78'},{name:'Blå',color:'#507ee8'}];
  return figure('em-06','RGB-kanaler og skjermfarge','Tre tilgjengelige kanaler er merket rød, grønn og blå. En separat skjermrute er gul.',`
    <rect x="14" y="13" width="204" height="121" rx="10" fill="${surface}" stroke="${grid}"/>
    <rect x="230" y="13" width="116" height="121" rx="10" fill="${surface}" stroke="${grid}"/>
    ${label(116,38,'Tilgjengelige kanaler',`${center} ${bold}`)}
    ${label(288,38,'Skjermen viser',`${center} ${bold}`)}
    ${channels.map(({name,color},i)=>{
      const x=51+i*65;
      return `<rect x="${x-19}" y="53" width="38" height="37" rx="7" fill="${color}"/>
        <rect x="${x-19}" y="53" width="38" height="37" rx="7" fill="none" stroke="${ink}" stroke-opacity=".16"/>
        ${label(x,113,name,center)}`;
    }).join('')}
    <rect x="250" y="52" width="76" height="62" rx="6" fill="#223044"/>
    <rect x="256" y="58" width="64" height="50" rx="3" fill="#f7d547"/>`,146);
}

function thermalFigure() {
  const person='M0-30a12 12 0 1 1 0 24a12 12 0 0 1 0-24Zm-11 27q11 7 22 0q14 5 18 21l4 20h-66l4-20q4-16 18-21Z';
  const view=(x,thermal)=>`
    <rect x="${x}" y="10" width="157" height="103" rx="10" fill="${thermal?'#172249':'#0d121a'}" stroke="${grid}"/>
    <g transform="translate(${x+78.5} 62)">
      ${thermal?`<path d="${person}" fill="url(#em08-person-heat)" stroke="#b75582" stroke-width="1.2"/>
       <path d="M-7-18q7-6 14 0v4q-7 9-14 0Z" fill="#ffdd71" opacity=".82"/><path d="M-5-5q5 5 10 0" fill="none" stroke="#ffcb60" stroke-width="2"/>`:''}
    </g>`;
  return figure('em-08','Samme person med to kameraer','Motivet er en person i et mørkt rom. Bildet fra det vanlige kameraet er mørkt. Varmekameraets bilde viser omrisset i flere farger.',`
    <defs><linearGradient id="em08-person-heat" x1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f9b44e"/><stop offset=".40" stop-color="#e7774b"/>
      <stop offset=".73" stop-color="#9a326f"/><stop offset="1" stop-color="#6149aa"/>
    </linearGradient></defs>
    ${view(15,false)}${view(188,true)}
    ${label(93,136,'Vanlig kamera',center)}
    ${label(267,136,'Varmekamera',center)}`,148);
}

function devicesFigure() {
  return figure('em-10','Eksempelverdier for to apparater','Figuren viser eksempelverdier for frekvens og effekt. Wi-Fi fra mobiltelefon: 2,4 gigahertz og 0,10 watt. Mikrobølgeovn: 2,45 gigahertz og 800 watt.',`
    <rect x="13" y="7" width="161" height="133" rx="10" fill="${surface}" stroke="${grid}"/>
    <rect x="186" y="7" width="161" height="133" rx="10" fill="${surface}" stroke="${grid}"/>
    ${label(94,31,'Wi-Fi fra mobil',`${center} ${bold}`)}
    ${label(267,31,'Mikrobølgeovn',`${center} ${bold}`)}
    <rect x="65" y="42" width="39" height="64" rx="7" fill="#1a2a3c"/>
    <rect x="69" y="46" width="31" height="50" rx="3" fill="#c8dde9"/>
    <circle cx="85" cy="101" r="2" fill="#c8dde9"/>
    <g fill="none" stroke="${blue}" stroke-width="2.2" stroke-linecap="round">
      <path d="M108 66q8 7 0 14M112 61q14 12 0 24M117 57q19 16 0 32"/>
    </g>
    <rect x="217" y="51" width="100" height="53" rx="7" fill="#293849"/>
    <rect x="223" y="57" width="68" height="39" rx="4" fill="#637c8e"/>
    <path d="M228 87q15 5 34 0t24 0" fill="none" stroke="#e3ac70" stroke-width="2"/>
    <path d="M228 62h57" stroke="#c9d8df" opacity=".65"/>
    <rect x="297" y="57" width="14" height="8" rx="2" fill="#b4cb89"/>
    <circle cx="304" cy="77" r="4" fill="#adc1d1"/><circle cx="304" cy="89" r="4" fill="#adc1d1"/>
    ${label(94,128,'2,4 GHz  ·  0,10 W',center)}
    ${label(267,128,'2,45 GHz  ·  800 W',center)}
    ${label(180,158,'Eksempelverdier',`${center} font-size="13"`)}`,168);
}

function surfaceLightingFigure() {
  const panels=[{x:13,light:'Rødt lys',color:'#dd4f55'},{x:187,light:'Blått lys',color:'#497ae5'}];
  return figure('wv-f3','Samme flate i rødt og blått lys','En ideelt rød, ugjennomsiktig flate belyses bare med rødt lys i det ene forsøket og bare med blått lys i det andre. Pilene viser lyset inn mot flaten.',panels.map(({x,light,color})=>{
    const mid=x+80;
    return `<rect x="${x}" y="10" width="160" height="125" rx="9" fill="${surface}" stroke="${grid}"/>
      <circle cx="${mid}" cy="50" r="8" fill="${color}"/>
      ${label(mid,30,light,`${center} ${bold}`)}
      ${arrow(mid-13,67,mid-13,88,color,2)}${arrow(mid,67,mid,88,color,2)}${arrow(mid+13,67,mid+13,88,color,2)}
      <path d="M${mid-36} 92H${mid+36}L${mid+44} 103H${mid-44}Z" fill="${bg}" stroke="${muted}" stroke-width="1.1"/>
      ${label(mid,123,'Samme røde flate',center)}`;
  }).join(''),146);
}

export const emQuestions=[
  {
    ...absorptionQuestion,
    figure:surfaceLightingFigure(),
    prompt:'Den ideelt røde flaten belyses på to måter i figuren. Hvordan ser den ut når den bare får blått lys?'
  },{
    id:'wv-b8',type:'open',level:'Bruk',figure:explosionFigure(),
    prompt:'Kan astronauten i figuren se eksplosjonen? Kan astronauten høre den? Forklar begge svarene.',
    answer:'Astronauten kan se eksplosjonen fordi lys er elektromagnetisk stråling og kan gå gjennom vakuum. Lyd er en mekanisk bølge som trenger et stoff å bre seg i. Vakuumet mellom eksplosjonen og astronauten kan derfor ikke overføre lyden.'
  },{
    id:'em-01',type:'mcq',level:'Start',figure:photonFrequencies(),
    prompt:'Bruk frekvensene i figuren. Hvilken strålingstype har størst energi per foton?',
    choices:['Radiobølger','Infrarødt','Synlig rødt lys','Gammastråling'],correct:3,
    answer:'Gammastråling ligger lengst mot høyere frekvens. Hvert foton har energi <strong>E = hf</strong>, så høyere frekvens gir større energi per foton.<details><summary>Ekstra forklaring</summary><p><em>h</em> er Plancks konstant. <em>f</em> er frekvensen til strålingen.</p></details>'
  },{
    id:'em-02',type:'open',level:'Start',figure:wavelengthOrder(),
    prompt:'Hver prikk viser en eksempelbølgelengde. Bruk plasseringen av prikkene til å sortere de sju strålingstypene fra lengst til kortest bølgelengde.',
    answer:'<strong>Radio → mikrobølger → infrarødt → synlig lys → UV → røntgen → gamma.</strong> Mikrobølger er en del av radiobølgeområdet, men skilles ofte ut i en slik oversikt.'
  },{
    id:'em-03',type:'number',level:'Bruk',figure:radioReadout(),
    prompt:'Les av frekvensen på radiomottakeren. Finn bølgelengden i vakuum. Bruk c = 3,00 · 10⁸ m/s.',
    value:3,tolerance:.03,unit:'m',hint:'Megahertz betyr millioner hertz. Bruk λ = c/f.',
    answer:'Mottakeren viser 100 MHz = 100 · 10<sup>6</sup> Hz. Da er λ = c/f = (3,00 · 10<sup>8</sup>)/(100 · 10<sup>6</sup>) m = <strong>3,00 m</strong>.'
  },{
    id:'em-04',type:'number',level:'Bruk',figure:measuredWavelength(),
    prompt:'Les av bølgelengden i figuren. Finn frekvensen i enheten 10¹⁴ Hz. Bruk c = 3,00 · 10⁸ m/s.',
    value:6,tolerance:.06,unit:'· 10¹⁴ Hz',hint:'Finn avstanden mellom to nabotopper. Gjør om fra nm til m før du bruker f = c/λ.',
    answer:'Avstanden mellom toppene er 750 nm − 250 nm = 500 nm = 5,00 · 10<sup>−7</sup> m. Da er f = c/λ = (3,00 · 10<sup>8</sup>)/(5,00 · 10<sup>−7</sup>) Hz = <strong>6,00 · 10<sup>14</sup> Hz</strong>.'
  },{
    id:'em-05',type:'mcq',level:'Start',figure:vacuumPulses(),
    prompt:'Figuren viser en radiopuls og en lyspuls ved to tidspunkt i vakuum. Hvilket utsagn om fart stemmer med det du ser?',
    choices:['Gamma går raskere enn radiobølger','Synlig lys går raskest','Alle EM-bølger går like raskt','Kortere bølger går alltid saktere'],correct:2,
    answer:'Pulsene har flyttet seg like langt på like lang tid. Dette stemmer med at alle EM-bølger går med lysfarten <strong>c</strong> i vakuum, selv om de har ulike frekvenser og bølgelengder.'
  },{
    id:'em-06',type:'open',level:'Bruk',figure:rgbFigure(),
    prompt:'Hvilke to av de viste kanalene kan sammen gi skjermfargen i figuren? Hva ser du hvis alle tre skrus av?',
    answer:'<strong>Rødt og grønt lys</strong> kan gi gult. Når alle tre kanalene er av, sender pikselen ikke ut lys og framstår svart.'
  },{
    id:'em-07',type:'mcq',level:'Bruk',figure:intensityBars(),
    prompt:'Intensiteten endrer seg slik figuren viser, mens fargen holder seg lik. Hva kan ha skjedd?',
    choices:['Hvert foton har nødvendigvis fått dobbelt energi','Det sendes ut flere fotoner per sekund','Lyset har fått dobbelt fart','Bølgelengden må være halvert'],correct:1,
    answer:'Lysets farge og frekvens er uendret, så hvert foton har den samme energien som før. Større intensitet kan skyldes at <strong>flere fotoner sendes ut per sekund</strong>.'
  },{
    id:'em-08',type:'open',level:'Bruk',figure:thermalFigure(),
    prompt:'Bildene viser samme person i et helt mørkt rom. Hvorfor kan varmekameraet vise personen?',
    answer:'Kroppen sender ut <strong>varmestråling, hovedsakelig infrarødt</strong>, selv når det ikke er synlig lys i rommet. Varmekameraet registrerer infrarød stråling og lager et bilde av målingen.'
  },{
    id:'em-09',type:'mcq',level:'Bruk',figure:radioBand(),
    prompt:'Senderen merket i figuren gir mikrobølger. Hva forteller plasseringen av frekvensen?',
    choices:['De er mekaniske bølger','De går bare gjennom luft','De er en del av radiobølgeområdet','Alle mikrobølgefotoner er ioniserende'],correct:2,
    answer:'Frekvensen ligger inne i radioområdet. Mikrobølger er kortbølgede <strong>radiobølger</strong>. De er derfor elektromagnetiske og kan også bre seg i vakuum.'
  },{
    id:'em-10',type:'open',level:'Utfordring',figure:devicesFigure(),
    prompt:'«Mobilen bruker mikrobølger, så den er som en mikrobølgeovn.» Bruk tallene i figuren til å vurdere påstanden. Hva må du også vite for å si noe om påvirkningen?',
    answer:'Eksemplene har lignende <strong>frekvens</strong>, men ovnen leverer langt større <strong>effekt</strong>. Ovnen tilfører energi i et skjermet rom for å varme mat. For å vurdere påvirkningen må du også vite blant annet avstand, hvor lenge strålingen treffer noe, og hvor mye som blir absorbert.'
  },{
    id:'em-11',type:'open',level:'Bruk',figure:measuredReflection(),
    prompt:'Figuren viser hvor mye av hver lysfarge en genser reflekterer. Bruk målingen til å forklare hvorfor genseren kan se mørk ut i rent blått lys.',
    answer:'I målingen reflekterer genseren mye rødt lys og lite blått lys. Med bare blått lys er det lite lys som reflekteres mot øynene dine. Derfor kan genseren se mørk ut.'
  },{
    id:'em-12',type:'mcq',level:'Start',figure:visibleWaveforms(),
    prompt:'Bølgeprofilene i figuren viser blått og rødt lys over samme strekning i vakuum. Hvilket utsagn stemmer?',
    choices:['Et rødt foton har mer energi','Et blått foton har mer energi','Alle synlige fotoner har samme energi','Rødt lys går raskere i vakuum'],correct:1,
    answer:'Det er kortere avstand mellom bølgetoppene i blått lys. Kortere bølgelengde gir høyere frekvens i vakuum. Derfor har et <strong>blått foton</strong> mer energi enn et rødt.'
  }
];
