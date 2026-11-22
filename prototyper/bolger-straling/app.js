import {startCourse} from '../../naturfag/bolger-straling/app.js?v=20261122-spredning1';
import {topics as basicTopics} from '../../naturfag/bolger-straling/wave-basics.js?v=20261118-resonans1';
import {topics as waveTopics} from '../../naturfag/bolger-straling/waves.js?v=20261122-spredning1';
import {topics as emTopics} from './em-atoms.js?v=20261122-spekter2';
import {topics as radioTopics} from './radioactivity.js?v=20261116-naturfag2';
import {topics as cosmosTopics} from './cosmos-environment.js?v=20261116-naturfag2';
function redirectPublishedSpectrum() {
  const [topic, view] = location.hash.slice(1).split('/');
  if (topic !== 'em') return false;
  const safeView = ['fagstoff', 'oppgaver', 'begreper'].includes(view) ? view : 'fagstoff';
  location.replace('../naturfag#waves/em/' + safeView);
  return true;
}

if (!redirectPublishedSpectrum()) {
  addEventListener('hashchange', redirectPublishedSpectrum);
  startCourse([...basicTopics,...waveTopics,...emTopics,...radioTopics,...cosmosTopics],{prototype:true});
}
