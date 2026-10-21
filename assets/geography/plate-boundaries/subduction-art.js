/* The front remains a readable geological section. Surface facets add depth without
   hiding the trench, slab, mantle wedge or the distinction between crust and plate. */
(() => {
  'use strict';
  window.PlateBoundaryArt ||= {};
  window.PlateBoundaryArt.subduction = function (p, ocean, ctx) {
    const {Y,path,text,caption,arrow,hotspot,quake,earth,sea,band,points,pointAt,
      plotLine,total,bend,offset,mobile,labels,ramp,f} = ctx;
    const end = bend + (total - bend) * (.045 + .955 * p);
    const slab = points.filter(pt => pt.distance < end).map(pt => pointAt(pt.distance));
    slab.push(pointAt(end));
    const mountain = ramp(p,.48,1), peak = ocean ? 190 - 105*mountain : 160 - 88*mountain;
    const trench = 213 + 13*p;
    const terrain = ocean
      ? [[403,trench],[465,211],[555,208],[602,190],[643,peak],[654,peak+3],[702,210],[1000,211]]
      : [[403,trench],[438,186],[482,160],[532,160-10*mountain],[558,161-30*mountain],
        [587,160-7*mountain],[628,160-60*mountain],[643,peak+5],[654,peak+7],
        [679,158-42*mountain],[709,160-9*mountain],[743,160-37*mountain],
        [784,160-10*mountain],[844,160-20*mountain],[899,160],[1000,162]];
    const terrainLine = (pts, dx=0, dy=0) => pts.map(([x,y],i)=>`${i?'L':'M'}${f(x+dx)} ${Y(y+dy)}`).join(' ');
    const surface = terrainLine(terrain);
    const crust = surface + `L1000 ${Y(ocean?225:238)} 528 ${Y(ocean?225:238)} 453 ${Y(247)}Z`;
    const cap = surface + terrainLine([...terrain].reverse(),38,-32).replace(/^M/,'L') + 'Z';
    const melt = ramp(p,.44,.63), water = ramp(p,.3,.53), magma = ramp(p,.57,.84);
    const prismGrowth = ramp(p,.05,.85);
    const prismWidth = 35 + 45*prismGrowth;

    let art = `<defs><clipPath id="subduction-upper-mask">${path(crust,'#fff')}</clipPath>` +
      `<clipPath id="subduction-air-mask"><rect width="1000" height="${Y(158)}"/></clipPath></defs>`;
    art += earth() + sea(ocean);
    // The thin water surface and rear rim make the top edge read as a slice.
    art += path(`M0 ${Y(118)}H${ocean?1000:520}V${Y(158)}H0Z`,'url(#water)','opacity=".24"');
    art += path(`M0 ${Y(118)}H${ocean?1000:520}`,'none','stroke="#b3dfe0" stroke-width="1" opacity=".35"');

    // A few receding islands show the arc rather than suggesting a lone volcano.
    // Their local shorelines sit on the oblique rear water surface.
    const islands = ramp(mountain,.35,1);
    if (ocean && islands>0) {
      art += `<g data-feature="island-arc" opacity="${islands}">`;
      for (const [x,shore,h] of [[727,145,38],[790,134,29]]) {
        const summit = shore - h*islands;
        art += path(`M${x-30} ${Y(shore)}L${x-6} ${Y(summit)} ${x+3} ${Y(summit+2)} ${x+29} ${Y(shore)}Z`,'#ba9870','stroke="#b4c8a0" stroke-width="1.5"');
        art += path(`M${x-6} ${Y(summit)}L${x+3} ${Y(summit+2)} ${x+29} ${Y(shore)} ${x+3} ${Y(shore-1)}Z`,'#8e8368');
        art += path(`M${x-30} ${Y(shore)}Q${x} ${Y(shore+7)} ${x+29} ${Y(shore)}`,'none','stroke="#bed9ce" stroke-width="2" opacity=".9"');
      }
      art += '</g>';
    }

    art += `<g opacity="${melt}" data-feature="melt"><ellipse cx="630" cy="${Y(310)}" rx="94" ry="${Y(353)-Y(310)}" fill="url(#melt)"/>`;
    for (const [x,y,r] of [[602,307,4],[625,320,3],[653,310,4]]) art += `<ellipse cx="${x}" cy="${Y(y)}" rx="${r}" ry="6" fill="#ffca87"/>`;
    art += '</g>';
    art += path(band(slab,24,-28),'#315c67','opacity=".7"');
    art += path(band(slab,24,-24),'url(#ocean-plate)','data-feature="slab" stroke="#82b6b7"');
    art += path(band(slab,24,16),'#a1d0bd','data-feature="oceanic-crust"');
    art += path(band(slab,-12,-15),'#315d6b','opacity=".4"');
    for (let i=0;i<15;i++) {
      const d = (i*83+p*560)%total;
      if (d<end) art += path(plotLine([offset(pointAt(d),12),offset(pointAt(d),-17)]),'none','stroke="#b2d9cf" stroke-width="3" opacity=".42" data-feature="slab-tracer"');
    }

    // Surface topography is a shallow oblique cap; the analytical section stays in front.
    art += path(cap,ocean?'#669c9b':'#8da786','data-feature="terrain-surface"');
    for (let i=1;i<terrain.length;i++) {
      let a=terrain[i-1], b=terrain[i];
      if (b[0]-a[0]>190 || (ocean && i<3)) continue;
      // Sea level is158 before projection on both front and rear surfaces.
      // A horizontal front-face mask would expose submerged rear slopes too early.
      if (ocean) {
        if (a[1]>=158 && b[1]>=158) continue;
        if (a[1]>158) {
          const t=(158-a[1])/(b[1]-a[1]);
          a=[a[0]+(b[0]-a[0])*t,158];
        } else if (b[1]>158) {
          const t=(158-a[1])/(b[1]-a[1]);
          b=[a[0]+(b[0]-a[0])*t,158];
        }
      }
      const face = terrainLine([a,b]) + `L${f(b[0]+38)} ${Y(b[1]-32)}L${f(a[0]+38)} ${Y(a[1]-32)}Z`;
      art += path(face, b[1]<a[1] ? '#b6c29c' : '#708b72',`opacity="${ocean ? .9 : .22+.32*mountain}"`);
    }
    art += path(terrainLine(terrain,38,-32),'none','stroke="#c4d3ae" stroke-width="1.6" opacity=".7"');
    art += path(`M403 ${Y(trench)}L453 ${Y(247)} 528 ${Y(238)} 1000 ${Y(238)}V${Y(ocean?262:280)}H528L450 ${Y(248)}Z`,ocean?'#517f82':'#8a705c');
    art += path(crust,ocean?'url(#ocean-plate)':'url(#continent)','data-feature="upper-crust"');
    if (ocean) art += path(crust,'url(#continent)','clip-path="url(#subduction-air-mask)" data-feature="island"');
    else art += path(crust,'url(#crust-lines)');

    // Folded sediment is scraped off near the trench: a growing accretionary prism.
    art += '<g clip-path="url(#subduction-upper-mask)">';
    art += path(`M403 ${Y(trench)}L${438+prismWidth*.45} ${Y(ocean?202:167)}L${438+prismWidth} ${Y(247)} 447 ${Y(257)}Z`,'#c6b48d','data-feature="accretion-prism"');
    for (let i=0;i<5;i++) {
      const y = 207+i*8;
      art += path(`M397 ${Y(y+13)}Q425 ${Y(y+12)} 439 ${Y(y-10-8*prismGrowth)}T${454+prismWidth} ${Y(y+5)}`,'none','stroke="#8b8064" stroke-width="2" opacity=".6" data-feature="sediment-fold"');
    }
    if (!ocean && mountain>.02) {
      // Alternating sunlit and shaded rock faces keep neighboring peaks distinct.
      for (const [a,b,c] of [[[587,160-7*mountain],[643,peak+5],[654,238]],
        [[643,peak+5],[679,158-42*mountain],[654,238]],
        [[709,160-9*mountain],[743,160-37*mountain],[752,238]],
        [[743,160-37*mountain],[784,160-10*mountain],[752,238]]]) {
        art += path(terrainLine([a,b,c])+'Z',b[1]<a[1]?'#e9cb9d':'#a57d60',`opacity="${.32*mountain}" data-feature="mountain-facet"`);
      }
      art += path(`M485 ${Y(218)}q29 ${-14*mountain} 58 0t58 0t58 0t58 0t58 0t58 0M504 ${Y(230)}q29 ${-10*mountain} 58 0t58 0t58 0t58 0t58 0t58 0`,'none','stroke="#f1d9ad" stroke-width="2" opacity=".65"');
    }
    art += '</g>' + path(surface,'none','class="seafloor"');

    const conduit = `M633 ${Y(310)}Q665 ${Y(274)} 648 ${Y(248)}T650 ${Y(peak+10)}`;
    art += `<g opacity="${magma}" data-feature="magma">` + path(conduit,'none','stroke="#df794f" stroke-width="17" opacity=".28"') + path(conduit,'none','stroke="#ffaf68" stroke-width="6" stroke-linecap="round"');
    if (magma>0) for (let i=0;i<3;i++) {
      const t=((p-.57)*3+i/3)%1;
      const q=t<.5?t*2:(t-.5)*2, u=1-q;
      const [a,b,c]=t<.5?[[633,310],[665,274],[648,248]]:[[648,248],[631,222],[650,peak+10]];
      const x=u*u*a[0]+2*u*q*b[0]+q*q*c[0], y=u*u*a[1]+2*u*q*b[1]+q*q*c[1];
      art += `<circle cx="${f(x)}" cy="${Y(y)}" r="3.5" fill="#ffe2a5" data-feature="magma-marker"/>`;
    }
    art += '</g>';
    if (p>.88) art += `<g opacity="${ramp(p,.88,1)}" data-feature="eruption">` + path(`M643 ${Y(peak+5)}l13 ${Y(peak+24)-Y(peak+5)}`,'none','stroke="#ffd283" stroke-width="4"') + `<g fill="#a4aea7" opacity=".8"><ellipse cx="650" cy="${Y(peak-21)}" rx="12" ry="10"/><ellipse cx="641" cy="${Y(peak-37)}" rx="18" ry="13"/><ellipse cx="662" cy="${Y(peak-49)}" rx="26" ry="15"/></g></g>`;
    art += `<g opacity="${water}" data-feature="fluids">`;
    for (const x of [582,619,656]) {
      const d=bend+(x-450)*Math.hypot(460,250)/460;
      if (d>end) continue;
      const s=offset(pointAt(d),27);
      art += path(`M${f(s.x)} ${Y(s.y)}Q${f(s.x-8)} ${Y(s.y-18)} ${f(s.x+1)} ${Y(301)}`,'none','class="water-flow"');
      const t=((p-.3)*3+x/100)%1;
      art += `<circle cx="${f(s.x-3*Math.sin(Math.PI*t))}" cy="${Y(s.y+(301-s.y)*t)}" r="3" fill="#c3f2ff" data-feature="fluid-marker"/>`;
    }
    art += '</g>' + arrow(200,216,95) + arrow(886,ocean?244:207,-75);
    if (p>.15) art += path(plotLine([pointAt(bend+12),pointAt(Math.min(end,bend+95))]),'none','class="motion"');
    if (p>.08) for (const [d,depth] of [[bend-33,0],[bend+34,0],[bend+126,1],[bend+205,1],[bend+284,1],[bend+390,2],[bend+480,2]]) {
      if (d<end) { const pos=offset(pointAt(d),depth?3:23); art += quake(pos.x,pos.y,depth); }
    }

    art += `<g class="diagram-labels"${labels?'':' hidden'}>`;
    art += text(86,130,'Hav') + text(65,290,ocean?'Eldre, kaldere plate':'Havbunnsplate','terrain-label');
    if (ocean) art += text(752,202,mobile?'Yngre plate':'Yngre havbunnsplate','terrain-label') + path(`M850 ${Y(210)}V${Y(248)}`,'none','class="callout-line"');
    else art += text(746,240,mobile?'Kontinent':'Kontinentalplate','terrain-label');
    art += text(135,415,'Mantel','terrain-label');
    if (!mobile) art += caption(135,439,'Hovedsakelig fast bergart','terrain-label');
    art += text(255,66,'Dyphavsgrop') + path(`M371 ${Y(76)}L403 ${Y(trench-5)}`,'none','class="callout-line" data-feature="trench-leader"');
    if (water>0) {
      art += text(740,359,'Mantelkile','terrain-label');
      if (!mobile) art += caption(740,382,'Delvis oppsmelting','terrain-label') + text(490,447,'Vann frigjøres','terrain-label');
    }
    if (mountain>.05) art += text(719,50,mobile?(ocean?'Øybue':'Vulkaner'):(ocean?'Vulkansk øybue':'Vulkansk fjellkjede')) + path(`M728 ${Y(60)}L663 ${Y(peak+5)}`,'none','class="callout-line"');
    art += '</g>' + path(`M451 ${Y(145)}L408 ${Y(trench-7)}`,'none','class="callout-line"');
    // Empty sky and mantle space hold callouts, leaving the actual trench free.
    return art + hotspot(1,465,125) + hotspot(2,713,315) + hotspot(3,950,110) + hotspot(4,834,466);
  };
})();
