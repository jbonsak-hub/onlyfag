/* Native SVG replay of inert, extracted vector/timeline data. No Flash or ActionScript.
   Source artwork: forskning.no, user-provided 'Slik oppstår en tsunami' reference. */
(() => {
  'use strict';
  const data = window.TsunamiReference;
  if (!data) return;
  const clamp = n => Math.max(0, Math.min(1, n));
  const number = n => Math.abs(n) < .00001 ? '0' : String(Math.round(n * 100000) / 100000);
  const matrix = values => 'matrix(' + values.map(number).join(' ') + ')';
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
  function display(movie, frame, extra, prefix, depth=0) {
    if (depth > 12 || !movie.frames.length) return '';
    const index = Math.max(0,Math.min(movie.frames.length-1,Math.floor(frame)));
    const list = movie.frames[index];
    let result = '', openMasks = [];
    for (const node of list) {
      const [level,id,transform,cx,ratio,clip,placed] = node;
      while (openMasks.length && level > openMasks[openMasks.length-1]) {result+='</g>';openMasks.pop();}
      const asset = data.assets[id];
      if (!asset || asset.type==='ignored' || (cx[3]===0 && cx[7]===0)) continue;
      const key = prefix+'-'+level;
      const age = Math.max(0,index-placed+extra);
      let contents;
      if (asset.type==='sprite') {
        const child = data.sprites[id];
        if (!child || !child.frames.length) continue;
        const childFrame = Math.floor(age) % child.frames.length;
        // One-frame clips can contain independently animated child movies.
        const childExtra = child.frames.length===1 ? age : age-Math.floor(age);
        contents = display(child,childFrame,childExtra,key,depth+1);
      } else if (asset.type==='morph') contents = morph(asset,ratio,key);
      else contents = `<use href="#ts-ref-asset-${id}"/>`;
      const ct = colorTransform(cx,key+'-color');
      const element = `<g transform="${matrix(transform)}"${ct.attribute} data-reference-id="${id}" data-reference-type="${escape(asset.type)}">${contents}</g>`;
      if (clip) {
        const maskId=key+'-mask';
        let geometry = '';
        if (asset.type === 'morph') {
          const t=clamp(ratio/65535),edges=asset.edges.map((edge,i)=>mix(edge,asset.endEdges[i],t));
          geometry=Object.values(asset.fillChains).map(chains=>`<path d="${path(edges,chains,true)}" transform="${matrix(transform)}" fill-rule="evenodd"/>`).join('');
        } else geometry=(asset.clip||'').replaceAll('<path ',`<path transform="${matrix(transform)}" `);
        result += `<defs><clipPath id="${maskId}" clipPathUnits="userSpaceOnUse">${geometry}</clipPath></defs><g clip-path="url(#${maskId})">`;
        openMasks.push(clip);
      } else result += (ct.defs ? '<defs>'+ct.defs+'</defs>' : '')+element;
    }
    while (openMasks.length) {result+='</g>';openMasks.pop();}
    return result;
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
    root.innerHTML='<g clip-path="url(#ts-ref-scene-crop)"><g transform="scale(.05)">'+display(data,safeFrame,Math.max(0,Number(elapsedFrames)||0),'ts-ref-frame')+'</g></g>';
    root.dataset.referenceFrame=String(safeFrame);
  }
  data.render=render;
  window.TsunamiReferenceRenderer={render};
})();
