/* Native touch scrolling of the map chooser, including returning from a map. */
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:58390';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
  try {
    for (const viewport of [{width:390,height:640}, {width:320,height:568}, {width:844,height:390}]) {
      const context = await browser.newContext({viewport,isMobile:true,hasTouch:true});
      await context.route('**/*', route => {
        const url = route.request().url();
        return url.startsWith(base) && !/\/analytics\.js|\/score-service(?:-[a-f0-9]+)?\.js/.test(url) ? route.continue() : route.abort();
      });
      const page = await context.newPage();
      const touch = await context.newCDPSession(page);
      async function swipe() {
        const x = Math.round(viewport.width / 2), start = Math.round(viewport.height * .8), end = Math.round(viewport.height * .25);
        await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start,id:0}]});
        for (let step = 1; step <= 10; step++) {
          await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:start+(end-start)*step/10,id:0}]});
          await wait(20);
        }
        await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await wait(250);
      }
      async function checkChooser(label) {
        await page.locator('#kart-selection').waitFor({state:'visible'});
        await page.evaluate(() => scrollTo(0,0));
        assert.ok(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight),label+': chooser extends below the screen');
        await swipe();
        assert.ok(await page.evaluate(() => scrollY > 30),label+': a finger swipe scrolls the document');
        await swipe();
        assert.ok(await page.locator('[data-map-region="seas"]').evaluate(el => {
          const rect = el.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= innerHeight;
        }),label+': the last map card is reachable');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),label+': no horizontal overflow');
      }
      await page.goto(base+'/geografi/kart.html');
      await checkChooser(`${viewport.width}×${viewport.height} initial`);
      await page.locator('[data-map-region="seas"]').tap();
      await page.locator('#start:enabled').waitFor();
      assert.ok(await page.locator('#kart-game').isVisible(),'the bottom card opens its map');
      await swipe();
      assert.equal(await page.evaluate(() => scrollY),0,'the active map stays in its viewport');
      await page.locator('#kart-back').tap();
      await checkChooser(`${viewport.width}×${viewport.height} after returning`);
      await context.close();
    }
    console.log('PASS Kart chooser: native touch scrolling, last card, map viewport and return navigation at three mobile sizes.');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error);process.exitCode=1;});
