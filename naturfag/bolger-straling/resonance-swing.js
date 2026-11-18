const path = (d, color, width=3, extra='') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const txt = (x,y,text,extra='') => `<text x="${x}" y="${y}" ${extra}>${text}</text>`;
const ln = (x1,y1,x2,y2,color='#8c9ba8',extra='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
const arrow = (x1,y1,x2,y2,color='#187b8c') => {
  const a=Math.atan2(y2-y1,x2-x1), s=8;
  return `${ln(x1,y1,x2,y2,color,'stroke-width="2"')}${path(`M${x2-s*Math.cos(a-.45)},${y2-s*Math.sin(a-.45)}L${x2},${y2}L${x2-s*Math.cos(a+.45)},${y2-s*Math.sin(a+.45)}`,color,2)}`;
};
const num=(n,d=2)=>n.toLocaleString('nb-NO',{maximumFractionDigits:d});
const colors={amber:'#d28a16',purple:'#8260b4'};

export const SWING_NATURAL_FREQUENCY=.4;
export const SWING_LENGTH_M=9.81/(2*Math.PI*SWING_NATURAL_FREQUENCY)**2;
export const SWING_DAMPING=.1;
export const SWING_IMPULSE=.105;
export const SWING_MAX_ANGLE=Math.PI/2;
const MANUAL_REACH_TIME=.24;
const MANUAL_PULSE_TIME=.0875;
const FLIGHT_GRAVITY=320;
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const smooth=value=>{const p=clamp(value,0,1);return p*p*(3-2*p);};

export function createSwingState({random=Math.random,previousOutcome=null}={}){
 const outcomes=['forward','backward','fall'].filter(kind=>kind!==previousOutcome);
 const outcome=outcomes[Math.floor(random()*outcomes.length)];
 // Measure height from the resting seat up to the pivot, not along the arc.
 const minimumHeight=outcome==='fall'?.75:.5;
 const height=minimumHeight+(1-minimumHeight)*random();
 return {
  time:0,drivePhase:0,cycle:0,lastPush:null,pushes:0,
  theta:0,omega:0,maxAmplitude:0,contact:false,torque:0,
  pressTimes:[],manualPush:null,outcome,releaseAngle:Math.acos(1-height),ejection:null
 };
}

export function requestSwingPush(state){
 if(state.ejection||state.time-(state.pressTimes.at(-1)??-Infinity)<.05)return;
 state.pressTimes.push(state.time);
 if(state.pressTimes.length>4)state.pressTimes.shift();
 // Allow a short reach toward the seat. A new click cannot stack impulses
 // on top of a gesture that is still reaching or pushing.
 if(!state.manualPush||state.time-state.manualPush.requestedAt>=MANUAL_REACH_TIME+MANUAL_PULSE_TIME){
  state.manualPush={requestedAt:state.time,pulseAt:null};
 }
}

export function swingManualFrequency(state){
 const times=state.pressTimes;
 return times.length<2?null:(times.length-1)/(times.at(-1)-times[0]);
}

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
function swingIsInReach(theta){
 const back=swingBackPoint(theta),g=swingGeometry;
 return theta>-.23&&theta<.14&&back.x>g.shoulderX+12
  &&Math.hypot(back.x-g.shoulderX,back.y-g.shoulderY)<g.upperArm+g.forearm-.5;
}

export function swingDriveAt(time,theta,omega,pushFrequency=SWING_NATURAL_FREQUENCY,phaseOverride=null){
 const frequency=clamp(Number(pushFrequency)||SWING_NATURAL_FREQUENCY,.1,1);
 const phase=phaseOverride===null?((time*frequency)%1+1)%1:((phaseOverride%1)+1)%1;
 const pulseWidth=.035;
 // The arm reaches the back before the push, follows through, then folds back.
 const reachWeight=phase>.88?smooth((phase-.88)/.10):phase<.055?1:1-smooth((phase-.055)/.095);
 const targetAngle=-.23+reachWeight*(clamp(theta,-.23,.14)+.23);
 const reachable=swingIsInReach(theta);
 const extending=phase<pulseWidth;
 // Each complete pulse has the same angular impulse, independent of drive frequency.
 const pulse=extending?2*SWING_IMPULSE*frequency/pulseWidth*Math.sin(Math.PI*phase/pulseWidth)**2:0;
 const torque=reachable?pulse:0;
 return {phase,targetAngle,extending,contact:torque>.0001,torque,reachable,reachWeight};
}

function manualSwingDrive(state){
 const push=state.manualPush;
 if(!push)return {targetAngle:-.23,contact:false,torque:0};
 const elapsed=state.time-(push.pulseAt??push.requestedAt);
 const waiting=push.pulseAt===null;
 const reach=waiting?smooth(elapsed/.08)*(1-smooth((elapsed-MANUAL_REACH_TIME)/.12))
  :1-smooth((elapsed-MANUAL_PULSE_TIME)/.18);
 const torque=!waiting&&elapsed<MANUAL_PULSE_TIME&&swingIsInReach(state.theta)
  ?2*SWING_IMPULSE/MANUAL_PULSE_TIME*Math.sin(Math.PI*elapsed/MANUAL_PULSE_TIME)**2:0;
 return {
  targetAngle:-.23+reach*(clamp(state.theta,-.23,.14)+.23),
  contact:torque>.0001,torque
 };
}

function startSwingOutcome(state,angularSpeed,targetAngle,enabled){
 const {pivotX,pivotY,lengthPx}=swingGeometry;
 const angle=state.theta;
 const direction=Math.sign(angularSpeed||angle);
 const speed=Math.max(425,lengthPx*Math.abs(angularSpeed));
 const hand=swingArmPose(angle,targetAngle,enabled);
 const kind=state.outcome;
 const x=pivotX+lengthPx*Math.sin(angle),y=pivotY+lengthPx*Math.cos(angle);
 const vx=kind==='fall'?0:(kind==='backward'?-1:1)*direction*speed*Math.cos(angle);
 const vy=kind==='fall'?0:-direction*speed*Math.sin(angle);
 state.ejection={kind,angle,x,y,startY:y,vx,vy,rotation:-angle*180/Math.PI,
  age:0,gone:false,landed:false,armX:hand.handX,armY:hand.handY};
}

// A fixed-frequency teaching oscillator: near the bottom, restoring torque is
// proportional to angle. The same 0.4 Hz timing is retained in the large drawing.
export function stepDrivenSwing(state,dt,{pushFrequency=SWING_NATURAL_FREQUENCY,length=SWING_LENGTH_M,damping=SWING_DAMPING,enabled=true,mode='auto',cartoon=false}={}){
 const duration=Number(dt);
 if(!Number.isFinite(duration)||duration<=0)return state;
 const steps=Math.ceil(duration*480),h=duration/steps;
 const frequency=clamp(Number(pushFrequency)||SWING_NATURAL_FREQUENCY,.1,1),loss=Math.max(0,Number(damping)||0);
 const manual=mode==='manual';
 const currentDrive=()=>manual?manualSwingDrive(state):swingDriveAt(state.time,state.theta,state.omega,frequency,state.drivePhase);
 for(let i=0;i<steps;i++){
  const push=state.manualPush;
  if(enabled&&manual&&push?.pulseAt===null&&state.time-push.requestedAt<=MANUAL_REACH_TIME
   &&state.omega>=0&&swingIsInReach(state.theta))push.pulseAt=state.time;
  const drive=currentDrive(),force=enabled?drive.torque:0;
  const pushId=manual?push:state.cycle;
  if(force>.0001&&state.lastPush!==pushId){state.lastPush=pushId;state.pushes++;}
  const oldAngle=state.theta,oldSpeed=state.omega;
  state.omega+=(-9.81/length*state.theta-loss*state.omega+force)*h;
  state.theta+=state.omega*h;state.time+=h;
  state.drivePhase+=frequency*h;if(state.drivePhase>=1){state.drivePhase-=1;state.cycle++;}
  const incomingSpeed=state.omega,atLimit=Math.abs(state.theta)>=SWING_MAX_ANGLE;
  if(atLimit){
   state.theta=Math.sign(state.theta)*SWING_MAX_ANGLE;
   state.omega=0;
  }
  state.maxAmplitude=Math.max(state.maxAmplitude,Math.abs(state.theta));
  if(!cartoon)continue;

  const turning=oldAngle*oldSpeed>0&&oldAngle*state.omega<=0;
  if(state.outcome==='fall'){
   const peak=turning&&!atLimit?oldAngle:state.theta;
   if((atLimit||turning)&&Math.abs(peak)>=state.releaseAngle){
    state.theta=peak;
    state.omega=0;
    startSwingOutcome(state,0,drive.targetAngle,enabled);
    break;
   }
  }else if(Math.abs(state.theta)>=state.releaseAngle&&(atLimit||state.theta*incomingSpeed>0)){
   startSwingOutcome(state,incomingSpeed,drive.targetAngle,enabled);
   break;
  }
 }
 const drive=currentDrive();
 state.contact=enabled&&!state.ejection&&drive.contact;
 state.torque=enabled&&!state.ejection?drive.torque:0;
 return state;
}
export function swingArmPose(theta,targetAngle,enabled=true){
 const point=swingBackPoint(enabled?clamp(targetAngle,-.23,.14):-.23);return solveSwingArm(point.x,point.y);
}
export function stepSwingScene(state,dt,{cartoon=true,...options}={}){
 const e=state.ejection;
 if(!e)return stepDrivenSwing(state,dt,{...options,cartoon});
 if(!Number.isFinite(dt)||dt<=0)return state;
 e.age+=dt;
 if(e.kind==='fall'){
  stepDrivenSwing(state,dt,{...options,enabled:false});
  const floor=260;
  e.y=Math.min(floor,e.startY+FLIGHT_GRAVITY*e.age**2/2);
  e.rotation=-e.angle*180/Math.PI*(1-smooth(e.age/.4));
  e.landed=e.y===floor;
 }else if(!e.gone){
  e.x+=e.vx*dt;
  e.y+=e.vy*dt+FLIGHT_GRAVITY*dt**2/2;
  e.vy+=FLIGHT_GRAVITY*dt;
  e.rotation+=Math.sign(e.vx)*120*dt;
  e.gone=e.x>850||e.x< -90||e.y< -85||e.y>430;
 }
 return state;
}
export function swingSceneArm(state,targetAngle,enabled=true){
 if(!state.ejection)return swingArmPose(state.theta,targetAngle,enabled);
 const e=state.ejection,rest=swingArmPose(0,-.23,false),mix=smooth(e.age/.45);
 return solveSwingArm(e.armX*(1-mix)+rest.handX*mix,e.armY*(1-mix)+rest.handY*mix);
}

export const resonanceSection={
 title:'Resonans: finn rytmen på huska',
 body:`<p>Når dyttene passer med huskas <strong>egenfrekvens</strong>, kan utslaget bygge seg opp. Det kaller vi <strong>resonans</strong>. Friksjon og luftmotstand demper svingningene.</p>
  <div class="wv-scope"><div class="model wv-swing-model">
   <div class="wv-swing-modes" role="group" aria-label="Dyttemodus" data-model-full-width>
    <button type="button" id="wv-swing-auto-mode" aria-pressed="true">Automatisk</button>
    <button type="button" id="wv-swing-manual-mode" aria-pressed="false">Manuell</button>
   </div>
   <div class="wv-swing-stage">
    <svg id="wv-resonance" viewBox="0 0 760 340" role="img" aria-labelledby="wv-resonance-title wv-resonance-desc">
     <title id="wv-resonance-title">Pappa dytter en jente på huske</title>
     <desc id="wv-resonance-desc">Dytt huska selv eller velg en automatisk dyttefrekvens. Pappas hånd gir kraft når han når fram til huska.</desc>
    </svg>
    <div class="wv-swing-manual" id="wv-swing-manual" hidden>
     <button type="button" id="wv-swing-push">Dytt</button>
    </div>
   </div>
   <div id="wv-swing-auto">
    <label class="control wv-swing-slider" for="wv-drive">
     <span class="wv-control-head"><span>Pappas dyttefrekvens</span><output id="wv-drive-value" for="wv-drive"></output></span>
     <input id="wv-drive" type="range" min="0.1" max="1" value="0.4" step="0.1" aria-describedby="wv-swing-frequency-mark">
    </label>
    <div class="wv-swing-scale">
     <span aria-hidden="true">0,1</span><span id="wv-swing-frequency-mark">Egenfrekvens<br><strong>0,4 Hz</strong></span><span aria-hidden="true">1,0</span>
    </div>
    <label class="control wv-check"><input id="wv-swing-enabled" type="checkbox" checked>Pappa dytter</label>
   </div>
   <div class="wv-swing-settings">
    <label class="control wv-check"><input id="wv-swing-friction" type="checkbox" checked>Friksjon og luftmotstand</label>
    <button type="button" id="wv-swing-reset" class="secondary">Start fra ro</button>
   </div>
   <div id="wv-swing-readout" class="readout wv-live">
    <div id="wv-swing-frequency-readout" hidden>
     <div>Egenfrekvens <strong>0,4 Hz</strong></div>
     <div>Din dyttefrekvens <output id="wv-swing-your-frequency" for="wv-swing-push" aria-live="polite">–</output></div>
    </div>
    <div>Største utslag <strong id="wv-swing-maximum">0°</strong></div>
   </div>
   <details class="model-note"><summary>Om modellen</summary><p>Modellen har fast egenfrekvens. På en virkelig huske blir perioden lengre ved store utslag.</p></details>
  </div></div>`
};

export function mountResonance(root,api){
 const q=id=>root.querySelector('#'+id);
 const diagram=q('wv-resonance'),slider=q('wv-drive'),pushButton=q('wv-swing-push');
 const layer=document.createElementNS('http://www.w3.org/2000/svg','g');
 diagram.append(layer);
 const autoButton=q('wv-swing-auto-mode'),manualButton=q('wv-swing-manual-mode');
 const frequencyOutput=q('wv-swing-your-frequency'),maximumOutput=q('wv-swing-maximum');
 let mode='auto',swing=createSwingState(),previousOutcome=null;
 let lastSwingFrame=null,swingHistory=[],lastSwingSample=-1;
 const update=()=>{
  q('wv-drive-value').textContent=num(Number(slider.value),1)+' Hz';
  api.repaint(diagram);
 };
 const reset=()=>{
  previousOutcome=swing.ejection?.kind??previousOutcome;
  swing=createSwingState({previousOutcome});
  swingHistory=[];
  lastSwingFrame=null;
  lastSwingSample=-1;
  update();
 };
 const selectMode=next=>{
  if(mode===next)return;
  mode=next;
  const manual=mode==='manual';
  autoButton.setAttribute('aria-pressed',String(!manual));
  manualButton.setAttribute('aria-pressed',String(manual));
  q('wv-swing-auto').hidden=manual;
  q('wv-swing-manual').hidden=!manual;
  q('wv-swing-frequency-readout').hidden=!manual;
  reset();
 };
 autoButton.addEventListener('click',()=>selectMode('auto'));
 manualButton.addEventListener('click',()=>selectMode('manual'));
 pushButton.addEventListener('click',()=>{
  requestSwingPush(swing);
  api.repaint(diagram);
 });
 q('wv-swing-reset').addEventListener('click',reset);
 for(const id of ['wv-drive','wv-swing-friction','wv-swing-enabled'])q(id).addEventListener('input',update);
 function drawSwing(t){
      const dt=lastSwingFrame===null?0:Math.min(.1,Math.max(0,t-lastSwingFrame));lastSwingFrame=t;
      const manual=mode==='manual',pushFrequency=Number(slider.value);
      const enabled=manual||q('wv-swing-enabled').checked;
      stepSwingScene(swing,dt,{mode,pushFrequency,damping:q('wv-swing-friction').checked?SWING_DAMPING:0,enabled});
      if(swing.time-lastSwingSample>.045||!swingHistory.length){swingHistory.push([swing.time,swing.theta]);lastSwingSample=swing.time;while(swingHistory.length>400)swingHistory.shift();}
      const th=swing.theta,degrees=th*180/Math.PI,{pivotX,pivotY,lengthPx:L,shoulderX,shoulderY}=swingGeometry,seatX=pivotX+L*Math.sin(th),seatY=pivotY+L*Math.cos(th);
      const back=swingBackPoint(th),backX=back.x,backY=back.y;
      const drive=manual?manualSwingDrive(swing):swingDriveAt(swing.time,th,swing.omega,pushFrequency,swing.drivePhase);
      const {handX,handY,elbowX,elbowY}=swingSceneArm(swing,drive.targetAngle,enabled);
      const child=swing.ejection||{x:seatX,y:seatY,rotation:-degrees},childX=child.x,childY=child.y,childRotation=child.rotation;
      const broken=!!swing.ejection&&swing.ejection.kind!=='fall';
      const seat=broken?child:{x:seatX,y:seatY,rotation:-degrees};
      const childPose=broken?'flying':child.landed?'landed':swing.ejection?'falling':'seated';
      const start=Math.max(0,swing.time-12),span=12,hist=swingHistory.filter(p=>p[0]>=start),historyPath=hist.map((p,i)=>`${i?'L':'M'}${44+(p[0]-start)/span*208},${174-p[1]*180/Math.PI*.5}`).join(' ');
      const handColor=swing.contact?'#f2b84d':'#e8b892';
      const ropes=broken?[-6,6].map((dx,i)=>{
       const {age,angle}=swing.ejection;
       const sway=angle*Math.exp(-age*2)+Math.sin(age*4+i*.6)*(1-Math.exp(-age*4))*Math.exp(-age)*.16;
       const length=78+i*5;
       return path(`M${pivotX+dx} ${pivotY}l${length*Math.sin(sway)} ${length*Math.cos(sway)} -4 4 7 3-5 5`,'#637881',2.5);
      }).join(''):ln(pivotX-6,pivotY,seatX-13*Math.cos(th),seatY+13*Math.sin(th),'#637881','stroke-width="2.5"')+ln(pivotX+6,pivotY,seatX+13*Math.cos(th),seatY-13*Math.sin(th),'#637881','stroke-width="2.5"');
      layer.innerHTML=`<defs><linearGradient id="wv-swing-sky" x2="0" y2="1"><stop stop-color="#e5f2f4"/><stop offset="1" stop-color="#f6f9ec"/></linearGradient><clipPath id="wv-swing-chart-clip"><rect x="43" y="117" width="211" height="108" rx="4"/></clipPath></defs><rect width="760" height="340" rx="12" fill="url(#wv-swing-sky)"/><path d="M0 293Q180 272 350 293T760 288V340H0Z" fill="#d1e4c5"/><path d="M322 299L382 41H629L691 299" fill="none" stroke="#8a9b98" stroke-width="9" stroke-linecap="round"/><path d="M360 41H648" stroke="#6f8780" stroke-width="12" stroke-linecap="round"/>${ropes}<circle cx="${pivotX}" cy="${pivotY}" r="7" fill="#e8b257"/>
      <rect x="24" y="78" width="246" height="166" rx="12" class="wv-svg-bubble"/>${txt(41,101,'Utslag','class="wv-cartoon-label"')}${ln(44,174,252,174,'#c3d1d3')}${txt(41,127,'+90°','class="wv-small"')}${txt(41,225,'−90°','class="wv-small"')}<g clip-path="url(#wv-swing-chart-clip)">${path(historyPath,colors.purple,2.7)}</g>${txt(251,232,'Tid →','text-anchor="end" class="wv-small"')}
      <g transform="translate(14 0)"><path d="M391 216L377 283M408 216L427 283" stroke="#425a71" stroke-width="15" stroke-linecap="round"/><path d="M368 287h24m26 0h24" stroke="#354550" stroke-width="10" stroke-linecap="round"/><path d="M383 151Q400 143 416 154L421 219Q399 227 380 216Z" fill="#598c77"/><path d="M388 158L376 192L388 215" fill="none" stroke="#598c77" stroke-width="14" stroke-linecap="round"/><circle cx="402" cy="124" r="19" fill="#e8b892"/><path d="M384 125Q381 98 404 103Q425 105 419 122L413 116 390 117Z" fill="#76604b"/><path d="M393 136q12 10 20-2" fill="none" stroke="#836147" stroke-width="3"/><circle cx="411" cy="124" r="1.8" fill="#34474b"/></g>
      <path d="M${shoulderX} ${shoulderY}L${elbowX} ${elbowY}L${handX} ${handY}" fill="none" stroke="#e8b892" stroke-width="12" stroke-linecap="round"/><path d="M${shoulderX} ${shoulderY}L${elbowX} ${elbowY}" fill="none" stroke="#598c77" stroke-width="15" stroke-linecap="round"/>
      <g transform="translate(${seat.x} ${seat.y}) rotate(${seat.rotation})" opacity="${seat.gone?0:1}"><rect x="-22" y="-3" width="45" height="8" rx="4" fill="#956e4a"/></g><g transform="translate(${childX} ${childY}) rotate(${childRotation})" data-child="${childPose}" opacity="${child.gone?0:1}"><path d="M-9-9L-9 20 1 31M8-9L12 18 24 27" fill="none" stroke="#cfad95" stroke-width="7" stroke-linecap="round"/><path d="M-14-30Q0-40 14-29L17-8H-17Z" fill="#a179b3"/><path d="M-10-26L-18-41M10-26L16-42" stroke="#e7b998" stroke-width="6" stroke-linecap="round"/><circle cx="0" cy="-50" r="13" fill="#efc6a6"/><path d="M-13-48Q-17-68 3-66Q18-65 14-48L8-56-11-55Z" fill="#765641"/><circle cx="-15" cy="-53" r="6" fill="#765641"/><circle cx="15" cy="-53" r="6" fill="#765641"/><circle cx="5" cy="-51" r="1.5" fill="#36464a"/><path d="M3-45q4 4 7-1" fill="none" stroke="#ad7266" stroke-width="1.8"/><path d="M-2 32h11m11-4 10 2" stroke="#775678" stroke-width="6" stroke-linecap="round"/></g>
      <circle cx="${handX}" cy="${handY}" r="6.5" fill="${handColor}"/>${swing.contact?arrow(backX-20*Math.cos(th),backY+20*Math.sin(th),backX+20*Math.cos(th),backY-20*Math.sin(th),colors.amber):''}`;
      const maximum=num(swing.maxAmplitude*180/Math.PI,1)+'°';
      if(maximumOutput.textContent!==maximum)maximumOutput.textContent=maximum;
      if(manual){
       const hz=swingManualFrequency(swing),frequency=hz===null?'–':num(hz)+' Hz';
       if(frequencyOutput.textContent!==frequency)frequencyOutput.textContent=frequency;
      }
      pushButton.disabled=!!swing.ejection;
      diagram.setAttribute('data-launched',String(!!swing.ejection));
    }
    
 const removeFrame=api.onFrame(drawSwing,diagram);update();
 return ()=>removeFrame?.();
}
