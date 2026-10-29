const cache = new Map();
const NS = 'http://www.w3.org/2000/svg';
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function loadJSON(url) {
  if (!cache.has(url)) cache.set(url, fetch(url,{signal:AbortSignal.timeout(20000)}).then(r => {if (!r.ok) throw Error('Kunne ikke hente kartet.'); return r.json();}).catch(e => {cache.delete(url); throw e;}));
  return cache.get(url);
}
const svgElement = (name, attrs = {}) => {
  const el = document.createElementNS(NS, name);
  for (const [key,value] of Object.entries(attrs)) if (value !== undefined) el.setAttribute(key,String(value));
  return el;
};
export function flagHTML(flag, className = '') {
  const code = typeof flag === 'string' ? flag : flag?.code || flag?.flagCode;
  if (!code || !/^[a-z]{2}$/i.test(code)) return '';
  const local = window.MapSymbols?.lookup('', {kind:'country',code});
  const src = local?.src || '/assets/geography/flags/' + code.toLowerCase() + '.svg';
  return `<img class="question-flag ${escape(className)}" src="${escape(src)}" alt="Flagg" draggable="false">`;
}
function viewBox(value) {
  const numbers = Array.isArray(value) ? value : String(value || '').trim().split(/[ ,]+/).map(Number);
  return numbers.length === 4 && numbers.every(Number.isFinite) && numbers[2] > 0 && numbers[3] > 0 ? numbers : null;
}
async function mapData(key) {
  const catalog = await loadJSON('/assets/quizlab/catalog.json');
  const descriptor = catalog.maps?.[key];
  if (!descriptor) throw Error('Kartet finnes ikke i denne utgaven av quizen.');
  const source = await loadJSON(descriptor.source);
  const map = descriptor.region ? source.regions?.[descriptor.region] : source;
  if (!map) throw Error('Kartområdet kunne ikke lastes.');
  let states = Array.isArray(map) ? map : map.states || map.paths || [];
  if (descriptor.filterGroup) states = states.filter(s => s.group === descriptor.filterGroup || descriptor.filterGroup.includes?.(s.group));
  return {descriptor,map,source,states,box:viewBox(descriptor.viewBox || map.viewBox)};
}
function pathGroup(svg, data, className) {
  if (!data) return;
  const group = svgElement('g', {'class':className});
  for (const item of typeof data === 'string' ? [{d:data}] : Array.isArray(data) ? data : []) {
    if (typeof item === 'string') group.append(svgElement('path',{d:item}));
    else if (item.d) group.append(svgElement('path',{d:item.d,'data-kind':item.kind}));
  }
  svg.append(group);
}
function attribution(container, descriptor) {
  if (!descriptor?.attribution) return;
  const credit=document.createElement('p');credit.className='map-attribution';
  if (/^https:\/\//.test(descriptor.attributionURL || '')) {
    const link=document.createElement('a');link.href=descriptor.attributionURL;link.target='_blank';link.rel='noopener';link.textContent=descriptor.attribution;credit.append(link);
  } else credit.textContent=descriptor.attribution;
  container.append(credit);
}
function fit(svg, group, padding = .035) {
  const b = group.getBBox();
  const pad = Math.max(b.width,b.height) * padding || 1;
  return [b.x-pad,b.y-pad,b.width+pad*2,b.height+pad*2];
}
function controls(container, svg, initialBox, onPoint, signal) {
  let box = initialBox.slice(), drag = null, moved = false;
  const initial = initialBox.slice();
  const apply = () => svg.setAttribute('viewBox',box.join(' '));
  const point = event => {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
  };
  const zoom = (factor, anchor) => {
    const width = Math.max(initial[2]/24, Math.min(initial[2]*1.15, box[2]*factor));
    factor = width / box[2];
    const centre = anchor || {x:box[0]+box[2]/2,y:box[1]+box[3]/2};
    box = [centre.x-(centre.x-box[0])*factor,centre.y-(centre.y-box[1])*factor,width,box[3]*factor];
    apply();
  };
  const toolbar = document.createElement('div'); toolbar.className='map-controls';
  toolbar.innerHTML = '<button type="button" aria-label="Zoom inn">+</button><button type="button" aria-label="Zoom ut">−</button><button type="button" aria-label="Vis hele kartet">↺</button>';
  const buttons = toolbar.querySelectorAll('button');
  buttons[0].onclick=()=>zoom(.7);buttons[1].onclick=()=>zoom(1/.7);buttons[2].onclick=()=>{box=initial.slice();apply();};
  container.append(toolbar);
  svg.addEventListener('wheel',event=>{event.preventDefault();zoom(event.deltaY > 0 ? 1.15 : 1/1.15,point(event));},{signal,passive:false});
  svg.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,box:box.slice()};moved=false;svg.setPointerCapture(event.pointerId);},{signal});
  svg.addEventListener('pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(dx,dy)<6&&!moved)return;moved=true;const rect=svg.getBoundingClientRect(),scale=Math.min(rect.width/box[2],rect.height/box[3]);box=[drag.box[0]-dx/scale,drag.box[1]-dy/scale,box[2],box[3]];apply();},{signal});
  svg.addEventListener('pointerup',event=>{if(!drag)return;const didMove=moved;drag=null;if(!didMove)onPoint?.(event,point(event));},{signal});
  svg.addEventListener('pointercancel',()=>{drag=null;},{signal});
  svg.addEventListener('keydown',event=>{if(event.target!==svg)return;const step=.12;if(event.key==='+'||event.key==='='){zoom(.7);event.preventDefault();}else if(event.key==='-'){zoom(1/.7);event.preventDefault();}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){box[0]+=event.key==='ArrowLeft'?-box[2]*step:event.key==='ArrowRight'?box[2]*step:0;box[1]+=event.key==='ArrowUp'?-box[3]*step:event.key==='ArrowDown'?box[3]*step:0;apply();event.preventDefault();}},{signal});
  apply();
}
export async function renderQuestion(container, question, answer, {signal} = {}) {
  const q = question;
  if (q.type === 'choice') {
    if (q.flag || q.flagCode) container.insertAdjacentHTML('beforeend',flagHTML(q.flag || q.flagCode));
    if (q.silhouette) {
      const catalog = await loadJSON('/assets/quizlab/catalog.json');
      const ref = typeof q.silhouette === 'string' ? catalog.silhouettes?.[q.silhouette] : q.silhouette;
      if (!ref) throw Error('Landomrisset kunne ikke lastes.');
      const data = await mapData(ref.mapKey), shape = data.states.find(s => (s.id || s.n || s.name) === (ref.targetId || ref.id));
      if (!shape) throw Error('Landomrisset mangler i kartet.');
      if(signal?.aborted)return;
      const svg=svgElement('svg',{'class':'country-silhouette',role:'img','aria-label':'Landomriss'}),g=svgElement('g');
      g.append(svgElement('path',{d:shape.d}));svg.append(g);container.append(svg);svg.setAttribute('viewBox',fit(svg,g,.08).join(' '));attribution(container,data.descriptor);
    }
    if(signal?.aborted)return;
    const choices=document.createElement('div');choices.id='quiz-choices';choices.className='choices';
    for(const [index,option]of(q.options||[]).entries()){
      const item=typeof option==='string'?{id:option,label:option}:option,button=document.createElement('button');
      button.type='button';button.dataset.choiceId=String(item.id);button.className='choice-button';
      button.innerHTML=`<span class="choice-key" aria-hidden="true">${index+1}</span><span>${escape(item.label || item.name || item.id)}</span>`;
      button.addEventListener('click',()=>answer({choiceId:item.id}),{signal});choices.append(button);
    }
    container.append(choices);return;
  }
  const wrap=document.createElement('div');wrap.className='quiz-map';
  const svg=svgElement('svg',{role:'group','aria-label':q.type==='location'?'Verdenskart. Velg et sted.':'Trykk på riktig område i kartet.',tabindex:'0'});
  wrap.append(svg);container.append(wrap);
  if(q.type==='location'){
    if(q.flag || q.flagCode)container.insertAdjacentHTML('afterbegin',flagHTML(q.flag || q.flagCode,'small-flag'));
    const meta=await loadJSON('/assets/geography/mapwiz-world-map.json');if(signal?.aborted)return;
    const width=meta.width,height=meta.height;
    const merc=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
    const upper=merc(meta.top),lower=merc(meta.bottom);
    svg.id='quiz-location-map';svg.setAttribute('aria-label','Verdenskart. Bruk piltastene for å flytte kartet, pluss og minus for å zoome og Enter for å velge midtpunktet.');svg.append(svgElement('image',{href:meta.image,x:0,y:0,width,height}));
    const pin=svgElement('circle',{id:'quiz-location-pin',r:12,'class':'location-pin',visibility:'hidden','pointer-events':'none'});svg.append(pin);
    const hint=document.createElement('p');hint.className='map-hint';hint.textContent='Trykk på stedet, og bekreft svaret. Du kan zoome og dra i kartet.';container.append(hint);
    const confirm=document.createElement('button');confirm.id='quiz-location-submit';confirm.className='primary-button';confirm.textContent='Svar her';confirm.disabled=true;container.append(confirm);
    let selected=null;
    const choose=p=>{if(!p||p.x<0||p.y<0||p.x>width||p.y>height)return;selected={lon:meta.west+p.x/width*(meta.east-meta.west),lat:Math.atan(Math.sinh(upper-p.y/height*(upper-lower)))*180/Math.PI};pin.setAttribute('cx',p.x);pin.setAttribute('cy',p.y);pin.setAttribute('visibility','visible');confirm.disabled=false;hint.textContent='Sted valgt. Trykk «Svar her» for å bekrefte.';};
    controls(wrap,svg,[0,0,width,height],(_,p)=>choose(p),signal);
    svg.addEventListener('keydown',event=>{if(event.target===svg&&['Enter',' '].includes(event.key)){event.preventDefault();const b=svg.viewBox.baseVal;choose({x:b.x+b.width/2,y:b.y+b.height/2});}},{signal});
    const catalog=await loadJSON('/assets/quizlab/catalog.json');attribution(container,catalog.maps?.world);
    confirm.addEventListener('click',()=>{if(selected)answer(selected);},{signal});
    return;
  }
  const data=await mapData(q.mapKey || q.module);if(signal?.aborted)return;
  pathGroup(svg,data.map.context || data.source.context,'map-context');
  pathGroup(svg,data.map.background || data.source.background,'map-background');
  pathGroup(svg,data.map.water,'map-water');
  pathGroup(svg,data.map.quietIslands,'map-context');
  const targets=svgElement('g',{'class':'map-targets'});
  for(const shape of data.states){
    const id=shape.id || shape.n || shape.name;if(!id||!shape.d)continue;
    const group=svgElement('g',{'class':'map-target','data-target-id':id,tabindex:'0',role:'button','aria-label':id});
    const attrs={d:shape.d,'class':'target-shape','data-kind':shape.kind};
    if(shape.kind==='river'){attrs.fill='none';attrs['stroke-width']=2;}
    group.append(svgElement('path',attrs));
    if(shape.kind==='river'||shape.marker)group.append(svgElement('path',{d:shape.d,'class':'target-hit','stroke-width':shape.hitWidth || 10}));
    group.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();answer({targetId:id});}},{signal});
    targets.append(group);
  }
  svg.append(targets);pathGroup(svg,data.map.boundaries,'map-boundaries');
  const box=data.box || fit(svg,targets);
  controls(wrap,svg,box,(event)=>{const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-target-id]');if(target&&svg.contains(target))answer({targetId:target.dataset.targetId});},signal);
  const hint=document.createElement('p');hint.className='map-hint';hint.textContent='Trykk på riktig område. Bruk + og − for å zoome. Dra for å flytte kartet.';container.append(hint);
  attribution(container,data.descriptor);
}
