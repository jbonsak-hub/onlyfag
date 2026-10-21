const fs=require('fs'),path=require('path'),assert=require('assert/strict');
// Run against a served prototype or the self-contained HTML export.
// Set STATLE_PREVIEW_URL; PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE are optional.
const pw=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const screenshots=process.env.STATLE_SCREENSHOT_DIR || require('os').tmpdir();
assert.ok(process.env.STATLE_PREVIEW_URL, 'Set STATLE_PREVIEW_URL to the prototype URL');
(async()=>{
 const browser=await pw.chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const url=process.env.STATLE_PREVIEW_URL;
 await page.goto(url);await page.locator('#start:enabled').waitFor();
 assert.equal(await page.locator('path.state').count(),50);
 await page.screenshot({path:path.join(screenshots,'statle-ready.png'),fullPage:true});
 await page.locator('#demo').click();
 await page.screenshot({path:path.join(screenshots,'statle-demo.png'),fullPage:true});
 const target=()=>page.locator('#targetName').innerText();
 const click=async name=>{
   const point=await page.evaluate(name=>{const el=[...document.querySelectorAll('path.state')].find(e=>e.dataset.state===name),b=el.getBBox();for(const j of [10,9,11,8,12,7,13,6,14,5,15,4,16,3,17,2,18,1,19])for(const i of [10,9,11,8,12,7,13,6,14,5,15,4,16,3,17,2,18,1,19]){const p=new DOMPoint(b.x+b.width*i/20,b.y+b.height*j/20);if(el.isPointInFill(p)){const c=p.matrixTransform(el.getScreenCTM());return {x:c.x,y:c.y};}}},name);
   assert.ok(point,name+' has a clickable shape');await page.mouse.click(point.x,point.y);
 };
 await page.locator('path.state[data-state="Nebraska"]').hover();
 assert.ok(await page.locator('path.state[data-state="Nebraska"]').evaluate(e=>getComputedStyle(e).filter.includes('brightness')));
 await click('Oregon');
 assert.equal(await page.locator('#labelLayer text').textContent(),'Oregon');
 assert.equal(await page.locator('.hint-ring').count(),0);
 await page.waitForTimeout(1120);assert.equal(await page.locator('#labelLayer text').count(),0);
 await click('Nevada');assert.equal(await page.locator('.hint-ring').count(),1);
 await page.screenshot({path:path.join(screenshots,'statle-hint.png'),fullPage:true});
 await page.waitForTimeout(1530);assert.equal(await page.locator('.hint-ring').count(),0);
 await click('Pennsylvania');assert.equal(await page.locator('path.state[data-state="Pennsylvania"]').getAttribute('data-band'),'2');
 await page.waitForTimeout(700);
 await page.locator('#pause').click();const paused=await page.locator('#elapsed').innerText();await page.waitForTimeout(1150);assert.equal(await page.locator('#elapsed').innerText(),paused);
 await page.locator('#resume').click();
 await page.locator('#restart').click();assert.equal(await page.locator('#completed').innerText(),'0');
 const first=await target();await click(first);assert.equal(await page.locator(`path.state[data-state="${first}"]`).getAttribute('data-band'),'0');
 await page.waitForTimeout(700);
 // The entire round can be completed; restart also cancels old effect callbacks.
 const second=await target();await page.waitForTimeout(5150);await click(second);assert.equal(await page.locator(`path.state[data-state="${second}"]`).getAttribute('data-band'),'1');
 await page.waitForTimeout(700);
 const third=await target();for(const name of await page.locator('path.state:not([data-band])').evaluateAll((els,target)=>els.map(e=>e.dataset.state).filter(n=>n!==target).slice(0,3),third))await click(name);
 await click(third);assert.equal(await page.locator(`path.state[data-state="${third}"]`).getAttribute('data-band'),'3');
 await page.waitForTimeout(700);
 for(let i=3;i<50;i++){
  const name=await target();await page.locator(`path.state[data-state="${name}"]`).dispatchEvent('click');await page.waitForTimeout(670);
 }
 assert.equal(await page.locator('#completed').innerText(),'50');assert.equal(await target(),'Hele USA er på plass.');
 await page.screenshot({path:path.join(screenshots,'statle-finished.png'),fullPage:true});
 await page.locator('#restart').click();await page.locator('#skip').click();await page.waitForTimeout(1150);assert.equal(await page.locator('#completed').innerText(),'1');
 await page.setViewportSize({width:390,height:844});await page.locator('#restart').click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.waitForTimeout(250);await page.screenshot({path:path.join(screenshots,'statle-mobile.png'),fullPage:true});
 assert.equal(await page.locator('#zoom').count(),0);
 await page.locator('#pause').click();await page.locator('#resume').click();
 for(const viewport of [{width:1366,height:520},{width:1366,height:643},{width:1440,height:900},{width:1920,height:1080}]){
  await page.setViewportSize(viewport);const layout=await page.evaluate(()=>{const map=document.getElementById('mapViewport').getBoundingClientRect(),panel=document.querySelector('.game-panel').getBoundingClientRect();return {top:map.top,bottom:map.bottom,height:map.height,width:map.width,panelX:panel.x,scrollHeight:document.documentElement.scrollHeight,innerHeight,scrollWidth:document.documentElement.scrollWidth,innerWidth};});assert.equal(layout.top,0);assert.equal(layout.height,viewport.height);assert.equal(layout.panelX,layout.width);assert.ok(layout.scrollHeight<=layout.innerHeight);assert.ok(layout.scrollWidth<=layout.innerWidth);await page.screenshot({path:path.join(screenshots,'statle-layout-'+viewport.width+'x'+viewport.height+'.png')});
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({states:50,wholeRound:true,hover:true,wrongLabel:true,twoMistakeHint:true,fourColorBands:true,pause:true,restart:true,skip:true,mobile:true,fullHeightLayout:true,errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
