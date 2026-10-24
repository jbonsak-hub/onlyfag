/* Check actual-data provenance, independent solar geometry, and the teaching controls. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:57972',out=process.env.ASTRO_SCREENSHOTS||path.resolve(__dirname,'../../astronomy-milankovitch-validation');
const data=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../assets/astronomy-prototypes/milankovitch-data.json'),'utf8'));
assert.equal(data.orbital.length,901);assert.equal(data.proxy.length,701);
assert.deepEqual(data.orbital.find(r=>r[0]===0),[0,.016724,282.04,23.446]);
assert.deepEqual(data.proxy.find(r=>r[0]===-20),[-20,4.99,.04]);
assert.deepEqual(data.proxy.find(r=>r[0]===-125),[-125,3.14,.06]);
assert.equal(data.sources.proxySha256,'973a52d988da04333c98c3fc0cb51babac2fa9bb1c05d42de3d6df726d96b6fc');
assert.equal(data.sources.orbitalFiles.length,9);assert(data.sources.orbitalFiles.every(s=>s.sha256.length===64));
for(let i=0;i<data.orbital.length;i++){const [t,e,peri,tilt]=data.orbital[i];assert.equal(t,i-800);assert(e>=0&&e<.07);assert(peri>=0&&peri<360);assert(tilt>22&&tilt<25);}
assert(data.proxy.every((r,i)=>r[0]<=0&&r[1]>2&&r[1]<6&&r[2]>=0&&(!i||r[0]>data.proxy[i-1][0])));

(async()=>{fs.mkdirSync(out,{recursive:true});let browser;const report={cases:[],errors:[],missing:[],external:[]};try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 for(const viewport of [{width:1366,height:900},{width:390,height:844},{width:320,height:568}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await context.newPage();
  await context.route('**/*',route=>{const request=route.request();if(request.url().startsWith(base+'/')&&['GET','HEAD'].includes(request.method()))return route.continue();report.external.push(request.method()+' '+request.url());return route.abort();});
  page.on('pageerror',error=>report.errors.push(error.message));page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('/favicon.ico'))report.missing.push({url:response.url(),status:response.status()});});
  await page.clock.install();await page.goto(base+'/prototyper/milankovitch.html');await page.waitForFunction(()=>window.MilankovitchLab?.snapshot().ready);
  const snapshot=()=>page.evaluate(()=>MilankovitchLab.snapshot());let state=await snapshot();assert.equal(state.playing,false);assert.equal(state.chapter,'experiment');assert(Math.abs(state.metrics.q65-477.9493827463)<1e-7);assert.deepEqual(state.dataSummary,{orbital:901,proxy:701,timeReference:1950});
  const physics=await page.evaluate(()=>{
   const API=MilankovitchLab,rad=a=>a*Math.PI/180,results=[];
   // Independent numerical mean of the solar elevation over one full rotation.
   for(const latitude of [-80,-65,0,65,80])for(const lambda of [0,90,270]){
    const tilt=23.44,e=.05,peri=125,dec=Math.asin(Math.sin(rad(tilt))*Math.sin(rad(lambda))),r=(1-e*e)/(1+e*Math.cos(rad(lambda-peri)));let sum=0;const N=14400;
    for(let i=0;i<N;i++){const h=2*Math.PI*(i+.5)/N;sum+=1361/(r*r)*Math.max(0,Math.sin(rad(latitude))*Math.sin(dec)+Math.cos(rad(latitude))*Math.cos(dec)*Math.cos(h));}
    results.push({latitude,lambda,analytic:API.dailyInsolation(latitude,lambda,tilt,e,peri),numerical:sum/N});
   }
   // Time average from Kepler's equation, rather than the analytic annual formula.
   let sum=0;const N=4096,e=.06;for(let i=0;i<N;i++){const M=2*Math.PI*(i+.5)/N;let E=M;for(let n=0;n<8;n++)E-=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));const r=1-e*Math.cos(E);sum+=1361/(4*r*r);}
   return{results,annual:{analytic:API.globalMean(e),numerical:sum/N},circular:API.dailyInsolation(65,90,23.44,0,90),circleOther:API.dailyInsolation(65,90,23.44,0,270),highTilt:API.dailyInsolation(65,90,24.5,.0167,282.9),lowTilt:API.dailyInsolation(65,90,22.1,.0167,282.9),nearSummer:API.dailyInsolation(65,90,23.44,.05,90),nearWinter:API.dailyInsolation(65,90,23.44,.05,270),now:API.atTime(0),future:API.atTime(100),past:API.atTime(-800),noFutureProxy:API.proxyAt(10),lastGlacial:API.proxyAt(-20)};
  });
  for(const sample of physics.results)assert(Math.abs(sample.analytic-sample.numerical)<.00002,'Daily analytic geometry matches numerical rotation: '+JSON.stringify(sample));
  assert(Math.abs(physics.annual.analytic-physics.annual.numerical)<1e-9);assert(Math.abs(physics.circular-493.6229173112)<1e-6);assert.equal(physics.circular,physics.circleOther);assert(physics.highTilt>physics.lowTilt);assert(physics.nearSummer>physics.nearWinter);assert(Math.abs(physics.now.perihelion-282.04)<1e-9);assert.equal(physics.noFutureProxy,null);assert.equal(physics.lastGlacial,4.99);
  async function layout(label){const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth}));assert(dimensions.scroll<=viewport.width&&dimensions.body<=viewport.width,'No horizontal overflow for '+label+': '+JSON.stringify(dimensions));assert.equal(await page.locator('#mil-diagram').isVisible(),label.startsWith('experiment'));report.cases.push({viewport,chapter:label,dimensions});}
  await layout('experiment-default');await page.screenshot({path:path.join(out,'milankovitch-'+viewport.width+'-experiment.png'),fullPage:true});
  await page.locator('[data-mechanism="tilt"]').click();assert.equal((await snapshot()).mechanism,'tilt');const eccentricity=(await snapshot()).e;await page.locator('#mil-parameter').focus();await page.keyboard.press('ArrowRight');state=await snapshot();assert(state.tilt>23.44);assert.equal(state.e,eccentricity,'Changing tilt preserves eccentricity');await layout('experiment-tilt');
  await page.locator('[data-mechanism="precession"]').click();await page.locator('#mil-parameter').fill('90');await page.locator('#mil-parameter').dispatchEvent('input');state=await snapshot();assert.equal(state.perihelion,90);assert(state.metrics.q65>493);await layout('experiment-precession');
  await page.locator('[data-mechanism="eccentricity"]').click();await page.locator('#mil-parameter').fill('0.06');await page.locator('#mil-parameter').dispatchEvent('input');assert.equal((await snapshot()).e,.06);await page.locator('#true-shape').check();assert.equal((await snapshot()).trueShape,true);await page.locator('#true-shape').uncheck();
  await page.locator('#reset-parameters').click();state=await snapshot();assert.deepEqual(state.parameters,{e:.0167,tilt:23.44,perihelion:282.9});
  await page.locator('[data-chapter="history"]').click();assert.equal((await snapshot()).proxy,4.99);assert.equal(await page.locator('.mil-chart-proxy').count(),1);assert.equal(await page.locator('#mil-diagram').isVisible(),false);await layout('history');
  await page.locator('#time-presets [data-time="-125"]').click();state=await snapshot();assert.equal(state.time,-125);assert.equal(state.proxy,3.14);assert.equal(await page.locator('#mil-visual-energy').textContent(),await page.locator('#mil-q65').innerText());
  await page.locator('#mil-time').focus();await page.keyboard.press('ArrowRight');assert.equal((await snapshot()).time,-124,'History is keyboard operable');
  await page.screenshot({path:path.join(out,'milankovitch-'+viewport.width+'-history.png'),fullPage:true});
  await page.locator('#mil-play').click();const start=(await snapshot()).time;await page.clock.runFor(700);assert((await snapshot()).time>start);await page.locator('#mil-play').click();const paused=(await snapshot()).time;await page.clock.runFor(700);assert.equal((await snapshot()).time,paused);
  await page.locator('#mil-play').click();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal((await snapshot()).playing,false);const hidden=(await snapshot()).time;await page.clock.runFor(500);assert.equal((await snapshot()).time,hidden);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.locator('[data-chapter="future"]').click();assert.equal((await snapshot()).proxy,null);assert.equal(await page.locator('.mil-chart-proxy').count(),0);assert.match(await page.locator('#lesson-title').textContent(),/ikke en klimaprognose/);await layout('future');
  await page.locator('#time-presets [data-time="100"]').click();state=await snapshot();assert.equal(state.time,100);assert(state.parameters.tilt>22&&state.parameters.tilt<25);assert.equal(state.proxy,null);await page.screenshot({path:path.join(out,'milankovitch-'+viewport.width+'-future.png'),fullPage:true});
  await page.locator('.sources summary').click();await layout('future-sources');await context.close();
 }
 // If the optional local data fails, the independent mechanism experiment stays usable.
 const context=await browser.newContext(),page=await context.newPage();await context.route(/\/milankovitch-data(?:-[a-f0-9]{12})?\.json(?:\?|$)/,route=>route.fulfill({status:503,body:'offline'}));await page.goto(base+'/prototyper/milankovitch.html');await page.waitForFunction(()=>document.querySelector('#mil-status').textContent.includes('kunne ikke'));assert.equal(await page.locator('#chapter-history').isDisabled(),true);await page.locator('[data-mechanism="tilt"]').click();assert.equal((await page.evaluate(()=>MilankovitchLab.snapshot())).mechanism,'tilt');await context.close();
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);assert.deepEqual(report.external,[]);report.result='passed';console.log(JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 }finally{await browser?.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
