const burstSize = 500;
const launchDelay = .34;
const burstInterval = .011;
const clipEdges = .07;

function intensityAt(position) {
  // Fraunhofer pattern for two identical rectangular slits of finite width.
  const envelopeAngle = Math.PI * position / 1.1;
  const envelope = envelopeAngle === 0 ? 1 : Math.sin(envelopeAngle) / envelopeAngle;
  const fringes = Math.cos(Math.PI * position / .36);
  return (envelope * fringes) ** 2;
}

function sampleHorizontalPosition() {
  for (;;) {
    const position = 2 * Math.random() - 1;
    if (Math.random() < intensityAt(position)) {
      return clipEdges + (1 - 2 * clipEdges) * (position + 1) / 2;
    }
  }
}

const wavefronts = [24, 47, 70, 93, 116, 139, 162]
  .map(radius => [69, 113].map(center =>
    '<circle cx="159" cy="' + center + '" r="' + radius + '"/>'
  ).join('')).join('');

const diagram = `<svg class="ld-diagram" viewBox="0 0 340 164" role="img" aria-labelledby="ld-optics-title ld-optics-description">
  <title id="ld-optics-title">Dobbeltspalteforsøket sett ovenfra</title>
  <desc id="ld-optics-description">Lyskilden til venstre sender lys mot to åpninger i en skjerm. Bølgefrontene fra de to åpningene brer seg og overlapper før lyset treffer detektoren på høyre side.</desc>
  <defs>
    <linearGradient id="ld-diagram-background" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop stop-color="#101a32"/><stop offset="1" stop-color="#16162f"/>
    </linearGradient>
    <clipPath id="ld-fronts-clip"><rect x="160" y="32" width="149" height="117"/></clipPath>
    <linearGradient id="ld-wavefront-color"><stop stop-color="#d4d0ff"/><stop offset="1" stop-color="#9777f2" stop-opacity=".45"/></linearGradient>
    <radialGradient id="ld-source-light"><stop stop-color="#d8caff"/><stop offset="1" stop-color="#9f88ef" stop-opacity="0"/></radialGradient>
  </defs>
  <rect x="0" y="0" width="340" height="164" rx="9" fill="url(#ld-diagram-background)"/>
  <path d="M12 47H328M12 73H328M12 99H328M12 125H328M53 36V148M107 36V148M215 36V148M269 36V148"
    stroke="#8291bb" stroke-width=".7" opacity=".135"/>
  <g fill="#e1e6fa" font-size="13" text-anchor="middle" font-weight="650">
    <text x="44" y="23">Lyskilde</text>
    <text x="159" y="23">To spalter</text>
    <text x="302" y="23">Skjerm</text>
  </g>
  <path d="M44 53H156V128H44Z" fill="#b9a0ff" fill-opacity=".09"/>
  <path d="M73 54v73m21-73v73m21-73v73m21-73v73" fill="none" stroke="#a991f8" stroke-width="1.1" opacity=".65"/>
  <rect x="25" y="74" width="24" height="33" rx="4" fill="#394471" stroke="#a6a4cc"/>
  <path d="M46 78v25" stroke="#d8caff" stroke-width="3" stroke-linecap="round"/>
  <circle id="ld-source-flash" cx="47" cy="90.5" r="22" fill="url(#ld-source-light)" opacity="0"/>
  <g fill="none" stroke="url(#ld-wavefront-color)" stroke-width="1.2" clip-path="url(#ld-fronts-clip)" opacity=".8">${wavefronts}</g>
  <path d="M159 37v26m0 12v32m0 12v26" stroke="#d9d9eb" stroke-width="6" stroke-linecap="round"/>
  <path d="M307 37v108" stroke="#c9e1da" stroke-width="5" stroke-linecap="round"/>
</svg>`;

const styles = `<style>
.ld-model.model{display:block;width:100%;max-width:none;padding:16px;margin:16px 0 0}
.ld-scenes{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}
.ld-scenes figure{min-width:0;margin:0}
.ld-scenes figcaption{font-size:.88rem;font-weight:700;color:var(--ink);margin:0 0 8px}
.model.ld-model svg.ld-diagram{display:block;width:100%;height:auto;min-height:0;max-height:none;margin:0}
.ld-detector{position:relative;aspect-ratio:340/164;isolation:isolate;border-radius:9px;overflow:hidden;background:radial-gradient(ellipse at center,#222342,#10182b 74%);box-shadow:inset 0 0 0 1px #b5add229}
.ld-detector canvas{width:100%;height:100%;display:block}
.ld-flash{position:absolute;width:22px;height:22px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,#fff 0 6%,#e0e0ffa9 10%,#ae90f554 28%,transparent 70%);pointer-events:none;opacity:0}
.ld-controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:13px 0 0}
.ld-controls button{padding:6px 11px;min-height:36px;font-size:.88rem}
.ld-count{margin:0 0 0 auto;color:var(--ink);font-size:.88rem;font-variant-numeric:tabular-nums}
.ld-model .animation-surface>.animation-toolbar{top:0;right:0}
.ld-explanation{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:16px}
.ld-explanation p{margin:0;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:var(--surface);line-height:1.55}
@media(max-width:620px){.ld-scenes,.ld-explanation{grid-template-columns:1fr}.ld-model.model{padding:12px}.ld-controls{gap:7px}.ld-controls button{min-height:44px}.ld-count{margin-left:0}}

.ld-interference-link{display:inline-block;margin-top:12px;font-weight:700;color:var(--green)}

.ld-more{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:0 15px}
.ld-more summary{cursor:pointer;padding:13px 2px;color:var(--green);font-weight:700;font-size:14px}
.ld-more summary:focus-visible{outline-offset:0}
.ld-more-body{padding:0 2px 15px}
.ld-more-body h3{font-size:1.15rem;margin:7px 0 8px}
.ld-more-body .ld-pe-heading{margin-top:24px}
.ld-pe-model.model{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(195px,1fr);align-items:center;gap:16px;width:100%;max-width:none;padding:14px;margin:14px 0}
.model.ld-pe-model #ld-pe-scene{display:block;width:100%;height:auto;min-height:0;max-height:none;margin:0}
.ld-pe-controls{display:grid;gap:9px;min-width:0}
.ld-pe-controls label{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:4px 9px;font-weight:650}
.ld-pe-controls select,.ld-pe-controls input{grid-column:1/-1;width:100%;min-width:0}
.ld-pe-controls select{padding:6px;border:1px solid var(--line);border-radius:7px;color:var(--ink);background:var(--surface);font-size:.93rem}
.ld-pe-controls output{font-size:.86rem;color:var(--muted);font-weight:500}
.ld-pe-controls button{min-height:36px;justify-self:start}
.ld-pe-controls p{margin:0}
.ld-pe-controls #ld-pe-result{color:var(--muted);font-size:.92rem}
.ld-pe-count{font-size:.92rem;font-variant-numeric:tabular-nums}
.ld-pe-model .animation-surface>.animation-toolbar{top:0;right:0}
@media(max-width:750px){.ld-pe-model.model{grid-template-columns:1fr;gap:12px}.ld-pe-controls button{min-height:44px}.ld-more{padding:0 9px}}
</style>`;

const thresholdNm = 500;
const photonTravelTime = .72;
const flashDuration = 1.6;
const wavelengths = [
  {nm: 650, name: 'Rødt', color: '#ff9b91'},
  {nm: 530, name: 'Grønt', color: '#a8e6ba'},
  {nm: thresholdNm, name: 'Blågrønt', color: '#9ee6df'},
  {nm: 440, name: 'Blått', color: '#9ebdff'},
  {nm: 405, name: 'Fiolett', color: '#d0b4ff'},
  {nm: 320, name: 'Ultrafiolett', color: '#b9b4ff'}
];

const photoelectric = `<h3 class="ld-pe-heading">Fotoelektrisk effekt</h3>
  <p>Prøv sterkt rødt lys på metallplata. Bytt så til svakt fiolett lys. Når løsner det elektroner?</p>
  <div class="model ld-pe-model" data-model-layout="custom">
    <svg id="ld-pe-scene" viewBox="0 0 590 195" role="img" aria-labelledby="ld-pe-title ld-pe-desc">
      <title id="ld-pe-title">Lys mot en metallplate</title>
      <desc id="ld-pe-desc">Fotoner treffer oversiden av plata skrått fra venstre. Frigjorte elektroner beveger seg skrått opp mot høyre.</desc>
      <defs>
        <linearGradient id="ld-pe-bg" x2="1" y2="1">
          <stop stop-color="#181b36"/><stop offset="1" stop-color="#16243b"/>
        </linearGradient>
        <linearGradient id="ld-pe-metal" x2="0" y2="1">
          <stop stop-color="#98aac5"/><stop offset="1" stop-color="#3d4e69"/>
        </linearGradient>
        <pattern id="ld-pe-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0V28" fill="none" stroke="#b4c4e3" stroke-opacity=".09"/>
        </pattern>
        <marker id="ld-pe-arrow" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0 0 6 3 0 6Z" fill="#adb9d1"/>
        </marker>
      </defs>
      <rect width="590" height="195" rx="10" fill="url(#ld-pe-bg)"/>
      <rect width="590" height="195" rx="10" fill="url(#ld-pe-grid)"/>
      <path id="ld-pe-beam" d="M72 62 229 135" stroke="#ff9b91" stroke-width="12" stroke-opacity=".15" stroke-linecap="round"/>
      <path d="M102 77 216 130M260 133 404 63" fill="none" stroke="#adb9d1" stroke-opacity=".6" stroke-width="1.5" stroke-dasharray="4 6" marker-end="url(#ld-pe-arrow)"/>
      <rect x="45" y="45" width="31" height="24" rx="5" transform="rotate(26 60 57)" fill="#4d5d83" stroke="#a5b7db"/>
      <path id="ld-pe-lamp" d="M75 52 67 70" stroke="#ff9b91" stroke-width="3" stroke-linecap="round"/>
      <path d="M153 142H389l30 12v13H153Z" fill="url(#ld-pe-metal)" stroke="#91a7c2"/>
      <path d="M153 142H389l30 12H153Z" fill="#91a8cc" opacity=".76"/>
      <g id="ld-pe-photons" aria-hidden="true"></g>
      <g id="ld-pe-electrons" aria-hidden="true"></g>
      <g text-anchor="middle" font-weight="650">
        <text x="124" y="30" font-size="20" fill="#e5eaff">Fotoner</text>
        <text x="447" y="30" font-size="20" fill="#bdf2fa">Elektroner</text>
        <text x="285" y="186" font-size="18" fill="#e5eaff">Metallplate</text>
      </g>
    </svg>
    <div class="ld-pe-controls">
      <label for="ld-pe-wavelength">Bølgelengde<select id="ld-pe-wavelength">${wavelengths.map(({nm, name}) =>
        `<option value="${nm}">${name} lys · ${nm} nm</option>`
      ).join('')}</select></label>
      <label for="ld-pe-intensity">Lysintensitet <output id="ld-pe-intensity-value" for="ld-pe-intensity">1 av 5</output>
        <input id="ld-pe-intensity" type="range" min="1" max="5" value="1">
      </label>
      <button id="ld-pe-run" type="button">Belys metallplata</button>
      <p id="ld-pe-result" role="status">Grensebølgelengde for metallet i modellen er ${thresholdNm} nm.</p>
      <p class="ld-pe-count"><strong id="ld-pe-count">0</strong> <span id="ld-pe-count-label">elektroner frigjort</span></p>
    </div>
  </div>
  <p class="ld-pe-insight">Kortere bølgelengde gir mer energi per foton. Når et foton river løs et elektron, blir energien som er til overs, elektronets bevegelsesenergi. Ved samme bølgelengde gir sterkere lys flere fotoner per sekund. Da kan flere elektroner frigjøres.</p>`;

function mountPhotoelectric(root, api) {
  const scene = root.querySelector('#ld-pe-scene');
  if (!scene) return;
  const wavelength = root.querySelector('#ld-pe-wavelength');
  const intensity = root.querySelector('#ld-pe-intensity');
  const intensityValue = root.querySelector('#ld-pe-intensity-value');
  const beam = scene.querySelector('#ld-pe-beam');
  const lamp = scene.querySelector('#ld-pe-lamp');
  const photons = scene.querySelector('#ld-pe-photons');
  const electrons = scene.querySelector('#ld-pe-electrons');
  const result = root.querySelector('#ld-pe-result');
  const count = root.querySelector('#ld-pe-count');
  const countLabel = root.querySelector('#ld-pe-count-label');
  const launch = root.querySelector('#ld-pe-run');
  const initialResult = result.textContent;
  let trial;
  let previousCount = 0;

  function showCount(value) {
    if (value === previousCount) return;
    count.textContent = String(value);
    countLabel.textContent = value === 1 ? 'elektron frigjort' : 'elektroner frigjort';
    previousCount = value;
  }

  function draw(time) {
    if (!trial) return;
    const {start, nm, color, photonCount, speed} = trial;
    const elapsed = time - start;
    const canRelease = nm <= thresholdNm;
    const light = [];
    const emitted = [];
    let arrivals = 0;
    for (let i = 0; i < photonCount; i++) {
      const age = elapsed - i * flashDuration / photonCount;
      if (age < 0) continue;
      const hitX = 225 + (i % 5) * 7;
      const hitY = 140;
      if (age < photonTravelTime) {
        const progress = age / photonTravelTime;
        const x = 73 + (hitX - 73) * progress;
        const y = 62 + (hitY - 62) * progress;
        light.push(`<circle cx="${x}" cy="${y}" r="8" fill="${color}" opacity=".22"/><circle cx="${x}" cy="${y}" r="4.1" fill="${color}"/>`);
        continue;
      }
      arrivals++;
      if (!canRelease) continue;
      const travel = speed * (age - photonTravelTime);
      const x = hitX + travel;
      const y = hitY - 8 - (.45 + i % 5 * .1) * travel;
      if (y < 37 || x > 576) continue;
      emitted.push(`<g transform="translate(${x} ${y})"><circle r="7" fill="#a4e8f4"/><path d="M-3 0h6" stroke="#123c54" stroke-width="1.8"/></g>`);
    }
    photons.innerHTML = light.join('');
    electrons.innerHTML = emitted.join('');
    showCount(canRelease ? arrivals : 0);
    if (arrivals !== photonCount) return;
    const message = !canRelease ? 'Fotonene har for lite energi til å rive løs elektroner.'
      : speed === 0 ? 'Ved terskelen kan elektronene akkurat løsne. Farten etterpå er null.'
      : 'Fotonene har nok energi til å rive løs elektroner.';
    if (result.textContent !== message) result.textContent = message;
    if (elapsed >= flashDuration + photonTravelTime + 2.6) trial = undefined;
  }

  function changeSettings() {
    const {color} = wavelengths.find(option => option.nm === Number(wavelength.value));
    beam.setAttribute('stroke', color);
    lamp.setAttribute('stroke', color);
    intensityValue.textContent = intensity.value + ' av 5';
    trial = undefined;
    photons.innerHTML = '';
    electrons.innerHTML = '';
    result.textContent = initialResult;
    showCount(0);
  }

  function shine() {
    const {nm, color} = wavelengths.find(option => option.nm === Number(wavelength.value));
    // Nonrelativistic speed scales with the square root of the kinetic energy.
    const speed = 4200 * Math.sqrt(Math.max(0, 1 / nm - 1 / thresholdNm));
    trial = {start: api.now(scene), nm, color, photonCount: 2 * Number(intensity.value), speed};
    showCount(0);
    result.textContent = 'Lys treffer plata.';
    api.play(scene);
  }

  wavelength.addEventListener('change', changeSettings);
  intensity.addEventListener('input', changeSettings);
  launch.addEventListener('click', shine);
  const removeFrame = api.onFrame(draw, scene);
  return () => {
    wavelength.removeEventListener('change', changeSettings);
    intensity.removeEventListener('input', changeSettings);
    launch.removeEventListener('click', shine);
    removeFrame?.();
  };
}

export const lightDualitySection = {
  title: 'Lys – bølger eller partikler?',
  body: `${styles}
    <details class="ld-more">
    <summary>Hvis du vil vite mer</summary>
    <div class="ld-more-body">
    <h3>Interferens med enkeltfotoner</h3>
    <p>Slipp ett foton gjennom dobbeltspalten. Slipp så mange på rad og se hvor treffene samler seg på skjermen til høyre.</p>
    <div class="model ld-model" data-model-layout="custom">
      <div class="ld-scenes">
        <figure><figcaption>Forsøket sett ovenfra</figcaption>${diagram}</figure>
        <figure><figcaption>Skjermen sett forfra</figcaption>
          <div class="ld-detector">
            <canvas id="ld-detector" width="680" height="328" role="img" aria-label="Registrerte fotontreff på skjermen">Registrerte fotontreff bygger opp et interferensmønster.</canvas>
            <span class="ld-flash" aria-hidden="true"></span>
          </div>
        </figure>
      </div>
      <div class="ld-controls">
        <button type="button" id="ld-one">Slipp ett foton</button>
        <button type="button" id="ld-many" class="secondary">Slipp 500 fotoner</button>
        <button type="button" id="ld-reset" class="text-button">Nullstill</button>
        <p class="ld-count"><strong id="ld-count">0</strong> <span id="ld-count-label">registrerte fotoner</span></p>
        <span id="ld-status" class="sr-only" role="status"></span>
      </div>
    </div>
    <div class="ld-explanation">
      <p><strong>Prikkene.</strong> Hver prikk er stedet der ett foton traff skjermen. Hvor det neste fotonet treffer, er tilfeldig. Vi kan forutsi hvilke områder som får flest treff over tid.</p>
      <p><strong>Mange treff.</strong> I de lyse stripene treffer fotonene oftere. Der forsterker bølgene fra de to spaltene hverandre. I de mørke stripene svekker bølgene hverandre, og det blir få eller ingen treff.</p>
    </div>
    <a class="ld-interference-link" href="/naturfag#waves/fenomener/fagstoff/to-spalter" target="_top">Utforsk hvordan bølgene forsterker og svekker hverandre i interferensmodellen</a>
    ${photoelectric}
    </div>
    </details>`
};

export function mountLightDuality(root, api) {
  const removePhotoelectric = mountPhotoelectric(root, api);
  const detector = root.querySelector('#ld-detector');
  if (!detector) return removePhotoelectric;
  const context = detector.getContext('2d');
  if (!context) return removePhotoelectric;
  const model = detector.closest('.ld-model');
  const sourceFlash = model.querySelector('#ld-source-flash');
  const flash = model.querySelector('.ld-flash');
  const one = model.querySelector('#ld-one');
  const many = model.querySelector('#ld-many');
  const reset = model.querySelector('#ld-reset');
  const countDisplay = model.querySelector('#ld-count');
  const countLabel = model.querySelector('#ld-count-label');
  const status = model.querySelector('#ld-status');
  const numberFormat = new Intl.NumberFormat('nb-NO');
  let count = 0;
  let remaining = 0;
  let nextHit = 0;
  let lastLaunch = -Infinity;
  let lastHit = -Infinity;
  let drawingGlow = false;

  function updateCount() {
    countDisplay.textContent = numberFormat.format(count);
    countLabel.textContent = count === 1 ? 'registrert foton' : 'registrerte fotoner';
  }

  function recordHit(time) {
    const x = sampleHorizontalPosition();
    const y = clipEdges + Math.random() * (1 - 2 * clipEdges);
    context.globalCompositeOperation = 'lighter';
    context.fillStyle = '#c9b7ffb8';
    context.beginPath();
    context.arc(x * detector.width, y * detector.height, 2.4, 0, 2 * Math.PI);
    context.fill();
    flash.style.left = (100 * x) + '%';
    flash.style.top = (100 * y) + '%';
    lastHit = time;
    count++;
  }

  function frame(time) {
    if (time >= nextHit && remaining > 0) {
      do {
        recordHit(nextHit);
        remaining--;
        nextHit += burstInterval;
      } while (remaining > 0 && time >= nextHit);
      updateCount();
      if (remaining === 0) {
        one.disabled = many.disabled = false;
        status.textContent = count === 1 ? 'Ett foton registrert.' : numberFormat.format(count) + ' fotoner registrert.';
      }
    }
    if (!drawingGlow) return;
    const sourceOpacity = Math.max(0, 1 - (time - lastLaunch) / .22);
    const hitOpacity = Math.max(0, 1 - (time - lastHit) / .30);
    sourceFlash.setAttribute('opacity', String(sourceOpacity));
    flash.style.opacity = String(hitOpacity);
    drawingGlow = remaining > 0 || sourceOpacity > 0 || hitOpacity > 0;
  }

  function launch(amount) {
    remaining = amount;
    lastLaunch = api.now(detector);
    nextHit = lastLaunch + launchDelay;
    drawingGlow = true;
    one.disabled = many.disabled = true;
    status.textContent = '';
    api.play(detector);
  }

  function launchOne() { launch(1); }
  function launchMany() { launch(burstSize); }

  function clear() {
    context.clearRect(0, 0, detector.width, detector.height);
    count = remaining = 0;
    lastLaunch = lastHit = -Infinity;
    one.disabled = many.disabled = false;
    drawingGlow = true;
    updateCount();
    status.textContent = 'Skjermen er tømt.';
    api.repaint(detector);
  }

  one.addEventListener('click', launchOne);
  many.addEventListener('click', launchMany);
  reset.addEventListener('click', clear);
  const removeFrame = api.onFrame(frame, detector);
  return () => {
    removePhotoelectric?.();
    one.removeEventListener('click', launchOne);
    many.removeEventListener('click', launchMany);
    reset.removeEventListener('click', clear);
    removeFrame?.();
  };
}

