/* Same-origin module integration regression. All network actions stay on the test server. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 try{
  const filename=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!filename.startsWith(root+path.sep))return res.writeHead(403).end();
  res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');
  res.end(fs.readFileSync(filename));
 }catch{res.writeHead(404).end();}
});
const store='onlyfag.nutrition.v1';
const topicOrder=['carbs','protein','fat','micro','digestion','energy','all'];
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const errors=[],overflows=[],metrics=[];
 let browser;
 const artifactDir=process.env.NATURFAG_QA_DIR;
 if(artifactDir)fs.mkdirSync(artifactDir,{recursive:true});
 async function shot(page,name){if(artifactDir)await page.screenshot({path:path.join(artifactDir,name+'.png'),fullPage:true});}
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  async function nutritionFrame(page){return (await page.locator('#nutrition-module-frame').elementHandle()).contentFrame();}
  async function newPage(viewport,{route='#nutrition/carbs'}={}){
   const context=await browser.newContext({viewport,reducedMotion:'reduce'});
   await context.route('**/*',route=>{
    const req=route.request(),url=req.url();
    return ['GET','HEAD'].includes(req.method())&&(url.startsWith(base+'/')||/^(data|blob):/.test(url))?route.continue():route.abort();
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/naturfag.html'+route);
   let frame=null;
   if(route.startsWith('#nutrition/')){
    await page.locator('#nutrition-module-frame').waitFor();frame=await nutritionFrame(page);
    await frame.locator('[data-question]').waitFor();
   }else await page.locator('#page-subjects.active').waitFor();
   return {page,context,frame};
  }
  async function showMenu(page){
   const button=page.locator('#nfModulesMenu');
   if(await button.isVisible()&&!await page.locator('#sidebar').evaluate(el=>el.getBoundingClientRect().left>=-.5))await button.click();
  }
  async function pickTopic(page,topic){
   await showMenu(page);
   const group=page.locator('#nf-nutrition-group');
   if(!await group.evaluate(el=>el.open))await group.locator('summary').click();
   await page.locator(`.nf-nutrition-topic[data-nutrition-topic="${topic}"]`).click();
   await page.waitForFunction(topic=>location.hash==='#nutrition/'+topic,topic);
   const frame=await nutritionFrame(page);
   await frame.locator('[data-question]').waitFor();
   await frame.waitForFunction(topic=>document.getElementById('active-topic')?.textContent===(topic==='all'?'Blandet øving':({carbs:'Karbohydrater',protein:'Proteiner',fat:'Fett',micro:'Vitaminer, mineraler og vann',digestion:'Fordøyelsen',energy:'Energi og blodsukker'})[topic]),topic);
   return frame;
  }
  async function openQuestion(frame,id){
   await frame.evaluate(id=>{location.hash=id;},id);
   await frame.waitForFunction(id=>document.querySelector('[data-question]')?.dataset.question===id,id);
  }
  async function bank(frame){return frame.evaluate(async()=>{
   const {questions}=await import(new URL('ernaering/questions.js',location.href).href);return questions;
  });}
  async function state(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),store);}
  async function correctChoice(frame,q){
   await frame.getByRole('button',{name:q.answer,exact:true}).click();
   await frame.locator('#check-answer').click();
  }
  function checkBounds(label,viewport,geometry){
   const {innerWidth,innerHeight,scrollWidth,scrollHeight,bounds}=geometry;
   const outside=Object.entries(bounds).filter(([,r])=>r&&(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5));
   if(scrollWidth>innerWidth+1||scrollHeight>innerHeight+1||outside.length)overflows.push({label,viewport,...geometry,outside});
  }
  async function geometry(frame){return frame.evaluate(()=>({
   innerWidth,innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
   bounds:Object.fromEntries(['.prompt','.visual-response','.mini-figure','.anatomy-map','.answer-panel','.task-actions','.feedback'].map(selector=>{
    const r=document.querySelector(selector)?.getBoundingClientRect();return [selector,r&&r.width>0&&r.height>0?{left:r.left,top:r.top,right:r.right,bottom:r.bottom}:null];
   }))
  }));}
  // A canonical visit always begins with the two illustrated subject choices.
  for(const [width,height] of [[1366,768],[1280,720],[390,844]]){
   const viewport={width,height},{page,context}=await newPage(viewport,{route:''});
   assert.equal(await page.locator('#page-subjects.active').count(),1,'canonical arrival shows the subject chooser');
   assert.equal(await page.locator('.nf-subject-card').count(),2,'only the two main subject cards are shown');
   assert.equal(await page.locator('#nf-chemistry-group').evaluate(el=>el.open),false);
   assert.equal(await page.locator('#nf-nutrition-group').evaluate(el=>el.open),false);
   for(const subject of ['chemistry','nutrition']){
    const card=page.locator(`.nf-subject-card[data-subject="${subject}"]`);
    assert.ok(await card.isVisible(),subject+' card is visible');
    const image=card.locator('img');assert.equal(await image.count(),1,subject+' has one illustration');
    await image.evaluate(image=>image.decode());
    assert.ok(await image.evaluate(image=>image.complete&&image.naturalWidth>0&&image.getBoundingClientRect().height>70),subject+' illustration is loaded and substantial');
   }
   const homeGeometry=await page.evaluate(()=>({innerWidth,innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,bounds:Object.fromEntries([...document.querySelectorAll('.nf-subject-card')].map(el=>{const r=el.getBoundingClientRect();return [el.dataset.subject,{left:r.left,top:r.top,right:r.right,bottom:r.bottom}];}))}));
   checkBounds('illustrated default landing',viewport,homeGeometry);
   await shot(page,width+'-default-subjects');
   const chemistryCard=page.locator('.nf-subject-card[data-subject="chemistry"]');
   assert.equal(await chemistryCard.getAttribute('href'),'#chemistry/home');
   await chemistryCard.focus();await page.keyboard.press('Enter');
   await page.locator('#page-home.active').waitFor();
   assert.equal(await page.locator('#nf-chemistry-group').evaluate(el=>el.open),true);
   const chemistryText=page.locator('.nav-btn[data-page="atom"] .nav-txt');
   const chemistryFont=await chemistryText.evaluate(el=>({size:getComputedStyle(el).fontSize,weight:getComputedStyle(el).fontWeight}));
   await showMenu(page);await page.locator('#nfSubjectsHome').click();
   await page.locator('#page-subjects.active').waitFor();
   const nutritionCard=page.locator('.nf-subject-card[data-subject="nutrition"]');
   assert.equal(await nutritionCard.getAttribute('href'),'#nutrition/all');await nutritionCard.click();
   await page.waitForFunction(()=>location.hash==='#nutrition/all');
   const frame=await nutritionFrame(page);await frame.locator('[data-question]').waitFor();
   await showMenu(page);
   const nutritionFont=await page.locator('.nf-nutrition-topic[data-nutrition-topic="carbs"]>span:first-child').evaluate(el=>({size:getComputedStyle(el).fontSize,weight:getComputedStyle(el).fontWeight}));
   assert.deepEqual(nutritionFont,chemistryFont,'both subject submenus use identical typography');
   assert.deepEqual(nutritionFont,{size:'13px',weight:'700'},'the shared submenu typography is medium-sized and bold');
   if(width<=860){await page.keyboard.press('Escape');}
   assert.equal(await frame.locator('#filter-toggle,#filter-bar').count(),0,'embedded nutrition has no filter controls');
   assert.equal(await frame.getByRole('button',{name:'Filter',exact:true}).count(),0);
   await page.goBack();await page.locator('#page-subjects.active').waitFor();
   await page.goForward();await page.waitForFunction(()=>location.hash==='#nutrition/all');
   await page.goto(base+'/naturfag.html');await page.locator('#page-subjects.active').waitFor();
   await page.reload();await page.locator('#page-subjects.active').waitFor();
   assert.equal(await page.locator('.nf-subject-card').count(),2,'a canonical reload stays on the subject landing rather than a remembered exercise');
   await context.close();
  }

  // Each embedded topic uses the host navigation. No duplicated child sidebar.
  const {page,context,frame}=await newPage({width:1366,height:768});
  assert.equal(await page.locator('#nf-chemistry-group summary').count(),1);
  assert.equal(await page.locator('#nf-nutrition-group summary').count(),1);
  assert.deepEqual(await page.locator('.nf-nutrition-topic').evaluateAll(els=>els.map(el=>el.dataset.nutritionTopic)),topicOrder);
  assert.equal(await frame.locator('#sidebar').isVisible(),false,'embedded mode has only the host sidebar');
  assert.equal(await frame.locator('#menu-button').isVisible(),false,'embedded mode has only the host menu opener');
  assert.equal(await frame.locator('#filter-toggle,#filter-bar').count(),0,'filter controls are removed');
  await frame.locator('#about-button').click();
  assert.doesNotMatch(await frame.locator('#about-dialog').innerText(),/presentasjon|vedlegg|prøve(?:n|ark| fra)|2016|lærerens|timene/i,'public help and sources do not assume a particular classroom');
  await frame.locator('#close-dialog').click();
  const questions=await bank(frame);
  const carbs=questions.find(q=>q.topic==='carbs'&&q.type==='choice');
  await openQuestion(frame,carbs.id);
  assert.equal((await state(page)).recentResults?.carbs?.length||0,0,'new statistics must not fabricate old history');
  const wrong=carbs.options.find(option=>option!==carbs.answer);
  await frame.getByRole('button',{name:wrong,exact:true}).click();await frame.locator('#check-answer').click();
  await correctChoice(frame,carbs);
  let saved=await state(page);
  assert.equal(saved.recentResults.carbs.length,1,'a corrected retry does not add a second scored question');
  assert.equal(saved.recentResults.carbs[0].ok,false,'the first submitted answer determines the score');
  await page.waitForFunction(()=>document.querySelector('[data-topic-score="carbs"]')?.textContent.includes('0'));
  let fatFrame=await pickTopic(page,'fat');
  const fat=questions.find(q=>q.topic==='fat'&&q.type==='choice');
  await openQuestion(fatFrame,fat.id);await correctChoice(fatFrame,fat);
  saved=await state(page);
  assert.equal(saved.recentResults.fat.length,1);assert.equal(saved.recentResults.fat[0].ok,true);
  assert.equal(saved.recentResults.carbs.length,1,'scores remain separate by topic');
  await page.waitForFunction(()=>document.querySelector('[data-topic-score="fat"]')?.textContent.includes('100'));
  await shot(page,'1366-topic-percentages');
  await page.locator('.nf-nutrition-action[data-nutrition-view="bank"]').click();
  await page.waitForFunction(()=>location.hash==='#nutrition/fat/bank');
  await fatFrame.locator('#bank-list').waitFor();
  assert.ok(await fatFrame.locator('.bank-row').count()>0,'the shared navigation keeps the task bank accessible');
  await pickTopic(page,'fat');
  await page.locator('.nf-nutrition-action[data-nutrition-topic="review"]').click();
  await page.waitForFunction(()=>location.hash==='#nutrition/review');
  await fatFrame.waitForFunction(()=>document.getElementById('active-topic')?.textContent==='Øv på nytt');
  assert.equal((await state(page)).recentResults.carbs.length,1,'opening review does not create a scored answer');
  await pickTopic(page,'protein');
  await pickTopic(page,'digestion');
  await page.goBack();await page.waitForFunction(()=>location.hash==='#nutrition/protein');
  await page.goForward();await page.waitForFunction(()=>location.hash==='#nutrition/digestion');
  await page.reload();await page.locator('#nutrition-module-frame').waitFor();
  const reloaded=await nutritionFrame(page);await reloaded.locator('[data-question]').waitFor();
  assert.equal((await state(page)).recentResults.fat.length,1,'statistics survive reloading the host route');
  assert.equal(await reloaded.locator('#active-topic').innerText(),'Fordøyelsen');
  // A message from the host window itself must not impersonate its child frame.
  const beforeBadge=await page.locator('[data-topic-score="fat"]').innerText();
  await page.evaluate(()=>window.postMessage({type:'onlyfag:nutrition:state',topic:'fat',stats:{fat:{percent:13,count:20,correct:3}}},location.origin));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
  assert.equal(await page.locator('[data-topic-score="fat"]').innerText(),beforeBadge,'only the known child window can update host badges');
  // Shared theme/collapse controls retain their existing behavior.
  await page.locator('#themeBtn').click();
  await reloaded.waitForFunction(()=>document.body.classList.contains('dark'));
  await page.locator('#themeBtn').click();await reloaded.waitForFunction(()=>!document.body.classList.contains('dark'));
  const widthBefore=await page.locator('#nutrition-module-frame').evaluate(el=>el.getBoundingClientRect().width);
  await page.locator('#collapseBtn').click();
  await page.waitForFunction(width=>document.getElementById('nutrition-module-frame').getBoundingClientRect().width>width+1,widthBefore);
  assert.ok(await page.locator('#nutrition-module-frame').evaluate(el=>el.getBoundingClientRect().width)>widthBefore,'collapsing the host sidebar gives the module more room');
  await page.waitForFunction(()=>document.getElementById('sidebar').getBoundingClientRect().width<=1);
  assert.equal(await page.locator('#sidebar').evaluate(el=>el.inert),true,'collapsed host navigation is not keyboard-focusable');
  const collapseBox=await page.locator('#collapseBtn').boundingBox();
  assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('#collapseBtn')?.id,{x:collapseBox.x+collapseBox.width/2,y:collapseBox.y+collapseBox.height/2}),'collapseBtn','collapsed menu control remains pointer-accessible');
  await reloaded.waitForFunction(right=>document.getElementById('active-topic').getBoundingClientRect().left>=right+3,collapseBox.x+collapseBox.width);
  await shot(page,'1366-collapsed-menu');
  await page.locator('#collapseBtn').click();
  assert.equal(await page.locator('#sidebar').evaluate(el=>el.inert),false,'expanded desktop navigation becomes usable again');
  // Existing chemistry pages and their score history remain usable.
  const chemistryBefore=await page.evaluate(()=>localStorage.getItem('chemistryProgressV18'));
  const chemGroup=page.locator('#nf-chemistry-group');if(!await chemGroup.evaluate(el=>el.open))await chemGroup.locator('summary').click();
  await page.locator('.nav-btn[data-page="atom"]').click();
  await page.locator('#page-atom.active').waitFor();
  assert.equal(await page.locator('#nutrition-module-frame').isVisible(),false);
  assert.equal(await page.evaluate(()=>localStorage.getItem('chemistryProgressV18')),chemistryBefore,'switching modules never resets chemistry history');
  const start=page.locator('#atomArea button').filter({hasText:/Start/});if(await start.count())await start.first().click();
  const atomOption=page.locator('#atomArea .option').first();
  if(await atomOption.count()){
   await atomOption.click();
   assert.ok(await page.evaluate(()=>localStorage.getItem('chemistryProgressV18')),'a native chemistry answer still records its history');
  }else throw Error('No native chemistry answer control found');
  await pickTopic(page,'fat');
  assert.equal((await state(page)).recentResults.carbs.length,1,'chemistry does not reset nutrition history');
  await context.close();
  const representatives=['structure-glucose','structure-carbon-count','digestion-anatomy','carbs-classification','nutrient-concept-map','protein-quality'];
  for(const [width,height] of [[1366,768],[1280,720],[1024,768],[1024,720],[390,844]]){
   const viewport={width,height},{page,context}=await newPage(viewport);
   let checked=0;
   for(const id of representatives){
    const q=questions.find(q=>q.id===id);assert.ok(q,id);
    const frame=await pickTopic(page,q.topic);await openQuestion(frame,id);
    const outer=await page.evaluate(()=>({innerWidth,innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,bounds:{frame:(()=>{const r=document.getElementById('nutrition-module-frame').getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};})()}}));
    checkBounds(id+': host',viewport,outer);
    checkBounds(id+': before',viewport,await geometry(frame));
    if([1366,390].includes(width)&&['digestion-anatomy','nutrient-concept-map','structure-glucose'].includes(id))await shot(page,width+'-'+id+'-before');
    await frame.locator('#reveal-answer').click();checkBounds(id+': revealed',viewport,await geometry(frame));checked++;
   }
   if(width===390){
    await page.locator('#nfModulesMenu').focus();await page.keyboard.press('Enter');
    assert.ok(await page.locator('#sidebar').evaluate(el=>el.getBoundingClientRect().left>=-.5),'mobile menu opens');
    await shot(page,'390-shared-menu');
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#sidebar').evaluate(el=>el.getBoundingClientRect().right<=.5),'Escape closes the shared mobile menu');
    assert.equal(await page.locator('#nfModulesMenu').evaluate(el=>el===document.activeElement),true);
    await showMenu(page);const group=page.locator('#nf-chemistry-group');if(!await group.evaluate(el=>el.open))await group.locator('summary').click();
    await page.locator('.nav-btn[data-page="atom"]').click();await page.locator('#page-atom.active').waitFor();
    assert.ok(await page.locator('#sidebar').evaluate(el=>el.getBoundingClientRect().right<=.5),'choosing a chemistry topic closes the mobile menu');
    await pickTopic(page,'digestion');
    assert.equal(await page.locator('#nutrition-module-frame').isVisible(),true);
   }
   metrics.push({width,height,representativeQuestions:checked,states:checked*2});await context.close();
  }
  console.log(JSON.stringify({metrics,overflows,errors},null,2));
  assert.deepEqual(errors,[],'no browser exceptions in either module');
  assert.deepEqual(overflows,[],'host and embedded task controls fit together without nested scrolling');
  console.log('Naturfag illustrated landing, shared typography, filter removal, module navigation, statistics, routes, preserved chemistry and embedded layouts: passed.');
 }catch(error){console.error(JSON.stringify({overflows,errors},null,2));throw error;}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
