/* Routing is limited to known content IDs. Never interpret arbitrary code/URLs. */
(function () {
  const routes = window.GEO_QUIZ_ROUTES;
  const mapTabs = ['projection','coordinates','coordinatequiz','routes','antipodes','scale','terrain','daynight'];
  const spaceTabs = ['system','seasons','milankovitch'];
  const aliases = {wordle:'detective2',worldle:'detective2',geowiz:'geoguessr',mapwiz:'geoguessr',flaggquiz:'flags'};
  function quizKey(value) { const key = value.replace(/^quiz-/, ''); return aliases[key] || key; }
  window.showQuizMode = function (mode) { if (routes[mode]) location.assign(routes[mode][0]); };
  window.openMapLabFromGeoQuiz = function (mode) { if (routes[mode]) location.assign(routes[mode][0]); };
  const showMap = window.showMapLab;
  window.showMapLab = function (mode, item) {
    if (routes[mode]) return location.assign(routes[mode][0]);
    return showMap(mode, item);
  };
  function openLink() {
    const params = new URLSearchParams(location.search);
    const raw = location.hash.slice(1) || params.get('quiz') || params.get('mode') || params.get('tab') || params.get('section') || '';
    if (raw === 'verden-landformer') { window.__onlyfagRedirecting = true; location.replace('/geografi/mapwiz-steder.html'); return; }
    const mode = quizKey(raw);
    if (routes[mode]) { window.__onlyfagRedirecting = true; location.replace(routes[mode][0]); return; }
    if (mapTabs.includes(raw)) { showMapLab(raw, null); return; }
    if (spaceTabs.includes(raw)) { openGeoSpaceLab(raw, null); return; }
    const section = document.getElementById(raw);
    if (section && section.classList.contains('page-section')) {
      const item = [...document.querySelectorAll('.submenu-item')].find(el => (el.getAttribute('onclick') || '').includes("'" + raw + "'"));
      showContent(raw, item);
      if (item) { item.parentElement.classList.add('open'); item.parentElement.previousElementSibling?.classList.add('active'); }
      if (raw === 'demografi-pyramider') initPopulationPyramids();
    }
  }
  addEventListener('hashchange', openLink);
  openLink();
})();
