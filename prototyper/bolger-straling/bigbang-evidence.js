// Three independent, schematic teaching models. Sources are linked beside each model.
const bbClamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const bbFmt=(x,d=0)=>Number(x).toLocaleString('nb-NO',{maximumFractionDigits:d,minimumFractionDigits:d});
const bbMix=(a,b,t)=>a+(b-a)*t;
const bbRow=(label,value)=>'<span class="bb-readout-row"><span>'+label+'</span><strong>'+value+'</strong></span>';
const bbSvg=(label,body,height=390)=>'<svg viewBox="0 0 760 '+height+'" role="img" aria-label="'+label+'" xmlns="http://www.w3.org/2000/svg">'+body+'</svg>';
const bbWave=(left,right,cy,period,phase=0,amplitude=9)=>{
  let path='';
  for(let x=left;x<=right;x+=2)path+=(x===left?'M':'L')+x+' '+(cy+amplitude*Math.sin((x-left)/period*2*Math.PI-phase)).toFixed(2);
  return path;
};
const bbGalaxy=(x,y,color,angle=0)=>'<g transform="translate('+x.toFixed(2)+' '+y.toFixed(2)+') rotate('+angle+')"><ellipse rx="11" ry="4.5" fill="'+color+'" opacity=".38"/><ellipse rx="7" ry="2" fill="'+color+'"/><circle r="2" fill="#fff1cf"/></g>';
const bbPhoton=(x,y,color='#e4b85c')=>'<g transform="translate('+x.toFixed(2)+' '+y.toFixed(2)+')"><path d="M-10 0l3-4 3 8 3-8 3 8 3-4h4" fill="none" stroke="'+color+'" stroke-width="2.3" stroke-linejoin="round"/></g>';
export const cmbMapSource=Object.freeze({
  image:'https://media.esa.int/legacy/web/images/esa_multimedia/images/2013/03/planck_cmb/12583930-4-eng-GB/Planck_CMB.jpg?dl',
  page:'https://www.esa.int/media/planck-cmb-en-374995',
  credit:'ESA og Planck-samarbeidet',
  license:'CC BY-SA 3.0 IGO / ESA Standard Licence'
});
export const bigBangEvidencePhysics=Object.freeze({
  redshift(scale,emittedNm=486.13){return {scale,wavelength:emittedNm*scale,z:scale-1};},
  cmbScale:3000/2.725,
  cmb(progress){
    const p=bbClamp(progress);
    const scale=Math.pow(3000/2.725,p);
    return {scale,temperature:3000/scale,wavelengthUm:scale};
  },
  abundance(mode='mass'){
    return mode==='count'?{hydrogen:12/13,helium:1/13}:{hydrogen:12/16,helium:4/16};
  }
});
const bbStyles='<style>'+
'.bb-evidence{margin:30px 0 42px}.bb-evidence>h3{margin:0 0 8px;font-size:18px}.bb-evidence>p{margin:0 0 13px;max-width:85ch}.bb-widget svg{display:block;width:100%;height:auto;background:var(--bg,#eff4f1);border-radius:11px;overflow:visible}.bb-widget svg text{font-family:inherit;fill:var(--ink,#19322d);font-size:14px}.bb-widget svg .bb-small{font-size:12px;fill:var(--muted,#5d726c)}.bb-widget svg .bb-dark-label{fill:#e6efeb}.bb-widget svg .bb-title{font-weight:650;font-size:16px}.bb-widget .readout{display:block}.bb-widget .bb-readout-row{display:block;margin:6px 0}.bb-widget .bb-readout-row>span{display:block;font-size:11px;color:var(--muted)}.bb-widget .bb-readout-row>strong{display:block;font-size:14px;color:var(--green);font-weight:650}.bb-widget .bb-presets{display:grid;gap:6px}.bb-widget .bb-presets button[aria-pressed="true"]{background:var(--green);color:white}.bb-sources{font-size:11px!important;line-height:1.6;color:var(--muted)}.bb-model-details{font-size:11px;margin:6px 0}.bb-model-details summary{cursor:pointer;color:var(--green)}.bb-model-details p{margin:7px 0}.bb-widget .bb-map-caption{font-size:11px}.bb-widget .control{max-width:none}.bb-widget .bb-map-key{color:var(--muted);font-size:11px}@media(max-width:600px){.bb-evidence>h3{font-size:16px}.bb-evidence{margin:24px 0 34px}}'+
'</style>';

export const bigBangEvidenceHtml=bbStyles+
'<article class="bb-evidence"><h3>Rødforskyvning: rommet strekker lyset</h3>'+
'<p>Vi kjenner grunnstoffenes linjemønstre fra laboratoriet. I lyset fra fjerne galakser finner vi de samme mønstrene ved <strong>lengre bølgelengder</strong>. Det passer med at rommet har utvidet seg mens lyset var på vei.</p>'+
'<div class="model bb-widget" id="bb-redshift-model"><div id="bb-redshift-scene" data-model-visual></div>'+
'<div class="controls"><label class="control" for="bb-redshift-scale">Utvidelse siden lyset ble sendt <output id="bb-redshift-scale-value">1,6 ×</output><input type="range" id="bb-redshift-scale" min="1" max="2.6" step=".01" value="1.6"></label>'+
'<label class="control" for="bb-observer">Se fra en annen galakse<select id="bb-observer"><option value="0">Galakse A</option><option value="1">Galakse B</option><option value="2">Galakse C</option></select></label></div>'+
'<div class="readout" id="bb-redshift-readout" aria-live="polite"></div>'+
'<details class="bb-model-details"><summary>Om utvidelsen og spektrallinjene</summary><p>Alle avstander mellom de ubundne galaksegruppene følger den samme skalafaktoren. Hver galakse kan brukes som observatør; tegningen viser et utsnitt, ikke et sentrum i universet. Galaksene selv vokser ikke med denne utvidelsen.</p><p>Tre hydrogenlinjer er brukt: omtrent 434, 486 og 656 nm. Bølgelengdene multipliseres med skalafaktoren. Bevegelse mellom nære galakser kan i tillegg gi rød- eller blåforskyvning. Glideren viser hvor mye rommet har utvidet seg under lysreisen, ikke en galaksefart.</p></details></div>'+
'<p class="bb-sources">Kilde: <a href="https://science.nasa.gov/universe/overview/" target="_blank" rel="noopener">NASA – universets utvidelse</a>.</p></article>'+

'<article class="bb-evidence"><h3>Bakgrunnsstråling: gammelt lys i et større univers</h3>'+
'<p>Det varme, unge universet var fullt av stråling. Etter omtrent <strong>380 000 år</strong> kunne elektroner bindes til kjerner. Da ble universet gjennomsiktig. Dette lyset kommer fortsatt mot oss fra alle retninger.</p>'+
'<div class="model bb-widget" id="bb-cmb-model"><div id="bb-cmb-scene" data-model-visual></div>'+
'<div class="controls"><label class="control" for="bb-cmb-time">Fra ugjennomsiktig univers til i dag<input type="range" id="bb-cmb-time" min="0" max="1000" step="1" value="1000"></label>'+
'<div class="bb-presets"><button type="button" data-bb-cmb="0" aria-pressed="false">Før atomer</button><button type="button" data-bb-cmb="1" aria-pressed="false">Lyset slippes fri</button><button type="button" data-bb-cmb="1000" aria-pressed="true">I dag</button></div></div>'+
'<div class="readout" id="bb-cmb-readout" aria-live="polite"></div>'+
'<p class="model-note bb-map-caption">Plancks målte himmelkart: blått og rødt viser <strong>ørsmå temperaturforskjeller</strong> rundt 2,725 K, ikke synlige farger eller varme og kalde galakser. © <a href="'+cmbMapSource.page+'" target="_blank" rel="noopener">ESA og Planck-samarbeidet · åpne kartet</a>.</p>'+
'<details class="bb-model-details"><summary>Koblingen mellom utvidelse, bølgelengde og temperatur</summary><p>Når rommet blir 2 ganger større, blir strålingens bølgelengder 2 ganger lengre og strålingstemperaturen halveres. Siden lyset slapp fri har rommet blitt omtrent 1100 ganger større: omtrent 3000 K er blitt til 2,725 K. Bølgelengden ved toppen av bølgelengdespekteret var omtrent 1 µm og er nå omtrent 1,1 mm.</p><p>Glideren følger forhold i størrelse, ikke en lineær tidsakse. Bølgetegningene viser retningen på endringen; den store forskjellen i bølgelengde er komprimert. Himmelkartet viser alltid dagens måling. Det er ikke et bilde tatt utenfra universet.</p></details></div>'+
'<p class="bb-sources">Kilder: <a href="https://science.nasa.gov/universe/glossary/" target="_blank" rel="noopener">NASA – rekombinasjon og bakgrunnsstråling</a> · <a href="https://lambda.gsfc.nasa.gov/product/cobe/firas_overview.html" target="_blank" rel="noopener">NASA/COBE – målt strålingstemperatur</a>. Kart: ESA/Planck, CC BY-SA 3.0 IGO / ESA Standard Licence.</p></article>'+

'<article class="bb-evidence"><h3>Lette grunnstoffer: mest hydrogen, mye helium</h3>'+
'<p>Big Bang-modellen gir en konkret forventning til stoffet etter de første minuttene: omtrent <strong>75 % hydrogen og 25 % helium av massen i de opprinnelige atomkjernene</strong>. Mengdene vi finner i gammel, lite bearbeidet gass passer godt med dette.</p>'+
'<div class="model bb-widget" id="bb-abundance-model"><div id="bb-abundance-scene" data-model-visual></div>'+
'<div class="controls"><label class="control" for="bb-nuclei-progress">Avkjøling gjennom kjernedannelsen<input type="range" id="bb-nuclei-progress" min="0" max="100" step="1" value="100"></label>'+
'<div class="bb-presets" role="group" aria-label="Vis grunnstoffenes andeler"><button type="button" id="bb-by-mass" aria-pressed="true">Etter masse</button><button type="button" id="bb-by-count" aria-pressed="false">Etter antall kjerner</button></div></div>'+
'<div class="readout" id="bb-abundance-readout" aria-live="polite"></div>'+
'<details class="bb-model-details"><summary>Hvorfor viser modellen 14 protoner og 2 nøytroner?</summary><p>Da lette kjerner kunne bygges, var det omtrent sju protoner for hvert nøytron. Nesten alle nøytronene endte i helium-4: to protoner og to nøytroner i hver kjerne. Med 14 protoner og 2 nøytroner får vi derfor én heliumkjerne og 12 hydrogenkjerner.</p><p>Heliumkjernen har fire nukleoner. Den utgjør derfor 4 av 16 massedeler (25 %), men bare 1 av 13 kjerner (omtrent 8 %). Små mengder deuterium, helium-3 og litium er utelatt her. Utregningen bruker omtrent lik masse for protoner og nøytroner.</p><p>Bildet er en forenklet oppsummering av mange kjernereaksjoner. De detaljerte mengdene regnes ut med temperatur, tetthet og reaksjonshastigheter. Det tidlige universet rakk ikke å bygge store mengder tyngre kjerner før det ble for kaldt og tynt.</p></details></div>'+
'<p class="bb-sources">Kilder: <a href="https://pdg.lbl.gov/2025/reviews/rpp2025-rev-bbang-nucleosynthesis.pdf" target="_blank" rel="noopener">Particle Data Group – Big Bang-nukleosyntese</a> · <a href="https://supernova.eso.org/germany/exhibition/1104/?lang=en" target="_blank" rel="noopener">ESO – de første grunnstoffene</a>.</p></article>';

function bbSpectralColor(nm){
  if(nm>780)return '#c38577';
  if(nm<450)return '#a78be0';
  if(nm<510)return '#42b9ce';
  return '#e07760';
}
function mountRedshift(root,api){
  const find=id=>root.querySelector('#'+id),scene=find('bb-redshift-scene'),scaleInput=find('bb-redshift-scale'),observerInput=find('bb-observer');
  if(!scene)return ()=>{};
  let scale=+scaleInput.value,observer=0,disposed=false;
  const draw=t=>{
    if(disposed)return;
    const shift=bigBangEvidencePhysics.redshift(scale),names=['A','B','C'];
    const selectedOffsets=[[0,0],[55,0],[-55,36]],offset=selectedOffsets[observer];
    const cx=300,cy=115;
    let galaxies='';
    for(let row=-3;row<=3;row++)for(let col=-5;col<=5;col++){
      const gx=col*55,gy=row*36;
      const x=cx+(gx-offset[0])*scale,y=cy+(gy-offset[1])*scale;
      const isObserver=Math.abs(gx-offset[0])<1&&Math.abs(gy-offset[1])<1;
      const isSource=gx===offset[0]+55&&gy===offset[1];
      galaxies+=bbGalaxy(x,y,isObserver?'#f4c56b':isSource?'#ee9780':'#79b0c4',col*13+row*9);
    }
    const sourceX=cx+55*scale,sourceY=cy;
    const photonX=bbMix(sourceX,cx,(t*.16)%1);
    const labels='<text x="'+cx+'" y="169" text-anchor="middle" class="bb-dark-label">Observatør '+names[observer]+'</text><text x="'+sourceX.toFixed(1)+'" y="79" text-anchor="middle" class="bb-dark-label">Galakse på avstand</text>';
    const visibleX=130+(380-350)/1450*588,visibleW=400/1450*588;
    const spectrum=(factor,y)=>[434.05,486.13,656.28].map(nm=>{
      const x=130+(nm*factor-350)/1450*588;
      return '<line x1="'+x+'" x2="'+x+'" y1="'+(y-10)+'" y2="'+(y+10)+'" stroke="'+bbSpectralColor(nm*factor)+'" stroke-width="3"/>';
    }).join('');
    scene.innerHTML=bbSvg('Utvidelse mellom galakser strekker både avstander og lysbølgelengder. Referanse- og observert hydrogenspekter sammenliknes.',
      '<defs><clipPath id="bb-galaxy-clip"><rect x="22" y="42" width="716" height="143" rx="9"/></clipPath></defs>'+
      '<text x="24" y="25" class="bb-title">Avstander vokser. Galaksene selv beholder størrelsen.</text>'+
      '<rect x="22" y="42" width="716" height="143" rx="9" fill="#102b38"/><g clip-path="url(#bb-galaxy-clip)">'+galaxies+
      '<path d="M'+cx+' '+cy+'H'+sourceX+'" stroke="#adc8d1" stroke-width="1" stroke-dasharray="3 4"/>'+
      bbPhoton(photonX,sourceY,'#f3dba1')+labels+'</g>'+
      '<text x="24" y="215" class="bb-small">Lyset strekkes</text><path d="'+bbWave(150,718,222,36*scale,t*1.3)+'" fill="none" stroke="#b97469" stroke-width="2.7"/>'+
      '<path d="M156 246v5m0-3h'+(36*scale)+'m0-3v6" fill="none" stroke="#7e8d97"/><text x="'+(156+18*scale)+'" y="266" text-anchor="middle" class="bb-small">λ</text>'+
      '<rect x="130" y="279" width="588" height="63" rx="4" fill="#142a33"/><rect x="'+visibleX+'" y="279" width="'+visibleW+'" height="63" fill="#829f91" opacity=".2"/>'+
      '<text x="27" y="299" class="bb-small">Laboratoriet</text><text x="27" y="329" class="bb-small">Galaksen</text>'+spectrum(1,294)+spectrum(scale,324)+
      [400,800,1200,1600].map(nm=>{const x=130+(nm-350)/1450*588;return '<path d="M'+x+' 342v5" stroke="#8ba59a"/><text x="'+x+'" y="364" text-anchor="middle" class="bb-small">'+nm+'</text>';}).join('')+
      '<text x="203" y="382" text-anchor="middle" class="bb-small">Synlig lys</text><text x="520" y="382" text-anchor="middle" class="bb-small">Infrarødt · bølgelengde i nm</text>',394);
  };
  const update=()=>{
    scale=+scaleInput.value;observer=+observerInput.value;
    const shift=bigBangEvidencePhysics.redshift(scale);
    find('bb-redshift-scale-value').textContent=bbFmt(scale,2)+' ×';
    find('bb-redshift-readout').innerHTML=bbRow('Avstand mellom galaksegruppene',bbFmt(scale,2)+' × startavstanden')+
      bbRow('Én av hydrogenlinjene','486 nm → '+bbFmt(shift.wavelength)+' nm')+
      bbRow('Det vi kjenner igjen','Samme atommønster, strukket mot lengre bølgelengder');
    api.repaint(scene);
  };
  scaleInput.addEventListener('input',update);observerInput.addEventListener('change',update);
  const remove=api.onFrame(draw,scene);update();
  return ()=>{disposed=true;remove?.();scaleInput.removeEventListener('input',update);observerInput.removeEventListener('change',update);};
}
function mountCmb(root,api){
  const find=id=>root.querySelector('#'+id),scene=find('bb-cmb-scene'),input=find('bb-cmb-time');
  if(!scene)return ()=>{};
  const presets=[...root.querySelectorAll('[data-bb-cmb]')];
  let before=false,progress=1,disposed=false;
  const state=()=>bigBangEvidencePhysics.cmb(progress);
  const draw=t=>{
    if(disposed)return;
    const {scale}=state(),dots=[[57,81],[133,110],[216,75],[290,122],[75,154],[175,165],[260,175]];
    let particles='';
    for(let i=0;i<dots.length;i++){
      const [x0,y0]=dots[i],x=x0+2*Math.sin(t*.5+i),y=y0+2*Math.cos(t*.4+i);
      particles+='<circle cx="'+x+'" cy="'+y+'" r="4" fill="#cc876e"/>';
      if(before)particles+='<circle cx="'+(x+18*Math.cos(i*2+t*.2))+'" cy="'+(y+14*Math.sin(i*2+t*.2))+'" r="3" fill="#58b9cd"/>';
      else particles+='<ellipse cx="'+x+'" cy="'+y+'" rx="12" ry="8" fill="none" stroke="#9db7b1" stroke-width="1"/><circle cx="'+(x+12*Math.cos(t*.4+i))+'" cy="'+(y+8*Math.sin(t*.4+i))+'" r="2.5" fill="#58b9cd"/>';
    }
    const route=before?[[38,137],[97,94],[157,158],[212,92],[310,145]]:[[38,137],[310,137]];
    const step=(t*(before?.28:.16))%(route.length-1),segment=Math.floor(step),fraction=step-segment;
    const p0=route[segment],p1=route[segment+1];
    const photon=bbPhoton(bbMix(p0[0],p1[0],fraction),bbMix(p0[1],p1[1],fraction),'#f1cd6f');
    const currentPeriod=20*Math.sqrt(scale),wavePhase=t*1.2;
    scene.innerHTML=bbSvg('Fra varmt plasma til fritt lys og dagens mikrobølgestråling. Det virkelige Planck-kartet viser temperaturforskjeller over hele himmelen.',
      '<text x="24" y="25" class="bb-title">'+(before?'Før nøytrale atomer':'Etter at universet ble gjennomsiktig')+'</text>'+
      '<rect x="22" y="43" width="322" height="159" rx="9" fill="#102b38"/>'+particles+
      '<path d="'+route.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ')+'" fill="none" stroke="#e4c672" stroke-opacity=".35" stroke-width="1.5" stroke-dasharray="4 5"/>'+photon+
      '<text x="183" y="226" text-anchor="middle" class="bb-small">'+(before?'Frie elektroner sprer lyset igjen og igjen.':'Da elektroner ble bundet, kunne lyset reise langt.')+'</text>'+
      '<text x="548" y="57" text-anchor="middle" class="bb-title">Målt over hele himmelen i dag</text>'+
      '<image href="'+cmbMapSource.image.replace(/&/g,'&amp;')+'" x="385" y="73" width="342" height="153" preserveAspectRatio="xMidYMid meet"><title>Plancks målte kart over den kosmiske bakgrunnsstrålingen. ESA og Planck-samarbeidet.</title></image>'+
      '<text x="549" y="243" text-anchor="middle" class="bb-small">Rødt: litt varmere · blått: litt kaldere</text>'+
      '<path d="M357 127h15m-5-5 5 5-5 5" fill="none" stroke="#6d8d80" stroke-width="2"/>'+
      '<text x="24" y="276" class="bb-small">Da lyset slapp fri · omtrent 3000 K</text>'+
      '<text x="410" y="276" class="bb-small">'+(before?'Senere, når rommet utvider seg':'Etter '+bbFmt(scale)+' × utvidelse')+'</text>'+
      '<rect x="22" y="287" width="316" height="58" rx="7" fill="#e2ebe6"/><rect x="394" y="287" width="333" height="58" rx="7" fill="#e2ebe6"/>'+
      '<path d="'+bbWave(34,326,315,20,wavePhase,9)+'" fill="none" stroke="#a1799d" stroke-width="2.5"/>'+
      '<path d="'+bbWave(406,715,315,currentPeriod,wavePhase,9)+'" fill="none" stroke="#308a9d" stroke-width="2.5"/>'+
      '<text x="180" y="368" text-anchor="middle" class="bb-small">Kortere bølgelengde · rundt 1 µm</text>'+
      '<text x="560" y="368" text-anchor="middle" class="bb-small">'+(scale>=1000?'Mikrobølger · rundt 1,1 mm':'Bølgelengden blir lengre')+'</text>',390);
  };
  const update=()=>{
    before=+input.value===0;progress=before?0:(+input.value-1)/999;
    const s=state(),current=+input.value;
    presets.forEach(button=>button.setAttribute('aria-pressed',String(+button.dataset.bbCmb===current)));
    find('bb-cmb-readout').innerHTML=before?
      bbRow('Tidlig univers','Varmt plasma før omtrent 380 000 år')+bbRow('Hvorfor er det ugjennomsiktig?','Lyset spres av frie elektroner'):
      bbRow('Strålingstemperatur',bbFmt(s.temperature,s.temperature<10?3:0)+' K')+
      bbRow('Utvidelse siden lyset slapp fri',bbFmt(s.scale)+' ×')+
      bbRow('Hva skjer med lyset?',progress>.98?'Bølgelengdene er blitt mikrobølgelange.':'Rommet strekker bølgene. Strålingen kjøles.')+
      (progress>.98?bbRow('Hvorfor er dette et spor?','Gammelt lys finnes fortsatt, slik et varmt tidlig univers forutsier.'):'');
    api.repaint(scene);
  };
  const usePreset=event=>{input.value=event.currentTarget.dataset.bbCmb;update();};
  input.addEventListener('input',update);presets.forEach(button=>button.addEventListener('click',usePreset));
  const remove=api.onFrame(draw,scene);update();
  return ()=>{disposed=true;remove?.();input.removeEventListener('input',update);presets.forEach(button=>button.removeEventListener('click',usePreset));};
}
function mountAbundance(root,api){
  const find=id=>root.querySelector('#'+id),scene=find('bb-abundance-scene'),input=find('bb-nuclei-progress'),massButton=find('bb-by-mass'),countButton=find('bb-by-count');
  if(!scene)return ()=>{};
  let progress=1,mode='mass',disposed=false;
  const draw=t=>{
    if(disposed)return;
    const fusion=bbClamp((progress-.2)/.55),done=fusion>.98;
    let particles='',remaining=0;
    const heMembers=[0,1,14,15],heOffsets=[[-7,-7],[7,7],[7,-7],[-7,7]];
    for(let i=0;i<16;i++){
      const start=[66+(i%8)*88,92+Math.floor(i/8)*60],member=heMembers.indexOf(i);
      const destination=member>=0?[611+heOffsets[member][0],124+heOffsets[member][1]]:[58+(remaining%6)*72,94+Math.floor(remaining/6)*59];
      if(member<0)remaining++;
      const drift=member>=0?1-fusion:1;
      const x=bbMix(start[0],destination[0],fusion)+3*Math.sin(t*.45+i*2.4)*drift;
      const y=bbMix(start[1],destination[1],fusion)+3*Math.cos(t*.39+i)*drift;
      particles+='<circle cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="10" fill="'+(i>=14?'#d1ad61':'#3a94a6')+'" stroke="#ffffff" stroke-width="1.4"/>'+
        '<text x="'+x.toFixed(2)+'" y="'+(y+4).toFixed(2)+'" text-anchor="middle" style="font-size:11px;fill:#fff">'+(i>=14?'n':'+')+'</text>';
    }
    const a=bigBangEvidencePhysics.abundance(mode),heFraction=a.helium;
    const stage=progress<.2?'Varmt: frie protoner og nøytroner':progress<.75?'Avkjøling: lette kjerner bygges':'Kaldere og tynnere: kjernedannelsen stopper';
    scene.innerHTML=bbSvg('Lette kjerner dannes under avkjølingen. En forenklet gruppe med 14 protoner og 2 nøytroner gir 12 hydrogenkjerner og én heliumkjerne.',
      '<text x="24" y="26" class="bb-title">'+stage+'</text>'+
      '<rect x="22" y="43" width="716" height="145" rx="9" fill="#e2ebe6"/>'+
      (done?'<circle cx="611" cy="124" r="23" fill="none" stroke="#a98d4f" stroke-width="1.5"/>':'')+particles+
      '<text x="228" y="212" text-anchor="middle" class="bb-small">'+(done?'12 hydrogenkjerner · ett proton i hver':'Mange flere protoner enn nøytroner')+'</text>'+
      '<text x="611" y="212" text-anchor="middle" class="bb-small">'+(done?'1 heliumkjerne · 2 p + 2 n':'Nøytronene kan bindes i helium')+'</text>'+
      '<text x="24" y="248" class="bb-title">Sluttfordelingen '+(mode==='mass'?'etter masse':'etter antall kjerner')+'</text>'+
      '<rect x="28" y="265" width="'+(704*a.hydrogen)+'" height="32" rx="2" fill="#3a94a6"/><rect x="'+(28+704*a.hydrogen)+'" y="265" width="'+(704*heFraction)+'" height="32" rx="2" fill="#d1ad61"/>'+
      '<text x="'+(28+704*a.hydrogen/2)+'" y="286" text-anchor="middle" style="font-weight:650;fill:#fff">Hydrogen '+bbFmt(a.hydrogen*100,mode==='mass'?0:1)+' %</text>'+
      '<text x="732" y="321" text-anchor="end" class="bb-small">Helium '+bbFmt(heFraction*100,mode==='mass'?0:1)+' %</text>'+
      '<path d="M'+(28+704*a.hydrogen+704*heFraction/2)+' 298v8h'+(704*heFraction/2)+'" fill="none" stroke="#a98d4f"/>'+
      '<text x="28" y="350" class="bb-small">En heliumkjerne er omtrent fire ganger så tung som en hydrogenkjerne.</text>'+
      '<text x="28" y="376" class="bb-small">Tyngre grunnstoffer kommer i hovedsak senere, fra stjerner og stjerneprosesser.</text>',394);
  };
  const update=()=>{
    progress=+input.value/100;massButton.setAttribute('aria-pressed',String(mode==='mass'));countButton.setAttribute('aria-pressed',String(mode==='count'));
    const phase=progress<.2?'Før kjernedannelsen':progress<.75?'I løpet av de første minuttene':'Etter de første minuttene';
    find('bb-abundance-readout').innerHTML=bbRow('Stopp i utviklingen',phase)+
      bbRow('Hvorfor blir det mye hydrogen?','Det er langt flere protoner enn nøytroner. Mange protoner blir igjen som hydrogenkjerner.')+
      bbRow('Hvorfor blir det mye helium?','Nesten alle nøytronene bindes i stabile helium-4-kjerner.')+
      bbRow(mode==='mass'?'Av massen i de opprinnelige atomkjernene':'Fordeling etter antall kjerner',mode==='mass'?'Omtrent 75 % H og 25 % He':'Omtrent 92 % H og 8 % He');
    api.repaint(scene);
  };
  const mass=()=>{mode='mass';update();},count=()=>{mode='count';update();};
  input.addEventListener('input',update);massButton.addEventListener('click',mass);countButton.addEventListener('click',count);
  const remove=api.onFrame(draw,scene);update();
  return ()=>{disposed=true;remove?.();input.removeEventListener('input',update);massButton.removeEventListener('click',mass);countButton.removeEventListener('click',count);};
}
export function mountBigBangEvidence(root,api){
  const cleanups=[mountRedshift(root,api),mountCmb(root,api),mountAbundance(root,api)];
  return ()=>cleanups.forEach(cleanup=>cleanup?.());
}
