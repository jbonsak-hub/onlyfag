const groups = [
  {name:'Lyman', color:'var(--hs-lyman-ink,#9460c3)', angle:-1.56, keys:['6-1','5-1','4-1','3-1','2-1']},
  {name:'Balmer', color:'var(--hs-balmer-ink,#188273)', angle:-.16, keys:['6-2','5-2','4-2','3-2']},
  {name:'Paschen', color:'var(--hs-paschen-ink,#ba613b)', angle:1.16, keys:['6-3','5-3','4-3']},
  {name:'Til n = 4 og 5', color:'var(--hs-infrared-ink,#966719)', angle:2.50, keys:['6-4','5-4','6-5']}
];

const visibleInks = {
  '3-2':'var(--hs-red-ink,#b52e38)',
  '4-2':'var(--hs-cyan-ink,#087a8c)',
  '5-2':'var(--hs-blue-ink,#4e50ba)',
  '6-2':'var(--hs-violet-ink,#793daf)'
};

const spectrumInks = {
  '3-2':'#ff514c',
  '4-2':'#44e2ff',
  '5-2':'#898dff',
  '6-2':'#be82ff'
};

const boardGroups = new Map(groups.flatMap((group,index)=>group.keys.map((key,slot)=>[
  key,{group,index,slot,angle:group.angle+(slot-(group.keys.length-1)/2)*.27}
])));

export function seriesBoardLayout(width) {
  const compact = width < 590;
  return {
    width:compact?420:850,
    height:compact?439:263,
    spectrumHeight:96,
    atom:compact?{x:210,y:111,inner:20,step:12}:{x:132,y:137,inner:22,step:13},
    graph:compact
      ? {left:28,right:322,titleY:210,groupY:232,top:247,bottom:412}
      : {left:267,right:732,titleY:24,groupY:48,top:64,bottom:234},
    compact
  };
}

function levelPositions(graph, {hLevels,hydrogenEnergy}) {
  const highest = hydrogenEnergy(6), lowest = hydrogenEnergy(1);
  return Object.fromEntries(hLevels.map(n=>{
    const physical = (highest-hydrogenEnergy(n))/(highest-lowest);
    const fraction = .65*physical + .35*(6-n)/5;
    return [n,graph.top+(graph.bottom-graph.top)*fraction];
  }));
}

function spectrumColor(t, key) {
  if(t.region==='UV') return '#c199ea';
  if(t.region==='IR') return '#eaa778';
  return spectrumInks[key];
}

function linkGroup(key, part, description, {chosen,found}, content, extra='') {
  return `<g role="button" tabindex="0" class="hs-hit${chosen?' hs-selected':''}${found?' hs-solved':''}"
    data-series-action="transition" data-series-key="${key}" data-series-part="${part}" aria-label="${description}" ${extra}>${content}</g>`;
}

function transitionDescription(t, state, found, fmt) {
  const label=`Overgang fra n = ${t.from} til n = ${t.to}`;
  if(state.mode==='quiz' && !found) return label;
  return `${label} · ${fmt(t.wavelengthNM,1)} nm${found?' · funnet':''}`;
}

function drawAtomHit(atom,t,shape,hidden,color,width,drawing) {
  const {angle}=shape, {orbitPoint,line,arrow}=drawing;
  const [a,b]=[orbitPoint(atom,t.from,angle),orbitPoint(atom,t.to,angle)];
  const [start,end]=[orbitPoint(atom,t.from+.38,angle),orbitPoint(atom,t.to-.33,angle)];
  const halfAngle=.134;
  const corners=[
    orbitPoint(atom,t.from+.38,angle-halfAngle),
    orbitPoint(atom,t.from+.38,angle+halfAngle),
    orbitPoint(atom,t.to-.33,angle+halfAngle),
    orbitPoint(atom,t.to-.33,angle-halfAngle)
  ];
  const hit=`<polygon points="${corners.map(point=>point.join(',')).join(' ')}" fill="transparent" pointer-events="all"/>`;
  return hit
    + line(...start,...end,'var(--hs-focus,var(--blue,#2677a0))','stroke-width="9" stroke-linecap="round" class="hs-focus" opacity="0" pointer-events="none"')
    + (hidden?'':arrow(...a,...b,color,width,'class="hs-mark" pointer-events="none"'));
}

function diagramSlot(graph,shape,span) {
  const {group,index,slot}=shape;
  const step=Math.min(26,(span-12)/group.keys.length);
  const x=graph.left+span*(index+.5)+(slot-(group.keys.length-1)/2)*step;
  return {x,step};
}

function shownGroups(transitions) {
  return transitions.some(t=>t.to>3)?groups:groups.slice(0,3);
}

function drawDiagramHit(graph,ys,t,shape,span,color,width,drawing) {
  const {arrow,line}=drawing, {x,step}=diagramSlot(graph,shape,span);
  const top=ys[t.from],bottom=ys[t.to];
  const hitWidth=Math.max(10,step-.5);
  return `<rect x="${x-hitWidth/2}" y="${top-5}" width="${hitWidth}" height="${bottom-top+10}" fill="transparent" pointer-events="all"/>`
    + line(x,top,x,bottom,'var(--hs-focus,var(--blue,#2677a0))','stroke-width="10" stroke-linecap="round" class="hs-focus" opacity="0" pointer-events="none"')
    + arrow(x,top+1,x,bottom-1,color,width,'class="hs-mark" pointer-events="none"');
}

function ionizationPoints(atom,orbitPoint) {
  const angle=-2.64;
  const bound=orbitPoint(atom,1,angle);
  const outer=orbitPoint(atom,6,angle);
  const released=[outer[0]+28*Math.cos(angle),outer[1]+28*Math.sin(angle)];
  return {bound,released};
}

function boardGraphic(layout,state,drawing) {
  const {atom,graph,compact}=layout, {line,text,fmt,arrow,atomFace,hLevels,orbitPoint,transitionKey}=drawing;
  const {animation,excited,mode,selected,showEnergies,solved,transitions}=state;
  const ionization=mode==='excite'&&excited===Infinity;
  const ionized=ionization&&!animation;
  const thresholdY=graph.groupY-4;
  const ys=levelPositions(graph,drawing);
  const columns=shownGroups(transitions);
  const span=(graph.right-graph.left)/columns.length;
  const absorption=animation?.phase==='absorb';
  const illuminated = new Set(animation?.transitions.map(transitionKey));
  const face=atomFace(atom,hLevels,absorption?{from:1,to:excited}:null,0,-Math.PI);
  const energyRows=hLevels.map(n=>{
    const active=n===excited, y=ys[n];
    return line(graph.left,y,graph.right,y,active?'var(--green,#236448)':'var(--muted,#71887c)',
      active?`stroke-width="3" data-series-excited-row="${n}"`:'stroke-width="1.15" opacity=".64"')
      + text(graph.right+8,y+3.6,`n = ${n}`,'class="hs-label"')
      + (showEnergies?text(graph.right+44,y+3.6,`${fmt(-2.18/n**2,3)} aJ`,'class="hs-energy"'):'');
  }).join('');
  const headings=columns.map((group,i)=>text(graph.left+span*(i+.5),graph.groupY,group.name,
    'class="hs-series-name" text-anchor="middle"')).join('');
  const threshold=ionization
    ? line(graph.left,thresholdY,graph.right,thresholdY,'var(--green,#236448)',
      'stroke-width="2.3" stroke-dasharray="6 4" data-series-excited-row="Infinity"')
      + text(graph.right+8,thresholdY+3.6,'n = ∞ · 0 aJ','class="hs-label"')
    : '';
  const hits=transitions.map(t=>{
    const key=transitionKey(t),shape=boardGroups.get(key),found=solved.has(key);
    const chosen=key===selected, burst=animation?.phase==='burst'&&illuminated.has(key);
    const color=mode==='quiz'
      ? found?(visibleInks[key]??shape.group.color):'var(--hs-neutral-arrow,var(--muted,#60736b))'
      : shape.group.color;
    const width=chosen?3.4:burst||found?2.55:1.9;
    const hideAtom=animation?.phase==='emission'&&illuminated.has(key);
    const description=transitionDescription(t,state,found,fmt);
    return linkGroup(key,'atom',description,{chosen,found},drawAtomHit(atom,t,shape,hideAtom,color,width,drawing))
      + linkGroup(key,'diagram',description,{chosen,found},drawDiagramHit(graph,ys,t,shape,span,color,width,drawing));
  }).join('');
  const showGround=mode==='excite'&&excited===null;
  const released=ionized?ionizationPoints(atom,orbitPoint).released:null;
  const description=ionization
    ? 'Den stiplede linjen markerer ioniseringsgrensen. Elektronets bevegelse er skjematisk.'
    : 'Nivåavstandene er skjematiske. Energien øker oppover i diagrammet.';
  return `<desc>${description}</desc>
    ${text(atom.x,24,ionized?'Hydrogenion H⁺':'Hydrogenatom','class="hs-title" text-anchor="middle"')}
    ${text(graph.left,graph.titleY,'Energinivåer','class="hs-title"')}
    ${compact?'':line(graph.left-23,49,graph.left-23,225,'var(--line,#cddbd1)')}
    ${arrow(graph.left-11,graph.bottom+2,graph.left-11,(ionization?thresholdY:graph.top)-3,'var(--muted,#71887c)',1.3)}
    ${energyRows}${ionization?threshold:headings}${face.base}${showGround?face.electron:''}${hits}
    ${released?`<g data-series-ionized="true">${electronPoint(...released,6.8)}${text(released[0],released[1]+20,'Fritt e⁻','class="hs-label" text-anchor="middle"')}</g>`:''}
    ${text(graph.left,graph.bottom+20,'Energi øker oppover','class="hs-label"')}`;
}

function electronPoint(x,y,radius,opacity=1) {
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="#237897" stroke="#f4fffa" stroke-width="1.3" opacity="${opacity}"/>`;
}

export function seriesBoardMotion(layout,state,drawing) {
  const {animation,excited}=state;
  if(!animation) return '';
  const {phase,progress,transitions}=animation;
  const {atom,graph,compact}=layout, {orbitPoint,wavePacket,ease,wavelengthInk,transitionKey}=drawing;
  if(phase==='ionize') {
    const {bound,released}=ionizationPoints(atom,orbitPoint);
    const absorbedAt=.43;
    const position=ease((progress-absorbedAt)/(1-absorbedAt));
    const x=bound[0]+(released[0]-bound[0])*position, y=bound[1]+(released[1]-bound[1])*position;
    const packetX=atom.x-(compact?154:106);
    const photonX=packetX+(bound[0]-packetX)*ease(progress/absorbedAt);
    const color=wavelengthInk(transitions[0].wavelengthNM);
    const incoming=progress<absorbedAt
      ? `<g data-series-ionizing-photon>${wavePacket(photonX,bound[1],0,progress*24,color,33)}</g>`
      : '';
    return `${incoming}<g data-series-escaping-electron>${electronPoint(x,y,6.8)}</g>`;
  }
  if(phase==='absorb') {
    const radius=orbitPoint({x:0,y:0,inner:atom.inner,step:atom.step},excited,0)[0];
    const motion=ease((progress-.4)/.48);
    const x=atom.x-atom.inner-(radius-atom.inner)*motion;
    const packetX=atom.x-(compact?154:106);
    const u=ease(progress/.45);
    const color=wavelengthInk(transitions[0]?.wavelengthNM??122);
    const incoming=progress<.45?wavePacket(packetX+(atom.x-atom.inner-packetX)*u,atom.y,0,progress*24,color,33):'';
    return incoming+electronPoint(x,atom.y,6.8);
  }
  const burst=phase==='burst';
  const ys=burst?levelPositions(graph,drawing):null;
  const span=(graph.right-graph.left)/shownGroups(state.transitions).length;
  const drop=ease(progress/.33),travel=ease((progress-.35)/.65);
  return transitions.map(t=>{
    const key=transitionKey(t), shape=boardGroups.get(key), {angle}=shape;
    const point=orbitPoint(atom,t.from+(t.to-t.from)*drop,angle);
    const wavePosition=orbitPoint(atom,t.to+(7.7-t.to)*travel,angle);
    const wave=progress>.33
      ? `<g opacity="${1-ease((progress-.80)/.20)}">${wavePacket(...wavePosition,angle,progress*31,spectrumColor(t,key),burst?20:32)}</g>`
      : '';
    const marker=burst&&progress<.73
      ? `<circle class="hs-burst-marker" cx="${diagramSlot(graph,shape,span).x}" cy="${ys[t.from]+(ys[t.to]-ys[t.from])*drop}" r="3" fill="${shape.group.color}" stroke="#f4fffa" stroke-width=".9" opacity="${1-ease((progress-.45)/.28)}"/>`
      : '';
    return electronPoint(...point,burst?4.4:6.8,1-ease((progress-.70)/.30))+wave+marker;
  }).join('');
}

const visibleBoundaries = [.36,.67];
const spectralRegions = [
  {label:'UV', scale:[[90,0],[94,.15],[95,.27],[97,.40],[103,.54],[122,.69],[380,1]]},
  {label:'Synlig lys', scale:[[380,0],[410,.16],[434,.34],[486,.52],[656,.79],[780,1]]},
  {label:'Infrarødt', scale:[[780,0],[1094,.14],[1282,.27],[1875,.42],[2626,.56],[4052,.70],[7460,.89],[8200,1]]}
];

function scaledPosition(nm, scale) {
  const i=scale.findIndex(([value])=>nm<=value);
  if(i===0) return 0;
  if(i<0) return 1;
  const [low,l]=scale[i-1], [high,h]=scale[i];
  return l+(h-l)*(nm-low)/(high-low);
}

function spectrumGraphic(layout,state,drawing) {
  const {width,compact}=layout, {line,text,fmt,transitionKey}=drawing;
  const {mode,transitions,solved,selected,animation}=state;
  const left=14,right=width-14,top=25,bottom=60,range=right-left;
  const edges=[0,...visibleBoundaries,1].map(fraction=>left+fraction*range);
  const regions=spectralRegions.map((item,i)=>({...item,left:edges[i],right:edges[i+1]}));
  const x=nm=>{
    const region=regions[nm<380?0:nm<780?1:2];
    return region.left+scaledPosition(nm,region.scale)*(region.right-region.left);
  };
  const titles=regions.map(({left,right,label})=>text((left+right)/2,17,label,'class="hs-spectrum-title" text-anchor="middle"')).join('');
  const divisions=edges.slice(1,-1).map(xx=>line(xx,top+1,xx,bottom-1,'#475262','opacity=".8"')).join('');
  const ticks=[100,380,780,2000,8000].map((nm,i)=>{
    const xx=x(nm);
    return line(xx,bottom,xx,bottom+5,'var(--muted,#71887c)')
      + text(xx,bottom+18,fmt(nm,0),`class="hs-label" text-anchor="${i===4?'end':'middle'}"`);
  }).join('');
  const displayed=transitions.filter(t=>mode!=='quiz'||solved.has(transitionKey(t)));
  const points=displayed.map(t=>({t,xx:x(t.wavelengthNM)})).sort((a,b)=>a.xx-b.xx);
  const burst=animation?.phase==='burst';
  const lines=points.map(({t,xx},i)=>{
    const key=transitionKey(t),color=spectrumColor(t,key),chosen=key===selected,found=solved.has(key);
    const maxHit=compact?19:26;
    const l=Math.max(left,xx-maxHit,points[i-1]?(xx+points[i-1].xx)/2:left);
    const r=Math.min(right,xx+maxHit,points[i+1]?(xx+points[i+1].xx)/2:right);
    const hit=`<rect x="${l}" y="${top}" width="${r-l}" height="${bottom-top}" fill="transparent" pointer-events="all"/>`;
    const focus=line(xx,top+2,xx,bottom-2,'#fff','stroke-width="10" class="hs-focus" opacity="0" pointer-events="none"');
    const glow=chosen||burst
      ? line(xx,top+3,xx,bottom-3,color,`stroke-width="${chosen?16:10}" opacity="${chosen?.43:.27}" stroke-linecap="round" pointer-events="none"${burst?' class="hs-burst-glow"':''}`)
      : '';
    const mark=line(xx,top+3,xx,bottom-3,color,
      `stroke-width="${chosen?5:burst?4:t.region==='Synlig'?3.5:2.8}" opacity="${chosen||burst||t.region==='Synlig'?1:.87}" stroke-linecap="round" class="hs-mark" pointer-events="none"`);
    return linkGroup(key,'spectrum',transitionDescription(t,state,found,fmt),{chosen,found},hit+focus+glow+mark,`data-series-line="${key}"`);
  }).join('');
  const shown=points.find(({t})=>transitionKey(t)===selected);
  const value=shown?text(Math.max(left+30,Math.min(right-36,shown.xx)),bottom-6,`${fmt(shown.t.wavelengthNM,0)} nm`,
    'class="hs-selected-wavelength" text-anchor="middle" pointer-events="none" style="fill:#f6fbff;stroke:#0b0e15;stroke-width:4px;paint-order:stroke"'):'';
  return `<desc>Emisjonslinjer i ultrafiolett, synlig og infrarødt lys. Bølgelengde i nanometer langs en ujevn skala.</desc>
    ${titles}<rect x="${left}" y="${top}" width="${range}" height="${bottom-top}" rx="6" fill="#0b0e15"/>
    ${divisions}${lines}${value}${ticks}
    ${text(right,bottom+32,'Bølgelengde i nm · ujevn skala','class="hs-scale" text-anchor="end"')}`;
}

export function seriesBoardGraphic(layout,state,drawing) {
  return {
    board:boardGraphic(layout,state,drawing),
    spectrum:spectrumGraphic(layout,state,drawing),
    motion:seriesBoardMotion(layout,state,drawing)
  };
}
