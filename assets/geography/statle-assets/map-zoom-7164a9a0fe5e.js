/* Local SVG camera: wheel, touch pinch, drag, buttons and keyboard. */
(() => {
  const svg=document.getElementById('map');if(!svg)return;
  const read=()=>{const v=svg.viewBox.baseVal;return {x:v.x,y:v.y,w:v.width,h:v.height};};
  let base=read(),view={...base},suppressUntil=0,last=null,pinch=null;
  const pointers=new Map(),point=(x,y)=>new DOMPoint(x,y).matrixTransform(svg.getScreenCTM().inverse());
  const scale=()=>base.w/view.w;
  function render(){
    view.w=Math.min(base.w,Math.max(base.w/14,view.w));view.h=view.w*base.h/base.w;
    view.x=Math.max(base.x,Math.min(base.x+base.w-view.w,view.x));view.y=Math.max(base.y,Math.min(base.y+base.h-view.h,view.y));
    svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);
    // Keep small-country targets usable without turning them into giant dots.
    const screenScale=svg.getScreenCTM()?.a;
    if(screenScale>0)svg.querySelectorAll('.small-marker').forEach(marker=>{const circle=marker.querySelector('circle'),x=circle.cx.baseVal.value,y=circle.cy.baseVal.value;marker.setAttribute('transform',`translate(${x} ${y}) scale(${1/screenScale}) translate(${-x} ${-y})`);});
    svg.classList.toggle('map-is-zoomed',scale()>1.01);
    const out=document.getElementById('map-zoom-value');if(out)out.textContent=Math.round(scale()*100)+'%';
    const minus=document.getElementById('map-zoom-out'),plus=document.getElementById('map-zoom-in');if(minus)minus.disabled=scale()<=1.001;if(plus)plus.disabled=scale()>=13.999;
  }
  function zoom(factor,client){const anchor=client?point(client.x,client.y):{x:view.x+view.w/2,y:view.y+view.h/2},width=Math.max(base.w/14,Math.min(base.w,view.w/factor)),ratio=width/view.w;view={x:anchor.x-(anchor.x-view.x)*ratio,y:anchor.y-(anchor.y-view.y)*ratio,w:width,h:view.h*ratio};render();}
  function reset(){pointers.clear();last=null;pinch=null;view={...base};render();}
  window.ClickMapZoom={setBase(){base=read();reset();},reset,zoom};
  addEventListener('resize',render);
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
