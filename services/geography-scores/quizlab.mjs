import {normalizeQuiz,catalogView,createQuizSession,advanceClock,viewSession,answerQuizSession,finishQuizSession} from './quizlab-rules.mjs';
import schema from './quizlab-schema.json' with {type:'json'};

const schemaReady=new WeakMap();
// Fixed, generated additive DDL only. Coalesce concurrent first requests on
// each D1 binding; failed setup is never cached as successful.
export function ensureQuizlabSchema(env){
 let pending=schemaReady.get(env.DB);
 if(!pending){
  pending=Promise.resolve().then(()=>env.DB.batch(schema.statements.map(statement=>env.DB.prepare(statement)))).catch(error=>{
   if(schemaReady.get(env.DB)===pending)schemaReady.delete(env.DB);
   throw error;
  });
  schemaReady.set(env.DB,pending);
 }
 return pending;
}

const TTL=2*60*60*1000;
const json=(value,status,cors)=>new Response(JSON.stringify(value),{status:status??200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...cors}});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
const randomToken=()=>{const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');};
const bearer=request=>request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
const fail=message=>{throw Error(message);};
async function readBody(request){const text=await request.text();if(text.length>16384)fail('invalid_body');try{const value=JSON.parse(text);if(!value||Array.isArray(value)||typeof value!=='object')fail('invalid_body');return value;}catch{fail('invalid_body');}}
async function getQuiz(env,slug,version){
 const row=await env.DB.prepare('SELECT q.slug,q.current_version,q.admin_hash,q.created_at,q.updated_at,v.config_json,v.id AS version FROM quizlab_quizzes q JOIN quizlab_versions v ON v.id=COALESCE(?,q.current_version) AND v.slug=q.slug WHERE q.slug=?').bind(version??null,slug).first();
 if(!row)fail('not_found');
 return {row,quiz:{slug:row.slug,version:row.version,...JSON.parse(row.config_json),createdAt:row.created_at,updatedAt:row.updated_at}};
}
async function getSession(request,env,now){
 const token=bearer(request);if(!token)fail('unauthorized');const key=await hash(token);
 const row=await env.DB.prepare('SELECT * FROM quizlab_sessions WHERE token_hash=?').bind(key).first();if(!row||row.expires_at<=now)fail('expired');
 return {key,row,state:JSON.parse(row.state_json)};
}
async function saveSession(env,session){
 const result=await env.DB.prepare('UPDATE quizlab_sessions SET state_json=?,revision=revision+1 WHERE token_hash=? AND revision=?').bind(JSON.stringify(session.state),session.key,session.row.revision).run();
 if(result.meta.changes!==1)fail('retry');
}
export async function handleQuizlab(request,env,{now=Date.now(),cors={}}={}){
 const url=new URL(request.url);
 try{
  await ensureQuizlabSchema(env);
  if(url.pathname==='/quizlab/catalog'&&request.method==='GET')return json(catalogView(),200,cors);
  const route=url.pathname.match(/^\/quizlab\/quizzes\/([a-z0-9-]+)(?:\/(sessions|scores))?$/);
  if(request.method==='GET'&&route){
   const {row,quiz}=await getQuiz(env,route[1],route[2]==='scores'?url.searchParams.get('version')||undefined:undefined);
   if(!route[2]&&request.headers.has('Authorization')){const token=bearer(request);if(!token||await hash(token)!==row.admin_hash)fail('unauthorized');}
   if(!route[2])return json({quiz},200,cors);
   if(route[2]!=='scores')fail('not_found');
   const order=quiz.mode==='accuracy'?'accuracy DESC,correct DESC,time_ms,created_at':'correct DESC,accuracy DESC,time_ms,created_at';
   const rows=await env.DB.prepare('SELECT nickname,correct,answered,accuracy,time_ms,created_at FROM quizlab_scores WHERE slug=? AND version=? ORDER BY '+order+' LIMIT 10').bind(quiz.slug,quiz.version).all();
   return json({quiz,rows:rows.results},200,cors);
  }
  if(request.method!=='POST')fail('not_found');
  const input=await readBody(request);
  if(url.pathname==='/quizlab/quizzes'){
   if(typeof input.slug!=='string'||!/^quiz[a-z0-9-]{1,32}$/.test(input.slug)||input.slug.endsWith('-'))fail('invalid_slug');
   if(input.adminToken!==undefined&&(typeof input.adminToken!=='string'||!/^[a-f0-9]{64}$/.test(input.adminToken)))fail('invalid_config');
   const config=normalizeQuiz(input),version=crypto.randomUUID(),adminToken=input.adminToken??randomToken(),adminHash=await hash(adminToken);
   const existingCreation=async()=>{
    const existing=await env.DB.prepare('SELECT q.slug,q.current_version,q.admin_hash,q.created_at,q.updated_at,v.config_json FROM quizlab_quizzes q JOIN quizlab_versions v ON v.id=q.current_version WHERE q.slug=?').bind(input.slug).first();
    if(!existing)return null;
    if(existing.admin_hash!==adminHash||existing.config_json!==JSON.stringify(config))fail('slug_taken');
    return json({quiz:{slug:existing.slug,version:existing.current_version,...config,createdAt:existing.created_at,updatedAt:existing.updated_at},adminToken,url:'/'+existing.slug},200,cors);
   };
   const replay=await existingCreation();if(replay)return replay;
   // Both rows are inserted atomically: a conflicting slug cannot replace a quiz.
   try{await env.DB.batch([
    env.DB.prepare('INSERT INTO quizlab_versions(id,slug,config_json,created_at) VALUES(?,?,?,?)').bind(version,input.slug,JSON.stringify(config),now),
    env.DB.prepare('INSERT INTO quizlab_quizzes(slug,current_version,admin_hash,created_at,updated_at) VALUES(?,?,?,?,?)').bind(input.slug,version,adminHash,now,now)
   ]);}catch(error){if(/UNIQUE|constraint/i.test(error.message)){const replay=await existingCreation();if(replay)return replay;fail('slug_taken');}throw error;}
   return json({quiz:{slug:input.slug,version,...config,createdAt:now,updatedAt:now},adminToken,url:'/'+input.slug},201,cors);
  }
  if(route&&!route[2]){
   const {row,quiz}=await getQuiz(env,route[1]),token=bearer(request);
   if(!token||await hash(token)!==row.admin_hash)fail('unauthorized');
   if(input.version!==quiz.version)fail('version_changed');
   const config=normalizeQuiz(input),version=crypto.randomUUID();
   const results=await env.DB.batch([
    env.DB.prepare('INSERT INTO quizlab_versions(id,slug,config_json,created_at) VALUES(?,?,?,?)').bind(version,quiz.slug,JSON.stringify(config),now),
    env.DB.prepare('UPDATE quizlab_quizzes SET current_version=?,updated_at=? WHERE slug=? AND current_version=? AND admin_hash=?').bind(version,now,quiz.slug,quiz.version,row.admin_hash)
   ]);
   if(results[1].meta.changes!==1)fail('version_changed');
   return json({quiz:{slug:quiz.slug,version,...config,createdAt:quiz.createdAt,updatedAt:now},url:'/'+quiz.slug},200,cors);
  }
  if(route?.[2]==='sessions'){
   const {quiz}=await getQuiz(env,route[1]);if(input.version!==undefined&&input.version!==quiz.version)fail('version_changed');
   const state=createQuizSession(quiz,now),token=randomToken(),key=await hash(token);
   await env.DB.prepare('INSERT INTO quizlab_sessions(token_hash,slug,version,state_json,revision,expires_at) VALUES(?,?,?,?,0,?)').bind(key,quiz.slug,quiz.version,JSON.stringify(state),now+Math.max(TTL,quiz.mode==='fixed'?quiz.questionCount*quiz.secondsPerQuestion*1000+3600000:TTL)).run();
   return json({token,...viewSession(state,now)},201,cors);
  }
  if(!['/quizlab/status','/quizlab/answer','/quizlab/finish','/quizlab/publish'].includes(url.pathname))fail('not_found');
  const session=await getSession(request,env,now),s=session.state;
  if(url.pathname==='/quizlab/status'){
   if(advanceClock(s,now))await saveSession(env,session);
   return json(viewSession(s,now),200,cors);
  }
  if(typeof input.requestId!=='string'||!/^[a-f0-9-]{20,64}$/.test(input.requestId))fail('invalid_request_id');
  const signature=await hash(url.pathname+JSON.stringify(input));
  if(s.lastRequest===input.requestId){if(s.lastSignature!==signature)fail('request_id_conflict');return json(s.lastResponse,200,cors);}
  const expired=advanceClock(s,now);
  if(url.pathname==='/quizlab/publish'){
   if(!s.complete)fail('incomplete');
   const nickname=typeof input.nickname==='string'?input.nickname.normalize('NFC').trim().replace(/\s+/g,' '):'';
   if(!nickname||nickname.length>24||/[\p{C}<>@]|https?:|www\./iu.test(nickname))fail('invalid_nickname');
   if(expired)await saveSession(env,session);
   await env.DB.prepare('INSERT OR IGNORE INTO quizlab_scores(run_hash,slug,version,nickname,correct,answered,accuracy,time_ms,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(session.key,s.quiz.slug,s.quiz.version,nickname,s.correct,s.answered,s.answered?s.correct/s.answered*100:0,s.timeMs,now).run();
   return json({saved:true,...viewSession(s,now)},200,cors);
  }
  let feedback;
  if(url.pathname==='/quizlab/answer'){
   // A delayed answer for the just-expired question never answers the next one.
   if(expired&&input.question!==s.current?.question.id)feedback={correct:false,expired:true};
   else feedback=answerQuizSession(s,input,now);
  }else finishQuizSession(s,now);
  const response={...viewSession(s,now),...(feedback?{feedback}:{})};
  s.lastRequest=input.requestId;s.lastSignature=signature;s.lastResponse=response;await saveSession(env,session);
  return json(response,200,cors);
 }catch(error){
  const statuses={not_found:404,unauthorized:401,slug_taken:409,version_changed:409,retry:409,request_id_conflict:409,invalid_slug:400,invalid_title:400,invalid_config:400,too_few_questions:400,invalid_body:400,expired:400,invalid_request_id:400,invalid_nickname:400,invalid_answer:400,wrong_question:400,incomplete:400,complete:400};
  const message=Object.hasOwn(statuses,error.message)?error.message:'unavailable';
  return json({error:message},statuses[message]??503,cors);
 }
}
export async function cleanupQuizlab(env,now=Date.now()){
 await ensureQuizlabSchema(env);
 return env.DB.prepare('DELETE FROM quizlab_sessions WHERE expires_at<?').bind(now).run();
}
