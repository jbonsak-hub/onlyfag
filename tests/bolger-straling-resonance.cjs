const assert=require('node:assert/strict');
const {moduleUrl}=require('./bolger-straling-paths.cjs');

async function runResonanceChecks(){
 const m=await import(moduleUrl('resonance-swing'));
 const near=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} differs from ${b}`);
 const angles={'forward':0,'backward':.4,'fall':.8};
 const trial=(kind,heightDraw,previousOutcome)=>{
  const draws=[angles[kind],heightDraw];
  return m.createSwingState({random:()=>draws.shift(),previousOutcome});
 };
 const step=1/60;
 near(m.SWING_NATURAL_FREQUENCY,.4);
 const free=trial('forward',0);
 free.theta=.1;
 for(let i=0;i<1200;i++)m.stepDrivenSwing(free,step,{enabled:false,damping:0});
 near(free.theta,.1,.0003); // Eight complete, independently expected 2.5 s periods.

 const ordinary=trial('forward',0);
 for(let i=0;i<180*60;i++){
  m.stepSwingScene(ordinary,step);
  const drive=m.swingDriveAt(ordinary.time,ordinary.theta,ordinary.omega,.4,ordinary.drivePhase);
  const arm=m.swingSceneArm(ordinary,drive.targetAngle);
  near(Math.hypot(arm.elbowX-m.swingGeometry.shoulderX,arm.elbowY-m.swingGeometry.shoulderY),m.swingGeometry.upperArm);
  near(Math.hypot(arm.handX-arm.elbowX,arm.handY-arm.elbowY),m.swingGeometry.forearm);
  if(ordinary.contact){
   const back=m.swingBackPoint(ordinary.theta);
   near(Math.hypot(arm.handX-back.x,arm.handY-back.y),0);
  }
 }
 assert.equal(ordinary.ejection,null);
 assert.ok(ordinary.maxAmplitude<.5,'Friction bounds the resonant amplitude.');
 assert.equal(ordinary.pushes,72,'The father continues to make contact once per cycle.');
 assert.notEqual(trial('forward',0,'forward').outcome,'forward','The next finish varies after reset.');

 const finishes=[];
 for(const mode of ['auto','manual'])for(const kind of Object.keys(angles)){
  const state=trial(kind,mode==='manual'?.97:0);
  const fraction=1-Math.cos(state.releaseAngle);
  assert.ok(fraction>=(kind==='fall'?.75:.5)-1e-8&&fraction<1);
  assert.equal(m.swingManualFrequency(state),null);
  for(let i=0;i<135*60&&!state.ejection;i++){
   if(mode==='manual'&&i%150===0)m.requestSwingPush(state);
   // Interrupting automatic pushes must never defeat the height limit.
   m.stepSwingScene(state,step,{mode,damping:0,enabled:mode==='manual'||i%60!==30});
   assert.ok(Math.abs(state.theta)<=m.SWING_MAX_ANGLE);
  }
  const event=state.ejection;
  assert.ok(event,`${kind} must occur with ${mode} pushes`);
  assert.equal(event.kind,kind);
  const {pivotX,pivotY,lengthPx}=m.swingGeometry;
  near(event.x,pivotX+lengthPx*Math.sin(event.angle));
  near(event.y,pivotY+lengthPx*Math.cos(event.angle));
  assert.ok(Math.abs(event.angle)>=state.releaseAngle);
  if(mode==='manual'){
   near(m.swingManualFrequency(state),.4);
   assert.ok(state.maxAmplitude>85*Math.PI/180,'A run can get close to 90 degrees.');
  }
  const releaseX=event.x;
  if(kind==='fall'){
   near(state.omega,0);
   near(event.vx,0);
   near(event.vy,0);
  }else{
   const travelDirection=Math.sign(event.angle)*(kind==='backward'?-1:1);
   assert.equal(Math.sign(event.vx),travelDirection);
   near(Math.abs(event.vx/event.vy),Math.abs(1/Math.tan(event.angle)));
  }
  for(let i=0;i<4*60;i++)m.stepSwingScene(state,step,{mode,damping:0});
  if(kind==='fall'){
   near(event.x,releaseX);
   assert.ok(event.landed&&!event.gone);
  }else assert.ok(event.gone);
  finishes.push(`${mode}/${kind}`);
 }

 const capped=trial('forward',0);
 capped.omega=12;
 for(let i=0;i<8*60;i++){
  m.stepSwingScene(capped,step,{enabled:i%2===0,cartoon:false,damping:0});
  assert.ok(Math.abs(capped.theta)<=m.SWING_MAX_ANGLE);
 }
 near(capped.maxAmplitude,m.SWING_MAX_ANGLE);
 assert.match(m.resonanceSection.body,/min="0.1" max="1" value="0.4" step="0.1"/);
 assert.match(m.resonanceSection.body,/id="wv-swing-friction" type="checkbox" checked/);
 assert.match(m.resonanceSection.body,/id="wv-swing-manual-mode"/);
 assert.match(m.resonanceSection.body,/id="wv-swing-push"/);
 return {finishes,dampedMaximumDegrees:ordinary.maxAmplitude*180/Math.PI};
}
module.exports={runResonanceChecks};
if(require.main===module)runResonanceChecks().then(result=>console.log('Resonance checks passed: '+JSON.stringify(result))).catch(error=>{console.error(error);process.exitCode=1;});
