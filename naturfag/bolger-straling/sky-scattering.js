const wavelengths = [650, 550, 450];
const air = {x: 475, y: 180, radius: 490, depth: 65};
const sunsetSeconds = 12;
const degrees = new Intl.NumberFormat('nb-NO', {maximumFractionDigits: 1});

export function skyScatteringState(elevation) {
  const angle = elevation * Math.PI / 180;
  // Kasten–Young air mass and an approximate molecular optical depth at 550 nm.
  const airMass = 1 / (Math.sin(angle) + .50572 * (elevation + 6.07995) ** -1.6364);
  const direct = wavelengths.map(nm => Math.exp(-airMass * .097 * (550 / nm) ** 4));
  return {angle, direct};
}

const styles = `<style>
.sky-launch{display:flex;justify-content:space-between;align-items:center;gap:14px;width:100%;margin:17px 0 0;padding:13px 16px;border:1px solid var(--green);border-radius:10px;background:var(--green-soft);color:var(--green);font:inherit;font-weight:700;text-align:left;cursor:pointer}
.sky-launch:hover{background:var(--surface)}
.sky-launch span:last-child{font-size:1.1em}
dialog.sky-dialog{box-sizing:border-box;width:min(1090px,calc(100% - 24px));max-width:none;max-height:calc(100dvh - 24px);padding:clamp(12px,2.5vw,24px);border:1px solid var(--line);border-radius:16px;color:var(--ink);background:var(--surface);overflow:auto}
.sky-dialog::backdrop{background:#172f2bb8;backdrop-filter:blur(3px)}
.sky-header{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}
.sky-dialog .sky-header h2{margin:0;font-size:clamp(17px,2.6vw,23px);line-height:1.3}
.sky-close,.sky-play{background:var(--surface);border:1px solid var(--line);border-radius:8px;color:var(--ink);font:inherit;font-weight:650;min-height:40px;padding:6px 12px;cursor:pointer}
.sky-close{font-size:23px;line-height:1;width:40px;padding:0;flex:none}
.sky-play:hover,.sky-close:hover{background:var(--green-soft)}
.sky-launch:focus-visible,.sky-dialog button:focus-visible{outline:2px solid var(--green);outline-offset:3px}
.sky-controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px;margin:0 0 15px}
.sky-slider{flex:1 1 250px;display:grid;gap:5px;font-weight:650}
.sky-slider-label{display:flex;justify-content:space-between;gap:8px}
.sky-slider output{font-variant-numeric:tabular-nums}
.sky-slider input{width:100%;margin:0;min-height:20px;accent-color:var(--green)}
.sky-grid,.sky-explanation{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.sky-grid .sky-ray-model.model{margin:0;padding:0;max-width:none;border:0;box-shadow:none;background:none}
.sky-grid figure{min-width:0;margin:0}
.sky-grid figure svg{display:block;width:100%;height:auto;border-radius:10px}
.sky-grid figcaption{margin:6px 0 0;color:var(--muted);font-size:.85rem}
.sky-legend{display:flex;flex-wrap:wrap;gap:3px 15px;margin-top:6px;color:var(--muted);font-size:.85rem}
.sky-legend span::before{content:'';display:inline-block;width:13px;margin:0 5px 3px 0;border-top:3px solid #ad5816}
.sky-legend span+span::before{border-top:3px dashed #1f68b6}
.sky-explanation{margin-top:14px}
.sky-dialog .sky-explanation p{margin:0;padding:10px 12px;border-radius:8px;background:var(--green-soft);font-size:.91rem;line-height:1.5}
.sky-guides{fill:none;stroke:#68bdfd;stroke-width:2;stroke-dasharray:4 5;stroke-linecap:round}
@media(max-width:700px){.sky-grid,.sky-explanation{grid-template-columns:1fr}}
</style>`;

export const skyScatteringHtml = `
<button type="button" id="sky-open" class="sky-launch" aria-haspopup="dialog" aria-controls="sky-dialog" aria-expanded="false">
  <span>Hvorfor er himmelen blå og solnedgangen rød?</span><span aria-hidden="true">↗</span>
</button>
<dialog id="sky-dialog" class="sky-dialog" aria-labelledby="sky-title">
  <div class="sky-header">
    <h2 id="sky-title">Hvorfor er himmelen blå og solnedgangen rød?</h2>
    <button type="button" id="sky-close" class="sky-close" aria-label="Lukk animasjonen" autofocus>×</button>
  </div>
  <div class="sky-controls">
    <label class="sky-slider" for="sky-elevation">
      <span class="sky-slider-label"><span>Høyde over horisonten</span><output id="sky-angle" for="sky-elevation">60°</output></span>
      <input type="range" id="sky-elevation" min="0" max="90" step="0.1" value="60">
    </label>
    <button type="button" id="sky-play" class="sky-play">Spill av solnedgangen</button>
  </div>
  <div class="sky-grid">
    <figure>
      <svg id="sky-view" viewBox="0 0 520 256" role="img" aria-label="Sola og himmelen sett fra bakken. Sola blir rødere når den nærmer seg horisonten.">
        <defs>
          <linearGradient id="sky-color" x2="0" y2="1">
            <stop id="sky-zenith" stop-color="#1558a2"/><stop id="sky-horizon" offset="1" stop-color="#94d1e9"/>
          </linearGradient>
          <radialGradient id="sky-glow">
            <stop id="sky-glow-color" stop-color="#fff0b9" stop-opacity=".65"/><stop offset="1" stop-color="#ffd399" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="sky-water" x2="0" y2="1"><stop id="sky-reflection" stop-color="#b1d2d2"/><stop offset="1" stop-color="#112e45"/></linearGradient>
        </defs>
        <rect width="520" height="256" fill="url(#sky-color)"/>
        <g id="sky-sun"><ellipse rx="125" ry="85" fill="url(#sky-glow)"/><circle id="sky-disc" r="15" fill="#fff9e2"/></g>
        <path id="sky-hills" d="M0 205l46-14 32 6 33-16 25-24 21 11 27-5 34 26 31 15 31-4 40 5 29-6 24 6 35-2 30 7 82-2v48H0Z" fill="#43657f"/>
        <path d="M0 221Q150 218 218 224T520 223V256H0Z" fill="url(#sky-water)"/>
        <path d="M0 234l55-14 44 5 40 15 36 16H0zm520-19-37 9-36 1-67 31h140z" fill="#1b384a"/>
      </svg>
      <figcaption>Slik ser det ut fra bakken.</figcaption>
    </figure>
    <figure class="model sky-ray-model" data-model-layout="custom">
      <div class="model-visual"><svg id="sky-paths" viewBox="0 0 520 256" role="img" aria-label="Direkte sollys går gjennom luftlaget til observatøren. Blått lys spres i flere retninger, også mot observatøren fra andre deler av himmelen.">
        <defs>
          <linearGradient id="sky-atmosphere" x2="0" y2="1"><stop stop-color="#2e405f"/><stop offset="1" stop-color="#416b94"/></linearGradient>
          <linearGradient id="sky-direct-color" gradientUnits="userSpaceOnUse"><stop stop-color="#fffde9"/><stop id="sky-direct-end" offset="1" stop-color="#fff1b0"/></linearGradient>
        </defs>
        <rect width="520" height="256" fill="#141f38"/>
        <circle cx="475" cy="670" r="555" fill="url(#sky-atmosphere)" stroke="#6c8aad" stroke-width="1.2"/>
        <circle cx="475" cy="670" r="490" fill="#214139" stroke="#92b391" stroke-width="2"/>
        <text id="sky-source-label" fill="#f0f4fa" text-anchor="end" font-size="17" font-weight="650">Fra sola</text>
        <text x="29" y="205" fill="#dde9f3" font-size="16">Atmosfæren</text>
        <path d="M120 201h25l58 10" fill="none" stroke="#91afc9" stroke-width="1.1"/>
        <line id="sky-beam-in" stroke="#fffde9" stroke-width="3" stroke-linecap="round"/>
        <line id="sky-beam-direct" stroke="url(#sky-direct-color)" stroke-width="3.5" stroke-linecap="round"/>
        <line id="sky-other-in" stroke="#fffde9" stroke-width="2" opacity=".65" stroke-linecap="round"/>
        <g class="sky-guides">
          <path id="sky-scattered-toward" d="M377 151L472 178"/>
          <path id="sky-scattered-up" d="M377 151L362 125"/>
          <path id="sky-scattered-side" d="M377 151L333 177"/>
        </g>
        <circle id="sky-scatter-point" cx="377" cy="151" r="3" fill="#d5ecff"/>
        <circle id="sky-direct-pulse" r="4" fill="#fff1b0"/>
        <g fill="#9bd9ff">
          <circle class="sky-dot" r="2.8"/><circle class="sky-dot" r="2.6"/><circle class="sky-dot" r="2.6"/>
        </g>
        <circle cx="475" cy="180" r="5" fill="#eff9f1" stroke="#112e2d" stroke-width="1.5"/>
        <text x="475" y="205" fill="#eff9f1" text-anchor="middle" font-size="16">Du</text>
      </svg></div>
      <div class="sky-legend" aria-hidden="true"><span>Direkte sollys</span><span>Spredt lys</span></div>
      <figcaption>Lysveier gjennom atmosfæren. Forenklet figur.</figcaption>
    </figure>
  </div>
  <div class="sky-explanation">
    <p><strong>Blå himmel.</strong> Luftmolekyler sender lys i nye retninger. Det kalles <strong>spredning</strong>. Blått lys spres lettere enn rødt. Noe av det blå lyset når øynene dine fra andre deler av himmelen.</p>
    <p><strong>Rød solnedgang.</strong> Når sola står lavt, går det direkte sollyset gjennom mer luft. Mer av det blå lyset spres ut til sidene. Da dominerer rødt og oransje i lyset som kommer rett fra sola.</p>
  </div>
</dialog>
${styles}`;

function color(channels) {
  return 'rgb(' + channels.map(Math.round).join(',') + ')';
}

function mix(from, to, fraction) {
  return from.map((value, index) => value + (to[index] - value) * fraction);
}

export function mountSkyScattering(root, api) {
  const q = id => root.querySelector('#sky-' + id);
  const dialog = q('dialog');
  if (!dialog) return;
  const open = q('open'), close = q('close'), play = q('play'), slider = q('elevation');
  const paths = q('paths');
  const angleLabel = q('angle'), sun = q('sun'), disc = q('disc'), glow = q('glow-color');
  const zenith = q('zenith'), horizon = q('horizon'), reflection = q('reflection'), hills = q('hills');
  const directGradient = q('direct-color'), directEnd = q('direct-end');
  const beamIn = q('beam-in'), beamDirect = q('beam-direct'), otherIn = q('other-in');
  const scatterPoint = q('scatter-point'), directPulse = q('direct-pulse'), sourceLabel = q('source-label');
  const dots = [...paths.querySelectorAll('.sky-dot')];
  const branches = ['toward', 'up', 'side'].map(name => q('scattered-' + name));
  const observer = [air.x, air.y];
  let playbackStart = null;
  let playbackElevation = 60;
  let lightPath, scatter, scatterEnds, lightColor;

  function place(element, x, y) {
    element.setAttribute('cx', x);
    element.setAttribute('cy', y);
  }

  function line(element, from, to) {
    element.setAttribute('x1', from[0]);
    element.setAttribute('y1', from[1]);
    element.setAttribute('x2', to[0]);
    element.setAttribute('y2', to[1]);
  }

  function entryFor(origin, direction) {
    const dx = origin[0] - air.x;
    const dy = origin[1] - air.y - air.radius;
    const projection = dx * direction[0] + dy * direction[1];
    const radius = air.radius + air.depth;
    const distance = -projection + Math.sqrt(projection ** 2 + radius ** 2 - dx ** 2 - dy ** 2);
    return origin.map((value, i) => value + direction[i] * distance);
  }

  function render(elevation) {
    const {angle, direct} = skyScatteringState(elevation);
    const dusk = Math.exp(-elevation / 9);
    const [red, green, blue] = direct;
    lightColor = color([255, 255 * (green / red) ** .6, 255 * (blue / red) ** .6]);
    const sunX = 350 + elevation * 1.4;
    const sunY = 198 - 176 * Math.sin(angle);
    sun.setAttribute('transform', `translate(${sunX} ${sunY})`);
    disc.setAttribute('fill', lightColor);
    glow.setAttribute('stop-color', lightColor);
    zenith.setAttribute('stop-color', color(mix([27, 107, 189], [33, 50, 109], dusk)));
    horizon.setAttribute('stop-color', color(mix([170, 215, 233], [236, 143, 108], dusk)));
    reflection.setAttribute('stop-color', color(mix([121, 167, 180], [132, 92, 101], dusk)));
    hills.setAttribute('fill', color(mix([76, 123, 150], [55, 57, 87], dusk)));
    angleLabel.textContent = degrees.format(elevation) + '°';
    slider.setAttribute('aria-valuetext', degrees.format(elevation) + ' grader');

    const direction = [-Math.cos(angle), -Math.sin(angle)];
    const entry = entryFor(observer, direction);
    const incoming = entry.map((value, i) => value + 44 * direction[i]);
    lightPath = [incoming, observer];
    line(beamIn, incoming, entry);
    sourceLabel.setAttribute('x', incoming[0] - 9);
    sourceLabel.setAttribute('y', incoming[1] - 8);
    line(beamDirect, entry, observer);
    line(directGradient, entry, observer);
    directEnd.setAttribute('stop-color', lightColor);

    // A parallel ray illustrates light reaching the eye after changing direction.
    scatter = [377 - Math.sin(angle) * 61, 151 - Math.cos(angle) * 19];
    scatterEnds = [observer, [scatter[0] - 15, scatter[1] - 23], [scatter[0] - 32, scatter[1] + 23]];
    line(otherIn, entryFor(scatter, direction), scatter);
    place(scatterPoint, ...scatter);
    branches.forEach((branch, i) => branch.setAttribute('d', `M${scatter.join(' ')}L${scatterEnds[i].join(' ')}`));
  }

  function resetPlayback() {
    playbackStart = null;
    play.textContent = 'Spill av solnedgangen';
  }

  function frame(time) {
    if (playbackStart !== null) {
      const fraction = Math.min(1, Math.max(0, (time - playbackStart) / sunsetSeconds));
      slider.value = Math.round(playbackElevation * (1 - fraction) ** 1.6 * 10) / 10;
      render(Number(slider.value));
      if (fraction === 1) resetPlayback();
    }
    const phase = (time * .72) % 1;
    place(directPulse, ...mix(...lightPath, phase));
    directPulse.setAttribute('fill', phase < .2 ? '#fffde9' : lightColor);
    dots.forEach((dot, i) => place(dot, ...mix(scatter, scatterEnds[i], (time * 1.15 + i / 3) % 1)));
  }

  open.addEventListener('click', () => {
    dialog.showModal();
    open.setAttribute('aria-expanded', 'true');
    api.repaint(paths);
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    resetPlayback();
    open.setAttribute('aria-expanded', 'false');
    if (open.isConnected) open.focus();
  });
  slider.addEventListener('input', () => {
    resetPlayback();
    render(Number(slider.value));
    api.repaint(paths);
  });
  play.addEventListener('click', () => {
    if (playbackStart !== null) {
      resetPlayback();
      return;
    }
    playbackElevation = Number(slider.value) <= 1 ? 60 : Number(slider.value);
    playbackStart = api.now(paths);
    play.textContent = 'Stans solnedgangen';
    api.play(paths);
  });
  render(Number(slider.value));
  api.onFrame(frame, paths);
  return () => { if (dialog.open) dialog.close(); };
}
