/* Names for local administrative maps; callouts always point to visible owned land. */
(function(root){
  'use strict';
  const base=typeof module==='object'&&module.exports?require('./statle-label-layout.js'):root.StatleLabelLayout;
  const geometryCache=new WeakMap();
  const intersects=(a,b,pad=0)=>a.x<b.x+b.w+pad&&a.x+a.w+pad>b.x&&a.y<b.y+b.h+pad&&a.y+a.h+pad>b.y;
  const inside=(b,x,y)=>x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h;
  const extent=ring=>{let x=Infinity,y=Infinity,right=-Infinity,bottom=-Infinity;for(const p of ring){x=Math.min(x,p[0]);y=Math.min(y,p[1]);right=Math.max(right,p[0]);bottom=Math.max(bottom,p[1]);}return{x,y,w:right-x,h:bottom-y};};
  const area=ring=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
  function geometry(path){
    const rings=base.parsePath(path).map(points=>{
      const bounds=extent(points),buckets=Array.from({length:64},()=>[]),bucket=y=>Math.max(0,Math.min(63,Math.floor((y-bounds.y)/(bounds.h||1)*64)));
      for(let i=0,j=points.length-1;i<points.length;j=i++){
        const edge=[points[j],points[i]];for(let k=bucket(Math.min(edge[0][1],edge[1][1]));k<=bucket(Math.max(edge[0][1],edge[1][1]));k++)buckets[k].push(edge);
      }
      return{points,bounds,buckets,bucket,area:area(points)};
    });
    if(!rings.length)return null;
    const bounds=extent(rings.flatMap(r=>[[r.bounds.x,r.bounds.y],[r.bounds.x+r.bounds.w,r.bounds.y+r.bounds.h]]));
    return{rings,bounds,area:Math.max(...rings.map(r=>r.area))};
  }
  function contains(x,y,g){
    if(!g||x<g.bounds.x||x>g.bounds.x+g.bounds.w||y<g.bounds.y||y>g.bounds.y+g.bounds.h)return false;
    let result=false;
    for(const ring of g.rings){
      const b=ring.bounds;if(x<b.x||x>b.x+b.w||y<b.y||y>b.y+b.h)continue;
      let hit=false;for(const [a,b]of ring.buckets[ring.bucket(y)])if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
      if(hit)result=!result;
    }
    return result;
  }
  function segmentBox(a,b,box){
    let lo=0,hi=1;const dx=b[0]-a[0],dy=b[1]-a[1];
    for(const [p,q]of [[-dx,a[0]-box.x],[dx,box.x+box.w-a[0]],[-dy,a[1]-box.y],[dy,box.y+box.h-a[1]]]){
      if(!p){if(q<0)return false;continue;}const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return false;
    }
    return true;
  }
  function boundaryInBox(g,box){
    if(!intersects(g.bounds,box))return false;
    for(const ring of g.rings){
      if(!intersects(ring.bounds,box))continue;
      const seen=new Set();
      for(let k=ring.bucket(box.y);k<=ring.bucket(box.y+box.h);k++)for(const edge of ring.buckets[k]){
        if(seen.has(edge))continue;seen.add(edge);if(segmentBox(edge[0],edge[1],box))return true;
      }
    }
    return false;
  }
  function boxInGeometry(box,g){
    return contains(box.x,box.y,g)&&contains(box.x+box.w,box.y,g)&&contains(box.x,box.y+box.h,g)&&contains(box.x+box.w,box.y+box.h,g)&&!boundaryInBox(g,box);
  }
  function overlapsGeometry(box,g){return intersects(box,g.bounds)&&(contains(box.x,box.y,g)||contains(box.x+box.w,box.y,g)||contains(box.x,box.y+box.h,g)||contains(box.x+box.w,box.y+box.h,g)||boundaryInBox(g,box));}
  function variants(text){
    const words=text.split(/\s+/),out=[[text]];
    if(words.length>1){let best=null;for(let i=1;i<words.length;i++){const lines=[words.slice(0,i).join(' '),words.slice(i).join(' ')],score=Math.max(...lines.map(s=>s.length));if(!best||score<best.score)best={lines,score};}out.push(best.lines);}
    return out;
  }
  function layout(options){
    const {states,measure=(text,size)=>text.length*size*.62,name=n=>n}=options;
    const v=options.viewBox||[0,0,900,650],raw=Array.isArray(v)?{x:v[0],y:v[1],w:v[2],h:v[3]}:{x:v.x,y:v.y,w:v.w??v.width,h:v.h??v.height};
    const fontSize=options.fontSize||Math.min(raw.w,raw.h)/60,minFont=fontSize*.85,padding=fontSize*.6;
    const bounds={x:raw.x+padding,y:raw.y+padding,w:raw.w-2*padding,h:raw.h-2*padding};
    let source=geometryCache.get(states);
    if(!source){source=states.map((state,index)=>({state,index,g:geometry(state.d)})).filter(row=>row.g);geometryCache.set(states,source);}
    const rows=source.filter(row=>intersects(row.g.bounds,bounds)).map(row=>({...row,blockers:source.filter(other=>other.index>row.index&&intersects(row.g.bounds,other.g.bounds))}));
    const visible=(row,x,y)=>inside(bounds,x,y)&&contains(x,y,row.g)&&!row.blockers.some(b=>contains(x,y,b.g));
    for(const row of rows){
      const b=row.g.bounds,x0=Math.max(bounds.x,b.x),y0=Math.max(bounds.y,b.y),w=Math.min(bounds.x+bounds.w,b.x+b.w)-x0,h=Math.min(bounds.y+bounds.h,b.y+b.h)-y0;
      row.candidates=[];if(visible(row,...row.state.c))row.candidates.push(row.state.c);
      for(let gy=0;gy<11;gy++)for(let gx=0;gx<11;gx++){const p=[x0+w*(gx+.5)/11,y0+h*(gy+.5)/11];if(visible(row,...p))row.candidates.push(p);}
      // The supplied interior point preserves tiny islands that a coarse grid misses.
      row.candidates.sort((a,b)=>Math.hypot(a[0]-row.state.c[0],a[1]-row.state.c[1])-Math.hypot(b[0]-row.state.c[0],b[1]-row.state.c[1]));
      row.anchor=row.candidates[0];
    }
    const labels=[],occupied=[],issues=[];
    const within=box=>box.x>=bounds.x&&box.y>=bounds.y&&box.x+box.w<=bounds.x+bounds.w&&box.y+box.h<=bounds.y+bounds.h;
    const free=box=>within(box)&&!occupied.some(other=>intersects(box,other,fontSize*.16));
    function make(row,lines,x,cy,size){
      const metrics=typeof measure.metrics==='function'?measure.metrics(size,'state')||{}:{},ascent=metrics.fontBoundingBoxAscent??metrics.ascent??size*1.05,descent=metrics.fontBoundingBoxDescent??metrics.descent??size*.3,stroke=size*.12,lineHeight=size*1.12;
      const w=Math.max(...lines.map(s=>measure(s,size,'state')))+2*stroke,h=ascent+descent+(lines.length-1)*lineHeight+2*stroke,y=cy+(ascent-descent)/2-(lines.length-1)*lineHeight/2;
      return{state:row.state.n,kind:'state',lines,x,y,fontSize:size,anchor:'middle',box:{x:x-w/2,y:cy-h/2,w,h}};
    }
    // Small areas reserve their close labels first; large areas have more interior choices.
    const pending=[];
    for(const row of rows.filter(row=>row.anchor).sort((a,b)=>a.g.area-b.g.area)){
      let best=null;
      search:for(const size of [fontSize,minFont]){
        for(const lines of variants(name(row.state.n,row.state)))for(const p of row.candidates){
          const label=make(row,lines,p[0],p[1],size),box=label.box;
          if(!free(box)||!boxInGeometry(box,row.g)||row.blockers.some(b=>overlapsGeometry(box,b.g)))continue;
          const score=Math.hypot(p[0]-row.anchor[0],p[1]-row.anchor[1])+(fontSize-size)*10+(lines.length-1)*fontSize*.3;
          if(!best||score<best.score)best={...label,score};if(score===0)break search;
        }
        if(best)break;
      }
      if(best){labels.push(best);occupied.push(best.box);}else pending.push(row);
    }
    for(const row of pending){
      let best=null;
      for(const size of [fontSize,minFont])for(const lines of variants(name(row.state.n,row.state))){
        const template=make(row,lines,0,0,size),a=row.anchor;
        for(const step of [1,2,3,4,6,8,11,15,20,28,38]){
          for(let i=0;i<32;i++){
            const angle=i*Math.PI/16,x=a[0]+Math.cos(angle)*(template.box.w/2+step*fontSize),cy=a[1]+Math.sin(angle)*(template.box.h/2+step*fontSize),label=make(row,lines,x,cy,size),box=label.box;
            if(!free(box))continue;
            const end=[Math.max(box.x,Math.min(box.x+box.w,a[0])),Math.max(box.y,Math.min(box.y+box.h,a[1]))];
            const crosses=occupied.filter(other=>segmentBox(a,end,other)).length,foreign=rows.some(other=>other!==row&&contains(x,cy,other.g));
            const score=Math.hypot(x-a[0],cy-a[1])+(fontSize-size)*10+(lines.length-1)*fontSize*.3+crosses*fontSize*8+(foreign?fontSize*2:0);
            if(!best||score<best.score)best={...label,callout:true,leader:{x1:a[0],y1:a[1],x2:end[0],y2:end[1]},score};
          }
          if(best&&step*fontSize>best.score+fontSize*4)break;
        }
      }
      if(best){labels.push(best);occupied.push(best.box);}else issues.push({state:row.state.n,kind:'state-label-no-room'});
    }
    return{stateLabels:labels,cityLabels:[],issues};
  }
  const api={layout};if(typeof module==='object'&&module.exports)module.exports=api;else root.LocalLabelLayout=api;
})(typeof window!=='undefined'?window:globalThis);
