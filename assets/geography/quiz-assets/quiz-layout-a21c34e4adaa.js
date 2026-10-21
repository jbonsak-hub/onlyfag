/* Shared presentation and navigation. Game engines, IDs and storage stay intact. */
(() => {
  const mode = document.body.dataset.quiz;
  if (!mode) return;
  const header = document.querySelector('.quiz-page-header');
  const menu = header.querySelector('.quiz-page-menu');
  const theme = header.querySelector('.quiz-page-theme');
  const back = header.querySelector('.quiz-page-back');
  const overviewHref=back.getAttribute('href');
  const cssUrl = document.querySelector('link[data-quiz-layout]').href;
  header.prepend(menu);
  header.addEventListener('click', event => event.stopPropagation());
  back.textContent = '← Quizoversikt';
  const setupLabels={flags:'Flaggquiz',capitals:'Hovedstadsquiz',flagcapital:'Flagg/hovedstad'};
  if(setupLabels[mode]){
    const syncBack=()=>{
      const local=!!document.querySelector('.world-game');
      const label=local?'← '+setupLabels[mode]:'← Quizoversikt';
      if(back.textContent!==(window.QuizLanguage?.translate(label)||label))back.textContent=label;
      const href=local?location.pathname+location.search:overviewHref;if(back.getAttribute('href')!==href)back.setAttribute('href',href);
    };
    back.addEventListener('click',event=>{
      if(!document.querySelector('.world-game')||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();initWorldTrainer(mode);window.scrollTo(0,0);document.querySelector('.world-setup .selected')?.focus();
    });
    new MutationObserver(syncBack).observe(document.querySelector('main.content'),{childList:true,subtree:true});
    syncBack();
  }
  const footer = document.createElement('div'); footer.className = 'quiz-layout-footer'; footer.append(back);
  const rail = document.createElement('aside'); rail.className = 'quiz-control-rail';
  rail.append(header, footer); document.body.append(rail);
  // Map-only host documents do not load core.js, so provide the same drawer actions.
  menu.setAttribute('aria-label', 'Åpne eller lukk geografimenyen');
  menu.setAttribute('aria-expanded', 'false');
  const drawer = document.querySelector('.sidebar');
  const closeDrawer = document.createElement('button'); closeDrawer.type = 'button'; closeDrawer.className = 'quiz-drawer-close'; closeDrawer.textContent = 'Lukk ×'; closeDrawer.setAttribute('aria-label','Lukk geografimenyen'); drawer.prepend(closeDrawer);
  const shade = document.createElement('button'); shade.type = 'button'; shade.className = 'quiz-drawer-shade'; shade.setAttribute('aria-label','Lukk geografimenyen'); document.body.append(shade);
  closeDrawer.addEventListener('click', () => window.toggleQuizSidebar());
  shade.addEventListener('click', () => window.toggleQuizSidebar());
  window.toggleQuizSidebar = () => {
    const open = document.body.classList.toggle('sidebar-open');
    menu.setAttribute('aria-expanded', String(open));
    document.querySelectorAll('iframe').forEach(frame => {try{frame.contentDocument?.querySelector('.quiz-frame-nav .quiz-page-menu')?.setAttribute('aria-expanded',String(open));}catch(_){}});
    if (open) closeDrawer.focus();
  };
  if (typeof window.toggleMenu !== 'function') window.toggleMenu = el => el.nextElementSibling.classList.toggle('open');
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) window.toggleQuizSidebar(); });
  document.querySelector('.sidebar').addEventListener('click', e => {
    if (e.target.closest('.submenu-item')) document.body.classList.remove('sidebar-open');
  });
  function collectHelp(container, selector) {
    const notes = [...container.querySelectorAll(selector)].filter(n => !n.closest('.quiz-help'));
    if (!notes.length) return;
    let details = container.querySelector(':scope > .quiz-help');
    if (!details) {
      details = document.createElement('details'); details.className = 'quiz-help';
      const summary = document.createElement('summary'); summary.textContent = 'Slik fungerer det';
      details.append(summary); container.append(details);
    }
    notes.forEach(note => details.append(note));
  }
  if (mode === 'openguessr') {
    document.body.classList.add('quiz-external-host');
    menu.classList.add('quiz-floating-menu'); document.body.append(menu);
    footer.classList.add('quiz-external-overview'); document.body.append(footer);
    rail.remove(); return;
  }
  const mapModes = ['globle','travle','tradle','geogrid'];
  function frameLayout(frame) {
    const doc = frame.contentDocument;
    if (!doc || doc.querySelector('[data-quiz-layout-style]')) return;
    const side = doc.querySelector('.' + mode + '-side');
    if (!side) return; // The frame may still be its initial about:blank document.
    doc.body.dataset.quizLayout = mode;
    const style = doc.createElement('link'); style.rel = 'stylesheet'; style.href = cssUrl; style.dataset.quizLayoutStyle = '';
    const nav = doc.createElement('div'); nav.className = 'quiz-frame-nav';
    const toggle = doc.createElement('button'); toggle.type = 'button'; toggle.textContent = '◐'; toggle.className = 'quiz-page-theme'; toggle.setAttribute('aria-label','Lys eller mørk modus');
    const localMenu = doc.createElement('button'); localMenu.type = 'button'; localMenu.className = 'quiz-page-menu'; localMenu.textContent = '☰ Meny';
    localMenu.setAttribute('aria-label', 'Åpne geografimenyen'); localMenu.addEventListener('click', () => {window.toggleQuizSidebar(); localMenu.setAttribute('aria-expanded', String(document.body.classList.contains('sidebar-open')));});
    doc.addEventListener('keydown', event => {if(event.key === 'Escape'){document.body.classList.remove('sidebar-open');menu.setAttribute('aria-expanded','false');localMenu.setAttribute('aria-expanded','false');}});
    toggle.addEventListener('click', () => theme.click()); nav.append(localMenu, toggle);
    menu.hidden = true;
    side.prepend(nav);
    const end = doc.createElement('div'); end.className = 'quiz-layout-footer';
    const overview = doc.createElement('a'); overview.className = 'quiz-page-back'; overview.href = '../../geografi.html#verden-quiz'; overview.target = '_top'; overview.textContent = '← Quizoversikt'; end.append(overview); side.append(end);
    collectHelp(side, ':scope > p,.geo-distance-note,.geogrid-score-note,.travle-rules');
    // Place every explanation inside one closed section, below the game.
    const help = side.querySelector(':scope > .quiz-help');
    if (help) side.insertBefore(help, end);
    const resize = () => frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('resize'));
    style.addEventListener('load', resize); doc.head.append(style);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(frame);
    window.OnlyfagPanelResize({document:doc});
  }
  if (mapModes.includes(mode)) {
    document.body.classList.add('quiz-frame-host');
    const frame = document.getElementById('maplab-frame');
    frame.addEventListener('load', () => frameLayout(frame));
    if (frame.contentDocument?.readyState === 'complete') frameLayout(frame);
    return;
  }
  const panelResize = window.OnlyfagPanelResize({active:() => !document.body.classList.contains('quiz-mapwiz-playing')});
  function update() {
    document.querySelectorAll('.jeopardy-value.done,.jeopardy-value.used').forEach(cell => {
      if (!cell.hasAttribute('aria-disabled')) {cell.setAttribute('aria-disabled','true');cell.setAttribute('aria-label',cell.textContent.trim()+' poeng, allerede valgt');}
    });
    document.querySelectorAll('.world-setup,.country-region-setup,.geo-guessr-setup,.jeopardy-setup').forEach(setup => {
      collectHelp(setup, ':scope > p,.jeopardy-setup-header > p');
    });
    // Keep status inside the engine's own app so a restart removes it atomically.
    document.querySelectorAll('.world-game').forEach(game => {
      const status = game.querySelector(':scope > .world-statusbar');
      if (status) {
        const panel = document.createElement('aside'); panel.className = 'quiz-status-panel';
        game.append(panel); panel.append(status);
      }
    });
    const stage = mode === 'geoguessr' && document.querySelector('.geo-map-stage');
    document.body.classList.toggle('quiz-mapwiz-playing', !!stage);
    if (stage) {
      document.body.classList.add('quiz-integrated-nav');
      if (header.parentElement !== stage) stage.prepend(header);
      if (footer.parentElement !== header) header.append(footer);
      rail.hidden = true;
      panelResize.refresh();
      return;
    }
    let target = document.querySelector('.worldle-side,.geo-hud,.country-map-side,.country-map-bottom-bar,.quiz-status-panel');
    if (mode === 'jeopardy') target = document.querySelector('#jeopardy-shell.playing .jeopardy-side');
    document.body.classList.toggle('quiz-integrated-nav', !!target);
    if (target) {
      if (header.parentElement !== target) target.prepend(header);
      if (target.classList.contains('quiz-status-panel')) {
        const game = target.closest('.world-game');
        game.querySelectorAll('#world-play > .world-end').forEach(result => target.insertBefore(result, footer.parentElement === target ? footer : null));
      }
      if (footer.parentElement !== target) target.append(footer);
      rail.hidden = true;
      if (mode === 'countries') {
        const found = document.querySelector('.country-found-section');
        if (found && found.parentElement !== target) target.insertBefore(found, footer);
        const wrap = document.querySelector('.country-map-wrap');
        if (wrap && !wrap.querySelector('.country-zoom-tip')) {
          const tip = document.createElement('span'); tip.className = 'country-zoom-tip';
          tip.textContent = 'Scroll for å zoome · dra for å flytte'; wrap.append(tip);
        }
      }
      if (mode === 'geoguessr') {
        collectHelp(target, '.geo-hint');
        const help = target.querySelector(':scope > .quiz-help');
        if (help && help.nextElementSibling !== footer) target.insertBefore(help, footer);
      }
      if (mode === 'geoguessr') {
        const exit = document.querySelector('.geo-map-exit');
        if (exit && exit.parentElement !== target) target.insertBefore(exit, footer);
      }
    } else {
      rail.hidden = false;
      if (header.parentElement !== rail) rail.prepend(header);
      if (footer.parentElement !== rail) rail.append(footer);
    }
    panelResize.refresh();
  }
  const content = document.querySelector('main.content');
  new MutationObserver(update).observe(content, {childList:true,subtree:true});
  update();
})();
