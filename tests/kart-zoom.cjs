/* Real browser interaction checks for continent selection and the shared SVG camera. */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:58390';
const screenshotDir=process.env.SCREENSHOT_DIR;
const regions={europe:47,asia:47,northAmerica:23,southAmerica:13,africa:55,oceania:15};
const readView=page=>page.locator('#map').evaluate(svg=>{const v=svg.viewBox.baseVal;return [v.x,v.y,v.width,v.height];});
const homeWidths=new WeakMap();
const percent=async page=>Math.round(homeWidths.get(page)/(await readView(page))[2]*100);
async function zoomKey(page,key){await page.locator('[data-state]').first().focus();await page.keyboard.press(key);}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function capture(page,name){if(screenshotDir){await fs.mkdir(screenshotDir,{recursive:true});await page.screenshot({path:path.join(screenshotDir,name+'.png'),fullPage:true});}}
async function pointFor(page,name){
  const point=await page.evaluate(name=>{
    const svg=document.getElementById('map'),viewport=document.getElementById('mapViewport').getBoundingClientRect();
    const screen=element=>p=>{const q=p.matrixTransform(element.getScreenCTM());return q.x>viewport.left+2&&q.x<viewport.right-2&&q.y>viewport.top+2&&q.y<viewport.bottom-2?{x:q.x,y:q.y}:null;};
    const marker=[...document.querySelectorAll('#smallStates g[data-state]')].find(el=>el.dataset.state===name);
    if(marker){const c=marker.querySelector('circle'),cx=Number(c.getAttribute('cx')),cy=Number(c.getAttribute('cy')),r=Number(c.getAttribute('r'));for(const dy of [0,-.5,.5,-.8,.8])for(const dx of [0,-.5,.5,-.8,.8]){if(Math.hypot(dx,dy)>1)continue;const p=screen(marker)(new DOMPoint(cx+r*dx,cy+r*dy));if(p&&document.elementFromPoint(p.x,p.y)?.closest('[data-state]')?.dataset.state===name)return p;}}
    const el=[...document.querySelectorAll('path.state')].find(el=>el.dataset.state===name);if(!el)return null;
    const b=el.getBBox(),project=screen(el);
    const grid=[.5,.4,.6,.3,.7,.2,.8,.1,.9,.05,.95,.025,.975];
    for(const y of grid)for(const x of grid){const p=new DOMPoint(b.x+b.width*x,b.y+b.height*y);if(el.isPointInFill(p)){const q=project(p);if(q&&document.elementFromPoint(q.x,q.y)?.closest('[data-state]')?.dataset.state===name)return q;}}
    return null;
  },name);
  assert.ok(point,name+' has a visible physical click target');return point;
}
async function cameraChecks(page){
  const original=await readView(page);
  homeWidths.set(page,original[2]);
  assert.equal(await percent(page),100);
  assert.equal(await page.locator('.map-tools,#map-zoom-value').count(),0,'No floating zoom box');
  await zoomKey(page,'+');
  assert.equal(await percent(page),150);
  assert.ok((await readView(page))[2]<original[2]);
  await zoomKey(page,'-');
  assert.equal(await percent(page),100);
  const box=await page.locator('#map').boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.wheel(0,-100);
  await page.waitForFunction(()=>document.getElementById('map').classList.contains('map-is-zoomed'));
  assert.ok((await readView(page))[2]<original[2]);
  await zoomKey(page,'0');
  assert.deepEqual(await readView(page),original);
  await page.locator('path.state').first().focus();
  await page.keyboard.press('+');assert.equal(await percent(page),150);
  await page.keyboard.press('-');assert.equal(await percent(page),100);
  await page.keyboard.press('+');await page.keyboard.press('0');
  assert.equal(await percent(page),100);assert.deepEqual(await readView(page),original);
}
async function load(page,url){await page.goto(base+url);await page.locator('#start:enabled').waitFor();homeWidths.set(page,(await readView(page))[2]);}
async function startLocal(page){await page.locator('#start').click();await page.waitForFunction(()=>document.getElementById('targetVerb').textContent==='Klikk på');}
async function previewName(page){
  const name=await page.locator('path.state').first().getAttribute('data-state'),point=await pointFor(page,name);
  await page.mouse.click(point.x,point.y);
  assert.equal(await page.locator('#labelLayer text').last().textContent(),name,'pre-start click reveals the name on the map');
  assert.equal(await page.locator('#feedback').textContent(),name);
  assert.equal(await page.locator('#completed').textContent(),'0');
  assert.equal(await page.locator('#elapsed').textContent(),'00:00','exploring names does not start the clock');
  assert.equal(await page.locator('#mistakes').textContent(),'0 feil');
  await page.locator('path.state').last().focus();await page.keyboard.press('Enter');
  const last=await page.locator('path.state').last().getAttribute('data-state');
  assert.equal(await page.locator('#labelLayer text').last().textContent(),last,'keyboard exploration also reveals the name');
}
async function answerAfterZoom(page){
  await startLocal(page);
  const target=await page.locator('#targetName').textContent(),point=await pointFor(page,target);
  await page.mouse.move(point.x,point.y);await page.mouse.wheel(0,-80);
  await page.waitForFunction(()=>document.getElementById('map').classList.contains('map-is-zoomed'));
  const actual=await pointFor(page,target);await page.mouse.click(actual.x,actual.y);
  assert.equal(await page.locator('#completed').textContent(),'1');
  assert.equal(await page.locator('#mistakes').textContent(),'0 feil');
  assert.equal(await page.locator('path.state').evaluateAll((els,name)=>els.find(el=>el.dataset.state===name)?.classList.contains('found'),target),true);
}
(async()=>{
  const geometry=JSON.parse(await fs.readFile(path.join(__dirname,'../assets/geography/continent-maps.json'),'utf8'));
  const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
  const errors=[];
  const prepare=async page=>{
    page.on('pageerror',error=>errors.push(String(error)));
    await page.route(/\/score-service(?:-[a-f0-9]+)?\.js(?:\?|$)/,route=>route.fulfill({contentType:'application/javascript',body:''}));
    await page.route('**/assets/analytics.js',route=>route.fulfill({contentType:'application/javascript',body:''}));
  };
  const page=await browser.newPage({viewport:{width:1365,height:900}});await prepare(page);
  await page.goto(base+'/geografi/kart.html');
  assert.equal(await page.locator('#kart-selection').isVisible(),true);
  assert.equal(await page.locator('#kart-game').isVisible(),false);
  assert.equal(await page.locator('[data-map-region]').count(),11);
  assert.equal(await page.locator('.kart-statle-link').getAttribute('href'),'statle.html','USA keeps its original Statle page');
  await page.locator('#kart-menu-button').click();assert.equal(await page.locator('#geoMenu').isVisible(),true);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#kart-menu-button').getAttribute('aria-expanded'),'false');
  await capture(page,'kart-selection-desktop');
  for(const [region,count] of Object.entries(regions)){
    await page.locator(`[data-map-region="${region}"]`).click();await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('path.state').count(),count,region+' includes every assigned country');
    assert.equal(await page.locator('#kart-selection').isVisible(),false);
    assert.equal(new URL(page.url()).searchParams.get('region'),region);
    assert.equal(await page.locator('#total-count').textContent(),' / '+count);
    const bad=await page.locator('path.state').evaluateAll(els=>els.filter(el=>{const b=el.getBBox();return ![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<=0||b.height<=0;}).map(el=>el.dataset.state));
    assert.deepEqual(bad,[],region+' shapes have finite positive bounds');
    const markerNames=await page.locator('.country-marker').evaluateAll(els=>els.map(el=>el.dataset.state));
    assert.deepEqual(markerNames.sort(),geometry.regions[region].states.filter(s=>s.marker).map(s=>s.n).sort(),'tiny countries have their extra click targets');
    for(const name of markerNames)await pointFor(page,name);
    const layout=await page.locator('#mapViewport').evaluate(el=>({height:el.getBoundingClientRect().height,screen:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth}));
    assert.equal(layout.height,layout.screen);assert.equal(layout.overflow,false);
    if(region==='europe'){
      const handle=page.locator('.quiz-panel-resizer');
      assert.ok(await handle.evaluate(el=>Math.abs(el.getBoundingClientRect().x+4-document.querySelector('.game-panel').getBoundingClientRect().right)<2),'resize handle follows the revealed left panel');
      await handle.focus();const width=Number(await handle.getAttribute('aria-valuenow'));await page.keyboard.press('ArrowRight');assert.equal(Number(await handle.getAttribute('aria-valuenow')),width+16);await handle.dblclick();
    }
    await previewName(page);await cameraChecks(page);await capture(page,'kart-'+region);
    await answerAfterZoom(page);
    await page.locator('#kart-back').click();
    assert.equal(await page.locator('#kart-selection').isVisible(),true);assert.equal(new URL(page.url()).searchParams.has('region'),false);
    assert.equal(await page.locator('#completed').textContent(),'0','changing map clears score and pending transitions');
  }
  await load(page,'/geografi/kart.html?region=africa');await startLocal(page);
  await zoomKey(page,'+');
  const target=await page.locator('#targetName').textContent();
  const large=await page.locator('path.state').evaluateAll(els=>els.map(el=>({n:el.dataset.state,area:el.getBBox().width*el.getBBox().height})).sort((a,b)=>b.area-a.area).slice(0,6).map(x=>x.n));
  let dragStart;for(const name of large){try{dragStart=await pointFor(page,name);break;}catch{}}
  assert.ok(dragStart,'a large land area is available for a real map drag');
  const beforeDrag=await readView(page);
  await page.mouse.move(dragStart.x,dragStart.y);await page.mouse.down();await page.mouse.move(dragStart.x+25,dragStart.y+16,{steps:5});await page.mouse.up();
  assert.notDeepEqual(await readView(page),beforeDrag,'dragging changes the camera');
  assert.equal(await page.locator('#completed').textContent(),'0');assert.equal(await page.locator('#mistakes').textContent(),'0 feil','drag release does not submit a country');
  await page.locator('path.state').first().dispatchEvent('click');
  assert.equal(await page.locator('#mistakes').textContent(),'0 feil','click suppression also protects the immediate follow-up click');
  await wait(400);
  const wrong=await page.locator('path.state').evaluateAll((els,target)=>els.filter(el=>el.dataset.state!==target).slice(0,2).map(el=>el.dataset.state),target);
  for(const name of wrong)await page.locator('path.state').evaluateAll((els,name)=>els.find(el=>el.dataset.state===name).dispatchEvent(new MouseEvent('click',{bubbles:true})),name);
  assert.equal(await page.locator('#mistakes').textContent(),'2 feil');
  const hint=await page.locator('.hint-ring').evaluate(el=>{const x=Number(el.getAttribute('cx')),y=Number(el.getAttribute('cy')),p=new DOMPoint(x,y).matrixTransform(el.getScreenCTM());return {x,y,screen:[p.x,p.y]};});
  const targetGeometry=geometry.regions.africa.states.find(s=>s.n===target);
  assert.deepEqual([hint.x,hint.y],targetGeometry.c,'hint remains anchored at the geographical target after a drag');
  const expectedHint=await page.locator('#states').evaluate((el,c)=>{const p=new DOMPoint(...c).matrixTransform(el.getScreenCTM());return [p.x,p.y];},targetGeometry.c);
  assert.ok(hint.screen.every((v,i)=>Math.abs(v-expectedHint[i])<.1),'hint pulse stays centered on the target while the camera is zoomed');
  await zoomKey(page,'0');
  const correct=await pointFor(page,target);await page.mouse.click(correct.x,correct.y);assert.equal(await page.locator('#completed').textContent(),'1','normal answers resume after a drag');
  for(const [url,count] of [['/geografi/statle.html',50],['/geografi/fylker.html',15],['/geografi/kart.html?region=fylker',15]]){
    await load(page,url);assert.equal(await page.locator('path.state').count(),count);await previewName(page);await cameraChecks(page);await answerAfterZoom(page);
  }
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const phone=await mobile.newPage();await prepare(phone);
  await phone.goto(base+'/geografi/kart.html');await capture(phone,'kart-selection-mobile');
  assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile chooser fits its screen');
  await load(phone,'/geografi/kart.html?region=africa');
  const previewCountry=await phone.locator('path.state').first().getAttribute('data-state'),previewPoint=await pointFor(phone,previewCountry);
  await phone.touchscreen.tap(previewPoint.x,previewPoint.y);assert.equal(await phone.locator('#labelLayer text').last().textContent(),previewCountry,'mobile pre-start tap reveals the name');
  await startLocal(phone);await phone.evaluate(()=>scrollTo(0,0));
  const mapBox=await phone.locator('#map').boundingBox(),x=mapBox.x+mapBox.width/2,y=mapBox.y+mapBox.height/2;
  const cdp=await mobile.newCDPSession(phone),touches=(distance)=>[{x:x-distance,y,id:0,radiusX:2,radiusY:2},{x:x+distance,y,id:1,radiusX:2,radiusY:2}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touches(28)});
  for(const distance of [36,45,55,65])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:touches(distance)});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.ok(await percent(phone)>150,'a real two-finger pinch zooms the map');
  assert.equal(await phone.locator('#completed').textContent(),'0');assert.equal(await phone.locator('#mistakes').textContent(),'0 feil','pinch does not submit an answer');
  await capture(phone,'kart-mobile-pinched');
  await zoomKey(phone,'0');await wait(400);
  const phoneTarget=await phone.locator('#targetName').textContent(),phonePoint=await pointFor(phone,phoneTarget);
  await phone.touchscreen.tap(phonePoint.x,phonePoint.y);assert.equal(await phone.locator('#completed').textContent(),'1');
  await capture(phone,'kart-mobile-answer');
  for(const width of [320,390]){await phone.setViewportSize({width,height:844});assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile game fits at '+width+'px');}
  assert.deepEqual(errors,[]);await browser.close();
  console.log('Kart: no floating zoom controls; all six continents, chooser, counties/Statle, tiny-country targets, full-height layout, wheel/keyboard/reset, drag protection, aligned hints, zoomed answers and native mobile pinch passed.');
})().catch(error=>{console.error(error);process.exit(1);});
