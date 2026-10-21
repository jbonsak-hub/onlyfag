const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{try{const file=path.join(root,new URL(req.url,'http://localhost').pathname);res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/',errors=[];
 const browser=await pw.chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  await context.route('**/*',r=>r.request().url().startsWith(base)||/^(data|blob):/.test(r.request().url())?r.continue():r.abort());
  const page=await context.newPage();page.on('dialog',d=>d.dismiss());
  for(const language of ['no','en']){
   await page.goto(base+'geografi.html#verden-quiz');await page.getByRole('button',{name:language==='no'?'Norsk':'English',exact:true}).click();
   const order=await page.locator('.geoquiz-mode-row').evaluateAll(rows=>rows.map(r=>r.getAttribute('onclick').match(/geografi\/([^']+)/)[1]));assert.deepEqual(order.slice(4,7),['geoguessr.html','worldle.html','tradle.html']);
   for(const [file,label]of [['flaggquiz',language==='no'?'← Flaggquiz':'← Flags'],['hovedstadsquiz',language==='no'?'← Hovedsteder':'← Capitals'],['flagg-og-hovedstad',language==='no'?'← Flagg+Hovedstad':'← Flags+Capitals']]){
    await page.goto(base+'geografi/'+file+'.html');await page.getByRole('button',{name:'Start',exact:true}).click();const wrong=await page.evaluate(()=>worldTrainerState.current.options.findIndex(o=>!worldTrainerState.current.isCorrect(o)));await page.locator('.world-option').nth(wrong).click();await page.waitForFunction(()=>worldTrainerState.ended);
    await page.waitForFunction(label=>document.querySelector('.quiz-page-back').textContent===label,label);await page.locator('.quiz-page-back').click();await page.locator('.streak-setup').waitFor();assert.ok(page.url().endsWith(file+'.html'),'Setup stays in same game');assert.equal(await page.locator('.streak-region-btn').count(),7);
    await page.getByRole('button',{name:'Start',exact:true}).click();const right=await page.evaluate(()=>worldTrainerState.current.options.findIndex(o=>worldTrainerState.current.isCorrect(o)));await page.locator('.world-option').nth(right).click();assert.equal(await page.evaluate(()=>worldTrainerState.score),1);
   }
   for(const viewport of [{width:390,height:844},{width:360,height:740},{width:844,height:390}]){
    await page.setViewportSize(viewport);
    for(const game of ['worldle','tradle']){
     await page.goto(base+'geografi/'+game+'.html');const surface=game==='worldle'?page:page.frames().find(f=>f!==page.mainFrame());
     await surface.locator('.quiz-mobile-answers button').first().waitFor();assert.equal(await surface.locator('.quiz-mobile-answers button').count(),6);
     const target=await surface.evaluate(game=>game==='worldle'?worldTrainerState.target.country:state.tradle.target.country,game);
     assert.equal(await surface.locator(game==='worldle'?'#worldle-answer':'#tradleGuess').isVisible(),false);
     const buttons=surface.locator('.quiz-mobile-answers button'),names=await buttons.allTextContents();assert.equal(new Set(names).size,6);
     const wrongIndex=await buttons.evaluateAll((els,target)=>els.findIndex(e=>e.dataset.country!==target),target);await buttons.nth(wrongIndex).click();assert.ok(await buttons.nth(wrongIndex).isDisabled());assert.deepEqual(await buttons.allTextContents(),names,'Wrong guess keeps same choices');
     await page.setViewportSize({width:1366,height:768});assert.ok(await surface.locator(game==='worldle'?'#worldle-answer':'#tradleGuess').isVisible(),'Desktop retains typed answer');assert.equal(await surface.locator('.quiz-mobile-answers').isVisible(),false);
     await page.setViewportSize(viewport);assert.deepEqual(await buttons.allTextContents(),names,'Resize retains choices');
     await surface.locator('.quiz-mobile-answers button').evaluateAll((els,target)=>els.find(e=>e.dataset.country===target).click(),target);
     assert.ok(await surface.evaluate(game=>game==='worldle'?worldTrainerState.locked:state.tradle.solved,game));assert.equal(await surface.locator('.quiz-mobile-answers button:enabled').count(),0);
     await surface.locator(game==='worldle'?'.worldle-next':'#tradleNew').click();await surface.waitForFunction(()=>document.querySelectorAll('.quiz-mobile-answers button:enabled').length===6);
     assert.ok(await surface.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No mobile horizontal overflow');
     if(process.env.LAYOUT_SCREENSHOTS&&language==='en'&&viewport.width===390){fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,game+'-mobile-choices.png')});}
    }
   }
   await page.setViewportSize({width:390,height:844});
  }
  await page.setViewportSize({width:1366,height:768});await page.goto(base+'geografi/flaggquiz.html');await page.getByRole('button',{name:'Start',exact:true}).click();assert.equal(await page.locator('.quiz-page-back').getAttribute('href'),'../geografi.html#verden-quiz','Desktop overview navigation remains');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({mobileSetupReturn:3,languages:2,mobileViewports:3,worldleChoices:6,tradleChoices:6,stableChoices:true,normalGuessHistory:true,desktopTyping:true,order:true,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
