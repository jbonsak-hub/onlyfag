const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function placementUI(q,s){
 const fixed=i=>s.done||s.locked.has(i),mark=i=>s.marks[i]===true?'correct':s.marks[i]===false?'wrong':'';
 const instruction='<p class="placement-instruction">Dra en brikke, eller velg brikke og plassering.</p>';
 if(q.type==='match'){
  const bank=s.right.map((value,index)=>{
   const row=s.values.indexOf(value),locked=row>=0&&fixed(row);
   return `<button type="button" class="term-chip ${s.selectedTerm===value?'selected':''} ${row>=0?'assigned':''} ${locked?'fixed':''}" id="term-${index}" data-term="${index}" data-value="${esc(value)}" draggable="${!s.done&&!locked}" aria-pressed="${s.selectedTerm===value}" ${s.done||locked?'disabled':''}>${esc(value)}</button>`;
  }).join('');
  const targets=q.pairs.map((pair,i)=>`<div class="placement-row ${mark(i)}"><span class="placement-label" id="placement-label-${i}">${esc(pair.left)}</span><button type="button" class="placement-target ${s.values[i]?'filled':''}" id="place-${i}" data-place="${i}" aria-labelledby="placement-label-${i} placement-value-${i}" ${s.marks[i]!==undefined?`aria-describedby="placement-status-${i}"`:""} ${fixed(i)?'disabled':''}><span id="placement-value-${i}">${esc(s.values[i]||'Slipp her')}</span>${s.marks[i]===true?`<span id="placement-status-${i}" class="placement-mark" aria-label="Riktig">✓</span>`:s.marks[i]===false?`<span id="placement-status-${i}" class="placement-mark" aria-label="Prøv igjen">×</span>`:''}</button></div>`).join('');
  return instruction+`<div class="match-board ${q.pairs.length<=3?'short-match':''} ${q.figure==='nutrient-map'?'map-match':''}"><div class="term-bank" role="group" aria-label="Brikker">${bank}</div><div class="placement-targets">${targets}</div></div>`;
 }
 const chip=i=>`<button type="button" class="term-chip ${s.selectedItem===i?'selected':''} ${fixed(i)?'fixed':''} ${mark(i)}" id="sort-item-${i}" data-sort-item="${i}" draggable="${!fixed(i)}" aria-pressed="${s.selectedItem===i}" ${fixed(i)?'disabled':''}>${esc(q.items[i].label)}${s.marks[i]===false?'<span class="placement-mark" aria-label="Prøv igjen"> ×</span>':''}</button>`;
 const unplaced=q.items.map((_,i)=>i).filter(i=>!s.values[i]);
 return instruction+`<div class="sort-board"><div class="sort-bank" data-sort-bank role="group" aria-label="Brikker som skal plasseres">${unplaced.map(chip).join('')}${!unplaced.length?'<span class="empty-bank">Alle brikkene er plassert.</span>':''}</div>${!s.done&&s.selectedItem!==null&&s.selectedItem!==undefined&&s.values[s.selectedItem]?'<button type="button" class="text-button return-brick" data-return-bank>Tilbake til brikkene</button>':''}<div class="sort-groups" style="--group-count:${Math.min(q.groups.length,3)}">${q.groups.map((group,groupIndex)=>`<section class="sort-group" data-drop-group="${esc(group)}"><button type="button" class="sort-group-heading" id="sort-group-${groupIndex}" data-group="${esc(group)}" ${s.done?'disabled':''}>${esc(group)}</button><div class="sort-group-items">${q.items.map((_,i)=>i).filter(i=>s.values[i]===group).map(chip).join('')}</div></section>`).join('')}</div></div>`;
}
export function placeMatch(q,s,index,value){
 if(s.done||s.locked.has(index)||!Number.isInteger(index)||index<0||index>=q.pairs.length||!s.right.includes(value))return false;
 const old=s.values.indexOf(value);if(old>=0&&s.locked.has(old))return false;
 if(old>=0&&old!==index){s.values[old]='';s.marks[old]=undefined;}
 s.values[index]=value;s.marks[index]=undefined;s.selectedTerm=null;return true;
}
export function placeSort(q,s,index,group){
 if(s.done||s.locked.has(index)||!Number.isInteger(index)||index<0||index>=q.items.length||(group!==''&&!q.groups.includes(group)))return false;
 s.values[index]=group;s.marks[index]=undefined;s.selectedItem=null;return true;
}
