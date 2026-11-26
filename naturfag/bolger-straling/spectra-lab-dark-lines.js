const minimumWavelength=380, maximumWavelength=780;
const continuum=nm=>.81+.07*Math.sin(Math.PI*(nm-minimumWavelength)/(maximumWavelength-minimumWavelength));
const absorption=[
  {wavelength:410, depth:.30},
  {wavelength:434, depth:.43},
  {wavelength:486, depth:.36},
  {wavelength:656, depth:.61}
];
const colors=[
  [380,'#43268c'],[420,'#6838e2'],[450,'#264df0'],[485,'#169bdc'],
  [500,'#08b69e'],[535,'#35b65a'],[565,'#a2cc3c'],[585,'#edcf42'],
  [610,'#fa8e38'],[645,'#ea3b36'],[700,'#c4222d'],[780,'#791a24']
];
const intensity=nm=>continuum(nm)-absorption.reduce((loss,{wavelength,depth})=>
  loss+depth*Math.exp(-(((nm-wavelength)/3.7)**2)),0);

export function darkLinesGraphic({width=500}={}) {
  const compact=width<405;
  const viewWidth=compact?322:500, viewHeight=compact?192:207;
  const left=compact?23:34, right=viewWidth-(compact?13:17), top=29, zero=compact?117:132;
  const bandY=zero+12, bandHeight=20;
  const x=nm=>left+(nm-minimumWavelength)/(maximumWavelength-minimumWavelength)*(right-left);
  const y=value=>zero-(zero-top)*value;
  const ink='var(--ink,#20352e)', muted='var(--muted,#52685f)', accent='var(--green,#236448)';
  const label=(value,xx,yy,attributes='')=>`<text x="${xx}" y="${yy}" font-size="${compact?11:12}" fill="${ink}" ${attributes}>${value}</text>`;
  const curve=Array.from({length:401},(_,i)=>{
    const nm=minimumWavelength+i;
    return `${i?'L':'M'}${x(nm).toFixed(2)} ${y(intensity(nm)).toFixed(2)}`;
  }).join(' ');
  const spectrumGradient=colors.map(([nm,color])=>
    `<stop offset="${(nm-minimumWavelength)/(maximumWavelength-minimumWavelength)}" stop-color="${color}"/>`
  ).join('');
  const shadowGradients=absorption.map(({wavelength,depth},index)=>
    `<linearGradient id="sl-notch-${index}">
      <stop offset="0" stop-color="#050910" stop-opacity="0"/>
      <stop offset=".5" stop-color="#050910" stop-opacity="${depth/continuum(wavelength)}"/>
      <stop offset="1" stop-color="#050910" stop-opacity="0"/>
    </linearGradient>`
  ).join('');
  const shadows=absorption.map(({wavelength},index)=>
    `<rect x="${x(wavelength-6)}" y="${bandY}" width="${x(wavelength+6)-x(wavelength-6)}" height="${bandHeight}" fill="url(#sl-notch-${index})"/>`
  ).join('');
  const guides=absorption.map(({wavelength})=>
    `<path d="M${x(wavelength)} ${zero+2}V${bandY}" stroke="${muted}" stroke-opacity=".52" stroke-dasharray="2 2"/>`
  ).join('');
  const ticks=[380,450,550,650,780].map((wavelength,index,array)=>{
    const xx=x(wavelength), tickY=bandY+bandHeight;
    const anchor=index===0?'start':index===array.length-1?'end':'middle';
    return `<path d="M${xx} ${tickY}v4" stroke="${muted}"/>${label(wavelength,xx,tickY+15,`text-anchor="${anchor}"`)}`;
  }).join('');
  const dip=absorption.at(-1), dipX=x(dip.wavelength), dipY=y(intensity(dip.wavelength));

  return {
    viewBox:`0 0 ${viewWidth} ${viewHeight}`,
    markup:`<desc>Skjematisk graf over lysstyrke. Dalene ligger over null og har samme bølgelengder som de mørke linjene i fargebåndet under.</desc>
      <defs><linearGradient id="sl-dark-spectrum">${spectrumGradient}</linearGradient>${shadowGradients}</defs>
      ${label('Lysstyrke',left,17,'font-weight="650"')}
      <path d="M${left} ${top-4}V${zero}H${right}" fill="none" stroke="${muted}" stroke-opacity=".75"/>
      <path d="M${left-3} ${top}l3 -5 3 5" fill="none" stroke="${muted}"/>
      ${label('0',left-8,zero+4,'text-anchor="end"')}
      <path d="${curve} L${right} ${zero}H${left}Z" fill="${accent}" opacity=".07"/>
      <path d="${curve}" fill="none" stroke="${accent}" stroke-width="2.3" stroke-linejoin="round"/>
      <path d="M${dipX} ${dipY+4}V${zero-2}" stroke="${accent}" stroke-dasharray="3 3"/>
      <circle cx="${dipX}" cy="${dipY}" r="3" fill="${accent}"/>
      ${label('Lysstyrke over 0',dipX-8,(dipY+zero)/2+4,'text-anchor="end"')}
      ${guides}
      <rect x="${left}" y="${bandY}" width="${right-left}" height="${bandHeight}" rx="3" fill="url(#sl-dark-spectrum)"/>
      ${shadows}${ticks}
      ${label('Bølgelengde (nm)',(left+right)/2,viewHeight-6,'text-anchor="middle"')}`
  };
}
