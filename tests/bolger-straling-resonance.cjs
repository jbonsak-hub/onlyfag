const assert=require('node:assert/strict');
const {moduleUrl}=require('./bolger-straling-paths.cjs');

async function runResonanceChecks(){
 const m=await import(moduleUrl('resonance-swing'));
 const near=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} differs from ${b}`);
 const run=(frequency,damping,duration=90)=>{
  const state=m.createSwingState();let lastArm=null,maxJump=0,firstLaunch=null,launchPushes=0,largestLaunchStep=0;
  for(let i=0;i<duration*60;i++){
   const beforeOmega=state.omega,wasFlying=!!state.ejection;
   m.stepSwingScene(state,1/60,{pushFrequency:frequency,damping});
   const drive=m.swingDriveAt(state.time,state.theta,state.omega,frequency,state.drivePhase);
   const arm=m.swingSceneArm(state,drive.targetAngle);
   near(Math.hypot(arm.elbowX-m.swingGeometry.shoulderX,arm.elbowY-m.swingGeometry.shoulderY),m.swingGeometry.upperArm);
   near(Math.hypot(arm.handX-arm.elbowX,arm.handY-arm.elbowY),m.swingGeometry.forearm);
   if(lastArm)maxJump=Math.max(maxJump,Math.hypot(arm.handX-lastArm.handX,arm.handY-lastArm.handY));
   lastArm=arm;
   if(state.contact){const back=m.swingBackPoint(state.theta);near(Math.hypot(arm.handX-back.x,arm.handY-back.y),0);}
   if(state.ejection&&!wasFlying){
    firstLaunch=state.time;launchPushes=state.matchedPushes;largestLaunchStep=Math.abs(state.omega-beforeOmega);
    near(state.ejection.x,m.swingGeometry.pivotX+m.swingGeometry.lengthPx*Math.sin(state.theta));
    near(state.ejection.y,m.swingGeometry.pivotY+m.swingGeometry.lengthPx*Math.cos(state.theta));
   }
  }
  return {state,maxJump,firstLaunch,launchPushes,largestLaunchStep};
 };
 near(m.SWING_NATURAL_FREQUENCY,.4);
 const free=m.createSwingState();free.theta=.1;
 for(let i=0;i<1200;i++)m.stepDrivenSwing(free,1/60,{enabled:false,damping:0});
 near(free.theta,.1,.0003); // Eight complete, independently expected 2.5 s periods.
 const ordinary=run(.4,.1,180),undamped=run(.4,0);
 assert.equal(ordinary.firstLaunch,null);
 assert.ok(ordinary.state.maxAmplitude<.5,'Friction bounds the resonant amplitude.');
 assert.equal(ordinary.state.pushes,72,'The father continues to make contact once per cycle.');
 assert.ok(undamped.firstLaunch>50&&undamped.firstLaunch<70,'The hidden break takes over twenty swings.');
 assert.ok(undamped.launchPushes>=22);
 assert.ok(undamped.largestLaunchStep<.12,'The departure adds no artificial energy kick.');
 assert.ok(undamped.maxJump<12,'The wrist stays continuous through the departure.');
 assert.equal(undamped.state.ejection.gone,true);
 for(let i=1;i<=10;i++)if(i!==4){
  const wrong=run(i/10,0);
  assert.equal(wrong.firstLaunch,null,`${i/10} Hz must not trigger the hidden break.`);
  assert.ok(wrong.maxJump<12,`${i/10} Hz arm movement stays continuous.`);
 }
 const interrupted=m.createSwingState();
 for(let i=0;i<20*60;i++)m.stepSwingScene(interrupted,1/60,{pushFrequency:.4,damping:0});
 m.stepSwingScene(interrupted,1/60,{pushFrequency:.5,damping:0});
 near(interrupted.charge,0);
 for(let i=0;i<30*60;i++)m.stepSwingScene(interrupted,1/60,{pushFrequency:.4,damping:0});
 assert.equal(interrupted.ejection,null,'Resonance has to be sustained, not accumulated across mismatched runs.');
 assert.match(m.resonanceSection.body,/min="0.1" max="1" value="0.4" step="0.1"/);
 assert.match(m.resonanceSection.body,/id="wv-swing-friction" type="checkbox" checked/);
 assert.ok(!/rs-cartoon|Tegnefilmbonus|tegnefilmbonus|tegneseriebonus|Wiiii|wv-swing-damping/.test(m.resonanceSection.body));
 return {launchAfterSeconds:undamped.firstLaunch,matchedPushes:undamped.launchPushes,dampedMaximumDegrees:ordinary.state.maxAmplitude*180/Math.PI,largestWristStep:undamped.maxJump};
}
module.exports={runResonanceChecks};
if(require.main===module)runResonanceChecks().then(result=>console.log('Resonance checks passed: '+JSON.stringify(result))).catch(error=>{console.error(error);process.exitCode=1;});
