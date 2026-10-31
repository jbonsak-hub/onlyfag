/* Offline browser regression for compact nutrition exercises. No scores are sent. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 try{
  const filename=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!filename.startsWith(root+path.sep))return res.writeHead(403).end();
  res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');res.end(fs.readFileSync(filename));
 }catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 let browser;const errors=[],failures=[],metrics=[];
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  async function createPage(viewport){
   const context=await browser.newContext({viewport,reducedMotion:'reduce'});
   await context.route('**/*',route=>{
    const req=route.request(),url=req.url();
    if(['GET','HEAD'].includes(req.method())&&(url.startsWith(base+'/')||/^(data|blob):/.test(url)))return route.continue();
    return route.abort();
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/prototyper/ernaering.html');await page.locator('[data-question]').waitFor();
   return {page,context};
  }
  async function open(page,id){
   await page.evaluate(id=>{location.hash=id;},id);
   await page.waitForFunction(id=>document.querySelector('[data-question]')?.dataset.question===id,id);
  }
  async function geometry(page){return page.evaluate(()=>{
   const selectors=['.prompt','.mini-figure','.anatomy-map','.answer-panel','.task-actions','.open-response','.feedback'];
   const bounds=Object.fromEntries(selectors.map(s=>{
    const el=document.querySelector(s),r=el?.getBoundingClientRect();
    return [s,r&&r.width>0&&r.height>0?{left:r.left,top:r.top,right:r.right,bottom:r.bottom}:null];
   }));
   return {height:innerHeight,width:innerWidth,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,bounds};
  });}
  function recordOverflow(q,viewport,stage,g){
   const outside=Object.entries(g.bounds).filter(([,r])=>r&&(r.left<-.5||r.top<-.5||r.right>g.width+.5||r.bottom>g.height+.5));
   if(g.scrollHeight>g.height+1||g.scrollWidth>g.width+1||outside.length)failures.push({id:q.id,type:q.type,figure:q.figure,viewport,stage,...g,outside});
  }
  for(const [width,height] of [[1366,768],[1280,720],[1024,768],[390,844]]){
   const viewport={width,height},{page,context}=await createPage(viewport);
   const questions=await page.evaluate(async()=>{
    const {questions}=await import('./ernaering/questions.js?v=20261031-1');
    return questions.map(({id,type,figure})=>({id,type,figure}));
   });
   let maxHeight=0,maxActionsBottom=0;
   for(const q of questions){
    await open(page,q.id);const before=await geometry(page);recordOverflow(q,viewport,'before',before);
    await page.locator('#reveal-answer').click();
    const after=await geometry(page);recordOverflow(q,viewport,'revealed',after);
    maxHeight=Math.max(maxHeight,before.scrollHeight,after.scrollHeight);
    maxActionsBottom=Math.max(maxActionsBottom,before.bounds['.task-actions'].bottom,after.bounds['.task-actions'].bottom);
   }
   metrics.push({width,height,questions:questions.length,states:questions.length*2,maxHeight,maxActionsBottom:Math.round(maxActionsBottom)});
   await context.close();
  }
  // Menu breakpoint must match JS: keyboard/touch navigation works at 700px.
  const {page,context}=await createPage({width:700,height:844});
  // A real reload retains the URL hash; navigation-type detection must still
  // advance rotation rather than reopening the just-presented shared-link id.
  const beforeReload=await page.locator('[data-question]').getAttribute('data-question');
  await page.reload();await page.locator('[data-question]').waitFor();
  const afterReload=await page.locator('[data-question]').getAttribute('data-question');
  assert.notEqual(afterReload,beforeReload,'actual reload must advance to an unseen question');
  const recentAfterReload=await page.evaluate(()=>JSON.parse(localStorage.getItem('onlyfag.nutrition.v1')).rotation.recent);
  assert.ok(recentAfterReload.some(q=>q.id===beforeReload),'reload must retain previous presentation history');
  assert.ok(recentAfterReload.some(q=>q.id===afterReload),'reload must remember the new presentation');
  assert.equal(await page.locator('#sidebar').evaluate(el=>el.inert),true);
  await page.locator('#menu-button').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('.workspace').evaluate(el=>el.inert),true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#sidebar').evaluate(el=>el.inert),true);
  assert.equal(await page.locator('#menu-button').evaluate(el=>el===document.activeElement),true);
  await page.locator('#menu-button').click();await page.locator('[data-topic="protein"]').click();
  assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('.workspace').evaluate(el=>el.inert),false);
  await page.locator('#menu-button').click();await page.locator('[data-topic="figures"]').click();
  assert.equal(await page.locator('#active-topic').innerText(),'Figuroppgaver');
  for(let i=0;i<12;i++){
   assert.equal(await page.locator('.mini-figure,.anatomy-map').count(),1,'figure category must always present a visible figure');
   await page.locator('#next-question').click();
  }
  // Actual keyboard placement, rather than synthetic answer injection.
  await open(page,'digestion-anatomy');
  await page.locator('[data-label="mouth"]').focus();await page.keyboard.press('Enter');
  await page.locator('[data-target="mouth"]').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#target-mouth').evaluate(el=>el.classList.contains('filled')),true);
  assert.match(await page.locator('[data-label="mouth"]').innerText(),/1/);
  // Input and model comparison retain the typed answer and expose self-assessment.
  await open(page,'digestion-stomach-contents');
  await page.locator('#row-0').fill('saltsyre');await page.locator('#row-1').fill('pepsin');await page.locator('#row-1').press('Enter');
  assert.match(await page.locator('#feedback-title').innerText(),/Riktig uten hjelp/);
  await open(page,'protein-quality');
  await page.locator('#open-answer').fill('Proteinkilder kan utfylle hverandre med essensielle aminosyrer. Fordøyelighet påvirker tilgjengeligheten.');
  await page.locator('#show-model').focus();await page.keyboard.press('Enter');
  assert.ok(await page.locator('.open-model').isVisible());
  assert.match(await page.locator('#open-answer').inputValue(),/essensielle aminosyrer/);
  const checklist=page.locator('[data-self-check]');
  for(let i=0;i<await checklist.count();i++){await checklist.nth(i).focus();await page.keyboard.press('Space');assert.equal(await checklist.nth(i).isChecked(),true);}
  await page.locator('#self-confident').focus();await page.keyboard.press('Enter');
  assert.match(await page.locator('#feedback-title').innerText(),/Egenvurdering/);
  await context.close();
  console.log(JSON.stringify({metrics,overflowCases:failures,errors},null,2));
  assert.deepEqual(errors,[],'No browser exceptions');
  assert.deepEqual(failures,[],'Question, figure, inputs, actions and collapsed feedback must fit together without scrolling');
  console.log('Nutrition layout, 700px menu, keyboard organ placement, inputs and self-assessment: passed.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
