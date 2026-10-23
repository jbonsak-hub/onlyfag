// Real Kart UI against the production Worker code and an isolated SQLite database.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite'),pw=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{try{const file=path.join(root,new URL(req.url,'http://localhost').pathname);res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404);res.end();}});
(async()=>{
 const {default:worker}=await import('../services/geography-scores/worker.mjs'),db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(root,'services/geography-scores/schema.sql'),'utf8'));
 const wrap=(sql,args=[])=>({bind(...v){return wrap(sql,v);},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}}),env={DB:{prepare:sql=>wrap(sql)},RATE_SECRET:'local-kart-test',ALLOW_LOCAL:'true'};
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/',browser=await pw.chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE}),errors=[];
 let sessionGate=null;const sessionConfigs=[];
 async function context(viewport={width:1366,height:768},english=false){
  const c=await browser.newContext({viewport});c.on('page',p=>p.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);}));
  if(english)await c.addInitScript(()=>{try{localStorage.setItem('onlyfag-geo-language','en');}catch(_){}});
  await c.route('**/*',async route=>{const r=route.request(),url=r.url();
   if(/\/score-service(?:-[a-f0-9]+)?\.js/.test(url))return route.fulfill({contentType:'text/javascript',body:"window.GEO_SCORE_API='https://scores.test';"});
   if(url.startsWith('https://scores.test')){
    if(new URL(url).pathname==='/session'){sessionConfigs.push(JSON.parse(r.postData()));const gate=sessionGate;if(gate)await gate;}
    const response=await worker.fetch(new Request(url,{method:r.method(),headers:{...r.headers(),'CF-Connecting-IP':'192.0.2.49'},...(r.postData()?{body:r.postData()}:{} )}),env);
    return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
   }
   if(url.startsWith(base)||/^(data|blob):/.test(url))return route.continue();return route.abort();
  });return c;
 }
 async function choose(page,region){await page.locator(`[data-map-region="${region}"]`).click();await page.locator('#kart-game').waitFor({state:'visible'});await page.locator('#start:not([disabled])').waitFor();assert.equal(await page.evaluate(()=>document.body.dataset.region),region);}
 async function complete(page,count,nickname){
  await page.locator('#start').click();await page.waitForFunction(()=>document.querySelector('#overlay').hidden&&document.body.dataset.phase==='playing');
  for(let i=0;i<count;i++){
   const response=page.waitForResponse(r=>r.url().endsWith('/answer'));
   assert.ok(await page.evaluate(()=>{const name=document.querySelector('#targetName').textContent,el=[...document.querySelectorAll('.state')].find(el=>el.dataset.state===name);el?.dispatchEvent(new MouseEvent('click',{bubbles:true}));return !!el;}));
   const answer=await response;assert.equal(answer.status(),200,await answer.text());await answer.finished();const next=i<count-1?page.waitForResponse(r=>r.url().endsWith('/next')):null;
   await page.clock.fastForward(700);if(next){const reply=await next;assert.equal(reply.status(),200,await reply.text());await reply.finished();}
  }
  await page.locator('#geo-online-name').waitFor();assert.equal(await page.locator('#completed').innerText(),String(count));assert.match(await page.locator('#statle-score').innerText(),new RegExp(' / '+count*100));
  await page.locator('#geo-online-name').fill(nickname);await page.locator('#geo-online-save form button').click();await page.locator('#geo-online-board tbody').waitFor();assert.match(await page.locator('#geo-online-board').innerText(),new RegExp(nickname));
 }
 try{
  const c=await context(),page=await c.newPage();await page.clock.install();await page.goto(base+'geografi/kart.html');await choose(page,'oceania');await complete(page,15,'Island Pilot');
  assert.equal(sessionConfigs[0].game,'kart');assert.equal(sessionConfigs[0].region,'oceania');await page.locator('#geo-online-board .mapwiz-top-ten-close').click();await page.locator('#kart-back').click();await page.locator('#kart-selection').waitFor({state:'visible'});
  await choose(page,'fylker');await complete(page,15,'County Pilot');assert.equal(sessionConfigs[1].game,'fylker');assert.equal(sessionConfigs[1].region,undefined);assert.equal(db.prepare('SELECT COUNT(*) n FROM scores').get().n,2);
  // A different language reads the existing continental list, never the county list.
  const mobile=await context({width:390,height:844},true),second=await mobile.newPage();await second.goto(base+'geografi/kart.html');await choose(second,'oceania');assert.equal(await second.evaluate(()=>QuizLanguage.language),'en');await second.locator('#statle-top-ten').click();await second.locator('#geo-online-board tbody').waitFor();assert.match(await second.locator('#geo-online-board').innerText(),/Island Pilot/);assert.doesNotMatch(await second.locator('#geo-online-board').innerText(),/County Pilot/);await second.locator('#geo-online-board .mapwiz-top-ten-close').click();
  // Leaving the map during the initial API request must not start an old round.
  let release;sessionGate=new Promise(resolve=>release=resolve);
  const pending=second.waitForRequest(r=>r.url().endsWith('/session'));await second.locator('#start').click();await pending;await second.locator('#kart-back').click();await second.locator('#kart-selection').waitFor({state:'visible'});release();sessionGate=null;
  await choose(second,'europe');const boardResponse=second.waitForResponse(r=>new URL(r.url()).pathname==='/scores');await second.locator('#statle-top-ten').click();const rows=await boardResponse;assert.deepEqual((await rows.json()).rows,[]);assert.equal(JSON.parse(new URL(rows.url()).searchParams.get('config')).region,'europe');assert.doesNotMatch(await second.locator('#geo-online-board').innerText(),/Island Pilot|County Pilot/);await second.locator('#geo-online-board .mapwiz-top-ten-close').click();
  assert.equal(await second.locator('#overlay').isVisible(),true);assert.deepEqual(errors,[]);console.log('PASS Kart online: Oceania15, counties15, shared-language and separate map boards, automatic prompt, pending-round cancellation, mobile UI');
 }finally{await browser.close();db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
