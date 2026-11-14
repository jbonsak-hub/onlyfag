const EV_J=1.602176634e-19, HC_EV_NM=1239.841984, C=299792458;
const fmt=(v,d=2)=>Number(v).toLocaleString('nb-NO',{maximumFractionDigits:d});
const sci=(v,d=3)=>{if(!v)return '0';const p=Math.floor(Math.log10(Math.abs(v)));return `${fmt(v/10**p,d)} · 10<sup>${p}</sup>`;};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};

export function hydrogenEnergy(n){
 if(!Number.isInteger(n)||n<1)throw new RangeError('n must be a positive integer');
 return -13.6/n**2;
}
export function transition(from,to){
 const signedEV=hydrogenEnergy(to)-hydrogenEnergy(from), energyEV=Math.abs(signedEV);
 const wavelengthNM=energyEV?HC_EV_NM/energyEV:Infinity;
 const region=!energyEV?'Ingen stråling':wavelengthNM<380?'UV':wavelengthNM<=780?'Synlig':'IR';
 return {from,to,type:!energyEV?'none':signedEV>0?'absorption':'emission',signedEV,energyEV,energyJ:energyEV*EV_J,wavelengthNM,frequencyHz:energyEV?C/(wavelengthNM*1e-9):0,region,color:photonColor(wavelengthNM)};
}
export function possibleTransitions(maxLevel){
 if(!Number.isInteger(maxLevel)||maxLevel<1||maxLevel>6)throw new RangeError('Shown levels are 1–6');
 const result=[];for(let upper=2;upper<=maxLevel;upper++)for(let lower=1;lower<upper;lower++)result.push(transition(upper,lower));
 return result.sort((a,b)=>a.wavelengthNM-b.wavelengthNM);
}
export function excitationForEnergy(energyEV,tolerance=.025){
 const e=Number(energyEV);if(!Number.isFinite(e)||e<=0)return {kind:'invalid',level:1,energyEV:e};
 if(e>=13.6)return {kind:'ionization',level:null,energyEV:e,excessEV:e-13.6};
 const candidates=Array.from({length:5},(_,i)=>({level:i+2,energy:hydrogenEnergy(i+2)-hydrogenEnergy(1)}));
 const best=candidates.reduce((a,b)=>Math.abs(b.energy-e)<Math.abs(a.energy-e)?b:a);
 if(Math.abs(best.energy-e)<=tolerance)return {kind:'excitation',level:best.level,energyEV:best.energy,inputEV:e,rounded:Math.abs(best.energy-e)>1e-7};
 return {kind:'no-match',level:1,energyEV:e};
}
export function cascadeLevels(level,strategy='stepwise',random=Math.random){
 if(!Number.isInteger(level)||level<2||level>6)return [1];
 if(strategy==='direct')return [level,1];
 const result=[level];while(result.at(-1)>1){const n=result.at(-1);result.push(strategy==='random'?1+Math.floor(clamp(random(),0,.999999)*(n-1)):n-1);}return result;
}
function photonColor(nm){
 if(!Number.isFinite(nm))return '#82969b';if(nm<380)return '#8b6cc9';if(nm>780)return '#b66c37';
 if(nm<450)return '#9168e0';if(nm<490)return '#258dde';if(nm<520)return '#159fa8';if(nm<580)return '#6baf42';if(nm<630)return '#d7a125';return '#d95a4b';
}
const regionLabel=t=>!t||t.type==='none'?'Ingen foton':`${t.region}${t.region==='Synlig'?' lys':' · usynlig'}`;
const levelOptions=(selected)=>Array.from({length:6},(_,i)=>`<option value="${i+1}" ${selected===i+1?'selected':''}>n = ${i+1} · ${fmt(hydrogenEnergy(i+1),2)} eV</option>`).join('');
const numberRows=t=>t.type==='none'?'<div><strong>Samme nivå:</strong> ingen energiendring og intet foton.</div>':`<div><strong>${regionLabel(t)}</strong></div><div>Bølgelengde: <strong>${fmt(t.wavelengthNM,1)} nm</strong></div><div>Fotonenergi: <strong>${sci(t.energyJ)} J</strong></div><div>Samme energi: ${fmt(t.energyEV,3)} eV</div><div>Frekvens: ${sci(t.frequencyHz)} Hz</div>`;
const styles=`<style>
.al-lab-svg{display:block;width:100%;height:auto;max-height:none!important;background:var(--surface,#fff);border-radius:10px}
.al-lab-svg text{font-family:inherit;font-size:17px;fill:var(--ink,#20352e)}
.al-lab-svg .al-small{font-size:14px;fill:var(--muted,#60736b)}
.al-lab-svg .al-tiny{font-size:12px;fill:var(--muted,#60736b)}
.al-lab-svg .al-level{stroke:var(--line,#cfdbd4);stroke-width:2}
.al-lab-svg .al-ring{stroke:var(--muted,#60736b);stroke-opacity:.28;fill:none}
.al-lab-svg .al-highlight{stroke:#438f89;stroke-width:3}
.al-readout{font-size:12px;line-height:1.6;background:var(--green-soft,#e7f3e9);border-radius:9px;padding:11px}
.al-readout>div+div{margin-top:5px}.al-readout strong{font-size:inherit}
.al-lab-controls .control{min-width:0}.al-lab-controls input[type=number]{width:100%;min-width:0}
.al-action-row{display:grid;grid-template-columns:1fr 1fr;gap:7px}.al-phase{font-weight:650;color:var(--green,#236448);font-size:12px;line-height:1.6;margin:0}
.al-key{font-size:12px;line-height:1.7;margin:9px 0;padding:10px 13px;border-left:3px solid var(--green,#236448);background:var(--green-soft,#e7f3e9)}
.al-spectrum-caption{font-size:12px;line-height:1.6;margin:7px 0}
.al-line-table{font-size:12px;border-collapse:collapse;width:100%;text-align:left}.al-line-table th,.al-line-table td{padding:7px 10px;border-bottom:1px solid var(--line,#dce5de)}
.al-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0;font-size:12px}.al-steps>div{border-bottom:2px solid var(--line,#dce5de);padding:5px 0}.al-steps b{color:var(--green,#236448)}
@media(max-width:520px){.al-steps{grid-template-columns:1fr}.al-lab-svg text{font-size:18px}.al-lab-svg .al-small{font-size:16px}}
</style>`;

export const atomLabSection={
 title:'Atom, energinivåer og lys',
 body:`${styles}<p>Et atom kan bare ha bestemte energier. <strong>Oppover krever energi inn.</strong> Nedover frigjør energi som ett foton. Fotonets energi er lik forskjellen mellom nivåene.</p>
<div class="model al-direct-model">
 <svg id="al-direct-svg" class="al-lab-svg" viewBox="0 0 860 350" role="img" aria-label="Hydrogenatom og energinivådiagram for én valgt overgang"></svg>
 <div class="controls al-lab-controls"><label class="control" for="al-from">Startnivå<select id="al-from">${levelOptions(3)}</select></label><label class="control" for="al-to">Sluttnivå<select id="al-to">${levelOptions(2)}</select></label><button id="al-direct-replay" type="button">Vis overgangen på nytt</button></div>
 <div id="al-direct-numbers" class="al-readout" aria-live="polite"></div>
 <p id="al-direct-phase" class="al-phase" aria-live="polite"></p>
 <p class="model-note">Venstre: skjematisk atom. Høyre: samme elektron vist etter energi. Sirklene er nivåmarkører, ikke virkelige elektronbaner. Nivåavstandene er strukket for lesbarhet; energitallene gjelder hydrogen.</p>
</div>
<h3>Eksiter atomet – og undersøk lyset det kan sende ut</h3>
<div class="al-steps"><div><b>1.</b> Send inn en passende fotonenergi.</div><div><b>2.</b> Elektronet løftes til et høyere nivå.</div><div><b>3.</b> Elektronet går ned igjen og sender ut fotoner.</div></div>
<div class="model al-excitation-model">
 <svg id="al-excitation-svg" class="al-lab-svg" viewBox="0 0 860 350" role="img" aria-label="Foton eksiterer hydrogen; elektronet går ned igjen langs én av flere mulige veier"></svg>
 <svg id="al-spectrum-svg" class="al-lab-svg" viewBox="0 0 860 160" role="img" aria-label="Mulige emisjonslinjer og fotoner som er sendt ut i dette forsøket"></svg>
 <div class="controls al-lab-controls">
  <label class="control" for="al-excite-preset">Velg en tillatt eksitasjon<select id="al-excite-preset">${Array.from({length:5},(_,i)=>{const n=i+2;return `<option value="${n}" ${n===4?'selected':''}>Til n = ${n} · ${fmt(transition(1,n).energyEV,3)} eV</option>`;}).join('')}<option value="custom">Manuell energi</option></select></label>
  <label class="control" for="al-input-energy">Energien i ett innkommende foton (eV)<input id="al-input-energy" type="number" min="0" max="30" step="0.001" value="12.75" inputmode="decimal"></label>
  <label class="control" for="al-cascade-mode">Vis deeksitasjonen<select id="al-cascade-mode"><option value="stepwise">Ett atom: via hvert nivå</option><option value="direct">Ett atom: direkte til n = 1</option><option value="random">Ett atom: en tilfeldig vei</option><option value="all">Mange atomer: alle mulige linjer</option></select></label>
  <div class="al-action-row"><button id="al-send-energy" type="button">Send foton</button><button id="al-excite-reset" type="button">Nullstill</button></div>
 </div>
 <div id="al-excitation-status" class="al-readout" aria-live="polite"></div>
 <p id="al-excitation-phase" class="al-phase" aria-live="polite"></p>
 <p class="al-key"><strong>Én elektron følger én vei ned.</strong> Alle de mulige linjene gjelder mange atomer som deeksiterer på ulike måter. De markerte linjene er bare fotonene som faktisk ble sendt ut i dette forsøket.</p>
 <details><summary>Se alle mulige overganger og bølgelengder</summary><div class="table-wrap"><table class="al-line-table"><thead><tr><th>Overgang</th><th>Område</th><th>Bølgelengde</th><th>Fotonenergi</th></tr></thead><tbody id="al-transition-table"></tbody></table></div></details>
 <details><summary>Om energitreff, toleranse og modellen</summary><p class="model-note">Her vises nivåene n = 1–6. Ett foton absorberes bare dersom det passer til en tillatt energiforskjell. Inndata godtas innen 0,025 eV som avrunding til riktig nivå; dette er en pedagogisk inndatatoleranse, ikke en fysisk linjebredde. Andre energier kan passere uten eksitasjon. Hydrogen har også høyere nivåer enn dem som vises. Fra grunntilstanden kan minst 13,6 eV frigjøre elektronet; se også ioniseringsmodellen nedenfor. De viste veiene er mulige illustrasjoner, ikke en beregning av overgangssannsynligheter eller atomets levetid.</p></details>
</div>`
};

function line(x1,y1,x2,y2,color='var(--line,#cfdbd4)',extra=''){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;}
function arrow(x1,y1,x2,y2,color,width=3){const a=Math.atan2(y2-y1,x2-x1),s=9;return line(x1,y1,x2,y2,color,`stroke-width="${width}"`)+`<path d="M${x2-s*Math.cos(a-.5)} ${y2-s*Math.sin(a-.5)}L${x2} ${y2}L${x2-s*Math.cos(a+.5)} ${y2-s*Math.sin(a+.5)}" fill="none" stroke="${color}" stroke-width="${width}"/>`;}
function packet(x,y,color,phase=0){let d='';for(let i=0;i<=50;i++){const yy=y+7*Math.sin(i*.6+phase)*Math.sin(Math.PI*i/50);d+=`${i?'L':'M'}${x+i} ${yy}`;}return `<path d="${d}" fill="none" stroke="${color}" stroke-width="3.5"/>`;}
const levelY=n=>304-(n-1)*47, radius=n=>23+n*13;
function atomAndLevels({id,from=1,to=1,progress=0,kind='none',caption='',possible=[],showPossibilities=false,ionized=false}){
 const t=transition(from,to),p=clamp(progress),isAbsorb=kind==='absorption',isEmit=kind==='emission';
 const travel=isAbsorb?smooth((p-.32)/.4):isEmit?smooth(p/.48):1;
 const electronLevel=from+(to-from)*travel,currentR=radius(from)+(radius(to)-radius(from))*travel;
 const dotX=155+currentR,dotY=164;let out=`<title>${caption}</title><text x="155" y="25" text-anchor="middle">Hydrogenatomet</text><text x="583" y="25" text-anchor="middle">Energien til elektronet</text>`;
 for(let n=6;n>=1;n--){const active=n===from||n===to;out+=`<circle class="al-ring" cx="155" cy="164" r="${radius(n)}" stroke-width="${active?2.3:1}" ${active?'style="stroke:#438f89;stroke-opacity:.8"':''}/>`;}
 out+=`<circle cx="155" cy="164" r="13" fill="#d88e6d"/><text x="155" y="170" text-anchor="middle" style="fill:white;font-size:19px">+</text>`;
 if(!ionized)out+=`<circle cx="${dotX}" cy="${dotY}" r="8" fill="#298fa7" stroke="var(--surface,#fff)" stroke-width="2"/><text x="155" y="292" text-anchor="middle">${from===to?`n = ${from}`:`n = ${from} → n = ${to}`}</text>`;
 else out+=`<circle cx="315" cy="105" r="7" fill="#298fa7"/><text x="155" y="292" text-anchor="middle">H⁺ og fritt elektron</text><text x="315" y="85" text-anchor="middle" class="al-small">e⁻</text>`;
 if(from!==to&&!ionized){out+=arrow(155+radius(from),186,155+radius(to),186,t.color,2);}
 if(isAbsorb&&p<.4){const x=285-(285-(155+radius(from)-25))*smooth(p/.4);out+=packet(x,143,t.color,p*9)+arrow(x+42,124,x+9,124,t.color,2);}
 if(isEmit&&p>.48&&p<.96){const x=155+radius(to)+(280-(155+radius(to)))*smooth((p-.48)/.48);out+=packet(x,143,t.color,p*9)+arrow(x+6,124,x+39,124,t.color,2);}
 if(from!==to){out+=`<text x="155" y="324" text-anchor="middle" style="fill:${t.color}">${regionLabel(t)} · ${fmt(t.wavelengthNM,1)} nm</text>`;}
 out+=`<text x="335" y="45" class="al-small">Energi øker oppover ↑</text>`;
 if(showPossibilities)for(const tr of possible){const xx=367+(tr.to-1)*13;out+=arrow(xx,levelY(tr.from),xx,levelY(tr.to),tr.color,1.2).replaceAll('stroke-width="1.2"','stroke-width="1.2" opacity=".22"');}
 for(let n=1;n<=6;n++){const active=n===from||n===to;out+=line(415,levelY(n),648,levelY(n),active?'#438f89':'var(--line,#cfdbd4)',`stroke-width="${active?3:1.7}"`)+`<text x="664" y="${levelY(n)+6}">n = ${n}</text><text x="744" y="${levelY(n)+6}" class="al-small">${fmt(hydrogenEnergy(n),2)} eV</text>`;}
 if(!ionized){const yy=levelY(from)+(levelY(to)-levelY(from))*travel;out+=`<circle cx="445" cy="${yy}" r="7" fill="#298fa7"/>`;if(from!==to)out+=arrow(552,levelY(from),552,levelY(to),t.color,4);}
 else out+=arrow(552,levelY(1),552,40,'#8b6cc9',4)+`<text x="648" y="48" class="al-small">Elektronet er fritt</text>`;
 return out;
}
function spectrumGraphic(possible,emitted){
 const min=80,max=10000,x=nm=>55+750*Math.log(nm/min)/Math.log(max/min),seen=new Set(emitted.map(t=>`${t.from}-${t.to}`));
 let out=`<text x="55" y="20">Mulige linjer og lys sendt ut i dette forsøket</text>`;
 for(const [a,b,color,label]of [[min,380,'#e7ddf1','UV'],[380,780,'#e0eee5','Synlig'],[780,max,'#f0e2d7','IR']])out+=`<rect x="${x(a)}" y="36" width="${x(b)-x(a)}" height="72" fill="${color}"/><text x="${(x(a)+x(b))/2}" y="53" text-anchor="middle" style="fill:#42514d;font-size:14px">${label}</text>`;
 for(const tr of possible){const active=seen.has(`${tr.from}-${tr.to}`),xx=x(tr.wavelengthNM);out+=line(xx,active?62:75,xx,108,tr.color,`stroke-width="${active?5:2}" opacity="${active?1:.32}"`);}
 for(const nm of [100,380,780,2000,10000])out+=line(x(nm),109,x(nm),114,'var(--muted,#60736b)')+`<text x="${x(nm)}" y="133" text-anchor="middle" class="al-small">${fmt(nm,0)}</text>`;
 return out+`<text x="430" y="157" text-anchor="middle" class="al-small">Bølgelengde i nm · logaritmisk skala · kraftige linjer = sendt ut her</text>`;
}

export function mountAtomLab(root,api){
 const q=id=>root.querySelector('#'+id),num=id=>Number(q(id).value),say=(id,value)=>{if(q(id).innerHTML!==value)q(id).innerHTML=value;};
 if(!q('al-direct-svg'))return;
 let now=0,directStart=0,directRunning=true,energyStart=0,experiment=null,selectedResult=excitationForEnergy(12.75);
 const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const elapsedProgress=(start,duration)=>reduced()?1:clamp((now-start)/duration);
 function directNumbers(){
  const t=transition(num('al-from'),num('al-to'));
  say('al-direct-numbers',`<div><strong>${t.type==='absorption'?'Absorpsjon: energi inn':t.type==='emission'?'Emisjon: energi ut':'Ingen overgang'}</strong></div>${numberRows(t)}`);
 }
 function chooseDirect(){directStart=now;directRunning=true;directNumbers();api.repaint();}
 function getPossible(){return selectedResult.kind==='excitation'?possibleTransitions(selectedResult.level):[];}
 function updateTable(){const all=getPossible();q('al-transition-table').innerHTML=all.length?all.map(t=>`<tr><td>n = ${t.from} → ${t.to}</td><td>${t.region}</td><td>${fmt(t.wavelengthNM,1)} nm</td><td>${sci(t.energyJ)} J</td></tr>`).join(''):'<tr><td colspan="4">Velg energi som passer til et av de viste nivåene.</td></tr>';}
 function describeEnergy(){
  selectedResult=excitationForEnergy(num('al-input-energy'));experiment=null;
  const r=selectedResult;q('al-excite-preset').value=r.kind==='excitation'?String(r.level):'custom';
  if(r.kind==='excitation'){const all=possibleTransitions(r.level);say('al-excitation-status',`<div><strong>Passer til n = ${r.level}</strong></div><div>Energi inn: ${sci(r.energyEV*EV_J)} J</div><div>ΔE = ${fmt(r.energyEV,3)} eV</div><div>Etterpå: <strong>${all.length} mulige linjer</strong> fra en samling slike atomer.</div>${r.rounded?'<div>Inndata tolkes som avrundet til dette nivået.</div>':''}`);}
  else if(r.kind==='ionization')say('al-excitation-status','<div><strong>Minst 13,6 eV: fotonet kan ionisere.</strong></div><div>Elektronet blir fritt; dette er ikke et nytt bundet nivå.</div>');
  else if(r.kind==='no-match')say('al-excitation-status','<div><strong>Treffer ikke en vist energiforskjell.</strong></div><div>Ingen eksitasjon til n = 2–6 i denne modellen. Prøv et av de tillatte valgene.</div>');
  else say('al-excitation-status','<div>Skriv inn en positiv fotonenergi.</div>');
  updateTable();say('al-excitation-phase','Klar: elektronet starter i grunntilstanden n = 1.');api.repaint();
 }
 q('al-from').addEventListener('change',chooseDirect);q('al-to').addEventListener('change',chooseDirect);q('al-direct-replay').addEventListener('click',chooseDirect);
 q('al-excite-preset').addEventListener('change',()=>{if(q('al-excite-preset').value!=='custom')q('al-input-energy').value=String(transition(1,num('al-excite-preset')).energyEV);describeEnergy();});
 q('al-input-energy').addEventListener('input',describeEnergy);q('al-cascade-mode').addEventListener('change',describeEnergy);q('al-excite-reset').addEventListener('click',describeEnergy);
 q('al-send-energy').addEventListener('click',()=>{
  selectedResult=excitationForEnergy(num('al-input-energy'));energyStart=now;
  experiment={result:selectedResult,levels:selectedResult.kind==='excitation'?cascadeLevels(selectedResult.level,q('al-cascade-mode').value):[1],all:selectedResult.kind==='excitation'&&q('al-cascade-mode').value==='all'?possibleTransitions(selectedResult.level):null};
  updateTable();api.repaint();
 });
 api.onFrame(t=>{
  now=t;const direct=transition(num('al-from'),num('al-to')),p=directRunning?elapsedProgress(directStart,3.3):1;
  q('al-direct-svg').innerHTML=atomAndLevels({id:'direct',from:direct.from,to:direct.to,progress:p,kind:direct.type,caption:'Valgt elektronovergang'});
  const phase=direct.type==='none'?'Samme nivå: ingen energi overføres.':direct.type==='absorption'?(p<.32?'1. Et foton med riktig energi nærmer seg.':p<.73?'2. Fotonet absorberes; elektronet får energi.':'3. Elektronet er eksitert på et høyere nivå.'):(p<.48?'1. Elektronet går til lavere energi.':p<.96?'2. Energiforskjellen sendes ut som ett foton.':'3. Atomet har mistet akkurat fotonets energi.');
  say('al-direct-phase',phase);
  let from=1,to=1,kind='none',progress=1,emitted=[],phaseText='Klar: elektronet starter i grunntilstanden n = 1.',ionized=false,finished=false;
  const r=experiment?.result||selectedResult,possible=r.kind==='excitation'?possibleTransitions(r.level):[];
  if(experiment){
   const interval=experiment.all?1:1.5,count=experiment.all?experiment.all.length:experiment.levels.length-1,duration=2.1+count*interval,age=reduced()?duration+.1:Math.max(0,now-energyStart);
   if(r.kind==='excitation'){
    finished=age>=duration;
    if(age<2.1){from=1;to=r.level;kind='absorption';progress=clamp(age/1.8);phaseText=age<.6?'1. Fotonet nærmer seg.':age<1.35?'2. Riktig energi absorberes; elektronet løftes.':`3. Atomet er eksitert: n = ${r.level}.`;
    }else{
     const transitions=experiment.all||experiment.levels.slice(0,-1).map((n,i)=>transition(n,experiment.levels[i+1]));
     const index=Math.min(transitions.length-1,Math.floor((age-2.1)/interval)),tr=transitions[index];from=tr.from;to=tr.to;kind='emission';progress=clamp((age-2.1-index*interval)/interval);
     for(let i=0;i<transitions.length;i++)if(age>=2.1+i*interval+interval*.5)emitted.push(transitions[i]);
     phaseText=age>=duration?(experiment.all?`Ferdig: alle ${transitions.length} mulige linjer er vist med mange atomer. Ikke alle fotonene kommer fra ett elektron.`:`Ferdig: én vei var ${experiment.levels.join(' → ')}. ${experiment.levels.length-1} foton${experiment.levels.length===2?'':'er'} ble sendt ut.`):(experiment.all?`Nytt eksempelatom: n = ${from} → ${to}. ${regionLabel(tr)} · ${fmt(tr.wavelengthNM,1)} nm.`:`4. n = ${from} → ${to}: ${regionLabel(tr)}, ${fmt(tr.wavelengthNM,1)} nm.`);
    }
   }else if(r.kind==='ionization'){
    ionized=age>.7;phaseText=ionized?'Elektronet er fritt. Atomet er ionisert, ikke bare eksitert.':'Fotonenergien er stor nok til å frigjøre elektronet.';
   }else phaseText='Fotonet gir ingen overgang til et av de viste nivåene. Elektronet blir i n = 1.';
  }
  q('al-excitation-svg').innerHTML=atomAndLevels({id:'excite',from,to,kind,progress,possible,showPossibilities:possible.length>0,ionized,caption:'Eksitasjon og deeksitasjon i hydrogen'});
  q('al-spectrum-svg').innerHTML=spectrumGraphic(possible,emitted);
  q('al-spectrum-svg').setAttribute('data-possible-count',String(possible.length));q('al-spectrum-svg').setAttribute('data-emitted-count',String(emitted.length));
  q('al-excitation-svg').setAttribute('data-state',ionized?'ionized':!experiment?'ready':r.kind==='excitation'?(finished?'complete':'running'):r.kind==='no-match'?'no-match':r.kind);
  say('al-excitation-phase',phaseText);
 });
 directNumbers();describeEnergy();
}
