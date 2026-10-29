import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {handleQuizlab,cleanupQuizlab,ensureQuizlabSchema} from '../services/geography-scores/quizlab.mjs';
import {normalizeQuiz,createQuizSession,advanceClock,answerQuizSession,viewSession} from '../services/geography-scores/quizlab-rules.mjs';
import catalog from '../assets/quizlab/catalog.json' with{type:'json'};

export function quizFixture({migrate=true}={}){
 const db=new DatabaseSync(':memory:');
 db.exec(fs.readFileSync(new URL('../services/geography-scores/schema.sql',import.meta.url),'utf8'));
 if(migrate)db.exec(fs.readFileSync(new URL('../services/geography-scores/migrations/0002-quizlab.sql',import.meta.url),'utf8'));
 const wrap=(sql,args=[])=>({bind(...values){return wrap(sql,values);},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){const result=db.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}};}});
 const env={DB:{prepare:sql=>wrap(sql),batch:async statements=>{db.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());db.exec('COMMIT');return results;}catch(error){db.exec('ROLLBACK');throw error;}}}};
 const call=async(path,body,token,now=1000)=>{
  const request=new Request('https://test.example'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const response=await handleQuizlab(request,env,{now,cors:{'Access-Control-Allow-Origin':'https://onlyfag.no'}});return {status:response.status,body:await response.json()};
 };
 return {db,env,call};
}
const configuration=(overrides={})=>({slug:'quiz01',title:'Geografi i klassen',mode:'fixed',minutes:1,questionCount:6,secondsPerQuestion:15,categories:[{id:'flags'},{id:'capitals'}],...overrides});
const correctInput=s=>s.current.question.type==='choice'?{choiceId:s.current.answer}:s.current.question.type==='target'?{targetId:s.current.answer}:{lat:s.current.location.lat,lon:s.current.location.lon};
const storedState=db=>JSON.parse(db.prepare('SELECT state_json FROM quizlab_sessions ORDER BY rowid DESC LIMIT 1').get().state_json);
const id=()=>crypto.randomUUID();

test('quiz config validates every module, counts, difficulty and unique categories',()=>{
 assert.equal(normalizeQuiz(configuration({secondsPerQuestion:undefined})).secondsPerQuestion,15);
 for(const module of catalog.modules){const value=normalizeQuiz(configuration({categories:[{id:module.id}]}));assert.equal(value.categories[0].id,module.id);if(module.id==='mapwiz')assert.equal(value.categories[0].difficulty,'easy');}
 for(const patch of [{mode:'unknown'},{minutes:0},{minutes:61},{minutes:1.5},{questionCount:501},{secondsPerQuestion:0},{secondsPerQuestion:121},{categories:[]},{categories:[{id:'unknown'}]},{categories:[{id:'flags'},{id:'flags'}]},{categories:[{id:'mapwiz',difficulty:'veryeasy'}]},{categories:[{id:'flags',difficulty:'easy'}]},{title:'<script>'},{questionCount:1}])assert.throws(()=>normalizeQuiz(configuration(patch)));
});

test('fixed rounds balance all selected modules and keep categories together',()=>{
 const quiz={slug:'quiz01',version:'test',...normalizeQuiz(configuration({questionCount:8,categories:[{id:'flags'},{id:'capitals'},{id:'worldle'}]}))};
 const s=createQuizSession(quiz,0),seen=[];
 for(let i=0;i<8;i++){seen.push(s.current.question.module);answerQuizSession(s,{question:s.current.question.id,...correctInput(s)},100+i*100);}
 assert.deepEqual(seen,['flags','flags','flags','capitals','capitals','capitals','worldle','worldle']);assert.equal(s.correct,8);assert.equal(s.complete,true);assert.equal(viewSession(s,1000).question,null);
});

test('timed batching follows ceil(10*minutes/categories) and cycles without early completion',()=>{
 const quiz={slug:'quiz01',version:'test',...normalizeQuiz(configuration({mode:'correct',minutes:1,categories:[{id:'flags'},{id:'capitals'},{id:'worldle'}]}))};
 const s=createQuizSession(quiz,0),seen=[];
 for(let i=0;i<14;i++){seen.push(s.current.question.module);answerQuizSession(s,{question:s.current.question.id,...correctInput(s)},100+i*100);}
 assert.deepEqual(seen,['flags','flags','flags','flags','capitals','capitals','capitals','capitals','worldle','worldle','worldle','worldle','flags','flags']);assert.equal(s.complete,false);
});

test('all available categories emit answerable questions with no answer in public state',()=>{
 for(const module of catalog.modules){
  const s=createQuizSession({slug:'quiz01',version:'test',...normalizeQuiz(configuration({questionCount:1,categories:[{id:module.id}]}))},0),view=viewSession(s,0);
  assert.equal(view.question.module,module.id);assert(!Object.hasOwn(view.question,'answer'));assert(!Object.hasOwn(view.question,'location'));assert(!Object.hasOwn(view.question,'issuedAt'));
  if(module.id==='worldle')assert(view.question.silhouette);
  if(module.id==='mapwiz')assert.equal(view.question.type,'location');
  const result=answerQuizSession(s,{question:s.current.question.id,...correctInput(s)},100);assert.equal(result.correct,true,module.id);assert.equal(s.correct,1);
 }
});

test('question deadlines and the full round deadline count all silence as incorrect',()=>{
 const quiz={slug:'quiz01',version:'test',...normalizeQuiz(configuration({mode:'accuracy',categories:[{id:'flags'}]}))},s=createQuizSession(quiz,0);
 answerQuizSession(s,{question:s.current.question.id,...correctInput(s)},1000);
 assert.equal(advanceClock(s,59999),3);assert.equal(s.answered,4);assert.equal(s.complete,false);
 assert.equal(advanceClock(s,60000),1);assert.equal(s.answered,5);assert.equal(s.correct,1);assert.equal(s.complete,true);assert.equal(viewSession(s,60000).accuracy,20);assert.equal(s.timeMs,60000);
});

test('create, public read, private edit and immutable version score separation',async()=>{
 const {db,call}=quizFixture();try{
  db.prepare('INSERT INTO scores VALUES(?,?,?,?,?,?)').run('old-result','existing','Old nickname',100,1000,0);
  const created=await call('/quizlab/quizzes',configuration());assert.equal(created.status,201);assert.match(created.body.adminToken,/^[a-f0-9]{64}$/);
  const original=created.body.quiz;
  assert.equal((await call('/quizlab/quizzes',configuration())).status,409);
  assert.equal((await call('/quizlab/quizzes/quiz01',undefined,'a'.repeat(64))).status,401);
  assert.equal((await call('/quizlab/quizzes/quiz01',undefined,created.body.adminToken)).status,200);
  const read=await call('/quizlab/quizzes/quiz01');assert.deepEqual(read.body.quiz,original);assert(!JSON.stringify(read.body).includes(created.body.adminToken));assert(!JSON.stringify(read.body).includes('admin_hash'));
  assert.equal((await call('/quizlab/quizzes/quiz01',{...configuration(),version:original.version},'a'.repeat(64))).status,401);
  const changed=await call('/quizlab/quizzes/quiz01',{...configuration(),title:'Ny utgave',version:original.version},created.body.adminToken,2000);assert.equal(changed.status,200);assert.notEqual(changed.body.quiz.version,original.version);
  assert.equal((await call('/quizlab/quizzes/quiz01',{...configuration(),version:original.version},created.body.adminToken)).status,409);
  assert.equal((await call('/quizlab/quizzes/quiz01/sessions',{version:original.version})).status,409);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM quizlab_versions').get().n,2);
  assert.equal(db.prepare('SELECT nickname FROM scores').get().nickname,'Old nickname');
 }finally{db.close();}
});

test('answers are ordered, scored on server, retries idempotent, highscore publishes once',async()=>{
 const {db,call}=quizFixture();try{
  await call('/quizlab/quizzes',configuration({questionCount:2,categories:[{id:'flags'}]}));
  const start=await call('/quizlab/quizzes/quiz01/sessions',{});assert.equal(start.status,201);const token=start.body.token;
  const s=storedState(db),payload={requestId:id(),question:s.current.question.id,...correctInput(s),correct:99999,score:9999999};
  assert.equal((await call('/quizlab/answer',{...payload,question:'wrong'},token)).body.error,'wrong_question');
  assert.equal((await call('/quizlab/publish',{requestId:id(),nickname:'Test'},token)).body.error,'incomplete');
  const first=await call('/quizlab/answer',payload,token,2000);assert.equal(first.status,200);assert.equal(first.body.correct,1);assert.equal(first.body.complete,false);
  const retry=await call('/quizlab/answer',payload,token,2100);assert.deepEqual(retry,first);
  assert.equal((await call('/quizlab/answer',{...payload,skip:true},token)).status,409);
  const next=storedState(db),done=await call('/quizlab/answer',{requestId:id(),question:next.current.question.id,skip:true},token,3000);assert.equal(done.body.complete,true);assert.equal(done.body.correct,1);assert.equal(done.body.answered,2);
  assert.equal((await call('/quizlab/publish',{requestId:id(),nickname:'<script>'},token,3000)).status,400);
  const result=await call('/quizlab/publish',{requestId:id(),nickname:'Elev A',score:9999999},token,3000);assert.equal(result.body.saved,true);
  assert.equal((await call('/quizlab/publish',{requestId:id(),nickname:'Changed'},token,3100)).body.saved,true);
  const scores=await call('/quizlab/quizzes/quiz01/scores');assert.equal(scores.body.rows.length,1);assert.equal(scores.body.rows[0].nickname,'Elev A');assert.equal(scores.body.rows[0].correct,1);assert.equal(scores.body.rows[0].accuracy,50);
 }finally{db.close();}
});

test('timed rounds cannot rank early and expired answers cannot answer another question',async()=>{
 const {db,call}=quizFixture();try{
  await call('/quizlab/quizzes',configuration({mode:'accuracy',categories:[{id:'flags'}]}));
  const start=await call('/quizlab/quizzes/quiz01/sessions',{},undefined,1000),token=start.body.token,q=start.body.question;
  assert.equal((await call('/quizlab/finish',{requestId:id()},token,2000)).body.error,'incomplete');
  const delayed=await call('/quizlab/answer',{requestId:id(),question:q.id,choiceId:q.options[0].id},token,17000);assert.equal(delayed.body.feedback.expired,true);assert.equal(delayed.body.answered,1);assert.equal(delayed.body.correct,0);
  const result=await call('/quizlab/finish',{requestId:id()},token,61000);assert.equal(result.status,200);assert.equal(result.body.complete,true);assert.equal(result.body.answered,4);
  const publish=await call('/quizlab/publish',{requestId:id(),nickname:'Timeouts'},token,61000);assert.equal(publish.body.saved,true);
  assert.equal((await call('/quizlab/quizzes/quiz01/scores')).body.rows[0].answered,4);
 }finally{db.close();}
});

test('per-question timeouts work for fixed rounds and authenticated status persists catchup',async()=>{
 const {db,call}=quizFixture();try{
  await call('/quizlab/quizzes',configuration({questionCount:3,categories:[{id:'flags'}],secondsPerQuestion:5}));
  const start=await call('/quizlab/quizzes/quiz01/sessions',{},undefined,1000);
  const state=await call('/quizlab/status',{},start.body.token,16000);assert.equal(state.body.complete,true);assert.equal(state.body.answered,3);assert.equal(state.body.correct,0);assert.equal(storedState(db).complete,true);
  assert.equal((await call('/quizlab/status',{},undefined)).status,401);
  assert.equal((await call('/quizlab/status',{},start.body.token,7201000)).body.error,'expired');
 }finally{db.close();}
});

test('stale writes are rejected and scheduled cleanup deletes only expired quiz sessions',async()=>{
 const {db,env,call}=quizFixture();try{
  await call('/quizlab/quizzes',configuration({questionCount:2,categories:[{id:'flags'}]}));
  const start=await call('/quizlab/quizzes/quiz01/sessions',{}),state=storedState(db),body={requestId:id(),question:state.current.question.id,...correctInput(state)};
  const results=await Promise.all([call('/quizlab/answer',body,start.body.token,2000),call('/quizlab/answer',{...body,requestId:id()},start.body.token,2000)]);assert.equal(results.filter(result=>result.status===200).length,1);assert.equal(results.find(result=>result.status!==200).body.error,'retry');assert.equal(storedState(db).correct,1);
  await cleanupQuizlab(env,7201001);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM quizlab_sessions').get().n,0);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM quizlab_quizzes').get().n,1);
 }finally{db.close();}
});


test('a client-kept creation capability makes lost responses safely recoverable',async()=>{
 const {db,call}=quizFixture();try{
  const adminToken='c'.repeat(64),config=configuration({adminToken});
  const first=await call('/quizlab/quizzes',config);assert.equal(first.status,201);assert.equal(first.body.adminToken,adminToken);
  const retry=await call('/quizlab/quizzes',config,undefined,2000);assert.equal(retry.status,200);assert.deepEqual(retry.body,first.body);
  assert.equal((await call('/quizlab/quizzes',{...config,adminToken:'d'.repeat(64)})).status,409);
  assert.equal((await call('/quizlab/quizzes',{...config,title:'Different draft'})).status,409);
  assert.equal((await call('/quizlab/quizzes',{...config,slug:'quiz02',adminToken:'guess'})).status,400);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM quizlab_quizzes').get().n,1);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM quizlab_versions').get().n,1);
 }finally{db.close();}
});


test('an existing database bootstraps only additive Quizlab tables on first use',async()=>{
 const {db,env,call}=quizFixture({migrate:false});try{
  db.prepare('INSERT INTO scores VALUES(?,?,?,?,?,?)').run('existing-result','existing-board','Existing pupil',100,2000,1);
  const original=db.prepare('SELECT * FROM scores').get();
  const tables=()=>db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'quizlab_%' ORDER BY name").all().map(row=>row.name);
  assert.deepEqual(tables(),[]);
  const catalog=await call('/quizlab/catalog');assert.equal(catalog.status,200);
  assert.deepEqual(tables(),['quizlab_quizzes','quizlab_scores','quizlab_sessions','quizlab_versions']);
  await Promise.all([ensureQuizlabSchema(env),ensureQuizlabSchema(env)]);
  const created=await call('/quizlab/quizzes',configuration());assert.equal(created.status,201);
  await cleanupQuizlab(env,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM quizlab_quizzes').get().n,1);
  assert.deepEqual(db.prepare('SELECT * FROM scores').get(),original);
 }finally{db.close();}
});

test('concurrent bootstrap coalesces, failures return unavailable and later retry succeeds',async()=>{
 const {db,env,call}=quizFixture({migrate:false});try{
  const batch=env.DB.batch;let attempts=0;
  env.DB.batch=async statements=>{attempts++;if(attempts===1)throw Error('temporary D1 failure');return batch(statements);};
  const failed=await Promise.all([call('/quizlab/catalog'),call('/quizlab/quizzes',configuration())]);
  assert.equal(attempts,1);
  for(const result of failed){assert.equal(result.status,503);assert.equal(result.body.error,'unavailable');assert.equal(result.body.saved,undefined);assert.equal(result.body.quiz,undefined);}
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name LIKE 'quizlab_%'").get().n,0);
  const retried=await call('/quizlab/catalog');assert.equal(retried.status,200);assert.equal(attempts,2);
  await Promise.all([call('/quizlab/catalog'),ensureQuizlabSchema(env)]);assert.equal(attempts,2);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM quizlab_quizzes').get().n,0);
  assert.equal((await call('/quizlab/quizzes',configuration())).status,201);
 }finally{db.close();}
});
