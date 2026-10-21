/* Shared presentation only. Existing game engines, IDs and storage stay intact. */
(() => {
  const mode = document.body.dataset.quiz;
  if (!mode) return;
  const header = document.querySelector('.quiz-page-header');
  const menu = header.querySelector('.quiz-page-menu');
  const theme = header.querySelector('.quiz-page-theme');
  const back = header.querySelector('.quiz-page-back');
  const cssUrl = document.querySelector('link[data-quiz-layout]').href;
  const brand = document.createElement('a');
  brand.className = 'quiz-home'; brand.href = '../index.html'; brand.textContent = 'OnlyFag';
  header.prepend(brand);
  menu.classList.add('quiz-floating-menu'); document.body.append(menu);
  back.textContent = '← Quizoversikt';
  const footer = document.createElement('div'); footer.className = 'quiz-layout-footer'; footer.append(back);
  const rail = document.createElement('aside'); rail.className = 'quiz-control-rail';
  rail.append(header, footer); document.body.append(rail);
  // Map-only host documents do not load core.js, so provide the same drawer actions.
  menu.setAttribute('aria-label', 'Åpne eller lukk geografimenyen');
  menu.setAttribute('aria-expanded', 'false');
  window.toggleQuizSidebar = () => {
    const open = document.body.classList.toggle('sidebar-open');
    menu.setAttribute('aria-expanded', String(open));
  };
  if (typeof window.toggleMenu !== 'function') window.toggleMenu = el => el.nextElementSibling.classList.toggle('open');
  document.addEventListener('keydown', e => { if (e.key === 'Escape') {document.body.classList.remove('sidebar-open'); menu.setAttribute('aria-expanded', 'false');} });
  document.querySelector('.sidebar').addEventListener('click', e => {
    if (e.target.closest('.submenu-item')) document.body.classList.remove('sidebar-open');
  });
  const mapModes = ['globle','travle','tradle','geogrid'];
  function frameLayout(frame) {
    const doc = frame.contentDocument;
    if (!doc || doc.querySelector('[data-quiz-layout-style]')) return;
    const side = doc.querySelector('.' + mode + '-side');
    if (!side) return; // The frame may still be its initial about:blank document.
    doc.body.dataset.quizLayout = mode;
    const style = doc.createElement('link'); style.rel = 'stylesheet'; style.href = cssUrl; style.dataset.quizLayoutStyle = '';
    const nav = doc.createElement('div'); nav.className = 'quiz-frame-nav';
    const home = doc.createElement('a'); home.className = 'quiz-home'; home.href = '../../index.html'; home.target = '_top'; home.textContent = 'OnlyFag';
    const toggle = doc.createElement('button'); toggle.type = 'button'; toggle.textContent = '◐'; toggle.className = 'quiz-page-theme'; toggle.setAttribute('aria-label','Lys eller mørk modus');
    toggle.addEventListener('click', () => theme.click()); nav.append(home, toggle);
    side.prepend(nav);
    const end = doc.createElement('div'); end.className = 'quiz-layout-footer';
    const overview = doc.createElement('a'); overview.className = 'quiz-page-back'; overview.href = '../../geografi.html#verden-quiz'; overview.target = '_top'; overview.textContent = '← Quizoversikt'; end.append(overview); side.append(end);
    // Keep long help text available without pushing the game below the viewport.
    side.querySelectorAll('.geo-distance-note,.geogrid-score-note').forEach(note => {
      const details = doc.createElement('details'); details.className = 'quiz-help';
      const summary = doc.createElement('summary'); summary.textContent = 'Slik fungerer det';
      note.before(details); details.append(summary, note);
    });
    const resize = () => frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('resize'));
    style.addEventListener('load', resize); doc.head.append(style);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(frame);
  }
  if (mapModes.includes(mode)) {
    document.body.classList.add('quiz-frame-host');
    const frame = document.getElementById('maplab-frame');
    frame.addEventListener('load', () => frameLayout(frame));
    if (frame.contentDocument?.readyState === 'complete') frameLayout(frame);
    return;
  }
  function update() {
    // Keep status inside the engine's own app so a restart removes it atomically.
    document.querySelectorAll('.world-game').forEach(game => {
      const status = game.querySelector(':scope > .world-statusbar');
      if (status) {
        const panel = document.createElement('aside'); panel.className = 'quiz-status-panel';
        game.append(panel); panel.append(status);
      }
    });
    let target = document.querySelector('.worldle-side,.geo-hud,.country-map-side,.country-map-bottom-bar,.quiz-status-panel');
    if (mode === 'jeopardy') target = document.querySelector('#jeopardy-shell.playing .jeopardy-side');
    document.body.classList.toggle('quiz-integrated-nav', !!target);
    if (target) {
      if (header.parentElement !== target) target.prepend(header);
      if (footer.parentElement !== target) target.append(footer);
      rail.hidden = true;
      if (mode === 'geoguessr') {
        const exit = document.querySelector('.geo-map-exit');
        if (exit && exit.parentElement !== target) target.insertBefore(exit, footer);
      }
    } else {
      rail.hidden = false;
      if (header.parentElement !== rail) rail.prepend(header);
      if (footer.parentElement !== rail) rail.append(footer);
    }
  }
  const content = document.querySelector('main.content');
  new MutationObserver(update).observe(content, {childList:true,subtree:true});
  update();
})();
