const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=(process.env.BASE_URL||'http://127.0.0.1:57972').replace(/\/$/,''),out=process.env.ASTRO_SCREENSHOTS||path.resolve(__dirname,'../../astronomy-integration-review');
const pages=['index','jord-mane-sol','arstider-solbane','milankovitch'];
(async()=>{
  fs.mkdirSync(out,{recursive:true});const report={cases:[],errors:[],missing:[],external:[]};
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  try{
    for(const viewport of [{width:1366,height:900},{width:1024,height:643},{width:390,height:844},{width:320,height:568}]){
      const context=await browser.newContext({viewport,reducedMotion:'reduce'});
      await context.route('**/*',route=>{
        const req=route.request();
        if(['GET','HEAD'].includes(req.method())&&(req.url().startsWith(base+'/')||/^(data|blob):/.test(req.url())))return route.continue();
        report.external.push(req.method()+' '+req.url());return route.abort();
      });
      for(const name of pages){
        const page=await context.newPage();page.on('pageerror',e=>report.errors.push({name,error:e.message}));
        page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))report.missing.push({url:r.url(),status:r.status()});});
        await page.goto(base+'/prototyper/'+name+'.html');
        if(name==='jord-mane-sol')await page.waitForFunction(()=>document.body.dataset.ready==='true');
        if(name==='arstider-solbane')await page.waitForFunction(()=>window.SeasonsLab?.snapshot().ready);
        if(name==='milankovitch')await page.waitForFunction(()=>window.MilankovitchLab?.snapshot().ready);
        const result=await page.evaluate(()=>({
          title:document.title,language:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth,
          headingCount:document.querySelectorAll('h1').length,
          nav:[...document.querySelectorAll('.prototype-nav a')].map(a=>({href:a.getAttribute('href'),current:a.getAttribute('aria-current')})),
          brokenGeometry:[...document.querySelectorAll('svg *')].filter(e=>[...e.attributes].some(a=>['d','cx','cy','x','y','r','transform','points'].includes(a.name)&&/NaN|Infinity|undefined/.test(a.value))).length,
          missingLabels:[...document.querySelectorAll('input,select')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>e.id),
          noNames:[...document.querySelectorAll('button')].filter(e=>!e.textContent.trim()&&!e.getAttribute('aria-label')).length,
          runtimeAssets:[...document.querySelectorAll('script[src],link[rel="stylesheet"]')].map(e=>e.src||e.href)
        }));
        assert.equal(result.language,'nb');assert.equal(result.headingCount,1);assert(!result.overflow,name+' must fit '+viewport.width+'px');
        assert.equal(result.brokenGeometry,0);assert.deepEqual(result.missingLabels,[]);assert.equal(result.noNames,0);
        assert.equal(result.nav.length,3);assert.equal(new Set(result.nav.map(a=>a.href)).size,3);
        if(name!=='index')assert.equal(result.nav.filter(a=>a.current==='page').length,1);
        assert(result.runtimeAssets.every(url=>url.startsWith(base+'/assets/astronomy-prototypes/')));
        assert(result.runtimeAssets.every(url=>/-[a-f0-9]{12}\.(css|js)\?v=[a-f0-9]{12}$/.test(url)),'HTML must use versioned assets');
        if(name==='jord-mane-sol')assert.equal(await page.evaluate(()=>EarthMoonLab.snapshot().playing),false);
        if(name==='arstider-solbane')assert.equal(await page.evaluate(()=>SeasonsLab.snapshot().playing),false);
        if(name==='milankovitch')assert.equal(await page.evaluate(()=>MilankovitchLab.snapshot().playing),false);
        if(viewport.width===1366){
          for(const button of await page.locator('button[aria-pressed="true"]:visible,button.primary:visible').all()){
            await button.hover();const contrast=await button.evaluate(e=>{
              const c=getComputedStyle(e),lum=color=>{const v=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return v[0]*.2126+v[1]*.7152+v[2]*.0722;},a=lum(c.color),b=lum(c.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
            });assert(contrast>=4.5,'Selected/primary button must remain legible on hover');
          }
          await page.mouse.move(0,0);
        }
        if(viewport.width===1366||viewport.width===390)await page.screenshot({path:path.join(out,name+'-'+viewport.width+'.png'),fullPage:true});
        report.cases.push({name,viewport,...result});await page.close();
      }
      await context.close();
    }
    // Exercise the links themselves, including the hub, rather than only reading hrefs.
    const page=await browser.newPage();await page.goto(base+'/prototyper/index.html');
    for(const name of pages.slice(1)){await page.locator('.prototype-nav a[href="'+name+'.html"]').click();await page.waitForURL('**/prototyper/'+name+'.html');assert.equal(await page.locator('h1').count(),1);}
    await page.close();assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);assert.deepEqual(report.external,[]);
    report.success=true;console.log(JSON.stringify({success:true,cases:report.cases.length,viewports:[1366,1024,390,320],navigation:true,localVersionedAssets:true,errors:report.errors,missing:report.missing,external:report.external}));
  }finally{await browser.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});
