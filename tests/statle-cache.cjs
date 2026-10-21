// Real browser HTTP cache: reproduce PR #6 assets combined with PR #7 HTML,
// then verify the new asset URLs recover without clearing the browser cache.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
cp.execFileSync(process.execPath, [path.join(root, 'scripts/build-statle-assets.cjs'), '--check']);
const prior = file => cp.execFileSync('git', ['show', '297cada8da3be2924f278f2db22a9f3ccac4a496:' + file], {cwd:root, maxBuffer:2000000});
const oldHtml = prior('geografi/statle.html');
const oldAssets = new Map(['css', 'js'].map(ext => ['/assets/geography/statle.' + ext, prior('assets/geography/statle.' + ext)]));
const fixedHtml = fs.readFileSync(path.join(root, 'geografi/statle.html'), 'utf8');
const brokenHtml = fixedHtml.replace(/statle-assets\/statle-[a-f0-9]+\.(css|js)/g, 'statle.$1');
let stage = 'old';
const requests = [], errors = [];
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  requests.push({stage, pathname});
  res.setHeader('Content-Type', pathname.endsWith('.js') ? 'text/javascript' : pathname.endsWith('.css') ? 'text/css' : pathname.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', pathname.endsWith('.html') ? 'no-store' : 'public, max-age=14400');
  if (pathname === '/geografi/statle.html') return res.end(stage === 'old' ? oldHtml : stage === 'broken' ? brokenHtml : fixedHtml);
  if (pathname === '/assets/analytics.js') return res.end('/* no analytics test visits */');
  if (stage === 'old' && oldAssets.has(pathname)) return res.end(oldAssets.get(pathname));
  try { res.end(fs.readFileSync(path.join(root, pathname))); }
  catch { res.writeHead(404).end('missing'); }
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await pw.chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:643}});
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', e => errors.push({stage, message:e.message}));
    const base = 'http://127.0.0.1:' + server.address().port;
    const screenshots = process.env.STATLE_SCREENSHOT_DIR || require('node:os').tmpdir();
    await page.goto(base + '/geografi/statle.html?visit=old');
    await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('path.state').count(), 50);
    stage = 'broken';
    await page.goto(base + '/geografi/statle.html?visit=broken');
    await page.waitForTimeout(350);
    assert.equal(await page.locator('path.state').count(), 0, 'Old cached script must reproduce the reported blank map');
    assert.equal(await page.locator('#start').isDisabled(), true);
    assert.ok(errors.some(e => e.stage === 'broken' && /addEventListener/.test(e.message)));
    assert.equal(await page.locator('#geoMenuButton').evaluate(e => getComputedStyle(e).position), 'static');
    await page.screenshot({path:path.join(screenshots, 'statle-cache-broken.png')});
    stage = 'fixed';
    await page.goto(base + '/geografi/statle.html?visit=fixed');
    await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('path.state').count(), 50);
    assert.equal(await page.locator('#geoMenuButton').evaluate(e => getComputedStyle(e).position), 'fixed');
    assert.deepEqual(errors.filter(e => e.stage === 'fixed'), []);
    await page.locator('#start').click();
    const target = await page.locator('#targetName').innerText();
    await page.locator(`path.state[data-state="${target}"]`).dispatchEvent('click');
    assert.equal(await page.locator('#completed').innerText(), '1');
    await page.locator('#geoMenuButton').click();
    assert.equal(await page.locator('#geoMenu').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#geoMenu').isVisible(), false);
    await page.screenshot({path:path.join(screenshots, 'statle-cache-fixed.png')});
    for (const pathname of oldAssets.keys()) assert.equal(requests.filter(r => r.pathname === pathname).length, 1, 'Old asset must stay cached throughout the test');
    assert.equal(requests.filter(r => r.stage === 'fixed' && /statle-assets\/statle-[a-f0-9]+\.(css|js)$/.test(r.pathname)).length, 2);
    console.log(JSON.stringify({warmCacheFailureReproduced:true,recoveredWithoutCacheClear:true,states:50,score:true,menu:true,fixedErrors:[]}));
  } finally { await browser.close(); }
})().catch(e => {console.error(e);process.exitCode=1;}).finally(() => server.close());
