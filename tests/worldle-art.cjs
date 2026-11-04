/* Verify geographic registration, useful offline-first art and late-load cancellation. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const metadata=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/worldle-art.json'),'utf8'));
const index=JSON.parse(fs.readFileSync(path.join(root,metadata.atlas),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{try{let file=path.join(root,new URL(req.url,'http://localhost').pathname);if(/\/quiz-assets\/worldle-statle-[a-f0-9]+\.js$/.test(file))file=path.join(root,'assets/geography/worldle-statle.js');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'}),errors=[];
 try{
  let satellite=false,delayedAtlas=false,atlasBlocked=false,firstReady,releaseAtlas;
  const context=await browser.newContext({viewport:{width:1366,height:768}});const requests=[],esri=[];
  await context.route('**/*',async route=>{const url=route.request().url();requests.push(url);
   if(url.includes('server.arcgisonline.com/')){
    esri.push(url);if(!satellite)return route.abort();
    const u=new URL(url),bbox=u.searchParams.get('bbox').split(',').map(Number);assert.equal(u.searchParams.get('bboxSR'),'3857');assert.equal(u.searchParams.get('imageSR'),'3857');assert.equal(u.searchParams.get('adjustAspectRatio'),'false');assert(Math.abs((bbox[2]-bbox[0])/(bbox[3]-bbox[1])-4/3)<1e-5);
    const entry=JSON.parse(fs.readFileSync(path.join(root,index.countries['Sierra Leone'].data),'utf8'));return route.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(root,entry.image))});
   }
   if(delayedAtlas&&url===base+metadata.atlas){atlasBlocked=true;await new Promise(resolve=>releaseAtlas=resolve);}
   if(url.startsWith(base)||/^(data|blob):/.test(url))return route.continue();return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const started=Date.now();await page.goto(base+'/geografi/worldle.html');await page.waitForFunction(()=>document.querySelector('.worldle-local-relief'));
  firstReady=Date.now()-started;assert(firstReady<6000,'Local question art is available without waiting for satellite service');
  async function show(country){await page.evaluate(async name=>{await WorldleArt.load(name);worldTrainerState.target=getWorldData().countries.find(c=>c.country===name);WorldleArt.refresh();},country);await page.waitForFunction(()=>{const image=document.querySelector('.worldle-local-relief');return image&&image.getBBox().width>0;});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
  const reports=[];
  for(const country of ['Sierra Leone','Norge','Chile','Indonesia','Fiji']){
   await show(country);const r=await page.locator('.worldle-target svg').evaluate(e=>({projection:e.dataset.worldleProjection,bbox:e.dataset.worldleBbox.split(',').map(Number),path:e.querySelector('clipPath path').getAttribute('d'),local:e.querySelector('.worldle-local-relief').getAttribute('href'),satellite:!!e.querySelector('.worldle-satellite-image')}));
   assert.equal(r.projection,'EPSG:3857');assert(Math.abs((r.bbox[2]-r.bbox[0])/(r.bbox[3]-r.bbox[1])-4/3)<1e-5);assert(r.path.length>700,'Detailed coastline, not the old coarse few-point polygon');
   if(country==='Chile')assert(r.bbox[2]-r.bbox[0]<11000000,'Tiny remote islands do not make mainland Chile vanish');
   if(country==='Fiji')assert(!r.satellite,'Date-line art uses the correctly wrapped local image instead of a broken world-seam export');
   reports.push({country,pathBytes:r.path.length,local:r.local});
   if(process.env.LAYOUT_SCREENSHOTS){fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,'worldle-'+country.replaceAll(' ','-')+'.png')});}
  }
  satellite=true;await show('Sierra Leone');await page.waitForFunction(()=>document.querySelector('.worldle-satellite-image')?.style.opacity==='1');assert.match(await page.locator('.worldle-online-source').innerText(),/Esri World Imagery/);assert(esri.length>0);
  // While a local atlas is delayed, leaving Worldle must not resurrect its run.
  const fresh=await browser.newContext({viewport:{width:390,height:844}});let unblock;await fresh.route('**/*',async route=>{const url=route.request().url();if(url===base+metadata.atlas){atlasBlocked=true;await new Promise(resolve=>unblock=resolve);}if(url.startsWith(base)||/^(data|blob):/.test(url))return route.continue();return route.abort();});
  const p2=await fresh.newPage();p2.on('pageerror',e=>errors.push(e.message));await p2.goto(base+'/geografi/worldle.html');await p2.waitForFunction(()=>window.WorldleArt);await p2.evaluate(()=>exitQuizMode());unblock?.();await p2.waitForTimeout(200);assert(await p2.evaluate(()=>typeof worldTrainerState==='undefined'||worldTrainerState===null));assert(await p2.evaluate(()=>typeof worldTrainerTimer==='undefined'||!worldTrainerTimer),'No late Worldle timer survives navigation away');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({countries:metadata.countries,indexGzip:metadata.atlasGzipBytes,maxPreviewBytes:metadata.largestImageBytes,firstReady,registered:true,offlineArt:true,satelliteUpgrade:true,startupCancelled:true,reports,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
