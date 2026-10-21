/* Mobile answer buttons reuse each engine's normal guessing and history. */
(() => {
 const worldle=document.body.dataset.quiz==='detective2';
 const tradle=new URLSearchParams(location.search).get('quiz')==='tradle';
 if(!worldle&&!tradle)return;
 const mobile=matchMedia('(max-width:700px),(max-width:1000px) and (max-height:500px)');
 let mountedInput=null,choices=null,currentTarget=null,round=null,buttons=[];
 const shuffle=items=>{const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 function model(){
  if(worldle){
   if(typeof worldTrainerState==='undefined'||worldTrainerState?.mode!=='detective2')return null;
   const s=worldTrainerState;
   return {input:document.getElementById('worldle-answer'),target:s.target,round:s.round,pool:()=>s.pool.map(c=>c.country),used:s.guesses.map(g=>g.country),done:s.locked,submit:()=>submitKartdetektivGuess()};
  }
  if(typeof state==='undefined')return null;
  const s=state.tradle;
  return {input:document.getElementById('tradleGuess'),target:s.target,round:s.loadSeq,pool:()=>[...TRADLE_DATA,...TRADLE_ONLINE_TARGETS,...TRADLE_EXTRA_GUESSES].map(c=>c.country).filter(n=>!tradleIsExcluded(n)&&tradleProfileByName(n)),used:s.guesses.map(g=>g.profile.country),done:s.solved,submit:()=>submitTradleGuess()};
 }
 function refresh(){
  const s=model();if(!s?.input)return;
  if(mountedInput!==s.input){
   mountedInput=s.input;currentTarget=null;round=null;
   choices=document.createElement('div');choices.className='quiz-mobile-answers';choices.setAttribute('role','group');choices.setAttribute('aria-label','Velg et land');
   const row=worldle?s.input.closest('.worldle-input-row'):s.input.closest('.field');row.after(choices);
   row.classList.add('quiz-mobile-answer-input');
   if(tradle)document.getElementById('tradleSubmit').classList.add('quiz-mobile-answer-input');
  }
  choices.hidden=!mobile.matches||!s.target;
  if(!mobile.matches)return;
  if(!s.target){if(choices.childNodes.length)choices.replaceChildren();currentTarget=null;return;}
  if(currentTarget!==s.target||round!==s.round){
   currentTarget=s.target;round=s.round;
   const target=s.target.country;
   const pool=[...new Set(s.pool())].filter(n=>n!==target);
   // Keep this set stable through wrong guesses, language changes and resizing.
   buttons=shuffle([target,...shuffle(pool).slice(0,5)]).map(country=>{
    const button=document.createElement('button');button.type='button';button.dataset.country=country;button.textContent=country;
    button.addEventListener('click',()=>{const now=model();if(!mobile.matches||now.done||now.used.includes(country))return;now.input.value=country;now.submit();refresh();});
    return button;
   });
   choices.replaceChildren(...buttons);
  }
  for(const button of buttons){const used=s.used.includes(button.dataset.country);button.disabled=s.done||used;button.classList.toggle('is-tried',used);}
 }
 const root=worldle?document.querySelector('main.content'):document.getElementById('tradle');
 new MutationObserver(refresh).observe(root,{childList:true,subtree:true,characterData:true});
 mobile.addEventListener('change',refresh);refresh();
})();
