const bands = {
  radio:'Radiobølger',
  micro:'Mikrobølger',
  infrared:'Infrarød stråling',
  visible:'Synlig lys',
  ultraviolet:'Ultrafiolett stråling',
  xray:'Røntgenstråling',
  gamma:'Gammastråling'
};
const frequencyOrder = ['radio','micro','infrared','visible','ultraviolet','xray','gamma'];
const bankOrder = ['xray','radio','visible','gamma','infrared','ultraviolet','micro'];

const orderFigure = `<div class="em-order" data-em-order>
  <div class="em-order-columns">
    <div>
      <p class="em-order-end">Brikker</p>
      <div class="em-order-bank" data-em-order-bank role="group" aria-label="Brikker som skal plasseres">
        ${bankOrder.map(key=>`<button type="button" class="em-order-chip" data-em-order-item="${key}" draggable="true" aria-pressed="false">${bands[key]}</button>`).join('')}
        <p class="em-order-empty" data-em-order-empty hidden>Alle brikkene er plassert.</p>
        <button type="button" class="em-order-return" data-em-order-return hidden>Legg tilbake</button>
      </div>
    </div>
    <div class="em-order-axis">
      <p class="em-order-end">Lavest frekvens</p>
      <ol class="em-order-slots" aria-label="Plasser fra lavest til høyest frekvens">
        ${frequencyOrder.map((_,index)=>`<li>
          <button type="button" class="em-order-slot" data-em-order-slot="${index+1}" aria-label="Plass ${index+1}, ledig" aria-pressed="false">
            <span class="em-order-index" aria-hidden="true">${index+1}</span>
            <span class="em-order-value">Ledig</span><span class="em-order-mark" aria-hidden="true" hidden></span>
          </button>
        </li>`).join('')}
      </ol>
      <p class="em-order-end">Høyest frekvens</p>
    </div>
  </div>
  <div class="em-order-tools">
    <button type="button" data-em-order-check>Sjekk</button>
    <button type="button" data-em-order-reset>Start på nytt</button>
  </div>
  <p class="em-order-status" data-em-order-status role="status">0 av 7 plassert.</p>
</div>`;

function mountSpectrumOrder(figure, {onCheck} = {}) {
  const root = figure.querySelector('[data-em-order]');
  const bank = root.querySelector('[data-em-order-bank]');
  const empty = root.querySelector('[data-em-order-empty]');
  const returnButton = root.querySelector('[data-em-order-return]');
  const status = root.querySelector('[data-em-order-status]');
  const slots = [...root.querySelectorAll('[data-em-order-slot]')];
  const chips = [...root.querySelectorAll('[data-em-order-item]')];
  const positions = Array(slots.length).fill(null);
  let selection = null, checked = false, dragged = null, dropTarget = null;

  const current = slot=>positions[Number(slot.dataset.emOrderSlot)-1];
  const countText = ()=>`${positions.filter(Boolean).length} av ${positions.length} plassert.`;

  function render() {
    chips.forEach(chip=>{
      const key = chip.dataset.emOrderItem;
      chip.hidden = positions.includes(key);
      chip.setAttribute('aria-pressed',String(key===selection));
    });
    empty.hidden = !positions.every(Boolean);
    returnButton.hidden = !selection || !positions.includes(selection);
    slots.forEach((slot,index)=>{
      const key = positions[index];
      const state = checked ? key===frequencyOrder[index] ? 'correct' : 'wrong' : '';
      const value = key ? bands[key] : 'Ledig';
      const mark = slot.querySelector('.em-order-mark');
      slot.dataset.emOrderValue = key || '';
      slot.dataset.result = state;
      slot.draggable = Boolean(key);
      slot.setAttribute('aria-pressed',String(key!==null&&key===selection));
      slot.setAttribute('aria-label',`Plass ${index+1}, ${value}${state==='correct'?', riktig':state==='wrong'?', må flyttes':''}`);
      slot.querySelector('.em-order-value').textContent = value;
      mark.hidden = !state;
      mark.textContent = state==='correct' ? '✓' : '×';
    });
  }

  function select(key) {
    selection = key===selection ? null : key;
    render();
    status.textContent = selection ? `${bands[key]} valgt. Velg en plass.` : countText();
  }

  function place(key, slot) {
    const index = Number(slot.dataset.emOrderSlot)-1;
    const prior = positions.indexOf(key);
    if (prior===index) {
      if (selection===key) select(key);
      return;
    }
    // A chip moved from the bank replaces the slot's contents. Moving a
    // placed chip into an occupied slot swaps the two positions.
    if (prior>=0) positions[prior] = positions[index];
    positions[index] = key;
    selection = null;
    checked = false;
    render();
    slot.focus({preventScroll:true});
    status.textContent = `${bands[key]} på plass ${index+1}. ${countText()}`;
  }

  function returnToBank(key) {
    const index = positions.indexOf(key);
    if (index<0) return;
    positions[index] = null;
    selection = null;
    checked = false;
    render();
    chips.find(chip=>chip.dataset.emOrderItem===key).focus({preventScroll:true});
    status.textContent = `${bands[key]} er lagt tilbake. ${countText()}`;
  }

  function check() {
    if (!positions.every(Boolean)) {
      status.textContent = 'Plasser alle sju brikkene før du sjekker.';
      return;
    }
    const correct = positions.filter((key,index)=>key===frequencyOrder[index]).length;
    selection = null;
    checked = true;
    render();
    status.textContent = correct===positions.length
      ? 'Riktig! Alle sju er på rett plass.'
      : `${correct} av ${positions.length} på rett plass. Flytt brikkene med kryss og prøv igjen.`;
    onCheck?.(correct===positions.length);
  }

  function reset() {
    positions.fill(null);
    selection = null;
    checked = false;
    render();
    chips[0].focus({preventScroll:true});
    status.textContent = 'Startet på nytt. '+countText();
  }

  root.addEventListener('click',event=>{
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-em-order-check')) check();
    else if (button.hasAttribute('data-em-order-reset')) reset();
    else if (button.hasAttribute('data-em-order-return')) returnToBank(selection);
    else if (button.hasAttribute('data-em-order-item')) {
      select(button.dataset.emOrderItem);
      if (selection && event.detail===0) {
        slots.find(slot=>!current(slot))?.focus({preventScroll:true});
      }
    }
    else if (button.hasAttribute('data-em-order-slot')) {
      if (selection) place(selection,button);
      else if (current(button)) select(current(button));
      else status.textContent = 'Velg en brikke først.';
    }
  });

  root.addEventListener('keydown',event=>{
    if (event.key==='Escape'&&selection) {
      event.preventDefault();
      select(selection);
      return;
    }
    const slot = event.target.closest('[data-em-order-slot]');
    if (!slot) return;
    const index = slots.indexOf(slot);
    const focus = {ArrowUp:index-1,ArrowDown:index+1,Home:0,End:slots.length-1}[event.key];
    if (focus===undefined) return;
    event.preventDefault();
    (slots[focus]||slot).focus({preventScroll:true});
  });

  function highlight(target) {
    if (target===dropTarget) return;
    dropTarget?.removeAttribute('data-drop-active');
    dropTarget = target;
    dropTarget?.setAttribute('data-drop-active','true');
  }

  root.addEventListener('dragstart',event=>{
    const source = event.target.closest('[data-em-order-item],[data-em-order-slot]');
    if (!source) return;
    dragged = source.dataset.emOrderItem || current(source);
    if (!dragged) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain',bands[dragged]);
  });
  root.addEventListener('dragover',event=>{
    if (!dragged) return;
    const destination = event.target.closest('[data-em-order-slot],[data-em-order-bank]');
    highlight(destination);
    if (!destination) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  });
  root.addEventListener('dragleave',event=>{
    if (!root.contains(event.relatedTarget)) highlight(null);
  });
  root.addEventListener('drop',event=>{
    if (!dragged) return;
    event.preventDefault();
    const destination = event.target.closest('[data-em-order-slot],[data-em-order-bank]');
    if (destination===bank) returnToBank(dragged);
    else if (destination) place(dragged,destination);
    dragged = null;
    highlight(null);
  });
  root.addEventListener('dragend',()=>{
    dragged = null;
    highlight(null);
  });
  render();
}

export const emOrderQuestion = {
  id:'em-15',type:'sort',level:'Start',figure:orderFigure,mountFigure:mountSpectrumOrder,
  prompt:'Plasser de sju delene av det elektromagnetiske spekteret i rekkefølge fra lavest til høyest frekvens. Dra brikkene, eller velg en brikke og deretter en plass.',
  answer:'Frekvensen øker i rekkefølgen <strong>radiobølger → mikrobølger → infrarød stråling → synlig lys → ultrafiolett stråling → røntgenstråling → gammastråling</strong>. Bølgelengden blir kortere. Mikrobølger er en del av radiobølgeområdet og står som egen gruppe i denne oversikten.'
};
