// A local simulation clock for each model, independent of wall-clock time.
export function createAnimationClock({reducedMotion=false}={}){
 const groups=new Map();
 let preferReduced=!!reducedMotion;
 const ensure=key=>{
  if(!groups.has(key))groups.set(key,{time:0,manualPaused:null,isActive:()=>true,callbacks:new Set()});
  return groups.get(key);
 };
 const paused=group=>group.manualPaused??preferReduced;
 const active=group=>group.callbacks.size>0&&group.isActive();
 return {
  onFrame(fn,key,{isActive}={}){
   const group=ensure(key);
   if(isActive)group.isActive=isActive;
   group.callbacks.add(fn);
   fn(group.time);
   return ()=>group.callbacks.delete(fn);
  },
  advance(dt){
   const step=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;
   for(const group of groups.values())if(active(group)&&!paused(group)){
    group.time+=step;
    for(const fn of group.callbacks)fn(group.time);
   }
  },
  repaint(key){
   const selection=arguments.length?[ensure(key)]:groups.values();
   for(const group of selection)for(const fn of group.callbacks)fn(group.time);
  },
  now:key=>ensure(key).time,
  isPaused:key=>paused(ensure(key)),
  setPaused(key,value){ensure(key).manualPaused=!!value;},
  toggle(key){const group=ensure(key);group.manualPaused=!paused(group);return paused(group);},
  setReducedMotion(value){preferReduced=!!value;},
  hasRunning(){return [...groups.values()].some(group=>active(group)&&!paused(group));},
  scopes(){return [...groups].filter(([,group])=>group.callbacks.size).map(([key])=>key);},
  clear(){groups.clear();}
 };
}
