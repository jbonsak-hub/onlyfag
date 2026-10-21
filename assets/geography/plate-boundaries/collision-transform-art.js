/* Terrain and structural detail for the collision and transform teaching models.
   All changes follow the slider: there is no ambient or automatic animation. */
(() => {
  'use strict';
  window.PlateBoundaryArt ||= {};

  window.PlateBoundaryArt.collision = function (p, ctx) {
    const {Y,path,line,text,caption,arrow,hotspot,quake,earth,mobile,labels,ramp,f} = ctx;
    const m = 5 + 120 * p, root = 35 + 123 * p;
    const topPoints = [
      [0,180],[270,180],[322,179-m*.15],[355,177-m*.32],
      [402,179-m*.48],[438,180-m*.22],[480,175-m],
      [517,180-m*.54],[553,175-m*.85],[590,179-m*.26],
      [640,180-m*.34],[690,180-m*.12],[735,180],[1000,180]
    ];
    const plot = points => line(points.map(([x,y]) => ({x:f(x),y:Y(y)})));
    const top = plot(topPoints);
    const crust = top + `V${Y(266)}H700Q602 ${Y(278+root)} 500 ${Y(278+root)}Q398 ${Y(278+root)} 292 ${Y(266)}H0Z`;
    const lithosphere = top + `V${Y(312)}H720Q500 ${Y(350+root)} 290 ${Y(312)}H0Z`;
    let art = earth();
    art += `<defs>
      <linearGradient id="cc-land" x2="0" y2="1"><stop stop-color="#e1c59b"/><stop offset="1" stop-color="#b98e6e"/></linearGradient>
      <linearGradient id="cc-deep" x2="0" y2="1"><stop stop-color="#a98b70"/><stop offset="1" stop-color="#7f6b5e"/></linearGradient>
      <clipPath id="cc-crust-clip"><path d="${crust}"/></clipPath>
    </defs>`;

    // The distant range gives the land surface depth without hiding the section.
    const back = [[242,181],[308,173-m*.22],[362,176-m*.43],[405,171-m*.22],
      [456,169-m*.68],[501,172-m*.38],[548,167-m*.76],[599,174-m*.39],
      [657,171-m*.47],[716,179-m*.13],[780,181]];
    art += path(plot(back) + `L780 ${Y(208)}H242Z`,'#6f8c7b','opacity=".75" data-feature="distant-range"');
    art += path(lithosphere,'url(#cc-deep)');
    art += path(crust,'url(#cc-land)','data-feature="mountains" stroke="#b7cc9e" stroke-width="3" stroke-linejoin="round"');

    // Front facets, slopes and narrow valleys grow with the mountain relief.
    art += '<g clip-path="url(#cc-crust-clip)">';
    for (const [peakX,peakY,footX,footY] of [
      [355,177-m*.32,321,185],[402,179-m*.48,440,192],
      [480,175-m,443,186],[553,175-m*.85,596,184],[640,180-m*.34,692,191]
    ]) {
      art += path(plot([[peakX,peakY],[footX,footY],[peakX+16,190]])+'Z',
        peakX === 480 || peakX === 640 ? '#987d67' : '#f0d6ac',`opacity="${f(.25+.35*p)}"`);
      art += path(plot([[peakX,peakY],[peakX+(footX-peakX)*.38,peakY+(footY-peakY)*.62],[footX,footY]]),
        'none','stroke="#876c59" stroke-width="1.5" opacity=".4"');
    }
    if (p > .5) {
      const snow = ramp(p,.5,.85);
      art += path(plot([[468,187-m],[480,175-m],[495,194-m],[483,189-m],[477,194-m]])+'Z',
        '#f0f4e5',`opacity="${f(snow)}"`);
      art += path(plot([[541,189-m*.85],[553,175-m*.85],[568,192-m*.85],[555,187-m*.85]])+'Z',
        '#e8eee0',`opacity="${f(snow*.85)}"`);
    }

    // Traced layers develop shorter wavelengths and larger folds under compression.
    const folded = (base, depth = 0) => {
      const points=[];
      for(let x=30;x<=970;x+=6){
        const envelope=Math.exp(-(((x-500)/190)**2));
        const wave=Math.sin((x-305)/(45-16*p));
        const y=base+depth-(4+23*p)*envelope*wave-17*p*envelope;
        points.push([x,y]);
      }
      return points;
    };
    for(let i=0;i<6;i++){
      const upper=folded(202+i*15),lower=folded(202+i*15,8);
      art += path(plot([...upper,...lower.reverse()])+'Z',i%2?'#c29d77':'#efd4a4',
        'opacity=".65" data-feature="fold-layer"');
      art += path(plot(upper),'none','stroke="#795e4c" stroke-width="1" opacity=".32"');
    }
    for(const x of [390,480,575]){
      const a={x:x-70*p,y:275+45*p},b={x:x+40,y:171-45*p};
      art += path(plot([[a.x,a.y],[b.x,b.y]]),'none',
        `stroke="#7b5c48" stroke-width="2" opacity="${f(.25+.6*p)}" data-feature="thrust-fault"`);
      if(p>.2) for(const t of [.4,.59,.78]){
        const tx=a.x+(b.x-a.x)*t,ty=a.y+(b.y-a.y)*t;
        art += path(plot([[tx,ty],[tx+11,ty-2],[tx+8,ty+9]])+'Z','#795b48',`opacity="${f(p*.7)}"`);
      }
    }

    // A closed intrusion remains within continental crust. No route to the surface.
    const melt=ramp(p,.76,.98);
    if(melt>0){
      art += `<g opacity="${f(melt)}" data-feature="crustal-melt"><ellipse cx="510" cy="${Y(354)}" rx="91" ry="${Y(403)-Y(354)}" fill="url(#melt)"/>`;
      for(const [x,y,rx] of [[458,355,14],[500,370,19],[548,344,17]]){
        art += `<ellipse cx="${x}" cy="${Y(y)}" rx="${rx}" ry="${Y(y+12)-Y(y)}" fill="#f5ad73" stroke="#e18a5f"/>`;
      }
      art += path(`M492 ${Y(350)}Q471 ${Y(326)} 488 ${Y(307)}Q510 ${Y(291)} 532 ${Y(309)}Q539 ${Y(328)} 517 ${Y(340)}Z`,
        '#edbaaa','stroke="#e4a08b" stroke-width="2" data-feature="granite-intrusion"')+'</g>';
    }
    art += '</g>';
    art += path(top,'none','stroke="#bdd0a1" stroke-width="3" stroke-linejoin="round"');
    art += arrow(150,230,96)+arrow(856,230,-96);
    for(const [x,y] of [[410,261],[532,272],[609,230]]) if(p>.2) art+=quake(x,y);
    // The paired samples converge as the belt shortens, like the traced layers.
    for(const sign of [-1,1]){
      const x=500+sign*(274-111*p);
      art += `<rect x="${f(x-4)}" y="${Y(205)-4}" width="8" height="8" rx="1" fill="#e9f1d4" stroke="#6c7d60" stroke-width="1.5" data-feature="shortening-sample"/>`;
    }

    art += `<g class="diagram-labels"${labels?'':' hidden'}>`;
    art += text(60,137,'Kontinent')+text(795,137,'Kontinent');
    if(p>.12){
      art += text(65,65,mobile?'Fjellkjede':'Foldet fjellkjede');
      art += path(`M245 ${Y(72)}L459 ${Y(166-m*.66)}`,'none','class="callout-line"');
    }
    art += text(426,375+57*p,'Skorperot','terrain-label')+text(70,425,'Mantel','terrain-label');
    if(melt>0){
      art += text(mobile?65:220,352,mobile?'Smeltelommer':'Delvis smelting','terrain-label');
      art += path(`M${mobile?302:360} ${Y(346)}L442 ${Y(355)}`,'none','class="callout-line"');
      art += text(mobile?620:740,300,mobile?'Granitt':'Magma i skorpa','terrain-label');
      art += path(`M${mobile?615:735} ${Y(306)}L536 ${Y(316)}`,'none','class="callout-line"');
    }
    if(!mobile){
      art += caption(58,292,'Kontinentalskorpe','terrain-label')+caption(754,292,'Kontinentalskorpe','terrain-label');
      if(p>.15) art += caption(724,353,'Overskyvninger','terrain-label');
    }
    art += '</g>'+hotspot(1,285,165)+hotspot(2,685,220)+hotspot(3,684,80)+hotspot(4,685,391);
    return art;
  };

  window.PlateBoundaryArt.transform = function (p, ctx) {
    const {Y,path,text,caption,hotspot,quake,mobile,labels,ramp,f,height,clamp} = ctx;
    const broken = p >= .74, slip = broken ? 48 + ramp(p,.74,1)*42 : 0;
    const strain = broken ? 7 : 55*ramp(p,.08,.74);
    const depth = 70, scaleY = (Y(540)-Y(0))/540;
    // A fixed oblique camera. Elevation is terrain, never vertical plate motion.
    const project = (x,y,z=0) => ({x:210+.72*x-.23*y, y:Y(80+.09*x+.43*y-z)});
    const polygon = points => points.map(([x,y,z=0],i) => {
      const a=project(x,y,z); return `${i?'L':'M'}${f(a.x)} ${f(a.y)}`;
    }).join(' ');
    const plan = points => points.map(([x,y],i)=>`${i?'L':'M'}${f(x)} ${f(y)}`).join(' ');
    const camera = `matrix(.72 ${f(.09*scaleY)} -.23 ${f(.43*scaleY)} 210 ${Y(80)})`;
    const sides = [{sign:-1,start:0,end:500,name:'left',offset:broken?-slip:-strain},
      {sign:1,start:500,end:1000,name:'right',offset:broken?slip:strain}];
    const compensation = (x,sign) => {
      const t=clamp((220-Math.abs(x-500))/212);
      return -sign*strain*t*t*(3-2*t);
    };
    const samples = (start,end,fn,n=40) => Array.from({length:n+1},(_,i)=>fn(start+(end-start)*i/n));
    const at = (x,y,side,z=0) => [x,y+compensation(x,side.sign),z];
    const label = (x,y,side,word,small=false,z=0) => {
      const v=y+compensation(x,side.sign)+side.offset;
      const a=project(x,v,z);
      return (small?caption:text)(f(a.x),80+.09*x+.43*v-z,word);
    };
    let art = `<defs>
      <linearGradient id="tf-west" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b4c28d"/><stop offset="1" stop-color="#799a70"/></linearGradient>
      <linearGradient id="tf-east" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d0cb9b"/><stop offset="1" stop-color="#a9b781"/></linearGradient>
      <linearGradient id="tf-front" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b69a78"/><stop offset=".35" stop-color="#9d8067"/><stop offset="1" stop-color="#735e54"/></linearGradient>
      <linearGradient id="tf-side" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#87735f"/><stop offset="1" stop-color="#544e48"/></linearGradient>
    </defs><rect width="1000" height="${height}" class="sky"/>`;

    // The shadow and exposed faces make the finite teaching cut-out legible.
    for (const side of sides) {
      const top=samples(side.start,side.end,x=>at(x,0,side));
      const front=samples(side.start,side.end,x=>at(x,540,side));
      const outline=[...top,...front.slice().reverse()];
      art += `<g transform="translate(${f(-.23*side.offset+8)} ${f(.43*scaleY*side.offset+10)})">`;
      art += path(polygon(outline.map(([x,y])=>[x,y,-depth]))+'Z','#172b28','opacity=".15"')+'</g>';
    }
    for (const side of sides) {
      const top=samples(side.start,side.end,x=>at(x,0,side));
      const front=samples(side.start,side.end,x=>at(x,540,side));
      const outline=[...top,...front.slice().reverse()];
      const topPlan=plan(outline)+'Z';
      const faceBand=(upper,lower)=>polygon([...front.map(([x,y])=>[x,y,-upper]),...front.slice().reverse().map(([x,y])=>[x,y,-lower])])+'Z';
      const sideBand=(upper,lower)=>polygon([at(side.end,0,side,-upper),at(side.end,540,side,-upper),at(side.end,540,side,-lower),at(side.end,0,side,-lower)])+'Z';
      art += `<g transform="translate(${f(-.23*side.offset)} ${f(.43*scaleY*side.offset)})" data-feature="transform-${side.name}">`;
      art += path(faceBand(0,depth),'url(#tf-front)','data-feature="transform-front-face" stroke="#705f51" stroke-width="1"');
      art += path(faceBand(0,8),'#b5aa7d');
      art += path(faceBand(12,24),'#c4ab86','opacity=".85"');
      art += path(faceBand(40,48),'#9f8c75','opacity=".8"');
      for (const z of [8,25,40,49]) {
        art += path(polygon(front.map(([x,y])=>[x,y,-z])),'none','stroke="#6f6053" stroke-width="1" opacity=".5"');
      }
      // The right-hand wall is a cut face, not an opening in the plate boundary.
      if(side.sign===1) {
        art += path(sideBand(0,depth),'url(#tf-side)','data-feature="transform-side-face" stroke="#675d50" stroke-width="1"');
        for(const z of [8,25,40,49]) art += path(polygon([at(side.end,0,side,-z),at(side.end,540,side,-z)]),'none','stroke="#b0a180" stroke-width="1.5" opacity=".5"');
      }
      art += `<defs><clipPath id="tf-${side.name}-clip"><path d="${topPlan}"/></clipPath></defs>`;
      art += `<g transform="${camera}"><g clip-path="url(#tf-${side.name}-clip)">`;
      art += path(topPlan,side.sign<0?'url(#tf-west)':'url(#tf-east)','data-feature="transform-surface" stroke="#728565" stroke-width="2"');
      // Soft drainage lines and cultivated fields give the moving surface scale.
      for(let i=0;i<7;i++) {
        const y=40+i*77;
        const contour=samples(side.start,side.end,x=>[x,y+10*Math.sin(x/74+i)+compensation(x,side.sign)]);
        art += path(plan(contour),'none','stroke="#f4efce" stroke-width="1.7" opacity=".15"');
      }
      const fields=side.sign<0?[[44,200,79,43],[139,205,102,42]]:[[751,205,106,46],[880,195,85,54]];
      for(const [x,y,w,h] of fields) {
        const corners=[[x,y],[x+w,y+5],[x+w-5,y+h],[x+4,y+h+6]].map(([u,v])=>at(u,v,side));
        art += path(plan(corners)+'Z',x%2?'#b7c591':'#d2cd93','stroke="#e4e0b0" stroke-width="2" opacity=".85"');
        for(let i=1;i<6;i++) {
          const u=x+i*w/6;
          art += path(plan([at(u,y+4,side),at(u+2,y+h,side)]),'none','stroke="#8b9b6c" stroke-width="1.5" opacity=".6"');
        }
      }
      const from=side.sign<0?-12:504, to=side.sign<0?496:1012;
      const road=samples(from,to,x=>at(x,296,side),70);
      const river=samples(from,to,x=>{
        const t=clamp(Math.abs(x-500)/120);
        return at(x,155+22*Math.sin((x-500)/110)*t*t*(3-2*t),side);
      },80);
      for(const [kind,points] of [['river',river],['road',road]]) {
        const d=plan(points);
        art += path(d,'none',`stroke="${kind==='river'?'#dde2c5':'#e9ddba'}" stroke-width="${kind==='river'?21:22}"`);
        art += path(d,'none',`stroke="${kind==='river'?'#559ba7':'#626d63'}" stroke-width="12" data-feature="${kind}-${side.name}"`);
        art += path(d,'none',kind==='river'?'stroke="#a9d9dc" stroke-width="2.3"':'stroke="#f6ecd0" stroke-width="2" stroke-dasharray="12 13"');
      }
      art += '</g></g>';

      // Triangulated hills have actual elevation under the same camera as the blocks.
      const hills=side.sign<0?[[177,66,170,64,64],[170,443,140,57,43]]:[[785,62,176,61,58],[803,440,151,62,46]];
      for(const [cx,cy,rx,ry,peak] of hills) {
        const vertex=(i,j)=>{
          const u=i/8*2-1,v=j/4*2-1,x=cx+u*rx,y=cy+v*ry;
          const z=peak*(1-u*u)**2*(1-v*v)**2*(.82+.18*Math.cos(u*6+v*2));
          return at(x,y,side,z);
        };
        art += '<g data-feature="transform-relief">';
        for(let j=0;j<4;j++) for(let i=0;i<8;i++) {
          const a=vertex(i,j),b=vertex(i+1,j),c=vertex(i+1,j+1),d=vertex(i,j+1);
          for(const tri of [[a,b,c],[a,c,d]]) {
            const [t,u,v]=tri;
            const nx=(u[1]-t[1])*(v[2]-t[2])-(u[2]-t[2])*(v[1]-t[1]);
            const ny=(u[2]-t[2])*(v[0]-t[0])-(u[0]-t[0])*(v[2]-t[2]);
            const nz=(u[0]-t[0])*(v[1]-t[1])-(u[1]-t[1])*(v[0]-t[0]);
            const light=clamp((-.38*nx-.55*ny+.74*nz)/Math.hypot(nx,ny,nz));
            const color=`rgb(${Math.round(82+97*light)},${Math.round(111+83*light)},${Math.round(74+60*light)})`;
            art += path(polygon(tri)+'Z',color,`stroke="${color}" stroke-width=".6"`);
          }
        }
        art += '</g>';
      }
      // Small farm buildings make the depth and surface displacement easy to read.
      const bx=side.sign<0?122:864,by=241;
      const corner=(x,y,z=0)=>at(x,y,side,z);
      art += path(polygon([corner(bx,by),corner(bx+31,by),corner(bx+31,by+19),corner(bx,by+19)])+'Z','#526d4c','opacity=".24"');
      art += path(polygon([corner(bx,by+19),corner(bx+31,by+19),corner(bx+31,by+19,14),corner(bx,by+19,14)])+'Z','#e5d5b1');
      art += path(polygon([corner(bx+31,by),corner(bx+31,by+19),corner(bx+31,by+19,14),corner(bx+31,by,14)])+'Z','#a8987d');
      art += path(polygon([corner(bx-3,by-2,14),corner(bx+34,by-2,14),corner(bx+34,by+9,24),corner(bx-3,by+9,24)])+'Z','#b37f62');
      art += path(polygon([corner(bx-3,by+9,24),corner(bx+34,by+9,24),corner(bx+34,by+22,14),corner(bx-3,by+22,14)])+'Z','#875c49');
      art += path(polygon(front),'none','stroke="#e1dbaf" stroke-width="2"');
      art += '</g>';
    }

    const nearLeft=sides[0].offset+strain,nearRight=sides[1].offset-strain;
    const start=Math.max(nearLeft,nearRight),end=540+Math.min(nearLeft,nearRight);
    const fault=polygon([[500,start],[500,end]]);
    art += path(fault,'none','stroke="#334b3d" stroke-width="7" opacity=".65"');
    art += path(fault,'none',`class="fault" style="stroke:${broken?'#f4bb83':'#e7d3a3'}" data-feature="fault"`);
    if(broken) {
      art += `<g transform="${camera}">`;
      for(const r of [30,62,102]) art += `<ellipse cx="500" cy="297" rx="${r}" ry="${r}" fill="none" stroke="#fff0bc" stroke-width="3" opacity="${f(.95-r/155)}" data-feature="quake-wave"/>`;
      art += '</g>';
      const a=project(500,297); art += quake(f(a.x),80+.09*500+.43*297);
    } else if(p>.1) {
      const a=project(500,251);
      art += `<g transform="translate(${f(a.x)} ${f(a.y)})" data-feature="locked"><rect x="-9" y="-1" width="18" height="13" rx="3" fill="#efdcb1" stroke="#6c694b" stroke-width="1.5"/><path d="M-5-1v-6a5 5 0 0 1 10 0v6" fill="none" stroke="#efdcb1" stroke-width="3"/></g>`;
    }
    for(const [side,x,y,dy] of [[sides[0],285,365,-105],[sides[1],716,345,105]]) {
      const a=project(x,y+side.offset+compensation(x,side.sign));
      const b=project(x,y+dy+side.offset+compensation(x,side.sign));
      const d=`M${f(a.x)} ${f(a.y)}L${f(b.x)} ${f(b.y)}`;
      art += path(d,'none','stroke="#526b53" stroke-width="9" stroke-linecap="round" opacity=".7"');
      art += path(d,'none','class="motion"');
    }
    art += `<g class="diagram-labels"${labels?'':' hidden'}>`;
    art += label(18,13,sides[0],'Plate A')+label(848,8,sides[1],'Plate B');
    art += text(620,51,'Forkastning');
    const target=project(500,Math.max(start+35,82));
    art += path(`M650 ${Y(60)}L${f(target.x)} ${f(target.y)}`,'none','class="callout-line"');
    art += label(47,348,sides[0],'Vei');
    if(!mobile) art += label(44,114,sides[0],'Elveløp',true);
    if(!mobile) art += caption(104,516,'Skåret modellutsnitt · bevegelsen er sideveis');
    art += '</g>';
    for(const [n,x,y,side] of [[1,227,379,sides[0]],[2,600,239,sides[1]],[3,664,449,sides[1]]]) {
      const v=y+side.offset+compensation(x,side.sign),a=project(x,v);
      art += hotspot(n,f(a.x),80+.09*x+.43*v);
    }
    return art;
  };
})();
