const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:57972',out=process.env.SCREENSHOT_DIR||path.resolve(__dirname,'../../system-prototype-review');
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const report={viewports:[],errors:[],requests:[]};try{
 for(const viewport of [{width:1366,height:900},{width:390,height:844},{width:320,height:740}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce',deviceScaleFactor:viewport.width<600?2:1}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await context.route('**/*',route=>{const r=route.request();if(r.url().startsWith(base)&&['GET','HEAD'].includes(r.method()))return route.continue();report.requests.push({url:r.url(),method:r.method()});return route.abort();});
  await page.goto(base+'/prototyper/jord-mane-sol.html');await page.waitForFunction(()=>document.body.dataset.ready==='true');
  const snapshot=()=>page.evaluate(()=>EarthMoonLab.snapshot()),set=options=>page.evaluate(options=>EarthMoonLab.set(options),options);let s=await snapshot();assert(!s.playing);assert(Math.abs(s.synodicPeriod-29.530589)<1e-8);assert(Math.abs(s.siderealPeriod-27.3217)<.001);
  await set({scene:'phases',days:0});s=await snapshot();assert(s.fraction<.01&&s.phaseName==='Nymåne');
  await page.locator('[data-phase="0.25"]').click();s=await snapshot();assert(Math.abs(s.fraction-.5)<.001);assert.equal(s.phaseName,'Første kvarter');
  const waxing=await page.locator('#observer-sky').evaluate(c=>{const x=c.getContext('2d'),p=x.getImageData(0,0,c.width,c.height).data;let left=0,right=0;for(let y=80;y<200;y++)for(let a=90;a<230;a++){const e=p[(y*c.width+a)*4];if(a<160)left+=e;else right+=e;}return {left,right};});assert(waxing.right>waxing.left*2,'Waxing Moon is bright on the right in the declared northern view');
  await page.screenshot({path:path.join(out,'system-phases-'+viewport.width+'.png')});
  await page.locator('[data-phase="0.5"]').click();s=await snapshot();assert(s.fraction>.99&&s.phaseName==='Fullmåne');assert.equal(s.lunar,'none','Most full Moons miss Earth shadow');
  await page.locator('[data-phase="0.75"]').click();s=await snapshot();assert(Math.abs(s.fraction-.5)<.001&&s.phaseName==='Siste kvarter');
  await page.locator('#system-time').fill('11');assert(Math.abs((await snapshot()).days-11)<.01,'Timeline input uses its new value');
  await page.locator('[data-scene="solar"]').click();s=await snapshot();assert.equal(s.solar,'total');assert(s.fraction<.001&&Math.abs(s.beta)<1e-8);await page.screenshot({path:path.join(out,'system-solar-'+viewport.width+'.png')});
  await page.locator('#far-moon').click();assert.equal((await snapshot()).solar,'annular','A smaller apparent Moon produces an annular eclipse');
  await page.locator('#miss-node').click();s=await snapshot();assert.equal(s.solar,'none');assert(Math.abs(s.beta)*180/Math.PI>5,'Inclination removes the solar eclipse without changing conjunction');
  await page.locator('#align-node').click();await page.locator('#near-moon').click();await page.locator('#system-time').fill('0.3');assert.equal((await snapshot()).solar,'partial');
  await page.locator('[data-scene="lunar"]').click();s=await snapshot();assert.equal(s.lunar,'total');assert(s.fraction>.999);await page.locator('#system-time').fill('0.8');assert.equal((await snapshot()).lunar,'partial');await page.locator('#system-time').fill('1.3');assert.equal((await snapshot()).lunar,'penumbral');await page.locator('#system-time').fill('2');assert.equal((await snapshot()).lunar,'none');
  await page.locator('#system-time').fill('0');await page.locator('#miss-node').click();assert.equal((await snapshot()).lunar,'none','An inclined full Moon can miss the umbra and penumbra');
  await page.locator('[data-scene="phases"]').click();await page.locator('#year-view').click();assert((await snapshot()).yearView);await page.locator('#system-time').fill('100');assert.equal((await snapshot()).days,100);await page.screenshot({path:path.join(out,'system-year-'+viewport.width+'.png')});
  await page.clock.install();await page.locator('#system-play').click();await page.clock.runFor(1000);assert((await snapshot()).days>110,'Year playback moves the Earth-Moon system');await page.locator('#system-play').click();const paused=(await snapshot()).days;await page.clock.runFor(1000);assert.equal((await snapshot()).days,paused);
  await page.locator('#system-play').click();await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.runFor(40);await page.emulateMedia({reducedMotion:'reduce'});await page.clock.runFor(40);await page.waitForFunction(()=>!EarthMoonLab.snapshot().playing);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
  const clipped=await page.locator('#system-play,#system-time,[data-scene],#year-view').evaluateAll(es=>es.filter(e=>!e.hidden).filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+1;}).map(e=>e.id||e.dataset.scene));assert.deepEqual(clipped,[]);
  report.viewports.push({viewport,phases:true,phaseOrientation:true,totalSolar:true,annularSolar:true,partialSolar:true,lunarShadowTypes:true,nodeMiss:true,yearMotion:true,timeline:true,pause:true,reducedMotion:true});await context.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.requests,[]);report.success=true;console.log(JSON.stringify(report));
}finally{await browser.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
