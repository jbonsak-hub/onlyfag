const ink='var(--ink,#20352e)';
const muted='var(--muted,#60736b)';
const grid='var(--line,#dce5de)';
const blue='var(--blue,#2677a0)';
const green='var(--green,#236448)';
const center='text-anchor="middle"';
const end='text-anchor="end"';
const bold='font-weight="700"';

const label=(x,y,text,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${text}</text>`;
const line=(x1,y1,x2,y2,color=muted,attrs='')=>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${attrs}/>`;
const point=(x,y,color)=>`<circle cx="${x}" cy="${y}" r="4.5" fill="${color}"/>`;

function curve(xStart,xEnd,y,stroke) {
  const d=Array.from({length:141},(_,i)=>{
    const x=xStart+(xEnd-xStart)*i/140;
    return `${i?'L':'M'}${x.toFixed(2)} ${y(x).toFixed(2)}`;
  }).join('');
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function figure(id,title,description,height,content) {
  return `<svg data-wave-basics-figure="${id}" viewBox="0 0 360 ${height}" role="img" aria-labelledby="${id}-figure-title ${id}-figure-description">
    <title id="${id}-figure-title">${title}</title>
    <desc id="${id}-figure-description">${description}</desc>
    <g fill="${ink}" font-family="system-ui,sans-serif" font-size="14">${content}</g>
  </svg>`;
}

function pulseAtTwoSensors() {
  const left=48,right=331,endTime=1.4;
  const x=t=>left+(right-left)*t/endTime;
  const stations=line(62,31,318,31,muted,'stroke-width="1.5"')
    +point(62,31,blue)+point(318,31,green)
    +label(62,21,'P',`${center} ${bold}`)+label(318,21,'Q',`${center} ${bold}`)
    +label(190,22,'1,8 m',center);
  const times=['0','0,2','0,4','0,6','0,8','1,0','1,2','1,4'];
  const guides=times.map((time,index)=>{
    const px=x(index*.2);
    return line(px,58,px,173,grid)+label(px,191,time,center);
  }).join('');
  const pulses=[
    {name:'P',peak:1,y:105,color:blue},
    {name:'Q',peak:.4,y:167,color:green}
  ].map(({name,peak,y,color})=>{
    const draw=px=>{
      const offset=(px-x(peak))/(x(.18)-left);
      return Math.abs(offset)<1?y-39*Math.cos(Math.PI*offset/2)**2:y;
    };
    return line(left,y,right,y)+label(30,y+5,name,`${end} ${bold}`)+curve(left,right,draw,color);
  }).join('');
  return figure('wv-b15','En bølgepuls målt på to steder',
    'Måler P står til venstre for måler Q. Avstanden er 1,8 m. Pulsen når toppen ved 1,0 s hos P og ved 0,4 s hos Q.',
    215,stations+line(16,43,344,43,grid)+guides+pulses+label(331,211,'Tid (s)',end));
}

function twoStringPatterns() {
  const left=48,scale=308;
  const strings=[
    {name:'A',length:.9,segments:3,y:66,lengthLabel:'0,90 m',color:blue},
    {name:'B',length:.6,segments:1,y:164,lengthLabel:'0,60 m',color:green}
  ].map(({name,length,segments,y,lengthLabel,color})=>{
    const right=left+length*scale;
    const wave=curve(left,right,x=>y-29*Math.sin(segments*Math.PI*(x-left)/(right-left)),color);
    const guide=line(left,y+44,right,y+44,muted)+line(left,y+40,left,y+48)+line(right,y+40,right,y+48);
    return label(24,y+5,name,`${center} ${bold}`)+line(left,y,right,y,muted,'stroke-dasharray="4 4"')+wave
      +line(left,y-10,left,y+10,ink,'stroke-width="3"')+line(right,y-10,right,y+10,ink,'stroke-width="3"')
      +guide+label((left+right)/2,y+64,lengthLabel,center);
  }).join('');
  return figure('wv-b16','Stående bølger på to strenger',
    'Streng A er 0,90 m. Mellom festene går den opp i en bue, ned i en bue og opp igjen. Streng B er 0,60 m og går i én bue mellom festene.',
    236,label(48,18,'Samme målestokk',`fill="${muted}"`)+strings);
}

export const waveBasicsQuestions=[
  {
    id:'wv-b15',type:'open',level:'Bruk',newFigureQuestion:true,figure:pulseAtTwoSensors(),
    prompt:'To målere på ei snor starter samtidig og registrerer den samme bølgepulsen. Hvilken vei går pulsen, og hvor stor er bølgefarten? Begrunn med figuren.',
    answer:'Toppen passerer Q ved 0,4 s og P ved 1,0 s. Pulsen går derfor <strong>fra Q mot P</strong>. Den bruker 1,0 s − 0,4 s = 0,6 s på de 1,8 meterne mellom målerne. Bølgefarten er v = 1,8 m / 0,6 s = <strong>3,0 m/s</strong>.'
  },{
    id:'wv-b16',type:'open',level:'Utfordring',newFigureQuestion:true,figure:twoStringPatterns(),
    prompt:'Figuren viser to strenger med stående bølger. Bølgene som danner mønstrene har samme fart i begge strengene. Hvilken streng gir høyest tone? Finn forholdet mellom frekvensene, og begrunn svaret.',
    answer:'Avstanden fra ett stille punkt til det neste er en halv bølgelengde. I A er det tre slike avstander på 0,90 m. Da blir bølgelengden 2 · (0,90 m / 3) = 0,60 m. I B er den ene halve bølgelengden 0,60 m, så hele bølgelengden er 1,20 m. Med samme bølgefart gir halv bølgelengde dobbelt så høy frekvens. <strong>Streng A gir høyest tone. Frekvensen er dobbelt så stor som i B.</strong>'
  }
];
