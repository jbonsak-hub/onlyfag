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

export const SWING_NATURAL_FREQUENCY=.4;
export const SWING_LENGTH_M=9.81/(2*Math.PI*SWING_NATURAL_FREQUENCY)**2;
export const SWING_DAMPING=.1;
export const SWING_IMPULSE=.105;
export const SWING_SURPRISE_DELAY=55;
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const smooth=value=>{const p=clamp(value,0,1);return p*p*(3-2*p);};
export function createSwingState(){return {time:0,drivePhase:0,cycle:0,lastPushCycle:-1,pushes:0,qualifyingStartPushes:0,matchedPushes:0,theta:0,omega:0,amplitude:0,maxAmplitude:0,contact:false,torque:0,work:0,charge:0,bonusFired:false,ejection:null};}
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
export function swingDriveAt(time,theta,omega,pushFrequency=SWING_NATURAL_FREQUENCY,phaseOverride=null){
 const frequency=clamp(Number(pushFrequency)||SWING_NATURAL_FREQUENCY,.1,1);
 const phase=phaseOverride===null?((time*frequency)%1+1)%1:((phaseOverride%1)+1)%1;
 const pulseWidth=.035;
 // The arm reaches the back before the push, follows through, then folds back.
 const reachWeight=phase>.88?smooth((phase-.88)/.10):phase<.055?1:1-smooth((phase-.055)/.095);
 const targetAngle=-.23+reachWeight*(clamp(theta,-.23,.14)+.23);
 const back=swingBackPoint(theta),g=swingGeometry;
 const reachable=Math.hypot(back.x-g.shoulderX,back.y-g.shoulderY)<g.upperArm+g.forearm-.5&&back.x>g.shoulderX+12;
 const extending=phase<pulseWidth;
 // Each complete pulse has the same angular impulse, independent of drive frequency.
 const pulse=extending?2*SWING_IMPULSE*frequency/pulseWidth*Math.sin(Math.PI*phase/pulseWidth)**2:0;
 const torque=reachable&&theta>-.23&&theta<.14?pulse:0;
 return {phase,targetAngle,extending,contact:torque>.0001,torque,reachable,reachWeight};
}
// A fixed-frequency teaching oscillator: near the bottom, restoring torque is
// proportional to angle. The same 0.4 Hz timing is retained in the large drawing.
export function stepDrivenSwing(state,dt,{pushFrequency=SWING_NATURAL_FREQUENCY,length=SWING_LENGTH_M,damping=SWING_DAMPING,enabled=true}={}){
 const duration=Math.max(0,Number(dt)||0),steps=Math.max(1,Math.ceil(duration*480)),h=duration/steps;
 const frequency=clamp(Number(pushFrequency)||SWING_NATURAL_FREQUENCY,.1,1),loss=Math.max(0,Number(damping)||0);
 for(let i=0;i<steps;i++){
  const drive=swingDriveAt(state.time,state.theta,state.omega,frequency,state.drivePhase),force=enabled?drive.torque:0;
  if(force>.0001&&state.lastPushCycle!==state.cycle){state.lastPushCycle=state.cycle;state.pushes++;}
  state.omega+=(-9.81/length*state.theta-loss*state.omega+force)*h;
  state.theta+=state.omega*h;state.time+=h;state.work+=force*state.omega*h;
  state.drivePhase+=frequency*h;if(state.drivePhase>=1){state.drivePhase-=1;state.cycle++;}
  state.amplitude=Math.max(Math.abs(state.theta),state.amplitude*Math.exp(-h/12));
  state.maxAmplitude=Math.max(state.maxAmplitude,Math.abs(state.theta));
 }
 const drive=swingDriveAt(state.time,state.theta,state.omega,frequency,state.drivePhase);
 state.contact=enabled&&drive.contact;state.torque=enabled?drive.torque:0;return state;
}
export function swingArmPose(theta,targetAngle,enabled=true){
 const point=swingBackPoint(enabled?clamp(targetAngle,-.23,.14):-.23);return solveSwingArm(point.x,point.y);
}
export function stepSwingScene(state,dt,{cartoon=true,...options}={}){
 const enabled=options.enabled!==false&&!state.ejection;
 stepDrivenSwing(state,dt,{...options,enabled});
 if(!(dt>0))return state;
 if(state.ejection){
  const e=state.ejection;if(!e.gone){e.age+=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=210*dt;e.rotation+=120*dt;e.gone=e.x>850||e.x< -100||e.y< -200||e.y>600;}return state;
 }
 const damping=options.damping===undefined?SWING_DAMPING:Math.max(0,Number(options.damping)||0);
 const matched=Math.abs((options.pushFrequency??SWING_NATURAL_FREQUENCY)-SWING_NATURAL_FREQUENCY)<.0005;
 if(cartoon&&enabled&&damping===0&&matched){state.charge+=dt;state.matchedPushes=state.pushes-state.qualifyingStartPushes;}
 else{state.charge=0;state.matchedPushes=0;state.qualifyingStartPushes=state.pushes;}
 // No extra energy kick: the undamped, correctly timed impulses have built this
 // amplitude over more than twenty swings before the ropes finally give way.
 if(cartoon&&state.charge>=SWING_SURPRISE_DELAY&&state.matchedPushes>=22&&state.maxAmplitude>.9&&state.theta>.78&&state.omega>0){
  const g=swingGeometry,drive=swingDriveAt(state.time,state.theta,state.omega,options.pushFrequency??SWING_NATURAL_FREQUENCY,state.drivePhase),hand=swingArmPose(state.theta,drive.targetAngle,true);
  state.bonusFired=true;state.ejection={age:0,gone:false,angle:state.theta,armX:hand.handX,armY:hand.handY,x:g.pivotX+g.lengthPx*Math.sin(state.theta),y:g.pivotY+g.lengthPx*Math.cos(state.theta),vx:g.lengthPx*state.omega*Math.cos(state.theta),vy:-g.lengthPx*state.omega*Math.sin(state.theta),rotation:-state.theta*180/Math.PI};
  state.contact=false;state.torque=0;
 }
 return state;
}
export function swingSceneArm(state,targetAngle,enabled=true){
 if(!state.ejection)return swingArmPose(state.theta,targetAngle,enabled);
 const e=state.ejection,rest=swingArmPose(0,-.23,false),mix=smooth(e.age/.45);
 return solveSwingArm(e.armX*(1-mix)+rest.handX*mix,e.armY*(1-mix)+rest.handY*mix);
}

export const resonanceSection={"title":"Resonans: finn rytmen på huska","body":"<p>Pappa prøver å gi datteren fart på huska. Når dyttene passer med huskas <strong>egenfrekvens</strong>, overføres energi effektivt og utslaget bygger seg opp: <strong>resonans</strong>. Friksjon og luftmotstand begrenser utslaget.</p><div class=\"wv-scope\"><div class=\"model\"><svg id=\"wv-resonance\" viewBox=\"0 0 760 340\" role=\"img\" aria-labelledby=\"wv-resonance-title wv-resonance-desc\"><title id=\"wv-resonance-title\">Pappa dytter en jente på huske</title><desc id=\"wv-resonance-desc\">Rytmiske dytt overfører energi til huska. Pappas hånd gir bare kraft når han faktisk har kontakt. Juster frekvensen og sammenlikn med og uten friksjon og luftmotstand.</desc></svg><div class=\"controls wv-grid\"><label class=\"control\" for=\"wv-drive\"><span class=\"wv-control-head\"><span>Pappas dyttefrekvens</span><output id=\"wv-drive-value\"></output></span><input id=\"wv-drive\" type=\"range\" min=\"0.1\" max=\"1\" value=\"0.4\" step=\"0.1\"></label><label class=\"control wv-check\"><input id=\"wv-swing-enabled\" type=\"checkbox\" checked>Pappa dytter</label><label class=\"control wv-check\"><input id=\"wv-swing-friction\" type=\"checkbox\" checked>Friksjon og luftmotstand</label></div><div class=\"wv-buttons\"><button type=\"button\" id=\"wv-swing-match\">Treff egenfrekvensen</button><button type=\"button\" id=\"wv-swing-reset\">Start fra ro</button></div><div id=\"wv-swing-readout\" class=\"readout wv-live\" aria-live=\"polite\"></div><details class=\"model-note\"><summary>Om modellen</summary><p>Huska har fast egenfrekvens i denne modellen. En virkelig huske bruker litt lengre tid på hver svingning når utslaget blir stort.</p></details></div></div>"};

export function mountResonance(root,api){
 const q=id=>root.querySelector('#'+id),get=id=>+q(id).value,layers={resonance:document.createElementNS('http://www.w3.org/2000/svg','g')};q('wv-resonance').append(layers.resonance);
 let swing=createSwingState(),lastSwingFrame=null,swingHistory=[],lastSwingSample=-1,lastSwingReadout=-1,lastSwingContact=null;
 const reset=()=>{swing=createSwingState();swingHistory=[];lastSwingSample=-1;lastSwingReadout=-1;lastSwingContact=null;api.repaint(q('wv-resonance'));};
 const update=()=>{q('wv-drive-value').textContent=num(get('wv-drive'),1)+' Hz';lastSwingReadout=-1;api.repaint(q('wv-resonance'));};
 q('wv-swing-reset').addEventListener('click',reset);q('wv-swing-match').addEventListener('click',()=>{q('wv-drive').value='.4';q('wv-swing-enabled').checked=true;reset();update();});
 for(const id of ['wv-drive','wv-swing-friction','wv-swing-enabled'])q(id).addEventListener('input',update);
 function drawSwing(t){
      const dt=lastSwingFrame===null?0:Math.min(.1,Math.max(0,t-lastSwingFrame));lastSwingFrame=t;
      stepSwingScene(swing,dt,{pushFrequency:get('wv-drive'),damping:q('wv-swing-friction').checked?SWING_DAMPING:0,enabled:q('wv-swing-enabled').checked});
      if(swing.time-lastSwingSample>.045||!swingHistory.length){swingHistory.push([swing.time,swing.theta]);lastSwingSample=swing.time;while(swingHistory.length>400)swingHistory.shift();}
      const th=swing.theta,degrees=th*180/Math.PI,{pivotX,pivotY,lengthPx:L,shoulderX,shoulderY}=swingGeometry,seatX=pivotX+L*Math.sin(th),seatY=pivotY+L*Math.cos(th);
      const back=swingBackPoint(th),backX=back.x,backY=back.y;
      const drive=swingDriveAt(swing.time,swing.theta,swing.omega,get('wv-drive'),swing.drivePhase);
      const arm=swingSceneArm(swing,drive.targetAngle,q('wv-swing-enabled').checked),{handX,handY,elbowX,elbowY}=arm;
      const child=swing.ejection||{x:seatX,y:seatY,rotation:-degrees},childX=child.x,childY=child.y,childRotation=child.rotation;
      const start=Math.max(0,swing.time-12),span=12,hist=swingHistory.filter(p=>p[0]>=start),historyPath=hist.map((p,i)=>`${i?'L':'M'}${44+(p[0]-start)/span*208},${174-p[1]*180/Math.PI*.75}`).join(' ');
      const handColor=swing.contact?'#f2b84d':'#e8b892';
      const ropes=swing.ejection?[-6,6].map((dx,i)=>{const sway=Math.sin(swing.ejection.age*4+i*.6)*Math.exp(-swing.ejection.age*.6)*13,x=pivotX+dx+sway,y=pivotY+82+i*5;return path(`M${pivotX+dx} ${pivotY}Q${pivotX+dx+sway*1.5} ${pivotY+40} ${x} ${y-7}l-4 4 7 3-5 5`,'#637881',2.5);}).join(''):ln(pivotX-6,pivotY,seatX-13*Math.cos(th),seatY+13*Math.sin(th),'#637881','stroke-width="2.5"')+ln(pivotX+6,pivotY,seatX+13*Math.cos(th),seatY-13*Math.sin(th),'#637881','stroke-width="2.5"');
      layers.resonance.innerHTML=`<defs><linearGradient id="wv-swing-sky" x2="0" y2="1"><stop stop-color="#e5f2f4"/><stop offset="1" stop-color="#f6f9ec"/></linearGradient><clipPath id="wv-swing-chart-clip"><rect x="43" y="117" width="211" height="108" rx="4"/></clipPath></defs><rect width="760" height="340" rx="12" fill="url(#wv-swing-sky)"/><path d="M0 293Q180 272 350 293T760 288V340H0Z" fill="#d1e4c5"/><path d="M322 299L382 41H629L691 299" fill="none" stroke="#8a9b98" stroke-width="9" stroke-linecap="round"/><path d="M360 41H648" stroke="#6f8780" stroke-width="12" stroke-linecap="round"/>${ropes}<circle cx="${pivotX}" cy="${pivotY}" r="7" fill="#e8b257"/>
      <rect x="24" y="78" width="246" height="166" rx="12" class="wv-svg-bubble"/>${txt(41,101,'Utslaget bygger seg opp','class="wv-cartoon-label"')}${ln(44,174,252,174,'#c3d1d3')}${txt(41,127,'+60°','class="wv-small"')}${txt(41,225,'−60°','class="wv-small"')}<g clip-path="url(#wv-swing-chart-clip)">${path(historyPath,colors.purple,2.7)}</g>${txt(251,232,'Tid →','text-anchor="end" class="wv-small"')}
      <g transform="translate(14 0)"><path d="M391 216L377 283M408 216L427 283" stroke="#425a71" stroke-width="15" stroke-linecap="round"/><path d="M368 287h24m26 0h24" stroke="#354550" stroke-width="10" stroke-linecap="round"/><path d="M383 151Q400 143 416 154L421 219Q399 227 380 216Z" fill="#598c77"/><path d="M388 158L376 192L388 215" fill="none" stroke="#598c77" stroke-width="14" stroke-linecap="round"/><circle cx="402" cy="124" r="19" fill="#e8b892"/><path d="M384 125Q381 98 404 103Q425 105 419 122L413 116 390 117Z" fill="#76604b"/><path d="M393 136q12 10 20-2" fill="none" stroke="#836147" stroke-width="3"/><circle cx="411" cy="124" r="1.8" fill="#34474b"/></g>
      <path d="M${shoulderX} ${shoulderY}L${elbowX} ${elbowY}L${handX} ${handY}" fill="none" stroke="#e8b892" stroke-width="12" stroke-linecap="round"/><path d="M${shoulderX} ${shoulderY}L${elbowX} ${elbowY}" fill="none" stroke="#598c77" stroke-width="15" stroke-linecap="round"/>
      <g transform="translate(${childX} ${childY}) rotate(${childRotation})" opacity="${swing.ejection?.gone?0:1}"><rect x="-22" y="-3" width="45" height="8" rx="4" fill="#956e4a"/></g><g transform="translate(${childX} ${childY}) rotate(${childRotation})" data-child="${swing.ejection?'flying':'seated'}" opacity="${swing.ejection?.gone?0:1}"><path d="M-9-9L-9 20 1 31M8-9L12 18 24 27" fill="none" stroke="#cfad95" stroke-width="7" stroke-linecap="round"/><path d="M-14-30Q0-40 14-29L17-8H-17Z" fill="#a179b3"/><path d="M-10-26L-18-41M10-26L16-42" stroke="#e7b998" stroke-width="6" stroke-linecap="round"/><circle cx="0" cy="-50" r="13" fill="#efc6a6"/><path d="M-13-48Q-17-68 3-66Q18-65 14-48L8-56-11-55Z" fill="#765641"/><circle cx="-15" cy="-53" r="6" fill="#765641"/><circle cx="15" cy="-53" r="6" fill="#765641"/><circle cx="5" cy="-51" r="1.5" fill="#36464a"/><path d="M3-45q4 4 7-1" fill="none" stroke="#ad7266" stroke-width="1.8"/><path d="M-2 32h11m11-4 10 2" stroke="#775678" stroke-width="6" stroke-linecap="round"/></g>
      <circle cx="${handX}" cy="${handY}" r="6.5" fill="${handColor}"/>${swing.contact?arrow(backX-20*Math.cos(th),backY+20*Math.sin(th),backX+20*Math.cos(th),backY-20*Math.sin(th),colors.amber):''}`;
      if(swing.time-lastSwingReadout>.15||lastSwingReadout<0||lastSwingContact!==swing.contact){
        lastSwingReadout=swing.time;lastSwingContact=swing.contact;
        q('wv-swing-readout').innerHTML=`<div><span>Egenfrekvens:</span> <strong>0,4 Hz</strong></div><div><span>Pappas dyttefrekvens:</span> <strong>${num(get('wv-drive'),1)} Hz</strong></div><div><span>Største utslag siden start:</span> <strong>${num(swing.maxAmplitude*180/Math.PI,1)}°</strong></div><div><span>Friksjon og luftmotstand:</span> <strong>${q('wv-swing-friction').checked?'På':'Av'}</strong></div>`;
        q('wv-resonance').setAttribute('data-launched',String(!!swing.ejection));
      }
    }
    
 const removeFrame=api.onFrame(drawSwing,q('wv-resonance'));update();
 return ()=>removeFrame?.();
}
