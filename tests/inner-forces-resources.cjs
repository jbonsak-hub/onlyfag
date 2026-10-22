// Browser check of contextual learning links and the user-supplied KMZ downloads.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.kmz':'application/vnd.google-earth.kmz'};
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}
  catch(_){res.writeHead(404).end();}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined});
  try{
    const context=await browser.newContext({viewport:{width:1366,height:768},acceptDownloads:true});
    await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
    const page=await context.newPage(),errors=[],missing=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)missing.push(r.url());});
    await page.goto(base+'/geografi.html#indre-fagstoff');
    const article=page.locator('#indre-fagstoff');
    await article.waitFor({state:'visible'});
    const plates=article.locator('a[href="#indre-plategrenser"]');
    const tsunami=article.locator('a[href="#indre-tsunami"]');
    assert.equal(await plates.count(),1);
    assert.equal(await tsunami.count(),1);
    assert.match(await plates.evaluate(el=>el.closest('article').querySelector('strong').textContent),/Tre hovedtyper plategrenser/);
    assert.match(await tsunami.evaluate(el=>el.closest('article').querySelector('strong').textContent),/Jordskjelv og tsunami/);
    assert.equal(await article.locator(':scope > a.notice').count(),0,'Animation links belong inside their topics');
    for(const host of ['earthquake.usgs.gov','www.earthscope.org']){
      const link=article.locator('a[href^="https://'+host+'/"]');
      assert.equal(await link.count(),1);
      assert.match(await link.evaluate(el=>el.closest('article').querySelector('strong').textContent),/Jordskjelv og tsunami/);
      assert.equal(await link.getAttribute('target'),'_blank');
      assert.ok((await link.getAttribute('rel')).split(' ').includes('noopener'));
    }
    const box=article.locator('#indre-google-earth');
    assert.equal(await box.evaluate(el=>el.parentElement.lastElementChild===el),true,'Google Earth resources are at the foot of the article');
    assert.equal(await box.locator('a[href="https://earth.google.com/"]').count(),1);
    assert.match(await box.innerText(),/1994–2023/);
    assert.match(await box.innerText(),/kontinenter og havbunn/);
    const downloads=box.locator('a[download]');
    assert.equal(await downloads.count(),4);
    for(const link of await downloads.all()){
      const href=await link.getAttribute('href');
      const pending=page.waitForEvent('download');
      await link.click();
      const download=await pending,actual=fs.readFileSync(await download.path());
      const expected=fs.readFileSync(path.join(root,href));
      assert.equal(await download.failure(),null);
      assert.equal(actual.subarray(0,2).toString(),'PK','The download is a KMZ archive');
      assert.equal(digest(actual),digest(expected),'Browser downloads preserve the supplied archive');
      console.log('PASS KMZ download:',download.suggestedFilename(),actual.length+' bytes');
    }
    const shots=process.env.INNER_FORCES_SCREENSHOTS;
    if(shots)fs.mkdirSync(shots,{recursive:true});
    for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
      await page.setViewportSize(viewport);
      for(const dark of [false,true]){
        await page.evaluate(dark=>applyDarkMode(dark),dark);
        await box.scrollIntoViewIfNeeded();
        const metrics=await box.evaluate(el=>{
          const r=el.getBoundingClientRect();
          return {x:r.x,right:r.right,width:innerWidth,bg:getComputedStyle(el).backgroundColor,scroll:el.scrollWidth,client:el.clientWidth};
        });
        assert.ok(metrics.x>=-1&&metrics.right<=metrics.width+1&&metrics.scroll<=metrics.client+1,'Resource box fits '+JSON.stringify({viewport,dark,metrics}));
        if(dark)assert.ok(Number(metrics.bg.match(/\d+/g)[0])<50,'Resource box follows dark mode');
        if(shots)await page.screenshot({path:path.join(shots,`earth-${viewport.width}-${dark?'dark':'light'}.png`)});
      }
    }
    await page.setViewportSize({width:1366,height:768});
    await plates.click();
    await page.waitForURL('**/geografi.html#indre-plategrenser');
    await page.evaluate(()=>showContent('indre-fagstoff',null));
    await tsunami.click();
    await page.waitForURL('**/geografi.html#indre-tsunami');
    assert.deepEqual(errors,[]);
    assert.deepEqual(missing,[]);
    console.log('PASS contextual links, resource placement, light/dark layouts and animation navigation');
    await context.close();
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
