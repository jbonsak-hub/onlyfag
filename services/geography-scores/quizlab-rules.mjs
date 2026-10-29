import data from './data.json' with {type:'json'};
import catalog from '../../assets/quizlab/catalog.json' with {type:'json'};
import {shuffle,distance} from './rules.mjs';

const modes=new Set(['accuracy','correct','fixed']);
const modules=new Map(catalog.modules.map(module=>[module.id,module]));
const countries=new Map(data.countries.map(country=>[country.id,country]));
const locations=new Map(Object.values(data.mapwiz).flat().map(target=>[target.id,target]));
const integer=(value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
const fail=message=>{throw Error(message);};
export function normalizeQuiz(input){
 if(!input||typeof input!=='object'||!modes.has(input.mode))fail('invalid_config');
 const title=typeof input.title==='string'?input.title.normalize('NFC').trim().replace(/\s+/g,' '):'';
 if(!title||title.length>100||/[\p{C}<>]/u.test(title))fail('invalid_title');
 const minutes=input.minutes??5,questionCount=input.questionCount??20,secondsPerQuestion=input.secondsPerQuestion??15;
 if(!integer(minutes,1,60)||!integer(questionCount,1,500)||!integer(secondsPerQuestion,5,120))fail('invalid_config');
 if(!Array.isArray(input.categories)||!input.categories.length||input.categories.length>modules.size)fail('invalid_config');
 const seen=new Set();const categories=input.categories.map(value=>{
  const c=typeof value==='string'?{id:value}:value;
  if(!c||typeof c.id!=='string'||!modules.has(c.id)||seen.has(c.id))fail('invalid_config');seen.add(c.id);
  if(c.id==='mapwiz'){const difficulty=c.difficulty??'easy';if(!['easy','medium','hard'].includes(difficulty))fail('invalid_config');return {id:c.id,difficulty};}
  if(c.difficulty!==undefined)fail('invalid_config');return {id:c.id};
 });
 // Every selected category must actually receive a question in a fixed test.
 if(input.mode==='fixed'&&questionCount<categories.length)fail('too_few_questions');
 return {title,mode:input.mode,minutes,questionCount,secondsPerQuestion,categories};
}
export function catalogView(){return {version:catalog.version,modules:catalog.modules.map(({targets,...module})=>({...module,poolSize:targets.length})),categories:catalog.modules.map(module=>({id:module.id,title:module.label||module.title,group:module.group,type:module.type,count:module.targets.length})),modes:[...modes],defaults:{minutes:5,questionCount:20,secondsPerQuestion:15}};}
function targetPool(category){
 if(category.id==='mapwiz')return data.mapwizDifficulties[category.difficulty];
 return modules.get(category.id).targets;
}
function categoryAt(s,index){
 const length=s.quiz.categories.length;
 if(s.quiz.mode!=='fixed')return s.quiz.categories[Math.floor(index/Math.ceil(10*s.quiz.minutes/length))%length];
 const base=Math.floor(s.quiz.questionCount/length),extra=s.quiz.questionCount%length;
 let offset=0;
 for(let i=0;i<length;i++){const size=base+(i<extra?1:0);if(index<offset+size)return s.quiz.categories[i];offset+=size;}
 fail('complete');
}
function nextTarget(s,category){
 let bucket=s.buckets[category.id];
 if(!bucket?.length){bucket=shuffle(targetPool(category));if(!bucket.length)fail('invalid_config');s.buckets[category.id]=bucket;}
 return bucket.pop();
}
function makeQuestion(s,issuedAt){
 const category=categoryAt(s,s.answered),module=modules.get(category.id),target=nextTarget(s,category);
 const question={id:crypto.randomUUID(),module:module.id,moduleId:module.id,type:module.type,mapKey:module.mapKey};
 let answer=target,answerLabel=target,location;
 if(module.id==='flags'||module.id==='capitals'||module.id==='worldle'){
  const country=countries.get(target);if(!country)fail('invalid_config');
  const label=id=>module.id==='capitals'?countries.get(id)?.capital:id;
  const used=new Set([label(target)]),options=[target];
  for(const id of shuffle(targetPool(category))){const name=label(id);if(name&&!used.has(name)){used.add(name);options.push(id);}if(options.length===4)break;}
  question.options=shuffle(options).map(id=>({id,label:label(id)}));answerLabel=label(target);
  if(module.id==='flags'){question.prompt='Hvilket land har dette flagget?';question.flag=country.flagCode;}
  else if(module.id==='capitals'){question.prompt='Hva er hovedstaden i '+country.country+'?';question.flag=country.hasFlag?country.flagCode:undefined;}
  else{question.prompt='Hvilket land viser omrisset?';question.silhouette=catalog.silhouettes[target];if(!question.silhouette)fail('invalid_config');}
 }else if(module.id==='mapwiz'){
  location=locations.get(target);if(!location)fail('invalid_config');
  question.targetName=location.name;question.prompt='Finn '+location.name+' på kartet.';question.mapKey='world';answerLabel=location.name;
  if(location.category==='flags'){question.flag=countries.get(location.name)?.flagCode;question.prompt='Finn '+location.name+' på kartet.';}
 }else{question.targetName=target;question.prompt='Finn '+target+' på kartet.';}
 return {question,answer,answerLabel,location,issuedAt};
}
export function createQuizSession(quiz,now){
 const s={quiz,startedAt:now,deadline:quiz.mode==='fixed'?null:now+quiz.minutes*60000,answered:0,correct:0,complete:false,buckets:{},current:null,timeMs:0};
 s.current=makeQuestion(s,now);return s;
}
const questionEnd=s=>Math.min(s.current.issuedAt+s.quiz.secondsPerQuestion*1000,s.deadline??Infinity);
function record(s,correct,now){
 s.answered++;if(correct)s.correct++;
 if((s.quiz.mode==='fixed'&&s.answered>=s.quiz.questionCount)||(s.deadline!==null&&now>=s.deadline)){
  s.complete=true;s.timeMs=Math.max(0,(s.deadline??now)-s.startedAt);s.current=null;s.buckets={};
 }else s.current=makeQuestion(s,now);
}
export function advanceClock(s,now){
 let expired=0;
 while(!s.complete&&now>=questionEnd(s)){const end=questionEnd(s);record(s,false,end);expired++;}
 return expired;
}
export function viewSession(s,now){
 return {quiz:s.quiz,question:s.complete?null:s.current.question,index:s.answered,total:s.quiz.mode==='fixed'?s.quiz.questionCount:null,correct:s.correct,answered:s.answered,accuracy:s.answered?Math.round(s.correct/s.answered*10000)/100:0,complete:s.complete,serverNow:now,deadline:s.deadline,questionDeadline:s.complete?null:questionEnd(s),remainingMs:s.complete?0:s.deadline===null?null:Math.max(0,s.deadline-now),questionRemainingMs:s.complete?0:Math.max(0,questionEnd(s)-now),timeMs:s.complete?s.timeMs:Math.max(0,now-s.startedAt)};
}
export function answerQuizSession(s,input,now){
 if(s.complete)fail('complete');
 if(input.question!==s.current.question.id)fail('wrong_question');
 let correct=false,km;
 if(input.skip!==undefined&&input.skip!==true)fail('invalid_answer');
 if(!input.skip){
  const kind=s.current.question.type;
  if(kind==='choice'){
   if(typeof input.choiceId!=='string'||!s.current.question.options.some(option=>option.id===input.choiceId))fail('invalid_answer');
   correct=input.choiceId===s.current.answer;
  }else if(kind==='target'){
   if(typeof input.targetId!=='string'||!modules.get(s.current.question.module).targets.includes(input.targetId))fail('invalid_answer');
   correct=input.targetId===s.current.answer;
  }else{
   if(typeof input.lat!=='number'||!Number.isFinite(input.lat)||input.lat < -90||input.lat>90||typeof input.lon!=='number'||!Number.isFinite(input.lon)||input.lon < -180||input.lon>180)fail('invalid_answer');
   km=distance(s.current.location,{lat:input.lat,lon:input.lon});correct=km<=90;
  }
 }
 const feedback={correct,answerLabel:s.current.answerLabel,...(s.current.location?{lat:s.current.location.lat,lon:s.current.location.lon,...(km===undefined?{}:{distanceKm:Math.round(km)})}:{})};
 record(s,correct,now);return feedback;
}
export function finishQuizSession(s,now){advanceClock(s,now);if(!s.complete)fail('incomplete');return s;}
