const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
require('node:child_process').execFileSync(process.execPath, [path.join(root,'scripts/build-geography-quiz-assets.cjs'),'--check']);
require('node:child_process').execFileSync(process.execPath,[path.join(root,'scripts/build-mapwiz-prototype.cjs'),'--check']);
const routes = JSON.parse(fs.readFileSync(path.join(root,'assets/geography/routes.js'),'utf8').match(/window.GEO_QUIZ_ROUTES=([\s\S]*);/)[1]);
const pages = Object.entries(routes).filter(([mode]) => !['statle','openguessr'].includes(mode));
const framed = ['globle','travle','tradle','geogrid'];
const server = http.createServer((req,res) => {
 const file = path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 try {res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(fs.readFileSync(file));}
 catch {res.writeHead(404);res.end('missing');}
});


(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:643}}),errors=[],requests=[];
  context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  await context.route('**/*',r=>{requests.push(r.request().url());return r.request().url().startsWith(base)||/^(data|blob):/.test(r.request().url())?r.continue():r.abort()});
  const page=await context.newPage();page.on('dialog',d=>d.dismiss());
  const shot=async name=>{if(process.env.LAYOUT_SCREENSHOTS){fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,name+'.png')});}};
  async function reset(){await page.evaluate(()=>initGeoGuessr());await page.locator('#prototype-none').click();}
  async function finish(offset=0){
   let lastMap;
   for(let i=0;i<10;i++){
    await page.evaluate(offset=>{
     const s=geoGuessrState,t=s.rounds[s.index];let point;
     if(s.norwayOnly){const r=document.querySelector('[data-no-frame]').getBoundingClientRect();point={clientX:r.left+(t.lon+12)/46*r.width,clientY:r.top+(81.5-t.lat)/24.3*r.height};}
     else{const r=document.querySelector('.geo-world-content').getBoundingClientRect(),p=geoToPercent(t.lat,t.lon);p.x=(p.x+offset)%100;p.y=Math.max(1,Math.min(99,p.y+offset/2));point={clientX:r.left+r.width*p.x/100,clientY:r.top+r.height*p.y/100};}
     geoMapClick(point);
    },offset);
    if(!offset)assert.ok(await page.evaluate(()=>geoGuessrState.results.at(-1).base>99),'Projected answer scores correctly');
    if(i===9)lastMap=await page.locator('.geo-map-stage img').first().elementHandle();
    await page.locator('.geo-next-button').click();
   }
   return lastMap;
  }
  async function summaryFits(){
   assert.equal(await page.locator('.geo-line-layer g[data-result-index]').count(),10);
   assert.equal(await page.locator('#geo-markers .geo-marker').count(),20);
   assert.equal(await page.locator('.prototype-results tbody tr').count(),10);
   assert.equal(await page.locator('.prototype-results').innerText().then(s=>s.includes('km')),false,'No distance column');
   assert.deepEqual(await page.locator('.prototype-results th').allTextContents(),['Sted','Avst.p.','Tidsp.']);
   const h=await page.locator('.prototype-summary').evaluate(e=>({rect:e.getBoundingClientRect().toJSON(),scroll:e.scrollHeight,client:e.clientHeight,viewport:[innerWidth,innerHeight]}));
   assert.ok(h.rect.x>=0&&h.rect.right<=h.viewport[0]+1&&h.rect.y>=0&&h.rect.bottom<=h.viewport[1]+1,'Summary fits viewport '+JSON.stringify(h));
   assert.ok(h.scroll<=h.client+2,'All ten results visible without internal scrolling '+JSON.stringify(h));
   const points=await page.locator('.prototype-results tbody tr').evaluateAll(rows=>rows.map(r=>[...r.cells].slice(1).map(c=>Number(c.textContent))));
   assert.deepEqual(points,await page.evaluate(()=>geoGuessrState.results.map(r=>[Number(r.base.toFixed(1)),Number(r.bonus.toFixed(1))])));
  }
  async function drag(dx,dy){const h=await page.locator('.geo-hud').boundingBox(),x=h.x+h.width-5,y=h.y+25;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:10});await page.mouse.up();return page.locator('.geo-hud').boundingBox();}
  await page.goto(base+'prototypes/mapwiz.html');await page.locator('[data-prototype-category]').first().waitFor();
  assert.equal(await page.locator('[data-prototype-category]').count(),15);assert.equal(await page.locator('[data-prototype-category]:checked').count(),0);assert.ok(await page.locator('#geo-start-button').isDisabled());
  assert.equal(await page.locator('[data-prototype-category=clues],.prototype-tag,details.prototype-notes').count(),0);
  assert.equal(await page.evaluate(()=>Object.hasOwn(MAPWIZ_PROTOTYPE_DATA,'clues')),false,'Clue data removed');
  const layout=await page.evaluate(()=>({grid:document.querySelector('.geo-selection-grid').getBoundingClientRect().toJSON(),intro:document.querySelector('.prototype-setup-intro').getBoundingClientRect().toJSON(),notes:document.querySelector('.prototype-notes').getBoundingClientRect().toJSON(),cols:getComputedStyle(document.querySelector('.geo-selection-grid')).gridTemplateColumns.split(' ').length}));
  assert.equal(layout.cols,3);assert.ok(layout.intro.x<30,'Text uses left edge');assert.ok(layout.grid.x>layout.intro.right&&layout.grid.y<layout.intro.y+65,'Categories at upper right');assert.ok(layout.notes.bottom<=643,'Notes visible at 100%');
  assert.ok((await page.locator('.geo-selection-item').first().boundingBox()).width<280,'Narrow category cards');
  await shot('setup-light');
  const dataCheck=await page.evaluate(()=>({flags:MapWizPrototype.pools.get('flags').length,cities:MapWizPrototype.pools.get('cities').length}));
  assert.ok(dataCheck.flags>100&&dataCheck.cities>=80);
  const before=await page.evaluate(()=>JSON.stringify(localStorage));
  await page.locator('[data-prototype-category=flags]').check();await page.locator('#geo-start-button').click();
  assert.equal(await page.evaluate(()=>geoGuessrState.rounds.length),10);assert.equal(await page.locator('.geo-hint,.prototype-question-type,.prototype-move').count(),0);
  assert.ok((await page.locator('.prototype-flag').getAttribute('src')).startsWith('data:image/'));
  await page.waitForTimeout(100);const original=await page.locator('.geo-hud').boundingBox(),moved=await drag(190,-110);
  assert.ok(Math.abs(moved.x-original.x-190)<2&&Math.abs(moved.y-original.y+110)<2,'Free drag in both axes '+JSON.stringify({original,moved}));
  assert.equal(await page.evaluate(()=>geoGuessrState.answered),false,'Dragging cannot submit map guesses');await shot('question-dragged');
  const lastMap=await finish(6);await summaryFits();assert.ok(await lastMap.evaluate(e=>e.isConnected),'Original map remains on summary');
  const summary=await page.locator('.prototype-summary').boundingBox();assert.ok(summary.x<20&&summary.width<=342,'Narrow southwest summary');await shot('summary-light');
  const movedSummary=await drag(230,-100);assert.ok(movedSummary.x>summary.x+220&&movedSummary.y<summary.y-90,'Summary freely draggable');
  await page.locator('.geo-hud').focus();await page.keyboard.press('Home');await summaryFits();
  await drag(-1000,-1000);let corner=await page.locator('.geo-hud').boundingBox();assert.ok(corner.x>=7&&corner.y>=7,'Drag clamps at top/left');
  await drag(3000,3000);await summaryFits();await page.locator('.geo-hud').focus();await page.keyboard.press('Home');
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),before,'Scores stay isolated');
  await page.locator('.quiz-page-theme').click();await shot('summary-dark');
  const counts={};
  for(const category of await page.evaluate(()=>MapWizPrototype.definitions.map(d=>d[0]))){
   await reset();await page.locator('[data-prototype-category="'+category+'"]').check();await page.locator('#geo-start-button').click();counts[category]=await page.evaluate(()=>geoGuessrState.rounds.length);assert.equal(counts[category],10,category);
   if(category==='deserts'){const names=await page.evaluate(()=>geoGuessrState.rounds.map(t=>t.name));assert.equal(new Set(names).size,7);assert.ok(names.every((n,i)=>i===0||n!==names[i-1]),'Exhaust small pool before repeats, no consecutive repeat');}
  }
  let randomRounds=0;
  for(const n of [1,2,5,6,15]){
   await reset();for(let i=0;i<n;i++)await page.locator('[data-prototype-category]').nth(i).check();
   const result=await page.evaluate(n=>{for(let i=0;i<60;i++){startGeoGuessr();const c={};if(geoGuessrState.rounds.length!==10)return 'length';for(const t of geoGuessrState.rounds)c[t.quizCategory]=(c[t.quizCategory]||0)+1;if(n>5&&Object.values(c).some(v=>v>2))return 'limit';}return 'ok';},n);
   // Selection UI is replaced during play, so also inspect distribution from known selection size.
   assert.equal(result,'ok');if(n>5)assert.ok(await page.evaluate(()=>Object.values(geoGuessrState.rounds.reduce((c,t)=>(c[t.quizCategory]=(c[t.quizCategory]||0)+1,c),{})).every(n=>n<=2)));randomRounds+=60;
  }
  await reset();await page.locator('[data-prototype-category="place:Norge"]').check();await page.locator('#geo-start-button').click();await finish();await summaryFits();
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);await summaryFits();
  const norwayAlignment=await page.evaluate(()=>{const target=geoGuessrState.rounds[0],frame=document.querySelector('[data-no-frame]').getBoundingClientRect(),marker=document.querySelector('.geo-marker.answer').getBoundingClientRect();return Math.hypot(marker.x+marker.width/2-(frame.x+(target.lon+12)/46*frame.width),marker.y+marker.height/2-(frame.y+(81.5-target.lat)/24.3*frame.height));});assert.ok(norwayAlignment<1,'Norway results follow the resized map');
  for(const viewport of [{width:390,height:844},{width:360,height:740},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.goto(base+'prototypes/mapwiz.html');await page.locator('[data-prototype-category=flags]').check();await page.locator('#geo-start-button').click();await page.waitForTimeout(100);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(viewport.width<700){
    const h=await page.locator('.geo-hud').boundingBox(),cdp=await context.newCDPSession(page),x=h.x+h.width-5,y=h.y+25;
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+5*i,y:y-8*i}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.ok((await page.locator('.geo-hud').boundingBox()).y<h.y-50,'Touch drag moves box');assert.equal(await page.evaluate(()=>geoGuessrState.answered),false);
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.detach();
   }
   await finish(6);await summaryFits();await shot('summary-'+viewport.width);
   await page.locator('.quiz-page-menu').click();await page.keyboard.press('Escape');
  }
  assert.equal(requests.filter(u=>/cloudflareinsights|flagcdn/.test(u)).length,0);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({dataCheck,categories:counts,randomRounds,drag:true,touch:true,summaryTenLines:true,summaryWithoutScroll:true,mobile:true,errors}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
