import {flashcards} from './flashcards.js?v=20261101-4';
import {pickNext, rememberQuestion} from './engine.js?v=20261101-4';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderConcepts(root){
  root.innerHTML=`<article class="concepts"><h2>Begreper</h2><p class="concept-count">${flashcards.length} begreper</p><dl class="concept-list">${flashcards.map(card=>`<div><dt>${esc(card.term)}</dt><dd>${esc(card.definition)}</dd></div>`).join('')}</dl></article>`;
}

// The deck has its own presentation history and never contributes quiz scores.
export function createFlashcardView({root,getRotation,save,announce}){
  let history=[],position=-1,revealed=false;
  function render({focus=false}={}){
    if(position<0){next({focus});return;}
    const entry=history[position],card=flashcards.find(card=>card.id===entry.id);
    root.innerHTML=`<article class="flashcard-exercise" data-flashcard="${card.id}">
      <h2 class="sr-only">Begreper flashcards</h2>
      <div class="question-meta"><span>Tenk på forklaringen, og snu kortet.</span><span class="task-number">${entry.number} / ${flashcards.length}</span></div>
      <button type="button" id="flip-flashcard" class="flashcard ${revealed?'is-revealed':''}" aria-expanded="${revealed}" aria-controls="flashcard-definition">
        <span class="flashcard-term">${esc(card.term)}</span>
        <span id="flashcard-definition" class="flashcard-definition" ${revealed?'':'hidden'}>${esc(card.definition)}</span>
        <span class="flashcard-flip">${revealed?'↶ Vis begrep':'↶ Vis forklaring'}</span>
      </button>
      <div class="task-actions flashcard-actions"><button type="button" id="previous-flashcard" class="secondary" ${position===0?'disabled':''}>← Forrige</button><button type="button" id="next-flashcard" class="primary">Neste →</button></div>
      <p class="flashcard-shortcuts">← → Bytt kort · Mellomrom: snu</p>
    </article>`;
    if(focus)root.querySelector('#flip-flashcard').focus({preventScroll:true});
  }
  function next({focus=true}={}){
    if(position===history.length-1){
      const rotation=getRotation(),card=pickNext(flashcards,rotation);
      rememberQuestion(rotation,card);
      history.push({id:card.id,number:rotation.seen.filter(id=>flashcards.some(card=>card.id===id)).length});
      save();
    }
    position++;revealed=false;render({focus});
    announce(`Kort ${history[position].number} av ${flashcards.length}. ${flashcards.find(card=>card.id===history[position].id).term}.`);
  }
  function previous(){if(position>0){position--;revealed=false;render({focus:true});announce(flashcards.find(card=>card.id===history[position].id).term);}}
  function flip(){revealed=!revealed;render({focus:true});}
  root.addEventListener('click',event=>{
    if(!event.target.closest('[data-flashcard]'))return;
    const id=event.target.closest('button')?.id;
    if(id==='flip-flashcard')flip();
    if(id==='next-flashcard')next();
    if(id==='previous-flashcard')previous();
  });
  document.addEventListener('keydown',event=>{
    if(!root.querySelector('[data-flashcard]')||document.querySelector('dialog[open],.sidebar.open')||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.target!==document.body&&!event.target.closest('[data-flashcard]'))return;
    if(event.key==='ArrowRight'){event.preventDefault();next();}
    if(event.key==='ArrowLeft'){event.preventDefault();previous();}
    if(event.code==='Space'||event.key===' '){event.preventDefault();if(!event.repeat)flip();}
  });
  return {render,focus(){root.querySelector('#flip-flashcard')?.focus({preventScroll:true});},reset(){history=[];position=-1;revealed=false;}};
}
