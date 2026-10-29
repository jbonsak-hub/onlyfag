// Real Quizlab pages and production Worker against an isolated SQLite database.
// External traffic (including analytics and real score submissions) is blocked.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {DatabaseSync} = require('node:sqlite');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  let file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  const exists = fs.existsSync(file);
  if (!exists) file = path.join(root, '404.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.statusCode = exists ? 200 : 404;
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});

function database() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(root, 'services/geography-scores/schema.sql'), 'utf8'));
  db.exec(fs.readFileSync(path.join(root, 'services/geography-scores/migrations/0002-quizlab.sql'), 'utf8'));
  const wrap = (sql, args=[]) => ({
    bind(...values) { return wrap(sql, values); },
    async first() { return db.prepare(sql).get(...args) || null; },
    async all() { return {results:db.prepare(sql).all(...args)}; },
    async run() { const result=db.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}}; }
  });
  const env = {DB:{prepare:sql=>wrap(sql),batch:async statements=>{
    db.exec('BEGIN');
    try { const results=[];for (const statement of statements) results.push(await statement.run());db.exec('COMMIT');return results; }
    catch (error) { db.exec('ROLLBACK');throw error; }
  }},RATE_SECRET:'isolated-quizlab-browser-fixture',ALLOW_LOCAL:'true'};
  return {db,env};
}

async function main() {
  const {default:worker} = await import('../services/geography-scores/worker.mjs');
  const {db,env} = database();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const api='https://scores.test';
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  const errors=[],missing=[],sessions=[],calls=[],lostResponses=[];
  let loseCreateResponse=false,loseAnswerResponse=false;
  async function context(viewport={width:1366,height:850}) {
    const instance=await browser.newContext({viewport});
    await instance.addInitScript(value=>{window.QUIZLAB_API=value;window.GEO_SCORE_API=value;},api);
    instance.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
    await instance.route('**/*',async route=>{
      const request=route.request(),url=request.url();
      if(url.startsWith(api+'/')) {
        const pathname=new URL(url).pathname,input=request.postData()?JSON.parse(request.postData()):null;
        calls.push({path:pathname,method:request.method(),requestId:input?.requestId,question:input?.question});
        const result=await worker.fetch(new Request(url,{method:request.method(),headers:{...request.headers(),'CF-Connecting-IP':'192.0.2.73'},...(request.postData()?{body:request.postData()}:{} )}),env);
        const text=await result.text();
        if(request.method()==='POST' && /\/sessions$/.test(new URL(url).pathname) && result.status===201) sessions.push(JSON.parse(text));
        if(result.status<300 && ((loseCreateResponse&&pathname==='/quizlab/quizzes'&&request.method()==='POST') || (loseAnswerResponse&&pathname==='/quizlab/answer'))) {
          if(pathname==='/quizlab/quizzes')loseCreateResponse=false;
          else loseAnswerResponse=false;
          lostResponses.push({path:pathname,requestId:input?.requestId,question:input?.question});
          // The server has committed successfully; only its response is lost.
          return route.abort('failed');
        }
        return route.fulfill({status:result.status,headers:Object.fromEntries(result.headers),body:text});
      }
      if(url.startsWith(base+'/') || /^(data|blob):/.test(url)) {
        const response=await route.fetch();
        if(response.status()>=400 && !/^\/quiz[a-z0-9-]+\/?$/.test(new URL(url).pathname))missing.push(new URL(url).pathname);
        return route.fulfill({response});
      }
      return route.abort();
    });
    return instance;
  }
  const requestId=()=>crypto.randomUUID();
  let fixtureTeacher=80;
  async function apiCall(route,body,token) {
    // Independent module scenarios represent separate teachers; the browser
    // still exercises production rate limits for its shared classroom address.
    const ip=route==='/quizlab/quizzes'?'192.0.2.'+fixtureTeacher++:'192.0.2.74';
    const response=await worker.fetch(new Request(api+route,{method:body===undefined?'GET':'POST',headers:{Origin:base,'CF-Connecting-IP':ip,...(body===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
    const result=await response.json();
    assert.ok(response.status<400,route+': '+JSON.stringify(result));
    return result;
  }
  async function screenshot(page,name) {
    if(!process.env.QUIZLAB_SCREENSHOTS)return;
    fs.mkdirSync(process.env.QUIZLAB_SCREENSHOTS,{recursive:true});
    await page.screenshot({path:path.join(process.env.QUIZLAB_SCREENSHOTS,name+'.png'),fullPage:true});
  }
  try {
    const desktop=await context(),page=await desktop.newPage();
    const catalogue=await apiCall('/quizlab/catalog');
    assert.ok(catalogue.modules.length>=15,'Existing geography modules are available');
    await page.goto(base+'/jobb/quizlab.html');
    await page.locator('input[name="category"][value="flags"]').waitFor();
    assert.equal(await page.locator('#question-seconds').inputValue(),'15','Default question time is fifteen seconds');
    await page.locator('input[name="mode"][value="fixed"]').check();
    await page.locator('#question-count').fill('4');
    const title='Quiz & "klasse 9B"';
    await page.locator('#quiz-title').fill(title);
    await page.locator('#quiz-slug').fill('quizbrowser01');
    await screenshot(page,'builder-desktop');
    loseCreateResponse=true;
    await page.locator('#create-quiz').click();
    await page.locator('#form-error').waitFor({state:'visible'});
    assert.equal(db.prepare('SELECT COUNT(*) n FROM quizlab_quizzes').get().n,1,'Lost creation response still committed exactly one quiz');
    await page.locator('#create-quiz').click();
    await page.locator('#share-result').waitFor({state:'visible'});
    assert.equal(db.prepare('SELECT COUNT(*) n FROM quizlab_quizzes').get().n,1,'Creation retry recovers the existing quiz');
    assert.equal(db.prepare('SELECT COUNT(*) n FROM quizlab_versions').get().n,1,'Creation retry does not create another version');
    const student=await page.locator('#student-link').inputValue();
    const admin=await page.locator('#admin-link').inputValue();
    assert.ok(student.endsWith('/quizbrowser01'),'Teacher receives a short pupil URL');
    assert.match(new URL(admin).hash,/^#quiz=quizbrowser01&key=[a-f0-9]{64}$/);
    assert.equal(new URL(admin).search,'','Private capability is never in the HTTP query');
    const created=(await apiCall('/quizlab/quizzes/quizbrowser01')).quiz;
    assert.equal(created.title,title);
    assert.equal(created.secondsPerQuestion,15);
    assert.deepEqual(created.categories.map(c=>c.id),['flags','capitals']);

    const pupil=await desktop.newPage();
    await pupil.goto(base+'/quizbrowser01');
    await pupil.waitForURL('**/quiz/?id=quizbrowser01');
    await pupil.locator('#quiz-start').waitFor();
    assert.equal(await pupil.locator('h1').innerText(),title,'Pupil title preserves literal ampersands and quotes');
    await pupil.locator('#quiz-start').click();
    const state=()=>JSON.parse(db.prepare('SELECT state_json FROM quizlab_sessions ORDER BY rowid DESC LIMIT 1').get().state_json);
    async function correctAnswer(targetPage) {
      await targetPage.locator('#quiz-stage').waitFor({state:'visible'});
      const s=state(),q=s.current.question;
      if(q.type==='choice') {
        const options=targetPage.locator('#quiz-choices [data-choice-id]');
        await options.first().waitFor();
        const index=await options.evaluateAll((els,id)=>els.findIndex(el=>el.dataset.choiceId===id),s.current.answer);
        assert.ok(index>=0,'Correct country option is present');
        await options.nth(index).click();
      } else if(q.type==='target') {
        const targets=targetPage.locator('[data-target-id]');
        await targets.first().waitFor();
        const index=await targets.evaluateAll((els,id)=>els.findIndex(el=>el.dataset.targetId===id),s.current.answer);
        assert.ok(index>=0,q.module+': original map contains the assigned target');
        await targets.nth(index).press('Enter');
      } else {
        const location=s.current.location;
        await targetPage.locator('#quiz-location-map[viewBox]').waitFor();
        const point=await targetPage.evaluate(async location=>{
          const meta=await (await fetch('/assets/geography/mapwiz-world-map.json')).json();
          const merc=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
          const x=(location.lon-meta.west)/(meta.east-meta.west)*meta.width;
          const y=(merc(meta.top)-merc(location.lat))/(merc(meta.top)-merc(meta.bottom))*meta.height;
          const screen=new DOMPoint(x,y).matrixTransform(document.querySelector('#quiz-location-map').getScreenCTM());
          return {x:screen.x,y:screen.y};
        },location);
        await targetPage.mouse.click(point.x,point.y);
        await targetPage.locator('#quiz-location-submit').click();
      }
    }
    const modules=[];
    for(let i=0;i<4;i++) {
      await pupil.waitForFunction(index=>window.QuizLabPlayer?.getState()?.index===index,i);
      modules.push(state().current.question.module);
      if(i===2)await pupil.locator('#quiz-skip').click();
      else {
        if(i===0)loseAnswerResponse=true;
        await correctAnswer(pupil);
        if(i===0){
          await pupil.waitForFunction(()=>window.QuizLabPlayer?.getState()?.index===1);
          const lost=lostResponses.find(response=>response.path==='/quizlab/answer');
          assert.ok(lost,'One committed answer response was deliberately lost');
          const attempts=calls.filter(call=>call.path==='/quizlab/answer'&&call.question===lost.question);
          assert.equal(attempts.length,2,'Client retries the failed answer response once');
          assert.ok(attempts.every(call=>call.requestId===lost.requestId),'Retry retains the exact idempotency key');
          assert.equal(state().answered,1,'Retried committed answer counts once');
          assert.equal(state().correct,1);
        }
      }
    }
    await pupil.locator('#quiz-result').waitFor({state:'visible'});
    assert.deepEqual(modules,['flags','flags','capitals','capitals'],'Fixed rounds group balanced categories');
    assert.equal(state().correct,3);
    assert.equal(state().answered,4);
    await pupil.locator('#quiz-nickname').fill('Klassepilot');
    await pupil.locator('#quiz-publish button[type="submit"]').click();
    await pupil.locator('#quiz-score-list').getByText('Klassepilot',{exact:true}).waitFor();
    const rows=(await apiCall('/quizlab/quizzes/quizbrowser01/scores')).rows;
    assert.equal(rows.length,1);
    assert.equal(rows[0].correct,3);
    await screenshot(pupil,'result-desktop');

    // Every module renders its actual question/map and accepts a real UI answer.
    for(const [index,module]of catalogue.modules.entries()) {
      const slug='quizrender'+index;
      await apiCall('/quizlab/quizzes',{slug,title:module.label||module.title,mode:'fixed',questionCount:1,categories:[{id:module.id,...(module.id==='mapwiz'?{difficulty:'easy'}:{})}]});
      await pupil.goto(base+'/quiz/?id='+slug);
      await pupil.locator('#quiz-start').click();
      await correctAnswer(pupil);
      await pupil.locator('#quiz-result').waitFor({state:'visible'});
      assert.equal(state().correct,1,module.id+': correct UI response is scored by server');
    }
    const mobile=await context({width:390,height:844}),small=await mobile.newPage();
    await small.goto(base+'/jobb/quizlab.html');
    await small.locator('input[name="category"][value="flags"]').waitFor();
    await screenshot(small,'builder-mobile');
    assert.ok(await small.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Builder fits mobile width');
    await small.goto(base+'/quiz/?id=quizbrowser01');
    await small.locator('#quiz-start').waitFor();
    await small.locator('#quiz-score-list').getByText('Klassepilot',{exact:true}).waitFor();
    assert.ok(await small.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Pupil start fits mobile width');
    await small.locator('#quiz-start').click();
    await correctAnswer(small);
    await screenshot(small,'pupil-mobile');
    assert.ok(await small.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Pupil question fits mobile width');

    // Administrators can make a new version without changing the pupil URL,
    // reusing the old board, or sending their private key in a page request.
    const administrator=await desktop.newPage();
    await administrator.goto(admin);
    await administrator.waitForFunction(()=>document.querySelector('#quiz-title').value==='Quiz & "klasse 9B"');
    await administrator.locator('#quiz-title').fill('Oppdatert quiz');
    await administrator.locator('#question-count').fill('2');
    await administrator.locator('#create-quiz').click();
    await administrator.locator('#share-result').waitFor({state:'visible'});
    const updated=(await apiCall('/quizlab/quizzes/quizbrowser01')).quiz;
    assert.notEqual(updated.version,created.version);
    assert.equal(updated.questionCount,2);
    assert.equal(await administrator.locator('#student-link').inputValue(),student);
    assert.equal((await apiCall('/quizlab/quizzes/quizbrowser01/scores')).rows.length,0,'Changed questions have a fresh board');
    assert.equal((await apiCall('/quizlab/quizzes/quizbrowser01/scores?version='+created.version)).rows[0].nickname,'Klassepilot','Original board remains available for the original version');
    await administrator.locator('#saved-quizzes').getByRole('link',{name:'Administrer',exact:true}).click();
    await administrator.locator('#quiz-title').waitFor({state:'visible'});
    assert.equal(await administrator.locator('#quiz-title').inputValue(),'Oppdatert quiz','Same-fragment administration link reopens the editor');
    assert.equal(db.prepare('SELECT COUNT(*) n FROM scores').get().n,0,'Existing geography boards remain untouched');
    assert.deepEqual(errors,[]);
    assert.deepEqual(missing,[]);
    assert.ok(calls.some(call=>call.path==='/quizlab/publish'));
    console.log('PASS Quizlab builder/admin versions, lost creation and answer responses, short alias, private fragment, escaped title, balanced pupil round, shared highscore, '+catalogue.modules.length+' real modules, mobile and preserved original boards');
  } catch(error) {
    console.error('Page errors:',errors,'Missing local resources:',missing);
    for(const instance of browser.contexts())for(const page of instance.pages())console.error(page.url(),(await page.locator('body').innerText().catch(()=>'' )).slice(0,700));
    throw error;
  } finally { await browser.close();db.close();server.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;server.close();});
