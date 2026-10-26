/* Capital clues and answers share one display choice. All API calls use a
   local Worker and an in-memory database; no public results are submitted. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((request,response)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep))return response.writeHead(403).end();
  try{response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');response.end(fs.readFileSync(file));}
  catch{response.writeHead(404).end();}
});
const variants=['country-capital-mc','capital-country-mc'];
async function frames(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function screenshot(page,name){
  if(!process.env.CAPITAL_DISPLAY_SCREENSHOTS)return;
  fs.mkdirSync(process.env.CAPITAL_DISPLAY_SCREENSHOTS,{recursive:true});
  await page.screenshot({path:path.join(process.env.CAPITAL_DISPLAY_SCREENSHOTS,name+'.png'),fullPage:true});
}
async function setDisplay(page,display){
  const name=page.locator('#capital-show-name'),flag=page.locator('#capital-show-flag');
  assert(await name.isChecked()&&await flag.isChecked(),'Every new capital setup defaults to name and flag');
  if(display==='name')await flag.uncheck();
  else if(display==='flag')await name.uncheck();
  assert.equal(await page.locator('.world-country-display').inputValue(),display);
  assert.equal(await name.isChecked(),display!=='flag');assert.equal(await flag.isChecked(),display!=='name');
}
async function checkPreview(page,display,label){
  const cards=page.locator('.quiz-direction-grid .streak-direction-btn');
  const forward=cards.nth(0).locator('.quiz-preview-prompt'),reverse=cards.nth(1).locator('.quiz-preview-options > span');
  assert.equal(await forward.locator('img').count(),display==='name'?0:1,label+' forward miniature uses the chosen flag clue');
  assert.equal(/Norge/.test(await forward.innerText()),display!=='flag',label+' forward miniature uses the chosen country name');
  assert.equal(await reverse.count(),4,label+' reverse miniature keeps four answers');
  for(const option of await reverse.all()){
    assert.equal(await option.locator('img').count(),display==='name'?0:1,label+' reverse miniature uses the chosen flag answer');
    assert.equal(Boolean((await option.innerText()).trim()),display!=='flag',label+' reverse miniature uses the chosen country name answer');
  }
  await page.waitForFunction(()=>[...document.querySelectorAll('.visual-quiz-setup img')].every(img=>img.complete&&img.naturalWidth>0));
}
async function checkQuestion(page,display,variant,label){
  await page.locator('.world-option').first().waitFor();await frames(page);
  const report=await page.evaluate(()=>{
    const s=worldTrainerState,correct=s.current.options.find(option=>s.current.isCorrect(option));
    return {mode:s.mode,display:s.countryDisplay||'both',variant:s.submode,target:correct.country,run:s.runId,score:s.score};
  });
  assert.equal(report.mode,'capitals',label+' stays in the capital quiz');assert.equal(report.display,display,label+' retains its display choice');assert.equal(report.variant,variant);
  const prompt=page.locator('.world-prompt'),options=page.locator('.world-option');assert.equal(await options.count(),4,label+' presents four answers');
  if(variant==='country-capital-mc'){
    assert.equal(await prompt.locator('.quiz-flag-img').count(),display==='name'?0:1,label+' prompt flag is controlled independently');
    assert.equal((await prompt.innerText()).includes(report.target),display!=='flag',label+' prompt country name is controlled independently');
    assert.equal(await options.locator('.quiz-flag-img').count(),0,label+' forward answers remain capital names');
    assert((await options.allTextContents()).every(text=>text.trim()),label+' every capital answer is named');
  }else{
    assert.equal(await prompt.locator('.quiz-flag-img').count(),0,label+' reverse prompt stays a capital name');
    const countries=await page.evaluate(()=>worldTrainerState.current.options.map(option=>option.country));
    for(let index=0;index<4;index++){
      assert.equal(await options.nth(index).locator('.quiz-flag-img').count(),display==='name'?0:1,label+' reverse answer flag follows the display choice');
      assert.equal((await options.nth(index).innerText()).includes(countries[index]),display!=='flag',label+' reverse answer name follows the display choice');
    }
  }
  await page.waitForFunction(()=>[...document.querySelectorAll('.world-card img')].every(img=>img.complete&&img.naturalWidth>0));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' fits the viewport');
  return report;
}
(async()=>{
  const {default:worker}=await import('../services/geography-scores/worker.mjs'),{board}=await import('../services/geography-scores/rules.mjs');
  const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(root,'services/geography-scores/schema.sql'),'utf8'));
  const wrap=(sql,args=[])=>({bind(...values){return wrap(sql,values);},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}});
  const env={DB:{prepare:sql=>wrap(sql)},RATE_SECRET:'capital-display-local-test',ALLOW_LOCAL:'true'};
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  const errors=[],missing=[],sessions=[],boards=[];
  let failSession=false;
  try{
    const context=await browser.newContext({viewport:{width:1366,height:646}});
    await context.addInitScript(()=>{localStorage.setItem('onlyfag-geo-language','no');localStorage.setItem('geoDarkMode','0');});
    await context.route('**/*',async route=>{
      const request=route.request(),url=request.url();
      if(/\/score-service(?:-[a-f0-9]+)?\.js/.test(url))return route.fulfill({contentType:'text/javascript',body:"window.GEO_SCORE_API='https://capital-scores.test';"});
      if(url.startsWith('https://capital-scores.test')){
        const endpoint=new URL(url);
        if(endpoint.pathname==='/session'&&request.method()==='POST'){
          sessions.push(JSON.parse(request.postData()));
          if(failSession)return route.fulfill({status:503,headers:{'Access-Control-Allow-Origin':base},contentType:'application/json',body:'{"error":"unavailable"}'});
        }
        if(endpoint.pathname==='/scores'&&request.method()==='GET')boards.push(JSON.parse(endpoint.searchParams.get('config')));
        const response=await worker.fetch(new Request(url,{method:request.method(),headers:{...request.headers(),'CF-Connecting-IP':'192.0.2.77'},...(request.postData()?{body:request.postData()}:{})}),env);
        return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
      }
      if(url.startsWith(base)||/^(data|blob):/.test(url))return /\/assets\/analytics\.js/.test(url)?route.abort():route.continue();
      return route.abort();
    });
    const page=await context.newPage();page.setDefaultTimeout(10000);
    page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)missing.push(response.url());});
    await page.goto(base+'/geografi.html#verden-quiz');
    assert.equal(await page.evaluate(()=>Object.hasOwn(window.GEO_QUIZ_ROUTES,'flagcapital')),false,'The removed quiz is no longer a navigation route');
    assert.equal(await page.locator('[onclick*="flagcapital"],a[href*="flagg-og-hovedstad"]').count(),0,'The overview offers no standalone flag/capital quiz');
    assert(!/Flagg\s*[↔+]|Flagg\/hovedstad/.test(await page.locator('#verden-quiz').innerText()),'The overview has no obsolete module label');
    await page.goto(base+'/geografi/flagg-og-hovedstad.html');await page.waitForURL('**/hovedstadsquiz.html');
    await page.locator('.capital-display-options').waitFor();assert.equal(await page.locator('body').getAttribute('data-quiz'),'capitals','An old link opens the combined capital setup');
    // Try clearing the sole remaining choice using a real DOM click. A disabled
    // checkbox or a restored check is valid; a blank clue is never accepted.
    await page.locator('#capital-show-flag').uncheck();await page.locator('#capital-show-name').evaluate(el=>el.click());
    assert(await page.locator('#capital-show-name').isChecked(),'The only remaining country name cannot be unchecked');assert.equal(await page.locator('.world-country-display').inputValue(),'name');
    await page.locator('#capital-show-flag').check();await page.locator('#capital-show-name').uncheck();await page.locator('#capital-show-flag').evaluate(el=>el.click());
    assert(await page.locator('#capital-show-flag').isChecked(),'The only remaining flag cannot be unchecked');assert.equal(await page.locator('.world-country-display').inputValue(),'flag');
    for(const offline of [false,true])for(const display of ['both','name','flag'])for(const [direction,variant] of variants.entries()){
      failSession=offline;
      const label=(offline?'offline':'online')+'-'+display+'-'+direction;
      if(offline&&display==='flag')await page.setViewportSize({width:390,height:844});else await page.setViewportSize({width:1366,height:646});
      await page.goto(base+'/geografi/hovedstadsquiz.html');await page.locator('.capital-display-options').waitFor();
      assert(!/Velg region og spørsmålstype\./.test(await page.locator('.visual-quiz-setup').innerText()),label+' omits the redundant setup instruction');
      await setDisplay(page,display);await checkPreview(page,display,label);
      await page.locator('.quiz-region-grid [data-region="europe"]').click();await page.locator('.quiz-direction-grid .streak-direction-btn').nth(direction).click();
      assert.equal(await page.locator('.world-country-display').inputValue(),display,label+' selecting region and direction does not reset display');
      await page.locator('.streak-start-btn').click();await page.locator('.world-game').waitFor();
      const report=await checkQuestion(page,display,variant,label),session=sessions.at(-1);
      assert.equal(session.game,'capitals');assert.equal(session.region,'europe');assert.equal(session.variant,variant);assert.equal(session.countryDisplay||'both',display,label+' sends the chosen country clues to the score service');
      if(offline)assert(await page.locator('#geo-online-notice').isVisible(),label+' explicitly continues offline');
      else{
        const correct=await page.evaluate(()=>worldTrainerState.current.options.findIndex(option=>worldTrainerState.current.isCorrect(option)));
        await page.locator('.world-option').nth(correct).click();await page.waitForFunction(()=>worldTrainerState.score===1&&!worldTrainerState.answerLocked);
        await checkQuestion(page,display,variant,label+' next');
      }
      const run=await page.evaluate(()=>({id:worldTrainerState.runId,score:worldTrainerState.score}));
      await page.locator('.quiz-in-game-top-ten').click();await page.locator('#geo-online-board[open]').waitFor();
      await page.waitForFunction(()=>document.querySelector('#geo-online-content')?.textContent.trim());
      const ranking=boards.at(-1);assert.equal(ranking.game,'capitals');assert.equal(ranking.region,'europe');assert.equal(ranking.variant,variant);assert.equal(ranking.countryDisplay||'both',display,label+' ranking follows the exact chosen clue combination');
      if(display==='flag')assert.equal(board(ranking),board({game:'flagcapital',region:'europe',variant:direction?'capital-flag-mc':'flag-capital-mc'}),label+' retains the former matching flag/capital ranking');
      await page.locator('#geo-online-board .mapwiz-top-ten-close').click();
      assert(await page.evaluate(run=>worldTrainerState.runId===run.id&&worldTrainerState.score===run.score&&!worldTrainerState.ended,run),label+' ranking does not reset the game');
      assert(report.run===run.id,label+' stays in one run');await screenshot(page,label);
      await page.locator('.quiz-layout-footer .quiz-page-back').click();await page.locator('.capital-display-options').waitFor();
      assert(await page.locator('#capital-show-name').isChecked()&&await page.locator('#capital-show-flag').isChecked(),label+' a fresh setup returns to the requested default');
    }
    await context.close();assert.deepEqual(errors,[],'No page errors');assert.deepEqual(missing,[],'Every local dependency loads');
    assert.equal(db.prepare('SELECT COUNT(*) n FROM scores').get().n,0,'The regression never publishes a score');
    console.log('PASS capital display: both/name/flag in both directions online and offline, minimum one choice, synchronized previews, current/legacy ranking identities, actual clues/answers, and retired module navigation');
  }finally{await browser.close();db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
