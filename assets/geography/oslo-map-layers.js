/* Real WGS84 photo tiles are reprojected behind the unchanged Oslo answer SVG. */
(function(root){
 'use strict';
 const instances=new WeakMap();
 function create({svg,viewport,map}){
  instances.get(svg)?.destroy();
  const crop=map.contextCrop||map.crop,[west,,east,north]=crop.bounds,v=map.viewBox,units=v[2]/(east-west),doc=svg.ownerDocument;
  const host=doc.createElement('div'),canvas=doc.createElement('canvas'),message=doc.createElement('div'),credit=doc.createElement('div');
  host.className='oslo-live-basemap';host.setAttribute('aria-hidden','true');host.hidden=true;canvas.className='oslo-photo-canvas';Object.assign(canvas.style,{display:'block',width:'100%',height:'100%',pointerEvents:'none'});host.append(canvas);svg.before(host);
  message.id='oslo-basemap-status';message.className='oslo-basemap-status';message.setAttribute('role','status');message.hidden=true;viewport.append(message);
  credit.className='oslo-imagery-credit';credit.hidden=true;credit.innerHTML='<a href="https://www.arcgis.com/home/item.html?id=898f58f2ee824b3c97bae0698563a4b3" target="_blank" rel="noopener">Bilder © Esri, Maxar, Earthstar Geographics og GIS User Community</a>';viewport.append(credit);
  let mode='original',disposed=false,frame=0;
  const raster=WGS84Raster.create({sourceURL:'https://wi.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer',project(lon,lat){const p=WGS84Raster.geographicToUTM(lon,lat);return [v[0]+(p[0]-west)*units,v[1]+(north-p[1])*units];},repaint:schedule,status(text){message.textContent=mode==='satellite'?text:'';message.hidden=!message.textContent;}});
  raster.setVisible(false);
  function schedule(){if(!disposed&&!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});}
  function draw(){
   if(disposed)return;host.hidden=mode!=='satellite';if(mode!=='satellite')return;
   const r=svg.getBoundingClientRect(),pr=viewport.getBoundingClientRect(),box=svg.viewBox.baseVal,p=svg.preserveAspectRatio.baseVal;
   const m=MapBasemap.cameraMatrix({viewBox:[box.x,box.y,box.width,box.height],rect:r,align:p.align,meetOrSlice:p.meetOrSlice,offsetX:r.left-pr.left-viewport.clientLeft,offsetY:r.top-pr.top-viewport.clientTop});if(!m)return;
   const width=viewport.clientWidth,height=viewport.clientHeight,dpr=Math.min(root.devicePixelRatio||1,2),ctx=canvas.getContext('2d');if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
   const left=(0-m[4])/m[0],right=(width-m[4])/m[0],top=(0-m[5])/m[3],bottom=(height-m[5])/m[3];
   const minE=west+(left-v[0])/units,maxE=west+(right-v[0])/units,maxN=north-(top-v[1])/units,minN=north-(bottom-v[1])/units;
   raster.draw(ctx,{width,height,utmBounds:[minE,minN,maxE,maxN],pixelsPerMetre:units*Math.max(Math.abs(m[0]),Math.abs(m[3])),screen:(x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]});
  }
  function set(value){mode=value==='satellite'?'satellite':'original';host.hidden=mode!=='satellite';credit.hidden=mode!=='satellite';raster.setVisible(mode==='satellite');if(mode==='satellite')raster.retry();draw();}
  const unsubscribe=root.ClickMapZoom?.subscribe?.(schedule),observer=new MutationObserver(schedule);observer.observe(svg,{attributes:true,attributeFilter:['viewBox','preserveAspectRatio']});const resize=new ResizeObserver(schedule);resize.observe(viewport);root.addEventListener('resize',schedule);
  const api={set,clear(){set('original');},snapshot(){return {mode,...raster.snapshot()};},destroy(){disposed=true;if(frame)cancelAnimationFrame(frame);raster.destroy();unsubscribe?.();observer.disconnect();resize.disconnect();root.removeEventListener('resize',schedule);host.remove();message.remove();credit.remove();instances.delete(svg);}};
  instances.set(svg,api);return api;
 }
 root.OsloMapLayers={create,get:svg=>instances.get(svg)};
})(window);
