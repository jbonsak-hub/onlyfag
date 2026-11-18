import {startCourse} from '../../naturfag/bolger-straling/app.js?v=20261118-resonans1';
import {topics as basicTopics} from '../../naturfag/bolger-straling/wave-basics.js?v=20261118-resonans1';
import {topics as waveTopics} from '../../naturfag/bolger-straling/waves.js?v=20261118-resonans1';
import {topics as emTopics} from './em-atoms.js?v=20261116-naturfag2';
import {topics as radioTopics} from './radioactivity.js?v=20261116-naturfag2';
import {topics as cosmosTopics} from './cosmos-environment.js?v=20261116-naturfag2';
startCourse([...basicTopics,...waveTopics,...emTopics,...radioTopics,...cosmosTopics],{prototype:true});
