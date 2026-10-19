const fs = require('fs'),
  path = require('path'),
  http = require('http'),
  assert = require('assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
  try {
    res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.js') ? 'text/javascript; charset=utf-8' : file.endsWith('.css') ? 'text/css' : 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (e) {
    res.statusCode = 404;
    res.end('missing');
  }
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await pw.chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE || undefined
  });
  const context = await browser.newContext();
  const errors = [],
    requests = [],
    payloads = [];
  let current = '';
  context.on('page', p => p.on('pageerror', e => errors.push([current, e.message])));
  await context.route('**/*', async r => {
    const u = r.request().url();
    if (u.includes('cdnjs.cloudflare.com/ajax/libs/pdf.js/')) return r.fulfill({
      contentType: 'application/javascript',
      body: 'window.pdfjsLib={GlobalWorkerOptions:{}};'
    });
    if (u.includes('static.cloudflareinsights.com/beacon.min.js')) {
      requests.push([current, u]);
      return r.fulfill({
        contentType: 'application/javascript',
        body: process.env.CF_BEACON_SOURCE ? fs.readFileSync(process.env.CF_BEACON_SOURCE, 'utf8') : 'window.__testBeaconLoads=(window.__testBeaconLoads||0)+1;'
      });
    }
    if (u.includes('/cdn-cgi/rum')) {
      payloads.push([current, r.request().postData()]);
      return r.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*'
        }
      });
    }
    if (!u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:')) return r.abort();
    return r.continue();
  });
  const page = await context.newPage();
  const routes = JSON.parse(fs.readFileSync(path.join(root, 'assets/geography/routes.js'), 'utf8').match(/window.GEO_QUIZ_ROUTES=([\s\S]*);/)[1]);
  const report = [];
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(30000);
  let dialogAnswer = null;
  page.on('dialog', d => dialogAnswer === null ? d.dismiss() : d.accept(dialogAnswer));
  for (const [mode, [file]] of Object.entries(routes)) {
    current = file;
    const before = payloads.length;
    await page.goto(base + file);
    await page.waitForTimeout(250);
    const info = await page.evaluate(() => ({
      active: [...document.querySelectorAll('.quiz-mode-content.active')].map(e => e.id),
      text: document.querySelector('.quiz-mode-content.active')?.innerText.slice(0, 160),
      frames: [...document.querySelectorAll('iframe')].map(e => e.src),
      beacons: document.querySelectorAll('script[src*="beacon.min.js"]').length
    }));
    if (info.frames.length && mode !== 'openguessr') {
      await page.frameLocator('#maplab-frame').locator('#' + mode + '.active').waitFor({
        timeout: 5000
      });
      info.mapActive = mode;
    } else assert.deepEqual(info.active, ['quiz-' + mode]);
    assert.equal(info.beacons, 1);
    if (process.env.CF_BEACON_SOURCE) {
      const events = payloads.slice(before).map(([, body]) => JSON.parse(body));
      const visits = events.filter(event => event.eventType === 1 && new URL(event.location).pathname === '/' + file);
      assert.equal(visits.length, 1, file + ' must emit exactly one pageview for its own path');
      assert.equal(visits[0].siteToken, '1b3cf01bc1c645a99f02736c18c9ab78');
      assert.equal(await page.evaluate(() => window.__cfBeacon.spa), false);
      if (info.frames.length && mode !== 'openguessr') assert.equal(await page.frameLocator('#maplab-frame').locator('script[src*="beacon.min.js"]').count(), 0);
    }
    console.log('PASS quiz and analytics path', file);
    report.push({
      file,
      ...info
    });
  }
  current = 'geografi.html';
  await page.goto(base + 'geografi.html#verden-quiz');
  assert.equal(await page.locator('.geoquiz-mode-row').count(), 14);
  assert.equal(await page.locator('.quiz-mode-content').count(), 0);
  await page.locator('.geoquiz-mode-row', {
    hasText: 'Flaggquiz'
  }).click();
  await page.waitForURL('**/geografi-flaggquiz.html');
  await page.goBack();
  assert.equal(await page.locator('#verden-quiz').evaluate(e => e.classList.contains('active')), true);
  for (const target of [...Object.keys(routes), ...Object.keys(routes).map(mode => 'quiz-' + mode), 'worldle', 'wordle', 'geowiz', 'flaggquiz']) {
    current = 'legacy-' + target;
    await page.goto(base + 'geografi.html#' + target);
    await page.waitForURL(url => Object.values(routes).some(([file]) => url.pathname.endsWith('/' + file)));
    assert.equal(await page.locator('.quiz-page-back').getAttribute('href'), 'geografi.html#verden-quiz');
    console.log('PASS legacy link', target);
  }
  for (const [key, value, file] of [['quiz','flags','geografi-flaggquiz.html'],['mode','worldle','geografi-worldle.html'],['tab','globle','geografi-globle.html']]) {
    await page.goto(base + 'geografi.html?' + key + '=' + value);
    await page.waitForURL('**/' + file);
  }
  for (const section of ['verden-land', 'verden-landformer', 'klima-oppvarming', 'demografi-pyramider']) {
    await page.goto(base + 'geografi.html#' + section);
    assert.equal(await page.locator('#' + section).evaluate(e => e.classList.contains('active')), true);
  }
  await page.goto(base + 'geografi.html#coordinates');
  await page.frameLocator('#maplab-frame').locator('#coordinates.active').waitFor({
    timeout: 5000
  });
  // Real interaction and scoring, using synthetic local-only data.
  await page.goto(base + 'geografi-flaggquiz.html');
  await page.evaluate(() => localStorage.setItem('geoHighscoresV1', JSON.stringify({
    'flags|world': [{
      name: 'QA_ONLY_NAME',
      rank: [100],
      scoreText: '100 på rad',
      timeSec: 10
    }]
  })));
  await page.reload();
  await page.getByRole('button', {
    name: '🏆 Topp 5 (hele verden)',
    exact: true
  }).click();
  assert.match(await page.locator('#geo-hs-body').innerText(), /QA_ONLY_NAME/);
  await page.evaluate(() => geoHsClose());
  await page.getByRole('button', {
    name: 'Start',
    exact: true
  }).click();
  assert.equal(await page.locator('.world-card').count(), 1);
  await page.getByRole('button', {
    name: await page.evaluate(() => worldTrainerState.current.answerText),
    exact: true
  }).click();
  assert.equal(await page.evaluate(() => worldTrainerState.score), 1);
  dialogAnswer = 'QA_ONLY_NAME_SAVED';
  await page.evaluate(() => endWorldTrainer('QA complete', false));
  dialogAnswer = null;
  assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem('geoHighscoresV1'))['flags|world'].some(r => r.name === 'QA_ONLY_NAME_SAVED')));
  for (const [mode, file] of [['capitals', 'geografi-hovedstadsquiz.html'], ['flagcapital', 'geografi-flagg-og-hovedstad.html'], ['places', 'geografi-stedsquiz.html']]) {
    await page.goto(base + file);
    await page.getByRole('button', {
      name: 'Start',
      exact: true
    }).click();
    assert.equal(await page.locator('.world-card').count(), 1);
    console.log('PASS start', mode);
  }
  await page.goto(base + 'geografi-landquiz.html');
  await page.locator('.country-region-btn').first().click();
  assert.ok((await page.locator('#country-map-input').count()) || (await page.locator('#country-guess').count()));
  await page.goto(base + 'geografi-geowiz.html');
  await page.locator('#geo-start-button').click();
  assert.equal(await page.locator('#geo-map-stage').count(), 1);
  console.log('PASS GeoWiz start');
  await page.goto(base + 'geografi-jeopardy.html');
  assert.ok(await page.evaluate(() => jeopardyCategories.every(c => makeJeopardyQuestions(c).length === 5)), 'Every Jeopardy category has five questions');
  await page.locator('#jeopardy-category-picker input').nth(0).check();
  await page.locator('#jeopardy-category-picker input').nth(1).check();
  await page.locator('#jeopardy-category-picker input').nth(2).check();
  await page.locator('[onclick="startJeopardyGame()"]').click();
  assert.ok((await page.locator('.jeopardy-value').count()) > 0);
  await page.locator('.jeopardy-value').first().click();
  await page.getByRole('button', {
    name: 'Vis fasit',
    exact: true
  }).click();
  console.log('PASS Jeopardy question/answer');
  // Mobile layouts and screenshot evidence.
  await page.setViewportSize({
    width: 390,
    height: 844
  });
  const mobile = [];
  for (const [mode, [file]] of Object.entries(routes)) {
    await page.goto(base + file);
    await page.waitForTimeout(150);
    const layout = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: innerWidth,
      back: document.querySelector('.quiz-page-back').getBoundingClientRect().toJSON()
    }));
    mobile.push({
      file,
      ...layout
    });
    assert.ok(layout.scroll <= layout.width, file + ' overflows on mobile');
    assert.ok(layout.back.x >= 0 && layout.back.right <= 390);
    if (mode === 'flags') {
      assert.ok(await page.locator('.world-setup h3').evaluate(e => e.getBoundingClientRect().top >= 48));
    }
    console.log('PASS mobile', file, layout.scroll);
  }
  const subjects = ['index.html', 'fysikk1.html', 'fysikk2.html', 'naturfag.html', 'matematikk.html', 'matematikk_phi.html', 'irrasjonal.html', 'mandelbrot.html', 'klassekart.html', 'puggenavn.html', 'jobb/index.html', 'data/fysikk2/nuklidekart.html'];
  for (const file of subjects) {
    current = file;
    await page.goto(base + file);
    await page.waitForTimeout(200);
    assert.equal(await page.locator('script[src*="beacon.min.js"]').count(), 1);
    console.log('PASS analytics', file);
  }
  current = 'privacy';
  await page.goto(base + 'geografi-flaggquiz.html?kandidat=QA_ONLY_CANDIDATE#QA_ONLY_ANSWER');
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    const s = document.createElement('script');
    s.src = 'assets/analytics.js';
    document.head.append(s);
  });
  await page.waitForTimeout(100);
  assert.equal(await page.locator('script[src*="beacon.min.js"]').count(), 1);
  await page.goto(base + 'index.html');
  if (process.env.CF_BEACON_SOURCE) assert.ok(payloads.length > 0);
  for (const [, p] of payloads) {
    assert.ok(!/QA_ONLY_(NAME|CANDIDATE|ANSWER)/.test(p));
  }
  await page.setViewportSize({
    width: 1365,
    height: 900
  });
  await page.goto(base + 'geografi-worldle.html');
  await page.locator('#worldle-answer').fill(await page.evaluate(() => worldTrainerState.target.country));
  await page.locator('.worldle-guess-btn').click();
  assert.match(await page.locator('#worldle-feedback').innerText(), /riktig/i);
  await page.goto(base + 'geografi-statle.html');
  await page.locator('#statle-answer').fill('not-a-state');
  await page.locator('#statle-answer').press('Enter');
  assert.ok((await page.locator('#statle-feedback').innerText()).length > 0);
  await page.goto(base + 'geografi-geowiz.html');
  await page.locator('#geo-start-button').click();
  await page.locator('#geo-map-stage').click({
    position: {
      x: 90,
      y: 90
    }
  });
  assert.equal(await page.evaluate(() => geoGuessrState.answered), true);
  await page.goto(base + 'geografi-globle.html');
  await page.frameLocator('#maplab-frame').locator('#globleStartRandom').click();
  await page.frameLocator('#maplab-frame').locator('#globleGuess').fill('Norge');
  await page.frameLocator('#maplab-frame').locator('#globleCountryMenu [data-country="Norge"]').click();
  await page.frameLocator('#maplab-frame').locator('#globleSubmit').click();
  assert.ok((await page.frameLocator('#maplab-frame').locator('#globleFeedback').innerText()).length > 0);
  await page.goto(base + 'geografi-travle.html');
  await page.frameLocator('#maplab-frame').locator('#travleHintNext').click();
  await page.goto(base + 'geografi-tradle.html');
  await page.frameLocator('#maplab-frame').locator('#tradleNew').click();
  await page.goto(base + 'geografi-geogrid.html');
  await page.frameLocator('#maplab-frame').locator('#geogridNew').click();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({
    quizPages: report.length,
    errors,
    beaconRequests: requests.length,
    payloads: payloads.length
  }));
  await browser.close();
  server.close();
})().catch(e => {
  console.error(e);
  server.close();
  process.exit(1);
});
