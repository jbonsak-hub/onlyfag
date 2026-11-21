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
.ld-photoelectric{margin-top:26px}
.ld-photoelectric .ld-photo-model{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(215px,1fr);align-items:center;gap:15px;width:100%;max-width:none;padding:14px}
.ld-photo-model svg{display:block;width:100%;height:auto;min-height:0;max-height:none;margin:0}
.ld-photo-controls{display:grid;gap:10px}.ld-photo-controls label{display:grid;font-size:13px;font-weight:650;gap:5px}
.ld-photo-controls select{min-width:0;width:100%;padding:7px;border-radius:6px;border:1px solid var(--line);background:var(--surface);color:var(--ink)}
.ld-photo-controls output{color:var(--muted);font-weight:400}
.ld-photo-controls p{margin:0;padding:8px;background:var(--green-soft);border-radius:6px}
.ld-photo-insight{margin-top:12px}
@media(max-width:660px){.ld-photoelectric .ld-photo-model{grid-template-columns:1fr}}
</style>`;


const photoelectricColors = [
  {label:'Rødt lys',nm:650,color:'#fb8f84'},
  {label:'Grønt lys',nm:530,color:'#9fe3ab'},
  {label:'Fiolett lys',nm:405,color:'#c4a8ff'},
  {label:'Ultrafiolett',nm:320,color:'#9ba8ff'}
];

const photoelectricHtml = `<div class="ld-photoelectric">
  <h3>Fotoelektrisk effekt</h3>
  <p>Kan du få elektroner ut av metallplata med rødt lys? Øk intensiteten og se hva som skjer. Prøv så fiolett lys med lav intensitet.</p>
  <div class="model ld-photo-model" data-model-layout="custom">
    <svg id="ld-photo-scene" viewBox="0 0 600 210" role="img" aria-label="Lys treffer en metallplate. Når fotonene har nok energi, slipper elektroner ut.">
      <rect width="600" height="210" rx="10" fill="#121b30"/>
      <path d="M68 71L279 143M292 139L538 64" stroke="#a1b2d5" stroke-dasharray="4 8" opacity=".35"/>
      <rect x="43" y="51" width="22" height="34" rx="5" transform="rotate(16 54 68)" fill="#a8b6d6"/>
      <rect x="167" y="142" width="232" height="22" rx="4" fill="#63748e" stroke="#bcc9e1" stroke-width="3"/>
      <g id="ld-photo-photons"></g>
      <g id="ld-photo-electrons"></g>
      <g fill="#e1e6fa" text-anchor="middle" font-size="20" font-weight="650">
        <text x="135" y="38">Innkommende fotoner</text>
        <text x="287" y="185">Metallplate</text>
        <text x="456" y="38">Frigjorte elektroner</text>
      </g>
    </svg>
    <div class="ld-photo-controls">
      <label>Type lys <select id="ld-photo-wavelength">${photoelectricColors.map(({label,nm},i)=>'<option value="'+i+'">'+label+' · '+nm+' nm</option>').join('')}</select></label>
      <label>Lysintensitet <output id="ld-photo-intensity-output" for="ld-photo-intensity">Svak</output><input id="ld-photo-intensity" type="range" min="1" max="5" value="1"></label>
      <p id="ld-photo-result" role="status"></p>
    </div>
  </div>
  <p class="ld-photo-insight">For å løsne et elektron må ett foton overføre nok energi til det. Høyere frekvens betyr mer energi per foton. For metallplata i modellen er grensen omtrent 500 nm. Når bølgelengden er kort nok, gir sterkere lys flere frigjorte elektroner fordi flere fotoner treffer plata hvert sekund.</p>
</div>`;

function mountPhotoelectric(root){
  const get=id=>root.querySelector('#ld-photo-'+id);
  const wavelength=get('wavelength'),intensity=get('intensity');
  const electrons=get('electrons'),photons=get('photons'),result=get('result');
  const thresholdNm = 500;
  function draw(){
    const {nm,color}=photoelectricColors[Number(wavelength.value)];
    const brightness=Number(intensity.value);
    const canRelease=nm<=thresholdNm;
    get('intensity-output').textContent=['Svak','Ganske svak','Middels','Ganske sterk','Sterk'][brightness-1];
    photons.innerHTML=Array.from({length:brightness*2},(_,i)=>{
      const fraction=i/(brightness*2);
      const x=92+fraction*178, y=80+fraction*57+((i%3)-1)*6;
      return `<path d="M${x-10} ${y}h8" stroke="${color}" stroke-width="2" opacity=".55"/><circle cx="${x}" cy="${y}" r="4" fill="${color}"/>`;
    }).join('');
    electrons.innerHTML=canRelease?Array.from({length:brightness},(_,i)=>{
      const x=343+i*40,y=105+[6,8,-10,-15,-24][i];
      return `<path d="M${x-30} ${y+10}l20 -9" stroke="#94def3" stroke-width="2" opacity=".6"/><circle cx="${x}" cy="${y}" r="9" fill="#a4e4f4"/><path d="M${x-4} ${y}h8" stroke="#15354c" stroke-width="2"/>`;
    }).join(''):'';
    result.textContent=canRelease?'Elektroner frigjøres.':'Ingen elektroner frigjøres.';
    get('scene').dataset.emits=String(canRelease);
  }
  wavelength.addEventListener('change',draw);
  intensity.addEventListener('input',draw);
  draw();
}

export const lightDualitySection = {
  title: 'Lys: bølger eller partikler?',
  body: `${styles}
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
    <a class="ld-interference-link" href="/naturfag#waves/fenomener/fagstoff/interferens" target="_top">Utforsk hvordan bølgene forsterker og svekker hverandre i interferensmodellen</a>
    ${photoelectricHtml}`
};

export function mountLightDuality(root, api) {
  mountPhotoelectric(root);
  const detector = root.querySelector('#ld-detector');
  if (!detector) return;
  const context = detector.getContext('2d');
  if (!context) return;
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
    one.removeEventListener('click', launchOne);
    many.removeEventListener('click', launchMany);
    reset.removeEventListener('click', clear);
    removeFrame?.();
  };
}
