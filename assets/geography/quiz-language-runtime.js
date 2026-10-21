/* Presentation translations leave canonical game answers and storage keys intact. */
(() => {
 'use strict';
 const data=window.GEO_QUIZ_EN, key='onlyfag-geo-language';
 let language='no';try{language=localStorage.getItem(key)==='en'?'en':'no';}catch(_){}
 const overview=document.querySelector('body:not([data-quiz]) #verden-quiz');
 const isGame=!!document.body.dataset.quiz||!!document.querySelector('#states[data-state-map],#map #states,#start')&&location.pathname.endsWith('/statle.html')||new URLSearchParams(location.search).has('quiz');
 if(!overview&&!isGame)return;
 const roots=overview?[overview]:[document.body];
 const originals=new WeakMap(),attributes=new WeakMap();
 const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const canonical=new Map(Object.entries(data.names).map(([no,en])=>[normalize(en),no]));
 const escape=s=>s.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
 const nameEntries=Object.entries(data.names).filter(([no,en])=>no!==en).sort((a,b)=>b[0].length-a[0].length);
 const namePattern=new RegExp('(^|[^\\p{L}\\p{N}])('+nameEntries.map(([n])=>escape(n)).join('|')+')(?=$|[^\\p{L}\\p{N}])','gu');
 const patterns=[];
 function pattern(no,en){const parts=no.split(/(\{\d+\})/);const ids=[];const source=parts.map(p=>/^\{\d+\}$/.test(p)?(ids.push(p.slice(1,-1)), '(.*?)'):escape(p)).join('');patterns.push([new RegExp('^'+source+'$','s'),en,ids,no.replace(/\{\d+\}/g,'').length]);}
 [
 ['Hva heter hovedstaden i {0}?','What is the capital of {0}?'],['Hvilket land har {0} som hovedstad?','Which country has {0} as its capital?'],
 ['Hvilket flagg tilhører {0}?','Which flag belongs to {0}?'],['Hvilket flagg hører til landet med hovedstaden {0}?','Which flag belongs to the country whose capital is {0}?'],
 ['Hvor ligger / hva kjennetegner {0}?','Where is {0}, or what is it known for?'],
 ['Flagget til {0}','Flag of {0}'],['Riktig: {0}','Correct: {0}'],['Riktig! {0}','Correct! {0}'],['Riktig. Flagget tilhører {0}.','Correct. The flag belongs to {0}.'],
 ['Feil. Riktig svar: {0}. Flagget tilhører {1}.','Wrong. Correct answer: {0}. The flag belongs to {1}.'],['Feil. Riktig svar: {0}','Wrong. Correct answer: {0}'],['Feil. Riktig sted er {0}.','Wrong. The correct place is {0}.'],
 ['{0} er allerede tatt.','{0} has already been found.'],['{0} er ikke et land i dette området.','{0} is not a country in this region.'],
 ['{0} kategorier valgt','{0} categories selected'],['{0} kategori valgt','{0} category selected'],['{0} spørsmål','{0} questions'],['{0} poeng','{0} points'],
 ['Poeng: {0}','Points: {0}'],['Tidsbonus: {0}','Time bonus: {0}'],['Mulig tidsbonus: {0}','Available time bonus: {0}'],['Riktige på rad: {0}','Correct in a row: {0}'],['Tid: {0}','Time: {0}'],['Spørsmål {0}','Question {0}'],
 ['{0} km unna · {1} geografi + {2} tidsbonus = {3} p','{0} km away · {1} distance + {2} time bonus = {3} pts'],
 ['{0} / {1} poeng','{0} / {1} points'],['{0} gjettning','{0} guess'],['{0} gjetning','{0} guess'],['{0} gjetninger','{0} guesses'],['{0} forsøk','{0} attempts'],['Nærmest: {0}','Closest: {0}'],['Ca. {0} km fra målet.','About {0} km from the target.'],
 ['Fasit: {0}','Answer: {0}'],['Riktig svar: {0}','Correct answer: {0}'],['Målet var {0}.','The target was {0}.'],['Landet var {0}.','The country was {0}.'],['Du fant {0}','You found {0}'],
 ['Hvor ligger {0}?','Where is {0}?'],['Finn {0}.','Find {0}.'],['Det var {0}. Finn {1}.','That was {0}. Find {1}.'],['Her ligger {0}. Vi går videre.','Here is {0}. Moving on.'],['{0} er allerede fullført.','{0} has already been completed.'],['{0} – fullført','{0} – completed'],['{0} feil','{0} mistakes'],
 ['Lag {0}','Team {0}'],['{0} får poengene','{0} gets the points'],['{0} land','{0} countries'],['{0} riktige','{0} correct'],
 ['Areal over {0} km²','Area over {0} km²'],['Areal under {0} km²','Area under {0} km²'],['Areal {0} km²','Area {0} km²'],['Minst {0} landegrenser','At least {0} land borders'],['Akkurat {0} landegrense','Exactly {0} land border'],['Akkurat {0} landegrenser','Exactly {0} land borders'],
 ['Hovedstad nord for {0}','Capital north of {0}'],['Hovedstad sør for {0}','Capital south of {0}'],['Hovedstad øst for {0}','Capital east of {0}'],['Hovedstad vest for {0}','Capital west of {0}'],['Hovedstad innen {0} fra ekvator','Capital within {0} of the equator'],
 ['Landet starter på {0}','Country starts with {0}'],['Hovedstad starter på {0}','Capital starts with {0}'],['Landnavnet har minst {0} bokstaver','Country name has at least {0} letters'],['Landnavnet har maks {0} bokstaver','Country name has at most {0} letters'],['Hovedstaden har minst {0} bokstaver','Capital has at least {0} letters'],
 ['{0} er offisielt språk','{0} is an official language'],['{0} (hovedstad)','{0} (capital)'],['{0} (regjeringssete)','{0} (seat of government)'],
 ['{0} (administrativ)','{0} (administrative)'],['{0} (konstitusjonell)','{0} (constitutional)'],['{0} (kommersiell)','{0} (commercial)'],['{0} (lovgivende)','{0} (legislative)'],['{0} (judisiell)','{0} (judicial)']
 ,['Løst {0}','Solved {0}'],['Runde {0}','Round {0}'],['Tid {0}','Time {0}'],['Vis hint {0} av {1}','Show hint {0} of {1}'],['Lagnavn {0}','Team name {0}'],['Du har valgt {0}. Velg minst 3 og maks 5 kategorier.','You selected {0}. Choose 3–5 categories.'],['Poeng {0}','Points {0}'],['{0} hint','{0} hints'],['Hint · {0} igjen','Hint · {0} remaining'],['{0} er allerede brukt.','{0} has already been used.'],['Gjetninger {0} / {1}','Guesses {0} / {1}'],['Korteste: {0} land','Shortest: {0} countries'],['Øvrige varer: {0} %','Other products: {0}%'],['Største grupper: {0} %','Main groups: {0}%'],['{0} varegrupper · {1}','{0} product groups · {1}'],['Riktig! {0} på {1} forsøk.','Correct! {0} in {1} attempts.'],['Riktig! {0} · {1}','Correct! {0} · {1}'],['Ikke riktig · omtrent {0} fra målet.','Not correct · about {0} from the target.'],['Perfekt! {0} gjetninger.','Perfect! {0} guesses.'],['Rute funnet! {0} gjetninger.','Route found! {0} guesses.'],['Perfekt! {0} gjetning.','Perfect! {0} guess.'],['Rute funnet! {0} gjetning.','Route found! {0} guess.'],['Din rute: {0}','Your route: {0}'],['En korteste rute: {0}','A shortest route: {0}'],['{0} · +{1} poeng · {2}.','{0} · +{1} points · {2}.'],['Avsluttet · {0} poeng','Finished · {0} points'],['Full grid · {0} poeng','Full grid · {0} points'],['Fullføringsbonus +100 · {0} feil · {1} hint brukt.','Completion bonus +100 · {0} mistakes · {1} hints used.']
 ,['Riktig – landet er {0}!','Correct – the country is {0}!'],['Ingen forsøk igjen. Riktig land var {0}.','No attempts left. The country was {0}.'],['Riktig land er {0}.','The country is {0}.'],['Høyeste fjell: {0}','Highest mountain: {0}'],['Største innsjø: {0}','Largest lake: {0}'],['Innbyggertall: {0}','Population: {0}'],['Hint {0}:','Hint {0}:'],['Score: {0}','Score: {0}'],['Du klarte {0} på rad.','You got {0} in a row.'],['Resultat: {0} riktige og {1} feil.','Result: {0} correct and {1} mistakes.'],['Hint brukt totalt: {0}','Total hints used: {0}'],['{0} på rad','{0} in a row'],['🏆 Topp 5 ({0})','🏆 Top 5 ({0})'],['🏆 Topp 5 · {0}','🏆 Top 5 · {0}'],['Topp 5 ({0})','Top 5 ({0})'],['{0} av {1} land','{0} of {1} countries'],['Hint: {0}','Hints: {0}'],['{0} – Geografi – Onlyfag','{0} – Geography – OnlyFag'],['Alle 50 fullført · {0} · {1} feil · {2} hoppet over. Grønn: {3}, gul: {4}, oransje: {5}, rød: {6}.','All 50 completed · {0} · {1} mistakes · {2} skipped. Green: {3}, yellow: {4}, orange: {5}, red: {6}.']
 ,['{0} km unna','{0} km away'],['· {0} geografi + {1} tidsbonus =','· {0} distance + {1} time bonus ='],['{0} kategorier · {1} lag','{0} categories · {1} teams'],['Du har valgt {0}. Velg mellom 3 og 5 kategorier.','You selected {0}. Choose 3–5 categories.']
 ,['Du klarte alle {0} hovedstedene {1} uten å bomme.','You got all {0} capitals {1} without a mistake.'],['Du klarte alle {0} flaggene {1} uten å bomme.','You got all {0} flags {1} without a mistake.'],['Du klarte alle {0} landene {1} i flagg–hovedstad-runden uten å bomme.','You got all {0} countries {1} in the flags-and-capitals round without a mistake.'],['Du klarte alle {0} stedene uten å bomme.','You got all {0} places without a mistake.'],['Alle {0}!','All {0}!']
 ,['Alle {0} fullført · {1} · {2} feil · {3} hoppet over. Grønn: {4}, gul: {5}, oransje: {6}, rød: {7}.','All {0} completed · {1} · {2} mistakes · {3} skipped. Green: {4}, yellow: {5}, orange: {6}, red: {7}.'],['Klikkbart kart over {0}','Interactive map of {0}']
 ].forEach(([no,en])=>pattern(no,en));
 patterns.sort((a,b)=>b[3]-a[3]);
 function translate(raw,depth=0){
  if(language!=='en'||typeof raw!=='string'||depth>5)return raw;
  const text=raw.trim().replace(/\s+/g,' '),padding=raw.match(/^\s*/)[0],suffix=raw.match(/\s*$/)[0];let result;
  const award=text.match(/^(Gi|Trekk) (\d+) poeng (?:til|fra) (.+)$/);if(award)return (award[1]==='Gi'?'Award ':'Deduct ')+award[2]+(award[1]==='Gi'?' points to ':' points from ')+award[3];
  if(Object.hasOwn(data.texts,text))result=data.texts[text];
  else if(Object.hasOwn(data.names,text))result=data.names[text];
  else{
   for(const [regex,en,ids]of patterns){const match=text.match(regex);if(match){result=en.replace(/\{(\d+)\}/g,(_,id)=>translate(match[ids.indexOf(id)+1],depth+1));break;}}
   if(result===undefined)result=text.replace(namePattern,(_,before,name)=>before+data.names[name]);
  }
  return padding+result.replace(/° Ø/g,'° E').replace(/° V/g,'° W')+suffix;
 }
 const excluded='script,style,textarea,input,code,pre,[data-no-translate],.hs-mini-row strong,.hs-mini-row b,.hs-table tbody td:nth-child(2) strong,.score-card strong,.score-team-name strong';
 function textNode(node){if(!node.parentElement||node.parentElement.closest(excluded)||!node.data.trim())return;let saved=originals.get(node);if(!saved||node.data!==saved.output)saved={source:node.data};saved.output=translate(saved.source);originals.set(node,saved);if(node.data!==saved.output)node.data=saved.output;}
 const attrs=['title','placeholder','aria-label','alt'];
 function element(el){if(el.tagName==='OPTION'&&el.parentElement?.tagName==='DATALIST'){let saved=attributes.get(el)||{};const current=el.getAttribute('value');if(current!==null){if(!saved.value||current!==saved.value.output)saved.value={source:current};saved.value.output=translate(saved.value.source);if(current!==saved.value.output)el.setAttribute('value',saved.value.output);attributes.set(el,saved);}}if((el.matches(excluded)&&!el.matches('input,textarea'))||el.closest('[data-no-translate]'))return;let saved=attributes.get(el)||{};for(const attr of attrs){const current=el.getAttribute(attr);if(current===null)continue;if(!saved[attr]||current!==saved[attr].output)saved[attr]={source:current};const output=translate(saved[attr].source);saved[attr].output=output;if(current!==output)el.setAttribute(attr,output);}attributes.set(el,saved);}
 function walk(root){if(root.nodeType===3)return textNode(root);if(root.nodeType!==1||root.matches('script,style'))return;element(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode())n.nodeType===3?textNode(n):element(n);}
 let queued=false;const pending=new Set();
 const observer=new MutationObserver(records=>{for(const r of records){if(r.type==='childList')r.addedNodes.forEach(n=>pending.add(n));else pending.add(r.target);}if(!queued){queued=true;queueMicrotask(()=>{queued=false;observer.disconnect();for(const node of pending)if(node.isConnected)walk(node);pending.clear();observe();});}});
 function observe(){roots.forEach(root=>observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:attrs}));}
 function apply(){observer.disconnect();roots.forEach(root=>{root.setAttribute('lang',language==='en'?'en':'nb');walk(root)});if(isGame){document.documentElement.lang=language==='en'?'en':'nb';document.title=translate(document.title);}observe();document.querySelectorAll('button[data-quiz-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.quizLanguage===language)));}
 // Alias lookup supports English answers without rewriting the game's identifiers.
 function installEngines(){
  if(language==='en'&&document.body.dataset.quiz==='jeopardy')document.querySelectorAll('.team-name').forEach((input,i)=>{if(input.value==='Lag '+(i+1))input.value=translate(input.value);});
  if(typeof normalizeAnswer==='function'){const original=normalizeAnswer;window.normalizeAnswer=function(value){return original(canonical.get(normalize(value))||value);};}
  if(typeof tradleNormName==='function'){const original=tradleNormName;window.tradleNormName=function(value){return original(canonical.get(normalize(value))||value);};}
  if(typeof countryDisplayName==='function'){const original=countryDisplayName;window.countryDisplayName=function(feature){return language==='en'?translate(original(feature)):original(feature);};}
  if(typeof geoCriterionPool==='function'){const original=geoCriterionPool;window.geoCriterionPool=function(){return original().map(criterion=>{
   const c={...criterion},name=m=>data.names[m.country]||m.country,capital=m=>data.names[m.capital]||m.capital||'';
   if(language==='en'){
    if(/^name[A-Z]$/.test(c.id))c.test=m=>name(m).startsWith(c.id.slice(-1));
    else if(/^cap[A-Z]$/.test(c.id))c.test=m=>capital(m).startsWith(c.id.slice(-1));
    else if(c.id==='longname')c.test=m=>name(m).replace(/[^\p{L}]/gu,'').length>=10;
    else if(c.id==='shortname')c.test=m=>name(m).replace(/[^\p{L}]/gu,'').length<=6;
    else if(c.id==='longcap')c.test=m=>capital(m).replace(/[^\p{L}]/gu,'').length>=9;
    else if(c.id==='sameinitial')c.test=m=>!!capital(m)&&normalize(name(m))[0]===normalize(capital(m))[0];
   }return c;
  });};}
  if(typeof makeOptions==='function'){const original=makeOptions;window.makeOptions=function(correct,all,answer,count){if(language!=='en')return original(correct,all,answer,count);const seen=new Set([translate(String(answer(correct)))]),unique=[correct];for(const option of all){const label=translate(String(answer(option)));if(!seen.has(label)){seen.add(label);unique.push(option);}}return original(correct,unique,answer,count);};}
  if(typeof makePlaceQuestions==='function'){const original=makePlaceQuestions;window.makePlaceQuestions=function(cat,heading){const questions=original(cat,heading);if(language!=='en')return questions;const rows=getPlaceRowsByHeading(heading),clean=s=>String(s).trim().replace(/[.!]$/,'');return questions.map(q=>{const row=rows.find(r=>r.place===q.a||clean(r.explanation)===clean(q.a));if(!row)return q;const name=translate(row.place),description=translate(row.explanation);return {...q,q:row.place===q.a?'Which place matches this description? '+description:'Where is '+name+', or what is it known for?',a:row.place===q.a?name:description};});};}
  if(typeof makeJeopardyQuestions==='function'){const original=makeJeopardyQuestions;window.makeJeopardyQuestions=function(category){if(language==='en'&&data.academic[category.id])return geoJeopardyDifficulty.tieredPick(data.academic[category.id]).map(q=>({...q,q:translate(q.q),a:translate(q.a)}));return original(category);};}
  if(typeof newGeoGrid==='function'&&language==='en'&&typeof state!=='undefined'&&state.geogrid?.board)newGeoGrid();
 }
 if(overview){
  const heading=overview.querySelector('h2'),toolbar=document.createElement('div');toolbar.className='geoquiz-heading';heading.before(toolbar);toolbar.append(heading);
  const flags=document.createElement('div');flags.className='geoquiz-language';flags.setAttribute('aria-label','Language / Språk');
  const svg={en:'<svg viewBox="0 0 60 30" aria-hidden="true"><clipPath id="ukClip"><path d="M0 0h60v30H0z"/></clipPath><g clip-path="url(#ukClip)"><path fill="#18346d" d="M0 0h60v30H0z"/><path stroke="#fff" stroke-width="6" d="m0 0 60 30M60 0 0 30"/><path stroke="#c82135" stroke-width="2" d="m0 0 60 30M60 0 0 30"/><path stroke="#fff" stroke-width="10" d="M30 0v30M0 15h60"/><path stroke="#c82135" stroke-width="6" d="M30 0v30M0 15h60"/></g></svg>',no:'<svg viewBox="0 0 22 16" aria-hidden="true"><path fill="#ba1535" d="M0 0h22v16H0z"/><path fill="#fff" d="M6 0h4v16H6zM0 6h22v4H0z"/><path fill="#16386b" d="M7 0h2v16H7zM0 7h22v2H0z"/></svg>'};
  for(const locale of ['en','no']){const button=document.createElement('button');button.type='button';button.dataset.quizLanguage=locale;button.setAttribute('aria-label',locale==='en'?'English':'Norsk');button.title=locale==='en'?'English':'Norsk';button.innerHTML=svg[locale];button.onclick=()=>{language=locale;try{localStorage.setItem(key,locale);}catch(_){}apply();};flags.append(button);}toolbar.append(flags);
 }
 for(const method of ['alert','confirm','prompt']){const original=window[method];window[method]=function(message,...args){return original.call(window,translate(message),...args);};}
 window.QuizLanguage={get language(){return language},translate,name:value=>data.names[value]||value};
 installEngines();apply();
})();
