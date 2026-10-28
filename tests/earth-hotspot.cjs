// Browser regression for the earth cross-section and reversible hotspot prototype.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');res.end(fs.readFileSync(file));}
  catch {res.writeHead(404).end();}
});
const viewports = [{width:1366,height:646},{width:1024,height:600},{width:390,height:844},{width:360,height:640},{width:844,height:390}];

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE || undefined});
  try {
    const context = await browser.newContext({viewport:viewports[0]});
    const errors = [], missing = [];
    context.on('page', page => {
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => {if (r.url().startsWith(base) && r.status() >= 400) missing.push(r.url());});
    });
    // The test does not contact analytics, maps, geological sources or score services.
    await context.route('**/*', r => r.request().url().startsWith(base + '/') ? r.continue() : r.abort());
    const page = await context.newPage();
    const shots = process.env.EARTH_HOTSPOT_SCREENSHOTS;
    if (shots) fs.mkdirSync(shots, {recursive:true});
    await page.goto(base + '/geografi.html#indre-fagstoff');
    const figure = page.locator('#earth-layers');
    await figure.waitFor({state:'visible'});
    const layers = figure.locator('[data-earth-layer]');
    assert.equal(await layers.count(), 7);
    for (const key of ['crust','upper','lower','outer','inner','lithosphere','asthenosphere']) {
      const layer = figure.locator(`[data-earth-layer="${key}"]`);
      await layer.focus();
      assert.equal(await layer.getAttribute('aria-pressed'), 'true', key + ': focus selects the layer');
      assert.equal(await figure.locator('[data-earth-layer][aria-pressed=true]').count(), 1);
      const description = await page.locator('#earth-layer-description').innerText();
      assert.ok(description.length > 40 && description.length < 300, key + ': one short description');
      assert.equal(await layer.getAttribute('aria-controls'), 'earth-layer-info');
    }
    await figure.locator('[data-earth-layer="lower"]').hover();
    assert.match(await page.locator('#earth-layer-name').innerText(), /Nedre mantel/);
    await figure.locator('[data-earth-layer="crust"]').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await figure.locator('[data-earth-layer]:focus').getAttribute('data-earth-layer'), 'upper');
    await page.keyboard.press('End');
    assert.equal(await figure.locator('[data-earth-layer]:focus').getAttribute('data-earth-layer'), 'asthenosphere');
    await figure.locator('[data-earth-layer="asthenosphere"]').press('Enter');
    assert.match(await page.locator('#earth-layer-description').innerText(), /hovedsakelig fast/);
    const beside = await page.evaluate(() => {
      const a = document.querySelector('.earth-description').getBoundingClientRect();
      const b = document.querySelector('#earth-layers').getBoundingClientRect();
      return b.left >= a.right && Math.abs(a.top-b.top) < 2;
    });
    assert.ok(beside, 'The earth figure is beside the description on desktop');
    if (shots) await page.locator('.earth-intro').screenshot({path:path.join(shots,'earth-desktop.png')});
    for (const viewport of [{width:390,height:844},{width:360,height:640}]) {
      await page.setViewportSize(viewport);
      await figure.scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Earth layout has no horizontal mobile scrolling');
      await figure.locator('[data-earth-layer="inner"]').click();
      assert.match(await page.locator('#earth-layer-name').innerText(), /Indre kjerne/);
    }
    await page.evaluate(() => applyDarkMode(true));
    assert.ok(await figure.evaluate(el => getComputedStyle(el).getPropertyValue('--earth-ink').trim() !== '#33443c'));
    console.log('PASS earth layers: hover, click, keyboard, single description, desktop columns and mobile width');

    await page.setViewportSize(viewports[0]);
    await page.goto(base + '/prototyper/hotspot.html');
    const range = page.locator('#progress');
    assert.equal(await range.inputValue(), '0');
    const set = n => range.fill(String(n));
    const state = () => page.locator('#islands [data-feature="island"]').evaluateAll(els => els.map(el => ({id:el.dataset.islandId,x:Number(el.dataset.x),growth:Number(el.dataset.growth)})));
    const plume = await page.locator('#plume').innerHTML();
    await set(12);
    const early = await state();
    const plateEarly = await page.locator('#plate-material').getAttribute('transform');
    assert.equal(early.length, 1);
    await set(28);
    const later = await state();
    assert.ok(later[0].x < early[0].x, 'The same island moves northwest with the plate');
    assert.ok(later.length > early.length, 'A new volcano forms over the hotspot');
    assert.notEqual(await page.locator('#plate-material').getAttribute('transform'), plateEarly);
    assert.equal(await page.locator('#plume').innerHTML(), plume, 'The warm mantle source remains fixed');
    const growing = later.find(x => x.id === '1');
    await set(35);
    assert.ok((await state()).find(x => x.id === '1').growth > growing.growth, 'The new volcano grows as the slider advances');
    const reversible = await page.locator('#islands').innerHTML();
    const narration = await page.locator('#stage-explanation').innerText();
    await set(100);
    assert.equal((await state()).length, 5);
    assert.notEqual(await page.locator('#stage-explanation').innerText(), narration);
    assert.match(await range.getAttribute('aria-valuetext'), /^100 prosent/);
    await set(35);
    assert.equal(await page.locator('#islands').innerHTML(), reversible, 'Scrubbing back restores the exact island geometry');
    assert.equal(await page.locator('#stage-explanation').innerText(), narration, 'Narration rewinds with the model');
    await set(0);await range.press('ArrowRight');assert.equal(await range.inputValue(), '1');
    await set(0);await page.locator('#play').click();
    await page.waitForFunction(() => Number(document.querySelector('#progress').value) > 2);
    await page.locator('#play').click();
    const paused = await range.inputValue();await page.waitForTimeout(100);
    assert.equal(await range.inputValue(), paused, 'Pause freezes the model');
    await set(35);await page.locator('#play').click();
    await page.locator('.island-target[data-island="0"]').focus();
    assert.equal(await page.locator('#play').getAttribute('aria-pressed'), 'false', 'Focusing an island pauses playback');
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.island-target[data-island="0"]').evaluate(el => document.activeElement === el), true, 'The focused island node remains available');
    await page.locator('#reset').click();assert.equal(await range.inputValue(), '0');
    await set(99);await page.locator('#play').click();
    await page.waitForFunction(() => document.querySelector('#play').getAttribute('aria-pressed') === 'false');
    assert.equal(await range.inputValue(), '100', 'Playback stops at the end');
    await page.locator('.island-picker button[data-island="3"]').click();
    assert.match(await page.locator('#island-description').innerText(), /fortsatt.*aktiv/);
    await page.locator('#theme').click();const theme = await page.locator('html').getAttribute('data-theme');
    await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
    assert.equal(await range.inputValue(), '0', 'A fresh visit starts at zero');
    console.log('PASS hotspot: stationary source, moving plate, growing volcanoes, reversible geometry/narration and playback');

    async function fits(scope, label) {
      const fit = await scope.locator('#progress').evaluate(el => {
        const r = el.getBoundingClientRect();
        const s = document.querySelector('#scene').getBoundingClientRect();
        return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,rangeTop:r.top,rangeBottom:r.bottom,sceneHeight:s.height};
      });
      assert.ok(fit.scrollWidth <= fit.width && fit.scrollHeight <= fit.height+1, label + ': no page scroll ' + JSON.stringify(fit));
      assert.ok(fit.rangeTop >= 0 && fit.rangeBottom <= fit.height, label + ': slider visible');
      assert.ok(fit.sceneHeight >= 95, label + ': scene remains visible');
    }
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const value of [0,50,100]) {await set(value);await fits(page, 'Standalone '+JSON.stringify(viewport));}
      if (shots) {await range.blur();await page.screenshot({path:path.join(shots,`hotspot-${viewport.width}x${viewport.height}.png`)});}
    }
    await page.setViewportSize({width:390,height:844});
    await page.locator('#info-toggle').click();
    assert.equal(await page.locator('#explanation[role="dialog"]').isVisible(), true);
    await page.locator('.island-picker button[data-island="4"]').click();
    assert.match(await page.locator('#island-description').innerText(), /bygger fortsatt/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#explanation[role="dialog"]').count(), 0);
    assert.equal(await page.locator('#info-toggle').evaluate(el => document.activeElement === el), true);
    console.log('PASS five standalone viewports and mobile information dialog');

    await page.goto(base + '/geografi.html#indre-hotspot');
    const model = page.frameLocator('#hotspot-model-frame');
    await model.locator('#progress').waitFor();
    assert.equal(await model.locator('#progress').inputValue(), '0');
    await model.locator('#progress').fill('45');
    await page.evaluate(() => applyDarkMode(false));
    await page.waitForFunction(() => document.querySelector('#hotspot-model-frame').contentDocument.documentElement.dataset.theme === 'light');
    assert.equal(await model.locator('#progress').inputValue(), '45', 'Host theme changes retain progress');
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await model.locator('#progress').fill('100');
      await fits(model, 'Embedded '+JSON.stringify(viewport));
      assert.ok(await model.locator('.back').isVisible(), 'The embedded model retains its back control '+JSON.stringify(viewport));
      assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight+1 && document.documentElement.scrollWidth <= innerWidth), 'Host page fits '+JSON.stringify(viewport));
      if (shots) await page.screenshot({path:path.join(shots,`embedded-${viewport.width}x${viewport.height}.png`)});
    }
    await model.locator('#progress').fill('20');await model.locator('#play').click();
    await page.evaluate(() => showContent('indre-fagstoff', document.querySelector('[onclick*="indre-fagstoff"]')));
    await page.waitForFunction(() => document.querySelector('#hotspot-model-frame').contentDocument.querySelector('#play').getAttribute('aria-pressed') === 'false');
    await page.locator('.sidebar .submenu-item').filter({hasText:/^Hotspot-vulkanisme$/}).click();
    await page.waitForFunction(() => document.querySelector('#hotspot-model-frame').contentDocument.querySelector('#progress').value === '0');
    await model.locator('.back').click();
    await page.waitForURL('**/geografi.html#indre-fagstoff');
    assert.equal(await page.locator('#indre-fagstoff.active').count(), 1);
    await page.locator('#indre-fagstoff a[href="#indre-hotspot"]').click();
    await page.waitForURL('**/geografi.html#indre-hotspot');
    await model.locator('#progress').waitFor();
    assert.equal(await model.locator('#progress').inputValue(), '0');
    await page.goto(base + '/prototyper/index.html');
    assert.equal(await page.locator('a.prototype-card[href="hotspot.html"]').count(), 1);
    assert.deepEqual(errors, []);assert.deepEqual(missing, []);
    console.log('PASS embedded viewport fit, theme, pause on hide, restart on reopen, back link and prototype entry');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;}).finally(() => server.close());
