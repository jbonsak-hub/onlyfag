// Original atom-and-bond drawings. Descriptions describe what is visible without naming the answer.
const ink = '#253c34';
const line = (x1,y1,x2,y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="2"/>`;
const text = (x,y,value,size=18,weight=400) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="${weight}" fill="${ink}">${value}</text>`;
const atom = (x,y,value='C',size=18) => `<rect x="${x-value.length*size*.30}" y="${y-size*.69}" width="${value.length*size*.60}" height="${size*1.02}" fill="#fff"/>${text(x,y+size*.30,value,size)}`;
function bond(x1,y1,x2,y2,order=1) {
  const length=Math.hypot(x2-x1,y2-y1), ux=(x2-x1)/length, uy=(y2-y1)/length;
  const a=[x1+ux*10,y1+uy*10], b=[x2-ux*10,y2-uy*10];
  return order===2
    ? line(a[0]-uy*3,a[1]+ux*3,b[0]-uy*3,b[1]+ux*3)+line(a[0]+uy*3,a[1]-ux*3,b[0]+uy*3,b[1]-ux*3)
    : line(...a,...b);
}
function group(x,y,value,direction,distance=30,size=18) {
  const yy=y+direction*distance;
  return bond(x,y,x,yy)+atom(x,yy,value,size);
}
function figure(description,body,width,height,caption='') {
  return `<figure class="mini-figure structure-figure recognition-figure"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${description}"><g font-family="system-ui,sans-serif">${body}</g></svg>${caption?`<figcaption>${caption}</figcaption>`:''}</figure>`;
}
function glucose(cx,cy,{linked=false}={}) {
  // Five ring C atoms, one ring O, and one external CH2OH: C6H12O6 when unlinked.
  const v=[[cx+59,cy],[cx+32,cy+45],[cx-32,cy+45],[cx-59,cy],[cx-32,cy-45],[cx+32,cy-45]];
  let drawing=v.map((p,i)=>bond(...p,...v[(i+1)%6])).join('');
  drawing+=v.map(([x,y],i)=>atom(x,y,i===5?'O':'C')).join('');
  const below=[true,true,false,true];
  for(let i=0;i<4;i++) {
    if(!(linked&&i===0)) drawing+=group(...v[i],'OH',below[i]?1:-1,35,17);
    drawing+=group(...v[i],'H',below[i]?-1:1,30,17);
  }
  drawing+=group(...v[4],'CH₂OH',-1,37,17)+group(...v[4],'H',1,30,17);
  return drawing;
}
function sucrose() {
  // The right-hand ring is rotated 180 degrees in the drawing plane, preserving configuration.
  // Its C2 and the left ring's C1 each lose their free OH; one O joins the two anomeric C atoms.
  const v=[[273,150],[296,97],[364,97],[387,150],[330,191]];
  let drawing=glucose(100,132,{linked:true});
  drawing+=v.map((p,i)=>bond(...p,...v[(i+1)%5])).join('');
  drawing+=v.map(([x,y],i)=>atom(x,y,i===4?'O':'C')).join('');
  drawing+=bond(...v[0],243,111)+atom(243,111,'CH₂OH',17);
  drawing+=group(...v[1],'OH',1,29,17)+group(...v[1],'H',-1,34,17);
  drawing+=group(...v[2],'OH',-1,34,17)+group(...v[2],'H',1,29,17);
  drawing+=group(...v[3],'CH₂OH',1,41,17)+group(...v[3],'H',-1,32,17);
  drawing+=bond(159,132,215,235)+bond(215,235,273,150)+atom(215,235,'O',19);
  return drawing;
}
function glycerol() {
  const x=83, ys=[65,130,195];
  let drawing=ys.slice(0,-1).map((y,i)=>bond(x,y,x,ys[i+1])).join('');
  ys.forEach((y,i)=>{
    drawing+=bond(x,y,44,y)+atom(44,y,'H',20);
    drawing+=bond(x,y,134,y)+atom(134,y,'O',21)+bond(134,y,173,y)+atom(173,y,'H',20);
    if(i!==1) drawing+=group(x,y,'H',i===0?-1:1,35,20);
    drawing+=atom(x,y,'C',21);
  });
  return drawing;
}
function aminoAcid(cx,cy,size=20) {
  const nx=cx-58, acid=cx+58, ox=acid+45;
  let drawing=bond(nx,cy,cx,cy)+bond(cx,cy,acid,cy)+bond(acid,cy,acid,cy-45,2);
  drawing+=bond(acid,cy,ox,cy)+bond(ox,cy,ox+33,cy);
  drawing+=bond(nx,cy,nx-35,cy)+group(nx,cy,'H',-1,38,size-2);
  drawing+=group(cx,cy,'H',-1,42,size-2)+group(cx,cy,'H',1,42,size-2);
  drawing+=atom(nx-35,cy,'H',size-2)+atom(nx,cy,'N',size)+atom(cx,cy,'C',size);
  drawing+=atom(acid,cy,'C',size)+atom(acid,cy-45,'O',size);
  drawing+=atom(ox,cy,'O',size)+atom(ox+33,cy,'H',size-2);
  return drawing;
}
function fattyAcid(x,y,count=8,spacing=49,size=20) {
  let drawing='';
  for(let i=0;i<count;i++) {
    const xx=x+i*spacing;
    if(i<count-1) drawing+=bond(xx,y,xx+spacing,y);
    if(i===count-1) {
      drawing+=bond(xx,y,xx,y-39,2)+atom(xx,y-39,'O',size);
      drawing+=bond(xx,y,xx+38,y)+atom(xx+38,y,'O',size)+bond(xx+38,y,xx+69,y)+atom(xx+69,y,'H',size-2);
    } else {
      drawing+=group(xx,y,'H',-1,33,size-2)+group(xx,y,'H',1,33,size-2);
      if(i===0) drawing+=bond(xx,y,xx-32,y)+atom(xx-32,y,'H',size-2);
    }
    drawing+=atom(xx,y,'C',size);
  }
  return drawing;
}
function starch() {
  const xs=[50,130,210,290,370], cy=90;
  const ring=x=>`<path d="M${x-27} ${cy}l13-23h28l13 23-13 23h-28Z" fill="#d5e2ce" stroke="#426a58" stroke-width="2"/>`;
  return xs.map(x=>ring(x)).join('')+xs.slice(0,-1).map(x=>line(x+27,cy,x+53,cy)).join('')+line(397,cy,421,cy)+text(444,98,'…',27);
}

const figures={
  'recognition-glycerol':()=>figure('Tre C-atomer i en loddrett kjede. Hvert C er forbundet til O og H på høyre side; alle C-, H- og O-atomer er tegnet.',glycerol(),215,260),
  'recognition-fatty-acid':()=>figure('Åtte C-atomer i en kjede. Det siste C-atomet er dobbeltbundet til O og enkeltbundet til O og H. Alle H-atomer i kjeden er tegnet.',fattyAcid(49,105),480,195),
  'recognition-amino-acid':()=>figure('N med to H er bundet til et C med to H. Dette C-atomet er også bundet til C med en dobbeltbinding til O og en enkeltbinding til O og H.',aminoAcid(132,115,24),300,215),
  'recognition-glucose':()=>figure('Én ring med fem C-atomer og ett O-atom. OH- og H-grupper er vist rundt ringen, og CH₂OH er vist utenfor den.',glucose(110,130),230,250),
  'recognition-sucrose':()=>figure('En seksleddet ring og en femleddet ring er forbundet via ett O-atom. Atomene C og O og gruppene H, OH og CH₂OH er vist.',sucrose(),430,270),
  'recognition-starch':()=>figure('Fem sammenbundne ringmodeller danner en kjede. Prikker viser at kjeden fortsetter.',starch(),475,165,'Én ring viser én sukkerenhet. Kjeden fortsetter.'),
  'recognition-mixed-sugar-amino':()=>figure('A er en ring med fem C og ett O, med H, OH og CH₂OH utenfor ringen. B har N med to H, et C med to H og C med O og OH. Ingen stoffnavn er oppgitt.',text(100,25,'A',20,700)+glucose(100,132)+text(330,25,'B',20,700)+aminoAcid(302,143,20),455,245),
  'recognition-mixed-sugar-fat':()=>figure('A er en ring med fem C og ett O, med H, OH og CH₂OH utenfor ringen. B er en kjede med fem C-atomer og en endestilt gruppe med O og OH. Alle H-atomer i kjeden er tegnet.',text(100,25,'A',20,700)+glucose(100,132)+text(325,25,'B',20,700)+fattyAcid(222,132,5,31,20),440,245)
};

export function recognitionFigure(key) {
  return figures[key]?.() || '';
}
