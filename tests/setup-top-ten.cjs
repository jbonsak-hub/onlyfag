/* Selection-aware setup rankings; all API traffic is mocked, never public. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp'};
const server=http.createServer((request,response)=>{try{const file=path.join(root,new URL(request.url,'http://localhost').pathname);response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');response.end(fs.readFileSync(file));}catch(_){response.writeHead(404).end();}});
(async()=>{
 const {create,publicQuestion}=await import('../services/geography-scores/rules.mjs');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'}),boards=[],sessions=[],errors=[];
 const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 async function context(viewport,{offline=false,dark=false,english=false}={}){
  const c=await browser.newContext({viewport});await c.addInitScript(({dark,english})=>{localStorage.setItem('geoDarkMode',dark?'1':'0');localStorage.setItem('onlyfag-geo-language',english?'en':'no');},{dark,english});
  await c.route('**/*',route=>{
   const request=route.request(),url=request.url(),endpoint=new URL(url),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Authorization'};
   if(endpoint.hostname==='onlyfag-geography-scores.jack-bonsak.workers.dev'){
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
    if(endpoint.pathname==='/scores'){const cfg=JSON.parse(endpoint.searchParams.get('config'));boards.push(cfg);return route.fulfill({headers,contentType:'application/json',body:JSON.stringify({rows:[{nickname:'Selection fixture',score:8,time_ms:12000}]})});}
    if(endpoint.pathname==='/session'){const cfg=JSON.parse(request.postData()),s=create(cfg,Date.now());sessions.push(cfg);return route.fulfill({status:201,headers,contentType:'application/json',body:JSON.stringify({token:'a'.repeat(64),config:s.config,question:publicQuestion(s),questions:s.plan,complete:false,total:0,index:0})});}
    return route.fulfill({status:503,headers,contentType:'application/json',body:'{"error":"unavailable"}'});
   }
   if(url.startsWith(base)){
    if(offline&&/\/score-service(?:-[a-f0-9]+)?\.js$/.test(endpoint.pathname))return route.fulfill({contentType:'text/javascript',body:'window.GEO_SCORE_API="";'});
    // Exercise edited source files even before the root agent versions bundles.
    const edited=endpoint.pathname.match(/\/quiz-assets\/(core|highscores|online-highscores|quiz-layout)-[a-f0-9]{12}\.(js|css)$/);
    if(edited&&!(edited[1]==='quiz-layout'&&edited[2]==='js'))return route.fulfill({contentType:mime['.'+edited[2]],body:fs.readFileSync(path.join(root,'assets/geography',edited[1]+'.'+edited[2]),'utf8')});
    return route.continue();
   }
   return /^(data|blob):/.test(url)?route.continue():route.abort();
  });
  const page=await c.newPage();page.on('pageerror',e=>errors.push(e.message));return {c,page};
 }
 async function ranking(page,expected){
  const request=page.waitForResponse(r=>new URL(r.url()).pathname==='/scores'&&r.request().method()==='GET');
  await page.locator('.quiz-setup-top-ten').click();await request;await page.locator('#geo-online-board[open]').getByText('Selection fixture').waitFor();
  assert.deepEqual(boards.at(-1),expected);assert.equal(await page.locator('.geo-score-dialog').count(),1);
  await page.locator('#geo-online-board .mapwiz-top-ten-close').click();await page.locator('#geo-online-board').waitFor({state:'detached'});
 }
 try{
  const {c,page}=await context({width:1366,height:646});
  for(const game of ['flags','capitals']){
   await page.goto(base+'/geografi/'+(game==='flags'?'flaggquiz':'hovedstadsquiz')+'.html');await page.locator('.quiz-setup-top-ten').waitFor();
   assert.equal(await page.locator('.quiz-setup-top-ten').count(),1);
   const dirs=game==='flags'?['flag-country-mc','country-flag-mc']:['country-capital-mc','capital-country-mc'];
   for(const region of ['world','asia','europe','northamerica','southamerica','oceania','africa'])for(let index=0;index<2;index++){
    await page.locator('[data-region="'+region+'"]').click();await page.locator('.quiz-direction-grid .streak-direction-btn').nth(index).click();
    if(game==='flags')await ranking(page,{game,region,variant:dirs[index],language:'no'});
    else for(const display of ['both','name','flag']){
     await page.evaluate(display=>{const name=document.getElementById('capital-show-name'),flag=document.getElementById('capital-show-flag');name.disabled=false;flag.disabled=false;name.checked=display!=='flag';flag.checked=display!=='name';changeCapitalDisplay(name);},display);
     await ranking(page,{game,region,variant:dirs[index],countryDisplay:display,language:'no'});
    }
   }
   assert.equal(sessions.length,game==='flags'?0:1,'Opening rankings does not start a session');
   // Force the old run to remain active while presenting a new setup: the
   // selected ranking must never fall back to that stale run's config.
   await page.locator('[data-region="europe"]').click();await page.locator('.streak-start-btn').click();await page.locator('.world-game').waitFor();
   const runId=await page.evaluate(()=>worldTrainerState.runId);
   await page.evaluate(game=>{getWorldApp(game).innerHTML=renderStreakSetup(game);},game);
   await page.locator('[data-region="asia"]').click();
   await ranking(page,{game,region:'asia',variant:dirs[0],...(game==='capitals'?{countryDisplay:'both'}:{}),language:'no'});
   assert.equal(await page.evaluate(()=>worldTrainerState.runId),runId,'Ranking leaves the active run alone');
  }
  await c.close();
  for(const viewport of [{width:1280,height:720},{width:1366,height:646},{width:390,height:844},{width:320,height:700}]){
   const {c,page}=await context(viewport,{dark:true,english:true});
   for(const game of ['flags','capitals']){
    await page.goto(base+'/geografi/'+(game==='flags'?'flaggquiz':'hovedstadsquiz')+'.html');await page.locator('.quiz-setup-top-ten').waitFor();await frame(page);
    assert.equal(await page.evaluate(()=>QuizLanguage.language),'en');assert(await page.locator('body').evaluate(el=>el.classList.contains('dark-mode')));
    const box=await page.evaluate(()=>{const b=document.querySelector('.quiz-setup-top-ten').getBoundingClientRect(),s=document.querySelector('.streak-start-btn').getBoundingClientRect(),a=document.querySelector('.quiz-setup-actions').getBoundingClientRect(),p=document.querySelector('.visual-quiz-setup').getBoundingClientRect();return {b:b.toJSON(),s:s.toJSON(),a:a.toJSON(),p:p.toJSON(),overflow:document.documentElement.scrollWidth-innerWidth,height:innerHeight};});
    assert(box.overflow<=1,game+' setup fits '+viewport.width);assert(Math.abs(box.b.right-box.a.right)<=1,'Compact button stays on the right');assert(Math.abs((box.b.y+box.b.height/2)-(box.s.y+box.s.height/2))<=2,'Top10 aligns with Start');
    if(viewport.width>700)assert(box.p.top>=0&&box.p.bottom<=box.height+1,'No desktop setup scrolling');
    if(process.env.SETUP_RANKING_SCREENSHOTS){fs.mkdirSync(process.env.SETUP_RANKING_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.SETUP_RANKING_SCREENSHOTS,game+'-'+viewport.width+'.png'),fullPage:true});}
   }
   await c.close();
  }
  const fallback=await context({width:1366,height:646},{offline:true});await fallback.page.addInitScript(()=>localStorage.setItem('geoHighscoresV1',JSON.stringify({'flags|world':[{name:'Earlier local score',rank:[3],scoreText:'3 på rad',timeSec:8,created:1}]})));
  await fallback.page.goto(base+'/geografi/flaggquiz.html');await fallback.page.locator('.quiz-setup-top-ten').click();await fallback.page.locator('#geo-hs-modal:not([hidden])').getByText('Earlier local score').waitFor();
  await fallback.page.evaluate(()=>geoHsClose());await fallback.page.locator('[data-region="asia"]').click();await fallback.page.locator('.quiz-setup-top-ten').click();assert(await fallback.page.locator('#geo-hs-modal').isVisible());assert.match(await fallback.page.locator('#geo-hs-body').innerText(),/Ingen resultater/);await fallback.c.close();
  assert.deepEqual(errors,[]);console.log(JSON.stringify({games:2,selectedBoards:56,staleRunConfig:true,localScoresPreserved:true,dark:true,english:true,mobile:true,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
