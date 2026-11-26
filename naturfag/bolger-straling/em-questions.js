const ink='var(--ink,#20352e)', muted='var(--muted,#52685f)';
const grid='var(--line,#cddbd1)', surface='var(--surface,#fff)', bg='var(--bg,#edf1eb)';
const uv='var(--blue,#2677a0)', visible='var(--green,#236448)';
const center='text-anchor="middle"', bold='font-weight="700"';
const label=(x,y,text,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${text}</text>`;

function figure(id,title,description,height,content) {
  return `<svg class="eq-svg" data-em-figure="${id}" viewBox="0 0 360 ${height}" role="img" aria-labelledby="${id}-figure-title ${id}-figure-description">
    <title id="${id}-figure-title">${title}</title>
    <desc id="${id}-figure-description">${description}</desc>
    <rect width="360" height="${height}" rx="9" fill="${bg}"/>
    <g fill="${ink}" font-family="system-ui,sans-serif" font-size="14">${content}</g>
  </svg>`;
}

function glassTransmission() {
  const samples=[['A',4,62],['B',8,84],['C',24,93]];
  const bar=(x,y,percent,color)=>`<rect x="${x}" y="${y}" width="116" height="11" rx="3" fill="${surface}" stroke="${grid}"/>
    <rect x="${x}" y="${y}" width="${116*percent/100}" height="11" rx="3" fill="${color}"/>
    ${label(x+58,y+27,percent+' %',center)}`;
  const measures=samples.map(([name,uvValue,visibleValue],i)=>{
    const y=60+i*40;
    return label(27,y+10,name,`${center} ${bold}`)+bar(58,y,uvValue,uv)+bar(208,y,visibleValue,visible);
  }).join('');
  return figure('em-13','Gjennomslipp i tre glassprøver',
    'Glass A slipper gjennom 4 prosent UV og 62 prosent synlig lys. Glass B slipper gjennom 8 prosent UV og 84 prosent synlig lys. Glass C slipper gjennom 24 prosent UV og 93 prosent synlig lys.',
    179,label(18,23,'Andel som slipper gjennom',bold)
      +label(116,48,'UV',`${center} ${bold}`)+label(266,48,'Synlig lys',`${center} ${bold}`)+measures);
}

function sunsetMeasurements() {
  const colors=[
    {name:'Blått',fill:'#387bdf'},
    {name:'Grønt',fill:'#368956'},
    {name:'Rødt',fill:'#c64d57'}
  ];
  const baseline=123;
  const chart=(offset,name,strengths)=>label(offset+61,47,name,`${center} ${bold}`)
    +`<line x1="${offset-4}" y1="${baseline+.5}" x2="${offset+124}" y2="${baseline+.5}" stroke="${muted}"/>`
    +colors.map(({name,fill},i)=>{
      const x=offset+i*42, height=strengths[i]*.68;
      return `<rect x="${x+6}" y="${baseline-height}" width="25" height="${height}" rx="3" fill="${fill}"/>`
        +label(x+18,145,name,`${center} font-size="11.5"`);
    }).join('');
  return figure('em-14','To målinger av fargefordelingen før solnedgang',
    'Måling A har klart mest blått lys, mindre grønt lys og minst rødt lys. Måling B har klart mest rødt lys, mindre grønt lys og minst blått lys.',
    158,label(18,23,'Relativ lysstyrke',bold)
      +chart(29,'Måling A',[91,54,28])+chart(207,'Måling B',[23,57,91]));
}

export const emQuestions=[
  {
    id:'em-13',type:'open',level:'Bruk',newFigureQuestion:true,figure:glassTransmission(),
    prompt:'Et museum vil beskytte et maleri med glass. Glasset skal slippe gjennom høyst 10 % av UV-strålingen og minst 75 % av det synlige lyset. Hvilken glassprøve passer? Bruk begge målingene til å begrunne valget.',
    answer:'<strong>Glass B</strong> oppfyller begge kravene. Det slipper gjennom 8 % UV og 84 % synlig lys. Glass A slipper gjennom for lite synlig lys (62 %), mens glass C slipper gjennom for mye UV (24 %).'
  },{
    id:'em-14',type:'open',level:'Bruk',newFigureQuestion:true,figure:sunsetMeasurements(),
    prompt:'Figuren viser to skjematiske målinger rett før solnedgang, én mot sola og én mot himmelen et stykke unna sola. Blått lys spres lettere enn rødt i luft. Hvilken måling hører til hver retning? Forklar hvorfor målingene er ulike.',
    answer:'<strong>Måling B</strong> passer med lyset rett fra sola. Sollyset går langt gjennom lufta før solnedgang. Mye blått lys spres ut av strålen på veien, så det direkte lyset inneholder forholdsvis mer rødt. <strong>Måling A</strong> passer med himmelen unna sola. Der måler vi lys som luftmolekylene har spredt mot oss, med en stor andel blått lys.'
  }
];
