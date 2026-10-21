const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite'),pw=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const geometry=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/norway-counties.json'),'utf8'));
const expected=['Agder','Akershus','Buskerud','Finnmark','Innlandet','Møre og Romsdal','Nordland','Oslo','Rogaland','Telemark','Troms','Trøndelag','Vestfold','Vestland','Østfold'];
assert.deepEqual(geometry.map(s=>s.n).sort((a,b)=>a.localeCompare(b,'nb')),expected.sort((a,b)=>a.localeCompare(b,'nb')));
const server=http.createServer((req,res)=>{try{const file=path.join(root,new URL(req.url,'http://localhost').pathname);res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404);res.end();}});
(async()=>{
 const {default:worker}=await import('../services/geography-scores/worker.mjs'),{board}=await import('../services/geography-scores/rules.mjs');
 const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(root,'services/geography-scores/schema.sql'),'utf8'));
 const wrap=(sql,args=[])=>({bind(...v){return wrap(sql,v);},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}});
 const env={DB:{prepare:sql=>wrap(sql)},RATE_SECRET:'county-test',ALLOW_LOCAL:'true'};
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/',browser=await pw.chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 const errors=[];
 const shot=async(page,name)=>{if(process.env.LAYOUT_SCREENSHOTS){fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,name+'.png'),fullPage:true});}};
 async function context(viewport,english=false){
  const c=await browser.newContext({viewport});c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  if(english)await c.addInitScript(()=>{try{localStorage.setItem('onlyfag-geo-language','en');}catch(_){}});
  await c.route('**/*',async r=>{
   const url=r.request().url();if(/\/score-service(?:-[a-f0-9]+)?\.js/.test(url))return r.fulfill({contentType:'text/javascript',body:"window.GEO_SCORE_API='https://scores.test';"});
   if(url.startsWith('https://scores.test')){const request=new Request(url,{method:r.request().method(),headers:{...r.request().headers(),'CF-Connecting-IP':'192.0.2.55'},...(r.request().postData()?{body:r.request().postData()}:{} )});const result=await worker.fetch(request,env);return r.fulfill({status:result.status,headers:Object.fromEntries(result.headers),body:await result.text()});}
   if(url.startsWith(base)||/^(data|blob):/.test(url))return r.continue();return r.abort();
  });return c;
 }
 async function realClick(page,name){
  const point=await page.evaluate(name=>{const el=[...document.querySelectorAll('path.state')].find(e=>e.dataset.state===name),b=el.getBBox();for(const j of [10,9,11,8,12,7,13,6,14,5,15,4,16,3,17,2,18,1,19])for(const i of [10,9,11,8,12,7,13,6,14,5,15,4,16,3,17,2,18,1,19]){const p=new DOMPoint(b.x+b.width*i/20,b.y+b.height*j/20);if(el.isPointInFill(p)){const c=p.matrixTransform(el.getScreenCTM());return {x:c.x,y:c.y};}}},name);
  assert.ok(point,name+' has a land target');await page.mouse.click(point.x,point.y);
 }
 try{
  const c=await context({width:1366,height:768}),page=await c.newPage();await page.clock.install();await page.goto(base+'geografi/fylker.html');await page.locator('#start:enabled').waitFor();
  assert.equal(await page.locator('path.state').count(),15);assert.equal(await page.locator('#map text').count(),0);assert.equal(await page.locator('.brand').innerText(),'Norske fylker');
  const centers=await page.locator('path.state').evaluateAll((els,geometry)=>els.map(el=>({name:el.dataset.state,inside:el.isPointInFill(new DOMPoint(...geometry.find(s=>s.n===el.dataset.state).c))})),geometry);assert.ok(centers.every(c=>c.inside),JSON.stringify(centers));
  await shot(page,'counties-desktop-ready');
  await page.locator('#geoMenuButton').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#geoMenuButton').getAttribute('aria-expanded'),'false');
  const resize=page.locator('.quiz-panel-resizer');await resize.focus();const before=Number(await resize.getAttribute('aria-valuenow'));await page.keyboard.press('ArrowRight');assert.equal(Number(await resize.getAttribute('aria-valuenow')),before+16);
  await page.locator('#start').click();await page.waitForFunction(()=>document.querySelector('#overlay').hidden);
  const initial=await page.locator('#targetName').innerText(),wrong=geometry.filter(s=>s.n!==initial).slice(0,2);
  for(const s of wrong){const response=page.waitForResponse(r=>r.url().endsWith('/answer'));await realClick(page,s.n);assert.equal((await response).status(),200);}
  assert.equal(await page.locator('#mistakes').innerText(),'2 feil');assert.equal(await page.locator('.hint-ring').count(),1);
  for(let i=0;i<15;i++){
   const name=await page.locator('#targetName').innerText(),answer=page.waitForResponse(r=>r.url().endsWith('/answer'));
   if(i===14)await page.locator('#skip').click();else await realClick(page,name);
   const reply=await answer;assert.equal(reply.status(),200,await reply.text());await reply.finished();
   if(i===0)assert.equal(await page.locator('path.state[data-state="'+name+'"]').getAttribute('data-band'),'2');
   const next=i<14?page.waitForResponse(r=>r.url().endsWith('/next')):null;await page.clock.fastForward(i===14?1150:700);if(next){const r=await next;assert.equal(r.status(),200,await r.text());await r.finished();}
  }
  await page.locator('#geo-online-name').waitFor();assert.equal(await page.locator('#completed').innerText(),'15');assert.equal(await page.locator('#targetName').innerText(),'Alle fylkene er på plass.');
  assert.match(await page.locator('#statle-score').innerText(),/1350.*1500/);await shot(page,'counties-finished-prompt');
  await page.locator('#geo-online-name').fill('Fylkepilot');await page.locator('#geo-online-save form button').click();await page.locator('#geo-online-board tbody').waitFor();assert.match(await page.locator('#geo-online-board').innerText(),/Fylkepilot/);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM scores WHERE board=?').get(board({game:'statle'})).n,0);
  const mobile=await context({width:390,height:844},true),p=await mobile.newPage();await p.goto(base+'geografi/fylker.html');await p.locator('#start:enabled').waitFor();
  assert.equal(await p.locator('.brand').innerText(),'Norwegian counties');assert.match(await p.locator('#start').innerText(),/Start Norwegian counties/);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await shot(p,'counties-mobile-ready');
  await p.locator('#statle-top-ten').click();await p.locator('#geo-online-board tbody').waitFor();assert.match(await p.locator('#geo-online-board').innerText(),/Fylkepilot/);await p.keyboard.press('Escape');
  await p.locator('#start').click();await p.waitForFunction(()=>document.querySelector('#overlay').hidden);await p.locator('#start').waitFor({state:'hidden'});
  const target=await p.locator('#targetName').innerText();await p.evaluate(()=>scrollTo(0,0));await realClick(p,target);await p.waitForFunction(()=>document.querySelector('#completed').textContent==='1');
  const marker=await p.locator('.small-marker .hit').boundingBox();assert.ok(marker.width>=24,'Small Oslo has a mobile target');
  await shot(p,'counties-mobile-playing');await p.locator('.quiz-page-back').click();await p.waitForURL('**/geografi.html#verden-quiz');await p.locator('#verden-quiz.active').waitFor();assert.ok(await p.locator('.geoquiz-mode-row[onclick*="geografi/kart.html"]').isVisible());
  assert.deepEqual(errors,[]);console.log(JSON.stringify({counties:15,realMapClicks:true,wrongHint:true,skip:true,completeRound:true,score:1350,max:1500,prompt:true,sharedLanguageBoard:true,separateFromStatle:true,mobile:true,panelResize:true,errors}));
 }finally{await browser.close();db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
