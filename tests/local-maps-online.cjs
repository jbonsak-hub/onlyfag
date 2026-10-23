// County municipality and Oslo borough quizzes against the real Worker and an isolated database.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite'),pw=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const osloMap=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/oslo-bydeler/oslo.json'),'utf8')),osloCount=osloMap.states.length;
assert.equal(osloMap.ruleset,'oslo-areas-v5');assert.equal(osloCount,43);
const municipalityIndex=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/municipalities/index-v3.json'),'utf8')),compactCounty=municipalityIndex.counties.find(county=>county.code==='03');
assert.equal(compactCounty.quizCount,31);assert.equal(compactCounty.variant,'oslo-surroundings-v3');
const legacyMunicipalityHtml=cp.execFileSync('git',['show','095d022:geografi/kommuner.html'],{cwd:root});
const historicalMaps=[{count:16,commit:'54ead85',variant:undefined},{count:28,commit:'c876d0f',variant:'oslo-28'},{count:57,commit:'f3ca0f1',variant:'oslo-areas-v3'},{count:35,commit:'42a7ecf',variant:'oslo-areas-v4'}];
const legacyHtml=new Map(historicalMaps.map(({count,commit})=>[String(count),cp.execFileSync('git',['show',commit+':geografi/oslo-bydeler.html'],{cwd:root})]));
const server=http.createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=path.join(root,url.pathname);res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'application/octet-stream');if(url.pathname==='/geografi/oslo-bydeler.html'&&legacyHtml.has(url.searchParams.get('legacy')))return res.end(legacyHtml.get(url.searchParams.get('legacy')));if(url.pathname==='/geografi/kommuner.html'&&url.searchParams.get('legacy')==='54')return res.end(legacyMunicipalityHtml);res.end(fs.readFileSync(file));}catch(_){res.writeHead(404);res.end();}});
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
 async function chooseCounty(page,county){await page.goto(base+'geografi/kommuner.html?fylke='+county);await page.locator('#kart-game').waitFor({state:'visible'});await page.locator('#start:enabled').waitFor();assert.equal(await page.evaluate(()=>document.body.dataset.county),county);}
 async function answerCurrent(page,hasNext=true){
  const response=page.waitForResponse(r=>r.url().endsWith('/answer'));
  assert.ok(await page.evaluate(()=>{const name=document.querySelector('#targetName').textContent,el=[...document.querySelectorAll('.state')].find(el=>el.dataset.state===name);el?.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));return !!el;}));
  const answer=await response;assert.equal(answer.status(),200,await answer.text());await answer.finished();const next=hasNext?page.waitForResponse(r=>r.url().endsWith('/next')):null;
  await page.clock.fastForward(700);if(next){const reply=await next;assert.equal(reply.status(),200,await reply.text());await reply.finished();}
 }
 async function complete(page,count,nickname){
  await page.locator('#start').click();await page.waitForFunction(()=>document.querySelector('#overlay').hidden&&document.body.dataset.phase==='playing');
  for(let i=0;i<count;i++){
   await answerCurrent(page,i<count-1);
  }
  await page.locator('#geo-online-name').waitFor();assert.equal(await page.locator('#completed').innerText(),String(count));assert.match(await page.locator('#statle-score').innerText(),new RegExp(' / '+count*100));
  if(await page.locator('body').getAttribute('data-quiz')==='kommuner')assert.equal(await page.locator('#feedback').textContent(),'','Municipality completion omits the redundant summary');else assert.match(await page.locator('#feedback').textContent(),new RegExp('Alle '+count+' fullført'),'Other shape quizzes retain their completion feedback');
  await page.locator('#geo-online-name').fill(nickname);await page.locator('#geo-online-save form button').click();await page.locator('#geo-online-board tbody').waitFor();assert.match(await page.locator('#geo-online-board').innerText(),new RegExp(nickname));
 }
 try{
  const c=await context(),page=await c.newPage();await page.clock.install();await chooseCounty(page,'39');await complete(page,6,'Vestfold Pilot');
  assert.equal(sessionConfigs[0].game,'kommuner');assert.equal(sessionConfigs[0].county,'39');await page.locator('#geo-online-board .mapwiz-top-ten-close').click();await page.locator('#kart-back').click();await page.locator('#municipality-selection').waitFor({state:'visible'});
  await page.goto(base+'geografi/oslo-bydeler.html');await page.locator('#start:enabled').waitFor();await complete(page,osloCount,'Oslo Pilot');assert.equal(sessionConfigs[1].game,'bydeler');assert.equal(sessionConfigs[1].variant,'oslo-areas-v5');assert.equal(db.prepare('SELECT COUNT(*) n FROM scores').get().n,2);await page.locator('#geo-online-board .mapwiz-top-ten-close').click();
  const {board:boardKey}=await import('../services/geography-scores/rules.mjs');db.prepare('INSERT INTO scores VALUES(?,?,?,?,?,?)').run('legacy-oslo54',boardKey({game:'kommuner',county:'03'}),'Legacy Oslo54',5400,60000,Date.now());
  const legacyMunicipality=await c.newPage();await legacyMunicipality.clock.install();await legacyMunicipality.goto(base+'geografi/kommuner.html?legacy=54&fylke=03');await legacyMunicipality.locator('#start:enabled').waitFor();assert.equal(await legacyMunicipality.locator('#states .municipality[data-state]').count(),54);
  const legacySessionReply=legacyMunicipality.waitForResponse(r=>r.url().endsWith('/session'));await legacyMunicipality.locator('#start').click();const legacySession=await legacySessionReply;assert.equal(legacySession.status(),201);const legacyRun=await legacySession.json();assert.equal(legacyRun.config.variant,undefined);assert.equal(legacyRun.questions.length,54);await legacyMunicipality.waitForFunction(()=>document.body.dataset.phase==='playing');await answerCurrent(legacyMunicipality);
  await chooseCounty(page,'03');await complete(page,compactCounty.quizCount,'Omegn Pilot');assert.equal(sessionConfigs.at(-1).variant,'oslo-surroundings-v3');assert.doesNotMatch(await page.locator('#geo-online-board').innerText(),/Legacy Oslo54|Vestfold Pilot|Oslo Pilot/);await page.locator('#geo-online-board .mapwiz-top-ten-close').click();
  await answerCurrent(legacyMunicipality);assert.equal(await legacyMunicipality.locator('#completed').innerText(),'2','An active cached54 session keeps accepting answers alongside the new30 variant');
  // Reload the cached page for the independent leaderboard read after proving
  // that its in-progress session survives the new variant's completed round.
  await legacyMunicipality.bringToFront();await legacyMunicipality.goto(base+'geografi/kommuner.html?legacy=54&fylke=03');await legacyMunicipality.locator('#start:enabled').waitFor();
  const [legacyBoard]=await Promise.all([legacyMunicipality.waitForResponse(r=>new URL(r.url()).pathname==='/scores'),legacyMunicipality.locator('#statle-top-ten').click()]);assert.equal(legacyBoard.status(),200);assert.equal(JSON.parse(new URL(legacyBoard.url()).searchParams.get('config')).variant,undefined);assert.deepEqual((await legacyBoard.json()).rows.map(row=>row.nickname),['Legacy Oslo54'],'The old54 board retains its own scores');await legacyMunicipality.close();
  const mobile=await context({width:390,height:844},true),second=await mobile.newPage();await chooseCounty(second,'39');assert.equal(await second.evaluate(()=>QuizLanguage.language),'en');await second.locator('#statle-top-ten').click();await second.locator('#geo-online-board tbody').waitFor();assert.match(await second.locator('#geo-online-board').innerText(),/Vestfold Pilot/);assert.doesNotMatch(await second.locator('#geo-online-board').innerText(),/Oslo Pilot/);await second.locator('#geo-online-board .mapwiz-top-ten-close').click();
  // An old county session must never start after returning to the chooser.
  let release;sessionGate=new Promise(resolve=>release=resolve);
  const pending=second.waitForRequest(r=>r.url().endsWith('/session'));await second.locator('#start').click();await pending;await second.locator('#kart-back').click();await second.locator('#municipality-selection').waitFor({state:'visible'});release();sessionGate=null;
  const index=municipalityIndex;
  for(const county of index.counties){
   await chooseCounty(second,county.code);const response=second.waitForResponse(r=>new URL(r.url()).pathname==='/scores');await second.locator('#statle-top-ten').click();const result=await response;assert.equal(result.status(),200);const config=JSON.parse(new URL(result.url()).searchParams.get('config'));assert.equal(config.game,'kommuner');assert.equal(config.county,county.code);assert.equal(config.variant,county.code==='03'?'oslo-surroundings-v3':undefined);const rows=(await result.json()).rows;assert.equal(rows.length,['39','03'].includes(county.code)?1:0);if(county.code==='03')assert.equal(rows[0].nickname,'Omegn Pilot');await second.locator('#geo-online-board .mapwiz-top-ten-close').click();
  }
  await second.goto(base+'geografi/oslo-bydeler.html');await second.locator('#start:enabled').waitFor();await second.locator('#statle-top-ten').click();await second.locator('#geo-online-board tbody').waitFor();assert.match(await second.locator('#geo-online-board').innerText(),/Oslo Pilot/);assert.doesNotMatch(await second.locator('#geo-online-board').innerText(),/Vestfold Pilot/);
  const legacyPage=await c.newPage();await legacyPage.clock.install();
  for(const {count,variant} of historicalMaps){
   await legacyPage.goto(base+'geografi/oslo-bydeler.html?legacy='+count);await legacyPage.locator('#start:enabled').waitFor();assert.equal(await legacyPage.locator('#states .state[data-state]').count(),count);
   const boardReply=legacyPage.waitForResponse(r=>new URL(r.url()).pathname==='/scores');await legacyPage.locator('#statle-top-ten').click();const board=await boardReply;assert.equal(board.status(),200);assert.equal(JSON.parse(new URL(board.url()).searchParams.get('config')).variant,variant);assert.deepEqual((await board.json()).rows,[],'The cached '+count+'-target board does not contain simplified-map scores');await legacyPage.locator('#geo-online-board .mapwiz-top-ten-close').click();
   const sessionReply=legacyPage.waitForResponse(r=>r.url().endsWith('/session'));await legacyPage.locator('#start').click();const session=await sessionReply;assert.equal(session.status(),201);const run=await session.json();assert.equal(run.config.variant,variant);assert.equal(run.questions.length,count,'The cached '+count+'-target page starts its original server-side plan');await legacyPage.waitForFunction(()=>document.body.dataset.phase==='playing');
   const answerReply=legacyPage.waitForResponse(r=>r.url().endsWith('/answer'));await legacyPage.evaluate(()=>{const name=document.querySelector('#targetName').textContent;[...document.querySelectorAll('#states .state')].find(el=>el.dataset.state===name).dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));});const answer=await answerReply;assert.equal(answer.status(),200);assert.equal(await legacyPage.locator('#completed').innerText(),'1');
  }
  assert.equal(db.prepare('SELECT COUNT(*) n FROM scores').get().n,4,'Only three local completed rounds and the legacy fixture score are stored');
  assert.deepEqual(errors,[]);console.log('PASS local-map online scores: complete Vestfold6, Oslo43 and compact municipality31 rounds, separate live cached54 plan/board, all15 county configs, five borough pools, shared-language boards, mobile and pending session cancellation');
 }finally{await browser.close();db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
