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
   await page.evaluate(()=>{const s=geoGuessrState,t=s.rounds[s.index],r=document.querySelector(s.norwayOnly?'[data-no-frame]':'.geo-world-content').getBoundingClientRect(),p=s.norwayOnly?MapWizNorway.project(t.lat,t.lon):geoToPercent(t.lat,t.lon),scale=s.norwayOnly?1:100;geoMapClick({clientX:r.left+p.x/scale*r.width,clientY:r.top+p.y/scale*r.height});});
   assert.ok(await page.evaluate(()=>geoGuessrState.results.at(-1).base>99),'An exact answer uses the currently displayed projection');
   await page.locator('.geo-next-button').click();await frames();
  }
  async function finish(){for(let i=0;i<10;i++)await exactAnswer();await page.locator('.prototype-summary').waitFor();}
  async function replay(expected){const previous=await page.evaluate(()=>geoGuessrState.startedAt);await page.locator('#prototype-again').click();await page.waitForFunction(()=>geoGuessrState.index===0&&!geoGuessrState.answered&&!document.querySelector('.prototype-summary'));assert.deepEqual(await page.evaluate(()=>MapWizPrototype.selected().sort()),[...expected].sort());assert.deepEqual(await page.evaluate(()=>[geoGuessrState.total,geoGuessrState.results.length,geoGuessrState.rounds.length,!!document.querySelector('.mapwiz-prototype-setup')]),[0,0,10,false]);assert.ok(await page.evaluate(()=>geoGuessrState.startedAt)>=previous);}
  async function summaryFits(){const rect=await page.locator('.prototype-summary').evaluate(e=>({bounds:e.getBoundingClientRect().toJSON(),height:e.scrollHeight,client:e.clientHeight,viewport:[innerWidth,innerHeight]}));assert.ok(rect.bounds.x>=0&&rect.bounds.y>=0&&rect.bounds.right<=rect.viewport[0]+1&&rect.bounds.bottom<=rect.viewport[1]+1,'Summary stays in viewport '+JSON.stringify(rect));assert.ok(rect.height<=rect.client+2,'All ten result rows remain visible');assert.equal(await page.locator('.prototype-results tbody tr').count(),10);}
  async function drag(dx,dy){const h=await page.locator('.geo-hud').boundingBox(),x=h.x+h.width-5,y=h.y+25;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:10});await page.mouse.up();return page.locator('.geo-hud').boundingBox();}
  await page.goto(base+'geografi/mapwiz.html');await input('easy').waitFor();
  assert.equal(await page.locator('[data-prototype-difficulty]').count(),3);assert.equal(await page.locator('[data-prototype-category],#prototype-all,#prototype-none').count(),0,'Only the three difficulty choices remain');assert(await input('easy').isChecked());assert(await input('easy').isDisabled(),'The last selected level cannot be unchecked');assert(await page.locator('#geo-start-button').isEnabled());
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
  const atlasReport=await page.evaluate(()=>{const targets=MapWizPrototype.pools.get('place:Norge');return targets.map(t=>{const p=MapWizNorway.project(t.lat,t.lon),ll=MapWizNorway.inverse(p.x,p.y);return {name:t.name,inside:p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1,error:ll?Math.max(Math.abs(ll.lat-t.lat),Math.abs(ll.lon-t.lon)):Infinity};});});assert.equal(atlasReport.length,111);assert(atlasReport.every(t=>t.inside&&t.error<1e-7),'All 111 Norwegian targets agree with the atlas');
  await page.evaluate(()=>{const all=[...MapWizPrototype.difficultyPools.values()].flat(),take=(category,name)=>all.find(t=>t.quizCategory===category&&t.name===name);MapWizPrototype.begin([take('flags','Danmark'),take('place:Norge','Svalbard'),take('capitals','Paris'),take('place:Norge','Jan Mayen'),take('place:Norge','Galdhøpiggen'),take('mountains','K2'),take('landmarks','Machu Picchu'),take('place:Norge','Oslo'),take('ranges','Atlas'),take('cities','Mekka')]);});
  for(let i=0;i<10;i++){const view=await page.evaluate(()=>({norway:geoGuessrState.norwayOnly,category:geoGuessrState.rounds[geoGuessrState.index].quizCategory}));assert.equal(view.norway,view.category==='place:Norge','Each question selects the physical map for its actual place');assert.equal(await page.locator('[data-no-frame]').count(),view.norway?1:0);await exactAnswer();}
  await summaryFits();
  // A result row keeps its original question index when switching between maps.
  const norwayRow=page.locator('.prototype-results tr[data-result-index="1"]'),worldRow=page.locator('.prototype-results tr[data-result-index="2"]');
  await page.locator('[data-summary-map="world"]').click();
  await norwayRow.click();await page.waitForFunction(()=>geoGuessrState.summaryMap==='norway');
  assert.deepEqual(await page.locator('.geo-marker.answer').evaluateAll(markers=>markers.map(marker=>Number(marker.dataset.resultIndex))),[1,3,4,7],'Clicking a Norwegian result row selects its map and preserves original question indices');
  await worldRow.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>geoGuessrState.summaryMap==='world');
  assert.deepEqual(await page.locator('.geo-marker.answer').evaluateAll(markers=>markers.map(marker=>Number(marker.dataset.resultIndex))),[0,2,5,6,8,9],'Keyboard selection of a world result row restores the original world question indices');
  assert.equal(await page.locator('.prototype-results tbody tr').count(),10,'Map selection retains the complete results table');
  for(const viewport of [{width:1366,height:646},{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(viewport);await frames();await summaryFits();
   for(const kind of ['world','norway']){
    await page.locator('[data-summary-map="'+kind+'"]').click();await frames();
    const report=await page.evaluate(kind=>{const s=geoGuessrState,visible=s.results.filter(r=>r.norwayMap===(kind==='norway')),stage=document.querySelector('.geo-map-stage'),frame=stage.querySelector(kind==='norway'?'[data-no-frame]':'.geo-world-content').getBoundingClientRect(),markers=[...document.querySelectorAll('.geo-marker.answer')];return {expected:visible.length,count:markers.length,imageLoaded:kind!=='norway'||document.querySelector('[data-no-frame] img').naturalWidth>2000,errors:markers.map(marker=>{const index=Number(marker.dataset.resultIndex??marker.closest('[data-result-index]')?.dataset.resultIndex??-1),result=index>=0?s.results[index]:visible[markers.indexOf(marker)],target=s.rounds[s.results.indexOf(result)],p=kind==='norway'?MapWizNorway.project(target.lat,target.lon):geoToPercent(target.lat,target.lon),scale=kind==='norway'?1:100,r=marker.getBoundingClientRect();return Math.hypot(r.x+r.width/2-(frame.x+p.x/scale*frame.width),r.y+r.height/2-(frame.y+p.y/scale*frame.height));})};},kind);
    assert.equal(report.count,report.expected,'Only matching-map markers are shown');assert(report.imageLoaded);assert(report.errors.every(error=>error<1),'Summary markers remain on the correct map after resize '+JSON.stringify(report));await shot('summary-'+kind+'-'+viewport.width);
   }
  }
  await replay(levels);
  await page.setViewportSize({width:390,height:844});await choose(['easy']);await page.locator('#geo-start-button').click();await frames();const h=await page.locator('.geo-hud').boundingBox(),cdp=await context.newCDPSession(page),x=h.x+h.width-5,y=h.y+25;await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+5*i,y:y-8*i}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert((await page.locator('.geo-hud').boundingBox()).y<h.y-50,'Touch dragging works');assert.equal(await page.evaluate(()=>geoGuessrState.answered),false);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.detach();
  assert.equal(requests.filter(url=>/flagcdn/.test(url)).length,0);assert.equal(await page.locator('script[src*=cloudflareinsights]').count(),1);const tracked=requests.filter(url=>/cloudflareinsights/.test(url)).length;await page.goto(base+'prototypes/mapwiz.html');await input('easy').waitFor();assert.equal(await page.locator('[data-prototype-difficulty]').count(),3);assert.equal(requests.filter(url=>/cloudflareinsights/.test(url)).length,tracked,'Preview is untracked');assert.deepEqual(errors,[]);
  console.log(JSON.stringify({levels:3,classified:776,promotions:9,combinations:7,randomRounds,mixedMaps:true,norwayTargets:111,drag:true,touch:true,replay:true,languages:2,mobile:true,errors}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
