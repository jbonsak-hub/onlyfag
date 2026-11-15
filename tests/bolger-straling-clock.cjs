const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

(async()=>{
 const {createAnimationClock}=await import(pathToFileURL(path.resolve(__dirname,'../prototyper/bolger-straling/animation-clock.js')).href);
 const clock=createAnimationClock(),a=[],b=[];let visible=true;
 const stopA=clock.onFrame(t=>a.push(t),'A',{isActive:()=>visible});
 clock.onFrame(t=>b.push(t),'B');
 assert.deepEqual(a,[0]);assert.deepEqual(b,[0]);
 clock.advance(.04);assert.equal(a.at(-1),.04);assert.equal(b.at(-1),.04);
 clock.setPaused('A',true);clock.advance(.05);assert.equal(a.at(-1),.04);assert.equal(b.at(-1),.09);
 clock.repaint('A');assert.equal(a.at(-1),.04,'A paused model repaints without advancing its simulation.');
 clock.setPaused('A',false);clock.advance(.02);assert.ok(Math.abs(a.at(-1)-.06)<1e-12,'Resume cannot catch up on time spent paused.');
 visible=false;clock.advance(.1);assert.ok(Math.abs(a.at(-1)-.06)<1e-12);visible=true;clock.advance(.01);assert.ok(Math.abs(a.at(-1)-.07)<1e-12,'Hidden models resume without a time jump.');
 const before=clock.now('A');clock.advance(20);assert.ok(Math.abs(clock.now('A')-before-.1)<1e-12,'An interrupted browser frame cannot cause a large physics step.');
 const current=clock.now('A');clock.advance(-1);clock.advance(NaN);assert.equal(clock.now('A'),current);
 stopA();assert.ok(!clock.scopes().includes('A'));clock.clear();assert.deepEqual(clock.scopes(),[]);assert.equal(clock.hasRunning(),false);assert.equal(clock.now('new'),0);assert.equal(clock.hasRunning(),false);

 const motion=createAnimationClock({reducedMotion:true}),first=[],second=[];
 motion.onFrame(t=>first.push(t),'default');motion.onFrame(t=>second.push(t),'manual');
 assert.equal(motion.hasRunning(),false);motion.setPaused('manual',false);motion.advance(.1);assert.equal(first.at(-1),0);assert.equal(second.at(-1),.1);
 motion.setReducedMotion(false);motion.advance(.1);assert.equal(first.at(-1),.1);assert.equal(second.at(-1),.2);
 motion.setPaused('default',true);motion.setReducedMotion(true);motion.setReducedMotion(false);motion.advance(.1);assert.equal(first.at(-1),.1,'Explicit pause survives a change in motion preference.');assert.ok(Math.abs(second.at(-1)-.3)<1e-12);
 motion.setPaused('manual',true);assert.equal(motion.hasRunning(),false);assert.equal(motion.toggle('manual'),false);assert.equal(motion.hasRunning(),true);

 const shared=createAnimationClock(),left=[],right=[];
 shared.onFrame(t=>left.push(t),'same-model');shared.onFrame(t=>right.push(t),'same-model');shared.advance(.08);
 assert.deepEqual(left,[0,.08]);assert.deepEqual(right,[0,.08],'Callbacks in one model share one elapsed time.');assert.equal(shared.scopes().length,1);
 console.log('Animation clock checks passed: independent pause, frozen repaint, no resume jumps, hidden scopes, reduced-motion overrides, shared model time and teardown.');
})().catch(error=>{console.error(error);process.exitCode=1;});
