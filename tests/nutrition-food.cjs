/* Real food photographs, nutrient choices and the external lookup, in the shared host. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 try{
  const filename=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!filename.startsWith(root+path.sep))return res.writeHead(403).end();
  res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');
  res.end(fs.readFileSync(filename));
 }catch{res.writeHead(404).end();}
});
const galleryIds=['protein-sources','doc-food-carbs','doc-essential-fat-sources'];
const lookupId='foodtable-vitamin-c-portions';
const screenshots=process.env.NUTRITION_FOOD_QA_DIR;
if(screenshots)fs.mkdirSync(screenshots,{recursive:true});
const escaped=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const option=(frame,value)=>frame.getByRole('button',{name:new RegExp('^'+escaped(value)+'(?:\\s*·.*)?$')});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const errors=[],overflows=[],metrics=[];
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  async function geometry(frame){return frame.evaluate(()=>({
   width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
   bounds:Object.fromEntries(['.prompt','.mini-figure','.visual-response','.answer-panel','.task-actions','.feedback','.task-reference'].map(selector=>{
    const r=document.querySelector(selector)?.getBoundingClientRect();
    return [selector,r&&r.width>0&&r.height>0?{left:r.left,top:r.top,right:r.right,bottom:r.bottom}:null];
   }))
  }));}
  function checkBounds(id,viewport,stage,g){
   const outside=Object.entries(g.bounds).filter(([,r])=>r&&(r.left<-.5||r.top<-.5||r.right>g.width+.5||r.bottom>g.height+.5));
   if(g.scrollWidth>g.width+1||g.scrollHeight>g.height+1||outside.length)overflows.push({id,viewport,stage,...g,outside});
  }
  async function answer(frame,q){
   if(q.type==='choice'||q.type==='multi'){
    for(const value of q.type==='choice'?[q.answer]:q.answer)await option(frame,value).click();
   }else if(['match','sort','fill'].includes(q.type)){
    const values=q.type==='match'?q.pairs.map(pair=>pair.right):q.type==='sort'?q.items.map(item=>item.group):q.blanks.map(blank=>blank.answers[0]);
    for(const [i,value] of values.entries()){
     const control=frame.locator('#row-'+i);
     if(q.type==='fill')await control.fill(value);else await control.selectOption(value);
    }
   }else throw new Error(q.id+': the food exercises need automatic answer controls');
   await frame.locator('#check-answer').click();
   assert.match(await frame.locator('#feedback-title').innerText(),/Riktig uten hjelp/,q.id+': visible controls accept the complete key');
  }
  for(const [width,height] of [[1366,768],[1280,720],[1024,720],[390,844]]){
   const viewport={width,height};
   const context=await browser.newContext({viewport,reducedMotion:'reduce'});
   await context.route('**/*',route=>{
    const request=route.request(),url=request.url();
    return ['GET','HEAD'].includes(request.method())&&(url.startsWith(base+'/')||/^(data|blob):/.test(url))?route.continue():route.abort();
   });
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base+'/naturfag.html#nutrition/all');
   await page.locator('#nutrition-module-frame').waitFor();
   const frame=await (await page.locator('#nutrition-module-frame').elementHandle()).contentFrame();
   await frame.locator('[data-question]').waitFor();
   const bank=await frame.evaluate(async()=>{
    const {questions}=await import(new URL('ernaering/questions.js',location.href).href);return questions;
   });
   const foods=bank.filter(q=>q.id.startsWith('food-nutrients-'));
   assert.equal(foods.length,10,'ten food photographs have nutrient-selection exercises');
   const questions=[...foods,...galleryIds.map(id=>bank.find(q=>q.id===id)),bank.find(q=>q.id===lookupId)];
   assert.ok(questions.every(Boolean),'the existing food exercises and lookup are available');
   let photoCount=0,maxScrollHeight=0;
   for(const q of questions){
    await frame.evaluate(id=>{location.hash=id;},q.id);
    await frame.waitForFunction(id=>document.querySelector('[data-question]')?.dataset.question===id,q.id);
    assert.equal(await frame.locator('.feedback,.open-model,.exercise .correct').count(),0,q.id+': no solution is shown before answering');
    if(q.id!==lookupId){
     const photos=frame.locator('.exercise img');
     assert.ok(await photos.count()>0,q.id+': actual photographs accompany the task');
     const singleFood=q.id.startsWith('food-nutrients-');
     if(singleFood)assert.equal(await photos.count(),1,q.id+': the named food is shown clearly on its own');
     for(const photo of await photos.all()){
      const data=await photo.evaluate(async img=>{
       await img.decode();
       const r=img.getBoundingClientRect(),caption=img.closest('.food-card')?.querySelector('.food-label')||img.closest('figure')?.querySelector('figcaption .food-label')||img.closest('figure')?.querySelector('figcaption');
       const c=caption?.getBoundingClientRect();
       return {src:img.currentSrc,alt:img.alt,complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,width:r.width,height:r.height,bottom:r.bottom,caption:caption?.textContent.trim(),captionTop:c?.top,captionSize:caption?parseFloat(getComputedStyle(caption).fontSize):0};
      });
      assert.equal(new URL(data.src).origin,base,q.id+': photos are stored locally');
      assert.ok(data.complete&&Math.max(data.naturalWidth,data.naturalHeight)>=300&&Math.min(data.naturalWidth,data.naturalHeight)>=100&&data.naturalWidth*data.naturalHeight>=40000,q.id+': genuine image bytes decode at useful resolution for their aspect ratio');
      assert.ok(data.alt&&data.caption,q.id+': the food has alternative text and a visible name');
      assert.ok(data.captionTop>=data.bottom-1,q.id+': its name appears below the photograph');
      assert.ok(data.captionSize>=12,q.id+': the food name is readable');
      assert.ok(data.width>=(singleFood?140:70)&&data.height>=(singleFood?100:60),q.id+': the photograph is large enough to recognize');
      photoCount++;
     }
    }else{
     const link=frame.locator('.exercise a[href="https://www.matvaretabellen.no/sok/"]');
     assert.equal(await link.count(),1,'the lookup has a direct search link');
     assert.equal(await link.getAttribute('target'),'_blank','the lookup opens a new tab');
     assert.match(await link.getAttribute('rel'),/\bnoopener\b/);
     assert.match(await link.getAttribute('rel'),/\bnoreferrer\b/);
     assert.match(await frame.locator('.exercise').innerText(),/ny fane/i,'the external link explains its new-tab behavior');
     assert.doesNotMatch(await frame.locator('.exercise').innerText(),/\b(?:126|63|54)\s*mg\b/,'the lookup values are not supplied before the student looks them up');
    }
    const before=await geometry(frame);checkBounds(q.id,viewport,'before',before);maxScrollHeight=Math.max(maxScrollHeight,before.scrollHeight);
    if(screenshots&&[1366,390].includes(width))await page.screenshot({path:path.join(screenshots,width+'-'+q.id+'.png'),fullPage:true});
    await answer(frame,q);checkBounds(q.id,viewport,'answered',await geometry(frame));
    if(q===foods[0]){
     await frame.locator('#retry-question').click();
     const wrong=q.options.find(value=>!q.answer.includes(value));
     await option(frame,q.answer[0]).click();await option(frame,wrong).click();
     assert.equal(await option(frame,q.answer[0]).getAttribute('aria-pressed'),'true','more than one nutrient can be checked');
     assert.equal(await option(frame,wrong).getAttribute('aria-pressed'),'true');
     await frame.locator('#check-answer').click();
     assert.match(await frame.locator('#feedback-title').innerText(),/Ikke helt/);
     assert.ok(await option(frame,q.answer[0]).isDisabled(),'a correct checked nutrient is retained after an incomplete answer');
     assert.ok(await option(frame,wrong).isEnabled(),'a wrong nutrient can be cleared');
     checkBounds(q.id,viewport,'partial',await geometry(frame));
     await option(frame,wrong).click();
     for(const value of q.answer.slice(1))await option(frame,value).click();
     await frame.locator('#check-answer').click();assert.match(await frame.locator('#feedback-title').innerText(),/Riktig etter øving/);
    }
    await frame.locator('#retry-question').click();await frame.locator('#reveal-answer').click();
    checkBounds(q.id,viewport,'revealed',await geometry(frame));
    const host=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,bounds:{frame:(()=>{const r=document.getElementById('nutrition-module-frame').getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};})()}}));
    checkBounds(q.id,viewport,'host',host);
   }
   metrics.push({width,height,questions:questions.length,states:questions.length*3+1,photoCount,maxScrollHeight});
   await context.close();
  }
  if(screenshots)fs.writeFileSync(path.join(screenshots,'results.json'),JSON.stringify({metrics,overflows,errors},null,2));
  console.log(JSON.stringify({metrics,overflows:overflows.map(({id,viewport,stage,scrollWidth,scrollHeight})=>({id,viewport,stage,scrollWidth,scrollHeight})),errors},null,2));
  assert.deepEqual(errors,[],'no browser exceptions');
  assert.equal(overflows.length,0,'photos, nutrient controls, lookup and feedback fit together');
  console.log('Food photographs, multiple nutrient choices, photo galleries and the Matvaretabellen lookup passed.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
