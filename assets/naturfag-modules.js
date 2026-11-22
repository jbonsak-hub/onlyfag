/* Shared Naturfag navigation. Chemistry keeps its original exercise engine. */
(function(){
 'use strict';
 const topicEntries=[['carbs','Karbohydrater'],['protein','Proteiner'],['fat','Fett'],['micro','Vitaminer, mineraler og vann'],['digestion','Fordøyelsen'],['energy','Energi og blodsukker'],['all','Blandet øving'],['flashcards','Begreper flashcards']];
 const validTopics=new Set([...topicEntries.map(([key])=>key),'review']);
 const waveEntries=[['bolger','Bølger og svingninger'],['fenomener','Bølgefenomener'],['em','Det elektromagnetiske spekteret']];
 const waveViews=[['fagstoff','Fagstoff'],['oppgaver','Oppgavebank'],['begreper','Begreper']];
 const validWaveTopics=new Set(waveEntries.map(([key])=>key)),validWaveViews=new Set(waveViews.map(([key])=>key));
 const $=selector=>document.querySelector(selector);
 const sidebar=$('#sidebar'),scroll=sidebar?.querySelector('.sidebar-scroll'),main=$('main.main'),content=main?.querySelector(':scope > .content');
 if(!scroll||!main||!content||typeof openPage!=='function')return;
 const originalOpenPage=openPage;
 const chemistryPages=new Set([...document.querySelectorAll('.page[id]')].map(page=>page.id.slice(5)));
 const chemistryGroup=document.createElement('details');chemistryGroup.id='nf-chemistry-group';chemistryGroup.className='nf-module-group';chemistryGroup.open=true;
 chemistryGroup.innerHTML='<summary class="nf-module-heading">Kjemi</summary><div class="nf-module-submenu"></div>';
 while(scroll.firstChild)chemistryGroup.lastElementChild.appendChild(scroll.firstChild);
 const nutritionGroup=document.createElement('details');nutritionGroup.id='nf-nutrition-group';nutritionGroup.className='nf-module-group';
 nutritionGroup.innerHTML='<summary class="nf-module-heading">Næringsstoffer og fordøyelsen</summary><div class="nf-module-submenu">'+topicEntries.map(([topic,label])=>'<button class="nf-nutrition-topic" type="button" data-nutrition-topic="'+topic+'" aria-pressed="false"><span>'+label+'</span>'+(topic==='flashcards'?'':'<span class="nf-topic-score" data-topic-score="'+topic+'" aria-label="Ingen besvarte oppgaver ennå">—</span>')+'</button>').join('')+'<div class="nf-module-secondary"><button class="nf-nutrition-action" type="button" data-nutrition-view="bank">Oppgavebank</button><button class="nf-nutrition-action" type="button" data-nutrition-view="concepts">Begreper</button></div></div>';
 const wavesGroup=document.createElement('details');wavesGroup.id='nf-waves-group';wavesGroup.className='nf-module-group';
 wavesGroup.innerHTML='<summary class="nf-module-heading">Bølger og stråling</summary><div class="nf-module-submenu">'+waveEntries.map(([topic,label])=>'<div class="nf-waves-topic-group"><button class="nf-waves-topic" type="button" data-waves-toggle="'+topic+'" aria-expanded="false" aria-controls="nf-waves-views-'+topic+'">'+label+'</button><div class="nf-waves-views" id="nf-waves-views-'+topic+'" hidden>'+waveViews.map(([view,title])=>'<button class="nf-waves-view" type="button" data-waves-topic="'+topic+'" data-waves-view="'+view+'" aria-pressed="false">'+title+'</button>').join('')+'</div></div>').join('')+'</div>';
 scroll.append(chemistryGroup,nutritionGroup,wavesGroup);
 const moduleIcons={
  chemistry:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.75 3h10.5A2 2 0 0 0 19 18l-5-9V3"/><path d="M8 14h8l3 4a2 2 0 0 1-1.75 3H6.75A2 2 0 0 1 5 18Z" fill="currentColor" fill-opacity=".14" stroke="none"/><path d="M8 14h8"/><circle cx="10" cy="17" r=".8" fill="currentColor" stroke="none"/><circle cx="14" cy="18.5" r=".8" fill="currentColor" stroke="none"/>',
  nutrition:'<path d="M20 4C11 3 4 7 4 14a6 6 0 0 0 6 6c7 0 11-7 10-16Z" fill="currentColor" fill-opacity=".12"/><path d="M3 22c1-5 5-10 12-13M8 14l-1-5M11 11l5 1"/>',
  waves:'<path d="M2 12c2.5-9 5-9 7.5 0s5 9 7.5 0 3.75-6 5-3"/><path d="M2 19h20" opacity=".32"/>'
 };
 for(const [group,key] of [[chemistryGroup,'chemistry'],[nutritionGroup,'nutrition'],[wavesGroup,'waves']]){
  const summary=group.querySelector('summary'),label=document.createElement('span');label.className='nf-module-label';label.textContent=summary.textContent;
  summary.innerHTML='<svg class="nf-module-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+moduleIcons[key]+'</svg>';summary.append(label);
 }
 const subjectsHome=document.createElement('a');subjectsHome.id='nfSubjectsHome';subjectsHome.href='#subjects';subjectsHome.textContent='Naturfag';subjectsHome.setAttribute('aria-label','Velg hovedtema i naturfag');
 sidebar.querySelector('.nf-sidebar-title-row h1')?.replaceChildren(subjectsHome);
 sidebar.setAttribute('aria-label','Temaer i naturfag');
 for(const summary of [chemistryGroup.querySelector('summary'),nutritionGroup.querySelector('summary'),wavesGroup.querySelector('summary')]){summary.title=summary.textContent;summary.setAttribute('aria-label',summary.textContent);}
 nutritionGroup.querySelectorAll('.nf-nutrition-topic,.nf-nutrition-action').forEach(button=>{const label=button.querySelector('span')?.textContent||button.textContent;button.title=label;button.setAttribute('aria-label',label);});
 const subtitle=sidebar.querySelector('.nf-sidebar-sub');if(subtitle)subtitle.remove();
 const info=$('#infoPop');if(info)info.innerHTML='<p>Fagstoff og oppgaver i kjemi, næringsstoffer og fordøyelse, bølger og stråling. Prosentene viser riktig på de siste 20 besvarte oppgavene per tema. Fremgangen lagres i nettleseren.</p>';
 const subjectsPage=document.createElement('section');subjectsPage.id='page-subjects';subjectsPage.className='page';subjectsPage.setAttribute('aria-label','Velg hovedtema');
 subjectsPage.innerHTML='<h1 class="nf-subjects-heading">Velg tema i naturfag</h1><div class="nf-subject-cards"><a class="nf-subject-card" data-subject="chemistry" href="#chemistry/home"><img src="assets/naturfag-chemistry.svg?v=20261101-4" alt="" width="640" height="360"><span class="nf-subject-card-label"><strong>Kjemi</strong><span aria-hidden="true">→</span></span></a><a class="nf-subject-card" data-subject="nutrition" href="#nutrition/all"><img src="assets/naturfag-nutrition.svg?v=20261101-4" alt="" width="640" height="360"><span class="nf-subject-card-label"><strong>Næringsstoffer og fordøyelsen</strong><span aria-hidden="true">→</span></span></a><a class="nf-subject-card" data-subject="waves" href="#waves/bolger/fagstoff"><img src="assets/naturfag-waves.svg?v=20261116-naturfag1" alt="" width="640" height="360"><span class="nf-subject-card-label"><strong>Bølger og stråling</strong><span aria-hidden="true">→</span></span></a></div>';
 content.prepend(subjectsPage);
 const page=document.createElement('section');page.id='page-nutrition';page.className='page';page.setAttribute('aria-label','Næringsstoffer og fordøyelsen');
 const frame=document.createElement('iframe');frame.id='nutrition-module-frame';frame.title='Næringsstoffer og fordøyelsen – oppgavetrening';frame.allow='fullscreen';page.append(frame);content.append(page);
 const wavesPage=document.createElement('section');wavesPage.id='page-waves';wavesPage.className='page';wavesPage.setAttribute('aria-label','Bølger og stråling');
 const wavesFrame=document.createElement('iframe');wavesFrame.id='waves-module-frame';wavesFrame.title='Bølger og stråling – fagstoff og oppgaver';wavesFrame.allow='fullscreen';wavesPage.append(wavesFrame);content.append(wavesPage);
 const mobileMenu=document.createElement('button');mobileMenu.id='nfModulesMenu';mobileMenu.type='button';mobileMenu.textContent='☰';mobileMenu.setAttribute('aria-label','Åpne temamenyen');mobileMenu.setAttribute('aria-controls','sidebar');mobileMenu.setAttribute('aria-expanded','false');document.body.append(mobileMenu);
 const backdrop=document.createElement('button');backdrop.id='nfModulesBackdrop';backdrop.type='button';backdrop.hidden=true;backdrop.tabIndex=-1;backdrop.setAttribute('aria-label','Lukk temamenyen');document.body.append(backdrop);
 const mobile=matchMedia('(max-width:860px)');
 let desired={topic:'all',view:'practice'},frameReady=false,frameStarted=false,reported=null,lastChemistry=$('.page.active')?.id.slice(5)||'home',routing=false;
 let wavesDesired={topic:'bolger',view:'fagstoff'},wavesReady=false,wavesStarted=false,wavesReported=null,wavesAwaitingState=false;
 function setGroup(group){chemistryGroup.open=group==='chemistry';nutritionGroup.open=group==='nutrition';wavesGroup.open=group==='waves';}
 function updateGroupState(){const nutrition=document.body.classList.contains('nf-nutrition-active'),waves=document.body.classList.contains('nf-waves-active'),subjects=document.body.classList.contains('nf-subjects-active');chemistryGroup.querySelector('summary').dataset.active=String(!subjects&&!nutrition&&!waves);nutritionGroup.querySelector('summary').dataset.active=String(!subjects&&nutrition);wavesGroup.querySelector('summary').dataset.active=String(!subjects&&waves);subjectsHome.setAttribute('aria-current',subjects?'page':'false');}
 function syncSidebarAccessibility(){const hidden=mobile.matches?!document.body.classList.contains('mobile-open'):document.body.classList.contains('side-collapsed');sidebar.inert=hidden;if(hidden)sidebar.setAttribute('aria-hidden','true');else sidebar.removeAttribute('aria-hidden');}
 function sendHostLayout(){const sidebarCollapsed=!mobile.matches&&document.body.classList.contains('side-collapsed');if(frameReady)frame.contentWindow.postMessage({type:'onlyfag:nutrition:host-layout',sidebarCollapsed},location.origin);if(wavesReady)wavesFrame.contentWindow.postMessage({type:'onlyfag:waves:host-layout',sidebarCollapsed},location.origin);}
 function sendTheme(){const dark=document.body.classList.contains('dark');if(frameReady)frame.contentWindow.postMessage({type:'onlyfag:nutrition:theme',dark},location.origin);if(wavesReady)wavesFrame.contentWindow.postMessage({type:'onlyfag:waves:theme',dark},location.origin);}
 function sendDesired(){if(frameReady)frame.contentWindow.postMessage({type:'onlyfag:nutrition:topic',topic:desired.topic,view:desired.view,focus:desired.topic==='flashcards'&&desired.view==='practice'&&document.body.classList.contains('nf-nutrition-active')},location.origin);}
 function ensureFrame(){
  if(frameStarted){sendDesired();return;}
  frameStarted=true;
  frame.src='naturfag/ernaering.html?embedded=1&topic='+encodeURIComponent(desired.topic)+'&view='+encodeURIComponent(desired.view)+'&v=20261122-canvas';
 }
 frame.addEventListener('load',()=>{if(!frameStarted)return;frameReady=true;sendTheme();sendHostLayout();sendDesired();});
 function waveAnchor(topic,view,section){return topic==='fenomener'&&view==='fagstoff'&&['interferens','to-spalter'].includes(section)?section:undefined;}
 function sendWavesDesired(){if(wavesReady){wavesAwaitingState=true;wavesFrame.contentWindow.postMessage({type:'onlyfag:waves:topic',...wavesDesired},location.origin);}}
 function sendWavesVisibility(){if(wavesReady)wavesFrame.contentWindow.postMessage({type:'onlyfag:waves:visibility',visible:document.body.classList.contains('nf-waves-active')&&!document.hidden},location.origin);}
 function ensureWavesFrame(){
  if(wavesStarted){sendWavesDesired();sendWavesVisibility();return;}
  wavesStarted=true;
  wavesFrame.src='naturfag/bolger-straling.html?embedded=1&topic='+encodeURIComponent(wavesDesired.topic)+'&view='+encodeURIComponent(wavesDesired.view)+(wavesDesired.section?'&section='+encodeURIComponent(wavesDesired.section):'')+'&v=20261122-nf-layout';
 }
 wavesFrame.addEventListener('load',()=>{if(!wavesStarted)return;wavesReady=true;sendTheme();sendHostLayout();sendWavesDesired();sendWavesVisibility();});
 document.addEventListener('visibilitychange',sendWavesVisibility);
 function closeMenu({focus=false}={}){
  const wasOpen=document.body.classList.contains('mobile-open');document.body.classList.remove('mobile-open');mobileMenu.setAttribute('aria-expanded','false');backdrop.hidden=true;main.inert=false;syncSidebarAccessibility();sidebar.removeAttribute('aria-modal');sidebar.removeAttribute('role');if(focus&&wasOpen&&mobile.matches)mobileMenu.focus();
 }
 function openMenu(){
  if(!mobile.matches)return;document.body.classList.add('mobile-open');mobileMenu.setAttribute('aria-expanded','true');syncSidebarAccessibility();main.inert=true;backdrop.hidden=false;sidebar.setAttribute('aria-modal','true');sidebar.setAttribute('role','dialog');(document.body.classList.contains('nf-subjects-active')?subjectsHome:(document.body.classList.contains('nf-waves-active')?wavesGroup:document.body.classList.contains('nf-nutrition-active')?nutritionGroup:chemistryGroup).querySelector('summary')).focus();
 }
 mobileMenu.addEventListener('click',()=>document.body.classList.contains('mobile-open')?closeMenu({focus:true}):openMenu());backdrop.addEventListener('click',()=>closeMenu({focus:true}));mobile.addEventListener('change',()=>{closeMenu();sendHostLayout();});
 document.addEventListener('keydown',event=>{
  if(!mobile.matches||!document.body.classList.contains('mobile-open'))return;
  if(event.key==='Escape'){event.preventDefault();closeMenu({focus:true});return;}
  if(event.key!=='Tab')return;
  const controls=[...sidebar.querySelectorAll('summary,button,a,input')].filter(el=>!el.disabled&&el.getClientRects().length);const first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 });
 function routeHash(topic=desired.topic,view=desired.view){return '#nutrition/'+topic+(view==='bank'?'/bank':view==='concepts'?'/concepts':'');}
 function writeRoute(hash,replace=false){if(routing||location.hash===hash)return;history[replace?'replaceState':'pushState'](null,'',hash);}
 function updateNutritionButtons(){
  nutritionGroup.querySelectorAll('[data-nutrition-topic]').forEach(button=>{const active=button.dataset.nutritionTopic===desired.topic&&desired.view==='practice';button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  for(const view of ['bank','concepts']){const button=nutritionGroup.querySelector('[data-nutrition-view="'+view+'"]');button.classList.toggle('active',desired.view===view);button.setAttribute('aria-pressed',String(desired.view===view));}
 }
 function wavesRouteHash(){return '#waves/'+wavesDesired.topic+'/'+wavesDesired.view+(wavesDesired.section?'/'+wavesDesired.section:'');}
 function updateWavesButtons(){
  wavesGroup.querySelectorAll('[data-waves-toggle]').forEach(button=>{const active=document.body.classList.contains('nf-waves-active')&&button.dataset.wavesToggle===wavesDesired.topic;button.classList.toggle('active',active);button.setAttribute('aria-expanded',String(active));document.getElementById(button.getAttribute('aria-controls')).hidden=!active;});
  wavesGroup.querySelectorAll('[data-waves-view]').forEach(button=>{const active=document.body.classList.contains('nf-waves-active')&&button.dataset.wavesTopic===wavesDesired.topic&&button.dataset.wavesView===wavesDesired.view;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
 }
 function showSubjects({route=true,replace=false}={}){
  document.body.classList.remove('nf-nutrition-active','nf-waves-active');document.body.classList.add('nf-subjects-active');sendWavesVisibility();updateWavesButtons();
  document.querySelectorAll('.page').forEach(item=>item.classList.toggle('active',item===subjectsPage));
  document.querySelectorAll('.nav-btn,.nf-nutrition-topic,.nf-nutrition-action').forEach(button=>{button.classList.remove('active');if(button.hasAttribute('aria-pressed'))button.setAttribute('aria-pressed','false');});
  chemistryGroup.open=false;nutritionGroup.open=false;wavesGroup.open=false;
  $('#floatingPt')?.classList.remove('show');$('#floatingPtBtn')?.classList.remove('active');$('#infoPop')?.classList.remove('show');$('#infoBtn')?.setAttribute('aria-expanded','false');
  updateGroupState();closeMenu();if(route)writeRoute('#subjects',replace);window.scrollTo({top:0,behavior:'instant'});
 }
 subjectsHome.addEventListener('click',event=>{event.preventDefault();showSubjects();});
 function showNutrition(topic='all',view='practice',{route=true,replace=false}={}){
  document.body.classList.remove('nf-subjects-active','nf-waves-active');sendWavesVisibility();updateWavesButtons();
  desired={topic:validTopics.has(topic)?topic:'all',view:view==='concepts'?'concepts':view==='bank'&&topic!=='flashcards'?'bank':'practice'};
  if(!document.body.classList.contains('nf-nutrition-active')){
   const prior=$('.page.active')?.id.slice(5);if(chemistryPages.has(prior))lastChemistry=prior;
   // Restore moved chemistry toolbars and stop running page-specific reference controls.
   const active=$('.page.active');if(active&&active.id==='page-elementnames')originalOpenPage('home');
  }
  document.body.classList.add('nf-nutrition-active');document.querySelectorAll('.page').forEach(item=>item.classList.toggle('active',item===page));document.querySelectorAll('.nav-btn').forEach(button=>button.classList.remove('active'));
  $('#floatingPt')?.classList.remove('show');$('#floatingPtBtn')?.classList.remove('active');$('#infoPop')?.classList.remove('show');$('#infoBtn')?.setAttribute('aria-expanded','false');
  setGroup('nutrition');updateGroupState();updateNutritionButtons();closeMenu();ensureFrame();if(route)writeRoute(routeHash(),replace);window.scrollTo({top:0,behavior:'instant'});
 }
 function showWaves(topic='bolger',view='fagstoff',{route=true,replace=false,section}={}){
  const anchor=waveAnchor(topic,view,section);
  wavesDesired={topic:validWaveTopics.has(topic)?topic:'bolger',view:validWaveViews.has(view)?view:'fagstoff',...(anchor&&{section:anchor})};
  const active=$('.page.active');if(active?.id==='page-elementnames')originalOpenPage('home');
  document.body.classList.remove('nf-nutrition-active','nf-subjects-active');document.body.classList.add('nf-waves-active');
  document.querySelectorAll('.page').forEach(item=>item.classList.toggle('active',item===wavesPage));document.querySelectorAll('.nav-btn,.nf-nutrition-topic,.nf-nutrition-action').forEach(button=>{button.classList.remove('active');if(button.hasAttribute('aria-pressed'))button.setAttribute('aria-pressed','false');});
  $('#floatingPt')?.classList.remove('show');$('#floatingPtBtn')?.classList.remove('active');$('#infoPop')?.classList.remove('show');$('#infoBtn')?.setAttribute('aria-expanded','false');
  setGroup('waves');updateGroupState();updateWavesButtons();closeMenu();ensureWavesFrame();if(route)writeRoute(wavesRouteHash(),replace);window.scrollTo({top:0,behavior:'instant'});
 }
 openPage=function(name){
  if(name==='nutrition'){showNutrition(desired.topic,desired.view);return;}
  if(name==='waves'){showWaves(wavesDesired.topic,wavesDesired.view);return;}
  document.body.classList.remove('nf-nutrition-active','nf-subjects-active','nf-waves-active');sendWavesVisibility();updateWavesButtons();setGroup('chemistry');originalOpenPage(name);lastChemistry=name;updateGroupState();closeMenu();writeRoute('#chemistry/'+name);
 };
 nutritionGroup.addEventListener('click',event=>{
  const topic=event.target.closest('[data-nutrition-topic]');if(topic){showNutrition(topic.dataset.nutritionTopic);return;}
  if(event.target.closest('[data-nutrition-view="bank"]'))showNutrition(['review','flashcards'].includes(desired.topic)?'all':desired.topic,'bank');
  if(event.target.closest('[data-nutrition-view="concepts"]'))showNutrition('all','concepts');
 });
 wavesGroup.addEventListener('click',event=>{const view=event.target.closest('[data-waves-view]');if(view){showWaves(view.dataset.wavesTopic,view.dataset.wavesView);return;}const topic=event.target.closest('[data-waves-toggle]');if(topic)showWaves(topic.dataset.wavesToggle,'fagstoff');});
 chemistryGroup.addEventListener('toggle',()=>{if(chemistryGroup.open){nutritionGroup.open=false;wavesGroup.open=false;}});
 nutritionGroup.addEventListener('toggle',()=>{if(nutritionGroup.open){chemistryGroup.open=false;wavesGroup.open=false;ensureFrame();}});
 wavesGroup.addEventListener('toggle',()=>{if(wavesGroup.open){chemistryGroup.open=false;nutritionGroup.open=false;}});
 function updateScores(stats){
  if(!stats||typeof stats!=='object')return;
  nutritionGroup.querySelectorAll('[data-topic-score]').forEach(badge=>{
   const score=stats[badge.dataset.topicScore],count=Math.min(20,Math.max(0,Number(score?.count)||0)),percent=Number(score?.percent);
   if(count&&Number.isFinite(percent)){const rounded=Math.max(0,Math.min(100,Math.round(percent)));badge.textContent=rounded+' %';badge.setAttribute('aria-label',rounded+' prosent riktig på de siste '+count+' besvarte oppgavene');badge.title=rounded+' % riktig · siste '+count+' besvarte oppgaver';badge.closest('button').setAttribute('aria-label',badge.closest('button').querySelector('span').textContent+', '+badge.getAttribute('aria-label'));}
   else{badge.textContent='—';badge.setAttribute('aria-label','Ingen besvarte oppgaver ennå');badge.title='Ingen besvarte oppgaver ennå';badge.closest('button').setAttribute('aria-label',badge.closest('button').querySelector('span').textContent+', Ingen besvarte oppgaver ennå');}
  });
 }
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=='onlyfag:nutrition:state')return;
  updateScores(event.data.stats);reported=event.data;
  if(!frameReady||!document.body.classList.contains('nf-nutrition-active'))return;
  if(validTopics.has(event.data.topic)){desired={topic:event.data.topic,view:event.data.view==='concepts'?'concepts':event.data.view==='bank'?'bank':'practice'};updateNutritionButtons();writeRoute(routeHash(),true);}
 });
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==wavesFrame.contentWindow||!event.data||typeof event.data!=='object')return;
  if(event.data.type==='onlyfag:waves:open-menu'){if(document.body.classList.contains('nf-waves-active'))openMenu();return;}
  if(event.data.type!=='onlyfag:waves:state'||!validWaveTopics.has(event.data.topic)||!validWaveViews.has(event.data.view))return;
  const section=waveAnchor(event.data.topic,event.data.view,event.data.section);
  if(wavesAwaitingState&&(event.data.topic!==wavesDesired.topic||event.data.view!==wavesDesired.view||section!==wavesDesired.section))return;
  wavesAwaitingState=false;
  wavesReported={topic:event.data.topic,view:event.data.view,...(section&&{section})};
  if(!wavesReady||!document.body.classList.contains('nf-waves-active'))return;
  wavesDesired={...wavesReported};updateWavesButtons();writeRoute(wavesRouteHash(),true);
 });
 let lastDark=document.body.classList.contains('dark'),lastCollapsed=document.body.classList.contains('side-collapsed');new MutationObserver(()=>{syncSidebarAccessibility();const collapsed=document.body.classList.contains('side-collapsed');if(collapsed!==lastCollapsed){lastCollapsed=collapsed;sendHostLayout();}const dark=document.body.classList.contains('dark');if(dark!==lastDark){lastDark=dark;sendTheme();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
 function readRoute(){
  const parts=location.hash.slice(1).split('/');routing=true;
  try{
   if(!parts[0]||parts[0]==='subjects'){showSubjects({route:false});return;}
   if(parts[0]==='nutrition'){showNutrition(parts[1]||'all',parts[2]||'practice',{route:false});return;}
   if(parts[0]==='waves'){showWaves(parts[1],parts[2],{route:false,section:parts[3]});return;}
   if(parts[0]==='chemistry'&&chemistryPages.has(parts[1])){openPage(parts[1]);return;}
   if(parts.length===1&&chemistryPages.has(parts[0])){openPage(parts[0]);return;}
   showSubjects({route:false});
  }finally{routing=false;}
 }
 window.addEventListener('popstate',readRoute);window.addEventListener('hashchange',readRoute);
 closeMenu();updateGroupState();readRoute();delete document.documentElement.dataset.nfLoading;
 // A stable host hook is useful for direct links and keyboard/assistive navigation.
 window.onlyfagNaturfag={openSubjects:showSubjects,openNutrition:showNutrition,openWaves:showWaves,openChemistry:name=>openPage(name),getNutritionState:()=>reported,getWavesState:()=>wavesReported};
})();

