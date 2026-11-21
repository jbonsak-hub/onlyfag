const LIGHT_SPEED_KM_S = 299_792.458;
const REST_WAVELENGTH_NM = 550;
const MAX_STAR_SPEED = 3000;
const animationLightSpeed = 105;
const stationaryWaveSpacing = 58;

export function observedLightWavelength(restWavelength, radialSpeedKmS) {
  // Radial velocity is positive when the source recedes from the observer.
  const beta = radialSpeedKmS / LIGHT_SPEED_KM_S;
  return restWavelength * Math.sqrt((1 + beta) / (1 - beta));
}

function diagramWavelength(radialSpeed) {
  // Use the same Doppler relationship with an enlarged shift for the drawing.
  const visualSpeed = radialSpeed * (.34 * LIGHT_SPEED_KM_S / MAX_STAR_SPEED);
  return observedLightWavelength(stationaryWaveSpacing, visualSpeed);
}

const shifts = {
  blue: {name: 'Blåforskyvning', color: '#91caff'},
  neutral: {name: 'Ingen forskyvning', color: '#b8dbc9'},
  red: {name: 'Rødforskyvning', color: '#ffab9e'}
};

const shiftOf = speed => speed < 0 ? 'blue' : speed > 0 ? 'red' : 'neutral';
const formatWavelength = new Intl.NumberFormat('nb-NO', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

function wavePath(start, end, spacing, time) {
  const length = Math.abs(end - start);
  const sign = Math.sign(end - start);
  const count = Math.ceil(length / 2.5);
  let path = '';
  for (let i = 0; i <= count; i++) {
    const distance = length * i / count;
    const x = start + sign * distance;
    const phase = 2 * Math.PI * (distance - length - animationLightSpeed * time) / spacing;
    const y = 125 - 14 * Math.sin(phase);
    path += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return path;
}

function starMarkup(letter, startX) {
  return `<g id="ld-star-${letter}" transform="translate(${startX} 125)">
    <text class="ld-label" x="0" y="-52" text-anchor="middle">Stjerne ${letter}</text>
    <circle class="ld-star-glow" r="31"/>
    <circle class="ld-star-disc" r="16"/>
    <path class="ld-motion-arrow" d="M-21 48H20m-9 -7 9 7-9 7"/>
  </g>`;
}

function starControl(letter, initialDirection) {
  return `<div class="ld-star-control">
    <label for="ld-direction-${letter}"><strong>Stjerne ${letter}</strong></label>
    <select id="ld-direction-${letter}">
      <option value="-1"${initialDirection === -1 ? ' selected' : ''}>Mot jorda</option>
      <option value="0">I ro</option>
      <option value="1"${initialDirection === 1 ? ' selected' : ''}>Fra jorda</option>
    </select>
    <output id="ld-wavelength-${letter}" for="ld-direction-${letter} ld-speed" class="ld-observed"></output>
  </div>`;
}

export const lightDopplerHtml = `<style>
  .ld-model .ld-scene{border-radius:11px;background:#0d1b2b;color-scheme:dark}
  .ld-scene .ld-label{font:650 24px system-ui,sans-serif;fill:#eff7ff}
  .ld-scene .ld-note{font:500 24px system-ui,sans-serif;fill:#c1d1e1}
  .ld-scene .ld-axis{stroke:#587084;stroke-dasharray:3 8;opacity:.6}
  .ld-scene .ld-wave{fill:none;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}
  .ld-scene .ld-star-glow{fill:url(#ld-star-halo)}
  .ld-scene .ld-star-disc{fill:url(#ld-star-light);stroke:#fff6d5;stroke-width:1.1}
  .ld-scene .ld-motion-arrow{fill:none;stroke:#e3edf6;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
  .ld-model .ld-controls{display:grid;gap:14px}
  .ld-model .ld-stars{display:grid;gap:10px}
  .ld-model .ld-star-control{display:grid;gap:3px;min-width:0;font-size:13px}
  .ld-model .ld-star-control select{width:100%;max-width:100%;margin:0;border:1px solid var(--line);border-radius:7px;background:var(--surface);color:var(--ink)}
  .ld-model .ld-observed{display:block;color:var(--muted);font-size:12px;line-height:1.45}
  .ld-model .ld-observed strong{color:var(--ink);white-space:nowrap}
  .ld-model .ld-observed[data-shift=blue]{color:#276495}
  .ld-model .ld-observed[data-shift=red]{color:#a33a35}
  body.dark .ld-model .ld-observed[data-shift=blue]{color:#a5d4ff}
  body.dark .ld-model .ld-observed[data-shift=red]{color:#ffaea5}
  .ld-model .ld-speed-label{display:grid;gap:4px;font-size:12px}
  .ld-model .ld-speed-label output{font-variant-numeric:tabular-nums;color:var(--muted)}
  .ld-model .ld-speed-label input[type=range]{width:100%;margin:3px 0}
  @media(max-width:779px){
    .ld-model .ld-stars{grid-template-columns:repeat(2,minmax(0,1fr))}
    .ld-scene .ld-label,.ld-scene .ld-note{font-size:28px}
  }
</style>
<p>Vi følger lys med bølgelengde 550 nm målt ved hver stjerne. Når en stjerne kommer mot jorda, mottar vi kortere bølgelengder. Når den fjerner seg, mottar vi lengre bølgelengder.</p>
<div class="model ld-model">
  <svg id="ld-scene" class="ld-scene" viewBox="0 0 760 235" role="img" aria-labelledby="ld-title ld-description">
    <title id="ld-title">Dopplereffekt for lys fra to stjerner</title>
    <desc id="ld-description">Stjernene beveger seg mot eller fra jorda. Bølgene som når jorda kan ha kortere eller lengre bølgelengde.</desc>
    <defs>
      <radialGradient id="ld-star-halo"><stop stop-color="#ffe5a1" stop-opacity=".61"/><stop offset="1" stop-color="#ffe5a1" stop-opacity="0"/></radialGradient>
      <radialGradient id="ld-star-light" cx="36%" cy="35%" r="68%"><stop stop-color="#fffce3"/><stop offset=".65" stop-color="#ffe39c"/><stop offset="1" stop-color="#f7aa65"/></radialGradient>
      <radialGradient id="ld-earth-sea" cx="36%" cy="34%" r="65%"><stop stop-color="#72d0eb"/><stop offset=".61" stop-color="#3386b7"/><stop offset="1" stop-color="#22517a"/></radialGradient>
      <clipPath id="ld-earth-edge"><circle cx="380" cy="125" r="29"/></clipPath>
    </defs>
    <path class="ld-axis" d="M44 125H716"/>
    <path class="ld-wave" id="ld-wave-A"/>
    <path class="ld-wave" id="ld-wave-B"/>
    <text class="ld-label" x="380" y="73" text-anchor="middle">Jorda</text>
    <circle cx="380" cy="125" r="29" fill="url(#ld-earth-sea)" stroke="#b6e9f8" stroke-width="1.5"/>
    <path clip-path="url(#ld-earth-edge)" d="M351 111l12-9 13-2 8 7-4 6-10 4-3 8-8 4-6-7Zm22 17 12-4 9 6-1 9-7 11-9 3-5-11Zm18-24 12 2 9 10-5 4-9-3-5 4-6-6Z" fill="#a4d7b2"/>
    ${starMarkup('A', 118)}
    ${starMarkup('B', 642)}
    <text class="ld-note" x="380" y="214" text-anchor="middle">Bølgelengde i ro · 550 nm</text>
  </svg>
  <div class="ld-controls">
    <div class="ld-stars">
      ${starControl('A', -1)}
      ${starControl('B', 1)}
    </div>
    <div class="ld-speed-label">
      <label for="ld-speed"><strong>Fart langs synslinja</strong></label>
      <output id="ld-speed-value" for="ld-speed"></output>
      <input id="ld-speed" type="range" min="0" max="${MAX_STAR_SPEED}" value="1800" step="100">
    </div>
  </div>
  <p class="model-note">Fargene viser retningen på forskyvningen. Forskjellen i bølgelengde er forstørret i tegningen. Begge bølgene brer seg med lysfarten.</p>
</div>`;

export function mountLightDoppler(root, api) {
  const node = id => root.querySelector('#' + id);
  const scene = node('ld-scene');
  const speedControl = node('ld-speed');
  const speedOutput = node('ld-speed-value');
  const stars = [
    {letter: 'A', side: -1, center: 118},
    {letter: 'B', side: 1, center: 642}
  ].map(star => ({
    ...star,
    direction: node('ld-direction-' + star.letter),
    figure: node('ld-star-' + star.letter),
    arrow: node('ld-star-' + star.letter).querySelector('.ld-motion-arrow'),
    wave: node('ld-wave-' + star.letter),
    output: node('ld-wavelength-' + star.letter)
  }));

  function draw(time) {
    const drift = (time % 15) / 15 - .5;
    const speed = Number(speedControl.value);
    for (const star of stars) {
      const velocity = Number(star.direction.value) * speed;
      const displacement = star.side * (velocity / MAX_STAR_SPEED) * 70 * drift;
      const x = star.center + displacement;
      const heading = Math.sign(velocity) * star.side;
      star.figure.setAttribute('transform', `translate(${x} 125)`);
      star.arrow.setAttribute('transform', `scale(${heading || 1} 1)`);
      star.arrow.setAttribute('opacity', heading ? '1' : '0');
      const start = x - star.side * 24;
      const end = 380 + star.side * 33;
      star.wave.setAttribute('d', wavePath(start, end, diagramWavelength(velocity), time));
    }
  }

  function update() {
    const speed = Number(speedControl.value);
    speedOutput.textContent = speed.toLocaleString('nb-NO') + ' km/s';
    for (const star of stars) {
      const velocity = Number(star.direction.value) * speed;
      const shift = shiftOf(velocity);
      const received = observedLightWavelength(REST_WAVELENGTH_NM, velocity);
      star.output.dataset.shift = shift;
      star.output.innerHTML = `<strong>${formatWavelength.format(received)} nm</strong> · ${shifts[shift].name}`;
      star.wave.setAttribute('stroke', shifts[shift].color);
    }
    api.repaint(scene);
  }

  for (const star of stars) star.direction.addEventListener('change', update);
  speedControl.addEventListener('input', update);
  const removeFrame = api.onFrame(draw, scene);
  update();
  return () => removeFrame?.();
}
