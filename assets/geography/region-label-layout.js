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
