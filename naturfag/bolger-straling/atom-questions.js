import {atomDrawing} from './atom-lab.js?v=20261126-atomoppgaver';
import {wavelengthColor} from './element-spectra.js?v=20261126-atomspektre';
import {spectraLabElements} from './spectra-lab-data.js?v=20261126-absorpsjon';

const {arrow, line, wavePacket}=atomDrawing;
const ink='var(--ink,#20352e)', exposed='var(--green,#236448)', muted='var(--muted,#52685f)';
const grid='var(--line,#cddbd1)', surface='var(--surface,#fff)', bg='var(--bg,#edf1eb)';
const blue='var(--blue,#2677a0)', warm='var(--orange,#a86b22)';
const label=(x,y,text,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${text}</text>`;
const point=(x,y,r=5)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${blue}" stroke="${surface}" stroke-width="1.5"/>`;

function figure(id,title,description,content,height=146) {
  return `<svg class="aq-svg" data-atom-figure="${id}" viewBox="0 0 360 ${height}" role="img" aria-labelledby="${id}-figure-title ${id}-figure-description">
    <title id="${id}-figure-title">${title}</title>
    <desc id="${id}-figure-description">${description}</desc>
    <rect width="360" height="${height}" rx="9" fill="${bg}"/>
    <g fill="${ink}" font-family="system-ui,sans-serif" font-size="14">${content}</g>
  </svg>`;
}

const center='text-anchor="middle"';
const end='text-anchor="end"';
const bold='font-weight="700"';

function levelRows(rows,left,right) {
  return rows.map(([y,name])=>line(left,y,right,y,muted,'stroke-width="1.25"')
    + label(right+10,y+5,name)).join('');
}

function energyAxis(x,top,bottom) {
  return arrow(x,bottom,x,top,muted,1.7) + label(x,top-6,'E',`fill="${muted}" ${center}`);
}

function atom(cx,cy) {
  return [14,28,41].map(r=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${muted}" opacity=".55" stroke-width="1.2"/>`).join('')
    + `<circle cx="${cx}" cy="${cy}" r="8" fill="#a75045"/>`
    + label(cx,cy+4,'+',`fill="white" ${center} font-size="12"`);
}

const knownLines=symbol=>spectraLabElements.find(element=>element.symbol===symbol).lines.map(([nm])=>[nm,wavelengthColor(nm)]);
const hydrogen=knownLines('H');
const sodium=knownLines('Na').filter(([nm])=>nm>588 && nm<590);
const spectrumWidth=312, spectrumLeft=24;
const spectralX=nm=>spectrumLeft+(nm-380)/400*spectrumWidth;
const spectralColors=[['0%','#5330a6'],['12%','#493de0'],['25%','#1f9eca'],['39%','#2bae72'],
  ['56%','#dfcf39'],['66%','#f88b38'],['76%','#e74d3c'],['100%','#a2222c']];

function spectrumRows(id,title,description,rows) {
  const annotationSpace=rows.some(row=>row.lines.some(([, , printed])=>printed))?20:0;
  const height=rows.length*47+36+annotationSpace;
  const gradient=rows.some(row=>row.dark && row.lines.length)
    ? `<defs><linearGradient id="${id}-spectrum-gradient">${spectralColors.map(([offset,color])=>`<stop offset="${offset}" stop-color="${color}"/>`).join('')}</linearGradient></defs>`
    : '';
  const bands=rows.map(({name,lines,dark},index)=>{
    const y=31+index*47;
    const fill=dark ? `url(#${id}-spectrum-gradient)` : '#0a1220';
    return label(spectrumLeft,y-7,name,bold)
      + `<rect x="${spectrumLeft}" y="${y}" width="${spectrumWidth}" height="16" rx="3" fill="${fill}"/>`
      + lines.map(([nm,color,printed])=>{
        const x=spectralX(nm);
        return line(x,y,x,y+16,dark?'#050810':color||'#f0f4ff',
          'stroke-width="2" vector-effect="non-scaling-stroke"')
          + (printed?label(x,y+31,printed,`${center} font-size="12"`):'');
      }).join('');
  }).join('');
  const base=rows.length*47+3+annotationSpace;
  const ticks=[400,500,600,700].map(nm=>{
    const x=spectralX(nm);
    return line(x,base,x,base+4,muted)
      + label(x,base+17,nm,`${center} font-size="12" fill="${muted}"`);
  }).join('');
  return figure(id,title,description,gradient+bands+line(spectrumLeft,base,spectrumLeft+spectrumWidth,base,grid)
    +ticks+label(336,base+17,'nm',`${end} font-size="12" fill="${muted}"`),height);
}

function firstTransition() {
  const levels=[[34,'n = 3'],[68,'n = 2'],[111,'n = 1']];
  return figure('atom-01','Elektronsprang i et atom','Pila peker fra n = 1 opp til n = 3.',
    energyAxis(72,30,116)+levelRows(levels,87,253)+arrow(172,109,172,37,blue,3),134);
}

function boundAndFree() {
  return figure('atom-02','To mulige utfall når hydrogen får energi',
    'I A ligger den blå elektronprikken på en ring. I B er elektronet utenfor ringene og fortsetter bort fra atomet.',
    label(88,23,'A',`${center} ${bold}`)+label(253,23,'B',`${center} ${bold}`)
    +line(179,24,179,118,grid)+atom(88,76)+atom(253,76)+point(113,64)+point(309,49)
    +arrow(316,46,340,35,blue,1.9),133);
}

function emittedPhoton() {
  return figure('atom-03','Elektron og utsendt lysbølge',
    'Pila peker inn fra en ytre ring til en indre ring. En kort bølge går ut til høyre.',
    atom(120,67)+arrow(156,48,145,54,blue,2.8)+point(144,53)
    +wavePacket(227,66,0,0,warm,62)+arrow(262,66,279,66,muted,1.5),133);
}

function levelDifference() {
  const levels=[[42,'−0,24 aJ'],[107,'−0,54 aJ']];
  return figure('atom-05','Energidiagram med to nivåer',
    'Pila peker ned fra −0,24 aJ til −0,54 aJ.',
    energyAxis(53,29,114)+levelRows(levels,67,231)+arrow(145,44,145,105,blue,3),132);
}

function dischargeTube() {
  return figure('atom-08','Gass i et utladningsrør',
    'En spenningskilde sender strøm gjennom en gass. Figuren viser et elektron på vei mot et atom i røret.',
    `<path d="M45 79V29H147M313 79V29H213" stroke="${muted}" fill="none" stroke-width="2"/>
    <rect x="147" y="15" width="66" height="28" rx="5" fill="${surface}" stroke="${muted}"/>
    ${label(180,34,'−    +',`${center} ${bold}`)}
    <rect x="43" y="61" width="272" height="47" rx="22" fill="${surface}" stroke="${muted}" stroke-width="1.5"/>
    <path d="M43 84H70M288 84H315" stroke="${muted}" stroke-width="4"/>
    <circle cx="183" cy="84" r="13" fill="none" stroke="${muted}"/><circle cx="183" cy="84" r="4.5" fill="#a75045"/>
    <circle cx="240" cy="83" r="8" fill="none" stroke="${muted}" opacity=".65"/>
    ${point(102,84)}${label(102,73,'e⁻',center)}${arrow(116,84,158,84,blue,2)}
    ${label(180,129,'Gass i røret',center)}`,143);
}

const drawingLevels=[4,3,2,1];
const drawingY=[0,169,122,75,28];
const drawingHeight=198;

function availableLevels() {
  const diagram=figure('atom-10','Fire energinivåer',
    'Det er fire vannrette streker, fra n = 1 nederst til n = 4 øverst.',
    energyAxis(34,27,172)+levelRows(drawingLevels.map(n=>[drawingY[n],`n = ${n}`]),57,267)
      +'<g data-energy-arrows aria-hidden="true"></g>',drawingHeight);
  return `<p class="q-energy-instruction" id="atom-10-drawing-instruction"><strong>Tegn i diagrammet.</strong> Velg to nivåer for å tegne en pil nedover mellom dem.</p>
    <div class="q-energy-diagram" role="group" aria-label="Tegn overganger" aria-describedby="atom-10-drawing-instruction">
      ${diagram}
      ${drawingLevels.map(n=>`<button type="button" data-energy-level="${n}" aria-label="Nivå ${n}" aria-pressed="false" style="--level-y:${100*drawingY[n]/drawingHeight}%"></button>`).join('')}
    </div>
    <div class="q-energy-tools">
      <span id="atom-10-drawing-status" role="status"></span>
      <button type="button" class="secondary" data-energy-undo>Angre</button>
      <button type="button" class="secondary" data-energy-clear>Tøm</button>
    </div>`;
}

function mountTransitionDrawing(figure) {
  const buttons=[...figure.querySelectorAll('[data-energy-level]')];
  const arrows=figure.querySelector('[data-energy-arrows]');
  const status=figure.querySelector('#atom-10-drawing-status');
  const undo=figure.querySelector('[data-energy-undo]');
  const clear=figure.querySelector('[data-energy-clear]');
  const pairs=[];
  let start=null;

  function render() {
    for(const button of buttons){
      button.setAttribute('aria-pressed',String(Number(button.dataset.energyLevel)===start));
    }
    arrows.innerHTML=pairs.map(([upper,lower],index)=>{
      const x=76+32*index;
      return arrow(x,drawingY[upper]+1,x,drawingY[lower]-1,exposed,2.8,`data-energy-arrow="${upper}-${lower}"`);
    }).join('');
    status.textContent=`${pairs.length} ${pairs.length===1?'pil':'piler'} tegnet`;
    undo.disabled=clear.disabled=pairs.length===0;
  }

  for(const button of buttons){
    button.addEventListener('click',()=>{
      const level=Number(button.dataset.energyLevel);
      if(start===null){
        start=level;
      }else{
        const upper=Math.max(start,level), lower=Math.min(start,level);
        if(upper!==lower&&!pairs.some(([from,to])=>from===upper&&to===lower))pairs.push([upper,lower]);
        start=null;
      }
      render();
    });
  }
  undo.addEventListener('click',()=>{
    pairs.pop();
    start=null;
    render();
  });
  clear.addEventListener('click',()=>{
    pairs.length=0;
    start=null;
    render();
  });
  render();
}

function detectorReadout() {
  return figure('atom-12','Frekvensmåler for lys',
    'Avlesningen er 5,0 ganger 10 opphøyd i 14 hertz.',
    wavePacket(73,62,0,0,exposed,62)+arrow(112,62,130,62,muted,1.6)
    +`<rect x="144" y="25" width="181" height="74" rx="7" fill="${surface}" stroke="${muted}"/>`
    +label(234,49,'Frekvens',center)+label(234,76,'5,0 · 10¹⁴ Hz',`${center} font-size="22" ${bold}`),125);
}

function startLevels() {
  const levels=[[30,'−0,14 aJ'],[57,'−0,24 aJ'],[88,'−0,54 aJ'],[128,'−2,18 aJ']];
  return figure('atom-13','Samme fotonenergi, ulike startnivåer',
    'I atom A starter elektronet på nivået −2,18 aJ. I atom B starter det på −0,54 aJ. Hvert atom møter ett foton på omtrent 0,30 aJ.',
    energyAxis(127,28,134)+levelRows(levels,142,256)
    +wavePacket(59,72,0,0,warm,49)+label(59,100,'≈ 0,30 aJ',`${center} ${bold}`)
    +point(166,128)+label(178,122,'A',bold)+point(166,88)+label(178,82,'B',bold),150);
}

function absorptionDepth() {
  const top=29, zero=122;
  const y=value=>zero-value*(zero-top)/100;
  const atA=127, atB=244;
  const trace=`M53 ${top}H97C112 ${top} 114 ${y(40)} ${atA} ${y(40)}
    S145 ${top} 160 ${top}H219C232 ${top} 234 ${y(70)} ${atB} ${y(70)}
    S258 ${top} 274 ${top}H321`;
  const guides=[0,40,70,100].map(value=>line(50,y(value),321,y(value),grid,'stroke-dasharray="4 4"')
    +label(43,y(value)+4,String(value),`${end} fill="${muted}" font-size="12"`)).join('');
  return figure('atom-14','Avlesing av to absorpsjonslinjer',
    'Relativ lysstyrke før gassen er 100. Kurven etter gassen faller til 40 ved A og til 70 ved B.',
    label(18,17,'Relativ lysstyrke',bold)+guides
    +line(50,top,50,zero,muted)+line(50,zero,321,zero,muted)
    +`<path d="${trace}" fill="none" stroke="${exposed}" stroke-width="2.5"/>`
    +[atA,atB].map((x,index)=>line(x,y(index?70:40),x,zero,muted,'opacity=".7" stroke-dasharray="3 3"')
      +label(x,zero+20,index?'B':'A',`${center} ${bold}`)).join('')
    +label(321,zero+20,'Bølgelengde',`${end} fill="${muted}" font-size="11"`),153);
}

function viewingDirections() {
  return figure('atom-15','Gassen sett rett fram og fra siden',
    'Lampen sender lys inn i gassrøret. Detektor A står i forlengelsen av strålen. Detektor B står på siden av røret.',
    `<circle cx="50" cy="69" r="15" fill="#ffe998" stroke="#ad763d" stroke-width="1.5"/>
    <path d="M44 83v8h12v-8" fill="#728890"/>
    ${label(50,111,'Lampe',center)}
    ${arrow(71,69,117,69,warm,2.7)}
    <rect x="124" y="55" width="98" height="29" rx="14.5" fill="${surface}" stroke="${muted}" stroke-width="1.4"/>
    ${label(173,74,'Gass',center)}
    <rect x="278" y="49" width="34" height="40" rx="5" fill="${surface}" stroke="${muted}" stroke-width="1.5"/>
    <rect x="153" y="111" width="40" height="29" rx="5" fill="${surface}" stroke="${muted}" stroke-width="1.5"/>
    ${label(295,75,'A',`${center} ${bold}`)}${label(173,131,'B',`${center} ${bold}`)}`,151);
}

function cascadePaths() {
  const rows=[[44,'n = 4'],[65,'n = 3'],[87,'n = 2'],[125,'n = 1']];
  return figure('atom-16','To elektronveier mellom de samme nivåene',
    'A viser ett sprang fra n = 4 til n = 1. B viser først spranget fra n = 4 til n = 2 og deretter fra n = 2 til n = 1.',
    label(78,24,'A',`${center} ${bold}`)+label(237,24,'B',`${center} ${bold}`)
    +line(180,22,180,135,grid)+levelRows(rows,20,122)+levelRows(rows,196,302)
    +arrow(74,46,74,123,blue,2.6)+arrow(221,46,221,85,blue,2.6)+arrow(267,89,267,123,blue,2.6),147);
}

export const atomQuestions=[
  {
    id:'atom-01',type:'mcq',level:'Start',figure:firstTransition(),
    prompt:'Pila viser hva elektronet gjør. Hva skjer med atomet?',
    choices:['En elektronovergang øker atomets energi','Atomkjernen mister et proton','Atomet blir et annet grunnstoff','Elektronet får null energi'],
    correct:0,answer:'Atomet får mer energi fordi elektronet går til et høyere bundet energinivå. Det kalles <strong>eksitasjon</strong>.'
  },{
    id:'atom-02',type:'open',level:'Start',figure:boundAndFree(),
    prompt:'Hva har skjedd med hydrogenatomet i A og i B? Forklar forskjellen på de to utfallene.',
    answer:'I A har atomet blitt <strong>eksitert</strong>. Elektronet har fått større energi og er fremdeles bundet til atomet. I B har atomet blitt <strong>ionisert</strong>. Elektronet er frigjort, og det som står igjen, er et positivt hydrogenion.'
  },{
    id:'atom-03',type:'mcq',level:'Start',figure:emittedPhoton(),
    prompt:'Elektronet skifter nivå og atomet sender ut et foton. Hva bestemmer hvor stor energi fotonet får?',
    choices:['Atomets fart gjennom rommet','Forskjellen mellom energinivåene','Hvor mange atomer det finnes i gassen','Hvor sterkt øyet oppfatter fargen'],
    correct:1,answer:'Fotonet får energien som atomet mister, altså <strong>forskjellen mellom energinivåene</strong>. Fotonenergien er ΔE = hf.'
  },{
    id:'atom-04',type:'open',level:'Bruk',
    figure:spectrumRows('atom-04','To synlige hydrogenlinjer','A ligger ved 486 nm. B ligger ved 656 nm.',
      [{name:'A',lines:[[486,'#57e9ff','486 nm']]},{name:'B',lines:[[656,'#ff6359','656 nm']]}]),
    prompt:'Hvilken av hydrogenlinjene A og B kommer fra overgangen med størst energiforskjell? Begrunn.',
    answer:'<strong>A ved 486 nm</strong> har kortere bølgelengde og dermed høyere frekvens enn B. Fotonet i A har derfor større energi, som svarer til en større energiforskjell i hydrogenatomet.'
  },{
    id:'atom-06',type:'open',level:'Bruk',
    figure:spectrumRows('atom-06','Lyse og mørke linjer fra samme gass',
      'Det øvre spekteret har to lyse linjer. De to mørke linjene i det nedre spekteret ligger ved de samme bølgelengdene.',
      [{name:'Lys fra gassen',lines:[[447.1479,'#7794ff'],[587.56148,'#ffda61']]},{name:'Lys gjennom gassen',lines:[[447.1479],[587.56148]],dark:true}]),
    prompt:'Hvorfor ligger de mørke og lyse linjene fra samme gass ved de samme bølgelengdene?',
    answer:'De tillatte energiforskjellene er de samme begge veier. Atomet kan <strong>absorbere</strong> et foton ved overgangen opp og <strong>sende ut</strong> et foton med samme energi ved overgangen ned. Lik fotonenergi gir lik bølgelengde.'
  },{
    id:'atom-07',type:'mcq',level:'Bruk',
    figure:spectrumRows('atom-07','Tre spektre på samme bølgelengdeskala',
      'Ukjent gass har linjer ved omtrent 410, 434, 486 og 656 nm. Hydrogen har linjer ved omtrent 410, 434, 486 og 656 nm. Natrium har to nærliggende linjer ved 589 nm.',
      [{name:'Ukjent gass',lines:hydrogen},{name:'Hydrogen',lines:hydrogen},{name:'Natrium',lines:sodium}]),
    prompt:'Sammenlikn plasseringen av linjene. Hvilket kjent linjemønster passer med målingen av den ukjente gassen?',
    choices:['Hydrogen','Natrium','Begge må være til stede','Ingen av dem'],
    correct:0,answer:'Alle fire linjene passer <strong>hydrogenets</strong> linjemønster. Natriumlinjene ligger et annet sted på bølgelengdeskalaen.'
  },{
    id:'atom-08',type:'open',level:'Bruk',figure:dischargeTube(),
    prompt:'Når det går strøm gjennom gassen i røret, begynner den å lyse. Forklar hvorfor. Bruk ordene kollisjon, eksitasjon og foton.',
    answer:'Elektroner får fart og <strong>kolliderer</strong> med partikler i gassen. Kollisjonene kan overføre energi og <strong>eksitere</strong> partiklene. Når de eksiterte partiklene går tilbake til lavere energinivåer, sendes det ut <strong>fotoner</strong>.'
  },{
    id:'atom-09',type:'mcq',level:'Start',
    figure:spectrumRows('atom-09','Måling av lys fra ett grunnstoff','Tre lyse linjer står ved tre ulike bølgelengder.',
      [{name:'Lys fra ett grunnstoff',lines:[[460,'#6594ff'],[536,'#9de96e'],[642,'#ff6d61']]}]),
    prompt:'Spekteret har bare lys ved enkelte bølgelengder. Hvilken endring i atomene kan gi disse linjene?',
    choices:['Elektroner skifter energinivå','Atomkjernen mister et proton ved hver linje','Atomet mister hele kjernen','Hvert atom sender ut alle bølgelengder'],
    correct:0,answer:'Elektronene kan bare ha bestemte energier. Hver overgang mellom to nivåer gir <strong>en bestemt fotonenergi</strong> og dermed en bestemt bølgelengde.'
  },{
    id:'atom-10',type:'open',level:'Utfordring',figure:availableLevels(),mountFigure:mountTransitionDrawing,
    prompt:'I denne modellen kan elektronet falle fra ethvert høyere nivå til et hvilket som helst lavere nivå. Hvor mange ulike overganger nedover er mulige? Må ett atom sende ut alle disse fotonene?',
    answer:'Mulighetene er 4→3, 4→2, 4→1, 3→2, 3→1 og 2→1, altså <strong>seks</strong>. Ett atom følger én vei ned gjennom nivåene. I mange atomer kan ulike veier gi alle de seks fotontypene til sammen.'
  },{
    id:'atom-11',type:'open',level:'Bruk',
    figure:spectrumRows('atom-11','Stjernespekter og spekter fra laboratoriet',
      'I stjernespekteret er det mørke linjer rundt 410, 434, 486, 517, 589 og 656 nm. Lyset fra gassen i laboratoriet har lyse linjer rundt 410, 434, 486 og 656 nm.',
      [{name:'Lys fra stjerna',lines:[...hydrogen,[517],[589]],dark:true},{name:'Lys fra gass i laboratoriet',lines:hydrogen}]),
    prompt:'Hvordan kan vi bruke de to spektrene til å finne stoffer i stjerna? Hva kan de andre mørke linjene skyldes?',
    answer:'Vi sammenlikner plasseringen av de mørke linjene i stjernelyset med de lyse linjene fra kjente gasser. <strong>Flere samsvarende linjer</strong> tyder på at det samme grunnstoffet finnes i stjernas ytre lag. De andre mørke linjene kan komme fra andre stoffer.'
  },{
    id:'atom-15',type:'open',level:'Utfordring',figure:viewingDirections(),
    prompt:'Lampa sender et sammenhengende spekter mot et rør med kjøligere gass. A ser langs lysstrålen, mens B ser på gassen fra siden. Hva slags linjer kan de to detektorene måle? Forklar.',
    answer:'A kan måle <strong>mørke absorpsjonslinjer</strong> i lyset fra lampa. Gassen tar opp lys ved bestemte bølgelengder. Atomene kan sende ut lys ved de samme bølgelengdene i andre retninger. B kan da måle <strong>lyse emisjonslinjer</strong> fra gassen mot en mørk bakgrunn.'
  },{
    id:'atom-16',type:'open',level:'Utfordring',figure:cascadePaths(),
    prompt:'Figuren viser to mulige veier ned gjennom energinivåene. Hvilken vei gir mest energi til fotonene til sammen? Hvor mange fotoner sendes ut på hver vei?',
    answer:'Begge veier gir <strong>samme totale fotonenergi</strong>. Atomet starter på n = 4 og ender på n = 1 i begge tilfeller. A gir ett foton. B gir to fotoner, og energiene deres summerer seg til den samme forskjellen mellom n = 4 og n = 1.'
  },{
    id:'atom-05',course:'Fysikk 1',type:'number',level:'Bruk',figure:levelDifference(),
    prompt:'Elektronet følger pila i energidiagrammet. Hvor stor energi får fotonet som sendes ut?',
    value:.30,tolerance:.005,unit:'aJ',hint:'Fotonet får forskjellen mellom atomets energi før og etter.',
    answer:'ΔE = −0,24 aJ − (−0,54 aJ) = <strong>0,30 aJ</strong>. Atomet mister energi, mens fotonet får positiv energi.'
  },{
    id:'atom-12',course:'Fysikk 1',type:'number',level:'Utfordring',figure:detectorReadout(),
    prompt:'Bruk frekvensmålingen til å beregne fotonenergien med <strong>E = hf</strong>, der f er frekvensen og h = 6,63 · 10<sup>−34</sup> J s. Oppgi energien i enheten 10<sup>−19</sup> J.',
    value:3.315,tolerance:.05,unit:'· 10⁻¹⁹ J',
    answer:'E = hf = 6,63 · 10<sup>−34</sup> J s · 5,0 · 10<sup>14</sup> Hz = <strong>3,315 · 10<sup>−19</sup> J ≈ 3,3 · 10<sup>−19</sup> J</strong>.'
  },{
    id:'atom-13',course:'Fysikk 1',type:'mcq',level:'Bruk',figure:startLevels(),
    prompt:'Hydrogenatomene A og B starter på ulike energinivåer. Hvert atom møter ett foton med energien i figuren. Hvilket atom kan ta opp fotonet og hoppe til et høyere nivå?',
    choices:['Bare A','Bare B','Begge','Ingen av dem'],
    correct:1,answer:'<strong>B</strong> kan gå fra −0,54 aJ til −0,24 aJ. Det krever 0,30 aJ. I A krever selv det korteste hoppet opp omtrent 1,64 aJ.'
  },{
    id:'atom-14',course:'Fysikk 1',type:'mcq',level:'Bruk',figure:absorptionDepth(),
    prompt:'Før lyset går gjennom gassen, er lysstyrken 100 ved både A og B. Figuren viser målingen på den andre siden. Hva stemmer?',
    choices:[
      'Lyset svekkes mest ved A. Noe lys slipper gjennom ved begge bølgelengdene.',
      'Lyset svekkes mest ved A. Ved A slipper det ikke gjennom noe lys.',
      'Lyset svekkes mest ved B. Noe lys slipper gjennom ved begge bølgelengdene.',
      'Lyset svekkes like mye ved A og B.'
    ],
    correct:0,answer:'Lysstyrken synker fra 100 til 40 ved <strong>A</strong> og fra 100 til 70 ved B. A har størst svekkelse. Begge målingene ligger over null, så noe lys slipper gjennom ved begge bølgelengdene.'
  }
];
