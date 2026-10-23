// Real-browser coverage for the county chooser and shared municipality game.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const index = JSON.parse(fs.readFileSync(path.join(root, 'assets/geography/municipalities/index.json'), 'utf8'));
const counties = new Map(index.counties.map(county => [county.code, county]));
assert.equal(counties.size, 15, 'All current counties are selectable');
assert.equal(index.counties.reduce((sum, county) => sum + county.count, 0), 357, 'The chooser shows the official municipality counts');
assert.equal(counties.get('03').count, 1, 'Oslo is one municipality even though its quiz includes the surrounding area');
for(const county of index.counties){
  const map=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/municipalities',county.file),'utf8'));
  assert(map.boundaries?.length>0,county.name+' has separate inland municipality borders');
  assert(map.context?.length>0,county.name+' includes surrounding land');
}

const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.json':'application/json'};
const server = http.createServer((request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  try {
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  } catch (_) { response.writeHead(404).end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE});
  const page = await browser.newPage({viewport:{width:1366, height:768}});
  const errors = [], missing = [], scoringRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) missing.push(response.url()); });
  await page.route('**/*', route => {
    const url = route.request().url();
    if (/\/session(?:\?|$)|\/scores\?|\/publish(?:\?|$)/.test(url)) scoringRequests.push({url,body:route.request().postDataJSON()});
    return url.startsWith(base) || /^(data|blob):/.test(url) ? route.continue() : route.abort();
  });
  const targets = page.locator('#states .municipality[data-state]');
  const choose = name => targets.evaluateAll((elements, name) => {
    const element = elements.find(element => element.dataset.state === name);
    if (!element) throw Error('Missing municipality: ' + name);
    element.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
  }, name);
  const nextName = () => page.locator('#targetName').textContent();
  const advance = () => page.clock.fastForward(700);
  const capture = async name => {
    if (!process.env.MUNICIPALITY_SCREENSHOTS) return;
    fs.mkdirSync(process.env.MUNICIPALITY_SCREENSHOTS, {recursive:true});
    await page.screenshot({path:path.join(process.env.MUNICIPALITY_SCREENSHOTS, name + '.png')});
  };
  try {
    await page.clock.install();
    await page.goto(base + '/geografi/kart.html');
    const entry = page.locator('[data-card="municipalities"]');
    const africaBox = await page.locator('[data-card="africa"]').boundingBox();
    const entryBox = await entry.boundingBox();
    assert(entryBox.y >= africaBox.y + africaBox.height, 'The municipality entry is below Africa');
    assert(entryBox.x > africaBox.x, 'The municipality entry occupies the right column beside Oslo');
    assert.equal(new URL(await entry.getAttribute('href'), page.url()).pathname, '/geografi/kommuner.html');
    await capture('map-menu-entry');
    await entry.click();
    await page.waitForURL('**/geografi/kommuner.html');
    await page.locator('#municipality-list [data-county]').last().waitFor();
    assert.equal(await page.locator('#municipality-map [data-county]').count(), 15);
    assert.equal(await page.locator('#municipality-list [data-county]').count(), 15);
    assert.equal(await page.locator('#kart-game').isVisible(), false);
    for (const county of index.counties) {
      const button = page.locator('#municipality-list [data-county="' + county.code + '"]');
      assert.match(await button.textContent(), new RegExp('\\(' + county.quizCount + '\\)'));
      assert.match(await button.textContent(), new RegExp(county.quizTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.match(await page.locator('#municipality-list [data-county="03"]').textContent(), /Oslo og omegn\s*\(54\)/);
    assert.equal(await page.locator('#municipality-map [data-county="03"]').getAttribute('aria-label'), 'Oslo og omegn (54)');
    const mapCounty = page.locator('#municipality-map [data-county="39"]');
    const listCounty = page.locator('#municipality-list [data-county="39"]');
    const original = await mapCounty.evaluate(element => getComputedStyle(element).fill);
    const waitForHighlight = async () => {
      assert(await mapCounty.evaluate(element => element.classList.contains('is-highlighted')), 'The county map receives the shared highlight state');
      assert(await listCounty.evaluate(element => element.classList.contains('is-highlighted')), 'The county list receives the shared highlight state');
      // The game clock controls timers, not the browser's CSS transition paint.
      await page.waitForFunction(original => getComputedStyle(document.querySelector('#municipality-map [data-county="39"]')).fill !== original, original);
    };
    await listCounty.hover();
    await waitForHighlight();
    await listCounty.focus();
    await page.mouse.move(1350, 750);
    await waitForHighlight();
    await listCounty.evaluate(element => element.blur());
    await mapCounty.dispatchEvent('pointerenter');
    assert(await listCounty.evaluate(element => element.classList.contains('is-highlighted')), 'Hovering the map highlights its list entry');
    await capture('county-overview');

    // Enter from the list, complete a full round, then practise the one slow answer.
    await listCounty.click();
    await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('body').getAttribute('data-county'), '39');
    assert.equal(new URL(page.url()).searchParams.get('fylke'), '39');
    assert.equal(await targets.count(), counties.get('39').count);
    assert.equal(await page.locator('#map text').count(), 0, 'Municipalities have no answer labels before the game');
    assert.equal(await page.locator('#skip').count(), 0);
    assert.equal(await page.locator('#statle-top-ten').isVisible(), true, 'Each county exposes its own highscore list');
    const initialColors = await targets.evaluateAll(elements => Object.fromEntries(elements.map(element => [element.dataset.state, getComputedStyle(element).fill])));
    assert(Object.values(initialColors).every(color=>color==='rgb(32, 129, 79)'),'Quiz targets retain their green base colour; grey is reserved for surrounding land');
    const water = page.locator('#municipality-water');
    assert(await water.locator('.municipality-lake').count(), 'Lakes remain visible on the county map');
    assert.equal(await water.evaluate(element => getComputedStyle(element).pointerEvents), 'none', 'Water never steals municipal answer clicks');
    assert.match(await water.getAttribute('clip-path'), /url\(#municipality-extent\)/, 'Hydrography is clipped to the visible land');
    assert.equal(await page.locator('.municipality-boundaries').evaluate(element => getComputedStyle(element).pointerEvents), 'none');
    const checkMapHierarchy=async()=>{
      const style=await page.evaluate(()=>{
        const css=selector=>getComputedStyle(document.querySelector(selector));
        const border=css('.municipality-border-line'),river=css('.municipality-river'),context=css('.municipality-context');
        return {border:border.stroke,borderWidth:parseFloat(border.strokeWidth),river:river.stroke,riverWidth:parseFloat(river.strokeWidth),riverOpacity:parseFloat(river.opacity),land:css('.municipality:not([data-band])').fill,context:context.fill,contextPointer:context.pointerEvents,water:css('#mapViewport').backgroundColor};
      });
      const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
      assert(style.borderWidth>=style.riverWidth*2.5,'Municipal boundaries are substantially thicker than rivers');
      assert(contrast(style.border,style.land)>contrast(style.river,style.land)*2,'Municipal borders have much stronger contrast than rivers');
      assert(style.riverOpacity<1,'River lines remain subdued');
      assert.notEqual(style.context,style.water,'Surrounding land differs from water');
      assert.notEqual(style.context,style.land,'Surrounding land differs from the quiz targets');
      assert.equal(style.contextPointer,'none','Surrounding land cannot become an answer');
      const contextVisible=await page.evaluate(()=>{
        const map=document.querySelector('#map'),context=map.querySelector('.municipality-context'),r=map.getBoundingClientRect(),inverse=map.getScreenCTM().inverse();
        for(let y=1;y<20;y++)for(let x=1;x<20;x++)if(context.isPointInFill(new DOMPoint(r.x+r.width*x/20,r.y+r.height*y/20).matrixTransform(inverse)))return true;
        return false;
      });
      assert(contextVisible,'Actual surrounding land is visible inside the map viewport');
    };
    await checkMapHierarchy();
    await capture('municipality-boundaries-light');
    assert.equal(await page.locator('#feedback').textContent(), '');
    await page.locator('#start').click();
    await page.waitForFunction(()=>document.body.dataset.phase==='playing');
    const slow = await nextName();
    await page.clock.fastForward(6000);
    await choose(slow);
    await advance();
    const remaining = await targets.count();
    for (let i = 1; i < remaining; i++) { await choose(await nextName()); await advance(); }
    assert.equal(await page.locator('body').getAttribute('data-phase'), 'finished');
    assert(await page.locator('#repeat-practice-start').isVisible());
    await page.locator('#repeat-practice-start').click();
    assert.equal(await nextName(), slow);
    assert.equal(await page.locator('#states .retry-pending').count(), 1);
    assert.equal(await page.locator('#states .mastered').count(), remaining - 1);
    await page.waitForFunction(initial => [...document.querySelectorAll('#states .retry-pending')].every(element => getComputedStyle(element).fill === initial[element.dataset.state]), initialColors);
    assert.equal(await page.locator('#mistakes').textContent(), '0');
    assert.equal(await page.locator('#feedback').textContent(), '');
    await choose(slow); await advance();
    assert.equal(await page.locator('#repeat-practice').isVisible(), false);
    assert.equal(await page.locator('#targetName').textContent(), 'Alle er grønne!');
    await capture('municipalities-complete');
    await page.locator('#kart-back').click();
    assert(await page.locator('#municipality-selection').isVisible());
    assert.equal(await page.locator('#kart-game').isVisible(), false);

    // A map click opens the same county as a list click; direct URLs also work.
    await page.locator('#municipality-map [data-county="31"]').dispatchEvent('click');
    await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('body').getAttribute('data-county'), '31');
    assert.equal(await targets.count(), counties.get('31').count);
    await page.goto(base + '/geografi/kommuner.html?fylke=03');
    await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('body').getAttribute('data-county'), '03');
    assert((await targets.count()) > 1, 'Oslo opens an actual Oslo-and-surroundings quiz');
    assert.match(await page.locator('#targetName').textContent(), /Oslo.*omegn/i);
    assert(await page.locator('#states [data-state="Oslo"]').count());
    assert.equal(await targets.count(),54);
    for(const name of ['Sør-Odal','Kongsvinger'])assert.equal(await page.locator('#states [data-state="'+name+'"]').count(),1,name+' appears on the Oslo-area map');

    // Real mouse clicks still reach the land through the decorative hydrography.
    await page.locator('#start').click();
    await page.waitForFunction(()=>document.body.dataset.phase==='playing');
    const name = await nextName();
    const point = await page.locator('#states [data-state]').evaluateAll((elements, name) => {
      const element = elements.find(element => element.dataset.state === name), box = element.getBBox();
      for (let y = 1; y < 20; y++) for (let x = 1; x < 20; x++) {
        const point = new DOMPoint(box.x + box.width * x / 20, box.y + box.height * y / 20);
        if (element.isPointInFill(point)) {
          const screen = point.matrixTransform(element.getScreenCTM());
          const hit = document.elementFromPoint(screen.x, screen.y);
          if (hit?.closest('[data-state]') === element) return {x:screen.x, y:screen.y};
        }
      }
      return null;
    }, name);
    assert(point, 'The requested municipality has a clickable land area');
    await page.mouse.click(point.x, point.y);
    assert.equal(await page.locator('#completed').textContent(), '1');
    await advance();
    const beforeZoom = await page.locator('#map').getAttribute('viewBox');
    await page.evaluate(() => ClickMapZoom.zoom(1.5));
    assert.notEqual(await page.locator('#map').getAttribute('viewBox'), beforeZoom);
    await page.evaluate(() => ClickMapZoom.reset());

    await page.locator('.map-theme-toggle:visible').first().click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await checkMapHierarchy();
    assert.notEqual(await page.locator('#mapViewport').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(171, 210, 217)');
    await capture('oslo-dark');
    const seen=new Set([name]);
    for(let i=1;i<54;i++){const name=await nextName();seen.add(name);await choose(name);await advance();}
    assert.equal(await page.locator('body').getAttribute('data-phase'),'finished');
    for(const name of ['Sør-Odal','Kongsvinger'])assert(seen.has(name),name+' is asked and can be answered in the round');
    await page.reload();
    await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'Theme persists through direct county links');
    await page.locator('#kart-back').click();
    for (const viewport of [{width:390,height:844}, {width:844,height:390}]) {
      await page.setViewportSize(viewport);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal chooser overflow');
      await page.locator('#municipality-list [data-county="55"]').click();
      await page.locator('#start:enabled').waitFor();
      assert.equal(await targets.count(), counties.get('55').count);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal game overflow');
      const box = await page.locator('#mapViewport').boundingBox();
      assert(box.width > 100 && box.height > 100 && box.y + box.height <= viewport.height + 1, 'Map stays usable within the viewport');
      await page.locator('#start').click();
      await page.waitForFunction(()=>document.body.dataset.phase==='playing');
      const restart = await page.locator('#restart').boundingBox(), back = await page.locator('#kart-back').boundingBox();
      assert(restart.y + restart.height <= back.y + 1, 'Restart remains above choose-county');
      await capture('municipalities-' + viewport.width);
      await page.locator('#kart-back').click();
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
    assert(scoringRequests.length>0,'Municipality rounds use the highscore service');
    assert(scoringRequests.every(request=>request.url.includes('/session')&&request.body.game==='kommuner'&&counties.has(request.body.county)), 'Municipality rounds always select their own county leaderboard');
    console.log('PASS municipality chooser: 15 counties, 357 municipalities, linked hover/focus, map/list navigation and Oslo surroundings');
    console.log('PASS shared municipality game: full round, coloured retry, hydrography, mouse answers, zoom, persistent dark mode and mobile controls');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
