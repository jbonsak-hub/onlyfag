import {startCourse} from '../../naturfag/bolger-straling/app.js?v=20261123-lambda';
import {topics as basicTopics} from '../../naturfag/bolger-straling/wave-basics.js?v=20261125-atom-release';
import {topics as waveTopics} from '../../naturfag/bolger-straling/waves.js?v=20261125-atom-release';
import {topics as commTopics} from './communication.js?v=20261125-atom-release';
import {topics as radioTopics} from './radioactivity.js?v=20261116-naturfag2';
import {topics as cosmosTopics} from './cosmos-environment.js?v=20261116-naturfag2';
function redirectPublishedTopic() {
  const [topic, view] = location.hash.slice(1).split('/');
  if (topic !== 'em' && topic !== 'atomer') return false;
  const safeView = ['fagstoff', 'oppgaver', 'begreper'].includes(view) ? view : 'fagstoff';
  location.replace('../naturfag#waves/' + topic + '/' + safeView);
  return true;
}

if (!redirectPublishedTopic()) {
  addEventListener('hashchange', redirectPublishedTopic);
  startCourse([...basicTopics,...waveTopics,...commTopics,...radioTopics,...cosmosTopics],{prototype:true});
}
