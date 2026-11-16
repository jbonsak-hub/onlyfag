const absNames={red:'rødt',green:'grønt',blue:'blått'};
const absColors={red:'#d75a55',green:'#398463',blue:'#4e7fcd'};
const absArrow=(x1,y1,x2,y2,color)=>{
 const a=Math.atan2(y2-y1,x2-x1),size=8;
 return `<path d="M${x1} ${y1}L${x2} ${y2}m${-size*Math.cos(a-.45)} ${-size*Math.sin(a-.45)}L${x2} ${y2}l${-size*Math.cos(a+.45)} ${-size*Math.sin(a+.45)}" fill="none" stroke="${color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`;
};
export const absorptionSection={
 title:'Absorpsjon: energien tas opp',
 body:`<style>
.abs-model svg{display:block;width:100%;height:auto;border-radius:12px;background:var(--model-bg,var(--sidebar,#f1f6f7))}
.abs-model svg text{font:14px system-ui,sans-serif;fill:var(--ink,#273d4a)}
.abs-model svg .abs-small{font-size:12px;fill:var(--muted,#657985)}
.abs-model .controls{display:grid;gap:14px}.abs-model .control{max-width:none}.abs-model .readout>div{margin:8px 0}
</style><p>Lys som <strong>absorberes</strong>, avgir energi til stoffet, ofte som varme. Andre deler kan reflekteres eller slippe gjennom. En rød flate i hvitt lys reflekterer mye rødt og absorberer mer av de andre fargene.</p><div class="model abs-model"><svg id="abs-figure" viewBox="0 0 760 260" role="img" aria-labelledby="abs-title abs-description"><title id="abs-title">Hva reflekteres og hva absorberes?</title><desc id="abs-description">Velg belysning og overflate. Lys som flaten reflekterer sendes videre, mens resten tas opp i stoffet.</desc><g id="abs-rays"></g></svg><div class="controls"><label class="control" for="abs-light">Belysning<select id="abs-light"><option value="white">Hvitt lys</option><option value="red">Rødt lys</option><option value="green">Grønt lys</option><option value="blue">Blått lys</option></select></label><label class="control" for="abs-surface">Overflate<select id="abs-surface"><option value="red">Rød</option><option value="green">Grønn</option><option value="blue">Blå</option><option value="white">Hvit</option><option value="black">Svart</option></select></label></div><div id="abs-readout" class="readout" aria-live="polite"></div></div>`
};
export function absorptionState(light='white',surface='red'){
 const incident=light==='white'?Object.keys(absNames):[light];
 const reflected=incident.filter(c=>surface==='white'||surface===c);
 const absorbed=incident.filter(c=>!reflected.includes(c));
 return {incident,reflected,absorbed};
}
export function mountAbsorption(root){
 const find=id=>root.querySelector('#'+id),light=find('abs-light'),surface=find('abs-surface'),rays=find('abs-rays');
 if(!light||!surface||!rays)return ()=>{};
 const draw=()=>{
  const state=absorptionState(light.value,surface.value);
  const surfaceColor=surface.value==='white'?'#fff':surface.value==='black'?'#29353a':absColors[surface.value];
  let beams='';
  Object.keys(absNames).forEach((c,i)=>{
   if(!state.incident.includes(c))return;
   const y=93+i*23;
   beams+=absArrow(90,y,366,y,absColors[c]);
   beams+=state.reflected.includes(c)?absArrow(392,y,635,48+i*18,absColors[c]):absArrow(390,y,465,y,absColors[c])+`<circle cx="465" cy="${y}" r="5" fill="${absColors[c]}"/>`;
  });
  rays.innerHTML=`<text x="90" y="47">Innkommende lys</text><text x="622" y="27" text-anchor="middle">Reflektert lys</text><rect x="376" y="72" width="190" height="137" rx="14" fill="${surfaceColor}" stroke="#9cb0ba" stroke-width="2"/>${beams}<text x="471" y="235" text-anchor="middle" class="abs-small">Ugjennomsiktig flate</text>`;
  find('abs-readout').innerHTML=`<div><strong>Reflektert:</strong> ${state.reflected.length?state.reflected.map(c=>absNames[c]).join(', '):'ingen av de valgte lysfargene'}.</div><div><strong>Absorbert:</strong> ${state.absorbed.length?state.absorbed.map(c=>absNames[c]).join(', '):'ingen av de valgte lysfargene'}.</div>`;
 };
 light.addEventListener('input',draw);surface.addEventListener('input',draw);draw();
 return ()=>{light.removeEventListener('input',draw);surface.removeEventListener('input',draw);};
}


export const absorptionQuestion={"id":"wv-f3","type":"mcq","level":"Start","prompt":"En ideelt rød, ugjennomsiktig flate belyses bare med blått lys. Hvordan ser den ut i den enkle fargemodellen?","choices":["Rød og lys.","Blå og lys.","Mørk, fordi det blå lyset absorberes."],"correct":2,"answer":"Det finnes ikke rødt lys å reflektere. Den ideelle røde flaten absorberer det blå lyset og ser mørk ut. Virkelige overflater er mindre ideelle."};
export const absorptionTerm={"term":"Absorpsjon","definition":"Bølgeenergi tas opp i stoffet."};
