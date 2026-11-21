const tones = [
  {note: 'C4', hz: 262},
  {note: 'E4', hz: 330},
  {note: 'G4', hz: 392},
  {note: 'A4', hz: 440},
  {note: 'C5', hz: 523}
];
const arrivalTime = .72;
const ringTime = 8;
const pitchScale = 180;
const columnCount = 27;
const airLeft = 174;
const columnSpacing = 16;
const trackedColumn = 13;

function fadeOut(age) {
  return Math.max(0, Math.min(1, ringTime - age));
}

function sourceAmplitude(age) {
  if (age <= 0 || age >= ringTime) return 0;
  return Math.min(age / .065, 1) * Math.exp(-age / 2.4) * fadeOut(age);
}

export function forkResponse(age, sourceHz, receiverHz) {
  const sinceArrival = age - arrivalTime;
  const arrived = sinceArrival >= 0;
  const first = sourceAmplitude(age);
  // With these well-separated pitches, only a frequency match gives a visible response.
  const second = arrived && sourceHz === receiverHz
    ? .96 * (1 - Math.exp(-sinceArrival / .48)) * Math.exp(-sinceArrival / 2.7) * fadeOut(age)
    : 0;
  return {first, second, arrived, level: first + second};
}

function phase(hz, age) {
  return 2 * Math.PI * hz * age / pitchScale;
}

export function airMotion(age, distance, hz) {
  const localAge = age - distance * arrivalTime;
  const amplitude = sourceAmplitude(localAge) * fadeOut(age);
  if (amplitude === 0) return {offset: 0, compression: 0};
  return {
    offset: 13 * amplitude * Math.sin(phase(hz, localAge)),
    compression: amplitude * Math.max(0, Math.cos(phase(hz, localAge)))
  };
}

function tinePath(hz, displacement) {
  const tip = 166 - 80 * Math.sqrt(440 / hz);
  return `M${-24 - displacement} ${tip} Q-24 ${tip + 46} -24 158 A24 24 0 0 0 24 158
    Q24 ${tip + 46} ${24 + displacement} ${tip} M0 182 V214`;
}

function forkDrawing(id, x) {
  return `<g transform="translate(${x} 0)" class="tf-fork tf-fork-${id}">
    <text text-anchor="middle" y="40" id="tf-label-${id}" class="tf-frequency">440 Hz</text>
    <rect class="tf-base" x="-55" y="213" width="110" height="29" rx="5"/>
    <path class="tf-base-stripe" d="M-55 233H55"/>
    <path id="tf-tines-${id}" class="tf-tines" d="${tinePath(440, 0)}"/>
  </g>`;
}

const molecules = Array.from({length: columnCount}, (_, column) => {
  const x = airLeft + column * columnSpacing;
  const dots = [100, 122, 144, 166].map((y, row) => {
    const tracked = column === trackedColumn && row === 2;
    return `<circle cx="${row % 2 ? 3 : 0}" cy="${tracked ? y : y + ((column + row) % 3) - 1}" r="${tracked ? 6 : 3.3}"${tracked ? ' class="tf-tracked"' : ''}/>`;
  }).join('');
  return `<g class="tf-air-column" transform="translate(${x} 0)">${dots}</g>`;
}).join('');

const toneOptions = tones.map(({note, hz}) =>
  `<option value="${hz}"${hz === 440 ? ' selected' : ''}>${note} · ${hz} Hz</option>`
).join('');

export const tuningForkHtml = `<p>Lydbølgen brer seg som fortetninger og fortynninger i lufta. Ved lik egenfrekvens tar den andre stemmegaffelen opp energi og klinger med.</p>
  <div class="wv-scope">
    <div class="model tf-model">
      <svg id="wv-tuning-forks" class="tf-diagram" viewBox="0 0 760 260" role="img" aria-labelledby="tf-title tf-description">
        <title id="tf-title">Resonans mellom to stemmegafler</title>
        <desc id="tf-description">Stemmegaffelen til venstre lager en lydbølge som går mot stemmegaffelen til høyre. Prikkene viser luftmolekyler som svinger fram og tilbake. Den oransje prikken viser bevegelsen til ett molekyl.</desc>
        <rect class="tf-air-backdrop" x="156" y="81" width="448" height="104" rx="14"/>
        <circle class="tf-equilibrium" cx="${airLeft + trackedColumn * columnSpacing}" cy="144" r="8"/>
        ${molecules}
        ${forkDrawing('source', 91)}
        ${forkDrawing('receiver', 669)}
        <path class="tf-direction" d="M199 219H561m-11 -6 11 6-11 6"/>
        <text class="tf-direction-label" text-anchor="middle" x="380" y="211">Lydbølgen brer seg</text>
      </svg>
      <div class="tf-settings">
        <div class="tf-tones">
          <label for="tf-source">Første stemmegaffel<select id="tf-source">${toneOptions}</select></label>
          <label for="tf-receiver">Andre stemmegaffel<select id="tf-receiver">${toneOptions}</select></label>
        </div>
        <div class="tf-actions">
          <button type="button" id="tf-strike">Slå an den første</button>
          <label for="tf-sound" class="tf-sound"><input type="checkbox" id="tf-sound" checked> Lyd</label>
        </div>
      </div>
      <div class="readout tf-readout">
        <output id="tf-response" role="status">Begge stemmegaflene er i ro.</output>
        <label for="tf-level">Relativ lydamplitude</label>
        <meter id="tf-level" min="0" max="1.5" value="0"></meter>
        <p id="tf-audio-status" role="status" hidden></p>
      </div>
      <p class="model-note tf-note">Animasjonen går i sakte film. Den oransje prikken svinger fram og tilbake rundt samme sted.</p>
    </div>
  </div>`;

function createForkAudio() {
  let context, oscillator, gain;
  return {
    async enable() {
      if (!context) {
        const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContext) throw new Error('Web Audio unavailable');
        context = new AudioContext();
        gain = context.createGain();
        gain.gain.value = 0;
        oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
      }
      if (context.state !== 'running') await context.resume();
    },
    update(hz, level) {
      if (!gain || context.state === 'closed') return;
      // At the listening point in this model, the two equal pitches add in phase.
      oscillator.frequency.value = hz;
      gain.gain.setTargetAtTime(.15 * level, context.currentTime, .026);
    },
    close() {
      if (!context || context.state === 'closed') return;
      oscillator.stop();
      void context.close().catch(() => {});
    }
  };
}

export function mountTuningForks(root, api) {
  const get = id => root.querySelector('#' + id);
  const scene = get('wv-tuning-forks');
  const sourceSelect = get('tf-source');
  const receiverSelect = get('tf-receiver');
  const sound = get('tf-sound');
  const strike = get('tf-strike');
  const response = get('tf-response');
  const level = get('tf-level');
  const audioStatus = get('tf-audio-status');
  const sourceTines = get('tf-tines-source');
  const receiverTines = get('tf-tines-receiver');
  const sourceLabel = get('tf-label-source');
  const receiverLabel = get('tf-label-receiver');
  const columns = [...scene.querySelectorAll('.tf-air-column')];
  const audio = createForkAudio();
  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  let startedAt = null;
  let lastDrawing = '';
  let disposed = false;

  function draw(time) {
    const age = startedAt === null ? -1 : time - startedAt;
    const sourceHz = Number(sourceSelect.value);
    const receiverHz = Number(receiverSelect.value);
    const {first, second, arrived, level: amplitude} = forkResponse(age, sourceHz, receiverHz);
    const visible = !document.hidden && !scene.closest('[hidden]');
    audio.update(sourceHz, visible && sound.checked && !api.isPaused(scene) ? amplitude : 0);

    const active = age >= 0 && age < ringTime;
    const drawing = `${sourceHz}:${receiverHz}:${active ? age : 'idle'}`;
    if (drawing === lastDrawing) return;
    lastDrawing = drawing;
    sourceTines.setAttribute('d', tinePath(sourceHz, 9 * first * Math.sin(phase(sourceHz, age))));
    receiverTines.setAttribute('d', tinePath(receiverHz, 9 * second * Math.sin(phase(sourceHz, age - arrivalTime))));
    if (sourceLabel.textContent !== sourceHz + ' Hz') sourceLabel.textContent = sourceHz + ' Hz';
    if (receiverLabel.textContent !== receiverHz + ' Hz') receiverLabel.textContent = receiverHz + ' Hz';
    scene.dataset.response = second > 0 ? 'resonance' : !active ? 'idle' : arrived ? 'still' : 'travelling';
    columns.forEach((column, index) => {
      const {offset, compression} = airMotion(age, index / (columnCount - 1), sourceHz);
      column.setAttribute('transform', `translate(${airLeft + index * columnSpacing + offset} 0)`);
      column.setAttribute('fill-opacity', String(.51 + .49 * compression));
    });
    level.value = amplitude;
    const status = !active ? 'Begge stemmegaflene er i ro.'
      : !arrived ? 'Lydbølgen er på vei.'
      : sourceHz === receiverHz ? 'Den andre stemmegaffelen svinger i resonans.'
      : 'Den andre står i ro ved ulik egenfrekvens.';
    if (response.textContent !== status) response.textContent = status;
  }

  async function enableSound() {
    if (!sound.checked) return;
    try {
      await audio.enable();
      if (!disposed) audioStatus.hidden = true;
    } catch {
      if (disposed || !sound.checked) return;
      sound.checked = false;
      audioStatus.textContent = 'Lyden er utilgjengelig i denne nettleseren.';
      audioStatus.hidden = false;
    }
    if (!disposed) api.repaint(scene);
  }

  function strikeFork() {
    startedAt = api.now(scene);
    void enableSound();
    api.play(scene);
  }

  function changeTone() {
    startedAt = null;
    api.repaint(scene);
  }

  function changeSound() {
    if (sound.checked) void enableSound();
    else audioStatus.hidden = true;
    api.repaint(scene);
  }

  const repaint = () => api.repaint(scene);
  const mute = () => audio.update(Number(sourceSelect.value), 0);
  const observedMotion = typeof reducedMotion?.addEventListener === 'function';
  strike.addEventListener('click', strikeFork);
  sourceSelect.addEventListener('change', changeTone);
  receiverSelect.addEventListener('change', changeTone);
  sound.addEventListener('change', changeSound);
  document.addEventListener('visibilitychange', repaint);
  if (observedMotion) reducedMotion.addEventListener('change', repaint);
  globalThis.addEventListener?.('pagehide', mute);
  const removeFrame = api.onFrame(draw, scene);

  return () => {
    disposed = true;
    removeFrame?.();
    audio.close();
    document.removeEventListener('visibilitychange', repaint);
    if (observedMotion) reducedMotion.removeEventListener('change', repaint);
    globalThis.removeEventListener?.('pagehide', mute);
  };
}
