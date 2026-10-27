/* Three difficulty choices share a target classification with the score API.
   External requests are blocked; all games here use the offline implementation. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const child=require('node:child_process');
for(const name of ['build-geography-quiz-assets.cjs','build-mapwiz-prototype.cjs'])child.execFileSync(process.execPath,[path.join(root,'scripts',name),'--check']);
const source=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/mapwiz-difficulties.json'),'utf8'));
const assignments=source.assignments,levels=['easy','medium','hard'];
const counts=Object.fromEntries(levels.map(level=>[level,Object.values(assignments).flatMap(Object.values).filter(value=>value===level).length]));
assert.deepEqual(counts,{easy:216,medium:350,hard:210},'All 776 entries include the nine requested promotions');
for(const [category,name]of [['capitals','Mexico by'],['cities','Mekka'],['mountains','K2'],['ranges','Atlas'],['seas','Adriaterhavet'],['landmarks','Machu Picchu'],['landmarks','Stonehenge'],['landmarks','Taj Mahal'],['landmarks','Pompeii']])assert.equal(assignments[category][name],'easy',name+' is easy');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp'};
const server=http.createServer((req,res)=>{try{const file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/',browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'}),errors=[],requests=[];
 try{
  const context=await browser.newContext({viewport:{width:1366,height:646}});
  await context.route('**/*',route=>{const url=route.request().url();if(/score-service(?:-[a-f0-9]+)?\.js/.test(url))return route.fulfill({contentType:'text/javascript',body:'window.GEO_SCORE_API="";'});requests.push(url);return url.startsWith(base)||/^(data|blob):/.test(url)?route.continue():route.abort();});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.dismiss());
  const shot=async name=>{if(process.env.LAYOUT_SCREENSHOTS){fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,name+'.png')});}};
  const input=level=>page.locator('[data-prototype-difficulty="'+level+'"]');
  const frames=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  async function choose(selected){await page.evaluate(()=>initGeoGuessr());for(const level of selected)await input(level).check();for(const level of levels.filter(level=>!selected.includes(level)))if(await input(level).isChecked())await input(level).uncheck();assert.deepEqual(await page.evaluate(()=>MapWizPrototype.selected().sort()),[...selected].sort());}
  async function exactAnswer(){
   await page.evaluate(()=>{const s=geoGuessrState,t=s.rounds[s.index],r=document.querySelector('.geo-world-content').getBoundingClientRect(),p=geoToPercent(t.lat,t.lon);geoMapClick({clientX:r.left+p.x/100*r.width,clientY:r.top+p.y/100*r.height});});
   assert.ok(await page.evaluate(()=>geoGuessrState.results.at(-1).base>99),'An exact answer uses the currently displayed projection');
   await page.locator('.geo-next-button').click();await frames();
  }
  async function finish(){for(let i=0;i<10;i++)await exactAnswer();await page.locator('.prototype-summary').waitFor();}
  async function replay(expected){const previous=await page.evaluate(()=>geoGuessrState.startedAt);await page.locator('#prototype-again').click();await page.waitForFunction(()=>geoGuessrState.index===0&&!geoGuessrState.answered&&!document.querySelector('.prototype-summary'));assert.deepEqual(await page.evaluate(()=>MapWizPrototype.selected().sort()),[...expected].sort());assert.deepEqual(await page.evaluate(()=>[geoGuessrState.total,geoGuessrState.results.length,geoGuessrState.rounds.length,!!document.querySelector('.mapwiz-prototype-setup')]),[0,0,10,false]);assert.ok(await page.evaluate(()=>geoGuessrState.startedAt)>=previous);}
  async function summaryFits(){const rect=await page.locator('.prototype-summary').evaluate(e=>({bounds:e.getBoundingClientRect().toJSON(),height:e.scrollHeight,client:e.clientHeight,viewport:[innerWidth,innerHeight]}));assert.ok(rect.bounds.x>=0&&rect.bounds.y>=0&&rect.bounds.right<=rect.viewport[0]+1&&rect.bounds.bottom<=rect.viewport[1]+1,'Summary stays in viewport '+JSON.stringify(rect));assert.ok(rect.height<=rect.client+2,'All ten result rows remain visible');assert.equal(await page.locator('.prototype-results tbody tr').count(),10);}
  async function drag(dx,dy){const h=await page.locator('.geo-hud').boundingBox(),x=h.x+h.width-5,y=h.y+25;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:10});await page.mouse.up();return page.locator('.geo-hud').boundingBox();}
  await page.goto(base+'geografi/mapwiz.html');await input('easy').waitFor();
  assert.equal(await page.locator('[data-prototype-difficulty]').count(),3);assert.equal(await page.locator('[data-prototype-category],#prototype-all,#prototype-none').count(),0,'Only the three difficulty choices remain');assert.doesNotMatch(await page.locator('.mapwiz-prototype-setup').innerText(),/Norgeskart/,'Setup does not promise a separate Norway map');assert(await input('easy').isChecked());assert(await input('easy').isDisabled(),'The last selected level cannot be unchecked');assert(await page.locator('#geo-start-button').isEnabled());
  await input('medium').check();assert(await input('easy').isEnabled());await input('easy').uncheck();assert(await input('medium').isDisabled());await input('hard').check();await input('medium').uncheck();assert(await input('hard').isDisabled());
  const actualPools=await page.evaluate(()=>Object.fromEntries([...MapWizPrototype.difficultyPools].map(([key,items])=>[key,items.map(t=>({category:t.quizCategory,name:t.name,difficulty:t.difficulty}))])));
  for(const level of levels){assert.equal(actualPools[level].length,counts[level]);for(const target of actualPools[level])assert.equal(assignments[target.category][target.name],level,'Every target belongs to the displayed level');}
  const keys=Object.values(actualPools).flat().map(t=>JSON.stringify([t.category,t.name]));assert.equal(new Set(keys).size,776,'Every original category/name pair is classified exactly once');
  for(const viewport of [{width:1366,height:646},{width:1280,height:720},{width:1920,height:1080},{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(viewport);await frames();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Menu fits viewport width');if(viewport.width>=1000){const rect=await page.locator('.mapwiz-prototype-setup').boundingBox();assert(rect.y>=0&&rect.y+rect.height<=viewport.height+1,'All setup choices fit desktop without scrolling');}await shot('levels-'+viewport.width);
  }
  await page.setViewportSize({width:1366,height:646});await page.locator('.quiz-page-theme').click();await shot('levels-dark');assert(await page.locator('body').evaluate(e=>e.classList.contains('dark-mode')));await page.locator('.quiz-page-theme').click();
  await page.getByRole('button',{name:'English',exact:true}).click();await page.waitForFunction(()=>QuizLanguage.language==='en');assert.match(await page.locator('.mapwiz-prototype-setup').innerText(),/Easy/);assert.equal(await page.locator('[data-prototype-difficulty]').count(),3);await shot('levels-english');await page.getByRole('button',{name:'Norsk',exact:true}).click();await page.waitForFunction(()=>QuizLanguage.language==='no');
  let randomRounds=0;
  for(const selected of [['easy'],['medium'],['hard'],['easy','medium'],['easy','hard'],['medium','hard'],levels]){
   await choose(selected);
   const report=await page.evaluate(selected=>{for(let i=0;i<20;i++){startGeoGuessr();const s=geoGuessrState;if(s.rounds.length!==10||s.results.length||s.total)return 'uncleared';if(s.rounds.some(t=>!selected.includes(t.difficulty)))return 'wrong-level';if(new Set(s.rounds.map(t=>t.name)).size!==10)return 'duplicate';}return 'ok';},selected);assert.equal(report,'ok',selected.join('+'));randomRounds+=20;
  }
  await choose(['easy']);await page.locator('#geo-start-button').click();
  await page.evaluate(()=>MapWizPrototype.begin(MapWizPrototype.difficultyPools.get('easy').filter(t=>t.quizCategory==='flags').slice(0,10)));
  assert.ok((await page.locator('.prototype-flag').getAttribute('src')).startsWith('data:image/'));assert.equal(await page.locator('.geo-hint').count(),0);
  await frames();const before=await page.locator('.geo-hud').boundingBox(),moved=await drag(190,-110);assert(Math.abs(moved.x-before.x-190)<2&&Math.abs(moved.y-Math.max(8,before.y-110))<2,'Question box drags with edge clamping');assert.equal(await page.evaluate(()=>geoGuessrState.answered),false);
  await finish();await summaryFits();assert.equal(await page.locator('#geo-markers .geo-marker').count(),20);const summary=await page.locator('.prototype-summary').boundingBox(),movedSummary=await drag(230,-100);assert(Math.abs(movedSummary.x-summary.x-230)<2&&Math.abs(movedSummary.y-Math.max(8,summary.y-100))<2);await page.locator('.geo-hud').focus();await page.keyboard.press('Home');await shot('summary-world');await replay(['easy']);
  await choose(levels);await page.locator('#geo-start-button').click();
  const projectionReport=await page.evaluate(()=>{
   const all=[...MapWizPrototype.difficultyPools.values()].flat();
   return all.map(t=>{const p=geoToPercent(t.lat,t.lon),ll=geoPercentToLatLon(p.x,p.y);return {name:t.name,category:t.quizCategory,inside:p.x>=0&&p.x<=100&&p.y>=0&&p.y<=100,error:Math.max(Math.abs(ll.lat-t.lat),Math.abs(ll.lon-t.lon))};});
  });
  assert.equal(projectionReport.length,776);assert(projectionReport.every(t=>t.inside&&t.error<1e-7),'All 776 targets, including Arctic Norway, fit and round-trip through the world map');
  assert(await page.evaluate(()=>{const metadata=MAPWIZ_PROTOTYPE_DATA.worldMap;return metadata.projection==='mercator'&&metadata.top>=81&&document.querySelector('.geo-map-image').getAttribute('src')===metadata.image;}),'The displayed world image uses the same extended northern bounds as the projection');
  assert.equal(projectionReport.filter(t=>t.category==='place:Norge').length,111);assert(projectionReport.find(t=>t.category==='place:Norge'&&t.name==='Svalbard').inside);
  await page.evaluate(()=>{const all=[...MapWizPrototype.difficultyPools.values()].flat(),take=(category,name)=>all.find(t=>t.quizCategory===category&&t.name===name);MapWizPrototype.begin([take('flags','Danmark'),take('place:Norge','Svalbard'),take('capitals','Paris'),take('place:Norge','Jan Mayen'),take('place:Norge','Galdhøpiggen'),take('mountains','K2'),take('landmarks','Machu Picchu'),take('place:Norge','Oslo'),take('ranges','Atlas'),take('cities','Mekka')]);});
  for(let i=0;i<10;i++){
   assert.equal(await page.evaluate(()=>geoGuessrState.norwayOnly),false,'Every question uses the world-map scoring path');
   assert.equal(await page.locator('[data-no-frame],.norway-continuous-mode').count(),0,'Norwegian questions never create a separate map');
   assert.equal(await page.locator('.geo-world-content').count(),1);await exactAnswer();
  }
  await summaryFits();
  assert.equal(await page.locator('[data-summary-map],.prototype-summary-maps').count(),0,'Results use one world map without map selectors');
  assert.equal(await page.locator('.prototype-results tbody tr[tabindex]').count(),0,'Result rows no longer act as map selectors');
  for(const viewport of [{width:1366,height:646},{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(viewport);await frames();await summaryFits();
   const report=await page.evaluate(()=>{
    const s=geoGuessrState,frame=document.querySelector('.geo-world-content').getBoundingClientRect(),markers=[...document.querySelectorAll('.geo-marker.answer')];
    return {count:markers.length,lines:document.querySelectorAll('.geo-line-layer g[data-result-index]').length,imageLoaded:document.querySelector('.geo-map-image').naturalWidth>1000,indexes:markers.map(marker=>Number(marker.dataset.resultIndex)),errors:markers.map(marker=>{const target=s.rounds[Number(marker.dataset.resultIndex)],p=geoToPercent(target.lat,target.lon),r=marker.getBoundingClientRect();return Math.hypot(r.x+r.width/2-(frame.x+p.x/100*frame.width),r.y+r.height/2-(frame.y+p.y/100*frame.height));})};
   });
   assert.equal(report.count,10,'Every answer marker remains on the same world map');assert.equal(report.lines,10);assert.equal(await page.locator('#geo-markers .geo-marker').count(),20);assert(report.imageLoaded);assert.deepEqual(report.indexes,[0,1,2,3,4,5,6,7,8,9]);assert(report.errors.every(error=>error<1),'World markers remain aligned after resize '+JSON.stringify(report));await shot('summary-world-'+viewport.width);
  }
  await replay(levels);
  await page.setViewportSize({width:390,height:844});await choose(['easy']);await page.locator('#geo-start-button').click();await frames();const h=await page.locator('.geo-hud').boundingBox(),cdp=await context.newCDPSession(page),x=h.x+h.width-5,y=h.y+25;await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+5*i,y:y-8*i}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert((await page.locator('.geo-hud').boundingBox()).y<h.y-50,'Touch dragging works');assert.equal(await page.evaluate(()=>geoGuessrState.answered),false);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.detach();
  assert.equal(requests.filter(url=>/flagcdn/.test(url)).length,0);assert.equal(requests.filter(url=>/\/mapwiz-norway\//.test(url)).length,0,'The Norway atlas is never requested');assert.equal(await page.locator('script[src*=cloudflareinsights]').count(),1);const tracked=requests.filter(url=>/cloudflareinsights/.test(url)).length;await page.goto(base+'prototypes/mapwiz.html');await input('easy').waitFor();assert.equal(await page.locator('[data-prototype-difficulty]').count(),3);assert.equal(requests.filter(url=>/cloudflareinsights/.test(url)).length,tracked,'Preview is untracked');assert.deepEqual(errors,[]);
  console.log(JSON.stringify({levels:3,classified:776,promotions:9,combinations:7,randomRounds,worldOnly:true,norwayTargets:111,allTargetsOnWorldMap:776,drag:true,touch:true,replay:true,languages:2,mobile:true,errors}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
