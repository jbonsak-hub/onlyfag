const sodiumWavelength = 589;
const yellow = '#f2ad21';
const beamSamples = [
  {nm:420,color:'#9052e3'},
  {nm:465,color:'#407bed'},
  {nm:502,color:'#26a9c7'},
  {nm:544,color:'#3aa569'},
  {nm:589,color:yellow},
  {nm:640,color:'#ee7947'},
  {nm:695,color:'#da4b53'}
];

function layoutFor(width) {
  return width<550
    ? {width:360,height:291,left:24,right:310,barWidth:26,barY:53,barHeight:118,gasX:132,gasY:43,gasWidth:96,gasHeight:136,center:180,upper:229,lower:263,outDistance:64,compact:true}
    : {width:900,height:306,left:53,right:804,barWidth:42,barY:53,barHeight:134,gasX:348,gasY:43,gasWidth:204,gasHeight:153,center:450,upper:245,lower:276,outDistance:75,compact:false};
}

const text = (x,y,label,{size=14,weight=500,anchor='middle',muted=false}={}) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${muted?'var(--muted,#51685e)':'var(--ink,#20352e)'}">${label}</text>`;
const wavelengthY = (layout,nm) => layout.barY+(nm-380)/400*layout.barHeight;
const mix = (a,b,p) => a+(b-a)*p;
const unit = n => Math.max(0,Math.min(1,n));
function smooth(n) {
  const p=unit(n);
  return p*p*(3-2*p);
}

function arrow(x1,y1,x2,y2,color,{width=1.5,opacity=1}={}) {
  const angle=Math.atan2(y2-y1,x2-x1);
  const xA=x2-6*Math.cos(angle-.48), yA=y2-6*Math.sin(angle-.48);
  const xB=x2-6*Math.cos(angle+.48), yB=y2-6*Math.sin(angle+.48);
  return `<path d="M${x1} ${y1}L${x2} ${y2}M${xA} ${yA}L${x2} ${y2}L${xB} ${yB}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
}

function packet(x,y,angle,color,phase,length=22) {
  const points=Array.from({length:19},(_,index)=>{
    const u=index/18;
    const excursion=2.7*Math.sin(Math.PI*u)*Math.sin(u*6*Math.PI+phase);
    return `${index?'L':'M'}${((u-.5)*length).toFixed(1)} ${excursion.toFixed(1)}`;
  }).join('');
  return `<path d="${points}" transform="translate(${x} ${y}) rotate(${angle*180/Math.PI})"
    fill="none" stroke="${color}" stroke-linecap="round" stroke-width="2.8"/>`;
}

function spectrumStrips(layout) {
  const {left,right,barWidth,barY,barHeight,compact}=layout;
  const leftCenter=left+barWidth/2, rightCenter=right+barWidth/2;
  const labels=compact
    ? text(leftCenter,17,'Kontinuerlig',{size:11,weight:700})+text(leftCenter,30,'spekter',{size:11,weight:700})
      +text(rightCenter,17,'Absorpsjons-',{size:11,weight:700})+text(rightCenter,30,'spekter',{size:11,weight:700})
    : text(leftCenter,26,'Kontinuerlig spekter',{weight:700})+text(rightCenter,26,'Absorpsjonsspekter',{weight:700});
  const strips=[left,right].map(x=>`<rect x="${x}" y="${barY}" width="${barWidth}" height="${barHeight}"
    rx="4" fill="url(#sld-rainbow)" stroke="var(--ink,#20352e)" stroke-opacity=".3"/>`).join('');
  const darkY=wavelengthY(layout,sodiumWavelength);
  return `<defs><linearGradient id="sld-rainbow" x1="0%" x2="0%" y1="0%" y2="100%">
    <stop offset="0" stop-color="#652c9d"/><stop offset=".1" stop-color="#7540ce"/>
    <stop offset=".22" stop-color="#2e68e9"/><stop offset=".3" stop-color="#23b7e2"/>
    <stop offset=".4" stop-color="#43ac61"/><stop offset=".49" stop-color="#e4d745"/>
    <stop offset=".53" stop-color="#ffd056"/><stop offset=".62" stop-color="#f18642"/>
    <stop offset=".73" stop-color="#e9524d"/><stop offset="1" stop-color="#8c1d35"/>
  </linearGradient></defs>${labels}${strips}
  <path d="M${right} ${darkY}h${barWidth}" stroke="#201a12" stroke-width="4" opacity=".87" data-spectrum-detail="absorption-line"/>
  ${text(rightCenter,barY+barHeight+17,'≈ 589 nm',{size:compact?10:12,muted:true})}`;
}

function gasChamber(layout) {
  const {gasX,gasY,gasWidth,gasHeight,center,compact}=layout;
  const particles=[[.20,.21],[.77,.20],[.22,.63],[.76,.73],[.37,.85]].map(([u,v])=>
    `<circle cx="${gasX+u*gasWidth}" cy="${gasY+v*gasHeight}" r="${compact?5:7}" fill="#f7c76a"
    fill-opacity=".25" stroke="#b27b2a" stroke-opacity=".36"/>`).join('');
  return `${text(center,26,'Natriumgass',{size:compact?12:15,weight:700})}
    <rect x="${gasX}" y="${gasY}" width="${gasWidth}" height="${gasHeight}" rx="13"
      fill="var(--surface,#fff)" stroke="var(--muted,#52685f)" stroke-opacity=".42"/>
    <rect x="${gasX+5}" y="${gasY+5}" width="${gasWidth-10}" height="${gasHeight-10}"
      rx="10" fill="#eab96a" opacity=".11"/>${particles}`;
}

function beamPaths(layout,seconds) {
  const {left,right,barWidth,center}=layout;
  return beamSamples.map(({nm,color},index)=>{
    const y=wavelengthY(layout,nm), start=left+barWidth+2, target=right-2;
    if(nm===sodiumWavelength) {
      return `<path d="M${start} ${y}H${center}" stroke="${color}" stroke-width="2.5" opacity=".75" data-spectrum-detail="incident-resonance"/>
        <path d="M${center} ${y}H${target}" stroke="${color}" stroke-width="1.2" opacity=".25" data-spectrum-detail="weak-transmission"/>`;
    }
    const x=mix(start+9,target-9,(seconds*.72+index*.17)%1);
    return arrow(start,y,target,y,color,{width:1.6,opacity:.48})+packet(x,y,0,color,seconds*10,14);
  }).join('');
}

const reemissionAngles=[-1.01,1.09,-2.2,.35,2.29,-.68];
function sodiumEvent(layout,seconds) {
  const {left,barWidth,center,outDistance,compact}=layout;
  const cycle=3.7, event=Math.floor(seconds/cycle), phase=seconds%cycle, y=wavelengthY(layout,sodiumWavelength);
  const atomRadius=compact?13:17;
  const incoming=phase<.85;
  const occupation=smooth((phase-.82)/.27)*(1-smooth((phase-1.78)/.27));
  const resonanceColor='#d39524';
  const directions=[-1.02,1.12,-2.21].map(angle=>
    arrow(center+(atomRadius+3)*Math.cos(angle),y+(atomRadius+3)*Math.sin(angle),
      center+outDistance*Math.cos(angle),y+outDistance*Math.sin(angle),resonanceColor,{opacity:.48})
  ).join('');
  const absorption=incoming
    ? `<g data-spectrum-detail="incoming-photon">${packet(mix(left+barWidth+10,center-atomRadius,.94*unit(phase/.85)),y,0,yellow,seconds*15)}</g>`
    : '';
  const release=(phase-1.78)/1.45;
  const angle=reemissionAngles[event%reemissionAngles.length];
  const radius=mix(atomRadius+3,outDistance,unit(release));
  const emission=release>=0&&release<1
    ? `<g data-spectrum-detail="reemitted-photon" opacity="${Math.min(1,(1-release)*3)}">${packet(center+radius*Math.cos(angle),y+radius*Math.sin(angle),angle,yellow,seconds*15)}</g>`
    : '';
  const atom=`<circle cx="${center}" cy="${y}" r="${atomRadius+7*occupation}" fill="#f8c243" opacity="${.55*occupation}"/>
    <circle cx="${center}" cy="${y}" r="${atomRadius}" fill="#764b10" stroke="#edb54d" stroke-width="2"/>
    <text x="${center}" y="${y+4}" text-anchor="middle" fill="#fff5de" font-size="${compact?11:13}" font-weight="700">Na</text>`;
  return {occupation,markup:directions+atom+absorption+emission};
}

function energyInset(layout,occupation) {
  const {center,upper,lower,compact}=layout, half=compact?66:88;
  const baseline='var(--muted,#51685e)';
  const bands=[upper,lower].map(y=>`<path d="M${center-half} ${y}h${half*2}" stroke="${baseline}" stroke-width="1.2"/>`).join('');
  const upperLabel=text(center+half+7,upper+3,compact?'Høyere':'Høyere nivå',{size:compact?10:12,anchor:'start',muted:true});
  const lowerLabel=text(center+half+7,lower+3,compact?'Lavere':'Lavere nivå',{size:compact?10:12,anchor:'start',muted:true});
  const arrowLeft=center-32, arrowRight=center+32, captionY=lower+19;
  const arrowUp=arrow(arrowLeft,lower-1,arrowLeft,upper+2,'#c58a1b',{width:2.1});
  const arrowDown=arrow(arrowRight,upper+1,arrowRight,lower-2,'#c58a1b',{width:2.1});
  return `${text(center,upper-15,'Energisprang i natrium',{size:compact?12:14,weight:700})}${bands}${upperLabel}${lowerLabel}
    ${arrowUp}${arrowDown}
    <circle cx="${center}" cy="${mix(lower,upper,occupation)}" r="5.4" fill="#26769e" stroke="#ebf6fa" stroke-width="1.5" data-spectrum-detail="electron"/>
    ${text(arrowLeft-12,captionY,'Absorpsjon',{size:compact?10:12,muted:true})}
    ${text(arrowRight+12,captionY,'Emisjon',{size:compact?10:12,muted:true})}`;
}

export function absorptionDetailGraphic({width,time}) {
  const layout=layoutFor(width), {height,center,gasY,gasHeight,compact}=layout;
  const seconds=Math.max(0,Number.isFinite(time)?time:0);
  const sodium=sodiumEvent(layout,seconds);
  const markup=`<title>Absorpsjon i natriumgass</title>
    <desc>Kontinuerlig lys går gjennom natriumgass. Ved omtrent 589 nanometer tar et atom opp et foton og elektronet går til et høyere energinivå.
    Når elektronet faller ned igjen, avgis ett foton som kan gå i ulike retninger. Ved 589 nanometer kommer mindre lys rett frem, og det danner en mørk linje.</desc>
    ${gasChamber(layout)}${beamPaths(layout,seconds)}${spectrumStrips(layout)}${sodium.markup}
    ${text(center,gasY+gasHeight+16,'Lys sendes ut i ulike retninger',{size:compact?10:12,muted:true})}
    ${energyInset(layout,sodium.occupation)}`;
  return {markup,viewBox:`0 0 ${layout.width} ${height}`};
}
