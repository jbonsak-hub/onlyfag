/* Quizlab creator: private capabilities stay in the fragment and this browser. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const API = (window.QUIZLAB_API || window.GEO_SCORE_API).replace(/\/$/, '');
  const STORAGE = 'onlyfag-quizlab-owned-v1';
  const PENDING = 'onlyfag-quizlab-pending-v1';
  const modeLabels = {accuracy:'Høyest riktigprosent', correct:'Flest riktige på tid', fixed:'Et fast antall spørsmål'};
  let modules = [], editing = null, busy = false;
  const selected = new Map([['flags', {}], ['capitals', {}]]);
  let pending = null;
  try {const p = JSON.parse(localStorage.getItem(PENDING) || 'null'); if (/^[a-f0-9]{64}$/.test(p?.key) && /^quiz[a-z0-9-]{1,32}$/.test(p?.config?.slug)) pending = p;} catch {}
  function creationKey(config) {
    const key = pending?.config.slug === config.slug ? pending.key : Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('');
    pending = {key, config};
    try {localStorage.setItem(PENDING, JSON.stringify(pending));} catch {}
    return key;
  }
  const saved = () => { try {const value = JSON.parse(localStorage.getItem(STORAGE) || '[]'); return Array.isArray(value) ? value.filter(q => /^quiz[a-z0-9-]{1,32}$/.test(q.slug) && /^[a-f0-9]{64}$/.test(q.key)) : [];} catch {return [];} };
  function remember(quiz, key) {
    const list = saved().filter(q => q.slug !== quiz.slug);
    list.unshift({slug:quiz.slug, title:quiz.title, version:quiz.version, key});
    try {localStorage.setItem(STORAGE, JSON.stringify(list.slice(0, 100)));} catch { $('page-status').textContent = 'Nettleseren kunne ikke huske lenken. Kopier administrasjonslenken og ta vare på den.'; }
    renderSaved();
  }
  function adminURL(slug, key) {return location.origin + '/jobb/quizlab.html#quiz=' + encodeURIComponent(slug) + '&key=' + encodeURIComponent(key);}
  function element(tag, text, className) {const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node;}
  function mode() {return document.querySelector('input[name="mode"]:checked').value;}
  function configuration() {
    return {slug:$('quiz-slug').value.trim().toLowerCase(), title:$('quiz-title').value.trim(), mode:mode(), minutes:mode() === 'fixed' ? 5 : Number($('minutes').value), questionCount:mode() === 'fixed' ? Number($('question-count').value) : 30, secondsPerQuestion:Number($('question-seconds').value), categories:modules.filter(m => selected.has(m.id)).map(m => ({id:m.id, ...(m.id === 'mapwiz' ? {difficulty:selected.get(m.id).difficulty || 'easy'} : {})}))};
  }
  function updateSummary() {
    const cfg = configuration(), fixed = cfg.mode === 'fixed', n = cfg.categories.length;
    $('minutes-field').hidden = fixed; $('minutes').disabled = fixed;
    $('count-field').hidden = !fixed; $('question-count').disabled = !fixed;
    $('question-count').min = Math.max(1, n);
    $('selected-count').textContent = n + ' valgt'; $('summary-mode').textContent = modeLabels[cfg.mode];
    $('summary-settings').textContent = (fixed ? cfg.questionCount + ' spørsmål' : cfg.minutes + ' minutter') + ' · ' + cfg.secondsPerQuestion + ' sekunder per spørsmål';
    const list = $('summary-categories'); list.replaceChildren();
    for (const c of cfg.categories) {
      const m = modules.find(m => m.id === c.id), level = {easy:'Normal',medium:'Vanskelig',hard:'Hjerterå'}[c.difficulty];
      list.append(element('li', m.title + (level ? ' · ' + level : '')));
    }
    if (!n) list.append(element('li', 'Velg minst én kategori'));
    $('grouping-description').textContent = fixed ? 'Spørsmålene fordeles så jevnt som mulig. Oppgaver fra samme kategori kommer samlet.' : n ? 'Du får ' + Math.ceil(10 * cfg.minutes / n) + ' spørsmål på rad fra hver kategori før quizen bytter. Kategorien fortsetter med nye spørsmål når alle blokkene er gjennomført.' : 'Velg kategorier for å se hvor mange spørsmål som kommer på rad.';
  }
  function renderCategories() {
    const query = $('category-search').value.trim().toLocaleLowerCase('nb'), container = $('categories'); container.replaceChildren();
    const groups = new Map();
    for (const m of modules.filter(m => (m.title + ' ' + m.group).toLocaleLowerCase('nb').includes(query))) {
      if (!groups.has(m.group)) groups.set(m.group, []); groups.get(m.group).push(m);
    }
    for (const [name, entries] of groups) {
      const group = element('div', undefined, 'category-group'); group.append(element('h3', name));
      const grid = element('div', undefined, 'category-grid');
      for (const m of entries) {
        const card = element('label', undefined, 'category-card'), check = document.createElement('input');
        check.type = 'checkbox'; check.value = m.id; check.name = 'category'; check.checked = selected.has(m.id);
        const content = element('span', undefined, 'category-content'); content.append(element('strong', m.title));
        content.append(element('small', (m.count || m.poolSize || '') + ' mulige oppgaver · ' + (m.type === 'location' ? 'Finn stedet på kartet' : ['map', 'target', 'map-target'].includes(m.type) ? 'Klikk på kartet' : 'Flervalg')));
        check.addEventListener('change', () => {if (check.checked) selected.set(m.id, m.id === 'mapwiz' ? {difficulty:content.querySelector('select').value} : {}); else selected.delete(m.id); updateSummary();});
        if (m.id === 'mapwiz') {
          const levels = document.createElement('select'); levels.id = 'mapwiz-difficulty'; levels.setAttribute('aria-label', 'Vanskelighetsgrad for MapWiz');
          for (const [value, label] of [['easy','Normal'],['medium','Vanskelig'],['hard','Hjerterå']]) {const option = element('option', label); option.value = value; levels.append(option);}
          levels.value = selected.get(m.id)?.difficulty || 'easy';
          levels.addEventListener('click', e => e.stopPropagation());
          levels.addEventListener('change', () => {selected.set(m.id, {difficulty:levels.value}); check.checked = true; updateSummary();}); content.append(levels);
        }
        card.append(check, content); grid.append(card);
      }
      group.append(grid); container.append(group);
    }
    $('no-categories').hidden = groups.size > 0;
  }
  function renderSaved() {
    const container = $('saved-quizzes'); container.replaceChildren();
    for (const quiz of saved()) {
      const row = element('div', undefined, 'saved-card'), details = element('div'); details.append(element('strong', quiz.title), element('small', '/' + quiz.slug));
      const links = element('div', undefined, 'saved-actions'), play = element('a', 'Elevlenke'), admin = element('a', 'Administrer');
      play.href = '/quiz/?id=' + encodeURIComponent(quiz.slug); play.target = '_blank'; play.rel = 'noopener noreferrer'; admin.href = adminURL(quiz.slug, quiz.key);
      admin.addEventListener('click', e => {e.preventDefault(); const nextHash = new URL(admin.href).hash; if (location.hash === nextHash) loadAdmin(); else location.hash = nextHash;}); links.append(play, admin); row.append(details, links); container.append(row);
    }
    if (!container.children.length) container.append(element('p', 'Du har ikke lagret noen quizer i denne nettleseren ennå.', 'hint'));
  }
  async function api(path, data, key) {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(API + '/quizlab' + path, {method:data === undefined ? 'GET' : 'POST', headers:{...(data === undefined ? {} : {'Content-Type':'application/json'}), ...(key ? {Authorization:'Bearer ' + key} : {})}, ...(data === undefined ? {} : {body:JSON.stringify(data)}), signal:controller.signal});
      const value = await response.json(); if (!response.ok) throw Error(value.error || 'unavailable'); return value;
    } finally {clearTimeout(timeout);}
  }
  const messages = {slug_taken:'Adressen er allerede i bruk. Velg en annen kortadresse.', quiz_exists:'Adressen er allerede i bruk. Velg en annen kortadresse.', not_found:'Fant ikke quizen. Kontroller administrasjonslenken.', unauthorized:'Administrasjonslenken er ugyldig. Bruk den private lenken du fikk da quizen ble opprettet.', invalid_config:'Kontroller oppsettet. Velg minst én kategori og gyldig tid eller antall spørsmål.', stale_version:'Quizen er endret i en annen fane. Åpne administrasjonslenken på nytt før du lagrer.', version_changed:'Quizen er endret i en annen fane. Åpne administrasjonslenken på nytt før du lagrer.', invalid_slug:'Bruk «quiz» og 1–32 små bokstaver, tall eller bindestreker. Avslutt med en bokstav eller et tall.', too_few_questions:'Velg minst ett spørsmål per kategori.', invalid_title:'Gi quizen et navn på inntil 100 tegn.', version_conflict:'Quizen er endret i en annen fane. Åpne administrasjonslenken på nytt før du lagrer.', rate_limited:'Mange forespørsler akkurat nå. Prøv igjen om litt.'};
  function showError(error) {$('form-error').textContent = messages[error.message] || 'Kunne ikke lagre quizen. Kontroller nettforbindelsen og prøv igjen.'; $('form-error').hidden = false;}
  function showResult(quiz, key) {
    $('student-link').value = location.origin + '/' + quiz.slug;
    $('open-quiz').href = '/quiz/?id=' + encodeURIComponent(quiz.slug);
    $('admin-link').value = adminURL(quiz.slug, key);
    $('result-title').textContent = editing ? 'Endringene er lagret' : 'Quizen er klar';
    $('result-description').textContent = quiz.title + '. ' + (editing ? 'Den samme elevlenken åpner nå den nye versjonen med en egen resultatliste.' : 'Del elevlenken med klassen. Highscore-listen fylles når elevene gjennomfører quizen.');
    $('share-result').hidden = false; document.querySelector('.lab-layout').hidden = true;
    $('share-result').focus(); $('share-result').scrollIntoView({block:'start', behavior:'smooth'});
  }
  async function loadAdmin() {
    const hash = new URLSearchParams(location.hash.slice(1)), slug = hash.get('quiz'), key = hash.get('key');
    if (!slug || !key) return;
    if (!/^quiz[a-z0-9-]{1,32}$/.test(slug) || !/^[a-f0-9]{64}$/.test(key)) {$('page-status').textContent = 'Administrasjonslenken er ugyldig.'; return;}
    $('page-status').textContent = 'Laster quizen …';
    try {
      const {quiz} = await api('/quizzes/' + encodeURIComponent(slug), undefined, key);
      editing = {slug, key, version:quiz.version};
      $('quiz-title').value = quiz.title; $('quiz-slug').value = slug; $('quiz-slug').readOnly = true;
      document.querySelector('input[name="mode"][value="' + quiz.mode + '"]').checked = true;
      $('minutes').value = quiz.minutes || 5; $('question-count').value = quiz.questionCount || 30; $('question-seconds').value = quiz.secondsPerQuestion;
      selected.clear(); for (const c of quiz.categories) selected.set(c.id, c);
      renderCategories(); updateSummary(); remember(quiz, key);
      $('create-quiz').textContent = 'Lagre ny versjon →'; $('page-status').textContent = 'Du redigerer «' + quiz.title + '». Lagring oppretter en ny versjon med egen highscore-liste. Elevenes lenke er den samme.';
      $('share-result').hidden = true; document.querySelector('.lab-layout').hidden = false;
    } catch (error) {$('page-status').textContent = messages[error.message] || 'Kunne ikke hente quizen. Prøv igjen når du har nettforbindelse.';}
  }
  $('quiz-builder').addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    $('form-error').hidden = true;
    const cfg = configuration();
    if (!cfg.categories.length || (cfg.mode === 'fixed' && cfg.questionCount < cfg.categories.length)) {showError(Error('invalid_config')); return;}
    busy = true; $('create-quiz').disabled = true; $('create-quiz').textContent = 'Lagrer …';
    try {
      const draftKey = editing ? null : creationKey(cfg);
      let result;
      try {result = await api(editing ? '/quizzes/' + editing.slug : '/quizzes', {...cfg, ...(editing ? {version:editing.version} : {adminToken:draftKey})}, editing?.key);}
      catch (error) {
        if (editing || error.message !== 'slug_taken') throw error;
        // A lost creation response must not lose the private key or create a second quiz.
        try {result = {...await api('/quizzes/' + cfg.slug, undefined, draftKey), adminToken:draftKey}; $('page-status').textContent = 'Quizen var allerede opprettet. Bruk administrasjonslenken for å gjøre flere endringer.';} catch {throw error;}
      }
      const key = editing?.key || result.adminToken;
      remember(result.quiz, key); showResult(result.quiz, key);
      if (!editing) {pending = null; try {localStorage.removeItem(PENDING);} catch {}}
      if (editing) editing.version = result.quiz.version;
      history.replaceState(null, '', adminURL(result.quiz.slug, key));
    } catch (error) {showError(error);} finally {busy = false; $('create-quiz').disabled = false; $('create-quiz').textContent = editing ? 'Lagre ny versjon →' : 'Opprett quiz →';}
  });
  for (const id of ['copy-student','copy-admin']) $(id).addEventListener('click', async () => {
    const input = $(id === 'copy-student' ? 'student-link' : 'admin-link');
    try {await navigator.clipboard.writeText(input.value); $(id).textContent = 'Kopiert'; setTimeout(() => $(id).textContent = 'Kopier', 2000);} catch {input.select(); $('page-status').textContent = 'Lenken er markert. Kopier den med tastaturet eller menyen på enheten.';}
  });
  $('select-none').addEventListener('click', () => {selected.clear(); renderCategories(); updateSummary();});
  $('category-search').addEventListener('input', renderCategories);
  $('quiz-builder').addEventListener('input', updateSummary);
  $('quiz-builder').addEventListener('change', updateSummary);
  $('new-quiz').addEventListener('click', () => {editing = null; history.replaceState(null, '', location.pathname); $('quiz-slug').readOnly = false; $('quiz-slug').value = 'quiz' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 5); $('create-quiz').textContent = 'Opprett quiz →'; $('share-result').hidden = true; document.querySelector('.lab-layout').hidden = false; $('page-status').textContent = ''; $('quiz-title').focus();});
  addEventListener('hashchange', loadAdmin);
  $('quiz-slug').value = 'quiz' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 5);
  renderSaved();
  (async () => {
    try {
      const response = await fetch('/assets/quizlab/catalog.json'); if (!response.ok) throw Error('catalog');
      const catalog = await response.json();
      modules = (catalog.categories || catalog.modules).map(m => ({...m, title:m.title || m.label, group:m.group || 'Geografi', count:m.count || m.poolSize}));
      if (pending && !location.hash) {
        const cfg = pending.config;
        $('quiz-title').value = cfg.title; $('quiz-slug').value = cfg.slug;
        const radio = document.querySelector('input[name="mode"][value="' + (['accuracy','correct','fixed'].includes(cfg.mode) ? cfg.mode : 'accuracy') + '"]'); radio.checked = true;
        $('minutes').value = cfg.minutes; $('question-count').value = cfg.questionCount; $('question-seconds').value = cfg.secondsPerQuestion;
        selected.clear(); for (const c of cfg.categories || []) if (modules.some(m => m.id === c.id)) selected.set(c.id, c);
        $('page-status').textContent = 'Forrige opprettelse ble ikke bekreftet. Oppsettet er gjenopprettet. Klikk «Opprett quiz» for å prøve igjen.';
      }
      renderCategories(); updateSummary(); await loadAdmin();
    } catch {$('categories').textContent = 'Kunne ikke laste kategoriene. Last siden på nytt.'; $('create-quiz').disabled = true;}
  })();
})();
