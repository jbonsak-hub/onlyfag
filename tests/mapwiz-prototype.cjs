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
  await context.route('**/*',r=>{if(/score-service(?:-[a-f0-9]+)?\.js/.test(r.request().url()))return r.fulfill({contentType:'text/javascript',body:'window.GEO_SCORE_API="";'});requests.push(r.request().url());return r.request().url().startsWith(base)||/^(data|blob):/.test(r.request().url())?r.continue():r.abort()});
  const page=await context.newPage();page.on('dialog',d=>d.dismiss());
  const shot=async name=>{if(process.env.LAYOUT_SCREENSHOTS){fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,name+'.png')});}};
  async function reset(){await page.evaluate(()=>initGeoGuessr());await page.locator('#prototype-none').click();}
  async function finish(offset=0){
   let lastMap;
   for(let i=0;i<10;i++){
    await page.evaluate(offset=>{
     const s=geoGuessrState,t=s.rounds[s.index];let point;
     if(s.norwayOnly){const r=document.querySelector('[data-no-frame]').getBoundingClientRect(),p=MapWizNorway.project(t.lat,t.lon);point={clientX:r.left+p.x*r.width,clientY:r.top+p.y*r.height};}
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
  async function replay(categories){
   const previous=await page.evaluate(()=>geoGuessrState.startedAt);
   await page.locator('#prototype-again').click();
   const state=await page.evaluate(()=>({selected:MapWizPrototype.selected().sort(),index:geoGuessrState.index,total:geoGuessrState.total,results:geoGuessrState.results.length,answered:geoGuessrState.answered,rounds:geoGuessrState.rounds.length,startedAt:geoGuessrState.startedAt,setup:!!document.querySelector('.mapwiz-prototype-setup')}));
   assert.deepEqual(state.selected,[...categories].sort(),'Replay retains the selected categories');
   assert.deepEqual([state.index,state.total,state.results,state.answered,state.rounds,state.setup],[0,0,0,false,10,false],'Replay opens a fresh game directly');
   assert.ok(state.startedAt>=previous,'Replay starts a new clock');
  }
  async function norwayAlignment(){
   await page.waitForTimeout(100);
   const checks=await page.evaluate(()=>{
    const atlas=MapWizNorway.atlas,frame=document.querySelector('[data-no-frame]').getBoundingClientRect(),image=document.querySelector('[data-no-frame] img'),s=geoGuessrState;
    return {
     imageLoaded:image.complete&&image.naturalWidth>2000,
     frame:frame.toJSON(),viewport:[innerWidth,innerHeight],
     areas:atlas.areas.map(area=>({id:area.id,left:frame.x+area.rect[0]/atlas.width*frame.width,top:frame.y+area.rect[1]/atlas.height*frame.height,right:frame.x+(area.rect[0]+area.rect[2])/atlas.width*frame.width,bottom:frame.y+(area.rect[1]+area.rect[3])/atlas.height*frame.height})),
     errors:[...document.querySelectorAll('.geo-marker.answer')].map((marker,i)=>{const target=s.rounds[i],p=MapWizNorway.project(target.lat,target.lon),r=marker.getBoundingClientRect();return Math.hypot(r.x+r.width/2-(frame.x+p.x*frame.width),r.y+r.height/2-(frame.y+p.y*frame.height));})
    };
   });
   assert.ok(checks.imageLoaded,'High-resolution physical atlas is loaded');
   assert.deepEqual(checks.areas.map(a=>a.id),['mainland','svalbard','jan-mayen'],'Mainland and both island insets are present');
   for(const area of checks.areas)assert.ok(area.left>=-1&&area.top>=-1&&area.right<=checks.viewport[0]+1&&area.bottom<=checks.viewport[1]+1,'Atlas area stays visible after resize '+JSON.stringify(area));
   assert.ok(checks.errors.every(error=>error<1),'All Norway answer markers follow the resized physical atlas '+JSON.stringify(checks.errors));
  }
  async function drag(dx,dy){const h=await page.locator('.geo-hud').boundingBox(),x=h.x+h.width-5,y=h.y+25;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:10});await page.mouse.up();return page.locator('.geo-hud').boundingBox();}
  await page.goto(base+'geografi/mapwiz.html');await page.locator('[data-prototype-category]').first().waitFor();
  assert.equal(await page.locator('[data-prototype-category]').count(),15);assert.equal(await page.locator('[data-prototype-category]:checked').count(),0);assert.ok(await page.locator('#geo-start-button').isDisabled());
  assert.equal(await page.locator('[data-prototype-category=clues],.prototype-tag,details.prototype-notes').count(),0);
  assert.equal(await page.evaluate(()=>Object.hasOwn(MAPWIZ_PROTOTYPE_DATA,'clues')),false,'Clue data removed');
  const layout=await page.evaluate(()=>({grid:document.querySelector('.geo-selection-grid').getBoundingClientRect().toJSON(),intro:document.querySelector('.prototype-setup-intro').getBoundingClientRect().toJSON(),notes:document.querySelector('.prototype-notes').getBoundingClientRect().toJSON(),cols:getComputedStyle(document.querySelector('.geo-selection-grid')).gridTemplateColumns.split(' ').length}));
  assert.equal(layout.cols,3);assert.ok(layout.intro.x>100,'Setup grouped away from viewport corners');assert.ok(layout.grid.x>layout.intro.right&&Math.abs(layout.grid.y-layout.intro.y)<16,'Text and categories aligned');assert.ok(layout.notes.top-layout.grid.bottom<32&&layout.notes.top>=layout.grid.bottom,'Notes directly below categories');assert.ok(layout.notes.bottom<=643,'Notes visible at 100%');
  const card=await page.locator('.mapwiz-prototype-setup').boundingBox();assert.ok(Math.abs(card.x+card.width/2-683)<2&&card.width<=1121,'Centered compact setup');
  assert.equal(await page.locator('script[src*=cloudflareinsights]').count(),1);assert.equal(await page.locator('script[src*=cloudflareinsights]').getAttribute('data-cf-beacon').then(s=>JSON.parse(s).spa),false);
  assert.ok((await page.locator('.geo-selection-item').first().boundingBox()).width<280,'Narrow category cards');
  await shot('setup-light');await page.locator('.quiz-page-theme').click();await shot('setup-dark');await page.locator('.quiz-page-theme').click();
  await page.setViewportSize({width:1920,height:1080});const wide=await page.locator('.mapwiz-prototype-setup').boundingBox();assert.ok(Math.abs(wide.x+wide.width/2-960)<2&&wide.width<=1121,'Setup stays grouped on large screens');await shot('setup-wide');await page.setViewportSize({width:1366,height:643});
  const dataCheck=await page.evaluate(()=>({flags:MapWizPrototype.pools.get('flags').length,cities:MapWizPrototype.pools.get('cities').length}));
  assert.ok(dataCheck.flags>100&&dataCheck.cities>=80);
  const before=await page.evaluate(()=>JSON.stringify(localStorage));
  await page.locator('[data-prototype-category=flags]').check();await page.locator('#geo-start-button').click();
  assert.equal(await page.evaluate(()=>geoGuessrState.rounds.length),10);assert.equal(await page.locator('.geo-hint,.prototype-question-type,.prototype-move').count(),0);
  assert.ok((await page.locator('.prototype-flag').getAttribute('src')).startsWith('data:image/'));
  await page.waitForTimeout(100);const original=await page.locator('.geo-hud').boundingBox(),moved=await drag(190,-110);
  assert.ok(Math.abs(moved.x-original.x-190)<2&&Math.abs(moved.y-Math.max(8,original.y-110))<2,'Free drag in both axes with top-edge clamping '+JSON.stringify({original,moved}));
  assert.equal(await page.evaluate(()=>geoGuessrState.answered),false,'Dragging cannot submit map guesses');await shot('question-dragged');
  const lastMap=await finish(6);await summaryFits();assert.ok(await lastMap.evaluate(e=>e.isConnected),'Original map remains on summary');
  const summary=await page.locator('.prototype-summary').boundingBox();assert.ok(summary.x<20&&summary.width<=342,'Narrow southwest summary');await shot('summary-light');
  const movedSummary=await drag(230,-100);assert.ok(Math.abs(movedSummary.x-summary.x-230)<2&&Math.abs(movedSummary.y-Math.max(8,summary.y-100))<2,'Summary freely draggable with top-edge clamping ');
  await page.locator('.geo-hud').focus();await page.keyboard.press('Home');await summaryFits();
  await drag(-1000,-1000);let corner=await page.locator('.geo-hud').boundingBox();assert.ok(corner.x>=7&&corner.y>=7,'Drag clamps at top/left');
  await drag(3000,3000);await summaryFits();await page.locator('.geo-hud').focus();await page.keyboard.press('Home');
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),before,'Scores stay isolated');
  await page.locator('.quiz-page-theme').click();await shot('summary-dark');
  await replay(['flags']);
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
  await reset();await page.locator('[data-prototype-category="place:Norge"]').check();await page.locator('#geo-start-button').click();
  const norwayProjection=await page.evaluate(()=>{
   const targets=MapWizPrototype.pools.get('place:Norge'),atlas=MapWizNorway.atlas;
   const checked=targets.map(target=>{const p=MapWizNorway.project(target.lat,target.lon),inverse=MapWizNorway.inverse(p.x,p.y);return {name:target.name,inBounds:p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1,error:inverse?Math.max(Math.abs(inverse.lat-target.lat),Math.abs(inverse.lon-target.lon)):Infinity};});
   const named=Object.fromEntries(['Galdhøpiggen','Kautokeino','Snøhetta','Svalbard','Jan Mayen'].map(name=>{const t=targets.find(t=>t.name===name);return [name,t?{lat:t.lat,lon:t.lon,point:MapWizNorway.project(t.lat,t.lon)}:null];}));
   const invalid=[[-.1,.5],[1.1,.5],[.5,-.1],[.5,1.1],[NaN,.5]].every(p=>MapWizNorway.inverse(...p)===null);
   // Force representatives of all three atlas areas into one complete round.
   const insets=['Svalbard','Jan Mayen'].map(name=>targets.find(t=>t.name===name)),mainland=targets.filter(t=>t.lat<74&&t.lon>=0).slice(0,8);
   MapWizPrototype.begin([...insets,...mainland]);
   return {checked,named,invalid,areas:atlas.areas.map(a=>a.id)};
  });
  assert.ok(norwayProjection.checked.length>50,'Every Norway target participates in projection validation');
  assert.ok(norwayProjection.checked.every(t=>t.inBounds&&Number.isFinite(t.error)&&t.error<1e-7),'Every Norway target round-trips through the atlas '+JSON.stringify(norwayProjection.checked.filter(t=>!t.inBounds||!Number.isFinite(t.error)||t.error>=1e-7)));
  assert.ok(norwayProjection.invalid,'Outside-atlas coordinates cannot produce guesses');
  assert.deepEqual(norwayProjection.areas,['mainland','svalbard','jan-mayen']);
  for(const name of ['Galdhøpiggen','Kautokeino','Snøhetta'])assert.ok(norwayProjection.named[name],'Inland checkpoint exists: '+name);
  assert.deepEqual([norwayProjection.named.Svalbard.lat,norwayProjection.named.Svalbard.lon],[78.75,17.5],'Svalbard targets inland Spitsbergen');
  assert.deepEqual([norwayProjection.named['Jan Mayen'].lat,norwayProjection.named['Jan Mayen'].lon],[70.987,-8.421],'Jan Mayen target lies on its island');
  await finish();await summaryFits();
  for(const viewport of [{width:1366,height:643},{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);await norwayAlignment();await summaryFits();await shot('norway-summary-'+viewport.width);}
  await replay(['place:Norge']);
  for(const viewport of [{width:390,height:844},{width:360,height:740},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.goto(base+'geografi/mapwiz.html');await page.locator('[data-prototype-category]').first().waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Setup fits mobile width');await shot('setup-'+viewport.width);await page.locator('[data-prototype-category=flags]').check();await page.locator('#geo-start-button').click();await page.waitForTimeout(100);
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
  assert.equal(requests.filter(u=>/flagcdn/.test(u)).length,0);assert.equal(requests.filter(u=>/cloudflareinsights/.test(u)).length,requests.filter(u=>u===base+'geografi/mapwiz.html').length,'One analytics loader per published page load');
  const tracked=requests.filter(u=>/cloudflareinsights/.test(u)).length;await page.goto(base+'prototypes/mapwiz.html');await page.locator('[data-prototype-category]').first().waitFor();assert.equal(await page.locator('[data-prototype-category]').count(),15);assert.equal(requests.filter(u=>/cloudflareinsights/.test(u)).length,tracked,'Preview remains untracked');assert.deepEqual(errors,[]);
  console.log(JSON.stringify({dataCheck,categories:counts,randomRounds,drag:true,touch:true,summaryTenLines:true,summaryWithoutScroll:true,norwayTargets:norwayProjection.checked.length,norwayAtlasAreas:3,replay:true,mobile:true,errors}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
