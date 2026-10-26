/* Map options and navigation in a real browser; all score requests stay local. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,'assets/geography',name),'utf8'));
const stateShapes=read('us-states.json'),largest=read('us-largest-cities.json'),capitals=read('us-capitals.json');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((request,response)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep))return response.writeHead(403).end();
  try{response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');response.end(fs.readFileSync(file));}
  catch{response.writeHead(404).end();}
});
async function footerAtBottom(page){
  const footer=page.locator('.game-panel footer');
  const relation=await footer.evaluate(el=>{
    const top=document.querySelector('#statle-top-ten'),back=el.querySelector('.quiz-page-back');
    return {owns:el.contains(top),next:top?.nextElementSibling===back,last:el===el.parentElement.lastElementChild};
  });
  assert(relation.owns&&relation.next&&relation.last,'Top 10 is in the final footer, immediately above choose-map');
  await footer.scrollIntoViewIfNeeded();
  const bounds=await footer.evaluate(el=>{
    const panel=el.parentElement.getBoundingClientRect(),box=el.getBoundingClientRect(),top=document.querySelector('#statle-top-ten').getBoundingClientRect(),back=el.querySelector('.quiz-page-back').getBoundingClientRect();
    return {gap:panel.bottom-box.bottom,above:top.bottom<=back.top+1,inside:box.left>=panel.left-1&&box.right<=panel.right+1,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert(bounds.above&&bounds.inside,'Footer actions form a vertical stack inside the panel');
  assert.equal(bounds.overflow,false,'The menu never causes horizontal overflow');
  if(await page.evaluate(()=>innerWidth>700&&document.body.dataset.physical!=='true'))assert(bounds.gap<50,'Footer stays close to the desktop panel bottom');
}
async function symbolState(page){
  await page.locator('#target-symbol').waitFor({state:'visible'});
  await page.waitForFunction(()=>{const image=document.querySelector('#target-symbol');return image.complete&&image.naturalWidth>0;});
  return page.evaluate(names=>{
    const src=document.querySelector('#target-symbol').getAttribute('src');
    return names.find(name=>MapSymbols.lookup(name,{kind:'state'})?.src===src);
  },stateShapes.map(state=>state.n));
}
async function capture(page,name){
  if(!process.env.MAP_OPTIONS_SCREENSHOTS)return;
  fs.mkdirSync(process.env.MAP_OPTIONS_SCREENSHOTS,{recursive:true});
  await page.screenshot({path:path.join(process.env.MAP_OPTIONS_SCREENSHOTS,name+'.png')});
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  const errors=[],missing=[],requests=[];
  try{
    for(const viewport of [{width:1366,height:646},{width:390,height:844}]){
      const context=await browser.newContext({viewport});
      await context.addInitScript(dark=>localStorage.setItem('geoDarkMode',dark?'1':'0'),viewport.width<700);
      await context.route('**/*',route=>{
        const request=route.request(),url=request.url();
        if(/analytics|cloudflareinsights/.test(url))return route.abort();
        if(url.startsWith('https://onlyfag-geography-scores.jack-bonsak.workers.dev/')){
          if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
          if(new URL(url).pathname==='/session')requests.push(JSON.parse(request.postData()));
          return route.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"error":"unavailable"}'});
        }
        return url.startsWith(base)||/^(data|blob):/.test(url)?route.continue():route.abort();
      });
      const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
      page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)missing.push(response.url());});
      await page.goto(base+'/geografi/statle.html');await page.locator('#start:enabled').waitFor();
      const city=page.locator('#statle-advanced'),capital=page.locator('#statle-capitals'),names=page.locator('#statle-show-names');
      assert.equal(await city.isChecked(),false);assert.equal(await capital.isChecked(),false);
      await city.check();assert.equal(await capital.isChecked(),false);
      await capital.check();assert.equal(await city.isChecked(),false,'Choosing capitals clears largest-city');
      assert.equal(await page.locator('body').getAttribute('data-statle-variant'),'capitals');
      await capital.uncheck();assert.equal(await city.isChecked(),false,'Both advanced options may be clear');
      assert.equal(await page.locator('body').getAttribute('data-statle-variant'),null);
      // Switching preview type must refresh both city labels and their points.
      for(const [input,data] of [[city,largest],[capital,capitals]]){
        await input.check();await names.check();
        const label=page.locator('.study-city[data-label-state="California"]');
        assert.equal((await label.textContent()).replace(/\s/g,''),data.California.name.replace(/\s/g,''));
        const position=await page.evaluate(()=>{const state=document.querySelector('path.state[data-state="California"]'),dot=document.querySelector('#statle-city-points [data-state="California"] .city-dot'),m=state.parentElement.transform.baseVal.consolidate().matrix;return {x:dot.cx.baseVal.value,y:dot.cy.baseVal.value,a:m.a,d:m.d,e:m.e,f:m.f};});
        assert(Math.abs(position.x-data.California.p[0]*position.a-position.e)<.001&&Math.abs(position.y-data.California.p[1]*position.d-position.f)<.001,'City markers follow the selected dataset');
        await names.uncheck();
      }
      await capital.uncheck();
      const spacing=await names.evaluate(el=>el.closest('label').getBoundingClientRect().top-document.querySelector('#statle-capitals').closest('label').getBoundingClientRect().bottom);
      assert(spacing>=12,'Show names is visually separated from the two question types');
      await footerAtBottom(page);await capture(page,'statle-ready-'+viewport.width);
      for(const [input,variant,data] of [[city,'largest-city',largest],[capital,'capitals',capitals]]){
        await input.check();
        assert.equal(await (variant==='capitals'?city:capital).isChecked(),false,'Only one advanced type is selected');
        await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.phase==='playing');
        assert.equal(requests.at(-1).variant,variant,'The server receives the chosen Statle variant');
        const state=await symbolState(page);assert(state,'An advanced question retains its state flag');
        assert((await page.locator('#targetName').textContent()).startsWith(data[state].name),'The name comes from the chosen city dataset');
        assert(await city.isDisabled()&&await capital.isDisabled(),'Question types cannot change during a round');
        await capture(page,'statle-'+variant+'-'+viewport.width);
        await page.locator('#restart').click();await page.waitForFunction(()=>document.body.dataset.phase==='ready');
        assert.equal(await city.isDisabled(),false);assert.equal(await capital.isDisabled(),false);
      }
      for(const quiz of [
        ['countries','/geografi/kart.html?region=europe'],['counties','/geografi/fylker.html'],
        ['municipalities','/geografi/kommuner.html?fylke=39'],['oslo','/geografi/oslo-bydeler.html'],
        ['rivers','/geografi/kart.html?region=rivers'],['mountains','/geografi/kart.html?region=mountains'],
        ['lakes','/geografi/kart.html?region=lakes'],['seas','/geografi/kart.html?region=seas']
      ]){
        await page.goto(base+quiz[1]);await page.locator('#start:enabled').waitFor();await footerAtBottom(page);
        if(quiz[0]==='countries'){
          assert.equal(await page.locator('#map-question-mode,#map-question-mode-option').count(),0,'Country maps have no task-mode selector');
          await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.phase==='playing');
          await page.locator('#target-symbol').waitFor({state:'visible'});
          assert.notEqual(await page.locator('#targetName').textContent(),'Hvilket land?');
          assert.equal(requests.at(-1).mode,undefined,'Country rounds always use the normal name-and-flag board');
        }
      }
      for(const [name,url] of [['states','/geografi/statle.html'],['countries','/geografi/kart.html?region=europe'],['municipalities','/geografi/kommuner.html?fylke=39'],['oslo','/geografi/oslo-bydeler.html']]){
        await page.goto(base+url);await page.locator('#start:enabled').waitFor();
        await page.locator('#statle-basemap').click();await page.locator('.map-basemap-layer:not([hidden])').waitFor();await page.mouse.move(2,2);
        const styles=await page.locator('#states .state').evaluateAll(els=>els.map(el=>({width:parseFloat(getComputedStyle(el).strokeWidth),stroke:getComputedStyle(el).stroke,dash:getComputedStyle(el).strokeDasharray,forest:el.classList.contains('oslo-forest')})));
        assert(styles.length>0&&styles.every(style=>style.width>0&&style.width<=1.25&&style.stroke!=='none'),'Original thin target strokes are restored: '+name);
        assert.equal(await page.locator('#terrain-boundary-halos').count(),0,'The thick all-target halo is removed');
        assert.equal(await page.locator('#terrain-playable-mask path').count(),styles.length,'Separate mask paths preserve the union of playable areas');
        assert(await page.locator('#terrain-selection-scope').isVisible(),'Only outside the selection is quietened');
        assert.equal(await page.locator('#terrain-selection-scope [data-state],#terrain-selection-scope [tabindex]').count(),0,'The outside treatment never becomes a quiz target');
        assert(styles.filter(style=>style.forest).every(style=>style.dash!=='none'),'Forests retain their original thin dashed outline');
        if(name==='municipalities'||name==='oslo'){
          assert(await page.locator('.municipality-border-line').first().evaluate(el=>parseFloat(getComputedStyle(el).strokeWidth)===1.65));
          assert(await page.locator('.municipality-border-halo').first().evaluate(el=>parseFloat(getComputedStyle(el).strokeWidth)===3.6));
        }
        await capture(page,'terrain-'+name+'-'+viewport.width);
      }
      await context.close();
    }
    assert.deepEqual(errors,[],'No page errors');assert.deepEqual(missing,[],'Every local dependency loads');
    console.log('PASS map options/footer: named country flags, exclusive Statle city/capital options with state flags, separated names option, footer Top 10 and original thin terrain boundaries and quiet outside areas on desktop/mobile');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
