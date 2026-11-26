import {atomDrawing, possibleTransitions, transition} from './atom-lab.js?v=20261126-hydrogen';
import {seriesBoardGraphic, seriesBoardLayout, seriesBoardMotion} from './hydrogen-series-graphics.js?v=20261126-hydrogen';
import {hydrogenQuiz} from './hydrogen-series-quiz.js?v=20261126-hydrogen';

const {fmt, transitionKey} = atomDrawing;
const overviewTransitions = possibleTransitions(6).filter(item => item.to <= 3);
const duration = {absorb: .95, burst: 1.35, emission: 1.15};

const styles = `<style>
.topic-page #hs-model { width:100%; max-width:none; margin:10px 0 0; padding:12px 14px; container-type:inline-size }
#hs-model [hidden] { display:none!important }
.hs-modes,.hs-options { display:flex; flex-wrap:wrap; align-items:center; gap:5px 7px }
#hs-model .hs-modes { margin-bottom:8px }
#hs-model button.hs-button { padding:6px 10px; min-height:32px; border:1px solid var(--line); border-radius:7px; color:var(--ink); background:var(--sidebar); font-size:.85rem; font-weight:650 }
#hs-model button.hs-button:hover { border-color:var(--green) }
#hs-model button.hs-button[aria-pressed=true] { background:var(--green); border-color:var(--green); color:var(--surface) }
#hs-model .hs-controls { min-height:2.1rem; margin-bottom:8px; display:flex; align-items:center; flex-wrap:wrap; gap:6px 12px; color:var(--muted); font-size:.84rem }
#hs-model .hs-controls p { margin:0; line-height:1.4 }
.hs-controls #hs-selection { margin-left:auto; color:var(--ink); font-weight:650 }
#hs-model button.hs-explanation-trigger { padding:3px 0; border:0; background:none; color:var(--green); font:inherit; font-weight:650; text-decoration:underline; text-underline-offset:3px }
#hs-model .hs-quiz { display:grid; row-gap:4px; width:100% }
#hs-model .hs-quiz p { margin:0 }
.hs-quiz-options #hs-progress { margin-left:auto; white-space:nowrap }
#hs-clue { color:var(--ink); font-size:.95rem; font-weight:700; grid-column:1/-1 }
#hs-clue:focus-visible { outline-offset:2px }
#hs-feedback { min-height:1.2em; grid-column:1/-1 }
.hs-figures { display:grid; grid-template-columns:minmax(0,1fr) max-content; grid-template-areas:'board legend' 'spectrum spectrum'; gap:7px 14px; align-items:center }
.hs-board-wrap { grid-area:board; min-width:0; line-height:0 }
.hs-spectrum-wrap { grid-area:spectrum; min-width:0; line-height:0 }
.topic-page #hs-model svg.hs-figure { display:block; width:100%; height:auto; min-height:0; max-height:none; border-radius:9px; overflow:hidden; background:var(--bg) }
#hs-model .hs-figure text { font-family:inherit; fill:var(--ink) }
#hs-model .hs-title { font-size:19px; font-weight:700 }
#hs-model .hs-series-name { font-size:13px; font-weight:650 }
#hs-model .hs-spectrum-title { font-size:15px; font-weight:650 }
#hs-model .hs-label,#hs-model .hs-selected-wavelength { font-size:13px }
#hs-model .hs-energy { font-size:12px }
#hs-model .hs-scale { font-size:11px }
#hs-model .hs-selected-wavelength { font-weight:700 }
body.dark #hs-model { --hs-lyman-ink:#c491ee; --hs-balmer-ink:#72cdb9; --hs-paschen-ink:#f2a77f; --hs-infrared-ink:#eabd70; --hs-red-ink:#ff716c; --hs-cyan-ink:#54d9eb; --hs-blue-ink:#a3a5ff; --hs-violet-ink:#d0a0ff }
.hs-legend { grid-area:legend; display:grid; align-content:center; gap:9px; margin:0; padding:0; list-style:none; font-size:.83rem; color:var(--ink) }
.hs-legend li { display:flex; align-items:baseline; gap:5px }
.hs-legend i { display:inline-block; flex:none; width:8px; height:8px; border-radius:50%; background:var(--series-color) }
.hs-legend strong { font-weight:650 }
.hs-legend span { color:var(--muted) }
#hs-model .hs-figure [data-series-action] { cursor:pointer; outline:none }
#hs-model .hs-figure .hs-focus { opacity:0; pointer-events:none }
#hs-model .hs-figure [data-series-action]:hover .hs-focus { opacity:.3 }
#hs-model .hs-figure [data-series-action]:focus-visible .hs-focus { opacity:.65 }
#hs-model .hs-burst-glow { animation:hs-glow 1.25s both }
#hs-model[data-animation-paused=true] .hs-burst-glow { animation-play-state:paused }
@keyframes hs-glow { 0%, 20% { opacity:.16; } 55% { opacity:.55; } 100% { opacity:.15; } }
#hs-model .animation-toolbar { top:5px; right:6px }
#hs-formulas { margin:7px 0 0; color:var(--muted); font-size:.79rem; line-height:1.55 }
#hs-formulas span { white-space:nowrap; display:inline-block; margin-right:12px }
@container (max-width:730px) {
  .hs-figures { grid-template-columns:minmax(0,1fr); grid-template-areas:'board' 'spectrum' 'legend' }
  .hs-legend { grid-template-columns:repeat(3,max-content); gap:6px 12px }
}
@container (max-width:570px) {
  .hs-legend { grid-template-columns:1fr; gap:2px; padding-left:3px }
  .hs-controls #hs-selection { margin-left:0 }
}
@media (max-width:520px) { .topic-page #hs-model { padding:9px } }
</style>`;

const legend = [
  ['Lyman', 'til n = 1 · UV', '#a66bd4'],
  ['Balmer', 'til n = 2 · synlig her', '#23988a'],
  ['Paschen', 'til n = 3 · infrarødt', '#cc7142']
];

const buttons = (type, choices, selected) => choices.map(([value, label]) =>
  `<button type="button" class="hs-button" data-series-${type}="${value}" aria-pressed="${value===selected}">${label}</button>`
).join('');

export const hydrogenSeriesSection = {title:'Flere overganger i hydrogenatomet', body:`${styles}
<p>Ved andre overganger kan hydrogen også sende ut ultrafiolett og infrarød stråling. Overganger som ender på samme energinivå, hører til samme serie.</p>
<div id="hs-model" class="model" data-model-layout="custom" data-mode="all">
  <div class="hs-modes" role="group" aria-label="Velg modus">
    ${buttons('mode', [['all','Overganger i hydrogen'],['excite','Eksiter hydrogenatomet'],['quiz','Quiz']], 'all')}
  </div>
  <div class="hs-controls">
    <p id="hs-guide">Klikk på en pil eller en spektrallinje for å se overgangen.</p>
    <div id="hs-excite" class="hs-options" hidden>
      <div class="hs-options" role="group" aria-label="Velg eksitasjonsnivå">
        <span>Eksiter til</span>
        ${buttons('level', [2,3,4,5,6].map(n => [n, `n = ${n}`]))}
      </div>
      <button type="button" class="hs-explanation-trigger" data-series-explanation aria-haspopup="dialog" aria-controls="hs-explanation">Hvorfor flere overganger?</button>
    </div>
    <div id="hs-quiz" class="hs-quiz" hidden>
      <div class="hs-options hs-quiz-options">
        <div class="hs-options" role="group" aria-label="Vanskelighetsgrad">
          ${buttons('difficulty', [['mild','Mild'],['medium','Medium'],['spicy','Spicy']], 'mild')}
        </div>
        <button type="button" class="hs-button" data-series-reset>Start på nytt</button>
        <span id="hs-progress"></span>
      </div>
      <p id="hs-clue" tabindex="-1"></p>
      <p id="hs-feedback" role="status"></p>
    </div>
    <p id="hs-selection" role="status" hidden></p>
  </div>
  <div class="hs-figures">
    <div class="hs-board-wrap model-visual"><svg id="hs-board" class="hs-figure" viewBox="0 0 850 265" role="group" aria-label="Hydrogenatomet og energidiagrammet"></svg></div>
    <ul class="hs-legend" aria-label="Overgangsserier">
      ${legend.map(([name, description, color]) => `<li><i style="--series-color:${color}" aria-hidden="true"></i><strong>${name}</strong><span>${description}</span></li>`).join('')}
    </ul>
    <div class="hs-spectrum-wrap"><svg id="hs-spectrum" class="hs-figure" viewBox="0 0 850 95" role="group" aria-label="Hydrogenets emisjonsspekter"></svg></div>
  </div>
  <p id="hs-formulas" hidden><span>Nivåenergiene er avrundet.</span><span>ΔE = E<sub>øvre</sub> − E<sub>nedre</sub></span><span>λ = hc/ΔE</span><span>f = c/λ</span><span>hc ≈ 198,645 aJ·nm</span><span>c ≈ 3,00 · 10⁸ m/s</span></p>
</div>
<dialog id="hs-explanation" class="al-calculation-dialog" aria-labelledby="hs-explanation-title">
  <header class="al-calculation-header"><h3 id="hs-explanation-title">Hvorfor ser vi flere overganger?</h3><form method="dialog"><button type="submit">Lukk</button></form></header>
  <p>Ett foton kan eksitere ett atom. Når elektronet faller ned, svarer hvert foton som sendes ut til én overgang i det atomet. Elektronet kan gå rett ned til grunntilstanden eller falle i flere trinn.</p>
  <p>Når mange atomer eksiteres til samme nivå, kan elektronene ta ulike veier ned. Figuren viser det samlede resultatet av alle mulige overganger i svært mange hydrogenatomer.</p>
</dialog>`};

export function mountHydrogenSeries(root, api) {
  const get = id => root.querySelector(`#hs-${id}`);
  const model = get('model');
  if (!model) return;
  const board = get('board'), spectrum = get('spectrum'), dialog = get('explanation');
  const boardWrap = board.parentElement, spectrumWrap = spectrum.parentElement;
  const guide = get('guide'), excite = get('excite'), quiz = get('quiz');
  const clue = get('clue'), progress = get('progress'), feedback = get('feedback');
  const selection = get('selection'), formulas = get('formulas');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let mode = 'all', difficulty = 'mild', excited = null, selected = null, animation = null;
  const solved = new Set();
  let edges = overviewTransitions, lastTime = 0, boardLayout, spectrumLayout, motion;

  function sceneState(time = lastTime) {
    return {
      mode, excited, selected: selected && transitionKey(selected), solved,
      showEnergies: mode === 'quiz' && difficulty === 'spicy',
      transitions: animation?.phase === 'absorb' ? [] : edges,
      animation: animation && {...animation, progress: Math.max(0, Math.min(1, (time-animation.start)/duration[animation.phase]))}
    };
  }

  function renderScene() {
    if (!boardLayout) return;
    const focus = model.ownerDocument.activeElement?.closest('[data-series-action]');
    const state = sceneState();
    const figure = seriesBoardGraphic(boardLayout, state, atomDrawing);
    board.innerHTML = `${figure.board}<g class="hs-motion" pointer-events="none" aria-hidden="true">${figure.motion}</g>`;
    motion = board.lastElementChild;
    spectrum.innerHTML = spectrumLayout === boardLayout ? figure.spectrum : seriesBoardGraphic(spectrumLayout, state, atomDrawing).spectrum;
    if (focus) {
      const {seriesKey, seriesPart} = focus.dataset;
      model.querySelector(`[data-series-key="${seriesKey}"][data-series-part="${seriesPart}"]`)?.focus({preventScroll:true});
    }
    model.dataset.phase = animation?.phase || 'idle';
    model.dataset.selected = state.selected || '';
    model.dataset.excited = excited || '';
  }

  function resize() {
    const nextBoard = seriesBoardLayout(boardWrap.getBoundingClientRect().width);
    const nextSpectrum = seriesBoardLayout(spectrumWrap.getBoundingClientRect().width);
    if (nextBoard.width === boardLayout?.width && nextSpectrum.width === spectrumLayout?.width) return;
    boardLayout = nextBoard;
    spectrumLayout = nextSpectrum.width === nextBoard.width ? nextBoard : nextSpectrum;
    board.setAttribute('viewBox', `0 0 ${boardLayout.width} ${boardLayout.height}`);
    spectrum.setAttribute('viewBox', `0 0 ${spectrumLayout.width} ${spectrumLayout.spectrumHeight}`);
    renderScene();
  }

  function renderFrame(time) {
    lastTime = time;
    if (!animation) return;
    const end = animation.start + duration[animation.phase];
    if (time >= end) {
      animation = animation.phase === 'absorb' ? {phase:'burst', start:end, transitions:edges} : null;
      renderScene();
    } else if (motion) {
      motion.innerHTML = seriesBoardMotion(boardLayout, sceneState(time), atomDrawing);
    }
  }

  function startAnimation(phase, transitions) {
    const start = api.now?.(board) ?? lastTime;
    animation = reduced.matches ? null : {phase, start, transitions};
    renderScene();
    if (animation) api.play?.(board);
  }

  function press(type, value) {
    const attribute = `data-series-${type}`;
    for (const button of model.querySelectorAll(`[${attribute}]`)) {
      button.setAttribute('aria-pressed', String(button.getAttribute(attribute) === String(value)));
    }
  }

  function quizQuestion() {
    return hydrogenQuiz[difficulty][solved.size];
  }

  function syncQuiz() {
    const next = quizQuestion();
    clue.textContent = next?.[1] ?? 'Du fant alle overgangene!';
    progress.textContent = `${solved.size} av ${hydrogenQuiz[difficulty].length} funnet`;
    formulas.hidden = difficulty !== 'spicy';
  }

  function syncSelection() {
    selection.hidden = mode === 'quiz' || !selected;
    selection.textContent = selected ? `n = ${selected.from} → ${selected.to} · ${fmt(selected.wavelengthNM,1)} nm` : '';
  }

  function setMode(next) {
    mode = next;
    animation = selected = excited = null;
    edges = mode === 'excite' ? [] : overviewTransitions;
    model.dataset.mode = mode;
    press('mode', mode);
    press('level', null);
    guide.hidden = mode !== 'all';
    excite.hidden = mode !== 'excite';
    quiz.hidden = mode !== 'quiz';
    feedback.textContent = '';
    if (mode === 'quiz') syncQuiz();
    else formulas.hidden = true;
    syncSelection();
    renderScene();
  }

  function resetQuiz() {
    solved.clear();
    animation = selected = null;
    feedback.textContent = '';
    press('difficulty', difficulty);
    syncQuiz();
    renderScene();
  }

  function runExcitation(level) {
    excited = level;
    selected = null;
    edges = possibleTransitions(level);
    press('level', level);
    syncSelection();
    startAnimation('absorb', [transition(1,level)]);
  }

  function chooseTransition(key, byKeyboard) {
    const item = edges.find(edge => transitionKey(edge) === key);
    if (!item || animation?.phase === 'absorb') return;
    if (mode === 'quiz' && !solved.has(key)) {
      if (key !== quizQuestion()?.[0]) {
        feedback.textContent = 'Prøv en annen overgang.';
        return;
      }
      solved.add(key);
      syncQuiz();
      feedback.textContent = `Riktig! n = ${item.from} → ${item.to} gir ${fmt(item.wavelengthNM,1)} nm.`;
      if (byKeyboard) clue.focus({preventScroll:true});
    }
    selected = item;
    syncSelection();
    startAnimation('emission', [item]);
  }

  function onClick(event) {
    const button = event.target.closest('button,[data-series-action]');
    if (!button) return;
    const {seriesMode, seriesLevel, seriesDifficulty, seriesKey} = button.dataset;
    if (seriesMode && seriesMode !== mode) setMode(seriesMode);
    else if (seriesLevel) runExcitation(Number(seriesLevel));
    else if (seriesDifficulty && seriesDifficulty !== difficulty) {
      difficulty = seriesDifficulty;
      resetQuiz();
    } else if (button.hasAttribute('data-series-reset')) resetQuiz();
    else if (button.hasAttribute('data-series-explanation')) dialog.showModal();
    else if (seriesKey) chooseTransition(seriesKey, event.detail === 0);
  }

  function onKey(event) {
    const hit = event.target.closest('[data-series-action]');
    if (!hit || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    if (!event.repeat) chooseTransition(hit.dataset.seriesKey, true);
  }

  function settleMotion(event) {
    if (!event.matches || !animation) return;
    animation = null;
    renderScene();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(boardWrap);
  observer.observe(spectrumWrap);
  resize();
  const stopFrames = api.onFrame(renderFrame,board);
  model.addEventListener('click', onClick);
  model.addEventListener('keydown', onKey);
  reduced.addEventListener('change', settleMotion);
  return () => {
    observer.disconnect();
    stopFrames?.();
    model.removeEventListener('click', onClick);
    model.removeEventListener('keydown', onKey);
    reduced.removeEventListener('change', settleMotion);
    if (dialog.open) dialog.close();
  };
}
