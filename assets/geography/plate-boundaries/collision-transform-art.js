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

  window.PlateBoundaryArt.transform = function (p,ctx) {
    const {Y,path,text,caption,arrow,hotspot,quake,mobile,labels,ramp,f,height} = ctx;
    const broken=p>=.74,slip=broken?48+ramp(p,.74,1)*42:0;
    const strain=broken?7:55*ramp(p,.08,.74);
    const leftOffset=broken?-slip:-strain,rightOffset=broken?slip:strain;
    const plot=points=>points.map(([x,y],i)=>`${i?'L':'M'}${f(x)} ${Y(y)}`).join(' ');
    const roadLeft=`M0 ${Y(296)}H350Q450 ${Y(296)} 496 ${Y(296+strain)}`;
    const roadRight=`M504 ${Y(296-strain)}Q550 ${Y(296)} 650 ${Y(296)}H1000`;
    const riverLeft=`M-30 ${Y(141)}Q86 ${Y(164)} 154 ${Y(145)}T302 ${Y(157)}Q415 ${Y(185)} 496 ${Y(155+strain)}`;
    const riverRight=`M504 ${Y(155-strain)}Q595 ${Y(127)} 682 ${Y(164)}T832 ${Y(179)}T1030 ${Y(151)}`;
    let art=`<defs>
      <linearGradient id="tf-west" x2="1" y2="1"><stop stop-color="#a0af80"/><stop offset="1" stop-color="#748b67"/></linearGradient>
      <linearGradient id="tf-east" x2=".8" y2="1"><stop stop-color="#c4c193"/><stop offset="1" stop-color="#a7ac7e"/></linearGradient>
      <clipPath id="tf-west-clip"><rect width="496" height="${height}"/></clipPath>
      <clipPath id="tf-east-clip"><rect x="504" width="496" height="${height}"/></clipPath>
    </defs><rect width="1000" height="${height}" class="sky"/>`;
    art += '<g clip-path="url(#tf-west-clip)">';
    art += `<g transform="translate(0 ${Y(250+leftOffset)-Y(250)})" data-feature="transform-left">`;
    art += path(`M0 ${Y(-160)}H496V${Y(720)}H0Z`,'url(#tf-west)');
    // Hills use broad light and shadow facets, with contour lines for depth.
    art += path(`M-20 ${Y(57)}Q91 ${Y(-14)} 201 ${Y(55)}T421 ${Y(65)}L494 ${Y(28)}V${Y(121)}Q340 ${Y(165)} 228 ${Y(110)}T-20 ${Y(128)}Z`,'#65825d','opacity=".46"');
    art += path(`M-20 ${Y(79)}Q91 ${Y(8)} 201 ${Y(77)}T421 ${Y(87)}L494 ${Y(50)}`,'none','stroke="#d1d6aa" stroke-width="5" opacity=".46"');
    art += path(`M56 ${Y(560)}Q61 ${Y(375)} 190 ${Y(408)}Q266 ${Y(431)} 325 ${Y(379)}L429 ${Y(472)}Q266 ${Y(535)} 181 ${Y(495)}Z`,'#5f7d57','opacity=".27"');
    for(const shift of [0,23,46]) art += path(`M68 ${Y(505+shift)}Q125 ${Y(412+shift*.5)} 206 ${Y(457+shift*.5)}T383 ${Y(437+shift*.5)}`,'none','stroke="#d4d8ae" stroke-width="2" opacity=".38"');
    // Fields provide landmarks that translate with the plate, not the viewport.
    art += path(plot([[39,212],[133,199],[149,247],[49,253]])+'Z','#c9c693','stroke="#aab28a" stroke-width="2" opacity=".65"');
    art += path(plot([[159,205],[244,221],[231,264],[166,253]])+'Z','#9fb27c','stroke="#c1c8a0" stroke-width="2" opacity=".65"');
    art += path(riverLeft,'none','stroke="#cfddca" stroke-width="15"');
    art += path(riverLeft,'none','stroke="#6aa5ae" stroke-width="8" data-feature="river-left"');
    art += path(riverLeft,'none','stroke="#a6d1d5" stroke-width="2"');
    art += path(roadLeft,'none','stroke="#e9ddbb" stroke-width="17"');
    art += path(roadLeft,'none','stroke="#626d65" stroke-width="8" data-feature="road-left"');
    art += path(roadLeft,'none','stroke="#efe6c9" stroke-width="1.5" stroke-dasharray="11 12"');
    art += '</g></g>';

    art += '<g clip-path="url(#tf-east-clip)">';
    art += `<g transform="translate(0 ${Y(250+rightOffset)-Y(250)})" data-feature="transform-right">`;
    art += path(`M504 ${Y(-160)}H1000V${Y(720)}H504Z`,'url(#tf-east)');
    art += path(`M571 ${Y(40)}Q688 ${Y(-14)} 774 ${Y(53)}T1025 ${Y(60)}V${Y(125)}Q827 ${Y(148)} 718 ${Y(103)}T571 ${Y(118)}Z`,'#8c9f70','opacity=".42"');
    art += path(`M580 ${Y(55)}Q688 ${Y(1)} 774 ${Y(68)}T1025 ${Y(75)}`,'none','stroke="#dedcaa" stroke-width="4" opacity=".55"');
    art += path(`M617 ${Y(405)}Q751 ${Y(365)} 824 ${Y(427)}T1032 ${Y(426)}V${Y(518)}Q844 ${Y(458)} 742 ${Y(491)}T617 ${Y(476)}Z`,'#8b9c6c','opacity=".29"');
    for(const shift of [0,24,48]) art += path(`M638 ${Y(424+shift)}Q751 ${Y(384+shift*.6)} 824 ${Y(446+shift*.5)}T1032 ${Y(445+shift*.5)}`,'none','stroke="#e0dfb4" stroke-width="2" opacity=".38"');
    art += path(plot([[758,216],[859,203],[874,251],[766,262]])+'Z','#cbd0a0','stroke="#e2dfb1" stroke-width="2" opacity=".65"');
    art += path(plot([[884,202],[979,210],[979,261],[891,254]])+'Z','#a5b17c','stroke="#c8cf9d" stroke-width="2" opacity=".7"');
    art += path(riverRight,'none','stroke="#d8e0cc" stroke-width="15"');
    art += path(riverRight,'none','stroke="#6aa5ae" stroke-width="8" data-feature="river-right"');
    art += path(riverRight,'none','stroke="#a6d1d5" stroke-width="2"');
    art += path(roadRight,'none','stroke="#e9ddbb" stroke-width="17"');
    art += path(roadRight,'none','stroke="#626d65" stroke-width="8" data-feature="road-right"');
    art += path(roadRight,'none','stroke="#efe6c9" stroke-width="1.5" stroke-dasharray="11 12"');
    art += '</g></g>';

    art += path(`M500 0V${height}`,'none','stroke="#263f3b" stroke-width="8" opacity=".4"');
    art += path(`M500 0V${height}`,'none',`class="fault" style="stroke:${broken?'#edb486':'#e7d2a3'}" data-feature="fault"`);
    if(broken){
      for(const r of [24,44,69]) art += `<ellipse cx="500" cy="${Y(297)}" rx="${r}" ry="${r*.8}" fill="none" stroke="#fff0bc" stroke-width="2" opacity="${f(.9-r/110)}" data-feature="quake-wave"/>`;
      art += quake(500,297);
      art += path(plot([[500,362],[515,378],[508,388],[529,409]]),'none','stroke="#92765c" stroke-width="2" opacity=".6"');
    } else if(p>.1) {
      art += `<g transform="translate(500 ${Y(270)})" data-feature="locked"><rect x="-9" y="-1" width="18" height="13" rx="3" fill="#efdcb1" stroke="#6c694b" stroke-width="1.5"/><path d="M-5-1v-6a5 5 0 0 1 10 0v6" fill="none" stroke="#efdcb1" stroke-width="3"/></g>`;
    }
    art += arrow(280,400,0,-105)+arrow(741,205,0,105);
    art += `<g class="diagram-labels"${labels?'':' hidden'}>`;
    art += text(68,64,'Plate A')+text(818,64,'Plate B')+text(566,87,'Forkastning');
    art += path(`M568 ${Y(96)}L503 ${Y(122)}`,'none','class="callout-line"');
    art += text(65,344+leftOffset,'Vei')+text(mobile?670:709,430,broken?'Forskjøvet vei':mobile?'Spenning':'Elastisk deformasjon');
    if(!mobile) art += caption(86,203+leftOffset,'Elveløp');
    art += text(61,486,broken?'Brudd og glidning':'Fastlåst kontakt');
    if(!mobile) art += caption(63,510,broken?'Landskapet er forskjøvet langs grensen':'Friksjon holder igjen mens platene beveger seg');
    art += '</g>'+hotspot(1,322,418)+hotspot(2,418,225)+hotspot(3,610,463);
    return art;
  };
})();
