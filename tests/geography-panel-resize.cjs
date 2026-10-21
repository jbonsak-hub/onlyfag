const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
require('node:child_process').execFileSync(process.execPath, [path.join(root,'scripts/build-geography-quiz-assets.cjs'),'--check']);
const routes = JSON.parse(fs.readFileSync(path.join(root,'assets/geography/routes.js'),'utf8').match(/window.GEO_QUIZ_ROUTES=([\s\S]*);/)[1]);
const pages = Object.entries(routes).filter(([mode]) => !['statle','openguessr'].includes(mode));
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
 try{
  const context=await browser.newContext({viewport:{width:1366,height:643}});
  await context.route('**/*',r=>r.request().url().startsWith(base)||/^(data|blob):/.test(r.request().url())?r.continue():r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
  async function start(mode){
   if(['flags','capitals','flagcapital','places'].includes(mode))await page.getByRole('button',{name:'Start',exact:true}).click();
   if(mode==='countries')await page.locator('.country-region-btn').first().click();
   if(mode==='jeopardy'){for(let i=0;i<3;i++)await page.locator('#jeopardy-category-picker input').nth(i).check();await page.locator('[onclick="startJeopardyGame()"]').click();}
  }
  for(const [mode,[file]] of Object.entries(routes).filter(([m])=>!['openguessr','geoguessr'].includes(m))){
   await page.goto(base+file);await start(mode);
   const scope=framed.includes(mode)?page.frames().find(f=>f!==page.mainFrame()):page.mainFrame();
   const selector=framed.includes(mode)?'.'+mode+'-side':mode==='statle'?'.game-panel':mode==='geoguessr'?'.quiz-control-rail':mode==='countries'?'.country-map-bottom-bar':mode==='detective2'?'.worldle-side':mode==='jeopardy'?'.jeopardy-side':'.quiz-status-panel';
   const handle=scope.getByRole('separator',{name:'Bredde på spillpanelet'});
   await handle.waitFor();await handle.focus();await page.keyboard.press('Home');await page.waitForTimeout(100);
   const original=await scope.locator(selector).boundingBox(),h=await handle.boundingBox();
   assert.ok(Math.abs(h.x+4-original.x-original.width)<3,mode+' handle follows actual panel edge '+JSON.stringify({original,h}));
   await page.mouse.move(h.x+h.width/2,h.y+100);await page.mouse.down();await page.mouse.move(h.x+h.width/2+64,h.y+100,{steps:8});await page.mouse.up();await page.waitForTimeout(150);
   const resized=await scope.locator(selector).boundingBox();
   assert.ok(Math.abs(resized.width-original.width-64)<2,mode+' panel follows pointer '+JSON.stringify({original,resized}));
   assert.equal(await scope.evaluate(()=>localStorage.getItem('onlyfag-geography-panel-width')),String((mode==='statle'?260:280)+64));
   await handle.focus();await page.keyboard.press('ArrowLeft');await page.waitForTimeout(60);
   const keyboard=await scope.locator(selector).boundingBox();assert.ok(Math.abs(resized.width-keyboard.width-16)<2,mode+' keyboard resize');
   await page.keyboard.press('Home');await page.waitForTimeout(60);
   assert.ok(Math.abs((await scope.locator(selector).boundingBox()).width-original.width)<2,mode+' reset');
   await page.setViewportSize({width:390,height:844});assert.equal(await handle.isVisible(),false,'No resize handle on stacked mobile '+mode);
   await page.setViewportSize({width:1366,height:643});
   console.log('PASS pointer/keyboard/reset/mobile',mode);
  }
  // A long list must scroll within the left panel while the map keeps its height.
  await page.goto(base+'geografi/landquiz.html');await start('countries');
  await page.evaluate(()=>{for(const name of worldTrainerState.regionNames.slice(0,90)){document.getElementById('country-guess').value=name;checkCountryGuess();}});
  await page.waitForTimeout(150);
  assert.equal(await page.locator('#country-found .world-chip').count(),90);
  const list=page.locator('#country-found');
  assert.ok(await list.evaluate(e=>e.scrollHeight>e.clientHeight),'Found list scrolls');
  await list.evaluate(e=>e.scrollTop=e.scrollHeight);assert.ok(await list.evaluate(e=>e.scrollTop>0),'List is scrollable');
  if(process.env.LAYOUT_SCREENSHOTS){fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,'countries-long-list.png')});}
  const map=await page.locator('.country-map-wrap').boundingBox();assert.equal(map.height,643);
  await page.mouse.move(map.x+map.width/2,map.y+map.height/2);await page.mouse.wheel(0,-240);await page.waitForTimeout(100);
  assert.ok(await page.evaluate(()=>worldTrainerState.mapZoom>1),'Country map zoom remains functional');
  const handle=page.getByRole('separator');await handle.focus();for(let i=0;i<7;i++)await page.keyboard.press('ArrowRight');
  await page.reload();await start('countries');assert.equal(await page.getByRole('separator').getAttribute('aria-valuenow'),'392','Saved width survives reload');
  await page.setViewportSize({width:740,height:643});await page.waitForTimeout(150);
  assert.equal(await page.getByRole('separator').getAttribute('aria-valuenow'),'320','Narrow desktop retains map space');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize({width:1366,height:643});

  // MapWiz navigation floats above the map and never scores a guess.
  await page.goto(base+'geografi/mapwiz.html');await page.locator('#prototype-all').click();await page.locator('#geo-start-button').click();
  assert.equal(await page.getByRole('separator').isVisible(),false);
  await page.locator('.geo-map-stage .quiz-page-menu').click();await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>geoGuessrState.answered),false);
  for(let i=0;i<10;i++){
   const point=await page.evaluate(()=>{const t=geoGuessrState.rounds[geoGuessrState.index];return geoToPercent(t.lat,t.lon)});
   // Use the engine's real map click path at its projected coordinate (HUD may overlay a target).
   await page.evaluate(p=>geoMapClick({clientX:innerWidth*p.x/100,clientY:innerHeight*p.y/100}),point);
   assert.ok(await page.evaluate(()=>geoGuessrState.results.at(-1).base>99),'Map fills the same coordinate system');
   await page.locator('.geo-next-button').click();
  }
  assert.equal(await page.evaluate(()=>geoGuessrState.results.length),10);
  assert.ok(await page.locator('.prototype-summary').isVisible());

  await page.goto(base+'geografi/mapwiz.html');await page.setViewportSize({width:390,height:844});await page.locator('#prototype-all').click();await page.locator('#geo-start-button').click();
  assert.ok(await page.locator('.geo-world-scroll').evaluate(e=>e.scrollWidth>e.clientWidth*2),'Portrait map can pan instead of stretching');
  await page.waitForTimeout(100);
  const scrollBefore=await page.locator('.geo-world-scroll').evaluate(e=>e.scrollLeft);
  assert.ok(scrollBefore>0,'Portrait map starts centered');
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y:300}]});
  for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:300-i*14,y:300}]});await page.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(250);
  assert.ok(await page.locator('.geo-world-scroll').evaluate((e,before)=>e.scrollLeft>before+50,scrollBefore),'Touch swipe pans map');
  assert.equal(await page.evaluate(()=>geoGuessrState.answered),false,'Swiping must not submit a guess');
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.detach();
  // Scroll a real target into view and click it using its map coordinates.
  await page.evaluate(()=>{const s=geoGuessrState,i=s.rounds.findIndex(t=>t.lat>0&&t.lat<60);if(i>=0)[s.rounds[0],s.rounds[i]]=[s.rounds[i],s.rounds[0]];renderGeoGuessrRound();});
  await page.waitForTimeout(100); // Let the new map's initial centering frame finish before panning to the fixture.
  const targetPoint=await page.evaluate(()=>{
   const t=geoGuessrState.rounds[0],p=geoToPercent(t.lat,t.lon),scroll=document.querySelector('.geo-world-scroll'),content=document.querySelector('.geo-world-content');
   scroll.scrollLeft=content.clientWidth*p.x/100-scroll.clientWidth/2;
   const r=content.getBoundingClientRect();return {x:r.x+r.width*p.x/100,y:r.y+r.height*p.y/100};
  });
  await page.mouse.click(targetPoint.x,targetPoint.y);
  assert.ok(await page.evaluate(()=>geoGuessrState.results[0].base>99),'Portrait map click uses panned coordinates');
  if(process.env.LAYOUT_SCREENSHOTS)await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,'mapwiz-portrait.png')});
  await page.setViewportSize({width:1366,height:643});
  await page.goto(base+'geografi/mapwiz.html');
  await page.locator('[data-prototype-category="place:Norge"]').check();await page.locator('#geo-start-button').click();
  assert.equal(await page.evaluate(()=>geoGuessrState.norwayOnly),true);
  const norway=await page.locator('.geo-map-stage').boundingBox();assert.ok(Math.abs(norway.width-1366)<1);assert.ok(Math.abs(norway.height-643)<1);
  await page.locator('.geo-map-stage').click({position:{x:600,y:200}});
  assert.equal(await page.evaluate(()=>geoGuessrState.results.length),1,'Norway map still scores a click');
  assert.deepEqual(errors,[]);

  console.log('PASS found-list scroll, full-height map, zoom, persistence, viewport clamp, full MapWiz round and navigation; no script errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
