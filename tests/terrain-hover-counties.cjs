/* Complete terrain outlines and the county basemap; public services stay mocked. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const countyNames=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/norway-counties.json'),'utf8')).map(row=>row.n).sort();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((request,response)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep))return response.writeHead(403).end();
  try{response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');response.end(fs.readFileSync(file));}
  catch{response.writeHead(404).end();}
});
const cases=[
  {name:'europe',url:'/geografi/kart.html?region=europe',count:47,hover:['Tyskland','Frankrike']},
  {name:'states',url:'/geografi/statle.html',count:50,hover:['Texas','Alaska']},
  {name:'municipalities',url:'/geografi/kommuner.html?fylke=39',count:6,hover:['Tønsberg','Sandefjord']},
  {name:'oslo',url:'/geografi/oslo-bydeler.html',count:43,hover:['Østensjø','Østmarka','Nøklevann']},
  {name:'counties',url:'/geografi/fylker.html',count:15,hover:['Innlandet','Vestland'],counties:true},
  {name:'kart-counties',url:'/geografi/kart.html?region=fylker',count:15,hover:['Innlandet','Vestland'],counties:true}
];
async function frames(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function capture(page,name){
  if(!process.env.TERRAIN_HOVER_SCREENSHOTS)return;
  fs.mkdirSync(process.env.TERRAIN_HOVER_SCREENSHOTS,{recursive:true});
  await page.screenshot({path:path.join(process.env.TERRAIN_HOVER_SCREENSHOTS,name+'.png')});
}
// The exact source path and its complete screen matrix prove that each border,
// island and hole is repeated, including paths inside fitted US/county groups.
// Paint order then proves neighbouring target and shared-border layers cannot
// paint over any part of that repeated outline.
async function outlineReport(page,name){
  return page.evaluate(name=>{
    const source=[...document.querySelectorAll('#states path.state')].find(el=>el.dataset.state===name);
    const layer=document.querySelector('#terrain-hover-outline'),paths=[...(layer?.querySelectorAll('path')||[])];
    const copy=paths.find(el=>el.getAttribute('d')===source?.getAttribute('d'));
    if(!source||!layer||!copy)return {name,error:'Missing complete source geometry in the front outline',source:!!source,layer:!!layer,paths:paths.length};
    const matrix=el=>{const m=el.getScreenCTM();return m&&['a','b','c','d','e','f'].map(key=>m[key]);};
    const a=matrix(source),b=matrix(copy),style=getComputedStyle(copy),groupStyle=getComputedStyle(layer);
    const stroke=style.stroke.match(/[\d.]+/g)?.map(Number)||[];
    const geometryLayers=[document.querySelector('#states'),...document.querySelectorAll('.municipality-boundaries')].filter(Boolean);
    return {name,paths:paths.length,hovered:source.classList.contains('hovered'),sameMatrix:!!a&&!!b&&a.every((n,i)=>Math.abs(n-b[i])<.01),
      aboveGeometry:geometryLayers.every(el=>!!(el.compareDocumentPosition(layer)&Node.DOCUMENT_POSITION_FOLLOWING)),
      passive:groupStyle.pointerEvents==='none'&&style.pointerEvents==='none'&&!layer.querySelector('[data-state],[tabindex]'),
      visible:style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)===1,
      solidLight:stroke.length>=3&&stroke.slice(0,3).every(channel=>channel>=220)&&(stroke.length<4||stroke[3]===1),
      width:parseFloat(style.strokeWidth),fill:style.fill,dash:style.strokeDasharray,filter:style.filter,
      vectorEffect:style.vectorEffect,mask:style.maskImage,clip:style.clipPath,
      hiddenFromAT:layer.getAttribute('aria-hidden')==='true'};
  },name);
}
function checkOutline(report,label){
  assert(!report.error,label+': '+JSON.stringify(report));
  for(const key of ['hovered','sameMatrix','aboveGeometry','passive','visible','solidLight','hiddenFromAT'])assert(report[key],label+' '+key+': '+JSON.stringify(report));
  assert(report.width>=1.5&&report.width<=3,label+' has a clear, restrained outline');
  assert.equal(report.fill,'none',label+' does not obscure terrain');
  assert.equal(report.dash,'none',label+' highlights the complete border continuously');
  assert.equal(report.filter,'none',label+' does not use a clipped shadow as its border');
  assert.equal(report.vectorEffect,'non-scaling-stroke',label+' outline width is stable while zooming');
  assert.equal(report.mask,'none',label+' is not partially masked');
  assert.equal(report.clip,'none',label+' is not partially clipped');
}
async function clearOutline(page){
  await page.mouse.move(2,2);
  await page.evaluate(()=>document.activeElement?.blur());
  await page.waitForFunction(()=>!document.querySelector('#terrain-hover-outline path'));
}
async function realHover(page,name){
  await clearOutline(page);
  const point=await page.evaluate(name=>{
    const el=[...document.querySelectorAll('#states path.state')].find(el=>el.dataset.state===name);
    if(!el)return null;
    const box=el.getBBox(),viewport=document.querySelector('#mapViewport').getBoundingClientRect();
    const samples=[10,9,11,8,12,7,13,6,14,5,15,4,16,3,17,2,18,1,19];
    for(const y of samples)for(const x of samples){
      const local=new DOMPoint(box.x+box.width*x/20,box.y+box.height*y/20);
      if(!el.isPointInFill(local))continue;
      const p=local.matrixTransform(el.getScreenCTM());
      if(p.x<viewport.left+3||p.x>viewport.right-3||p.y<viewport.top+3||p.y>viewport.bottom-3)continue;
      if(document.elementFromPoint(p.x,p.y)?.closest('[data-state]')?.dataset.state===name)return {x:p.x,y:p.y};
    }
    return null;
  },name);
  assert(point,name+' has an exposed, real land/water pointer target');
  await page.mouse.move(point.x,point.y);
  await page.waitForFunction(name=>[...document.querySelectorAll('#states .state.hovered')].some(el=>el.dataset.state===name),name);
  checkOutline(await outlineReport(page,name),'Mouse hover '+name);
}
async function checkEveryFocus(page,label){
  await clearOutline(page);
  const names=await page.locator('#states path.state').evaluateAll(els=>els.map(el=>el.dataset.state));
  // Each focus is a native SVG focus transition, not a hand-dispatched event.
  for(const name of names){
    await page.evaluate(name=>[...document.querySelectorAll('#states path.state')].find(el=>el.dataset.state===name).focus({preventScroll:true}),name);
    checkOutline(await outlineReport(page,name),label+' keyboard '+name);
  }
  const markers=await page.locator('#smallStates .small-marker[data-state]').evaluateAll(els=>els.map(el=>el.dataset.state));
  for(const name of new Set([markers[0],markers.at(-1)].filter(Boolean))){
    await page.evaluate(name=>[...document.querySelectorAll('#smallStates .small-marker[data-state]')].find(el=>el.dataset.state===name).focus({preventScroll:true}),name);
    checkOutline(await outlineReport(page,name),label+' extra target '+name);
  }
  await clearOutline(page);
}
async function checkBasemap(page,label){
  const images=await page.locator('.map-basemap-layer:not([hidden]) img').evaluateAll(els=>els.map(el=>({ready:el.complete&&el.naturalWidth>0&&el.naturalHeight>0,width:el.naturalWidth,height:el.naturalHeight,pointerEvents:getComputedStyle(el).pointerEvents,area:el.dataset.area})));
  assert(images.length&&images.every(image=>image.ready),label+' terrain images decode successfully');
  assert(images.every(image=>image.pointerEvents==='none'),label+' terrain imagery never steals answers');
  const camera=await page.evaluate(()=>{
    const svg=document.querySelector('#map'),world=document.querySelector('.map-basemap-world'),viewport=document.querySelector('#mapViewport');
    const m=svg.getScreenCTM(),w=new DOMMatrix(getComputedStyle(world).transform),r=viewport.getBoundingClientRect();
    // HTML world coordinates start at the viewport content box; SVG CTM uses
    // client coordinates. Their six values must otherwise be identical.
    const expected=[m.a,m.b,m.c,m.d,m.e-r.left-viewport.clientLeft+viewport.scrollLeft,m.f-r.top-viewport.clientTop+viewport.scrollTop];
    const actual=[w.a,w.b,w.c,w.d,w.e,w.f];
    return {expected,actual,above:parseFloat(getComputedStyle(svg).zIndex)>parseFloat(getComputedStyle(world.parentElement).zIndex)};
  });
  assert(camera.expected.every((n,i)=>Math.abs(n-camera.actual[i])<.03),label+' raster and answer shapes share the camera: '+JSON.stringify(camera));
  assert(camera.above,label+' answer geometry stays above the decoded terrain');
}
async function checkCountyRaster(page,label){
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/norway-county-relief.json'),'utf8'));
  const entry=manifest.regions.fylker.areas.main;
  const registration=await page.evaluate(entry=>{
    const image=document.querySelector('.map-basemap-layer:not([hidden]) img[data-area="main"]');
    const group=document.querySelector('#states path.state').parentElement,fit=group.transform.baseVal.consolidate().matrix;
    const actual=new DOMMatrix(getComputedStyle(image).transform);
    const expected=fit.translate(entry.bounds[0],entry.bounds[1]);
    return {sameImage:new URL(image.src).pathname.endsWith('/assets/geography/'+entry.image),
      dimensions:[image.naturalWidth,image.naturalHeight],
      sameTransform:['a','b','c','d','e','f'].every(key=>Math.abs(actual[key]-expected[key])<.001)};
  },entry);
  assert(registration.sameImage,label+' uses its own whole-county raster');
  assert(registration.sameTransform,label+' raster uses the identical county fit and source origin');
  assert.deepEqual(registration.dimensions,entry.pixelDimensions,label+' raster dimensions match its registration');
}
async function checkOslo(page){
  const widths=await page.evaluate(()=>{
    const width=selector=>[...document.querySelectorAll(selector)].map(el=>parseFloat(getComputedStyle(el).strokeWidth));
    return {lines:width('.municipality-border-line'),halos:width('.municipality-border-halo'),forest:width('#states .oslo-forest'),lakes:width('#states .oslo-lake')};
  });
  assert(widths.lines.length&&widths.lines.every(width=>width>0&&width<=1),'Oslo shared borders are thin: '+JSON.stringify(widths));
  assert(widths.halos.length&&widths.halos.every(width=>width>0&&width<=2.4),'Oslo shared-border halos are restrained');
  assert(widths.forest.length&&widths.forest.every(width=>width>0&&width<=1),'Oslo forest borders remain thin');
  assert(widths.lakes.length&&widths.lakes.every(width=>width>0&&width<=1),'Oslo lake borders remain thin');
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE}),errors=[],missing=[];
  try{
    for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
      const context=await browser.newContext({viewport});
      await context.addInitScript(dark=>localStorage.setItem('geoDarkMode',dark?'1':'0'),viewport.width<700);
      await context.route('**/*',route=>{
        const url=route.request().url();
        if(url.startsWith('https://onlyfag-geography-scores.jack-bonsak.workers.dev/'))return route.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"error":"unavailable"}'});
        return url.startsWith(base)||/^(data|blob):/.test(url)?route.continue():route.abort();
      });
      const page=await context.newPage();page.setDefaultTimeout(10000);
      page.on('pageerror',error=>errors.push(error.message));
      page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)missing.push(response.url());});
      for(const test of cases){
        const label=test.name+' '+viewport.width;
        await page.goto(base+test.url);await page.locator('#start:enabled').waitFor();
        assert.equal(await page.locator('#states path.state').count(),test.count,label+' preserves the quiz targets');
        if(test.counties)assert.deepEqual((await page.locator('#states path.state').evaluateAll(els=>els.map(el=>el.dataset.state))).sort(),countyNames,label+' preserves all 15 county geometries');
        await page.locator('#statle-basemap:enabled').click();
        await page.waitForFunction(()=>document.body.dataset.statleBasemap==='physical');
        await page.locator('.map-basemap-layer:not([hidden])').waitFor();await frames(page);
        await checkBasemap(page,label);if(test.name==='oslo')await checkOslo(page);
        if(test.counties)await checkCountyRaster(page,label);
        await checkEveryFocus(page,label);
        for(const name of test.hover)await realHover(page,name);
        await capture(page,label.replace(/ /g,'-'));
        if(test.counties){
          // A camera change catches a terrain layer that was only lined up at
          // the initial zoom. Restore via the actual camera before mouse tests.
          await clearOutline(page);
          await page.evaluate(()=>window.ClickMapZoom.zoom(1.25));
          await frames(page);await checkBasemap(page,label+' zoomed');
          await realHover(page,'Innlandet');
          await capture(page,label.replace(/ /g,'-')+'-zoomed');
        }
        await clearOutline(page);
        await page.locator('#statle-basemap').click();
        await page.waitForFunction(()=>document.body.dataset.statleBasemap==='original');
        assert.equal(await page.locator('.map-basemap-layer:not([hidden])').count(),0,label+' can return to the original map');
        await page.locator('#states path.state').first().focus();
        assert(await page.locator('#terrain-hover-outline path').evaluateAll(els=>els.every(el=>getComputedStyle(el).display==='none')),label+' keeps the bright front outline specific to physical maps');
        await clearOutline(page);
      }
      await context.close();
    }
    assert.deepEqual(errors,[],'No page errors');assert.deepEqual(missing,[],'Every local dependency loads');
    console.log('PASS physical hover/counties: complete front outlines for every country/state/local/county target, real mouse and keyboard, transformed insets, thin Oslo borders, decoded county terrain and a shared zoom camera on desktop/mobile');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
