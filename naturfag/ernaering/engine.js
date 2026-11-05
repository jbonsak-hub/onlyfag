// Pure assessment and repetition rules; no DOM or network dependencies.
export const STORE_KEY = 'onlyfag.nutrition.v1';
export const topics = {carbs:'Karbohydrater',protein:'Proteiner',fat:'Fett',micro:'Vitaminer, mineraler og vann',digestion:'Fordøyelsen',energy:'Energi og blodsukker'};
export const types = {anatomy:'Plasser organer',process:'Velg i figur',choice:'Velg ett',multi:'Velg flere',sort:'Sorter',match:'Koble sammen',order:'Rekkefølge',fill:'Fyll inn',open:'Forklar selv'};
export function shuffle(items, rng = Math.random) {
  const a = [...items];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
export function mixedOrder(items) {
  const a=shuffle(items);
  if(a.length>1 && a.every((x,i)=>x===items[i])) a.push(a.shift());
  return a;
}
export function normalize(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('nb').trim().replace(/\s+/g,' ').replace(/[–−]/g,'-').replace(/(\d),(\d)/g,'$1.$2');
}
export function accepts(value, blank) {
  let v=normalize(value);
  if(blank.unit) v=v.replace(new RegExp('\\s*'+blank.unit+'$','i'),'').trim();
  return blank.answers.some(a=>{
    const n=normalize(a).replace(blank.unit ? new RegExp('\\s*'+blank.unit+'$','i') : /$^/,'').trim();
    return v===n || (/^[+-]?\d+(\.\d+)?$/.test(v) && /^[+-]?\d+(\.\d+)?$/.test(n) && Number(v)===Number(n));
  });
}
export function evaluate(q, values, organIds=[]) {
  let marks=[];
  if(q.type==='choice') marks=[values[0]===q.answer];
  if(q.type==='multi' || q.type==='process') {
    const universe=q.type==='multi'?q.options:organIds;
    marks=universe.map(v=>values.includes(v)===q.answer.includes(v));
  }
  if(q.type==='sort') marks=q.items.map((x,i)=>values[i]===x.group);
  if(q.type==='match') marks=q.pairs.map((x,i)=>values[i]===x.right);
  if(q.type==='order') marks=q.items.map((x,i)=>values[i]===x);
  if(q.type==='fill') marks=q.blanks.map((x,i)=>accepts(values[i],x));
  if(q.type==='anatomy') marks=organIds.map((x,i)=>values[i]===x);
  return {marks,correct:marks.length>0&&marks.every(Boolean),count:marks.filter(Boolean).length,total:marks.length};
}
export function needsReview(record, now=Date.now()) {
  return !!record && (record.status==='review' || Number(record.due)<=now);
}
export function resultRecord(previous={}, outcome, now=Date.now()) {
  const assisted=outcome.assisted || Number(previous.assistedUntil)>now;
  const status=outcome.self ? (outcome.confident&&!assisted?'self':'review') : (outcome.correct&&!assisted?'independent':'review');
  const streak=status==='independent'?(previous.streak||0)+1:0;
  const days=[1,3,7,14][Math.min(Math.max(streak-1,0),3)];
  return {status,mode:outcome.self?'self':'auto',completed:!!outcome.completed,last:now,
    attempts:(previous.attempts||0)+1,streak,due:now+(status==='review'?600000:days*86400000),
    assistedUntil:assisted?Math.max(Number(previous.assistedUntil)||0,now+600000):0};
}

// Presentation history is separate from assessment: skipping still counts as seeing.
// Retain a shuffled cycle across theme/filter switches and page reloads.
export function pickNext(pool, rotation={seen:[],recent:[]}, records={}, rng=Math.random) {
  if(!pool.length)return null;
  const seen=new Set(rotation.seen||[]);
  let eligible=pool.filter(q=>!seen.has(q.id));
  if(!eligible.length){
    const ids=new Set(pool.map(q=>q.id));
    rotation.seen=(rotation.seen||[]).filter(id=>!ids.has(id));
    eligible=[...pool];
  }
  const recent=(rotation.recent||[]).slice(-10);
  // Relax oldest cooldown entries only when a small pool leaves no candidate.
  let protectedPool=[];
  for(let n=0;n<=recent.length;n++){
    const blocked=new Set(recent.slice(n).map(x=>x.id));
    protectedPool=eligible.filter(q=>!blocked.has(q.id));
    if(protectedPool.length)break;
  }
  const families=new Set(recent.slice(-3).map(x=>x.family).filter(Boolean));
  const varied=protectedPool.filter(q=>!families.has(q.family||q.figure||q.id));
  let candidates=varied.length?varied:protectedPool;
  // Due work is mixed with new items, never allowed to override rotation.
  const due=candidates.filter(q=>needsReview(records[q.id]));
  if(due.length && rng()<.35)candidates=due;
  return candidates[Math.min(candidates.length-1,Math.floor(rng()*candidates.length))];
}
export function rememberQuestion(rotation,q) {
  rotation.seen=[...new Set([...(rotation.seen||[]),q.id])];
  rotation.recent=[...(rotation.recent||[]),{id:q.id,family:q.family||q.figure||q.id}].slice(-10);
  return rotation;
}

// Rolling assessment results are independent of spaced review and self-assessment.
// An automatic question contributes only its first submitted result per presentation.
export function recentSummary(history={},topic='all') {
  const results=(Array.isArray(history?.[topic])?history[topic]:[])
    .filter(result=>typeof result?.ok==='boolean').slice(-20);
  const correct=results.filter(result=>result.ok).length;
  return {percent:results.length?Math.round(100*correct/results.length):null,count:results.length,correct};
}
export function recordRecentResult(history={},topic,correct,now=Date.now()) {
  if(!Object.hasOwn(topics,topic))return history;
  const next={...history};
  for(const key of [topic,'all']){
    const results=(Array.isArray(history?.[key])?history[key]:[]).filter(result=>typeof result?.ok==='boolean');
    next[key]=[...results,{ok:!!correct,t:now}].slice(-20);
  }
  return next;
}
