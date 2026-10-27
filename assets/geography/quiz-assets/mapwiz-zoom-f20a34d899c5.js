/* MapWiz zooms the shared map surface; geographic clicks use its actual rect. */
(() => {
 'use strict';
 let active=null,saved=null;
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 const mercator=latitude=>Math.log(Math.tan(Math.PI/4+latitude*Math.PI/360));
 function installStyle(){
  if(document.getElementById('mapwiz-zoom-style'))return;
  const style=document.createElement('style');style.id='mapwiz-zoom-style';
  style.textContent='.mapwiz-zoom-controls{position:absolute;right:14px;top:58px;z-index:24;display:flex;flex-direction:column;gap:1px;padding:3px;border:1px solid var(--q-line,#d1dfc8);border-radius:8px;background:var(--q-paper,#fffefa);box-shadow:0 2px 9px #173b3322}.mapwiz-zoom-controls button{display:grid;place-items:center;min-width:34px;min-height:34px;padding:3px;border:0;border-radius:5px;background:var(--q-paper,#fffefa);color:var(--q-ink,#294d43);font:700 22px/1 Arial,sans-serif;cursor:pointer}.mapwiz-zoom-controls button:hover{background:var(--q-soft,#e9f0e1)}.mapwiz-zoom-controls button:focus-visible{outline:2px solid var(--q-green,#235b48);outline-offset:1px}.mapwiz-zoom-controls button:disabled{opacity:.4;cursor:default}.mapwiz-zoom-controls [data-mapwiz-zoom="reset"]{font-size:20px}@media(max-width:700px){.mapwiz-zoom-controls{right:10px;top:54px}.mapwiz-zoom-controls button{min-width:32px;min-height:32px}}';
  document.head.append(style);
 }
 function attach(scroll,metadata){
  if(!scroll?.isConnected||!metadata)return;
  const content=scroll.querySelector('.geo-world-content');if(!content)return;
  // Keep SVG layout fixed and scale a composited layer: resizing its viewport
  // on each wheel event would rerasterize thousands of water paths per frame.
  const water=content.querySelector('.geo-map-water');if(water){water.style.width=metadata.width+'px';water.style.height=metadata.height+'px';water.style.transformOrigin='0 0';water.style.willChange='transform';}
  if(active?.scroll===scroll)return;
  active?.destroy();installStyle();
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
  const controls=document.createElement('div');controls.className='mapwiz-zoom-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Kartzoom');
  controls.innerHTML='<button type="button" data-mapwiz-zoom="in" aria-label="Zoom inn" title="Zoom inn">+</button><button type="button" data-mapwiz-zoom="out" aria-label="Zoom ut" title="Zoom ut">−</button><button type="button" data-mapwiz-zoom="reset" aria-label="Nullstill zoom" title="Nullstill zoom">↺</button>';
  scroll.parentElement.querySelector('.mapwiz-zoom-controls')?.remove();scroll.parentElement.append(controls);
  const buttonIn=controls.querySelector('[data-mapwiz-zoom="in"]'),buttonOut=controls.querySelector('[data-mapwiz-zoom="out"]');
  function save(){if(!size||restoring)return;saved.center={x:(scroll.scrollLeft+size.vw/2)/content.offsetWidth,y:(scroll.scrollTop+size.vh/2)/content.offsetHeight};}
  function position(zoom,anchor,point){
   if(!size)return;
   saved.zoom=clamp(zoom,1,6);restoring=true;
   const width=size.baseWidth*saved.zoom,height=size.baseHeight*saved.zoom;
   content.style.setProperty('width',width+'px','important');content.style.setProperty('height',height+'px','important');
   if(water)water.style.transform=`scale(${width/metadata.width},${height/metadata.height})`;
   scroll.scrollLeft=anchor.x*width-point.x;scroll.scrollTop=anchor.y*height-point.y;
   restoring=false;save();buttonIn.disabled=saved.zoom>=6-1e-6;buttonOut.disabled=saved.zoom<=1+1e-6;
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
  controls.addEventListener('pointerdown',event=>event.stopPropagation(),{signal});controls.addEventListener('click',event=>{event.stopPropagation();const button=event.target.closest('button');if(!button||!size)return;const action=button.dataset.mapwizZoom;if(action==='reset')reset();else zoomAt(saved.zoom*(action==='in'?1.4:1/1.4),{x:size.vw/2,y:size.vh/2});},{signal});
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
  active={scroll,reset,getState:()=>({zoom:saved.zoom,center:{...saved.center},left:scroll.scrollLeft,top:scroll.scrollTop,width:content.offsetWidth,height:content.offsetHeight,viewport:size?{width:size.vw,height:size.vh}:null}),destroy(){cancelAnimationFrame(frame);resize.disconnect();abort.abort();controls.remove();}};
 }
 window.MapWizZoom={attach,reset:()=>active?.reset(),getState:()=>active?.getState()||null};
})();
