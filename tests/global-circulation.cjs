/* Browser regression checks for the progressive circulation model. */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:58390';
const screenshots=process.env.SCREENSHOT_DIR;
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
  const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  const capture=async name=>{if(screenshots){await fs.mkdir(screenshots,{recursive:true});await page.screenshot({path:path.join(screenshots,name+'.png'),fullPage:true});}};
  await page.goto(base+'/geografi/global-sirkulasjon.html');
  await page.locator('#land').waitFor({state:'attached'});
  assert.ok((await page.locator('#land').getAttribute('d')).length>10000,'real geographical surface is present locally');
  assert.equal(await page.getByRole('tab').count(),5);
  assert.equal(await page.locator('.solar-beam').count(),2,'equal-width solar bundles');
  assert.equal(await page.getByRole('button',{name:/spill.*nytt/i}).count(),0,'no meaningless replay control');
  await page.getByRole('button',{name:'Neste →'}).click();
  assert.equal(await page.locator('.cell-group').count(),4,'one cell per hemisphere shown at two limbs');
  assert.equal(await page.locator('.cell-flow').count(),8,'warm and cool branches remain separate');
  assert.ok((await page.locator('#figure-legend').textContent()).includes('Kjøligere luft tilbake ved bakken'));
  assert.equal(await page.locator('.cell-ribbon').count(),0,'smooth closed circulation replaces annular ribbons');
  const assertLowerDirections=async()=>{
    const lower=await page.locator('.cell-flow[data-branch="lower"]').evaluateAll(paths=>paths.map(path=>{
      const start=path.getPointAtLength(0).matrixTransform(path.getCTM()),end=path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getCTM());
      return {family:path.closest('.cell-group').dataset.family,north:path.closest('.cell-group').dataset.hemisphere==='north',dy:end.y-start.y};
    }));
    for(const branch of lower){
      const northward=branch.family==='ferrel';
      const expectedPositive=branch.north?!northward:northward;
      assert.equal(branch.dy>0,expectedPositive,`${branch.family} lower branch moves ${northward?'poleward':'equatorward'} on ${branch.north?'northern':'southern'} hemisphere`);
    }
    for(const d of await page.locator('.cell-flow').evaluateAll(paths=>paths.map(path=>path.getAttribute('d')))){
      assert.ok(d.includes('C')&&!/[LA]/.test(d),'cell branches use rounded Bézier curves without straight radial corners');
    }
  };
  await assertLowerDirections();
  await capture('circulation-one-cell');
  await page.getByRole('tab',{name:'3 Tre celler'}).click();
  for(const id of ['hadley','ferrel','polar'])assert.equal(await page.locator(`.cell-group[data-family="${id}"]`).count(),4);
  await assertLowerDirections();
  assert.equal(await page.locator('.cell-particle animateMotion').count(),24,'particles follow both branches of the three cell families');
  await page.locator('[data-focus="hadley"]').click();
  assert.equal(await page.locator('[data-focus="hadley"]').getAttribute('aria-pressed'),'true');
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.cell-group[data-family="polar"]')).opacity)<.2);
  await page.locator('[data-focus="hadley"]').click();
  assert.equal(await page.locator('[data-focus="hadley"]').getAttribute('aria-pressed'),'false');
  await capture('circulation-three-cells');
  await page.getByRole('tab',{name:'4 Trykk og klima'}).click();
  assert.deepEqual(await page.locator('.pressure-symbol').allTextContents(),['H','L','H','L','H','L','H']);
  assert.equal(await page.locator('.cloud').count(),6);
  const polarSpacing=await page.locator('.pressure-badge').evaluateAll(els=>Math.abs(Number(els[0].getAttribute('cy'))-Number(els[1].getAttribute('cy'))));
  assert.ok(polarSpacing>34,'polar H and subpolar L badges do not overlap');
  await capture('circulation-pressure-climate');
  await page.getByRole('tab',{name:'5 Vindbelter'}).click();
  assert.equal(await page.locator('.wind-group').count(),6);
  assert.equal(await page.locator('.wind-arrow').count(),18);
  const deflected=await page.locator('.wind-group[data-family="hadley"]').first().locator('.wind-arrow').nth(1).getAttribute('d');
  const points=deflected.match(/-?\d+(?:\.\d+)?/g).map(Number);
  assert.ok(points[4]<points[0]&&points[5]>points[1],'northern trade wind points westward and toward equator');
  await page.locator('#coriolis').click();
  assert.equal(await page.locator('#coriolis').getAttribute('aria-pressed'),'false');
  assert.notEqual(await page.locator('.wind-group[data-family="hadley"]').first().locator('.wind-arrow').nth(1).getAttribute('d'),deflected);
  await page.locator('#coriolis').click();
  await page.locator('#motion').click();
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('is-paused')),true);
  assert.equal(await page.locator('#earth').evaluate(el=>el.animationsPaused()),true);
  await page.locator('#motion').click();
  assert.equal(await page.locator('#earth').evaluate(el=>el.animationsPaused()),false);
  await page.getByRole('tab',{name:'5 Vindbelter'}).focus();
  await page.keyboard.press('Home');
  assert.equal(await page.locator('#step-0').getAttribute('aria-selected'),'true');
  await page.keyboard.press('End');
  assert.equal(await page.locator('#step-4').getAttribute('aria-selected'),'true');
  await page.locator('#theme').click();
  assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('dark')));
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(22, 41, 33)','dark text has a dark page surface');
  await capture('circulation-winds-dark');
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:844});
    for(const id of [0,1,2,3,4]){
      await page.locator('#step-'+id).click();
      assert.ok(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth+1),`no horizontal scrolling at ${width}px, step ${id+1}`);
      assert.ok(await page.locator('#earth').isVisible());
      await page.locator('#next').scrollIntoViewIfNeeded();
      assert.ok(await page.locator('#next').isVisible());
      if(width===390&&(id===1||id===2))await capture('circulation-mobile-step-'+(id+1));
    }
    if(width===390)await capture('circulation-mobile');
  }
  const reduced=await browser.newPage({reducedMotion:'reduce'});
  await reduced.goto(base+'/geografi/global-sirkulasjon.html');
  assert.equal(await reduced.locator('#motion').getAttribute('aria-pressed'),'true');
  assert.equal(await reduced.locator('#earth').evaluate(el=>el.animationsPaused()),true);
  await page.setViewportSize({width:1365,height:643});
  await page.goto(base+'/geografi.html#klima-fagstoff');
  await page.waitForFunction(()=>typeof showContent==='function');
  assert.equal(await page.locator('#global-circulation-frame').getAttribute('src'),null,'inactive module is lazy-loaded');
  await page.evaluate(()=>showContent('klima-sirkulasjon',null));
  const embedded=page.frameLocator('#global-circulation-frame');
  await embedded.locator('#earth .globe').waitFor();
  await page.locator('#dark-mode-toggle').click();
  await page.waitForFunction(()=>document.getElementById('global-circulation-frame').contentDocument.body.classList.contains('dark')===document.body.classList.contains('dark-mode'));
  await page.evaluate(()=>showContent('klima-fagstoff',null));
  await page.waitForFunction(()=>document.getElementById('global-circulation-frame').contentDocument.getElementById('earth').animationsPaused());
  await page.evaluate(()=>showContent('klima-sirkulasjon',null));
  await page.waitForFunction(()=>!document.getElementById('global-circulation-frame').contentDocument.getElementById('earth').animationsPaused());
  await embedded.locator('#step-3').click();
  await capture('circulation-embedded-desktop');
  await page.setViewportSize({width:390,height:844});
  await embedded.locator('#step-4').click();
  await page.waitForFunction(()=>{const f=document.getElementById('global-circulation-frame');return Math.abs(f.clientHeight-f.contentDocument.querySelector('.circulation').getBoundingClientRect().height)<3;});
  assert.ok(await page.locator('#global-circulation-frame').evaluate(el=>el.contentDocument.body.scrollWidth<=el.clientWidth+1),'embedded mobile content does not overflow horizontally');
  await capture('circulation-embedded-mobile');
  await embedded.locator('#back').click();
  assert.equal(await page.locator('#klima-fagstoff').evaluate(el=>el.classList.contains('active')),true,'model back link returns to weather material');
  assert.deepEqual(errors,[]);
  await browser.close();
  console.log('Global circulation: five steps, geography, physical directions, emphasis, keyboard, pause, reduced motion, mobile layouts, lazy host loading, host theme and back navigation passed.');
})().catch(error=>{console.error(error);process.exit(1);});
