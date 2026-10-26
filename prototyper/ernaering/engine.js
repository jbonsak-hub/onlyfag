// Pure assessment and repetition rules; no DOM or network dependencies.
export const STORE_KEY = 'onlyfag.nutrition.v1';
export const topics = {digestion:'Fordøyelsen',carbs:'Karbohydrater',protein:'Proteiner',fat:'Fett',micro:'Vitaminer, mineraler og vann',energy:'Energi og blodsukker'};
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
