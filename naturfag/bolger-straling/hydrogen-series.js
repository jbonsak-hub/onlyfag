import {atomDrawing, HYDROGEN_GROUND_AJ, photonFromEnergyAJ, possibleTransitions, transition} from './atom-lab.js?v=20261126-atomoppgaver';
import {seriesBoardGraphic, seriesBoardLayout, seriesBoardMotion} from './hydrogen-series-graphics.js?v=20261126-hydrogen-ionisering';
import {hydrogenQuiz} from './hydrogen-series-quiz.js?v=20261126-hydrogen-sidefelt';
import {vindalooSolution} from './hydrogen-series-solution.js?v=20261126-hydrogen-sidefelt';

const {fmt, transitionKey} = atomDrawing;
const overviewTransitions = possibleTransitions(6).filter(item => item.to <= 3);
const ionizingPhoton = photonFromEnergyAJ(-HYDROGEN_GROUND_AJ);
const duration = {absorb: .95, burst: 1.35, emission: 1.15, ionize: 1.65};

const styles = `<style>
.topic-page #hs-model { width:100%; max-width:none; margin:10px 0 0; padding:12px 14px; container-type:inline-size }
#hs-model [hidden] { display:none!important }
.hs-modes,.hs-options { display:flex; flex-wrap:wrap; align-items:center; gap:5px 7px }
:where(#hs-model[data-mode=excite]) .hs-modes { display:grid; grid-template-columns:repeat(3,max-content) }
.hs-toolbar { display:grid; grid-template-columns:max-content minmax(0,1fr); align-items:start; gap:8px 16px; margin-bottom:9px }
.hs-toolbar-menu { display:grid; justify-items:start; gap:6px; margin-block-start:7px }
.hs-toolbar-controls { display:grid; justify-items:end; gap:4px; min-width:0 }
.hs-panel { padding:8px 11px; border:1px solid var(--line); border-radius:8px; background:var(--sidebar); color:var(--ink); font-size:.84rem; line-height:1.4 }
#hs-model .hs-panel p,.hs-panel dl,.hs-panel dd { margin:0 }
#hs-selection,.hs-excitation-status { max-width:23rem; border-inline-start:3px solid var(--green); background:var(--green-soft) }
.hs-excitation-status { padding:6px 9px }
#hs-ionization:not([hidden]) { margin-block-end:clamp(21px,2.4cqi,33px) }
.hs-excitation-level-title,.hs-excitation-count { display:block }
.hs-excitation-level-title { text-decoration:underline; text-underline-offset:2px }
#hs-model dl.hs-excitation-bands { display:grid; gap:4px; margin-top:5px }
.hs-excitation-bands > div { display:grid; grid-template-columns:3.1rem minmax(0,1fr); gap:4px }
.hs-excitation-bands dt { font-weight:650 }
.hs-readout { display:grid; grid-template-columns:repeat(2,max-content); gap:5px 18px }
.hs-readout dt, .hs-panel-label { font-size:.8rem; font-weight:650 }
.hs-readout dd { font-size:1rem; font-weight:750; font-variant-numeric:tabular-nums; white-space:nowrap }
#hs-excite { max-width:100% }
.hs-excite-levels { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)) }
#hs-excite-label { grid-column:1/-1 }
.hs-excite-levels button { white-space:nowrap }
#hs-quiz-options { width:min(370px,calc(100% - 28px)) }
#hs-quiz-options::backdrop { background:#13262070; backdrop-filter:none }
#hs-quiz-options .hs-options { margin-top:14px }
:is(#hs-model,#hs-quiz-options) button.hs-button { padding:6px 10px; min-height:32px; border:1px solid var(--line); border-radius:7px; color:var(--ink); background:var(--sidebar); font-size:.85rem; font-weight:650 }
:is(#hs-model,#hs-quiz-options) button.hs-button:hover { border-color:var(--green) }
:is(#hs-model,#hs-quiz-options) button.hs-button[aria-pressed=true] { background:var(--green); border-color:var(--green); color:var(--surface) }
#hs-model .hs-panel button.hs-button:not([aria-pressed=true]) { background:var(--surface) }
#hs-model button.hs-excitation-help-button { grid-column:2; justify-self:center; min-width:0; min-height:28px; padding:4px 7px; border-color:transparent; color:var(--green); background:var(--green-soft); font-size:.79rem; text-align:center; white-space:normal }
#hs-model button.hs-excitation-help-button:hover { border-color:var(--green) }
#hs-model button.hs-explanation-trigger { display:block; padding:2px 0; border:0; background:none; color:var(--green); font:inherit; font-weight:650; text-align:start; white-space:normal; text-decoration:underline; text-underline-offset:3px }
.hs-quiz-prompt { display:grid; align-content:center; width:min(100%,36rem); min-width:0; gap:4px; padding:10px 13px; border:1px solid var(--line); border-inline-start:3px solid var(--green); border-radius:8px; color:var(--ink); background:var(--green-soft) }
.hs-quiz-label { color:var(--ink); font-size:.81rem; font-weight:650 }
#hs-model .hs-quiz-instruction { margin:0; color:var(--muted); text-align:right }
#hs-model .hs-quiz-progress { margin:0; padding-inline:3px; color:var(--ink); font-size:.81rem; font-variant-numeric:tabular-nums; text-align:right }
#hs-difficulty-value { margin-inline-start:4px; color:var(--green) }
#hs-model #hs-clue { margin:0; color:var(--ink); font-size:clamp(1.05rem,1.9cqi,1.375rem); font-weight:750; line-height:1.3 }
.hs-clue-context { display:block; margin-bottom:3px; font-size:.87rem; font-weight:500; line-height:1.4 }
#hs-clue:focus-visible { outline:2px solid var(--green); outline-offset:3px; border-radius:2px }
.hs-quiz-feedback { display:grid; gap:4px; min-width:0 }
#hs-feedback { color:var(--ink) }
#hs-feedback strong { display:block }
#hs-feedback[data-result=correct] strong { color:var(--green) }
#hs-feedback[data-result=incorrect] strong { color:var(--red) }
.hs-figures { display:grid; grid-template-columns:minmax(0,1fr) var(--hs-side-width,12.5rem); grid-template-rows:var(--hs-rows,auto auto); grid-template-areas:var(--hs-areas,'board side' 'spectrum spectrum'); gap:7px 14px; align-items:start }
.hs-side { display:flex; flex-direction:column; grid-area:side; min-width:0; min-height:0; align-self:stretch; justify-content:safe center; gap:6px; contain:size }
#hs-model[data-mode=excite],#hs-model[data-mode=quiz][data-quiz-difficulty=spicy] { --hs-areas:'board side' 'spectrum side' '. side'; --hs-rows:auto auto minmax(0,1fr) }
#hs-model[data-mode=excite] { --hs-side-width:13.5rem }
#hs-model[data-mode=excite] .hs-side { gap:clamp(11px,1.3cqi,19px); contain:none }
#hs-model[data-mode=quiz][data-quiz-difficulty=spicy] { --hs-side-width:15.5rem }
#hs-model[data-mode=quiz][data-quiz-difficulty=spicy] .hs-side { justify-content:flex-start; contain:none }
#hs-explain-controls { font-size:.82rem; line-height:1.25 }
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
#hs-model .hs-legend { display:grid; align-content:center; gap:5px; margin:0; padding:0; list-style:none; font-size:.79rem; line-height:1.35; color:var(--ink) }
.hs-legend li { display:flex; align-items:baseline; gap:4px; margin:0 }
.hs-legend i { display:inline-block; flex:none; width:8px; height:8px; border-radius:50%; background:var(--series-color) }
.hs-legend strong { font-weight:650 }
.hs-legend span { color:var(--muted) }
#hs-model .hs-figure [data-series-action] { cursor:pointer; outline:none }
#hs-model .hs-figure .hs-focus { opacity:0; pointer-events:none }
#hs-model .hs-figure [data-series-action]:hover .hs-focus { opacity:.3 }
#hs-model .hs-figure [data-series-action]:focus-visible .hs-focus { opacity:.65 }
#hs-model .hs-burst-glow { animation:hs-glow 1.25s both }
@keyframes hs-glow { 0%, 20% { opacity:.16; } 55% { opacity:.55; } 100% { opacity:.15; } }
#hs-formulas { display:grid; gap:3px; margin-top:auto; font-size:.81rem; font-variant-numeric:tabular-nums }
#hs-formulas .hs-formula-constants { display:grid; row-gap:3px; margin-top:3px; padding-top:5px; border-top:1px solid var(--line) }
#hs-worked-solution { padding-top:4px; border-top:1px solid var(--line); font-size:.81rem; font-variant-numeric:tabular-nums }
#hs-worked-solution .hs-solution-note { color:var(--muted); font-size:.76rem }
@container (max-width:730px) {
  .hs-toolbar { grid-template-columns:minmax(0,1fr) }
  .hs-toolbar-menu { margin-block-start:0 }
  .hs-figures { grid-template-columns:minmax(0,1fr); grid-template-rows:auto auto auto; grid-template-areas:'board' 'spectrum' 'side' }
  .hs-side { contain:none; align-self:start; justify-self:end; width:min(100%,29rem) }
  #hs-model .hs-legend { grid-template-columns:repeat(3,auto); gap:6px 10px }
}
@container (max-width:570px) {
  #hs-model .hs-legend { grid-template-columns:1fr; gap:3px; padding-left:3px }
  .hs-quiz-prompt { padding:8px 10px }
}
@container (max-width:440px) {
  .hs-modes { display:grid; width:100%; grid-template-columns:minmax(0,1fr) minmax(0,1.15fr) max-content; align-items:stretch }
  #hs-model .hs-modes button { padding-inline:5px; white-space:normal }
  #hs-model .hs-excite-levels button { padding-inline:6px }
  .hs-modes [data-series-reset] { grid-column:1/-1; justify-self:start }
}
@container (max-width:320px) { .hs-excite-levels { grid-template-columns:repeat(3,minmax(0,1fr)) } }
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
const excitationQuestion = 'Hvorfor gir ett innkommende foton så mange overganger ut?';
const excitationHelpQuestion = 'Hvordan kan et atom eksiteres?';
const difficultyNames = {mild:'Mild', medium:'Småspicy', spicy:'Vindaloo'};

export const hydrogenSeriesSection = {title:'Flere overganger i hydrogenatomet', body:`${styles}
<p>Ved andre overganger kan hydrogen også sende ut ultrafiolett og infrarød stråling. Overganger som ender på samme energinivå, hører til samme serie.</p>
<div id="hs-model" class="model" data-model-layout="custom" data-mode="all">
  <div class="hs-toolbar">
    <div class="hs-toolbar-menu">
      <div class="hs-modes" role="group" aria-label="Modus og øving">
        ${buttons('mode', [['all','Overganger i hydrogen'],['excite','Eksiter hydrogenatomet'],['quiz','Quiz']], 'all')}
        <button type="button" class="hs-button" data-series-reset aria-haspopup="dialog" aria-controls="hs-quiz-options" hidden>Start på nytt</button>
        <button type="button" class="hs-button hs-excitation-help-button" data-series-excitation-help aria-haspopup="dialog" aria-controls="hs-excitation-help" hidden>${excitationHelpQuestion}</button>
      </div>
    </div>
    <div id="hs-toolbar-controls" class="hs-toolbar-controls">
      <div id="hs-excite" class="hs-panel" hidden>
        <div class="hs-options hs-excite-levels" role="group" aria-labelledby="hs-excite-label">
          <span id="hs-excite-label" class="hs-panel-label">Velg nivå å eksitere hydrogenatomet til</span>
          ${buttons('level', [2,3,4,5,6,Infinity].map(n => [n, `n = ${n === Infinity ? '∞' : n}`]))}
        </div>
      </div>
      <div id="hs-selection" class="hs-panel" role="status">
        <p id="hs-guide">Klikk på en pil eller en spektrallinje for å se overgangen.</p>
        <dl id="hs-readout" class="hs-readout" hidden>
          <div><dt>Overgang</dt><dd id="hs-transition-value"></dd></div>
          <div><dt>Bølgelengde</dt><dd id="hs-wavelength-value"></dd></div>
        </dl>
      </div>
      <p id="hs-quiz-instruction" class="hs-quiz-label hs-quiz-instruction" hidden>Finn overgangen og klikk på riktig pil</p>
      <div id="hs-quiz" class="hs-quiz-prompt" hidden>
        <p id="hs-clue" tabindex="-1"><span id="hs-clue-context" class="hs-clue-context" hidden></span><span id="hs-clue-question"></span></p>
      </div>
    </div>
  </div>
  <div class="hs-figures" id="hs-figures">
    <div class="hs-board-wrap model-visual"><svg id="hs-board" class="hs-figure" viewBox="0 0 850 265" role="group" aria-label="Hydrogenatomet og energidiagrammet"></svg></div>
    <aside id="hs-side" class="hs-side">
      <div id="hs-excitation-summary" class="hs-panel hs-excitation-status" role="status" hidden></div>
      <div id="hs-ionization" class="hs-panel hs-excitation-status" role="status" hidden>
        <strong>Ionisering</strong>
        <p>Elektronet blir fritt. H⁺ blir igjen.</p>
      </div>
      <ul id="hs-legend" class="hs-legend" aria-label="Overgangsserier">
        ${legend.map(([name, description, color]) => `<li><i style="--series-color:${color}" aria-hidden="true"></i><strong>${name}</strong><span>${description}</span></li>`).join('')}
      </ul>
      <div id="hs-explain-controls" hidden><button type="button" class="hs-explanation-trigger" data-series-explanation aria-haspopup="dialog" aria-controls="hs-explanation">${excitationQuestion}</button></div>
      <div id="hs-quiz-feedback" class="hs-panel hs-quiz-feedback" hidden>
        <span class="hs-quiz-label">Forrige svar</span>
        <p id="hs-feedback" role="status"><strong id="hs-verdict"></strong><span id="hs-answer"></span></p>
        <div id="hs-worked-solution" hidden></div>
      </div>
      <p id="hs-quiz-progress" class="hs-quiz-progress" hidden><span id="hs-progress"></span> <strong id="hs-difficulty-value"></strong></p>
      <div id="hs-formulas" class="hs-panel" hidden>
        <strong>Formler og konstanter</strong>
        <span>ΔE = E<sub>øvre</sub> − E<sub>nedre</sub></span>
        <span>ΔE = hf</span>
        <span>c = λf</span>
        <div class="hs-formula-constants">
          <span>h ≈ 6,626 · 10<sup>−34</sup> J·s</span>
          <span>c ≈ 3,00 · 10<sup>8</sup> m/s</span>
          <span>1 aJ = 10<sup>−18</sup> J</span>
        </div>
      </div>
    </aside>
    <div class="hs-spectrum-wrap"><svg id="hs-spectrum" class="hs-figure" viewBox="0 0 850 95" role="group" aria-label="Hydrogenets emisjonsspekter"></svg></div>
  </div>
</div>
<dialog id="hs-quiz-options" class="al-calculation-dialog" aria-labelledby="hs-difficulty-prompt">
  <header class="al-calculation-header"><h3 id="hs-difficulty-prompt">Velg vanskelighetsgrad</h3><form method="dialog"><button type="submit" class="hs-button">Avbryt</button></form></header>
  <div class="hs-options" role="group" aria-label="Vanskelighetsgrad">${buttons('difficulty', Object.entries(difficultyNames))}</div>
</dialog>
<dialog id="hs-explanation" class="al-calculation-dialog" aria-labelledby="hs-explanation-title">
  <header class="al-calculation-header"><h3 id="hs-explanation-title">${excitationQuestion}</h3><form method="dialog"><button type="submit">Lukk</button></form></header>
  <p>Ett foton kan eksitere ett atom. Når elektronet faller ned, svarer hvert foton som sendes ut til én overgang i det atomet. Elektronet kan gå rett ned til grunntilstanden eller falle i flere trinn.</p>
  <p>Når mange atomer eksiteres til samme nivå, kan elektronene ta ulike veier ned. Figuren viser det samlede resultatet av alle mulige overganger i svært mange hydrogenatomer.</p>
</dialog>
<dialog id="hs-excitation-help" class="al-calculation-dialog" aria-labelledby="hs-excitation-help-title">
  <header class="al-calculation-header"><h3 id="hs-excitation-help-title">${excitationHelpQuestion}</h3><form method="dialog"><button type="submit">Lukk</button></form></header>
  <p>Et atom eksiteres når et elektron får energi og går til et høyere energinivå. Atomet kan absorbere lys når fotonenergien passer til energispranget. Ved oppvarming kan kollisjoner overføre energi til atomene. Når det går strøm gjennom et gassrør, kan raske elektroner eksitere atomene de kolliderer med.</p>
</dialog>`};

export function mountHydrogenSeries(root, api) {
  const get = id => root.querySelector(`#hs-${id}`);
  const model = get('model');
  if (!model) return;
  const board = get('board'), spectrum = get('spectrum'), dialog = get('explanation');
  const excitationHelp = get('excitation-help'), excitationSummary = get('excitation-summary');
  const excitationHelpButton = model.querySelector('[data-series-excitation-help]');
  const boardWrap = board.parentElement, spectrumWrap = spectrum.parentElement;
  const excite = get('excite'), quiz = get('quiz'), quizOptions = get('quiz-options');
  const quizInstruction = get('quiz-instruction'), quizProgress = get('quiz-progress');
  const seriesLegend = get('legend'), explainControls = get('explain-controls');
  const clue = get('clue'), progress = get('progress'), feedback = get('feedback');
  const clueContext = get('clue-context'), clueQuestion = get('clue-question');
  const feedbackBox = get('quiz-feedback'), verdict = get('verdict'), answer = get('answer');
  const workedSolution = get('worked-solution'), difficultyValue = get('difficulty-value');
  const restart = model.querySelector('[data-series-reset]');
  const selection = get('selection'), formulas = get('formulas'), ionization = get('ionization');
  const guide = get('guide'), readout = get('readout');
  const transitionValue = get('transition-value'), wavelengthValue = get('wavelength-value');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let mode = 'all', difficulty = null, excited = null, selected = null, animation = null;
  const solved = new Set();
  let questions = [];
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
  }

  function press(type, value) {
    const attribute = `data-series-${type}`;
    const controls = type === 'difficulty' ? quizOptions : model;
    for (const button of controls.querySelectorAll(`[${attribute}]`)) {
      button.setAttribute('aria-pressed', String(button.getAttribute(attribute) === String(value)));
    }
  }

  function syncQuiz() {
    const playing = mode === 'quiz';
    quiz.hidden = quizInstruction.hidden = quizProgress.hidden = restart.hidden = !playing;
    feedbackBox.hidden = !playing || !feedback.dataset.result;
    formulas.hidden = !playing || difficulty !== 'spicy';
    if (!playing) return;
    const [next] = questions;
    const text = next?.[1] ?? 'Du fant alle overgangene!';
    const contextEnd = difficulty === 'mild' ? text.lastIndexOf('. ') + 1 : 0;
    clueContext.hidden = contextEnd === 0;
    clueContext.textContent = contextEnd ? `${text.slice(0,contextEnd)} ` : '';
    clueQuestion.textContent = contextEnd ? text.slice(contextEnd+1) : text;
    progress.textContent = `${solved.size} av ${hydrogenQuiz[difficulty].length} funnet`;
    difficultyValue.textContent = `(${difficultyNames[difficulty]})`;
  }

  function showFeedback(item, correct) {
    feedback.dataset.result = item ? (correct ? 'correct' : 'incorrect') : '';
    verdict.textContent = item ? (correct ? 'Riktig!' : 'Feil svar.') : '';
    answer.textContent = !item ? '' : correct
      ? `n = ${item.from} → ${item.to} gir ${fmt(item.wavelengthNM,1)} nm.`
      : 'Ledetråden kommer tilbake.';
    workedSolution.hidden = !correct || difficulty !== 'spicy';
    workedSolution.innerHTML = workedSolution.hidden ? '' : vindalooSolution(item, atomDrawing);
    feedbackBox.hidden = !item;
  }

  function syncSelection() {
    selection.hidden = mode !== 'all';
    if (mode !== 'all') return;
    guide.hidden = Boolean(selected);
    readout.hidden = !selected;
    if (!selected) return;
    transitionValue.textContent = `n = ${selected.from} → ${selected.to}`;
    wavelengthValue.textContent = `λ = ${fmt(selected.wavelengthNM,1)} nm`;
  }

  function syncExcitation() {
    ionization.hidden = excited !== Infinity;
    explainControls.hidden = !(excited >= 3 && excited <= 6);
    excitationSummary.hidden = !Number.isFinite(excited);
    if (excitationSummary.hidden) return;

    const bands = ['UV', 'Synlig', 'IR'].map(region => {
      const wavelengths = edges.filter(item => item.region === region).map(item => fmt(item.wavelengthNM, 0));
      return wavelengths.length ? `<div><dt>${region}</dt><dd>${wavelengths.join(', ')}&nbsp;nm</dd></div>` : '';
    });
    const count = edges.length;
    excitationSummary.innerHTML = `<strong class="hs-excitation-level-title">Eksitasjon opp til n = ${excited}.</strong><span class="hs-excitation-count">Gir ${count} ${count===1?'overgang':'overganger'}:</span><dl class="hs-excitation-bands">${bands.join('')}</dl>`;
  }

  function setMode(next) {
    mode = next;
    animation = selected = excited = null;
    edges = mode === 'excite' ? [] : overviewTransitions;
    model.dataset.mode = mode;
    press('mode', mode);
    press('level', null);
    excite.hidden = excitationHelpButton.hidden = mode !== 'excite';
    seriesLegend.hidden = mode === 'quiz';
    syncQuiz();
    syncSelection();
    syncExcitation();
    renderScene();
  }

  function resetQuiz(level) {
    difficulty = level;
    model.dataset.quizDifficulty = difficulty;
    solved.clear();
    questions = [...hydrogenQuiz[difficulty]];
    for (let i=questions.length-1; i>0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    showFeedback();
    press('difficulty', difficulty);
    setMode('quiz');
  }

  function runExcitation(level) {
    const ionizing = level === Infinity;
    excited = level;
    selected = null;
    edges = ionizing ? [] : possibleTransitions(level);
    press('level', level);
    syncExcitation();
    startAnimation(ionizing ? 'ionize' : 'absorb', [ionizing ? ionizingPhoton : transition(1,level)]);
  }

  function chooseTransition(key, byKeyboard) {
    const item = edges.find(edge => transitionKey(edge) === key);
    if (!item || animation?.phase === 'absorb') return;
    if (mode === 'quiz' && !solved.has(key)) {
      const question = questions.shift();
      const correct = key === question[0];
      if (correct) solved.add(key);
      else questions.push(question);
      showFeedback(item, correct);
      syncQuiz();
      if (byKeyboard) clue.focus({preventScroll:true});
      if (!correct) {
        animation = selected = null;
        renderScene();
        return;
      }
    }
    selected = item;
    syncSelection();
    startAnimation('emission', [item]);
  }

  function onClick(event) {
    const button = event.target.closest('button,[data-series-action]');
    if (!button) return;
    const {seriesMode, seriesLevel, seriesKey} = button.dataset;
    if ((seriesMode === 'quiz' && difficulty === null) || button.hasAttribute('data-series-reset')) quizOptions.showModal();
    else if (seriesMode && seriesMode !== mode) setMode(seriesMode);
    else if (seriesLevel) runExcitation(Number(seriesLevel));
    else if (button.hasAttribute('data-series-excitation-help')) excitationHelp.showModal();
    else if (button.hasAttribute('data-series-explanation')) dialog.showModal();
    else if (seriesKey) chooseTransition(seriesKey, event.detail === 0);
  }

  function chooseDifficulty(event) {
    const button = event.target.closest('[data-series-difficulty]');
    if (!button) return;
    resetQuiz(button.dataset.seriesDifficulty);
    quizOptions.close();
    clue.focus({preventScroll:true});
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
  quizOptions.addEventListener('click', chooseDifficulty);
  reduced.addEventListener('change', settleMotion);
  return () => {
    observer.disconnect();
    stopFrames?.();
    model.removeEventListener('click', onClick);
    model.removeEventListener('keydown', onKey);
    quizOptions.removeEventListener('click', chooseDifficulty);
    reduced.removeEventListener('change', settleMotion);
    if (dialog.open) dialog.close();
    if (excitationHelp.open) excitationHelp.close();
    if (quizOptions.open) quizOptions.close();
  };
}
