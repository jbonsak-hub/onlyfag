const LIGHT_SPEED_KM_S = 299_792.458;
const REST_WAVELENGTH_NM = 550;
const STAR_SPEED_KM_S = 3000;
const animationLightSpeed = 105;
const stationaryWaveSpacing = 58;

export function observedLightWavelength(restWavelength, radialSpeedKmS) {
  // Radial velocity is positive when the source recedes from the observer.
  const beta = radialSpeedKmS / LIGHT_SPEED_KM_S;
  return restWavelength * Math.sqrt((1 + beta) / (1 - beta));
}

function diagramWavelength(radialSpeed) {
  // Use the same Doppler relationship with an enlarged shift for the drawing.
  const visualSpeed = radialSpeed * (.34 * LIGHT_SPEED_KM_S / STAR_SPEED_KM_S);
  return observedLightWavelength(stationaryWaveSpacing, visualSpeed);
}

const stars = [
  {letter: 'A', side: -1, center: 118, direction: 'Mot jorda', shift: 'blue', name: 'Blåforskyvning', color: '#91caff'},
  {letter: 'B', side: 1, center: 642, direction: 'Fra jorda', shift: 'red', name: 'Rødforskyvning', color: '#ffab9e'}
].map(star => ({...star, velocity: star.side * STAR_SPEED_KM_S}));
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

function starReadout(star) {
  const received = observedLightWavelength(REST_WAVELENGTH_NM, star.velocity);
  return `<div class="ld-star-result" data-shift="${star.shift}">
    <span class="ld-direction">Stjerne ${star.letter} · ${star.direction}</span>
    <strong class="ld-shift">${star.name}</strong>
    <span class="ld-observed" id="ld-wavelength-${star.letter}" data-shift="${star.shift}">${formatWavelength.format(received)} nm</span>
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
  .ld-model .ld-controls{display:grid;gap:10px;align-content:center}
  .ld-model .ld-star-result{display:grid;gap:3px;min-width:0;padding:11px 13px;border-radius:8px;border:1px solid var(--line);border-inline-start:3px solid var(--shift-color);background:var(--bg)}
  .ld-model .ld-star-result[data-shift=blue]{--shift-color:#276495}
  .ld-model .ld-star-result[data-shift=red]{--shift-color:#a33a35}
  body.dark .ld-model .ld-star-result[data-shift=blue]{--shift-color:#a5d4ff}
  body.dark .ld-model .ld-star-result[data-shift=red]{--shift-color:#ffaea5}
  .ld-model .ld-direction{font-size:12px;color:var(--muted)}
  .ld-model .ld-shift{font-size:14px;color:var(--shift-color);overflow-wrap:anywhere}
  .ld-model .ld-observed{color:var(--ink);font-size:17px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
  @media(min-width:800px) and (max-width:1100px){
    .topic-page .model.model--split.ld-model{grid-template-columns:minmax(0,1fr) 174px}
    .topic-page .ld-model .model-panel{border-top:0;border-left:1px solid var(--line);padding:0 0 0 12px}
    .topic-page .ld-model .model-footer{grid-column:1/-1}
  }
  @media(max-width:799px){
    .ld-model .ld-controls{grid-template-columns:repeat(2,minmax(0,1fr))}
    .ld-scene .ld-label,.ld-scene .ld-note{font-size:28px}
  }
  @media(max-width:380px){
    .ld-model .ld-star-result{padding:8px}
    .ld-model .ld-shift{font-size:12px}
  }
</style>
<p>Vi følger lys med bølgelengde 550 nm målt ved hver stjerne. Når en stjerne kommer mot jorda, mottar vi kortere bølgelengder. Når den fjerner seg, mottar vi lengre bølgelengder.</p>
<div class="model model--split ld-model">
  <div class="model-visual">
    <svg id="ld-scene" class="ld-scene" viewBox="0 0 760 235" role="img" aria-labelledby="ld-title ld-description">
    <title id="ld-title">Dopplereffekt for lys fra to stjerner</title>
    <desc id="ld-description">Stjerne A nærmer seg jorda og bølgene er tettere. Stjerne B fjerner seg og bølgene er lenger fra hverandre.</desc>
    <defs>
      <radialGradient id="ld-star-halo"><stop stop-color="#ffe5a1" stop-opacity=".61"/><stop offset="1" stop-color="#ffe5a1" stop-opacity="0"/></radialGradient>
      <radialGradient id="ld-star-light" cx="36%" cy="35%" r="68%"><stop stop-color="#fffce3"/><stop offset=".65" stop-color="#ffe39c"/><stop offset="1" stop-color="#f7aa65"/></radialGradient>
      <radialGradient id="ld-earth-sea" cx="36%" cy="34%" r="65%"><stop stop-color="#72d0eb"/><stop offset=".61" stop-color="#3386b7"/><stop offset="1" stop-color="#22517a"/></radialGradient>
      <clipPath id="ld-earth-edge"><circle cx="380" cy="125" r="29"/></clipPath>
    </defs>
    <path class="ld-axis" d="M44 125H716"/>
    ${stars.map(star => `<path class="ld-wave" id="ld-wave-${star.letter}" stroke="${star.color}"/>`).join('')}
    <text class="ld-label" x="380" y="73" text-anchor="middle">Jorda</text>
    <circle cx="380" cy="125" r="29" fill="url(#ld-earth-sea)" stroke="#b6e9f8" stroke-width="1.5"/>
    <path clip-path="url(#ld-earth-edge)" d="M351 111l12-9 13-2 8 7-4 6-10 4-3 8-8 4-6-7Zm22 17 12-4 9 6-1 9-7 11-9 3-5-11Zm18-24 12 2 9 10-5 4-9-3-5 4-6-6Z" fill="#a4d7b2"/>
    ${stars.map(star => starMarkup(star.letter, star.center)).join('')}
    <text class="ld-note" x="380" y="214" text-anchor="middle">Bølgelengde i ro · 550 nm</text>
    </svg>
  </div>
  <aside class="model-panel" aria-label="Bølgelengder målt ved jorda">
    <div class="ld-controls">
      ${stars.map(starReadout).join('')}
    </div>
  </aside>
  <div class="model-footer">
    <p class="model-note">Fargene viser retningen på forskyvningen. Forskjellen i bølgelengde er forstørret i tegningen. Begge bølgene brer seg med lysfarten.</p>
  </div>
</div>`;

export function mountLightDoppler(root, api) {
  const node = id => root.querySelector('#' + id);
  const scene = node('ld-scene');
  if (!scene) return () => {};
  const figures = stars.map(star => ({
    ...star,
    figure: node('ld-star-' + star.letter),
    wave: node('ld-wave-' + star.letter),
    spacing: diagramWavelength(star.velocity)
  }));

  function draw(time) {
    const drift = (time % 15) / 15 - .5;
    for (const star of figures) {
      const x = star.center + 70 * drift;
      star.figure.setAttribute('transform', `translate(${x} 125)`);
      const start = x - star.side * 24;
      const end = 380 + star.side * 33;
      star.wave.setAttribute('d', wavePath(start, end, star.spacing, time));
    }
  }

  const removeFrame = api.onFrame(draw, scene);
  return () => removeFrame?.();
}
