// Run with Node.js + Playwright/Chromium. External traffic is intercepted.
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.join(root, pathname);
  try {
    res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.css') ? 'text/css' : 'text/javascript');
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404).end('missing'); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE || undefined});
    const context = await browser.newContext({viewport:{width:1440,height:1000}});
    const errors = [], missing = [];
    let beacons = 0;
    await context.route('**/*', route => {
      const url = route.request().url();
      if (url.includes('static.cloudflareinsights.com/beacon.min.js')) {
        beacons++;
        return route.fulfill({contentType:'text/javascript', body:'window.__cfBeacon={spa:false};'});
      }
      if (!url.startsWith(base) && !url.startsWith('data:') && !url.startsWith('blob:')) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', response => {if(response.url().startsWith(base) && response.status()>=400) missing.push(response.url());});
    page.setDefaultTimeout(10000);
    async function load(suffix='#indre-subduksjon') {
      await page.goto(`${base}/geografi.html${suffix}`);
      await page.locator('#sd-play').waitFor({state:'attached'});
    }
    async function progress(value) {
      await page.locator('#sd-progress').fill(String(value));
    }
    async function snapshot() {
      return page.evaluate(() => {
        const $ = s => document.querySelector(s);
        const visible = s => getComputedStyle($(s)).display !== 'none';
        const bounds = $('#sd-slab-body').getBBox();
        return {
          value:$('#sd-progress').value, body:$('#sd-slab-body').getAttribute('d'),
          length:bounds.width, depth:bounds.height,
          mountain:$('#sd-surface').getAttribute('d'),
          water:visible('#sd-water-paths'), melt:visible('#sd-melt-zone'), magma:visible('#sd-magma-path'),
          stage:$('#sd-stage-title').textContent,
          quakes:[...$('#sd-earthquakes').children].map(e=>e.dataset.depth),
          description:$('#sd-svg-desc').textContent
        };
      });
    }

    await load();
    assert.ok(await page.locator('#indre-subduksjon').evaluate(el=>el.classList.contains('active')));
    assert.equal(await page.locator('.subduction-menu-link.active').count(),1);
    const start = await snapshot();
    assert.equal(start.value,'0');
    assert.equal(start.water,false);
    assert.equal(start.melt,false);
    assert.equal(start.quakes.length,0);
    await progress(55);
    const middle = await snapshot();
    assert.ok(middle.length>start.length && middle.depth>start.depth);
    assert.equal(middle.water,true);
    assert.equal(middle.melt,true);
    assert.match(middle.stage,/Vann/);
    assert.ok(middle.quakes.includes('mellomdypt'));
    assert.ok(!middle.quakes.includes('dypt'));
    await progress(100);
    const end = await snapshot();
    assert.ok(end.length>middle.length && end.depth>middle.depth);
    assert.notEqual(end.mountain,start.mountain);
    assert.equal(end.magma,true);
    assert.ok(['grunt','mellomdypt','dypt'].every(type=>end.quakes.includes(type)));
    // All deeper foci should actually lie INSIDE the slab, not in the mantle wedge.
    assert.ok(await page.evaluate(()=>{
      const slab=document.querySelector('#sd-slab-body');
      return [...document.querySelectorAll('#sd-earthquakes [data-depth]')].filter(e=>e.dataset.depth!=='grunt').every(el=>{
        const matrix=el.transform.baseVal.consolidate().matrix;
        return slab.isPointInFill(new DOMPoint(matrix.e,matrix.f));
      });
    }));
    // All blue fluid arrows start lower down and terminate above their sources.
    assert.ok(await page.locator('#sd-water-paths').evaluate(el=>[...el.children].every(path=>{
      const start=path.getPointAtLength(0), end=path.getPointAtLength(path.getTotalLength());
      return start.y>end.y;
    })));
    await progress(55);
    assert.equal((await snapshot()).body,middle.body,'Rewinding must reproduce the same geometry');
    console.log('PASS reversible geometry, trench/mountain development, upward fluids, magma and depth-distributed foci');

    await page.getByRole('button',{name:'2 Vann og magma',exact:true}).click();
    assert.match(await page.locator('#sd-explanation').innerText(),/vann bundet i mineraler/);
    assert.match(await page.locator('#sd-explanation').innerText(),/Mesteparten av mantelen er fortsatt fast/);
    await page.locator('#sd-fluids').uncheck();
    assert.equal((await snapshot()).water,false);
    assert.equal((await snapshot()).melt,false);
    await page.locator('#sd-quakes').uncheck();
    assert.equal(await page.locator('#sd-earthquakes').isVisible(),false);
    assert.equal(await page.locator('#sd-quake-key').isVisible(),false);
    await page.locator('#sd-labels').uncheck();
    assert.equal(await page.locator('#sd-label-layer').isVisible(),false);
    await page.locator('#sd-reset').click();
    assert.equal((await snapshot()).body,start.body);
    for(const id of ['labels','quakes','fluids']) assert.equal(await page.locator(`#sd-${id}`).isChecked(),true);
    assert.equal(await page.locator('[data-sd-topic=trench]').getAttribute('aria-pressed'),'true');
    const range = page.getByRole('slider',{name:'Styr platebevegelsen',exact:true});
    await range.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await range.inputValue(),'1');
    await page.keyboard.press('End');
    assert.equal(await range.inputValue(),'100');
    assert.match(await range.getAttribute('aria-valuetext'),/100 prosent/);
    await page.keyboard.press('Home');
    assert.equal(await range.inputValue(),'0');
    assert.ok(await range.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
    console.log('PASS explanations, layer switches, reset, keyboard and focus indication');

    await page.locator('#sd-play').click();
    await page.waitForFunction(()=>Number(document.getElementById('sd-progress').value)>=1);
    await page.locator('#sd-play').click();
    const paused=await range.inputValue();
    await page.waitForTimeout(150);
    assert.equal(await range.inputValue(),paused);
    await page.locator('#sd-play').click();
    // Existing navigation should pause playback, even though the widget remains in the DOM.
    await page.locator('[onclick="showContent(\'indre-fagstoff\', this)"]').click();
    const away=await page.locator('#sd-progress').inputValue();
    await page.waitForTimeout(150);
    assert.equal(await page.locator('#sd-progress').inputValue(),away);
    assert.equal(await page.locator('#sd-play').getAttribute('aria-pressed'),'false');
    // The hash is already the model hash: a same-hash menu/CTA click must still open it.
    await page.locator('.subduction-entry').click();
    assert.equal(await page.locator('#indre-subduksjon').isVisible(),true);
    await progress(99);
    await page.locator('#sd-play').click();
    await page.waitForFunction(()=>document.getElementById('sd-progress').value==='100');
    assert.equal(await page.locator('#sd-play').getAttribute('aria-pressed'),'false');
    assert.equal(beacons,1,'Internal navigation must not load another Cloudflare instance');
    console.log('PASS playback, pause, stop on navigation, end condition, same-hash return and one analytics instance');

    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('#sd-reset').click();
    await page.waitForTimeout(150);
    assert.equal(await range.inputValue(),'0');
    assert.equal(await page.locator('#sd-play').getAttribute('aria-pressed'),'false');
    // Explicit playback remains possible; direct scrubbing never requires animation.
    await progress(100);
    assert.equal((await snapshot()).magma,true);
    await page.locator('#dark-mode-toggle').click();
    assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('dark-mode')));
    const dark=await page.locator('#subduction-lab').evaluate(el=>getComputedStyle(el).backgroundColor);
    assert.equal(dark,'rgb(21, 35, 30)');
    await page.locator('#dark-mode-toggle').click();
    console.log('PASS reduced motion and existing dark mode');

    for(const width of [1440,1024,768,600,390,320]) {
      await page.setViewportSize({width,height:900});
      await page.locator('#subduction-lab').scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>document.getElementById('sd-diagram').classList.contains('is-compact')===(document.querySelector('.sd-diagram-wrap').clientWidth<=600));
      const layout=await page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth,
        clipped:[...document.querySelectorAll('.sd-feature-buttons button,.sd-actions button')].filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.textContent)}));
      assert.ok(layout.page<=layout.viewport,`Horizontal overflow at ${width}px`);
      assert.deepEqual(layout.clipped,[],`Clipped control text at ${width}px`);
      assert.ok(await range.isVisible());
    }
    if(process.env.SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});
      for(const width of [1440,390]) {
        await page.setViewportSize({width,height:1000});
        await page.locator('#subduction-lab').screenshot({path:path.join(process.env.SCREENSHOT_DIR,`subduction-${width}.png`)});
      }
    }
    console.log('PASS responsive layout at 320, 390, 600, 768, 1024 and 1440 pixels');
    // Real touch input, rather than only assigning the range value in script.
    const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await touch.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
    const mobile=await touch.newPage();
    mobile.on('pageerror',e=>errors.push(e.message));
    await mobile.goto(`${base}/geografi.html#indre-subduksjon`);
    const touchRange=mobile.locator('#sd-progress');
    await touchRange.scrollIntoViewIfNeeded();
    const box=await touchRange.boundingBox();
    await mobile.touchscreen.tap(box.x+box.width*.6,box.y+box.height/2);
    assert.ok(Number(await touchRange.inputValue())>40,'Touching the slider must change the model');
    await mobile.locator('#sd-reset').tap();
    assert.equal(await touchRange.inputValue(),'0');
    await touch.close();
    assert.deepEqual(errors,[]);
    assert.deepEqual(missing,[]);
    console.log('PASS touch slider/reset, no JavaScript errors or missing local resources');
  } finally {
    if(browser) await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
