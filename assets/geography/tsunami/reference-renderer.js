/* Native SVG replay of inert, extracted vector/timeline data. No Flash or ActionScript.
   Source artwork: forskning.no, user-provided 'Slik oppstår en tsunami' reference. */
(() => {
  'use strict';
  const data = window.TsunamiReference;
  if (!data) return;
  const clamp = n => Math.max(0, Math.min(1, n));
  const number = n => Math.abs(n) < .00001 ? '0' : String(Math.round(n * 100000) / 100000);
  const matrix = values => 'matrix(' + values.map(number).join(' ') + ')';
  const mix = (a,b,t) => a.map((v,i) => v + (b[i] - v) * t);
  const color = values => '#' + values.slice(0,3).map(v => Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
  function paint(style, ratio, id) {
    if (style.type === 0) {
      const c = mix(style.color,style.endColor || style.color,ratio);
      return {attributes:`fill="${color(c)}" fill-opacity="${number(c[3]/255)}"`,defs:''};
    }
    if (![16,18,19].includes(style.type)) return {attributes:'fill="none"',defs:''};
    const radial = style.type !== 16, tag = radial ? 'radialGradient' : 'linearGradient';
    const coordinates = radial ? 'cx="0" cy="0" r="16384"' : 'x1="-16384" x2="16384" y1="0" y2="0"';
    const transform = matrix(mix(style.matrix,style.endMatrix || style.matrix,ratio));
    const spread = ['pad','reflect','repeat','pad'][style.spread || 0];
    const stops = style.stops.map(stop => {
      const c = mix(stop.color,stop.endColor || stop.color,ratio);
      const offset = (stop.ratio + ((stop.endRatio ?? stop.ratio) - stop.ratio) * ratio) / 255;
      return `<stop offset="${number(offset)}" stop-color="${color(c)}" stop-opacity="${number(c[3]/255)}"/>`;
    }).join('');
    return {attributes:`fill="url(#${id})"`,defs:`<${tag} id="${id}" gradientUnits="userSpaceOnUse" ${coordinates} gradientTransform="${transform}" spreadMethod="${spread}">${stops}</${tag}>`};
  }
  function path(edges, chains, close) {
    let d = '';
    for (const chain of chains) {
      let first = true;
      for (const [index,reverse] of chain) {
        const e = edges[index];
        const [x,y,cx,cy,ex,ey] = reverse ? [e[4],e[5],e[2],e[3],e[0],e[1]] : e;
        if (first) {d += `M${number(x)} ${number(y)}`; first = false;}
        if (Math.abs(cx-(x+ex)/2)<.00001 && Math.abs(cy-(y+ey)/2)<.00001) d += `L${number(ex)} ${number(ey)}`;
        else d += `Q${number(cx)} ${number(cy)} ${number(ex)} ${number(ey)}`;
      }
      if (close) d += 'Z';
    }
    return d;
  }
  function morph(asset, ratio, prefix) {
    const t = clamp(ratio / 65535), edges = asset.edges.map((edge,i) => mix(edge,asset.endEdges[i],t));
    let svg = '', defs = '';
    for (const [style,chains] of Object.entries(asset.fillChains)) {
      const fill = paint(asset.fills[Number(style)-1],t,prefix+'-fill-'+style);
      defs += fill.defs;
      svg += `<path d="${path(edges,chains,true)}" ${fill.attributes} fill-rule="evenodd"/>`;
    }
    for (const [style,chains] of Object.entries(asset.lineChains)) {
      const line = asset.lines[Number(style)-1], c = mix(line.color,line.endColor,t);
      const width = line.width + (line.endWidth-line.width)*t;
      svg += `<path d="${path(edges,chains,false)}" fill="none" stroke="${color(c)}" stroke-opacity="${number(c[3]/255)}" stroke-width="${number(width)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return (defs ? '<defs>'+defs+'</defs>' : '') + svg;
  }
  function colorTransform(values,id) {
    if (values.slice(0,3).every(v => v===1) && values.slice(4).every(v => v===0)) {
      return {attribute: values[3]===1 ? '' : ` opacity="${number(clamp(values[3]))}"`,defs:''};
    }
    const [r,g,b,a,ra,ga,ba,aa] = values;
    const m = [r,0,0,0,ra/255, 0,g,0,0,ga/255, 0,0,b,0,ba/255, 0,0,0,a,aa/255];
    return {attribute:` filter="url(#${id})"`,defs:`<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${m.map(number).join(' ')}"/></filter>`};
  }
  const namespace='http://www.w3.org/2000/svg';
  const roots=new WeakMap();
  const create=(tag,attributes={})=>{
    const node=document.createElementNS(namespace,tag);
    for(const [name,value] of Object.entries(attributes))node.setAttribute(name,value);
    return node;
  };
  function attribute(node,name,value){
    if(node.getAttribute(name)!==value)node.setAttribute(name,value);
  }
  // Each SWF depth keeps its SVG nodes. A moving arrow now changes its matrix
  // instead of reparsing the entire map, all text, masks and gradient filters.
  function retainedDisplay(state,movie,frame,extra,prefix,depth=0){
    if(depth>12||!movie.frames.length)return;
    const index=Math.max(0,Math.min(movie.frames.length-1,Math.floor(frame)));
    const active=new Set(),parents=new Map(),masks=[];
    let parent=state.container;
    parents.set(parent,null);
    const place=(container,node)=>{
      const last=parents.get(container),next=last?last.nextSibling:container.firstChild;
      if(next!==node)container.insertBefore(node,next);
      parents.set(container,node);
    };
    for(const [level,id,transform,cx,ratio,clip,placed] of movie.frames[index]){
      while(masks.length&&level>masks[masks.length-1].end){masks.pop();parent=masks.length?masks[masks.length-1].container:state.container;}
      const asset=data.assets[id];
      if(!asset||asset.type==='ignored'||(cx[3]===0&&cx[7]===0))continue;
      const key=prefix+'-'+level,entryKey=level+':'+id+':'+clip;
      let entry=state.entries.get(entryKey);
      if(!entry){
        const outer=create('g');
        entry={outer,asset,id,clip};
        if(clip){
          entry.mask=create('clipPath',{id:key+'-mask',clipPathUnits:'userSpaceOnUse'});
          const definitions=create('defs');definitions.append(entry.mask);
          entry.content=create('g',{'clip-path':'url(#'+key+'-mask)'});
          outer.append(definitions,entry.content);
        }else{
          outer.setAttribute('transform','');outer.setAttribute('opacity','1');outer.setAttribute('filter','none');
          outer.setAttribute('data-reference-id',String(id));outer.setAttribute('data-reference-type',asset.type);
          entry.definitions=create('defs');entry.content=create('g');
          outer.append(entry.definitions,entry.content);
          entry.children={container:entry.content,entries:new Map()};
          if(asset.type!=='sprite'&&asset.type!=='morph')entry.content.append(create('use',{href:'#ts-ref-asset-'+id}));
        }
        state.entries.set(entryKey,entry);
      }
      active.add(entryKey);place(parent,entry.outer);
      if(clip){
        const maskSignature=ratio+':'+transform.join(',');
        if(entry.maskSignature!==maskSignature){
          let geometry;
          if(asset.type==='morph'){
            const t=clamp(ratio/65535),edges=asset.edges.map((edge,i)=>mix(edge,asset.endEdges[i],t));
            geometry=Object.values(asset.fillChains).map(chains=>`<path d="${path(edges,chains,true)}" transform="${matrix(transform)}" fill-rule="evenodd"/>`).join('');
          }else geometry=(asset.clip||'').replaceAll('<path ',`<path transform="${matrix(transform)}" `);
          entry.mask.innerHTML=geometry;entry.maskSignature=maskSignature;
        }
        parent=entry.content;parents.set(parent,null);masks.push({end:clip,container:parent});
        continue;
      }
      attribute(entry.outer,'transform',matrix(transform));
      const colorSignature=cx.join(',');
      if(entry.colorSignature!==colorSignature){
        const transformed=!cx.slice(0,3).every(v=>v===1)||!cx.slice(4).every(v=>v===0);
        attribute(entry.outer,'opacity',transformed?'1':number(clamp(cx[3])));
        attribute(entry.outer,'filter',transformed?'url(#'+key+'-color)':'none');
        entry.definitions.innerHTML=transformed?colorTransform(cx,key+'-color').defs:'';
        entry.colorSignature=colorSignature;
      }
      if(asset.type==='sprite'){
        const child=data.sprites[id];
        if(child&&child.frames.length){
          const age=Math.max(0,index-placed+extra),childFrame=Math.floor(age)%child.frames.length;
          retainedDisplay(entry.children,child,childFrame,child.frames.length===1?age:age-Math.floor(age),key,depth+1);
        }
      }else if(asset.type==='morph'&&entry.ratio!==ratio){
        entry.content.innerHTML=morph(asset,ratio,key);entry.ratio=ratio;
      }
    }
    // Reconcile ordering after depth/mask changes, while preserving unchanged
    // elements and their browser-side SVG geometry caches.
    for(const [container,last] of parents){
      let obsolete=last?last.nextSibling:container.firstChild;
      while(obsolete){const next=obsolete.nextSibling;obsolete.remove();obsolete=next;}
    }
    for(const [key,entry] of state.entries)if(!active.has(key)){entry.outer.remove();state.entries.delete(key);}
  }
  function render(root, frame, elapsedFrames=0) {
    if (!root) return;
    const svg = root.ownerSVGElement || root;
    let defs = svg.querySelector('#reference-defs');
    if (!defs) {defs=document.createElementNS('http://www.w3.org/2000/svg','defs');defs.id='reference-defs';svg.prepend(defs);}
    if (!defs.dataset.referenceReady) {
      const [x,y,width,height]=data.crop;
      // A viewBox sets the camera; an explicit clip also protects letterboxed layouts
      // from the reference movie's old title, footer, loading screen and buttons.
      defs.innerHTML=data.defs+`<clipPath id="ts-ref-scene-crop" clipPathUnits="userSpaceOnUse"><rect x="${number(x)}" y="${number(y)}" width="${number(width)}" height="${number(height)}"/></clipPath>`;
      defs.dataset.referenceReady='1';
    }
    const safeFrame=Math.max(0,Math.min(data.frames.length-1,Math.floor(Number(frame)||0)));
    let state=roots.get(root);
    if(!state||state.crop.parentNode!==root){
      const crop=create('g',{'clip-path':'url(#ts-ref-scene-crop)'}),container=create('g',{transform:'scale(.05)'});
      crop.append(container);root.replaceChildren(crop);
      state={crop,container,entries:new Map()};roots.set(root,state);
    }
    retainedDisplay(state,data,safeFrame,Math.max(0,Number(elapsedFrames)||0),'ts-ref-frame');
    root.dataset.referenceFrame=String(safeFrame);
  }
  data.render=render;
  window.TsunamiReferenceRenderer={render};
})();
