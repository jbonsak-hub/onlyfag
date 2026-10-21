import {data,config,board,create,answer,issue,finish,publicQuestion} from './rules.mjs';
const TTL=2*60*60*1000,allowed=new Set(['https://onlyfag.no','https://www.onlyfag.no']);
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const token=()=>{const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');};
function view(s){return {config:s.config,board:board(s.config),question:publicQuestion(s),complete:s.complete,awaitingNext:s.awaitingNext,index:s.index,total:s.score,baseTotal:s.baseTotal,bonusTotal:s.bonusTotal,timeMs:s.timeMs||0,hints:s.hints,found:s.found.length};}
async function limit(request,env,kind,now){
 if(!env.RATE_SECRET)throw Error('unavailable');
 const ip=request.headers.get('CF-Connecting-IP')||'unknown',window=kind==='start'?600000:60000;
 const bucket=await hash(env.RATE_SECRET+':'+Math.floor(now/window)+':'+kind+':'+ip);
 const row=await env.DB.prepare('INSERT INTO request_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,now+window*2).first();
 // A classroom can share one public address; do not limit it to a few pupils.
 if(row.count>(kind==='start'?120:2400))throw Error('rate_limited');
}
async function body(request){const raw=await request.text();if(raw.length>8192)throw Error('invalid_body');try{return JSON.parse(raw);}catch(_){throw Error('invalid_body');}}
async function load(request,env,now){
 const bearer=request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];if(!bearer)throw Error('unauthorized');
 const key=await hash(bearer),row=await env.DB.prepare('SELECT * FROM sessions WHERE token_hash=?').bind(key).first();if(!row||row.expires_at<now)throw Error('expired');
 return {key,row,state:JSON.parse(row.state_json)};
}
async function save(env,session,state){const r=await env.DB.prepare('UPDATE sessions SET state_json=?,revision=revision+1 WHERE token_hash=? AND revision=?').bind(JSON.stringify(state),session.key,session.row.revision).run();if(r.meta.changes!==1)throw Error('retry');}
async function handler(request,env){
 const url=new URL(request.url),now=Date.now();
 if(url.pathname==='/health'&&request.method==='GET')return json({ok:true,version:data.version});
 const origin=request.headers.get('Origin');if(!allowed.has(origin)&&!(env.ALLOW_LOCAL==='true'&&/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin||'')))return json({error:'origin_not_allowed'},403);
 const cors={'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Max-Age':'600'};
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 try{
  await limit(request,env,url.pathname==='/session'?'start':'request',now);
  if(url.pathname==='/scores'&&request.method==='GET'){
   let c;try{c=config(JSON.parse(url.searchParams.get('config')));}catch(_){throw Error('invalid_config');}
   const result=await env.DB.prepare('SELECT nickname,score,time_ms,created_at FROM scores WHERE board=? ORDER BY score DESC,time_ms,created_at LIMIT 10').bind(board(c)).all();return json({rows:result.results},200,cors);
  }
  if(request.method!=='POST')return json({error:'not_found'},404,cors);
  const input=await body(request);
  if(url.pathname==='/session'){
   const state=create(input,now),bearer=token(),key=await hash(bearer);
   await env.DB.prepare('INSERT INTO sessions(token_hash,board,state_json,revision,expires_at) VALUES(?,?,?,0,?)').bind(key,board(state.config),JSON.stringify(state),now+TTL).run();
   return json({token:bearer,...view(state),targets:state.config.game==='mapwiz'?state.targets:undefined},201,cors);
  }
  const session=await load(request,env,now),s=session.state;
  if(url.pathname==='/status')return json(view(s),200,cors);
  if(!/^[a-f0-9-]{20,64}$/.test(input.requestId||''))throw Error('invalid_request_id');
  if(s.lastRequest===input.requestId)return json(s.lastResponse,200,cors);
  if(url.pathname==='/publish'){
   if(!s.complete)throw Error('incomplete');
   if(typeof input.nickname!=='string')throw Error('invalid_nickname');
   const nickname=input.nickname.normalize('NFC').trim().replace(/\s+/g,' ');
   if(nickname.length<1||nickname.length>24||/[\p{C}<>@]|https?:|www\./iu.test(nickname))throw Error('invalid_nickname');
   await env.DB.prepare('INSERT OR IGNORE INTO scores(run_hash,board,nickname,score,time_ms,created_at) VALUES(?,?,?,?,?,?)').bind(session.key,session.row.board,nickname,Math.round(s.score*10)/10,s.timeMs,now).run();
   return json({saved:true,...view(s)},200,cors);
  }
  let feedback={};
  if(url.pathname==='/answer')feedback=answer(s,input,now);
  else if(url.pathname==='/next'){
   if(s.config.game!=='mapwiz'||s.complete)throw Error('invalid_action');
   // Repeating next cannot reset the clock for an already issued question.
   if(s.awaitingNext)issue(s,now);
  }else if(url.pathname==='/hint'){
   if(s.config.game!=='countries'||s.complete)throw Error('invalid_action');s.hints++;
  }else if(url.pathname==='/finish')finish(s,now);
  else return json({error:'not_found'},404,cors);
  const response={...view(s),feedback};s.lastRequest=input.requestId;s.lastResponse=response;await save(env,session,s);return json(response,200,cors);
 }catch(error){const message=['invalid_config','invalid_answer','invalid_body','invalid_nickname','invalid_request_id','invalid_action','wrong_question','incomplete','complete','expired','unauthorized','rate_limited','retry'].includes(error.message)?error.message:'unavailable';const status=message==='rate_limited'?429:message==='unavailable'?503:message==='unauthorized'?401:message==='retry'?409:400;return json({error:message},status,{...cors,...(status===429?{'Retry-After':'60'}:{})});}
}
export default {
 fetch:handler,
 async scheduled(_event,env){const now=Date.now();await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now),env.DB.prepare('DELETE FROM request_limits WHERE expires_at<?').bind(now)]);}
};
