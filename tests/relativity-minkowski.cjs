const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'}),errors=[];
 try{
  for(const width of [1366,390]){
   const context=await browser.newContext({viewport:{width,height:844}});
   await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   for(const hash of ['','#references','#length']){
    await page.goto(base+'/prototyper/relativitetslab.html?entry='+encodeURIComponent(hash)+hash);
    await page.locator('#mink-plot circle').first().waitFor();
    assert.deepEqual(await page.evaluate(()=>Object.keys(window.RelativityModules)),['minkowski']);
    assert.equal(new URL(page.url()).hash,'#minkowski');
    assert.equal(await page.locator('#teacher-toggle,#module-nav,#previous,#next').count(),0);
   }
   await page.locator('[data-preset="light"]').click();assert.match(await page.locator('#mink-class').innerText(),/Lyslikt/);
   await page.locator('#mink-beta').fill('0.8');await page.locator('#mink-beta').dispatchEvent('input');
   assert.match(await page.locator('#mink-beta-value').innerText(),/0,80/);
   await page.locator('#mink-grid').check();assert.ok(await page.locator('#mink-plot [stroke-dasharray="3 5"]').count()>0);
   await page.locator('#mink-reset').click();assert.equal(await page.locator('#mink-x').inputValue(),'2');assert.equal(await page.locator('#mink-ct').inputValue(),'1');
   assert.match(await page.locator('#mink-class').innerText(),/Romlikt/);
   assert.ok(await page.evaluate(()=>{
    const {transform,interval}=window.RelativityPhysics;
    return [-.9,-.5,0,.5,.9].every(beta=>[[2,1],[1,3],[2,2]].every(([x,t])=>{const p=transform(x,t,beta);return Math.abs(interval(p.x,p.ct)-interval(x,t))<1e-10;}));
   }));
   await page.locator('#mink-plot').scrollIntoViewIfNeeded();
   const box=await page.locator('#mink-plot').boundingBox();
   await page.mouse.click(box.x+box.width*.6,box.y+box.height*.4);
   assert.notEqual(await page.locator('#mink-x').inputValue(),'2','event remains draggable');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
   if(process.env.SITE_CLEANUP_QA_DIR){fs.mkdirSync(process.env.SITE_CLEANUP_QA_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.SITE_CLEANUP_QA_DIR,'minkowski-'+width+'.png'),fullPage:true});}
   await page.goto(base+'/jobb/');assert.equal(await page.getByRole('link',{name:'Elev-flashcards'}).getAttribute('href'),'/klasser/');assert.equal(await page.locator('a[href="/puggenavn.html"]').count(),0);
   await page.goto(base+'/jobb/quizlab.html');assert.equal(await page.locator('h1').innerText(),'QuizLab');
   await page.goto(base+'/prototyper/');assert.equal(await page.locator('a[href="hotspot.html"]').count(),0);
   await context.close();
  }
  assert.deepEqual(errors,[]);console.log('Minkowski controls, drag, interval invariance, old routes and Jobb/QuizLab/prototype links passed at desktop and mobile widths.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
