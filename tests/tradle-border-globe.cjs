/* Border distances and persistent guessed-country overlays share the actual
   Tradle data, UI and orthographic globe. No remote export service is used. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{try{const file=path.join(root,new URL(req.url,'http://localhost').pathname);res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':'application/json');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'}),errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1366,height:768}});await context.addInitScript(()=>Object.defineProperty(navigator,'onLine',{get:()=>false}));
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(base+'/assets/geography/maplab.html?quiz=tradle');await page.waitForFunction(()=>document.querySelector('.module.active')?.id==='tradle'&&state.tradle.target);
  const report=await page.evaluate(()=>{
   const pairs=[['Norge','Sverige'],['Spania','Portugal'],['Frankrike','Belgia'],['Lesotho','Sør-Afrika'],['Tyrkia','Hellas'],['Storbritannia','Frankrike'],['Danmark','Sverige'],['Malta','Italia'],['Andorra','Frankrike'],['Andorra','Spania'],['Monaco','Frankrike'],['San Marino','Italia'],['Vatikanstaten','Italia'],['Liechtenstein','Østerrike'],['Liechtenstein','Sveits'],['Singapore','Malaysia']];
   const started=performance.now(),rows=pairs.map(([a,b])=>{const A=tradleProfileByName(a),B=tradleProfileByName(b);if(!A||!B)return {a,b,missing:true};return {a,b,distance:tradleDistance(A,B),reverse:tradleDistance(B,A)};});
   return {rows,elapsed:performance.now()-started};
  });
  for(const row of report.rows){assert(!row.missing,JSON.stringify(row));assert.equal(row.distance,row.reverse,'Distance is symmetric: '+row.a+' / '+row.b);if(['Storbritannia','Danmark','Malta','Singapore'].includes(row.a))assert(row.distance>0,'Water crossing is not a shared land border: '+JSON.stringify(row));else assert.equal(row.distance,0,'Neighbors share a zero-distance boundary: '+JSON.stringify(row));}
  assert(report.rows.find(row=>row.a==='Storbritannia').distance<80,'The Channel distance is shore-to-shore, rather than capital-to-capital');assert(report.elapsed<1000,'A normal group of guesses stays responsive: '+report.elapsed);
  await page.evaluate(()=>{state.tradle.target=TRADLE_DATA.find(profile=>profile.country==='Norge');resetTradleUi();drawTradle();});
  await page.locator('#tradleGlobeHelp').click();await page.locator('#tradleHelpGlobe .tradle-help-land').waitFor();assert.equal(await page.locator('.tradle-help-guess').count(),0);
  async function openGlobe(){if(await page.locator('#tradleGlobePopup').isHidden())await page.locator('#tradleGlobeHelp').click();await page.waitForFunction(()=>!document.querySelector('#tradleGlobePopup').hidden&&document.querySelectorAll('.tradle-help-guess').length===state.tradle.guesses.length);}
  async function guess(name){await page.locator('#tradleGuess').fill(name);await page.locator('#tradleSubmit').click();await openGlobe();}
  await guess('Sverige');assert.match(await page.locator('#tradleHistory .tradle-row').first().innerText(),/0 km/);assert.equal(await page.locator('.tradle-help-guess[data-country="Sverige"]').count(),1);
  await guess('Spania');assert.equal(await page.locator('.tradle-help-guess').count(),2);assert.equal(await page.locator('.tradle-help-guess[data-country="Norge"]').count(),0,'The unguessed target is not revealed');
  const before=await page.locator('.tradle-help-guess').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('d'))),globe=await page.locator('#tradleHelpGlobe').boundingBox();await page.mouse.move(globe.x+globe.width*.5,globe.y+globe.height*.5);await page.mouse.down();await page.mouse.move(globe.x+globe.width*.5+60,globe.y+globe.height*.5-25,{steps:8});await page.mouse.up();await page.waitForTimeout(60);
  const after=await page.locator('.tradle-help-guess').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('d')));assert.notDeepEqual(after,before,'Guessed polygons follow globe rotation');assert.equal(await page.locator('.tradle-help-guess').count(),2);
  await page.mouse.wheel(0,-300);await page.waitForTimeout(50);assert.equal(await page.locator('.tradle-help-guess').count(),2,'Zoom retains guesses');
  await page.locator('#tradleGlobeHelp').click();await openGlobe();assert.equal(await page.locator('.tradle-help-guess').count(),2,'Reopening retains guesses');
  await page.evaluate(()=>{document.body.classList.add('dark');drawTradleHelpGlobe();});assert.notEqual(await page.locator('.tradle-help-guess').first().evaluate(node=>getComputedStyle(node).fill),await page.locator('.tradle-help-land').evaluate(node=>getComputedStyle(node).fill),'Dark mode keeps guessed countries distinct');
  await guess('Norge');assert.equal(await page.locator('.tradle-help-guess.correct[data-country="Norge"]').count(),1);assert.equal(await page.locator('.tradle-help-guess').count(),3);
  await page.locator('#tradleNew').click();await openGlobe();assert.equal(await page.locator('.tradle-help-guess').count(),0,'A new round clears old globe guesses');
  await page.evaluate(()=>{state.tradle.target=TRADLE_DATA.find(profile=>profile.country==='Norge');resetTradleUi();});await guess('Andorra');assert.equal(await page.locator('.tradle-help-guess[data-country="Andorra"]').count(),1,'Microstates without coarse country polygons receive a point marker');
  await page.setViewportSize({width:390,height:844});await page.locator('.mobile-streak-shell .quiz-mobile-answers button').first().waitFor();assert.equal(await page.locator('.mobile-streak-shell .quiz-mobile-answers button').count(),4,'The existing mobile four-choice mode is preserved');assert.equal(await page.locator('.tradle-layout').isVisible(),false);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile mode does not overflow');
  if(process.env.LAYOUT_SCREENSHOTS){fs.mkdirSync(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LAYOUT_SCREENSHOTS,'tradle-globe-mobile.png')});}
  assert.deepEqual(errors,[]);console.log(JSON.stringify({borderCases:report.rows.length,distanceMs:Math.round(report.elapsed),sharedBordersZero:true,waterGapsPositive:true,guessesPersistOnGlobe:true,drag:true,zoom:true,dark:true,mobileFourChoicePreserved:true,errors}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
