const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
let pw;if(!process.argv.includes('--data-only')){for(const candidate of [process.env.PLAYWRIGHT_MODULE,'playwright',path.resolve(path.dirname(process.execPath),'../node_modules/playwright')].filter(Boolean)){try{pw=require(candidate);break;}catch{}}if(!pw)throw Error('Set PLAYWRIGHT_MODULE to an installed Playwright module.');}
const root=path.resolve(__dirname,'..'),shots=path.resolve(root,'../research/bolger-straling-qa');
const ids=['bolger','fenomener','em','atomer','universet','kommunikasjon','radioaktivitet','stralevern','atmosfaeren'];
const errors=[],failures=[],warnings=[],coverage=[];
const server=http.createServer((req,res)=>{try{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end('missing');}});
async function attempt(label,fn){try{await fn();coverage.push(label);}catch(e){failures.push(label+': '+e.message);console.error('FAIL '+label+': '+e.message);}}
(async()=>{
 const {pathToFileURL}=require('node:url');
 const source=[];for(const file of ['waves','em-atoms','radioactivity','cosmos-environment'])source.push(...(await import(pathToFileURL(path.join(root,'prototyper/bolger-straling',file+'.js')).href)).topics);
 assert.deepEqual(source.map(t=>t.id).sort(),ids.slice().sort());
 const unique=new Set(),numeric=new Map();
 for(const t of source){assert.ok(t.sections.length&&t.terms.length&&t.questions.length>=10,t.id);for(const q of t.questions){assert.ok(!unique.has(q.id)&&q.prompt&&q.answer,q.id);unique.add(q.id);assert.ok(['mcq','number','open'].includes(q.type),q.id);if(q.type==='mcq')assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.choices.length,q.id);if(q.type==='number'){assert.ok(Number.isFinite(q.value),q.id);numeric.set(q.id,q);}}}
 const expected={'wv-b3':5/2,'wv-b4':1/2.5,'wv-b5':345/440,'wv-b6':4/2,'wv-b9':340*3,'wv-f1':35,'wv-f6':3+3,'em-03':3e8/1e8,'em-04':3e8/(500e-9)/1e14,'atom-05':-1.5-(-3.4),'atom-12':6.63e-34*5e14/1e-19,'com-04':5*8,'com-10':36000/300000,'ra-q2':220-85,'ra-q9':Math.log2(40/5)*5730,'ra-q10':3000*2**(-12/4),'ra-q11':Math.log2(100/6.25)*5730,'ra-q16':1000*2**(-360/24),'sv-q7':250*20,'sv-q8':2.5*1000,'ce-u-06':2898000/6000,'ce-u-09':656*1.1,'ce-a-08':340*(1-.3),'ce-a-09':238-230};
 for(const [id,value]of Object.entries(expected)){const q=numeric.get(id);assert.ok(q,id);assert.ok(Math.abs(q.value-value)<1e-8*Math.max(1,Math.abs(value)),id+' incorrect answer');}
 console.log('Source checks passed: '+source.length+' topics, '+unique.size+' distinct questions, '+Object.keys(expected).length+' independently calculated numeric answers.');
 if(process.argv.includes('--data-only'))return;
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port, url=base+'/prototyper/bolger-straling.html';
 fs.mkdirSync(path.join(shots,'browser-temp'),{recursive:true});
 if(process.platform==='win32'){process.env.TEMP=path.join(shots,'browser-temp');process.env.TMP=process.env.TEMP;}
 const edge=process.platform==='win32'?path.join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','Microsoft/Edge/Application/msedge.exe'):undefined;
 const browser=await pw.chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||(edge&&fs.existsSync(edge)?edge:undefined),args:['--disable-crash-reporter','--noerrdialogs']});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await context.route('**/*',r=>r.request().url().startsWith(base)||/^(data|blob):/.test(r.request().url())?r.continue():r.abort());
 const page=await context.newPage();page.setDefaultTimeout(7000);
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 await page.goto(url);await page.locator('.topic-card').first().waitFor();
 const data=await page.evaluate(async()=>{const modules=await Promise.all(['waves','em-atoms','radioactivity','cosmos-environment'].map(m=>import('./bolger-straling/'+m+'.js')));return modules.flatMap(m=>m.topics).map(t=>({id:t.id,title:t.title,sections:t.sections.length,questions:t.questions,terms:t.terms.length}));});
 await attempt('Complete, distinct, well-formed question data',async()=>{
 assert.equal(data.length,9);const seen=new Set();for(const t of data){assert.ok(t.sections>0&&t.terms>0);assert.ok(t.questions.length>=10,t.id);for(const q of t.questions){assert.ok(!seen.has(q.id),'duplicate '+q.id);seen.add(q.id);assert.ok(q.prompt&&q.answer,q.id);assert.ok(['mcq','number','open'].includes(q.type),q.id);if(q.type==='mcq')assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.choices.length,q.id);if(q.type==='number')assert.ok(Number.isFinite(q.value)&&(q.tolerance===undefined||q.tolerance>=0),q.id);}}});
 async function route(id,view='fagstoff'){await page.goto(url+'#'+id+'/'+view);await page.locator('#topic-content').waitFor();await page.waitForTimeout(70);}
 for(const id of ids)for(const view of ['fagstoff','oppgaver','begreper'])await attempt('Desktop render '+id+'/'+view,async()=>{
 await route(id,view);assert.ok((await page.locator('h1').innerText()).trim());assert.equal(await page.locator('#main').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'main content overflow');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'document overflow');if(view==='fagstoff'){assert.ok(await page.locator('.content-section').count());assert.equal(await page.locator('#pause-button').getAttribute('aria-pressed'),'true');}else if(view==='oppgaver')assert.equal(await page.locator('.q-card').count(),data.find(t=>t.id===id).questions.length);});
 // Exercise every model form control while paused, so changes cannot be attributed to animation alone.
 for(const id of ids)await attempt('Working controls '+id,async()=>{
 await route(id);const controls=page.locator('#topic-content input,#topic-content select');const count=await controls.count();let changed=0;
 for(let i=0;i<count;i++){
 const c=controls.nth(i);if(!(await c.isVisible())||!(await c.isEnabled()))continue;
 const info=await c.evaluate(e=>({tag:e.tagName,type:e.type,id:e.id,value:e.value,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]}));
 const before=await page.locator('#topic-content').evaluate(e=>e.innerHTML);
 if(info.tag==='SELECT'){const alt=info.options.find(v=>v!==info.value&&v!=='egen');if(alt===undefined)continue;await c.selectOption(alt);}
 else if(info.type==='range'){const next=info.value!==info.max?info.max:info.min;await c.fill(next);await c.dispatchEvent('input');}
 else if(info.type==='checkbox')await c.setChecked(!(await c.isChecked()));
 else if(info.type==='text'){await c.fill('B');await c.dispatchEvent('input');}
 else continue;
 await page.waitForTimeout(20);const after=await page.locator('#topic-content').evaluate(e=>e.innerHTML);if(after!==before)changed++;else warnings.push('No immediate model markup change for '+id+':'+info.id+' (may require animation to run).');
 }
 if(count)assert.ok(changed>0,'No control updated model');
 });
 await attempt('Wave relations remain consistent',async()=>{await route('bolger');await page.locator('#wv-frequency').fill('2');await page.locator('#wv-frequency').dispatchEvent('input');await page.locator('#wv-speed').fill('6');await page.locator('#wv-speed').dispatchEvent('input');const text=await page.locator('#wv-travel-readout').innerText();assert.match(text,/3 m/);assert.match(text,/0,5 s/);});
 await attempt('Refraction, interference and Doppler numerical outputs',async()=>{
 await route('fenomener');await page.locator('#wv-angle').fill('35');await page.locator('#wv-angle').dispatchEvent('input');assert.match(await page.locator('#wv-reflection-readout').innerText(),/35/);
 await page.locator('#wv-phase').fill('180');await page.locator('#wv-phase').dispatchEvent('input');assert.match(await page.locator('#wv-interference-readout').innerText(),/0.*A/);
 await page.locator('#wv-source-speed').fill('0.5');await page.locator('#wv-source-speed').dispatchEvent('input');assert.match(await page.locator('#wv-doppler-readout').innerText(),/333.*500.*1.?000/);
 });
 await attempt('Atomic transition wavelength and half-life expectation',async()=>{
 await route('atomer');const level=page.locator('#ema-level');console.log('ATOM_OPTIONS '+JSON.stringify(await level.locator('option').evaluateAll(es=>es.map(e=>({v:e.value,t:e.textContent})))));
 await route('radioaktivitet');await page.locator('#ra-half-time').fill('3');await page.locator('#ra-half-time').dispatchEvent('input');assert.match(await page.locator('#ra-half-expected').innerText(),/25/);assert.equal(await page.locator('.ra-decayed').count()+await page.locator('.ra-population i:not(.ra-decayed)').count(),200);
 });
 const qAll=data.flatMap(t=>t.questions.map(q=>({...q,topic:t.id})));
 const mcq=qAll.find(q=>q.type==='mcq'),num=qAll.find(q=>q.type==='number'),open=qAll.find(q=>q.type==='open');
 const card=q=>page.locator('[data-question="'+q.id+'"]');
 await attempt('MCQ feedback and mastery persist',async()=>{await route(mcq.topic,'oppgaver');await card(mcq).locator('[data-choice="'+mcq.correct+'"]').click();await card(mcq).locator('.q-status').waitFor();assert.match(await card(mcq).locator('.feedback').innerText(),/Riktig/);await page.reload();await card(mcq).locator('.q-status').waitFor();});
 await attempt('Numeric answer handles comma and wrong/empty values',async()=>{await route(num.topic,'oppgaver');const c=card(num);await c.locator('input').fill('');await c.locator('button[type=submit]').click();assert.match(await c.locator('.feedback').innerText(),/tall/);await c.locator('input').fill(String(num.value+1000));await c.locator('button[type=submit]').click();assert.equal(await c.locator('.q-status').isVisible(),false);await c.locator('input').fill(String(num.value).replace('.',','));await c.locator('button[type=submit]').click();assert.match(await c.locator('.feedback').innerText(),/Riktig/);await page.reload();await c.locator('.q-status').waitFor();assert.equal(await c.locator('input').inputValue(),String(num.value).replace('.',','));});
 await attempt('Open draft, solution, self-assessment and bookmark persist',async()=>{await route(open.topic,'oppgaver');const c=card(open);await c.locator('textarea').fill('Mitt faglige svar.');await c.locator('.show-answer').click();assert.ok(await c.locator('.solution').isVisible());await c.locator('[data-self="again"]').click();assert.equal(await c.locator('.q-bookmark').getAttribute('aria-pressed'),'true');await page.reload();assert.equal(await c.locator('textarea').inputValue(),'Mitt faglige svar.');assert.equal(await c.locator('.q-bookmark').getAttribute('aria-pressed'),'true');});
 await attempt('All questions search, type/topic filters and bookmark list',async()=>{await route('alle','oppgaver');assert.equal(await page.locator('.q-card').count(),qAll.length);await page.locator('#question-type').selectOption('number');assert.equal(await page.locator('.q-card').count(),qAll.filter(q=>q.type==='number').length);await page.locator('#question-type').selectOption('');await page.locator('#question-search').fill('sjeldenord_ingen');assert.equal(await page.locator('.q-card').count(),0);await page.locator('#question-search').fill('');await page.locator('#bookmark-filter').click();assert.ok(await page.locator('.q-card').count()>=1);await page.locator('#bookmark-filter').click();await page.locator('#question-topic').selectOption('em');assert.equal(await page.locator('.q-card').count(),data.find(t=>t.id==='em').questions.length);});
 await attempt('Pause freezes graphics and play resumes',async()=>{await route('fenomener');const svg=page.locator('#wv-interference');const before=await svg.innerHTML();await page.waitForTimeout(180);assert.equal(await svg.innerHTML(),before);await page.locator('#pause-button').click();await page.waitForTimeout(160);assert.notEqual(await svg.innerHTML(),before);await page.locator('#pause-button').click();});
 await attempt('Dark theme survives reload',async()=>{await page.locator('#theme-button').click();assert.ok(await page.locator('body.dark').count());await page.reload();assert.ok(await page.locator('body.dark').count());await page.locator('#theme-button').click();});
 await attempt('Keyboard skip link preserves the current topic',async()=>{await route('atomer');const before=page.url();await page.locator('.skip').focus();await page.keyboard.press('Enter');assert.equal(page.url(),before);assert.equal(await page.evaluate(()=>document.activeElement.id),'main');});
 for(const width of [390,320])for(const id of ids)await attempt('Mobile '+width+' '+id,async()=>{await page.setViewportSize({width,height:844});await route(id);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'document overflow');await route(id,'oppgaver');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'bank overflow');});
 await attempt('Mobile navigation opens/closes and route is keyboard reachable',async()=>{await page.setViewportSize({width:390,height:844});await route('em');await page.locator('#menu-button').click();assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'false');await page.locator('#menu-button').click();await page.locator('[data-route="em/oppgaver"]').first().click();await page.locator('.q-card').first().waitFor();assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'false');});
 await page.setViewportSize({width:1440,height:1000});await page.goto(url+'#oversikt');await page.screenshot({path:path.join(shots,'overview-desktop.png'),fullPage:true});
 await route('fenomener');await page.screenshot({path:path.join(shots,'phenomena-desktop.png'),fullPage:true});
 await route('radioaktivitet');await page.screenshot({path:path.join(shots,'radioactivity-desktop.png'),fullPage:true});
 await route('universet');await page.locator('#theme-button').click();await page.screenshot({path:path.join(shots,'universe-dark.png'),fullPage:true});await page.locator('#theme-button').click();
 await page.setViewportSize({width:390,height:844});await route('em');await page.screenshot({path:path.join(shots,'em-mobile.png'),fullPage:true});
 if(errors.length)failures.push('Browser errors: '+errors.join('\n'));
 const report={topics:data.map(t=>({id:t.id,questions:t.questions.length,sections:t.sections,terms:t.terms})),totalQuestions:qAll.length,passed:coverage.length,failures,warnings,shots};
 fs.writeFileSync(path.join(shots,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(failures.length)process.exitCode=1;
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
