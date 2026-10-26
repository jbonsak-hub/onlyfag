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
  function cityName(state,cities){
    const city=lookup(cities,state.n),values=cities instanceof Map?[...cities.values()]:Object.values(cities);
    return city.name+(values.some(other=>other!==city&&other.name===city.name)?' ('+state.a+')':'');
  }

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
  const api={layout,cityName,parsePath,interiorAnchor,contains,distance,boxInside,intersects,pointBox};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.StatleLabelLayout=api;
})(typeof window!=='undefined'?window:globalThis);

/* Country/capital preview geometry. IDs remain canonical; displayed names may be translated. */
(function(root){
  'use strict';
  const base=typeof module==='object'&&module.exports?require('./statle-label-layout.js'):root.StatleLabelLayout;
  const cache=new WeakMap(),fontCache=new WeakMap();
  const lookup=(source,name)=>source instanceof Map?source.get(name):source?.[name];
  const area=ring=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
  const ext=ring=>{const x=Math.min(...ring.map(p=>p[0])),y=Math.min(...ring.map(p=>p[1]));return{x,y,w:Math.max(...ring.map(p=>p[0]))-x,h:Math.max(...ring.map(p=>p[1]))-y};};
  const intersects=(a,b,pad=1.7)=>a.x<b.x+b.w+pad&&a.x+a.w+pad>b.x&&a.y<b.y+b.h+pad&&a.y+a.h+pad>b.y;
  const inBounds=(b,r)=>r.x>=b.x&&r.y>=b.y&&r.x+r.w<=b.x+b.w&&r.y+r.h<=b.y+b.h;
  const line=(point,b)=>({x1:point.x,y1:point.y,x2:Math.max(b.x,Math.min(b.x+b.w,point.x)),y2:Math.max(b.y,Math.min(b.y+b.h,point.y))});
  const defaultMeasure=(text,size)=>text.length*size*.62;
  function variants(text){
    const words=text.split(/\s+/),out=[[text]];
    if(words.length>1){let best=null;for(let i=1;i<words.length;i++){const rows=[words.slice(0,i).join(' '),words.slice(i).join(' ')],score=Math.max(...rows.map(s=>s.length));if(!best||score<best.score)best={rows,score};}out.push(best.rows);}
    if(words.length>2)out.push(words);
    return out;
  }
  function fontMetrics(size,measure,kind){
    let cached=fontCache.get(measure);
    if(!cached||cached.provider!==measure.metrics){cached={provider:measure.metrics,values:new Map()};fontCache.set(measure,cached);}
    const key=kind+'|'+size;
    if(!cached.values.has(key)){
      const measured=typeof measure.metrics==='function'?measure.metrics(size,kind)||{}:{};
      const rawAscent=measured.fontBoundingBoxAscent??measured.ascent,rawDescent=measured.fontBoundingBoxDescent??measured.descent;
      const ascent=Number.isFinite(rawAscent)&&rawAscent>0?rawAscent:size*1.05,descent=Number.isFinite(rawDescent)&&rawDescent>=0?rawDescent:size*.3;
      cached.values.set(key,{ascent,descent,padding:1.2,lineHeight:size*1.12});
    }
    return cached.values.get(key);
  }
  function baselineAtCenter(cy,lines,size,measure,kind){const m=fontMetrics(size,measure,kind);return cy+(m.ascent-m.descent)/2-(lines.length-1)*m.lineHeight/2;}
  function textBox(lines,x,y,size,measure,kind){
    const m=fontMetrics(size,measure,kind),w=Math.max(...lines.map(s=>measure(s,size,kind)))+2.4;
    return{x:x-w/2,y:y-m.ascent-m.padding,w,h:m.ascent+m.descent+(lines.length-1)*m.lineHeight+2*m.padding};
  }
  function inLand(box,ring){
    if(!base.boxInside(box,ring))return false;
    for(let step=0;step<=24;step++)for(const p of [[box.x+box.w*step/24,box.y],[box.x+box.w*step/24,box.y+box.h],[box.x,box.y+box.h*step/24],[box.x+box.w,box.y+box.h*step/24]])if(!base.contains(p,ring))return false;
    return true;
  }
  function layout(options){
    const states=options.states,project=options.project||((s,p)=>p),source=options.capitalData||options.capitals,showCapitals=options.showCapitals!==false;
    const stateName=options.countryName||options.stateName||((name)=>name),capitalName=options.capitalName||((name)=>name),measure=options.measure||defaultMeasure;
    const fontSize=options.fontSize||8,cityFontSize=options.cityFontSize||7,dotRadius=options.dotRadius||4.3;
    const b=options.bounds||{x:8,y:8,w:884,h:634},bounds={x:b.x,y:b.y,w:b.w??b.width,h:b.h??b.height};
    const sig=states.slice(0,2).flatMap(s=>project(s,s.c)).join(',');let data=cache.get(states);
    if(!data||data.sig!==sig){
      data={sig,rows:states.map(state=>{const rings=base.parsePath(state.d).map(r=>r.map(p=>project(state,p))),ring=rings.slice().sort((a,b)=>area(b)-area(a))[0]||null,[x,y]=project(state,state.c),anchor={x,y};let candidates=[[x,y]];
        if(ring){const r=ext(ring);for(let gy=0;gy<12;gy++)for(let gx=0;gx<12;gx++){const p=[r.x+r.w*(gx+.5)/12,r.y+r.h*(gy+.5)/12];if(base.contains(p,ring))candidates.push(p);}candidates.sort((a,b)=>Math.hypot(a[0]-x,a[1]-y)-Math.hypot(b[0]-x,b[1]-y));}
        return{state,rings,ring,anchor,candidates,area:ring?area(ring):0,fullBounds:rings.length?ext(rings.flat()):null};})};cache.set(states,data);
    }
    const rows=data.rows.map(row=>{const capital=lookup(source,row.state.n)||(showCapitals?null:{name:'',p:row.state.c});if(!capital)throw Error('Missing capital: '+row.state.n);const p=project(row.state,capital.p);return{...row,capital,dot:{x:p[0],y:p[1],name:capitalName(capital.name,capital,row.state)},title:stateName(row.state.n,row.state).toUpperCase()};});
    const dots=showCapitals?rows.map(r=>r.dot):[],occupied=[],stateLabels=[],cityLabels=[],issues=[];
    const free=box=>inBounds(bounds,box)&&dots.every(dot=>base.pointBox(dot,box)>=dotRadius)&&!occupied.some(other=>intersects(box,other));
    const foreign=(row,x,y)=>rows.some(other=>other!==row&&other.fullBounds&&x>=other.fullBounds.x&&x<=other.fullBounds.x+other.fullBounds.w&&y>=other.fullBounds.y&&y<=other.fullBounds.y+other.fullBounds.h&&other.rings.some(r=>base.contains([x,y],r)));
    function around(row,lines,size,kind,origin){
      const measuredBox=textBox(lines,0,0,size,measure,kind),width=measuredBox.w,height=measuredBox.h;let best=null;
      for(const gap of [3,8,15,24,36,52,72,96,128,164]){if(best&&gap>best.score+18)break;for(let i=0;i<24;i++){
        const angle=i*Math.PI/12,dx=Math.cos(angle),dy=Math.sin(angle),x=origin.x+dx*(width/2+dotRadius+gap),cy=origin.y+dy*(height/2+dotRadius+gap),y=baselineAtCenter(cy,lines,size,measure,kind),box=textBox(lines,x,y,size,measure,kind);
        if(!free(box))continue;
        const own=row.ring&&base.boxInside(box,row.ring),score=Math.hypot(x-origin.x,cy-origin.y)+(foreign(row,x,cy)?12:own?-10:4)+(kind==='city'?cityFontSize-size:fontSize-size)*12+(lines.length-1)*2;
        if(!best||score<best.score)best={state:row.state.n,kind,lines,x,y,fontSize:size,anchor:'middle',box,leader:line(origin,box),callout:true,score};
      }
      }return best;
    }
    // Keep country names inside their own land first, then route the small-country callouts.
    const pending=[];
    for(const row of rows.slice().sort((a,b)=>b.area-a.area)){
      let best=null;
      countrySearch:if(row.ring)for(const size of [fontSize,fontSize-.5,fontSize-1,fontSize-1.5]){
        if(size<5.5)continue;
        for(const lines of variants(row.title))for(const p of row.candidates){
          const x=p[0],y=baselineAtCenter(p[1],lines,size,measure,'state'),box=textBox(lines,x,y,size,measure,'state');
          if(!free(box)||!inLand(box,row.ring))continue;
          const score=Math.hypot(x-row.anchor.x,p[1]-row.anchor.y)+(fontSize-size)*15+(lines.length-1)*2;
          if(!best||score<best.score)best={state:row.state.n,kind:'state',lines,x,y,fontSize:size,anchor:'middle',box,score};if(score===0)break countrySearch;
        }
        if(best)break;
      }
      if(best){stateLabels.push(best);occupied.push(best.box);}else pending.push(row);
    }
    for(const row of pending.sort((a,b)=>a.area-b.area)){
      let best=null;
      for(const size of [fontSize,fontSize-.5,fontSize-1,fontSize-1.5])for(const lines of variants(row.title)){
        const found=around(row,lines,size,'state',row.anchor);if(found&&(!best||found.score<best.score))best=found;
      }
      if(best){stateLabels.push(best);occupied.push(best.box);}else issues.push({state:row.state.n,kind:'state-label-no-room'});
    }
    // Dense capital clusters are handled first; every candidate clears every capital dot.
    const ordered=rows.slice().sort((a,b)=>{const near=r=>dots.filter(p=>Math.hypot(p.x-r.dot.x,p.y-r.dot.y)<60).length;return near(b)-near(a);});
    for(const row of showCapitals?ordered:[]){
      let best=null;
      for(const size of [cityFontSize,cityFontSize-.5,cityFontSize-1])for(const lines of variants(row.dot.name)){
        const found=around(row,lines,size,'city',row.dot);if(found&&(!best||found.score<best.score))best=found;
      }
      if(best){cityLabels.push(best);occupied.push(best.box);}else issues.push({state:row.state.n,kind:'city-label-no-room'});
    }
    return{stateLabels,cityLabels,issues};
  }
  const api={layout};if(typeof module==='object'&&module.exports)module.exports=api;else root.RegionLabelLayout=api;
})(typeof window!=='undefined'?window:globalThis);

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
    const labels=[],cityLabels=[],occupied=[],issues=[];
    const cityRows=options.cities?states.flatMap(state=>{
      const city=options.cities instanceof Map?options.cities.get(state.n):options.cities[state.n];
      if(!city)return[];
      return(city.locations?.length?city.locations.map(place=>({name:place.name,x:place.p[0],y:place.p[1]})):[city]).filter(place=>inside(bounds,place.x,place.y)).map(place=>({state,place}));
    }):[];
    const dotRadius=fontSize*.4;
    for(const {place}of cityRows)occupied.push({x:place.x-dotRadius,y:place.y-dotRadius,w:dotRadius*2,h:dotRadius*2});
    const within=box=>box.x>=bounds.x&&box.y>=bounds.y&&box.x+box.w<=bounds.x+bounds.w&&box.y+box.h<=bounds.y+bounds.h;
    const free=box=>within(box)&&!occupied.some(other=>intersects(box,other,fontSize*.16));
    function make(row,lines,x,cy,size,kind='state'){
      const metrics=typeof measure.metrics==='function'?measure.metrics(size,kind)||{}:{},ascent=metrics.fontBoundingBoxAscent??metrics.ascent??size*1.05,descent=metrics.fontBoundingBoxDescent??metrics.descent??size*.3,stroke=size*.12,lineHeight=size*1.12;
      const w=Math.max(...lines.map(s=>measure(s,size,kind)))+2*stroke,h=ascent+descent+(lines.length-1)*lineHeight+2*stroke,y=cy+(ascent-descent)/2-(lines.length-1)*lineHeight/2;
      return{state:row.state.n,kind,lines,x,y,fontSize:size,anchor:'middle',box:{x:x-w/2,y:cy-h/2,w,h}};
    }
    // Centre labels reserve nearby space first. Both text layers avoid every dot.
    for(const row of cityRows){
      let best=null;const a=[row.place.x,row.place.y];
      for(const size of [fontSize*.9,minFont*.9])for(const lines of variants(row.place.name)){
        const template=make(row,lines,0,0,size,'city');
        for(const step of [0,.5,1,2,3,4,6,8,11,15,20,28,38]){
          for(let i=0;i<32;i++){
            const angle=i*Math.PI/16,x=a[0]+Math.cos(angle)*(template.box.w/2+dotRadius+step*fontSize),cy=a[1]+Math.sin(angle)*(template.box.h/2+dotRadius+step*fontSize),label=make(row,lines,x,cy,size,'city'),box=label.box;
            if(!free(box))continue;
            const end=[Math.max(box.x,Math.min(box.x+box.w,a[0])),Math.max(box.y,Math.min(box.y+box.h,a[1]))];
            const crosses=occupied.filter(other=>segmentBox(a,end,other)).length;
            const score=Math.hypot(x-a[0],cy-a[1])+(fontSize-size)*10+(lines.length-1)*fontSize*.3+crosses*fontSize*2;
            if(!best||score<best.score)best={...label,callout:true,leader:{x1:a[0],y1:a[1],x2:end[0],y2:end[1]},score};
          }
          if(best&&step*fontSize>best.score+fontSize*3)break;
        }
      }
      if(best){cityLabels.push(best);occupied.push(best.box);}else issues.push({state:row.state.n,kind:'city-label-no-room'});
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
    return{stateLabels:labels,cityLabels,issues};
  }
  const api={layout};if(typeof module==='object'&&module.exports)module.exports=api;else root.LocalLabelLayout=api;
})(typeof window!=='undefined'?window:globalThis);

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

/* Shared click-map game for Statle, Norwegian counties and continent maps. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ns = 'http://www.w3.org/2000/svg';
  const kart = document.body.dataset.quiz === 'kart';
  const municipalities = document.body.dataset.quiz === 'kommuner';
  const boroughs = document.body.dataset.quiz === 'bydeler';
  const statle = document.body.dataset.quiz === 'statle';
  const localMap = municipalities || boroughs;
  const countryRegions=new Set(['europe','asia','northAmerica','southAmerica','africa','oceania']);
  const countryRegion=()=>kart&&countryRegions.has(document.body.dataset.region);
  const enhanced=()=>statle||countryRegion()||localMap;
  const capitalsInput=()=>statle?$('statle-capitals'):null;
  const advancedInputs=()=>[advancedInput(),capitalsInput()].filter(Boolean);
  const advancedInput=()=>$(municipalities?'municipality-centres':statle?'statle-advanced':'region-capitals');
  const namesInput=()=>$(localMap?'local-show-names':statle?'statle-show-names':'region-show-names');
  let largestCities=null, stateCapitals=null;
  let cityData = null, citiesMode = false, basemap=null, regionalCapitals=null, municipalityCentres=null, cityMarkerScale='';
  const cityPoints = new Map(), stateTransforms = new Map();
  const showNames = () => enhanced() && !!namesInput()?.checked;
  const answerName = name => citiesMode ? displayCityName(states.find(state=>state.n===name)) + ' · ' + (window.QuizLanguage?.translate(name)||name) : name;
  const displayCityName=state=>statle?StatleLabelLayout.cityName(state,cityData):(window.QuizLanguage?.language==='en'?cityData[state.n].en||cityData[state.n].name:cityData[state.n].name);
  const questionName = state => citiesMode ? municipalities?cityData[state.n].promptName||displayCityName(state):displayCityName(state) : state.n;
  const questionSymbol = document.createElement('img');
  questionSymbol.id='target-symbol';questionSymbol.hidden=true;questionSymbol.decoding='async';
  $('targetName').before(questionSymbol);
  function renderQuestion() {
    const state=target(),symbol=state&&window.MapSymbols?.lookup(state.n,{kind:countryRegion()?'country':statle?'state':municipalities?'municipality':counties?'county':boroughs?'municipality':'none',code:state.a});
    const show=!!symbol&&(!citiesMode||statle||countryRegion());
    questionSymbol.hidden=!show;
    if(show){questionSymbol.src=symbol.src;questionSymbol.alt=symbol.alt;questionSymbol.dataset.type=symbol.type;}
    else questionSymbol.removeAttribute('src');
    $('targetName').textContent=questionName(state);
  }
  questionSymbol.addEventListener('error',()=>{questionSymbol.hidden=true;});
  // Rankings belong to navigation, below round controls and above map choice.
  const footer=document.querySelector('.game-panel footer');
  footer.insertBefore($('statle-top-ten'),footer.querySelector('.quiz-page-back'));
  const themeButtons = [];
  function applyTheme(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode', dark);
    themeButtons.forEach(button => button.setAttribute('aria-pressed', String(dark)));
  }
  for (const menu of [$('geoMenuButton'), $('kart-menu-button')].filter(Boolean)) {
    const toolbar = document.createElement('div'); toolbar.className = 'map-toolbar';
    const button = document.createElement('button'); button.type = 'button';
    button.className = 'map-theme-toggle'; button.textContent = '◐';
    button.setAttribute('aria-label', 'Bytt mellom lys og mørk modus');
    button.addEventListener('click', () => {
      const dark = document.documentElement.dataset.theme !== 'dark';
      applyTheme(dark);
      try { localStorage.setItem('geoDarkMode', dark ? '1' : '0'); } catch (_) {}
    });
    menu.before(toolbar); toolbar.append(menu, button); themeButtons.push(button);
  }
  try { applyTheme(localStorage.getItem('geoDarkMode') === '1'); } catch (_) { applyTheme(false); }
  addEventListener('storage', event => { if(event.key === 'geoDarkMode' || event.key === null) {
    try { applyTheme(localStorage.getItem('geoDarkMode') === '1'); } catch (_) {}
  }});
  let counties = document.body.dataset.quiz === 'fylker';
  let total = counties ? 15 : 50;
  let shapeLabel = counties ? 'Fylke på kartet' : 'Delstat på kartet';
  let regionData = null, usContext = null, mapGeneration = 0, physical = false;
  let practice = false, continentPractice = false, retrying = false;
  const mastered = new Set();
  const continentOrder=['northAmerica','southAmerica','europe','asia','africa','oceania'];
  const continentNames={northAmerica:'Nord-Amerika',southAmerica:'Sør-Amerika',europe:'Europa',asia:'Asia',africa:'Afrika',oceania:'Oseania'};
  const elements = new Map(), markers = new Map(), centers = new Map();
  let states = [], queue = [], index = 0, phase = 'ready', locked = false;
  let results = new Map(), roundMistakes = 0, mistakes = 0;
  let totalTime = 0, roundTime = 0, lastTick = performance.now(), generation = 0;
  const timers = new Set();
  // Shared by the standalone state/county games and every Kart region. Keep
  // this offer in the panel so it never competes with the score-name dialog.
  const repeatOffer = document.createElement('section');
  repeatOffer.id = 'repeat-practice'; repeatOffer.hidden = true;
  const repeatQuestion = document.createElement('strong');
  repeatQuestion.textContent = 'Øve en gang til?';
  const repeatButton = document.createElement('button');
  repeatButton.id = 'repeat-practice-start'; repeatButton.type = 'button';
  repeatButton.className = 'primary-button';
  repeatButton.textContent = 'Øv på de som ikke ble grønne';
  repeatButton.addEventListener('click', () => {
    if (phase !== 'finished' || mastered.size === states.length) return;
    retrying = true; practice = true;
    document.body.dataset.practice = 'true';
    window.GeoOnline?.resetStatle();
    begin();
  });
  repeatOffer.append(repeatQuestion, repeatButton);
  $('feedback').after(repeatOffer);
  function svgNode(tag, attrs = {}) {
    const el = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    return el;
  }
  function later(fn, ms) {
    const run = generation;
    const timer = setTimeout(() => { timers.delete(timer); if (run === generation) fn(); }, ms);
    timers.add(timer);
  }
  function clearEffects() {
    timers.forEach(clearTimeout); timers.clear();
    $('hintLayer').replaceChildren(); $('labelLayer').replaceChildren();
    elements.forEach(el => el.classList.remove('wrong', 'correct', 'hovered', 'hinted'));
  }
  function target() { return queue[index]; }
  function setFeedback(text, kind = '') { $('feedback').textContent = text; $('feedback').className = kind; }
  function timeText(ms) {
    const seconds = Math.floor(ms / 1000);
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  function tick() {
    const now = performance.now(), delta = now - lastTick;
    lastTick = now;
    if (phase !== 'playing') return;
    totalTime += delta;
    if (!locked) roundTime += delta;
    $('elapsed').textContent = timeText(totalTime);
  }
  setInterval(tick, 100);
  function fit(group, rect) {
    const b = group.getBBox(), scale = Math.min(rect.w / b.width, rect.h / b.height);
    const x = rect.x + (rect.w - b.width * scale) / 2 - b.x * scale;
    const y = rect.y + (rect.h - b.height * scale) * (rect.bottom ? 1 : 0.5) - b.y * scale;
    group.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
    for (const el of group.children) {
      const state = states.find(s => s.n === el.dataset.state), box = el.getBBox();
      const c = state.a === 'AK' || state.a === 'HI' ? [box.x + box.width / 2, box.y + box.height / 2] : state.c;
      centers.set(state.n, {x:c[0] * scale + x, y:c[1] * scale + y, radius:Math.max(box.width, box.height) * scale / 2 + 10});
      if(statle)stateTransforms.set(state.n,{x,y,scale});
      if (cityData?.[state.n]) {
        const p = cityData[state.n].p;
        cityPoints.set(state.n, {x:p[0] * scale + x, y:p[1] * scale + y});
      }
    }
    return {x:b.x * scale + x, y:b.y * scale + y, width:b.width * scale, height:b.height * scale};
  }
  function buildMap() {
    $('terrain-boundary-halos')?.remove();
    buildMapGeometry();
    // A passive cream outline separates all target edges from terrain textures.
    const halos=svgNode('g',{id:'terrain-boundary-halos','aria-hidden':'true','pointer-events':'none'});
    for(const shape of $('states').querySelectorAll('path.state')) {
      const transforms=[];
      for(let node=shape;node&&node!==$('states');node=node.parentElement)if(node.hasAttribute('transform'))transforms.unshift(node.getAttribute('transform'));
      halos.append(svgNode('path',{d:shape.getAttribute('d'),transform:transforms.join(' '),'fill-rule':'evenodd',class:'terrain-boundary-halo','vector-effect':'non-scaling-stroke'}));
    }
    $('states').before(halos);
  }
  function buildMapGeometry() {
    if (municipalities || boroughs) {
      $('map').setAttribute('viewBox',regionData.viewBox.join(' '));
      if(boroughs) {
        const [x,y,width,height]=regionData.viewBox;
        $('states').append(svgNode('rect',{x,y,width,height,class:'oslo-map-water','aria-hidden':'true','pointer-events':'none'}));
      }
      const extent=svgNode('clipPath',{id:'municipality-extent',clipPathUnits:'userSpaceOnUse'});
      // Separate clip children form a union even when forests, boroughs and
      // smaller areas overlap. One even-odd path would cancel those overlaps.
      for(const state of states.filter(state=>state.d&&state.kind!=='lake'))extent.append(svgNode('path',{d:state.d,'clip-rule':'evenodd'}));
      $('states').append(extent);
      if(regionData.context) $('states').append(svgNode('path',{d:regionData.context,class:'municipality-context','fill-rule':'evenodd','aria-hidden':'true'}));
      for(const region of regionData.contextRegions||[]) {
        const path=svgNode('path',{d:region.d,class:'municipality-context oslo-context-region','fill-rule':'evenodd'});
        const title=svgNode('title',{});title.textContent=region.n;path.append(title);$('states').append(path);
      }
      if(regionData.forestContext) $('states').append(svgNode('path',{d:regionData.forestContext,class:'oslo-forest-context','fill-rule':'evenodd','aria-hidden':'true','pointer-events':'none'}));
      const areas=states;
      function addArea(state) {
        const el=svgNode('path',{d:state.d,class:'state municipality'+(boroughs?' oslo-'+(state.kind||'land'):''),'fill-rule':'evenodd',role:'button',tabindex:'0','aria-label':shapeLabel});
        el.dataset.state=state.n;el.dataset.code=state.a;el.dataset.kind=state.kind||'land';$('states').append(el);elements.set(state.n,el);
        const box=el.getBBox();centers.set(state.n,{x:state.c[0],y:state.c[1],radius:Math.max(box.width,box.height)/2+10});
      }
      for(const state of areas.filter(state=>state.kind!=='lake'))addArea(state);
      // Water provides geographical clues; it never intercepts answers. Draw
      // municipal boundaries again above it so they remain easy to follow.
      const water=svgNode('g',{id:'municipality-water','aria-hidden':'true','pointer-events':'none','clip-path':'url(#municipality-extent)'});
      const waterPaths=new Map();
      for(const feature of regionData.water||[]) {
        if(!waterPaths.has(feature.kind))waterPaths.set(feature.kind,[]);
        waterPaths.get(feature.kind).push(feature.d);
      }
      for(const [kind,paths] of waterPaths)water.append(svgNode('path',{d:paths.join(' '),class:'municipality-'+kind,'fill-rule':'evenodd','vector-effect':'non-scaling-stroke'}));
      $('states').append(water);
      const boundaries=svgNode('g',{class:'municipality-boundaries','aria-hidden':'true','pointer-events':'none'});
      const borderPath=regionData.boundaries??states.map(state=>state.d).join(' ');
      for(const layer of ['halo','line'])boundaries.append(svgNode('path',{d:borderPath,class:'municipality-border-'+layer,'vector-effect':'non-scaling-stroke'}));
      $('states').append(boundaries);
      for(const state of areas.filter(state=>state.kind==='lake')) {
        addArea(state);
        if(boroughs && state.islands) {
          // The water target includes its islands; the passive forest overlay
          // keeps land green while letting pointer hits reach the lake below.
          elements.get(state.n).setAttribute('d',state.d+' '+state.islands);
          $('states').append(svgNode('path',{d:state.islands,class:'oslo-lake-islands','fill-rule':'evenodd','aria-hidden':'true','pointer-events':'none'}));
        }
      }
      if(municipalities){
        for(const state of states){const p=cityData[state.n].p;cityPoints.set(state.n,{x:p[0],y:p[1]});}
        buildCityLayer();
      }else{
        $('hintLayer').before(svgNode('g',{id:'statle-study-names','aria-hidden':'true','pointer-events':'none'}));
        namesInput().disabled=false;updateStatleOptions();
      }
      prepareBasemap('../assets/geography/norway-relief.json?v=e6fda0399eb5',undefined,boroughs?'oslo':'county-'+document.body.dataset.county);
      return;
    }
    if (physical) {
      $('map').setAttribute('viewBox',regionData.viewBox.join(' '));
      const land=(regionData.background||[]).filter(layer=>layer.kind==='land'),v=regionData.viewBox;
      const clip=svgNode('clipPath',{id:'physical-water-clip',clipPathUnits:'userSpaceOnUse'});
      clip.append(svgNode('path',{d:`M${v[0]} ${v[1]}h${v[2]}v${v[3]}h${-v[2]}Z`+land.map(l=>l.d).join(''),'clip-rule':'evenodd'}));$('states').append(clip);
      // Intersect two clips: adding lake rings to the land clip's even-odd path
      // would toggle lakes back on wherever the country polygon already covers them.
      const lakeClip=svgNode('clipPath',{id:'physical-lake-exclusion',clipPathUnits:'userSpaceOnUse'});
      lakeClip.append(svgNode('path',{d:`M${v[0]} ${v[1]}h${v[2]}v${v[3]}h${-v[2]}Z`+(regionData.background||[]).filter(l=>l.kind==='lake').map(l=>l.d).join(''),'clip-rule':'evenodd'}));$('states').append(lakeClip);
      for(const layer of regionData.background||[])$('states').append(svgNode('path',{d:layer.d,class:'physical-background '+layer.kind,'fill-rule':'evenodd','aria-hidden':'true'}));
      // Large marine areas sit below their smaller component seas and rivers.
      for (const state of states) {
        const group=svgNode('g',{class:'physical-target '+state.kind,role:'button',tabindex:'0','aria-label':'Sted på kartet'});group.dataset.state=state.n;
        if(state.kind==='sea'&&!regionData.clipped)group.setAttribute('clip-path','url(#physical-water-clip)');
        const path=svgNode('path',{d:state.d,class:'physical-shape','fill-rule':'evenodd','vector-effect':'non-scaling-stroke'});
        if(state.kind==='sea'&&!regionData.clipped)path.setAttribute('clip-path','url(#physical-lake-exclusion)');
        group.append(path);
        const hit=svgNode('path',{d:state.d,class:'physical-hit','fill-rule':'evenodd','vector-effect':'non-scaling-stroke',style:'stroke-width:'+(state.hitWidth||12)+'px'});group.append(hit);
        if(state.kind==='sea'){hit.style.strokeWidth='0';if(!regionData.clipped)hit.setAttribute('clip-path','url(#physical-lake-exclusion)');}
        $('states').append(group);elements.set(state.n,group);
        const b=path.getBBox();centers.set(state.n,{x:state.c[0],y:state.c[1],radius:Math.max(b.width,b.height)/2+10});
        if(state.marker){const marker=svgNode('g',{class:'small-marker physical-marker '+state.kind,role:'button',tabindex:'0','aria-label':'Ekstra treffelt for et lite sted'});marker.dataset.state=state.n;marker.append(svgNode('circle',{cx:state.c[0],cy:state.c[1],r:11,class:'hit'}),svgNode('circle',{cx:state.c[0],cy:state.c[1],r:4.5,class:'visible'}));$('smallStates').append(marker);markers.set(state.n,marker);}
      }
      return;
    }
    if (kart && !counties) {
      const view = regionData.viewBox;
      $('map').setAttribute('viewBox',view.join(' '));
      if (regionData.context) $('states').append(svgNode('path',{d:regionData.context,class:'map-context','fill-rule':'evenodd','aria-hidden':'true'}));
      if (regionData.territory) $('states').append(svgNode('path',{d:regionData.territory,class:'map-context',style:'stroke:none','fill-rule':'evenodd','aria-hidden':'true'}));
      for (const state of states) {
        const el=svgNode('path',{d:state.d,class:'state','fill-rule':'evenodd',role:'button',tabindex:'0','aria-label':shapeLabel});el.dataset.state=state.n;
        $('states').append(el);elements.set(state.n,el);
        stateTransforms.set(state.n,{x:0,y:0,scale:1});
        const box=el.getBBox();centers.set(state.n,{x:state.c[0],y:state.c[1],radius:Math.max(box.width,box.height)/2+10});
        if (state.marker) {
          const g=svgNode('g',{class:'small-marker country-marker',role:'button',tabindex:'0','aria-label':'Ekstra klikkfelt for et lite land'});g.dataset.state=state.n;
          g.append(svgNode('circle',{cx:state.c[0],cy:state.c[1],r:11,class:'hit'}),svgNode('circle',{cx:state.c[0],cy:state.c[1],r:4.5,class:'visible'}));
          $('smallStates').append(g);markers.set(state.n,g);
        }
      }
      if(countryRegion()) {
        for(const state of states){const p=cityData[state.n].p;cityPoints.set(state.n,{x:p[0],y:p[1]});}
        buildCityLayer();prepareBasemap('../assets/geography/region-relief.json?v=cb06677031d3',undefined,document.body.dataset.region);
      }
      return;
    }
    if (counties) {
      const group = svgNode('g',{'fill-rule':'evenodd'}); $('states').append(group);
      for (const state of states) {
        const el = svgNode('path', {d:state.d, class:'state', role:'button', tabindex:'0', 'aria-label':shapeLabel});
        el.dataset.state = state.n; group.append(el); elements.set(state.n,el);
      }
      const bounds = fit(group, {x:28,y:18,w:844,h:514});
      $('map').setAttribute('viewBox',`${bounds.x - 32} 0 ${bounds.width + 64} 550`);
      // Oslo stays in its geographical position, with a second accessible target
      // outside the coast so the smallest county is usable on a touch screen.
      const oslo = centers.get('Oslo');
      if (oslo) {
        const x = Math.min(855,oslo.x + 95), y = Math.min(510,oslo.y + 28);
        $('smallStates').append(svgNode('path', {class:'small-connector',d:`M${oslo.x} ${oslo.y}L${x - 14} ${y}`}));
        const marker = svgNode('g', {class:'small-marker',role:'button',tabindex:'0','aria-label':'Ekstra klikkfelt for et lite fylke'});
        marker.dataset.state='Oslo';
        marker.append(svgNode('circle',{cx:x,cy:y,r:21,class:'hit'}),svgNode('circle',{cx:x,cy:y,r:11,class:'visible'}));
        $('smallStates').append(marker); markers.set('Oslo',marker);
      }
      return;
    }
    const groups = {main:svgNode('g'), AK:svgNode('g'), HI:svgNode('g')};
    $('states').append(groups.main, groups.AK, groups.HI);
    for (const state of states) {
      const el = svgNode('path', {d:state.d, class:'state', role:'button', tabindex:'0', 'aria-label':'Delstat på kartet'});
      el.dataset.state = state.n;
      groups[state.a === 'AK' || state.a === 'HI' ? state.a : 'main'].append(el);
      elements.set(state.n, el);
    }
    fit(groups.main, {x:20, y:16, w:825, h:522});
    const florida = elements.get('Florida').getBBox();
    const mainlandTransform = groups.main.transform.baseVal.consolidate().matrix;
    const southEdge = (florida.y + florida.height) * mainlandTransform.d + mainlandTransform.f;
    const alaska = fit(groups.AK, {x:25, y:southEdge - 125, w:165, h:100, bottom:true});
    const hawaii = fit(groups.HI, {x:215, y:southEdge - 41, w:110, h:41, bottom:true});
    // Fit only the answer shapes. The neighbours follow those transforms without
    // changing state size, hint positions or the separate Alaska/Hawaii insets.
    const context = svgNode('g',{id:'us-context','aria-hidden':'true','pointer-events':'none'});
    const insetBox = (bounds, x, width) => ({x, y:bounds.y - 12, width, height:southEdge + 8 - (bounds.y - 12)});
    const alaskaBox = insetBox(alaska,15,187), hawaiiBox = insetBox(hawaii,210,128);
    const boxPath = b => `M${b.x} ${b.y}h${b.width}v${b.height}h${-b.width}Z`;
    const mainClip = svgNode('clipPath',{id:'us-main-context-clip',clipPathUnits:'userSpaceOnUse'});
    // Let neighbours continue into the SVG's letterboxed margins; cutting at
    // the viewBox would turn northern Canada into a straight artificial coast.
    mainClip.append(svgNode('path',{d:boxPath({x:-2000,y:-2000,width:4000,height:4000})+boxPath(alaskaBox)+boxPath(hawaiiBox),'clip-rule':'evenodd'}));
    const alaskaClip = svgNode('clipPath',{id:'us-alaska-context-clip',clipPathUnits:'userSpaceOnUse'});
    alaskaClip.append(svgNode('rect',alaskaBox));
    context.append(mainClip,alaskaClip);
    for (const area of ['main','AK']) {
      const clipped = svgNode('g',{'clip-path':`url(#us-${area==='main'?'main':'alaska'}-context-clip)`});
      const projected = svgNode('g',{transform:groups[area].getAttribute('transform')});
      for (const country of usContext.areas[area]) projected.append(svgNode('path',{
        d:country.d,class:'map-context','fill-rule':'evenodd','data-country':country.n,'data-area':area
      }));
      clipped.append(projected);context.append(clipped);
    }
    $('states').prepend(context);
    if(statle)prepareBasemap('../assets/geography/us-relief-raster.json?v=04d692908d3f',Object.fromEntries(Object.entries(groups).map(([area,group])=>[area,group.transform.baseVal.consolidate().matrix])));
    $('insetSeparators').setAttribute('d', 'M15 ' + (alaska.y - 12) + 'H202V' + (southEdge + 8) + ' M210 ' + (hawaii.y - 12) + 'H338');
    // Extra click targets for the small northeastern states. No answer labels.
    const small = ['New Hampshire','Vermont','Massachusetts','Rhode Island','Connecticut','New Jersey','Delaware','Maryland'];
    small.forEach((name, i) => {
      const c = centers.get(name), x = 867, y = 162 + i * 35;
      $('smallStates').append(svgNode('path', {class:'small-connector', d:`M${c.x} ${c.y}L${x - 15} ${y}`}));
      const g = svgNode('g', {class:'small-marker', role:'button', tabindex:'0', 'aria-label':'Ekstra klikkfelt for en liten delstat'});
      g.dataset.state = name;
      g.append(svgNode('circle', {cx:x,cy:y,r:17,class:'hit'}), svgNode('circle', {cx:x,cy:y,r:9,class:'visible'}));
      $('smallStates').append(g); markers.set(name, g);
    });
  }
  function flashLabel(name, kind, duration = 1050) {
    const label = answerName(name);
    const c = citiesMode ? cityPoints.get(name) : centers.get(name), unit = 1 / ($('map').getScreenCTM()?.a || 1), width = Math.max(70, label.length * 7 + 22) * unit;
    const view = $('map').viewBox.baseVal;
    const x = Math.max(view.x + width / 2 + 9 * unit, Math.min(view.x + view.width - 9 * unit - width / 2, c.x));
    const y = Math.max(view.y + 26 * unit, Math.min(view.y + view.height - 25 * unit, c.y - 21 * unit));
    const g = svgNode('g', {class:'flash-label ' + kind});
    g.append(svgNode('rect', {x:x - width / 2,y:y - 13 * unit,width,height:26 * unit,rx:4 * unit,'vector-effect':'non-scaling-stroke',style:`filter:drop-shadow(0 ${2 * unit}px ${3 * unit}px #26453c45)`}));
    const text = svgNode('text', {x,y:y + unit,style:`font-size:${12 * unit}px`}); text.textContent = label; g.append(text);
    $('labelLayer').replaceChildren(g);
    later(() => g.remove(), duration);
  }
  function prepareBasemap(url,transforms,region) {
    document.querySelector('.statle-basemap-tools')?.remove();
    if(!basemap)basemap=MapBasemap.create({svg:$('map'),viewport:$('mapViewport')});
    const tools=document.createElement('div');tools.className='statle-basemap-tools';
    const button=document.createElement('button');button.type='button';button.id='statle-basemap';
    const initialLabel=window.QuizLanguage?.translate('Vis fysisk kart')||'Vis fysisk kart';button.title=initialLabel;button.setAttribute('aria-label',initialLabel);button.setAttribute('aria-pressed','false');
    button.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m2 20 7-14 4 7 3-5 6 12H2Zm4-8 3 2 3-2M13 13l3 2 2-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    tools.append(button);$('mapViewport').append(tools);
    let loaded=false;const token=mapGeneration;
    button.addEventListener('click',async()=>{
      button.disabled=true;button.setAttribute('aria-busy','true');
      try {
        if(!loaded) {
          const data=await readMap(url);if(token!==mapGeneration)return;
          const manifest=region?data.regions[region]:data;
          if(!await basemap.set(manifest,{baseUrl:new URL('../assets/geography/',document.baseURI).href,transforms}))return;
          if(token!==mapGeneration)return;loaded=true;
        }
        const visible=document.body.dataset.statleBasemap!=='physical';
        basemap.show(visible);document.body.dataset.statleBasemap=visible?'physical':'original';
        const rawLabel=visible?'Vis originalkart':'Vis fysisk kart',label=window.QuizLanguage?.translate(rawLabel)||rawLabel;button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(visible));
      }catch(_){if(token===mapGeneration)setFeedback('Kartet kunne ikke lastes','error');}
      finally{button.disabled=false;button.removeAttribute('aria-busy');}
    });
  }
  function showHint() {
    if(physical){const el=elements.get(target().n);el.classList.add('hinted');later(()=>el.classList.remove('hinted'),1800);return;}
    const c = citiesMode ? cityPoints.get(target().n) : centers.get(target().n), radius = citiesMode ? 22 : Math.max(25, Math.min(120, c.radius));
    const circle = svgNode('circle', {cx:c.x, cy:c.y, r:radius, class:'hint-ring'});
    $('hintLayer').replaceChildren(circle);
    later(() => circle.remove(), 1450);
  }
  function setBand(name, band) {
    const el = elements.get(name);
    el.classList.remove('retry-pending');
    el.dataset.band = String(band); el.classList.add('found');
    el.setAttribute('aria-label', name + ' – fullført');
    if (markers.has(name)) { markers.get(name).classList.remove('retry-pending'); markers.get(name).dataset.band = String(band); markers.get(name).setAttribute('aria-label', name + ' – fullført'); }
  }
  function updateStats() {
    $('completed').textContent = results.size;
    $('progressFill').style.width = results.size / Math.max(1,phase === 'ready' ? total : queue.length) * 100 + '%';
    $('mistakes').textContent = String(mistakes);
  }
  function setPhase(value){
    phase=value;document.body.dataset.phase=value;
    if(value!=='playing'){questionSymbol.hidden=true;questionSymbol.removeAttribute('src');}
    $('targetName').toggleAttribute('data-no-translate',enhanced()&&citiesMode&&value==='playing');
    if(statle||kart||localMap){if(value==='ready'&&enhanced())$('targetName').after($('targetVerb'));else questionSymbol.before($('targetVerb'));}
  }
  function prompt(){const action=retrying?'Øvingsrunde · klikk på':'Klikk på';$('targetVerb').textContent=boroughs&&target()?.category==='postal-area'?'Postområde · '+action.toLowerCase():action;const subtitle=$('target-continent');if(subtitle){subtitle.hidden=!continentPractice;subtitle.textContent=continentPractice?continentNames[target()?.continent]||'':'';}}
  function next() {
    index++; locked = false; roundMistakes = 0; roundTime = 0;
    $('hintLayer').replaceChildren(); $('labelLayer').replaceChildren();
    elements.forEach(el => el.classList.remove('correct', 'wrong', 'hinted'));
    if (!target()) return finish();
    if(!practice)window.GeoOnline?.statleNext();
    renderQuestion();
    prompt();setFeedback('');
  }
  function choose(name) {
    if (phase === 'ready' || phase === 'finished') {flashLabel(name,'',2800);setFeedback(answerName(name));return;}
    if (phase !== 'playing' || locked || !target()) return;
    tick();
    if (results.has(name) || mastered.has(name)) { flashLabel(name, ''); setFeedback(answerName(name) + ' er allerede fullført.'); return; }
    if(!practice)window.GeoOnline?.statleAnswer(name);
    if (name !== target().n) {
      roundMistakes++; mistakes++; updateStats();
      const el = elements.get(name); el.classList.add('wrong');
      flashLabel(name, 'error');
      later(() => el.classList.remove('wrong'), 1050);
      if (roundMistakes >= 3) showHint();
      setFeedback('Det var ' + answerName(name) + '.', 'error');
      return;
    }
    // Colour depends only on attempts; the clock is informational.
    const band = Math.min(roundMistakes, 3);
    results.set(name, {band, ms:roundTime, mistakes:roundMistakes});
    setBand(name, band); locked = true;
    $('hintLayer').replaceChildren();
    elements.get(name).classList.add('correct'); flashLabel(name, '');
    setFeedback('Riktig! ' + answerName(name) + ' · ' + (roundTime / 1000).toFixed(1).replace('.', ',') + ' s', 'good');
    updateStats(); later(next, 650);
  }
  function start(){retrying=false;mastered.clear();if(enhanced()){advancedInputs().forEach(input=>input.disabled=true);namesInput().disabled=true;$('start').disabled=true;$('restart').disabled=false;}document.querySelectorAll('[name="water-category"]').forEach(input=>input.disabled=true);continentPractice=!!$('continent-practice')?.checked&&['rivers','lakes','mountains'].includes(document.body.dataset.region);practice=continentPractice;document.body.dataset.practice=String(practice);if($('continent-practice'))$('continent-practice').disabled=true;if(practice){window.GeoOnline?.resetStatle();return begin();}if(window.GeoOnline)return GeoOnline.startStatle(begin);return begin();}
  function begin(names) {
    generation++; clearEffects();if($('statle-score'))$('statle-score').hidden=true;
    results = new Map(); index = 0; totalTime = 0; roundTime = 0; lastTick = performance.now();
    roundMistakes = 0; mistakes = 0; locked = false;
    repeatOffer.hidden = true; repeatButton.disabled = false; document.body.dataset.retry = String(retrying);
    elements.forEach((el,name) => { delete el.dataset.band; el.classList.remove('found'); el.classList.toggle('mastered',retrying&&mastered.has(name));el.classList.toggle('retry-pending',retrying&&!mastered.has(name));el.setAttribute('aria-label', mastered.has(name) ? name + ' – fullført' : shapeLabel); });
    markers.forEach((el,name) => { delete el.dataset.band;el.classList.toggle('mastered',retrying&&mastered.has(name));el.classList.toggle('retry-pending',retrying&&!mastered.has(name)); el.setAttribute('aria-label', mastered.has(name) ? name + ' – fullført' : boroughs ? 'Sted på kartet' : counties ? 'Ekstra klikkfelt for et lite fylke' : kart ? 'Ekstra klikkfelt for et lite land' : 'Ekstra klikkfelt for en liten delstat'); });
    queue = names ? names.map(name=>states.find(s=>s.n===name)) : states.filter(s => !mastered.has(s.n));
    if(!names)for (let i = queue.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [queue[i],queue[j]] = [queue[j],queue[i]]; }
    if(continentPractice)queue.sort((a,b)=>continentOrder.indexOf(a.continent)-continentOrder.indexOf(b.continent));
    ($('total-count')||$('completed').parentElement.querySelector('small')).textContent=' / '+queue.length;
    setPhase('playing'); $('overlay').hidden = true;if(enhanced())drawStudyNames();if($('water-options'))$('water-options').hidden=true;
    if($('continent-practice-option'))$('continent-practice-option').hidden=true;
    $('mapViewport').scrollTo({left:0,top:0});
    prompt();
    renderQuestion(); $('elapsed').textContent = '00:00';
    $('restart').disabled = false;
    updateStats(); setFeedback('');
  }
  function finish() {
    setPhase('finished'); locked = true;

    // Let the original score check/name prompt finish before a retry detaches
    // its session. Practice itself never waits for or contacts the service.
    if(!practice){
      repeatButton.disabled = true;
      const run = generation;
      Promise.resolve(window.GeoOnline?.finishStatle()).catch(()=>{}).finally(()=>{if(run===generation)repeatButton.disabled=false;});
    }
    if($('target-continent'))$('target-continent').hidden=true;
    $('targetVerb').textContent = 'Godt jobbet!';
    $('targetName').textContent = boroughs ? 'Alle stedene er fullført.' : municipalities ? (citiesMode?'Alle kommunesentrene er på plass.':'Alle kommunene er på plass.') : physical ? 'Alle stedene er fullført.' : counties ? 'Alle fylkene er på plass.' : kart ? (citiesMode?'Alle hovedstedene er på plass.':'Alle landene er på plass.') : 'Hele USA er på plass.';
    const counts = [0,0,0,0]; results.forEach(r => counts[r.band]++);
    results.forEach((r,name) => { if(r.band === 0)mastered.add(name); });
    repeatOffer.hidden = mastered.size === states.length;
    if(retrying)$('targetName').textContent=repeatOffer.hidden?'Alle er grønne!':'Øvingsrunden er fullført.';
    setFeedback(municipalities ? '' : 'Alle ' + queue.length + ' fullført · ' + timeText(totalTime) + ' · ' + mistakes + ' feil. Grønn: ' + counts[0] + ', gul: ' + counts[1] + ', oransje: ' + counts[2] + ', rød: ' + counts[3] + '.');
    if(!repeatOffer.hidden)repeatOffer.scrollIntoView({block:'nearest'});
  }
  function clickedName(event,element){
    if(boroughs&&event.isTrusted) {
      // A click in a smaller area also belongs to its containing borough.
      // Resolve this geometrically, so Bygdøy never makes Frogner impossible.
      const current=phase==='playing'&&!locked?elements.get(target()?.n):null;
      if(current?.tagName.toLowerCase()==='path') {
        const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(current.getScreenCTM().inverse());
        if(current.isPointInFill(point))return target().n;
      }
    }
    if(!physical)return element.dataset.state;
    if(element.classList.contains('small-marker')){let nearest=null,distance=Infinity;for(const [name,marker] of markers){const circle=marker.querySelector('.visible'),matrix=marker.getScreenCTM(),local=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());if(!circle.isPointInFill(local))continue;const center=new DOMPoint(circle.cx.baseVal.value,circle.cy.baseVal.value).matrixTransform(matrix),d=(event.clientX-center.x)**2+(event.clientY-center.y)**2;if(d<distance){distance=d;nearest=name;}}if(nearest)return nearest;}
    const p=new DOMPoint(event.clientX,event.clientY).matrixTransform($('map').getScreenCTM().inverse()),clicked=elements.get(element.dataset.state);let painted;
    // Ocean catchments include masked land/coastal slivers. isPointInFill does
    // not apply SVG clips, so these invisible areas must not steal a lake hit.
    const maskedWater=[...$('states').querySelectorAll('.physical-background.land,.physical-background.lake')].some(path=>path.isPointInFill(p));
    // A neighbour's enlarged touch corridor must never steal a click on the
    // actual lake/strait/river beneath it. Respect the visible painting order.
    for(const [name,group] of elements){if(maskedWater&&group.classList.contains('sea'))continue;const shape=group.querySelector('.physical-shape');if(group.classList.contains('river')?shape.isPointInStroke(p):shape.isPointInFill(p))painted=name;}
    if(painted)return painted;
    if(maskedWater&&clicked.classList.contains('sea'))return null;
    if(!clicked.classList.contains('river'))return element.dataset.state;
    let best=Infinity,name=element.dataset.state;
    // Transparent touch corridors can overlap. Choose the nearest actual river,
    // rather than whichever neighbouring corridor happens to be painted last.
    for(const [candidate,group] of elements){if(!group.classList.contains('river'))continue;const hit=group.querySelector('.physical-hit');if(!hit.isPointInStroke(p))continue;const path=group.querySelector('.physical-shape'),length=path.getTotalLength();let at=0,distance=Infinity;for(let i=0;i<=48;i++){const t=length*i/48,q=path.getPointAtLength(t),d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<distance){distance=d;at=t;}}let span=length/48;for(let pass=0;pass<4;pass++){for(const t of [Math.max(0,at-span/2),Math.min(length,at+span/2)]){const q=path.getPointAtLength(t),d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<distance){distance=d;at=t;}}span/=2;}if(distance<best){best=distance;name=candidate;}}
    return name;
  }
  $('map').addEventListener('click', e => { const el = e.target.closest('[data-state]'); if (el){const name=clickedName(e,el);if(name)choose(name);} });
  $('map').addEventListener('keydown', e => { const el = e.target.closest('[data-state]'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); choose(el.dataset.state); } });
  function highlight(e, on) {
    const el = e.target.closest('[data-state]'); if (el) elements.get(el.dataset.state).classList.toggle('hovered',on);
  }
  $('map').addEventListener('pointerover',e => highlight(e,true));
  $('map').addEventListener('pointerout',e => highlight(e,false));
  $('map').addEventListener('focusin',e => highlight(e,true));
  $('map').addEventListener('focusout',e => highlight(e,false));
  $('start').addEventListener('click', start);
  function cancelStatle() {
    generation++; clearEffects(); window.GeoOnline?.resetStatle();
    mastered.clear(); results.clear(); queue=[]; index=0; retrying=false; locked=false;
    practice=false; totalTime=0; roundTime=0; mistakes=0; roundMistakes=0;
    document.body.dataset.practice='false';delete document.body.dataset.retry;
    elements.forEach(el=>{delete el.dataset.band;el.classList.remove('found','mastered','retry-pending');el.setAttribute('aria-label',shapeLabel);});
    markers.forEach(el=>{delete el.dataset.band;el.classList.remove('mastered','retry-pending');el.setAttribute('aria-label',statle?'Ekstra klikkfelt for en liten delstat':'Ekstra klikkfelt for et lite land');});
    setPhase('ready');repeatOffer.hidden=true;$('overlay').hidden=false;
    $('statle-score').hidden=true;$('restart').disabled=true;$('start').disabled=false;
    advancedInputs().forEach(input=>input.disabled=false);if(namesInput())namesInput().disabled=false;
    $('targetVerb').textContent='Kan du plassere alle?';$('elapsed').textContent='00:00';
    updateStatleOptions();updateStats();setFeedback('');
  }
  $('restart').addEventListener('click',()=>enhanced()?cancelStatle():start());
  const studyLayouts=new Map();
  let localPreviewTimer=0;
  function drawStudyNames() {
    if(!enhanced())return;
    const layer=$('statle-study-names');if(!layer)return;layer.replaceChildren();
    if(phase!=='ready'||!showNames())return;
    const view=$('map').viewBox.baseVal,matrix=$('map').getScreenCTM(),rect=$('map').getBoundingClientRect(),localFont=10/(matrix?.a||1);
    let localView=[view.x,view.y,view.width,view.height];
    if(localMap&&matrix&&rect.width&&rect.height){
      const inverse=matrix.inverse(),a=new DOMPoint(rect.left,rect.top).matrixTransform(inverse),b=new DOMPoint(rect.right,rect.bottom).matrixTransform(inverse);
      localView=[a.x,a.y,b.x-a.x,b.y-a.y];
    }
    const key=(document.body.dataset.region||'statle')+'|'+citiesMode+'|'+(window.QuizLanguage?.language||'no')+(localMap?'|'+localView.map(n=>n.toFixed(2)).join(',')+'|'+localFont.toFixed(3):'');
    if(!studyLayouts.has(key)) {
      const project=(state,p)=>{const t=stateTransforms.get(state.n);return [p[0]*t.scale+t.x,p[1]*t.scale+t.y];};
      const cities=citiesMode?new Map(states.map(state=>[state.n,{name:municipalities?displayCityName(state):window.QuizLanguage?.translate(displayCityName(state))||displayCityName(state),...cityPoints.get(state.n),...(municipalities?{locations:cityData[state.n].locations}:{} )}])):null;
      const callouts=new Map();
      markers.forEach((marker,name)=>{const dot=marker.querySelector('.visible');callouts.set(name,{x:dot.cx.baseVal.value-17,y:dot.cy.baseVal.value,anchor:'end'});});
      const canvas=document.createElement('canvas'),context=canvas.getContext('2d'),widths=new Map();
      const measure=(text,size,kind)=>{const id=kind+'|'+size+'|'+text;if(!widths.has(id)){context.font=(kind==='state'?'700':'600')+' '+size+'px Inter,"Segoe UI",sans-serif';widths.set(id,context.measureText(text).width);}return widths.get(id);};
      measure.metrics=(size,kind)=>{context.font=(kind==='state'?'700':'600')+' '+size+'px Inter,"Segoe UI",sans-serif';const metrics=context.measureText('Mg');return{fontBoundingBoxAscent:metrics.fontBoundingBoxAscent??size*1.05,fontBoundingBoxDescent:metrics.fontBoundingBoxDescent??size*.3};};
      if(localMap&&studyLayouts.size>24)studyLayouts.clear();
      studyLayouts.set(key,localMap?LocalLabelLayout.layout({states,viewBox:localView,measure,fontSize:localFont,cities}):statle?StatleLabelLayout.layout({states,project,cities,callouts,measure,fontSize:7.7,cityFontSize:7,dotRadius:4.5,bounds:{x:8,y:8,w:884,h:534}}):RegionLabelLayout.layout({states,capitalData:cityData,showCapitals:citiesMode,measure,countryName:name=>window.QuizLanguage?.translate(name)||name,capitalName:(name,row)=>window.QuizLanguage?.language==='en'?row.en||name:name,dotRadius:4.5,bounds:{x:6,y:6,w:888,h:638}}));
    }
    const result=studyLayouts.get(key);
    layer.dataset.layoutIssues=JSON.stringify(result.issues);
    for(const label of [...result.stateLabels,...result.cityLabels]) {
      if(label.leader&&(localMap||countryRegion()||label.kind==='city'||label.state==='Hawaii')) {
        const p=label.leader,d=`M${p.x1} ${p.y1}L${p.x2} ${p.y2}`;
        const stroke=localMap?{'vector-effect':'non-scaling-stroke'}:{};
        layer.append(svgNode('path',{d,class:'study-city-leader-halo',...stroke}),svgNode('path',{d,class:label.kind==='city'?'study-city-leader':'study-state-leader',...stroke}));
      }
      const text=svgNode('text',{x:label.x,y:label.y,class:'study-name study-'+label.kind,'text-anchor':label.anchor||'middle','font-size':label.fontSize,'data-label-state':label.state,'data-label-box':JSON.stringify(label.box),'data-no-translate':''});
      if(localMap){text.setAttribute('vector-effect','non-scaling-stroke');text.style.strokeWidth='1.2px';}
      label.lines.forEach((line,i)=>{const span=svgNode('tspan',{x:label.x,dy:i?'1.12em':'0'});span.textContent=line;text.append(span);});
      layer.append(text);
    }
  }
  function buildCityLayer() {
    const layer=svgNode('g',{id:'statle-city-points'}),names=svgNode('g',{id:'statle-study-names','aria-hidden':'true','pointer-events':'none'});
    const locations=states.flatMap(state=>municipalities&&cityData[state.n].locations?.length?cityData[state.n].locations.map(place=>({state,name:place.name,x:place.p[0],y:place.p[1]})):[{state,...cityPoints.get(state.n)}]);
    for(const c of locations){
      const state=c.state,point=svgNode('g',{class:'city-point',...(statle?{'aria-hidden':'true','pointer-events':'none'}:{role:'button',tabindex:'0','aria-label':municipalities?'Kommunesenter på kartet':'Hovedstad på kartet'})});
      const nearest=Math.min(...locations.filter(other=>other!==c).map(p=>Math.hypot(p.x-c.x,p.y-c.y)));
      point.dataset.state=state.n;
      if(c.name)point.dataset.centre=c.name;
      if(!statle)point.append(svgNode('circle',{cx:c.x,cy:c.y,r:Math.max(.05,Math.min(6,nearest*.4)),class:'city-hit'}));
      point.append(svgNode('circle',{cx:c.x,cy:c.y,r:Math.max(.05,Math.min(2.6,nearest*.32)),class:'city-dot','vector-effect':'non-scaling-stroke'}));layer.append(point);
    }
    $('hintLayer').before(names,layer);scaleLocalCityPoints();updateStatleOptions();advancedInputs().forEach(input=>input.disabled=false);namesInput().disabled=false;
  }
  function scaleLocalCityPoints(){
    if(!municipalities||!cityPoints.size)return;
    const scale=$('map').getScreenCTM()?.a||1;
    if(cityMarkerScale===String(scale))return;cityMarkerScale=String(scale);
    const points=[...($('statle-city-points')?.children||[])].map(point=>{const dot=point.querySelector('.city-dot');return{point,x:dot.cx.baseVal.value,y:dot.cy.baseVal.value};});
    for(const c of points){
      const point=c.point,nearest=Math.min(...points.filter(other=>other!==c).map(p=>Math.hypot(p.x-c.x,p.y-c.y)));
      point.querySelector('.city-hit').setAttribute('r',Math.max(.05,Math.min(11/scale,nearest*.4)));
      point.querySelector('.city-dot').setAttribute('r',Math.max(.05,Math.min(3/scale,nearest*.32)));
    }
  }
  function updateStatleOptions() {
    if(!enhanced())return;
    citiesMode=!!advancedInput()?.checked||!!capitalsInput()?.checked;
    if(statle){
      const nextData=capitalsInput()?.checked?stateCapitals:largestCities;
      if(nextData&&nextData!==cityData){
        cityData=nextData;studyLayouts.clear();
        for(const state of states){const t=stateTransforms.get(state.n),p=cityData[state.n].p;if(t)cityPoints.set(state.n,{x:p[0]*t.scale+t.x,y:p[1]*t.scale+t.y});}
        for(const point of $('statle-city-points')?.children||[]){const c=cityPoints.get(point.dataset.state);if(c)for(const circle of point.querySelectorAll('circle')){circle.setAttribute('cx',c.x);circle.setAttribute('cy',c.y);}}
      }
    }
    const variant=municipalities?'municipalityQuestionMode':statle?'statleVariant':'kartVariant';
    if(citiesMode)document.body.dataset[variant]=municipalities?'centres':statle?(capitalsInput()?.checked?'capitals':'largest-city'):'capitals';else delete document.body.dataset[variant];
    $('start').textContent=statle?'Start Statle →':'Start →';
    if(phase==='ready')$('targetName').textContent=statle?'USAs 50 delstater':regionData.title;
    $('statle-city-points')?.toggleAttribute('hidden',!citiesMode);
    $('statle-city-points')?.setAttribute('aria-hidden',String(!citiesMode));
    if(!statle)for(const point of $('statle-city-points')?.children||[])point.setAttribute('tabindex',citiesMode?'0':'-1');
    drawStudyNames();
  }
  for(const input of [...advancedInputs(),namesInput()])input?.addEventListener('change',()=>{if(statle&&input.checked&&advancedInputs().includes(input))advancedInputs().forEach(other=>{if(other!==input)other.checked=false;});window.GeoOnline?.resetStatle();updateStatleOptions();});
  if(localMap)window.ClickMapZoom?.subscribe(()=>{
    scaleLocalCityPoints();
    clearTimeout(localPreviewTimer);
    if(phase==='ready'&&showNames())localPreviewTimer=setTimeout(drawStudyNames,125);
  });
  addEventListener('quiz-language-change',()=>{if(enhanced()){drawStudyNames();if(phase==='ready')setFeedback('');const button=$('statle-basemap');if(button){const label=window.QuizLanguage.translate(document.body.dataset.statleBasemap==='physical'?'Vis originalkart':'Vis fysisk kart');button.title=label;button.setAttribute('aria-label',label);}}});
  const menu = $('geoMenu'), menuButton = $('geoMenuButton');
  let menuOpener=menuButton;
  function openMenu(button){menuOpener=button;menu.showModal();button.setAttribute('aria-expanded','true');}
  menuButton.addEventListener('click', () => openMenu(menuButton));
  $('kart-menu-button')?.addEventListener('click',event=>openMenu(event.currentTarget));
  $('geoMenuClose').addEventListener('click', () => menu.close());
  const menuTools=document.createElement('div');menuTools.className='geo-menu-tools';
  for(const [label,title,action] of [
    ['↓','Lagre som PDF',()=>window.print()],
    ['⛶','Fullskjerm',()=>document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.()],
    ['◐','Lys eller mørk modus',()=>themeButtons[0].click()]
  ]) {
    const button=document.createElement('button');button.type='button';button.textContent=label;button.title=title;button.setAttribute('aria-label',title);button.addEventListener('click',action);menuTools.append(button);
    if(label==='◐')button.dataset.languageAnchor='';
  }
  menu.append(menuTools);
  const menuBack=document.createElement('a');menuBack.className='geo-menu-back';menuBack.href='../geografi.html';menuBack.textContent='←';menuBack.setAttribute('aria-label','Tilbake til geografi');menu.append(menuBack);
  menu.addEventListener('close', () => { menuButton.setAttribute('aria-expanded', 'false');$('kart-menu-button')?.setAttribute('aria-expanded','false');menuOpener.focus(); });
  menu.addEventListener('click', event => {
    const box = menu.getBoundingClientRect();
    if (event.target === menu && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) menu.close();
  });
  function resetMap() {
    clearTimeout(localPreviewTimer);
    basemap?.clear();document.body.dataset.statleBasemap='original';document.querySelector('.statle-basemap-tools')?.remove();
    $('statle-city-points')?.remove();$('statle-study-names')?.remove();cityPoints.clear();stateTransforms.clear();studyLayouts.clear();
    citiesMode=false;cityData=null;cityMarkerScale='';delete document.body.dataset.kartVariant;delete document.body.dataset.municipalityQuestionMode;
    mastered.clear();retrying=false;continentPractice=false;repeatOffer.hidden=true;delete document.body.dataset.retry;
    generation++;clearEffects();elements.clear();markers.clear();centers.clear();
    $('terrain-boundary-halos')?.remove();$('states').replaceChildren();$('smallStates').replaceChildren();$('insetSeparators').setAttribute('d','');
    $('map').setAttribute('viewBox','0 0 900 550');
    results=new Map();index=0;mistakes=0;totalTime=0;setPhase('ready');locked=false;
    $('completed').textContent='0';$('elapsed').textContent='00:00';$('mistakes').textContent='0';$('progressFill').style.width='0%';
    $('overlay').hidden=false;$('start').disabled=true;$('restart').disabled=true;$('statle-score').hidden=true;
    document.querySelectorAll('[name="water-category"]').forEach(input=>input.disabled=false);
    if($('continent-practice'))$('continent-practice').disabled=false;
  }
  const waterCategories=()=>[...document.querySelectorAll('[name="water-category"]:checked')].map(input=>input.value).sort();

  // A floating world-map panel can be moved from any non-interactive surface.
  const panel=document.querySelector('.game-panel');let panelDrag=null;
  panel.addEventListener('pointerdown',event=>{
    if(!physical||event.button!==0||event.target.closest('button,a,input,label,select,summary,details,.water-options,.panel-header'))return;
    const rect=panel.getBoundingClientRect();panelDrag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};panel.setPointerCapture(event.pointerId);event.preventDefault();
  });
  panel.addEventListener('pointermove',event=>{if(!panelDrag||event.pointerId!==panelDrag.id)return;const rect=panel.getBoundingClientRect();panel.style.left=Math.max(6,Math.min(innerWidth-rect.width-6,panelDrag.left+event.clientX-panelDrag.x))+'px';panel.style.top=Math.max(6,Math.min(innerHeight-rect.height-6,panelDrag.top+event.clientY-panelDrag.y))+'px';panel.style.bottom='auto';});
  const stopPanelDrag=()=>{panelDrag=null;};panel.addEventListener('pointerup',stopPanelDrag);panel.addEventListener('pointercancel',stopPanelDrag);panel.addEventListener('lostpointercapture',stopPanelDrag);
  addEventListener('resize',()=>{if(!physical)return;$('map').setAttribute('preserveAspectRatio',innerWidth>700?'none':'xMidYMid meet');if(panel.style.top){const r=panel.getBoundingClientRect();panel.style.left=Math.max(6,Math.min(innerWidth-r.width-6,r.left))+'px';panel.style.top=Math.max(6,Math.min(innerHeight-r.height-6,r.top))+'px';}});

  const readMap=url=>fetch(url).then(response=>{if(!response.ok)throw Error('Kartet kunne ikke hentes');return response.json();});
  if(boroughs) {
    shapeLabel='Sted på kartet';document.body.dataset.region='bydeler';
    readMap('../assets/geography/oslo-bydeler/oslo-be1c6af3e49f.json').then(data=>{
      if(data.ruleset!=='oslo-areas-v5'||!Array.isArray(data.states)||data.states.length!==43||new Set(data.states.map(state=>state.n)).size!==data.states.length||data.states.some(state=>!state.d||state.marker||!['land','forest','lake'].includes(state.kind))||!data.states.some(state=>state.n==='Sentrum'))throw Error('Ufullstendig kart');
      regionData=data;states=data.states;total=states.length;
      $('targetName').textContent=data.title||'Oslo';$('total-count').textContent=' / '+total;
      $('map').setAttribute('aria-label','Klikkbart kart over Oslo og nærområdene');
      buildMap();updateStats();window.ClickMapZoom?.setBase(data.camera);window.dispatchEvent(new Event('resize'));
      $('targetVerb').textContent='Kan du plassere alle?';
      $('start').disabled=false;$('start').textContent='Start →';
    }).catch(()=>{$('start').textContent='Kartet kunne ikke lastes';setFeedback('Last siden på nytt for å prøve igjen.','error');});
    setPhase('ready');return;
  }
  if(municipalities) {
    let municipalityIndex;
    const maps=new Map();
    async function selectMunicipalityCounty(code) {
      const county=municipalityIndex?.counties.find(county=>county.code===code);
      if(!county)return;
      const token=++mapGeneration;window.GeoOnline?.resetStatle();resetMap();shapeLabel='Kommune på kartet';
      document.body.dataset.county=code;document.body.dataset.region='kommuner-'+code;
      if(county.variant)document.body.dataset.municipalityVariant=county.variant;
      else delete document.body.dataset.municipalityVariant;
      $('municipality-selection').hidden=true;$('kart-game').hidden=false;
      namesInput().checked=false;namesInput().disabled=true;
      advancedInput().checked=false;advancedInput().disabled=true;
      $('targetVerb').textContent='Kan du plassere alle?';$('targetName').textContent=county.quizTitle||county.name;
      $('start').textContent='Laster kart …';setFeedback('');
      const url=new URL(location.href);url.searchParams.set('fylke',code);history.replaceState(null,'',url);
      try {
        if(!maps.has(code))maps.set(code,readMap('../assets/geography/municipalities/'+county.file+'?v='+encodeURIComponent(county.revision||municipalityIndex.version||'1')).catch(error=>{maps.delete(code);throw error;}));
        if(!municipalityCentres)municipalityCentres=readMap('../assets/geography/municipality-centres.json?v=39ae0b050f5d').catch(error=>{municipalityCentres=null;throw error;});
        const [data,centreAtlas]=await Promise.all([maps.get(code),municipalityCentres]);if(token!==mapGeneration)return;
        if(!data.states?.length||new Set(data.states.map(state=>state.n)).size!==data.states.length||data.variant!==county.variant)throw Error('Ufullstendig kart');
        const centres=centreAtlas.regions['county-'+code]?.centres;
        if(!centres||data.states.some(state=>!centres[state.n]?.name||!Array.isArray(centres[state.n].p)||centres[state.n].p.length!==2||!centres[state.n].p.every(Number.isFinite)))throw Error('Ufullstendige kommunesentre');
        cityData=centres;
        regionData=data;states=data.states;total=states.length;
        $('targetName').textContent=data.title||county.quizTitle||county.name;
        const countyLabel=$('municipality-current-county');if(countyLabel)countyLabel.textContent=data.title||county.quizTitle||county.name;
        $('total-count').textContent=' / '+total;
        $('map').setAttribute('aria-label','Klikkbart kommunekart over '+(data.title||county.name));
        buildMap();updateStats();window.ClickMapZoom?.setBase();window.dispatchEvent(new Event('resize'));
        $('start').disabled=false;$('start').textContent='Start →';
        window.dispatchEvent(new CustomEvent('municipality-game-ready',{detail:{code,count:total,title:data.title||county.name}}));
      } catch(_) {
        if(token!==mapGeneration)return;
        $('start').textContent='Kartet kunne ikke lastes';setFeedback('Velg fylke på nytt for å prøve igjen.','error');
      }
    }
    window.addEventListener('municipality-select',event=>selectMunicipalityCounty(event.detail.code));
    window.addEventListener('municipality-index-ready',event=>{
      municipalityIndex=event.detail;
      const selected=new URLSearchParams(location.search).get('fylke');
      if(selected)selectMunicipalityCounty(selected);
    });
    $('kart-back').addEventListener('click',event=>{
      event.preventDefault();++mapGeneration;window.GeoOnline?.resetStatle();resetMap();$('kart-game').hidden=true;
      $('municipality-selection').hidden=false;delete document.body.dataset.county;delete document.body.dataset.region;delete document.body.dataset.municipalityVariant;
      const url=new URL(location.href);url.searchParams.delete('fylke');history.replaceState(null,'',url);
      window.dispatchEvent(new CustomEvent('municipality-back'));
    });
    setPhase('ready');return;
  }
  let continents,countyMap,worldWater,mountainEurope;
  async function selectMap(region) {
    const titles={fylker:'Norske fylker',europe:'Europa',asia:'Asia',northAmerica:'Nord- og Mellom-Amerika',southAmerica:'Sør-Amerika',africa:'Afrika',oceania:'Oseania',rivers:'Verdens elver',lakes:'Innsjøer',seas:'Havområder, bukter og stred',mountains:'Fjellkjeder og høyland'};
    if(!Object.hasOwn(titles,region))return;
    if(document.body.dataset.region!==region&&$('continent-practice'))$('continent-practice').checked=false;
    practice=!!$('continent-practice')?.checked;document.body.dataset.practice=String(practice);if($('target-continent'))$('target-continent').hidden=true;
    panel.style.removeProperty('top');panel.style.removeProperty('left');panel.style.removeProperty('bottom');const token=++mapGeneration;window.GeoOnline?.resetStatle();resetMap();document.body.dataset.region=region;counties=region==='fylker';physical=['rivers','lakes','seas','mountains'].includes(region);document.body.dataset.physical=String(physical);document.body.dataset.countryRegion=String(countryRegions.has(region));shapeLabel=physical?'Sted på kartet':counties?'Fylke på kartet':'Land på kartet';
    $('kart-selection').hidden=true;$('kart-game').hidden=false;$('targetName').textContent=titles[region];$('targetVerb').textContent=countryRegion()?'Kan du plassere alle?':'Klar for en runde?';$('start').textContent='Laster kart …';setFeedback('Laster kart …');
    for(const id of ['region-capital-option','region-names-option'])$(id).hidden=!countryRegion();

    if(countryRegion()){advancedInput().disabled=true;namesInput().disabled=true;}
    const url=new URL(location.href);url.searchParams.set('region',region);history.replaceState(null,'',url);
    try {
      if(counties){countyMap||=readMap('../assets/geography/norway-counties.json?v=a785cd12272f').catch(error=>{countyMap=null;throw error;});const data=await countyMap;if(token!==mapGeneration)return;states=data;regionData=null;}
      else if(physical){
        let data;if(['rivers','lakes','seas'].includes(region)){worldWater||=readMap('../assets/geography/physical-maps/world-water.json?v=e70efb54a9af').catch(e=>{worldWater=null;throw e;});data=await worldWater;}
        else{mountainEurope||=readMap('../assets/geography/physical-maps/mountain-europe.json?v=e41fa6514b87').catch(e=>{mountainEurope=null;throw e;});data=await mountainEurope;}
        if(token!==mapGeneration)return;regionData={...data.regions[region],background:(data.regions[region].background||data.background).concat(data.regions[region].extraLand||[])};states=regionData.states.filter(s=>region!=='seas'||waterCategories().includes(s.group));document.body.dataset.waterCategories=waterCategories().join(',');
        if(window.GEO_QUIZ_EN)for(const state of states)if(state.en)window.GEO_QUIZ_EN.names[state.n]=state.en;
      }else {continents||=readMap('../assets/geography/continent-maps.json?v=8856fe595a16').catch(error=>{continents=null;throw error;});const data=await continents;if(token!==mapGeneration)return;regionData=data.regions[region];states=regionData.states;regionalCapitals||=readMap('../assets/geography/region-capitals.json?v=a52d47c023d4').catch(error=>{regionalCapitals=null;throw error;});const capitals=await regionalCapitals;if(token!==mapGeneration)return;cityData=capitals.regions[region].capitals;if(window.GEO_QUIZ_EN)for(const capital of Object.values(cityData))if(capital.en)window.GEO_QUIZ_EN.names[capital.name]=capital.en;}
      if(token!==mapGeneration)return;total=states.length;
      if(new Set(states.map(s=>s.n)).size!==total)throw Error('Ufullstendig kart');
      if(countryRegion()&&states.some(state=>!cityData[state.n]?.name||cityData[state.n].p?.length!==2))throw Error('Ufullstendige hovedsteder');
      $('total-count').textContent=' / '+total;$('map').setAttribute('aria-label',counties?'Klikkbart kart over Norges 15 fylker':'Klikkbart kart over '+titles[region]);
      document.querySelector('.map-credit').hidden=counties||physical;document.querySelector('.county-credit').hidden=!counties;document.querySelector('.physical-credit').hidden=!physical;if($('river-credit'))$('river-credit').hidden=region!=='rivers';
      $('water-options').hidden=region!=='seas';$('continent-practice-option').hidden=!['rivers','lakes','mountains'].includes(region);$('mistakes-label').textContent=window.QuizLanguage?.language==='en'?'Mistakes':'Feil';
      for(const id of ['region-capital-option','region-names-option'])$(id).hidden=!countryRegion();
      $('restart').textContent=countryRegion()?'Avbryt':'↻ Ny runde';$('restart').setAttribute('aria-label',countryRegion()?'Avbryt':'Start en ny runde');
      if(countryRegion()){advancedInput().checked=false;namesInput().checked=false;}setPhase('ready');
      updateStats();
      $('map').setAttribute('preserveAspectRatio',physical&&innerWidth>700?'none':'xMidYMid meet');buildMap();window.ClickMapZoom?.setBase();window.dispatchEvent(new Event('resize'));$('statle-top-ten').disabled=!total;$('start').disabled=!total;$('start').textContent=total?'Start →':'Velg minst én kategori';setFeedback('');
    }catch(_){if(token!==mapGeneration)return;$('start').textContent='Kartet kunne ikke lastes';setFeedback('Velg kart på nytt for å prøve igjen.','error');}
  }
  if(kart){
    document.querySelectorAll('[data-map-region]').forEach(button=>button.addEventListener('click',()=>selectMap(button.dataset.mapRegion)));
    $('kart-back').addEventListener('click',event=>{event.preventDefault();++mapGeneration;window.GeoOnline?.resetStatle();resetMap();$('kart-game').hidden=true;$('kart-selection').hidden=false;delete document.body.dataset.region;delete document.body.dataset.physical;delete document.body.dataset.countryRegion;delete document.body.dataset.kartVariant;const url=new URL(location.href);url.searchParams.delete('region');history.replaceState(null,'',url);document.querySelector('#kart-selection h1')?.focus();});
    document.querySelectorAll('[name="water-category"]').forEach(input=>input.addEventListener('change',()=>selectMap('seas')));
    $('continent-practice').addEventListener('change',()=>{practice=$('continent-practice').checked;document.body.dataset.practice=String(practice);window.GeoOnline?.resetStatle();});
    const selected=new URLSearchParams(location.search).get('region');if(selected)selectMap(selected);
    return;
  }
  setPhase('ready');
  const embedded = document.getElementById('statle-map-data');
  const mapData = embedded ? Promise.resolve(JSON.parse(embedded.textContent)) : fetch(counties ? '../assets/geography/norway-counties.json?v=a785cd12272f' : '../assets/geography/us-states.json?v=6416e46fca2d').then(response => {
    if (!response.ok) throw new Error('Kartet kunne ikke hentes'); return response.json();
  });
  const contextData = counties ? Promise.resolve(null) : fetch('../assets/geography/us-context.json?v=a19ed62a4670').then(response => {
    if (!response.ok) throw new Error('Nabokartet kunne ikke hentes'); return response.json();
  });
  const citiesData = statle ? readMap('../assets/geography/us-largest-cities.json?v=53825bbfb938') : Promise.resolve(null);
  const capitalsData = statle ? readMap('../assets/geography/us-capitals.json?v=ba59c8715eb5') : Promise.resolve(null);
  Promise.all([mapData, contextData, citiesData,capitalsData]).then(([data, context, cities,capitals]) => {
    usContext = context;
    largestCities=cities;stateCapitals=capitals;cityData = cities;
    states = data;
    if (states.length !== total || new Set(states.map(s=>s.n)).size !== total) throw new Error('Ufullstendig kart');
    if(statle&&states.some(state=>[largestCities,stateCapitals].some(dataset=>!dataset[state.n]?.name||dataset[state.n].p?.length!==2)))throw Error('Ufullstendige byer');
    buildMap();
    if(statle) {
      buildCityLayer();
    }
    window.ClickMapZoom?.setBase(); $('start').disabled = false; if(!statle)$('start').textContent = counties ? 'Start Norske fylker →' : 'Start Statle →';
  }).catch(() => { $('start').textContent = 'Kartet kunne ikke lastes'; setFeedback('Last siden på nytt for å hente kartet.','error'); });
})();
