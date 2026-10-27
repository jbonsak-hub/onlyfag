/* MapWiz zooms the shared map surface; geographic clicks use its actual rect. */
(() => {
 'use strict';
 let active=null,saved=null;
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 const mercator=latitude=>Math.log(Math.tan(Math.PI/4+latitude*Math.PI/360));
 function attach(scroll,metadata){
  if(!scroll?.isConnected||!metadata)return;
  const content=scroll.querySelector('.geo-world-content');if(!content)return;
  // Keep SVG layout fixed and scale a composited layer: resizing its viewport
  // on each wheel event would rerasterize thousands of water paths per frame.
  const water=content.querySelector('.geo-map-water');if(water){water.style.width=metadata.width+'px';water.style.height=metadata.height+'px';water.style.transformOrigin='0 0';water.style.willChange='transform';}
  if(active?.scroll===scroll)return;
  active?.destroy();
  const run=typeof geoGuessrState!=='undefined'?geoGuessrState?.startedAt:null;
  const fullTop=mercator(metadata.top),fullBottom=mercator(metadata.bottom),fullSpan=fullTop-fullBottom;
  const initial=metadata.initialView||metadata,initialTop=mercator(initial.top),initialBottom=mercator(initial.bottom),initialSpan=initialTop-initialBottom;
  const initialCenter={x:.5,y:(fullTop-initialTop+initialSpan/2)/fullSpan};
  if(!saved||saved.run!==run)saved={run,zoom:1,center:{...initialCenter}};
  const abort=new AbortController(),signal=abort.signal,pointers=new Map();
  let size=null,gesture=null,suppressUntil=0,frame=0,restoring=false;
  scroll.style.setProperty('position','absolute');scroll.style.setProperty('inset','0');scroll.style.setProperty('width','100%');scroll.style.setProperty('height','100%');
  scroll.style.setProperty('overflow','auto','important');scroll.style.setProperty('touch-action','none','important');scroll.style.setProperty('overscroll-behavior','contain');scroll.style.setProperty('scrollbar-width','none');scroll.style.setProperty('cursor','crosshair');
  content.style.setProperty('position','relative');content.style.setProperty('max-width','none');content.style.setProperty('max-height','none');
  function save(){if(!size||restoring)return;saved.center={x:(scroll.scrollLeft+size.vw/2)/content.offsetWidth,y:(scroll.scrollTop+size.vh/2)/content.offsetHeight};}
  function position(zoom,anchor,point){
   if(!size)return;
   saved.zoom=clamp(zoom,1,6);restoring=true;
   const width=size.baseWidth*saved.zoom,height=size.baseHeight*saved.zoom;
   content.style.setProperty('width',width+'px','important');content.style.setProperty('height',height+'px','important');
   if(water)water.style.transform=`scale(${width/metadata.width},${height/metadata.height})`;
   scroll.scrollLeft=anchor.x*width-point.x;scroll.scrollTop=anchor.y*height-point.y;
   restoring=false;save();
  }
  function layout(){
   if(!scroll.isConnected)return;
   const vw=scroll.clientWidth,vh=scroll.clientHeight;if(!vw||!vh)return;
   size={vw,vh,baseWidth:innerWidth<=700?2*vh:vw,baseHeight:vh*fullSpan/initialSpan};
   position(saved.zoom,saved.center,{x:vw/2,y:vh/2});
  }
  function local(clientX,clientY){const rect=scroll.getBoundingClientRect();return {x:clientX-rect.left,y:clientY-rect.top};}
  function zoomAt(zoom,point){if(!size)return;const anchor={x:(scroll.scrollLeft+point.x)/content.offsetWidth,y:(scroll.scrollTop+point.y)/content.offsetHeight};position(zoom,anchor,point);}
  function reset(){saved.zoom=1;saved.center={...initialCenter};layout();}
  scroll.addEventListener('wheel',event=>{if(!size)return;event.preventDefault();event.stopPropagation();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?size.vh:1);zoomAt(saved.zoom*Math.exp(-delta*.0015),local(event.clientX,event.clientY));},{passive:false,signal});
  scroll.addEventListener('scroll',save,{passive:true,signal});
  function pinch(){const [a,b]=[...pointers.values()],point=local((a.x+b.x)/2,(a.y+b.y)/2);return {distance:Math.hypot(a.x-b.x,a.y-b.y),point};}
  function beginPinch(){const p=pinch();gesture={mode:'pinch',distance:p.distance,zoom:saved.zoom,anchor:{x:(scroll.scrollLeft+p.point.x)/content.offsetWidth,y:(scroll.scrollTop+p.point.y)/content.offsetHeight}};suppressUntil=performance.now()+700;}
  scroll.addEventListener('pointerdown',event=>{
   if(event.pointerType==='mouse'&&event.button!==0)return;
   pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});scroll.setPointerCapture(event.pointerId);
   if(pointers.size>=2){beginPinch();event.preventDefault();event.stopPropagation();}
   else gesture={mode:'pan',x:event.clientX,y:event.clientY,left:scroll.scrollLeft,top:scroll.scrollTop,moved:false};
  },{signal});
  scroll.addEventListener('pointermove',event=>{
   if(!pointers.has(event.pointerId)||!gesture||!size)return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
   if(pointers.size>=2){if(gesture.mode!=='pinch')beginPinch();const p=pinch();position(gesture.zoom*p.distance/Math.max(1,gesture.distance),gesture.anchor,p.point);suppressUntil=performance.now()+700;event.preventDefault();event.stopPropagation();return;}
   if(gesture.mode!=='pan')return;const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;if(Math.hypot(dx,dy)>5)gesture.moved=true;if(!gesture.moved)return;
   scroll.scrollLeft=gesture.left-dx;scroll.scrollTop=gesture.top-dy;scroll.classList.add('is-panning');scroll.style.cursor='grabbing';save();suppressUntil=performance.now()+700;event.preventDefault();event.stopPropagation();
  },{signal});
  function end(event){
   if(!pointers.has(event.pointerId))return;const moved=gesture?.mode==='pinch'||gesture?.moved;pointers.delete(event.pointerId);if(moved){suppressUntil=performance.now()+700;event.preventDefault();event.stopPropagation();}
   if(scroll.hasPointerCapture(event.pointerId))scroll.releasePointerCapture(event.pointerId);
   if(pointers.size===1){const point=[...pointers.values()][0];gesture={mode:'pan',x:point.x,y:point.y,left:scroll.scrollLeft,top:scroll.scrollTop,moved:!!moved};}else if(!pointers.size)gesture=null;
   scroll.classList.remove('is-panning');scroll.style.cursor='crosshair';save();
  }
  scroll.addEventListener('pointerup',end,{signal});scroll.addEventListener('pointercancel',end,{signal});scroll.addEventListener('lostpointercapture',event=>{if(pointers.has(event.pointerId))end(event);},{signal});
  scroll.addEventListener('click',event=>{if(performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}},{capture:true,signal});
  const resize=new ResizeObserver(layout);resize.observe(scroll);layout();frame=requestAnimationFrame(layout);
  active={scroll,reset,getState:()=>({zoom:saved.zoom,center:{...saved.center},left:scroll.scrollLeft,top:scroll.scrollTop,width:content.offsetWidth,height:content.offsetHeight,viewport:size?{width:size.vw,height:size.vh}:null}),destroy(){cancelAnimationFrame(frame);resize.disconnect();abort.abort();}};
 }
 window.MapWizZoom={attach,reset:()=>active?.reset(),getState:()=>active?.getState()||null};
})();
