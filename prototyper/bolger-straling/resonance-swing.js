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
const colors={wave:'#16879b',amber:'#d28a16',red:'#d75a55',purple:'#8260b4',green:'#398463'};
export function createSwingState(){return {time:0,drivePhase:0,theta:0,omega:0,amplitude:0,maxAmplitude:0,contact:false,torque:0,work:0,charge:0,bonusFired:false,ejection:null};}
export const swingGeometry={pivotX:490,pivotY:48,lengthPx:178,shoulderX:424,shoulderY:164,upperArm:44,forearm:44};
export function swingBackPoint(theta){
  const g=swingGeometry,s=Math.sin(theta),c=Math.cos(theta);
  return {x:g.pivotX+g.lengthPx*s-12*c-28*s,y:g.pivotY+g.lengthPx*c+12*s-28*c};
}
export function solveSwingArm(handX,handY){
  const g=swingGeometry,dx=handX-g.shoulderX,dy=handY-g.shoulderY,requestedDistance=Math.max(1e-9,Math.hypot(dx,dy)),distance=Math.min(g.upperArm+g.forearm-.25,Math.max(8,requestedDistance));
  const wristX=g.shoulderX+dx/requestedDistance*distance,wristY=g.shoulderY+dy/requestedDistance*distance;
  const half=distance/2,bend=Math.sqrt(Math.max(0,g.upperArm*g.upperArm-half*half));
  return {handX:wristX,handY:wristY,elbowX:g.shoulderX+dx/requestedDistance*half-dy/requestedDistance*bend,elbowY:g.shoulderY+dy/requestedDistance*half+dx/requestedDistance*bend,reachable:requestedDistance<=g.upperArm+g.forearm-.25};
}
export function swingDriveAt(time,theta,omega,pushFrequency=.352,phaseOverride=null){
  const phase=phaseOverride===null?((time*pushFrequency)%1+1)%1:phaseOverride,extension=.22,retraction=.22;
  const smooth=p=>p*p*(3-2*p);
  let targetAngle=-.24;
  if(phase<extension)targetAngle=-.24+.44*smooth(phase/extension);
  else if(phase<extension+retraction)targetAngle=.20-.44*smooth((phase-extension)/retraction);
  const extending=phase<extension;
  const compression=targetAngle-theta;
  const back=swingBackPoint(theta),reach=Math.hypot(back.x-swingGeometry.shoulderX,back.y-swingGeometry.shoulderY);
  const reachable=reach<swingGeometry.upperArm+swingGeometry.forearm-1&&back.x>swingGeometry.shoulderX+12;
  const torque=extending&&reachable&&theta>-.24&&theta<.17&&compression>0?Math.max(0,Math.min(2.3,15*compression-.55*omega)):0;
  return {phase,targetAngle,extending,contact:torque>.0001,torque,reachable};
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

export function swingArmPose(theta,targetAngle,enabled=true){
 const handAngle=enabled?Math.max(-.24,Math.min(targetAngle,theta)):-.24;
 const point=swingBackPoint(handAngle);return solveSwingArm(point.x,point.y);
}
export function stepSwingScene(state,dt,{cartoon=true,...options}={}){
 const enabled=options.enabled!==false&&!state.ejection;
 stepDrivenSwing(state,dt,{...options,enabled});
 if(!(dt>0))return state;
 if(state.ejection){const e=state.ejection;if(!e.gone){e.age+=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=210*dt;e.rotation+=160*dt;e.gone=e.x>850||e.y< -200||e.y>600;}return state;}
 const f0=Math.sqrt(9.81/(options.length||2))/(2*Math.PI),effective=f0/(1+state.amplitude**2/16),matched=Math.abs((options.pushFrequency||.352)-effective)<.025;
 if(cartoon&&enabled&&!state.bonusFired)state.charge=matched?Math.min(8,state.charge+dt):Math.max(0,state.charge-dt*1.5);
 if(cartoon&&state.charge>=8&&state.contact&&!state.bonusFired){state.omega+=2.7;state.bonusFired=true;state.contact=false;state.torque=0;}
 if(state.bonusFired&&state.theta>.95&&state.omega>0){const g=swingGeometry,drive=swingDriveAt(state.time,state.theta,state.omega,options.pushFrequency||.352,state.drivePhase),hand=swingArmPose(state.theta,drive.targetAngle,true);state.ejection={age:0,gone:false,armX:hand.handX,armY:hand.handY,x:g.pivotX+g.lengthPx*Math.sin(state.theta),y:g.pivotY+g.lengthPx*Math.cos(state.theta),vx:g.lengthPx*state.omega*Math.cos(state.theta),vy:-g.lengthPx*state.omega*Math.sin(state.theta),rotation:-state.theta*180/Math.PI};state.contact=false;state.torque=0;}
 return state;
}


export function swingSceneArm(state,targetAngle,enabled=true){
 if(!state.ejection)return swingArmPose(state.theta,targetAngle,enabled);
 const e=state.ejection,rest=swingArmPose(state.theta,-.24,false),p=Math.min(1,e.age/.35),mix=p*p*(3-2*p);
 return solveSwingArm(e.armX*(1-mix)+rest.handX*mix,e.armY*(1-mix)+rest.handY*mix);
}

export const resonanceSection={"title":"Resonans: finn rytmen på huska","body":"<p>Pappa prøver å gi datteren fart på huska. Når dyttene passer med huskas <strong>egenfrekvens</strong>, overføres energi effektivt og utslaget kan bygge seg opp: <strong>resonans</strong>. Feil timing kan gi lite ekstra fart eller bremse bevegelsen. Demping begrenser utslaget.</p><div class=\"wv-scope\"><div class=\"model\"><svg id=\"wv-resonance\" viewBox=\"0 0 760 340\" role=\"img\" aria-labelledby=\"wv-resonance-title wv-resonance-desc\"><title id=\"wv-resonance-title\">Pappa dytter en jente på huske</title><desc id=\"wv-resonance-desc\">En fysisk pendelmodell viser hvordan rytmiske dytt bygger opp svingningen. Pappas hånd gir bare kraft når han faktisk har kontakt. Juster dyttenes frekvens, slå dem av eller start på nytt.</desc></svg><div class=\"controls wv-grid\"><label class=\"control\" for=\"wv-drive\"><span class=\"wv-control-head\"><span>Pappas dytterytme</span><output id=\"wv-drive-value\"></output></span><input id=\"wv-drive\" type=\"range\" min=\"0.25\" max=\"0.55\" value=\"0.35\" step=\"0.005\"></label><label class=\"control\" for=\"wv-swing-damping\"><span class=\"wv-control-head\"><span>Demping</span><output id=\"wv-swing-damping-value\"></output></span><input id=\"wv-swing-damping\" type=\"range\" min=\"0.04\" max=\"0.22\" value=\"0.1\" step=\"0.01\"></label><label class=\"control wv-check\"><input id=\"wv-swing-enabled\" type=\"checkbox\" checked>Pappa dytter</label><label class=\"control wv-check\"><input id=\"rs-cartoon\" type=\"checkbox\">Tegnefilmbonus</label></div><div class=\"wv-buttons\"><button type=\"button\" id=\"wv-swing-match\">Treff egenfrekvensen</button><button type=\"button\" id=\"wv-swing-reset\">Start fra ro</button></div><div id=\"wv-swing-readout\" class=\"readout wv-live\" aria-live=\"polite\"></div><p class=\"model-note\">Slå på tegnefilmbonusen og treff rytmen lenge nok for et ekstra stort dytt.</p></div></div>"};

export function mountResonance(root,api){
 const q=id=>root.querySelector('#'+id),get=id=>+q(id).value,layers={resonance:document.createElementNS('http://www.w3.org/2000/svg','g')};q('wv-resonance').append(layers.resonance);
 let swing=createSwingState(),lastSwingFrame=null,swingHistory=[],lastSwingSample=-1,lastSwingReadout=-1,lastSwingContact=null;
 const reset=()=>{swing=createSwingState();swingHistory=[];lastSwingSample=-1;lastSwingReadout=-1;lastSwingContact=null;api.repaint(q('wv-resonance'));};
 const update=()=>{q('wv-drive-value').textContent=num(get('wv-drive'),3)+' Hz';q('wv-swing-damping-value').textContent=num(get('wv-swing-damping'));lastSwingReadout=-1;api.repaint(q('wv-resonance'));};
 q('rs-cartoon').addEventListener('change',reset);q('wv-swing-reset').addEventListener('click',reset);q('wv-swing-match').addEventListener('click',()=>{q('wv-drive').value='.35';q('wv-swing-enabled').checked=true;reset();update();});
 for(const id of ['wv-drive','wv-swing-damping','wv-swing-enabled','rs-cartoon'])q(id).addEventListener('input',update);
 function drawSwing(t){
      const dt=lastSwingFrame===null?0:Math.min(.1,Math.max(0,t-lastSwingFrame));lastSwingFrame=t;
      stepSwingScene(swing,dt,{pushFrequency:get('wv-drive'),damping:get('wv-swing-damping'),enabled:q('wv-swing-enabled').checked,cartoon:q('rs-cartoon').checked});
      if(swing.time-lastSwingSample>.045||!swingHistory.length){swingHistory.push([swing.time,swing.theta]);lastSwingSample=swing.time;while(swingHistory.length>400)swingHistory.shift();}
      const th=swing.theta,degrees=th*180/Math.PI,{pivotX,pivotY,lengthPx:L,shoulderX,shoulderY}=swingGeometry,seatX=pivotX+L*Math.sin(th),seatY=pivotY+L*Math.cos(th);
      const back=swingBackPoint(th),backX=back.x,backY=back.y;
      const drive=swingDriveAt(swing.time,swing.theta,swing.omega,get('wv-drive'),swing.drivePhase);
      const arm=swingSceneArm(swing,drive.targetAngle,q('wv-swing-enabled').checked),{handX,handY,elbowX,elbowY}=arm;
      const child=swing.ejection||{x:seatX,y:seatY,rotation:-degrees},childX=child.x,childY=child.y,childRotation=child.rotation;
      const start=Math.max(0,swing.time-12),span=12,hist=swingHistory.filter(p=>p[0]>=start),historyPath=hist.map((p,i)=>`${i?'L':'M'}${44+(p[0]-start)/span*208},${162-p[1]*180/Math.PI*.95}`).join(' ');
      const handColor=swing.contact?'#f2b84d':'#e8b892';
      layers.resonance.innerHTML=`<defs><linearGradient id="wv-swing-sky" x2="0" y2="1"><stop stop-color="#e5f2f4"/><stop offset="1" stop-color="#f6f9ec"/></linearGradient><clipPath id="wv-swing-chart-clip"><rect x="43" y="96" width="211" height="130" rx="4"/></clipPath></defs><rect width="760" height="340" rx="12" fill="url(#wv-swing-sky)"/><path d="M0 293Q180 272 350 293T760 288V340H0Z" fill="#d1e4c5"/><path d="M322 299L382 41H629L691 299" fill="none" stroke="#8a9b98" stroke-width="9" stroke-linecap="round"/><path d="M360 41H648" stroke="#6f8780" stroke-width="12" stroke-linecap="round"/>${ln(pivotX-6,pivotY,seatX-13*Math.cos(th),seatY+13*Math.sin(th),'#637881','stroke-width="2.5"')}${ln(pivotX+6,pivotY,seatX+13*Math.cos(th),seatY-13*Math.sin(th),'#637881','stroke-width="2.5"')}<circle cx="${pivotX}" cy="${pivotY}" r="7" fill="#e8b257"/>
      <rect x="24" y="78" width="246" height="166" rx="12" class="wv-svg-bubble"/>${txt(41,101,'Utslaget bygger seg opp','class="wv-cartoon-label"')}${ln(44,162,252,162,'#c3d1d3')}${txt(41,119,'+40°','class="wv-small"')}${txt(41,224,'−40°','class="wv-small"')}<g clip-path="url(#wv-swing-chart-clip)">${path(historyPath,colors.purple,2.7)}</g>${txt(251,232,'Tid →','text-anchor="end" class="wv-small"')}
      <g transform="translate(14 0)"><path d="M391 216L377 283M408 216L427 283" stroke="#425a71" stroke-width="15" stroke-linecap="round"/><path d="M368 287h24m26 0h24" stroke="#354550" stroke-width="10" stroke-linecap="round"/><path d="M383 151Q400 143 416 154L421 219Q399 227 380 216Z" fill="#598c77"/><path d="M388 158L376 192L388 215" fill="none" stroke="#598c77" stroke-width="14" stroke-linecap="round"/><circle cx="402" cy="124" r="19" fill="#e8b892"/><path d="M384 125Q381 98 404 103Q425 105 419 122L413 116 390 117Z" fill="#76604b"/><path d="M393 136q12 10 20-2" fill="none" stroke="#836147" stroke-width="3"/><circle cx="411" cy="124" r="1.8" fill="#34474b"/></g>
      <path d="M${shoulderX} ${shoulderY}L${elbowX} ${elbowY}L${handX} ${handY}" fill="none" stroke="#e8b892" stroke-width="12" stroke-linecap="round"/><path d="M${shoulderX} ${shoulderY}L${elbowX} ${elbowY}" fill="none" stroke="#598c77" stroke-width="15" stroke-linecap="round"/>
      <g transform="translate(${seatX} ${seatY}) rotate(${-degrees})"><rect x="-22" y="-3" width="45" height="8" rx="4" fill="#956e4a"/></g><g transform="translate(${childX} ${childY}) rotate(${childRotation})" data-child="${swing.ejection?'flying':'seated'}" opacity="${swing.ejection?.gone?0:1}"><path d="M-9-9L-9 20 1 31M8-9L12 18 24 27" fill="none" stroke="#cfad95" stroke-width="7" stroke-linecap="round"/><path d="M-14-30Q0-40 14-29L17-8H-17Z" fill="#a179b3"/><path d="M-10-26L-18-41M10-26L16-42" stroke="#e7b998" stroke-width="6" stroke-linecap="round"/><circle cx="0" cy="-50" r="13" fill="#efc6a6"/><path d="M-13-48Q-17-68 3-66Q18-65 14-48L8-56-11-55Z" fill="#765641"/><circle cx="-15" cy="-53" r="6" fill="#765641"/><circle cx="15" cy="-53" r="6" fill="#765641"/><circle cx="5" cy="-51" r="1.5" fill="#36464a"/><path d="M3-45q4 4 7-1" fill="none" stroke="#ad7266" stroke-width="1.8"/><path d="M-2 32h11m11-4 10 2" stroke="#775678" stroke-width="6" stroke-linecap="round"/></g>
      <circle cx="${handX}" cy="${handY}" r="6.5" fill="${handColor}"/>${swing.contact?arrow(backX-20*Math.cos(th),backY+20*Math.sin(th),backX+20*Math.cos(th),backY-20*Math.sin(th),colors.amber):''}${txt(490,326,swing.ejection?'Wiiii! Tegnefilmbonus!':swing.contact?(swing.torque*swing.omega>=0?'Dytt: energi inn!':'Dyttet bremser akkurat nå'):(drive.extending&&q('wv-swing-enabled').checked?'Pappa prøver et dytt …':'Huska svinger videre'),'text-anchor="middle" class="wv-cartoon-label"')}`;
      if(swing.time-lastSwingReadout>.15||lastSwingReadout<0||lastSwingContact!==swing.contact){
        lastSwingReadout=swing.time;lastSwingContact=swing.contact;
        q('wv-swing-readout').innerHTML=`<div><span>Egenfrekvens:</span> <strong>≈ 0,35 Hz</strong></div><div><span>Pappas rytme:</span> <strong>${num(get('wv-drive'),3)} Hz</strong></div><div><span>Største utslag siden start:</span> <strong>${num(swing.maxAmplitude*180/Math.PI,1)}°</strong></div><div><span>Kontakt nå:</span> <strong>${swing.contact?'Dytter':'Ingen kraft fra hånden'}</strong></div>${q('rs-cartoon').checked?'<div><strong>'+ (swing.ejection?'Hun tok av! Trykk «Start fra ro».':swing.bonusFired?'Superdytt!':'Riktig rytme: '+num(swing.charge,1)+' / 8 s')+'</strong></div>':''}`;
        q('wv-resonance').setAttribute('data-launched',String(!!swing.ejection));
      }
    }
    
 api.onFrame(drawSwing,q('wv-resonance'));update();
}
