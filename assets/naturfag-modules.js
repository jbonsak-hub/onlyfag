/* Shared Naturfag navigation. Chemistry keeps its original exercise engine. */
(function(){
 'use strict';
 const topicEntries=[['carbs','Karbohydrater'],['protein','Proteiner'],['fat','Fett'],['micro','Vitaminer, mineraler og vann'],['digestion','Fordøyelsen'],['energy','Energi og blodsukker'],['all','Blandet øving']];
 const validTopics=new Set([...topicEntries.map(([key])=>key),'review']);
 const $=selector=>document.querySelector(selector);
 const sidebar=$('#sidebar'),scroll=sidebar?.querySelector('.sidebar-scroll'),main=$('main.main'),content=main?.querySelector(':scope > .content');
 if(!scroll||!main||!content||typeof openPage!=='function')return;
 const originalOpenPage=openPage;
 const chemistryPages=new Set([...document.querySelectorAll('.page[id]')].map(page=>page.id.slice(5)));
 const chemistryGroup=document.createElement('details');chemistryGroup.id='nf-chemistry-group';chemistryGroup.className='nf-module-group';chemistryGroup.open=true;
 chemistryGroup.innerHTML='<summary class="nf-module-heading">Kjemi</summary><div class="nf-module-submenu"></div>';
 while(scroll.firstChild)chemistryGroup.lastElementChild.appendChild(scroll.firstChild);
 const nutritionGroup=document.createElement('details');nutritionGroup.id='nf-nutrition-group';nutritionGroup.className='nf-module-group';
 nutritionGroup.innerHTML='<summary class="nf-module-heading">Næringsstoffer og fordøyelsen</summary><div class="nf-module-submenu">'+topicEntries.map(([topic,label])=>'<button class="nf-nutrition-topic" type="button" data-nutrition-topic="'+topic+'" aria-pressed="false"><span>'+label+'</span><span class="nf-topic-score" data-topic-score="'+topic+'" aria-label="Ingen besvarte oppgaver ennå">—</span></button>').join('')+'<div class="nf-module-secondary"><button class="nf-nutrition-action" type="button" data-nutrition-view="bank">Oppgavebank</button><button class="nf-nutrition-action" type="button" data-nutrition-topic="review">Øv på nytt</button></div></div>';
 const subjectsHome=document.createElement('button');subjectsHome.id='nfSubjectsHome';subjectsHome.type='button';subjectsHome.className='nf-subjects-home';subjectsHome.innerHTML='<span aria-hidden="true">⌂</span><span>Start</span>';subjectsHome.setAttribute('aria-label','Velg hovedtema i naturfag');
 scroll.append(subjectsHome,chemistryGroup,nutritionGroup);
 sidebar.setAttribute('aria-label','Temaer i naturfag');
 for(const summary of [chemistryGroup.querySelector('summary'),nutritionGroup.querySelector('summary')]){summary.title=summary.textContent;summary.setAttribute('aria-label',summary.textContent);}
 nutritionGroup.querySelectorAll('.nf-nutrition-topic,.nf-nutrition-action').forEach(button=>{const label=button.querySelector('span')?.textContent||button.textContent;button.title=label;button.setAttribute('aria-label',label);});
 const subtitle=sidebar.querySelector('.nf-sidebar-sub');if(subtitle)subtitle.remove();
 const info=$('#infoPop');if(info)info.innerHTML='<p>Oppgavetrening i kjemi, næringsstoffer og fordøyelse for naturfag. Prosentene viser riktig på de siste 20 besvarte oppgavene per tema. Fremgangen lagres i nettleseren.</p>';
 const subjectsPage=document.createElement('section');subjectsPage.id='page-subjects';subjectsPage.className='page';subjectsPage.setAttribute('aria-label','Velg hovedtema');
 subjectsPage.innerHTML='<h1 class="nf-subjects-heading">Velg tema i naturfag</h1><div class="nf-subject-cards"><a class="nf-subject-card" data-subject="chemistry" href="#chemistry/home"><img src="assets/naturfag-chemistry.svg?v=20261031-5" alt="" width="640" height="360"><span class="nf-subject-card-label"><strong>Kjemi</strong><span aria-hidden="true">→</span></span></a><a class="nf-subject-card" data-subject="nutrition" href="#nutrition/all"><img src="assets/naturfag-nutrition.svg?v=20261031-5" alt="" width="640" height="360"><span class="nf-subject-card-label"><strong>Næringsstoffer og fordøyelsen</strong><span aria-hidden="true">→</span></span></a></div>';
 content.prepend(subjectsPage);
 const page=document.createElement('section');page.id='page-nutrition';page.className='page';page.setAttribute('aria-label','Næringsstoffer og fordøyelsen');
 const frame=document.createElement('iframe');frame.id='nutrition-module-frame';frame.title='Næringsstoffer og fordøyelsen – oppgavetrening';frame.allow='fullscreen';page.append(frame);content.append(page);
 const mobileMenu=document.createElement('button');mobileMenu.id='nfModulesMenu';mobileMenu.type='button';mobileMenu.textContent='☰';mobileMenu.setAttribute('aria-label','Åpne temamenyen');mobileMenu.setAttribute('aria-controls','sidebar');mobileMenu.setAttribute('aria-expanded','false');document.body.append(mobileMenu);
 const backdrop=document.createElement('button');backdrop.id='nfModulesBackdrop';backdrop.type='button';backdrop.hidden=true;backdrop.tabIndex=-1;backdrop.setAttribute('aria-label','Lukk temamenyen');document.body.append(backdrop);
 const mobile=matchMedia('(max-width:860px)');
 let desired={topic:'all',view:'practice'},frameReady=false,frameStarted=false,reported=null,lastChemistry=$('.page.active')?.id.slice(5)||'home',routing=false;
 function setGroup(group){chemistryGroup.open=group==='chemistry';nutritionGroup.open=group==='nutrition';}
 function updateGroupState(){const nutrition=document.body.classList.contains('nf-nutrition-active'),subjects=document.body.classList.contains('nf-subjects-active');chemistryGroup.querySelector('summary').dataset.active=String(!subjects&&!nutrition);nutritionGroup.querySelector('summary').dataset.active=String(!subjects&&nutrition);subjectsHome.classList.toggle('active',subjects);subjectsHome.setAttribute('aria-pressed',String(subjects));}
 function syncSidebarAccessibility(){const hidden=mobile.matches?!document.body.classList.contains('mobile-open'):document.body.classList.contains('side-collapsed');sidebar.inert=hidden;if(hidden)sidebar.setAttribute('aria-hidden','true');else sidebar.removeAttribute('aria-hidden');}
 function sendHostLayout(){if(frameReady)frame.contentWindow.postMessage({type:'onlyfag:nutrition:host-layout',sidebarCollapsed:!mobile.matches&&document.body.classList.contains('side-collapsed')},location.origin);}
 function sendTheme(){if(frameReady)frame.contentWindow.postMessage({type:'onlyfag:nutrition:theme',dark:document.body.classList.contains('dark')},location.origin);}
 function sendDesired(){if(frameReady)frame.contentWindow.postMessage({type:'onlyfag:nutrition:topic',topic:desired.topic,view:desired.view},location.origin);}
 function ensureFrame(){
  if(frameStarted){sendDesired();return;}
  frameStarted=true;
  frame.src='prototyper/ernaering.html?embedded=1&topic='+encodeURIComponent(desired.topic)+'&view='+encodeURIComponent(desired.view)+'&v=20261031-5';
 }
 frame.addEventListener('load',()=>{if(!frameStarted)return;frameReady=true;sendTheme();sendHostLayout();sendDesired();});
 function closeMenu({focus=false}={}){
  const wasOpen=document.body.classList.contains('mobile-open');document.body.classList.remove('mobile-open');mobileMenu.setAttribute('aria-expanded','false');backdrop.hidden=true;main.inert=false;syncSidebarAccessibility();sidebar.removeAttribute('aria-modal');sidebar.removeAttribute('role');if(focus&&wasOpen&&mobile.matches)mobileMenu.focus();
 }
 function openMenu(){
  if(!mobile.matches)return;document.body.classList.add('mobile-open');mobileMenu.setAttribute('aria-expanded','true');syncSidebarAccessibility();main.inert=true;backdrop.hidden=false;sidebar.setAttribute('aria-modal','true');sidebar.setAttribute('role','dialog');(document.body.classList.contains('nf-subjects-active')?subjectsHome:(document.body.classList.contains('nf-nutrition-active')?nutritionGroup:chemistryGroup).querySelector('summary')).focus();
 }
 mobileMenu.addEventListener('click',()=>document.body.classList.contains('mobile-open')?closeMenu({focus:true}):openMenu());backdrop.addEventListener('click',()=>closeMenu({focus:true}));mobile.addEventListener('change',()=>{closeMenu();sendHostLayout();});
 document.addEventListener('keydown',event=>{
  if(!mobile.matches||!document.body.classList.contains('mobile-open'))return;
  if(event.key==='Escape'){event.preventDefault();closeMenu({focus:true});return;}
  if(event.key!=='Tab')return;
  const controls=[...sidebar.querySelectorAll('summary,button,a,input')].filter(el=>!el.disabled&&el.getClientRects().length);const first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 });
 function routeHash(topic=desired.topic,view=desired.view){return '#nutrition/'+topic+(view==='bank'?'/bank':'');}
 function writeRoute(hash,replace=false){if(routing||location.hash===hash)return;history[replace?'replaceState':'pushState'](null,'',hash);}
 function updateNutritionButtons(){
  nutritionGroup.querySelectorAll('[data-nutrition-topic]').forEach(button=>{const active=button.dataset.nutritionTopic===desired.topic&&desired.view==='practice';button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  const bank=nutritionGroup.querySelector('[data-nutrition-view="bank"]');bank.classList.toggle('active',desired.view==='bank');bank.setAttribute('aria-pressed',String(desired.view==='bank'));
 }
 function showSubjects({route=true,replace=false}={}){
  document.body.classList.remove('nf-nutrition-active');document.body.classList.add('nf-subjects-active');
  document.querySelectorAll('.page').forEach(item=>item.classList.toggle('active',item===subjectsPage));
  document.querySelectorAll('.nav-btn,.nf-nutrition-topic,.nf-nutrition-action').forEach(button=>{button.classList.remove('active');if(button.hasAttribute('aria-pressed'))button.setAttribute('aria-pressed','false');});
  chemistryGroup.open=false;nutritionGroup.open=false;
  $('#floatingPt')?.classList.remove('show');$('#floatingPtBtn')?.classList.remove('active');$('#infoPop')?.classList.remove('show');$('#infoBtn')?.setAttribute('aria-expanded','false');
  updateGroupState();closeMenu();if(route)writeRoute('#subjects',replace);window.scrollTo({top:0,behavior:'instant'});
 }
 subjectsHome.addEventListener('click',()=>showSubjects());
 function showNutrition(topic='all',view='practice',{route=true,replace=false}={}){
  document.body.classList.remove('nf-subjects-active');
  desired={topic:validTopics.has(topic)?topic:'all',view:view==='bank'?'bank':'practice'};
  if(!document.body.classList.contains('nf-nutrition-active')){
   const prior=$('.page.active')?.id.slice(5);if(chemistryPages.has(prior))lastChemistry=prior;
   // Restore moved chemistry toolbars and stop running page-specific reference controls.
   const active=$('.page.active');if(active&&active.id==='page-elementnames')originalOpenPage('home');
  }
  document.body.classList.add('nf-nutrition-active');document.querySelectorAll('.page').forEach(item=>item.classList.toggle('active',item===page));document.querySelectorAll('.nav-btn').forEach(button=>button.classList.remove('active'));
  $('#floatingPt')?.classList.remove('show');$('#floatingPtBtn')?.classList.remove('active');$('#infoPop')?.classList.remove('show');$('#infoBtn')?.setAttribute('aria-expanded','false');
  setGroup('nutrition');updateGroupState();updateNutritionButtons();closeMenu();ensureFrame();if(route)writeRoute(routeHash(),replace);window.scrollTo({top:0,behavior:'instant'});
 }
 openPage=function(name){
  if(name==='nutrition'){showNutrition(desired.topic,desired.view);return;}
  document.body.classList.remove('nf-nutrition-active','nf-subjects-active');setGroup('chemistry');originalOpenPage(name);lastChemistry=name;updateGroupState();closeMenu();writeRoute('#chemistry/'+name);
 };
 nutritionGroup.addEventListener('click',event=>{
  const topic=event.target.closest('[data-nutrition-topic]');if(topic){showNutrition(topic.dataset.nutritionTopic);return;}
  if(event.target.closest('[data-nutrition-view="bank"]'))showNutrition(desired.topic==='review'?'all':desired.topic,'bank');
 });
 chemistryGroup.addEventListener('toggle',()=>{if(chemistryGroup.open)nutritionGroup.open=false;});
 nutritionGroup.addEventListener('toggle',()=>{if(nutritionGroup.open){chemistryGroup.open=false;ensureFrame();}});
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
  if(validTopics.has(event.data.topic)){desired={topic:event.data.topic,view:event.data.view==='bank'?'bank':'practice'};updateNutritionButtons();writeRoute(routeHash(),true);}
 });
 let lastDark=document.body.classList.contains('dark'),lastCollapsed=document.body.classList.contains('side-collapsed');new MutationObserver(()=>{syncSidebarAccessibility();const collapsed=document.body.classList.contains('side-collapsed');if(collapsed!==lastCollapsed){lastCollapsed=collapsed;sendHostLayout();}const dark=document.body.classList.contains('dark');if(dark!==lastDark){lastDark=dark;sendTheme();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
 function readRoute(){
  const parts=location.hash.slice(1).split('/');routing=true;
  try{
   if(!parts[0]||parts[0]==='subjects'){showSubjects({route:false});return;}
   if(parts[0]==='nutrition'){showNutrition(parts[1]||'all',parts[2]||'practice',{route:false});return;}
   if(parts[0]==='chemistry'&&chemistryPages.has(parts[1])){openPage(parts[1]);return;}
   if(parts.length===1&&chemistryPages.has(parts[0])){openPage(parts[0]);return;}
   showSubjects({route:false});
  }finally{routing=false;}
 }
 window.addEventListener('popstate',readRoute);window.addEventListener('hashchange',readRoute);
 closeMenu();updateGroupState();readRoute();
 // A stable host hook is useful for direct links and keyboard/assistive navigation.
 window.onlyfagNaturfag={openSubjects:showSubjects,openNutrition:showNutrition,openChemistry:name=>openPage(name),getNutritionState:()=>reported};
})();
