import {emTopic} from './em-spectrum.js?v=20261123-lambda';
import {startCourse} from './app.js?v=20261123-lambda';
import {topics as basicTopics} from './wave-basics.js?v=20261118-resonans1';
import {topics as waveTopics} from './waves.js?v=20261122-spredning1';
const params=new URLSearchParams(location.search);
const topic=['bolger','fenomener','em'].includes(params.get('topic'))?params.get('topic'):'bolger';
const view=['fagstoff','oppgaver','begreper'].includes(params.get('view'))?params.get('view'):'fagstoff';
const anchor=params.get('section');
const section=topic==='fenomener'&&view==='fagstoff'&&['interferens','to-spalter'].includes(anchor)?'/'+anchor:'';
if(params.get('embedded')!=='1'){location.replace('../naturfag#waves/'+topic+'/'+view+section);}else{
 history.replaceState(null,'','#'+topic+'/'+view+section);
 startCourse([...basicTopics,...waveTopics,emTopic],{embedded:true});
}
