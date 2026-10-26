/* Attempts, named flag prompts, local symbols and panel navigation. No public scores are sent. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer((request,response)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep))return response.writeHead(403).end();
  try{response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');response.end(fs.readFileSync(file));}
  catch{response.writeHead(404).end();}
});
const shape=(page,name)=>page.locator('path.state[data-state='+JSON.stringify(name)+']');
async function targetName(page,flags){
  if(!flags)return page.locator('#targetName').textContent();
  return page.evaluate(()=>{
    const src=document.querySelector('#target-symbol').getAttribute('src');
    const target=[...document.querySelectorAll('path.state')].find(el=>MapSymbols.lookup(el.dataset.state,{kind:'country'})?.src===src);
    if(!target)throw Error('Displayed flag has no matching country target');
    return target.dataset.state;
  });
}
async function answer(page,name){await shape(page,name).focus();await page.keyboard.press('Enter');}
async function checkSymbol(page,name,type,flags){
  const symbol=page.locator('#target-symbol');await symbol.waitFor({state:'visible'});
  await page.waitForFunction(()=>{const img=document.querySelector('#target-symbol');return img.complete&&img.naturalWidth>0;});
  assert.equal(await symbol.getAttribute('data-type'),type);
  const alt=await symbol.getAttribute('alt');assert(alt?.trim(),'Prompt image has alternative text');
  if(flags){
    assert(!alt.includes(name),'Flag-only alternative text does not reveal the answer');
    assert(!await page.locator('.target-block').innerText().then(text=>text.includes(name)),'The flag question hides the country name');
    assert.equal(await page.locator('#targetName').textContent(),'Hvilket land?');
  }else assert.equal(await page.locator('#targetName').textContent(),name,'Normal questions retain the name beside their symbol');
}
async function checkFooter(page){
  const footer=page.locator('.game-panel footer');
  assert(await footer.locator('.game-controls,#restart').count()>0,'Round controls live in the panel footer');
  const order=await footer.evaluate(el=>({afterTopTen:el.contains(document.querySelector('#statle-top-ten'))&&document.querySelector('#statle-top-ten').nextElementSibling?.classList.contains('quiz-page-back'),last:el===el.parentElement.lastElementChild}));
  assert(order.afterTopTen&&order.last,'Navigation and source credits are at the bottom of the panel');
  await footer.scrollIntoViewIfNeeded();
  const bounds=await footer.evaluate(el=>{const b=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return {inside:b.left>=p.left-1&&b.right<=p.right+1,visible:b.bottom<=p.bottom+1&&b.top>=p.top-1,overflow:document.documentElement.scrollWidth>innerWidth};});
  assert(bounds.inside&&bounds.visible,'Footer fits the scrollable panel on desktop and mobile');assert.equal(bounds.overflow,false);
}
async function capture(page,name){if(!process.env.MAP_SYMBOL_SCREENSHOTS)return;fs.mkdirSync(process.env.MAP_SYMBOL_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.MAP_SYMBOL_SCREENSHOTS,name+'.png')});}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  const errors=[],missing=[],sessions=[];
  try{
    for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
      const context=await browser.newContext({viewport});
      await context.addInitScript(dark=>localStorage.setItem('geoDarkMode',dark?'1':'0'),viewport.width<700);
      await context.route('**/*',route=>{
        const request=route.request(),url=request.url();
        if(/analytics|cloudflareinsights/.test(url))return route.abort();
        if(url.startsWith('https://onlyfag-geography-scores.jack-bonsak.workers.dev/')){
          if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
          if(new URL(url).pathname==='/session')sessions.push(JSON.parse(request.postData()));
          // Test real request configuration plus the existing offline fallback.
          return route.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"error":"unavailable"}'});
        }
        return url.startsWith(base)||/^(data|blob):/.test(url)?route.continue():route.abort();
      });
      const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)missing.push(response.url());});
      await page.clock.install();
      for(const quiz of [
        {name:'countries',url:'/geografi/kart.html?region=europe',type:'flag'},

        {name:'states',url:'/geografi/statle.html',type:'flag'},
        {name:'counties',url:'/geografi/fylker.html',type:'arms'},
        {name:'municipalities',url:'/geografi/kommuner.html?fylke=39',type:'arms'}
      ]){
        await page.goto(base+quiz.url);await page.locator('#start:enabled').waitFor();
        assert.equal(await page.locator('#map-question-mode,#map-question-mode-option').count(),0,'Country maps always show name and flag');
        await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.phase==='playing');
        const request=sessions.at(-1);assert.equal(request.scoring,'attempts-v1');assert.equal(request.mode,quiz.flags?'flags':undefined,'Only flag rounds use the separate mode');
        assert.equal(await page.locator('#map-question-mode-option').isVisible(),false,'The mode cannot change during a round');
        for(const misses of [0,1,2,3]){
          const name=await targetName(page,quiz.flags);assert(name,'A target is shown');await checkSymbol(page,name,quiz.type,quiz.flags);
          if(misses===0){await page.clock.fastForward(11000);assert.equal(await page.locator('#hintLayer .hint-ring').count(),0,'Waiting eleven seconds never reveals a hint');}
          const wrong=await page.locator('path.state').evaluateAll((els,name)=>els.find(el=>el.dataset.state!==name&&!el.hasAttribute('data-band')).dataset.state,name);
          for(let i=0;i<misses;i++){
            await answer(page,wrong);
            assert.equal(await page.locator('#hintLayer .hint-ring').count(),i>=2?1:0,'The answer circle appears only after the third wrong attempt');
          }
          if(misses===0){await checkFooter(page);await capture(page,quiz.name+'-'+viewport.width);}
          await answer(page,name);
          assert.equal(await shape(page,name).getAttribute('data-band'),String(misses),'Colour band depends on attempts rather than elapsed time');
          assert.equal(await page.locator('#completed').textContent(),String(misses+1));
          assert.equal(await page.locator('#hintLayer .hint-ring').count(),0,'A correct answer clears its hint');
          await page.clock.fastForward(700);
        }
      }
      await context.close();
    }
    assert.deepEqual(errors,[],'No page errors');assert.deepEqual(missing,[],'Every local script, map and symbol loads');
    console.log('PASS attempts/symbols: no time penalty, hint after three misses, four bands, country/state flags, county/municipality arms and footer on desktop/mobile; API requests intercepted locally');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
