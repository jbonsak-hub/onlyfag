const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite'),pw=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{try{const file=path.join(root,new URL(req.url,'http://localhost').pathname);res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404);res.end();}});
(async()=>{
 const {default:worker}=await import('../services/geography-scores/worker.mjs');const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(root,'services/geography-scores/schema.sql'),'utf8'));
 const wrap=(sql,args=[])=>({bind(...v){return wrap(sql,v);},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}});
 const env={DB:{prepare:sql=>wrap(sql)},RATE_SECRET:'local-test',ALLOW_LOCAL:'true'};
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/',browser=await pw.chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE}),errors=[];
 let failApi=false,apiDelay=0;
 async function context(viewport={width:1366,height:768}){
  const c=await browser.newContext({viewport});c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  await c.route('**/*',async r=>{
   const url=r.request().url();if(/\/score-service(?:-[a-f0-9]+)?\.js/.test(url))return r.fulfill({contentType:'text/javascript',body:"window.GEO_SCORE_API='https://scores.test';"});
   if(url.startsWith('https://scores.test')){if(failApi)return r.fulfill({status:503,headers:{'Access-Control-Allow-Origin':new URL(base).origin},contentType:'application/json',body:'{"error":"unavailable"}'});if(apiDelay&&new URL(url).pathname==='/answer')await new Promise(resolve=>setTimeout(resolve,apiDelay));const request=new Request(url,{method:r.request().method(),headers:{...r.request().headers(),'CF-Connecting-IP':'192.0.2.44'},...(r.request().postData()?{body:r.request().postData()}:{} )});const result=await worker.fetch(request,env);return r.fulfill({status:result.status,headers:Object.fromEntries(result.headers),body:await result.text()});}
   if(url.startsWith(base)||/^(data|blob):/.test(url))return r.continue();return r.abort();
  });return c;
 }
 const shot=async(page,name)=>{if(process.env.LAYOUT_SCREENSHOTS){fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,name+'.png')});}};
 try{
  const c=await context(),page=await c.newPage();page.on('requestfailed',r=>{if(r.url().includes('scores.test'))console.log('Request failed',new URL(r.url()).pathname,r.failure().errorText);});page.on('response',async r=>{if(r.url().includes('scores.test')&&r.status()>=400)console.log('API error',r.status(),await r.text());});
  await page.clock.install();await page.goto(base+'geografi/statle.html');await page.locator('#start:not([disabled])').waitFor();await page.locator('#start').click();await page.waitForFunction(()=>document.querySelector('#overlay').hidden&&document.body.dataset.phase==='playing');
  for(let i=0;i<50;i++){
   if(i%10===0)console.log('Statle step',i,await page.locator('#targetName').innerText());
   const response=page.waitForResponse(r=>r.url().endsWith('/answer'));
   const clicked=await page.evaluate(()=>{const name=document.querySelector('#targetName').textContent;const el=[...document.querySelectorAll('.state')].find(el=>el.dataset.state===name);if(el)el.dispatchEvent(new MouseEvent('click',{bubbles:true}));return {name,element:!!el,notice:document.querySelector('#geo-online-notice')?.textContent};});assert.ok(clicked.element,JSON.stringify(clicked));
   const answer=await response;assert.equal(answer.status(),200,await answer.text());await answer.finished();const next=i<49?page.waitForResponse(r=>r.url().endsWith('/next')):null;await page.clock.fastForward(700);if(next){const r=await next;assert.equal(r.status(),200,await r.text());await r.finished();}
  }
  await page.locator('#geo-online-name').waitFor();assert.equal(await page.locator('#completed').innerText(),'50');assert.match(await page.locator('#geo-online-save').innerText(),/Du er på topp 10!/);await shot(page,'statle-prompt');await page.locator('#geo-online-name').fill('Statle Pilot');await page.locator('#geo-online-save form button').click();await page.locator('#geo-online-board tbody').waitFor();assert.match(await page.locator('#geo-online-board').innerText(),/Statle Pilot/);assert.equal(db.prepare('SELECT COUNT(*) n FROM scores').get().n,1);assert.deepEqual(errors,[]);console.log(JSON.stringify({statle:true,states:50,prompt:true,published:true,errors}));
  const perfect=await c.newPage();await perfect.clock.install();await perfect.goto(base+'geografi/flaggquiz.html');const started=perfect.waitForResponse(r=>r.url().endsWith('/session'));await perfect.evaluate(()=>{document.querySelector('.world-region').value='oceania';return startWorldTrainer('flags');});const count=(await (await started).json()).questions.length;
  for(let i=0;i<count;i++){const response=perfect.waitForResponse(r=>r.url().endsWith('/answer'));await perfect.evaluate(()=>{const index=worldTrainerState.current.options.findIndex(o=>worldTrainerState.current.isCorrect(o));chooseWorldOption(index,document.querySelectorAll('.world-option')[index]);});const r=await response;assert.equal(r.status(),200);await r.finished();await perfect.clock.fastForward(700);}
  await perfect.locator('.world-perfect').waitFor();await perfect.locator('#geo-online-name').waitFor();assert.equal(await perfect.evaluate(()=>worldTrainerState.score),count);console.log('PASS perfect streak ends once all regional questions are answered');
 }finally{await browser.close();db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
