/* Physical imagery has its own compositor layer; SVG answer paints never touch it. */
(function(root){
  'use strict';
  const identity=[1,0,0,1,0,0],instances=new WeakMap();
  const finite=value=>Number.isFinite(Number(value));
  function matrix(value){
    if(value==null)return identity.slice();
    const result=Array.isArray(value)?value.slice():['a','b','c','d','e','f'].map(key=>value[key]);
    if(result.length!==6||!result.every(finite))throw new TypeError('Basemap transform requires six finite numbers');
    return result.map(Number);
  }
  function multiply(a,b){
    return[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
  }
  function imageMatrix(bounds,transform){return multiply(matrix(transform),[1,0,0,1,Number(bounds[0]),Number(bounds[1])]);}
  function cameraMatrix({viewBox,rect,align=6,meetOrSlice=1,offsetX=0,offsetY=0}){
    const v=Array.isArray(viewBox)?viewBox:[viewBox.x,viewBox.y,viewBox.w??viewBox.width,viewBox.h??viewBox.height];
    if(v.length!==4||!v.every(finite)||!(v[2]>0&&v[3]>0&&rect.width>0&&rect.height>0))return null;
    let sx=rect.width/v[2],sy=rect.height/v[3],dx=0,dy=0;
    if(align!==1){
      const scale=meetOrSlice===2?Math.max(sx,sy):Math.min(sx,sy),index=Math.max(0,Math.min(8,Number(align)-2));
      sx=sy=scale;dx=(rect.width-v[2]*scale)*(index%3)/2;dy=(rect.height-v[3]*scale)*Math.floor(index/3)/2;
    }
    return[sx,0,0,sy,offsetX+dx-v[0]*sx,offsetY+dy-v[1]*sy];
  }
  const cssMatrix=value=>'matrix('+value.map(n=>Object.is(n,-0)?0:n).join(',')+')';
  function entries(manifest){
    if(Array.isArray(manifest))return manifest.map((entry,i)=>[String(i),entry]);
    if(manifest?.areas)return Object.entries(manifest.areas);
    if(manifest?.layers)return Array.isArray(manifest.layers)?manifest.layers.map((entry,i)=>[String(i),entry]):Object.entries(manifest.layers);
    if(manifest?.image)return[['main',manifest]];
    throw new TypeError('Basemap requires image entries or an areas/layers manifest');
  }
  function create({svg,viewport=svg?.parentElement,camera,baseUrl}={}){
    if(!svg||!viewport)throw new TypeError('Basemap requires an SVG and positioned viewport');
    const existing=instances.get(svg);if(existing)return existing;
    const doc=svg.ownerDocument,win=doc.defaultView||root;
    camera=camera||win.ClickMapZoom;
    baseUrl=baseUrl||new URL('../assets/geography/',doc.baseURI).href;
    const host=doc.createElement('div'),world=doc.createElement('div');
    host.className='map-basemap-layer';host.setAttribute('aria-hidden','true');host.hidden=true;
    Object.assign(host.style,{position:'absolute',inset:'0',overflow:'hidden',pointerEvents:'none',zIndex:'0',isolation:'isolate',contain:'strict',transform:'translateZ(0)'});
    world.className='map-basemap-world';
    Object.assign(world.style,{position:'absolute',left:'0',top:'0',width:'1px',height:'1px',overflow:'visible',transformOrigin:'0 0',willChange:'transform',contain:'layout style',pointerEvents:'none'});
    host.append(world);svg.before(host);
    // Promote the small transparent foreground independently as well. An answer
    // invalidates only its vectors; the decoded terrain remains a sibling layer.
    // Do not set a transform here: SVG coordinate and hit-test matrices stay intact.
    const previousSvgStyle={position:svg.style.position,zIndex:svg.style.zIndex,willChange:svg.style.willChange};
    svg.style.position='relative';svg.style.zIndex='1';
    const foregroundHints=(previousSvgStyle.willChange||'').split(',').map(value=>value.trim()).filter(value=>value&&value!=='auto');
    if(!foregroundHints.includes('transform'))foregroundHints.push('transform');
    svg.style.willChange=foregroundHints.join(', ');
    let disposed=false,generation=0,loaded=false,wanted=false,lastTransform='',frame=0;
    const pending=new Set();
    function readCamera(){
      const v=svg.viewBox.baseVal,p=svg.preserveAspectRatio?.baseVal;
      return{viewBox:[v.x,v.y,v.width,v.height],rect:svg.getBoundingClientRect(),align:p?.align||6,meetOrSlice:p?.meetOrSlice||1};
    }
    function sync(snapshot){
      if(disposed)return;
      const value=snapshot||readCamera(),svgRect=value.rect||svg.getBoundingClientRect(),viewportRect=viewport.getBoundingClientRect();
      const offsetX=(svgRect.left??svgRect.x??0)-(viewportRect.left??viewportRect.x??0)-(viewport.clientLeft||0)+(viewport.scrollLeft||0);
      const offsetY=(svgRect.top??svgRect.y??0)-(viewportRect.top??viewportRect.y??0)-(viewport.clientTop||0)+(viewport.scrollTop||0);
      const transform=cameraMatrix({...value,rect:svgRect,offsetX,offsetY});
      if(transform){const text=cssMatrix(transform);if(text!==lastTransform){world.style.transform=text;lastTransform=text;}}
      host.hidden=!wanted||!loaded||!transform;
    }
    function schedule(){if(!disposed&&!frame)frame=win.requestAnimationFrame(()=>{frame=0;sync();});}
    const unsubscribe=camera?.subscribe?.(sync);
    // Older/nonstandard map cameras still work, without observing answer mutations.
    const cameraObserver=!unsubscribe&&win.MutationObserver?new win.MutationObserver(schedule):null;
    cameraObserver?.observe(svg,{attributes:true,attributeFilter:['viewBox','preserveAspectRatio']});
    const resizeObserver=win.ResizeObserver?new win.ResizeObserver(schedule):null;
    resizeObserver?.observe(svg);resizeObserver?.observe(viewport);
    win.addEventListener('resize',schedule);
    function cancelPending(){for(const item of pending){item.image.removeAttribute('src');item.detach?.();}pending.clear();}
    async function set(manifest,{transforms,baseUrl:nextBase=baseUrl,signal}={}){
      if(disposed||signal?.aborted)return false;
      const token=++generation;cancelPending();loaded=false;host.hidden=true;
      try{
        const nodes=await Promise.all(entries(manifest).map(async([key,entry])=>{
          const bounds=entry.bounds||entry.viewBox;
          if(!Array.isArray(bounds)||bounds.length!==4||!bounds.every(finite)||!(bounds[2]>0&&bounds[3]>0)||typeof entry.image!=='string')throw new TypeError('Invalid physical-map image bounds');
          const image=doc.createElement('img');image.alt='';image.draggable=false;image.decoding='async';image.dataset.area=key;
          const transform=transforms instanceof Map?transforms.get(key):transforms?.[key];
          Object.assign(image.style,{position:'absolute',left:'0',top:'0',width:bounds[2]+'px',height:bounds[3]+'px',maxWidth:'none',maxHeight:'none',objectFit:'fill',imageRendering:'auto',transformOrigin:'0 0',transform:cssMatrix(imageMatrix(bounds,transform??entry.transform)),pointerEvents:'none',userSelect:'none'});
          const item={image};pending.add(item);
          let aborted;
          const abort=signal?new Promise(resolve=>{aborted=()=>{image.removeAttribute('src');resolve(false);};signal.addEventListener('abort',aborted,{once:true});item.detach=()=>signal.removeEventListener('abort',aborted);}):null;
          image.src=new URL(entry.image,new URL(nextBase,doc.baseURI)).href;
          const decoded=typeof image.decode==='function'?image.decode().then(()=>true):new Promise((resolve,reject)=>{image.onload=()=>resolve(true);image.onerror=reject;});
          try{const ready=await(abort?Promise.race([decoded,abort]):decoded);if(!ready)return null;}
          finally{pending.delete(item);item.detach?.();}
          if(entry.pixelDimensions&&(image.naturalWidth!==entry.pixelDimensions[0]||image.naturalHeight!==entry.pixelDimensions[1]))throw new Error('Physical-map image dimensions do not match manifest');
          return image;
        }));
        if(disposed||token!==generation||signal?.aborted||nodes.some(node=>!node))return false;
        world.replaceChildren(...nodes);loaded=true;sync();return true;
      }catch(error){if(disposed||token!==generation||signal?.aborted)return false;cancelPending();world.replaceChildren();loaded=false;host.hidden=true;throw error;}
    }
    function show(value=true){wanted=!!value;sync();}
    function clear(){generation++;cancelPending();loaded=false;wanted=false;world.replaceChildren();host.hidden=true;}
    function destroy(){if(disposed)return;clear();disposed=true;if(frame)win.cancelAnimationFrame(frame);unsubscribe?.();cameraObserver?.disconnect();resizeObserver?.disconnect();win.removeEventListener('resize',schedule);host.remove();svg.style.position=previousSvgStyle.position;svg.style.zIndex=previousSvgStyle.zIndex;svg.style.willChange=previousSvgStyle.willChange;instances.delete(svg);}
    const api={element:host,set,show,clear,destroy,sync,get visible(){return wanted&&loaded&&!host.hidden;}};
    instances.set(svg,api);return api;
  }
  const api={create,cameraMatrix,imageMatrix,matrix,multiply};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.MapBasemap=api;
})(typeof window!=='undefined'?window:globalThis);
