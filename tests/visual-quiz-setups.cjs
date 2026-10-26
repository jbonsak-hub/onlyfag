/* Visual setup and in-game navigation for the three multiple-choice quizzes.
   Every remote request is mocked; this never creates a public score/session. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((request,response)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep))return response.writeHead(403).end();
  try{response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');response.end(fs.readFileSync(file));}
  catch{response.writeHead(404).end();}
});
const quizzes=[
  {mode:'flags',url:'/geografi/flaggquiz.html',first:'flag-country-mc',second:'country-flag-mc'},
  {mode:'capitals',url:'/geografi/hovedstadsquiz.html',first:'country-capital-mc',second:'capital-country-mc'},
  {mode:'flagcapital',url:'/geografi/flagg-og-hovedstad.html',first:'flag-capital-mc',second:'capital-flag-mc'}
];
const regionIds=['world','asia','europe','northamerica','southamerica','oceania','africa'];
async function frames(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function capture(page,name){
  if(!process.env.VISUAL_QUIZ_SCREENSHOTS)return;
  fs.mkdirSync(process.env.VISUAL_QUIZ_SCREENSHOTS,{recursive:true});
  await page.screenshot({path:path.join(process.env.VISUAL_QUIZ_SCREENSHOTS,name+'.png'),fullPage:true});
}
async function noHorizontalOverflow(page,label){
  const overflow=await page.evaluate(()=>({document:document.documentElement.scrollWidth-innerWidth,body:document.body.scrollWidth-innerWidth}));
  assert(overflow.document<=1&&overflow.body<=1,label+' fits horizontally: '+JSON.stringify(overflow));
}
async function visibleChrome(page,label){
  const controls=page.locator('.quiz-page-header .quiz-page-menu,.quiz-page-header .quiz-page-theme,.quiz-page-header .geoquiz-language[data-game-language] button');
  await page.waitForFunction(()=>document.querySelector('.quiz-page-header .geoquiz-language[data-game-language] button'));
  const boxes=await controls.evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return {label:el.getAttribute('aria-label')||el.textContent,x:b.x,y:b.y,width:b.width,height:b.height,visible:getComputedStyle(el).display!=='none'&&b.width>0&&b.height>0};}));
  assert.equal(boxes.length,3,label+' offers menu, theme and language controls');
  for(const box of boxes){assert(box.visible,label+' visible '+box.label);assert(box.x>=-1&&box.y>=-1&&box.x+box.width<=page.viewportSize().width+1,label+' chrome inside viewport: '+JSON.stringify(box));}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const a=boxes[i],b=boxes[j],overlapX=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x),overlapY=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);
    assert(overlapX<=1||overlapY<=1,label+' navigation controls do not overlap');
  }
}
async function inspectSetup(page,quiz,label,{desktop=true,expectedWidth=220}={}){
  const setup=page.locator('.visual-quiz-setup');await setup.waitFor({state:'visible'});await frames(page);
  assert.equal(await setup.locator('.quiz-region-grid .streak-region-btn').count(),7,label+' has world and six continent cards');
  assert.deepEqual((await setup.locator('.quiz-region-grid .streak-region-btn').evaluateAll(els=>els.map(el=>el.dataset.region))).sort(),regionIds.slice().sort(),label+' preserves the seven region identifiers');
  assert.equal(await setup.locator('.quiz-region-icon').count(),7,label+' gives each region its own illustration');
  await page.waitForFunction(()=>[...document.querySelectorAll('.visual-quiz-setup img')].every(img=>img.complete&&img.naturalWidth>0));
  const counts=await setup.locator('.quiz-region-grid .streak-region-btn').evaluateAll(els=>els.map(el=>{
    let pool=worldCountriesForRegion(getWorldData().countries,el.dataset.region);
    if(document.body.dataset.quiz==='flags'||document.body.dataset.quiz==='flagcapital')pool=pool.filter(country=>country.flagCode);
    return {region:el.dataset.region,actual:Number(el.querySelector('small')?.textContent.match(/\d+/)?.[0]),expected:pool.length,pressed:el.getAttribute('aria-pressed')};
  }));
  for(const count of counts)assert.equal(count.actual,count.expected,label+' country count for '+count.region);
  assert.equal(counts.filter(count=>count.pressed==='true').length,1,label+' has exactly one accessible selected region');
  const directions=setup.locator('.quiz-direction-grid .streak-direction-btn');assert.equal(await directions.count(),2,label+' has two distinct question types');
  for(let index=0;index<2;index++){
    const direction=directions.nth(index);
    assert((await direction.getAttribute('aria-label'))?.trim(),label+' question type has an accessible name');
    assert.equal(await direction.locator('.quiz-question-preview').count(),1,label+' question type has a miniature quiz');
    assert.equal(await direction.locator('.quiz-preview-prompt').count(),1,label+' miniature contains its prompt');
    assert.equal(await direction.locator('.quiz-preview-options > span').count(),4,label+' miniature contains four answers');
    assert.equal(await direction.locator('button,input,a').count(),0,label+' miniature is a single selectable card');
  }
  assert.equal(await setup.locator('.quiz-region-section').count(),1,label+' regions have their own section');
  assert.equal(await setup.locator('.quiz-direction-section').count(),1,label+' question type has its own section');
  assert.equal(await setup.getByRole('button',{name:/Topp\s*10|Top\s*10/i}).count(),0,label+' setup omits ranking controls');
  assert.equal(await page.locator('.quiz-in-game-top-ten:visible').count(),0,label+' in-game ranking stays out of the setup');
  await noHorizontalOverflow(page,label);await visibleChrome(page,label);
  if(desktop){
    const bounds=await page.evaluate(()=>{
      const setup=document.querySelector('.visual-quiz-setup'),box=setup.getBoundingClientRect(),rail=document.querySelector('.quiz-control-rail').getBoundingClientRect();
      const scrolls=['html','body','main.content','.quiz-fullscreen-body','.visual-quiz-setup','.quiz-control-rail'].map(selector=>{const el=document.querySelector(selector);return {selector,overflow:el.scrollHeight-el.clientHeight};});
      const buttons=[...setup.querySelectorAll('button')].map(el=>{const b=el.getBoundingClientRect();return {text:el.textContent.trim(),top:b.top,bottom:b.bottom,left:b.left,right:b.right};});
      return {box:{top:box.top,bottom:box.bottom},rail:{left:rail.left,width:rail.width},scrolls,buttons,height:innerHeight,width:innerWidth};
    });
    assert(Math.abs(bounds.rail.width-expectedWidth)<=1,label+' sidebar uses '+expectedWidth+'px: '+JSON.stringify(bounds.rail));
    assert(Math.abs(bounds.rail.left)<=1,label+' sidebar stays on the left');
    assert(bounds.box.top>=-1&&bounds.box.bottom<=bounds.height+1,label+' entire setup fits at 100% zoom: '+JSON.stringify(bounds.box));
    assert(bounds.scrolls.every(el=>el.overflow<=1),label+' requires no scrolling: '+JSON.stringify(bounds.scrolls));
    assert(bounds.buttons.every(box=>box.top>=0&&box.bottom<=bounds.height+1&&box.left>=0&&box.right<=bounds.width+1),label+' all choices and Start are visible together');
  }
}
async function chooseSetup(page,quiz,label){
  const setup=page.locator('.visual-quiz-setup'),asia=setup.locator('[data-region="asia"]'),europe=setup.locator('[data-region="europe"]'),directions=setup.locator('.quiz-direction-grid .streak-direction-btn');
  await asia.focus();await page.keyboard.press('Space');
  assert.equal(await setup.locator('.world-region').inputValue(),'asia',label+' keyboard selects a continent');
  await directions.nth(1).click();assert.equal(await setup.locator('.world-submode').inputValue(),quiz.second,label+' selects the second question direction');
  assert.equal(await setup.locator('.world-region').inputValue(),'asia',label+' question type does not reset the region');
  await europe.click();assert.equal(await setup.locator('.world-region').inputValue(),'europe',label+' selects Europe');
  assert.equal(await setup.locator('.world-submode').inputValue(),quiz.second,label+' region selection does not reset the question type');
  await directions.nth(0).click();assert.equal(await setup.locator('.world-submode').inputValue(),quiz.first);
  await directions.nth(1).focus();await page.keyboard.press('Space');
  assert.equal(await setup.locator('.world-submode').inputValue(),quiz.second,label+' keyboard selects the question type');
  assert.equal(await europe.getAttribute('aria-pressed'),'true');assert.equal(await directions.nth(1).getAttribute('aria-pressed'),'true');
  assert.equal(await setup.locator('.quiz-region-grid [aria-pressed="true"]').count(),1);assert.equal(await setup.locator('.quiz-direction-grid [aria-pressed="true"]').count(),1);
}
async function exerciseGame(page,quiz,label,sessions,boards){
  await page.locator('.visual-quiz-setup .streak-start-btn').click();await page.locator('.world-game').waitFor({state:'visible'});await frames(page);
  const current=await page.evaluate(()=>({mode:worldTrainerState.mode,region:worldTrainerState.regionId,variant:worldTrainerState.submode,run:worldTrainerState.runId}));
  assert.deepEqual({mode:current.mode,region:current.region,variant:current.variant},{mode:quiz.mode,region:'europe',variant:quiz.second},label+' starts the exact selected round');
  assert.equal(sessions.at(-1).game,quiz.mode);assert.equal(sessions.at(-1).region,'europe');assert.equal(sessions.at(-1).variant,quiz.second,label+' server receives the selected direction');
  const footer=page.locator('.quiz-layout-footer'),top=page.locator('.quiz-in-game-top-ten');await top.waitFor({state:'visible'});
  assert(await footer.locator('.quiz-in-game-top-ten').count(),label+' ranking belongs to the in-game footer');
  const placement=await top.evaluate(el=>{const back=el.parentElement.querySelector('.quiz-page-back'),b=back.getBoundingClientRect(),t=el.getBoundingClientRect();return {sameFooter:!!back,next:el.nextElementSibling===back,above:t.bottom<=b.top+1,inside:t.left>=0&&t.right<=innerWidth};});
  assert(placement.sameFooter&&placement.next&&placement.above&&placement.inside,label+' Top 10 is immediately above navigation');
  await visibleChrome(page,label+' game');await noHorizontalOverflow(page,label+' game');
  await page.evaluate(()=>{window.__visualQuizGame=document.querySelector('.world-game');});
  const response=page.waitForResponse(response=>new URL(response.url()).hostname==='onlyfag-geography-scores.jack-bonsak.workers.dev'&&new URL(response.url()).pathname==='/scores'&&response.request().method()==='GET');
  await top.click();await response;
  const board=page.locator('#geo-online-board[open]');await board.waitFor({state:'visible'});await board.getByText('UI Smoke',{exact:true}).waitFor();
  assert.equal(boards.at(-1).game,quiz.mode,label+' ranking uses the active quiz');assert.equal(boards.at(-1).region,'europe',label+' ranking uses the active region');assert.equal(boards.at(-1).variant,quiz.second,label+' ranking uses the active question direction');
  await board.locator('.mapwiz-top-ten-close').click();await board.waitFor({state:'detached'});
  assert(await page.evaluate(run=>worldTrainerState.runId===run&&!worldTrainerState.ended&&document.querySelector('.world-game')===window.__visualQuizGame,current.run),label+' opening rankings preserves the round');
  await capture(page,label+'-playing');
  await footer.locator('.quiz-page-back').click();await page.locator('.visual-quiz-setup').waitFor({state:'visible'});await frames(page);
  assert.equal(await page.locator('.world-game').count(),0,label+' navigation returns to setup');
  assert.equal(await page.locator('.quiz-in-game-top-ten:visible').count(),0,label+' ranking disappears again in setup');
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  const errors=[],missing=[],sessions=[],boards=[];
  async function contextFor(viewport,{english=false,dark=false,width=null}={}){
    const context=await browser.newContext({viewport});
    await context.addInitScript(({english,dark,width})=>{
      localStorage.setItem('onlyfag-geo-language',english?'en':'no');localStorage.setItem('geoDarkMode',dark?'1':'0');
      if(width!==null)localStorage.setItem('onlyfag-geography-panel-width',String(width));
    },{english,dark,width});
    await context.route('**/*',route=>{
      const request=route.request(),url=request.url();
      if(url.startsWith('https://onlyfag-geography-scores.jack-bonsak.workers.dev/')){
        if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
        const endpoint=new URL(url),headers={'Access-Control-Allow-Origin':'*'};
        if(endpoint.pathname==='/session'){sessions.push(JSON.parse(request.postData()));return route.fulfill({status:503,contentType:'application/json',headers,body:'{"error":"unavailable"}'});}
        if(endpoint.pathname==='/scores'){boards.push(JSON.parse(endpoint.searchParams.get('config')));return route.fulfill({status:200,contentType:'application/json',headers,body:'{"rows":[{"nickname":"UI Smoke","score":3,"time_ms":2000}]}'});}
        return route.fulfill({status:503,contentType:'application/json',headers,body:'{"error":"unavailable"}'});
      }
      if(url.startsWith(base)||/^(data|blob):/.test(url))return /\/assets\/analytics\.js/.test(url)?route.abort():route.continue();
      return route.abort();
    });
    const page=await context.newPage();page.setDefaultTimeout(10000);
    page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)missing.push(response.url());});
    return {context,page};
  }
  try{
    for(const viewport of [{width:1366,height:646},{width:1280,height:720},{width:1440,height:900},{width:390,height:844}]){
      const {context,page}=await contextFor(viewport);
      for(const quiz of quizzes){
        const label=quiz.mode+'-'+viewport.width+'x'+viewport.height;
        await page.goto(base+quiz.url);await inspectSetup(page,quiz,label,{desktop:viewport.width>700});await chooseSetup(page,quiz,label);await capture(page,label+'-setup');
        if(viewport.width===1366||viewport.width===390)await exerciseGame(page,quiz,label,sessions,boards);
      }
      await context.close();
    }
    for(const viewport of [{width:1366,height:646},{width:390,height:844}]){
      const {context,page}=await contextFor(viewport,{english:true,dark:true});
      for(const quiz of quizzes){
        const label=quiz.mode+'-'+viewport.width+'-english-dark';await page.goto(base+quiz.url);await page.waitForFunction(()=>window.QuizLanguage?.language==='en');
        assert(await page.locator('body').evaluate(el=>el.classList.contains('dark-mode')),label+' retains dark mode');
        await inspectSetup(page,quiz,label,{desktop:viewport.width>700});await chooseSetup(page,quiz,label);await capture(page,label);
      }
      await context.close();
    }
    const preferred=await contextFor({width:1366,height:768},{width:300});
    await preferred.page.goto(base+quizzes[1].url);await inspectSetup(preferred.page,quizzes[1],'saved-sidebar-width',{expectedWidth:300});await preferred.context.close();
    assert.deepEqual(errors,[],'No page errors');assert.deepEqual(missing,[],'All local assets load');
    console.log('PASS visual quiz setups: seven illustrated regions, independent miniature question types, compact default/sidebar preference, no desktop scrolling, keyboard/light/dark/English/mobile, and in-game Top 10 uses the selected round without interrupting it');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
