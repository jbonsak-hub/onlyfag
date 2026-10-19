const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
assert.ok(process.env.CF_BEACON_SOURCE, 'Set CF_BEACON_SOURCE to the original public Cloudflare script');
const beacon = fs.readFileSync(process.env.CF_BEACON_SOURCE, 'utf8');
// Emulate the production host's extensionless HTML aliases and directory indexes.
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.join(root, pathname);
  if (pathname.endsWith('/')) file = path.join(file, 'index.html');
  else if (!path.extname(file)) file += '.html';
  try {
    res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.js') ? 'text/javascript; charset=utf-8' : file.endsWith('.css') ? 'text/css' : 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch {
    res.writeHead(404).end('missing');
  }
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await pw.chromium.launch({headless: true, executablePath: process.env.BROWSER_EXECUTABLE || undefined});
  try {
    const context = await browser.newContext();
    const events = [], errors = [];
    await context.route('**/*', async route => {
      const u = route.request().url();
      if (u.includes('static.cloudflareinsights.com/beacon.min.js')) return route.fulfill({contentType: 'application/javascript', body: beacon});
      if (u.includes('/cdn-cgi/rum')) {
        const event = JSON.parse(route.request().postData());
        assert.ok(!/QA_ONLY_(NAME|CANDIDATE|ANSWER)/.test(JSON.stringify(event)));
        events.push(event);
        return route.fulfill({status: 204, headers: {'access-control-allow-origin': '*'}});
      }
      if (!u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:')) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(30000);
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/naturfag.html');
    await page.evaluate(() => localStorage.setItem('onlyfagCanonicalQa', 'QA_ONLY_NAME'));
    const quizPaths = Object.values(JSON.parse(fs.readFileSync(path.join(root, 'assets/geography/routes.js'), 'utf8').match(/window.GEO_QUIZ_ROUTES=([\s\S]*);/)[1])).map(([file]) => '/' + file);
    const htmlPaths = ['/naturfag.html', '/fysikk1.html', '/fysikk2.html', '/matematikk.html', '/matematikk_phi.html', '/irrasjonal.html', '/mandelbrot.html', '/klassekart.html', '/geografi.html', '/data/fysikk2/nuklidekart.html', ...quizPaths];
    const cases = [
      ...htmlPaths.map(file => [file.slice(0, -5), file]),
      ['/naturfag.html', '/naturfag.html'],
      ['/index', '/'], ['/index.html', '/'],
      ['/jobb/index', '/jobb/'], ['/jobb/index.html', '/jobb/']
    ];
    for (const [alias, canonical] of cases) {
      // Finish the preceding document's Web Vitals before resetting the event window.
      await page.goto('about:blank');
      const before = events.length;
      const suffix = '?kandidat=QA_ONLY_CANDIDATE#QA_ONLY_ANSWER';
      await page.goto(base + alias + suffix);
      // Some existing modules replace unknown fragments with their default tab.
      await page.waitForURL(url => url.pathname === canonical && url.search === '?kandidat=QA_ONLY_CANDIDATE');
      await page.waitForFunction(() => !!window.__cfBeacon);
      await page.waitForTimeout(250);
      const visits = events.slice(before).filter(e => e.eventType === 1);
      assert.equal(visits.length, 1, alias + ' must send exactly one pageview');
      assert.equal(new URL(visits[0].location).pathname, canonical);
      assert.equal(visits[0].siteToken, '1b3cf01bc1c645a99f02736c18c9ab78');
      assert.equal(await page.locator('script[src*="beacon.min.js"]').count(), 1);
      assert.equal(await page.evaluate(() => localStorage.getItem('onlyfagCanonicalQa')), 'QA_ONLY_NAME');
      if (canonical === '/naturfag.html') {
        assert.equal(new URL(page.url()).hash, '#QA_ONLY_ANSWER');
        assert.match(await page.title(), /Naturfag/);
        assert.ok(await page.locator('button').count() > 0);
      }
      console.log('PASS canonical analytics', alias, '->', canonical);
    }
    // Legacy quiz routing takes priority and must not record the geography page.
    await page.goto('about:blank');
    const before = events.length;
    await page.goto(base + '/geografi#worldle');
    await page.waitForURL(base + '/geografi/worldle.html');
    await page.waitForFunction(() => !!window.__cfBeacon);
    await page.waitForTimeout(250);
    assert.deepEqual(events.slice(before).filter(e => e.eventType === 1).map(e => new URL(e.location).pathname), ['/geografi/worldle.html']);
    assert.deepEqual(errors, []);
    console.log('PASS legacy quiz priority; query/hash privacy; persistent storage; no page errors');
    console.log(JSON.stringify({canonicalCases: cases.length, errors}));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => server.close());
