import {recognitionFigure} from './recognition-figures.js?v=20261031-8';
import {appliedFigure} from './applied-figures.js?v=20261031-8';
import {foodFigure} from './food-figures.js?v=20261031-8';

// Original didactic SVG models. Labels and descriptions do not reveal the answers.
const svg=(description,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 205" role="img" aria-label="${description}"><g font-family="system-ui,sans-serif" font-size="16" fill="#284c3b">${body}</g></svg>`;
const hex=(x,y)=>`<path d="M${x-17} ${y}l8-14h18l8 14-8 14h-18Z" fill="#c7dbb9" stroke="#52764c" stroke-width="2"/>`;
const chain=(points,offset=0)=>`<polyline points="${points.map(p=>p.join(',')).join(' ')}" stroke="#718e68" stroke-width="4" fill="none"/>${points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="8" fill="${(i+offset)%2?'#d5ad77':'#a2c28d'}" stroke="#58734e"/>`).join('')}`;
function legacyFigure(key) {
  if(key==='sugars') return `<figure class="mini-figure">${svg('A: én sekskant. B: to sammenbundne sekskanter. C: mange sammenbundne sekskanter og prikker som viser at kjeden fortsetter.', `<text x="80" y="50">A</text>${hex(87,105)}<text x="245" y="50">B</text><path d="M222 105h48" stroke="#52764c" stroke-width="3"/>${hex(222,105)}${hex(270,105)}<text x="470" y="50">C</text><path d="M390 105h228" stroke="#52764c" stroke-width="3"/>${[390,433,476,519,562].map(x=>hex(x,105)).join('')}<text x="618" y="109">…</text>`)}<figcaption>Forenklede modeller. Én sekskant = én sukkerenhet.</figcaption></figure>`;
  if(key==='protein') return `<figure class="mini-figure">${svg('Start: en foldet, sammenhengende kjede med åtte sirkler. A: de samme åtte sirklene i én utstrakt kjede. B: de åtte sirklene fordelt på tre atskilte kjedebiter.', `<text x="42" y="37">Start</text>${chain([[42,85],[69,70],[91,88],[77,113],[48,117],[47,145],[77,160],[103,143]])}<path d="M135 105H180m-8-6 8 6-8 6" fill="none" stroke="#718e68" stroke-width="2"/><text x="210" y="37">A</text>${chain(Array.from({length:8},(_,i)=>[202+i*18,100+(i%2)*12]))}<text x="420" y="37">B</text>${chain([[421,100],[440,112],[459,100]])}${chain([[497,100],[516,112],[535,100]],3)}${chain([[573,100],[592,112]],6)}`)}<figcaption>Sirklene viser aminosyrer. Strekene viser bindingene i kjeden.</figcaption></figure>`;
  if(key==='energy') return `<figure class="mini-figure">${svg('Masse per porsjon: karbohydrat 12 gram, fett 8 gram, protein 5 gram. Stolpene viser masse, ikke energi.',`<text x="20" y="27">Masse i porsjonen</text>${[['Karbohydrat',12],['Fett',8],['Protein',5]].map(([name,n],i)=>`<text x="20" y="${66+i*49}">${name}</text><rect x="160" y="${46+i*49}" width="${n*31}" height="28" rx="3" fill="#92b780"/><text x="${172+n*31}" y="${66+i*49}">${n} g</text>`).join('')}`)}<figcaption>Stolpene viser gram. Bruk energifaktorene i oppgaven.</figcaption></figure>`;
  return '';
}

// Original structure models. Only the atom/bond information needed by the task is shown.
const ink='#253c34', green='#426a58';
const line=(x1,y1,x2,y2,more='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="2" ${more}/>`;
const txt=(x,y,t,size=18,more='')=>`<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" fill="${ink}" ${more}>${t}</text>`;
const structural=(alt,body,caption='',height=250,width=660)=>`<figure class="mini-figure structure-figure"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${alt}"><g font-family="system-ui,sans-serif">${body}</g></svg>${caption?`<figcaption>${caption}</figcaption>`:''}</figure>`;
const cardLabel=(x,t,y=25)=>txt(x,y,t,20,'font-weight="650"');
const atom=(x,y,label='C',size=18)=>`<rect x="${x-label.length*size*.30}" y="${y-size*.69}" width="${label.length*size*.60}" height="${size*.99}" fill="#fff"/>`+txt(x,y+size*.30,label,size);
function bond(x1,y1,x2,y2,order=1){
 const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
 const a=[x1+ux*10,y1+uy*10],b=[x2-ux*10,y2-uy*10];
 return order===2?line(a[0]-uy*3,a[1]+ux*3,b[0]-uy*3,b[1]+ux*3)+line(a[0]+uy*3,a[1]-ux*3,b[0]+uy*3,b[1]-ux*3):line(...a,...b);
}
function substituent(x,y,label,direction,distance=34){
 const yy=y+direction*distance;return bond(x,y,x,yy)+atom(x,yy,label,15);
}
function sugarRing(cx,name,galactose=false){
 // Six ring members: five C and one O. CH2OH supplies carbon number six.
 const v=[[cx+59,145],[cx+32,190],[cx-32,190],[cx-59,145],[cx-32,100],[cx+32,100]];
 let s=cardLabel(cx,name)+v.map((p,i)=>bond(...p,...v[(i+1)%6])).join('');
 s+=v.map(([x,y],i)=>atom(x,y,i===5?'O':'C',17)).join('');
 const oh=[1,1,-1,galactose?-1:1];
 for(let i=0;i<4;i++)s+=substituent(...v[i],'OH',oh[i],i===0?33:35)+substituent(...v[i],'H',-oh[i],i===0?33:30);
 s+=substituent(...v[4],'CH₂OH',-1,37)+substituent(...v[4],'H',1,30);
 return s;
}
function fructoseRing(cx,name){
 // Five ring members: four C and one O; the two CH2OH branches give six C total.
 const v=[[cx+57,146],[cx+34,199],[cx-34,199],[cx-57,146],[cx,105]];
 let s=cardLabel(cx,name)+v.map((p,i)=>bond(...p,...v[(i+1)%5])).join('')+v.map(([x,y],i)=>atom(x,y,i===4?'O':'C',17)).join('');
 s+=substituent(...v[0],'OH',-1,35);
 s+=bond(...v[0],cx+87,185)+atom(cx+87,185,'CH₂OH',14);
 s+=substituent(...v[1],'OH',-1,29)+substituent(...v[1],'H',1,34);
 s+=substituent(...v[2],'OH',1,34)+substituent(...v[2],'H',-1,29);
 s+=substituent(...v[3],'CH₂OH',-1,41)+substituent(...v[3],'H',1,32);
 return s;
}
function atomChain(points,{doubleAt=-1,acid=true,size=18,hydrogenLength=29,markBonds=false,firstExternal=false}={}){
 let s='';
 points.slice(0,-1).forEach(([x,y],i)=>{s+=bond(x,y,...points[i+1],i===doubleAt?2:1);});
 for(let i=0;i<points.length;i++){
  const [x,y]=points[i];
  if(acid&&i===points.length-1){
   s+=bond(x,y,x,y-39,2)+atom(x,y-39,'O',size)+bond(x,y,x+43,y)+atom(x+43,y,'O',size)+bond(x+43,y,x+74,y)+atom(x+74,y,'H',size);
  }else{
   let needed=4-(i>0?(i-1===doubleAt?2:1):firstExternal?1:0)-(i<points.length-1?(i===doubleAt?2:1):0);
   let angles;
   if(i===0){const [nx,ny]=points[1];const a=Math.atan2(ny-y,nx-x);angles=firstExternal?[a-Math.PI/2,a+Math.PI/2]:[a+Math.PI,a-Math.PI/2,a+Math.PI/2];}
   else if(i===points.length-1){const [px,py]=points[i-1];const a=Math.atan2(y-py,x-px);angles=[a,a-Math.PI/2,a+Math.PI/2];}
   else if(needed===1){
    const prev=points[i-1],next=points[i+1];
    const a=[(prev[0]-x)/Math.hypot(prev[0]-x,prev[1]-y)+(next[0]-x)/Math.hypot(next[0]-x,next[1]-y),(prev[1]-y)/Math.hypot(prev[0]-x,prev[1]-y)+(next[1]-y)/Math.hypot(next[0]-x,next[1]-y)];
    angles=[Math.atan2(-a[1],-a[0])];
    if(Math.hypot(...a)<.05)angles=[i===doubleAt?Math.PI/2:-Math.PI/2];
   }else{
    const prev=points[i-1],next=points[i+1],a=Math.atan2(next[1]-prev[1],next[0]-prev[0]);angles=[a-Math.PI/2,a+Math.PI/2];
   }
   for(const a of angles.slice(0,needed)){const hx=x+Math.cos(a)*hydrogenLength,hy=y+Math.sin(a)*hydrogenLength;s+=bond(x,y,hx,hy)+atom(hx,hy,'H',size-2);}
  }
  s+=atom(x,y,'C',size);
 }
 if(markBonds){s+=txt((points[2][0]+points[3][0])/2,points[2][1]-18,'X',16)+txt(points.at(-1)[0]+17,points.at(-1)[1]-25,'Y',16);}
 return s;
}
function fattyAcid(x,y,count=8,kind='sat',spacing=49,scale=1){
 const points=Array.from({length:count},(_,i)=>[x+i*spacing+(kind==='cis'&&i>=3?12:0),y+(kind==='cis'&&(i===2||i===3)?42:0)]);
 return atomChain(points,{doubleAt:kind==='sat'?-1:2,size:18*scale,hydrogenLength:29*scale});
}
function glycerol(){
 const x=75,ys=[88,150,212];let s='';
 ys.slice(0,-1).forEach((y,i)=>s+=bond(x,y,x,ys[i+1]));
 ys.forEach((y,i)=>{s+=atom(x,y,'C',19)+bond(x,y,x-35,y)+atom(x-35,y,'H',16)+bond(x,y,x+45,y)+atom(x+45,y,'O',19)+bond(x+45,y,x+78,y)+atom(x+78,y,'H',16);if(i!==1){const hy=y+(i===0?-35:35);s+=bond(x,y,x,hy)+atom(x,hy,'H',16);}});
 return s;
}
function triglyceride(){
 const x=65,ys=[68,161,254];let s='';
 ys.slice(0,-1).forEach((y,i)=>s+=bond(x,y,x,ys[i+1]));
 ys.forEach((y,i)=>{
  s+=atom(x,y,'C',18)+bond(x,y,x-31,y)+atom(x-31,y,'H',16);
  if(i!==1){const yy=y+(i===0?-31:31);s+=bond(x,y,x,yy)+atom(x,yy,'H',16);}
  s+=bond(x,y,129,y)+atom(129,y,'O',18)+bond(129,y,196,y)+atom(196,y,'C',18)+bond(196,y,196,y-34,2)+atom(196,y-34,'O',18);
  const tail=Array.from({length:5},(_,j)=>[260+j*67,y]);
  s+=bond(196,y,...tail[0])+atomChain(tail,{acid:false,firstExternal:true,size:18,hydrogenLength:26});
 });
 return s;
}
const molecularFigures={
 'sugar-rings':()=>structural('Tre navngitte ringformede strukturformler: A glukose, B fruktose og C galaktose. Bokstavene C, H og O viser atomer; OH og CH₂OH er viste atomgrupper.',sugarRing(110,'A · Glukose')+fructoseRing(330,'B · Fruktose')+sugarRing(550,'C · Galaktose',true),'',270),
 'single-fructose-ring':()=>structural('Fruktose i ringform, merket B. C, H og O viser atomene i molekylet.',fructoseRing(110,'B · Fruktose'),'',270,220),
 'pair-glucose-galactose':()=>structural('To ringformede strukturformler med navn: A glukose og B galaktose.',sugarRing(110,'A · Glukose')+sugarRing(330,'B · Galaktose',true),'',270,440),
 'carb-rings':()=>structural('A har én ring. B har to sammenbundne ringer. C har mange sammenbundne ringer.',cardLabel(80,'A')+hex(80,110)+cardLabel(250,'B')+hex(220,110)+txt(250,116,'O')+hex(280,110)+line(237,110,241,110)+line(259,110,263,110)+cardLabel(485,'C')+[375,418,461,504,547,590].map(x=>hex(x,110)).join('')+[392,435,478,521,564].map(x=>line(x,110,x+9,110)).join('')+txt(626,116,'…'),'Én ring viser én sukkerenhet.',170),
 'glycosidic':()=>structural('To sammenbundne sukkerringer til venstre. Til høyre vises to atskilte sukkerringer. Vann er med ved pilen.',cardLabel(130,'Før')+hex(85,100)+hex(175,100)+line(102,100,119,100)+txt(130,107,'O',22)+line(141,100,158,100)+txt(260,106,'+ H₂O →',23)+cardLabel(465,'Etter')+hex(410,100)+txt(450,107,'+')+hex(505,100),'',170),
 'polysaccharides':()=>{
  const seg=(xs,y)=>xs.map(x=>hex(x,y)).join('')+xs.slice(0,-1).map(x=>line(x+17,y,x+26,y)).join('');
  return structural('Tre navngitte kjedemodeller: A stivelse, B glykogen, C cellulose.',cardLabel(105,'A')+seg([35,78,121,164],105)+line(78,91,78,64)+hex(78,50)+txt(105,171,'Stivelse',18)+cardLabel(328,'B')+seg([245,288,331,374],105)+[245,331,374].map(x=>line(x,91,x,64)+hex(x,50)).join('')+txt(320,171,'Glykogen',18)+cardLabel(554,'C')+seg([475,518,561,604],75)+seg([475,518,561,604],125)+txt(540,171,'Cellulose',18),'Én ring viser én glukoseenhet.',200);
 },
 'amino':()=>structural('NH₂ er forbundet til CH, som har R nedenfor og COOH til høyre. Bokstav A står ved NH₂, B ved COOH og C ved R.',txt(115,115,'H₂N',26)+line(145,108,247,108)+txt(275,115,'CH',26)+line(300,108,399,108)+txt(420,115,'C',26)+line(434,108,510,108)+txt(543,115,'OH',26)+line(416,91,416,56)+line(424,91,424,56)+txt(420,44,'O',25)+line(275,125,275,173)+txt(275,202,'R',26)+txt(115,69,'A',20)+txt(517,69,'B',20)+txt(312,188,'C',20),'',230),
 'dipeptide':()=>structural('Strukturformelen er H₂N–CH₂–C(=O)–NH–CH₂–C(=O)–OH. C–N-forbindelsen mellom C=O og NH er markert X.',txt(56,130,'H₂N',22)+line(82,123,127,123)+txt(151,130,'CH₂',22)+line(177,123,222,123)+txt(237,130,'C',22)+line(232,108,232,71)+line(242,108,242,71)+txt(237,57,'O',22)+line(252,123,310,123,'style="stroke:#b76334;stroke-width:5"')+txt(332,130,'NH',22)+line(357,123,402,123)+txt(427,130,'CH₂',22)+line(451,123,496,123)+txt(513,130,'C',22)+line(508,108,508,71)+line(518,108,518,71)+txt(513,57,'O',22)+line(528,123,575,123)+txt(599,130,'OH',22)+txt(281,100,'X',20),'',200),
 'glycerol-acid':()=>structural('Struktur A er en kjede med tre karbonatomer og tre OH-grupper. Struktur B viser en karbonkjede og en COOH-gruppe. Alle C- og H-atomer er tegnet.',cardLabel(85,'A')+glycerol()+cardLabel(420,'B')+fattyAcid(212,150,7,'sat',48),'',290),
 'triglyceride':()=>structural('En kort vertikal karbonkjede til venstre er forbundet gjennom oksygen til tre atskilte kjeder mot høyre. C-, H- og O-atomer er vist.',triglyceride(),'',310),
 'fat-chains':()=>structural('To fullt uttegnede fettsyrer merket A og B.',cardLabel(330,'A',28)+fattyAcid(69,89,10,'sat',48)+cardLabel(330,'B',191)+fattyAcid(69,225,10,'cis',48),'',330),
 'fat-bonds':()=>{
  const points=Array.from({length:10},(_,i)=>[69+i*48,139]);
  return structural('En fullt uttegnet fettsyre. En binding i karbonkjeden er merket X, og bindingen fra siste C til O over syregruppen er merket Y.',atomChain(points,{doubleAt:2,size:18,hydrogenLength:29,markBonds:true}),'',230);
 },
 'cis-trans':()=>{
  const molecule=(offset,trans)=>{
   const y=offset+104,pts=[[132,offset+53],[204,offset+53],[270,y],[360,y],[426,trans?offset+155:offset+53],[498,trans?offset+155:offset+53]];
   return atomChain(pts,{doubleAt:2,size:18,hydrogenLength:28});
  };
  return structural('To fullt uttegnede fettsyrer merket A og B. C-, H- og O-atomer og bindinger er synlige.',cardLabel(330,'A',25)+molecule(20,false)+cardLabel(330,'B',225)+molecule(220,true),'',440);
 },
 'omega':()=>structural('Én fullt uttegnet fettsyre. C-, H- og O-atomer og bindingene er synlige.',fattyAcid(69,70,10,'cis',48),'',180),
 'hydrolysis-count':()=>structural('Fem sirkler i en sammenhengende kjede over fem atskilte sirkler.',txt(330,29,'Før',18)+[150,240,330,420,510].map((x,i)=>`<circle cx="${x}" cy="75" r="20" fill="#e1ecda" stroke="${green}"/>`+txt(x,82,'ABCDE'[i],18)+(i<4?line(x+20,75,x+70,75):'')).join('')+txt(330,129,'↓',30)+[110,220,330,440,550].map((x,i)=>`<circle cx="${x}" cy="177" r="20" fill="#e1ecda" stroke="${green}"/>`+txt(x,184,'ABCDE'[i],18)).join(''),'Hver sirkel viser én aminosyre.',220)
};
// Historical key now also resolves to the ring-shaped structures; no open-chain alternative exists.
molecularFigures.fischer=molecularFigures['sugar-rings'];
export const nutrientMapSlots=[
 {left:'A',right:'Gir energi'},{left:'B',right:'Karbohydrater'},{left:'C',right:'Disakkarider'},{left:'D',right:'Polysakkarider'},{left:'E',right:'Proteiner'},{left:'F',right:'Fett'},{left:'G',right:'Mettet'},{left:'H',right:'Gir ikke energi'},{left:'I',right:'Mineraler'},{left:'J',right:'Vann'}
];
molecularFigures['nutrient-map']=()=>{
 const box=(x,y,w,label)=>`<rect x="${x}" y="${y}" width="${w}" height="31" rx="4" fill="#f4f7f1" stroke="#8ca391"/>`+txt(x+w/2,y+21,label,15);
 let s='';const join=(x,y,x2,y2)=>line(x,y,x2,y2);
 s+=box(5,147,64,'A')+box(96,49,65,'B')+box(96,147,65,'E')+box(96,245,65,'F');
 s+=box(196,10,128,'Monosakkarider')+box(196,49,128,'C')+box(196,88,128,'D')+box(196,147,128,'Aminosyrer')+box(196,225,128,'G')+box(196,264,128,'Umettet');
 s+=box(393,147,64,'H')+box(503,88,144,'Vitaminer')+box(503,147,144,'I')+box(503,206,144,'J');
 s+=join(69,162,96,64)+join(69,162,96,162)+join(69,162,96,260)+[25,64,103].map(y=>join(161,64,196,y)).join('')+join(161,162,196,162)+[240,279].map(y=>join(161,260,196,y)).join('')+[103,162,221].map(y=>join(457,162,503,y)).join('');
 const wide=structural('Begrepskart med tomme felt A til J. Bare Monosakkarider, Aminosyrer, Umettet og Vitaminer er fylt ut.',s,'',310).replace('structure-figure','structure-figure nutrient-map-figure').replace('<svg ','<svg class="map-wide" ');
 const nbox=(x,y,w,label)=>`<rect x="${x}" y="${y}" width="${w}" height="26" rx="4" fill="#f4f7f1" stroke="#8ca391"/>`+txt(x+w/2,y+18,label,13);
 let narrow='';
 // Keep the energy-giving branches together, with the non-energy group below.
 narrow+=join(51,116,65,48)+join(51,116,65,116)+join(51,116,65,184);
 narrow+=[17,48,79].map(y=>join(109,48,124,y)).join('')+join(109,116,124,116)+[169,200].map(y=>join(109,184,124,y)).join('');
 narrow+=join(51,228,287,228)+[120,210,287].map(x=>join(x,228,x,238)).join('');
 narrow+=nbox(8,103,43,'A')+nbox(65,35,44,'B')+nbox(65,103,44,'E')+nbox(65,171,44,'F');
 narrow+=nbox(124,4,117,'Monosakkarider')+nbox(124,35,117,'C')+nbox(124,66,117,'D')+nbox(124,103,117,'Aminosyrer')+nbox(124,156,117,'G')+nbox(124,187,117,'Umettet');
 narrow+=nbox(8,215,43,'H')+nbox(77,238,86,'Vitaminer')+nbox(180,238,60,'I')+nbox(257,238,60,'J');
 const mobile=`<svg class="map-narrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 270" role="img" aria-label="Samme begrepskart, tilpasset smal skjerm. Tomme felt A til J; bare Monosakkarider, Aminosyrer, Umettet og Vitaminer er fylt ut."><g font-family="system-ui,sans-serif">${narrow}</g></svg>`;
 return wide.replace('</figure>',mobile+'</figure>');
};
molecularFigures['ndla-pepsin']=()=>structural('Søylediagram. Prøve A har pH 2 og enzymaktivitet 8 relative enheter. Prøve B har pH 7 og aktivitet 1 relativ enhet.',line(90,185,610,185)+line(90,185,90,32)+txt(90,22,'Aktivitet',16)+[0,2,4,6,8].map(n=>line(85,185-n*17,90,185-n*17)+txt(65,191-n*17,String(n),15)).join('')+`<rect x="180" y="49" width="100" height="136" fill="#7da795"/><rect x="420" y="168" width="100" height="17" fill="#7da795"/>`+txt(230,42,'8',17)+txt(470,161,'1',17)+txt(230,211,'A: pH 2',17)+txt(470,211,'B: pH 7',17),'',240);
export function figure(key){return foodFigure(key)||recognitionFigure(key)||appliedFigure(key)||(molecularFigures[key]?molecularFigures[key]():legacyFigure(key));}
