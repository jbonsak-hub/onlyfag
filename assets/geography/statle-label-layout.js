/* Pure label geometry; state names stay inside their state and city dots stay clear. */
(function(root){
  'use strict';
  const pathCache=new Map(),geometryCache=new WeakMap();
  function parsePath(path){
    if(pathCache.has(path))return pathCache.get(path);
    const rings=String(path).split(/[zZ]/).map(part=>[...part.matchAll(/[ML]\s*([-\d.]+)[ ,]+([-\d.]+)/gi)].map(m=>[Number(m[1]),Number(m[2])])).filter(r=>r.length>=3);
    pathCache.set(path,rings);return rings;
  }
  const area=ring=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
  function contains(point,ring){
    let inside=false;const [x,y]=point;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const a=ring[i],b=ring[j];
      if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    }
    return inside;
  }
  function segmentDistance(p,a,b){
    const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
    return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
  }
  function distance(point,ring){
    let result=Infinity;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++)result=Math.min(result,segmentDistance(point,ring[i],ring[j]));
    return (contains(point,ring)?1:-1)*result;
  }
  const ringBounds=ring=>{const xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);return{x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};};
  function centroid(ring){
    let x=0,y=0,a=0;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const cross=ring[j][0]*ring[i][1]-ring[i][0]*ring[j][1];a+=cross;x+=(ring[j][0]+ring[i][0])*cross;y+=(ring[j][1]+ring[i][1])*cross;
    }
    return a?[x/(3*a),y/(3*a)]:ring[0].slice();
  }
  function interiorCandidates(ring){
    const b=ringBounds(ring),step=Math.max(1.2,Math.min(b.w,b.h)/18),points=[centroid(ring),[b.x+b.w/2,b.y+b.h/2]];
    for(let y=b.y+step/2;y<b.y+b.h;y+=step)for(let x=b.x+step/2;x<b.x+b.w;x+=step)points.push([x,y]);
    return points.map(p=>({p,d:distance(p,ring)})).filter(p=>p.d>0).sort((a,b)=>b.d-a.d);
  }
  function interiorAnchor(path){
    const ring=parsePath(path).slice().sort((a,b)=>area(b)-area(a))[0];
    if(!ring)return null;
    let best=interiorCandidates(ring)[0];
    let step=Math.min(ringBounds(ring).w,ringBounds(ring).h)/18;
    while(step>.12){step/=2;for(const dx of [-step,0,step])for(const dy of [-step,0,step]){const p=[best.p[0]+dx,best.p[1]+dy],d=distance(p,ring);if(d>best.d)best={p,d};}}
    return {x:best.p[0],y:best.p[1],clearance:best.d};
  }
  function intersects(a,b,padding=0){return a.x<b.x+b.w+padding&&a.x+a.w+padding>b.x&&a.y<b.y+b.h+padding&&a.y+a.h+padding>b.y;}
  function pointBox(point,box){return Math.hypot(Math.max(box.x-point.x,0,point.x-box.x-box.w),Math.max(box.y-point.y,0,point.y-box.y-box.h));}
  function boxInside(box,ring){
    // Sampling every edge and its centre catches the small coastal notches in the simplified source.
    for(const sx of [0,.25,.5,.75,1])for(const sy of [0,.5,1])if(!contains([box.x+box.w*sx,box.y+box.h*sy],ring))return false;
    return true;
  }
  const lookup=(map,key)=>map instanceof Map?map.get(key):map?.[key];
  const defaultMeasure=(text,size)=>text.length*size*.58;
  const wrap=text=>{const parts=text.split(' ');if(parts.length<2)return [text];const mid=Math.ceil(parts.length/2);return [parts.slice(0,mid).join(' '),parts.slice(mid).join(' ')];};
  function textBox(lines,x,y,size,measure,kind,anchor='middle'){
    const width=Math.max(...lines.map(line=>measure(line,size,kind)))+2.2,height=size*(1.12*lines.length+.12);
    return{x:anchor==='end'?x-width:anchor==='start'?x:x-width/2,y:y-size*.86,w:width,h:height};
  }
  function lineToBox(point,box){
    const x=Math.max(box.x,Math.min(box.x+box.w,point.x)),y=Math.max(box.y,Math.min(box.y+box.h,point.y));
    return{x1:point.x,y1:point.y,x2:x,y2:y};
  }
  function boundsContain(b,box){return box.x>=b.x&&box.y>=b.y&&box.x+box.w<=b.x+b.w&&box.y+box.h<=b.y+b.h;}
  function layout(options){
    const {states,project=(state,p)=>p,cities,callouts,measure=defaultMeasure,fontSize=7.5,cityFontSize=7,dotRadius=4.3}=options;
    const bounds=options.bounds?{x:options.bounds.x,y:options.bounds.y,w:options.bounds.w??options.bounds.width,h:options.bounds.h??options.bounds.height}:{x:0,y:0,w:900,h:550};
    const sample=['AL','AK','HI'].map(code=>states.find(s=>s.a===code)).filter(Boolean);
    const signature=sample.flatMap(state=>parsePath(state.d)[0].slice(0,2).flatMap(p=>project(state,p))).map(n=>n.toFixed(4)).join(',');
    let cached=geometryCache.get(states);
    if(!cached||cached.signature!==signature){
      const geometry=states.map(state=>{
        const polygons=parsePath(state.d).map(r=>r.map(p=>project(state,p))),ring=polygons.slice().sort((a,b)=>area(b)-area(a))[0];
        return{state,polygons,ring,bounds:ringBounds(ring),fullBounds:ringBounds(polygons.flat()),candidates:interiorCandidates(ring)};
      });
      cached={signature,geometry};geometryCache.set(states,cached);
    }
    const prepared=cached.geometry.map(entry=>({...entry,city:lookup(cities,entry.state.n),callout:lookup(callouts,entry.state.n)}));
    const dots=prepared.map(s=>s.city).filter(Boolean),occupied=[],stateLabels=[],cityLabels=[],issues=[];
    const dotFree=box=>dots.every(dot=>pointBox(dot,box)>=dotRadius);
    // Reserve outside NE callout positions first, then fit each remaining label wholly inside its own land.
    const ordered=prepared.slice().sort((a,b)=>Number(!!b.callout)-Number(!!a.callout)||area(a.ring)-area(b.ring));
    for(const entry of ordered){
      const {state,ring,callout}=entry,text=state.n.toUpperCase(),anchor=callout?.anchor||'middle';
      let choice=null;
      if(callout){
        const p=entry.candidates[0].p;
        for(const size of [fontSize,fontSize-.5,fontSize-1]){
          for(const dx of [0,4,7,-4,-8,-12,-18,-26])for(const dy of [0,-3,3,-6,6]){
            const lines=wrap(text),x=callout.x+dx,y=callout.y+dy-(lines.length-1)*size*.55;
            const box=textBox(lines,x,y,size,measure,'state',anchor);
            if(!boundsContain(bounds,box)||!dotFree(box)||occupied.some(b=>intersects(box,b,1.5)))continue;
            const score=Math.abs(dx)+Math.abs(dy)*1.8+(fontSize-size)*12;
            if(!choice||score<choice.score)choice={state:state.n,kind:'state',lines,x,y,fontSize:size,anchor,box,callout:true,score,leader:lineToBox({x:p[0],y:p[1]},box)};
          }
          if(choice)break;
        }
      }else{
        const c=centroid(ring),maxDistance=entry.candidates[0]?.d||1;
        for(const size of [fontSize,fontSize-.5,fontSize-1,fontSize-1.5,fontSize-2]){
          if(size<4.5)continue;
          for(const lines of [wrap(text),[text]].filter((v,i,a)=>i===0||JSON.stringify(v)!==JSON.stringify(a[0]))){
            for(const candidate of entry.candidates){
              if(candidate.d<size*.54)continue;
              const [x,cy]=candidate.p,y=cy+size*(.32-(lines.length-1)*.56),box=textBox(lines,x,y,size,measure,'state');
              if(!boxInside(box,ring)||!dotFree(box)||occupied.some(b=>intersects(box,b,1.5)))continue;
              const centrality=Math.hypot((x-c[0])/Math.max(1,entry.bounds.w),(cy-c[1])/Math.max(1,entry.bounds.h));
              const score=candidate.d/maxDistance-centrality*.8-(fontSize-size)*.6;
              if(!choice||score>choice.score)choice={state:state.n,kind:'state',lines,x,y,fontSize:size,anchor:'middle',box,score};
            }
          }
          if(choice)break;
        }
      }
      if(!choice&&state.a==='HI'){
        // Hawaii's largest island is smaller than its six-letter name at a readable size.
        // Keep the name in its inset with an explicit link to the Big Island.
        const p=entry.candidates[0].p,size=fontSize-.5;
        for(const dy of [-14,17,-24,27]){
          const x=p[0],y=p[1]+dy,lines=[text],box=textBox(lines,x,y,size,measure,'state');
          if(boundsContain(bounds,box)&&dotFree(box)&&!occupied.some(b=>intersects(box,b,1.5))){
            choice={state:state.n,kind:'state',lines,x,y,fontSize:size,anchor:'middle',box,callout:true,leader:lineToBox({x:p[0],y:p[1]},box)};break;
          }
        }
      }
      if(choice){stateLabels.push(choice);occupied.push(choice.box);}
      else issues.push({state:state.n,kind:'state-label-no-room'});
    }
    // Dense eastern cities are placed first; every text box clears every point and earlier label.
    for(const entry of prepared.filter(s=>s.city).sort((a,b)=>b.city.x-a.city.x)){
      const dot=entry.city,lines=[dot.name];let choice=null;
      for(const size of [cityFontSize,cityFontSize-.5,cityFontSize-1]){
        const width=measure(dot.name,size,'city')+2.2,height=size*1.24;
        for(const gap of [2,6,12,20,32,48,64])for(const [dx,dy] of Array.from({length:16},(_,i)=>[Math.cos(i*Math.PI/8),Math.sin(i*Math.PI/8)])){
          const x=dot.x+dx*(width/2+dotRadius+gap),cy=dot.y+dy*(height/2+dotRadius+gap),y=cy+size*.32;
          const box=textBox(lines,x,y,size,measure,'city');
          if(!boundsContain(bounds,box)||!dotFree(box)||occupied.some(b=>intersects(box,b,1.8)))continue;
          const foreign=prepared.some(other=>other!==entry&&x>=other.fullBounds.x&&x<=other.fullBounds.x+other.fullBounds.w&&cy>=other.fullBounds.y&&cy<=other.fullBounds.y+other.fullBounds.h&&other.polygons.some(r=>contains([x,cy],r)));
          const own=boxInside(box,entry.ring);
          const leader=lineToBox(dot,box);
          const lineHits=dots.some(other=>other!==dot&&Math.hypot(other.x-dot.x,other.y-dot.y)>dotRadius*2+1&&segmentDistance([other.x,other.y],[leader.x1,leader.y1],[leader.x2,leader.y2])<dotRadius);
          if(lineHits)continue;
          const score=Math.hypot(x-dot.x,cy-dot.y)+(foreign?14:own?-8:6)+(cityFontSize-size)*20;
          if(!choice||score<choice.score)choice={state:entry.state.n,kind:'city',lines,x,y,fontSize:size,anchor:'middle',box,leader,score};
        }
      }
      if(choice){cityLabels.push(choice);occupied.push(choice.box);}
      else issues.push({state:entry.state.n,kind:'city-label-no-room'});
    }
    for(const label of [...stateLabels,...cityLabels])if(!dotFree(label.box))issues.push({state:label.state,kind:'dot-covered'});
    return{stateLabels,cityLabels,issues};
  }
  const api={layout,parsePath,interiorAnchor,contains,distance,boxInside,intersects,pointBox};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.StatleLabelLayout=api;
})(typeof window!=='undefined'?window:globalThis);
