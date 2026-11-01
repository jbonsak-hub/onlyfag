/* Flashcard navigation, isolation and layout regression; local requests only. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),store='onlyfag.nutrition.v1';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  try{
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
});
const seed={version:1,records:{sentinel:{status:'independent',attempts:2}},lastId:'sentinel',rotation:{seen:['sentinel'],recent:[{id:'sentinel',family:'sentinel'}]},recentResults:{all:[{ok:true,t:42}],fat:[{ok:true,t:42}]}};
const artifactDir=process.env.FLASHCARD_QA_DIR;
if(artifactDir)fs.mkdirSync(artifactDir,{recursive:true});
(async()=>{
  let browser;
  const errors=[],counts=[];
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base='http://127.0.0.1:'+server.address().port;
    browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
    async function open(viewport,url,{stored=seed}={}){
      const context=await browser.newContext({viewport,reducedMotion:'reduce'});
      await context.route('**/*',route=>{
        const request=route.request(),url=request.url();
        return ['GET','HEAD'].includes(request.method())&&(url.startsWith(base+'/')||/^(data|blob):/.test(url))?route.continue():route.abort();
      });
      if(stored)await context.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(value));},{key:store,value:stored});
      const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+url);
      let frame=page.mainFrame();
      if(url.startsWith('/naturfag'))frame=await (await page.locator('#nutrition-module-frame').elementHandle()).contentFrame();
      await frame.locator(url.includes('concepts')?'.concept-list':'[data-flashcard]').waitFor();
      return {page,frame,context};
    }
    async function id(frame){return frame.locator('[data-flashcard]').getAttribute('data-flashcard');}
    async function saved(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),store);}
    async function geometry(frame){
      const data=await frame.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
        bounds:[...document.querySelectorAll('.flashcard,.flashcard-actions,.flashcard-term,.flashcard-definition:not([hidden])')].map(el=>{const r=el.getBoundingClientRect();return {name:el.className,left:r.left,right:r.right,top:r.top,bottom:r.bottom};}),
        controls:[...document.querySelectorAll('.flashcard-actions button')].map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};})}));
      assert.ok(data.scrollWidth<=data.width+1,JSON.stringify(data));
      assert.ok(data.scrollHeight<=data.height+1,JSON.stringify(data));
      for(const rect of data.bounds)assert.ok(rect.left>=-.5&&rect.right<=data.width+.5&&rect.top>=-.5&&rect.bottom<=data.height+.5,JSON.stringify({rect,...data}));
      for(const rect of data.controls)assert.ok(rect.width>=44&&rect.height>=44,'navigation buttons have touch target size');
    }
    for(const viewport of [{width:1366,height:768},{width:1024,height:720},{width:390,height:844}]){
      let {page,frame,context}=await open(viewport,'/naturfag.html#nutrition/flashcards');
      const order=await page.locator('.nf-nutrition-topic').evaluateAll(els=>els.map(el=>el.dataset.nutritionTopic));
      assert.deepEqual(order.slice(-2),['all','flashcards'],'flashcards immediately follow Blandet øving');
      assert.equal(await page.locator('[data-nutrition-topic="flashcards"]').innerText(),'Begreper flashcards');
      assert.equal(await page.locator('[data-topic-score="flashcards"]').count(),0,'self-study has no automatic quiz score');
      assert.equal(await frame.locator('#sidebar').isVisible(),false,'embedded mode has one sidebar');
      assert.equal(await frame.locator('#progress-copy').isVisible(),false,'flashcards hide quiz percentages');
      const cards=await frame.evaluate(async()=>{const {flashcards}=await import(new URL('ernaering/flashcards.js?v=20261101-4',location.href));return flashcards;});
      assert.equal(cards.length,63,'the supplied list plus nine selected additions is present');
      for(const term of ['Fruktose','Sukrose','Laktose','Galle','Galleblære','Tarmtotter','Peristaltiske bevegelser','Laktase','Laktoseintoleranse','Cisfett','Transfett'])assert.ok(cards.some(card=>card.term===term),term+' is available as its own card');
      assert.equal(new Set(cards.map(card=>card.id)).size,cards.length,'unique stable ids');
      assert.equal(new Set(cards.map(card=>card.term.toLocaleLowerCase('nb'))).size,cards.length,'no duplicated terms');
      for(const card of cards){assert.ok(card.definition.trim());assert.ok(card.definition.split(/\s+/).length<=40,card.term+' has a short explanation');}
      let first=await id(frame);
      await frame.locator('#flip-flashcard').click();
      assert.equal(await frame.locator('#flashcard-definition').isVisible(),true);
      await geometry(frame);
      await frame.locator('#flip-flashcard').press('Space');
      assert.equal(await frame.locator('#flashcard-definition').isVisible(),false,'Space flips exactly once');
      await frame.locator('#flip-flashcard').press('ArrowRight');
      const second=await id(frame);assert.notEqual(second,first);
      assert.equal(await frame.locator('#flashcard-definition').isVisible(),false,'new card starts face down');
      await frame.locator('#flip-flashcard').press('ArrowLeft');
      assert.equal(await id(frame),first,'left arrow returns to previous card');
      await frame.locator('#flip-flashcard').press('ArrowRight');assert.equal(await id(frame),second,'forward after previous reuses the existing next card');
      const seen=new Set([first,second]);
      // Every term and explanation is exercised at each representative viewport.
      for(let i=1;i<cards.length;i++){
        if(i>1){await frame.locator('#next-flashcard').click();const current=await id(frame);assert.ok(!seen.has(current),'no repetition before the full deck');seen.add(current);}
        assert.equal(await frame.locator('#flashcard-definition').isVisible(),false);
        await geometry(frame);
        await frame.locator('#flip-flashcard').click();
        const current=await id(frame);
        assert.equal(await frame.locator('#flashcard-definition').innerText(),cards.find(card=>card.id===current).definition);
        await geometry(frame);
        if(i===1&&artifactDir)await page.screenshot({path:path.join(artifactDir,viewport.width+'-explanation.png'),fullPage:true});
        await frame.locator('#flip-flashcard').click();
      }
      assert.equal(seen.size,cards.length);
      const beforeReload=await saved(page),recent=beforeReload.flashcardRotation.recent.map(card=>card.id);
      await page.reload();frame=await (await page.locator('#nutrition-module-frame').elementHandle()).contentFrame();await frame.locator('[data-flashcard]').waitFor();
      assert.ok(!recent.includes(await id(frame)),'a new cycle after reload still avoids the recent ten cards');
      const after=await saved(page);
      for(const key of ['records','recentResults','rotation','lastId'])assert.deepEqual(after[key],seed[key],key+' is untouched by flashcard practice');
      // Rejected messages cannot change either the host route or the child topic.
      await page.evaluate(()=>window.postMessage({type:'onlyfag:nutrition:state',topic:'fat',view:'practice'},location.origin));
      await frame.evaluate(()=>{
        window.postMessage({type:'onlyfag:nutrition:topic',topic:'fat',view:'practice'},location.origin);
        window.dispatchEvent(new MessageEvent('message',{origin:'https://untrusted.invalid',source:window.parent,data:{type:'onlyfag:nutrition:topic',topic:'fat',view:'practice'}}));
      });
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      assert.equal(new URL(page.url()).hash,'#nutrition/flashcards');assert.equal(await frame.locator('[data-flashcard]').count(),1);
      if(viewport.width===1366){
        await page.locator('#themeBtn').click();await frame.waitForFunction(()=>document.body.classList.contains('dark'));
        await frame.locator('#flip-flashcard').click();await geometry(frame);
        if(artifactDir)await page.screenshot({path:path.join(artifactDir,'desktop-dark.png'),fullPage:true});
        await page.locator('[data-nutrition-topic="all"]').click();await frame.locator('[data-question]').waitFor();
        await page.goBack();await frame.locator('[data-flashcard]').waitFor();
        await page.goForward();await frame.locator('[data-question]').waitFor();
        await page.locator('[data-nutrition-topic="flashcards"]').click();await frame.locator('[data-flashcard]').waitFor();
        const visible=await frame.locator('#flashcard-definition').isVisible();
        await page.keyboard.press('Space');
        assert.equal(await frame.locator('#flashcard-definition').isVisible(),!visible,'host menu selection immediately gives Space control to the flashcard');
      }else if(viewport.width===390){
        await page.locator('#nfModulesMenu').click();
        await page.locator('[data-nutrition-topic="all"]').click();await frame.locator('[data-question]').waitFor();
        await page.locator('#nfModulesMenu').click();await page.locator('[data-nutrition-topic="flashcards"]').click();await frame.locator('[data-flashcard]').waitFor();
        assert.equal(await page.locator('#sidebar').evaluate(el=>el.inert),true,'choosing flashcards closes the mobile menu');
        const visible=await frame.locator('#flashcard-definition').isVisible();
        await page.keyboard.press('Space');
        assert.equal(await frame.locator('#flashcard-definition').isVisible(),!visible,'mobile menu selection immediately enables Space');
      }
      counts.push({viewport,cards:cards.length});await context.close();
    }
    // Standalone routes work as direct links and keep the same quick controls.
    for(const route of ['/prototyper/ernaering.html?topic=flashcards','/prototyper/ernaering.html#flashcards']){
      const {page,frame,context}=await open({width:390,height:844},route);
      await frame.locator('#flip-flashcard').press('Space');assert.equal(await frame.locator('#flashcard-definition').isVisible(),true);
      await geometry(frame);
      const first=await id(frame);await frame.locator('#next-flashcard').click();const second=await id(frame);
      const before=await saved(page);await page.reload();await frame.locator('[data-flashcard]').waitFor();
      assert.ok(![first,second].includes(await id(frame)),'reload continues the partly completed deck');
      assert.equal((await saved(page)).flashcardRotation.seen.length,before.flashcardRotation.seen.length+1);
      await frame.locator('#menu-button').click();await frame.locator('#sources-button').click();await frame.locator('#reset-progress').click();await frame.locator('#confirm-reset').click();
      await frame.locator('[data-question]').waitFor();
      assert.equal((await saved(page)).flashcardRotation,undefined,'reset clears the separate concept rotation');
      await frame.locator('[data-topic="flashcards"]').click();await frame.locator('[data-flashcard]').waitFor();
      assert.match(await frame.locator('.task-number').innerText(),/^1\s*\/\s*63$/,'returning after reset starts a new concept cycle');
      await context.close();
    }
    // The complete glossary uses the exact same reviewed definitions as the deck.
    for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
      const {page,frame,context}=await open(viewport,'/naturfag.html#nutrition/all/concepts');
      const glossary=await frame.evaluate(async()=>{
        const {flashcards}=await import(new URL('ernaering/flashcards.js?v=20261101-4',location.href));
        return {cards:flashcards,terms:[...document.querySelectorAll('.concept-list dt')].map(el=>el.textContent),definitions:[...document.querySelectorAll('.concept-list dd')].map(el=>el.textContent)};
      });
      assert.deepEqual(glossary.terms,glossary.cards.map(card=>card.term),'glossary includes every term, in list order');
      assert.deepEqual(glossary.definitions,glossary.cards.map(card=>card.definition),'glossary includes every concise definition');
      assert.equal(await page.locator('[data-nutrition-view="bank"]').evaluate(el=>el.nextElementSibling?.dataset.nutritionView),'concepts','Begreper is adjacent to Oppgavebank');
      assert.equal(await page.locator('[data-nutrition-view="concepts"]').innerText(),'Begreper');
      assert.equal(await page.locator('[data-nutrition-view="concepts"]').getAttribute('aria-pressed'),'true');
      const before=await saved(page);
      await frame.locator('.concept-list dd').last().scrollIntoViewIfNeeded();
      const bounds=await frame.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,last:(()=>{const r=[...document.querySelectorAll('.concept-list dd')].at(-1).getBoundingClientRect();return {top:r.top,bottom:r.bottom};})(),height:innerHeight}));
      assert.ok(bounds.scrollWidth<=bounds.width+1,'glossary has no horizontal overflow');
      assert.ok(bounds.last.top>=0&&bounds.last.bottom<=bounds.height+1,'last glossary entry can be read on screen');
      if(artifactDir)await page.screenshot({path:path.join(artifactDir,viewport.width+'-glossary-bottom.png'),fullPage:false});
      await frame.locator('body').click({position:{x:5,y:5}});await page.keyboard.press('Space');await page.keyboard.press('ArrowRight');
      assert.equal(await frame.locator('[data-flashcard]').count(),0,'glossary ignores flashcard shortcuts');
      assert.deepEqual(await saved(page),before,'reading the glossary never changes practice history');
      if(viewport.width===390)await page.locator('#nfModulesMenu').click();
      await page.locator('[data-nutrition-view="bank"]').click();await frame.locator('#bank-list').waitFor();
      if(viewport.width===390)await page.locator('#nfModulesMenu').click();
      await page.locator('[data-nutrition-view="concepts"]').click();await frame.locator('.concept-list').waitFor();
      assert.equal(new URL(page.url()).hash,'#nutrition/all/concepts');
      await context.close();
    }
    for(const route of ['/prototyper/ernaering.html?view=concepts','/prototyper/ernaering.html#concepts']){
      const {page,frame,context}=await open({width:390,height:844},route);
      assert.equal(await frame.locator('.concept-list dt').count(),63);
      assert.equal(await frame.locator('#concepts-tab').getAttribute('aria-pressed'),'true');
      assert.equal(await frame.locator('#bank-tab').evaluate(el=>el.nextElementSibling.id),'concepts-tab');
      await context.close();
    }
    assert.deepEqual(errors,[],'no uncaught browser errors');
    console.log('PASS flashcards:',JSON.stringify(counts),'; full glossary, standalone routes, keyboard, cycles, persistence, score isolation, messages, theme and mobile navigation.');
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
