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
 const context=await browser.newContext({viewport:{width:1366,height:643}}),errors=[],requests=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 await context.route('**/*',r=>{requests.push(r.request().url());return r.request().url().startsWith(base)||/^(data|blob):/.test(r.request().url())?r.continue():r.abort()});
 const page=await context.newPage();page.on('dialog',d=>d.dismiss());
 await page.goto(base+'prototypes/mapwiz.html');await page.locator('[data-prototype-category]').first().waitFor();
 assert.equal(await page.locator('[data-prototype-category]').count(),16);assert.equal(await page.locator('[data-prototype-category]:checked').count(),0);assert.ok(await page.locator('#geo-start-button').isDisabled());
 const dataCheck=await page.evaluate(()=>{
  const r=MAPWIZ_PROTOTYPE_DATA,pools=MapWizPrototype.pools;
  return {factCountries:r.factCountries.length,flags:pools.get('flags').length,cities:pools.get('cities').length,offshore:r.countries.filter(c=>{const f=countryMapFillData().features.find(f=>f.properties.name===c.feature),ctx=document.createElement('canvas').getContext('2d');return !ctx.isPointInPath(countryMapBuildGeoPath(f.geometry,0),c.lon,c.lat,'evenodd')}).length,cityDuplicates:r.cities.length-new Set(r.cities.map(c=>c.lat+','+c.lon)).size,ny:r.cities.find(c=>c.name==='New York'),clues:r.clues.length,invalid:r.clues.filter(c=>{const sets=c.criterionIds.map(id=>new Set(r.criteria.find(k=>k.id===id).matches));const answers=r.factCountries.filter(n=>sets.every(s=>s.has(n)));return answers.length!==1||answers[0]!==c.name;}).length};
 });
 assert.equal(dataCheck.factCountries,197);assert.ok(dataCheck.flags>100);assert.ok(dataCheck.cities>=80);assert.equal(dataCheck.cityDuplicates,0);assert.equal(dataCheck.offshore,0,'Land siktepunkter are inside their country geometry');assert.ok(Math.abs(dataCheck.ny.lat-40.75)<.05&&Math.abs(dataCheck.ny.lon+73.98)<.05);assert.equal(dataCheck.invalid,0);
 if(process.env.LAYOUT_SCREENSHOTS){fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,'prototype-setup.png')});}
 const before=await page.evaluate(()=>JSON.stringify(localStorage));
 await page.locator('[data-prototype-category=flags]').check();await page.locator('#geo-start-button').click();
 assert.equal(await page.evaluate(()=>geoGuessrState.rounds.length),2);
 assert.equal(await page.locator('.prototype-flag').count(),1);
 assert.equal(await page.locator('.prototype-flag').getAttribute('alt'),'Flagget du skal kjenne igjen');
 assert.ok((await page.locator('.prototype-flag').getAttribute('src')).startsWith('data:image/'));
 let hud=await page.locator('.geo-hud').boundingBox();assert.ok(hud.x<30&&hud.y>300&&hud.width<=302,'Southwest HUD');
 const x=hud.x;await page.locator('.prototype-move').click();assert.ok((await page.locator('.geo-hud').boundingBox()).x>x+500);
 await page.locator('.prototype-move').click();
 if(process.env.LAYOUT_SCREENSHOTS){fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,'prototype-flag.png')});}
 await page.locator('.geo-map-exit').click();await page.locator('#prototype-none').click();await page.locator('[data-prototype-category=clues]').check();await page.locator('#geo-start-button').click();
 assert.equal(await page.locator('.prototype-clues li').count(),3);assert.equal(await page.locator('.geo-target-label').innerText(),'Hvilket land?');
 if(process.env.LAYOUT_SCREENSHOTS)await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,'prototype-clues.png')});
 for(let i=0;i<2;i++){
  await page.evaluate(()=>{const t=geoGuessrState.rounds[geoGuessrState.index],p=geoToPercent(t.lat,t.lon);geoMapClick({clientX:innerWidth*p.x/100,clientY:innerHeight*p.y/100})});
  assert.ok(await page.evaluate(()=>geoGuessrState.results.at(-1).base>99));
  await page.locator('.geo-next-button').click();
 }
 assert.ok(await page.locator('.prototype-summary').isVisible());
 const after=await page.evaluate(()=>JSON.stringify(localStorage));assert.equal(after,before,'Prototype does not write game scores/storage');
 // Exercise each category alone: two questions, then all categories over many random draws.
 const counts={};
 for(const category of await page.evaluate(()=>MapWizPrototype.definitions.map(d=>d[0]))){
  await page.evaluate(()=>initGeoGuessr());await page.locator('#prototype-none').click();await page.locator('[data-prototype-category="'+category+'"]').check();await page.locator('#geo-start-button').click();
  counts[category]=await page.evaluate(()=>geoGuessrState.rounds.length);assert.equal(counts[category],2,category);
  if(category==='place:Norge')assert.equal(await page.evaluate(()=>geoGuessrState.norwayOnly),true);
 }
 await page.evaluate(()=>initGeoGuessr());await page.locator('#prototype-all').click();
 const distribution=await page.evaluate(()=>{for(let i=0;i<300;i++){startGeoGuessr();const s=geoGuessrState,c={};if(s.rounds.length!==10)return 'wrong count';for(const t of s.rounds){c[t.quizCategory]=(c[t.quizCategory]||0)+1;if(c[t.quizCategory]>2)return 'category overflow';if(t.lat>75||t.lat< -58.8)return 'off-map target';}if(new Set(s.rounds.map(t=>t.name)).size!==s.rounds.length)return 'duplicate';}return 'ok';});assert.equal(distribution,'ok');
 assert.equal(requests.filter(u=>/cloudflareinsights/.test(u)).length,0,'No desktop prototype analytics');
 // Find-country removes Antarctica from both vector/background and canvas fallback.
 await page.goto(base+'geografi/landquiz.html');await page.locator('.country-region-btn').first().click();await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>Object.hasOwn(countryMapVectorSet('world').byFeature,'Antarctica')),false);
 const bottom=await page.evaluate(()=>{const c=document.getElementById('country-map-canvas'),x=c.getContext('2d'),d=x.getImageData(0,c.height-2,c.width,1).data;return Array.from({length:c.width},(_,i)=>[...d.slice(i*4,i*4+3)].join(',')).filter(s=>s!=='207,229,237').length;});assert.equal(bottom,0,'No Antarctic coast along the map bottom');
 await page.evaluate(()=>{countryMapVectorSet=()=>null;drawCountryMap();});
 const fallbackBottom=await page.evaluate(()=>{const c=document.getElementById('country-map-canvas'),x=c.getContext('2d'),d=x.getImageData(0,c.height-2,c.width,1).data;return Array.from({length:c.width},(_,i)=>[...d.slice(i*4,i*4+3)].join(',')).filter(s=>s!=='207,229,237').length;});assert.equal(fallbackBottom,0,'Canvas fallback also excludes Antarctica');
 if(process.env.LAYOUT_SCREENSHOTS)await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,'countries-no-antarctica.png')});
 const afterCountry=requests.length;
 for(const viewport of [{width:390,height:844},{width:360,height:740},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.goto(base+'prototypes/mapwiz.html');await page.locator('[data-prototype-category=clues]').check();await page.locator('#geo-start-button').click();await page.waitForTimeout(100);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const h=await page.locator('.geo-hud').boundingBox();assert.ok(h.x>=0&&h.x+h.width<=viewport.width+1&&h.y+h.height<=viewport.height+1);
  await page.locator('.prototype-move').click();await page.locator('.quiz-page-menu').click();await page.keyboard.press('Escape');
  if(process.env.LAYOUT_SCREENSHOTS)await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,'prototype-'+viewport.width+'.png')});
 }
 assert.equal(requests.slice(afterCountry).filter(u=>/cloudflareinsights/.test(u)).length,0,'No mobile prototype analytics');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({dataCheck,categories:counts,randomRounds:300,mobile:true,AntarcticaRemoved:true,errors}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
