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
   const selectors=['.prompt','.mini-figure','.anatomy-map','.answer-panel','.visual-response','.task-actions','.open-response','.feedback'];
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
    const {questions}=await import('./ernaering/questions.js?v=20261031-7');
    return questions.map(({id,type,figure,topic})=>({id,type,figure,topic}));
   });
   let maxHeight=0,maxActionsBottom=0;
   for(const q of questions){
    await open(page,q.id);const before=await geometry(page);recordOverflow(q,viewport,'before',before);
    if(q.id==='digestion-anatomy'&&width===1366){
     const map=before.bounds['.anatomy-map'],controls=before.bounds['.visual-response'];
     assert.ok(map&&controls,'anatomy has a combined controls/actions column and a figure');
     assert.ok(map.left>=controls.right-1,'the important anatomy figure is to the right of controls');
     assert.ok(map.bottom-map.top>330,'the anatomy figure uses vertical space instead of a tiny model');
     assert.ok(before.bounds['.task-actions'].right<=map.left+1,'answer actions stay with the controls to the left');
    }
    await page.locator('#reveal-answer').click();
    const after=await geometry(page);recordOverflow(q,viewport,'revealed',after);
    maxHeight=Math.max(maxHeight,before.scrollHeight,after.scrollHeight);
    maxActionsBottom=Math.max(maxActionsBottom,before.bounds['.task-actions'].bottom,after.bounds['.task-actions'].bottom);
   }
   metrics.push({width,height,questions:questions.length,states:questions.length*2,maxHeight,maxActionsBottom:Math.round(maxActionsBottom)});
   if(width===390){
    // Fitting the viewport is insufficient if the important letters shrink
    // below a readable size. Measure the final SVG-to-screen transform.
    async function visibleTextSizes(){return page.locator('.mini-figure').evaluate(el=>[...el.querySelectorAll('svg text')].filter(t=>t.closest('svg').getBoundingClientRect().width>0).map(t=>({text:t.textContent.trim(),pixels:parseFloat(getComputedStyle(t).fontSize)*Math.abs(t.getScreenCTM().a)})));}
    await open(page,'nutrient-concept-map');
    const mapText=await visibleTextSizes();
    for(const clue of ['Monosakkarider','Aminosyrer','Umettet','Vitaminer']){
     const labels=mapText.filter(t=>t.text===clue);assert.equal(labels.length,1,clue+': one visible responsive map label');
     assert.ok(labels[0].pixels>=12,clue+': at least12px rendered text on a narrow screen');
    }
    await open(page,'structure-carbon-count');
    const oneRing=await visibleTextSizes();
    assert.ok(oneRing.some(t=>t.text==='B · Fruktose'),'counting task focuses on the fructose ring');
    assert.ok(!oneRing.some(t=>/Glukose|Galaktose/.test(t.text)),'other sugar rings do not crowd the counting task');
    const atomLetters=oneRing.filter(t=>/^[CHO]$/.test(t.text));assert.ok(atomLetters.length>0);
    for(const atom of atomLetters)assert.ok(atom.pixels>=12,'single-ring atom letters are readable: '+atom.pixels);
    await open(page,'structure-galactose');
    const twoRings=await visibleTextSizes();
    assert.ok(twoRings.some(t=>t.text==='A · Glukose')&&twoRings.some(t=>t.text==='B · Galaktose'),'comparison focuses on the two relevant rings');
    assert.ok(!twoRings.some(t=>/Fruktose/.test(t.text)),'third sugar ring is excluded from the comparison');
    for(const atom of twoRings.filter(t=>/^[CHO]$/.test(t.text)))assert.ok(atom.pixels>=12,'paired-ring atom letters are readable: '+atom.pixels);
   }

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
  assert.equal(await page.locator('[data-topic="figures"]').count(),0,'figures are part of the subject themes');
  await page.locator('#menu-button').click();await page.locator('#bank-tab').click();
  const topicBank=await page.locator('.bank-row').count();assert.ok(topicBank>0);
  const expectedProteinFigures=await page.evaluate(async()=>{
   const {questions}=await import('./ernaering/questions.js?v=20261031-7');
   return questions.filter(q=>q.topic==='protein'&&q.figure).map(q=>q.id);
  });
  for(const id of expectedProteinFigures)assert.equal(await page.locator(`[data-open="${id}"]`).count(),1,id+': figure exercise stays in its subject bank');
  await page.locator('#menu-button').click();await page.locator('#practice-tab').click();
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
