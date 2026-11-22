const colorNames = {red:'rødt', green:'grønt', blue:'blått'};
const beamColors = {red:'#d75a55', green:'#398463', blue:'#4e7fcd'};
const channels = Object.keys(colorNames);
const surfaceY = 115;

function ray(x1, y1, x2, y2, color, arrowAt = 1) {
 let path = `M${x1} ${y1}L${x2} ${y2}`;
 if (arrowAt !== null) {
  const angle = Math.atan2(y2-y1, x2-x1);
  const head = 11;
  const x = x1 + (x2-x1)*arrowAt, y = y1 + (y2-y1)*arrowAt;
  path += `M${x-head*Math.cos(angle-.45)} ${y-head*Math.sin(angle-.45)}L${x} ${y}l${-head*Math.cos(angle+.45)} ${-head*Math.sin(angle+.45)}`;
 }
 return `<path d="${path}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
}

export const absorptionSection = {
 title:'Absorpsjon: energien tas opp',
 body:`<style>
.topic-page .model.abs-model{max-width:none;padding:18px}
.abs-stage{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-template-rows:auto auto auto;align-items:start;margin:0;padding:clamp(10px,2vw,19px) 0;border:1px solid var(--line);border-radius:12px;background:var(--sidebar)}
.abs-stage label{display:grid;gap:5px;width:100%;max-width:12rem;min-width:0;font-size:13px;line-height:1.3;font-weight:650}
.abs-stage select{width:100%;min-width:0;min-height:40px;padding:7px 9px;border:1px solid var(--line);border-radius:7px;background:var(--surface);color:var(--ink);font:inherit}
.abs-light-choice{grid-area:1/2/2/7}
.abs-stage .abs-surface-choice{grid-area:3/4/4/10;justify-self:center;text-align:center}
.abs-reflected-label{grid-area:1/8/2/12;justify-self:end;font-size:13px;font-weight:650;text-align:right;line-height:1.3}
.topic-page .abs-model .abs-stage svg{grid-area:2/1/3/-1;display:block;width:100%;height:auto;max-height:none;min-height:0}
.abs-model .abs-readout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 18px;margin:12px 0 0;font-size:13px}
.abs-readout strong{font-size:inherit}
@media(max-width:460px){.topic-page .model.abs-model{padding:12px}.abs-stage label,.abs-reflected-label{font-size:12px}.abs-stage select{min-height:44px}.abs-model .abs-readout{grid-template-columns:1fr}}
</style>
<p>Lys som <strong>absorberes</strong>, avgir energi til stoffet, ofte som varme. En rød flate i hvitt lys reflekterer mye rødt og absorberer mer av de andre fargene.</p>
<div class="model abs-model" data-model-layout="custom">
 <figure class="abs-stage">
  <label class="abs-light-choice" for="abs-light">Innkommende lys
   <select id="abs-light">
    <option value="white">Hvitt lys</option>
    <option value="red">Rødt lys</option>
    <option value="green">Grønt lys</option>
    <option value="blue">Blått lys</option>
   </select>
  </label>
  <span class="abs-reflected-label" aria-hidden="true">Reflektert lys</span>
  <svg id="abs-figure" viewBox="0 0 760 184" role="img" aria-labelledby="abs-title abs-description">
   <title id="abs-title">Lys som treffer en ugjennomsiktig flate</title>
   <desc id="abs-description">Innkommende lys treffer flaten. Reflektert lys går videre opp mot høyre. Lys som absorberes, stopper i flaten.</desc>
   <g id="abs-rays"></g>
  </svg>
  <label class="abs-surface-choice" for="abs-surface">Overflate
   <select id="abs-surface">
    <option value="red">Rød</option>
    <option value="green">Grønn</option>
    <option value="blue">Blå</option>
    <option value="white">Hvit</option>
    <option value="black">Svart</option>
   </select>
  </label>
 </figure>
 <div id="abs-readout" class="readout abs-readout" aria-live="polite"></div>
</div>`
};

export function absorptionState(light='white', surface='red') {
 const incident = light==='white' ? channels : [light];
 const reflected = incident.filter(color=>surface==='white' || surface===color);
 const absorbed = incident.filter(color=>!reflected.includes(color));
 return {incident, reflected, absorbed};
}

export function mountAbsorption(root) {
 const find = id=>root.querySelector('#'+id);
 const light = find('abs-light');
 const surface = find('abs-surface');
 const rays = find('abs-rays');
 const readout = find('abs-readout');
 if (!light || !surface || !rays || !readout) return ()=>{};

 function draw() {
  const {incident, reflected, absorbed} = absorptionState(light.value, surface.value);
  const appearance = reflected.length===channels.length ? '#fff' : beamColors[reflected[0]] ?? '#253032';
  rays.innerHTML = `<rect x="216" y="${surfaceY}" width="328" height="54" rx="7" fill="${appearance}" stroke="#819591" stroke-width="2"/>`
   + incident.map(color=>{
    const strikeX = 380 + (channels.indexOf(color)-1)*28;
    const reflectedRay = reflected.includes(color);
    const incoming = ray(strikeX-237, 18, strikeX, surfaceY, beamColors[color], .52);
    const outgoing = reflectedRay
     ? ray(strikeX, surfaceY, strikeX+237, 18, beamColors[color])
     : ray(strikeX, surfaceY, strikeX+47, surfaceY+19, beamColors[color], null)
       + `<circle cx="${strikeX+47}" cy="${surfaceY+19}" r="5" fill="${beamColors[color]}"/>`;
    return incoming+outgoing;
   }).join('');
  const describe = colors=>colors.length ? colors.map(color=>colorNames[color]).join(', ') : 'ingen av de valgte lysfargene';
  readout.innerHTML = `<div><strong>Reflektert:</strong> ${describe(reflected)}.</div><div><strong>Absorbert:</strong> ${describe(absorbed)}.</div>`;
 }

 light.addEventListener('input',draw);
 surface.addEventListener('input',draw);
 draw();
 return ()=>{
  light.removeEventListener('input',draw);
  surface.removeEventListener('input',draw);
 };
}

export const absorptionQuestion={"id":"wv-f3","type":"mcq","level":"Start","prompt":"En ideelt rød, ugjennomsiktig flate belyses bare med blått lys. Hvordan ser den ut i den enkle fargemodellen?","choices":["Rød og lys.","Blå og lys.","Mørk, fordi det blå lyset absorberes."],"correct":2,"answer":"Det finnes ikke rødt lys å reflektere. Den ideelle røde flaten absorberer det blå lyset og ser mørk ut. Virkelige overflater er mindre ideelle."};
export const absorptionTerm={"term":"Absorpsjon","definition":"Bølgeenergi tas opp i stoffet."};
