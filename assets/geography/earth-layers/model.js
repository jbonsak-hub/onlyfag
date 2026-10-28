/* Earth layers: hover, touch and keyboard share one compact explanation. */
(() => {
  'use strict';
  const figure = document.getElementById('earth-layers');
  if (!figure) return;
  const layers = {
    crust: ['Jordskorpa', 'Det tynne, faste ytterlaget. Havbunnsskorpa er vanligvis ca. 5–10 km tykk, mens kontinentskorpa er ca. 30–70 km.'],
    upper: ['Øvre mantel', 'Fra bunnen av jordskorpa til ca. 660 km dyp. Bergarten er hovedsakelig fast. Den stive toppen inngår i litosfæren; lenger ned ligger den svakere astenosfæren.'],
    lower: ['Nedre mantel', 'Fra ca. 660 til 2 890 km dyp. Bergarten er fast, men varme og høyt trykk gjør at den kan deformeres svært langsomt over lang tid.'],
    outer: ['Ytre kjerne', 'Fra ca. 2 890 til 5 150 km dyp. Her er metallet flytende. Bevegelser i det elektrisk ledende metallet bidrar til jordas magnetfelt.'],
    inner: ['Indre kjerne', 'Fra ca. 5 150 km dyp til jordas sentrum. Det jernrike metallet er fast, selv om det er svært varmt, fordi trykket er så høyt.'],
    lithosphere: ['Litosfæren · den stive plata', 'Jordskorpa og den stive, øverste delen av mantelen danner litosfæren. Den er delt i plater. Tykkelsen varierer mellom havområder og kontinenter.'],
    asthenosphere: ['Astenosfæren · svakere mantel', 'Et svakere område i øvre mantel under litosfæren. Bergarten er hovedsakelig fast, men kan deformeres langsomt. Platene beveger seg over dette laget.']
  };
  const controls = [...figure.querySelectorAll('[data-earth-layer]')];
  const title = figure.querySelector('#earth-layer-name');
  const description = figure.querySelector('#earth-layer-description');
  function select(control) {
    const key = control.dataset.earthLayer;
    if (!Object.hasOwn(layers, key)) return;
    controls.forEach(el => el.setAttribute('aria-pressed', String(el === control)));
    figure.querySelectorAll('[data-earth-outline]').forEach(el => el.classList.toggle('active', el.dataset.earthOutline === key));
    const [name, detail] = layers[key];
    if (title.textContent !== name) title.textContent = name;
    if (description.textContent !== detail) description.textContent = detail;
  }
  controls.forEach((control, index) => {
    control.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') select(control); });
    control.addEventListener('click', () => select(control));
    control.addEventListener('focus', () => select(control));
    control.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(control); return; }
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % controls.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + controls.length - 1) % controls.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = controls.length - 1;
      if (next !== undefined) { event.preventDefault(); controls[next].focus(); }
    });
  });
})();
