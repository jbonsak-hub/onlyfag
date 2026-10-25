/* Local SVG camera: wheel, touch pinch, drag, buttons and keyboard. */
(() => {
  const svg=document.getElementById('map');if(!svg)return;
  const read=()=>{const v=svg.viewBox.baseVal;return {x:v.x,y:v.y,w:v.width,h:v.height};};
  let base=read(),view={...base},camera=null,suppressUntil=0,last=null,pinch=null,paintFrame=0,lastView='',markerScale='';
  const pointers=new Map(),point=(x,y)=>new DOMPoint(x,y).matrixTransform(svg.getScreenCTM().inverse());
  const scale=()=>base.w/view.w;
  function render(){if(!paintFrame)paintFrame=requestAnimationFrame(()=>{paintFrame=0;paint();});}
  function paint(){
    view.w=Math.min(base.w,Math.max(base.w/14,view.w));view.h=view.w*base.h/base.w;
    view.x=Math.max(base.x,Math.min(base.x+base.w-view.w,view.x));view.y=Math.max(base.y,Math.min(base.y+base.h-view.h,view.y));
    const rect=svg.getBoundingClientRect(),stretch=svg.preserveAspectRatio.baseVal.align===1;
    const screenScale=stretch?rect.width/view.w:Math.min(rect.width/view.w,rect.height/view.h),screenScaleY=stretch?rect.height/view.h:screenScale;
    const nextView=`${view.x} ${view.y} ${view.w} ${view.h}`;
    if(nextView!==lastView){svg.setAttribute('viewBox',nextView);lastView=nextView;}
    // Keep small-country targets usable without turning them into giant dots.
    const nextScale=screenScale+','+screenScaleY;
    if(screenScale>0&&markerScale!==nextScale){markerScale=nextScale;svg.querySelectorAll('.small-marker').forEach(marker=>{const circle=marker.querySelector('circle'),x=circle.cx.baseVal.value,y=circle.cy.baseVal.value;marker.setAttribute('transform',`translate(${x} ${y}) scale(${1/screenScale} ${1/screenScaleY}) translate(${-x} ${-y})`);});}
    svg.classList.toggle('map-is-zoomed',scale()>1.01);
    const out=document.getElementById('map-zoom-value'),label=Math.round(scale()*100)+'%';if(out&&out.textContent!==label)out.textContent=label;
    const minus=document.getElementById('map-zoom-out'),plus=document.getElementById('map-zoom-in');if(minus)minus.disabled=scale()<=1.001;if(plus)plus.disabled=scale()>=13.999;
  }
  function zoom(factor,client){const anchor=client?point(client.x,client.y):{x:view.x+view.w/2,y:view.y+view.h/2},width=Math.max(base.w/14,Math.min(base.w,view.w/factor)),ratio=width/view.w;view={x:anchor.x-(anchor.x-view.x)*ratio,y:anchor.y-(anchor.y-view.y)*ratio,w:width,h:view.h*ratio};render();}
  function reset(){pointers.clear();last=null;pinch=null;view={...base};render();}
  function resizeCamera(){
    if(!camera)return render();
    const rect=svg.getBoundingClientRect();
    // A hidden map will receive its real camera when ResizeObserver sees it.
    if(!(rect.width>0&&rect.height>0))return render();
    const aspect=rect.width/rect.height,height=Math.max(camera.height,camera.minWidth/aspect),width=height*aspect;
    const zoomLevel=scale(),atHome=zoomLevel<=1.001;
    const center=atHome?camera.center:[view.x+view.w/2,view.y+view.h/2];
    base={x:camera.center[0]-width/2,y:camera.center[1]-height/2,w:width,h:height};
    const w=width/(atHome?1:zoomLevel),h=height/(atHome?1:zoomLevel);
    view={x:center[0]-w/2,y:center[1]-h/2,w,h};
    // Matching the actual SVG aspect ratio gives one uniform screen scale and
    // anchors the declared centre in the visible viewport, without letterboxes.
    render();
  }
  function setBase(value){
    let next=null;
    if(value!=null){
      if(!Array.isArray(value.center)||value.center.length!==2||!value.center.every(Number.isFinite)||
         !Number.isFinite(value.height)||value.height<=0||!Number.isFinite(value.minWidth)||value.minWidth<0)
        throw new TypeError('Map camera requires a finite center, positive height and nonnegative minWidth');
      next={center:[...value.center],height:value.height,minWidth:value.minWidth};
    }
    camera=next;base=read();lastView='';markerScale='';
    // Set the new map to home before deriving its responsive base. Subsequent
    // resizes preserve the user's zoom level and world-space view centre.
    view={...base};
    if(camera)resizeCamera();
    reset();
  }
  window.ClickMapZoom={setBase,reset,zoom};
  addEventListener('resize',resizeCamera);
  if(window.ResizeObserver)new ResizeObserver(()=>{if(camera)resizeCamera();}).observe(svg);
  document.getElementById('map-zoom-in')?.addEventListener('click',()=>zoom(1.5));document.getElementById('map-zoom-out')?.addEventListener('click',()=>zoom(1/1.5));document.getElementById('map-zoom-reset')?.addEventListener('click',reset);
  svg.addEventListener('wheel',event=>{event.preventDefault();zoom(Math.exp(-Math.max(-150,Math.min(150,event.deltaY))*.004),{x:event.clientX,y:event.clientY});},{passive:false});
  svg.addEventListener('keydown',event=>{if(['+','=','-','0'].includes(event.key)){event.preventDefault();if(event.key==='0')reset();else zoom(event.key==='-'?1/1.5:1.5);}});
  function gesture(){const a=[...pointers.values()];if(a.length<2)return null;return {distance:Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y),x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};}
  svg.addEventListener('pointerdown',event=>{if(event.button!==0)return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size===1)last={id:event.pointerId,x:event.clientX,y:event.clientY,dragged:false};else{pinch=gesture();suppressUntil=performance.now()+400;}});
  addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size>1){const next=gesture();if(pinch&&pinch.distance>0&&next.distance>0)zoom(next.distance/pinch.distance,next);pinch=next;suppressUntil=performance.now()+400;return;}
    if(!last||scale()<=1.001)return;const dx=event.clientX-last.x,dy=event.clientY-last.y;if(!last.dragged&&Math.hypot(dx,dy)<5)return;
    const matrix=svg.getScreenCTM();view.x-=dx/matrix.a;view.y-=dy/matrix.d;last={id:event.pointerId,x:event.clientX,y:event.clientY,dragged:true};suppressUntil=performance.now()+350;render();
  });
  function end(event){if(!pointers.has(event.pointerId))return;if(last?.dragged||pointers.size>1||event.type==='pointercancel')suppressUntil=performance.now()+350;pointers.delete(event.pointerId);pinch=null;last=pointers.size===1?{id:[...pointers.keys()][0],...pointers.values().next().value,dragged:false}:null;}
  addEventListener('pointerup',end);addEventListener('pointercancel',end);
  svg.addEventListener('click',event=>{if(performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
  reset();
})();
