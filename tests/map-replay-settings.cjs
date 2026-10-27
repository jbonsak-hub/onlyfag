/* Complete real rounds before replaying nondefault map options. Score service
   failures are mocked, so this regression never creates public sessions. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'assets/geography',name),'utf8'));
const capitals={statle:read('us-capitals.json'),europe:read('region-capitals.json').regions.europe.capitals};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
const settings=page=>page.evaluate(()=>({
 attributes:Object.fromEntries(['quiz','region','statleVariant','kartVariant','physical','statleBasemap','practice','county','riverVariant'].map(key=>[key,document.body.dataset[key]||null])),
 checkboxes:[...document.querySelectorAll('#statle-advanced,#statle-capitals,#statle-show-names,#region-capitals,#region-show-names,#continent-practice,[name="water-category"]')].map(input=>({id:input.id||input.value,checked:input.checked,disabled:input.disabled})),
 terrainImages:[...document.querySelectorAll('.map-basemap-layer img')].map(img=>img.getAttribute('src'))
}));
const cases=[
 {name:'state capitals and names with terrain',url:'/geografi/statle.html',checks:['statle-capitals','statle-show-names'],terrain:true,capitals:'statle',total:50,viewport:{width:1366,height:768}},
 {name:'European capitals and names with terrain',url:'/geografi/kart.html?region=europe',checks:['region-capitals','region-show-names'],terrain:true,capitals:'europe',total:47,viewport:{width:1366,height:768}},
 {name:'rivers in continent practice',url:'/geografi/kart.html?region=rivers',checks:['continent-practice'],terrain:false,total:41,viewport:{width:1366,height:768}},
 {name:'Norwegian counties with terrain on mobile',url:'/geografi/fylker.html',checks:[],terrain:true,total:15,viewport:{width:390,height:844}}
];
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'}),errors=[],missing=[],sessions=[];
 try{
  const context=await browser.newContext();await context.addInitScript(()=>{localStorage.setItem('onlyfag-geo-language','no');localStorage.setItem('geoDarkMode','0');});
  await context.route('**/*',route=>{const request=route.request(),url=request.url();if(/\/score-service(?:-[a-f0-9]+)?\.js/.test(url))return route.fulfill({contentType:'text/javascript',body:"window.GEO_SCORE_API='https://map-replay-scores.test';"});if(url.startsWith('https://map-replay-scores.test')){if(url.endsWith('/session'))sessions.push(JSON.parse(request.postData()));return route.fulfill({status:503,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"error":"unavailable"}'});}return url.startsWith(base)||/^(data|blob):/.test(url)?route.continue():route.abort();});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)missing.push(response.url());});await page.clock.install();
  for(const test of cases){
   await page.setViewportSize(test.viewport);await page.goto(base+test.url);await page.locator('#start:enabled').waitFor();
   for(const id of test.checks)await page.locator('#'+id).check();
   if(test.terrain){await page.locator('#statle-basemap').click();await page.waitForFunction(()=>document.body.dataset.statleBasemap==='physical'&&!document.querySelector('.map-basemap-layer').hidden);await page.waitForFunction(()=>[...document.querySelectorAll('.map-basemap-layer img')].every(img=>img.complete&&img.naturalWidth>0));}
   const targetNames=await page.locator('#states [data-state]').evaluateAll(elements=>[...new Set(elements.map(element=>element.dataset.state))]);assert.equal(targetNames.length,test.total,test.name+' includes the whole selected map');
   const previousSessions=sessions.length;await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.phase==='playing');const before=await settings(page),config=sessions.at(-1);
   if(test.name.startsWith('rivers')){assert.equal(before.attributes.physical,'true');assert.equal(before.attributes.practice,'true');assert.equal(sessions.length,previousSessions,'Continent practice never opens a ranked session');}else assert.equal(sessions.length,previousSessions+1);
   const terrain=page.locator('.map-basemap-layer');
   if(test.terrain){assert.equal(before.attributes.statleBasemap,'physical');assert(before.terrainImages.length>0,'A decoded terrain image is active');await terrain.evaluate(element=>element.dataset.replayTestLayer='original');}
   const choose=async name=>page.locator('#states [data-state]').evaluateAll((elements,name)=>{const shape=elements.find(element=>element.dataset.state===name);if(!shape)throw Error('Missing map target '+name);shape.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));},name);
   const nextTarget=async()=>{const prompt=(await page.locator('#targetName').innerText()).trim();if(!test.capitals)return prompt;const matches=Object.entries(capitals[test.capitals]).filter(([,capital])=>prompt===capital.name||prompt.startsWith(capital.name+' ('));assert.equal(matches.length,1,'A capital question resolves to one map target: '+prompt);return matches[0][0];};
   const first=await nextTarget();await choose(targetNames.find(name=>name!==first));assert.equal(await page.locator('#mistakes').innerText(),'1');
   for(let index=0;index<test.total;index++){await choose(await nextTarget());await page.clock.fastForward(700);}
   await page.waitForFunction(()=>document.body.dataset.phase==='finished');assert.equal(await page.locator('#completed').innerText(),String(test.total));assert.equal(await page.locator('#restart').innerText(),'Spill igjen');
   const completedSessions=sessions.length;await page.locator('#restart').click();await page.waitForFunction(()=>document.body.dataset.phase==='playing');
   assert(await page.locator('#overlay').evaluate(element=>element.hidden),test.name+' replays directly without the ready menu');
   assert.equal(await page.locator('#completed').innerText(),'0');assert.equal(await page.locator('#mistakes').innerText(),'0');assert.equal(await page.locator('#elapsed').innerText(),'00:00');
   assert.equal(await page.locator('#states [data-band],#smallStates [data-band],#states .mastered,#states .retry-pending').count(),0,'A full new round clears every old answer/practice colour');
   assert.equal(await page.locator('#repeat-practice').isVisible(),false);assert.equal(await page.locator('#statle-score').isVisible(),false);
   assert.deepEqual(await settings(page),before,test.name+' preserves every checkbox, selected variant, region and physical-map source');
   if(test.terrain){assert(await terrain.isVisible());assert.equal(await terrain.getAttribute('data-replay-test-layer'),'original','Replay preserves the already decoded terrain layer');assert.equal(await page.locator('#statle-basemap').getAttribute('aria-pressed'),'true');}
   if(test.name.startsWith('rivers')){assert.equal(sessions.length,completedSessions,'Practice replay remains offline');assert(await page.locator('#target-continent').isVisible());}else{assert.equal(sessions.length,completedSessions+1,'Replay requests exactly one fresh ranked session');const {requestId:oldId,...oldSettings}=config,{requestId:newId,...newSettings}=sessions.at(-1);assert.deepEqual(newSettings,oldSettings);assert.notEqual(newId,oldId);}
   await choose(await nextTarget());assert.equal(await page.locator('#completed').innerText(),'1',test.name+' replay accepts its first new answer');
   console.log('PASS map replay settings: '+test.name+' ('+test.total+' completed targets)');
  }
  assert.deepEqual(errors,[],'No browser errors');assert.deepEqual(missing,[],'All local map, symbol and terrain assets load');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
