/* Verify the independently loaded water layer stays registered during zoom,
   does not intercept answers, and is reused across questions. No public API. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','public,max-age=3600');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'}),errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1366,height:768}});await context.route('**/*',route=>{const url=route.request().url();if(/score-service(?:-[a-f0-9]+)?\.js/.test(url))return route.fulfill({contentType:'text/javascript',body:'window.GEO_SCORE_API="";'});return url.startsWith(base)||/^(data|blob):/.test(url)?route.continue():route.abort();});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  if(process.env.LAYOUT_SCREENSHOTS)fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});
  await page.goto(base+'/geografi/mapwiz.html');await page.locator('#geo-start-button').click();
  await page.waitForFunction(()=>{const water=document.querySelector('.geo-map-water');return water?.complete&&water.naturalWidth>0;});
  const source=await page.locator('.geo-map-water').getAttribute('src');
  async function aligned(){
   const status=await page.evaluate(()=>{const image=document.querySelector('.geo-map-image'),water=document.querySelector('.geo-map-water'),content=document.querySelector('.geo-world-content'),a=image.getBoundingClientRect(),b=water.getBoundingClientRect(),c=content.getBoundingClientRect();return {count:document.querySelectorAll('.geo-map-water').length,loaded:water.complete&&water.naturalWidth>0,pointer:getComputedStyle(water).pointerEvents,error:Math.max(...['x','y','width','height'].flatMap(k=>[Math.abs(a[k]-b[k]),Math.abs(b[k]-c[k])]))};});
   assert.equal(status.count,1);assert(status.loaded);assert.equal(status.pointer,'none');assert(status.error<.1,'Water and relief must share the exact geographic rectangle '+JSON.stringify(status));
  }
  await aligned();await page.locator('#mapwiz-ready-start').click();await aligned();
  // Exercise maximum zoom, then use a real click through the water image.
  for(let i=0;i<7;i++)if(await page.locator('[data-mapwiz-zoom=in]').isEnabled())await page.locator('[data-mapwiz-zoom=in]').click();
  await aligned();assert.equal(await page.evaluate(()=>MapWizZoom.getState().zoom),6);
  const zoomFrameMs=await page.evaluate(async()=>{const samples=[],scroll=document.querySelector('.geo-world-scroll');let prior=performance.now();for(let i=0;i<24;i++){scroll.dispatchEvent(new WheelEvent('wheel',{deltaY:i%2?35:-35,clientX:innerWidth*.65,clientY:innerHeight*.4,bubbles:true,cancelable:true}));await new Promise(requestAnimationFrame);const now=performance.now();samples.push(now-prior);prior=now;}samples.sort((a,b)=>a-b);return {median:samples[12],p95:samples[22],max:samples[23]};});assert(zoomFrameMs.p95<200,'The water layer must not repeatedly stall zoom '+JSON.stringify(zoomFrameMs));
  const point=await page.evaluate(()=>{const target=MapWizPrototype.pools.get('lakes').find(t=>/Victoria|Viktoria/.test(t.name));if(!target)throw Error('Missing lake control target');MapWizPrototype.begin(Array(10).fill(target));const scroll=document.querySelector('.geo-world-scroll');for(let i=0;i<6;i++)document.querySelector('[data-mapwiz-zoom=in]').click();const content=document.querySelector('.geo-world-content'),p=geoToPercent(target.lat,target.lon);scroll.scrollLeft=p.x/100*content.offsetWidth-scroll.clientWidth*.65;scroll.scrollTop=p.y/100*content.offsetHeight-scroll.clientHeight*.4;const r=content.getBoundingClientRect();return {x:r.left+r.width*p.x/100,y:r.top+r.height*p.y/100};});
  await aligned();await page.mouse.click(point.x,point.y);await page.waitForFunction(()=>geoGuessrState.answered);assert(await page.evaluate(()=>geoGuessrState.results[0].base>99),'The water layer must not block a correct lake click');
  await page.locator('.geo-next-button').click();await aligned();assert.equal(await page.locator('.geo-map-water').getAttribute('src'),source,'Every question reuses the same cacheable water asset');
  if(process.env.LAYOUT_SCREENSHOTS)await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,'mapwiz-lakes-day.png')});
  await page.evaluate(()=>document.body.classList.add('dark-mode'));assert.notEqual(await page.locator('.geo-map-water').evaluate(el=>getComputedStyle(el).filter),'none');
  if(process.env.LAYOUT_SCREENSHOTS){fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,'mapwiz-water-zoom.png')});}
  await page.setViewportSize({width:390,height:844});await aligned();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/mapwiz-world-map.json'),'utf8')),waterBytes=fs.statSync(path.join(root,source)).size;assert(waterBytes<1_500_000,'Water overlay has a bounded download size');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({waterBytes,zoomFrameMs,lakes:manifest.hydrology.featureCount,alignedAtSixfoldZoom:true,lakeClick:true,reused:true,dark:true,mobile:true,errors}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
