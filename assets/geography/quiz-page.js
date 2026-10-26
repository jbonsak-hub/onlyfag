(function () {
  const mode = document.body.dataset.quiz;
  document.querySelector('.quiz-page-theme').addEventListener('click', () => {
    const dark = !document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode', dark);
    if(typeof window.scheduleCountryMapDraw==='function')window.scheduleCountryMapDraw();
    try { localStorage.setItem('geoDarkMode', dark ? '1' : '0'); } catch (_) {}
    document.getElementById('maplab-frame')?.contentWindow.postMessage({type:'maplab-control', dark}, location.origin);
  });
  const mapModes = ['globle','travle','tradle','geogrid'];
  if (mapModes.includes(mode)) {
    document.body.classList.add('maplab-open', 'standalone-map-quiz');
    try { document.body.classList.toggle('dark-mode', localStorage.getItem('geoDarkMode') === '1'); } catch (_) {}
    const frame = document.getElementById('maplab-frame');
    frame.addEventListener('load', () => frame.contentWindow.postMessage({type:'maplab-control', tab:mode, dark:document.body.classList.contains('dark-mode')}, location.origin));
    return;
  }
  // These are the same public reference data and storage keys used before extraction.
  window.getWorldData = function () { return window.GEO_QUIZ_DATA; };
  // Jeopardy uses quiz-specific capitals and the same reference-table rows.
  window.getLandRows = function () { return GEO_QUIZ_DATA.landRows; };
  window.getPlaceRowsByHeading = function (heading) { return GEO_QUIZ_DATA.places.filter(row => row.category === heading); };
  const start = window.showQuizMode;
  window.exitQuizMode = function () { location.assign('../geografi.html#verden-quiz'); };
  window.showContent = function (id) { location.assign('../geografi.html#' + encodeURIComponent(id)); };
  window.showQuizMode = function (next, btn) {
    if (next !== mode && GEO_QUIZ_ROUTES[next]) return location.assign('../' + GEO_QUIZ_ROUTES[next][0]);
    return start(next, btn);
  };
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('welcome').style.display = 'none';
    start(mode, null);
  });
})();
