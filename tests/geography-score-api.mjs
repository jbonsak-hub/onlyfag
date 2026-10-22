import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';import assert from 'node:assert/strict';import test from 'node:test';
import worker from '../services/geography-scores/worker.mjs';import {create,answer,finish,issue,data,mapScore,config,board} from '../services/geography-scores/rules.mjs';
export function fixture(){
 const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(new URL('../services/geography-scores/schema.sql',import.meta.url),'utf8'));
 const wrap=(sql,args=[])=>({bind(...v){return wrap(sql,v);},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}});
 return {db,env:{DB:{prepare:sql=>wrap(sql),batch:async statements=>{db.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}},RATE_SECRET:'test-only-local',ALLOW_LOCAL:'true'}};
}
const req=(url,body,token,origin='https://onlyfag.no')=>new Request('https://scores.example'+url,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.2',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
test('server chooses ten balanced MapWiz questions and computes geography/time points',()=>{
 for(const categories of [['flags'],['deserts'],['place:Norge'],Object.keys(data.mapwiz)]){
  const s=create({game:'mapwiz',categories},1000);assert.equal(s.targets.length,10);if(categories.length>5){const counts={};s.targets.forEach(id=>{const [cat]=JSON.parse(id);counts[cat]=(counts[cat]||0)+1;});assert.ok(Object.values(counts).every(n=>n<=2));}
  assert.throws(()=>finish(s,1001),/incomplete/);
  for(let i=0;i<10;i++){const [cat]=JSON.parse(s.current.target),t=data.mapwiz[cat].find(t=>t.id===s.current.target);answer(s,{question:s.current.id,lat:t.lat,lon:t.lon,score:999999},1100+i*1000);if(i<9){assert.ok(s.awaitingNext);issue(s,1200+i*1000);}}
  assert.equal(s.score,1100);assert.ok(s.complete);
 }
 assert.equal(mapScore(0,40,false).points,100);assert.ok(mapScore(10000,0,false).points<1);assert.equal(mapScore(0,0,true).points,110);
});
test('streaks stop on a wrong answer and cannot be finalized early',()=>{
 for(const game of ['flags','capitals','flagcapital','places']){
  const s=create({game,language:'en'},0);assert.throws(()=>finish(s,1),/incomplete/);assert.equal(s.current.options.length,game==='places'?6:4);
  answer(s,{question:s.current.id,choice:s.current.target},1000);assert.equal(s.score,1);assert.equal(s.index,1);
  answer(s,{question:s.current.id,choice:s.current.options.find(id=>id!==s.current.target)},2000);assert.ok(s.complete);assert.equal(s.score,1);assert.equal(s.timeMs,2000);
  assert.throws(()=>answer(s,{},2001),/complete/);
 }
});
test('countries validate names, reject duplicates and apply server hint/time penalties',()=>{
 const s=create({game:'countries',region:'europe',language:'en'},1000);assert.equal(answer(s,{country:'Germany'},2000).country,'Tyskland');assert.equal(answer(s,{country:'Germany'},2001).correct,false);assert.equal(answer(s,{country:'Imaginary'},2002).correct,false);s.hints=2;finish(s,3000);assert.ok(s.score<1100);assert.equal(s.found.length,1);
});
test('API enforces origin, auth, atomic replay protection, completed runs, safe names and ranking',async()=>{
 const {env,db}=fixture();const call=async(...args)=>{const r=await worker.fetch(req(...args),env);return {status:r.status,body:await r.json(),headers:r.headers};};
 assert.equal((await call('/session',{game:'flags'},null,'https://evil.example')).status,403);
 assert.equal((await call('/session',{game:'invented'})).status,400);
 const start=await call('/session',{game:'flags'});assert.equal(start.status,201);const token=start.body.token;assert.match(token,/^[a-f0-9]{64}$/);assert.equal((await call('/answer',{requestId:crypto.randomUUID()})).status,401);
 assert.equal((await call('/publish',{requestId:crypto.randomUUID(),nickname:'Early'},token)).status,400);
 const q=start.body.question,rid=crypto.randomUUID(),a={requestId:rid,question:q.id,choice:q.target,score:999999};
 const first=await call('/answer',a,token);assert.equal(first.body.total,1);const replay=await call('/answer',a,token);assert.deepEqual(replay.body,first.body);assert.equal((await call('/answer',{...a,requestId:crypto.randomUUID()},token)).status,400);
 const next=first.body.question;await call('/answer',{requestId:crypto.randomUUID(),question:next.id,choice:next.options.find(x=>x!==next.target)},token);
 assert.equal((await call('/publish',{requestId:crypto.randomUUID(),nickname:'<script>'},token)).status,400);
 assert.equal((await call('/publish',{requestId:crypto.randomUUID(),nickname:'mail@example.com'},token)).status,400);
 assert.equal((await call('/publish',{requestId:crypto.randomUUID(),nickname:'Test Player'},token)).status,200);
 await call('/publish',{requestId:crypto.randomUUID(),nickname:'Second'},token);assert.equal(db.prepare('SELECT COUNT(*) n FROM scores').get().n,1);
 const rows=await call('/scores?config='+encodeURIComponent(JSON.stringify({game:'flags'})));assert.equal(rows.body.rows[0].nickname,'Test Player');assert.equal(rows.body.rows[0].score,1);assert.equal(rows.headers.get('Access-Control-Allow-Origin'),'https://onlyfag.no');
 const english=await call('/scores?config='+encodeURIComponent(JSON.stringify({game:'flags',language:'en'})));assert.deepEqual(english.body.rows,rows.body.rows,'Norwegian and English read the same stored scores');
 const different=await call('/scores?config='+encodeURIComponent(JSON.stringify({game:'flags',variant:'country-flag-mc'})));assert.equal(different.body.rows.length,0);
 assert.ok(!JSON.stringify(db.prepare('SELECT * FROM request_limits').all()).includes('192.0.2.2'),'No raw IP stored');
 assert.ok(!JSON.stringify(db.prepare('SELECT * FROM sessions').all()).includes(token),'No bearer token stored');
 db.prepare('UPDATE sessions SET expires_at=0').run();assert.equal((await call('/status',{},token)).status,400);await worker.scheduled(null,env);assert.equal(db.prepare('SELECT COUNT(*) n FROM sessions').get().n,0);
});
test('parallel answers score only once',async()=>{
 const {env}=fixture();const start=await (await worker.fetch(req('/session',{game:'flags'}),env)).json(),q=start.question;
 const responses=await Promise.all([1,2].map(()=>worker.fetch(req('/answer',{requestId:crypto.randomUUID(),question:q.id,choice:q.target},start.token),env)));assert.equal(responses.filter(r=>r.status===200).length,1);assert.equal(responses.filter(r=>[400,409].includes(r.status)).length,1);assert.equal((await (await worker.fetch(req('/status',{},start.token),env)).json()).total,1);
});

test('prefetched questions retain server validation and Statle scores all fifty states',()=>{
 const s=create({game:'statle'},1000);assert.equal(s.plan.length,50);assert.equal(new Set(s.targets).size,50);assert.throws(()=>finish(s,1001),/incomplete/);
 const wrong=s.targets[1];assert.equal(answer(s,{question:s.current.id,choice:wrong},1100).correct,false);
 assert.equal(answer(s,{question:s.current.id,choice:s.current.target},1200).points,75);
 assert.throws(()=>answer(s,{question:s.plan[1].id,choice:s.targets[1]},1300),/wrong_question/);
 issue(s,1400);assert.equal(s.current.id,s.plan[1].id);
 assert.equal(answer(s,{question:s.current.id,choice:s.current.target,skip:true},1500).points,0);
 for(let i=2;i<50;i++){issue(s,2000+i*100);const q=s.current;assert.equal(answer(s,{question:q.id,choice:q.target},2001+i*100).points,100);}
 assert.equal(s.score,4875);assert.ok(s.complete);assert.equal(s.results.length,50);
 const mc=create({game:'flags'},0),next=mc.plan[1];assert.throws(()=>answer(mc,{question:next.id,choice:next.target},1),/wrong_question/);answer(mc,{question:mc.current.id,choice:mc.current.target},2);assert.equal(mc.current.id,next.id);
});

test('Norwegian counties validate all fifteen targets with the Statle time/error bands',()=>{
 assert.equal(data.fylker.length,15);assert.equal(new Set(data.fylker).size,15);
 assert.deepEqual([...data.fylker].sort(),['Agder','Akershus','Buskerud','Finnmark','Innlandet','Møre og Romsdal','Nordland','Oslo','Rogaland','Telemark','Troms','Trøndelag','Vestfold','Vestland','Østfold'].sort());
 const s=create({game:'fylker',language:'en'},1000);assert.equal(s.plan.length,15);assert.equal(new Set(s.targets).size,15);assert.throws(()=>finish(s,1001),/incomplete/);
 assert.throws(()=>answer(s,{question:s.current.id,choice:'Ohio'},1002),/invalid_answer/);
 assert.equal(answer(s,{question:s.current.id,choice:s.targets[1]},1100).correct,false);
 assert.equal(answer(s,{question:s.current.id,choice:s.current.target},1200).points,75);
 assert.throws(()=>answer(s,{question:s.plan[1].id,choice:s.targets[1]},1300),/wrong_question/);
 issue(s,1400);assert.throws(()=>answer(s,{question:s.current.id,choice:s.found[0]},1450),/invalid_answer/);
 assert.equal(answer(s,{question:s.current.id,choice:s.current.target,skip:true},1500).points,0);
 for(let i=2;i<15;i++){issue(s,2000+i*100);const q=s.current;assert.equal(answer(s,{question:q.id,choice:q.target},2001+i*100).points,100);}
 assert.equal(s.score,1375);assert.equal(s.results.length,15);assert.equal(s.index,15);assert.ok(s.complete);
 const slow=create({game:'fylker'},0);assert.equal(answer(slow,{question:slow.current.id,choice:slow.current.target},11000).points,50);
 assert.equal(board({game:'fylker',language:'no'}),board({game:'fylker',language:'en'}));assert.notEqual(board({game:'fylker'}),board({game:'statle'}));
});

test('county API supports next, rejects incomplete publication and shares only its own language-independent board',async()=>{
 const {env,db}=fixture(),call=async(url,body,token)=>{const r=await worker.fetch(req(url,body,token),env);return {status:r.status,body:await r.json()};};
 const start=await call('/session',{game:'fylker',language:'no'});assert.equal(start.status,201);assert.equal(start.body.questions.length,15);assert.equal(start.body.questions[0].id,start.body.question.id);const token=start.body.token;
 const mutate=(url,body={})=>call(url,{requestId:crypto.randomUUID(),...body},token);
 assert.equal((await mutate('/finish')).status,400);assert.equal((await mutate('/publish',{nickname:'Early'})).status,400);
 for(let i=0;i<15;i++){
  const q=start.body.questions[i];if(i===0)assert.equal((await mutate('/answer',{question:q.id,choice:start.body.questions[1].target})).body.feedback.correct,false);
  const reply=await mutate('/answer',{question:q.id,choice:q.target,...(i===1?{skip:true}:{})});assert.equal(reply.status,200);assert.equal(reply.body.complete,i===14);
  if(i<14){assert.equal(reply.body.awaitingNext,true);const next=await mutate('/next');assert.equal(next.status,200);assert.equal(next.body.question.id,start.body.questions[i+1].id);}
 }
 const status=await call('/status',{},token);assert.equal(status.body.total,1375);assert.equal(status.body.index,15);assert.equal((await mutate('/next')).status,400);
 assert.equal((await mutate('/publish',{nickname:'County Player'})).status,200);
 const rows=await call('/scores?config='+encodeURIComponent(JSON.stringify({game:'fylker'}))),english=await call('/scores?config='+encodeURIComponent(JSON.stringify({game:'fylker',language:'en'}))),statle=await call('/scores?config='+encodeURIComponent(JSON.stringify({game:'statle'})));
 assert.equal(rows.body.rows.length,1);assert.equal(rows.body.rows[0].score,1375);assert.equal(rows.body.rows[0].nickname,'County Player');assert.deepEqual(english.body.rows,rows.body.rows);assert.deepEqual(statle.body.rows,[]);db.close();
});

test('Kart preserves 197 sovereign countries, includes three regional territories and validates complete continental rounds',()=>{
 const expected={europe:47,asia:47,northAmerica:23,southAmerica:13,africa:55,oceania:15},all=Object.keys(expected).flatMap(region=>data.kart[region]);
 assert.deepEqual(Object.keys(data.kart).filter(k=>!data.kartPhysical.includes(k)).sort(),Object.keys(expected).sort());assert.equal(all.length,200);assert.equal(new Set(all).size,200);
 const geometry=JSON.parse(fs.readFileSync(new URL('../assets/geography/continent-maps.json',import.meta.url),'utf8')),sovereign=Object.values(geometry.regions).flatMap(r=>r.states.filter(s=>!s.territory).map(s=>s.n));assert.equal(sovereign.length,197);assert.deepEqual(sovereign.sort(),[...data.regions.world].sort());
 for(const [region,count]of Object.entries(expected)){
  assert.equal(data.kart[region].length,count);const s=create({game:'kart',region},1000);assert.equal(s.plan.length,count);assert.deepEqual([...s.targets].sort(),[...data.kart[region]].sort());assert.throws(()=>finish(s,1001),/incomplete/);
  const outside=all.find(name=>!s.targets.includes(name));assert.throws(()=>answer(s,{question:s.current.id,choice:outside},1002),/invalid_answer/);
  assert.equal(answer(s,{question:s.current.id,choice:s.targets[1]},1100).correct,false);
  assert.equal(answer(s,{question:s.current.id,choice:s.current.target},1200).points,75);
  for(let i=1;i<count;i++){issue(s,2000+i*100);assert.throws(()=>answer(s,{question:s.current.id,choice:s.found[0]},2001+i*100),/invalid_answer/);assert.equal(answer(s,{question:s.current.id,choice:s.current.target,...(i===1?{skip:true}:{})},2002+i*100).points,i===1?0:100);}
  assert.ok(s.complete);assert.equal(s.score,count*100-125);assert.equal(s.results.length,count);
  assert.equal(board({game:'kart',region,language:'no'}),board({game:'kart',region,language:'en'}));assert.notEqual(board(s.config),board({game:'fylker'}));assert.notEqual(board(s.config),board({game:'statle'}));
 }
 assert.equal(new Set(Object.keys(expected).map(region=>board({game:'kart',region}))).size,6);
 for(const region of [undefined,null,42,['europe'],'world','fylker','__proto__','constructor','Europe'])assert.throws(()=>config({game:'kart',region}),/invalid_config/);
});

test('Kart API keeps continental rankings separate and prefetches only the chosen map targets',async()=>{
 const {env,db}=fixture(),call=async(url,body,token)=>{const r=await worker.fetch(req(url,body,token),env);return {status:r.status,body:await r.json()};};
 const start=await call('/session',{game:'kart',region:'oceania',language:'no'});assert.equal(start.status,201);assert.equal(start.body.questions.length,15);assert.deepEqual(start.body.questions.map(q=>q.target).sort(),[...data.kart.oceania].sort());const token=start.body.token;
 const mutate=(url,body={})=>call(url,{requestId:crypto.randomUUID(),...body},token);
 assert.equal((await mutate('/finish')).status,400);assert.equal((await mutate('/publish',{nickname:'Early'})).status,400);
 assert.equal((await mutate('/answer',{question:start.body.question.id,choice:'Norge'})).status,400);
 for(let i=0;i<15;i++){const q=start.body.questions[i],reply=await mutate('/answer',{question:q.id,choice:q.target});assert.equal(reply.status,200);assert.equal(reply.body.complete,i===14);if(i<14){const next=await mutate('/next');assert.equal(next.status,200);assert.equal(next.body.question.id,start.body.questions[i+1].id);}}
 assert.equal((await mutate('/next')).status,400);assert.equal((await mutate('/publish',{nickname:'Oceania Player'})).status,200);
 const rows=async config=>(await call('/scores?config='+encodeURIComponent(JSON.stringify(config)))).body.rows;
 const norwegian=await rows({game:'kart',region:'oceania'});assert.equal(norwegian.length,1);assert.equal(norwegian[0].nickname,'Oceania Player');assert.equal(norwegian[0].score,1500);assert.deepEqual(await rows({game:'kart',region:'oceania',language:'en'}),norwegian);
 for(const region of ['europe','asia','northAmerica','southAmerica','africa'])assert.deepEqual(await rows({game:'kart',region}),[]);
 assert.deepEqual(await rows({game:'fylker'}),[]);assert.deepEqual(await rows({game:'statle'}),[]);db.close();
});


test('physical Kart shares Statle rules and has normalized, language-independent water category boards',()=>{
 assert.deepEqual([...data.kartPhysical].sort(),['rivers','lakes','mountains'].sort());
 assert.deepEqual(config({game:'kart',region:'rivers',variant:'strict'}),{game:'kart',region:'rivers',language:'no'});
 assert.deepEqual(config({game:'kart',region:'lakes'}).categories,['lakes']);
 const all=['lakes','seas','gulfsStraits'];assert.equal(board({game:'kart',region:'lakes',categories:all}),board({game:'kart',region:'lakes',categories:all.slice().reverse(),language:'en'}));
 assert.notEqual(board({game:'kart',region:'lakes'}),board({game:'kart',region:'lakes',categories:['seas']}));
 for(const categories of [[],null,'lakes',['bogus'],[['lakes']],[{}],['lakes','seas','gulfsStraits','lakes']])assert.throws(()=>config({game:'kart',region:'lakes',categories}),/invalid_config/);
 assert.throws(()=>config({game:'kart',region:'europeWater'}),/invalid_config/);
 for(const [game,region,key]of [['statle',null,'v1:{"game":"statle"}'],['fylker',null,'v1:{"game":"fylker"}'],['kart','europe','v1:{"game":"kart","region":"europe"}']])assert.equal(board({game,...(region?{region}:{})}),key);
});
test('physical maps never auto-advance on misses and use Statle time/error bands',()=>{
 for(const region of data.kartPhysical)for(const misses of [0,1,2,3,5])for(const seconds of [1,7,12]){
  const s=create({game:'kart',region},0),q=s.current,wrong=s.targets[1];assert.throws(()=>finish(s,1),/incomplete/);
  for(let i=0;i<misses;i++){assert.equal(answer(s,{question:q.id,choice:wrong,advance:true,score:99999},i).correct,false);assert.equal(s.index,0);assert.equal(s.awaitingNext,false);}
  const band=Math.max(seconds<=5?0:seconds<=10?1:2,Math.min(misses,3)),r=answer(s,{question:q.id,choice:q.target},seconds*1000);assert.equal(r.band,band);assert.equal(r.points,[100,75,50,0][band]);assert.deepEqual(s.found,[q.target]);
 }
});
test('water rounds include exactly the selected categories and cannot answer unselected features',()=>{
 for(const categories of [['lakes'],['seas'],['gulfsStraits'],['lakes','seas'],['lakes','seas','gulfsStraits']]){
  const s=create({game:'kart',region:'lakes',categories},0),expected=categories.flatMap(g=>data.kartWaterGroups[g]);assert.deepEqual(s.targets.slice().sort(),expected.slice().sort());assert.equal(new Set(s.targets).size,s.targets.length);
  const outside=data.kart.lakes.find(n=>!expected.includes(n));if(outside)assert.throws(()=>answer(s,{question:s.current.id,choice:outside},1),/invalid_answer/);
 }
});
test('physical Kart API validates full rounds, skips, replay safety, shared language and category-specific rankings',async()=>{
 const {env,db}=fixture(),call=async(url,body,token)=>{const r=await worker.fetch(req(url,body,token),env);return {status:r.status,body:await r.json()};};
 for(const region of data.kartPhysical){
  const start=await call('/session',{game:'kart',region,language:'no'});assert.equal(start.status,201);const {token,questions}=start.body,mutate=(url,body={})=>call(url,{requestId:crypto.randomUUID(),...body},token);
  assert.equal(questions.length,region==='lakes'?33:data.kart[region].length);assert.equal((await mutate('/publish',{nickname:'Early'})).status,400);
  const q=questions[0],wrong=questions[1].target;for(let i=0;i<4;i++){const r=await mutate('/answer',{question:q.id,choice:wrong,advance:true});assert.equal(r.body.index,0);assert.equal((await mutate('/next')).body.question.id,q.id);}
  const request={requestId:crypto.randomUUID(),question:q.id,choice:q.target,skip:true},skip=await call('/answer',request,token);assert.equal(skip.body.feedback.points,0);assert.deepEqual((await call('/answer',request,token)).body,skip.body);
  for(let i=1;i<questions.length;i++){await mutate('/next');const r=await mutate('/answer',{question:questions[i].id,choice:questions[i].target});assert.equal(r.status,200);assert.equal(r.body.feedback.points,100);assert.equal(r.body.complete,i===questions.length-1);}
  assert.equal((await mutate('/publish',{nickname:'Map '+region})).status,200);const rows=async c=>(await call('/scores?config='+encodeURIComponent(JSON.stringify(c)))).body.rows,ranked=await rows({game:'kart',region});assert.equal(ranked.length,1);assert.equal(ranked[0].score,(questions.length-1)*100);assert.deepEqual(await rows({game:'kart',region,language:'en'}),ranked);if(region==='lakes')assert.deepEqual(await rows({game:'kart',region,categories:['seas']}),[]);
 }
 assert.equal(db.prepare('SELECT COUNT(*) n FROM scores').get().n,3);db.close();
});

test('language migration preserves scores and active runs and can be repeated',()=>{
 const {db}=fixture();
 for(const game of ['flags','capitals','flagcapital','places','countries','mapwiz'])for(const language of ['no','en']){
  const c=config({game,language,...(game==='mapwiz'?{categories:['flags']}:{} )}),old='v1:'+JSON.stringify(c),key=game+'-'+language;
  db.prepare('INSERT INTO scores VALUES(?,?,?,?,?,?)').run(key,old,key,123,456,789);
  db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?)').run(key,old,JSON.stringify({config:c}),0,10000);
 }
 const migration=fs.readFileSync(new URL('../services/geography-scores/migrations/0001-shared-language-rankings.sql',import.meta.url),'utf8');db.exec(migration);db.exec(migration);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM scores').get().n,12);assert.equal(db.prepare('SELECT COUNT(DISTINCT board) n FROM scores').get().n,6);
 for(const row of db.prepare('SELECT * FROM sessions').all()){
  const c=JSON.parse(row.state_json).config;assert.equal(row.board,board(c));assert.equal(c.language,row.token_hash.endsWith('-en')?'en':'no');
  const score=db.prepare('SELECT * FROM scores WHERE run_hash=?').get(row.token_hash);assert.equal(score.board,row.board);assert.equal(score.score,123);assert.equal(score.time_ms,456);assert.equal(score.nickname,row.token_hash);
 }
 db.close();
});
