const DEG=Math.PI/180,TAU=2*Math.PI;
const coastSettings={angleDeg:45,slowRatio:.4};
const carSettings={angleDeg:40,slowRatio:.45};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const fmt=(value,digits=1)=>Number(value).toLocaleString('nb-NO',{maximumFractionDigits:digits});
const pt=p=>`${p[0].toFixed(2)},${p[1].toFixed(2)}`;
const path=points=>points.length?'M'+points.map(pt).join('L'):'';
const txt=(x,y,value,extra='')=>`<text x="${x}" y="${y}" ${extra}>${value}</text>`;

/** Direction from the shore normal, for parallel depth contours and a lower wave speed. */
export function shoreAngle(angleDeg,slowRatio){
 if(!(slowRatio>0&&slowRatio<=1))throw new RangeError('The slower speed ratio must be in (0, 1].');
 return Math.asin(slowRatio*Math.sin(angleDeg*DEG))/DEG;
}

/** Eikonal phase: the along-shore wave number is conserved while the cross-shore part increases. */
export function createShoreField(angleDeg=coastSettings.angleDeg,slowRatio=coastSettings.slowRatio){
 shoreAngle(angleDeg,slowRatio);
 const top=-40,bottom=376,deepSpeed=84,period=1.4,omega=TAU/period;
 const kx=omega/deepSpeed*Math.sin(angleDeg*DEG),phase=new Float64Array(bottom-top+1),speed=new Float64Array(phase.length);
 const localSpeed=y=>{const u=clamp((y-145)/170,0,1),smooth=u*u*(3-2*u);return deepSpeed*(1-(1-slowRatio)*smooth);};
 for(let i=0;i<phase.length;i++){
  speed[i]=localSpeed(top+i);
  if(i){const before=Math.sqrt((omega/speed[i-1])**2-kx*kx),after=Math.sqrt((omega/speed[i])**2-kx*kx);phase[i]=phase[i-1]+(before+after)/2;}
 }
 return {top,bottom,deepSpeed,period,omega,kx,phase,speed,angleDeg,slowRatio,finalAngleDeg:shoreAngle(angleDeg,slowRatio)};
}

function shoreY(field,value){
 if(value<0||value>field.phase.at(-1))return null;
 let lo=0,hi=field.phase.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(field.phase[mid]<value)lo=mid;else hi=mid;}
 const fraction=(value-field.phase[lo])/(field.phase[hi]-field.phase[lo]);
 return field.top+lo+fraction;
}

export function shoreWavefronts(field,time,{left=24,right=836,step=5}={}){
 const min=Math.min(field.kx*left,field.kx*right),max=Math.max(field.kx*left,field.kx*right)+field.phase.at(-1);
 const start=Math.floor((min-field.omega*time)/TAU)-1,end=Math.ceil((max-field.omega*time)/TAU)+1,result=[];
 for(let m=start;m<=end;m++){
  const phase=TAU*m+field.omega*time,points=[];
  for(let x=left;x<=right;x+=step){const y=shoreY(field,phase-field.kx*x);if(y!==null)points.push([x,y]);}
  if(points.length>1)result.push(points);
 }
 return result;
}

/** Two freely rolling wheels: one slows at the boundary, producing a constant-curvature turn. */
export function toyCarPlan({angleDeg=40,slowRatio=.45,startX=250,startY=100,boundaryY=245,track=44,fastSpeed=88,finishY=370}={}){
 const finalAngleDeg=shoreAngle(angleDeg,slowRatio),a=angleDeg*DEG,b=finalAngleDeg*DEG;
 const contactY=boundaryY-track/2*Math.abs(Math.sin(a)),firstTime=(contactY-startY)/(fastSpeed*Math.cos(a));
 const first=[startX+fastSpeed*Math.sin(a)*firstTime,contactY];
 const omega=Math.sign(a)*(slowRatio-1)*fastSpeed/track,turnTime=Math.abs(omega)>1e-12?(b-a)/omega:0,meanSpeed=fastSpeed*(1+slowRatio)/2;
 const after=turnTime?[
  first[0]+meanSpeed/omega*(Math.cos(a)-Math.cos(b)),
  first[1]+meanSpeed/omega*(Math.sin(b)-Math.sin(a))
 ]:first;
 const slowSpeed=fastSpeed*slowRatio,finishTime=firstTime+turnTime+(finishY-after[1])/(slowSpeed*Math.cos(b));
 return {angleDeg,finalAngleDeg,slowRatio,startX,startY,boundaryY,track,fastSpeed,slowSpeed,finishY,firstTime,first,omega,turnTime,meanSpeed,after,finishTime,duration:finishTime+1.25};
}

export function toyCarState(time,options={}){
 const p=toyCarPlan(options),a=p.angleDeg*DEG,b=p.finalAngleDeg*DEG,t=clamp(time,0,p.finishTime);
 let x,y,angle,phase;
 if(t<p.firstTime){angle=a;x=p.startX+p.fastSpeed*Math.sin(a)*t;y=p.startY+p.fastSpeed*Math.cos(a)*t;phase='fast';}
 else if(t<p.firstTime+p.turnTime){const dt=t-p.firstTime;angle=a+p.omega*dt;x=p.first[0]+p.meanSpeed/p.omega*(Math.cos(a)-Math.cos(angle));y=p.first[1]+p.meanSpeed/p.omega*(Math.sin(angle)-Math.sin(a));phase='turning';}
 else{const dt=t-p.firstTime-p.turnTime;angle=b;x=p.after[0]+p.slowSpeed*Math.sin(b)*dt;y=p.after[1]+p.slowSpeed*Math.cos(b)*dt;phase='slow';}
 const half=p.track/2,side=[Math.cos(angle),-Math.sin(angle)];
 const positive=[x+side[0]*half,y+side[1]*half],negative=[x-side[0]*half,y-side[1]*half];
 return {x,y,angleDeg:angle/DEG,phase,positive,negative,positiveSlow:positive[1]>=p.boundaryY-1e-7,negativeSlow:negative[1]>=p.boundaryY-1e-7,finished:time>=p.finishTime,plan:p};
}

function arrow(from,to,color='#245f71',width=3){
 const length=Math.hypot(to[0]-from[0],to[1]-from[1]),dx=(to[0]-from[0])/length,dy=(to[1]-from[1])/length;
 const back=[to[0]-10*dx,to[1]-10*dy],side=[-dy*5,dx*5];
 return `<path d="${path([from,to])}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/><path d="${path([[back[0]+side[0],back[1]+side[1]],to,[back[0]-side[0],back[1]-side[1]]])}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function coastScene(time,field){
 const {top,bottom,angleDeg,finalAngleDeg}=field,waterHeight=bottom-top;
 const waves=shoreWavefronts(field,time),far=angleDeg*DEG,near=finalAngleDeg*DEG;
 let out=`<title>Bølger dreier når vannet blir grunnere</title><desc>Ovenfra: skrå bølgefronter går mot en rett strand. Lavere bølgefart i grunnere vann dreier bølgene mot normalen; frontene blir mer parallelle med stranden.</desc><defs><linearGradient id="re-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#80b4ce"/><stop offset=".48" stop-color="#acd5df"/><stop offset="1" stop-color="#d9eee7"/></linearGradient><clipPath id="re-water"><rect x="24" y="${top}" width="812" height="${waterHeight}" rx="8"/></clipPath></defs>`;
 out+=`<rect x="24" y="${top}" width="812" height="${waterHeight+42}" rx="10" fill="#e9d9b6"/><rect x="24" y="${top}" width="812" height="${waterHeight}" rx="8" fill="url(#re-sea)"/><path d="M24 376H836" stroke="#c8b28a" stroke-width="4"/>`;
 out+=`<g clip-path="url(#re-water)">${waves.map(points=>`<path d="${path(points)}" fill="none" stroke="#f9ffff" stroke-width="7" opacity=".42"/><path d="${path(points)}" fill="none" stroke="#287f98" stroke-width="2.4" opacity=".9"/>`).join('')}</g>`;
 out+=`<path d="M475 ${top+14}V370" stroke="#3d6372" stroke-width="1.8" stroke-dasharray="6 7" opacity=".8"/>`;
 out+=`<rect x="44" y="${top+15}" width="175" height="36" rx="7" fill="#f7fcff" fill-opacity=".94"/>${txt(58,top+39,'Dypere vann','font-weight="650"')}`;
 out+=`<rect x="590" y="313" width="226" height="36" rx="7" fill="#f7fcff" fill-opacity=".94"/>${txt(604,337,'Grunnere vann: lavere fart','class="re-small"')}`;
 out+=arrow([266,45],[266+65*Math.sin(far),45+65*Math.cos(far)]);
 out+=arrow([562,270],[562+65*Math.sin(near),270+65*Math.cos(near)]);
 out+=txt(493,top+34,'Normal','class="re-small"');
 out+=txt(430,405,'Strand','text-anchor="middle" font-weight="650"');
 out+=txt(430,453,'Bølgefrontene blir mer parallelle med stranden','class="re-caption" text-anchor="middle" font-weight="650"');
 return out;
}

function carScene(time,{angleDeg,slowRatio}){
 const plan=toyCarPlan({angleDeg,slowRatio}),local=time%plan.duration,state=toyCarState(local,{angleDeg,slowRatio});
 const history=[];for(let i=0;i<=90;i++){const t=Math.min(local,plan.finishTime)*i/90,s=toyCarState(t,{angleDeg,slowRatio});history.push([s.x,s.y]);}
 const projection=[plan.first[0]+(416-plan.first[1])*Math.tan(angleDeg*DEG),416];
 const firstWheel=angleDeg>=0?state.negative:state.positive;
 const description=state.phase==='fast'?'Begge hjul ruller like fort.':state.phase==='turning'?'Ett hjul bremses først – bilen dreier.':'Begge hjul på teppet: ny retning og lavere fart.';
 let out=`<title>En lekebil ruller skrått inn på et teppe</title><desc>Ovenfra: hjulet som møter teppet først ruller saktere. Forskjellen mellom hjulenes hastigheter dreier bilen mot normalen. Deretter ruller begge hjul saktere og bilen fortsetter rett fram.</desc><defs><pattern id="re-carpet" width="11" height="11" patternUnits="userSpaceOnUse"><rect width="11" height="11" fill="#bca3ce"/><path d="M0 3H11M3 0V11" stroke="#d7c4e3" stroke-width="1.4" opacity=".65"/></pattern><clipPath id="re-floor"><rect x="24" y="47" width="812" height="372" rx="10"/></clipPath></defs>`;
 out+=`<g clip-path="url(#re-floor)"><rect x="24" y="47" width="812" height="372" fill="#edf0eb"/><rect x="24" y="${plan.boundaryY}" width="812" height="180" fill="url(#re-carpet)"/><path d="M24 ${plan.boundaryY}H836" stroke="#856e99" stroke-width="3"/><path d="M${plan.first[0].toFixed(2)} 62V414" stroke="#677f7b" stroke-dasharray="6 7" stroke-width="1.8"/><path d="${path([plan.first,projection])}" stroke="#82978e" stroke-width="1.6" stroke-dasharray="4 7" fill="none" opacity=".6"/><path d="${path(history)}" stroke="#2f8178" stroke-width="3" fill="none" stroke-linecap="round"/>`;
 out+=`<g transform="translate(${state.x.toFixed(2)} ${state.y.toFixed(2)}) rotate(${(-state.angleDeg).toFixed(2)})"><ellipse cx="0" cy="3" rx="30" ry="46" fill="#29483e" opacity=".1"/><path d="M-16-36Q0-42 16-36L18 30Q17 40 8 41H-8Q-17 40-18 30Z" fill="#e4a24c" stroke="#a16e29" stroke-width="1.6"/><path d="M-12 5H12L10 19H-10Z" fill="#b7e3ed" stroke="#7d9eaa" stroke-width="1.5"/><path d="M-10-25H10V-10H-10Z" fill="#bad6df" opacity=".85"/><circle cx="0" cy="-34" r="4" fill="#667d77"/><rect x="17" y="-12" width="10" height="24" rx="4" fill="${state.positiveSlow?'#795191':'#364842'}"/><rect x="-27" y="-12" width="10" height="24" rx="4" fill="${state.negativeSlow?'#795191':'#364842'}"/><path d="M-9 35H-4M4 35H9" stroke="#fff6c4" stroke-width="4" stroke-linecap="round"/></g>`;
 if(state.phase==='turning')out+=`<circle cx="${firstWheel[0].toFixed(2)}" cy="${firstWheel[1].toFixed(2)}" r="19" fill="none" stroke="#f8c76c" stroke-width="3"/>`;
 out+='</g>';
 out+=`<rect x="45" y="64" width="156" height="35" rx="7" fill="#fff" fill-opacity=".93"/>${txt(59,88,'Glatt gulv','font-weight="650"')}`;
 out+=`<rect x="635" y="268" width="176" height="35" rx="7" fill="#fbf7ff" fill-opacity=".95"/>${txt(649,292,'Teppe: lavere fart','class="re-small" font-weight="650"')}`;
 out+=txt(plan.first[0]+13,82,'Normal','class="re-small"');
 out+=arrow([681,123],[681+48*Math.sin(angleDeg*DEG),123+48*Math.cos(angleDeg*DEG)],'#365f56',2.6);
 out+=arrow([694,342],[694+48*Math.sin(plan.finalAngleDeg*DEG),342+48*Math.cos(plan.finalAngleDeg*DEG)],'#634675',2.6);
 out+=txt(430,453,description,'class="re-caption" text-anchor="middle" font-weight="650"');
 return {markup:out,state,local};
}

export function renderPracticalScene(mode,time,settings={}){
 const options={...(mode==='car'?carSettings:coastSettings),...settings};
 return mode==='car'?carScene(time,options).markup:coastScene(time,createShoreField(options.angleDeg,options.slowRatio));
}

const styles=`<style>
.topic-page .re-dialog .model.re-model{margin:0;padding:0;border:0;box-shadow:none;grid-template-columns:minmax(0,1fr) 205px;gap:18px}
.re-model .model-visual{min-width:0}.topic-page .re-model .model-visual svg{display:block;width:100%;height:auto;max-height:none;background:var(--bg,#f3f7f7);border-radius:11px}
.re-model svg text{font-family:system-ui,sans-serif;font-size:16px;fill:#213e46!important}.re-model svg .re-caption{fill:var(--ink,#213e46)!important}.re-model svg .re-small{font-size:14px;fill:#355b65!important}
.topic-page .re-model .model-panel{justify-content:flex-start;border-left:1px solid var(--line,#d9e3dc);padding-left:18px;gap:16px}
.re-reset{font:inherit;font-size:12px;font-weight:600;padding:8px 10px;cursor:pointer;border:1px solid var(--line,#d9e3dc);background:var(--surface,#fff);color:var(--ink,#20352e);border-radius:7px}
.re-car-controls{display:grid;gap:13px}.re-description{font-size:12px;line-height:1.7;margin:0}.re-dialog label{display:block;font-size:12px;line-height:1.6}
.re-control-head{display:flex;justify-content:space-between;gap:9px}.re-control-head output{font-weight:650;white-space:nowrap}.re-dialog input[type=range]{width:100%;margin:7px 0 0;accent-color:var(--green,#236448)}
.re-control-note{display:block;color:var(--muted,#60736b);font-size:11px}.re-readout{font-size:12px;line-height:1.65;padding:10px;background:var(--green-soft,#e6f2e8);border-radius:8px}
.re-readout>div+div{margin-top:8px}.re-source{font-size:11px;line-height:1.5;color:var(--muted,#60736b)}
.re-question{margin-top:16px;padding:15px clamp(12px,3vw,20px);border:1px solid var(--line,#d9e3dc);border-radius:11px;background:var(--bg,#eff3f0)}
.re-question h3{margin:0 0 11px;font-size:14px}.re-answer-rows{display:flex;flex-wrap:wrap;gap:12px 25px}.re-answer-row{min-width:0;padding:0;margin:0;border:0}
.re-answer-row legend{margin-bottom:4px;padding:0;color:var(--ink,#20352e);font-size:13px;font-weight:650}.re-options{display:flex;flex-wrap:wrap;gap:5px}
.re-options label{display:inline-flex;align-items:center;gap:5px;min-height:34px;padding:4px 8px;border:1px solid var(--line,#d9e3dc);border-radius:7px;background:var(--surface,#fff);color:var(--ink,#20352e);cursor:pointer}
.re-options label:has(input:checked){background:var(--green-soft,#e6f2e8);border-color:var(--green,#236448);font-weight:650}.re-options input{margin:0;accent-color:var(--green,#236448)}
.re-feedback{max-width:70ch;margin:13px 0 1px;padding:10px 12px;border-left:3px solid var(--green,#236448);border-radius:0 7px 7px 0;background:var(--surface,#fff);box-shadow:0 2px 6px #142c2417;font-size:12px;line-height:1.6}
.re-feedback p{margin:0}.re-feedback p+p{margin-top:4px}
@media(max-width:800px){.topic-page .re-dialog .model.re-model{grid-template-columns:1fr}.topic-page .re-model .model-panel{border-left:0;border-top:1px solid var(--line,#d9e3dc);padding:14px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:13px}.re-car-controls,.re-description,.re-readout,.re-source{grid-column:1/-1}.re-model svg text{font-size:18px}.re-model svg .re-small{font-size:16px}}
</style>`;

const shoreChoices=[['down','Minker'],['up','Øker'],['unchanged','Uendret']];
const shoreQuestions=[['frequency','Frekvensen'],['wavelength','Bølgelengden']];
const answerRows=shoreQuestions.map(([name,label])=>`
 <fieldset class="re-answer-row"><legend>${label}</legend><div class="re-options">
 ${shoreChoices.map(([value,answer])=>`<label><input type="radio" name="re-${name}" value="${value}">${answer}</label>`).join('')}
 </div></fieldset>`).join('');

export const refractionExampleHtml=`${styles}<div class="model model--split re-model"><div class="model-visual"><svg id="re-scene" viewBox="0 0 860 470" role="img" aria-label="En lekebil dreier når det første hjulet treffer et teppe"></svg></div>
 <aside class="model-panel" aria-label="Om modellen">
 <p class="re-description" id="re-description"></p>
 <div class="re-car-controls" id="re-car-controls">
 <label for="re-angle"><span class="re-control-head"><span>Innkommende retning</span><output id="re-angle-value" for="re-angle">40°</output></span><input id="re-angle" type="range" min="15" max="60" step="1" value="40"><span class="re-control-note">Vinkel fra normalen</span></label>
 <label for="re-slow"><span class="re-control-head"><span>Fart på teppet</span><output id="re-slow-value" for="re-slow">45 %</output></span><input id="re-slow" type="range" min=".35" max=".75" step=".05" value=".45"><span class="re-control-note">Andel av farten på gulvet</span></label>
 <button type="button" class="re-reset" id="re-restart">Start på nytt</button></div>
 <div class="re-readout" id="re-readout"></div><a class="re-source" id="re-source" href="https://www.txdot.gov/manuals/des/hyd/chapter-15--coastal-hydraulic-design/section-4--waves---currents/waves.html" target="_blank" rel="noopener">Bølger og kyst (TxDOT)</a></aside></div>
 <form class="re-question" id="re-shore-question" aria-labelledby="re-shore-prompt" hidden>
 <h3 id="re-shore-prompt">Bølgefarten synker nærmere land. Hva skjer med frekvensen og bølgelengden?</h3>
 <div class="re-answer-rows">${answerRows}</div><div class="re-feedback" id="re-shore-feedback" role="status" hidden></div></form>`;

export function mountRefractionExample(root,api){
 const q=id=>root.querySelector('#'+id),svg=q('re-scene');
 if(!svg)return ()=>{};
 const listeners=[];const listen=(element,event,fn)=>{element.addEventListener(event,fn);listeners.push(()=>element.removeEventListener(event,fn));};
 const angle=q('re-angle'),slow=q('re-slow'),question=q('re-shore-question'),feedback=q('re-shore-feedback');
 const field=createShoreField();
 let mode='car',lastTime=0,startTime=api.now?.(svg)||0,lastReadout='';
 const setReadout=html=>{if(html!==lastReadout){q('re-readout').innerHTML=html;lastReadout=html;}};
 function render(time){
  lastTime=time;const elapsed=Math.max(0,time-startTime);
  if(mode==='coast'){
   svg.innerHTML=coastScene(elapsed,field);
   setReadout(`<div><strong>${fmt(field.angleDeg,0)}°</strong> fra normalen ute på dypt vann</div><div><strong>${fmt(field.finalAngleDeg)}°</strong> fra normalen nær stranda</div><div>Bølgefarten nær stranda er <strong>${fmt(field.slowRatio*100,0)} %</strong> av farten lenger ute.</div>`);
  }else{
   const opt={angleDeg:Number(angle.value),slowRatio:Number(slow.value)};
   const scene=carScene(elapsed,opt);svg.innerHTML=scene.markup;
   const phase=scene.state.phase==='fast'?'Begge hjul på glatt gulv.':scene.state.phase==='turning'?'Det ene hjulet bremses først.':'Begge hjul på teppet.';
   setReadout(`<div><strong>${fmt(opt.angleDeg,0)}°</strong> før teppet</div><div><strong>${fmt(scene.state.plan.finalAngleDeg)}°</strong> etter overgangen</div><div>${phase}</div>`);
   svg.setAttribute('data-car-phase',scene.state.phase);
  }
  svg.setAttribute('data-example',mode);svg.setAttribute('data-time',elapsed.toFixed(4));
 }
 function updateDescription(){
  const isCoast=mode==='coast';
  q('re-description').textContent=isCoast?'Når en skrå bølgefront nærmer seg stranda, går delen på grunnest vann saktere. Bølgefronten dreier og blir mer parallell med stranda.':'En lekebil kan illustrere brytning. Når bilen kjører skrått inn på et teppe, bremses det ene hjulet før det andre. Da dreier bilen mot normalen og fortsetter i en ny retning.';
  q('re-angle-value').textContent=fmt(Number(angle.value),0)+'°';q('re-slow-value').textContent=fmt(Number(slow.value)*100,0)+' %';
  q('re-car-controls').hidden=isCoast;
  q('re-source').hidden=!isCoast;
  question.hidden=!isCoast;
  svg.setAttribute('viewBox',isCoast?'0 -54 860 524':'0 0 860 470');
  svg.setAttribute('aria-label',isCoast?'Bølgefronter fra dypere vann til stranda':'En lekebil dreier når det første hjulet treffer et teppe');
 }
 function checkShoreAnswer(){
  const frequency=question.querySelector('[name="re-frequency"]:checked');
  const wavelength=question.querySelector('[name="re-wavelength"]:checked');
  if(!frequency||!wavelength)return;
  const correct=frequency.value==='unchanged'&&wavelength.value==='down';
  feedback.hidden=false;
  feedback.innerHTML=`<p><strong>${correct?'Begge svarene stemmer.':'Slik henger det sammen.'}</strong></p><p><strong>Frekvensen er uendret.</strong> Like mange topper passerer hvert sekund.</p><p><strong>Bølgelengden minker.</strong> Toppene går saktere og kommer derfor tettere, selv om det fortsatt går like lang tid mellom dem.</p>`;
 }
 function repaint(){if(api.repaint)api.repaint(svg);else render(lastTime);}
 function restart(){startTime=api.now?.(svg)??lastTime;render(startTime);repaint();}
 function changeMode(next){mode=next;updateDescription();restart();}
 for(const control of [angle,slow])listen(control,'input',()=>{updateDescription();restart();});
 listen(q('re-restart'),'click',restart);
 listen(question,'change',checkShoreAnswer);
 listen(question,'submit',event=>event.preventDefault());
 updateDescription();const removeFrame=api.onFrame(render,svg);
 const dispose=()=>{for(const remove of listeners)remove();if(typeof removeFrame==='function')removeFrame();};
 dispose.selectMode=next=>changeMode(next==='car'?'car':'coast');dispose.restart=restart;return dispose;
}
