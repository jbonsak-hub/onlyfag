const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});const errors=[];
try{for(const viewport of [{width:1366,height:646},{width:1280,height:720},{width:390,height:844}]){
 const context=await browser.newContext({viewport});const configs=[];
 await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(base)||/^(data|blob):/.test(url))return route.continue();if(url.includes('onlyfag-geography-scores')&&url.includes('/scores?')){configs.push(JSON.parse(new URL(url).searchParams.get('config')));return route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"rows":[]}'});}return route.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"error":"unavailable"}'});});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/geografi.html#verden-quiz');
 const cards=page.locator('.geoquiz-mode-list>.geoquiz-mode-row');
 const labels=await cards.evaluateAll(els=>els.slice().sort((a,b)=>Number(getComputedStyle(a).order)-Number(getComputedStyle(b).order)).slice(0,5).map(el=>el.querySelector('strong').textContent));assert.deepEqual(labels,['Flagg','Hovedsteder','Kart','Land','MapWiz']);
 assert((await page.locator('.geoquiz-mode-row').filter({has:page.getByText('MapWiz',{exact:true})}).innerText()).includes('Hvor godt kan du plassere kjente steder på verdenskartet?'));
 for(const region of ['world','europe']){
  await page.goto(base+'/geografi/landquiz.html');await page.locator('.country-visual-setup').waitFor();
  assert.equal(await page.locator('.country-region-btn').count(),7);assert.equal(await page.locator('.country-region-setup button').filter({hasText:/Topp 10/}).count(),0);
  await page.waitForFunction(()=>[...document.querySelectorAll('.quiz-region-icon')].every(img=>img.complete&&img.naturalWidth>0));
  const bounds=await page.locator('.country-visual-setup').boundingBox();assert(bounds.y>=(viewport.width>700?48:64)&&bounds.y+bounds.height<=viewport.height,'Region menu has clear space above it and fits viewport');
  if(process.env.COUNTRIES_SCREENSHOTS&&region==='world'){fs.mkdirSync(process.env.COUNTRIES_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.COUNTRIES_SCREENSHOTS,'menu-'+viewport.width+'.png')});}
  await page.locator('[data-region="'+region+'"]').click();await page.locator('#country-map-canvas').waitFor();
  await page.locator('#country-guess').fill('Norge');await page.locator('#country-guess').press('Enter');await page.waitForFunction(()=>worldTrainerState.found.some(c=>c.country==='Norge'));
  await page.locator('#country-guess').fill('Tysk');
  const pixel=()=>page.evaluate(()=>[...document.querySelector('#country-map-canvas').getContext('2d').getImageData(0,0,1,1).data].slice(0,3));
  const light=await pixel();await page.locator('.quiz-page-theme').click();await page.waitForFunction(light=>{const pixel=document.querySelector('#country-map-canvas').getContext('2d').getImageData(0,0,1,1).data;return pixel[0]!==light[0]&&pixel[0]<180;},light);assert((await pixel())[0]<light[0]);
  assert.equal(await page.locator('#country-guess').inputValue(),'Tysk');assert.equal(await page.evaluate(()=>worldTrainerState.found.length),1);
  await page.locator('.quiz-page-theme').click();await page.waitForFunction(light=>{const pixel=document.querySelector('#country-map-canvas').getContext('2d').getImageData(0,0,1,1).data;return light.every((value,index)=>pixel[index]===value);},light);assert.deepEqual(await pixel(),light);
  const footer=page.locator('.quiz-layout-footer');assert.equal(await footer.locator('.quiz-in-game-top-ten').count(),1);
  const back=await footer.locator('.quiz-page-back').boundingBox(),top=await footer.locator('.quiz-in-game-top-ten').boundingBox();assert(top.x>=back.x+back.width-1&&Math.abs(top.y-back.y)<2,'Ranking is right of overview');
  await footer.locator('.quiz-in-game-top-ten').click();await page.locator('#geo-online-content').getByText('Ingen resultater ennå.').waitFor();assert.equal(configs.at(-1).game,'countries');assert.equal(configs.at(-1).region,region);await page.keyboard.press('Escape');
  await page.locator('.country-map-action.finish').click();await page.locator('#country-map-complete').waitFor();
  const result=await page.locator('#country-map-complete').boundingBox(),map=await page.locator('#country-map-wrap').boundingBox();assert(result.y>=map.y&&result.y+result.height<=map.y+map.height+1,'Compact result fits map on every screen');
  assert(await page.locator('.country-map-missing span').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)<=10));
  await page.locator('.country-map-missing').evaluate(el=>el.scrollTop=el.scrollHeight);
  const resultButton=await page.locator('.country-map-result-btn').boundingBox();assert(resultButton.y>=result.y&&resultButton.y+resultButton.height<=result.y+result.height,'Result navigation stays visible while scrolling names');
  if(process.env.COUNTRIES_SCREENSHOTS){fs.mkdirSync(process.env.COUNTRIES_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.COUNTRIES_SCREENSHOTS,region+'-'+viewport.width+'.png')});}
 }
 await context.close();
}assert.deepEqual(errors,[]);console.log('PASS countries: fourth hub card, new MapWiz copy, seven illustrated regions, no setup rankings, side-by-side footer, immediate canvas dark/light redraw with state preserved; desktop/mobile');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
