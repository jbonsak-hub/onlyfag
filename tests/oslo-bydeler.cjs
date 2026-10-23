// Exercise the real borough map, shared game, navigation and scoreboard binding.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'assets/geography/oslo-bydeler/map.json'), 'utf8'));
assert.equal(map.states.length, 16);
assert.equal(new Set(map.states.map(item => item.n)).size, 16);
for (const name of ['Gamle Oslo', 'Grünerløkka', 'Sagene', 'Frogner', 'Søndre Nordstrand', 'Sentrum']) assert(map.states.some(item => item.n === name), name + ' is present');
for (const name of ['Marka']) assert(!map.states.some(item => item.n === name), name + ' is context, not an ordinary borough');
assert(map.boundaries.length && map.context.length && map.water.length, 'Detailed borders, surrounding land and water are included');
const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.json':'application/json'};
const server = http.createServer((request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  try { response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); response.end(fs.readFileSync(file)); }
  catch (_) { response.writeHead(404).end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE});
  const page = await browser.newPage({viewport:{width:1366, height:768}});
  const errors = [], missing = [], boards = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) missing.push(response.url()); });
  await page.route('**/*', route => {
    const url = route.request().url();
    if (new URL(url).pathname === '/scores') {
      boards.push(JSON.parse(new URL(url).searchParams.get('config')));
      return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({rows:[]})});
    }
    return url.startsWith(base) || /^(data|blob):/.test(url) ? route.continue() : route.abort();
  });
  const targets = page.locator('#states .municipality[data-state]');
  const choose = name => targets.evaluateAll((elements, name) => {
    const element = elements.find(element => element.dataset.state === name);
    if (!element) throw Error('Missing borough: ' + name);
    element.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
  }, name);
  const advance = () => page.clock.fastForward(700);
  const capture = async name => {
    if (!process.env.OSLO_BOROUGH_SCREENSHOTS) return;
    fs.mkdirSync(process.env.OSLO_BOROUGH_SCREENSHOTS, {recursive:true});
    await page.screenshot({path:path.join(process.env.OSLO_BOROUGH_SCREENSHOTS, name + '.png')});
  };
  try {
    await page.clock.install();
    await page.goto(base + '/geografi/kart.html');
    assert.deepEqual(await page.locator('.kart-map-groups section:first-child [data-card]').evaluateAll(elements => elements.map(element => element.dataset.card)), ['europe','asia','northAmerica','southAmerica','africa','oceania','fylker','usa','municipalities','bydeler'], 'Continents precede counties/states and local maps in DOM and keyboard order');
    const municipalities = await page.locator('[data-card="municipalities"]').boundingBox();
    const entry = page.locator('[data-card="bydeler"]'), box = await entry.boundingBox();
    assert(Math.abs(box.y - municipalities.y) < 1 && box.x > municipalities.x, 'Oslo boroughs sit beside municipalities');
    await capture('map-menu');
    await entry.click();
    await page.waitForURL('**/geografi/oslo-bydeler.html');
    await page.locator('#start:enabled').waitFor();
    assert.equal(await targets.count(), 16);
    assert.equal(await page.locator('#total-count').textContent(), ' / 16');
    assert.equal(await page.locator('#map text').count(), 0, 'Map does not reveal answers');
    assert.equal(await page.locator('#skip').count(), 0);
    assert.match(await page.locator('.borough-reform-note').textContent(), /8.*1\. januar 2028/);
    assert(await page.locator('#statle-top-ten').isVisible());
    await page.locator('#statle-top-ten').click();
    await page.locator('#geo-online-board').waitFor();
    await page.waitForFunction(() => document.querySelector('#geo-online-content')?.textContent.includes('Ingen resultater'));
    assert.equal(boards.at(-1).game, 'bydeler', 'The borough quiz requests its own leaderboard');
    await page.locator('#geo-online-board button').click();
    const checkHierarchy = async () => {
      const styles = await page.evaluate(() => {
        const css = selector => getComputedStyle(document.querySelector(selector));
        const border = css('.municipality-border-line'), context = css('.municipality-context'), land = css('.municipality:not([data-band])');
        const river = document.querySelector('.municipality-river');
        return {borderWidth:parseFloat(border.strokeWidth), riverWidth:river ? parseFloat(getComputedStyle(river).strokeWidth) : 0, context:context.fill, land:land.fill, water:css('#mapViewport').backgroundColor, contextPointer:context.pointerEvents, waterPointer:css('#municipality-water').pointerEvents};
      });
      assert(styles.borderWidth >= styles.riverWidth * 2.5, 'Borough boundaries dominate rivers');
      assert.notEqual(styles.context, styles.land, 'Outside land differs from the quiz boroughs');
      assert.notEqual(styles.context, styles.water, 'Outside land differs from water');
      assert.equal(styles.contextPointer, 'none');
      assert.equal(styles.waterPointer, 'none', 'Water cannot steal answer clicks');
    };
    await checkHierarchy();
    await capture('boroughs-light');
    const initial = await targets.evaluateAll(elements => Object.fromEntries(elements.map(element => [element.dataset.state, getComputedStyle(element).fill])));
    await page.locator('#start').click();
    await page.waitForFunction(() => document.body.dataset.phase === 'playing');
    const slow = await page.locator('#targetName').textContent();
    await page.clock.fastForward(6000);
    const point = await targets.evaluateAll((elements, name) => {
      const element = elements.find(element => element.dataset.state === name), box = element.getBBox();
      for (let y = 1; y < 30; y++) for (let x = 1; x < 30; x++) {
        const point = new DOMPoint(box.x + box.width * x / 30, box.y + box.height * y / 30);
        if (!element.isPointInFill(point)) continue;
        const screen = point.matrixTransform(element.getScreenCTM());
        if (document.elementFromPoint(screen.x, screen.y)?.closest('[data-state]') === element) return {x:screen.x, y:screen.y};
      }
    }, slow);
    assert(point, 'A requested borough has visible clickable land');
    await page.mouse.click(point.x, point.y);
    assert.equal(await page.locator('#completed').textContent(), '1');
    await advance();
    const seen = new Set([slow]);
    for (let i = 1; i < 16; i++) { const name = await page.locator('#targetName').textContent(); seen.add(name); if(name==='Sentrum'){
      const point=await page.evaluate(c=>{const p=new DOMPoint(...c).matrixTransform(document.querySelector('#map').getScreenCTM());return {x:p.x,y:p.y,hit:document.elementFromPoint(p.x,p.y)?.dataset.state};},map.states.find(s=>s.n==='Sentrum').c);
      assert.equal(point.hit,'Sentrum','Sentrum has its own clickable land area');await page.mouse.click(point.x,point.y);
    }else await choose(name); await advance(); }
    assert(seen.has('Sentrum'),'Sentrum is included in the full quiz round');
    assert.equal(seen.size, 16, 'A complete round asks all fifteen boroughs and Sentrum');
    assert.equal(await page.locator('body').getAttribute('data-phase'), 'finished');
    assert.equal(await page.locator('#targetName').textContent(), 'Alle bydelene er på plass.');
    await page.locator('#repeat-practice-start').click();
    assert.equal(await page.locator('#targetName').textContent(), slow);
    assert.equal(await page.locator('#states .mastered').count(), 15);
    await page.waitForFunction(initial => [...document.querySelectorAll('#states .retry-pending')].every(element => getComputedStyle(element).fill === initial[element.dataset.state]), initial);
    await choose(slow); await advance();
    assert.equal(await page.locator('#targetName').textContent(), 'Alle er grønne!');
    await page.reload(); await page.locator('#start:enabled').waitFor();
    const beforeZoom = await page.locator('#map').getAttribute('viewBox');
    await page.evaluate(() => ClickMapZoom.zoom(1.5));
    assert.notEqual(await page.locator('#map').getAttribute('viewBox'), beforeZoom);
    await page.evaluate(() => ClickMapZoom.reset());
    await page.locator('.map-theme-toggle:visible').first().click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await checkHierarchy();
    await capture('boroughs-dark');
    await page.reload(); await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'Dark mode persists');
    for (const viewport of [{width:390,height:844}, {width:844,height:390}]) {
      await page.setViewportSize(viewport);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      const mapBox = await page.locator('#mapViewport').boundingBox();
      assert(mapBox.width > 100 && mapBox.height > 100 && mapBox.y + mapBox.height <= viewport.height + 1, 'Map remains usable inside the viewport');
      const header = await page.locator('.panel-header').boundingBox();
      const brand = await page.locator('.panel-header .brand').boundingBox();
      assert(brand.x + brand.width <= header.x + header.width + 1, 'Header fits without clipping');
      await capture('boroughs-' + viewport.width);
    }
    await page.locator('#kart-back').click();
    await page.waitForURL('**/geografi/kart.html');
    assert(await page.locator('#kart-selection').isVisible());
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
    console.log('PASS Oslo borough quiz: 16 real shapes, complete round and retry, mouse/keyboard answers, water/border hierarchy, own scoreboard, dark mode, zoom and responsive navigation');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
