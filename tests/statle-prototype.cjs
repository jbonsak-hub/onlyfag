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
 assert.equal(await page.locator('#demo, #pause, #resume').count(),0);
 assert.equal(await page.locator('.brand').innerText(),'Statle');
 assert.equal(await page.locator('.brand').getAttribute('href'),null);
 assert.equal(await page.locator('#map text').count(),0);
 const insetAlignment=await page.evaluate(()=>Math.abs(document.querySelector('path.state[data-state="Florida"]').getBoundingClientRect().bottom-document.querySelector('path.state[data-state="Hawaii"]').getBoundingClientRect().bottom));
 assert.ok(insetAlignment<0.1,'Hawaii must align with the southern tip of Florida');
 assert.equal(await page.locator('#geoMenu').isVisible(),false);
 await page.locator('#geoMenuButton').click();
 assert.equal(await page.locator('#geoMenu').isVisible(),true);
 assert.equal(await page.locator('#geoMenuButton').getAttribute('aria-expanded'),'true');
 assert.equal(await page.locator('#geoMenu details').count(),7);
 await page.screenshot({path:path.join(screenshots,'statle-menu-open.png'),fullPage:true});
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#geoMenuButton').getAttribute('aria-expanded'),'false');
 await page.locator('#start').click();
 await page.screenshot({path:path.join(screenshots,'statle-demo.png'),fullPage:true});
 const target=()=>page.locator('#targetName').innerText();
 const click=async name=>{
   const point=await page.evaluate(name=>{const el=[...document.querySelectorAll('path.state')].find(e=>e.dataset.state===name),b=el.getBBox();for(const j of [10,9,11,8,12,7,13,6,14,5,15,4,16,3,17,2,18,1,19])for(const i of [10,9,11,8,12,7,13,6,14,5,15,4,16,3,17,2,18,1,19]){const p=new DOMPoint(b.x+b.width*i/20,b.y+b.height*j/20);if(el.isPointInFill(p)){const c=p.matrixTransform(el.getScreenCTM());return {x:c.x,y:c.y};}}},name);
   assert.ok(point,name+' has a clickable shape');await page.mouse.click(point.x,point.y);
 };
 await page.locator('path.state[data-state="Nebraska"]').hover();
 assert.ok(await page.locator('path.state[data-state="Nebraska"]').evaluate(e=>getComputedStyle(e).filter.includes('brightness')));
 const initialTarget=await target();
 const wrongNames=await page.locator('path.state').evaluateAll((els,t)=>els.map(e=>e.dataset.state).filter(n=>n!==t).slice(0,2),initialTarget);
 await click(wrongNames[0]);
 assert.equal(await page.locator('#labelLayer text').textContent(),wrongNames[0]);
 assert.equal(await page.locator('.hint-ring').count(),0);
 await page.waitForTimeout(1120);assert.equal(await page.locator('#labelLayer text').count(),0);
 await click(wrongNames[1]);assert.equal(await page.locator('.hint-ring').count(),1);
 await page.screenshot({path:path.join(screenshots,'statle-hint.png'),fullPage:true});
 await page.waitForTimeout(1530);assert.equal(await page.locator('.hint-ring').count(),0);
 await click(initialTarget);assert.equal(await page.locator(`path.state[data-state="${initialTarget}"]`).getAttribute('data-band'),'2');
 await page.waitForTimeout(700);
 const runningTime=await page.locator('#elapsed').innerText();
 await page.locator('#geoMenuButton').click();await page.waitForTimeout(1150);
 assert.notEqual(await page.locator('#elapsed').innerText(),runningTime,'Menu does not pause the timer');
 await page.locator('#geoMenuClose').click();
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
 await page.locator('#restart').click();assert.equal(await page.locator('#skip').count(),0);await click(await target());await page.waitForTimeout(700);assert.equal(await page.locator('#completed').innerText(),'1');
 await page.setViewportSize({width:390,height:844});await page.locator('#restart').click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.waitForTimeout(250);await page.screenshot({path:path.join(screenshots,'statle-mobile.png'),fullPage:true});
 assert.equal(await page.locator('#zoom').count(),0);
 await page.locator('#geoMenuButton').click();
 assert.ok(await page.locator('#geoMenu').evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
 await page.keyboard.press('Escape');
 for(const viewport of [{width:1366,height:520},{width:1366,height:643},{width:1440,height:900},{width:1920,height:1080}]){
  await page.setViewportSize(viewport);const layout=await page.evaluate(()=>{const map=document.getElementById('mapViewport').getBoundingClientRect(),panel=document.querySelector('.game-panel').getBoundingClientRect();return {top:map.top,bottom:map.bottom,height:map.height,width:map.width,panelX:panel.x,scrollHeight:document.documentElement.scrollHeight,innerHeight,scrollWidth:document.documentElement.scrollWidth,innerWidth};});assert.equal(layout.top,0);assert.equal(layout.height,viewport.height);assert.equal(layout.panelX,0);assert.equal(layout.top,0);assert.ok(layout.scrollHeight<=layout.innerHeight);assert.ok(layout.scrollWidth<=layout.innerWidth);await page.screenshot({path:path.join(screenshots,'statle-layout-'+viewport.width+'x'+viewport.height+'.png')});
 }
 await page.locator('#geoMenuButton').click();
 await page.locator('#geoMenu summary').filter({hasText:'Fakta og quiz'}).click();
 await page.locator('#geoMenu a').filter({hasText:/^Land$/}).click();
 await page.waitForURL('**/geografi.html#verden-land');
 await page.locator('#verden-land.active').waitFor();
 await page.goto(url);await page.locator('.quiz-page-back').click();
 await page.waitForURL('**/geografi.html#verden-quiz');
 assert.ok(await page.locator('#verden-quiz.active').isVisible());
 assert.deepEqual(errors,[]);console.log(JSON.stringify({states:50,wholeRound:true,hover:true,wrongLabel:true,twoMistakeHint:true,fourColorBands:true,pauseRemoved:true,menu:true,restart:true,skip:true,mobile:true,fullHeightLayout:true,errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
