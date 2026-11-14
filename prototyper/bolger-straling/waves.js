import { rainbowSectionHtml, mountRainbow } from './waves-rainbow.js?v=20261114-visual-physics3';

const svg = (id, title, desc, inside, height = 300) => `<svg id="${id}" viewBox="0 0 760 ${height}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${title}</title><desc id="${id}-desc">${desc}</desc>${inside}</svg>`;
const path = (d, color, width=3, extra='') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const txt = (x,y,text,extra='') => `<text x="${x}" y="${y}" ${extra}>${text}</text>`;
const ln = (x1,y1,x2,y2,color='#8c9ba8',extra='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
const arrow = (x1,y1,x2,y2,color='#187b8c') => {
  const a=Math.atan2(y2-y1,x2-x1), s=8;
  return `${ln(x1,y1,x2,y2,color,'stroke-width="2"')}${path(`M${x2-s*Math.cos(a-.45)},${y2-s*Math.sin(a-.45)}L${x2},${y2}L${x2-s*Math.cos(a+.45)},${y2-s*Math.sin(a+.45)}`,color,2)}`;
};
const num=(n,d=2)=>n.toLocaleString('nb-NO',{maximumFractionDigits:d});
const wavePath=(x0,x1,fn,step=2)=>{let d='';for(let x=x0;x<=x1;x+=step)d+=`${x===x0?'M':'L'}${x.toFixed(1)},${fn(x).toFixed(2)}`;return d;};
export function interferenceDisplacement(x,t,lambda1,lambda2,phaseDegrees=0,speed=2){
  return Math.sin(2*Math.PI*(x/lambda1-speed/lambda1*t))+Math.sin(2*Math.PI*(x/lambda2-speed/lambda2*t)+phaseDegrees*Math.PI/180);
}
export function diffractionEnvelope(angle,aperture,lambda){
  const u=Math.PI*aperture/lambda*Math.sin(angle);
  return Math.abs(u)<1e-9?1:Math.abs(Math.sin(u)/u);
}
// Coherent Huygens aperture integral for a monochromatic 2-D scalar field.
// Each aperture element contributes exp(i(kr-π/4))/sqrt(r), with an obliquity
// factor x/r. There is no independent hand-drawn wavefront or angular mask.
// The real/imaginary arrays retain amplitude; only the display is normalized.
export function buildApertureField({aperture=1,wavelength=.8,width=304,height=128,domainWidth=16,wallX=5.3}={}){
  if(!(aperture>0&&wavelength>0))throw new RangeError('Positive aperture and wavelength required');
  const unit=domainWidth/width,domainHeight=height*unit,centerY=domainHeight/2,k=2*Math.PI/wavelength;
  const real=new Float32Array(width*height),imag=new Float32Array(width*height),columnPeak=new Float32Array(width);
  const sourceCount=Math.max(24,Math.min(160,Math.ceil(aperture/Math.min(wavelength/10,unit/2))));
  const sourceStep=aperture/sourceCount,scale=sourceStep*Math.sqrt(k/(2*Math.PI));
  const sourceY=Float64Array.from({length:sourceCount},(_,j)=>centerY-aperture/2+(j+.5)*sourceStep);
  for(let x=0;x<width;x++){
    const physicalX=(x+.5)*unit,dx=physicalX-wallX;
    let maxSquared=0;
    for(let y=0;y<height;y++){
      const idx=y*width+x;
      if(dx<=0){real[idx]=Math.cos(k*dx);imag[idx]=Math.sin(k*dx);maxSquared=1;continue;}
      const physicalY=(y+.5)*unit,positiveX=Math.max(unit/2,dx);let re=0,im=0;
      for(let j=0;j<sourceCount;j++){
        const dy=physicalY-sourceY[j],r=Math.sqrt(positiveX*positiveX+dy*dy);
        const weight=positiveX/(r*Math.sqrt(r)),phase=k*r-Math.PI/4;
        re+=weight*Math.cos(phase);im+=weight*Math.sin(phase);
      }
      re*=scale;im*=scale;real[idx]=re;imag[idx]=im;
      maxSquared=Math.max(maxSquared,re*re+im*im);
    }
    columnPeak[x]=Math.max(.025,Math.sqrt(maxSquared));
  }
  return {width,height,unit,domainWidth,domainHeight,wallX,aperture,wavelength,real,imag,columnPeak,sourceCount};
}
export function scalarWaveValue(field,xIndex,yIndex,time,speed=2,normalized=false){
  const x=Math.max(0,Math.min(field.width-1,Math.round(xIndex))),y=Math.max(0,Math.min(field.height-1,Math.round(yIndex))),idx=y*field.width+x;
  const phase=2*Math.PI*speed/field.wavelength*time;
  return (field.real[idx]*Math.cos(phase)+field.imag[idx]*Math.sin(phase))/(normalized?field.columnPeak[x]:1);
}
export function createSwingState(){return {time:0,drivePhase:0,theta:0,omega:0,amplitude:0,maxAmplitude:0,contact:false,torque:0,work:0};}
export function swingDriveAt(time,theta,omega,pushFrequency=.352,phaseOverride=null){
  const phase=phaseOverride===null?((time*pushFrequency)%1+1)%1:phaseOverride,extension=.22,retraction=.22;
  const smooth=p=>p*p*(3-2*p);
  let targetAngle=-.24;
  if(phase<extension)targetAngle=-.24+.44*smooth(phase/extension);
  else if(phase<extension+retraction)targetAngle=.20-.44*smooth((phase-extension)/retraction);
  const extending=phase<extension;
  const compression=targetAngle-theta;
  const torque=extending&&theta>-.27&&theta<.20&&compression>0?Math.max(0,Math.min(2.3,15*compression-.55*omega)):0;
  return {phase,targetAngle,extending,contact:torque>.0001,torque};
}
// Symplectic integration of the driven, damped nonlinear pendulum. Contact
// torque is unilateral: the father's hand can push, never pull the child.
export function stepDrivenSwing(state,dt,{pushFrequency=.352,length=2,damping=.10,enabled=true}={}){
  const steps=Math.max(1,Math.ceil(Math.max(0,dt)*240)),h=Math.max(0,dt)/steps;
  for(let i=0;i<steps;i++){
    const drive=swingDriveAt(state.time,state.theta,state.omega,pushFrequency,state.drivePhase),force=enabled?drive.torque:0;
    state.omega+=(-9.81/length*Math.sin(state.theta)-damping*state.omega+force)*h;
    state.theta+=state.omega*h;state.time+=h;state.drivePhase=(state.drivePhase+pushFrequency*h)%1;state.work+=force*state.omega*h;
    state.amplitude=Math.max(Math.abs(state.theta),state.amplitude*Math.exp(-h/12));
    state.maxAmplitude=Math.max(state.maxAmplitude,Math.abs(state.theta));
  }
  const drive=swingDriveAt(state.time,state.theta,state.omega,pushFrequency,state.drivePhase);
  state.contact=enabled&&drive.contact;state.torque=enabled?drive.torque:0;return state;
}
export function dopplerAtObserver(sourceX,sourceY,velocityX,observerX,observerY,sourceFrequency=500,soundSpeed=100){
  const dx=observerX-sourceX,dy=observerY-sourceY,distance=Math.hypot(dx,dy);
  const radialVelocity=distance>1e-9?velocityX*dx/distance:0;
  return {frequency:sourceFrequency/(1-radialVelocity/soundSpeed),radialVelocity,distance};
}
const style=`<style>
.wv-scope svg{display:block;width:100%;height:auto;max-height:none;overflow:hidden;background:var(--model-bg,var(--sidebar,#f1f6f7));border-radius:12px}.wv-scope svg text{font:14px system-ui,sans-serif;fill:var(--ink,#273d4a)}.wv-scope svg .wv-small{font-size:12px;fill:var(--muted,#657985)}.wv-scope .wv-live{font-variant-numeric:tabular-nums}.wv-scope .wv-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.wv-scope .wv-buttons{display:flex;gap:7px;flex-wrap:wrap}.wv-scope .wv-buttons button{padding:6px 10px;border:1px solid var(--line,#bcced2);border-radius:7px;background:var(--surface,#fff);color:var(--ink,#273d4a);cursor:pointer;font:inherit;font-size:12px}.wv-scope .wv-buttons button[aria-pressed="true"]{background:#187b8c;color:#fff;border-color:#187b8c}.wv-scope select{max-width:100%;font:inherit}.wv-scope .controls{margin-top:12px}.wv-scope label{display:block}.wv-scope input[type="range"]{width:100%;accent-color:#187b8c}.wv-scope .wv-keyline{margin:12px 0 0;font-size:.92em}.wv-scope .wv-swatch{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px}.wv-scope .wv-legend{display:flex;gap:18px;flex-wrap:wrap;font-size:.88em;margin-top:9px}.wv-scope .wv-summary{padding:10px 12px;border-radius:9px;background:var(--surface,#fff);margin-top:12px}.wv-scope .wv-control-head{display:flex;justify-content:space-between;gap:10px}.wv-scope .wv-control-head output{font-weight:650;white-space:nowrap}.wv-scope .wv-interference-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.wv-scope .wv-interference-controls label{min-width:0}.wv-scope .wv-interference-presets{margin-top:12px}.wv-scope .wv-component-panel{fill:var(--surface,#fff);stroke:var(--line,#dce5de);stroke-width:1}.wv-scope .wv-diff-barrier{fill:#778d97}.wv-scope .wv-field-canvas{display:block;width:100%;height:auto;aspect-ratio:760/340;border-radius:12px;background:#e8f1f3}.wv-field-legend{display:flex;gap:18px;flex-wrap:wrap;font-size:11px;color:var(--muted);margin:9px 0}.wv-field-legend span{display:inline-flex;align-items:center;gap:6px}.wv-field-legend i{width:16px;height:9px;border:1px solid #b5c9d0;border-radius:3px}.wv-scope .wv-check{display:flex;align-items:center;gap:8px;font-size:12px}.wv-scope .wv-check input{width:16px;height:16px}.wv-scope .wv-svg-bubble{fill:var(--surface,#fff);stroke:var(--line,#dce5de)}.wv-scope .wv-cartoon-label{font-size:13px;font-weight:650}.wv-scope .wv-readout-tag{display:block;font-size:11px;color:var(--muted);margin-top:2px}@media(max-width:560px){.wv-scope .wv-grid{grid-template-columns:1fr}.wv-scope .wv-interference-controls{grid-template-columns:1fr 1fr}.wv-scope .wv-interference-controls label:last-child{grid-column:1/-1}.wv-scope svg text{font-size:16px}.wv-scope svg .wv-small{font-size:14px}}
</style>`;
const box=(content)=>`<div class="wv-scope">${content}</div>`;
const range=(id,label,min,max,value,step='1')=>`<label class="control" for="${id}"><span class="wv-control-head"><span>${label}</span><output id="${id}-value"></output></span><input id="${id}" type="range" min="${min}" max="${max}" value="${value}" step="${step}"></label>`;
const select=(id,label,options)=>`<label class="control" for="${id}">${label}<select id="${id}">${options.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label>`;
const colors={wave:'#16879b',amber:'#d28a16',red:'#d75a55',purple:'#8260b4',green:'#398463'};

const phenomena={
  id:'fenomener',title:'Bølgefenomener',kicker:'Sju måter bølger oppfører seg',summary:'Refleksjon, absorpsjon, brytning, interferens, bøyning, resonans og dopplereffekt. Se hva som skjer, og prøv selv.',
  sections:[
    {title:'Refleksjon: bølgen sendes tilbake',body:`${style}<p>Når en bølge treffer en flate og sendes tilbake, får vi <strong>refleksjon</strong>. Vinklene måles fra <strong>innfallsloddet</strong>, som står vinkelrett på flaten. For speilende refleksjon er innfallsvinkelen lik refleksjonsvinkelen.</p>${box(`<div class="model">${svg('wv-reflection','Refleksjon fra et plant speil','Innkommende og reflektert lys danner like store vinkler med innfallsloddet. Endre innfallsvinkelen.','')}<div class="controls">${range('wv-angle','Innfallsvinkel',5,80,40,1)}</div><div id="wv-reflection-readout" class="readout wv-live" aria-live="polite"></div><p class="model-note">Eksempler: et speil, ekko og ekkolodd. Figuren viser en glatt flate; ru flater sender lys tilbake i mange retninger.</p></div>`)}`},
    {title:'Absorpsjon: energien tas opp',body:`<p>Lys som <strong>absorberes</strong>, avgir energi til stoffet, ofte som varme. Andre deler kan reflekteres eller slippe gjennom. En rød flate i hvitt lys reflekterer mye rødt og absorberer mer av de andre fargene.</p>${box(`<div class="model">${svg('wv-absorption','Hva reflekteres og hva absorberes?','Velg lysets farge og en ugjennomsiktig overflate. RGB-komponentene som flaten reflekterer vises, mens resten absorberes.','',260)}<div class="controls wv-grid">${select('wv-light','Belysning',[['white','Hvitt lys'],['red','Rødt lys'],['green','Grønt lys'],['blue','Blått lys']])}${select('wv-surface','Overflate',[['red','Rød'],['green','Grønn'],['blue','Blå'],['white','Hvit'],['black','Svart']])}</div><div id="wv-absorption-readout" class="readout" aria-live="polite"></div><p class="model-note">Forenklet RGB-modell av helt ugjennomsiktige flater: ingen transmisjon. Virkelige flater reflekterer og absorberer bredere bølgelengdeområder.</p></div>`)}`},
    {title:'Brytning: ny fart gir ny retning',body:`<p>En bølge kan endre retning når farten endres i overgangen mellom to medier. Lyset bøyes <strong>mot innfallsloddet</strong> når det går saktere. <strong>Frekvensen er uendret</strong>, så lavere fart gir kortere bølgelengde. Ved rett innfall endres farten uten at retningen endres.</p>${box(`<div class="model">${svg('wv-refraction','Lysbrytning mellom to medier','Endre innfallsvinkel og medier. Stråleretningen følger brytningsloven. Fra glass til luft kan du få totalrefleksjon.','')}<div class="controls wv-grid">${range('wv-refract-angle','Innfallsvinkel',0,80,45,1)}${select('wv-media','Fra → til',[['water','Luft → vann'],['glass','Luft → glass'],['out','Glass → luft']])}</div><div id="wv-refraction-readout" class="readout wv-live" aria-live="polite"></div><p class="model-note">Beregnet med brytningsloven. Stråletykkelsen viser retning, ikke energifordeling. Regnbuer skyldes brytning som avhenger av farge, sammen med refleksjon inne i dråpene.</p></div>`)}`},
    {title:'Interferens: utslagene legges sammen',body:`<p>Bølger kan være på samme sted samtidig. Det samlede utslaget er <strong>summen</strong>. <strong>Konstruktiv interferens</strong> forsterker utslaget; <strong>destruktiv interferens</strong> svekker det. To like bølger i motfase kan slokke hverandre helt ut.</p>${box(`<div class="model">${svg('wv-interference','To bølger og summen av dem','Separate felt viser bølge 1, bølge 2 og summen med samme skala. Bølgene har lik amplitude, frekvens og bølgelengde. Juster faseforskjellen.','',290)}<div class="controls">${range('wv-phase','Faseforskjell',0,360,0,5)}</div><div class="wv-buttons wv-interference-presets" role="group" aria-label="Prøv interferens"><button type="button" id="wv-interference-inphase" data-wv-interference-preset="inphase" aria-pressed="true">Konstruktiv · i fase</button><button type="button" id="wv-interference-antiphase" data-wv-interference-preset="antiphase" aria-pressed="false">Destruktiv · motfase</button></div><div id="wv-interference-readout" class="readout wv-live" aria-live="polite"></div><p class="model-note">Begge har amplitude A og samme bølgelengde og frekvens. 0° og 360°: i fase. 180°: motfase. Prikkene viser de to utslagene og summen ved samme sted.</p></div>`)}`},
    {title:'Bøyning: bølger sprer seg bak en åpning',body:`<p>Bølger kan bre seg inn bak kanter og åpninger. Når bølgelengden er stor i forhold til åpningen, sprer bølgen seg bredt. En åpning som er mange bølgelengder bred, gir en smalere bølge videre med tydeligere skyggesoner.</p>${box(`<div class="model"><canvas id="wv-diffraction" class="wv-field-canvas" width="760" height="340" role="img" aria-label="Animert bølgefelt gjennom en åpning. Turkis viser positivt utslag, blått negativt og lyst nær null. Endre åpning eller bølgelengde for å sammenlikne bred spredning og nesten rett bølgeframdrift.">Bølgefeltet krever støtte for canvas.</canvas><div class="controls wv-grid">${range('wv-slit','Åpningens bredde a',.3,4.2,.5,.1)}${range('wv-diff-lambda','Bølgelengde λ',.3,3.2,1.2,.1)}</div><div class="wv-buttons"><button type="button" id="wv-diff-wide-spread">Bred spredning</button><button type="button" id="wv-diff-narrow-beam">Nesten rett fram</button></div><div id="wv-diffraction-readout" class="readout wv-live" aria-live="polite"></div><div class="wv-field-legend"><span><i style="background:#2d9f9b"></i>Topp (+)</span><span><i style="background:#e8f1f3"></i>Null</span><span><i style="background:#315b9a"></i>Bunn (−)</span></div><p class="model-note">Et sammenhengende bølgefelt beregnes ved å summere bølger fra mange punkter i åpningen (Huygens-prinsippet). Fargene viser relativt utslag og fase; styrken er normalisert i hver loddrette kolonne så svake bølger blir synlige. Modellen viser ikke refleksjonen foran veggen.</p></div>`)}`},
    {title:'Resonans: finn rytmen på huska',body:`<p>Pappa prøver å gi datteren fart på huska. Når dyttene passer med huskas <strong>egenfrekvens</strong>, overføres energi effektivt og utslaget kan bygge seg opp: <strong>resonans</strong>. Feil timing kan gi lite ekstra fart eller bremse bevegelsen. Demping begrenser utslaget.</p>${box(`<div class="model">${svg('wv-resonance','Pappa dytter en jente på huske','En fysisk pendelmodell viser hvordan rytmiske dytt bygger opp svingningen. Pappas hånd gir bare kraft når han faktisk har kontakt. Juster dyttenes frekvens, slå dem av eller start på nytt.','',340)}<div class="controls wv-grid">${range('wv-drive','Pappas dytterytme',.25,.55,.35,.005)}${range('wv-swing-damping','Demping',.04,.22,.10,.01)}<label class="control wv-check"><input id="wv-swing-enabled" type="checkbox" checked>Pappa dytter</label></div><div class="wv-buttons"><button type="button" id="wv-swing-match">Treff egenfrekvensen</button><button type="button" id="wv-swing-reset">Start fra ro</button></div><div id="wv-swing-readout" class="readout wv-live" aria-live="polite"></div><p class="model-note">Huska regnes som en 2 m lang pendel. Den numeriske modellen tar med tyngdekraft, demping og dytt ved håndkontakt. Egenfrekvensen ≈ 0,35 Hz gjelder små utslag; ved store utslag blir perioden litt lengre. Grafen viser den faktiske bevegelsen over tid.</p></div>`)}`},
    {title:'Dopplereffekt: ambulansen passerer',body:`<p>Sirenen sender hele tiden ut samme frekvens. En person som ambulansen nærmer seg, hører <strong>høyere frekvens og lysere tone</strong>. Når ambulansen fjerner seg, høres <strong>lavere frekvens og mørkere tone</strong>. Se hvordan de to personene opplever den samme sirenen forskjellig.</p>${box(`<div class="model">${svg('wv-doppler','Ambulanse og to personer som hører sirenen','En ambulanse sender ut bølgefronter mens den kjører forbi to personer. Snakkebobler viser om hver person hører høyere eller lavere frekvens ut fra bevegelsen mot eller fra personen.','',340)}<div class="controls">${range('wv-source-speed','Kildefart / lydfart',-.6,.6,.35,.05)}</div><div id="wv-doppler-readout" class="readout wv-live" aria-live="polite"></div><p class="model-note">Stillestående luft og mottakere. Frekvensene er beregnet fra kildefartens komponent langs linjen til hver person. Kildens 500 Hz og de viste bølgefrontene har ulik tidsskala så mønsteret blir leselig. Ambulansens fart er overdrevet, men alltid lavere enn lydfarten. Sekvensen gjentas.</p></div>`)}`}
  ],
  terms:[{term:'Refleksjon',definition:'En bølge sendes tilbake fra en flate.'},{term:'Absorpsjon',definition:'Bølgeenergi tas opp i stoffet.'},{term:'Brytning',definition:'Retningsendring når en bølge får ny fart i et annet medium.'},{term:'Interferens',definition:'Bølger overlapper, og utslagene legges sammen.'},{term:'Bøyning',definition:'Bølger sprer seg bak åpninger og kanter.'},{term:'Resonans',definition:'Stor svingeamplitude ved gjentatt påvirkning nær egenfrekvensen.'},{term:'Dopplereffekt',definition:'Mottatt frekvens endres ved relativ bevegelse mellom bølgekilde og mottaker.'},{term:'Innfallslodd',definition:'Linje vinkelrett på flaten i treffpunktet.'}],
  questions:[
    {id:'wv-f1',type:'number',level:'Start',prompt:'En lysstråle treffer et plant speil med innfallsvinkel 35°. Hvor stor er refleksjonsvinkelen, målt fra innfallsloddet?',value:35,tolerance:.1,unit:'°',answer:'Refleksjonsvinkel = innfallsvinkel = <strong>35°</strong>.'},
    {id:'wv-f2',type:'open',level:'Bruk',prompt:'Tegn et plant speil, innfallslodd og en innkommende stråle som lager 30° med selve speilflaten. Tegn den reflekterte strålen, og finn innfallsvinkelen.',answer:'Innfallsloddet står 90° på speilet. Innfallsvinkelen er 90° − 30° = <strong>60°</strong>. Refleksjonsvinkelen er også 60°, på motsatt side av innfallsloddet.'},
    {id:'wv-f3',type:'mcq',level:'Start',prompt:'En ideelt rød, ugjennomsiktig flate belyses bare med blått lys. Hvordan ser den ut i den enkle fargemodellen?',choices:['Rød og lys.','Blå og lys.','Mørk, fordi det blå lyset absorberes.'],correct:2,answer:'Det finnes ikke rødt lys å reflektere. Den ideelle røde flaten absorberer det blå lyset og ser mørk ut. Virkelige overflater er mindre ideelle.'},
    {id:'wv-f4',type:'mcq',level:'Bruk',prompt:'Lys går fra luft til glass og får lavere fart. Hva skjer med frekvens og bølgelengde?',choices:['Begge minker.','Frekvensen er uendret, og bølgelengden blir kortere.','Frekvensen øker, og bølgelengden er uendret.'],correct:1,answer:'Frekvensen bestemmes av kilden og er uendret ved overgangen. Siden λ = v/f, gir lavere fart kortere bølgelengde.'},
    {id:'wv-f5',type:'open',level:'Bruk',prompt:'En blyant står halvveis ned i et glass vann og ser knekt ut sett på skrå. Forklar uten å si at selve blyanten bøyer seg.',answer:'Lys fra den nedsenkede delen endrer fart og retning i overgangen mellom vann og luft. Øyet tolker lyset som om det hadde gått rett fram, slik at den delen ser forskjøvet ut.'},
    {id:'wv-f6',type:'number',level:'Bruk',prompt:'To like bølger med amplitude 3 cm møtes nøyaktig i fase. Hva er amplituden til summen?',value:6,tolerance:.05,unit:'cm',answer:'Utslagene legges sammen: A<sub>sum</sub> = 3 cm + 3 cm = <strong>6 cm</strong>.'},
    {id:'wv-f7',type:'open',level:'Bruk',prompt:'Hvordan kan en hodetelefon dempe støy ved å sende ut mer lyd?',answer:'En mikrofon registrerer støy, og hodetelefonen sender ut lyd med omtrent motsatt utslag ved øret. Destruktiv interferens reduserer det samlede lydtrykket der. Dempingen er ikke like god for alle frekvenser og alle steder.'},
    {id:'wv-f8',type:'mcq',level:'Bruk',prompt:'Bølgelengden holdes uendret. Hva gir tydeligst bøyning gjennom en åpning?',choices:['En åpning som er mange tusen bølgelengder bred.','En åpning på omtrent én bølgelengde.','Åpningens bredde har ingen betydning.'],correct:1,answer:'Bøyning blir særlig tydelig når åpningens bredde er sammenlignbar med bølgelengden eller mindre.'},
    {id:'wv-f9',type:'open',level:'Bruk',prompt:'Du hører noen snakke ute i gangen selv om du ikke kan se personen gjennom døra. Hvorfor er ikke bøyningen like tydelig for synlig lys?',answer:'Lyd har bølgelengder fra centimeter til meter og bøyes derfor merkbart i en døråpning. Synlig lys har bølgelengder på under en tusendels millimeter. Døra er enorm sammenlignet med lysbølgelengden, så bøyningen er svært liten på denne skalaen.'},
    {id:'wv-f10',type:'mcq',level:'Start',prompt:'Når får en huske vanligvis størst utslag av like store, gjentatte dytt?',choices:['Når dyttene følger omtrent huskas egen svingerytme.','Når dyttene kommer så fort som mulig.','Når dyttene alltid kommer på tilfeldige tidspunkt.'],correct:0,answer:'Dyttes huska i riktig rytme og retning, overføres energi effektivt. Dette er resonans. Demping gjør at utslaget ikke vokser uten grense.'},
    {id:'wv-f11',type:'open',level:'Bruk',prompt:'To stemmegafler står nær hverandre. Den ene kan begynne å svinge når du slår på den andre. Hvorfor virker dette best når de har samme egenfrekvens?',answer:'Lydbølgene fra den første påvirker den andre periodisk. Når frekvensen passer med egenfrekvensen, kan den andre ta opp energi effektivt og få merkbar amplitude: resonans.'},
    {id:'wv-f12',type:'mcq',level:'Start',prompt:'En ambulanse kjører mot deg med konstant sirenefrekvens. Hvordan er frekvensen du hører sammenlignet med sirenens egen frekvens?',choices:['Lavere.','Den samme.','Høyere.'],correct:2,answer:'Kilden flytter seg nærmere mellom hver utsendte bølgetopp. Avstanden mellom toppene foran ambulansen blir mindre, så mottatt frekvens øker.'},
    {id:'wv-f13',type:'open',level:'Bruk',prompt:'Absorpsjonslinjene i lyset fra en stjerne er flyttet mot lengre bølgelengder sammenlignet med samme grunnstoff målt i laboratoriet. Hva kaller vi dette, og hva kan det fortelle om bevegelsen?',answer:'Det er <strong>rødforskyvning</strong>. For en stjerne kan det skyldes at stjernen beveger seg fra oss langs synslinjen. For fjerne galakser må universets utvidelse også tas med i forklaringen.'},
    {id:'wv-f14',type:'open',level:'Utfordring',prompt:'Hvor høyt må et plant speil minst være for at du skal kunne se hele kroppen, fra føtter til toppen av hodet? Anta at speilet plasseres riktig og at øynene er punktformede.',answer:'Speilet må være <strong>halvparten av kroppshøyden</strong>. Lyset fra føttene treffer speilet halvveis mellom føttene og øyehøyden; lyset fra toppen treffer halvveis mellom hodetoppen og øyehøyden. Avstanden mellom disse treffpunktene er halve kroppshøyden. Dette er uavhengig av hvor langt fra speilet du står.'}
  ],resources:[{label:'PhET: Brytning av lys',url:'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_all.html'},{label:'PhET: Bølgeinterferens',url:'https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_all.html'}],
  mount(root,api){
    const q=id=>root.querySelector('#'+id), get=id=>Number(q(id).value), layers={};
    const say=(id,lines)=>{const el=q(id),html=(Array.isArray(lines)?lines:[lines]).map(line=>`<div>${line}</div>`).join('');if(el.innerHTML!==html)el.innerHTML=html;};
    ['reflection','absorption','refraction','interference','resonance','doppler'].forEach(id=>{const g=document.createElementNS('http://www.w3.org/2000/svg','g');q('wv-'+id).append(g);layers[id]=g;});
    const fieldCanvas=q('wv-diffraction'),fieldContext=fieldCanvas.getContext('2d',{alpha:false});
    const fieldBuffer=document.createElement('canvas');fieldBuffer.width=304;fieldBuffer.height=128;
    const bufferContext=fieldBuffer.getContext('2d',{alpha:false});
    const fieldImage=bufferContext?bufferContext.createImageData(304,128):null;
    let field=null,fieldKey='',lastFieldTime=-Infinity,forceFieldDraw=true;
    let swing=createSwingState(),lastSwingFrame=null,swingHistory=[],lastSwingSample=-1,lastSwingReadout=-1;
    let lastDopplerReadout='';
    const update=()=>{
      for(const id of ['wv-angle','wv-refract-angle','wv-phase'])q(id+'-value').textContent=num(get(id),0)+'°';
      for(const id of ['wv-slit','wv-diff-lambda'])q(id+'-value').textContent=num(get(id))+' m';
      q('wv-drive-value').textContent=num(get('wv-drive'),3)+' Hz';
      q('wv-swing-damping-value').textContent=num(get('wv-swing-damping'));
      const ratio=get('wv-source-speed');
      q('wv-source-speed-value').textContent=num(Math.abs(ratio)*100,0)+' % '+(ratio>0?'mot høyre':ratio<0?'mot venstre':'(i ro)');
      say('wv-reflection-readout',[`Innfallsvinkel: ${get('wv-angle')}°`,`Refleksjonsvinkel: ${get('wv-angle')}°`]);
      const phase=get('wv-phase');
      const amp=2*Math.abs(Math.cos(phase*Math.PI/360));
      q('wv-interference-readout').innerHTML=`<div><span>Faseforskjell:</span> <strong>${num(phase,0)}°</strong></div><div><span>Summens amplitude:</span> <strong>${num(amp)} · A</strong></div><div><strong>${amp<.01?'Destruktiv: full utslokking':amp>1.99?'Konstruktiv: full forsterkning':'Delvis forsterkning eller svekking'}</strong></div>`;
      root.querySelectorAll('[data-wv-interference-preset]').forEach(button=>{
        const match=button.dataset.wvInterferencePreset==='inphase'?phase%360===0:phase===180;
        button.setAttribute('aria-pressed',String(match));
      });
      const r=get('wv-slit')/get('wv-diff-lambda');
      q('wv-diffraction-readout').innerHTML=`<div><span class="frac"><span class="num">a</span><span class="den">λ</span></span> = <strong>${num(r)}</strong></div><div>${r<=1?'Åpningen er liten i forhold til bølgen: bred spredning.':r>7?'Mange bølgelengder over åpningen: en rettere bølge og sterke skyggesoner.':'Mellomtilfelle: tydelig bøyning ved kantene.'}</div>`;
      forceFieldDraw=true;lastSwingReadout=-1;
      api.repaint();
    };
    root.querySelectorAll('.wv-scope input,.wv-scope select').forEach(el=>el.addEventListener('input',update));
    root.querySelectorAll('[data-wv-interference-preset]').forEach(button=>button.addEventListener('click',()=>{
      q('wv-phase').value=button.dataset.wvInterferencePreset==='antiphase'?'180':'0';
      update();
    }));
    q('wv-diff-wide-spread').addEventListener('click',()=>{q('wv-slit').value='.5';q('wv-diff-lambda').value='1.2';update();});
    q('wv-diff-narrow-beam').addEventListener('click',()=>{q('wv-slit').value='4';q('wv-diff-lambda').value='.3';update();});
    const resetSwing=()=>{swing=createSwingState();swingHistory=[];lastSwingSample=-1;lastSwingReadout=-1;api.repaint();};
    q('wv-swing-reset').addEventListener('click',resetSwing);
    q('wv-swing-match').addEventListener('click',()=>{q('wv-drive').value='.35';q('wv-swing-enabled').checked=true;resetSwing();update();});
    q('wv-swing-enabled').addEventListener('change',()=>{lastSwingReadout=-1;api.repaint();});
    function drawDiffraction(t){
      if(!fieldContext||!bufferContext||!fieldImage)return;
      const key=get('wv-slit')+'|'+get('wv-diff-lambda');
      if(key!==fieldKey){fieldKey=key;field=buildApertureField({aperture:get('wv-slit'),wavelength:get('wv-diff-lambda')});forceFieldDraw=true;}
      if(!forceFieldDraw&&t-lastFieldTime<1/25&&t>=lastFieldTime)return;
      forceFieldDraw=false;lastFieldTime=t;
      const phase=2*Math.PI*2/field.wavelength*t,cp=Math.cos(phase),sp=Math.sin(phase),data=fieldImage.data;
      const zero=[232,241,243],peak=[45,159,155],trough=[49,91,154];
      for(let y=0;y<field.height;y++)for(let x=0;x<field.width;x++){
        const idx=y*field.width+x,u=(field.real[idx]*cp+field.imag[idx]*sp)/field.columnPeak[x],strength=Math.min(1,Math.abs(u)),color=u>=0?peak:trough;
        for(let c=0;c<3;c++)data[idx*4+c]=Math.round(zero[c]+(color[c]-zero[c])*strength);
        data[idx*4+3]=255;
      }
      bufferContext.putImageData(fieldImage,0,0);
      const ctx=fieldContext,rx=14,ry=27,rw=732,rh=rw*field.height/field.width,wall=rx+field.wallX/field.domainWidth*rw,cy=ry+rh/2,half=field.aperture/field.domainHeight*rh/2;
      ctx.fillStyle='#f1f7f8';ctx.fillRect(0,0,760,340);ctx.imageSmoothingEnabled=true;ctx.drawImage(fieldBuffer,rx,ry,rw,rh);
      ctx.fillStyle='#385560';ctx.fillRect(wall-4,ry,8,cy-half-ry);ctx.fillRect(wall-4,cy+half,8,ry+rh-cy-half);
      ctx.strokeStyle='#a8c0c9';ctx.lineWidth=1;ctx.strokeRect(rx+.5,ry+.5,rw-1,rh-1);
      ctx.fillStyle='#244653';ctx.font='13px system-ui,sans-serif';ctx.textAlign='left';ctx.fillText('Innkommende plan bølge',28,18);ctx.fillText('Bølgefelt bak åpningen',wall+30,18);
    }
    function drawSwing(t){
      const dt=lastSwingFrame===null?0:Math.min(.1,Math.max(0,t-lastSwingFrame));lastSwingFrame=t;
      stepDrivenSwing(swing,dt,{pushFrequency:get('wv-drive'),damping:get('wv-swing-damping'),enabled:q('wv-swing-enabled').checked});
      if(swing.time-lastSwingSample>.045||!swingHistory.length){swingHistory.push([swing.time,swing.theta]);lastSwingSample=swing.time;while(swingHistory.length>400)swingHistory.shift();}
      const th=swing.theta,degrees=th*180/Math.PI,pivotX=490,pivotY=48,L=178,seatX=pivotX+L*Math.sin(th),seatY=pivotY+L*Math.cos(th);
      const backX=seatX-12*Math.cos(th)-28*Math.sin(th),backY=seatY+12*Math.sin(th)-28*Math.cos(th);
      const drive=swingDriveAt(swing.time,swing.theta,swing.omega,get('wv-drive'),swing.drivePhase);
      const targetX=pivotX+L*Math.sin(drive.targetAngle)-12*Math.cos(drive.targetAngle)-28*Math.sin(drive.targetAngle),targetY=pivotY+L*Math.cos(drive.targetAngle)+12*Math.sin(drive.targetAngle)-28*Math.cos(drive.targetAngle);
      let handX=swing.contact?backX:targetX,handY=swing.contact?backY:targetY;
      if(!swing.contact&&backX>430&&handX>backX){handX=backX-8;handY=backY+3;}
      if(!q('wv-swing-enabled').checked){handX=432;handY=218;}
      const shoulderX=410,shoulderY=164,dx=handX-shoulderX,dy=handY-shoulderY,dist=Math.max(1,Math.hypot(dx,dy)),bend=Math.sqrt(Math.max(0,49*49-dist*dist/4)),elbowX=(shoulderX+handX)/2-dy/dist*bend,elbowY=(shoulderY+handY)/2+dx/dist*bend;
      const start=Math.max(0,swing.time-12),span=12,hist=swingHistory.filter(p=>p[0]>=start),historyPath=hist.map((p,i)=>`${i?'L':'M'}${44+(p[0]-start)/span*208},${162-p[1]*180/Math.PI*.95}`).join(' ');
      const handColor=swing.contact?'#f2b84d':'#e8b892';
      layers.resonance.innerHTML=`<defs><linearGradient id="wv-swing-sky" x2="0" y2="1"><stop stop-color="#e5f2f4"/><stop offset="1" stop-color="#f6f9ec"/></linearGradient><clipPath id="wv-swing-chart-clip"><rect x="43" y="96" width="211" height="130" rx="4"/></clipPath></defs><rect width="760" height="340" rx="12" fill="url(#wv-swing-sky)"/><path d="M0 293Q180 272 350 293T760 288V340H0Z" fill="#d1e4c5"/><path d="M322 299L382 41H629L691 299" fill="none" stroke="#8a9b98" stroke-width="9" stroke-linecap="round"/><path d="M360 41H648" stroke="#6f8780" stroke-width="12" stroke-linecap="round"/>${ln(pivotX-6,pivotY,seatX-13*Math.cos(th),seatY+13*Math.sin(th),'#637881','stroke-width="2.5"')}${ln(pivotX+6,pivotY,seatX+13*Math.cos(th),seatY-13*Math.sin(th),'#637881','stroke-width="2.5"')}<circle cx="${pivotX}" cy="${pivotY}" r="7" fill="#e8b257"/>
      <rect x="24" y="78" width="246" height="166" rx="12" class="wv-svg-bubble"/>${txt(41,101,'Utslaget bygger seg opp','class="wv-cartoon-label"')}${ln(44,162,252,162,'#c3d1d3')}${txt(41,119,'+40°','class="wv-small"')}${txt(41,224,'−40°','class="wv-small"')}<g clip-path="url(#wv-swing-chart-clip)">${path(historyPath,colors.purple,2.7)}</g>${txt(251,232,'Tid →','text-anchor="end" class="wv-small"')}
      <path d="M391 216L377 283M408 216L427 283" stroke="#425a71" stroke-width="15" stroke-linecap="round"/><path d="M368 287h24m26 0h24" stroke="#354550" stroke-width="10" stroke-linecap="round"/><path d="M383 151Q400 143 416 154L421 219Q399 227 380 216Z" fill="#598c77"/><path d="M388 158L376 192L388 215" fill="none" stroke="#598c77" stroke-width="14" stroke-linecap="round"/><circle cx="402" cy="124" r="19" fill="#e8b892"/><path d="M384 125Q381 98 404 103Q425 105 419 122L413 116 390 117Z" fill="#76604b"/><path d="M393 136q12 10 20-2" fill="none" stroke="#836147" stroke-width="3"/><circle cx="411" cy="124" r="1.8" fill="#34474b"/>
      <path d="M${shoulderX} ${shoulderY}L${elbowX} ${elbowY}L${handX} ${handY}" fill="none" stroke="#e8b892" stroke-width="12" stroke-linecap="round"/><path d="M${shoulderX} ${shoulderY}L${elbowX} ${elbowY}" fill="none" stroke="#598c77" stroke-width="15" stroke-linecap="round"/>
      <g transform="translate(${seatX} ${seatY}) rotate(${-degrees})"><rect x="-22" y="-3" width="45" height="8" rx="4" fill="#956e4a"/><path d="M-9-9L-9 20 1 31M8-9L12 18 24 27" fill="none" stroke="#cfad95" stroke-width="7" stroke-linecap="round"/><path d="M-14-30Q0-40 14-29L17-8H-17Z" fill="#a179b3"/><path d="M-10-26L-18-41M10-26L16-42" stroke="#e7b998" stroke-width="6" stroke-linecap="round"/><circle cx="0" cy="-50" r="13" fill="#efc6a6"/><path d="M-13-48Q-17-68 3-66Q18-65 14-48L8-56-11-55Z" fill="#765641"/><circle cx="-15" cy="-53" r="6" fill="#765641"/><circle cx="15" cy="-53" r="6" fill="#765641"/><circle cx="5" cy="-51" r="1.5" fill="#36464a"/><path d="M3-45q4 4 7-1" fill="none" stroke="#ad7266" stroke-width="1.8"/><path d="M-2 32h11m11-4 10 2" stroke="#775678" stroke-width="6" stroke-linecap="round"/></g>
      <circle cx="${handX}" cy="${handY}" r="6.5" fill="${handColor}"/>${swing.contact?arrow(backX-20*Math.cos(th),backY+20*Math.sin(th),backX+20*Math.cos(th),backY-20*Math.sin(th),colors.amber):''}${txt(490,326,swing.contact?(swing.torque*swing.omega>=0?'Dytt: energi inn!':'Dyttet bremser akkurat nå'):(drive.extending&&q('wv-swing-enabled').checked?'Pappa prøver et dytt …':'Huska svinger videre'),'text-anchor="middle" class="wv-cartoon-label"')}`;
      if(swing.time-lastSwingReadout>.15||lastSwingReadout<0){
        lastSwingReadout=swing.time;
        q('wv-swing-readout').innerHTML=`<div><span>Egenfrekvens:</span> <strong>≈ 0,35 Hz</strong></div><div><span>Pappas rytme:</span> <strong>${num(get('wv-drive'),3)} Hz</strong></div><div><span>Største utslag siden start:</span> <strong>${num(swing.maxAmplitude*180/Math.PI,1)}°</strong></div><div><span>Kontakt nå:</span> <strong>${swing.contact?'Dytter':'Ingen kraft fra hånden'}</strong></div>`;
      }
    }
    function drawDoppler(t){
      const ratio=get('wv-source-speed'),c=100,velocity=ratio*c,dir=ratio<0?-1:1,cycle=ratio?880/Math.abs(velocity):12,local=(t+4)%cycle;
      const sourceX=ratio?(ratio>0?-60:820)+velocity*local:380,sirenX=sourceX-5*dir,sirenY=197;
      const listeners=[[170,155],[590,155]],heard=listeners.map(p=>dopplerAtObserver(sirenX,sirenY,velocity,p[0],p[1]));
      const status=h=>h.radialVelocity>1?'Nærmer seg':h.radialVelocity< -1?'Fjerner seg':'Beveger seg omtrent på tvers';
      const tone=h=>h.radialVelocity>1?'Høyere f → lysere tone':h.radialVelocity< -1?'Lavere f → mørkere tone':'Omtrent samme frekvens';
      const bubble=(x,h)=>`<rect x="${x}" y="12" width="246" height="76" rx="12" class="wv-svg-bubble"/><path d="M${x+120} 88l13 14 6-14" class="wv-svg-bubble"/>${txt(x+123,34,status(h),'text-anchor="middle" class="wv-cartoon-label"')}${txt(x+123,56,tone(h),'text-anchor="middle" class="wv-small"')}${txt(x+123,76,num(h.frequency,0)+' Hz','text-anchor="middle" class="wv-cartoon-label"')}`;
      const person=(x,shirt,skin)=>`<path d="M${x-7} 221l-10 41m20-41 11 41" stroke="#546977" stroke-width="9" stroke-linecap="round"/><path d="M${x-17} 266h13m9 0h13" stroke="#354e58" stroke-width="7" stroke-linecap="round"/><path d="M${x-12} 177q12-6 24 0l5 45h-34Z" fill="${shirt}"/><path d="M${x-12} 182l-12 26m36-26 12 26" stroke="${skin}" stroke-width="7" stroke-linecap="round"/><circle cx="${x}" cy="158" r="15" fill="${skin}"/><path d="M${x-15} 157q-2-23 16-19 17 4 14 19l-9-8-16 3Z" fill="#66574d"/><circle cx="${x+5}" cy="158" r="1.4" fill="#263c48"/><path d="M${x+2} 166q4 3 7-1" fill="none" stroke="#ae7b6b" stroke-width="1.5"/>`;
      let rings='';for(let e=Math.max(0,Math.ceil((local-8)/.45)*.45);e<=local;e+=.45){const radius=c*(local-e),cx=ratio?(ratio>0?-60:820)+velocity*e-5*dir:380;rings+=`<circle cx="${cx}" cy="${sirenY}" r="${radius}" fill="none" stroke="#4a9ba7" stroke-width="2" opacity="${Math.max(.12,.52-radius/1500)}"/>`;}
      const flash=Math.sin(t*10)>0;
      layers.doppler.innerHTML=`<defs><clipPath id="wv-dop-clip"><rect x="8" y="105" width="744" height="205" rx="10"/></clipPath></defs><rect width="760" height="340" rx="12" fill="var(--sidebar,#eef5f3)"/>${bubble(24,heard[0])}${bubble(490,heard[1])}<rect x="8" y="232" width="744" height="77" rx="9" fill="#c3cece"/><path d="M20 288H740" stroke="#f5f6e5" stroke-width="3" stroke-dasharray="25 18"/><g clip-path="url(#wv-dop-clip)">${rings}</g>${person(170,'#8b7aa9','#edc1a1')}${person(590,'#658a74','#ca9b7d')}<g id="wv-ambulance" transform="translate(${sourceX} 242) scale(${dir} 1)"><path d="M-44-8V-35Q-44-44-34-44H10L37-23V16H-44Z" fill="#fafcf8" stroke="#6c8591" stroke-width="2"/><path d="M9-39 29-22H8Z" fill="#8bc3d0"/><path d="M-43-7H36" stroke="#d56660" stroke-width="6"/><rect x="-31" y="-34" width="22" height="20" rx="2" fill="#eef2ee"/><path d="M-20-31v14m-7-7h14" stroke="#d56660" stroke-width="5"/><circle cx="-26" cy="17" r="10" fill="#425967"/><circle cx="24" cy="17" r="10" fill="#425967"/><circle cx="-26" cy="17" r="4" fill="#bdcbd0"/><circle cx="24" cy="17" r="4" fill="#bdcbd0"/><rect x="-16" y="-52" width="13" height="7" rx="2" fill="${flash?'#e66c62':'#acb9bf'}"/><rect x="-3" y="-52" width="13" height="7" rx="2" fill="${flash?'#a2b6c3':'#4c89c4'}"/></g>${txt(170,326,'Person til venstre','text-anchor="middle" class="wv-small"')}${txt(590,326,'Person til høyre','text-anchor="middle" class="wv-small"')}`;
      const readout=`<div><span>Venstre person:</span> <strong>${num(heard[0].frequency,0)} Hz</strong><span class="wv-readout-tag">${tone(heard[0])}</span></div><div><span>Sirenen selv:</span> <strong>500 Hz</strong><span class="wv-readout-tag">Uendret kildefrekvens</span></div><div><span>Høyre person:</span> <strong>${num(heard[1].frequency,0)} Hz</strong><span class="wv-readout-tag">${tone(heard[1])}</span></div>`;
      if(readout!==lastDopplerReadout){lastDopplerReadout=readout;q('wv-doppler-readout').innerHTML=readout;}
    }
    api.onFrame(t=>{
      // Reflection. All angles are measured from the normal.
      let angle=get('wv-angle'),a=angle*Math.PI/180,rad=180,x=380,yy=224;
      const ix=x-rad*Math.sin(a),iy=yy-rad*Math.cos(a),ox=x+rad*Math.sin(a),oy=iy;
      const angleLabelOffset=Math.max(27,83*Math.sin(a/2));
      layers.reflection.innerHTML=`<rect x="50" y="224" width="660" height="16" rx="4" fill="#a5b8c1"/>${ln(x,32,x,224,'#9fb0ba','stroke-dasharray="6 5"')}${txt(x+10,32,'Innfallslodd','class="wv-small"')}${arrow(ix,iy,x,yy,colors.amber)}${arrow(x,yy,ox,oy,colors.wave)}${txt(Math.min(680,ox+10),Math.max(64,oy),'Reflektert','class="wv-small"')}${txt(Math.max(50,ix-10),Math.max(64,iy),'Innkommende','text-anchor="end" class="wv-small"')}${path(`M380,172 A52,52 0 0 0 ${380-52*Math.sin(a)},${224-52*Math.cos(a)}`,colors.amber,2)}${path(`M380,172 A52,52 0 0 1 ${380+52*Math.sin(a)},${224-52*Math.cos(a)}`,colors.wave,2)}${txt(380-angleLabelOffset,224-83*Math.cos(a/2),angle+'°','text-anchor="middle"')}${txt(380+angleLabelOffset,224-83*Math.cos(a/2),angle+'°','text-anchor="middle"')}${txt(380,279,'Speilende flate','text-anchor="middle" class="wv-small"')}`;
      // Ideal opaque RGB surface, no arbitrary energy fractions.
      const light=q('wv-light').value,surface=q('wv-surface').value, keys=['red','green','blue'],cols=['#d75a55','#398463','#4e7fcd'],names={red:'rødt',green:'grønt',blue:'blått'};
      const incident=light==='white'?keys:[light],reflect=incident.filter(c=>surface==='white'||surface===c),absorb=incident.filter(c=>!reflect.includes(c));
      const surfaceColor={red:cols[0],green:cols[1],blue:cols[2],white:'#fff',black:'#29353a'}[surface];
      let rays='';keys.forEach((c,i)=>{const y=93+i*23;if(incident.includes(c)){rays+=arrow(90,y,366,y,cols[i]);if(reflect.includes(c))rays+=arrow(392,y,635,48+i*18,cols[i]);else rays+=arrow(390,y,465,y,cols[i])+'<circle cx="465" cy="'+y+'" r="5" fill="'+cols[i]+'"/>';}});
      layers.absorption.innerHTML=`${txt(90,47,'Innkommende lys')}${txt(622,27,'Reflektert lys','text-anchor="middle"') }<rect x="376" y="72" width="190" height="137" rx="14" fill="${surfaceColor}" stroke="#9cb0ba" stroke-width="2"/>${rays}${txt(471,235,'Ugjennomsiktig flate','text-anchor="middle" class="wv-small"')}`;
      say('wv-absorption-readout',[`Reflektert: ${reflect.length?reflect.map(c=>names[c]).join(', '):'ingen av de valgte lysfargene'}.`,`Absorbert: ${absorb.length?absorb.map(c=>names[c]).join(', '):'ingen i denne idealmodellen'}.`]);
      // Snell's law, including total internal reflection.
      const mode=q('wv-media').value,n1=mode==='out'?1.5:1,n2=mode==='water'?1.33:mode==='glass'?1.5:1,namesMedia=mode==='out'?['Glass','Luft']:mode==='water'?['Luft','Vann']:['Luft','Glass'];
      a=get('wv-refract-angle')*Math.PI/180;let s=n1/n2*Math.sin(a),tir=s>1,theta=tir?null:Math.asin(s);x=380;yy=145;
      let refracted=tir?'':arrow(x,yy,x+140*Math.sin(theta),yy+140*Math.cos(theta),colors.wave);
      layers.refraction.innerHTML=`<rect x="20" y="145" width="720" height="155" fill="${mode==='out'?'#edf3f5':'#dcecf0'}"/>${ln(20,145,740,145,'#8ba8b5')}${ln(380,16,380,285,'#9fb0ba','stroke-dasharray="5 5"')}${txt(40,38,namesMedia[0]+' · n = '+num(n1))}${txt(40,180,namesMedia[1]+' · n = '+num(n2))}${arrow(380-128*Math.sin(a),145-128*Math.cos(a),380,145,colors.amber)}${arrow(380,145,380+128*Math.sin(a),145-128*Math.cos(a),tir?colors.wave:'#a9bdc5')}${refracted}${txt(397,34,'Innfallslodd','class="wv-small"')}${tir?txt(500,240,'Totalrefleksjon','text-anchor="middle"'):txt(560,274,'Brutt stråle','class="wv-small"')}`;
      say('wv-refraction-readout',tir?`Totalrefleksjon: ingen lysstråle går videre ut. Grensevinkelen er ${num(Math.asin(n2/n1)*180/Math.PI,1)}°.`:[`Brytningsvinkel: ${num(theta*180/Math.PI,1)}°`,`Farten blir ${num(n1/n2)} ganger så stor.`,`Bølgelengden blir ${num(n1/n2)} ganger så stor.`,`Frekvensen er uendret.`]);
      // Superposition of two independent wavelengths. Both travel at v = 2 m/s.
      const l1=2,l2=2,phaseDegrees=get('wv-phase'),phase=phaseDegrees*Math.PI/180;
      const worldX=px=>(px-105)/625*10,component=(px,lambda,p)=>Math.sin(2*Math.PI*(worldX(px)/lambda-2/lambda*t)+p);
      const panel=(base,label,c,fn,id)=>`<rect x="12" y="${base-41}" width="736" height="82" rx="8" class="wv-component-panel"/>${txt(26,base+5,label,'class="wv-small"')}${ln(105,base,730,base,'#c2d0d7')}${ln(417.5,base-34,417.5,base+34,'#a8bab9','stroke-dasharray="3 4"')}${path(wavePath(105,730,px=>base-18*fn(px)),c,2.8,`id="${id}"`)}<circle cx="417.5" cy="${base-18*fn(417.5)}" r="4" fill="${c}"/>`;
      layers.interference.innerHTML=panel(47,'Bølge 1',colors.wave,px=>component(px,l1,0),'wv-component-1')+panel(137,'Bølge 2',colors.purple,px=>component(px,l2,phase),'wv-component-2')+panel(227,'Sum',colors.amber,px=>interferenceDisplacement(worldX(px),t,l1,l2,phaseDegrees),'wv-interference-sum')+txt(730,286,'Samme sted x →','text-anchor="end" class="wv-small"');
      drawDiffraction(t);
      drawSwing(t);
      drawDoppler(t);
    });
    mountRainbow(root,api);
    update();
  }
};

phenomena.sections[2].body += rainbowSectionHtml;
export const topics=[phenomena];

