/* Country quiz projection switching uses the same round, independent cameras. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((request,response)=>{
  try{
    const file=path.resolve(root,'.'+new URL(request.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep))return response.writeHead(403).end();
    response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    response.end(fs.readFileSync(file));
  }catch{response.writeHead(404).end();}
});
const artifactDir=process.env.COUNTRIES_GLOBE_SCREENSHOTS;
if(artifactDir)fs.mkdirSync(artifactDir,{recursive:true});
(async()=>{
  let browser;const errors=[];
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base='http://127.0.0.1:'+server.address().port;
    browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
    for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
      const context=await browser.newContext({viewport,hasTouch:viewport.width<700});
      await context.route('**/*',route=>{
        const url=route.request().url();
        if(url.startsWith(base+'/')||/^(data|blob):/.test(url))return route.continue();
        if(url.includes('onlyfag-geography-scores')&&url.includes('/scores?'))return route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"rows":[]}'});
        return route.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"error":"unavailable"}'});
      });
      const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
      async function round(){return page.evaluate(()=>{
        const s=worldTrainerState;
        return Object.fromEntries(['runId','regionId','regionNames','found','score','misses','answered','hints','startedAt','ended','endedAt'].map(key=>[key,s[key]]));
      });}
      async function paint(){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
      async function colors(){return page.evaluate(()=>{
        const c=document.getElementById('country-map-canvas'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        let found=0;for(let i=0;i<data.length;i+=4)if(data[i]===57&&data[i+1]===169&&data[i+2]===107&&data[i+3]===255)found++;
        return {found,total:c.width*c.height,corner:[...data.slice(0,4)]};
      });}
      async function checkControls(){
        const geometry=await page.locator('#country-map-projection-toggle').evaluate(group=>({
          innerWidth,scrollWidth:document.documentElement.scrollWidth,
          buttons:[...group.querySelectorAll('button')].map(button=>{
            const rect=button.getBoundingClientRect(),top=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
            return {width:rect.width,height:rect.height,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,reachable:button===top||button.contains(top)};
          })
        }));
        assert.ok(geometry.scrollWidth<=geometry.innerWidth+1,'no horizontal overflow');
        assert.equal(geometry.buttons.length,2);
        for(const button of geometry.buttons){
          assert.ok(button.left>=0&&button.right<=viewport.width&&button.top>=0&&button.bottom<=viewport.height,'projection buttons stay on screen');
          assert.ok(button.width>=40&&button.height>=32,'projection controls have usable hit areas');
          assert.equal(button.reachable,true,'projection controls are not covered by header or map layers');
        }
      }
      for(const region of ['world','europe','oceania']){
        await page.goto(base+'/geografi/landquiz.html');
        await page.evaluate(()=>localStorage.setItem('onlyfag-geography-panel-width','280'));
        await page.locator('[data-region="'+region+'"]').click();
        const canvas=page.locator('#country-map-canvas'),flat=page.locator('[data-country-projection="flat"]'),globe=page.locator('[data-country-projection="globe"]');
        await canvas.waitFor();await globe.waitFor();await paint();
        assert.equal(await page.evaluate(()=>worldTrainerState.mapProjection),'globe','3D is the default');
        assert.equal(await globe.getAttribute('aria-pressed'),'true');
        assert.equal(await page.getByRole('button',{name:'Zoom inn',exact:true}).count(),0);
        assert.equal(await page.getByRole('button',{name:'Zoom ut',exact:true}).count(),0);
        if(viewport.width>700)assert.equal(await page.locator('.country-map-bottom-bar,.country-map-side').evaluate(el=>Math.round(el.getBoundingClientRect().width)),425,'reference panel width is the default');
        await flat.click();await paint();
        const before=await round();
        const flatCamera=await page.evaluate(()=>({zoom:worldTrainerState.mapZoom,pan:worldTrainerState.mapPan.slice()}));
        await page.locator('#country-guess').fill('Delvis skrevet');
        await globe.focus();await globe.press('Enter');await paint();
        assert.equal(await page.evaluate(()=>worldTrainerState.mapProjection),'globe');
        assert.equal(await globe.getAttribute('aria-pressed'),'true');assert.equal(await flat.getAttribute('aria-pressed'),'false');
        assert.deepEqual(await round(),before,'changing projection never starts a new round or changes answers');
        assert.equal(await page.locator('#country-guess').inputValue(),'Delvis skrevet');
        assert.equal((await colors()).found,0,'the initial globe contains no found-country or Globle heat colors');
        const ocean=await page.evaluate(()=>{
          const s=worldTrainerState,rotation=s.globeRotation.slice();s.globeRotation=[30,0,0];drawCountryMap();
          const canvas=document.getElementById('country-map-canvas'),point=s.globeProjection([-32,-7]),ratio=canvas.width/canvas.getBoundingClientRect().width;
          const pixel=[...canvas.getContext('2d').getImageData(Math.round(point[0]*ratio),Math.round(point[1]*ratio),1,1).data].slice(0,3);
          const expected=document.body.classList.contains('dark-mode')?[38,63,73]:[207,229,237];
          s.globeRotation=rotation;drawCountryMap();return {pixel,expected};
        });
        assert.deepEqual(ocean.pixel,ocean.expected,'the Atlantic remains water, rather than the complement of a land polygon');
        await checkControls();
        if(artifactDir&&region==='world')await page.screenshot({path:path.join(artifactDir,'world-globe-neutral-'+viewport.width+'.png')});
        const initialRotation=await page.evaluate(()=>worldTrainerState.globeRotation.slice());
        const bounds=await canvas.boundingBox(),x=bounds.x+bounds.width*.5,y=bounds.y+bounds.height*.5;
        await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+60,y+24,{steps:5});await page.mouse.up();await paint();
        assert.notDeepEqual(await page.evaluate(()=>worldTrainerState.globeRotation),initialRotation,'dragging rotates the globe');
        const dragged=await page.evaluate(()=>worldTrainerState.globeRotation.slice());
        if(viewport.width<700){
          const touch=await context.newCDPSession(page);
          await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
          await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+35,y:y-18}]});
          await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();await paint();
          assert.notDeepEqual(await page.evaluate(()=>worldTrainerState.globeRotation),dragged,'touch dragging rotates too');
        }
        const zoom=await page.evaluate(()=>worldTrainerState.globeZoom);
        await page.mouse.move(x,y);await page.mouse.wheel(0,-200);await paint();
        assert.ok(await page.evaluate(value=>worldTrainerState.globeZoom>value,zoom),'wheel zoom enlarges the globe');
        const globeCamera=await page.evaluate(()=>({rotation:worldTrainerState.globeRotation.slice(),zoom:worldTrainerState.globeZoom}));
        const answer=region==='oceania'?'Australia':'Norge';
        await page.locator('#country-guess').fill(answer);await page.locator('#country-guess').press('Enter');
        await page.waitForFunction(answer=>worldTrainerState.found.some(country=>country.country===answer),answer);await paint();
        const centered=await page.evaluate(()=>{
          const s=worldTrainerState,canvas=document.getElementById('country-map-canvas'),r=canvas.getBoundingClientRect();
          const p=s.globeProjection(s.mapFocus);return {country:s.mapFocusCountry,dx:p[0]-r.width/2,dy:p[1]-r.height/2};
        });
        assert.equal(centered.country,answer);assert.ok(Math.abs(centered.dx)<1&&Math.abs(centered.dy)<1,'latest found country is centered on the globe');

        if(region!=='oceania'){
          await page.evaluate(()=>{worldTrainerState.globeRotation=[-10,-40,0];drawCountryMap();});await paint();
          const colored=await colors();
          assert.ok(colored.found>10,'correctly named Norway is visibly green on the globe');
          assert.ok(colored.found<colored.total*.1,'naming Norway colors only Norway, rather than its spherical complement');
          await page.evaluate(()=>{worldTrainerState.globeRotation=[170,40,0];drawCountryMap();});await paint();
          assert.equal((await colors()).found,0,'Norway is clipped away when it lies behind the globe');
          await page.evaluate(()=>{worldTrainerState.globeRotation=[-10,-40,0];drawCountryMap();});await paint();
        }
        const answered=await round();
        const answerRotation=await page.evaluate(()=>worldTrainerState.globeRotation.slice());
        await page.locator('#country-guess').fill('Neste land');
        await flat.click();await paint();
        assert.equal(await page.evaluate(()=>worldTrainerState.mapProjection),'flat');
        assert.deepEqual(await round(),answered);assert.equal(await page.locator('#country-guess').inputValue(),'Neste land');
        assert.deepEqual(await page.evaluate(()=>({zoom:worldTrainerState.mapZoom,pan:worldTrainerState.mapPan.slice()})),flatCamera,'globe gestures leave the 2D camera unchanged');
        assert.ok((await colors()).found>0,'the found country is green after returning to the 2D map');
        const flatCenter=await page.evaluate(()=>{const s=worldTrainerState,r=document.getElementById('country-map-canvas').getBoundingClientRect(),meta=countryMapCameraMeta(s,Math.round(r.width),Math.round(r.height)),p=countryMapProject(...s.mapFocus,Math.round(r.width),Math.round(r.height),meta);return [p[0]-r.width/2,p[1]-r.height/2];});
        assert.ok(flatCenter.every(value=>Math.abs(value)<1),'latest found country is centered on the 2D map too');

        await globe.click();await paint();
        assert.deepEqual(await round(),answered);
        assert.deepEqual(await page.evaluate(()=>worldTrainerState.globeRotation),answerRotation,'globe rotation survives toggling');
        assert.equal(await page.evaluate(()=>worldTrainerState.globeZoom),globeCamera.zoom,'globe zoom survives toggling');
        if(region!=='world'){
          await page.locator('#country-guess').fill('Brasil');await page.locator('#country-guess').press('Enter');
          assert.equal(await page.evaluate(()=>worldTrainerState.found.length),1,'globe mode still respects the chosen region');
          assert.match(await page.locator('#country-feedback').innerText(),/ikke et land i dette området/);
        }
        const light=await colors();await page.locator('.quiz-page-theme').click();await paint();
        const dark=await colors();assert.notDeepEqual(dark.corner,light.corner,'changing theme redraws the globe');
        assert.deepEqual(await round(),answered);await checkControls();
        if(artifactDir)await page.screenshot({path:path.join(artifactDir,region+'-globe-'+viewport.width+'.png')});
        if(region==='world'){
          for(const country of ['USA','Fiji','Kiribati']){
            await page.locator('#country-guess').fill(country);await page.locator('#country-guess').press('Enter');await paint();
            const focus=await page.evaluate(()=>{
              const s=worldTrainerState,r=document.getElementById('country-map-canvas').getBoundingClientRect(),p=s.globeProjection(s.mapFocus);
              return {country:s.mapFocusCountry,offset:[p[0]-r.width/2,p[1]-r.height/2]};
            });
            assert.equal(focus.country,country);assert.ok(focus.offset.every(value=>Math.abs(value)<1),country+': latest country centered including main landmass and small Pacific states');
            await flat.click();await paint();
            const offset=await page.evaluate(()=>{const s=worldTrainerState,r=document.getElementById('country-map-canvas').getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height),p=countryMapProject(...s.mapFocus,w,h,countryMapCameraMeta(s,w,h));return [p[0]-w/2,p[1]-h/2];});
            assert.ok(offset.every(value=>Math.abs(value)<1),country+': correct 2D center across the date line');
            await globe.click();await paint();
          }
          const camera=await page.evaluate(()=>worldTrainerState.globeRotation.slice());
          for(const duplicateOrWrong of ['Kiribati','Ikke et land']){
            await page.locator('#country-guess').fill(duplicateOrWrong);await page.locator('#country-guess').press('Enter');
            assert.deepEqual(await page.evaluate(()=>worldTrainerState.globeRotation),camera,'only newly marked countries recenter the view');
          }
        }
        await page.locator('.country-map-action.finish').click();await page.locator('#country-map-complete').waitFor();
        assert.equal(await page.evaluate(()=>worldTrainerState.ended),true);
        await page.locator('.country-map-result-btn').click();
        await page.waitForFunction(runId=>worldTrainerState.runId!==runId,answered.runId);await canvas.waitFor();
        assert.equal(await page.evaluate(()=>worldTrainerState.found.length),0,'replay resets answers');
        assert.notEqual((await round()).runId,answered.runId,'replay starts a new round');
        if(region==='world'&&viewport.width>700){
          const handle=page.getByRole('separator',{name:'Bredde på spillpanelet'});
          await handle.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
          await page.waitForFunction(()=>document.body.style.getPropertyValue('--q-panel')==='457px');
          assert.equal(await page.evaluate(()=>localStorage.getItem('onlyfag-countries-panel-width')),'457');
          assert.equal(await page.evaluate(()=>localStorage.getItem('onlyfag-geography-panel-width')),'280','resizing countries leaves other quiz preferences untouched');
          await page.reload();await page.locator('[data-region="world"]').click();await canvas.waitFor();
          assert.equal(await handle.getAttribute('aria-valuenow'),'457','explicit country panel preference survives reload');
          await handle.focus();await page.keyboard.press('Home');
          await page.waitForFunction(()=>document.body.style.getPropertyValue('--q-panel')==='425px');
        }

      }
      await context.close();
    }
    assert.deepEqual(errors,[],'no uncaught browser exceptions');
    console.log('PASS countries globe: neutral start, 2D/3D toggle, same round/input, found-country fills, drag/touch/zoom, regions, theme and replay at desktop/mobile widths.');
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
