/* Regional flat maps keep only the chosen quiz countries, including small
   Caribbean states, without painting the worldwide neutral island layer. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 let browser;const errors=[];try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  const shots=process.env.COUNTRY_REGION_SCREENSHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
  for(const viewport of [{width:1920,height:950},{width:1366,height:768},{width:390,height:844}]){
   const context=await browser.newContext({viewport});
   await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(base+'/')){
    // Other tasks may be editing shared source files before the final asset build.
    if(/\/quiz-assets\/core-[a-f0-9]+\.js/.test(url))return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'assets/geography/core.js'),'utf8')});
    return route.continue();
   }if(/^(data|blob):/.test(url))return route.continue();return route.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"error":"unavailable"}'});});
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   const paint=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   for(const [region,total]of [['asia',44],['northamerica',23]]){
    await page.goto(base+'/geografi/landquiz.html');await page.locator('[data-region="'+region+'"]').click();await page.locator('#country-map-canvas').waitFor();
    assert.equal(await page.evaluate(()=>worldTrainerState.mapProjection),'globe','The recorded default stays 3D');
    await page.locator('[data-country-projection="flat"]').click();await paint();
    if(await page.locator('body').evaluate(el=>el.classList.contains('dark-mode'))){await page.locator('.quiz-page-theme').click();await paint();}
    const report=await page.evaluate(()=>{
     const s=worldTrainerState,c=document.getElementById('country-map-canvas'),r=c.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height),meta=countryMapCameraMeta(s,w,h),v=countryMapVectorSet(s.regionId);
     return {count:s.regionNames.length,features:Object.keys(v.byFeature),islandFeatures:Object.keys(v.islandByFeature),islandCountries:Object.keys(v.islandByCountry),outside:s.regionNames.filter(name=>{const q=COUNTRY_MAP_POINTS[name];if(!q)return true;const p=countryMapProject(q[0],q[1],w,h,meta);return p[0]<0||p[0]>w||p[1]<0||p[1]>h;}),hasOverflow:document.documentElement.scrollWidth>innerWidth};
    });
    assert.equal(report.count,total);assert.deepEqual(report.outside,[],'Every quiz country or small-state point fits the initial region view');assert.equal(report.hasOverflow,false);
    for(const foreign of region==='asia'?['Russia','Canada','Greenland','United States of America']:['Russia','Greenland','Japan','Indonesia','New Zealand']){
     assert(!report.features.includes(foreign),'Foreign mainland excluded: '+foreign);assert(!report.islandFeatures.includes(foreign),'Foreign neutral islands excluded: '+foreign);
    }
    if(region==='asia'){for(const name of ['China','Japan','Indonesia','Philippines','Sri Lanka'])assert(report.features.includes(name),name+' retained');}
    else{assert(report.features.includes('Canada'));assert(report.features.includes('United States of America'));assert(report.islandCountries.includes('Barbados'));assert(report.islandCountries.includes('St. Lucia'));}
    if(region==='northamerica'){
     const hawaii=await page.evaluate(()=>{const s=worldTrainerState,c=document.getElementById('country-map-canvas'),r=c.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height),p=countryMapProject(-155.55,19.6,w,h,countryMapCameraMeta(s,w,h)),ratio=c.width/w;return [...c.getContext('2d').getImageData(Math.round(p[0]*ratio),Math.round(p[1]*ratio),1,1).data].slice(0,3);});
     assert.deepEqual(hawaii,[207,229,237],'Hawaii does not add Pacific islands to geographic North America');
    }
    if(shots)await page.screenshot({path:path.join(shots,region+'-initial-'+viewport.width+'.png')});
    const guess=region==='asia'?'Mongolia':'Barbados';
    await page.locator('#country-guess').fill(guess);await page.locator('#country-guess').press('Enter');await page.waitForFunction(guess=>worldTrainerState.found.some(t=>t.country===guess),guess);await paint();
    const focused=await page.evaluate(()=>{const s=worldTrainerState,c=document.getElementById('country-map-canvas'),r=c.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height),p=countryMapProject(...s.mapFocus,w,h,countryMapCameraMeta(s,w,h));return {offset:[p[0]-w/2,p[1]-h/2],focus:s.mapFocusCountry};});
    assert.equal(focused.focus,guess);assert(focused.offset.every(value=>Math.abs(value)<1),'Correct answer keeps exact auto-centering');
    if(region==='asia'){
     const north=await page.evaluate(()=>{const s=worldTrainerState,c=document.getElementById('country-map-canvas'),r=c.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height),p=countryMapProject(100,70,w,h,countryMapCameraMeta(s,w,h)),ratio=c.width/w;return p[0]>=0&&p[0]<w&&p[1]>=0&&p[1]<h?[...c.getContext('2d').getImageData(Math.round(p[0]*ratio),Math.round(p[1]*ratio),1,1).data].slice(0,3):null;});
     if(north)assert.deepEqual(north,[207,229,237],'Russian coast/Arctic islands do not reappear north of the focused Asia map');
    }
    if(shots)await page.screenshot({path:path.join(shots,region+'-focused-'+viewport.width+'.png')});
    await page.locator('.quiz-page-theme').click();await paint();assert.equal(await page.evaluate(()=>worldTrainerState.found.length),1);assert.equal(await page.evaluate(()=>worldTrainerState.mapProjection),'flat');
    await page.evaluate(()=>resetCountryMapCamera());await paint();assert.equal(await page.evaluate(()=>worldTrainerState.mapFocus),null);assert.equal(await page.evaluate(()=>worldTrainerState.regionNames.length),total);
    if(shots)await page.screenshot({path:path.join(shots,region+'-dark-'+viewport.width+'.png')});
   }
   await context.close();
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({regions:2,countries:[44,23],viewports:3,foreignCoastsRemoved:true,smallStatesPreserved:true,autoCenter:true,dark:true,errors}));
 }finally{await browser?.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
