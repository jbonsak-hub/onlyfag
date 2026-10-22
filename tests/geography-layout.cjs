const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
require('node:child_process').execFileSync(process.execPath, [path.join(root,'scripts/build-geography-quiz-assets.cjs'),'--check']);
const routes = JSON.parse(fs.readFileSync(path.join(root,'assets/geography/routes.js'),'utf8').match(/window.GEO_QUIZ_ROUTES=([\s\S]*);/)[1]);
// Click-map pages have their own navigation and dedicated Kart/Statle tests.
const pages = Object.entries(routes).filter(([mode]) => !['statle','fylker','kart','openguessr'].includes(mode));
const framed = ['globle','travle','tradle','geogrid'];
const server = http.createServer((req,res) => {
 const file = path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 try {res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(fs.readFileSync(file));}
 catch {res.writeHead(404);res.end('missing');}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined});
 try {
 const context=await browser.newContext(); const errors=[];
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 await context.route('**/*',r=>/score-service(?:-[a-f0-9]+)?\.js/.test(r.request().url())?r.fulfill({contentType:'text/javascript',body:'window.GEO_SCORE_API="";'}):r.request().url().startsWith(base)||/^(data|blob):/.test(r.request().url())?r.continue():r.abort());
 const page=await context.newPage();page.setDefaultTimeout(8000);page.on('dialog',d=>d.dismiss());
 const checkBox = async (scope,selector,minimumWidth=1) => {
  const rect=await scope.locator(selector).first().evaluate(e=>e.getBoundingClientRect().toJSON());
  const width=await scope.evaluate(()=>innerWidth);
  assert.ok(rect.width>=minimumWidth && rect.height>0,selector+' must be visible '+JSON.stringify(rect));
  assert.ok(rect.x>=-1&&rect.right<=width+1,selector+' must fit '+JSON.stringify(rect)); return rect;
 };
 for (const viewport of [{width:1366,height:643},{width:390,height:844},{width:360,height:740},{width:844,height:390}]) {
  await page.setViewportSize(viewport);
  for(const [mode,[file]] of pages){
   await page.goto(base+file);await page.waitForTimeout(100);
   const frame=framed.includes(mode)?page.frames().find(f=>f!==page.mainFrame()):page.mainFrame();
   if(framed.includes(mode))await frame.locator('[data-quiz-layout]').waitFor();
   assert.equal(await frame.locator('a.quiz-home').count(),0,'No logo row in quiz controls');
   const nav=await frame.locator(framed.includes(mode)?'.quiz-frame-nav':'.quiz-page-header').evaluate(e=>getComputedStyle(e).position);
   assert.notEqual(nav,'fixed','No full-width fixed topbar');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Host overflow '+file);
   assert.ok(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Frame overflow '+file);
   await frame.locator('.quiz-page-menu').click();assert.ok(await page.locator('body').evaluate(e=>e.classList.contains('sidebar-open')));await page.locator('.quiz-drawer-close').click();assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('sidebar-open')),false);
   await frame.locator('.quiz-page-menu').click();await page.keyboard.press('Escape');
   if(await frame.locator('body').evaluate(el=>el.classList.contains('quiz-mobile-streak'))){
    await checkBox(frame,'.mobile-streak-visual',150);await checkBox(frame,'.quiz-mobile-answers',200);
    assert.equal(await frame.locator('.quiz-mobile-answers button').count(),4,'Four mobile choices');
   }else if(framed.includes(mode)){
    const panel=await checkBox(frame,mode==='globle'?'.globle-map-panel':mode==='travle'?'.travle-map-panel':mode==='tradle'?'.tradle-chart-panel':'.geogrid-board-panel',200);
    if(viewport.width>700){assert.ok(Math.abs(panel.height-viewport.height)<2,'Full-height map '+mode);const side=await frame.locator('.'+mode+'-side').boundingBox();assert.ok(Math.abs(side.x)<1&&side.x+side.width<=panel.x+1,'Game panel stays left '+mode);}
    else {
     const side=await frame.locator('.'+mode+'-side').boundingBox();
     assert.ok(side.y>=panel.bottom-1,'Controls must be below map '+mode);
    }
    if(mode==='geogrid'){
     assert.equal(await frame.locator('.geogrid-cell').count(),9);
     const cells=await frame.locator('.geogrid-cell').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
     for(const cell of cells)assert.ok(cell.x>=0&&cell.right<=viewport.width+1&&cell.bottom<=panel.bottom+1,'All 9 cells visible');
    }
   } else {
    if(['flags','capitals','flagcapital','places'].includes(mode))await page.getByRole('button',{name:'Start',exact:true}).click();
    if(mode==='countries')await page.locator('.country-region-btn').nth(viewport.width===360?1:0).click();
    if(mode==='geoguessr'){await page.locator('#prototype-all').click();await page.locator('#geo-start-button').click();}
    if(mode==='jeopardy'){
     for(let i=0;i<3;i++)await page.locator('#jeopardy-category-picker input').nth(i).check();
     await page.locator('[onclick="startJeopardyGame()"]').click();
    }
    await page.waitForTimeout(50);
    await checkBox(page,'.quiz-page-theme',20);
    if(['flags','capitals','flagcapital','places'].includes(mode)){
     const status=await checkBox(page,'.quiz-status-panel',200), card=await checkBox(page,'.world-card',200);
     if(viewport.width<=700){assert.ok(status.bottom<=card.top+1,'Status before question on mobile');assert.ok(card.top-status.bottom<=20,'No empty gap above mobile question');}
     for(const rect of await page.locator('.world-option').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON())))assert.ok(rect.x>=0&&rect.right<=viewport.width+1,'Answers fit');
    }
    if(mode==='geoguessr'){
     const map=await checkBox(page,'.geo-map-stage',200),hud=await checkBox(page,'.geo-hud',200);
     assert.ok(Math.abs(map.x)<1&&Math.abs(map.y)<1&&Math.abs(map.width-viewport.width)<1&&Math.abs(map.height-viewport.height)<1,'MapWiz map fills viewport');
     assert.ok(hud.top>map.top&&hud.bottom<=viewport.height,'Floating HUD stays inside map');
     await page.locator('.geo-map-stage .quiz-page-theme').click();
     assert.equal(await page.evaluate(()=>geoGuessrState.answered),false,'HUD actions must not submit map guesses');
     await page.locator('#geo-map-stage').click({position:{x:100,y:100}});
     assert.equal(await page.evaluate(()=>geoGuessrState.answered),true,'Mobile map click still scores');
     const answered=await page.locator('.geo-hud').boundingBox();assert.ok(answered.y+answered.height<=viewport.height&&answered.height<viewport.height-60,'Answer box stays compact over map');
     await page.locator('.geo-map-stage .quiz-page-theme').click();
    }
    if(mode==='detective2')await checkBox(page,'.worldle-target',200);
    if(mode==='countries'){
     const map=await checkBox(page,'.country-map-wrap',200),input=await checkBox(page,'.country-map-input',200);
     if(viewport.width<=700)assert.ok(map.bottom<=input.top,'Country input below map');
     else assert.ok(Math.abs(map.height-viewport.height)<1,'Country map uses full height');
     assert.equal(await page.locator('.country-map-primary .country-found-section').count(),1,'Found countries inside left game controls');
     assert.equal(await page.locator('.country-map-wrap .country-zoom-tip').count(),1);
     assert.ok(await page.locator('.country-map-input').evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e;}),'Country input must not be covered by map');
    }
    if(mode==='places')assert.notEqual(await page.locator('.world-place-question-desc').evaluate(e=>getComputedStyle(e).color),'rgb(255, 255, 255)','Place clues must be readable');
    if(mode==='jeopardy'){
     await checkBox(page,'#jeopardy-board',200);
     await page.locator('.jeopardy-value').first().click();
     await page.getByRole('button',{name:'Vis fasit',exact:true}).click();
     assert.match(await page.locator('#jeopardy-answer').getAttribute('class'),/open/);
     const used=page.locator('.jeopardy-value.done').first();assert.equal(await used.getAttribute('aria-disabled'),'true');assert.match(await used.evaluate(e=>getComputedStyle(e,'::after').content),/Valgt/);assert.equal(await used.evaluate(e=>getComputedStyle(e).opacity),'1');
     await page.locator('#score-actions .score-button').first().click();
     assert.equal(await page.locator('#jeopardy-scoreboard .score-card span').first().innerText(),'100');
    }
   }
   if(process.env.LAYOUT_SCREENSHOTS&&(viewport.width===390||viewport.width===1366)){
    fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,mode+'-'+viewport.width+'.png')});
   }
   if(['flags','capitals','flagcapital','places'].includes(mode)){
    const heights=await page.locator('.world-option').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));assert.ok(heights.every(h=>h>=(viewport.width>700?76:62)),'Tall answer boxes');
    if(viewport.width>700){const panel=await page.locator('.quiz-status-panel').boundingBox();assert.ok(panel.x<1,'Left status panel');}
    const wrong=await page.evaluate(()=>worldTrainerState.current.options.findIndex(o=>!worldTrainerState.current.isCorrect(o)));
    await page.locator('.world-option').nth(wrong).click();
    if(!await page.evaluate(()=>worldTrainerState.ended))await page.evaluate(()=>endWorldTrainer('QA complete',false));
    await page.locator('.quiz-status-panel .world-end').waitFor();
    assert.equal(await page.locator('#world-play>.world-end').count(),0,'Result belongs to side panel');
    const colors=await page.locator('.world-feedback,.world-end>strong,.hs-mini-head strong,.hs-mini-head button').evaluateAll(es=>es.map(e=>({text:e.textContent,color:getComputedStyle(e).color})));
    const linear=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};
    for(const c of colors){const rgb=c.color.match(/[\d.]+/g).slice(0,3).map(Number);const lum=.2126*linear(rgb[0])+.7152*linear(rgb[1])+.0722*linear(rgb[2]);assert.ok((1.03)/(lum+.05)>=4.5,'Readable feedback: '+JSON.stringify(c));}
    if(process.env.LAYOUT_SCREENSHOTS)await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,mode+'-result-'+viewport.width+'.png')});
   }
   console.log('PASS layout',mode,viewport.width+'x'+viewport.height);
  }
 }
 // Verify density with real guesses rather than an empty start screen.
 await page.setViewportSize({width:1366,height:643});await page.goto(base+'geografi/globle.html');
 const globe=page.frames().find(f=>f!==page.mainFrame());await globe.locator('#globleStartRandom').click();
 await globe.evaluate(()=>{for(const feature of WORLD.features.filter(f=>f!==state.globle.target).slice(0,20)){document.getElementById('globleGuess').value=feature.properties.name;submitGlobleGuess();}});
 const initialCount=await globe.evaluate(()=>state.globle.guesses.length);
 await globe.locator('#globleGuess').fill('');await globe.locator('#globleSubmit').click();assert.equal(await globe.evaluate(()=>state.globle.guesses.length),initialCount);
 await globe.locator('#globleGuess').fill('   ');await globe.locator('#globleGuess').press('Enter');assert.equal(await globe.evaluate(()=>state.globle.guesses.length),initialCount);
 const density=await globe.evaluate(()=>({zoom:getComputedStyle(document.body).zoom,side:document.querySelector('.globle-side').getBoundingClientRect().toJSON(),scroll:document.querySelector('.globle-side').scrollHeight,rows:[...document.querySelectorAll('.globle-row')].map(e=>e.getBoundingClientRect().height),buttons:['globleSubmit','globleReveal','globleNew'].map(id=>document.getElementById(id).getBoundingClientRect().toJSON()),space:getComputedStyle(document.getElementById('globleMap')).backgroundColor}));
 assert.equal(density.zoom,'1');assert.ok(density.rows.length>=20);assert.ok(density.rows.every(h=>h<=30),'Compact attempt rows');
 assert.ok(density.buttons.every(b=>Math.abs(b.top-density.buttons[0].top)<1),'All three actions share one line');
 assert.ok(density.scroll<=644,'No side-panel scrolling at 100% with 20 attempts');
 assert.equal(density.space,'rgb(255, 255, 255)');
 await globe.locator('.quiz-frame-nav .quiz-page-theme').click();
 await globe.waitForFunction(()=>document.body.classList.contains('dark'));
 assert.equal(await globe.locator('#globleMap').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
 await globe.locator('.quiz-frame-nav .quiz-page-theme').click();
 await globe.waitForFunction(()=>!document.body.classList.contains('dark'));
 await globe.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const help=globe.locator('.globle-side>.quiz-help');assert.equal(await help.getAttribute('open'),null);assert.match(await help.textContent(),/Hvor raskt/);assert.match(await help.textContent(),/Avstandshjelp/);
 const back=await checkBox(globe,'.globle-side .quiz-page-back');assert.ok(back.bottom<=643);
 if(process.env.LAYOUT_SCREENSHOTS)await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,'globle-20-attempts-100pct.png')});
 for(const viewport of [{width:1366,height:643},{width:390,height:844}]){
  await page.setViewportSize(viewport);await page.goto(base+'geografi/geoguessr.html');
  await page.locator('body.quiz-external-host').waitFor();
  await page.locator('#verden-quiz').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));
  assert.equal(await page.locator('.quiz-page-header').count(),0);
  const map=await checkBox(page,'#openguessr-frame',200);assert.ok(Math.abs(map.top)<1);assert.ok(Math.abs(map.height-viewport.height)<1);
  await checkBox(page,'.quiz-floating-menu');await checkBox(page,'.quiz-external-overview .quiz-page-back');
  assert.equal(await page.locator('.openguessr-actions:visible,.openguessr-menu-button:visible,.quiz-page-theme:visible').count(),0);
  await page.locator('.quiz-page-menu').click();await page.keyboard.press('Escape');
 }
 await page.setViewportSize({width:1366,height:643});await page.goto(base+'geografi.html#verden-quiz');
 const cards=await page.locator('.geoquiz-mode-row').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));assert.equal(cards.length,14);assert.ok(cards.every(r=>r.height<=78),'Overview matches compact reference at 100%');
 if(process.env.LAYOUT_SCREENSHOTS)await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,'overview-100pct.png')});
 // A shortened viewport approximates the space left when a mobile keyboard opens.
 await page.setViewportSize({width:390,height:480});await page.goto(base+'geografi/geogrid.html');
 const grid=page.frames().find(f=>f!==page.mainFrame());await grid.locator('.geogrid-cell').first().click();
 await grid.locator('#geogridGuess').fill('Norge');
 const modal=await checkBox(grid,'.geogrid-modal',200);assert.ok(modal.bottom<=480,'GeoGrid entry fits shortened viewport');
 await grid.locator('#geogridPopupClose').click();
 // Previously published GeoWiz URL preserves query and hash; tracking lives only on MapWiz.
 await page.goto(base+'geografi/geowiz.html?legacy=1#kept');await page.waitForURL(base+'geografi/mapwiz.html?legacy=1#kept');
 await page.locator('.quiz-page-back').click();await page.waitForURL(base+'geografi.html#verden-quiz');
 assert.deepEqual(errors,[]);console.log('PASS',pages.length,'quiz layouts in four viewports; no script errors');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
