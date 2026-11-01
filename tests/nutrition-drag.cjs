/* Match/sort practice: visible terms, actual drag, keyboard/touch and compact layouts. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 try{
  const filename=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!filename.startsWith(root+path.sep))return res.writeHead(403).end();
  res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');res.end(fs.readFileSync(filename));
 }catch{res.writeHead(404).end();}
});
const artifacts=process.env.NUTRITION_DRAG_QA_DIR;
if(artifacts)fs.mkdirSync(artifacts,{recursive:true});
const attr=value=>String(value).replace(/\\/g,'\\\\').replace(/"/g,'\\"');
const target=(frame,index)=>frame.locator(`[data-place="${index}"]`);
const bin=(frame,group)=>frame.locator(`[data-group="${attr(group)}"]`);
const groupSection=(frame,group)=>frame.locator(`[data-drop-group="${attr(group)}"]`);
async function term(frame,value){
 const index=await frame.locator('[data-term]').evaluateAll((elements,value)=>elements.find(el=>el.dataset.value===value)?.dataset.term,value);
 assert.notEqual(index,undefined,'visible term exists: '+value);
 return frame.locator(`[data-term="${index}"]`);
}
async function activate(locator,mode){
 if(mode==='touch')await locator.tap();
 else if(mode==='keyboard'){
  await locator.focus();await locator.press('Enter');
  assert.equal(await locator.evaluate(el=>el===document.activeElement),true,'keyboard focus remains on the selected control after rendering');
 }
 else await locator.click();
}
async function answer(frame,q,mode='click'){
 if(q.type==='match')for(const [i,pair] of q.pairs.entries()){
  const slot=target(frame,i);if(await slot.isDisabled())continue;
  await activate(await term(frame,pair.right),mode);await activate(slot,mode);
 }else for(const [i,item] of q.items.entries()){
  const chip=frame.locator(`[data-sort-item="${i}"]`);if(await chip.isDisabled())continue;
  await activate(chip,mode);await activate(bin(frame,item.group),mode);
 }
 await frame.locator('#check-answer').click();
 assert.match(await frame.locator('#feedback-title').innerText(),/Riktig/,q.id+': visible placement controls accept the complete answer');
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const errors=[],overflows=[],readability=[],metrics=[];let browser;
 function inspect(id,viewport,stage,g){
  const outside=Object.entries(g.bounds).filter(([,r])=>r&&(r.left<-.5||r.top<-.5||r.right>g.width+.5||r.bottom>g.height+.5));
  if(g.scrollWidth>g.width+1||g.scrollHeight>g.height+1||outside.length)overflows.push({id,viewport,stage,...g,outside});
 }
 async function geometry(frame){return frame.evaluate(()=>({
  width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
  bounds:Object.fromEntries(['.prompt','.mini-figure','.answer-panel','.match-board','.sort-board','.task-actions','.feedback'].map(selector=>{
   const r=document.querySelector(selector)?.getBoundingClientRect();return [selector,r&&r.width>0&&r.height>0?{left:r.left,top:r.top,right:r.right,bottom:r.bottom}:null];
  }))
 }));}
 async function open(frame,id){
  await frame.evaluate(id=>{location.hash=id;},id);
  await frame.waitForFunction(id=>document.querySelector('[data-question]')?.dataset.question===id,id);
 }
 async function fresh(frame,id){
  await open(frame,id);
  const retry=frame.locator('#retry-question');if(await retry.count())await retry.click();
 }
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  for(const [width,height] of [[1366,768],[1280,720],[1024,720],[390,844]]){
   const viewport={width,height},touch=width===390;
   const context=await browser.newContext({viewport,reducedMotion:'reduce',hasTouch:touch});
   await context.route('**/*',route=>{
    const req=route.request(),url=req.url();
    return ['GET','HEAD'].includes(req.method())&&(url.startsWith(base+'/')||/^(data|blob):/.test(url))?route.continue():route.abort();
   });
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base+'/naturfag.html#nutrition/all');
   await page.locator('#nutrition-module-frame').waitFor();
   const frame=await (await page.locator('#nutrition-module-frame').elementHandle()).contentFrame();
   await frame.locator('[data-question]').waitFor();
   assert.equal(await page.locator('[data-nutrition-topic="review"]').count(),0,'the separate review menu choice is removed');
   assert.equal(await frame.locator('#review-button,#review-count').count(),0,'the standalone review controls are removed');
   const questions=await frame.evaluate(async()=>{
    const {questions}=await import(new URL('ernaering/questions.js',location.href).href);return questions.filter(q=>q.type==='match'||q.type==='sort');
   });
   assert.ok(questions.length>=20,'all matching and sorting tasks are exercised');
   for(const q of questions){
    await open(frame,q.id);
    assert.equal(await frame.locator('.exercise select').count(),0,q.id+': no dropdown hides the alternatives');
    const text=await frame.locator('.exercise').innerText();
    if(q.type==='match')for(const pair of q.pairs){assert.ok(text.includes(pair.left),q.id+': first term visible');assert.ok(text.includes(pair.right),q.id+': matching term visible');}
    else{
     for(const group of q.groups)assert.ok(text.includes(group),q.id+': sorting destination visible');
     for(const item of q.items)assert.ok(text.includes(item.label),q.id+': draggable item visible');
    }
    for(const chip of await frame.locator('[data-term],[data-sort-item]').all()){
     assert.ok(await chip.isVisible(),q.id+': every term starts visible');
     assert.equal(await chip.getAttribute('draggable'),'true',q.id+': terms can be dragged');
     const fontSize=await chip.evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
     if(fontSize<12)readability.push({id:q.id,viewport,fontSize});
    }
    if(touch&&q.figure==='nutrient-map'){
     const fontSize=await frame.locator('.nutrient-map-figure svg').evaluateAll(svgs=>Math.min(...svgs.filter(svg=>getComputedStyle(svg).display!=='none').flatMap(svg=>[...svg.querySelectorAll('text')].map(el=>{
      const m=el.getScreenCTM();return parseFloat(getComputedStyle(el).fontSize)*Math.hypot(m.c,m.d);
     }))));
     assert.ok(Number.isFinite(fontSize),'the compact concept map has visible labels');
     if(fontSize<12)readability.push({id:q.id,viewport,fontSize,kind:'figure-label'});
    }
    inspect(q.id,viewport,'before',await geometry(frame));
    if(artifacts&&[1366,390].includes(width)&&['structure-glycerol-acid','energy-storage-hormones','nutrient-concept-map','carbs-classification'].includes(q.id))await page.screenshot({path:path.join(artifacts,width+'-'+q.id+'.png'),fullPage:true});
    await answer(frame,q,touch?'touch':'click');
    inspect(q.id,viewport,'correct',await geometry(frame));
    await frame.locator('#retry-question').click();await frame.locator('#reveal-answer').click();
    inspect(q.id,viewport,'revealed',await geometry(frame));
   }
   const match=questions.find(q=>q.pairs?.length>=3),sort=questions.find(q=>q.items?.length>=4);
   // Real keyboard placement, rather than injecting values or calling app helpers.
   await fresh(frame,match.id);
   const firstTerm=await term(frame,match.pairs[0].right);
   await activate(firstTerm,'keyboard');assert.equal(await firstTerm.getAttribute('aria-pressed'),'true');
   await activate(firstTerm,'keyboard');assert.equal(await firstTerm.getAttribute('aria-pressed'),'false','the selected matching term can be deselected');
   await answer(frame,match,'keyboard');
   await fresh(frame,sort.id);
   const firstSort=frame.locator('[data-sort-item="0"]');
   await activate(firstSort,'keyboard');assert.equal(await firstSort.getAttribute('aria-pressed'),'true');
   await activate(firstSort,'keyboard');assert.equal(await firstSort.getAttribute('aria-pressed'),'false','the selected sorting item can be deselected');
   await answer(frame,sort,'keyboard');
   // Drag the original buttons with the browser's native drag sequence.
   await fresh(frame,match.id);
   await (await term(frame,match.pairs[0].right)).dragTo(target(frame,0));
   assert.ok((await target(frame,0).innerText()).includes(match.pairs[0].right),'native drag places the matching term');
   // Moving the same term leaves one assignment; wrong assignments remain editable.
   await activate(await term(frame,match.pairs[0].right),'click');await target(frame,1).click();
   assert.ok(!(await target(frame,0).innerText()).includes(match.pairs[0].right),'moving a term clears its previous slot');
   assert.ok((await target(frame,1).innerText()).includes(match.pairs[0].right));
   await activate(await term(frame,match.pairs[1].right),'click');await target(frame,0).click();
   for(let i=2;i<match.pairs.length;i++){await activate(await term(frame,match.pairs[i].right),'click');await target(frame,i).click();}
   await activate(await term(frame,match.pairs[2].right),'click');
   await frame.locator('#check-answer').click();
   assert.match(await frame.locator('#feedback-title').innerText(),/Ikke helt/);
   assert.equal(await frame.locator('.term-chip[aria-pressed="true"]').count(),0,'checking a partial match clears the selected term');
   assert.equal(await target(frame,0).isDisabled(),false,'a wrong matching placement can be changed');
   assert.equal(await target(frame,2).isDisabled(),true,'a correct matching placement is retained');
   await answer(frame,match);
   await fresh(frame,sort.id);
   await frame.locator('[data-sort-item="0"]').dragTo(groupSection(frame,sort.items[0].group));
   assert.ok((await groupSection(frame,sort.items[0].group).innerText()).includes(sort.items[0].label),'native drag puts a sorting item in its group');
   await frame.locator('[data-sort-item="0"]').dragTo(frame.locator('[data-sort-bank]'));
   assert.equal(await frame.locator('[data-sort-item="0"]').evaluate(el=>el.closest('[data-sort-bank]')!==null),true,'native drag can return an item to the bank');
   await frame.locator('[data-sort-item="0"]').click();await bin(frame,sort.items[0].group).click();
   await frame.locator('[data-sort-item="0"]').click();
   await bin(frame,sort.groups.find(group=>group!==sort.items[0].group)).click();
   assert.ok(!(await groupSection(frame,sort.items[0].group).innerText()).includes(sort.items[0].label),'a sorting item can be moved to another group');
   await frame.locator('[data-sort-item="0"]').click();await frame.locator('[data-return-bank]').click();
   assert.equal(await frame.locator('[data-sort-item="0"]').evaluate(el=>el.closest('[data-drop-group]')===null),true,'a sorting item can be returned to the visible bank');
   await frame.locator('[data-sort-item="0"]').click();
   await bin(frame,sort.groups.find(group=>group!==sort.items[0].group)).click();
   for(let i=1;i<sort.items.length;i++){
    await frame.locator(`[data-sort-item="${i}"]`).click();await bin(frame,sort.items[i].group).click();
   }
   await frame.locator('[data-sort-item="1"]').click();
   await frame.locator('#check-answer').click();
   assert.equal(await frame.locator('.term-chip[aria-pressed="true"]').count(),0,'checking a partial sort clears the selected item');
   assert.equal(await frame.locator('[data-sort-item="0"]').isDisabled(),false,'an incorrectly sorted item stays movable');
   assert.equal(await frame.locator('[data-sort-item="1"]').isDisabled(),true,'a correctly sorted item is retained');
   await answer(frame,sort);
   if(touch){
    // Touch-pointer dragging must work without a mouse or HTML5 dataTransfer.
    const cdp=await context.newCDPSession(page);
    async function fingerDrag(sourceLocator,destinationLocator){
     const source=await sourceLocator.boundingBox(),dest=await destinationLocator.boundingBox();
     const from={x:source.x+source.width/2,y:source.y+source.height/2},to={x:dest.x+dest.width/2,y:dest.y+dest.height/2};
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});
     for(let step=1;step<=8;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*step/8,y:from.y+(to.y-from.y)*step/8}]});
     await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    await fresh(frame,match.id);await fingerDrag(await term(frame,match.pairs[0].right),target(frame,0));
    assert.ok((await target(frame,0).innerText()).includes(match.pairs[0].right),'a finger drag places the term');
    await fresh(frame,sort.id);await fingerDrag(frame.locator('[data-sort-item="0"]'),bin(frame,sort.items[0].group));
    assert.ok((await groupSection(frame,sort.items[0].group).innerText()).includes(sort.items[0].label),'a finger drag sorts an item');
    // Navigation during an active finger drag removes its ghost and stale capture.
    await fresh(frame,match.id);
    const start=await (await term(frame,match.pairs[0].right)).boundingBox(),end=await target(frame,0).boundingBox();
    const from={x:start.x+start.width/2,y:start.y+start.height/2},to={x:end.x+end.width/2,y:end.y+end.height/2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:(from.x+to.x)/2,y:(from.y+to.y)/2}]});
    assert.equal(await frame.locator('.placement-ghost').count(),1,'an active finger drag displays its moving chip');
    await open(frame,sort.id);
    assert.equal(await frame.locator('.placement-ghost').count(),0,'navigating to another task cancels the active finger drag');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await frame.locator('.placement-ghost').count(),0,'ending the cancelled drag leaves no moving chip');
    await fresh(frame,match.id);await fingerDrag(await term(frame,match.pairs[0].right),target(frame,0));
    assert.ok((await target(frame,0).innerText()).includes(match.pairs[0].right),'finger dragging works again after navigation cancels a drag');
    await cdp.detach();
   }
   metrics.push({width,height,questions:questions.length,states:questions.length*3});
   await context.close();
  }
  console.log(JSON.stringify({metrics,overflows:overflows.map(({id,viewport,stage,scrollHeight,scrollWidth})=>({id,viewport,stage,scrollHeight,scrollWidth})),readability,errors},null,2));
  if(artifacts)fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({metrics,overflows,readability,errors},null,2));
  assert.deepEqual(errors,[],'no browser errors');assert.equal(overflows.length,0,'visible terms, targets, actions and feedback fit together');assert.deepEqual(readability,[],'term text remains readable');
  console.log('Visible matching/sorting banks, native drag, keyboard and touch placement, reassignment and review-control removal passed.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
